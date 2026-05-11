import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import ShapeBlur from '../ShapeBlur';
import ClickSpark from '../ClickSpark';
import ScrollReveal from '../ScrollReveal';
import { useNavigate } from 'react-router-dom';

const API_BASE = "http://localhost:8000/api";

// ==========================================
// 3D 倾斜容器
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
// 专业的雷达图组件
// ==========================================
const PsychRadarChart = ({ data, size = 300 }) => {
  if (!data || data.length < 3) return null;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;
  const angleStep = (Math.PI * 2) / data.length;

  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  const gridLines = levels.map(level => {
    return data.map((_, i) => {
      const x = centerX + radius * level * Math.cos(i * angleStep - Math.PI / 2);
      const y = centerY + radius * level * Math.sin(i * angleStep - Math.PI / 2);
      return `${x},${y}`;
    }).join(' ');
  });

  const dataPoints = data.map((d, i) => {
    const val = Math.max(0.5, Math.min(d.value, 5));
    const x = centerX + (radius * (val / 5)) * Math.cos(i * angleStep - Math.PI / 2);
    const y = centerY + (radius * (val / 5)) * Math.sin(i * angleStep - Math.PI / 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={size} height={size} className="mx-auto overflow-visible drop-shadow-sm">
      {gridLines.map((line, i) => (
        <polygon key={i} points={line} fill="none" stroke="#f0f0f0" strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const x = centerX + radius * Math.cos(i * angleStep - Math.PI / 2);
        const y = centerY + radius * Math.sin(i * angleStep - Math.PI / 2);
        return <line key={i} x1={centerX} y1={centerY} x2={x} y2={y} stroke="#f0f0f0" strokeWidth="1" />;
      })}
      <motion.polygon
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        points={dataPoints}
        fill="rgba(229, 136, 137, 0.4)"
        stroke="#E58889"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const x = centerX + (radius + 25) * Math.cos(i * angleStep - Math.PI / 2);
        const y = centerY + (radius + 25) * Math.sin(i * angleStep - Math.PI / 2);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[11px] fill-gray-400 font-bold">
            {d.name}
          </text>
        );
      })}
    </svg>
  );
};

