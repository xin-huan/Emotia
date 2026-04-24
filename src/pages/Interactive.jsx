import React, { useState } from 'react';
import ClickSpark from '../ClickSpark';
import Ballpit from '../Ballpit';

// 模拟数据
const MOCK_ARTICLES = Array(6).fill(null).map((_, i) => ({
  id: i,
  title: `探索心灵的秘密：第 ${i + 1} 篇专业指南`,
  excerpt: '在这里，我们将深入探讨情绪管理的科学方法，帮助你建立内在的平静与力量...',
  author: '心理学专家',
  date: `2023-10-0${i + 1}`,
  content: `这是第 ${i + 1} 篇文章的完整内容。在本项目内打开，不发生外部跳转。这里会有很多详细的心理学和健康相关的指导建议...`
}));

const HOT_TOPICS = [
  { id: 1, title: '如何快速缓解睡前焦虑？', heat: '9.8k' },
  { id: 2, title: '大家平时都是怎么发泄压力的？', heat: '8.5k' },
  { id: 3, title: '分享一个超好用的正念冥想技巧', heat: '7.2k' },
  { id: 4, title: '拒绝内耗：如何停止过度思考', heat: '5.6k' },
  { id: 5, title: '寻找树洞：今天遇到了一些不开心的事', heat: '4.1k' },
];

const FEEDBACKS = [
  { id: 1, name: 'Dr. Sarah', title: '临床心理学家', quote: '这个平台通过极具创意的互动方式，打破了传统心理宣泄的壁垒，让情绪的流动变得具象化。' },
  { id: 2, name: '李明哲', title: '资深心理咨询师', quote: '球体的碰撞非常解压，这种结合了物理反馈的视觉疗法，对缓解轻度焦虑有显著效果。' },
  { id: 3, name: 'Prof. Anderson', title: '行为科学研究员', quote: '社区氛围极其温暖。用户在互动中既能保持匿名安全感，又能感受到连接的真实感。' },
];

const Interactive = () => {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [questionText, setQuestionText] = useState('');

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

        <div className="max-w-7xl mx-auto pb-24">
          <h1 className="text-4xl md:text-5xl font-extrabold text-wysa-green mb-4 drop-shadow-sm">
            互动论坛
          </h1>
          <p className="text-lg text-wysa-green/80 mb-12 max-w-2xl">
            在这里碰撞思想、释放情绪。点击球体感受物理反馈，点击卡片参与社区互动。
          </p>

          {/* ================= 模块一：最新文章 ================= */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-wysa-green mb-6 flex items-center gap-2">
              <span className="text-wysa-coral">✦</span> 最新文章
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_ARTICLES.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  // 关键：恢复鼠标事件，加入磨砂玻璃质感和悬浮动画
                  className="pointer-events-auto cursor-pointer group bg-white backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-sm hover:shadow-md hover:bg-white/60 hover:-translate-y-1 transition-all duration-300"
                >
                  <h3 className="text-xl font-bold text-wysa-green mb-2 group-hover:text-wysa-green transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-wysa-green/70 text-sm mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex justify-between items-center text-xs text-wysa-green/60 font-medium">
                    <span>{article.author}</span>
                    <span>{article.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ================= 模块二：社区问答 ================= */}
          <section className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* 左侧：问答流 & 提问框 */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-bold text-wysa-green flex items-center gap-2">
                  <span className="text-wysa-coral">✦</span> 社区问答
                </h2>

                {/* 提问框 */}
                <div className="pointer-events-auto bg-white/50 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-sm">
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="此刻你在想什么？提出你的困惑..."
                    className="w-full bg-white rounded-xl p-4 text-wysa-green placeholder-wysa-green/40 outline-none focus:ring-2 focus:ring-wysa-coral/50 resize-none transition-all"
                    rows={3}
                  />
                  <div className="flex justify-end mt-4">
                    <button className="bg-wysa-coral hover:bg-wysa-green text-white px-6 py-2 rounded-full font-bold transition-transform hover:scale-105 shadow-sm">
                      发布问题
                    </button>
                  </div>
                </div>

                {/* 别人的问题 (简易列表) */}
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="pointer-events-auto bg-white/40 backdrop-blur-sm rounded-2xl p-5 border border-white/30 hover:bg-white/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-wysa-coral text-white flex items-center justify-center text-xs font-bold">匿</div>
                        <span className="text-sm font-bold text-wysa-coral/80">匿名用户</span>
                      </div>
                      <p className="text-wysa-black font-normal">
                        {i === 1 ? '最近总是感觉很累，但其实什么都没做，这是正常的吗？' : '想问问大家，在职场上遇到PUA该怎么调解自己的心态？'}
                      </p>
                      <div className="flex gap-4 mt-3 text-sm text-wysa-black font-medium">
                        <span className="hover:text-wysa-coral/50">♥ 共鸣 (24)</span>
                        <span className="hover:text-wysa-green">💬 讨论 (12)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 右侧：热度排行榜 */}
              <div className="lg:col-span-1">
                <div className="pointer-events-auto bg-white/30 backdrop-blur-md rounded-3xl p-6 border border-white/50 h-full">
                  <h3 className="text-xl font-bold text-wysa-green mb-6 flex items-center gap-2">
                    🔥 讨论热榜
                  </h3>
                  <ul className="space-y-4">
                    {HOT_TOPICS.map((topic, index) => (
                      <li key={topic.id} className="flex items-start gap-3 group cursor-pointer">
                        <span className={`font-black text-lg ${index < 3 ? 'text-wysa-green' : 'text-wysa-coral'}`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-wysa-green font-medium group-hover:text-wysa-green transition-colors line-clamp-2">
                            {topic.title}
                          </p>
                          <span className="text-xs text-wysa-green/50">{topic.heat} 热度</span>
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
              <span className="text-wysa-green">✦</span> 专家寄语
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEEDBACKS.map((fb) => (
                <div key={fb.id} className="pointer-events-auto bg-wysa-green rounded-3xl p-6 shadow-lg text-white relative overflow-hidden group">
                  {/* 背景装饰 */}
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                  <div className="relative z-10">
                    <p className="text-white/90 italic mb-6 leading-relaxed">
                      "{fb.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                        {fb.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{fb.name}</h4>
                        <p className="text-xs text-white/60">{fb.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ================= 站内文章弹窗 Modal ================= */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-wysa-green/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedArticle(null)}
          ></div>

          {/* 弹窗内容 */}
          <div className="relative bg-wysa-green w-full max-w-3xl max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col transform transition-all">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <span className="text-sm font-bold text-wysa-green bg-wysa-green/10 px-3 py-1 rounded-full">
                站内专栏
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-gray-400 hover:text-wysa-green bg-gray-50 hover:bg-wysa-green/10 rounded-full p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              <h2 className="text-3xl font-black text-wysa-green mb-4">
                {selectedArticle.title}
              </h2>
              <div className="flex gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
                <span>作者：{selectedArticle.author}</span>
                <span>发布于：{selectedArticle.date}</span>
              </div>

              <div className="prose prose-pink max-w-none text-wysa-green/80 leading-loose">
                <p>{selectedArticle.content}</p>
                <p>（这里是站内文章展示区，用户不会跳出当前网站，保持沉浸式的体验。）</p>
                <br/><br/><br/><br/><br/>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClickSpark>
  );
};

export default Interactive;