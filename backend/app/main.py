from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import date
import os

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

class TestSubmitRequest(BaseModel):
    user_id: str
    test_id: str
    answers: List[dict] # 每一题的选择，例如 [{"question_id": "xxx", "score": 2}, ...]

# ======= 核心业务接口 =======

@app.get("/")
def index():
    return {"status": "online"}

# 1. 聊天接口
@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    # A. 存入用户消息到数据库
    user_msg_data = {
        "session_id": req.session_id,
        "sender": "user",
        "content": req.message
    }
    supabase.table("chat_messages").insert(user_msg_data).execute()

    # B. 调用 Agent 核心逻辑
    agent_res = process_cbt_chat(req.session_id, req.user_id, req.message)

    # C. 存入 Agent 回复到数据库
    agent_msg_data = {
        "session_id": req.session_id,
        "sender": "agent",
        "content": agent_res["reply"],
        "cbt_stage": agent_res["cbt_stage"]
    }
    supabase.table("chat_messages").insert(agent_msg_data).execute()

    return agent_res

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

@app.get("/api/forum/posts")
def get_posts(category_id: int = None):
    query = supabase.table("forum_posts").select("*, profiles(username, avatar_url), forum_categories(name)")
    if category_id:
        query = query.eq("category_id", category_id)
    res = query.order("created_at", desc=True).execute()
    return res.data

@app.post("/api/forum/posts")
def create_post(post: PostCreate):
    try:
        data = post.dict()
        res = supabase.table("forum_posts").insert(data).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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

# ======= 心理测评模块 API =======

@app.get("/api/tests")
def get_all_tests():
    res = supabase.table("tests").select("*").execute()
    return res.data

@app.get("/api/tests/{test_id}/questions")
def get_test_questions(test_id: str):
    res = supabase.table("test_questions").select("*").eq("test_id", test_id).order("sort_order").execute()
    return res.data

@app.post("/api/tests/submit")
def submit_test(req: TestSubmitRequest):
    total_score = sum([ans["score"] for ans in req.answers])
    if total_score <= 4: level = "暂无明显焦虑"
    elif total_score <= 9: level = "轻度焦虑"
    elif total_score <= 14: level = "中度焦虑"
    else: level = "重度焦虑"

    radar_data = [
        {"name": "紧张不安", "value": total_score // 4 + 1},
        {"name": "无法控制担忧", "value": total_score // 5 + 2},
        {"name": "过度担心", "value": total_score // 6 + 1},
        {"name": "很难放松", "value": 3},
        {"name": "容易烦躁", "value": 2}
    ]

    result_data = {
        "user_id": req.user_id,
        "test_id": req.test_id,
        "total_score": total_score,
        "result_level": level,
        "radar_data": radar_data
    }
    supabase.table("user_test_results").insert(result_data).execute()
    
    return {
        "status": "success",
        "total_score": total_score,
        "result_level": level,
        "radar_data": radar_data,
        "suggestion": f"根据您的得分，您的焦虑水平处于 {level} 状态。建议尝试我们的 CBT Agent 模块进行调节。"
    }