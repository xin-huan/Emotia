"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'; // 确保安装了 motion/react 或 framer-motion
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useNavigate } from 'react-router-dom';
// 自定义特效组件引入 (保持原样)
import PixelTransition from '../PixelTransition';
import ClickSpark from '../ClickSpark';
import CircularText from '../CircularText';
import ShapeBlur from '../ShapeBlur';
import GooeyNav from '../GooeyNav';

// --- 导航菜单数据配置 ---
const navItems = [
  { label: '首页', href: '/' },
  { label: '认识', href: '/about' },
  { label: '互动论坛', href: '/interactive' },
  { label: 'Agent互动', href: '/Agent' },
  { label: '测试', href: '#' },
  { label: '活动打卡', href: '#' },
  { label: '个人空间', href: '#' }
];

const Navbar = ({ onLoginClick }) => {
  const navigate = useNavigate(); // 1. 初始化跳转钩子

  return (
    <nav className="fixed top-0 left-0 w-full bg-wysa-green px-12 md:px-24 py-3 flex items-center justify-between z-50 shadow-md">
      {/* 点击 Logo 返回首页 */}
      <div
        className="text-3xl font-extrabold text-white font-sans relative z-10 cursor-pointer"
        onClick={() => navigate('/')}
      >
        Emotia
      </div>

      <div className="flex-1 flex justify-center text-sm font-medium relative z-0">
        {/* 2. 给你的导航组件传入跳转逻辑 */}
        {/* 注意：这取决于你的 GooeyNav 内部是怎么写的，通常它会有一个处理点击的回调 */}
        <GooeyNav
          items={navItems}
          animationTime={500}
          onItemClick={(item) => navigate(item.href)} // 如果 GooeyNav 支持 onItemClick
        />
      </div>

      <button
        onClick={onLoginClick}
        className="bg-wysa-pink text-wysa-green px-6 py-1.5 rounded-full shadow-sm hover:bg-wysa-pink transition text-sm font-bold relative z-10 cursor-pointer"
      >
        登录
      </button>
    </nav>
  );
};

// ==========================================
// 2. 首屏欢迎区组件 (Hero)
// ==========================================
const HeroSection = () => (
  <section className="pt-32 pb-20 px-12 md:px-24 w-full flex items-center justify-between min-h-[90vh]">
    <div className="w-1/2 pr-16 text-left">
      <h1 className="font-black mb-10 tracking-tighter text-wysa-green">
        <div className="text-5xl lg:text-5xl mb-2 opacity-80">welcome to</div>
        <span className="text-6xl lg:text-9xl border-b-[10px] border-wysa-coral pb-2 inline-block">Emotia</span>
      </h1>
      <div className="space-y-6 text-xl text-gray-700 mb-14 leading-relaxed text-left">
        <p className="text-3xl font-bold text-wysa-green">你的随身“心理急救箱”，随时随地化解情绪危机</p>
        <p className="text-xl">告别“患者”标签，在AI陪伴与游戏化体验中，完成每一次自我成长</p>
      </div>
      <div className="flex items-center justify-start space-x-4">
        <button className="bg-wysa-coral text-white border border-wysa-coral rounded-full px-10 py-3.5 text-xl font-semibold hover:opacity-90 transition flex items-center space-x-2 shadow-lg">
          <span>了解更多</span><span>→</span>
        </button>
      </div>
    </div>
    <div className="w-1/2 flex justify-end">
      <div className="w-full max-w-[650px] h-[500px] bg-white rounded-[50px] flex items-center justify-center shadow-xl overflow-hidden relative">
        <img src="/welcome.png" alt="Welcome to Emotia" className="w-full h-full object-cover absolute top-0 left-0" />
        <div className="absolute inset-0 bg-black/5"></div>
      </div>
    </div>
  </section>
);

