import React, { useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';

const CircularText = ({ text, spinDuration = 20, className = '' }) => {
  const letters = Array.from(text);
  const controls = useAnimation();
  const rotation = useMotionValue(0);

  useEffect(() => {
    controls.start({
      rotate: 360,
      transition: { rotate: { repeat: Infinity, duration: spinDuration, ease: "linear" } }
    });
  }, [controls, spinDuration]);

  return (
    <motion.div
      // 强制容器宽高相等，确保旋转中心不偏移
      className={`absolute w-[260px] h-[260px] flex items-center justify-center ${className}`}
      style={{ rotate: rotation }}
      animate={controls}
    >
      {letters.map((letter, i) => {
        const rotationDeg = (360 / letters.length) * i;
        // 半径设为 110px，刚好就在 192px(w-48) 图片的边缘外一点点
        const transform = `rotateZ(${rotationDeg}deg) translateY(-110px)`;
        return (
          <span
            key={i}
            className="absolute inline-block text-sm font-bold tracking-widest uppercase"
            style={{ transform, transformOrigin: "center center" }}
          >
            {letter}
          </span>
        );
      })}
    </motion.div>
  );
};

export default CircularText;