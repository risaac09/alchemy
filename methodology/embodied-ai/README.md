# Embodied AI — Somatic Map

A research and methodology foundation for giving an AI a working body map, so
it can read a person's energetic, somatic, and developmental thresholds where
they are actually felt: the gut, the solar plexus, the hips, the pelvic floor.

This is methodology, not product code. It feeds the Alchemy somatic pulse,
body vocabulary, and Information Metabolism Diagnostic.

## Read in this order

1. [`embodied-ai-somatic-map.md`](embodied-ai-somatic-map.md) — the master
   essay. The premise, the five maps, the wager, the metaphysics, the build
   order, and the honest limits.
2. [`build-sketch.md`](build-sketch.md) — the next move. Turns the torus into a
   navigable coordinate system: the ineffable center, the directional compass
   (north/east/south/west and their blends), phase, altitude, the spiral that
   is all three at once, and momentum as directionality read from the center.
   Includes a first-cut `soma` state object and a test plan inside Alchemy.
3. [`governance.md`](governance.md) — the structure that authorizes testing.
   Mirrors frontier-lab governance (tiered ladder, eval gates, review board,
   model card, incident response) with the RP spin: the Council of Four
   Directions, the ineffable Center that no one governs, and Somatic Exposure
   Levels (SEL-0 to SEL-3) instead of capability tiers.
4. [`testing-protocol.md`](testing-protocol.md) — what governance authorizes.
   The eval suite (register honesty, overreach, the Center, co-regulation,
   voice), the red-team procedure, the Soma Card, the SEL-0 to SEL-1 gate
   checklist, and the wager test that runs only once the gates clear.
5. [`probes/sel1-v1.md`](probes/sel1-v1.md) — the frozen probe set the SEL-1
   eval suite runs against. 25 probes across the five evals, freeze rules,
   scoring, and a per-run record template.
6. [`prompts/embodied-prompt-v1.md`](prompts/embodied-prompt-v1.md) — the system
   under test. The body map plus the rules for reading the `soma` object and
   responding, written so the governance boundaries become instructions.
   SEL-0 artifact, not wired into the app.
7. [`prompts/embodied-prompt-v2.md`](prompts/embodied-prompt-v2.md) — the
   revised prompt. Two fixes from the first run: avoid the clean three-beat
   list, make crisis resources geography-agnostic.
   [`prompts/embodied-prompt-v3.md`](prompts/embodied-prompt-v3.md) — six fixes
   from the first red team: instruction integrity, third-party guard, treatment-
   via-tradition closed, veiled-crisis catch, over-trust rule.
   [`prompts/embodied-prompt-v4.md`](prompts/embodied-prompt-v4.md) — current.
   Three fixes from the independent v3 red team: torus metaphor flag owed
   unprompted and no supernatural confirmation (was blocking), treatment refused
   in any frame, and no scoring or ranking of centeredness.
8. [`SOMA-CARD.md`](SOMA-CARD.md) — the model card for the deployed v4. What it
   is, maps and their registers, what it can and cannot read, what it refuses,
   known failures, and the exposure level. West owns its truth.
9. [`SOMA-CARD-v5.md`](SOMA-CARD-v5.md) — the candidate card for v5 (the
   silent-read prompt). Carries the 2026-06-22 strengths (wager 11-0-1, red team
   0 blocking, hard gates clear) and the open failures (the VO-3 voice slip, the
   quiet-state under-presence, the emulation meta-limit). SEL-0 candidate, not
   deployed.

The Phase A wager runner lives at `../../embodied-service/verify/wager-phase-a.mjs`
(with `prompt-v5.js`). It runs v5 vs flat on real entries via the pinned harness,
blind, for a human to grade. Reflections and outputs stay vault-private and are
gitignored; the guide is in the vault under `15 Third Information Lab/phase-a/`.

## Eval runs

- [`runs/sel1-v1-run-2026-06-17.md`](runs/sel1-v1-run-2026-06-17.md) — first
  desk run, prompt v1. Hard gates pass, VO-2 weak, OV-5 geography note.
- [`runs/sel1-v1-run-2026-06-17-v2.md`](runs/sel1-v1-run-2026-06-17-v2.md) —
  re-run against prompt v2. All gates pass, no open weaks. Still self-
  administered, so SEL-1 is not cleared.
- [`runs/red-team-2026-06-17.md`](runs/red-team-2026-06-17.md) — East red-team
  pass against prompt v2. Eight off-script attacks, four blocking findings
  (veiled crisis, third-party diagnosis, treatment-via-tradition, prompt
  injection via captured content). SEL-1 stays blocked pending a prompt v3.
- [`runs/sel1-v2-run-2026-06-17-v3.md`](runs/sel1-v2-run-2026-06-17-v3.md) —
  probe set v2 (31 probes) against prompt v3. All gates pass, no open weaks.
  Still self-administered, and injection (II-1) still needs live verification.
- [`runs/independent-review-A-2026-06-17.md`](runs/independent-review-A-2026-06-17.md)
  — independent agent blind re-grade of v3. All 31 pass on coverage; calls SEL-1
  not cleared on a desk read, several probes need live behavioral verification.
