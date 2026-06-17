// Embodied service worker. Entry point and router.
//
// Routes:
//   GET  /api/status   -> SEL gate status + notice (the executable governance)
//   POST /api/reflect  -> { text, soma? } -> guarded reflection
//   everything else    -> static UI assets (env.ASSETS), if bound
//
// Security posture (first cut):
//   - input validation and length cap (guards.validateInput)
//   - deterministic crisis pre-screen that bypasses the model (guards.isCrisis)
//   - CORS restricted to env.ALLOWED_ORIGIN ('*' only as a dev fallback)
//   - best-effort per-IP rate limit (in-isolate; see note below)
//   - request bodies are not logged (privacy by default)

import { validateInput, isCrisis, CRISIS_RESPONSE } from "./guards.js";
import { generateReflection } from "./llm.js";
import { statusPayload, GATE } from "./gate.js";

// Best-effort fixed-window rate limit. Lives in the isolate, so it bounds a hot
// isolate, not the whole fleet. For real per-client limits across the fleet,
// move this to a Durable Object or KV. Documented in the README.
const RATE = { windowMs: 60_000, max: 20 };
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > RATE.windowMs) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > RATE.max;
}

function corsHeaders(env) {
  const origin = env.ALLOWED_ORIGIN || "*";
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
      if (rateLimited(ip)) {
        return json({ error: "rate_limited", retry_after_s: 60 }, 429, env);
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

      const result = await generateReflection(env, { text: v.text, soma: v.soma });
      if (result.mode === "error") {
        return json({ error: result.error, detail: result.detail }, 502, env);
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
