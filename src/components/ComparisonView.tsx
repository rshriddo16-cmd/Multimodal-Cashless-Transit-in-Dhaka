import { ArrowLeftRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ComparisonBarItem, SurveyResponse } from '../types/survey';
import {
  COMPARISON_SEGMENTS,
  computeSegmentComparison,
  type ComparisonSegmentDefinition,
} from '../utils/surveyAnalytics';
import { RevealChartContainer } from './RevealChartContainer';

interface ComparisonViewProps {
  responses: SurveyResponse[];
  onClearFilters: () => void;
}

const PRESET_MATCHUPS: Array<{ id: string; label: string; a: string; b: string }> = [
  { id: 'freq-occ', label: 'Frequent vs Occasional', a: 'frequent', b: 'occasional' },
  { id: 'pass-cash', label: 'Pass vs Cash', a: 'has-pass', b: 'cash-tokens' },
  { id: 'metro-bus', label: 'Metro vs Bus', a: 'metro-riders', b: 'bus-riders' },
  { id: 'wallet-cash', label: 'Wallet vs Cash', a: 'smartphone-wallet', b: 'non-smartphone' },
  { id: 'female-male', label: 'Female vs Male', a: 'female', b: 'male' },
];

const SEGMENT_GROUPS: Array<ComparisonSegmentDefinition['group']> = [
  'Frequency',
  'Pass & Wallet',
  'Transit Mode',
  'Intent & Demographics',
  'All',
];

interface ComparisonTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: ComparisonBarItem }>;
  segmentAShort: string;
  segmentBShort: string;
  segmentATotal: number;
  segmentBTotal: number;
}

