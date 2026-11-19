import type { CategoryMetric } from '../../types/survey';

interface LollipopChartProps {
  items: CategoryMetric[];
  maxItems?: number;
}

export function LollipopChart({ items, maxItems = 4 }: LollipopChartProps) {
  const rows = items.slice(0, maxItems);
  if (rows.length === 0) return null;

  return (
    <div className="space-y-4">
      {rows.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-[#111111]">{item.label}</span>
            <span className="font-mono text-xs font-semibold text-[#E13B22] tabular-nums shrink-0">
              {item.pct}% ({item.count})
            </span>
          </div>

          <div className="relative flex h-5 items-center">
            {/* Background baseline track */}
            <div className="h-[1px] w-full bg-[#D5D0C5]" />
            {/* Ink stem + vermilion dot */}
            <div
              className="absolute left-0 flex items-center"
              style={{ width: `${Math.max(4, item.pct)}%` }}
            >
              <div className="h-[2.5px] flex-1 bg-[#111111]" />
              <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#111111] bg-[#E13B22]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
