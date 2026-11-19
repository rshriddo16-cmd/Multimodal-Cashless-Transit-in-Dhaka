export type IntentTier = 'High Intent (4–5)' | 'Neutral (3)' | 'Low Intent (1–2)';

export type DashboardView = 'overview' | 'segments' | 'tradeoffs' | 'responses';

export type SortField =
  | 'submittedAt'
  | 'adoptionIntent'
  | 'fareBdt'
  | 'frequency'
  | 'cashHassleFreq';

export interface SurveyResponse {
  id: string;
  submittedAt: string; // YYYY-MM-DD
  submittedTimestamp: string;
  respondentName: string;
  ageGroup: string;
  gender: string;
  occupation: string;
  incomeBracket: string;
  route: string;
  frequency: string;
  hasTransitPass: boolean;
  transitPassStatus: string;
  modesUsed: string[];
  fareBdt: number | null;
  cashHassleFreq: string;
  paymentHeadaches: string[];
  extraTimeWasted: string;
  lackedCashMoment: string;
  mobileWalletUsage: string;
  digitalPayFreq30d: string;
  adoptionIntent: number; // 1 to 5
  topReason: string;
  preferredPayMethods: string[];
  preferredFormat: string;
  speedRequirement: string;
  q21Tradeoff: string; // Smart Card (2s, Tk 100) vs Mobile QR (5s, Free, All Modes)
  q22Tradeoff: string; // 50 Tk Low Deposit vs 200 Tk Full Coverage
}

export interface SurveyFilters {
  search: string;
  mode: string;
  passStatus: 'All' | 'Has Pass' | 'Cash / Tokens';
  frequency: string;
  intentTier: 'All' | IntentTier;
}

export interface OverviewMetrics {
  totalCount: number;
  avgAdoptionIntent: number;
  highIntentCount: number;
  highIntentPct: number;
  neutralCount: number;
  neutralPct: number;
  lowIntentCount: number;
  lowIntentPct: number;
  frequentHasslePct: number; // Almost every day + Sometimes
  smartphoneWalletPct: number;
  mrtPassPct: number;
  medianFareBdt: number;
  avgFareBdt: number;
  multimodalPct: number; // 2+ modes combined
}

export interface RatingBucket {
  rating: number;
  count: number;
  pct: number;
}

export interface CategoryMetric {
  label: string;
  count: number;
  pct: number;
  avgIntent: number;
  highIntentPct: number;
  frequentHasslePct: number;
}

export interface DailyTrendPoint {
  date: string;
  shortDate: string;
  count: number;
  avgIntent: number;
  highIntentPct: number;
  dailyRiderPct: number;
}

export interface ModePaymentCell {
  mode: string;
  modeShort: string;
  paymentMethod: string;
  paymentShort: string;
  count: number;
  modeTotal: number;
  paymentTotal: number;
  modeSharePct: number;
  overallPaymentSharePct: number;
  lift: number;
  correlation: number;
  avgIntent: number;
  highIntentPct: number;
  frequentHasslePct: number;
  sampleCorridors: string[];
  matchingIds: string[];
}

export interface CommuterCluster {
  id: string;
  title: string;
  subtitle: string;
  mode: string;
  modeShort: string;
  paymentMethod: string;
  paymentShort: string;
  count: number;
  modeSharePct: number;
  correlation: number;
  lift: number;
  avgIntent: number;
  frequentHasslePct: number;
}

export interface ModePaymentMatrixData {
  totalRespondents: number;
  modes: Array<{ label: string; shortLabel: string; count: number }>;
  paymentMethods: Array<{ label: string; shortLabel: string; count: number }>;
  cells: ModePaymentCell[];
  clusters: CommuterCluster[];
}

export interface ComparisonSegmentMeta {
  id: string;
  label: string;
  shortLabel: string;
  group: 'Frequency' | 'Pass & Wallet' | 'Transit Mode' | 'Intent & Demographics' | 'All';
}

export interface ComparisonBarItem {
  label: string;
  fullLabel: string;
  aPct: number;
  bPct: number;
  aCount: number;
  bCount: number;
  diffPts: number;
}

export interface ComparisonBreakdownSection {
  id: string;
  title: string;
  subtitle: string;
  items: ComparisonBarItem[];
}

export interface SegmentComparisonResult {
  segmentA: {
    meta: ComparisonSegmentMeta;
    metrics: OverviewMetrics;
  };
  segmentB: {
    meta: ComparisonSegmentMeta;
    metrics: OverviewMetrics;
  };
  breakdowns: ComparisonBreakdownSection[];
}


