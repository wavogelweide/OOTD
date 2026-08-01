# OOTD – Bauplan: Tägliche Outfit-Vorschläge im Preppy/Old-Money-Stil

> **Zielgruppe dieses Dokuments:** Ein Claude-Modell (Opus/Sonnet), das die App eigenständig implementiert.
> **Arbeitsweise:** Die Phasen in Reihenfolge abarbeiten. Jede Phase endet mit einem lauffähigen Zustand und einem Commit.

---

## 1. Produktvision

**OOTD** ("Outfit Of The Day") ist eine reine Client-Side-Web-App (HTML/CSS/JS, keine Backend-Abhängigkeit), mit der Nutzer:

1. ihre eigene Garderobe digital pflegen (Kleidungsstücke mit Kategorie, Farbe, Muster, Material, Formalitätsgrad),
2. täglich automatisch generierte Outfit-Vorschläge erhalten,
3. die farblich harmonisch und stilistisch **preppy / old money** sind.

**Nicht-Ziele (bewusst weggelassen):** Kein Login, kein Server, keine Foto-Uploads mit KI-Erkennung, keine Wetter-API in v1 (optionaler Ausbau, siehe §10).

---

## 2. Technische Leitplanken

| Entscheidung | Vorgabe |
|---|---|
| Stack | Vanilla HTML + CSS + JavaScript (ES Modules), **kein Build-Tool, kein Framework** |
| Persistenz | `localStorage` (JSON, versioniertes Schema, Key `ootd.v1`) |
| Dateien | `index.html`, `css/style.css`, `js/`-Module (siehe §7) |
| Externe Ressourcen | Nur Google Fonts (mit Fallback-Stack). Sonst alles selbst gehostet/inline |
| Browser | Aktuelle Chrome/Firefox/Safari; responsive ab 360 px Breite |
| Sprache der UI | Deutsch |
| Barrierefreiheit | Semantisches HTML, Fokus-Stile, `aria-label` auf Icon-Buttons, Farbkontraste ≥ 4.5:1 für Text |

**Kleidungsstück-Darstellung:** Keine Fotos. Jedes Teil wird als stilisierte **SVG-Silhouette** seiner Kategorie gerendert, eingefärbt in der Teil-Farbe, mit Muster als SVG-Pattern-Overlay (siehe §6.3). Das hält die App leichtgewichtig und sieht einheitlich aus.

---

## 3. Design-System (modern & verspielt, aber old money)

Die Spannung auflösen: **Layout und Interaktion verspielt** (weiche Formen, Micro-Animationen, Sticker-artige Badges), **Farbwelt und Typografie klassisch** (Ivy-League-Palette, Serifen-Display-Font).

### 3.1 Farbpalette (CSS Custom Properties in `:root`)

```css
--cream:      #F7F3EB;  /* Seitenhintergrund */
--ivory:      #FFFDF7;  /* Karten */
--ink:        #1F2A24;  /* Text, fast-schwarzes Tannengrün */
--forest:     #2E4B3C;  /* Primär: Racing Green */
--camel:      #C19A6B;  /* Sekundär */
--burgundy:   #7A2E2E;  /* Akzent, sparsam */
--navy:       #22334E;  /* Akzent 2 */
--gold:       #B08D3E;  /* Highlights, Ränder, Sterne */
--blush:      #E8D5C4;  /* zarte Flächen, Hover */
```

### 3.2 Typografie

- **Display/Headlines:** `"Playfair Display", Georgia, serif` – klassisch, editorial.
- **UI/Fließtext:** `"Nunito", system-ui, sans-serif` – rund und freundlich (der "verspielte" Part).
- Headline der Startseite groß und mit kursivem Serif-Akzentwort (z. B. *"Dein Outfit für **heute**"*).

### 3.3 Verspielte Elemente

