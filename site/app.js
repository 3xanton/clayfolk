// Clayfolk landing page. Static, no dependencies. All avatar content is read from avatars.json:
// nothing here assumes how many avatars exist (see the "Pack size is data, not layout" spec).

const CONFIG = {
  heroId: "015",                       // Sweatband. Falls back to the first avatar if missing.
  words: ["UI", "project", "app", "agent", "site", "deck", "dashboard", "prototype"],
  wordHold: 2400, wordRoll: 420,
  siteUrl: "https://clayfolk.dev",
  // TODO(owner): paste the email tool's form endpoint (double opt-in on). Empty = form shows a "not connected" note.
  waitlistEndpoint: "",
  // Example mock-ups pick avatars by id, with a data-driven fallback if an id is missing from the pack.
  examples: {
    chat: ["002", "009", "006"], dms: ["006", "023"],
    call: ["004", "010", "015", "022", "024", "029"], speaking: 1,
    team: [["001", "Founder", "Active"], ["002", "Designer", "Active"], ["012", "Engineer", "Away"], ["022", "Operations", "Active"]],
    picker: ["004", "009", "013", "016", "010", "019", "021", "023"], picked: 5,
    zip: ["021", "001", "009"], pro: ["023", "024", "025"],
  },
};

const MOOD_COLORS = ["#F2C94C", "#8FD6B4", "#F29E7C", "#8CB8F2", "#C9A6F2", "#F2A0C0", "#9BE0E0", "#F2D58C", "#B5E08C", "#F2B37C", "#A6B8F2", "#E0A0E0", "#C8E0A0", "#F2C0A0"];
const KNOWN_MOODS = { happy: 0, calm: 1 };
const AGE_ORDER = ["child", "young", "adult", "senior"];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const mod = (a, n) => ((a % n) + n) % n;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const mobileMQ = matchMedia("(max-width: 767px)");
const live = $("#live");

let data, meta, avatars = [], byId = new Map(), features = { mp4: false };
// per-avatar video: when features.mp4Ids is present only those ids have a clip (the set is rolled out gradually)
// MP4 rule: play once, hold the last frame for 400 ms, then restart
const LOOP_PAUSE = 400;
function loopWithPause(v) {
  v.loop = false; let t;
  v.addEventListener("ended", () => { clearTimeout(t); t = setTimeout(() => { v.currentTime = 0; v.play().catch(() => {}); }, LOOP_PAUSE); });
  v.addEventListener("emptied", () => clearTimeout(t));
  v.addEventListener("pause", () => { if (!v.ended) clearTimeout(t); });
}
const hasMp4 = (id) => features.mp4 && (!features.mp4Ids || features.mp4Ids.includes(id));
const state = { matches: null, sel: { mood: new Set(), role: new Set(), age: new Set() } };

async function boot() {
  const [d, f] = await Promise.all([
    fetch("avatars.json").then((r) => r.json()),
    fetch("assets/features.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
  ]);
  data = d; meta = d.meta; avatars = d.avatars; features = { mp4: false, ...f };
  avatars.forEach((a) => byId.set(a.id, a));
  const cutout = (id) => `assets/cutout/${id}.webp`;
  Object.assign(U, {
    cutout, tile: (id) => `assets/webp/${id}.webp`, png: (id) => `assets/png/${id}.png`,
    mp4: (id) => `assets/mp4/${id}.mp4`, // the site serves its own copies (build-site copies assets/mp4)
  });
  setupLinks();
  buildHeroMobile();
  buildMarquee();
  buildFilter();
  buildExamples();
  buildUse();
  buildDownload();
  setupCanvases();
  setupWords();
  setupDetail();
  setupChrome();
  setupProShader();
  route();
}
const U = {};
const moodColor = (m) => {
  if (m in KNOWN_MOODS) return MOOD_COLORS[KNOWN_MOODS[m]];
  let h = 0; for (const c of m) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return MOOD_COLORS[2 + (h % (MOOD_COLORS.length - 2))];
};
const pick = (id, k = 0) => byId.get(id) || avatars[mod(k * 3, avatars.length)];
const hero = () => byId.get(CONFIG.heroId) || avatars[0];
const label = (a) => `${a.name}: ${a.alt}`;

/* ---------- scroll lock ---------- */
let locks = 0;
const lock = () => { locks++; document.body.classList.add("lock"); };
const unlock = () => { locks = Math.max(0, locks - 1); if (!locks) document.body.classList.remove("lock"); };

/* ---------- copy ---------- */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const t = document.createElement("textarea"); t.value = text; t.style.cssText = "position:fixed;opacity:0";
    document.body.append(t); t.select(); let ok = false; try { ok = document.execCommand("copy"); } catch {} t.remove(); return ok;
  }
}
const CHECK = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5l3 3 6-6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-copy-text],[data-copy-target]");
  if (!b) return;
  const text = b.dataset.copyText ?? $("#" + b.dataset.copyTarget).textContent;
  if (!(await copyText(text))) return;
  const orig = b.dataset.label || b.textContent;
  clearTimeout(b._t); b.classList.add("is-copied"); b.innerHTML = CHECK + "<span>Copied</span>";
  live.textContent = "Copied to clipboard";
  b._t = setTimeout(() => { b.classList.remove("is-copied"); b.textContent = orig; live.textContent = ""; }, 2000);
});

/* ---------- headline word cycle ---------- */
function setupWords() {
  const slot = $("#slot"), A = $("#wordA"), B = $("#wordB"), h = $("#headline");
  const words = CONFIG.words;
  const widthOf = (txt) => { B.textContent = txt; slot.classList.add("measure"); const w = B.offsetWidth; slot.classList.remove("measure"); return w; };
  const fit = () => { slot.style.transition = "none"; slot.style.width = widthOf(A.textContent) + "px"; B.textContent = ""; void slot.offsetWidth; slot.style.transition = ""; };
  fit();
  document.fonts?.ready.then(fit);
  if (reduceMotion.matches || words.length < 2) return;
  let i = 0, hovering = false, timer;
  const hidden = () => document.hidden;
  const step = () => {
    if (hovering || hidden() || (!mobileMQ.matches && desk?.introDone)) { timer = setTimeout(step, 300); return; }
    i = (i + 1) % words.length;
    const next = words[i];
    B.textContent = next; slot.style.width = widthOf(next) + "px";
    slot.classList.add("rolling");
    setTimeout(() => {
      slot.classList.add("measure"); A.textContent = next; slot.classList.remove("rolling"); B.textContent = ""; void slot.offsetWidth; slot.classList.remove("measure");
    }, CONFIG.wordRoll + 20);
    timer = setTimeout(step, CONFIG.wordHold + CONFIG.wordRoll);
  };
  h.addEventListener("pointerenter", () => (hovering = true));
  h.addEventListener("pointerleave", () => (hovering = false));
  h.addEventListener("pointerdown", () => (hovering = true));
  addEventListener("pointerup", () => { if (!h.matches(":hover")) hovering = false; });
  // starts once the hero avatar has loaded (or after a short fallback)
  const start = () => { clearTimeout(timer); timer = setTimeout(step, CONFIG.wordHold); };
  const hi = new Image(); hi.onload = hi.onerror = start; hi.src = U.cutout(hero().id); setTimeout(() => { if (!timer) start(); }, 2500);
}

