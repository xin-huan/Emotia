// import React, { useState, useRef, useMemo } from 'react';
// import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
// import ShapeBlur from '../ShapeBlur';
// import ClickSpark from '../ClickSpark';
// import { useNavigate } from 'react-router-dom';
// // ==========================================
// // 1. 核心题库数据 (补全 12 个测试的具体内容)
// // ==========================================
// const ASSESSMENT_DATA = {
//   // --- 专业测评 (部分截取经典条目，确保逻辑通顺) ---
//   1: [ // PHQ-9
//     "做事提不起劲，或没有兴趣？",
//     "感到心情低落、沮丧或绝望？",
//     "入睡困难、睡不安稳或睡眠过多？",
//     "感觉疲累或没有活力？",
//     "食欲不振或吃得太多？",
//     "觉得自己很糟，或觉得自己很失败？",
//     "对事物失去注意力，如看报纸或看电视？",
//     "动作或说话速度缓慢到别人都能察觉？",
//     "有轻生或伤害自己的念头？"
//   ],
//   2: [ // GAD-7
//     "感到紧张、焦虑或急躁？",
//     "无法停止或控制担心？",
//     "对各种各样的事情担心过多？",
//     "很难放松下来？",
//     "由于焦躁不安，以致无法静坐？",
//     "变得容易烦躁或急躁？",
//     "感到似乎会有可怕的事发生？"
//   ],
//   3: [ // PANAS (精简版)
//     "你最近感到兴奋、对事物充满热情吗？",
//     "你最近感到心神不宁、容易受惊吓吗？",
//     "你最近感到意志坚定、有力量感吗？",
//     "你最近感到羞愧或内疚吗？",
//     "你最近感到专注、注意力集中吗？"
//   ],
//   4: [ // WAQ 工作联盟
//     "我感到我的治疗师/咨询师是真诚的。",
//     "我们对需要解决的问题达成了共识。",
//     "我信任目前的治疗计划能帮到我。",
//     "我感到在交流中被充分理解和尊重。"
//   ],
//   5: [ // CESD-R 抑郁
//     "我感到我的生活是一个失败。",
//     "我感到孤独，即使身边有人。",
//     "我感到悲伤，无法排解。",
//     "我感到人们对我并不友好。"
//   ],
//   6: [ // PSWQ 担忧问卷
//     "如果我没有足够的时间去做每件事，我就会担心。",
//     "一旦我开始担心某事，我就很难停下来。",
//     "我一直是一个容易担心的人。",
//     "当压力很大时，我会非常担心。"
//   ],
//   7: [ // STAI (状态/特质精简)
//     "我觉得心情平静、安宁。",
//     "我觉得像是有什么不幸的事要发生。",
//     "我觉得自己像个失败者。",
//     "我觉得神经过敏和局促不安。"
//   ],
//   8: [ // PSS-10 压力
//     "由于一些出乎意料的事情发生而感到心烦？",
//     "感到无法控制生活中的重要事情？",
//     "感到紧张和有压力？",
//     "感到事情积累得太多，以至于无法克服？"
//   ],
//   9: [ // BDI-II 贝克抑郁
//     "我对未来感到失望吗？",
//     "我是否感到自己受到了惩罚？",
//     "我是否有自杀的想法？",
//     "我是否对别人失去了兴趣？"
//   ],

//   // --- 趣味测试 (将选项含义适配为描述程度) ---
//   10: [ // 乐观指数
//     "当遇到挫折时，我倾向于认为这是暂时的。",
//     "我相信“乌云背后总有阳光”。",
//     "当好事发生，我认为这是靠我自己的努力。",
//     "我对未来一年将发生的事抱有期待。"
//   ],
//   11: [ // MBTI 简化版
//     "在聚会中，我倾向于主动与陌生人交谈(E)。",
//     "我更看重事实和逻辑，而非直觉(S/T)。",
//     "我喜欢提前规划行程，而非随遇而安(J)。",
//     "决策时，我更容易被情感和价值观左右(F)。"
//   ],
//   12: [ // 性格色彩
//     "我喜欢成为人群中的焦点，表达欲极强(红色)。",
//     "我追求完美，对自己和他人要求很高(蓝色)。",
//     "我讨厌冲突，希望能保持环境和谐(绿色)。",
//     "我目标明确，做事追求效率和结果(黄色)。"
//   ]
// };

