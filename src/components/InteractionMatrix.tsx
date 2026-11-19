import * as d3 from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CommuterCluster, ModePaymentCell, ModePaymentMatrixData } from '../types/survey';
import { RevealChartContainer } from './RevealChartContainer';

type MatrixMetricView = 'share' | 'correlation' | 'count';

interface InteractionMatrixProps {
  matrix: ModePaymentMatrixData;
  selectedMode: string;
  onSelectMode: (mode: string) => void;
  onClearFilters: () => void;
}

function makeCellKey(mode: string, paymentMethod: string): string {
  return `${mode}__${paymentMethod}`;
}

function getRelativeLuminance(hexOrCss: string): number {
  const c = d3.color(hexOrCss)?.rgb();
  if (!c) return 1;
  const channels = [c.r, c.g, c.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function InteractionMatrix({
  matrix,
  selectedMode,
  onSelectMode,
  onClearFilters,
}: InteractionMatrixProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [metricView, setMetricView] = useState<MatrixMetricView>('share');
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
  const [hoveredCellKey, setHoveredCellKey] = useState<string | null>(null);

  const defaultCell = useMemo<ModePaymentCell | null>(() => {
    if (matrix.clusters.length > 0) {
      const lead = matrix.clusters[0];
      const matched = matrix.cells.find(
        (c) => c.mode === lead.mode && c.paymentMethod === lead.paymentMethod
      );
      if (matched) return matched;
    }
    return [...matrix.cells].sort((a, b) => b.count - a.count)[0] ?? null;
  }, [matrix]);

  const activeCell = useMemo<ModePaymentCell | null>(() => {
    const targetKey = hoveredCellKey ?? selectedCellKey;
    if (targetKey) {
      const found = matrix.cells.find(
        (c) => makeCellKey(c.mode, c.paymentMethod) === targetKey
      );
      if (found) return found;
    }
    return defaultCell;
  }, [hoveredCellKey, selectedCellKey, matrix.cells, defaultCell]);

  const lockedCellKey = useMemo(() => {
    if (selectedCellKey && matrix.cells.some((c) => makeCellKey(c.mode, c.paymentMethod) === selectedCellKey)) {
      return selectedCellKey;
    }
    return defaultCell ? makeCellKey(defaultCell.mode, defaultCell.paymentMethod) : null;
  }, [selectedCellKey, matrix.cells, defaultCell]);

  useEffect(() => {
    const svgNode = svgRef.current;
    if (!svgNode || matrix.modes.length === 0 || matrix.paymentMethods.length === 0) return;

    const svg = d3.select(svgNode);
    svg.selectAll('*').remove();

    const rowHeight = 46;
    const margin = { top: 62, right: 18, bottom: 18, left: 132 };
    const totalWidth = 640;
    const innerWidth = totalWidth - margin.left - margin.right;
    const innerHeight = matrix.modes.length * rowHeight;
    const totalHeight = innerHeight + margin.top + margin.bottom;

    svg.attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

    const root = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xDomain = matrix.paymentMethods.map((p) => p.label);
    const yDomain = matrix.modes.map((m) => m.label);

    const xScale = d3.scaleBand<string>().domain(xDomain).range([0, innerWidth]).padding(0.08);
    const yScale = d3.scaleBand<string>().domain(yDomain).range([0, innerHeight]).padding(0.08);

    const maxShare = Math.max(30, d3.max(matrix.cells, (d) => d.modeSharePct) ?? 60);
    const maxCount = Math.max(5, d3.max(matrix.cells, (d) => d.count) ?? 20);

    const sequentialScale = d3
      .scaleSequential((t) => d3.interpolateRgbBasis(['#FAF8F3', '#F4CF15', '#E13B22'])(t))
      .domain([0, metricView === 'share' ? maxShare : maxCount]);

    const corrScale = d3
      .scaleLinear<string>()
      .domain([-0.28, 0, 0.28])
      .range(['#111111', '#FAF8F3', '#E13B22'])
      .clamp(true);

    const activeRow = activeCell?.mode;
    const activeCol = activeCell?.paymentMethod;

    // Column headers (Payment Methods)
    const colGroups = root
      .append('g')
      .attr('class', 'matrix-col-headers')
      .selectAll('g')
      .data(matrix.paymentMethods)
      .join('g')
      .attr('transform', (d) => `translate(${(xScale(d.label) ?? 0) + xScale.bandwidth() / 2}, -14)`);

    colGroups
      .append('text')
      .attr('y', -18)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-size', '11px')
      .attr('font-weight', (d) => (d.label === activeCol ? '700' : '600'))
      .attr('fill', (d) => (d.label === activeCol ? '#E13B22' : '#111111'))
      .text((d) => d.shortLabel.toUpperCase());

    colGroups
      .append('text')
      .attr('y', -2)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-size', '10px')
      .attr('fill', '#4A4740')
      .text((d) => `n=${d.count}`);

    // Row headers (Transit Modes)
    const rowGroups = root
      .append('g')
      .attr('class', 'matrix-row-headers')
      .selectAll('g')
      .data(matrix.modes)
      .join('g')
      .attr('transform', (d) => `translate(-12, ${(yScale(d.label) ?? 0) + yScale.bandwidth() / 2})`);

    rowGroups
      .append('text')
      .attr('y', -2)
      .attr('text-anchor', 'end')
      .attr('font-family', 'DM Sans, sans-serif')
      .attr('font-size', '12px')
      .attr('font-weight', (d) => (d.label === activeRow ? '700' : '600'))
      .attr('fill', (d) => (d.label === activeRow ? '#E13B22' : '#111111'))
      .text((d) => d.shortLabel);

    rowGroups
      .append('text')
      .attr('y', 12)
      .attr('text-anchor', 'end')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-size', '10px')
      .attr('fill', '#4A4740')
      .text((d) => `${d.count} riders`);

    // Matrix cells
    const cellGroups = root
      .append('g')
      .attr('class', 'matrix-cells')
      .selectAll<SVGGElement, ModePaymentCell>('g')
      .data(matrix.cells)
      .join('g')
      .attr(
        'transform',
        (d) => `translate(${xScale(d.paymentMethod) ?? 0}, ${yScale(d.mode) ?? 0})`
      )
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => {
        const corrText = d.correlation >= 0 ? `+${d.correlation.toFixed(2)}` : d.correlation.toFixed(2);
        return `${d.modeShort} by ${d.paymentShort}: ${d.count} of ${d.modeTotal} riders (${d.modeSharePct}%), correlation ${corrText}`;
      })
      .style('cursor', 'pointer')
      .on('mouseenter', (_event, d) => {
        setHoveredCellKey(makeCellKey(d.mode, d.paymentMethod));
      })
      .on('mouseleave', () => {
        setHoveredCellKey(null);
      })
      .on('focus', (_event, d) => {
        setHoveredCellKey(makeCellKey(d.mode, d.paymentMethod));
      })
      .on('blur', () => {
        setHoveredCellKey(null);
      })
      .on('click', (_event, d) => {
        setSelectedCellKey(makeCellKey(d.mode, d.paymentMethod));
      })
      .on('keydown', (event: KeyboardEvent, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setSelectedCellKey(makeCellKey(d.mode, d.paymentMethod));
        }
      });

    cellGroups
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => {
        if (d.count === 0) return '#EFECE4';
        if (metricView === 'correlation') return corrScale(d.correlation);
        if (metricView === 'count') return sequentialScale(d.count);
        return sequentialScale(d.modeSharePct);
      })
      .attr('stroke', (d) => {
        const key = makeCellKey(d.mode, d.paymentMethod);
        if (key === hoveredCellKey || key === lockedCellKey) return '#111111';
        return '#B8B3A8';
      })
      .attr('stroke-width', (d) => {
        const key = makeCellKey(d.mode, d.paymentMethod);
        if (key === hoveredCellKey) return 2.5;
        if (key === lockedCellKey) return 2.25;
        return 1;
      });

    // Cell value text (contrast checked against luminance)
    cellGroups
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .attr('font-size', '12px')
      .attr('font-weight', (d) => {
        const key = makeCellKey(d.mode, d.paymentMethod);
        return key === hoveredCellKey || key === lockedCellKey ? '700' : '600';
      })
      .attr('fill', (d) => {
        if (d.count === 0) return '#7A756B';
        const fill =
          metricView === 'correlation'
            ? corrScale(d.correlation)
            : metricView === 'count'
              ? sequentialScale(d.count)
              : sequentialScale(d.modeSharePct);
        return getRelativeLuminance(fill) < 0.36 ? '#FAF8F3' : '#111111';
      })
      .style('pointer-events', 'none')
      .text((d) => {
        if (d.count === 0) return '—';
        if (metricView === 'correlation') {
          return d.correlation > 0 ? `+${d.correlation.toFixed(2)}` : d.correlation.toFixed(2);
        }
        if (metricView === 'count') return String(d.count);
        return `${d.modeSharePct}%`;
      });
  }, [matrix, metricView, activeCell, hoveredCellKey, lockedCellKey]);

  const handleSelectCluster = (cluster: CommuterCluster) => {
    setSelectedCellKey(makeCellKey(cluster.mode, cluster.paymentMethod));
  };

  if (matrix.totalRespondents === 0 || matrix.modes.length === 0 || matrix.paymentMethods.length === 0) {
    return (
      <section
        id="chapter-matrix"
        aria-label="Mode and payment interaction matrix"
        className="scroll-mt-6 border-b border-[#111111] bg-[#FAF8F3] py-12 lg:py-16"
      >
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="border border-[#111111] bg-[#F4F1EA] p-10 text-center">
            <p className="font-mono text-xs uppercase tracking-wider text-[#E13B22]">
              No Cluster Overlap
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase text-[#111111]">
              Not enough filtered replies to build the matrix
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#4A4740]">
              Reset filters to inspect how transit modes and preferred payment channels cluster.
            </p>
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-5 border border-[#111111] bg-[#111111] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#F4F1EA] hover:bg-[#E13B22] hover:border-[#E13B22]"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </section>
    );
  }

  const corrDisplay = activeCell
    ? activeCell.correlation > 0
      ? `+${activeCell.correlation.toFixed(2)}`
      : activeCell.correlation.toFixed(2)
    : '0.00';

  const isCellModeFiltered = Boolean(activeCell && selectedMode === activeCell.mode);

  return (
    <section
      id="chapter-matrix"
      aria-label="Chapter 05: Mode and Payment Interaction Matrix"
      className="scroll-mt-6 border-b border-[#111111] bg-[#FAF8F3] py-12 lg:py-16"
    >
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#111111] pb-5 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#E13B22]">
              Chapter 05 · D3 Interaction Matrix
            </p>
            <h2 className="font-display-tight mt-1.5 text-4xl font-extrabold uppercase text-[#111111] sm:text-5xl">
              Modes &amp; Payment Clusters
            </h2>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
            <div
              role="group"
              aria-label="Matrix value display"
              className="grid w-full grid-cols-3 border border-[#111111] bg-[#F4F1EA] sm:inline-flex sm:w-auto"
            >
              <button
                type="button"
                onClick={() => setMetricView('share')}
                aria-pressed={metricView === 'share'}
                className={`px-2 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 sm:px-3.5 sm:text-xs ${
                  metricView === 'share'
                    ? 'bg-[#111111] text-[#F4CF15]'
                    : 'text-[#111111] hover:bg-[#E7E3DA]'
                }`}
              >
                Mode Share (%)
              </button>
              <button
                type="button"
                onClick={() => setMetricView('correlation')}
                aria-pressed={metricView === 'correlation'}
                className={`border-l border-[#111111] px-2 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 sm:px-3.5 sm:text-xs ${
                  metricView === 'correlation'
                    ? 'bg-[#111111] text-[#F4CF15]'
                    : 'text-[#111111] hover:bg-[#E7E3DA]'
                }`}
              >
                Correlation (r)
              </button>
              <button
                type="button"
                onClick={() => setMetricView('count')}
                aria-pressed={metricView === 'count'}
                className={`border-l border-[#111111] px-2 py-2 text-center font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 sm:px-3.5 sm:text-xs ${
                  metricView === 'count'
                    ? 'bg-[#111111] text-[#F4CF15]'
                    : 'text-[#111111] hover:bg-[#E7E3DA]'
                }`}
              >
                Rider Count
              </button>
            </div>
          </div>
        </div>

        <RevealChartContainer>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* LEFT: D3 Heatmap SVG */}
            <div className="min-w-0 border border-[#111111] bg-[#F4F1EA] p-4 sm:p-5 lg:col-span-7">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#4A4740]">
                  Click or hover any intersection cell to inspect its commuter cluster profile.
                </p>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740] tabular-nums">
                  {matrix.modes.length} Modes × {matrix.paymentMethods.length} Pay Options
                </span>
              </div>

              <div className="w-full max-w-full overflow-x-auto bg-[#FAF8F3] p-2 sm:p-3">
                <svg
                  ref={svgRef}
                  role="img"
                  aria-label="D3 interaction matrix showing correlation and overlap between Dhaka transit modes and payment methods"
                  className="block h-auto min-w-[500px] w-full sm:min-w-0"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-[#4A4740]">
                {metricView === 'correlation' ? (
                  <div className="flex items-center gap-2">
                    <span>Under-indexed (-0.28)</span>
                    <span
                      className="inline-block h-2.5 w-32 border border-[#111111]"
                      style={{
                        background:
                          'linear-gradient(90deg, #111111 0%, #FAF8F3 50%, #E13B22 100%)',
                      }}
                    />
                    <span>Strong Cluster (+0.28)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Low</span>
                    <span
                      className="inline-block h-2.5 w-32 border border-[#111111]"
                      style={{
                        background:
                          'linear-gradient(90deg, #FAF8F3 0%, #F4CF15 50%, #E13B22 100%)',
                      }}
                    />
                    <span>High Concentration</span>
                  </div>
                )}
                <span>Dark outline = Selected cluster</span>
              </div>
            </div>

            {/* RIGHT: Cluster Inspector */}
            <aside
              aria-label="Selected commuter cluster details"
              className="min-w-0 border border-[#111111] bg-[#F4F1EA] p-5 lg:col-span-5"
            >
              {activeCell ? (
                <div className="space-y-5">
                  <div className="border-b border-[#111111] pb-4">
                    <p className="font-mono text-xs uppercase tracking-wider text-[#E13B22]">
                      Cluster Inspector · {activeCell.modeShort} × {activeCell.paymentShort}
                    </p>
                    <h3 className="mt-1.5 font-display text-3xl font-extrabold uppercase text-[#111111]">
                      {activeCell.modeShort} → {activeCell.paymentShort}
                    </h3>
                    <p className="mt-1 text-xs text-[#4A4740]">{activeCell.paymentMethod}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-[#111111] bg-[#FAF8F3] p-3.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                        Mode Share
                      </span>
                      <p className="mt-1 font-display text-3xl font-extrabold text-[#111111] tabular-nums">
                        {activeCell.modeSharePct}%
                      </p>
                      <p className="mt-0.5 text-xs text-[#4A4740] tabular-nums">
                        {activeCell.count} of {activeCell.modeTotal} riders
                      </p>
                    </div>

                    <div className="border border-[#111111] bg-[#FAF8F3] p-3.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                        Correlation (r)
                      </span>
                      <p
                        className={`mt-1 font-display text-3xl font-extrabold tabular-nums ${
                          activeCell.correlation > 0
                            ? 'text-[#E13B22]'
                            : 'text-[#111111]'
                        }`}
                      >
                        {corrDisplay}
                      </p>
                      <p className="mt-0.5 text-xs text-[#4A4740] tabular-nums">
                        {activeCell.lift.toFixed(2)}× cohort rate
                      </p>
                    </div>

                    <div className="border border-[#111111] bg-[#FAF8F3] p-3.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                        Avg Intent
                      </span>
                      <p className="mt-1 font-display text-3xl font-extrabold text-[#111111] tabular-nums">
                        {activeCell.avgIntent.toFixed(2)}
                      </p>
                      <p className="mt-0.5 text-xs text-[#4A4740] tabular-nums">
                        {activeCell.highIntentPct}% ready to switch
                      </p>
                    </div>

                    <div className="border border-[#111111] bg-[#FAF8F3] p-3.5">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                        Weekly Hassle
                      </span>
                      <p className="mt-1 font-display text-3xl font-extrabold text-[#111111] tabular-nums">
                        {activeCell.frequentHasslePct}%
                      </p>
                      <p className="mt-0.5 text-xs text-[#4A4740]">
                        Cash delay frequency
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[#111111] pt-4">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740]">
                      Common Routes In Cluster
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#111111]">
                      {activeCell.sampleCorridors.length > 0
                        ? activeCell.sampleCorridors.join(' · ')
                        : 'No corridor breakdown recorded for this intersection.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onSelectMode(isCellModeFiltered ? 'All' : activeCell.mode)
                      }
                      className={`border border-[#111111] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                        isCellModeFiltered
                          ? 'bg-[#F4CF15] text-[#111111] hover:bg-[#111111] hover:text-[#F4F1EA]'
                          : 'bg-[#111111] text-[#F4F1EA] hover:bg-[#E13B22] hover:border-[#E13B22]'
                      }`}
                    >
                      {isCellModeFiltered
                        ? `Clear ${activeCell.modeShort} Filter`
                        : `Filter By ${activeCell.modeShort}`}
                    </button>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </RevealChartContainer>

        {/* IDENTIFIED COMMUTER CLUSTERS */}
        {matrix.clusters.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-wider text-[#4A4740]">
                Standout Commuter Clusters · Select Any Archetype To Highlight In Matrix
              </p>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#4A4740] tabular-nums">
                {matrix.clusters.length} Clusters Detected
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {matrix.clusters.map((cluster) => {
                const isSelected =
                  lockedCellKey === makeCellKey(cluster.mode, cluster.paymentMethod);
                const corrText =
                  cluster.correlation > 0
                    ? `+${cluster.correlation.toFixed(2)}`
                    : cluster.correlation.toFixed(2);

                return (
                  <button
                    key={cluster.id}
                    type="button"
                    onClick={() => handleSelectCluster(cluster)}
                    aria-pressed={isSelected}
                    className={`flex flex-col justify-between border border-[#111111] p-4 text-left transition-colors ${
                      isSelected
                        ? 'bg-[#F4CF15] text-[#111111]'
                        : 'bg-[#F4F1EA] text-[#111111] hover:bg-[#E7E3DA]'
                    }`}
                  >
                    <div>
                      <div
                        className={`flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider ${
                          isSelected ? 'text-[#111111]' : 'text-[#4A4740]'
                        }`}
                      >
                        <span>{cluster.paymentShort}</span>
                        <span className="tabular-nums">r {corrText}</span>
                      </div>
                      <h3 className="mt-1.5 font-display text-2xl font-bold uppercase text-[#111111]">
                        {cluster.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#2F2D29]">
                        {cluster.subtitle}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-[#111111]/25 pt-2.5 font-mono text-[11px] text-[#111111] tabular-nums">
                      <span>{cluster.count} riders ({cluster.modeSharePct}%)</span>
                      <span>Intent {cluster.avgIntent.toFixed(2)}/5</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