/* ---------- endless canvas ---------- */
class Canvas {
  constructor({ stage, layer, links, hero: withHero, fixedScale, touch }) {
    Object.assign(this, { stage, layer, links, withHero, fixedScale, touch });
    this.ox = 0; this.oy = 0; this.pool = new Map(); this.raf = 0; this.anim = null; this.dragging = false; this.ready = false;
    this.bind();
  }
  get N() { return avatars.length; }
  measure() {
    const w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h) return false;
    const S = this.fixedScale || Math.min(1, Math.max(0.72, h / 900));
    const rescale = S !== this.S;
    const prevW = this.vw, prevH = this.vh;
    this.vw = w; this.vh = h; this.S = S;
    this.T = 180 * S; this.PX = 260 * S; this.PY = 196 * S; this.X0 = [230 * S, 110 * S]; this.Y0 = 164 * S;
    this.H = 400 * S;
    const hi = Math.max(0, avatars.indexOf(hero()));
    this.base = hi - 8; // hero cell = (col 2, row 1): 6 per row, so idx = base + row*6 + col
    if (!this.ready || rescale) { this.recenter(); this.clear(); this.ready = true; }
    else { this.ox += (w - prevW) / 2; this.oy += (h - prevH) / 2; }
    this.sync(); this.apply(); this.resnap();
    return true;
  }
  recenter() { this.ox = this.vw / 2 - 720 * this.S; this.oy = this.vh / 2 - 436 * this.S; }
  clear() { this.pool.forEach((t) => t.remove()); this.pool.clear(); this.layer.innerHTML = ""; this.glow = null; }
  xOf(col, row) { return col * this.PX + this.X0[mod(row, 2)]; }
  yOf(row) { return this.Y0 + row * this.PY; }
  idx(col, row) { return mod(this.base + row * 6 + col, this.N); }
  isHeroCell(col, row) { return this.withHero && col === 2 && row === 1; }
  cellRect(col, row) {
    const x = this.xOf(col, row), y = this.yOf(row);
    return { x, y, s: this.T, cx: x + this.T / 2, cy: y + this.T / 2 };
  }
  sync() {
    const m = this.T, x0 = -this.ox - m, x1 = -this.ox + this.vw + m, y0 = -this.oy - m, y1 = -this.oy + this.vh + m;
    const r0 = Math.floor((y0 - this.Y0) / this.PY), r1 = Math.ceil((y1 - this.Y0) / this.PY);
    const seen = new Set();
    for (let row = r0; row <= r1; row++) {
      const c0 = Math.floor((x0 - this.X0[mod(row, 2)]) / this.PX), c1 = Math.ceil((x1 - this.X0[mod(row, 2)]) / this.PX);
      for (let col = c0; col <= c1; col++) {
        const key = col + "," + row; seen.add(key);
        if (!this.pool.has(key)) this.make(col, row, key);
      }
    }
    for (const [k, el] of this.pool) if (!seen.has(k)) { el.remove(); this.pool.delete(k); }
    this.syncKey = Math.round(this.ox / (this.T * 0.5)) + "," + Math.round(this.oy / (this.T * 0.5));
  }
  make(col, row, key) {
    const a = avatars[this.idx(col, row)], r = this.cellRect(col, row), isHero = this.isHeroCell(col, row);
    const el = document.createElement("div");
    el.className = "tile" + (isHero ? " hero" : "") + (state.matches && !state.matches.has(a.id) ? " dim" : "");
    el.dataset.id = a.id; el.dataset.key = key;
    el.style.cssText = `--t:${r.s}px;transform:translate3d(${r.x}px,${r.y}px,0)`;
    el.innerHTML = `<div class="face"><img class="cut" src="${U.cutout(a.id)}" alt="" width="512" height="512" draggable="false" decoding="async"${isHero ? ' fetchpriority="high"' : ""}><img class="card" ${isHero ? `src="${U.tile(a.id)}"` : `data-src="${U.tile(a.id)}"`} alt="" draggable="false"></div><span class="tag">${esc(a.name)} <small>${a.id} · ${esc(a.mood)}</small></span>${isHero ? `<span class="intro-tag">${esc(a.name)} <small>${a.id} · ${esc(a.mood)}</small></span>` : ""}${isHero ? '<div class="drag-hint"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M9 2v14M2 9h14M9 2L6.5 4.5M9 2l2.5 2.5M9 16l-2.5-2.5M9 16l2.5-2.5M2 9l2.5-2.5M2 9l2.5 2.5M16 9l-2.5-2.5M16 9l-2.5 2.5" fill="none" stroke="#B4A793" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Drag to explore</div>' : ""}`;
    if (isHero && !this.glow) {
      const g = document.createElement("div"); g.className = "hero-glow";
      g.style.cssText = `width:${720 * this.S}px;height:${720 * this.S}px;left:${r.cx - 360 * this.S}px;top:${r.cy - 256 * this.S}px`;
      this.layer.prepend(g); this.glow = g; el._glow = g;
    }
    if (this.focusShow && key === this.focusKey) el.classList.add("is-focus");
    this.layer.append(el); this.pool.set(key, el);
  }
  apply() { const t = `translate3d(${this.ox}px,${this.oy}px,0)`; this.layer.style.transform = t; if (this.links) this.links.style.transform = t; }
  moveBy(dx, dy) {
    this.ox += dx; this.oy += dy; this.apply();
    const k = Math.round(this.ox / (this.T * 0.5)) + "," + Math.round(this.oy / (this.T * 0.5));
    if (k !== this.syncKey) this.sync();
  }
  stopAnim() { if (this.anim) { cancelAnimationFrame(this.anim.raf); this.anim = null; } }
  glide(tx, ty, ms = 520) {
    this.stopAnim();
    if (reduceMotion.matches) { this.moveBy(tx - this.ox, ty - this.oy); this.resnap(); return; }
    const sx = this.ox, sy = this.oy, t0 = performance.now();
    const a = { raf: 0 }; this.anim = a;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 4);
      this.moveBy(sx + (tx - sx) * e - this.ox, sy + (ty - sy) * e - this.oy);
      if (p < 1) a.raf = requestAnimationFrame(tick); else { this.anim = null; this.resnap(); }
    };
    a.raf = requestAnimationFrame(tick);
  }
  centerOn(cx, cy, ms) { this.glide(this.vw / 2 - cx, this.vh / 2 - cy, ms); }
  // Nearest rendered position of avatar index i to the view centre (world coords).
  nearest(i, fromX, fromY) {
    const N = this.N, R = Math.min(Math.ceil(N / 6) + 2, 40);
    const rc = Math.round((fromY - this.Y0 - this.T / 2) / this.PY);
    let best = null;
    for (let row = rc - R; row <= rc + R; row++) {
      const c0 = mod(i - this.base - 6 * row, N);
      const approx = Math.round((fromX - this.T / 2 - this.X0[mod(row, 2)]) / this.PX);
      const col = c0 + N * Math.round((approx - c0) / N);
      const r = this.cellRect(col, row), d = (r.cx - fromX) ** 2 + (r.cy - fromY) ** 2;
      if (!best || d < best.d) best = { col, row, ...r, d };
    }
    return best;
  }
  viewCenter() { return [this.vw / 2 - this.ox, this.vh / 2 - this.oy]; }
  // Re-place the keyboard links on the instance nearest the view centre (not while one has focus).
  resnap() {
    if (!this.links || !this.vw) return;
    if (this.links.contains(document.activeElement)) return;
    const [cx, cy] = this.viewCenter();
    avatars.forEach((a, i) => {
      const r = this.nearest(i, cx, cy), li = this.links.children[i]; if (!li) return;
      const el = li.firstElementChild;
      li.style.transform = `translate3d(${r.x}px,${r.y}px,0)`; el.style.width = el.style.height = r.s + "px";
      el.dataset.key = r.col + "," + r.row;
    });
  }
  applyFilter() {
    if (state.matches) this.leaveIntro();
    this.pool.forEach((el) => el.classList.toggle("dim", !!state.matches && !state.matches.has(el.dataset.id)));
    if (!state.matches || !state.matches.size || !this.vw) return;
    const [cx, cy] = this.viewCenter(); let best = null;
    avatars.forEach((a, i) => { if (!state.matches.has(a.id)) return; const r = this.nearest(i, cx, cy); if (!best || r.d < best.d) best = r; });
    if (best) this.centerOn(best.cx, best.cy, 600);
  }
  setHover(el, on) {
    el.classList.toggle("is-hover", on);
    if (!on) { const v = $(".vid", el); if (v) { v.pause(); v.classList.remove("on"); } return; }
    const card = $(".card", el); if (card && card.dataset.src) { card.src = card.dataset.src; delete card.dataset.src; }
    if (hasMp4(el.dataset.id) && !reduceMotion.matches && !this.touch) {
      let v = $(".vid", el);
      if (!v) {
        v = document.createElement("video"); v.className = "vid"; v.muted = true; loopWithPause(v); v.playsInline = true; v.preload = "none";
        v.addEventListener("error", () => { v.remove(); el.classList.remove("has-video"); }, { once: true });
        v.addEventListener("playing", () => v.classList.add("on"));
        v.src = U.mp4(el.dataset.id); card.after(v); el.classList.add("has-video");
      }
      v.play().catch(() => {});
    }
  }
  bind() {
    const s = this.stage;
    let id = null, sx, sy, lx, ly, down = null, samples = [];
    s.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      this.stopAnim(); cancelAnimationFrame(this.inertia); id = e.pointerId; sx = lx = e.clientX; sy = ly = e.clientY; samples = [[performance.now(), e.clientX, e.clientY]];
      down = e.target.closest(".tile"); this.moved = false;
    });
    s.addEventListener("pointermove", (e) => {
      if (id !== e.pointerId) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      if (!this.moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 5) {
        this.moved = true; this.dragging = true; s.classList.add("is-drag"); try { s.setPointerCapture(id); } catch {}
        this.hideHint(); $$(".is-hover", this.layer).forEach((t) => this.setHover(t, false));
      }
      if (!this.moved) return;
      lx = e.clientX; ly = e.clientY; this.moveBy(dx, dy);
      samples.push([performance.now(), lx, ly]); if (samples.length > 6) samples.shift();
    });
    const end = (e, cancel) => {
      if (id !== e.pointerId) return; id = null; s.classList.remove("is-drag"); this.dragging = false;
      if (!this.moved) { if (!cancel && down && this.onOpen) { this.leaveIntro(); this.onOpen(down.dataset.id, down); } return; }
      const a = samples[0], b = samples[samples.length - 1]; const dt = b ? b[0] - a[0] : 0;
      if (!reduceMotion.matches && dt > 0 && dt < 120) this.fling((b[1] - a[1]) / dt, (b[2] - a[2]) / dt); else this.resnap();
    };
    s.addEventListener("pointerup", (e) => end(e, false));
    s.addEventListener("pointercancel", (e) => end(e, true));
    s.addEventListener("lostpointercapture", () => { this.dragging = false; });
    // hover (mouse only)
    if (!this.touch) {
      s.addEventListener("pointerover", (e) => { if (e.pointerType !== "mouse" || this.dragging) return; const t = e.target.closest(".tile"); if (t) this.setHover(t, true); });
      s.addEventListener("pointerout", (e) => { const t = e.target.closest(".tile"); if (t && !t.contains(e.relatedTarget)) this.setHover(t, false); });
    }
    // horizontal wheel pans, vertical wheel always scrolls the page
    s.addEventListener("wheel", (e) => {
      if (this.touch || Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2) return;
      e.preventDefault(); this.stopAnim(); this.hideHint(); this.moveBy(-e.deltaX, 0); clearTimeout(this._wt); this._wt = setTimeout(() => this.resnap(), 160);
    }, { passive: false });
    s.addEventListener("keydown", (e) => {
      const k = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
      if (k && !e.altKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault(); const step = e.shiftKey ? 360 : 140; this.hideHint();
        this.glide(this.ox + k[0] * step * this.S, this.oy + k[1] * step * this.S, 240);
      } else if (e.key === "Home") { e.preventDefault(); const h = this.nearest(avatars.indexOf(hero()), ...this.viewCenter()); this.centerOn(h.cx, h.cy, 600); }
      else if (e.key === "Escape" && document.activeElement !== document.body) document.activeElement.blur();
    });
    // keyboard links
    if (this.links) {
      this.links.addEventListener("focusin", (e) => {
        const a = e.target.closest("a"); if (!a) return; this.hideHint();
        this.focusKey = a.dataset.key; this.paintFocus(a.matches(":focus-visible"));
        const li = a.parentElement, i = [...this.links.children].indexOf(li), r = this.nearest(i, ...this.viewCenter());
        const sx2 = r.cx + this.ox, sy2 = r.cy + this.oy, mx = 140 * this.S, myT = 130 * this.S, myB = 170 * this.S;
        if (sx2 < mx || sx2 > this.vw - mx || sy2 < myT || sy2 > this.vh - myB) this.centerOn(r.cx, r.cy, 480);
      });
      this.links.addEventListener("focusout", () => { this.focusShow = false; $$(".is-focus", this.layer).forEach((t) => t.classList.remove("is-focus")); });
    }
  }
  paintFocus(show) {
    this.focusShow = show;
    $$(".is-focus", this.layer).forEach((t) => t.classList.remove("is-focus"));
    if (!show) return;
    const t = this.pool.get(this.focusKey); if (t) { t.classList.add("is-focus"); const c = $(".card", t); if (c?.dataset.src) { c.src = c.dataset.src; delete c.dataset.src; } }
  }
  fling(vx, vy) {
    let last = performance.now(); vx *= 1000; vy *= 1000; // px/s
    const tick = (now) => {
      const dt = Math.min(48, now - last) / 1000; last = now;
      const f = Math.pow(0.0009, dt); vx *= f; vy *= f;
      this.moveBy(vx * dt, vy * dt);
      if (Math.hypot(vx, vy) > 30) this.inertia = requestAnimationFrame(tick); else this.resnap();
    };
    this.inertia = requestAnimationFrame(tick);
  }
  // First interaction (drag, click, wheel, keys, tile focus, filter) leaves the hero state; CSS animates the change.
  hideHint() { this.leaveIntro(); }
  leaveIntro() { if (!this.withHero || this.introDone) return; this.introDone = true; this.stage.closest(".library")?.classList.remove("is-intro"); }
}

