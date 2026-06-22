# Alchemy

An antechamber for information metabolism. Absorbs The Metabolizer. Two products, one codebase:

- **PWA** (`/`) — Single-page vanilla JS. No framework, no build step. Free at risaac09.github.io/alchemy/
- **Obsidian plugin** (`/obsidian-plugin/`) — TypeScript + esbuild. "Keep" writes vault notes. Maps → subfolders.

**Live:** https://risaac09.github.io/alchemy/
**Repo:** https://github.com/risaac09/alchemy

## Architecture

```
index.html      — DOM structure, PWA meta tags, ARIA attributes (~308 lines)
app.css         — All styles, CSS variables, animations, responsive breakpoints
app.js          — All logic in a single IIFE; the free, account-less tool
embed-funnel.js — Marketing/lead-capture layer (name, email gate, booking CTA, lead postMessages + its own CSS). Loaded ONLY by embed.html. The free PWA never includes it.
sw.js           — Service worker, cache-first for shell + fonts
test.js         — jsdom-based test suite
manifest.json   — PWA config, share target
icon-*.png      — App icons (192, 512)
```

**Surface separation (2026-06-22):** `index.html` (the free PWA) loads `app.js` only. `embed.html` (the marketing iframe on rubinsteinproductions.com/services) loads `embed-funnel.js` + `app.js`. The diagnostic in app.js calls optional `window.AlchemyEmbedFunnel` hooks if present (`landingField`, `onStart`, `wantsGate`, `gateView`, `reportExtra`, `onComplete`, `handleAction`); with no funnel loaded it runs as the pure tool. No sales/lead-capture code lives in app.js.

No build. No bundler. Edit the files directly and push.

## Core Mechanics — v1.3.0 (Diagnostic + Rubric merge)

The loop: **Capture (Inhale) → Settle → Somatic pulse → Reflect (Pause) → Transform (Alchemize) → Map → Release (Exhale) → Rubric (self-assessment at Keep)**

Metabolizer concepts absorbed:
- **Somatic pulse** — one-word body check before reflection, stored on gold + archive items
- **Body Vocabulary** — expandable helper panel below the somatic pulse input, 8 quality categories
- **Maps** — 5 types (observation/question/connection/tension/practice), tagged at keep, filterable in archive; in plugin: write to map subfolders
- **Weekly Threshold** — "What shifted?" prompt in Log, stores up to 52 entries
- **Friction Log** — meta-practice in Log, one-line avoidance catches

v1.3.0 additions:
- **Post-keep rubric** — 5-dim self-rating (clarity, integrity, somatic, transmutation, release) fires once when Keeping an item. 1–5 per dim + optional note. Dismissible (archives without scores). Adapted from `methodology/evaluation-framework.md`.
- **Diagnostic view** — 6th view (`Diag` tab, keyboard `4`). 12-question Information Metabolism assessment absorbed from `alchemy-diagnostic`. 4 axes (intake/transformation/expression/returnFlow), 2×2 quadrant placement (Stagnant/Drowning/Distilling/Thriving), SVG radar + placement map. Results persist in `state.diagnostic`, surface on the Log as "Metabolism placement".
- **Embed mode** — `embed.html` shows only the diagnostic view; body.embed CSS hides chrome; `body[data-embed="true"]` skips SW registration and onboarding. Posts `{type:'height'}` and `{type:'diagnostic-complete',scores,quadrant}` to parent frame.
- **Embed lead-capture funnel** (`embed-funnel.js`, loaded only by embed.html) — the marketing iframe adds a name field on the landing, an `embed-gate` view between Q12 and the report, and a booking CTA (`mailto:isaac@rubinsteinproductions.com`) on the report. The main accountless PWA never loads the file, so it never shows any of these. The email is never stored or sent by the app: the funnel `postMessage`s `{type:'started'}`, `{type:'email',email}`, and `{type:'complete',scores,quadrant}` to the host frame, which owns capture (app.js still posts the generic `{type:'height'}` and `{type:'diagnostic-complete'}`). Consolidated from the standalone `alchemy-diagnostic` repo 2026-06-22, then split into `embed-funnel.js` so app.js carries no sales code; that standalone repo is now redundant and should be archived.

The original loop: **Capture (Inhale) → Reflect (Pause) → Transform (Alchemize) → Release (Exhale)**

| Constant | Value | Purpose |
|---|---|---|
| `MAX_CAPACITY` | 7 | Inbox hard limit — finitude is the point |
| `DECAY_MS` | 72 hours | Unattended inbox items auto-dissolve |
| `SETTLE_MS` | 30 seconds | Freshly captured items can't be reflected on yet |
| `LINK_COOLING_MS` | 4 hours | Links can't be reflected on until cooling period ends |
| `ARCHIVE_DECAY_MS` | 90 days | Archived gold auto-composts |
| `RESURFACE_INTERVAL_MS` | 3 days | Oldest archive item returns to inbox for re-evaluation |
| `TICK_INTERVAL` | 5 seconds | Main loop refresh |

