# 后端

### 第一步：先把.env文件里的密钥切换了
把发在群里的那两行 Supabase URL 和 Key 粘贴进去。

### 第二步：启动后端
cd到backend目录，在 backend 目录下运行：
uvicorn app.main:app --reload
(看到“ML模型加载完毕”就说明后台大脑开了)
如果报错一般是缺少agent需要的库，全安装就好了


### 第三步：启动前端并对接
在你的代码里，把所有 API 请求地址指向你的本机http://localhost:8000
（这样可以不涉及前后端分开通信的问题）

在你自己的前端目录运行前端启动命令
