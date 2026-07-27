// Durable rate limiting and a global spend cap. These replace the in-isolate
// Map, which did not bind a real attacker (isolates are ephemeral and many).
// Durable Objects give one consistent instance per key, so the count is real.
//
// RateLimiter: one instance per IP (idFromName(ip)), fixed window.
// SpendCounter: one global instance, accumulates model token usage per UTC day
//   and refuses once the cap is hit. A blunt but real ceiling on the model bill.

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

export class RateLimiter {
  constructor(state) {
    this.state = state;
  }
  async fetch() {
    const now = Date.now();
    let rec = await this.state.storage.get("rec");
    if (!rec || now - rec.start > WINDOW_MS) {
      rec = { start: now, count: 0 };
    }
    rec.count += 1;
    await this.state.storage.put("rec", rec);
    return Response.json({ limited: rec.count > MAX_PER_WINDOW });
  }
}

export class SpendCounter {
  constructor(state) {
    this.state = state;
  }
  async fetch(request) {
    const url = new URL(request.url);
    const cap = Number(url.searchParams.get("cap")) || 2_000_000;
    const day = new Date().toISOString().slice(0, 10);
    let s = await this.state.storage.get("spend");
    if (!s || s.day !== day) s = { day, tokens: 0 };

    if (url.pathname === "/check") {
      return Response.json({ over: s.tokens >= cap, tokens: s.tokens, cap });
    }
    if (url.pathname === "/add") {
      s.tokens += Number(url.searchParams.get("tokens")) || 0;
      await this.state.storage.put("spend", s);
      return Response.json({ tokens: s.tokens });
    }
    return new Response("not found", { status: 404 });
  }
}

// Helpers the worker calls. Each degrades safely if the binding is absent (for
// constrained environments), logging that durable enforcement is off rather
// than crashing.

export async function checkRateLimit(env, ip) {
  if (!env.RATE_LIMITER) {
    console.warn("RATE_LIMITER binding missing; rate limiting is off");
    return false;
  }
  const stub = env.RATE_LIMITER.get(env.RATE_LIMITER.idFromName(ip));
  const r = await stub.fetch("https://do/limit");
  const { limited } = await r.json();
  return limited;
}

function spendStub(env) {
  return env.SPEND_COUNTER.get(env.SPEND_COUNTER.idFromName("global"));
}

export async function spendOverCap(env) {
  if (!env.SPEND_COUNTER) {
    console.warn("SPEND_COUNTER binding missing; spend cap is off");
    return false;
  }
  const cap = env.DAILY_TOKEN_CAP || "";
  const r = await spendStub(env).fetch(`https://do/check?cap=${cap}`);
  const { over } = await r.json();
  return over;
}

export async function recordSpend(env, tokens) {
  if (!env.SPEND_COUNTER || !tokens) return;
  await spendStub(env).fetch(`https://do/add?tokens=${tokens}`);
}