// const TEST_LIST = [
//   { id: 1, title: 'PHQ-9 抑郁症测试', desc: '获得快速、保密的抑郁症筛查，了解您的分数并迈出走向健康的第一步。', questionsCount: 9, time: '3分钟', type: 'professional', icon: '🌧️', tags: ['抑郁筛查'] },
//   { id: 2, title: 'GAD-7 焦虑测试', desc: '提供值得信赖的焦虑测试。在几分钟内获得分数并探索可选报告。', questionsCount: 7, time: '2分钟', type: 'professional', icon: '☁️', tags: ['焦虑筛查'] },
//   { id: 3, title: 'PANAS 情绪评估', desc: '用于评估积极情感 (PA) 和负面情绪 (NA)。', questionsCount: 5, time: '5分钟', type: 'professional', icon: '🎭', tags: ['情绪评估'] },
//   { id: 4, title: '工作联盟问卷 (WAQ)', desc: '评估您与医疗提供者之间的信任与合作程度。', questionsCount: 4, time: '4分钟', type: 'professional', icon: '🤝', tags: ['医患关系'] },
//   { id: 5, title: 'CESD-R 抑郁筛查测试', desc: '流行病学研究中心抑郁量表修订版。', questionsCount: 4, time: '5分钟', type: 'professional', icon: '📉', tags: ['抑郁评估'] },
//   { id: 6, title: 'PSWQ 宾州担忧问卷', desc: '测量广泛性、过度和不可控担忧的特征。', questionsCount: 4, time: '5分钟', type: 'professional', icon: '🌀', tags: ['担忧特质'] },
//   { id: 7, title: 'STAI 状态-特质焦虑量表', desc: '广泛使用的测量状态焦虑与特质焦虑的量表。', questionsCount: 4, time: '10分钟', type: 'professional', icon: '⚡', tags: ['焦虑特质'] },
//   { id: 8, title: 'PSS-10 压力感知量表', desc: '衡量生活中某些情境被评估为压力的程度。', questionsCount: 4, time: '3分钟', type: 'professional', icon: '🍃', tags: ['压力评估'] },
//   { id: 9, title: 'BDI-II 贝克抑郁量表', desc: '贝克抑郁自评量表是临床最著名的量表之一。', questionsCount: 4, time: '6分钟', type: 'professional', icon: '💼', tags: ['抑郁评估'] },
//   { id: 10, title: '乐观指数测试', desc: '测测你的积极思维倾向与日常生活中的乐观度。', questionsCount: 4, time: '2分钟', type: 'fun', icon: '🌈', tags: ['心理探索'] },
//   { id: 11, title: 'MBTI职业性格简化版', desc: '发现你的性格偏好，寻找最适合你的发展路径。', questionsCount: 4, time: '6分钟', type: 'fun', icon: '🧩', tags: ['自我认知'] },
//   { id: 12, title: '性格色彩测试', desc: '你是红色行动派还是蓝色思考者？发现你的性格主色调。', questionsCount: 4, time: '4分钟', type: 'fun', icon: '🎨', tags: ['趣味发现'] },
// ];

// const OPTIONS = [
//   { score: 0, label: '完全没有', emoji: '😌', days: '0天' },
//   { score: 1, label: '几天', emoji: '🤔', days: '1-6天' },
//   { score: 2, label: '一半以上天数', emoji: '😟', days: '7-11天' },
//   { score: 3, label: '几乎每天', emoji: '😰', days: '12-14天' },
// ];

// // ==========================================
// // 3D 倾斜容器 (保持不变)
// // ==========================================
// const springValues = { damping: 30, stiffness: 100, mass: 2 };
// function TiltedWrapper({ children, captionText }) {
//   const ref = useRef(null);
//   const x = useMotionValue(0);
//   const y = useMotionValue(0);
//   const rotateX = useSpring(useMotionValue(0), springValues);
//   const rotateY = useSpring(useMotionValue(0), springValues);
//   const scale = useSpring(1, springValues);
//   const opacity = useSpring(0);
//   const rotateFigcaption = useSpring(0, { stiffness: 350, damping: 30, mass: 1 });
//   const [lastY, setLastY] = useState(0);

//   function handleMouse(e) {
//     if (!ref.current) return;
//     const rect = ref.current.getBoundingClientRect();
//     const offsetX = e.clientX - rect.left - rect.width / 2;
//     const offsetY = e.clientY - rect.top - rect.height / 2;
//     rotateX.set((offsetY / (rect.height / 2)) * -14);
//     rotateY.set((offsetX / (rect.width / 2)) * 14);
//     x.set(e.clientX - rect.left);
//     y.set(e.clientY - rect.top);
//     const velocityY = offsetY - lastY;
//     rotateFigcaption.set(-velocityY * 0.6);
//     setLastY(offsetY);
//   }

//   return (
//     <figure
//       ref={ref}
//       className="relative w-full h-full [perspective:800px]"
//       onMouseMove={handleMouse}
//       onMouseEnter={() => { scale.set(1.02); opacity.set(1); }}
//       onMouseLeave={() => { opacity.set(0); scale.set(1); rotateX.set(0); rotateY.set(0); rotateFigcaption.set(0); }}
//     >
//       <motion.div className="w-full h-full [transform-style:preserve-3d]" style={{ rotateX, rotateY, scale }}>
//         <div className="w-full h-full [transform:translateZ(0)]">{children}</div>
//       </motion.div>
//       <motion.figcaption
//         className="pointer-events-none absolute left-0 top-0 rounded-[4px] bg-white px-[10px] py-[4px] text-[10px] text-[#2d2d2d] opacity-0 z-[10] hidden sm:block shadow-md border border-gray-100"
//         style={{ x, y, opacity, rotate: rotateFigcaption, translateX: '-50%', translateY: '-120%' }}
//       >
//         {captionText}
//       </motion.figcaption>
//     </figure>
//   );
// }

