import json
from typing import Annotated, List, Dict, Any
from typing_extensions import TypedDict
from pydantic import BaseModel, Field

from langgraph.graph import StateGraph, END, START
from langgraph.graph.message import add_messages
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI


# ==========================================
# 1. 定义状态字典 (CBT State) - 我们的“内存数据库”
# ==========================================
class CBTState(TypedDict):
    # 短期记忆：仅保留当前轮次的少量对话，避免 Token 爆炸
    messages: Annotated[list, add_messages]

    # 宏观控制
    current_stage: str

    # 结构化落地数据（永久记忆精华）
    event_summary: str  # 阶段1: 客观事实
    stage1_raw_texts: str  # 用于存放阶段1用户发送的所有原话集合
    emotion_tags: Dict[str, float]  # 阶段2: 情绪标签及打分 (目前用LLM模拟)
    evidences: List[Dict]  # 阶段3: 证据列表
    resolved_count: int  # 阶段4: 已打破的泡泡数量
    retry_counts: Dict[str, int]  # 用来记录每个证据被拒绝击破的次数

# ==========================================
# 2. 定义提取工具 (Tools) - 用于触发状态跃迁
# ==========================================

@tool
def submit_event_summary(summary: str):
    """阶段1工具：当用户把客观事件讲清楚后，调用此工具保存概括事实。"""
    pass  # 实际逻辑在路由处理节点中实现


@tool
def submit_emotion_scores(emotions: str):
    """阶段2工具：提取用户的情绪标签及0-100的打分，必须是 JSON 字符串格式。例如 '{"焦虑": 85, "羞耻": 70, "开心": 10}'"""
    pass


@tool
def submit_evidence(evidence_text: str, related_tag: str):
    """阶段3工具：保存一条支持负面情绪的客观证据，并绑定对应的标签。"""
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
    api_key="sk-017e613bf5754e37ac2140e058885b81",  # 替换为你的真实 Key
    base_url="https://api.deepseek.com",
    model="deepseek-chat",
    temperature=0.2  # 降低温度，保证抽取稳定性
)


def get_safe_history(messages, k=6):
    """绝对安全的滑动窗口：保留工具记忆，且绝不切断 Tool 与 AI 的绑定链条"""
    if len(messages) <= k:
        return messages

    # 为了防止把紧密绑定的 AIMessage 和 ToolMessage 切开导致 400 报错，
    # 我们从截断点往回找，一定要找到一条 HumanMessage（用户发言）作为起点。
    idx = len(messages) - k
    while idx > 0 and messages[idx].type != "human":
        idx -= 1

    return messages[idx:]
# ==========================================
# 4. 定义图节点 (Nodes) - CBT 核心五步
# ==========================================

def node_extract_event(state: CBTState):
    """阶段1：引导讲述事件"""
    print("\n[Node 1] 正在处理: 提取事件...")
    llm_with_tools = llm.bind_tools([submit_event_summary])

    sys_msg = SystemMessage(
        content="""你是专业的CBT治疗师。当前处于【阶段1：提取核心客观事件】。
            你的唯一任务是获取触发用户负面情绪的“核心客观事实（即发生了什么）”。
            【严格遵守以下规则】：
            1. 核心锚点原则：只要用户已经说出了核心冲突或挫折（如：在哪里、因为什么事、遭遇了什么困难），就说明事实已经足够完善！
            2. 严禁过度追问：绝对不要像警察一样追问边缘细节（例如：具体多长时间、后续怎么进行的、谁选的文献等）。细节将在后续阶段挖掘。
            3. 立即触发机制：只要判断核心事件已出现，你必须立即且仅调用 `submit_event_summary` 工具来概括事件（要求概括为不超过50个字的纯客观描述），绝对不要再回复任何追问或安抚的话语！"""
    )

    all_msgs = state["messages"]
    response = llm_with_tools.invoke([sys_msg] + state["messages"][-3:])
    return {"messages": [response]}


def node_analyze_reaction(state: CBTState):
    """阶段2：剖析当时的反应和感受 (暂用 LLM 代替 NLP 打分)"""
    print("\n[Node 2] 正在处理: 剖析感受与打分...")
    llm_with_tools = llm.bind_tools([submit_emotion_scores])

    sys_msg = SystemMessage(content=f"""
        你是CBT治疗师。当前处于【阶段2：剖析感受】。
        
        【用户最初的完整倾诉集合】：
        {state.get('stage1_raw_texts', '')}
        任务：请**仅仅针对上述“用户最初的完整倾诉集合”**，分析用户的感受。
        如果用户的表达中已经包含了明显的情绪倾向，请立即调用工具 `submit_emotion_scores` 提取情绪和打分。
        【极其重要的约束】：
        提取的情绪标签只能且必须从以下6个词中选择：["焦虑", "悲伤", "愤怒", "羞耻", "内疚", "无助"]。
        绝对不要发明新的词汇！如果没有对应情绪，就不要提取。分数范围为 0-100。
        """)
    context = get_safe_history(state["messages"], k=3)
    response = llm_with_tools.invoke([sys_msg] + context)
    return {"messages": [response]}


