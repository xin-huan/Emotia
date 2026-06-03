import React, { useState, useEffect } from 'react';
import CardNav from '../components/CardNav';
import DecryptedText from '../components/DecryptedText';

const games = [
  { id: 'hextris', name: 'Hextris', desc: '六边形俄罗斯方块，旋转消除不停歇', icon: '🔷', color: '#567357', image: '/屏幕截图 2026-06-03 144628.png' },
  { id: '2048', name: '2048', desc: '滑动合并数字，挑战极限高分', icon: '🧩', color: '#E58889', image: '/屏幕截图 2026-06-03 145116.png' },
  { id: 'sandspiel', name: '沙粒模拟', desc: '自由创造粒子世界，释放想象力', icon: '🏝️', color: '#7A9B7B', image: '/3.png' },
  { id: 'fluid', name: '流光流体', desc: '绚丽的流体光影互动体验', icon: '🌊', color: '#D07A7B', image: '/games/fluid/promo_back.png' },
];

const CheckInTest = () => {
  const [tasks, setTasks] = useState([]);
  const [guideTasks, setGuideTasks] = useState([]);
  const [sunshineText, setSunshineText] = useState("");

  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [selectedScore, setSelectedScore] = useState(null);

  const [selectedGame, setSelectedGame] = useState(null);
  const [hoveredGame, setHoveredGame] = useState(games[0]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const storedUserId = localStorage.getItem('user_id');
  const userId = (storedUserId === "undefined" || storedUserId === "null") ? null : storedUserId;
  const todayStr = new Date().toLocaleDateString();

  // ==========================
  // 1. 初始化拉取数据
  // ==========================
  const fetchTasks = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/tasks/${userId}`);
      const data = await res.json();
      setTasks(data.tasks || []);
      setGuideTasks(data.guide_tasks || []);

      const localCheckedIn = localStorage.getItem(`checkedIn_${userId}_${todayStr}`);
      if ((data.guide_tasks && data.guide_tasks.length > 0) || localCheckedIn) {
        setHasCheckedIn(true);
        setSelectedScore(localStorage.getItem(`score_${userId}_${todayStr}`));
      }
    } catch (error) {
      console.error("获取任务失败", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  // ==========================
  // 2. 情绪打卡逻辑
  // ==========================
  const handleEmojiSelect = (score) => {
    if (hasCheckedIn) return;
    setSelectedScore(score);
  };

  const handleConfirmSubmit = async () => {
    if (hasCheckedIn) {
      showToast("今天已经打过卡啦！明天再来吧~", "warning");
      return;
    }
    if (!selectedScore) {
      showToast("请先选择一个心情表情哦！", "warning");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/checkin/emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, emotion_score: selectedScore })
      });
      const data = await res.json();

      setHasCheckedIn(true);
      localStorage.setItem(`checkedIn_${userId}_${todayStr}`, "true");
      localStorage.setItem(`score_${userId}_${todayStr}`, selectedScore);

      if (data.action === "show_agent") {
        showToast("检测到心情低落，已为您解锁【Agent 咨询室】日常任务！", "info");
      }

      fetchTasks();
    } catch (error) {
      console.error("打卡失败", error);
    }
  };

  // ==========================
  // 3. 常驻功能：存入阳光小事
  // ==========================
  const handleSunshineSubmit = async () => {
    if (!sunshineText) return showToast("写点什么再存进去吧！", "warning");
    try {
      await fetch("http://localhost:8000/api/checkin/sunshine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, content: sunshineText })
      });
      showToast("✨ 叮！成功存入一件阳光小事！", "success");
      setSunshineText("");
      fetchTasks();
    } catch (error) {
      console.error("存入失败", error);
    }
  };

  // ==========================
  // 4. 任务打钩/取消逻辑
  // ==========================
  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      await fetch("http://localhost:8000/api/tasks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, is_completed: !currentStatus })
      });
      // 告诉数据库改好了之后，重新拉取一次任务列表刷新页面
      fetchTasks();
    } catch (error) {
      console.error("操作失败", error);
    }
  };

  if (!userId) return <div style={{padding: '50px', textAlign:'center', color: '#fff'}}>请先登录！</div>;

  return (
    <div style={{ backgroundColor: '#F9F0ED', minHeight: '100vh', padding: '100px 20px 40px', color: '#3A4A3B', fontFamily: 'system-ui, sans-serif' }}>

      {/* Toast 通知 */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, animation: 'toastIn 0.3s ease',
          padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 600,
          letterSpacing: '0.02em', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(8px)',
          ...(toast.type === 'success' ? { background: '#F5FAF5', color: '#567357', border: '1px solid #C8E0C8' } :
              toast.type === 'warning' ? { background: '#FFF8F0', color: '#C07A3B', border: '1px solid #F0D8B8' } :
              { background: '#FFF5F5', color: '#D07A7B', border: '1px solid #F5D0D0' }),
        }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .emoji-btn { font-size: 45px; cursor: pointer; transition: all 0.2s; filter: grayscale(30%); opacity: 0.7; }
        .emoji-btn { font-size: 45px; cursor: pointer; transition: all 0.2s; filter: grayscale(30%); opacity: 0.7; }
        .emoji-btn:hover { transform: scale(1.2); filter: grayscale(0%); opacity: 1; }
        .emoji-btn.active { transform: scale(1.2); filter: grayscale(0%); opacity: 1; text-shadow: 0 0 15px rgba(86,115,87,0.25); }
        .emoji-btn.disabled { cursor: not-allowed; }
        .emoji-btn.disabled:hover { transform: scale(1); }

        .confirm-btn {
          margin-top: 15px; padding: 10px 30px; font-size: 16px; font-weight: bold; color: #fff;
          border: none; border-radius: 8px; transition: all 0.3s;
        }
        .confirm-btn.ready { background-color: #F0A9AA; cursor: pointer; box-shadow: 0 4px 10px rgba(240,169,170,0.4); }
        .confirm-btn.ready:hover { background-color: #D07A7B; transform: translateY(-2px); }
        .confirm-btn.disabled { background-color: #E8DDD6; cursor: not-allowed; color: #B0A89E; }

        .quest-card { background: #fff; border: 1px solid #E8DDD6; border-radius: 16px; padding: 24px; margin-bottom: 25px; box-shadow: 0 4px 16px rgba(86,115,87,0.06); }
        .quest-title { color: #567357; margin-top: 0; display: flex; alignItems: center; border-bottom: 1px solid #F0EBE3; padding-bottom: 10px; font-weight: 700; }

        .task-item { background: #FFF8F3; margin: 10px 0; padding: 15px; border-radius: 8px; display: flex; align-items: center; border-left: 4px solid #F5C6C7; transition: all 0.3s; }
        .task-item.completed { border-left-color: #F5C6C7 !important; opacity: 0.75; background: #FFF5F5; }

        input[type="checkbox"] { width: 20px; height: 20px; margin-right: 15px; accent-color: #F5C6C7; cursor: pointer; }

        .nav-card { align-self: stretch !important; }
        .nav-card-links { flex: 1 !important; margin-top: 0 !important; }
        .nav-card .task-item { flex: 1; min-height: 56px; }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* 页面标语 */}
        <div style={{ marginTop: '48px', marginBottom: '72px', textAlign: 'center' }}>
          <DecryptedText
            text="How are you feeling today, Friend?"
            animateOn="view"
            speed={60}
            maxIterations={8}
            sequential={true}
            revealDirection="start"
            className=""
            encryptedClassName=""
            parentClassName="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: '#567357', fontFamily: "'Playfair Display', 'Georgia', serif" }}
          />
        </div>

        {/* ================= 模块 1：情绪打卡面板 ================= */}
        <div data-aos="zoom-in-up" data-aos-easing="ease-out-back" data-aos-duration="700" className="quest-card" style={{ textAlign: 'center' }}>
          <h3 className="quest-title">今日能量检测</h3>
          <p style={{ color: '#7A8A7B', fontSize: '20px' }}>
            {hasCheckedIn ? "✅ 今日已完成检测" : "指挥官，请评估您今天的精神状态（每日限1次）："}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0' }}>
            {[
              { score: 5, face: '🤩', label: '极好' },
              { score: 4, face: '🙂', label: '不错' },
              { score: 3, face: '😐', label: '平静' },
              { score: 2, face: '🙁', label: '低落' },
              { score: 1, face: '😭', label: '糟糕' }
            ].map(item => (
              <div key={item.score} style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  className={`emoji-btn ${hasCheckedIn ? 'disabled' : ''} ${selectedScore == item.score ? 'active' : ''}`}
                  onClick={() => handleEmojiSelect(item.score)}
                  title={hasCheckedIn ? "今天已经打过卡了" : "点击选择"}
                >
                  {item.face}
                </span>
                <span style={{ fontSize: '12px', marginTop: '5px', color: selectedScore == item.score ? '#3A4A3B' : '#B0A89E' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {!hasCheckedIn && (
            <button
              className={`confirm-btn ${selectedScore ? 'ready' : 'disabled'}`}
              disabled={!selectedScore}
              onClick={handleConfirmSubmit}
            >
              {selectedScore ? "确认打卡" : "请先选择状态"}
            </button>
          )}
        </div>

        {/* ================= 模块 2：日常任务（CardNav） ================= */}
        <div data-aos="zoom-in-up" data-aos-easing="ease-out-back" data-aos-duration="700" data-aos-delay="100" style={{ marginBottom: '25px' }}>
          <CardNav
            title="📜 每日日常任务"
            baseColor="#ffffff"
            menuColor="#567357"
            startExpanded={true}
            items={(() => {
              const cats = [];

              // 主线任务
              cats.push({
                label: '主线任务',
                bgColor: '#ffffff',
                textColor: '#567357',
                links: [{ _type: 'main', label: 'Emoji 心情打卡', sub: '奖励：解锁后续任务', checked: hasCheckedIn }],
              });

              // 行为激活
              const sysTasks = tasks.filter(t => t.source === 'system_random');
              if (sysTasks.length > 0) {
                cats.push({
                  label: '行为激活',
                  bgColor: '#ffffff',
                  textColor: '#567357',
                  links: sysTasks.map(t => ({ _type: 'system', _id: t.id, label: t.task_content, sub: '奖励：+5 积极能量', checked: t.is_completed })),
                });
              }

              // Agent 专属
              const agentTasks = tasks.filter(t => t.source === 'agent_custom');
              if (agentTasks.length > 0) {
                cats.push({
                  label: 'Agent 专属',
                  bgColor: '#ffffff',
                  textColor: '#567357',
                  links: agentTasks.map(t => ({ _type: 'agent', _id: t.id, label: t.task_content, sub: '奖励：+10 治愈值', checked: t.is_completed })),
                });
              }

              // 分支任务
              if (guideTasks.length > 0) {
                cats.push({
                  label: '分支任务',
                  bgColor: '#ffffff',
                  textColor: '#567357',
                  links: guideTasks.map((t, i) => ({ _type: 'guide', _idx: i, label: t.content, sub: t.content.includes('Agent') && !t.completed ? 'agent' : '请在下方或指定页面完成', checked: t.completed })),
                });
              }

              return cats;
            })()}
            renderLink={(lnk, i) => (
              <div
                key={i}
                className={`task-item ${lnk.checked ? 'completed' : ''}`}
                style={{ borderLeftColor: '#FFF0EE', width: '100%', boxSizing: 'border-box' }}
              >
                <input
                  type="checkbox"
                  checked={lnk.checked}
                  readOnly={lnk._type === 'main' || lnk._type === 'guide'}
                  onChange={() => {
                    if (lnk._type === 'system' || lnk._type === 'agent') {
                      handleToggleTask(lnk._id, lnk.checked);
                    }
                  }}
                  style={{ width: '18px', height: '18px', marginRight: '12px', accentColor: '#F5C6C7', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{lnk.label}</div>
                  <div style={{ fontSize: '11px', color: '#B0A89E', marginTop: '2px' }}>
                    {lnk.sub === 'agent' ? (
                      <button onClick={() => window.location.href = '/agent'} style={{ background: '#00000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '1px 6px', fontSize: '10px' }}>立即前往</button>
                    ) : lnk.sub}
                  </div>
                </div>
              </div>
            )}
          />
        </div>

        {/* ================= 模块 3：阳光储蓄罐 ================= */}
        <div data-aos="zoom-in-up" data-aos-easing="ease-out-back" data-aos-duration="700" data-aos-delay="150" style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', marginBottom: '25px' }}>
          <h3 className="quest-title" style={{ color: '#567357', borderBottomColor: '#567357' }}>☀️ 阳光储蓄罐</h3>
          <p style={{ color: '#7A8A7B', fontSize: '14px' }}>抓住转瞬即逝的快乐。哪怕是一杯好喝的奶茶，也可以存进来！</p>

          <div style={{ display: 'flex', marginTop: '15px' }}>
            <input
              value={sunshineText}
              onChange={(e) => setSunshineText(e.target.value)}
              placeholder="记录一件好事..."
              style={{ flex: 1, padding: '12px', borderRadius: '8px 0 0 8px', border: 'none', outline: 'none', background: '#FFF8F3', color: '#3A4A3B' }}
            />
            <button
              onClick={handleSunshineSubmit}
              style={{ padding: '0 25px', background: '#567357', color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
              存入
            </button>
          </div>
        </div>

        {/* ================= 模块 4：解压小游戏 ================= */}
        <div data-aos="zoom-in-up" data-aos-easing="ease-out-back" data-aos-duration="700" data-aos-delay="200" className="quest-card" style={{ marginTop: '25px' }}>
          <h3 className="quest-title" style={{ color: '#7A9B7B', borderBottomColor: '#7A9B7B' }}>🎮 解压小游戏</h3>
          <p style={{ color: '#7A8A7B', fontSize: '14px', marginBottom: '20px' }}>
            感到压力大？选一个喜欢的游戏，在 Emotia 中放松一下吧。
          </p>

          <div style={{ display: 'flex', gap: '32px', alignItems: 'stretch' }}>
            {/* 左侧：竖排长方形选项 */}
            <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {games.map(game => {
                const isActive = hoveredGame?.id === game.id;
                return (
                  <div
                    key={game.id}
                    onMouseEnter={() => setHoveredGame(game)}
                    onClick={() => setSelectedGame(game)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px 20px',
                      background: isActive ? game.color : '#fff',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      border: isActive ? `2px solid ${game.color}` : '2px solid #E8DDD6',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive
                        ? `0 4px 16px ${game.color}33`
                        : '0 2px 6px rgba(86,115,87,0.05)',
                      color: isActive ? '#fff' : '#3A4A3B',
                    }}
                  >
                    <span style={{ fontSize: '28px', flexShrink: 0 }}>{game.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>{game.name}</div>
                      <div style={{ fontSize: '11px', opacity: 0.75, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {game.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 右侧：正方形游戏封面图 */}
            <div
              style={{
                flex: 1,
                aspectRatio: '1 / 1',
                borderRadius: '20px',
                cursor: 'pointer',
                boxShadow: `0 8px 32px ${hoveredGame.color}33`,
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => setSelectedGame(hoveredGame)}
            >
              <img
                src={hoveredGame.image}
                alt={hoveredGame.name}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(to top, ${hoveredGame.color}cc 0%, transparent 50%)`,
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '20px', textShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                  {hoveredGame.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', lineHeight: 1.4, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  {hoveredGame.desc}
                </div>
                <div style={{
                  marginTop: '4px',
                  background: 'rgba(255,255,255,0.95)',
                  color: hoveredGame.color,
                  borderRadius: '14px',
                  padding: '4px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  alignSelf: 'flex-start',
                }}>
                  点击开始游戏
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ================= 游戏播放器弹窗 ================= */}
      {selectedGame && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setSelectedGame(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '16px', overflow: 'hidden',
              width: '92vw', height: '90vh', maxWidth: '900px',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 20px', background: '#FFF8F3', borderBottom: '1px solid #E8DDD6',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{selectedGame.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '16px', color: '#3A4A3B' }}>{selectedGame.name}</span>
              </div>
              <button
                onClick={() => setSelectedGame(null)}
                style={{
                  background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer',
                  color: '#B0A89E', padding: '4px 8px', borderRadius: '6px',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F5D5D6'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                ✕
              </button>
            </div>
            <iframe
              src={`/games/${selectedGame.id}/index.html`}
              style={{ flex: 1, border: 'none', width: '100%' }}
              title={selectedGame.name}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInTest;