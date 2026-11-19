import { ArrowDown, ArrowUpRight, Minus, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react';
import type { OverviewMetrics } from '../types/survey';
import { computePercentChange } from '../utils/surveyAnalytics';

interface HeroSpreadProps {
  metrics: OverviewMetrics;
  baselineMetrics: OverviewMetrics;
  totalCorpusCount: number;
  datasetLabel: string;
  isCustomDataset: boolean;
  activeSceneLabel: string;
  onStartExploring: () => void;
  onExportCsv: () => void;
  onResetDataset: () => void;
}

interface TrendBadgeProps {
  current: number;
  baseline: number;
  hasData: boolean;
  isFiltered: boolean;
  baselineLabel: string;
  showContextText?: boolean;
}

function TrendBadge({
  current,
  baseline,
  hasData,
  isFiltered,
  baselineLabel,
  showContextText = false,
}: TrendBadgeProps) {
  const pct = hasData ? computePercentChange(current, baseline) : null;

  if (pct === null) {
    return (
      <span className="inline-flex items-center gap-1 border border-[#2E2C28] bg-[#1A1916] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#B7B2A8] tabular-nums">
        —
      </span>
    );
  }

  const isNeutral = !isFiltered || pct === 0;
  const formatted = `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;

  const toneClass = !isFiltered
    ? 'border-[#2E2C28] bg-[#1A1916] text-[#B7B2A8]'
    : pct > 0
      ? 'border-[#F4CF15] bg-[#F4CF15] text-[#111111]'
      : pct < 0
        ? 'border-[#E13B22] bg-[#E13B22] text-white'
        : 'border-[#3A3731] bg-[#1C1A17] text-[#E7E3DA]';

  const Icon = isNeutral ? Minus : pct > 0 ? TrendingUp : TrendingDown;

  return (
    <span
      title={`Change vs unfiltered dataset (${baselineLabel})`}
      aria-label={`${formatted} compared to unfiltered dataset baseline of ${baselineLabel}`}
      className={`inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider tabular-nums whitespace-nowrap ${toneClass}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{formatted}</span>
      {showContextText && (
        <span className="opacity-85">
          {isFiltered ? `vs ${baselineLabel}` : 'vs all'}
        </span>
      )}
    </span>
  );
}