// ==========================================
// 3. CBT 介绍组件 (What is CBT)
// ==========================================
const CbtSection = () => {
  const navigate = useNavigate(); // 加入跳转钩子

  return (
    <section className="pt-12 pb-16 px-12 md:px-24 w-full border-t-2 border-dashed border-gray-100 bg-wysa-pink relative overflow-hidden">
      <div className="absolute -right-10 -bottom-20 text-[18rem] font-black text-white/50 pointer-events-none select-none z-0 leading-none">CBT</div>
      <h2 className="text-6xl font-extrabold mb-8 text-left text-wysa-green relative z-10 tracking-tight">what is CBT</h2>
      <div className="relative w-full max-w-5xl mx-auto h-[540px] z-10">

        {/* 认知部分 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 group flex flex-col items-center">
          <div className="relative w-46 h-46 flex items-center justify-center">
            <CircularText text="认知 THOUGHTS " spinDuration={20} className="absolute z-0 text-wysa-green" />
            <div className="w-40 h-40 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white shadow-sm group-hover:border-wysa-green transition-all duration-300 overflow-hidden p-3 z-10 cursor-pointer">
              <img src="/thoughts.jpg" alt="认知" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="absolute -right-64 top-16 w-60 bg-white p-4 border border-gray-100 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none text-left">
            <p className="text-sm text-gray-600 leading-relaxed">在认知行为疗法（CBT）过程中，认知指个体对自身、他人以及世界的看法和解释方式。人们往往会形成自动化思维，例如“我做不好这件事”。在CBT中，核心是识别这些非理性思维模式，将其转化为客观平衡的思考方式。</p>
            <div className="absolute left-[-6px] top-6 w-3 h-3 bg-white border-l border-b border-gray-100 rotate-45"></div>
          </div>
        </div>

        {/* 情绪部分 */}
        <div className="absolute bottom-14 left-4 group flex flex-col items-center">
          <div className="relative w-56 h-56 flex items-center justify-center">
            <CircularText text="情绪 EMOTIONS " spinDuration={25} className="absolute z-0 text-wysa-green" />
            <div className="w-40 h-40 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white shadow-sm hover:border-wysa-green transition-all duration-300 overflow-hidden p-3 z-10 cursor-pointer">
              <img src="/emotions.jpg" alt="情绪" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="absolute -right-64 top-16 w-60 bg-white p-4 border border-gray-100 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none text-left">
            <p className="text-sm text-gray-600 leading-relaxed">情感是由认知所引发的内在体验。CBT框架中，情绪并非孤立存在，同一事件不同解释会导致截然不同的情绪反应。CBT通过调整认知来间接改善情绪体验，将挫败感转化为动力与希望。</p>
            <div className="absolute left-[-6px] top-6 w-3 h-3 bg-white border-r border-t border-gray-100 rotate-45"></div>
          </div>
        </div>

        {/* 行为部分 */}
        <div className="absolute bottom-14 right-4 group flex flex-col items-center">
          <div className="relative w-56 h-56 flex items-center justify-center">
            <CircularText text="行为 BEHAVIORS " spinDuration={15} className="absolute z-0 text-wysa-green" />
            <div className="w-40 h-40 rounded-full border-2 border-gray-300 flex items-center justify-center bg-white shadow-sm hover:border-wysa-green transition-all duration-300 overflow-hidden p-3 z-10 cursor-pointer">
              <img src="/behaviors.jpg" alt="行为" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="absolute -left-64 top-16 w-60 bg-white p-4 border border-gray-100 rounded-2xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none text-left">
            <p className="text-xg text-gray-600 leading-relaxed">行为是个体在认知与情感驱动下的外在行动，也是干预的重要入口。负性认知会导致回避等不适应行为，CBT强调通过“行为激活”等方法，鼓励获取新经验反馈，建立更健康的认知与情绪循环。</p>
            <div className="absolute right-[-6px] top-6 w-3 h-3 bg-white border-l border-b border-gray-100 rotate-45"></div>
          </div>
        </div>

        {/* 中心按钮区域 */}
        <div className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-0 w-full flex flex-col items-center">
          <h3 className="text-7xl lg:text-8xl font-black mb-6 text-wysa-green tracking-tight opacity-90 leading-none">C.B.T</h3>
          {/* 加入了 onClick 跳转功能 */}
          <button
            onClick={() => navigate('/about')}
            className="group border-2 border-wysa-coral text-wysa-coral rounded-full px-8 py-2.5 text-lg font-bold hover:bg-wysa-coral hover:text-white transition-all duration-300 relative z-30 inline-flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <span>了解更多</span><span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 4. 服务人群组件 (We serve for)
// ==========================================
const ServeForSection = () => (
  <section className="min-h-screen pt-20 pb-16 px-12 md:px-24 w-full bg-wysa-pink relative flex flex-col justify-center border-t-2 border-dashed border-white/60">
    <h2 className="text-6xl font-extrabold mb-12 text-left text-wysa-green shrink-0">
      <span className="border-b-8 border-wysa-coral pb-3">we serve for</span>
    </h2>
    <div className="flex flex-col lg:flex-row justify-between items-stretch gap-10 h-[460px] w-full max-w-7xl mx-auto">
      <div className="w-full lg:w-1/2 h-full bg-black rounded-[40px] overflow-hidden shadow-2xl relative border-4 border-white">
        <video className="absolute top-0 left-0 w-full h-full object-cover" controls preload="metadata" src="/cbt.mp4">
          您的浏览器不支持视频播放。
        </video>
      </div>
      <PixelTransition
        gridSize={12} pixelColor="#ffffff" aspectRatio="0" className="w-full lg:w-1/2 h-full shadow-xl"
        style={{ width: '100%', maxWidth: '100%', borderRadius: '40px', backgroundColor: '#ffffff', border: '1px solid rgba(255,255,255,0.5)', margin: 0 }}
        firstContent={<img src="/6.jpg" alt="People" className="w-full h-full object-cover rounded-[40px]" />}
        secondContent={
          <div className="w-full h-full bg-wysa-pink p-10 flex flex-col justify-center relative overflow-hidden rounded-[40px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-wysa-coral/10 rounded-bl-full -z-0"></div>
            <h3 className="text-3xl font-extrabold text-wysa-green mb-6 relative z-10 flex items-center gap-4">CBT 能帮助谁？</h3>
            <div className="space-y-5 text-gray-600 leading-relaxed relative z-10 text-[15px] lg:text-base">
              <p>认知行为疗法（CBT）通常适用于存在<strong className="text-wysa-coral">轻至中度情绪困扰</strong>的人群，例如焦虑、抑郁、压力管理问题，以及出现负性思维模式的个体。这类人群往往具备一定的自我反思能力，愿意参与结构化的练习并尝试调整思维与行为。</p>
              <p>基于 Agent（智能体）的 CBT 干预，更适合具有<strong className="text-wysa-coral">自我驱动性、对隐私较敏感或不便接受面对面咨询</strong>的人群（如学生、职场新人或轻度情绪波动者），在安全的环境中获得倾听与重构。</p>
              <p>注意：症状较为严重（如重度抑郁、复杂创伤或急性心理危机）的个体，仍更适合在专业心理治疗师的指导下进行干预，而非单独依赖 Agent 系统。</p>
            </div>
          </div>
        }
      />
    </div>
  </section>
);


// ==========================================
// 5. 交互式卡片轮播核心组件
// ==========================================
const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const GAP = 16;
const SPRING_OPTIONS = { type: 'spring', stiffness: 300, damping: 30 };

function CarouselItem({ item, index, itemWidth, trackItemOffset, x, transition }) {
  const range = [-(index + 1) * trackItemOffset, -index * trackItemOffset, -(index - 1) * trackItemOffset];
  const outputRange = [90, 0, -90];
  const rotateY = useTransform(x, range, outputRange, { clamp: false });

  return (
    <motion.div
      key={`${item?.id ?? index}-${index}`}
      className="relative shrink-0 flex flex-col items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing w-full h-full"
      style={{ width: itemWidth, rotateY: rotateY }}
      transition={transition}
    >
      {item.content}
    </motion.div>
  );
}

function CardCarousel({ items = [], baseWidth = 300, autoplay = false, autoplayDelay = 3000, pauseOnHover = true, loop = true }) {
  const itemWidth = baseWidth;
  const trackItemOffset = itemWidth + GAP;

  const itemsForRender = useMemo(() => {
    if (!loop) return items;
    if (items.length === 0) return [];
    return [items[items.length - 1], ...items, items[0]];
  }, [items, loop]);

  const [position, setPosition] = useState(loop ? 1 : 0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (pauseOnHover && containerRef.current) {
      const container = containerRef.current;
      const handleMouseEnter = () => setIsHovered(true);
      const handleMouseLeave = () => setIsHovered(false);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [pauseOnHover]);

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1) return undefined;
    if (pauseOnHover && isHovered) return undefined;
    const timer = setInterval(() => {
      setPosition((prev) => Math.min(prev + 1, itemsForRender.length - 1));
    }, autoplayDelay);
    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length]);

  useEffect(() => {
    const startingPosition = loop ? 1 : 0;
    setPosition(startingPosition);
    x.set(-startingPosition * trackItemOffset);
  }, [items.length, loop, trackItemOffset, x]);

  const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

  const handleAnimationComplete = () => {
    if (!loop || itemsForRender.length <= 1) {
      setIsAnimating(false);
      return;
    }
    const lastCloneIndex = itemsForRender.length - 1;
    if (position === lastCloneIndex) {
      setIsJumping(true);
      setPosition(1);
      x.set(-1 * trackItemOffset);
      requestAnimationFrame(() => { setIsJumping(false); setIsAnimating(false); });
      return;
    }
    if (position === 0) {
      setIsJumping(true);
      setPosition(items.length);
      x.set(-items.length * trackItemOffset);
      requestAnimationFrame(() => { setIsJumping(false); setIsAnimating(false); });
      return;
    }
    setIsAnimating(false);
  };

  const handleDragEnd = (_, info) => {
    const { offset, velocity } = info;
    const direction = offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD ? 1 : offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD ? -1 : 0;
    if (direction === 0) return;
    setPosition((prev) => {
      const next = prev + direction;
      return Math.max(0, Math.min(next, itemsForRender.length - 1));
    });
  };

  const activeIndex = items.length === 0 ? 0 : loop ? (position - 1 + items.length) % items.length : Math.min(position, items.length - 1);

  return (
    <div ref={containerRef} className="relative overflow-hidden w-full h-full flex flex-col justify-between">
      <motion.div
        className="flex h-full"
        drag={isAnimating ? false : 'x'}
        dragConstraints={loop ? {} : { left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0), right: 0 }}
        style={{
          width: itemWidth, gap: `${GAP}px`, perspective: 1000,
          perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`, x
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(position * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationStart={() => setIsAnimating(true)}
        onAnimationComplete={handleAnimationComplete}
      >
        {itemsForRender.map((item, index) => (
          <CarouselItem key={`${item?.id ?? index}-${index}`} item={item} index={index} itemWidth={itemWidth} trackItemOffset={trackItemOffset} x={x} transition={effectiveTransition} />
        ))}
      </motion.div>

      {/* 底部指示点 */}
      <div className="absolute z-20 bottom-0 left-1/2 -translate-x-1/2 flex w-full justify-center pb-2 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          {items.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 w-2 rounded-full cursor-pointer transition-colors duration-150 ${activeIndex === index ? 'bg-wysa-green' : 'bg-wysa-green/30'}`}
              animate={{ scale: activeIndex === index ? 1.2 : 1 }}
              onClick={() => setPosition(loop ? index + 1 : index)}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const InteractiveFeatureCard = ({ items }) => {
  const [width, setWidth] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative overflow-hidden bg-wysa-coral/30 backdrop-blur-xl rounded-[50px] p-6 h-64 flex flex-col items-center justify-center text-center shadow-xl group transition-all duration-300 hover:bg-white/50 hover:-translate-y-1">
      <div className="absolute inset-0 z-0 pointer-events-none">
         <ShapeBlur variation={0} shapeSize={2.0} roundness={0.8} borderSize={0.035} />
      </div>
      <div ref={containerRef} className="relative z-20 w-full h-full">
        {width > 0 && <CardCarousel items={items} baseWidth={width} />}
      </div>
    </div>
  );
};


// ==========================================
// 6. 功能总结卡片 (Features)
// ==========================================
const FeaturesSection = () => {
  const agentItems = [
    {
      id: 'text-1',
      content: (
        <div className="flex flex-col items-center w-full justify-center h-full pb-6">
          <p className="text-2xl font-extrabold text-wysa-green mb-4 drop-shadow-sm">agent疗愈</p>
          <div className="flex flex-col gap-2.5 items-center w-full">
            <p className="text-[15px] font-bold text-wysa-green bg-white/30 px-5 py-1.5 rounded-full border border-white/50 shadow-sm w-full max-w-[200px] truncate">实现认知重构</p>
            <p className="text-[15px] font-bold text-wysa-green bg-white/30 px-5 py-1.5 rounded-full border border-white/50 shadow-sm w-full max-w-[200px] truncate">情感表达与支持</p>
            <p className="text-[15px] font-bold text-wysa-green bg-white/30 px-5 py-1.5 rounded-full border border-white/50 shadow-sm w-full max-w-[200px] truncate">治疗联盟的形成</p>
          </div>
        </div>
      ),
    },
    { id: 'img-1-1', content: <img src="/1.jpg" alt="Feature 1" className="w-[90%] h-[90%] object-cover rounded-[30px] shadow-sm pointer-events-none" /> },
    { id: 'img-1-2', content: <img src="/2.jpg" alt="Feature 2" className="w-[90%] h-[90%] object-cover rounded-[30px] shadow-sm pointer-events-none" /> }
  ];

  const gameItems = [
    {
      id: 'text-2',
      content: (
        <div className="flex flex-col items-center w-full justify-center h-full pb-6">
          <p className="text-2xl font-extrabold text-wysa-green mb-4 drop-shadow-sm">打卡 or 游戏</p>
          <div className="flex flex-col gap-3 items-center w-full">
            <p className="text-base font-bold text-wysa-green bg-white/30 px-6 py-2 rounded-full border border-white/50 shadow-sm">放松与正念</p>
            <p className="text-base font-bold text-wysa-green bg-white/30 px-6 py-2 rounded-full border border-white/50 shadow-sm">情感表达与支持</p>
          </div>
        </div>
      ),
    },
    { id: 'img-2-1', content: <img src="/3.jpg" alt="Feature" className="w-[90%] h-[90%] object-cover rounded-[30px] shadow-sm pointer-events-none" /> }
  ];

  const spaceItems = [
    {
      id: 'text-3',
      content: (
        <div className="flex flex-col items-center w-full justify-center h-full pb-6">
          <p className="text-2xl font-extrabold text-wysa-green mb-4 drop-shadow-sm">个人空间</p>
          <div className="flex flex-col gap-3 items-center w-full">
            <p className="text-base font-bold text-wysa-green bg-white/30 px-6 py-2 rounded-full border border-white/50 shadow-sm">实现自我监控与反馈</p>
          </div>
        </div>
      ),
    },
    { id: 'img-3-1', content: <img src="/5.jpg" alt="Feature" className="w-[90%] h-[90%] object-cover rounded-[30px] shadow-sm pointer-events-none" /> }
  ];

  return (
    <section className="py-24 px-12 md:px-24 w-full relative">
      <h2 className="text-6xl font-extrabold mb-12 text-left text-wysa-green">what can we do</h2>
      <div className="w-full h-[350px] rounded-[50px] mb-16 shadow-xl overflow-hidden relative group">
        <img src="/about3.png" alt="Features Banner" className="w-full h-full object-cover object-[55%_20%] relative z-0" />
        <div className="absolute inset-0 z-10 pointer-events-none opacity-90 mix-blend-screen">
          <ShapeBlur variation={0} shapeSize={2.0} roundness={0.8} borderSize={0.02} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-10 mb-8">
        <InteractiveFeatureCard items={agentItems} />
        <InteractiveFeatureCard items={gameItems} />
        <InteractiveFeatureCard items={spaceItems} />
      </div>
      <div className="grid grid-cols-3 gap-10">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white/60 backdrop-blur-md border border-white/80 rounded-full py-4 px-10 flex justify-between items-center cursor-pointer hover:bg-white transition-all shadow-lg hover:shadow-xl group">
            <span className="text-xl font-extrabold text-wysa-green">准备好了吗</span>
            <span className="text-3xl text-wysa-coral group-hover:translate-x-3 transition-transform duration-300">→</span>
          </div>
        ))}
      </div>
    </section>
  );
};

