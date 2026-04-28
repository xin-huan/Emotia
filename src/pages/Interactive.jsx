import React, { useState, useEffect } from 'react';
import ClickSpark from '../ClickSpark';
import Ballpit from '../Ballpit';
import CircularGallery from '../CircularGallery';

// ==========================================
// 1. 模拟数据定义 (给后端看的数据结构参考)
// ==========================================

// 补齐的 6 篇带 HTML 真实排版格式的文章
const MOCK_ARTICLES = [
  {
    id: 1,
    title: '探索心灵的秘密：情绪急救指南',
    author: '心理学专家 Sarah',
    date: '2023-10-01',
    content: `
      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">1. 允许情绪的自然流露</h3>
      <p style="margin-bottom: 1.5rem; line-height: 1.8;">很多时候，我们习惯于压抑负面情绪。但心理学研究表明，<b>“看见”即是治愈的开始</b>。当你感到焦虑或悲伤时，不要急着推开它，试着对它说：“我看到你了，我允许你存在。”</p>

      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">2. 尝试 4-7-8 呼吸法</h3>
      <p style="margin-bottom: 1.5rem; line-height: 1.8;">这是一种能迅速降低心率、缓解焦虑的物理方法：<br/>
      • 吸气 <b>4</b> 秒<br/>
      • 憋气 <b>7</b> 秒<br/>
      • 呼气 <b>8</b> 秒<br/>
      循环 4 次，你会发现大脑的紧绷感奇迹般地消失了。</p>

      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">3. 建立“抽离者”视角</h3>
      <p style="line-height: 1.8;">把你的思绪想象成天空中飘过的云。你是一片天空，云聚云散，但天空永远在那里。不要对每一个念头都做出反应，仅仅是观察它们。</p>
    `
  },
  {
    id: 2,
    title: '告别内耗：如何建立健康的心理边界',
    author: '资深咨询师 李明',
    date: '2023-10-05',
    content: `
      <p style="margin-bottom: 1.5rem; line-height: 1.8;">你是否总是很难对别人说“不”？即使自己已经很累，也总是习惯性地讨好他人？这其实是<b>心理边界模糊</b>的表现。</p>

      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">什么是心理边界？</h3>
      <p style="margin-bottom: 1.5rem; line-height: 1.8;">心理边界就像是你家院子周围的栅栏，它告诉你哪里是你的责任，哪里是别人的责任。缺乏边界的人，容易把别人的情绪背在自己身上。</p>

      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">如何重塑边界？</h3>
      <ul style="list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; line-height: 1.8;">
        <li><b>从小事开始拒绝：</b> 试着在一个安全的社交环境里，温和但坚定地拒绝一个你不喜欢的提议。</li>
        <li><b>区分课题：</b> 问自己：“这是谁的问题？”如果对方生气是因为他自己的期待落空，那这不是你的错。</li>
        <li><b>接纳内疚感：</b> 刚开始建立边界时一定会感到内疚，这是正常的戒断反应，请带着内疚继续坚持。</li>
      </ul>
    `
  },
  {
    id: 3,
    title: '正念冥想：每天 10 分钟重塑大脑结构',
    author: '神经科学研究员 Anna',
    date: '2023-10-12',
    content: `
      <p style="margin-bottom: 1.5rem; line-height: 1.8;">提到冥想，很多人以为是“什么都不想”。事实上，冥想是大脑的健身房，它训练的是我们的<b>注意力肌肉</b>。</p>

      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">科学证据：冥想改变了什么？</h3>
      <p style="margin-bottom: 1.5rem; line-height: 1.8;">哈佛大学的 fMRI（功能性核磁共振）研究表明，连续 8 周、每天 10 分钟的正念练习，可以显著：<br/>
      1. <b>缩小杏仁核</b>（处理恐惧和焦虑的大脑区域）<br/>
      2. <b>增厚前额叶皮层</b>（负责决策、注意力和情绪调节的区域）</p>

      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">初学者指南</h3>
      <p style="line-height: 1.8;">找一个安静的地方坐下。闭上眼睛，把注意力集中在鼻腔边缘呼吸进出的感觉上。当你的思绪飘走时（这一定会发生），轻轻地把注意力拉回来。每一次“拉回来”，就是在做一次大脑的举重训练。</p>
    `
  },
  {
    id: 4,
    title: '职场生存术：如何应对有毒的工作环境',
    author: '职业心理辅导员 王强',
    date: '2023-10-18',
    content: `
      <p style="margin-bottom: 1.5rem; line-height: 1.8;">在有毒的职场环境中，我们很容易怀疑自己的价值。老板的 PUA、同事的甩锅，都在不断蚕食我们的能量。</p>

      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">核心策略：课题分离</h3>
      <p style="margin-bottom: 1.5rem; line-height: 1.8;">阿德勒心理学提出“课题分离”。老板的情绪失控是老板的课题，而你如何完成工作、如何看待自己，是你的课题。<b>不要把别人的情绪垃圾捡回来放在自己的口袋里。</b></p>

      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">建立“心理缓冲垫”</h3>
      <ul style="list-style-type: circle; padding-left: 1.5rem; line-height: 1.8;">
        <li>下班后彻底切断工作联系，培养一个需要深度投入的业余爱好。</li>
        <li>在工位上放一些能让你感到安全的私人物品（如小绿植、毛绒玩具）。</li>
        <li>保留记录：如果遭遇职场霸凌，客观、冷静地记录下时间、地点和事件经过，作为自我保护的底牌。</li>
      </ul>
    `
  },
  {
    id: 5,
    title: '改善睡眠：找回自然入睡的本能',
    author: '睡眠医学专家 陈医生',
    date: '2023-10-22',
    content: `
      <p style="margin-bottom: 1.5rem; line-height: 1.8;">越想睡越睡不着？失眠往往是因为我们对“睡眠”本身产生了过度的焦虑。</p>

      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">睡眠限制疗法（CBTI 核心技巧）</h3>
      <p style="margin-bottom: 1.5rem; line-height: 1.8;">如果你在床上躺了 20 分钟仍然清醒，<b>立刻离开床</b>。去客厅看一本枯燥的书，或者听白噪音，直到困意袭来再回床。<br/>
      床只能用来睡觉。我们要重建大脑中“床 = 睡眠”的条件反射，而不是“床 = 焦虑、翻来覆去、玩手机”。</p>

      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">光照对生物钟的魔法</h3>
      <p style="line-height: 1.8;">早晨醒来后，尽量在 30 分钟内接触充足的自然阳光，这会重置你的昼夜节律；而睡前 1 小时，必须开启屏幕的护眼模式，减少蓝光对褪黑素分泌的抑制。</p>
    `
  },
  {
    id: 6,
    title: '自我同情：像对待好朋友一样对待自己',
    author: '临床心理学博士 Lin',
    date: '2023-10-28',
    content: `
      <p style="margin-bottom: 1.5rem; line-height: 1.8;">当我们犯错或搞砸事情时，内心通常会跳出一个严厉的声音：“你太蠢了”、“你总是这样”。这种自我苛责其实是抑郁和焦虑的催化剂。</p>

      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">什么是自我同情 (Self-Compassion)？</h3>
      <p style="margin-bottom: 1.5rem; line-height: 1.8;">自我同情不是自我怜悯或找借口，它包含三个核心要素：<br/>
      1. <b>善待自己：</b> 用鼓励取代批判。<br/>
      2. <b>共同人性：</b> 认识到犯错、痛苦是全人类共有的体验，你并不孤单。<br/>
      3. <b>正念觉察：</b> 不夸大痛苦，也不逃避痛苦，如实地看着它。</p>

      <h3 style="color:#E58889; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">一个小练习</h3>
      <p style="line-height: 1.8;">下次当你感到挫败时，想象一下如果是你最好的朋友遇到了完全一样的情况，你会对他说什么？用怎样的语气？<br/>
      现在，<b>把这些话，用同样的语气，对你自己说一遍。</b></p>
    `
  }
];

