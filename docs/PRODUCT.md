# alchemy

Alchemy is a free, account-less PWA for information metabolism: capture an item, let it settle, check the body, reflect, then keep or release it. It ships from this public repo to alchemy.rubinsteinproductions.com via GitHub Pages, with an Obsidian plugin, a Chrome extension, an iOS wrapper, and an embeddable diagnostic funnel alongside. In the estate it is a public product repo with no tier; the spine is stack-data, Tier 1, the operational source of truth, a sibling clone (`../stack-data`). It absorbed The Metabolizer and the standalone alchemy-diagnostic repo on 2026-06-22, and it stands as one of two exhibits in the Third Information Lab's constructive register (`HONEST-ACCOUNT.md`).

## What it is (technical)

`CLAUDE.md` holds the architecture map: `index.html` + `app.js` (single IIFE, no build), `app.css`, `sw.js`, `embed-funnel.js`, the state shapes, the constants table, the view state machine, and the embed postMessage contract. Read it before touching anything. What that map omits is the full surface inventory, so it lives here:

| Surface | Where | Build | Version |
|---|---|---|---|
| PWA | `index.html` + `app.js`, GH Pages, CNAME `alchemy.rubinsteinproductions.com` | none | 1.4.0 (`app.js` line 7, `package.json`) |
| Embed funnel | `embed.html` + `embed-funnel.js`, iframed on rubinsteinproductions.com/services | none | rides the PWA |
| Obsidian plugin | `obsidian-plugin/` (TypeScript) | esbuild | 1.2.0 (`obsidian-plugin/manifest.json`) |
| Chrome extension | `chrome-extension/` (MV3 popup capture, `popup.html` + `popup.js`) | none | 1.2.0 (`chrome-extension/manifest.json`) |
| iOS wrapper | `ios/` (WKWebView, xcodegen), see `ios/README.md` | Xcode | per `ios/README.md` |
| Bookmarklet | served from the Log tab (README) | none | rides the PWA |

The canonical live URL is alchemy.rubinsteinproductions.com (the `CNAME` file). CLAUDE.md, README.md, and the deploy commands still cite the github.io URL; see Known drift.

Anyone editing `app.js` should know two consumers beyond the PWA read those files: the iOS wrapper copies web files at build time (`ios/README.md`), and `/sync-v2` regenerates a standalone single-file build from the same source.

Gap: `chrome-extension/` has no documentation anywhere beyond its own manifest, which declares activeTab, scripting, and storage permissions plus an Alt+Shift+A shortcut. A short doc would come from reading `popup.js` and the manifest.

## How it runs (operational)

Deployment is push to `main`, GitHub Pages auto-deploys. Any change to cached assets requires a `CACHE_NAME` bump in `sw.js` (currently `alchemy-v14`) and feature additions bump `VERSION` in `app.js`. The full checklist is `.claude/commands/deploy.md`; rollback is `.claude/commands/rollback.md`. Tests: `node test.js` (jsdom required), plus the 12-flow manual browser checklist in `CLAUDE.md`. Plugin build: `cd obsidian-plugin && npm install && node esbuild.config.mjs production`, then hand-copy the outputs into a vault. iOS setup and App Store distribution: `ios/README.md`. Local serve: `python3 -m http.server 3400` (`.claude/launch.json`).

There is no CI. No `.github/workflows`, no git hooks. The test suite runs when someone remembers, and the `/deploy` SOP does not include it.

Gap: whether Isaac wants a test-on-push Actions workflow or prefers the manual gate is undecided and recorded nowhere.
Gap: no packaging or publish runbook exists for the Chrome extension (load-unpacked vs Web Store), and no release process or community-plugin submission status is recorded for `obsidian-plugin/`. README claims the plugin is findable under Community Plugins; the actual submission state is unverified.

## Why it exists (intellectual)

`HONEST-ACCOUNT.md` carries the claim (tools built around human finitude), the enumerated failures, and Alchemy's place in the Third Information Lab's constructive register, paired with material-and-meaning's ai-lab. `README.md` holds the Metabolizer lineage ("your $29 bought you the concept") and the design philosophy. `INTEGRATION-PLAN.md` records the three-repo merge and the assess-versus-practice insight, though it is stale as a status doc. Nothing needs restating here; those three files are the record.

Gap: `CLAUDE.md` cites the rubric as "Adapted from methodology/evaluation-framework.md", a path that resolves nowhere in this repo and to no named sibling. Isaac knows where that framework lives; the citation needs a real path or removal.

## How it works (methodological)

The method is the product: the capture-to-release loop, the thermodynamic constants (7-item cap, 72h decay, 30s settle, 4h link cooling, 90d compost), and the binding Design Principles (anti-slop, intentional friction, finitude, no external services, wabi-sabi) all live in `CLAUDE.md`. `HONEST-ACCOUNT.md` states what each mechanic claims and where it fails. Prompt-writing method and microcopy voice rules are `.claude/commands/add-prompt.md`. One nuance the constants table hides: `app.js` declares `MAX_CAPACITY` and the resurface interval as mutable `let`s over `BASE_` constants, tuned reactively by diagnostic results, and that tuning behavior is documented nowhere else.

## How it speaks (marketing and comms)

Positioning lives in `README.md`: a digital liver for information, free forever, no accounts, with the Metabolizer-buyer message and the PWA-to-plugin path. The App Store angle (Privacy Nutrition Label, "slowness is the point") is `ios/README.md`. The funnel: `embed.html` on rubinsteinproductions.com/services loads `embed-funnel.js`, which adds a name field, an email gate between question 12 and the report, and a mailto booking CTA. The host page owns lead capture through postMessage; the app never stores or sends the email. A host page must listen for five message types: `started`, `email`, `complete`, `height`, `diagnostic-complete` (payload shapes in `CLAUDE.md`). The hard rule from 2026-06-22: the free PWA loads `app.js` only, and no sales or lead-capture code enters it.

