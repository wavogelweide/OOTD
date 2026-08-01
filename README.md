# OOTD – Dein täglicher Stilbegleiter

Eine Web-App, die aus der eigenen Garderobe täglich ein Outfit vorschlägt –
farblich abgestimmt und im Preppy-/Old-Money-Stil.

**Live:** https://wavogelweide.github.io/OOTD/

Alle Daten bleiben im Browser (`localStorage`). Kein Konto, kein Server,
keine Übertragung an Dritte.

## Stand der Umsetzung

Die App entsteht in fünf Phasen (siehe [BAUPLAN.md](BAUPLAN.md), §9):

| Phase | Inhalt | Status |
|---|---|---|
| 1 | Gerüst und Design-System | ✅ fertig |
| 2 | Garderobe anlegen, bearbeiten, löschen | ✅ fertig |
| 3 | Outfit-Engine mit Farbharmonie-Scoring | ✅ fertig |
| 4 | Tab „Heute“: Vorschlag, Bewertung, Verlauf | ✅ fertig |
| 5 | Feinschliff, Barrierefreiheit, Doku | ✅ fertig |

## Bedienung

Die App hat zwei Bereiche, umschaltbar über die Leiste am unteren Bildrand.

**Heute** zeigt den Vorschlag des Tages: die Silhouetten der ausgewählten Teile
nebeneinander, jedes mit Farbpunkt, Name und – falls vorhanden – der
Musterangabe. Darüber steht die Bewertung als ein bis fünf goldene Sterne mit
Punktzahl, darunter in kursiver Serifenschrift ein bis zwei Sätze, warum die
Kombination funktioniert. Zwei Knöpfe schließen die Karte ab: **Neu würfeln**
zieht einen anderen Vorschlag aus derselben Garderobe, **Gefällt mir** merkt
den Tag vor. Ganz unten läuft der Rückblick auf die letzten sieben Tage als
Reihe kleiner Karten mit den Farben des jeweiligen Outfits und einem Herz bei
gemerkten Tagen.

Der Vorschlag ist an das Datum gekoppelt und übersteht ein Neuladen: Wer
morgens würfelt, sieht abends dasselbe Outfit. Erst am nächsten Tag wechselt er.

**Garderobe** listet alle Teile als Karten mit Silhouette, Kategorie und
Anlass-Stufe; über die Chips lässt sich nach Kategorie filtern. Der Knopf
unten rechts öffnet das Formular für ein neues Teil – mit Kategorie, Art,
Farbe aus der Palette oder frei gewählt, Muster, Anlass und Wärme. Eine
Vorschau zeigt dabei laufend, wie das Teil aussehen wird. Wer noch nichts
angelegt hat, kann mit einem Klick eine kuratierte Beispiel-Garderobe aus
24 Teilen laden.

## Wie die Vorschläge entstehen

Jedes Outfit bekommt eine Wertung von 0 bis 100 aus vier Teilen:

| Anteil | Kriterium |
|---|---|
| 40 % | **Farbharmonie** – ideal ist eine neutrale Basis mit höchstens einem kräftigen Akzent. Mehrere Akzente werden danach beurteilt, wie sie im Farbkreis zueinander stehen. |
| 20 % | **Musterdisziplin** – höchstens ein auffälliges Muster pro Outfit. |
| 20 % | **Anlass** – die Teile dürfen höchstens eine Stufe auseinanderliegen. |
| 20 % | **Preppy-Anteil** – wie nah die Teile am Kanon des Stils liegen. |

Als neutral gilt dabei nicht, was rechnerisch wenig gesättigt ist, sondern was
wenig *bunt* ist. Creme kommt auf eine HSL-Sättigung von 0,46 und wäre sonst
ein Akzent – über die Buntheit (0,09) wird es korrekt als Basiston erkannt.
Damit zählen auch Hellblau, Salbei, Navy und Racing Green zur Basis; ein
hellblaues Oxford-Hemd zur Camel-Chino fällt so nicht als „zwei Akzente" durch.

Gewürfelt wird nicht das strikte Maximum, sondern gleichverteilt aus der
Spitzengruppe aller Kandidaten, die höchstens acht Punkte darunter liegen –
sonst käme bei jedem Würfeln fast immer dasselbe Outfit heraus.

