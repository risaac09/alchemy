// Embodied reflection UI. Vanilla JS, talks to the worker's /api routes.
(function () {
  "use strict";

  const API_BASE = localStorage.getItem("embodied_api_base") || "";
  const $ = (id) => document.getElementById(id);
  const thread = $("thread");
  const form = $("form");
  const textEl = $("text");
  const pulseEl = $("pulse");
  const sendBtn = $("send");
  const stateEl = $("state");

  // Conversation history, sent with each turn so the stateless worker can hold
  // a thread. Capped to stay under the server's limits.
  const MAX_TURNS = 20;
  let history = [];
  function remember(role, content) {
    history.push({ role, content });
    if (history.length > MAX_TURNS) history = history.slice(-MAX_TURNS);
  }

  function addMessage(role, text, opts = {}) {
    const el = document.createElement("div");
    el.className = "msg " + role;
    if (opts.tag) {
      const tag = document.createElement("span");
      tag.className = "tag" + (opts.pulse ? " pulse-tag" : "");
      tag.textContent = opts.tag;
      el.appendChild(tag);
    }
    el.appendChild(document.createTextNode(text));
    thread.appendChild(el);
    thread.scrollTop = thread.scrollHeight;
    return el;
  }

  async function loadStatus() {
    try {
      const r = await fetch(API_BASE + "/api/status");
      const s = await r.json();
      $("notice").textContent = s.notice || "";
      $("exposure").textContent =
        "exposure level " + s.exposure_level + " · prompt " + s.prompt_version +
        (s.gate_cleared ? "" : " · gate not cleared (experimental)");
    } catch {
      $("notice").textContent =
        "Status unavailable. The reflection still runs; treat it as experimental.";
    }
  }

  async function send(text, soma) {
    sendBtn.disabled = true;
    stateEl.textContent = "settling…";
    try {
      const payload = { text, history };
      if (soma) payload.soma = soma;
      const r = await fetch(API_BASE + "/api/reflect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) {
        addMessage("them", "Something went wrong: " + (data.error || r.status), {
          tag: "error",
        });
        return;
      }
      const role = data.mode === "crisis" ? "crisis" : "them";
      const tag = data.mode === "crisis" ? "stepping out of the frame" : data.mode;
      addMessage(role, data.text, { tag });
      // Record both sides so the next turn carries the thread. Crisis replies
      // come from the server guard, not the model, but keeping them in the
      // thread is honest about what was said.
      remember("user", text);
      remember("assistant", data.text);
    } catch (e) {
      addMessage("them", "Network error. Try again.", { tag: "error" });
    } finally {
      sendBtn.disabled = false;
      stateEl.textContent = "";
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const text = textEl.value.trim();
    if (!text) return;
    const pulse = pulseEl.value.trim();
    addMessage("me", text, pulse ? { tag: "pulse: " + pulse, pulse: true } : {});
    const soma = pulse ? { heading: pulse } : null;
    textEl.value = "";
    pulseEl.value = "";
    send(text, soma);
  });

  // Cmd/Ctrl+Enter submits from the textarea.
  textEl.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      form.requestSubmit();
    }
  });

  loadStatus();
})();
