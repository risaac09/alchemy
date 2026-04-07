import {
  App,
  ItemView,
  Plugin,
  PluginSettingTab,
  Setting,
  TFolder,
  WorkspaceLeaf,
  normalizePath,
} from "obsidian";

// ═══════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════
const VIEW_TYPE = "alchemy";
const VERSION = "1.2.0";

const MAX_CAPACITY = 7;
const DECAY_MS = 72 * 3600000;
const SETTLE_MS = 30000;
const LINK_COOLING_MS = 4 * 3600000;
const ARCHIVE_DECAY_MS = 90 * 86400000;
const RESURFACE_INTERVAL_MS = 3 * 86400000;

const MAP_TYPES = ["observation", "question", "connection", "tension", "practice"] as const;
type MapType = typeof MAP_TYPES[number] | "";

// ═══════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════
interface InboxItem {
  id: string;
  text: string;
  created: number;
  type: "text" | "link";
  resurfaced?: boolean;
  opened?: boolean;
  openedAt?: number;
}

interface GoldItem {
  id: string;
  matter: string;
  reflection: string;
  bodyCheck: string;
  map: MapType;
  created: number;
  transmuted: number;
  archived: number;
  type: "text" | "link";
}

interface ThresholdEntry {
  ts: number;
  text: string;
}

interface FrictionEntry {
  ts: number;
  text: string;
}

interface AlchemyData {
  inbox: InboxItem[];
  archive: GoldItem[];
  stats: { totalKept: number; totalReleased: number };
  events: Array<{ type: string; ts: number; [k: string]: unknown }>;
  lastResurface: number;
  thresholds: ThresholdEntry[];
  frictionLog: FrictionEntry[];
}

interface AlchemySettings {
  goldFolder: string;
  decayHours: number;
  archiveDecayDays: number;
  maxCapacity: number;
}

const DEFAULT_SETTINGS: AlchemySettings = {
  goldFolder: "Alchemy/Gold",
  decayHours: 72,
  archiveDecayDays: 90,
  maxCapacity: 7,
};

const DEFAULT_DATA: AlchemyData = {
  inbox: [],
  archive: [],
  stats: { totalKept: 0, totalReleased: 0 },
  events: [],
  lastResurface: 0,
  thresholds: [],
  frictionLog: [],
};

// ═══════════════════════════════════════════════
//  PLUGIN
// ═══════════════════════════════════════════════
export default class AlchemyPlugin extends Plugin {
  settings: AlchemySettings = DEFAULT_SETTINGS;
  alchemyData: AlchemyData = { ...DEFAULT_DATA, inbox: [], archive: [], events: [], thresholds: [], frictionLog: [] };

