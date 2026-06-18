// The wager test harness. Runs the embodied prompt against the flat control
// prompt on the same set of reflections, blind-labels each pair A/B, and writes
// a scoresheet plus a separate key file. An independent grader (NOT the prompt
// author) scores which response read the threshold the reflection was about,
// then the key reveals which condition won.
//
// A null result is a real answer. If the embodied prompt does not beat the flat
// one, the body map did not earn its place.
//
// Requires ANTHROPIC_API_KEY. Optionally pass a reflections file as argv[2]
// (one reflection per line); otherwise a small placeholder set is used.
//
//   ANTHROPIC_API_KEY=... node verify/wager.mjs [reflections.txt]
//
// Replace the placeholder reflections with Isaac's own real entries before the
// run counts. The placeholders only prove the harness works.

import fs from "node:fs";
import { SYSTEM_PROMPT } from "../worker/src/prompt.js";
import { FLAT_PROMPT } from "./flat-prompt.js";

const KEY = process.env.ANTHROPIC_API_KEY;
if (!KEY) {
  console.error("Set ANTHROPIC_API_KEY to run the wager test.");
  process.exit(2);
}

const PLACEHOLDERS = [
  "the edit and the pitch and i still havent called marcus and the room felt off today and my hip is killing me",
  "the client killed the cut I bled for and I want to torch the whole project",
  "in it, shipping, do not stop me, just keeping a note",
  "nothing today, flat, sat in the chair, that is the whole entry",
  "my gut dropped when she said the funding fell through and I have not been able to eat",
  "I keep circling the same decision and my chest goes tight every time I open the doc",
];

const reflections = process.argv[2]
  ? fs.readFileSync(process.argv[2], "utf8").split("\n").map((l) => l.trim()).filter(Boolean)
  : PLACEHOLDERS;

async function call(system, userText) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system,
      messages: [{ role: "user", content: userText }],
    }),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
  const data = await r.json();
  if (data.stop_reason === "refusal") return "(refusal)";
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
}

const sheet = [`# Wager scoresheet (blind)\n\nFor each item, mark which response read the threshold the entry was about, and why. A / B / tie.\n`];
const key = [`# Wager key (do not show the grader until scoring is done)\n`];

for (let i = 0; i < reflections.length; i++) {
  const refl = reflections[i];
  const [embodied, flat] = await Promise.all([call(SYSTEM_PROMPT, refl), call(FLAT_PROMPT, refl)]);
  const flip = Math.random() < 0.5;
  const A = flip ? embodied : flat;
  const B = flip ? flat : embodied;
  sheet.push(
    `\n## Item ${i + 1}\n\n**Entry:** ${refl}\n\n**A:** ${A}\n\n**B:** ${B}\n\n**Which read the threshold better (A / B / tie):** ____   **Why:** \n`
  );
  key.push(`Item ${i + 1}: A = ${flip ? "embodied" : "flat"}, B = ${flip ? "flat" : "embodied"}`);
  console.error(`scored item ${i + 1}/${reflections.length}`);
}

const stamp = new Date().toISOString().slice(0, 10);
fs.writeFileSync(`wager-scoresheet-${stamp}.md`, sheet.join("\n"));
fs.writeFileSync(`wager-key-${stamp}.md`, key.join("\n"));
console.error(`\nWrote wager-scoresheet-${stamp}.md (for the blind grader) and wager-key-${stamp}.md (reveal after scoring).`);