let desk, mob;
function setupCanvases() {
  const links = $("#canvasLinks");
  desk = new Canvas({ stage: $("#stage"), layer: $("#layer"), links, hero: true });
  desk.onOpen = (id, el) => openFromCanvas(id, el);
  mob = new Canvas({ stage: $("#stageM"), layer: $("#layerM"), links: null, hero: false, fixedScale: 120 / 180, touch: true });
  mob.onOpen = (id) => openFromCanvas(id);
  const init = () => { if (!mobileMQ.matches) desk.measure(); };
  init();
  addEventListener("resize", () => { if (!mobileMQ.matches) desk.measure(); if (!$("#explore").hidden) mob.measure(); });
  mobileMQ.addEventListener("change", () => { init(); if (!mobileMQ.matches) { closeExplore(); closeMenu(); } });
  document.fonts?.ready.then(() => { if (!mobileMQ.matches) desk.measure(); });
}
function setupLinks() {
  $("#layer").setAttribute("aria-hidden", "true");
  $("#canvasLinks").innerHTML = avatars.map((a) => `<li><a href="#/${a.id}" aria-label="${esc(label(a))}" data-id="${a.id}"></a></li>`).join("");
  $("#canvasLinks").addEventListener("click", (e) => { const a = e.target.closest("a"); if (!a) return; e.preventDefault(); openFromCanvas(a.dataset.id, a); });
}

