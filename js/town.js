/* ==========================================================================
   🎮 GBA SCHOLAR IDLE - TOWN & LANDMARK ENGINE (v9.10.4)
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

    // ---------- v9.1 花錢系統：住家裝潢 / 小鎮美化 / 獎學金捐贈 ----------
    const HOME_DECOR_TIERS = [null,
      { name: '溫馨小窩', price: 800, desc: '地毯 ＋ 綠植盆栽' },
      { name: '書香升級', price: 3000, desc: '小書櫃 ＋ 閱讀檯燈（睡眠恢復 +4%）' },
      { name: '舒適客廳', price: 9000, desc: '壁掛電視 ＋ 沙發（睡眠恢復 +8%）' },
      { name: '豪華套房', price: 25000, desc: '水族箱 ＋ 獎盃櫃（睡眠恢復 +16%）' }];
    const TOWN_BEAUTY_DEFS = {
      arch: { name: '🌸 公園花拱門', price: 12000 },
      fountain: { name: '⛲ 音樂噴水池', price: 20000 },
      statue: { name: '🗽 學霸紀念雕像', price: 40000 } };
    function buyHomeDecor(tier) {
      const def = HOME_DECOR_TIERS[tier];
      if (!def) return;
      const cur = gameState.homeDecor || 0;
      if (cur >= tier) { createFloatingText('✅ 這一階裝潢已經完成囉'); return; }
      if (cur !== tier - 1) { createFloatingText('🪜 裝潢要一階一階來，先完成前一階'); return; }
      if (gameState.money < def.price) { playSound('examFail'); createFloatingText(`❌ 錢不夠！裝潢「${def.name}」需要 $${def.price}`); return; }
      gameState.money -= def.price;
      gameState.homeDecor = tier;
      playSound('levelUp');
      queueFloatingText(`🏠 住家裝潢完成：${def.name}！（${def.desc}）`);
      refreshMoneySinks(); updateUI(); saveGameData();
    }
    function buyTownBeauty(key) {
      const def = TOWN_BEAUTY_DEFS[key];
      if (!def) return;
      if (!gameState.townBeauty) gameState.townBeauty = {};
      if (gameState.townBeauty[key]) { createFloatingText('✅ 這項美化工程已經完工囉'); return; }
      if (gameState.money < def.price) { playSound('examFail'); createFloatingText(`❌ 錢不夠！「${def.name}」需要 $${def.price}`); return; }
      gameState.money -= def.price;
      gameState.townBeauty[key] = true;
      playSound('levelUp');
      queueFloatingText(`🎉 小鎮美化完工：${def.name}！去地圖上看看吧`);
      refreshMoneySinks(); updateUI(); saveGameData();
    }
    function donorTitle() {
      const t = gameState.donatedTotal || 0;
      if (t >= 50000) return '👑 小鎮之光';
      if (t >= 15000) return '🏅 榮譽鎮民';
      if (t >= 3000) return '💛 熱心鎮民';
      return '尚未獲得稱號';
    }
    function donateScholarship(amount) {
      if (gameState.money < amount) { playSound('examFail'); createFloatingText(`❌ 錢不夠捐 $${amount} 喔`); return; }
      gameState.money -= amount;
      gameState.donatedTotal = (gameState.donatedTotal || 0) + amount;
      gameState.stress = Math.max(0, gameState.stress - 5);
      playSound('levelUp');
      queueFloatingText(`💛 捐贈獎學金 $${amount}（累計 $${gameState.donatedTotal}・${donorTitle()}），做好事心情好，壓力 −5`);
      refreshMoneySinks(); updateUI(); saveGameData();
    }
    function refreshMoneySinks() {
      const decor = gameState.homeDecor || 0;
      for (let i = 1; i <= 4; i++) {
        const g = document.getElementById('decor-' + i);
        if (g) g.style.display = decor >= i ? 'block' : 'none';
        const b = document.getElementById('btn-decor-' + i);
        if (b) {
          if (decor >= i) { b.textContent = '✅ 已完成'; b.disabled = true; }
          else if (decor === i - 1) { b.textContent = `$${HOME_DECOR_TIERS[i].price} 裝潢`; b.disabled = false; }
          else { b.textContent = '🔒 先完成前一階'; b.disabled = true; }
        }
      }
      const ds = document.getElementById('decor-status');
      if (ds) ds.textContent = decor > 0 ? `目前裝潢：${HOME_DECOR_TIERS[decor].name}（睡眠恢復 +${decor * 4}%）` : '目前裝潢：樸素小屋';
      const tb = gameState.townBeauty || {};
      Object.keys(TOWN_BEAUTY_DEFS).forEach(k => {
        const g = document.getElementById('beauty-' + k);
        if (g) g.style.display = tb[k] ? 'block' : 'none';
        const b = document.getElementById('btn-beauty-' + k);
        if (b) { b.textContent = tb[k] ? '✅ 已完工' : `$${TOWN_BEAUTY_DEFS[k].price} 興建`; b.disabled = !!tb[k]; }
      });
      const dn = document.getElementById('donor-status');
      if (dn) dn.textContent = `累計捐贈 $${gameState.donatedTotal || 0}・稱號：${donorTitle()}`;
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

    // ================= v9.8 精緻化：座位池＋門口排隊＋全員步行職員＋爸媽 =================
    const NPC_DEFS = [
      { key: 'jie', kind: 'rival', name: '王子傑', homeX: 620, speed: 68, palette: { hair: '#f5c542', outfit: '#2e6fd8', shorts: '#1f3a93' }, say: ['「這週的獎學金，我先預約了。」', '「我準備好了，你呢？」'] },
      { key: 'kui', kind: 'rival', name: '陳小葵', homeX: 1240, speed: 62, palette: { hair: '#ff8fab', outfit: '#ff6b9d', shorts: '#5b2a86' }, say: ['「嘻嘻，我好像比較快喔～」', '「我隨時可以考囉！」'] },
      { key: 'shu', kind: 'rival', name: '高大樹', homeX: 1830, speed: 58, palette: { hair: '#2f6b33', outfit: '#27ae60', shorts: '#1e8449' }, say: ['「一步一腳印，我先到了。」', '「準備完成，等你一起考。」'] },
      { key: 'xiaoxuan', kind: 'friend', name: '林曉萱', speed: 60, palette: { hair: '#1a1a24', outfit: '#3b6ea5', shorts: '#2c3e50' }, spots: ['school', 'library'], say: ['「一起加油！」', '「今天也要坐第一排！」'] },
      { key: 'dameng', kind: 'friend', name: '陳大猛', speed: 72, palette: { hair: '#3c2415', outfit: '#ff7f27', shorts: '#2c3e50' }, spots: ['gym', 'restaurant'], say: ['「打完球吃雞排最爽！」', '「要不要一起跑兩圈？」'] },
      { key: 'yuqing', kind: 'friend', name: '蘇語晴', speed: 55, palette: { hair: '#5b3a29', outfit: '#8e44ad', shorts: '#2c3e50' }, spots: ['library', 'store'], say: ['「圖書館角落最安靜。」', '「送你一句讀書秘訣。」'] },
      { key: 'xiaohao', kind: 'friend', name: '王小豪', speed: 58, palette: { hair: '#3c2415', outfit: '#e67e22', shorts: '#2c3e50' }, spots: ['restaurant', 'store'], say: ['「這家超好吃！」', '「我請客，別客氣！」'] },
      { key: 'teacher', kind: 'staff', name: '王老師', homeX: 940, speed: 62, palette: { hair: '#2c1810', outfit: '#2c3e50', shorts: '#2c3e50' }, work: 'school', spot: { x: 575, y: 134 }, shift: { days: 'weekday', start: 480, end: 960 }, say: ['「上課認真！」', '「這題考試會考。」'] },
      { key: 'clerk', kind: 'staff', name: '小惠', homeX: 1550, speed: 60, palette: { hair: '#3c2415', outfit: '#2ed573', shorts: '#2c3e50' }, work: 'store', spot: { x: 880, y: 150 }, shift: { days: 'daily', start: 480, end: 1320 }, say: ['「叮咚！歡迎光臨！」', '「關東煮很好吃喔！」'] },
      { key: 'librarian', kind: 'staff', name: '小林', homeX: 780, speed: 60, palette: { hair: '#1a1a24', outfit: '#2980b9', shorts: '#2c3e50' }, work: 'library', spot: { x: 575, y: 138 }, shift: { days: 'daily', start: 480, end: 1260 }, say: ['「請保持安靜喔。」', '「這本書很推薦！」'] },
      { key: 'chef', kind: 'staff', name: '阿火師', homeX: 1090, speed: 62, palette: { hair: '#1a1a24', outfit: '#ffffff', shorts: '#2c3e50' }, work: 'restaurant', spot: { x: 300, y: 143 }, shift: { days: 'daily', start: 420, end: 1320 }, say: ['「拉麵現煮中！」', '「鐵板燒好了！」'] },
      { key: 'coach', kind: 'staff', name: '阿力', homeX: 1370, speed: 85, palette: { hair: '#3c2415', outfit: '#e74c3c', shorts: '#2c3e50' }, work: 'gym', spot: { x: 1610, y: 150 }, shift: { days: 'daily', oncall: true }, say: ['「跑起來！」', '「再兩圈！」'] },
      { key: 'clerk2', kind: 'staff', name: '阿哲', homeX: 1690, speed: 60, palette: { hair: '#2c1810', outfit: '#8e44ad', shorts: '#2c3e50' }, work: 'store', spot: { x: 990, y: 150 }, shift: { days: 'daily', start: 1320, end: 480 }, say: ['「大夜班，歡迎光臨。」', '「關東煮還有喔。」', '「泡麵配窗邊，深夜限定。」'] },
      { key: 'dad', kind: 'parent', name: '爸爸', speed: 60, palette: { hair: '#2c1810', outfit: '#2c3e50', shorts: '#2c3e50' }, sleepSpot: { x: 118, y: 158 }, homeSpot: { x: 480, y: 215 }, say: ['「早點睡，別熬夜。」', '「考試加油！」'] },
      { key: 'mom', kind: 'parent', name: '媽媽', speed: 60, palette: { hair: '#7b4b94', outfit: '#c0392b', shorts: '#2c3e50' }, sleepSpot: { x: 206, y: 158 }, homeSpot: { x: 530, y: 215 }, say: ['「飯煮好了，快來吃。」', '「天冷了多穿點。」'] },
    ];
    const NPC_STREET_Y = 300;
    const NPC_DOOR_Y = 240;
    const NPC_HOUSE_Y = 505;
    const NPC_PARK_Y = 440;
    const NPC_DOOR_X = { home: 175, store: 485, restaurant: 795, school: 1105, library: 1415, gym: 1732 };
    // 玩家專屬位子：座位池永遠保留，NPC 絕不坐上去跟玩家重疊
    const PLAYER_RESERVED = { school: { x: 590, y: 250 }, library: { x: 140, y: 235 }, restaurant: { x: 440, y: 184 }, store: { x: 565, y: 252 }, gym: { x: 1652, y: 75 } };
    const SPECIAL_MENU = [
      { name: '招牌炒麵', emoji: '🍝' }, { name: '豚骨拉麵', emoji: '🍜' }, { name: '鐵板牛排', emoji: '🥩' },
      { name: '香煎雞腿', emoji: '🍗' }, { name: '海鮮炒飯', emoji: '🍚' }, { name: '麻婆豆腐', emoji: '🌶️' }, { name: '味噌鮭魚', emoji: '🐟' },
    ];
    function todaysSpecial() { return SPECIAL_MENU[(gameState.totalGameDays || 0) % SPECIAL_MENU.length]; }
    let ORDERS_PENDING = false;
    function ensureTeppanFx() {
      const island = document.getElementById('landmark-restaurant');
      if (!island) return null;
      let fx = document.getElementById('teppan-fx');
      const host = document.getElementById('rest-rooms') || island; // v9.18：FX 住進餐廳場景（鐵板上方）
      if (!fx) {
        fx = document.createElement('div');
        fx.id = 'teppan-fx';
        fx.innerHTML = '<span class="flame">🔥</span><span class="steam-puff sp1"></span><span class="steam-puff sp2"></span><span class="steam-puff sp3"></span>';
        host.appendChild(fx);
      } else if (fx.parentNode !== host) host.appendChild(fx);
      return fx;
    }
    let _specialSignText = '';
    function updateSpecialSign() {
      const sign = document.getElementById('special-sign');
      if (!sign) return;
      const sp = todaysSpecial();
      const txt = `今日特餐 ${sp.emoji} ${sp.name}`;
      if (txt !== _specialSignText) { _specialSignText = txt; sign.textContent = txt; }
    }
    // v9.16 超商窗邊座位（NPC 深夜泡麵 + 主角窗邊泡麵共用）
    const STORE_WINDOW_SEATS = [{ x: 110, y: 262 }, { x: 200, y: 262 }, { x: 290, y: 262 }]; // v9.17 室內窗邊吧台
    const windowSeatTaken = [false, false, false];
    function claimWindowSeat() { const i = windowSeatTaken.indexOf(false); if (i < 0) return -1; windowSeatTaken[i] = true; return i; }
    function freeWindowSeat(i) { if (i != null && i >= 0) windowSeatTaken[i] = false; }
    const NOODLE_NIGHT_LINES = ['「深夜的泡麵，特別好吃。」', '「呼…整天累都散了。」', '「窗外沒人，只有這間店還亮著。」', '「明天…再加油吧。」', '「阿哲的關東煮也不錯。」', '「這個時間還醒著的，都是有故事的人。」'];
    const NPC_SEAT_POOLS = {
      school: { activity: 'study', grid: [[430, 185], [590, 185], [750, 185], [430, 250], [590, 250], [750, 250]] }, // v9.22 教室中間 6 張課桌
      library: { activity: 'study', grid: [[240, 208], [350, 208], [460, 208], [740, 208], [850, 208], [960, 208]] }, // v9.26 圖書館室內閱讀桌
      restaurant: { activity: 'dine', grid: [[120, 184], [200, 184], [280, 184], [360, 184], [440, 184], [520, 184], [738, 190], [802, 190], [958, 238], [1022, 238]] }, // v9.19 吧台排（南移不被擋）＋圓桌座
      store: { activity: 'browse', grid: [[420, 205], [500, 205], [580, 205], [660, 205], [460, 255], [620, 255]] }, // v9.17 室內貨架走道
      gym: { activity: 'sport', grid: [[1680, 100], [1730, 100], [1780, 100], [1830, 100], [1700, 140], [1800, 140]] },
    };
    // v9.19 桌上餐點：開吃時把對應的菜放到桌上（不只頭上泡泡）
    const PICK_ITEMS = ['🍙', '🍞', '🥛', '🧃', '🍫', '🍩', '🍎', '🧴', '🥫', '🍮'];
    function syncDishPlate(npc, show, emoji, px, py, roomsId, z) {
      let pl = (npc._plateEl && npc._plateEl.nodeType === 1) ? npc._plateEl : null; // v9.20 存檔會把 DOM 參照序列化成 {} —— 不是元素就重建（v9.19 實機存檔中毒修正）
      if (show) {
        const rooms = document.getElementById(roomsId);
        if (!rooms) { if (pl) { pl.style.display = 'none'; } return; }
        if (!pl) { pl = document.createElement('div'); pl.className = 'dish-plate'; npc._plateEl = pl; }
        if (pl.parentNode !== rooms) rooms.appendChild(pl);
        pl.style.display = 'block';
        pl.style.left = px + 'px'; pl.style.top = py + 'px'; pl.style.zIndex = String(z || 958);
        if (pl.textContent !== emoji) pl.textContent = emoji;
      } else if (pl && pl.style.display !== 'none') pl.style.display = 'none';
    }
    // ================= v9.20 超商顧客完整購物流程：逛→看→拿→(放回)→排隊→結帳→離開 =================
    const SHOP_POINTS = [[420, 205], [500, 205], [580, 205], [660, 205], [460, 255], [620, 255]];
    const SHOP_QUEUE_SLOTS = [{ x: 925, y: 195 }, { x: 850, y: 195 }, { x: 775, y: 195 }];
    const SHOP_LINE = [];
    function spawnShopPop(npc, emoji, dy) {
      const rooms = document.getElementById('store-rooms');
      if (!rooms) return;
      const pop = document.createElement('div');
      pop.className = 'pick-pop';
      pop.textContent = emoji;
      pop.style.left = (npc.x - 8) + 'px'; pop.style.top = (npc.y + (dy || -52)) + 'px';
      rooms.appendChild(pop);
      setTimeout(() => { if (pop.parentNode) pop.parentNode.removeChild(pop); }, 2000);
    }
    function pickShopPoint(npc) {
      let i = Math.floor(Math.random() * SHOP_POINTS.length);
      if (i === npc.shopPt) i = (i + 1) % SHOP_POINTS.length;
      npc.shopPt = i;
      return { x: SHOP_POINTS[i][0] + Math.floor(Math.random() * 17) - 8, y: SHOP_POINTS[i][1] };
    }
    function startShopCycle(npc) {
      npc.shopStage = 'look';
      npc.looksLeft = 2 + (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.35 ? 1 : 0); // 逛 2–4 個區
      npc.picked = 0; npc.putbackDone = false; npc.pickCd = 1 + Math.random() * 3;
      npc.path = interiorPathTo(npc, 'store', pickShopPoint(npc));
      npc.arrive = 'shop';
    }
    function shopGoQueue(npc) {
      npc.shopStage = 'queue';
      if (!SHOP_LINE.includes(npc.key)) SHOP_LINE.push(npc.key);
      const idx = Math.min(SHOP_LINE.indexOf(npc.key), SHOP_QUEUE_SLOTS.length - 1);
      npc.path = [SHOP_QUEUE_SLOTS[idx]]; npc.arrive = 'shopq'; npc.state = 'path';
    }
    function advanceShopCycle(npc) {
      if (npc.shopStage === 'look') {
        npc.looksLeft = (npc.looksLeft || 1) - 1;
        if (npc.looksLeft > 0) { npc.path = [pickShopPoint(npc)]; npc.arrive = 'shop'; npc.state = 'path'; return; }
        if ((npc.picked || 0) > 0 && !npc.putbackDone && Math.random() < 0.3) { npc.shopStage = 'putback'; npc.path = [pickShopPoint(npc)]; npc.arrive = 'shop'; npc.state = 'path'; return; }
        shopGoQueue(npc); return;
      }
      if (npc.shopStage === 'putback') { npc.putbackDone = true; shopGoQueue(npc); return; }
      if (npc.shopStage === 'pay') {
        npc.shopStage = null; npc.picked = 0;
        const li = SHOP_LINE.indexOf(npc.key); if (li >= 0) SHOP_LINE.splice(li, 1);
        npcExitPath(npc); return;
      }
      npcExitPath(npc);
    }
    function shopQueueTick() {
      const npcs = gameState.npcs || [];
      for (let i = SHOP_LINE.length - 1; i >= 0; i--) {
        const n = npcs.find(x => x.key === SHOP_LINE[i]);
        if (!n || n.dest !== 'store' || n.state === 'away' || (n.shopStage !== 'queue' && n.shopStage !== 'pay')) SHOP_LINE.splice(i, 1);
      }
      SHOP_LINE.forEach((key, idx) => {
        const n = npcs.find(x => x.key === key);
        if (!n) return;
        const slot = SHOP_QUEUE_SLOTS[Math.min(idx, SHOP_QUEUE_SLOTS.length - 1)];
        if (idx === 0 && n.shopStage === 'queue' && n.state === 'seated' && Math.abs(n.x - slot.x) < 6 && Math.abs(n.y - slot.y) < 6) {
          n.shopStage = 'pay'; n.dwell = 4; spawnShopPop(n, '💵', -56); return;
        }
        if (n.shopStage === 'queue' && n.state === 'seated' && (Math.abs(n.x - slot.x) > 4 || Math.abs(n.y - slot.y) > 4)) {
          n.path = [slot]; n.arrive = 'shopq'; n.state = 'path';
        }
      });
    }
    let SEAT_MAP = null;
    const QUEUES = { school: [], library: [], restaurant: [], store: [], gym: [] };
    function ensureSeats() {
      if (SEAT_MAP) return SEAT_MAP;
      SEAT_MAP = {};
      Object.keys(NPC_SEAT_POOLS).forEach(b => {
        const r = PLAYER_RESERVED[b];
        SEAT_MAP[b] = NPC_SEAT_POOLS[b].grid
          .filter(([x, y]) => !r || Math.hypot(x - r.x, y - r.y) >= 28)
          .map(([x, y]) => ({ x, y, who: null }));
      });
      return SEAT_MAP;
    }
    const STORE_DOOR_IN = { x: 485, y: 240, door: 'in', loc: 'store', ix: 565, iy: 278 }; // v9.17 超商門口瞬移（世界↔室內）
    const STORE_DOOR_OUT = { x: 565, y: 278, door: 'out', loc: 'store', wx: 485, wy: 240 };
    const REST_DOOR_IN = { x: 795, y: 240, door: 'in', loc: 'restaurant', ix: 610, iy: 278 }; // v9.18 餐廳門口瞬移
    const REST_DOOR_OUT = { x: 610, y: 278, door: 'out', loc: 'restaurant', wx: 795, wy: 240 };
    const SCHOOL_DOOR_IN = { x: 1105, y: 240, door: 'in', loc: 'school', ix: 575, iy: 278 }; // v9.21 學校門口瞬移
    const SCHOOL_DOOR_OUT = { x: 575, y: 278, door: 'out', loc: 'school', wx: 1105, wy: 240 };
    const LIB_DOOR_IN = { x: 1415, y: 240, door: 'in', loc: 'library', ix: 575, iy: 278 }; // v9.26 圖書館門口瞬移
    const LIB_DOOR_OUT = { x: 575, y: 278, door: 'out', loc: 'library', wx: 1415, wy: 240 };
    const INTERIORS = { // v9.18 室內場景通用表
      store: { roomsId: 'store-rooms', doorIn: STORE_DOOR_IN, doorOut: STORE_DOOR_OUT, worldDoorX: 485, inDoor: { x: 565, y: 278 } },
      restaurant: { roomsId: 'rest-rooms', doorIn: REST_DOOR_IN, doorOut: REST_DOOR_OUT, worldDoorX: 795, inDoor: { x: 610, y: 278 } },
      school: { roomsId: 'school-rooms', doorIn: SCHOOL_DOOR_IN, doorOut: SCHOOL_DOOR_OUT, worldDoorX: 1105, inDoor: { x: 575, y: 278 } },
      library: { roomsId: 'lib-rooms', doorIn: LIB_DOOR_IN, doorOut: LIB_DOOR_OUT, worldDoorX: 1415, inDoor: { x: 575, y: 278 } }
    };
    function npcExitPrefix(npc) { // v9.24 在室內的人要先走正門出去，路徑才不會在別間的座標系裡亂走（繞去隱藏的邊邊）
      if (npc.insideLoc && INTERIORS[npc.insideLoc]) { const c = INTERIORS[npc.insideLoc]; return [c.inDoor, c.doorOut, { x: c.worldDoorX, y: NPC_STREET_Y }]; }
      return [];
    }
    function interiorPathTo(npc, loc, pt) { const c = INTERIORS[loc]; if (!c) return [pt]; if (npc.insideLoc === loc) return [pt]; return [...npcExitPrefix(npc), { x: c.worldDoorX, y: NPC_STREET_Y }, c.doorIn, pt]; }
    function storePathTo(npc, pt) { return interiorPathTo(npc, 'store', pt); }
    function npcDef(key) { return NPC_DEFS.find(d => d.key === key); }
    function npcIndex(key) { return NPC_DEFS.findIndex(d => d.key === key); }
    function npcRequestSeat(npc, building) {
      const pool = ensureSeats()[building];
      if (!pool) return null;
      const idx = pool.findIndex(s => !s.who);
      if (idx < 0) return null;
      pool[idx].who = npc.key;
      npc.seatIdx = idx;
      return pool[idx];
    }
    function npcFreeSeat(npc) {
      if (npc.seatIdx != null && SEAT_MAP && SEAT_MAP[npc.dest] && SEAT_MAP[npc.dest][npc.seatIdx] && SEAT_MAP[npc.dest][npc.seatIdx].who === npc.key) {
        SEAT_MAP[npc.dest][npc.seatIdx].who = null;
      }
      npc.seatIdx = null;
    }
    function queueSlotPos(building, i) { return { x: NPC_DOOR_X[building] - 60 + i * 34, y: NPC_STREET_Y }; }
    function recomputeQueueSlots(building) {
      QUEUES[building].forEach((key, i) => {
        const npc = (gameState.npcs || []).find(n => n.key === key);
        if (!npc) return;
        const slot = queueSlotPos(building, i);
        const atSlot = npc.x === slot.x && npc.y === NPC_STREET_Y;
        const headingThere = npc.path.length === 1 && npc.path[0].x === slot.x && npc.path[0].y === NPC_STREET_Y;
        if (!atSlot && !headingThere) { npc.path = [slot]; npc.arrive = 'queue'; }
      });
    }
    function removeFromQueue(npc) {
      if (npc.queueFor && QUEUES[npc.queueFor]) {
        const arr = QUEUES[npc.queueFor];
        const i = arr.indexOf(npc.key);
        if (i >= 0) { arr.splice(i, 1); recomputeQueueSlots(npc.queueFor); }
      }
      npc.queueFor = '';
    }
    function npcEnqueue(npc, building) {
      QUEUES[building].push(npc.key);
      npc.queueFor = building;
      npc.queueWait = 0;
      const slot = queueSlotPos(building, QUEUES[building].length - 1);
      npc.path = [{ x: slot.x, y: NPC_STREET_Y }];
      npc.arrive = 'queue';
      npc.state = 'path';
    }
    function npcSeatNext(building) {
      if (!QUEUES[building] || !QUEUES[building].length) return;
      const key = QUEUES[building][0];
      const npc = (gameState.npcs || []).find(n => n.key === key);
      if (!npc || (npc.state !== 'queue' && !(npc.state === 'path' && npc.arrive === 'queue'))) {
        QUEUES[building].shift();
        recomputeQueueSlots(building);
        return;
      }
      const seat = npcRequestSeat(npc, building);
      if (seat) {
        QUEUES[building].shift();
        npc.path = INTERIORS[building] ? interiorPathTo(npc, building, seat) : [{ x: NPC_DOOR_X[building], y: NPC_STREET_Y }, seat];
        npc.arrive = 'seat';
        npc.state = 'path';
        npc.queueFor = '';
        recomputeQueueSlots(building);
      }
    }
    function gymOccupiedNow() {
      try {
        if (typeof currentLoc !== 'undefined' && currentLoc === 'gym') return true;
        if (gameState.commuteTarget === 'gym') return true;
      } catch (e) {}
      return (gameState.npcs || []).some(n => n.key !== 'coach' && n.dest === 'gym' && (n.state === 'seated' || n.state === 'path' || n.state === 'queue'));
    }
    function ensureNPCs() {
      (gameState.npcs || []).forEach(n => { if ((n.kind === 'rival' || n.kind === 'staff') && n.state === 'sleeping' && n.dest === 'home') { n.state = 'away'; n.dest = 'away'; n.x = -80; n.y = NPC_STREET_Y; n.path = []; } }); // v9.15 舊存檔遷移：睡在已拆除的小屋
      const ok = Array.isArray(gameState.npcs) && gameState.npcs.length === NPC_DEFS.length
        && NPC_DEFS.every((d, i) => gameState.npcs[i] && gameState.npcs[i].key === d.key && gameState.npcs[i].kind === d.kind);
      if (ok) return gameState.npcs;
      gameState.npcs = NPC_DEFS.map((d, i) => {
        if (d.kind === 'parent') return { key: d.key, kind: d.kind, x: d.sleepSpot.x, y: d.sleepSpot.y, state: 'sleeping', dest: 'home', path: [], arrive: '', dwell: 0, dir: 1, seatIdx: null, queueFor: '', queueWait: 0, orderLeft: 0, inside: true }; // v9.14
        if (d.kind === 'rival' || d.kind === 'staff') return { key: d.key, kind: d.kind, x: -80, y: NPC_STREET_Y, state: 'away', dest: 'away', path: [], arrive: '', dwell: 0, dir: 1, seatIdx: null, queueFor: '', queueWait: 0, orderLeft: 0 }; // v9.15 家在地圖外
        return { key: d.key, kind: d.kind, x: 300 + i * 240, y: NPC_STREET_Y, state: 'path', dest: '', path: [], arrive: '', dwell: 0, dir: 1, seatIdx: null, queueFor: '', queueWait: 0, orderLeft: 0 };
      });
      gameState.npcs.forEach(n => { if (npcDef(n.key).kind === 'friend') npcPickTarget(n); });
      return gameState.npcs;
    }
    function npcHomeTime(npc) { // v9.15：21:00 起每人錯開 0–110 分鐘回家（名字雜湊，固定不跳動）
      let h = 0; const k = npc.key || '';
      for (let i = 0; i < k.length; i++) h = (h * 37 + k.charCodeAt(i)) % 997;
      return 21 * 60 + (h % 110);
    }
    function npcGoToDest(npc, dest) { // v9.15：共用目的地走法（回家=離開地圖）
      const def = npcDef(npc.key);
      // v9.16 深夜窗邊：21:30–04:00 還在外面晃的人，有機會去超商窗邊吃泡麵
      const nowM16 = (gameState.hour || 0) * 60 + (gameState.minute || 0);
      if (dest !== 'away' && npc.kind !== 'parent' && (nowM16 >= 1290 || nowM16 < 240) && Math.random() < 0.4) {
        const wi = claimWindowSeat();
        if (wi >= 0) {
          npc.windowSeat = wi; npc.dest = 'store';
          npc.path = storePathTo(npc, STORE_WINDOW_SEATS[wi]);
          npc.arrive = 'seat'; npc.state = 'path';
          return 'store';
        }
      }
      npc.dest = dest;
      if (dest === 'store' && npc.kind !== 'parent') { // v9.20 顧客進超商＝開始逛（不再只是站一個貨架前）
        startShopCycle(npc);
        npc.state = 'path';
        return dest;
      }
      if (dest === 'away') {
        const fromX = (npc.insideLoc && INTERIORS[npc.insideLoc]) ? INTERIORS[npc.insideLoc].worldDoorX : npc.x;
        npc.path = [...npcExitPrefix(npc), { x: fromX < 960 ? -80 : 2000, y: NPC_STREET_Y }];
        npc.arrive = 'away';
      } else if (dest === 'park') {
        const px = 200 + Math.floor(Math.random() * 1550);
        npc.path = [...npcExitPrefix(npc), { x: px, y: NPC_STREET_Y }, { x: px, y: NPC_PARK_Y }];
        npc.arrive = 'idle';
      } else {
        const seat = npcRequestSeat(npc, dest);
        if (seat) {
          npc.path = INTERIORS[dest] ? interiorPathTo(npc, dest, seat) : [...npcExitPrefix(npc), { x: NPC_DOOR_X[dest], y: NPC_STREET_Y }, seat];
          npc.arrive = 'seat';
        } else {
          npcEnqueue(npc, dest);
          return dest;
        }
      }
      npc.state = 'path';
      return dest;
    }
    function parentBackHome(npc) { // v9.14.4：爸 17:40、媽 18:12 回家
      const t = (gameState.hour || 0) * 60 + (gameState.minute || 0);
      return npc.key === 'mom' ? t >= 18 * 60 + 12 : t >= 17 * 60 + 40;
    }
    function npcPickTarget(npc) {
      const def = npcDef(npc.key);
      const hour = gameState.hour || 0;
      if (npc._lunchForce === gameState.totalGameDays && (hour === 11 || hour === 12)) { // v9.24 午餐強制食堂（11:50 起）
        npc._lunchForce = null;
        npc.dest = 'restaurant';
        const lseat = npcRequestSeat(npc, 'restaurant');
        if (lseat) { npc.path = [...npcExitPrefix(npc), { x: NPC_DOOR_X.restaurant, y: NPC_STREET_Y }, INTERIORS.restaurant.doorIn, lseat]; npc.arrive = 'seat'; npc.state = 'path'; }
        else npcEnqueue(npc, 'restaurant');
        return 'restaurant';
      }
      const dow = gameState.dayOfWeek || 1;
      const weekend = (dow === 6 || dow === 7);
      let dest;
      if (def.kind === 'parent') {
        // v9.14.4：爸媽回家時間錯開（爸 17:40、媽 18:12）
        // v9.14：進出室內在門口瞬間切換座標系（door waypoint）
        const DOOR_IN = { x: NPC_DOOR_X.home, y: NPC_DOOR_Y, door: 'in', ix: 565, iy: 218 };
        const DOOR_OUT = { x: 565, y: 218, door: 'out', wx: NPC_DOOR_X.home, wy: NPC_DOOR_Y };
        if (hour >= 22 || hour < 7) {
          npc.dest = 'home';
          npc.path = npc.inside ? [def.sleepSpot] : [{ x: NPC_DOOR_X.home, y: NPC_STREET_Y }, DOOR_IN, def.sleepSpot];
          npc.arrive = 'sleep'; npc.state = 'path'; return 'home';
        } else if (parentBackHome(npc)) { // v9.14.4 爸 17:40 / 媽 18:12
          npc.dest = 'home';
          npc.path = npc.inside ? [def.homeSpot] : [{ x: NPC_DOOR_X.home, y: NPC_STREET_Y }, DOOR_IN, def.homeSpot];
          npc.arrive = 'athome'; npc.state = 'path'; return 'home';
        } else {
          npc.dest = 'away';
          npc.path = npc.inside ? [DOOR_OUT, { x: NPC_DOOR_X.home, y: NPC_STREET_Y }, { x: npc.x < 960 ? -80 : 2000, y: NPC_STREET_Y }] : [{ x: npc.x < 960 ? -80 : 2000, y: NPC_STREET_Y }];
          npc.arrive = 'away'; npc.state = 'path'; return 'away';
        }
      }
      if (def.kind === 'staff') {
        const nowM = hour * 60 + (gameState.minute || 0);
        const workDay = def.shift.days === 'daily' || !weekend;
        let inWindow = false;
        if (def.shift.oncall) inWindow = workDay && gymOccupiedNow();
        else if (workDay) {
          if (def.shift.start > def.shift.end) inWindow = (nowM >= def.shift.start - 60) || (nowM < def.shift.end);
          else inWindow = (nowM >= def.shift.start - 60) && (nowM < def.shift.end);
        }
        if (inWindow) dest = 'work';
        else if (hour < 7 || nowM >= npcHomeTime(npc)) dest = 'away'; // v9.15 回家=離開地圖
        else dest = ['park', 'park', 'restaurant', 'store', 'library', 'gym'][Math.floor(Math.random() * 6)]; // v9.15 下班先去晃
        if (dest === 'work') {
          npc.dest = def.work;
          npc.path = INTERIORS[def.work] ? interiorPathTo(npc, def.work, def.spot) : [...npcExitPrefix(npc), { x: NPC_DOOR_X[def.work], y: NPC_STREET_Y }, def.spot];
          npc.arrive = 'seat'; npc.state = 'path'; return dest;
        }
        return npcGoToDest(npc, dest);
      }
      if (def.kind === 'rival') {
        if (hour < 7 || (hour * 60 + (gameState.minute || 0)) >= npcHomeTime(npc)) dest = 'away'; // v9.15 21:00 後陸續回家
        else if (weekend) dest = ['library', 'gym', 'restaurant', 'store', 'park'][Math.floor(Math.random() * 5)];
        else if (hour >= 8 && hour < 16) dest = 'school';
        else if (hour >= 17 && hour < 21) dest = ['library', 'library', 'park', 'gym'][Math.floor(Math.random() * 4)];
        else dest = ['restaurant', 'store', 'gym', 'park'][Math.floor(Math.random() * 4)];
      } else {
        if (hour < 7 || (hour * 60 + (gameState.minute || 0)) >= npcHomeTime(npc)) dest = 'away';
        else {
          let pool = [...def.spots, 'park', 'park'];
          if (!schoolPhaseNow()) pool = pool.filter(d => d !== 'school'); // v9.23.1 放學/週末學校不開放，不能再進去坐
          if (!pool.length) pool = ['park'];
          dest = pool[Math.floor(Math.random() * pool.length)];
        }
      }
      return npcGoToDest(npc, dest);
    }
    function npcExitPath(npc) {
      if (npc.windowSeat != null) { freeWindowSeat(npc.windowSeat); npc.windowSeat = null; } // v9.16
      const prevDest = npc.dest;
      npc.breakHome = null; // v9.15：離場順手清掉下課殘留狀態
      npc._parkJoined = false;
      npcFreeSeat(npc);
      if (npc.insideLoc && INTERIORS[npc.insideLoc]) { // v9.17/v9.18：在室內 → 先走到室內門口瞬移出去
        const _ic = INTERIORS[npc.insideLoc];
        npc.path = [_ic.inDoor, _ic.doorOut, { x: _ic.worldDoorX, y: NPC_DOOR_Y }, { x: _ic.worldDoorX, y: NPC_STREET_Y }];
      } else if (npc.dest && NPC_DOOR_X[npc.dest]) {
        npc.path = [{ x: NPC_DOOR_X[npc.dest], y: NPC_DOOR_Y }, { x: NPC_DOOR_X[npc.dest], y: NPC_STREET_Y }];
      } else {
        npc.path = [{ x: npc.x, y: NPC_STREET_Y }];
      }
      npc.arrive = 'street';
      npc.state = 'path';
      if (prevDest && QUEUES[prevDest]) npcSeatNext(prevDest);
    }
    function npcSpriteClass(npc) {
      if (npc.state === 'path') return 'state-commuting';
      if (npc.state === 'sleeping') return 'state-sleeping';
      if (npc.state === 'seated') {
        if (npc.windowSeat != null) return 'state-eating'; // v9.16 窗邊泡麵
        if (npc.kind === 'staff') return (npc.key === 'chef' && ORDERS_PENDING) ? 'state-studying' : 'state-idle';
        const act = NPC_SEAT_POOLS[npc.dest] && NPC_SEAT_POOLS[npc.dest].activity;
        if (act === 'dine') return (npc.phase === 'eat' ? 'state-eating' : 'state-idle');
        if (act === 'sport') return 'state-sports';
        if (act === 'browse') return 'state-idle';
        return 'state-studying';
      }
      return 'state-idle';
    }
    function buildNPCLayer() {
      const map = document.getElementById('town-map');
      if (!map) return;
      const src = document.getElementById('student-sprite');
      if (!src) return;
      if (!document.getElementById('npc-layer')) {
        const layer = document.createElement('div');
        layer.id = 'npc-layer';
        map.appendChild(layer);
        NPC_DEFS.forEach(d => {
          const el = document.createElement('div');
          el.className = 'npc';
          el.id = 'npc-' + d.key;
          const svg = src.cloneNode(true);
          svg.removeAttribute('id');
          svg.querySelectorAll('[id^="char-custom-"]').forEach(n => n.remove());
          const cap = svg.querySelector('.pixel-cap-default');
          if (cap) cap.style.display = 'none';
          svg.querySelectorAll('.pixel-head-group rect[y="5"]').forEach(r => r.setAttribute('fill', d.palette.hair));
          const jacket = svg.querySelector('.pixel-body-group rect[x="3"][y="11"]');
          if (jacket) jacket.setAttribute('fill', d.palette.outfit);
          svg.querySelectorAll('.pixel-hand-l, .pixel-hand-r').forEach(r => r.setAttribute('fill', d.palette.outfit));
          svg.querySelectorAll('.pixel-foot-l rect[width="4"], .pixel-foot-r rect[width="4"]').forEach(r => r.setAttribute('fill', d.palette.outfit));
          const shorts = svg.querySelector('.pixel-body-group rect[x="4"][y="17"]');
          if (shorts) shorts.setAttribute('fill', d.palette.shorts);
          svg.setAttribute('class', 'sprite-pixel npc-sprite state-idle');
          svg.style.width = '26px';
          svg.style.height = '41px';
          el.innerHTML = `<span class="npc-name">${d.name}</span><span class="npc-role" style="display:none;"></span><span class="npc-zzz-tag" style="display:none;">💤</span><span class="npc-flip"></span><span class="npc-dish" style="display:none;"></span>`;
          el.querySelector('.npc-flip').appendChild(svg);
          el.addEventListener('click', () => npcSay(gameState.npcs.find(n => n.key === d.key)));
          layer.appendChild(el);
        });
      }
    }
    // v9.12.2 講台前景層：蓋在 NPC 圖層之上，王老師站上去時下半身被講桌遮住（站在講台後面）
    function ensurePodiumFg() {
      if (document.getElementById('school-stage')) { const pf = document.getElementById('podium-fg'); if (pf) pf.remove(); return; } // v9.21 新場景自帶講台前景，舊層退役
      if (document.getElementById('podium-fg')) return;
      const map = document.getElementById('npc-layer') || document.getElementById('town-map');
      if (!map) return;
      const fg = document.createElement('div');
      fg.id = 'podium-fg';
      fg.style.zIndex = '150'; // v9.12.3 在 NPC 圖層內：蓋住老師(145)、不擋學生(195)與人名
      fg.style.left = '1088px'; fg.style.top = '135px'; fg.style.width = '48px'; fg.style.height = '25px';
      fg.innerHTML = `<svg viewBox="118 110 48 25" style="width:100%; height:100%; display:block;"><g id="sch-podium"><rect x="118" y="110" width="48" height="6" fill="#b0743e" stroke="#182042" stroke-width="1.5" /><rect x="121" y="116" width="42" height="17" fill="#8d5a2c" stroke="#182042" stroke-width="1.5" /><rect x="118" y="131" width="48" height="4" fill="#6d4c41" /></g></svg>`;
      map.appendChild(fg);
    }
    function npcSay(npc, customText) {
      if (!npc || npc.state === 'away' || npc.state === 'sleeping') return;
      if (npc._sayUntil && Date.now() < npc._sayUntil) return;
      npc._sayUntil = Date.now() + 3000;
      const def = npcDef(npc.key);
      const layer = (npc.insideLoc && INTERIORS[npc.insideLoc] && document.getElementById(INTERIORS[npc.insideLoc].roomsId)) || (npc.inside && document.getElementById('home-rooms')) || document.getElementById('npc-layer'); // v9.17.1 室內泡泡進場景；v9.18 查表
      if (!layer) return;
      const bubble = document.createElement('div');
      bubble.className = 'npc-speech';
      bubble.style.left = npc.x + 'px';
      bubble.style.top = (npc.y - 78) + 'px';
      bubble.style.zIndex = '995'; // v9.20 圖層總檢：泡泡永遠在最上層
      bubble.textContent = customText || def.say[Math.floor(Math.random() * def.say.length)];
      layer.appendChild(bubble);
      setTimeout(() => bubble.remove(), 2600);
    }
    // ================= v9.13 住家精緻化：晚餐同桌 =================
    const DINNER_SEATS = { dad: { x: 624, y: 162 }, mom: { x: 685, y: 162 } }; // v9.23.1 坐進桌北側的椅子（椅心 624/685）
    const DINNER_SAY = {
      mom: ['多吃點，看你瘦的。', '今天在學校好嗎？', '這道是你最愛吃的。', '慢點吃，鍋裡還有。'],
      dad: ['吃慢點，沒人跟你搶。', '功課有不懂的，晚上問我。', '最近考試順利嗎？', '嗯，好吃，你媽手藝越來越好了。']
    };
    let _dinnerChatAt = -99;
    function dinnerPhaseNow() {
      const h = gameState.hour || 0, m = gameState.minute || 0;
      if (h === 17 && m >= 40) return 'prep';
      if (h === 18) return 'dinner';
      return null;
    }
    function ensureDinnerFurniture() {
      ensureHomeInterior(); // v9.14：餐桌在室內場景裡
      const layer = document.getElementById('home-rooms');
      if (!layer || document.getElementById('dinner-table-back')) return;
      const back = document.createElement('div');
      back.id = 'dinner-table-back';
      back.style.cssText = 'position:absolute; left:601px; top:118px; width:108px; height:54px; z-index:172; pointer-events:none;';
      back.innerHTML = `<svg viewBox="0 0 88 44" style="width:100%; height:100%; overflow:visible;">
        <rect x="12" y="6" width="14" height="16" fill="#a9743f" stroke="#182042" stroke-width="1.8" />
        <rect x="62" y="6" width="14" height="16" fill="#a9743f" stroke="#182042" stroke-width="1.8" />
        <rect x="4" y="20" width="80" height="7" fill="#b08968" stroke="#182042" stroke-width="1.8" /></svg>`;
      layer.appendChild(back);
      const fg = document.createElement('div');
      fg.id = 'dinner-table-fg';
      fg.style.cssText = 'position:absolute; left:601px; top:118px; width:108px; height:54px; z-index:196; pointer-events:none;';
      fg.innerHTML = `<svg viewBox="0 0 88 44" style="width:100%; height:100%; overflow:visible;">
        <rect x="4" y="40" width="80" height="5" fill="#8b5a2b" stroke="#182042" stroke-width="1.5" />
        <rect x="10" y="45" width="5" height="9" fill="#795548" />
        <rect x="73" y="45" width="5" height="9" fill="#795548" />
        <g id="home-dinner-set" style="display:none;">
          <ellipse cx="20" cy="24" rx="7" ry="3.4" fill="#ffffff" stroke="#182042" stroke-width="1.4" /><ellipse cx="20" cy="23" rx="4" ry="1.8" fill="#fff7e0" />
          <ellipse cx="68" cy="24" rx="7" ry="3.4" fill="#ffffff" stroke="#182042" stroke-width="1.4" /><ellipse cx="68" cy="23" rx="4" ry="1.8" fill="#fff7e0" />
          <ellipse cx="44" cy="25" rx="9" ry="4" fill="#e74c3c" stroke="#182042" stroke-width="1.4" /><ellipse cx="44" cy="24" rx="5.5" ry="2.2" fill="#f39c12" />
          <path class="steam-wisp" d="M38,16 q2,-3 0,-6" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
          <path class="steam-wisp w2" d="M44,17 q2,-3 0,-6" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
          <path class="steam-wisp w3" d="M50,16 q2,-3 0,-6" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
        </g>
        <g id="home-dinner-steam" style="display:none;">
          <path class="steam-wisp" d="M40,20 q2,-3 0,-6" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
          <path class="steam-wisp w2" d="M47,20 q2,-3 0,-6" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
        </g></svg>`;
      layer.appendChild(fg);
    }
    function updateHomeDinnerVisual(phase) {
      ensureDinnerFurniture();
      const set = document.getElementById('home-dinner-set');
      if (set) set.style.display = phase === 'dinner' ? 'block' : 'none';
      const steam = document.getElementById('home-dinner-steam');
      if (steam) steam.style.display = phase === 'prep' ? 'block' : 'none';
    }

    // ================= v9.14 捲動式室內 =================
    const HOME_ROOMS_HTML = `
<svg viewBox="0 0 1150 300" style="position:absolute; left:0; top:0; width:1150px; height:300px;">
  <defs>
    <pattern id="planks" width="46" height="152" patternUnits="userSpaceOnUse">
      <rect width="46" height="152" fill="#d9a066"/><line x1="0" y1="0" x2="0" y2="152" stroke="#b57e46" stroke-width="1.5"/>
    </pattern>
  </defs>
  <rect x="0" y="18" width="340" height="130" fill="#f0e7f7"/>
  <rect x="380" y="18" width="372" height="130" fill="#fdf1dc"/>
  <rect x="792" y="18" width="358" height="130" fill="#e9f2fc"/>
  <rect x="0" y="148" width="1150" height="152" fill="url(#planks)"/>
  <rect x="340" y="18" width="40" height="282" fill="#e8dcc8"/>
  <rect x="752" y="18" width="40" height="282" fill="#e8dcc8"/>
  <rect x="348" y="100" width="24" height="200" fill="#d9a066"/>
  <rect x="760" y="100" width="24" height="200" fill="#d9a066"/>
  <rect x="340" y="88" width="40" height="16" fill="#8a5a33"/>
  <rect x="752" y="88" width="40" height="16" fill="#8a5a33"/>
  <rect x="340" y="96" width="8" height="204" fill="#a5713d"/>
  <rect x="372" y="96" width="8" height="204" fill="#a5713d"/>
  <rect x="752" y="96" width="8" height="204" fill="#a5713d"/>
  <rect x="784" y="96" width="8" height="204" fill="#a5713d"/>
  <rect x="0" y="0" width="1150" height="18" fill="#8a5a33"/>
  <rect x="0" y="140" width="340" height="8" fill="#ffffff" opacity="0.55"/>
  <rect x="380" y="140" width="372" height="8" fill="#ffffff" opacity="0.55"/>
  <rect x="792" y="140" width="358" height="8" fill="#ffffff" opacity="0.55"/>
  <!-- 爸媽房 -->
  <rect x="36" y="40" width="80" height="62" fill="#2b3a67" stroke="#182042" stroke-width="2"/>
  <circle cx="94" cy="58" r="9" fill="#ffe082"/>
  <circle cx="52" cy="52" r="1.8" fill="#ffffff"/><circle cx="66" cy="82" r="1.8" fill="#ffffff"/><circle cx="46" cy="70" r="1.4" fill="#ffffff"/>
  <line x1="76" y1="40" x2="76" y2="102" stroke="#182042" stroke-width="2"/>
  <rect x="30" y="36" width="14" height="72" fill="#b39ddb"/><rect x="108" y="36" width="14" height="72" fill="#b39ddb"/>
  <rect x="150" y="48" width="46" height="36" fill="#ffffff" stroke="#182042" stroke-width="2"/>
  <circle cx="165" cy="68" r="6" fill="#ffcc99"/><circle cx="181" cy="68" r="6" fill="#ffcc99"/><circle cx="173" cy="60" r="5" fill="#ffd9b3"/>
  <rect x="272" y="52" width="60" height="140" fill="#a5713d" stroke="#182042" stroke-width="2"/>
  <line x1="302" y1="52" x2="302" y2="192" stroke="#182042" stroke-width="2"/>
  <circle cx="296" cy="124" r="3" fill="#ffd54f"/><circle cx="308" cy="124" r="3" fill="#ffd54f"/>
  <ellipse cx="162" cy="256" rx="118" ry="20" fill="#ce93d8" opacity="0.45"/>
  <rect x="72" y="116" width="180" height="18" rx="4" fill="#8a5a33" stroke="#182042" stroke-width="2"/>
  <rect x="68" y="130" width="188" height="88" rx="6" fill="#ffffff" stroke="#182042" stroke-width="2"/>
  <rect x="84" y="136" width="68" height="24" rx="6" fill="#ffffff" stroke="#cfd8dc" stroke-width="1.5"/>
  <rect x="172" y="136" width="68" height="24" rx="6" fill="#ffffff" stroke="#cfd8dc" stroke-width="1.5"/>
  <rect x="68" y="158" width="188" height="60" rx="6" fill="#9575cd" stroke="#182042" stroke-width="2"/>
  <rect x="68" y="158" width="188" height="8" fill="#7e57c2"/>
  <circle cx="100" cy="182" r="5" fill="rgba(255,255,255,0.28)"/><circle cx="160" cy="196" r="5" fill="rgba(255,255,255,0.28)"/><circle cx="216" cy="180" r="5" fill="rgba(255,255,255,0.28)"/>
  <text x="20" y="290" font-size="14" font-weight="700" fill="#6d4c8c" opacity="0.65">爸媽房</text>
  <!-- 客廳・餐廳 -->
  <rect x="392" y="44" width="54" height="104" fill="#8a5a33" stroke="#182042" stroke-width="2"/>
  <rect x="404" y="56" width="30" height="26" fill="#bfe3ff" stroke="#182042" stroke-width="1.5"/>
  <rect x="402" y="92" width="34" height="44" fill="none" stroke="#182042" stroke-width="1.5"/>
  <circle cx="438" cy="112" r="3.5" fill="#ffd54f"/>
  <rect x="566" y="38" width="80" height="62" fill="#bfe3ff" stroke="#182042" stroke-width="2"/>
  <circle cx="588" cy="58" r="10" fill="#ffd54f"/>
  <ellipse cx="622" cy="66" rx="14" ry="6" fill="#ffffff"/><ellipse cx="606" cy="84" rx="11" ry="5" fill="#ffffff"/>
  <rect x="560" y="34" width="14" height="72" fill="#ffb74d"/><rect x="640" y="34" width="14" height="72" fill="#ffb74d"/>
  <rect x="452" y="122" width="132" height="38" rx="8" fill="#ef5350" stroke="#182042" stroke-width="2"/>
  <rect x="442" y="138" width="18" height="50" rx="7" fill="#e53935" stroke="#182042" stroke-width="2"/>
  <rect x="576" y="138" width="18" height="50" rx="7" fill="#e53935" stroke="#182042" stroke-width="2"/>
  <rect x="452" y="156" width="132" height="30" rx="6" fill="#e53935" stroke="#182042" stroke-width="2"/>
  <line x1="518" y1="158" x2="518" y2="184" stroke="#182042" stroke-width="1.5"/>
  <rect x="648" y="46" width="92" height="60" rx="4" fill="#263238" stroke="#182042" stroke-width="2"/>
  <rect x="654" y="52" width="80" height="48" fill="#37474f"/>
  <rect x="654" y="76" width="80" height="24" fill="#4db6ac"/>
  <circle cx="678" cy="64" r="6" fill="#ffe082"/>
  <rect x="686" y="106" width="16" height="8" fill="#263238"/>
  <line x1="616" y1="112" x2="616" y2="196" stroke="#546e7a" stroke-width="3"/>
  <path d="M600,88 L632,88 L624,112 L608,112 Z" fill="#ffd54f" stroke="#182042" stroke-width="1.8"/>
  <line x1="655" y1="18" x2="655" y2="40" stroke="#182042" stroke-width="2.5"/>
  <path d="M632,58 L678,58 L664,40 L646,40 Z" fill="#ff8a65" stroke="#182042" stroke-width="1.8"/>
  <rect x="430" y="228" width="300" height="54" rx="12" fill="#ffcc80" opacity="0.5"/>
  <rect x="386" y="236" width="66" height="26" rx="4" fill="#90a4ae"/>
  <text x="396" y="290" font-size="14" font-weight="700" fill="#a5713d" opacity="0.65">客廳・餐廳</text>
  <!-- 我的房間 -->
  <rect x="812" y="40" width="70" height="62" fill="#a8d8ff" stroke="#182042" stroke-width="2"/>
  <ellipse cx="838" cy="60" rx="13" ry="6" fill="#ffffff"/><ellipse cx="856" cy="80" rx="10" ry="5" fill="#ffffff"/>
  <rect x="806" y="36" width="13" height="72" fill="#64b5f6"/><rect x="876" y="36" width="13" height="72" fill="#64b5f6"/>
  <rect x="968" y="40" width="68" height="52" fill="#ffffff" stroke="#182042" stroke-width="2"/>
  <polygon points="1002,50 1005.5,59 1015,59 1007.5,65 1010.5,74 1002,68.5 993.5,74 996.5,65 989,59 998.5,59" fill="#ffd54f" stroke="#182042" stroke-width="1.2"/>
  <line x1="980" y1="82" x2="1024" y2="82" stroke="#90a4ae" stroke-width="2.5"/>
  <ellipse cx="876" cy="256" rx="108" ry="20" fill="#90caf9" opacity="0.5"/>
  <rect x="796" y="116" width="158" height="18" rx="4" fill="#6d4c41" stroke="#182042" stroke-width="2"/>
  <rect x="792" y="130" width="162" height="88" rx="6" fill="#ffffff" stroke="#182042" stroke-width="2"/>
  <rect x="806" y="136" width="68" height="24" rx="6" fill="#ffffff" stroke="#cfd8dc" stroke-width="1.5"/>
  <rect x="792" y="158" width="162" height="60" rx="6" fill="#42a5f5" stroke="#182042" stroke-width="2"/>
  <rect x="792" y="176" width="162" height="6" fill="rgba(255,255,255,0.35)"/>
  <rect x="792" y="194" width="162" height="6" fill="rgba(255,255,255,0.35)"/>
  <rect x="972" y="146" width="130" height="10" fill="#a5713d" stroke="#182042" stroke-width="2"/>
  <rect x="978" y="156" width="6" height="40" fill="#795548"/><rect x="1090" y="156" width="6" height="40" fill="#795548"/>
  <rect x="986" y="128" width="10" height="18" fill="#ef5350"/><rect x="998" y="132" width="8" height="14" fill="#42a5f5"/><rect x="1008" y="130" width="9" height="16" fill="#66bb6a"/>
  <rect x="1010" y="168" width="44" height="10" rx="4" fill="#5d4037" stroke="#182042" stroke-width="1.5"/>
  <rect x="1014" y="186" width="36" height="8" fill="#795548"/>
  <rect x="1108" y="60" width="38" height="130" fill="#8a5a33" stroke="#182042" stroke-width="2"/>
  <line x1="1108" y1="102" x2="1146" y2="102" stroke="#182042" stroke-width="2"/><line x1="1108" y1="146" x2="1146" y2="146" stroke="#182042" stroke-width="2"/>
  <rect x="1112" y="84" width="6" height="18" fill="#ef5350"/><rect x="1120" y="80" width="6" height="22" fill="#42a5f5"/><rect x="1128" y="86" width="6" height="16" fill="#66bb6a"/>
  <rect x="1112" y="128" width="6" height="18" fill="#ffb74d"/><rect x="1120" y="124" width="6" height="22" fill="#ab47bc"/><rect x="1128" y="130" width="6" height="16" fill="#26a69a"/>
  <text x="800" y="290" font-size="14" font-weight="700" fill="#1565c0" opacity="0.65">我的房間</text>
</svg>
<div id="parents-blanket" style="display:none; position:absolute; left:70px; top:158px; width:184px; height:70px; z-index:260;">
  <svg viewBox="0 0 100 38" style="width:100%; height:100%; display:block;">
    <g class="sleep-form-anim">
      <rect x="1" y="2" width="98" height="34" rx="7" fill="#9575cd" stroke="#182042" stroke-width="1.6"/>
      <rect x="1" y="2" width="98" height="9" rx="4" fill="rgba(255,255,255,0.25)"/>
      <circle cx="20" cy="18" r="3.4" fill="rgba(255,255,255,0.3)"/><circle cx="50" cy="25" r="3.4" fill="rgba(255,255,255,0.3)"/><circle cx="82" cy="17" r="3.4" fill="rgba(255,255,255,0.3)"/>
    </g>
  </svg>
</div>
<div id="desk-hit" onclick="toggleDeskStudy()" title="在書桌自習" style="position:absolute; left:962px; top:112px; width:150px; height:102px; z-index:140; cursor:pointer;"></div>
<div id="player-blanket" style="display:none; position:absolute; left:788px; top:158px; width:170px; height:70px; z-index:600;">
  <svg viewBox="0 0 100 38" style="width:100%; height:100%; display:block;">
    <g class="sleep-form-anim">
      <rect x="1" y="2" width="98" height="34" rx="7" fill="#42a5f5" stroke="#182042" stroke-width="1.6"/>
      <rect x="1" y="2" width="98" height="9" rx="4" fill="rgba(255,255,255,0.25)"/>
      <rect x="8" y="15" width="84" height="5" fill="rgba(255,255,255,0.35)"/><rect x="8" y="25" width="84" height="5" fill="rgba(255,255,255,0.35)"/>
    </g>
  </svg>
</div>`;
    function toggleDeskStudy() { // v9.14.4：點房間書桌 = 在家自習開關
      if (typeof currentLoc === 'undefined' || currentLoc !== 'home' || gameState.isCommuting) {
        if (typeof createFloatingText === 'function') createFloatingText('回家才能用自己的書桌 🏠');
        return;
      }
      gameState.deskStudy = !gameState.deskStudy;
      if (gameState.deskStudy) {
        currentState = 'studying';
        if (typeof createFloatingText === 'function') createFloatingText('在書桌前自習 📖');
      } else {
        currentState = 'idle';
        if (typeof createFloatingText === 'function') createFloatingText('休息一下 🍃');
      }
    }
    function ensureHomeInterior() {
      if (document.getElementById('home-stage')) return;
      const host = document.querySelector('#landmark-home .island-platform-top') || document.querySelector('#landmark-home .island-platform') || document.getElementById('landmark-home');
      if (!host) return;
      const stage = document.createElement('div');
      stage.id = 'home-stage';
      stage.innerHTML = '<div id="home-rooms">' + HOME_ROOMS_HTML + '</div>';
      host.appendChild(stage);
      // v9.14.3：手指/滑鼠在房子裡拖曳 = 捲動室內；在地圖上拖曳 = 移動地圖（地圖引擎在 viewport 上，事件冒泡到不了就輪不到它）
      let drag = null;
      const activePtrs = new Set();
      stage.addEventListener('pointerdown', e => {
        e.stopPropagation();
        activePtrs.add(e.pointerId);
        if (activePtrs.size > 1) { // 第二根手指：取消室內拖曳（雙指縮放請從房子外開始）
          drag = null;
          const rooms = document.getElementById('home-rooms');
          if (rooms) rooms.style.transition = '';
          return;
        }
        drag = { x: e.clientX, pan: (_homePanManual !== null ? _homePanManual : _homePanCur), moved: 0 };
        _homePanManual = drag.pan;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        const rooms = document.getElementById('home-rooms');
        if (rooms) rooms.style.transition = 'none';
      });
      stage.addEventListener('pointermove', e => {
        if (!drag) return;
        const sc = (stage.clientHeight || 179) / 300;
        const visible = (stage.clientWidth || 278) / sc;
        const maxPan = Math.max(0, 1150 - visible);
        const next = Math.max(0, Math.min(maxPan, drag.pan - (e.clientX - drag.x) / sc));
        drag.moved += Math.abs(next - _homePanManual);
        _homeManualUntil = Date.now() + 30000; // v9.14.4
        _homePanManual = next;
        applyHomePan(_homePanManual, sc);
      });
      const endDrag = e => {
        activePtrs.delete(e.pointerId);
        _homeManualUntil = Date.now() + 30000; // v9.14.4：放開後再保留 30 秒
        if (!drag) return;
        const wasDrag = drag.moved > 0.5;
        drag = null;
        const rooms = document.getElementById('home-rooms');
        if (rooms) rooms.style.transition = '';
        if (wasDrag) { // 拖完的那一下 click 不要觸發島嶼聚焦
          stage.addEventListener('click', ev2 => { ev2.stopPropagation(); ev2.preventDefault(); }, { capture: true, once: true });
        }
      };
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
      stage.addEventListener('dblclick', () => { _homePanManual = null; });
    }
    let _homePanManual = null; // v9.14.2：滑鼠拖曳的手動捲動位置（null=自動跟隨）
    let _homeManualUntil = 0; // v9.14.4：手動操控後 30 秒不自動回追
    let _homePanCur = 0; let _homePanT = 0;
    let _homeWasIn = false;
    function smoothPanStep(cur, target, focusX, visible, dtMs) { // v9.25 室內鏡頭：死區（小晃動不拉）＋限速追趕（不橡皮筋）
      if (typeof cur !== 'number' || isNaN(cur)) return target;
      if (Math.abs(target - cur) > visible) return target; // 剛進場差距大，直接到位
      if ((dtMs || 0) > 350) return target; // 久未更新（切換分頁回來/場景切換）直接到位，不慢慢滑
      const center = cur + visible / 2;
      if (Math.abs(focusX - center) < visible * 0.16) return cur;
      const maxStep = 340 * Math.min(0.1, Math.max(0.001, (dtMs || 16) / 1000));
      return cur + Math.max(-maxStep, Math.min(maxStep, target - cur));
    }
    function applyHomePan(pan, sc) {
      const rooms = document.getElementById('home-rooms');
      if (!rooms) return;
      _homePanCur = pan;
      rooms.style.transform = 'translate(' + (-pan * sc).toFixed(1) + 'px, 0px) scale(' + sc.toFixed(3) + ')';
    }
    function updateHomePan(focusX) {
      const stage = document.getElementById('home-stage');
      if (!stage) return;
      const vpW = stage.clientWidth, vpH = stage.clientHeight;
      if (!vpW || !vpH) return;
      const sc = vpH / 300;
      const visible = vpW / sc;
      if (_homePanManual !== null) {
        if (Date.now() > _homeManualUntil) _homePanManual = null; // v9.14.4：30 秒到，回自動跟隨
        else { applyHomePan(_homePanManual, sc); return; }
      }
      if (typeof focusX !== 'number') focusX = 565;
      let pan;
      if (visible >= 1150) pan = (1150 - visible) / 2;
      else pan = Math.max(0, Math.min(1150 - visible, focusX - visible / 2));
      const _nowHome = performance.now(); const _dtHome = _homePanT ? (_nowHome - _homePanT) : 16; _homePanT = _nowHome;
      applyHomePan(smoothPanStep(_homePanCur, pan, focusX, visible, _dtHome), sc);
    }
    function updateHomeStage() {
      ensureHomeInterior();
      const stage = document.getElementById('home-stage');
      if (!stage) return;
      const rooms = document.getElementById('home-rooms');
      const playerIn = (typeof currentLoc !== 'undefined') && currentLoc === 'home' && !gameState.isCommuting;
      if (playerIn !== _homeWasIn) { _homePanManual = null; _homeWasIn = playerIn; } // 進出家門 → 回到自動跟隨
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
      // 室內鏡頭：主角在家跟主角，否則看在家的爸媽，再否則停客廳
      let focus = 565;
      if (playerIn) focus = gameState.currentX || 500;
      else {
        const par = (gameState.npcs || []).find(n => n.kind === 'parent' && n.inside);
        if (par) focus = par.x;
      }
      updateHomePan(focus);
      const pBlanket = document.getElementById('player-blanket'); // v9.15：本人躺床上 + 棉被蓋在上層
      if (pBlanket) pBlanket.style.display = (currentState === 'sleeping' && currentLoc === 'home') ? 'block' : 'none';
      const parBlanket = document.getElementById('parents-blanket');
      if (parBlanket) {
        const anySleep = (gameState.npcs || []).some(n => n.kind === 'parent' && n.inside && n.state === 'sleeping');
        const want = anySleep ? 'block' : 'none';
        if (parBlanket.style.display !== want) parBlanket.style.display = want;
      }
    }

    function checkHomeDinner() {
      const phase = dinnerPhaseNow();
      updateHomeDinnerVisual(phase);
      const parents = (gameState.npcs || []).filter(n => n.kind === 'parent');
      if (!phase) {
        parents.forEach(n => {
          if (n.atDinner) { n.atDinner = false; n.path = [npcDef(n.key).homeSpot]; n.arrive = 'athome'; n.state = 'path'; }
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
            if (lines.length) npcSay(sp, lines[Math.floor(Math.random() * lines.length)]);
          }
        }
      }
    }
    const PARK_CHAT_OPEN = ['今天天氣也太好了吧！', '你們晚餐想吃什麼？', '我昨天打電動打到半夜，超爽', '欸欸，聽說食堂明天有新菜單', '最近有什麼好看的影片推薦嗎？', '假日一起去打球啦', '我跟你們說，我昨天做了一個超怪的夢', '這邊風好涼，超舒服的', '你們複習得怎麼樣了？', '走啦，等下一起去超商買冰'];
    const PARK_CHAT_REPLY = ['真的！我也這麼覺得', '哈哈哈你也太好笑', '好啊好啊，算我一個', '我懂我懂，那個超讚的', '蛤？真的假的', '對啊，我媽也這樣說', '那走啊，現在就去', '噓——小聲一點啦', '我上次也是這樣！', '好主意，揪！'];
    function parkJoinCluster(npc) { // v9.15：到公園自動湊到別人的圈圈旁邊
      if (npc.dest !== 'park' || npc._parkJoined) return;
      const others = (gameState.npcs || []).filter(n => n !== npc && n.dest === 'park' && n.state === 'idle');
      let best = null, bd = 1e9;
      others.forEach(o => { const d = Math.hypot(o.x - npc.x, o.y - npc.y); if (d < bd) { bd = d; best = o; } });
      if (!best) return;
      npc._parkJoined = true;
      if (bd <= 62) return;
      const ang = ((npc.key.charCodeAt(0) * 53) % 360) * Math.PI / 180;
      npc.path = [{ x: Math.round(best.x + Math.cos(ang) * 50), y: Math.round(best.y + 8 + Math.abs(Math.sin(ang)) * 14) }];
      npc.arrive = 'idle'; npc.state = 'path';
    }
    function updateParkSocial() { // v9.15：公園成群聊天（有人開口、有人接話）
      const absMin = (gameState.totalGameDays || 0) * 1440 + (gameState.hour || 0) * 60 + (gameState.minute || 0);
      if (gameState._parkReply && absMin >= gameState._parkReply.at) {
        const who = (gameState.npcs || []).find(n => n.key === gameState._parkReply.key);
        if (who && who.dest === 'park' && who.state === 'idle') npcSay(who, gameState._parkReply.line);
        gameState._parkReply = null;
      }
      if (absMin < (gameState._parkChatAt || 0)) return;
      const idlers = (gameState.npcs || []).filter(n => n.dest === 'park' && n.state === 'idle' && n.kind !== 'parent');
      const clusters = [];
      idlers.forEach(n => { const c = clusters.find(c => c.some(m => Math.hypot(m.x - n.x, m.y - n.y) <= 120)); if (c) c.push(n); else clusters.push([n]); });
      const big = clusters.filter(c => c.length >= 2);
      if (!big.length) { gameState._parkChatAt = absMin + 6; return; }
      const c = big[Math.floor(Math.random() * big.length)];
      const cx = c.reduce((sum, m) => sum + m.x, 0) / c.length;
      c.forEach(m => { m.dir = cx >= m.x ? 1 : -1; }); // 面對彼此
      const sp = c[Math.floor(Math.random() * c.length)];
      npcSay(sp, PARK_CHAT_OPEN[Math.floor(Math.random() * PARK_CHAT_OPEN.length)]);
      if (Math.random() < 0.65) {
        const others = c.filter(m => m !== sp);
        const rp = others[Math.floor(Math.random() * others.length)];
        gameState._parkReply = { at: absMin + 2 + Math.random() * 3, key: rp.key, line: PARK_CHAT_REPLY[Math.floor(Math.random() * PARK_CHAT_REPLY.length)] };
      }
      gameState._parkChatAt = absMin + 16 + Math.random() * 22;
    }
    function updateNPCs(progressMinutes) {
      const npcs = ensureNPCs();
      ensureSeats();
      buildNPCLayer();
      ensurePodiumFg();
      checkHomeDinner();
      updateParkSocial(); // v9.15
      const hour = gameState.hour || 0;
      // v9.16.1 座位對帳：SEAT_MAP 的佔位若與本人狀態對不上（存檔遺留/競態）就清掉——幽靈佔位會永久吃掉座位
      if (SEAT_MAP) Object.keys(SEAT_MAP).forEach(b => { SEAT_MAP[b].forEach((st, i) => { if (!st.who) return; const n = npcs.find(x => x.key === st.who); const legit = n && n.dest === b && n.seatIdx === i && n.windowSeat == null && (n.state === 'seated' || (n.state === 'path' && n.arrive === 'seat') || n._shelfTrip === true); if (!legit) st.who = null; }); });
      for (let wi = 0; wi < 3; wi++) { if (!windowSeatTaken[wi]) continue; const held = npcs.some(n => n.windowSeat === wi && (n.state === 'seated' || n.state === 'path')) || (gameState.noodleSeatIdx === wi && !!gameState.noodleUntil); if (!held) windowSeatTaken[wi] = false; }
      const coach = npcs.find(n => n.key === 'coach');
      if (coach) {
        const occ = gymOccupiedNow();
        if (occ && coach.dest !== 'gym') {
          npcFreeSeat(coach); removeFromQueue(coach);
          coach.dest = 'gym';
          coach.path = [{ x: NPC_DOOR_X.gym, y: NPC_STREET_Y }, npcDef('coach').spot];
          coach.arrive = 'seat'; coach.state = 'path';
        } else if (!occ && coach.dest === 'gym' && coach.state === 'seated') coach.dwell = 0;
      }
      const chef = npcs.find(n => n.key === 'chef');
      npcs.forEach(n => { if (n.key === 'chef') n.phase = null; }); // v9.12.6 清除廚師殘留的客人 phase（老師當客人時保留）
      let playerOrdering = false, playerWaiting = false;
      try {
        playerOrdering = typeof currentLoc !== 'undefined' && currentLoc === 'restaurant' && typeof currentState !== 'undefined' && currentState === 'eating' && (gameState.eatPhase === 'order' || gameState.eatPhase === 'wait');
        playerWaiting = playerOrdering && gameState.eatPhase === 'wait' && !gameState.eatServed;
      } catch (e) {}
      ORDERS_PENDING = playerOrdering || npcs.some(n => n.key !== 'chef' && n.state === 'seated' && n.dest === 'restaurant' && (n.phase === 'order' || n.phase === 'wait')); // v9.12.6 staff 不算客人（阿火師自 serve 循環）
      if (chef && chef.state === 'seated' && chef.dest === 'restaurant' && !chef.busy) {
        let target = null, serveSpot = null;
        if (playerWaiting) { target = 'player'; serveSpot = { x: 440, y: 139 }; } // v9.19 吧台座南移後的上菜點
        else {
          const diner = npcs.find(n => n.key !== 'chef' && n.state === 'seated' && n.dest === 'restaurant' && n.phase === 'wait');
          if (diner) { target = diner.key; serveSpot = { x: diner.x, y: diner.y - 45 }; }
        }
        if (target) { chef.busy = target; chef.state = 'path'; chef.path = [serveSpot]; chef.arrive = 'serve'; }
      }
      const teppanFx = ensureTeppanFx();
      if (teppanFx) { const _to = ORDERS_PENDING ? '1' : '0'; if (teppanFx.style.opacity !== _to) teppanFx.style.opacity = _to; }
      updateSpecialSign();
      shopQueueTick(); // v9.20 超商結帳隊伍推進
      npcs.forEach(npc => {
        const def = npcDef(npc.key);
        const step = def.speed * 1.5 * progressMinutes; // v9.24 走路加速
        if (npc.state === 'path') {
          if (!npc.path[0]) { npcPickTarget(npc); }
          else {
            // v9.15：一步之內走完預算內的整段路（舊版一 tick 只處理一個軸向一個點，高速下 NPC 要爬好幾個遊戲小時）
            let budget = step, guard = 0, arrived = false;
            while (npc.path.length && guard++ < 16) {
              const wp = npc.path[0];
              const dx = wp.x - npc.x, dy = wp.y - npc.y;
              if (dx === 0 && dy === 0) {
                npc.path.shift();
                if (wp.door === 'in') { if (wp.loc) npc.insideLoc = wp.loc; else npc.inside = true; npc.x = wp.ix; npc.y = wp.iy; }
                else if (wp.door === 'out') { if (wp.loc) npc.insideLoc = null; else npc.inside = false; npc.x = wp.wx; npc.y = wp.wy; }
                if (npc.path.length === 0) { arrived = true; break; }
                continue;
              }
              if (budget <= 0) break;
              if (dx !== 0) {
                if (Math.abs(dx) <= budget) { npc.x = wp.x; budget -= Math.abs(dx); npc.dir = Math.sign(dx); }
                else { npc.x += Math.sign(dx) * budget; npc.dir = Math.sign(dx); budget = 0; }
              } else {
                if (Math.abs(dy) <= budget) { npc.y = wp.y; budget -= Math.abs(dy); }
                else { npc.y += Math.sign(dy) * budget; budget = 0; }
              }
            }
            if (arrived) {
              if (npc.path.length === 0) {
                if (npc.arrive === 'seat') {
                  npc.state = 'seated';
                  if (npc.kind === 'staff' && npc.dest === def.work) {
                    const sh = def.shift;
                    if (sh.oncall) npc.dwell = 9999;
                    else {
                      const nowM = (gameState.hour || 0) * 60 + (gameState.minute || 0);
                      let dw;
                      if (sh.start > sh.end) dw = nowM >= sh.start ? (1440 - nowM + sh.end) : (sh.end - nowM); // 跨夜班
                      else dw = nowM < sh.end ? (sh.end - nowM) : 30; // v9.15：下班後才坐下不再包到隔天
                      npc.dwell = Math.max(30, dw);
                    }
                  } else npc.dwell = 30 + Math.random() * 60; // v9.12.7 staff 在別棟當客人（老師午餐）比照一般客人
                  if (npc.dest === 'restaurant' && npc.key !== 'chef') { npc.phase = 'order'; npc.orderLeft = 3; }
                }
                else if (npc.arrive === 'shop') {
                  npc.state = 'seated';
                  if (npc.shopStage === 'putback') { npc.picked = 0; npc.dwell = 3.5; spawnShopPop(npc, '↩️'); }
                  else npc.dwell = 9 + Math.random() * 16; // 站在貨架前看看
                }
                else if (npc.arrive === 'shopq') { npc.state = 'seated'; npc.dwell = 99999; } // 排隊中等前面的人
                else if (npc.arrive === 'sleep') npc.state = 'sleeping';
                else if (npc.arrive === 'away') npc.state = 'away';
                else if (npc.arrive === 'idle') { npc.state = 'idle'; npc.dwell = 20 + Math.random() * 40; parkJoinCluster(npc); }
                else if (npc.arrive === 'browse') { npc.state = 'idle'; npc.dwell = 1.5 + Math.random() * 2; spawnNpcPop(npc, '📕'); } // v9.26 圖書館抽書：站在書架前翻找
                else if (npc.arrive === 'queue') { npc.state = 'queue'; npc.queueWait = 0; }
                else if (npc.arrive === 'serve') {
                  if (npc.busy === 'player') gameState.eatServed = true;
                  else {
                    const diner = npcs.find(n => n.key === npc.busy);
                    if (diner && diner.state === 'seated' && diner.phase === 'wait') diner.phase = 'eat';
                  }
                  npc.state = 'idle'; npc.dwell = 0.7; npc.servingReturn = true;
                }
                else if (npc.arrive === 'post') {
                  npc.state = 'seated'; npc.busy = null;
                  const sh2 = def.shift; const nowM2 = (gameState.hour || 0) * 60 + (gameState.minute || 0);
                  npc.dwell = sh2.oncall ? 9999 : Math.max(30, sh2.end >= nowM2 ? sh2.end - nowM2 : sh2.end + 1440 - nowM2);
                }
                else if (npc.arrive === 'athome') npc.state = 'athome';
                else if (npc.arrive === 'dinner') { npc.state = 'seated'; npc.dwell = 9999; } // v9.13 晚餐入座
                else if (npc.arrive === 'street') npcPickTarget(npc);
              }
            }
          }
        } else if (npc.state === 'idle' && npc.servingReturn) {
          npc.dwell -= progressMinutes;
          if (npc.dwell <= 0) { npc.servingReturn = false; npc.path = [def.spot]; npc.arrive = 'post'; npc.state = 'path'; }
        } else if (npc.state === 'idle' && npc.breakHome) {
          npc.dwell -= progressMinutes;
          if (npc.dwell <= 0) {
            const ph = schoolPhaseNow();
            if (ph === 'break') { const bi2 = freeBreakSpotIdx(); if (bi2 >= 0) { const sp2 = BREAK_SPOTS[bi2]; npc._breakSpotIdx = bi2; npc.path = [{ x: sp2.x + Math.round(Math.random() * 10 - 5), y: sp2.y }]; npc.arrive = sp2.arrive; npc.breakMode = sp2.mode; npc.state = 'path'; } else npc.dwell = 2; }
            else if (ph === 'class') npc.dwell = 2; // 等鐘聲監看器送回座位
            else { npc.breakHome = null; npcExitPath(npc); } // v9.15：放學/週末了，不再等鐘聲，自己離校（修高速跳過鐘聲轉換卡死）
          }
        } else if (npc.state === 'seated' || npc.state === 'idle') {
          if (npc.breakMode && npc.dest === 'school') tickBreakAmbiance(npc, progressMinutes); // v9.22 下課氛圍：聊天/看書/休息/喝茶/列印
          if (npc.dest === 'library' && npc.insideLoc === 'library') { // v9.26 圖書館：讀者翻頁/抽書、館員上架
            if (npc._shelfTrip) {
              if (npc.state === 'seated') npc._shelfTrip = false;
              else if (npc.state === 'idle' && npc.dwell <= progressMinutes) { // 書架前翻完了，回去
                if (npc.kind === 'staff') { const sp2 = npcDef(npc.key).spot; npc.path = [{ x: sp2.x, y: sp2.y }]; npc.arrive = 'post'; npc.state = 'path'; }
                else { const seat2 = (ensureSeats().library || [])[npc.seatIdx]; if (seat2) { npc.path = [{ x: seat2.x, y: seat2.y }]; npc.arrive = 'seat'; npc.state = 'path'; } else { npc._shelfTrip = false; npcExitPath(npc); } }
              }
            } else if (npc.state === 'seated' && npc.kind !== 'staff' && npc.seatIdx != null) {
              npc.bookCd = (npc.bookCd == null ? 6 + Math.random() * 10 : npc.bookCd) - progressMinutes;
              if (npc.bookCd <= 0) {
                npc.bookCd = 9 + Math.random() * 14;
                if (Math.random() < 0.45) spawnNpcPop(npc, '📖'); // 坐著翻頁
                else { const pt2 = LIB_SHELF_POINTS[Math.floor(Math.random() * LIB_SHELF_POINTS.length)]; npc._shelfTrip = true; npc.path = [{ x: pt2.x, y: pt2.y }]; npc.arrive = 'browse'; npc.state = 'path'; } // 起身去抽書
              }
            } else if (npc.key === 'librarian' && npc.state === 'seated') {
              npc.shelfCd = (npc.shelfCd == null ? 9 + Math.random() * 8 : npc.shelfCd) - progressMinutes;
              if (npc.shelfCd <= 0) { npc.shelfCd = 13 + Math.random() * 12; const pt3 = LIB_SHELF_POINTS[Math.floor(Math.random() * LIB_SHELF_POINTS.length)]; npc._shelfTrip = true; npc.path = [{ x: pt3.x, y: pt3.y }]; npc.arrive = 'browse'; npc.state = 'path'; spawnNpcPop(npc, '📚'); } // 館員巡架上架
            }
          }
          if (npc.key === 'teacher' && npc.dest === 'school' && npc.insideLoc === 'school' && !npc.breakHome && typeof schoolPhaseNow === 'function' && schoolPhaseNow() === 'class') { // v9.25 老師巡堂：上課時定時走下講台巡視
            npc.roamCd = (npc.roamCd == null ? 2 + Math.random() * 3 : npc.roamCd) - progressMinutes;
            if (npc.roamCd <= 0) {
              npc.roamCd = 3.5 + Math.random() * 3.5;
              const post = npcDef('teacher').spot;
              const atPost = Math.hypot(npc.x - post.x, npc.y - post.y) < 6;
              if (npc.state === 'seated' && atPost) {
                const pt = TEACHER_ROAM_POINTS[Math.floor(Math.random() * TEACHER_ROAM_POINTS.length)];
                npc.path = [{ x: pt.x, y: pt.y }]; npc.arrive = 'idle'; npc.state = 'path'; npc._roaming = true;
                if (Math.random() < 0.4) npcSay(npc, TEACHER_ROAM_LINES[Math.floor(Math.random() * TEACHER_ROAM_LINES.length)]);
              } else if (npc._roaming && npc.state === 'idle') {
                npc.path = [{ x: post.x, y: post.y }]; npc.arrive = 'post'; npc.state = 'path'; npc._roaming = false;
              }
            }
          }
          if (npc.state === 'seated' && npc.seatIdx != null && SEAT_MAP[npc.dest] && SEAT_MAP[npc.dest][npc.seatIdx] && !SEAT_MAP[npc.dest][npc.seatIdx].who) {
            SEAT_MAP[npc.dest][npc.seatIdx].who = npc.key;
          }
          if (npc.state === 'seated' && npc.dest === 'restaurant' && npc.key !== 'chef') {
            if (npc.phase === 'order') { npc.orderLeft = Math.max(0, (npc.orderLeft || 0) - progressMinutes); if (npc.orderLeft <= 0) { npc.phase = 'wait'; npc.waitLeft = 6; } }
            else if (npc.phase === 'wait') { npc.waitLeft = Math.max(0, (npc.waitLeft || 0) - progressMinutes); if (npc.waitLeft <= 0) npc.phase = 'eat'; }
          }
          npc.dwell -= progressMinutes;
          if (npc.dwell <= 0 && !npc._shelfTrip) { // v9.26 抽書途中不被造訪到期趕走（回座由圖書館 hook 處理）
            if (npc.dest === 'store' && npc.shopStage && npc.windowSeat == null) advanceShopCycle(npc); // v9.20 逛完→放回/排隊結帳，不直接走掉
            else npcExitPath(npc);
          }
        } else if (npc.state === 'queue') {
          npc.queueWait += progressMinutes;
          if (QUEUES[npc.queueFor] && QUEUES[npc.queueFor][0] === npc.key) {
            const seat = npcRequestSeat(npc, npc.queueFor);
            if (seat) {
              QUEUES[npc.queueFor].shift();
              npc.path = INTERIORS[npc.queueFor] ? interiorPathTo(npc, npc.queueFor, seat) : [{ x: NPC_DOOR_X[npc.queueFor], y: NPC_STREET_Y }, seat];
              npc.arrive = 'seat'; npc.state = 'path'; npc.queueFor = '';
              recomputeQueueSlots(npc.dest);
            }
          }
          if (npc.state === 'queue' && npc.queueWait > 60) {
            const b = npc.queueFor;
            removeFromQueue(npc);
            npcPickTarget(npc);
          }
        } else if (npc.state === 'sleeping') {
          if (npc.kind === 'parent') {
            if (hour >= 7 && hour < 22) npcPickTarget(npc);
          } else if (hour >= 7 && hour < 23) {
            npc.path = [{ x: def.homeX, y: NPC_STREET_Y }];
            npc.arrive = 'street'; npc.state = 'path';
          }
        } else if (npc.state === 'athome') {
          if (hour >= 22 || (hour >= 7 && hour < 19)) npcPickTarget(npc);
        } else if (npc.state === 'away') {
          if (npc.kind === 'parent') {
            if (parentBackHome(npc)) npcPickTarget(npc); // v9.14.4 爸媽錯開回家
          } else if (hour >= 7 && (hour * 60 + (gameState.minute || 0)) < npcHomeTime(npc)) { // v9.15：還沒到他的回家時間才出門活動
            npc.x = npc.x < 960 ? -60 : 1980; npc.y = NPC_STREET_Y; npcPickTarget(npc);
          }
        }
        if (npc.insideLoc === 'store' && !document.getElementById('store-rooms')) ensureStoreInterior(); // v9.17：容器還沒建就先建（主迴圈外也要能切）
        if (npc.insideLoc === 'restaurant' && !document.getElementById('rest-rooms')) ensureRestInterior(); // v9.18
        if (npc.insideLoc === 'school' && !document.getElementById('school-rooms')) ensureSchoolInterior(); // v9.21
        if (npc.insideLoc === 'library' && !document.getElementById('lib-rooms')) ensureLibraryInterior(); // v9.26
        const el = document.getElementById('npc-' + npc.key);
        if (el) { // v9.14：室內外容器切換；v9.17：insideLoc（一般 NPC 的 inside 未初始化，不能當守衛）
          const _tgt = (npc.insideLoc && INTERIORS[npc.insideLoc]) ? document.getElementById(INTERIORS[npc.insideLoc].roomsId) : (npc.inside ? document.getElementById('home-rooms') : document.getElementById('npc-layer'));
          if (_tgt && el.parentNode !== _tgt) _tgt.appendChild(el);
          // v9.17.1：室內人物補償場景縮放，與大地圖同尺寸（腳底為原點）
          if (_tgt && (_tgt.id === 'home-rooms' || _tgt.id === 'store-rooms' || _tgt.id === 'rest-rooms' || _tgt.id === 'school-rooms' || _tgt.id === 'lib-rooms')) {
            const _st = _tgt.parentNode;
            const _tf = 'scale(' + (300 / ((_st && _st.clientHeight) || 179)).toFixed(3) + ')';
            if (el.style.transform !== _tf) { el.style.transform = _tf; el.style.transformOrigin = '50% 100%'; }
          } else if (el.style.transform) { el.style.transform = ''; el.style.transformOrigin = ''; }
        }
        if (el) {
          const lying = npc.state === 'sleeping' && npc.kind === 'parent';
          el.style.left = npc.x + 'px';
          el.style.top = (lying ? (npc.y - 35) : (npc.y - 55)) + 'px';
          const flipEl = el.querySelector('.npc-flip');
          if (flipEl) flipEl.style.transform = `scaleX(${npc.dir < 0 ? -1 : 1})`;
          const svg = el.querySelector('.npc-sprite');
          if (svg) svg.setAttribute('class', 'sprite-pixel npc-sprite ' + npcSpriteClass(npc));
          el.classList.toggle('npc-walking', npc.state === 'path');
          el.classList.toggle('npc-hidden', npc.state === 'away');
          el.classList.toggle('lying', lying);
          el.classList.toggle('seated', npc.state === 'seated' && (npc.dest === 'restaurant' || npc.dest === 'home' || npc.windowSeat != null)); // v9.13 在家晚餐也坐；v9.16 窗邊也坐
          el.classList.toggle('on-break', npc.state === 'seated' && npc.dest === 'school' && typeof schoolPhaseNow === 'function' && schoolPhaseNow() === 'break');
          el.style.zIndex = String(Math.round(npc.y)); // v9.12.3 依深度排序：前方人物蓋後方
          if (npc.insideLoc === 'restaurant' && npc.state === 'seated' && npc.key !== 'chef') el.style.zIndex = '955'; // v9.18 吧台客人夾在雙層前景之間（上身在廚師帶之上、腿被客人帶蓋住）
          else if (npc.insideLoc && npc.state !== 'seated') el.style.zIndex = '975'; // v9.20.1 室內走動/站立的人在傢俱前景之上——走過櫃檯前不再被切頭
          else if (npc.insideLoc === 'store' && (npc.shopStage === 'queue' || npc.shopStage === 'pay')) el.style.zIndex = '975'; // v9.20.1 排隊結帳的人站在櫃檯南側，本來就該在櫃檯前面
          const tag = el.querySelector('.npc-zzz-tag');
          if (tag) tag.style.display = npc.state === 'sleeping' ? 'inline' : 'none';
          const roleEl = el.querySelector('.npc-role');
          if (roleEl) { const rd = npcDef(npc.key); const onDuty = npc.kind === 'staff' && npc.state === 'seated' && rd && npc.dest === rd.work; roleEl.style.display = onDuty ? 'inline' : 'none'; if (onDuty) { const ic = { store: '🏪', restaurant: '🍳', school: '📚', library: '📖', gym: '🏋️' }[rd.work] || '💼'; if (roleEl.textContent !== ic) roleEl.textContent = ic; } } // v9.16.1 值班標籤：一眼看出誰在上班、在做什麼
          const dishEl = el.querySelector('.npc-dish');
          if (dishEl) {
            if (npc.state === 'seated' && npc.dest === 'restaurant') {
              if (dishEl.style.display !== 'block') dishEl.style.display = 'block';
              const _dt = npc.phase === 'eat' ? todaysSpecial().emoji : (npc.phase === 'wait' ? '🍳' : '📋');
              if (dishEl.textContent !== _dt) dishEl.textContent = _dt;
              syncDishPlate(npc, npc.phase === 'eat' && npc.insideLoc === 'restaurant', todaysSpecial().emoji, npc.x - 9, npc.y - (npc.y > 200 ? 52 : 32), 'rest-rooms', 990); // v9.19 菜上桌；v9.20 食物置頂
            } else if (npc.state === 'seated' && npc.windowSeat != null) {
              if (dishEl.style.display !== 'block') dishEl.style.display = 'block';
              if (dishEl.textContent !== '🍜') dishEl.textContent = '🍜';
              if (Math.random() < 0.002) npcSay(npc, NOODLE_NIGHT_LINES[Math.floor(Math.random() * NOODLE_NIGHT_LINES.length)]); // v9.16 深夜窗邊對話
              syncDishPlate(npc, npc.insideLoc === 'store', '🍜', npc.x - 9, npc.y - 40, 'store-rooms', 990); // v9.19 泡麵碗放窗邊吧台上；v9.20 食物置頂
            } else if (npc.state === 'seated' && npc.dest === 'store' && npc.windowSeat == null && !(npc.kind === 'staff' && npcDef(npc.key) && npcDef(npc.key).work === 'store')) {
              if (dishEl.style.display !== 'block') dishEl.style.display = 'block';
              const _tag = npc.shopStage === 'pay' ? '🧾' : (npc.picked ? '🧺' : '🛒'); // v9.20 結帳中；v9.19 拿過東西＝提籃
              if (dishEl.textContent !== _tag) dishEl.textContent = _tag;
              npc.pickCd = (npc.pickCd == null ? 2 + Math.random() * 6 : npc.pickCd) - progressMinutes; // v9.19 逛貨架會真的伸手拿商品
              if (npc.pickCd <= 0 && (!npc.shopStage || npc.shopStage === 'look')) { // v9.20 排隊/結帳時不再拿貨
                npc.pickCd = 8 + Math.random() * 14;
                npc.picked = (npc.picked || 0) + 1;
                spawnShopPop(npc, PICK_ITEMS[Math.floor(Math.random() * PICK_ITEMS.length)]);
              }
            } else if (dishEl.style.display !== 'none') dishEl.style.display = 'none';
            if (!(npc.state === 'seated' && (npc.dest === 'restaurant' || npc.windowSeat != null))) syncDishPlate(npc, false);
          }
        }
        if (npc.state === 'seated' && npc.dest && NPC_SEAT_POOLS[npc.dest]) {
          const island = document.getElementById('landmark-' + npc.dest);
          if (island) island.classList.add('active-inside');
        }
        if ((npc.state === 'athome' || npc.state === 'sleeping') && npc.kind === 'parent') {
          const homeIsland = document.getElementById('landmark-home');
          if (homeIsland) homeIsland.classList.add('active-inside');
        }
      });
    }

    // ================= v9.9 光影地基：晝夜色調＋窗光＋超商夜光＋路燈光暈 =================
    function nightFactorAt(hf) {
      if (hf >= 22 || hf < 4.5) return 1;
      if (hf < 7) return 1 - (hf - 4.5) / 2.5;
      if (hf <= 18.5) return 0;
      return (hf - 18.5) / 3.5;
    }
    function warmFactorAt(hf) {
      const tri = (c, w) => Math.max(0, 1 - Math.abs(hf - c) / w);
      return Math.min(0.9, Math.max(tri(6.4, 1.8), tri(18.1, 1.9)) * 0.9);
    }
    function buildSkyLayer() {
      const map = document.getElementById('town-map');
      if (!map) return;
      if (!document.getElementById('street-glows')) {
        const sg = document.createElement('div');
        sg.id = 'street-glows';
        map.appendChild(sg);
        const sw = document.createElement('div'); // v9.22.1 store-beacon/store-lit 補光片退役：改由 #sky-night 在超商處挖空
        sw.id = 'sky-warm';
        map.appendChild(sw);
        const sn = document.createElement('div');
        sn.id = 'sky-night';
        map.appendChild(sn);
      }
      document.querySelectorAll('.iso-island').forEach(island => {
        if (!island.querySelector('.island-glow')) {
          const g = document.createElement('div');
          g.className = 'island-glow';
          if (island.id === 'landmark-store') g.dataset.store = '1';
          island.appendChild(g);
        }
      });
    }
    // v9.23 每間建築的夜間挖空：平台矩形（CDP 實測 map 座標）＋營業時間（跟遊戲 locks 同步）
    const SKY_HOLES = { home: [40, 25, 278, 179], store: [350, 25, 264, 179], restaurant: [660, 25, 264, 179], school: [970, 25, 264, 179], library: [1280, 25, 264, 179], gym: [1590, 25, 278, 179] };
    function skyOpenSig() {
      const h = (gameState.hour || 0) + (gameState.minute || 0) / 60;
      const dow = gameState.dayOfWeek || 1;
      const weekday = dow >= 1 && dow <= 5;
      let sig = '';
      if (h >= 6 && h < 23) sig += 'home,'; // 住家 06–23 有人醒著亮著，23 後全家睡了變暗
      sig += 'store,'; // 24H 超商永遠亮
      if (h >= 7 && h < 22) sig += 'restaurant,'; // 食堂 07–22
      if (weekday && h >= 8 && h < 16) sig += 'school,'; // 學校 平日 08–16
      if (h >= 8 && h < 21) sig += 'library,'; // 圖書館 08–21
      if (h >= 6 && h < 22) sig += 'gym,'; // 操場夜間照明 06–22
      return sig;
    }
    function skyNightClip(sig) {
      let pts = '0px 0px, 1920px 0px, 1920px 540px, 0px 540px, 0px 0px';
      sig.split(',').forEach(k => {
        const r = SKY_HOLES[k]; if (!r) return;
        pts += ', ' + r[0] + 'px ' + r[1] + 'px, ' + r[0] + 'px ' + (r[1] + r[3]) + 'px, ' + (r[0] + r[2]) + 'px ' + (r[1] + r[3]) + 'px, ' + (r[0] + r[2]) + 'px ' + r[1] + 'px, ' + r[0] + 'px ' + r[1] + 'px';
      });
      return 'polygon(evenodd, ' + pts + ')';
    }
    let _skyEls = null, _skyLastKey = '';
    function updateSkyLighting() {
      if (!_skyEls) {
        buildSkyLayer();
        _skyEls = {
          sn: document.getElementById('sky-night'), sw: document.getElementById('sky-warm'),
          sg: document.getElementById('street-glows'),
          glows: [...document.querySelectorAll('.island-glow')],
        };
        if (!_skyEls.sn) _skyEls = null;
      }
      if (!_skyEls) return;
      const hf = (gameState.hour || 0) + (gameState.minute || 0) / 60;
      const nf = nightFactorAt(hf);
      const wf = warmFactorAt(hf);
      const openSig = skyOpenSig();
      const key = Math.round(nf * 40) + '|' + Math.round(wf * 40) + '|' + openSig;
      if (key === _skyLastKey) return; // v9.10.4: 值沒變就不寫 style (減少每 tick 的版面重算，鏡頭更順)
      _skyLastKey = key;
      _skyEls.sn.style.clipPath = skyNightClip(openSig); // v9.23 開著的建築挖空（不被夜色蓋）、休息的變黑
      const r3 = v => String(Math.round(v * 1000) / 1000);
      _skyEls.sn.style.opacity = r3(nf * 0.9);
      _skyEls.sw.style.opacity = r3(wf);
      _skyEls.glows.forEach(g => { g.style.opacity = r3(nf * (g.dataset.store ? 1 : 0.75)); });
      const storeIsl = document.getElementById('landmark-store'); if (storeIsl) storeIsl.classList.toggle('night-lit', nf > 0.45); // v9.16.1 整間店自己亮，不補光暈
      _skyEls.sg.style.opacity = r3(nf * 0.85); // v9.22.1 超商的亮來自 #sky-night 的挖空（見 style.css），不再疊補光片
    }


    // ================= v9.17 超商大場景（比照住家：大室內塞進框框、室內鏡頭、前景圖層） =================
    const STORE_ROOMS_HTML = `
<svg viewBox="0 0 1150 300" style="position:absolute; left:0; top:0; width:1150px; height:300px;">
  <rect x="0" y="58" width="1150" height="242" fill="#f3ead9"/>
  <g stroke="#e2d3b6" stroke-width="2">
    <line x1="0" y1="106" x2="1150" y2="106"/><line x1="0" y1="154" x2="1150" y2="154"/><line x1="0" y1="202" x2="1150" y2="202"/><line x1="0" y1="250" x2="1150" y2="250"/>
    <line x1="150" y1="58" x2="150" y2="300"/><line x1="430" y1="58" x2="430" y2="300"/><line x1="710" y1="58" x2="710" y2="300"/><line x1="990" y1="58" x2="990" y2="300"/>
  </g>
  <rect x="0" y="0" width="1150" height="58" fill="#fff7ea"/>
  <rect x="0" y="48" width="1150" height="10" fill="#22b573"/>
  <text x="26" y="36" font-size="17" fill="#14532d" font-family="'DotGothic16', monospace" font-weight="900">24H MART 歡迎光臨</text>
  <text x="986" y="36" font-size="12" fill="#8a5a33" font-family="'DotGothic16', monospace" font-weight="900">冰櫃・麵包・關東煮</text>
  <g>
    <rect x="330" y="6" width="370" height="50" fill="#9fb6c9" stroke="#182042" stroke-width="2"/>
    <rect x="336" y="10" width="174" height="42" fill="#dff3ff" opacity="0.9"/>
    <rect x="518" y="10" width="174" height="42" fill="#dff3ff" opacity="0.9"/>
    <g>
      <rect x="342" y="16" width="12" height="16" fill="#e74c3c"/><rect x="358" y="16" width="12" height="16" fill="#2ed573"/><rect x="374" y="16" width="12" height="16" fill="#f1c40f"/><rect x="390" y="16" width="12" height="16" fill="#3498db"/><rect x="406" y="16" width="12" height="16" fill="#9b59b6"/><rect x="422" y="16" width="12" height="16" fill="#ffa502"/>
      <rect x="342" y="36" width="12" height="14" fill="#1abc9c"/><rect x="358" y="36" width="12" height="14" fill="#e67e22"/><rect x="374" y="36" width="12" height="14" fill="#e84393"/><rect x="390" y="36" width="12" height="14" fill="#2ecc71"/><rect x="406" y="36" width="12" height="14" fill="#f39c12"/><rect x="422" y="36" width="12" height="14" fill="#e74c3c"/>
      <rect x="524" y="16" width="12" height="16" fill="#3498db"/><rect x="540" y="16" width="12" height="16" fill="#e74c3c"/><rect x="556" y="16" width="12" height="16" fill="#2ed573"/><rect x="572" y="16" width="12" height="16" fill="#f1c40f"/><rect x="588" y="16" width="12" height="16" fill="#ffa502"/><rect x="604" y="16" width="12" height="16" fill="#9b59b6"/>
      <rect x="524" y="36" width="12" height="14" fill="#e67e22"/><rect x="540" y="36" width="12" height="14" fill="#1abc9c"/><rect x="556" y="36" width="12" height="14" fill="#e84393"/><rect x="572" y="36" width="12" height="14" fill="#2ecc71"/><rect x="588" y="36" width="12" height="14" fill="#f39c12"/><rect x="604" y="36" width="12" height="14" fill="#3498db"/>
    </g>
    <rect x="726" y="6" width="150" height="50" fill="#f7c8d8" stroke="#182042" stroke-width="2"/>
    <text x="748" y="38" font-size="15" fill="#9d2c54" font-family="'DotGothic16', monospace" font-weight="900">🍦 冰品</text>
    <rect x="892" y="6" width="228" height="50" fill="#ffe9b8" stroke="#182042" stroke-width="2"/>
    <text x="922" y="38" font-size="15" fill="#8a5a33" font-family="'DotGothic16', monospace" font-weight="900">🥐 現烤麵包</text>
  </g>
  <g>
    <rect x="380" y="116" width="180" height="52" fill="#1f7a4d" stroke="#182042" stroke-width="2.5"/>
    <rect x="380" y="116" width="180" height="13" fill="#0d5c38"/>
    <text x="392" y="127" font-size="9" fill="#ffffff" font-family="'DotGothic16', monospace" font-weight="900">零食 SNACKS</text>
    <line x1="380" y1="143" x2="560" y2="143" stroke="#0d5c38" stroke-width="2"/><line x1="380" y1="156" x2="560" y2="156" stroke="#0d5c38" stroke-width="2"/>
    <rect x="388" y="132" width="14" height="9" fill="#e74c3c"/><rect x="406" y="132" width="14" height="9" fill="#3498db"/><rect x="424" y="132" width="14" height="9" fill="#f1c40f"/><rect x="442" y="132" width="14" height="9" fill="#9b59b6"/><rect x="460" y="132" width="14" height="9" fill="#e84393"/><rect x="478" y="132" width="14" height="9" fill="#2ecc71"/><rect x="496" y="132" width="14" height="9" fill="#ffa502"/><rect x="514" y="132" width="14" height="9" fill="#00cec9"/>
    <rect x="388" y="146" width="14" height="9" fill="#f39c12"/><rect x="406" y="146" width="14" height="9" fill="#e74c3c"/><rect x="424" y="146" width="14" height="9" fill="#2ecc71"/><rect x="442" y="146" width="14" height="9" fill="#3498db"/><rect x="460" y="146" width="14" height="9" fill="#ffa502"/><rect x="478" y="146" width="14" height="9" fill="#9b59b6"/><rect x="496" y="146" width="14" height="9" fill="#e84393"/><rect x="514" y="146" width="14" height="9" fill="#f1c40f"/>
    <rect x="580" y="116" width="180" height="52" fill="#1f7a4d" stroke="#182042" stroke-width="2.5"/>
    <rect x="580" y="116" width="180" height="13" fill="#0d5c38"/>
    <text x="592" y="127" font-size="9" fill="#ffffff" font-family="'DotGothic16', monospace" font-weight="900">泡麵・飲料</text>
    <line x1="580" y1="143" x2="760" y2="143" stroke="#0d5c38" stroke-width="2"/><line x1="580" y1="156" x2="760" y2="156" stroke="#0d5c38" stroke-width="2"/>
    <rect x="588" y="132" width="14" height="9" fill="#e67e22"/><rect x="606" y="132" width="14" height="9" fill="#e74c3c"/><rect x="624" y="132" width="14" height="9" fill="#f1c40f"/><rect x="642" y="132" width="14" height="9" fill="#3498db"/><rect x="660" y="132" width="14" height="9" fill="#2ed573"/><rect x="678" y="132" width="14" height="9" fill="#9b59b6"/><rect x="696" y="132" width="14" height="9" fill="#ffa502"/><rect x="714" y="132" width="14" height="9" fill="#00cec9"/>
    <rect x="588" y="146" width="14" height="9" fill="#9b59b6"/><rect x="606" y="146" width="14" height="9" fill="#f39c12"/><rect x="624" y="146" width="14" height="9" fill="#e84393"/><rect x="642" y="146" width="14" height="9" fill="#2ecc71"/><rect x="660" y="146" width="14" height="9" fill="#e74c3c"/><rect x="678" y="146" width="14" height="9" fill="#3498db"/><rect x="696" y="146" width="14" height="9" fill="#f1c40f"/><rect x="714" y="146" width="14" height="9" fill="#e67e22"/>
  </g>
  <rect x="400" y="228" width="300" height="16" fill="#b07a45" stroke="#182042" stroke-width="2"/>
  <text x="412" y="240" font-size="10" fill="#ffffff" font-family="'DotGothic16', monospace" font-weight="900">本週特價</text>
  <rect x="16" y="214" width="396" height="14" fill="#a5713d" stroke="#182042" stroke-width="2"/>
  <rect x="24" y="268" width="380" height="28" fill="#bfe3ff" opacity="0.85" stroke="#182042" stroke-width="2"/>
  <line x1="119" y1="268" x2="119" y2="296" stroke="#182042" stroke-width="2"/><line x1="214" y1="268" x2="214" y2="296" stroke="#182042" stroke-width="2"/><line x1="309" y1="268" x2="309" y2="296" stroke="#182042" stroke-width="2"/>
  <circle cx="110" cy="262" r="10" fill="#ef5350" stroke="#182042" stroke-width="2"/><circle cx="200" cy="262" r="10" fill="#ef5350" stroke="#182042" stroke-width="2"/><circle cx="290" cy="262" r="10" fill="#ef5350" stroke="#182042" stroke-width="2"/>
  <rect x="796" y="100" width="328" height="14" fill="#e8edf2" stroke="#182042" stroke-width="2"/>
  <rect x="505" y="272" width="120" height="28" fill="#22b573" opacity="0.5"/>
  <text x="540" y="290" font-size="11" fill="#14532d" font-family="'DotGothic16', monospace" font-weight="900">入 口</text>
  <circle cx="36" cy="86" r="12" fill="#2ed573"/><circle cx="1114" cy="86" r="12" fill="#2ed573"/>
</svg>
<svg id="store-front" viewBox="0 0 1150 300" style="position:absolute; left:0; top:0; width:1150px; height:300px; z-index:950; pointer-events:none;">
  <rect x="16" y="228" width="396" height="38" fill="#8a5a33" stroke="#182042" stroke-width="2"/>
  <line x1="16" y1="228" x2="412" y2="228" stroke="#caa06a" stroke-width="2"/>
  <rect x="796" y="114" width="328" height="54" fill="#ffffff" stroke="#182042" stroke-width="2.5"/>
  <rect x="796" y="124" width="328" height="6" fill="#22b573"/>
  <text x="922" y="160" font-size="11" fill="#14532d" font-family="'DotGothic16', monospace" font-weight="900">歡迎光臨</text>
  <rect x="896" y="100" width="24" height="14" fill="#334155" stroke="#182042" stroke-width="1.5"/>
  <rect x="898" y="102" width="20" height="9" fill="#38bdf8"/>
  <rect x="950" y="100" width="24" height="14" fill="#334155" stroke="#182042" stroke-width="1.5"/>
  <rect x="952" y="102" width="20" height="9" fill="#38bdf8"/>
  <rect x="806" y="96" width="44" height="18" fill="#d97706" stroke="#182042" stroke-width="1.5"/>
  <text x="810" y="109" font-size="9" fill="#fef08a" font-family="'DotGothic16', monospace" font-weight="900">🍢關東煮</text>
</svg>
<div class="store-chip" style="left:424px; top:192px;" onclick="noodleHitClick(event)">🍜 窗邊泡麵</div>`;
    function ensureStoreInterior() {
      if (document.getElementById('store-stage')) return;
      const host = document.querySelector('#landmark-store .island-platform-top') || document.querySelector('#landmark-store .island-platform') || document.getElementById('landmark-store');
      if (!host) return;
      const stage = document.createElement('div');
      stage.id = 'store-stage';
      stage.innerHTML = '<div id="store-rooms">' + STORE_ROOMS_HTML + '</div>';
      host.appendChild(stage);
      let drag = null;
      const activePtrs = new Set();
      stage.addEventListener('pointerdown', e => {
        e.stopPropagation();
        activePtrs.add(e.pointerId);
        if (activePtrs.size > 1) { drag = null; const rooms = document.getElementById('store-rooms'); if (rooms) rooms.style.transition = ''; return; }
        drag = { x: e.clientX, pan: (_storePanManual !== null ? _storePanManual : _storePanCur), moved: 0 };
        _storePanManual = drag.pan;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        const rooms = document.getElementById('store-rooms');
        if (rooms) rooms.style.transition = 'none';
      });
      stage.addEventListener('pointermove', e => {
        if (!drag) return;
        const sc = (stage.clientHeight || 179) / 300;
        const visible = (stage.clientWidth || 278) / sc;
        const maxPan = Math.max(0, 1150 - visible);
        const next = Math.max(0, Math.min(maxPan, drag.pan - (e.clientX - drag.x) / sc));
        drag.moved += Math.abs(next - _storePanManual);
        _storeManualUntil = Date.now() + 30000;
        _storePanManual = next;
        applyStorePan(_storePanManual, sc);
      });
      const endDrag = e => {
        activePtrs.delete(e.pointerId);
        _storeManualUntil = Date.now() + 30000;
        if (!drag) return;
        const wasDrag = drag.moved > 0.5;
        drag = null;
        const rooms = document.getElementById('store-rooms');
        if (rooms) rooms.style.transition = '';
        if (wasDrag) stage.addEventListener('click', ev2 => { ev2.stopPropagation(); ev2.preventDefault(); }, { capture: true, once: true });
      };
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
      stage.addEventListener('dblclick', () => { _storePanManual = null; });
    }
    let _storePanManual = null;
    let _storeManualUntil = 0;
    let _storePanCur = 0; let _storePanT = 0;
    let _storeWasIn = false;
    function applyStorePan(pan, sc) {
      const rooms = document.getElementById('store-rooms');
      if (!rooms) return;
      _storePanCur = pan;
      rooms.style.transform = 'translate(' + (-pan * sc).toFixed(1) + 'px, 0px) scale(' + sc.toFixed(3) + ')';
    }
    function updateStorePan(focusX) {
      const stage = document.getElementById('store-stage');
      if (!stage) return;
      const vpW = stage.clientWidth, vpH = stage.clientHeight;
      if (!vpW || !vpH) return;
      const sc = vpH / 300;
      const visible = vpW / sc;
      if (_storePanManual !== null) {
        if (Date.now() > _storeManualUntil) _storePanManual = null;
        else { applyStorePan(_storePanManual, sc); return; }
      }
      if (typeof focusX !== 'number') focusX = 935;
      let pan;
      if (visible >= 1150) pan = (1150 - visible) / 2;
      else pan = Math.max(0, Math.min(1150 - visible, focusX - visible / 2));
      const _nowStore = performance.now(); const _dtStore = _storePanT ? (_nowStore - _storePanT) : 16; _storePanT = _nowStore;
      applyStorePan(smoothPanStep(_storePanCur, pan, focusX, visible, _dtStore), sc);
    }
    function updateStoreStage() {
      ensureStoreInterior();
      const stage = document.getElementById('store-stage');
      if (!stage) return;
      const rooms = document.getElementById('store-rooms');
      const playerIn = (typeof currentLoc !== 'undefined') && currentLoc === 'store' && !gameState.isCommuting;
      if (playerIn !== _storeWasIn) { _storePanManual = null; _storeWasIn = playerIn; }
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
      { // v9.19 主角的泡麵碗放窗邊吧台上
        let np2 = document.getElementById('player-noodle-plate');
        const showN = gameState.noodleUntil && gameState.noodleSeat && playerIn;
        if (showN && rooms) {
          if (!np2) { np2 = document.createElement('div'); np2.id = 'player-noodle-plate'; np2.className = 'dish-plate'; np2.textContent = '🍜'; rooms.appendChild(np2); }
          np2.style.display = 'block'; np2.style.left = (gameState.noodleSeat.x - 9) + 'px'; np2.style.top = (gameState.noodleSeat.y - 40) + 'px'; np2.style.zIndex = '990'; // v9.20 食物置頂
        } else if (np2) np2.style.display = 'none';
      }
      if (cw && playerIn) cw.style.zIndex = (currentState === 'working' || gameState.noodleUntil) ? '500' : '975'; // v9.20.1 站櫃檯後/窗邊吃麵維持夾層；走動/站立在傢俱前景之上
      let focus = 935;
      if (playerIn) focus = gameState.currentX || 565;
      else {
        const inner = (gameState.npcs || []).find(n => n.insideLoc === 'store');
        if (inner) focus = inner.x;
      }
      updateStorePan(focus);
    }



    // ================= v9.21 學校大場景（比照住家/超商/餐廳：大教室塞框框、課桌前景層） =================
    const _deskBack = [], _deskFront = [];
    [[430, 185], [590, 185], [750, 185], [430, 250], [590, 250], [750, 250]].forEach(([sx, sy]) => { // v9.22 教室只留 6 張課桌（左右改辦公室/閱讀角）
      _deskBack.push(`<rect x="${sx - 28}" y="${sy - 38}" width="56" height="14" fill="#b08968" stroke="#182042" stroke-width="1.8"/><rect x="${sx - 16}" y="${sy - 35}" width="13" height="8" fill="#e74c3c"/><rect x="${sx + 4}" y="${sy - 34}" width="12" height="7" fill="#f5f0e6" stroke="#b0a58e" stroke-width="1"/><rect x="${sx - 20}" y="${sy + 3}" width="40" height="9" fill="#795548" stroke="#182042" stroke-width="1.5"/>`);
      _deskFront.push(`<rect x="${sx - 28}" y="${sy - 24}" width="56" height="26" fill="#a9743f" stroke="#182042" stroke-width="1.8"/><line x1="${sx - 28}" y1="${sy - 24}" x2="${sx + 28}" y2="${sy - 24}" stroke="#d9a066" stroke-width="2"/>`);
    });
    const SCHOOL_ROOMS_HTML = `
<svg viewBox="0 0 1150 300" style="position:absolute; left:0; top:0; width:1150px; height:300px;">
  <rect x="0" y="0" width="1150" height="124" fill="#f7ecd2"/>
  <rect x="0" y="118" width="1150" height="6" fill="#d9c9a3"/>
  <rect x="0" y="124" width="1150" height="176" fill="#d9a066"/>
  <g stroke="#b57e46" stroke-width="2"><line x1="0" y1="168" x2="1150" y2="168"/><line x1="0" y1="212" x2="1150" y2="212"/><line x1="0" y1="256" x2="1150" y2="256"/></g>
  <!-- 左：教師辦公室 -->
  <rect x="36" y="26" width="104" height="70" fill="#bfe6f5" stroke="#182042" stroke-width="2"/><line x1="88" y1="26" x2="88" y2="96" stroke="#182042" stroke-width="2"/><line x1="36" y1="61" x2="140" y2="61" stroke="#182042" stroke-width="2"/><circle cx="60" cy="42" r="9" fill="#ffd93b"/>
  <g>
    <rect x="160" y="28" width="122" height="68" fill="#8d5a2c" stroke="#182042" stroke-width="2"/>
    <rect x="168" y="36" width="10" height="24" fill="#e74c3c"/><rect x="180" y="36" width="8" height="24" fill="#f5f0e6"/><rect x="190" y="36" width="11" height="24" fill="#3498db"/><rect x="203" y="36" width="8" height="24" fill="#f1c40f"/><rect x="213" y="36" width="10" height="24" fill="#27ae60"/><rect x="225" y="36" width="8" height="24" fill="#9b59b6"/><rect x="235" y="36" width="11" height="24" fill="#e67e22"/><rect x="248" y="36" width="8" height="24" fill="#f5f0e6"/><rect x="258" y="36" width="10" height="24" fill="#e74c3c"/>
    <line x1="160" y1="64" x2="282" y2="64" stroke="#182042" stroke-width="2"/>
    <rect x="168" y="68" width="9" height="22" fill="#3498db"/><rect x="179" y="68" width="10" height="22" fill="#f1c40f"/><rect x="191" y="68" width="8" height="22" fill="#27ae60"/><rect x="201" y="68" width="11" height="22" fill="#e74c3c"/><rect x="214" y="68" width="8" height="22" fill="#f5f0e6"/><rect x="224" y="68" width="10" height="22" fill="#9b59b6"/><rect x="236" y="68" width="9" height="22" fill="#e67e22"/><rect x="247" y="68" width="11" height="22" fill="#3498db"/><rect x="260" y="68" width="8" height="22" fill="#f1c40f"/>
  </g>
  <rect x="48" y="102" width="118" height="18" fill="#fff8e1" stroke="#182042" stroke-width="1.8"/>
  <text x="60" y="115" font-size="11" fill="#8d5a2c" font-family="'DotGothic16', monospace" font-weight="900">教師辦公室</text>
  <rect x="222" y="106" width="66" height="9" fill="#6d4c41"/>
  <rect x="228" y="82" width="54" height="24" fill="#cfd8dc" stroke="#182042" stroke-width="2"/>
  <rect x="236" y="70" width="38" height="14" fill="#ffffff" stroke="#b0a58e" stroke-width="1"/>
  <circle cx="274" cy="92" r="3" fill="#27ae60"/>
  <rect x="104" y="104" width="108" height="12" fill="#8d5a2c" stroke="#182042" stroke-width="1.8"/>
  <rect x="118" y="94" width="11" height="9" fill="#ffffff" stroke="#182042" stroke-width="1.2"/><path d="M121 94 q2 -5 5 0" stroke="#90a4ae" stroke-width="1.6" fill="none"/>
  <rect x="146" y="97" width="20" height="7" fill="#f5f0e6" stroke="#b0a58e" stroke-width="1"/>
  <rect x="186" y="92" width="10" height="12" fill="#27ae60"/><circle cx="191" cy="88" r="7" fill="#66bb6a"/>
  <rect x="135" y="154" width="42" height="9" fill="#5d4037" stroke="#182042" stroke-width="1.5"/>
  <rect x="302" y="14" width="10" height="196" fill="#a1887f" stroke="#182042" stroke-width="1.8"/>
  <rect x="284" y="120" width="46" height="20" fill="#fff8e1" stroke="#182042" stroke-width="1.8"/>
  <text x="289" y="134" font-size="10" fill="#8d5a2c" font-family="'DotGothic16', monospace" font-weight="900">三年二班</text>
  <!-- 中：黑板 -->
  <g>
    <rect x="346" y="20" width="468" height="92" fill="#6d4c41" stroke="#182042" stroke-width="2.5"/>
    <rect x="354" y="28" width="452" height="76" fill="#2f5d3a"/>
    <text x="374" y="58" font-size="14" fill="#e8f5e9" font-family="'DotGothic16', monospace" font-weight="900">今日課程：數學・國文・自然</text>
    <text x="374" y="84" font-size="13" fill="#c8e6c9" font-family="'DotGothic16', monospace" font-weight="900">3/4 ＋ 1/2 ＝ ？　（這題考試會考！）</text>
    <rect x="752" y="94" width="34" height="5" fill="#f5f0e6"/><rect x="722" y="94" width="16" height="5" fill="#ffb3c1"/>
  </g>
  <circle cx="838" cy="42" r="15" fill="#ffffff" stroke="#182042" stroke-width="2"/><line x1="838" y1="42" x2="838" y2="32" stroke="#182042" stroke-width="2"/><line x1="838" y1="42" x2="845" y2="46" stroke="#182042" stroke-width="2"/>
  <!-- 右：榮譽榜＋閱讀角 -->
  <g>
    <rect x="866" y="18" width="256" height="66" fill="#c9a06b" stroke="#182042" stroke-width="2"/>
    <text x="878" y="38" font-size="12" fill="#5d4037" font-family="'DotGothic16', monospace" font-weight="900">🏆 榮譽榜</text>
    <text id="board-r1i" x="878" y="58" font-size="11" fill="#5d4037" font-family="'DotGothic16', monospace" font-weight="900">🥇</text>
    <text id="board-r2i" x="972" y="58" font-size="11" fill="#5d4037" font-family="'DotGothic16', monospace" font-weight="900">🥈</text>
    <text id="board-r3i" x="878" y="74" font-size="11" fill="#5d4037" font-family="'DotGothic16', monospace" font-weight="900">🥉</text>
    <text id="board-4i" x="972" y="74" font-size="11" fill="#5d4037" font-family="'DotGothic16', monospace" font-weight="900">⭐</text>
  </g>
  <ellipse cx="1000" cy="228" rx="128" ry="46" fill="#b2dfdb" opacity="0.55"/>
  <ellipse cx="1000" cy="228" rx="104" ry="36" fill="none" stroke="#80cbc4" stroke-width="2"/>
  <rect x="888" y="138" width="224" height="30" fill="#8d5a2c" stroke="#182042" stroke-width="2"/>
  <rect x="896" y="144" width="9" height="18" fill="#e74c3c"/><rect x="907" y="144" width="7" height="18" fill="#f5f0e6"/><rect x="916" y="144" width="9" height="18" fill="#3498db"/><rect x="927" y="144" width="7" height="18" fill="#f1c40f"/><rect x="936" y="144" width="9" height="18" fill="#27ae60"/><rect x="947" y="144" width="7" height="18" fill="#9b59b6"/><rect x="956" y="144" width="9" height="18" fill="#e67e22"/><rect x="1036" y="144" width="9" height="18" fill="#e74c3c"/><rect x="1047" y="144" width="7" height="18" fill="#3498db"/><rect x="1056" y="144" width="9" height="18" fill="#f1c40f"/><rect x="1067" y="144" width="7" height="18" fill="#27ae60"/><rect x="1076" y="144" width="9" height="18" fill="#9b59b6"/><rect x="1087" y="144" width="7" height="18" fill="#f5f0e6"/><rect x="1096" y="144" width="9" height="18" fill="#e67e22"/>
  <rect x="952" y="122" width="96" height="16" fill="#fff8e1" stroke="#182042" stroke-width="1.6"/>
  <text x="964" y="134" font-size="10" fill="#8d5a2c" font-family="'DotGothic16', monospace" font-weight="900">📚 閱讀角</text>
  <ellipse cx="935" cy="246" rx="30" ry="13" fill="#ffab91" stroke="#182042" stroke-width="1.6"/>
  <ellipse cx="1065" cy="250" rx="30" ry="13" fill="#90caf9" stroke="#182042" stroke-width="1.6"/>
  <rect x="1108" y="196" width="16" height="12" fill="#8d5a2c"/><circle cx="1116" cy="186" r="10" fill="#66bb6a"/><circle cx="1108" cy="192" r="7" fill="#81c784"/>
  <line x1="884" y1="196" x2="884" y2="234" stroke="#182042" stroke-width="2.5"/><path d="M876 196 L892 196 L888 182 L880 182 Z" fill="#ffd93b" stroke="#182042" stroke-width="1.5"/>
  <rect x="524" y="94" width="102" height="10" fill="#8d5a2c" stroke="#182042" stroke-width="1.8"/>
  ${_deskBack.join('')}
  <g id="study-books-school-in" class="study-books"><rect class="book-layer" x="560" y="238" width="20" height="4" fill="#c0392b"/><rect class="book-layer" x="560" y="234" width="20" height="4" fill="#2980b9"/><rect class="book-layer" x="560" y="230" width="20" height="4" fill="#27ae60"/><rect class="book-layer" x="560" y="226" width="20" height="4" fill="#8e44ad"/><rect class="book-layer" x="560" y="222" width="20" height="4" fill="#f39c12"/></g>
  <rect x="515" y="272" width="120" height="28" fill="#8d5a2c"/>
  <text x="553" y="291" font-size="11" fill="#ffe9b8" font-family="'DotGothic16', monospace" font-weight="900">入 口</text>
</svg>
<svg id="school-front" viewBox="0 0 1150 300" style="position:absolute; left:0; top:0; width:1150px; height:300px; z-index:950; pointer-events:none;">
  <rect x="524" y="102" width="102" height="20" fill="#795548" stroke="#182042" stroke-width="2"/>
  <line x1="524" y1="102" x2="626" y2="102" stroke="#a1887f" stroke-width="2"/>
  <rect x="104" y="124" width="108" height="20" fill="#8d5a2c" stroke="#182042" stroke-width="2"/>
  ${_deskFront.join('')}
</svg>`;
    function ensureSchoolInterior() {
      if (document.getElementById('school-stage')) return;
      const host = document.querySelector('#landmark-school .island-platform-top') || document.querySelector('#landmark-school .island-platform') || document.getElementById('landmark-school');
      if (!host) return;
      const pf = document.getElementById('podium-fg'); if (pf) pf.remove(); // v9.21 舊講台前景層退役（新場景自帶講台前景）
      const stage = document.createElement('div');
      stage.id = 'school-stage';
      stage.innerHTML = '<div id="school-rooms">' + SCHOOL_ROOMS_HTML + '</div>';
      host.appendChild(stage);
      let drag = null;
      const activePtrs = new Set();
      stage.addEventListener('pointerdown', e => {
        e.stopPropagation();
        activePtrs.add(e.pointerId);
        if (activePtrs.size > 1) { drag = null; const rooms = document.getElementById('school-rooms'); if (rooms) rooms.style.transition = ''; return; }
        drag = { x: e.clientX, pan: (_schoolPanManual !== null ? _schoolPanManual : _schoolPanCur), moved: 0 };
        _schoolPanManual = drag.pan;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        const rooms = document.getElementById('school-rooms');
        if (rooms) rooms.style.transition = 'none';
      });
      stage.addEventListener('pointermove', e => {
        if (!drag) return;
        const sc = (stage.clientHeight || 179) / 300;
        const visible = (stage.clientWidth || 278) / sc;
        const maxPan = Math.max(0, 1150 - visible);
        const next = Math.max(0, Math.min(maxPan, drag.pan - (e.clientX - drag.x) / sc));
        drag.moved += Math.abs(next - _schoolPanManual);
        _schoolManualUntil = Date.now() + 30000;
        _schoolPanManual = next;
        applySchoolPan(_schoolPanManual, sc);
      });
      const endDrag = e => {
        activePtrs.delete(e.pointerId);
        _schoolManualUntil = Date.now() + 30000;
        if (!drag) return;
        const wasDrag = drag.moved > 0.5;
        drag = null;
        const rooms = document.getElementById('school-rooms');
        if (rooms) rooms.style.transition = '';
        if (wasDrag) stage.addEventListener('click', ev2 => { ev2.stopPropagation(); ev2.preventDefault(); }, { capture: true, once: true });
      };
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
      stage.addEventListener('dblclick', () => { _schoolPanManual = null; });
    }
    let _schoolPanManual = null;
    let _schoolManualUntil = 0;
    let _schoolPanCur = 0; let _schoolPanT = 0;
    let _schoolWasIn = false;
    function applySchoolPan(pan, sc) {
      const rooms = document.getElementById('school-rooms');
      if (!rooms) return;
      _schoolPanCur = pan;
      rooms.style.transform = 'translate(' + (-pan * sc).toFixed(1) + 'px, 0px) scale(' + sc.toFixed(3) + ')';
    }
    function updateSchoolPan(focusX) {
      const stage = document.getElementById('school-stage');
      if (!stage) return;
      const vpW = stage.clientWidth, vpH = stage.clientHeight;
      if (!vpW || !vpH) return;
      const sc = vpH / 300;
      const visible = vpW / sc;
      if (_schoolPanManual !== null) {
        if (Date.now() > _schoolManualUntil) _schoolPanManual = null;
        else { applySchoolPan(_schoolPanManual, sc); return; }
      }
      if (typeof focusX !== 'number') focusX = 575;
      let pan;
      if (visible >= 1150) pan = (1150 - visible) / 2;
      else pan = Math.max(0, Math.min(1150 - visible, focusX - visible / 2));
      const _nowSchool = performance.now(); const _dtSchool = _schoolPanT ? (_nowSchool - _schoolPanT) : 16; _schoolPanT = _nowSchool;
      applySchoolPan(smoothPanStep(_schoolPanCur, pan, focusX, visible, _dtSchool), sc);
    }
    function updateSchoolStage() {
      ensureSchoolInterior();
      const stage = document.getElementById('school-stage');
      if (!stage) return;
      const rooms = document.getElementById('school-rooms');
      const playerIn = (typeof currentLoc !== 'undefined') && currentLoc === 'school' && !gameState.isCommuting;
      if (playerIn !== _schoolWasIn) { _schoolPanManual = null; _schoolWasIn = playerIn; }
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
      if (cw && playerIn) cw.style.zIndex = (currentState === 'studying') ? '500' : '975'; // v9.21 上課坐課桌後（被課桌前景蓋腿）；走動/下課站立在前景之上
      let focus = 575;
      if (playerIn) focus = gameState.currentX || 560;
      else {
        const inner = (gameState.npcs || []).find(n => n.insideLoc === 'school');
        if (inner) focus = inner.x;
      }
      updateSchoolPan(focus);
    }


    // ================= v9.26 圖書館大場景（比照住家/超商/餐廳/學校：大室內塞框框、窗光＋抽書） =================
    const LIB_SHELF_POINTS = [ { x: 240, y: 128 }, { x: 380, y: 128 }, { x: 760, y: 128 }, { x: 905, y: 128 } ]; // 書架前走道（抽書/上架站位）
    function libSpines(x, y, w) {
      const pal = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#d35400', '#16a085', '#2c3e50', '#e74c3c', '#f1c40f'];
      let out = '';
      [0, 1].forEach(row => {
        const baseY = y + row * 36 + 30;
        let cx = x;
        let i = row * 7;
        while (cx < x + w - 10) {
          const bw = 9 + ((i * 37) % 5), bh = 22 + ((i * 53) % 8);
          out += `<rect x="${cx}" y="${baseY - bh}" width="${bw}" height="${bh}" fill="${pal[i % pal.length]}" stroke="rgba(24,32,66,0.35)" stroke-width="0.7"/>`;
          cx += bw + 2; i++;
        }
        out += `<rect x="${x - 3}" y="${baseY}" width="${w + 6}" height="4" fill="#8d5a2c"/>`;
      });
      return out;
    }
    const LIB_ROOMS_HTML = `
<svg viewBox="0 0 1150 300" style="position:absolute; left:0; top:0; width:1150px; height:300px;">
  <rect x="0" y="0" width="1150" height="130" fill="#f5ede0"/>
  <rect x="0" y="130" width="1150" height="170" fill="#b08954"/>
  <g stroke="#966f3f" stroke-width="1.4" opacity="0.5"><line x1="0" y1="158" x2="1150" y2="158"/><line x1="0" y1="196" x2="1150" y2="196"/><line x1="0" y1="234" x2="1150" y2="234"/><line x1="0" y1="272" x2="1150" y2="272"/></g>
  <rect x="176" y="158" width="798" height="124" rx="10" fill="#8e3b46" opacity="0.30"/>
  <g id="lib-shaft-w" opacity="0"><polygon points="36,112 152,112 268,254 128,254" fill="#ffedb5"/><circle class="lib-mote" cx="120" cy="150" r="2.2" fill="#fff7d6"/><circle class="lib-mote" cx="170" cy="190" r="1.7" fill="#fff7d6"/><circle class="lib-mote" cx="95" cy="205" r="1.4" fill="#fff7d6"/></g>
  <g id="lib-shaft-e" opacity="0"><polygon points="1114,112 998,112 882,254 1022,254" fill="#ffedb5"/><circle class="lib-mote" cx="1030" cy="150" r="2.2" fill="#fff7d6"/><circle class="lib-mote" cx="980" cy="195" r="1.7" fill="#fff7d6"/><circle class="lib-mote" cx="1055" cy="210" r="1.4" fill="#fff7d6"/></g>
  <rect x="30" y="8" width="128" height="104" fill="#a8d4f0" stroke="#5d4028" stroke-width="4"/>
  <line x1="94" y1="8" x2="94" y2="112" stroke="#5d4028" stroke-width="3"/><line x1="30" y1="60" x2="158" y2="60" stroke="#5d4028" stroke-width="3"/>
  <rect x="992" y="8" width="128" height="104" fill="#a8d4f0" stroke="#5d4028" stroke-width="4"/>
  <line x1="1056" y1="8" x2="1056" y2="112" stroke="#5d4028" stroke-width="3"/><line x1="992" y1="60" x2="1120" y2="60" stroke="#5d4028" stroke-width="3"/>
  <rect x="176" y="22" width="272" height="100" fill="#6d4c41" stroke="#182042" stroke-width="2.5"/>
  ${libSpines(184, 28, 256)}
  <rect x="702" y="22" width="272" height="100" fill="#6d4c41" stroke="#182042" stroke-width="2.5"/>
  ${libSpines(710, 28, 256)}
  <rect x="486" y="26" width="178" height="76" fill="#6d4c41" stroke="#182042" stroke-width="2.5"/>
  ${libSpines(494, 32, 162)}
  <circle cx="575" cy="13" r="10" fill="#fff8e1" stroke="#182042" stroke-width="2"/><line x1="575" y1="13" x2="575" y2="6" stroke="#182042" stroke-width="1.8"/><line x1="575" y1="13" x2="580" y2="15" stroke="#182042" stroke-width="1.8"/>
  <text x="575" y="112" font-size="11" fill="#5d4028" font-family="'DotGothic16', monospace" font-weight="900" text-anchor="middle">借 還 書 櫃 台</text>
  <rect x="474" y="116" width="202" height="9" fill="#8d5a2c" stroke="#182042" stroke-width="1.6"/>
  <circle cx="88" cy="170" r="17" fill="#7fb2d9" stroke="#182042" stroke-width="2"/><path d="M74 160 Q88 150 102 160 M74 180 Q88 190 102 180" stroke="#27ae60" stroke-width="2.4" fill="none"/><rect x="84" y="187" width="8" height="10" fill="#5d4028"/>
  <rect x="1064" y="150" width="14" height="16" fill="#b5651d"/><circle cx="1071" cy="140" r="13" fill="#66bb6a"/><circle cx="1062" cy="148" r="8" fill="#81c784"/>
  <rect x="196" y="176" width="268" height="12" fill="#8d5a2c" stroke="#182042" stroke-width="1.8"/>
  <rect x="206" y="188" width="8" height="26" fill="#5d4028"/><rect x="446" y="188" width="8" height="26" fill="#5d4028"/>
  <rect x="686" y="176" width="268" height="12" fill="#8d5a2c" stroke="#182042" stroke-width="1.8"/>
  <rect x="696" y="188" width="8" height="26" fill="#5d4028"/><rect x="936" y="188" width="8" height="26" fill="#5d4028"/>
  <g id="lib-lamps" opacity="0"><circle cx="330" cy="160" r="17" fill="#ffd97a" opacity="0.5"/><circle cx="820" cy="160" r="17" fill="#ffd97a" opacity="0.5"/></g>
  <rect x="326" y="162" width="8" height="12" fill="#2e6b4f"/><path d="M318 162 L342 162 L337 150 L323 150 Z" fill="#27ae60" stroke="#182042" stroke-width="1.4"/>
  <rect x="816" y="162" width="8" height="12" fill="#2e6b4f"/><path d="M808 162 L832 162 L827 150 L813 150 Z" fill="#27ae60" stroke="#182042" stroke-width="1.4"/>
  <rect x="110" y="196" width="62" height="28" rx="7" fill="#a33b46" stroke="#182042" stroke-width="2"/>
  <rect x="110" y="220" width="62" height="15" rx="6" fill="#c04b57" stroke="#182042" stroke-width="2"/>
  <rect x="102" y="212" width="10" height="22" rx="4" fill="#a33b46" stroke="#182042" stroke-width="1.6"/><rect x="170" y="212" width="10" height="22" rx="4" fill="#a33b46" stroke="#182042" stroke-width="1.6"/>
  <circle cx="198" cy="230" r="11" fill="#8d5a2c" stroke="#182042" stroke-width="1.6"/>
  <g id="study-books-library-in" class="study-books"><rect class="book-layer" x="188" y="215" width="20" height="4" fill="#8e44ad"/><rect class="book-layer" x="188" y="211" width="20" height="4" fill="#c0392b"/><rect class="book-layer" x="188" y="207" width="20" height="4" fill="#2980b9"/><rect class="book-layer" x="188" y="203" width="20" height="4" fill="#f39c12"/><rect class="book-layer" x="188" y="199" width="20" height="4" fill="#27ae60"/></g>
  <rect x="996" y="118" width="88" height="56" fill="#2e6b4f" stroke="#182042" stroke-width="2"/>
  <text x="1040" y="134" font-size="10" fill="#ffe9b8" font-family="'DotGothic16', monospace" font-weight="900" text-anchor="middle">新書推薦</text>
  <rect x="1006" y="142" width="12" height="24" fill="#e74c3c"/><rect x="1021" y="140" width="12" height="26" fill="#f1c40f"/><rect x="1036" y="143" width="12" height="23" fill="#3498db"/><rect x="1051" y="141" width="12" height="25" fill="#9b59b6"/>
  <rect x="515" y="272" width="120" height="28" fill="#8d5a2c"/>
  <text x="575" y="291" font-size="11" fill="#ffe9b8" font-family="'DotGothic16', monospace" font-weight="900" text-anchor="middle">入 口</text>
</svg>
<svg id="lib-front" viewBox="0 0 1150 300" style="position:absolute; left:0; top:0; width:1150px; height:300px; z-index:950; pointer-events:none;">
  <rect x="474" y="124" width="202" height="26" fill="#795548" stroke="#182042" stroke-width="2"/>
  <line x1="474" y1="124" x2="676" y2="124" stroke="#a1887f" stroke-width="2"/>
  <rect x="196" y="186" width="268" height="10" fill="#6d4c41"/>
  <rect x="686" y="186" width="268" height="10" fill="#6d4c41"/>
</svg>
<button class="lib-rec-book" onpointerdown="event.stopPropagation()" onclick="borrowBook()">📖 借推薦書</button>`;
    let _libPanManual = null;
    let _libManualUntil = 0;
    let _libPanCur = 0; let _libPanT = 0;
    let _libWasIn = false;
    let _libLightKey = '';
    function applyLibraryPan(pan, sc) {
      const rooms = document.getElementById('lib-rooms');
      if (!rooms) return;
      _libPanCur = pan;
      rooms.style.transform = 'translate(' + (-pan * sc).toFixed(1) + 'px, 0px) scale(' + sc.toFixed(3) + ')';
    }
    function updateLibraryPan(focusX) {
      const stage = document.getElementById('lib-stage');
      if (!stage) return;
      const vpW = stage.clientWidth, vpH = stage.clientHeight;
      if (!vpW || !vpH) return;
      const sc = vpH / 300;
      const visible = vpW / sc;
      if (_libPanManual !== null) {
        if (Date.now() > _libManualUntil) _libPanManual = null;
        else { applyLibraryPan(_libPanManual, sc); return; }
      }
      if (typeof focusX !== 'number') focusX = 575;
      let pan;
      if (visible >= 1150) pan = (1150 - visible) / 2;
      else pan = Math.max(0, Math.min(1150 - visible, focusX - visible / 2));
      const _nowLib = performance.now(); const _dtLib = _libPanT ? (_nowLib - _libPanT) : 16; _libPanT = _nowLib;
      applyLibraryPan(smoothPanStep(_libPanCur, pan, focusX, visible, _dtLib), sc);
    }
    function ensureLibraryInterior() {
      if (document.getElementById('lib-stage')) return;
      const host = document.querySelector('#landmark-library .island-platform-top') || document.querySelector('#landmark-library .island-platform') || document.getElementById('landmark-library');
      if (!host) return;
      const stage = document.createElement('div');
      stage.id = 'lib-stage';
      stage.innerHTML = '<div id="lib-rooms">' + LIB_ROOMS_HTML + '</div>';
      host.appendChild(stage);
      let drag = null;
      const activePtrs = new Set();
      stage.addEventListener('pointerdown', e => {
        e.stopPropagation();
        activePtrs.add(e.pointerId);
        if (activePtrs.size > 1) { drag = null; const rooms = document.getElementById('lib-rooms'); if (rooms) rooms.style.transition = ''; return; }
        drag = { x: e.clientX, pan: (_libPanManual !== null ? _libPanManual : _libPanCur), moved: 0 };
        _libPanManual = drag.pan;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        const rooms = document.getElementById('lib-rooms');
        if (rooms) rooms.style.transition = 'none';
      });
      stage.addEventListener('pointermove', e => {
        if (!drag) return;
        const sc = (stage.clientHeight || 179) / 300;
        const visible = (stage.clientWidth || 278) / sc;
        const maxPan = Math.max(0, 1150 - visible);
        const next = Math.max(0, Math.min(maxPan, drag.pan - (e.clientX - drag.x) / sc));
        drag.moved += Math.abs(next - _libPanManual);
        _libManualUntil = Date.now() + 30000;
        _libPanManual = next;
        applyLibraryPan(_libPanManual, sc);
      });
      const endDrag = e => {
        activePtrs.delete(e.pointerId);
        _libManualUntil = Date.now() + 30000;
        if (!drag) return;
        const wasDrag = drag.moved > 0.5;
        drag = null;
        const rooms = document.getElementById('lib-rooms');
        if (rooms) rooms.style.transition = '';
        if (wasDrag) stage.addEventListener('click', ev2 => { ev2.stopPropagation(); ev2.preventDefault(); }, { capture: true, once: true });
      };
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
      stage.addEventListener('dblclick', () => { _libPanManual = null; });
    }
    function updateLibraryLighting() { // v9.26 招牌窗光：上午東窗亮、下午西窗亮、傍晚關窗光開桌燈
      const w = document.getElementById('lib-shaft-w'), e2 = document.getElementById('lib-shaft-e'), l = document.getElementById('lib-lamps');
      if (!w || !e2 || !l) return;
      const h = (gameState.hour || 0) + (gameState.minute || 0) / 60;
      const key = (h < 8 || h >= 21) ? 'off' : h < 11 ? 'am' : h < 15 ? 'noon' : h < 18 ? 'pm' : 'lamp';
      if (key === _libLightKey) return; _libLightKey = key;
      const cfg = { off: [0, 0, 0], am: [0.10, 0.36, 0], noon: [0.27, 0.27, 0], pm: [0.38, 0.10, 0], lamp: [0, 0, 0.55] }[key];
      w.style.opacity = String(cfg[0]); e2.style.opacity = String(cfg[1]); l.style.opacity = String(cfg[2]);
    }
    function updateLibraryStage() {
      ensureLibraryInterior();
      const stage = document.getElementById('lib-stage');
      if (!stage) return;
      const rooms = document.getElementById('lib-rooms');
      const playerIn = (typeof currentLoc !== 'undefined') && currentLoc === 'library' && !gameState.isCommuting;
      if (playerIn !== _libWasIn) { _libPanManual = null; _libWasIn = playerIn; }
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
      if (cw && playerIn) cw.style.zIndex = (currentState === 'studying') ? '500' : '975';
      let focus = 575;
      if (playerIn) focus = gameState.currentX || 560;
      else {
        const inner = (gameState.npcs || []).find(n => n.insideLoc === 'library');
        if (inner) focus = inner.x;
      }
      updateLibraryPan(focus);
      updateLibraryLighting();
    }
    function borrowBook() { // v9.26 新書推薦：每天可借一次（要人在圖書館裡）
      if (typeof currentLoc === 'undefined' || currentLoc !== 'library' || gameState.isCommuting) { queueFloatingText('要先進圖書館才能借書喔 📚'); return; }
      const today = gameState.totalGameDays || 0;
      if (gameState._borrowedDay === today) { queueFloatingText('今天已經借過推薦書了，明天再來 📚'); return; }
      gameState._borrowedDay = today;
      gameState.focus = Math.min(100, (gameState.focus || 0) + 20);
      if (typeof gainKnowledge === 'function') gainKnowledge('library', 0.5);
      queueFloatingText('借了本好書！專注 +20、知識小漲 📖');
      if (typeof playSound === 'function') playSound('click');
      if (typeof saveGameData === 'function') saveGameData();
    }

    // ================= v9.18 餐廳大場景（比照住家/超商：大室內塞框框、鐵板台前景層） =================
    const REST_ROOMS_HTML = `
<svg viewBox="0 0 1150 300" style="position:absolute; left:0; top:0; width:1150px; height:300px;">
  <rect x="0" y="58" width="1150" height="242" fill="#a5713d"/>
  <g stroke="#96622f" stroke-width="2">
    <line x1="0" y1="96" x2="1150" y2="96"/><line x1="0" y1="134" x2="1150" y2="134"/><line x1="0" y1="172" x2="1150" y2="172"/><line x1="0" y1="210" x2="1150" y2="210"/><line x1="0" y1="248" x2="1150" y2="248"/>
  </g>
  <rect x="0" y="0" width="1150" height="58" fill="#7a3b2e"/>
  <rect x="0" y="52" width="1150" height="6" fill="#5d2a20"/>
  <text x="28" y="37" font-size="17" fill="#ffe9b8" font-family="'DotGothic16', monospace" font-weight="900">🍳 鐵板食堂</text>
  <rect x="240" y="8" width="92" height="38" fill="#fff8e1" stroke="#182042" stroke-width="2"/>
  <text x="254" y="33" font-size="16" fill="#b3543f" font-family="'DotGothic16', monospace" font-weight="900">🍜 拉麵</text>
  <g>
    <rect x="640" y="6" width="470" height="46" fill="#2e2a26" stroke="#182042" stroke-width="2"/>
    <text x="656" y="24" font-size="11" fill="#ffe9b8" font-family="'DotGothic16', monospace" font-weight="900">招牌炒麵 $60　豚骨拉麵 $75</text>
    <text x="656" y="42" font-size="11" fill="#ffe9b8" font-family="'DotGothic16', monospace" font-weight="900">鐵板牛排 $95　香煎雞腿 $80　叉燒炒飯 $60</text>
  </g>
  <g>
    <line x1="160" y1="0" x2="160" y2="18" stroke="#182042" stroke-width="2"/><path d="M146,18 L174,18 L168,30 L152,30 Z" fill="#d9a441" stroke="#182042" stroke-width="1.5"/><circle cx="160" cy="40" r="16" fill="#ffd97a" opacity="0.35"/>
    <line x1="320" y1="0" x2="320" y2="18" stroke="#182042" stroke-width="2"/><path d="M306,18 L334,18 L328,30 L312,30 Z" fill="#d9a441" stroke="#182042" stroke-width="1.5"/><circle cx="320" cy="40" r="16" fill="#ffd97a" opacity="0.35"/>
    <line x1="480" y1="0" x2="480" y2="18" stroke="#182042" stroke-width="2"/><path d="M466,18 L494,18 L488,30 L472,30 Z" fill="#d9a441" stroke="#182042" stroke-width="1.5"/><circle cx="480" cy="40" r="16" fill="#ffd97a" opacity="0.35"/>
  </g>
  <rect x="60" y="92" width="520" height="16" fill="#3a3f4a" stroke="#182042" stroke-width="2"/>
  <g stroke="#2b2f38" stroke-width="1.5"><line x1="60" y1="97" x2="580" y2="97"/><line x1="60" y1="102" x2="580" y2="102"/></g>
  <rect x="120" y="95" width="16" height="8" fill="#e67e22"/><rect x="210" y="96" width="14" height="7" fill="#2ecc71"/><rect x="388" y="95" width="16" height="8" fill="#e74c3c"/><rect x="470" y="96" width="14" height="7" fill="#f1c40f"/>
  <rect x="60" y="108" width="520" height="70" fill="#795548"/>
  <circle cx="738" cy="194" r="9" fill="#8d5a2c" stroke="#182042" stroke-width="2"/><circle cx="802" cy="194" r="9" fill="#8d5a2c" stroke="#182042" stroke-width="2"/>
  <circle cx="958" cy="242" r="9" fill="#8d5a2c" stroke="#182042" stroke-width="2"/><circle cx="1022" cy="242" r="9" fill="#8d5a2c" stroke="#182042" stroke-width="2"/>
  <g>
    <circle cx="120" cy="184" r="10" fill="#c0392b" stroke="#182042" stroke-width="2"/><circle cx="200" cy="184" r="10" fill="#c0392b" stroke="#182042" stroke-width="2"/><circle cx="280" cy="184" r="10" fill="#c0392b" stroke="#182042" stroke-width="2"/>
    <circle cx="360" cy="184" r="10" fill="#c0392b" stroke="#182042" stroke-width="2"/><circle cx="440" cy="184" r="10" fill="#c0392b" stroke="#182042" stroke-width="2"/><circle cx="520" cy="184" r="10" fill="#c0392b" stroke="#182042" stroke-width="2"/>
  </g>
  <g>
    <circle cx="770" cy="160" r="36" fill="#ffffff" stroke="#182042" stroke-width="2.5"/><circle cx="770" cy="160" r="26" fill="#fdfdfd" stroke="#e5e0d5" stroke-width="2"/>
    <rect x="762" y="150" width="16" height="12" fill="#e74c3c"/>
    <rect x="726" y="118" width="18" height="14" fill="#8d5a2c" stroke="#182042" stroke-width="1.5"/><rect x="796" y="118" width="18" height="14" fill="#8d5a2c" stroke="#182042" stroke-width="1.5"/>
    <rect x="726" y="190" width="18" height="14" fill="#8d5a2c" stroke="#182042" stroke-width="1.5"/><rect x="796" y="190" width="18" height="14" fill="#8d5a2c" stroke="#182042" stroke-width="1.5"/>
    <circle cx="990" cy="208" r="36" fill="#ffffff" stroke="#182042" stroke-width="2.5"/><circle cx="990" cy="208" r="26" fill="#fdfdfd" stroke="#e5e0d5" stroke-width="2"/>
    <rect x="982" y="198" width="16" height="12" fill="#f39c12"/>
    <rect x="946" y="166" width="18" height="14" fill="#8d5a2c" stroke="#182042" stroke-width="1.5"/><rect x="1016" y="166" width="18" height="14" fill="#8d5a2c" stroke="#182042" stroke-width="1.5"/>
    <rect x="946" y="238" width="18" height="14" fill="#8d5a2c" stroke="#182042" stroke-width="1.5"/><rect x="1016" y="238" width="18" height="14" fill="#8d5a2c" stroke="#182042" stroke-width="1.5"/>
  </g>
  <rect x="900" y="58" width="60" height="62" fill="#35507a" stroke="#182042" stroke-width="2"/>
  <text x="918" y="96" font-size="15" fill="#ffffff" font-family="'DotGothic16', monospace" font-weight="900">食</text>
  <circle cx="1096" cy="86" r="14" fill="#2ed573"/><rect x="1090" y="96" width="12" height="18" fill="#8d5a2c"/>
  <rect x="550" y="272" width="120" height="28" fill="#8d5a2c"/>
  <text x="588" y="291" font-size="11" fill="#ffe9b8" font-family="'DotGothic16', monospace" font-weight="900">入 口</text>
</svg>
<svg id="rest-front" viewBox="0 0 1150 300" style="position:absolute; left:0; top:0; width:1150px; height:300px; z-index:950; pointer-events:none;">
  <rect x="60" y="108" width="520" height="32" fill="#6d4c41" stroke="#182042" stroke-width="2.5"/>
  <line x1="60" y1="108" x2="580" y2="108" stroke="#d9a441" stroke-width="3"/>
  <g stroke="#5d4037" stroke-width="2">
    <line x1="125" y1="112" x2="125" y2="136"/><line x1="190" y1="112" x2="190" y2="136"/><line x1="255" y1="112" x2="255" y2="136"/><line x1="320" y1="112" x2="320" y2="136"/><line x1="385" y1="112" x2="385" y2="136"/><line x1="450" y1="112" x2="450" y2="136"/><line x1="515" y1="112" x2="515" y2="136"/>
  </g>
</svg>
<svg id="rest-front2" viewBox="0 0 1150 300" style="position:absolute; left:0; top:0; width:1150px; height:300px; z-index:960; pointer-events:none;">
  <rect x="60" y="166" width="520" height="14" fill="#5d4037" stroke="#182042" stroke-width="2.5"/>
  <line x1="60" y1="166" x2="580" y2="166" stroke="#8d6e63" stroke-width="2"/>
  <text x="282" y="177" font-size="11" fill="#ffe9b8" font-family="'DotGothic16', monospace" font-weight="900">鐵 板 燒</text>
  <path d="M734,160 A36,36 0 0 0 806,160 Z" fill="#f5f0e6" stroke="#182042" stroke-width="2"/>
  <path d="M954,208 A36,36 0 0 0 1026,208 Z" fill="#f5f0e6" stroke="#182042" stroke-width="2"/>
</svg>`;
    function ensureRestInterior() {
      if (document.getElementById('rest-stage')) return;
      const host = document.querySelector('#landmark-restaurant .island-platform-top') || document.querySelector('#landmark-restaurant .island-platform') || document.getElementById('landmark-restaurant');
      if (!host) return;
      const stage = document.createElement('div');
      stage.id = 'rest-stage';
      stage.innerHTML = '<div id="rest-rooms">' + REST_ROOMS_HTML + '</div>';
      host.appendChild(stage);
      let drag = null;
      const activePtrs = new Set();
      stage.addEventListener('pointerdown', e => {
        e.stopPropagation();
        activePtrs.add(e.pointerId);
        if (activePtrs.size > 1) { drag = null; const rooms = document.getElementById('rest-rooms'); if (rooms) rooms.style.transition = ''; return; }
        drag = { x: e.clientX, pan: (_restPanManual !== null ? _restPanManual : _restPanCur), moved: 0 };
        _restPanManual = drag.pan;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        const rooms = document.getElementById('rest-rooms');
        if (rooms) rooms.style.transition = 'none';
      });
      stage.addEventListener('pointermove', e => {
        if (!drag) return;
        const sc = (stage.clientHeight || 179) / 300;
        const visible = (stage.clientWidth || 278) / sc;
        const maxPan = Math.max(0, 1150 - visible);
        const next = Math.max(0, Math.min(maxPan, drag.pan - (e.clientX - drag.x) / sc));
        drag.moved += Math.abs(next - _restPanManual);
        _restManualUntil = Date.now() + 30000;
        _restPanManual = next;
        applyRestPan(_restPanManual, sc);
      });
      const endDrag = e => {
        activePtrs.delete(e.pointerId);
        _restManualUntil = Date.now() + 30000;
        if (!drag) return;
        const wasDrag = drag.moved > 0.5;
        drag = null;
        const rooms = document.getElementById('rest-rooms');
        if (rooms) rooms.style.transition = '';
        if (wasDrag) stage.addEventListener('click', ev2 => { ev2.stopPropagation(); ev2.preventDefault(); }, { capture: true, once: true });
      };
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
      stage.addEventListener('dblclick', () => { _restPanManual = null; });
    }
    let _restPanManual = null;
    let _restManualUntil = 0;
    let _restPanCur = 0; let _restPanT = 0;
    let _restWasIn = false;
    function applyRestPan(pan, sc) {
      const rooms = document.getElementById('rest-rooms');
      if (!rooms) return;
      _restPanCur = pan;
      rooms.style.transform = 'translate(' + (-pan * sc).toFixed(1) + 'px, 0px) scale(' + sc.toFixed(3) + ')';
    }
    function updateRestPan(focusX) {
      const stage = document.getElementById('rest-stage');
      if (!stage) return;
      const vpW = stage.clientWidth, vpH = stage.clientHeight;
      if (!vpW || !vpH) return;
      const sc = vpH / 300;
      const visible = vpW / sc;
      if (_restPanManual !== null) {
        if (Date.now() > _restManualUntil) _restPanManual = null;
        else { applyRestPan(_restPanManual, sc); return; }
      }
      if (typeof focusX !== 'number') focusX = 300;
      let pan;
      if (visible >= 1150) pan = (1150 - visible) / 2;
      else pan = Math.max(0, Math.min(1150 - visible, focusX - visible / 2));
      const _nowRest = performance.now(); const _dtRest = _restPanT ? (_nowRest - _restPanT) : 16; _restPanT = _nowRest;
      applyRestPan(smoothPanStep(_restPanCur, pan, focusX, visible, _dtRest), sc);
    }
    function updateRestStage() {
      ensureRestInterior();
      const stage = document.getElementById('rest-stage');
      if (!stage) return;
      const rooms = document.getElementById('rest-rooms');
      const playerIn = (typeof currentLoc !== 'undefined') && currentLoc === 'restaurant' && !gameState.isCommuting;
      if (playerIn !== _restWasIn) { _restPanManual = null; _restWasIn = playerIn; }
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
      if (cw && playerIn) cw.style.zIndex = (currentState === 'eating') ? '955' : '975'; // v9.18 主角用餐時同客人圖層；v9.20.1 走動/站立時在傢俱前景之上不被切頭
      { // v9.19 主角的菜上桌（餐廳）：開吃後盤子出現在吧台上
        let pp = document.getElementById('player-rest-plate');
        const showP = playerIn && currentState === 'eating' && gameState.eatPhase === 'eat' && gameState.eatServed;
        if (showP && rooms) {
          if (!pp) { pp = document.createElement('div'); pp.id = 'player-rest-plate'; pp.className = 'dish-plate'; rooms.appendChild(pp); }
          pp.style.display = 'block'; pp.style.left = ((gameState.currentX || 440) - 9) + 'px'; pp.style.top = ((gameState.currentY || 184) - 32) + 'px'; pp.style.zIndex = '990'; // v9.20 食物置頂
          const _pe = todaysSpecial().emoji; if (pp.textContent !== _pe) pp.textContent = _pe;
        } else if (pp) pp.style.display = 'none';
      }
      let focus = 300;
      if (playerIn) focus = gameState.currentX || 610;
      else {
        const inner = (gameState.npcs || []).find(n => n.insideLoc === 'restaurant');
        if (inner) focus = inner.x;
      }
      updateRestPan(focus);
    }

    // ================= v9.12 學校鐘聲 / 下課 / 週五榜單結算 =================
    function schoolPhaseNow() {
      const dow = gameState.dayOfWeek;
      if (dow === 6 || dow === 7) return null; // 週末不上課 (1=一 … 5=五)
      const hh = gameState.hour || 0;
      if (hh < 8 || hh >= 16) return null;
      return (gameState.minute || 0) >= 50 ? 'break' : 'class';
    }
    let _schoolPrevPhase = undefined;
    let _bellLastAbsMin = null;
    function ringBell(text) {
      const bell = document.getElementById('school-bell');
      if (bell) { bell.classList.remove('ringing'); void bell.getBBox; bell.classList.add('ringing'); setTimeout(() => bell.classList.remove('ringing'), 1150); }
      if (typeof playSound === 'function') playSound('bell');
      if (text && typeof queueFloatingText === 'function') queueFloatingText(text);
    }
    function checkSchoolBell() {
      const phase = schoolPhaseNow();
      if (!phase) { // v9.23.1 放學後學校淨空：在校內或正要進去的學生（非職員/家長）一律離校
        (gameState.npcs || []).forEach(n => {
          const d = npcDef(n.key);
          if (!d || d.kind === 'staff' || d.kind === 'parent') return;
          if (n.dest !== 'school' && n.insideLoc !== 'school') return;
          n.breakMode = null;
          if (n.insideLoc === 'school' || n.inside) npcExitPath(n); else npcPickTarget(n);
        });
      }
      if (gameState._schoolPrevPhase === 'class' && phase === 'break') { startBreakMoves(); rollPlayerBreak(); }
      const atSchool = typeof currentLoc !== 'undefined' && currentLoc === 'school' && !gameState.isCommuting;
      if (phase === 'break') {
        if (atSchool) {
          gameState._breakAtSchool = true;
          const absMin = (gameState.totalGameDays || 0) * 1440 + (gameState.hour || 0) * 60 + (gameState.minute || 0);
          if (_bellLastAbsMin != null && absMin > _bellLastAbsMin) gameState.stress = Math.max(0, (gameState.stress || 0) - (absMin - _bellLastAbsMin) * 0.5); // 下課放鬆：壓力加速消退
          _bellLastAbsMin = absMin;
        }
      } else _bellLastAbsMin = null;
      if (_schoolPrevPhase !== undefined && phase !== _schoolPrevPhase) {
        if (_schoolPrevPhase === 'class' && phase === 'break') {
          ringBell('🔔 下課鐘響！休息 10 分鐘');
          startBreakMoves();
          rollPlayerBreak(atSchool); // v9.22 主角下課也會去閱讀角（60%）
          (gameState.npcs || []).filter(n => n.state === 'seated' && n.dest === 'school').slice(0, 2).forEach(n => npcSay(n));
        } else if (_schoolPrevPhase === 'break' && phase === 'class') {
          ringBell('🔔 上課鐘響，回到座位');
          endBreakMoves();
          gameState._playerBreak = null; // v9.22
          if (gameState._breakAtSchool && atSchool) {
            gameState.focus = Math.min(100, (gameState.focus || 0) + 10);
            if (typeof queueFloatingText === 'function') queueFloatingText('📝 下課跟同學對了筆記，專注 +10');
          }
          gameState._breakAtSchool = false;
        } else if (_schoolPrevPhase && phase === null && gameState.dayOfWeek === 5) {
          settleBoardWeek();
        }
      }
      if (phase && (((gameState.hour || 0) === 11 && (gameState.minute || 0) >= 50) || (gameState.hour || 0) === 12) && gameState._lunchStamp !== gameState.totalGameDays) {
        gameState._lunchStamp = gameState.totalGameDays;
        gameState._playerBreak = null; // v9.22 午餐出發，主角下課據點作廢
        (gameState.npcs || []).forEach(n => {
          if ((n.dest === 'school' || n.insideLoc === 'school') && (n.kind === 'friend' || n.kind === 'rival' || n.key === 'teacher') && (n.state === 'seated' || n.state === 'idle' || n.state === 'path' || n.state === 'queued')) sendToLunch(n);
        });
      }
      _schoolPrevPhase = phase;
    }
    const BREAK_SPOTS = [ // v9.22 閱讀角據點（右側）：聊天站位×3／看書站位／懶骨頭坐位×2（看書・休息）
      { x: 950, y: 198, mode: 'chat', arrive: 'idle' },
      { x: 1012, y: 198, mode: 'chat', arrive: 'idle' },
      { x: 1085, y: 202, mode: 'chat', arrive: 'idle' },
      { x: 905, y: 208, mode: 'read', arrive: 'idle' },
      { x: 935, y: 246, mode: 'rest', arrive: 'seat' },
      { x: 1065, y: 250, mode: 'read', arrive: 'seat' }
    ];
    const TEACHER_BREAK_SPOTS = [ // v9.22 教師辦公室據點（左側）：辦公桌喝茶（權重×2）／印表機印講義
      { x: 155, y: 152, mode: 'tea', arrive: 'seat' },
      { x: 155, y: 152, mode: 'tea', arrive: 'seat' },
      { x: 252, y: 162, mode: 'print', arrive: 'idle' }
    ];
    const BREAK_CHAT_LINES = ['昨天的卡通超好看！', '等一下要不要去福利社？', '我跟你說喔…', '下節課要小考欸', '你午餐想吃什麼？', '假日我去打球了', '這本漫畫超推！', '老師剛剛講的我有聽懂'];
    const BREAK_CHAT_REPLIES = ['真的假的！', '好啊好啊', '哈哈哈', '我也是！', '蛤～真的喔', '借我看！', '讚喔'];
    function spawnNpcPop(npc, emoji) {
      const el = document.getElementById('npc-' + npc.key);
      const layer = el && el.parentNode;
      if (!layer) return;
      const pop = document.createElement('div');
      pop.className = 'pick-pop';
      pop.textContent = emoji;
      pop.style.left = (npc.x - 8) + 'px'; pop.style.top = (npc.y - 70) + 'px';
      layer.appendChild(pop);
      setTimeout(() => { if (pop.parentNode) pop.parentNode.removeChild(pop); }, 2000);
    }
    const TEACHER_ROAM_POINTS = [ { x: 575, y: 168 }, { x: 510, y: 216 }, { x: 672, y: 216 }, { x: 368, y: 218 }, { x: 790, y: 218 } ]; // v9.25 老師巡堂點（教室前方＋走道）
    const TEACHER_ROAM_LINES = ['都坐好，老師看一下', '嗯，這組很認真', '安靜一點點就好', '有問題舉手問老師', '寫完的先檢查一遍'];
    function tickBreakAmbiance(npc, progressMinutes) {
      if (typeof schoolPhaseNow !== 'function' || schoolPhaseNow() !== 'break') return;
      npc.breakActCd = (npc.breakActCd == null ? 1 + Math.random() * 3 : npc.breakActCd) - progressMinutes;
      if (npc.breakActCd > 0) return;
      npc.breakActCd = 3 + Math.random() * 5;
      const mode = npc.breakMode;
      if (mode === 'chat') {
        npcSay(npc, BREAK_CHAT_LINES[Math.floor(Math.random() * BREAK_CHAT_LINES.length)]);
        const partner = (gameState.npcs || []).find(o => o !== npc && o.breakMode === 'chat' && Math.abs(o.x - npc.x) < 140 && Math.abs(o.y - npc.y) < 60);
        if (partner && Math.random() < 0.5) { partner._sayUntil = 0; npcSay(partner, BREAK_CHAT_REPLIES[Math.floor(Math.random() * BREAK_CHAT_REPLIES.length)]); }
      }
      else if (mode === 'read') spawnNpcPop(npc, '📖');
      else if (mode === 'rest') spawnNpcPop(npc, '💤');
      else if (mode === 'tea') spawnNpcPop(npc, '☕');
      else if (mode === 'print') spawnNpcPop(npc, '📄');
    }
    function freeBreakSpotIdx() { // v9.24 下課據點空位：別人（含主角）占著的不能再選，大家四散不疊在一起
      const taken = new Set();
      (gameState.npcs || []).forEach(n => { if (n.breakHome && n._breakSpotIdx != null) taken.add(n._breakSpotIdx); });
      if (gameState._playerBreak && gameState._playerBreakSpotIdx != null) taken.add(gameState._playerBreakSpotIdx);
      const free = [];
      BREAK_SPOTS.forEach((s, i) => { if (!taken.has(i)) free.push(i); });
      return free.length ? free[Math.floor(Math.random() * free.length)] : -1;
    }
    function rollPlayerBreak(atSchool) {
      gameState._playerBreak = null;
      if (!atSchool) return;
      if (Math.random() > 0.6) return; // 40% 留在座位上休息
      const bi = freeBreakSpotIdx();
      if (bi < 0) return; // 閱讀角滿了就留在座位
      const bs = BREAK_SPOTS[bi];
      gameState._playerBreakSpotIdx = bi;
      gameState._playerBreak = { x: bs.x + Math.round(Math.random() * 10 - 5), y: bs.y, mode: bs.mode };
    }
    function startBreakMoves() {
      (gameState.npcs || []).forEach(n => {
        if (n.dest !== 'school' || n.state !== 'seated') return;
        const isTeacher = n.key === 'teacher';
        if (!isTeacher && n.kind === 'staff') return;
        if (isTeacher) {
          const spot = TEACHER_BREAK_SPOTS[Math.floor(Math.random() * TEACHER_BREAK_SPOTS.length)];
          n.breakHome = { x: npcDef('teacher').spot.x, y: npcDef('teacher').spot.y, arrive: 'post' };
          n.breakMode = spot.mode; n.breakActCd = 1 + Math.random() * 3;
          n.path = [{ x: spot.x, y: spot.y }]; n.arrive = spot.arrive; n.state = 'path';
          return;
        }
        if (Math.random() > 0.7) return; // 70% 同學起身去閱讀角，30% 留在座位
        const bi = freeBreakSpotIdx();
        if (bi < 0) return; // 閱讀角滿了就留在座位
        const bs = BREAK_SPOTS[bi];
        const spot = { x: bs.x + Math.round(Math.random() * 10 - 5), y: bs.y, mode: bs.mode, arrive: bs.arrive };
        n._breakSpotIdx = bi;
        n.breakHome = { x: n.x, y: n.y, arrive: 'seat' };
        n.breakMode = spot.mode; n.breakActCd = 1 + Math.random() * 3;
        n.path = [{ x: spot.x, y: spot.y }]; n.arrive = spot.arrive; n.state = 'path';
      });
    }
    function endBreakMoves() {
      if ((gameState.hour || 0) === 12) return; // 午休直接接著去食堂，不回座
      (gameState.npcs || []).forEach(n => {
        if (!n.breakHome) return;
        n.path = [{ x: n.breakHome.x, y: n.breakHome.y }]; n.arrive = n.breakHome.arrive; n.state = 'path'; n.breakHome = null; n.breakMode = null; n._breakSpotIdx = null;
      });
    }
    function sendToLunch(npc) { // v9.24 直接送去餐廳座位（舊版只送到街上再重選、又漏了餐廳正門，學生會在街上亂晃）
      npc.breakHome = null; npc.breakMode = null; npc._breakSpotIdx = null;
      npc._lunchForce = gameState.totalGameDays;
      npcFreeSeat(npc);
      npc.dest = 'restaurant';
      const lseat = npcRequestSeat(npc, 'restaurant');
      if (lseat) { npc.path = [...npcExitPrefix(npc), { x: NPC_DOOR_X.restaurant, y: NPC_STREET_Y }, INTERIORS.restaurant.doorIn, lseat]; npc.arrive = 'seat'; npc.state = 'path'; }
      else npcEnqueue(npc, 'restaurant');
      return;
      npcFreeSeat(npc);
      if (npc.insideLoc && INTERIORS[npc.insideLoc]) npc.path = [INTERIORS[npc.insideLoc].doorOut, { x: NPC_DOOR_X.school, y: NPC_STREET_Y }]; // v9.22 室內的人走教室正門出去
      else npc.path = [{ x: NPC_DOOR_X.school, y: NPC_DOOR_Y }, { x: NPC_DOOR_X.school, y: NPC_STREET_Y }];
      npc.arrive = 'street'; npc.state = 'path';
    }
    function settleBoardWeek() {
      if (typeof boardRows !== 'function') return;
      const rows = boardRows();
      const myRank = rows.findIndex(r => r.you);
      const SCHOLARSHIP = [150, 80, 40, 0]; // v9.12.1 每週競賽獎學金
      const amt = myRank >= 0 ? SCHOLARSHIP[myRank] : 0;
      if (typeof queueFloatingText === 'function') {
        if (amt > 0) queueFloatingText(`🎓 本週競賽第 ${myRank + 1} 名，獎學金 $${amt}！`);
        else queueFloatingText(`🎓 本週競賽第 ${myRank + 1} 名，沒有獎學金，下週加油！`);
      }
      if (amt > 0) {
        gameState.money = (gameState.money || 0) + amt;
        if (myRank === 0) gameState.boardWins = (gameState.boardWins || 0) + 1;
        if (typeof playSound === 'function') playSound('levelUp');
      }
      // 新一週：宿敵進度重置，你的競賽進度從本週起算
      if (typeof ensureRivals === 'function') ensureRivals().forEach(r => { r.prog = 4 + Math.round(Math.random() * 10); });
      if (typeof playerGradeProgress === 'function') gameState._weekBaseProg = playerGradeProgress();
      gameState._rivalLeader = null;
      if (typeof renderBoard === 'function') renderBoard();
      if (typeof renderRivals === 'function') renderRivals();
    }

    // ================= v9.12.3 教室時鐘 + 黑板節次 =================
    const PERIODS = { 8: ['第一節・國語', '📚 國語課', '子曰：學而時習之'], 9: ['第二節・數學', '🔢 數學課', '3.14 × r² = 圓面積'], 10: ['第三節・英文', '🔤 English', 'Study hard!'], 11: ['第四節・自然', '🔬 自然課', 'H2O = 水的化學式'], 13: ['第五節・社會', '🌏 社會課', '臺灣 • 我們的家鄉'], 14: ['第六節・數學', '🔢 數學課', 'a² + b² = c²'], 15: ['第七節・國語', '📚 國語課', '讀書百遍，其義自見'] };
    let _boardSig = '';
    function updateSchoolBoard() {
      const hh = gameState.hour || 0, mm = gameState.minute || 0;
      const phase = schoolPhaseNow();
      const sig = phase + '|' + hh + '|' + Math.floor(mm);
      if (sig === _boardSig) return;
      _boardSig = sig;
      const ch = document.getElementById('clock-h'), cm = document.getElementById('clock-m');
      if (ch && cm) {
        ch.setAttribute('transform', `rotate(${(((hh % 12) + mm / 60) * 30).toFixed(1)} 36 50)`);
        cm.setAttribute('transform', `rotate(${((mm % 60) * 6).toFixed(1)} 36 50)`);
      }
      const M = document.getElementById('bb-main'), S = document.getElementById('bb-sub'), T = document.getElementById('bb-today');
      if (!M || !S || !T) return;
      if (phase && ((hh === 11 && (gameState.minute || 0) >= 50) || hh === 12)) { M.textContent = '🍱 午休時間'; S.textContent = '吃飽睡好，下午才有精神'; T.textContent = 'LUNCH BREAK'; }
      else if (phase === 'class' && PERIODS[hh]) { const p = PERIODS[hh]; M.textContent = p[1]; S.textContent = p[2]; T.textContent = 'NOW: ' + p[0]; }
      else if (phase === 'break') { const nx = PERIODS[hh + 1]; M.textContent = '☕ 下課 10 分鐘'; S.textContent = '伸個懶腰 • 喝口水'; T.textContent = nx ? 'NEXT: ' + nx[0] : 'NEXT: 放學囉'; }
      else { M.textContent = '📚 天道酬勤 • 必上第一志願！'; S.textContent = 'E = mc²  |  100% PASS'; T.textContent = 'TODAY: CHINESE & MATH'; }
    }
