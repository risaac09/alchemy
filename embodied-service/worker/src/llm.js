// The model call. Raw HTTP fetch to the Claude API, which is the right idiom
// inside a Cloudflare Worker (no SDK needed). Model and parameters follow the
// claude-api reference: claude-opus-4-8, adaptive thinking, refusal handling.
//
// If ANTHROPIC_API_KEY is absent the worker runs in mock mode: a clearly
// labeled placeholder so the UI and the rest of the pipeline are exercisable
// without a key. Live behavior turns on the moment the secret is set.

import { SYSTEM_PROMPT } from "./prompt.js";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-8";

function buildUserContent(text, soma) {
  if (!soma || Object.keys(soma).length === 0) return text;
  // soma is advisory context, clearly labeled as a tentative reading, never an
  // instruction. It is appended after the person's words, not before.
  const parts = Object.entries(soma).map(([k, v]) => `${k}: ${v}`);
  return `${text}\n\n[soma reading, tentative, from the diagnostic: ${parts.join(", ")}]`;
}

export async function generateReflection(env, { text, soma, history = [] }) {
  if (!env.ANTHROPIC_API_KEY) {
    return {
      mode: "mock",
      text:
        "[mock mode: no ANTHROPIC_API_KEY set] I would meet what you wrote " +
        "here and reflect one thread of it back, holding any body read as a " +
        "guess. Set the API key to turn on the live reflection.",
    };
  }

  // Bound the upstream call so a slow or wedged response cannot hold the
  // worker open and run up cost.
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 60_000);

  let resp;
  try {
    resp = await fetch(API_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        thinking: { type: "adaptive" },
        system: SYSTEM_PROMPT,
        messages: [...history, { role: "user", content: buildUserContent(text, soma) }],
      }),
    });
  } catch (e) {
    // Detail is logged by the caller, never returned to the client.
    return { mode: "error", error: ctrl.signal.aborted ? "timeout" : "network", detail: String(e) };
  } finally {
    clearTimeout(timeout);
  }

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    return { mode: "error", error: `api_${resp.status}`, detail: detail.slice(0, 1000) };
  }

  const data = await resp.json();

  // Token usage for the spend cap. Counts even on a refusal that billed output.
  const u = data.usage || {};
  const tokens =
    (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_read_input_tokens || 0);

  // Handle a safety refusal before reading content.
  if (data.stop_reason === "refusal") {
    return {
      mode: "refusal",
      tokens,
      text:
        "I am not able to go there. If this matters to you, a real person is " +
        "the right next step.",
    };
  }

  const out = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return { mode: "live", tokens, text: out || "(empty response)" };
}
