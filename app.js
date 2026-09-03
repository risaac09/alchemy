(function() {
  'use strict';

  // ═══════════════════════════════════════════════
  //  THERMODYNAMIC CONSTANTS
  // ═══════════════════════════════════════════════
  const VERSION = '1.5.0';
  const BASE_MAX_CAPACITY = 7;     // Cassette tape finitude (default)
  let MAX_CAPACITY = BASE_MAX_CAPACITY; // Mutated by diagnostic-reactive tuning
  const DECAY_MS = 72 * 3600000;   // 72 hours to full decay
  const SETTLE_MS = 30000;         // 30 seconds before item is reflectable
  const TICK_INTERVAL = 5000;      // UI refresh every 5s
  const LINK_COOLING_MS = 4 * 3600000; // 4 hours before links become clickable
  const ARCHIVE_DECAY_MS = 90 * 86400000; // 90 days archive decay
  const BASE_RESURFACE_INTERVAL_MS = 3 * 86400000; // Default: re-surface one item every 3 days
  let RESURFACE_INTERVAL_MS = BASE_RESURFACE_INTERVAL_MS;

  // ═══════════════════════════════════════════════
  //  STATE
  // ═══════════════════════════════════════════════
  const STORAGE_KEY = 'alchemy_v2';

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (!s.stats) s.stats = { totalKept: 0, totalReleased: 0 };
        if (!s.events) s.events = [];
        if (!s.lastResurface) s.lastResurface = 0;
        if (!s.errors) s.errors = [];
        if (!s.thresholds) s.thresholds = [];
        if (!s.frictionLog) s.frictionLog = [];
        if (!s.firstOpenDate) s.firstOpenDate = null;
        if (!s.lastActiveDate) s.lastActiveDate = null;
        if (!s.diagnostic) s.diagnostic = null;
        return s;
      }
    } catch(e) {}
    return { inbox: [], archive: [], stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: 0, firstOpenDate: null, lastActiveDate: null };
  }

  function logEvent(type, meta) {
    const now = Date.now();
    state.events.push({ type, ts: now, ...meta });
    state.lastActiveDate = now;
    // Keep last 200 events
    if (state.events.length > 200) state.events = state.events.slice(-200);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      showToast('Storage full — release some items or clear image attachments');
    }
  }

  let state = loadState();

  // Diagnostic-reactive tuning. The hard rule is finitude — we never INCREASE
  // capacity above the baseline or shorten the resurface interval. Low intake
  // or low return-flow scores pull the constants tighter (smaller inbox, longer
  // resurface window) so the tool matches the user's measured practice.
  function applyDiagnosticTuning() {
    MAX_CAPACITY = BASE_MAX_CAPACITY;
    RESURFACE_INTERVAL_MS = BASE_RESURFACE_INTERVAL_MS;
    const d = state.diagnostic;
    if (!d || !d.scores) return;
    if (d.scores.intake <= 2) MAX_CAPACITY = 5;       // cluttered intake → tighter cap
    if (d.scores.returnFlow <= 2) RESURFACE_INTERVAL_MS = 5 * 86400000; // pipe-like → stretch window
  }
  applyDiagnosticTuning();
  if (!state.errors) state.errors = [];
  if (!state.lastNotificationTs) state.lastNotificationTs = 0;
  if (!state.thresholds) state.thresholds = [];
  if (!state.frictionLog) state.frictionLog = [];
  if (!state.firstOpenDate) { state.firstOpenDate = Date.now(); saveState(); }
  if (!state.lastActiveDate) state.lastActiveDate = null;
  let currentItemId = null;
  let currentGold = null;
  let pendingArchiveRelease = null; // index of archive item awaiting release confirmation
  let pendingMap = ''; // map type selected in release modal
  let pendingRubricKeep = false; // true while rubric form is visible after clicking Keep
  const RUBRIC_DIMS = ['clarity', 'integrity', 'somatic', 'transmutation', 'release'];
  let currentRubric = null;

  // ═══════════════════════════════════════════════
  //  ERROR TRACKING
  // ═══════════════════════════════════════════════
  function logError(msg, source) {
    state.errors.push({ msg: String(msg).slice(0, 200), source: source || '', ts: Date.now() });
    if (state.errors.length > 50) state.errors = state.errors.slice(-50);
    saveState();
  }

  window.onerror = function(msg, src, line, col) {
    logError(msg, `${src}:${line}:${col}`);
  };

  window.addEventListener('unhandledrejection', function(e) {
    logError(e.reason, 'promise');
  });

  // ═══════════════════════════════════════════════
  //  DOM REFS
  // ═══════════════════════════════════════════════
  const $ = id => document.getElementById(id);

  const shell = document.querySelector('.shell');
  const captureArea = $('captureArea');
  const captureInput = $('captureInput');
  const captureBtn = $('captureBtn');
  const capacityWarning = $('capacityWarning');
  const dropOverlay = $('dropOverlay');
  const attachBtn = $('attachBtn');
  const fileInput = $('fileInput');
  const captureAttachment = $('captureAttachment');
  const attachIcon = $('attachIcon');
  const attachThumb = $('attachThumb');
  const attachName = $('attachName');
  const attachSize = $('attachSize');
  const attachRemove = $('attachRemove');
  const reflectMatterRich = $('reflectMatterRich');
  const goldMatterRich = $('goldMatterRich');
  const capacitySlots = $('capacitySlots');
  const capacityLabel = $('capacityLabel');
  const fadingIndicator = $('fadingIndicator');
  const inboxList = $('inboxList');
  const inboxEmpty = $('inboxEmpty');
  const restState = $('restState');
  const reflectMatter = $('reflectMatter');
  const reflectPrompt = $('reflectPrompt');
  const reflectInput = $('reflectInput');
  const reflectBack = $('reflectBack');
  const alchemizeBtn = $('alchemizeBtn');
  const goldMatter = $('goldMatter');
  const goldReflection = $('goldReflection');
  const goldResult = $('goldResult');
  const goldCombined = $('goldCombined');
  const goldBack = $('goldBack');
  const releaseBtn = $('releaseBtn');
  const releaseModal = $('releaseModal');
  const releaseModalInner = $('releaseModalInner');
  const modalKeep = $('modalKeep');
  const modalLetGo = $('modalLetGo');
  const modalCancel = $('modalCancel');
  const modalCost = $('modalCost');
  const archiveList = $('archiveList');
  const archiveEmpty = $('archiveEmpty');
  const archiveCarryingCost = $('archiveCarryingCost');
  const archiveSearch = $('archiveSearch');
  const archiveSortBtn = $('archiveSortBtn');
  const archiveSelectBtn = $('archiveSelectBtn');
  const bulkReleaseBar = $('bulkReleaseBar');
  const bulkReleaseCount = $('bulkReleaseCount');
  const bulkReleaseBtn = $('bulkReleaseBtn');
  const bulkCancelBtn = $('bulkCancelBtn');
  const tapeCounter = $('tapeCounter');
  const reelLeft = $('reelLeft');
  const reelRight = $('reelRight');
  const inboxCount = $('inboxCount');
  const archiveCount = $('archiveCount');
  const cycleGlyph = $('cycleGlyph');
  const cycleTooltip = $('cycleTooltip');
  const ascendencyFill = $('ascendencyFill');
  if (cycleGlyph) {
    cycleGlyph.addEventListener('click', (e) => { e.stopPropagation(); cycleGlyph.classList.toggle('open'); });
    document.addEventListener('click', () => cycleGlyph.classList.remove('open'));
  }
  const ascendencyLabel = $('ascendencyLabel');
  const toast = $('toast');

  const views = {
    inbox: $('viewInbox'),
    reflect: $('viewReflect'),
    gold: $('viewGold'),
    archive: $('viewArchive'),
    log: $('viewLog'),
    diagnostic: $('viewDiagnostic')
  };

  const navBtns = {
    inbox: $('navInbox'),
    archive: $('navArchive'),
    log: $('navLog'),
    diagnostic: $('navDiagnostic')
  };

  const logContent = $('logContent');
  const bodyCheckInput = $('bodyCheckInput');
  const vocabToggle = $('vocabToggle');
  const vocabPanel = $('vocabPanel');
  if (vocabToggle && vocabPanel) {
    vocabToggle.addEventListener('click', () => {
      const open = vocabPanel.hasAttribute('hidden') ? false : true;
      if (open) { vocabPanel.setAttribute('hidden', ''); vocabToggle.setAttribute('aria-expanded', 'false'); vocabToggle.textContent = "can't find a word?"; }
      else { vocabPanel.removeAttribute('hidden'); vocabToggle.setAttribute('aria-expanded', 'true'); vocabToggle.textContent = 'hide vocabulary'; }
    });
  }
  const modalMapSelect = $('modalMapSelect');
  const modalMapOptions = $('modalMapOptions');
  const archiveMapFilter = $('archiveMapFilter');
  const restMessage = $('restMessage');
  const restHint = $('restHint');
  const emptyMessage = $('emptyMessage');
  const emptyHint = $('emptyHint');

  // ═══════════════════════════════════════════════
  //  CONTEXTUAL REFLECTION PROMPTS
  // ═══════════════════════════════════════════════
  const promptPools = {
    link: [
      "What made you stop scrolling for this?",
      "If this URL disappeared tomorrow, what would you reconstruct from memory?",
      "Is this something you want to think — or something you want to have read?",
      "What would change in your life if you actually acted on this?",
      "Who showed you this, and why does that matter?",
      "What's the one idea here worth keeping? Just one.",
      "Are you saving this to engage with it, or to avoid the guilt of ignoring it?",
      "What does this link say about what you're paying attention to right now?"
    ],
    image: [
      "What's happening outside the frame?",
      "Where were you when this mattered?",
      "What feeling does this image hold that words don't?",
      "If you had to title this, what would you call it?",
      "What does this remind you of that you haven't thought about in a while?",
      "Is this beautiful, or is it evidence?"
    ],
    document: [
      "What's the one thing in here you didn't already know?",
      "If you had to summarize this in one breath, what would you say?",
      "Is this reference material, or is it something that needs to change how you think?",
      "What question were you trying to answer when you found this?",
      "What would you tell someone who asked why you kept this?"
    ],
    text: [
      "What does this stir in you?",
      "If this were ash tomorrow, what part would you miss?",
      "Is this yours, or are you rehearsing someone else's idea?",
      "What's underneath this?",
      "Say the quiet part out loud.",
      "Why now? Why not last week?",
      "Where does this land in your body?",
      "What would a wiser version of you do with this?",
      "Is this signal or noise?",
      "Does this deserve a place in your permanent memory?",
      "What would you lose by ignoring this completely?",
      "What's the one sentence version?",
      "Where does this connect to something you already know?"
    ],
    resurfaced: [
      "You kept this once. Is it still worth carrying?",
      "Has this gotten heavier or lighter since you last held it?",
      "If you hadn't already kept this, would you keep it today?",
      "What has changed since you first found this important?",
      "Is this still yours, or has it become furniture?",
      "Does this still teach you something, or are you just attached?"
    ],
    digested: [
      "You read it. What stays with you?",
      "In one sentence — what did you actually learn?",
      "Did this change how you think, or just how much you've read?",
      "What's the one idea worth extracting from this?",
      "Was this worth the wait?",
      "If you had to teach someone one thing from this, what would it be?"
    ]
  };

  function randomPrompt(type) {
    const pool = promptPools[type] || promptPools.text;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ═══════════════════════════════════════════════
  //  FILE & LINK HANDLING
  // ═══════════════════════════════════════════════
  let pendingAttachment = null; // { fileName, fileType, fileSize, preview, type: 'image'|'document' }

  const URL_PATTERN = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/;
  const URL_REGEX_G = new RegExp(URL_PATTERN.source, 'gi');

  function detectUrls(text) {
    return text.match(URL_REGEX_G) || [];
  }

  function isUrl(text) {
    const trimmed = text.trim();
    return URL_PATTERN.test(trimmed) && trimmed.split(/\s+/).length <= 3;
  }

  function classifyItemType(item) {
    if (item.type) return item.type; // already classified
    if (item.fileType && item.fileType.startsWith('image/')) return 'image';
    if (item.fileName) return 'document';
    if (isUrl(item.text || item.matter || '')) return 'link';
    return 'text';
  }

  function fileIcon(mimeType, fileName) {
    if (!mimeType && fileName) {
      const ext = fileName.split('.').pop().toLowerCase();
      const map = { pdf: '📄', txt: '📝', md: '📝', csv: '📊', json: '{ }', html: '🌐', xml: '🌐', doc: '📄', docx: '📄', rtf: '📄' };
      return map[ext] || '📎';
    }
    if (mimeType.startsWith('image/')) return '🖼';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('json')) return '{ }';
    if (mimeType.includes('csv') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('text')) return '📝';
    return '📎';
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  // Resize image to thumbnail for localStorage (max 240px)
  function resizeImageToThumb(dataUrl, maxDim) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxDim) { h = h * maxDim / w; w = maxDim; } }
        else { if (h > maxDim) { w = w * maxDim / h; h = maxDim; } }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  // Read file and create attachment object
  function processFile(file) {
    return new Promise((resolve) => {
      const isImage = file.type.startsWith('image/');
      const isText = file.type.startsWith('text/') ||
        /\.(txt|md|csv|json|html|xml|rtf)$/i.test(file.name) ||
        file.type.includes('json');

      const reader = new FileReader();

      if (isImage) {
        reader.onload = async (e) => {
          const thumb = await resizeImageToThumb(e.target.result, 240);
          resolve({
            type: 'image',
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            preview: thumb
          });
        };
        reader.readAsDataURL(file);
      } else if (isText) {
        reader.onload = (e) => {
          const text = e.target.result;
          // Store first 2000 chars as excerpt
          resolve({
            type: 'document',
            fileName: file.name,
            fileType: file.type || 'text/plain',
            fileSize: file.size,
            preview: text.slice(0, 2000)
          });
        };
        reader.readAsText(file);
      } else {
        // Binary files (PDF, etc.) — store metadata only
        resolve({
          type: 'document',
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          preview: null
        });
      }
    });
  }

  function showAttachmentPreview(att) {
    pendingAttachment = att;
    captureAttachment.classList.add('visible');
    attachIcon.textContent = fileIcon(att.fileType, att.fileName);
    attachName.textContent = att.fileName;
    attachSize.textContent = formatFileSize(att.fileSize);

    if (att.type === 'image' && att.preview) {
      attachThumb.src = att.preview;
      attachThumb.style.display = 'block';
      attachIcon.style.display = 'none';
    } else {
      attachThumb.style.display = 'none';
      attachIcon.style.display = 'block';
    }
  }

  function clearAttachment() {
    pendingAttachment = null;
    captureAttachment.classList.remove('visible');
    attachThumb.style.display = 'none';
    fileInput.value = '';
  }

  // Render text with clickable links (match on raw text, then escape non-URL parts)
  // When cooled=false, URLs render as plain text (not clickable)
  function urlDisplayText(url) {
    try {
      const u = new URL(url);
      let display = u.hostname.replace(/^www\./, '');
      if (u.pathname && u.pathname !== '/') {
        const path = u.pathname.replace(/\/$/, '');
        display += path.length > 28 ? path.slice(0, 28) + '…' : path;
      }
      return display;
    } catch(e) { return url.length > 40 ? url.slice(0, 40) + '…' : url; }
  }

  function renderMatterHtml(text, cooled) {
    if (cooled === undefined) cooled = true;
    const parts = [];
    let lastIndex = 0;
    let match;
    const re = new RegExp(URL_PATTERN.source, 'gi');
    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(escapeHtml(text.slice(lastIndex, match.index)));
      }
      const url = match[0];
      if (cooled) {
        parts.push(`<a href="${escapeHtml(url)}" class="matter-link" target="_blank" rel="noopener">${escapeHtml(urlDisplayText(url))}</a>`);
      } else {
        parts.push(`<span class="matter-link-cooling">${escapeHtml(urlDisplayText(url))}</span>`);
      }
      lastIndex = re.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(escapeHtml(text.slice(lastIndex)));
    }
    return parts.join('');
  }

  // Render rich content (image/file badge/excerpt) for an item
  function renderRichContent(item) {
    const type = classifyItemType(item);
    let html = '';

    if (type === 'image' && item.preview) {
      html += `<img class="matter-image" src="${item.preview}" alt="${escapeHtml(item.fileName || 'image')}" />`;
    }

    if (type === 'document' && item.fileName) {
      html += `<div class="matter-file-badge">
        <span class="matter-file-badge-icon">${fileIcon(item.fileType, item.fileName)}</span>
        <span class="matter-file-badge-name">${escapeHtml(item.fileName)}</span>
        <span class="matter-file-badge-size">${formatFileSize(item.fileSize || 0)}</span>
      </div>`;
      if (item.preview) {
        html += `<div class="matter-excerpt">${escapeHtml(item.preview)}</div>`;
      }
    }

    return html;
  }

  // ═══════════════════════════════════════════════
  //  THERMODYNAMIC CALCULATIONS
  // ═══════════════════════════════════════════════

  // Decay: 0 (fresh) → 1 (fully decayed)
  function decayRatio(item) {
    const age = Date.now() - item.created;
    return Math.min(age / DECAY_MS, 1);
  }

  // Is item still in settle cooldown?
  function isSettling(item) {
    return (Date.now() - item.created) < SETTLE_MS;
  }

  // Settle time remaining in seconds
  function settleRemaining(item) {
    return Math.max(0, Math.ceil((SETTLE_MS - (Date.now() - item.created)) / 1000));
  }

  // Is a link item still in cooling period?
  function isCooling(item) {
    return item.type === 'link' && (Date.now() - item.created) < LINK_COOLING_MS;
  }

  // Cooling time remaining in seconds
  function coolingRemaining(item) {
    return Math.max(0, Math.ceil((LINK_COOLING_MS - (Date.now() - item.created)) / 1000));
  }

  // Format seconds as Xh Xm or Xm Xs
  function formatCooling(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return h + 'h ' + m + 'm';
    const s = secs % 60;
    return m + 'm ' + s + 's';
  }

  // Emergy cost: hours alive (metaphorical "metabolic cost")
  function emergyCost(item) {
    const hours = (Date.now() - item.created) / 3600000;
    if (hours < 1) return 'under an hour';
    return Math.floor(hours) + 'h';
  }

  // Carrying cost for archive
  function totalCarryingCost() {
    if (state.archive.length === 0) return '';
    let totalHours = 0;
    state.archive.forEach(item => {
      totalHours += (Date.now() - (item.archived || item.transmuted || Date.now())) / 3600000;
    });
    const days = Math.floor(totalHours / 24);
    if (days < 1) return state.archive.length + ' items · < 1d carrying cost';
    return state.archive.length + ' items · ' + days + 'd carrying cost';
  }

  // Ascendency: ratio of kept vs total processed
  function ascendencyRatio() {
    const total = state.stats.totalKept + state.stats.totalReleased;
    if (total === 0) return 0.4; // default healthy
    return state.stats.totalKept / total;
  }

  // Adaptive cycle phase
  function adaptiveCyclePhase() {
    const inboxLen = state.inbox.length;
    const archiveLen = state.archive.length;
    const total = state.stats.totalKept + state.stats.totalReleased;

    // α — Reorganization: empty state after having released
    if (inboxLen === 0 && archiveLen === 0 && total > 0) {
      return { glyph: 'α', label: 'Reorganization — renewal', desc: 'Fresh start after release' };
    }
    // Ω — Release: just did a burst of releasing (released > kept recently)
    if (state.stats.totalReleased > state.stats.totalKept && total > 2) {
      return { glyph: 'Ω', label: 'Release — creative destruction', desc: 'Letting go to make room' };
    }
    // K — Conservation: inbox full or near full, or archive heavy
    if (inboxLen >= MAX_CAPACITY - 1 || archiveLen > 10) {
      return { glyph: 'K', label: 'Conservation — rigidity risk', desc: 'High connectivity, watch for brittleness' };
    }
    // r — Exploitation: active capture, growing
    return { glyph: 'r', label: 'Exploitation — rapid growth', desc: 'Capturing and exploring' };
  }

  // ═══════════════════════════════════════════════
  //  BIODEGRADABLE DECAY — auto-dissolve
  // ═══════════════════════════════════════════════
  function processDecay() {
    const now = Date.now();
    const decayed = state.inbox.filter(item => (now - item.created) >= DECAY_MS);

    if (decayed.length > 0) {
      state.inbox = state.inbox.filter(item => (now - item.created) < DECAY_MS);
      state.stats.totalReleased += decayed.length;
      saveState();

      if (currentView === 'inbox') renderInbox();

      const word = decayed.length === 1 ? 'item' : 'items';
      showToast(`${decayed.length} ${word} returned to noise — unattended decay`);
    }
  }

  // ═══════════════════════════════════════════════
  //  VIEW SWITCHING
  // ═══════════════════════════════════════════════
  let currentView = 'inbox';

  // Loop strip: where the person is in the loop. Reflect and gold views carry
  // one; the strip lists every station and this marks done / current.
  const LOOP_STEPS = ['inhale', 'settle', 'pulse', 'reflect', 'alchemize', 'map', 'release'];
  const LOOP_VIEW_STEPS = { reflect: ['pulse', 'reflect'], gold: ['map', 'release'] };
  function setLoopStep(current) {
    const firstIdx = LOOP_STEPS.indexOf(current[0]);
    document.querySelectorAll('.loop-strip li').forEach(li => {
      const i = LOOP_STEPS.indexOf(li.dataset.step);
      li.classList.toggle('done', i < firstIdx);
      li.classList.toggle('current', current.includes(li.dataset.step));
    });
  }

  function showView(name) {
    currentView = name;
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[name].classList.add('active');
    Object.values(navBtns).forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    if (navBtns[name]) { navBtns[name].classList.add('active'); navBtns[name].setAttribute('aria-selected', 'true'); }
    // Focused views (reflect/gold) hide the chrome so content starts at top
    shell.classList.toggle('shell--focused', name === 'reflect' || name === 'gold');
    if (LOOP_VIEW_STEPS[name]) setLoopStep(LOOP_VIEW_STEPS[name]);
  }

  navBtns.inbox.addEventListener('click', () => { showView('inbox'); renderInbox(); });
  navBtns.archive.addEventListener('click', () => { showView('archive'); renderArchive(); });
  navBtns.log.addEventListener('click', () => { showView('log'); renderLog(); });
  navBtns.diagnostic.addEventListener('click', () => { showView('diagnostic'); renderDiagnostic(); });

  // ═══════════════════════════════════════════════
  //  MAP SELECTION (release modal)
  // ═══════════════════════════════════════════════
  function resetMapButtons() {
    if (!modalMapOptions) return;
    modalMapOptions.querySelectorAll('.modal-map-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.map === '');
    });
    pendingMap = '';
  }

  if (modalMapOptions) {
    modalMapOptions.addEventListener('click', (e) => {
      const btn = e.target.closest('.modal-map-btn');
      if (!btn) return;
      modalMapOptions.querySelectorAll('.modal-map-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pendingMap = btn.dataset.map || '';
    });
  }

  // ═══════════════════════════════════════════════
  //  ARCHIVE MAP FILTER
  // ═══════════════════════════════════════════════
  let archiveMapQuery = '';

  if (archiveMapFilter) {
    archiveMapFilter.addEventListener('click', (e) => {
      const btn = e.target.closest('.archive-map-filter-btn');
      if (!btn) return;
      archiveMapFilter.querySelectorAll('.archive-map-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      archiveMapQuery = btn.dataset.map || '';
      renderArchive();
    });
  }

  // ═══════════════════════════════════════════════
  //  CAPTURE
  // ═══════════════════════════════════════════════
  function updateCaptureState() {
    const full = state.inbox.length >= MAX_CAPACITY;
    captureInput.disabled = full;
    captureBtn.disabled = full;
    capacityWarning.classList.toggle('visible', full);
    // Compact capture when items exist — textarea shrinks, expands on focus
    captureArea.classList.toggle('capture-compact', state.inbox.length > 0);
  }

  captureBtn.addEventListener('click', () => {
    const text = captureInput.value.trim();
    if ((!text && !pendingAttachment) || state.inbox.length >= MAX_CAPACITY) return;

    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: text,
      created: Date.now()
    };

    if (pendingAttachment) {
      item.type = pendingAttachment.type;
      item.fileName = pendingAttachment.fileName;
      item.fileType = pendingAttachment.fileType;
      item.fileSize = pendingAttachment.fileSize;
      item.preview = pendingAttachment.preview;
    } else {
      item.type = classifyItemType(item);
    }

    state.inbox.push(item);
    logEvent('capture', { itemType: item.type });
    saveState();
    captureInput.value = '';
    clearAttachment();
    renderInbox();
    manageSettleTick();
    showToast('Inhaled');
  });

  captureInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) captureBtn.click();
  });

  // ═══════════════════════════════════════════════
  //  FILE ATTACHMENT WIRING
  // ═══════════════════════════════════════════════
  attachBtn.addEventListener('click', () => {
    if (state.inbox.length >= MAX_CAPACITY) return;
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const att = await processFile(file);
    showAttachmentPreview(att);
    if (!captureInput.value.trim()) {
      captureInput.value = file.name;
    }
  });

  attachRemove.addEventListener('click', () => clearAttachment());

  // ═══════════════════════════════════════════════
  //  DRAG AND DROP
  // ═══════════════════════════════════════════════
  let dragCounter = 0;

  captureArea.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    captureArea.classList.add('drag-over');
  });

  captureArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      captureArea.classList.remove('drag-over');
    }
  });

  captureArea.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  captureArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    captureArea.classList.remove('drag-over');

    if (state.inbox.length >= MAX_CAPACITY) return;

    // Check for dropped text/URL first
    const droppedText = e.dataTransfer.getData('text/plain');
    if (droppedText && !e.dataTransfer.files.length) {
      captureInput.value = droppedText;
      captureInput.focus();
      return;
    }

    // Handle dropped files
    const file = e.dataTransfer.files[0];
    if (file) {
      const att = await processFile(file);
      showAttachmentPreview(att);
      if (!captureInput.value.trim()) {
        captureInput.value = file.name;
      }
    }
  });

  // ═══════════════════════════════════════════════
  //  CAPACITY BAR
  // ═══════════════════════════════════════════════
  function renderCapacity() {
    capacitySlots.innerHTML = '';
    const count = state.inbox.length;
    const full = count >= MAX_CAPACITY;

    for (let i = 0; i < MAX_CAPACITY; i++) {
      const slot = document.createElement('div');
      slot.className = 'capacity-slot';
      if (i < count) {
        slot.classList.add(full ? 'full' : 'filled');
      }
      capacitySlots.appendChild(slot);
    }

    capacityLabel.textContent = count + '/' + MAX_CAPACITY;

    // Fading indicator
    const fadingCount = state.inbox.filter(i => decayRatio(i) > 0.5).length;
    if (fadingCount > 0) {
      fadingIndicator.textContent = fadingCount + ' fading';
      fadingIndicator.style.display = '';
    } else {
      fadingIndicator.textContent = '';
      fadingIndicator.style.display = 'none';
    }
  }

  // ═══════════════════════════════════════════════
  //  INBOX RENDERING (differential)
  // ═══════════════════════════════════════════════
  const inboxElements = new Map(); // id -> DOM element
  const pulsedItems = new Set(); // ids that already pulsed at 50% decay
  const notifiedItems = new Set(); // ids that already triggered a decay notification

  function createInboxItem(item) {
    const itemType = classifyItemType(item);
    const cooling = isCooling(item);
    const el = document.createElement('div');
    el.className = 'inbox-item';
    el.dataset.id = item.id;
    if (item.resurfaced) el.classList.add('resurfaced');

    const typeBadge = itemType !== 'text'
      ? `<div class="inbox-item-type type-${itemType}">${itemType}</div>` : '';
    const resurfaceBadge = item.resurfaced
      ? `<div class="resurface-badge">resurfaced — still worth carrying?</div>` : '';
    const thumbHtml = (itemType === 'image' && item.preview)
      ? `<img class="inbox-item-thumb" src="${item.preview}" alt="" />` : '';

    el.innerHTML = `
      <div class="inbox-item-marker"></div>
      ${thumbHtml}
      <div class="inbox-item-body">
        <div class="inbox-item-text">${renderMatterHtml(item.text, !cooling)}</div>
        ${typeBadge}
        ${resurfaceBadge}
        <div class="cooling-slot"></div>
        <div class="digested-slot"></div>
        <div class="decay-bar"><div class="decay-fill" style="width:100%"></div></div>
        <span class="settle-badge"></span>
      </div>
      <div class="inbox-item-meta">
        <div class="inbox-item-age"></div>
        <div class="inbox-item-cost"></div>
      </div>
    `;

    el.addEventListener('click', () => {
      if (!isSettling(item)) enterReflect(item.id);
    });

    return el;
  }

  function updateInboxItem(el, item) {
    const decay = decayRatio(item);
    const settling = isSettling(item);
    const cooling = isCooling(item);
    const decayPct = Math.max(0, (1 - decay)) * 100;
    const textOpacity = Math.max(0.25, 1 - (decay * 0.75));

    // Update classes
    el.classList.toggle('settling', settling);
    el.classList.toggle('cooling', cooling);
    el.classList.toggle('decaying', decay > 0.5 && decay < 0.85);
    el.classList.toggle('critical', decay >= 0.85);

    // One-time pulse when crossing 50% decay
    if (decay > 0.5 && !pulsedItems.has(item.id)) {
      pulsedItems.add(item.id);
      el.classList.add('decay-pulse');
      el.addEventListener('animationend', () => el.classList.remove('decay-pulse'), { once: true });
    }

    // Update text opacity
    const textEl = el.querySelector('.inbox-item-text');
    if (textEl) textEl.style.opacity = textOpacity;

    // Update link clickability when cooling state changes
    if (item.type === 'link') {
      const hasLinks = textEl && textEl.querySelector('a.matter-link');
      const hasCooling = textEl && textEl.querySelector('.matter-link-cooling');
      if (!cooling && hasCooling) {
        textEl.innerHTML = renderMatterHtml(item.text, true);
      } else if (cooling && hasLinks) {
        textEl.innerHTML = renderMatterHtml(item.text, false);
      }
    }

    // Update decay bar
    const decayFill = el.querySelector('.decay-fill');
    if (decayFill) {
      decayFill.style.width = decayPct + '%';
      decayFill.className = 'decay-fill' + (decay >= 0.85 ? ' critical' : (decay > 0.5 ? ' warning' : ''));
    }

    // Update settle badge
    const settleBadge = el.querySelector('.settle-badge');
    if (settleBadge) {
      if (settling) {
        settleBadge.textContent = 'settling · ' + settleRemaining(item) + 's';
        settleBadge.style.display = '';
      } else {
        settleBadge.textContent = '';
        settleBadge.style.display = 'none';
      }
    }

    // Update cooling slot
    const coolingSlot = el.querySelector('.cooling-slot');
    if (coolingSlot) {
      if (cooling && !settling) {
        const remaining = coolingRemaining(item);
        const coolingPct = Math.max(0, (1 - (remaining * 1000 / LINK_COOLING_MS))) * 100;
        coolingSlot.innerHTML = `<div class="cooling-badge">
          <div class="cooling-progress"><div class="cooling-fill" style="width:${coolingPct}%"></div></div>
          <span class="cooling-label">cooling · ${formatCooling(remaining)}</span>
        </div>`;
      } else {
        coolingSlot.innerHTML = '';
      }
    }

    // Update digested slot
    const digestedSlot = el.querySelector('.digested-slot');
    if (digestedSlot) {
      if (item.opened && !cooling) {
        if (!digestedSlot.firstChild) {
          digestedSlot.innerHTML = '<div class="digested-badge">digested — ready to reflect</div>';
        }
      } else {
        digestedSlot.innerHTML = '';
      }
    }

    // Update meta
    const ageEl = el.querySelector('.inbox-item-age');
    if (ageEl) ageEl.textContent = timeAgo(item.created);
    const costEl = el.querySelector('.inbox-item-cost');
    if (costEl) costEl.textContent = emergyCost(item);
  }

  function renderInbox() {
    if (state.inbox.length === 0) {
      // Clear DOM elements map
      inboxElements.clear();
      inboxList.innerHTML = '';
      inboxList.style.display = 'none';
      if (state.archive.length > 0 || (state.stats.totalKept + state.stats.totalReleased) > 0) {
        restState.style.display = 'flex';
        inboxEmpty.style.display = 'none';
        updateRestMessage();
      } else {
        restState.style.display = 'none';
        inboxEmpty.style.display = 'flex';
        updateEmptyMessage();
      }
    } else {
      inboxEmpty.style.display = 'none';
      restState.style.display = 'none';
      inboxList.style.display = 'flex';

      const currentIds = new Set(state.inbox.map(i => i.id));

      // Remove elements for items no longer in inbox
      for (const [id, el] of inboxElements) {
        if (!currentIds.has(id)) {
          el.remove();
          inboxElements.delete(id);
        }
      }

      // Update or create elements in order
      let prevEl = null;
      state.inbox.forEach(item => {
        let el = inboxElements.get(item.id);
        if (!el) {
          // New item — create and insert
          el = createInboxItem(item);
          inboxElements.set(item.id, el);
          if (prevEl && prevEl.nextSibling) {
            inboxList.insertBefore(el, prevEl.nextSibling);
          } else if (prevEl) {
            inboxList.appendChild(el);
          } else {
            inboxList.insertBefore(el, inboxList.firstChild);
          }
        } else {
          // Ensure correct order
          if (prevEl && el.previousSibling !== prevEl) {
            if (prevEl.nextSibling) {
              inboxList.insertBefore(el, prevEl.nextSibling);
            } else {
              inboxList.appendChild(el);
            }
          } else if (!prevEl && el !== inboxList.firstChild) {
            inboxList.insertBefore(el, inboxList.firstChild);
          }
        }
        updateInboxItem(el, item);
        prevEl = el;
      });
    }

    updateCaptureState();
    renderCapacity();
    updateCounts();
    updateReels();
    updateCycleAndAscendency();
  }

  // ═══════════════════════════════════════════════
  //  REFLECT
  // ═══════════════════════════════════════════════
  function enterReflect(itemId) {
    const item = state.inbox.find(i => i.id === itemId);
    if (!item || isSettling(item)) return;

    currentItemId = itemId;
    const cooled = !isCooling(item);
    reflectMatter.innerHTML = renderMatterHtml(item.text, cooled);
    reflectMatterRich.innerHTML = renderRichContent(item);

    // Track link opens for digest state
    if (item.type === 'link' && cooled) {
      reflectMatter.querySelectorAll('a.matter-link').forEach(a => {
        a.addEventListener('click', () => {
          if (!item.opened) {
            item.opened = true;
            item.openedAt = Date.now();
            saveState();
          }
        });
      });
    }

    // Choose prompt pool: digested > resurfaced > type-based
    let promptType = classifyItemType(item) || 'text';
    if (item.resurfaced) promptType = 'resurfaced';
    if (item.opened) promptType = 'digested';
    reflectPrompt.textContent = randomPrompt(promptType);
    reflectInput.value = '';
    if (bodyCheckInput) bodyCheckInput.value = '';
    alchemizeBtn.disabled = true;
    showView('reflect');

    setTimeout(() => reflectInput.focus(), 300);
  }

  reflectInput.addEventListener('input', () => {
    alchemizeBtn.disabled = reflectInput.value.trim().length === 0;
  });

  reflectBack.addEventListener('click', () => {
    showView('inbox');
    renderInbox();
    currentItemId = null;
    captureInput.focus();
  });

  // ═══════════════════════════════════════════════
  //  ALCHEMIZE
  // ═══════════════════════════════════════════════
  alchemizeBtn.addEventListener('click', () => {
    const item = state.inbox.find(i => i.id === currentItemId);
    if (!item) return;

    const reflection = reflectInput.value.trim();
    if (!reflection) return;

    currentGold = {
      id: item.id,
      matter: item.text,
      reflection: reflection,
      bodyCheck: bodyCheckInput ? bodyCheckInput.value.trim() : '',
      created: item.created,
      transmuted: Date.now(),
      type: item.type,
      fileName: item.fileName,
      fileType: item.fileType,
      fileSize: item.fileSize,
      preview: item.preview
    };

    const reflectDuration = Date.now() - item.created;
    state.inbox = state.inbox.filter(i => i.id !== currentItemId);
    logEvent('reflect', { reflectMs: reflectDuration });
    saveState();

    goldMatter.innerHTML = renderMatterHtml(currentGold.matter);
    goldMatterRich.innerHTML = renderRichContent(currentGold);
    goldReflection.textContent = currentGold.reflection;
    goldCombined.classList.remove('dissipating');
    showView('gold');
    updateCounts();
    updateReels();
    renderCapacity();

    showToast('Transmutation complete');
  });

  // ═══════════════════════════════════════════════
  //  GOLD VIEW
  // ═══════════════════════════════════════════════
  goldBack.addEventListener('click', () => {
    if (currentGold) {
      const restored = {
        id: currentGold.id,
        text: currentGold.matter,
        created: currentGold.created,
        type: currentGold.type,
        fileName: currentGold.fileName,
        fileType: currentGold.fileType,
        fileSize: currentGold.fileSize,
        preview: currentGold.preview
      };
      state.inbox.unshift(restored);
      saveState();
      currentGold = null;
    }
    showView('inbox');
    renderInbox();
    captureInput.focus();
  });

  // ═══════════════════════════════════════════════
  //  RELEASE MODAL
  // ═══════════════════════════════════════════════
  let modalTrigger = null;

  function closeModal() {
    if (pendingRubricKeep) {
      // Dismissed mid-rubric — archive without scores
      commitKeep(null);
      return;
    }
    releaseModal.classList.remove('active');
    pendingArchiveRelease = null;
    modalKeep.style.display = '';
    if (modalMapSelect) modalMapSelect.classList.remove('visible');
    resetMapButtons();
    resetRubricForm();
    if (modalTrigger && modalTrigger.focus) { modalTrigger.focus(); modalTrigger = null; }
  }

  function resetRubricForm() {
    pendingRubricKeep = false;
    currentRubric = null;
    const modalMain = $('modalMain');
    const modalRubric = $('modalRubric');
    if (modalMain) modalMain.style.display = '';
    if (modalRubric) modalRubric.style.display = 'none';
    const noteInput = $('rubricNote');
    if (noteInput) noteInput.value = '';
    const rows = $('rubricRows');
    if (rows) rows.querySelectorAll('button.selected').forEach(b => b.classList.remove('selected'));
  }

  function showRubricForm() {
    pendingRubricKeep = true;
    currentRubric = { clarity: null, integrity: null, somatic: null, transmutation: null, release: null };
    const modalMain = $('modalMain');
    const modalRubric = $('modalRubric');
    if (modalMain) modalMain.style.display = 'none';
    if (modalRubric) modalRubric.style.display = '';
    const archiveBtn = $('rubricArchive');
    if (archiveBtn) archiveBtn.focus();
  }

  function commitKeep(rubric) {
    if (!currentGold) return;
    const archiveItem = {
      ...currentGold,
      archived: Date.now(),
      map: pendingMap || '',
      bodyCheck: currentGold.bodyCheck || '',
      rubric: rubric
    };
    state.archive.unshift(archiveItem);
    state.stats.totalKept++;
    logEvent('keep');
    saveState();

    currentGold = null;
    releaseModal.classList.remove('active');
    resetRubricForm();
    showView('inbox');
    renderInbox();
    showToast('Archived — the gold is kept');
  }

  const rubricRowsEl = $('rubricRows');
  if (rubricRowsEl) {
    rubricRowsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-v]');
      if (!btn) return;
      const scale = btn.parentElement;
      const dim = scale.dataset.dim;
      const val = parseInt(btn.dataset.v, 10);
      if (!dim || !currentRubric) return;
      currentRubric[dim] = val;
      scale.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  }

  const rubricArchiveBtn = $('rubricArchive');
  if (rubricArchiveBtn) {
    rubricArchiveBtn.addEventListener('click', () => {
      const noteEl = $('rubricNote');
      const note = noteEl ? noteEl.value.trim() : '';
      const anyRated = RUBRIC_DIMS.some(d => currentRubric && currentRubric[d] !== null);
      const rubric = (anyRated || note)
        ? { ...currentRubric, note: note || null, ratedAt: Date.now() }
        : null;
      commitKeep(rubric);
    });
  }

  releaseBtn.addEventListener('click', () => {
    pendingArchiveRelease = null;
    modalTrigger = releaseBtn;
    if (currentGold) {
      const cost = emergyCost(currentGold);
      modalCost.textContent = 'Carried for ' + cost + ' of metabolic attention';
    }
    modalKeep.style.display = '';
    resetMapButtons();
    if (modalMapSelect) modalMapSelect.classList.add('visible');
    releaseModal.classList.add('active');
    modalKeep.focus();
  });

  modalCancel.addEventListener('click', closeModal);

  document.addEventListener('clearErrors', () => {
    state.errors = [];
    saveState();
    renderLog();
  });

  document.addEventListener('keydown', (e) => {
    // Escape: close modal > back from gold > back from reflect
    if (e.key === 'Escape') {
      if (releaseModal.classList.contains('active')) {
        closeModal();
      } else if (currentView === 'gold') {
        goldBack.click();
      } else if (currentView === 'reflect') {
        reflectBack.click();
      }
      return;
    }

    // Focus trap in release modal
    if (e.key === 'Tab' && releaseModal.classList.contains('active')) {
      const focusable = releaseModalInner.querySelectorAll('button:not([style*="display: none"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }

    // Don't intercept when typing in an input or textarea
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') {
      // Cmd/Ctrl+Enter in reflect textarea triggers alchemize
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && currentView === 'reflect') {
        if (!alchemizeBtn.disabled) alchemizeBtn.click();
      }
      return;
    }

    // When answering a diagnostic question, let 1-5 flow to the diagnostic's own handler
    if (currentView === 'diagnostic' && diagState && diagState.view === 'question') return;

    // View switching: 1=inbox, 2=archive, 3=log, 4=diagnostic
    if (e.key === '1') { navBtns.inbox.click(); return; }
    if (e.key === '2') { navBtns.archive.click(); return; }
    if (e.key === '3') { navBtns.log.click(); return; }
    if (e.key === '4') { navBtns.diagnostic.click(); return; }

    // n = focus capture input
    if (e.key === 'n' && currentView === 'inbox') {
      captureInput.focus();
      e.preventDefault();
      return;
    }
  });

  releaseModal.addEventListener('click', (e) => {
    if (e.target === releaseModal) closeModal();
  });

  modalKeep.addEventListener('click', () => {
    if (!currentGold) return;
    showRubricForm();
  });

  modalLetGo.addEventListener('click', () => {
    // Bulk archive release path
    if (pendingArchiveRelease === 'bulk') {
      const indices = Array.from(archiveSelected).sort((a, b) => b - a); // descending to splice safely
      const releasedItems = indices.map(i => ({ idx: i, item: state.archive[i] }));
      indices.forEach(i => state.archive.splice(i, 1));
      state.stats.totalReleased += releasedItems.length;
      releasedItems.forEach(() => logEvent('release', { from: 'archive' }));
      saveState();
      closeModal();
      exitSelectMode();
      updateCounts();
      updateCycleAndAscendency();
      showToast(`Released ${releasedItems.length} items`, () => {
        // Undo: restore all
        releasedItems.sort((a, b) => a.idx - b.idx).forEach(({ idx, item }) => {
          state.archive.splice(idx, 0, item);
        });
        state.stats.totalReleased -= releasedItems.length;
        saveState();
        renderArchive();
        updateCounts();
        updateCycleAndAscendency();
        showToast('Restored ' + releasedItems.length + ' items');
      });
      return;
    }

    // Archive release path
    if (pendingArchiveRelease !== null) {
      const idx = pendingArchiveRelease;
      const releasedItem = state.archive[idx];
      state.archive.splice(idx, 1);
      state.stats.totalReleased++;
      logEvent('release', { from: 'archive' });
      saveState();
      closeModal();
      renderArchive();
      updateCounts();
      updateCycleAndAscendency();
      showToast('Released from archive — lighter now', () => {
        // Undo: restore to archive
        state.archive.splice(idx, 0, releasedItem);
        state.stats.totalReleased--;
        saveState();
        renderArchive();
        updateCounts();
        updateCycleAndAscendency();
        showToast('Restored to archive');
      });
      return;
    }

    // Gold release path
    if (!currentGold) return;

    const releasedGold = { ...currentGold };
    state.stats.totalReleased++;
    logEvent('release', { from: 'gold' });
    saveState();

    // Dissipation animation — Landauer's exhale
    releaseModal.classList.remove('active');
    pendingArchiveRelease = null;
    modalKeep.style.display = '';

    goldCombined.classList.add('dissipating');

    setTimeout(() => {
      currentGold = null;
      showView('inbox');
      renderInbox();
      showToast('Released — returned to noise · kT ln 2', () => {
        // Undo: restore as archived gold
        const restored = { ...releasedGold, archived: Date.now() };
        state.archive.unshift(restored);
        state.stats.totalReleased--;
        state.stats.totalKept++;
        saveState();
        renderInbox();
        updateCounts();
        updateCycleAndAscendency();
        showToast('Restored to archive');
      });
    }, 1200);
  });

  // ═══════════════════════════════════════════════
  //  ARCHIVE RENDERING
  // ═══════════════════════════════════════════════
  // Archive search & sort state
  let archiveQuery = '';
  let archiveSortNewest = true;
  let archiveSearchTimeout = null;

  if (archiveSearch) {
    archiveSearch.addEventListener('input', () => {
      clearTimeout(archiveSearchTimeout);
      archiveSearchTimeout = setTimeout(() => {
        archiveQuery = archiveSearch.value.trim().toLowerCase();
        renderArchive();
      }, 200);
    });
  }

  if (archiveSortBtn) {
    archiveSortBtn.addEventListener('click', () => {
      archiveSortNewest = !archiveSortNewest;
      archiveSortBtn.textContent = archiveSortNewest ? 'newest' : 'oldest';
      renderArchive();
    });
  }

  let archiveSelectMode = false;
  const archiveSelected = new Set(); // indices of selected archive items

  function exitSelectMode() {
    archiveSelectMode = false;
    archiveSelected.clear();
    archiveSelectBtn.textContent = 'select';
    bulkReleaseBar.style.display = 'none';
    renderArchive();
  }

  function updateBulkBar() {
    const n = archiveSelected.size;
    bulkReleaseCount.textContent = n + ' selected';
    bulkReleaseBtn.disabled = n === 0;
    bulkReleaseBtn.textContent = n > 0 ? `Release selected (${n})` : 'Release selected';
  }

  if (archiveSelectBtn) {
    archiveSelectBtn.addEventListener('click', () => {
      archiveSelectMode = !archiveSelectMode;
      if (archiveSelectMode) {
        archiveSelected.clear();
        archiveSelectBtn.textContent = 'done';
        bulkReleaseBar.style.display = 'flex';
        updateBulkBar();
      } else {
        exitSelectMode();
      }
      renderArchive();
    });
  }

  if (bulkCancelBtn) {
    bulkCancelBtn.addEventListener('click', exitSelectMode);
  }

  if (bulkReleaseBtn) {
    bulkReleaseBtn.addEventListener('click', () => {
      if (archiveSelected.size === 0) return;
      const count = archiveSelected.size;
      modalCost.textContent = `Release ${count} item${count !== 1 ? 's' : ''} back to the void?`;
      modalKeep.style.display = 'none';
      pendingArchiveRelease = 'bulk';
      modalTrigger = bulkReleaseBtn;
      releaseModal.classList.add('active');
      modalLetGo.focus();
    });
  }

  function getFilteredArchive() {
    let items = state.archive.map((item, idx) => ({ item, idx }));
    if (archiveQuery) {
      items = items.filter(({ item }) =>
        (item.matter && item.matter.toLowerCase().includes(archiveQuery)) ||
        (item.reflection && item.reflection.toLowerCase().includes(archiveQuery))
      );
    }
    if (archiveMapQuery) {
      items = items.filter(({ item }) => (item.map || '') === archiveMapQuery);
    }
    if (!archiveSortNewest) {
      items = items.slice().reverse();
    }
    return items;
  }

  function renderArchive() {
    archiveList.innerHTML = '';
    archiveCarryingCost.textContent = totalCarryingCost();

    const filtered = getFilteredArchive();

    if (state.archive.length === 0) {
      archiveEmpty.style.display = 'flex';
      archiveList.style.display = 'none';
    } else if (filtered.length === 0) {
      archiveEmpty.style.display = 'none';
      archiveList.style.display = 'none';
      // Show "no results" inline
      archiveList.style.display = 'flex';
      const noResults = document.createElement('div');
      noResults.className = 'archive-no-results';
      noResults.textContent = 'No gold matches "' + escapeHtml(archiveQuery) + '"';
      archiveList.appendChild(noResults);
    } else {
      archiveEmpty.style.display = 'none';
      archiveList.style.display = 'flex';

      filtered.forEach(({ item, idx }) => {
        const el = document.createElement('div');
        el.className = 'archive-item';
        if (archiveSelectMode) el.classList.add('selectable');
        if (archiveSelected.has(idx)) el.classList.add('selected');

        const dateStr = new Date(item.transmuted).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        });

        const richHtml = renderRichContent(item);
        const checkboxHtml = archiveSelectMode
          ? `<div class="archive-checkbox ${archiveSelected.has(idx) ? 'checked' : ''}">&#x25C9;</div>`
          : '';

        const mapTag = item.map ? `<div class="archive-item-map">${escapeHtml(item.map)}</div>` : '';
        const bodyCheckTag = item.bodyCheck ? `<div class="archive-item-body-check">${escapeHtml(item.bodyCheck)}</div>` : '';
        const rubricTag = item.rubric ? `<div class="archive-item-rubric">${renderRubricLine(item.rubric)}</div>` : '';

        el.innerHTML = `
          ${checkboxHtml}
          ${mapTag}
          <div class="archive-item-matter">${renderMatterHtml(item.matter)}</div>
          ${richHtml}
          <div class="archive-item-reflection">${escapeHtml(item.reflection)}</div>
          ${bodyCheckTag}
          ${rubricTag}
          <div class="archive-item-meta">
            <span class="archive-item-date">${dateStr}</span>
            <div class="archive-item-actions">
              <button class="archive-release-btn" data-idx="${idx}">let go</button>
              <button class="archive-copy-btn" data-idx="${idx}">Copy</button>
            </div>
          </div>
        `;

        if (archiveSelectMode) {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (archiveSelected.has(idx)) { archiveSelected.delete(idx); }
            else { archiveSelected.add(idx); }
            updateBulkBar();
            renderArchive();
          });
        }

        const copyBtn = el.querySelector('.archive-copy-btn');
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const capturedDate = new Date(item.created).toISOString().slice(0, 10);
          const transmutedDate = new Date(item.transmuted).toISOString().slice(0, 10);
          let copyText = `---\ncaptured: ${capturedDate}\ntransmuted: ${transmutedDate}\nsource: alchemy\n`;
          if (item.map) copyText += `map: ${item.map}\n`;
          if (item.bodyCheck) copyText += `body: ${item.bodyCheck}\n`;
          if (item.fileName) copyText += `attachment: "${item.fileName}"\n`;
          if (item.rubric) {
            RUBRIC_DIMS.forEach(d => { if (item.rubric[d] != null) copyText += `rubric_${d}: ${item.rubric[d]}\n`; });
            if (item.rubric.note) copyText += `rubric_note: "${item.rubric.note.replace(/"/g, '\\"')}"\n`;
          }
          copyText += `---\n\n> ${item.matter.replace(/\n/g, '\n> ')}\n\n${item.reflection}`;
          navigator.clipboard.writeText(copyText).then(() => {
            copyBtn.textContent = 'Copied';
            copyBtn.classList.add('copied');
            setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('copied'); }, 2000);
          });
        });

        const releaseArchiveBtn = el.querySelector('.archive-release-btn');
        releaseArchiveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          pendingArchiveRelease = idx;
          modalTrigger = releaseArchiveBtn;
          const archiveItem = state.archive[idx];
          modalCost.textContent = 'This gold has been carried since ' +
            new Date(archiveItem.archived).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          modalKeep.style.display = 'none';
          releaseModal.classList.add('active');
          modalLetGo.focus();
        });

        archiveList.appendChild(el);
      });
    }
  }

  // ═══════════════════════════════════════════════
  //  DATA EXPORT / IMPORT
  // ═══════════════════════════════════════════════
  const exportBtn = $('exportBtn');
  const importBtn = $('importBtn');
  const importFile = $('importFile');

  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alchemy-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported — keep this somewhere safe');
  });

  // Backup to vault: write the export straight into a folder you pick once
  // (a synced folder works well). Local only, no network. The browser remembers
  // the folder, so after the first time it is one tap. Falls back to Export when
  // the File System Access API is missing (Safari, older browsers).
  const vaultBtn = $('vaultBtn');
  if (vaultBtn) {
    if (typeof window.showDirectoryPicker !== 'function') {
      vaultBtn.hidden = true;
    } else {
      vaultBtn.hidden = false;
      vaultBtn.addEventListener('click', backupToVault);
    }
  }

  function vaultHandle(mode, value) {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open('alchemy-fs', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('handles');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const tx = open.result.transaction('handles', mode === 'put' ? 'readwrite' : 'readonly');
        const store = tx.objectStore('handles');
        const req = mode === 'put' ? store.put(value, 'vaultDir') : store.get('vaultDir');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      };
    });
  }

  async function ensureVaultDir() {
    const opts = { mode: 'readwrite' };
    let dir = await vaultHandle('get');
    if (dir) {
      if ((await dir.queryPermission(opts)) === 'granted') return dir;
      if ((await dir.requestPermission(opts)) === 'granted') return dir;
    }
    dir = await window.showDirectoryPicker({ id: 'alchemy-vault', mode: 'readwrite' });
    await vaultHandle('put', dir);
    return dir;
  }

  async function backupToVault() {
    try {
      const dir = await ensureVaultDir();
      const name = 'alchemy-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      const fh = await dir.getFileHandle(name, { create: true });
      const writable = await fh.createWritable();
      await writable.write(JSON.stringify(state, null, 2));
      await writable.close();
      showToast('Backed up to the vault');
    } catch (err) {
      if (err && err.name === 'AbortError') return; // picker dismissed, no harm
      showToast('Vault backup failed — use Export');
    }
  }

  importBtn.addEventListener('click', () => importFile.click());

  importFile.addEventListener('change', () => {
    const file = importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported.inbox || !imported.archive) {
          showToast('Invalid backup file');
          return;
        }
        state.inbox = imported.inbox;
        state.archive = imported.archive;
        state.stats = imported.stats || { totalKept: 0, totalReleased: 0 };
        saveState();
        renderInbox();
        renderArchive();
        updateCounts();
        updateReels();
        renderCapacity();
        updateCycleAndAscendency();
        showToast('Imported — state restored');
      } catch (err) {
        showToast('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });

  // ═══════════════════════════════════════════════
  //  SYSTEMS AWARENESS
  // ═══════════════════════════════════════════════
  function updateCycleAndAscendency() {
    // Adaptive Cycle
    const phase = adaptiveCyclePhase();
    cycleGlyph.childNodes[0].textContent = phase.glyph + ' ';
    cycleTooltip.textContent = phase.label;

    // Ascendency Gauge
    const asc = ascendencyRatio();
    const ascPct = Math.round(asc * 100);
    ascendencyFill.style.width = ascPct + '%';
    ascendencyFill.parentElement.setAttribute('aria-valuenow', ascPct);
    ascendencyLabel.textContent = ascPct + '% kept';

    // Warn if over 70% (rigidity trap)
    if (ascPct > 70) {
      ascendencyFill.classList.add('rigid');
      ascendencyLabel.textContent = ascPct + '% kept · rigid';
    } else {
      ascendencyFill.classList.remove('rigid');
    }
  }

  // ═══════════════════════════════════════════════
  //  UTILITIES
  // ═══════════════════════════════════════════════
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderRubricLine(r) {
    if (!r) return '';
    const parts = RUBRIC_DIMS.filter(d => r[d] != null).map(d => `${d} ${r[d]}`);
    if (r.note) parts.push(`note: "${escapeHtml(r.note)}"`);
    return parts.join(' · ');
  }

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return mins + 'm';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h';
    const days = Math.floor(hrs / 24);
    return days + 'd';
  }

  function updateCounts() {
    inboxCount.textContent = state.inbox.length > 0 ? ` ${state.inbox.length}` : '';
    archiveCount.textContent = state.archive.length > 0 ? ` ${state.archive.length}` : '';

    const total = state.stats.totalKept + state.stats.totalReleased;
    if (tapeCounter) tapeCounter.textContent = total > 0 ? `${total} metabolized` : '';
  }

  function updateReels() {
    const inboxSize = state.inbox.length;
    const archiveSize = state.archive.length;

    const leftSize = Math.min(20 + inboxSize * 4, 48);
    reelLeft.style.width = leftSize + 'px';
    reelLeft.style.height = leftSize + 'px';

    const rightSize = Math.min(20 + archiveSize * 4, 48);
    reelRight.style.width = rightSize + 'px';
    reelRight.style.height = rightSize + 'px';
  }

  let toastTimeout;
  let toastAction = null;
  function showToast(msg, action) {
    toastAction = action || null;
    if (action) {
      toast.innerHTML = escapeHtml(msg) + ' <a class="toast-action" href="#">undo</a>';
    } else {
      toast.textContent = msg;
    }
    toast.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
      toastAction = null;
    }, action ? 5000 : 2800);
  }

  toast.addEventListener('click', (e) => {
    if (e.target.classList.contains('toast-action') && toastAction) {
      e.preventDefault();
      toastAction();
      toastAction = null;
      toast.classList.remove('visible');
      clearTimeout(toastTimeout);
    }
  });

  // ═══════════════════════════════════════════════
  //  ARCHIVE RE-SURFACING & DECAY
  // ═══════════════════════════════════════════════
  function processArchiveDecay() {
    const now = Date.now();
    const expired = state.archive.filter(item => (now - item.archived) >= ARCHIVE_DECAY_MS);
    if (expired.length > 0) {
      state.archive = state.archive.filter(item => (now - item.archived) < ARCHIVE_DECAY_MS);
      state.stats.totalReleased += expired.length;
      logEvent('archive_decay', { count: expired.length });
      saveState();
      const word = expired.length === 1 ? 'item' : 'items';
      showToast(`${expired.length} archived ${word} composted — 90 days is long enough`);
    }
  }

  function maybeResurface() {
    const now = Date.now();
    if (state.archive.length === 0) return;
    if (state.inbox.length >= MAX_CAPACITY) return;
    if ((now - state.lastResurface) < RESURFACE_INTERVAL_MS) return;

    // Pick the oldest archived item
    const oldest = state.archive[state.archive.length - 1];
    // Remove from archive
    state.archive.pop();
    // Add to inbox with resurfaced flag
    state.inbox.push({
      id: oldest.id || Date.now().toString(36),
      text: oldest.matter,
      created: Date.now(),
      type: oldest.type,
      fileName: oldest.fileName,
      fileType: oldest.fileType,
      fileSize: oldest.fileSize,
      preview: oldest.preview,
      resurfaced: true,
      originalReflection: oldest.reflection
    });
    state.lastResurface = now;
    logEvent('resurface');
    saveState();
    showToast('Something resurfaced — still worth carrying?');
  }

  // ═══════════════════════════════════════════════
  //  METABOLISM LOG
  // ═══════════════════════════════════════════════
  function renderLog() {
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;
    const monthAgo = now - 30 * 86400000;

    const weekEvents = state.events.filter(e => e.ts >= weekAgo);
    const monthEvents = state.events.filter(e => e.ts >= monthAgo);

    const weekCaptures = weekEvents.filter(e => e.type === 'capture').length;
    const weekReflects = weekEvents.filter(e => e.type === 'reflect').length;
    const weekKeeps = weekEvents.filter(e => e.type === 'keep').length;
    const weekReleases = weekEvents.filter(e => e.type === 'release').length;
    const weekResurfaces = weekEvents.filter(e => e.type === 'resurface').length;

    const monthCaptures = monthEvents.filter(e => e.type === 'capture').length;
    const monthKeeps = monthEvents.filter(e => e.type === 'keep').length;
    const monthReleases = monthEvents.filter(e => e.type === 'release').length;

    // Average reflect time
    const reflectEvents = weekEvents.filter(e => e.type === 'reflect' && e.reflectMs);
    let avgReflectStr = 'no reflections yet';
    if (reflectEvents.length > 0) {
      const avgMs = reflectEvents.reduce((sum, e) => sum + e.reflectMs, 0) / reflectEvents.length;
      const avgHrs = avgMs / 3600000;
      if (avgHrs < 1) avgReflectStr = 'under an hour';
      else if (avgHrs < 24) avgReflectStr = Math.round(avgHrs) + ' hours';
      else avgReflectStr = Math.round(avgHrs / 24) + ' days';
    }

    // Keep:release ratio
    const totalProcessed = state.stats.totalKept + state.stats.totalReleased;
    let ratioStr = '';
    if (totalProcessed > 0) {
      const keepPct = Math.round((state.stats.totalKept / totalProcessed) * 100);
      ratioStr = `All time, you've kept <strong>${keepPct}%</strong> of what you processed.`;
      if (keepPct > 70) ratioStr += ` <span class="log-amber">That's a lot of carrying.</span>`;
      else if (keepPct < 30) ratioStr += ` You release freely.`;
    }

    // Build observation
    let observation = '';
    if (weekCaptures === 0 && state.inbox.length === 0 && state.archive.length === 0) {
      observation = "Nothing has moved through the system yet. That's not a problem — it's a starting condition.";
    } else if (weekCaptures === 0) {
      observation = "Nothing new this week. Either the world got quieter, or you stopped listening. Both are worth noticing.";
    } else if (weekCaptures > 0 && weekReflects === 0) {
      observation = "You've been capturing but not reflecting. The inbox is filling — are you consuming or processing?";
    } else if (weekKeeps > weekReleases * 3 && weekKeeps > 2) {
      observation = "You're keeping almost everything. What would happen if you let one go?";
    } else if (weekReleases > weekKeeps * 2 && weekReleases > 2) {
      observation = "You've been releasing more than keeping. That takes practice. Or maybe you're being too hasty — only you know.";
    } else if (weekCaptures > 10) {
      observation = "Heavy intake this week. That's not a judgment — just a measurement. Is the tape keeping up with you?";
    } else if (weekResurfaces > 0) {
      observation = `${weekResurfaces} item${weekResurfaces > 1 ? 's' : ''} resurfaced this week. Old gold, back for re-examination.`;
    } else {
      observation = "The system is breathing. In, pause, transform, release. You're using it as intended.";
    }

    // Capture type breakdown
    const weekTypes = weekEvents.filter(e => e.type === 'capture');
    const typeCounts = {};
    weekTypes.forEach(e => { typeCounts[e.itemType || 'text'] = (typeCounts[e.itemType || 'text'] || 0) + 1; });
    let typeStr = '';
    if (Object.keys(typeCounts).length > 1) {
      const parts = Object.entries(typeCounts).map(([t, c]) => `${c} ${t}${c > 1 ? 's' : ''}`);
      typeStr = `<br>Breakdown: ${parts.join(', ')}.`;
    }

    // Monthly type breakdown + trend
    const monthTypes = monthEvents.filter(e => e.type === 'capture');
    const monthTypeCounts = {};
    monthTypes.forEach(e => { monthTypeCounts[e.itemType || 'text'] = (monthTypeCounts[e.itemType || 'text'] || 0) + 1; });
    let monthTypeStr = '';
    if (Object.keys(monthTypeCounts).length > 0) {
      const parts = Object.entries(monthTypeCounts).map(([t, c]) => `${c} ${t}${c > 1 ? 's' : ''}`);
      monthTypeStr = parts.join(', ');
    }

    // Compare to previous month for trend
    const prevMonthStart = now - 60 * 86400000;
    const prevMonthEvents = state.events.filter(e => e.ts >= prevMonthStart && e.ts < monthAgo && e.type === 'capture');
    let monthTrend = '';
    if (prevMonthEvents.length > 0 && monthCaptures > 0) {
      const prevTypeCounts = {};
      prevMonthEvents.forEach(e => { prevTypeCounts[e.itemType || 'text'] = (prevTypeCounts[e.itemType || 'text'] || 0) + 1; });
      const topNow = Object.entries(monthTypeCounts).sort((a, b) => b[1] - a[1])[0];
      const topPrev = Object.entries(prevTypeCounts).sort((a, b) => b[1] - a[1])[0];
      if (topNow && topPrev && topNow[0] !== topPrev[0]) {
        monthTrend = `Shifted from mostly ${topPrev[0]}s to ${topNow[0]}s.`;
      } else if (topNow && Object.keys(monthTypeCounts).length === 1) {
        monthTrend = `All ${topNow[0]}s this month.`;
      } else if (Object.keys(monthTypeCounts).length > 2) {
        monthTrend = 'Balanced intake.';
      }
    }

    // Sparkline — 7 days, captures/keeps/releases per day
    const days = [];
    for (let d = 6; d >= 0; d--) {
      const dayStart = new Date(now); dayStart.setHours(0,0,0,0); dayStart.setDate(dayStart.getDate() - d);
      const dayEnd = dayStart.getTime() + 86400000;
      const dayEvents = state.events.filter(e => e.ts >= dayStart.getTime() && e.ts < dayEnd);
      days.push({
        label: dayStart.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        captures: dayEvents.filter(e => e.type === 'capture').length,
        keeps: dayEvents.filter(e => e.type === 'keep').length,
        releases: dayEvents.filter(e => e.type === 'release').length,
      });
    }
    const sparkMax = Math.max(1, ...days.map(d => d.captures + d.keeps + d.releases));

    let sparklineHtml = '';
    if (weekEvents.length > 0) {
      sparklineHtml = `
        <div class="log-section">
          <div class="log-section-title">Activity</div>
          <div class="sparkline">
            ${days.map(d => {
              const cH = (d.captures / sparkMax) * 100;
              const kH = (d.keeps / sparkMax) * 100;
              const rH = (d.releases / sparkMax) * 100;
              const total = d.captures + d.keeps + d.releases;
              return `<div class="sparkline-col">
                <div class="sparkline-bar" title="${total} events">
                  <div class="sparkline-seg sparkline-capture" style="height:${cH}%"></div>
                  <div class="sparkline-seg sparkline-keep" style="height:${kH}%"></div>
                  <div class="sparkline-seg sparkline-release" style="height:${rH}%"></div>
                </div>
                <div class="sparkline-label">${d.label}</div>
              </div>`;
            }).join('')}
          </div>
          <div class="sparkline-legend">
            <span class="sparkline-legend-item"><span class="sparkline-dot sparkline-capture"></span>captured</span>
            <span class="sparkline-legend-item"><span class="sparkline-dot sparkline-keep"></span>kept</span>
            <span class="sparkline-legend-item"><span class="sparkline-dot sparkline-release"></span>released</span>
          </div>
        </div>`;
    }

    const hasHistory = state.events.length > 0 || !!state.diagnostic;

    if (!hasHistory) {
      logContent.innerHTML = `
        <div class="log-empty">
          <p>No metabolic history yet. Use the app for a while — this log writes itself.</p>
        </div>
      `;
      return;
    }

    logContent.innerHTML = `
      <div class="log-section">
        <div class="log-section-title">This Week</div>
        <p class="log-prose">
          <strong>${weekCaptures}</strong> inhaled.
          <strong>${weekReflects}</strong> reflected on.
          <strong>${weekKeeps}</strong> kept.
          <strong>${weekReleases}</strong> released.${typeStr}
        </p>
        <p class="log-prose">Average time from capture to reflection: <strong>${avgReflectStr}</strong>.</p>
      </div>

      ${sparklineHtml}

      <div class="log-section">
        <div class="log-section-title">Observation</div>
        <div class="log-observation">${observation}</div>
      </div>

      <div class="log-section">
        <div class="log-section-title">Current Load</div>
        <p class="log-prose">
          <strong>${state.inbox.length}</strong> item${state.inbox.length !== 1 ? 's' : ''} in the inbox.
          <strong>${state.archive.length}</strong> in the archive.
          ${ratioStr}
        </p>
      </div>

      ${monthCaptures > 0 ? `
      <div class="log-section">
        <div class="log-section-title">This Month</div>
        <p class="log-prose">
          <strong>${monthCaptures}</strong> captured.
          <strong>${monthKeeps}</strong> kept.
          <strong>${monthReleases}</strong> released.
          ${monthTypeStr ? `<br>Breakdown: ${monthTypeStr}.` : ''}
          ${monthTrend ? `<br><em class="log-trend">${monthTrend}</em>` : ''}
        </p>
      </div>
      ` : ''}

      ${state.errors.length > 0 ? `
      <div class="log-section">
        <details class="log-errors-details">
          <summary><span class="log-section-title">Errors (${state.errors.length})</span></summary>
          <div class="log-errors">
            ${state.errors.slice(-10).reverse().map(e => `
              <div class="log-error-entry">
                <span class="log-error-time">${new Date(e.ts).toLocaleDateString()}</span>
                <span class="log-error-msg">${escapeHtml(e.msg)}</span>
              </div>
            `).join('')}
            <button class="log-clear-errors" onclick="document.dispatchEvent(new CustomEvent('clearErrors'))">Clear errors</button>
          </div>
        </details>
      </div>
      ` : ''}

      <div class="log-section">
        <div class="log-section-title">Shortcuts</div>
        <div class="log-shortcuts">
          <span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> switch views</span>
          <span><kbd>n</kbd> new capture</span>
          <span><kbd>esc</kbd> go back / close</span>
          <span><kbd>${navigator.platform && navigator.platform.indexOf('Mac') > -1 ? '⌘' : 'Ctrl'}+↵</kbd> alchemize</span>
        </div>
      </div>

      <div class="log-section">
        <div class="log-section-title">Notifications</div>
        <p class="log-prose log-notify-status" id="logNotifyStatus">${
          !('Notification' in window) ? 'Your browser does not support notifications.' :
          Notification.permission === 'granted' ? 'Decay alerts are <strong>enabled</strong>. You\'ll be nudged when items approach dissolution.' :
          Notification.permission === 'denied' ? 'Notifications were blocked. Check your browser settings to re-enable.' :
          'Get a nudge when inbox items are about to dissolve.'
        }</p>
        ${('Notification' in window && Notification.permission === 'default') ?
          '<button class="log-notify-btn" id="logNotifyBtn">Enable decay alerts</button>' : ''}
      </div>

      ${state.firstOpenDate ? (() => {
        const daysSinceFirst = Math.floor((Date.now() - state.firstOpenDate) / 86400000);
        const lastActive = state.lastActiveDate
          ? Math.floor((Date.now() - state.lastActiveDate) / 86400000)
          : null;
        const activeDays = new Set(
          state.events.map(e => new Date(e.ts).toDateString())
        ).size;
        return `
        <div class="log-section">
          <div class="log-section-title">Usage Signal</div>
          <p class="log-prose">
            First opened <strong>${daysSinceFirst === 0 ? 'today' : daysSinceFirst + (daysSinceFirst === 1 ? ' day ago' : ' days ago')}</strong>.
            Active on <strong>${activeDays}</strong> day${activeDays !== 1 ? 's' : ''} total.
            ${lastActive !== null ? `Last action <strong>${lastActive === 0 ? 'today' : lastActive + (lastActive === 1 ? ' day ago' : ' days ago')}</strong>.` : ''}
          </p>
          <p class="log-prose" style="font-size:0.78rem; margin-top:4px;">Export your data to preserve this baseline.</p>
        </div>`;
      })() : ''}
    `;

    const notifyBtn = document.getElementById('logNotifyBtn');
    if (notifyBtn) {
      notifyBtn.addEventListener('click', () => {
        Notification.requestPermission().then(perm => {
          renderLog();
          if (perm === 'granted') showToast('Decay alerts enabled');
        });
      });
    }

    // Diagnostic placement (single line, no trends)
    if (state.diagnostic) {
      const d = state.diagnostic;
      const tuned = MAX_CAPACITY !== BASE_MAX_CAPACITY || RESURFACE_INTERVAL_MS !== BASE_RESURFACE_INTERVAL_MS;
      const tuningLine = tuned
        ? `<p class="log-prose" style="font-size:0.82rem; color:var(--parchment-dim); opacity:0.75; font-style:italic;">Reacting to your scores: inbox cap ${MAX_CAPACITY}, resurface every ${Math.round(RESURFACE_INTERVAL_MS / 86400000)} days.</p>`
        : '';
      const diagSec = document.createElement('div');
      diagSec.className = 'log-section';
      diagSec.innerHTML = `
        <div class="log-section-title">Metabolism placement</div>
        <p class="log-prose" style="font-size:0.88rem;">
          <strong>${escapeHtml(d.quadrant)}</strong> — ${escapeHtml(d.summary)}.
          <span style="color:var(--parchment-dim);opacity:0.7">Taken ${new Date(d.takenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.</span>
        </p>
        ${tuningLine}
        <button class="log-submit-btn" id="diagRetakeBtn" style="margin-top:6px;">Retake</button>
      `;
      logContent.appendChild(diagSec);
      const retake = document.getElementById('diagRetakeBtn');
      if (retake) retake.addEventListener('click', () => navBtns.diagnostic.click());
    }

    // Append recent rubric notes section (words only — no numbers, no aggregation)
    const rubricNotes = state.archive
      .filter(a => a.rubric && a.rubric.note && a.rubric.ratedAt)
      .slice(0, 7);
    if (rubricNotes.length > 0) {
      const rubricSection = document.createElement('div');
      rubricSection.className = 'log-section';
      rubricSection.innerHTML = `
        <div class="log-section-title">Recent rubrics</div>
        <p class="log-prose" style="margin-bottom:10px; font-size:0.88rem;">What you said about the last few passages.</p>
        <div class="log-entry-list">
          ${rubricNotes.map(a => `
            <div class="log-entry-item">
              <span class="log-entry-date">${new Date(a.rubric.ratedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              ${escapeHtml(a.rubric.note)}
            </div>
          `).join('')}
        </div>
      `;
      logContent.appendChild(rubricSection);
    }

    // Append threshold section
    const thresholdSection = document.createElement('div');
    thresholdSection.className = 'log-section';
    const recentThresholds = (state.thresholds || []).slice(-3).reverse();
    thresholdSection.innerHTML = `
      <div class="log-section-title">Weekly Threshold</div>
      <p class="log-prose" style="margin-bottom:10px; font-size:0.88rem;">What shifted this week?</p>
      <textarea class="log-threshold-input" id="thresholdInput" rows="3" placeholder="not what happened — what changed in how you see something"></textarea>
      <button class="log-submit-btn" id="thresholdSubmit">Record</button>
      ${recentThresholds.length > 0 ? `
        <div class="log-entry-list">
          ${recentThresholds.map(t => `
            <div class="log-entry-item">
              <span class="log-entry-date">${new Date(t.ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              ${escapeHtml(t.text)}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
    logContent.prepend(thresholdSection);

    document.getElementById('thresholdSubmit').addEventListener('click', () => {
      const input = document.getElementById('thresholdInput');
      const text = input ? input.value.trim() : '';
      if (!text) return;
      state.thresholds.push({ ts: Date.now(), text });
      if (state.thresholds.length > 52) state.thresholds = state.thresholds.slice(-52); // keep ~1 year
      saveState();
      input.value = '';
      showToast('Threshold recorded');
      renderLog();
    });

    // Append friction log section
    const frictionSection = document.createElement('div');
    frictionSection.className = 'log-section';
    const recentFriction = (state.frictionLog || []).slice(-5).reverse();
    frictionSection.innerHTML = `
      <div class="log-section-title">Friction Log</div>
      <p class="log-prose" style="margin-bottom:10px; font-size:0.88rem;">Where were you using this to avoid something?</p>
      <input class="log-friction-input" id="frictionInput" type="text" placeholder="one line — catch the avoidance" />
      <button class="log-submit-btn" id="frictionSubmit" style="margin-top:8px;">Log it</button>
      ${recentFriction.length > 0 ? `
        <div class="log-entry-list">
          ${recentFriction.map(f => `
            <div class="log-entry-item">
              <span class="log-entry-date">${new Date(f.ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              ${escapeHtml(f.text)}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
    thresholdSection.after(frictionSection);

    document.getElementById('frictionSubmit').addEventListener('click', () => {
      const input = document.getElementById('frictionInput');
      const text = input ? input.value.trim() : '';
      if (!text) return;
      state.frictionLog.push({ ts: Date.now(), text });
      if (state.frictionLog.length > 200) state.frictionLog = state.frictionLog.slice(-200);
      saveState();
      input.value = '';
      showToast('Friction logged');
      renderLog();
    });

    const frictionInputEl = document.getElementById('frictionInput');
    if (frictionInputEl) {
      frictionInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('frictionSubmit').click(); }
      });
    }

    const versionEl = document.createElement('div');
    versionEl.className = 'log-version';
    versionEl.textContent = 'v' + VERSION;
    logContent.appendChild(versionEl);
  }

  // ═══════════════════════════════════════════════
  //  CONTEXTUAL EMPTY STATES
  // ═══════════════════════════════════════════════
  function updateRestMessage() {
    const hour = new Date().getHours();
    const archiveLen = state.archive.length;
    const oldestInbox = state.inbox.length > 0
      ? Math.max(...state.inbox.map(i => Date.now() - i.created))
      : 0;

    // Check if archive is growing without releases
    const recentKeeps = state.events.filter(e => e.type === 'keep' && e.ts > Date.now() - 7 * 86400000).length;
    const recentReleases = state.events.filter(e => e.type === 'release' && e.ts > Date.now() - 7 * 86400000).length;

    if (archiveLen > 10 && recentReleases === 0) {
      restMessage.textContent = "You're carrying " + archiveLen + " items. When did you last let something go?";
      restHint.textContent = "Lightness is a practice, not a state";
    } else if (hour < 10) {
      restMessage.textContent = "Morning. What's still on the tape from yesterday?";
      restHint.textContent = "The first breath of the day sets the rhythm";
    } else if (hour >= 22) {
      restMessage.textContent = "The tape is at rest. So are you.";
      restHint.textContent = "Sleep is the original letting go";
    } else if (recentKeeps > 5 && recentReleases === 0) {
      restMessage.textContent = "You've been keeping a lot lately. Is anything ready to release?";
      restHint.textContent = "Accumulation and hoarding look identical from outside";
    } else {
      restMessage.textContent = "The tape is at rest. So are you.";
      restHint.textContent = "The hole at the center is not emptiness — it is structure";
    }
  }

  function updateEmptyMessage() {
    const hour = new Date().getHours();
    const total = state.stats.totalKept + state.stats.totalReleased;

    if (total > 0) {
      // User has used the app before but cleared everything
      emptyMessage.textContent = "You've processed everything. Clean slate.";
      emptyHint.textContent = "Not empty — composted";
    } else if (hour < 10) {
      emptyMessage.textContent = "The void is currently quiet. Add some base matter.";
      emptyHint.textContent = "What's on your mind this morning?";
    } else {
      emptyMessage.textContent = "The void is currently quiet. Add some base matter.";
      emptyHint.textContent = "Nothing is also something";
    }
  }

  // ═══════════════════════════════════════════════
  //  BOOKMARKLET
  // ═══════════════════════════════════════════════
  function setupBookmarklet() {
    const currentUrl = window.location.href;
    // The bookmarklet opens the app with query params
    const code = `javascript:void(function(){var t=window.getSelection().toString()||'';var u=document.location.href;var d=document.title;var m=t?t+'\\n\\n'+u:u;window.open('${currentUrl}?capture='+encodeURIComponent(m),'_self')}())`;
    const link = $('bookmarkletLink');
    link.href = code;
  }

  // Check for ?capture= or share target params (?text=, ?url=, ?title=) on load
  function checkCaptureParam() {
    const params = new URLSearchParams(window.location.search);

    // Build capture text from any combination of share target params
    let captureText = params.get('capture') || '';
    const sharedUrl = params.get('url') || '';
    const sharedTitle = params.get('title') || '';
    const sharedText = params.get('text') || '';

    if (!captureText && (sharedUrl || sharedText || sharedTitle)) {
      const parts = [];
      if (sharedText) parts.push(sharedText);
      else if (sharedTitle) parts.push(sharedTitle);
      if (sharedUrl) parts.push(sharedUrl);
      captureText = parts.join('\n\n');
    }

    if (!captureText) return;

    if (state.inbox.length < MAX_CAPACITY) {
      state.inbox.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text: captureText,
        created: Date.now(),
        type: isUrl(captureText.split('\n')[0]) ? 'link' : 'text'
      });
      logEvent('capture', { itemType: 'share' });
      saveState();
      window.history.replaceState({}, '', window.location.pathname);
      showToast('Captured from the wild');
    } else {
      window.history.replaceState({}, '', window.location.pathname);
      showToast('Tape is full — release before capturing');
    }
  }

  // ═══════════════════════════════════════════════
  //  TICK — periodic refresh for decay + settle
  // ═══════════════════════════════════════════════
  function checkDecayNotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = Date.now();
    if (now - state.lastNotificationTs < 3600000) return; // max 1 per hour
    for (const item of state.inbox) {
      if (notifiedItems.has(item.id)) continue;
      if (decayRatio(item) >= 0.85) {
        notifiedItems.add(item.id);
        const preview = item.text.slice(0, 50) + (item.text.length > 50 ? '…' : '');
        new Notification('Alchemy — fading fast', { body: preview, icon: 'icon-192.png' });
        state.lastNotificationTs = now;
        saveState();
        return; // one at a time
      }
    }
  }

  function tick() {
    processDecay();
    processArchiveDecay();
    maybeResurface();
    checkDecayNotifications();
    if (currentView === 'inbox') renderInbox();
  }

  // Fast tick for settle/cooling countdowns — adapts interval to what's needed
  let settleTick = null;
  let settleTickInterval = 0;
  function manageSettleTick() {
    const hasSettling = state.inbox.some(item => isSettling(item));
    const hasCooling = state.inbox.some(item => isCooling(item));
    // 1s for settle countdowns, 60s for cooling-only, off if neither
    const needed = hasSettling ? 1000 : (hasCooling ? 60000 : 0);

    if (needed === 0 && settleTick) {
      clearInterval(settleTick);
      settleTick = null;
      settleTickInterval = 0;
      return;
    }
    if (needed > 0 && needed !== settleTickInterval) {
      if (settleTick) clearInterval(settleTick);
      settleTickInterval = needed;
      settleTick = setInterval(() => {
        if (currentView === 'inbox') renderInbox();
        manageSettleTick(); // re-evaluate interval
      }, needed);
    }
  }

  const EMBED_MODE = document.body && document.body.dataset && document.body.dataset.embed === 'true';

  // ═══════════════════════════════════════════════
  //  PWA — Service Worker & Install
  // ═══════════════════════════════════════════════
  if ('serviceWorker' in navigator && !EMBED_MODE) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  let deferredInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    // Show a subtle install hint in the log view
    const hint = document.createElement('div');
    hint.className = 'bookmarklet-section';
    hint.innerHTML = `
      <div class="bookmarklet-label">Install as app</div>
      <button class="data-btn" id="installBtn" style="font-size:0.6rem; padding:8px 20px;">
        Install Alchemy
      </button>
      <div class="bookmarklet-hint">Add to your home screen for offline access and share target.</div>
    `;
    logContent.parentElement.appendChild(hint);

    document.addEventListener('click', (ev) => {
      if (ev.target.id === 'installBtn' && deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then((result) => {
          if (result.outcome === 'accepted') {
            showToast('Installed — welcome home');
            hint.remove();
          }
          deferredInstallPrompt = null;
        });
      }
    });
  });

  // ═══════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════
  // First-run onboarding
  const onboarding = $('onboarding');
  const onboardingBegin = $('onboardingBegin');
  if (onboarding && onboardingBegin) {
    if (EMBED_MODE || localStorage.getItem('alchemy_onboarded')) {
      onboarding.classList.add('hidden');
    } else {
      onboardingBegin.addEventListener('click', () => {
        onboarding.classList.add('hidden');
        localStorage.setItem('alchemy_onboarded', '1');
      });
    }
  }

  checkCaptureParam();
  setupBookmarklet();
  processDecay();
  maybeResurface();
  processArchiveDecay();
  saveState();
  renderInbox();
  updateCounts();
  updateReels();
  renderCapacity();
  updateCycleAndAscendency();
  manageSettleTick();

  let tickId = setInterval(tick, TICK_INTERVAL);

  // Pause all timers when tab is backgrounded to save battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(tickId);
      tickId = null;
      if (settleTick) {
        clearInterval(settleTick);
        settleTick = null;
        settleTickInterval = 0;
      }
    } else {
      // Process any decay that happened while away, then restart
      tick();
      renderInbox();
      tickId = setInterval(tick, TICK_INTERVAL);
      manageSettleTick();
    }
  });

  // ═══════════════════════════════════════════════════════════════
  //  INFORMATION METABOLISM DIAGNOSTIC (6th view)
  //  12-question assessment across 4 axes.
  //  Absorbed from alchemy-diagnostic repo, 2026-04-23.
  // ═══════════════════════════════════════════════════════════════
  const DIAG_QUESTIONS = [
    { id: 'q1', axis: 'intake', text: 'On a normal day, how much new information do you take in — articles, videos, scrolling, meetings, conversations?', options: ['Very little — under 30 minutes total', 'A modest amount — an hour or two', 'A steady stream — a few hours', 'A lot — most of the day', 'It never really stops'] },
    { id: 'q2', axis: 'intake', text: 'When something enters your attention, how often are you the one choosing vs. something pulling you?', options: ['Almost always pulled — I react to what shows up', 'Mostly pulled', 'About half and half', 'Mostly chosen', 'Almost always chosen — I decide what to let in'] },
    { id: 'q3', axis: 'intake', text: 'After a stretch of consuming, how do you usually feel?', options: ['Cluttered, wired, scattered', 'Slightly overloaded', 'Neutral', 'A little clearer', 'Clearer and more composed than when I started'] },
    { id: 'q4', axis: 'transformation', text: 'When something lands — an idea, a quote, a pattern — what usually happens next?', options: ['I save it somewhere and rarely come back', 'I think about it briefly, then move on', 'I note it for possible future use', 'I write, talk, or make something with it', 'I run it through a deliberate practice'] },
    { id: 'q5', axis: 'transformation', text: 'How often does raw material change shape in your hands — become a note, a sentence, a drawing, a new question?', options: ['Almost never', 'Occasionally', 'Sometimes', 'Often', 'Nearly everything I take in'] },
    { id: 'q6', axis: 'transformation', text: 'When you sit with something unresolved or uncomfortable, how long can you stay with it before resolving or discarding?', options: ['Minutes at most', 'Part of a day', 'A day or two', 'Most of a week', 'Days or weeks — I let things cook'] },
    { id: 'q7', axis: 'expression', text: 'In a typical month, how much of your output carries your voice — your framing, your questions, your angle?', options: ['Almost none — I mostly reformulate or respond to others', 'A little', 'About half', 'Most of it', 'Nearly all — I generate more than I react'] },
    { id: 'q8', axis: 'expression', text: 'How often are you putting work out publicly — writing, speaking, posting, presenting?', options: ['Rarely or never', 'A few times a year', 'Monthly', 'Weekly', 'More than weekly'] },
    { id: 'q9', axis: 'expression', text: 'If someone with similar skills saw your recent work, could they have made the same thing?', options: ['Yes, it\u2019s pretty interchangeable', 'Mostly', 'Some of it', 'Not really — it carries my perspective', 'No — it\u2019s unmistakably mine'] },
    { id: 'q10', axis: 'returnFlow', text: 'Does your published or shared work come back to you — as responses, conversations, new questions, new invitations?', options: ['Almost never — it disappears', 'Occasionally', 'Sometimes', 'Usually', 'Almost always — every piece opens the next'] },
    { id: 'q11', axis: 'returnFlow', text: 'How often do you re-encounter your own past work and let it shape what comes next?', options: ['Rarely — past work stays past', 'Occasionally', 'Sometimes', 'Often', 'Regularly — I mine my own history'] },
    { id: 'q12', axis: 'returnFlow', text: 'If you drew the path of your information — where it enters, what happens to it, where it goes — would it look more like a pipe or a loop?', options: ['A pipe — in and out', 'Mostly pipe with small returns', 'A pipe that\u2019s starting to curve', 'A loop with leaks', 'A closed circulating torus'] }
  ];

  const diagRoot = $('diagnosticRoot');
  // view: landing | question | embed-gate (funnel only) | report
  let diagState = { view: 'landing', index: 0, answers: {}, name: '', email: '' };

  // Optional embed lead-capture layer. The free PWA carries none of it: the name
  // field, email gate, booking CTA, and lead postMessages all live in
  // embed-funnel.js, which only embed.html loads. When that file is absent these
  // hooks are undefined and the diagnostic runs as the pure, accountless tool.
  function embedFunnel() {
    return (typeof window !== 'undefined' && window.AlchemyEmbedFunnel) || null;
  }

  function diagMean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

  function diagComputeScores(a) {
    const q1Inverted = 6 - a.q1;
    const intake = diagMean([q1Inverted, a.q2, a.q3]);
    const transformation = diagMean([a.q4, a.q5, a.q6]);
    const expression = diagMean([a.q7, a.q8, a.q9]);
    const returnFlow = diagMean([a.q10, a.q11, a.q12]);
    return { intake, transformation, expression, returnFlow, volume: a.q1, circulation: diagMean([intake, transformation, expression, returnFlow]) };
  }

  function diagQuadrant(s) {
    const hv = s.volume > 3, hc = s.circulation > 3;
    if (hv && hc) return { name: 'Thriving', summary: 'a circulating torus' };
    if (hv && !hc) return { name: 'Drowning', summary: 'a pipe under pressure' };
    if (!hv && hc) return { name: 'Distilling', summary: 'a compact loop' };
    return { name: 'Stagnant', summary: 'an idle field' };
  }

  function diagFindings(s) {
    const out = [];
    const deliberate = [s.transformation, s.expression, s.returnFlow];
    if (deliberate.every(v => v >= 4) && s.intake >= 3.5) out.push('Your circulation is strong across every axis. The work here is refinement, not restructuring.');
    if (deliberate.every(v => v <= 2) && s.volume <= 2) out.push('Your system is under-activated. Start with one axis — return flow is usually the highest leverage.');
    if (s.returnFlow <= 2) out.push('Your system is operating as a pipe. Material enters and exits without circling back.');
    if (s.volume >= 4 && s.transformation <= 2) out.push('Your intake is high but transformation is low — you are taking in more than you can metabolize.');
    if (s.transformation >= 4 && s.expression <= 2) out.push('Your transformation is strong but expression is low. Material is being processed but not released.');
    if (s.expression >= 4 && s.returnFlow <= 2) out.push('You are producing — but the work is not coming back to feed the next cycle.');
    if (s.intake <= 2 && s.volume >= 4) out.push('A lot is getting in, but almost none of it is by choice. The filter needs building before anything else.');
    if (s.expression <= 2 && s.transformation >= 3) out.push('You are metabolizing material privately. The next move is finding a public surface to release it.');
    if (s.volume <= 2 && s.circulation >= 4) out.push('Low volume, high circulation. You are distilling. The risk here is starvation, not overload.');
    const q = diagQuadrant(s);
    out.push('Your placement: ' + q.name + ' — your information field currently shapes itself like ' + q.summary + '.');
    return out.slice(0, 5);
  }

  function diagRecs(s) {
    const recs = [];
    if (s.transformation <= 2 && s.volume >= 4) recs.push({ tier: 'Sift first', body: 'Your intake is high but little is metabolizing. Before adding output, build a filter and a metabolizing rhythm — less in, slower in, more digested.' });
    if (s.expression <= 2) recs.push({ tier: 'Release what you already have', body: 'You are holding more than you are releasing. Establish an output practice: one small, regular act of saying what you have already metabolized.' });
    if (s.returnFlow <= 2) recs.push({ tier: 'Close the loop', body: 'Information is moving through but not returning. Build a return-flow habit — a publishing rhythm that feeds response back into your inquiry.' });
    if (s.circulation >= 4) recs.push({ tier: 'Refine, do not restructure', body: 'You are running a torus already. Next work is longitudinal: track what circulates, notice drift, refine the rhythm — not rebuild it.' });
    if (recs.length === 0) recs.push({ tier: 'Sit with it', body: 'Nothing is flashing red. Re-read the findings. The work now is attention, not action.' });
    return recs.slice(0, 3);
  }

  function diagRenderTorusMap(s) {
    const W = 340, H = 340, P = 46;
    const iw = W - P * 2, ih = H - P * 2;
    const cx = P + ((s.circulation - 1) / 4) * iw;
    const cy = P + ((5 - s.volume) / 4) * ih;
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="diag-chart" role="img" aria-label="Placement map">
      <rect x="${P}" y="${P}" width="${iw}" height="${ih}" fill="none" stroke="var(--parchment-ghost)" stroke-width="1"/>
      <line x1="${P + iw/2}" y1="${P}" x2="${P + iw/2}" y2="${P + ih}" stroke="var(--parchment-ghost)" stroke-dasharray="2 4"/>
      <line x1="${P}" y1="${P + ih/2}" x2="${P + iw}" y2="${P + ih/2}" stroke="var(--parchment-ghost)" stroke-dasharray="2 4"/>
      <text x="${P + iw*0.25}" y="${P + ih*0.18}" class="diag-quad-label" text-anchor="middle">DROWNING</text>
      <text x="${P + iw*0.75}" y="${P + ih*0.18}" class="diag-quad-label" text-anchor="middle">THRIVING</text>
      <text x="${P + iw*0.25}" y="${P + ih*0.88}" class="diag-quad-label" text-anchor="middle">STAGNANT</text>
      <text x="${P + iw*0.75}" y="${P + ih*0.88}" class="diag-quad-label" text-anchor="middle">DISTILLING</text>
      <text x="${W/2}" y="${H - 12}" class="diag-axis-label" text-anchor="middle">CIRCULATION →</text>
      <text x="14" y="${H/2}" class="diag-axis-label" text-anchor="middle" transform="rotate(-90, 14, ${H/2})">VOLUME →</text>
      <circle cx="${cx}" cy="${cy}" r="28" fill="var(--amber-glow)"/>
      <circle cx="${cx}" cy="${cy}" r="6" fill="var(--amber)"/>
      <circle cx="${cx}" cy="${cy}" r="2" fill="var(--bark)"/>
    </svg>`;
  }

  function diagRenderRadar(s) {
    const W = 380, H = 340, cx = W / 2, cy = H / 2, R = 110;
    const axes = [
      { label: 'INTAKE', value: s.intake, angle: -Math.PI / 2 },
      { label: 'TRANSFORM', value: s.transformation, angle: 0 },
      { label: 'EXPRESS', value: s.expression, angle: Math.PI / 2 },
      { label: 'RETURN', value: s.returnFlow, angle: Math.PI }
    ];
    let rings = '';
    for (let i = 1; i <= 5; i++) {
      const r = (R * i) / 5;
      rings += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--parchment-ghost)" stroke-width="${i === 5 ? 1 : 0.6}" stroke-dasharray="${i === 5 ? '' : '1 3'}"/>`;
    }
    let lines = '', clientPts = [], vertices = '', labels = '';
    axes.forEach((a, i) => {
      const ex = cx + Math.cos(a.angle) * R, ey = cy + Math.sin(a.angle) * R;
      lines += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="var(--parchment-ghost)" stroke-width="0.6"/>`;
      const r = (R * a.value) / 5;
      const px = cx + Math.cos(a.angle) * r, py = cy + Math.sin(a.angle) * r;
      clientPts.push([px, py]);
      vertices += `<circle cx="${px}" cy="${py}" r="3" fill="var(--amber)"/>`;
      const lr = R + 22, lx = cx + Math.cos(a.angle) * lr, ly = cy + Math.sin(a.angle) * lr + 4;
      const anchor = (i === 0 || i === 2) ? 'middle' : (i === 1 ? 'start' : 'end');
      labels += `<text x="${lx}" y="${ly}" class="diag-radar-label" text-anchor="${anchor}">${a.label}</text>`;
    });
    const clientPath = clientPts.map(p => p.join(',')).join(' ');
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="diag-chart" role="img" aria-label="Four-axis metabolism radar">
      ${rings}${lines}
      <polygon points="${clientPath}" fill="var(--amber-glow)" stroke="var(--amber)" stroke-width="1.5"/>
      ${vertices}${labels}
      <circle cx="${cx}" cy="${cy}" r="2" fill="var(--parchment)"/>
    </svg>`;
  }

  function diagRenderLanding() {
    const priorLine = state.diagnostic
      ? `<p class="diag-prior">Last taken ${new Date(state.diagnostic.takenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — placement was <strong>${escapeHtml(state.diagnostic.quadrant)}</strong>. Retaking will overwrite.</p>`
      : '';
    // Name field only on the marketing embed; the funnel layer provides it.
    const f = embedFunnel();
    const nameField = f && f.landingField ? f.landingField(diagState) : '';
    return `<div class="diag-landing">
      <div class="diag-eyebrow">INFORMATION METABOLISM</div>
      <h2 class="diag-heading">Diagnostic</h2>
      <p class="diag-lede">A 12-question snapshot of how information moves through your system. Pipe or torus?</p>
      <ul class="diag-meta"><li>Twelve questions</li><li>About four minutes</li><li>Stored only on this device</li></ul>
      ${priorLine}
      ${nameField}
      <button class="diag-btn-primary" data-diag="start">${state.diagnostic ? 'Retake' : 'Begin'}</button>
      ${state.diagnostic ? '<button class="diag-btn-ghost" data-diag="show-report">See last report</button>' : ''}
    </div>`;
  }

  function diagRenderQuestion() {
    const q = DIAG_QUESTIONS[diagState.index];
    const total = DIAG_QUESTIONS.length;
    const selected = diagState.answers[q.id];
    let dots = '';
    for (let i = 0; i < total; i++) {
      const cls = i === diagState.index ? 'diag-dot active' : (diagState.answers[DIAG_QUESTIONS[i].id] ? 'diag-dot done' : 'diag-dot');
      dots += `<span class="${cls}"></span>`;
    }
    const axisLabel = { intake: 'Intake · Sift', transformation: 'Transformation · Alchemy', expression: 'Expression · Say Why', returnFlow: 'Return flow · Torus' }[q.axis];
    let opts = '';
    q.options.forEach((opt, i) => {
      const val = i + 1;
      opts += `<button class="diag-opt${selected === val ? ' selected' : ''}" data-diag="answer" data-value="${val}"><span class="diag-opt-num">${val}</span><span class="diag-opt-text">${escapeHtml(opt)}</span></button>`;
    });
    return `<div class="diag-question">
      <div class="diag-q-head"><div class="diag-q-axis">${axisLabel}</div><div class="diag-q-progress">${diagState.index + 1} of ${total}</div></div>
      <div class="diag-q-dots">${dots}</div>
      <h3 class="diag-q-text">${escapeHtml(q.text)}</h3>
      <div class="diag-q-options">${opts}</div>
      <div class="diag-q-nav">
        ${diagState.index > 0 ? '<button class="diag-btn-ghost" data-diag="back">← Back</button>' : '<span></span>'}
        ${selected ? `<button class="diag-btn-primary" data-diag="next">${diagState.index === total - 1 ? 'See report →' : 'Next →'}</button>` : '<span class="diag-hint">Pick 1–5 or press a number key</span>'}
      </div>
    </div>`;
  }

  function diagRenderReport() {
    const d = state.diagnostic;
    if (!d) { diagState.view = 'landing'; return diagRenderLanding(); }
    const s = d.scores;
    const findings = diagFindings(s);
    const recs = diagRecs(s);
    const fmt = v => v.toFixed(1);
    const findingsHtml = findings.map(f => `<li>${escapeHtml(f)}</li>`).join('');
    const recsHtml = recs.map(r => `<div class="diag-rec"><div class="diag-rec-tier">${escapeHtml(r.tier)}</div><div class="diag-rec-body">${escapeHtml(r.body)}</div></div>`).join('');
    return `<div class="diag-report">
      <div class="diag-report-head"><div class="diag-eyebrow">METABOLISM REPORT</div><div class="diag-report-meta">${new Date(d.takenAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · placement: <strong>${escapeHtml(d.quadrant)}</strong></div></div>
      <div class="diag-charts">
        <div class="diag-chart-card"><div class="diag-chart-title">PLACEMENT MAP</div>${diagRenderTorusMap(s)}</div>
        <div class="diag-chart-card"><div class="diag-chart-title">FOUR-AXIS METABOLISM</div>${diagRenderRadar(s)}</div>
      </div>
      <div class="diag-scores">
        <div class="diag-score-pill"><div class="diag-score-label">INTAKE</div><div class="diag-score-value">${fmt(s.intake)}</div></div>
        <div class="diag-score-pill"><div class="diag-score-label">TRANSFORM</div><div class="diag-score-value">${fmt(s.transformation)}</div></div>
        <div class="diag-score-pill"><div class="diag-score-label">EXPRESS</div><div class="diag-score-value">${fmt(s.expression)}</div></div>
        <div class="diag-score-pill"><div class="diag-score-label">RETURN</div><div class="diag-score-value">${fmt(s.returnFlow)}</div></div>
      </div>
      <div class="diag-findings"><div class="diag-section-title">KEY FINDINGS</div><ul>${findingsHtml}</ul></div>
      <div class="diag-recs"><div class="diag-section-title">NEXT STEPS</div>${recsHtml}</div>
      ${(() => { const f = embedFunnel(); return f && f.reportExtra ? f.reportExtra(d) : ''; })()}
      <div class="diag-report-foot"><button class="diag-btn-ghost" data-diag="restart">↻ Start over</button></div>
    </div>`;
  }

  function renderDiagnostic() {
    if (!diagRoot) return;
    let html = '';
    if (diagState.view === 'landing') html = diagRenderLanding();
    else if (diagState.view === 'question') html = diagRenderQuestion();
    else if (diagState.view === 'embed-gate') { const f = embedFunnel(); html = f && f.gateView ? f.gateView(diagState) : ''; }
    else if (diagState.view === 'report') html = diagRenderReport();
    diagRoot.innerHTML = html;
    try { window.parent && window.parent !== window && window.parent.postMessage({ type: 'height', px: document.documentElement.scrollHeight }, '*'); } catch (e) {}
  }

  function diagCommitResults() {
    const scores = diagComputeScores(diagState.answers);
    const q = diagQuadrant(scores);
    state.diagnostic = { answers: { ...diagState.answers }, scores, quadrant: q.name, summary: q.summary, takenAt: Date.now() };
    saveState();
    applyDiagnosticTuning();
    updateCounts();
    try { window.parent && window.parent !== window && window.parent.postMessage({ type: 'diagnostic-complete', scores, quadrant: q.name }, '*'); } catch (e) {}
    const f = embedFunnel();
    if (f && f.onComplete) f.onComplete(scores, q.name); // funnel posts its lead 'complete'
  }

  function diagHandle(action, target) {
    // The embed funnel claims its own actions (the email gate's skip / submit).
    const f = embedFunnel();
    if (f && f.handleAction && f.handleAction(action, target, { diagState, commit: diagCommitResults, render: renderDiagnostic })) return;

    if (action === 'start') {
      const r = f && f.onStart ? f.onStart() : null; // funnel reads the name + posts 'started'
      diagState = { view: 'question', index: 0, answers: {}, name: (r && r.name) || '', email: '' };
      renderDiagnostic();
    } else if (action === 'answer') {
      const val = parseInt(target.dataset.value, 10);
      diagState.answers[DIAG_QUESTIONS[diagState.index].id] = val;
      renderDiagnostic();
    } else if (action === 'next') {
      if (diagState.index < DIAG_QUESTIONS.length - 1) {
        diagState.index++;
        renderDiagnostic();
      } else if (f && f.wantsGate && f.wantsGate()) {
        // Marketing surface: collect an email before revealing the report.
        diagState.view = 'embed-gate';
        renderDiagnostic();
      } else {
        diagCommitResults();
        diagState.view = 'report';
        renderDiagnostic();
      }
    } else if (action === 'back') {
      if (diagState.index > 0) { diagState.index--; renderDiagnostic(); }
    } else if (action === 'restart') {
      diagState = { view: 'landing', index: 0, answers: {}, name: '', email: '' };
      renderDiagnostic();
    } else if (action === 'show-report') {
      // Landing "See last report" — results already committed. (The gate's
      // own show-report is intercepted by the funnel above.)
      diagState.view = 'report';
      renderDiagnostic();
    }
  }

  if (diagRoot) {
    diagRoot.addEventListener('click', (e) => {
      const t = e.target.closest('[data-diag]');
      if (!t) return;
      diagHandle(t.dataset.diag, t);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (currentView !== 'diagnostic') return;
    if (diagState.view === 'embed-gate') {
      if (e.key === 'Enter') { e.preventDefault(); diagHandle('show-report'); }
      return;
    }
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (diagState.view === 'question') {
      if (e.key >= '1' && e.key <= '5') {
        const val = parseInt(e.key, 10);
        diagState.answers[DIAG_QUESTIONS[diagState.index].id] = val;
        renderDiagnostic();
        setTimeout(() => {
          if (diagState.answers[DIAG_QUESTIONS[diagState.index].id] === val && diagState.view === 'question') diagHandle('next');
        }, 220);
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        diagHandle('back');
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (diagState.answers[DIAG_QUESTIONS[diagState.index].id]) diagHandle('next');
      }
    }
  });

})();
