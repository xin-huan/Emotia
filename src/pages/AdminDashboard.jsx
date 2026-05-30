import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [riskPosts, setRiskPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [riskData, setRiskData] = useState({ posts: [], answers: [] });
  const [activeTab, setActiveTab] = useState('overview');
  const API_BASE = "http://localhost:8000/api/admin";
  const [allTests, setAllTests] = useState([]);

  const userId = localStorage.getItem('user_id');
  const authHeaders = { 'Content-Type': 'application/json', 'x-user-id': userId || '' };

  // 管理员身份校验：非管理员自动踢出
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/user/role/${userId}`);
        const data = await res.json();
        if (data.role !== 'admin') {
          alert('无权访问：仅限管理员');
          window.location.href = '/home';
        }
      } catch {
        window.location.href = '/home';
      }
    };
    if (!userId) {
      window.location.href = '/home';
      return;
    }
    checkAdmin();
  }, []);

  // 初始化加载
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchStats(), fetchUsers(), fetchRiskData(), fetchTestsAdmin()]);
      } catch (err) {
        console.error("数据加载失败", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
    fetchTestsAdmin();
  }, []);

  const fetchStats = async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: authHeaders });
    const data = await res.json();
    setStats(data);
  };

  const fetchUsers = async () => {
    const res = await fetch(`${API_BASE}/users`, { headers: authHeaders });
    const data = await res.json();
    setUsers(data || []);
  };

  const fetchTestsAdmin = async () => {
    console.log("🌊 开始请求全量表数据...");
    try {
      const res = await fetch(`${API_BASE}/tests`, { headers: authHeaders });
      console.log("📡 网络响应状态:", res.status);
      
      const data = await res.json();
      console.log("📦 后端返回的原始数组:", data); // 🚀 看看这里是不是 []
      console.log("📦 刷新状态：拿到量表数:", data.length);
      setAllTests(data || []);
    } catch (err) {
      console.error("🔥 Fetch 请求崩溃了:", err);
    }
  };
    // 🚀 核心功能：切换上架/下架状态
  const handleToggleTest = async (tid, currentStatus) => {
    const res = await fetch(`http://localhost:8000/api/admin/tests/toggle`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ test_id: tid, is_active: !currentStatus })
    });
    if (res.ok) {
      alert(!currentStatus ? "✅ 量表已重新上架" : "🚫 量表已成功下架");
      fetchTestsAdmin(); // 刷新列表
    }
  };
  

  const fetchRiskData = async () => {
    try {
      const res = await fetch(`${API_BASE}/risk-items`, { headers: authHeaders });
      const data = await res.json();
      // 🚀 这里的 data 格式应该是 { posts: [...], answers: [...] }
      setRiskData(data || { posts: [], answers: [] });
    } catch (err) {
      console.error("获取风险项失败", err);
    }
  };

  // 🚀 处理审核：通过或删除
  const handleReview = async (pid, action, type = 'post') => {
    try {
      const res = await fetch(`${API_BASE}/posts/review`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ post_id: pid, action,target_type: type })
      });
      if (res.ok) {
        alert(action === 'approve' ? "✅ 帖子已设为公开可见" : "🗑️ 违规内容已清理");
        if (typeof fetchRiskData === 'function') {
          fetchRiskData(); 
        }
        fetchStats();     // 刷新顶部计数
      }
      else {
        const errorData = await res.json();
        alert(`操作失败：${errorData.detail || '服务器拒绝了请求'}`);
      }
    } catch (err) {
      // 🚀 分支 3：网络彻底断了或代码逻辑崩溃
      console.error("代码运行崩溃:", err);
      alert("网络异常或程序内部错误");
    }
  };

  // 封禁用户
  const handleBan = async (uid, currentStatus) => {
    const res = await fetch(`${API_BASE}/users/ban`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ user_id: uid, is_banned: !currentStatus })
    });
    if (res.ok) fetchUsers();
  };

  // 同步词库
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSyncLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const res = await fetch(`${API_BASE}/sensitive-words/sync`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ file_content: event.target.result })
      });
      const data = await res.json();
      if (res.ok) alert(`同步成功！导入 ${data.count} 条。请重启后端生效。`);
      setSyncLoading(false);
    };
    reader.readAsText(file);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="animate-pulse font-black tracking-widest text-xl">CONNECTING TO SYSTEM...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-10 pt-32 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-10 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">控制台大屏</h1>
            <p className="text-slate-500 text-sm">全站实时监控、风险内容审计与用户生命周期管理</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 🚀 这里的按钮会触发全量数据同步 */}
            <button 
              onClick={() => { fetchStats(); fetchUsers(); fetchRiskData(); }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl transition-all border border-slate-700 flex items-center justify-center group"
              title="同步最新数据"
            >
              <span className="text-xl group-active:rotate-180 transition-transform duration-500">↻</span>
            </button>

            <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 h-fit">
              {['overview', 'users', 'moderation','tests'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {tab === 'overview' ? '数据指标' : tab === 'users' ? '用户审计' : tab === 'moderation' ?  '风险审核':'测评管理'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1. 核心指标卡片 (仅在概览显示) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-top-4">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-4 tracking-widest">今日心情均分</p>
              <p className="text-5xl font-black text-pink-500">{stats?.avg_mood || '0'} <span className="text-sm opacity-30">pts</span></p>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-4 tracking-widest">AI vs 测评 (热度)</p>
              <p className="text-3xl font-black text-blue-400">{stats?.usage_ratio?.agent} : {stats?.usage_ratio?.test}</p>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-4 tracking-widest">用户转化率</p>
              <p className="text-5xl font-black text-green-400">{stats?.conversion_rate}</p>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-red-900/40 shadow-xl">
              <p className="text-red-500 text-[10px] font-black uppercase mb-4 tracking-widest">待审风险内容</p>
              <p className="text-5xl font-black text-red-500">{stats?.risk_count}</p>
            </div>
          </div>
        )}

        {/* 2. 敏感词同步 (概览页面) */}
        {activeTab === 'overview' && (
          <div className="bg-indigo-900/10 p-10 rounded-[3rem] border border-indigo-500/20 mb-10 flex justify-between items-center animate-in fade-in">
            <div>
              <h3 className="text-xl font-bold text-indigo-300">🛡️ 全局敏感词库同步</h3>
              <p className="text-slate-500 text-sm mt-1">支持从 GitHub 导入 TXT 格式词库。更新后将立即拦截新发帖。</p>
            </div>
            <label className={`cursor-pointer px-10 py-4 rounded-full font-black text-sm transition-all ${syncLoading ? 'bg-slate-800 text-slate-600' : 'bg-white text-black hover:bg-pink-500 hover:text-white'}`}>
              {syncLoading ? "正在重构安检模型..." : "上传词库文件 (.txt)"}
              <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" disabled={syncLoading} />
            </label>
          </div>
        )}

        {/* 3. 风险审核列表 (MODERATION TAB) */}
        {activeTab === 'moderation' && (
          <div className="space-y-12 animate-in slide-in-from-right-4">
            
            {/* A. 待审帖子部分 */}
            <section className="space-y-6">
              <h3 className="text-2xl font-black text-red-500 flex items-center gap-3">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                风险帖子审计 ({riskData.posts?.length || 0})
              </h3>
              {riskData.posts?.map(post => (
                <div key={post.id} className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold text-pink-400">发帖人: {post.profiles?.username || '匿名'}</span>
                      <span className="text-[10px] text-slate-600 font-mono">{post.id}</span>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">{post.title}</h4>
                    <p className="text-slate-400 leading-relaxed bg-slate-950 p-6 rounded-2xl border border-white/5 italic">"{post.content}"</p>
                    
                    {/* 举报反馈显示逻辑 */}
                    {post.forum_reports && post.forum_reports.length > 0 ? (
                      <div className="mt-4 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-red-400 text-xs">
                        🚨 举报反馈：{post.forum_reports[0]?.reason} 
                        (举报人 ID: {post.forum_reports[0]?.reporter_id?.slice(0, 8) || '系统检测'})
                      </div>
                    ) : (
                      <div className="mt-4 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-amber-400 text-xs">
                        🤖 系统安检：检测到疑似违禁词汇。
                      </div>
                    )}
                  </div>
                  <div className="flex md:flex-col gap-3 justify-center">
                    <button onClick={() => handleReview(post.id, 'approve', 'post')} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-black text-xs transition-all">准予公开</button>
                    <button onClick={() => handleReview(post.id, 'delete', 'post')} className="bg-red-600/10 text-red-500 border border-red-500/50 hover:bg-red-600 hover:text-white px-8 py-3 rounded-full font-black text-xs transition-all">确认违规删除</button>
                  </div>
                </div>
              ))}
            </section>

            {/* B. 待审评论部分 (新增) */}
            <section className="space-y-6 pt-10 border-t border-slate-800">
              <h3 className="text-xl font-bold text-orange-500 flex items-center gap-3">
                💬 风险回复审计 ({riskData.answers?.length || 0})
              </h3>
              {riskData.answers?.map(ans => (
                <div key={ans.id} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex justify-between items-center gap-6">
                  <div className="flex-1">
                    <p className="text-xs text-orange-400 mb-2">回复人：{ans.profiles?.username || '匿名'} 针对帖子: {ans.post_id?.slice(0,8)}</p>
                    <p className="text-slate-200 text-sm bg-slate-950 p-4 rounded-xl">"{ans.content}"</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleReview(ans.id, 'approve', 'answer')} className="bg-green-600/20 text-green-500 p-2 rounded-lg hover:bg-green-600 hover:text-white transition-all text-xs font-bold">通过</button>
                    <button onClick={() => handleReview(ans.id, 'delete', 'answer')} className="bg-red-600/20 text-red-500 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all text-xs font-bold">删除</button>
                  </div>
                </div>
              ))}
              {riskData.posts?.length === 0 && riskData.answers?.length === 0 && (
                <div className="text-center py-40 text-slate-600 font-bold italic">当前社区环境纯净，暂无违规内容 ✨</div>
              )}
            </section>
          </div>
        )}
        {/* --- 🚀 测评管理 TAB 内容区 --- */}
        {activeTab === 'tests' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* 增加一个内部状态判断，防止数据还没同步完 */}
            <h3 className="text-2xl font-black text-white mb-8 flex justify-between items-center">
              全库量表管理 
              <span className="text-sm font-normal text-slate-500">共加载 {allTests.length} 套专业量表</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allTests.length > 0 ? allTests.map(test => (
                <div key={test.id} className={`p-6 rounded-[2rem] border-2 transition-all flex justify-between items-center ${test.is_active ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-red-900/20 opacity-60'}`}>
                  <div className="flex items-center gap-4">
                    {/* 这里的 icon 也要加上可选链判断，防止数据库里有的没填 icon */}
                    <span className="text-3xl">{test.icon || "📑"}</span>
                    <div>
                      <p className="font-bold text-slate-200">{test.title}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{test.abbreviation || 'N/A'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggleTest(test.id, test.is_active)}
                    className={`px-6 py-2 rounded-full text-[10px] font-black transition-all ${
                      test.is_active 
                      ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
                      : 'bg-green-600 text-white'
                    }`}
                  >
                    {test.is_active ? '立即下架' : '重新上架'}
                  </button>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center text-slate-600 italic">
                  正在从数据库搬运 118 套量表...
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. 用户权限列表 (USERS TAB) */}
        {activeTab === 'users' && (
          <div className="bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-2xl animate-in slide-in-from-left-4">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-white">用户生命周期审计</h3>
              <span className="text-slate-500 text-xs font-bold">已同步 {users.length} 名用户身份</span>
            </div>
            <div className="grid gap-4">
              {users.map(u => (
                <div key={u.id} className="bg-slate-950 p-6 rounded-3xl flex justify-between items-center border border-transparent hover:border-slate-800 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-xl">👤</div>
                    <div>
                      <p className="font-bold text-slate-200">{u.username || '匿名指挥官'}</p>
                      <p className="text-[10px] text-slate-600 font-mono">{u.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-600 font-black uppercase mb-1">Privilege</p>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${u.role === 'admin' ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-800 text-slate-500'}`}>
                        {u.role?.toUpperCase() || 'USER'}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleBan(u.id, u.is_banned)}
                      className={`px-8 py-3 rounded-full text-[10px] font-black tracking-widest transition-all ${u.is_banned ? 'bg-green-600 text-white' : 'bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white'}`}
                    >
                      {u.is_banned ? 'RESTORE' : 'RESTRICT'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}