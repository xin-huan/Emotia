import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const topicsData = [
  { id: 1, title: "CBT", subtitle: "COGNITIVE BEHAVIORAL THERAPY", summary: "捕捉自动思维，打破焦虑循环。在科学的框架下，重构你的情绪主导权。", image: "/about1.jpg" },
  { id: 2, title: "EMOTIONS", subtitle: "EMOTIONAL INTELLIGENCE", summary: "焦虑与抑郁并非软弱的标签，而是心灵的一次“重感冒”。理解它，是治愈的第一步。", image: "/about2.jpg" },
  { id: 3, title: "AI AGENT", subtitle: "COMPANIONSHIP", summary: "绝对匿名的私密空间。让心理成长变得低门槛、高效率且充满温度。", image: "/q (2).png" }
];

const AboutEmotia = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % topicsData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [index]);

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setIndex((prev) => (prev + newDirection + topicsData.length) % topicsData.length);
  };

  const onDragEnd = (e, { offset, velocity }) => {
    const swipe = Math.abs(offset.x) > 50 && Math.abs(velocity.x) > 500;
    if (swipe) {
      if (offset.x > 0) paginate(-1);
      else paginate(1);
    }
  };

  return (

    <div className="min-h-screen bg-wysa-pink font-sans antialiased text-[#4d664d] pt-24 md:pt-32">

      {/* 第一屏 */}
      <section className="relative h-[calc(100vh-8rem)] w-full flex flex-col items-center px-6 overflow-hidden">

        {/* 中央主卡片 */}
        <div className="relative w-full max-w-[1300px] h-[70vh] group select-none">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={index}
              custom={direction}
              initial={{ x: direction > 0 ? "10%" : "-10%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction < 0 ? "10%" : "-10%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={onDragEnd}
              className="absolute inset-0 flex flex-col md:flex-row bg-white rounded-[40px] shadow-[0_30px_80px_rgba(77,102,77,0.08)] overflow-hidden border border-gray-100"
            >
              {/* 文字部分 */}
              <div className="w-full md:w-[45%] h-full p-10 md:p-20 flex flex-col justify-center">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <span className="text-[#e58889] text-[10px] font-black tracking-[0.5em] uppercase mb-6 block">
                    {topicsData[index].subtitle}
                  </span>
                  <h2 className="text-5xl md:text-7xl font-extralight tracking-tighter leading-none mb-10 -ml-1">
                      {topicsData[index].title}
                    </h2>
                  <div className="w-10 h-[1px] bg-wysa-green mb-10 opacity-30" />
                  <p className="text-lg text-wysa-green/60 font-light leading-relaxed max-w-sm">
                    {topicsData[index].summary}
                  </p>
                </motion.div>
              </div>

              {/* 图片部分 */}
              <div className="w-full md:w-[55%] h-full overflow-hidden bg-white">
                <motion.img
                  key={topicsData[index].image}
                  src={topicsData[index].image}
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1 }}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 底部小圆点 */}
        <div className="mt-8 flex gap-3 items-center z-10">
          {topicsData.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? 'w-8 bg-wysa-coral' : 'w-2 bg-wysa-coral/20 hover:bg-wysa-coral/40'
              }`}
            />
          ))}
        </div>

        {/* 下滑引导 - 增加透明度并放置在最底层，确保不挡圆点 */}
        <motion.div
          onClick={() => document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-10 flex flex-col items-center cursor-pointer opacity-20 hover:opacity-60 transition-opacity z-0"
        >
          <span className="text-[2.5rem] font-thin leading-none" style={{ fontFamily: 'SimSun, STSong' }}>︾</span>
        </motion.div>

      </section>

      {/* 详情内容 */}
      <section id="details" className="min-h-screen bg-wysa-pink p-24">
         <div className="max-w-4xl mx-auto">

            <div className="h-px w-full bg-gray-100 mb-20" />
            <p className="text-4xl font-extralight leading-snug text-[#4d664d]">
               在这里，我们通过科学的叙事与交互，重新审视每一份情绪的重量。
            </p>
         </div>
      </section>
    </div>
  );
};

export default AboutEmotia;