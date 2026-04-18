import json
import os
import uuid  # [新增] 用于生成唯一的会话 ID
from typing import Annotated, List, Dict, Any
from typing_extensions import TypedDict

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from langgraph.graph import StateGraph, END, START
from langgraph.graph.message import add_messages
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
#导入 Supabase 客户端
from supabase import create_client, Client

# ==========================================
# 0. 全局加载 ML 模型与 Supabase 数据库
# ==========================================
# --- 填入你刚才保存的 URL 和 KEY ---
SUPABASE_URL = "https://xzflljgbplwshdzhudly.supabase.co"
SUPABASE_KEY = "sb_secret_hzG4sRO5IwSv6qJKNGfrkg_JweQtjsg "

print("⏳ 正在连接 Supabase 数据库...")
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase 数据库连接成功！")
except Exception as e:
    print(f"⚠️ Supabase 连接失败: {e}")
    supabase = None

MODEL_DIR = "./roberta_cbt_scorer_best"
TARGET_COLS = ["焦虑", "悲伤", "生气", "羞愧", "无助", "平静", "轻松"]
NEGATIVE_EMOTIONS = ["焦虑", "悲伤", "生气", "羞愧", "无助"]

print("⏳ 正在全局加载 RoBERTa CBT 情绪打分模型，请稍候...")
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    ml_model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    ml_model.to(device)
    ml_model.eval()  # 切换至推理模式
    print(f"✅ ML 模型加载完毕！(运行在 {device} 上)")
except Exception as e:
    print(f"⚠️ 模型加载失败，请确保 {MODEL_DIR} 目录在当前路径下。错误信息: {e}")
    tokenizer, ml_model = None, None


def predict_emotions(text: str) -> dict:
    if not ml_model or not tokenizer:
        return {col: 0.0 for col in TARGET_COLS}
    inputs = tokenizer(text, return_tensors="pt", max_length=128, truncation=True, padding="max_length")
    inputs = {k: v.to(device) for k, v in inputs.items()}
    with torch.no_grad():
        outputs = ml_model(**inputs)
    scores = (outputs.logits.squeeze().cpu().numpy() * 100.0).clip(0, 100)
    return {col: float(score) for col, score in zip(TARGET_COLS, scores)}


# ==========================================
# 1. 定义状态字典 (CBT State) - 我们的“内存数据库”
# ==========================================
class CBTState(TypedDict):
    session_id: str  # [新增] 数据库主键 ID
    user_id: str  # [新增] 用户 ID
    messages: Annotated[list, add_messages]
    current_stage: str
    event_summary: str
    stage1_raw_texts: str
    emotion_tags: Dict[str, float]
    mood_history: List[Dict[str, Any]]
    evidences: List[Dict]
    resolved_count: int
    retry_counts: Dict[str, int]


# ==========================================
# 2. 定义提取工具 (Tools)
# ==========================================
@tool
def submit_event_summary(summary: str):
    """阶段1工具：当用户把客观事件讲清楚后，调用此工具保存概括事实。"""
    pass


@tool
def submit_emotion_scores(emotions: str):
    """阶段2工具：提取用户的情绪标签及0-100的打分，必须是 JSON 字符串格式。"""
    pass


@tool
def submit_evidence(evidence_summary: str, related_tags: List[str]):
    """阶段3工具：保存【提炼概括后】的客观证据，并将其挂载到一个或多个情绪标签上。"""
    pass


@tool
def finish_stage_3():
    """阶段3工具：当用户表示没有更多证据补充时调用，进入下一阶段。"""
    pass


@tool
def evaluate_reframing(evidence: str, current_tag: str, is_broken: bool):
    """阶段4工具：评估用户的反驳想法是否合理。若合理则is_broken为True，并更新情绪分数。"""
    pass


# ==========================================
# 3. 初始化 LLM
# ==========================================
llm = ChatOpenAI(
    api_key="sk-017e613bf5754e37ac2140e058885b81",
    base_url="https://api.deepseek.com",
    model="deepseek-chat",
    temperature=0.2
)


