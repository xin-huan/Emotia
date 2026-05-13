import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Plasma from '../components/Plasma';
import ClickSpark from '../components/ClickSpark';

// ==========================================
// 饮料配置
// ==========================================
const DRINK_CONFIG = {
  tea:      { color: '#4a7c59', label: '茶',   desc: '清心绿茶', emoji: '🍵' },
  coffee:   { color: '#6f4e37', label: '咖啡', desc: '醇厚美式', emoji: '☕' },
  milk_tea: { color: '#d4a574', label: '奶茶', desc: '温暖拿铁', emoji: '🧋' },
  water:    { color: '#7eb8da', label: '水',   desc: '纯净之水', emoji: '💧' },
};

const DRINK_MUSIC = {
  tea:      '/tea.mp3',
  coffee:   '/coffe.mp3',
  milk_tea: '/milk.mp3',
  water:    '/water.mp3',
};

// ==========================================
// 瓷杯组件
// ==========================================
function PorcelainCup({ liquidColor, fillPercent = 0, shaking = false, size = 'normal' }) {
  const dims = size === 'small' ? { width: 66, height: 72 } : { width: 110, height: 120 };
  return (
    <motion.div
      className="cup-body"
      style={{ width: dims.width, height: dims.height }}
      animate={shaking ? { x: [0, -2, 2, -1, 0] } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="cup-rim" />
      <motion.div
        className="cup-liquid"
        style={{ background: liquidColor || 'transparent' }}
        initial={{ height: '0%' }}
        animate={{ height: `${fillPercent}%` }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
      >
        {fillPercent > 0 && <div className="liquid-surface" />}
      </motion.div>
    </motion.div>
  );
}

// ==========================================
// 空闲场景
// ==========================================
function IdleScene({ onStart }) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-10 relative overflow-hidden">
      {/* 桌面 */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] max-w-lg h-[45%] bg-white/90 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.06)]"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      {/* 杯子和内容 */}
      <div className="relative z-10 flex flex-col items-center gap-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <PorcelainCup liquidColor={null} fillPercent={0} />
        </motion.div>
        <motion.p
          className="text-wysa-green/60 text-lg tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          坐下来，喝杯东西，慢慢聊
        </motion.p>
        <motion.button
          onClick={onStart}
          className="bg-wysa-green text-white px-10 py-3 rounded-full text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          开始
        </motion.button>
      </div>
    </div>
  );
}

