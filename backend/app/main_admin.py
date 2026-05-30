# backend/app/main_admin.py

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
import json

# 🚀 引入你已经在 app.database 中定义好的 supabase 实例
from app.database import supabase 
# 定义路由器，所有的接口都会自动加上 /api/admin 前缀（稍后在 main 里配置）
router = APIRouter()

# ======= 管理员系统数据模型 =======
class BanUserRequest(BaseModel):
    user_id: str
    is_banned: bool

class ScaleStatusRequest(BaseModel):
    test_id: int
    is_active: bool

# ======= 管理员系统接口 =======

# 注意：所有的 @app 改为 @router
# 这里路径可以简化，因为前缀会在 main.py 里统一加

@router.get("/dashboard/stats")
def get_admin_stats():
    today = str(date.today())
    try:
        # 1. 平台热力图：今日心情均分
        mood_res = supabase.table("daily_checkins").select("emotion_score").eq("checkin_date", today).execute()
        avg_mood = sum([r['emotion_score'] for r in mood_res.data]) / len(mood_res.data) if mood_res.data else 0
        
        # 2. 功能热度：Agent vs 测试
        agent_count = supabase.table("cbt_sessions").select("id", count="exact").execute().count or 0
        test_count = supabase.table("user_test_results").select("id", count="exact").execute().count or 0
        
        # 3. 互动转化率
        conversion = round((agent_count / test_count * 100), 1) if test_count > 0 else 0
        
        # 4. 内容风险：待审核帖子
        # 🚀 3. 核心修复：综合统计风险内容 (帖子 + 评论)
        risk_posts_count = supabase.table("forum_posts") \
            .select("id", count="exact") \
            .eq("status", "flagged") \
            .execute().count or 0
            
        risk_answers_count = supabase.table("forum_answers") \
            .select("id", count="exact") \
            .eq("status", "flagged") \
            .execute().count or 0
        
        # 总风险数 = 风险帖子 + 风险评论
        total_risk_count = risk_posts_count + risk_answers_count

        return {
            "avg_mood": round(avg_mood, 1),
            "usage_ratio": {"agent": agent_count, "test": test_count},
            "conversion_rate": f"{conversion}%",
            "risk_count": total_risk_count # 🚀 返回相加后的结果
        }
    except Exception as e:
        print(f"❌ 看板统计失败: {e}")
        return {"avg_mood": 0, "usage_ratio": {"agent":0,"test":0}, "conversion_rate": "0%", "risk_count": 0}

@router.get("/users")
def get_all_users_admin():
    try:
        # 🚀 尝试查询
        res = supabase.table("profiles").select("*").order("created_at", desc=True).execute()
        return res.data if res.data else []
    except Exception as e:
        # 🚀 如果报错，在终端打印出来，但给前端返回空列表，防止 500 导致 CORS 报错
        print(f"❌ 获取用户列表失败: {e}")
        # 如果是因为没有 created_at 报错，我们就尝试不带排序的查询作为兜底
        try:
            res_backup = supabase.table("profiles").select("*").execute()
            return res_backup.data
        except:
            return []

@router.get("/tests") # 🚀 确保这里的路径是 /tests
def get_all_tests_admin():
    try:
        # 💡 管理员接口绝对不能加 .eq("is_active", True)
        # 如果加了，你一旦下架一个量表，它就从这个列表里永远消失了，没法再上架。
        res = supabase.table("tests").select("*").order("id").execute()
        
        # 调试打印：看后端到底从数据库拿到了几条
        print(f"📊 后端管理员接口查询到 {len(res.data) if res.data else 0} 条量表")
        
        return res.data if res.data else []
    except Exception as e:
        print(f"❌ 获取量表失败: {e}")
        return []

@router.post("/users/ban")
def toggle_user_ban(req: BanUserRequest):
    supabase.table("profiles").update({"is_banned": req.is_banned}).eq("id", req.user_id).execute()
    return {"status": "success"}

