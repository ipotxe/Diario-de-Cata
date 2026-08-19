import React from 'react';
import { RadarValues } from '../types';

interface RadarChartProps {
  values: RadarValues;
  onChange?: (newValues: RadarValues) => void;
  interactive?: boolean;
  size?: number;
}

// Convert any value to 0-5 integer scale (supporting legacy 0-100 values seamlessly)
export const toScale5 = (val: number | undefined): number => {
  if (val === undefined || isNaN(val)) return 0;
  if (val > 5) return Math.round((val / 100) * 5);
  return Math.max(0, Math.min(5, Math.round(val)));
};

export const RadarChart: React.FC<RadarChartProps> = ({
  values,
  onChange,
  interactive = false,
  size = 240,
}) => {
  const hopVal = toScale5(values?.hop);
  const sweetnessVal = toScale5(values?.sweetness);
  const maltVal = toScale5(values?.malt);
  const bitternessVal = toScale5(values?.bitterness);

  // Center is (70, 70), max radius is 45 (corresponding to score 5)
  const center = 70;
  const maxR = 45;

  const hopR = Math.max(2, (hopVal / 5) * maxR);
  const sweetnessR = Math.max(2, (sweetnessVal / 5) * maxR);
  const maltR = Math.max(2, (maltVal / 5) * maxR);
  const bitternessR = Math.max(2, (bitternessVal / 5) * maxR);

  // Top (Lúpulo), Right (Dulzor), Bottom (Malta), Left (Amargor)
  const hopPt = { x: center, y: center - hopR };
  const sweetnessPt = { x: center + sweetnessR, y: center };
  const maltPt = { x: center, y: center + maltR };
  const bitternessPt = { x: center - bitternessR, y: center };

  const polygonPath = `M ${hopPt.x} ${hopPt.y} L ${sweetnessPt.x} ${sweetnessPt.y} L ${maltPt.x} ${maltPt.y} L ${bitternessPt.x} ${bitternessPt.y} Z`;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        className="relative mx-auto flex items-center justify-center select-none"
        style={{ width: size, height: size }}
      >
        <svg
          className="w-full h-full overflow-visible"
          viewBox="0 0 140 140"
        >
          {/* Concentric grid circles for levels 1 to 5 */}
          {[1, 2, 3, 4, 5].map((level) => {
            const r = (level / 5) * maxR;
            return (
              <circle
                key={level}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth={level === 5 ? '1.2' : '0.8'}
                strokeDasharray={level === 5 ? undefined : '2 2'}
              />
            );
          })}

          {/* Axes */}
          <line x1="70" y1="22" x2="70" y2="118" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="22" y1="70" x2="118" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* Data Shape */}
          <path
            d={polygonPath}
            fill="rgba(251, 173, 24, 0.28)"
            stroke="#FBAD18"
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="transition-all duration-150"
          />

          {/* Value Point Dots */}
          <circle cx={hopPt.x} cy={hopPt.y} r="3.5" fill="#FBAD18" stroke="#121414" strokeWidth="1.5" />
          <circle cx={sweetnessPt.x} cy={sweetnessPt.y} r="3.5" fill="#FBAD18" stroke="#121414" strokeWidth="1.5" />
          <circle cx={maltPt.x} cy={maltPt.y} r="3.5" fill="#FBAD18" stroke="#121414" strokeWidth="1.5" />
          <circle cx={bitternessPt.x} cy={bitternessPt.y} r="3.5" fill="#FBAD18" stroke="#121414" strokeWidth="1.5" />

          {/* Labels placed precisely at each axis */}
          {/* TOP: LÚPULO */}
          <text
            x="70"
            y="12"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffd18f"
            fontSize="8.5"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            LÚPULO ({hopVal}/5)
          </text>

          {/* BOTTOM: MALTA */}
          <text
            x="70"
            y="128"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffd18f"
            fontSize="8.5"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            MALTA ({maltVal}/5)
          </text>

          {/* LEFT: AMARGOR */}
          <text
            x="19"
            y="70"
            textAnchor="end"
            dominantBaseline="middle"
            fill="#ffd18f"
            fontSize="8.5"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            AMARGOR ({bitternessVal}/5)
          </text>

          {/* RIGHT: DULZOR */}
          <text
            x="121"
            y="70"
            textAnchor="start"
            dominantBaseline="middle"
            fill="#ffd18f"
            fontSize="8.5"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            DULZOR ({sweetnessVal}/5)
          </text>
        </svg>
      </div>

      {interactive && onChange && (
        <div className="w-full grid grid-cols-2 gap-3 pt-2 px-1">
          {/* Lúpulo Slider */}
          <div className="bg-[#121414] p-3 rounded-xl border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[#d7c4ad] mb-1.5">
              <span className="font-semibold">🌿 Lúpulo</span>
              <span className="text-[#ffd18f] font-bold text-xs bg-[#282a2b] px-2 py-0.5 rounded-md border border-white/10">
                {hopVal} <span className="text-[10px] text-[#d7c4ad]/70">/ 5</span>
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={hopVal}
              onChange={(e) => onChange({ ...values, hop: Number(e.target.value) })}
              className="w-full h-2 bg-[#282a2b] rounded-lg appearance-none cursor-pointer accent-[#fbad18]"
            />
            <div className="flex justify-between text-[9px] text-[#d7c4ad]/60 px-0.5 mt-1 font-mono">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          {/* Malta Slider */}
          <div className="bg-[#121414] p-3 rounded-xl border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[#d7c4ad] mb-1.5">
              <span className="font-semibold">🌾 Malta</span>
              <span className="text-[#ffd18f] font-bold text-xs bg-[#282a2b] px-2 py-0.5 rounded-md border border-white/10">
                {maltVal} <span className="text-[10px] text-[#d7c4ad]/70">/ 5</span>
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={maltVal}
              onChange={(e) => onChange({ ...values, malt: Number(e.target.value) })}
              className="w-full h-2 bg-[#282a2b] rounded-lg appearance-none cursor-pointer accent-[#fbad18]"
            />
            <div className="flex justify-between text-[9px] text-[#d7c4ad]/60 px-0.5 mt-1 font-mono">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          {/* Amargor Slider */}
          <div className="bg-[#121414] p-3 rounded-xl border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[#d7c4ad] mb-1.5">
              <span className="font-semibold">⚡ Amargor</span>
              <span className="text-[#ffd18f] font-bold text-xs bg-[#282a2b] px-2 py-0.5 rounded-md border border-white/10">
                {bitternessVal} <span className="text-[10px] text-[#d7c4ad]/70">/ 5</span>
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={bitternessVal}
              onChange={(e) => onChange({ ...values, bitterness: Number(e.target.value) })}
              className="w-full h-2 bg-[#282a2b] rounded-lg appearance-none cursor-pointer accent-[#fbad18]"
            />
            <div className="flex justify-between text-[9px] text-[#d7c4ad]/60 px-0.5 mt-1 font-mono">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          {/* Dulzor Slider */}
          <div className="bg-[#121414] p-3 rounded-xl border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs text-[#d7c4ad] mb-1.5">
              <span className="font-semibold">🍯 Dulzor</span>
              <span className="text-[#ffd18f] font-bold text-xs bg-[#282a2b] px-2 py-0.5 rounded-md border border-white/10">
                {sweetnessVal} <span className="text-[10px] text-[#d7c4ad]/70">/ 5</span>
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={sweetnessVal}
              onChange={(e) => onChange({ ...values, sweetness: Number(e.target.value) })}
              className="w-full h-2 bg-[#282a2b] rounded-lg appearance-none cursor-pointer accent-[#fbad18]"
            />
            <div className="flex justify-between text-[9px] text-[#d7c4ad]/60 px-0.5 mt-1 font-mono">
              <span>0</span>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
