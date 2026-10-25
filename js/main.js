/* ==========================================================================
   🎮 GBA SCHOLAR IDLE - MAIN GAME LOOP & BOOTSTRAP (v9.10.4)
   作息大腦、主循環、房租結算、版本控制與啟動初始化
   ========================================================================== */

    // ------------------------------------------
    // 核心循環 - Delta Tick Engine
    // ------------------------------------------
    let gameInterval = null;
    let lastSavedMinute = -1;

    function initGame() {
      loadGameData();
      applyEquippedSkins();

      const initialCoords = getCharacterCoords(currentLoc, currentState);
      const isFlipped = (currentLoc === 'school' || currentLoc === 'library') && currentState === 'studying';
      updateCharacterPositionAndScale(initialCoords.x, initialCoords.y, isFlipped);


      updateUI();


      startTicker();
      snapCameraToChar(); // v9.0 開機鏡頭直接落在小人所在地
      // v8.9.1：舊捲動相機 (開機/resize 自動捲到小人 + 滑鼠拖曳捲動) 全面退役——它與 transform 相機互打，會把置中的地圖整張捲走。相機只由 resizeMapScale/手勢引擎 (transform) 管理。

    }

    function startTicker() {
      if (gameInterval) clearInterval(gameInterval);
      gameInterval = setInterval(tick, 100);
    }

    function setSpeed(sp) {
      playSound('click');
      gameState.speed = sp;

      // 切換時間速度時，立刻恢復相機跟隨
      userScrolling = false;
      if (userScrollTimer) {
        clearTimeout(userScrollTimer);
        userScrollTimer = null;
      }

      document.querySelectorAll(".speed-control-mini .speed-btn").forEach(btn => btn.classList.remove("active"));

      const activeBtn = document.getElementById(`speed-${sp}x`);
      if (activeBtn) activeBtn.classList.add("active");

      const triggerLabel = document.getElementById("speed-trigger-label");
      if (triggerLabel) triggerLabel.textContent = sp + "x";

      startTicker();
    }

    function toggleSpeedPopover(ev) {
      if (ev) ev.stopPropagation();
      const pop = document.getElementById('speed-popover');
      if (!pop) return;
      const open = pop.classList.toggle('open');
      if (open) setTimeout(() => document.addEventListener('click', closeSpeedPopoverOnDoc, { once: true }), 0);
    }
    function closeSpeedPopoverOnDoc(e) {
      const pop = document.getElementById('speed-popover');
      const trg = document.getElementById('speed-trigger');
      if (pop && !pop.contains(e.target) && trg && !trg.contains(e.target)) pop.classList.remove('open');
    }
    function closeSpeedPopover() {
      const pop = document.getElementById('speed-popover');
      if (pop) pop.classList.remove('open');
    }

    // v9.0：人物移動改由 tick 沿路徑積分 (不再靠 CSS transition 猜時間)，
    // transition 只負責把每 100ms 一步的位移銜接順滑；倒數與腳步共用同一個剩餘距離，永不脫節。
    function updateCharTransition() {
      if (!elCharWrap) return;
      elCharWrap.style.transition = gameState.isCommuting
        ? 'left 0s, top 0s' // 通勤中由 rAF 逐格寫位置，不需要 (也不能有) CSS 過渡
        : 'left 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), top 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
    }

    // ---------- v9.0 通勤路徑引擎：出門 → 上馬路 → 沿路 → 進門 ----------
    const WALK_PX_PER_MIN = 80; // 步行速度 (世界像素/遊戲分鐘)：跨鎮約 24 分鐘、鄰棟約 7 分鐘
    let _camHoldUntil = 0;
    function buildCommutePath(fromLoc, toLoc) {
      const fromIdle = COORDS[fromLoc + '-idle'] || COORDS['home-idle'];
      const start = { x: gameState.currentX || fromIdle.x, y: gameState.currentY || fromIdle.y };
      const end = toLoc === 'home' ? { x: DOOR_X.home, y: 195 } : (COORDS[toLoc + '-idle'] || COORDS['home-idle']); // v9.14：回家路徑只到門口，室內由 stage 接手
      const fx = DOOR_X[fromLoc] || start.x, tx = DOOR_X[toLoc] || end.x;
      const raw = [start, { x: fx, y: DOOR_OUT_Y }, { x: fx, y: WALK_Y }, { x: tx, y: WALK_Y }, { x: tx, y: DOOR_OUT_Y }, end];
      const pts = [raw[0]];
      for (let i = 1; i < raw.length; i++) {
        const p = raw[i], q = pts[pts.length - 1];
        if (Math.abs(p.x - q.x) > 0.5 || Math.abs(p.y - q.y) > 0.5) pts.push(p);
      }
      return pts;
    }
    function pathTotalLength(pts) {
      let L = 0;
      for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      return L;
    }
    function sampleCommutePath(pts, dist) {
      let d = dist;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const seg = Math.hypot(b.x - a.x, b.y - a.y);
        if (d <= seg || i === pts.length - 1) {
          const t = seg === 0 ? 0 : Math.min(1, d / seg);
          return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, dx: b.x - a.x };
        }
        d -= seg;
      }
      const last = pts[pts.length - 1];
      return { x: last.x, y: last.y, dx: 0 };
    }
    function commutePxPerMin() { return WALK_PX_PER_MIN / (gameState.commuteSpeedMult || 1); }
    function startCommuteTo(targetLoc) {
      if (targetLoc !== 'home') gameState.deskStudy = false; // v9.14.4 離家就結束書桌自習
      if (currentLoc === 'home' && targetLoc !== 'home') { gameState.currentX = DOOR_X.home; gameState.currentY = 195; } // v9.14：離家先回到門口再出發（stage 同步關閉）
      if (gameState.isCommuting) return; // v9.1：通勤中不改道——大腦每 tick 都在決策，沒這道防線會半路重建路徑、把小人拉回起點門口 (測試實測會半路改去別棟)
      const pts = buildCommutePath(currentLoc, targetLoc);
      const total = pathTotalLength(pts);
      const shoesBonus = Math.max(0.4, 1 - (gameState.passive.shoes * 0.15));
      const speedsterMult = typeof getRebirthReduction === 'function' ? Math.max(0.3, 1 - ((rebirthData && rebirthData.bonuses ? rebirthData.bonuses.speedster : 0) || 0) * 0.10) : 1.0;
      gameState.commuteSpeedMult = shoesBonus * speedsterMult * (typeof setMoveMult === 'function' ? setMoveMult() : 1);
      gameState.commutePath = pts;
      gameState.commuteTotalPx = total;
      gameState.commuteDonePx = 0;
      gameState.isCommuting = true;
      gameState.commuteStart = currentLoc;
      gameState.commuteTarget = targetLoc;
      gameState.commuteMinutesTotal = total / WALK_PX_PER_MIN * gameState.commuteSpeedMult;
      gameState.commuteMinutesLeft = gameState.commuteMinutesTotal;
      currentState = 'commuting';
      _camAnchor = null; // 通勤開始：鏡頭改跟人
      _prevTickPos = { x: gameState.currentX || pts[0].x, y: gameState.currentY || pts[0].y, flip: false };
      _lastTickPos = { x: pts[0].x, y: pts[0].y, flip: false };
      _lastTickAt = performance.now();
      updateCharTransition();
      queueFloatingText('趕路中！🏃‍♂️💨');
    }
    function advanceCommute(progressMinutes) {
      if (!gameState.commutePath || !gameState.commutePath.length) { // 舊存檔中途讀取：重建路徑並以剩餘比例接續
        gameState.commutePath = buildCommutePath(gameState.commuteStart || currentLoc, gameState.commuteTarget || 'home');
        gameState.commuteTotalPx = pathTotalLength(gameState.commutePath);
        const ratio = gameState.commuteMinutesTotal ? 1 - (gameState.commuteMinutesLeft / gameState.commuteMinutesTotal) : 0;
        gameState.commuteDonePx = Math.max(0, Math.min(1, ratio)) * gameState.commuteTotalPx;
        if (!gameState.commuteSpeedMult) gameState.commuteSpeedMult = 1;
      }
      gameState.commuteDonePx += commutePxPerMin() * progressMinutes;
      const remainPx = Math.max(0, gameState.commuteTotalPx - gameState.commuteDonePx);
      gameState.commuteMinutesLeft = remainPx / commutePxPerMin(); // 倒數 = 剩餘距離換算，與腳步同源
      const s = sampleCommutePath(gameState.commutePath, gameState.commuteDonePx);
      // 只記 tick 快照；實際畫面由 rAF 在兩次快照間內插 (60fps)，邏輯與畫面永不超前/脫節
      _prevTickPos = _lastTickPos;
      _lastTickPos = { x: s.x, y: s.y, flip: s.dx < -0.5 };
      _lastTickAt = performance.now();
      return remainPx <= 0;
    }
    // ---------- v9.0.1 物理相機：Apple 式彈簧 (response/dampingFraction) + rAF 渲染迴圈 ----------
    // 舊版跟隨在 100ms 的遊戲 tick 上做 lerp，畫面只有 10fps 的階梯感。
    // 現在：tick 只負責邏輯與快照，rAF (60fps) 負責一切畫面運動——人物在快照間內插，
    // 鏡頭用帶速度的彈簧積分追趕目標 (有慣性、會自然減速，就像 iOS 的 spring 動畫)。
    let _prevTickPos = null, _lastTickPos = null, _lastTickAt = 0;
    let _visPos = null; // v9.10.4: 視覺位置平滑 (吸收 tick 抖動)
    let _leadPrev = null; const _leadVel = { x: 0, y: 0 }; // v9.15.2 鏡頭前饋用的平滑視覺速度
    let _camAnchor = null;     // 膠囊聚焦的世界座標錨點；null = 跟隨角色
    let _camZoomTarget = null; // 程式化縮放目標 (膠囊/雙擊)；null = 不介入
    let _camVX = 0, _camVY = 0, _camZV = 0;
    const CAM_RESPONSE = 0.5, CAM_ZETA = 0.86; // 0.5s 響應、近臨界阻尼：滑順、幾乎不超調
    function springStep(cur, vel, target, dt) {
      const k = Math.pow(2 * Math.PI / CAM_RESPONSE, 2);
      const c = 2 * CAM_ZETA * Math.sqrt(k);
      vel += (k * (target - cur) - c * vel) * dt;
      cur += vel * dt;
      if (Math.abs(target - cur) < 0.05 && Math.abs(vel) < 1.5) { cur = target; vel = 0; }
      return [cur, vel];
    }
    function snapCameraToChar() {
      const s = (window.__baseMapScale || 1) * mapZoom;
      _camAnchor = null; _camVX = 0; _camVY = 0;
      mapPanX = -((gameState.currentX || 175) - WORLD_W / 2) * s;
      mapPanY = -((gameState.currentY || 190) - WORLD_H / 2) * s;
      clampMapPan(); applyMapZoom();
    }
    let _renderPrevT = 0;
    function renderLoop(now) {
      requestAnimationFrame(renderLoop);
      const dt = Math.min(0.05, _renderPrevT ? (now - _renderPrevT) / 1000 : 0.016);
      _renderPrevT = now;
      const vp = document.getElementById('map-viewport');
      if (!vp || typeof gameState === 'undefined') return;
      // 1) 人物視覺位置：tick 快照間線性內插 (永不超前邏輯位置，所以倒數與腳步仍同源)
      if (gameState.isCommuting && _prevTickPos && _lastTickPos) {
        const t = Math.min(1, (performance.now() - _lastTickAt) / 100);
        const txp = _prevTickPos.x + (_lastTickPos.x - _prevTickPos.x) * t;
        const typ = _prevTickPos.y + (_lastTickPos.y - _prevTickPos.y) * t;
        if (!_visPos) _visPos = { x: txp, y: typ };
        const kk = Math.min(1, dt * 22);
        _visPos.x += (txp - _visPos.x) * kk;
        _visPos.y += (typ - _visPos.y) * kk;
        if (Math.abs(_visPos.x - txp) < 0.05) _visPos.x = txp;
        if (Math.abs(_visPos.y - typ) < 0.05) _visPos.y = typ;
        updateCharacterPositionAndScale(_visPos.x, _visPos.y, _lastTickPos.flip); // v9.15.2 不取整，次像素滑動不卡頓
      } else _visPos = null;
      if (_pointers.size > 0) return; // 玩家手指在控制鏡頭：彈簧讓路 (位置由手勢直接寫入)
      // 2) 決定鏡頭目標
      const s = (window.__baseMapScale || 1) * mapZoom;
      let tx, ty, hasTarget = false;
      if (_camAnchor) {
        tx = -(_camAnchor.x - WORLD_W / 2) * s; ty = -(_camAnchor.y - WORLD_H / 2) * s; hasTarget = true;
      } else {
        // v9.15.2：鏡頭改跟內插後的視覺位置（原本跟 100ms 才跳一次的邏輯位置，前饋又用每 tick 的瞬時位移估速度，
        // 路徑一轉彎目標就跳一下，彈簧追著跳躍目標 = 通勤時鏡頭一頓一頓）
        const cx = (gameState.isCommuting && _visPos) ? _visPos.x : (gameState.currentX || WORLD_W / 2);
        const cy = (gameState.isCommuting && _visPos) ? _visPos.y : (gameState.currentY || WORLD_H / 2);
        // 速度前饋：瞄準小人「即將到達」的位置，剛好抵銷彈簧追蹤等速目標時的穩態落後 (2ζ/ω 秒)
        let leadX = 0, leadY = 0;
        if (gameState.isCommuting && _visPos) {
          const LEAD = 2 * CAM_ZETA / (2 * Math.PI / CAM_RESPONSE);
          // 起步/抵達 300px 內把前饋漸漸收掉：起步不暴衝、抵達不衝過頭再回彈
          const edge = Math.min(gameState.commuteDonePx || 0, Math.max(0, (gameState.commuteTotalPx || 0) - (gameState.commuteDonePx || 0)));
          const taper = Math.max(0, Math.min(1, edge / 300));
          if (_leadPrev) {
            const ivx = (_visPos.x - _leadPrev.x) / Math.max(dt, 0.001);
            const ivy = (_visPos.y - _leadPrev.y) / Math.max(dt, 0.001);
            _leadVel.x += (ivx - _leadVel.x) * 0.12;
            _leadVel.y += (ivy - _leadVel.y) * 0.12;
          }
          _leadPrev = { x: _visPos.x, y: _visPos.y };
          leadX = _leadVel.x * LEAD * taper;
          leadY = _leadVel.y * LEAD * taper;
        } else { _leadPrev = null; _leadVel.x *= 0.8; _leadVel.y *= 0.8; }
        tx = -(cx + leadX - WORLD_W / 2) * s; ty = -(cy + leadY - WORLD_H / 2) * s;
        if (gameState.isCommuting) hasTarget = true;
        else if (Date.now() >= _camHoldUntil) {
          // 閒置跟隨：人物還在畫面中央 60% 內就不動，漂出去才跟
          const vx = vp.clientWidth / 2 + (cx - WORLD_W / 2) * s + mapPanX;
          const vy = vp.clientHeight / 2 + (cy - WORLD_H / 2) * s + mapPanY;
          hasTarget = Math.abs(vx - vp.clientWidth / 2) > vp.clientWidth * 0.3 || Math.abs(vy - vp.clientHeight / 2) > vp.clientHeight * 0.3;
        }
      }
      // 3) 彈簧積分 (pan 與程式化 zoom)，有變動才寫 transform
      let dirty = false;
      if (hasTarget) {
        const ox = mapPanX, oy = mapPanY;
        [mapPanX, _camVX] = springStep(mapPanX, _camVX, tx, dt);
        [mapPanY, _camVY] = springStep(mapPanY, _camVY, ty, dt);
        if (Math.abs(mapPanX - ox) > 0.01 || Math.abs(mapPanY - oy) > 0.01) dirty = true;
      }
      if (_camZoomTarget !== null) {
        const oz = mapZoom;
        [mapZoom, _camZV] = springStep(mapZoom, _camZV, _camZoomTarget, dt);
        if (Math.abs(mapZoom - _camZoomTarget) < 0.002) { mapZoom = _camZoomTarget; _camZV = 0; _camZoomTarget = null; }
        if (Math.abs(mapZoom - oz) > 0.0005) dirty = true;
      }
      if (dirty) { clampMapPan(); applyMapZoom(); }
    }
    requestAnimationFrame(renderLoop);

    // 一屏盡覽自動縮放適配
    // v8.6 量測頂部 HUD 與底部操作區的實際高度，把地圖舞台塞進中間的可用矩形，
    // 校園就 center 在「看得到的空位」裡，不再對著整個螢幕置中、上下留兩大片空白。
    function layoutMapInsets() {
      const rootEl = document.documentElement;
      if (window.innerWidth > 820 && !(window.innerWidth > window.innerHeight && window.innerHeight <= 520)) {
        rootEl.style.setProperty('--chrome-top', '0px');
        rootEl.style.setProperty('--chrome-bottom', '0px');
        return;
      }
      const header = document.querySelector('.floating-header');
      const controls = document.querySelector('.floating-controls');
      const nav = document.getElementById('room-nav');
      const top = header ? header.offsetHeight + 14 : 0;
      // v8.9.1: 改用實際螢幕位置量測 (rect.top)：取功能鈕列與房間膠囊列中較高者的上緣，
      // 地圖可用區保證不被任何一列遮住 (舊版用 offsetHeight 相加，橫向會算漏而壓到地圖)
      let bottom = 0;
      if (controls) bottom = Math.max(bottom, Math.round(window.innerHeight - controls.getBoundingClientRect().top) + 10);
      if (nav && getComputedStyle(nav).display !== 'none') bottom = Math.max(bottom, Math.round(window.innerHeight - nav.getBoundingClientRect().top) + 10);
      rootEl.style.setProperty('--chrome-top', top + 'px');
      rootEl.style.setProperty('--chrome-bottom', bottom + 'px');
    }

    function resizeMapScale() {
      layoutMapInsets();
      const vp = document.getElementById("map-viewport");
      const map = document.getElementById("town-map");
      if (!vp || !map) return;
      if (vp.scrollLeft !== 0) vp.scrollLeft = 0; // 保險：任何殘留捲動都歸零 (v9.10.4)
      if (vp.scrollTop !== 0) vp.scrollTop = 0;
      const availW = vp.clientWidth;
      const availH = vp.clientHeight;
      if (!availW || !availH) return;
      // v8.7 預設視角 = 嚴格 contain：整個校園在可用矩形裡一次看完、跟著螢幕尺寸縮放定位，
      // 不再放大溢出。想看細節用雙指縮放，或點底部房間膠囊直接放大跳到那一間。
      // v9.0 橫向捲軸：基準縮放讓畫面約涵蓋 720px 寬的世界 (約 2.3 棟建築)，其餘靠跟隨相機/拖曳探索
      const fit = Math.min(availW / 720, availH / 560, 1.25);
      let scale = Math.max(Math.min(fit, 1.25), 0.15);
      window.__baseMapScale = scale;
      try { if (mapZoom === 1) { mapPanX = 0; mapPanY = 0; } } catch (e) { }
      if (typeof clampMapPan === 'function') clampMapPan();
      if (typeof applyMapZoom === 'function') applyMapZoom();
      else map.style.transform = `scale(${scale})`;
    }
    window.addEventListener('resize', resizeMapScale);

    // 🗺️ v8.4 地圖手勢引擎：單指/滑鼠拖曳平移 (任何縮放下都可以，不必先捏合放大)、
    // 雙指捏合縮放、桌機滾輪縮放、雙擊重置；拖曳超過門檻會吞掉隨後的 click，避免拖完誤點房間。
    let mapZoom = 1, mapPanX = 0, mapPanY = 0;
    let _pointers = new Map(), _pinchDist0 = 0, _pinchZoom0 = 1, _dragMoved = 0, _suppressClickUntil = 0, _mapSetupDone = false;
    function applyMapZoom() {
      const map = document.getElementById('town-map');
      if (!map) return;
      const base = window.__baseMapScale || 1;
      map.style.transform = `translate(${mapPanX}px, ${mapPanY}px) scale(${base * mapZoom})`;
    }
    function clampMapPan() {
      const vp = document.getElementById('map-viewport');
      if (!vp) return;
      const s = (window.__baseMapScale || 1) * mapZoom;
      const mx = Math.max(0, (WORLD_W * s - vp.clientWidth) / 2) + 30;
      const my = Math.max(0, (WORLD_H * s - vp.clientHeight) / 2) + 30;
      mapPanX = Math.max(-mx, Math.min(mx, mapPanX));
      mapPanY = Math.max(-my, Math.min(my, mapPanY));
    }
    function centerMapOn(mapX, mapY) {
      const s = (window.__baseMapScale || 1) * mapZoom;
      _camAnchor = { x: mapX, y: mapY }; // v9.0.1：不瞬移，交給彈簧鏡頭滑過去
      _camVX = 0; _camVY = 0;
      clampMapPan(); applyMapZoom();
    }
    // 房間快捷導覽 (手機底部膠囊列)：把該房間滑到畫面中央並脈衝提示，玩家再點大房間派遣
    function focusLandmark(loc) {
      const centers = { home: [175, 118], store: [485, 118], restaurant: [795, 118], school: [1105, 118], library: [1415, 118], gym: [1732, 118] };
      const c = centers[loc];
      if (!c) return;
      if (mapZoom < 1.7) _camZoomTarget = 1.7; // v9.0.1 膠囊縮放也走彈簧，滑順放大到房間
      _camHoldUntil = Date.now() + 30000; // v9.14.4 手動操控後 30 秒不自動回追主角
      centerMapOn(c[0], c[1]);
      const el = document.getElementById('landmark-' + loc);
      if (el) { el.classList.remove('nav-pulse'); void el.offsetWidth; el.classList.add('nav-pulse'); }
      if (typeof playSound === 'function') playSound('click');
    }
    function setupMapPinchZoom() {
      if (_mapSetupDone) return;
      const vp = document.getElementById('map-viewport');
      if (!vp) return;
      _mapSetupDone = true;
      vp.addEventListener('pointerdown', (e) => {
        _camHoldUntil = Date.now() + 30000; // v9.14.4 手動看地圖時，跟隨相機先讓路 30 秒
        _camAnchor = null; _camZoomTarget = null; _camVX = 0; _camVY = 0;
        _pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (_pointers.size === 2) {
          const [a, b] = [..._pointers.values()];
          _pinchDist0 = Math.hypot(a.x - b.x, a.y - b.y); _pinchZoom0 = mapZoom; _dragMoved = 99;
        } else if (_pointers.size === 1) { _dragMoved = 0; }
      });
      vp.addEventListener('pointermove', (e) => {
        if (!_pointers.has(e.pointerId)) return;
        const prev = _pointers.get(e.pointerId);
        const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
        _pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (_pointers.size === 1) {
          _dragMoved += Math.abs(dx) + Math.abs(dy);
          if (_dragMoved > 6) { mapPanX += dx; mapPanY += dy; clampMapPan(); applyMapZoom(); }
        } else if (_pointers.size === 2 && _pinchDist0 > 0) {
          const [a, b] = [..._pointers.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > 0) mapZoom = Math.max(1, Math.min(3, _pinchZoom0 * (d / _pinchDist0)));
          clampMapPan(); applyMapZoom();
        }
      });
      const endPointer = (e) => {
        if (_pointers.delete(e.pointerId) && _dragMoved > 10) _suppressClickUntil = Date.now() + 350;
        if (_pointers.size < 2) _pinchDist0 = 0;
      };
      vp.addEventListener('pointerup', endPointer);
      vp.addEventListener('pointercancel', endPointer);
      vp.addEventListener('click', (e) => {
        if (Date.now() < _suppressClickUntil) { e.stopPropagation(); e.preventDefault(); }
      }, true);
      vp.addEventListener('wheel', (e) => {
        e.preventDefault();
        _camHoldUntil = Date.now() + 30000; _camAnchor = null; _camZoomTarget = null; _camVX = 0; _camVY = 0; // v9.14.4
        mapZoom = Math.max(1, Math.min(3, mapZoom * (e.deltaY < 0 ? 1.12 : 0.89)));
        clampMapPan(); applyMapZoom();
      }, { passive: false });
      vp.addEventListener('dblclick', () => { // v9.0.1：雙擊 = 彈簧滑回小人身上 (zoom 1)
        _camAnchor = null; _camZoomTarget = 1; _camHoldUntil = 0;
      });
    }


    // 遊戲時間推進 (推進 speed / 10 分鐘，1x 速度下 1 秒(10次tick) = 1 遊戲分鐘)
    function tick() {
      if (window._minigameOpen) return; // v9.15.2 玩小遊戲時遊戲時間凍結
      const progressMinutes = gameState.speed / 10;

      // 1. 處理通勤 (v9.0 路徑積分：位置與倒數同源，抵達與歸零同一刻)
      if (gameState.isCommuting) {
        if (advanceCommute(progressMinutes)) {
          gameState.isCommuting = false;
          gameState.commutePath = null;
          // 抵達瞬間把視覺位置定稿在終點快照 (rAF 內插的最後一小段直接收尾)，currentX/Y 不留半路值
          if (_lastTickPos) updateCharacterPositionAndScale(Math.round(_lastTickPos.x), Math.round(_lastTickPos.y), _lastTickPos.flip);
          _prevTickPos = null; _lastTickPos = null;
          currentLoc = gameState.commuteTarget;
          playSound('click');

          const locNames = { home: '住家', school: '學校', gym: '運動場', restaurant: '餐廳', library: '圖書館', store: '便利商店' };
          const locEmoji = { home: '🏡', school: '🏫', gym: '🏃', restaurant: '🍔', library: '📖', store: '🏪' };
          const name = locNames[currentLoc] || '未知地點';
          const emoji = locEmoji[currentLoc] || '📍';
          createFloatingText(`抵達 ${name} ${emoji}`);

          updateCharTransition();
        }
      }

      // 隨機搞笑發言觸發 (實時每 15 秒最多觸發一次，每次 tick 有 0.6% 的機率觸發，1x速度下平均 16 秒觸發一次)
      const nowRealTime = Date.now();
      if (!bubbleOverrideText && (nowRealTime - lastSpeechRealTime > 15000)) {
        if (Math.random() < 0.006) {
          triggerRandomSpeech();
          lastSpeechRealTime = nowRealTime;
        }
      }

      // 2. 累加時間
      gameState.minute += progressMinutes;

      while (gameState.minute >= 60) {
        gameState.minute -= 60;
        gameState.hour += 1;

        if (gameState.overrideAction) {
          // 機制 2：手動鎖定模式下，不進行倒數（鎖定直到手動解除）
          if (!isManualLocked) {
            gameState.overrideHoursLeft -= 1;
            if (gameState.overrideHoursLeft <= 0) {
              gameState.overrideAction = null;
              playSound('click');
              queueFloatingText("作息指令解除，恢復自動");
            }
          }
        }

        processHourlyState();
      }

      while (gameState.hour >= 24) {
        gameState.hour -= 24;
        gameState.dayOfWeek += 1;
        if (gameState.dayOfWeek > 7) {
          gameState.dayOfWeek = 1;
        }
        gameState.totalGameDays = (gameState.totalGameDays || 0) + 1;
        // v8.2 蹺課追蹤：剛結束的那一天是平日且整天沒進學校，連續天數 +1
        const _prevDow = gameState.dayOfWeek === 1 ? 7 : gameState.dayOfWeek - 1;
        if (_prevDow >= 1 && _prevDow <= 5) { gameState.skipSchoolDays = gameState._wentSchoolToday ? 0 : ((gameState.skipSchoolDays || 0) + 1); }
        gameState._wentSchoolToday = false;
        settleDailySalary();
        settleTownProsperityDividend();

        // 剛跨入週日 00:00，觸發週日父母彩蛋事件
        if (gameState.dayOfWeek === 7) {
          triggerSundayParentsEvent();
        }
      }

      // 3. 計算開關燈鎖定狀態
      calculateLocks();
      if (typeof updateHomeStage === 'function') updateHomeStage(); // v9.14

      // 4. 行為決策
      decideLocationAndState();
      processStudyTick(progressMinutes); // v9.12.12 放置型主成長：讀書每分鐘連續增長
      processDinnerTick(progressMinutes); // v9.13 晚餐同桌：飽足/減壓/專注連續入帳

      // 5. 畫面渲染
      updateLocksUI();
      updateCalendarUI();
      updateStatusBars();
      updateCharacterAnimation();
      updateSubjectBars();
      updateExamProgress();
      if (typeof updateNPCs === 'function') updateNPCs(progressMinutes); // v9.5 NPC 走動
      if (typeof updateSkyLighting === 'function') updateSkyLighting(); // v9.9 光影
      if (typeof checkSchoolBell === 'function') checkSchoolBell(); // v9.12 學校鐘聲/下課
      if (typeof updateSchoolBoard === 'function') updateSchoolBoard(); // v9.12.3 時鐘+黑板

      const currentMinInt = Math.floor(gameState.minute);
      if (currentMinInt % 10 === 0 && currentMinInt !== 0 && currentMinInt !== lastSavedMinute) {
        lastSavedMinute = currentMinInt;
        saveGameData();
      }
    }

    // 檢查學科是否需要複習 (任何學科的複習度小於 40)
    function needsLibraryReview() {
      for (let key in gameState.subjects) {
        if (gameState.subjects[key].home < 40) {
          return true;
        }
      }
      return false;
    }

    // 實時計算各場所的鎖定與開關燈
    function calculateLocks() {
      const isWeekend = (gameState.dayOfWeek === 6 || gameState.dayOfWeek === 7);

      // 平日上學時間不准回家
      homeLocked = (gameState.hour >= 8 && gameState.hour < 16 && !isWeekend);
      // 非上學時間與週末，學校關門
      schoolLocked = (isWeekend || gameState.hour < 8 || gameState.hour >= 16);

      // 餐廳營業時間 7:00 ~ 22:00
      restaurantLocked = (gameState.hour < 7 || gameState.hour >= 22);
      // 圖書館營業時間 8:00 ~ 21:00
      libraryLocked = (gameState.hour < 8 || gameState.hour >= 21);
      // 便利商店 24H 開放，僅平日強制上課時間 (8:00 ~ 16:00) 禁止打工
      storeLocked = (gameState.hour >= 8 && gameState.hour < 16 && !isWeekend);
    }


    // ------------------------------------------
    // 作息大腦
    // ------------------------------------------
    function decideLocationAndState() {
      const isWeekend = (gameState.dayOfWeek === 6 || gameState.dayOfWeek === 7);
      let targetLoc = currentLoc;

      if (gameState.overrideAction) {
        // 鎖定模式顯示不同文字
        if (isManualLocked) {
          elCalendarMode.innerText = `🔒 鎖定模式`;
        } else {
          elCalendarMode.innerText = `玩家干預中 (${gameState.overrideHoursLeft}h)`;
        }
        elCalendarMode.style.backgroundColor = "var(--secondary)";
        elCalendarMode.style.color = "white";

        switch (gameState.overrideAction) {
          case 'study-school':
            targetLoc = schoolLocked ? "home" : "school";
            break;
          case 'study-library':
            targetLoc = libraryLocked ? "home" : "library";
            break;
          case 'sports':
            targetLoc = "gym";
            break;
          case 'eat':
            targetLoc = restaurantLocked ? "home" : "restaurant";
            break;
          case 'work':
            targetLoc = storeLocked ? "school" : "store";
            break;
          case 'sleep':
            targetLoc = "home";
            break;
        }
      }
      else if (!isWeekend) {
        elCalendarMode.innerText = "自動作息模式";
        elCalendarMode.style.backgroundColor = "var(--card-bg)";
        elCalendarMode.style.color = "var(--text-color)";

        const h = gameState.hour;
        if (h === 18 && gameState.parentsStatus === 'alive' && !homeLocked) {
          targetLoc = "home"; // v9.13 晚餐優先於飢餓規則：18:00 回家同桌（家裡晚餐一樣補飽足）
        } else if (gameState.hunger < 35 && !restaurantLocked) {
          targetLoc = "restaurant";
        } else if (h === 12 && !restaurantLocked) {
          targetLoc = "restaurant"; // v9.12.8 午休吃飯：跟全校一起去食堂，不再自己留在教室聽講
        } else if (gameState.stress > 80) {
          targetLoc = "gym";
        } else {
          if (h >= 0 && h < 7) targetLoc = "home";
          else if (h >= 7 && h < 8) targetLoc = "restaurant";
          else if (h >= 8 && h < 16) targetLoc = "school";
          else if (h >= 16 && h < 18) {
            if (gameState.stress >= 50) targetLoc = "gym";
            else if (needsLibraryReview() && !libraryLocked) targetLoc = "library";
            else targetLoc = "home";
          }
          else if (h >= 18 && h < 19) targetLoc = "restaurant";
          else if (h >= 19 && h < 22) {
            if (needsLibraryReview() && !libraryLocked) targetLoc = "library";
            else targetLoc = "home";
          }
          else targetLoc = "home";
        }
      }
      else {
        elCalendarMode.innerText = "週末放假中 ☕";
        elCalendarMode.style.backgroundColor = "var(--accent)";
        elCalendarMode.style.color = "var(--text-color)";

        const h = gameState.hour;
        const upcomingRent = 30 + (gameState.gradeIndex * 10);
        if (h >= 0 && h < 8) {
          targetLoc = "home"; // 早晨安穩睡覺
        } else {
          // 週末智慧排程：若現金不夠繳下期房租且精力飽足健康，優先去超商打工賺錢！
          if (h === 18 && gameState.parentsStatus === 'alive') {
            targetLoc = "home"; // v9.13 週末晚餐也回家同桌
          } else if (gameState.hunger < 45 && !restaurantLocked) {
            targetLoc = "restaurant";
          } else if (gameState.stress > 60) {
            targetLoc = "gym";
          } else if (gameState.money < upcomingRent && gameState.energy > 40 && gameState.hunger >= 45 && gameState.stress <= 65 && !storeLocked) {
            targetLoc = "store";
          } else if (needsLibraryReview() && !libraryLocked && gameState.energy > 30) {
            targetLoc = "library"; // 能量夠且有需要就去圖書館補課
          } else if (!libraryLocked && gameState.energy > 50) {
            targetLoc = "library"; // 即使都滿了也繼續自修
          } else if (gameState.energy < 30) {
            targetLoc = "home"; // 太累了回家歇息
          } else {
            targetLoc = "home";
          }
        }
      }

      // v9.12.10 用餐保護：已經在餐廳點餐/等菜，或上菜未滿 15 分鐘，不被排程叫走（午餐 13:00 邊界同理）
      if (currentLoc === "restaurant" && !restaurantLocked && gameState.eatPhase) {
        const _absM = (gameState.totalGameDays || 0) * 1440 + gameState.hour * 60 + gameState.minute;
        if (gameState.eatPhase === 'order' || (gameState.eatPhase === 'wait' && !gameState.eatServed) || (gameState.eatServed && (gameState._servedAtMin == null || _absM - gameState._servedAtMin < 15))) targetLoc = "restaurant";
      }

      // 檢查目的地是否已被時間鎖定（避免自動作息時卡入死鎖，自動修正目的地）
      if (targetLoc === "home" && homeLocked) {
        targetLoc = "school"; // 強制去學校 (平日上學)
      }
      if (targetLoc === "school" && schoolLocked) {
        targetLoc = "home"; // 放學回家
      }
      if (targetLoc === "restaurant" && restaurantLocked) {
        targetLoc = "home"; // 餐廳打烊去住家
      }
      if (targetLoc === "library" && libraryLocked) {
        targetLoc = "home"; // 圖書館打烊去住家
      }
      if (targetLoc === "store" && storeLocked) {
        targetLoc = "school"; // 平日上課時間強制去學校
      }

      if (gameState.isCommuting) {
        currentState = "commuting";
        return;
      }

      if (gameState.deskStudy) { // v9.14.4 書桌自習：體力/飢餓/深夜自動解除，否則留在家裡讀書
        if (gameState.energy < 12 || gameState.hunger < 18 || gameState.hour >= 23 || gameState.hour < 5) gameState.deskStudy = false;
        else targetLoc = 'home';
      }
      if (currentLoc === targetLoc) {
        if (currentLoc === "school") {
          currentState = (gameState.stress >= 85) ? "angry" : ((typeof schoolPhaseNow === 'function' && schoolPhaseNow() === 'break') ? "idle" : "studying"); // v9.12 下課離席放鬆
        }
        else if (currentLoc === "gym") {
          currentState = "sports";
        }
        else if (currentLoc === "restaurant") {
          currentState = "eating";
        }
        else if (currentLoc === "library") {
          currentState = "studying";
        }
        else if (currentLoc === "store") {
          currentState = "working";
        }
        else if (currentLoc === "home") {
          currentState = (gameState.hour === 18 && gameState.energy >= 30 && gameState.overrideAction !== 'sleep') ? "dinner" // v9.13 晚餐同桌
            : (gameState.energy < 30 || gameState.hour >= 22 || gameState.hour < 7 || (gameState.overrideAction === 'sleep')) ? "sleeping"
            : (gameState.deskStudy && gameState.energy >= 30) ? "studying" : "idle"; // v9.14.4 書桌自習
        }
      }
      else {
        // v9.0：通勤時間由真實路徑長度決定 (出門→馬路→進門)，見 startCommuteTo
        startCommuteTo(targetLoc);
      }
    }

    function getCharacterCoords(loc, state) {
      if (loc === 'home') {
        if (state === 'sleeping') return COORDS['home-sleep'];
        if (state === 'dinner') return COORDS['home-dinner']; // v9.13
        if (state === 'studying' && gameState.deskStudy) return COORDS['home-desk']; // v9.14.4
        return COORDS['home-idle'];
      }
      if (loc === 'school') {
        if (state === 'studying') return COORDS['school-class'];
        return COORDS['school-idle'];
      }
      if (loc === 'restaurant') {
        if (state === 'eating') return COORDS['restaurant-eat'];
        return COORDS['restaurant-idle'];
      }
      if (loc === 'library') {
        if (state === 'studying') return COORDS['library-study'];
        return COORDS['library-idle'];
      }
      if (loc === 'gym') {
        if (state === 'sports') return COORDS['gym-run'];
        return COORDS['gym-idle'];
      }
      if (loc === 'store') {
        if (state === 'working') return COORDS['store-work'];
        return COORDS['store-idle'];
      }
      return COORDS['home-idle'];
    }

    function processHourlyState() {
      if (currentState !== 'studying') gameState.focus = Math.max(0, (gameState.focus || 0) - 22); // v9.1 專注流失
      // v8.2 成就追蹤器 (過去這些成就沒有任何判定來源)
      if ((currentLoc === 'school' || currentLoc === 'library') && currentState === 'studying') gameState.studyStreakHours = (gameState.studyStreakHours || 0) + 1; else gameState.studyStreakHours = 0;
      if (currentLoc === 'school') gameState._wentSchoolToday = true;
      if (currentState === 'eating') { if (gameState._eatDay !== gameState.totalGameDays) { gameState._eatDay = gameState.totalGameDays; gameState.eatsToday = 0; } gameState.eatsToday = (gameState.eatsToday || 0) + 1; }
      if (currentState === 'angry') { if (gameState._angerDay !== gameState.totalGameDays) { gameState._angerDay = gameState.totalGameDays; gameState.angerToday = 0; } gameState.angerToday = (gameState.angerToday || 0) + 1; }
      if (currentState === 'sports') { if (gameState._sportDay !== gameState.totalGameDays) { gameState._sportDay = gameState.totalGameDays; gameState.sportsHoursToday = 0; } gameState.sportsHoursToday = (gameState.sportsHoursToday || 0) + 1; }
      if (currentState === 'working') { if (gameState._workDay !== gameState.totalGameDays) { gameState._workDay = gameState.totalGameDays; gameState.workHoursToday = 0; } gameState.workHoursToday = (gameState.workHoursToday || 0) + 1; }
      // v9.1 好友同行：同場做同件事 → 每小時消耗 1 小時額度，額外好感與小加成
      { const co = gameState.coInvite;
        if (co && co.left > 0 && !gameState.isCommuting && co.loc === currentLoc &&
            ((co.loc === 'school' && currentState === 'studying') || (co.loc === 'library' && currentState === 'studying') ||
             (co.loc === 'gym' && currentState === 'sports') || (co.loc === 'restaurant' && currentState === 'eating'))) {
          co.left -= 1;
          gainFriendAffinity(co.friend, 1, true);
          if (co.loc === 'gym') gameState.stress = Math.max(0, gameState.stress - 3);
          if (co.loc === 'restaurant') gameState.hunger = Math.min(100, gameState.hunger + 8);
          if (co.left <= 0) queueFloatingText('💞 同行時間結束，下次再約！');
        } }
      if (gameState.stress <= 0) gameState.zeroStressHours = (gameState.zeroStressHours || 0) + 1; else gameState.zeroStressHours = 0;
      // 同場景好友陪伴好感度自動成長
      if (!gameState.isCommuting && typeof gainFriendAffinity === 'function') {
        // v8.2 平衡：被動好感由 2-3/h 降為 1/h — 原本曉萱約 7 天自動滿 Lv.3，聊天/送禮完全多餘
        if (currentLoc === 'school' && currentState === 'studying') gainFriendAffinity('xiaoxuan', 1, true);
        else if (currentLoc === 'gym' && currentState === 'sports') gainFriendAffinity('dameng', 1, true);
        else if (currentLoc === 'library' && currentState === 'studying') gainFriendAffinity('yuqing', 1, true);
        else if ((currentLoc === 'restaurant' && currentState === 'eating') || (currentLoc === 'store' && currentState === 'working')) gainFriendAffinity('xiaohao', 1, true);
      }

      const staminaRed = typeof getRebirthReduction === 'function' ? getRebirthReduction('stamina') : 1.0;
      const appetiteRed = typeof getRebirthReduction === 'function' ? getRebirthReduction('appetite') : 1.0;
      const mentalRed = typeof getRebirthReduction === 'function' ? getRebirthReduction('mental') : 1.0;
      const hungerMut = typeof getMutationMult === 'function' ? getMutationMult('hunger_drain') : 1.0;
      const stressMut = typeof getMutationMult === 'function' ? getMutationMult('stress_gain') : 1.0;

      // 🏛️ 6 大島嶼營造等級加成
      const schoolLv = getLandmarkLevel('school');
      const restLv = getLandmarkLevel('restaurant');
      const gymLv = getLandmarkLevel('gym');
      const libLv = getLandmarkLevel('library');
      const storeLv = getLandmarkLevel('store');
      const homeLv = getLandmarkLevel('home');

      if (currentState !== "sleeping") {
        gameState.energy = Math.max(0, gameState.energy - 3 * gameState.difficulty * staminaRed);
      }
      if (currentState !== "eating") {
        gameState.hunger = Math.max(0, gameState.hunger - 4 * gameState.difficulty * appetiteRed * hungerMut);
      }

      if (currentState === "sleeping") {
        const sleepBuff = typeof getBuffMultiplier === 'function' ? getBuffMultiplier('sleep_boost') : 1.0;
        const energyMut = typeof getMutationMult === 'function' ? getMutationMult('energy_recover') : 1.0;
        const homeEnergyBase = homeLv === 3 ? 40 : (homeLv === 2 ? 25 : 15);
        gameState.energy = Math.min(100, gameState.energy + homeEnergyBase * sleepBuff * energyMut * (1 + (gameState.homeDecor || 0) * 0.04)); // v9.1 裝潢加成
        const homeStressBonus = homeLv === 3 ? 5 : (homeLv === 2 ? 2 : 0);
        if (gameState.parentsStatus === 'alive') {
          gameState.stress = Math.max(0, gameState.stress - (3 + homeStressBonus));
        } else {
          gameState.stress = Math.max(0, gameState.stress - (8 + homeStressBonus));
        }
      }
      else if (currentState === "eating") {
        const eatBuff = typeof getBuffMultiplier === 'function' ? getBuffMultiplier('eat_boost') : 1.0;
        const restHungerBase = restLv === 3 ? 85 : (restLv === 2 ? 60 : 45);
        gameState.hunger = Math.min(100, gameState.hunger + restHungerBase * eatBuff);
        const restStressBase = restLv === 3 ? 8 : (restLv === 2 ? 4 : 2);
        gameState.stress = Math.max(0, gameState.stress - restStressBase);
        if (restLv === 3) {
          gameState.energy = Math.min(100, gameState.energy + 10);
        }
      }
      else if (currentState === "sports") {
        let shoesBonus = 1 + (gameState.passive.shoes * 0.2);
        const sportBuff = typeof getBuffMultiplier === 'function' ? getBuffMultiplier('sport_boost') : 1.0;
        const sportMut = typeof getMutationMult === 'function' ? getMutationMult('sport_stress') : 1.0;
        const damengStressMult = typeof getFriendBonus === 'function' ? getFriendBonus('gym_stress') : 1.0;
        const damengEnergyMult = typeof getFriendBonus === 'function' ? getFriendBonus('gym_energy_save') : 1.0;
        const gymStressBase = gymLv === 3 ? 50 : (gymLv === 2 ? 35 : 25);
        const gymEnergyMult = gymLv === 3 ? 0.6 : (gymLv === 2 ? 0.8 : 1.0);

        gameState.stress = Math.max(0, gameState.stress - gymStressBase * shoesBonus * sportBuff * sportMut * damengStressMult);
        gameState.energy = Math.max(0, gameState.energy - 5 * gameState.difficulty * staminaRed * damengEnergyMult * gymEnergyMult);
        gameState.hunger = Math.max(0, gameState.hunger - 6 * gameState.difficulty * appetiteRed);
      }
      else if (currentState === "working") {
        // 🏪 便利商店打工結算
        const baseWage = 18 + (gameState.gradeIndex * 6);
        const workBuff = typeof getBuffMultiplier === 'function' ? getBuffMultiplier('work_boost') : 1.0;
        const salaryMut = typeof getMutationMult === 'function' ? getMutationMult('salary') : 1.0;
        const xiaohaoWageMult = typeof getFriendBonus === 'function' ? getFriendBonus('store_wage') : 1.0;
        const storeWageMult = storeLv === 3 ? 1.80 : (storeLv === 2 ? 1.35 : 1.0);

        const hourlyWage = Math.max(5, Math.round(baseWage * workBuff * salaryMut * xiaohaoWageMult * storeWageMult * (typeof setWageMult === 'function' ? setWageMult() : 1)));
        gameState.money += hourlyWage;
        gameState.totalLifetimeEarnings = (gameState.totalLifetimeEarnings || 0) + hourlyWage;
        gameState.workHoursTotal = (gameState.workHoursTotal || 0) + 1;

        gameState.stress = Math.min(100, gameState.stress + 4 * gameState.difficulty * mentalRed * stressMut);
        gameState.energy = Math.max(0, gameState.energy - 2 * gameState.difficulty * staminaRed);

        const bentoChance = storeLv >= 2 ? 0.45 : 0.30;
        if (Math.random() < bentoChance) {
          gameState.hunger = Math.min(100, gameState.hunger + 25);
          queueFloatingText(`🏪 打工 +$${hourlyWage} | 🍱 店長請吃報廢便當 (飽足+25)`);
        } else {
          queueFloatingText(`🏪 超商打工時薪 +$${hourlyWage}`);
        }
        if (storeLv === 3 && Math.random() < 0.15) {
          gameState.bag.drink = (gameState.bag.drink || 0) + 1;
          queueFloatingText(`🏪 超商金牌員工獎勵！獲得免費精力飲料 🧃`);
        }
        playSound('buy');
      }
      else if (currentState === "studying") {
        // v9.1 專注度：連續讀書累積 (最高效率 +50%)，中斷就流失 —— 讀書要有「進入狀況」的節奏
        if (gameState._studyDay !== gameState.totalGameDays) { gameState._studyDay = gameState.totalGameDays; gameState.studyHoursToday = 0; }
        gameState.studyHoursToday = (gameState.studyHoursToday || 0) + 1;
        if (typeof bumpWeekly === 'function') bumpWeekly('study'); // v9.3 本週目標
        const prevFocusTier = Math.floor((gameState.focus || 0) / 35);
        gameState.focus = Math.min(100, (gameState.focus || 0) + 14);
        const newFocusTier = Math.floor(gameState.focus / 35);
        if (newFocusTier > prevFocusTier) queueFloatingText(newFocusTier >= 2 ? '🔥 燃燒專注！學習效率 +50%' : '✨ 進入專注狀態！學習效率提升');
        const focusMult = 1 + gameState.focus / 200;
        if (Math.random() < 0.12 && typeof triggerRandomEvent === 'function' && typeof STUDY_EVENTS_POOL !== 'undefined') {
          triggerRandomEvent(STUDY_EVENTS_POOL[Math.floor(Math.random() * STUDY_EVENTS_POOL.length)]);
        }
        let efficiency = 1.0;
        if (gameState.energy < 20) efficiency *= 0.2;
        else if (gameState.hunger < 30) efficiency *= 0.5;

        const smartMult = typeof getRebirthMult === 'function' ? getRebirthMult('smartness') : 1.0;
        const studyMut = typeof getMutationMult === 'function' ? getMutationMult('study_gain') : 1.0;
        const yuqingStressMult = typeof getFriendBonus === 'function' ? getFriendBonus('study_stress_save') : 1.0;

        if (currentLoc === "school") {
          const headphoneBonus = 1 + ((gameState.passive.headphone || 0) * 0.10);
          const studyBuff = typeof getBuffMultiplier === 'function' ? getBuffMultiplier('study_boost') : 1.0;
          const xiaoxuanMult = typeof getFriendBonus === 'function' ? getFriendBonus('school_eff') : 1.0;
          const schoolMult = schoolLv === 3 ? 1.60 : (schoolLv === 2 ? 1.25 : 1.0);
          /* v9.12.12 知識增長改由 processStudyTick 每分鐘連續累積（放置型主成長），此處不再整點結算 */
          gameState.stress = Math.min(100, gameState.stress + 5 * gameState.difficulty * mentalRed * stressMut * yuqingStressMult);
        } else if (currentLoc === "library") {
          let bookBonus = 1 + (gameState.passive.book * 0.2) + ((gameState.passive.tablet || 0) * 0.3);
          const reviewBuff = typeof getBuffMultiplier === 'function' ? getBuffMultiplier('review_boost') : 1.0;
          const memMult = typeof getRebirthMult === 'function' ? getRebirthMult('memory') : 1.0;
          const libMut = typeof getMutationMult === 'function' ? getMutationMult('library_eff') : 1.0;
          const yuqingMult = typeof getFriendBonus === 'function' ? getFriendBonus('library_eff') : 1.0;
          const libEffMult = libLv === 3 ? 1.75 : (libLv === 2 ? 1.30 : 1.0);
          const libStressDiv = libLv === 3 ? 0.5 : 1.0;
          /* v9.12.12 同上：圖書館增長改每分鐘連續累積 */
          gameState.stress = Math.min(100, gameState.stress + 8 * gameState.difficulty * mentalRed * stressMut * yuqingStressMult * libStressDiv);
        }
      }
      else if (currentState === "angry") {
        gameState.stress = Math.min(100, gameState.stress + 2);
      }
      if (typeof tickRivalsHourly === 'function') tickRivalsHourly(); // v9.3 宿敵
      if (typeof evaluateDailyQuests === 'function') evaluateDailyQuests(); // v9.1
    }

    // v9.13 晚餐同桌效果：坐在餐桌旁連續入帳（有家人同桌＝完整效果；一個人吃＝減半）
    function processDinnerTick(progressMinutes) {
      if (currentState !== 'dinner') return;
      const fam = (gameState.npcs || []).some(n => n.kind === 'parent' && n.atDinner && n.state === 'seated');
      const rate = fam ? 1 : 0.5;
      gameState.hunger = Math.min(100, gameState.hunger + 50 * rate * progressMinutes / 60);
      gameState.stress = Math.max(0, gameState.stress - 15 * rate * progressMinutes / 60);
      gameState.focus = Math.min(100, (gameState.focus || 0) + 10 * rate * progressMinutes / 60);
      gameState._dinnerMin = (gameState._dinnerMin || 0) + progressMinutes;
      if (gameState._dinnerMin >= 25 && gameState._dinnerDoneDay !== gameState.totalGameDays) {
        gameState._dinnerDoneDay = gameState.totalGameDays;
        if (gameState._eatDay !== gameState.totalGameDays) { gameState._eatDay = gameState.totalGameDays; gameState.eatsToday = 0; }
        gameState.eatsToday = (gameState.eatsToday || 0) + 1;
        if (fam) {
          queueFloatingText('🍚 吃飽了！媽媽的味道，壓力一掃而空');
          if (Math.random() < 0.35) { const amt = 10 + Math.floor(Math.random() * 21); gameState.money += amt; queueFloatingText(`💰 爸爸偷偷塞了零用錢 +$${amt}`); }
        } else queueFloatingText('🍚 一個人吃完晚餐了');
      }
    }

    // v9.12.12 放置型主成長：讀書不再等整點結算（學校每節下課都卡在整點邊界，舊制幾乎永遠領不到），
    // 改為每 tick 依遊戲分鐘連續累積（速率與舊制相同：每小時約 (2~4)×效率，取期望 3），滿 1 點即入帳最低科目。
    // 知識泡泡維持額外獎勵（+1/顆＋連擊加速本函數的累積速率）。
    function processStudyTick(progressMinutes) {
      if (currentState !== 'studying') return;
      if (currentLoc !== 'school' && currentLoc !== 'library' && !(currentLoc === 'home' && gameState.deskStudy)) return;
      let efficiency = 1.0;
      if (gameState.energy < 20) efficiency *= 0.2;
      else if (gameState.hunger < 30) efficiency *= 0.5;
      if (efficiency <= 0) return;
      const focusMult = 1 + (gameState.focus || 0) / 200;
      const smartMult = typeof getRebirthMult === 'function' ? getRebirthMult('smartness') : 1.0;
      const studyMut = typeof getMutationMult === 'function' ? getMutationMult('study_gain') : 1.0;
      const combo = typeof comboMult === 'function' ? comboMult() : 1;
      const setMult = typeof setStudyMult === 'function' ? setStudyMult() : 1;
      const coMult = (gameState.coInvite && gameState.coInvite.loc === currentLoc && gameState.coInvite.left > 0) ? 1.25 : 1;
      let type, mult;
      if (currentLoc === 'school') {
        let lv = 1; try { lv = getLandmarkLevel('school'); } catch (e) { }
        const headphoneBonus = 1 + ((gameState.passive.headphone || 0) * 0.10);
        const studyBuff = typeof getBuffMultiplier === 'function' ? getBuffMultiplier('study_boost') : 1.0;
        const xiaoxuanMult = typeof getFriendBonus === 'function' ? getFriendBonus('school_eff') : 1.0;
        const schoolMult = lv === 3 ? 1.60 : (lv === 2 ? 1.25 : 1.0);
        mult = headphoneBonus * studyBuff * xiaoxuanMult * schoolMult; type = 'school';
      } else if (currentLoc === 'library') {
        let lv = 1; try { lv = getLandmarkLevel('library'); } catch (e) { }
        let bookBonus = 1 + (gameState.passive.book * 0.2) + ((gameState.passive.tablet || 0) * 0.3);
        const reviewBuff = typeof getBuffMultiplier === 'function' ? getBuffMultiplier('review_boost') : 1.0;
        const memMult = typeof getRebirthMult === 'function' ? getRebirthMult('memory') : 1.0;
        const libMut = typeof getMutationMult === 'function' ? getMutationMult('library_eff') : 1.0;
        const yuqingMult = typeof getFriendBonus === 'function' ? getFriendBonus('library_eff') : 1.0;
        const libEffMult = lv === 3 ? 1.75 : (lv === 2 ? 1.30 : 1.0);
        mult = bookBonus * reviewBuff * memMult * libMut * yuqingMult * libEffMult; type = 'library';
      } else { // v9.14.4 在家書桌：只有書本/平板加成
        mult = 1 + (gameState.passive.book * 0.2) + ((gameState.passive.tablet || 0) * 0.3); type = 'library';
      }
      gameState._studyFrac = (gameState._studyFrac || 0) + 3 * efficiency * focusMult * smartMult * studyMut * combo * setMult * coMult * mult * (progressMinutes / 60);
      if (gameState._studyFrac < 1) return;
      const propKey = type === 'school' ? 'school' : 'home';
      const limit = type === 'school' ? 60 : 40;
      const subKeys = ['cn', 'en', 'ma', 'sc', 'so'];
      const gained = {};
      while (gameState._studyFrac >= 1) {
        let targetKey = null, minScore = Infinity;
        for (const k of subKeys) { const sc = gameState.subjects[k][propKey]; if (sc < limit && sc < minScore) { minScore = sc; targetKey = k; } }
        if (!targetKey) { gameState._studyFrac = 0; break; }
        gameState.subjects[targetKey][propKey] = Math.min(limit, gameState.subjects[targetKey][propKey] + 1);
        gained[targetKey] = (gained[targetKey] || 0) + 1;
        gameState._studyFrac -= 1;
      }
      for (const k in gained) {
        if (typeof spawnKnowledgeOrb === 'function') spawnKnowledgeOrb(k);
        queueFloatingText(`+${gained[k]} ${gameState.subjects[k].name}${type === 'school' ? '聽講' : '複習'}`);
      }
    }

    // 機制 1：均勻學科增長（永遠找最低分的科目）
    function gainKnowledge(type, efficiency) {
      if (efficiency <= 0) return;

      const subKeys = ['cn', 'en', 'ma', 'sc', 'so'];
      const limit = type === 'school' ? 60 : 40;
      const propKey = type === 'school' ? 'school' : 'home';

      // 找分數最低且尚未到上限的科目優先增長
      let targetKey = null;
      let minScore = Infinity;
      for (const k of subKeys) {
        const score = gameState.subjects[k][propKey];
        if (score < limit && score < minScore) {
          minScore = score;
          targetKey = k;
        }
      }

      if (!targetKey) {
        // 所有科目已達上限
        queueFloatingText('🌟 所有學科已達滿分！');
        return;
      }

      const sub = gameState.subjects[targetKey];
      const baseGain = Math.round((2 + Math.random() * 2) * efficiency);
      if (baseGain <= 0) return;

      const gainLabel = type === 'school' ? '聽講' : '複習';
      sub[propKey] = Math.min(limit, sub[propKey] + baseGain);
      if (typeof spawnKnowledgeOrb === 'function') spawnKnowledgeOrb(targetKey);
      queueFloatingText(`+${baseGain} ${sub.name}${gainLabel}`);
      playSound('levelUp');
    }

    function settleDailySalary() {
      let totalScore = 0;
      for (let key in gameState.subjects) {
        totalScore += (gameState.subjects[key].school + gameState.subjects[key].home);
      }
      const salaryMut = typeof getMutationMult === 'function' ? getMutationMult('salary') : 1.0;
      const friendAllowance = typeof getFriendBonus === 'function' ? getFriendBonus('daily_allowance') : 0;
      const dailyBonus = Math.round((10 + Math.floor(totalScore / 10) + friendAllowance) * salaryMut);
      // v9.1 生活費：隨年級與小鎮繁榮成長，後期不再只進不出 (金額不大，是壓力來源之一)
      let totalLevels = 0; try { totalLevels = ['home', 'store', 'restaurant', 'school', 'library', 'gym'].reduce((s, k) => s + getLandmarkLevel(k), 0); } catch (e) { }
      const livingCost = 8 + gameState.gradeIndex * 8 + totalLevels * 2;
      gameState.money += dailyBonus - livingCost;
      gameState.totalLifetimeEarnings = (gameState.totalLifetimeEarnings || 0) + dailyBonus;
      updateUI();
      saveGameData(); // 立即存檔，確保零用錢累積
      queueFloatingText(`📅 每日結算：零用錢 +$${dailyBonus}・生活費 −$${livingCost}`);
      playSound('buy');
    }

    // 週日隨機父母彩蛋事件
    function triggerSundayParentsEvent() {
      if (!gameState.parentsStatus) gameState.parentsStatus = 'alive';

      if (gameState.parentsStatus === 'alive') {
        // 年級越高，父母出事的機率越高
        // 幼兒園 (gradeIndex=0) 為 5%，博士 (gradeIndex=6) 為 89%
        const deathMut = typeof getMutationMult === 'function' ? getMutationMult('parent_death') : 1.0;
        const accidentProb = (0.05 + gameState.gradeIndex * 0.14) * deathMut;

        if (Math.random() < accidentProb) {
          const accidents = [
            {
              status: 'dead_natural',
              reason: '父母因為太老，安詳地自然死亡了...👵👴'
            },
            {
              status: 'divorced',
              reason: '父母吵架離婚，各奔東西了...💔'
            },
            {
              status: 'ran_away',
              reason: '父母決定離家出走，去尋找生命的真諦了...🏃‍♂️🏃‍♀️'
            },
            {
              status: 'car_accident',
              reason: '父母過馬路時被急躁的外送車撞飛了...🚗💨'
            },
            {
              status: 'too_dumb',
              reason: '父母因為算不出你的微積分作業，太笨被笨死了...🧠❌'
            }
          ];

          const event = accidents[Math.floor(Math.random() * accidents.length)];
          gameState.parentsStatus = event.status;
          gameState.parentsStatusReason = event.reason; // 記錄原因
          gameState.parentsRebornReason = ''; // 清空復活原因
          playSound('examFail');

          setTimeout(() => {
            queueFloatingText(`⚠️ 突發事件！父母出事了，請回住家點擊立牌查看原因`);
          }, 1000);
        }
      } else {
        // 如果父母不在了，每週日有 35% 的機率觸發奇蹟復活
        const reviveMut = typeof getMutationMult === 'function' ? getMutationMult('parent_revive') : 1.0;
        if (Math.random() < 0.35 * reviveMut) {
          const revivals = [
            "爸媽破鏡重圓再婚了，重新搬回來住！💍",
            "遇到耶穌顯靈，爸媽神蹟般復活了！⛪✨",
            "以前只是假死，爸媽自己從棺材裡爬出來了！⚰️😂"
          ];

          const reason = revivals[Math.floor(Math.random() * revivals.length)];
          gameState.parentsStatus = 'alive';
          gameState.parentsRebornReason = reason; // 記錄復活原因
          gameState.parentsStatusReason = ''; // 清空出事原因
          playSound('examSuccess');

          setTimeout(() => {
            queueFloatingText(`✨ 奇蹟事件！父母復活了，請回住家點擊獎狀查看原因`);
          }, 1000);
        }
      }

      updateUI();
      saveGameData();
    }


    // ==========================================
    // 💰 經濟擴充
    // ==========================================
    function checkRent() {
      // 每 7 遊戲天收一次房租
      if (!gameState.lastRentDay) gameState.lastRentDay = 0;
      const daysSinceRent = (gameState.totalGameDays || 0) - gameState.lastRentDay;
      if (daysSinceRent >= 7) {
        const rent = 30 + (gameState.gradeIndex * 10);
        if (gameState.money >= rent) {
          gameState.money -= rent;
          queueFloatingText(`🏠 繳納房租 -$${rent}`);
        } else {
          gameState.stress = Math.min(100, gameState.stress + 10);
          queueFloatingText(`🏠 繳不起房租！壓力 +10（週末可去便利商店打工賺錢喔！）`);
        }
        gameState.lastRentDay = gameState.totalGameDays;
      }
    }

    // ==========================================
    // 更新 updateSaveTimestamp 中的版號
    // ==========================================
    const _origUpdateSaveTimestamp = typeof updateSaveTimestamp === 'function' ? updateSaveTimestamp : null;

    // 在 initGame 中呼叫
    const _origInitGame = initGame;
    function patchedInitGame() {
      loadAchievements();
      loadRebirthData();
      _origInitGame();
      updateBuffDisplay();
      updateMiniGameTriggers();
      renderFriendsList();
      updateLandmarkVisuals();
      resizeMapScale();
      if (typeof setupMapPinchZoom === 'function') setupMapPinchZoom();
      const _soundBtn = document.getElementById('btn-sound-toggle');
      if (_soundBtn && typeof soundEnabled !== 'undefined') _soundBtn.innerText = soundEnabled ? '🔊 音效：開' : '🔇 音效：關';
    }
    // v8.2 單一啟動路徑：只由 DOMContentLoaded 呼叫 patchedInitGame 一次
    // (v8.1 同時掛 window.onload + DOMContentLoaded，loadGameData 跑兩次、離線收益算兩倍)

    // 修補 tick - 注入 buff / 冷卻 / 突發事件 / 成就 / 房租
    const _origTick = tick;
    const _patchedTickInstalled = false;
    (function patchTick() {
      const origTickFn = tick;
      tick = function () {
        const progressMinutes = gameState.speed / 10;
        tickBuffs(progressMinutes);
        tickMiniGameCooldowns(progressMinutes);
        tickRandomEvents();
        origTickFn();
        checkAchievements();
      };
    })();

    // 修補 settleDailySalary 加入房租
    const _origSettleDailySalary = settleDailySalary;
    settleDailySalary = function () {
      _origSettleDailySalary();
      checkRent();
    };

    // v8.2：原本在這裡覆寫 updateSaveTimestamp 並引用未宣告的 timeStr/rebirthStr，
    // 每次 updateUI() 都拋 ReferenceError (連帶存檔中斷)。已移除覆寫，改用 ui.js 的正確版本。

    // 修補 triggerExam 加入考試報名費 & 成就
    const _origTriggerExam = triggerExam;
    triggerExam = function () {
      // v8.2：先檢查冷卻 — 冷卻中交給原版顯示剩餘時間，不扣費、不給成就
      if (typeof getExamCooldownRemaining === 'function' && getExamCooldownRemaining() > 0) {
        _origTriggerExam();
        return;
      }
      // 凌晨 3 點考試成就 (真的開考才算)
      if (gameState.hour === 3) unlockAchievement('exam_at_3am');
      // 穿自定義服飾考試成就
      if (gameState.equipped.hat && !gameState.equipped.hat.startsWith('preset_') ||
        gameState.equipped.clothes && !gameState.equipped.clothes.startsWith('preset_') ||
        gameState.equipped.shoes && !gameState.equipped.shoes.startsWith('preset_')) {
        // 標記，在 finishExam 成功時解鎖
        window._customOutfitExam = true;
      }

      // 收取報名費 (v8.2：第一次考試免費，避免新手存 5 天才考得起)
      const isFirstExam = (gameState.examAttempts || 0) === 0;
      const fee = isFirstExam ? 0 : 50;
      if (gameState.money < fee) {
        playSound('examFail');
        createFloatingText(`❌ 考試報名費 $${fee}，零用錢不夠喔！（可去超商打工賺取）`);
        return;
      }
      if (fee > 0) {
        gameState.money -= fee;
        gameState.totalSpent = (gameState.totalSpent || 0) + fee;
        queueFloatingText(`📝 繳交考試報名費 -$${fee}`);
      } else {
        queueFloatingText(`🎁 第一次考試免報名費！`);
      }
      gameState.examAttempts = (gameState.examAttempts || 0) + 1;
      _origTriggerExam();
    };

    // 修補 finishExam 成就
    const _origFinishExam = finishExam;
    finishExam = function (passRate, nextGradeName) {
      const gradeBefore = gameState.gradeIndex;
      _origFinishExam(passRate, nextGradeName);
      // v8.2：用考前/考後年級判斷真的通過 (v8.1 考失敗也會解鎖 first_exam_pass)
      if (gameState.gradeIndex > gradeBefore) {
        unlockAchievement('first_exam_pass');
        gameState.examPassStreak = (gameState.examPassStreak || 0) + 1;
      } else {
        gameState.examPassStreak = 0;
      }
      if (window._customOutfitExam) {
        unlockAchievement('custom_outfit_exam');
        window._customOutfitExam = false;
      }
    };

    // 修補 triggerSundayParentsEvent 成就
    const _origParentsEvent = triggerSundayParentsEvent;
    triggerSundayParentsEvent = function () {
      const wasBefore = gameState.parentsStatus;
      _origParentsEvent();
      // 檢查成就
      if (wasBefore === 'alive' && gameState.parentsStatus !== 'alive') {
        unlockAchievement('parents_first_death');
        if (gameState.parentsStatus === 'too_dumb') unlockAchievement('parents_dumb_death');
        // 記錄出事原因到永久資料
        if (!rebirthData.allParentDeaths.includes(gameState.parentsStatus)) {
          rebirthData.allParentDeaths.push(gameState.parentsStatus);
          saveRebirthData();
        }
      }
      if (wasBefore !== 'alive' && gameState.parentsStatus === 'alive') {
        unlockAchievement('parents_revival');
        if (gameState.parentsRebornReason && gameState.parentsRebornReason.includes('耶穌')) {
          unlockAchievement('parents_jesus');
        }
      }
    };


