import type { CategoryMetric } from '../../types/survey';

interface TradeoffSplitChartProps {
  title: string;
  question: string;
  items: CategoryMetric[];
  leftAccent?: string;
  rightAccent?: string;
}

function simplifyOption(label: string): string {
  return label.replace(/^Option [AB]:\s*/i, '');
}

export function TradeoffSplitChart({
  title,
  question,
  items,
  leftAccent = 'bg-[#E13B22] text-white',
  rightAccent = 'bg-[#111111] text-[#F4F1EA]',
}: TradeoffSplitChartProps) {
  const clean = items.filter((i) => i.label !== 'Unspecified');
  const first = clean[0];
  const second = clean[1];
  if (!first) return null;

  const pairTotal = first.count + (second?.count ?? 0);
  const leftWidth = pairTotal > 0 ? (first.count / pairTotal) * 100 : 100;
  const rightWidth = second ? 100 - leftWidth : 0;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display text-2xl font-bold uppercase text-[#111111]">{title}</h3>
        <p className="mt-0.5 text-sm text-[#4A4740]">{question}</p>
      </div>

      {/* Opposing Proportional Tug-of-War Bar */}
      <div
        className="flex min-h-[96px] w-full border border-[#111111]"
        role="img"
        aria-label={`${simplifyOption(first.label)} ${first.pct}% versus ${second ? `${simplifyOption(second.label)} ${second.pct}%` : ''}`}
      >
        <div
          style={{ width: `${second ? Math.max(20, Math.min(80, leftWidth)) : 100}%` }}
          className={`flex flex-col justify-between p-3.5 transition-all duration-200 ${leftAccent}`}
        >
          <span className="font-display text-3xl font-extrabold leading-none tabular-nums">
            {first.pct}%
          </span>
          <span className="mt-2 text-xs font-semibold leading-snug">
            {simplifyOption(first.label)}
          </span>
        </div>

        {second && (
          <div
            style={{ width: `${Math.max(20, Math.min(80, rightWidth))}%` }}
            className={`flex flex-col justify-between border-l border-[#111111] p-3.5 text-right transition-all duration-200 ${rightAccent}`}
          >
            <span className="font-display text-3xl font-extrabold leading-none tabular-nums">
              {second.pct}%
            </span>
            <span className="mt-2 text-xs font-semibold leading-snug">
              {simplifyOption(second.label)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#4A4740] tabular-nums">
        <span>
          {first.count} chose {simplifyOption(first.label).split('(')[0].trim()}
        </span>
        {second && (
          <span>
            {second.count} chose {simplifyOption(second.label).split('(')[0].trim()}
          </span>
        )}
      </div>
    </div>
  );
}