def get_safe_history(messages, k=6):
    if len(messages) <= k: return messages
    idx = len(messages) - k
    while idx > 0 and messages[idx].type != "human":
        idx -= 1
    return messages[idx:]


# ==========================================
# 4. 定义图节点 (Nodes) - 保持不变
# ==========================================
def node_extract_event(state: CBTState):
    print("\n[Node 1] 正在处理: 提取事件...")
    llm_with_tools = llm.bind_tools([submit_event_summary])
    sys_msg = SystemMessage(
        content="你是专业的CBT治疗师。当前处于【阶段1：提取核心客观事件】。你的唯一任务是获取触发用户负面情绪的“核心客观事实（即发生了什么）”。【严格遵守以下规则】：1. 核心锚点原则：只要用户已经说出了核心冲突或挫折，就说明事实已经足够完善！2. 严禁过度追问：绝对不要像警察一样追问边缘细节。3. 立即触发机制：判断核心事件已出现，立即且仅调用 `submit_event_summary` 工具概括事件（不超过50个纯客观字），绝不回复其他追问！")
    response = llm_with_tools.invoke([sys_msg] + state["messages"][-3:])
    return {"messages": [response]}


def node_analyze_reaction(state: CBTState):
    print("\n[Node 2] 正在处理: 剖析感受与打分...")
    raw_texts = state.get('stage1_raw_texts', '')
    ml_scores = predict_emotions(raw_texts)
    print("\n📊 [阶段二 ML 模型打分结果]:")
    for k, v in ml_scores.items(): print(f"  - {k:<4}: {v:>5.1f} 分")
    extracted_tags = {k: round(v, 1) for k, v in ml_scores.items() if k in NEGATIVE_EMOTIONS and v >= 50}
    if not extracted_tags:
        highest_neg = max(NEGATIVE_EMOTIONS, key=lambda x: ml_scores[x])
        extracted_tags = {highest_neg: round(ml_scores[highest_neg], 1)}
        print(f"  => 未检测到>50分的明显负面情绪，触发兜底，提取最高项: {highest_neg}")
    tags_json = json.dumps(extracted_tags, ensure_ascii=False)
    llm_with_tools = llm.bind_tools([submit_emotion_scores])
    sys_msg = SystemMessage(
        content=f"你是CBT治疗师。当前处于【阶段2：剖析感受】。后台的 ML 情绪雷达已对用户的倾诉进行了精准分析。【必须执行的任务】：1. 请你根据 ML 识别出的情绪（{list(extracted_tags.keys())}），对用户表达深深的共情和理解。2. 你必须且只能调用 `submit_emotion_scores` 工具，将以下 JSON 字符串原封不动地传入：{tags_json}。警告：绝对不要修改上述 JSON 的内容！")
    context = get_safe_history(state["messages"], k=3)
    response = llm_with_tools.invoke([sys_msg] + context)
    return {"messages": [response]}


def node_gather_evidence(state: CBTState):
    print("\n[Node 3] 正在处理: 搜集证据...")
    llm_with_tools = llm.bind_tools([submit_evidence, finish_stage_3])
    current_evidences = [ev["text"] for ev in state.get("evidences", [])]
    valid_tags = list(state.get('emotion_tags', {}).keys())
    sys_msg = SystemMessage(
        content=f"你是一位温暖、包容的CBT治疗师。当前处于【阶段3：搜集客观证据】。【永久记忆：核心背景】客观事件：{state['event_summary']} 用户最初的完整倾诉：{state.get('stage1_raw_texts', '')} 确诊负面情绪：{valid_tags} 目前已提取的证据：{current_evidences}。【你的沟通艺术与后台工作流】：1. 温暖对话：共情托底，像剥洋葱一样温柔提问，每次只问一个小问题。2. 提取保存：提取真实发生的“客观动作或细节”，默默调用 `submit_evidence` 保存。合并相似行为。3. 阶段确认：觉得挖掘差不多时，向用户复述已提取证据，询问是否还有补充。4. 结束阶段：只有当用户明确回答“没有补充了”时，才能调用 `finish_stage_3`。")
    context = get_safe_history(state["messages"], k=4)
    response = llm_with_tools.invoke([sys_msg] + context)
    return {"messages": [response]}


def node_cognitive_reframing(state: CBTState):
    print("\n[Node 4] 正在处理: 认知重构...")
    last_msg = state["messages"][-1]
    if last_msg.type == "human":
        live_scores = predict_emotions(last_msg.content)
        print(f"\n🧠 [阶段四 实时 ML 监测] 当前用户回复的七维得分:")
        for k, v in live_scores.items(): print(f"  - {k:<4}: {v:>5.1f} 分")
    llm_with_tools = llm.bind_tools([evaluate_reframing])
    evidences_str = json.dumps(state.get('evidences', []), ensure_ascii=False)
    sys_msg = SystemMessage(
        content=f"你是一位温暖极具洞察力的CBT治疗师。进入认知重构阶段。【你的内部参考信息】：客观事件：{state.get('event_summary', '')} 心结证据：{evidences_str}。【你的沟通艺术】：1. 隐形引导，自然交流。2. 温柔聚焦一个 'active' 的证据。3. 启发思考寻找新视角。4. 若有认知松动，立即调用 `evaluate_reframing` 工具（传入 evidence 和 current_tag）。5. 扭转后找下一个 active 证据。6. 兜底安抚：收到拦截指令说明防御强，先共情难受接纳感受。")
    context = get_safe_history(state["messages"], k=5)
    response = llm_with_tools.invoke([sys_msg] + context)
    return {"messages": [response]}


def node_rebuild_conclusion(state: CBTState):
    print("\n[Node 5] 正在处理: 总结收尾...")
    sys_msg = SystemMessage(content="任务：CBT流程已走完，结合用户打破的证据，进行最终的心理建设和赋能，结束对话。")
    response = llm.invoke([sys_msg] + state["messages"][-2:])
    return {"messages": [response]}


