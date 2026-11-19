import type { CategoryMetric } from '../../types/survey';

interface RiderMosaicChartProps {
  occupations: CategoryMetric[];
  passBreakdown: CategoryMetric[];
}

const TILE_PALETTE = [
  'bg-[#111111] text-[#F4F1EA]',
  'bg-[#F4CF15] text-[#111111]',
  'bg-[#E13B22] text-white',
  'bg-[#E7E3DA] text-[#111111]',
  'bg-[#FAF8F3] text-[#111111]',
];

export function RiderMosaicChart({ occupations, passBreakdown }: RiderMosaicChartProps) {
  const topGroups = occupations.filter((o) => o.label !== 'Unspecified').slice(0, 5);
  if (topGroups.length === 0) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h3 className="font-display text-2xl font-bold uppercase text-[#111111]">
            Who Answered
          </h3>
          <span className="font-mono text-xs text-[#4A4740]">Proportional Rider Mosaic</span>
        </div>

        {/* Proportional area strip */}
        <div
          className="flex min-h-[120px] w-full flex-col border border-[#111111] sm:flex-row"
          role="img"
          aria-label="Proportional breakdown of survey respondents by occupation"
        >
          {topGroups.map((group, idx) => {
            const flexWeight = Math.max(12, group.pct);
            return (
              <div
                key={group.label}
                style={{ flexGrow: flexWeight, flexBasis: '0%' }}
                className={`flex flex-col justify-between p-3.5 ${
                  idx > 0 ? 'border-t border-[#111111] sm:border-t-0 sm:border-l' : ''
                } ${TILE_PALETTE[idx % TILE_PALETTE.length]}`}
              >
                <span className="font-display text-3xl font-extrabold leading-none tabular-nums">
                  {group.pct}%
                </span>
                <div className="mt-4">
                  <p className="text-xs font-semibold leading-tight">{group.label}</p>
                  <p className="mt-0.5 font-mono text-[10px] opacity-80 tabular-nums">
                    {group.count} riders · {group.avgIntent.toFixed(1)}/5
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simple MRT Pass vs Cash Split */}
      <div>
        <p className="mb-2 font-mono text-xs uppercase tracking-wider text-[#4A4740]">
          Current Transit Card Ownership
        </p>
        <div className="grid grid-cols-1 border border-[#111111] sm:grid-cols-2">
          {passBreakdown.slice(0, 2).map((pass, idx) => (
            <div
              key={pass.label}
              className={`p-4 ${
                idx === 1 ? 'border-t border-[#111111] sm:border-t-0 sm:border-l' : ''
              } ${idx === 0 ? 'bg-[#FAF8F3]' : 'bg-[#E7E3DA]'}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-3xl font-extrabold text-[#111111] tabular-nums">
                  {pass.pct}%
                </span>
                <span className="font-mono text-xs text-[#4A4740] tabular-nums">
                  {pass.count} riders
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-[#111111]">{pass.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