## State

Single localStorage key: `alchemy_v2`. Shape:

```
{ inbox: [...], archive: [...], stats: { totalKept, totalReleased }, events: [...last 200], lastResurface: timestamp, lastNotificationTs: timestamp, errors: [...] }
```

Inbox items have: `id, text, created, type, fileName?, fileType?, fileSize?, preview?, resurfaced?, opened?`
Archive items have: `id, matter, reflection, created, transmuted, archived, type, fileName?, fileType?, fileSize?, preview?, map?, bodyCheck?, rubric?`

`rubric` (nullable) shape: `{ clarity, integrity, somatic, transmutation, release, note, ratedAt }` — each score field nullable (unrated = null). When the user dismisses the rubric form entirely, `rubric === null`.

`state.diagnostic` (nullable) shape: `{ answers: {q1..q12: 1..5}, scores: {intake, transformation, expression, returnFlow, volume, circulation}, quadrant: 'Stagnant'|'Drowning'|'Distilling'|'Thriving', summary, takenAt }`

## Design Principles — READ BEFORE CHANGING ANYTHING

- **Anti-slop.** No SaaS blue, no gradients, no gamification, no streaks, no badges. Warm-dark earthen tones.
- **Intentional friction.** The 30s settle period, the forced reflection, the manual Obsidian copy — these are features, not bugs. Do not add convenience that removes friction.
- **Finitude.** The 7-item cap and decay mechanics enforce scarcity. Do not increase capacity or disable decay.
- **No external services.** No API calls, no analytics, no telemetry, no AI features. Everything runs locally in the browser.
- **Single file per concern.** One CSS file, one JS file. Do not split into modules or add a build step unless converting to Obsidian plugin.
- **Wabi-sabi aesthetic.** The app should feel like a worn field notebook, not a software product. Microcopy should be funny, direct, and philosophically deep without being academic.

## Views

6 views (Inbox, Reflect, Gold, Archive, Log, Diagnostic) + Release Modal. Views toggle via `.active` class. State machine:

```
Inbox -> click item -> Reflect -> Alchemize -> Gold -> Release Modal -> Keep -> Rubric form -> Archive
                                                                     -> Let Go (Inbox)
                                                                     -> Back (restore to Inbox)
Diagnostic (independent): Landing -> Question × 12 -> Report (saved to state.diagnostic)
```

The Rubric form intercepts the Keep → Archive transition. Esc or click-outside dismisses the rubric and archives without scores.

## Key Features (v1.1.0)

- **Differential inbox rendering** — Map-based DOM reuse, no innerHTML rebuild per tick
- **Visibility pause** — Intervals stop when tab backgrounded, catch up on return
- **Archive search/sort** — Debounced substring filter, newest/oldest toggle
- **Bulk archive release** — Select mode with checkboxes, confirmation modal, undo support
- **Keyboard shortcuts** — 1/2/3 views, n capture, Esc back, Cmd+Enter alchemize
- **Undo release** — Ephemeral single-undo via action toast (5s window)
- **Decay awareness** — Pulse at 50%, fading indicator, optional browser notifications at 85%
- **Activity sparkline** — 7-day CSS bar chart in Log (captures/keeps/releases)
- **Accessibility** — ARIA roles/labels, focus trap in modal, reduced motion support
- **Link cooling** — 4h delay before link items can be reflected on

## Deployment

Push to `main`. GitHub Pages auto-deploys. Service worker cache version is `alchemy-v14` — bump this in `sw.js` when deploying breaking changes to force cache refresh. Bump `VERSION` in app.js for feature additions.

## Testing

Run `node test.js` (or `npm test`; requires `npm i jsdom`). 197 assertions covering state machine, capture, decay, reflection, archiving, resurfacing, export/import, share target, keyboard shortcuts, ARIA attributes, bulk release, sparkline, notifications, diagnostic scoring, rubric, and the embed lead-capture funnel.

Key flows to also verify manually in browser:
1. Capture text -> appears in inbox with settle countdown
2. Wait 30s -> click item -> reflect -> alchemize -> gold view
3. Release modal -> Keep -> appears in archive
4. Release modal -> Let Go -> dissipation animation -> returns to inbox
5. Archive copy button -> clipboard has markdown with YAML frontmatter
6. Export/Import round-trip preserves all data
7. `?capture=test` URL param auto-captures on load
8. Offline: kill network, app still loads from service worker
9. Archive bulk select -> release selected -> undo
10. Keyboard shortcuts (1/2/3/n/Esc) from inbox
11. Tab focus trap in release modal
12. `prefers-reduced-motion` disables all animations
