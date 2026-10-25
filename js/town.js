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
      { key: 'teacher', kind: 'staff', name: '王老師', homeX: 940, speed: 62, palette: { hair: '#2c1810', outfit: '#2c3e50', shorts: '#2c3e50' }, work: 'school', spot: { x: 1112, y: 145 }, shift: { days: 'weekday', start: 480, end: 960 }, say: ['「上課認真！」', '「這題考試會考。」'] },
      { key: 'clerk', kind: 'staff', name: '小惠', homeX: 1550, speed: 60, palette: { hair: '#3c2415', outfit: '#2ed573', shorts: '#2c3e50' }, work: 'store', spot: { x: 520, y: 150 }, shift: { days: 'daily', start: 480, end: 1320 }, say: ['「叮咚！歡迎光臨！」', '「關東煮很好吃喔！」'] },
      { key: 'librarian', kind: 'staff', name: '小林', homeX: 780, speed: 60, palette: { hair: '#1a1a24', outfit: '#2980b9', shorts: '#2c3e50' }, work: 'library', spot: { x: 1330, y: 150 }, shift: { days: 'daily', start: 480, end: 1260 }, say: ['「請保持安靜喔。」', '「這本書很推薦！」'] },
      { key: 'chef', kind: 'staff', name: '阿火師', homeX: 1090, speed: 62, palette: { hair: '#1a1a24', outfit: '#ffffff', shorts: '#2c3e50' }, work: 'restaurant', spot: { x: 875, y: 150 }, shift: { days: 'daily', start: 420, end: 1320 }, say: ['「拉麵現煮中！」', '「鐵板燒好了！」'] },
      { key: 'coach', kind: 'staff', name: '阿力', homeX: 1370, speed: 85, palette: { hair: '#3c2415', outfit: '#e74c3c', shorts: '#2c3e50' }, work: 'gym', spot: { x: 1610, y: 150 }, shift: { days: 'daily', oncall: true }, say: ['「跑起來！」', '「再兩圈！」'] },
      { key: 'clerk2', kind: 'staff', name: '阿哲', homeX: 1690, speed: 60, palette: { hair: '#2c1810', outfit: '#8e44ad', shorts: '#2c3e50' }, work: 'store', spot: { x: 590, y: 150 }, shift: { days: 'daily', start: 1320, end: 480 }, say: ['「大夜班，歡迎光臨。」', '「關東煮還有喔。」'] },
      { key: 'dad', kind: 'parent', name: '爸爸', speed: 60, palette: { hair: '#2c1810', outfit: '#2c3e50', shorts: '#2c3e50' }, sleepSpot: { x: 135, y: 158 }, homeSpot: { x: 230, y: 175 }, say: ['「早點睡，別熬夜。」', '「考試加油！」'] },
      { key: 'mom', kind: 'parent', name: '媽媽', speed: 60, palette: { hair: '#7b4b94', outfit: '#c0392b', shorts: '#2c3e50' }, sleepSpot: { x: 160, y: 180 }, homeSpot: { x: 270, y: 175 }, say: ['「飯煮好了，快來吃。」', '「天冷了多穿點。」'] },
    ];
    const NPC_STREET_Y = 300;
    const NPC_DOOR_Y = 240;
    const NPC_HOUSE_Y = 505;
    const NPC_PARK_Y = 440;
    const NPC_DOOR_X = { home: 175, store: 485, restaurant: 795, school: 1105, library: 1415, gym: 1732 };
    // 玩家專屬位子：座位池永遠保留，NPC 絕不坐上去跟玩家重疊
    const PLAYER_RESERVED = { school: { x: 1062, y: 195 }, library: { x: 1327, y: 195 }, restaurant: { x: 750, y: 190 }, store: { x: 555, y: 185 }, gym: { x: 1652, y: 75 } };
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
      if (!fx) {
        fx = document.createElement('div');
        fx.id = 'teppan-fx';
        fx.innerHTML = '<span class="flame">🔥</span><span class="steam-puff sp1"></span><span class="steam-puff sp2"></span><span class="steam-puff sp3"></span>';
        island.appendChild(fx);
      }
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
    const NPC_SEAT_POOLS = {
      school: { activity: 'study', grid: [[994, 195], [1028, 195], [1096, 195], [1130, 195], [1164, 195], [1198, 195], [1232, 195]] },
      library: { activity: 'study', grid: [[1290, 195], [1330, 195], [1370, 195], [1410, 195], [1450, 195], [1490, 195], [1530, 195]] },
      restaurant: { activity: 'dine', grid: [[710, 190], [750, 190], [790, 190], [830, 190], [870, 190], [910, 190]] },
      store: { activity: 'browse', grid: [[390, 190], [430, 190], [470, 190], [510, 190], [550, 190], [590, 190], [630, 190]] },
      gym: { activity: 'sport', grid: [[1680, 100], [1730, 100], [1780, 100], [1830, 100], [1700, 140], [1800, 140]] },
    };
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
        npc.path = [{ x: NPC_DOOR_X[building], y: NPC_STREET_Y }, seat];
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
      const ok = Array.isArray(gameState.npcs) && gameState.npcs.length === NPC_DEFS.length
        && NPC_DEFS.every((d, i) => gameState.npcs[i] && gameState.npcs[i].key === d.key && gameState.npcs[i].kind === d.kind);
      if (ok) return gameState.npcs;
      gameState.npcs = NPC_DEFS.map((d, i) => {
        if (d.kind === 'parent') return { key: d.key, kind: d.kind, x: d.sleepSpot.x, y: d.sleepSpot.y, state: 'sleeping', dest: 'home', path: [], arrive: '', dwell: 0, dir: 1, seatIdx: null, queueFor: '', queueWait: 0, orderLeft: 0 };
        if (d.kind === 'rival' || d.kind === 'staff') return { key: d.key, kind: d.kind, x: d.homeX, y: NPC_HOUSE_Y, state: 'sleeping', dest: 'home', path: [], arrive: '', dwell: 0, dir: 1, seatIdx: null, queueFor: '', queueWait: 0, orderLeft: 0 };
        return { key: d.key, kind: d.kind, x: 300 + i * 240, y: NPC_STREET_Y, state: 'path', dest: '', path: [], arrive: '', dwell: 0, dir: 1, seatIdx: null, queueFor: '', queueWait: 0, orderLeft: 0 };
      });
      gameState.npcs.forEach(n => { if (npcDef(n.key).kind === 'friend') npcPickTarget(n); });
      return gameState.npcs;
    }
    function npcPickTarget(npc) {
      const def = npcDef(npc.key);
      const hour = gameState.hour || 0;
      if (npc._lunchForce === gameState.totalGameDays && hour === 12) { // v9.12.7 午餐強制食堂
        npc._lunchForce = null;
        npc.dest = 'restaurant';
        const lseat = npcRequestSeat(npc, 'restaurant');
        if (lseat) { npc.path = [{ x: NPC_DOOR_X.restaurant, y: NPC_STREET_Y }, lseat]; npc.arrive = 'seat'; npc.state = 'path'; }
        else npcEnqueue(npc, 'restaurant');
        return 'restaurant';
      }
      const dow = gameState.dayOfWeek || 1;
      const weekend = (dow === 6 || dow === 7);
      let dest;
      if (def.kind === 'parent') {
        if (hour >= 22 || hour < 7) {
          npc.dest = 'home';
          npc.path = [{ x: NPC_DOOR_X.home, y: NPC_STREET_Y }, { x: NPC_DOOR_X.home, y: NPC_DOOR_Y }, def.sleepSpot];
          npc.arrive = 'sleep'; npc.state = 'path'; return 'home';
        } else if (hour >= 19) {
          npc.dest = 'home';
          npc.path = [{ x: NPC_DOOR_X.home, y: NPC_STREET_Y }, { x: NPC_DOOR_X.home, y: NPC_DOOR_Y }, def.homeSpot];
          npc.arrive = 'athome'; npc.state = 'path'; return 'home';
        } else {
          npc.dest = 'away';
          npc.path = [{ x: NPC_DOOR_X.home, y: NPC_DOOR_Y }, { x: NPC_DOOR_X.home, y: NPC_STREET_Y }, { x: npc.x < 960 ? -80 : 2000, y: NPC_STREET_Y }];
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
        else if (hour >= 23 || hour < 7) dest = 'home';
        else dest = 'park';
        if (dest === 'work') {
          npc.dest = def.work;
          npc.path = [{ x: NPC_DOOR_X[def.work], y: NPC_STREET_Y }, def.spot];
          npc.arrive = 'seat'; npc.state = 'path'; return dest;
        } else if (dest === 'home') {
          npc.dest = 'home';
          npc.path = [{ x: def.homeX, y: NPC_STREET_Y }, { x: def.homeX, y: NPC_HOUSE_Y }];
          npc.arrive = 'sleep'; npc.state = 'path'; return dest;
        } else {
          const px = 200 + Math.floor(Math.random() * 1550);
          npc.dest = 'park';
          npc.path = [{ x: px, y: NPC_STREET_Y }, { x: px, y: NPC_PARK_Y }];
          npc.arrive = 'idle'; npc.state = 'path'; return dest;
        }
      }
      if (def.kind === 'rival') {
        if (hour >= 23 || hour < 7) dest = 'home';
        else if (weekend) dest = ['library', 'gym', 'restaurant', 'store'][Math.floor(Math.random() * 4)];
        else if (hour >= 8 && hour < 16) dest = 'school';
        else if (hour >= 17 && hour < 21) dest = 'library';
        else dest = ['restaurant', 'store', 'gym'][Math.floor(Math.random() * 3)];
      } else {
        if (hour >= 23 || hour < 7) dest = 'away';
        else {
          const pool = [...def.spots, 'park', 'park'];
          dest = pool[Math.floor(Math.random() * pool.length)];
        }
      }
      npc.dest = dest;
      if (dest === 'home') {
        npc.path = [{ x: def.homeX, y: NPC_STREET_Y }, { x: def.homeX, y: NPC_HOUSE_Y }];
        npc.arrive = 'sleep';
      } else if (dest === 'away') {
        npc.path = [{ x: npc.x < 960 ? -80 : 2000, y: NPC_STREET_Y }];
        npc.arrive = 'away';
      } else if (dest === 'park') {
        const px = 200 + Math.floor(Math.random() * 1550);
        npc.path = [{ x: px, y: NPC_STREET_Y }, { x: px, y: NPC_PARK_Y }];
        npc.arrive = 'idle';
      } else {
        const seat = npcRequestSeat(npc, dest);
        if (seat) {
          npc.path = [{ x: NPC_DOOR_X[dest], y: NPC_STREET_Y }, seat];
          npc.arrive = 'seat';
        } else {
          npcEnqueue(npc, dest);
          return dest;
        }
      }
      npc.state = 'path';
      return dest;
    }
    function npcExitPath(npc) {
      const prevDest = npc.dest;
      npcFreeSeat(npc);
      if (npc.dest && NPC_DOOR_X[npc.dest]) {
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
          el.innerHTML = `<span class="npc-name">${d.name}</span><span class="npc-zzz-tag" style="display:none;">💤</span><span class="npc-flip"></span><span class="npc-dish" style="display:none;"></span>`;
          el.querySelector('.npc-flip').appendChild(svg);
          el.addEventListener('click', () => npcSay(gameState.npcs.find(n => n.key === d.key)));
          layer.appendChild(el);
        });
      }
      if (!document.getElementById('npc-houses')) {
        const wrap = document.createElement('div');
        wrap.id = 'npc-houses';
        NPC_DEFS.filter(d => d.kind === 'rival' || d.kind === 'staff').forEach(d => {
          const h = document.createElement('div');
          h.className = 'npc-house';
          h.style.left = d.homeX + 'px';
          h.style.top = NPC_HOUSE_Y + 'px';
          h.innerHTML = `<span class="npc-house-emoji">🏠</span><span class="npc-house-name">${d.name}的家</span><span class="npc-zzz" id="npc-zzz-${d.key}" style="display:none;">💤</span>`;
          wrap.appendChild(h);
        });
        map.appendChild(wrap);
      }
    }
    // v9.12.2 講台前景層：蓋在 NPC 圖層之上，王老師站上去時下半身被講桌遮住（站在講台後面）
    function ensurePodiumFg() {
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
    function npcSay(npc) {
      if (!npc || npc.state === 'away' || npc.state === 'sleeping') return;
      if (npc._sayUntil && Date.now() < npc._sayUntil) return;
      npc._sayUntil = Date.now() + 3000;
      const def = npcDef(npc.key);
      const layer = document.getElementById('npc-layer');
      if (!layer) return;
      const bubble = document.createElement('div');
      bubble.className = 'npc-speech';
      bubble.style.left = npc.x + 'px';
      bubble.style.top = (npc.y - 78) + 'px';
      bubble.textContent = def.say[Math.floor(Math.random() * def.say.length)];
      layer.appendChild(bubble);
      setTimeout(() => bubble.remove(), 2600);
    }
    function updateNPCs(progressMinutes) {
      const npcs = ensureNPCs();
      ensureSeats();
      buildNPCLayer();
      ensurePodiumFg();
      const hour = gameState.hour || 0;
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
        if (playerWaiting) { target = 'player'; serveSpot = { x: 750, y: 145 }; }
        else {
          const diner = npcs.find(n => n.key !== 'chef' && n.state === 'seated' && n.dest === 'restaurant' && n.phase === 'wait');
          if (diner) { target = diner.key; serveSpot = { x: diner.x, y: diner.y - 45 }; }
        }
        if (target) { chef.busy = target; chef.state = 'path'; chef.path = [serveSpot]; chef.arrive = 'serve'; }
      }
      const teppanFx = ensureTeppanFx();
      if (teppanFx) { const _to = ORDERS_PENDING ? '1' : '0'; if (teppanFx.style.opacity !== _to) teppanFx.style.opacity = _to; }
      updateSpecialSign();
      npcs.forEach(npc => {
        const def = npcDef(npc.key);
        const step = def.speed * progressMinutes;
        if (npc.state === 'path') {
          const wp = npc.path[0];
          if (!wp) { npcPickTarget(npc); }
          else {
            let arrived = false;
            if (npc.x !== wp.x) {
              const d = wp.x - npc.x;
              if (Math.abs(d) <= step) npc.x = wp.x; else { npc.x += Math.sign(d) * step; npc.dir = Math.sign(d); }
            } else if (npc.y !== wp.y) {
              const d = wp.y - npc.y;
              if (Math.abs(d) <= step) npc.y = wp.y; else npc.y += Math.sign(d) * step;
            } else arrived = true;
            if (arrived) {
              npc.path.shift();
              if (npc.path.length === 0) {
                if (npc.arrive === 'seat') {
                  npc.state = 'seated';
                  if (npc.kind === 'staff' && npc.dest === def.work) {
                    const sh = def.shift;
                    if (sh.oncall) npc.dwell = 9999;
                    else {
                      const nowM = (gameState.hour || 0) * 60 + (gameState.minute || 0);
                      npc.dwell = Math.max(30, sh.end >= nowM ? sh.end - nowM : sh.end + 1440 - nowM);
                    }
                  } else npc.dwell = 30 + Math.random() * 60; // v9.12.7 staff 在別棟當客人（老師午餐）比照一般客人
                  if (npc.dest === 'restaurant' && npc.key !== 'chef') { npc.phase = 'order'; npc.orderLeft = 3; }
                }
                else if (npc.arrive === 'sleep') npc.state = 'sleeping';
                else if (npc.arrive === 'away') npc.state = 'away';
                else if (npc.arrive === 'idle') { npc.state = 'idle'; npc.dwell = 20 + Math.random() * 40; }
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
            if (schoolPhaseNow() === 'break') { const sp2 = BREAK_SPOTS[Math.floor(Math.random() * BREAK_SPOTS.length)]; npc.path = [sp2]; npc.arrive = 'idle'; npc.state = 'path'; }
            else npc.dwell = 2; // 等鐘聲監看器送回座位
          }
        } else if (npc.state === 'seated' || npc.state === 'idle') {
          if (npc.state === 'seated' && npc.seatIdx != null && SEAT_MAP[npc.dest] && SEAT_MAP[npc.dest][npc.seatIdx] && !SEAT_MAP[npc.dest][npc.seatIdx].who) {
            SEAT_MAP[npc.dest][npc.seatIdx].who = npc.key;
          }
          if (npc.state === 'seated' && npc.dest === 'restaurant' && npc.key !== 'chef') {
            if (npc.phase === 'order') { npc.orderLeft = Math.max(0, (npc.orderLeft || 0) - progressMinutes); if (npc.orderLeft <= 0) { npc.phase = 'wait'; npc.waitLeft = 6; } }
            else if (npc.phase === 'wait') { npc.waitLeft = Math.max(0, (npc.waitLeft || 0) - progressMinutes); if (npc.waitLeft <= 0) npc.phase = 'eat'; }
          }
          npc.dwell -= progressMinutes;
          if (npc.dwell <= 0) npcExitPath(npc);
        } else if (npc.state === 'queue') {
          npc.queueWait += progressMinutes;
          if (QUEUES[npc.queueFor] && QUEUES[npc.queueFor][0] === npc.key) {
            const seat = npcRequestSeat(npc, npc.queueFor);
            if (seat) {
              QUEUES[npc.queueFor].shift();
              npc.path = [{ x: NPC_DOOR_X[npc.queueFor], y: NPC_STREET_Y }, seat];
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
            if (hour >= 19) npcPickTarget(npc);
          } else if (hour >= 7 && hour < 23) {
            npc.x = npc.x < 960 ? -60 : 1980; npc.y = NPC_STREET_Y; npcPickTarget(npc);
          }
        }
        const el = document.querySelector('#npc-layer #npc-' + npc.key);
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
          el.classList.toggle('seated', npc.state === 'seated' && npc.dest === 'restaurant');
          el.classList.toggle('on-break', npc.state === 'seated' && npc.dest === 'school' && typeof schoolPhaseNow === 'function' && schoolPhaseNow() === 'break');
          el.style.zIndex = String(Math.round(npc.y)); // v9.12.3 依深度排序：前方人物蓋後方
          const tag = el.querySelector('.npc-zzz-tag');
          if (tag) tag.style.display = npc.state === 'sleeping' ? 'inline' : 'none';
          const dishEl = el.querySelector('.npc-dish');
          if (dishEl) {
            if (npc.state === 'seated' && npc.dest === 'restaurant') {
              if (dishEl.style.display !== 'block') dishEl.style.display = 'block';
              const _dt = npc.phase === 'eat' ? todaysSpecial().emoji : (npc.phase === 'wait' ? '🍳' : '📋');
              if (dishEl.textContent !== _dt) dishEl.textContent = _dt;
            } else if (dishEl.style.display !== 'none') dishEl.style.display = 'none';
          }
        }
        if (def.kind === 'rival' || def.kind === 'staff') {
          const zzz = document.getElementById('npc-zzz-' + npc.key);
          if (zzz) zzz.style.display = npc.state === 'sleeping' ? 'inline' : 'none';
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
        const sb = document.createElement('div');
        sb.id = 'store-beacon';
        map.appendChild(sb);
        const sw = document.createElement('div');
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
    let _skyEls = null, _skyLastKey = '';
    function updateSkyLighting() {
      if (!_skyEls) {
        buildSkyLayer();
        _skyEls = {
          sn: document.getElementById('sky-night'), sw: document.getElementById('sky-warm'),
          sb: document.getElementById('store-beacon'), sg: document.getElementById('street-glows'),
          glows: [...document.querySelectorAll('.island-glow')],
        };
        if (!_skyEls.sn) _skyEls = null;
      }
      if (!_skyEls) return;
      const hf = (gameState.hour || 0) + (gameState.minute || 0) / 60;
      const nf = nightFactorAt(hf);
      const wf = warmFactorAt(hf);
      const key = Math.round(nf * 40) + '|' + Math.round(wf * 40);
      if (key === _skyLastKey) return; // v9.10.4: 值沒變就不寫 style (減少每 tick 的版面重算，鏡頭更順)
      _skyLastKey = key;
      const r3 = v => String(Math.round(v * 1000) / 1000);
      _skyEls.sn.style.opacity = r3(nf * 0.9);
      _skyEls.sw.style.opacity = r3(wf);
      _skyEls.glows.forEach(g => { g.style.opacity = r3(nf * (g.dataset.store ? 1 : 0.75)); });
      _skyEls.sb.style.opacity = r3(nf);
      _skyEls.sg.style.opacity = r3(nf * 0.85);
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
          (gameState.npcs || []).filter(n => n.state === 'seated' && n.dest === 'school').slice(0, 2).forEach(n => npcSay(n));
        } else if (_schoolPrevPhase === 'break' && phase === 'class') {
          ringBell('🔔 上課鐘響，回到座位');
          endBreakMoves();
          if (gameState._breakAtSchool && atSchool) {
            gameState.focus = Math.min(100, (gameState.focus || 0) + 10);
            if (typeof queueFloatingText === 'function') queueFloatingText('📝 下課跟同學對了筆記，專注 +10');
          }
          gameState._breakAtSchool = false;
        } else if (_schoolPrevPhase && phase === null && gameState.dayOfWeek === 5) {
          settleBoardWeek();
        }
      }
      if (phase && (gameState.hour || 0) === 12 && gameState._lunchStamp !== gameState.totalGameDays) {
        gameState._lunchStamp = gameState.totalGameDays;
        (gameState.npcs || []).forEach(n => {
          if (n.dest === 'school' && (n.kind === 'friend' || n.kind === 'rival' || n.key === 'teacher') && (n.state === 'seated' || n.state === 'idle' || (n.state === 'path' && n.breakHome))) sendToLunch(n);
        });
      }
      _schoolPrevPhase = phase;
    }
    const BREAK_SPOTS = [{ x: 1010, y: 202 }, { x: 1075, y: 204 }, { x: 1150, y: 204 }, { x: 1220, y: 202 }, { x: 985, y: 168 }];
    function startBreakMoves() {
      (gameState.npcs || []).forEach(n => {
        if (n.dest !== 'school' || n.state !== 'seated') return;
        const isTeacher = n.key === 'teacher';
        if (!isTeacher && n.kind === 'staff') return;
        if (!isTeacher && Math.random() > 0.7) return; // 70% 同學起身活動筋骨
        const spot = BREAK_SPOTS[Math.floor(Math.random() * BREAK_SPOTS.length)];
        n.breakHome = isTeacher ? { x: npcDef('teacher').spot.x, y: npcDef('teacher').spot.y, arrive: 'post' } : { x: n.x, y: n.y, arrive: 'seat' };
        n.path = [spot]; n.arrive = 'idle'; n.state = 'path';
      });
    }
    function endBreakMoves() {
      if ((gameState.hour || 0) === 12) return; // 午休直接接著去食堂，不回座
      (gameState.npcs || []).forEach(n => {
        if (!n.breakHome) return;
        n.path = [{ x: n.breakHome.x, y: n.breakHome.y }]; n.arrive = n.breakHome.arrive; n.state = 'path'; n.breakHome = null;
      });
    }
    function sendToLunch(npc) {
      npc.breakHome = null;
      npc._lunchForce = gameState.totalGameDays;
      npcFreeSeat(npc);
      npc.path = [{ x: NPC_DOOR_X.school, y: NPC_DOOR_Y }, { x: NPC_DOOR_X.school, y: NPC_STREET_Y }];
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
      if (phase === 'class' && hh === 12) { M.textContent = '🍱 午休時間'; S.textContent = '吃飽睡好，下午才有精神'; T.textContent = 'LUNCH BREAK'; }
      else if (phase === 'class' && PERIODS[hh]) { const p = PERIODS[hh]; M.textContent = p[1]; S.textContent = p[2]; T.textContent = 'NOW: ' + p[0]; }
      else if (phase === 'break') { const nx = PERIODS[hh + 1]; M.textContent = '☕ 下課 10 分鐘'; S.textContent = '伸個懶腰 • 喝口水'; T.textContent = nx ? 'NEXT: ' + nx[0] : 'NEXT: 放學囉'; }
      else { M.textContent = '📚 天道酬勤 • 必上第一志願！'; S.textContent = 'E = mc²  |  100% PASS'; T.textContent = 'TODAY: CHINESE & MATH'; }
    }
