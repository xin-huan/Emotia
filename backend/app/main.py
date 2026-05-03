from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import date
import os
import json
import asyncio
import random
import math
from pydantic import BaseModel

# 导入你的包装器和数据库
from agent.core import process_cbt_chat
from app.database import supabase # 确保你有这个文件

app = FastAPI(title="MindFlow CBT API")

# 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======= 数据模型定义 =======

class ChatRequest(BaseModel):
    session_id: str
    user_id: str
    message: str

class UserAuthRequest(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    user_id: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    birthday: Optional[str] = None # 格式 "YYYY-MM-DD"

class PostCreate(BaseModel):
    user_id: str
    category_id: int
    title: str
    content: str

class AnswerCreate(BaseModel):
    post_id: str
    user_id: str
    content: str

class LikeToggleRequest(BaseModel):
    user_id: str
    post_id: str

class TestSubmitRequest(BaseModel):
    user_id: str
    test_id: str
    answers: List[dict] # 每一题的选择，例如 [{"question_id": "xxx", "score": 2}, ...]

# ======= 核心业务接口 =======

@app.get("/")
def index():
    return {"status": "online"}

# 1. 聊天接口
@app.post("/api/chat/stream")
async def chat_endpoint(req: ChatRequest):
    # 🚀 [核心修复] 先在 cbt_sessions 表里占个位
    # 这样数据库就知道这个 session_id 是合法的了
    preview_text = (req.message[:15] + '...') if len(req.message) > 15 else req.message
    try:
        supabase.table("cbt_sessions").upsert({
            "id": req.session_id,
            "user_id": req.user_id,
            "raw_event": f"🗨️ {preview_text}" # 临时占位，后续 Agent 会更新它
        }).execute()
    except Exception as e:
        print(f"⚠️ 初始化会话失败: {e}")
        # 这里如果失败通常是因为 user_id 不在 auth.users 里
    # 1. 记录用户消息
    user_msg_data = {
        "session_id": req.session_id,
        "sender": "user",
        "content": req.message,
        "user_id": req.user_id
    }
    supabase.table("chat_messages").insert(user_msg_data).execute()

    # 2. 调用 Agent 获取结果 (这个过程可能需要几秒)
    # 注意：这里我们拿到了完整的 agent_res 字典
    agent_res = process_cbt_chat(req.session_id, req.user_id, req.message)

    # 3. 记录 Agent 消息
    agent_msg_data = {
        "session_id": req.session_id,
        "sender": "agent",
        "content": agent_res["reply"],
        "cbt_stage": agent_res["cbt_stage"]
    }
    supabase.table("chat_messages").insert(agent_msg_data).execute()

# 4. 🚀 构造 SSE 生成器，按前端需要的 data: 格式吐出数据
    async def sse_generator():
        # 第一步：发送白盒数据和状态（一次性给过去）
        whitebox_data = {
            'type': 'data_update', 
            'emotion_tags': agent_res.get('full_emotions', {}), 
            'evidences': agent_res.get('evidences', [])
        }
        yield f"data: {json.dumps(whitebox_data, ensure_ascii=False)}\n\n"
        
        # 第二步：将完整的回复拆成一个一个字（或小片段）
        full_reply = agent_res['reply']
        
        # 我们按每 2 个字一组进行拆分，模拟真实打字速度
        chunk_size = 2 
        for i in range(0, len(full_reply), chunk_size):
            chunk = full_reply[i:i + chunk_size]
            text_data = {'type': 'text_chunk', 'content': chunk}
            yield f"data: {json.dumps(text_data, ensure_ascii=False)}\n\n"
            
            # 💡 关键点：每吐几个字，歇个 0.05 秒
            # 这样前端就能看到字是一个个蹦出来的，交互感瞬间拉满
            await asyncio.sleep(0.03) 
        
        # 第三步：发送结束信号
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

# 2. 注册接口 (增强版)
@app.post("/api/signup")
def signup(req: UserAuthRequest):
    try:
        response = supabase.auth.sign_up({
            "email": req.email,
            "password": req.password,
        })
        if response.user is None:
            return {"status": "error", "message": "注册失败：该邮箱可能已被注册"}
        return {"status": "success", "data": {"user_id": response.user.id}}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"注册失败: {str(e)}")

# 3. 登录接口 (增强版)
@app.post("/api/login")
def login(req: UserAuthRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })
        return {
            "status": "success",
            "message": "登录成功！",
            "data": {
                "user_id": response.user.id,
                "email": response.user.email,
                "access_token": response.session.access_token 
            }
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="邮箱或密码错误，请检查后再试。")