// // ==========================================
// // 2. 主页面组件
// // ==========================================
// export default function TestPage() {
//   const navigate = useNavigate();
//   const [currentView, setCurrentView] = useState('home');
//   const [selectedTest, setSelectedTest] = useState(null);
//   const [currentQIndex, setCurrentQIndex] = useState(0);
//   const [answers, setAnswers] = useState([]);
//   const [activeTab, setActiveTab] = useState('all');

//   // 动态获取当前测评的题目
//   const questions = useMemo(() => {
//     if (!selectedTest) return [];
//     return ASSESSMENT_DATA[selectedTest.id] || ["题目正在加载中..."];
//   }, [selectedTest]);

//   const displayTests = activeTab === 'all'
//     ? TEST_LIST
//     : TEST_LIST.filter(test => test.type === activeTab);

//   const goToIntro = (test) => { setSelectedTest(test); setCurrentView('intro'); };
//   const goToQuiz = () => { setCurrentQIndex(0); setAnswers([]); setCurrentView('quiz'); };
//   const goToResult = () => setCurrentView('result');
//   const goHome = () => { setSelectedTest(null); setCurrentView('home'); };

//   const handleAnswer = (score) => {
//     const newAnswers = [...answers, score];
//     setAnswers(newAnswers);
//     if (currentQIndex < questions.length - 1) {
//       setCurrentQIndex(currentQIndex + 1);
//     } else {
//       goToResult();
//     }
//   };

//   const pageVariants = { initial: { opacity: 0, y: 20 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -20 } };
//   const totalScore = useMemo(() => answers.reduce((a, b) => a + b, 0), [answers]);

//   // ---------------------------------------------------------
//   // 逻辑判断：根据分数给出不同的文案建议
//   // ---------------------------------------------------------
//   const getRecommendation = () => {
//     if (totalScore >= 10) {
//       return {
//         tag: "重点推荐：情绪疏导",
//         title: "感受到你最近有些累了",
//         desc: "目前的得分显示你正承受着较大的压力。建议先找 AI 助手聊聊，把心里的积压说出来，这能帮你快速平复心情。"
//       };
//     }
//     return {
//       tag: "重点推荐：行为激活",
//       title: "给生活加点“多巴胺”",
//       desc: "你的状态整体还好，但通过一些小的活动打卡，能让你更快地找回掌控感。去活动中心看看吧！"
//     };
//   };

//   const advice = getRecommendation();

//   return (
//     <div className="min-h-screen bg-wysa-pink/40 text-wysa-green font-sans pt-30 pb-12 overflow-x-hidden">
//       <ClickSpark sparkColor="#E58889" sparkCount={10} sparkSize={12} duration={350}>
//         <div className="max-w-6xl mx-auto px-6">
//           <AnimatePresence mode="wait">

//             {/* --- 视图 1: 首页 --- */}
//             {currentView === 'home' && (
//               <motion.div key="home" variants={pageVariants} initial="initial" animate="in" exit="out">
//                 {/* Banner */}
//                 <div className="relative rounded-[2.5rem] mb-12 shadow-sm min-h-[320px] flex items-center bg-white isolate overflow-hidden">
//                   <div className="absolute inset-0 pointer-events-none">
//                     <img src="/test.png" alt="心理探索" className="absolute inset-0 w-full h-full object-cover opacity-80" />
//                     <div className="absolute inset-0 bg-gradient-to-r from-wysa-pink/95 via-wysa-pink/80 to-transparent md:w-1/2 backdrop-blur-sm"></div>
//                   </div>
//                   <div className="absolute inset-0 z-10 pointer-events-none">
//                     <ShapeBlur variation={0} pixelRatioProp={2} shapeSize={2.0} roundness={0.4} borderSize={0.03} circleSize={0.6} />
//                   </div>
//                   <div className="relative z-30 p-8 md:p-12 max-w-xl">
//                     <h1 className="text-4xl md:text-5xl font-extrabold mb-4">心理探索工具</h1>
//                     <p className="text-lg md:text-xl text-white/90 mb-6 font-medium">测评不是贴标签，而是帮你客观地看见自己当下的状态。</p>
//                     <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full text-sm text-wysa-green font-bold border border-white/50">
//                       专业测评仅供参考，不作诊断依据
//                     </div>
//                   </div>
//                 </div>

//                 {/* 分类 Tabs */}
//                 <div className="flex gap-4 mb-8">
//                   {[{id: 'all', label: '全部'}, {id: 'professional', label: '📑 专业测评'}, {id: 'fun', label: '🎈 趣味测试'}].map(tab => (
//                     <button
//                       key={tab.id}
//                       onClick={() => setActiveTab(tab.id)}
//                       className={`px-6 py-2.5 rounded-full font-bold transition-all ${activeTab === tab.id ? 'bg-wysa-coral text-white' : 'bg-white text-wysa-green hover:bg-wysa-pink/40'}`}
//                     >
//                       {tab.label}
//                     </button>
//                   ))}
//                 </div>

