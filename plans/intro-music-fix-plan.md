# Intro 页面音乐播放修复计划

## 问题描述

[`Intro.jsx`](../src/pages/Intro.jsx) 页面在第 **131-138** 行通过 `useEffect` 在组件挂载时立即调用 `audio.play()` 播放背景音乐，但由于**浏览器自动播放策略（Autoplay Policy）**，用户未与页面交互前，浏览器会阻止音频播放，导致音乐无声。

## 根因分析

- 现代浏览器（Chrome 87+、Edge、Safari 等）要求 `AudioContext` 或 `HTMLAudioElement.play()` 必须在用户手势（click、touch、keydown）之后才能播放。
- 当前代码在组件挂载时立即执行 `audio.play()`，此时尚无用户交互，因此播放被静默拒绝（`.catch(() => {})` 捕获了错误但不做处理）。

## 修复方案

### 方案：用户点击 ENTER 按钮时触发音乐播放

将音乐初始化从组件挂载的 `useEffect` 中移除，改为在用户点击 **ENTER** 按钮时触发。

#### 具体修改

| 位置 | 当前代码 | 修改后 |
|------|---------|--------|
| 第 131-138 行 `useEffect` | 组件挂载时自动创建并播放音频 | 移除自动播放逻辑，仅保留 `audioRef` 声明 |
| 第 140-142 行 `handleEnter` | 仅切换 `stage` 到 `'ripple'` | 同时创建并播放音频 |
| 组件卸载清理 | 在 `useEffect` 返回的清理函数中暂停音频 | 改为在 `handleEnter` 中管理音频生命周期，或使用单独的 `useEffect` 监听 `audioRef` 变化来做清理 |

#### 详细代码变更

**1. 移除自动播放的 `useEffect`（第 131-138 行）**

删除以下代码块：
```jsx
useEffect(() => {
    const audio = new Audio('/M500003lTIFm4NKdSk.mp3');
    audio.loop = true;
    audio.volume = 0.25;
    audio.play().catch(() => {});
    audioRef.current = audio;
    return () => { audio.pause(); audioRef.current = null; };
}, []);
```

**2. 修改 `handleEnter` 函数**

```jsx
const handleEnter = () => {
    // 用户交互后播放音乐，符合浏览器 autoplay policy
    const audio = new Audio('/M500003lTIFm4NKdSk.mp3');
    audio.loop = true;
    audio.volume = 0.25;
    audio.play().catch(() => {});
    audioRef.current = audio;
    
    setStage('ripple');
};
```

**3. 添加组件卸载时的清理 `useEffect`**

```jsx
useEffect(() => {
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
}, []);
```

### 预期效果

1. 页面首次加载时，Unicorn 动画正常显示，**没有音乐**（符合浏览器策略）。
2. 用户点击 **ENTER** 按钮后，音乐开始播放，同时切换到水波纹标语阶段。
3. 音乐持续循环播放，贯穿 `ripple` 和 `work` 阶段。
4. 用户离开 Intro 页面时，音乐自动停止并清理资源。

## 影响范围

- 仅修改 [`src/pages/Intro.jsx`](../src/pages/Intro.jsx) 一个文件
- 不影响其他页面或组件
- 不影响音频文件（`public/M500003lTIFm4NKdSk.mp3` 已存在）

## 验证方式

1. 在 Chrome 或 Edge 中打开 Intro 页面
2. 确认页面加载时没有音乐播放
3. 点击 **ENTER** 按钮
4. 确认音乐开始播放
5. 导航到其他页面
6. 确认音乐停止
