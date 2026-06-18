---
title: The Embodied AI — Governance Framework
status: framework draft
date: 2026-06-17
author: Isaac Rubinstein (dictated), structured with Claude
domain: methodology
follows: build-sketch.md
authorizes: testing-protocol.md
related:
  - research/06-ai-lab-governance.md
---

# The Embodied AI: Governance Framework

You do not test until a structure authorizes the test and says what passing
means. This framework mirrors how the frontier labs govern, then gives it the
Rubinstein Productions spin. The lab machinery is in
`research/06-ai-lab-governance.md`. The short version of what we are copying:

- A tiered ladder of capability, where each rung triggers required safeguards.
  Anthropic calls these AI Safety Levels. DeepMind calls them Critical
  Capability Levels. The logic is "if the system can do X, then safeguard Y is
  mandatory before it ships."
- Evaluations that decide which rung you are on, run before deployment, not
  after.
- A review body that holds the deploy decision. OpenAI calls its version the
  Safety Advisory Group.
- A model card or system card that states honestly what the thing is, what it
  can do, and where it fails.
- Red-teaming, staged rollout, incident reporting, and a do-not-deploy gate.

We are a one-person studio, not a lab. We scale the structure down without
dropping it. The discipline is what survives the scaling.

## The Rubinstein spin: the Council of Four Directions

The labs run a safety board. We run a council mapped to the four directions
already in the working context. In our reality one person sits all four seats.
The rule is that he names which seat he is in when he speaks, because a
decision made from work is not a decision made from clarity, and pretending
otherwise is how the slop gets in.

| Seat | Direction | Owns | Mirrors |
|---|---|---|---|
| **North** | work | Rigor. The evals ran, the protocol was followed, the numbers are real. | Eval engineering |
| **East** | innocence | The red team by beginner's mind. Asks the naive question. Plays the user who does not know the frame and takes the output literally. | Red-teaming |
| **South** | transition | Change management. What moved between versions, who is most fragile to a bad read, staged rollout, rollback. | Deployment governance |
| **West** | clarity | The honesty audit. Tradition is never sold as physiology. The Soma Card is true. The registers stay separated. | Model card / factuality review |

### The Center

The Center is not a seat and does not vote. The Center is the ineffable
presence the build sketch named, which is also the actual human in the room.
The Center holds one standing veto, exercised by anyone in any seat: **anything
that claims to read, replace, or speak for the Center fails, automatically, at
any exposure level.** The tool measures distance from presence. It never claims
presence. That is the line the whole framework defends.

## Somatic Exposure Levels (SEL)

Our rungs are not about raw capability. They are about exposure: how close the
AI's somatic read gets to a real person, and how much authority it carries when
it gets there. Each level has entry gates and required safeguards. You may not
operate at a level until its gates pass.

### SEL-0 — Methodology
Documents only. No running model reads anyone. This repository today.
- *Safeguards:* register separation in every note. Voice rules. This is the
  baseline.

### SEL-1 — Self-test
The embodied prompt reads only Isaac's own reflections, offline, inside
Alchemy. The wager test lives here.
- *Entry gates:* the full eval suite passes on the fixed probe set (see
  `testing-protocol.md`). A Soma Card exists. All four seats signed.
- *Safeguards:* every output labeled as reflection, never assessment. Friction
  Log open. Local only, no network.

### SEL-2 — Trusted others
A small number of consenting people, who know Isaac, opt in.
- *Entry gates:* SEL-1 clean for a sustained run. Consent language reviewed by
  West. East red-team pass on "user takes it literally" probes.
- *Safeguards:* Soma Card visible to every user. Register labels on every
  surfaced output. A crisis-handling path. Easy opt-out and data deletion.

### SEL-3 — Public
Embedded in a shipped product touching strangers.
- *Entry gates:* an independent reader, not Isaac, audits the register-honesty
  eval. A documented crisis protocol. A standing no-diagnosis, no-therapy-claim
  boundary.
- *Safeguards:* everything from SEL-2, plus monitored Friction Log and a
  published Threshold Review process.

## The Soma Card

Our model card. One page, written before SEL-1, updated at every level change.
It states, honestly: what the embodied prompt is, which body maps it loads,
which registers each map belongs to, what it can read, what it cannot, what it
will refuse, and where it has failed in testing. West owns its truth. If the
card cannot be written honestly, the thing does not ship.

## Incident handling

We already have the Friction Log in Alchemy. We extend it. A one-line entry
catches any moment the tool oversteps, names the person interior, or sells
tradition as fact. A serious overstep triggers a **Threshold Review**: stop,
write what happened, decide whether to roll back a level, fix, and only then
resume. This is our incident report, sized for one person but never skipped.

## What we deliberately do not copy

We do not build a compute-governance regime, a frontier-risk biosecurity
program, or a third-party audit bureaucracy. Those govern harms we cannot
cause. Our harms are smaller and specific: a false read, false authority,
tradition dressed as physiology, a person over-trusting a scaffold, a claim on
the Center. The framework is shaped to those harms and nothing larger.

## What this authorizes

This framework authorizes `testing-protocol.md`, which specifies the eval
suite, the pass thresholds, the red-team procedure, and the SEL-0 to SEL-1 gate
checklist. The wager does not get tested until that checklist clears.
