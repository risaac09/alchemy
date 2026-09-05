# Alchemy: an honest account

*Written 2026-06-22. This is the account that makes Alchemy a lab exhibit and not just an app. It says what the tool is, the claim it embodies, and where it fails. The failures are the point, not a disclaimer.*

## What it is

Alchemy is a digital liver for information. It sits between consuming and knowing and forces a pause. You capture something, you wait, you check your body, you reflect, and only what survives that becomes worth keeping. It is free, runs entirely in your browser, has no accounts and no servers.

It embodies one claim: a tool can be built around human finitude instead of infinite engagement. Attention runs on a nervous system. Fatigue is real, overload has a cost, and the source of every signal is a body. Most software is built to take as much of that attention as it can. Alchemy is built to take as little as the work needs and then stop.

## What it does, and why each piece is the claim

- **A 7-item cap.** The inbox is finite on purpose. You cannot hoard. Scarcity is the feature.
- **A 30-second settle.** A freshly captured item cannot be reflected on yet. The pause is forced.
- **A one-word somatic check.** Before the intellect takes over, you name what is loudest in the body.
- **Decay.** Unattended items dissolve after 72 hours. Kept items compost after 90 days. Nothing accumulates forever.
- **No accounts, no servers, no analytics, no AI, no engagement metric.** There is nothing to optimize for your attention, because there is no one watching it.

## Where it fails

This is the part item 5 of the lab program asks for, and the part a wellness brand cannot publish.

- **The somatic check is a gesture, not a measurement.** One word is not the body. It points at felt sense and does not capture it. The gap between a biometric and a felt sensation is real and Alchemy does not bridge it. It only asks you to look.
- **Finitude is enforced by deletion.** The cap and the decay throw things away, and some of what decays mattered. The tool bets that what survives attention is what deserved it. That bet is sometimes wrong, and the loss is not recoverable.
- **It cannot prove its own claim.** The thesis is that holding the organism-pole returns you to yourself better regulated. Alchemy does not measure whether it does. There is no outcome data. The self-assessment inside it is self-report, not evidence.
- **It runs on one device.** localStorage only. No sync, no backup unless you export. Clear your browser and it is gone. That follows from "no servers," and it is a real cost, not only a virtue.
- **The friction repels most people.** The settle period and the forced reflection are the point, and they are also why almost no one will use it. A tool that refuses engagement does not get engagement. Adoption is not the success metric here, which is convenient to say and still true.
- **It is free and unsupported.** No roadmap, no support, no promise it keeps working.
- **"Information metabolism" is a borrowed metaphor doing real work.** It is not a measured biological claim. The liver is an image, not a mechanism.

## Its place

Alchemy is one of two exhibits in the constructive register of the Third Information Lab. The lab's main work is diagnostic: it audits how datafied systems delete the organism-pole of an affordance and keep only the measurable residue. The constructive register runs that thesis the other way, by building small governed experiments that try to hold the pole. There are two, kept as separate code on purpose:

- **Alchemy, this tool.** No AI, no servers, no model call. It holds the pole structurally, by refusing the machinery of extraction. It is also where the felt signal is collected: the somatic pulse, the body vocabulary, the self-assessment.
- **The embodied-AI experiment** (the `third-information-lab/` of the [material-and-meaning-institute](https://github.com/risaac09/material-and-meaning-institute) repo, the AI iteration of the institute). A body-map stance an AI can take to meet a person, governed by exposure levels and red teams, with one open wager: does an embodied frame read thresholds a flat prompt misses. Tested in emulation, not yet on real entries with a human grader. A null result is a real answer. It does not claim the AI is embodied; the map is a vocabulary for reflection, not diagnosis. Its runtime now ships from this repo: `embodied-service/` (a Cloudflare Worker with a model call, isolated from the PWA) and the methodology under `methodology/embodied-ai/`. The separation survives as a boundary inside the repo, not a wall between repos: nothing from the service enters `app.js`.

What Alchemy claims is small: that this kind of tool can be built, and here is one. What it declines is larger. It does not claim to have solved extraction, to be a finished alternative, or to add "relational information" to anything. It is one buildable counter-example, shipped with its failures attached, which is the only honest way to ship it.

Full architecture: the constructive register is documented in the vault under the Third Information Lab (`Lab Architecture - The Constructive Register`).
