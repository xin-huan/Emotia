# web
置顶一下方便我修改前端（海鲜独断专行ing）
```python
npm run dev
```
```python
cd backend
uvicorn app.main:app --reload
```
### 第一步：拉取代码
建立一个新的文件夹
```python
git clone https://github.com/xin-huan/web.git
```

### 第二步：修改代码添加功能
1.在本地创建一个自己的分支并切换过去，示例：：
```python
git checkout -b feature-A
```

2.提交代码：
在 feature-A 分支上写完代码，，最后一步推送到自己的那个分支：
```python
git add .
git commit -m "成员A完成了某某功能"
git push -u origin feature-A
```
3.确定没问题后，仓库所有者点击Merge pull request合并到主分支

### 第三步：拉取最新主分支
1.切换回本地主分支
```python
git checkout main
```
2。告诉 Git，把远程仓库（origin）的 main 分支上最新的代码拉取下来，并合并到你当前的本地分支
```python
git pull origin main
```

# 后端

### 第一步：补充文件
把发在群里的那两行 Supabase URL 和 Key 粘贴到.env里。
把熏鱼的模型文件（roberta_cbt_scorer_best文件夹）放到backend目录下

### 第二步：启动后端
cd到backend目录，在 backend 目录下运行：
```python
uvicorn app.main:app --reload
```
(看到“ML模型加载完毕”就说明后台大脑开了)
如果报错一般是缺少agent需要的库，全安装就好了


### 第三步：启动前端并对接
在你的代码里，把所有 API 请求地址指向你的本机http://localhost:8000
（这样可以不涉及前后端分开通信的问题）

在你自己的前端目录运行前端启动命令

### 一些接口格式注意
不管你用什么日历插件，请在提交时把日期格式化为 2005-02-01 这种样子的字符串传给后端。

# agent
roberta_cbt_scorer_best文件夹要保持位于agent.py同一目录下。

# 前端 

下载版本：node-v24.14.1
在目录下运行
```python
npm run dev
```
4.21 环境补充：
```python
npm install react-router-dom
```