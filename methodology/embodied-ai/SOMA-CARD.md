---
title: Soma Card — Embodied AI
status: draft (West to confirm true before any sign-off)
date: 2026-06-17
prompt_version: embodied-prompt-v2
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

- **VO-2** (prompt v1): produced a clean three-beat list. Fixed in
  `embodied-prompt-v2`, passes in the v2 run.
- **OV-5** (prompt v1): the crisis response assumed a US phone number. Fixed in
  `embodied-prompt-v2`, now geography-agnostic.
- **Meta-failure, open:** every eval run so far is self-administered. The agent
  that wrote the prompt produced and graded the responses. No independent
  validation exists yet. This is the largest known weakness and it blocks SEL-1
  sign-off.

## Exposure level

**SEL-0.** Methodology only. Nothing reads a real person yet. SEL-1 (self-test
inside Alchemy) is not cleared. Its gate checklist still needs an independent
re-run, the East red-team pass, and the four-seat signature.

## What changes this card

A prompt version bump, a new failure found in any run, or a move between
exposure levels. West updates the card and re-confirms it is true.
