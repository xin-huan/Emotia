import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const API_BASE = "http://localhost:8000/api/admin";

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = () => {
    fetch(`${API_BASE}/dashboard/stats`).then(res => res.json()).then(setStats);
  };

  const fetchUsers = () => {
    fetch(`${API_BASE}/users`).then(res => res.json()).then(setUsers);
  };

  const handleBan = (uid, currentStatus) => {
    fetch(`${API_BASE}/users/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: uid, is_banned: !currentStatus })
    }).then(() => fetchUsers());
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10 pt-32">
      <h1 className="text-3xl font-black mb-10 flex items-center gap-3">
        <span className="bg-red-500 p-2 rounded-lg text-sm">ADMIN</span>
        平台管理中心
      </h1>

      {/* 🚀 1. 四大核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
          <p className="text-slate-400 text-xs font-bold uppercase mb-2">今日心情均分</p>
          <p className="text-4xl font-black text-pink-400">{stats?.avg_mood} <span className="text-sm">pts</span></p>
        </div>
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
          <p className="text-slate-400 text-xs font-bold uppercase mb-2">Agent vs 测试</p>
          <p className="text-2xl font-black">{stats?.usage_ratio.agent} : {stats?.usage_ratio.test}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
          <p className="text-slate-400 text-xs font-bold uppercase mb-2">互动转化率</p>
          <p className="text-4xl font-black text-green-400">{stats?.conversion_rate}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-3xl border border-red-900/50">
          <p className="text-slate-400 text-xs font-bold uppercase mb-2">待审核风险内容</p>
          <p className="text-4xl font-black text-red-500">{stats?.risk_count}</p>
        </div>
      </div>

      {/* 🚀 2. 用户审计表格 */}
      <div className="bg-slate-800 rounded-[2rem] p-8 border border-slate-700">
        <h3 className="text-xl font-bold mb-6">用户权限审计</h3>
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700">
              <th className="pb-4">用户名</th>
              <th className="pb-4">角色</th>
              <th className="pb-4">状态</th>
              <th className="pb-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-slate-700/50 last:border-0">
                <td className="py-4 font-medium">{u.username}</td>
                <td className="py-4"><span className="bg-slate-700 px-2 py-1 rounded text-[10px]">{u.role}</span></td>
                <td className="py-4">
                  {u.is_banned ? <span className="text-red-500 text-xs">已封禁</span> : <span className="text-green-500 text-xs">活跃</span>}
                </td>
                <td className="py-4 text-right">
                  <button 
                    onClick={() => handleBan(u.id, u.is_banned)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${u.is_banned ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                  >
                    {u.is_banned ? '解封' : '封禁'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}