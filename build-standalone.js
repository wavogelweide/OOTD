/**
 * Baut aus der mehrteiligen App eine einzige, in sich geschlossene HTML-Datei.
 *
 * Nötig für das Veröffentlichen als Artifact: dort greift eine strenge
 * Content-Security-Policy, die jede Anfrage an fremde Hosts blockt – also
 * müssen CSS, JavaScript und Schriften in der Datei selbst stecken.
 *
 * Aufruf:  node build-standalone.js
 * Ergebnis: dist/index.html
 *
 * Die Schriften werden aus css/fonts.css gelesen (bereits als data:-URI
 * eingebettete Latin-Schnitte von Playfair Display und Nunito). Fehlt die
 * Datei, baut das Skript trotzdem – dann greifen die Fallback-Schriften.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/** Module in Abhängigkeitsreihenfolge – von unten nach oben im Graphen. */
const MODULES = [
  'js/color.js',
  'js/catalog.js',
  'js/store.js',
  'js/svg.js',
  'js/seed-data.js',
  'js/ui.js',
  'js/app.js',
];

/**
 * Führt die ES-Module zu einem Skript zusammen. Da alle Namen im Projekt
 * eindeutig sind, genügt es, die Import-Zeilen zu entfernen und das
 * Schlüsselwort `export` zu streichen.
 */
function bundleModules() {
  return MODULES.map((file) => {
    const source = read(file)
      .replace(/^import\s[\s\S]*?from\s+'[^']+';\s*$/gm, '')
      .replace(/^export\s+(?=(const|function|class|let))/gm, '')
      .trim();
    return `/* ===== ${file} ===== */\n${source}`;
  }).join('\n\n');
}

/** Nur den Inhalt von <body> übernehmen – Artifacts liefern das Gerüst selbst. */
function bodyContent(html) {
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)[1];
  return body
    // Externes Stylesheet und Modul-Skript werden unten inline ersetzt.
    .replace(/<script[^>]*src="[^"]*"[^>]*>\s*<\/script>/gi, '')
    .trim();
}

function build() {
  const html = read('index.html');
  const fontsCss = fs.existsSync(path.join(ROOT, 'css/fonts.css')) ? read('css/fonts.css') : '';
  if (!fontsCss) console.warn('Hinweis: css/fonts.css fehlt – Ausgabe nutzt Fallback-Schriften.');

  const out = `<title>OOTD – Dein täglicher Stilbegleiter</title>
<style>
${fontsCss}
${read('css/style.css')}
</style>

${bodyContent(html)}

<script type="module">
${bundleModules()}
</script>
`;

  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'dist/index.html'), out);
  console.log(`dist/index.html – ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB`);
}

build();
