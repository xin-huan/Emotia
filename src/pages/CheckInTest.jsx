import React, { useState, useEffect } from 'react';

const CheckInTest = () => {
  const [tasks, setTasks] = useState([]);
  const [guideTasks, setGuideTasks] = useState([]);
  const [sunshineText, setSunshineText] = useState("");

  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [selectedScore, setSelectedScore] = useState(null);

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
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', padding: '40px 20px', color: '#eaeaea', fontFamily: 'system-ui, sans-serif' }}>

      <style>{`
        .emoji-btn { font-size: 45px; cursor: pointer; transition: all 0.2s; filter: grayscale(100%); opacity: 0.6; }
        .emoji-btn:hover { transform: scale(1.2); filter: grayscale(0%); opacity: 1; }
        .emoji-btn.active { transform: scale(1.2); filter: grayscale(0%); opacity: 1; text-shadow: 0 0 15px rgba(255,255,255,0.8); }
        .emoji-btn.disabled { cursor: not-allowed; }
        .emoji-btn.disabled:hover { transform: scale(1); }
        
        .confirm-btn {
          margin-top: 15px; padding: 10px 30px; font-size: 16px; font-weight: bold; color: #fff;
          border: none; border-radius: 8px; transition: all 0.3s;
        }
        .confirm-btn.ready { background-color: #e94560; cursor: pointer; box-shadow: 0 4px 10px rgba(233,69,96,0.4); }
        .confirm-btn.ready:hover { background-color: #d83a54; transform: translateY(-2px); }
        .confirm-btn.disabled { background-color: #555; cursor: not-allowed; color: #aaa; }

        .quest-card { background: #16213e; border: 2px solid #0f3460; border-radius: 12px; padding: 20px; margin-bottom: 25px; box-shadow: 0 8px 16px rgba(0,0,0,0.4); }
        .quest-title { color: #e94560; margin-top: 0; display: flex; alignItems: center; border-bottom: 1px solid #0f3460; padding-bottom: 10px; }
        
        /* 修改了这里的完成状态样式：去掉了删除线，保留了绿边框和稍微变暗的视觉反馈 */
        .task-item { background: #1f2a48; margin: 10px 0; padding: 15px; border-radius: 8px; display: flex; align-items: center; border-left: 4px solid #e94560; transition: all 0.3s; }
        .task-item.completed { border-left-color: #4caf50 !important; opacity: 0.85; }
        
        input[type="checkbox"] { width: 20px; height: 20px; margin-right: 15px; accent-color: #4caf50; cursor: pointer; }
      `}</style>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* ================= 模块 1：情绪打卡面板 ================= */}
        <div className="quest-card" style={{ textAlign: 'center' }}>
          <h3 className="quest-title">🌡️ 今日能量检测</h3>
          <p style={{ color: '#aaa', fontSize: '14px' }}>
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
                <span style={{ fontSize: '12px', marginTop: '5px', color: selectedScore == item.score ? '#fff' : '#666' }}>
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

        {/* ================= 模块 2：游戏化任务看板 ================= */}
        <div className="quest-card">
          <h3 className="quest-title" style={{ color: '#f39c12', borderColor: '#f39c12' }}>📜 每日日常任务</h3>

          <div className={`task-item ${hasCheckedIn ? 'completed' : ''}`}>
            {/* 系统自动判定：只读 */}
            <input type="checkbox" checked={hasCheckedIn} readOnly />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>完成今日 Emoji 心情打卡</div>
              <div style={{ fontSize: '12px', color: '#888' }}>主线任务 / 奖励：解锁后续任务</div>
            </div>
          </div>

          {/* 渲染：系统随机行为激活任务 */}
          {tasks.filter(t => t.source === 'system_random').map(task => (
            <div className={`task-item ${task.is_completed ? 'completed' : ''}`} key={task.id} style={{ borderLeftColor: '#3498db' }}>
              {/* 用户手动点击判定：绑定 onChange 事件 */}
              <input type="checkbox" checked={task.is_completed} onChange={() => handleToggleTask(task.id, task.is_completed)} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{task.task_content}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  🌱 行为激活任务 / 奖励：+5 积极能量
                </div>
              </div>
            </div>
          ))}

          {/* 渲染：Agent 专属定制任务 */}
          {tasks.filter(t => t.source === 'agent_custom').map(task => (
            <div className={`task-item ${task.is_completed ? 'completed' : ''}`} key={task.id} style={{ borderLeftColor: '#9b59b6' }}>
              {/* 用户手动点击判定：绑定 onChange 事件 */}
              <input type="checkbox" checked={task.is_completed} onChange={() => handleToggleTask(task.id, task.is_completed)} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{task.task_content}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  🤖 Agent 专属定制 / 奖励：+10 治愈值
                </div>
              </div>
            </div>
          ))}

          {/* 渲染：系统动态引导任务 (如前往咨询室、存入阳光) */}
          {guideTasks.map((task, idx) => (
            <div className={`task-item ${task.completed ? 'completed' : ''}`} key={idx} style={{ borderLeftColor: '#f39c12' }}>
              {/* 系统自动判定：只读 */}
              <input type="checkbox" checked={task.completed} readOnly />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#f39c12' }}>{task.content}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  分支任务 / {task.content.includes("Agent") && !task.completed ?
                  <button onClick={()=>window.location.href='/agent'} style={{background:'#e94560', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', padding:'2px 8px'}}>立即前往</button>
                  : '请在下方或指定页面完成'}
                </div>
              </div>
            </div>
          ))}

        </div>

        {/* ================= 模块 3：常驻阳光储蓄罐 ================= */}
        <div className="quest-card" style={{ borderColor: '#4caf50' }}>
          <h3 className="quest-title" style={{ color: '#4caf50', borderColor: '#4caf50' }}>🌟 阳光储蓄罐</h3>
          <p style={{ color: '#aaa', fontSize: '14px' }}>抓住转瞬即逝的快乐。哪怕是一杯好喝的奶茶，也可以存进来！</p>

          <div style={{ display: 'flex', marginTop: '15px' }}>
            <input
              value={sunshineText}
              onChange={(e) => setSunshineText(e.target.value)}
              placeholder="记录一件好事..."
              style={{ flex: 1, padding: '12px', borderRadius: '8px 0 0 8px', border: 'none', outline: 'none', background: '#fff', color: '#333' }}
            />
            <button
              onClick={handleSunshineSubmit}
              style={{ padding: '0 25px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
              存入
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckInTest;