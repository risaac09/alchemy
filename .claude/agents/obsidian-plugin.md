---
name: obsidian-plugin
description: Convert Alchemy from a standalone PWA into an Obsidian plugin. Major architectural task — plan before executing.
---

You are converting Alchemy from a single-file vanilla JS PWA into an Obsidian community plugin.

## Current architecture (PWA)
- `app.js` — single IIFE, all logic
- `app.css` — all styles
- `index.html` — DOM structure
- `localStorage` for persistence
- No build step, no dependencies

## Target architecture (Obsidian plugin)

```
alchemy-obsidian/
  manifest.json       — Obsidian plugin manifest (id, name, version, minAppVersion)
  main.ts             — Plugin class extending Plugin, registers view
  view.ts             — AlchemyView extending ItemView, renders UI
  styles.css          — Scoped styles (prefix all selectors with .alchemy-)
  data.json           — Plugin data (auto-managed by loadData/saveData)
  esbuild.config.mjs  — Build script (follow obsidian-sample-plugin)
  package.json        — Dependencies: obsidian, esbuild, typescript
  tsconfig.json       — TypeScript config
```

## Key swaps

| PWA | Obsidian Plugin |
|---|---|
| `localStorage.getItem/setItem` | `this.plugin.loadData()` / `this.plugin.saveData()` |
| `getElementById` | `this.containerEl.querySelector` or Obsidian's `createEl` API |
| `<style>` / CSS file | `styles.css` loaded automatically by Obsidian |
| Views via `.active` class toggle | Single `ItemView` with internal state management |
| `navigator.clipboard.writeText` | `navigator.clipboard` (same, but also consider `app.vault.create()`) |
| "Keep" → archive in localStorage | `app.vault.create()` — write a note to a configurable folder |
| File attachments via FileReader | `app.vault.readBinary()` / `app.vault.createBinary()` |
| Share target / bookmarklet | Obsidian URI protocol: `obsidian://alchemy?capture=...` |
| Service worker | Not needed — Obsidian handles offline |
| PWA manifest | Not needed |

## Critical: "Keep" writes a vault note

This is the main win of the plugin conversion. When the user clicks "Keep" in the release modal:

```typescript
const folder = this.plugin.settings.goldFolder || 'Alchemy/Gold';
const fileName = `${folder}/${slugify(matter.slice(0, 40))}-${Date.now()}.md`;
const content = `---
captured: ${new Date(gold.created).toISOString().slice(0, 10)}
transmuted: ${new Date(gold.transmuted).toISOString().slice(0, 10)}
source: alchemy
---

> ${gold.matter.replace(/\n/g, '\n> ')}

${gold.reflection}
`;
await this.app.vault.create(fileName, content);
```

## Settings

Add a settings tab with:
- `goldFolder` — where to write kept notes (default: `Alchemy/Gold`)
- `decayHours` — inbox decay time (default: 72, range: 24-168)
- `archiveDecayDays` — archive compost time (default: 90, range: 30-365)
- `maxCapacity` — inbox limit (default: 7, range: 3-12)

## Migration path

Users of the PWA can export their data (the Export button already produces compatible JSON). The plugin should have an "Import from PWA" option in settings that reads this JSON and creates vault notes for all archived items.

## Build & test

```bash
npm install
node esbuild.config.mjs
```

Copy `main.js`, `manifest.json`, and `styles.css` to `.obsidian/plugins/alchemy/` in a test vault. Enable in Community Plugins settings.

## Design principles carry over

Read the CLAUDE.md in the PWA repo. All design principles apply:
- No AI features, no external APIs
- Intentional friction preserved
- Finite capacity is sacred
- Wabi-sabi aesthetic (adapt colors to work in both light and dark Obsidian themes)
