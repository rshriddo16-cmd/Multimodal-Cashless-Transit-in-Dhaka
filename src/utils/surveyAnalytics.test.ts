import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseSurveyInput } from './csvParser';
import {
  computeDailyTrend,
  computeModePaymentMatrix,
  computeMultiSelectBreakdown,
  computeOverviewMetrics,
  computePercentChange,
  computeRatingDistribution,
  computeSegmentComparison,
  computeSingleFieldBreakdown,
  filterResponses,
  generateExecutiveInsights,
  getIntentTier,
  sortResponses,
} from './surveyAnalytics';
import type { SurveyFilters } from '../types/survey';

const REAL_CSV_PATH = path.resolve(
  process.cwd(),
  'public/assets/aistudio/Commuter_Survey_-_Multimodal_Cashless_Transit_in_Dhaka_baab162c.csv'
);
const REAL_RESPONSES = parseSurveyInput(fs.readFileSync(REAL_CSV_PATH, 'utf8')).responses;

const EMPTY_FILTERS: SurveyFilters = {
  search: '',
  mode: 'All',
  passStatus: 'All',
  frequency: 'All',
  intentTier: 'All',
};

test('getIntentTier classifies 1-5 adoption scores accurately', () => {
  assert.equal(getIntentTier(5), 'High Intent (4–5)');
  assert.equal(getIntentTier(4), 'High Intent (4–5)');
  assert.equal(getIntentTier(3), 'Neutral (3)');
  assert.equal(getIntentTier(2), 'Low Intent (1–2)');
  assert.equal(getIntentTier(1), 'Low Intent (1–2)');
});

test('computeOverviewMetrics computes accurate metrics on 100 Dhaka responses', () => {
  const m = computeOverviewMetrics(REAL_RESPONSES);
  assert.equal(m.totalCount, 100);
  assert.ok(m.avgAdoptionIntent >= 3.5 && m.avgAdoptionIntent <= 4.5);
  assert.ok(m.medianFareBdt >= 50 && m.medianFareBdt <= 250);
  assert.equal(m.highIntentPct + m.neutralPct + m.lowIntentPct, 100);
});

test('computeOverviewMetrics handles empty dataset safely', () => {
  const m = computeOverviewMetrics([]);
  assert.equal(m.totalCount, 0);
  assert.equal(m.avgAdoptionIntent, 0);
  assert.equal(m.medianFareBdt, 0);
});

test('filterResponses filters by mode, passStatus, intentTier, and search', () => {
  const metro = filterResponses(REAL_RESPONSES, {
    ...EMPTY_FILTERS,
    mode: 'Metro Rail (MRT-6)',
  });
  assert.ok(metro.length > 0 && metro.length < 100);
  assert.ok(metro.every((r) => r.modesUsed.includes('Metro Rail (MRT-6)')));

  const hasPass = filterResponses(REAL_RESPONSES, {
    ...EMPTY_FILTERS,
    passStatus: 'Has Pass',
  });
  assert.ok(hasPass.every((r) => r.hasTransitPass));

  const mirpur = filterResponses(REAL_RESPONSES, {
    ...EMPTY_FILTERS,
    search: 'mirpur',
  });
  assert.ok(mirpur.length > 0);
});

test('computeMultiSelectBreakdown counts Metro Rail and Rickshaw across multi-mode trips', () => {
  const modes = computeMultiSelectBreakdown(REAL_RESPONSES, 'modesUsed');
  assert.ok(modes.some((m) => m.label === 'Rickshaw (Cycle or Battery)'));
  assert.ok(modes.some((m) => m.label === 'Metro Rail (MRT-6)'));
});

test('computeSingleFieldBreakdown normalizes Q21 and Q22 cleanly', () => {
  const q21 = computeSingleFieldBreakdown(REAL_RESPONSES, 'q21Tradeoff');
  assert.ok(q21.some((x) => x.label.startsWith('Option A:')));
  assert.ok(q21.some((x) => x.label.startsWith('Option B:')));
});

test('computeRatingDistribution sums to total count', () => {
  const dist = computeRatingDistribution(REAL_RESPONSES);
  assert.equal(dist.length, 5);
  const sum = dist.reduce((acc, b) => acc + b.count, 0);
  assert.equal(sum, 100);
});

