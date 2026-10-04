/* อิ่มใจ — แกนกลาง: เก็บข้อมูล, ยูทิลิตี, ไอคอน, หน้าต่างซ้อน, ตะกร้า, คำนวณราคา, จำลองการส่ง */
(function () {
  'use strict';
  const IJ = window.IJ;

  /* ---------- เก็บข้อมูลในเครื่อง (localStorage + สำรองในหน่วยความจำ) ---------- */
  const mem = {};
  const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
  const PREFIX = 'imjai.';
  const store = {
    get(k, d) {
      try {
        const raw = localStorage.getItem(PREFIX + k);
        if (raw != null) return JSON.parse(raw);
      } catch (e) { /* ใช้ค่าในหน่วยความจำแทน */ }
      return k in mem ? clone(mem[k]) : clone(d);
    },
    set(k, v) {
      mem[k] = clone(v);
      try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) { /* โหมดส่วนตัว/บล็อก */ }
    },
    clearAll() {
      Object.keys(mem).forEach((k) => delete mem[k]);
      try {
        Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k));
      } catch (e) { /* ไม่เป็นไร */ }
    }
  };
  IJ.store = store;

  const DEFAULT_ADDRS = [
    { id: 'home', label: 'บ้าน', line: 'คอนโดอิ่มสุข ห้อง 1204', sub: 'ซ.ท้องร้อง ถ.หิวบ่อย แขวงอยากกิน กรุงเทพฯ', note: 'ฝากไว้ที่ล็อบบี้ได้เลย' },
    { id: 'work', label: 'ที่ทำงาน', line: 'อาคารขยันดี ชั้น 8', sub: 'ถ.งานเยอะ แขวงเลิกดึก กรุงเทพฯ', note: '' }
  ];

  const S = (IJ.S = {});
  IJ.loadState = () => Object.assign(S, {
    cart: store.get('cart', { rid: null, lines: [] }),
    orders: store.get('orders', []),
    favs: store.get('favs', []),
    addrs: store.get('addrs', DEFAULT_ADDRS),
    addrId: store.get('addrId', 'home'),
    wallet: store.get('wallet', 1500),
    theme: store.get('theme', 'system'),
    recent: store.get('recent', []),
    profile: store.get('profile', { name: 'คนหิวรอบดึก' }),
    checkout: store.get('checkout', { speed: 'std', pay: 'wallet', code: '', cutlery: false, riderNote: '' })
  });
  IJ.loadState();
  IJ.save = (...keys) => keys.forEach((k) => store.set(k, S[k]));

  /* ---------- จัดข้อมูลร้าน/เมนูให้ค้นง่าย ---------- */
  /* รูปถ่ายจริงของเมนู (ไม่บังคับ) ใช้แทนอีโมจิในหน้ารายละเอียดเมนู ที่มาต้องเป็นรูปเสรี/อนุญาตใช้ซ้ำได้ */
  const PHOTOS = {
    'padaeng.0': { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Kraphao_mu_khai_dao.jpg', by: 'Takeaway', src: 'Wikimedia Commons', lic: 'CC BY-SA 3.0' }
  };

  IJ.shop = {};
  IJ.item = {};
  IJ.SHOPS.forEach((s, si) => {
    s.idx = si;
    s.items = [];
    s.sections = s.menu.map(([title, rows], secI) => {
      const items = rows.map((r) => {
        const [name, price, e, desc, opts, flags] = r;
        const f = (flags || '').split(/\s+/).filter(Boolean);
        const sale = f.find((x) => x.startsWith('sale:'));
        const id = s.id + '.' + s.items.length;
        const it = {
          id, shop: s, name, price, e, desc: desc || '',
          opts: (opts || '').split(',').map((x) => x.trim()).filter(Boolean),
          hot: f.includes('hot'), isNew: f.includes('new'), rec: f.includes('rec'),
          was: sale ? price + Number(sale.slice(5)) : 0, sec: secI, photo: PHOTOS[id] || null
        };
        s.items.push(it);
        IJ.item[it.id] = it;
        return it;
      });
      return { title, items };
    });
    IJ.shop[s.id] = s;
  });
  IJ.cat = Object.fromEntries(IJ.CATS.map((c) => [c.id, c]));

  /* ---------- ยูทิลิตี ---------- */
  const esc = (IJ.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const baht = (IJ.baht = (n) => '฿' + Math.round(n).toLocaleString('en-US'));
  IJ.$ = (sel, root = document) => root.querySelector(sel);
  IJ.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  IJ.time = (ts) => new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' น.';
  IJ.date = (ts) => new Date(ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  IJ.kfmt = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n));
  IJ.isNight = (d = new Date()) => d.getHours() >= 22 || d.getHours() < 6;
  IJ.shopVars = (s) => `--c1:${s.c[0]};--c2:${s.c[1]}`;
  IJ.addr = () => S.addrs.find((a) => a.id === S.addrId) || S.addrs[0];
  IJ.uid = () => Math.random().toString(36).slice(2, 8);

  IJ.promoText = (p) => {
    if (!p) return '';
    if (p.k === 'ship') return `ส่งฟรีเมื่อสั่งครบ ${baht(p.min)}`;
    if (p.k === 'off') return `ลด ${baht(p.amt)} เมื่อสั่งครบ ${baht(p.min)}`;
    return `ลด ${p.pct}% (สูงสุด ${baht(p.max)}) เมื่อสั่งครบ ${baht(p.min)}`;
  };

  /* ---------- ไอคอนเส้น (SVG) ---------- */
  const P = {
    home: '<path d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.8H9.2v5.8H5A1.5 1.5 0 0 1 3.5 19z"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m20 20-4.2-4.2"/>',
    receipt: '<path d="M6 3.5h12v17l-2.4-1.6-2.4 1.6-1.2-.8-1.2.8-2.4-1.6L6 20.5z"/><path d="M9 8.5h6M9 12.5h6"/>',
    user: '<circle cx="12" cy="8.2" r="3.9"/><path d="M4.5 20.2c.6-3.8 3.7-5.7 7.5-5.7s6.9 1.9 7.5 5.7"/>',
    back: '<path d="M14.8 5.5 8.3 12l6.5 6.5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    heart: '<path d="M12 20.2s-7.6-4.6-9-9.4C2 7.3 4.3 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.8 1.1-1.7 2.7-2.8 4.7-2.8 3 0 5.3 2.8 4.3 6.3-1.4 4.8-9 9.4-9 9.4z"/>',
    star: '<path d="m12 3.2 2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    bike: '<circle cx="6" cy="16.5" r="3"/><circle cx="18" cy="16.5" r="3"/><path d="M6 16.5 9.5 9h4l3 7.5M13.5 9l1.5-3h2.5M9 9H7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    chev: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
    down: '<path d="m6 9.5 6 6 6-6"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    tag: '<path d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1 1 0 0 1 0 1.4l-6.9 6.9a1 1 0 0 1-1.4 0z"/><circle cx="8" cy="8" r="1.5"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.1" fill="currentColor"/><circle cx="15" cy="15" r="1.1" fill="currentColor"/><circle cx="15" cy="9" r="1.1" fill="currentColor"/><circle cx="9" cy="15" r="1.1" fill="currentColor"/>',
    chat: '<path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5H4.5z"/>',
    phone: '<path d="M6.5 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="7.5" width="16.5" height="11.5" rx="2.5"/><circle cx="16.5" cy="13.2" r="1.2" fill="currentColor"/>',
    cash: '<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
    bag: '<path d="M5.5 8h13l-1 12h-11z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    edit: '<path d="M4.5 19.5h4l10-10-4-4-10 10z"/><path d="m13 7 4 4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    fork: '<path d="M7 3.5v7a2 2 0 0 0 2 2v8M11 3.5v7a2 2 0 0 1-2 2M7 3.5v5M17 20.5V3.5c-2 1-3 3.5-3 6.5v3h3"/>',
    moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    bolt: '<path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19 13 11"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>'
  };
  IJ.icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
  IJ.starIcon = () => `<svg class="ic-star" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${'m12 3.2 2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9-4.4-4.1 6-.8z'}"/></svg>`;

  /* ---------- Toast ---------- */
  let toastT;
  IJ.toast = (msg) => {
    const el = IJ.$('#toast');
    el.textContent = msg;
    // ถ้ามีหน้าต่างเลื่อนขึ้นที่มีปุ่มด้านล่าง ให้แจ้งเตือนลอยเหนือปุ่ม ไม่บังปุ่ม
    const ov = IJ.topOverlay && IJ.topOverlay();
    const foot = ov && ov.querySelector('.sheet-foot, .chat-form');
    el.style.bottom = foot ? Math.round(window.innerHeight - foot.getBoundingClientRect().top + 12) + 'px' : '';
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 2300);
  };

  /* ---------- หน้าต่างซ้อน: bottom sheet และ dialog ---------- */
  const layer = () => IJ.$('#layer');
  function mountOverlay(inner, cls) {
    const wrap = document.createElement('div');
    wrap.className = 'ov ' + cls;
    wrap.innerHTML = inner;
    layer().appendChild(wrap);
    document.body.classList.add('locked');
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('in')));
    let closed = false;
    const close = (cb) => {
      if (closed) return;
      closed = true;
      wrap.classList.remove('in');
      setTimeout(() => {
        wrap.remove();
        if (!layer().children.length) document.body.classList.remove('locked');
        if (typeof cb === 'function') cb();
        if (wrap._onClose) wrap._onClose();
      }, 230);
    };
    wrap._close = close;
    return { wrap, close };
  }

  IJ.openSheet = function (html, opts = {}) {
    const { wrap, close } = mountOverlay(
      `<div class="scrim" data-close></div><section class="sheet ${opts.cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(opts.label || '')}"><div class="grab" data-close aria-hidden="true"><span></span></div>${html}</section>`,
      'ov-sheet'
    );
    wrap._onClose = opts.onClose;
    wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    const sheet = wrap.querySelector('.sheet');
    // ปัดลงเพื่อปิด (ลากที่แถบจับด้านบน)
    const grab = sheet.querySelector('.grab');
    let y0 = null, dy = 0;
    grab.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; dy = 0; sheet.style.transition = 'none'; }, { passive: true });
    grab.addEventListener('touchmove', (e) => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sheet.style.transform = `translate(-50%, ${dy}px)`; }, { passive: true });
    grab.addEventListener('touchend', () => {
      sheet.style.transition = '';
      sheet.style.transform = '';
      if (dy > 80) close();
      y0 = null;
    });
    return { el: sheet, close };
  };

  IJ.dialog = function ({ title, text = '', actions = [{ label: 'ตกลง', kind: 'primary' }] }) {
    const { wrap, close } = mountOverlay(
      `<div class="scrim"></div><div class="dlg" role="alertdialog" aria-modal="true"><h3>${esc(title)}</h3>${text ? `<p>${text}</p>` : ''}<div class="dlg-actions">${actions
        .map((a, i) => `<button type="button" class="btn ${a.kind || 'ghost'}" data-i="${i}">${esc(a.label)}</button>`)
        .join('')}</div></div>`,
      'ov-center'
    );
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      const a = actions[+b.dataset.i];
      close(a.run);
    });
    setTimeout(() => { const b = wrap.querySelector('.btn.primary, .btn.danger') || wrap.querySelector('.btn'); b && b.focus(); }, 60);
    return close;
  };

  IJ.closeOverlays = () => IJ.$$('#layer > .ov').forEach((w) => w._close && w._close());
  IJ.topOverlay = () => { const l = IJ.$$('#layer > .ov'); return l[l.length - 1]; };

  /* ---------- ตัวเลือกเมนูและตะกร้า ---------- */
  IJ.selPrice = (sel) => Object.entries(sel || {}).reduce((sum, [g, idxs]) => sum + idxs.reduce((a, i) => a + ((IJ.OPT[g] && IJ.OPT[g].o[i] && IJ.OPT[g].o[i][1]) || 0), 0), 0);
  IJ.selText = (sel) => Object.entries(sel || {}).flatMap(([g, idxs]) => idxs.map((i) => IJ.OPT[g].o[i][0])).join(' · ');
  const normSel = (sel) => {
    const out = {};
    Object.keys(sel || {}).sort().forEach((k) => { if (sel[k] && sel[k].length) out[k] = sel[k].slice().sort((a, b) => a - b); });
    return out;
  };

  IJ.cartCount = () => S.cart.lines.reduce((a, l) => a + l.qty, 0);
  IJ.cartSubtotal = () => S.cart.lines.reduce((a, l) => a + l.unit * l.qty, 0);
  IJ.qtyOfItem = (id) => S.cart.lines.filter((l) => l.iid === id).reduce((a, l) => a + l.qty, 0);
  IJ.cartShop = () => (S.cart.rid ? IJ.shop[S.cart.rid] : null);

  /* เพิ่มลงตะกร้า ถ้าตะกร้ามีของร้านอื่นอยู่จะถามก่อน */
  IJ.addToCart = function (item, sel, qty, note, replaceKey, done) {
    const doAdd = () => {
      const s = normSel(sel);
      const n = (note || '').trim().slice(0, 140);
      const key = item.id + '|' + JSON.stringify(s) + '|' + n;
      let pos = -1;
      if (replaceKey) {
        pos = S.cart.lines.findIndex((l) => l.key === replaceKey);
        if (pos >= 0) S.cart.lines.splice(pos, 1);
      }
      S.cart.rid = item.shop.id;
      const ex = S.cart.lines.find((l) => l.key === key);
      if (ex) ex.qty = Math.min(99, ex.qty + qty);
      else {
        const line = { key, iid: item.id, name: item.name, e: item.e, unit: item.price + IJ.selPrice(s), qty, sel: s, note: n };
        if (pos >= 0) S.cart.lines.splice(pos, 0, line); else S.cart.lines.push(line);
      }
      IJ.save('cart');
      IJ.refreshDock();
      done && done();
    };
    const cur = IJ.cartShop();
    if (cur && cur.id !== item.shop.id && S.cart.lines.length) {
      IJ.dialog({
        title: 'เริ่มตะกร้าใหม่ไหม?',
        text: `ตะกร้าของคุณมีอาหารจาก <b>${esc(cur.name)}</b> อยู่ สั่งได้ทีละร้าน ถ้าเริ่มใหม่ของเดิมจะถูกลบ`,
        actions: [
          { label: 'เก็บของเดิม', kind: 'ghost' },
          { label: 'เริ่มตะกร้าใหม่', kind: 'primary', run: () => { S.cart = { rid: null, lines: [] }; S.checkout.code = ''; IJ.save('checkout'); doAdd(); } }
        ]
      });
      return;
    }
    doAdd();
  };

  IJ.setLineQty = (key, qty) => {
    const i = S.cart.lines.findIndex((l) => l.key === key);
    if (i < 0) return;
    if (qty <= 0) S.cart.lines.splice(i, 1); else S.cart.lines[i].qty = Math.min(99, qty);
    if (!S.cart.lines.length) S.cart.rid = null;
    IJ.save('cart');
    IJ.refreshDock();
  };
  IJ.clearCart = () => { S.cart = { rid: null, lines: [] }; IJ.save('cart'); IJ.refreshDock(); };

  /* ---------- คำนวณราคา ---------- */
  IJ.SPEEDS = {
    fast: { name: 'ด่วน', desc: 'ส่งตรงถึงคุณ ไม่แวะส่งที่อื่น', add: 15, dt: -7 },
    std: { name: 'มาตรฐาน', desc: 'ส่งตามปกติ', add: 0, dt: 0 },
    eco: { name: 'ประหยัด', desc: 'คนขับอาจแวะส่งออเดอร์อื่นระหว่างทาง', add: -8, dt: 12 }
  };

  IJ.codeCheck = (code, sub, ship, shopDisc, now = new Date()) => {
    const c = IJ.CODES[code];
    if (!c) return { err: 'ไม่พบโค้ดนี้' };
    if (sub < c.min) return { err: `ต้องสั่งอาหารครบ ${baht(c.min)} (ขาดอีก ${baht(c.min - sub)})` };
    if (c.night && !IJ.isNight(now)) return { err: 'ใช้ได้เฉพาะ 22:00–05:59 น.' };
    if (c.first && S.orders.some((o) => !o.cancelled)) return { err: 'ใช้ได้เฉพาะออเดอร์แรก' };
    if (c.kind === 'ship') {
      if (ship <= 0) return { err: 'ค่าส่งเป็น ฿0 อยู่แล้ว' };
      return { ship: Math.min(c.max, ship) };
    }
    const base = Math.max(0, sub - shopDisc);
    if (c.kind === 'off') return { off: Math.min(c.amt, base) };
    return { off: Math.min(c.max, Math.floor((base * c.pct) / 100)) };
  };

  IJ.pricing = function (shop, lines, speed, code) {
    const sub = lines.reduce((a, l) => a + l.unit * l.qty, 0);
    const sp = IJ.SPEEDS[speed] || IJ.SPEEDS.std;
    const shipFull = Math.max(0, shop.fee + sp.add);
    const small = sub > 0 && sub < 80 ? 10 : 0;
    let shopDisc = 0, shopShip = 0, shopNote = '';
    const p = shop.p;
    if (p) {
      if (sub >= p.min) {
        if (p.k === 'ship') shopShip = shipFull;
        else if (p.k === 'off') shopDisc = Math.min(p.amt, sub);
        else shopDisc = Math.min(p.max, Math.floor((sub * p.pct) / 100));
      } else {
        const what = p.k === 'ship' ? 'ส่งฟรี' : p.k === 'off' ? `ส่วนลด ${baht(p.amt)}` : `ส่วนลด ${p.pct}%`;
        shopNote = `สั่งเพิ่มอีก ${baht(p.min - sub)} รับ${what}จากร้าน`;
      }
    }
    let codeOff = 0, codeShip = 0, codeErr = '';
    if (code) {
      const r = IJ.codeCheck(code, sub, shipFull - shopShip, shopDisc);
      if (r.err) codeErr = r.err;
      codeOff = r.off || 0;
      codeShip = r.ship || 0;
    }
    const total = Math.max(0, sub + shipFull + small - shopDisc - shopShip - codeOff - codeShip);
    return { sub, shipFull, small, shopDisc, shopShip, codeOff, codeShip, codeErr, shopNote, total, eta: [Math.max(8, shop.t[0] + sp.dt), Math.max(15, shop.t[1] + sp.dt)] };
  };

  /* ---------- จำลองการส่ง ---------- */
  IJ.STAGES = [
    { k: 'placed', t: 'ส่งออเดอร์แล้ว', d: 'รอร้านกดรับออเดอร์', f: 0.07 },
    { k: 'cooking', t: 'ร้านกำลังทำอาหาร', d: 'กลิ่นหอมลอยมาแล้ว', f: 0.41 },
    { k: 'pickup', t: 'คนขับกำลังไปรับอาหาร', d: 'ใกล้ถึงร้านแล้ว', f: 0.14 },
    { k: 'delivering', t: 'กำลังไปส่งให้คุณ', d: 'อาหารอยู่ในกล่องเก็บความร้อน', f: 0.38 },
    { k: 'done', t: 'อาหารถึงแล้ว', d: 'ขอให้อิ่มใจ' }
  ];
  IJ.SIM_SPEEDS = [
    { v: 1, name: 'สมจริง', hint: 'รอตามเวลาจริง' },
    { v: 20, name: 'เร็ว ×20', hint: 'ประมาณ 1–2 นาที' },
    { v: 90, name: 'ติดจรวด', hint: 'ไม่กี่วินาที' }
  ];

  IJ.simElapsed = (o, now = Date.now()) => o.sim.e0 + ((now - o.sim.base) / 1000) * o.sim.speed;
  IJ.stageBounds = (o) => {
    let acc = 0;
    return IJ.STAGES.slice(0, 4).map((st) => { const a = acc; acc += st.f * o.simTotal; return [a, acc]; });
  };
  IJ.orderState = function (o, now = Date.now()) {
    if (o.cancelled) return { stage: -1, frac: 0, overall: 0, remain: 0 };
    const e = Math.min(IJ.simElapsed(o, now), o.simTotal);
    const b = IJ.stageBounds(o);
    let stage = 4, frac = 1;
    for (let i = 0; i < 4; i++) {
      if (e < b[i][1]) { stage = i; frac = (e - b[i][0]) / (b[i][1] - b[i][0]); break; }
    }
    if (stage === 4 && !o.doneAt) {
      o.doneAt = now;
      IJ.save('orders');
    }
    return { stage, frac, overall: e / o.simTotal, remain: Math.max(0, o.simTotal - e) };
  };
  IJ.setSimSpeed = (o, v) => { o.sim = { base: Date.now(), e0: IJ.simElapsed(o), speed: v }; IJ.save('orders'); };
  IJ.skipStage = (o) => {
    const st = IJ.orderState(o);
    if (st.stage < 0 || st.stage >= 4) return;
    const b = IJ.stageBounds(o);
    o.sim = { base: Date.now(), e0: b[st.stage][1] + 0.01, speed: o.sim.speed };
    IJ.save('orders');
  };
  IJ.activeOrders = () => S.orders.filter((o) => !o.cancelled && IJ.orderState(o).stage < 4);

  /* ---------- ธีม ---------- */
  IJ.applyTheme = () => {
    const root = document.documentElement;
    if (S.theme === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', S.theme);
    const dark = S.theme === 'dark' || (S.theme === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    IJ.$$('meta[name="theme-color"]').forEach((m) => { m.setAttribute('content', dark ? '#15110F' : '#F8F5F3'); m.removeAttribute('media'); });
  };
})();
