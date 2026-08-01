/**
 * OOTD – Silhouetten und Muster (Bauplan §6.4).
 *
 * Erzeugt für jedes Kleidungsstück ein eigenständiges Inline-SVG:
 * eine stilisierte Form in der Teil-Farbe, darüber optional ein
 * Muster-Overlay, dazu ein paar Nahtlinien als Detail.
 * Reine String-Erzeugung, kein DOM-Zugriff.
 */

import { contrastLine, shade, luminance } from './color.js';

const VIEWBOX = '0 0 100 120';
let uidCounter = 0;

/* --------------------------------------------------------------------------
   Formen: Silhouette + optionale Detaillinien
   -------------------------------------------------------------------------- */

const SHAPES = {
  shirt: {
    path: 'M38 12 L20 18 L7 42 L3 76 L19 80 L26 52 L26 108 L74 108 L74 52 L81 80 L97 76 L93 42 L80 18 L62 12 L50 30 Z',
    details: (c) => `
      <path d="M38 12 L50 30 L62 12" fill="none" stroke="${c.line}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M50 30 L50 108" stroke="${c.line}" stroke-width="1.6"/>
      ${[44, 60, 76, 92].map((y) => `<circle cx="50" cy="${y}" r="2" fill="${c.line}"/>`).join('')}
      <path d="M6 74 L18 77 M94 74 L82 77" stroke="${c.line}" stroke-width="1.4" opacity=".7"/>`,
  },
  polo: {
    path: 'M38 12 L17 21 L9 45 L28 52 L28 108 L72 108 L72 52 L91 45 L83 21 L62 12 L50 28 Z',
    details: (c) => `
      <path d="M38 12 L50 28 L62 12" fill="none" stroke="${c.line}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M50 28 L50 52" stroke="${c.line}" stroke-width="1.6"/>
      <circle cx="50" cy="36" r="1.9" fill="${c.line}"/>
      <circle cx="50" cy="46" r="1.9" fill="${c.line}"/>
      <path d="M28 50 L28 44 M72 50 L72 44" stroke="${c.line}" stroke-width="1.4"/>`,
  },
  sweater: {
    path: 'M36 12 C38 25 43 30 50 30 C57 30 62 25 64 12 L82 19 L95 44 L92 78 L76 82 L71 54 L71 110 L29 110 L29 54 L24 82 L8 78 L5 44 L18 19 Z',
    details: (c) => `
      <path d="M36 12 C38 25 43 30 50 30 C57 30 62 25 64 12" fill="none" stroke="${c.line}" stroke-width="2.6"/>
      <path d="M29 102 L71 102" stroke="${c.line}" stroke-width="2.2" opacity=".7"/>
      <path d="M9 74 L23 78 M91 74 L77 78" stroke="${c.line}" stroke-width="2" opacity=".7"/>`,
  },
  turtleneck: {
    path: 'M42 4 L58 4 L58 18 L64 12 L82 19 L95 44 L92 78 L76 82 L71 54 L71 110 L29 110 L29 54 L24 82 L8 78 L5 44 L18 19 L36 12 L42 18 Z',
    details: (c) => `
      <path d="M42 4 L58 4 L58 18 L42 18 Z" fill="none" stroke="${c.line}" stroke-width="1.8"/>
      <path d="M46 4 L46 18 M50 4 L50 18 M54 4 L54 18" stroke="${c.line}" stroke-width="1" opacity=".6"/>
      <path d="M29 102 L71 102" stroke="${c.line}" stroke-width="2.2" opacity=".7"/>`,
  },
  tshirt: {
    path: 'M36 12 C38 25 43 30 50 30 C57 30 62 25 64 12 L84 21 L92 48 L72 55 L72 108 L28 108 L28 55 L8 48 L16 21 Z',
    details: (c) => `
      <path d="M36 12 C38 25 43 30 50 30 C57 30 62 25 64 12" fill="none" stroke="${c.line}" stroke-width="2.2"/>`,
  },
  cardigan: {
    path: 'M36 12 L18 19 L5 44 L8 78 L24 82 L29 54 L29 110 L47 110 L47 30 Z M64 12 L82 19 L95 44 L92 78 L76 82 L71 54 L71 110 L53 110 L53 30 Z',
    details: (c) => `
      <path d="M36 12 L47 32 M64 12 L53 32" fill="none" stroke="${c.line}" stroke-width="2"/>
      ${[44, 60, 76, 92].map((y) => `<circle cx="45" cy="${y}" r="2.1" fill="${c.line}"/>`).join('')}
      <path d="M29 102 L47 102 M53 102 L71 102" stroke="${c.line}" stroke-width="1.5" opacity=".7"/>`,
  },
  trousers: {
    path: 'M27 10 L73 10 L76 46 L71 112 L55 112 L50 58 L45 112 L29 112 L24 46 Z',
    details: (c) => `
      <path d="M25.5 22 L74.5 22" stroke="${c.line}" stroke-width="2.4"/>
      <path d="M50 24 L50 56" stroke="${c.line}" stroke-width="1.3" opacity=".7"/>
      <path d="M38 30 L38 108 M62 30 L62 108" stroke="${c.line}" stroke-width="1.1" opacity=".45"/>`,
  },
  shorts: {
    path: 'M27 10 L73 10 L75 42 L71 76 L55 76 L50 48 L45 76 L29 76 L25 42 Z',
    details: (c) => `
      <path d="M26 22 L74 22" stroke="${c.line}" stroke-width="2.4"/>
      <path d="M29 70 L45 70 M55 70 L71 70" stroke="${c.line}" stroke-width="1.4" opacity=".7"/>`,
  },
  skirt: {
    path: 'M29 10 L71 10 L87 94 C74 102 26 102 13 94 Z',
    details: (c) => `
      <path d="M28.5 24 L71.5 24" stroke="${c.line}" stroke-width="2.4"/>
      <path d="M39 26 L31 97 M50 26 L50 100 M61 26 L69 97" stroke="${c.line}" stroke-width="1.2" opacity=".5"/>`,
  },
  dress: {
    path: 'M36 10 C38 23 43 28 50 28 C57 28 62 23 64 10 L81 17 L90 45 L74 52 L70 41 L72 62 L88 106 C72 114 28 114 12 106 L28 62 L30 41 L26 52 L10 45 L19 17 Z',
    details: (c) => `
      <path d="M36 10 C38 23 43 28 50 28 C57 28 62 23 64 10" fill="none" stroke="${c.line}" stroke-width="2.2"/>
      <path d="M28.5 62 C40 66 60 66 71.5 62" fill="none" stroke="${c.line}" stroke-width="2.4"/>`,
  },
  blazer: {
    path: 'M37 10 L18 18 L4 46 L7 80 L23 84 L28 56 L26 112 L47 112 L49 40 Z M63 10 L82 18 L96 46 L93 80 L77 84 L72 56 L74 112 L53 112 L51 40 Z',
    details: (c) => `
      <path d="M37 10 L49 42 L55 12 Z" fill="${c.light}" stroke="${c.line}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M63 10 L51 42 L45 12 Z" fill="${c.light}" stroke="${c.line}" stroke-width="1.4" stroke-linejoin="round"/>
      <circle cx="47" cy="66" r="2.2" fill="${c.line}"/>
      <circle cx="47" cy="80" r="2.2" fill="${c.line}"/>
      <path d="M31 82 L42 82 M69 82 L58 82" stroke="${c.line}" stroke-width="1.6" opacity=".7"/>`,
  },
  coat: {
    path: 'M37 8 L18 16 L5 46 L8 82 L24 86 L29 56 L29 114 L71 114 L71 56 L76 86 L92 82 L95 46 L82 16 L63 8 L50 26 Z',
    details: (c) => `
      <path d="M37 8 L50 26 L63 8" fill="none" stroke="${c.line}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M29 62 L71 62 L71 72 L29 72 Z" fill="${c.dark}"/>
      <path d="M55 62 L55 72" stroke="${c.metal}" stroke-width="3"/>
      <path d="M50 26 L50 114" stroke="${c.line}" stroke-width="1.5" opacity=".7"/>
      <circle cx="43" cy="42" r="2.1" fill="${c.line}"/>
      <circle cx="57" cy="42" r="2.1" fill="${c.line}"/>
      <circle cx="43" cy="84" r="2.1" fill="${c.line}"/>
      <circle cx="57" cy="84" r="2.1" fill="${c.line}"/>`,
  },
  vest: {
    path: 'M38 12 L24 20 L21 108 L47 108 L47 32 Z M62 12 L76 20 L79 108 L53 108 L53 32 Z',
    details: (c) => `
      <path d="M38 12 L47 34 M62 12 L53 34" fill="none" stroke="${c.line}" stroke-width="2"/>
      ${[44, 62, 80, 96].map((y) => `<path d="M22 ${y} L47 ${y} M53 ${y} L78 ${y}" stroke="${c.line}" stroke-width="1.2" opacity=".55"/>`).join('')}`,
  },
  loafer: {
    path: 'M9 74 C9 59 24 52 41 52 L58 52 C75 52 87 61 91 74 L91 84 C91 90 87 94 78 94 L19 94 C12 94 9 89 9 84 Z',
    details: (c) => `
      <ellipse cx="40" cy="60" rx="19" ry="7" transform="rotate(-7 40 60)"
               fill="${c.dark}" stroke="${c.line}" stroke-width="1.4"/>
      <path d="M60 55 L74 58 L73 66 L59 63 Z" fill="${c.light}" stroke="${c.line}" stroke-width="1.2"/>
      <path d="M64 60 L69 61" stroke="${c.dark}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M9 85 L91 85" stroke="${c.line}" stroke-width="2.2"/>
      <path d="M20 85 L20 94" stroke="${c.line}" stroke-width="1.6" opacity=".7"/>`,
  },
  sneaker: {
    path: 'M9 72 C9 58 23 50 40 50 L56 50 C73 50 86 60 91 72 L91 80 L9 80 Z',
    details: (c) => `
      <path d="M7 80 L93 80 C93 89 89 94 80 94 L18 94 C11 94 7 89 7 80 Z" fill="${c.sole}" stroke="${c.line}" stroke-width="1.2"/>
      <path d="M34 54 L46 66 M40 52 L54 66 M48 52 L62 66" stroke="${c.line}" stroke-width="1.6" opacity=".75"/>
      <path d="M66 54 C74 58 80 64 84 72" fill="none" stroke="${c.line}" stroke-width="2"/>`,
  },
  boot: {
    path: 'M24 16 L55 16 L57 60 C73 64 87 72 90 84 L90 90 C90 95 86 98 79 98 L26 98 C20 98 17 94 17 88 L22 40 Z',
    details: (c) => `
      <path d="M23.5 26 L55.5 26" stroke="${c.line}" stroke-width="1.8" opacity=".7"/>
      <path d="M17 90 L90 90" stroke="${c.line}" stroke-width="2"/>
      <path d="M57 62 C66 66 74 72 79 80" fill="none" stroke="${c.line}" stroke-width="1.4" opacity=".6"/>`,
  },
  flat: {
    path: 'M11 78 C11 66 26 60 44 60 L60 60 C77 60 89 68 91 79 C92 88 86 92 76 92 L21 92 C13 92 11 86 11 78 Z',
    details: (c) => `
      <ellipse cx="42" cy="68" rx="18" ry="6.5" transform="rotate(-6 42 68)"
               fill="${c.dark}" stroke="${c.line}" stroke-width="1.4"/>
      <path d="M62 62 C66 58 72 58 74 62 C71 61 65 61 62 62 Z"
            fill="${c.light}" stroke="${c.line}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M11 85 L91 85" stroke="${c.line}" stroke-width="2" opacity=".85"/>`,
  },
  tie: {
    path: 'M41 12 L59 12 L62 30 L38 30 Z M39 32 L61 32 L57 92 L50 106 L43 92 Z',
    details: (c) => `
      <path d="M41 12 L59 12 L62 30 L38 30 Z" fill="none" stroke="${c.line}" stroke-width="1.4"/>`,
  },
  scarf: {
    path: 'M32 8 L54 8 L49 60 C62 74 62 92 57 108 L35 108 C41 92 41 76 29 64 Z',
    details: (c) => `
      ${[38, 44, 50, 56].map((x) => `<path d="M${x} 108 L${x} 116" stroke="${c.line}" stroke-width="2" stroke-linecap="round"/>`).join('')}
      <path d="M31 30 L52 30 M30 46 L50 46" stroke="${c.line}" stroke-width="1.4" opacity=".6"/>`,
  },
  belt: {
    path: 'M6 48 L72 48 L72 72 L6 72 Z',
    details: (c) => `
      <path d="M70 42 L94 42 L94 78 L70 78 Z" fill="none" stroke="${c.metal}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M62 54 L62 66" stroke="${c.metal}" stroke-width="3.5" stroke-linecap="round"/>
      ${[20, 32, 44].map((x) => `<circle cx="${x}" cy="60" r="2.4" fill="${c.line}"/>`).join('')}`,
  },
  necklace: {
    path: '',
    details: (c, color) => {
      const beads = [];
      for (let i = 0; i <= 22; i++) {
        const t = Math.PI * (i / 22);
        const x = 50 - Math.cos(t) * 34;
        const y = 26 + Math.sin(t) * 52;
        beads.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.6" fill="${color}" stroke="${c.line}" stroke-width="1"/>`);
      }
      return beads.join('');
    },
  },
  cap: {
    path: 'M17 64 C17 36 32 20 50 20 C68 20 83 36 83 64 Z M15 64 L92 68 C95 76 89 81 80 79 L15 74 Z',
    details: (c) => `
      <path d="M50 20 L50 64 M34 24 C30 38 28 50 28 64 M66 24 C70 38 72 50 72 64" fill="none" stroke="${c.line}" stroke-width="1.4" opacity=".65"/>
      <circle cx="50" cy="24" r="3" fill="${c.line}"/>`,
  },
  watch: {
    path: 'M40 12 L60 12 L58 44 L42 44 Z M42 76 L58 76 L60 108 L40 108 Z',
    details: (c) => `
      <circle cx="50" cy="60" r="22" fill="${c.dial}" stroke="${c.metal}" stroke-width="4"/>
      <path d="M50 48 L50 60 L59 64" fill="none" stroke="${c.line}" stroke-width="2" stroke-linecap="round"/>`,
  },
  headband: {
    path: 'M50 18 C74 18 88 40 88 66 L76 66 C76 46 66 30 50 30 C34 30 24 46 24 66 L12 66 C12 40 26 18 50 18 Z',
    details: () => '',
  },
  tag: {
    path: 'M28 20 L72 20 C77 20 80 23 80 28 L80 96 C80 101 77 104 72 104 L28 104 C23 104 20 101 20 96 L20 28 C20 23 23 20 28 20 Z',
    details: (c) => `<circle cx="50" cy="34" r="5" fill="none" stroke="${c.line}" stroke-width="2.4"/>`,
  },
};