function CustomComparisonTooltip({
  active,
  payload,
  segmentAShort,
  segmentBShort,
  segmentATotal,
  segmentBTotal,
}: ComparisonTooltipProps) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;

  const spread =
    item.diffPts > 0
      ? `+${item.diffPts} pts higher for ${segmentAShort}`
      : item.diffPts < 0
        ? `+${Math.abs(item.diffPts)} pts higher for ${segmentBShort}`
        : 'Identical across both segments';

  return (
    <div className="max-w-xs border border-[#111111] bg-[#111111] px-3.5 py-2.5 font-mono text-[11px] text-[#F4F1EA] shadow-[4px_4px_0_0_#F4CF15]">
      <p className="font-semibold text-[#F4CF15]">{item.fullLabel}</p>
      <div className="mt-1.5 space-y-1 tabular-nums text-[#E7E3DA]">
        <p className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 bg-[#F4F1EA]" />
            <span>{segmentAShort}:</span>
          </span>
          <span className="font-semibold text-white">
            {item.aPct}% ({item.aCount}/{segmentATotal})
          </span>
        </p>
        <p className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 bg-[#E13B22]" />
            <span>{segmentBShort}:</span>
          </span>
          <span className="font-semibold text-white">
            {item.bPct}% ({item.bCount}/{segmentBTotal})
          </span>
        </p>
      </div>
      <p className="mt-1.5 border-t border-[#2E2C28] pt-1 text-[10px] text-[#B7B2A8]">{spread}</p>
    </div>
  );
}

export function ComparisonView({ responses, onClearFilters }: ComparisonViewProps) {
  const [segmentAId, setSegmentAId] = useState<string>('frequent');
  const [segmentBId, setSegmentBId] = useState<string>('occasional');

  const segmentCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const seg of COMPARISON_SEGMENTS) {
      map.set(seg.id, responses.filter(seg.predicate).length);
    }
    return map;
  }, [responses]);

  const comparison = useMemo(
    () => computeSegmentComparison(responses, segmentAId, segmentBId),
    [responses, segmentAId, segmentBId]
  );

  if (responses.length === 0) {
    return null;
  }

  const { segmentA, segmentB, breakdowns } = comparison;
  const totalCohort = responses.length;
  const aSharePct = Math.round((segmentA.metrics.totalCount / totalCohort) * 100);
  const bSharePct = Math.round((segmentB.metrics.totalCount / totalCohort) * 100);
  const intentDelta = Number(
    (segmentA.metrics.avgAdoptionIntent - segmentB.metrics.avgAdoptionIntent).toFixed(2)
  );
  const hassleDelta = segmentA.metrics.frequentHasslePct - segmentB.metrics.frequentHasslePct;
  const fareDelta = segmentA.metrics.medianFareBdt - segmentB.metrics.medianFareBdt;

  const formatDelta = (val: number, suffix = '') => {
    if (val > 0) return `+${val}${suffix}`;
    return `${val}${suffix}`;
  };

  return (
    <section
      id="chapter-compare"
      aria-label="Chapter 06: Segment Comparison View"
      className="scroll-mt-6 border-b border-[#111111] bg-[#F4F1EA] py-12 lg:py-16"
    >
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Section Heading + Quick Matchups */}
        <div className="flex flex-col justify-between gap-5 border-b border-[#111111] pb-5 xl:flex-row xl:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#E13B22]">
              Chapter 06 · Side-by-Side Comparison
            </p>
            <h2 className="font-display-tight mt-1.5 text-4xl font-extrabold uppercase text-[#111111] sm:text-5xl">
              Compare Two Rider Segments
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Quick segment comparisons">
            {PRESET_MATCHUPS.map((preset) => {
              const active = segmentAId === preset.a && segmentBId === preset.b;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSegmentAId(preset.a);
                    setSegmentBId(preset.b);
                  }}
                  aria-pressed={active}
                  className={`border border-[#111111] px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#111111] text-[#F4CF15]'
                      : 'bg-[#FAF8F3] text-[#111111] hover:bg-[#E7E3DA]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Segment A vs Segment B Controls */}
        <div className="border border-[#111111] bg-[#FAF8F3] p-4 sm:p-5">
          <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-11">
            <div className="lg:col-span-5">
              <label
                htmlFor="compare-segment-a"
                className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#111111]"
              >
                <span className="inline-block h-3 w-3 bg-[#111111]" aria-hidden="true" />
                <span>Segment A (Black Bars)</span>
              </label>
              <select
                id="compare-segment-a"
                value={segmentAId}
                onChange={(e) => setSegmentAId(e.target.value)}
                className="mt-1.5 w-full border border-[#111111] bg-[#F4F1EA] px-3 py-2.5 font-mono text-xs text-[#111111] focus:bg-white focus:outline-2 focus:outline-[#E13B22]"
              >
                {SEGMENT_GROUPS.map((group) => (
                  <optgroup key={group} label={group}>
                    {COMPARISON_SEGMENTS.filter((s) => s.group === group).map((seg) => (
                      <option key={seg.id} value={seg.id}>
                        {seg.label} ({segmentCounts.get(seg.id) ?? 0})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex justify-center lg:col-span-1">
              <button
                type="button"
                onClick={() => {
                  setSegmentAId(segmentBId);
                  setSegmentBId(segmentAId);
                }}
                aria-label="Swap Segment A and Segment B"
                className="inline-flex w-full items-center justify-center gap-1.5 border border-[#111111] bg-[#F4F1EA] px-3 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#111111] transition-colors hover:bg-[#F4CF15] lg:w-auto"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="lg:sr-only">Swap Segments</span>
              </button>
            </div>

            <div className="lg:col-span-5">
              <label
                htmlFor="compare-segment-b"
                className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#111111]"
              >
                <span className="inline-block h-3 w-3 bg-[#E13B22]" aria-hidden="true" />
                <span>Segment B (Red Bars)</span>
              </label>
              <select
                id="compare-segment-b"
                value={segmentBId}
                onChange={(e) => setSegmentBId(e.target.value)}
                className="mt-1.5 w-full border border-[#111111] bg-[#F4F1EA] px-3 py-2.5 font-mono text-xs text-[#111111] focus:bg-white focus:outline-2 focus:outline-[#E13B22]"
              >
                {SEGMENT_GROUPS.map((group) => (
                  <optgroup key={group} label={group}>
                    {COMPARISON_SEGMENTS.filter((s) => s.group === group).map((seg) => (
                      <option key={seg.id} value={seg.id}>
                        {seg.label} ({segmentCounts.get(seg.id) ?? 0})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* 4-column Summary Metrics Delta Strip */}
          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-[#111111] pt-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="border border-[#111111] bg-[#F4F1EA] p-3.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                Segment Sample Size
              </span>
              <div className="mt-1.5 flex items-baseline justify-between gap-2 tabular-nums">
                <span className="font-display text-2xl font-extrabold text-[#111111]">
                  {segmentA.metrics.totalCount}{' '}
                  <span className="font-mono text-xs font-normal text-[#4A4740]">({aSharePct}%)</span>
                </span>
                <span className="font-mono text-xs text-[#6B675E]">vs</span>
                <span className="font-display text-2xl font-extrabold text-[#E13B22]">
                  {segmentB.metrics.totalCount}{' '}
                  <span className="font-mono text-xs font-normal text-[#4A4740]">({bSharePct}%)</span>
                </span>
              </div>
            </div>

            <div className="border border-[#111111] bg-[#F4F1EA] p-3.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                Avg Switch Intent (1–5)
              </span>
              <div className="mt-1.5 flex items-baseline justify-between gap-2 tabular-nums">
                <span className="font-display text-2xl font-extrabold text-[#111111]">
                  {segmentA.metrics.avgAdoptionIntent.toFixed(2)}
                </span>
                <span className="font-mono text-[11px] font-semibold text-[#4A4740]">
                  {formatDelta(intentDelta)}
                </span>
                <span className="font-display text-2xl font-extrabold text-[#E13B22]">
                  {segmentB.metrics.avgAdoptionIntent.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="border border-[#111111] bg-[#F4F1EA] p-3.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                Weekly Cash Hassle
              </span>
              <div className="mt-1.5 flex items-baseline justify-between gap-2 tabular-nums">
                <span className="font-display text-2xl font-extrabold text-[#111111]">
                  {segmentA.metrics.frequentHasslePct}%
                </span>
                <span className="font-mono text-[11px] font-semibold text-[#4A4740]">
                  {formatDelta(hassleDelta, ' pts')}
                </span>
                <span className="font-display text-2xl font-extrabold text-[#E13B22]">
                  {segmentB.metrics.frequentHasslePct}%
                </span>
              </div>
            </div>

            <div className="border border-[#111111] bg-[#F4F1EA] p-3.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                Median Trip Spend
              </span>
              <div className="mt-1.5 flex items-baseline justify-between gap-2 tabular-nums">
                <span className="font-display text-2xl font-extrabold text-[#111111]">
                  ৳{segmentA.metrics.medianFareBdt}
                </span>
                <span className="font-mono text-[11px] font-semibold text-[#4A4740]">
                  {formatDelta(fareDelta, '৳')}
                </span>
                <span className="font-display text-2xl font-extrabold text-[#E13B22]">
                  ৳{segmentB.metrics.medianFareBdt}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Cohort Guard */}
        {segmentA.metrics.totalCount === 0 || segmentB.metrics.totalCount === 0 ? (
          <div className="border border-[#111111] bg-[#FAF8F3] p-8 text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-[#E13B22]">
              Empty Segment Under Active Filters
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[#4A4740]">
              {segmentA.metrics.totalCount === 0 ? segmentA.meta.label : segmentB.meta.label} has 0
              matching respondents under the current filter bar selection. Choose another segment or
              reset global filters.
            </p>
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-4 border border-[#111111] bg-[#111111] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#F4F1EA] hover:bg-[#E13B22] hover:border-[#E13B22]"
            >
              Reset Global Filters
            </button>
          </div>
        ) : (
          /* Side-by-Side Breakdown Bar Charts Grid */
          <RevealChartContainer>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {breakdowns.map((section) => {
                const maxGapItem = [...section.items].sort(
                  (x, y) => Math.abs(y.diffPts) - Math.abs(x.diffPts)
                )[0];
                const chartHeight = Math.max(195, section.items.length * 42 + 24);

                return (
                  <article
                    key={section.id}
                    className="min-w-0 border border-[#111111] bg-[#FAF8F3] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E0DCD3] pb-3">
                      <div>
                        <h3 className="font-display text-2xl font-bold uppercase text-[#111111]">
                          {section.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-[#4A4740]">{section.subtitle}</p>
                      </div>
                      {maxGapItem && Math.abs(maxGapItem.diffPts) > 0 && (
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#E13B22] tabular-nums whitespace-nowrap">
                          Max gap: {maxGapItem.diffPts > 0 ? '+' : ''}
                          {maxGapItem.diffPts} pts ({maxGapItem.label})
                        </span>
                      )}
                    </div>

                    <div className="mt-4 w-full min-w-0" style={{ height: chartHeight }}>
                      <ResponsiveContainer width="100%" height={chartHeight}>
                        <BarChart
                          data={section.items}
                          layout="vertical"
                          margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
                          barGap={3}
                          barCategoryGap="24%"
                        >
                          <CartesianGrid
                            stroke="#D7D2C8"
                            strokeDasharray="3 3"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                            tickFormatter={(val: number) => `${val}%`}
                            tick={{
                              fill: '#4A4740',
                              fontSize: 10,
                              fontFamily: 'IBM Plex Mono, monospace',
                            }}
                            axisLine={{ stroke: '#111111' }}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="label"
                            width={122}
                            tick={{
                              fill: '#111111',
                              fontSize: 11,
                              fontFamily: 'DM Sans, sans-serif',
                              fontWeight: 500,
                            }}
                            axisLine={{ stroke: '#111111' }}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: '#E7E3DA', fillOpacity: 0.45 }}
                            content={
                              <CustomComparisonTooltip
                                segmentAShort={segmentA.meta.shortLabel}
                                segmentBShort={segmentB.meta.shortLabel}
                                segmentATotal={segmentA.metrics.totalCount}
                                segmentBTotal={segmentB.metrics.totalCount}
                              />
                            }
                          />
                          <Bar
                            dataKey="aPct"
                            name={segmentA.meta.shortLabel}
                            fill="#111111"
                            barSize={11}
                            isAnimationActive={false}
                          />
                          <Bar
                            dataKey="bPct"
                            name={segmentB.meta.shortLabel}
                            fill="#E13B22"
                            barSize={11}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E0DCD3] pt-2.5 font-mono text-[11px] text-[#4A4740] tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 bg-[#111111]" />
                        <span>
                          {segmentA.meta.shortLabel} (n={segmentA.metrics.totalCount})
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 bg-[#E13B22]" />
                        <span>
                          {segmentB.meta.shortLabel} (n={segmentB.metrics.totalCount})
                        </span>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </RevealChartContainer>
        )}
      </div>
    </section>
  );
}
