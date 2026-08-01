# OOTD — Bauplan: Tägliche Outfit-Vorschläge (Preppy / Old Money)

> Dieser Bauplan ist die Implementierungs-Anleitung für ein Coding-Modell (Opus/Sonnet).
> Ziel: eine vollständige, offline-fähige HTML-Web-App ohne Backend, die aus der eigenen
> Garderobe täglich stilistisch und farblich passende Outfits im Preppy-/Old-Money-Stil vorschlägt.

---

## 1. Produktüberblick

**Name:** OOTD (Outfit Of The Day)

**Kernfunktionen:**
1. **Garderobe verwalten** — eigene Kleidungsstücke anlegen, bearbeiten, löschen (Kategorie, Farbe, Muster, Wärme/Saison, Formalität).
2. **Täglicher Outfit-Vorschlag** — deterministisch pro Tag (gleicher Tag = gleicher Vorschlag), mit „Neu würfeln"-Option.
3. **Outfit-Engine** — kombiniert Teile regelbasiert: Farbharmonie + Musterregeln + Preppy-/Old-Money-Stilregeln.
4. **Favoriten** — gelungene Outfits speichern.

**Nicht-Ziele (bewusst weggelassen):** kein Login, kein Server, keine Fotos/Uploads (Kleidungsstücke werden als stilisierte SVG-Illustrationen gerendert), keine Wetter-API (optional als spätere Erweiterung).

---

## 2. Technische Architektur

- **Eine einzige Datei `index.html`** mit eingebettetem CSS und JavaScript — keine Build-Tools, keine externen Abhängigkeiten, kein CDN (App muss offline per Doppelklick funktionieren).
- **Vanilla JS (ES2020+)**, kein Framework. Struktur über Module-Pattern / einfache Objekte:
  - `Store` — Persistenz (localStorage, Key `ootd.wardrobe.v1`, `ootd.favorites.v1`, `ootd.settings.v1`), JSON-Schema-Version im Payload für spätere Migrationen.
  - `Engine` — Outfit-Generierung (reine Funktionen, testbar, kein DOM-Zugriff).
  - `UI` — Rendering + Event-Handling.
- **Persistenz:** `localStorage`. Zusätzlich Export/Import der Garderobe als JSON-Datei (Download/Upload) für Backup.
- **Responsiv:** Mobile-first (die App wird morgens am Handy benutzt), funktioniert aber auch am Desktop.

---

## 3. Datenmodell

```js
// Kleidungsstück
{
  id: "uuid",
  name: "Marineblauer Kaschmirpullover",   // frei wählbar
  category: "sweater",     // siehe Kategorien unten
  color: "navy",           // Haupt-Farb-Token, siehe Farbpalette
  colorHex: "#1F3A5F",     // konkreter Farbwert für die Darstellung
  pattern: "solid",        // solid | stripes | check | houndstooth | herringbone | argyle | floral | dots | cable
  warmth: 2,               // 1 = leicht, 2 = mittel, 3 = warm
  formality: 3,            // 1 = leger … 5 = formell
  createdAt: 1234567890
}
```

**Kategorien & Slots** (ein Outfit belegt Slots):

| Slot | Kategorien | Pflicht |
|---|---|---|
| top | shirt (Hemd), polo, blouse, tshirt | ja |
| layer | sweater, cardigan, vest (Pullunder), blazer | optional, Engine bevorzugt ihn (preppy!) |
| bottom | chinos, trousers (Stoffhose), skirt, shorts, jeans | ja |
| shoes | loafers, boat-shoes, oxfords, sneakers, ballet-flats | ja |
| accessory | belt, scarf, watch, bag, socks, tie | optional, max. 2 |
| outer | coat, trenchcoat, quilted-jacket | optional (nur bei warmth-Bedarf) |

**Farbpalette (Preppy/Old Money — als Preset-Auswahl im Formular):**
Kern-Neutrale: `navy #1F3A5F`, `cream #F5F0E1`, `white #FFFFFF`, `camel #C19A6B`, `grey #8C8C8C`, `charcoal #3B3B3B`, `brown #6B4F3A`
Akzente: `burgundy #6E1F2E`, `forest #2E4A34`, `hunter-red #A63A3A`, `mustard #C9A227`, `dusty-pink #D8A7A7`, `light-blue #A8C3D7`, `sage #A3B18A`
Zusätzlich freier Color-Picker für eigene Farben; die Engine mappt Custom-Farben via HSL-Distanz auf das nächste Farb-Token.

---

## 4. Outfit-Engine (Herzstück)

Reine Funktion: `generateOutfit(wardrobe, seed, options) -> { items, score, warnings }`