export function HeroSpread({
  metrics,
  baselineMetrics,
  totalCorpusCount,
  datasetLabel,
  isCustomDataset,
  activeSceneLabel,
  onStartExploring,
  onExportCsv,
  onResetDataset,
}: HeroSpreadProps) {
  const isFiltered = metrics.totalCount !== baselineMetrics.totalCount;
  const hasData = metrics.totalCount > 0;

  return (
    <section
      id="top"
      aria-label="Commuter story opening"
      className="border-b border-[#111111] bg-[#F4F1EA]"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7 lg:border-r lg:border-[#111111] lg:p-10">
            <div>
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-wider text-[#4A4740]">
                {isCustomDataset && (
                  <>
                    <span>{datasetLabel}</span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span className="tabular-nums">{totalCorpusCount} Commuters Surveyed</span>
              </div>

              <h1 className="font-display-tight mt-5 text-5xl font-extrabold uppercase text-[#111111] sm:text-6xl xl:text-[5.15rem]">
                Multimodal Cashless Transit in Dhaka
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#2F2D29]">
                Feasibility, First-to-Last-Mile Integration, and Adoption Dynamics Across Formal
                and Informal Transit Modes
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onStartExploring}
                className="inline-flex items-center gap-2 border border-[#111111] bg-[#111111] px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#F4F1EA] transition-colors hover:bg-[#E13B22] hover:border-[#E13B22] whitespace-nowrap shrink-0"
              >
                <span>Begin Story</span>
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onExportCsv}
                disabled={metrics.totalCount === 0}
                className="inline-flex items-center gap-2 border border-[#111111] bg-[#FAF8F3] px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-[#111111] transition-colors hover:bg-[#F4CF15] disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                <span>Export CSV</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </button>

              {isCustomDataset && (
                <button
                  type="button"
                  onClick={onResetDataset}
                  className="inline-flex items-center gap-1.5 border border-[#111111] bg-transparent px-4 py-3 font-mono text-xs font-medium uppercase tracking-wider text-[#111111] transition-colors hover:bg-[#E7E3DA] whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset Data</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-between border-t border-[#111111] bg-[#111111] text-[#F4F1EA] lg:col-span-5 lg:border-t-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2E2C28] px-6 py-4 font-mono text-xs uppercase tracking-wider text-[#B7B2A8]">
              <span>Story At A Glance</span>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-[#F4CF15]">
                  {isFiltered
                    ? `${metrics.totalCount} / ${baselineMetrics.totalCount} Riders`
                    : `${metrics.totalCount} Riders Shown`}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs uppercase tracking-wider text-[#B7B2A8]">
                  Would Switch To One Shared Pass (1–5)
                </p>
                <TrendBadge
                  current={metrics.avgAdoptionIntent}
                  baseline={baselineMetrics.avgAdoptionIntent}
                  hasData={hasData}
                  isFiltered={isFiltered}
                  baselineLabel={baselineMetrics.avgAdoptionIntent.toFixed(2)}
                  showContextText
                />
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-display text-7xl font-extrabold leading-none text-[#F4F1EA] tabular-nums sm:text-8xl">
                  {metrics.avgAdoptionIntent.toFixed(2)}
                </span>
                <span className="font-mono text-lg text-[#B7B2A8] tabular-nums">/ 5.0</span>
              </div>
              <p className="mt-3 font-mono text-xs text-[#E7E3DA] tabular-nums">
                {metrics.highIntentPct}% ready to switch · {metrics.multimodalPct}% take 2+ ride types
              </p>
            </div>

            <div className="grid grid-cols-1 border-t border-[#2E2C28] sm:grid-cols-3">
              <div className="border-b border-[#2E2C28] p-5 sm:border-b-0 sm:border-r">
                <div className="flex items-center justify-between gap-1.5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-[#B7B2A8]">
                    Cash Delays
                  </p>
                </div>
                <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-3xl font-bold text-[#E13B22] tabular-nums">
                    {metrics.frequentHasslePct}%
                  </p>
                  <TrendBadge
                    current={metrics.frequentHasslePct}
                    baseline={baselineMetrics.frequentHasslePct}
                    hasData={hasData}
                    isFiltered={isFiltered}
                    baselineLabel={`${baselineMetrics.frequentHasslePct}%`}
                  />
                </div>
                <p className="mt-1 font-mono text-[11px] text-[#B7B2A8]">Weekly or daily</p>
              </div>

              <div className="border-b border-[#2E2C28] p-5 sm:border-b-0 sm:border-r">
                <p className="font-mono text-[11px] uppercase tracking-wider text-[#B7B2A8]">
                  Phone Wallets
                </p>
                <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-3xl font-bold text-[#F4CF15] tabular-nums">
                    {metrics.smartphoneWalletPct}%
                  </p>
                  <TrendBadge
                    current={metrics.smartphoneWalletPct}
                    baseline={baselineMetrics.smartphoneWalletPct}
                    hasData={hasData}
                    isFiltered={isFiltered}
                    baselineLabel={`${baselineMetrics.smartphoneWalletPct}%`}
                  />
                </div>
                <p className="mt-1 font-mono text-[11px] text-[#B7B2A8]">bKash / Nagad</p>
              </div>

              <div className="p-5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-[#B7B2A8]">
                  Typical Trip
                </p>
                <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-3xl font-bold text-[#F4F1EA] tabular-nums">
                    ৳{metrics.medianFareBdt}
                  </p>
                  <TrendBadge
                    current={metrics.medianFareBdt}
                    baseline={baselineMetrics.medianFareBdt}
                    hasData={hasData}
                    isFiltered={isFiltered}
                    baselineLabel={`৳${baselineMetrics.medianFareBdt}`}
                  />
                </div>
                <p className="mt-1 font-mono text-[11px] text-[#B7B2A8]">One-way median</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#111111] bg-[#E7E3DA] px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-[#111111]">
          <span className="inline-flex items-center gap-2">
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Scroll down to follow the commuter journey</span>
          </span>
          <span className="tabular-nums font-semibold">{activeSceneLabel}</span>
        </div>
      </div>
    </section>
  );
}