/** Subtyp → Form, ausgewertet in Reihenfolge, letzter Eintrag ist der Fallback. */
const SHAPE_RULES = {
  top: [
    [/polo/i, 'polo'],
    [/rollkragen|turtleneck/i, 'turtleneck'],
    [/cardigan|strickjacke/i, 'cardigan'],
    [/t-?shirt/i, 'tshirt'],
    [/hemd|bluse|shirt/i, 'shirt'],
    [/./, 'sweater'],
  ],
  bottom: [
    [/rock|skirt/i, 'skirt'],
    [/short|bermuda/i, 'shorts'],
    [/./, 'trousers'],
  ],
  dress: [[/./, 'dress']],
  outer: [
    [/weste|vest|gilet/i, 'vest'],
    [/mantel|coat|trench/i, 'coat'],
    [/./, 'blazer'],
  ],
  shoes: [
    [/sneaker|turnschuh/i, 'sneaker'],
    [/chelsea|stiefel|boot(?!s)/i, 'boot'],
    [/ballerina|flat/i, 'flat'],
    [/./, 'loafer'],
  ],
  accessory: [
    [/krawatte|tie|fliege/i, 'tie'],
    [/schal|tuch|scarf/i, 'scarf'],
    [/gürtel|guertel|belt/i, 'belt'],
    [/perlen|kette|collier/i, 'necklace'],
    [/cap|mütze|muetze|hut|kappe/i, 'cap'],
    [/uhr|watch/i, 'watch'],
    [/haarband|stirnband|reif/i, 'headband'],
    [/./, 'tag'],
  ],
};

