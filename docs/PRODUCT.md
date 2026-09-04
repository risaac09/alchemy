# alchemy

Alchemy is a free, account-less PWA for information metabolism: capture an item, let it settle, check the body, reflect, then keep or release it. It ships from this public repo to alchemy.rubinsteinproductions.com via GitHub Pages, with an Obsidian plugin, a Chrome extension, an iOS wrapper, and an embeddable diagnostic funnel alongside. In the estate it is a public product repo with no tier; the spine is stack-data, Tier 1, the operational source of truth, a sibling clone (`../stack-data`). It absorbed The Metabolizer and the standalone alchemy-diagnostic repo on 2026-06-22, and it stands as one of two exhibits in the Third Information Lab's constructive register (`HONEST-ACCOUNT.md`).

## What it is (technical)

`CLAUDE.md` holds the architecture map: `index.html` + `app.js` (single IIFE, no build), `app.css`, `sw.js`, `embed-funnel.js`. Constants, state shapes, and the view state machine live in `app.js` as named values near the top, with `test.js` as the executable spec; the embed postMessage contract is documented in `embed-funnel.js`. Read those before touching anything. What CLAUDE.md omits is the full surface inventory, so it lives here:

| Surface | Where | Build | Version |
|---|---|---|---|
| PWA | `index.html` + `app.js`, GH Pages, CNAME `alchemy.rubinsteinproductions.com` | none | 1.5.0 (`app.js` line 7, `package.json`) |
| Embed funnel | `embed.html` + `embed-funnel.js`, iframed on rubinsteinproductions.com/services | none | rides the PWA |
| Obsidian plugin | `obsidian-plugin/` (TypeScript) | esbuild | 1.2.0 (`obsidian-plugin/manifest.json`) |
| Chrome extension | `chrome-extension/` (MV3 popup capture, `popup.html` + `popup.js`) | none | 1.2.0 (`chrome-extension/manifest.json`) |
| iOS wrapper | `ios/` (WKWebView, xcodegen), see `ios/README.md` | Xcode | per `ios/README.md` |
| Bookmarklet | served from the Log tab (README) | none | rides the PWA |

The canonical live URL is alchemy.rubinsteinproductions.com (the `CNAME` file); CLAUDE.md, README.md, and the deploy commands cite it.

Anyone editing `app.js` should know two consumers beyond the PWA read those files: the iOS wrapper copies web files at build time (`ios/README.md`), and `/sync-v2` regenerates a standalone single-file build from the same source.

Gap: `chrome-extension/` has no documentation anywhere beyond its own manifest, which declares activeTab, scripting, and storage permissions plus an Alt+Shift+A shortcut. A short doc would come from reading `popup.js` and the manifest.

## How it runs (operational)

Deployment is push to `main`, GitHub Pages auto-deploys. Any change to cached assets requires a `CACHE_NAME` bump in `sw.js` (currently `alchemy-v15`) and feature additions bump `VERSION` in `app.js`. The full checklist is `.claude/commands/deploy.md`; rollback is `.claude/commands/rollback.md`. Tests: `node test.js` (jsdom required), plus the four browser-only checks in `CLAUDE.md`'s Testing section. Plugin build: `cd obsidian-plugin && npm install && node esbuild.config.mjs production`, then hand-copy the outputs into a vault. iOS setup and App Store distribution: `ios/README.md`. Local serve: `python3 -m http.server 3400` (`.claude/launch.json`).

CI exists for one surface. `.github/workflows/embodied-verify.yml` runs the deterministic safety floor on every push or PR touching `embodied-service/`: `node --check` over the worker modules, then the verification harness `embodied-service/verify/verify.mjs`. The Worker deploy job is gated behind that verify, fires only on manual `workflow_dispatch`, and skips itself when the `CLOUDFLARE_API_TOKEN` secret is absent. The PWA has no CI and no git hooks; `node test.js` runs when someone remembers, and the `/deploy` SOP does not include it.

Gap: whether Isaac wants a test-on-push Actions workflow for the PWA suite or prefers the manual gate is undecided and recorded nowhere.
Gap: no packaging or publish runbook exists for the Chrome extension (load-unpacked vs Web Store), and no release process or community-plugin submission status is recorded for `obsidian-plugin/`. README claims the plugin is findable under Community Plugins; the actual submission state is unverified.

## Why it exists (intellectual)