test('computeDailyTrend sorts chronologically from Nov 4 to Nov 18', () => {
  const trend = computeDailyTrend(REAL_RESPONSES);
  assert.equal(trend[0].date, '2026-11-04');
  assert.equal(trend[trend.length - 1].date, '2026-11-18');
  assert.ok(trend.every((pt) => pt.dailyRiderPct >= 0 && pt.dailyRiderPct <= 100));
});

test('sortResponses sorts by adoptionIntent and fareBdt accurately', () => {
  const sorted = sortResponses(REAL_RESPONSES, 'adoptionIntent', 'asc');
  assert.equal(sorted[0].adoptionIntent, 1);
  const desc = sortResponses(REAL_RESPONSES, 'adoptionIntent', 'desc');
  assert.equal(desc[0].adoptionIntent, 5);
});

test('generateExecutiveInsights identifies top 3 extremes for full and filtered cohorts', () => {
  const buildInsights = (subset: typeof REAL_RESPONSES) =>
    generateExecutiveInsights({
      metrics: computeOverviewMetrics(subset),
      modeBreakdown: computeMultiSelectBreakdown(subset, 'modesUsed'),
      headacheBreakdown: computeMultiSelectBreakdown(subset, 'paymentHeadaches'),
      passBreakdown: computeSingleFieldBreakdown(subset, 'transitPassStatus'),
      q21Breakdown: computeSingleFieldBreakdown(subset, 'q21Tradeoff'),
      q22Breakdown: computeSingleFieldBreakdown(subset, 'q22Tradeoff'),
    });

  const fullInsights = buildInsights(REAL_RESPONSES);
  assert.equal(fullInsights.length, 3);
  assert.ok(fullInsights.every((item) => item.label.length > 0 && item.text.length > 0));

  const metroSubset = filterResponses(REAL_RESPONSES, {
    ...EMPTY_FILTERS,
    mode: 'Metro Rail (MRT-6)',
  });
  const metroInsights = buildInsights(metroSubset);
  assert.equal(metroInsights.length, 3);
  assert.notEqual(metroInsights[0].text, fullInsights[0].text);

  const singleGroupSubset = metroSubset.slice(0, 1);
  const singleInsights = buildInsights(singleGroupSubset);
  assert.ok(singleInsights.length >= 1 && singleInsights.length <= 3);

  const emptyInsights = buildInsights([]);
  assert.deepEqual(emptyInsights, []);
});

test('computePercentChange calculates filtered vs baseline deltas accurately', () => {
  assert.equal(computePercentChange(4.2, 4.01), 4.7);
  assert.equal(computePercentChange(80, 100), -20);
  assert.equal(computePercentChange(62, 62), 0);
  assert.equal(computePercentChange(10, 0), null);
});

test('computeModePaymentMatrix builds accurate mode x payment cells and clusters', () => {
  const matrix = computeModePaymentMatrix(REAL_RESPONSES);
  assert.equal(matrix.totalRespondents, 100);
  assert.ok(matrix.modes.length >= 5);
  assert.ok(matrix.paymentMethods.length >= 4);
  assert.equal(matrix.cells.length, matrix.modes.length * matrix.paymentMethods.length);
  assert.ok(
    matrix.cells.every(
      (c) =>
        c.modeSharePct >= 0 &&
        c.modeSharePct <= 100 &&
        c.correlation >= -1 &&
        c.correlation <= 1 &&
        c.count <= c.modeTotal
    )
  );
  assert.ok(matrix.clusters.length >= 3 && matrix.clusters.length <= 4);

  const emptyMatrix = computeModePaymentMatrix([]);
  assert.equal(emptyMatrix.totalRespondents, 0);
  assert.deepEqual(emptyMatrix.cells, []);
  assert.deepEqual(emptyMatrix.clusters, []);
});

test('computeSegmentComparison compares Frequent vs Occasional riders across all core breakdowns', () => {
  const result = computeSegmentComparison(REAL_RESPONSES, 'frequent', 'occasional');
  assert.equal(result.segmentA.metrics.totalCount + result.segmentB.metrics.totalCount, 100);
  assert.equal(result.breakdowns.length, 6);
  for (const section of result.breakdowns) {
    assert.ok(section.items.length >= 4);
    for (const item of section.items) {
      assert.ok(item.aPct >= 0 && item.aPct <= 100);
      assert.ok(item.bPct >= 0 && item.bPct <= 100);
      assert.equal(item.diffPts, item.aPct - item.bPct);
    }
  }
});