  async onload() {
    await this.loadSettings();
    await this.loadAlchemyData();

    this.registerView(VIEW_TYPE, (leaf) => new AlchemyView(leaf, this));

    this.addRibbonIcon("flask-conical", "Alchemy", () => this.activateView());

    this.addCommand({
      id: "open-alchemy",
      name: "Open Alchemy",
      callback: () => this.activateView(),
    });

    // Obsidian URI: obsidian://alchemy?capture=...
    this.registerObsidianProtocolHandler("alchemy", async (params) => {
      await this.activateView();
      if (params.capture) {
        const view = this.getView();
        if (view) view.captureFromUri(params.capture);
      }
    });

    this.addSettingTab(new AlchemySettingTab(this.app, this));
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE);
    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      if (!leaf) leaf = workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf!);
  }

  getView(): AlchemyView | null {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    if (leaves.length > 0) return leaves[0].view as AlchemyView;
    return null;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async loadAlchemyData() {
    const raw = await this.loadData();
    if (raw && raw.inbox !== undefined) {
      this.alchemyData = Object.assign({ ...DEFAULT_DATA }, raw);
      if (!this.alchemyData.thresholds) this.alchemyData.thresholds = [];
      if (!this.alchemyData.frictionLog) this.alchemyData.frictionLog = [];
    }
  }

  async saveAlchemyData() {
    await this.saveData({ ...this.settings, ...this.alchemyData });
  }

  // Write a kept gold item to the vault as a markdown note
  async writeGoldToVault(item: GoldItem): Promise<string | null> {
    try {
      const folder = normalizePath(this.settings.goldFolder);
      const folderExists = this.app.vault.getAbstractFileByPath(folder);
      if (!folderExists) {
        await this.app.vault.createFolder(folder);
      }

      const slug = item.matter
        .slice(0, 40)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const capturedDate = new Date(item.created).toISOString().slice(0, 10);
      const transmutedDate = new Date(item.transmuted).toISOString().slice(0, 10);
      const mapFolder = item.map
        ? normalizePath(`${folder}/${item.map}`)
        : folder;

      if (item.map) {
        const mapFolderExists = this.app.vault.getAbstractFileByPath(mapFolder);
        if (!mapFolderExists) {
          await this.app.vault.createFolder(mapFolder);
        }
      }

      const fileName = normalizePath(`${mapFolder}/${slug}-${item.id}.md`);

      let content = `---\ncaptured: ${capturedDate}\ntransmuted: ${transmutedDate}\nsource: alchemy\n`;
      if (item.map) content += `map: ${item.map}\n`;
      if (item.bodyCheck) content += `body: ${item.bodyCheck}\n`;
      content += `---\n\n> ${item.matter.replace(/\n/g, "\n> ")}\n\n${item.reflection}\n`;

      await this.app.vault.create(fileName, content);
      return fileName;
    } catch (e) {
      console.error("Alchemy: failed to write vault note", e);
      return null;
    }
  }
}

// ═══════════════════════════════════════════════
//  VIEW
// ═══════════════════════════════════════════════
class AlchemyView extends ItemView {
  plugin: AlchemyPlugin;
  private currentView: "inbox" | "reflect" | "gold" | "archive" | "log" = "inbox";
  private currentItemId: string | null = null;
  private currentGold: GoldItem | null = null;
  private pendingMap: MapType = "";
  private tickId: ReturnType<typeof setInterval> | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: AlchemyPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Alchemy"; }
  getIcon() { return "flask-conical"; }

  async onOpen() {
    this.render();
    this.tickId = setInterval(() => this.tick(), 5000);
  }

  async onClose() {
    if (this.tickId) clearInterval(this.tickId);
  }

