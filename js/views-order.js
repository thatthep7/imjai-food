/* อิ่มใจ — ติดตามออเดอร์, ประวัติออเดอร์, หน้าฉัน */
(function () {
  'use strict';
  const IJ = window.IJ, S = IJ.S, esc = IJ.esc, baht = IJ.baht, $ = IJ.$, $$ = IJ.$$, icon = IJ.icon;

  /* ---------- แผนที่จำลอง ---------- */
  const XS = [-20, 40, 130, 230, 320, 380], YS = [-20, 30, 110, 190, 240];
  const HOME = [300, 190];
  const ROUTES = [
    { pick: [[320, 30], [40, 30]], drop: [[40, 30], [40, 110], [230, 110], [230, 190], [300, 190]] },
    { pick: [[40, 110], [130, 110], [130, 30]], drop: [[130, 30], [130, 110], [320, 110], [320, 190], [300, 190]] },
    { pick: [[320, 30], [320, 110], [40, 110], [40, 190]], drop: [[40, 190], [300, 190]] },
    { pick: [[40, 30], [230, 30]], drop: [[230, 30], [230, 110], [320, 110], [320, 190], [300, 190]] }
  ];
  const pts = (a) => a.map((p) => p.join(',')).join(' ');
  function along(a, t) {
    const seg = [];
    let total = 0;
    for (let i = 1; i < a.length; i++) { const d = Math.hypot(a[i][0] - a[i - 1][0], a[i][1] - a[i - 1][1]); seg.push(d); total += d; }
    let rem = Math.max(0, Math.min(1, t)) * total;
    for (let i = 0; i < seg.length; i++) {
      if (rem <= seg[i] || i === seg.length - 1) {
        const k = seg[i] ? Math.min(1, rem / seg[i]) : 0;
        return [a[i][0] + (a[i + 1][0] - a[i][0]) * k, a[i][1] + (a[i + 1][1] - a[i][1]) * k];
      }
      rem -= seg[i];
    }
    return a[a.length - 1];
  }

  function mapSVG(o) {
    const r = ROUTES[o.route % ROUTES.length];
    const shopPt = r.drop[0];
    const shop = IJ.shop[o.rid];
    let blocks = '';
    for (let i = 0; i < XS.length - 1; i++) for (let j = 0; j < YS.length - 1; j++) {
      const x = XS[i] + 9, y = YS[j] + 9, w = XS[i + 1] - XS[i] - 18, h = YS[j + 1] - YS[j] - 18;
      const cls = i === 3 && j === 1 ? 'park' : i === 2 && j === 2 ? 'water' : 'blk';
      blocks += `<rect class="m-${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="7"/>`;
    }
    const roads = [30, 110, 190].map((y) => `<line x1="-10" y1="${y}" x2="370" y2="${y}"/>`).join('') + [40, 130, 230, 320].map((x) => `<line x1="${x}" y1="-10" x2="${x}" y2="230"/>`).join('');
    return `<svg class="map" viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" role="img" aria-label="แผนที่จำลองเส้นทางคนขับ">
      <rect class="m-bg" x="0" y="0" width="360" height="220"/>
      ${blocks}
      <text class="m-label" x="275" y="72" text-anchor="middle">สวนอิ่มท้อง</text>
      <text class="m-label" x="180" y="152" text-anchor="middle">บึงน้ำหวาน</text>
      <g class="m-road">${roads}</g>
      <polyline id="m-pick" class="m-route pick" points="${pts(r.pick)}"/>
      <polyline id="m-drop" class="m-route drop" points="${pts(r.drop)}"/>
      <g class="m-pin shop" transform="translate(${shopPt[0]},${shopPt[1]})"><circle r="15"/><text y="5.5" text-anchor="middle">${shop ? shop.e : '🍽️'}</text></g>
      <g class="m-pin home" transform="translate(${HOME[0]},${HOME[1]})"><circle r="15"/><text y="5.5" text-anchor="middle">🏠</text></g>
      <g id="m-rider" class="m-rider" style="transform:translate(${r.pick[0][0]}px,${r.pick[0][1]}px);opacity:0"><circle class="ring" r="16"/><circle r="14"/><text y="5" text-anchor="middle">🛵</text></g>
    </svg>`;
  }

  /* ---------- หน้าติดตามออเดอร์ ---------- */
  const riderAssigned = (st) => st.stage >= 2 || (st.stage === 1 && st.frac > 0.3);

  function orderLines(o) {
    const P = o.price;
    const row = (l, v, cls = '') => `<div class="sum-row ${cls}"><span>${l}</span><span>${v}</span></div>`;
    return `${o.lines.map((l) => `<div class="oline"><span class="oq">${l.qty}×</span><span class="ot"><b>${esc(l.name)}</b>${Object.keys(l.sel).length ? `<small>${esc(IJ.selText(l.sel))}</small>` : ''}${l.note ? `<small class="note">“${esc(l.note)}”</small>` : ''}</span><span class="op">${baht(l.unit * l.qty)}</span></div>`).join('')}
      <div class="sum">
        ${row('ค่าอาหาร', baht(P.sub))}
        ${row('ค่าส่ง (' + IJ.SPEEDS[o.speed].name + ')', P.shopShip ? 'ฟรี' : baht(P.shipFull))}
        ${P.small ? row('ค่าบริการออเดอร์เล็ก', baht(P.small)) : ''}
        ${P.shopDisc ? row('ส่วนลดจากร้าน', '−' + baht(P.shopDisc), 'save') : ''}
        ${P.codeOff || P.codeShip ? row('โค้ด ' + esc(o.code), '−' + baht(P.codeOff + P.codeShip), 'save') : ''}
        ${row('ยอดรวม', baht(P.total), 'total')}
        ${row('ชำระด้วย', { wallet: 'อิ่มใจ Pay', cash: 'เงินสด (จ่ายคนขับ)', qr: 'สแกนจ่าย QR' }[o.pay])}
      </div>`;
  }

  function ratingCard(o) {
    if (o.cancelled) return '';
    if (o.rating) {
      return `<section class="card rated"><div class="card-h"><h2>ขอบคุณที่ให้คะแนน</h2></div>
        <p class="sub">อาหาร ${'★'.repeat(o.rating.food)}${'☆'.repeat(5 - o.rating.food)} · คนขับ ${'★'.repeat(o.rating.rider)}${'☆'.repeat(5 - o.rating.rider)}${o.rating.tip ? ` · ทิป ${baht(o.rating.tip)}` : ''}</p></section>`;
    }
    const stars = (k) => `<div class="stars" data-k="${k}" role="radiogroup">${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" aria-checked="false" aria-label="${n} ดาว" data-n="${n}">${IJ.starIcon()}</button>`).join('')}</div>`;
    return `<section class="card rate" id="rate">
      <div class="card-h"><h2>อร่อยไหม ให้คะแนนหน่อย</h2></div>
      <div class="rate-row"><span>อาหารจาก ${esc(o.rname)}</span>${stars('food')}</div>
      <div class="rate-row"><span>คนขับ ${esc(o.rider.name)}</span>${stars('rider')}</div>
      <div class="rate-row col"><span>ทิปคนขับ (ตัดจาก อิ่มใจ Pay)</span><div class="tips">${[0, 10, 20, 50].map((t, i) => `<button type="button" class="chip" data-tip="${t}" aria-pressed="${i === 0}">${t ? baht(t) : 'ไม่ทิป'}</button>`).join('')}</div></div>
      <button type="button" class="btn primary full" id="rate-send" disabled>ส่งคะแนน</button>
    </section>`;
  }

  IJ.views.order = function (id) {
    const o = S.orders.find((x) => x.id === id);
    if (!o) return IJ.views.notfound('ไม่พบออเดอร์นี้');
    const shop = IJ.shop[o.rid];
    const st0 = IJ.orderState(o);
    const done = st0.stage >= 4, cancelled = o.cancelled;
    const html = `
      <header class="topbar">
        <button type="button" class="icon-btn" data-act="to-orders" aria-label="ไปที่ออเดอร์ของฉัน">${icon('back')}</button>
        <div class="tb-t"><b>ออเดอร์ ${esc(o.id)}</b><small>${esc(o.rname)} · ${IJ.date(o.createdAt)} ${IJ.time(o.createdAt)}</small></div>
        <span class="icon-btn"></span>
      </header>
      <div class="order-page${cancelled ? ' is-cancelled' : ''}${done ? ' is-done' : ''}" style="${shop ? IJ.shopVars(shop) : ''}">
        ${cancelled ? `
          <section class="status-card pad-x cancelled"><p class="big-emo">🙅</p><h1>ยกเลิกออเดอร์แล้ว</h1><p class="sub">${o.pay === 'wallet' ? `คืนเงิน ${baht(o.price.total)} เข้า อิ่มใจ Pay แล้ว` : 'ไม่มีการเรียกเก็บเงิน'}</p></section>` : `
          <div class="map-wrap">${mapSVG(o)}</div>
          <section class="status-card pad-x" aria-live="polite">
            <p class="eta" id="o-eta"></p>
            <h1 id="o-title"></h1>
            <p class="sub" id="o-desc"></p>
            <ol class="steps" id="o-steps">${IJ.STAGES.slice(0, 4).map((s, i) => `<li data-i="${i}"><span class="st-dot"></span><span class="st-t">${['รับออเดอร์', 'ทำอาหาร', 'ไปรับอาหาร', 'กำลังมาส่ง'][i]}</span></li>`).join('')}</ol>
            <div class="sim-ctl" id="sim-ctl"${done ? ' hidden' : ''}>
              <span class="sim-l">${icon('clock', 'sm')}เวลาจำลอง</span>
              <div class="seg" role="radiogroup" aria-label="ความเร็วเวลาจำลอง">${IJ.SIM_SPEEDS.map((sp) => `<button type="button" role="radio" data-speed="${sp.v}" aria-checked="${o.sim.speed === sp.v}" title="${sp.hint}">${sp.name}</button>`).join('')}</div>
              <button type="button" class="link-btn" id="skip">ข้ามขั้น${icon('chev', 'sm')}</button>
            </div>
          </section>
          <section class="card rider-card" id="o-rider" hidden>
            <span class="rider-av">🛵</span>
            <span class="rider-t"><b>${esc(o.rider.name)}</b><small>${IJ.starIcon()}${o.rider.rt} · ${o.rider.trips.toLocaleString('en-US')} เที่ยว</small><small>${esc(o.rider.bike)} · <span class="plate">${esc(o.rider.plate)}</span></small></span>
            <span class="rider-act">
              <button type="button" class="round soft" data-act="chat" data-oid="${o.id}" aria-label="แชทกับคนขับ">${icon('chat')}</button>
              <button type="button" class="round soft" data-act="call" aria-label="โทรหาคนขับ">${icon('phone')}</button>
            </span>
          </section>
          ${done ? ratingCard(o) : ''}`}
        <section class="card">
          <div class="card-h"><h2>ส่งที่</h2></div>
          <div class="addr-show">${icon('pin')}<span><b>${esc(o.addr.label)} · ${esc(o.addr.line)}</b><small>${esc(o.addr.sub)}</small>${o.riderNote ? `<small class="note">ฝากบอกคนขับ: ${esc(o.riderNote)}</small>` : ''}</span></div>
        </section>
        <section class="card">
          <div class="card-h"><h2>${esc(o.rname)}</h2>${shop ? `<a class="link-btn" href="#/r/${shop.id}" data-go="/r/${shop.id}">ดูร้าน</a>` : ''}</div>
          ${orderLines(o)}
        </section>
        <div class="pad-x order-actions" id="o-actions">
          ${!cancelled ? `<button type="button" class="btn ghost full" id="o-cancel" data-act="cancel-order" data-oid="${o.id}" hidden>ยกเลิกออเดอร์</button>` : ''}
          ${(done || cancelled) && shop ? `<button type="button" class="btn primary full" data-act="reorder" data-oid="${o.id}">สั่งอีกครั้ง</button>` : ''}
        </div>
      </div>`;

    return {
      html, tab: null, dock: false,
      mount(root) {
        if (cancelled) return;
        let lastStage = st0.stage;
        const r = ROUTES[o.route % ROUTES.length];
        const tick = () => {
          const st = IJ.orderState(o);
          if (st.stage >= 4 && lastStage < 4) {
            lastStage = 4;
            IJ.rerender();
            celebrate(o);
            return;
          }
          lastStage = st.stage;
          const S0 = IJ.STAGES[Math.min(st.stage, 4)];
          const mins = Math.max(1, Math.ceil(st.remain / 60));
          $('#o-eta', root).textContent = st.stage >= 4 ? `ส่งถึงเมื่อ ${IJ.time(o.doneAt || Date.now())}` : `อีกประมาณ ${mins} นาที`;
          $('#o-title', root).textContent = S0.t;
          let desc = S0.d;
          if (st.stage === 1) desc = riderAssigned(st) ? `ได้คนขับแล้ว ${o.rider.name} กำลังเตรียมตัวไปที่ร้าน` : 'กำลังหาคนขับที่อยู่ใกล้ร้าน';
          if (st.stage === 2) desc = `${o.rider.name} กำลังไปที่ ${o.rname}`;
          if (st.stage === 3) desc = `${o.rider.name} รับอาหารแล้ว ${st.frac > 0.75 ? 'ใกล้ถึงแล้ว เตรียมลงไปรับได้เลย' : 'กำลังขับไปหาคุณ'}`;
          $('#o-desc', root).textContent = desc;
          $$('#o-steps li', root).forEach((li, i) => {
            li.className = i < st.stage ? 'done' : i === st.stage ? 'now' : '';
            li.style.setProperty('--p', i < st.stage ? 1 : i === st.stage ? st.frac.toFixed(3) : 0);
          });
          $('#o-rider', root).hidden = !riderAssigned(st);
          const cancel = $('#o-cancel', root);
          if (cancel) cancel.hidden = st.stage !== 0;
          // คนขับบนแผนที่
          const rider = $('#m-rider', root);
          let p = r.pick[0];
          if (st.stage === 2) p = along(r.pick, st.frac);
          else if (st.stage === 3) p = along(r.drop, st.frac);
          else if (st.stage >= 4) p = HOME;
          rider.style.transform = `translate(${p[0].toFixed(1)}px,${p[1].toFixed(1)}px)`;
          rider.style.opacity = riderAssigned(st) ? 1 : 0;
          $('#m-pick', root).classList.toggle('on', st.stage === 2 || (st.stage === 1 && riderAssigned(st)));
          $('#m-drop', root).classList.toggle('on', st.stage >= 3);
        };
        tick();
        IJ.onTick(tick);

        const ctl = $('#sim-ctl', root);
        if (ctl) {
          ctl.addEventListener('click', (e) => {
            const b = e.target.closest('[data-speed]');
            if (b) {
              const v = +b.dataset.speed;
              IJ.setSimSpeed(o, v);
              IJ.store.set('simSpeed', v);
              $$('[data-speed]', ctl).forEach((x) => x.setAttribute('aria-checked', x === b));
              IJ.toast(v === 1 ? 'ใช้เวลาจริงแล้ว รอตาม ETA ของร้าน' : `เร่งเวลา ×${v}`);
              return;
            }
            if (e.target.closest('#skip')) { IJ.skipStage(o); tick(); }
          });
        }
        if (done) bindRating(root, o);
        if (IJ.fresh === o.id) {
          IJ.fresh = null;
          IJ.toast('ส่งออเดอร์แล้ว รอร้านกดรับสักครู่');
        }
      }
    };
  };

  function bindRating(root, o) {
    const card = $('#rate', root);
    if (!card) return;
    const val = { food: 0, rider: 0, tip: 0 };
    card.addEventListener('click', (e) => {
      const s = e.target.closest('.stars [data-n]');
      if (s) {
        const box = s.closest('.stars');
        const n = +s.dataset.n;
        val[box.dataset.k] = n;
        $$('[data-n]', box).forEach((b) => { b.classList.toggle('on', +b.dataset.n <= n); b.setAttribute('aria-checked', +b.dataset.n === n); });
      }
      const t = e.target.closest('[data-tip]');
      if (t) { val.tip = +t.dataset.tip; $$('[data-tip]', card).forEach((b) => b.setAttribute('aria-pressed', b === t)); }
      $('#rate-send', card).disabled = !(val.food && val.rider);
    });
    $('#rate-send', card).addEventListener('click', () => {
      if (val.tip && S.wallet < val.tip) { IJ.toast('ยอด อิ่มใจ Pay ไม่พอสำหรับทิป'); return; }
      if (val.tip) { S.wallet -= val.tip; IJ.save('wallet'); }
      o.rating = Object.assign({}, val);
      IJ.save('orders');
      IJ.toast(val.tip ? `ขอบคุณ ${o.rider.name} ได้ทิป ${baht(val.tip)}` : 'ขอบคุณสำหรับคะแนน');
      IJ.rerender();
    });
  }

  const kcal = (lines) => lines.reduce((a, l) => a + Math.max(90, Math.min(1200, Math.round(l.unit * 3.4))) * l.qty, 0);

  function celebrate(o) {
    const emos = [...new Set(o.lines.map((l) => l.e))].concat(['🎉', '✨']);
    if (IJ.motion() !== 'auto') {
      const box = document.createElement('div');
      box.className = 'confetti';
      box.setAttribute('aria-hidden', 'true');
      box.innerHTML = Array.from({ length: 26 }, (_, i) => `<span style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 0.6).toFixed(2)}s;animation-duration:${(1.8 + Math.random() * 1.2).toFixed(2)}s">${emos[i % emos.length]}</span>`).join('');
      document.body.appendChild(box);
      setTimeout(() => box.remove(), 3600);
    }
    const { el, close } = IJ.openSheet(`
      <div class="sheet-body pad-x done-body">
        <p class="done-emo">${o.lines.slice(0, 3).map((l) => l.e).join('')}</p>
        <h2>อาหารมาถึงแล้ว</h2>
        <p class="sub">${esc(o.rider.name)} วาง${esc(o.rname)}ไว้ที่${esc(o.addr.label)}เรียบร้อย ขอให้อิ่มใจ (ท้องอาจยังว่างอยู่)</p>
        <div class="done-stats"><div><b>${o.lines.reduce((a, l) => a + l.qty, 0)}</b><small>รายการ</small></div><div><b>${baht(o.price.total)}</b><small>เงินจำลอง</small></div><div><b>~${kcal(o.lines).toLocaleString('en-US')}</b><small>kcal ที่ไม่ได้กินจริง</small></div></div>
        <div class="row gap"><button type="button" class="btn ghost grow" id="d-home">กลับหน้าแรก</button><button type="button" class="btn primary grow" id="d-rate">ให้คะแนน</button></div>
      </div>`, { label: 'ส่งถึงแล้ว' });
    $('#d-home', el).addEventListener('click', () => { close(); IJ.go('/'); });
    $('#d-rate', el).addEventListener('click', () => { close(); const r = $('#rate'); if (r) r.scrollIntoView({ behavior: IJ.motion(), block: 'center' }); });
  }

  IJ.act['to-orders'] = () => IJ.go('/orders', true);
  IJ.act.call = () => IJ.toast('แอปจำลอง โทรหาคนขับไม่ได้จริง ลองแชทแทนได้');
  IJ.act['cancel-order'] = (el) => {
    const o = S.orders.find((x) => x.id === el.dataset.oid);
    if (!o) return;
    IJ.dialog({
      title: 'ยกเลิกออเดอร์นี้?',
      text: 'ร้านยังไม่ได้กดรับ ยกเลิกได้โดยไม่เสียค่าใช้จ่าย',
      actions: [
        { label: 'ไม่ยกเลิก', kind: 'ghost' },
        { label: 'ยกเลิกออเดอร์', kind: 'danger', run: () => {
          if (IJ.orderState(o).stage !== 0) { IJ.toast('ร้านรับออเดอร์ไปแล้ว ยกเลิกไม่ได้'); return; }
          o.cancelled = true;
          o.cancelledAt = Date.now();
          if (o.pay === 'wallet') { S.wallet += o.price.total; IJ.save('wallet'); }
          IJ.save('orders');
          IJ.rerender();
          IJ.toast('ยกเลิกออเดอร์แล้ว');
        } }
      ]
    });
  };

  /* ---------- แชทกับคนขับ ---------- */
  const QUICK = ['ฝากวางไว้หน้าห้องได้เลยครับ', 'ขอช้อนเพิ่มด้วยนะครับ', 'ถึงแล้วโทรเรียกได้เลย', 'ไม่ต้องรีบครับ ขับปลอดภัยนะ', 'หิวมากเลย รีบ ๆ หน่อยนะ 🥺'];
  const REPLY = ['ได้เลยครับ 👍', 'รับทราบครับ', 'กำลังไปครับ อีกแป๊บเดียว', 'โอเคครับ เดี๋ยวจัดให้', 'ขับปลอดภัยแน่นอนครับ 🙏', 'ใกล้ถึงแล้วครับ'];
  IJ.act.chat = (el) => {
    const o = S.orders.find((x) => x.id === el.dataset.oid);
    if (!o) return;
    const bubbles = () => (o.chat.length ? o.chat : [{ me: false, t: `สวัสดีครับ ผม${o.rider.name} กำลังดูแลออเดอร์ของคุณครับ` }])
      .map((m) => `<p class="bub ${m.me ? 'me' : ''}">${esc(m.t)}</p>`).join('');
    const { el: sh } = IJ.openSheet(`
      <div class="chat-head pad-x"><span class="rider-av sm">🛵</span><b>${esc(o.rider.name)}</b><small class="plate">${esc(o.rider.plate)}</small></div>
      <div class="sheet-body chat-body pad-x" id="chat-log">${bubbles()}</div>
      <div class="chat-quick">${QUICK.map((q) => `<button type="button" class="chip" data-say="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <form class="chat-form pad-x" id="chat-form" novalidate><label class="sr" for="chat-in">ข้อความ</label><input id="chat-in" maxlength="120" placeholder="พิมพ์ข้อความ" autocomplete="off"><button type="submit" class="btn primary">ส่ง</button></form>`, { cls: 'chat-sheet', label: 'แชทกับคนขับ' });
    const log = $('#chat-log', sh);
    const paint = () => { log.innerHTML = bubbles(); log.scrollTop = log.scrollHeight; };
    const say = (t) => {
      t = t.trim();
      if (!t) return;
      o.chat.push({ me: true, t });
      IJ.save('orders');
      paint();
      const typing = document.createElement('p');
      typing.className = 'bub typing';
      typing.innerHTML = '<i></i><i></i><i></i>';
      setTimeout(() => { log.appendChild(typing); log.scrollTop = log.scrollHeight; }, 400);
      setTimeout(() => { o.chat.push({ me: false, t: REPLY[Math.floor(Math.random() * REPLY.length)] }); IJ.save('orders'); if (log.isConnected) paint(); }, 1500);
    };
    sh.addEventListener('click', (e) => { const q = e.target.closest('[data-say]'); if (q) say(q.dataset.say); });
    $('#chat-form', sh).addEventListener('submit', (e) => { e.preventDefault(); const i = $('#chat-in', sh); say(i.value); i.value = ''; });
    paint();
  };

  /* ---------- สั่งอีกครั้ง ---------- */
  IJ.act.reorder = (el) => {
    const o = S.orders.find((x) => x.id === el.dataset.oid);
    if (!o || !IJ.shop[o.rid]) return;
    const lines = o.lines.filter((l) => IJ.item[l.iid]).map((l) => Object.assign({}, l));
    const doIt = () => { S.cart = { rid: o.rid, lines }; IJ.save('cart'); IJ.refreshDock(); IJ.go('/cart'); };
    if (S.cart.lines.length) {
      IJ.dialog({
        title: 'แทนที่ตะกร้าปัจจุบัน?',
        text: 'ของในตะกร้าตอนนี้จะถูกแทนด้วยรายการจากออเดอร์เดิม',
        actions: [{ label: 'ไม่ใช่ตอนนี้', kind: 'ghost' }, { label: 'แทนที่', kind: 'primary', run: doIt }]
      });
    } else doIt();
  };

  /* ---------- รายการออเดอร์ ---------- */
  function orderCard(o) {
    const shop = IJ.shop[o.rid];
    const st = IJ.orderState(o);
    const live = !o.cancelled && st.stage < 4;
    const pill = o.cancelled ? '<span class="pill mute">ยกเลิก</span>' : live ? `<span class="pill live">${esc(IJ.STAGES[st.stage].t)}</span>` : '<span class="pill ok">ส่งถึงแล้ว</span>';
    return `<article class="ocard${live ? ' is-live' : ''}" style="${shop ? IJ.shopVars(shop) : ''}">
      <a class="ocard-main" href="#/order/${o.id}" data-go="/order/${o.id}">
        <span class="cover cover-xs"><span class="emo">${shop ? shop.e : '🍽️'}</span></span>
        <span class="ocard-t">
          <span class="ocard-top"><b>${esc(o.rname)}</b>${pill}</span>
          <small>${IJ.date(o.createdAt)} · ${IJ.time(o.createdAt)} · ${esc(o.id)}</small>
          <small class="ocard-items">${esc(o.lines.map((l) => `${l.qty}× ${l.name}`).join(', '))}</small>
        </span>
      </a>
      <div class="ocard-foot"><b>${baht(o.price.total)}</b>
        ${live ? `<a class="btn primary sm" href="#/order/${o.id}" data-go="/order/${o.id}">ติดตาม</a>` : shop ? `<button type="button" class="btn ghost sm" data-act="reorder" data-oid="${o.id}">สั่งอีกครั้ง</button>` : ''}
      </div>
    </article>`;
  }

  IJ.views.orders = function () {
    const all = S.orders.slice().reverse();
    const live = all.filter((o) => !o.cancelled && IJ.orderState(o).stage < 4);
    const past = all.filter((o) => !live.includes(o));
    const html = `
      <header class="page-h pad-x"><h1>ออเดอร์ของฉัน</h1></header>
      ${!all.length ? `<div class="empty tall pad-x"><p class="big-emo">🧾</p><h2>ยังไม่มีออเดอร์</h2><p class="sub">สั่งอะไรสักอย่างแล้วมาดูคนขับวิ่งบนแผนที่กัน</p><a class="btn primary" href="#/" data-go="/">เลือกร้าน</a></div>` : ''}
      ${live.length ? `<section class="blk"><div class="sec-h pad-x"><h2>กำลังมาส่ง</h2><span class="sec-note">${live.length} ออเดอร์</span></div><div class="olist pad-x">${live.map(orderCard).join('')}</div></section>` : ''}
      ${past.length ? `<section class="blk"><div class="sec-h pad-x"><h2>ประวัติ</h2><span class="sec-note">${past.length} ออเดอร์</span></div><div class="olist pad-x">${past.map(orderCard).join('')}</div></section>` : ''}`;
    return {
      html, tab: 'orders', dock: true,
      mount() {
        if (!live.length) return;
        IJ.onTick(() => { if (live.some((o) => IJ.orderState(o).stage >= 4)) IJ.rerender(); });
      }
    };
  };

  /* ---------- หน้าฉัน ---------- */
  IJ.views.me = function () {
    const ok = S.orders.filter((o) => !o.cancelled);
    const spent = ok.reduce((a, o) => a + o.price.total, 0);
    const cal = ok.reduce((a, o) => a + kcal(o.lines), 0);
    const freq = {};
    ok.forEach((o) => { freq[o.rid] = (freq[o.rid] || 0) + 1; });
    const topId = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
    const favs = S.favs.map((id) => IJ.shop[id]).filter(Boolean);
    const seg = (name, cur, opts) => `<div class="seg" role="radiogroup" data-set="${name}">${opts.map(([v, t]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${String(cur) === String(v)}">${t}</button>`).join('')}</div>`;
    const html = `
      <header class="me-head pad-x">
        <span class="avatar">😋</span>
        <span class="me-t"><h1>${esc(S.profile.name)}</h1><button type="button" class="link-btn" data-act="edit-name">${icon('edit', 'sm')}แก้ชื่อ</button></span>
      </header>
      <section class="card wallet-card">
        <span class="wc-t"><small>อิ่มใจ Pay · เงินจำลอง</small><b>${baht(S.wallet)}</b></span>
        <button type="button" class="btn primary sm" data-act="topup">${icon('plus', 'sm')}เติม ฿500</button>
      </section>
      <section class="card">
        <div class="card-h"><h2>สถิติความหิว</h2></div>
        <div class="stat-grid">
          <div><b>${ok.length}</b><small>ออเดอร์</small></div>
          <div><b>${baht(spent)}</b><small>เงินจำลองที่ใช้</small></div>
          <div><b>${cal.toLocaleString('en-US')}</b><small>kcal ที่ไม่ได้กิน (ประมาณ)</small></div>
          <div><b>${topId ? IJ.shop[topId].e : '—'}</b><small>${topId ? esc(IJ.shop[topId].name) : 'ยังไม่มีร้านประจำ'}</small></div>
        </div>
      </section>
      <section class="blk">
        <div class="sec-h pad-x"><h2>ร้านโปรด</h2><span class="sec-note">${favs.length} ร้าน</span></div>
        ${favs.length ? `<div class="shop-list">${favs.map(IJ.shopRow).join('')}</div>` : `<p class="sub pad-x">กดรูปหัวใจในหน้าร้านเพื่อเก็บไว้ที่นี่</p>`}
      </section>
      <section class="card settings">
        <div class="card-h"><h2>ตั้งค่า</h2></div>
        <button type="button" class="row-btn" data-act="pick-addr"><span class="row-ic">${icon('pin')}</span><span class="row-t"><b>ที่อยู่จัดส่ง</b><small>${esc(IJ.addr().label)} · ${S.addrs.length} ที่อยู่</small></span>${icon('chev')}</button>
        <div class="set-row"><span><b>ธีม</b><small>สีของแอป</small></span>${seg('theme', S.theme, [['system', 'ตามระบบ'], ['light', 'สว่าง'], ['dark', 'มืด']])}</div>
        <div class="set-row"><span><b>เวลาจำลองเริ่มต้น</b><small>ความเร็วคนขับในออเดอร์ใหม่</small></span>${seg('sim', IJ.store.get('simSpeed', 20), IJ.SIM_SPEEDS.map((s) => [s.v, s.name]))}</div>
        <button type="button" class="row-btn danger" data-act="reset-all"><span class="row-ic">${icon('trash')}</span><span class="row-t"><b>ล้างข้อมูลทั้งหมด</b><small>ออเดอร์ ตะกร้า ร้านโปรด และยอดเงินจำลอง</small></span></button>
      </section>
      <p class="foot-note pad-x">อิ่มใจ เวอร์ชัน 1.0 · แอปสั่งอาหารจำลองเพื่อความสนุก ไม่มีร้านจริง ไม่มีการส่งอาหาร และไม่มีการชำระเงินจริง ข้อมูลทั้งหมดเก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น</p>`;
    return {
      html, tab: 'me', dock: true,
      mount(root) {
        root.addEventListener('click', (e) => {
          const b = e.target.closest('.seg[data-set] [data-v]');
          if (!b) return;
          const set = b.closest('.seg').dataset.set;
          $$('[data-v]', b.closest('.seg')).forEach((x) => x.setAttribute('aria-checked', x === b));
          if (set === 'theme') { S.theme = b.dataset.v; IJ.save('theme'); IJ.applyTheme(); }
          if (set === 'sim') { IJ.store.set('simSpeed', +b.dataset.v); IJ.toast('ออเดอร์ใหม่จะใช้ความเร็วนี้'); }
        });
      }
    };
  };

  IJ.act.topup = () => { S.wallet += 500; IJ.save('wallet'); IJ.rerender(); IJ.toast('เติมเงินจำลอง ฿500 แล้ว'); };
  IJ.act['edit-name'] = () => {
    const { el, close } = IJ.openSheet(`
      <form class="sheet-body pad-x" id="name-form" novalidate>
        <h2 class="sheet-h">ให้เราเรียกคุณว่าอะไรดี</h2>
        <label class="fld"><span>ชื่อที่แสดง</span><input id="nm" maxlength="24" value="${esc(S.profile.name)}"></label>
        <button type="submit" class="btn primary full">บันทึก</button>
      </form>`, { label: 'แก้ชื่อ' });
    $('#name-form', el).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#nm', el).value.trim();
      if (!v) { IJ.toast('ใส่ชื่อก่อนนะ'); return; }
      S.profile.name = v;
      IJ.save('profile');
      close();
      IJ.rerender();
    });
  };
  IJ.act['reset-all'] = () => IJ.dialog({
    title: 'ล้างข้อมูลทั้งหมด?',
    text: 'ออเดอร์ ตะกร้า ร้านโปรด ที่อยู่ และยอดเงินจำลองจะกลับเป็นค่าเริ่มต้น',
    actions: [
      { label: 'ยกเลิก', kind: 'ghost' },
      { label: 'ล้างข้อมูล', kind: 'danger', run: () => {
        IJ.store.clearAll();
        IJ.loadState();
        IJ.applyTheme();
        IJ.homeState.cat = null;
        IJ.homeState.f = [];
        IJ.go('/', true);
        IJ.toast('ล้างข้อมูลแล้ว เริ่มหิวใหม่ได้เลย');
      } }
    ]
  });
})();