// ==========================================
// 饮料选择场景
// ==========================================
function DrinkSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-8 relative overflow-hidden">
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] max-w-lg h-[45%] bg-white/90 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.06)]"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <motion.h2
          className="text-2xl font-bold text-wysa-green"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          想喝点什么？
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(DRINK_CONFIG).map(([key, cfg], i) => (
            <motion.button
              key={key}
              onClick={() => onSelect(key)}
              className="flex flex-col items-center gap-3 bg-white rounded-2xl p-5 shadow-md border border-gray-100 cursor-pointer"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.08, y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-3xl">{cfg.emoji}</span>
              <span
                className="w-10 h-10 rounded-full border-2 border-gray-200 shadow-inner"
                style={{ background: cfg.color }}
              />
              <span className="font-bold text-gray-700">{cfg.label}</span>
              <span className="text-xs text-gray-400">{cfg.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 倒饮料动画场景
// ==========================================
function PouringScene({ drinkType, onComplete }) {
  const cfg = DRINK_CONFIG[drinkType];

  useEffect(() => {
    const timer = setTimeout(onComplete, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center relative overflow-hidden">
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] max-w-lg h-[45%] bg-white/90 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.06)]"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          {/* 液体流柱 */}
          <motion.div
            className="pour-stream"
            style={{
              background: `linear-gradient(180deg, transparent, ${cfg.color})`,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 5,
              borderRadius: '0 0 3px 3px',
              top: -75,
              zIndex: 10,
              boxShadow: `0 0 8px ${cfg.color}40`,
            }}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: [0, 70, 70, 0],
              opacity: [0, 0.95, 0.95, 0],
            }}
            transition={{
              duration: 2,
              times: [0, 0.2, 0.7, 0.9],
              ease: 'easeInOut',
            }}
          />
          {/* 杯子 */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <PorcelainCup liquidColor={cfg.color} fillPercent={75} shaking />
          </motion.div>
        </div>

        <motion.p
          className="mt-8 text-wysa-green/60 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          正在为您冲泡{cfg.label}...
        </motion.p>

        {/* 蒸汽 */}
        <motion.div
          className="flex gap-4 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-6 rounded-full"
              style={{ background: `${cfg.color}40` }}
              animate={{
                y: [-6, -20],
                opacity: [0.6, 0],
                scaleY: [1, 2],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.3,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* 跳过按钮 */}
      <motion.button
        onClick={onComplete}
        className="absolute bottom-8 z-20 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-full px-4 py-1.5 hover:bg-white/60 transition-all"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        跳过 &gt;
      </motion.button>
    </div>
  );
}

// ==========================================
// 聊天气泡
// ==========================================
function ChatBubble({ role, content, isStreaming }) {
  const isUser = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 50 : -50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: isUser ? 40 : -40, scale: 0.9 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`max-w-[85%] px-5 py-3 text-base leading-loose shadow-md whitespace-pre-line break-words overflow-hidden ${
        isUser
          ? 'bg-white rounded-[16px_16px_4px_16px] text-gray-700'
          : 'bg-white rounded-[16px_16px_16px_4px] text-gray-700'
      }`}
    >
      {content}
      {isStreaming && (
        <motion.span
          className="inline-block w-1.5 h-4 bg-wysa-coral ml-1 align-text-bottom rounded-sm"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

// ==========================================
// 对话视图（杯子在中央，气泡在两侧）
// ==========================================
function ChatView({
  chatHistory,
  currentAgentReply,
  isAgentThinking,
  inputText,
  onInputChange,
  onSend,
  selectedDrink,
  onOpenHistory,
  onOpenMonitor,
  showCheckinPrompt,
  onGoCheckin,
}) {
  const messagesEndRef = useRef(null);
  const drinkCfg = DRINK_CONFIG[selectedDrink] || DRINK_CONFIG.water;
  const [cupShaking, setCupShaking] = useState(false);

  const shakeCup = () => {
    if (cupShaking) return;
    setCupShaking(true);
    setTimeout(() => setCupShaking(false), 400);
  };

  // 只展示最新一轮对话: 最后一条用户消息 + 最后一条 agent 消息
  // 流式回复期间不展示历史中的旧 agent 消息，避免和新回复重叠
  const isStreaming = !!(currentAgentReply || isAgentThinking);
  const displayMessages = [];
  for (let i = chatHistory.length - 1; i >= 0; i--) {
    if (chatHistory[i].role === 'user' && !displayMessages.some(m => m.role === 'user')) {
      displayMessages.unshift({ ...chatHistory[i], _key: `user-${i}` });
    }
    if (chatHistory[i].role === 'agent' && !displayMessages.some(m => m.role === 'agent') && !isStreaming) {
      displayMessages.unshift({ ...chatHistory[i], _key: `agent-${i}` });
    }
    if (displayMessages.length === 2 || (displayMessages.length === 1 && isStreaming)) break;
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, currentAgentReply, isAgentThinking]);

  return (
    <div className="h-screen bg-transparent flex flex-col relative overflow-hidden">
      {/* 消息区域 - 气泡靠两侧，不遮挡中央背景 */}
      <div className="flex-1 overflow-y-auto relative z-10 px-4 pt-14 pb-24">
        <div className="w-full max-w-4xl mx-auto min-h-full flex flex-col justify-center">
          <div>
            {/* 空状态 */}
            {chatHistory.length === 0 && !currentAgentReply && !isAgentThinking && (
              <motion.div
                className="flex flex-col items-center gap-3 py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-wysa-green/50 text-sm">我是你的心理咨询助手</p>
                <p className="text-wysa-green/30 text-xs">在这里，你可以安全地分享任何想法和感受</p>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {displayMessages.map((msg) => (
                <div
                  key={msg._key}
                  className={`flex mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <ChatBubble role={msg.role} content={msg.content} />
                </div>
              ))}

              {/* Agent 思考中 */}
              {isAgentThinking && !currentAgentReply && (
                <motion.div
                  className="flex justify-start mb-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="bg-white rounded-[16px_16px_16px_4px] px-5 py-3 shadow-md flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 mr-1">思考中</span>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-wysa-coral"
                        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Agent 正在流式回复 */}
              {currentAgentReply && (
                <div className="flex justify-start mb-3">
                  <ChatBubble role="agent" content={currentAgentReply} isStreaming />
                </div>
              )}

              {/* 打卡建议按钮 */}
              {showCheckinPrompt && !isStreaming && (
                <motion.div
                  className="flex justify-center mb-3"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <button
                    onClick={onGoCheckin}
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-wysa-coral to-wysa-green text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <span>去打卡</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* 桌面 + 杯子 + 抽屉标签 */}
      <div className="relative z-20 shrink-0">
        {/* 白色桌面 */}
        <div className="relative mx-auto w-[94%] max-w-2xl h-40 bg-white/90 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.06)] flex items-center justify-center">
          {/* 杯子在桌面中央 */}
          <div className="absolute top-[-40px] cursor-pointer" onClick={shakeCup}>
            <PorcelainCup liquidColor={drinkCfg.color} fillPercent={75} size="small" shaking={cupShaking} />
          </div>

          {/* 左侧抽屉标签 - hover 时滑出像拉开抽屉 */}
          <button
            onClick={onOpenHistory}
            className="absolute left-[-12px] top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-r-xl pl-2 pr-3 py-6 flex flex-col items-center gap-1 border border-gray-100 border-l-0 hover:bg-wysa-pink/10 hover:left-[-28px] hover:pr-5 hover:shadow-xl transition-all duration-300 ease-out group"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 group-hover:text-wysa-green group-hover:translate-x-[2px] transition-transform duration-300">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-xs text-gray-400 group-hover:text-wysa-green font-bold writing-vertical transition-colors duration-300">历史抽屉</span>
          </button>

          {/* 右侧抽屉标签 - hover 时滑出像拉开抽屉 */}
          <button
            onClick={onOpenMonitor}
            className="absolute right-[-12px] top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-l-xl pr-2 pl-3 py-6 flex flex-col items-center gap-1 border border-gray-100 border-r-0 hover:bg-wysa-pink/10 hover:right-[-28px] hover:pl-5 hover:shadow-xl transition-all duration-300 ease-out group"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300 group-hover:text-wysa-green group-hover:-translate-x-[2px] transition-transform duration-300">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-xs text-gray-400 group-hover:text-wysa-green font-bold writing-vertical transition-colors duration-300">监控抽屉</span>
          </button>
        </div>
      </div>

      {/* 输入区 */}
      <div className="relative z-10 px-4 pb-4 pt-2">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder="输入你的困扰..."
            className="flex-1 px-5 py-3 rounded-full bg-white border border-gray-200 outline-none focus:border-wysa-coral focus:ring-2 focus:ring-wysa-coral/10 text-sm transition-all shadow-sm"
          />
          <button
            onClick={onSend}
            disabled={!inputText.trim()}
            className="px-6 py-3 rounded-full bg-wysa-green text-white font-bold text-sm hover:bg-wysa-green/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 左侧历史抽屉
// ==========================================
function HistoryDrawer({ open, onClose, chatHistory, sessionList, onLoadSession, onRefreshSessions, onNewSession }) {
  const rounds = [];
  for (let i = 0; i < chatHistory.length; i += 2) {
    rounds.push({
      user: chatHistory[i],
      agent: chatHistory[i + 1] || null,
      index: Math.floor(i / 2),
    });
  }

  const [drawerWidth, setDrawerWidth] = useState(380);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, startWidth: 0 });

  const onDragStart = (e) => {
    setIsDragging(true);
    dragState.current = { startX: e.clientX, startWidth: drawerWidth };
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const delta = e.clientX - dragState.current.startX;
      setDrawerWidth(Math.max(300, Math.min(700, dragState.current.startWidth + delta)));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/20 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-0 top-0 h-full bg-white shadow-2xl z-[70] flex flex-col"
            style={{ width: Math.min(drawerWidth, window.innerWidth * 0.85) }}
            initial={{ x: -drawerWidth }}
            animate={{ x: 0 }}
            exit={{ x: -drawerWidth }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-wysa-green">历史对话</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {/* 历史内容 - 去掉 line-clamp 以显示完整内容 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {rounds.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">暂无对话记录</p>
              )}
              {rounds.map((round) => (
                <div key={round.index} className="space-y-2">
                  <p className="text-xs text-gray-400 font-medium">第 {round.index + 1} 轮</p>
                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 whitespace-pre-line">
                    {round.user?.content || ''}
                  </div>
                  {round.agent && (
                    <div className="bg-wysa-pink/10 rounded-xl p-3 text-xs text-gray-600 whitespace-pre-line">
                      {round.agent.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 p-4 shrink-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-400">往期疗愈档案</span>
                <button onClick={onRefreshSessions} className="text-xs text-wysa-coral hover:underline">刷新</button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 mb-3">
                {sessionList.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => onLoadSession(s.id)}
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-50 text-xs text-gray-500 transition-colors"
                  >
                    {new Date(s.created_at).toLocaleDateString()} - {s.raw_event || '未命名会话'}
                  </button>
                ))}
                {sessionList.length === 0 && <p className="text-xs text-gray-300">暂无记录</p>}
              </div>
              <button
                onClick={onNewSession}
                className="w-full py-2 rounded-full bg-wysa-green text-white text-sm font-bold hover:bg-wysa-green/90 transition-colors"
              >
                + 新会话
              </button>
            </div>

            {/* 拖拽手柄 - 右边缘 */}
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-wysa-coral/20 transition-colors flex items-center justify-center group"
              onMouseDown={onDragStart}
            >
              <div className="w-[3px] h-12 rounded-full bg-gray-200 group-hover:bg-wysa-coral/50 transition-colors" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ==========================================
// 右侧监控抽屉
// ==========================================
function MonitorDrawer({ open, onClose, emotionTags, evidences, statusText, sessionList, onRefreshSessions, onLoadSession }) {
  const [drawerWidth, setDrawerWidth] = useState(380);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, startWidth: 0 });

  const onDragStart = (e) => {
    setIsDragging(true);
    dragState.current = { startX: e.clientX, startWidth: drawerWidth };
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const delta = dragState.current.startX - e.clientX; // 右抽屉: 左拖 = 变宽
      setDrawerWidth(Math.max(300, Math.min(700, dragState.current.startWidth + delta)));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/20 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 h-full bg-white shadow-2xl z-[70] flex flex-col"
            style={{ width: Math.min(drawerWidth, window.innerWidth * 0.85) }}
            initial={{ x: drawerWidth }}
            animate={{ x: 0 }}
            exit={{ x: drawerWidth }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
              <h3 className="font-bold text-gray-700">白盒监控</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 mb-1">当前状态</p>
                <p className="text-xs text-gray-500">{statusText}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 mb-2">七维情绪标签</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(emotionTags).map(([tag, score]) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: score > 50 ? '#ffcdd2' : '#c8e6c9',
                        color: score > 50 ? '#b71c1c' : '#1b5e20',
                      }}
                    >
                      {tag}: {score}
                    </span>
                  ))}
                  {Object.keys(emotionTags).length === 0 && (
                    <span className="text-xs text-gray-300">暂无情绪数据</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 mb-2">证据泡泡</h4>
                <div className="space-y-2">
                  {evidences.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg text-xs border"
                      style={{
                        background: ev.status === 'broken' ? '#e0e0e0' : 'white',
                        borderColor: ev.status === 'broken' ? '#999' : '#2196f3',
                        textDecoration: ev.status === 'broken' ? 'line-through' : 'none',
                      }}
                    >
                      <span className="font-bold">[{ev.tag}]</span> {ev.text}
                    </div>
                  ))}
                  {evidences.length === 0 && (
                    <span className="text-xs text-gray-300">暂无提取的证据</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-400">往期疗愈档案</span>
                  <button onClick={onRefreshSessions} className="text-xs text-wysa-coral hover:underline">刷新</button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {sessionList.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => onLoadSession(s.id)}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 text-xs text-gray-500 transition-colors"
                    >
                      {new Date(s.created_at).toLocaleDateString()} - {s.raw_event || '未命名会话'}
                    </button>
                  ))}
                  {sessionList.length === 0 && <p className="text-xs text-gray-300">暂无记录</p>}
                </div>
              </div>
            </div>

            {/* 拖拽手柄 - 左边缘 */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-wysa-coral/20 transition-colors flex items-center justify-center group"
              onMouseDown={onDragStart}
            >
              <div className="w-[3px] h-12 rounded-full bg-gray-200 group-hover:bg-wysa-coral/50 transition-colors" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ==========================================
// 主页面组件
// ==========================================
export default function AgentTest() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('idle');
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [monitorOpen, setMonitorOpen] = useState(false);

  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentAgentReply, setCurrentAgentReply] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [statusText, setStatusText] = useState('等待输入...');
  const [emotionTags, setEmotionTags] = useState({});
  const [evidences, setEvidences] = useState([]);
  const [sessionList, setSessionList] = useState([]);
  const [showCheckinPrompt, setShowCheckinPrompt] = useState(false);

  const userId = localStorage.getItem('user_id');
  const [sessionId, setSessionId] = useState(crypto.randomUUID());

  // 背景音乐：根据饮品切换
  const audioRef = useRef(null);
  useEffect(() => {
    if (phase === 'chatting' && selectedDrink && DRINK_MUSIC[selectedDrink]) {
      if (!audioRef.current) {
        audioRef.current = new Audio(DRINK_MUSIC[selectedDrink]);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.35;
      } else {
        audioRef.current.src = DRINK_MUSIC[selectedDrink];
      }
      audioRef.current.play().catch(() => {});
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [phase, selectedDrink]);

  const [musicPlaying, setMusicPlaying] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.35);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
      setMusicPlaying(true);
    } else {
      audioRef.current.pause();
      setMusicPlaying(false);
    }
  };

  const changeVolume = (v) => {
    const vol = parseFloat(v);
    setMusicVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      if (vol === 0 && musicPlaying) {
        audioRef.current.pause();
        setMusicPlaying(false);
      } else if (vol > 0 && !musicPlaying) {
        audioRef.current.play().catch(() => {});
        setMusicPlaying(true);
      }
    }
  };

  // ==========================================
  // 后端函数
  // ==========================================
  const fetchMySessions = async () => {
    if (!userId) { setStatusText('请先登录再查看历史'); return; }
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/user/sessions/${userId}`);
      const data = await res.json();
      setSessionList(data);
      setStatusText('历史清单已更新');
    } catch (err) { console.error('获取会话列表失败', err); }
  };

  const loadHistoryDetail = async (sid) => {
    setStatusText(`正在还原会话: ${sid}...`);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/chat/history/${sid}`);
      const data = await res.json();
      const formattedMessages = data.messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'agent',
        content: m.content,
      }));
      setChatHistory(formattedMessages);
      if (data.metadata) {
        setEmotionTags(data.metadata.emotion_labels || {});
        setEvidences(data.metadata.evidence_list || []);
        setStatusText(`历史记录加载成功 (当前阶段: ${data.metadata.current_stage})`);
      }
      setSessionId(sid);
      setHistoryOpen(false);
    } catch (err) { console.error('还原失败', err); setStatusText('记录还原失败'); }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    setShowCheckinPrompt(false);
    const newUserMsg = { role: 'user', content: inputText };
    setChatHistory((prev) => [...prev, newUserMsg]);
    setInputText('');
    setCurrentAgentReply('');
    setIsAgentThinking(true);
    setStatusText('正在连接大模型...');

    let accumulatedReply = '';

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, user_id: userId, message: newUserMsg.content }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

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
              if (data.type === 'status') { setStatusText(data.content); }
              else if (data.type === 'data_update') {
                setEmotionTags(data.emotion_tags);
                setEvidences(data.evidences);
              } else if (data.type === 'text_chunk') {
                setIsAgentThinking(false);
                accumulatedReply += data.content;
                setCurrentAgentReply((prev) => prev + data.content);
              } else if (data.type === 'done') {
                setStatusText('回复完毕');
                if (/打卡|签到|check-?in/i.test(accumulatedReply)) {
                  setShowCheckinPrompt(true);
                }
                const taskMatch = accumulatedReply.match(/【专属任务：(.*?)】/);
                if (taskMatch && taskMatch[1]) {
                  setShowCheckinPrompt(true);
                  fetch('http://127.0.0.1:8000/api/agent/custom_task', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, task_content: taskMatch[1] }),
                  }).catch((e) => console.error('下发专属任务失败', e));
                  fetch('http://127.0.0.1:8000/api/agent/complete', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId }),
                  }).catch((e) => console.error('打钩引导任务失败', e));
                }
              }
            } catch (e) { console.error('JSON解析出错', jsonStr, e); }
          }
        }
      }

      if (accumulatedReply) {
        setChatHistory((prev) => [...prev, { role: 'agent', content: accumulatedReply }]);
      }
      setCurrentAgentReply('');
    } catch (error) { setIsAgentThinking(false); setStatusText('连接失败，请检查后端是否在 8000 端口运行'); console.error(error); }
  };

  const handleNewSession = () => {
    setPhase('idle'); setSelectedDrink(null); setChatHistory([]);
    setCurrentAgentReply(''); setIsAgentThinking(false); setInputText('');
    setStatusText('等待输入...'); setEmotionTags({}); setEvidences([]);
    setShowCheckinPrompt(false);
    setSessionId(crypto.randomUUID()); setHistoryOpen(false); setMonitorOpen(false);
  };

  // ==========================================
  // 渲染
  // ==========================================
  return (
    <>
      {/* Plasma 底层 */}
      <div className="fixed inset-0 z-0" style={{ width: '100vw', height: '100vh' }}>
        <Plasma color="#E58889" opacity={0.6} speed={0.6} scale={1.2} />
      </div>

      <ClickSpark sparkColor="#E58889" sparkCount={8} sparkSize={12} duration={400}>
        <div className="min-h-screen relative z-[1]" style={{ background: 'rgba(251, 235, 232, 0.75)' }}>
          <style>{`
        .cup-body {
          background: linear-gradient(135deg, #ffffff 0%, #f7f4f0 30%, #e8e3db 100%);
          border: 2px solid #d0cbc4;
          border-radius: 8px 8px 32px 32px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06), inset 0 3px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.03);
          position: relative;
          overflow: hidden;
        }
        .cup-body::after {
          content: '';
          position: absolute;
          right: -18px;
          top: 25%;
          width: 20px;
          height: 45%;
          border: 3px solid #d0cbc4;
          border-left: none;
          border-radius: 0 18px 18px 0;
        }
        .cup-rim {
          position: absolute;
          top: 3px;
          left: 6px;
          right: 6px;
          height: 2px;
          background: rgba(255,255,255,0.6);
          border-radius: 3px;
          z-index: 3;
        }
        .cup-liquid {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          border-radius: 0 0 30px 30px;
        }
        .liquid-surface {
          position: absolute;
          top: -2px;
          left: 15%;
          right: 15%;
          height: 4px;
          background: rgba(255,255,255,0.35);
          border-radius: 50%;
        }
        .writing-vertical {
          writing-mode: vertical-rl;
          letter-spacing: 0.15em;
        }
      `}</style>

      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <IdleScene onStart={() => setPhase('selecting')} />
          </motion.div>
        )}

        {phase === 'selecting' && (
          <motion.div key="selecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <DrinkSelector onSelect={(drink) => { setSelectedDrink(drink); setPhase('pouring'); }} />
          </motion.div>
        )}

        {phase === 'pouring' && selectedDrink && (
          <motion.div key="pouring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PouringScene drinkType={selectedDrink} onComplete={() => setPhase('chatting')} />
          </motion.div>
        )}

        {phase === 'chatting' && (
          <motion.div key="chatting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* 顶栏 - 标题居中，音乐控制在右侧 */}
            <div className="fixed top-0 left-0 right-0 z-30 flex justify-center items-center py-3 pointer-events-none">
              <div className="bg-white/80 backdrop-blur rounded-full px-6 py-1.5 shadow-sm pointer-events-auto">
                <p className="text-xs font-bold text-wysa-green">心理咨询</p>
              </div>
              {/* 音乐控制 */}
              <div className="absolute right-4 flex items-center gap-2 bg-white/80 backdrop-blur rounded-full px-3 py-1.5 shadow-sm border border-gray-100 pointer-events-auto">
                <button
                  onClick={toggleMusic}
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  {musicPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-wysa-green">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                      <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={(e) => changeVolume(e.target.value)}
                  className="w-16 h-1 accent-wysa-coral cursor-pointer"
                />
              </div>
            </div>

            <ChatView
              chatHistory={chatHistory}
              currentAgentReply={currentAgentReply}
              isAgentThinking={isAgentThinking}
              inputText={inputText}
              onInputChange={setInputText}
              onSend={sendMessage}
              selectedDrink={selectedDrink}
              onOpenHistory={() => setHistoryOpen(true)}
              onOpenMonitor={() => setMonitorOpen(true)}
              showCheckinPrompt={showCheckinPrompt}
              onGoCheckin={() => { setShowCheckinPrompt(false); navigate('/checkin'); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

        </div>
      </ClickSpark>

      {/* 抽屉放在最外层，确保不被任何 stacking context 遮挡 */}
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        chatHistory={chatHistory}
        sessionList={sessionList}
        onLoadSession={loadHistoryDetail}
        onRefreshSessions={fetchMySessions}
        onNewSession={handleNewSession}
      />
      <MonitorDrawer
        open={monitorOpen}
        onClose={() => setMonitorOpen(false)}
        emotionTags={emotionTags}
        evidences={evidences}
        statusText={statusText}
        sessionList={sessionList}
        onRefreshSessions={fetchMySessions}
        onLoadSession={loadHistoryDetail}
      />
    </>
  );
}
