/* ==========================================================================
   🎮 GBA SCHOLAR IDLE - COORDINATES & MOVEMENT ENGINE (v8.3.0)
   960x540 六角小鎮與 2.5D 正向透視室內互動座標
   ========================================================================== */

    // 960x540 六角聚落座標定位 (各島 2.5D 正向透視屋室內互動點)
    const COORDS = {
      // 學校 (左上)
      'school-class': { x: 125, y: 195 },
      'school-idle': { x: 165, y: 195 },
      // 餐廳 (左下)
      'restaurant-eat': { x: 115, y: 460 },
      'restaurant-idle': { x: 160, y: 465 },
      // 活力操場 (右上)
      'gym-run': { x: 710, y: 75 },
      'gym-idle': { x: 785, y: 180 },
      // 圖書館 (中上)
      'library-study': { x: 385, y: 195 },
      'library-idle': { x: 445, y: 195 },
      // 便利商店 (中下)
      'store-work': { x: 440, y: 460 },
      'store-idle': { x: 485, y: 465 },
      // 住家 (右下)
      'home-sleep': { x: 685, y: 460 },
      'home-idle': { x: 775, y: 460 }
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

