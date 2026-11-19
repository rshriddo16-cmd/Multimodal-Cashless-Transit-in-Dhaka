import { AlertCircle, ArrowUp, ArrowUpRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ComparisonView } from './components/ComparisonView';
import { FilterBar } from './components/FilterBar';
import { HeroSpread } from './components/HeroSpread';
import { ImportModal } from './components/ImportModal';
import { InteractionMatrix } from './components/InteractionMatrix';
import { ResponsesView } from './components/ResponsesView';
import { StoryView, type SceneId } from './components/StoryView';
import { SurveyPulse } from './components/SurveyPulse';
import type { SortField, SurveyFilters, SurveyResponse } from './types/survey';
import { exportResponsesToCsv, parseSurveyInput } from './utils/csvParser';
import {
  computeDailyTrend,
  computeModePaymentMatrix,
  computeMultiSelectBreakdown,
  computeOverviewMetrics,
  computeRatingDistribution,
  computeSingleFieldBreakdown,
  filterResponses,
  generateExecutiveInsights,
  getDistinctModes,
  sortResponses,
} from './utils/surveyAnalytics';

const ATTACHED_CSV_URL =
  '/assets/aistudio/Commuter_Survey_-_Multimodal_Cashless_Transit_in_Dhaka_baab162c.csv';

const INITIAL_FILTERS: SurveyFilters = {
  search: '',
  mode: 'All',
  passStatus: 'All',
  frequency: 'All',
  intentTier: 'All',
};

const STORAGE_KEY = 'transitpulse_dhaka_custom_v1';