//                 {/* 列表渲染 */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
//                   {displayTests.map(test => (
//                     <TiltedWrapper key={test.id} captionText={`点击测试: ${test.title}`}>
//                       <div className="bg-white rounded-3xl p-6 shadow-sm border border-transparent hover:border-wysa-pink transition-all cursor-pointer flex gap-6 h-full" onClick={() => goToIntro(test)}>
//                         <div className="text-5xl bg-wysa-pink/20 w-20 h-20 flex items-center justify-center rounded-3xl shrink-0">{test.icon}</div>
//                         <div className="flex-1">
//                           <h3 className="text-lg font-bold mb-1">{test.title}</h3>
//                           <p className="text-sm text-wysa-green/60 mb-4 line-clamp-2">{test.desc}</p>
//                           <div className="flex justify-between text-xs font-bold text-wysa-green/50">
//                             <span>{test.questionsCount}题 · 约{test.time}</span>
//                             <span className="text-wysa-coral">开始 →</span>
//                           </div>
//                         </div>
//                       </div>
//                     </TiltedWrapper>
//                   ))}
//                 </div>
//               </motion.div>
//             )}

//             {/* --- 视图 2: 介绍页 --- */}
//             {currentView === 'intro' && selectedTest && (
//               <motion.div key="intro" variants={pageVariants} initial="initial" animate="in" exit="out" className="max-w-3xl mx-auto text-center py-16 bg-white rounded-[3rem] shadow-xl">
//                  <div className="text-8xl mb-8">{selectedTest.icon}</div>
//                  <h1 className="text-4xl font-extrabold mb-4">{selectedTest.title}</h1>
//                  <p className="text-lg text-wysa-green/70 mb-10 px-12">{selectedTest.desc}</p>
//                  <div className="flex justify-center gap-8 mb-10">
//                    <div className="flex flex-col items-center"><span className="text-2xl">📋</span><span className="text-sm font-bold">{questions.length} 道题</span></div>
//                    <div className="flex flex-col items-center"><span className="text-2xl">⏱️</span><span className="text-sm font-bold">{selectedTest.time}</span></div>
//                    <div className="flex flex-col items-center"><span className="text-2xl">🔒</span><span className="text-sm font-bold">隐私保护</span></div>
//                  </div>
//                  <button onClick={goToQuiz} className="bg-wysa-coral text-white px-16 py-4 rounded-full font-bold text-xl shadow-lg hover:bg-wysa-green transition-colors">立刻开始</button>
//                  <button onClick={goHome} className="block mx-auto mt-6 text-wysa-green/40 hover:text-wysa-coral transition-colors">放弃并返回</button>
//               </motion.div>
//             )}

//             {/* --- 视图 3: 答题页 --- */}
//             {currentView === 'quiz' && (
//               <motion.div key="quiz" variants={pageVariants} initial="initial" animate="in" exit="out" className="max-w-4xl mx-auto">
//                 <div className="mb-8 flex justify-between items-center px-4">
//                   <span className="font-bold text-wysa-green/50">正在测评: {selectedTest?.title}</span>
//                   <span className="bg-white px-4 py-1 rounded-full text-sm font-bold shadow-sm">{currentQIndex + 1} / {questions.length}</span>
//                 </div>
//                 {/* 进度条 */}
//                 <div className="w-full bg-white h-2 rounded-full mb-12 shadow-inner overflow-hidden">
//                   <motion.div className="h-full bg-wysa-coral" initial={{ width: 0 }} animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }} />
//                 </div>

//                 <div className="bg-white rounded-[3rem] p-12 shadow-xl border-4 border-white text-center">
//                   <h2 className="text-2xl md:text-3xl font-extrabold mb-12 text-wysa-green leading-snug">
//                     {questions[currentQIndex]}
//                   </h2>
//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                     {OPTIONS.map((opt, idx) => (
//                       <button key={idx} onClick={() => handleAnswer(opt.score)} className="bg-wysa-pink/10 hover:bg-wysa-pink/30 p-6 rounded-3xl flex flex-col items-center gap-2 border-2 border-transparent hover:border-wysa-coral transition-all group">
//                         <span className="text-4xl group-hover:scale-110 transition-transform">{opt.emoji}</span>
//                         <span className="font-bold text-wysa-green">{opt.label}</span>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//             {/* ================= 视图 4：结果页 (新增建议功能) ================= */}
//             {currentView === 'result' && (
//               <motion.div key="result" variants={pageVariants} initial="initial" animate="in" exit="out" className="max-w-4xl mx-auto text-center">
//                 <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-xl relative overflow-hidden">
//                   <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-wysa-pink to-wysa-coral"></div>