## Where it goes (strategic)

Alchemy sits outside the tiered data hierarchy: a public product, not a data store, reading nothing from stack-data's index. Unlike the toolkit's ten phase-zero consuming repos, it carries no Routing section and no deployed phase-zero kit; its `.claude/` directory is a bespoke local kit (agents, commands, loops, launch config), which this repo treats as deployed and never edits in place.

Gap: whether alchemy's exclusion from the phase-zero consumer list is deliberate is recorded nowhere; Isaac decides, and the answer belongs in the toolkit's consuming-repos list or here.

Open decisions, none resolved by this doc:
- Correct the stack-data registry: `r-alchemy` says "Superseded by the-metabolizer", `r-the-metabolizer` says active. Reality inverted on 2026-06-22. Downstream consumers of that correction, per the stack-data merge ritual: `dist/index.json` and the PWAs that read it, weekly-sync, royal-metrics, saywhy-app, second-brain-v2.
- Archive the standalone alchemy-diagnostic GitHub repo (`CLAUDE.md` and `INTEGRATION-PLAN.md` both call for it; `r-alchemy-diagnostic` still sits live in the registry).
- The Metabolizer Gumroad listing: the "Alchemy Vault" rebrand question from `INTEGRATION-PLAN.md` stands undecided.
- License: `package.json` says ISC, `INTEGRATION-PLAN.md` says "Already MIT", and no LICENSE file exists at the root.
- Mark `INTEGRATION-PLAN.md` as historical so it stops reading as current status.

Gap: App Store submission state for the iOS wrapper is recorded nowhere; the runbook exists in `ios/README.md` but not the status.

## Workflows

Automated:
- GitHub Pages deploy. Trigger: push to `main`. Publishes the repo root to alchemy.rubinsteinproductions.com. No secrets.
- Service worker (`sw.js`, `CACHE_NAME` `alchemy-v14`). Trigger: page load. Cache-first for the app shell and Google Fonts. Invalidation is manual, by version bump.
- Nothing else. No Actions workflows, no cron, no git hooks, no CI test run.

Manual (all run by Isaac or a session he directs):
- `/deploy` (`.claude/commands/deploy.md`): syntax-check JS and manifest, bump `CACHE_NAME` if cached assets changed, bump `VERSION` for features, commit, push, verify Pages via `gh api repos/risaac09/alchemy/pages`. Good looks like a green Pages build and the new version live. The SOP does not run `node test.js`; running it first anyway is the honest move.
- `/rollback` (`.claude/commands/rollback.md`): git revert, bump cache version, push, curl-verify `sw.js`.
- `/review` and `/weekly-review` (`.claude/commands/`): design-principle and health audits; weekly-review files a GitHub issue with findings.
- `/sync-v2` (`.claude/commands/sync-v2.md`): regenerate the standalone `~/alchemy-v2.html` build from PWA source, one-way, PWA authoritative.
- `/add-prompt` (`.claude/commands/add-prompt.md`): add a reflection prompt to `promptPools` under the voice rules.
- Tests: `node test.js` (or `npm test`, needs `npm i jsdom`), then the 12 manual browser flows in `CLAUDE.md`. Good looks like zero failed assertions and all 12 flows clean.
- Obsidian plugin build and hand-install, iOS xcodegen-and-archive flow, local dev server: paths and commands in the operational section above.
- `/loop` rituals, user-initiated: `deploy-watch` every 10m (uncommitted-change reminder) and `health-check` every 30m (`.claude/loops/`).

## Known drift

Listed for Isaac to rule on; nothing here is fixed by this doc.

- stack-data registry inverted: `data/repos.json` `r-alchemy` reads "Superseded by the-metabolizer.", status parked; `r-the-metabolizer` reads active, "Evolution of alchemy". The absorption ran the other way on 2026-06-22, and alchemy is live at 1.4.0. `data/graph.json` `g-repo-the-metabolizer` carries the same stale entity. Registry syncedAt 2026-06-16 predates the merge.
- stack-data `r-alchemy-diagnostic` still lives as an un-archived entry though the repo is redundant since the consolidation.
- Live URL: `CNAME` is alchemy.rubinsteinproductions.com, but `CLAUDE.md`, `README.md`, `deploy.md`, and `rollback.md` all cite the github.io URL.
- `README.md` staleness: cache version cited as alchemy-v7 (actual v14), 142 assertions (actual ~197 to 199), app.css/app.js line counts low by roughly 500 lines each.
- The `CLAUDE.md` Core Mechanics heading says v1.3.0 while the shipped version is 1.4.0; whatever 1.4.0 added is undocumented (derivable from git log).
- `CLAUDE.md` state section omits `thresholds`, `frictionLog`, `firstOpenDate`, `lastActiveDate` keys that `loadState` initializes; its constants table hides the diagnostic-reactive tuning noted above.
- `INTEGRATION-PLAN.md`: header date 2026-04-22 conflicts with the 2026-06-22 merge it describes, its Status section still says the diagnostic "Needs integration", and its "License. Already MIT." line conflicts with `package.json` ISC.
- `.claude/agents/obsidian-plugin.md` describes the plugin conversion as a future task; `obsidian-plugin/` already ships.
- `.claude/loops/deploy-watch.md` hardcodes `/Users/isaacrubinstein/alchemy`, wrong on any other node.
- The `methodology/evaluation-framework.md` rubric citation in `CLAUDE.md` resolves to no path anywhere.