def node_gather_evidence(state: CBTState):
    """阶段3：搜集支持负面想法的证据"""
    print("\n[Node 3] 正在处理: 搜集证据...")
    llm_with_tools = llm.bind_tools([submit_evidence, finish_stage_3])

    current_evidences = [ev["text"] for ev in state.get("evidences", [])]

    sys_msg = SystemMessage(content=f"""
        你是专业的CBT治疗师。当前处于【阶段3：搜集证据】。

        【永久记忆：核心背景】
        客观事件：{state['event_summary']}
        用户最初的完整倾诉集合：{state.get('stage1_raw_texts', '')}
        用户当前已被诊断出的负面情绪：{list(state['emotion_tags'].keys())}
        目前已提取并确认的证据：{current_evidences}

        【你的工作流】：
        1. 引导追问：不要直接让用户罗列证据。你需要像剥洋葱一样，针对提取出的情绪（如“羞耻”），温柔地提问：“你说大家都在嘲笑你，当时有人做出了什么具体的表情或举动让你产生这种感觉吗？”
        2. 提取保存：全面提取（绝不遗漏与重复）：当你收到用户的新回复时，必须仔细扫描全文。如果用户的一段话里提到了**多个不同的客观动作或细节**（例如同时提到了A的反应和B的反应），你必须在同一次回复中，发起多次 `submit_evidence` 工具调用，把这些**不同的证据全部独立提取出来**。
        - 警告：严禁重复提取同一件事！ - 警告：严禁遗漏！必须覆盖用户提到的所有有价值的客观细节。 - 警告：过滤主观臆测：提取的内容只能是客观事实，不要把用户的主观猜想作为证据存入。
        3. 阶段确认（最关键）：当你觉得已经挖掘得差不多了，必须把收集到的所有证据向用户复述总结一遍，并明确询问：“这些就是让你感到难受的全部原因了吗？还有什么需要补充的吗？”。如果挖掘的不够充分，就用语言安抚用户刚才说的细节，并针对目前尚未讨论的其他情绪标签继续温柔追问。
        4. 结束阶段：只有当用户明确回答“没有补充了”或“就是这些了”时，你才能调用 `finish_stage_3` 工具进入下一阶段！ 如果用户没确认，绝对不允许调用该工具！
        """)
    context = get_safe_history(state["messages"], k=4)
    response = llm_with_tools.invoke([sys_msg] + context)
    return {"messages": [response]}


def node_cognitive_reframing(state: CBTState):
    """阶段4：认知重构与击破泡泡"""
    print("\n[Node 4] 正在处理: 认知重构...")
    llm_with_tools = llm.bind_tools([evaluate_reframing])

    evidences_str = json.dumps(state.get('evidences', []), ensure_ascii=False)

    sys_msg = SystemMessage(content=f"""
        你是专业的CBT治疗师。当前处于【阶段4：认知重构】。

        【核心背景】
        客观事件：{state.get('event_summary', '')}
        需要逐个击破的负面认知证据库（包含对应的情绪标签和当前状态）：
        {evidences_str}

        【你的工作流】（必须严格遵守）：
        1. 锁定战区：查看证据库，找到当前仍有 "status": "active" 证据的某一个情绪标签（例如先集中处理【羞耻】下的 active 证据）。绝不跨标签提问！
        2. 引导反驳：用苏格拉底式提问引导用户寻找替代性解释。
        3. 申请击破：当用户表现出认知松动时，立即调用 `evaluate_reframing` 工具，传入 evidence 和 current_tag。
        4. 处理系统拦截：如果系统返回拦截指令（ToolMessage提示情感得分过高），你必须停止反驳，在下一次回复中先共情用户的难受，然后温柔地深挖原因或引导接纳。
        """)
    context = get_safe_history(state["messages"], k=5)
    response = llm_with_tools.invoke([sys_msg] + context)
    return {"messages": [response]}


def node_rebuild_conclusion(state: CBTState):
    """阶段5：总结与情绪拔出"""
    print("\n[Node 5] 正在处理: 总结收尾...")
    sys_msg = SystemMessage(content="任务：CBT流程已走完，结合用户打破的证据，进行最终的心理建设和赋能，结束对话。")
    response = llm.invoke([sys_msg] + state["messages"][-2:])
    return {"messages": [response]}


