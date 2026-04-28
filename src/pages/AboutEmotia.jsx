import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollVelocity from '../ScrollVelocity';
import ClickSpark from '../ClickSpark';

const topicsData = [
  { id: 1, title: "CBT", subtitle: "COGNITIVE BEHAVIORAL THERAPY", summary: "捕捉自动思维，打破焦虑循环。在科学的框架下，重构你的情绪主导权。", image: "/about1.jpg" ,pos: "object-[50%_80%]"},
  { id: 2, title: "EMOTIONS", subtitle: "EMOTIONAL INTELLIGENCE", summary: "焦虑与抑郁并非软弱的标签，而是心灵的一次“重感冒”。理解它，是治愈的第一步。", image: "/about2.jpg" },
  { id: 3, title: "AI AGENT", subtitle: "COMPANIONSHIP", summary: "绝对匿名的私密空间。让心理成长变得低门槛、高效率且充满温度。", image: "/q (2).png" ,pos: "object-[20%_60%]"}
];

const AboutEmotia = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // 第一屏轮播逻辑
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
    /* 只在这里加入了 ClickSpark 特效包裹 */
    <ClickSpark sparkColor='#E58889'>
      <div className="min-h-screen bg-wysa-pink font-extrabold antialiased text-wysa-green pt-24 md:pt-32">

        {/* --- 第一屏：Hero 轮播 --- */}
        <section className="relative h-[calc(100vh-8rem)] w-full flex flex-col items-center px-6 overflow-hidden">
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
                <div className="w-full md:w-[45%] h-full p-10 md:p-20 flex flex-col justify-center">
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <span className="text-wysa-green text-[10px] font-bold tracking-[0.5em] uppercase mb-6 block">
                      {topicsData[index].subtitle}
                    </span>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-10 -ml-1">
                        {topicsData[index].title}
                      </h2>
                    <div className="w-10 h-[1px] bg-wysa-green mb-10 opacity-30" />
                    <p className="text-lg text-wysa-green/70 font-normal leading-relaxed max-w-sm">
                      {topicsData[index].summary}
                    </p>
                  </motion.div>
                </div>
                <div className="w-full md:w-[55%] h-full overflow-hidden bg-white">
                  <motion.img
                    key={topicsData[index].image}
                    src={topicsData[index].image}
                    className={`w-full h-full object-cover ${topicsData[index].pos || 'object-center'}`}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-8 flex gap-3 items-center z-10">
            {topicsData.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-wysa-coral' : 'w-2 bg-wysa-coral/20 hover:bg-wysa-coral/40'}`}
              />
            ))}
          </div>
          <motion.div
            onClick={() => document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-10 flex flex-col items-center cursor-pointer opacity-20 hover:opacity-60 transition-opacity z-0"
          >
            <span className="text-[2.5rem] font-thin leading-none" style={{ fontFamily: 'SimSun, STSong' }}>︾</span>
          </motion.div>
        </section>

        {/* --- 第二屏：Insights 区 (动效文字替换) --- */}
        <section id="details" className="min-h-screen bg-wysa-pink py-24">
           <div className="w-full">
              <div className="mb-20 text-center px-6">
                <h4 className="text-wysa-coral text-sm font-bold tracking-[0.4em] mb-12 uppercase">Emotia Insights</h4>

                {/* 这里使用 ScrollVelocity 替换了原本的静态 <p> 标签 */}
                <div className="py-6 border-y border-wysa-pink bg-wysa-pink">
                  <ScrollVelocity
                    texts={[
                      "在这里 重新审视每一份情绪的重量",
                      "RE-EXAMINE THE WEIGHT OF EVERY EMOTION"
                    ]}
                    velocity={60}
                    className="text-wysa-green font-medium text-5xl tracking-tighter"
                    numCopies={8}
                  />
                </div>

              </div>

              <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

                 {/* 左侧文章列 */}
                 <motion.div
                   className="flex flex-col gap-12"
                   animate={{ y: [0, -30, 0] }}
                   transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                 >
                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                       <div className="w-full h-48 md:h-56 bg-gray-100 overflow-hidden relative">
                          <img src="/1.jpg" alt="CBT" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                       </div>
                       <div className="p-8 md:p-12">
                          <h3 className="text-2xl font-bold mb-4 text-wysa-green">认知行为疗法 (CBT) 的科学基础</h3>
                          <p className="text-wysa-green/70 leading-loose mb-8 font-normal text-justify">
                            CBT 并不旨在深挖过去或“灌鸡汤”，而是聚焦当下。它帮助我们识别“自动思维”与负面情绪之间的因果联系。
                          </p>
                          <a href="https://www.rcpsych.ac.uk/mental-health/translations/chinese/%E8%AE%A4%E7%9F%A5%E8%A1%8C%E4%B8%BA%E7%96%97%E6%B3%95-(CBT)" target="_blank" rel="noreferrer" className="inline-block text-wysa-coral border-b border-wysa-coral pb-1 hover:opacity-70 transition-opacity font-medium">→ 阅读：官方指南</a>
                       </div>
                    </div>

                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                       <div className="w-full h-48 md:h-56 bg-gray-100 overflow-hidden relative">
                          <img src="/2.jpg" alt="Emotions" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                       </div>
                       <div className="p-8 md:p-12">
                          <h3 className="text-2xl font-bold mb-4 text-wysa-green">情绪智力：接纳心灵的波浪</h3>
                          <p className="text-wysa-green/70 leading-loose mb-8 font-normal text-justify">
                            情绪本身没有对错之分。现代心理学强调“情绪敏捷力”，教导我们如何在不被情绪吞噬的前提下理解它。
                          </p>
                          <a href="https://www.apa.org/topics/emotion" target="_blank" rel="noreferrer" className="inline-block text-wysa-coral border-b border-wysa-coral pb-1 hover:opacity-70 transition-opacity font-medium">→ 阅读：APA 情绪科普</a>
                       </div>
                    </div>

                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-50 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                       <div className="w-full h-48 md:h-56 bg-gray-100 overflow-hidden relative">
                          <img src="/4.jpg" alt="AI Agent" className="w-full h-full object-cover object-[50%_40%] transition-transform duration-700 group-hover:scale-105" />
                       </div>
                       <div className="p-8 md:p-12">
                          <h3 className="text-2xl font-bold mb-4 text-wysa-green">AI 心理陪伴的未来边界</h3>
                          <p className="text-wysa-green/70 leading-loose mb-8 font-normal text-justify">
                             AI 作为情绪的第一道缓冲区，提供无缝接入与匿名安全感，让科学干预更加普惠。
                          </p>
                          <a href="https://yunxin.csdn.net/69733049a16c6648a9848525.html" target="_blank" rel="noreferrer" className="inline-block text-wysa-coral border-b border-wysa-coral pb-1 hover:opacity-70 transition-opacity font-medium">→ 探索：AI 心理发展报告</a>
                       </div>
                    </div>
                 </motion.div>

                 {/* 右侧视频列 */}
                 <motion.div
                   className="flex flex-col gap-12 lg:pt-20"
                   animate={{ y: [0, 30, 0] }}
                   transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                 >
                    <div className="bg-white p-4 rounded-[40px] shadow-sm border border-gray-50 hover:shadow-lg transition-shadow">
                       <div className="w-full aspect-video rounded-[30px] overflow-hidden bg-gray-100">
                          <video className="w-full h-full object-cover" controls preload="metadata" playsInline>
                            <source src="/cbt.mp4" type="video/mp4" />
                          </video>
                       </div>
                       <p className="text-sm text-center text-wysa-green/70 mt-5 mb-2 font-normal">CBT 工作原理</p>
                    </div>

                    <div className="bg-white p-4 rounded-[40px] shadow-sm border border-gray-50 hover:shadow-lg transition-shadow">
                       <div className="w-full aspect-video rounded-[30px] overflow-hidden bg-gray-100">
                          <video className="w-full h-full object-cover" controls preload="metadata" playsInline>
                            <source src="/emotion.mp4" type="video/mp4" />
                          </video>
                       </div>
                       <p className="text-sm text-center text-wysa-green/70 mt-5 mb-2 font-normal">接纳你的情绪影子</p>
                    </div>

                    <div className="bg-white p-4 rounded-[40px] shadow-sm border border-gray-50 hover:shadow-lg transition-shadow">
                       <div className="w-full aspect-video rounded-[30px] overflow-hidden bg-gray-100">
                          <video className="w-full h-full object-cover" controls preload="metadata" playsInline>
                            <source src="/ai.mp4" type="video/mp4" />
                          </video>
                       </div>
                       <p className="text-sm text-center text-wysa-green/70 mt-5 mb-2 font-normal">AI 与心理健康探讨</p>
                    </div>

                    <div className="bg-white p-4 rounded-[40px] shadow-sm border border-gray-50 hover:shadow-lg transition-shadow">
                       <div className="w-full aspect-video rounded-[30px] overflow-hidden bg-gray-100">
                          <video className="w-full h-full object-cover" controls preload="metadata" playsInline>
                            <source src="/4.mp4" type="video/mp4" />
                          </video>
                       </div>
                       <p className="text-sm text-center text-wysa-green/70 mt-5 mb-2 font-light">克服自我</p>
                    </div>
                 </motion.div>

              </div>
           </div>
        </section>
      </div>
    </ClickSpark>
  );
};

export default AboutEmotia;