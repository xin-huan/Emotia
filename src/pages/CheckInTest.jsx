import React, { useState, useEffect } from 'react';

const games = [
  { id: 'hextris', name: 'Hextris', desc: '六边形俄罗斯方块，旋转消除不停歇', icon: '🔷', color: '#3498db' },
  { id: '2048', name: '2048', desc: '滑动合并数字，挑战极限高分', icon: '🧩', color: '#edc22e' },
  { id: 'sandspiel', name: '沙粒模拟', desc: '自由创造粒子世界，释放想象力', icon: '🏝️', color: '#e6c873' },
  { id: 'fluid', name: '流光流体', desc: '绚丽的流体光影互动体验', icon: '🌊', color: '#4a9eda' },
];

const CheckInTest = () => {
  const [tasks, setTasks] = useState([]);
  const [guideTasks, setGuideTasks] = useState([]);
  const [sunshineText, setSunshineText] = useState("");

  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [selectedScore, setSelectedScore] = useState(null);

  const [selectedGame, setSelectedGame] = useState(null);

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
      alert("今天已经打过卡啦！明天再来吧~");
      return;
    }
    if (!selectedScore) {
      alert("请先选择一个心情表情哦！");
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
        alert("检测到心情低落，已为您解锁【Agent 咨询室】日常任务！");
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
    if (!sunshineText) return alert("写点什么再存进去吧！");
    try {
      await fetch("http://localhost:8000/api/checkin/sunshine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, content: sunshineText })
      });
      alert("✨ 叮！成功存入一件阳光小事！");
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
    <div style={{ backgroundColor: '#F9F0ED', minHeight: '100vh', padding: '100px 20px 40px', color: '#333', fontFamily: 'system-ui, sans-serif' }}>

      <style>{`
        .emoji-btn { font-size: 45px; cursor: pointer; transition: all 0.2s; filter: grayscale(30%); opacity: 0.7; }
        .emoji-btn:hover { transform: scale(1.2); filter: grayscale(0%); opacity: 1; }
        .emoji-btn.active { transform: scale(1.2); filter: grayscale(0%); opacity: 1; text-shadow: 0 0 15px rgba(0,0,0,0.15); }
        .emoji-btn.disabled { cursor: not-allowed; }
        .emoji-btn.disabled:hover { transform: scale(1); }

        .confirm-btn {
          margin-top: 15px; padding: 10px 30px; font-size: 16px; font-weight: bold; color: #fff;
          border: none; border-radius: 8px; transition: all 0.3s;
        }
        .confirm-btn.ready { background-color: #E58889; cursor: pointer; box-shadow: 0 4px 10px rgba(229,136,137,0.4); }
        .confirm-btn.ready:hover { background-color: #d07a7b; transform: translateY(-2px); }
        .confirm-btn.disabled { background-color: #ccc; cursor: not-allowed; color: #999; }

        .quest-card { background: #fff; border: 1px solid #e8e3db; border-radius: 16px; padding: 24px; margin-bottom: 25px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
        .quest-title { color: #567357; margin-top: 0; display: flex; alignItems: center; border-bottom: 1px solid #f0ebe3; padding-bottom: 10px; font-weight: 700; }

        .task-item { background: #faf8f5; margin: 10px 0; padding: 15px; border-radius: 8px; display: flex; align-items: center; border-left: 4px solid #E58889; transition: all 0.3s; }
        .task-item.completed { border-left-color: #567357 !important; opacity: 0.75; }

        input[type="checkbox"] { width: 20px; height: 20px; margin-right: 15px; accent-color: #567357; cursor: pointer; }
      `}</style>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* ================= 模块 1：情绪打卡面板 ================= */}
        <div data-aos="zoom-in-up" data-aos-easing="ease-out-back" data-aos-duration="700" className="quest-card" style={{ textAlign: 'center' }}>
          <h3 className="quest-title">今日能量检测</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            {hasCheckedIn ? "✅ 今日已完成检测，干得漂亮！" : "指挥官，请评估您今天的精神状态（每日限1次）："}
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
                <span style={{ fontSize: '12px', marginTop: '5px', color: selectedScore == item.score ? '#333' : '#999' }}>
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

        {/* ================= 模块 2+3：并排：日常任务 + 阳光储蓄罐 ================= */}
        <div data-aos="zoom-in-up" data-aos-easing="ease-out-back" data-aos-duration="700" data-aos-delay="100" style={{ display: 'flex', gap: '20px' }}>

          {/* 左：游戏化任务看板 */}
          <div className="quest-card" style={{ flex: 1 }}>
            <h3 className="quest-title" style={{ color: '#E58889', borderColor: '#E58889' }}>📜 每日日常任务</h3>

            <div className={`task-item ${hasCheckedIn ? 'completed' : ''}`}>
              <input type="checkbox" checked={hasCheckedIn} readOnly />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>完成今日 Emoji 心情打卡</div>
                <div style={{ fontSize: '12px', color: '#999' }}>主线任务 / 奖励：解锁后续任务</div>
              </div>
            </div>

            {tasks.filter(t => t.source === 'system_random').map(task => (
              <div className={`task-item ${task.is_completed ? 'completed' : ''}`} key={task.id} style={{ borderLeftColor: '#3498db' }}>
                <input type="checkbox" checked={task.is_completed} onChange={() => handleToggleTask(task.id, task.is_completed)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{task.task_content}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    行为激活任务 / 奖励：+5 积极能量
                  </div>
                </div>
              </div>
            ))}

            {tasks.filter(t => t.source === 'agent_custom').map(task => (
              <div className={`task-item ${task.is_completed ? 'completed' : ''}`} key={task.id} style={{ borderLeftColor: '#9b59b6' }}>
                <input type="checkbox" checked={task.is_completed} onChange={() => handleToggleTask(task.id, task.is_completed)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{task.task_content}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Agent 专属定制 / 奖励：+10 治愈值
                  </div>
                </div>
              </div>
            ))}

            {guideTasks.map((task, idx) => (
              <div className={`task-item ${task.completed ? 'completed' : ''}`} key={idx} style={{ borderLeftColor: '#E58889' }}>
                <input type="checkbox" checked={task.completed} readOnly />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#E58889' }}>{task.content}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    分支任务 / {task.content.includes("Agent") && !task.completed ?
                    <button onClick={()=>window.location.href='/agent'} style={{background:'#E58889', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', padding:'2px 8px'}}>立即前往</button>
                    : '请在下方或指定页面完成'}
                  </div>
                </div>
              </div>
            ))}

          </div>

          {/* 右：常驻阳光储蓄罐 */}
          <div className="quest-card" style={{ flex: 1, borderColor: '#567357' }}>
            <h3 className="quest-title" style={{ color: '#567357', borderColor: '#567357' }}>☀️ 阳光储蓄罐</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>抓住转瞬即逝的快乐。哪怕是一杯好喝的奶茶，也可以存进来！</p>

            <div style={{ display: 'flex', marginTop: '15px' }}>
              <input
                value={sunshineText}
                onChange={(e) => setSunshineText(e.target.value)}
                placeholder="记录一件好事..."
                style={{ flex: 1, padding: '12px', borderRadius: '8px 0 0 8px', border: 'none', outline: 'none', background: '#fff', color: '#333' }}
              />
              <button
                onClick={handleSunshineSubmit}
                style={{ padding: '0 25px', background: '#567357', color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
              >
                存入
              </button>
            </div>
          </div>

        </div>

        {/* ================= 模块 4：解压小游戏 ================= */}
        <div data-aos="zoom-in-up" data-aos-easing="ease-out-back" data-aos-duration="700" data-aos-delay="200" className="quest-card" style={{ marginTop: '25px' }}>
          <h3 className="quest-title" style={{ color: '#9b59b6', borderColor: '#9b59b6' }}>🎮 解压小游戏</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
            感到压力大？选一个喜欢的游戏，在 Emotia 中放松一下吧。
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            {games.map(game => (
              <div
                key={game.id}
                onClick={() => setSelectedGame(game)}
                style={{
                  background: '#fff',
                  borderRadius: '14px',
                  padding: '20px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = game.color;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.1)`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)';
                }}
              >
                <div style={{ fontSize: '42px', marginBottom: '10px' }}>{game.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#333', marginBottom: '6px' }}>{game.name}</div>
                <div style={{ fontSize: '12px', color: '#999', lineHeight: 1.4 }}>{game.desc}</div>
              </div>
            ))}
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
              padding: '12px 20px', background: '#faf8f5', borderBottom: '1px solid #eee',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{selectedGame.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '16px', color: '#333' }}>{selectedGame.name}</span>
              </div>
              <button
                onClick={() => setSelectedGame(null)}
                style={{
                  background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer',
                  color: '#999', padding: '4px 8px', borderRadius: '6px',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
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