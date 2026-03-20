import json
import os
from typing import Annotated, List, Dict, Any
from typing_extensions import TypedDict

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from langgraph.graph import StateGraph, END, START
from langgraph.graph.message import add_messages
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI

# ==========================================
# 0. 全局加载 ML 模型 (保证开启 Agent 时只加载一次)
# ==========================================
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
    """工具函数：调用 ML 模型获取 7 维情绪得分"""
    if not ml_model or not tokenizer:
        return {col: 0.0 for col in TARGET_COLS}  # 防崩兜底
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
    messages: Annotated[list, add_messages]
    current_stage: str
    event_summary: str
    stage1_raw_texts: str
    emotion_tags: Dict[str, float]
    evidences: List[Dict]
    resolved_count: int
    retry_counts: Dict[str, int]


# ==========================================
# 2. 定义提取工具 (Tools) - 用于触发状态跃迁
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
    api_key="sk-017e613bf5754e37ac2140e058885b81",  # 请确保替换为你的真实 Key
    base_url="https://api.deepseek.com",
    model="deepseek-chat",
    temperature=0.2
)


def get_safe_history(messages, k=6):
    """绝对安全的滑动窗口：保留工具记忆，且绝不切断 Tool 与 AI 的绑定链条"""
    if len(messages) <= k: return messages
    idx = len(messages) - k
    while idx > 0 and messages[idx].type != "human":
        idx -= 1
    return messages[idx:]


# ==========================================
# 4. 定义图节点 (Nodes) - CBT 核心五步
# ==========================================
def node_extract_event(state: CBTState):
    print("\n[Node 1] 正在处理: 提取事件...")
    llm_with_tools = llm.bind_tools([submit_event_summary])
    sys_msg = SystemMessage(
        content="""你是专业的CBT治疗师。当前处于【阶段1：提取核心客观事件】。
            你的唯一任务是获取触发用户负面情绪的“核心客观事实（即发生了什么）”。
            【严格遵守以下规则】：
            1. 核心锚点原则：只要用户已经说出了核心冲突或挫折，就说明事实已经足够完善！
            2. 严禁过度追问：绝对不要像警察一样追问边缘细节。
            3. 立即触发机制：判断核心事件已出现，立即且仅调用 `submit_event_summary` 工具概括事件（不超过50个纯客观字），绝不回复其他追问！"""
    )
    response = llm_with_tools.invoke([sys_msg] + state["messages"][-3:])
    return {"messages": [response]}


def node_analyze_reaction(state: CBTState):
    print("\n[Node 2] 正在处理: 剖析感受与打分...")

    # --- ML 阶段二核心逻辑 ---
    raw_texts = state.get('stage1_raw_texts', '')
    ml_scores = predict_emotions(raw_texts)

    print("\n📊 [阶段二 ML 模型打分结果] (基于阶段1用户的整体倾诉):")
    for k, v in ml_scores.items():
        print(f"  - {k:<4}: {v:>5.1f} 分")

    # 筛选出大于 50 分的负面情绪作为标签
    extracted_tags = {k: round(v, 1) for k, v in ml_scores.items() if k in NEGATIVE_EMOTIONS and v >= 50}

    # 兜底：如果都不大于 50，取负面情绪里最高的一个
    if not extracted_tags:
        highest_neg = max(NEGATIVE_EMOTIONS, key=lambda x: ml_scores[x])
        extracted_tags = {highest_neg: round(ml_scores[highest_neg], 1)}
        print(f"  => 未检测到>50分的明显负面情绪，触发兜底，提取最高项: {highest_neg}")

    tags_json = json.dumps(extracted_tags, ensure_ascii=False)
    # -------------------------

    llm_with_tools = llm.bind_tools([submit_emotion_scores])
    sys_msg = SystemMessage(content=f"""
        你是CBT治疗师。当前处于【阶段2：剖析感受】。
        后台的 ML 情绪雷达已对用户的倾诉进行了精准分析。

        【必须执行的任务】：
        1. 请你根据 ML 识别出的情绪（{list(extracted_tags.keys())}），对用户表达深深的共情和理解。
        2. 你必须且只能调用 `submit_emotion_scores` 工具，将以下 JSON 字符串原封不动地传入：
        {tags_json}

        警告：绝对不要修改上述 JSON 的内容！
        """)
    context = get_safe_history(state["messages"], k=3)
    response = llm_with_tools.invoke([sys_msg] + context)
    return {"messages": [response]}


