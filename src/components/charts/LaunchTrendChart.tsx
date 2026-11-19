import { useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyTrendPoint } from '../../types/survey';

interface LaunchTrendChartProps {
  data: DailyTrendPoint[];
}

type TrendMetricMode = 'satisfaction' | 'usage';

interface TooltipPayloadEntry {
  payload?: DailyTrendPoint;
}

function CustomTrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="border border-[#111111] bg-[#111111] px-3.5 py-2.5 font-mono text-[11px] text-[#F4F1EA] shadow-[4px_4px_0_0_#E13B22]">
      <p className="font-semibold uppercase tracking-wider text-[#F4CF15]">
        {point.date} · {point.count} {point.count === 1 ? 'reply' : 'replies'}
      </p>
      <div className="mt-1.5 space-y-0.5 tabular-nums text-[#E7E3DA]">
        <p>Satisfaction: {point.avgIntent.toFixed(2)} / 5.0</p>
        <p>Ready to switch: {point.highIntentPct}%</p>
        <p>Daily riders (5–7d/wk): {point.dailyRiderPct}%</p>
      </div>
    </div>
  );
}

export function LaunchTrendChart({ data }: LaunchTrendChartProps) {
  const [metricMode, setMetricMode] = useState<TrendMetricMode>('satisfaction');

  if (data.length === 0) {
    return (
      <div className="border border-[#111111] bg-[#F4F1EA] p-6 text-center font-mono text-xs text-[#4A4740]">
        No timeline data matches the active filters.
      </div>
    );
  }

  const peakDay = [...data].sort((a, b) => b.count - a.count)[0];
  const firstDay = data[0];
  const lastDay = data[data.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-bold uppercase text-[#111111]">
            {metricMode === 'satisfaction'
              ? 'Satisfaction Across Launch Days'
              : 'Daily Rider Share Across Launch Days'}
          </h3>
          <p className="mt-0.5 text-xs text-[#4A4740]">
            {metricMode === 'satisfaction'
              ? 'Red line shows average switch score (1–5); shaded yellow area shows daily replies.'
              : 'Black line shows % of respondents commuting 5–7 days/week; yellow area shows daily replies.'}
          </p>
        </div>

        <div
          role="group"
          aria-label="Choose timeline metric"
          className="inline-flex border border-[#111111] bg-[#F4F1EA]"
        >
          <button
            type="button"
            onClick={() => setMetricMode('satisfaction')}
            aria-pressed={metricMode === 'satisfaction'}
            className={`px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
              metricMode === 'satisfaction'
                ? 'bg-[#111111] text-[#F4CF15]'
                : 'text-[#111111] hover:bg-[#E7E3DA]'
            }`}
          >
            Satisfaction (1–5)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('usage')}
            aria-pressed={metricMode === 'usage'}
            className={`border-l border-[#111111] px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
              metricMode === 'usage'
                ? 'bg-[#111111] text-[#F4CF15]'
                : 'text-[#111111] hover:bg-[#E7E3DA]'
            }`}
          >
            Daily Riders (%)
          </button>
        </div>
      </div>

      <div className="border border-[#111111] bg-[#FAF8F3] p-3">
        <div className="h-[245px] w-full min-w-0">
          <ResponsiveContainer width="100%" height={245}>
            <ComposedChart data={data} margin={{ top: 10, right: 24, left: -10, bottom: 2 }}>
              <CartesianGrid stroke="#D7D2C8" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="shortDate"
                padding={{ left: 4, right: 4 }}
                tick={{ fill: '#4A4740', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
                axisLine={{ stroke: '#111111' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="metric"
                domain={metricMode === 'satisfaction' ? [1, 5] : [0, 100]}
                ticks={metricMode === 'satisfaction' ? [1, 2, 3, 4, 5] : [0, 25, 50, 75, 100]}
                tickFormatter={(val: number) =>
                  metricMode === 'satisfaction' ? `${val.toFixed(1)}` : `${val}%`
                }
                tick={{ fill: '#111111', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
                axisLine={{ stroke: '#111111' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                hide
                domain={[0, (dataMax: number) => Math.max(4, Math.ceil(dataMax * 1.15))]}
              />
              <Tooltip content={<CustomTrendTooltip />} />
              <Area
                yAxisId="volume"
                type="monotone"
                dataKey="count"
                name="Replies"
                stroke="#111111"
                strokeWidth={1.25}
                fill="#F4CF15"
                fillOpacity={0.35}
                isAnimationActive={false}
              />
              <Line
                yAxisId="metric"
                type="monotone"
                dataKey={metricMode === 'satisfaction' ? 'avgIntent' : 'dailyRiderPct'}
                name={metricMode === 'satisfaction' ? 'Avg Score' : 'Daily Riders %'}
                stroke={metricMode === 'satisfaction' ? '#E13B22' : '#111111'}
                strokeWidth={2.75}
                dot={{ r: 3.5, fill: '#FAF8F3', strokeWidth: 2 }}
                activeDot={{
                  r: 5,
                  fill: metricMode === 'satisfaction' ? '#E13B22' : '#111111',
                  stroke: '#FAF8F3',
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E0DCD3] pt-2 font-mono text-[11px] text-[#4A4740]">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`inline-block h-0.5 w-4 ${
                  metricMode === 'satisfaction' ? 'bg-[#E13B22]' : 'bg-[#111111]'
                }`}
              />
              <span>
                {metricMode === 'satisfaction' ? 'Satisfaction Score (1–5)' : 'Daily Riders (%)'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 border border-[#111111] bg-[#F4CF15]/55" />
              <span>Daily Replies</span>
            </span>
          </div>
          <span className="tabular-nums">
            {firstDay.shortDate} – {lastDay.shortDate}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border border-[#111111] bg-[#F4F1EA] p-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
            Peak Reply Day
          </span>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#111111] tabular-nums">
            {peakDay.shortDate}
          </p>
          <p className="mt-0.5 text-xs text-[#4A4740] tabular-nums">
            {peakDay.count} replies · {peakDay.avgIntent.toFixed(2)}/5 score
          </p>
        </div>
        <div className="border border-[#111111] bg-[#F4F1EA] p-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
            Active Days
          </span>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#111111] tabular-nums">
            {data.length}
          </p>
          <p className="mt-0.5 text-xs text-[#4A4740]">
            Across launch window
          </p>
        </div>
        <div className="border border-[#111111] bg-[#F4F1EA] p-3">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
            Latest Day Score
          </span>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#111111] tabular-nums">
            {lastDay.avgIntent.toFixed(2)}
          </p>
          <p className="mt-0.5 text-xs text-[#4A4740] tabular-nums">
            {lastDay.dailyRiderPct}% daily commuters
          </p>
        </div>
      </div>
    </div>
  );
}
