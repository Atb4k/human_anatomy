# Forma — human anatomy explorer

An interactive, responsive anatomy study website built with React, Three.js, and Vite.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm. The prepared cloud environment uses Node.js 24.

```sh
npm ci --cache /tmp/forma-npm-cache
npm run dev -- --port 5173
```

```sh
npm run build
npm run preview -- --port 4173
```

The app does not require credentials, a database, or external APIs. Fonts are bundled locally. Bookmarks are saved in the current browser's local storage.

## Features

- Procedurally generated, rotatable 3D body with selectable anatomy.
- Continuous system explosion slider; individual system visibility and isolation.
- Six system categories, seven region filters, front/side/back views, zoom, reset, and fullscreen.
- Searchable structure library with location, parts, function, and study facts.
- Persistent personal collection and five-question study quiz with scoring.
- Responsive mobile layout, keyboard-accessible controls, and a WebGL fallback message.

## Model and content scope

This first version has 43 representative study entries, not every anatomical structure. The mesh is a stylized, simplified educational cutaway constructed from procedural geometry. It does not have the anatomical fidelity of a medically reviewed atlas, and the assembled view intentionally layers some organs in front of bones and muscles for visibility. Front/side/back views show the same simplified geometry; some posterior anatomy is omitted. The integumentary layer is a translucent schematic shell.

A complete atlas would require an appropriately licensed, medically reviewed 3D asset with separately segmented structures, plus a verified content dataset. The current implementation can be extended by replacing the procedural meshes in `src/AnatomyScene.jsx` and expanding the structured records in `src/data.js`. Record IDs associate meshes, search results, labels, and study notes.

## Validation

Verified with Chromium and Playwright: WebGL rendering, explosion slider, visibility switches, system isolation, view reset/orientation, structure search and study tabs, bookmark persistence after reload, region navigation, label selection, all five quiz questions and scoring, and a 390px mobile viewport with no horizontal overflow. Production build passes.