// ==========================================
// 主页面组件
// ==========================================
export default function TestPage() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('home');
  const [selectedTest, setSelectedTest] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [testList, setTestList] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView, activeTab]);

  useEffect(() => {
    fetch(`${API_BASE}/tests`)
      .then(res => res.json())
      .then(data => setTestList(data))
      .catch(err => console.error("加载列表失败", err));
  }, []);

  const categories = useMemo(() => {
    const allTags = testList.map(t => t.tags?.[0] || '未分类');
    return ['全部', ...new Set(allTags)];
  }, [testList]);

  const displayTests = useMemo(() => {
    return testList.filter(test => {
      const matchCategory = activeTab === '全部' || (test.tags && test.tags[0] === activeTab);
      const matchSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          test.abbreviation?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [testList, activeTab, searchQuery]);

  // 🚀 核心逻辑：定义图标匹配逻辑
  // 采用“关键词包含”匹配法，防止后端返回的字符串由于空格、换行导致不完全相等
  const getIconByCategory = (tags) => {
    const categoryName = tags?.[0] || "";
    if (!categoryName) return "📝";

    if (categoryName.includes("行为方式")) return "🏃";
    if (categoryName.includes("家庭") || categoryName.includes("关系")) return "👨‍👩‍👧‍👦";
    if (categoryName.includes("精神病学") || categoryName.includes("临床")) return "🏥";
    if (categoryName.includes("应激")) return "⚡";
    if (categoryName.includes("生活质量") || categoryName.includes("满意度")) return "🌟";
    if (categoryName.includes("情绪")) return "🌈";
    if (categoryName.includes("抑郁")) return "☁️";
    if (categoryName.includes("焦虑")) return "🌪️";
    if (categoryName.includes("性格") || categoryName.includes("人格")) return "🧩";
    if (categoryName.includes("职场") || categoryName.includes("能力")) return "💼";

    return "📝"; // 默认图标
  };

  const goToIntro = (test) => {
    setSelectedTest(test);
    setCurrentView('intro');
  };

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

  const handleAnswer = (score) => {
    const questionId = questions[currentQIndex].id;
    const newAnswers = [...answers, { question_id: questionId, score: score }];
    setAnswers(newAnswers);

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    } else {
      submitToBackend(newAnswers);
    }
  };

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
        setResult(data.data);
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
    <div className="min-h-screen bg-wysa-pink text-wysa-green font-sans pt-30 pb-12 overflow-x-hidden relative">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-md"
          >
            <div className="bg-white px-12 py-10 rounded-[3rem] shadow-2xl flex flex-col items-center border border-wysa-pink/30">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-wysa-pink/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-wysa-coral rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-extrabold text-wysa-green mb-2">
                {currentView === 'intro' ? '正在拉取题目...' : '正在生成专属报告...'}
              </h2>
              <p className="text-wysa-green/50 font-medium">深度解析中，请稍候片刻</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ClickSpark sparkColor="#E58889" sparkCount={10} sparkSize={12} duration={350}>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <AnimatePresence mode="wait">

            {/* --- 视图 1: 首页 --- */}
            {currentView === 'home' && (
              <motion.div key="home" variants={pageVariants} initial="initial" animate="in" exit="out">
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

                <div className="flex gap-3 mb-8 overflow-x-auto pb-4 no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                        activeTab === cat
                          ? 'bg-wysa-coral text-white shadow-md scale-105'
                          : 'bg-white text-wysa-green hover:bg-white shadow-sm'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                  {displayTests.length > 0 ? (
                    displayTests.map(test => {
                      // 🚀 使用增强的匹配逻辑
                      const displayIcon = getIconByCategory(test.tags);

                      return (
                        <TiltedWrapper key={test.id} captionText={`点击测试: ${test.title}`}>
                          <div
                            className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl border-2 border-transparent transition-all duration-300 cursor-pointer flex gap-6 h-full group"
                            onClick={() => goToIntro(test)}
                          >
                            <div className="text-5xl w-24 h-24 flex items-center justify-center rounded-[2rem] shrink-0 border bg-wysa-pink/20 border-wysa-pink/30 group-hover:scale-105 transition-transform duration-300">
                              {displayIcon}
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <h3 className="text-xl font-bold mb-2 text-wysa-green">{test.title}</h3>
                                <p className="text-sm text-wysa-green/60 mb-4 line-clamp-2 leading-relaxed">{test.description}</p>
                              </div>
                              <div className="flex justify-between items-center text-xs font-bold text-wysa-green/50">
                                <span className="bg-gray-50 px-3 py-1 rounded-lg">{test.abbreviation} · {test.duration_time}</span>
                                <span className="text-wysa-coral group-hover:translate-x-1 transition-transform">开始 →</span>
                              </div>
                            </div>
                          </div>
                        </TiltedWrapper>
                      );
                    })
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
              <motion.div key="intro" variants={pageVariants} initial="initial" animate="in" exit="out" className="max-w-3xl mx-auto py-12">
                 <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl text-center relative border border-white">
                   <div className="text-8xl mb-6 drop-shadow-sm">{getIconByCategory(selectedTest.tags)}</div>
                   <h1 className="text-4xl font-extrabold mb-6 text-wysa-green">{selectedTest.title}</h1>

                   <div className="flex justify-center gap-4 mb-8">
                      <span className="bg-gray-50 border border-gray-100 px-5 py-2 rounded-xl text-sm font-bold text-gray-500 shadow-sm">
                        🏷️ 测评代号: {selectedTest.abbreviation || '标准版'}
                      </span>
                      <span className="bg-gray-50 border border-gray-100 px-5 py-2 rounded-xl text-sm font-bold text-gray-500 shadow-sm">
                        ⏱️ 预计耗时: {selectedTest.duration_time || '5-10分钟'}
                      </span>
                   </div>

                   <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-8 rounded-[2rem] text-left mb-10 shadow-inner">
                     <p className="text-lg text-wysa-green/80 leading-loose font-medium">
                       <span className="text-2xl font-bold text-wysa-coral block mb-3">关于此项测评</span>
                       {selectedTest.description}
                     </p>
                   </div>

                   <button
                    onClick={goToQuiz}
                    className="bg-wysa-coral text-white px-20 py-5 rounded-full font-bold text-xl shadow-lg shadow-wysa-coral/30 hover:bg-[#e67576] hover:scale-105 active:scale-95 transition-all duration-300 w-full md:w-auto"
                   >
                     准备好了，立刻开始测试
                   </button>
                   <button onClick={goHome} className="block mx-auto mt-6 text-wysa-green/40 hover:text-wysa-coral font-medium transition-colors">
                     ← 放弃并返回列表
                   </button>
                 </div>
              </motion.div>
            )}

            {/* --- 视图 3: 答题页 --- */}
            {currentView === 'quiz' && questions.length > 0 && (
              <motion.div key="quiz" variants={pageVariants} initial="initial" animate="in" exit="out" className="max-w-4xl mx-auto">
                <div className="mb-8 flex justify-between items-center px-4">
                  <span className="font-bold text-wysa-green/50 bg-white/50 px-4 py-1.5 rounded-full shadow-sm">正在测评: {selectedTest?.title}</span>
                  <span className="bg-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-gray-50">进度 {currentQIndex + 1} / {questions.length}</span>
                </div>
                <div className="w-full bg-white/60 h-3 rounded-full mb-12 shadow-inner overflow-hidden border border-white">
                  <motion.div className="h-full bg-wysa-coral" initial={{ width: 0 }} animate={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }} transition={{ease: "easeOut"}}/>
                </div>

                <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-xl border-2 border-white text-center">
                  <h2 className="text-2xl md:text-3xl font-extrabold mb-12 text-wysa-green leading-snug">
                    {questions[currentQIndex].question_text}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {questions[currentQIndex].options.map((opt, idx) => (
                      <button key={idx} onClick={() => handleAnswer(opt.score)} className="bg-gray-50 hover:bg-white text-wysa-green hover:text-wysa-coral p-6 rounded-[2rem] flex items-center justify-center gap-2 border-2 border-transparent hover:border-wysa-coral shadow-sm hover:shadow-md transition-all active:scale-95 group font-bold text-lg">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- 视图 4：结果页 --- */}
            {currentView === 'result' && result && (
              <motion.div key="result" variants={pageVariants} className="max-w-4xl mx-auto text-center py-6">
                <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl relative border border-white">
                  <h1 className="text-xl font-bold text-gray-400 mb-8 tracking-widest">测评专属分析报告</h1>

                  <div className={`flex flex-col ${result.radar_data.length >= 3 ? 'md:flex-row md:items-center' : 'items-center'} gap-12 mb-10`}>
                    <div className="flex-1 text-left">
                      <div className="flex items-baseline gap-3 mb-4">
                        <div className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-wysa-coral to-[#ff8c8e]">{result.score}</div>
                        <div className="text-2xl font-bold text-gray-300">分</div>
                      </div>

                      <div className="inline-block bg-wysa-pink/20 px-6 py-2.5 rounded-2xl text-xl font-bold text-wysa-coral mb-8 border border-wysa-pink/40">
                        当前状态：{result.level}
                      </div>

                      <div className="text-gray-500 leading-relaxed text-left bg-gray-50 p-8 rounded-[2rem] border-l-8 border-wysa-coral shadow-inner">
                        <p className="mb-4 font-bold text-wysa-green text-lg flex items-center gap-2">
                          <span className="text-2xl">📋</span> 专业解析：
                        </p>
                        <div className="text-base space-y-4">
                          根据得分，您的整体水平被评估为 <span className="font-extrabold text-wysa-green">“{result.level}”</span>。
                          <br />
                          {result.professional_analysis}
                        </div>
                      </div>
                    </div>

                    {result.radar_data && result.radar_data.length >= 3 ? (
                      <div className="w-80 h-80 flex items-center justify-center bg-gray-50 rounded-full border border-gray-100 p-2 shadow-inner">
                        <PsychRadarChart data={result.radar_data} size={300} />
                      </div>
                    ) : null}
                  </div>

                  <hr className="my-12 border-gray-100" />

                  <div className="text-left mb-8">
                     <h2 className="text-2xl font-extrabold text-wysa-green mb-2">💡 基于结果的专属行动建议</h2>
                     <p className="text-gray-400 mb-8 font-medium">量表只是工具，行动才能带来改变。我们为您准备了以下支持：</p>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div onClick={() => navigate('/agent')} className="group cursor-pointer bg-white border-2 border-gray-100 hover:border-wysa-coral hover:bg-wysa-coral/5 transition-all duration-300 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1">
                          <div className="flex items-start gap-5">
                            <div className="text-5xl group-hover:scale-110 transition-transform origin-top-left">👾</div>
                            <div>
                              <h3 className="text-xl font-bold mb-2 text-wysa-green group-hover:text-wysa-coral transition-colors">AI 情绪理疗室</h3>
                              <div className="mb-2 inline-block bg-wysa-coral/10 text-wysa-coral text-xs font-bold px-2 py-1 rounded">为什么推荐？</div>
                              <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-700">
                                测评结果显示您可能需要一些情绪疏导。AI 助手可以提供私密空间，帮你安全地梳理感受。
                              </p>
                            </div>
                          </div>
                        </div>

                        <div onClick={() => navigate('/interactive')} className="group cursor-pointer bg-white border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-300 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1">
                          <div className="flex items-start gap-5">
                            <div className="text-5xl group-hover:scale-110 transition-transform origin-top-left">🫂</div>
                            <div>
                              <h3 className="text-xl font-bold mb-2 text-wysa-green group-hover:text-emerald-600 transition-colors">温暖互动社区</h3>
                              <div className="mb-2 inline-block bg-emerald-100 text-emerald-600 text-xs font-bold px-2 py-1 rounded">为什么推荐？</div>
                              <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-700">
                                看看其他人的故事，共鸣和分享也是一种疗愈。
                              </p>
                            </div>
                          </div>
                        </div>
                     </div>
                  </div>

                  <button onClick={goHome} className="mt-8 text-gray-400 hover:text-wysa-green font-bold transition-colors bg-gray-50 hover:bg-gray-100 px-8 py-3 rounded-full">
                    ← 返回测评大厅
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </ClickSpark>
    </div>
  );
}