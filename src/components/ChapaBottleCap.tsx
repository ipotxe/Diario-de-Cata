import React from 'react';
import { EvaluatedBadge, getCategoryColor } from '../utils/badgeEngine';

interface ChapaBottleCapProps {
  insignia: EvaluatedBadge;
  size?: number; // size in px, default 64
  showStatusBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

// Generate the 21-teeth crown bottle cap outline (standard beer bottle crown)
function crownPath(cx: number, cy: number, rOuter: number, rInner: number, teeth = 21): string {
  const step = Math.PI / teeth;
  const pts: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const angle = i * step - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

export const ChapaBottleCap: React.FC<ChapaBottleCapProps> = ({
  insignia,
  size = 64,
  showStatusBadge = true,
  className = '',
  onClick,
}) => {
  const { unlocked, progreso, icono } = insignia;
  const color = getCategoryColor(insignia.categoria);
  const cx = 50;
  const cy = 50;
  const capPath = crownPath(cx, cy, 47, 39, 21);
  const ringR = 33;
  const circumference = 2 * Math.PI * ringR;

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative shrink-0 select-none group transition-transform ${
        onClick ? 'cursor-pointer active:scale-90 hover:scale-105' : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full transition-all duration-300 ${
          unlocked
            ? 'drop-shadow-[0_0_10px_rgba(251,173,24,0.4)]'
            : 'filter grayscale opacity-75 group-hover:opacity-100 group-hover:grayscale-0'
        }`}
      >
        {/* Outer Teeth Cap */}
        <path
          d={capPath}
          fill={unlocked ? color : '#3d3428'}
          stroke={unlocked ? '#1b120c' : '#221a14'}
          strokeWidth="1.5"
        />

        {/* Inner Dark Recess */}
        <circle cx={cx} cy={cy} r="34" fill="#1b120c" />

        {/* Locked Background Ring */}
        {!unlocked && (
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke="#3a3226"
            strokeWidth="3.5"
          />
        )}

        {/* Progress Arc Ring */}
        {!unlocked && progreso > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${circumference * progreso} ${circumference}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-500"
          />
        )}

        {/* Full Unlocked Ring */}
        {unlocked && (
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke={color}
            strokeWidth="2"
            opacity="0.6"
          />
        )}

        {/* Center Emoji / Icon */}
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fontSize="24"
          className="transition-all"
          style={!unlocked ? { filter: 'grayscale(0.8)', opacity: 0.55 } : {}}
        >
          {icono}
        </text>
      </svg>

      {/* Status Badge in corner */}
      {showStatusBadge && (
        <div
          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#121414] shadow-md transition-all ${
            unlocked ? 'bg-[#7ef24a] text-[#103900]' : 'bg-[#2c2118] text-[#8a7c60]'
          }`}
        >
          <span className="material-symbols-outlined text-[11px] font-bold">
            {unlocked ? 'check' : 'lock'}
          </span>
        </div>
      )}
    </div>
  );
};
