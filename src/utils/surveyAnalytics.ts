import type {
  CategoryMetric,
  CommuterCluster,
  ComparisonBarItem,
  ComparisonBreakdownSection,
  ComparisonSegmentMeta,
  DailyTrendPoint,
  IntentTier,
  ModePaymentCell,
  ModePaymentMatrixData,
  OverviewMetrics,
  RatingBucket,
  SegmentComparisonResult,
  SortField,
  SurveyFilters,
  SurveyResponse,
} from '../types/survey';

export function getIntentTier(score: number): IntentTier {
  if (score >= 4) return 'High Intent (4–5)';
  if (score === 3) return 'Neutral (3)';
  return 'Low Intent (1–2)';
}

export function isFrequentCashHassle(freq: string): boolean {
  return /^Almost every day|^Sometimes/i.test(freq);
}

export function filterResponses(
  responses: SurveyResponse[],
  filters: SurveyFilters
): SurveyResponse[] {
  const query = filters.search.trim().toLowerCase();

  return responses.filter((item) => {
    if (filters.mode !== 'All' && !item.modesUsed.includes(filters.mode)) {
      return false;
    }

    if (filters.passStatus === 'Has Pass' && !item.hasTransitPass) {
      return false;
    }
    if (filters.passStatus === 'Cash / Tokens' && item.hasTransitPass) {
      return false;
    }

    if (filters.frequency !== 'All' && item.frequency !== filters.frequency) {
      return false;
    }

    if (filters.intentTier !== 'All' && getIntentTier(item.adoptionIntent) !== filters.intentTier) {
      return false;
    }

    if (query) {
      const haystack = [
        item.id,
        item.respondentName,
        item.route,
        item.occupation,
        item.modesUsed.join(' '),
        item.paymentHeadaches.join(' '),
        item.topReason,
        item.preferredFormat,
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

function computeMedian(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return Math.round(sorted[mid]);
}

export function computeOverviewMetrics(responses: SurveyResponse[]): OverviewMetrics {
  const totalCount = responses.length;
  if (totalCount === 0) {
    return {
      totalCount: 0,
      avgAdoptionIntent: 0,
      highIntentCount: 0,
      highIntentPct: 0,
      neutralCount: 0,
      neutralPct: 0,
      lowIntentCount: 0,
      lowIntentPct: 0,
      frequentHasslePct: 0,
      smartphoneWalletPct: 0,
      mrtPassPct: 0,
      medianFareBdt: 0,
      avgFareBdt: 0,
      multimodalPct: 0,
    };
  }

  let sumIntent = 0;
  let highIntentCount = 0;
  let neutralCount = 0;
  let lowIntentCount = 0;
  let hassleCount = 0;
  let smartphoneCount = 0;
  let passCount = 0;
  let multimodalCount = 0;
  const fares: number[] = [];

  for (const r of responses) {
    sumIntent += r.adoptionIntent;
    if (r.adoptionIntent >= 4) highIntentCount++;
    else if (r.adoptionIntent === 3) neutralCount++;
    else lowIntentCount++;

    if (isFrequentCashHassle(r.cashHassleFreq)) hassleCount++;
    if (/smartphone/i.test(r.mobileWalletUsage)) smartphoneCount++;
    if (r.hasTransitPass) passCount++;
    if (r.modesUsed.length >= 2) multimodalCount++;
    if (r.fareBdt !== null && r.fareBdt > 0) fares.push(r.fareBdt);
  }

  const highIntentPct = Math.round((highIntentCount / totalCount) * 100);
  const neutralPct = Math.round((neutralCount / totalCount) * 100);
  const lowIntentPct = Math.max(0, 100 - highIntentPct - neutralPct);

  const avgFareBdt =
    fares.length > 0 ? Math.round(fares.reduce((a, b) => a + b, 0) / fares.length) : 0;

  return {
    totalCount,
    avgAdoptionIntent: Number((sumIntent / totalCount).toFixed(2)),
    highIntentCount,
    highIntentPct,
    neutralCount,
    neutralPct,
    lowIntentCount,
    lowIntentPct,
    frequentHasslePct: Math.round((hassleCount / totalCount) * 100),
    smartphoneWalletPct: Math.round((smartphoneCount / totalCount) * 100),
    mrtPassPct: Math.round((passCount / totalCount) * 100),
    medianFareBdt: computeMedian(fares),
    avgFareBdt,
    multimodalPct: Math.round((multimodalCount / totalCount) * 100),
  };
}

export function computeRatingDistribution(responses: SurveyResponse[]): RatingBucket[] {
  const counts = [0, 0, 0, 0, 0];
  for (const r of responses) {
    const idx = Math.max(1, Math.min(5, Math.round(r.adoptionIntent))) - 1;
    counts[idx]++;
  }
  const total = responses.length;

  return [5, 4, 3, 2, 1].map((rating) => {
    const count = counts[rating - 1];
    return {
      rating,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
}

function summarizeGroup(label: string, items: SurveyResponse[], totalBase: number): CategoryMetric {
  const count = items.length;
  const avgIntent = items.reduce((acc, x) => acc + x.adoptionIntent, 0) / count;
  const highIntent = items.filter((x) => x.adoptionIntent >= 4).length;
  const hassle = items.filter((x) => isFrequentCashHassle(x.cashHassleFreq)).length;

  return {
    label,
    count,
    pct: totalBase > 0 ? Math.round((count / totalBase) * 100) : 0,
    avgIntent: Number(avgIntent.toFixed(2)),
    highIntentPct: Math.round((highIntent / count) * 100),
    frequentHasslePct: Math.round((hassle / count) * 100),
  };
}

export function computeSingleFieldBreakdown(
  responses: SurveyResponse[],
  key:
    | 'frequency'
    | 'cashHassleFreq'
    | 'extraTimeWasted'
    | 'lackedCashMoment'
    | 'mobileWalletUsage'
    | 'digitalPayFreq30d'
    | 'topReason'
    | 'preferredFormat'
    | 'speedRequirement'
    | 'q21Tradeoff'
    | 'q22Tradeoff'
    | 'ageGroup'
    | 'gender'
    | 'occupation'
    | 'incomeBracket'
    | 'transitPassStatus',
  customOrder?: readonly string[]
): CategoryMetric[] {
  const groups = new Map<string, SurveyResponse[]>();
  for (const r of responses) {
    const val = String(r[key] || 'Unspecified');
    const arr = groups.get(val);
    if (arr) arr.push(r);
    else groups.set(val, [r]);
  }

  const total = responses.length;
  const metrics: CategoryMetric[] = [];
  for (const [label, items] of groups.entries()) {
    metrics.push(summarizeGroup(label, items, total));
  }

  if (customOrder) {
    const orderMap = new Map(customOrder.map((v, idx) => [v, idx]));
    return metrics.sort((a, b) => {
      const ia = orderMap.get(a.label) ?? 999;
      const ib = orderMap.get(b.label) ?? 999;
      if (ia !== ib) return ia - ib;
      return b.count - a.count;
    });
  }

  return metrics.sort((a, b) => b.count - a.count);
}

export function computeMultiSelectBreakdown(
  responses: SurveyResponse[],
  key: 'modesUsed' | 'paymentHeadaches' | 'preferredPayMethods'
): CategoryMetric[] {
  const groups = new Map<string, SurveyResponse[]>();
  for (const r of responses) {
    const uniqueValues = Array.from(new Set(r[key]));
    for (const val of uniqueValues) {
      const arr = groups.get(val);
      if (arr) arr.push(r);
      else groups.set(val, [r]);
    }
  }

  const totalRespondents = responses.length;
  const metrics: CategoryMetric[] = [];
  for (const [label, items] of groups.entries()) {
    metrics.push(summarizeGroup(label, items, totalRespondents));
  }
  return metrics.sort((a, b) => b.count - a.count);
}

export function computeDailyTrend(responses: SurveyResponse[]): DailyTrendPoint[] {
  const byDate = new Map<string, SurveyResponse[]>();
  for (const r of responses) {
    const arr = byDate.get(r.submittedAt);
    if (arr) arr.push(r);
    else byDate.set(r.submittedAt, [r]);
  }

  return Array.from(byDate.keys())
    .sort()
    .map((date) => {
      const items = byDate.get(date)!;
      const avgIntent = items.reduce((acc, x) => acc + x.adoptionIntent, 0) / items.length;
      const highCount = items.filter((x) => x.adoptionIntent >= 4).length;
      const dailyCount = items.filter((x) => /^Almost daily/i.test(x.frequency)).length;
      const parts = date.split('-');
      const shortDate = parts.length === 3 ? `${parts[1]}/${parts[2]}` : date;
      return {
        date,
        shortDate,
        count: items.length,
        avgIntent: Number(avgIntent.toFixed(2)),
        highIntentPct: Math.round((highCount / items.length) * 100),
        dailyRiderPct: Math.round((dailyCount / items.length) * 100),
      };
    });
}

export function sortResponses(
  responses: SurveyResponse[],
  sortBy: SortField,
  sortDir: 'asc' | 'desc'
): SurveyResponse[] {
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...responses].sort((a, b) => {
    if (sortBy === 'adoptionIntent') return (a.adoptionIntent - b.adoptionIntent) * dir;
    if (sortBy === 'fareBdt') return ((a.fareBdt ?? 0) - (b.fareBdt ?? 0)) * dir;
    if (sortBy === 'frequency') return a.frequency.localeCompare(b.frequency) * dir;
    if (sortBy === 'cashHassleFreq') return a.cashHassleFreq.localeCompare(b.cashHassleFreq) * dir;
    return a.submittedAt.localeCompare(b.submittedAt) * dir;
  });
}

export function getDistinctModes(responses: SurveyResponse[]): string[] {
  const set = new Set<string>();
  for (const r of responses) {
    for (const m of r.modesUsed) {
      if (m && m !== 'Unspecified') set.add(m);
    }
  }
  return Array.from(set).sort();
}

export function getDistinctFrequencies(responses: SurveyResponse[]): string[] {
  const set = new Set<string>();
  for (const r of responses) {
    if (r.frequency) set.add(r.frequency);
  }
  return Array.from(set).sort();
}

export interface ExecutiveInsight {
  id: string;
  label: string;
  text: string;
}

export interface ExecutiveInsightsInput {
  metrics: OverviewMetrics;
  modeBreakdown: CategoryMetric[];
  headacheBreakdown: CategoryMetric[];
  passBreakdown: CategoryMetric[];
  q21Breakdown: CategoryMetric[];
  q22Breakdown: CategoryMetric[];
}

function pickExtremes(items: CategoryMetric[]): {
  highest: CategoryMetric | null;
  lowest: CategoryMetric | null;
} {
  const valid = items.filter((i) => i.label && i.label !== 'Unspecified' && i.count > 0);
  if (valid.length === 0) return { highest: null, lowest: null };

  // Prefer groups with at least 2 respondents when available to avoid 1-row noise
  const robust = valid.filter((i) => i.count >= 2);
  const pool = robust.length >= 2 ? robust : valid;

  const sortedByIntent = [...pool].sort((a, b) => {
    if (b.avgIntent !== a.avgIntent) return b.avgIntent - a.avgIntent;
    return b.count - a.count;
  });

  return {
    highest: sortedByIntent[0] ?? null,
    lowest: sortedByIntent[sortedByIntent.length - 1] ?? null,
  };
}

export function generateExecutiveInsights({
  metrics,
  modeBreakdown,
  headacheBreakdown,
  passBreakdown,
  q21Breakdown,
  q22Breakdown,
}: ExecutiveInsightsInput): ExecutiveInsight[] {
  if (metrics.totalCount === 0) return [];

  const insights: ExecutiveInsight[] = [];

  // 1. Friction extreme: top payment headache + mode with highest cash hassle rate
  const topHeadache = headacheBreakdown.find(
    (h) => h.label && !/none/i.test(h.label)
  ) ?? headacheBreakdown[0];

  const validModes = modeBreakdown.filter((m) => m.label && m.label !== 'Unspecified');
  const robustModes = validModes.filter((m) => m.count >= 2);
  const hasslePool = robustModes.length > 0 ? robustModes : validModes;
  const maxHassleMode = [...hasslePool].sort((a, b) => {
    if (b.frequentHasslePct !== a.frequentHasslePct) {
      return b.frequentHasslePct - a.frequentHasslePct;
    }
    return b.count - a.count;
  })[0];

  if (topHeadache && maxHassleMode) {
    insights.push({
      id: 'friction-extreme',
      label: 'Peak payment friction',
      text: `${topHeadache.label} is the top headache (${topHeadache.pct}% of cohort), while ${maxHassleMode.label} commuters report the highest cash hassle rate (${maxHassleMode.frequentHasslePct}%).`,
    });
  } else if (topHeadache) {
    insights.push({
      id: 'friction-extreme',
      label: 'Peak payment friction',
      text: `${topHeadache.label} affects ${topHeadache.pct}% of respondents, with ${metrics.frequentHasslePct}% facing cash hassles daily or weekly.`,
    });
  }

  // 2. Adoption intent extreme: highest vs lowest cohort (modes if >=2 distinct, else pass status)
  const modeExtremes = pickExtremes(validModes);
  const passExtremes = pickExtremes(passBreakdown);

  const useModes =
    modeExtremes.highest &&
    modeExtremes.lowest &&
    modeExtremes.highest.label !== modeExtremes.lowest.label;

  const chosenExtremes = useModes ? modeExtremes : passExtremes;

  if (
    chosenExtremes.highest &&
    chosenExtremes.lowest &&
    chosenExtremes.highest.label !== chosenExtremes.lowest.label
  ) {
    insights.push({
      id: 'intent-spread',
      label: 'Adoption intent spread',
      text: `Unified payment intent averages ${metrics.avgAdoptionIntent.toFixed(2)}/5.0 (${metrics.highIntentPct}% high intent); ${chosenExtremes.highest.label} leads at ${chosenExtremes.highest.avgIntent.toFixed(2)}/5.0 while ${chosenExtremes.lowest.label} is lowest at ${chosenExtremes.lowest.avgIntent.toFixed(2)}/5.0.`,
    });
  } else {
    insights.push({
      id: 'intent-spread',
      label: 'Adoption intent signal',
      text: `Unified payment intent averages ${metrics.avgAdoptionIntent.toFixed(2)}/5.0 across this cohort, with ${metrics.highIntentPct}% rating 4–5 and a median one-way spend of BDT ${metrics.medianFareBdt}.`,
    });
  }

  // 3. Trade-off extreme: dominant Q21 (Speed vs Coverage) & Q22 (Deposit vs Coverage)
  const topQ21 = q21Breakdown.find((q) => q.label !== 'Unspecified') ?? q21Breakdown[0];
  const topQ22 = q22Breakdown.find((q) => q.label !== 'Unspecified') ?? q22Breakdown[0];

  if (topQ21 && topQ22) {
    insights.push({
      id: 'tradeoff-extreme',
      label: 'Strongest payment preference',
      text: `${topQ21.label} leads Q21 at ${topQ21.pct}% (${topQ21.count}/${metrics.totalCount}), and ${topQ22.label} leads Q22 deposit sensitivity at ${topQ22.pct}%.`,
    });
  } else if (topQ21) {
    insights.push({
      id: 'tradeoff-extreme',
      label: 'Strongest payment preference',
      text: `${topQ21.label} is the dominant Q21 choice at ${topQ21.pct}% (${topQ21.count} of ${metrics.totalCount} respondents).`,
    });
  }

  return insights.slice(0, 3);
}

export function computePercentChange(current: number, baseline: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(baseline) || baseline === 0) {
    return null;
  }
  const raw = ((current - baseline) / Math.abs(baseline)) * 100;
  const rounded = Number(raw.toFixed(1));
  return Object.is(rounded, -0) ? 0 : rounded;
}

const MODE_SHORT_LABELS: Record<string, string> = {
  'Rickshaw (Cycle or Battery)': 'Rickshaw',
  'City Bus': 'City Bus',
  Walking: 'Walking',
  'CNG Auto-rickshaw': 'CNG Auto',
  'Metro Rail (MRT-6)': 'Metro Rail',
  'Hatirjheel Water Taxi': 'Water Taxi',
  'Ride-sharing (Uber / Pathao / Indrive)': 'Ride-share',
};

const PAY_SHORT_LABELS: Record<string, string> = {
  'Scan a QR code using bKash, Nagad, or another mobile wallet': 'Mobile QR',
  'Tap a smart card on a payment machine': 'Smart Card',
  'Pay through a dedicated transportation mobile app': 'Transit App',
  'Continue paying with cash': 'Cash Only',
  'No preference': 'No Pref',
};

const CLUSTER_ARCHETYPE_TITLES: Record<string, string> = {
  'Mobile QR': 'QR-First Riders',
  'Smart Card': 'Smart-Card Loyalists',
  'Transit App': 'App-Ready Riders',
  'Cash Only': 'Cash-Tied Segment',
  'No Pref': 'Flexible Payers',
};

function shortenModeLabel(mode: string): string {
  if (MODE_SHORT_LABELS[mode]) return MODE_SHORT_LABELS[mode];
  return mode.split('(')[0].trim();
}

function shortenPayLabel(method: string): string {
  if (PAY_SHORT_LABELS[method]) return PAY_SHORT_LABELS[method];
  return method.length > 18 ? `${method.slice(0, 16)}…` : method;
}

export function computeModePaymentMatrix(responses: SurveyResponse[]): ModePaymentMatrixData {
  if (responses.length === 0) {
    return {
      totalRespondents: 0,
      modes: [],
      paymentMethods: [],
      cells: [],
      clusters: [],
    };
  }

  const modeRespondents = new Map<string, SurveyResponse[]>();
  const payRespondents = new Map<string, SurveyResponse[]>();

  for (const r of responses) {
    for (const m of new Set(r.modesUsed)) {
      if (!m || m === 'Unspecified') continue;
      const arr = modeRespondents.get(m);
      if (arr) arr.push(r);
      else modeRespondents.set(m, [r]);
    }
    for (const p of new Set(r.preferredPayMethods)) {
      if (!p || p === 'Unspecified' || p === 'Early Pilot Concern Note') continue;
      const arr = payRespondents.get(p);
      if (arr) arr.push(r);
      else payRespondents.set(p, [r]);
    }
  }

  const modes = Array.from(modeRespondents.entries())
    .map(([label, items]) => ({
      label,
      shortLabel: shortenModeLabel(label),
      count: items.length,
    }))
    .sort((a, b) => b.count - a.count);

  const paymentMethods = Array.from(payRespondents.entries())
    .map(([label, items]) => ({
      label,
      shortLabel: shortenPayLabel(label),
      count: items.length,
    }))
    .sort((a, b) => b.count - a.count);

  const n = responses.length;
  const cells: ModePaymentCell[] = [];

  for (const modeInfo of modes) {
    const modeItems = modeRespondents.get(modeInfo.label) ?? [];
    const modeTotal = modeItems.length;

    for (const payInfo of paymentMethods) {
      const payTotal = payInfo.count;
      const matched = modeItems.filter((r) => r.preferredPayMethods.includes(payInfo.label));
      const count = matched.length;
      const modeSharePct = modeTotal > 0 ? Math.round((count / modeTotal) * 100) : 0;
      const overallPaymentSharePct = n > 0 ? Math.round((payTotal / n) * 100) : 0;
      const expectedRatio = n > 0 ? payTotal / n : 0;
      const actualRatio = modeTotal > 0 ? count / modeTotal : 0;
      const lift =
        expectedRatio > 0 ? Number((actualRatio / expectedRatio).toFixed(2)) : 0;

      // Exact Pearson phi correlation between binary mode usage and binary payment preference
      const denom = Math.sqrt(
        modeTotal * Math.max(0, n - modeTotal) * payTotal * Math.max(0, n - payTotal)
      );
      const correlation =
        denom > 0 ? Number((((count * n - modeTotal * payTotal) / denom)).toFixed(2)) : 0;

      const avgIntent =
        count > 0
          ? Number(
              (matched.reduce((sum, x) => sum + x.adoptionIntent, 0) / count).toFixed(2)
            )
          : 0;
      const highIntentPct =
        count > 0
          ? Math.round((matched.filter((x) => x.adoptionIntent >= 4).length / count) * 100)
          : 0;
      const frequentHasslePct =
        count > 0
          ? Math.round(
              (matched.filter((x) => isFrequentCashHassle(x.cashHassleFreq)).length / count) * 100
            )
          : 0;

      const corridorCounts = new Map<string, number>();
      for (const r of matched) {
        if (!r.route || /unspecified/i.test(r.route)) continue;
        corridorCounts.set(r.route, (corridorCounts.get(r.route) ?? 0) + 1);
      }
      const sampleCorridors = Array.from(corridorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([route]) => route);

      cells.push({
        mode: modeInfo.label,
        modeShort: modeInfo.shortLabel,
        paymentMethod: payInfo.label,
        paymentShort: payInfo.shortLabel,
        count,
        modeTotal,
        paymentTotal: payTotal,
        modeSharePct,
        overallPaymentSharePct,
        lift,
        correlation,
        avgIntent,
        highIntentPct,
        frequentHasslePct,
        sampleCorridors,
        matchingIds: matched.map((r) => r.id),
      });
    }
  }

  // Identify standout commuter clusters across distinct payment channels
  const minClusterCount = n >= 12 ? 2 : 1;
  const clusters: CommuterCluster[] = [];

  for (const payInfo of paymentMethods) {
    if (payInfo.shortLabel === 'No Pref') continue;
    const candidates = cells.filter(
      (c) => c.paymentMethod === payInfo.label && c.count >= minClusterCount
    );
    if (candidates.length === 0) continue;

    const top = [...candidates].sort((a, b) => {
      // Favor strongest positive correlation first, then lift, then share & count
      if (b.correlation !== a.correlation) return b.correlation - a.correlation;
      if (b.lift !== a.lift) return b.lift - a.lift;
      if (b.modeSharePct !== a.modeSharePct) return b.modeSharePct - a.modeSharePct;
      return b.count - a.count;
    })[0];

    const archetype = CLUSTER_ARCHETYPE_TITLES[top.paymentShort] ?? `${top.paymentShort} Cluster`;
    const corrLabel = top.correlation >= 0 ? `+${top.correlation.toFixed(2)}` : top.correlation.toFixed(2);

    clusters.push({
      id: `${top.modeShort}-${top.paymentShort}`,
      title: `${top.modeShort} · ${archetype}`,
      subtitle: `${top.modeSharePct}% of ${top.modeShort} riders pick ${top.paymentShort} (r = ${corrLabel}, ${top.lift.toFixed(2)}× cohort rate).`,
      mode: top.mode,
      modeShort: top.modeShort,
      paymentMethod: top.paymentMethod,
      paymentShort: top.paymentShort,
      count: top.count,
      modeSharePct: top.modeSharePct,
      correlation: top.correlation,
      lift: top.lift,
      avgIntent: top.avgIntent,
      frequentHasslePct: top.frequentHasslePct,
    });
  }

  clusters.sort((a, b) => {
    if (b.correlation !== a.correlation) return b.correlation - a.correlation;
    if (b.modeSharePct !== a.modeSharePct) return b.modeSharePct - a.modeSharePct;
    return b.count - a.count;
  });

  return {
    totalRespondents: n,
    modes,
    paymentMethods,
    cells,
    clusters: clusters.slice(0, 4),
  };
}

export interface ComparisonSegmentDefinition extends ComparisonSegmentMeta {
  predicate: (r: SurveyResponse) => boolean;
}

export const COMPARISON_SEGMENTS: ComparisonSegmentDefinition[] = [
  {
    id: 'frequent',
    label: 'Frequent Riders (5–7 days/wk)',
    shortLabel: 'Frequent (5–7d)',
    group: 'Frequency',
    predicate: (r) => /^Almost daily/i.test(r.frequency),
  },
  {
    id: 'occasional',
    label: 'Occasional Riders (≤4 days/wk)',
    shortLabel: 'Occasional (≤4d)',
    group: 'Frequency',
    predicate: (r) => !/^Almost daily/i.test(r.frequency),
  },
  {
    id: 'weekly-2-4',
    label: 'Mid-Week Riders (2–4 days/wk)',
    shortLabel: '2–4 Days/Wk',
    group: 'Frequency',
    predicate: (r) => /^2–4 days/i.test(r.frequency),
  },
  {
    id: 'rare-1-or-less',
    label: 'Infrequent Riders (≤1 day/wk)',
    shortLabel: '≤1 Day/Wk',
    group: 'Frequency',
    predicate: (r) => /^1 day a week/i.test(r.frequency),
  },
  {
    id: 'has-pass',
    label: 'MRT / Rapid Pass Holders',
    shortLabel: 'Pass Holders',
    group: 'Pass & Wallet',
    predicate: (r) => r.hasTransitPass,
  },
  {
    id: 'cash-tokens',
    label: 'Cash & Paper Token Riders',
    shortLabel: 'Cash / Tokens',
    group: 'Pass & Wallet',
    predicate: (r) => !r.hasTransitPass,
  },
  {
    id: 'smartphone-wallet',
    label: 'Smartphone Wallet Users',
    shortLabel: 'Mobile Wallet',
    group: 'Pass & Wallet',
    predicate: (r) => /smartphone/i.test(r.mobileWalletUsage),
  },
  {
    id: 'non-smartphone',
    label: 'Cash-First / Non-App Payers',
    shortLabel: 'Non-Smartphone',
    group: 'Pass & Wallet',
    predicate: (r) => !/smartphone/i.test(r.mobileWalletUsage),
  },
  {
    id: 'metro-riders',
    label: 'Metro Rail (MRT-6) Riders',
    shortLabel: 'Metro Rail',
    group: 'Transit Mode',
    predicate: (r) => r.modesUsed.includes('Metro Rail (MRT-6)'),
  },
  {
    id: 'bus-riders',
    label: 'City Bus Riders',
    shortLabel: 'City Bus',
    group: 'Transit Mode',
    predicate: (r) => r.modesUsed.includes('City Bus'),
  },
  {
    id: 'cng-riders',
    label: 'CNG Auto-rickshaw Riders',
    shortLabel: 'CNG Auto',
    group: 'Transit Mode',
    predicate: (r) => r.modesUsed.includes('CNG Auto-rickshaw'),
  },
  {
    id: 'rickshaw-riders',
    label: 'Rickshaw Riders',
    shortLabel: 'Rickshaw',
    group: 'Transit Mode',
    predicate: (r) => r.modesUsed.includes('Rickshaw (Cycle or Battery)'),
  },
  {
    id: 'high-intent',
    label: 'Ready to Switch (Score 4–5)',
    shortLabel: 'Ready (4–5)',
    group: 'Intent & Demographics',
    predicate: (r) => r.adoptionIntent >= 4,
  },
  {
    id: 'skeptical-intent',
    label: 'Neutral / Skeptical (Score 1–3)',
    shortLabel: 'Skeptical (1–3)',
    group: 'Intent & Demographics',
    predicate: (r) => r.adoptionIntent <= 3,
  },
  {
    id: 'students',
    label: 'Students',
    shortLabel: 'Students',
    group: 'Intent & Demographics',
    predicate: (r) => r.occupation === 'Student',
  },
  {
    id: 'working',
    label: 'Working / Self-Employed',
    shortLabel: 'Working',
    group: 'Intent & Demographics',
    predicate: (r) => r.occupation !== 'Student' && r.occupation !== 'Unspecified',
  },
  {
    id: 'female',
    label: 'Female Commuters',
    shortLabel: 'Female',
    group: 'Intent & Demographics',
    predicate: (r) => r.gender === 'Female',
  },
  {
    id: 'male',
    label: 'Male Commuters',
    shortLabel: 'Male',
    group: 'Intent & Demographics',
    predicate: (r) => r.gender === 'Male',
  },
  {
    id: 'all',
    label: 'All Active Filtered Riders',
    shortLabel: 'All Filtered',
    group: 'All',
    predicate: () => true,
  },
];

function buildComparisonItems(
  segA: SurveyResponse[],
  segB: SurveyResponse[],
  specs: Array<{ label: string; fullLabel: string; test: (r: SurveyResponse) => boolean }>
): ComparisonBarItem[] {
  return specs.map((spec) => {
    const aCount = segA.filter(spec.test).length;
    const bCount = segB.filter(spec.test).length;
    const aPct = segA.length > 0 ? Math.round((aCount / segA.length) * 100) : 0;
    const bPct = segB.length > 0 ? Math.round((bCount / segB.length) * 100) : 0;
    return {
      label: spec.label,
      fullLabel: spec.fullLabel,
      aPct,
      bPct,
      aCount,
      bCount,
      diffPts: aPct - bPct,
    };
  });
}

export function computeSegmentComparison(
  responses: SurveyResponse[],
  segmentAId: string,
  segmentBId: string
): SegmentComparisonResult {
  const defA = COMPARISON_SEGMENTS.find((s) => s.id === segmentAId) ?? COMPARISON_SEGMENTS[0];
  const defB = COMPARISON_SEGMENTS.find((s) => s.id === segmentBId) ?? COMPARISON_SEGMENTS[1];

  const itemsA = responses.filter(defA.predicate);
  const itemsB = responses.filter(defB.predicate);

  const breakdowns: ComparisonBreakdownSection[] = [
    {
      id: 'modes',
      title: 'Transit Modes Used',
      subtitle: 'Share of each segment riding each transport mode.',
      items: buildComparisonItems(itemsA, itemsB, [
        { label: 'Rickshaw', fullLabel: 'Rickshaw (Cycle or Battery)', test: (r) => r.modesUsed.includes('Rickshaw (Cycle or Battery)') },
        { label: 'City Bus', fullLabel: 'City Bus', test: (r) => r.modesUsed.includes('City Bus') },
        { label: 'Walking', fullLabel: 'Walking', test: (r) => r.modesUsed.includes('Walking') },
        { label: 'CNG Auto', fullLabel: 'CNG Auto-rickshaw', test: (r) => r.modesUsed.includes('CNG Auto-rickshaw') },
        { label: 'Metro Rail', fullLabel: 'Metro Rail (MRT-6)', test: (r) => r.modesUsed.includes('Metro Rail (MRT-6)') },
        { label: 'Water Taxi', fullLabel: 'Hatirjheel Water Taxi', test: (r) => r.modesUsed.includes('Hatirjheel Water Taxi') },
      ]),
    },
    {
      id: 'headaches',
      title: 'Cash Payment Headaches',
      subtitle: 'Friction points experienced while paying cash fares.',
      items: buildComparisonItems(itemsA, itemsB, [
        { label: 'Small Change', fullLabel: "Driver or conductor doesn't have exact small change", test: (r) => r.paymentHeadaches.some((h) => /small change/i.test(h)) },
        { label: 'Fare Bargaining', fullLabel: 'Bargaining or getting overcharged on fares', test: (r) => r.paymentHeadaches.some((h) => /bargaining|overcharged/i.test(h)) },
        { label: 'Ticket Queues', fullLabel: 'Waiting in long ticket counter or token machine lines', test: (r) => r.paymentHeadaches.some((h) => /ticket counter|token machine/i.test(h)) },
        { label: 'Post-Metro Cash', fullLabel: 'Having to scramble for cash for a rickshaw right after taking the metro', test: (r) => r.paymentHeadaches.some((h) => /scramble for cash/i.test(h)) },
        { label: 'Card Top-Up', fullLabel: 'Recharging transit cards is inconvenient (limited booths/hours)', test: (r) => r.paymentHeadaches.some((h) => /recharging/i.test(h)) },
      ]),
    },
    {
      id: 'pay-methods',
      title: 'Preferred Pay Channels',
      subtitle: 'Preferred cashless (or cash) checkout methods across segments.',
      items: buildComparisonItems(itemsA, itemsB, [
        { label: 'Mobile QR', fullLabel: 'Scan a QR code using bKash, Nagad, or another mobile wallet', test: (r) => r.preferredPayMethods.includes('Scan a QR code using bKash, Nagad, or another mobile wallet') },
        { label: 'Smart Card', fullLabel: 'Tap a smart card on a payment machine', test: (r) => r.preferredPayMethods.includes('Tap a smart card on a payment machine') },
        { label: 'Transit App', fullLabel: 'Pay through a dedicated transportation mobile app', test: (r) => r.preferredPayMethods.includes('Pay through a dedicated transportation mobile app') },
        { label: 'Cash Only', fullLabel: 'Continue paying with cash', test: (r) => r.preferredPayMethods.includes('Continue paying with cash') },
      ]),
    },
    {
      id: 'readiness',
      title: 'Adoption Intent & Speed',
      subtitle: 'Willingness to switch (1–5) and checkout speed expectations.',
      items: buildComparisonItems(itemsA, itemsB, [
        { label: 'Ready (4–5)', fullLabel: 'High adoption intent (score 4 or 5)', test: (r) => r.adoptionIntent >= 4 },
        { label: 'Neutral (3)', fullLabel: 'Neutral adoption intent (score 3)', test: (r) => r.adoptionIntent === 3 },
        { label: 'Low (1–2)', fullLabel: 'Low adoption intent (score 1 or 2)', test: (r) => r.adoptionIntent <= 2 },
        { label: 'Tap < 2s', fullLabel: 'Instant tap (under 2 seconds)', test: (r) => /under 2 seconds/i.test(r.speedRequirement) },
        { label: 'Scan 3–5s', fullLabel: 'Quick scan (3 to 5 seconds)', test: (r) => /3 to 5 seconds/i.test(r.speedRequirement) },
      ]),
    },
    {
      id: 'tradeoffs',
      title: 'Product Trade-off Choices',
      subtitle: 'How each segment weighs speed, low deposits, and full coverage.',
      items: buildComparisonItems(itemsA, itemsB, [
        { label: 'Q21: Mobile QR', fullLabel: 'Option B: Mobile QR (5s, Free, All Modes)', test: (r) => r.q21Tradeoff.startsWith('Option B:') },
        { label: 'Q21: Smart Card', fullLabel: 'Option A: Smart Card (2s, Tk 100, Metro & Bus)', test: (r) => r.q21Tradeoff.startsWith('Option A:') },
        { label: 'Q22: ৳50 Card', fullLabel: 'Option A: 50 Tk Card (Metro, Bus, Rickshaw)', test: (r) => r.q22Tradeoff.startsWith('Option A:') },
        { label: 'Q22: ৳200 Full', fullLabel: 'Option B: 200 Tk Card (All Modes incl. CNG & Water)', test: (r) => r.q22Tradeoff.startsWith('Option B:') },
      ]),
    },
    {
      id: 'format',
      title: 'Format & Digital Habits',
      subtitle: 'Preferred physical vs phone form factor and current wallet use.',
      items: buildComparisonItems(itemsA, itemsB, [
        { label: 'Smartphone Wallet', fullLabel: 'Actively uses mobile wallet on smartphone', test: (r) => /smartphone/i.test(r.mobileWalletUsage) },
        { label: 'Digital Weekly+', fullLabel: 'Pays digitally daily or frequently (6+ times/30d)', test: (r) => /daily|frequently/i.test(r.digitalPayFreq30d) },
        { label: 'Prefer Tap Card', fullLabel: 'Tap card (fast tap-and-go like MRT pass)', test: (r) => /tap card/i.test(r.preferredFormat) },
        { label: 'Prefer Phone QR', fullLabel: 'Mobile QR code on phone (like bKash / Bangla QR)', test: (r) => /mobile qr/i.test(r.preferredFormat) },
        { label: 'Either Format', fullLabel: 'Either is fine', test: (r) => /either/i.test(r.preferredFormat) },
      ]),
    },
  ];

  const stripPredicate = ({ predicate: _p, ...meta }: ComparisonSegmentDefinition): ComparisonSegmentMeta => meta;

  return {
    segmentA: {
      meta: stripPredicate(defA),
      metrics: computeOverviewMetrics(itemsA),
    },
    segmentB: {
      meta: stripPredicate(defB),
      metrics: computeOverviewMetrics(itemsB),
    },
    breakdowns,
  };
}