//                   <h1 className="text-2xl font-bold text-wysa-green/40 mb-2">测评报告已生成</h1>
//                   <div className="mb-8">
//                     <div className="text-7xl font-black text-wysa-coral mb-2">{totalScore}</div>
//                     <div className="inline-block px-4 py-1 bg-wysa-pink/20 rounded-full text-wysa-coral font-bold">
//                       {totalScore >= 10 ? '程度：需关注' : '程度：良好'}
//                     </div>
//                   </div>

//                   <hr className="my-10 border-wysa-pink/20" />

//                   {/* 核心建议模块 */}
//                   <div className="text-left mb-10">
//                     <span className="text-sm font-black text-wysa-coral uppercase tracking-widest">{advice.tag}</span>
//                     <h2 className="text-3xl font-black text-wysa-green mt-2 mb-4">{advice.title}</h2>
//                     <p className="text-wysa-green/70 leading-relaxed">{advice.desc}</p>
//                   </div>

//                   {/* 行动卡片组 */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//                     {/* 卡片 1: 跳转到 AgentTest (AI 聊天) */}
//                     <div
//                       onClick={() => navigate('/Agent')} // 请确保你在 App.js 中定义的路径是 /agent
//                       className="group cursor-pointer bg-wysa-coral/50 hover:bg-wysa-green transition-all p-8 rounded-[2.5rem] text-left border-2 border-transparent hover:border-wysa-green/10"
//                     >
//                       <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">👾</div>
//                       <h3 className="text-xl font-bold mb-2 group-hover:text-white">AI 助手倾诉</h3>
//                       <p className="text-sm text-wysa-green/60 group-hover:text-white/80">
//                         如果你觉得心里闷闷的，或者有些想法不知道对谁说，AI 助手 24 小时都在这里听你倾诉。
//                       </p>
//                       <div className="mt-6 flex items-center text-wysa-green font-bold text-sm group-hover:text-white">
//                         去聊聊看 <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
//                       </div>
//                     </div>

//                     {/* 卡片 2: 跳转到 Interactive (活动打卡) */}
//                     <div
//                       onClick={() => navigate('/interactive')} // 请确保路径匹配
//                       className="group cursor-pointer bg-wysa-green/50 hover:bg-wysa-coral transition-all p-8 rounded-[2.5rem] text-left border-2 border-transparent hover:border-wysa-coral/10"
//                     >
//                       <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🏃‍♀️</div>
//                       <h3 className="text-xl font-bold mb-2 group-hover:text-white">行为激活中心</h3>
//                       <p className="text-sm text-wysa-green/60 group-hover:text-white/80">
//                         通过完成几个简单的心理小任务，用行动来打破负面情绪的循环。
//                       </p>
//                       <div className="mt-6 flex items-center text-wysa-green font-bold text-sm group-hover:text-white">
//                         开始打卡 <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
//                       </div>
//                     </div>

//                   </div>

//                   <button
//                     onClick={goHome}
//                     className="mt-12 text-wysa-green/30 hover:text-wysa-green font-bold transition-colors"
//                   >
//                     返回测评列表
//                   </button>
//                 </div>
//               </motion.div>
//             )}

//           </AnimatePresence>
//         </div>
//       </ClickSpark>
//     </div>
//   );
// }





import React, { useState, useRef, useMemo, useEffect } from 'react'; // 🚀 引入 useEffect
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import ShapeBlur from '../ShapeBlur';
import ClickSpark from '../ClickSpark';
import { useNavigate } from 'react-router-dom';

const API_BASE = "http://localhost:8000/api";

// ==========================================
// 3D 倾斜容器 (保持不变)
// ==========================================
const springValues = { damping: 30, stiffness: 100, mass: 2 };
function TiltedWrapper({ children, captionText }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, { stiffness: 350, damping: 30, mass: 1 });
  const [lastY, setLastY] = useState(0);

  function handleMouse(e) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    rotateX.set((offsetY / (rect.height / 2)) * -14);
    rotateY.set((offsetX / (rect.width / 2)) * 14);
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
    const velocityY = offsetY - lastY;
    rotateFigcaption.set(-velocityY * 0.6);
    setLastY(offsetY);
  }

  return (
    <figure
      ref={ref}
      className="relative w-full h-full [perspective:800px]"
      onMouseMove={handleMouse}
      onMouseEnter={() => { scale.set(1.02); opacity.set(1); }}
      onMouseLeave={() => { opacity.set(0); scale.set(1); rotateX.set(0); rotateY.set(0); rotateFigcaption.set(0); }}
    >
      <motion.div className="w-full h-full [transform-style:preserve-3d]" style={{ rotateX, rotateY, scale }}>
        <div className="w-full h-full [transform:translateZ(0)]">{children}</div>
      </motion.div>
      <motion.figcaption
        className="pointer-events-none absolute left-0 top-0 rounded-[4px] bg-white px-[10px] py-[4px] text-[10px] text-[#2d2d2d] opacity-0 z-[10] hidden sm:block shadow-md border border-gray-100"
        style={{ x, y, opacity, rotate: rotateFigcaption, translateX: '-50%', translateY: '-120%' }}
      >
        {captionText}
      </motion.figcaption>
    </figure>
  );
}

