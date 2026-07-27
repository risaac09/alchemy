// Embodied service worker. Entry point and router.
//
// Routes:
//   GET  /api/status   -> SEL gate status + notice (the executable governance)
//   POST /api/reflect  -> { text, soma? } -> guarded reflection
//   everything else    -> static UI assets (env.ASSETS), if bound
//
// Security posture (Phase A floor):
//   - input validation and length cap (guards.validateInput)
//   - deterministic crisis pre-screen that bypasses the model (guards.isCrisis)
//   - durable per-IP rate limit (Durable Object), not in-isolate
//   - global daily token spend cap (Durable Object)
//   - same-origin by default; CORS only when ALLOWED_ORIGIN is set explicitly
//   - generic client errors; upstream detail logged server-side, never returned
//   - request bodies are not logged (privacy by default)

import { validateInput, isCrisis, CRISIS_RESPONSE } from "./guards.js";
import { generateReflection } from "./llm.js";
import { statusPayload, GATE } from "./gate.js";
import { checkRateLimit, spendOverCap, recordSpend } from "./limits.js";

// Durable Object classes must be exported from the entry module.
export { RateLimiter, SpendCounter } from "./limits.js";

function corsHeaders(env) {
  // Same-origin by default (the worker serves the UI). Emit a cross-origin
  // header only when an explicit origin is configured. A bare "*" is treated
  // as unset, so the wide-open default can never ship by accident.
  const origin = env.ALLOWED_ORIGIN;
  if (!origin || origin === "*") return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
  };
}

function json(body, status, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(env) },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    if (url.pathname === "/api/status" && request.method === "GET") {
      return json(statusPayload(), 200, env);
    }

    if (url.pathname === "/api/reflect" && request.method === "POST") {
      const ip = request.headers.get("cf-connecting-ip") || "unknown";

      if (await checkRateLimit(env, ip)) {
        return json({ error: "rate_limited", retry_after_s: 60 }, 429, env);
      }
      if (await spendOverCap(env)) {
        return json({ error: "daily_capacity_reached" }, 429, env);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "invalid_json" }, 400, env);
      }

      const v = validateInput(body);
      if (!v.ok) return json({ error: v.error }, 400, env);

      // Defense in depth: crisis pre-screen bypasses the model entirely.
      if (isCrisis(v.text)) {
        return json(
          { mode: "crisis", text: CRISIS_RESPONSE, exposure_level: GATE.exposure_level },
          200,
          env
        );
      }

      const result = await generateReflection(env, { text: v.text, soma: v.soma, history: v.history });

      if (result.tokens) {
        // Fire-and-forget the spend record; do not block the response on it.
        env.SPEND_COUNTER && recordSpend(env, result.tokens).catch(() => {});
      }

      if (result.mode === "error") {
        // Log detail server-side; return a generic message to the client.
        console.error("reflect upstream error", result.error, result.detail);
        return json({ error: "upstream_unavailable" }, 502, env);
      }

      return json(
        { mode: result.mode, text: result.text, exposure_level: GATE.exposure_level },
        200,
        env
      );
    }

    // Static UI, if the assets binding is configured.
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response("Not found", { status: 404, headers: corsHeaders(env) });
  },
};
