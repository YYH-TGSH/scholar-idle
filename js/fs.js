/* ==========================================================================
   🖥️ 全屏呈現層 FS＋爆炸圖（R6 拆分自 town.js）：fsEnter/fsExit/托盤/樓層堆疊/地點條
   載入順序：… → interiors → fs → world → …（見 town.js 頭）
   主要符號：fsEnter, fsExit, fsWant, fsLayout, fsDefs, fsInside, syncSpotBar,
   EXPLODE_GAP, ensureExplodeChrome, syncFloorStack, switchFloor, applyHomeFloors, syncMiniExplode
   ========================================================================== */
    let _homeViewFloor = null; // v9.67 標籤 peek 的暫時檢視層（睡/醒狀態一變就清除）
    let _homeDerivedPrev = 1;
    let _homeExplodeMode = 'out';
    // v9.69 全屏室內呈現層（R3 F）：進建物把該棟疊層搬進 #fs-view 整疊入框；離場原位復原
    const FS_BG = '#2a1836';
    const FS_MARGIN_X = 8;
    const _fsWants = {};
    let _fs = null;
    let _fsSig = '';
    let _fsSuppressed = null; // v9.71 使用者手動關閉 FS 的建物 key（檢視與主角 inside 解耦）
    function fsViewEl() {
      let v = document.getElementById('fs-view');
      if (!v) { v = document.createElement('div'); v.id = 'fs-view'; const stack = document.createElement('div'); stack.id = 'fs-stack'; v.appendChild(stack); const xb = document.createElement('button'); xb.id = 'fs-exit-btn'; xb.type = 'button'; xb.textContent = '\u2190 \u56de\u5927\u5730\u5716'; xb.addEventListener('click', e => { e.stopPropagation(); fsUserClose(); }); xb.addEventListener('pointerdown', e => { e.stopPropagation(); }); const shd = document.createElement('div'); shd.id = 'fs-shade'; v.appendChild(shd); v.appendChild(xb); document.body.appendChild(v); }
      return v;
    }
    function fsDefs(key) {
      if (key === 'school') return { gap: EXPLODE_GAP, guides: 'school-guides', plates: [{ id: 'school-roof', kind: 'roof', loc: null }, { id: 'club-stage', kind: 'stage', loc: 'club' }, { id: 'study-stage', kind: 'stage', loc: 'study' }, { id: 'school-stage', kind: 'stage', loc: 'school' }] };
      if (key === 'home') return { gap: EXPLODE_GAP, guides: 'home-guides', plates: [{ id: 'home-roof', kind: 'roof', loc: null }, { id: 'home2-stage', kind: 'stage', loc: 'home2' }, { id: 'home-stage', kind: 'stage', loc: 'home' }] };
      if (key === 'store') return { gap: EXPLODE_GAP_SINGLE, guides: 'store-guides', plates: [{ id: 'store-roof', kind: 'roof', loc: null }, { id: 'store-stage', kind: 'stage', loc: 'store' }] };
      if (key === 'rest') return { gap: EXPLODE_GAP_SINGLE, guides: 'rest-guides', plates: [{ id: 'rest-roof', kind: 'roof', loc: null }, { id: 'rest-stage', kind: 'stage', loc: 'restaurant' }] };
      if (key === 'library') return { gap: EXPLODE_GAP_SINGLE, guides: 'library-guides', plates: [{ id: 'library-roof', kind: 'roof', loc: null }, { id: 'lib-stage', kind: 'stage', loc: 'library' }] };
      return null;
    }
    function syncFsShade() { // v9.74 R2 H3：FS 夜色 = 該棟島嶼 shade 現值（同一公式同一層色，不另算、不雙重壓暗）
      const shd = document.getElementById('fs-shade'); if (!shd) return;
      if (!_fs) { shd.style.opacity = '0'; return; }
      const isl = document.getElementById(FS_LANDMARK[_fs.key]); const g = isl ? isl.querySelector('.island-shade') : null;
      shd.style.opacity = g ? (g.style.opacity || '0') : '0';
    }
    function fsLayout() {
      if (!_fs) return;
      const view = fsViewEl();
      const vw = view.clientWidth || window.innerWidth || 390;
      const vh = view.clientHeight || window.innerHeight || 844;
      const cs = getComputedStyle(document.documentElement);
      const topIn = parseFloat(cs.getPropertyValue('--chrome-top')) || 84;
      const botIn = parseFloat(cs.getPropertyValue('--chrome-bottom')) || 16;
      const availW = Math.max(200, vw - FS_MARGIN_X * 2);
      const availH = Math.max(200, vh - topIn - botIn);
      const s = Math.min(availW / 1340, availH / _fs.totalUnits);
      const stackW = 1340 * s, stackH = _fs.totalUnits * s;
      const left = (vw - stackW) / 2, top = topIn + (availH - stackH) / 2;
      const sig = [s.toFixed(4), left.toFixed(1), top.toFixed(1)].join('/');
      if (sig === _fsSig) return;
      _fsSig = sig; _fs.s = s;
      const stack = view.firstChild;
      stack.style.cssText = 'position:absolute; left:' + left.toFixed(1) + 'px; top:' + top.toFixed(1) + 'px; width:' + stackW.toFixed(1) + 'px; height:' + stackH.toFixed(1) + 'px;';
      const stepPx = (300 + _fs.def.gap) * s;
      _fs.plates.forEach((pl, i) => { pl.wrap.style.cssText = 'position:absolute; left:0; width:' + stackW.toFixed(1) + 'px; height:' + (300 * s).toFixed(1) + 'px; top:' + (i * stepPx).toFixed(1) + 'px;'; });
      if (_fs.guidesEl) { _fs.guidesEl.style.position = 'absolute'; _fs.guidesEl.style.left = '0px'; _fs.guidesEl.style.top = '0px'; }
      window.__FS_FIT = { active: _fs.key, s: s, stackW: stackW, stackH: stackH, left: left, top: top, personPx: 50, plates: _fs.plates.length };
      syncFsShade();
    }
    function fsEnter(key) {
      const def = fsDefs(key); if (!def) return;
      const view = fsViewEl(); const stack = view.firstChild;
      stack.innerHTML = '';
      const moved = []; const plates = [];
      def.plates.forEach(pd0 => { const e0 = document.getElementById(pd0.id); if (e0) { delete e0.dataset.hf; delete e0.dataset.frel; delete e0.dataset.k; } });
      const gd0 = document.getElementById(def.guides); if (gd0) delete gd0.dataset.k;
      def.plates.forEach(pd => {
        const wrap = document.createElement('div'); wrap.className = 'fs-plate'; wrap.dataset.loc = pd.loc || ''; stack.appendChild(wrap);
        const el = document.getElementById(pd.id);
        if (el) { moved.push({ el: el, parent: el.parentNode, next: el.nextSibling }); if (pd.kind === 'stage') el.style.transform = ''; el.style.transformOrigin = '0 0'; wrap.appendChild(el); }
        const tray = document.createElement('div'); tray.className = 'fs-tray'; tray.setAttribute('aria-hidden', 'true'); wrap.appendChild(tray); // R3 模型托盤木唇
        plates.push({ wrap: wrap, kind: pd.kind, loc: pd.loc, id: pd.id });
      });
      const gd = document.getElementById(def.guides);
      if (gd) { moved.push({ el: gd, parent: gd.parentNode, next: gd.nextSibling }); gd.style.transformOrigin = '0 0'; stack.appendChild(gd); }
      _fs = { key: key, def: def, plates: plates, moved: moved, guidesEl: gd || null, totalUnits: def.plates.length * 300 + (def.plates.length - 1) * def.gap, s: 0 };
      _fsSig = '';
      if (typeof Screens !== 'undefined' && Screens.open('fs-view')) { /* R3：FS 開關改走 Screen Manager */ } else { view.classList.add('on'); document.body.classList.add('fs-on'); }
      fsLayout();
      const stepPx = (300 + def.gap) * (_fs.s || 0.3);
      let ai = plates.findIndex(pl => pl.loc && pl.loc === (typeof currentLoc !== 'undefined' ? currentLoc : null));
      if (ai < 0) ai = plates.length - 1;
      plates.forEach((pl, i) => { if (i !== ai) { pl.wrap.style.transition = 'transform 350ms ease'; pl.wrap.style.transform = 'translateY(' + ((ai - i) * stepPx).toFixed(1) + 'px)'; } });
      requestAnimationFrame(() => { plates.forEach(pl => { pl.wrap.style.transform = ''; }); });
    }
    function fsExit() {
      if (!_fs) return;
      _fs.moved.forEach(m => { delete m.el.dataset.hf; delete m.el.dataset.frel; delete m.el.dataset.k; }); // P3(b)：清守衛鍵，次一 tick sync 全量重寫樣式
      for (let i = _fs.moved.length - 1; i >= 0; i--) { const m = _fs.moved[i]; if (!m.parent) continue; m.el.style.transformOrigin = ''; if (m.next && m.next.parentNode === m.parent) m.parent.insertBefore(m.el, m.next); else m.parent.appendChild(m.el); }
      if (typeof Screens !== 'undefined' && Screens.close('fs-view')) { /* R3：FS 開關改走 Screen Manager */ } else { fsViewEl().classList.remove('on'); document.body.classList.remove('fs-on'); }
      _fs = null; _fsSig = ''; window.__FS_FIT = null;
      _camAnchor = null; _camHoldUntil = 0; // P2：FS 關閉後鏡頭回主角（清 anchor/hold 殘留）
      if (typeof snapCameraToChar === 'function') snapCameraToChar();
    }
    function fsUserClose() { // P1 檢視性退出：只關檢視，不動主角狀態/派遣/inside
      if (!_fs) return;
      _fsSuppressed = _fs.key;
      fsExit();
      fsReenterBtn(_fsSuppressed);
    }
    function fsReenter(key) {
      _fsSuppressed = null;
      fsReenterBtn(null);
      fsEnter(key);
    }
    const FS_LANDMARK = { school: 'landmark-school', home: 'landmark-home', store: 'landmark-store', rest: 'landmark-restaurant', library: 'landmark-library' };
    function fsReenterBtn(key) {
      const old = document.getElementById('fs-reenter-btn');
      if (!key) { if (old) old.remove(); return; }
      if (old && old.dataset.key === key) return;
      if (old) old.remove();
      const lm = document.getElementById(FS_LANDMARK[key]);
      if (!lm) return;
      const b = document.createElement('button');
      b.id = 'fs-reenter-btn'; b.type = 'button'; b.dataset.key = key; b.className = 'fs-reenter-btn';
      b.textContent = '\u56de\u5ba4\u5167';
      b.addEventListener('click', e => { e.stopPropagation(); fsReenter(key); });
      b.addEventListener('pointerdown', e => { e.stopPropagation(); });
      lm.appendChild(b);
    }
    function fsMarkActive(locKey) {
      if (!_fs) return;
      _fs.plates.forEach(pl => pl.wrap.classList.toggle('fs-active', !!locKey && pl.loc === locKey));
    }
    function fsInside(floors) { // 同棟內換層通勤（commuteStart 與 commuteTarget 都在本棟）仍算在建物內；跨棟通勤不算
      if (typeof currentLoc === 'undefined' || typeof gameState === 'undefined') return false;
      if (gameState.isCommuting) return floors.indexOf(gameState.commuteStart) >= 0 && floors.indexOf(gameState.commuteTarget) >= 0;
      return floors.indexOf(currentLoc) >= 0;
    }
    // ================= v9.73 室內地點條（體驗巡迴 R1 §7 P4） =================
    const SPOT_BAR_DEFS = [
      { group: 'school', keys: ['classroom', 'studyroom', 'clubroom', 'rest'] },
      { group: 'home', keys: ['eat', 'bed', 'parents'] },
      { group: 'gym', keys: ['run', 'shoot'] },
      { group: 'library', keys: ['read'] }
    ];
    function syncSpotBar() {
      let bar = document.getElementById('spot-bar');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'spot-bar';
        bar.dataset.g = '';
        bar.addEventListener('click', (e) => { const b = e.target.closest('[data-spot]'); if (b) { e.stopPropagation(); if (typeof setSpot === 'function') setSpot(b.dataset.spot); } });
        bar.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
        document.body.appendChild(bar);
      }
      const grp = (typeof SPOT_GROUP !== 'undefined' && typeof currentLoc !== 'undefined') ? Object.keys(SPOT_GROUP).find(g => SPOT_GROUP[g].includes(currentLoc)) : null;
      const show = !!grp && !gameState.isCommuting;
      if (!show) { if (bar.dataset.g !== '') { bar.dataset.g = ''; bar.style.display = 'none'; bar.innerHTML = ''; } return; }
      let activeKey = gameState._spot ? gameState._spot.key : null;
      if (!activeKey) {
        if (currentLoc === 'school' && currentState === 'studying') activeKey = 'classroom';
        else if (currentLoc === 'study') activeKey = 'studyroom';
        else if (currentLoc === 'club') activeKey = 'clubroom';
        else if (currentLoc === 'home' && currentState === 'dinner') activeKey = 'eat';
        else if (currentLoc === 'home' && currentState === 'sleeping') activeKey = 'bed';
        else if (currentLoc === 'gym' && currentState === 'sports') activeKey = 'run';
        else if (currentLoc === 'library' && currentState === 'studying') activeKey = 'read';
      }
      const def = SPOT_BAR_DEFS.find(d => d.group === grp);
      if (!def || typeof SPOT_DEFS === 'undefined') return;
      const sig = grp + '|' + (activeKey || '');
      if (bar.dataset.g === sig) return;
      bar.dataset.g = sig;
      bar.style.display = 'flex';
      bar.innerHTML = def.keys.map(k => '<button type="button" class="spot-chip' + (k === activeKey ? ' on' : '') + '" data-spot="' + k + '">' + SPOT_DEFS[k].label + '</button>').join('');
    }

    function fsWant(key, on) {
      if (!on) {
        _fsWants[key] = false;
        if (_fsSuppressed === key) { _fsSuppressed = null; fsReenterBtn(null); }
        if (_fs && _fs.key === key) fsExit();
        return;
      }
      for (const k in _fsWants) if (k !== key) _fsWants[k] = false;
      _fsWants[key] = true;
      if (_fsSuppressed === key) { fsReenterBtn(key); return; }
      if (_fs && _fs.key === key) { fsLayout(); return; }
      if (_fs) fsExit();
      fsEnter(key);
    }
    window.addEventListener('resize', () => { if (_fs) { _fsSig = ''; fsLayout(); } });
    function applyHomeFloors(derived) { // v9.67 爆炸圖版（原 v9.66 疊層）：位移量放大為整層步進、加屋頂/導引線/標籤
      const inB = (typeof currentLoc !== 'undefined') && currentLoc === 'home';
      if (!inB) _homeViewFloor = null; // R2-2：離開住家即清 peek，不得殘留到下次進屋
      if (derived !== _homeDerivedPrev) { _homeViewFloor = null; _homeDerivedPrev = derived; }
      const active = _homeViewFloor || derived;
      const mode = inB ? 'in' : 'out';
      const modeFlip = _homeExplodeMode !== mode; _homeExplodeMode = mode;
      const dur = modeFlip ? (inB ? 350 : 200) : 250;
      const sc = explodeSc(document.getElementById('home-stage'));
      const fsOn = _fs && _fs.key === 'home';
      const step = (300 + EXPLODE_GAP) * sc;
      const spec = [['home-stage', 1, '1F 客餐廳'], ['home2-stage', 2, '2F 臥室']];
      for (const [id, f, name] of spec) {
        const st = document.getElementById(id);
        if (!st) continue;
        const rel = f - active;
        const key = rel + mode;
        if (st.dataset.hf !== key) {
          st.dataset.hf = key;
          st.style.transition = 'opacity ' + dur + 'ms ease, transform ' + dur + 'ms ease';
          st.style.opacity = rel === 0 ? '1' : (rel < 0 ? '0.35' : '0.22');
          st.style.zIndex = rel === 0 ? '32' : '29';
          st.style.transform = fsOn ? '' : (inB ? 'translateY(' + (-rel * step).toFixed(1) + 'px)' : '');
          st.style.pointerEvents = rel === 0 ? 'auto' : 'none';
        }
        let lb = st.querySelector('.floor-label');
        if (!lb) { lb = document.createElement('button'); lb.className = 'floor-label'; lb.type = 'button'; lb.textContent = name; lb.addEventListener('click', (e) => { e.stopPropagation(); _homeViewFloor = f; applyHomeFloors(_homeDerivedPrev); }); lb.addEventListener('pointerdown', (e) => { e.stopPropagation(); }); st.appendChild(lb); }
        lb.style.display = inB ? 'block' : 'none';
        lb.classList.toggle('active', f === derived); // R2-2：實心高亮＝實際所在樓層
        lb.classList.toggle('peeking', _homeViewFloor !== null && f === active && f !== derived); // R2-2：虛線描邊＝只是 peek 的樓層
      }
      const plat = document.querySelector('#landmark-home .island-mount');
      if (plat) plat.classList.toggle('explode-open', inB);
      const host = document.querySelector('#landmark-home .island-mount-top');
      if (host) {
        ensureExplodeChrome('home', host, 'home', HOME_PROJ, 3, EXPLODE_GAP);
        const pan = active === 2 ? _home2PanCur : _homePanCur;
        const topOff = -(2 - (active - 1)) * step;
        const roof = document.getElementById('home-roof');
        if (roof) { const rk = topOff.toFixed(1) + '/' + mode + '/' + Math.round(-pan * sc) + '/' + (fsOn ? 'F' : 'T'); if (roof.dataset.k !== rk) { roof.dataset.k = rk; roof.style.transition = 'opacity ' + dur + 'ms ease, transform ' + dur + 'ms ease'; roof.style.opacity = inB ? '0.55' : '0'; roof.style.transform = fsOn ? 'scale(' + (_fs.s || 0.3).toFixed(3) + ')' : 'translate(' + (-pan * sc).toFixed(1) + 'px, ' + topOff.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')'; } }
        const gd = document.getElementById('home-guides');
        if (gd) { const gk = topOff.toFixed(1) + '/' + mode + '/' + Math.round(-pan * sc) + '/' + (fsOn ? 'F' : 'T'); if (gd.dataset.k !== gk) { gd.dataset.k = gk; gd.style.transition = 'opacity ' + dur + 'ms ease, transform ' + dur + 'ms ease'; gd.style.opacity = inB ? '1' : '0'; gd.style.transform = fsOn ? 'scale(' + (_fs.s || 0.3).toFixed(3) + ')' : 'translate(' + (-pan * sc).toFixed(1) + 'px, ' + topOff.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')'; } }
      }
      fsWant('home', fsInside(['home']));
      if (_fs && _fs.key === 'home') fsMarkActive(active === 2 ? 'home2' : 'home');
    }
    function syncMiniExplode(key, loc, pr, panCur) { // v9.67 單層建物迷你爆炸（餐廳/超商：地板層＋屋頂層、GAP_SINGLE）
      const inside = (typeof currentLoc !== 'undefined') && currentLoc === loc && !gameState.isCommuting;
      const host = document.querySelector('#landmark-' + loc + ' .island-mount-top');
      if (!host) return;
      ensureExplodeChrome(key, host, loc, pr, 2, EXPLODE_GAP_SINGLE);
      const plat = document.querySelector('#landmark-' + loc + ' .island-mount');
      if (plat) plat.classList.toggle('explode-open', inside);
      const sc = explodeSc(document.getElementById(key + '-stage'));
      const fsOn = _fs && _fs.key === key;
      const step = (300 + EXPLODE_GAP_SINGLE) * sc;
      const roof = document.getElementById(key + '-roof');
      if (roof) { const ry = inside ? -step : 0; const rk = ry.toFixed(1) + '/' + inside + '/' + Math.round(-panCur * sc) + '/' + (fsOn ? 'F' : 'T'); if (roof.dataset.k !== rk) { roof.dataset.k = rk; roof.style.opacity = inside ? '0.55' : '0'; roof.style.transform = fsOn ? 'scale(' + (_fs.s || 0.3).toFixed(3) + ')' : 'translate(' + (-panCur * sc).toFixed(1) + 'px, ' + ry.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')'; } }
      const gd = document.getElementById(key + '-guides');
      if (gd) { const gy = inside ? -step : 0; const gk = gy.toFixed(1) + '/' + inside + '/' + Math.round(-panCur * sc) + '/' + (fsOn ? 'F' : 'T'); if (gd.dataset.k !== gk) { gd.dataset.k = gk; gd.style.opacity = inside ? '1' : '0'; gd.style.transform = fsOn ? 'scale(' + (_fs.s || 0.3).toFixed(3) + ')' : 'translate(' + (-panCur * sc).toFixed(1) + 'px, ' + gy.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')'; } }
      fsWant(key, inside);
      if (_fs && _fs.key === key) fsMarkActive(loc);
    }
    function updateHome2Stage() {
      ensureHome2Interior();
      const stage = document.getElementById('home2-stage');
      if (!stage) return;
      const rooms = document.getElementById('home2-rooms');
      const playerIn = (typeof currentLoc !== 'undefined') && currentLoc === 'home' && (currentState === 'sleeping' || (gameState._spot && gameState._spot.floor === 2)) && !gameState.isCommuting; // v9.73 爸媽房覆寫也在 2F
      if (playerIn !== _home2WasIn) { _home2PanManual = null; _home2WasIn = playerIn; }
      const cw = document.getElementById('char-wrap');
      if (playerIn) {
        if (cw && rooms && cw.parentNode !== rooms) {
          rooms.appendChild(cw);
          cw.style.zIndex = '500';
          if (typeof getCharacterCoords === 'function' && typeof updateCharacterPositionAndScale === 'function') {
            const dc = getCharacterCoords(currentLoc, currentState);
            updateCharacterPositionAndScale(dc.x, dc.y, false);
          }
        }
      } else {
        const map = document.getElementById('town-map');
        if (cw && map && cw.parentNode === rooms) { map.appendChild(cw); cw.style.zIndex = '25'; }
      }
      if (cw && playerIn) cw.style.zIndex = '500';
      let focus = HOME_PROJ.P(565, 200, 0).x;
      if (playerIn) focus = HOME_PROJ.P(gameState.currentX || 840, gameState.currentY || 182, 0).x;
      else {
        const par = (gameState.npcs || []).find(n => n.kind === 'parent' && n.inside && n.floor === 'home2');
        if (par) focus = HOME_PROJ.P(par.x, par.y, 0).x;
      }
      updateHome2Pan(focus);
    }

    function checkHomeDinner() {
      const phase = dinnerPhaseNow();
      updateHomeDinnerVisual(phase);
      const parents = (gameState.npcs || []).filter(n => n.kind === 'parent');
      if (!phase) {
        parents.forEach(n => {
          if (n.atDinner) { n.atDinner = false; n.path = n.floor === 'home2' ? [stairWpHome('home'), npcDef(n.key).homeSpot] : [npcDef(n.key).homeSpot]; n.arrive = 'athome'; n.state = 'path'; } // v9.66 晚餐結束在 2F 先下樓
        });
        return;
      }
      parents.forEach(n => {
        if (n.atDinner || n.dest !== 'home' || n.state === 'path' || n.state === 'sleeping' || n.state === 'away') return;
        const seat = DINNER_SEATS[n.key];
        if (!seat) return;
        n.atDinner = true; n.path = [seat]; n.arrive = 'dinner'; n.state = 'path';
      });
      if (phase === 'dinner') {
        const absMin = (gameState.totalGameDays || 0) * 1440 + (gameState.hour || 0) * 60 + Math.floor(gameState.minute || 0);
        if (absMin - _dinnerChatAt >= 12) {
          const seated = parents.filter(n => n.atDinner && n.state === 'seated');
          if (seated.length) {
            _dinnerChatAt = absMin;
            const sp = seated[Math.floor(Math.random() * seated.length)];
            const lines = DINNER_SAY[sp.key] || [];
            if (lines.length) npcSay(sp, dlgPick('dinner.' + sp.key, lines));
          }
        }
      }
    }
    // ===== v9.67 爆炸圖呈現層（R1 定版：GAP 120/單層 80、屋頂幽靈 0.55、四角導引線、左側樓層標籤；透明制 100/35/22 疊加） =====
    const EXPLODE_GAP = 120;
    const EXPLODE_GAP_SINGLE = 80;
    const FLOOR_STAGE = { school: 'school-stage', study: 'study-stage', club: 'club-stage' };
    const FLOOR_NAME = { school: '1F 教室', study: '2F 自習室', club: '3F 社團活動室' };
    function explodeSc(stageEl) { return ((stageEl && stageEl.clientHeight) || 179) / 300; }
    function roofPlateSvg(kind, pr) {
      // v9.80 V3：正面疊層——屋頂改正面剪影（住家三角山牆／其餘平頂簷板），不再用等角投影
      let inner;
      if (kind === 'home') {
        inner = '<polygon points="150,242 670,84 1190,242" fill="#ff5d8f" stroke="#7c4a63" stroke-width="5" stroke-linejoin="round"/>'
          + '<rect x="110" y="242" width="1120" height="16" fill="#ff8fab" stroke="#7c4a63" stroke-width="4"/>'
          + '<circle cx="670" cy="196" r="17" fill="#fff3d6" stroke="#7c4a63" stroke-width="4"/>';
      } else {
        const col = kind === 'school' ? '#7d8fc9' : kind === 'restaurant' ? '#ff5d8f' : kind === 'library' ? '#8a6bc9' : '#4fce7e';
        inner = '<rect x="70" y="180" width="1200" height="18" fill="' + col + '" stroke="#7c4a63" stroke-width="4"/>'
          + '<rect x="96" y="198" width="1148" height="42" fill="' + col + '" stroke="#7c4a63" stroke-width="5"/>';
      }
      return '<svg viewBox="0 0 1340 300" style="width:1340px; height:300px; display:block;">' + inner + '</svg>';
    }
    function guidesSvg(pr, plates, gap) {
      const total = plates * 300 + (plates - 1) * gap;
      const xs = [pr.P(0, 0, 0).x, pr.P(1150, 0, 0).x, pr.P(0, 300, 0).x, pr.P(1150, 300, 0).x];
      const lines = xs.map(x => '<line x1="' + x.toFixed(1) + '" y1="0" x2="' + x.toFixed(1) + '" y2="' + total + '" stroke="#b09a72" stroke-width="2" stroke-dasharray="7 7"/>').join('');
      return '<svg width="1340" height="' + total + '" viewBox="0 0 1340 ' + total + '" style="display:block; opacity:0.5;">' + lines + '</svg>';
    }
    function ensureExplodeChrome(key, host, kind, pr, plates, gap) {
      if (!host || document.getElementById(key + '-roof')) return;
      const total = plates * 300 + (plates - 1) * gap;
      const gd = document.createElement('div');
      gd.id = key + '-guides'; gd.className = 'explode-guides';
      gd.style.cssText = 'position:absolute; left:0; top:0; width:1340px; height:' + total + 'px; pointer-events:none; opacity:0; z-index:4;';
      gd.innerHTML = guidesSvg(pr, plates, gap);
      host.appendChild(gd);
      const rf = document.createElement('div');
      rf.id = key + '-roof'; rf.className = 'roof-ghost';
      rf.style.cssText = 'position:absolute; left:0; top:0; width:1340px; height:300px; pointer-events:none; opacity:0; z-index:40;';
      rf.innerHTML = roofPlateSvg(kind, pr);
      host.appendChild(rf);
    }
    let _schExplodeMode = 'out';
    function syncFloorStack() {
      const cur = (typeof currentLoc !== 'undefined') ? currentLoc : null;
      if (SCHOOL_GROUP[cur]) { ensureSchoolInterior(); ensureStudyInterior(); ensureClubInterior(); }
      const inB = !!SCHOOL_GROUP[cur];
      const active = inB ? SCHOOL_GROUP[cur] : 1;
      const mode = inB ? 'in' : 'out';
      const modeFlip = _schExplodeMode !== mode; _schExplodeMode = mode;
      const dur = modeFlip ? (inB ? 350 : 200) : 250; // E2：進場展開 350ms、離場收合 200ms、切層 250ms
      const anchorStage = document.getElementById(FLOOR_STAGE[inB ? cur : 'school']);
      const sc = explodeSc(anchorStage);
      const fsOn = _fs && _fs.key === 'school';
      const step = (300 + EXPLODE_GAP) * sc;
      for (const loc in SCHOOL_GROUP) {
        const st = document.getElementById(FLOOR_STAGE[loc]);
        if (!st) continue;
        const f = SCHOOL_GROUP[loc];
        const rel = f - active;
        const key = rel + mode;
        if (st.dataset.frel !== key) {
          st.dataset.frel = key;
          st.style.transition = 'opacity ' + dur + 'ms ease, transform ' + dur + 'ms ease';
          st.style.opacity = rel === 0 ? '1' : (rel < 0 ? '0.35' : '0.22');
          st.style.zIndex = rel === 0 ? '32' : String(30 - Math.abs(rel));
          st.style.transform = fsOn ? '' : (inB ? 'translateY(' + (-rel * step).toFixed(1) + 'px)' : '');
          st.style.pointerEvents = rel === 0 ? 'auto' : 'none';
        }
        let lb = st.querySelector('.floor-label');
        if (!lb) { lb = document.createElement('button'); lb.className = 'floor-label'; lb.type = 'button'; lb.dataset.loc = loc; lb.textContent = FLOOR_NAME[loc]; lb.addEventListener('click', (e) => { e.stopPropagation(); switchFloor(loc); }); lb.addEventListener('pointerdown', (e) => { e.stopPropagation(); }); st.appendChild(lb); }
        lb.style.display = inB ? 'block' : 'none';
        lb.classList.toggle('active', rel === 0);
      }
      const plat = document.querySelector('#landmark-school .island-mount');
      if (plat) plat.classList.toggle('explode-open', inB);
      const host = document.querySelector('#landmark-school .island-mount-top');
      if (host) {
        ensureExplodeChrome('school', host, 'school', SCHOOL_PROJ, 4, EXPLODE_GAP);
        const pan = inB ? (({ school: _schoolPanCur, study: _studyPanCur, club: _clubPanCur })[cur] || 0) : 0;
        const topOff = -(3 - (active - 1)) * step;
        const roof = document.getElementById('school-roof');
        if (roof) { const rk = topOff.toFixed(1) + '/' + mode + '/' + Math.round(-pan * sc) + '/' + (fsOn ? 'F' : 'T'); if (roof.dataset.k !== rk) { roof.dataset.k = rk; roof.style.transition = 'opacity ' + dur + 'ms ease, transform ' + dur + 'ms ease'; roof.style.opacity = inB ? '0.55' : '0'; roof.style.transform = fsOn ? 'scale(' + (_fs.s || 0.3).toFixed(3) + ')' : 'translate(' + (-pan * sc).toFixed(1) + 'px, ' + topOff.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')'; } }
        const gd = document.getElementById('school-guides');
        if (gd) { const gk = topOff.toFixed(1) + '/' + mode + '/' + Math.round(-pan * sc) + '/' + (fsOn ? 'F' : 'T'); if (gd.dataset.k !== gk) { gd.dataset.k = gk; gd.style.transition = 'opacity ' + dur + 'ms ease, transform ' + dur + 'ms ease'; gd.style.opacity = inB ? '1' : '0'; gd.style.transform = fsOn ? 'scale(' + (_fs.s || 0.3).toFixed(3) + ')' : 'translate(' + (-pan * sc).toFixed(1) + 'px, ' + topOff.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')'; } }
      }
      fsWant('school', fsInside(['school', 'study', 'club']));
      if (_fs && _fs.key === 'school') fsMarkActive(inB ? cur : null);
    }
    function switchFloor(loc) {
      if (!SCHOOL_GROUP[loc]) return;
      if (typeof currentLoc === 'undefined' || !SCHOOL_GROUP[currentLoc]) return;
      if (loc === currentLoc) return;
      currentLoc = loc;
      currentState = 'idle';
      if (typeof playSound === 'function') playSound('click');
      if (typeof createFloatingText === 'function') createFloatingText(FLOOR_NAME[loc]);
      syncFloorStack();
    }
    window.switchFloor = switchFloor;
