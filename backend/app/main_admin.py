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
        risk_posts = supabase.table("forum_posts").select("id", count="exact").eq("status", "flagged").execute().count or 0
        
        return {
            "avg_mood": round(avg_mood, 1),
            "usage_ratio": {"agent": agent_count, "test": test_count},
            "conversion_rate": f"{conversion}%",
            "risk_count": risk_posts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
def get_all_users_admin():
    res = supabase.table("profiles").select("*").order("created_at", desc=True).execute()
    return res.data

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