## Die Silhouetten

Die Kleidungsstücke sind keine Fotos, sondern 21 selbst gezeichnete
SVG-Silhouetten, die aus dem Subtyp erkannt und in der Farbe des Teils
eingefärbt werden; das Muster liegt als SVG-Pattern darüber.

Fertige Icon-Sätze aus dem Netz wurden geprüft und verworfen. Bei
Phosphor Icons fehlen ausgerechnet Rock, Blazer, Mantel und Loafer –
also die Kernstücke des Stils. Bei game-icons.net ist die Detailzeichnung
als Aussparung angelegt: Sobald ein Muster über der Fläche liegt, füllt
es Kragen und Nähte mit und die Form zerfällt. Eigene Silhouetten zeichnen
ihre Details als Linien über der Fläche und bleiben deshalb auch mit
Tartan oder Argyle lesbar.

Flache Formen – Schuhe, Gürtel, Kette, Cap – haben einen eigenen
Bildausschnitt (`box`), damit sie den Rahmen füllen und nicht im
hochformatigen Standardrahmen verloren wirken.

Zum Prüfen und Weiterentwickeln dient `icons-preview.html`: die Seite
zeigt alle Formen groß, in App-Größe und mit Muster nebeneinander.

## Barrierefreiheit

- Alle Textfarben erreichen mindestens 4,5:1 Kontrast (WCAG AA, Kleintext);
  die Werte sind rechnerisch geprüft, nicht geschätzt.
- Vollständig mit der Tastatur bedienbar: Skip-Link als erster Tab-Stopp,
  Pfeiltasten zwischen den Bereichen nach dem ARIA-Tabs-Muster, Dialoge mit
  Fokusfang, ESC zum Schließen und Fokusrückgabe an den auslösenden Knopf.
- Alle Tippziele sind mindestens 44 px groß.
- Silhouetten sind als dekorativ ausgezeichnet, die Bewertung hat eine
  Textalternative, Würfeln und Merken werden über eine Live-Region angesagt.
- `prefers-reduced-motion` schaltet sämtliche Animationen ab.

## Lokal starten

Die App braucht keinen Build-Schritt, aber wegen der ES-Module einen
Webserver – `file://` reicht nicht:

```sh
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

Die Engine-Tests laufen ohne Abhängigkeiten im Browser:
http://localhost:8000/tests.html

## Aufbau

```
index.html          Markup, Tabs, Dialoge, Formularfelder
css/style.css       Design-System (Farben, Typografie, Komponenten)
js/color.js         Farbkonvertierung (hex/RGB/HSL), Helligkeit
js/catalog.js       Kategorien, Subtypen, Farb-/Musterpaletten, Preppy-Score
js/engine.js        Bewertung und Erzeugung der Outfits, Seed-Zufall
js/store.js         Persistenz in localStorage, CRUD
js/svg.js           Silhouetten und Muster als Inline-SVG
js/ui.js            Garderoben-Grid, Formular, Toasts
js/app.js           Bootstrap und Tab-Routing
js/seed-data.js     Kuratierte Beispiel-Garderobe
tests.html          Testrunner für die Engine
icons-preview.html  Werkbank: alle Silhouetten groß, klein und mit Muster
```

## Veröffentlichen

Jeder Push auf den Branch veröffentlicht die Seite über GitHub Pages
(`.github/workflows/pages.yml`).

Pages ist eingerichtet (Source: „GitHub Actions"), der Ablauf läuft ohne
weiteres Zutun. Sollte Pages in einem Fork neu eingeschaltet werden müssen:
**Settings → Pages → Source: „GitHub Actions"**. Der Workflow versucht das
zwar selbst, das `GITHUB_TOKEN` darf eine Pages-Seite aber nicht anlegen
(`Resource not accessible by integration`).

Zusätzlich erzeugt `node build-standalone.js` unter `dist/index.html` eine
einzelne, in sich geschlossene HTML-Datei mit eingebettetem CSS, JavaScript
und Schriften – gedacht für Umgebungen mit strenger Content-Security-Policy,
die keine Anfragen an fremde Hosts erlauben.
