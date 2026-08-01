# OOTD – Bauplan: Tägliche Outfit-Vorschläge im Preppy/Old-Money-Stil

Dieser Bauplan richtet sich an ein implementierendes Modell (Opus/Sonnet). Er beschreibt Ziel, Architektur, Datenmodell, Matching-Logik, UI-Design und die Umsetzung in Meilensteinen. Alle Entscheidungen sind so getroffen, dass die App **ohne Build-Tools und ohne Backend** als reine HTML-Web-App läuft.

---

## 1. Ziel & Kernidee

Eine Single-Page-Web-App („OOTD" – Outfit Of The Day), mit der Nutzer:

1. **Ihre Garderobe digital anlegen**: Kleidungsstücke mit Kategorie, Farbe(n), Muster, Material/Saison erfassen.
2. **Täglich Outfit-Vorschläge erhalten**: Die App kombiniert vorhandene Stücke zu vollständigen Outfits, die **farblich harmonieren** und dem **Preppy/Old-Money-Stil** entsprechen.
3. **Outfits bewerten & festhalten**: Vorschlag annehmen, neu würfeln, favorisieren.

Das Design der App selbst ist **modern und verspielt** (lebendige Akzente, weiche Formen, Mikro-Animationen), während die *vorgeschlagenen Outfits* der klassisch-eleganten Preppy-Ästhetik folgen.

---

## 2. Technischer Rahmen

| Aspekt | Entscheidung | Begründung |
|---|---|---|
| Stack | Vanilla HTML + CSS + JavaScript (ES-Module) | Keine Build-Pipeline, überall lauffähig, einfach per `index.html` zu öffnen |
| Persistenz | `localStorage` (JSON, versioniertes Schema) | Kein Backend nötig; Export/Import als JSON-Datei als Backup |
| Struktur | `index.html`, `css/styles.css`, `js/` mit Modulen | Übersichtlich, testbar |
| Kompatibilität | Aktuelle Browser (Chrome, Firefox, Safari), responsive (Mobile-first) | App wird häufig morgens am Handy genutzt |
| Keine Abhängigkeiten | Keine Frameworks, keine CDNs | Offline-fähig, CSP-freundlich |

### Dateistruktur

```
/
├── index.html          # Einstiegspunkt, alle Views als Sektionen
├── css/
│   └── styles.css      # Design-System + Komponenten
└── js/
    ├── app.js          # Bootstrap, Routing zwischen Views, Event-Wiring
    ├── store.js        # localStorage-Wrapper, Schema-Migration, Export/Import
    ├── wardrobe.js     # CRUD für Kleidungsstücke, Rendering der Garderobe
    ├── colors.js       # Farbdefinitionen, Harmonie-Logik
    ├── outfit.js       # Outfit-Generator (Regeln + Scoring)
    └── ui.js           # Wiederverwendbare UI-Helfer (Modal, Toast, Chips, SVG-Icons)
```

---

## 3. Datenmodell

### 3.1 Kleidungsstück (`GarmentItem`)

```js
{
  id: "uuid",                 // crypto.randomUUID()
  name: "Marineblauer Blazer",// frei wählbar
  category: "blazer",         // siehe Kategorien unten
  colors: ["navy"],           // 1–2 Farben aus fester Palette (Hauptfarbe zuerst)
  pattern: "solid",           // siehe Muster unten
  material: "wool",           // optional: wool | cotton | linen | cashmere | denim | leather | silk | synthetic
  seasons: ["autumn","winter"], // Teilmenge von spring/summer/autumn/winter
  formality: 3,               // 1 (leger) – 5 (formell), mit Default je Kategorie
  favorite: false,
  createdAt: 1690000000000
}
```

**Kategorien** (mit Layer-Zuordnung für den Generator):

| Slot | Kategorien |
|---|---|
| `top` | shirt (Hemd/Bluse), polo, tshirt, blouse, turtleneck (Rollkragen) |
| `layer` | sweater (Pullover), cardigan, vest (Pullunder), blazer, coat (Mantel/Trench) |
| `bottom` | chinos, trousers (Stoffhose), jeans, skirt (Rock), shorts |
| `dress` | dress (Kleid – ersetzt top+bottom) |
| `shoes` | loafers, oxfords, boots, sneakers, ballet (Ballerinas), boat (Bootsschuhe) |
| `accessory` | belt, scarf, watch, bag, headband, socks, tie |

**Muster** (feste Auswahl, für Muster-Mix-Regeln):
`solid` (uni), `stripes` (Streifen), `check` (Karo/Tartan), `houndstooth` (Hahnentritt), `herringbone` (Fischgrät), `cable` (Zopfmuster), `argyle`, `floral`, `dots` (Punkte), `paisley`

**Farbpalette** (kuratiert, Old-Money-tauglich; jede Farbe mit Hex für die UI und `family` für die Harmonie-Logik):

- **Neutrale:** white, cream, beige, camel, taupe, grey, charcoal, black, navy, brown
- **Gedeckte Akzente:** burgundy, forest (Tannengrün), olive, mustard, rust (Rostrot), denim-blue
- **Preppy-Pastelle:** light-blue, blush (Rosé), sage (Salbei), lavender, butter (Hellgelb), mint

> Freie Hex-Eingabe bewusst **nicht** anbieten – die kuratierte Palette hält die Matching-Logik zuverlässig und die Vorschläge stilecht.

### 3.2 Gespeicherter Zustand (`localStorage`-Key `ootd:v1`)

```js
{
  schemaVersion: 1,
  items: [GarmentItem],
  outfitHistory: [            // die letzten ~30 Vorschläge
    { date: "2026-08-01", itemIds: [...], score: 87, liked: true }
  ],
  settings: { name: "", styleGender: "all" } // "all" | "masc" | "fem" – filtert nur Kategorien-UI, nie Daten
}
```

Der Tagesvorschlag wird **deterministisch pro Datum** erzeugt (Seed = Datum), damit „heutiges Outfit" beim Neuladen stabil bleibt; „Neu würfeln" erhöht einen Re-Roll-Zähler im Seed.

---

## 4. Outfit-Generator (Herzstück)

### 4.1 Aufbau eines Outfits

1. **Basis wählen:** entweder `dress` **oder** `top` + `bottom`.
2. **Layer ergänzen** (saisonabhängig: im Herbst/Winter Pflicht, im Sommer optional): sweater/cardigan/blazer/vest; Mantel zusätzlich bei Winter.
3. **Schuhe** passend zur Formalität.
4. **1–2 Accessoires** (Gürtel bevorzugt bei Hosen, Schal bei kalten Saisons, Uhr/Tasche frei).

Saison wird aus dem aktuellen Monat abgeleitet (Meteorologisch: Mär–Mai Frühling usw.), vom Nutzer überschreibbar (Saison-Toggle auf dem Vorschlags-Screen).

### 4.2 Kandidaten-Erzeugung & Scoring

Generator erzeugt bis zu ~200 zufällige gültige Kombinationen (Saison- und Slot-Regeln als harte Filter) und bewertet jede mit einer Punktzahl 0–100. Der beste Kandidat gewinnt; bei „Neu würfeln" wird der nächstbeste noch nicht gezeigte genommen.

**Score-Komponenten:**

| Komponente | Gewicht | Regel |
|---|---|---|
| Farbharmonie | 40 % | siehe 4.3 |
| Muster-Balance | 20 % | max. 1 auffälliges Muster (check/floral/paisley/argyle) pro Outfit; 2 dezente Muster (stripes/herringbone/dots) nur bei unterschiedlichen Slots und gemeinsamer Farbe; sonst Abzug |
| Formalitäts-Kohärenz | 20 % | max. Spannweite 1–2 Stufen zwischen allen Teilen; Sneakers + Blazer z. B. erlaubt (Spannweite 2, kleiner Abzug), Shorts + Oxfords nicht |
| Preppy-Bonus | 15 % | Bonuspunkte für Stil-Signaturen, siehe 4.4 |
| Abwechslung | 5 % | Abzug, wenn ≥ 2 Teile im Vorschlag der letzten 3 Tage vorkamen |

### 4.3 Farbharmonie-Regeln (in `colors.js` als Daten, nicht als Code-Wildwuchs)

Jede Palettenfarbe erhält: `family` (neutral | accent | pastel), `temperature` (warm | cool | neutral) und eine explizite **Kompatibilitätsliste** (kuratiert, ca. 5–10 Partner pro Farbe). Beispiele:

- `navy` ↔ white, cream, camel, burgundy, light-blue, mustard, grey, blush
- `beige/camel` ↔ navy, white, cream, forest, burgundy, brown, light-blue
- `burgundy` ↔ navy, cream, grey, camel, forest (nicht: rust, mustard)

**Bewertung eines Outfits:**
- Neutrale passen immer zu Neutralen (voller Score untereinander).
- Max. **2 Nicht-Neutrale** pro Outfit; jedes weitere kostet stark.
- Jedes Farbpaar im Outfit wird gegen die Kompatibilitätsliste geprüft: Treffer = volle Punkte, gleiche Familie/Temperatur = halbe Punkte, sonst 0.
- **Ton-in-Ton-Bonus** (z. B. navy + light-blue + denim-blue) und **klassischer Kontrast-Bonus** (navy+white, black+cream).
- Schwarz+Braun sowie Schwarz+Navy geben Abzug (klassische Stilregel).
- Gürtel/Schuhe: Bonus, wenn Ledertöne zusammenpassen (brown-Familie vs. black).

### 4.4 Preppy/Old-Money-Stilregeln (Bonus-Katalog)

Bonuspunkte für erkannte Signatur-Kombinationen, z. B.:

- Polo/Hemd + Pullover/Pullunder darüber (Layering-Klassiker)
- Blazer + Chino/Stoffhose + Loafer
- Rollkragen + Blazer/Mantel
- Kabelstrick (`cable`) oder Argyle im Outfit
- Karo/Tartan-Rock + uni Oberteil
- Farbwelten: navy/white/camel, cream/forest, grau+pastell
- Materialien wool/cashmere/linen/cotton (Malus für viel `synthetic`)
- Bootsschuhe/Ballerinas im Sommer, Trenchcoat in Übergangszeit

Malus-Katalog: Sneakers bei Formalität ≥ 4, T-Shirt ohne Layer bei Formalität ≥ 3, mehr als 2 Denim-Teile.

### 4.5 Fallbacks & Erklärbarkeit

- **Zu kleine Garderobe:** Wenn kein vollständiges Outfit möglich ist, zeigt die App, *welcher Slot fehlt* („Füge eine Hose oder ein Kleid hinzu"), statt leer zu bleiben.
- **Begründung anzeigen:** Zu jedem Vorschlag 1–2 generierte Sätze („Navy & Camel – ein Old-Money-Klassiker. Der Zopfstrick über dem Hemd sorgt für das Preppy-Layering."). Dazu aus Score-Komponenten Textbausteine ableiten.

---

## 5. UI/UX-Design

### 5.1 Design-System („modern verspielt")

- **App-Farben** (nicht mit der Kleidungs-Palette verwechseln): warmer Creme-Hintergrund (`#FAF6EF`), Tinte (`#1F2A44`), verspielte Akzente: Korall (`#F2764A`), Salbei (`#9CB89C`), Butter (`#F5D77A`). Dark Mode optional (nice-to-have, nicht MVP).
- **Typografie:** Serif-Display für Überschriften (z. B. Georgia/`serif`-Stack – old-money-Anklang), humanistische Sans für UI-Text (`system-ui`). Keine Webfonts laden (offline-fähig).
- **Formen:** großzügige Radien (16–24 px), Karten mit weichen Schatten, Chips/Pills für Farben & Muster.
- **Verspieltheit:** Mikro-Animationen (Karten-Hover, „Würfel"-Button mit Shake, Konfetti-artige Partikel bei „Gefällt mir" – rein CSS/JS, dezent), Emoji-/SVG-Icons pro Kategorie.
- **Kleidungs-Visualisierung:** Jedes Stück wird als **generierte SVG-Kachel** dargestellt: Kategorie-Silhouette (einfache Inline-SVG-Pfade pro Kategorie), eingefärbt mit den Farb-Hexwerten, Muster als SVG-`<pattern>` (Streifen, Karo, Punkte …). Kein Foto-Upload im MVP (hält Storage klein) – Architektur aber so, dass ein Bildfeld später ergänzbar ist.

### 5.2 Views (Tab-Navigation unten: „Heute", „Garderobe", „Verlauf")

**A) Heute (Startscreen)**
- Begrüßung mit Datum + Saison-Badge (überschreibbar).
- Outfit-Karte: SVG-Kacheln der Teile in Anzieh-Reihenfolge (Layer oben), Farbpunkte, Begründungstext, Score als „Stil-Rating" (z. B. 5 Sterne / Prozent verspielt animiert).
- Aktionen: **🎲 Neu würfeln**, **🤍 Gefällt mir** (speichert in Verlauf als liked), **👔 Anziehen** (fixiert als heutiges Outfit).
- Leerer Zustand: charmantes Onboarding („Deine Garderobe ist noch leer – lass uns 5 Lieblingsteile anlegen") mit Direkteinstieg ins Formular und optional **„Beispiel-Garderobe laden"** (ca. 15 kuratierte Preppy-Teile als Seed-Daten – wichtig für den ersten Eindruck und zum Testen).

**B) Garderobe**
- Grid aus SVG-Kacheln, Filter-Chips (Kategorie, Farbe, Saison), Suchfeld.
- FAB „+ Teil hinzufügen" → Modal-Formular:
  - Kategorie (Icon-Grid), Name (mit automatischem Vorschlag aus Farbe+Kategorie), Farben (Palette als Swatches, max. 2), Muster (visuelle Swatches), Material, Saisons (Multi-Chips), Formalität (Slider mit Labels „Wochenende … Anlass").
  - Live-Vorschau der SVG-Kachel im Formular.
- Kachel-Tap → Detail/Bearbeiten/Löschen (Löschen mit Bestätigung).

**C) Verlauf**
- Liste vergangener Tages-Outfits mit Mini-Kacheln, Like-Markierung.
- Export/Import der Garderobe als JSON (Download/Upload) – unter einem kleinen Einstellungs-Zahnrad hier verortet.

### 5.3 Responsivität & A11y

- Mobile-first (eine Spalte), ab 768 px zweispaltig (Garderobe-Grid 3–4 Spalten).
- Alle interaktiven Elemente als `<button>`, Fokus-Stile, `aria-label` auf Icon-Buttons, Farbchips zusätzlich mit Textlabel (nie Farbe allein als Information).
- Deutsch als UI-Sprache; Strings zentral in einem `STRINGS`-Objekt (spätere i18n möglich).

---

## 6. Meilensteine (empfohlene Commit-Reihenfolge)

1. **M1 – Gerüst & Design-System:** `index.html` mit drei Views + Tab-Navigation, `styles.css` mit Tokens (Farben, Radien, Schatten, Typo), leere Modul-Dateien, Store mit Schema v1.
2. **M2 – Garderobe-CRUD:** Formular-Modal, Validierung, SVG-Kachel-Renderer inkl. Muster-Patterns, Grid mit Filtern, Löschen/Bearbeiten, Seed-Daten-Button.
3. **M3 – Farb- & Stillogik:** `colors.js` (Palette + Kompatibilitätsmatrix als Daten), `outfit.js` (Kandidaten, Scoring, Begründungstexte), Unit-testbare pure Functions.
4. **M4 – „Heute"-Screen:** Tagesvorschlag mit Seed, Re-Roll, Like, Anziehen, Saison-Toggle, Fehl-Slot-Hinweise.
5. **M5 – Verlauf & Politur:** History-View, Export/Import, Animationen/Mikrointeraktionen, Empty-States, Responsive-Feinschliff, manueller Testdurchlauf (Checkliste unten).

Jeder Meilenstein = ein lauffähiger Zustand + eigener Commit auf `claude/outfit-suggestion-app-atgvsl`.

## 7. Test-Checkliste (manuell, vor letztem Commit)

- [ ] Teil anlegen/bearbeiten/löschen; Reload → Daten bleiben erhalten.
- [ ] Mit nur 2 Teilen: sinnvoller Hinweis statt kaputtem Vorschlag.
- [ ] Seed-Garderobe laden → Vorschlag enthält top/bottom (oder Kleid) + Schuhe; Farben stehen in der Kompatibilitätsmatrix zueinander.
- [ ] Gleicher Tag + Reload → gleicher Vorschlag; „Neu würfeln" → anderes Outfit; nächster Kalendertag → neues Outfit.
- [ ] Saison-Toggle Winter → Layer/Mantel erscheint; Sommer → keine Wollmäntel.
- [ ] Kein Outfit mit 3+ kräftigen Farben, kein Schwarz+Braun, max. 1 auffälliges Muster.
- [ ] Export → Import in frischem Browser-Profil stellt Garderobe wieder her.
- [ ] Mobile (375 px) und Desktop (1280 px) ohne horizontales Scrollen; Bedienung komplett per Tastatur möglich.

## 8. Ausdrücklich außerhalb des MVP

Foto-Upload, Wetter-API, Nutzerkonten/Sync, Dark Mode, mehrere Stilrichtungen, KI-Backend. Die Architektur (Daten-getriebene Regeln, Slot-System, Store mit Schema-Version) hält diese Erweiterungen offen.
