/* Alchemy embed funnel: the marketing / lead-capture layer.
 *
 * Loaded ONLY by embed.html. The free PWA (index.html) never includes this file,
 * so app.js carries no name field, no email gate, no booking CTA, and no lead
 * postMessage. This is the physical separation between the account-less tool and
 * the Rubinstein Productions sales skin.
 *
 * Transport is postMessage only. The email is never stored or sent by this code;
 * it is posted to the parent frame, and the host page (rubinsteinproductions.com)
 * owns capture. No server, no analytics, no persistence here.
 *
 * Contract: this file sets window.AlchemyEmbedFunnel, a set of optional hooks the
 * diagnostic in app.js calls if present:
 *   landingField(diagState) -> html     name field for the landing
 *   onStart() -> { name }               read the name, post 'started'
 *   wantsGate() -> bool                 interpose the email gate before the report
 *   gateView(diagState) -> html         the email-gate view
 *   reportExtra(diagnostic) -> html     the booking CTA on the report
 *   onComplete(scores, quadrant)        post 'complete'
 *   handleAction(action, target, ctx)   own the gate's actions; ctx = {diagState, commit, render}
 */
(function () {
  'use strict';

  // Activate only as a marketing embed. If this file is ever loaded outside an
  // embed (it should not be), it stays inert and the diagnostic runs pure.
  if (!document.body || document.body.dataset.embed !== 'true') return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function post(type, payload) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(Object.assign({ type: type }, payload || {}), '*');
      }
    } catch (e) {}
  }

  // Funnel styles live here too, so the whole skin is one file. The diagnostic's
  // own classes (.diag-btn-primary, .diag-eyebrow, .diag-heading, .diag-lede) stay
  // in app.css and resolve the same CSS variables.
  var css =
    '.diag-gate { max-width: 480px; margin: 24px auto; text-align: left; }' +
    '.diag-field { margin-bottom: 16px; max-width: 480px; }' +
    '.diag-field-label { display: block; font-family: var(--font-mono); font-size: 0.74rem; letter-spacing: 0.08em; color: var(--parchment-dim); margin-bottom: 6px; }' +
    '.diag-field-opt { opacity: 0.55; }' +
    '.diag-field-input { width: 100%; box-sizing: border-box; background: var(--parchment-ghost); border: 1px solid var(--parchment-ghost); color: var(--parchment); font-family: var(--font-serif); font-size: 0.95rem; padding: 10px 12px; border-radius: 2px; }' +
    '.diag-field-input:focus { outline: none; border-color: var(--amber-dim); }' +
    '.diag-gate-actions { display: flex; align-items: center; gap: 6px; }' +
    '.diag-btn-text { background: transparent; border: none; color: var(--parchment-dim); font-family: var(--font-mono); font-size: 0.8rem; cursor: pointer; padding: 8px 10px; }' +
    '.diag-btn-text:hover { color: var(--parchment); }' +
    '.diag-booking-wrap { margin: 18px 0 4px; }' +
    '.diag-booking { display: inline-block; font-family: var(--font-mono); font-size: 0.82rem; letter-spacing: 0.04em; color: var(--amber); text-decoration: none; border-bottom: 1px solid var(--amber-dim); padding-bottom: 2px; }' +
    '.diag-booking:hover { color: var(--parchment); border-color: var(--parchment-dim); }';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  window.AlchemyEmbedFunnel = {
    landingField: function (diagState) {
      return '<div class="diag-field"><label class="diag-field-label" for="diag-name">Your name <span class="diag-field-opt">(optional)</span></label>' +
        '<input id="diag-name" class="diag-field-input" type="text" maxlength="60" autocomplete="off" placeholder="e.g. Sarah" value="' + esc(diagState.name) + '"></div>';
    },

    onStart: function () {
      var input = document.getElementById('diag-name');
      var name = input ? input.value.trim() : '';
      post('started');
      return { name: name };
    },

    wantsGate: function () { return true; },

    gateView: function (diagState) {
      var greeting = diagState.name ? ', ' + esc(diagState.name) : '';
      return '<div class="diag-gate">' +
        '<div class="diag-eyebrow">YOUR RESULTS ARE READY</div>' +
        '<h2 class="diag-heading">Your report is ready' + greeting + '.</h2>' +
        '<p class="diag-lede">Leave an email and I\'ll follow up once you\'ve sat with it. No sequences, no automation.</p>' +
        '<div class="diag-field">' +
          '<label class="diag-field-label" for="diag-gate-email">Email <span class="diag-field-opt">(optional)</span></label>' +
          '<input id="diag-gate-email" class="diag-field-input" type="email" autocomplete="email" placeholder="you@example.com" value="' + esc(diagState.email) + '">' +
        '</div>' +
        '<div class="diag-gate-actions">' +
          '<button class="diag-btn-primary" data-diag="show-report">See my report →</button>' +
          '<button class="diag-btn-text" data-diag="skip-email">Skip</button>' +
        '</div>' +
      '</div>';
    },

    reportExtra: function (diagnostic) {
      var subj = encodeURIComponent('Information metabolism: ' + diagnostic.quadrant);
      return '<div class="diag-booking-wrap"><a class="diag-booking" href="mailto:isaac@rubinsteinproductions.com?subject=' + subj + '">Talk it through with Isaac →</a></div>';
    },

    onComplete: function (scores, quadrant) {
      post('complete', { scores: scores, quadrant: quadrant });
    },

    handleAction: function (action, target, ctx) {
      if (action === 'skip-email') {
        ctx.commit();
        ctx.diagState.view = 'report';
        ctx.render();
        return true;
      }
      if (action === 'show-report' && ctx.diagState.view === 'embed-gate') {
        var input = document.getElementById('diag-gate-email');
        ctx.diagState.email = input ? input.value.trim() : '';
        if (ctx.diagState.email) post('email', { email: ctx.diagState.email });
        ctx.commit();
        ctx.diagState.view = 'report';
        ctx.render();
        return true;
      }
      return false;
    }
  };
})();
