import { useEffect, useRef, useState, type ReactNode } from 'react';
import type {
  CategoryMetric,
  DailyTrendPoint,
  OverviewMetrics,
  RatingBucket,
} from '../types/survey';
import type { ExecutiveInsight } from '../utils/surveyAnalytics';
import { ExecutiveSummary } from './ExecutiveSummary';
import { RevealChartContainer, useInViewReveal } from './RevealChartContainer';
import { IntentDonutChart } from './charts/IntentDonutChart';
import { LaunchTrendChart } from './charts/LaunchTrendChart';
import { LollipopChart } from './charts/LollipopChart';
import { ModeBubbleChart } from './charts/ModeBubbleChart';
import { RiderMosaicChart } from './charts/RiderMosaicChart';
import { TradeoffSplitChart } from './charts/TradeoffSplitChart';
import { WaffleChart } from './charts/WaffleChart';

export type SceneId = 'scene-1' | 'scene-2' | 'scene-3' | 'scene-4' | 'scene-5' | 'scene-6';

interface StoryViewProps {
  metrics: OverviewMetrics;
  ratingDist: RatingBucket[];
  modeBreakdown: CategoryMetric[];
  headacheBreakdown: CategoryMetric[];
  occupationBreakdown: CategoryMetric[];
  passBreakdown: CategoryMetric[];
  timeWastedBreakdown: CategoryMetric[];
  lackedCashBreakdown: CategoryMetric[];
  digitalFreqBreakdown: CategoryMetric[];
  reasonBreakdown: CategoryMetric[];
  formatBreakdown: CategoryMetric[];
  payMethodBreakdown: CategoryMetric[];
  speedBreakdown: CategoryMetric[];
  q21Breakdown: CategoryMetric[];
  q22Breakdown: CategoryMetric[];
  dailyTrend: DailyTrendPoint[];
  executiveInsights: ExecutiveInsight[];
  selectedMode: string;
  onSelectMode: (mode: string) => void;
  onClearFilters: () => void;
  onActiveSceneChange?: (sceneLabel: string) => void;
  requestedScene?: { id: SceneId; nonce: number } | null;
}

const SCENES: Array<{ id: SceneId; num: string; shortLabel: string }> = [
  { id: 'scene-1', num: '01', shortLabel: 'Riders' },
  { id: 'scene-2', num: '02', shortLabel: 'Delays' },
  { id: 'scene-3', num: '03', shortLabel: 'Vehicles' },
  { id: 'scene-4', num: '04', shortLabel: 'Readiness' },
  { id: 'scene-5', num: '05', shortLabel: 'Solution' },
  { id: 'scene-6', num: '06', shortLabel: 'Trend' },
];

