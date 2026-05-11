import React, { useState, useRef } from 'react';

export default function AgentTest() {
  // 定义界面所需的状态（变量）
  const [inputText, setInputText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [currentAgentReply, setCurrentAgentReply] = useState("");
  const [statusText, setStatusText] = useState("等待输入...");

  // 核心业务数据：情绪标签和证据泡泡
  const [emotionTags, setEmotionTags] = useState({});
  const [evidences, setEvidences] = useState([]);

  // 存放所有的历史会话列表
  const [sessionList, setSessionList] = useState([]);

  // 生成标准的 UUID 以符合 Supabase 的数据库格式要求
  const userId = localStorage.getItem('user_id'); // 获取登录时存下的真实 UUID
  // session_id 依然可以保持在当前页面生命周期内唯一，或者每开一个新话题生成一个
  const [sessionId, setSessionId] = useState(crypto.randomUUID());

  // A. 获取该用户的所有会话列表
  const fetchMySessions = async () => {
    if (!userId) {
      setStatusText("请先登录再查看历史");
      return;
    }
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/user/sessions/${userId}`);
      const data = await res.json();
      setSessionList(data);
      setStatusText("历史清单已更新");
    } catch (err) {
      console.error("获取会话列表失败", err);
    }
  };

  // B. 加载某个特定会话的具体对话内容
  const loadHistoryDetail = async (sid) => {
    setStatusText(`正在还原会话: ${sid}...`);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/chat/history/${sid}`);
      const data = await res.json();
      
      // 1. 🚀 还原左侧聊天文字
      const formattedMessages = data.messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'agent',
        content: m.content
      }));
      setChatHistory(formattedMessages);
      
      // 2. 🚀 [最关键] 还原右侧白盒监控数据
      if (data.metadata) {
        // 还原情绪标签和分数
        setEmotionTags(data.metadata.emotion_labels || {});
        // 还原证据泡泡
        setEvidences(data.metadata.evidence_list || []);
        // 还原当前阶段状态
        setStatusText(`历史记录加载成功 (当前阶段: ${data.metadata.current_stage})`);
      }

      // 3. 同时也更新当前的 sessionId，保证接下来的对话能接在后面
      setSessionId(sid);

    } catch (err) {
      console.error("还原失败", err);
      setStatusText("记录还原失败");
    }
  };

  // 发送消息与接收 SSE 流的核心函数
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // 1. 把用户的话上屏（存入正式历史）
    const newUserMsg = { role: 'user', content: inputText };
    setChatHistory(prev => [...prev, newUserMsg]);
    setInputText("");
    setCurrentAgentReply(""); // 清空打字机缓存
    setStatusText("正在连接大模型...");

    // 🚀 核心逻辑：定义一个内部局部变量，用来实时积累 AI 说的每一个字
    let accumulatedReply = "";

    try {
      // 2. 发起 POST 请求
      const response = await fetch('http://127.0.0.1:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          message: newUserMsg.content
        })
      });

      // 3. 读取流式数据
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (let part of parts) {
          if (part.startsWith('data: ')) {
            const jsonStr = part.replace('data: ', '');
            try {
              const data = JSON.parse(jsonStr);

              if (data.type === 'status') {
                setStatusText(data.content);
              }
              else if (data.type === 'data_update') {
                setEmotionTags(data.emotion_tags);
                setEvidences(data.evidences);
              }
              else if (data.type === 'text_chunk') {
                const chunk = data.content;
                accumulatedReply += chunk;
                setCurrentAgentReply(prev => prev + chunk);
              }
              else if (data.type === 'done') {
                setStatusText("回复完毕");

                // ==================================================
                // 🚀 [新增逻辑]：流式接收完毕，检查是否含有【专属任务】
                // ==================================================
                const taskMatch = accumulatedReply.match(/【专属任务：(.*?)】/);

                if (taskMatch && taskMatch[1]) {
                  const customTaskStr = taskMatch[1];
                  console.log("🎯 成功捕获 Agent 专属任务:", customTaskStr);

                  // A. 将该任务下发到用户的今日打卡列表
                  fetch("http://127.0.0.1:8000/api/agent/custom_task", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      user_id: userId,
                      task_content: customTaskStr
                    })
                  }).catch(e => console.error("下发专属任务失败", e));

                  // B. 同时把每日任务面板里的“体验咨询室”黄框任务打钩
                  fetch("http://127.0.0.1:8000/api/agent/complete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: userId })
                  }).catch(e => console.error("打钩引导任务失败", e));
                }
              }
            } catch (e) {
              console.error("JSON解析出错", jsonStr, e);
            }
          }
        }
      }

      // 4. 对话彻底结束后：把刚才累积的“打字机文字”转正到“正式历史记录”中
      if (accumulatedReply) {
        // [优化]：在正式上屏前，我们可以把【专属任务：xxx】的字样从气泡中隐去或美化，
        // 防止用户觉得突兀，但目前先原样显示。
        setChatHistory(prev => [...prev, {
          role: 'agent',
          content: accumulatedReply
        }]);
      }

      // 5. 转正完成后，把临时的打字机状态清空，迎接下一轮
      setCurrentAgentReply("");

    } catch (error) {
      setStatusText("连接失败，请检查后端是否在 8000 端口运行");
      console.error(error);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px',paddingTop: '100px', fontFamily: 'sans-serif' }}>

      {/* 左侧：聊天框 */}
      <div style={{ flex: 2, border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
        <h3>CBT Agent 对话测试</h3>
        <div style={{ color: 'gray', fontSize: '12px', marginBottom: '10px' }}>当前状态: {statusText}</div>

        <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
          {chatHistory.map((msg, idx) => (
            <div key={idx} style={{ margin: '10px 0', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
              <span style={{ background: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5', padding: '8px', borderRadius: '5px', display: 'inline-block' }}>
                {msg.content}
              </span>
            </div>
          ))}
          {/* 显示正在打字的回复 */}
          {currentAgentReply && (
            <div style={{ margin: '10px 0', textAlign: 'left' }}>
              <span style={{ background: '#f5f5f5', padding: '8px', borderRadius: '5px', display: 'inline-block' }}>
                {currentAgentReply}
              </span>
            </div>
          )}
        </div>

        <div>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            style={{ width: '80%', padding: '8px' }}
            placeholder="输入你的困扰..."
          />
          <button onClick={sendMessage} style={{ width: '18%', padding: '8px', marginLeft: '2%' }}>发送</button>
        </div>
      </div>

      {/* 右侧：后台白盒数据监控 (情绪标签和证据泡泡) */}
      <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px', borderRadius: '8px', background: '#fafafa' }}>
        <h3>🧠 白盒监控面板</h3>

        <h4>七维情绪标签</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {Object.entries(emotionTags).map(([tag, score]) => (
            <span key={tag} style={{ background: score > 50 ? '#ffcdd2' : '#c8e6c9', padding: '4px 8px', borderRadius: '15px', fontSize: '12px' }}>
              {tag}: {score}
            </span>
          ))}
          {Object.keys(emotionTags).length === 0 && <span style={{fontSize: '12px', color: '#999'}}>暂无情绪数据</span>}
        </div>

        <h4 style={{ marginTop: '20px' }}>证据泡泡 (Evidences)</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {evidences.map((ev, idx) => (
            <div key={idx} style={{
              background: ev.status === 'broken' ? '#e0e0e0' : 'white',
              border: ev.status === 'broken' ? '1px dashed #999' : '1px solid #2196f3',
              textDecoration: ev.status === 'broken' ? 'line-through' : 'none',
              padding: '8px', borderRadius: '5px', fontSize: '13px'
            }}>
              [{ev.tag}] {ev.text}
            </div>
          ))}
          {evidences.length === 0 && <span style={{fontSize: '12px', color: '#999'}}>暂无提取的证据</span>}
        </div>

        {/* --- 简易历史回溯面板 --- */}
        <h4 style={{ marginTop: '30px', color: '#666' }}>🕒 往期疗愈档案</h4>
        <button onClick={fetchMySessions} style={{ fontSize: '12px', marginBottom: '10px' }}>
          刷新列表
        </button>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {sessionList.map((s, idx) => (
            <div
              key={idx}
              onClick={() => loadHistoryDetail(s.id)}
              style={{
                padding: '8px',
                marginBottom: '5px',
                background: '#eee',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              <strong>{new Date(s.created_at).toLocaleDateString()}</strong><br/>
              {s.raw_event || "未命名会话"}
            </div>
          ))}
          {sessionList.length === 0 && <div style={{color:'#999', fontSize:'11px'}}>暂无记录</div>}
        </div>
      </div>
    </div>
  );
}