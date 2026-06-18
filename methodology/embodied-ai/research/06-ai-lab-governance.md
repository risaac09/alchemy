---
title: "How Frontier AI Labs Govern Model Development and Deployment"
domain: embodied-ai / ai-lab-governance
web_access: true
date: 2026-06-17
---

> Note on sourcing: Live web access was available at write time. Citations point to real, current primary and analyst sources. Framework versions move fast. The Anthropic RSP is at v3.0, OpenAI's Preparedness Framework at v2 (April 2025), and DeepMind's Frontier Safety Framework at v3.0 (September 2025). If you read this much later, check for newer versions before quoting numbers.

The shared pattern across labs is one rule: if a model reaches a measured capability, a matched safeguard must already be in place before that model ships or, in some cases, before it is trained further. The work is making "capability" and "safeguard" concrete enough to act on. Below is how each lab does it.

## Anthropic: Responsible Scaling Policy (RSP)

Anthropic uses AI Safety Levels (ASL), modeled loosely on biosafety levels. ASL-1 covers models with no meaningful catastrophic risk. ASL-2 covers current frontier models. ASL-3 covers models that meaningfully raise CBRN or autonomy risk. Higher tiers exist as a concept, but here is the correction worth flagging: **ASL-4 and ASL-5 are not currently defined**. RSP v3.0 removed the earlier placeholder "ASL-4 standards" rather than ship vague ones. So a clean "ASL-1 through ASL-4" ladder is not accurate today. Treat ASL-3 as the highest defined tier.

The logic is "if capability, then safeguard." Anthropic names capability thresholds in three domains: CBRN weapons uplift, autonomous AI research and development, and cyber operations. v3.0 (2025) added a CBRN threshold for uplift to state-level programs and split the AI R&D threshold into two levels (automating entry-level research, then dramatically accelerating scaling). When a model crosses a threshold under capability assessments, Anthropic must apply the matching ASL-3 standards: a **Deployment Standard** (classifiers and access controls that block misuse, currently scoped to CBRN) and a **Security Standard** (weight-theft protections). Anthropic activated ASL-3 in May 2025 for relevant Claude models. Evaluations run during training and before release; if safeguards are not ready, the commitment is to pause or restrict deployment.

