# Alchemy Integration Plan

**STATUS: COMPLETE (kept as history).** The diagnostic merged into alchemy as the Diag view in v1.3.0, and the embed funnel split out as `embed-funnel.js` on 2026-06-22. The standalone alchemy-diagnostic repo is archived. Nothing below is pending work; see CLAUDE.md for the current architecture.

Generated 2026-04-22. Covers merging alchemy, alchemy-diagnostic, and the-metabolizer.

## Status

**The Metabolizer → Alchemy: Already done.** Per CLAUDE.md, Alchemy v1.2.0 absorbed The Metabolizer's core concepts: somatic pulse, 5 map types, weekly threshold, friction log, decay mechanics. The vault product (archived to `02 Practice/04 Rubinstein Productions/the-metabolizer/`) is the Obsidian-native expression of the same philosophy. No further code merge needed — the concepts live in `app.js`.

**Alchemy Diagnostic → Alchemy: Needs integration.** The diagnostic is a standalone PWA at `~/alchemy-diagnostic/` with its own index.html, app.js, app.css, manifest.json. It's also embedded via iframe at `rubinsteinproductions.com/services`. The merge should bring it into the alchemy codebase as a view/mode.

## Feature Inventory

### Alchemy (app.js, ~2,039 lines)
- Cassette-tape UI with thermodynamic metaphor
- 7-item finite inbox with 72h decay
- 30s settle period before reflection
- 4h link cooling period
- Somatic pulse (body check) on reflection
- Gold/transmutation/release cycle
- 5 map types (observation, question, connection, tension, practice)
- Archive with 90-day decay and 3-day resurfacing
- Weekly threshold entries
- Friction log (meta-practice)
- Activity sparkline (7-day)
- Bulk archive release with undo
- Export/import JSON
- Obsidian plugin (`/obsidian-plugin/`)
- 36 tests, 142 assertions (`test.js`)

### Alchemy Diagnostic (app.js, separate repo)
- 12-question assessment across 4 axes (intake, transformation, expression, return flow)
- 2×2 placement map (volume × circulation): Stagnant / Drowning / Distilling / Thriving
- Four-axis radar chart (hand-rolled SVG, no libraries)
- Rule-based key findings (3-5 bullets)
- Practice recommendations mapped to user shape
- Embed mode via `embed.html` with postMessage API
- Standalone mode via `index.html`
- Already embedded on rubinsteinproductions.com services page

### The Metabolizer (Obsidian vault, archived)
- Intake → Daily Practice → Decay Review → Maps → Threshold cycle
- Body Vocabulary word-finding tool
- Philosophy document
- Templates: Daily Metabolization, Intake Item, Threshold Entry
- Onboarding: 7-day sequence (self-destructing)
- Gumroad product listing

## Overlapping Functionality

| Concept | Alchemy | Diagnostic | Metabolizer |
|---------|---------|-----------|-------------|
| Intake regulation | 7-item cap, decay | Q1-Q3 assess it | Antechamber, 7-item limit |
| Transformation | Reflect → Alchemize | Q4-Q6 assess it | Daily Metabolization |
| Expression/output | Maps, gold | Q7-Q9 assess it | Maps (same 5 types) |
| Return flow | Resurfacing, threshold | Q10-Q12 assess it | Decay Review, Threshold |
| Somatic awareness | Somatic pulse | Not assessed | Body check in daily practice |
| Body vocabulary | Not present | Not present | System/Body Vocabulary.md |

**Key insight:** The diagnostic ASSESSES what alchemy PRACTICES. They're not competing — they're two modes of the same product.

## Merge Strategy

### Architecture: Add Diagnostic as a View

Alchemy currently has 5 views: Inbox, Reflect, Gold, Archive, Log. Add a 6th: **Diagnostic**.

```
Views: Inbox | Reflect | Gold | Archive | Log | Diagnostic
                                                    ↓
                                          12 questions → report
                                          Scores stored in state
                                          Recommendations link to practices
```

### Implementation Steps (ordered)

**Step 1: Absorb diagnostic code into alchemy**
- Copy the `QUESTIONS` array and scoring model from `alchemy-diagnostic/app.js` into `alchemy/app.js`
- Copy the SVG rendering functions (radar chart, 2×2 map) into `app.js`
- Copy diagnostic-specific CSS from `alchemy-diagnostic/app.css` into `alchemy/app.css`
- Add a `diagnostic` view to the view router in `showView()`
- Add diagnostic HTML structure to `index.html`

**Step 2: Wire diagnostic results to alchemy state**
- Store diagnostic scores in the existing `state` object under a new `diagnostic` key
- Show the user's quadrant placement in the Log view alongside sparkline
- Use diagnostic recommendations to customize alchemy's behavior (e.g., if intake score is low, reduce `MAX_CAPACITY` to 5; if return flow is low, increase `RESURFACE_INTERVAL_MS`)

**Step 3: Preserve embed mode**
- Keep `embed.html` in the alchemy repo, pointing at the diagnostic view
- Maintain the postMessage API contract so the rubinsteinproductions.com embed continues working
- Update the embed on the RP website to point to `alchemy.rubinsteinproductions.com/embed.html`

**Step 4: Absorb Body Vocabulary from The Metabolizer**
- The somatic pulse in alchemy asks for a one-word body check but provides no vocabulary support
- Port `System/Body Vocabulary.md` content into the Reflect view as an expandable helper

**Step 5: Update tests**
- Port any diagnostic-specific test logic
- Add test coverage for: diagnostic scoring, quadrant placement, state persistence of diagnostic results, embed postMessage contract

**Step 6: Update Obsidian plugin**
- If diagnostic scores are in state, the plugin could write a periodic "metabolism snapshot" note to the vault with scores and trends

## GitHub Readiness

### Before pushing the unified repo:

1. **Clean git history.** The alchemy repo already has clean history. Merge diagnostic code as a single commit: "feat: integrate Information Metabolism Diagnostic as view"

2. **Update README.md.** Add Diagnostic section to the existing README. Document the 6th view, the scoring model, and the embed contract.

3. **Update CLAUDE.md.** Add diagnostic architecture notes, design tokens, and hard rules from the diagnostic's CLAUDE.md.

4. **.gitignore audit.** Current .gitignore covers node_modules. Verify no `.DS_Store`, no `.env`, no editor configs leak.

5. **License.** Already MIT. No change needed.

6. **CNAME.** Already set to `alchemy.rubinsteinproductions.com`. No change.

7. **Service worker.** Bump cache version in `sw.js` to force refresh after diagnostic merge.

### For alchemy-diagnostic repo:
- Archive the repo on GitHub (Settings → Archive)
- Add a note to its README: "Merged into [alchemy](https://github.com/risaac09/alchemy). This repo is archived."
- Do NOT delete — preserve git history

## Post-Merge: What About The Metabolizer?

The Metabolizer as an Obsidian vault product could become **Mode 3** of alchemy:

- **Mode 1:** Daily metabolism tool (PWA, current alchemy)
- **Mode 2:** Diagnostic assessment (merged from alchemy-diagnostic)
- **Mode 3:** Vault practice (The Metabolizer vault, sold on Gumroad)

The three modes share philosophy and vocabulary but serve different contexts: browser, assessment, Obsidian. The Obsidian plugin in alchemy already bridges Mode 1 → vault. The Metabolizer vault IS Mode 3, just branded differently.

Consider: rebrand The Metabolizer as "Alchemy Vault" on Gumroad. Same product, unified brand.
