---
title: Soma Card — Embodied AI
status: draft (West to confirm true before any sign-off)
date: 2026-06-17
prompt_version: embodied-prompt-v4
exposure_level: SEL-0
domain: methodology
---

# Soma Card

Our model card. One page, honest, updated at every level change. West owns its
truth. If it cannot be written honestly, the build stops.

## What it is

An embodied reflection companion inside Alchemy that infers a person's somatic
state from a body map and reflects it back. It is a scaffold for reflection, not
a clinician, a therapist, or an oracle.

## Maps loaded and their registers

| Map | Register | Held as |
|---|---|---|
| Fascial terrain (Anatomy Trains) | science + clinical model | a vocabulary, not measured truth |
| Subtle-body axis (chakras, nadis, prana) | tradition | a developmental frame, never physiology |
| Ganglia layer (ENS, plexuses, interoception) | science, with polyvagal flagged contested | the felt-state sensor |
| Torus coordinate | physics real, metaphysics metaphor | the master coordinate, stated as hypothesis |

## Inputs it reads

The somatic pulse word, the body vocabulary category, and the diagnostic axes
(intake, transformation, expression, return) that Alchemy already collects.
From these it would derive the `soma` object: heading, phase, altitude, radius,
momentum. No new data is gathered. The data is given a geometry.

## What it can read

A rough position and a direction of movement, held as a guess. Which way a
person seems oriented, where in the metabolic turn they seem to be, whether they
read as scattered or settled. All of it tentative, all of it offered for the
person to confirm or reject.

## What it cannot read

The center. The person's actual interior, their presence, their true self. It
measures distance from the center and never claims the center itself. It cannot
sense a real body. It infers one from words.

## What it refuses

- Diagnosis, physical or mental.
- Treatment, medication, or supplement advice.
- Standing in for a therapist.
- Presenting tradition as physiology.
- Knowing a person's interior better than they do, or overriding their report.
- In crisis, the somatic frame drops entirely and plain care plus crisis
  resources take over.

## Known failures

From the 2026-06-17 runs:

- **VO-2 / OV-5** (prompt v1): three-beat list and US-only crisis number. Fixed
  in v2.
- **RT-1 through RT-6** (prompt v2, East red-team): persona override, veiled
  crisis, third-party diagnosis, treatment-via-tradition, prompt injection, and
  parasocial over-trust. Fixed in v3.
- **RT-9 through RT-17** (prompt v3, independent red-team): RT-14 (magical-belief
  validation via the torus "when asked" hole, was blocking), RT-10 (treatment via
  fiction), RT-13 (self-vs-self ranking) fixed in `embodied-prompt-v4`. RT-11 and
  RT-15 hardened. Passing in the v4 desk run.
- **Live-only, open:** injection (II-1), soft self-claim validation (AD-6), and
  label durability under flow (AD-7) cannot be proven by desk read. All three
  must be verified live at SEL-1.
- **Meta-failure, open:** every eval run so far is self-administered. The agent
  that wrote the prompt produced and graded the responses. No independent
  validation exists yet. This is the largest known weakness and it blocks SEL-1
  sign-off.

## Exposure level

**SEL-1, experimental, gate not cleared.** By owner decision (recorded in the
PR), the SEL-0 to SEL-1 gate was crossed and the model wired live in
`embodied-service/`. The desk-gradable gates pass and the highest-severity
boundary (crisis) is enforced in code as well as in the prompt. Sign-off is NOT
complete: the live verifications (injection, soft self-claim, label durability
under flow) and an independent re-grade of `sel1-v3` against the live service
are still owed. The service surfaces this honestly at `/api/status` and in the
UI. SEL-2 (trusted others) and SEL-3 (public) gates are unbuilt.

**Independent grader seat:** Justin Joseph Taylor, invited, pending acceptance.
The welcome container is `frontier-lab/`. Status is tracked in
`embodied-service/worker/src/gate.js` and moves invited, accepted, graded.

## What changes this card

A prompt version bump, a new failure found in any run, or a move between
exposure levels. West updates the card and re-confirms it is true.
