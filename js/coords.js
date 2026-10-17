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
      'school-class': { x: 1067, y: 195 },
      'school-idle': { x: 1107, y: 195 },
      'restaurant-eat': { x: 747, y: 190 },
      'restaurant-idle': { x: 792, y: 195 },
      'gym-run': { x: 1652, y: 75 },
      'gym-idle': { x: 1727, y: 180 },
      'library-study': { x: 1327, y: 195 },
      'library-idle': { x: 1387, y: 195 },
      'store-work': { x: 452, y: 190 },
      'store-idle': { x: 497, y: 195 },
      'home-sleep': { x: 90, y: 175 },
      'home-idle': { x: 167, y: 190 }
    };

    // 統一更新角色位置、朝向與縮放
    let _lastCharPos = '';
    function updateCharacterPositionAndScale(x, y, flipH) {
      const elCharWrap = document.getElementById("char-wrap");
      if (!elCharWrap) return;
      // v8.2 效能：座標沒變就不重寫 style (原本每 tick 10 次/秒強制 layout)
      const posKey = `${x}|${y}|${flipH ? 1 : 0}`;
      if (_lastCharPos === posKey && !gameState.isCommuting) return;
      _lastCharPos = posKey;
      elCharWrap.style.left = `${x}px`;
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
      elCharWrap.style.transform = `scale(${scale})`;
    }

