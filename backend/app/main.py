# backend/app/main.py
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date # 导入日期模块

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

# 定义前端入参格式
class ChatRequest(BaseModel):
    session_id: str
    user_id: str
    message: str

@app.get("/")
def index():
    return {"status": "online"}

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    # 1. 存入用户消息到数据库 (Supabase)
    user_msg_data = {
        "session_id": req.session_id,
        "sender": "user",
        "content": req.message
    }
    supabase.table("chat_messages").insert(user_msg_data).execute()

    # 2. 调用 Agent 核心逻辑
    agent_res = process_cbt_chat(req.session_id,req.user_id, req.message)


    # 4. 返回给前端
    return agent_res

# backend/app/main.py (新增部分)

# 1. 定义用户认证的数据模型
class UserAuthRequest(BaseModel):
    email: str
    password: str

# 2. 注册接口
@app.post("/api/signup")
def signup(req: UserAuthRequest):
    try:
        # 调用 Supabase 内置的注册函数
        response = supabase.auth.sign_up({
            "email": req.email,
            "password": req.password,
        })
        
        # 这里的 response.user 里包含了唯一的 user_id (UUID)
        return {
            "status": "success", 
            "message": "注册成功！", 
            "user_id": response.user.id 
        }
    except Exception as e:
        return {"status": "error", "message": f"注册失败: {str(e)}"}

# 3. 登录接口
@app.post("/api/login")
def login(req: UserAuthRequest):
    try:
        # 调用 Supabase 内置的登录函数
        response = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })
        
        # 登录成功后，返回用户信息和 access_token
        return {
            "status": "success",
            "message": "登录成功！",
            "data": {
                "user_id": response.user.id,
                "email": response.user.email,
                "access_token": response.session.access_token # 前端可以用这个存入本地缓存
            }
        }
    except Exception as e:
        # 如果账号不存在或密码错误，会跳到这里
        return {"status": "error", "message": "邮箱或密码错误，请检查后再试。"}
    


# 1. 定义资料更新的模型
class ProfileUpdate(BaseModel):
    user_id: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    birthday: Optional[str] = None # 格式 "YYYY-MM-DD"

# 2. 接口：获取个人资料
@app.get("/api/user/profile/{user_id}")
def get_profile(user_id: str):
    res = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    return res.data

# 推荐：第二版的校验逻辑 + 第一版的更新策略
@app.put("/api/user/profile")
def update_profile(req: ProfileUpdate):
    # 1. 自动过滤掉未传入的字段 (来自第二版，更可靠)
    update_data = req.dict(exclude_unset=True)
    
    # 2. 格式校验 (来自第二版，更安全)
    if "birthday" in update_data and update_data["birthday"]:
        try:
            date.fromisoformat(update_data["birthday"])
        except ValueError:
            return {"status": "error", "message": "生日格式不正确，请使用 YYYY-MM-DD 格式"}
    
    # 3. 执行更新 (来自第一版，更符合语义)
    # 确保 user_id 存在且正确
    if not req.user_id:
        return {"status": "error", "message": "缺少用户ID"}
        
    res = supabase.table("profiles") \
        .update(update_data) \
        .eq("id", req.user_id) \
        .execute()
    
    # 可选：检查是否更新成功（如果记录不存在，res.data 可能为空）
    if not res.data:
        return {"status": "error", "message": "用户资料不存在"}
    
    return {"status": "success", "message": "资料已更新", "data": res.data}

#问答界面模型定义

class PostCreate(BaseModel):
    user_id: str
    category_id: int
    title: str
    content: str

class AnswerCreate(BaseModel):
    post_id: str
    user_id: str
    content: str
#问答界面接口
# 修改后的获取帖子列表接口

# A. 获取所有分类 (前端画顶部 Tab 或侧边栏用)
@app.get("/api/forum/categories")
def get_categories():
    res = supabase.table("forum_categories").select("*").execute()
    return res.data

# B. 获取帖子列表 (支持按分类筛选)
@app.get("/api/forum/posts")
def get_posts(category_id: int = None):
    # 注意这里的 select：它会顺着 user_id 自动去 profiles 表里抓 username 和 avatar_url
    query = supabase.table("forum_posts").select("*, profiles(username, avatar_url), forum_categories(name)")
    
    if category_id:
        query = query.eq("category_id", category_id)
        
    res = query.order("created_at", desc=True).execute()
    return res.data

# C. 发布新帖子 (提问)
@app.post("/api/forum/posts")
def create_post(post: PostCreate):
    data = post.dict()
    res = supabase.table("forum_posts").insert(data).execute()
    return {"status": "success", "data": res.data}

# D. 获取帖子详情及其所有回答
@app.get("/api/forum/posts/{post_id}")
def get_post_detail(post_id: str):
    # 查帖子内容
    post_res = supabase.table("forum_posts").select("*, profiles(username)").eq("id", post_id).single().execute()
    # 查关联的所有回答
    answers_res = supabase.table("forum_answers").select("*, profiles(username)").eq("post_id", post_id).order("created_at").execute()
    return {
        "post": post_res.data,
        "answers": answers_res.data
    }

# E. 提交回答
@app.post("/api/forum/answers")
def create_answer(ans: AnswerCreate):
    data = ans.dict()
    res = supabase.table("forum_answers").insert(data).execute()
    return {"status": "success", "data": res.data}

# F. 获取“我的帖子”（个人中心用）
@app.get("/api/user/my-posts/{user_id}")
def get_my_posts(user_id: str):
    res = supabase.table("forum_posts").select("*").eq("user_id", user_id).execute()
    return res.data