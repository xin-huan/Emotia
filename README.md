# web

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
