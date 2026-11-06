import { fmt } from '../lib/math.js';
import { divColor, seqColor } from '../lib/colors.js';
import { useTheme } from '../lib/theme.jsx';
import { Swatch } from './ui.jsx';

/**
 * A grid of numbers with optional heat coloring and hover highlighting.
 *
 * scale: 'div' (signed, blue/red), 'seq' (0..max, blue), 'none'
 * rowHi / colHi: light up one row / column and dim the rest
 * cellHi: [i, j] gets a ring
 * onCell(i, j): fired on hover / focus / click
 */
export function Matrix({
  data,
  rowLabels,
  colLabels,
  title,
  shape = true,
  accent,
  scale = 'div',
  range,
  digits = 2,
  cell = 50,
  rowHi = null,
  colHi = null,
  cellHi = null,
  onCell,
  blank,
}) {
  const { dark } = useTheme();
  const rows = data.length;
  const cols = data[0].length;
  const finite = data.flat().filter((v) => Number.isFinite(v));
  const top = range ?? Math.max(1e-9, ...finite.map((v) => Math.abs(v)));
  const anyHi = rowHi !== null || colHi !== null;

  const colorFor = (v) => {
    if (!Number.isFinite(v)) return { bg: 'var(--surface-2)', fg: 'var(--muted)' };
    if (scale === 'seq') return seqColor(v / top, dark);
    if (scale === 'div') return divColor((v / top) * 0.85, dark);
    return { bg: 'var(--surface-2)', fg: 'var(--ink)' };
  };

  return (
    <div className="mx">
      {title && (
        <div className="mx-title">
          {accent && <Swatch color={accent} />}
          <span>{title}</span>
          {shape && (
            <span className="mx-shape">
              {rows}×{cols}
            </span>
          )}
        </div>
      )}
      <div
        className="mx-grid"
        style={{ gridTemplateColumns: `${rowLabels ? 'auto ' : ''}repeat(${cols}, ${cell}px)` }}
      >
        {colLabels && (
          <>
            {rowLabels && <div />}
            {colLabels.map((c, j) => (
              <div key={`c${j}`} className={`mx-collabel${colHi === j ? ' is-hi' : ''}`}>
                {c}
              </div>
            ))}
          </>
        )}
        {data.map((row, i) => (
          <div key={`r${i}`} style={{ display: 'contents' }}>
            {rowLabels && <div className={`mx-rowlabel${rowHi === i ? ' is-hi' : ''}`}>{rowLabels[i]}</div>}
            {row.map((v, j) => {
              const lit = !anyHi || rowHi === i || colHi === j;
              const ring = cellHi && cellHi[0] === i && cellHi[1] === j;
              const hidden = blank && blank(i, j);
              const c = colorFor(v);
              return (
                <div
                  key={j}
                  className={`mx-cell${lit ? '' : ' is-dim'}${ring ? ' is-ring' : ''}${onCell ? ' is-hot' : ''}${
                    hidden ? ' is-blank' : ''
                  }`}
                  style={{ background: c.bg, color: c.fg, height: Math.round(cell * 0.72) }}
                  tabIndex={onCell ? 0 : undefined}
                  onMouseEnter={onCell ? () => onCell(i, j) : undefined}
                  onFocus={onCell ? () => onCell(i, j) : undefined}
                  onClick={onCell ? () => onCell(i, j) : undefined}
                >
                  {fmt(v, digits)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** An operator sitting between two matrices in an equation row. */
export function Op({ children }) {
  return <div className="mx-op">{children}</div>;
}

export function EqRow({ children }) {
  return <div className="eq-row">{children}</div>;
}
