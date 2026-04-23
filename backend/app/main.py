# backend/app/main.py
from fastapi import FastAPI, HTTPException, status
from typing import List, Dict, Any, Optional
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

# 2. 注册接口 (增强版)
@app.post("/api/signup")
def signup(req: UserAuthRequest):
    try:
        # 1. 调用注册
        response = supabase.auth.sign_up({
            "email": req.email,
            "password": req.password,
        })
        
        # 2. 【关键】检查 Supabase 是否真的创建了用户
        # 如果邮箱已存在且你关闭了验证，Supabase 可能返回空用户或特定错误
        if response.user is None:
            return {
                "status": "error", 
                "message": "注册失败：该邮箱可能已被注册，或触发了安全限制。"
            }

        # 3. 结构对齐：建议包装在 data 字典里，方便前端统一处理
        return {
            "status": "success", 
            "message": "注册成功！", 
            "data": {
                "user_id": response.user.id 
            }
        }
    except Exception as e:
        # 如果捕获到异常，一定要返回非 200 的状态码，前端的 response.ok 才会是 false
        print(f"Signup Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"注册失败: {str(e)}"
        )

# 3. 登录接口 (增强版)
@app.post("/api/login")
def login(req: UserAuthRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })
        
        # 登录成功，返回统一的结构
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
        print(f"Login Error: {str(e)}")
        # 这里强制抛出 401 错误，前端 catch 块就能抓到具体的 message
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误，请检查后再试。"
        )


#问答接口
# --- 博客/论坛模块的数据模型 ---
class PostCreate(BaseModel):
    user_id: str
    category_id: int
    title: str
    content: str

class AnswerCreate(BaseModel):
    post_id: str
    user_id: str
    content: str
# --- 博客问答页 API ---

# A. 获取所有分类 (给前端画顶部的 Tab 栏)
@app.get("/api/forum/categories")
def get_categories():
    res = supabase.table("forum_categories").select("*").execute()
    return res.data

# B. 获取帖子列表 (包含用户信息，支持按分类筛选)
@app.get("/api/forum/posts")
def get_posts(category_id: int = None):
    # 注意：这里我们使用了 join 查询，直接把 profiles 表里的昵称和头像抓出来
    query = supabase.table("forum_posts").select("*, profiles(username, avatar_url), forum_categories(name)")
    
    if category_id:
        query = query.eq("category_id", category_id)
        
    res = query.order("created_at", desc=True).execute()
    return res.data

# C. 发布新帖子
@app.post("/api/forum/posts")
def create_post(post: PostCreate):
    try:
        data = post.dict()
        res = supabase.table("forum_posts").insert(data).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# D. 获取帖子详情及其所有的回答
@app.get("/api/forum/posts/{post_id}")
def get_post_detail(post_id: str):
    # 1. 查帖子主内容
    post_res = supabase.table("forum_posts") \
        .select("*, profiles(username, avatar_url), forum_categories(name)") \
        .eq("id", post_id).single().execute()
    
    # 2. 查该帖子下的所有回答
    answers_res = supabase.table("forum_answers") \
        .select("*, profiles(username, avatar_url)") \
        .eq("post_id", post_id) \
        .order("created_at", desc=False).execute()
        
    return {
        "post": post_res.data,
        "answers": answers_res.data
    }

# E. 提交回答
@app.post("/api/forum/answers")
def create_answer(ans: AnswerCreate):
    try:
        data = ans.dict()
        res = supabase.table("forum_answers").insert(data).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    


    
#--- 心理测评模块 数据模型定义 ---
class TestSubmitRequest(BaseModel):
    user_id: str
    test_id: str
    # 每一题的选择，例如 [{"question_id": "xxx", "score": 2}, ...]
    answers: List[dict]


# --- 心理测评模块 API ---

# A. 获取所有测评量表 (用于列表页)
@app.get("/api/tests")
def get_all_tests():
    res = supabase.table("tests").select("*").execute()
    return res.data

# B. 获取某个量表的全部题目 (用于答题页)
@app.get("/api/tests/{test_id}/questions")
def get_test_questions(test_id: str):
    res = supabase.table("test_questions") \
        .select("*") \
        .eq("test_id", test_id) \
        .order("sort_order") \
        .execute()
    return res.data

# C. 核心：提交测评结果并计算分值
@app.post("/api/tests/submit")
def submit_test(req: TestSubmitRequest):
    # 1. 计算总分
    total_score = sum([ans["score"] for ans in req.answers])
    
    # 2. 根据分数匹配等级 (以 GAD-7 标准为例)
    # 0-4: 无, 5-9: 轻度, 10-14: 中度, 15-21: 重度
    if total_score <= 4:
        level = "暂无明显焦虑"
    elif total_score <= 9:
        level = "轻度焦虑"
    elif total_score <= 14:
        level = "中度焦虑"
    else:
        level = "重度焦虑"

    # 3. 构造雷达图数据 (模拟 5 个维度，实际可根据题号分类计算)
    # 前端 Echarts 直接拿这个数组就能画图
    radar_data = [
        {"name": "紧张不安", "value": total_score // 4 + 1},
        {"name": "无法控制担忧", "value": total_score // 5 + 2},
        {"name": "过度担心", "value": total_score // 6 + 1},
        {"name": "很难放松", "value": 3},
        {"name": "容易烦躁", "value": 2}
    ]

    # 4. 存入数据库记录历史
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