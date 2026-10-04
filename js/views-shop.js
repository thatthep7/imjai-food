/* อิ่มใจ — หน้าแรก, ค้นหา, หน้าร้าน, หน้าต่างเลือกเมนู, สุ่มเมนู */
(function () {
  'use strict';
  const IJ = window.IJ, S = IJ.S, esc = IJ.esc, baht = IJ.baht, $ = IJ.$, $$ = IJ.$$, icon = IJ.icon;
  IJ.views = IJ.views || {};
  IJ.act = IJ.act || {};

  /* ---------- ชิ้นส่วนที่ใช้ซ้ำ ---------- */
  const meta = (s) => `<span class="rt">${IJ.starIcon()}${s.rt.toFixed(1)}</span><span class="dim">(${IJ.kfmt(s.rv)})</span><span class="dot"></span>${s.km.toFixed(1)} กม.<span class="dot"></span>${s.t[0]}–${s.t[1]} นาที`;
  const lvl = (n) => `<span class="lv">${'฿'.repeat(n)}<span class="dim">${'฿'.repeat(3 - n)}</span></span>`;
  const promoPill = (s) => (s.p ? `<span class="pill promo">${icon('tag')}${esc(IJ.promoText(s.p))}</span>` : '');

  IJ.shopRow = (s) => `
    <a class="shop-row" href="#/r/${s.id}" data-go="/r/${s.id}" style="${IJ.shopVars(s)}">
      <div class="cover cover-sm"><span class="emo">${s.e}</span></div>
      <div class="shop-info">
        <h3>${esc(s.name)}</h3>
        <p class="sub">${esc(s.tag)}</p>
        <p class="meta">${meta(s)}</p>
        <p class="meta2"><span>ค่าส่ง ${baht(s.fee)}</span>${promoPill(s)}</p>
      </div>
    </a>`;

  const featCard = (s) => `
    <a class="feat" href="#/r/${s.id}" data-go="/r/${s.id}" style="${IJ.shopVars(s)}">
      <div class="cover cover-lg"><span class="emo">${s.e}</span>${s.p ? `<span class="ribbon">${esc(s.p.k === 'ship' ? 'ส่งฟรี' : s.p.k === 'off' ? 'ลด ' + baht(s.p.amt) : 'ลด ' + s.p.pct + '%')}</span>` : ''}</div>
      <h3>${esc(s.name)}</h3>
      <p class="meta">${meta(s)}</p>
    </a>`;

  /* ---------- หน้าแรก ---------- */
  const home = (IJ.homeState = IJ.homeState || { cat: null, f: [], sort: 'rec' });
  const FILTERS = [
    ['promo', 'มีโปร', (s) => !!s.p],
    ['top', 'เรตติ้ง 4.8+', (s) => s.rt >= 4.8],
    ['near', 'ใกล้ฉัน < 2 กม.', (s) => s.km < 2],
    ['fast', 'ส่งไว ≤ 25 นาที', (s) => s.t[1] <= 25],
    ['cheap', 'ราคาประหยัด', (s) => s.lv === 1]
  ];
  const SORTS = [['rec', 'แนะนำ'], ['near', 'ใกล้สุด'], ['rating', 'เรตติ้งสูงสุด'], ['fast', 'ส่งเร็วสุด']];
  const score = (s) => s.rt * 10 + Math.log10(s.rv) * 2 - s.km * 0.6;

  function filteredShops() {
    let list = IJ.SHOPS.filter((s) => (!home.cat || s.cat === home.cat) && home.f.every((k) => FILTERS.find((f) => f[0] === k)[2](s)));
    const by = {
      rec: (a, b) => score(b) - score(a),
      near: (a, b) => a.km - b.km,
      rating: (a, b) => b.rt - a.rt || b.rv - a.rv,
      fast: (a, b) => a.t[0] - b.t[0] || a.t[1] - b.t[1]
    }[home.sort];
    return list.slice().sort(by);
  }

  function renderShopList(root) {
    const list = filteredShops();
    const cat = home.cat ? IJ.cat[home.cat] : null;
    $('#all-count', root).textContent = `${list.length} ร้าน${cat ? ' · ' + cat.name : ''}`;
    $('#shop-list', root).innerHTML = list.length
      ? list.map(IJ.shopRow).join('')
      : `<div class="empty"><p class="big-emo">🥲</p><p>ไม่มีร้านที่ตรงกับตัวกรองนี้</p><button type="button" class="btn ghost sm" data-act="clear-filters">ล้างตัวกรอง</button></div>`;
    $$('.chip[data-f]', root).forEach((c) => c.setAttribute('aria-pressed', home.f.includes(c.dataset.f)));
    $$('.cat[data-cat]', root).forEach((c) => c.setAttribute('aria-pressed', c.dataset.cat === home.cat));
    $('#sort', root).value = home.sort;
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 5 || h >= 22) return ['ดึกป่านนี้', 'หิวอะไรดี?'];
    if (h < 11) return ['อรุณสวัสดิ์', 'เช้านี้กินอะไรดี?'];
    if (h < 14) return ['เที่ยงแล้ว', 'หิวอะไรดี?'];
    if (h < 17) return ['บ่ายนี้', 'หาอะไรรองท้องดี?'];
    return ['มื้อเย็นวันนี้', 'อยากกินอะไร?'];
  }

  function promoCards() {
    const order = IJ.isNight() ? ['NIGHTOWL', 'SONGFREE', 'FIRSTBITE', 'IMJAI50'] : ['FIRSTBITE', 'SONGFREE', 'IMJAI50', 'NIGHTOWL'];
    const tone = { NIGHTOWL: 'indigo', SONGFREE: 'pandan', FIRSTBITE: 'chili', IMJAI50: 'gold' };
    return order
      .map((k) => {
        const c = IJ.CODES[k];
        const got = S.checkout.code === k;
        return `<button type="button" class="promo-card tone-${tone[k]}" data-act="grab-code" data-code="${k}">
          <span class="pc-t">${esc(c.t)}</span>
          <span class="pc-d">${esc(c.d)}</span>
          <span class="pc-code"><span class="mono">${k}</span><span class="pc-cta">${got ? icon('check') + 'เก็บแล้ว' : 'แตะเพื่อเก็บโค้ด'}</span></span>
        </button>`;
      })
      .join('');
  }

  function liveBanner() {
    const act = IJ.activeOrders();
    if (!act.length) return '';
    const o = act[act.length - 1];
    return `<a class="live pad-x" href="#/order/${o.id}" data-go="/order/${o.id}" id="live-banner" data-oid="${o.id}">
      <span class="live-emo">${IJ.shop[o.rid] ? IJ.shop[o.rid].e : '🛵'}</span>
      <span class="live-txt"><b class="live-t"></b><small class="live-s"></small></span>
      <span class="live-bar"><i></i></span>
      ${icon('chev')}
    </a>`;
  }
  function tickLive() {
    const el = $('#live-banner');
    if (!el) return;
    const o = S.orders.find((x) => x.id === el.dataset.oid);
    if (!o) return;
    const st = IJ.orderState(o);
    if (st.stage >= 4) { el.remove(); return; }
    $('.live-t', el).textContent = IJ.STAGES[st.stage].t;
    $('.live-s', el).textContent = `${o.rname} · อีกประมาณ ${Math.max(1, Math.ceil(st.remain / 60))} นาที`;
    $('.live-bar i', el).style.width = Math.round(st.overall * 100) + '%';
  }

  function reorderRow() {
    const seen = new Set();
    const past = S.orders.slice().reverse().filter((o) => !o.cancelled && IJ.shop[o.rid] && !seen.has(o.rid) && seen.add(o.rid)).slice(0, 6);
    if (!past.length) return '';
    return `<section class="blk">
      <div class="sec-h pad-x"><h2>สั่งอีกครั้ง</h2></div>
      <div class="hscroll pad-x">${past
        .map((o) => {
          const s = IJ.shop[o.rid];
          return `<button type="button" class="again" data-act="reorder" data-oid="${o.id}" style="${IJ.shopVars(s)}">
            <span class="cover cover-xs"><span class="emo">${s.e}</span></span>
            <span class="again-t"><b>${esc(s.name)}</b><small>${esc(o.lines.map((l) => l.name).join(', '))}</small></span>
          </button>`;
        })
        .join('')}</div>
    </section>`;
  }

  IJ.views.home = function () {
    const a = IJ.addr();
    const [g1, g2] = greeting();
    const featured = IJ.SHOPS.slice().sort((x, y) => score(y) - score(x)).slice(0, 7);
    const html = `
      <header class="home-top pad-x">
        <button type="button" class="addr-btn" data-act="pick-addr">
          <span class="addr-ic">${icon('pin')}</span>
          <span class="addr-txt"><small>ส่งที่ · ${esc(a.label)}</small><b>${esc(a.line)}</b></span>
          ${icon('down', 'sm')}
        </button>
        <a class="wallet-chip" href="#/me" data-go="/me">${icon('wallet')}<span>${baht(S.wallet)}</span></a>
      </header>
      <section class="hello pad-x">
        <h1><span>${g1}</span> ${g2}</h1>
        <a class="searchbar" href="#/search" data-go="/search">${icon('search')}<span>ค้นหาร้านหรือเมนู เช่น กะเพรา ชานม</span></a>
      </section>
      ${liveBanner()}
      <section class="blk" aria-label="โค้ดส่วนลด">
        <div class="hscroll snap pad-x" id="promo-row">${promoCards()}</div>
      </section>
      <section class="blk" aria-label="หมวดอาหาร">
        <div class="cats pad-x">${IJ.CATS.map((c) => `<button type="button" class="cat" data-cat="${c.id}" aria-pressed="false"><span class="cat-ic">${c.e}</span><span class="cat-t">${esc(c.name)}</span></button>`).join('')}</div>
      </section>
      ${reorderRow()}
      <section class="blk">
        <div class="sec-h pad-x"><h2>ร้านเด็ดใกล้คุณ</h2><span class="sec-note">คะแนนรีวิวสูง ส่งไว</span></div>
        <div class="hscroll pad-x">${featured.map(featCard).join('')}</div>
      </section>
      <section class="blk pad-x">
        <button type="button" class="rand-card" data-act="random">
          <span class="rand-dice">${icon('dice')}</span>
          <span class="rand-t"><b>คิดไม่ออกว่าจะกินอะไร</b><small>ให้อิ่มใจสุ่มเมนูจาก ${IJ.SHOPS.reduce((a, s) => a + s.items.length, 0)} รายการให้เลย</small></span>
          ${icon('chev')}
        </button>
      </section>
      <section class="blk" id="all">
        <div class="sec-h pad-x"><h2>ร้านทั้งหมด</h2><span class="sec-note" id="all-count"></span></div>
        <div class="filters pad-x">
          <label class="sort-sel">${icon('down', 'sm')}<span class="sr">เรียงตาม</span>
            <select id="sort" aria-label="เรียงตาม">${SORTS.map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select>
          </label>
          ${FILTERS.map(([k, t]) => `<button type="button" class="chip" data-f="${k}" aria-pressed="false">${t}</button>`).join('')}
        </div>
        <div class="shop-list" id="shop-list"></div>
      </section>
      <p class="foot-note pad-x">อิ่มใจเป็นแอปจำลอง ร้าน เมนู คนขับ และการชำระเงินทั้งหมดสมมติขึ้น ไม่มีการสั่งอาหารจริง</p>`;

    return {
      html, tab: 'home', dock: true,
      mount(root) {
        renderShopList(root);
        tickLive();
        IJ.onTick(tickLive);
        $('#sort', root).addEventListener('change', (e) => { home.sort = e.target.value; renderShopList(root); });
        root.addEventListener('click', (e) => {
          const f = e.target.closest('.chip[data-f]');
          if (f) {
            const k = f.dataset.f;
            home.f = home.f.includes(k) ? home.f.filter((x) => x !== k) : home.f.concat(k);
            renderShopList(root);
            return;
          }
          const c = e.target.closest('.cat[data-cat]');
          if (c) {
            home.cat = home.cat === c.dataset.cat ? null : c.dataset.cat;
            renderShopList(root);
            if (home.cat) {
              const y = $('#all', root).getBoundingClientRect().top + window.scrollY - 8;
              window.scrollTo({ top: y, behavior: IJ.motion() });
            }
          }
        });
      }
    };
  };

  IJ.act['clear-filters'] = () => { home.f = []; home.cat = null; const r = $('#view'); renderShopList(r); };
  IJ.act['grab-code'] = (el) => {
    const k = el.dataset.code;
    S.checkout.code = k;
    IJ.save('checkout');
    $$('.promo-card').forEach((c) => { $('.pc-cta', c).innerHTML = c.dataset.code === k ? icon('check') + 'เก็บแล้ว' : 'แตะเพื่อเก็บโค้ด'; });
    IJ.toast(`เก็บโค้ด ${k} แล้ว ระบบจะใช้ให้ตอนชำระเงิน`);
  };

  /* ---------- ค้นหา ---------- */
  const POPULAR = ['กะเพรา', 'ชานม', 'ซูชิ', 'ส้มตำ', 'พิซซ่า', 'บิงซู', 'โจ๊ก', 'ไก่ทอด', 'ราเมง', 'สเต็ก'];
  // สะกดได้หลายแบบ / พิมพ์ภาษาอังกฤษ ให้หาเจอเหมือนกัน
  const ALIAS = [
    [/ราเมน/g, 'ราเมง'], [/กระเพรา/g, 'กะเพรา'], [/ก๊วยเตี๋ยว|ก๋วยเตี๊ยว|ก๊วยเตี๊ยว/g, 'ก๋วยเตี๋ยว'], [/ซูชิ|ซูชี่/g, 'ซูชิ'],
    [/พิซซา|พิซา/g, 'พิซซ่า'], [/เบอเกอร์|เบอร์เกอ/g, 'เบอร์เกอร์'], [/สเต๊ก|สะเต็ก/g, 'สเต็ก'], [/ชาบูชาบู/g, 'ชาบู'],
    [/ramen/g, 'ราเมง'], [/sushi/g, 'ซูชิ'], [/pizza/g, 'พิซซ่า'], [/burger/g, 'เบอร์เกอร์'], [/steak/g, 'สเต็ก'],
    [/salad/g, 'สลัด'], [/coffee/g, 'กาแฟ'], [/bubbletea|boba/g, 'ไข่มุก'], [/milktea/g, 'ชานม'], [/noodles?/g, 'ก๋วยเตี๋ยว'],
    [/friedchicken/g, 'ไก่ทอด'], [/chicken/g, 'ไก่'], [/pork/g, 'หมู'], [/beef/g, 'เนื้อ'], [/shrimp|prawn/g, 'กุ้ง'],
    [/curry/g, 'แกง'], [/taco/g, 'ทาโก้'], [/bingsu/g, 'บิงซู'], [/dimsum/g, 'ติ่มซำ'], [/pho/g, 'เฝอ'],
    [/friedrice/g, 'ข้าวผัด'], [/somtum|somtam|papayasalad/g, 'ส้มตำ'], [/kaprao|krapow|gaprao/g, 'กะเพรา'], [/dessert/g, 'ของหวาน']
  ];
  const norm = (s) => ALIAS.reduce((a, [re, to]) => a.replace(re, to), String(s).toLowerCase().replace(/\s+/g, ''));

  function searchResults(q) {
    const n = norm(q);
    const shops = IJ.SHOPS.filter((s) => norm(s.name + s.tag + IJ.cat[s.cat].name).includes(n));
    const items = [];
    IJ.SHOPS.forEach((s) => s.items.forEach((it) => { if (norm(it.name).includes(n) || norm(it.desc).includes(n)) items.push(it); }));
    items.sort((a, b) => (norm(b.name).includes(n) - norm(a.name).includes(n)) || (b.hot - a.hot) || b.shop.rt - a.shop.rt);
    return { shops, items: items.slice(0, 40) };
  }

  function renderSearch(root, q) {
    const box = $('#sr', root);
    if (!q.trim()) {
      box.innerHTML = `
        ${S.recent.length ? `<section class="blk pad-x"><div class="sec-h"><h2>ค้นหาล่าสุด</h2><button type="button" class="link-btn" data-act="clear-recent">ล้าง</button></div>
          <div class="chips-wrap">${S.recent.map((r) => `<button type="button" class="chip" data-q="${esc(r)}">${icon('clock', 'sm')}${esc(r)}</button>`).join('')}</div></section>` : ''}
        <section class="blk pad-x"><div class="sec-h"><h2>คนค้นหาบ่อย</h2></div>
          <div class="chips-wrap">${POPULAR.map((r) => `<button type="button" class="chip" data-q="${r}">${r}</button>`).join('')}</div></section>
        <section class="blk pad-x"><div class="sec-h"><h2>หมวดทั้งหมด</h2></div>
          <div class="cat-grid">${IJ.CATS.map((c) => `<button type="button" class="cat-tile" data-q="${esc(c.name)}"><span>${c.e}</span>${esc(c.name)}</button>`).join('')}</div></section>`;
      return;
    }
    const { shops, items } = searchResults(q);
    if (!shops.length && !items.length) {
      box.innerHTML = `<div class="empty pad-x"><p class="big-emo">🔍</p><p>ไม่พบ “${esc(q)}”</p><p class="sub">ลองคำอื่น เช่น ${POPULAR.slice(0, 3).join(', ')}</p></div>`;
      return;
    }
    box.innerHTML = `
      ${shops.length ? `<section class="blk"><div class="sec-h pad-x"><h2>ร้าน</h2><span class="sec-note">${shops.length} ร้าน</span></div><div class="shop-list">${shops.map(IJ.shopRow).join('')}</div></section>` : ''}
      ${items.length ? `<section class="blk"><div class="sec-h pad-x"><h2>เมนู</h2><span class="sec-note">${items.length} รายการ</span></div>
        <div class="dish-list">${items
          .map((it) => `<a class="dish" href="#/r/${it.shop.id}?item=${it.id}" data-go="/r/${it.shop.id}?item=${it.id}" style="${IJ.shopVars(it.shop)}">
            <span class="thumb">${it.e}</span>
            <span class="dish-t"><b>${esc(it.name)}</b><small>${esc(it.shop.name)} · ${it.shop.t[0]}–${it.shop.t[1]} นาที</small></span>
            <span class="dish-p">${baht(it.price)}</span></a>`)
          .join('')}</div></section>` : ''}`;
  }

  function pushRecent(q) {
    q = q.trim();
    if (!q) return;
    S.recent = [q].concat(S.recent.filter((x) => x !== q)).slice(0, 8);
    IJ.save('recent');
  }

  IJ.views.search = function (qs) {
    const q0 = (qs && qs.get('q')) || IJ.lastSearch || '';
    const html = `
      <header class="topbar search-top">
        <div class="search-field">
          ${icon('search')}
          <input id="q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="ค้นหาร้านหรือเมนู" value="${esc(q0)}" aria-label="ค้นหา">
          <button type="button" class="clear-q" id="clear-q" aria-label="ล้างคำค้น" ${q0 ? '' : 'hidden'}>${icon('close', 'sm')}</button>
        </div>
      </header>
      <div id="sr"></div>`;
    return {
      html, tab: 'search', dock: true,
      mount(root) {
        const input = $('#q', root);
        let t;
        const run = () => { IJ.lastSearch = input.value; $('#clear-q', root).hidden = !input.value; renderSearch(root, input.value); };
        run();
        input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 120); });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { pushRecent(input.value); input.blur(); } });
        $('#clear-q', root).addEventListener('click', () => { input.value = ''; run(); input.focus(); });
        root.addEventListener('click', (e) => {
          const c = e.target.closest('[data-q]');
          if (c) { input.value = c.dataset.q; pushRecent(c.dataset.q); run(); window.scrollTo(0, 0); return; }
          if (e.target.closest('.shop-row, .dish')) pushRecent(input.value);
        });
        if (!q0 && matchMedia('(hover: hover)').matches) setTimeout(() => input.focus(), 50);
      }
    };
  };
  IJ.act['clear-recent'] = () => { S.recent = []; IJ.save('recent'); const i = $('#q'); renderSearch($('#view'), i ? i.value : ''); };

  /* ---------- หน้าร้าน ---------- */
  const SPOTS = [[9, 20, -14], [80, 16, 12], [24, 72, 10], [70, 70, -10], [92, 52, 16], [6, 50, 8]];
  function heroArt(s) {
    const pool = [...new Set(s.items.map((i) => i.e))].filter((e) => e !== s.e).slice(0, SPOTS.length);
    return pool.map((e, i) => `<span class="float" style="left:${SPOTS[i][0]}%;top:${SPOTS[i][1]}%;transform:translate(-50%,-50%) rotate(${SPOTS[i][2]}deg)">${e}</span>`).join('') + `<span class="hero-emo">${s.e}</span>`;
  }

  function menuItem(it) {
    const q = IJ.qtyOfItem(it.id);
    const badges = [it.hot && '<span class="bdg hot">ขายดี</span>', it.rec && '<span class="bdg rec">ร้านแนะนำ</span>', it.isNew && '<span class="bdg new">ใหม่</span>', it.was && `<span class="bdg sale">ลด ${baht(it.was - it.price)}</span>`].filter(Boolean).join('');
    return `<button type="button" class="mi${q ? ' in-cart' : ''}" data-act="item" data-id="${it.id}">
      <span class="mi-text">
        ${badges ? `<span class="mi-badges">${badges}</span>` : ''}
        <span class="mi-name">${esc(it.name)}</span>
        ${it.desc ? `<span class="mi-desc">${esc(it.desc)}</span>` : ''}
        <span class="mi-price"><b>${baht(it.price)}</b>${it.was ? `<s>${baht(it.was)}</s>` : ''}${it.opts.length ? '<span class="dim">มีตัวเลือก</span>' : ''}</span>
      </span>
      <span class="mi-thumb"><span class="emo">${it.e}</span>${q ? `<span class="qty-badge">${q}</span>` : ''}<span class="add-dot">${icon('plus')}</span></span>
    </button>`;
  }

  IJ.refreshMenuBadges = () => {
    $$('.mi[data-id]').forEach((el) => {
      const q = IJ.qtyOfItem(el.dataset.id);
      el.classList.toggle('in-cart', q > 0);
      const th = $('.mi-thumb', el);
      let b = $('.qty-badge', th);
      if (q && !b) { b = document.createElement('span'); b.className = 'qty-badge'; th.insertBefore(b, $('.add-dot', th)); }
      if (b) { if (q) b.textContent = q; else b.remove(); }
    });
  };

  IJ.views.shop = function (id, qs) {
    const s = IJ.shop[id];
    if (!s) return IJ.views.notfound();
    const fav = S.favs.includes(s.id);
    const html = `
      <div class="shop-page" style="${IJ.shopVars(s)}">
        <div class="hero cover">
          <div class="hero-art" aria-hidden="true">${heroArt(s)}</div>
          <div class="hero-bar">
            <button type="button" class="round" data-act="back" aria-label="ย้อนกลับ">${icon('back')}</button>
            <span class="grow"></span>
            <button type="button" class="round" data-act="share" aria-label="คัดลอกลิงก์ร้าน">${icon('link')}</button>
            <button type="button" class="round fav-btn${fav ? ' on' : ''}" data-act="fav" data-id="${s.id}" aria-pressed="${fav}" aria-label="ร้านโปรด">${icon('heart')}</button>
          </div>
        </div>
        <section class="shop-head pad-x">
          <p class="eyebrow">${esc(IJ.cat[s.cat].name)} · ${lvl(s.lv)}</p>
          <h1>${esc(s.name)}</h1>
          <p class="sub">${esc(s.tag)}</p>
          <dl class="stats">
            <div><dt>คะแนน</dt><dd>${IJ.starIcon()}${s.rt.toFixed(1)} <small>(${IJ.kfmt(s.rv)})</small></dd></div>
            <div><dt>เวลาส่ง</dt><dd>${s.t[0]}–${s.t[1]} <small>นาที</small></dd></div>
            <div><dt>ระยะทาง</dt><dd>${s.km.toFixed(1)} <small>กม.</small></dd></div>
            <div><dt>ค่าส่ง</dt><dd>${baht(s.fee)}</dd></div>
          </dl>
          ${s.p ? `<p class="promo-strip">${icon('tag')}<span>${esc(IJ.promoText(s.p))}</span></p>` : ''}
        </section>
        <div class="shop-top" id="shop-top">
          <button type="button" class="icon-btn" data-act="back" aria-label="ย้อนกลับ">${icon('back')}</button>
          <b>${esc(s.name)}</b>
          <button type="button" class="icon-btn fav-btn${fav ? ' on' : ''}" data-act="fav" data-id="${s.id}" aria-pressed="${fav}" aria-label="ร้านโปรด">${icon('heart')}</button>
        </div>
        <nav class="menu-tabs" id="mtabs" aria-label="หมวดเมนู">${s.sections.map((sec, i) => `<button type="button" data-sec="${i}"${i === 0 ? ' class="on"' : ''}>${esc(sec.title)}</button>`).join('')}</nav>
        <div class="menu">
          ${s.sections.map((sec, i) => `<section class="menu-sec" id="sec-${i}" data-sec="${i}"><h2 class="pad-x">${esc(sec.title)} <small>${sec.items.length}</small></h2>${sec.items.map(menuItem).join('')}</section>`).join('')}
        </div>
        <p class="foot-note pad-x">${esc(s.name)} เป็นร้านสมมติในแอปจำลอง ราคาและเมนูตั้งขึ้นเพื่อความสนุก</p>
      </div>`;

    return {
      html, tab: null, dock: true,
      mount(root) {
        const topBar = $('#shop-top', root);
        const hero = $('.hero', root);
        const tabs = $('#mtabs', root);
        const secs = $$('.menu-sec', root);
        const stickyTop = () => parseFloat(getComputedStyle(tabs).top) || 56;
        let lock = 0;
        const setTab = (i, smooth) => {
          $$('button', tabs).forEach((b, j) => b.classList.toggle('on', j === i));
          const b = $$('button', tabs)[i];
          if (b) tabs.scrollTo({ left: b.offsetLeft - 16, behavior: smooth ? IJ.motion() : 'auto' });
        };
        const onScroll = () => {
          topBar.classList.toggle('show', window.scrollY > hero.offsetHeight - 70);
          if (Date.now() < lock) return;
          const line = tabs.getBoundingClientRect().bottom + 12;
          let cur = 0;
          secs.forEach((sec, i) => { if (sec.getBoundingClientRect().top <= line) cur = i; });
          setTab(cur, false);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        IJ.onLeave(() => window.removeEventListener('scroll', onScroll));
        tabs.addEventListener('click', (e) => {
          const b = e.target.closest('[data-sec]');
          if (!b) return;
          const i = +b.dataset.sec;
          setTab(i, true);
          lock = Date.now() + 800;
          const y = secs[i].getBoundingClientRect().top + window.scrollY - stickyTop() - tabs.offsetHeight + 1;
          window.scrollTo({ top: Math.max(0, y), behavior: IJ.motion() });
        });
        onScroll();
        const want = qs.get('item');
        if (want && IJ.item[want]) setTimeout(() => IJ.openItem(IJ.item[want]), 120);
      }
    };
  };

  IJ.act.item = (el) => { const it = IJ.item[el.dataset.id]; if (it) IJ.openItem(it); };
  IJ.act.fav = (el) => {
    const id = el.dataset.id;
    const on = !S.favs.includes(id);
    S.favs = on ? S.favs.concat(id) : S.favs.filter((x) => x !== id);
    IJ.save('favs');
    $$(`.fav-btn[data-id="${id}"]`).forEach((b) => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    IJ.toast(on ? 'เพิ่มในร้านโปรดแล้ว' : 'เอาออกจากร้านโปรดแล้ว');
  };
  IJ.act.share = () => {
    const url = location.href;
    const ok = () => IJ.toast('คัดลอกลิงก์ร้านแล้ว');
    try {
      navigator.clipboard.writeText(url).then(ok, () => IJ.toast('คัดลอกไม่ได้ในเบราว์เซอร์นี้'));
    } catch (e) { IJ.toast('คัดลอกไม่ได้ในเบราว์เซอร์นี้'); }
  };

  /* ---------- หน้าต่างเลือกตัวเลือกเมนู ---------- */
  const PRESET = ['size', 'size20', 'cup', 'friesSize', 'pizzaSize', 'krSize', 'combo', 'ice', 'wasabi', 'ramenBroth', 'milk', 'base'];

  IJ.openItem = function (it, line) {
    const s = it.shop;
    const sel0 = line ? line.sel : Object.fromEntries(it.opts.filter((g) => PRESET.includes(g)).map((g) => [g, [0]]));
    const groups = it.opts.map((g) => {
      const G = IJ.OPT[g];
      const single = G.max === 1;
      const rule = G.min > 0 ? `จำเป็น · เลือก ${G.min === G.max ? G.min : G.min + '–' + G.max}` : `ไม่บังคับ · สูงสุด ${G.max}`;
      return `<fieldset class="og" data-g="${g}" data-min="${G.min}" data-max="${G.max}">
        <legend><span class="og-t">${esc(G.t)}</span><span class="og-rule${G.min > 0 ? ' req' : ''}">${rule}</span></legend>
        ${G.o.map((o, i) => `<label class="opt"><input type="${single ? 'radio' : 'checkbox'}" name="g-${g}" value="${i}"${(sel0[g] || []).includes(i) ? ' checked' : ''}><span class="mark ${single ? 'r' : 'c'}"></span><span class="o-name">${esc(o[0])}</span><span class="o-price">${o[1] ? '+' + baht(o[1]) : ''}</span></label>`).join('')}
      </fieldset>`;
    });
    const html = `
      <div class="sheet-body" id="it-body">
        <div class="it-hero cover${it.photo ? ' has-photo' : ''}" style="${IJ.shopVars(s)}">
          ${it.photo ? `<img class="it-photo" src="${it.photo.url}" alt="${esc(it.name)}">
          <span class="it-credit">ภาพ: ${esc(it.photo.by)} / ${esc(it.photo.src)} (${esc(it.photo.lic)})</span>` : `<span class="emo">${it.e}</span>`}
          <button type="button" class="round it-close" data-close aria-label="ปิด">${icon('close')}</button>
        </div>
        <div class="it-head pad-x">
          <h2>${esc(it.name)}</h2>
          ${it.desc ? `<p class="sub">${esc(it.desc)}</p>` : ''}
          <p class="it-price"><b>${baht(it.price)}</b>${it.was ? `<s>${baht(it.was)}</s>` : ''}<span class="dim">· ${esc(s.name)}</span></p>
        </div>
        <form id="itf" class="pad-x" novalidate>
          ${groups.join('')}
          <div class="og note-og">
            <label for="inote" class="og-t">หมายเหตุถึงร้าน <span class="og-rule">ไม่บังคับ</span></label>
            <textarea id="inote" maxlength="140" rows="2" placeholder="เช่น ไม่ใส่ผักชี แยกน้ำ">${esc(line ? line.note : '')}</textarea>
          </div>
        </form>
      </div>
      <footer class="sheet-foot">
        <div class="stepper" aria-label="จำนวน">
          <button type="button" data-q="-1" aria-label="ลดจำนวน">${icon('minus')}</button>
          <output id="iq">${line ? line.qty : 1}</output>
          <button type="button" data-q="1" aria-label="เพิ่มจำนวน">${icon('plus')}</button>
        </div>
        <button type="button" class="btn primary grow" id="add-btn"></button>
      </footer>`;
    const { el, close } = IJ.openSheet(html, { cls: 'item-sheet', label: it.name });
    const form = $('#itf', el);
    let qty = line ? line.qty : 1;

    const readSel = () => {
      const sel = {};
      $$('.og[data-g]', form).forEach((fs) => {
        const v = $$('input:checked', fs).map((i) => +i.value);
        if (v.length) sel[fs.dataset.g] = v;
      });
      return sel;
    };
    const invalid = () => $$('.og[data-g]', form).filter((fs) => $$('input:checked', fs).length < +fs.dataset.min);
    const update = () => {
      const sel = readSel();
      const total = (it.price + IJ.selPrice(sel)) * qty;
      $('#iq', el).textContent = qty;
      $('[data-q="-1"]', el).disabled = qty <= 1 && !line;
      $$('.og[data-g]', form).forEach((fs) => {
        const n = $$('input:checked', fs).length, min = +fs.dataset.min, max = +fs.dataset.max;
        const rule = $('.og-rule', fs);
        if (min > 0) {
          const ok = n >= min;
          rule.classList.toggle('ok', ok);
          rule.innerHTML = ok ? icon('check', 'sm') + 'เลือกแล้ว' : `จำเป็น · เลือก ${min === max ? min : min + '–' + max}`;
          if (ok) fs.classList.remove('need');
        }
        if (max > 1) $$('input', fs).forEach((i) => { i.closest('.opt').classList.toggle('off', !i.checked && n >= max); });
      });
      const btn = $('#add-btn', el);
      if (line && qty === 0) { btn.textContent = 'ลบออกจากตะกร้า'; btn.classList.add('danger'); }
      else { btn.classList.remove('danger'); btn.innerHTML = `<span>${line ? 'อัปเดตตะกร้า' : 'เพิ่มลงตะกร้า'}</span><span>${baht(total)}</span>`; }
    };

    form.addEventListener('change', (e) => {
      const inp = e.target;
      const fs = inp.closest('.og[data-g]');
      if (fs && inp.type === 'checkbox') {
        const max = +fs.dataset.max;
        if ($$('input:checked', fs).length > max) { inp.checked = false; IJ.toast(`เลือกได้สูงสุด ${max} อย่าง`); }
      }
      update();
    });
    el.addEventListener('click', (e) => {
      const q = e.target.closest('[data-q]');
      if (!q) return;
      qty = Math.max(line ? 0 : 1, Math.min(99, qty + +q.dataset.q));
      update();
    });
    $('#add-btn', el).addEventListener('click', () => {
      if (line && qty === 0) { IJ.setLineQty(line.key, 0); close(); IJ.afterCartChange && IJ.afterCartChange(); return; }
      const bad = invalid();
      if (bad.length) {
        bad.forEach((fs) => { fs.classList.remove('need'); void fs.offsetWidth; fs.classList.add('need'); });
        const body = $('#it-body', el);
        body.scrollTo({ top: bad[0].offsetTop - 12, behavior: IJ.motion() });
        IJ.toast(`กรุณาเลือก “${IJ.OPT[bad[0].dataset.g].t}”`);
        return;
      }
      const sel = readSel();
      const note = $('#inote', el).value;
      if (line) {
        // แก้ไขรายการเดิม: ตั้งจำนวนตามที่เลือก
        IJ.addToCart(it, sel, qty, note, line.key, () => { close(); IJ.toast('อัปเดตตะกร้าแล้ว'); IJ.afterCartChange && IJ.afterCartChange(); });
      } else {
        IJ.addToCart(it, sel, qty, note, null, () => { close(); IJ.refreshMenuBadges(); IJ.toast(`เพิ่ม ${it.name} ×${qty} แล้ว`); });
      }
    });
    update();
  };

  /* ---------- สุ่มเมนู ---------- */
  IJ.act.random = () => {
    const all = IJ.SHOPS.flatMap((s) => s.items.filter((i) => i.price >= 30));
    const pick = () => all[Math.floor(Math.random() * all.length)];
    const { el, close } = IJ.openSheet(`
      <div class="rand-body pad-x">
        <p class="eyebrow">สุ่มจาก ${all.length} เมนู</p>
        <div class="slot" id="slot"><span class="emo">🎲</span></div>
        <h2 id="r-name">กำลังสุ่ม…</h2>
        <p class="sub" id="r-shop">&nbsp;</p>
        <div class="row gap">
          <button type="button" class="btn ghost grow" id="r-again">${icon('refresh')}สุ่มใหม่</button>
          <button type="button" class="btn primary grow" id="r-take" disabled>เอาอันนี้</button>
        </div>
      </div>`, { label: 'สุ่มเมนู' });
    let cur = null, timer = null;
    const spin = () => {
      clearInterval(timer);
      $('#r-take', el).disabled = true;
      let n = 0;
      const reduce = IJ.motion() === 'auto';
      const steps = reduce ? 1 : 14;
      timer = setInterval(() => {
        const p = pick();
        $('#slot', el).innerHTML = `<span class="emo">${p.e}</span>`;
        $('#slot', el).setAttribute('style', IJ.shopVars(p.shop));
        if (++n >= steps) {
          clearInterval(timer);
          cur = p;
          $('#r-name', el).textContent = p.name;
          $('#r-shop', el).textContent = `${p.shop.name} · ${baht(p.price)}`;
          $('#r-take', el).disabled = false;
          $('#slot', el).classList.add('pop');
          setTimeout(() => $('#slot', el).classList.remove('pop'), 400);
        }
      }, 55);
    };
    $('#r-again', el).addEventListener('click', spin);
    $('#r-take', el).addEventListener('click', () => { if (cur) { close(); IJ.go(`/r/${cur.shop.id}?item=${cur.id}`); } });
    spin();
  };
})();
