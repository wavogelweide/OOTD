/**
 * OOTD – Outfit-Engine (Bauplan §5).
 *
 * Reine Funktionen ohne DOM-Zugriff: Zufallszahlen mit Seed, Bewertung
 * eines Outfits nach Farbharmonie, Musterdisziplin, Formalität und
 * Preppy-Score sowie die Erzeugung des Tagesvorschlags.
 *
 * Determinismus ist Absicht: derselbe Seed liefert dasselbe Outfit,
 * damit der Vorschlag über den Tag hinweg stabil bleibt.
 */

import { hexToHsl, hexToRgb } from './color.js';
import { LOUD_PATTERNS, PATTERNS, FORMALITY_LABELS } from './catalog.js';

/* --------------------------------------------------------------------------
   1. Zufall mit Seed
   -------------------------------------------------------------------------- */

/** Streut einen String zu einem 32-Bit-Startwert (xmur3). */
export function hashString(text) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Kleiner, schneller PRNG – liefert Werte in [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRandom(seedText) {
  return mulberry32(hashString(String(seedText)));
}

/** Datum als YYYY-MM-DD in lokaler Zeit – Basis des Tages-Seeds. */
export function dateKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* --------------------------------------------------------------------------
   2. Farb-Bewertung
   -------------------------------------------------------------------------- */

/** Buntheit einer Farbe, 0 (unbunt) bis 1 (voll gesättigt). */
export function chroma(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
}

/**
 * Neutral im Sinne des Old-Money-Kanons.
 *
 * Maßstab ist bewusst die Buntheit und nicht die HSL-Sättigung: Sehr helle
 * und sehr dunkle Töne haben rechnerisch eine hohe Sättigung, obwohl sie als
 * Basis wirken – Creme (#F2E9DC) etwa kommt auf eine Sättigung von 0,46,
 * bei einer Buntheit von nur 0,09.
 *
 * Damit zählen Creme, Weiß, Beige, Grau, Schwarz, Braun, Salbei, Hellblau
 * und die dunklen Blau- und Grüntöne zur Basis; als Akzent gelten die
 * kräftigen Töne wie Burgund, Senf, Camel oder Dunkelrot.
 */
export function isNeutral(hex) {
  if (chroma(hex) < 0.2) return true;
  const { h, l } = hexToHsl(hex);
  const isNavy = h >= 195 && h <= 255 && l < 0.42;
  const isBrown = h >= 15 && h <= 45 && l < 0.45;
  return isNavy || isBrown;
}

/** Abstand zweier Farbtöne auf dem Farbkreis, 0–180 Grad. */
export function hueDistance(a, b) {
  const d = Math.abs(((a % 360) + 360) % 360 - ((b % 360) + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/** Beziehung zweier Akzentfarben zueinander, als Teilscore 0–100. */
function accentRelation(a, b) {
  const d = hueDistance(a.h, b.h);
  const lightnessGap = Math.abs(a.l - b.l);
  if (d < 15) return { score: lightnessGap > 0.12 ? 95 : 78, kind: 'monochrom' };
  if (d < 40) return { score: 90, kind: 'analog' };
  if (d >= 160) return { score: 85, kind: 'komplementär' };
  return { score: 38, kind: 'dissonant' };
}

/**
 * Farbharmonie (40 % der Gesamtwertung).
 * Ideal ist eine neutrale Basis mit höchstens einem gesättigten Akzent.
 */
export function scoreColors(items) {
  if (items.length === 0) return { score: 0, accents: [], relations: [] };

  const accents = items.filter((i) => !isNeutral(i.color));
  const accentHsl = accents.map((i) => ({ ...hexToHsl(i.color), item: i }));

  let score;
  const relations = [];
  if (accents.length === 0) {
    score = 80; // Ganz in Neutralen: sicher, aber ohne Spannung.
  } else if (accents.length === 1) {
    score = 100;
  } else {
    for (let i = 0; i < accentHsl.length; i += 1) {
      for (let j = i + 1; j < accentHsl.length; j += 1) {
        relations.push({
          ...accentRelation(accentHsl[i], accentHsl[j]),
          a: accentHsl[i].item,
          b: accentHsl[j].item,
        });
      }
    }
    const average = relations.reduce((sum, r) => sum + r.score, 0) / relations.length;
    // Jede weitere Akzentfarbe über zwei hinaus kostet zusätzlich.
    score = average - (accents.length - 2) * 12;
  }

  // Kein Ton-in-Ton-Brei: Ober- und Unterteil dürfen sich unterscheiden.
  const top = items.find((i) => i.category === 'top');
  const bottom = items.find((i) => i.category === 'bottom');
  if (top && bottom) {
    const gap = Math.abs(hexToHsl(top.color).l - hexToHsl(bottom.color).l);
    score += gap >= 0.15 ? 6 : -4;
  }

  return { score: clamp(score), accents, relations };
}

/* --------------------------------------------------------------------------
   3. Muster, Formalität, Preppy
   -------------------------------------------------------------------------- */

/** Musterdisziplin (20 %): höchstens ein auffälliges Muster pro Outfit. */
export function scorePatterns(items) {
  const loud = items.filter((i) => LOUD_PATTERNS.has(i.pattern));
  const byCount = { 0: 85, 1: 100, 2: 45 };
  return { score: byCount[loud.length] ?? 15, loud };
}

/** Formalitäts-Kohärenz (20 %): keine Anzughose zur Tennisshorts. */
export function scoreFormality(items) {
  if (items.length === 0) return { score: 0, spread: 0, level: 2 };
  const levels = items.map((i) => Number(i.formality));
  const spread = Math.max(...levels) - Math.min(...levels);
  const bySpread = { 0: 100, 1: 88 };
  const level = Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
  return { score: bySpread[spread] ?? 40, spread, level };
}

/** Preppy-Anteil (20 %): Mittel der Einzelwerte, normiert auf 0–100. */
export function scorePreppy(items) {
  if (items.length === 0) return { score: 0 };
  const sum = items.reduce((acc, i) => acc + (Number(i.preppyScore) || 0), 0);
  return { score: clamp((sum / items.length) * 10) };
}

/** Gesamtwertung 0–100 samt Teilergebnissen. */
export function scoreOutfit(items) {
  const colors = scoreColors(items);
  const patterns = scorePatterns(items);
  const formality = scoreFormality(items);
  const preppy = scorePreppy(items);

  const total = clamp(
    colors.score * 0.4 + patterns.score * 0.2 + formality.score * 0.2 + preppy.score * 0.2,
  );
  return { total, colors, patterns, formality, preppy, stars: toStars(total) };
}

export function toStars(total) {
  return Math.max(1, Math.min(5, Math.round(total / 20)));
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

/* --------------------------------------------------------------------------
   4. Outfits erzeugen
   -------------------------------------------------------------------------- */

const MAX_SAMPLES = 200;
/** Wie weit ein Vorschlag hinter dem Bestwert liegen darf, um noch infrage zu kommen. */
const TOP_TOLERANCE = 8;
/** Größe der Spitzengruppe, aus der gezogen wird. */
const TOP_POOL = 12;

function byCategory(garments) {
  const buckets = { top: [], bottom: [], outer: [], shoes: [], accessory: [] };
  for (const g of garments) if (buckets[g.category]) buckets[g.category].push(g);
  return buckets;
}

/**
 * Prüft, ob die Garderobe für einen Vorschlag reicht.
 * Gibt die fehlenden Bausteine im Klartext zurück.
 */
export function missingPieces(garments) {
  const b = byCategory(garments);
  const missing = [];
  if (b.top.length === 0) missing.push('ein Oberteil');
  if (b.bottom.length === 0) missing.push('ein Unterteil');
  if (b.shoes.length === 0) missing.push('ein Paar Schuhe');
  return missing;
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

/** Zieht eine zufällige, regelkonforme Kombination. */
function drawCandidate(rng, buckets) {
  const items = [
    pick(rng, buckets.top),
    pick(rng, buckets.bottom),
    pick(rng, buckets.shoes),
  ];

  if (buckets.outer.length > 0 && rng() < 0.5) items.push(pick(rng, buckets.outer));

  if (buckets.accessory.length > 0) {
    const count = rng() < 0.45 ? 0 : (rng() < 0.75 ? 1 : 2);
    const pool = [...buckets.accessory];
    for (let i = 0; i < count && pool.length > 0; i += 1) {
      items.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    }
  }
  return items;
}

/**
 * Erzeugt den besten Vorschlag aus der Garderobe.
 *
 * @param {Array} garments  Alle Kleidungsstücke.
 * @param {object} options  seed (z. B. "2026-08-01") und salt (Würfel-Zähler).
 * @returns {{ok: boolean, items?: Array, score?: object, reasons?: string[], missing?: string[]}}
 */
export function generateOutfit(garments, { seed = dateKey(), salt = 0 } = {}) {
  const missing = missingPieces(garments);
  if (missing.length > 0) return { ok: false, missing };

  const buckets = byCategory(garments);
  const rng = seededRandom(`${seed}#${salt}`);

  const candidates = [];
  const seen = new Set();
  for (let i = 0; i < MAX_SAMPLES; i += 1) {
    const items = drawCandidate(rng, buckets);
    const key = items.map((it) => it.id).sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({ items, score: scoreOutfit(items) });
  }
  candidates.sort((a, b) => b.score.total - a.score.total);

  // Nicht stur das Maximum nehmen: sonst liefert "Neu würfeln" fast immer
  // dasselbe Outfit. Alle Kandidaten der Spitzengruppe liegen ohnehin dicht
  // beieinander, deshalb wird daraus gleichverteilt gezogen – das kostet
  // kaum Qualität und bringt spürbar Abwechslung.
  const cutoff = candidates[0].score.total - TOP_TOLERANCE;
  const pool = candidates.filter((c) => c.score.total >= cutoff).slice(0, TOP_POOL);
  const chosen = pool[Math.floor(rng() * pool.length)];

  return { ok: true, ...chosen, reasons: explain(chosen.items, chosen.score) };
}

/* --------------------------------------------------------------------------
   5. Begründung (Bauplan §5.5)
   -------------------------------------------------------------------------- */

const patternLabel = (key) => PATTERNS.find((p) => p.key === key)?.label || key;

/** Ein bis zwei Sätze, warum das Outfit funktioniert. */
export function explain(items, score = scoreOutfit(items)) {
  const reasons = [];
  const { accents, relations } = score.colors;

  // 1. Satz: die Farben.
  if (accents.length === 0) {
    reasons.push('Ganz in gedeckten Tönen gehalten – zurückhaltend und nie verkehrt.');
  } else if (accents.length === 1) {
    const accent = accents[0];
    reasons.push(`${accent.colorName} setzt den einzigen Akzent, alles andere bleibt ruhig – genau so will es der Stil.`);
  } else {
    const best = [...relations].sort((a, b) => b.score - a.score)[0];
    const names = `${best.a.colorName} und ${best.b.colorName}`;
    if (best.kind === 'analog') {
      reasons.push(`${names} liegen nah beieinander im Farbkreis und wirken dadurch wie aus einem Guss.`);
    } else if (best.kind === 'komplementär') {
      reasons.push(`${names} stehen sich im Farbkreis gegenüber – das gibt dem Ganzen Spannung, ohne laut zu werden.`);
    } else if (best.kind === 'monochrom') {
      reasons.push(`${names} sind zwei Abstufungen desselben Tons – ein klassischer Ton-in-Ton-Auftritt.`);
    } else {
      reasons.push(`${names} treffen hier recht direkt aufeinander – mutig, aber tragbar.`);
    }
  }

  // 2. Satz: Muster oder Anlass.
  const loud = score.patterns.loud;
  if (loud.length === 1) {
    reasons.push(`Das ${patternLabel(loud[0].pattern)}-Muster am Stück „${loud[0].name}“ bleibt das einzige Muster – mehr verträgt der Look nicht.`);
  } else if (loud.length === 0) {
    reasons.push(`Alles unifarben, der Schnitt trägt den Auftritt. Anlass: ${FORMALITY_LABELS[score.formality.level]}.`);
  } else {
    reasons.push(`Zwei Muster auf einmal sind grenzwertig – wer mag, tauscht eines gegen ein unifarbenes Stück.`);
  }

  return reasons;
}
