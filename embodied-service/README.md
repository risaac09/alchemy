# Embodied service

A functional service that runs the embodied prompt as a live reflection tool:
a static UI, a Cloudflare Worker backend, the SEL governance made executable,
and a deterministic safety layer in front of the model.

This is isolated from the Alchemy PWA. The PWA stays vanilla and backend-free.
This directory is the one place with a backend and a model call.

## Exposure level

**SEL-1, experimental, gate not cleared.** The owner chose to cross the
SEL-0 to SEL-1 gate and wire the model live (recorded in the PR). The desk-
gradable gates pass, but the live verifications and the independent re-grade are
still owed. The service says so in `/api/status` and in the UI. See
`../methodology/embodied-ai/governance.md` and `SOMA-CARD.md`.

## Architecture

```
ui/                 static, vanilla JS, no build
  index.html        chat-style reflection surface
  app.css           warm-dark earthen, Alchemy register
  app.js            talks to /api/status and /api/reflect
worker/             Cloudflare Worker (rp-api idiom)
  src/index.js      router, CORS, rate limit, crisis bypass
  src/prompt.js     embodied-prompt-v4, verbatim, version-pinned
  src/guards.js     input validation + deterministic crisis detection
  src/gate.js       SEL status, the executable governance
  src/llm.js        Claude API call (claude-opus-4-8, adaptive thinking)
  wrangler.toml     config; serves ui/ as static assets
verify/verify.mjs   safety verification harness (no network, no key)
```

## Defense in depth

The embodied prompt carries the boundaries, and the model can still fail, so
the worker enforces the highest-severity ones in code, before the model:

- **Crisis bypass.** A deterministic pre-screen (`guards.isCrisis`) catches
  plain and veiled self-harm language and returns plain care plus resources
  without ever calling the model. False positives are acceptable here; a miss
  is the failure we refuse. Verified by `verify/verify.mjs`.
- **Input validation.** Type and length caps; the optional `soma` object is
  reduced to an allowlist so a caller cannot smuggle instructions through it.
- **Refusal handling.** A model safety refusal is detected before reading
  content and answered plainly.
- **Rate limit, CORS, no content logging.** Best-effort per-IP limit (in
  isolate; move to a Durable Object or KV for fleet-wide limits), CORS locked
  to `ALLOWED_ORIGIN` in production, request bodies are never logged.

## Run it

```sh
cd worker
npm install
npm run dev          # local, mock mode (no key)
```

Mock mode returns a labeled placeholder so the UI and pipeline work without a
key. To go live:

```sh
wrangler secret put ANTHROPIC_API_KEY
npm run deploy
```

Set `ALLOWED_ORIGIN` in `wrangler.toml` to the deployed UI origin before any
real traffic.

## Verify

```sh
node verify/verify.mjs
```

This proves the deterministic safety floor: crisis language (plain and veiled)
is caught in code, ordinary somatic talk is not flagged, input validation
holds, the soma allowlist drops injected fields. It does **not** verify
model behavior (register honesty, the Center, injection resistance, label
durability under flow). Those are the live verifications still owed for SEL-1
sign-off, and they need the deployed worker with a key plus an independent
grader running the `sel1-v3` probe set against it.

## Phase A status

The cost and abuse floor is shipped and in this code:

- **Durable rate limit.** Per-IP fixed window in a Durable Object
  (`RateLimiter`), so the count is real across isolates. Replaces the old
  in-isolate Map.
- **Daily spend cap.** A global Durable Object (`SpendCounter`) accumulates
  model token usage per UTC day and returns `daily_capacity_reached` once
  `DAILY_TOKEN_CAP` is hit. A blunt ceiling on the model bill.
- **CORS locked down.** Same-origin by default; a cross-origin header is emitted
  only when `ALLOWED_ORIGIN` is set to a real origin. A bare `*` is treated as
  unset, so the wide-open default can never ship.
- **Error hygiene.** Upstream error detail is logged server-side and never
  returned to the client. A 60s `AbortController` timeout bounds the model call.

Still owed for SEL-1 sign-off (need a key, a deployment, and an independent
grader who did not write the prompt):

- **The wager test.** `node verify/wager.mjs [reflections.txt]` runs the
  embodied prompt against the flat control on the same reflections, blind-labels
  the pairs, and writes a scoresheet plus a key. Replace the placeholder
  reflections with real entries before the run counts.
- **Live probes.** `EMBODIED_BASE_URL=... node verify/live-probes.mjs` records
  II-1, AD-6, and spot-check responses from the live service for the grader.
  AD-7 (label durability under flow) is multi-turn and runs directly against the
  API, because `/api/reflect` is stateless. The service needs a multi-turn mode
  before AD-7 is a real product check.

## CI gate

`.github/workflows/embodied-verify.yml` runs this harness (plus a syntax check
of the worker modules) on every push and PR that touches `embodied-service/`.
Deploy is gated behind it: the `deploy` job `needs` the `verify` job, runs only
on manual dispatch, and skips cleanly if `CLOUDFLARE_API_TOKEN` is not set. The
safety floor cannot be bypassed on the way to a deploy.

## Privacy

Reflections are sent to the model to generate a response and are not stored or
logged by the worker. The model provider processes them per its own terms.