# 4. 个人资料接口
@app.get("/api/user/profile/{user_id}")
def get_profile(user_id: str):
    res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    return res.data

@app.put("/api/user/profile")
def update_profile(req: ProfileUpdate):
    update_data = req.dict(exclude_unset=True)
    if "birthday" in update_data and update_data["birthday"]:
        try:
            date.fromisoformat(update_data["birthday"])
        except ValueError:
            return {"status": "error", "message": "生日格式不正确，请使用 YYYY-MM-DD 格式"}
    
    if not req.user_id:
        return {"status": "error", "message": "缺少用户ID"}
        
    db_data = update_data.copy()
    db_data["id"] = db_data.pop("user_id")
    res = supabase.table("profiles").upsert(db_data).execute()
    return {"status": "success", "data": res.data}

# ======= 博客问答页 API =======

@app.get("/api/forum/categories")
def get_categories():
    res = supabase.table("forum_categories").select("*").execute()
    return res.data


@app.get("/api/forum/posts/{post_id}")
def get_post_detail(post_id: str):
    # 强行去掉可能存在的引号
    p_id = post_id.strip('"').strip("'")
    post_res = supabase.table("forum_posts").select("*, profiles(username, avatar_url), forum_categories(name)").eq("id", p_id).single().execute()
    answers_res = supabase.table("forum_answers").select("*, profiles(username, avatar_url)").eq("post_id", p_id).order("created_at", desc=False).execute()
    return {"post": post_res.data, "answers": answers_res.data}

@app.post("/api/forum/answers")
def create_answer(ans: AnswerCreate):
    try:
        data = ans.dict()
        res = supabase.table("forum_answers").insert(data).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/user/my-posts/{user_id}")
def get_my_posts(user_id: str):
    res = supabase.table("forum_posts").select("*").eq("user_id", user_id).execute()
    return res.data

@app.get("/api/forum/posts")
def get_posts(sort: str = "latest", category_id: int = None, viewer_id: str = None):
    # 1. 基础查询：拿到所有数据
    query = supabase.table("forum_posts").select(
        "*, profiles!user_id(username, avatar_url), forum_likes(count), forum_answers(count)"
    )
    if category_id:
        query = query.eq("category_id", category_id)
        
    res = query.execute()
    all_data = res.data

    # 2. 查询当前用户点赞过的 ID 列表
    liked_post_ids = []
    # 增加对 "null" 和 "" 的判断，防止前端传参不规范
    if viewer_id and viewer_id not in ["undefined", "null", ""]:
        likes_res = supabase.table("forum_likes").select("post_id").eq("user_id", viewer_id).execute()
        liked_post_ids = [item['post_id'] for item in likes_res.data]

    # 3. 根据 sort 类型，处理【排序】和【截断数量】
    if sort == "hot":
        # 热榜：按点赞排，取 10 条
        for post in all_data:
            likes = post['forum_likes'][0]['count'] if post['forum_likes'] else 0
            answers = post['forum_answers'][0]['count'] if post['forum_answers'] else 0
            post['hot_score'] = likes + answers
        processed_posts = sorted(all_data, key=lambda x: x.get('hot_score', 0), reverse=True)
        processed_posts = processed_posts[:10]
    elif sort == "random":
        # 换一批：打乱，取 3 条
        random.shuffle(all_data)
        processed_posts = all_data[:3]
    else:
        # 最新：按时间排，取 3 条
        processed_posts = sorted(all_data, key=lambda x: x['created_at'], reverse=True)
        processed_posts = processed_posts[:3]

    # 4. 🚀 统一返回（这步最关键，必须把 posts 和 liked_post_ids 一起包起来）
    return {
        "posts": processed_posts,
        "liked_post_ids": liked_post_ids
    }


# 2. 完善点赞接口 (如果之前没写或点不动)
@app.post("/api/forum/like/toggle")
def toggle_like(req: dict): # 简单的 dict 接收即可
    user_id = req.get("user_id")
    post_id = req.get("post_id")
    
    # 检查是否已点赞
    existing = supabase.table("forum_likes").select("*").eq("post_id", post_id).eq("user_id", user_id).execute()
    
    if existing.data:
        # 已有记录则删除 (取消点赞)
        supabase.table("forum_likes").delete().eq("post_id", post_id).eq("user_id", user_id).execute()
        return {"status": "unliked"}
    else:
        # 没有则插入 (点赞)
        supabase.table("forum_likes").insert({"post_id": post_id, "user_id": user_id}).execute()
        return {"status": "liked"}

