import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import UnicornScene from 'unicornstudio-react';
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
// 丝滑滚动容器（弹簧物理）
// ==========================================
function SmoothScrollContainer({ children }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const scrollY = useMotionValue(0);
  const smoothY = useSpring(scrollY, { stiffness: 100, damping: 24, mass: 0.7 });
  const translateY = useTransform(smoothY, v => -v);
  const maxScrollRef = useRef(0);
  const touchStartRef = useRef(0);
  const touchScrollRef = useRef(0);

  const measure = useCallback(() => {
    const c = containerRef.current;
    const content = contentRef.current;
    if (c && content) {
      maxScrollRef.current = Math.max(0, content.scrollHeight - c.clientHeight);
      const current = scrollY.get();
      if (current > maxScrollRef.current) scrollY.set(maxScrollRef.current);
    }
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const handleWheel = useCallback((e) => {
    const current = scrollY.get();
    const next = current + e.deltaY;
    scrollY.set(Math.max(0, Math.min(maxScrollRef.current, next)));
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={(e) => {
        touchStartRef.current = e.touches[0].clientY;
        touchScrollRef.current = scrollY.get();
      }}
      onTouchMove={(e) => {
        const dy = touchStartRef.current - e.touches[0].clientY;
        const next = touchScrollRef.current + dy;
        scrollY.set(Math.max(0, Math.min(maxScrollRef.current, next)));
      }}
    >
      <motion.div ref={contentRef} style={{ y: translateY }}>
        {children}
      </motion.div>
    </div>
  );
}

// ==========================================
// 3D 折叠漂浮卡片
// ==========================================
function WorkCard({ item, image, index }) {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springRotateX = useSpring(useTransform(mouseY, [0, 1], [12, -12]), { stiffness: 260, damping: 28 });
  const springRotateY = useSpring(useTransform(mouseX, [0, 1], [-12, 12]), { stiffness: 260, damping: 28 });
  const springZ = useSpring(useTransform(mouseY, [0, 0.5, 1], [0, 25, 0]), { stiffness: 260, damping: 28 });
  const springScale = useSpring(useTransform(mouseY, [0, 1], [1, 1.04]), { stiffness: 260, damping: 28 });

  return (
    <motion.div
      className="cursor-pointer rounded-xl overflow-hidden bg-white/5"
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        z: springZ,
        scale: springScale,
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.08, duration: 0.5, ease: 'easeOut' }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - r.left) / r.width);
        mouseY.set((e.clientY - r.top) / r.height);
      }}
      onMouseLeave={() => { mouseX.set(0.5); mouseY.set(0.5); }}
      onClick={() => { window.location.href = item.path; }}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img src={image} alt={item.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-3" style={{ transform: 'translateZ(10px)' }}>
        <h3 className="text-white font-semibold text-sm md:text-base">{item.title}</h3>
        <p className="text-white/50 text-xs mt-1">{item.zh}</p>
      </div>
    </motion.div>
  );
}

// ==========================================
// 主组件
// ==========================================
export default function Intro() {
  const [stage, setStage] = useState('eye');
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(false);

  const getImage = (id) => {
    const map = { 1: '/about3.png', 2: '/about1.jpg', 3: '/agent1.png', 4: '/test.png', 5: '/1.jpg', 6: '/A.png', 7: '/profile.png' };
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

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-hidden relative select-none"
      style={{ fontFamily: "'Neue Haas Grotesk', 'Helvetica Neue', sans-serif" }}
      onMouseMove={handleMouseMove}
    >
        {showUnmutePrompt && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto">
            <button
              onClick={handleUnmuteClick}
              className="bg-black/70 text-white px-6 py-3 rounded-full backdrop-blur-sm"
            >进入Emotia</button>
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
            className="absolute inset-0 z-10 flex flex-col"
            style={{ perspective: 1000 }}
            initial={{ y: '100%' }} animate={{ y: 0 }}
            exit={{ y: '100%', transition: { duration: 0.6, ease: 'easeInOut' } }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          >
            {/* Unicorn Studio WebGL 背景 */}
            <UnicornScene
              projectId="LURRevwKjtvCx6VgsLO7"
              width="100%"
              height="100%"
              scale={1}
              dpi={1.5}
              sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.12/dist/unicornStudio.umd.js"
            />

            {/* 卡片滚动区域（弹簧丝滑滚动） */}
            <SmoothScrollContainer>
              <div className="px-4 pb-8" style={{ transformStyle: 'preserve-3d' }}>
                {/* Our Work 标题 */}
                <div className="text-center pt-4 pb-6">
                  <motion.h2
                    className="text-3xl md:text-4xl font-bold text-white mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  >Our Work</motion.h2>
                  <motion.p
                    className="text-white/40 text-xs tracking-[0.2em]"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  >探索 Emotia 的每一个角落</motion.p>
                </div>

                {/* 双列卡片网格 */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-2xl mx-auto">
                  {WORK_ITEMS.map((item, i) => (
                    <WorkCard key={item.id} item={item} image={getImage(item.id)} index={i} />
                  ))}
                </div>
              </div>
            </SmoothScrollContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
