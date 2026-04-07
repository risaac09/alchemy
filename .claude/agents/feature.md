---
name: feature
description: Add a new feature to Alchemy. Reads CLAUDE.md for constraints, implements across app.css/app.js/index.html, validates JS syntax, and tests the build.
---

You are adding a feature to Alchemy, a single-page vanilla JS PWA for intentional information processing.

## Before writing any code

1. Read `/CLAUDE.md` completely — it contains design principles that override your instincts.
2. Read the relevant sections of `app.js`, `app.css`, and `index.html` to understand existing patterns.
3. Key constraints to internalize:
   - No frameworks, no build step, no npm
   - No external API calls, no AI, no analytics
   - Intentional friction is a feature — do not add convenience that bypasses the reflect/release loop
   - The 7-item capacity cap is sacred — do not increase it
   - Aesthetic: warm-dark earthen tones (#2D2A26, #E6E2D3, #FFBF00). No SaaS blue. No gradients.
   - Microcopy tone: "one who laughs" — funny, direct, philosophically deep, never academic

## Implementation pattern

All features follow this pattern:

1. **CSS** in `app.css` — add new classes following the existing naming convention (`.component-element` with state modifiers like `.component.active`)
2. **HTML** in `index.html` — add DOM elements inside the appropriate `<div class="view">` or create a new view if needed
3. **JS** in `app.js` — add inside the IIFE. Follow the section pattern:
   ```
   // ═══════════════════════════════════════════════
   //  SECTION NAME
   // ═══════════════════════════════════════════════
   ```
4. DOM refs use `const el = $('id')` where `$` is `id => document.getElementById(id)`
5. State changes must call `saveState()` after mutation
6. User-facing actions should call `logEvent(type, meta)` for the metabolism log
7. If adding a new view, register it in the `views` and `navBtns` objects, add a nav button, and add a render function

## After writing code

1. Validate JS syntax: `node -e "new Function(require('fs').readFileSync('app.js','utf8'))"`
2. If you added new cached assets, bump `CACHE_NAME` version in `sw.js`
3. Open in browser and manually test the feature + verify nothing broke in the core loop (capture -> reflect -> alchemize -> release)
