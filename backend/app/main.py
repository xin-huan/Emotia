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
from app import scoring_engine 
from datetime import datetime, timedelta, timezone
# 导入你的包装器和数据库
from agent.core import process_cbt_chat
from app.database import supabase  # 确保你有这个文件
# 🚀 1. 引入管理员路由模块
from app import main_admin

app = FastAPI(title="MindFlow CBT API")

# 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(main_admin.router, prefix="/api/admin", tags=["管理员后台"])
# 🚀 全局内存词库：为了快，我们不直接在 API 里查数据库
SENSITIVE_SET = set()

@app.on_event("startup")
async def load_sensitive_words():
    """服务器启动时，把数据库里的词全部加载到内存 Set 中"""
    print("⏳ 正在加载敏感词库到内存...")
    res = supabase.table("sensitive_words").select("word").execute()
    global SENSITIVE_SET
    SENSITIVE_SET = {row['word'] for row in res.data}
    print(f"✅ 词库加载完毕，共 {len(SENSITIVE_SET)} 个词")


from langchain_community.chat_models import ChatZhipuAI

# 2. 初始化 GLM 实例 (建议放在函数外面，这样不需要每次调用都初始化)
# 将 '你的智谱APIKEY' 换成你真实申请到的 Key
glm_llm = ChatZhipuAI(
    model="glm-4-flash", # 这是免费版模型名称
    api_key="aa576cdcbdf845538356e23b06beb2f7.tl0SZDpcXflIuBPa", 
    temperature=0.3      # 测评分析不需要太高的随机性，0.3 比较稳重
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
    birthday: Optional[str] = None  # 格式 "YYYY-MM-DD"


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
    answers: List[dict]  # 每一题的选择，例如 [{"question_id": "xxx", "score": 2}, ...]


class EmotionRequest(BaseModel):
    user_id: str
    emotion_score: int


class SunshineRequest(BaseModel):
    user_id: str
    content: str

class TaskToggleRequest(BaseModel):
    task_id: str
    is_completed: bool
# ======= AI调用 =======
async def generate_ai_report(title: str, score: int, radar_data: list, interpretation: str):
    prompt = f"""
    你是一位专业的心理测评专家。用户刚刚完成了《{title}》量表。
    
    【测评数据】
    - 总分：{score}
    - 维度得分：{radar_data}
    - 计分常模与解释：{interpretation}
    
    【任务】
    请结合数据写一份分析报告。
    
    【输出要求】
    严格按以下格式输出，严禁任何前言：
    结论：[5-10字]
    解析：[200-300字，包含建议]
    """

    try:
        # 🚀 关键修改：这里不再从 agent 导入，而是直接用上面定义好的 glm_llm
        # 注意：GLM-4 在 LangChain 中目前主要支持 invoke (同步)，
        # 如果报错不支持 ainvoke，就用 .invoke()
        response = glm_llm.invoke(prompt) 
        content = response.content.strip()
        
        print(f"🤖 GLM-4 原始回复：\n{content}")

        # --- 解析逻辑保持不变 ---
        import re
        conclusion_match = re.search(r"结论[：:](.*?)(?=解析[：:]|$)", content, re.S)
        analysis_match = re.search(r"解析[：:](.*)", content, re.S)

        if conclusion_match and analysis_match:
            level_part = conclusion_match.group(1).strip()
            analysis_part = analysis_match.group(1).strip()
        else:
            level_part = "分析完成"
            analysis_part = content

        return level_part, analysis_part

    except Exception as e:
        print(f"❌ GLM 调用失败: {e}")
        return "测评完成", f"您的得分是 {score}。由于分析引擎繁忙，请参考量表提供的标准进行评估。"

# ======= 核心业务接口 =======

@app.get("/")
def index():
    return {"status": "online"}


# 1. 聊天接口
@app.post("/api/chat/stream")
async def chat_endpoint(req: ChatRequest):
    # 先在 cbt_sessions 表里占个位
    preview_text = (req.message[:15] + '...') if len(req.message) > 15 else req.message
    try:
        # 🚀 [核心修复] 先看这人是不是被封了
        user_status = supabase.table("profiles").select("is_banned").eq("id", post.user_id).single().execute()
        if user_status.data and user_status.data.get("is_banned"):
            raise HTTPException(status_code=403, detail="账号异常，操作被拒绝")
        supabase.table("cbt_sessions").upsert({
            "id": req.session_id,
            "user_id": req.user_id,
            "raw_event": f"🗨️ {preview_text}"
        }).execute()
    except Exception as e:
        pass

    # 1. 记录用户消息
    user_msg_data = {
        "session_id": req.session_id,
        "sender": "user",
        "content": req.message,
        "user_id": req.user_id
    }
    supabase.table("chat_messages").insert(user_msg_data).execute()

    # 2. 调用 Agent 获取结果
    agent_res = process_cbt_chat(req.session_id, req.user_id, req.message)
    
    print(f"📦 [API准备发货] agent_res里的数据: {agent_res.get('full_emotions')}")

    # 3. 记录 Agent 消息
    agent_msg_data = {
        "session_id": req.session_id,
        "sender": "agent",
        "content": agent_res["reply"],
        "cbt_stage": agent_res["cbt_stage"]
    }
    supabase.table("chat_messages").insert(agent_msg_data).execute()

    # 4. 构造 SSE 生成器
    async def sse_generator():
        print(f"📡 发送前端数据: {agent_res.get('full_emotions')}")
        whitebox_data = {
            'type': 'data_update',
            'emotion_tags': agent_res.get('full_emotions', {}),
            'evidences': agent_res.get('evidences', [])
        }
        yield f"data: {json.dumps(whitebox_data, ensure_ascii=False)}\n\n"
        print(f"📡 [SSE发送] 最终发往前端的数据: {whitebox_data['emotion_tags']}")

        full_reply = agent_res['reply']
        chunk_size = 2
        for i in range(0, len(full_reply), chunk_size):
            chunk = full_reply[i:i + chunk_size]
            text_data = {'type': 'text_chunk', 'content': chunk}
            yield f"data: {json.dumps(text_data, ensure_ascii=False)}\n\n"
            await asyncio.sleep(0.03)

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")


# 2. 注册接口
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


# 3. 登录接口
@app.post("/api/login")
def login(req: UserAuthRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })
        user_id = response.user.id

        # 2. 🚀 [核心修复] 校验 profiles 表中的 is_banned 字段
        profile_res = supabase.table("profiles").select("is_banned").eq("id", user_id).single().execute()
        
        if profile_res.data and profile_res.data.get("is_banned") == True:
            # 如果被封禁，手动抛出异常，不给前端返回 token
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="您的账号因违反社区规定已被封禁，无法登录。"
            )
        return {
            "status": "success",
            "message": "登录成功！",
            "data": {
                "user_id": response.user.id,
                "email": response.user.email,
                "access_token": response.session.access_token
            }
        }
    except HTTPException as he:
        raise he
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
    p_id = post_id.strip('"').strip("'")
    post_res = supabase.table("forum_posts").select("*, profiles(username, avatar_url), forum_categories(name)").eq(
        "id", p_id).single().execute()
    answers_res = supabase.table("forum_answers").select("*, profiles(username, avatar_url)").eq("post_id", p_id).order(
        "created_at", desc=False).execute()
    return {"post": post_res.data, "answers": answers_res.data}