export function StoryView({
  metrics,
  ratingDist,
  modeBreakdown,
  headacheBreakdown,
  occupationBreakdown,
  passBreakdown,
  timeWastedBreakdown,
  lackedCashBreakdown,
  digitalFreqBreakdown,
  reasonBreakdown,
  formatBreakdown,
  payMethodBreakdown,
  speedBreakdown,
  q21Breakdown,
  q22Breakdown,
  dailyTrend,
  executiveInsights,
  selectedMode,
  onSelectMode,
  onClearFilters,
  onActiveSceneChange,
  requestedScene,
}: StoryViewProps) {
  const [activeScene, setActiveScene] = useState<SceneId>('scene-1');
  const { ref: stickyStageRef, isVisible: isStickyStageVisible } = useInViewReveal<HTMLElement>();
  const lockUntilRef = useRef<number>(0);
  const sceneRefs = useRef<Record<SceneId, HTMLElement | null>>({
    'scene-1': null,
    'scene-2': null,
    'scene-3': null,
    'scene-4': null,
    'scene-5': null,
    'scene-6': null,
  });

  const applyActiveScene = (nextId: SceneId) => {
    setActiveScene((prev) => (prev === nextId ? prev : nextId));
    const meta = SCENES.find((s) => s.id === nextId);
    if (meta && onActiveSceneChange) {
      onActiveSceneChange(`${meta.num} / 06 · ${meta.shortLabel.toUpperCase()}`);
    }
  };

  useEffect(() => {
    if (!requestedScene) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lockUntilRef.current = reduced ? 0 : Date.now() + 750;
    applyActiveScene(requestedScene.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedScene]);

  useEffect(() => {
    if (metrics.totalCount === 0 || typeof window === 'undefined') return;

    const elements = SCENES.map((s) => sceneRefs.current[s.id]).filter(
      (el): el is HTMLElement => el !== null
    );
    if (elements.length === 0) return;

    const syncSceneFromViewport = () => {
      if (Date.now() < lockUntilRef.current) return;
      const anchorY = Math.min(260, Math.round(window.innerHeight * 0.34));

      let matched: SceneId | null = null;
      for (const s of SCENES) {
        const el = sceneRefs.current[s.id];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= anchorY && rect.bottom >= anchorY) {
          matched = s.id;
          break;
        }
      }

      if (!matched) {
        const firstRect = sceneRefs.current['scene-1']?.getBoundingClientRect();
        if (firstRect && firstRect.top > anchorY) {
          matched = 'scene-1';
        } else {
          matched = 'scene-6';
        }
      }

      if (matched) {
        applyActiveScene(matched);
      }
    };

    let rafId = 0;
    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(() => {
          rafId = 0;
          syncSceneFromViewport();
        });
      }
    };

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            () => {
              syncSceneFromViewport();
            },
            { threshold: [0, 0.15, 0.4, 0.75] }
          )
        : null;

    elements.forEach((el) => observer?.observe(el));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics.totalCount]);

  const jumpToScene = (id: SceneId) => {
    const el = sceneRefs.current[id];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lockUntilRef.current = reduced ? 0 : Date.now() + 750;
    applyActiveScene(id);
    if (el) {
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  };

  if (metrics.totalCount === 0) {
    return (
      <section id="chapter-summary" className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="border border-[#111111] bg-[#FAF8F3] p-12 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-[#E13B22]">
            No Matching Riders
          </p>
          <h2 className="mt-2 font-display text-4xl font-extrabold uppercase text-[#111111]">
            No commuter answers match those filters
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#4A4740]">
            Clear your search or filter selections to restore the commuter story.
          </p>
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-6 border border-[#111111] bg-[#111111] px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#F4F1EA] transition-colors hover:bg-[#E13B22] hover:border-[#E13B22]"
          >
            Reset All Filters
          </button>
        </div>
      </section>
    );
  }

  // Helpful derived plain-language numbers from filtered survey breakdowns
  const topOccupation = occupationBreakdown[0];
  const delayedMinutesCount = timeWastedBreakdown
    .filter((t) => /1 to 3|more than 3/i.test(t.label))
    .reduce((sum, t) => sum + t.count, 0);
  const delayedMinutesPct = Math.round((delayedMinutesCount / metrics.totalCount) * 100);

  const strandedOftenCount = lackedCashBreakdown
    .filter((l) => /^yes,/i.test(l.label))
    .reduce((sum, l) => sum + l.count, 0);
  const strandedOftenPct = Math.round((strandedOftenCount / metrics.totalCount) * 100);

  const digitalActivePct = Math.round(
    (digitalFreqBreakdown
      .filter((d) => /daily|frequently/i.test(d.label))
      .reduce((sum, d) => sum + d.count, 0) /
      metrics.totalCount) *
      100
  );

  const topHeadache = headacheBreakdown.find((h) => !/none/i.test(h.label)) ?? headacheBreakdown[0];
  const topFormat = formatBreakdown.find((f) => f.label !== 'Unspecified') ?? formatBreakdown[0];
  const topPayChannel =
    payMethodBreakdown.find((p) => p.label !== 'Unspecified') ?? payMethodBreakdown[0];
  const topSpeed = speedBreakdown.find((s) => s.label !== 'Unspecified') ?? speedBreakdown[0];

  const renderSceneVisual = (scene: SceneId, mode: 'stage' | 'inline') => {
    const wrapBlock = (
      children: ReactNode,
      order: 'primary' | 'secondary' = 'primary'
    ) => {
      if (mode === 'inline') {
        return (
          <RevealChartContainer delayMs={order === 'secondary' ? 90 : 0}>
            {children}
          </RevealChartContainer>
        );
      }
      return (
        <div
          className={
            order === 'secondary' ? 'animate-chart-enter-delayed' : 'animate-chart-enter'
          }
        >
          {children}
        </div>
      );
    };

    switch (scene) {
      case 'scene-1':
        return (
          <div className="space-y-6">
            {wrapBlock(
              <RiderMosaicChart occupations={occupationBreakdown} passBreakdown={passBreakdown} />,
              'primary'
            )}

            {wrapBlock(
              <div className="grid grid-cols-1 gap-3 border-t border-[#111111] pt-5 sm:grid-cols-3">
                <div className="border border-[#111111] bg-[#F4F1EA] p-3.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                    Multi-Ride Trips
                  </span>
                  <p className="mt-1 font-display text-3xl font-extrabold text-[#111111] tabular-nums">
                    {metrics.multimodalPct}%
                  </p>
                  <p className="mt-0.5 text-xs text-[#4A4740]">Combine 2+ vehicles</p>
                </div>
                <div className="border border-[#111111] bg-[#F4F1EA] p-3.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                    Typical Trip Spend
                  </span>
                  <p className="mt-1 font-display text-3xl font-extrabold text-[#111111] tabular-nums">
                    ৳{metrics.medianFareBdt}
                  </p>
                  <p className="mt-0.5 text-xs text-[#4A4740]">Median one-way cost</p>
                </div>
                <div className="border border-[#111111] bg-[#F4F1EA] p-3.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                    Largest Group
                  </span>
                  <p className="mt-1 font-display text-3xl font-extrabold text-[#111111] tabular-nums">
                    {topOccupation ? `${topOccupation.pct}%` : '—'}
                  </p>
                  <p className="mt-0.5 text-xs text-[#4A4740] truncate">
                    {topOccupation?.label ?? 'Commuters'}
                  </p>
                </div>
              </div>,
              'secondary'
            )}
          </div>
        );

      case 'scene-2':
        return (
          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-12">
            <div className="sm:col-span-7">
              {wrapBlock(
                <WaffleChart
                  pct={metrics.frequentHasslePct}
                  title="Weekly Cash Delays"
                  caption="Out of 100 commuters, this many face small-change or ticket-line trouble every week."
                />,
                'primary'
              )}
            </div>

            <div className="sm:col-span-5">
              {wrapBlock(
                <div className="grid grid-cols-1 gap-3">
                  <div className="border border-[#111111] bg-[#F4CF15] p-4 text-[#111111]">
                    <span className="font-mono text-[11px] uppercase tracking-wider">
                      Time Lost Waiting
                    </span>
                    <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">
                      {delayedMinutesPct}%
                    </p>
                    <p className="mt-0.5 text-xs font-medium">
                      Lose 1 to 3+ minutes per trip buying tickets or waiting for change
                    </p>
                  </div>

                  <div className="border border-[#111111] bg-[#111111] p-4 text-[#F4F1EA]">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#B7B2A8]">
                      Had Digital Money, No Cash
                    </span>
                    <p className="mt-1 font-display text-3xl font-extrabold text-[#E13B22] tabular-nums">
                      {strandedOftenPct}%
                    </p>
                    <p className="mt-0.5 text-xs text-[#E7E3DA]">
                      Got stuck with bKash/bank balance but no physical notes to pay
                    </p>
                  </div>
                </div>,
                'secondary'
              )}
            </div>
          </div>
        );

      case 'scene-3':
        return (
          <div className="space-y-6">
            {wrapBlock(
              <div>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl font-bold uppercase text-[#111111]">
                      Which Rides Need Cashless Most?
                    </h3>
                    <p className="mt-0.5 text-xs text-[#4A4740]">
                      Size = riders. Top-right = highest hassle &amp; strongest wish to switch.
                    </p>
                  </div>
                  {selectedMode !== 'All' && (
                    <button
                      type="button"
                      onClick={() => onSelectMode('All')}
                      className="border border-[#111111] bg-[#F4CF15] px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#111111] hover:bg-[#E13B22] hover:text-white whitespace-nowrap shrink-0"
                    >
                      Show All Rides
                    </button>
                  )}
                </div>
                <ModeBubbleChart
                  modes={modeBreakdown}
                  selectedMode={selectedMode}
                  onSelectMode={onSelectMode}
                />
              </div>,
              'primary'
            )}

            {wrapBlock(
              <div className="border-t border-[#111111] pt-5">
                <h4 className="mb-3 font-display text-xl font-bold uppercase text-[#111111]">
                  What Bothers Riders Most
                </h4>
                <LollipopChart items={headacheBreakdown} maxItems={4} />
              </div>,
              'secondary'
            )}
          </div>
        );

      case 'scene-4':
        return (
          <div className="space-y-6">
            {wrapBlock(
              <div>
                <h3 className="font-display text-2xl font-bold uppercase text-[#111111]">
                  Would Commuters Switch?
                </h3>
                <p className="mb-4 text-xs text-[#4A4740]">
                  Support for one shared card or app with standard official fares
                </p>
                <IntentDonutChart metrics={metrics} ratingDist={ratingDist} />
              </div>,
              'primary'
            )}

            {wrapBlock(
              <div className="grid grid-cols-1 gap-4 border-t border-[#111111] pt-5 sm:grid-cols-12">
                <div className="border border-[#111111] bg-[#F4F1EA] p-4 sm:col-span-4">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                    Already Digital
                  </span>
                  <p className="mt-1 font-display text-3xl font-extrabold text-[#111111] tabular-nums">
                    {metrics.smartphoneWalletPct}%
                  </p>
                  <p className="mt-0.5 text-xs text-[#4A4740]">
                    Use mobile wallets ({digitalActivePct}% pay digitally weekly+)
                  </p>
                </div>
                <div className="sm:col-span-8">
                  <p className="mb-2.5 font-mono text-xs uppercase tracking-wider text-[#4A4740]">
                    #1 Reason They Want It
                  </p>
                  <LollipopChart items={reasonBreakdown} maxItems={3} />
                </div>
              </div>,
              'secondary'
            )}
          </div>
        );

      case 'scene-5':
        return (
          <div className="space-y-4">
            {wrapBlock(
              <TradeoffSplitChart
                title="Phone QR vs. Smart Card"
                question="5-second free Phone QR everywhere vs. 2-second ৳100 Card (Metro & Bus only)"
                items={q21Breakdown}
                leftAccent="bg-[#E13B22] text-white"
                rightAccent="bg-[#111111] text-[#F4F1EA]"
              />,
              'primary'
            )}

            {wrapBlock(
              <div className="space-y-4">
                <div className="border-t border-[#111111] pt-4">
                  <TradeoffSplitChart
                    title="Low Deposit vs. Full Network"
                    question="৳50 Card (Metro, Bus, Rickshaw) vs. ৳200 Card covering CNG & Water Taxi too"
                    items={q22Breakdown}
                    leftAccent="bg-[#F4CF15] text-[#111111]"
                    rightAccent="bg-[#111111] text-[#F4F1EA]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-[#111111] pt-4 sm:grid-cols-3">
                  <div className="border border-[#111111] bg-[#F4F1EA] p-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                      Top Format
                    </span>
                    <p className="mt-1 font-display text-2xl font-extrabold text-[#111111] tabular-nums">
                      {topFormat ? `${topFormat.pct}%` : '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-[#4A4740] leading-snug">
                      {topFormat?.label.split('(')[0].trim()}
                    </p>
                  </div>
                  <div className="border border-[#111111] bg-[#F4F1EA] p-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                      Top Pay Method
                    </span>
                    <p className="mt-1 font-display text-2xl font-extrabold text-[#111111] tabular-nums">
                      {topPayChannel ? `${topPayChannel.pct}%` : '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-[#4A4740] leading-snug">
                      {topPayChannel?.label.split('(')[0].trim()}
                    </p>
                  </div>
                  <div className="border border-[#111111] bg-[#F4F1EA] p-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                      Speed Target
                    </span>
                    <p className="mt-1 font-display text-2xl font-extrabold text-[#111111] tabular-nums">
                      {topSpeed ? `${topSpeed.pct}%` : '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-[#4A4740] leading-snug">
                      {topSpeed?.label}
                    </p>
                  </div>
                </div>
              </div>,
              'secondary'
            )}
          </div>
        );

      case 'scene-6':
        return (
          <div>
            {wrapBlock(<LaunchTrendChart data={dailyTrend} />, 'primary')}
          </div>
        );
    }
  };

  return (
    <>
      {/* PART 1: EXECUTIVE SUMMARY MANIFESTO */}
      <section
        id="chapter-summary"
        aria-label="Key takeaways"
        className="scroll-mt-6 border-b border-[#111111] bg-[#F4F1EA] py-10 lg:py-12"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <ExecutiveSummary insights={executiveInsights} totalCount={metrics.totalCount} />
        </div>
      </section>

      {/* PART 2: THE 5-SCENE SCROLLYTELLING JOURNEY */}
      <section
        id="chapter-story"
        aria-label="The Dhaka commuter story"
        className="border-b border-[#111111] bg-[#F4F1EA] py-12 lg:py-16"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[#111111] pb-5 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[#E13B22]">
                Scroll-Driven Narrative · 6 Scenes
              </p>
              <h2 className="font-display-tight mt-1.5 text-4xl font-extrabold uppercase text-[#111111] sm:text-5xl">
                Follow The Commuter Journey
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[#4A4740]">
              As you scroll down through each chapter on the left, the live chart stage on the
              right updates to reveal what the data says.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            {/* LEFT: 5 Scrolling Narrative Scenes */}
            <div className="min-w-0 divide-y divide-[#111111] border border-[#111111] bg-[#FAF8F3] lg:col-span-5">
              {/* Scene 01 */}
              <article
                id="scene-1"
                ref={(el) => {
                  sceneRefs.current['scene-1'] = el;
                }}
                className={`scroll-mt-6 p-6 transition-colors duration-200 lg:min-h-[340px] lg:p-8 ${
                  activeScene === 'scene-1' ? 'bg-[#E7E3DA]' : 'bg-[#FAF8F3]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E13B22]">
                    Scene 01 · Who Is Riding
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpToScene('scene-1')}
                    className="hidden font-mono text-[11px] uppercase tracking-wider text-[#111111] underline underline-offset-4 lg:inline"
                  >
                    Show visual
                  </button>
                </div>
                <h3 className="mt-3 font-display text-3xl font-bold uppercase text-[#111111]">
                  Morning Hops Across Dhaka
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#2F2D29]">
                  Most of Dhaka&apos;s surveyed travelers are young daily commuters—
                  <span className="font-mono font-semibold text-[#111111] tabular-nums">
                    {topOccupation ? `${topOccupation.pct}%` : ''}
                  </span>{' '}
                  {topOccupation?.label.toLowerCase() ?? 'commuters'}—stitching together{' '}
                  <span className="font-mono font-semibold text-[#111111] tabular-nums">
                    {metrics.multimodalPct}%
                  </span>{' '}
                  multi-vehicle trips across rickshaws, buses, CNGs, and MRT-6. While{' '}
                  <span className="font-mono font-semibold text-[#111111] tabular-nums">
                    {metrics.mrtPassPct}%
                  </span>{' '}
                  carry an MRT or Rapid Pass, most still rely on paper cash between stops.
                </p>

                <div className="mt-6 border-t border-[#111111] pt-6 lg:hidden">
                  {renderSceneVisual('scene-1', 'inline')}
                </div>
              </article>

              {/* Scene 02 */}
              <article
                id="scene-2"
                ref={(el) => {
                  sceneRefs.current['scene-2'] = el;
                }}
                className={`scroll-mt-6 p-6 transition-colors duration-200 lg:min-h-[340px] lg:p-8 ${
                  activeScene === 'scene-2' ? 'bg-[#E7E3DA]' : 'bg-[#FAF8F3]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E13B22]">
                    Scene 02 · The Cash Bottleneck
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpToScene('scene-2')}
                    className="hidden font-mono text-[11px] uppercase tracking-wider text-[#111111] underline underline-offset-4 lg:inline"
                  >
                    Show visual
                  </button>
                </div>
                <h3 className="mt-3 font-display text-3xl font-bold uppercase text-[#111111]">
                  Stuck Looking For Change
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#2F2D29]">
                  Friction hits almost every week:{' '}
                  <span className="font-mono font-semibold text-[#E13B22] tabular-nums">
                    {metrics.frequentHasslePct} out of 100
                  </span>{' '}
                  riders face cash delays weekly or daily, and{' '}
                  <span className="font-mono font-semibold text-[#111111] tabular-nums">
                    {delayedMinutesPct}%
                  </span>{' '}
                  lose 1 to 3+ minutes per trip waiting for change or ticket tokens. Worse,{' '}
                  <span className="font-mono font-semibold text-[#111111] tabular-nums">
                    {strandedOftenPct}%
                  </span>{' '}
                  have money in bKash or Nagad but get stranded without physical notes.
                </p>

                <div className="mt-6 border-t border-[#111111] pt-6 lg:hidden">
                  {renderSceneVisual('scene-2', 'inline')}
                </div>
              </article>

              {/* Scene 03 */}
              <article
                id="scene-3"
                ref={(el) => {
                  sceneRefs.current['scene-3'] = el;
                }}
                className={`scroll-mt-6 p-6 transition-colors duration-200 lg:min-h-[340px] lg:p-8 ${
                  activeScene === 'scene-3' ? 'bg-[#E7E3DA]' : 'bg-[#FAF8F3]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E13B22]">
                    Scene 03 · Which Rides Hurt Most
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpToScene('scene-3')}
                    className="hidden font-mono text-[11px] uppercase tracking-wider text-[#111111] underline underline-offset-4 lg:inline"
                  >
                    Show visual
                  </button>
                </div>
                <h3 className="mt-3 font-display text-3xl font-bold uppercase text-[#111111]">
                  Where Fares Break Down
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#2F2D29]">
                  The biggest everyday irritation is simple:{' '}
                  <span className="font-semibold text-[#111111]">
                    {topHeadache?.label ?? 'Drivers lacking exact small change'}
                  </span>{' '}
                  ({topHeadache?.pct ?? 0}%). Water Taxis, CNGs, and Metro Rail connections sit
                  squarely in the urgent cashless-need zone—click any bubble on the stage to trace
                  its riders through the story.
                </p>

                <div className="mt-6 border-t border-[#111111] pt-6 lg:hidden">
                  {renderSceneVisual('scene-3', 'inline')}
                </div>
              </article>

              {/* Scene 04 */}
              <article
                id="scene-4"
                ref={(el) => {
                  sceneRefs.current['scene-4'] = el;
                }}
                className={`scroll-mt-6 p-6 transition-colors duration-200 lg:min-h-[340px] lg:p-8 ${
                  activeScene === 'scene-4' ? 'bg-[#E7E3DA]' : 'bg-[#FAF8F3]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E13B22]">
                    Scene 04 · Phone &amp; Mind Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpToScene('scene-4')}
                    className="hidden font-mono text-[11px] uppercase tracking-wider text-[#111111] underline underline-offset-4 lg:inline"
                  >
                    Show visual
                  </button>
                </div>
                <h3 className="mt-3 font-display text-3xl font-bold uppercase text-[#111111]">
                  {metrics.highIntentPct}% Are Ready Today
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#2F2D29]">
                  Commuters don&apos;t need convincing:{' '}
                  <span className="font-mono font-semibold text-[#111111] tabular-nums">
                    {metrics.smartphoneWalletPct}%
                  </span>{' '}
                  already keep mobile wallets on their phones, and{' '}
                  <span className="font-mono font-semibold text-[#111111] tabular-nums">
                    {metrics.highIntentPct}%
                  </span>{' '}
                  say yes to one unified transit app or card—driven mainly by ditching loose coins
                  and locking in fair official prices.
                </p>

                <div className="mt-6 border-t border-[#111111] pt-6 lg:hidden">
                  {renderSceneVisual('scene-4', 'inline')}
                </div>
              </article>

              {/* Scene 05 */}
              <article
                id="scene-5"
                ref={(el) => {
                  sceneRefs.current['scene-5'] = el;
                }}
                className={`scroll-mt-6 p-6 transition-colors duration-200 lg:min-h-[340px] lg:p-8 ${
                  activeScene === 'scene-5' ? 'bg-[#E7E3DA]' : 'bg-[#FAF8F3]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E13B22]">
                    Scene 05 · What To Build
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpToScene('scene-5')}
                    className="hidden font-mono text-[11px] uppercase tracking-wider text-[#111111] underline underline-offset-4 lg:inline"
                  >
                    Show visual
                  </button>
                </div>
                <h3 className="mt-3 font-display text-3xl font-bold uppercase text-[#111111]">
                  Reach Beats Speed
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#2F2D29]">
                  When forced to choose, commuters overwhelmingly prefer a free{' '}
                  <span className="font-semibold text-[#111111]">Mobile QR code</span> that works on
                  every rickshaw and bus over a faster card locked only to Metro stations—as long as
                  scanning takes under 5 seconds and keeps upfront deposits low.
                </p>

                <div className="mt-6 border-t border-[#111111] pt-6 lg:hidden">
                  {renderSceneVisual('scene-5', 'inline')}
                </div>
              </article>

              {/* Scene 06 */}
              <article
                id="scene-6"
                ref={(el) => {
                  sceneRefs.current['scene-6'] = el;
                }}
                className={`scroll-mt-6 p-6 transition-colors duration-200 lg:min-h-[540px] lg:p-8 ${
                  activeScene === 'scene-6' ? 'bg-[#E7E3DA]' : 'bg-[#FAF8F3]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#E13B22]">
                    Scene 06 · Over Time
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpToScene('scene-6')}
                    className="hidden font-mono text-[11px] uppercase tracking-wider text-[#111111] underline underline-offset-4 lg:inline"
                  >
                    Show visual
                  </button>
                </div>
                <h3 className="mt-3 font-display text-3xl font-bold uppercase text-[#111111]">
                  How Feedback Evolved
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#2F2D29]">
                  {dailyTrend.length >= 2
                    ? `Across ${dailyTrend.length} survey days (${dailyTrend[0].shortDate} to ${dailyTrend[dailyTrend.length - 1].shortDate}), switch enthusiasm moved from ${dailyTrend[0].avgIntent.toFixed(2)}/5 early on to ${dailyTrend[dailyTrend.length - 1].avgIntent.toFixed(2)}/5 by launch close. Switch between Satisfaction and Daily Riders on the chart to trace how daily habits shifted.`
                    : 'Track how satisfaction scores and daily commuter share evolved across response dates during the launch survey.'}
                </p>

                <div className="mt-6 border-t border-[#111111] pt-6 lg:hidden">
                  {renderSceneVisual('scene-6', 'inline')}
                </div>
              </article>
            </div>

            {/* RIGHT: Sticky Interactive Visual Stage (Desktop) */}
            <aside
              ref={stickyStageRef}
              aria-label="Active story chart stage"
              className={`hidden min-w-0 border border-[#111111] bg-[#FAF8F3] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 lg:col-span-7 lg:block lg:sticky lg:top-6 ${
                isStickyStageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {/* Scene Progress Stepper Strip */}
              <div className="grid grid-cols-6 border-b border-[#111111] bg-[#111111] text-[#F4F1EA]">
                {SCENES.map((scene, idx) => {
                  const isCurrent = activeScene === scene.id;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => jumpToScene(scene.id)}
                      aria-pressed={isCurrent}
                      className={`px-2.5 py-3 text-left font-mono text-[10px] xl:text-[11px] uppercase tracking-wider transition-colors truncate ${
                        idx > 0 ? 'border-l border-[#2E2C28]' : ''
                      } ${
                        isCurrent
                          ? 'bg-[#F4CF15] font-semibold text-[#111111]'
                          : 'text-[#B7B2A8] hover:bg-[#1E1D1A] hover:text-white'
                      }`}
                    >
                      {scene.num} {scene.shortLabel}
                    </button>
                  );
                })}
              </div>

              <div key={activeScene} className="p-5 lg:p-6">
                {renderSceneVisual(activeScene, 'stage')}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
