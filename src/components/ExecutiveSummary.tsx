import type { ExecutiveInsight } from '../utils/surveyAnalytics';

interface ExecutiveSummaryProps {
  insights: ExecutiveInsight[];
  totalCount: number;
}

export function ExecutiveSummary({ insights, totalCount }: ExecutiveSummaryProps) {
  if (totalCount === 0 || insights.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Executive Summary"
      className="border border-[#111111] bg-[#111111] text-[#F4F1EA]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="flex flex-col justify-between border-b border-[#2E2C28] p-6 lg:col-span-4 lg:border-b-0 lg:border-r lg:p-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#F4CF15]">
              Automated Synthesis
            </p>
            <h3 className="mt-2 font-display text-4xl font-extrabold uppercase leading-none tracking-tight text-[#F4F1EA] sm:text-5xl">
              Executive Summary
            </h3>
          </div>
          <p className="mt-6 font-mono text-xs uppercase tracking-wider text-[#B7B2A8] tabular-nums">
            Top {insights.length} {insights.length === 1 ? 'insight' : 'insights'} · {totalCount}{' '}
            filtered {totalCount === 1 ? 'response' : 'responses'}
          </p>
        </div>

        <div className="p-6 lg:col-span-8 lg:p-8">
          <ul className="list-disc space-y-4 pl-5 text-sm leading-relaxed text-[#E7E3DA] marker:text-[#E13B22] sm:text-base">
            {insights.map((insight) => (
              <li key={insight.id} className="tabular-nums">
                <span className="font-semibold text-[#F4CF15]">{insight.label}:</span>{' '}
                <span>{insight.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
