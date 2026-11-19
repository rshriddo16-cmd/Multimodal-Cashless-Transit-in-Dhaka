import { useState } from 'react';
import type { OverviewMetrics, RatingBucket } from '../../types/survey';

interface IntentDonutChartProps {
  metrics: OverviewMetrics;
  ratingDist: RatingBucket[];
}

export function IntentDonutChart({ metrics, ratingDist }: IntentDonutChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const slices = [
    {
      id: 'high',
      label: 'Yes (Score 4–5)',
      count: metrics.highIntentCount,
      pct: metrics.highIntentPct,
      color: '#111111',
      textColor: '#111111',
    },
    {
      id: 'neutral',
      label: 'Maybe (Score 3)',
      count: metrics.neutralCount,
      pct: metrics.neutralPct,
      color: '#F4CF15',
      textColor: '#926F00',
    },
    {
      id: 'low',
      label: 'No (Score 1–2)',
      count: metrics.lowIntentCount,
      pct: metrics.lowIntentPct,
      color: '#E13B22',
      textColor: '#E13B22',
    },
  ];

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let cumulativePct = 0;

  const activeSlice = slices.find((s) => s.id === hoveredId) ?? slices[0];

  return (
    <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[210px_1fr]">
      <div className="relative mx-auto flex h-[210px] w-[210px] items-center justify-center">
        <svg
          viewBox="0 0 210 210"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label={`Adoption intent breakdown: ${metrics.highIntentPct}% yes, ${metrics.neutralPct}% maybe, ${metrics.lowIntentPct}% no`}
        >
          <circle
            cx="105"
            cy="105"
            r={radius}
            fill="none"
            stroke="#E7E3DA"
            strokeWidth="28"
          />
          {slices.map((slice) => {
            if (slice.pct <= 0) return null;
            const dashLength = (slice.pct / 100) * circumference;
            const dashOffset = -(cumulativePct / 100) * circumference;
            cumulativePct += slice.pct;
            const isHovered = hoveredId === slice.id;

            return (
              <circle
                key={slice.id}
                cx="105"
                cy="105"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isHovered ? 34 : 28}
                strokeDasharray={`${Math.max(0, dashLength - 2)} ${circumference}`}
                strokeDashoffset={dashOffset}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
                tabIndex={0}
                onFocus={() => setHoveredId(slice.id)}
                aria-label={`${slice.label}: ${slice.count} riders (${slice.pct}%)`}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-4xl font-extrabold leading-none text-[#111111] tabular-nums">
            {activeSlice.pct}%
          </span>
          <span className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
            {activeSlice.id === 'high' ? 'Would Switch' : activeSlice.label.split(' ')[0]}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="divide-y divide-[#D5D0C5] border-t border-b border-[#111111]">
          {slices.map((slice) => {
            const isHovered = hoveredId === slice.id;
            return (
              <button
                key={slice.id}
                type="button"
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(slice.id)}
                className={`flex w-full items-center justify-between gap-3 px-2 py-2.5 text-left transition-colors ${
                  isHovered ? 'bg-[#E7E3DA]' : 'bg-transparent'
                }`}
              >
                <span className="inline-flex items-center gap-2.5 text-sm font-medium text-[#111111]">
                  <span
                    className="h-3 w-3 shrink-0 border border-[#111111]"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span>{slice.label}</span>
                </span>
                <span className="font-mono text-xs font-semibold text-[#111111] tabular-nums">
                  {slice.count} ({slice.pct}%)
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between font-mono text-[11px] text-[#4A4740] tabular-nums">
          <span>Score 1 to 5 counts:</span>
          <span>{ratingDist.map((b) => `${b.rating}★:${b.count}`).join('  ')}</span>
        </div>
      </div>
    </div>
  );
}