// ==========================================
// 7. 评价与消息 & 常见问题 (Feedback & FAQ)
// ==========================================
const FeedbackSection = () => {
  const wordCloudData = [
    { text: "心理复原力", size: "text-xs", color: "text-wysa-green/60", weight: "font-normal" },
    { text: "深夜陪伴", size: "text-xs", color: "text-wysa-coral/60", weight: "font-normal" },
    { text: "亲测有效", size: "text-xs", color: "text-gray-500", weight: "font-normal" },
    { text: "心理按摩", size: "text-[10px]", color: "text-wysa-green/60", weight: "font-normal" },
    { text: "豁然开朗", size: "text-xs", color: "text-wysa-coral/60", weight: "font-normal" },
    { text: "干货满满", size: "text-[10px]", color: "text-gray-500", weight: "font-normal" },

    { text: "走出低谷", size: "text-lg", color: "text-wysa-green", weight: "font-bold" },
    { text: "心理树洞", size: "text-xl", color: "text-gray-600", weight: "font-extrabold" },
    { text: "改善睡眠", size: "text-2xl", color: "text-wysa-coral", weight: "font-bold" },
    { text: "建议收藏", size: "text-sm", color: "text-gray-500", weight: "font-semibold" },
    { text: "停止反刍", size: "text-lg", color: "text-wysa-green", weight: "font-bold" },

    { text: "治愈系", size: "text-sm", color: "text-gray-500", weight: "font-medium" },
    { text: "情绪急救", size: "text-4xl", color: "text-gray-800", weight: "font-black" },
    { text: "情绪日记", size: "text-[10px]", color: "text-wysa-green", weight: "font-medium" },
    { text: "解压", size: "text-5xl", color: "text-wysa-green", weight: "font-black" },
    { text: "宝藏Agent", size: "text-3xl", color: "text-wysa-coral", weight: "font-black" },
    { text: "认知偏差", size: "text-xs", color: "text-gray-500", weight: "font-medium" },

    { text: "告别emo", size: "text-xl", color: "text-wysa-coral", weight: "font-extrabold" },
    { text: "正念练习", size: "text-2xl", color: "text-gray-800", weight: "font-black" },
    { text: "不再精神内耗", size: "text-xs", color: "text-wysa-green/70", weight: "font-medium" },
    { text: "缓解焦虑", size: "text-3xl", color: "text-gray-700", weight: "font-extrabold" },
    { text: "接纳自己", size: "text-lg", color: "text-wysa-green", weight: "font-bold" },
    { text: "行为实验", size: "text-base", color: "text-gray-600", weight: "font-bold" },

    { text: "温柔且坚定", size: "text-sm", color: "text-gray-500", weight: "font-medium" },
    { text: "情绪稳定器", size: "text-xs", color: "text-wysa-coral/70", weight: "font-normal" },
    { text: "实用性极强", size: "text-sm", color: "text-wysa-green/80", weight: "font-semibold" },
    { text: "思维导图", size: "text-xs", color: "text-gray-500", weight: "font-normal" },
    { text: "深度对话", size: "text-sm", color: "text-gray-600", weight: "font-medium" },
    { text: "我的云端咨询师", size: "text-xs", color: "text-wysa-green/70", weight: "font-normal" },
  ];

  const faqData = [
    { num: 1, text: "每次和朋友聚会后，我都会反复回想自己是不是说错话了，怎么办？", replies: 128 },
    { num: 2, text: "睡前脑子停不下来，越想睡越清醒，CBT练习能帮我吗？", replies: 95 },
    { num: 3, text: "工作压力大到喘不过气，怎么快速缓解焦虑？", replies: 84 },
    { num: 4, text: "如何停止因为小事产生的长时间精神内耗？", replies: 67 },
    { num: 5, text: "和伴侣沟通时总是容易争吵，怎么用认知重构改善关系？", replies: 42 },
  ];

  const newsData = [
    { id: 1, img: "1.jpg", title: "认知行为疗法（CBT）如何重塑你的大脑神经连接？", date: "2026-04-10" },
    { id: 2, img: "2.jpg", title: "对抗深夜焦虑：5个随时随地可以做的正念小练习", date: "2026-04-08" },
    { id: 3, img: "3.jpg", title: "告别“情绪内耗”：Agent 是如何成为你的专属倾听者的？", date: "2026-04-01" },
  ];

  return (
    <section className="py-16 px-12 md:px-24 w-full flex flex-col gap-10">

      {/* ================= 上半部分：评价与问题 ================= */}
      <div className="flex flex-col lg:flex-row gap-8 w-full items-stretch">

        {/* 左侧：标准化经典词云评价 - 恢复玻璃透视态，融入粉色背景 */}
        <div className="w-full lg:w-[45%] flex flex-col">
          <h3 className="text-2xl font-extrabold mb-4 text-wysa-green text-left">用户怎么说</h3>

          <div className="h-[360px] bg-white/70 backdrop-blur-md border border-wysa-coral/30 rounded-[30px] p-6 flex justify-center items-center relative overflow-hidden shadow-lg group">
            <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-white rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-white rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-wrap justify-center items-baseline content-center text-center gap-x-3 gap-y-1 leading-[1.1] w-full px-2">
              {wordCloudData.map((word, index) => (
                <span
                  key={index}
                  className={`
                    inline-block ${word.size} ${word.color} ${word.weight}
                    transition-colors duration-300 hover:text-wysa-coral cursor-default select-none
                  `}
                >
                  {word.text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：常见问题 - 恢复深绿色主题！撞色更高级 */}
        <div className="w-full lg:w-[55%] flex flex-col">
          <h3 className="text-2xl font-extrabold mb-4 text-wysa-green text-left">我们懂得你 —— 常见问题</h3>
          <div className="h-[360px] bg-wysa-green/70 border border-wysa-green rounded-[30px] p-6 flex flex-col relative shadow-lg text-white">

            <h4 className="font-bold text-white text-base flex items-center gap-2 mb-3 border-b border-white/20 pb-2 shrink-0">
              <span className="text-wysa-coral text-lg">🔥</span> 社区热门讨论
            </h4>

            <div className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {faqData.map((item) => (
                <div key={item.num} className="group flex items-start gap-3 cursor-pointer hover:bg-white/10 py-2 px-2 -mx-2 rounded-xl transition-colors">
                  <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 shadow-sm
                    ${item.num <= 3 ? 'bg-wysa-pink text-wysa-green' : 'bg-white/20 text-white/80'}`}>
                    {item.num}
                  </span>
                  <div className="flex-1">
                    <p className="text-white/90 text-sm font-medium leading-snug group-hover:text-white transition-colors truncate">
                      {item.text}
                    </p>
                    <p className="text-[10px] text-white/50 mt-1 flex items-center gap-1">

                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 text-right flex flex-col items-end border-t border-white/20 pt-3 shrink-0">
              <button className="bg-wysa-pink text-wysa-green rounded-full px-6 py-1.5 text-sm font-bold hover:bg-white transition shadow-md flex items-center space-x-1">
                <span>进入讨论区提问</span><span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 下半部分：最新消息文章卡片 ================= */}
      <div className="w-full text-left mt-4">
        <div className="flex items-end mb-6 gap-4">
          <h3 className="text-3xl font-extrabold text-wysa-green leading-none">最新消息与专栏</h3>
          <button className="border border-wysa-coral text-wysa-coral font-bold rounded-full px-4 py-1 text-xs flex items-center space-x-1 hover:bg-wysa-coral hover:text-white transition ml-2">
            <span>查看全部文章</span><span>→</span>
          </button>
        </div>

        {/* 文章卡片 - 改用半透明玻璃态，融入粉色全局背景 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {newsData.map((news) => (
            <div key={news.id} className="bg-white/60 backdrop-blur-md rounded-[24px] border border-white/50 shadow-md overflow-hidden group cursor-pointer hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl flex flex-col">
              <div className="w-full h-[180px] overflow-hidden relative bg-gray-100/50">
                <img
                  src={news.img}
                  alt={news.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/600x400/FCE7F3/E58889?text=Article+Cover+${news.id}`;
                  }}
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold text-wysa-green shadow-sm">
                  心理专栏
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1 justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 mb-2 font-medium">{news.date}</p>
                  <h4 className="text-base font-bold text-gray-800 leading-snug group-hover:text-wysa-coral transition-colors line-clamp-2">
                    {news.title}
                  </h4>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-wysa-green group-hover:text-wysa-coral transition-colors">
                  阅读全文 <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};

// ==========================================
// 8. 轮播图组件 (Why choose us)
// ==========================================
const slidesData = [
  {
    id: 0,
    title: "100% 匿名保护",
    description: "您的隐私是我们最看重的事情。在这里，您无需提供真实姓名或任何可识别身份的个人信息，您可以毫无顾虑地倾诉内心的真实想法。",
    highlight: "核心政策：绝对匿名，保护您的安全边界",
    image: "1.jpg"
  },
  {
    id: 1,
    title: "全天候陪伴",
    description: "情绪的波动从不挑剔时间。无论是在清晨还是深夜，只要您需要倾听，我们随时随地都在这里为您提供支持。",
    highlight: "随时随地，永不掉线的心理支持",
    image: "2.jpg"
  },
  {
    id: 2,
    title: "AI 与 真人结合",
    description: "智能AI提供即时的情绪舒缓，专业心理咨询师提供深度的心理干预。两者完美结合，为您提供阶梯式的科学干预方案。",
    highlight: "科技与温度的完美融合",
    image: "3.jpg"
  },
  {
    id: 3,
    title: "科学的 CBT 疗法",
    description: "我们的所有情绪调节练习均基于严格的认知行为疗法（CBT）临床心理学研究，确保您获得的每一次帮助都是专业且有效的。",
    highlight: "临床验证有效的心理学工具",
    image: "5.jpg"
  },
  {
    id: 4,
    title: "零压力的对话交互",
    description: "摒弃了繁琐的问卷和冰冷的测试，友好的对话式界面让心理疗愈变得就像和一位懂你的老朋友聊天一样自然轻松。",
    highlight: "极简设计，零使用门槛",
    image: "5.jpg"
  },
  {
    id: 5,
    title: "极具性价比的选择",
    description: "打破传统心理咨询动辄成百上千的高昂门槛，我们致力于让每一位需要帮助的人，都能以极低的成本负担得起优质的服务。",
    highlight: "让心理健康服务惠及每个人",
    image: "6.jpg"
  }
];

const WhyChooseUsSection = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const handlePrev = () => {
    setActiveSlide((prev) => (prev === 0 ? slidesData.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev === slidesData.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = slidesData[activeSlide];

  return (
    <section className="py-24 px-12 md:px-24 w-full text-center">
      <h2 className="text-5xl font-extrabold mb-16 text-left text-wysa-green">Why choose us</h2>

      <div className="bg-wysa-green text-white rounded-[60px] p-16 relative flex items-center justify-between w-full shadow-2xl overflow-hidden min-h-[480px]">

        <button
          onClick={handlePrev}
          className="text-5xl text-white/50 hover:text-white transition z-10 cursor-pointer"
        >
          〈
        </button>

        {/* 使用 motion.div 实现平滑的渐隐渐显切换效果 */}
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-center justify-between w-full px-16 gap-10"
        >
          <div className="text-left w-1/2 space-y-6">
            <h3 className="text-4xl font-bold mb-5 tracking-wide">{current.title}</h3>
            <p className="text-xl opacity-90 leading-relaxed min-h-[120px]">
              {current.description}
            </p>
            <p className="font-bold text-xl text-wysa-pink bg-white/10 inline-block px-4 py-2 rounded-xl">
              ✨ {current.highlight}
            </p>
          </div>

          <div className="w-[450px] h-[350px] bg-wysa-pink rounded-[120px] flex items-center justify-center shadow-inner border-[10px] border-white/20 overflow-hidden flex-shrink-0">
             <img
               src={current.image}
               alt={current.title}
               className="w-full h-full object-cover"
               onError={(e) => {
                 e.target.src = `https://via.placeholder.com/450x350/E5E7EB/9CA3AF?text=Image+${current.id + 1}`;
               }}
             />
          </div>
        </motion.div>

        <button
          onClick={handleNext}
          className="text-5xl text-white/50 hover:text-white transition z-10 cursor-pointer"
        >
          〉
        </button>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-4 z-10">
          {slidesData.map((_, index) => (
            <div
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`w-3.5 h-3.5 rounded-full border-2 border-white cursor-pointer transition-all duration-300 ease-in-out
                ${activeSlide === index ? 'bg-white scale-125' : 'bg-transparent hover:bg-white/50'}
              `}
            ></div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 9. 页脚组件 (Footer)
// ==========================================
const Footer = () => (
  <footer className="border-t-[6px] border-wysa-coral mt-24 px-12 md:px-24 py-16 w-full text-sm">
    <div className="mb-16 pb-12 border-b border-gray-200">
      <div className="bg-white/50 p-8 rounded-[40px] border border-wysa-coral/20">
        <p className="text-gray-600 leading-relaxed text-base">
          <strong className="text-wysa-green">免责声明：</strong>
          Emotia 并非为协助处理诸如虐待、可能导致自杀念头的严重心理健康问题、自伤或其他任何医疗紧急情况而设计的。
          Emotia 无法也不会提供医疗或临床建议。它只能建议用户寻求高级和专业的医疗帮助。
          <strong className="text-wysa-coral"> 如遇紧急情况，请联系您所在国家的自杀热线。</strong>
        </p>
        <p className="mt-4 text-gray-600 leading-relaxed text-base">
          您必须年满 18 岁才能使用 Emotia。如果您年龄在 13 至 18 岁之间，请与父母或法定监护人一同阅读服务条款和隐私政策，以了解使用前的资格。
          Emotia 并非为 13 岁以下儿童设计的。
        </p>
      </div>
    </div>

    <div className="flex justify-between mb-16 text-left w-full gap-10">
      <div className="space-y-4">
        <h4 className="font-bold text-wysa-green">全球通告</h4>
        <ul className="space-y-2 text-gray-600">
          <li>英国机构用户</li>
          <li>的服务</li>
          <li>条款隐私政策</li>
        </ul>
        <h4 className="font-bold pt-4 text-wysa-green">服务</h4>
        <ul className="space-y-2 text-gray-600">
          <li>条款隐私政策</li>
        </ul>
      </div>
      <div className="space-y-4">
        <h4 className="font-bold text-wysa-green">其他通知</h4>
        <ul className="space-y-2 text-gray-600">
          <li>安全与有效</li>
          <li>性无障碍通知</li>
          <li>Cookie政策</li>
        </ul>
      </div>
      <div className="space-y-4">
        <h4 className="font-bold text-wysa-green">重要链接</h4>
        <ul className="space-y-2 text-gray-600 font-medium">
          <li>常见问题</li>
          <li>解答 职业</li>
          <li>博客</li>
          <li>媒体</li>
          <li>服务状态</li>
          <li>联系我们</li>
          <li className="pt-2 text-wysa-coral">hello@emotia.com</li>
        </ul>
      </div>
      <div className="space-y-6 flex flex-col items-end w-1/4">
        <div className="text-5xl text-wysa-green font-sans tracking-widest font-extrabold">Emotia</div>
        <div className="flex space-x-4 text-wysa-green">
          <span className="bg-wysa-pink w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm">f</span>
          <span className="bg-wysa-pink w-7 h-7 rounded-lg flex items-center justify-center text-sm">📷</span>
          <span className="bg-wysa-pink w-7 h-7 rounded-lg flex items-center justify-center text-sm">𝕏</span>
          <span className="bg-wysa-pink w-7 h-7 rounded-lg flex items-center justify-center text-sm">▶</span>
          <span className="bg-wysa-pink w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold">in</span>
        </div>
        <div className="space-y-2 text-sm w-full">
           <div className="border border-gray-300 rounded-full px-5 py-2 flex items-center justify-between cursor-pointer hover:bg-wysa-pink transition font-medium text-gray-700">
             <span>Get it on Google Play</span>
             <span>▶</span>
           </div>
           <div className="border border-gray-300 rounded-full px-5 py-2 flex items-center justify-between cursor-pointer hover:bg-wysa-pink transition font-medium text-gray-700">
             <span>Download on the App Store</span>
             <span>🍎</span>
           </div>
        </div>
      </div>
    </div>
    <div className="border-t border-gray-100 pt-8 text-gray-500 text-left">
      版权所有 2026 Emotia Ltd，保留所有权利。
    </div>
  </footer>
);


// ==========================================
// 10. 新增：登录/注册弹窗组件 (AuthModal)
// ==========================================
const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true); // 切换登录或注册
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 这里的地址需要改成你后端的实际运行地址，如果是在同一个服务器下可以填相对路径
  const API_BASE_URL = 'http://localhost:8000';

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/login' : '/api/signup';

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 完全匹配 openapi.json 中的 UserAuthRequest schema
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      if (!response.ok) {
        // 解析 FastAPI 返回的 422 验证错误或其他 HTTP 错误
        const errorData = await response.json();
        if (errorData.detail && Array.isArray(errorData.detail)) {
          throw new Error(errorData.detail[0].msg);
        } else if (errorData.detail) {
          throw new Error(errorData.detail);
        } else {
          throw new Error('请求失败，请检查账号密码');
        }
      }

      const data = await response.json();
      console.log('Success:', data);

      // 成功后的处理
      alert(`${isLogin ? '登录' : '注册'}成功！`);
      onClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-[30px] p-10 w-[420px] shadow-2xl relative border border-gray-100"
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 text-xl font-bold px-2 py-1 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <h2 className="text-3xl font-extrabold text-wysa-green mb-8 text-center tracking-tight">
              {isLogin ? '欢迎回来' : '加入 Emotia'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">电子邮箱</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-wysa-green focus:ring-4 focus:ring-wysa-green/10 outline-none transition-all font-medium text-gray-800"
                  placeholder="hello@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">密码</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-wysa-green focus:ring-4 focus:ring-wysa-green/10 outline-none transition-all font-medium text-gray-800"
                  placeholder="••••••••"
                />
              </div>

              {/* 错误提示框 */}
              {error && (
                <div className="bg-red-50 text-red-500 text-xs font-bold text-center py-2.5 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-full text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5
                  ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-wysa-green hover:bg-wysa-coral'}`}
              >
                {loading ? '处理中...' : (isLogin ? '立即登录' : '立即注册')}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500 font-medium">
              {isLogin ? '还没有账号？' : '已有账号？'}
              <span
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-wysa-coral font-bold cursor-pointer hover:underline ml-1"
              >
                {isLogin ? '立即注册' : '直接登录'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
// ==========================================
// 11. 主页面组件 (Home)
// ==========================================
function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 初始化滚动动画库 AOS
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
    });
  }, []);

  return (
    <ClickSpark
      sparkColor="#E58889"
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <div className="min-h-screen bg-wysa-pink font-sans text-gray-900 overflow-x-hidden selection:bg-wysa-coral selection:text-white">

        {/* 各个功能区块 */}
        <main>
          <HeroSection />

          <div data-aos="fade-up">
            <CbtSection />
          </div>

          <div data-aos="fade-right">
            <ServeForSection />
          </div>

          <div data-aos="zoom-in">
            <FeaturesSection />
          </div>

          <div data-aos="fade-up">
            <WhyChooseUsSection />
          </div>

          <div data-aos="fade-in">
            <FeedbackSection />
          </div>
        </main>

        {/* 页脚 */}
        <Footer />

        {/* 登录注册弹窗 */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </ClickSpark>
  );
}

// 必须导出为 Home，这样 App.jsx 才能通过 import Home from './pages/Home' 找到它
export default Home;