  captureFromUri(text: string) {
    const data = this.plugin.alchemyData;
    if (data.inbox.length >= this.plugin.settings.maxCapacity) return;
    data.inbox.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text,
      created: Date.now(),
      type: /^https?:\/\//.test(text.trim()) ? "link" : "text",
    });
    this.plugin.saveAlchemyData();
    this.showView("inbox");
    this.render();
  }

  private tick() {
    this.processDecay();
    this.processArchiveDecay();
    this.maybeResurface();
    if (this.currentView === "inbox") this.renderInbox();
  }

  private processDecay() {
    const data = this.plugin.alchemyData;
    const decayMs = this.plugin.settings.decayHours * 3600000;
    const decayed = data.inbox.filter((i) => Date.now() - i.created >= decayMs);
    if (decayed.length > 0) {
      data.inbox = data.inbox.filter((i) => Date.now() - i.created < decayMs);
      data.stats.totalReleased += decayed.length;
      this.plugin.saveAlchemyData();
    }
  }

  private processArchiveDecay() {
    const data = this.plugin.alchemyData;
    const decayMs = this.plugin.settings.archiveDecayDays * 86400000;
    const before = data.archive.length;
    data.archive = data.archive.filter((i) => Date.now() - i.archived < decayMs);
    if (data.archive.length !== before) this.plugin.saveAlchemyData();
  }

  private maybeResurface() {
    const data = this.plugin.alchemyData;
    if (Date.now() - data.lastResurface < RESURFACE_INTERVAL_MS) return;
    if (data.archive.length === 0 || data.inbox.length >= this.plugin.settings.maxCapacity) return;
    const oldest = data.archive[data.archive.length - 1];
    data.inbox.push({
      id: oldest.id + "-r",
      text: oldest.matter,
      created: Date.now(),
      type: oldest.type,
      resurfaced: true,
    });
    data.lastResurface = Date.now();
    this.plugin.saveAlchemyData();
  }

  private showView(name: typeof this.currentView) {
    this.currentView = name;
    this.render();
  }

  // ─── RENDER ───────────────────────────────────
  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("alchemy-plugin");

    this.renderHeader();

    switch (this.currentView) {
      case "inbox":   return this.renderInbox();
      case "reflect": return this.renderReflect();
      case "gold":    return this.renderGold();
      case "archive": return this.renderArchive();
      case "log":     return this.renderLog();
    }
  }

  private renderHeader() {
    const { contentEl } = this;
    const nav = contentEl.createEl("nav", { cls: "alchemy-nav" });

    const views: Array<[typeof this.currentView, string]> = [
      ["inbox", "Inbox"],
      ["archive", "Archive"],
      ["log", "Log"],
    ];

    for (const [view, label] of views) {
      const btn = nav.createEl("button", { text: label, cls: "alchemy-nav-btn" });
      if (this.currentView === view || (this.currentView === "reflect" && view === "inbox") || (this.currentView === "gold" && view === "inbox")) {
        btn.addClass("active");
      }
      btn.addEventListener("click", () => this.showView(view));
    }
  }

  private renderInbox() {
    const { contentEl } = this;
    const data = this.plugin.alchemyData;
    const maxCap = this.plugin.settings.maxCapacity;

    // Clear everything below nav
    const existing = contentEl.querySelector(".alchemy-body");
    if (existing) existing.remove();

    const body = contentEl.createEl("div", { cls: "alchemy-body" });

    // Capacity indicator
    const capBar = body.createEl("div", { cls: "alchemy-cap-bar" });
    capBar.createEl("span", { text: `${data.inbox.length}/${maxCap}`, cls: "alchemy-cap-label" });

    // Capture area
    const captureWrap = body.createEl("div", { cls: "alchemy-capture-wrap" });
    const captureInput = captureWrap.createEl("textarea", {
      cls: "alchemy-capture-input",
      attr: { placeholder: "A thought, a link, a half-formed hunch...", rows: "3" },
    });
    const captureFooter = captureWrap.createEl("div", { cls: "alchemy-capture-footer" });
    if (data.inbox.length >= maxCap) {
      captureInput.disabled = true;
      captureFooter.createEl("span", { text: "The tape is full — release before capturing more", cls: "alchemy-cap-warning" });
    }
    const inhaleBtn = captureFooter.createEl("button", { text: "Inhale", cls: "alchemy-btn-primary" });
    inhaleBtn.addEventListener("click", () => {
      const text = captureInput.value.trim();
      if (!text || data.inbox.length >= maxCap) return;
      data.inbox.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text,
        created: Date.now(),
        type: /^https?:\/\//.test(text) ? "link" : "text",
      });
      this.plugin.saveAlchemyData();
      captureInput.value = "";
      this.renderInbox();
    });

    // Inbox list
    if (data.inbox.length === 0) {
      body.createEl("p", { text: "The void is quiet. Add some base matter.", cls: "alchemy-empty" });
      return;
    }

    const list = body.createEl("div", { cls: "alchemy-inbox-list" });
    for (const item of data.inbox) {
      const settling = Date.now() - item.created < SETTLE_MS;
      const el = list.createEl("div", { cls: "alchemy-inbox-item" });
      el.createEl("div", { text: item.text, cls: "alchemy-item-text" });

      const meta = el.createEl("div", { cls: "alchemy-item-meta" });
      if (settling) {
        const remainSec = Math.ceil((SETTLE_MS - (Date.now() - item.created)) / 1000);
        meta.createEl("span", { text: `settling · ${remainSec}s`, cls: "alchemy-settle-badge" });
      } else {
        const reflectBtn = meta.createEl("button", { text: "Reflect", cls: "alchemy-btn-sm" });
        reflectBtn.addEventListener("click", () => {
          this.currentItemId = item.id;
          this.showView("reflect");
        });
      }
    }
  }

  private renderReflect() {
    const { contentEl } = this;
    const data = this.plugin.alchemyData;
    const item = data.inbox.find((i) => i.id === this.currentItemId);
    if (!item) return this.showView("inbox");

    const existing = contentEl.querySelector(".alchemy-body");
    if (existing) existing.remove();
    const body = contentEl.createEl("div", { cls: "alchemy-body" });

    const backBtn = body.createEl("button", { text: "← Inbox", cls: "alchemy-back-btn" });
    backBtn.addEventListener("click", () => this.showView("inbox"));

    body.createEl("div", { text: item.text, cls: "alchemy-base-matter" });

    const prompts = [
      "What does this stir in you?",
      "Say the quiet part out loud.",
      "Why now? Why not last week?",
      "Where does this land in your body?",
      "Is this signal or noise?",
      "What's underneath this?",
    ];
    body.createEl("p", {
      text: item.resurfaced ? "You kept this once. Is it still worth carrying?" : prompts[Math.floor(Math.random() * prompts.length)],
      cls: "alchemy-reflect-prompt",
    });

    // Somatic pulse
    const bodyCheckWrap = body.createEl("div", { cls: "alchemy-body-check-wrap" });
    bodyCheckWrap.createEl("label", { text: "Somatic pulse", cls: "alchemy-body-check-label", attr: { for: "alchemy-body-check" } });
    const bodyCheckInput = bodyCheckWrap.createEl("input", {
      cls: "alchemy-body-check-input",
      attr: { id: "alchemy-body-check", type: "text", maxlength: "30", placeholder: "one word — what's loudest?", autocomplete: "off" },
    });

    const reflectWrap = body.createEl("div", { cls: "alchemy-reflect-wrap" });
    const reflectInput = reflectWrap.createEl("textarea", {
      cls: "alchemy-reflect-input",
      attr: { placeholder: "What does this actually mean to you?", rows: "5" },
    });

    const alchemizeBtn = body.createEl("button", { text: "Alchemize", cls: "alchemy-btn-primary" });
    alchemizeBtn.disabled = true;
    reflectInput.addEventListener("input", () => {
      alchemizeBtn.disabled = reflectInput.value.trim().length === 0;
    });

    alchemizeBtn.addEventListener("click", () => {
      const reflection = reflectInput.value.trim();
      if (!reflection || !item) return;

      this.currentGold = {
        id: item.id,
        matter: item.text,
        reflection,
        bodyCheck: (bodyCheckInput as HTMLInputElement).value.trim(),
        map: "",
        created: item.created,
        transmuted: Date.now(),
        archived: 0,
        type: item.type,
      };

      data.inbox = data.inbox.filter((i) => i.id !== this.currentItemId);
      this.plugin.saveAlchemyData();
      this.showView("gold");
    });
  }

  private renderGold() {
    const { contentEl } = this;
    if (!this.currentGold) return this.showView("inbox");

    const existing = contentEl.querySelector(".alchemy-body");
    if (existing) existing.remove();
    const body = contentEl.createEl("div", { cls: "alchemy-body" });

    const backBtn = body.createEl("button", { text: "← Inbox (restore)", cls: "alchemy-back-btn" });
    backBtn.addEventListener("click", () => {
      if (this.currentGold) {
        this.plugin.alchemyData.inbox.unshift({
          id: this.currentGold.id,
          text: this.currentGold.matter,
          created: this.currentGold.created,
          type: this.currentGold.type,
        });
        this.plugin.saveAlchemyData();
        this.currentGold = null;
      }
      this.showView("inbox");
    });

    body.createEl("div", { text: "· · · transmutation complete · · ·", cls: "alchemy-gold-divider" });

    const goldBox = body.createEl("div", { cls: "alchemy-gold-box" });
    goldBox.createEl("div", { text: this.currentGold.matter, cls: "alchemy-gold-matter" });
    goldBox.createEl("div", { text: this.currentGold.reflection, cls: "alchemy-gold-reflection" });
    if (this.currentGold.bodyCheck) {
      goldBox.createEl("div", { text: `◦ ${this.currentGold.bodyCheck}`, cls: "alchemy-gold-body-check" });
    }

    // Map picker
    const mapSection = body.createEl("div", { cls: "alchemy-map-picker" });
    mapSection.createEl("div", { text: "Where does this connect?", cls: "alchemy-map-label" });
    const mapBtns = mapSection.createEl("div", { cls: "alchemy-map-options" });

    const noneBtn = mapBtns.createEl("button", { text: "none", cls: "alchemy-map-btn active", attr: { "data-map": "" } });
    noneBtn.addEventListener("click", () => this.selectMap("", mapBtns));

    for (const m of MAP_TYPES) {
      const btn = mapBtns.createEl("button", { text: m, cls: "alchemy-map-btn", attr: { "data-map": m } });
      btn.addEventListener("click", () => this.selectMap(m, mapBtns));
    }

    // Release actions
    const actions = body.createEl("div", { cls: "alchemy-gold-actions" });
    const keepBtn = actions.createEl("button", { text: "Keep — write to vault", cls: "alchemy-btn-primary" });
    const letGoBtn = actions.createEl("button", { text: "Let go — return to void", cls: "alchemy-btn-secondary" });

    keepBtn.addEventListener("click", async () => {
      if (!this.currentGold) return;
      this.currentGold.map = this.pendingMap;
      this.currentGold.archived = Date.now();

      const filePath = await this.plugin.writeGoldToVault(this.currentGold);

      this.plugin.alchemyData.archive.unshift(this.currentGold);
      this.plugin.alchemyData.stats.totalKept++;
      await this.plugin.saveAlchemyData();

      if (filePath) {
        const notice = body.createEl("div", { cls: "alchemy-notice" });
        notice.createEl("span", { text: `Gold written to ${filePath}` });
      }

      this.currentGold = null;
      this.pendingMap = "";
      this.showView("inbox");
    });

    letGoBtn.addEventListener("click", () => {
      this.plugin.alchemyData.stats.totalReleased++;
      this.plugin.saveAlchemyData();
      this.currentGold = null;
      this.pendingMap = "";
      this.showView("inbox");
    });
  }

  private selectMap(map: MapType, container: HTMLElement) {
    this.pendingMap = map;
    container.querySelectorAll(".alchemy-map-btn").forEach((btn) => {
      (btn as HTMLElement).classList.toggle("active", (btn as HTMLElement).dataset.map === map);
    });
    if (this.currentGold) this.currentGold.map = map;
  }

  private renderArchive() {
    const { contentEl } = this;
    const data = this.plugin.alchemyData;

    const existing = contentEl.querySelector(".alchemy-body");
    if (existing) existing.remove();
    const body = contentEl.createEl("div", { cls: "alchemy-body" });

    if (data.archive.length === 0) {
      body.createEl("p", { text: "No gold yet. The furnace awaits.", cls: "alchemy-empty" });
      return;
    }

    // Map filter
    const mapFilter = body.createEl("div", { cls: "alchemy-map-filter" });
    let activeMapFilter: MapType = "";
    const allBtn = mapFilter.createEl("button", { text: "all", cls: "alchemy-map-filter-btn active" });
    allBtn.addEventListener("click", () => { activeMapFilter = ""; refreshList(); setActive(allBtn); });

    for (const m of MAP_TYPES) {
      const btn = mapFilter.createEl("button", { text: m.slice(0, 4), cls: "alchemy-map-filter-btn" });
      btn.addEventListener("click", () => { activeMapFilter = m; refreshList(); setActive(btn); });
    }

    function setActive(el: HTMLElement) {
      mapFilter.querySelectorAll(".alchemy-map-filter-btn").forEach(b => b.removeClass("active"));
      el.addClass("active");
    }

    const listEl = body.createEl("div", { cls: "alchemy-archive-list" });

    const refreshList = () => {
      listEl.empty();
      const filtered = data.archive.filter(i => !activeMapFilter || i.map === activeMapFilter);
      if (filtered.length === 0) {
        listEl.createEl("p", { text: "No gold in this map.", cls: "alchemy-empty" });
        return;
      }
      for (const item of filtered) {
        const el = listEl.createEl("div", { cls: "alchemy-archive-item" });
        if (item.map) el.createEl("span", { text: item.map, cls: "alchemy-item-map-tag" });
        el.createEl("div", { text: item.matter, cls: "alchemy-archive-matter" });
        el.createEl("div", { text: item.reflection, cls: "alchemy-archive-reflection" });
        if (item.bodyCheck) el.createEl("div", { text: `◦ ${item.bodyCheck}`, cls: "alchemy-archive-body-check" });

        const meta = el.createEl("div", { cls: "alchemy-archive-meta" });
        meta.createEl("span", {
          text: new Date(item.transmuted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          cls: "alchemy-archive-date",
        });

        const openBtn = meta.createEl("button", { text: "Open", cls: "alchemy-btn-sm" });
        openBtn.addEventListener("click", async () => {
          const folder = this.plugin.settings.goldFolder;
          const mapFolder = item.map ? `${folder}/${item.map}` : folder;
          const slug = item.matter.slice(0, 40).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          const path = normalizePath(`${mapFolder}/${slug}-${item.id}.md`);
          const file = this.app.vault.getAbstractFileByPath(path);
          if (file) await this.app.workspace.openLinkText(path, "", false);
        });
      }
    };

    refreshList();
  }

  private renderLog() {
    const { contentEl } = this;
    const data = this.plugin.alchemyData;

    const existing = contentEl.querySelector(".alchemy-body");
    if (existing) existing.remove();
    const body = contentEl.createEl("div", { cls: "alchemy-body" });

    const now = Date.now();
    const weekAgo = now - 7 * 86400000;
    const weekEvents = data.events.filter((e) => e.ts >= weekAgo);
    const weekCaptures = weekEvents.filter((e) => e.type === "capture").length;
    const weekKeeps = weekEvents.filter((e) => e.type === "keep").length;
    const weekReleases = weekEvents.filter((e) => e.type === "release").length;

    // Stats
    const statsSection = body.createEl("div", { cls: "alchemy-log-section" });
    statsSection.createEl("div", { text: "This Week", cls: "alchemy-log-title" });
    statsSection.createEl("p", {
      text: `${weekCaptures} inhaled. ${weekKeeps} kept. ${weekReleases} released.`,
      cls: "alchemy-log-prose",
    });
    statsSection.createEl("p", {
      text: `All time: ${data.stats.totalKept} kept, ${data.stats.totalReleased} released.`,
      cls: "alchemy-log-prose",
    });

    // Weekly threshold
    const threshSection = body.createEl("div", { cls: "alchemy-log-section" });
    threshSection.createEl("div", { text: "Weekly Threshold", cls: "alchemy-log-title" });
    threshSection.createEl("p", { text: "What shifted this week?", cls: "alchemy-log-prose" });
    const threshInput = threshSection.createEl("textarea", {
      cls: "alchemy-log-textarea",
      attr: { placeholder: "not what happened — what changed in how you see something", rows: "3" },
    });
    const threshBtn = threshSection.createEl("button", { text: "Record", cls: "alchemy-btn-sm" });
    threshBtn.addEventListener("click", () => {
      const text = threshInput.value.trim();
      if (!text) return;
      data.thresholds.push({ ts: Date.now(), text });
      if (data.thresholds.length > 52) data.thresholds = data.thresholds.slice(-52);
      this.plugin.saveAlchemyData();
      threshInput.value = "";
      this.renderLog();
    });

    const recent = [...data.thresholds].slice(-3).reverse();
    if (recent.length > 0) {
      const entryList = threshSection.createEl("div", { cls: "alchemy-entry-list" });
      for (const t of recent) {
        const entry = entryList.createEl("div", { cls: "alchemy-entry-item" });
        entry.createEl("span", {
          text: new Date(t.ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          cls: "alchemy-entry-date",
        });
        entry.createEl("span", { text: t.text });
      }
    }

    // Friction log
    const frictionSection = body.createEl("div", { cls: "alchemy-log-section" });
    frictionSection.createEl("div", { text: "Friction Log", cls: "alchemy-log-title" });
    frictionSection.createEl("p", { text: "Where were you using this to avoid something?", cls: "alchemy-log-prose" });
    const frictionInput = frictionSection.createEl("input", {
      cls: "alchemy-log-input",
      attr: { type: "text", placeholder: "one line — catch the avoidance" },
    });
    const frictionBtn = frictionSection.createEl("button", { text: "Log it", cls: "alchemy-btn-sm" });

    const submitFriction = () => {
      const text = (frictionInput as HTMLInputElement).value.trim();
      if (!text) return;
      data.frictionLog.push({ ts: Date.now(), text });
      if (data.frictionLog.length > 200) data.frictionLog = data.frictionLog.slice(-200);
      this.plugin.saveAlchemyData();
      (frictionInput as HTMLInputElement).value = "";
      this.renderLog();
    };

    frictionBtn.addEventListener("click", submitFriction);
    frictionInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); submitFriction(); }
    });

    const recentFriction = [...data.frictionLog].slice(-5).reverse();
    if (recentFriction.length > 0) {
      const frictionList = frictionSection.createEl("div", { cls: "alchemy-entry-list" });
      for (const f of recentFriction) {
        const entry = frictionList.createEl("div", { cls: "alchemy-entry-item" });
        entry.createEl("span", {
          text: new Date(f.ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          cls: "alchemy-entry-date",
        });
        entry.createEl("span", { text: f.text });
      }
    }

    body.createEl("div", { text: `v${VERSION}`, cls: "alchemy-version" });
  }
}