// ==========================================
// 🚀 新增：专业的雷达图组件 (PsychRadarChart)
// ==========================================
const PsychRadarChart = ({ data, size = 300 }) => {
  // 如果数据不足以构成多边形，则不渲染
  if (!data || data.length < 3) return null;

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const angleStep = (Math.PI * 2) / data.length;

  // 1. 计算背景网格（五边形/多边形框架）
  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  const gridLines = levels.map(level => {
    return data.map((_, i) => {
      const x = centerX + radius * level * Math.cos(i * angleStep - Math.PI / 2);
      const y = centerY + radius * level * Math.sin(i * angleStep - Math.PI / 2);
      return `${x},${y}`;
    }).join(' ');
  });

  // 2. 计算用户得分的坐标点 (假设分值范围是 1-5)
  const dataPoints = data.map((d, i) => {
    // 强制限制在 0.5 - 5 之间，防止图表缩成一个点或撑爆
    const val = Math.max(0.5, Math.min(d.value, 5)); 
    const x = centerX + (radius * (val / 5)) * Math.cos(i * angleStep - Math.PI / 2);
    const y = centerY + (radius * (val / 5)) * Math.sin(i * angleStep - Math.PI / 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={size} height={size} className="mx-auto overflow-visible drop-shadow-sm">
      {/* 绘制背景网格线 */}
      {gridLines.map((line, i) => (
        <polygon key={i} points={line} fill="none" stroke="#f0f0f0" strokeWidth="1" />
      ))}
      
      {/* 绘制坐标轴 */}
      {data.map((_, i) => {
        const x = centerX + radius * Math.cos(i * angleStep - Math.PI / 2);
        const y = centerY + radius * Math.sin(i * angleStep - Math.PI / 2);
        return <line key={i} x1={centerX} y1={centerY} x2={x} y2={y} stroke="#f0f0f0" strokeWidth="1" />;
      })}

      {/* 🚀 绘制用户得分区域（粉色半透明多边形） */}
      <motion.polygon
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        points={dataPoints}
        fill="rgba(229, 136, 137, 0.4)"
        stroke="#E58889"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* 绘制维度名称标签 */}
      {data.map((d, i) => {
        const x = centerX + (radius + 25) * Math.cos(i * angleStep - Math.PI / 2);
        const y = centerY + (radius + 25) * Math.sin(i * angleStep - Math.PI / 2);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[11px] fill-gray-400 font-bold"
          >
            {d.name}
          </text>
        );
      })}
    </svg>
  );
};