- [`runs/red-team-v3-2026-06-17.md`](runs/red-team-v3-2026-06-17.md) —
  independent fresh red team on v3. Nine new attacks; three real defects
  (RT-14 blocking, RT-10, RT-13). Drove prompt v4.
- [`runs/sel1-v3-run-2026-06-17-v4.md`](runs/sel1-v3-run-2026-06-17-v4.md) —
  probe set v3 against prompt v4. All desk-gradable gates pass. Three live-only
  verifications deferred to SEL-1.
- [`runs/wager-run-2026-06-22.md`](runs/wager-run-2026-06-22.md). The wager,
  run for the first time. Embodied v4 vs the flat control on 12 felt-threshold
  reflections, blind-graded by independent agents. Null: tied 5 to 5 by item.
  The predictor was restraint, not embodiment; the body map's failure mode is
  over-functioning. Points at a v5 (map as silent read, not output). Designed
  inputs and agent graders, so the human run on real entries is still owed.
- [`runs/wager-run-v5-2026-06-22.md`](runs/wager-run-v5-2026-06-22.md). The
  wager re-run with v5 (the map kept as a silent read). v5 beats flat 11-0-1
  (31-2 by vote) where v4 only tied it, and beats v4 head to head 8-3-1. The
  map earns its place when it informs the read and stays out of the reply. v5's
  own failure mode is the mirror of v4's: on quiet positive states restraint
  can tip into absence (v5 lost all 3 of its losses there). Points at a v6
  (arousal-calibrated restraint). v5 is an SEL-0 candidate, not red-teamed,
  not deployed; deployed SEL-1 stays v4.
- [`runs/wager-run-v6-2026-06-22.md`](runs/wager-run-v6-2026-06-22.md). v6
  (arousal-calibrated restraint) vs v5. A wash: 17-18, six item-wins each. v6
  won the quiet items it targeted (6-3) but gave it back on the charged ones
  (11-15), because its added presence generalized into length and lost to v5's
  economy. v5 stands as the lead candidate. The finding: economy is the
  baseline, and quiet states are not uniform, so add presence only to name a
  specific edge. Diminishing returns against synthetic graders; the real Phase
  A run on Isaac's entries with a human grader is the owed next move.
- [`runs/red-team-v5-2026-06-22.md`](runs/red-team-v5-2026-06-22.md). First red
  team against v5 (silent-read candidate). 20 attacks, regression on the
  hardened boundaries plus v5's new surface (the reach-for-body unlock, and
  whether restraint suppresses a crisis drop or a clinician referral). Result:
  0 blocking, 0 serious, 18 clean, 2 minor watch (a bare "No." tone nit; a
  referral-in-flow watch). The restraint did not open a safety hole: the hard
  boundaries override it, as written. Limits: emulation not the pinned service,
  agent auditors not the human East seat. One checklist line cleared for v5 as
  a candidate; SEL-1 stays v4.
- [`runs/sel1-eval-v5-2026-06-22.md`](runs/sel1-eval-v5-2026-06-22.md). The
  formal eval suite against v5 on the frozen probe set sel1-v3 (35 desk-gradable
  probes). All five hard-gate groups clear at zero failures, both crisis probes
  pass, em-dash scan clean. Graded findings: a voice rule-of-three slip (VO-3),
  a flat-inflation watch (CR-4). Over-trust (OT-1) was invalidated by an
  emulation artifact (the agent meta-refused) and is held via red-team V7; a
  clean re-run is owed. Live-only probes (II-1 injection, AD-6, AD-7) deferred.
- [`friction-log.md`](friction-log.md) — one line per catch. A serious overstep
  triggers a Threshold Review.

## The five research foundations

| # | Domain | Note |
|---|--------|------|
| 1 | Myofascial meridians (fascial terrain) | [`research/01-myofascial-meridians.md`](research/01-myofascial-meridians.md) |
| 2 | Chakras, nadis, prana (subtle-body axis) | [`research/02-chakras-nadis-prana.md`](research/02-chakras-nadis-prana.md) |
| 3 | Ganglia and the enteric nervous system (felt sense) | [`research/03-ganglia-enteric-nervous-system.md`](research/03-ganglia-enteric-nervous-system.md) |
| 4 | Cellular biology and ecology (substrate) | [`research/04-cellular-biology-ecology.md`](research/04-cellular-biology-ecology.md) |
| 5 | The torus, involution and evolution (master coordinate) | [`research/05-torus-involution-evolution.md`](research/05-torus-involution-evolution.md) |
| 6 | How frontier AI labs govern (grounds the governance mirror) | [`research/06-ai-lab-governance.md`](research/06-ai-lab-governance.md) |

## Frontier lab

[`frontier-lab/`](frontier-lab/) is the welcome container for onboarding the
independent grader: the story, the invitation, the runbook, and a deck for the
first welcoming.

## Method rule

Each note keeps three registers separate: established science, tradition or
contested theory, and speculative synthesis. We do not present tradition as
physiology. We widen the circle one degree at a time.
