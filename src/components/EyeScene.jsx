import React, { useRef, useEffect, useCallback } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

const BG = '#F9F0ED';

// 粒子
class Spark {
  constructor() {
    this.reset(true);
  }
  reset(init) {
    const angle = Math.random() * Math.PI * 2;
    const dist = init ? Math.random() * 1.5 : 0.3 + Math.random() * 1.3;
    this.x = 0.5 + Math.cos(angle) * dist * 0.35;
    this.y = 0.5 + Math.sin(angle) * dist * 0.3;
    this.size = 0.4 + Math.random() * 1.6;
    this.opacity = 0;
    this.targetOpacity = 0.2 + Math.random() * 0.6;
    this.fadeSpeed = 0.003 + Math.random() * 0.008;
    this.orbitSpeed = (Math.random() - 0.5) * 0.0008;
    this.orbitAngle = angle;
    this.orbitDist = dist;
  }
  update(w, h, time) {
    this.orbitAngle += this.orbitSpeed;
    const wobble = Math.sin(time * 0.002 + this.orbitAngle * 3) * 0.04;
    const dist = this.orbitDist + wobble;
    this.x = 0.5 + Math.cos(this.orbitAngle) * dist * 0.35;
    this.y = 0.5 + Math.sin(this.orbitAngle) * dist * 0.3;
    if (this.opacity < this.targetOpacity) this.opacity += this.fadeSpeed;
    else if (Math.random() < 0.003) this.targetOpacity = 0;
    if (this.targetOpacity === 0 && this.opacity < 0.005) this.reset(false);
    if (this.opacity > this.targetOpacity) this.opacity -= this.fadeSpeed * 0.5;
  }
  draw(ctx, cx, cy, w, h) {
    if (this.opacity < 0.01) return;
    const sx = cx + (this.x - 0.5) * w;
    const sy = cy + (this.y - 0.5) * h;
    ctx.beginPath();
    ctx.arc(sx, sy, this.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(229, 180, 140, ${this.opacity})`;
    ctx.fill();
  }
}

export default function EyeScene({ eyesOpen, onCloseComplete }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);
  const sparksRef = useRef([]);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 40, damping: 18 });
  const smy = useSpring(my, { stiffness: 40, damping: 18 });

  const closeProgress = useMotionValue(0);
  const smoothClose = useSpring(closeProgress, { stiffness: 30, damping: 18 });

  const initSparks = useCallback(() => {
    if (sparksRef.current.length === 0) {
      for (let i = 0; i < 80; i++) sparksRef.current.push(new Spark());
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio, 2);
    const rect = canvas.getBoundingClientRect();
    const wCSS = rect.width;
    const hCSS = rect.height;
    const w = wCSS * dpr;
    const h = hCSS * dpr;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      initSparks();
    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    timeRef.current += 1;
    const t = timeRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const close = smoothClose.get();

    // 鼠标偏移（在流体背景上微调）
    const mouseX = (smx.get() - 0.5) * 0.15;
    const mouseY = (smy.get() - 0.5) * 0.15;
    const baseCX = cx + mouseX * w;
    const baseCY = cy + mouseY * h * 0.5;

    const scale = Math.min(w, h) / 700;

    ctx.save();

    // === 绘制流体旋涡 ===
    // 多层流体曲线，颜色从金色渐变到珊瑚色
    const fluidLayers = [
      { count: 6, color: 'rgba(245, 200, 150, 0.55)', width: 18, offset: 0 },
      { count: 5, color: 'rgba(235, 170, 130, 0.50)', width: 14, offset: 0.4 },
      { count: 4, color: 'rgba(229, 136, 137, 0.45)', width: 10, offset: 0.2 },
      { count: 3, color: 'rgba(210, 110, 105, 0.38)', width: 7, offset: 0.6 },
    ];

    fluidLayers.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        const angle = (i / layer.count) * Math.PI * 2 + t * 0.003 + layer.offset;
        const radiusBase = scale * (80 + layer.offset * 30);
        const radiusVar = Math.sin(t * 0.01 + i * 1.5) * 15 * scale;

        ctx.beginPath();
        const startAngle = angle;
        const endAngle = angle + Math.PI * 1.2;
        const r1 = radiusBase + radiusVar;
        const r2 = radiusBase * 1.5 + radiusVar;

        // 贝塞尔流体曲线
        for (let j = 0; j <= 20; j++) {
          const a = startAngle + (endAngle - startAngle) * (j / 20);
          const r = r1 + (r2 - r1) * Math.sin((j / 20) * Math.PI);
          const swirl = Math.sin(a * 3 + t * 0.008) * 25 * scale;
          const rr = r + swirl;
          const x = baseCX + Math.cos(a) * rr;
          const y = baseCY + Math.sin(a) * rr * 0.7;
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.width * scale;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    });

    // === 中心眼核 ===
    const pupilRX = 38 * scale;
    const pupilRY = 32 * scale;

    // 眼核外围光晕
    const glowGrad = ctx.createRadialGradient(baseCX, baseCY, pupilRX * 0.2, baseCX, baseCY, pupilRX * 2.5);
    glowGrad.addColorStop(0, 'rgba(180, 140, 110, 0.5)');
    glowGrad.addColorStop(0.4, 'rgba(229, 136, 137, 0.25)');
    glowGrad.addColorStop(1, 'rgba(229, 136, 137, 0)');
    ctx.beginPath();
    ctx.ellipse(baseCX, baseCY, pupilRX * 2.5, pupilRY * 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // 虹膜（渐变）
    const irisGrad = ctx.createRadialGradient(baseCX, baseCY, 0, baseCX, baseCY, pupilRX * 1.5);
    irisGrad.addColorStop(0, '#2a3a20');
    irisGrad.addColorStop(0.4, '#3d5530');
    irisGrad.addColorStop(0.75, '#4a6540');
    irisGrad.addColorStop(1, '#3a4a30');
    ctx.beginPath();
    ctx.ellipse(baseCX, baseCY, pupilRX * 1.5, pupilRY * 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.fill();

    // 瞳孔
    const pupilGrad = ctx.createRadialGradient(baseCX, baseCY, 0, baseCX, baseCY, pupilRX * 0.6);
    pupilGrad.addColorStop(0, '#0a1008');
    pupilGrad.addColorStop(1, '#1a2815');
    ctx.beginPath();
    ctx.ellipse(baseCX, baseCY, pupilRX * 0.6, pupilRY * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = pupilGrad;
    ctx.fill();

    // 高光
    ctx.beginPath();
    ctx.ellipse(baseCX - pupilRX * 0.3, baseCY - pupilRY * 0.35, pupilRX * 0.25, pupilRY * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(baseCX + pupilRX * 0.2, baseCY + pupilRY * 0.25, pupilRX * 0.1, pupilRY * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();

    // === 金粉粒子 ===
    sparksRef.current.forEach(s => {
      s.update(w, h, t);
      s.draw(ctx, baseCX, baseCY, w, h);
    });

    // === 闭眼动画：上下遮罩 ===
    if (close > 0.01) {
      ctx.fillStyle = BG;
      const upperH = cy * 0.95 * close;
      const lowerH = (h - cy) * 0.95 * close;
      ctx.fillRect(0, 0, w, upperH);
      ctx.fillRect(0, h - lowerH, w, lowerH);
    }

    ctx.restore();

    closeProgress.set(eyesOpen ? 0 : 1);
    animRef.current = requestAnimationFrame(draw);
  }, [eyesOpen]);

  useEffect(() => {
    initSparks();
    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [draw]);

  useEffect(() => {
    const unsubClose = smoothClose.on('change', v => {
      if (!eyesOpen && v > 0.95 && onCloseComplete) {
        setTimeout(onCloseComplete, 500);
      }
    });
    return () => unsubClose?.();
  }, [eyesOpen, smoothClose, onCloseComplete]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      onMouseMove={handleMouseMove}
    />
  );
}