/* ---------- mobile first screen ---------- */
function buildHeroMobile() {
  const h = hero();
  const img = $("#mHeroImg"); img.src = U.cutout(h.id); img.alt = h.alt;
  $("#mHero").setAttribute("aria-label", `${h.name}: open details`);
  $("#mHeroChip").innerHTML = `${esc(h.name)} <small>${h.id} · ${esc(h.mood)}</small>`;
  $("#mHero").addEventListener("click", () => openFromCanvas(h.id, $("#mHero")));
}

/* ---------- detail ---------- */
let detailOpener = null, detailId = null;
function openFromCanvas(id, from) { detailOpener = from || document.activeElement; history.pushState({ d: 1 }, "", "#/" + id); route(); }
function route() {
  const m = location.hash.match(/^#\/([\w-]+)$/), a = m && byId.get(m[1]);
  if (a) { desk?.leaveIntro(); showDetail(a); } else hideDetail();
}
addEventListener("hashchange", route);
addEventListener("popstate", route);

function highlight(code) {
  const kw = (t) => esc(t).replace(/\b(import|from|const|export|return)\b/g, '<span class="k">$1</span>');
  return code.split("\n").map((l) => { const m = /(^|\s)\/\//.exec(l), c = m ? m.index + m[1].length : -1; return c < 0 ? kw(l) : kw(l.slice(0, c)) + `<span class="cm">${esc(l.slice(c))}</span>`; }).join("\n");
}
function showDetail(a) {
  const d = $("#detail"); if (closing) { closing = false; d.getAnimations({ subtree: true }).forEach((x) => x.cancel()); d.hidden = true; }
  const first = d.hidden; detailId = a.id;
  const img = $("#dImg");
  img.src = U.tile(a.id); img.alt = a.alt;
  $("#dId").textContent = a.id; $("#dName").textContent = a.name; $("#dAlt").textContent = a.alt; $("#dTags").textContent = (a.tags || []).join(" · ");
  $("#dChips").innerHTML = [`<span class="dchip mood" style="--chip:${moodColor(a.mood)}">${esc(a.mood)}</span>`, `<span class="dchip">${esc(a.role)}</span>`, `<span class="dchip">${esc(a.age)}</span>`, `<span class="dchip">${esc(a.presentation)}</span>`].join("");
  const slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const png = $("#dPng"), webp = $("#dWebp"), mp4 = $("#dMp4");
  png.href = U.png(a.id); png.download = `clayfolk-${a.id}-${slug}.png`;
  webp.href = U.tile(a.id); webp.download = `clayfolk-${a.id}-${slug}.webp`;
  if (hasMp4(a.id)) { mp4.href = U.mp4(a.id); mp4.removeAttribute("aria-disabled"); mp4.title = ""; mp4.removeAttribute("tabindex"); }
  else { mp4.removeAttribute("href"); mp4.setAttribute("aria-disabled", "true"); mp4.title = "MP4 is not published yet"; mp4.tabIndex = -1; }
  $("#dSnippet").innerHTML = `<span class="k">imageUrl</span>("${a.id}")`;
  $("#dSnippet").parentElement.querySelector(".copy").dataset.copyText = `imageUrl("${a.id}")`;
  $("#dSnippet").parentElement.querySelector(".copy").removeAttribute("data-copy-target");
  $(".d-art").classList.remove("is-still"); const v = $("#dVideo"); if (!v.dataset.paused) { v.dataset.paused = "1"; loopWithPause(v); } v.hidden = true; v.removeAttribute("src");
  if (hasMp4(a.id) && !reduceMotion.matches) {
    v.src = U.mp4(a.id); v.onerror = () => { v.hidden = true; }; v.onplaying = () => { v.hidden = false; }; v.play().catch(() => {});
  }
  document.title = `${a.name} · Clayfolk`;
  stopDetailAnims(); setGlow(a.id); if (pendingDir && !reduceMotion.matches) [$(".d-art"), ...detailParts()].forEach((el) => (el.style.opacity = "0"));
  { const i = avatars.indexOf(a); preload(avatars[mod(i + 1, avatars.length)].id); preload(avatars[mod(i - 1, avatars.length)].id); }
  { const dir = pendingDir; pendingDir = 0; playIn(); void dir; }
  if (first) { d.hidden = false; lock(); $("#dName").tabIndex = -1; (mobileMQ.matches ? $("#dName") : $("#dBack")).focus({ preventScroll: true }); d.scrollTop = 0; }
}
// hovering the art fades the clip out to the still; leaving fades it back and resumes
{
  const art = $(".d-art"), vid = $("#dVideo"); let t;
  const still = (on) => {
    clearTimeout(t); art.classList.toggle("is-still", on);
    if (on) t = setTimeout(() => vid.pause(), 400);
    else if (!vid.hidden) { if (vid.ended) vid.currentTime = 0; vid.play().catch(() => {}); }
  };
  art.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") still(true); });
  art.addEventListener("pointerleave", () => still(false));
}
function hideDetail() {
  const d = $("#detail"); if (d.hidden || closing) return;
  unlock(); $("#dVideo").pause(); document.title = "Clayfolk: clay faces for your next UI";
  const back = detailOpener; detailOpener = null;
  if (back && document.contains(back)) back.focus({ preventScroll: true });
  if (reduceMotion.matches) { d.hidden = true; return; }
  // Soft exit: the face eases back (zoom out + fade) while the overlay dissolves into the library behind it.
  closing = true;
  const ease = "cubic-bezier(.4,0,.2,1)", mobile = mobileMQ.matches;
  const fin = () => { if (!closing) return; closing = false; d.getAnimations({ subtree: true }).forEach((a) => a.cancel()); d.hidden = true; };
  $(".d-art").animate([{ transform: "none", opacity: 1 }, { transform: "scale(.9)", opacity: 0 }], { duration: 300, easing: ease, fill: "forwards" });
  detailParts().forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: ease, fill: "forwards" }));
  (mobile ? $(".detail-body") : d).animate(mobile ? [{ transform: "none" }, { transform: "translateY(40px)" }] : [{ opacity: 1 }, { opacity: 0 }], { duration: 360, easing: ease, fill: "forwards" }).finished.then(fin).catch(fin);
  if (mobile) d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, easing: ease, fill: "forwards" });
  setTimeout(fin, 600);
}
let closing = false;
function closeDetail() { if (closing) return; if (history.state?.d) history.back(); else { history.replaceState(null, "", location.pathname + location.search); route(); } }
// Detail motion: the current face zooms out and fades, a short pause, then the next face zooms in with a
// subtle spring. Text fades out with it and staggers back in; a glow behind takes the avatar's colour.
function playOut() {
  detailParts().forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: "ease-in", fill: "forwards" }));
  return $(".d-art").animate([{ transform: "none", opacity: 1 }, { transform: "scale(.8)", opacity: 0 }], { duration: 300, easing: "cubic-bezier(.5,0,.9,.5)", fill: "forwards" }).finished.catch(() => {});
}
function playIn() {
  const art = $(".d-art"); [art, ...detailParts()].forEach((el) => (el.style.opacity = ""));
  if (reduceMotion.matches) return;
  art.animate([{ transform: "scale(.8)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 650, easing: "cubic-bezier(.34,1.3,.64,1)", fill: "backwards" });
  detailParts().forEach((el, i) => el.animate([{ transform: "translateY(10px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 520, delay: 180 + i * 45, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }));
}
let pendingDir = 0, stepTok = 0, queuedId = null;
const detailParts = () => ["dChips", "dId", "dName", "dAlt", "dTags"].map((i) => $("#" + i)).concat($(".d-actions"), $(".snippet"));
const stopDetailAnims = () => [$(".d-art"), $("#dImg"), $("#dImgOld"), ...detailParts()].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
function setGlow(id) {
  const img = new Image(); img.onload = () => {
    try {
      const c = document.createElement("canvas"); c.width = c.height = 8; const x = c.getContext("2d");
      x.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, 8, 8);
      const [r, g, b] = x.getImageData(1, 1, 1, 1).data;
      if (detailId !== id) return;
      glowFlip = !glowFlip; const on = $(glowFlip ? "#glowA" : "#glowB"), off = $(glowFlip ? "#glowB" : "#glowA");
      on.style.setProperty("--g", `rgb(${r} ${g} ${b})`); on.classList.add("on"); off.classList.remove("on");
    } catch {}
  }; img.src = U.tile(id);
}
let glowFlip = false;
// decode the next face before swapping, so the spring-in never waits on the network or a decode
const preloaded = new Map();
function preload(id) {
  if (!preloaded.has(id)) { const i = new Image(); i.src = U.tile(id); preloaded.set(id, i.decode ? i.decode().catch(() => {}) : Promise.resolve()); }
  return preloaded.get(id);
}
async function stepDetail(dir) {
  if (closing) return;
  const cur = queuedId ?? detailId, i = avatars.findIndex((a) => a.id === cur), n = avatars[mod(i + dir, avatars.length)], tok = ++stepTok;
  queuedId = n.id;
  if (!reduceMotion.matches) { stopDetailAnims(); await Promise.all([playOut(), preload(n.id)]); await new Promise((r) => setTimeout(r, 110)); } else await preload(n.id);
  if (tok !== stepTok) return;
  queuedId = null; pendingDir = dir;
  history.replaceState({ d: history.state?.d }, "", "#/" + n.id); route();
}
function setupDetail() {
  $("#dClose").addEventListener("click", closeDetail);
  $("#dBack").addEventListener("click", closeDetail);
  $("#dPrev").addEventListener("click", () => stepDetail(-1));
  $("#dNext").addEventListener("click", () => stepDetail(1));
  $("#dLink").addEventListener("click", async (e) => {
    const b = e.currentTarget; if (await copyText(location.href)) { live.textContent = "Link copied"; b.classList.add("is-copied"); setTimeout(() => { b.classList.remove("is-copied"); live.textContent = ""; }, 1500); }
  });
  $("#detail").addEventListener("click", (e) => { if (mobileMQ.matches && e.target === $("#detail")) closeDetail(); });
  $("#detail").addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") stepDetail(-1); else if (e.key === "ArrowRight") stepDetail(1);
    else if (e.key === "Tab") { // focus trap
      const f = $$("button,a[href],[tabindex]:not([tabindex='-1'])", $("#detail")).filter((x) => x.offsetParent !== null && x.getAttribute("aria-disabled") !== "true");
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === $("#dName"))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // swipe the mobile sheet down to close
  const body = $(".detail-body"); let sy = null, dy = 0;
  body.addEventListener("pointerdown", (e) => { if (mobileMQ.matches && body.scrollTop <= 0) { sy = e.clientY; dy = 0; } });
  body.addEventListener("pointermove", (e) => { if (sy === null) return; dy = e.clientY - sy; if (dy > 0) body.style.transform = `translateY(${dy}px)`; });
  const up = () => { if (sy === null) return; sy = null; body.style.transform = ""; if (dy > 90) closeDetail(); dy = 0; };
  body.addEventListener("pointerup", up); body.addEventListener("pointercancel", up);
}

/* ---------- filter ---------- */
function buildFilter() {
  const groups = [["mood", "Mood"], ["role", "Role"], ["age", "Age"]];
  const html = groups.map(([k, title]) => {
    let vals = [...new Set(avatars.map((a) => a[k]).filter(Boolean))];
    vals.sort((x, y) => k === "age" ? (AGE_ORDER.indexOf(x) + 1 || 99) - (AGE_ORDER.indexOf(y) + 1 || 99) || x.localeCompare(y) : x.localeCompare(y));
    return `<div class="fgroup" role="group" aria-labelledby="fg-${k}"><h3 id="fg-${k}">${title}</h3><div class="fchips">${vals.map((v) => `<button type="button" class="chip" data-k="${k}" data-v="${esc(v)}" aria-pressed="false"${k === "mood" ? ` style="--chip:${moodColor(v)}"` : ""}>${esc(v)}</button>`).join("")}</div></div>`;
  }).join("");
  $("#filterGroups").innerHTML = html;
  let t;
  $("#filterGroups").addEventListener("click", (e) => {
    const c = e.target.closest(".chip"); if (!c) return;
    const set = state.sel[c.dataset.k], v = c.dataset.v; set.has(v) ? set.delete(v) : set.add(v);
    c.setAttribute("aria-pressed", set.has(v));
    clearTimeout(t); t = setTimeout(applyFilter, 120);
  });
  $("#filterClear").addEventListener("click", () => { Object.values(state.sel).forEach((s) => s.clear()); $$(".chip").forEach((c) => c.setAttribute("aria-pressed", "false")); applyFilter(); });
  $("#filterShow").addEventListener("click", () => closeFilter());
}
function applyFilter() {
  const s = state.sel, n = s.mood.size + s.role.size + s.age.size;
  if (!n) state.matches = null;
  else state.matches = new Set(avatars.filter((a) => (!s.mood.size || s.mood.has(a.mood)) && (!s.role.size || s.role.has(a.role)) && (!s.age.size || s.age.has(a.age))).map((a) => a.id));
  for (const b of [$("#filterBadge"), $("#filterBadgeM")]) { b.hidden = !n; b.textContent = n; }
  $("#filterBtn").classList.toggle("is-on", !!n);
  live.textContent = state.matches ? `${state.matches.size} of ${avatars.length} avatars match` : "Filters cleared";
  if (!mobileMQ.matches) desk.applyFilter();
  if (!$("#explore").hidden) mob.applyFilter();
}
let filterOpener = null;
function openFilter(from) {
  const p = $("#filterPop"); if (!p.hidden) return closeFilter();
  if (!mobileMQ.matches && scrollY > 40) { scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" }); }
  filterOpener = from; p.hidden = false; $("#filterBtn").setAttribute("aria-expanded", "true");
  if (mobileMQ.matches) { $("#scrim").hidden = false; }
  $(".chip", p).focus({ preventScroll: true });
}
function closeFilter(refocus = true) {
  const p = $("#filterPop"); if (p.hidden) return;
  p.hidden = true; $("#scrim").hidden = true; $("#filterBtn").setAttribute("aria-expanded", "false");
  if (refocus && filterOpener) filterOpener.focus({ preventScroll: true });
}

/* ---------- examples ---------- */
// call tiles: play the clip once the tile is on screen, pause when it leaves
function activateCallVideos(root) {
  const vids = [...root.querySelectorAll(".call-tile video, .big-wrap video, .fmt-art video")]; if (!vids.length) return;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src) { loopWithPause(v); v.addEventListener("playing", () => v.classList.add("on")); v.addEventListener("error", () => v.remove()); v.src = v.dataset.src; }
      v.play().catch(() => {});
    } else v.pause();
  }), { threshold: 0.2 });
  vids.forEach((v) => io.observe(v));
}
function buildExamples() {
  const E = CONFIG.examples, av = (id, k) => pick(id, k), im = (a) => U.tile(a.id);
  const avatarImg = (a, cls = "") => `<img class="av ${cls}" src="${im(a)}" alt="" loading="lazy" width="64" height="64">`;
  const chatMsgs = [["10:24", "Swapped the hero art. Can someone check the contrast on the yellow?"], ["10:26", "On it. Passes AA on mobile, borderline on the big banner."], ["10:31", "Shipping the build at 4. Shout if anything breaks."]];
  const people = E.chat.map((id, k) => av(id, k));
  const dms = E.dms.map((id, k) => av(id, k + 3));
  const calls = E.call.map((id, k) => av(id, k + 5));
  const picker = E.picker.map((id, k) => av(id, k + 1));
  const chosen = picker[E.picked] || picker[0];
  const card = (title, sub, inner) => `<article class="ex"><div class="ex-head"><h3>${title}</h3><span>${sub}</span></div>${inner}</article>`;
  $("#examplesGrid").innerHTML = [
    card("Team chat", "Messages and presence", `<div class="ex-card chat"><div class="chat-side"><div class="lbl">CHANNELS</div><div class="row on"># design-crit</div><div class="row"># shipping</div><div class="row"># random</div><div class="lbl sp">DIRECT</div>${dms.map((a) => `<div class="row">${avatarImg(a)}${esc(a.name)}</div>`).join("")}</div><div class="chat-main">${people.map((a, k) => `<div class="msg">${avatarImg(a)}<div><div class="msg-n">${esc(a.name)} <small>${chatMsgs[k][0]}</small></div><div class="msg-t">${chatMsgs[k][1]}</div></div></div>`).join("")}<div class="composer">Message #design-crit</div></div></div>`),
    card("Video call", "Camera-off tiles", `<div class="ex-card call"><div class="call-grid">${calls.map((a, k) => `<div class="call-tile${k === E.speaking ? " speaking" : ""}"><img src="${im(a)}" alt="${esc(a.alt)}" loading="lazy" width="196" height="196">${hasMp4(a.id) && !reduceMotion.matches ? `<video data-src="${U.mp4(a.id)}" muted playsinline preload="none" aria-hidden="true"></video>` : ""}<span class="call-name">${esc(a.name)}</span></div>`).join("")}</div><div class="call-ctl"><i><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="7" y="2.5" width="6" height="10" rx="3" fill="none" stroke="#F4EADB" stroke-width="1.6"/><path d="M4.5 9.5a5.5 5.5 0 0011 0M10 15v2.5" fill="none" stroke="#F4EADB" stroke-width="1.6" stroke-linecap="round"/></svg></i><i><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="5.5" width="10" height="9" rx="2" fill="none" stroke="#F4EADB" stroke-width="1.6"/><path d="M12.5 9l5-2.5v7L12.5 11" fill="none" stroke="#F4EADB" stroke-width="1.6" stroke-linejoin="round"/></svg></i><i><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="15" height="10" rx="2" fill="none" stroke="#F4EADB" stroke-width="1.6"/><path d="M10 16.5v-2M7 16.5h6" fill="none" stroke="#F4EADB" stroke-width="1.6" stroke-linecap="round"/></svg></i><b>Leave</b></div></div>`),
    card("Dashboard", "Team table", `<div class="ex-card dash"><div class="dash-top"><h4>Team</h4><span>Invite</span></div><div class="tr th"><div class="c1">NAME</div><div class="c2">ROLE</div><div>STATUS</div></div>${E.team.map(([id, role, st], k) => { const a = av(id, k + 7); return `<div class="tr"><div class="c1">${avatarImg(a)}${esc(a.name)}</div><div class="c2">${role}</div><div><span class="st${st === "Away" ? " away" : ""}">${st}</span></div></div>`; }).join("")}</div>`),
    card("Onboarding", "Pick a profile picture", `<div class="ex-card onb"><div class="onb-l"><div><h4>Choose your avatar</h4><p>You can change it any time in settings.</p></div><div class="picker">${picker.map((a, k) => k === E.picked ? `<div class="sel">${avatarImg(a)}</div>` : avatarImg(a)).join("")}</div><div class="field">Maya</div></div><div class="onb-r"><div><span class="big-wrap"><img class="av big" src="${im(chosen)}" alt="${esc(chosen.alt)}" loading="lazy" width="150" height="150">${hasMp4(chosen.id) && !reduceMotion.matches ? `<video class="call-vid" data-src="${U.mp4(chosen.id)}" muted playsinline preload="none" aria-hidden="true"></video>` : ""}</span><div class="nm">Maya</div><div class="sub">${esc(chosen.name)}</div></div><div class="go">Continue</div></div></div>`),
  ].join("");
  activateCallVideos($("#examplesGrid"));
}

/* ---------- use it ---------- */
function buildUse() {
  const h = hero(), a0 = avatars[0];
  $("#formats").innerHTML = `
    <div class="fmt"><div class="fmt-art png"><img src="${U.cutout(h.id)}" alt="" loading="lazy" width="150" height="150"></div><div class="fmt-txt"><b>PNG</b><span>Transparent or on color</span></div></div>
    <div class="fmt"><div class="fmt-art"><img src="${U.tile(h.id)}" alt="" loading="lazy" width="178" height="178"></div><div class="fmt-txt"><b>WebP</b><span>Same face, lighter</span></div></div>
    <div class="fmt"><div class="fmt-art"><img src="${U.tile(h.id)}" alt="" loading="lazy" width="178" height="178">${hasMp4(h.id) && !reduceMotion.matches ? `<video data-src="${U.mp4(h.id)}" muted playsinline preload="none" aria-hidden="true"></video>` : ""}<span class="loops"><svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="#F4EADB"/></svg>Loops</span></div><div class="fmt-txt"><b>MP4</b><span>Loops on its own</span></div></div>`;
  activateCallVideos($("#formats"));
  const snippets = {
    npm: `import { findAvatars, imageUrl, videoUrl } from "${meta.name}";\n\nconst [a] = findAvatars({ mood: "${a0.mood}" });\n\nimageUrl(a.id);                        // .../webp/${a0.id}.webp\nimageUrl(a.id, { variant: "cutout" }); // transparent\nvideoUrl(a.id);                        // .../mp4/${a0.id}.mp4`,
    html: `<img\n  src="https://cdn.jsdelivr.net/npm/${meta.name}@${meta.version}/assets/webp/${a0.id}.webp"\n  alt="${a0.alt}"\n  width="256" height="256">`,
    react: `import { getAvatar, imageUrl } from "${meta.name}";\n\nexport const Avatar = ({ id }) => {\n  const a = getAvatar(id);\n  return <img src={imageUrl(id)}\n    alt={a.alt} />;\n};`,
  };
  const tabs = $$('[role="tab"]'), code = $("#code"), panel = $("#codeBody");
  const show = (k, focus) => {
    tabs.forEach((t) => { const on = t.dataset.tab === k; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; if (on) { panel.setAttribute("aria-labelledby", t.id); if (focus) t.focus(); } });
    code.innerHTML = highlight(snippets[k]);
  };
  tabs.forEach((t) => { t.addEventListener("click", () => show(t.dataset.tab)); t.addEventListener("keydown", (e) => { const i = tabs.indexOf(t), d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); show(tabs[mod(i + d, tabs.length)].dataset.tab, true); } }); });
  show("npm");
  $("#prompt").textContent = `Install the ${meta.name} npm package. Read its llms.txt, then use the avatars wherever this project needs profile pictures or placeholder faces. Pick each face by mood, role or tags, render it with imageUrl(id) (or videoUrl(id) for a looping clip), and always set alt from the manifest.`;
}

