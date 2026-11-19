import { useState } from 'react';
import type { CategoryMetric } from '../../types/survey';

interface ModeBubbleChartProps {
  modes: CategoryMetric[];
  selectedMode: string;
  onSelectMode: (mode: string) => void;
}

const SHORT_NAMES: Record<string, string> = {
  'Rickshaw (Cycle or Battery)': 'Rickshaw',
  'Metro Rail (MRT-6)': 'Metro Rail',
  'CNG Auto-rickshaw': 'CNG Auto',
  'Hatirjheel Water Taxi': 'Water Taxi',
  'City Bus': 'City Bus',
  Walking: 'Walking',
};

export function ModeBubbleChart({ modes, selectedMode, onSelectMode }: ModeBubbleChartProps) {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const visibleModes = modes.filter((m) => m.label && m.label !== 'Unspecified');
  if (visibleModes.length === 0) return null;

  const width = 560;
  const height = 310;
  const padL = 52;
  const padR = 32;
  const padT = 28;
  const padB = 46;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const xMin = 40;
  const xMax = 100;
  const yMin = 3.4;
  const yMax = 4.6;

  const toX = (hasslePct: number) =>
    padL + ((Math.max(xMin, Math.min(xMax, hasslePct)) - xMin) / (xMax - xMin)) * plotW;
  const toY = (intent: number) =>
    padT + plotH - ((Math.max(yMin, Math.min(yMax, intent)) - yMin) / (yMax - yMin)) * plotH;

  const maxCount = Math.max(1, ...visibleModes.map((m) => m.count));

  const inspected =
    visibleModes.find((m) => m.label === (hoveredMode ?? selectedMode)) ?? visibleModes[0];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[#4A4740]">
        <span>Click any bubble to filter all charts</span>
        {inspected && (
          <span className="font-semibold text-[#111111] tabular-nums">
            {SHORT_NAMES[inspected.label] ?? inspected.label}: {inspected.count} riders ·{' '}
            {inspected.frequentHasslePct}% hassle · {inspected.avgIntent.toFixed(2)}/5 desire
          </span>
        )}
      </div>

      <div className="w-full overflow-hidden border border-[#111111] bg-[#FAF8F3]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full select-none"
          role="img"
          aria-label="Bubble plot comparing transport modes by cash hassle percentage and cashless desire score"
        >
          {/* Urgent Quadrant highlight */}
          <rect
            x={toX(70)}
            y={padT}
            width={toX(100) - toX(70)}
            height={toY(4.0) - padT}
            fill="#F4CF15"
            fillOpacity={0.22}
          />
          <text
            x={width - padR - 6}
            y={padT + 14}
            textAnchor="end"
            className="fill-[#111111] font-mono text-[9px] font-semibold uppercase"
          >
            Highest Need Zone
          </text>

          {/* Grid lines */}
          {[50, 70, 90].map((tick) => (
            <g key={`x-${tick}`}>
              <line
                x1={toX(tick)}
                y1={padT}
                x2={toX(tick)}
                y2={padT + plotH}
                stroke={tick === 70 ? '#111111' : '#D5D0C5'}
                strokeDasharray={tick === 70 ? '4 3' : '2 3'}
              />
              <text
                x={toX(tick)}
                y={height - 20}
                textAnchor="middle"
                className="fill-[#4A4740] font-mono text-[10px]"
              >
                {tick}%
              </text>
            </g>
          ))}

          {[3.6, 4.0, 4.4].map((tick) => (
            <g key={`y-${tick}`}>
              <line
                x1={padL}
                y1={toY(tick)}
                x2={width - padR}
                y2={toY(tick)}
                stroke={tick === 4.0 ? '#111111' : '#D5D0C5'}
                strokeDasharray={tick === 4.0 ? '4 3' : '2 3'}
              />
              <text
                x={padL - 8}
                y={toY(tick) + 3}
                textAnchor="end"
                className="fill-[#4A4740] font-mono text-[10px]"
              >
                {tick.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#111111" strokeWidth="1.5" />
          <line
            x1={padL}
            y1={padT + plotH}
            x2={width - padR}
            y2={padT + plotH}
            stroke="#111111"
            strokeWidth="1.5"
          />

          <text
            x={padL + plotW / 2}
            y={height - 4}
            textAnchor="middle"
            className="fill-[#111111] font-mono text-[10px] uppercase"
          >
            Frequent Cash Trouble (%) →
          </text>
          <text
            x={14}
            y={padT + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90 14 ${padT + plotH / 2})`}
            className="fill-[#111111] font-mono text-[10px] uppercase"
          >
            Desire To Switch (/5) →
          </text>

          {/* Bubbles + Crisp Readable Labels */}
          {visibleModes.map((mode) => {
            const cx = toX(mode.frequentHasslePct);
            const cy = toY(mode.avgIntent);
            const r = 12 + Math.sqrt(mode.count / maxCount) * 18;
            const isSelected = selectedMode === mode.label;
            const isHovered = hoveredMode === mode.label;
            const shortName = SHORT_NAMES[mode.label] ?? mode.label;
            const labelOutside = r < 24;

            return (
              <g
                key={mode.label}
                className="cursor-pointer"
                onClick={() => onSelectMode(isSelected ? 'All' : mode.label)}
                onMouseEnter={() => setHoveredMode(mode.label)}
                onMouseLeave={() => setHoveredMode(null)}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                aria-label={`${mode.label}: ${mode.count} riders, ${mode.frequentHasslePct}% cash hassle, ${mode.avgIntent.toFixed(2)} intent`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectMode(isSelected ? 'All' : mode.label);
                  }
                }}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={isSelected ? '#E13B22' : isHovered ? '#F4CF15' : '#111111'}
                  fillOpacity={isSelected ? 0.92 : isHovered ? 0.95 : 0.88}
                  stroke="#111111"
                  strokeWidth={isSelected || isHovered ? 2 : 1}
                />
                {labelOutside ? (
                  <>
                    <text
                      x={cx}
                      y={cy + 3}
                      textAnchor="middle"
                      className={`font-mono text-[9px] font-semibold pointer-events-none ${
                        isHovered && !isSelected ? 'fill-[#111111]' : 'fill-[#F4CF15]'
                      }`}
                    >
                      {mode.count}
                    </text>
                    <text
                      x={cx}
                      y={
                        shortName === 'CNG Auto'
                          ? cy - r - 6
                          : cy + r + 12
                      }
                      textAnchor="middle"
                      className="fill-[#111111] font-mono text-[10px] font-semibold pointer-events-none"
                    >
                      {shortName}
                    </text>
                  </>
                ) : (
                  <>
                    <text
                      x={cx}
                      y={cy - 1}
                      textAnchor="middle"
                      className={`font-mono text-[9px] font-semibold pointer-events-none ${
                        isHovered && !isSelected ? 'fill-[#111111]' : 'fill-[#FAF8F3]'
                      }`}
                    >
                      {shortName}
                    </text>
                    <text
                      x={cx}
                      y={cy + 10}
                      textAnchor="middle"
                      className={`font-mono text-[8px] pointer-events-none ${
                        isHovered && !isSelected ? 'fill-[#111111]' : 'fill-[#F4CF15]'
                      }`}
                    >
                      {mode.count}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
