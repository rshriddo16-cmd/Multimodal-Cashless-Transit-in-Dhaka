import { Search, X } from 'lucide-react';
import type { IntentTier, SurveyFilters } from '../types/survey';

interface FilterBarProps {
  filters: SurveyFilters;
  onChange: (next: SurveyFilters) => void;
  modes: string[];
  filteredCount: number;
  totalCount: number;
  onClear: () => void;
}

const INTENT_OPTIONS: Array<{ value: 'All' | IntentTier; label: string }> = [
  { value: 'All', label: 'All' },
  { value: 'High Intent (4–5)', label: 'Yes (4–5)' },
  { value: 'Neutral (3)', label: 'Maybe (3)' },
  { value: 'Low Intent (1–2)', label: 'No (1–2)' },
];

export function FilterBar({
  filters,
  onChange,
  modes,
  filteredCount,
  totalCount,
  onClear,
}: FilterBarProps) {
  const hasActiveFilter =
    filters.search.trim() !== '' ||
    filters.mode !== 'All' ||
    filters.passStatus !== 'All' ||
    filters.intentTier !== 'All';

  return (
    <section aria-label="Filter commuter story" className="border-b border-[#111111] bg-[#FAF8F3]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3.5 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <label htmlFor="survey-search" className="sr-only">
              Search route, transport mode, or job
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A4740]"
              aria-hidden="true"
            />
            <input
              id="survey-search"
              type="search"
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="Search route or job..."
              className="w-full border border-[#111111] bg-[#F4F1EA] py-2 pl-9 pr-3 font-mono text-xs text-[#111111] placeholder:text-[#6B675E] focus:bg-white focus:outline-2 focus:outline-[#E13B22]"
            />
          </div>

          <div className="w-full sm:w-auto">
            <label htmlFor="mode-filter" className="sr-only">
              Filter by transport type
            </label>
            <select
              id="mode-filter"
              value={filters.mode}
              onChange={(e) => onChange({ ...filters, mode: e.target.value })}
              className="w-full sm:w-auto sm:max-w-[200px] border border-[#111111] bg-[#F4F1EA] px-3 py-2 font-mono text-xs text-[#111111] focus:bg-white focus:outline-2 focus:outline-[#E13B22]"
            >
              <option value="All">All rides</option>
              {modes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label htmlFor="pass-filter" className="sr-only">
              Filter by transit pass or cash
            </label>
            <select
              id="pass-filter"
              value={filters.passStatus}
              onChange={(e) =>
                onChange({
                  ...filters,
                  passStatus: e.target.value as SurveyFilters['passStatus'],
                })
              }
              className="w-full sm:w-auto border border-[#111111] bg-[#F4F1EA] px-3 py-2 font-mono text-xs text-[#111111] focus:bg-white focus:outline-2 focus:outline-[#E13B22]"
            >
              <option value="All">Pass &amp; cash riders</option>
              <option value="Has Pass">Has MRT / Rapid Pass</option>
              <option value="Cash / Tokens">Pays cash / tokens</option>
            </select>
          </div>

          <div
            role="group"
            aria-label="Filter by willingness to switch"
            className="grid w-full grid-cols-2 border border-[#111111] bg-[#F4F1EA] sm:inline-flex sm:w-auto"
          >
            {INTENT_OPTIONS.map((option, index) => {
              const active = filters.intentTier === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ ...filters, intentTier: option.value })}
                  aria-pressed={active}
                  className={`px-3 py-2 font-mono text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    index % 2 === 1 ? 'border-l border-[#111111]' : ''
                  } ${index >= 2 ? 'border-t border-[#111111] sm:border-t-0 sm:border-l' : ''} ${
                    active
                      ? 'bg-[#111111] text-[#F4CF15]'
                      : 'text-[#111111] hover:bg-[#E7E3DA]'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 xl:justify-end shrink-0">
          <span className="font-mono text-xs uppercase tracking-wider text-[#4A4740] tabular-nums whitespace-nowrap">
            {filteredCount} of {totalCount} riders
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 border border-[#111111] bg-[#F4CF15] px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#111111] transition-colors hover:bg-[#E13B22] hover:text-white whitespace-nowrap shrink-0"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
