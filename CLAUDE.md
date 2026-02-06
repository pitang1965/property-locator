# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A client-side web app ("距離で物件特定") that estimates a real estate property's location on a map by triangulating walking distances to nearby facilities. Japanese-language UI targeting the Japanese real estate market. Deployed at https://property-locator.over40web.club/

## Tech Stack

- Vanilla JavaScript, HTML5, CSS3 (no build tools, no bundler, no package.json)
- Leaflet.js 1.9.4 (CDN) for interactive maps with OpenStreetMap tiles
- Google AdSense for monetization

## Running Locally

```bash
npx serve .
# or
python -m http.server 8000
```

Then open `http://localhost:8000`. No build step required.

## Architecture

**Single-page app with three files:**

- `index.html` — HTML structure, meta tags (SEO/OGP), CDN imports, inline ad slots
- `app.js` — All application logic (~460 lines)
- `style.css` — All styles (~490 lines), responsive with breakpoints at 768px and 480px

**Core data model** — `facilities` array stored in localStorage (key: `propertyLocator_facilities`):
```js
{ name: string, distance: number, enabled: boolean, lat: number|null, lng: number|null }
```

**Position estimation algorithm** — Weighted centroid calculation where weight = `1 / radius²`. Walking distance is converted to straight-line distance via a configurable coefficient (default 0.75).

**Coordinate extraction** — `extractCoordinates()` parses multiple Google Maps URL formats (pin URLs with `!3d...!4d...`, `@lat,lng` center format, place URLs) and plain `lat,lng` text.

**UI pattern** — Inline event handlers (`onclick="fn(index)"`) with dynamic DOM manipulation. Map and legend are fixed; sidebar scrolls independently.

## Conventions

- Functions: camelCase. Constants: UPPER_SNAKE_CASE. CSS classes: kebab-case.
- UI text and comments are in Japanese; function-level doc comments are in English.
- Git commit messages use gitmoji prefixes (✨, 🐛, etc.) with Japanese descriptions.
- XSS prevention via `escapeHtml()` for user-supplied strings rendered in HTML.
- External links use `noopener,noreferrer`.
