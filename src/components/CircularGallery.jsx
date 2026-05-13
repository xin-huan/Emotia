import React, { useRef, useState, useEffect } from 'react';

export default function CircularGallery({ items, onItemClick }) {
  const containerRef = useRef(null);
  const cardsRef = useRef([]);

  // 使用 JS 虚拟偏移量，而非原生 scrollLeft
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentOffset = useRef(0); // 当前视觉偏移
  const targetOffset = useRef(0);  // 目标缓冲偏移 (用于顺滑动画)
  const dragDistance = useRef(0);

  useEffect(() => {
    let rafId;

    // 卡片尺寸配置
    const cardWidth = 260; // 卡片宽度
    const gap = 40;        // 卡片间距
    const spacing = cardWidth + gap;
    const totalItems = items.length;
    const totalWidth = totalItems * spacing;

    const updateCards = () => {
      if (!containerRef.current) return;

      // 顺滑跟随 (Lerp 缓动算法)
      currentOffset.current += (targetOffset.current - currentOffset.current) * 0.1;

      const container = containerRef.current;
      const center = container.clientWidth / 2;

      cardsRef.current.forEach((card, i) => {
        if (!card) return;

        // 1. 获取卡片当前在无限轨道上的原始位置
        const rawPos = i * spacing + currentOffset.current;
        const rawDist = rawPos - center;

        // 2. 核心数学：将其折叠到屏幕范围，实现首尾相接无限循环！
        const halfW = totalWidth / 2;
        const wrappedDist = ((rawDist + halfW) % totalWidth + totalWidth) % totalWidth - halfW;

        // 3. 计算它在容器中的绝对 X 坐标
        const x = center + wrappedDist;

        // 4. 根据距离中心的偏移量，计算拱桥的各种参数
        const translateY = Math.pow(wrappedDist, 2) * 0.0012; // 抛物线下拉
        const rotateZ = wrappedDist * 0.035;                  // 向两侧倾斜
        const scale = Math.max(1 - Math.abs(wrappedDist) * 0.0006, 0.75); // 距离越远越小
        const zIndex = Math.round(100 - Math.abs(wrappedDist)); // 中间的层级最高

        // 5. 当卡片绕到背后（边缘）时，渐渐消失，防止生硬闪烁
        let opacity = 1;
        const fadeDist = halfW * 0.75; // 距离边缘多远开始透明
        if (Math.abs(wrappedDist) > fadeDist) {
           opacity = Math.max(0, 1 - (Math.abs(wrappedDist) - fadeDist) / (halfW - fadeDist));
        }

        // 应用 Transform，开启 3D 硬件加速
        card.style.transform = `translate3d(${x - cardWidth / 2}px, ${translateY}px, 0) rotateZ(${rotateZ}deg) scale(${scale})`;
        card.style.zIndex = zIndex;
        card.style.opacity = opacity;
      });

      rafId = requestAnimationFrame(updateCards);
    };

    rafId = requestAnimationFrame(updateCards);
    return () => cancelAnimationFrame(rafId);
  }, [items.length]);

  // === 统一处理鼠标与触摸事件 ===
  const onPointerDown = (e) => {
    isDragging.current = true;
    dragDistance.current = 0;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    startX.current = clientX;
    // 停止惯性，抓住卡片
    targetOffset.current = currentOffset.current;
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = clientX - startX.current;
    startX.current = clientX;

    targetOffset.current += delta * 1.5; // 滑动灵敏度
    dragDistance.current += Math.abs(delta);
  };

  const onPointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      // overflow-hidden 彻底切断原生滚动条，touch-pan-y 允许在这个区域竖向滑动页面而不卡手
      className="relative w-full h-full overflow-hidden select-none touch-pan-y cursor-grab active:cursor-grabbing"
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    >
      {items.map((item, index) => (
        <div
          key={index}
          ref={(el) => (cardsRef.current[index] = el)}
          // 卡片使用绝对定位，由 JS 实时赋予位置
          className="absolute top-10 left-0 w-[260px] h-[360px] rounded-[2rem] bg-white shadow-xl overflow-hidden flex flex-col border-4 border-white/90 transform-origin-bottom will-change-transform"
          style={{ transformOrigin: 'center 80%' }}
          onClick={() => {
            // 防误触：如果滑动距离过大，认为是滑动而非点击
            if (dragDistance.current > 10) return;
            if (onItemClick) onItemClick(item);
          }}
        >
          <div className="flex-1 w-full bg-gray-50 overflow-hidden pointer-events-none">
            <img
              src={item.image}
              alt={item.text}
              className="w-full h-full object-cover"
              loading="lazy"
              draggable={false}
            />
          </div>
          <div className="h-20 bg-white flex items-center justify-center px-4 pointer-events-none">
            <h3 className="text-[#4D664D] font-bold text-center line-clamp-2 text-base">
              {item.text}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
}