`HONEST-ACCOUNT.md` carries the claim (tools built around human finitude), the enumerated failures, and Alchemy's place in the Third Information Lab's constructive register, paired with the embodied-AI experiment (`material-and-meaning-institute/third-information-lab`, with its runtime in this repo's `embodied-service/`). `README.md` holds the Metabolizer lineage ("your $29 bought you the concept") and the design philosophy. `INTEGRATION-PLAN.md` records the three-repo merge and the assess-versus-practice insight, marked complete and kept as history. Nothing needs restating here; those three files are the record.

## How it works (methodological)

The method is the product: the capture-to-release loop and the thermodynamic constants (7-item cap, 72h decay, 30s settle, 4h link cooling, 90d compost) live in `app.js` as named values near the top, and the binding Design Principles (anti-slop, intentional friction, finitude, no external services in the PWA, wabi-sabi) live in `CLAUDE.md`. `HONEST-ACCOUNT.md` states what each mechanic claims and where it fails. Prompt-writing method and microcopy voice rules are `.claude/commands/add-prompt.md`. One nuance the named constants hide: `app.js` declares `MAX_CAPACITY` and the resurface interval as mutable `let`s over `BASE_` constants, tuned reactively by diagnostic results, and that tuning behavior is documented nowhere else.

## How it speaks (marketing and comms)

Positioning lives in `README.md`: a digital liver for information, free forever, no accounts, with the Metabolizer-buyer message and the PWA-to-plugin path. The App Store angle (Privacy Nutrition Label, "slowness is the point") is `ios/README.md`. The funnel: `embed.html` on rubinsteinproductions.com/services loads `embed-funnel.js`, which adds a name field, an email gate between question 12 and the report, and a mailto booking CTA. The host page owns lead capture through postMessage; the app never stores or sends the email. A host page must listen for five message types: `started`, `email`, `complete`, `height`, `diagnostic-complete` (payload shapes in `embed-funnel.js`). The hard rule from 2026-06-22: the free PWA loads `app.js` only, and no sales or lead-capture code enters it.

## Where it goes (strategic)

Alchemy sits outside the tiered data hierarchy: a public product, not a data store, reading nothing from stack-data's index. It is one of the toolkit's phase-zero consuming repos: the deployed kit (the hooks, `phase-zero.md`, `model-routing.md`, `operating-brief.md`, `retrospective.md`, `settings.json`) lives in `.claude/` next to the repo's own bespoke pieces (agents, commands, loops, launch config). Kit files get edited in the toolkit source and redeployed, never in place.

Decided 2026-09-04, the front door: the free PWA carries no ask. No invitation to share results, no conversation offer, no paid door, beyond the footer links to the PureLand journey, the honest account, and the source. Alchemy is the landing and the companion (JOURNEY.md's introductory "walking it on your own ecosystem" section, rehearsing station 2); the ask lives farther down the journey, at station 6 (Return), where the field-test template already sits. When it is placed there its shape is: free first pass (Isaac reads the exported report and the person's own words, one reply, one conversation), the paid PureLand Field Pilot door opening only inside that exchange; inbound folded into FT-001's record as a second route under the same harm hypothesis (triage burden, implied support expectation), same window closing 2026-11-22. Nothing in `app.js` changes for this; the 2026-06-22 guardrail holds.

Open decisions, none resolved by this doc:
- The Metabolizer Gumroad listing: the "Alchemy Vault" rebrand question from `INTEGRATION-PLAN.md` stands undecided.

Gap: App Store submission state for the iOS wrapper is recorded nowhere; the runbook exists in `ios/README.md` but not the status.

## Workflows

Automated:
- GitHub Pages deploy. Trigger: push to `main`. Publishes the repo root to alchemy.rubinsteinproductions.com. No secrets.
- Service worker (`sw.js`, `CACHE_NAME` `alchemy-v15`). Trigger: page load. Cache-first for the app shell and Google Fonts. Invalidation is manual, by version bump.
- `embodied-verify.yml` (Actions). Trigger: push or PR touching `embodied-service/`. Runs the safety floor (syntax checks plus the verification harness); the gated Worker deploy job runs only on manual dispatch with the `CLOUDFLARE_API_TOKEN` secret set. No secrets needed for the verify itself.
- Nothing else. No cron, no git hooks, no CI run of the PWA test suite.

Manual (all run by Isaac or a session he directs):
- `/deploy` (`.claude/commands/deploy.md`): syntax-check JS and manifest, bump `CACHE_NAME` if cached assets changed, bump `VERSION` for features, commit, push, verify Pages via `gh api repos/risaac09/alchemy/pages`. Good looks like a green Pages build and the new version live. The SOP does not run `node test.js`; running it first anyway is the honest move.
- `/rollback` (`.claude/commands/rollback.md`): git revert, bump cache version, push, curl-verify `sw.js`.
- `/review` and `/weekly-review` (`.claude/commands/`): design-principle and health audits; weekly-review files a GitHub issue with findings.
- `/sync-v2` (`.claude/commands/sync-v2.md`): regenerate the standalone `~/alchemy-v2.html` build from PWA source, one-way, PWA authoritative.
- `/add-prompt` (`.claude/commands/add-prompt.md`): add a reflection prompt to `promptPools` under the voice rules.
- Tests: `node test.js` (or `npm test`, needs `npm i jsdom`), then the four browser-only checks in `CLAUDE.md`. Good looks like zero failed assertions and all four checks clean.
- Obsidian plugin build and hand-install, iOS xcodegen-and-archive flow, local dev server: paths and commands in the operational section above.
- `/loop` rituals, user-initiated: `deploy-watch` every 10m (uncommitted-change reminder) and `health-check` every 30m (`.claude/loops/`).

## Known drift

Listed for Isaac to rule on; nothing here is fixed by this doc.

- `.claude/loops/deploy-watch.md` hardcodes `/Users/isaacrubinstein/alchemy`, wrong on any other node.
