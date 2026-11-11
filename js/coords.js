/* ==========================================================================
   🎮 GBA SCHOLAR IDLE - COORDINATES & MOVEMENT ENGINE (v9.0.0)
   1920x540 橫向捲軸街道小鎮：六棟建築沿主街一字排開 (西→東：住家/超商/餐廳/學校/圖書館/操場)
   ========================================================================== */

    // 世界與街道常數 (通勤路徑/相機/地面共用同一套座標)
    // v9.38 A 案雙排小鎮：世界 1150x920，北排（住家/超商/餐廳）面 A 街、南排（學校/圖書館/操場）面 B 街，
    // 中間是公園帶，東西兩條連通巷接兩條街。所有世界座標以本註冊表為單一來源。
    const WORLD_W = 1150, WORLD_H = 920;
    const WORLD_PW = 1715, WORLD_PH = 695; // v9.64 高 215+920*0.462≈640＋南緣餘裕（OY 下移後重算） // v9.55 投影後世界螢幕尺寸（TOWN_PROJ K=1.1、OX8/OY170：寬 1150+920*0.605≈1715、高 170+920*0.462≈595＋南緣餘裕）
    const LOC_STREET = { home: 'A', store: 'A', restaurant: 'A', school: 'B', library: 'B', gym: 'B', club: 'B', study: 'B' }; // v9.72 自習室（學校 2F） // v9.65 club = 學校 3F
    const STREET_Y = { A: 300, B: 790 }; // 兩條街的步行線
    const CONNECTOR_X = [28, 1122]; // 東西連通巷的步行線 x
    const WALK_Y = 300; // 相容舊引用：A 街步行線（新路徑一律走 streetYOf/streetLegs）
    const DOOR_X = { home: 198, store: 571, restaurant: 951, school: 198, library: 571, gym: 958, club: 198, study: 198 }; // v9.65 club 走學校大門 // 各建築門口 x
    const DOOR_FRONT_Y = { home: 200, store: 200, restaurant: 200, school: 690, library: 690, gym: 690 , club: 690, study: 690 }; // 門口落腳點 y（島上）
    const DOOR_OUT_Y = { A: 232, B: 722 }; // 走出大門後、踏上馬路前的門前點 y（依街別）
    function streetYOf(loc) { return STREET_Y[LOC_STREET[loc] || 'A']; }
    function streetLegs(x1, s1, x2, s2) { // 街面轉接點（保證軸向）：回傳含終點 {x2, STREET_Y[s2]} 的陣列
      if (s1 === s2) return [{ x: x2, y: STREET_Y[s2] }];
      const cx = Math.abs(x1 - CONNECTOR_X[0]) + Math.abs(x2 - CONNECTOR_X[0]) <= Math.abs(x1 - CONNECTOR_X[1]) + Math.abs(x2 - CONNECTOR_X[1]) ? CONNECTOR_X[0] : CONNECTOR_X[1];
      return [{ x: cx, y: STREET_Y[s1] }, { x: cx, y: STREET_Y[s2] }, { x: x2, y: STREET_Y[s2] }];
    }

    // 各室內互動點 (由舊 960 佈局的島內相對座標平移而來，室內陳設不變)
    const COORDS = {
      'school-class': { x: 590, y: 250 }, // v9.22 主角課桌（前排中央）
      'school-idle': { x: 648, y: 252 }, // v9.21 室內入口旁
      'restaurant-eat': { x: 440, y: 184 }, // v9.19 吧台座南移（人不再被櫃檯擋住）
      'restaurant-idle': { x: 610, y: 252 }, // v9.18 室內入口
      'gym-run': { x: 300, y: 238 }, // v9.27 跑道上
      'gym-idle': { x: 575, y: 252 }, // v9.27 場景入口旁
      'library-study': { x: 140, y: 235 }, // v9.26 窗邊扶手椅
      'club-idle': { x: 575, y: 252 }, // v9.65 社團活動室入口旁
      'study-study': { x: 590, y: 250 }, // v9.72 自習室主角課桌（同教室保留位）
      'study-idle': { x: 575, y: 252 }, // v9.72 自習室入口旁
      'library-idle': { x: 575, y: 252 }, // v9.26 室內入口旁
      'store-work': { x: 935, y: 150 }, // v9.17 室內場景：收銀台後
      'store-idle': { x: 565, y: 252 }, // v9.17 室內場景：入口內側
      'home-sleep': { x: 840, y: 182 },
      'home-idle': { x: 500, y: 212 },
      'home-dinner': { x: 655, y: 208 },
      'home-desk': { x: 1032, y: 208 }
    };

    // 統一更新角色位置、朝向與縮放
    let _lastCharPos = '';
    let _pw = null; // v9.24 主角室內走路狀態
    function updateCharacterPositionAndScale(x, y, flipH) {
      const elCharWrap = document.getElementById("char-wrap");
      if (!elCharWrap) return;
      // v9.24 主角在同一個場景內改位置＝走過去（下課去閱讀角、回家去餐桌），不再瞬移；換場景/睡覺/運動直接就位
      const parId0 = elCharWrap.parentNode ? elCharWrap.parentNode.id : '';
      if (typeof gameState !== 'undefined' && !gameState.isCommuting && typeof currentState !== 'undefined' && currentState !== 'sleeping' && currentState !== 'sports' && /-rooms$/.test(parId0)) {
        if (!_pw || _pw.par !== parId0) { _pw = { x: x, y: y, par: parId0, t: 0 }; gameState._playerWalking = false; }
        else {
          const nowP = performance.now(); const dtF = Math.min(0.1, _pw.t ? (nowP - _pw.t) / 1000 : 0.016); _pw.t = nowP;
          const dx = x - _pw.x, dy = y - _pw.y; const dist = Math.hypot(dx, dy);
          if (dist > 3) { const st = Math.min(dist, 175 * dtF); _pw.x += dx / dist * st; _pw.y += dy / dist * st; gameState._playerWalking = true; if (dx < -2) flipH = true; else if (dx > 2) flipH = false; x = _pw.x; y = _pw.y; }
          else { _pw.x = x; _pw.y = y; gameState._playerWalking = false; }
        }
      } else if (typeof gameState !== 'undefined') { gameState._playerWalking = false; _pw = null; }
      // v8.2 效能：座標沒變就不重寫 style (原本每 tick 10 次/秒強制 layout)
      elCharWrap.classList.toggle('walking', typeof gameState !== 'undefined' && (!!gameState.isCommuting || !!gameState._playerWalking)); // v9.40 走路 2 幀動畫開關
      const posKey = `${x}|${y}|${flipH ? 1 : 0}|${elCharWrap.parentNode ? elCharWrap.parentNode.id : ''}`; // v9.17.1：換容器（進出室內）也要重套縮放
      if (_lastCharPos === posKey && !gameState.isCommuting) return;
      _lastCharPos = posKey;
      const _parP = elCharWrap.parentNode; // v9.51：已投影場景裡，主角錨點改走投影（邏輯座標/走路器/currentX 不變）
      const _prP = (_parP && typeof PROJ !== 'undefined') ? PROJ.forRooms(_parP.id) : null;
      const _anP = _prP ? _prP.P(x, y, 0) : null;
      elCharWrap.style.left = `${(_anP ? _anP.x : x) - 21}px`; // v9.10.7 置中修正：wrap 寬 42，中心對齊座標，與 NPC 一致
      elCharWrap.style.top = `${(_anP ? _anP.y : y) - 70}px`;
      gameState.currentX = x;
      gameState.currentY = y;

      if (flipH) {
        elCharWrap.classList.add("flip-h");
      } else {
        elCharWrap.classList.remove("flip-h");
      }

      let scale = 1; // v9.60 尺度定版：全鎮單一尺度（廢 y=260 門檻 ×0.88/×0.98——走過一條線就變矮 10% 是稽核頭號人物不一致）
      // v9.17.1：室內場景（住家/超商）被框框縮小，人物補償回大地圖同尺寸（腳底為原點）
      const par = elCharWrap.parentNode;
      if (par && (par.id === 'home-rooms' || par.id === 'store-rooms' || par.id === 'rest-rooms' || par.id === 'school-rooms' || par.id === 'lib-rooms' || par.id === 'gym-rooms' || par.id === 'club-rooms' || par.id === 'home2-rooms')) { // v9.21；v9.66 home2 補入 學校場景同尺寸補償；v9.26 圖書館；v9.27 操場
        let _cs = (window.BIBLE ? BIBLE.SCALE.INDOOR_SCALE : 1.676); // v9.60：定版常數（廢 300/clientHeight 浮動反推——版面一改人物就跟著變尺寸）
        if (window.__FS_FIT && window.__FS_FIT.active && window.__FS_FIT.s > 0) _cs = 1 / window.__FS_FIT.s; // v9.69 全屏層：主角比照 NPC 的舞臺高反推，與 NPC 同尺寸（站規 v9.17.1）
        scale *= _cs;
        elCharWrap.style.transformOrigin = '50% 100%';
      } else if (elCharWrap.style.transformOrigin) {
        elCharWrap.style.transformOrigin = '';
      }
      elCharWrap.style.transform = `scale(${scale})`;
    }

