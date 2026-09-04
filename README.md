# Alchemy

**A digital liver for information.** Free. No accounts. No servers. Everything stays in your browser.

Alchemy sits between consuming and knowing. It forces a pause — settle, check your body, reflect, map where it connects. Only what survives that process becomes gold. Gold writes to your Obsidian vault.

---

## The loop

```
Capture (Inhale) → Settle 30s → Somatic pulse → Reflect → Alchemize → Map → Release → Rubric
```

1. **Inhale** anything — text, links, images, files. Hard cap: 7 items.
2. **Wait** 30 seconds. No instant processing. The settle period is intentional.
3. **Check your body** — one word. What's loudest before your intellect takes over? A vocabulary helper sits behind "can't find a word?"
4. **Reflect** — write why it matters. One of 40+ contextual prompts will meet you there.
5. **Alchemize** — raw matter becomes gold. Transmutation complete.
6. **Map it** — where does it connect? Observation / Question / Connection / Tension / Practice.
7. **Release** — keep it (archive, or write to vault) or let it go (return to void).
8. **Rubric** — at Keep, rate the passage across five dimensions (clarity, integrity, somatic, transmutation, release) 1–5. Optional. Dismiss to archive without scores.

Unattended items decay after 72 hours. Archived gold composts after 90 days. Every 3 days, the oldest archived item resurfaces for re-evaluation.

### Self-assessment

A sixth view (`Self-assessment`, keyboard `4`) offers a 12-question snapshot of how information moves through your system. Four axes (intake / transformation / expression / return flow) plot you on a 2×2 map — Stagnant, Drowning, Distilling, or Thriving. Computed locally, no server. The placement surfaces back in the Log. An embeddable version lives at `embed.html` for iframing on third-party sites.

---

## Two surfaces

| | PWA | Obsidian Plugin |
|---|---|---|
| **Install** | Visit the URL, add to home screen | Community Plugins → search "Alchemy" |
| **Keep writes to** | In-browser archive | Vault note at `Alchemy/Gold/[map]/[slug].md` |
| **Maps** | Tags on archive items, filterable | Subfolders created automatically |
| **Works offline** | Yes (service worker) | Yes (Obsidian is local) |
| **Best for** | Any device, quick capture | Obsidian users who want gold in their vault |

**PWA → Plugin funnel:** Start with the PWA. When your archive grows and you want gold woven into your vault, export your data and import it into the plugin.

**An entryway to the PureLand method.** Alchemy is the practice companion for the [PureLand fork kit](https://github.com/risaac09/pureland-fork-kit): its capture loop rehearses the noticing that Attend, the second step of the [method](https://github.com/risaac09/pureland-fork-kit/blob/main/METHOD.md), asks for. The first-run screen says so, the footer links there, and a loop strip in the reflect and gold views keeps a newcomer oriented. It is a tool with deliberate constraints, not a validated instrument.

---

## Design principles

- **No accounts, no servers, no analytics.** Everything stays in localStorage (PWA) or `data.json` (plugin).
- **Constraints are the product.** The 7-item cap and the decay enforce finitude; they are not bugs and do not get a way around. The settle and the somatic check are friction the user crosses on purpose, not delays the app imposes.
- **Friction by choice.** The mechanics stay effortless; the friction lives at the moment the person chooses. The settle and the body check are the threshold they cross on purpose, not a shortcut removed.
- **Wabi-sabi, not SaaS.** Warm bark tones, worn field notebook aesthetic. No gradients, no streaks, no badges.
- **Free forever.** Alchemy absorbs The Metabolizer ($29 Gumroad vault). Same philosophy, two surfaces, no paywall.

See [HONEST-ACCOUNT.md](HONEST-ACCOUNT.md) for what the tool claims, what it does not, and where it fails. Alchemy is exhibit one of the constructive register of the Third Information Lab: a tool built to hold the organism-pole instead of extracting it.

---

## Metabolizer → Alchemy

The Metabolizer was a $29 Obsidian vault. Alchemy absorbs it. Everything that made the Metabolizer work is here:

- **Somatic pulse** — one-word body check before reflection (from Metabolizer's Body Vocabulary)
- **5 Maps** — Observation / Question / Connection / Tension / Practice
- **Weekly Threshold** — "What shifted?" prompt in the Log view
- **Friction Log** — one-line meta-practice for catching avoidance
- **Decay review** — conscious weekly review of about-to-dissolve items

If you bought The Metabolizer: your $29 bought you the concept. Alchemy is the concept, executed better, free.

---

## Install

**PWA:** [alchemy.rubinsteinproductions.com](https://alchemy.rubinsteinproductions.com/) — open and add to home screen.

**Obsidian Plugin:** Community Plugins → search "Alchemy" → Install → Enable. Or manually:
```bash
cd your-vault/.obsidian/plugins
mkdir alchemy && cd alchemy
# Copy main.js + manifest.json + styles.css from obsidian-plugin/
```

**Bookmarklet:** Found in the Log tab — captures selected text + URL from any page.

---

## Development

No build step for the PWA. Edit files directly and push.

```
index.html     — DOM structure
app.css        — All styles, one design system (~2050 lines)
app.js         — All logic, single IIFE (~2760 lines)
sw.js          — Service worker, cache-first
test.js        — jsdom test suite (`node test.js` reports the count)
obsidian-plugin/
  main.ts      — Plugin class + AlchemyView + settings tab
  styles.css   — Scoped plugin styles
  esbuild.config.mjs
```

**Run tests:** `node test.js` (requires `npm i jsdom`)

**Build plugin:**
```bash
cd obsidian-plugin
npm install
node esbuild.config.mjs production
```

**Deploy PWA:** push to `main` — GitHub Pages auto-deploys.
Service worker cache version lives in `sw.js` (currently `alchemy-v16`) — bump on breaking changes.

## Contributing

Forks welcome. Pull requests are generally not reviewed: this is a personal tool with deliberate constraints (the 7-item cap, the settle timer, the decay), so fork it and make it yours.

What does travel back: corrections and field reports. If you tested Alchemy against your own practice, or ran it through the [PureLand method](https://github.com/risaac09/pureland-fork-kit/blob/main/METHOD.md), [open an issue](https://github.com/risaac09/alchemy/issues) with what worked, what failed, and what it cost you. The kit's [field-test form](https://github.com/risaac09/pureland-fork-kit/blob/main/templates/field-test.md) is a good shape for it. A failure report is worth more than praise. No support is promised; see [HONEST-ACCOUNT.md](HONEST-ACCOUNT.md).

## License

MIT, see `LICENSE`.
