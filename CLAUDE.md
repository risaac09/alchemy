# Alchemy

An antechamber for information metabolism. Absorbs The Metabolizer. Two products, one codebase:

- **PWA** (`/`) — Single-page vanilla JS. No framework, no build step. Free at alchemy.rubinsteinproductions.com
- **Obsidian plugin** (`/obsidian-plugin/`) — TypeScript + esbuild. "Keep" writes vault notes. Maps → subfolders.

Other surfaces ship alongside: `chrome-extension/`, `ios/`, `embodied-service/` (a Cloudflare Worker), and `methodology/embodied-ai/`; the full surface inventory is `docs/PRODUCT.md`.

**Live:** https://alchemy.rubinsteinproductions.com
**Repo:** https://github.com/risaac09/alchemy

## Architecture

```
index.html      — DOM structure, PWA meta tags, ARIA attributes
app.css         — All styles, CSS variables, animations, responsive breakpoints
app.js          — All logic in a single IIFE; the free, account-less tool
embed-funnel.js — Marketing/lead-capture layer. Loaded ONLY by embed.html.
sw.js           — Service worker, cache-first for shell + fonts
test.js         — jsdom-based test suite
manifest.json   — PWA config, share target
icon-*.png      — App icons (192, 512)
```

No build. No bundler. Edit the files directly and push.

**Surface separation (2026-06-22), a guardrail:** `index.html` (the free PWA) loads `app.js` only. `embed.html` (the marketing iframe on rubinsteinproductions.com/services) loads `embed-funnel.js` + `app.js`. The diagnostic in app.js calls optional `window.AlchemyEmbedFunnel` hooks if present; with no funnel loaded it runs as the pure tool. **No sales or lead-capture code lives in app.js**, and the email the funnel collects is never stored or sent by the app: it `postMessage`s to the host frame, which owns capture.

## The loop

Capture (Inhale) → Settle → Somatic pulse → Reflect (Pause) → Transform (Alchemize) → Map → Release (Exhale) → Rubric (self-assessment at Keep). The Self-assessment view (the diagnostic, in code) runs independently: 12 questions, 4 axes, a 2×2 quadrant placement.

Constants, state shapes, the view state machine, and the feature list all live in `app.js` as named values near the top; read them there rather than from a copy here. `test.js` is the executable spec for all of it.

## Design Principles — READ BEFORE CHANGING ANYTHING

- **Anti-slop.** No SaaS blue, no gradients, no gamification, no streaks, no badges. Warm-dark earthen tones.
- **Friction by choice.** Make the mechanics effortless and invisible. Keep the friction at the moment the person chooses: the settle and the reflection they cross on purpose, not delays imposed across the plumbing. Default friction to zero on the mechanics, and let the user dial it up at the threshold. The settle and the somatic check are the threshold and they stay. The manual Obsidian copy is friction sitting in the plumbing, so reconsider it.
- **Finitude.** The 7-item cap and decay mechanics enforce scarcity. Do not increase capacity or disable decay.
- **No external services in the PWA.** This principle scopes to `app.js`, the free tool: no API calls, no analytics, no telemetry, no AI features. Everything there runs locally in the browser. `embodied-service/` (the Cloudflare Worker) is the deliberate exception; it is the one place in the repo with a backend and a model call, and nothing from it enters `app.js`.
- **Single file per concern.** One CSS file, one JS file. Do not split into modules or add a build step unless converting to Obsidian plugin.
- **Wabi-sabi aesthetic.** The app should feel like a worn field notebook, not a software product. Microcopy should be funny, direct, and philosophically deep without being academic.

## Deployment

Push to `main`. GitHub Pages auto-deploys. Bump the service worker cache version in `sw.js` when deploying breaking changes, or clients keep serving the old shell. Bump `VERSION` in `app.js` for feature additions.

## Testing

`node test.js` (or `npm test`; requires `npm i jsdom`). The suite covers the state machine, capture, decay, reflection, archiving, resurfacing, export/import, share target, keyboard shortcuts, ARIA attributes, bulk release, sparkline, notifications, diagnostic scoring, rubric, and the embed funnel.

The tests run in jsdom, so four things they cannot see need a real browser before a release: offline load from the service worker, the `prefers-reduced-motion` path, the dissipation animation on Let Go, and clipboard content from the archive copy button.