# ==========================================
# 5. 定义数据处理与跃迁节点 (State Updater)
# ==========================================
def process_tool_calls(state: CBTState):
    """
    核心枢纽：解析 LLM 调用的工具，更新 CBTState（模拟落库），并修改 current_stage
    """
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
            print(f"  => [后台备份] 用户的初始倾诉合集已打包备份，供后续节点挖掘！")

        elif name == "submit_emotion_scores":
            # 将 LLM 生成的 JSON 字符串转为字典
            emotions = json.loads(args["emotions"])
            updates["emotion_tags"] = emotions
            updates["current_stage"] = "stage_3"
            print(f"  => [数据落库] 情绪分数已记录: {emotions} -> 跃迁至 Stage 3")


        elif name == "submit_evidence":

            new_ev = {"text": args["evidence_text"], "tag": args["related_tag"], "status": "active"}
            current_list = updates.get("evidences", state.get("evidences", []))
            updates["evidences"] = current_list + [new_ev]
            print(f"  => [数据落库] 新证据挂载至 [{args['related_tag']}]: {args['evidence_text']}")

        elif name == "finish_stage_3":
            updates["current_stage"] = "stage_4"
            print("  => [流程控制] 证据搜集完毕 -> 跃迁至 Stage 4")



        elif name == "evaluate_reframing":
            target_evidence = args.get("evidence", "")
            target_tag = args.get("current_tag", "")  # 务必确保大模型调用时传了这个参数！
            is_logic_broken = args.get("is_broken", False)
            current_evs = state.get("evidences", [])
            # ========================================================

            # [TODO: ML模型接入点]

            # 等你训练好 ML 模型后，解开这里的注释，并将下面的模拟分数删掉
            #
            # user_last_reply = state["messages"][-1].content
            # ml_input_text = f"[事件]: {target_evidence} [认知]: {user_last_reply}"
            # predicted_scores = my_ml_model.predict(ml_input_text)
            # local_target_score = predicted_scores.get(target_tag, 0)
            # ========================================================

            # 【当前测试用】：为了测试拦截和重试循环，我们先把 ML 分数写死为 60 分
            # (如果你想测试通关，把它改成 20 即可)
            local_target_score = 60
            # 读取重试次数
            current_retries = state.get("retry_counts", {}).get(target_evidence, 0)
            # 3. 裁判网关逻辑
            if is_logic_broken and local_target_score < 40:
                # 【情况A：双重通关 (逻辑破裂 + 情感降温)】
                for ev in current_evs:
                    if ev["text"] == target_evidence:
                        ev["status"] = "broken"
                        print(f"  => [双重通关] 成功击碎 [{ev['tag']}] 标签下的证据: {target_evidence}")
                        break
                updates["evidences"] = current_evs
                # 【平滑更新全局总分】
                if "emotion_tags" in state and target_tag in state["emotion_tags"]:
                    old_total = state["emotion_tags"][target_tag]
                    new_total = round(old_total * 0.6 + local_target_score * 0.4, 1)
                    # 避免直接修改原字典，先做个拷贝或更新
                    updates["emotion_tags"] = state.get("emotion_tags", {})
                    updates["emotion_tags"][target_tag] = new_total
                    score_msg = f"{target_tag} 的全局总分已降至 {new_total}。"
                else:
                    score_msg = "状态已更新。"
                updates["resolved_count"] = state.get("resolved_count", 0) + 1

                # 检查是不是所有泡泡都破了
                if updates["resolved_count"] >= len(current_evs):
                    updates["current_stage"] = "stage_5"
                    print("  => [流程控制] 所有黑泡泡均已击破/接纳 -> 跃迁至 Stage 5")
                tool_messages.append(ToolMessage(
                    content=f"击破成功！{score_msg}",
                    tool_call_id=tool_call["id"]
                ))


            elif is_logic_broken and local_target_score >= 40:
                # 【情况B：情感未过 (逻辑破裂，但情感残留)】
                current_retries += 1
                # 更新重试次数到状态字典
                updates["retry_counts"] = state.get("retry_counts", {})
                updates["retry_counts"][target_evidence] = current_retries
                if current_retries >= 3:

                    # 【触发兜底：超过最大重试次数，强制接纳】
                    for ev in current_evs:
                        if ev["text"] == target_evidence:
                            ev["status"] = "accepted"  # 标记为特殊的“已接纳”状态
                    updates["evidences"] = current_evs
                    updates["resolved_count"] = state.get("resolved_count", 0) + 1

                    if updates["resolved_count"] >= len(current_evs):
                        updates["current_stage"] = "stage_5"

                        print("  => [流程控制] 所有黑泡泡均已击破/接纳 -> 跃迁至 Stage 5")
                    tool_messages.append(ToolMessage(
                        content=f"系统指令：针对 '{target_evidence}' 的重试次数已达上限。这说明用户存在深层心结。请停止反驳，向用户表达深深的共情，告诉他‘允许这种情绪的存在’，引导其带病生存/接纳现状，并平滑过渡到下一个 active 证据。",
                        tool_call_id=tool_call["id"]
                    ))
                    print(f"  => [流程兜底] 触发情感接纳机制，强制放行: {target_evidence}")


                else:
                    # 【未到上限：打回重练，要求深挖】
                    tool_messages.append(ToolMessage(
                        content=f"系统拦截（第{current_retries}次）：逻辑已通关，但 ML 判定用户的【{target_tag}】情绪得分仍高达 {local_target_score} 分。禁止击破！请在回复中先共情用户的难受，然后温柔地深挖：‘除了表面原因，这件事是不是让你联想到了其他不愉快的经历？’",
                        tool_call_id=tool_call["id"]

                    ))

                    print(f"  => [网关拦截] 情感得分 {local_target_score} >= 40，打回重练 ({current_retries}/3)")

        if name != "evaluate_reframing":
            tool_messages.append(ToolMessage(content=f"Executed {name} successfully", tool_call_id=tool_call["id"]))

    updates["messages"] = tool_messages
    return updates