/* ---------- download + pro ---------- */
function buildDownload() {
  const E = CONFIG.examples;
  $("#dlVersion").textContent = "v" + meta.version;
  $("#installCmd").textContent = "$ npm i " + meta.name;
  $(".install .copy").dataset.copyText = "npm i " + meta.name;
  $("#ghLink").href = `https://github.com/${meta.githubRepo}`;
  $("#npmLink").href = `https://www.npmjs.com/package/${meta.name}`;
  $("#zipFaces").innerHTML = E.zip.map((id, k) => `<img class="f${k + 1}" src="${U.cutout(pick(id, k + 2).id)}" alt="" loading="lazy" width="230" height="230">`).join("");
  $("#proFaces").innerHTML = E.pro.map((id, k) => `<img class="pf${k + 1}" src="${U.cutout(pick(id, k + 4).id)}" alt="" loading="lazy" width="260" height="260">`).join("");
}

/* ---------- pro pack banner: Paper "Grain Gradient" shader ---------- */
// Same settings as the Paper design (ripple, scale 2.7, softness .72, intensity .6, noise .2) via a vendored copy of
// @paper-design/shaders (Apache-2.0, see vendor/paper-shaders). Loaded only when the banner nears the viewport;
// the CSS gradients stay as the fallback if WebGL2 or the import fails. Reduced motion renders a still frame.
function setupProShader() {
  const banner = $(".pro-banner"), host = $("#proShader");
  if (!banner || !host) return;
  let started = false;
  const mount = async () => {
    if (started) return; started = true;
    try {
      const v = "./vendor/paper-shaders/";
      const [{ ShaderMount }, { grainGradientFragmentShader, GrainGradientShapes }, { ShaderFitOptions }, { getShaderColorFromString }, { getShaderNoiseTexture }] = await Promise.all([
        import(v + "shader-mount.js"), import(v + "shaders/grain-gradient.js"), import(v + "shader-sizing.js"), import(v + "get-shader-color-from-string.js"), import(v + "get-shader-noise-texture.js"),
      ]);
      const noise = getShaderNoiseTexture(); await noise.decode();
      const colors = ["#D63D30", "#EAB33F", "#57C4C9", "#2547CF"];
      banner.classList.add("has-shader");
      new ShaderMount(host, grainGradientFragmentShader, {
        u_colorBack: getShaderColorFromString("#00000000"), u_colors: colors.map((c) => getShaderColorFromString(c)), u_colorsCount: colors.length,
        u_softness: 0.72, u_intensity: 0.6, u_noise: 0.2, u_shape: GrainGradientShapes.ripple, u_noiseTexture: noise,
        u_fit: ShaderFitOptions.contain, u_scale: 2.7, u_rotation: 0, u_offsetX: 0, u_offsetY: 0, u_originX: 0.5, u_originY: 0.5, u_worldWidth: 0, u_worldHeight: 0,
      }, undefined, reduceMotion.matches ? 0 : 1, 21741.4);
    } catch (err) { banner.classList.remove("has-shader"); console.info("Pro banner shader unavailable, using CSS fallback.", err); }
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { io.disconnect(); mount(); } }, { rootMargin: "600px 0px" });
    io.observe(banner);
  } else mount();
}