export function shapeFor({ category, subtype = '', name = '' }) {
  const rules = SHAPE_RULES[category] || SHAPE_RULES.accessory;
  const text = `${subtype} ${name}`;
  for (const [test, shape] of rules) {
    if (test.test(text)) return shape;
  }
  return 'tag';
}

/* --------------------------------------------------------------------------
   Muster
   -------------------------------------------------------------------------- */

/** Inhalt einer <pattern>-Kachel je Musterart. */
function patternTile(kind, ink) {
  switch (kind) {
    case 'stripes':
      return {
        size: 12,
        transform: 'rotate(45)',
        content: `<rect x="0" y="0" width="4.5" height="12" fill="${ink}"/>`,
      };
    case 'argyle':
      return {
        size: 26,
        transform: '',
        content: `
          <path d="M13 0 L26 13 L13 26 L0 13 Z" fill="${ink}" opacity=".85"/>
          <path d="M13 0 L26 13 L13 26 L0 13 Z" fill="none" stroke="${ink}" stroke-width="1"/>
          <path d="M0 0 L26 26 M26 0 L0 26" stroke="${ink}" stroke-width=".9" opacity=".55"/>`,
      };
    case 'tartan':
      return {
        size: 24,
        transform: '',
        content: `
          <rect x="0" y="0" width="24" height="7" fill="${ink}" opacity=".7"/>
          <rect x="0" y="0" width="7" height="24" fill="${ink}" opacity=".7"/>
          <rect x="14" y="0" width="2" height="24" fill="${ink}" opacity=".9"/>
          <rect x="0" y="14" width="24" height="2" fill="${ink}" opacity=".9"/>`,
      };
    case 'houndstooth':
      return {
        size: 16,
        transform: '',
        content: `
          <path d="M0 0 L8 0 L8 8 L0 8 Z" fill="${ink}"/>
          <path d="M8 8 L16 8 L16 16 L8 16 Z" fill="${ink}"/>
          <path d="M8 0 L12 4 L8 8 Z" fill="${ink}"/>
          <path d="M0 8 L4 12 L0 16 Z" fill="${ink}"/>
          <path d="M16 4 L12 8 L16 12 Z" fill="${ink}" opacity=".9"/>`,
      };
    case 'polkadot':
      return {
        size: 14,
        transform: '',
        content: `<circle cx="7" cy="7" r="2.6" fill="${ink}"/>`,
      };
    case 'cable':
      return {
        size: 14,
        transform: '',
        content: `
          <path d="M3.5 0 C6.5 3.5 6.5 10.5 3.5 14" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M10.5 0 C7.5 3.5 7.5 10.5 10.5 14" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`,
      };
    default:
      return null;
  }
}

