/**
 * OOTD – Farb-Utilities.
 *
 * Reine Funktionen ohne DOM-Zugriff. Wird von svg.js (Silhouetten-Details)
 * und ab Phase 3 von engine.js (Farbharmonie-Scoring) genutzt.
 */

/** "#RRGGBB" oder "#RGB" → { r, g, b } mit 0–255. */
export function hexToRgb(hex) {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = Number.parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }) {
  const to = (v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** { r, g, b } (0–255) → { h: 0–360, s: 0–1, l: 0–1 }. */
export function rgbToHsl({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0));
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s, l };
}

export function hexToHsl(hex) {
  return rgbToHsl(hexToRgb(hex));
}

/** Relative Helligkeit nach WCAG, 0 (schwarz) bis 1 (weiß). */
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Hellt eine Farbe auf (amount > 0) oder dunkelt sie ab (amount < 0),
 * jeweils um den Anteil `amount` der verbleibenden Distanz zu Weiß/Schwarz.
 */
export function shade(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  return rgbToHex({
    r: r + (target - r) * t,
    g: g + (target - g) * t,
    b: b + (target - b) * t,
  });
}

/**
 * Linie/Detailfarbe, die auf der Grundfarbe sichtbar bleibt:
 * dunkle Stoffe bekommen hellere Nähte, helle Stoffe dunklere.
 */
export function contrastLine(hex, strength = 0.3) {
  return luminance(hex) < 0.28 ? shade(hex, strength + 0.1) : shade(hex, -strength);
}

/** Euklidischer RGB-Abstand, grobe Näherung für "sind sich zwei Farben ähnlich". */
export function rgbDistance(a, b) {
  const c1 = hexToRgb(a), c2 = hexToRgb(b);
  return Math.hypot(c1.r - c2.r, c1.g - c2.g, c1.b - c2.b);
}
