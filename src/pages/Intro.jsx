import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import Silk from '../components/Silk';
import InfiniteMenu from '../components/InfiniteMenu';
// ==========================================
// 稳定随机数
// ==========================================
function useStableRandom(seed, count) {
  return useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const s = seed + i * 0.1;
      const r1 = ((Math.sin(s * 12.9898) * 43758.5453) % 1 + 1) % 1;
      const r2 = ((Math.sin(s * 78.233 + 1) * 43758.5453) % 1 + 1) % 1;
      const r3 = ((Math.sin(s * 45.164 + 2) * 43758.5453) % 1 + 1) % 1;
      const r4 = ((Math.sin(s * 93.771 + 3) * 43758.5453) % 1 + 1) % 1;
      const r5 = ((Math.sin(s * 21.339 + 4) * 43758.5453) % 1 + 1) % 1;
      arr.push({ r: r1, r2, r3, r4, r5 });
    }
    return arr;
  }, [seed, count]);
}

// ==========================================
// 工作项目
// ==========================================
const WORK_ITEMS = [
  { id: 1, title: 'Home', zh: '首页', desc: 'Welcome to Emotia', path: '/home', color: '#E58889' },
  { id: 2, title: 'About', zh: '认识 Emotia', desc: 'What is CBT', path: '/about', color: '#567357' },
  { id: 3, title: 'Agent', zh: 'Agent 互动', desc: 'AI Therapy Room', path: '/agent', color: '#E58889' },
  { id: 4, title: 'Test', zh: '心理测评', desc: 'Self Assessment', path: '/Test', color: '#567357' },
  { id: 5, title: 'Forum', zh: '互动论坛', desc: 'Community Space', path: '/interactive', color: '#E58889' },
  { id: 6, title: 'Check In', zh: '活动打卡', desc: 'Daily Check-in', path: '/checkin', color: '#567357' },
  { id: 7, title: 'Profile', zh: '个人空间', desc: 'My Mind Space', path: '/ProfileDev', color: '#E58889' },
];

// ==========================================
// 子组件
// ==========================================
function Feather({ data }) {
  const startX = data.r * 100;
  const delay = data.r2 * 10;
  const duration = 8 + data.r3 * 12;
  const size = 12 + data.r4 * 20;
  const sway = (data.r5 - 0.5) * 200;
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: `${startX}%`, top: -40, fontSize: size, opacity: 0.4 + data.r * 0.3 }}
      initial={{ y: -40, x: 0, rotate: 0 }}
      animate={{ y: '110vh', x: [0, sway, -sway, sway * 0.5, 0], rotate: [0, 180, 360, 540, 720] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear', times: [0, 0.25, 0.5, 0.75, 1] }}
    >🪶</motion.div>
  );
}

const RippleText = React.memo(function RippleText({ text }) {
  const charData = useStableRandom(42, 100);
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
      {text.split(' ').map((word, wi) => (
        <span key={wi} className="inline-flex">
          {word.split('').map((char, ci) => {
            const d = charData[(wi * 10 + ci) % charData.length];
            return (
              <motion.span
                key={ci}
                className="inline-block text-6xl md:text-8xl font-bold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
                animate={{ y: [0, -8, 0, 8, 0], scale: [1, 1.04, 1, 1.04, 1] }}
                transition={{ duration: 3 + d.r * 2, delay: (wi * 10 + ci) * 0.06, repeat: Infinity, ease: 'easeInOut' }}
              >{char}</motion.span>
            );
          })}
        </span>
      ))}
    </div>
  );
});

