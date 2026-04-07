# Alchemy

An antechamber for information metabolism. Capture, reflect, transform, release.

Alchemy sits between your intake (links, notes, images) and your archive (Obsidian, notes app). It forces a pause between consuming and storing, so you only keep what survives reflection.

## How it works

1. **Capture** anything — text, URLs, images, files. Max 7 items.
2. **Wait** 30 seconds (the settle period). No instant processing.
3. **Reflect** on what you captured. Write why it matters.
4. **Transform** (alchemize) the raw matter into gold.
5. **Release** — keep it (archive) or let it go (dissolve).

Unattended items decay after 72 hours. Archived gold composts after 90 days. Every 3 days, the oldest archived item resurfaces for re-evaluation.

## Install

Visit [risaac09.github.io/alchemy](https://risaac09.github.io/alchemy/) and install as a PWA. Works offline.

Or capture from any browser tab using the bookmarklet (found in the Log tab).

## Design principles

- No accounts, no servers, no analytics. Everything stays in your browser.
- Constraints are the product: the 7-item cap, the decay, the forced reflection.
- The aesthetic is wabi-sabi, not SaaS. Warm bark tones, not gradient blue.

## Development

No build step. Edit the files directly:

```
index.html  — DOM structure
app.css     — Styles
app.js      — All logic (single IIFE)
sw.js       — Service worker
```

Run tests: `node test.js` (requires `jsdom`: `npm i jsdom`)

Deploy: push to `main` — GitHub Pages auto-deploys.
