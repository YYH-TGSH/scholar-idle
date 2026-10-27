/* ==========================================================================
   🎮 GBA SCHOLAR IDLE - COORDINATES & MOVEMENT ENGINE (v9.0.0)
   1920x540 橫向捲軸街道小鎮：六棟建築沿主街一字排開 (西→東：住家/超商/餐廳/學校/圖書館/操場)
   ========================================================================== */

    // 世界與街道常數 (通勤路徑/相機/地面共用同一套座標)
    const WORLD_W = 1920, WORLD_H = 540;
    const WALK_Y = 296; // 主街馬路中央的步行線
    const DOOR_X = { home: 175, store: 485, restaurant: 795, school: 1105, library: 1415, gym: 1732 }; // 各建築門口 x
    const DOOR_OUT_Y = 230; // 走出大門後、踏上馬路前的門前點 y

    // 各室內互動點 (由舊 960 佈局的島內相對座標平移而來，室內陳設不變)
    const COORDS = {
      'school-class': { x: 590, y: 250 }, // v9.22 主角課桌（前排中央）
      'school-idle': { x: 648, y: 252 }, // v9.21 室內入口旁
      'restaurant-eat': { x: 440, y: 184 }, // v9.19 吧台座南移（人不再被櫃檯擋住）
      'restaurant-idle': { x: 610, y: 252 }, // v9.18 室內入口
      'gym-run': { x: 1652, y: 75 },
      'gym-idle': { x: 1727, y: 180 },
      'library-study': { x: 140, y: 235 }, // v9.26 窗邊扶手椅
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
      const posKey = `${x}|${y}|${flipH ? 1 : 0}|${elCharWrap.parentNode ? elCharWrap.parentNode.id : ''}`; // v9.17.1：換容器（進出室內）也要重套縮放
      if (_lastCharPos === posKey && !gameState.isCommuting) return;
      _lastCharPos = posKey;
      elCharWrap.style.left = `${x - 21}px`; // v9.10.7 置中修正：wrap 寬 42，舊寫法把左緣放在座標上，主角永遠右偏 21（半個椅距），座位/書桌/床位全歪。改為中心對齊座標，與 NPC 一致。
      elCharWrap.style.top = `${y - 70}px`;
      gameState.currentX = x;
      gameState.currentY = y;

      if (flipH) {
        elCharWrap.classList.add("flip-h");
      } else {
        elCharWrap.classList.remove("flip-h");
      }

      let scale = 0.88;
      if (y >= 260) {
        scale = 0.98;
      }
      // v9.17.1：室內場景（住家/超商）被框框縮小，人物補償回大地圖同尺寸（腳底為原點）
      const par = elCharWrap.parentNode;
      if (par && (par.id === 'home-rooms' || par.id === 'store-rooms' || par.id === 'rest-rooms' || par.id === 'school-rooms' || par.id === 'lib-rooms')) { // v9.21 學校場景同尺寸補償；v9.26 圖書館
        const st = par.parentNode;
        scale *= 300 / ((st && st.clientHeight) || 179);
        elCharWrap.style.transformOrigin = '50% 100%';
      } else if (elCharWrap.style.transformOrigin) {
        elCharWrap.style.transformOrigin = '';
      }
      elCharWrap.style.transform = `scale(${scale})`;
    }

