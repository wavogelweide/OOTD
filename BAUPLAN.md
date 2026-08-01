# OOTD – Bauplan für die Outfit-Vorschlags-App

> **Zweck dieses Dokuments:** Vollständige Implementierungs-Spezifikation für ein Coding-Modell (Opus/Sonnet).
> Das Modell soll auf Basis dieses Plans die App ohne weitere Rückfragen bauen können.

---

## 1. Produktvision

**OOTD ("Outfit Of The Day")** ist eine clientseitige HTML-Web-App, die täglich Outfit-Vorschläge
aus der eigenen digitalen Garderobe generiert.

- Nutzer:innen legen ihre **eigenen Kleidungsstücke** an – mit Kategorie, Farbe, Muster und weiteren Attributen.
- Die App kombiniert daraus **Outfits, die farblich und stilistisch harmonieren**.
- Stilrichtung der Vorschläge: **Preppy / Old Money** (Ivy League, Quiet Luxury).
- Design der App selbst: **modern und verspielt** (nicht steif – die App darf Spaß machen, auch wenn die Outfits klassisch sind).

**Kein Backend.** Alles läuft im Browser, Persistenz über `localStorage`.

---

## 2. Tech-Stack & Projektstruktur

- **Vanilla HTML + CSS + JavaScript (ES Modules)** – keine Frameworks, kein Build-Schritt.
- Läuft direkt per Doppelklick auf `index.html` bzw. über einen statischen Server.
- Keine externen Netzwerk-Abhängigkeiten (Fonts via `@font-face`-Fallback auf Systemfonts oder rein Systemfont-Stack).

```
/
├── index.html          # Einstiegspunkt, App-Shell, alle Views
├── css/
│   └── style.css       # Design-System + alle Komponenten-Styles
├── js/
│   ├── app.js          # Bootstrap, Routing zwischen Views, Event-Wiring
│   ├── store.js        # localStorage-Wrapper, CRUD für Garderobe, Migrationen
│   ├── color.js        # Farblogik (HSL-Utilities, Harmonie-Scoring)
│   ├── outfit.js       # Outfit-Engine (Regeln, Scoring, Tages-Seed)
│   ├── style-rules.js  # Preppy/Old-Money-Regelwerk als Daten (Konstanten)
│   └── ui.js           # Rendering-Helfer (Karten, SVG-Kleidungs-Icons, Chips)
└── BAUPLAN.md          # dieses Dokument
```

---

## 3. Datenmodell

### 3.1 Kleidungsstück (`Garment`)

```js
{
  id: "uuid",                 // crypto.randomUUID()
  name: "Marineblauer Blazer",// frei wählbar, optional (Default aus Attributen generieren)
  category: "blazer",         // s. Kategorienliste
  color: {                    // Hauptfarbe
    hex: "#1F3A5F",
    name: "Navy"              // aus Farbpalette gewählt oder Custom-Picker
  },
  secondaryColor: null,       // optional, z. B. bei Streifen (gleiches Format wie color)
  pattern: "uni",             // s. Musterliste
  formality: 3,               // 1 = sehr leger … 5 = sehr formell
  warmth: 2,                  // 1 = luftig … 3 = warm (für Saison-Filter)
  favorite: false,
  createdAt: 1730000000000
}
```

### 3.2 Kategorien

Jede Kategorie gehört zu einem **Slot**. Ein Outfit belegt Slots, nicht Kategorien.

| Slot        | Kategorien                                                        | Pflicht im Outfit |
|-------------|-------------------------------------------------------------------|-------------------|
| `top`       | `hemd`, `poloshirt`, `bluse`, `tshirt`, `rollkragen`              | ja                |
| `layer`     | `pullover`, `cardigan`, `pullunder`, `blazer`, `trenchcoat`, `mantel` | optional (bei warmth-Bedarf Pflicht) |
| `bottom`    | `chino`, `stoffhose`, `jeans`, `rock`, `shorts`                   | ja (außer `kleid`) |
| `fullbody`  | `kleid`                                                           | ersetzt top+bottom |
| `shoes`     | `loafer`, `sneaker`, `boots`, `ballerinas`, `bootsschuhe`         | ja                |
| `accessory` | `guertel`, `schal`, `tuch`, `muetze`, `tasche`, `uhr`             | optional, max. 2  |