# ==========================================
# 6. 定义路由边 (Router)
# ==========================================
def route_by_stage(state: CBTState):
    """主路由器：根据当前节点，决定是跳去工具处理，还是等待用户输入"""
    last_message = state["messages"][-1]

    # 如果 LLM 决定调用工具（说明当前阶段任务达成，准备写数据库并跃迁）
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "process_tools"

    # 否则，结束本次系统流转，将 LLM 的话语返回给前端，等待用户回复
    return END


def route_after_tool(state: CBTState):
    """工具执行完（状态更新完）后，动态跳转到对应的阶段节点继续生成对话"""
    stage_map = {
        "stage_1": "node_1",
        "stage_2": "node_2",
        "stage_3": "node_3",
        "stage_4": "node_4",
        "stage_5": "node_5"
    }
    return stage_map[state["current_stage"]]


# ==========================================
# 7. 构建与编译图 (Build Graph)
# ==========================================
workflow = StateGraph(CBTState)

# 添加节点
workflow.add_node("node_1", node_extract_event)
workflow.add_node("node_2", node_analyze_reaction)
workflow.add_node("node_3", node_gather_evidence)
workflow.add_node("node_4", node_cognitive_reframing)
workflow.add_node("node_5", node_rebuild_conclusion)
workflow.add_node("process_tools", process_tool_calls)

#定义一个动态起点路由函数
def route_start(state: CBTState):
    """根据底台状态，决定每次唤醒从哪个节点开始"""
    stage_map = {
        "stage_1": "node_1",
        "stage_2": "node_2",
        "stage_3": "node_3",
        "stage_4": "node_4",
        "stage_5": "node_5"
    }
    #默认从 node_1 开始，但如果有状态，就跳到对应的节点
    return stage_map.get(state.get("current_stage", "stage_1"))

#使用条件边作为起点，替代 set_entry_point
workflow.add_conditional_edges(START, route_start)

# 添加条件边：所有业务节点都统一经过 route_by_stage 检查
for i in range(1, 6):
    workflow.add_conditional_edges(f"node_{i}", route_by_stage, {"process_tools": "process_tools", END: END})

# 工具节点执行完毕后，根据更新后的 current_stage 跳回业务节点
workflow.add_conditional_edges("process_tools", route_after_tool, {
    "node_2": "node_2", "node_3": "node_3", "node_4": "node_4", "node_5": "node_5"
})

app = workflow.compile()

# ==========================================
# 8. 本地测试流 (模拟与前端交互)
# ==========================================
if __name__ == "__main__":
    # 初始化空状态
    initial_state = {
        "messages": [],
        "current_stage": "stage_1",
        "event_summary": "",
        "emotion_tags": {},
        "evidences": [],
        "resolved_count": 0
    }

    current_state = initial_state

    print("CBT Agent 已启动。请输入内容 (输入 'q' 退出):")
    while True:
        user_input = input("\n[User]: ")
        if user_input.lower() == 'q': break

        # 将用户输入追加到状态中
        current_state["messages"].append(HumanMessage(content=user_input))

        # 触发图流转
        result_state = app.invoke(current_state)

        # 打印 Agent 最终的回复
        agent_reply = result_state["messages"][-1].content
        print(f"[Agent]: {agent_reply}")

        # 更新用于下一轮的 State
        current_state = result_state
        print(
            f"  (系统底台状态: {current_state['current_stage']}, 事件={current_state['event_summary']}, 标签={current_state['emotion_tags']})")