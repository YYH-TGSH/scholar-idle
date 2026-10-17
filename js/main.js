/* ==========================================================================
   🎮 GBA SCHOLAR IDLE - MAIN GAME LOOP & BOOTSTRAP (v8.9.1)
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

      updateCommuteTransitionSpeed();
      startTicker();
    }

    function updateCommuteTransitionSpeed() {
      if (gameState.isCommuting) {
        // 新流速下，通勤實際所需時間 (秒) 為：剩餘分鐘 / speed
        const durationSec = gameState.commuteMinutesLeft / gameState.speed;
        elCharWrap.style.transition = `left ${durationSec}s linear, top ${durationSec}s linear`;
      } else {
        elCharWrap.style.transition = `left 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), top 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)`;
      }
    }

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
      if (vp.scrollLeft !== 0) vp.scrollLeft = 0; // 保險：任何殘留捲動都歸零 (v8.9.1)
      if (vp.scrollTop !== 0) vp.scrollTop = 0;
      const availW = vp.clientWidth;
      const availH = vp.clientHeight;
      if (!availW || !availH) return;
      // v8.7 預設視角 = 嚴格 contain：整個校園在可用矩形裡一次看完、跟著螢幕尺寸縮放定位，
      // 不再放大溢出。想看細節用雙指縮放，或點底部房間膠囊直接放大跳到那一間。
      const fit = Math.min(availW / 980, availH / 560, 1.25);
      let scale = Math.max(Math.min(fit, 1.25), 0.15); // v8.9.1: 下限改 0.15——舊下限 0.32 在矮螢幕會大於 fit 本人，反而保證溢出遮擋
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
      const mx = Math.max(0, (960 * s - vp.clientWidth) / 2) + 30;
      const my = Math.max(0, (540 * s - vp.clientHeight) / 2) + 30;
      mapPanX = Math.max(-mx, Math.min(mx, mapPanX));
      mapPanY = Math.max(-my, Math.min(my, mapPanY));
    }
    function centerMapOn(mapX, mapY) {
      const s = (window.__baseMapScale || 1) * mapZoom;
      mapPanX = -(mapX - 480) * s;
      mapPanY = -(mapY - 270) * s;
      clampMapPan(); applyMapZoom();
    }
    // 房間快捷導覽 (手機底部膠囊列)：把該房間滑到畫面中央並脈衝提示，玩家再點大房間派遣
    function focusLandmark(loc) {
      const centers = { school: [163, 117], library: [473, 117], gym: [790, 117], restaurant: [163, 387], store: [473, 387], home: [790, 387] };
      const c = centers[loc];
      if (!c) return;
      if (mapZoom < 1.7) mapZoom = 1.7; // v8.7 膠囊 = 放大跳轉到該房間，不只是平移
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
          if (mapZoom === 1) { mapPanX = 0; mapPanY = 0; }
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
        mapZoom = Math.max(1, Math.min(3, mapZoom * (e.deltaY < 0 ? 1.12 : 0.89)));
        if (mapZoom === 1) { mapPanX = 0; mapPanY = 0; }
        clampMapPan(); applyMapZoom();
      }, { passive: false });
      vp.addEventListener('dblclick', () => { mapZoom = 1; mapPanX = 0; mapPanY = 0; applyMapZoom(); });
    }


    // 遊戲時間推進 (推進 speed / 10 分鐘，1x 速度下 1 秒(10次tick) = 1 遊戲分鐘)
    function tick() {
      const progressMinutes = gameState.speed / 10;

      // 1. 處理通勤
      if (gameState.isCommuting) {
        gameState.commuteMinutesLeft -= progressMinutes;
        if (gameState.commuteMinutesLeft <= 0) {
          gameState.isCommuting = false;
          currentLoc = gameState.commuteTarget;
          playSound('click');

          const locNames = { home: '住家', school: '學校', gym: '運動場', restaurant: '餐廳', library: '圖書館', store: '便利商店' };
          const locEmoji = { home: '🏡', school: '🏫', gym: '🏃', restaurant: '🍔', library: '📖', store: '🏪' };
          const name = locNames[currentLoc] || '未知地點';
          const emoji = locEmoji[currentLoc] || '📍';
          createFloatingText(`抵達 ${name} ${emoji}`);

          updateCommuteTransitionSpeed();
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

      // 4. 行為決策
      decideLocationAndState();

      // 5. 畫面渲染
      updateLocksUI();
      updateCalendarUI();
      updateStatusBars();
      updateCharacterAnimation();
      updateSubjectBars();
      updateExamProgress();

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
        if (gameState.hunger < 35 && !restaurantLocked) {
          targetLoc = "restaurant";
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
          if (gameState.hunger < 45 && !restaurantLocked) {
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

      if (currentLoc === targetLoc) {
        if (currentLoc === "school") {
          currentState = (gameState.stress >= 85) ? "angry" : "studying";
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
          currentState = (gameState.energy < 30 || gameState.hour >= 22 || gameState.hour < 7 || (gameState.overrideAction === 'sleep')) ? "sleeping" : "idle";
        }
      }
      else {
        // 計算站數差 * 10 分鐘 (6 大地標順序)
        const locIndex = { school: 1, restaurant: 2, gym: 3, library: 4, store: 5, home: 6 };
        const idx1 = locIndex[currentLoc] || 6;
        const idx2 = locIndex[targetLoc] || 6;
        const baseMinutes = Math.abs(idx1 - idx2) * 10;

        const shoesBonus = Math.max(0.4, 1 - (gameState.passive.shoes * 0.15));
        // 飛毛腿輪迴加成：每級 -10% 通勤時間
        const speedsterMult = typeof getRebirthReduction === 'function' ? Math.max(0.3, 1 - ((rebirthData && rebirthData.bonuses ? rebirthData.bonuses.speedster : 0) || 0) * 0.10) : 1.0;
        const finalMinutes = Math.max(3, Math.round(baseMinutes * shoesBonus * speedsterMult));

        gameState.isCommuting = true;
        gameState.commuteStart = currentLoc;
        gameState.commuteTarget = targetLoc;
        gameState.commuteMinutesTotal = finalMinutes;
        gameState.commuteMinutesLeft = finalMinutes;
        currentState = "commuting";

        startCharCommuteAnimation(currentLoc, targetLoc, finalMinutes);
      }
    }

    function startCharCommuteAnimation(start, target, minutes) {
      const targetIdleKey = `${target}-idle`;
      const targetCoords = COORDS[targetIdleKey] || COORDS['home-idle'];

      const startCoords = COORDS[`${start}-idle`] || { x: 650 };
      const isFlipped = targetCoords.x < startCoords.x;
      updateCommuteTransitionSpeed();

      requestAnimationFrame(() => {
        updateCharacterPositionAndScale(targetCoords.x, targetCoords.y, isFlipped);
      });

      queueFloatingText("趕路中！🏃‍♂️💨");
    }

    function getCharacterCoords(loc, state) {
      if (loc === 'home') {
        if (state === 'sleeping') return COORDS['home-sleep'];
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
      return { x: 650, y: 250 };
    }

    function processHourlyState() {
      // v8.2 成就追蹤器 (過去這些成就沒有任何判定來源)
      if ((currentLoc === 'school' || currentLoc === 'library') && currentState === 'studying') gameState.studyStreakHours = (gameState.studyStreakHours || 0) + 1; else gameState.studyStreakHours = 0;
      if (currentLoc === 'school') gameState._wentSchoolToday = true;
      if (currentState === 'eating') { if (gameState._eatDay !== gameState.totalGameDays) { gameState._eatDay = gameState.totalGameDays; gameState.eatsToday = 0; } gameState.eatsToday = (gameState.eatsToday || 0) + 1; }
      if (currentState === 'angry') { if (gameState._angerDay !== gameState.totalGameDays) { gameState._angerDay = gameState.totalGameDays; gameState.angerToday = 0; } gameState.angerToday = (gameState.angerToday || 0) + 1; }
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
        gameState.energy = Math.min(100, gameState.energy + homeEnergyBase * sleepBuff * energyMut);
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

        const hourlyWage = Math.max(5, Math.round(baseWage * workBuff * salaryMut * xiaohaoWageMult * storeWageMult));
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
          gainKnowledge("school", efficiency * headphoneBonus * studyBuff * smartMult * studyMut * xiaoxuanMult * schoolMult);
          gameState.stress = Math.min(100, gameState.stress + 5 * gameState.difficulty * mentalRed * stressMut * yuqingStressMult);
        } else if (currentLoc === "library") {
          let bookBonus = 1 + (gameState.passive.book * 0.2) + ((gameState.passive.tablet || 0) * 0.3);
          const reviewBuff = typeof getBuffMultiplier === 'function' ? getBuffMultiplier('review_boost') : 1.0;
          const memMult = typeof getRebirthMult === 'function' ? getRebirthMult('memory') : 1.0;
          const libMut = typeof getMutationMult === 'function' ? getMutationMult('library_eff') : 1.0;
          const yuqingMult = typeof getFriendBonus === 'function' ? getFriendBonus('library_eff') : 1.0;
          const libEffMult = libLv === 3 ? 1.75 : (libLv === 2 ? 1.30 : 1.0);
          const libStressDiv = libLv === 3 ? 0.5 : 1.0;
          gainKnowledge("library", efficiency * bookBonus * reviewBuff * smartMult * memMult * studyMut * libMut * yuqingMult * libEffMult);
          gameState.stress = Math.min(100, gameState.stress + 8 * gameState.difficulty * mentalRed * stressMut * yuqingStressMult * libStressDiv);
        }
      }
      else if (currentState === "angry") {
        gameState.stress = Math.min(100, gameState.stress + 2);
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
      gameState.money += dailyBonus;
      gameState.totalLifetimeEarnings = (gameState.totalLifetimeEarnings || 0) + dailyBonus;
      updateUI();
      saveGameData(); // 立即存檔，確保零用錢累積
      queueFloatingText(`📅 每日結算：零用錢 +$${dailyBonus}!`);
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
  console.log("🎮 放置學霸養成記 (v8.9.1) 正在開機啟動...");
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

