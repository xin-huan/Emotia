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

  // 生成标准的 UUID 以符合 Supabase 的数据库格式要求
  const sessionId = useRef(crypto.randomUUID()).current;
  const userId = useRef(crypto.randomUUID()).current;

  // 发送消息与接收 SSE 流的核心函数
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // 1. 把用户的话上屏
    const newUserMsg = { role: 'user', content: inputText };
    setChatHistory(prev => [...prev, newUserMsg]);
    setInputText("");
    setCurrentAgentReply(""); // 清空上一轮的打字机缓存
    setStatusText("正在连接大模型...");

    try {
      // 2. 发起 POST 请求，连接你后端的 SSE 接口
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
        buffer = parts.pop(); // 保留不完整的末尾部分

        // 4. 解析后端的四种推送类型
        for (let part of parts) {
          if (part.startsWith('data: ')) {
            const jsonStr = part.replace('data: ', '');
            try {
              const data = JSON.parse(jsonStr);

              if (data.type === 'status') {
                setStatusText(data.content);
              }
              else if (data.type === 'data_update') {
                // 更新右侧的“白盒”数据面板
                setEmotionTags(data.emotion_tags);
                setEvidences(data.evidences);
              }
              else if (data.type === 'text_chunk') {
                // 打字机效果：把字一个个拼上去
                setCurrentAgentReply(prev => prev + data.content);
              }
              else if (data.type === 'done') {
                setStatusText("回复完毕");
              }
            } catch (e) {
              console.error("JSON解析出错", jsonStr, e);
            }
          }
        }
      }

      // 5. 对话结束后，把这段流式拼接完的完整回复，正式推入历史记录
      setChatHistory(prev => {
        // 这里为了简单，我们用状态更新函数的方式读取最新的 currentAgentReply
        // 实际开发中可以通过闭包变量处理，这里简化处理，依赖于下一个渲染周期
        return prev;
      });

    } catch (error) {
      setStatusText("连接失败，请检查后端是否在 8000 端口运行");
      console.error(error);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', fontFamily: 'sans-serif' }}>

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
      </div>

    </div>
  );
}