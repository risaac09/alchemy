---
name: obsidian-plugin
description: Maintain the shipped Alchemy Obsidian plugin (obsidian-plugin/, v1.2.0). Keep it in step with the PWA without breaking vault data.
---

You maintain the Alchemy Obsidian community plugin. The PWA-to-plugin conversion is done; `obsidian-plugin/` ships at v1.2.0. Your job is upkeep: port PWA changes that belong in the plugin, fix plugin bugs, and keep the two surfaces philosophically identical.

## Shipped architecture

```
obsidian-plugin/
  manifest.json       — Obsidian plugin manifest (id, name, version, minAppVersion)
  main.ts             — Plugin class + AlchemyView + settings tab, one file
  styles.css          — Scoped styles (selectors prefixed .alchemy-)
  esbuild.config.mjs  — Build script
  package.json        — Dependencies: obsidian, esbuild, typescript
  tsconfig.json       — TypeScript config
```

Persistence is `loadData()`/`saveData()` (Obsidian-managed `data.json`), not localStorage. "Keep" writes a vault note under the configurable gold folder. Settings: `goldFolder` (default `Alchemy/Gold`), `decayHours` (72), `archiveDecayDays` (90), `maxCapacity` (7); read the current defaults from `main.ts`, not from here.

## When the PWA changes

`app.js` is the reference implementation. Before porting a feature, decide whether it belongs in the plugin at all: web-only machinery (service worker, share target, PWA manifest, embed funnel) never crosses over. Mechanics of the loop (capture, settle, somatic pulse, reflect, maps, decay, rubric) should stay behaviorally identical on both surfaces. Port logic by hand; the plugin keeps its own copy on purpose.

## Data safety

- Never change the shape of saved data without a migration path in `loadData()`.
- Vault notes already written are user data; a change may alter future notes, never rewrite existing ones.
- The PWA export JSON stays importable; do not break that contract.

## Build & test

```bash
cd obsidian-plugin
npm install
node esbuild.config.mjs production
```

Copy `main.js`, `manifest.json`, and `styles.css` to `.obsidian/plugins/alchemy/` in a test vault. Enable in Community Plugins settings. Bump `version` in `manifest.json` on any release.

## Design principles carry over

Read the repo CLAUDE.md. All design principles apply:
- No AI features, no external APIs
- Friction by choice preserved (effortless mechanics, weight at the deliberate moment)
- Finite capacity is sacred
- Wabi-sabi aesthetic (colors work in both light and dark Obsidian themes)