Sources: [RSP page](https://www.anthropic.com/responsible-scaling-policy), [RSP v3.0 announcement](https://www.anthropic.com/news/responsible-scaling-policy-v3), [Activating ASL-3](https://www.anthropic.com/news/activating-asl3-protections), [GovAI analysis of RSP v3.0](https://www.governance.ai/analysis/anthropics-rsp-v3-0-how-it-works-whats-changed-and-some-reflections).

## OpenAI: Preparedness Framework

The Preparedness Framework v2 (April 2025) tracks three categories: Biological and Chemical, Cybersecurity, and AI Self-Improvement. A category qualifies for tracking if its risk is plausible, measurable, severe, net-new, and instantaneous or irremediable.

Another correction worth flagging: the current framework uses **two operational thresholds, High and Critical**, not the four-level low/medium/high/critical ladder. v2 dropped Low and Medium as not operationally decisive. A model at High capability cannot deploy until safeguards sufficiently reduce risk. A model at Critical capability also gates further development, not just deployment. The lab produces a **Safeguards Report** (and capability findings sometimes summarized as a scorecard) that the **Safety Advisory Group (SAG)** reviews. SAG advises leadership; OpenAI states the CEO and board hold final authority, which critics note as a weak point. SAG reviewed o3 and o4-mini and judged them below the High threshold in all three categories.

Sources: [Preparedness Framework update](https://openai.com/index/updating-our-preparedness-framework/), [Preparedness Framework v2 PDF](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf), [The Decoder coverage](https://the-decoder.com/openai-updates-risk-framework-to-assess-advanced-ai-capabilities/).

## Google DeepMind: Frontier Safety Framework (FSF)

DeepMind's FSF centers on **Critical Capability Levels (CCLs)**: capability thresholds where a model could pose severe risk without added mitigation. The framework runs periodic "early warning evaluations" that fire before a model reaches a CCL, then triggers a mitigation plan covering security (protecting weights) and deployment (limiting misuse).

FSF v3.0 (September 2025) covers CBRN, cybersecurity, and machine learning R&D, and added two notable domains: **harmful manipulation** (shifting beliefs at scale) and **misalignment**, including the case of a model that resists shutdown by its operators. The misalignment work is the clearest sign the labs are moving past pure misuse risk toward control risk.

Sources: [Strengthening the FSF](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/), [FSF v3.0 PDF](https://storage.googleapis.com/deepmind-media/DeepMind.com/Blog/strengthening-our-frontier-safety-framework/frontier-safety-framework_3.pdf), [Introducing the FSF](https://deepmind.google/blog/introducing-the-frontier-safety-framework/).

## Cross-cutting machinery

These mechanisms recur across labs:

- **Dangerous-capability evaluations.** Structured tests for CBRN uplift, cyber, autonomy, and self-improvement. These are the trigger for every "if capability" clause.
- **Red-teaming.** Internal and external adversarial testing. OpenAI has published its external red-teaming approach. The 2023 US Executive Order defined red-teaming and tasked NIST with guidance.
- **Model cards and system cards.** Public documentation of a model's behavior, limits, and evaluations. System cards widen the lens from model to the full product boundary (data to model to deployed system).
- **Do-not-deploy and gated rollout.** A model can be held back, deployed to a narrow audience first, or shipped behind classifiers. The gate is a real commitment, not a courtesy.
- **Defense in depth.** Layered safeguards (training, classifiers, monitoring, access control) so no single failure is catastrophic.
- **Review boards and incident reporting.** SAG at OpenAI, internal governance bodies elsewhere, plus channels to log and escalate failures after release.
- **Third-party and external audits.** Pre-deployment testing by outside evaluators and government safety institutes. This is the least mature piece and still mostly voluntary.

**Where external frameworks fit.** The [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) (RMF 1.0, 2023, plus the 2024 Generative AI Profile) is voluntary and organizes work into four functions: Govern, Map, Measure, Manage. It is the documentation and process spine many labs map their own policies onto. The [EU AI Act](https://en.wikipedia.org/wiki/General-Purpose_AI_Code_of_Practice) is binding law. It entered force August 2024, general-purpose AI obligations applied from August 2025, and Commission enforcement begins August 2026. The General-Purpose AI Code of Practice (July 2025) gives operational guidance across transparency, copyright, and safety/security. NIST is process guidance you adopt; the EU AI Act is regulation you must meet.

## What a tiny studio can mirror

Most of this scales down if you keep the structure and drop the scale. The honest move is to copy the *shape* of the governance, not pretend to the resources.

Scales down well:
- **The core conditional.** "If this capability shows up, this safeguard must already exist." A one-person studio can write that rule for its own products and hold to it.
- **A capability or risk register.** A short list of the few harms that are plausible, severe, and specific to what you build. Two or three named risks beat a generic checklist.
- **Tiered thresholds.** Define two levels, "ship freely" and "hold until mitigated," like OpenAI's High/Critical cut. Two is enough.
- **Cards.** A plain model or system card for anything you release, even a one-page note on what it does, what it cannot do, and how it was tested.
- **Pre-release evaluation and a do-not-ship gate.** Run your own adversarial pass. Give yourself permission to not ship. The gate is the whole point.
- **Incident logging.** A single file where failures get recorded and revisited. Cheap and high-value.

Does not scale down:
- **A separate Safety Advisory Group.** You are the SAG. Name the moment you switch from builder to reviewer instead, and write the decision down so it is not just a vibe.
- **Independent third-party audits and government pre-deployment testing.** Out of reach at one or two people. You can invite a trusted outside reader, which is a weaker but real substitute.
- **Weight-security programs and dedicated red teams.** These assume staff and infrastructure a studio does not have.

The transferable core is small: a written conditional, a short risk list, two thresholds, a card, a self-honest review step, and a log. That is governance a studio can actually run.
