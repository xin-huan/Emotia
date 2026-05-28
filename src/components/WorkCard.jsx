import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function WorkCard({ item }) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="relative w-full max-w-[260px] mx-auto aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer group"
      style={{ backgroundColor: item.color }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
    >
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <p className="text-white/50 text-[10px] tracking-[0.2em] uppercase mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          {item.zh}
        </p>
        <div className="flex items-end justify-between">
          <h3 className="text-white text-lg font-bold">{item.title}</h3>
          <motion.button
            onClick={(e) => { e.stopPropagation(); navigate(item.path); }}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-sm hover:bg-white/40 transition-colors"
            whileHover={{ scale: 1.15 }}
          >→</motion.button>
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </motion.div>
  );
}
