/**
 * OOTD – Taxonomie der Garderobe.
 *
 * Kategorien, Subtypen, Farb- und Musterpaletten sowie die Berechnung des
 * Preppy-Scores (Bauplan §4.1, §4.2, §5.4). Reine Daten und reine Funktionen.
 */

import { rgbDistance } from './color.js';

export const CATEGORIES = [
  { key: 'top',       label: 'Oberteil',   plural: 'Oberteile',   icon: '👕' },
  { key: 'bottom',    label: 'Unterteil',  plural: 'Unterteile',  icon: '👖' },
  { key: 'dress',     label: 'Kleid',      plural: 'Kleider',     icon: '👗' },
  { key: 'outer',     label: 'Jacke',      plural: 'Jacken',      icon: '🧥' },
  { key: 'shoes',     label: 'Schuhe',     plural: 'Schuhe',      icon: '👞' },
  { key: 'accessory', label: 'Accessoire', plural: 'Accessoires', icon: '🧣' },
];

export const CATEGORY_BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

/** Vorschlagslisten je Kategorie (Bauplan §4.1). */
export const SUBTYPES = {
  top: ['Oxford-Hemd', 'Button-down-Hemd', 'Polohemd', 'Kaschmirpullover',
        'Rollkragenpullover', 'Cardigan', 'Cable-Knit-Sweater', 'Bluse', 'T-Shirt'],
  bottom: ['Chino', 'Anzughose', 'Faltenrock', 'Plisseerock', 'Tennisrock',
           'Cordhose', 'Dunkle Jeans', 'Bermuda-Shorts'],
  dress: ['Etuikleid', 'Hemdblusenkleid', 'Strickkleid', 'Tenniskleid'],
  outer: ['Blazer', 'Tweed-Sakko', 'Trenchcoat', 'Steppweste', 'Camel Coat',
          'Harrington-Jacke', 'College-Jacke'],
  shoes: ['Penny-Loafer', 'Tassel-Loafer', 'Oxford-Schuhe', 'Bootsschuhe',
          'Ballerinas', 'Weiße Sneaker', 'Brogues', 'Chelsea Boots'],
  accessory: ['Seidentuch', 'Krawatte', 'Ledergürtel', 'Perlenkette',
              'Baseball-Cap', 'Strickschal', 'Haarband', 'Uhr'],
};

/** Old-Money-Kernpalette (Bauplan §4.2). */
export const COLOR_PRESETS = [
  { name: 'Navy',         hex: '#22334E' },
  { name: 'Racing Green', hex: '#2E4B3C' },
  { name: 'Burgund',      hex: '#7A2E2E' },
  { name: 'Camel',        hex: '#C19A6B' },
  { name: 'Creme',        hex: '#F2E9DC' },
  { name: 'Weiß',         hex: '#FAFAF7' },
  { name: 'Hellblau',     hex: '#A8C3D7' },
  { name: 'Grau',         hex: '#8C8C88' },
  { name: 'Beige',        hex: '#D6C7A9' },
  { name: 'Braun',        hex: '#5B4636' },
  { name: 'Rosé',         hex: '#E3B7B8' },
  { name: 'Senf',         hex: '#C9A227' },
  { name: 'Schwarz',      hex: '#23211E' },
  { name: 'Dunkelrot',    hex: '#8E3B46' },
  { name: 'Salbei',       hex: '#9CAF88' },
  { name: 'Denim',        hex: '#3E5573' },
];

export const PATTERNS = [
  { key: 'solid',      label: 'Uni',         loud: false },
  { key: 'stripes',    label: 'Streifen',    loud: true  },
  { key: 'argyle',     label: 'Argyle',      loud: true  },
  { key: 'tartan',     label: 'Tartan',      loud: true  },
  { key: 'houndstooth', label: 'Hahnentritt', loud: true },
  // "Tupfen" statt "Punkte", damit das Muster-Etikett nicht mit der
  // Punktzahl des Outfits verwechselt wird.
  { key: 'polkadot',   label: 'Tupfen',      loud: true  },
  { key: 'cable',      label: 'Zopfstrick',  loud: false },
];

/** Muster, die als "laut" gelten – davon verträgt ein Outfit nur eines. */
export const LOUD_PATTERNS = new Set(PATTERNS.filter((p) => p.loud).map((p) => p.key));

export const FORMALITY_LABELS = { 1: 'Leger', 2: 'Smart Casual', 3: 'Formell' };
export const WARMTH_LABELS = { 1: 'Luftig', 2: 'Mittel', 3: 'Warm' };

/** Subtypen, die den Preppy-Kanon treffen (Bauplan §5.4). */
const PREPPY_PATTERN = new RegExp([
  'polo', 'chino', 'loafer', 'blazer', 'cardigan', 'cable', 'zopf', 'bootsschuh',
  'tennis', 'oxford', 'button-down', 'tweed', 'trench', 'perlen', 'seidentuch',
  'brogue', 'plissee', 'falten', 'kaschmir', 'harrington', 'college', 'steppweste',
  'camel', 'ballerina', 'hemdblusen', 'strickschal', 'etui', 'rollkragen',
  'krawatte', 'chelsea', 'mantel', 'bluse', 'hemd', 'sakko', 'cord',
].join('|'), 'i');

/** Subtypen, die dem Stil zuwiderlaufen. */
const ANTI_PATTERN = /jogging|sweatpant|jogger|hoodie|kapuzen|baseball-cap|\bcap\b|flip-?flop|crocs|trainingsanzug|jogginghose/i;

/**
 * Preppy-Score 0–10 aus Subtyp, Farbe und Muster (Bauplan §5.4).
 * Wird beim Speichern eines Teils berechnet und mitgespeichert.
 */
export function computePreppyScore({ subtype = '', name = '', color = '#000000', pattern = 'solid' }) {
  const text = `${subtype} ${name}`;
  let score = 5;

  if (PREPPY_PATTERN.test(text)) score += 3;
  if (ANTI_PATTERN.test(text)) score -= 2;
  if (isCorePaletteColor(color)) score += 1;
  if (['argyle', 'tartan', 'stripes', 'cable', 'houndstooth'].includes(pattern)) score += 1;

  return Math.max(0, Math.min(10, score));
}

/** Liegt die Farbe nah genug an der Kernpalette? */
export function isCorePaletteColor(hex, tolerance = 42) {
  return COLOR_PRESETS.some((p) => rgbDistance(p.hex, hex) <= tolerance);
}

/** Name des nächstgelegenen Preset-Tons, sonst "Eigene Farbe". */
export function colorNameFor(hex) {
  let best = null;
  let bestDist = Infinity;
  for (const preset of COLOR_PRESETS) {
    const d = rgbDistance(preset.hex, hex);
    if (d < bestDist) { bestDist = d; best = preset; }
  }
  return bestDist <= 12 ? best.name : 'Eigene Farbe';
}
