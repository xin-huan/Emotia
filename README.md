# web

### 第一步：拉取代码
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
