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
      const r = await fetch(API_BASE + "/api/reflect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(soma ? { text, soma } : { text }),
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