def node_gather_evidence(state: CBTState):
    print("\n[Node 3] 正在处理: 搜集证据...")
    llm_with_tools = llm.bind_tools([submit_evidence, finish_stage_3])
    current_evidences = [ev["text"] for ev in state.get("evidences", [])]
    valid_tags = list(state.get('emotion_tags', {}).keys())

    sys_msg = SystemMessage(content=f"""
            你是一位温暖、包容且极具洞察力的专业CBT治疗师。当前处于【阶段3：搜集客观证据】。

            【永久记忆：核心背景】
            客观事件：{state['event_summary']}
            用户最初的完整倾诉：{state.get('stage1_raw_texts', '')}
            确诊负面情绪：{valid_tags}
            目前已提取的证据：{current_evidences}

            【你的沟通艺术与后台工作流】：
            1. 温暖对话（前台表现）：
               - 情感托底：看到用户的倾诉，第一反应必须是接纳和共情。
               - 像老朋友聊天：不要像做调查问卷一样直接让用户罗列证据。请像剥洋葱一样，针对提取出的情绪温柔地提问。
               - 慢节奏引导：**每次回复请只问一个具体的小问题**，**绝对不要使用序号（如1.2.3.）连续追问**，给用户留出思考和喘息的空间。

            2. 提取保存（后台隐蔽任务）：
               - 摄像机法则：仔细扫描用户的回复，像无感情的摄像机一样，只提取真实发生的“客观动作或细节”，自动过滤掉用户的主观猜想。
               - 提炼与挂载：将提取的内容提炼概括后，默默发起 `submit_evidence` 工具调用。一段话里如果有多个不同的客观事实，必须发起多次调用独立保存。如果一个事实引发了多种情绪，可在 `related_tags` 列表中传入多个标签（必须且只能从确诊情绪 {valid_tags} 中选择）。
               - 合并同类项法则：如果用户提到在同一场景下发生的、性质高度相似的多个细微动作（例如：“晚上熬夜看小说、刷抖音、刷小红书”），你必须将它们高度概括合并为一条核心证据（如：“晚上报复性熬夜时频繁使用手机娱乐”）。 不要将相似行为拆分成多条重复表达的证据！
               - 严谨记录：确保后台记录不重复、不遗漏有价值的细节。

            3. 阶段确认（挖掘收尾）：
               - 当你觉得各个情绪下的证据已经挖掘得差不多了，你必须读取上方【目前已提取的证据】列表（也就是 {current_evidences} 的内容），将这些客观事实向用户清晰、温柔地复述出来。，并明确询问：“这些就是让你感到难受的全部原因了吗？还有什么需要补充的吗？”
               - 如果挖掘得不够充分，请继续安抚刚才说的细节，并针对尚未讨论的其他情绪标签继续温柔追问。

            4. 结束阶段：
               - 只有当用户明确回答“没有补充了”或“就是这些了”时，你才能调用 `finish_stage_3` 工具进入下一阶段！如果用户没确认，绝对不允许调用该工具。
            """)

    context = get_safe_history(state["messages"], k=4)
    response = llm_with_tools.invoke([sys_msg] + context)
    return {"messages": [response]}