### 4.1 Ablauf
1. **Seed:** `seed = hash(datumsstring "YYYY-MM-DD" + rerollCounter)` → seeded PRNG (Mulberry32). Gleicher Tag ⇒ gleicher Vorschlag; „Neu würfeln" erhöht den Counter.
2. **Kandidaten bauen:** alle gültigen Slot-Kombinationen aus der Garderobe sampeln (bei großen Garderoben: 200 zufällige Kombinationen statt Vollenumeration).
3. **Scoring:** jede Kombination bekommt Punkte (siehe 4.2–4.4), beste Kombination gewinnt. Bei „Neu würfeln" wird aus den Top 5 per Seed gewählt, damit Varianz entsteht.
4. **Fallbacks:** Fehlen Slots (z. B. keine Schuhe angelegt), Outfit trotzdem ausgeben und Hinweis anzeigen („Füge Schuhe hinzu für komplette Outfits").

### 4.2 Farbharmonie-Regeln (Score-Anteile)
- **Neutrale-Basis-Regel:** mind. 2 Teile aus den Kern-Neutralen ⇒ +30. Old Money lebt von Neutralen.
- **Max. 1–2 Akzentfarben:** genau 1 Akzent ⇒ +20; 2 Akzente nur wenn harmonisch (HSL-Hue-Abstand < 40° oder klassische Paare wie burgundy+forest, navy+hunter-red) ⇒ +10; ≥3 Akzente ⇒ −40.
- **Klassische Kombos (Bonus +15):** navy+cream, navy+camel, forest+cream, burgundy+grey, camel+white, navy+burgundy, sage+cream.
- **Verbote (−50):** schwarz+navy direkt übereinander, zwei fast gleiche, aber nicht identische Farbtöne (Hue-Abstand 10–25° bei gleicher Sättigung — „beißt sich").
- **Schuhe/Gürtel-Regel:** Ledertöne von Schuhen und Gürtel matchen (beide braun-Familie oder beide dunkel) ⇒ +10.

### 4.3 Musterregeln
- **Max. 1 auffälliges Muster** (argyle, check, houndstooth, floral) pro Outfit ⇒ sonst −30.
- Dezente Muster (stripes, herringbone, cable, dots) dürfen mit 1 auffälligen kombiniert werden, wenn Farben überlappen ⇒ +10.
- 2 dezente Muster ok, wenn unterschiedliche Skala (z. B. feine Streifen + grobes Fischgrät).
- Komplett uni-Outfit ⇒ +5 (sicher, aber langweilig — kleiner Bonus, kein großer).

### 4.4 Preppy-/Old-Money-Stilregeln
- **Layering-Bonus:** layer-Slot belegt (Pullover über Hemd, Blazer, Pullunder) ⇒ +25. Cardigan/Sweater über Kragenhemd ⇒ zusätzlich +10 (der klassische Preppy-Look).
- **Formalitäts-Kohärenz:** max. Spannweite der formality-Werte im Outfit ≤ 2 ⇒ +20; Spannweite ≥ 3 ⇒ −30 (keine Anzughose zu Sneakern mit T-Shirt).
- **Signature-Pieces-Bonus:** loafers/boat-shoes/oxfords ⇒ +10; polo oder blouse mit chinos/skirt ⇒ +10; argyle oder cable ⇒ +5.
- **Anti-Preppy-Malus:** jeans + tshirt gleichzeitig ⇒ −20 (zu casual für den Stil); sneakers mit formality ≥ 4-Teilen ⇒ −15.
- **Wärme-Kohärenz:** alle Teile warmth-Differenz ≤ 1 ⇒ +10 (optional: Saison-Toggle „Sommer/Übergang/Winter" in den Settings filtert vorab nach warmth).

### 4.5 Begründungs-Text
Die Engine liefert pro Outfit 1–2 generierte Sätze, *warum* es funktioniert (aus den getroffenen Bonus-Regeln abgeleitet), z. B.: „Navy und Creme sind ein zeitloses Duo — der Cardigan über dem Kragenhemd bringt den klassischen Preppy-Layer." Das macht die App lehrreich und charmant.

---

## 5. UI / Design

### 5.1 Design-Sprache: „modern verspielt trifft Old Money"
- **Farben der App selbst:** warmes Creme (`#F7F3EA`) als Hintergrund, Navy (`#1F3A5F`) als Primärfarbe, Akzente in Burgund und Forest Green. Dark Mode optional weglassen (Scope klein halten).
- **Typografie:** Serif-Display für Überschriften (z. B. Georgia/`serif`-Stack, da keine externen Fonts erlaubt — großzügig, mit `letter-spacing`), humanistische Sans (`system-ui`) für UI-Text. Kursive Serif-Akzente für die Begründungstexte.
- **Verspielte Elemente:** sanfte Federungs-Animationen (CSS `transition` mit `cubic-bezier`-Overshoot) beim Einblenden der Outfit-Karten; Konfetti-artige kleine SVG-Sterne beim Speichern eines Favoriten; dezente Muster (Nadelstreifen/Rauten als CSS-Background) in Kartenköpfen; abgerundete Karten (`border-radius: 20px+`) mit weichen Schatten.
- **Kleidungs-Darstellung:** jede Kategorie hat eine **Inline-SVG-Silhouette** (Hemd, Pullover, Hose, Loafer …), die mit `colorHex` gefüllt und mit dem gewählten Muster (SVG `<pattern>`-Defs: Streifen, Karo, Hahnentritt, Argyle, Punkte, Fischgrät, Zopf angedeutet) überlagert wird. Das ist der wichtigste „Wow"-Faktor: die Garderobe sieht aus wie ein illustriertes Lookbook.

### 5.2 Screens (SPA mit Tab-Navigation unten/oben)
1. **„Heute"** (Startscreen): Datum + Begrüßung („Dein Look für Freitag, 1. August"), große Outfit-Karte — die Teile als gestapelte/angeordnete SVGs wie ein Flatlay, Begründungstext, Buttons „Neu würfeln" ↻ und „♥ Favorit". Leerer Zustand mit charmanter Illustration + CTA „Garderobe füllen", solange < 3 Pflicht-Slots befüllbar sind.
2. **„Garderobe"**: Grid der Kleidungsstücke (SVG-Vorschau + Name), Filter-Chips nach Kategorie, FAB „+ Teil hinzufügen". Formular als Modal/Bottom-Sheet: Name, Kategorie (Icon-Auswahl), Farbe (Palette-Swatches + Custom-Picker), Muster (visuelle Swatch-Auswahl!), Wärme- und Formalitäts-Slider. Live-Vorschau der SVG-Silhouette im Formular.
3. **„Favoriten"**: gespeicherte Outfits als kleine Karten mit Datum; Antippen zeigt Details; löschen möglich.
4. **Settings** (kleines Zahnrad, kein eigener Tab nötig): Saison-Toggle, JSON-Export/-Import, „Beispiel-Garderobe laden" (siehe 6), alles zurücksetzen (mit Bestätigung).

### 5.3 Interaktion
- „Neu würfeln" animiert die Karten kurz raus und mit Versatz wieder rein (stagger).
- Alle destruktiven Aktionen mit Bestätigung.
- Touch-Ziele ≥ 44px, `aria-label`s auf Icon-Buttons, Fokus-Styles sichtbar.

---

## 6. Beispiel-Garderobe (Seed-Daten)

Beim ersten Start (leere Garderobe) einen Button „Beispiel-Garderobe laden" anbieten mit ~16 Teilen, die den Stil sofort demonstrieren, u. a.: weißes Oxford-Hemd (solid), hellblaues Streifenhemd, navy Kaschmirpullover (cable), cremefarbener Cardigan, Argyle-Pullunder (navy/burgund), navy Blazer, beige Chinos, graue Stoffhose, Karo-Rock (forest), braune Penny-Loafer, Boat-Shoes, weiße Retro-Sneaker, brauner Ledergürtel, Seidenschal (burgundy dots), Wollmantel (camel, herringbone).

---

## 7. Implementierungsreihenfolge (Milestones)

Jeder Milestone endet mit einem lauffähigen Zustand + Commit.

1. **M1 — Gerüst & Store:** HTML-Skelett, Tab-Navigation, Design-Tokens (CSS Custom Properties), Store mit localStorage + Export/Import.
2. **M2 — Garderobe:** Formular mit allen Feldern, SVG-Silhouetten + Muster-Defs, Grid, CRUD, Beispiel-Garderobe.
3. **M3 — Engine:** Scoring-Funktionen als reine Funktionen, seeded PRNG, `generateOutfit`, Begründungs-Texte. Mini-Selbsttests: `console.assert`-Block, der mit der Beispiel-Garderobe prüft, dass (a) nie 3 Akzentfarben, (b) nie 2 auffällige Muster, (c) Formalitätsspanne ≤ 2 in den Top-Ergebnissen.
4. **M4 — „Heute"-Screen:** Outfit-Rendering als Flatlay, Reroll, Favoriten speichern/anzeigen.
5. **M5 — Polish:** Animationen, leere Zustände, Responsivität, A11y-Pass, Settings.

## 8. Qualitätskriterien / Abnahme

- [ ] `index.html` läuft per Doppelklick offline, keine Netzwerk-Requests, keine Konsolen-Fehler.
- [ ] Gleiches Datum ⇒ gleicher Vorschlag; Reroll liefert andere plausible Outfits.
- [ ] Engine-Selbsttests grün (`console.assert` ohne Fehlermeldungen).
- [ ] Garderobe übersteht Reload (localStorage) und Export→Import-Roundtrip.
- [ ] Muster sind in den SVG-Vorschauen visuell klar unterscheidbar.
- [ ] Mobil (375px) und Desktop (1280px) ohne Layoutbrüche; Icon-Buttons mit `aria-label`.
- [ ] Sprache der UI: Deutsch.
