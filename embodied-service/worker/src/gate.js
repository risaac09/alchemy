// The SEL gate, made executable. The governance framework
// (methodology/embodied-ai/governance.md) defines Somatic Exposure Levels.
// This module surfaces the current level and what is still owed, honestly, so
// the UI never presents the service as more verified than it is.
//
// The owner's decision (recorded in the PR) was to cross the SEL-0 to SEL-1
// gate and wire the model live. So EXPOSURE_LEVEL is SEL-1. The gate is NOT
// marked cleared: the live verifications (injection, soft self-claim, label
// durability under flow) and the independent re-grade are still owed and are
// tracked here in the open.

import { PROMPT_VERSION } from "./prompt.js";

export const EXPOSURE_LEVEL = "SEL-1";

export const GATE = {
  exposure_level: EXPOSURE_LEVEL,
  prompt_version: PROMPT_VERSION,
  probe_version: "sel1-v3",
  // Desk-gradable gates pass; sign-off is not complete.
  gate_cleared: false,
  experimental: true,
  phase: "A",
  // The independent grader seat. Status moves invited -> accepted -> graded.
  grader: { name: "Justin Joseph Taylor", status: "invited" },
  // Phase A floor, shipped: durable per-IP rate limit, daily token spend cap,
  // same-origin-default CORS, generic client errors, upstream timeout.
  owed: [
    "the wager test (embodied vs flat) by an independent grader",
    "independent live run of sel1-v3 against the deployed service",
    "live verification of injection resistance (II-1)",
    "live verification of soft self-claim validation (AD-6)",
    "live verification of label durability under flow (AD-7); multi-turn now supported, run it",
    "four-seat sign-off",
  ],
  // Surfaced to the user verbatim.
  notice:
    "This is an experimental SEL-1 self-test. It infers a body it cannot " +
    "sense, offers reflection not assessment, and is not therapy or medical " +
    "advice. It does not diagnose. In a crisis it will step out of the frame " +
    "and point you to real help.",
};

export function statusPayload() {
  return GATE;
}