def node_cognitive_reframing(state: CBTState):
    print("\n[Node 4] 正在处理: 认知重构...")

    # --- ML 阶段四回车实时监测逻辑 ---
    last_msg = state["messages"][-1]
    if last_msg.type == "human":
        live_scores = predict_emotions(last_msg.content)
        print(f"\n🧠 [阶段四 实时 ML 监测] 当前用户回复的七维得分:")
        for k, v in live_scores.items():
            print(f"  - {k:<4}: {v:>5.1f} 分")
    # -------------------------------

    llm_with_tools = llm.bind_tools([evaluate_reframing])
    evidences_str = json.dumps(state.get('evidences', []), ensure_ascii=False)
    sys_msg = SystemMessage(content=f"""
                你是一位温暖、包容且极具洞察力的专业CBT治疗师。我们现在进入认知重构阶段，帮助用户用新的视角看待问题。

                【你的内部参考信息（请仅在后台作为分析依据，勿在对话中念出这些系统设定）】：
                客观事件：{state.get('event_summary', '')}
                用户待解开的心结证据（包含对应的情绪标签和处理状态）：
                {evidences_str}

                【你的沟通艺术与引导指南】：
                1. 隐形引导：请以自然、老朋友般的聊天口吻与用户交流。为了保持沉浸式的心理咨询体验，请不要向用户提及“阶段”、“证据库”、“活跃状态”或“我的工作流”等机械词汇。
                2. 温柔聚焦：在后台查看上述心结清单，悄悄选定一个当前状态仍为 "active" 的证据（请先集中处理同一个情绪标签下的心结，避免跳跃）。
                3. 启发思考：针对选定的这个细节，用一次简短、温和的苏格拉底式提问，引导用户自己去发现替代性的解释或新的视角。例如：“当时发生这件事时，除了你担心的那种可能，会不会还有其他的解读方式呢？”
                4. 申请通关：如果在当前的对话回合中，用户表现出了任何形式的认知松动，你觉得他心情已经变好，就立即调用 `evaluate_reframing` 工具，传入 evidence 和 current_tag。 evidence 和 current_tag都应该是你选定的心结，从evidences_str复制的对应原始文本。
                5. 当用户针对当前心结证据的认知已经扭转，心情变好的时候，就可以寻找下一个当前状态仍为 "active" 的证据了。不要一直针对那个已经broken的证据追问、深挖或展开新的话题。
                6. 兜底安抚：如果收到系统返回的拦截指令（说明此时用户的防御心理和负面情绪依然很强），说明此时讲逻辑是无效的。请立刻暂停重构，先用温暖的话语深深共情他的痛苦，引导他接纳当下的感受。
                """)
    context = get_safe_history(state["messages"], k=5)
    response = llm_with_tools.invoke([sys_msg] + context)
    return {"messages": [response]}


def node_rebuild_conclusion(state: CBTState):
    print("\n[Node 5] 正在处理: 总结收尾...")
    sys_msg = SystemMessage(content="任务：CBT流程已走完，结合用户打破的证据，进行最终的心理建设和赋能，结束对话。")
    response = llm.invoke([sys_msg] + state["messages"][-2:])
    return {"messages": [response]}


