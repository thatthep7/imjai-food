/* อิ่มใจ — ตะกร้า/ชำระเงิน, ที่อยู่, โค้ดส่วนลด, สร้างออเดอร์ */
(function () {
  'use strict';
  const IJ = window.IJ, S = IJ.S, esc = IJ.esc, baht = IJ.baht, $ = IJ.$, $$ = IJ.$$, icon = IJ.icon;

  /* ---------- ที่อยู่จัดส่ง ---------- */
  IJ.act['pick-addr'] = () => openAddrSheet();

  function openAddrSheet() {
    const list = () => S.addrs.map((a) => `
      <label class="addr-opt">
        <input type="radio" name="addr" value="${a.id}"${a.id === S.addrId ? ' checked' : ''}>
        <span class="mark r"></span>
        <span class="addr-o"><b>${esc(a.label)}</b><span>${esc(a.line)}</span><small>${esc(a.sub)}</small></span>
        <button type="button" class="icon-btn" data-edit="${a.id}" aria-label="แก้ไข ${esc(a.label)}">${icon('edit')}</button>
      </label>`).join('');
    const { el, close } = IJ.openSheet(`
      <div class="sheet-body pad-x">
        <h2 class="sheet-h">ส่งไปที่ไหนดี</h2>
        <div id="addr-list" class="addr-list">${list()}</div>
        <button type="button" class="btn ghost full" id="addr-new">${icon('plus')}เพิ่มที่อยู่ใหม่</button>
        <form id="addr-form" class="addr-form" hidden novalidate>
          <input type="hidden" id="af-id">
          <label class="fld"><span>ชื่อเรียก</span><input id="af-label" maxlength="20" placeholder="เช่น หอ, บ้านแฟน"></label>
          <label class="fld"><span>อาคาร / ห้อง / บ้านเลขที่</span><input id="af-line" maxlength="60" placeholder="เช่น หอสุขใจ ห้อง 305"></label>
          <label class="fld"><span>ถนน แขวง เขต</span><input id="af-sub" maxlength="80" placeholder="เช่น ถ.ประชาชื่น กรุงเทพฯ"></label>
          <label class="fld"><span>ฝากบอกคนขับ</span><input id="af-note" maxlength="80" placeholder="เช่น โทรเรียกหน้าประตู"></label>
          <div class="row gap"><button type="button" class="btn ghost grow" id="af-del" hidden>ลบที่อยู่นี้</button><button type="submit" class="btn primary grow">บันทึกที่อยู่</button></div>
        </form>
      </div>`, { label: 'เลือกที่อยู่' });
    const form = $('#addr-form', el);
    const showForm = (a) => {
      form.hidden = false;
      $('#addr-new', el).hidden = true;
      $('#af-id', el).value = a ? a.id : '';
      $('#af-label', el).value = a ? a.label : '';
      $('#af-line', el).value = a ? a.line : '';
      $('#af-sub', el).value = a ? a.sub : '';
      $('#af-note', el).value = a ? a.note : '';
      $('#af-del', el).hidden = !a || S.addrs.length <= 1;
      $('#af-label', el).focus();
      form.scrollIntoView({ block: 'nearest', behavior: IJ.motion() });
    };
    el.addEventListener('change', (e) => {
      if (e.target.name === 'addr') {
        S.addrId = e.target.value;
        IJ.save('addrId');
        IJ.rerender();
        setTimeout(close, 180);
      }
    });
    el.addEventListener('click', (e) => {
      const ed = e.target.closest('[data-edit]');
      if (ed) { e.preventDefault(); showForm(S.addrs.find((a) => a.id === ed.dataset.edit)); }
    });
    $('#addr-new', el).addEventListener('click', () => showForm(null));
    $('#af-del', el).addEventListener('click', () => {
      const id = $('#af-id', el).value;
      S.addrs = S.addrs.filter((a) => a.id !== id);
      if (S.addrId === id) S.addrId = S.addrs[0].id;
      IJ.save('addrs', 'addrId');
      IJ.rerender();
      close();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const label = $('#af-label', el).value.trim(), line = $('#af-line', el).value.trim();
      if (!label || !line) { IJ.toast('กรอกชื่อเรียกและอาคาร/ห้องก่อน'); return; }
      const id = $('#af-id', el).value || 'a' + IJ.uid();
      const a = { id, label, line, sub: $('#af-sub', el).value.trim(), note: $('#af-note', el).value.trim() };
      const i = S.addrs.findIndex((x) => x.id === id);
      if (i >= 0) S.addrs[i] = a; else S.addrs.push(a);
      S.addrId = id;
      IJ.save('addrs', 'addrId');
      IJ.rerender();
      IJ.toast('บันทึกที่อยู่แล้ว');
      close();
    });
  }

  /* ---------- โค้ดส่วนลด ---------- */
  function openCodeSheet(shop) {
    const P = IJ.pricing(shop, S.cart.lines, S.checkout.speed, '');
    const rows = Object.entries(IJ.CODES).map(([k, c]) => {
      const r = IJ.codeCheck(k, P.sub, P.shipFull - P.shopShip, P.shopDisc);
      const on = S.checkout.code === k;
      return `<button type="button" class="code-opt${r.err ? ' no' : ''}${on ? ' on' : ''}" data-code="${k}"${r.err ? ' aria-disabled="true"' : ''}>
        <span class="code-l"><span class="mono">${k}</span></span>
        <span class="code-t"><b>${esc(c.t)}</b><small>${esc(c.d)}</small>${r.err ? `<small class="warn">${esc(r.err)}</small>` : `<small class="okc">ใช้ได้ · ลด ${baht(r.off || r.ship)}</small>`}</span>
        <span class="mark r${on ? ' checked' : ''}"></span>
      </button>`;
    }).join('');
    const { el, close } = IJ.openSheet(`
      <div class="sheet-body pad-x">
        <h2 class="sheet-h">โค้ดส่วนลด</h2>
        <form class="code-form" id="code-form" novalidate>
          <label class="sr" for="code-in">กรอกโค้ด</label>
          <input id="code-in" placeholder="กรอกโค้ด" autocomplete="off" autocapitalize="characters" maxlength="16">
          <button type="submit" class="btn primary">ใช้โค้ด</button>
        </form>
        <div class="code-list">${rows}</div>
        ${S.checkout.code ? '<button type="button" class="btn ghost full" id="code-off">ไม่ใช้โค้ด</button>' : ''}
      </div>`, { label: 'โค้ดส่วนลด' });
    const apply = (k) => {
      k = (k || '').trim().toUpperCase();
      if (!IJ.CODES[k]) { IJ.toast('ไม่พบโค้ดนี้'); return; }
      const r = IJ.codeCheck(k, P.sub, P.shipFull - P.shopShip, P.shopDisc);
      if (r.err) { IJ.toast(r.err); return; }
      S.checkout.code = k;
      IJ.save('checkout');
      close();
      IJ.rerender();
      IJ.toast(`ใช้โค้ด ${k} แล้ว`);
    };
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-code]'); if (b) apply(b.dataset.code); });
    $('#code-form', el).addEventListener('submit', (e) => { e.preventDefault(); apply($('#code-in', el).value); });
    const off = $('#code-off', el);
    if (off) off.addEventListener('click', () => { S.checkout.code = ''; IJ.save('checkout'); close(); IJ.rerender(); });
  }

  /* ---------- หน้าตะกร้า / ชำระเงิน ---------- */
  const PAYS = [
    ['wallet', 'wallet', 'อิ่มใจ Pay', () => `ยอดคงเหลือ ${baht(S.wallet)}`],
    ['cash', 'cash', 'เงินสด', () => 'จ่ายคนขับตอนรับอาหาร'],
    ['qr', 'qr', 'สแกนจ่าย QR', () => 'QR จำลอง ชำระสำเร็จอัตโนมัติ']
  ];

  function lineRow(l) {
    const it = IJ.item[l.iid];
    return `<div class="line" data-key="${esc(l.key)}">
      <span class="line-emo" style="${it ? IJ.shopVars(it.shop) : ''}">${l.e}</span>
      <button type="button" class="line-main" data-act="edit-line" data-key="${esc(l.key)}">
        <b>${esc(l.name)}</b>
        ${Object.keys(l.sel).length ? `<small>${esc(IJ.selText(l.sel))}</small>` : ''}
        ${l.note ? `<small class="note">“${esc(l.note)}”</small>` : ''}
        <span class="edit-hint">${icon('edit', 'sm')}แก้ไข</span>
      </button>
      <span class="line-side">
        <b>${baht(l.unit * l.qty)}</b>
        <span class="stepper sm">
          <button type="button" data-act="line-qty" data-key="${esc(l.key)}" data-d="-1" aria-label="ลดจำนวน">${l.qty === 1 ? icon('trash') : icon('minus')}</button>
          <output>${l.qty}</output>
          <button type="button" data-act="line-qty" data-key="${esc(l.key)}" data-d="1" aria-label="เพิ่มจำนวน">${icon('plus')}</button>
        </span>
      </span>
    </div>`;
  }

  function sumRow(label, val, cls = '') {
    return `<div class="sum-row ${cls}"><span>${label}</span><span>${val}</span></div>`;
  }

  function cartBody() {
    const shop = IJ.cartShop();
    if (!shop || !S.cart.lines.length) {
      return {
        html: `<div class="empty tall pad-x"><p class="big-emo">🧺</p><h2>ตะกร้ายังว่าง</h2><p class="sub">ท้องร้องแล้วก็ไปเลือกร้านกันเลย</p><a class="btn primary" href="#/" data-go="/">ไปเลือกร้าน</a></div>`,
        bar: ''
      };
    }
    const co = S.checkout;
    const P = IJ.pricing(shop, S.cart.lines, co.speed, co.code);
    const a = IJ.addr();
    const n = IJ.cartCount();
    const html = `
      <section class="card">
        <div class="card-h"><h2>ส่งที่</h2><button type="button" class="link-btn" data-act="pick-addr">เปลี่ยน</button></div>
        <div class="addr-show">${icon('pin')}<span><b>${esc(a.label)} · ${esc(a.line)}</b><small>${esc(a.sub)}</small></span></div>
        <label class="fld slim"><span class="sr">ฝากบอกคนขับ</span><input id="rider-note" maxlength="80" placeholder="ฝากบอกคนขับ เช่น โทรเรียกหน้าประตู" value="${esc(co.riderNote || a.note || '')}"></label>
      </section>

      <section class="card">
        <div class="card-h"><h2>รูปแบบการส่ง</h2></div>
        <div class="speed-list">${Object.entries(IJ.SPEEDS).map(([k, sp]) => {
          const fee = Math.max(0, shop.fee + sp.add);
          const eta = [Math.max(8, shop.t[0] + sp.dt), Math.max(15, shop.t[1] + sp.dt)];
          return `<label class="speed${co.speed === k ? ' on' : ''}">
            <input type="radio" name="speed" value="${k}"${co.speed === k ? ' checked' : ''}>
            <span class="mark r"></span>
            <span class="speed-t"><b>${sp.name}${k === 'fast' ? icon('bolt', 'sm') : k === 'eco' ? icon('leaf', 'sm') : ''}</b><small>${eta[0]}–${eta[1]} นาที · ${esc(sp.desc)}</small></span>
            <span class="speed-p">${baht(fee)}</span>
          </label>`;
        }).join('')}</div>
      </section>

      <section class="card">
        <div class="card-h"><h2>${esc(shop.name)}</h2><a class="link-btn" href="#/r/${shop.id}" data-go="/r/${shop.id}">${icon('plus', 'sm')}เพิ่มเมนู</a></div>
        <div class="lines">${S.cart.lines.map(lineRow).join('')}</div>
        ${P.shopNote ? `<a class="nudge" href="#/r/${shop.id}" data-go="/r/${shop.id}">${icon('tag', 'sm')}${esc(P.shopNote)}${icon('chev', 'sm')}</a>` : ''}
        <label class="toggle-row">
          <span>${icon('fork')}<span><b>ขอช้อนส้อมพลาสติก</b><small>ไม่รับก็ช่วยลดขยะ</small></span></span>
          <input type="checkbox" id="cutlery" class="switch"${co.cutlery ? ' checked' : ''}>
        </label>
      </section>

      <section class="card">
        <button type="button" class="row-btn" data-act="codes">
          <span class="row-ic">${icon('tag')}</span>
          <span class="row-t">${co.code ? `<b>โค้ด ${esc(co.code)}</b>${P.codeErr ? `<small class="warn">ยังใช้ไม่ได้: ${esc(P.codeErr)}</small>` : `<small class="okc">ลดไป ${baht(P.codeOff + P.codeShip)}</small>`}` : '<b>ใช้โค้ดส่วนลด</b><small>มีโค้ดให้เลือก ' + Object.keys(IJ.CODES).length + ' ใบ</small>'}</span>
          ${icon('chev')}
        </button>
      </section>

      <section class="card">
        <div class="card-h"><h2>ชำระเงินด้วย</h2></div>
        <div class="pay-list">${PAYS.map(([k, ic, name, sub]) => `
          <label class="pay${co.pay === k ? ' on' : ''}">
            <input type="radio" name="pay" value="${k}"${co.pay === k ? ' checked' : ''}>
            <span class="pay-ic">${icon(ic)}</span>
            <span class="pay-t"><b>${name}</b><small>${sub()}</small></span>
            <span class="mark r"></span>
          </label>`).join('')}</div>
      </section>

      <section class="card summary">
        <div class="card-h"><h2>สรุปคำสั่งซื้อ</h2></div>
        ${sumRow(`ค่าอาหาร (${n} รายการ)`, baht(P.sub))}
        ${sumRow('ค่าส่ง', P.shopShip ? `<s class="dim">${baht(P.shipFull)}</s> ฟรี` : baht(P.shipFull))}
        ${P.small ? sumRow('ค่าบริการออเดอร์ไม่ถึง ฿80', baht(P.small)) : ''}
        ${P.shopDisc ? sumRow('ส่วนลดจากร้าน', '−' + baht(P.shopDisc), 'save') : ''}
        ${P.codeOff ? sumRow(`โค้ด ${esc(co.code)}`, '−' + baht(P.codeOff), 'save') : ''}
        ${P.codeShip ? sumRow(`โค้ด ${esc(co.code)} (ค่าส่ง)`, '−' + baht(P.codeShip), 'save') : ''}
        ${sumRow('ยอดรวม', baht(P.total), 'total')}
        <p class="fine">แอปจำลอง ไม่มีการตัดเงินหรือส่งอาหารจริง</p>
      </section>`;
    const bar = `<div class="checkout-bar">
      <span class="cb-t"><small>ยอดรวม · ${P.eta[0]}–${P.eta[1]} นาที</small><b>${baht(P.total)}</b></span>
      <button type="button" class="btn primary" id="place" data-act="place">สั่งอาหาร</button>
    </div>`;
    return { html, bar };
  }

  IJ.views.cart = function () {
    const shop = IJ.cartShop();
    const body = cartBody();
    const html = `
      <header class="topbar">
        <button type="button" class="icon-btn" data-act="back" aria-label="ย้อนกลับ">${icon('back')}</button>
        <div class="tb-t"><b>ตะกร้าของฉัน</b>${shop ? `<small>${esc(shop.name)}</small>` : ''}</div>
        ${shop ? '<button type="button" class="link-btn" data-act="clear-cart">ล้างตะกร้า</button>' : '<span class="icon-btn"></span>'}
      </header>
      <div id="cart-root" class="cart-page">${body.html}</div>`;
    return {
      html, tab: null, dock: false, bar: body.bar,
      mount(root) {
        root.addEventListener('change', (e) => {
          const t = e.target;
          if (t.name === 'speed') { S.checkout.speed = t.value; IJ.save('checkout'); IJ.rerender(); }
          else if (t.name === 'pay') { S.checkout.pay = t.value; IJ.save('checkout'); IJ.rerender(); }
          else if (t.id === 'cutlery') { S.checkout.cutlery = t.checked; IJ.save('checkout'); }
        });
        root.addEventListener('input', (e) => { if (e.target.id === 'rider-note') { S.checkout.riderNote = e.target.value; IJ.save('checkout'); } });
      }
    };
  };

  IJ.afterCartChange = () => { if (IJ.curView === 'cart') IJ.rerender(); else IJ.refreshMenuBadges && IJ.refreshMenuBadges(); };
  IJ.act['line-qty'] = (el) => {
    const l = S.cart.lines.find((x) => x.key === el.dataset.key);
    if (!l) return;
    IJ.setLineQty(l.key, l.qty + +el.dataset.d);
    IJ.rerender();
  };
  IJ.act['edit-line'] = (el) => {
    const l = S.cart.lines.find((x) => x.key === el.dataset.key);
    const it = l && IJ.item[l.iid];
    if (it) IJ.openItem(it, l);
  };
  IJ.act.codes = () => { const s = IJ.cartShop(); if (s) openCodeSheet(s); };
  IJ.act['clear-cart'] = () => IJ.dialog({
    title: 'ล้างตะกร้าทั้งหมด?',
    text: 'รายการอาหารทั้งหมดในตะกร้าจะถูกลบ',
    actions: [{ label: 'ไม่ล้าง', kind: 'ghost' }, { label: 'ล้างตะกร้า', kind: 'danger', run: () => { IJ.clearCart(); IJ.rerender(); } }]
  });

  /* ---------- สร้างออเดอร์ ---------- */
  const RIDERS = ['พี่ต้น', 'พี่เอ็ม', 'พี่บอล', 'พี่นุ่น', 'พี่แจ็ค', 'พี่ฟ้า', 'พี่เก่ง', 'พี่ป๊อป', 'พี่หนึ่ง', 'พี่แบงค์', 'พี่ปาล์ม', 'พี่ออม'];
  const PLATE_L = 'กขคงจฉชซญฐณดตถทธนบปผพฟภมยรลวศสหฬอฮ';
  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
  const genRider = () => ({
    name: pickOne(RIDERS),
    plate: `${1 + Math.floor(Math.random() * 9)}${pickOne(PLATE_L)}${pickOne(PLATE_L)} ${1000 + Math.floor(Math.random() * 9000)}`,
    rt: (4.7 + Math.random() * 0.3).toFixed(1),
    trips: 800 + Math.floor(Math.random() * 9000),
    bike: pickOne(['มอเตอร์ไซค์สีแดง', 'มอเตอร์ไซค์สีดำ', 'สกู๊ตเตอร์สีขาว', 'มอเตอร์ไซค์สีน้ำเงิน'])
  });
  const genId = () => {
    const d = new Date();
    return `IJ${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}-${1000 + Math.floor(Math.random() * 9000)}`;
  };

  function createOrder(shop, P) {
    const co = S.checkout;
    const now = Date.now();
    const o = {
      id: genId(), rid: shop.id, rname: shop.name, lines: JSON.parse(JSON.stringify(S.cart.lines)),
      price: P, speed: co.speed, pay: co.pay, code: P.codeErr ? '' : co.code, cutlery: co.cutlery,
      addr: Object.assign({}, IJ.addr()), riderNote: (co.riderNote || IJ.addr().note || '').trim(),
      createdAt: now, simTotal: Math.round(((P.eta[0] + P.eta[1]) / 2) * 60),
      sim: { base: now, e0: 0, speed: IJ.store.get('simSpeed', 20) },
      rider: genRider(), route: shop.idx % 4, cancelled: false, rating: null, chat: []
    };
    if (co.pay === 'wallet') { S.wallet -= P.total; IJ.save('wallet'); }
    S.orders.push(o);
    if (S.orders.length > 60) S.orders = S.orders.slice(-60);
    IJ.save('orders');
    S.cart = { rid: null, lines: [] };
    S.checkout.code = '';
    S.checkout.riderNote = '';
    IJ.save('cart', 'checkout');
    IJ.fresh = o.id;
    IJ.go('/order/' + o.id, true);
  }

  function fakeQR(seed) {
    const N = 25, cells = [];
    let x = seed % 2147483647 || 7;
    const rnd = () => (x = (x * 48271) % 2147483647) / 2147483647;
    const finder = (r, c) => {
      for (const [fr, fc] of [[0, 0], [0, N - 7], [N - 7, 0]]) {
        const dr = r - fr, dc = c - fc;
        if (dr >= 0 && dr < 7 && dc >= 0 && dc < 7) return dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) ? 1 : 0;
        if (dr >= -1 && dr <= 7 && dc >= -1 && dc <= 7) return 0;
      }
      return -1;
    };
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const f = finder(r, c);
      if (f === 1 || (f === -1 && rnd() > 0.52)) cells.push(`<rect x="${c}" y="${r}" width="1.02" height="1.02"/>`);
    }
    return `<svg viewBox="-2 -2 ${N + 4} ${N + 4}" class="qr" role="img" aria-label="QR จำลอง"><rect x="-2" y="-2" width="${N + 4}" height="${N + 4}" class="qr-bg"/><g class="qr-fg">${cells.join('')}</g></svg>`;
  }

  IJ.act.place = (btn) => {
    const shop = IJ.cartShop();
    if (!shop || !S.cart.lines.length) return;
    const P = IJ.pricing(shop, S.cart.lines, S.checkout.speed, S.checkout.code);
    if (S.checkout.pay === 'wallet' && S.wallet < P.total) {
      IJ.dialog({
        title: 'ยอดใน อิ่มใจ Pay ไม่พอ',
        text: `ต้องใช้ ${baht(P.total)} แต่มีอยู่ ${baht(S.wallet)} เติมเงินจำลองได้ทันที`,
        actions: [
          { label: 'จ่ายเงินสดแทน', kind: 'ghost', run: () => { S.checkout.pay = 'cash'; IJ.save('checkout'); IJ.rerender(); } },
          { label: 'เติม ฿1,000', kind: 'primary', run: () => { S.wallet += 1000; IJ.save('wallet'); IJ.rerender(); IJ.toast('เติมเงินจำลอง ฿1,000 แล้ว'); } }
        ]
      });
      return;
    }
    if (S.checkout.pay === 'qr') {
      const { el, close } = IJ.openSheet(`
        <div class="sheet-body pad-x qr-body">
          <h2 class="sheet-h">สแกนเพื่อชำระเงิน</h2>
          <p class="qr-amt">${baht(P.total)}</p>
          <div class="qr-wrap">${fakeQR(Date.now())}</div>
          <p class="sub" id="qr-status">QR จำลอง สแกนจริงไม่ได้ · ระบบจะยืนยันให้ใน <b id="qr-s">4</b> วินาที</p>
          <button type="button" class="btn ghost full" data-close>ยกเลิก</button>
        </div>`, { label: 'ชำระด้วย QR' });
      let s = 4;
      const t = setInterval(() => {
        s -= 1;
        const sEl = $('#qr-s', el);
        if (!sEl) { clearInterval(t); return; }
        if (s > 0) { sEl.textContent = s; return; }
        clearInterval(t);
        $('#qr-status', el).innerHTML = `<span class="okc">${icon('check')}ชำระเงินสำเร็จ</span>`;
        setTimeout(() => { close(); createOrder(shop, P); }, 700);
      }, 1000);
      return;
    }
    btn.disabled = true;
    btn.innerHTML = '<span class="spin" aria-hidden="true"></span>กำลังส่งออเดอร์';
    setTimeout(() => createOrder(shop, P), 900);
  };
})();