- Karten mit `border-radius: 20px+`, dezenter doppelter Rahmen (1px `--gold` innen) wie ein Etikett.
- Sanfte Einblend-Animationen (`@keyframes` fade-up, gestaffelt via `animation-delay`).
- "Würfeln"-Button für neuen Vorschlag mit kurzer Shake/Rotate-Animation.
- Emoji/SVG-Badges als "Sticker": z. B. 🎾 ⛵ 🏇 als Deko im Header, Wappen-artiges Logo (einfaches SVG-Crest mit "OOTD"-Monogramm).
- Dezentes Nadelstreifen- oder Rauten-(Argyle-)Hintergrundmuster in sehr niedriger Opazität auf `--cream`.
- Hover: Karten heben sich leicht (`translateY(-3px)` + weicher Schatten).

---

## 4. Datenmodell

```js
// localStorage Key: "ootd.v1"
{
  schemaVersion: 1,
  garments: [Garment],
  history: [ { date: "YYYY-MM-DD", outfitIds: [id], liked: bool|null } ],
  settings: { name: "" }   // Ausbau-Reserve
}

// Garment
{
  id: "g_<timestamp>_<rand>",       // string, eindeutig
  name: "Kaschmir-Pullover",         // frei, Pflicht
  category: "top" | "bottom" | "outer" | "shoes" | "accessory" | "dress",
  subtype: string,                   // aus Vorschlagsliste je Kategorie, s. §4.1
  color: "#RRGGBB",                  // via Farb-Picker + benannte Presets
  colorName: "Burgunderrot",         // automatisch aus Preset oder "Eigene Farbe"
  pattern: "solid" | "stripes" | "argyle" | "houndstooth" | "tartan" | "polkadot" | "cable",
  patternColor: "#RRGGBB" | null,    // Zweitfarbe des Musters, null bei solid
  formality: 1 | 2 | 3,              // 1 = leger, 2 = smart casual, 3 = formell
  warmth: 1 | 2 | 3,                 // 1 = luftig, 2 = mittel, 3 = warm
  preppyScore: number                // 0–10, automatisch berechnet, s. §5.4
}
```

### 4.1 Subtypen-Vorschlagslisten (Datalist/Chips im Formular)

- **top:** Hemd (Oxford/Button-down), Polohemd, Kaschmirpullover, Rollkragenpullover, Cardigan, Sweater (Cable-Knit), Bluse, T-Shirt
- **bottom:** Chino, Anzughose, Faltenrock, Plisseerock, Tennisrock, Cordhose, Jeans (dunkel), Shorts (Bermuda)
- **outer:** Blazer, Tweed-Sakko, Trenchcoat, Steppweste, Mantel (Camel Coat), Harrington-Jacke, College-Jacke
- **shoes:** Loafer (Penny/Tassel), Oxford-Schuhe, Bootsschuhe, Ballerinas, weiße Sneaker (clean), Brogues, Chelsea Boots
- **accessory:** Seidentuch, Krawatte, Gürtel (Leder), Perlenkette, Baseball-Cap, Strickschal, Haarband, Uhr
- **dress:** Etuikleid, Hemdblusenkleid, Strickkleid, Tenniskleid

### 4.2 Farb-Presets (Picker-Chips, je mit Name + Hex)

Old-Money-Kernpalette zuerst anbieten: Navy `#22334E`, Racing Green `#2E4B3C`, Burgund `#7A2E2E`, Camel `#C19A6B`, Creme `#F2E9DC`, Weiß `#FAFAF7`, Hellblau `#A8C3D7`, Grau `#8C8C88`, Beige `#D6C7A9`, Braun `#5B4636`, Rosé `#E3B7B8`, Senf `#C9A227`, Schwarz `#23211E`, Dunkelrot `#8E3B46`, Salbei `#9CAF88`, Denim `#3E5573`. Zusätzlich freier `<input type="color">`.

---

## 5. Outfit-Engine (Kernlogik, `js/engine.js`)