/* --------------------------------------------------------------------------
   Rendering
   -------------------------------------------------------------------------- */

function detailColors(color, patternColor) {
  const dark = luminance(color) < 0.28;
  return {
    line: contrastLine(color, 0.32),
    dark: shade(color, dark ? 0.14 : -0.16),
    light: shade(color, dark ? 0.24 : -0.08),
    sole: '#FAFAF7',
    metal: '#B08D3E',
    dial: shade(patternColor || color, dark ? 0.35 : -0.05),
  };
}

/**
 * Vollständiges Inline-SVG für ein Kleidungsstück.
 * Decorative by default – der Name steht in den Karten daneben.
 */
export function garmentSvg(garment, { label = null, className = 'garment-svg' } = {}) {
  const shapeKey = shapeFor(garment);
  const shape = SHAPES[shapeKey] || SHAPES.tag;
  const color = garment.color || '#C19A6B';
  const patternColor = garment.patternColor || '#FFFDF7';
  const colors = detailColors(color, patternColor);
  const outline = contrastLine(color, 0.42);

  const uid = `p${(uidCounter += 1)}`;
  const tile = garment.pattern && garment.pattern !== 'solid'
    ? patternTile(garment.pattern, patternColor)
    : null;

  const defs = tile
    ? `<defs><pattern id="${uid}" width="${tile.size}" height="${tile.size}"
         patternUnits="userSpaceOnUse" patternTransform="${tile.transform}">
         ${tile.content}</pattern></defs>`
    : '';

  const body = shape.path
    ? `<path d="${shape.path}" fill="${color}" stroke="${outline}" stroke-width="2"
         stroke-linejoin="round" fill-rule="evenodd"/>
       ${tile ? `<path d="${shape.path}" fill="url(#${uid})" fill-rule="evenodd" opacity=".9"/>` : ''}
       ${tile ? `<path d="${shape.path}" fill="none" stroke="${outline}" stroke-width="2"
            stroke-linejoin="round" fill-rule="evenodd"/>` : ''}`
    : '';

  const a11y = label
    ? `role="img" aria-label="${escapeAttr(label)}"`
    : 'role="presentation" aria-hidden="true" focusable="false"';

  return `<svg class="${className}" viewBox="${VIEWBOX}" ${a11y}>
    ${defs}${body}${shape.details ? shape.details(colors, color) : ''}
  </svg>`;
}

/** Kleines quadratisches Muster-Plättchen für die Auswahl-Chips im Formular. */
export function patternSwatch(patternKey, color = '#2E4B3C', patternColor = '#F2E9DC') {
  const uid = `s${(uidCounter += 1)}`;
  const tile = patternKey === 'solid' ? null : patternTile(patternKey, patternColor);
  const defs = tile
    ? `<defs><pattern id="${uid}" width="${tile.size}" height="${tile.size}"
         patternUnits="userSpaceOnUse" patternTransform="${tile.transform}">
         ${tile.content}</pattern></defs>`
    : '';
  return `<svg class="swatch" viewBox="0 0 40 40" role="presentation" aria-hidden="true" focusable="false">
    ${defs}<rect width="40" height="40" rx="10" fill="${color}"/>
    ${tile ? `<rect width="40" height="40" rx="10" fill="url(#${uid})"/>` : ''}
  </svg>`;
}

function escapeAttr(value) {
  return String(value).replace(/[&<>"]/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}
