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
  /* ---- Oberteile ------------------------------------------------------- */
  shirt: {
    // Hemd mit Kentkragen und langen Ärmeln.
    path: 'M38 10 L20 16 L8 40 L4 74 L18 79 L26 52 L26 108 L74 108 L74 52 L82 79 L96 74 L92 40 L80 16 L62 10 L50 28 Z',
    details: (c) => `
      <path d="M38 10 L34 22 L50 28 L66 22 L62 10 L50 28 Z" fill="${c.light}" stroke="${c.line}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M50 28 L50 106" stroke="${c.line}" stroke-width="1.6"/>
      ${[42, 58, 74, 90].map((y) => `<circle cx="50" cy="${y}" r="2" fill="${c.line}"/>`).join('')}
      <path d="M7 70 L20 74 M93 70 L80 74" stroke="${c.line}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M26 100 L74 100" stroke="${c.line}" stroke-width="1.3" opacity=".55"/>`,
  },
  polo: {
    // Kurze Ärmel, weicher Strickkragen, kurze Knopfleiste.
    path: 'M38 10 L18 18 L10 44 L28 51 L28 108 L72 108 L72 51 L90 44 L82 18 L62 10 L50 26 Z',
    details: (c) => `
      <path d="M38 10 L35 20 L50 26 L65 20 L62 10 L50 26 Z" fill="${c.light}" stroke="${c.line}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M50 26 L50 50" stroke="${c.line}" stroke-width="1.6"/>
      <circle cx="50" cy="34" r="2" fill="${c.line}"/>
      <circle cx="50" cy="44" r="2" fill="${c.line}"/>
      <path d="M14 40 L28 45 M86 40 L72 45" stroke="${c.line}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M28 102 L72 102" stroke="${c.line}" stroke-width="1.3" opacity=".55"/>`,
  },
  sweater: {
    // Rundhals, betonte Bündchen an Saum und Ärmeln.
    path: 'M36 12 C38 25 43 30 50 30 C57 30 62 25 64 12 L82 19 L95 44 L92 78 L76 82 L71 54 L71 110 L29 110 L29 54 L24 82 L8 78 L5 44 L18 19 Z',
    details: (c) => `
      <path d="M36 12 C38 25 43 30 50 30 C57 30 62 25 64 12" fill="none" stroke="${c.line}" stroke-width="3"/>
      <path d="M29 100 L71 100 L71 110 L29 110 Z" fill="${c.dark}"/>
      <path d="M9 72 L24 76 L22 84 L7 80 Z" fill="${c.dark}"/>
      <path d="M91 72 L76 76 L78 84 L93 80 Z" fill="${c.dark}"/>`,
  },
  turtleneck: {
    // Wie der Pullover, zusätzlich mit umgeschlagenem Rollkragen.
    path: 'M42 4 L58 4 L58 18 L64 12 L82 19 L95 44 L92 78 L76 82 L71 54 L71 110 L29 110 L29 54 L24 82 L8 78 L5 44 L18 19 L36 12 L42 18 Z',
    details: (c) => `
      <path d="M40 3 L60 3 L60 20 L40 20 Z" fill="${c.dark}" stroke="${c.line}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M45 4 L45 19 M50 4 L50 19 M55 4 L55 19" stroke="${c.line}" stroke-width="1" opacity=".5"/>
      <path d="M29 100 L71 100 L71 110 L29 110 Z" fill="${c.dark}"/>
      <path d="M9 72 L24 76 L22 84 L7 80 Z" fill="${c.dark}"/>
      <path d="M91 72 L76 76 L78 84 L93 80 Z" fill="${c.dark}"/>`,
  },
  tshirt: {
    path: 'M36 12 C38 25 43 30 50 30 C57 30 62 25 64 12 L84 21 L92 48 L72 55 L72 108 L28 108 L28 55 L8 48 L16 21 Z',
    details: (c) => `
      <path d="M36 12 C38 25 43 30 50 30 C57 30 62 25 64 12" fill="none" stroke="${c.line}" stroke-width="2.6"/>
      <path d="M28 102 L72 102" stroke="${c.line}" stroke-width="1.3" opacity=".5"/>`,
  },
  cardigan: {
    // Offene Strickjacke: zwei Vorderteile, Knopfleiste, V-Ausschnitt.
    path: 'M36 12 L18 19 L5 44 L8 78 L24 82 L29 54 L29 110 L47 110 L47 30 Z M64 12 L82 19 L95 44 L92 78 L76 82 L71 54 L71 110 L53 110 L53 30 Z',
    details: (c) => `
      <path d="M36 12 L47 32 M64 12 L53 32" fill="none" stroke="${c.line}" stroke-width="2.2"/>
      <path d="M41 30 L47 30 L47 110 L41 110 Z" fill="${c.dark}"/>
      ${[42, 58, 74, 90].map((y) => `<circle cx="44" cy="${y}" r="2.1" fill="${c.light}"/>`).join('')}
      <path d="M29 102 L47 102 M53 102 L71 102" stroke="${c.line}" stroke-width="1.3" opacity=".55"/>`,
  },

  /* ---- Unterteile ------------------------------------------------------ */
  trousers: {
    path: 'M27 10 L73 10 L76 46 L71 112 L55 112 L50 58 L45 112 L29 112 L24 46 Z',
    details: (c) => `
      <path d="M25.5 10 L74.5 10 L75.6 22 L24.4 22 Z" fill="${c.dark}"/>
      <path d="M34 10 L34 22 M66 10 L66 22" stroke="${c.line}" stroke-width="1.3" opacity=".6"/>
      <path d="M50 24 L50 56" stroke="${c.line}" stroke-width="1.4" opacity=".7"/>
      <path d="M38 30 L38 106 M62 30 L62 106" stroke="${c.line}" stroke-width="1.1" opacity=".4"/>`,
  },
  shorts: {
    path: 'M27 10 L73 10 L75 42 L71 78 L55 78 L50 48 L45 78 L29 78 L25 42 Z',
    details: (c) => `
      <path d="M26 10 L74 10 L74.8 21 L25.2 21 Z" fill="${c.dark}"/>
      <path d="M50 23 L50 46" stroke="${c.line}" stroke-width="1.4" opacity=".7"/>
      <path d="M29 71 L45 71 M55 71 L71 71" stroke="${c.line}" stroke-width="1.6" opacity=".65"/>`,
  },
  skirt: {
    // Faltenrock: Bundband plus angedeutete Kellerfalten.
    path: 'M29 10 L71 10 L87 94 C74 102 26 102 13 94 Z',
    details: (c) => `
      <path d="M28.6 10 L71.4 10 L72.9 24 L27.1 24 Z" fill="${c.dark}"/>
      <path d="M39 26 L31 97 M50 26 L50 100 M61 26 L69 97" stroke="${c.line}" stroke-width="1.3" opacity=".5"/>
      <path d="M44 26 L40 99 M56 26 L60 99" stroke="${c.line}" stroke-width="1" opacity=".3"/>`,
  },

  /* ---- Kleid ----------------------------------------------------------- */
  dress: {
    path: 'M36 10 C38 23 43 28 50 28 C57 28 62 23 64 10 L81 17 L90 45 L74 52 L70 41 L72 62 L88 106 C72 114 28 114 12 106 L28 62 L30 41 L26 52 L10 45 L19 17 Z',
    details: (c) => `
      <path d="M36 10 C38 23 43 28 50 28 C57 28 62 23 64 10" fill="none" stroke="${c.line}" stroke-width="2.4"/>
      <path d="M28.6 60 C40 65 60 65 71.4 60 L72 68 C60 73 40 73 28 68 Z" fill="${c.dark}"/>
      <path d="M22 92 C38 98 62 98 78 92" fill="none" stroke="${c.line}" stroke-width="1.2" opacity=".45"/>`,
  },

  /* ---- Jacken ---------------------------------------------------------- */
  blazer: {
    // Offener Blazer mit Reverskragen, Knöpfen und Taschenklappen.
    path: 'M37 10 L18 18 L4 46 L7 80 L23 84 L28 56 L26 112 L47 112 L49 40 Z M63 10 L82 18 L96 46 L93 80 L77 84 L72 56 L74 112 L53 112 L51 40 Z',
    details: (c) => `
      <path d="M37 10 L49 42 L56 12 Z" fill="${c.light}" stroke="${c.line}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M63 10 L51 42 L44 12 Z" fill="${c.light}" stroke="${c.line}" stroke-width="1.4" stroke-linejoin="round"/>
      <circle cx="47" cy="62" r="2.3" fill="${c.line}"/>
      <circle cx="47" cy="76" r="2.3" fill="${c.line}"/>
      <path d="M30 84 L43 84 L43 91 L30 91 Z" fill="${c.dark}" stroke="${c.line}" stroke-width="1"/>
      <path d="M70 84 L57 84 L57 91 L70 91 Z" fill="${c.dark}" stroke="${c.line}" stroke-width="1"/>
      <path d="M62 28 L69 28" stroke="${c.line}" stroke-width="1.6" opacity=".7"/>`,
  },
  coat: {
    // Langer Mantel, zweireihig, mit Gürtel.
    path: 'M37 8 L18 16 L5 46 L8 82 L24 86 L29 56 L29 114 L71 114 L71 56 L76 86 L92 82 L95 46 L82 16 L63 8 L50 26 Z',
    details: (c) => `
      <path d="M37 8 L50 26 L63 8" fill="none" stroke="${c.line}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M50 26 L50 114" stroke="${c.line}" stroke-width="1.5" opacity=".65"/>
      <path d="M29 62 L71 62 L71 73 L29 73 Z" fill="${c.dark}"/>
      <path d="M54 62 L54 73" stroke="${c.metal}" stroke-width="3.2"/>
      ${[42, 84, 98].map((y) => `<circle cx="42" cy="${y}" r="2.1" fill="${c.line}"/><circle cx="58" cy="${y}" r="2.1" fill="${c.line}"/>`).join('')}`,
  },
  vest: {
    // Steppweste: ärmellos, offene Front, Steppnähte.
    path: 'M38 12 L24 20 L21 108 L47 108 L47 32 Z M62 12 L76 20 L79 108 L53 108 L53 32 Z',
    details: (c) => `
      <path d="M38 12 L47 34 M62 12 L53 34" fill="none" stroke="${c.line}" stroke-width="2.2"/>
      ${[46, 62, 78, 94].map((y) => `<path d="M22 ${y} L47 ${y} M53 ${y} L78 ${y}" stroke="${c.line}" stroke-width="1.2" opacity=".5"/>`).join('')}
      <path d="M44 34 L47 34 L47 108 L44 108 Z" fill="${c.dark}"/>`,
  },

  /* ---- Schuhe (Seitenansicht, Spitze rechts) ---------------------------- */
  loafer: {
    // Profil mit Fersenkappe hinten, Einstiegskerbe und flachem Rist.
    box: '2 32 100 72',
    path: 'M12 84 L12 63 C12 51 20 45 33 44 L41 44 C43 55 51 59 61 57 L71 55 C86 53 96 64 97 84 Z',
    details: (c) => `
      <path d="M8 82 L96 82 C99 82 100 88 97 91 C94 94 88 95 80 95 L16 95 C11 95 8 92 8 88 Z"
            fill="${c.dark}" stroke="${c.line}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M58 51 L77 48 L78 60 L59 63 Z" fill="${c.light}" stroke="${c.line}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M65 54 L71 53" stroke="${c.dark}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M12 70 C20 66 28 64 38 63" fill="none" stroke="${c.line}" stroke-width="1.4" opacity=".6"/>
      <path d="M8 88 L96 88" stroke="${c.line}" stroke-width="1" opacity=".45"/>`,
  },
  sneaker: {
    box: '2 30 100 74',
    path: 'M10 84 L10 62 C10 51 18 45 30 44 L40 44 C42 54 50 57 60 55 L70 53 C86 51 96 63 97 84 Z',
    details: (c) => `
      <path d="M6 80 L97 80 C100 80 101 88 98 91 C95 94 88 96 80 96 L14 96 C9 96 5 92 5 87 Z"
            fill="${c.sole}" stroke="${c.line}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M44 52 L56 62 M50 49 L63 59 M56 46 L70 56" stroke="${c.line}" stroke-width="2" stroke-linecap="round"/>
      <path d="M74 50 C85 56 94 67 96 80" fill="none" stroke="${c.line}" stroke-width="2"/>
      <path d="M10 62 C18 58 26 56 34 55" fill="none" stroke="${c.line}" stroke-width="1.6" opacity=".6"/>
      <path d="M5 86 L99 86" stroke="${c.line}" stroke-width="1.1" opacity=".5"/>`,
  },
  oxford: {
    // Schnürschuh: Fersenkappe, Schnürung über der Lasche, Kappennaht vorn.
    box: '2 32 100 72',
    path: 'M12 84 L12 63 C12 51 20 45 33 44 L41 44 C43 55 51 59 61 57 L71 55 C86 53 96 64 97 84 Z',
    details: (c) => `
      <path d="M8 82 L96 82 C99 82 100 88 97 91 C94 94 88 95 80 95 L16 95 C11 95 8 92 8 88 Z"
            fill="${c.dark}" stroke="${c.line}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M42 46 L58 58 M46 44 L62 56 M50 42.5 L66 54" stroke="${c.line}" stroke-width="2" stroke-linecap="round"/>
      <path d="M72 55 C80 57 86 63 89 72" fill="none" stroke="${c.line}" stroke-width="1.6" opacity=".75"/>
      <path d="M12 68 C20 64 28 62 37 61" fill="none" stroke="${c.line}" stroke-width="1.4" opacity=".55"/>
      <path d="M8 88 L96 88" stroke="${c.line}" stroke-width="1" opacity=".45"/>`,
  },
  boot: {
    // Chelsea Boot: hoher Schaft mit elastischem Seiteneinsatz.
    box: '8 2 92 100',
    path: 'M24 10 L56 10 L57 50 C76 54 90 66 92 84 L18 84 L21 40 Z',
    details: (c) => `
      <path d="M14 82 L93 82 C96 82 97 88 94 91 C91 94 85 95 77 95 L22 95 C16 95 13 91 13 87 Z"
            fill="${c.dark}" stroke="${c.line}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M23.5 10 L56.5 10 L56.7 21 L23 21 Z" fill="${c.dark}"/>
      <path d="M58 24 L65 25 L66 52 L58.5 50 Z" fill="${c.light}" stroke="${c.line}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M60 28 L64 28.5 M60 34 L64 34.5 M60 40 L64 40.5" stroke="${c.line}" stroke-width="1" opacity=".6"/>
      <path d="M57 58 C70 62 81 70 86 80" fill="none" stroke="${c.line}" stroke-width="1.3" opacity=".5"/>`,
  },
  flat: {
    // Ballerina: sehr flach, weiter Ausschnitt, kleine Schleife an der Spitze.
    box: '4 40 96 62',
    path: 'M14 84 L14 73 C14 64 23 59 35 57 L45 56 C47 64 55 66 64 64 L73 62 C86 60 94 70 95 84 Z',
    details: (c) => `
      <path d="M11 82 L94 82 C97 82 98 86 96 89 C93 92 87 93 79 93 L18 93 C13 93 10 90 10 86 Z"
            fill="${c.dark}" stroke="${c.line}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M14 74 C22 70 30 68 38 67" fill="none" stroke="${c.line}" stroke-width="1.4" opacity=".6"/>
      <path d="M70 58 C75 53 82 54 83 59 C80 57 74 57 70 58 Z M83 59 C88 55 93 58 92 63 C90 60 86 59 83 59 Z"
            fill="${c.light}" stroke="${c.line}" stroke-width="1.1" stroke-linejoin="round"/>
      <circle cx="83" cy="60" r="2" fill="${c.line}"/>`,
  },

  /* ---- Accessoires ------------------------------------------------------ */
  tie: {
    path: 'M40 8 L60 8 L65 28 L35 28 Z M37 31 L63 31 L57 92 L50 108 L43 92 Z',
    details: (c) => `
      <path d="M40 8 L60 8 L65 28 L35 28 Z" fill="${c.dark}" stroke="${c.line}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M44 14 C47 20 53 20 56 14" fill="none" stroke="${c.line}" stroke-width="1.4" opacity=".7"/>
      <path d="M37 31 L63 31" stroke="${c.line}" stroke-width="1.6" opacity=".6"/>`,
  },
  scarf: {
    // Schlauchschal: geschlossener Ring (Loch über fill-rule) mit zwei Enden.
    path: 'M50 6 C30 6 18 18 18 32 C18 44 26 53 38 57 L34 110 L48 110 L50 68 L52 110 L66 110 L62 57 C74 53 82 44 82 32 C82 18 70 6 50 6 Z '
        + 'M50 20 C62 20 70 25 70 31 C70 37 62 43 50 43 C38 43 30 37 30 31 C30 25 38 20 50 20 Z',
    details: (c) => `
      ${[37, 42, 47].map((x) => `<path d="M${x} 110 L${x} 117" stroke="${c.line}" stroke-width="2" stroke-linecap="round"/>`).join('')}
      ${[53, 58, 63].map((x) => `<path d="M${x} 110 L${x} 117" stroke="${c.line}" stroke-width="2" stroke-linecap="round"/>`).join('')}
      <path d="M36 70 L48 70 M52 70 L64 70 M36 88 L47 88 M53 88 L64 88"
            stroke="${c.line}" stroke-width="1.3" opacity=".45"/>`,
  },
  belt: {
    box: '0 32 100 60',
    path: 'M6 50 L70 50 L70 74 L6 74 Z',
    details: (c) => `
      <path d="M68 44 L94 44 L94 80 L68 80 Z" fill="none" stroke="${c.metal}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M60 56 L60 68" stroke="${c.metal}" stroke-width="4" stroke-linecap="round"/>
      ${[18, 30, 42].map((x) => `<circle cx="${x}" cy="62" r="2.6" fill="${c.dark}"/>`).join('')}
      <path d="M6 54 L70 54 M6 70 L70 70" stroke="${c.line}" stroke-width="1.1" opacity=".5"/>`,
  },
  necklace: {
    box: '10 12 80 72',
    path: '',
    details: (c, color) => {
      const beads = [];
      for (let i = 0; i <= 16; i += 1) {
        const t = Math.PI * (i / 16);
        const x = 50 - Math.cos(t) * 34;
        const y = 22 + Math.sin(t) * 52;
        const r = i === 8 ? 7.5 : 4.2;
        beads.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${color}" stroke="${c.line}" stroke-width="1"/>`);
      }
      return beads.join('');
    },
  },
  cap: {
    // Baseball-Cap im Profil: Kuppel mit Nahtlinien und Schirm.
    box: '8 10 92 78',
    path: 'M18 62 C18 34 33 19 51 19 C69 19 84 34 84 62 Z M16 62 L93 67 C96 76 90 81 81 79 L16 73 Z',
    details: (c) => `
      <path d="M51 19 L51 62 M35 23 C31 37 29 49 29 62 M67 23 C71 37 73 49 73 62"
            fill="none" stroke="${c.line}" stroke-width="1.4" opacity=".6"/>
      <circle cx="51" cy="22" r="3.2" fill="${c.dark}"/>
      <path d="M16 66 L91 70" stroke="${c.line}" stroke-width="1.4" opacity=".5"/>`,
  },
  watch: {
    path: 'M40 10 L60 10 L58 44 L42 44 Z M42 76 L58 76 L60 110 L40 110 Z',
    details: (c) => `
      ${[16, 24, 32].map((y) => `<path d="M41 ${y} L59 ${y}" stroke="${c.line}" stroke-width="1.1" opacity=".45"/>`).join('')}
      ${[86, 94, 102].map((y) => `<path d="M41 ${y} L59 ${y}" stroke="${c.line}" stroke-width="1.1" opacity=".45"/>`).join('')}
      <circle cx="50" cy="60" r="23" fill="${c.dial}" stroke="${c.metal}" stroke-width="4.5"/>
      <circle cx="50" cy="60" r="16" fill="none" stroke="${c.line}" stroke-width="1" opacity=".4"/>
      <path d="M50 47 L50 60 L60 65" fill="none" stroke="${c.line}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="50" cy="60" r="2" fill="${c.line}"/>`,
  },
  headband: {
    box: '4 10 92 64',
    path: 'M50 18 C74 18 88 40 88 66 L76 66 C76 46 66 30 50 30 C34 30 24 46 24 66 L12 66 C12 40 26 18 50 18 Z',
    details: (c) => `
      <path d="M50 24 C70 24 82 44 82 66 M50 24 C30 24 18 44 18 66"
            fill="none" stroke="${c.line}" stroke-width="1.2" opacity=".45"/>`,
  },
  tag: {
    path: 'M28 20 L72 20 C77 20 80 23 80 28 L80 96 C80 101 77 104 72 104 L28 104 C23 104 20 101 20 96 L20 28 C20 23 23 20 28 20 Z',
    details: (c) => `
      <circle cx="50" cy="34" r="5" fill="none" stroke="${c.line}" stroke-width="2.4"/>
      <path d="M32 56 L68 56 M32 68 L68 68 M32 80 L56 80" stroke="${c.line}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,
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
    [/oxford|brogue|schnür|derby/i, 'oxford'],
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
    case 'pinstripe':
      // Senkrechte Bahnen, ohne Drehung – im Nutzerkoordinatensystem des
      // Kleidungsstücks, damit sie auf allen Formen gleich breit laufen.
      return {
        size: 11,
        transform: '',
        content: `<rect x="0" y="0" width="4" height="11" fill="${ink}"/>`,
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
    // Weiße Sohle an dunklen Schuhen, abgedunkelte an hellen –
    // sonst verschwindet die Sohle im weißen Sneaker.
    sole: luminance(color) > 0.68 ? shade(color, -0.22) : '#FAFAF7',
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

  return `<svg class="${className}" viewBox="${shape.box || VIEWBOX}" ${a11y}>
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
