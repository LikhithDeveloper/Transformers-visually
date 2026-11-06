// Color scales for data marks.
// Sequential (magnitude) = one blue hue, receding to the surface near zero.
// Diverging (signed values) = blue <-> neutral gray <-> red.

const SEQ = {
  light: ['#fcfcfb', '#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'],
  dark: ['#1a1a19', '#0d366b', '#184f95', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4', '#cde2fb'],
};

const DIV = {
  light: ['#1c5cab', '#2a78d6', '#f0efec', '#e34948', '#b52f2f'],
  dark: ['#6da7ec', '#3987e5', '#383835', '#e66767', '#f09a9a'],
};

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

function lerpStops(stops, t) {
  const x = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const a = hexToRgb(stops[i]);
  const b = hexToRgb(stops[i + 1]);
  return a.map((v, k) => Math.round(v + (b[k] - v) * f));
}

function luminance([r, g, b]) {
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function pack(rgb) {
  return {
    bg: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    fg: luminance(rgb) > 0.18 ? '#0b0b0b' : '#ffffff',
  };
}

/** t in [0, 1] */
export function seqColor(t, dark) {
  return pack(lerpStops(dark ? SEQ.dark : SEQ.light, t));
}

/** t in [-1, 1] */
export function divColor(t, dark) {
  const stops = dark ? DIV.dark : DIV.light;
  // Compress the outer stops so most of the range uses the main pole colors.
  const u = Math.max(-1, Math.min(1, t));
  return pack(lerpStops(stops, (u + 1) / 2));
}