// ==========================================
// 2. 主页面组件
// ==========================================
export default function TestPage() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('home');
  const [selectedTest, setSelectedTest] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('全部'); // 默认选全部
  const [searchQuery, setSearchQuery] = useState(''); // 🚀 增加搜索状态
  const [loading, setLoading] = useState(false);

  // --- 🚀 后端数据状态 ---
  const [testList, setTestList] = useState([]); // 真实的测试列表
  const [questions, setQuestions] = useState([]); // 真实的题目和选项
  const [answers, setAnswers] = useState([]); // 用户的选择 [{"question_id": "...", "score": 3}]
  const [result, setResult] = useState(null); // 后端计算出的结果 (score, level, radar_data)

  // 1. 页面加载时：获取所有测试量表
  useEffect(() => {
    fetch(`${API_BASE}/tests`)
      .then(res => res.json())
      .then(data => setTestList(data))
      .catch(err => console.error("加载列表失败", err));
  }, []);
  // 🚀 核心逻辑 1：动态提取所有不重复的分类
  const categories = useMemo(() => {
    // 假设你的 tags 字段里存的是 ['分类名']
    const allTags = testList.map(t => t.tags?.[0] || '未分类');
    return ['全部', ...new Set(allTags)];
  }, [testList]);

  // 🚀 核心逻辑 2：搜索 + 分类 双重过滤
  const displayTests = useMemo(() => {
    return testList.filter(test => {
      const matchCategory = activeTab === '全部' || (test.tags && test.tags[0] === activeTab);
      const matchSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          test.abbreviation?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [testList, activeTab, searchQuery]);


  // 3. 点击卡片：进入介绍页
  const goToIntro = (test) => {
    setSelectedTest(test);
    setCurrentView('intro');
  };

  // 4. 立刻开始：向后端请求该测试的题目和选项
  const goToQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tests/${selectedTest.id}/questions`);
      const data = await res.json();
      setQuestions(data);
      setAnswers([]);
      setCurrentQIndex(0);
      setCurrentView('quiz');
    } catch (err) {
      alert("加载题目失败");
    } finally {
      setLoading(false);
    }
  };

  // 5. 答题逻辑：记录分数并自动下一题
  const handleAnswer = (score) => {
    const questionId = questions[currentQIndex].id;
    const newAnswers = [...answers, { question_id: questionId, score: score }];
    setAnswers(newAnswers);

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      submitToBackend(newAnswers); // 答完最后一题，提交
    }
  };

  // 6. 核心：提交给后端计分
  const submitToBackend = async (finalAnswers) => {
    setLoading(true);
    const userId = localStorage.getItem('user_id');
    if (!userId) return alert("请先登录再提交测评！");

    try {
      const res = await fetch(`${API_BASE}/tests/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          test_id: selectedTest.id,
          answers: finalAnswers
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setResult(data.data); // 保存后端算出的分数、等级、雷达图
        setCurrentView('result');
      }
    } catch (err) {
      alert("评分失败，请检查网络");
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => { setSelectedTest(null); setCurrentView('home'); };
  const pageVariants = { initial: { opacity: 0, y: 20 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -20 } };

  return (
    <div className="min-h-screen bg-wysa-pink/40 text-wysa-green font-sans pt-30 pb-12 overflow-x-hidden">
      <ClickSpark sparkColor="#E58889" sparkCount={10} sparkSize={12} duration={350}>
        <div className="max-w-6xl mx-auto px-6">
          <AnimatePresence mode="wait">

            {/* --- 视图 1: 首页 --- */}
            {currentView === 'home' && (
              <motion.div key="home" variants={pageVariants} initial="initial" animate="in" exit="out">
                {/* Banner 保持不变 */}
                <div className="relative rounded-[2.5rem] mb-8 shadow-sm min-h-[280px] flex items-center bg-white isolate overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    <img src="/test.png" alt="心理探索" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-r from-wysa-pink/95 via-wysa-pink/80 to-transparent md:w-1/2 backdrop-blur-sm"></div>
                  </div>
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    <ShapeBlur variation={0} pixelRatioProp={2} shapeSize={2.0} roundness={0.4} borderSize={0.03} circleSize={0.6} />
                  </div>
                  <div className="relative z-30 p-8 md:p-12 max-w-xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">心理探索工具</h1>
                    <p className="text-lg md:text-xl text-white/90 mb-6 font-medium">测评不是贴标签，而是帮你客观地看见自己当下的状态。</p>
                    <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full text-sm text-wysa-green font-bold border border-white/50">
                      专业测评仅供参考，不作诊断依据
                    </div>
                  </div>
                </div>

                {/* 🚀 搜索框模块 */}
                <div className="relative mb-8">
                  <input
                    type="text"
                    placeholder="搜索量表名称或缩写 (如: PHQ-9, 焦虑)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-8 py-5 rounded-3xl bg-white/80 backdrop-blur-md border-2 border-white focus:border-wysa-coral outline-none shadow-sm text-lg transition-all"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl">🔍</div>
                </div>

                {/* 🚀 动态分类 Tabs (支持横向滚动) */}
                <div className="flex gap-3 mb-8 overflow-x-auto pb-4 no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                        activeTab === cat 
                          ? 'bg-wysa-coral text-white shadow-md scale-105' 
                          : 'bg-white text-wysa-green hover:bg-wysa-pink/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* 列表渲染：渲染后端 testList */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                  {displayTests.length > 0 ? (
                    displayTests.map(test => (
                      <TiltedWrapper key={test.id} captionText={`点击测试: ${test.title}`}>
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-transparent hover:border-wysa-pink transition-all cursor-pointer flex gap-6 h-full" onClick={() => goToIntro(test)}>
                          <div className="text-5xl bg-wysa-pink/20 w-20 h-20 flex items-center justify-center rounded-3xl shrink-0">{test.icon || "📝"}</div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold mb-1">{test.title}</h3>
                            <p className="text-sm text-wysa-green/60 mb-4 line-clamp-2">{test.description}</p>
                            <div className="flex justify-between text-xs font-bold text-wysa-green/50">
                              <span>{test.abbreviation} · {test.duration_time}</span>
                              <span className="text-wysa-coral">开始 →</span>
                            </div>
                          </div>
                        </div>
                      </TiltedWrapper>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center text-wysa-green/40 font-bold">
                      没有找到相关的测评，换个关键词试试？
                    </div>
                  )}
                </div>
              </motion.div>
            )}


            {/* --- 视图 2: 介绍页 --- */}
            {currentView === 'intro' && selectedTest && (
              <motion.div key="intro" variants={pageVariants} initial="initial" animate="in" exit="out" className="max-w-3xl mx-auto text-center py-16 bg-white rounded-[3rem] shadow-xl">
                 <div className="text-8xl mb-8">{selectedTest.icon}</div>
                 <h1 className="text-4xl font-extrabold mb-4">{selectedTest.title}</h1>
                 <p className="text-lg text-wysa-green/70 mb-10 px-12">{selectedTest.description}</p>
                 <button 
                  onClick={goToQuiz} 
                  disabled={loading}
                  className="bg-wysa-coral text-white px-16 py-4 rounded-full font-bold text-xl shadow-lg hover:bg-wysa-green transition-colors"
                 >
                   {loading ? "载入中..." : "立刻开始"}
                 </button>
                 <button onClick={goHome} className="block mx-auto mt-6 text-wysa-green/40 hover:text-wysa-coral transition-colors">放弃并返回</button>
              </motion.div>
            )}

            {/* --- 视图 3: 答题页 (动态渲染后端题目和选项) --- */}
            {currentView === 'quiz' && questions.length > 0 && (
              <motion.div key="quiz" variants={pageVariants} initial="initial" animate="in" exit="out" className="max-w-4xl mx-auto">
                <div className="mb-8 flex justify-between items-center px-4">
                  <span className="font-bold text-wysa-green/50">正在测评: {selectedTest?.title}</span>
                  <span className="bg-white px-4 py-1 rounded-full text-sm font-bold shadow-sm">{currentQIndex + 1} / {questions.length}</span>
                </div>
                <div className="w-full bg-white h-2 rounded-full mb-12 shadow-inner overflow-hidden">
                  <motion.div className="h-full bg-wysa-coral" initial={{ width: 0 }} animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }} />
                </div>

                <div className="bg-white rounded-[3rem] p-12 shadow-xl border-4 border-white text-center">
                  <h2 className="text-2xl md:text-3xl font-extrabold mb-12 text-wysa-green leading-snug">
                    {questions[currentQIndex].question_text}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 🚀 这里是关键：循环渲染后端传来的选项 */}
                    {questions[currentQIndex].options.map((opt, idx) => (
                      <button key={idx} onClick={() => handleAnswer(opt.score)} className="bg-wysa-pink/10 hover:bg-wysa-pink/30 p-6 rounded-3xl flex items-center justify-center gap-2 border-2 border-transparent hover:border-wysa-coral transition-all group font-bold">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- 视图 4：结果页 --- */}
            {currentView === 'result' && result && (
              <motion.div key="result" variants={pageVariants} className="max-w-4xl mx-auto text-center">
                <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-xl relative">
                  <h1 className="text-2xl font-bold text-gray-400 mb-2">测评报告</h1>
                  
                  <div className={`flex flex-col ${result.radar_data.length >= 3 ? 'md:row' : 'items-center'} gap-12 mb-10`}>
                    {/* 左侧：分数和等级 */}
                    <div className="flex-1">
                      <div className="text-8xl font-black text-wysa-coral mb-4">{result.score}</div>
                      
                      {/* 🚀 结论：只显示短标题 */}
                      <div className="text-2xl font-bold text-wysa-green mb-8">
                        结论：{result.level}
                      </div>

                      {/* 🚀 专业解析：显示详细 AI 建议 */}
                      <div className="text-gray-500 leading-relaxed text-left bg-gray-50 p-8 rounded-[2rem] border-l-8 border-wysa-coral/30">
                        <p className="mb-4 font-bold text-wysa-green text-lg">专业解析：</p>
                        <div className="text-base space-y-4">
                          根据您的得分，当前的心理状态处于“{result.level}”水平。
                          <br />
                          {result.professional_analysis}
                        </div>
                      </div>
                    </div>

                    {/* 🚀 右侧：雷达图展示 (仅当维度 >= 3 时显示) */}
                    {result.radar_data && result.radar_data.length >= 3 ? (
                      <div className="w-80 h-80 flex items-center justify-center">
                        <PsychRadarChart data={result.radar_data} size={320} />
                      </div>
                    ) : null} 
                  </div>

                  {/* 如果没有维度，可以补一个简单的列表显示 */}
                  {result.radar_data.length > 0 && result.radar_data.length < 3 && (
                    <div className="flex gap-4 justify-center mb-10">
                        {result.radar_data.map(d => (
                          <span key={d.name} className="bg-wysa-pink/20 px-4 py-2 rounded-full text-sm font-bold">
                            {d.name}: {d.value}
                          </span>
                        ))}
                    </div>
                  )}

                  <hr className="my-10 border-gray-100" />

                  <hr className="my-10 border-wysa-pink/20" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div onClick={() => navigate('/agent')} className="group cursor-pointer bg-wysa-coral/50 hover:bg-wysa-green transition-all p-8 rounded-[2.5rem] text-left border-2 border-transparent hover:border-wysa-green/10">
                      <div className="text-4xl mb-4">👾</div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-white">AI 助手倾诉</h3>
                      <p className="text-sm text-wysa-green/60 group-hover:text-white/80">根据你的测评结果，建议与 AI 助手聊聊当下的感受。</p>
                    </div>
                    <div onClick={() => navigate('/interactive')} className="group cursor-pointer bg-wysa-green/50 hover:bg-wysa-coral transition-all p-8 rounded-[2.5rem] text-left border-2 border-transparent hover:border-wysa-coral/10">
                      <div className="text-4xl mb-4">🏃‍♀️</div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-white">互动社区</h3>
                      <p className="text-sm text-wysa-green/60 group-hover:text-white/80">在社区看看其他人的故事，你会发现你并不孤单。</p>
                    </div>
                  </div>

                  <button onClick={goHome} className="mt-12 text-wysa-green/30 hover:text-wysa-green font-bold transition-colors">返回测评列表</button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </ClickSpark>
    </div>
  );
}