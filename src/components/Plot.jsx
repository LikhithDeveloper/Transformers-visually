/**
 * Minimal SVG plot frame: hairline grid, ticks, axis labels.
 * children is a function receiving { sx, sy } scale functions.
 */
export function Plot({
  w = 560,
  h = 260,
  x,
  y,
  xTicks = [],
  yTicks = [],
  xLabel,
  yLabel,
  xFmt = (v) => v,
  yFmt = (v) => v,
  children,
  label,
}) {
  const m = { l: 46, r: 16, t: yLabel ? 30 : 12, b: xLabel ? 40 : 26 };
  const sx = (v) => m.l + ((v - x[0]) / (x[1] - x[0])) * (w - m.l - m.r);
  const sy = (v) => h - m.b - ((v - y[0]) / (y[1] - y[0])) * (h - m.t - m.b);
  const zeroInY = y[0] <= 0 && y[1] >= 0;

  return (
    <svg className="plot" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label}>
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={m.l} x2={w - m.r} y1={sy(t)} y2={sy(t)} className="plot-grid" />
          <text x={m.l - 8} y={sy(t)} className="plot-tick" textAnchor="end" dominantBaseline="middle">
            {yFmt(t)}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text key={`x${t}`} x={sx(t)} y={h - m.b + 16} className="plot-tick" textAnchor="middle">
          {xFmt(t)}
        </text>
      ))}
      <line
        x1={m.l}
        x2={w - m.r}
        y1={zeroInY ? sy(0) : h - m.b}
        y2={zeroInY ? sy(0) : h - m.b}
        className="plot-axis"
      />
      {xLabel && (
        <text x={(m.l + w - m.r) / 2} y={h - 6} className="plot-label" textAnchor="middle">
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text x={m.l - 8} y={6} className="plot-label" textAnchor="end" dominantBaseline="hanging">
          {yLabel}
        </text>
      )}
      {children({ sx, sy, m, w, h })}
    </svg>
  );
}

/** Build an SVG path for y = fn(x). */
export function curve(fn, x0, x1, sx, sy, n = 160) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const xv = x0 + ((x1 - x0) * i) / n;
    d += `${i === 0 ? 'M' : 'L'}${sx(xv).toFixed(1)},${sy(fn(xv)).toFixed(1)}`;
  }
  return d;
}