# ==========================================
# 5. 定义数据处理与跃迁节点 (重点修改：加入 Supabase 落库)
# ==========================================
def process_tool_calls(state: CBTState):
    last_message = state["messages"][-1]
    updates = {}
    tool_messages = []

    session_id = state.get("session_id")
    user_id = state.get("user_id")

    for tool_call in last_message.tool_calls:
        name = tool_call["name"]
        args = tool_call["args"]

        if name == "submit_event_summary":
            updates["event_summary"] = args["summary"]
            updates["current_stage"] = "stage_2"
            raw_texts = "\n".join([m.content for m in state["messages"] if m.type == "human"])
            updates["stage1_raw_texts"] = raw_texts
            print(f"  => [状态更新] 事件已记录: {args['summary']} -> 跃迁至 Stage 2")

            # 【Supabase 写入】第一次拿到客观事件，插入整行数据
            if supabase and session_id:
                try:
                    supabase.table('cbt_sessions').insert({
                        "id": session_id,
                        "user_id": user_id,
                        "raw_event": args["summary"]
                    }).execute()
                    print("  ☁️ [Supabase] 成功插入第一阶段事件！")
                except Exception as e:
                    print(f"  ☁️⚠️ [Supabase] 插入失败: {e}")

        elif name == "submit_emotion_scores":
            emotions = json.loads(args["emotions"])
            updates["emotion_tags"] = emotions
            updates["mood_history"] = [emotions]
            updates["current_stage"] = "stage_3"
            print(f"  => [状态更新] 情绪分数已记录: {emotions} -> 跃迁至 Stage 3")

            # 【Supabase 写入】更新情绪标签
            if supabase and session_id:
                try:
                    supabase.table('cbt_sessions').update({
                        "emotion_labels": emotions
                    }).eq("id", session_id).execute()
                    print("  ☁️ [Supabase] 成功更新情绪标签！")
                except Exception as e:
                    pass

        elif name == "submit_evidence":
            evidence_summary = args.get("evidence_summary", "")
            related_tags = args.get("related_tags", [])
            if isinstance(related_tags, str): related_tags = [related_tags]
            current_list = updates.get("evidences", state.get("evidences", []))
            for tag in related_tags:
                new_ev = {"text": evidence_summary, "tag": tag, "status": "active"}
                current_list.append(new_ev)
                print(f"  => [状态更新] 证据已提炼: '{evidence_summary}' -> 挂载至 [{tag}]")
            updates["evidences"] = current_list

            # 【Supabase 写入】更新证据列表（Supabase自动处理 JSONB）
            if supabase and session_id:
                try:
                    supabase.table('cbt_sessions').update({
                        "evidence_list": current_list
                    }).eq("id", session_id).execute()
                    print("  ☁️ [Supabase] 成功更新证据列表！")
                except Exception as e:
                    pass

        elif name == "finish_stage_3":
            updates["current_stage"] = "stage_4"
            print("\n" + "=" * 50)
            print("🚨 [流程控制] 证据搜集完毕 -> 正式跃迁至 Stage 4 (认知重构)")
            print("=" * 50 + "\n")


        elif name == "evaluate_reframing":
            target_evidence = args.get("evidence", "")
            target_tag = args.get("current_tag", "")
            is_logic_broken = args.get("is_broken", False)
            current_evs = state.get("evidences", [])
            user_last_reply = next((m.content for m in reversed(state["messages"]) if m.type == "human"), "")

            # --- 接入 ML 模型打分 ---
            ml_input_text = f"[事件]: {target_evidence} [认知]: {user_last_reply}"
            predicted_scores = predict_emotions(ml_input_text)
            local_target_score = predicted_scores.get(target_tag, 0)
            retry_key = f"{target_evidence}_{target_tag}"
            current_retries = state.get("retry_counts", {}).get(retry_key, 0)
            needs_supabase_update = False
            # 情况 A：逻辑通过且情感分降至阈值以下
            if is_logic_broken and local_target_score < 35:
                broken_tags = []
                for ev in current_evs:
                    if ev["text"] == target_evidence:
                        ev["status"] = "broken"
                        broken_tags.append(ev["tag"])

                if broken_tags:
                    print(f"\n✨ 🎈 【系统播报】：证据泡泡 [ {target_evidence} ] 已被彻底击碎！\n")
                updates["evidences"] = current_evs

                # 获取当前最新的总分快照
                new_emotion_tags = state.get("emotion_tags", {}).copy()
                score_msg_parts = []
                for b_tag in broken_tags:

                    if b_tag in new_emotion_tags:
                        old_total = new_emotion_tags[b_tag]
                        current_b_score = predicted_scores.get(b_tag, 0)
                        # 平滑计算新总分
                        new_total = round(old_total * 0.6 + current_b_score * 0.4, 1)
                        new_emotion_tags[b_tag] = new_total
                        score_msg_parts.append(f"{b_tag}降至{new_total}")

                updates["emotion_tags"] = new_emotion_tags  # 更新当前最新分
                updates["resolved_count"] = state.get("resolved_count", 0) + len(broken_tags)
                if updates["resolved_count"] >= len(current_evs):
                    updates["current_stage"] = "stage_5"
                tool_messages.append(ToolMessage(content=f"击破成功！连带更新：{'，'.join(score_msg_parts)}。",
                                                 tool_call_id=tool_call["id"]))
                needs_supabase_update = True


            # 情况 B：重试次数达上限，强制放行

            elif is_logic_broken and local_target_score >= 35:
                current_retries += 1
                updates["retry_counts"] = state.get("retry_counts", {}).copy()
                updates["retry_counts"][retry_key] = current_retries
                if current_retries >= 3:
                    accepted_tags = []
                    for ev in current_evs:
                        if ev["text"] == target_evidence:
                            ev["status"] = "accepted"
                            accepted_tags.append(ev["tag"])
                    updates["evidences"] = current_evs
                    updates["resolved_count"] = state.get("resolved_count", 0) + len(accepted_tags)
                    if updates["resolved_count"] >= len(current_evs):
                        updates["current_stage"] = "stage_5"
                    tool_messages.append(
                        ToolMessage(content=f"系统指令：重试达上限，放行接纳。", tool_call_id=tool_call["id"]))
                    needs_supabase_update = True
                else:
                    tool_messages.append(ToolMessage(content=f"系统拦截（第{current_retries}次）：未降至35以下。",
                                                     tool_call_id=tool_call["id"]))

            if needs_supabase_update and supabase and session_id:
                try:
                    current_tags = updates.get("emotion_tags", state.get("emotion_tags", {}))
                    history = state.get("mood_history", [])
                    new_history = history + [current_tags]
                    updates["mood_history"] = new_history  # 更新内存里的历史
                    supabase.table('cbt_sessions').update({
                        "evidence_list": updates.get("evidences", current_evs),
                        "emotion_labels": current_tags,
                        "mood_scores": new_history  # 👈 这里存的是累加后的数组
                    }).eq("id", session_id).execute()
                    print(f"  ☁️ [Supabase] 成功累加新分数快照，当前历史长度: {len(new_history)}")
                except Exception as e:
                    print(f"  ☁️⚠️ [Supabase] 更新历史失败: {e}")
        if name != "evaluate_reframing":
            tool_messages.append(ToolMessage(content=f"Executed {name} successfully", tool_call_id=tool_call["id"]))

    updates["messages"] = tool_messages
    return updates