# C. 个人空间：获取我的通知
@app.get("/api/user/notifications/{user_id}")
def get_notifications(user_id: str):
    res = supabase.table("notifications") \
        .select("*, actor:profiles!notifications_actor_id_fkey(username), post:forum_posts(content)") \
        .eq("receiver_id", user_id) \
        .eq("is_read", False) \
        .order("created_at", desc=True) \
        .execute()
    return res.data

# 标记消息已读
@app.put("/api/user/notifications/read/{user_id}")
def mark_read(user_id: str):
    supabase.table("notifications").update({"is_read": True}).eq("receiver_id", user_id).execute()
    return {"status": "success"}

# --- 1. 数据模型定义 ---

class TestAnswer(BaseModel):
    question_id: str
    score: int

class TestSubmitRequest(BaseModel):
    user_id: str
    test_id: int
    answers: List[TestAnswer] # 接收每一题的答案列表

# --- 2. 接口实现 ---

# A. 获取所有测评量表列表 (展示卡片用)
@app.get("/api/tests")
def get_all_tests():
    res = supabase.table("tests").select("*").order("id").execute()
    return res.data

# B. 获取对应测试的题目和选项 (答题页用)
@app.get("/api/tests/{test_id}/questions")
def get_test_questions(test_id: int):
    res = supabase.table("test_questions") \
        .select("id, question_text, options") \
        .eq("test_id", test_id) \
        .order("sort_order", desc=False) \
        .execute()
    return res.data

# C. 核心：提交测评、自动计算分值并存库
@app.post("/api/tests/submit")
def submit_test(req: TestSubmitRequest):
    try:
        # 1. 从数据库获取该测试的权威计分标准
        test_info = supabase.table("tests") \
            .select("scoring_formula, result_brackets") \
            .eq("id", req.test_id) \
            .single().execute()
        
        if not test_info.data:
            raise HTTPException(status_code=404, detail="未找到该测试的计分规则")

        formula = test_info.data.get("scoring_formula")
        brackets = test_info.data.get("result_brackets")

        # 2. 计算原始总分 (Raw Score)
        raw_score = sum([ans.score for ans in req.answers])
        
        # 3. 执行公式换算 (例如 SDS 的 x * 1.25)
        final_score = raw_score
        if formula == 'x * 1.25':
            final_score = math.floor(raw_score * 1.25) # 官方标准通常要求取整
        # 如果有其他公式可以在此扩展 elif...

        # 4. 自动匹配等级 (根据 result_brackets 配置)
        matching_level = "无法评估"
        if brackets:
            # brackets 格式示例: [{"min": 53, "max": 62, "level": "轻度"}]
            for bracket in brackets:
                if bracket["min"] <= final_score <= bracket["max"]:
                    matching_level = bracket["level"]
                    break

        # 5. 结果持久化到数据库
        insert_res = supabase.table("user_test_results").insert({
            "user_id": req.user_id,
            "test_id": req.test_id,
            "total_score": final_score,
            "result_level": matching_level
        }).execute()

        # 6. 返回给前端（包含计算后的分数和等级）
        return {
            "status": "success",
            "data": {
                "score": final_score,
                "level": matching_level,
                "record_id": insert_res.data[0]['id'] if insert_res.data else None
            }
        }

    except Exception as e:
        print(f"❌ 测评提交失败: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# D. 获取用户的测评历史记录 (个人空间图表用)
@app.get("/api/user/test-history/{user_id}")
def get_test_history(user_id: str):
    res = supabase.table("user_test_results") \
        .select("created_at, total_score, result_level, tests(title)") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
    return res.data



# 1. 获取用户的会话清单 (个人空间列表页用)
@app.get("/api/user/sessions/{user_id}")
def get_user_sessions(user_id: str):
    # 从 cbt_sessions 表里查，按时间倒序排列
    res = supabase.table("cbt_sessions") \
        .select("id, created_at, raw_event") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
    return res.data

# 2. 获取某个具体会话的聊天记录 (点击进入详情用)
@app.get("/api/chat/history/{session_id}")
def get_chat_history(session_id: str):
    # 强行去掉可能的引号
    s_id = session_id.strip('"').strip("'")
    
    # 从 chat_messages 表里查出这一轮聊的所有话
    res = supabase.table("chat_messages") \
        .select("sender, content, created_at") \
        .eq("session_id", s_id) \
        .order("created_at", desc=False) \
        .execute()
    return res.data