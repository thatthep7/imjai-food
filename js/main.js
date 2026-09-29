/* อิ่มใจ — ตัวนำทาง (hash router), แถบล่าง, จัดการคลิก, เริ่มแอป */
(function () {
  'use strict';
  const IJ = window.IJ, S = IJ.S, esc = IJ.esc, baht = IJ.baht, $ = IJ.$, $$ = IJ.$$, icon = IJ.icon;

  IJ.motion = () => (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

  const ROUTES = [
    [/^\/?$/, 'home'],
    [/^\/search$/, 'search'],
    [/^\/r\/([\w-]+)$/, 'shop'],
    [/^\/cart$/, 'cart'],
    [/^\/order\/([\w-]+)$/, 'order'],
    [/^\/orders$/, 'orders'],
    [/^\/me$/, 'me']
  ];

  let cur = null;
  let navDepth = 0;
  let leave = [];
  let ticks = [];
  const scrollMem = {};

  IJ.onLeave = (fn) => leave.push(fn);
  IJ.onTick = (fn) => ticks.push(fn);
  setInterval(() => ticks.forEach((f) => { try { f(); } catch (e) { console.error(e); } }), 500);

  IJ.views.notfound = (msg) => ({
    html: `<header class="topbar"><button type="button" class="icon-btn" data-act="back" aria-label="ย้อนกลับ">${icon('back')}</button><div class="tb-t"><b>ไม่พบหน้านี้</b></div><span class="icon-btn"></span></header>
      <div class="empty tall pad-x"><p class="big-emo">🍽️</p><h2>${esc(typeof msg === 'string' ? msg : 'ไม่พบหน้าที่ต้องการ')}</h2><a class="btn primary" href="#/" data-go="/">กลับหน้าแรก</a></div>`,
    tab: null, dock: false
  });

  const hashPath = () => {
    let h = location.hash.replace(/^#/, '');
    try { h = decodeURIComponent(h); } catch (e) { /* ใช้ค่าเดิม */ }
    return h.startsWith('/') ? h : '/';
  };

  function render(full, opts = {}) {
    const keep = !!opts.keep;
    if (cur && !keep) scrollMem[cur] = window.scrollY;
    leave.forEach((f) => { try { f(); } catch (e) { /* ไม่เป็นไร */ } });
    leave = [];
    ticks = [];
    if (!keep) IJ.closeOverlays();

    const [path, qs] = full.split('?');
    let name = 'notfound', args = [];
    for (const [re, n] of ROUTES) {
      const m = path.match(re);
      if (m) { name = n; args = m.slice(1); break; }
    }
    const y0 = window.scrollY;
    const v = IJ.views[name](...args, new URLSearchParams(qs || ''));
    cur = full;
    IJ.curView = name;
    const view = $('#view');
    view.innerHTML = v.html;
    view.dataset.view = name;

    const bar = $('#bar');
    bar.innerHTML = v.bar || '';
    bar.hidden = !v.bar;
    $('#tabbar').hidden = !v.tab;
    $('#dock').classList.toggle('no-tabs', !v.tab);
    $$('#tabbar [data-tab]').forEach((a) => a.setAttribute('aria-current', a.dataset.tab === v.tab ? 'page' : 'false'));
    IJ.dockWantsCart = !!v.dock;
    IJ.refreshDock();
    if (v.mount) v.mount(view);

    if (keep) window.scrollTo(0, y0);
    else {
      const restore = (opts.back || v.tab) && scrollMem[full];
      window.scrollTo(0, restore || 0);
      view.focus({ preventScroll: true });
    }
  }

  IJ.go = (path, replace) => {
    if (path === cur && !replace) { window.scrollTo({ top: 0, behavior: IJ.motion() }); return; }
    try {
      if (replace) history.replaceState(null, '', '#' + path);
      else { history.pushState(null, '', '#' + path); navDepth++; }
    } catch (e) { /* บางสภาพแวดล้อมไม่ให้แก้ history ก็ยังแสดงผลได้ */ }
    render(path);
  };
  IJ.rerender = () => { if (cur) render(cur, { keep: true }); };
  IJ.back = () => {
    const before = cur;
    if (navDepth > 0) {
      history.back();
      setTimeout(() => { if (cur === before) IJ.go('/', true); }, 400);
    } else IJ.go('/', true);
  };
  IJ.act.back = () => IJ.back();

  const onHistory = () => {
    const p = hashPath();
    if (p === cur) return;
    navDepth = Math.max(0, navDepth - 1);
    render(p, { back: true });
  };
  window.addEventListener('popstate', onHistory);
  window.addEventListener('hashchange', onHistory);

  /* ---------- แถบล่าง: ตะกร้า + แท็บ ---------- */
  let lastCount = -1;
  IJ.refreshDock = () => {
    const box = $('#cartbar');
    const shop = IJ.cartShop();
    const n = IJ.cartCount();
    const show = IJ.dockWantsCart && n > 0 && !!shop && IJ.curView !== 'cart';
    box.hidden = !show;
    if (show) {
      box.innerHTML = `<a class="cartbar${n !== lastCount && lastCount >= 0 ? ' bump' : ''}" href="#/cart" data-go="/cart">
        <span class="cb-n">${n}</span>
        <span class="cb-mid"><b>ดูตะกร้า</b><small>${esc(shop.name)}</small></span>
        <b class="cb-p">${baht(IJ.cartSubtotal())}</b>
      </a>`;
    }
    lastCount = n;
    const dot = $('#tabbar [data-tab="orders"] .tab-dot');
    if (dot) dot.hidden = !IJ.activeOrders().length;
    requestAnimationFrame(() => document.documentElement.style.setProperty('--dock-h', $('#dock').offsetHeight + 'px'));
  };

  function buildTabbar() {
    const tabs = [['home', '/', 'home', 'หน้าแรก'], ['search', '/search', 'search', 'ค้นหา'], ['orders', '/orders', 'receipt', 'ออเดอร์'], ['me', '/me', 'user', 'ฉัน']];
    $('#tabbar').innerHTML = tabs.map(([k, p, ic, t]) => `<a href="#${p}" data-go="${p}" data-tab="${k}"><span class="tab-ic">${icon(ic)}${k === 'orders' ? '<i class="tab-dot" hidden></i>' : ''}</span><span>${t}</span></a>`).join('');
  }

  /* ---------- จัดการคลิกทั้งแอป ---------- */
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;
    const g = e.target.closest('[data-go]');
    if (g) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const ov = g.closest('.ov');
      if (ov && ov._close) ov._close();
      IJ.go(g.dataset.go);
      return;
    }
    const a = e.target.closest('[data-act]');
    if (a && IJ.act[a.dataset.act] && !a.disabled) {
      e.preventDefault();
      IJ.act[a.dataset.act](a, e);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { const t = IJ.topOverlay(); if (t && t._close) t._close(); }
  });

  /* ---------- เริ่มแอป ---------- */
  IJ.applyTheme();
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', IJ.applyTheme); } catch (e) { /* เบราว์เซอร์เก่า */ }
  buildTabbar();
  render(hashPath());
  window.addEventListener('resize', () => IJ.refreshDock());
  document.documentElement.classList.add('ready');

  // ให้เปิดใช้แบบแอปได้ (Add to Home Screen) และเปิดได้แม้เน็ตหลุด เมื่อ deploy บน https
  const top = (() => { try { return window.top === window.self; } catch (e) { return false; } })();
  if ('serviceWorker' in navigator && top && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