/* ---------- waitlist ---------- */
document.addEventListener("submit", async (e) => {
  const f = e.target.closest("[data-waitlist]"); if (!f) return; e.preventDefault();
  const note = f.parentElement.querySelector("[data-waitlist-note]"), email = f.email.value.trim(), keep = note.dataset.orig ??= note.textContent;
  if (f.company.value) return; // honeypot
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = "Please enter a valid email address."; f.email.focus(); return; }
  if (!CONFIG.waitlistEndpoint) { note.textContent = "The waitlist is not connected yet. Please check back soon."; return; }
  const btn = $("button", f); btn.disabled = true;
  try {
    const r = await fetch(CONFIG.waitlistEndpoint, { method: "POST", body: new FormData(f), headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(r.status);
    note.textContent = "Almost there. Check your inbox and confirm your email."; f.reset();
  } catch { note.textContent = "Something went wrong. Please try again."; }
  btn.disabled = false; void keep;
});

/* ---------- chrome: nav, dock, popovers, explore, menu ---------- */
let exploreOpener, menuOpener;
function openExplore() { const x = $("#explore"); exploreOpener = $("#exploreBtn"); x.hidden = false; lock(); mob.measure(); mob.applyFilter(); $("#exploreClose").focus({ preventScroll: true }); }
function closeExplore() { const x = $("#explore"); if (x.hidden) return; closeFilter(false); x.hidden = true; unlock(); exploreOpener?.focus({ preventScroll: true }); }
function openMenu() { menuOpener = $("#menuBtn"); $("#menu").hidden = false; $("#menuBtn").setAttribute("aria-expanded", "true"); lock(); $("#menuClose").focus(); }
function closeMenu() { if ($("#menu").hidden) return; $("#menu").hidden = true; $("#menuBtn").setAttribute("aria-expanded", "false"); unlock(); menuOpener?.focus({ preventScroll: true }); }
function openPro() {
  const p = $("#proPop"), open = p.hidden; p.hidden = !open; $("#proBtn").setAttribute("aria-expanded", open);
  if (open) $("input[type=email]", p).focus({ preventScroll: true });
}
function setupChrome() {
  $("#filterBtn").addEventListener("click", (e) => openFilter(e.currentTarget));
  $("#exploreFilter").addEventListener("click", (e) => openFilter(e.currentTarget));
  $("#scrim").addEventListener("click", () => closeFilter());
  $("#exploreBtn").addEventListener("click", openExplore);
  $("#exploreClose").addEventListener("click", closeExplore);
  $("#menuBtn").addEventListener("click", openMenu);
  $("#menuClose").addEventListener("click", closeMenu);
  $$("[data-close-menu]").forEach((a) => a.addEventListener("click", () => { $("#menu").hidden = true; $("#menuBtn").setAttribute("aria-expanded", "false"); unlock(); }));
  $("#proBtn").addEventListener("click", openPro);
  document.addEventListener("pointerdown", (e) => {
    if (!$("#proPop").hidden && !e.target.closest("#proPop,#proBtn")) { $("#proPop").hidden = true; $("#proBtn").setAttribute("aria-expanded", "false"); }
    if (!$("#filterPop").hidden && !mobileMQ.matches && !e.target.closest("#filterPop,#filterBtn")) closeFilter(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!$("#proPop").hidden) { $("#proPop").hidden = true; $("#proBtn").setAttribute("aria-expanded", "false"); $("#proBtn").focus(); }
    else if (!$("#filterPop").hidden) closeFilter();
    else if (!$("#detail").hidden) closeDetail();
    else if (!$("#menu").hidden) closeMenu();
    else if (!$("#explore").hidden) closeExplore();
  });
  // nav + dock state on scroll
  const nav = $("#nav"), lib = $("#library"), credit = $("#creditPill");
  let tick = false;
  const onScroll = () => {
    tick = false;
    const b = lib.getBoundingClientRect().bottom;
    nav.classList.toggle("on-light", b < 56);
    document.documentElement.style.setProperty("--dock-fade", b > innerHeight * 0.5 ? 1 : 0);
    $("#dock").classList.toggle("on-light", b < innerHeight - 40);
  };
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
}

boot().catch((err) => { console.error(err); $("#headline").insertAdjacentHTML("afterend", '<p style="position:relative;z-index:5;text-align:center;color:#B4A793">Could not load the avatar list.</p>'); });

// Mobile first screen: a slow strip of faces drifting across, built from the data (two copies for a seamless loop).
function buildMarquee() {
  const track = $("#mTrack"); if (!track || !avatars.length) return;
  const one = avatars.map((a) => `<img src="${U.tile(a.id)}" alt="" width="64" height="64" decoding="async">`).join("");
  track.innerHTML = one + one;
  track.style.setProperty("--dur", Math.max(20, avatars.length * 3) + "s");
}
