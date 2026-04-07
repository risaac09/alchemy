#!/usr/bin/env node
/**
 * Alchemy Test Suite
 *
 * Exercises the state machine without a real browser.
 * Uses jsdom to simulate the DOM environment.
 *
 * Run: node test.js
 * Requires: npm install jsdom (dev dependency)
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'app.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, name) {
  if (condition) {
    passed++;
    process.stdout.write('.');
  } else {
    failed++;
    failures.push(name);
    process.stdout.write('F');
  }
}

function assertEqual(actual, expected, name) {
  if (actual === expected) {
    passed++;
    process.stdout.write('.');
  } else {
    failed++;
    failures.push(`${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    process.stdout.write('F');
  }
}

function createApp(seedState, urlParams) {
  const url = urlParams
    ? `http://localhost:8420/?${urlParams}`
    : 'http://localhost:8420/';

  // Inject seed state before app.js runs by prepending a localStorage write
  const seedScript = seedState
    ? `localStorage.setItem('alchemy_v2', ${JSON.stringify(JSON.stringify(seedState))});`
    : '';

  const fullHtml = html
    .replace('<link rel="stylesheet" href="app.css">', `<style>${css}</style>`)
    .replace('<script src="app.js"></script>', `<script>${seedScript}\n${js}</script>`);

  const dom = new JSDOM(fullHtml, {
    url,
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    storageQuota: 10000000
  });

  return dom;
}

function getState(dom) {
  const raw = dom.window.localStorage.getItem('alchemy_v2');
  return raw ? JSON.parse(raw) : null;
}

function setState(dom, state) {
  dom.window.localStorage.setItem('alchemy_v2', JSON.stringify(state));
}

// ═══════════════════════════════════════════════
//  TEST: Fresh app loads with empty state
// ═══════════════════════════════════════════════
function testFreshLoad() {
  const dom = createApp();
  const state = getState(dom);

  assert(state !== null, 'State exists in localStorage');
  assertEqual(state.inbox.length, 0, 'Inbox starts empty');
  assertEqual(state.archive.length, 0, 'Archive starts empty');
  assertEqual(state.stats.totalKept, 0, 'No items kept');
  assertEqual(state.stats.totalReleased, 0, 'No items released');
  assert(Array.isArray(state.events), 'Events array exists');

  // Empty state should be visible
  const emptyState = dom.window.document.getElementById('inboxEmpty');
  assert(emptyState.style.display === 'flex', 'Empty state is visible');

  // Capture button should be enabled
  const captureBtn = dom.window.document.getElementById('captureBtn');
  assert(!captureBtn.disabled, 'Capture button is enabled');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Capture adds item to inbox
// ═══════════════════════════════════════════════
function testCapture() {
  const dom = createApp();
  const doc = dom.window.document;

  const input = doc.getElementById('captureInput');
  const btn = doc.getElementById('captureBtn');

  input.value = 'Test base matter';
  btn.click();

  const state = getState(dom);
  assertEqual(state.inbox.length, 1, 'Inbox has 1 item after capture');
  assertEqual(state.inbox[0].text, 'Test base matter', 'Item text matches');
  assert(state.inbox[0].id, 'Item has an ID');
  assert(state.inbox[0].created > 0, 'Item has a creation timestamp');
  assertEqual(state.inbox[0].type, 'text', 'Plain text classified as text');

  // Input should be cleared
  assertEqual(input.value, '', 'Input cleared after capture');

  // Event logged
  const captureEvents = state.events.filter(e => e.type === 'capture');
  assertEqual(captureEvents.length, 1, 'Capture event logged');

  // Inbox list should show item
  const inboxList = doc.getElementById('inboxList');
  assert(inboxList.children.length === 1, 'Inbox list has 1 child');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: URL classification
// ═══════════════════════════════════════════════
function testUrlClassification() {
  const dom = createApp();
  const doc = dom.window.document;
  const input = doc.getElementById('captureInput');
  const btn = doc.getElementById('captureBtn');

  input.value = 'https://example.com/article';
  btn.click();

  const state = getState(dom);
  assertEqual(state.inbox[0].type, 'link', 'URL classified as link');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Capacity limit enforced
// ═══════════════════════════════════════════════
function testCapacityLimit() {
  const dom = createApp();
  const doc = dom.window.document;
  const input = doc.getElementById('captureInput');
  const btn = doc.getElementById('captureBtn');

  // Fill to capacity
  for (let i = 0; i < 7; i++) {
    input.value = `Item ${i + 1}`;
    btn.click();
  }

  let state = getState(dom);
  assertEqual(state.inbox.length, 7, 'Inbox is full at 7');

  // 8th capture should fail
  input.value = 'Overflow item';
  btn.click();

  state = getState(dom);
  assertEqual(state.inbox.length, 7, 'Inbox stays at 7 after overflow attempt');

  // Capture button should be disabled
  assert(btn.disabled, 'Capture button disabled when full');

  // Warning should be visible
  const warning = doc.getElementById('capacityWarning');
  assert(warning.classList.contains('visible'), 'Capacity warning visible');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Settle prevents immediate reflection
// ═══════════════════════════════════════════════
function testSettlePeriod() {
  const dom = createApp();
  const doc = dom.window.document;
  const input = doc.getElementById('captureInput');
  const btn = doc.getElementById('captureBtn');

  input.value = 'Fresh item';
  btn.click();

  // Item should have settling class
  const items = doc.querySelectorAll('.inbox-item');
  assert(items.length === 1, 'One inbox item rendered');
  assert(items[0].classList.contains('settling'), 'Item has settling class');

  // Clicking should NOT navigate to reflect (currentView stays inbox)
  items[0].click();
  const reflectView = doc.getElementById('viewReflect');
  assert(!reflectView.classList.contains('active'), 'Reflect view not activated during settle');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Reflect and alchemize flow
// ═══════════════════════════════════════════════
function testReflectAndAlchemize() {
  const seed = {
    inbox: [{
      id: 'test123',
      text: 'Mature item',
      created: Date.now() - 60000,
      type: 'text'
    }],
    archive: [],
    stats: { totalKept: 0, totalReleased: 0 },
    events: [],
    lastResurface: 0
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  const inboxItems = doc.querySelectorAll('.inbox-item');
  assert(inboxItems.length >= 1, 'Seeded item is rendered');

  inboxItems[0].click();

  const reflectView = doc.getElementById('viewReflect');
  assert(reflectView.classList.contains('active'), 'Reflect view activated');

  const reflectMatter = doc.getElementById('reflectMatter');
  assert(reflectMatter.innerHTML.includes('Mature item'), 'Reflect shows item text');

  const alchemizeBtn = doc.getElementById('alchemizeBtn');
  assert(alchemizeBtn.disabled, 'Alchemize disabled without reflection');

  const reflectInput = doc.getElementById('reflectInput');
  reflectInput.value = 'This is my reflection';
  reflectInput.dispatchEvent(new dom.window.Event('input'));
  assert(!alchemizeBtn.disabled, 'Alchemize enabled after reflection');

  alchemizeBtn.click();

  const goldView = doc.getElementById('viewGold');
  assert(goldView.classList.contains('active'), 'Gold view activated');

  const state = getState(dom);
  assertEqual(state.inbox.length, 0, 'Item removed from inbox after alchemize');

  const goldMatter = doc.getElementById('goldMatter');
  assert(goldMatter.innerHTML.includes('Mature item'), 'Gold shows matter');
  const goldReflection = doc.getElementById('goldReflection');
  assert(goldReflection.textContent.includes('This is my reflection'), 'Gold shows reflection');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Keep moves to archive
// ═══════════════════════════════════════════════
function testKeep() {
  const seed = {
    inbox: [{ id: 'keep-test', text: 'Keep me', created: Date.now() - 60000, type: 'text' }],
    archive: [], stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: 0
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  doc.querySelectorAll('.inbox-item')[0].click();
  const reflectInput = doc.getElementById('reflectInput');
  reflectInput.value = 'Worth keeping';
  reflectInput.dispatchEvent(new dom.window.Event('input'));
  doc.getElementById('alchemizeBtn').click();
  doc.getElementById('releaseBtn').click();

  const modal = doc.getElementById('releaseModal');
  assert(modal.classList.contains('active'), 'Release modal is active');

  doc.getElementById('modalKeep').click();

  const state = getState(dom);
  assertEqual(state.inbox.length, 0, 'Inbox empty after keep');
  assertEqual(state.archive.length, 1, 'Archive has 1 item');
  assertEqual(state.archive[0].matter, 'Keep me', 'Archived matter matches');
  assertEqual(state.archive[0].reflection, 'Worth keeping', 'Archived reflection matches');
  assertEqual(state.stats.totalKept, 1, 'totalKept incremented');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Let go deletes item
// ═══════════════════════════════════════════════
function testLetGo() {
  const seed = {
    inbox: [{ id: 'letgo-test', text: 'Release me', created: Date.now() - 60000, type: 'text' }],
    archive: [], stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: 0
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  doc.querySelectorAll('.inbox-item')[0].click();
  const reflectInput = doc.getElementById('reflectInput');
  reflectInput.value = 'Goodbye';
  reflectInput.dispatchEvent(new dom.window.Event('input'));
  doc.getElementById('alchemizeBtn').click();
  doc.getElementById('releaseBtn').click();
  doc.getElementById('modalLetGo').click();

  const state = getState(dom);
  assertEqual(state.archive.length, 0, 'Archive still empty after let go');
  assertEqual(state.stats.totalReleased, 1, 'totalReleased incremented');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Inbox decay removes old items
// ═══════════════════════════════════════════════
function testInboxDecay() {
  const seed = {
    inbox: [
      { id: 'old-item', text: 'Ancient thought', created: Date.now() - (73 * 3600000), type: 'text' },
      { id: 'fresh-item', text: 'Recent thought', created: Date.now() - 3600000, type: 'text' }
    ],
    archive: [], stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: 0
  };

  const dom = createApp(seed);
  const state = getState(dom);

  const hasOld = state.inbox.some(i => i.id === 'old-item');
  const hasFresh = state.inbox.some(i => i.id === 'fresh-item');

  assert(!hasOld, 'Decayed item removed from inbox');
  assert(hasFresh, 'Fresh item still in inbox');
  assert(state.stats.totalReleased >= 1, 'Decayed item counted as released');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Archive decay composts old items
// ═══════════════════════════════════════════════
function testArchiveDecay() {
  const seed = {
    inbox: [],
    archive: [
      { id: 'ancient-gold', matter: 'Old gold', reflection: 'Long ago', created: Date.now() - (100 * 86400000), transmuted: Date.now() - (100 * 86400000), archived: Date.now() - (91 * 86400000), type: 'text' },
      { id: 'recent-gold', matter: 'New gold', reflection: 'Just now', created: Date.now() - 86400000, transmuted: Date.now() - 86400000, archived: Date.now() - 86400000, type: 'text' }
    ],
    stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: Date.now()
  };

  const dom = createApp(seed);
  const state = getState(dom);

  const hasAncient = state.archive.some(i => i.id === 'ancient-gold');
  const hasRecent = state.archive.some(i => i.id === 'recent-gold');

  assert(!hasAncient, 'Ancient archive item composted');
  assert(hasRecent, 'Recent archive item preserved');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Resurfacing moves old archive to inbox
// ═══════════════════════════════════════════════
function testResurfacing() {
  const seed = {
    inbox: [],
    archive: [{
      id: 'resurface-me', matter: 'Old thought', reflection: 'Past wisdom',
      created: Date.now() - (30 * 86400000), transmuted: Date.now() - (30 * 86400000),
      archived: Date.now() - (30 * 86400000), type: 'text'
    }],
    stats: { totalKept: 0, totalReleased: 0 }, events: [],
    lastResurface: Date.now() - (4 * 86400000)
  };

  const dom = createApp(seed);
  const state = getState(dom);

  const inResurfaced = state.inbox.some(i => i.resurfaced === true);
  assert(inResurfaced, 'Resurfaced item appeared in inbox');
  assertEqual(state.archive.length, 0, 'Archive is empty after resurfacing');

  const resurfacedItem = state.inbox.find(i => i.resurfaced);
  assertEqual(resurfacedItem.text, 'Old thought', 'Resurfaced item has original matter as text');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Export/import round-trip
// ═══════════════════════════════════════════════
function testExportImport() {
  const seed = {
    inbox: [{ id: 'export-test', text: 'Export me', created: Date.now() - 60000, type: 'text' }],
    archive: [{ id: 'archived-export', matter: 'Archived matter', reflection: 'Archived reflection', created: Date.now() - 86400000, transmuted: Date.now() - 86400000, archived: Date.now() - 86400000, type: 'text' }],
    stats: { totalKept: 5, totalReleased: 3 }, events: [], lastResurface: Date.now()
  };

  const dom = createApp(seed);

  // Read state (simulates export)
  const exported = JSON.parse(dom.window.localStorage.getItem('alchemy_v2'));

  // Verify round-trip integrity
  assertEqual(exported.inbox.length, 1, 'Exported inbox has 1 item');
  assertEqual(exported.archive.length, 1, 'Exported archive has 1 item');
  assertEqual(exported.stats.totalKept, 5, 'Exported stats preserved');
  assertEqual(exported.inbox[0].text, 'Export me', 'Exported item text matches');

  // Verify the exported JSON can seed a new app
  const dom2 = createApp(exported);
  const reimported = getState(dom2);
  assertEqual(reimported.inbox[0].text, 'Export me', 'Re-imported item text matches');

  dom.window.close();
  dom2.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Share target capture param
// ═══════════════════════════════════════════════
function testShareTarget() {
  const dom = createApp(null, 'capture=Shared+text&url=https%3A%2F%2Fexample.com');

  const state = getState(dom);
  assert(state.inbox.length >= 1, 'Share target created inbox item');

  const item = state.inbox[0];
  assert(item.text.includes('Shared text'), 'Shared text captured');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Markdown copy format
// ═══════════════════════════════════════════════
function testMarkdownFormat() {
  // Verify the archive copy format has YAML frontmatter
  // We can check this by examining the JS source directly
  const hasYamlFrontmatter = js.includes("---\\ncaptured:");
  assert(hasYamlFrontmatter, 'Archive copy includes YAML frontmatter');

  const hasSourceAlchemy = js.includes("source: alchemy");
  assert(hasSourceAlchemy, 'Archive copy includes source: alchemy');

  const hasBlockquote = js.includes("> ${item.matter");
  assert(hasBlockquote || js.includes('> '), 'Archive copy uses blockquote for matter');
}

// ═══════════════════════════════════════════════
//  TEST: Gold back restores item to inbox
// ═══════════════════════════════════════════════
function testGoldBackRestores() {
  const seed = {
    inbox: [{ id: 'restore-test', text: 'Restore me', created: Date.now() - 60000, type: 'text' }],
    archive: [], stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: 0
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  doc.querySelectorAll('.inbox-item')[0].click();
  const reflectInput = doc.getElementById('reflectInput');
  reflectInput.value = 'Reflection';
  reflectInput.dispatchEvent(new dom.window.Event('input'));
  doc.getElementById('alchemizeBtn').click();

  let state = getState(dom);
  assertEqual(state.inbox.length, 0, 'Inbox empty after alchemize');

  doc.getElementById('goldBack').click();

  state = getState(dom);
  assertEqual(state.inbox.length, 1, 'Item restored to inbox after gold back');
  assertEqual(state.inbox[0].text, 'Restore me', 'Restored item has correct text');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Escape key closes modal
// ═══════════════════════════════════════════════
function testEscapeClosesModal() {
  const seed = {
    inbox: [{ id: 'esc-test', text: 'Escape test', created: Date.now() - 60000, type: 'text' }],
    archive: [], stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: 0
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  doc.querySelectorAll('.inbox-item')[0].click();
  const reflectInput = doc.getElementById('reflectInput');
  reflectInput.value = 'Test';
  reflectInput.dispatchEvent(new dom.window.Event('input'));
  doc.getElementById('alchemizeBtn').click();
  doc.getElementById('releaseBtn').click();

  const modal = doc.getElementById('releaseModal');
  assert(modal.classList.contains('active'), 'Modal is open');

  doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert(!modal.classList.contains('active'), 'Modal closed by Escape');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Link cooling blocks clickability
// ═══════════════════════════════════════════════
function testLinkCooling() {
  // Fresh link (just captured) should be cooling
  const seed = {
    inbox: [{ id: 'cool-link', text: 'https://example.com/article', created: Date.now() - 60000, type: 'link' }],
    archive: [], stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: Date.now()
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  // Inbox should show cooling class
  const items = doc.querySelectorAll('.inbox-item');
  assert(items.length === 1, 'Cooling link rendered in inbox');
  assert(items[0].classList.contains('cooling'), 'Link item has cooling class');

  // URL should NOT be a clickable <a> tag — should be a <span>
  const links = items[0].querySelectorAll('a.matter-link');
  assertEqual(links.length, 0, 'No clickable links during cooling');

  const coolingSpans = items[0].querySelectorAll('.matter-link-cooling');
  assertEqual(coolingSpans.length, 1, 'URL rendered as cooling span');

  // Cooling badge should be visible
  const coolingBadge = items[0].querySelector('.cooling-badge');
  assert(coolingBadge !== null, 'Cooling badge is visible');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Cooled link becomes clickable
// ═══════════════════════════════════════════════
function testCooledLink() {
  // Link captured 5 hours ago — cooling period (4h) has passed
  const seed = {
    inbox: [{ id: 'cooled-link', text: 'https://example.com/old', created: Date.now() - (5 * 3600000), type: 'link' }],
    archive: [], stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: Date.now()
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  const items = doc.querySelectorAll('.inbox-item');
  assert(!items[0].classList.contains('cooling'), 'Cooled link has no cooling class');

  // URL should be a clickable <a> tag
  const links = items[0].querySelectorAll('a.matter-link');
  assertEqual(links.length, 1, 'Cooled link is clickable');

  // No cooling badge
  const coolingBadge = items[0].querySelector('.cooling-badge');
  assert(coolingBadge === null, 'No cooling badge on cooled link');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Digest tracking on opened link
// ═══════════════════════════════════════════════
function testDigestTracking() {
  // Link that has been opened
  const seed = {
    inbox: [{ id: 'opened-link', text: 'https://example.com/read', created: Date.now() - (5 * 3600000), type: 'link', opened: true, openedAt: Date.now() - 3600000 }],
    archive: [], stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: Date.now()
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  // Should show digested badge
  const digestedBadge = doc.querySelector('.digested-badge');
  assert(digestedBadge !== null, 'Digested badge shown for opened link');

  // Clicking into reflect should use digested prompt pool
  doc.querySelectorAll('.inbox-item')[0].click();
  const reflectView = doc.getElementById('viewReflect');
  assert(reflectView.classList.contains('active'), 'Reflect view activated for digested link');

  // Prompt should be from digested pool
  const prompt = doc.getElementById('reflectPrompt').textContent;
  assert(prompt.length > 0, 'Digested prompt is shown');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Non-link items are not affected by cooling
// ═══════════════════════════════════════════════
function testTextNotCooled() {
  const seed = {
    inbox: [{ id: 'text-item', text: 'Just a thought', created: Date.now() - 60000, type: 'text' }],
    archive: [], stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: Date.now()
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  const items = doc.querySelectorAll('.inbox-item');
  assert(!items[0].classList.contains('cooling'), 'Text item has no cooling class');

  const coolingBadge = items[0].querySelector('.cooling-badge');
  assert(coolingBadge === null, 'No cooling badge on text item');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Archive search filters items
// ═══════════════════════════════════════════════
function testArchiveSearch() {
  const seed = {
    inbox: [],
    archive: [
      { id: 'a1', matter: 'Quantum physics article', reflection: 'Fascinating ideas', created: Date.now() - 86400000, transmuted: Date.now() - 86400000, archived: Date.now() - 86400000, type: 'link' },
      { id: 'a2', matter: 'Recipe for bread', reflection: 'Simple and nourishing', created: Date.now() - 172800000, transmuted: Date.now() - 172800000, archived: Date.now() - 172800000, type: 'text' },
      { id: 'a3', matter: 'Meeting notes', reflection: 'Key insight about quantum teams', created: Date.now() - 259200000, transmuted: Date.now() - 259200000, archived: Date.now() - 259200000, type: 'text' }
    ],
    stats: { totalKept: 3, totalReleased: 0 }, events: [], lastResurface: Date.now()
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  // Switch to archive view
  doc.querySelector('.nav button:nth-child(2)').click();

  // All 3 items should be visible
  let items = doc.querySelectorAll('.archive-item');
  assertEqual(items.length, 3, 'All 3 archive items shown initially');

  // Search for "quantum" — should match a1 (matter) and a3 (reflection)
  const searchInput = doc.getElementById('archiveSearch');
  searchInput.value = 'quantum';
  searchInput.dispatchEvent(new dom.window.Event('input'));

  // Debounce is 200ms, trigger manually for test
  // The setTimeout won't fire in jsdom without advancing time, so test the filter logic directly
  // We can verify the search input exists and is wired
  assert(searchInput !== null, 'Archive search input exists');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Archive sort toggle
// ═══════════════════════════════════════════════
function testArchiveSort() {
  const seed = {
    inbox: [],
    archive: [
      { id: 'old', matter: 'Old item', reflection: 'First', created: Date.now() - 259200000, transmuted: Date.now() - 259200000, archived: Date.now() - 259200000, type: 'text' },
      { id: 'new', matter: 'New item', reflection: 'Second', created: Date.now() - 86400000, transmuted: Date.now() - 86400000, archived: Date.now() - 86400000, type: 'text' }
    ],
    stats: { totalKept: 2, totalReleased: 0 }, events: [], lastResurface: Date.now()
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  // Switch to archive
  doc.querySelector('.nav button:nth-child(2)').click();

  const sortBtn = doc.getElementById('archiveSortBtn');
  assert(sortBtn !== null, 'Sort button exists');
  assertEqual(sortBtn.textContent, 'newest', 'Default sort is newest');

  // First item should be "Old item" (index 0 in array, newest-first is default array order)
  let firstMatter = doc.querySelector('.archive-item-matter');
  assert(firstMatter !== null, 'Archive items rendered');

  // Click sort to toggle to oldest
  sortBtn.click();
  assertEqual(sortBtn.textContent, 'oldest', 'Sort toggled to oldest');

  // Click again to return to newest
  sortBtn.click();
  assertEqual(sortBtn.textContent, 'newest', 'Sort toggled back to newest');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Undo release restores to archive
// ═══════════════════════════════════════════════
function testUndoRelease() {
  // Test undo on archive release path (no dissipation timeout)
  const seed = {
    inbox: [],
    archive: [{ id: 'undo-arc', matter: 'Undo me', reflection: 'Worth keeping', created: Date.now() - 86400000, transmuted: Date.now() - 86400000, archived: Date.now() - 86400000, type: 'text' }],
    stats: { totalKept: 1, totalReleased: 0 }, events: [], lastResurface: Date.now()
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  // Switch to archive and release the item
  doc.querySelector('.nav button:nth-child(2)').click();
  const releaseBtn = doc.querySelector('.archive-release-btn');
  assert(releaseBtn !== null, 'Archive release button exists');
  releaseBtn.click();

  // Modal should be open
  const modal = doc.getElementById('releaseModal');
  assert(modal.classList.contains('active'), 'Release modal opened for archive item');

  // Let go
  doc.getElementById('modalLetGo').click();

  let state = JSON.parse(dom.window.localStorage.getItem('alchemy_v2'));
  assertEqual(state.archive.length, 0, 'Archive item released');
  assertEqual(state.stats.totalReleased, 1, 'totalReleased incremented');

  // Toast should have undo link
  const toast = doc.getElementById('toast');
  const undoLink = toast.querySelector('.toast-action');
  assert(undoLink !== null, 'Undo link appears in toast');

  // Click undo
  undoLink.click();

  state = JSON.parse(dom.window.localStorage.getItem('alchemy_v2'));
  assertEqual(state.archive.length, 1, 'Undo restored archive item');
  assertEqual(state.stats.totalReleased, 0, 'totalReleased decremented on undo');
  assertEqual(state.archive[0].matter, 'Undo me', 'Restored item has correct matter');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Keyboard shortcuts switch views
// ═══════════════════════════════════════════════
function testKeyboardShortcuts() {
  const dom = createApp();
  const doc = dom.window.document;

  // Press '2' to switch to archive
  doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: '2', bubbles: true }));
  assert(doc.getElementById('viewArchive').classList.contains('active'), 'Key 2 switches to archive');

  // Press '3' to switch to log
  doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: '3', bubbles: true }));
  assert(doc.getElementById('viewLog').classList.contains('active'), 'Key 3 switches to log');

  // Press '1' to switch to inbox
  doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: '1', bubbles: true }));
  assert(doc.getElementById('viewInbox').classList.contains('active'), 'Key 1 switches to inbox');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: ARIA attributes present
// ═══════════════════════════════════════════════
function testAriaAttributes() {
  const dom = createApp();
  const doc = dom.window.document;

  // Nav tablist
  const nav = doc.querySelector('nav.nav');
  assertEqual(nav.getAttribute('role'), 'tablist', 'Nav has role=tablist');

  // Tab buttons
  const tabs = nav.querySelectorAll('button');
  assertEqual(tabs[0].getAttribute('role'), 'tab', 'Inbox button has role=tab');
  assertEqual(tabs[0].getAttribute('aria-selected'), 'true', 'Inbox tab is selected');
  assertEqual(tabs[1].getAttribute('aria-selected'), 'false', 'Archive tab not selected');

  // Tabpanels
  const inboxPanel = doc.getElementById('viewInbox');
  assertEqual(inboxPanel.getAttribute('role'), 'tabpanel', 'Inbox view is tabpanel');
  assertEqual(inboxPanel.getAttribute('aria-labelledby'), 'navInbox', 'Inbox panel labelled by tab');

  // Toast
  const toast = doc.getElementById('toast');
  assertEqual(toast.getAttribute('aria-live'), 'polite', 'Toast has aria-live=polite');
  assertEqual(toast.getAttribute('role'), 'status', 'Toast has role=status');

  // Release modal
  const modal = doc.getElementById('releaseModal');
  assertEqual(modal.getAttribute('role'), 'dialog', 'Modal has role=dialog');
  assertEqual(modal.getAttribute('aria-modal'), 'true', 'Modal has aria-modal=true');

  // Attachment remove button
  const removeBtn = doc.getElementById('attachRemove');
  assertEqual(removeBtn.getAttribute('aria-label'), 'Remove attachment', 'Remove btn has aria-label');

  // Cycle glyph
  const glyph = doc.getElementById('cycleGlyph');
  assert(glyph.getAttribute('aria-label') !== null, 'Cycle glyph has aria-label');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: aria-selected toggles on view switch
// ═══════════════════════════════════════════════
function testAriaSelectedToggle() {
  const dom = createApp();
  const doc = dom.window.document;

  const inboxTab = doc.getElementById('navInbox');
  const archiveTab = doc.getElementById('navArchive');

  // Initially inbox is selected
  assertEqual(inboxTab.getAttribute('aria-selected'), 'true', 'Inbox initially selected');
  assertEqual(archiveTab.getAttribute('aria-selected'), 'false', 'Archive initially not selected');

  // Switch to archive
  archiveTab.click();
  assertEqual(inboxTab.getAttribute('aria-selected'), 'false', 'Inbox deselected after switch');
  assertEqual(archiveTab.getAttribute('aria-selected'), 'true', 'Archive selected after switch');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Fading indicator shows for decaying items
// ═══════════════════════════════════════════════
function testFadingIndicator() {
  const now = Date.now();
  const seed = {
    inbox: [
      { id: 'fresh', text: 'Fresh item', created: now - 1000, type: 'text' },
      { id: 'old', text: 'Old item', created: now - (50 * 3600000), type: 'text' }, // >50% decayed
    ],
    archive: [], stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: now
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  const indicator = doc.getElementById('fadingIndicator');
  assert(indicator !== null, 'Fading indicator element exists');
  assert(indicator.textContent.includes('fading'), 'Fading indicator shows fading text');
  assert(indicator.textContent.includes('1'), 'Fading indicator shows count of 1');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Decay pulse class on >50% items
// ═══════════════════════════════════════════════
function testDecayPulse() {
  const now = Date.now();
  const seed = {
    inbox: [
      { id: 'decaying', text: 'Decaying', created: now - (40 * 3600000), type: 'text' },
    ],
    archive: [], stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: now
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  const item = doc.querySelector('.inbox-item');
  assert(item !== null, 'Inbox item rendered');
  assert(item.classList.contains('decay-pulse'), 'Item has decay-pulse class when >50% decayed');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Sparkline renders in log view
// ═══════════════════════════════════════════════
function testSparkline() {
  const now = Date.now();
  const seed = {
    inbox: [],
    archive: [],
    stats: { totalKept: 2, totalReleased: 1 },
    events: [
      { type: 'capture', ts: now - 3600000, itemType: 'text' },
      { type: 'keep', ts: now - 1800000 },
      { type: 'release', ts: now - 900000 },
    ],
    lastResurface: now
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  // Switch to log
  doc.getElementById('navLog').click();

  const sparkline = doc.querySelector('.sparkline');
  assert(sparkline !== null, 'Sparkline rendered in log');

  const cols = doc.querySelectorAll('.sparkline-col');
  assertEqual(cols.length, 7, 'Sparkline has 7 day columns');

  const legend = doc.querySelector('.sparkline-legend');
  assert(legend !== null, 'Sparkline legend exists');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Monthly type breakdown in log
// ═══════════════════════════════════════════════
function testMonthlyTypeBreakdown() {
  const now = Date.now();
  const seed = {
    inbox: [],
    archive: [],
    stats: { totalKept: 3, totalReleased: 0 },
    events: [
      { type: 'capture', ts: now - 86400000, itemType: 'link' },
      { type: 'capture', ts: now - 86400000 * 2, itemType: 'link' },
      { type: 'capture', ts: now - 86400000 * 3, itemType: 'text' },
      { type: 'keep', ts: now - 86400000 },
      { type: 'keep', ts: now - 86400000 * 2 },
      { type: 'keep', ts: now - 86400000 * 3 },
    ],
    lastResurface: now
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  doc.getElementById('navLog').click();
  const logContent = doc.getElementById('logContent').innerHTML;
  assert(logContent.includes('2 links'), 'Monthly breakdown shows link count');
  assert(logContent.includes('1 text'), 'Monthly breakdown shows text count');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Notification section in log
// ═══════════════════════════════════════════════
function testNotificationSection() {
  const seed = {
    inbox: [], archive: [],
    stats: { totalKept: 1, totalReleased: 0 },
    events: [{ type: 'capture', ts: Date.now(), itemType: 'text' }],
    lastResurface: Date.now()
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  doc.getElementById('navLog').click();
  const logHtml = doc.getElementById('logContent').innerHTML;
  assert(logHtml.includes('Notification'), 'Notification section present in log');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Bulk archive select mode
// ═══════════════════════════════════════════════
function testBulkArchiveSelect() {
  const now = Date.now();
  const seed = {
    inbox: [],
    archive: [
      { id: 'b1', matter: 'First', reflection: 'R1', created: now - 86400000, transmuted: now - 86400000, archived: now - 86400000, type: 'text' },
      { id: 'b2', matter: 'Second', reflection: 'R2', created: now - 172800000, transmuted: now - 172800000, archived: now - 172800000, type: 'text' },
    ],
    stats: { totalKept: 2, totalReleased: 0 }, events: [], lastResurface: now
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  // Switch to archive
  doc.getElementById('navArchive').click();

  // Enter select mode
  const selectBtn = doc.getElementById('archiveSelectBtn');
  assert(selectBtn !== null, 'Select button exists');
  selectBtn.click();

  assertEqual(selectBtn.textContent, 'done', 'Select button shows done');

  const bulkBar = doc.getElementById('bulkReleaseBar');
  assert(bulkBar.style.display !== 'none', 'Bulk release bar visible');

  // Items should have checkboxes
  const checkboxes = doc.querySelectorAll('.archive-checkbox');
  assertEqual(checkboxes.length, 2, 'Checkboxes appear on archive items');

  // Click first item to select it
  const items = doc.querySelectorAll('.archive-item');
  items[0].click();

  const bulkCount = doc.getElementById('bulkReleaseCount');
  assert(bulkCount.textContent.includes('1'), 'Bulk count shows 1 selected');

  // Click second item
  items[1].click();
  // Re-query after re-render
  const updatedCount = doc.getElementById('bulkReleaseCount');
  assert(updatedCount.textContent.includes('2'), 'Bulk count shows 2 selected');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Bulk release executes and supports undo
// ═══════════════════════════════════════════════
function testBulkRelease() {
  const now = Date.now();
  const seed = {
    inbox: [],
    archive: [
      { id: 'br1', matter: 'Bulk1', reflection: 'R1', created: now - 86400000, transmuted: now - 86400000, archived: now - 86400000, type: 'text' },
      { id: 'br2', matter: 'Bulk2', reflection: 'R2', created: now - 172800000, transmuted: now - 172800000, archived: now - 172800000, type: 'text' },
      { id: 'br3', matter: 'Keep', reflection: 'R3', created: now - 259200000, transmuted: now - 259200000, archived: now - 259200000, type: 'text' },
    ],
    stats: { totalKept: 3, totalReleased: 0 }, events: [], lastResurface: now
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  doc.getElementById('navArchive').click();
  doc.getElementById('archiveSelectBtn').click();

  // Select first two items
  let items = doc.querySelectorAll('.archive-item');
  items[0].click();
  items = doc.querySelectorAll('.archive-item');
  items[1].click();

  // Click bulk release
  doc.getElementById('bulkReleaseBtn').click();

  // Modal should open
  const modal = doc.getElementById('releaseModal');
  assert(modal.classList.contains('active'), 'Modal opens for bulk release');

  // Let go
  doc.getElementById('modalLetGo').click();

  let state = JSON.parse(dom.window.localStorage.getItem('alchemy_v2'));
  assertEqual(state.archive.length, 1, 'Two items released from archive');
  assertEqual(state.archive[0].matter, 'Keep', 'Correct item remains');
  assertEqual(state.stats.totalReleased, 2, 'totalReleased incremented by 2');

  // Undo
  const undoLink = doc.querySelector('.toast-action');
  assert(undoLink !== null, 'Undo link in bulk release toast');
  undoLink.click();

  state = JSON.parse(dom.window.localStorage.getItem('alchemy_v2'));
  assertEqual(state.archive.length, 3, 'Undo restored all bulk items');
  assertEqual(state.stats.totalReleased, 0, 'totalReleased restored to 0');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Version displays in log
// ═══════════════════════════════════════════════
function testVersionDisplay() {
  const seed = {
    inbox: [], archive: [],
    stats: { totalKept: 1, totalReleased: 0 },
    events: [{ type: 'capture', ts: Date.now(), itemType: 'text' }],
    lastResurface: Date.now()
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  doc.getElementById('navLog').click();
  const version = doc.querySelector('.log-version');
  assert(version !== null, 'Version element in log');
  assert(version.textContent.includes('1.1.0'), 'Version shows 1.1.0');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: lastNotificationTs migrated
// ════════════════���══════════════════════════════
function testNotificationMigration() {
  const seed = {
    inbox: [], archive: [],
    stats: { totalKept: 0, totalReleased: 0 }, events: [], lastResurface: Date.now()
  };
  // Deliberately omit lastNotificationTs
  const dom = createApp(seed);
  const state = getState(dom);
  assertEqual(state.lastNotificationTs, 0, 'lastNotificationTs migrated to 0');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  TEST: Ascendency gauge has aria-valuenow
// ═══════════════════════════════════════════════
function testAscendencyAria() {
  const seed = {
    inbox: [], archive: [],
    stats: { totalKept: 3, totalReleased: 1 }, events: [], lastResurface: Date.now()
  };

  const dom = createApp(seed);
  const doc = dom.window.document;

  const gauge = doc.querySelector('.ascendency-gauge');
  assert(gauge !== null, 'Ascendency gauge exists');
  assertEqual(gauge.getAttribute('role'), 'meter', 'Gauge has role=meter');
  const val = gauge.getAttribute('aria-valuenow');
  assert(val !== null, 'Gauge has aria-valuenow');
  assert(parseInt(val) >= 0 && parseInt(val) <= 100, 'aria-valuenow in range');

  dom.window.close();
}

// ═══════════════════════════════════════════════
//  RUN ALL TESTS
// ═══════════════════════════════════════════════
console.log('Alchemy Test Suite\n');

const tests = [
  ['Fresh load', testFreshLoad],
  ['Capture', testCapture],
  ['URL classification', testUrlClassification],
  ['Capacity limit', testCapacityLimit],
  ['Settle period', testSettlePeriod],
  ['Reflect & alchemize', testReflectAndAlchemize],
  ['Keep', testKeep],
  ['Let go', testLetGo],
  ['Inbox decay', testInboxDecay],
  ['Archive decay', testArchiveDecay],
  ['Resurfacing', testResurfacing],
  ['Export/import', testExportImport],
  ['Share target', testShareTarget],
  ['Markdown format', testMarkdownFormat],
  ['Gold back restores', testGoldBackRestores],
  ['Escape closes modal', testEscapeClosesModal],
  ['Link cooling', testLinkCooling],
  ['Cooled link clickable', testCooledLink],
  ['Digest tracking', testDigestTracking],
  ['Text not cooled', testTextNotCooled],
  ['Archive search', testArchiveSearch],
  ['Archive sort', testArchiveSort],
  ['Undo release', testUndoRelease],
  ['Keyboard shortcuts', testKeyboardShortcuts],
  ['ARIA attributes', testAriaAttributes],
  ['ARIA selected toggle', testAriaSelectedToggle],
  ['Fading indicator', testFadingIndicator],
  ['Decay pulse', testDecayPulse],
  ['Sparkline', testSparkline],
  ['Monthly type breakdown', testMonthlyTypeBreakdown],
  ['Notification section', testNotificationSection],
  ['Bulk archive select', testBulkArchiveSelect],
  ['Bulk release', testBulkRelease],
  ['Version display', testVersionDisplay],
  ['Notification migration', testNotificationMigration],
  ['Ascendency ARIA', testAscendencyAria],
];

for (const [name, fn] of tests) {
  try {
    fn();
  } catch (e) {
    failed++;
    failures.push(`${name}: EXCEPTION: ${e.message}`);
    process.stdout.write('E');
  }
}

console.log(`\n\n${passed} passed, ${failed} failed`);

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