// 模拟的完整问答数据库表
const DATABASE_QUESTIONS = [
  { id: 101, author: '匿名用户', avatar: '匿', content: '最近总是感觉很累，但其实什么都没做，这是正常的吗？', likes: 24, isLiked: false, commentsCount: 12 },
  { id: 102, author: '职场打工人', avatar: '职', content: '想问问大家，在职场上遇到PUA该怎么调解自己的心态？', likes: 85, isLiked: true, commentsCount: 34 },
  { id: 103, author: '夜猫子', avatar: '夜', content: '分享一个超好用的正念冥想技巧，亲测有效！', likes: 72, isLiked: false, commentsCount: 18 },
  { id: 104, author: '拒绝内耗', avatar: '拒', content: '如何停止过度思考？脑袋里每天都在放电影。', likes: 56, isLiked: false, commentsCount: 9 },
  { id: 105, author: '树洞主', avatar: '洞', content: '今天遇到了一些不开心的事，想找个地方倾诉一下。', likes: 41, isLiked: false, commentsCount: 22 },
  { id: 106, author: '考研党', avatar: '考', content: '焦虑到睡不着，大家都是怎么熬过备考期的？', likes: 15, isLiked: false, commentsCount: 5 },
];

// 模拟评论表
const MOCK_COMMENTS = {
  101: [
    { id: 1, author: '心理咨询师李', avatar: '李', content: '这是典型的“情绪内耗”，大脑在后台高速运转其实比体力劳动更耗能。', time: '2小时前' },
    { id: 2, author: '抱抱你', avatar: '抱', content: '我也经常这样，给自己放个假吧，什么都不做也是一种休息。', time: '1小时前' }
  ]
};

