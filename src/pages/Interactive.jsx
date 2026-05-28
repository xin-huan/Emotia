import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ClickSpark from '../components/ClickSpark';
import Balatro from '../components/Balatro';
import CircularGallery from '../components/CircularGallery';


// 补齐的 6 篇带 HTML 真实排版格式的文章
const MOCK_ARTICLES = [
  {
    id: 1,
    image: '/屏幕截图 2026-05-25 110948.png',
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
    image: '/屏幕截图 2026-05-25 111354.png',
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
    image: '/屏幕截图 2026-05-25 111536.png',
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
    image: '/屏幕截图 2026-05-25 112029.png',
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
    image: '/屏幕截图 2026-05-25 112116.png',
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
    image: '/屏幕截图 2026-05-25 112741.png',
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
  { id: 1, name: 'Dr. Sarah', title: '临床心理学家', avatar: '/M.jpeg', quote: '这个平台通过极具创意的互动方式，打破了传统心理宣泄的壁垒，让情绪的流动变得具象化。' },
  { id: 2, name: '李明哲', title: '资深心理咨询师', avatar: '/N.jpg', quote: '球体的碰撞非常解压，这种结合了物理反馈的视觉疗法，对缓解轻度焦虑有显著效果。' },
  { id: 3, name: 'Prof. Anderson', title: '行为科学研究员', avatar: '/I.jpg', quote: '社区氛围极其温暖。用户在互动中既能保持匿名安全感，又能感受到连接的真实感。' },
  { id: 4, name: '周保身', title: '婚姻家庭咨询师', avatar: '/K.jpg', quote: '系统界面温柔又沉稳，用户在互动中更容易进入情绪探索状态。' },
  { id: 5, name: '李龙馥', title: '青少年成长顾问', avatar: '/L.png', quote: '界面设计亲切，让用户在寻求帮助时感觉更自然、更愿意表达自己。' },
  { id: 6, name: '张凌赫', title: '心理健康督导师', avatar: '/Q.png', quote: '粉色基调与温暖光效结合，让整个互动页面更有治愈感。粉色基调与温暖光效结合，让整个互动页面更有治愈感。' },
];

// 猜你想问 FAQ 数据
const FAQ_DATA = [
  {
    id: 1,
    q: '如何使用 Emotia 进行第一次心理咨询？',
    a: '点击导航栏的「Agent互动」，选择一杯喜欢的饮品，系统会为你冲泡一杯虚拟饮品并自动进入对话。你可以像和朋友聊天一样，向 AI 倾诉你的困扰，Agent 会在对话中运用 CBT 技术帮你梳理情绪。'
  },
  {
    id: 2,
    q: '我的聊天记录会被保存或泄露吗？',
    a: '绝对不会。Emotia 采用严格的匿名机制，你无需提供真实姓名。所有对话记录仅保存在你自己的账户下，你可以随时在「个人空间」中查看或删除历史会话。'
  },
  {
    id: 3,
    q: '心理测评的结果准确吗？我能信吗？',
    a: '所有测评量表均来自国际通用的心理学标准量表（如 PHQ-9、GAD-7 等），数据仅供参考和自我觉察，不能替代专业诊断。如果结果显示中度及以上风险，建议预约我们的专家进行进一步评估。'
  },
  {
    id: 4,
    q: '如何在社区发布问题或回复他人？',
    a: '在「互动论坛」页面，点击 coral 色的 + 圆形按钮即可发布新问题。点击任意问题卡片可进入详情页查看和发表回复。你的每一次发言都是匿名的。'
  },
  {
    id: 5,
    q: '阳光储蓄罐是什么？怎么使用？',
    a: '阳光储蓄罐是 Emotia 的积极心理学工具。在「活动打卡」页面，记录下每天发生的一件好事（哪怕是一杯好喝的奶茶），系统会帮你收集这些"阳光"，日积月累形成你的正向记忆库。'
  },
  {
    id: 6,
    q: 'Emotia 是免费的吗？',
    a: 'Emotia 的基础功能（AI 对话、心理测评、社区互动、阳光储蓄罐）完全免费开放。部分专家一对一咨询为付费服务，具体价格可在预约时查看。我们的使命是让每个人都能负担得起优质的心理健康服务。'
  },
  {
    id: 7,
    q: 'CBT 疗法适合我吗？有没有副作用？',
    a: 'CBT（认知行为疗法）适用于大多数轻至中度情绪困扰的人群，包括焦虑、抑郁、压力管理等。它不像药物有生理副作用，但过程中可能需要你直面一些不舒服的想法——这正是改变的开始。如果症状严重，建议结合专业医师指导。'
  },
  {
    id: 8,
    q: '我可以删除我的账号和数据吗？',
    a: '当然可以。在「个人空间」页面，你可以随时删除单条对话记录、测评历史或阳光日记。如需彻底注销账号，请联系客服 hello@emotia.com，我们会在 48 小时内清除你的所有数据。'
  },
];

const Interactive = () => {
  const [searchParams] = useSearchParams();

  // ==========================================
  // 2. 状态管理
  // ==========================================
  const [latestQuestions, setLatestQuestions] = useState([]); // 最新问题
  const [hotQuestions, setHotQuestions] = useState([]);       // 讨论热榜
  const [myLikedIds, setMyLikedIds] = useState(new Set()); // 存储当前用户点赞过的帖子ID

  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const [questionText, setQuestionText] = useState('');
  const [randomQuestions, setRandomQuestions] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [currentComments, setCurrentComments] = useState([]);

  const [hasNewMessage, setHasNewMessage] = useState(true);
  const [postSuccess, setPostSuccess] = useState('');
  const [showToast, setShowToast] = useState(false);

  // 预约咨询
  const [bookingExpert, setBookingExpert] = useState(null);
  const [bookingForm, setBookingForm] = useState({ name: '', email: '', phone: '', date: '', time: '', message: '' });

  // 发布问题弹窗
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishText, setPublishText] = useState('');

  // 猜你想问
  const [openFaqId, setOpenFaqId] = useState(null);


  // ==========================================
  // 3. API 请求函数
  // ==========================================

  // const fetchRandomQuestions = () => {
  //   setIsRefreshing(true);
  //   setTimeout(() => {
  //     const shuffled = [...DATABASE_QUESTIONS].sort(() => 0.5 - Math.random());
  //     setRandomQuestions(shuffled.slice(0, 2));
  //     setIsRefreshing(false);
  //   }, 600);
  // };
const formatData = (rawList, likedIds = []) => {
    if (!Array.isArray(rawList)) return [];

    return rawList.map(q => {
      // 1. 获取后端算好的热度，如果没有则前端兜底算一下
      const likes = q.forum_likes?.[0]?.count || 0;
      const answers = q.forum_answers?.[0]?.count || 0;
      const baseScore = q.hot_score || (likes + answers);
      
      return {
        id: q.id,
        author: q.profiles?.username || "神秘用户",
        avatar: (q.profiles?.username || "匿")[0],
        content: q.content,
        likes: likes,
        commentsCount: answers,
        // 🚀 统一热度值（放大10倍展示）
        hotScore: baseScore * 10, 
        isLiked: likedIds.includes(q.id) 
      };
    });
  };

  // 🚀 获取所有论坛数据 (最新5条 + 热榜10条)
  const fetchAllForumData = async () => {
    const userId = localStorage.getItem('user_id');

    setIsRefreshing(true);
    try {
      // 🚀 同时请求最新(3条)和热榜(10条)
      const [resLatest, resHot] = await Promise.all([
        fetch(`http://localhost:8000/api/forum/posts?sort=latest&limit=6&viewer_id=${userId}`),
        fetch(`http://localhost:8000/api/forum/posts?sort=hot&limit=10&viewer_id=${userId}`)
      ]);

      const [jsonLatest, jsonHot] = await Promise.all([resLatest.json(), resHot.json()]);
      // 🚀 核心：同步后端的点赞记录到前端内存
      // 假设 data1 和 data2 返回的 liked_post_ids 是一样的
      if (jsonLatest.liked_post_ids) {
        setMyLikedIds(new Set(jsonLatest.liked_post_ids));
      }
      
      // 使用各自返回的 liked_post_ids 进行格式化
      setLatestQuestions(formatData(jsonLatest.posts, jsonLatest.liked_post_ids));
      setHotQuestions(formatData(jsonHot.posts, jsonHot.liked_post_ids));

    } catch (error) {
      console.error("初始化加载失败", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 🚀 “换一批”逻辑：从后端随机获取 5 条
  const handleRefreshLatest = async () => {
    const userId = localStorage.getItem('user_id');
    setIsRefreshing(true);
    try {
      const res = await fetch('http://localhost:8000/api/forum/posts?sort=random&limit=6');
      const data = await res.json();

      if (data.posts) {
        const formatted = formatData(data.posts, data.liked_post_ids);
        setLatestQuestions(formatted);
      }
      
    } catch (error) {
      console.error("换一批失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 页面初始加载
  useEffect(() => {
    fetchAllForumData();
  }, []);

  // 从Home页热门讨论跳转过来的：打开对应帖子详情
  useEffect(() => {
    const postId = searchParams.get('postId');
    if (postId) {
      const allPosts = [...latestQuestions, ...hotQuestions];
      const targetPost = allPosts.find(p => p.id === Number(postId));
      if (targetPost) {
        setSelectedQuestion(targetPost);
      } else {
        // 如果在列表中找不到，直接从API请求
        fetch(`http://localhost:8000/api/forum/posts/${postId}`)
          .then(res => res.json())
          .then(data => {
            if (data) {
              setSelectedQuestion({
                id: data.id,
                author: data.profiles?.username || "神秘用户",
                avatar: (data.profiles?.username || "匿")[0],
                content: data.content,
                likes: data.forum_likes?.[0]?.count || 0,
                commentsCount: data.forum_answers?.[0]?.count || 0,
                hotScore: (data.hot_score || 0) * 10,
              });
            }
          })
          .catch(err => console.error('加载帖子失败', err));
      }
    }
  }, [latestQuestions, hotQuestions, searchParams]);

  // 🚀 详情加载：点击问题时加载评论
  useEffect(() => {
    if (selectedQuestion) {
      fetch(`http://localhost:8000/api/forum/posts/${selectedQuestion.id}`)
        .then(res => res.json())
        .then(data => {
            setCurrentComments(formatData(data.answers || []));
        });
    }
  }, [selectedQuestion]);

  // 🚀 发布问题
  const handlePostQuestion = async (textOverride) => {
    const text = (textOverride || questionText).trim();
    if (!text) return;
    const userId = localStorage.getItem('user_id');
    if (!userId) return alert("请先登录");

    const res = await fetch('http://localhost:8000/api/forum/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        category_id: 1,
        title: text.substring(0, 15),
        content: text
      })
    });
    if(res.ok) {
        setQuestionText('');
        setPostSuccess('发布成功，已发布到社区');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2400);
        fetchAllForumData(); // 发布后立即刷新全站数据
    }
  };

  // 🚀 点赞（共鸣）逻辑
  const handleToggleLike = async (e, questionId) => {
    e.stopPropagation();
    const userId = localStorage.getItem('user_id');
    if (!userId) return alert("请先登录");

    // 🚀 1. 乐观更新：立刻修改本地 UI 状态
    // 我们在两个列表中查找这个帖子，并手动修改它的点赞状态和数字
    const updateLocalList = (list) => 
      list.map(q => {
        if (q.id === questionId) {
          const isNowLiked = !q.isLiked;
          return { 
            ...q, 
            isLiked: isNowLiked, 
            likes: isNowLiked ? q.likes + 1 : Math.max(0, q.likes - 1) 
          };
        }
        return q;
      });

    setLatestQuestions(prev => updateLocalList(prev));
    setHotQuestions(prev => updateLocalList(prev));

    // 🚀 2. 静默发送请求：在后台告诉后端
    try {
      const res = await fetch('http://localhost:8000/api/forum/like/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, post_id: questionId })
      });
      
      if (!res.ok) {
        // 如果后端报错，这里可以回滚（为了大作业简化，通常不写也没关系）
        console.error("点赞同步失败");
      }
    } catch (error) {
      console.error("网络异常");
    }
    // 💡 注意：这里不再调用 fetchAllForumData()，因为 UI 已经更新过了
  };

  // 🚀 发布评论（回复）
  const handlePostComment = async () => {
    if (!commentText.trim() || !selectedQuestion) return;
    const userId = localStorage.getItem('user_id');
    if (!userId) return alert("请先登录");

    const res = await fetch('http://localhost:8000/api/forum/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: selectedQuestion.id,
        user_id: userId,
        content: commentText
      })
    });
    if(res.ok) {
        setCommentText('');
        // 刷新列表（为了让列表页的评论数更新）
        fetchAllForumData();
        // 刷新当前弹窗（为了看到刚发的评论）
        setSelectedQuestion({...selectedQuestion}); 
    }
  };

  return (
    <ClickSpark sparkColor="#ffffff">
      <div className="relative min-h-screen overflow-hidden bg-transparent">
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <Balatro
            spinRotation={-1.5}
            spinSpeed={5.0}
            offset={[0.0, 0.0]}
            color1="#F4E4D1"
            color2="#E58889"
            color3="#D4A5A5"
            contrast={2.5}
            lighting={0.3}
            spinAmount={0.2}
            pixelFilter={800.0}
            spinEase={0.8}
            isRotate={true}
            mouseInteraction={true}
          />
        </div>

        {/* 2. 内容层 */}
      <div className="relative z-10 min-h-screen bg-transparent pt-24 px-6 md:px-12 lg:px-24 antialiased pointer-events-none overflow-y-auto">

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

        <div className="max-w-7xl mx-auto pt-8 pb-24">
          <h1 className="text-4xl md:text-5xl font-extrabold text-wysa-green mb-4 drop-shadow-sm">
            互动论坛
          </h1>
          

          {showToast && (
            <div className="fixed top-24 left-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-3xl border border-white/20 bg-white/90 p-4 text-center text-sm font-medium text-wysa-green shadow-2xl backdrop-blur-md pointer-events-auto">
              {postSuccess}
            </div>
          )}

        {/* ================= 模块一：最新文章 ================= */}
        <section data-aos="zoom-in-up" data-aos-duration="700" data-aos-once="false" data-aos-mirror="true" className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-wysa-green flex items-center gap-2">
              <span className="text-wysa-coral">✦</span> 最新文章
            </h2>
          </div>
          <div className="w-full h-[480px] pointer-events-auto relative -mt-15">
            <CircularGallery
              items={MOCK_ARTICLES.map((article) => ({
                image: article.image,
                text: article.title,
                originalData: article
              }))}
              onItemClick={(item) => {
                setSelectedArticle(item.originalData);
              }}
            />
          </div>
        </section>

          {/* ================= 模块 1.5：猜你想问 ================= */}
          <section data-aos="zoom-in-up" data-aos-duration="700" data-aos-once="false" data-aos-mirror="true" className="mb-16">
            <h2 className="text-2xl font-bold text-wysa-green flex items-center gap-2 mb-6">
              <span className="text-wysa-coral">✦</span> 猜你想问
            </h2>

          <div className="flex gap-8">
            {/* 左侧：图片 */}
            <div className="hidden md:block w-[35%] shrink-0">
              <div className="w-full aspect-[3/4] bg-wysa-pink/60 rounded-[40px] flex items-center justify-center overflow-hidden sticky top-28">
                <img src="/屏幕截图 2026-05-25 135935.png" alt="猜你想问" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* 右侧：问题竖排 */}
            <div className="flex-1 space-y-2.5">
              {FAQ_DATA.map((faq) => (
                <div
                  key={faq.id}
                  onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                  className={`pointer-events-auto bg-wysa-pink rounded-2xl p-4 border cursor-pointer transition-all duration-300 hover:shadow-md flex flex-col
                    ${openFaqId === faq.id ? 'border-wysa-coral shadow-lg ring-2 ring-wysa-coral/20' : 'border-gray-100 shadow-sm'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-wysa-green leading-snug">
                      {faq.q}
                    </p>
                    <span className={`shrink-0 text-wysa-coral transition-transform duration-300 text-lg ${openFaqId === faq.id ? 'rotate-45' : ''}`}>
                      +
                    </span>
                  </div>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openFaqId === faq.id ? 'grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-gray-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm text-wysa-green/70 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </section>

          {/* ================= 模块二：社区问答 ================= */}
          <section data-aos="zoom-in-up" data-aos-duration="700" data-aos-once="false" data-aos-mirror="true" data-aos-delay="100" className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-wysa-green flex items-center gap-2">
                <span className="text-wysa-coral">✦</span> 社区问答
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefreshLatest}
                  disabled={isRefreshing}
                  className="pointer-events-auto text-sm text-wysa-coral hover:text-wysa-green flex items-center gap-1 transition-colors"
                >
                  <span className={isRefreshing ? "animate-spin" : ""}>↻</span> 换一批
                </button>
              </div>
            </div>

            {/* 问题卡片网格 + 发布按钮 */}
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {latestQuestions.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestion(q)}
                    className="pointer-events-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
                  >
                    {/* 卡片封面 = 标题 */}
                    <div className="bg-wysa-coral/20 px-5 py-4 border-b border-wysa-coral/10">
                      <p className="text-wysa-green font-bold text-sm leading-snug line-clamp-2 group-hover:text-wysa-coral transition-colors">
                        {q.content}
                      </p>
                    </div>
                    {/* 卡片底部信息 */}
                    <div className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-wysa-coral text-white flex items-center justify-center text-xs font-bold">{q.avatar}</div>
                        <span className="text-xs font-medium text-wysa-green/60">{q.author}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <button
                          onClick={(e) => handleToggleLike(e, q.id)}
                          className={`flex items-center gap-1 transition-colors ${q.isLiked ? 'text-red-500' : 'text-wysa-green/50 hover:text-red-400'}`}
                        >
                          {q.isLiked ? '❤️' : '♡'} {q.likes || ''}
                        </button>
                        <span className="text-wysa-green/50">💬 {q.commentsCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* coral + 圆圈发布按钮 */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => { setPublishText(''); setShowPublishModal(true); }}
                  className="pointer-events-auto w-14 h-14 bg-wysa-green hover:bg-wysa-coral rounded-full flex items-center justify-center text-white text-3xl font-light shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                  title="发布新问题"
                >
                  +
                </button>
              </div>
            </div>

            {/* 讨论热榜 - 微博热搜风格 */}
            <div className="mt-10 pointer-events-auto bg-wysa-pink rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <span className="text-lg font-extrabold text-wysa-coral">🔥</span>
                <h3 className="text-lg font-extrabold text-wysa-green">讨论热榜</h3>
                <span className="text-[10px] text-gray-400 ml-auto">实时更新</span>
              </div>
              <div className="space-y-0">
                {hotQuestions.map((topic, index) => (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedQuestion(topic)}
                    className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-xl hover:bg-wysa-pink/30 cursor-pointer transition-colors group"
                  >
                    <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white
                      ${index === 0 ? 'bg-wysa-coral' :
                        index === 1 ? 'bg-wysa-coral/80' :
                        index === 2 ? 'bg-wysa-coral/60' :
                        index === 3 ? 'bg-wysa-coral/45' :
                        index === 4 ? 'bg-wysa-coral/35' :
                        'bg-wysa-coral/20'}`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-wysa-green font-medium truncate group-hover:text-wysa-coral transition-colors">
                        {topic.content}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-gray-400">
                      {topic.hotScore > 100 ? (
                        <span className="text-red-500 bg-red-50 px-1.5 py-0.5 rounded">爆</span>
                      ) : topic.hotScore > 50 ? (
                        <span className="text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">热</span>
                      ) : (
                        <span className="text-gray-400">{topic.hotScore} 热度</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ================= 模块三：专业反馈总结 ================= */}
          <section data-aos="zoom-in-up" data-aos-duration="700" data-aos-once="false" data-aos-mirror="true" data-aos-delay="200">
            <h2 className="text-2xl font-bold text-wysa-green mb-6 flex items-center gap-2">
              <span className="text-wysa-coral">✦</span> 专家评价与咨询
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEEDBACKS.map((fb) => (
                <div key={fb.id} className="pointer-events-auto bg-white rounded-[2rem] border border-wysa-green/10 shadow-xl overflow-hidden">
                  <div className="relative h-28 bg-gradient-to-r from-wysa-coral/20 via-wysa-green/10 to-wysa-green/20">
                    <div className="absolute left-1/2 -bottom-12 w-24 h-24 rounded-full border-4 border-white bg-slate-100 shadow-xl transform -translate-x-1/2 overflow-hidden">
                      <img
                        src={fb.avatar}
                        alt={fb.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="pt-16 px-6 pb-6 text-center">
                    <h4 className="text-lg font-bold text-wysa-green mb-1">{fb.name}</h4>
                    <p className="text-sm text-wysa-green/70 mb-4">{fb.title}</p>
                    <p className="text-sm text-gray-600 leading-7 mb-6">“{fb.quote}”</p>
                    <button
                      type="button"
                      className="w-full rounded-full bg-wysa-coral py-3 text-white font-semibold transition hover:bg-wysa-green"
                      onClick={() => { setBookingExpert(fb); setBookingForm({ name: '', email: '', phone: '', date: '', time: '', message: '' }); }}
                    >
                      预约咨询
                    </button>
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
    </div>

      {/* ================= 弹窗：发布问题 ================= */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
          <div className="absolute inset-0 bg-wysa-green/40 backdrop-blur-sm" onClick={() => setShowPublishModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-wysa-green flex items-center gap-2">
                <span className="text-wysa-coral">✦</span> 说出你的心声
              </h3>
              <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-wysa-green bg-gray-50 hover:bg-wysa-green/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">在这里，每一次倾诉都会被温柔对待 🤲</p>
              <textarea
                value={publishText}
                onChange={(e) => setPublishText(e.target.value)}
                placeholder="此刻你在想什么？提出你的困惑..."
                className="w-full bg-wysa-pink/50 rounded-2xl p-5 text-wysa-green placeholder-wysa-green/40 outline-none focus:ring-2 focus:ring-wysa-coral/30 resize-none text-sm min-h-[140px] transition-all"
              />
              <div className="flex justify-end mt-4 gap-3">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-5 py-2.5 rounded-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (!publishText.trim()) return;
                    handlePostQuestion(publishText);
                    setPublishText('');
                    setShowPublishModal(false);
                  }}
                  disabled={!publishText.trim()}
                  className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${
                    publishText.trim()
                      ? 'bg-wysa-coral text-white hover:bg-wysa-green'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  发布问题
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 弹窗：预约咨询表单 ================= */}
      {bookingExpert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
          <div className="absolute inset-0 bg-wysa-green/40 backdrop-blur-sm" onClick={() => setBookingExpert(null)} />
          <div className="relative bg-white w-full max-w-lg max-h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <span className="text-sm font-bold text-wysa-green bg-wysa-green/10 px-3 py-1 rounded-full">预约咨询</span>
              </div>
              <button onClick={() => setBookingExpert(null)} className="text-gray-400 hover:text-wysa-green bg-gray-50 hover:bg-wysa-green/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <img src={bookingExpert.avatar} alt={bookingExpert.name} className="w-16 h-16 rounded-full object-cover border-2 border-wysa-coral/30" />
                <div>
                  <h3 className="text-lg font-bold text-wysa-green">{bookingExpert.name}</h3>
                  <p className="text-sm text-gray-500">{bookingExpert.title}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1.5">姓名</label>
                  <input type="text" value={bookingForm.name} onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})} placeholder="您的真实姓名" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-wysa-coral focus:ring-2 focus:ring-wysa-coral/10 text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1.5">邮箱</label>
                  <input type="email" value={bookingForm.email} onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})} placeholder="hello@example.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-wysa-coral focus:ring-2 focus:ring-wysa-coral/10 text-sm transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1.5">手机号</label>
                  <input type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})} placeholder="方便我们与您联系" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-wysa-coral focus:ring-2 focus:ring-wysa-coral/10 text-sm transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1.5">期望日期</label>
                    <input type="date" value={bookingForm.date} onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-wysa-coral focus:ring-2 focus:ring-wysa-coral/10 text-sm transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1.5">期望时间</label>
                    <select value={bookingForm.time} onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-wysa-coral focus:ring-2 focus:ring-wysa-coral/10 text-sm transition-all bg-white">
                      <option value="">请选择</option>
                      <option value="09:00">09:00 - 10:00</option>
                      <option value="10:00">10:00 - 11:00</option>
                      <option value="11:00">11:00 - 12:00</option>
                      <option value="14:00">14:00 - 15:00</option>
                      <option value="15:00">15:00 - 16:00</option>
                      <option value="16:00">16:00 - 17:00</option>
                      <option value="19:00">19:00 - 20:00</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1.5">咨询简述</label>
                  <textarea value={bookingForm.message} onChange={(e) => setBookingForm({...bookingForm, message: e.target.value})} placeholder="请简要描述您希望咨询的方向或困扰..." rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-wysa-coral focus:ring-2 focus:ring-wysa-coral/10 text-sm transition-all resize-none" />
                </div>
                <button
                  onClick={() => { alert(`已成功预约 ${bookingExpert.name}！\n我们会在 24 小时内通过您留下的联系方式与您确认具体时间。`); setBookingExpert(null); }}
                  className="w-full py-3.5 rounded-full bg-wysa-coral text-white font-bold text-lg hover:bg-wysa-green transition-all shadow-lg hover:shadow-xl"
                >
                  确认预约
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </ClickSpark>
  );
};

export default Interactive;