// 遊戲啟動生命週期
let __scholarBooted = false;
window.addEventListener('DOMContentLoaded', () => {
  if (__scholarBooted) return;
  __scholarBooted = true;
  console.log("🎮 放置學霸養成記 (v9.10.4) 正在開機啟動...");
  // v8.2 單一啟動路徑：patchedInitGame 內部會 loadGameData + startTicker，只跑一次
  if (typeof patchedInitGame === 'function') {
    patchedInitGame();
    if (typeof maybeShowOnboarding === 'function') maybeShowOnboarding();
    console.log("✨ 啟動成功！享受純真經典像素點陣世界！");
    return;
  }
  
  // 1. 載入本地存檔與成就
  if (typeof loadGameData === 'function') {
    loadGameData();
  } else if (typeof loadGame === 'function') {
    loadGame();
  }
  
  // 2. 初始化換裝自定義外觀
  if (typeof applyEquippedSkins === 'function') {
    applyEquippedSkins();
  }

  // 3. 一屏盡覽全螢幕地圖自適應縮放
  if (typeof resizeMapScale === 'function') {
    resizeMapScale();
  }

  // 4. 初次小人位置定位與視覺渲染
  if (typeof updateCharacterAnimation === 'function') {
    updateCharacterAnimation();
  } else if (typeof updateVisuals === 'function') {
    updateVisuals();
  }

  // 5. 初始 UI 更新 (等級、金錢、日曆、鎖定、地標徽章、建設抽屜等)
  if (typeof updateUI === 'function') updateUI();
  if (typeof updateLocksUI === 'function') updateLocksUI();
  if (typeof updateCalendarUI === 'function') updateCalendarUI();
  if (typeof updateSaveTimestamp === 'function') updateSaveTimestamp();
  if (typeof updateLandmarkVisuals === 'function') updateLandmarkVisuals();
  if (typeof renderBuildDrawer === 'function') renderBuildDrawer();

  // 6. 啟動主計時循環 (Delta Tick Engine)
  if (typeof gameInterval !== 'undefined' && !gameInterval) {
    gameInterval = setInterval(tick, 100);
  }

  console.log("✨ 啟動成功！享受純真經典像素點陣世界！");
});

// 全域相容別名
window.loadGame = typeof loadGameData === 'function' ? loadGameData : () => {};
window.updateVisuals = typeof updateCharacterAnimation === 'function' ? updateCharacterAnimation : () => {};