# ==========================================
# 6 & 7. 路由边与图编译 - 保持不变
# ==========================================
def route_by_stage(state: CBTState):
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls: return "process_tools"
    return END


def route_after_tool(state: CBTState):
    stage_map = {"stage_1": "node_1", "stage_2": "node_2", "stage_3": "node_3", "stage_4": "node_4",
                 "stage_5": "node_5"}
    return stage_map[state["current_stage"]]


def route_start(state: CBTState):
    stage_map = {"stage_1": "node_1", "stage_2": "node_2", "stage_3": "node_3", "stage_4": "node_4",
                 "stage_5": "node_5"}
    return stage_map.get(state.get("current_stage", "stage_1"))


workflow = StateGraph(CBTState)
workflow.add_node("node_1", node_extract_event)
workflow.add_node("node_2", node_analyze_reaction)
workflow.add_node("node_3", node_gather_evidence)
workflow.add_node("node_4", node_cognitive_reframing)
workflow.add_node("node_5", node_rebuild_conclusion)
workflow.add_node("process_tools", process_tool_calls)

workflow.add_conditional_edges(START, route_start)
for i in range(1, 6):
    workflow.add_conditional_edges(f"node_{i}", route_by_stage, {"process_tools": "process_tools", END: END})

workflow.add_conditional_edges("process_tools", route_after_tool,
                               {"node_2": "node_2", "node_3": "node_3", "node_4": "node_4", "node_5": "node_5"})

app = workflow.compile()

# ==========================================
# 8. 本地测试流 (重点修改：自动生成 Session ID)
# ==========================================
if __name__ == "__main__":

    # [新增] 模拟生成本次聊天的唯一 ID
    test_session_id = str(uuid.uuid4())
    test_user_id = str(uuid.uuid4())
    print(f"\n🔑 [系统] 生成本次会话 ID: {test_session_id}")

    initial_state = {
        "session_id": test_session_id,  # 传入状态机
        "user_id": test_user_id,  # 传入状态机
        "messages": [],
        "current_stage": "stage_1",
        "event_summary": "",
        "emotion_tags": {},
        "evidences": [],
        "resolved_count": 0
    }

    current_state = initial_state

    print("\n🚀 CBT Agent 已启动。请输入内容 (输入 'q' 退出):")
    while True:
        user_input = input("\n[User]: ")
        if user_input.lower() == 'q': break

        current_state["messages"].append(HumanMessage(content=user_input))
        result_state = app.invoke(current_state)
        agent_reply = result_state["messages"][-1].content
        print(f"\n[Agent]: {agent_reply}")

        current_state = result_state
        print(
            f"  (系统底台状态: {current_state['current_stage']}, 事件={current_state['event_summary']}, 标签={current_state.get('emotion_tags', {})})")