# ==========================================
# 5. 定义数据处理与跃迁节点 (State Updater)
# ==========================================
def process_tool_calls(state: CBTState):
    last_message = state["messages"][-1]
    updates = {}
    tool_messages = []

    for tool_call in last_message.tool_calls:
        name = tool_call["name"]
        args = tool_call["args"]

        if name == "submit_event_summary":
            updates["event_summary"] = args["summary"]
            updates["current_stage"] = "stage_2"
            raw_texts = "\n".join([m.content for m in state["messages"] if m.type == "human"])
            updates["stage1_raw_texts"] = raw_texts
            print(f"  => [数据落库] 事件已记录: {args['summary']} -> 跃迁至 Stage 2")

        elif name == "submit_emotion_scores":
            emotions = json.loads(args["emotions"])
            updates["emotion_tags"] = emotions
            updates["current_stage"] = "stage_3"
            print(f"  => [数据落库] 情绪分数已记录: {emotions} -> 跃迁至 Stage 3")

        elif name == "submit_evidence":
            evidence_summary = args.get("evidence_summary", "")
            related_tags = args.get("related_tags", [])

            # 兼容处理：防止大模型抽风传成单个字符串
            if isinstance(related_tags, str):
                related_tags = [related_tags]

            current_list = updates.get("evidences", state.get("evidences", []))

            # 为每一个涉及到的标签，挂载这份证据
            for tag in related_tags:
                new_ev = {"text": evidence_summary, "tag": tag, "status": "active"}
                current_list.append(new_ev)
                print(f"  => [数据落库] 证据已提炼: '{evidence_summary}' -> 挂载至 [{tag}]")

            updates["evidences"] = current_list


        elif name == "finish_stage_3":
            updates["current_stage"] = "stage_4"
            # --- 进入阶段四时的“作战地图”打印 ---
            print("\n" + "=" * 50)
            print("🚨 [流程控制] 证据搜集完毕 -> 正式跃迁至 Stage 4 (认知重构)")
            print("📋 【阶段四作战地图：情绪与待击破证据清单】")
            current_evs = updates.get("evidences", state.get("evidences", []))
            grouped_evs = {}
            for ev in current_evs:
                grouped_evs.setdefault(ev["tag"], []).append(ev["text"])
            for tag, ev_list in grouped_evs.items():
                print(f"  📌 情绪标签: [{tag}] (当前 ML 总分: {state.get('emotion_tags', {}).get(tag, 0)} 分)")
                for i, ev_text in enumerate(ev_list, 1):
                    print(f"     {i}. 待击破证据: {ev_text}")
            print("=" * 50 + "\n")


        elif name == "evaluate_reframing":
            target_evidence = args.get("evidence", "")
            target_tag = args.get("current_tag", "")
            is_logic_broken = args.get("is_broken", False)
            current_evs = state.get("evidences", [])
            user_last_reply = next((m.content for m in reversed(state["messages"]) if m.type == "human"), "")
            # --- 接入 ML 模型进行最终裁判 ---
            ml_input_text = f"[事件]: {target_evidence} [认知]: {user_last_reply}"
            predicted_scores = predict_emotions(ml_input_text)
            local_target_score = predicted_scores.get(target_tag, 0)
            print(f"  => [ML 裁判介入] 针对 [{target_tag}] 的实时消解得分为: {local_target_score:.1f} 分 (阈值: 35分)")
            # 为了防止多标签复用同一个证据时次数串扰，增加 tag 作为联合 key
            retry_key = f"{target_evidence}_{target_tag}"
            current_retries = state.get("retry_counts", {}).get(retry_key, 0)

            # --- 阈值修改为 35 分 ---
            if is_logic_broken and local_target_score < 35:
                # 【情况A：同步连带击破】
                broken_tags = []  # 记录这个证据牵连了哪些标签
                for ev in current_evs:
                    # 只认证据文本！不校验 tag，只要文字一样，全部击碎！
                    if ev["text"] == target_evidence:
                        ev["status"] = "broken"
                        broken_tags.append(ev["tag"])
                        print(f"  => [底层状态] 成功断开与 [{ev['tag']}] 标签的连接线")

                if broken_tags:
                    print("\n" + "✨" * 25)
                    print(f"🎈 【系统播报】：证据泡泡 [ {target_evidence} ] 已被彻底击碎！")
                    print("✨" * 25 + "\n")

                updates["evidences"] = current_evs

                # 【同步更新所有受牵连标签的总分】
                updates["emotion_tags"] = state.get("emotion_tags", {})
                score_msg_parts = []
                for b_tag in broken_tags:
                    if b_tag in updates["emotion_tags"]:
                        old_total = updates["emotion_tags"][b_tag]
                        current_b_score = predicted_scores.get(b_tag, 0)
                        # 平滑更新总分
                        new_total = round(old_total * 0.6 + current_b_score * 0.4, 1)
                        updates["emotion_tags"][b_tag] = new_total
                        score_msg_parts.append(f"{b_tag}降至{new_total}")

                score_msg = "，".join(score_msg_parts)

                # ⚠️ resolved_count 必须加上这次连带击碎的总数量
                updates["resolved_count"] = state.get("resolved_count", 0) + len(broken_tags)
                if updates["resolved_count"] >= len(current_evs):
                    updates["current_stage"] = "stage_5"
                    print("  => [流程控制] 所有泡泡均已击破/接纳 -> 跃迁至 Stage 5")
                tool_messages.append(
                    ToolMessage(content=f"击破成功！连带更新：{score_msg}。", tool_call_id=tool_call["id"]))

            elif is_logic_broken and local_target_score >= 35:

                # 【情况B：情感未过】
                current_retries += 1
                updates["retry_counts"] = state.get("retry_counts", {})
                updates["retry_counts"][retry_key] = current_retries
                if current_retries >= 3:
                    # 触发兜底：同样执行连带接纳
                    accepted_tags = []
                    for ev in current_evs:
                        if ev["text"] == target_evidence:
                            ev["status"] = "accepted"
                            accepted_tags.append(ev["tag"])
                    updates["evidences"] = current_evs
                    updates["resolved_count"] = state.get("resolved_count", 0) + len(accepted_tags)

                    if updates["resolved_count"] >= len(current_evs):
                        updates["current_stage"] = "stage_5"
                        print("  => [流程控制] 所有泡泡均已击破/接纳 -> 跃迁至 Stage 5")
                    tool_messages.append(ToolMessage(
                        content=f"系统指令：针对 '{target_evidence}' 的重试次数已达上限。请停止反驳，向用户表达深深的共情，引导其接纳现状，并平滑过渡到下一个 active 证据。",
                        tool_call_id=tool_call["id"]
                    ))
                    print(f"  => [流程兜底] 触发情感接纳机制，连带放行该证据在所有标签下的状态: {target_evidence}")

                else:
                    # 打回重练
                    tool_messages.append(ToolMessage(
                        content=f"系统拦截（第{current_retries}次）：逻辑已通关，但 ML 判定用户的【{target_tag}】情绪得分仍有 {local_target_score:.1f} 分(未降至35以下)。禁止击破！请先共情难受，然后深挖情绪。",
                        tool_call_id=tool_call["id"]

                    ))
                    print(f"  => [网关拦截] 情感得分 {local_target_score:.1f} >= 35，打回重练 ({current_retries}/3)")

        if name != "evaluate_reframing":
            tool_messages.append(ToolMessage(content=f"Executed {name} successfully", tool_call_id=tool_call["id"]))

    updates["messages"] = tool_messages
    return updates


# ==========================================
# 6. 定义路由边 (Router)
# ==========================================
def route_by_stage(state: CBTState):
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "process_tools"
    return END


def route_after_tool(state: CBTState):
    stage_map = {
        "stage_1": "node_1", "stage_2": "node_2", "stage_3": "node_3",
        "stage_4": "node_4", "stage_5": "node_5"
    }
    return stage_map[state["current_stage"]]


def route_start(state: CBTState):
    stage_map = {
        "stage_1": "node_1", "stage_2": "node_2", "stage_3": "node_3",
        "stage_4": "node_4", "stage_5": "node_5"
    }
    return stage_map.get(state.get("current_stage", "stage_1"))


# ==========================================
# 7. 构建与编译图 (Build Graph)
# ==========================================
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

workflow.add_conditional_edges("process_tools", route_after_tool, {
    "node_2": "node_2", "node_3": "node_3", "node_4": "node_4", "node_5": "node_5"
})

app = workflow.compile()

# ==========================================
# 8. 本地测试流
# ==========================================
if __name__ == "__main__":
    initial_state = {
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