### 3.3 Muster

`uni`, `streifen`, `karo`, `tartan`, `hahnentritt`, `fischgraet`, `punkte`, `paisley`, `zopfmuster`, `blumen`

### 3.4 Persistenz (`store.js`)

- Key: `ootd.wardrobe.v1` → `{ version: 1, garments: Garment[] }`
- Key: `ootd.state.v1` → `{ lastSuggestionDate, pinnedOutfitIds, rerollCount, seenOnboarding }`
- Export/Import der Garderobe als JSON-Datei (Download/Upload-Button in den Einstellungen).
- Beim Laden: try/catch mit Fallback auf leere Garderobe; `version`-Feld für spätere Migrationen.

---

## 4. Farb- und Stil-Logik (Herzstück)

### 4.1 Kuratierte Old-Money-Farbpalette

Der Farbwähler bietet primär diese benannten Farben an (Custom-Hex zusätzlich möglich):

**Neutrale Basis:** Navy `#1F3A5F`, Creme `#F5F0E1`, Weiß `#FAFAF7`, Beige/Camel `#C8A97E`,
Grau `#8C8C88`, Anthrazit `#3A3A38`, Schokobraun `#5B4636`, Khaki `#8A7F5C`

**Akzente:** Burgunder `#722F37`, Waldgrün `#2C4A3B`, Hellblau `#A8C3D7`, Rosé `#E8C4C4`,
Senf `#C9A227`, Salbei `#9CAF88`, Kirschrot `#9B1B30`

### 4.2 Farbharmonie-Scoring (`color.js`)

Funktion `colorHarmony(hexA, hexB) → 0..1`, basierend auf HSL:

1. **Neutral-Regel:** Ist eine der Farben neutral (Sättigung < 0.15 oder Helligkeit > 0.9 / < 0.15, plus Beige-/Brauntöne per Hue-Range 20–50° mit S < 0.45) → Score `0.9`. Neutrale passen fast immer.
2. **Ton-in-Ton:** Hue-Differenz < 30° und Helligkeitsdifferenz > 0.15 → `0.85`.
3. **Analog:** Hue-Differenz 30–60° → `0.7`.
4. **Komplementär (gedeckt):** Hue-Differenz 150–210° und beide Sättigungen < 0.6 → `0.75`. Bei hoher Sättigung beider → `0.4` (zu laut für Old Money).
5. **Sonst:** `0.35`.
6. **Malus:** zwei stark gesättigte Farben (beide S > 0.65) → Score × 0.5.

Outfit-Farbscore = Mittelwert aller Paar-Scores der sichtbaren Teile; Accessoires halbgewichtet.

### 4.3 Preppy/Old-Money-Regelwerk (`style-rules.js`)

Als deklarative Konstanten, damit die Engine sie generisch anwenden kann:

**Harte Regeln (K.-o.-Kriterien):**
- Maximal **ein auffälliges Muster** pro Outfit (`tartan`, `paisley`, `blumen`, `hahnentritt` zählen als auffällig). Zweites dezentes Muster (`streifen`, `punkte`, `zopfmuster`, `fischgraet`) erlaubt, wenn Farbwelt geteilt.
- Formalitäts-Spanne im Outfit ≤ 2 (kein Blazer zu Shorts + Sneaker mit Formality 1).
- Maximal **3 Nicht-Neutral-Farben** im Gesamtoutfit.
- `shorts` nie mit `mantel`/`trenchcoat`.

