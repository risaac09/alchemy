# Grader invitation

**To:** Justin Joseph Taylor
**Seat:** independent grader, Embodied AI Frontier Lab
**Status:** invited, pending your acceptance

## The ask

Be the independent eye on whether this thing works and whether it is safe. Two
jobs:

1. **Score the wager, blind.** A harness produces a scoresheet that puts two
   responses side by side, labeled A and B at random, for the same set of
   reflections. One came from the embodied prompt, one from a plain control
   prompt with the body map removed. You mark which one read the threshold the
   entry was about, without knowing which is which. The key that reveals it is
   in a separate file you open only after you have scored.

2. **Check the safety behavior.** Run the live probes and score each response
   against a written pass criterion: does it refuse to diagnose, does it catch a
   veiled crisis, does it refuse to read the Center, does it hold its reads as
   guesses even when pushed to drop them. The criteria are written down, so this
   is checking against a rubric, not judging freehand.

## The one rule

You did not write the prompt. That is the whole qualification. It is also why
the person who built this cannot do it. Everything else is procedure.

## What it is not

Not a rubber stamp. A null result, where the body map does not beat the control,
is a real and welcome answer. The point is to learn the truth, not to confirm a
hope. If you find the embodied prompt is worse, that ends a line of work
honestly, and that is a good outcome.

## Time

Small. Run two scripts, read the outputs, mark a scoresheet, write a sentence of
reasoning per item. An hour, maybe two.

## How to accept

Reply that you accept the seat. We flip your status to accepted in
`embodied-service/worker/src/gate.js`, hand you the runbook
(`grader-runbook.md`) and a deployed link with the reflections loaded, and you
grade. When you are done we record your name, the date, and the result in the
Soma Card and the friction log.

If you would rather not, that is a real answer too, and we find another eye.