Reine Funktionen, kein DOM-Zugriff – damit testbar.

### 5.1 Outfit-Struktur

Ein Outfit besteht aus Slots:
- Variante A: `top + bottom + shoes` (+ optional `outer`, + 0–2 `accessory`)
- Variante B: `dress + shoes` (+ optional `outer`, + 0–2 `accessory`)

`outer` wird ab `warmth`-Bedarf oder zufällig mit 50 % Wahrscheinlichkeit ergänzt, wenn vorhanden.

### 5.2 Generierung (Beam statt Brute-Force)

1. Kandidaten pro Slot nach Kategorie filtern.
2. Bis zu 200 zufällige Kombinationen ziehen (oder alle, wenn weniger existieren).
3. Jede Kombination scoren (§5.3), Top-Ergebnis zurückgeben.
4. **Tages-Determinismus:** PRNG mit Seed aus dem Datum (`YYYY-MM-DD` → Hash, Mulberry32), damit "Outfit des Tages" beim Neuladen stabil bleibt. Der "Neu würfeln"-Button erhöht einen Salt (`seed + rerollCount`) und rendert neu.
5. Kein Vorschlag möglich (Garderobe zu klein) → Empty-State mit Hinweis, was fehlt (z. B. "Füge mindestens ein Unterteil hinzu").

### 5.3 Scoring (0–100, Summe gewichteter Teilscores)

**a) Farbharmonie (40 %).** Farben nach HSL konvertieren. Punkte für:
- Neutrale Basis (Creme/Weiß/Beige/Grau/Navy/Schwarz gelten als neutral: Sättigung < 0.25 oder Navy/Braun-Bereich): je neutrales Teil +Punkte, max. Bonus wenn höchstens **eine** gesättigte Akzentfarbe im Outfit ist.
- Harmonie-Beziehung der nicht-neutralen Farben zueinander: analog (Hue-Abstand < 40°), komplementär (160–200°), monochrom (Abstand < 15°, Helligkeit unterschiedlich) → Bonus; dissonant (40–150° und beide gesättigt) → Malus.
- Helligkeitskontrast zwischen `top` und `bottom` ≥ 0.15 → kleiner Bonus (kein "Ton-in-Ton-Brei").

**b) Musterdisziplin (20 %).** Old-Money-Regel: **maximal ein auffälliges Muster** pro Outfit. `solid` und `cable` gelten als ruhig. Zwei+ laute Muster (tartan, argyle, houndstooth, stripes, polkadot) → starker Malus; ein Muster + Rest uni → Bonus.

**c) Formalitäts-Kohärenz (20 %).** `max(formality) - min(formality) <= 1` → voller Score; Spanne 2 → deutlicher Malus (Anzughose zu Tennisshorts verhindern).

**d) Preppy-Score (20 %).** Mittelwert der `preppyScore`s der Teile (§5.4), normiert auf 0–100.

### 5.4 preppyScore-Berechnung (beim Speichern eines Teils)

Basiswert 5, dann:
- Subtyp in Preppy-Liste (Polohemd, Chino, Loafer, Blazer, Cardigan, Cable-Knit, Bootsschuhe, Tenniskleid, Oxford-Hemd, Tweed, Trenchcoat, Perlenkette, Seidentuch …): +3
- Farbe in Kernpalette (§4.2, Delta-E-nah): +1
- Muster ∈ {argyle, tartan, stripes, cable, houndstooth}: +1
- Subtyp in Anti-Liste (z. B. Jogginghose als Freitext, Cap): −2
- Clamp auf 0–10.

### 5.5 Begründungstext

Die Engine liefert zum Outfit 1–2 generierte Sätze ("Warum das funktioniert"): aus Templates je erkannter Harmonie-Regel, z. B. *"Navy und Camel sind ein klassisches Ivy-League-Duo – der Argyle-Pullover setzt den einzigen Akzent, genau richtig."* Das macht die App charmant und erklärbar.

