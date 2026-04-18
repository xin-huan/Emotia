# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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