@app.post("/api/forum/answers")
def create_answer(ans: AnswerCreate):
    try:
        # 🚀 [核心修复] 先看这人是不是被封了
        user_status = supabase.table("profiles").select("is_banned").eq("id", post.user_id).single().execute()
        if user_status.data and user_status.data.get("is_banned"):
            raise HTTPException(status_code=403, detail="账号异常，操作被拒绝")
        answer_status = "normal"
        for word in SENSITIVE_SET:
            if word in ans.content:
                answer_status = "flagged"
                break
        data = ans.dict()
        data["status"] = answer_status
        res = supabase.table("forum_answers").insert(data).execute()
        return {"status": "success", "data": res.data}
        # 🚀 2. 通知原帖作者 (如果审核通过)
        if answer_status == "normal":
            post = supabase.table("forum_posts").select("user_id").eq("id", ans.post_id).single().execute()
            if post.data and post.data['user_id'] != ans.user_id:
                supabase.table("notifications").insert({
                    "receiver_id": post.data['user_id'],
                    "actor_id": ans.user_id,
                    "post_id": ans.post_id,
                    "type": "comment"
                }).execute()

        return {
            "status": "success" if answer_status == "normal" else "pending",
            "message": "发布成功" if answer_status == "normal" else "评论包含敏感词，正等待审核"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/forum/posts")
def create_post(post: PostCreate):
    try:
        # 🚀 [核心修复] 先看这人是不是被封了
        user_status = supabase.table("profiles").select("is_banned").eq("id", post.user_id).single().execute()
        if user_status.data and user_status.data.get("is_banned"):
            raise HTTPException(status_code=403, detail="账号异常，操作被拒绝")
        # 防御 undefined 字符串
        if post.user_id == "undefined" or not post.user_id:
            raise HTTPException(status_code=401, detail="未登录或用户身份无效")
        # [新增检测逻辑] 变量名 data 和 res 保持完全不动
        post_status = "normal"
        full_text = post.title + post.content
        
        # 极速扫描内存中的 Set
        for word in SENSITIVE_SET:
            if word in full_text:
                post_status = "flagged" # 命中则标记为待审核
                break
        data = post.dict()
        # [新增] 将扫描结果注入字典，存入数据库的 status 列
        data["status"] = post_status 
        res = supabase.table("forum_posts").insert(data).execute()
        # 🚀 重点：如果是敏感词，给前端返回特定状态
        if post_status == "flagged":
            return {
                "status": "pending", 
                "message": "⚠️ 提示：内容包含敏感词，已提交人工审核，审核通过前仅自己可见。"
            }
        return {"status": "success", "data": res.data}
    except Exception as e:
        print(f"❌ 发布失败详情: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# 🚀 新增：举报接口
# 修改后的举报接口 (统一处理帖子和评论举报)
class UnifiedReportRequest(BaseModel):
    reporter_id: str
    target_id: str # 帖子ID或评论ID
    target_type: str # 'post' 或 'answer'
    reason: str

@app.post("/api/forum/report")
def report_content(req: UnifiedReportRequest):
    try:
        # 1. 构造存入举报表的数据
        report_data = {
            "reporter_id": req.reporter_id,
            "reason": req.reason
        }
        
        # 2. 根据类型，把 ID 填进对应的坑里，并修改目标状态
        if req.target_type == 'post':
            report_data["post_id"] = req.target_id
            # 将帖子设为待审核
            supabase.table("forum_posts").update({"status": "flagged"}).eq("id", req.target_id).execute()
        else:
            report_data["answer_id"] = req.target_id
            # 将评论设为待审核
            supabase.table("forum_answers").update({"status": "flagged"}).eq("id", req.target_id).execute()
        
        # 3. 写入举报记录表
        supabase.table("forum_reports").insert(report_data).execute()
        
        return {"status": "success", "message": "举报已受理"}
    except Exception as e:
        print(f"❌ 举报失败: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/user/my-posts/{user_id}")
def get_my_posts(user_id: str):
    res = supabase.table("forum_posts").select("*").eq("user_id", user_id).execute()
    return res.data


@app.get("/api/forum/posts")
def get_posts(sort: str = "latest", category_id: int = None, viewer_id: str = None, limit: int = 6):
    query = supabase.table("forum_posts").select(
        "*, profiles!user_id(username, avatar_url), forum_likes(count), forum_answers(count)"
    ).eq("status", "normal")# 👈 关键点：普通用户不看 flagged 贴
    try:
    # 增加 .eq("status", "normal") 过滤掉待审核的帖子
        query = supabase.table("forum_posts").select(
        "*, profiles!user_id(username, avatar_url), forum_likes(count), forum_answers(count)"
        ).eq("status", "normal")
        if category_id:
            query = query.eq("category_id", category_id)

        res = query.execute()
        all_data = res.data

        liked_post_ids = []
        if viewer_id and viewer_id not in ["undefined", "null", ""]:
            likes_res = supabase.table("forum_likes").select("post_id").eq("user_id", viewer_id).execute()
            liked_post_ids = [item['post_id'] for item in likes_res.data]

        if sort == "hot":
            for post in all_data:
                likes = post['forum_likes'][0]['count'] if post['forum_likes'] else 0
                answers = post['forum_answers'][0]['count'] if post['forum_answers'] else 0
                post['hot_score'] = likes + answers
            processed_posts = sorted(all_data, key=lambda x: x.get('hot_score', 0), reverse=True)
            processed_posts = processed_posts[:10]
        elif sort == "random":
            random.shuffle(all_data)
            processed_posts = all_data[:limit]
        else:
            processed_posts = sorted(all_data, key=lambda x: x['created_at'], reverse=True)
            processed_posts = processed_posts[:limit]

        return {
            "posts": processed_posts,
            "liked_post_ids": liked_post_ids
        }
    except Exception as e:
        print(f"❌ 论坛列表接口崩溃详情: {e}")
        # 即使逻辑错，也要返回符合结构的空数据，防止前端白屏
        return {"posts": [], "liked_post_ids": []}


@app.post("/api/forum/like/toggle")
def toggle_like(req: dict):
    user_id = req.get("user_id")
    post_id = req.get("post_id")

    existing = supabase.table("forum_likes").select("*").eq("post_id", post_id).eq("user_id", user_id).execute()

    if existing.data:
        supabase.table("forum_likes").delete().eq("post_id", post_id).eq("user_id", user_id).execute()
        return {"status": "unliked"}
    else:
        supabase.table("forum_likes").insert({"post_id": post_id, "user_id": user_id}).execute()
        return {"status": "liked"}


@app.get("/api/user/notifications/{user_id}")
def get_notifications(user_id: str):
    res = supabase.table("notifications") \
        .select("*, actor:profiles!notifications_actor_id_fkey(username), post:forum_posts(content)") \
        .eq("receiver_id", user_id) \
        .eq("is_read", False) \
        .order("created_at", desc=True) \
        .execute()
    return res.data


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
    # 增加 select 字段，确保前端能拿到缩写和分类
    res = supabase.table("tests")\
    .select("id, title, abbreviation, description, icon, tags")\
    .eq("is_active", True) \
    .order("id")\
    .execute()
    return res.data

# B. 获取对应测试的题目和选项 (答题页用)
@app.get("/api/tests/{test_id}/questions")
def get_test_questions(test_id: int):
    # 🚀 必须查出 scale_name，前端可能需要显示，后端计分也需要
    res = supabase.table("test_questions") \
        .select("id, question_text, options, scale_name") \
        .eq("test_id", test_id) \
        .order("sort_order", desc=False) \
        .execute()
    return res.data


# C. 核心：提交测评、自动计算分值并存库
@app.post("/api/tests/submit")
async def submit_test(req: TestSubmitRequest):
    try:
        # 1. 获取元数据
        test_info = supabase.table("tests").select("metadata, abbreviation").eq("id", req.test_id).single().execute()
        if not test_info.data:
            raise HTTPException(status_code=404, detail="未找到量表配置")
            
        this_scale = test_info.data['metadata']
        abbr = test_info.data['abbreviation']

        # 2. 准备题目映射
        questions_res = supabase.table("test_questions") \
            .select("id, sort_order, options") \
            .eq("test_id", req.test_id) \
            .execute()
        
        order_to_choice_map = {}
        id_to_order = {}
        # 为了防止 KeyError，记录一下本套题所有的合法题号
        all_q_orders = [] 

        for q in questions_res.data:
            q_order_str = str(q['sort_order'])
            all_q_orders.append(q_order_str)
            id_to_order[str(q['id'])] = q_order_str
            order_to_choice_map[q_order_str] = {
                i: chr(65 + i) for i in range(len(q['options'])) 
            }

        # 3. 翻译答案
        script_answers = {}
        # 🚀 预填充兜底：如果用户没答，默认选 A (防止脚本报错)
        for order in all_q_orders:
            script_answers[order] = "A"

        for ans in req.answers:
            q_order = id_to_order.get(str(ans.question_id))
            if q_order:
                choice_letter = order_to_choice_map[q_order].get(int(ans.score), "A")
                script_answers[q_order] = choice_letter


        # 4. 动态调用脚本
        scoring_func_name = f"scoring_{abbr}"
        scoring_func = getattr(scoring_engine, scoring_func_name, scoring_engine.scoring_the_scale)
        result_from_script = scoring_func(this_scale, script_answers)


        if not result_from_script or 'items_scores' not in result_from_script:
            raise ValueError("计分脚本未能生成结果")

        # 5. 提取并计算数据
        items_scores = result_from_script.get('items_scores', {})
        total_score = sum(items_scores.values())
        scales_scores = result_from_script.get('scales_scores', {})

        # 6. 构造雷达图数据 (计算维度均分，防止数值过大)
        radar_data = []
        scales_items = this_scale["contents"].get("scales_items", {})
        
        for name, score_val in scales_scores.items():
            # 获取该维度题目数量以计算均分
            q_count = len(scales_items.get(name, [1])) 
            avg_val = round(score_val / q_count, 2)
            radar_data.append({"name": name, "value": avg_val})

        # 获取元数据及说明
        test_info = supabase.table("tests").select("title, metadata").eq("id", req.test_id).single().execute()
        raw_interpretation = test_info.data['metadata'].get("interpretation", "分析完成")

        # 🚀 核心修改：接收拆分后的结论和解析
        short_level, full_analysis = await generate_ai_report(
            test_info.data['title'], 
            int(total_score), 
            radar_data, 
            raw_interpretation
        )

        # 存库：result_level 存短的，我们再加个字段存详细的，或者拼在一起
        # 这里建议 result_level 存短的结论
        supabase.table("user_test_results").insert({
            "user_id": req.user_id,
            "test_id": req.test_id,
            "total_score": int(total_score),
            "result_level": short_level,      # 👈 存入短结论：如“轻度经验回避倾向”
            "dimension_scores": radar_data,
            "analysis_text": full_analysis    # 👈 如果你数据库加了这一列就存进去，没加就先不存
        }).execute()

        return {
            "status": "success",
            "data": {
                "score": int(total_score),
                "level": short_level,         # 👈 返回短结论
                "professional_analysis": full_analysis, # 👈 返回长解析
                "radar_data": radar_data
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc() 
        raise HTTPException(status_code=400, detail=str(e))

# D. 获取用户的测评历史记录 (个人空间图表用)
@app.get("/api/user/test-history/{user_id}")
def get_test_history(user_id: str):
    res = supabase.table("user_test_results") \
        .select("id, created_at, total_score, result_level, analysis_text, dimension_scores, tests(title, icon)") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
    return res.data


# --- 个人空间：用户活跃度统计 (支持 7d/30d) ---
@app.get("/api/user/usage-stats/{user_id}")
def get_usage_stats(user_id: str, days: int = 7):

    
    # 1. 获取三方数据：测试、对话、发帖
    tests = supabase.table("user_test_results").select("created_at").eq("user_id", user_id).execute()
    sessions = supabase.table("cbt_sessions").select("created_at").eq("user_id", user_id).execute()
    posts = supabase.table("forum_posts").select("created_at").eq("user_id", user_id).execute()

    stats = {}
    for i in range(days):
        # 倒序排列，保证图表从左往右是时间正序
        d = (datetime.now() - timedelta(days=(days-1-i))).strftime('%m-%d')
        stats[d] = {"test": 0, "agent": 0, "post": 0, "total": 0}

    def fill_stats(rows, key):
        for row in rows:
            dt = datetime.fromisoformat(row['created_at'].replace('Z', '+00:00'))
            d_str = dt.astimezone(timezone(timedelta(hours=8))).strftime('%m-%d')
            if d_str in stats:
                stats[d_str][key] += 1
                stats[d_str]["total"] += 1

    fill_stats(tests.data, "test")
    fill_stats(sessions.data, "agent")
    fill_stats(posts.data, "post")

    return [{"date": k, **v} for k, v in stats.items()]



# ======= 任务与打卡模块 (完全修复版) =======

@app.get("/api/user/sessions/{user_id}")
def get_user_sessions(user_id: str):
    res = supabase.table("cbt_sessions") \
        .select("id, created_at, raw_event") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
    return res.data


@app.get("/api/chat/history/{session_id}")
@app.get("/api/user/session-detail/{session_id}") 
def get_chat_history(session_id: str):
    s_id = session_id.strip('"').strip("'")
    
    # 1. 先去数据库拿这次会话的“元数据” (这里才有 mood_scores 和 evidence_list)
    session_info = supabase.table("cbt_sessions") \
        .select("raw_event, emotion_labels, evidence_list, mood_scores, created_at") \
        .eq("id", s_id).single().execute()
    
    data = session_info.data if session_info.data else {}

    # 2. 🚀 [修复逻辑顺序] 拿到 data 后，再计算开始 vs 结束的对比
    start_mood = {}
    end_mood = {}
    if data.get("mood_scores") and len(data["mood_scores"]) > 0:
        start_mood = data["mood_scores"][0]   # 第一轮打分
        end_mood = data["mood_scores"][-1]    # 最后一轮打分

    # 3. 查出这次会话的所有聊天文字记录
    messages_res = supabase.table("chat_messages") \
        .select("sender, content, created_at, cbt_stage") \
        .eq("session_id", s_id) \
        .order("created_at", desc=False) \
        .execute()
    
    # 4. 提取最新阶段
    last_stage = "未知阶段"
    if messages_res.data:
        for m in reversed(messages_res.data):
            if m.get("cbt_stage"):
                last_stage = m["cbt_stage"]
                break

    # 5. 组合最终包裹
    return {
        "raw_event": data.get("raw_event", "未命名会话"),
        "emotion_labels": data.get("emotion_labels", {}),
        "evidence_list": data.get("evidence_list", []),
        "mood_scores": data.get("mood_scores", []),
        "created_at": data.get("created_at"),
        "current_stage": last_stage,
        "messages": messages_res.data, # 聊天文字列表
        "comparison": {                # 🚀 专门给前端画对比图用的
            "start": start_mood,
            "end": end_mood
        }
    }

@app.get("/api/tasks/{user_id}")
async def get_daily_tasks(user_id: str):
    try:
        today = str(date.today())

        # 1. 查找今日已有任务
        tasks_res = supabase.table("daily_tasks").select("*").eq("user_id", user_id).eq("task_date", today).execute()
        existing_tasks = tasks_res.data

        # 2. 核心修正：精准判断今天是否已有“行为激活”任务
        has_ba_task = any(task.get("source") == "system_random" for task in existing_tasks)

        # 只有在“今天还没有行为激活任务”的情况下，才去池子里抽取
        if not has_ba_task:
            pool_res = supabase.table("system_task_pool").select("*").execute()

            if pool_res.data and len(pool_res.data) > 0:
                random_item = random.choice(pool_res.data)

                new_task = {
                    "user_id": user_id,
                    "task_content": random_item["content"],
                    "task_date": today,
                    "source": "system_random",
                    "is_completed": False
                }

                # 写入数据库，锁定今天的任务
                supabase.table("daily_tasks").insert(new_task).execute()

                # 重新拉取一次，确保返回给前端的数据包含刚刚抽取的任务
                tasks_res = supabase.table("daily_tasks").select("*").eq("user_id", user_id).eq("task_date",
                                                                                                today).execute()
                existing_tasks = tasks_res.data
            else:
                print("⚠️ 警告：system_task_pool 表是空的，无法抽取！")

        # 3. 生成动态引导任务 (阳光储蓄罐 / Agent咨询室)
        guide_tasks = []
        checkin_res = supabase.table("daily_checkins").select("*").eq("user_id", user_id).eq("checkin_date",
                                                                                             today).execute()

        if checkin_res.data and len(checkin_res.data) > 0:
            score = checkin_res.data[0]["emotion_score"]
            if score >= 3:
                sun_res = supabase.table("sunshine_records").select("*").eq("user_id", user_id).eq("record_date",
                                                                                                   today).execute()
                has_sunshine = len(sun_res.data) > 0
                guide_tasks.append({
                    "content": "✨ 在阳光储蓄罐记录一件今天发生的好事吧！",
                    "completed": has_sunshine,
                    "type": "sunshine"
                })
            else:
                guide_tasks.append({
                    "content": "🤖 检测到指挥官心情低落，建议体验一次 Agent 心理咨询",
                    "completed": False,
                    "type": "agent"
                })

        return {"tasks": existing_tasks, "guide_tasks": guide_tasks}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取任务列表失败: {str(e)}")


@app.post("/api/checkin/emotion")
async def submit_emotion(req: EmotionRequest):
    # 彻底拦截异常请求
    if req.user_id == "undefined" or not req.user_id:
        raise HTTPException(status_code=400, detail="非法的用户ID")

    today = str(date.today())

    try:
        # 🔍 1. 先查一下今天是不是已经有打卡记录了
        existing = supabase.table("daily_checkins").select("*").eq("user_id", req.user_id).eq("checkin_date",
                                                                                              today).execute()

        if existing.data and len(existing.data) > 0:
            # 💡 2. 如果今天已经打过卡（可能是之前测试留下的脏数据），我们就更新它的分数
            row_id = existing.data[0]["id"]
            supabase.table("daily_checkins").update({"emotion_score": req.emotion_score}).eq("id", row_id).execute()
            print(f"✅ 更新了今日已有的打卡分数: {req.emotion_score}")
        else:
            # 💡 3. 如果今天是干干净净的第一次打卡，正常插入
            checkin_data = {"user_id": req.user_id, "checkin_date": today, "emotion_score": req.emotion_score}
            supabase.table("daily_checkins").insert(checkin_data).execute()
            print(f"✅ 新增了今日打卡分数: {req.emotion_score}")

        # 4. 判断分支，给前端返回对应动作（由前端触发 fetchTasks 去获取最新任务）
        if req.emotion_score >= 3:
            return {"status": "success", "action": "show_sunshine"}
        else:
            return {"status": "success", "action": "show_agent"}

    except Exception as e:
        print(f"❌ 情绪打卡接口报错: {e}")  # 打印到终端方便排错
        raise HTTPException(status_code=500, detail=f"数据库同步失败: {str(e)}")


@app.post("/api/checkin/sunshine")
async def submit_sunshine(req: SunshineRequest):
    today = str(date.today())
    try:
        supabase.table("sunshine_records").insert(
            {"user_id": req.user_id, "record_date": today, "content": req.content}).execute()
        # 同样，不需要在这里修改 daily_tasks 表，get_daily_tasks 接口会自动判断它完成了没
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"存储失败: {str(e)}")

# 行为激活任务的 打钩/取消打钩 接口
@app.post("/api/tasks/toggle")
async def toggle_task(req: TaskToggleRequest):
    try:
        # 去数据库里把对应的任务状态改成前端传过来的新状态（True 或 False）
        supabase.table("daily_tasks").update({"is_completed": req.is_completed}).eq("id", req.task_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新任务状态失败: {str(e)}")

# --- 个人空间新增：获取用户历史情绪打卡记录 ---
@app.get("/api/user/emotion-history/{user_id}")
def get_emotion_history(user_id: str):
    res = supabase.table("daily_checkins").select("*").eq("user_id", user_id).order("checkin_date", desc=False).execute()
    return res.data

# --- 个人空间新增：获取用户历史阳光储蓄罐记录 ---
@app.get("/api/user/sunshine-history/{user_id}")
def get_sunshine_history(user_id: str):
    res = supabase.table("sunshine_records").select("*").eq("user_id", user_id).order("record_date", desc=True).execute()
    return res.data

#  Agent 联动所需的数据模型与接口
class AgentCompleteRequest(BaseModel):
    user_id: str


class AgentTaskRequest(BaseModel):
    user_id: str
    task_content: str


@app.post("/api/agent/complete")
async def agent_mark_complete(req: AgentCompleteRequest):
    """当用户完成 Stage 5 时，前端调用此接口，将引导任务打钩"""
    today = str(date.today())
    try:
        supabase.table("daily_checkins").update({
            "agent_completed": True
        }).eq("user_id", req.user_id).eq("checkin_date", today).execute()

        supabase.table("daily_tasks").update({
            "is_completed": True
        }).eq("user_id", req.user_id).eq("task_date", today).eq("source", "system_generated").execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"标记完成失败: {str(e)}")

@app.post("/api/agent/custom_task")
async def agent_assign_task(req: AgentTaskRequest):
    """前端从 Stage 5 提取出专属任务后，调用此接口存入今日任务列表"""
    today = str(date.today())
    try:
        new_task = {
            "user_id": req.user_id,
            "task_date": today,
            "task_content": req.task_content,
            "source": "agent_custom",
            "is_completed": False
        }
        supabase.table("daily_tasks").insert(new_task).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"插入专属任务失败: {str(e)}")


@app.get("/api/user/achievements/{user_id}")
def get_user_achievements(user_id: str):
    achievements = {}

    # 1. 第一步：查数据库，把已经解锁的成就全拿出来
    try:
        db_res = supabase.table("user_achievements").select("achievement_key, unlocked_at").eq("user_id",
                                                                                               user_id).execute()
        if db_res.data:
            for item in db_res.data:
                achievements[item["achievement_key"]] = item["unlocked_at"]
    except Exception as e:
        print(f"查成就表异常: {e}")

    # 用一个列表暂存本次调用时刚刚解锁的成就，准备批量写入数据库
    new_unlocked = []

    # 2. 第二步：按需计算。如果某个成就没在 achievements 字典里（没解锁），才去查表计算

    # 【初探心境】
    if "first_session" not in achievements:
        sessions = supabase.table("cbt_sessions").select("created_at").eq("user_id", user_id).execute()
        if sessions.data and len(sessions.data) >= 1:
            timestamp = sessions.data[0]["created_at"]
            achievements["first_session"] = timestamp
            new_unlocked.append({"user_id": user_id, "achievement_key": "first_session", "unlocked_at": timestamp})

    # 【微光捕手】、【向日葵体质】、【周末赏味】
    if "light_catcher" not in achievements or "sunflower" not in achievements or "weekend_joy" not in achievements:
        sunshines = supabase.table("sunshine_records").select("record_date").eq("user_id", user_id).execute()
        if sunshines.data:
            sun_count = len(sunshines.data)

            if sun_count >= 1 and "light_catcher" not in achievements:
                timestamp = sunshines.data[0]["record_date"] + "T00:00:00+08:00"  # 日期补齐时间格式，防止数据库报错
                achievements["light_catcher"] = timestamp
                new_unlocked.append({"user_id": user_id, "achievement_key": "light_catcher", "unlocked_at": timestamp})

            if sun_count >= 5 and "sunflower" not in achievements:
                timestamp = sunshines.data[4]["record_date"] + "T00:00:00+08:00"
                achievements["sunflower"] = timestamp
                new_unlocked.append({"user_id": user_id, "achievement_key": "sunflower", "unlocked_at": timestamp})

            if "weekend_joy" not in achievements:
                for s in sunshines.data:
                    date_obj = datetime.strptime(s["record_date"], "%Y-%m-%d")
                    if date_obj.weekday() >= 5:  # 5是周六，6是周日
                        timestamp = s["record_date"] + "T00:00:00+08:00"
                        achievements["weekend_joy"] = timestamp
                        new_unlocked.append(
                            {"user_id": user_id, "achievement_key": "weekend_joy", "unlocked_at": timestamp})
                        break

    # 【星星之火】
    if "spark" not in achievements:
        checkins = supabase.table("daily_checkins").select("checkin_date").eq("user_id", user_id).execute()
        if checkins.data and len(checkins.data) >= 3:
            timestamp = checkins.data[2]["checkin_date"] + "T00:00:00+08:00"
            achievements["spark"] = timestamp
            new_unlocked.append({"user_id": user_id, "achievement_key": "spark", "unlocked_at": timestamp})

    # 3. 第三步：如果有新解锁的成就，写入数据库。以后这几个成就就直接走第一步拿现成的了！
    if new_unlocked:
        try:
            supabase.table("user_achievements").insert(new_unlocked).execute()
            print(f"✅ 成功将 {len(new_unlocked)} 个新成就持久化到数据库！")
        except Exception as e:
            print(f"❌ 写入新成就异常: {e}")

    return {"status": "success", "data": achievements}