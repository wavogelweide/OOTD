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
| 3 | Outfit-Engine mit Farbharmonie-Scoring | offen |
| 4 | Tab „Heute“: Vorschlag, Bewertung, Verlauf | offen |
| 5 | Feinschliff, Barrierefreiheit, Doku | offen |

Der Tab „Heute“ zeigt deshalb noch einen Platzhalter.

## Lokal starten

Die App braucht keinen Build-Schritt, aber wegen der ES-Module einen
Webserver – `file://` reicht nicht:

```sh
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Aufbau

```
index.html          Markup, Tabs, Dialoge, Formularfelder
css/style.css       Design-System (Farben, Typografie, Komponenten)
js/color.js         Farbkonvertierung (hex/RGB/HSL), Helligkeit
js/catalog.js       Kategorien, Subtypen, Farb-/Musterpaletten, Preppy-Score
js/store.js         Persistenz in localStorage, CRUD
js/svg.js           Silhouetten und Muster als Inline-SVG
js/ui.js            Garderoben-Grid, Formular, Toasts
js/app.js           Bootstrap und Tab-Routing
js/seed-data.js     Kuratierte Beispiel-Garderobe
```

## Veröffentlichen

Jeder Push auf den Branch veröffentlicht die Seite über GitHub Pages
(`.github/workflows/pages.yml`).

**Einmalig nötig:** GitHub Pages muss in den Repo-Einstellungen eingeschaltet
werden – **Settings → Pages → Source: „GitHub Actions"**. Der Workflow versucht
das zwar selbst, das `GITHUB_TOKEN` darf eine Pages-Seite aber nicht anlegen
(`Resource not accessible by integration`). Nach dem Einschalten genügt ein
erneuter Lauf des Workflows (Actions → „Deploy to GitHub Pages" → *Re-run all
jobs*), danach passiert alles automatisch bei jedem Push.

Zusätzlich erzeugt `node build-standalone.js` unter `dist/index.html` eine
einzelne, in sich geschlossene HTML-Datei mit eingebettetem CSS, JavaScript
und Schriften – gedacht für Umgebungen mit strenger Content-Security-Policy,
die keine Anfragen an fremde Hosts erlauben.
