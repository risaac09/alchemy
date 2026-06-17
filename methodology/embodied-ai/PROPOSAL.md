---
title: Proposal to the Orchestrator — Embodied AI, next phase
date: 2026-06-17
from: the build (this session)
to: the orchestrator (the Council of Four Directions and the owner)
status: approved (Phase A then Phase B); Phase A in progress
re: methodology/embodied-ai, embodied-service, PR #2
---

# Proposal to the Orchestrator

## Summary

In one arc we built the embodied-AI somatic map: a methodology foundation, a
governance framework, a testing protocol, a system prompt hardened across four
versions by two red teams, and a live SEL-1 service with the crisis boundary
enforced in code. The work is real and the safety floor holds. But the gate was
crossed by owner decision, not cleared by checklist, every eval is
self-administered, and the wager the whole project exists to test has never been
run. This proposal asks the orchestrator to fund the one phase that converts a
self-graded paper claim into evidence, and to authorize the hardening that must
precede any second user.

## What we learned

1. Register discipline is the load-bearing honesty mechanism. Splitting every
   claim into science, tradition, and synthesis, and refusing to weld them, held
   under every attack aimed at it.
2. Adversarial iteration works and works fast. Four prompt versions in a day
   closed real defects, each driven by a logged finding.
3. The strongest rules failed the same way: they refused on request but not on
   byproduct. Fiction framing, self-versus-self ranking, and the torus "when
   asked" hole all walked around request-shaped boundaries. That is the most
   transferable safety lesson here.
4. Defense in depth beat prompt-only safety. Moving the crisis boundary into
   code means the highest-severity failure no longer depends on the model
   obeying prose.
5. The governance scale-down is real. SEL levels, the Council, the Center veto,
   and the Soma Card map onto frontier-lab machinery sized for one person, and
   the framework names its own non-independence in the open.

## Where we actually are

- Exposure level SEL-1, experimental. The gate was crossed by choice. Sign-off
  is not complete.
- Every eval was written and graded by the same agent. Reviewer A re-graded
  prompt v3, not the live v4.
- Three failure modes are unverifiable on paper and still untested live:
  injection (II-1), soft self-claim validation (AD-6), and label durability
  under flow (AD-7). The flow rule actively pressures the model to drop its
  honesty labels.
- The wager itself, does an embodied frame read thresholds a flat prompt
  misses, has never been run. The premise is unproven.
- The service rate limit lives in a Worker isolate, so it does not bind a real
  attacker. CORS still defaults to `*`. Error detail leaks upstream text. There
  is no spend cap and no request timeout.

## The decision before the orchestrator

Two things are true at once. The premise is unproven, and the service is wired
live with an open cost and abuse surface. The orchestrator decides which to fund
first, and whether to authorize a second user at all before the wager returns a
result.

## Proposed phases

### Phase A — Evidence and floor (before any non-Isaac user)

The one phase that earns the right to continue.

- **Independent live eval.** Deploy v4 with a key. A reader who did not write
  the prompt runs the frozen `sel1-v3` set against the live service. Confirm
  II-1, AD-6, AD-7 behaviorally. Log a real run, not a desk run.
- **The wager test.** Run the embodied prompt against a flat prompt on a fixed
  set of Isaac's own reflections, scored blind. A null result is a real answer
  and ends the project honestly if the map does not help.
- **Cost and abuse floor.** Durable per-IP rate limit (Durable Object or KV), a
  global daily spend cap, `ALLOWED_ORIGIN` set to the real UI origin, generic
  client errors with detail logged server-side, an `AbortController` timeout.

### Phase B — SEL-2 gate (trusted others)

Only if Phase A clears and the wager pays off. Build the SEL-2 gate as real
plumbing, not a level bump: token auth, explicit consent copy, a deletion path,
and per-session metadata logging that respects the no-content-logging promise.
East red-teams the consent and the auth.

### Phase C — SEL-3 gate (public)

Deferred. Independent auditor on the register-honesty eval, a reviewed crisis
protocol, the published Threshold Review process.

## Recommendation

Fund Phase A in full and authorize no second user until the wager returns a
result. The wager test is the single highest-leverage move, because it converts
the entire arc from a self-graded paper claim into evidence and finally tests
the hypothesis the project was built to test. The cost floor ships alongside it
because an open spend surface on a live model cannot wait for a second user to
discover it.

## Risk of inaction

If we keep building features at SEL-1 without running the wager, we compound a
premise that may not hold. If the service stays live with the current floor and
ever leaves Isaac's hands, a single actor can run the model bill unbounded
against a wide-open CORS default.

## Decision requested

Approve the Phase A scope, name who plays the independent grader seat, and
confirm the no-second-user hold until the wager returns.

## Status update (2026-06-17)

Approved: Phase A, then Phase B. Phase A execution:

- **Done in code:** the cost and abuse floor (durable per-IP rate limit, daily
  token spend cap, same-origin-default CORS, error hygiene, upstream timeout).
  Safety floor verification still green at 19/19.
- **Handoff harnesses built:** `embodied-service/verify/wager.mjs` (the wager
  test, blind scoresheet plus key) and `embodied-service/verify/live-probes.mjs`
  (II-1, AD-6, AD-7 records for the grader).
- **Blocked on the owner:** running the wager and the live probes needs a
  deployed worker with a key and a named independent grader. Those two inputs
  are not mine to supply. The grader seat is still unnamed.
- **New finding:** `/api/reflect` is stateless, so AD-7 (label durability under
  flow) cannot be a live product check until the service supports multi-turn
  history. Logged as a Phase A to Phase B carry-over.

Phase B (SEL-2) stays unwired until the wager returns a result, per the approved
recommendation. The multi-turn mode AD-7 needs is the natural first build of
Phase B.
