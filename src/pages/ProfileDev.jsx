import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClickSpark from '../components/ClickSpark'; 

const PsychRadarChart = ({ data, size = 300 }) => {
  if (!data || data.length < 3) return null;

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const angleStep = (Math.PI * 2) / data.length;

  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  const gridLines = levels.map(level => {
    return data.map((_, i) => {
      const x = centerX + radius * level * Math.cos(i * angleStep - Math.PI / 2);
      const y = centerY + radius * level * Math.sin(i * angleStep - Math.PI / 2);
      return `${x},${y}`;
    }).join(' ');
  });

  const dataPoints = data.map((d, i) => {
    const val = Math.max(0.5, Math.min(d.value, 5));
    const x = centerX + (radius * (val / 5)) * Math.cos(i * angleStep - Math.PI / 2);
    const y = centerY + (radius * (val / 5)) * Math.sin(i * angleStep - Math.PI / 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={size} height={size} className="mx-auto overflow-visible drop-shadow-sm">
      {gridLines.map((line, i) => (
        <polygon key={i} points={line} fill="none" stroke="#f0f0f0" strokeWidth="1" />
      ))}

      {data.map((_, i) => {
        const x = centerX + radius * Math.cos(i * angleStep - Math.PI / 2);
        const y = centerY + radius * Math.sin(i * angleStep - Math.PI / 2);
        return <line key={i} x1={centerX} y1={centerY} x2={x} y2={y} stroke="#f0f0f0" strokeWidth="1" />;
      })}

      <motion.polygon
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        points={dataPoints}
        fill="rgba(229, 136, 137, 0.4)"
        stroke="#E58889"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {data.map((d, i) => {
        const x = centerX + (radius + 25) * Math.cos(i * angleStep - Math.PI / 2);
        const y = centerY + (radius + 25) * Math.sin(i * angleStep - Math.PI / 2);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[11px] fill-gray-400 font-bold"
          >
            {d.name}
          </text>
        );
      })}
    </svg>
  );
};

export default function ProfileFullDemo() {
  const [activeTab, setActiveTab] = useState('sessions');
  const [data, setData] = useState({ sessions: [], tests: [], notifs: [] });
  const [sessionDetail, setSessionDetail] = useState(null);
  const contentRef = React.useRef(null);

  const userId = localStorage.getItem('user_id');
  const API_BASE = "http://localhost:8000/api";

  const [usageData, setUsageData] = useState([]);
  const [period, setPeriod] = useState(7);
  const [selectedTestResult, setSelectedTestResult] = useState(null);

  const [emotionHistory, setEmotionHistory] = useState([]);
  const [sunshineHistory, setSunshineHistory] = useState([]);
  const [achievements, setAchievements] = useState({});

  // 切换 tab 时回到内容顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    if (userId) {
      fetch(`${API_BASE}/user/usage-stats/${userId}?days=${period}`)
        .then(res => res.json())
        .then(data => setUsageData(data))
        .catch(err => console.error("统计获取失败", err));
    }
  }, [userId, period]);

  useEffect(() => {
    if (userId) {
      Promise.all([
        fetch(`${API_BASE}/user/sessions/${userId}`).then(res => res.json()),
        fetch(`${API_BASE}/user/test-history/${userId}`).then(res => res.json()),
        fetch(`${API_BASE}/user/notifications/${userId}`).then(res => res.json()),
        fetch(`${API_BASE}/user/emotion-history/${userId}`).then(res => res.json()),
        fetch(`${API_BASE}/user/sunshine-history/${userId}`).then(res => res.json()),
        fetch(`${API_BASE}/user/achievements/${userId}`).then(res => res.json())
      ]).then(([sessions, tests, notifs, emotions, sunshines, achData]) => {
        setData({
          sessions: sessions || [],
          tests: tests || [],
          notifs: notifs || []
        });
        setEmotionHistory(emotions || []);
        setSunshineHistory(sunshines || []);
        if (achData && achData.status === 'success') {
          setAchievements(achData.data || {});
        }
      });
    }
  }, [userId]);

  const handleLoadDetail = (sid) => {
    fetch(`${API_BASE}/user/session-detail/${sid}`)
      .then(res => res.json()).then(data => setSessionDetail(data));
  };

  const todayDate = new Date();
  const currentYear = todayDate.getFullYear();
  const currentMonth = todayDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const emotionDict = {};
  emotionHistory.forEach(item => {
    emotionDict[item.checkin_date] = item.emotion_score;
  });

  const getEmotionIcon = (score) => {
    if (score === 5) return '🤩';
    if (score === 4) return '😊';
    if (score === 3) return '😌';
    if (score === 2) return '😔';
    if (score === 1) return '😭';
    return null;
  };

  const formatPad = (num) => num < 10 ? `0${num}` : num;

  const achievementCategories = [
    {
      title: "认知与疗愈",
      icon: "🧠",
      items: [
        { key: "first_session", name: "初探心境", desc: "首次唤醒 Agent 体验咨询", icon: "🎖️" },
      ]
    },
    {
      title: "阳光储蓄罐",
      icon: "☀️",
      items: [
        { key: "light_catcher", name: "微光捕手", desc: "首次记录一件好事", icon: "🌱" },
        { key: "sunflower", name: "向日葵体质", desc: "累计存入 5 束阳光", icon: "☀️" },
        { key: "weekend_joy", name: "周末赏味", desc: "在休息日主动感受快乐", icon: "🍰" },
      ]
    },
    {
      title: "时光里程碑",
      icon: "⏳",
      items: [
        { key: "spark", name: "星星之火", desc: "累计完成 3 天打卡", icon: "🔥" },
      ]
    }
  ];

  if (!userId) return <div className="p-20 text-center">请先登录</div>;

  return (
    <ClickSpark sparkColor='#E58889'>
    <div className="min-h-screen bg-wysa-pink pt-24 px-6 flex justify-center pb-20">
      <div className="max-w-6xl w-full flex gap-8">

        {/* --- 左侧：导航菜单 --- */}
        <div data-aos="fade-right" className="w-64 space-y-4 sticky top-28 self-start">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm text-center mb-6 border border-pink-50">
             <div className="text-4xl mb-2">🧑‍🚀</div>
             <p className="font-black text-wysa-green uppercase tracking-tighter">My Mind Space</p>
          </div>
          <nav className="bg-white p-4 rounded-[2rem] shadow-sm space-y-2">
            <button onClick={() => {setActiveTab('sessions'); setSessionDetail(null)}} className={`w-full p-4 rounded-2xl text-left font-bold transition-all ${activeTab==='sessions'?'bg-pink-50 text-pink-500':'text-gray-400 hover:bg-gray-50'}`}>📈 疗愈回溯</button>
            <button onClick={() => setActiveTab('tests')} className={`w-full p-4 rounded-2xl text-left font-bold transition-all ${activeTab==='tests'?'bg-pink-50 text-pink-500':'text-gray-400 hover:bg-gray-50'}`}>📑 测评历史</button>
            <button onClick={() => setActiveTab('social')} className={`w-full p-4 rounded-2xl text-left font-bold transition-all ${activeTab==='social'?'bg-pink-100 text-pink-500':'text-gray-400 hover:bg-gray-50'}`}>🔔 互动消息</button>
            <button onClick={() => {setActiveTab('calendar'); setSessionDetail(null)}} className={`w-full p-4 rounded-2xl text-left font-bold transition-all ${activeTab==='calendar'?'bg-orange-50 text-orange-500':'text-gray-400 hover:bg-gray-50'}`}>☀️ 阳光手账</button>
            <button onClick={() => {setActiveTab('achievements'); setSessionDetail(null)}} className={`w-full p-4 rounded-2xl text-left font-bold transition-all ${activeTab==='achievements'?'bg-yellow-50 text-yellow-600':'text-gray-400 hover:bg-gray-50'}`}>🏆 荣誉勋章</button>
          </nav>
        </div>

        {/* --- 右侧：内容区 --- */}
        <div ref={contentRef} data-aos="fade-left" className="flex-1 space-y-8 pb-20">

          {/* TAB 1: 疗愈回溯 */}
          {activeTab === 'sessions' && (
            <div className="animate-in fade-in duration-500">
              {!sessionDetail ? (
                <>
                  <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-pink-100">
                    <h3 className="text-2xl font-black text-gray-800 mb-6">每周状态回溯</h3>

                    <div className="flex justify-between items-center mb-10">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-lg">🌿</span> 疗愈足迹 (全站活跃度)
                      </h4>
                      <div className="flex gap-2 bg-gray-100 p-1 rounded-full text-[10px] shadow-inner">
                        <button onClick={() => setPeriod(7)} className={`px-4 py-1.5 rounded-full transition-all ${period===7?'bg-pink-500 text-white shadow-md':'text-gray-400'}`}>近一周</button>
                        <button onClick={() => setPeriod(30)} className={`px-4 py-1.5 rounded-full transition-all ${period===30?'bg-pink-500 text-white shadow-md':'text-gray-400'}`}>近一月</button>
                      </div>
                    </div>

                    <div className="relative h-48 w-full group">
                      <svg viewBox="0 0 1000 200" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F472B6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {usageData.length > 1 && (() => {
                          const getX = (i) => (i / (usageData.length - 1)) * 1000;
                          const getY = (val) => 180 - (Math.min(val, 5) * 35);

                          const points = usageData.map((d, i) => `${getX(i)},${getY(d.total)}`).join(' ');
                          const d_path = `M ${points}`;
                          const d_area = `M ${getX(0)},200 ${points} L ${getX(usageData.length-1)},200 Z`;

                          return (
                            <>
                              <path d={d_area} fill="url(#areaGradient)" />
                              <path d={d_path} fill="none" stroke="#F472B6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                              {usageData.map((day, i) => (
                                <g key={i} className="group/item">
                                  <circle
                                    cx={getX(i)} cy={getY(day.total)} r="8"
                                    className="fill-white stroke-pink-500 stroke-[4px] cursor-help transition-all group-hover/item:r-10"
                                  />
                                  <foreignObject x={getX(i) - 60} y={getY(day.total) - 85} width="120" height="70" className="opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none">
                                    <div className="bg-gray-900/95 backdrop-blur text-white p-3 rounded-2xl shadow-2xl border border-white/20 text-center">
                                      <p className="text-[10px] font-bold text-pink-400 mb-1">{day.date}</p>
                                      <div className="text-[9px] space-y-0.5 opacity-90">
                                        {day.agent > 0 && <p>🤖 Agent对话: {day.agent}次</p>}
                                        {day.test > 0 && <p>📑 心理测评: {day.test}次</p>}
                                        {day.post > 0 && <p>💬 社区发帖: {day.post}次</p>}
                                        {day.total === 0 && <p className="text-gray-500">休息日 💤</p>}
                                      </div>
                                    </div>
                                  </foreignObject>
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>

                      <div className="flex justify-between mt-6 px-1">
                        {usageData.filter((_, i) => i % (period === 30 ? 5 : 1) === 0).map((day, i) => (
                          <span key={i} className="text-[10px] text-gray-400 font-bold tracking-tighter">{day.date}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-pink-100">
                    <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">历史对话清单</h3>
                    <div className="space-y-3">
                      {data.sessions.map(s => (
                        <div key={s.id} onClick={() => handleLoadDetail(s.id)} className="p-6 bg-white border-2 border-gray-50 rounded-[1.5rem] cursor-pointer hover:border-pink-200 hover:shadow-md transition-all flex justify-between items-center group">
                          <div>
                            <span className="text-[10px] text-gray-300 font-bold uppercase">{new Date(s.created_at).toLocaleDateString()}</span>
                            <p className="font-bold text-wysa-green mt-1">{s.raw_event}</p>
                          </div>
                          <div className="text-pink-400 font-black opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">→</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
                  <button onClick={() => setSessionDetail(null)} className="text-pink-500 font-bold flex items-center gap-2 hover:bg-pink-50 p-2 rounded-xl transition-all">
                    <span className="text-xl">←</span> 返回清单
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-xl">
                      <h4 className="text-pink-400 text-[10px] font-black mb-3 uppercase tracking-tighter">01 事件回溯</h4>
                      <p className="text-lg font-medium leading-relaxed">{sessionDetail.raw_event}</p>
                    </div>

                    <div className="bg-white border-2 border-gray-100 p-8 rounded-[2.5rem]">
                      <h4 className="text-gray-400 text-[10px] font-black mb-4 uppercase tracking-tighter">02 情绪指纹</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(sessionDetail.emotion_labels || {}).map(([tag, score]) => (
                          <div key={tag} className="bg-pink-50 px-4 py-2 rounded-full border border-pink-100 flex items-center gap-2">
                             <span className="text-pink-500 font-black text-xs">{tag}</span>
                             <span className="text-pink-300 font-bold text-[10px]">{Math.round(score)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-8 rounded-[2.5rem] mb-8">
                    <h4 className="text-gray-400 text-[10px] font-black mb-6 uppercase tracking-tighter">03 认知重构证据 (已被击碎的泡泡)</h4>
                    <div className="space-y-3">
                      {sessionDetail.evidence_list?.map((ev, i) => (
                        <div key={i} className={`p-5 rounded-2xl flex items-center gap-4 transition-all ${ev.status === 'broken' ? 'bg-green-50/50 opacity-60' : 'bg-white shadow-sm'}`}>
                          <span className="text-lg">{ev.status === 'broken' ? '✅' : '📍'}</span>
                          <span className={`text-sm ${ev.status === 'broken' ? 'line-through text-gray-400 italic' : 'text-gray-700 font-bold'}`}>
                            [{ev.tag}] {ev.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-900 p-10 rounded-[3rem] text-white shadow-2xl">
                    <div className="flex justify-between items-center mb-10">
                      <h4 className="text-gray-500 text-[10px] font-black uppercase tracking-widest">04 情绪指纹演变轨迹</h4>
                      <div className="flex gap-4">
                        {sessionDetail.mood_scores?.[0] && Object.keys(sessionDetail.mood_scores[0]).map((label, i) => (
                          <div key={label} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: i===0?'#E58889':i===1?'#88E5BA':'#88ACE5' }}></div>
                            <span className="text-[9px] text-gray-500 font-bold uppercase">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-end gap-3 h-40 relative">
                      {sessionDetail.mood_scores?.map((scoreObj, i) => (
                        <div key={i} className="flex-1 flex items-end gap-1 h-full group relative">
                          {Object.entries(scoreObj).map(([label, val], idx) => (
                            <div
                              key={label}
                              className="flex-1 rounded-t-full transition-all duration-1000 ease-out cursor-pointer hover:brightness-125"
                              style={{
                                height: `${val}%`,
                                backgroundColor: idx===0?'#E58889':idx===1?'#88E5BA':'#88ACE5',
                                opacity: 0.8
                              }}
                            >
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-gray-900 text-[10px] px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all font-black shadow-xl whitespace-nowrap z-50">
                                {label}: {Math.round(val)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-8 text-[9px] text-gray-600 font-black uppercase border-t border-gray-800 pt-6">
                      <span>Session Start</span>
                      <span className="text-gray-700">Reframing Progress</span>
                      <span>Current State</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 测评历史 */}
          {activeTab === 'tests' && (
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-pink-100 animate-in fade-in duration-500">
              <h3 className="text-2xl font-black text-gray-800 mb-6">量表测试记录</h3>
              <div className="grid gap-6">
                {data.tests.map((t, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedTestResult(t)}
                    className="p-8 bg-white border-2 border-gray-50 rounded-[2.5rem] flex justify-between items-center hover:shadow-xl transition-all hover:border-pink-100 group">
                    <div className="flex-1 pr-10">
                      <span className="bg-pink-50 text-pink-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{new Date(t.created_at).toLocaleDateString()}</span>
                      <h4 className="font-black text-wysa-green text-xl mt-3">{t.tests?.title || "常规测评"}</h4>
                      <div className="bg-gray-50 p-4 rounded-2xl mt-4 border-l-4 border-pink-400">
                         <p className="text-xs text-gray-500 leading-relaxed italic">“{t.result_level}”</p>
                      </div>
                    </div>
                    <div className="text-6xl font-black text-gray-100 group-hover:text-pink-100 transition-colors">{t.total_score}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 互动消息 */}
          {activeTab === 'social' && (
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-pink-100 animate-in fade-in duration-500">
              <h3 className="text-2xl font-black text-gray-800 mb-6">社交动态</h3>
              {data.notifs.map(n => (
                <div key={n.id} className="flex gap-6 p-6 bg-white border-2 border-gray-50 rounded-[2rem] items-center hover:border-blue-100 hover:shadow-lg transition-all group">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {n.type === 'like' ? '❤️' : '💬'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-black text-gray-900">{n.actor?.username || "神秘访客"}</span>
                      {n.type === 'like' ? ' 给你的倾诉点了一个共鸣' : ' 回复了你的提问'}
                    </p>
                    <div className="mt-2 text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        帖子内容："{n.post?.content || "内容已被删除"}"
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-300 font-bold">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
              ))}
              {data.notifs.length === 0 && (
                <div className="text-center py-40">
                  <div className="text-4xl mb-4 grayscale opacity-30">📪</div>
                  <p className="text-gray-300 font-bold">暂时还没有新的互动消息</p>
                </div>
              )}
            </div>
          )}

          {/* 🚀🚀🚀 TAB 4: 阳光手账 (被找回的代码区域) */}
          {activeTab === 'calendar' && (
            <div className="animate-in fade-in duration-500 space-y-8">

              {/* 模块 A：情绪日历 */}
              <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-orange-100">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-800">情绪日历</h3>
                    <p className="text-sm text-gray-400 mt-1 font-bold">{currentYear}年 {currentMonth + 1}月</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[10px] bg-gray-50 px-2 py-1.5 rounded-full text-gray-500 font-bold">🤩 极好</span>
                    <span className="text-[10px] bg-gray-50 px-2 py-1.5 rounded-full text-gray-500 font-bold">😊 开心</span>
                    <span className="text-[10px] bg-gray-50 px-2 py-1.5 rounded-full text-gray-500 font-bold">😌 平静</span>
                    <span className="text-[10px] bg-gray-50 px-2 py-1.5 rounded-full text-gray-500 font-bold">😔 低落</span>
                    <span className="text-[10px] bg-gray-50 px-2 py-1.5 rounded-full text-gray-500 font-bold">😭 糟糕</span>
                  </div>
                </div>

                {/* 日历网格 */}
                <div className="grid grid-cols-7 gap-4 text-center">
                  {/* 表头 */}
                  {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                    <div key={day} className="text-[10px] font-black text-gray-300 uppercase">{day}</div>
                  ))}

                  {/* 月初空白占位 */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square rounded-[1.5rem]" />
                  ))}

                  {/* 真实查询当月每天的数据 */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const date = i + 1;
                    const dateString = `${currentYear}-${formatPad(currentMonth + 1)}-${formatPad(date)}`;

                    const dbScore = emotionDict[dateString];
                    const emotion = dbScore ? getEmotionIcon(dbScore) : null;
                    const isToday = date === todayDate.getDate();

                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-[1.5rem] flex flex-col items-center justify-center relative transition-all cursor-pointer hover:scale-105 hover:shadow-md
                          ${isToday ? 'bg-orange-50 border-2 border-orange-200' : 'bg-gray-50/50 hover:bg-orange-50/30'}
                          ${emotion ? 'border-none' : ''}
                        `}
                      >
                        <span className={`text-[11px] font-bold ${isToday ? 'text-orange-500' : 'text-gray-400'}`}>
                          {date}
                        </span>
                        {emotion && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-2xl mt-1 filter drop-shadow-sm"
                          >
                            {emotion}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 模块 B：阳光储蓄罐 */}
              <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-[3rem] p-10 shadow-sm border border-orange-100/50">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-orange-500 flex items-center gap-2">
                      <span className="text-3xl">🍯</span> 阳光储蓄罐
                    </h3>
                    <p className="text-sm text-orange-400/80 mt-2 font-bold">
                      这里收集了 {sunshineHistory.length} 束照亮你的光
                    </p>
                  </div>
                </div>

                {sunshineHistory.length === 0 ? (
                  <div className="text-center py-16 bg-white/50 rounded-[2rem] border border-white">
                    <p className="text-gray-400 font-bold">你的储蓄罐还是空的，今天去主页记录一件好事吧！</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sunshineHistory.map((item, index) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={item.id}
                        className="bg-white/80 backdrop-blur-sm p-6 rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-orange-300 uppercase tracking-widest">{item.record_date}</span>
                          <span className="text-[10px] font-black text-orange-500 bg-orange-100/50 px-2.5 py-1 rounded-full">✨ 阳光</span>
                        </div>
                        <p className="text-gray-700 font-medium leading-relaxed group-hover:text-gray-900 transition-colors">
                          "{item.content}"
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 🚀🚀🚀 TAB 5: 荣誉勋章 */}
          {activeTab === 'achievements' && (
            <div className="animate-in fade-in duration-500 space-y-8">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-[3rem] p-10 shadow-sm border border-yellow-100/50">
                <h3 className="text-3xl font-black text-amber-500 mb-2">荣誉勋章墙</h3>
                <p className="text-amber-600/80 font-bold mb-8">在这里见证你的每一次成长与蜕变</p>

                <div className="space-y-10">
                  {achievementCategories.map((category, idx) => (
                    <div key={idx}>
                      <h4 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                        <span>{category.icon}</span> {category.title}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.items.map((ach) => {
                          const isUnlocked = !!achievements[ach.key];
                          const unlockDate = isUnlocked ? String(achievements[ach.key]).substring(0, 10) : null;

                          return (
                            <div
                              key={ach.key}
                              className={`relative p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center group
                                ${isUnlocked ? 'bg-white border-yellow-200 shadow-sm hover:shadow-md hover:-translate-y-1' : 'bg-white/40 border-gray-100 opacity-70'}
                              `}
                            >
                              <div className={`text-5xl mb-4 transition-transform ${isUnlocked ? 'group-hover:scale-110' : 'grayscale opacity-40'}`}>
                                {ach.icon}
                              </div>
                              <h5 className={`font-black mb-2 text-lg ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                                {ach.name}
                              </h5>
                              <p className="text-[11px] text-gray-500 leading-relaxed min-h-[34px]">
                                {ach.desc}
                              </p>

                              {/* 底部状态 */}
                              <div className="mt-5 pt-4 border-t border-gray-100/50 w-full">
                                {isUnlocked ? (
                                  <span className="text-[10px] font-black text-amber-500 bg-amber-100/50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                    解锁于 {unlockDate}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                    🔒 尚未解锁
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>

    {/* 测评详情弹窗 */}
    <AnimatePresence>
      {selectedTestResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedTestResult(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-wysa-green">{selectedTestResult.tests?.title}</h2>
                <p className="text-xs text-gray-400">回溯日期：{new Date(selectedTestResult.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedTestResult(null)} className="text-2xl text-gray-300 hover:text-pink-500">✕</button>
            </div>

            <div className="p-10 overflow-y-auto flex-1 space-y-8">
              <div className="text-center bg-pink-50 rounded-[2rem] py-8 border border-pink-100">
                <div className="text-7xl font-black text-pink-500">{selectedTestResult.total_score}</div>
                <div className="font-bold text-pink-400 mt-2">结论：{selectedTestResult.result_level}</div>
              </div>

              <div className="bg-gray-900 text-white p-8 rounded-[2.5rem]">
                <h4 className="text-pink-400 text-[10px] font-black mb-4 uppercase tracking-widest">💡 历史诊断解析</h4>
                <p className="text-sm leading-relaxed opacity-80 italic">{selectedTestResult.analysis_text || "暂无详细建议内容。"}</p>
              </div>

              {selectedTestResult.dimension_scores?.length >= 3 && (
                <div className="p-6 border-2 border-gray-50 rounded-[2.5rem] bg-gray-50/30">
                  <PsychRadarChart data={selectedTestResult.dimension_scores} size={280} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    </ClickSpark>
  );
}