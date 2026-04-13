# backend/agent/core.py

from langchain_core.messages import HumanMessage
# 因为 core.py 和 agent.py 在同一个文件夹下，我们用 .agent
from .agent import app as cbt_workflow 

# 临时内存数据库，存放每个用户的 CBT 状态（Session 记忆）
session_store = {}

def process_cbt_chat(session_id: str, user_id: str, message: str) -> dict:
    """
    集成版包装器：将 API 的参数映射到 CBTState 中
    """
    print(f"🧠 [Agent总控] 处理请求: Session={session_id}, User={user_id}")

    # 1. 初始化或获取内存中的状态
    if session_id not in session_store:
        session_store[session_id] = {
            "session_id": session_id,  # 👈 传入同学要求的 ID
            "user_id": user_id,        # 👈 传入用户 ID
            "messages": [],
            "current_stage": "stage_1",
            "event_summary": "",
            "emotion_tags": {},
            "mood_history": [],        # 👈 新增：情绪历史
            "evidences": [],
            "resolved_count": 0,
            "retry_counts": {}
        }
    
    current_state = session_store[session_id]
    
    # 2. 将用户消息加入状态
    current_state["messages"].append(HumanMessage(content=message))
    
    # 3. 调用队友写的图工作流
    # 注意：这里会自动触发队友代码里的 RoBERTa 模型打分
    result_state = cbt_workflow.invoke(current_state)
    
    # 4. 更新内存中的状态（以便下一轮对话）
    session_store[session_id] = result_state
    
    # 5. 格式化输出给前端
    agent_reply = result_state["messages"][-1].content
    # 提取情绪标签的 key 变成列表
    emotions = list(result_state.get("emotion_tags", {}).keys())
    
    return {
        "reply": agent_reply,
        "emotion_tags": emotions,
        "cbt_stage": result_state.get("current_stage", "stage_1"),
        "session_id": session_id # 传回给前端，让前端记住这次对话
    }