export default function App() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [datasetLabel, setDatasetLabel] = useState('Dhaka Multimodal Cashless Transit');
  const [isCustomDataset, setIsCustomDataset] = useState(false);

  const [activeSceneLabel, setActiveSceneLabel] = useState<string>('01 / 06 · RIDERS');
  const [requestedScene, setRequestedScene] = useState<{ id: SceneId; nonce: number } | null>(null);
  const [filters, setFilters] = useState<SurveyFilters>(INITIAL_FILTERS);
  const [sortBy, setSortBy] = useState<SortField>('submittedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [importModalOpen, setImportModalOpen] = useState(false);

  const loadAttachedCsv = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(ATTACHED_CSV_URL);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} loading survey CSV`);
      }
      const csvText = await res.text();
      const parsed = parseSurveyInput(csvText);
      if (parsed.error) {
        throw new Error(parsed.error);
      }
      setResponses(parsed.responses);
      setDatasetLabel('Dhaka Multimodal Cashless Transit');
      setIsCustomDataset(false);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load survey CSV.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let usedCustom = false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          responses?: SurveyResponse[];
          label?: string;
        };
        if (Array.isArray(parsed.responses) && parsed.responses.length > 0) {
          setResponses(parsed.responses);
          setDatasetLabel(parsed.label || 'Imported Survey');
          setIsCustomDataset(true);
          setLoading(false);
          usedCustom = true;
        }
      }
    } catch {
      // Fall back to attached CSV
    }

    if (!usedCustom) {
      void loadAttachedCsv();
    }
  }, []);

  const modes = useMemo(() => getDistinctModes(responses), [responses]);

  const filteredResponses = useMemo(
    () => filterResponses(responses, filters),
    [responses, filters]
  );

  const sortedResponses = useMemo(
    () => sortResponses(filteredResponses, sortBy, sortDir),
    [filteredResponses, sortBy, sortDir]
  );

  const baselineMetrics = useMemo(() => computeOverviewMetrics(responses), [responses]);
  const metrics = useMemo(() => computeOverviewMetrics(filteredResponses), [filteredResponses]);
  const ratingDist = useMemo(
    () => computeRatingDistribution(filteredResponses),
    [filteredResponses]
  );

  const modeBreakdown = useMemo(
    () => computeMultiSelectBreakdown(filteredResponses, 'modesUsed'),
    [filteredResponses]
  );
  const headacheBreakdown = useMemo(
    () => computeMultiSelectBreakdown(filteredResponses, 'paymentHeadaches'),
    [filteredResponses]
  );
  const payMethodBreakdown = useMemo(
    () => computeMultiSelectBreakdown(filteredResponses, 'preferredPayMethods'),
    [filteredResponses]
  );
  const occupationBreakdown = useMemo(
    () => computeSingleFieldBreakdown(filteredResponses, 'occupation'),
    [filteredResponses]
  );
  const passBreakdown = useMemo(
    () => computeSingleFieldBreakdown(filteredResponses, 'transitPassStatus'),
    [filteredResponses]
  );
  const timeWastedBreakdown = useMemo(
    () =>
      computeSingleFieldBreakdown(filteredResponses, 'extraTimeWasted', [
        'More than 3 minutes',
        '1 to 3 minutes',
        'Less than 1 minute',
        'Zero extra time',
      ]),
    [filteredResponses]
  );
  const lackedCashBreakdown = useMemo(
    () => computeSingleFieldBreakdown(filteredResponses, 'lackedCashMoment'),
    [filteredResponses]
  );
  const digitalFreqBreakdown = useMemo(
    () =>
      computeSingleFieldBreakdown(filteredResponses, 'digitalPayFreq30d', [
        'Almost daily (More than 10 times)',
        'Frequently (6–10 times)',
        'A few times (1–5 times)',
        'Never (0 times)',
      ]),
    [filteredResponses]
  );
  const reasonBreakdown = useMemo(
    () => computeSingleFieldBreakdown(filteredResponses, 'topReason'),
    [filteredResponses]
  );
  const formatBreakdown = useMemo(
    () => computeSingleFieldBreakdown(filteredResponses, 'preferredFormat'),
    [filteredResponses]
  );
  const speedBreakdown = useMemo(
    () =>
      computeSingleFieldBreakdown(filteredResponses, 'speedRequirement', [
        'Instant tap (under 2 seconds)',
        'Quick scan (3 to 5 seconds)',
        'Up to 10 seconds is fine',
      ]),
    [filteredResponses]
  );
  const q21Breakdown = useMemo(
    () => computeSingleFieldBreakdown(filteredResponses, 'q21Tradeoff'),
    [filteredResponses]
  );
  const q22Breakdown = useMemo(
    () => computeSingleFieldBreakdown(filteredResponses, 'q22Tradeoff'),
    [filteredResponses]
  );
  const dailyTrend = useMemo(
    () => computeDailyTrend(filteredResponses),
    [filteredResponses]
  );
  const modePaymentMatrix = useMemo(
    () => computeModePaymentMatrix(filteredResponses),
    [filteredResponses]
  );

  const executiveInsights = useMemo(
    () =>
      generateExecutiveInsights({
        metrics,
        modeBreakdown,
        headacheBreakdown,
        passBreakdown,
        q21Breakdown,
        q22Breakdown,
      }),
    [metrics, modeBreakdown, headacheBreakdown, passBreakdown, q21Breakdown, q22Breakdown]
  );

  const handleNavigateChapter = (id: string) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (
      id === 'scene-1' ||
      id === 'scene-2' ||
      id === 'scene-4' ||
      id === 'scene-5' ||
      id === 'scene-6'
    ) {
      setRequestedScene({ id, nonce: Date.now() });
    }

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const handleClearFilters = () => setFilters(INITIAL_FILTERS);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const handleImportDataset = (imported: SurveyResponse[], label: string) => {
    setResponses(imported);
    setDatasetLabel(label);
    setIsCustomDataset(true);
    setFilters(INITIAL_FILTERS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ responses: imported, label }));
    } catch {
      // Ignore storage quota issues
    }
  };

  const handleResetDataset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    setFilters(INITIAL_FILTERS);
    void loadAttachedCsv();
  };

  const handleExportCsv = () => {
    const csv = exportResponsesToCsv(sortedResponses);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dhaka-transit-survey-filtered.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F4F1EA] text-[#111111]">
      <main>
        {loading ? (
          <div
            className="mx-auto max-w-[1440px] space-y-6 px-4 py-12 sm:px-6 lg:px-8"
            aria-busy="true"
            aria-label="Loading survey results"
          >
            <div className="h-64 animate-pulse border border-[#111111] bg-[#E7E3DA]" />
            <div className="h-48 animate-pulse border border-[#111111] bg-[#FAF8F3]" />
          </div>
        ) : loadError ? (
          <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
            <div
              role="alert"
              className="flex flex-col items-start gap-3 border border-[#E13B22] bg-[#FAF8F3] p-6 text-sm text-[#111111]"
            >
              <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#E13B22]">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <span>Could not load attached survey CSV</span>
              </div>
              <p className="text-xs text-[#4A4740]">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadAttachedCsv()}
                className="border border-[#111111] bg-[#111111] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#F4F1EA] hover:bg-[#E13B22] hover:border-[#E13B22]"
              >
                Retry loading CSV
              </button>
            </div>
          </div>
        ) : (
          <>
            <HeroSpread
              metrics={metrics}
              baselineMetrics={baselineMetrics}
              totalCorpusCount={responses.length}
              datasetLabel={datasetLabel}
              isCustomDataset={isCustomDataset}
              activeSceneLabel={activeSceneLabel}
              onStartExploring={() => handleNavigateChapter('scene-1')}
              onExportCsv={handleExportCsv}
              onResetDataset={handleResetDataset}
            />

            <FilterBar
              filters={filters}
              onChange={setFilters}
              modes={modes}
              filteredCount={filteredResponses.length}
              totalCount={responses.length}
              onClear={handleClearFilters}
            />

            <StoryView
              metrics={metrics}
              ratingDist={ratingDist}
              modeBreakdown={modeBreakdown}
              headacheBreakdown={headacheBreakdown}
              occupationBreakdown={occupationBreakdown}
              passBreakdown={passBreakdown}
              timeWastedBreakdown={timeWastedBreakdown}
              lackedCashBreakdown={lackedCashBreakdown}
              digitalFreqBreakdown={digitalFreqBreakdown}
              reasonBreakdown={reasonBreakdown}
              formatBreakdown={formatBreakdown}
              payMethodBreakdown={payMethodBreakdown}
              speedBreakdown={speedBreakdown}
              q21Breakdown={q21Breakdown}
              q22Breakdown={q22Breakdown}
              dailyTrend={dailyTrend}
              executiveInsights={executiveInsights}
              selectedMode={filters.mode}
              onSelectMode={(mode) => setFilters((prev) => ({ ...prev, mode }))}
              onClearFilters={handleClearFilters}
              onActiveSceneChange={setActiveSceneLabel}
              requestedScene={requestedScene}
            />

            <InteractionMatrix
              matrix={modePaymentMatrix}
              selectedMode={filters.mode}
              onSelectMode={(mode) => setFilters((prev) => ({ ...prev, mode }))}
              onClearFilters={handleClearFilters}
            />

            <ComparisonView
              responses={filteredResponses}
              onClearFilters={handleClearFilters}
            />

            <ResponsesView
              responses={sortedResponses}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              onExportCsv={handleExportCsv}
            />
          </>
        )}
      </main>

      <footer className="border-t border-[#111111] bg-[#111111] text-[#F4F1EA]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-stretch justify-between gap-6 px-4 py-8 lg:flex-row lg:items-center sm:px-6 lg:px-8">
          <div className="max-w-md">
            <p className="font-display text-2xl font-extrabold uppercase tracking-tight">
              Multimodal Cashless Transit in Dhaka
            </p>
            <p className="mt-1 font-mono text-xs leading-relaxed text-[#B7B2A8]">
              Feasibility, First-to-Last-Mile Integration, and Adoption Dynamics Across Formal and
              Informal Transit Modes
            </p>
          </div>

          <SurveyPulse
            filteredCount={filteredResponses.length}
            totalCount={responses.length}
            onResetFilters={handleClearFilters}
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 border border-[#F4F1EA] px-3.5 py-2 font-mono text-xs font-medium uppercase tracking-wider text-[#F4F1EA] hover:bg-[#E13B22] hover:border-[#E13B22] hover:text-white whitespace-nowrap"
            >
              <span>Import CSV</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={sortedResponses.length === 0}
              className="border border-[#F4F1EA] px-3.5 py-2 font-mono text-xs font-medium uppercase tracking-wider text-[#F4F1EA] hover:bg-[#F4CF15] hover:border-[#F4CF15] hover:text-[#111111] disabled:opacity-40 whitespace-nowrap"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => {
                const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 border border-[#F4F1EA] bg-[#F4F1EA] px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#111111] hover:bg-[#E13B22] hover:border-[#E13B22] hover:text-white whitespace-nowrap"
            >
              <span>Back to Top</span>
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </footer>

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportDataset}
      />
    </div>
  );
}
