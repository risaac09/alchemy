const ALCHEMY_URL = 'https://risaac09.github.io/alchemy/';
const MAX_CAPACITY = 7;

let pageTitle = '';
let pageUrl = '';
let selectedText = '';

const titleEl   = document.getElementById('pageTitle');
const urlEl     = document.getElementById('pageUrl');
const selWrap   = document.getElementById('selectionWrap');
const noteWrap  = document.getElementById('noteWrap');
const extraText = document.getElementById('extraText');
const noteText  = document.getElementById('noteText');
const btnInhale = document.getElementById('btnInhale');
const btnOpen   = document.getElementById('btnOpen');
const toast     = document.getElementById('toast');
const fullBadge = document.getElementById('fullBadge');

// --- Helpers ---

function showToast(msg, duration = 2000) {
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), duration);
}

function urlDisplay(url) {
  try {
    const u = new URL(url);
    let d = u.hostname.replace(/^www\./, '');
    if (u.pathname && u.pathname !== '/') {
      const p = u.pathname.replace(/\/$/, '');
      d += p.length > 28 ? p.slice(0, 28) + '…' : p;
    }
    return d;
  } catch(e) { return url; }
}

// --- Read the active tab ---

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (!tab) return;

  pageUrl   = tab.url || '';
  pageTitle = tab.title || pageUrl;

  titleEl.textContent = pageTitle;
  urlEl.textContent   = urlDisplay(pageUrl);

  // Try to grab selected text from the page
  chrome.scripting.executeScript(
    { target: { tabId: tab.id }, func: () => window.getSelection().toString().trim() },
    (results) => {
      if (chrome.runtime.lastError) return; // e.g. chrome:// pages
      selectedText = results?.[0]?.result || '';
      if (selectedText) {
        selWrap.style.display = 'block';
        extraText.value = selectedText;
      } else {
        noteWrap.style.display = 'block';
      }
    }
  );
});

// --- Check if Alchemy PWA tab is already open ---

async function findAlchemyTab() {
  return new Promise(resolve => {
    chrome.tabs.query({}, tabs => {
      const found = tabs.find(t => t.url && t.url.startsWith(ALCHEMY_URL));
      resolve(found || null);
    });
  });
}

// --- Check inbox capacity via the open PWA tab ---

async function getInboxCount(tabId) {
  return new Promise(resolve => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          try {
            const s = JSON.parse(localStorage.getItem('alchemy_v2') || '{}');
            return (s.inbox || []).length;
          } catch(e) { return 0; }
        }
      },
      results => {
        if (chrome.runtime.lastError) { resolve(0); return; }
        resolve(results?.[0]?.result ?? 0);
      }
    );
  });
}

// --- Build the capture string ---

function buildCapture() {
  const parts = [];
  const note = selectedText ? extraText.value.trim() : noteText.value.trim();
  if (note && note !== selectedText) parts.push(note);
  else if (selectedText) parts.push(selectedText);
  parts.push(pageTitle);
  parts.push(pageUrl);
  return parts.filter(Boolean).join('\n\n');
}

// --- Inhale button ---

btnInhale.addEventListener('click', async () => {
  const captureText = buildCapture();
  if (!captureText) return;

  // Check if PWA is already open
  const alchemyTab = await findAlchemyTab();

  if (alchemyTab) {
    // Check capacity
    const count = await getInboxCount(alchemyTab.id);
    if (count >= MAX_CAPACITY) {
      fullBadge.style.display = 'block';
      btnInhale.disabled = true;
      return;
    }

    // Inject the capture directly into the live app's localStorage + trigger render
    chrome.scripting.executeScript({
      target: { tabId: alchemyTab.id },
      func: (text) => {
        try {
          const STORAGE_KEY = 'alchemy_v2';
          const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
          if (!s.inbox) s.inbox = [];
          if (!s.stats) s.stats = { totalKept: 0, totalReleased: 0 };
          if (!s.events) s.events = [];
          if (!s.archive) s.archive = [];

          const isUrl = str => /^https?:\/\//i.test(str.trim());
          const firstLine = text.split('\n')[0];

          s.inbox.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            text,
            created: Date.now(),
            type: isUrl(firstLine) ? 'link' : 'text'
          });

          s.lastActiveDate = Date.now();
          s.events.push({ type: 'capture', ts: Date.now(), itemType: 'extension' });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

          // Trigger the live app to re-render if it's running
          window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
          return 'ok';
        } catch(e) { return 'error: ' + e.message; }
      },
      args: [captureText]
    }, (results) => {
      if (chrome.runtime.lastError || results?.[0]?.result !== 'ok') {
        // Fallback: open with ?capture= param
        chrome.tabs.update(alchemyTab.id, {
          url: ALCHEMY_URL + '?capture=' + encodeURIComponent(captureText),
          active: true
        });
      } else {
        chrome.tabs.update(alchemyTab.id, { active: true });
        showToast('Inhaled ✓');
        setTimeout(() => window.close(), 900);
      }
    });
  } else {
    // Open Alchemy with ?capture= param
    chrome.tabs.create({
      url: ALCHEMY_URL + '?capture=' + encodeURIComponent(captureText),
      active: true
    });
    window.close();
  }
});

// --- Open app button ---

btnOpen.addEventListener('click', async () => {
  const alchemyTab = await findAlchemyTab();
  if (alchemyTab) {
    chrome.tabs.update(alchemyTab.id, { active: true });
  } else {
    chrome.tabs.create({ url: ALCHEMY_URL, active: true });
  }
  window.close();
});

// --- Keyboard: Enter to inhale ---

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') btnInhale.click();
});
