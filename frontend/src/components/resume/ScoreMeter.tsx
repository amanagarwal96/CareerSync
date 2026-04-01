"use client"

import { motion } from 'framer-motion';

export const ScoreMeter = ({ score }: { score: number }) => {
  const getScoreColor = (s: number) => {
    if (s >= 85) return '#22c55e'; // Green
    if (s >= 70) return '#3b82f6'; // Blue
    if (s >= 50) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const color = getScoreColor(score);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
            fill="transparent"
          />
          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl font-black font-outfit italic tracking-tighter"
            style={{ color }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">ATS Index</span>
        </div>
      </div>
    </div>
  );
};
