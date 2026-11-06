import { useMemo } from 'react';
import katex from 'katex';
import { pct as fmtPct, fmt } from '../lib/math.js';

/** Render a LaTeX string. Use String.raw for the source. */
export function Tex({ children, block = false }) {
  const html = useMemo(
    () => katex.renderToString(String(children), { throwOnError: false, displayMode: block }),
    [children, block]
  );
  const Tag = block ? 'div' : 'span';
  return <Tag className={block ? 'tex-block' : 'tex-inline'} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** A card holding one interactive figure. */
export function Figure({ title, hint, caption, children }) {
  return (
    <figure className="figure">
      {(title || hint) && (
        <div className="figure-head">
          {title && <div className="figure-title">{title}</div>}
          {hint && <div className="figure-hint">{hint}</div>}
        </div>
      )}
      <div className="figure-body">{children}</div>
      {caption && <figcaption className="figure-caption">{caption}</figcaption>}
    </figure>
  );
}

const CALLOUT_LABEL = {
  idea: 'Key idea',
  analogy: 'Analogy',
  note: 'Good to know',
  math: 'In math',
};

export function Callout({ kind = 'idea', title, children }) {
  return (
    <aside className={`callout callout-${kind}`}>
      <div className="callout-label">{title || CALLOUT_LABEL[kind]}</div>
      <div className="callout-body">{children}</div>
    </aside>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, format, width }) {
  return (
    <label className="slider" style={width ? { width } : undefined}>
      <span className="slider-top">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/** Segmented control. options: [{ value, label }] */
export function Seg({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={`seg-btn${o.value === value ? ' is-on' : ''}`}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Btn({ children, onClick, primary, disabled, title }) {
  return (
    <button
      type="button"
      className={`btn${primary ? ' btn-primary' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

/** A token chip. */
export function Tok({ children, active, dim, onClick, sub, tint }) {
  const cls = `tok${active ? ' is-active' : ''}${dim ? ' is-dim' : ''}${onClick ? ' is-click' : ''}${
    tint ? ` tok-tint-${tint}` : ''
  }`;
  const inner = (
    <>
      <span className="tok-text">{children}</span>
      {sub !== undefined && <span className="tok-sub">{sub}</span>}
    </>
  );
  return onClick ? (
    <button type="button" className={cls} onClick={onClick} aria-pressed={!!active}>
      {inner}
    </button>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

/** Colored dot used beside a name, so identity never rides on text color. */
export function Swatch({ color }) {
  return <span className="swatch" style={{ background: color }} aria-hidden="true" />;
}

/**
 * Horizontal bars, one per item. items: [{ label, value, note }]
 * Values are shown as percentages by default.
 */
export function Bars({
  items,
  max,
  color = 'var(--s1)',
  asPct = true,
  digits = 0,
  hi,
  labelWidth = 84,
  noteWidth,
  onHover,
  dimOthers = false,
}) {
  const top = max ?? Math.max(...items.map((d) => d.value), 1e-9);
  return (
    <div className="bars" onMouseLeave={onHover ? () => onHover(null) : undefined}>
      {items.map((d, i) => (
        <div
          key={`${d.label}-${i}`}
          className={`bar-row${hi === i ? ' is-hi' : ''}${dimOthers && hi != null && hi !== i ? ' is-dim' : ''}`}
          onMouseEnter={onHover ? () => onHover(i) : undefined}
        >
          <div className="bar-label" style={{ width: labelWidth }}>
            {d.label}
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `calc((100% - 58px) * ${Math.max(0, Math.min(1, d.value / top)).toFixed(4)})`,
                background: d.color || color,
              }}
            />
            <div className="bar-value">{asPct ? fmtPct(d.value, digits) : fmt(d.value, digits)}</div>
          </div>
          {d.note && (
            <div className="bar-note" style={noteWidth ? { width: noteWidth } : undefined}>
              {d.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** Step-by-step navigator. steps: [{ title }] */
export function StepNav({ steps, step, onStep }) {
  return (
    <div className="stepnav">
      <button type="button" className="btn" onClick={() => onStep(step - 1)} disabled={step === 0}>
        ← Back
      </button>
      <div className="stepnav-dots" role="tablist" aria-label="Steps">
        {steps.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={i === step}
            className={`stepnav-dot${i === step ? ' is-on' : ''}${i < step ? ' is-done' : ''}`}
            onClick={() => onStep(i)}
            title={s.title}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => onStep(step + 1)}
        disabled={step === steps.length - 1}
      >
        Next →
      </button>
    </div>
  );
}

/** Legend strip for a color scale. */
export function ScaleLegend({ kind = 'seq', left, right, mid }) {
  return (
    <div className="scale-legend">
      <span>{left}</span>
      <span className={`scale-bar scale-${kind}`} aria-hidden="true" />
      {mid !== undefined && <span className="scale-mid">{mid}</span>}
      <span>{right}</span>
    </div>
  );
}
