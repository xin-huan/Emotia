import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ColorBends from '../components/ColorBends';
import FlyingPosters from '../components/FlyingPosters';

import RotatingText from '../components/RotatingText';
import DecayCard from '../components/DecayCard';

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
// 主组件
// ==========================================
export default function Intro() {
  const [stage, setStage] = useState('eye');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(false);

  const getImage = (id) => {
    const map = { 1: '/welcome.png', 2: '/屏幕截图 2026-06-03 193442.png', 3: '/屏幕截图 2026-06-03 193701.png', 4: '/屏幕截图 2026-06-03 195238.png', 5: '/1.jpg', 6: '/2.jpg', 7: '/屏幕截图 2026-06-03 194200.png' };
    return map[id] || '/about1.jpg';
  };

  // 加载 Unicorn SDK
  useEffect(() => {
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



  useEffect(() => {
    const audio = new Audio('/M500003lTIFm4NKdSk.mp3');
    audio.loop = true;
    audio.volume = 0.25;

    const tryUnmute = () => {
      if (!audio) return;
      audio.muted = false;
      audio.play().catch(() => {});
      setShowUnmutePrompt(false);
      window.removeEventListener('pointerdown', tryUnmute);
      window.removeEventListener('keydown', tryUnmute);
    };

    // 尝试直接播放；若被浏览器阻止，则静音播放并在首次交互时解除静音
    audio.play().catch(() => {
      audio.muted = true;
      audio.play().catch(() => {});
      setShowUnmutePrompt(true);
      window.addEventListener('pointerdown', tryUnmute, { once: true });
      window.addEventListener('keydown', tryUnmute, { once: true });
    });

    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.removeEventListener('pointerdown', tryUnmute);
      window.removeEventListener('keydown', tryUnmute);
    };
  }, []);

  const handleUnmuteClick = () => {
    if (audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.play().catch(() => {});
    }
    setShowUnmutePrompt(false);
  };

  const handleEnter = () => {
    if (!audioRef.current) {
      const audio = new Audio('/M500003lTIFm4NKdSk.mp3');
      audio.loop = true;
      audio.volume = 0.25;
      audio.play().catch(() => {});
      audioRef.current = audio;
    } else {
      audioRef.current.play().catch(() => {});
    }
    setStage('ripple');
  };

  const posterImages = useMemo(() => WORK_ITEMS.map(item => getImage(item.id)), []);

  const handleActiveChange = useCallback((idx) => setActiveIndex(idx), []);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-hidden relative select-none"
      style={{ fontFamily: "'Neue Haas Grotesk', 'Helvetica Neue', sans-serif" }}
    >
        {showUnmutePrompt && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto">
            <button
              onClick={handleUnmuteClick}
              className="bg-black/70 text-white px-6 py-3 rounded-full backdrop-blur-sm"
            >欢迎光临</button>
          </div>
        )}
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
            className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }}
            transition={{ duration: 1 }}
            style={{ backgroundImage: 'url(/12.png)', backgroundSize: '100% 100%', backgroundPosition: 'center' }}
          >
            <DecayCard
              image="/12.png"
              baseFrequency={0.008}
              maxDisplacement={350}
              movementBound={40}
              className="!absolute"
            />
            <motion.div
              className="absolute top-8 left-12 z-10 flex items-center gap-6"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            >
              <span className="text-white text-3xl font-extrabold drop-shadow-lg">Emotia</span>
              <div className="px-4 py-1.5 rounded-xl backdrop-blur-sm" style={{ background: '#ffffff' }}>
                <RotatingText
                  texts={[
                    'HEAL EVERY EMOTIONAL WOUND',
                    'FIND YOUR INNER PEACE',
                    'EMBRACE YOUR JOURNEY',
                    'YOU ARE NOT ALONE',
                    'GROW THROUGH WHAT YOU GO THROUGH'
                  ]}
                  splitBy="words"
                  staggerDuration={0.02}
                  staggerFrom="first"
                  rotationInterval={3000}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  mainClassName="text-sm md:text-base font-bold text-wysa-green justify-center whitespace-nowrap"
                  elementLevelClassName="text-wysa-green"
                />
              </div>
            </motion.div>

            <div className="relative z-10 text-center px-8" style={{ transform: 'translateZ(80px)' }}>
              <motion.p
                className="text-white text-2xl md:text-4xl lg:text-5xl tracking-[0.15em] mb-8 font-extrabold"
                style={{ fontFamily: "'Playfair Display', serif", textShadow: '0 4px 24px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
              >YOUR PORTABLE MENTAL FIRST AID KIT</motion.p>


              <motion.p
                className="text-white text-lg md:text-xl tracking-wider mt-10 font-bold"
                style={{ fontFamily: "'Playfair Display', serif", textShadow: '0 3px 16px rgba(0,0,0,0.5)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
              >在 AI 陪伴与游戏化体验中 完成每一次自我成长</motion.p>
            </div>

            <motion.button
              onClick={() => setStage('work')}
              className="absolute bottom-16 text-white/80 border border-white/40 rounded-full px-12 py-4 text-sm tracking-[0.3em] hover:bg-white/15 hover:border-white/70 transition-all duration-500 z-10 backdrop-blur-sm"
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
            className="absolute inset-0 z-10"
            style={{ perspective: 1000 }}
            initial={{ y: '100%' }} animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: 0.6, ease: 'easeInOut' } }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          >
            {/* ColorBends 背景 */}
            <div className="absolute inset-0" style={{ background: '#c7ebdf' }}>
              <ColorBends
                rotation={90}
                speed={0.2}
                colors={["#10B981"]}
                transparent
                autoRotate={0}
                scale={1}
                frequency={1}
                warpStrength={1}
                mouseInfluence={1}
                parallax={0.5}
                noise={0.15}
                iterations={1}
                intensity={1.5}
                bandWidth={6}
              />
            </div>

            {/* 左侧卡片 + 右侧详情 */}
            <div className="absolute inset-0 z-10 flex">
              {/* 左侧：FlyingPosters */}
              <div className="w-1/2 h-full relative">
                <FlyingPosters
                  items={posterImages}
                  planeWidth={240}
                  planeHeight={320}
                  distortion={3}
                  scrollEase={0.1}
                  cameraFov={45}
                  cameraZ={20}
                  onActiveChange={handleActiveChange}
                />
              </div>

              {/* 右侧：功能介绍面板 */}
              <div className="w-1/2 h-full flex items-center justify-center p-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    className="w-full max-w-sm"
                    initial={{ opacity: 0, x: 80 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -80 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  >
                    <div className="bg-black/10 backdrop-blur-2xl rounded-3xl p-10 border border-white/[0.08] shadow-2xl shadow-black/30">
                      <h2
                        className="text-5xl md:text-6xl font-bold text-white mb-4"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >{WORK_ITEMS[activeIndex].title}</h2>
                      <p className="text-white/70 text-lg mb-2">{WORK_ITEMS[activeIndex].zh}</p>
                      <p className="text-white/40 text-sm mb-8">{WORK_ITEMS[activeIndex].desc}</p>

                      <motion.button
                        className="inline-flex items-center gap-3 text-white border border-white/30 rounded-full px-8 py-3 text-sm tracking-[0.2em] hover:bg-white/15 hover:border-white/60 transition-all duration-500"
                        onClick={() => { window.location.href = WORK_ITEMS[activeIndex].path; }}
                        whileHover={{ scale: 1.05, gap: '12px' }}
                        whileTap={{ scale: 0.95 }}
                      >
                        进入
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </motion.button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Emotia Logo */}
            <motion.div
              className="absolute top-8 left-12 text-white text-3xl font-extrabold z-20"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            >Emotia</motion.div>

            {/* 标题 */}
            <div className="absolute top-0 left-0 right-0 text-center pt-4 pb-6 pointer-events-none z-20">
              <motion.h2
                className="text-5xl md:text-7xl font-bold text-white mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              >My Work</motion.h2>
            </div>

            {/* 底部技术栈 - 可横向滚动 */}
            <motion.div
              className="absolute bottom-6 left-0 right-0 z-20 overflow-x-auto scrollbar-hide"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-3 px-8 min-w-max justify-center">
                {[
                  { name: 'React', color: '#61DAFB', icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none"><circle cx="12" cy="12" r="2.5" fill="#61DAFB"/><ellipse cx="12" cy="12" rx="10.5" ry="4" stroke="#61DAFB" strokeWidth="1"/><ellipse cx="12" cy="12" rx="4" ry="10.5" stroke="#61DAFB" strokeWidth="1" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10.5" ry="4" stroke="#61DAFB" strokeWidth="1" transform="rotate(120 12 12)"/></svg> },
                  { name: 'Three.js', color: '#fff', icon: <svg viewBox="0 0 24 24" className="w-4 h-4"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#fff" strokeWidth="1.2" fill="none"/><path d="M12 22V12M3 7l9 5M21 7l-9 5" stroke="#fff" strokeWidth="0.5" opacity="0.5"/></svg> },
                  { name: 'Framer', color: '#fff', icon: <svg viewBox="0 0 24 24" className="w-4 h-4"><path d="M4 16h8l-4 4h8l4-4M4 8h12l-4 4h8M4 4h16l-4 4" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                  { name: 'Tailwind', color: '#06B6D4', icon: <svg viewBox="0 0 24 24" className="w-4 h-4"><path d="M12 5C8.5 5 6.5 7 6 9.5c1.2-1.2 2.6-1.7 4.2-1.3.9.2 1.5.9 2.3 1.6 1.2 1.2 2.6 2.2 5.5 1 0-2.5-2-4.8-6-4.8z" fill="#06B6D4"/><path d="M12 12c-3.5 0-5.5 2-6 4.5 1.2-1.2 2.6-1.7 4.2-1.3.9.2 1.5.9 2.3 1.6 1.2 1.2 2.6 2.2 5.5 1 0-2.5-2-4.8-6-4.8z" fill="#06B6D4" opacity="0.5"/></svg> },
                  { name: 'WebGL', color: '#fff', icon: <svg viewBox="0 0 24 24" className="w-4 h-4"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#fff" strokeWidth="1.2" fill="none"/><path d="M3 8h18" stroke="#fff" strokeWidth="0.6"/><circle cx="7" cy="6.5" r="0.4" fill="#fff"/><circle cx="8.5" cy="6.5" r="0.4" fill="#fff"/><circle cx="10" cy="6.5" r="0.4" fill="#fff"/></svg> },
                  { name: 'OGL', color: '#fff', icon: <svg viewBox="0 0 24 24" className="w-4 h-4"><polygon points="12,2 22,7 22,17 12,22 2,17 2,7" stroke="#fff" strokeWidth="1.2" fill="none"/><polygon points="12,7 7,10 7,14 12,17 17,14 17,10" stroke="#fff" strokeWidth="0.8" fill="none"/></svg> },
                  { name: 'Node.js', color: '#83CD29', icon: <svg viewBox="0 0 24 24" className="w-4 h-4"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#83CD29" opacity="0.2" stroke="#83CD29" strokeWidth="1"/><path d="M12 7v10M7 10v4M17 10v4" stroke="#83CD29" strokeWidth="0.8"/></svg> },
                  { name: 'Vite', color: '#BD34FE', icon: <svg viewBox="0 0 24 24" className="w-4 h-4"><path d="M21.2 4.8L12 21.6 2.8 4.8l3.44 5.73L12 4.8l5.76 5.73L21.2 4.8z" fill="none" stroke="#BD34FE" strokeWidth="1.2" strokeLinejoin="round"/></svg> },
                  { name: 'OpenAI', color: '#74AA9C', icon: <svg viewBox="0 0 24 24" className="w-4 h-4"><circle cx="12" cy="12" r="9" stroke="#74AA9C" strokeWidth="1.2" fill="none"/><circle cx="12" cy="12" r="3" stroke="#74AA9C" strokeWidth="0.8" fill="none"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="#74AA9C" strokeWidth="0.6"/></svg> },
                ].map((tech, i) => (
                  <div
                    key={tech.name}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/10 backdrop-blur-md border border-white/[0.08] whitespace-nowrap shrink-0"
                  >
                    {tech.icon}
                    <span className="text-white/70 text-xs font-medium tracking-wider">{tech.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