**Bonus-Punkte (Preppy-Score):**
- Klassiker-Kombis (je +0.15): Hemd+Pullover/Pullunder (Layering), Blazer+Chino, Poloshirt+Chino, Rollkragen+Blazer, Kleid+Cardigan, Loafer/Bootsschuhe im Outfit.
- Navy/Creme/Burgunder/Waldgrün als dominante Farbwelt: +0.1.
- Genau ein Akzentmuster (Karo/Streifen): +0.1.
- Gürtel passend zur Schuhfarbe (Harmonie > 0.8): +0.05.

**Kategorie-Gewichtung:** `loafer`, `bootsschuhe`, `pullunder`, `cardigan`, `blazer`, `hemd`, `poloshirt`, `chino` gelten als "preppy-Kern" und werden bei der Auswahl leicht bevorzugt (+0.05 pro Kernteil, max +0.15).

### 4.4 Outfit-Engine (`outfit.js`)

```
generateDailyOutfits(garments, date, count = 3) → Outfit[]
```

1. **Seed:** `hash(dateString)` → seeded PRNG (Mulberry32). Gleicher Tag = gleiche Vorschläge (bis "Neu würfeln" den `rerollCount` in den Seed mischt).
2. **Kandidaten bauen:** Zufällige, aber seeded Kombination pro Slot (top/fullbody + bottom + shoes + optional layer + 0–2 Accessoires). Bei kleinen Garderoben: alle Kombinationen enumerieren, wenn < 500 möglich.
3. **Filtern:** Harte Regeln anwenden.
4. **Scoring:** `0.55 × Farbscore + 0.35 × Preppy-Score + 0.10 × Abwechslungs-Bonus` (Teile, die gestern im Top-Vorschlag waren, geben leichten Malus – gestrige IDs aus `ootd.state.v1`).
5. **Diversität:** Die 3 ausgegebenen Outfits müssen sich in mindestens 2 Teilen unterscheiden.
6. **Fallbacks:** < 1 Teil pro Pflicht-Slot → Empty-State mit Hinweis, was fehlt ("Füge mindestens ein Oberteil, eine Hose und Schuhe hinzu"). Keine Kombination besteht die harten Regeln → beste Kombination trotzdem zeigen, mit Hinweis-Badge „Kompromiss".
7. Jedes Outfit bekommt einen **generierten Namen** aus Bausteinen, z. B. „Riviera-Klassiker", „Bibliotheks-Chic", „Regatta-Tag" (Namensliste × dominante Farbe/Anlass, seeded gewählt).

---

## 5. UI/UX-Spezifikation

### 5.1 Design-System („modern verspielt")

- **Grundstimmung:** Warm, freundlich, leicht editorial. Creme-Hintergrund `#FAF6EE`, Karten in Weiß mit **großzügigem Border-Radius (20–24px)** und weicher Schlagschatten.
- **Akzentfarben der App-UI:** Navy `#1F3A5F` (primär), Butter-Gelb `#F7D154` und Rosé `#E8C4C4` als verspielte Akzente (Blobs, Sticker, Hover).
- **Typografie:** Überschriften in Serif (z. B. `Georgia, 'Times New Roman', serif` – passt zu Old Money), UI-Text in `system-ui`. Große, mutige Headlines.
- **Verspielte Elemente:**
  - Organische SVG-Blobs / Wellen als Hintergrund-Deko.
  - Sanfte Micro-Animationen: Karten „ploppen" beim Erscheinen (`transform: scale` + `opacity`, CSS `@keyframes`), Buttons mit `:active`-Squish.
  - Emoji-/Icon-Sticker sparsam eingesetzt (z. B. 🧥 ✨ 🎩).
  - „Neu würfeln"-Button mit Würfel-Wackel-Animation.
- **Responsive:** Mobile-first, max. Inhaltsbreite 720px zentriert, Bottom-Tab-Bar auf Mobile / Top-Nav auf Desktop.
- `prefers-reduced-motion` respektieren.

### 5.2 Kleidungs-Visualisierung

Keine Fotos: Jedes Teil wird als **stilisierte SVG-Silhouette** seiner Kategorie gerendert (inline-SVG-Templates in `ui.js`), eingefärbt mit `color.hex`; Muster als SVG-`<pattern>` (Streifen, Karo, Punkte, Fischgrät etc. – jedes Muster aus 3.3 braucht ein Pattern-Template). Sekundärfarbe fließt ins Muster ein.

