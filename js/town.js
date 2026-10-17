/* ==========================================================================
   🎮 GBA SCHOLAR IDLE - TOWN & LANDMARK ENGINE (v8.9.0)
   6 大島嶼建設升級、城鎮繁榮度、咪咪小貓與地標派遣
   ========================================================================== */

    // ==========================================
    // 🏛️ 6 大島嶼營造與升級系統 (Town Construction)
    // ==========================================
    const LANDMARK_UPGRADE_CONFIG = {
      school: {
        name: "學校",
        icon: "🏫",
        maxLv: 3,
        costs: [0, 80, 250],
        levelNames: ["基礎教室", "現代多媒體校舍", "智慧名校科學閣"],
        perks: [
          "校內聽講學習效率基準 (1.0x)",
          "聽講學習效率 +25%！配備電子黑板與冷氣空調",
          "聽講學習效率 +60%！頂級實驗室，考試合格率永久 +5%"
        ]
      },
      restaurant: {
        name: "餐廳",
        icon: "🍔",
        maxLv: 3,
        costs: [0, 60, 200],
        levelNames: ["街角鐵板燒", "美食街精緻定食", "米其林星級 Buffet"],
        perks: [
          "用餐飽足度 +45，壓力 -2",
          "用餐飽足度 +60，壓力 -4！美味雙倍",
          "用餐飽足度 +85，壓力 -8，額外恢復精力 +10！"
        ]
      },
      gym: {
        name: "運動場",
        icon: "🏃",
        maxLv: 3,
        costs: [0, 70, 220],
        levelNames: ["紅土操場", "塑膠跑道與重訓館", "奧運級水療綜合體育館"],
        perks: [
          "跑步減壓基準 (-25 壓力)",
          "減壓 -35，跑步精力消耗減少 20%！",
          "減壓 -50！壓力瞬間清零，精力消耗減少 40%！"
        ]
      },
      library: {
        name: "圖書館",
        icon: "📖",
        maxLv: 3,
        costs: [0, 75, 240],
        levelNames: ["社區閱覽室", "靜音自習隔音館", "皇家水晶藏書閣"],
        perks: [
          "複習效率基準 (1.0x)",
          "複習效率 +30%！自修隔音艙",
          "複習效率 +75%！皇家古籍典藏，複習壓力減半！"
        ]
      },
      store: {
        name: "便利商店",
        icon: "🏪",
        maxLv: 3,
        costs: [0, 65, 210],
        levelNames: ["柑仔店超商", "24H 旗艦連鎖超商", "金牌科技旗艦超商"],
        perks: [
          "打工時薪基準 ($18+學歷×6)，30% 獲得報廢便當",
          "時薪 +35%！報廢便當機率提高至 45%",
          "時薪 +80%！15% 機率贈送維他命/精力飲料，賺錢神地"
        ]
      },
      home: {
        name: "住家",
        icon: "🏠",
        maxLv: 3,
        costs: [0, 90, 280],
        levelNames: ["老舊公寓", "溫馨現代美宅", "豪華景觀莊園 (附小貓咪)"],
        perks: [
          "睡覺精力恢復 +15",
          "睡覺精力恢復 +25 (+66%)，環境溫馨降壓加快",
          "睡覺精力恢復 +40！秒滿體力，並常駐可愛小貓咪 🐱 咪咪（點擊可減壓）"
        ]
      }
    };

    function getLandmarkLevel(loc) {
      if (!gameState.landmarkLevels) {
        gameState.landmarkLevels = { school: 1, restaurant: 1, gym: 1, library: 1, store: 1, home: 1 };
      }
      return gameState.landmarkLevels[loc] || 1;
    }

    function getUpgradeCost(loc) {
      const cfg = LANDMARK_UPGRADE_CONFIG[loc];
      if (!cfg) return 0;
      const curLv = getLandmarkLevel(loc);
      if (curLv >= cfg.maxLv) return 0;
      return cfg.costs[curLv] || 0;
    }

    function getTownProsperityTotal() {
      const locs = ['school', 'restaurant', 'gym', 'library', 'store', 'home'];
      return locs.reduce((sum, loc) => sum + getLandmarkLevel(loc), 0);
    }

    function upgradeLandmark(loc) {
      const cfg = LANDMARK_UPGRADE_CONFIG[loc];
      if (!cfg) return;
      const curLv = getLandmarkLevel(loc);
      if (curLv >= cfg.maxLv) {
        queueFloatingText(`${cfg.icon} ${cfg.name} 已經達到滿級 MAX！✨`);
        return;
      }
      const cost = getUpgradeCost(loc);
      if (gameState.money < cost) {
        playSound('examFail');
        queueFloatingText(`零用錢不足！升級需要 $${cost}（目前擁有 $${gameState.money}）`);
        return;
      }
      gameState.money -= cost;
      gameState.totalSpent = (gameState.totalSpent || 0) + cost;
      gameState.landmarkLevels[loc] = curLv + 1;
      playSound('levelUp');
      queueFloatingText(`🎉 ${cfg.icon} ${cfg.name} 升級至 Lv.${curLv + 1}【${cfg.levelNames[curLv]}】！`);

      updateLandmarkVisuals();
      renderBuildDrawer();
      updateUI();
      saveGameData();
    }

    function openBuildDrawer(loc) {
      toggleDrawer('build');
      if (loc) {
        setTimeout(() => {
          const card = document.getElementById(`build-card-${loc}`);
          if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }

    function updateLandmarkVisuals() {
      const locs = ['school', 'restaurant', 'gym', 'library', 'store', 'home'];
      locs.forEach(loc => {
        const lv = getLandmarkLevel(loc);
        const badge = document.getElementById(`${loc}-lv-badge`);
        if (badge) {
          badge.innerText = `Lv.${lv} ${lv === 3 ? '⭐MAX' : ''}`;
          if (lv === 3) badge.classList.add('is-max');
          else badge.classList.remove('is-max');
        }
        const deco2 = document.getElementById(`${loc}-up-lv2`);
        if (deco2) deco2.classList.toggle('active', lv >= 2 && lv < 3);
        const deco3 = document.getElementById(`${loc}-up-lv3`);
        if (deco3) deco3.classList.toggle('active', lv >= 3);
      });

      // 咪咪小貓咪專屬：住家 Lv.3 開啟
      const cat = document.getElementById("pet-cat");
      if (cat) {
        cat.style.display = getLandmarkLevel('home') >= 3 ? 'flex' : 'none';
      }
    }

    function renderBuildDrawer() {
      const listEl = document.getElementById("build-island-list");
      if (!listEl) return;
      const totalStars = getTownProsperityTotal();

      // 總覽評級
      let title = `🏕️ 初興小鎮 (${totalStars}★)`;
      let perks = "每日小鎮紅利：尚未解鎖（島嶼累計達 10★ 解鎖）";
      if (totalStars >= 18) {
        title = `🌌 傳奇宇宙學霸城 (18★ MAX)`;
        perks = "每日小鎮紅利 +$100、考試合格率永久 +5%、全小遊戲獎金翻倍！";
      } else if (totalStars >= 15) {
        title = `🌟 卓越文教城 (${totalStars}★)`;
        perks = "每日小鎮紅利 +$50、全學科學科獲取速度額外 +10%！";
      } else if (totalStars >= 10) {
        title = `🏙️ 繁華聚落 (${totalStars}★)`;
        perks = "每日小鎮紅利 +$20（每日 00:00 自動結算發放）";
      }

      const titleEl = document.getElementById("town-prosperity-title");
      if (titleEl) titleEl.innerText = title;
      const perksEl = document.getElementById("town-prosperity-perks");
      if (perksEl) perksEl.innerText = perks;
      const starsEl = document.getElementById("town-prosperity-stars");
      if (starsEl) starsEl.innerText = "⭐".repeat(Math.min(18, totalStars));
      const fillEl = document.getElementById("town-prosperity-fill");
      if (fillEl) fillEl.style.width = `${Math.min(100, Math.round((totalStars / 18) * 100))}%`;

      const locs = ['school', 'restaurant', 'gym', 'library', 'store', 'home'];
      listEl.innerHTML = locs.map(loc => {
        const cfg = LANDMARK_UPGRADE_CONFIG[loc];
        const curLv = getLandmarkLevel(loc);
        const isMax = curLv >= cfg.maxLv;
        const nextCost = getUpgradeCost(loc);
        const canAfford = gameState.money >= nextCost;

        return `
          <div class="build-island-card" id="build-card-${loc}">
            <div class="build-card-header">
              <div class="build-card-title">
                <span>${cfg.icon}</span>
                <span>${cfg.name}</span>
                <span style="font-size:0.7rem; color:var(--primary); font-weight:800;">【${cfg.levelNames[curLv - 1]}】</span>
              </div>
              <span class="island-lv-badge ${isMax ? 'is-max' : ''}" style="position:static;">Lv.${curLv} ${isMax ? 'MAX' : ''}</span>
            </div>
            <div class="build-card-desc">
              <div style="color:var(--text-color); font-weight:700; margin-bottom:2px;">當前效果：${cfg.perks[curLv - 1]}</div>
              ${!isMax ? `<div style="color:#0a84ff; font-weight:600;">下級解鎖：${cfg.perks[curLv]}</div>` : '<div style="color:#bf5af2; font-weight:700;">✨ 已達最高級！享受頂級小鎮特權</div>'}
            </div>
            <div class="build-card-footer">
              <div style="font-size:0.76rem; color:var(--text-muted); font-weight:700;">
                ${isMax ? '🏆 滿星榮譽' : `升級需求: <strong style="color:${canAfford ? '#ff9f0a' : '#ff3b30'};">$${nextCost}</strong>`}
              </div>
              <button class="btn-upgrade-island" ${isMax || !canAfford ? 'disabled' : ''} onclick="upgradeLandmark('${loc}')">
                ${isMax ? '⭐ 已滿級' : `升級 ($${nextCost})`}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function settleTownProsperityDividend() {
      const sumLv = getTownProsperityTotal();
      let bonus = 0;
      if (sumLv >= 18) bonus = 100;
      else if (sumLv >= 15) bonus = 50;
      else if (sumLv >= 10) bonus = 20;

      if (bonus > 0) {
        gameState.money += bonus;
        gameState.totalLifetimeEarnings = (gameState.totalLifetimeEarnings || 0) + bonus;
        queueFloatingText(`🏛️ 小鎮繁榮紅利發放！獲得 +$${bonus} 💰`);
        playSound('buy');
      }
    }

    function petCat() {
      playSound('click');
      gameState.stress = Math.max(0, gameState.stress - 5);
      queueFloatingText("🐱 摸摸咪咪！咪咪呼嚕嚕叫超療癒 (壓力 -5)");
      const b = document.getElementById("cat-bubble");
      if (b) {
        b.innerText = "呼嚕嚕~ 🐾";
        b.style.display = "block";
        setTimeout(() => { b.innerText = "喵~ 🐾"; }, 2500);
      }
      updateUI();
    }

    let gameState = {
      gradeIndex: 0,
      money: 0,
      difficulty: 1.0,
      rebirthCount: 0, // 轉世次數

      subjects: {
        cn: { name: "國文", school: 0, home: 0 },
        en: { name: "英文", school: 0, home: 0 },
        ma: { name: "數學", school: 0, home: 0 },
        sc: { name: "自然", school: 0, home: 0 },
        so: { name: "社會", school: 0, home: 0 }
      },

      energy: 100,
      hunger: 100,
      stress: 0,

      bag: {
        chicken: 0,
        drink: 0,
        mentalbook: 0,
        bento: 0,     // 高級便當
        vitamin: 0    // 綜合維他命
      },

      passive: {
        book: 0,
        shoes: 0,
        headphone: 0, // 降噪耳機
        tablet: 0,    // 學習平板
        sofa: 0,      // 高級沙發
        trophy: 0     // 獎盃展示櫃
      },

      // 6 大島嶼建設等級 (Lv.1 ~ Lv.3)
      landmarkLevels: { school: 1, restaurant: 1, gym: 1, library: 1, store: 1, home: 1 },

      // Buff 系統（小遊戲獎懲）
      buffs: [], // { type: 'study_boost', multiplier: 1.5, minutesLeft: 30, icon: '📚', positive: true }

      // 小遊戲冷卻計時器（遊戲分鐘）
      miniGameCooldowns: { school: 0, restaurant: 0, gym: 0, library: 0, store: 0, home: 0 },

      // 世界變異（每次輪迴重置）
      worldMutations: [],

      // 經濟追蹤與打工/奇遇/好友統計
      totalLifetimeEarnings: 0, // 累計所有輪迴總收入
      lastRentDay: 0,           // 上次繳房租的遊戲天
      workHoursTotal: 0,        // 累計打工小時數
      randomEventsResolved: 0,  // 累計處理突發事件數
      friends: { xiaoxuan: 0, dameng: 0, yuqing: 0, xiaohao: 0 },
      friendChatDay: { xiaoxuan: -1, dameng: -1, yuqing: -1, xiaohao: -1 },

      // 小遊戲統計
      miniGameWins: { school: 0, restaurant: 0, gym: 0, library: 0, store: 0, home: 0 },
      miniGamePlays: { school: 0, restaurant: 0, gym: 0, library: 0, store: 0, home: 0 },

      dayOfWeek: 1,
      hour: 8,
      minute: 0,

      speed: 1,
      overrideAction: null,
      overrideHoursLeft: 0,

      isCommuting: false,
      commuteStart: 'home',
      commuteTarget: 'school',
      commuteMinutesTotal: 0,
      commuteMinutesLeft: 0,
      currentX: 785,
      currentY: 445,

      totalGameDays: 0,
      examCooldownEndDays: 0,
      examCooldownEndHour: 0,
      examCooldownEndMinute: 0,
      parentsStatus: 'alive',
      parentsStatusReason: '',
      parentsRebornReason: '',
      equipped: { hat: null, clothes: null, shoes: null },
      customSkins: { hat: [], clothes: [], shoes: [] },
      lastSaved: Date.now()
    };

    // 所有初始狀態的快照（用於轉生重置）

    // ------------------------------------------
    // 玩家派遣與地標點擊 (開關燈攔截)
    // ------------------------------------------
    function landmarkClick(loc) {
      if (loc === 'home' && homeLocked) {
        playSound('examFail');
        createFloatingText("上學時間，不能回家喔！🏠");
        return;
      }
      if (loc === 'school' && schoolLocked) {
        playSound('examFail');
        createFloatingText("放學時間，學校關門囉！🏫");
        return;
      }
      if (loc === 'restaurant' && restaurantLocked) {
        playSound('examFail');
        createFloatingText("餐廳打烊囉！營業時間：7:00 ~ 22:00 🍔");
        return;
      }
      if (loc === 'library' && libraryLocked) {
        playSound('examFail');
        createFloatingText("圖書館關門囉！營業時間：8:00 ~ 21:00 📖");
        return;
      }
      if (loc === 'store' && storeLocked) {
        playSound('examFail');
        createFloatingText("平日上課時間 (8:00~16:00)，不能去超商打工喔！🏪");
        return;
      }

      playSound('click');
      if (loc === 'home') {
        playerCommand('sleep'); // 住家現在只能睡覺
      } else if (loc === 'school') {
        playerCommand('study-school');
      } else if (loc === 'gym') {
        playerCommand('sports');
      } else if (loc === 'restaurant') {
        playerCommand('eat');
      } else if (loc === 'library') {
        playerCommand('study-library');
      } else if (loc === 'store') {
        playerCommand('work');
      }
    }

    function playerCommand(action) {
      // 點擊派遣時的攔截
      if (action === 'sleep' && homeLocked) {
        playSound('examFail');
        createFloatingText("上學時間，不能回家喔！🏠");
        return;
      }
      if (action === 'eat' && restaurantLocked) {
        playSound('examFail');
        createFloatingText("餐廳打烊囉！🍔");
        return;
      }
      if (action === 'study-school' && schoolLocked) {
        playSound('examFail');
        createFloatingText("下課時間，學校關門囉！🏫");
        return;
      }
      if (action === 'study-library' && libraryLocked) {
        playSound('examFail');
        createFloatingText("圖書館關門囉！📖");
        return;
      }
      if (action === 'work' && storeLocked) {
        playSound('examFail');
        createFloatingText("平日上課時間，不能去超商打工喔！🏪");
        return;
      }

      playSound('click');

      // 玩家發出派遣命令，立刻恢復相機追隨
      userScrolling = false;
      if (userScrollTimer) {
        clearTimeout(userScrollTimer);
        userScrollTimer = null;
      }

      gameState.overrideAction = action;
      gameState.overrideHoursLeft = 2;

      decideLocationAndState();
      updateUI();
      saveGameData(); // 玩家手動派遣時立即存檔
    }

    function buyItem(type, cost) {
      const priceMut = typeof getMutationMult === 'function' ? getMutationMult('shop_price') : 1.0;
      const finalCost = Math.round(cost * priceMut);
      if (gameState.money >= finalCost) {
        playSound('buy');
        gameState.money -= finalCost;
        gameState.totalSpent = (gameState.totalSpent || 0) + finalCost;
        gameState.bag[type] = (gameState.bag[type] || 0) + 1;
        updateUI();
        saveGameData(); // 立即存檔
        createFloatingText(`購買成功! (-$${finalCost})`);
      } else {
        createFloatingText(`❌ 零用錢不夠喔！(需 $${finalCost})`);
      }
    }

    function useItem(type) {
      if ((gameState.bag[type] || 0) > 0) {
        playSound('click');
        gameState.bag[type] -= 1;

        if (type === 'chicken') {
          gameState.hunger = 100;
          gameState.stress = Math.max(0, gameState.stress - 15);
          queueFloatingText("🍗 吃雞排！真香！(飽足全滿,壓力-15)");
        } else if (type === 'drink') {
          gameState.energy = Math.min(100, gameState.energy + 30);
          gameState.stress = Math.min(100, gameState.stress + 5);
          queueFloatingText("🥤 喝提神飲料！(精力+30,壓力+5)");
        } else if (type === 'mentalbook') {
          gameState.stress = Math.max(0, gameState.stress - 30);
          gameState.energy = Math.max(0, gameState.energy - 10);
          queueFloatingText("📗 讀了勵志書！壓力-30，精力-10");
        } else if (type === 'bento') {
          gameState.hunger = 100;
          gameState.stress = Math.max(0, gameState.stress - 20);
          gameState.energy = Math.min(100, gameState.energy + 10);
          queueFloatingText("🍱 享用高級便當！(飽足全滿,壓力-20,精力+10)");
        } else if (type === 'vitamin') {
          gameState.energy = Math.min(100, gameState.energy + 20);
          gameState.hunger = Math.min(100, gameState.hunger + 20);
          gameState.stress = Math.max(0, gameState.stress - 20);
          queueFloatingText("💊 吃綜合維他命！(精力+20,飽足+20,壓力-20)");
        }

        updateUI();
        saveGameData(); // 立即存檔
      }
    }

    function buyPassive(type, cost) {
      const priceMut = typeof getMutationMult === 'function' ? getMutationMult('shop_price') : 1.0;
      const finalCost = Math.round(cost * priceMut);
      if (gameState.money >= finalCost) {
        playSound('buy');
        gameState.money -= finalCost;
        gameState.totalSpent = (gameState.totalSpent || 0) + finalCost;
        gameState.passive[type] = (gameState.passive[type] || 0) + 1;
        updateUI();
        saveGameData(); // 立即存檔
        createFloatingText(`升級被動設備成功！(-$${finalCost})`);
      } else {
        createFloatingText(`❌ 零用錢不夠喔！(需 $${finalCost})`);
      }
    }

