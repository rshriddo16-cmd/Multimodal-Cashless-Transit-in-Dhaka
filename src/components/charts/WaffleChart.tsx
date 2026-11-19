interface WaffleChartProps {
  pct: number;
  title: string;
  caption: string;
  accentColor?: string;
}

export function WaffleChart({
  pct,
  title,
  caption,
  accentColor = '#E13B22',
}: WaffleChartProps) {
  const filled = Math.max(0, Math.min(100, Math.round(pct)));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h3 className="font-display text-2xl font-bold uppercase text-[#111111]">{title}</h3>
          <p className="mt-0.5 text-sm text-[#4A4740]">{caption}</p>
        </div>
        <span className="font-display text-4xl font-extrabold leading-none text-[#E13B22] tabular-nums shrink-0">
          {filled}/100
        </span>
      </div>

      <div
        className="mt-4 grid w-full max-w-[310px] grid-cols-10 gap-1 border border-[#111111] bg-[#FAF8F3] p-2"
        role="img"
        aria-label={`${filled} out of 100 commuters affected`}
      >
        {Array.from({ length: 100 }, (_, idx) => {
          const active = idx < filled;
          return (
            <div
              key={idx}
              className="aspect-square border border-[#111111]"
              style={{ backgroundColor: active ? accentColor : '#F4F1EA' }}
            />
          );
        })}
      </div>

      <div className="mt-2 flex max-w-[310px] items-center justify-between gap-2 font-mono text-[11px] text-[#4A4740] tabular-nums">
        <span>1 tile = 1%</span>
        <span>{100 - filled}% rarely/never</span>
      </div>
    </div>
  );
}
