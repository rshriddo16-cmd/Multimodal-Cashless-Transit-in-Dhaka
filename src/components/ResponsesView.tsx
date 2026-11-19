import { ArrowDownUp, ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SortField, SurveyResponse } from '../types/survey';
import { getIntentTier } from '../utils/surveyAnalytics';

interface ResponsesViewProps {
  responses: SurveyResponse[];
  sortBy: SortField;
  sortDir: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  onExportCsv: () => void;
}

const PAGE_SIZE = 15;

export function ResponsesView({
  responses,
  sortBy,
  sortDir,
  onSort,
  onExportCsv,
}: ResponsesViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(responses.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [responses.length, sortBy, sortDir]);

  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = responses.slice(pageStart, pageStart + PAGE_SIZE);
  const selectedResponse = responses.find((r) => r.id === selectedId) ?? null;

  if (responses.length === 0) {
    return null;
  }

  const renderSortHeader = (label: string, field: SortField, alignRight = false) => {
    const active = sortBy === field;
    return (
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider transition-colors whitespace-nowrap ${
          alignRight ? 'justify-end ml-auto' : ''
        } ${active ? 'font-semibold text-[#E13B22]' : 'text-[#4A4740] hover:text-[#111111]'}`}
      >
        <span>{label}</span>
        <ArrowDownUp
          className={`h-3 w-3 ${active ? 'text-[#E13B22]' : 'text-[#8A857B]'}`}
          aria-hidden="true"
        />
        {active && <span className="sr-only">sorted {sortDir}</span>}
      </button>
    );
  };

  return (
    <section
      id="chapter-responses"
      aria-label="Chapter 07: Individual Responses"
      className="scroll-mt-6 bg-[#E7E3DA] py-12 lg:py-16"
    >
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#111111] pb-5 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#E13B22]">
              Chapter 07 · Individual Voices
            </p>
            <h2 className="font-display-tight mt-1.5 text-4xl font-extrabold uppercase text-[#111111] sm:text-5xl">
              Browse Every Commuter
            </h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs uppercase tracking-wider text-[#4A4740] tabular-nums">
              {responses.length} Replies
            </span>
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 border border-[#111111] bg-[#FAF8F3] px-3.5 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#111111] transition-colors hover:bg-[#F4CF15] whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
          <div
            className={`min-w-0 border border-[#111111] bg-[#FAF8F3] overflow-hidden ${
              selectedResponse ? 'xl:col-span-8' : 'xl:col-span-12'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#111111] bg-[#F4F1EA]">
                    <th className="py-3 pl-5 pr-3">{renderSortHeader('Date', 'submittedAt')}</th>
                    <th className="py-3 px-3 font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                      Route
                    </th>
                    <th className="py-3 px-3 font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                      Transport
                    </th>
                    <th className="py-3 px-3 text-right">
                      {renderSortHeader('Cost', 'fareBdt', true)}
                    </th>
                    <th className="py-3 px-3">{renderSortHeader('Cash Trouble', 'cashHassleFreq')}</th>
                    <th className="py-3 px-3 text-right">
                      {renderSortHeader('Score', 'adoptionIntent', true)}
                    </th>
                    <th className="py-3 pr-4 pl-2 text-right">
                      <span className="sr-only">Inspect</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D5D0C5]">
                  {pageRows.map((row) => {
                    const tier = getIntentTier(row.adoptionIntent);
                    const isSelected = selectedResponse?.id === row.id;
                    const shortHassle = row.cashHassleFreq.split('(')[0].trim();

                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-[#F4CF15]/45' : 'hover:bg-[#E7E3DA]/55'
                        }`}
                      >
                        <td className="py-2.5 pl-5 pr-3 font-mono text-xs text-[#4A4740] tabular-nums whitespace-nowrap">
                          {row.submittedAt}
                        </td>
                        <td className="py-2.5 px-3 max-w-[170px] truncate text-xs font-medium text-[#111111]">
                          {row.route}
                        </td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate text-xs text-[#4A4740]">
                          {row.modesUsed.join(', ')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs text-[#111111] tabular-nums whitespace-nowrap">
                          {row.fareBdt !== null ? `৳${row.fareBdt}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-[#2F2D29] whitespace-nowrap">
                          {shortHassle}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs font-semibold tabular-nums whitespace-nowrap">
                          <span
                            className={
                              tier === 'High Intent (4–5)'
                                ? 'text-[#111111]'
                                : tier === 'Neutral (3)'
                                  ? 'text-[#B45309]'
                                  : 'text-[#E13B22]'
                            }
                          >
                            {row.adoptionIntent}/5
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 pl-2 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedId(isSelected ? null : row.id)}
                            aria-label={`Read reply ${row.id}`}
                            aria-expanded={isSelected}
                            className={`inline-flex items-center gap-1 border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                              isSelected
                                ? 'border-[#111111] bg-[#111111] text-[#F4CF15]'
                                : 'border-[#111111] bg-[#F4F1EA] text-[#111111] hover:bg-[#111111] hover:text-[#F4F1EA]'
                            }`}
                          >
                            <span>{isSelected ? 'Hide' : 'View'}</span>
                            <ChevronRight className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#111111] bg-[#F4F1EA] px-5 py-3 font-mono text-xs text-[#111111]">
                <span className="tabular-nums">
                  {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, responses.length)} of{' '}
                  {responses.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="inline-flex items-center gap-1 border border-[#111111] bg-[#FAF8F3] px-2.5 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#F4CF15] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Prev</span>
                  </button>
                  <span className="tabular-nums px-1">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="inline-flex items-center gap-1 border border-[#111111] bg-[#FAF8F3] px-2.5 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#F4CF15] disabled:opacity-40"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedResponse && (
            <aside
              aria-label={`Details for ${selectedResponse.id}`}
              className="border border-[#111111] bg-[#111111] p-6 text-[#F4F1EA] xl:col-span-4 xl:sticky xl:top-6"
            >
              <div className="flex items-start justify-between gap-3 border-b border-[#2E2C28] pb-4">
                <div>
                  <p className="font-mono text-xs text-[#F4CF15]">
                    {selectedResponse.submittedAt}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-bold uppercase text-white">
                    {selectedResponse.respondentName}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-[#B7B2A8]">
                    {selectedResponse.ageGroup} · {selectedResponse.occupation}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close response details"
                  className="border border-[#2E2C28] p-1.5 text-[#B7B2A8] hover:border-[#F4CF15] hover:text-[#F4CF15]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 border-b border-[#2E2C28] pb-4 text-xs">
                  <div>
                    <p className="font-mono uppercase tracking-wider text-[#B7B2A8]">Would Switch</p>
                    <p className="mt-1 font-display text-2xl font-bold text-[#F4CF15] tabular-nums">
                      {selectedResponse.adoptionIntent} / 5
                    </p>
                  </div>
                  <div>
                    <p className="font-mono uppercase tracking-wider text-[#B7B2A8]">Trip Cost</p>
                    <p className="mt-1 font-display text-2xl font-bold text-white tabular-nums">
                      {selectedResponse.fareBdt !== null
                        ? `৳${selectedResponse.fareBdt}`
                        : 'Not stated'}
                    </p>
                  </div>
                </div>

                <dl className="divide-y divide-[#2E2C28] text-xs">
                  <div className="py-2">
                    <dt className="font-mono text-[#B7B2A8]">Route</dt>
                    <dd className="mt-0.5 font-medium text-white">{selectedResponse.route}</dd>
                  </div>
                  <div className="py-2">
                    <dt className="font-mono text-[#B7B2A8]">Rides Used</dt>
                    <dd className="mt-0.5 font-medium text-white">
                      {selectedResponse.modesUsed.join(', ')}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 py-2">
                    <dt className="font-mono text-[#B7B2A8]">MRT / Rapid Pass</dt>
                    <dd className="font-medium text-white text-right">
                      {selectedResponse.transitPassStatus}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 py-2">
                    <dt className="font-mono text-[#B7B2A8]">Cash Trouble</dt>
                    <dd className="font-medium text-[#E13B22] text-right">
                      {selectedResponse.cashHassleFreq}
                    </dd>
                  </div>
                  <div className="py-2">
                    <dt className="font-mono text-[#B7B2A8]">Main Pain Points</dt>
                    <dd className="mt-0.5 font-medium text-white">
                      {selectedResponse.paymentHeadaches.join(', ')}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 py-2">
                    <dt className="font-mono text-[#B7B2A8]">Mobile Wallet</dt>
                    <dd className="font-medium text-white text-right">
                      {selectedResponse.mobileWalletUsage}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 py-2">
                    <dt className="font-mono text-[#B7B2A8]">Preferred Format</dt>
                    <dd className="font-medium text-white text-right">
                      {selectedResponse.preferredFormat}
                    </dd>
                  </div>
                  <div className="py-2">
                    <dt className="font-mono text-[#B7B2A8]">Speed vs. All Modes</dt>
                    <dd className="mt-0.5 font-medium text-[#F4CF15]">
                      {selectedResponse.q21Tradeoff}
                    </dd>
                  </div>
                  <div className="py-2">
                    <dt className="font-mono text-[#B7B2A8]">Deposit Choice</dt>
                    <dd className="mt-0.5 font-medium text-white">
                      {selectedResponse.q22Tradeoff}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
