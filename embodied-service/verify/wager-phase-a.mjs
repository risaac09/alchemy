// Phase A wager runner. The real efficacy test the PROPOSAL has asked for from
// the start: embodied-prompt-v5 against the flat control, on Isaac's OWN real
// reflections, generated on the pinned harness (claude-opus-4-8), blind-labeled
// A/B, for a HUMAN to grade by hand. A null result is a real answer.
//
// This is the run that counts. The agent-graded runs in methodology/embodied-ai/
// runs/ were emulation on designed inputs. This one uses real entries, the real
// model call, and your own judgment as the grader.
//
// PRIVACY: your reflections and the generated responses are private. This script
// REQUIRES you to pass an output directory so nothing lands in the public repo.
// Point the reflections file and the output dir at your vault, never at the repo.
//
//   ANTHROPIC_API_KEY=... node wager-phase-a.mjs <reflections.txt> <output-dir>
//
// reflections.txt: one real reflection per line, blank lines ignored.
// Aim for 8 to 12 entries spanning your states (scattered, activated, flat,
// flow, a somatic drop, a quiet win), so the comparison has range.

import fs from "node:fs";
import path from "node:path";
import { V5_SYSTEM_PROMPT, PROMPT_VERSION } from "./prompt-v5.js";
import { FLAT_PROMPT } from "./flat-prompt.js";

const KEY = process.env.ANTHROPIC_API_KEY;
const reflFile = process.argv[2];
const outDir = process.argv[3];

if (!KEY) { console.error("Set ANTHROPIC_API_KEY to run the Phase A wager."); process.exit(2); }
if (!reflFile || !outDir) {
  console.error("Usage: node wager-phase-a.mjs <reflections.txt> <output-dir>");
  console.error("Both are required. Point them at your vault, not the repo, so private text stays out of git.");
  process.exit(2);
}
if (!fs.existsSync(reflFile)) { console.error(`Reflections file not found: ${reflFile}`); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const reflections = fs.readFileSync(reflFile, "utf8")
  .split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

if (reflections.length < 4) {
  console.error(`Only ${reflections.length} reflections found. Add more (8 to 12 is the target) before the run counts.`);
  process.exit(2);
}

async function call(system, userText) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
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

const stamp = new Date().toISOString().slice(0, 10);
const sheet = [
  `# Phase A wager scoresheet (blind)`,
  ``,
  `Prompt under test: ${PROMPT_VERSION} vs the flat control. Date: ${stamp}.`,
  ``,
  `For each item, read both responses and mark which one read the threshold the`,
  `entry was actually about, and met you where you actually were. A / B / tie,`,
  `with one line of why. Do NOT open the key file until you have scored them all.`,
  `A tie is a real answer. A flat win for B is a real answer.`,
  ``,
];
const key = [`# Phase A wager key (do not open until scoring is done)`, ``];

for (let i = 0; i < reflections.length; i++) {
  const refl = reflections[i];
  const [embodied, flat] = await Promise.all([call(V5_SYSTEM_PROMPT, refl), call(FLAT_PROMPT, refl)]);
  const flip = Math.random() < 0.5;
  const A = flip ? embodied : flat;
  const B = flip ? flat : embodied;
  sheet.push(`## Item ${i + 1}\n\n**Your entry:** ${refl}\n\n**A:**\n${A}\n\n**B:**\n${B}\n\n**Which met you better (A / B / tie):** ____   **Why:** \n\n---\n`);
  key.push(`Item ${i + 1}: A = ${flip ? "v5 (embodied)" : "flat"}, B = ${flip ? "flat" : "v5 (embodied)"}`);
  process.stderr.write(`generated item ${i + 1}/${reflections.length}\n`);
}

const sheetPath = path.join(outDir, `phase-a-scoresheet-${stamp}.md`);
const keyPath = path.join(outDir, `phase-a-key-${stamp}.md`);
fs.writeFileSync(sheetPath, sheet.join("\n"));
fs.writeFileSync(keyPath, key.join("\n"));
process.stderr.write(`\nWrote:\n  ${sheetPath}  (score this blind)\n  ${keyPath}  (reveal after scoring)\n`);
process.stderr.write(`\nWhen done: count A/B wins, map them through the key, and record the tally.\n`);
