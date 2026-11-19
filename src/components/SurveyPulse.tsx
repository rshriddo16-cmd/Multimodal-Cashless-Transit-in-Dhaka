import { Activity, X } from 'lucide-react';

interface SurveyPulseProps {
  filteredCount: number;
  totalCount: number;
  onResetFilters?: () => void;
}

export function SurveyPulse({
  filteredCount,
  totalCount,
  onResetFilters,
}: SurveyPulseProps) {
  const isSubset = totalCount > 0 && filteredCount < totalCount;
  const isEmpty = totalCount > 0 && filteredCount === 0;
  const sharePct = totalCount > 0 ? Math.round((filteredCount / totalCount) * 100) : 0;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Survey Pulse: ${filteredCount} of ${totalCount} respondents shown`}
      className={`min-w-[260px] border px-4 py-3 transition-colors ${
        isEmpty
          ? 'border-[#E13B22] bg-[#1C1210]'
          : isSubset
            ? 'border-[#F4CF15] bg-[#1A1914]'
            : 'border-[#2E2C28] bg-[#171614]'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`inline-block h-2.5 w-2.5 shrink-0 ${
              isEmpty
                ? 'animate-survey-pulse bg-[#E13B22]'
                : isSubset
                  ? 'animate-survey-pulse bg-[#F4CF15]'
                  : 'bg-[#B7B2A8]'
            }`}
          />
          <Activity
            className={`h-3.5 w-3.5 shrink-0 ${
              isEmpty ? 'text-[#E13B22]' : isSubset ? 'text-[#F4CF15]' : 'text-[#B7B2A8]'
            }`}
            aria-hidden="true"
          />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#F4F1EA]">
            Survey Pulse
          </span>
        </div>

        <span
          className={`font-mono text-[10px] uppercase tracking-wider ${
            isEmpty
              ? 'animate-survey-pulse font-semibold text-[#E13B22]'
              : isSubset
                ? 'animate-survey-pulse font-semibold text-[#F4CF15]'
                : 'text-[#B7B2A8]'
          }`}
        >
          {isEmpty ? 'No Matches' : isSubset ? 'Filtered Subset' : 'All Replies'}
        </span>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-1.5 tabular-nums">
          <span className="font-display text-2xl font-extrabold leading-none text-[#F4F1EA]">
            {filteredCount}
          </span>
          <span className="font-mono text-xs text-[#B7B2A8]">
            / {totalCount} respondents ({sharePct}%)
          </span>
        </div>

        {isSubset && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 border border-[#F4CF15] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#F4CF15] transition-colors hover:bg-[#F4CF15] hover:text-[#111111] whitespace-nowrap shrink-0"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="mt-2.5 h-[3px] w-full bg-[#2E2C28]" aria-hidden="true">
        <div
          className={`h-full transition-[width] duration-300 ${
            isEmpty ? 'bg-[#E13B22]' : isSubset ? 'bg-[#F4CF15]' : 'bg-[#F4F1EA]'
          }`}
          style={{ width: `${sharePct}%` }}
        />
      </div>
    </div>
  );
}
