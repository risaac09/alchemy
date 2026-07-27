// Server-side safety guards. Defense in depth: the embodied prompt also carries
// these boundaries, but the model can fail. These deterministic checks run
// BEFORE the model and can short-circuit it, so a missed crisis signal or a
// malformed request never depends on the model behaving.

export const MAX_INPUT_CHARS = 4000;

// Validate and normalize the incoming reflection text.
export function validateInput(body) {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "body must be a JSON object" };
  }
  const text = body.text;
  if (typeof text !== "string") {
    return { ok: false, error: "text must be a string" };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "text is empty" };
  }
  if (trimmed.length > MAX_INPUT_CHARS) {
    return { ok: false, error: `text exceeds ${MAX_INPUT_CHARS} characters` };
  }
  // soma is optional and advisory only. We pass through a small allowlist of
  // fields and ignore anything else, so a caller cannot smuggle instructions.
  let soma = null;
  if (body.soma && typeof body.soma === "object") {
    soma = {};
    for (const k of ["heading", "phase", "altitude", "radius"]) {
      if (typeof body.soma[k] === "string" || typeof body.soma[k] === "number") {
        soma[k] = body.soma[k];
      }
    }
  }

  // history is optional, for multi-turn. The server stays stateless: the client
  // sends prior turns, the server validates and forwards them. The system
  // prompt always lives server-side, so a prior "assistant" turn in the history
  // is content, not an instruction that can move the boundaries.
  const h = validateHistory(body.history);
  if (!h.ok) return { ok: false, error: h.error };

  return { ok: true, text: trimmed, soma, history: h.history };
}

export const MAX_HISTORY_TURNS = 20;
export const MAX_HISTORY_CHARS = 12000;

export function validateHistory(raw) {
  if (raw === undefined || raw === null) return { ok: true, history: [] };
  if (!Array.isArray(raw)) return { ok: false, error: "history must be an array" };
  if (raw.length > MAX_HISTORY_TURNS) {
    return { ok: false, error: `history exceeds ${MAX_HISTORY_TURNS} turns` };
  }
  let total = 0;
  const history = [];
  for (const turn of raw) {
    if (!turn || typeof turn !== "object") {
      return { ok: false, error: "each history turn must be an object" };
    }
    if (turn.role !== "user" && turn.role !== "assistant") {
      return { ok: false, error: "history role must be user or assistant" };
    }
    if (typeof turn.content !== "string") {
      return { ok: false, error: "history content must be a string" };
    }
    total += turn.content.length;
    if (total > MAX_HISTORY_CHARS) {
      return { ok: false, error: `history exceeds ${MAX_HISTORY_CHARS} characters` };
    }
    history.push({ role: turn.role, content: turn.content });
  }
  return { ok: true, history };
}

// Crisis detection. Plain and veiled self-harm language. This mirrors the OV-5
// and OV-8 probes. On a match the worker bypasses the model entirely and
// returns plain care plus resources. False positives are acceptable here: a
// gentle check-in shown to someone who is fine costs little. A miss is the
// failure we refuse.
const CRISIS_PATTERNS = [
  /\bkill (myself|me)\b/i,
  /\b(end|ending|take) (my|this) life\b/i,
  /\bend it all\b/i,
  /\bwant(ing)? to die\b/i,
  /\bi(?:'m| am)? (?:going to|gonna) die\b/i,
  /\bdon'?t want to (?:be here|live|exist|wake up)\b/i,
  /\b(no|whats the|what'?s the) point (anymore|in living|of (?:any of )?(?:this|it))\b/i,
  /\bbetter off without me\b/i,
  /\b(everyone|they'?d|they would) be better off (without me|if i (?:was|were) (?:gone|dead))\b/i,
  /\bhurt(ing)? myself\b/i,
  /\bharm(ing)? myself\b/i,
  /\bcut(ting)? myself\b/i,
  /\bsuicid(e|al)\b/i,
  // veiled / energy-wrapped (OV-8)
  /\bdissolv\w*\b[^.!?]{0,40}\bnot (?:come|coming) back\b/i,
  /\bdisappear\w*\b[^.!?]{0,40}\b(?:forever|for good|not come back)\b/i,
  /\bfade (?:away|out)\b[^.!?]{0,40}\bnot (?:come|coming) back\b/i,
  /\bnot (?:come|coming) back\b[^.!?]{0,40}\b(?:dissolv|disappear|fade|gone)\w*/i,
  /\bcease to exist\b/i,
];

export function isCrisis(text) {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

// The crisis response. Drops the somatic frame entirely. Geography-agnostic,
// with 988 as a US example, not the default. No diagnosis, no counsel.
export const CRISIS_RESPONSE =
  "I want to slow down and be plain with you. What you wrote sounds like real " +
  "pain, and you do not have to carry it alone right now. I am a scaffold, not " +
  "a person, and this is bigger than me.\n\n" +
  "If you can reach a local crisis line, please use it. In the US you can call " +
  "or text 988, the Suicide and Crisis Lifeline, any time. If you are somewhere " +
  "else, a quick search for a crisis line in your country will reach a trained " +
  "person. If you might act on this soon, please reach local emergency services.\n\n" +
  "Is there a person you trust who you could be with, or call, right now?";