// 专家评价数据（新增了 avatar 字段绑定本地 1.jpg）
const FEEDBACKS = [
  { id: 1, name: 'Dr. Sarah', title: '临床心理学家', avatar: '/1.jpg', quote: '这个平台通过极具创意的互动方式，打破了传统心理宣泄的壁垒，让情绪的流动变得具象化。' },
  { id: 2, name: '李明哲', title: '资深心理咨询师', avatar: '/1.jpg', quote: '球体的碰撞非常解压，这种结合了物理反馈的视觉疗法，对缓解轻度焦虑有显著效果。' },
  { id: 3, name: 'Prof. Anderson', title: '行为科学研究员', avatar: '/1.jpg', quote: '社区氛围极其温暖。用户在互动中既能保持匿名安全感，又能感受到连接的真实感。' },
];

const Interactive = () => {
  // ==========================================
  // 2. 状态管理
  // ==========================================

  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const [questionText, setQuestionText] = useState('');
  const [randomQuestions, setRandomQuestions] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [currentComments, setCurrentComments] = useState([]);

  const [hasNewMessage, setHasNewMessage] = useState(true);

  useEffect(() => {
    fetchRandomQuestions();
  }, []);

  useEffect(() => {
    if (selectedQuestion) {
      setCurrentComments(MOCK_COMMENTS[selectedQuestion.id] || []);
    } else {
      setCommentText('');
    }
  }, [selectedQuestion]);

  // ==========================================
  // 3. 模拟 API 请求函数
  // ==========================================

  const fetchRandomQuestions = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const shuffled = [...DATABASE_QUESTIONS].sort(() => 0.5 - Math.random());
      setRandomQuestions(shuffled.slice(0, 2));
      setIsRefreshing(false);
    }, 600);
  };

  const handlePostQuestion = () => {
    if (!questionText.trim()) return;
    alert("模拟请求：发布问题成功！");
    setQuestionText('');
    fetchRandomQuestions();
  };

  const handleToggleLike = (e, questionId) => {
    e.stopPropagation();
    setRandomQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        return { ...q, isLiked: !q.isLiked, likes: q.isLiked ? q.likes - 1 : q.likes + 1 };
      }
      return q;
    }));
  };

  const handlePostComment = () => {
    if (!commentText.trim() || !selectedQuestion) return;

    const newComment = {
      id: Date.now(),
      author: '我(当前用户)',
      avatar: '我',
      content: commentText,
      time: '刚刚'
    };

    setCurrentComments([newComment, ...currentComments]);
    setCommentText('');
  };

  return (
    <ClickSpark sparkColor='wysa-pink'>
      {/* 1. 背景层 */}
      <div className="fixed inset-0 z-0">
        <Ballpit
          count={150}
          gravity={0.4}
          friction={0.996}
          wallBounce={0.9}
          followCursor={true}
          colors={["#E58889", "#A5C0A5", "#4D664D"]}
          ambientColor="#FCE7E9"
          lightIntensity={150}
          minSize={0.6}
          maxSize={1.2}
        />
      </div>

      {/* 2. 内容层 */}
      <div className="relative z-10 min-h-screen bg-wysa-pink/60 pt-24 px-6 md:px-12 lg:px-24 antialiased pointer-events-none overflow-y-auto">

        {/* 顶部个人空间入口 & 消息提示 */}
        <div className="fixed top-6 right-6 md:right-12 z-40 pointer-events-auto">
          <div
            className="relative cursor-pointer hover:scale-105 transition-transform"
            onClick={() => {
              setHasNewMessage(false);
              alert("模拟跳转：进入个人空间/消息列表，查看谁回复了你");
            }}
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-wysa-green overflow-hidden">
              <span className="text-xl">🧑‍🚀</span>
            </div>
            {hasNewMessage && (
              <span className="absolute top-0 right-0 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
              </span>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto pb-24">
          <h1 className="text-4xl md:text-5xl font-extrabold text-wysa-green mb-4 drop-shadow-sm">
            互动论坛
          </h1>
          <p className="text-lg text-wysa-green mb-12 max-w-2xl">
            在这里碰撞思想、释放情绪。点击球体感受物理反馈，点击卡片参与社区互动。
          </p>

        {/* ================= 模块一：最新文章 ================= */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-wysa-green flex items-center gap-2">
              <span className="text-wysa-coral">✦</span> 最新文章
            </h2>
          </div>
          <div className="w-full h-[480px] pointer-events-auto relative -mt-15">
            <CircularGallery
              items={MOCK_ARTICLES.map((article, i) => ({
                image: `/${i + 1}.jpg`,
                text: article.title,
                originalData: article
              }))}
              onItemClick={(item) => {
                setSelectedArticle(item.originalData);
              }}
            />
          </div>
        </section>

          {/* ================= 模块二：社区问答 ================= */}
          <section className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* 左侧：问答流 & 提问框 */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-bold text-wysa-green flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-wysa-coral">✦</span> 社区问答
                  </div>
                </h2>

                <div className="pointer-events-auto bg-wysa-pink/60 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-sm">
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="此刻你在想什么？提出你的困惑..."
                    className="w-full bg-white rounded-xl p-4 text-wysa-green placeholder-wysa-green/40 outline-none focus:ring-2 focus:ring-wysa-coral/50 resize-none transition-all"
                    rows={3}
                  />
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handlePostQuestion}
                      className="bg-wysa-coral hover:bg-wysa-green text-white px-6 py-2 rounded-full font-bold transition-transform hover:scale-105 shadow-sm"
                    >
                      发布问题
                    </button>
                  </div>
                </div>

                <div className="space-y-4 relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-2xl font-bold text-wysa-green">最新问题</span>
                    <button
                      onClick={fetchRandomQuestions}
                      disabled={isRefreshing}
                      className="pointer-events-auto text-sm text-wysa-coral hover:text-wysa-green flex items-center gap-1 transition-colors"
                    >
                      <span className={isRefreshing ? "animate-spin" : ""}>↻</span> 换一批
                    </button>
                  </div>

                  {randomQuestions.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuestion(q)}
                      className="pointer-events-auto bg-wysa-pink/80 backdrop-blur-sm rounded-2xl p-5 border border-white/30 hover:bg-white/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-wysa-coral text-white flex items-center justify-center text-xs font-bold">{q.avatar}</div>
                        <span className="text-sm font-bold text-wysa-coral/80">{q.author}</span>
                      </div>
                      <p className="text-wysa-green font-normal">
                        {q.content}
                      </p>

                      <div className="flex gap-6 mt-4 text-sm font-medium">
                        <button
                          onClick={(e) => handleToggleLike(e, q.id)}
                          className={`flex items-center gap-1 transition-colors ${q.isLiked ? 'text-red-500' : 'text-wysa-green hover:text-red-400'}`}
                        >
                          {q.isLiked ? '❤️' : '♡'} 共鸣 {q.likes > 0 ? `(${q.likes})` : ''}
                        </button>
                        <button className="text-wysa-green hover:text-wysa-coral flex items-center gap-1">
                          💬 讨论 ({q.commentsCount})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 右侧：热度排行榜 */}
              <div className="lg:col-span-1">
                <div className="pointer-events-auto bg-wysa-pink/60 backdrop-blur-md rounded-3xl p-6 border border-white/50 h-full">
                  <h3 className="text-xl font-bold text-wysa-green mb-6 flex items-center gap-2">
                    🔥 讨论热榜
                  </h3>
                  <ul className="space-y-4">
                    {DATABASE_QUESTIONS.slice(0, 5).sort((a,b)=>b.likes - a.likes).map((topic, index) => (
                      <li
                        key={topic.id}
                        onClick={() => setSelectedQuestion(topic)}
                        className="flex items-start gap-3 group cursor-pointer"
                      >
                        <span className={`font-black text-lg mt-0.5 ${index < 3 ? 'text-wysa-coral' : 'text-wysa-green/50'}`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-wysa-green font-medium group-hover:text-wysa-coral transition-colors line-clamp-2">
                            {topic.content}
                          </p>
                          <span className="text-xs text-wysa-green/80">{topic.likes * 123} 热度</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ================= 模块三：专业反馈总结 ================= */}
          <section>
            <h2 className="text-2xl font-bold text-wysa-green mb-6 flex items-center gap-2">
              <span className="text-wysa-coral">✦</span> 专家评价
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEEDBACKS.map((fb) => (
                <div key={fb.id} className="pointer-events-auto bg-wysa-green/70 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="relative z-10">
                    <p className="text-white/90 italic mb-6 leading-relaxed">
                      "{fb.quote}"
                    </p>
                    <div className="flex items-center gap-4">
                      {/* 【修改点】：将原先的首字母替换成了 img 图片标签 */}
                      <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 shrink-0 overflow-hidden relative">
                        <img
                          src={fb.avatar}
                          alt={fb.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="grow">
                        <h4 className="font-bold text-white text-lg">{fb.name}</h4>
                        <p className="text-sm text-white/60">{fb.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ================= 弹窗：站内文章详情 ================= */}
      {selectedArticle && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
         <div className="absolute inset-0 bg-wysa-green/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedArticle(null)}></div>
         <div className="relative bg-white w-full max-w-3xl max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col transform transition-all">
           <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
             <span className="text-sm font-bold text-wysa-green bg-wysa-green/10 px-3 py-1 rounded-full">站内专栏</span>
             <button onClick={() => setSelectedArticle(null)} className="text-gray-400 hover:text-wysa-green bg-gray-50 hover:bg-wysa-green/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
           </div>
           <div className="p-8 overflow-y-auto">
             <h2 className="text-3xl font-black text-wysa-green mb-4">{selectedArticle.title}</h2>
             <div className="flex gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
               <span>作者：{selectedArticle.author}</span>
               <span>发布于：{selectedArticle.date}</span>
             </div>
             {/* 渲染真实的 HTML 排版文章内容 */}
             <div
               className="text-wysa-green/80"
               dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
             />
           </div>
         </div>
       </div>
      )}

      {/* ================= 弹窗：问答讨论详情 ================= */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
          <div className="absolute inset-0 bg-wysa-green/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedQuestion(null)}></div>

          <div className="relative bg-[#FCF8F8] w-full max-w-2xl max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col transform transition-all">
            {/* Header */}
            <div className="px-6 py-4 border-b border-black/5 flex justify-between items-center bg-white">
              <span className="text-sm font-bold text-wysa-green">问题详情</span>
              <button onClick={() => setSelectedQuestion(null)} className="text-gray-400 hover:text-wysa-coral p-1 text-xl">✕</button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-[#FCF8F8]">
              {/* 主楼：问题内容 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-wysa-coral text-white flex items-center justify-center text-sm font-bold">{selectedQuestion.avatar}</div>
                  <div>
                    <div className="text-sm font-bold text-wysa-coral/80">{selectedQuestion.author}</div>
                    <div className="text-xs text-gray-400">楼主</div>
                  </div>
                </div>
                <p className="text-lg text-wysa-green font-medium mb-4 leading-relaxed">
                  {selectedQuestion.content}
                </p>
                <div className="flex gap-4 text-sm font-medium text-gray-500 pt-4 border-t border-gray-50">
                   <span>{selectedQuestion.likes} 人共鸣</span>
                   <span>{selectedQuestion.commentsCount} 条讨论</span>
                </div>
              </div>

              {/* 评论列表 */}
              <h4 className="font-bold text-wysa-green mb-4 px-2">全部讨论</h4>
              <div className="space-y-4">
                {currentComments.length > 0 ? currentComments.map(comment => (
                  <div key={comment.id} className="bg-white rounded-2xl p-5 shadow-sm flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                      {comment.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-gray-700">{comment.author}</span>
                        <span className="text-xs text-gray-400">{comment.time}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-400 py-8 text-sm">还没有人回复，来做第一个温暖他的人吧</div>
                )}
              </div>
            </div>

            {/* 底部：发表评论 */}
            <div className="p-4 bg-white border-t border-black/5 flex gap-3 items-end">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写下你的温暖回复..."
                className="flex-1 bg-gray-50 rounded-xl p-3 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-wysa-coral/50 resize-none"
                rows={2}
              />
              <button
                onClick={handlePostComment}
                className="bg-wysa-coral hover:bg-wysa-green text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors mb-0.5"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </ClickSpark>
  );
};

export default Interactive;