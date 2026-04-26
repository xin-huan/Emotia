import React, { useState, useEffect } from 'react';
import ClickSpark from '../ClickSpark';
import Ballpit from '../Ballpit';
import CircularGallery from '../CircularGallery';
// ==========================================
// 1. 模拟数据定义 (这些就是给后端看的数据结构参考)
// ==========================================

const MOCK_ARTICLES = Array(6).fill(null).map((_, i) => ({
  id: i,
  title: `探索心灵的秘密：第 ${i + 1} 篇专业指南`,
  excerpt: '在这里，我们将深入探讨情绪管理的科学方法，帮助你建立内在的平静与力量...',
  author: '心理学专家',
  date: `2023-10-0${i + 1}`,
  content: `这是第 ${i + 1} 篇文章的完整内容。在本项目内打开，不发生外部跳转。这里会有很多详细的心理学和健康相关的指导建议...`
}));

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

const FEEDBACKS = [
  { id: 1, name: 'Dr. Sarah', title: '临床心理学家', quote: '这个平台通过极具创意的互动方式，打破了传统心理宣泄的壁垒，让情绪的流动变得具象化。' },
  { id: 2, name: '李明哲', title: '资深心理咨询师', quote: '球体的碰撞非常解压，这种结合了物理反馈的视觉疗法，对缓解轻度焦虑有显著效果。' },
  { id: 3, name: 'Prof. Anderson', title: '行为科学研究员', quote: '社区氛围极其温暖。用户在互动中既能保持匿名安全感，又能感受到连接的真实感。' },
];

const Interactive = () => {
  // ==========================================
  // 2. 状态管理 (前端UI状态与模拟服务端状态)
  // ==========================================

  // 文章与问答详情的弹窗控制
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // 问答流的数据状态
  const [questionText, setQuestionText] = useState('');
  const [randomQuestions, setRandomQuestions] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 详情页内的评论输入
  const [commentText, setCommentText] = useState('');
  const [currentComments, setCurrentComments] = useState([]);

  // 个人消息通知状态 (小红点)
  const [hasNewMessage, setHasNewMessage] = useState(true);

  // 初始化加载随机问题
  useEffect(() => {
    fetchRandomQuestions();
  }, []);

  // 当打开某个问题详情时，拉取它的评论数据
  useEffect(() => {
    if (selectedQuestion) {
      // 模拟请求评论接口
      setCurrentComments(MOCK_COMMENTS[selectedQuestion.id] || []);
    } else {
      setCommentText('');
    }
  }, [selectedQuestion]);

  // ==========================================
  // 3. 模拟 API 请求函数 (后端对接时只需修改这里)
  // ==========================================

  // [API]: 获取随机问题列表
  const fetchRandomQuestions = () => {
    setIsRefreshing(true);
    // 模拟网络延迟
    setTimeout(() => {
      const shuffled = [...DATABASE_QUESTIONS].sort(() => 0.5 - Math.random());
      setRandomQuestions(shuffled.slice(0, 2)); // 每次随机展示2条
      setIsRefreshing(false);
    }, 600);
  };

  // [API]: 发布新问题
  const handlePostQuestion = () => {
    if (!questionText.trim()) return;
    alert("模拟请求：发布问题成功！");
    setQuestionText('');
    fetchRandomQuestions(); // 发布后刷新列表
  };

  // [API]: 点赞/取消点赞 (共鸣)
  const handleToggleLike = (e, questionId) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发进入详情页
    // 乐观更新 UI
    setRandomQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        return { ...q, isLiked: !q.isLiked, likes: q.isLiked ? q.likes - 1 : q.likes + 1 };
      }
      return q;
    }));
    // 待后端对接：axios.post(`/api/questions/${questionId}/like`)
  };

  // [API]: 提交评论
  const handlePostComment = () => {
    if (!commentText.trim() || !selectedQuestion) return;

    const newComment = {
      id: Date.now(),
      author: '我(当前用户)',
      avatar: '我',
      content: commentText,
      time: '刚刚'
    };

    // 模拟更新评论列表
    setCurrentComments([newComment, ...currentComments]);
    setCommentText('');
    // 待后端对接：axios.post(`/api/questions/${selectedQuestion.id}/comments`, { content: commentText })
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
            {/* 小红点 */}
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
            <span className="text-sm text-wysa-green/60">左右滑动体验 3D 视觉</span>
          </div>

          {/* 修改：使用 CircularGallery 替换原先的 flex 容器。
            注意：为了展示特效，外层必须给定一个明确的高度和宽度。
          */}
          <div className="w-full h-[500px] pointer-events-auto bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-white/50 overflow-hidden relative shadow-sm hover:shadow-md transition-shadow">
            <CircularGallery
              items={MOCK_ARTICLES.map((article, i) => ({
                // 建议使用 3:4 或者 2:3 的长方形比例图片
                image: `https://picsum.photos/seed/${i + 15}/600/800`,
                text: article.title
              }))}
              bend={3}           // 控制圆盘弯曲度
              textColor="#4D664D" // 文字颜色
              borderRadius={0.05} // 卡片圆角
              scrollSpeed={2.5}   // 滚动速度
            />

            {/* 补充说明：因为 WebGL 无法渲染摘要、作者和日期，如果想保留这些信息，
                一种折中的方案是在画板外层或者上方悬浮展示，但这需要额外的状态联动计算。*/}
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

                {/* 提问框 */}
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

                {/* 随机问题列表 */}
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

                      {/* 互动数据栏 */}
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
                    {/* 直接复用 DATABASE_QUESTIONS 中的数据来模拟热榜 */}
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
                <div key={fb.id} className="pointer-events-auto bg-wysa-green rounded-3xl p-6 shadow-lg text-white relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="relative z-10">
                    <p className="text-white/90 italic mb-6 leading-relaxed">
                      "{fb.quote}"
                    </p>
                    {/* 修改：专家信息区域调整，添加圆形头像框 */}
                    <div className="flex items-center gap-4">
                      {/* 新增圆形头像框 */}
                      <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center font-bold text-3xl shrink-0 overflow-hidden">
                        {fb.name[0]} {/* 模拟头像内容 */}
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
           <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
             <span className="text-sm font-bold text-wysa-green bg-wysa-green/10 px-3 py-1 rounded-full">站内专栏</span>
             <button onClick={() => setSelectedArticle(null)} className="text-gray-400 hover:text-wysa-green bg-gray-50 hover:bg-wysa-green/10 rounded-full p-2 transition-colors">✕</button>
           </div>
           <div className="p-8 overflow-y-auto">
             <h2 className="text-3xl font-black text-wysa-green mb-4">{selectedArticle.title}</h2>
             <div className="flex gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
               <span>作者：{selectedArticle.author}</span>
               <span>发布于：{selectedArticle.date}</span>
             </div>
             <div className="prose prose-pink max-w-none text-wysa-green/80 leading-loose">
               <p>{selectedArticle.content}</p>
             </div>
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