---

## 6. UI / Seitenstruktur (Single Page, Tab-Navigation)

**Mobile first.** Die App wird überwiegend am Handy benutzt, deshalb gilt:

- Navigation als **fixierte Bottom-Bar** in Daumenreichweite (ab 641 px als schwebende Pille mittig unten).
- Dialoge sind auf dem Handy **Bottom-Sheets** (von unten einfahrend, Griff-Indikator, Vollbreite,
  Aktionsbuttons als volle Zeile); ab Tablet klassisch zentriert.
- Alle Tippziele ≥ 44 px, Formularfelder mit `font-size: 16px` (verhindert iOS-Auto-Zoom).
- `viewport-fit=cover` plus `env(safe-area-inset-*)` für Geräte mit Notch/Home-Indikator.
- Filter-Chips horizontal scrollbar statt umbrechend; Garderobe-Grid ab 360 px zweispaltig.
- Karten-Aktionen (Bearbeiten/Löschen) auf Touchgeräten dauerhaft sichtbar, nicht hinter Hover versteckt.
- Kein Auto-Fokus auf Textfelder beim Öffnen des Sheets, damit die Tastatur nicht sofort aufspringt.

### 6.1 Header
Wappen-Logo (SVG-Monogramm), Titel "OOTD", Untertitel "Dein täglicher Stilbegleiter". Tabs: **Heute** · **Garderobe**.

### 6.2 Tab "Heute"
- Datum ausgeschrieben ("Freitag, 1. August").
- Outfit-Karte: SVG-Silhouetten der Teile nebeneinander/gestapelt, darunter je Teil ein Chip mit Name + Farbpunkt + Musterbadge.
- Score-Anzeige als 1–5 goldene Sterne ("Stil-Rating") + Begründungstext (§5.5).
- Buttons: **"Neu würfeln 🎲"** (Reroll mit Animation), **"Gefällt mir ♥"** (schreibt `liked` in `history`).
- Kompakte History-Leiste der letzten 7 Tage (Mini-Farbpunkte der Outfits).

### 6.3 Tab "Garderobe"
- Grid aus Teil-Karten: SVG-Silhouette (eingefärbt + Pattern-Overlay), Name, Kategorie-Badge, Formalitäts-Punkte, Edit/Delete-Icons (Delete mit Bestätigung).
- Filter-Chips nach Kategorie, Zähler ("12 Teile").
- **"+ Teil hinzufügen"** öffnet `<dialog>`-Modal:
  - Name (Text, Pflicht), Kategorie (Chips), Subtyp (Datalist gefüllt je Kategorie),
  - Farbe (Preset-Chips + Color-Input), Muster (visuelle Chips mit Mini-SVG-Vorschau), Musterfarbe (nur wenn Muster ≠ solid),
  - Formalität (3-stufiger Segmented Control: Leger/Smart/Formell), Wärme (Slider 1–3),
  - **Live-Vorschau** der SVG-Silhouette rechts im Modal.
- **Starter-Garderobe:** Beim allerersten Start Button "Beispiel-Garderobe laden" (≈ 14 kuratierte Preppy-Teile), damit die App sofort erlebbar ist. Alternativ leer starten.

### 6.4 SVG-Silhouetten & Muster
- Je Kategorie/Subtyp-Gruppe eine einfache Silhouette als Inline-SVG-Template in `js/svg.js` (Hemd, Pullover, Hose, Rock, Kleid, Schuh, Jacke/Blazer, Accessoire-Icon). Einfache, freundliche Formen – keine Fotorealistik.
- Muster als `<pattern>`-Defs, parametrisiert mit `color`/`patternColor`: stripes (diagonale Linien), argyle (Rauten), houndstooth (vereinfachtes Zackenmuster), tartan (Kreuzlinien), polkadot (Kreise), cable (vertikale Wellenlinien).

---