// ==========================================
// 主组件
// ==========================================
export default function Intro() {
  const [stage, setStage] = useState('eye');
  const [activeWorkIndex, setActiveWorkIndex] = useState(0);

  const menuItems = useMemo(() => WORK_ITEMS.map(item => ({
    image: `/${item.id === 1 ? 'about3.png' : item.id === 2 ? 'about1.jpg' : item.id === 3 ? 'agent1.png' : item.id === 4 ? 'test.png' : item.id === 5 ? '1.jpg' : item.id === 6 ? 'A.png' : 'profile.png'}`,
    title: item.title,
    description: item.zh,
    link: item.path,
  })), []);

  const containerRef = useRef(null);
  const audioRef = useRef(null);

  // 加载 Unicorn SDK
  useEffect(() => {
    if (stage !== 'eye') return;
    const SDK = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.12/dist/unicornStudio.umd.js';
    const init = () => { if (window.UnicornStudio?.init) window.UnicornStudio.init(); };

    if (window.UnicornStudio?.init) {
      init();
    } else {
      const s = document.createElement('script');
      s.src = SDK;
      s.onload = init;
      document.head.appendChild(s);
    }
  }, [stage]);

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const smoothTiltX = useSpring(tiltX, { stiffness: 60, damping: 15 });
  const smoothTiltY = useSpring(tiltY, { stiffness: 60, damping: 15 });

  const featherData = useStableRandom(1, 15);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    tiltX.set((y - 0.5) * -12);
    tiltY.set((x - 0.5) * 12);
  }, []);


  useEffect(() => {
    const audio = new Audio('/M500003lTIFm4NKdSk.mp3');
    audio.loop = true;
    audio.volume = 0.25;
    audio.play().catch(() => {});
    audioRef.current = audio;
    return () => { audio.pause(); audioRef.current = null; };
  }, []);

  const handleEnter = () => {
    setStage('ripple');
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-hidden relative select-none"
      style={{ fontFamily: "'Neue Haas Grotesk', 'Helvetica Neue', sans-serif" }}
      onMouseMove={handleMouseMove}
    >
      {/* ==================== 阶段 1：Unicorn 入口 ==================== */}
      <AnimatePresence>
        {stage === 'eye' && (
          <motion.div
            key="eye"
            className="absolute inset-0 z-30"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            {/* Unicorn Studio 场景 - 原生 HTML 方式 */}
            <div className="absolute inset-0" id="unicorn-container"
              data-us-project="xHBjdUX4WtT5M6K2gUo8"
              data-us-scale="1"
              data-us-dpi="1.5"
              data-us-fps="60"
            />

            {/* ENTER 按钮浮在场景上方 */}
            <motion.button
              onClick={handleEnter}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white border-2 border-white/60 rounded-full px-16 py-4 text-lg tracking-[0.5em] font-bold hover:bg-white hover:text-wysa-green transition-all duration-500 z-10 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              ENTER
            </motion.button>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== 阶段 2：水波纹标语 ==================== */}
      <AnimatePresence>
        {stage === 'ripple' && (
          <motion.div
            key="ripple"
            className="absolute inset-0 bg-wysa-green flex flex-col items-center justify-center z-20 overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ duration: 1 }}
            style={{ rotateX: smoothTiltX, rotateY: smoothTiltY, perspective: 1200 }}
          >
            <motion.div
              className="absolute top-8 left-12 text-white text-3xl font-extrabold z-10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            >Emotia</motion.div>

            {featherData.map((d, i) => <Feather key={i} data={d} />)}

            <div className="relative z-10 text-center px-8" style={{ transform: 'translateZ(80px)' }}>
              <motion.p
                className="text-white/60 text-lg tracking-[0.3em] mb-12"
                style={{ fontFamily: "'Playfair Display', serif" }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              >YOUR PORTABLE MENTAL FIRST AID KIT</motion.p>
              <RippleText text="HEAL EVERY EMOTIONAL WOUND" />
              <motion.p
                className="text-white/40 text-base tracking-wider mt-16"
                style={{ fontFamily: "'Playfair Display', serif" }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
              >在 AI 陪伴与游戏化体验中 完成每一次自我成长</motion.p>
            </div>

            <motion.button
              onClick={() => setStage('work')}
              className="absolute bottom-16 text-white/70 border border-white/30 rounded-full px-12 py-4 text-sm tracking-[0.3em] hover:bg-white/10 hover:border-white/60 transition-all duration-500 z-10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
              whileHover={{ scale: 1.05 }}
            >VIEW WORK ↓</motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== 阶段 3：工作卡片 ==================== */}
      <AnimatePresence>
        {stage === 'work' && (
          <motion.div
            key="work"
            className="absolute inset-0 bg-[#1a2a1a] z-10 overflow-hidden flex flex-col"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
            style={{ rotateX: smoothTiltX, rotateY: smoothTiltY, perspective: 1000 }}
          >
            {/* Silk 动态丝缎背景 */}
            <div className="absolute inset-0 z-0">
              <Silk
                speed={3}
                scale={1.2}
                color="#567357"
                noiseIntensity={1.2}
                rotation={0.3}
              />
            </div>

            <div className="text-center pt-6 pb-2 shrink-0 pointer-events-none relative z-10">
              <motion.h2
                className="text-4xl md:text-5xl font-bold text-white mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              >Our Work</motion.h2>
              <motion.p
                className="text-white/50 text-sm tracking-[0.2em]"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              >探索 Emotia 的每一个角落</motion.p>
            </div>

            {/* InfiniteMenu 3D 球体 */}
            <div className="flex-1 relative z-10 -mt-12">
              <InfiniteMenu
                items={menuItems}
                scale={1.4}
                onItemClick={(active) => window.location.href = active.link}
                onActiveChange={(_item, idx) => setActiveWorkIndex(idx)}
              />
            </div>

            {/* 紫色圆形按钮 - absolute 固定定位在球体下方中央 */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30">
              <motion.button
                onClick={() => window.location.href = WORK_ITEMS[activeWorkIndex].path}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-wysa-green hover:bg-wysa-green/80 shadow-[0_0_30px_rgba(86,115,87,0.5)] transition-all"
                whileHover={{ scale: 1.1, boxShadow: '0 0 50px hsla(262, 83%, 58%, 0.70)' }}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/>
                  <polyline points="5 12 12 5 19 12"/>
                </svg>
              </motion.button>
            </div>

            {/* 当前项目名称 - absolute 定位 */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30">
              <span className="text-white/50 text-xs tracking-wider whitespace-nowrap">{WORK_ITEMS[activeWorkIndex].zh} — {WORK_ITEMS[activeWorkIndex].title}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