// ═══════════════════════════════════════════════
//  SETTINGS TAB
// ═══════════════════════════════════════════════
class AlchemySettingTab extends PluginSettingTab {
  plugin: AlchemyPlugin;

  constructor(app: App, plugin: AlchemyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Alchemy" });

    new Setting(containerEl)
      .setName("Gold folder")
      .setDesc("Where kept items are written as vault notes. Map subfolders are created automatically.")
      .addText((text) =>
        text
          .setPlaceholder("Alchemy/Gold")
          .setValue(this.plugin.settings.goldFolder)
          .onChange(async (value) => {
            this.plugin.settings.goldFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Inbox decay (hours)")
      .setDesc("How long before unattended inbox items dissolve. Default: 72h.")
      .addSlider((slider) =>
        slider
          .setLimits(24, 168, 24)
          .setValue(this.plugin.settings.decayHours)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.decayHours = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Archive decay (days)")
      .setDesc("How long before archived gold composts. Default: 90 days.")
      .addSlider((slider) =>
        slider
          .setLimits(30, 365, 30)
          .setValue(this.plugin.settings.archiveDecayDays)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.archiveDecayDays = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Max inbox capacity")
      .setDesc("Hard limit on inbox items. The finitude is the point. Default: 7.")
      .addSlider((slider) =>
        slider
          .setLimits(3, 12, 1)
          .setValue(this.plugin.settings.maxCapacity)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxCapacity = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Import from PWA")
      .setDesc("Paste exported JSON from the Alchemy PWA to migrate your data.")
      .addTextArea((area) =>
        area
          .setPlaceholder('{"inbox":[],"archive":[],...}')
          .onChange(async (value) => {
            try {
              const parsed = JSON.parse(value);
              if (parsed.archive && Array.isArray(parsed.archive)) {
                this.plugin.alchemyData = Object.assign({ ...DEFAULT_DATA }, parsed);
                await this.plugin.saveAlchemyData();
                containerEl.createEl("p", { text: `Imported ${parsed.archive.length} archive items.`, cls: "alchemy-import-ok" });
              }
            } catch { /* invalid JSON, wait for more input */ }
          })
      );
  }
}