### 5.3 Views (SPA mit 3 Tabs)

**Tab 1 – „Heute" (Startscreen):**
- Datum + freundliche Begrüßung („Guten Morgen! Dein Look für Freitag ✨").
- 3 Outfit-Karten: Outfit-Name, SVG-Teile nebeneinander/gestapelt angeordnet, Farbpunkte-Reihe, Score als „Match"-Badge (z. B. „92 % Match").
- Aktionen pro Karte: 📌 „Heute tragen" (pinnt die Karte nach oben, dimmt die anderen), Detail-Aufklappen (zeigt alle Teile als Liste).
- Globaler Button „🎲 Neu würfeln".
- Empty-State (s. 4.4.6) mit CTA zum Garderoben-Tab.

**Tab 2 – „Garderobe":**
- Grid aus Teil-Karten (SVG, Name, Farb-Chip, Muster-Label).
- Filter-Chips nach Slot + Suche.
- Pro Karte: Bearbeiten, Löschen (mit Bestätigung), Favorit-Herz.
- Floating-Action-Button „+ Neues Teil".

**Tab 3 – „Neues Teil / Bearbeiten" (Modal oder eigene View):**
- Schritt-für-Schritt-Formular: Kategorie (Icon-Grid) → Farbe (Palette aus 4.1 als Swatches + Custom-`<input type="color">`) → Muster (visuelle Muster-Swatches) → Formalität (5er-Slider mit Labels „Strand … Gala") → Wärme (3 Chips) → optional Name & Zweitfarbe.
- Live-Vorschau der SVG-Silhouette, die sich mit jeder Auswahl aktualisiert.
- Validierung: Kategorie + Farbe Pflicht.

**Einstellungen (kleines Zahnrad im Header):** Export/Import JSON, „Alles löschen" (doppelte Bestätigung), Info-Text.

### 5.4 Onboarding

Beim ersten Start (leere Garderobe, `seenOnboarding=false`): Angebot, eine **Starter-Garderobe (ca. 12 preppy Beispielteile)** zu laden, damit die App sofort erlebbar ist – oder leer zu starten. Beispielteile klar als solche benannt.

---

## 6. Implementierungs-Reihenfolge (Milestones)

1. **M1 – Gerüst:** `index.html` mit Tab-Shell, Design-System-CSS (Tokens als Custom Properties), leere Views, `store.js` mit CRUD + Tests per Konsole.
2. **M2 – Garderobe:** Formular-View mit SVG-Vorschau, Muster-Patterns, Garderoben-Grid mit Filter/Bearbeiten/Löschen.
3. **M3 – Engine:** `color.js` + `style-rules.js` + `outfit.js` inkl. Seed-Logik; „Heute"-Tab mit 3 Karten, Reroll, Pinnen.
4. **M4 – Feinschliff:** Onboarding + Starterdaten, Export/Import, Animationen, Empty-States, Responsive-Politur, `prefers-reduced-motion`.

## 7. Akzeptanzkriterien

- [ ] App läuft offline durch Öffnen von `index.html`, ohne Konsolen-Fehler.
- [ ] Teil anlegen, bearbeiten, löschen funktioniert; Daten überleben Reload.
- [ ] Gleicher Tag liefert ohne Reroll identische Vorschläge; Reroll ändert sie.
- [ ] Kein Vorschlag verletzt die harten Regeln aus 4.3 (außer als gekennzeichneter „Kompromiss").
- [ ] Outfits mit Navy/Creme/Burgunder-Welt und Klassiker-Kombis scoren sichtbar höher als grelle Zufallskombis (manuell mit Starter-Garderobe prüfbar).
- [ ] Mobile (375px) und Desktop (1280px) sehen aufgeräumt aus.
- [ ] Export → Import stellt die Garderobe identisch wieder her.