## 7. Dateistruktur & Modulverantwortung

```
index.html          – Markup-Gerüst, Tabs, Dialoge, Formularfelder
css/style.css       – komplettes Design-System (§3)
js/app.js           – Bootstrap, Tab-Routing
js/color.js         – Farbkonvertierung (hex↔RGB↔HSL), Helligkeit, Aufhellen/Abdunkeln
js/catalog.js       – Taxonomie: Kategorien, Subtypen, Farb-/Musterpaletten, Preppy-Score (§5.4)
js/store.js         – load/save/migrate localStorage, CRUD für garments/history
js/engine.js        – Scoring, Generator, Seed-PRNG, Begründungen (pure functions)
js/svg.js           – Silhouetten- und Pattern-Erzeugung (gibt SVG-Strings zurück)
js/ui.js            – Rendering von Heute-Tab, Garderobe-Grid, Formular-Logik, Toasts
js/seed-data.js     – Starter-Garderobe
tests.html          – Mini-Testrunner (siehe §8)
```

Keine zyklischen Imports: `app → ui → (store, catalog, svg, seed-data)`;
`store → catalog → color`; `svg → color`; `engine → (color, catalog)`.
`color`, `catalog`, `engine` und `svg` fassen kein DOM an.

> Abweichung gegenüber der ersten Fassung: Farb-Utilities und Taxonomie liegen in
> eigenen Modulen (`color.js`, `catalog.js`), weil `svg.js` und `store.js` sie schon
> in Phase 2 brauchen – also bevor `engine.js` existiert.

---

## 8. Qualitätssicherung

- `tests.html`: einfacher, dependency-freier Assert-Runner im Browser für `engine.js`:
  hex→HSL-Korrektheit, Neutral-Erkennung, Musterdisziplin-Malus, Formalitäts-Spanne, Determinismus (gleicher Seed ⇒ gleiches Outfit), Verhalten bei Mini-Garderobe (1 Top/1 Bottom/1 Schuh ⇒ genau dieses Outfit).
- Manuelle Checkliste vor letztem Commit: Teil anlegen/bearbeiten/löschen; Reload-Persistenz; Reroll ändert Outfit, Reload behält Tagesoutfit; Empty-States; 360-px-Viewport; Tastaturbedienung des Modals (ESC schließt, Fokus-Falle).

---

## 9. Umsetzungsphasen (je Phase ein Commit)

1. **Gerüst & Design-System:** `index.html` + `style.css` mit Header, Tabs, leeren Sektionen, kompletter Farb-/Typo-Definition, Hintergrundmuster. *Ergebnis: hübsche leere Hülle.*
2. **Store & Garderobe-CRUD:** `store.js`, Formular-Dialog, Garderobe-Grid mit SVG-Silhouetten und Mustern (`svg.js`), Starter-Daten. *Ergebnis: Garderobe voll pflegbar.*
3. **Engine:** `engine.js` mit Farb-Utils, Scoring, seeded Generator + `tests.html` grün. *Ergebnis: Logik steht, testbar.*
4. **Heute-Tab:** Outfit-Rendering, Sterne, Begründung, Reroll, Like, History-Leiste. *Ergebnis: Kernerlebnis komplett.*
5. **Polish:** Animationen, Empty-States, Responsive-Feinschliff, A11y-Pass, README mit Screenshot-Beschreibung und Anleitung ("index.html im Browser öffnen").

---

## 10. Optionale Ausbaustufen (nur nach explizitem Nutzerwunsch)

- Wetter-Integration (Open-Meteo, ohne Key) → `warmth`-Bedarf steuern.
- Anlass-Wahl ("Uni", "Dinner", "Regatta") → Ziel-Formalität.
- Export/Import der Garderobe als JSON-Datei.
- "Gefällt mir"-Lernen: gelikte Farbkombinationen im Scoring leicht boosten.
- PWA-Manifest für Homescreen-Installation.