@router.post("/tests/toggle")
def toggle_test_status(req: ScaleStatusRequest):
    supabase.table("tests").update({"is_active": req.is_active}).eq("id", req.test_id).execute()
    return {"status": "success"}

class SyncWordsRequest(BaseModel):
    file_content: str

@router.post("/sensitive-words/sync")
async def sync_sensitive_words(req: SyncWordsRequest):
    lines = req.file_content.split('\n')
    words = [line.strip() for line in lines if line.strip()]
    
    batch_size = 500
    for i in range(0, len(words), batch_size):
        batch = [{"word": w} for w in words[i:i + batch_size]]
        supabase.table("sensitive_words").upsert(batch).execute()
        
    return {"status": "success", "count": len(words)}

@router.get("/sensitive-words")
def get_sensitive_words(page: int = 1, size: int = 20):
    start = (page - 1) * size
    res = supabase.table("sensitive_words").select("*").range(start, start + size).execute()
    return res.data

# A. 获取待审核/被举报的帖子列表
@router.get("/risk-items")
def get_risk_items():
    try:
        # 1. 抓取所有风险帖子 (status='flagged')
        posts_res = supabase.table("forum_posts") \
            .select("*, profiles!user_id(username)") \
            .eq("status", "flagged") \
            .order("created_at", desc=True) \
            .execute()
        
        posts = posts_res.data or []
        # 为每个帖子手动挂载具体的举报信息
        for post in posts:
            report_info = supabase.table("forum_reports") \
                .select("reason, profiles!reporter_id(username)") \
                .eq("post_id", post["id"]) \
                .execute()
            post["forum_reports"] = report_info.data or []

        # 2. 抓取所有风险评论 (status='flagged')
        answers_res = supabase.table("forum_answers") \
            .select("*, profiles!user_id(username)") \
            .eq("status", "flagged") \
            .order("created_at", desc=True) \
            .execute()
        
        answers = answers_res.data or []
        # 为每个评论手动挂载具体的举报信息
        for ans in answers:
            report_info = supabase.table("forum_reports") \
                .select("reason, profiles!reporter_id(username)") \
                .eq("answer_id", ans["id"]) \
                .execute()
            ans["forum_reports"] = report_info.data or []

        # 3. 🚀 返回统一的大包裹
        return {
            "posts": posts,
            "answers": answers
        }

    except Exception as e:
        print(f"❌ 获取全站风险项失败: {e}")
        return {"posts": [], "answers": []}

# B. 审核操作接口
class ReviewRequest(BaseModel):
    post_id: str
    action: str # 'approve' (通过) 或 'delete' (删除)
    target_type: str = "post"

@router.post("/posts/review")
def review_post(req: ReviewRequest):
    try:
        # 🚀 根据类型动态确定表名
        table_name = "forum_posts" if req.target_type == "post" else "forum_answers"
        
        # 1. 查找作者信息用于发通知 (增加安全判断)
        target_res = supabase.table(table_name).select("user_id, content").eq("id", req.post_id).execute()
        
        if not target_res.data:
            raise HTTPException(status_code=404, detail="未找到目标内容")
            
        author_id = target_res.data[0]['user_id']
        content_preview = target_res.data[0]['content'][:15] + "..."

        if req.action == "approve":
            # 审核通过：变回 normal
            supabase.table(table_name).update({"status": "normal"}).eq("id", req.post_id).execute()
            
            # 发送系统通知
            supabase.table("notifications").insert({
                "receiver_id": author_id,
                "actor_id": author_id,
                "type": "system_approve",
                "post_id": req.post_id if req.target_type == "post" else None,
                "is_read": False
            }).execute()
            return {"message": "审核已通过"}
            
        else:
            # 违规删除：先发通知再删
            supabase.table("notifications").insert({
                "receiver_id": author_id,
                "actor_id": author_id,
                "type": "system_reject",
                "is_read": False
            }).execute()
            
            supabase.table(table_name).delete().eq("id", req.post_id).execute()
            return {"message": "已违规删除"}

    except Exception as e:
        print(f"❌ 审核操作崩溃: {e}")
        raise HTTPException(status_code=500, detail=str(e))