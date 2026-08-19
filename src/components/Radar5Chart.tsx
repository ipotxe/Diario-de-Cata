import React from 'react';

export interface Radar5Axis {
  key: string;
  label: string;
  emoji: string;
  value: number; // 0 to 5
}

interface Radar5ChartProps {
  axes: Radar5Axis[];
  onChange?: (key: string, value: number) => void;
  interactive?: boolean;
  size?: number;
  accentColor?: string; // e.g. '#FBAD18' or '#34D399'
  chartTitle?: string;
}

export const Radar5Chart: React.FC<Radar5ChartProps> = ({
  axes,
  onChange,
  interactive = false,
  size = 230,
  accentColor = '#FBAD18',
  chartTitle,
}) => {
  const center = 75;
  const maxR = 48;

  // 5 vertices angles starting from top (12 o'clock = -90deg)
  // angle_k = -PI/2 + k * (2 * PI / 5)
  const getPoint = (index: number, valOutOf5: number) => {
    const angle = -Math.PI / 2 + index * ((2 * Math.PI) / 5);
    const r = Math.max(2, (Math.min(5, Math.max(0, valOutOf5)) / 5) * maxR);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const getGridPoint = (index: number, level: number) => {
    const angle = -Math.PI / 2 + index * ((2 * Math.PI) / 5);
    const r = (level / 5) * maxR;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Label positioning info around the pentagon
  const labelConfigs = [
    { x: 75, y: 12, textAnchor: 'middle', dominantBaseline: 'middle' }, // Top (0)
    { x: 125, y: 55, textAnchor: 'start', dominantBaseline: 'middle' },  // Top-Right (1)
    { x: 110, y: 135, textAnchor: 'start', dominantBaseline: 'middle' }, // Bottom-Right (2)
    { x: 40, y: 135, textAnchor: 'end', dominantBaseline: 'middle' },    // Bottom-Left (3)
    { x: 25, y: 55, textAnchor: 'end', dominantBaseline: 'middle' },    // Top-Left (4)
  ];

  // Build polygon path for data
  const dataPoints = axes.map((axis, idx) => getPoint(idx, axis.value));
  const polygonPath = dataPoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
    .join(' ') + ' Z';

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {chartTitle && (
        <div className="flex items-center justify-between w-full px-1 border-b border-white/5 pb-2">
          <span className="text-xs font-bold text-[#ffd18f] uppercase tracking-wider flex items-center gap-1.5">
            {chartTitle}
          </span>
          <span className="text-[10px] text-[#d7c4ad]/70 font-mono">Escala 0 - 5</span>
        </div>
      )}

      {/* SVG Spider Pentagon Canvas */}
      <div
        className="relative mx-auto flex items-center justify-center select-none"
        style={{ width: size, height: size }}
      >
        <svg
          className="w-full h-full overflow-visible"
          viewBox="0 0 150 150"
        >
          {/* Concentric grid pentagons for levels 1 to 5 */}
          {[1, 2, 3, 4, 5].map((lvl) => {
            const gridPts = [0, 1, 2, 3, 4].map((i) => getGridPoint(i, lvl));
            const gridPath =
              gridPts
                .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
                .join(' ') + ' Z';

            return (
              <path
                key={lvl}
                d={gridPath}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={lvl === 5 ? '1.2' : '0.7'}
                strokeDasharray={lvl === 5 ? undefined : '2 2'}
              />
            );
          })}

          {/* Radial Axis Lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const outerPt = getGridPoint(i, 5);
            return (
              <line
                key={`axis-${i}`}
                x1={center}
                y1={center}
                x2={outerPt.x}
                y2={outerPt.y}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="0.9"
              />
            );
          })}

          {/* Shaded Data Polygon */}
          <path
            d={polygonPath}
            fill={`${accentColor}33`}
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="transition-all duration-150"
          />

          {/* Data Points on vertices */}
          {dataPoints.map((pt, idx) => (
            <circle
              key={`dot-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill={accentColor}
              stroke="#121414"
              strokeWidth="1.5"
              className="transition-all duration-150"
            />
          ))}

          {/* Vertex Labels */}
          {axes.map((axis, idx) => {
            const cfg = labelConfigs[idx] || { x: 75, y: 75, textAnchor: 'middle', dominantBaseline: 'middle' };
            return (
              <text
                key={`label-${axis.key}`}
                x={cfg.x}
                y={cfg.y}
                textAnchor={cfg.textAnchor as any}
                dominantBaseline={cfg.dominantBaseline as any}
                fill="#ffd18f"
                fontSize="7.8"
                fontWeight="bold"
                letterSpacing="0.04em"
              >
                {axis.label.toUpperCase()} ({axis.value}/5)
              </text>
            );
          })}
        </svg>
      </div>

      {/* Interactive Controls */}
      {interactive && onChange && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {axes.map((axis) => (
            <div
              key={axis.key}
              className="bg-[#121414] p-2.5 rounded-xl border border-white/5 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center text-xs text-[#d7c4ad] mb-1">
                <span className="font-semibold flex items-center gap-1">
                  <span>{axis.emoji}</span>
                  <span>{axis.label}</span>
                </span>
                <span className="text-[#ffd18f] font-bold text-xs bg-[#282a2b] px-2 py-0.5 rounded-md border border-white/10">
                  {axis.value} <span className="text-[10px] text-[#d7c4ad]/70">/ 5</span>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={axis.value}
                onChange={(e) => onChange(axis.key, Number(e.target.value))}
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
          ))}
        </div>
      )}
    </div>
  );
};
