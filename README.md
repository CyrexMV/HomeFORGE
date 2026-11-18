# HomeForge 🏡
**HomeForge** ist ein tabletoptimierter Haus- und Grundrissplaner im Browser.

## Aktueller Stand
- Responsive Studio-Oberfläche für Tablets und Desktop
- 2D-Grundriss mit auswählbaren Räumen und editierbaren Maßen
- 3D-Vorschau mit Orbit-Steuerung
- Geschossauswahl, Raumverwaltung und Flächenübersicht
- Lokales Speichern im Browser und JSON-Projektexport

## Technologie
- React + TypeScript + Vite
- Three.js / React Three Fiber für 3D
- Rust + WebAssembly (geplantes Geometrie-Kernmodul unter `crates/geometry`)

## Entwicklung
```bash
npm install
npm run dev
npm run build
```

## Rust-Modul
Das Rust-Crate enthält performante, testbare Geometrie-Funktionen. Der Browser-Fallback funktioniert auch ohne WASM-Build.

## GitHub Pages
Nach Aktivierung des Workflows wird die Website bei Pushes auf `main` gebaut und über GitHub Pages veröffentlicht.

> HomeForge ist ein Planungs- und Visualisierungswerkzeug, kein Ersatz für statische Berechnungen, Bauanträge oder professionelle Fachplanung.
