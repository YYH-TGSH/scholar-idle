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
          if (decor >= i) { b.innerHTML = icoSvg('check') + ' 已完成'; b.disabled = true; }
          else if (decor === i - 1) { b.textContent = `$${HOME_DECOR_TIERS[i].price} 裝潢`; b.disabled = false; }
          else { b.innerHTML = icoSvg('lock') + ' 先完成前一階'; b.disabled = true; }
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

    // v9.33 建築 Combo：兩棟地標都升到指定等級 → 永久連動效果。建設面板明示條件與狀態，文案與公式一致（不再是隱藏規則）
    const TOWN_COMBOS = [
      { a: 'school', aLv: 3, b: 'library', bLv: 3, name: '🎓 學術特區', desc: '讀書效率 +10%' },
      { a: 'store', aLv: 3, b: 'restaurant', bLv: 3, name: '🍜 美食商圈', desc: '打工時薪 +15%' },
      { a: 'gym', aLv: 3, b: 'home', bLv: 3, name: '💪 健康生活', desc: '睡眠精力恢復 +15%' },
      { a: 'school', aLv: 3, b: 'gym', bLv: 2, name: '🏅 文武雙全', desc: '考試預估 +3 分' }
    ];
    const LANDMARK_NAMES = { home: '住家', store: '超商', restaurant: '餐廳', school: '學校', library: '圖書館', gym: '操場' };
    function townComboActive(c) { return getLandmarkLevel(c.a) >= c.aLv && getLandmarkLevel(c.b) >= c.bLv; }
    function getComboStudyMult() { return townComboActive(TOWN_COMBOS[0]) ? 1.10 : 1; }
    function getComboWageMult() { return townComboActive(TOWN_COMBOS[1]) ? 1.15 : 1; }
    function getComboSleepMult() { return townComboActive(TOWN_COMBOS[2]) ? 1.15 : 1; }
    function getComboExamBonus() { return townComboActive(TOWN_COMBOS[3]) ? 3 : 0; }
    function renderTownCombos() {
      const el = document.getElementById('town-combos');
      if (!el) return;
      el.innerHTML = '<div style="font-weight:900; font-size:0.85rem; margin-bottom:6px;">🔗 建築連動 Combo</div>' + TOWN_COMBOS.map(c => {
        const on = townComboActive(c);
        return `<div style="display:flex; justify-content:space-between; gap:8px; padding:5px 8px; margin-bottom:5px; border-radius:8px; background:${on ? '#f7f1e3' : '#f5f0e6'}; border:1.5px solid ${on ? '#85c173' : '#e8d8a8'};"><span><b>${c.name}</b> <span style="color:var(--muted); font-size:0.75rem;">${LANDMARK_NAMES[c.a]} Lv.${c.aLv}＋${LANDMARK_NAMES[c.b]} Lv.${c.bLv}</span><br><span style="font-size:0.78rem;">${c.desc}</span></span><span style="font-weight:900; color:${on ? '#1e8449' : '#9a8d7a'};">${on ? '✓ 已啟用' : '未啟用'}</span></div>`;
      }).join('');
    }

    function renderBuildDrawer() {
      const listEl = document.getElementById("build-island-list");
      if (!listEl) return;
      renderTownCombos();
      const totalStars = getTownProsperityTotal();

      // 總覽評級
      let title = `初興小鎮 (${totalStars}★)`;
      let perks = "每日小鎮紅利：尚未解鎖（島嶼累計達 10★ 解鎖）";
      if (totalStars >= 18) {
        title = `傳奇宇宙學霸城 (18★ MAX)`;
        perks = "每日小鎮紅利 +$100、考試合格率永久 +5%、全小遊戲獎金翻倍！";
      } else if (totalStars >= 15) {
        title = `卓越文教城 (${totalStars}★)`;
        perks = "每日小鎮紅利 +$50、全學科學科獲取速度額外 +10%！";
      } else if (totalStars >= 10) {
        title = `繁華聚落 (${totalStars}★)`;
        perks = "每日小鎮紅利 +$20（每日 00:00 自動結算發放）";
      }

      const titleEl = document.getElementById("town-prosperity-title");
      if (titleEl) titleEl.innerHTML = icoSvg('building') + ' ' + title;
      const perksEl = document.getElementById("town-prosperity-perks");
      if (perksEl) perksEl.innerText = perks;
      const starsEl = document.getElementById("town-prosperity-stars");
      if (starsEl) starsEl.innerHTML = icoSvg('star').repeat(Math.min(18, totalStars));
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
                <span style="font-size:0.7rem; color:var(--amber); font-weight:800;">【${cfg.levelNames[curLv - 1]}】</span>
              </div>
              <span class="island-lv-badge ${isMax ? 'is-max' : ''}" style="position:static;">Lv.${curLv} ${isMax ? 'MAX' : ''}</span>
            </div>
            <div class="build-card-desc">
              <div style="color:var(--ink2); font-weight:700; margin-bottom:2px;">當前效果：${cfg.perks[curLv - 1]}</div>
              ${!isMax ? `<div style="color:#0a84ff; font-weight:600;">下級解鎖：${cfg.perks[curLv]}</div>` : '<div style="color:#bf5af2; font-weight:700;">✨ 已達最高級！享受頂級小鎮特權</div>'}
            </div>
            <div class="build-card-footer">
              <div style="font-size:0.76rem; color:var(--muted); font-weight:700;">
                ${isMax ? '🏆 滿星榮譽' : `升級需求: <strong style="color:${canAfford ? '#ff9f0a' : '#ff2d55'};">$${nextCost}</strong>`}
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
      gameState._focusOnArrive = { sleep: 'home', 'study-school': 'school', sports: 'gym', eat: 'restaurant', 'study-library': 'library', work: 'store' }[action] || null; // v9.60：使用者親自派遣＝進場即聚焦（與點膠囊同等待遇，相機補償全路徑覆蓋）

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
        if (type === 'chicken' || type === 'bento') playSound('eat'); // v9.33 新音效

        if (type === 'chicken') {
          gameState.hunger = Math.min(100, gameState.hunger + 65); // v9.32 雞排 $20 不再一鍵全滿（便當 $50 才是全滿）
          gameState.stress = Math.max(0, gameState.stress - 15);
          queueFloatingText("🍗 吃雞排！真香！(飽足+65,壓力-15)");
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
      const PASSIVE_CAPS = { book: 10, shoes: 10, headphone: 5, tablet: 5, sofa: 3, trophy: 3 }; // v9.32 被動裝備上限（報告：原本無上限可無限疊）
      if ((gameState.passive[type] || 0) >= (PASSIVE_CAPS[type] || 99)) { createFloatingText('⚠️ 這項裝備已達購買上限！'); return; }
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

    // v9.32 收藏品（金錢出口）：一次性珍藏＋小幅永久效果 — 後期收入終於有地方去（報告：金錢只進不出）
    const COLLECTIBLES = {
      stamp: { name: '📮 郵票冊', price: 2000 },
      watch: { name: '⌚ 名錶', price: 8000 },
      painting: { name: '🖼️ 名畫', price: 20000 }
    };
    function buyCollectible(id) {
      const def = COLLECTIBLES[id];
      if (!def) return;
      gameState.collectibles = gameState.collectibles || {};
      if (gameState.collectibles[id]) { createFloatingText('已收藏這件珍品了！'); return; }
      const priceMut = typeof getMutationMult === 'function' ? getMutationMult('shop_price') : 1.0;
      const finalCost = Math.round(def.price * priceMut);
      if (gameState.money < finalCost) { createFloatingText(`❌ 零用錢不夠喔！(需 $${finalCost})`); return; }
      playSound('buy');
      gameState.money -= finalCost;
      gameState.totalSpent = (gameState.totalSpent || 0) + finalCost;
      gameState.collectibles[id] = true;
      createFloatingText(`🏆 收藏了${def.name}！(-$${finalCost})`);
      updateUI();
      saveGameData();
    }

    // ================= v9.8 精緻化：座位池＋門口排隊＋全員步行職員＋爸媽 =================
    const NPC_DEFS = [
      { key: 'jie', kind: 'rival', name: '王子傑', homeX: 300, speed: 68, palette: { hair: '#e3ac2e', outfit: '#4a7ca5', shorts: '#46586a', skin: '#fed7aa' }, say: ['「這週的獎學金，我先預約了。」', '「我準備好了，你呢？」'] },
      { key: 'kui', kind: 'rival', name: '陳小葵', homeX: 820, speed: 62, palette: { hair: '#e2a0b4', outfit: '#e0685f', shorts: '#5a5049', skin: '#fed7aa', hairStyle: 'long' }, say: ['「嘻嘻，我好像比較快喔～」', '「我隨時可以考囉！」'] },
      { key: 'shu', kind: 'rival', name: '高大樹', homeX: 1080, speed: 58, palette: { hair: '#2f5d3a', outfit: '#7fa663', shorts: '#2f5d3a', skin: '#c98d54' }, say: ['「一步一腳印，我先到了。」', '「準備完成，等你一起考。」'] },
      { key: 'xiaoxuan', kind: 'friend', name: '林曉萱', speed: 60, palette: { hair: '#2a2320', outfit: '#527fa8', shorts: '#9a6bb5', skin: '#fed7aa', hairStyle: 'long' }, spots: ['school', 'library'], say: ['「一起加油！」', '「今天也要坐第一排！」'] },
      { key: 'dameng', kind: 'friend', name: '陳大猛', speed: 72, palette: { hair: '#3c2415', outfit: '#e67e22', shorts: '#6d4c41', skin: '#d9a066', cap: ['#e67e22', '#e65c00', '#a93226'] }, spots: ['gym', 'restaurant'], say: ['「打完球吃雞排最爽！」', '「要不要一起跑兩圈？」'] },
      { key: 'yuqing', kind: 'friend', name: '蘇語晴', speed: 55, palette: { hair: '#6d4c41', outfit: '#9a6bb5', shorts: '#4a4038', skin: '#f0b98a', hairStyle: 'bun' }, spots: ['library', 'store'], say: ['「圖書館角落最安靜。」', '「送你一句讀書秘訣。」'] },
      { key: 'xiaohao', kind: 'friend', name: '王小豪', speed: 58, palette: { hair: '#3c2415', outfit: '#e67e22', shorts: '#a93226', skin: '#f0b98a', cap: ['#f2b544', '#d98e32', '#ca6f1e'] }, spots: ['restaurant', 'store'], say: ['「這家超好吃！」', '「我請客，別客氣！」'] },
      { key: 'teacher', kind: 'staff', name: '王老師', homeX: 560, speed: 62, palette: { hair: '#6b5d4f', outfit: '#46586a', shorts: '#46586a', skin: '#f0b98a' }, work: 'school', spot: { x: 575, y: 134 }, shift: { days: 'weekday', start: 480, end: 960 }, say: ['「上課認真！」', '「這題考試會考。」'] },
      { key: 'clerk', kind: 'staff', name: '小惠', homeX: 950, speed: 60, palette: { hair: '#3c2415', outfit: '#79a95c', shorts: '#5f7d5a', skin: '#fed7aa', hairStyle: 'bun' }, work: 'store', spot: { x: 880, y: 150 }, shift: { days: 'daily', start: 480, end: 1320 }, say: ['「叮咚！歡迎光臨！」', '「關東煮很好吃喔！」'] },
      { key: 'librarian', kind: 'staff', name: '小林', homeX: 430, speed: 60, palette: { hair: '#2a2320', outfit: '#7d9dbd', shorts: '#4a6f8f', skin: '#fed7aa', hairStyle: 'bun' }, work: 'library', spot: { x: 575, y: 138 }, shift: { days: 'daily', start: 480, end: 1260 }, say: ['「請保持安靜喔。」', '「這本書很推薦！」'] },
      { key: 'chef', kind: 'staff', name: '阿火師', homeX: 700, speed: 62, palette: { hair: '#1a1a24', outfit: '#ffffff', shorts: '#b04a32', skin: '#d9a066', cap: ['#ffffff', '#c8d2cc', '#cfc4b0'] }, work: 'restaurant', spot: { x: 300, y: 143 }, shift: { days: 'daily', start: 420, end: 1320 }, say: ['「拉麵現煮中！」', '「鐵板燒好了！」'] },
      { key: 'coach', kind: 'staff', name: '阿力', homeX: 880, speed: 85, palette: { hair: '#3c2415', outfit: '#c2452d', shorts: '#46586a', skin: '#c98d54', headband: '#c2452d' }, work: 'gym', spot: { x: 620, y: 120 }, shift: { days: 'daily', oncall: true }, say: ['「跑起來！」', '「再兩圈！」'] },
      { key: 'clerk2', kind: 'staff', name: '阿哲', homeX: 1010, speed: 60, palette: { hair: '#2a2320', outfit: '#9a6bb5', shorts: '#3c2415', skin: '#d9a066', headband: '#9a6bb5' }, work: 'store', spot: { x: 990, y: 150 }, shift: { days: 'daily', start: 1320, end: 480 }, say: ['「大夜班，歡迎光臨。」', '「關東煮還有喔。」', '「泡麵配窗邊，深夜限定。」'] },
      { key: 'dad', kind: 'parent', name: '爸爸', speed: 60, palette: { hair: '#2a2320', outfit: '#46586a', shorts: '#6d4c41', skin: '#f0b98a' }, sleepSpot: { x: 118, y: 158 }, homeSpot: { x: 480, y: 215 }, say: ['「早點睡，別熬夜。」', '「考試加油！」'] },
      { key: 'mom', kind: 'parent', name: '媽媽', speed: 60, palette: { hair: '#9a6bb5', outfit: '#c2452d', shorts: '#9a6bb5', skin: '#fed7aa', hairStyle: 'bun' }, sleepSpot: { x: 206, y: 158 }, homeSpot: { x: 530, y: 215 }, say: ['「飯煮好了，快來吃。」', '「天冷了多穿點。」'] },
    ];
    const NPC_STREET_Y = 300; // A 街步行線（spawn/預設用；跨棟路徑一律走 streetYOf/streetLegs）
    const NPC_DOOR_Y = 245;
    const npcStreetY = (loc) => STREET_Y[LOC_STREET[loc] || 'A'];
    const Z_LAYER = { FRONT_BACK: 940, POST_CLIP: 945, FRONT: 950, SEATED_CLIP: 955, FRONT2: 960, WALK: 975, CHIP: 980, FOOD: 990, BUBBLE: 995, DINNER_CLIP: 185 }; // v9.44 室內圖層憲法（單一出處；世界深度層與 HUD 層界線見站規）
    const npcCurStreet = (npc) => npc.insideLoc ? (LOC_STREET[npc.insideLoc] || 'A') : (npc.y < 545 ? 'A' : 'B');
    const NPC_HOUSE_Y = 505;
    const NPC_PARK_Y = 440;
    const NPC_DOOR_X = DOOR_X; // v9.38 起門口 x 以 coords.js 註冊表為單一來源
    // 玩家專屬位子：座位池永遠保留，NPC 絕不坐上去跟玩家重疊
    const PLAYER_RESERVED = { school: { x: 590, y: 250 }, study: { x: 590, y: 250 }, library: { x: 140, y: 235 }, restaurant: { x: 440, y: 184 }, store: { x: 565, y: 252 }, gym: { x: 1652, y: 75 } };
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
      if (host.id === 'rest-rooms') { const fp = REST_PROJ.P(300, 160, 15); fx.style.left = (fp.x - 55) + 'px'; fx.style.top = (fp.y - 48) + 'px'; } // v9.51 FX 對位投影後的鐵板
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
      gym: { activity: 'sport', grid: [[240, 208], [390, 150], [540, 208], [800, 190], [900, 215], [980, 170]] }, // v9.27 操場場景內（前三跑道側、後三球場側）
      club: { activity: 'study', grid: [[330, 208], [445, 208], [560, 208], [675, 208], [790, 208], [905, 208]] }, // v9.65 社團活動室長桌南側
      study: { activity: 'study', grid: [[430, 185], [590, 185], [750, 185], [430, 250], [590, 250], [750, 250]] }, // v9.72 自習室（同教室課桌格）
    };
    // v9.19 桌上餐點：開吃時把對應的菜放到桌上（不只頭上泡泡）
    const PICK_ITEMS = ['🍙', '🍞', '🥛', '🧃', '🍫', '🍩', '🍎', '🧴', '🥫', '🍮'];
    function setIco(el, emoji) { // v9.59 圖示管線：emoji 一律轉自繪圖示（對照表外才留文字）
      // (window.setIco 在函式後暴露，供測試與跨檔呼叫）
      if (el.dataset.ico === emoji) return;
      el.dataset.ico = emoji;
      const h = (typeof emojiIcon === 'function') ? emojiIcon(emoji) : null;
      if (h) el.innerHTML = h; else el.textContent = emoji;
    }
    window.setIco = setIco;
    function syncDishPlate(npc, show, emoji, px, py, roomsId, z) {
      let pl = (npc._plateEl && npc._plateEl.nodeType === 1) ? npc._plateEl : null; // v9.20 存檔會把 DOM 參照序列化成 {} —— 不是元素就重建（v9.19 實機存檔中毒修正）
      if (show) {
        const rooms = document.getElementById(roomsId);
        if (!rooms) { if (pl) { pl.style.display = 'none'; } return; }
        if (!pl) { pl = document.createElement('div'); pl.className = 'dish-plate'; npc._plateEl = pl; }
        if (pl.parentNode !== rooms) rooms.appendChild(pl);
        pl.style.display = 'block';
        pl.style.left = px + 'px'; pl.style.top = py + 'px'; pl.style.zIndex = String(z || 958);
        setIco(pl, emoji);
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
      setIco(pop, emoji);
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
    const QUEUES = { school: [], library: [], restaurant: [], store: [], gym: [], club: [] };
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
    const GYM_DOOR_IN = { x: 1732, y: 240, door: 'in', loc: 'gym', ix: 575, iy: 278 }; // v9.27 操場門口瞬移
    const GYM_DOOR_OUT = { x: 575, y: 278, door: 'out', loc: 'gym', wx: 1732, wy: 240 };
    const INTERIORS = { // v9.18 室內場景通用表
      store: { roomsId: 'store-rooms', doorIn: STORE_DOOR_IN, doorOut: STORE_DOOR_OUT, worldDoorX: 571, inDoor: { x: 565, y: 278 } },
      restaurant: { roomsId: 'rest-rooms', doorIn: REST_DOOR_IN, doorOut: REST_DOOR_OUT, worldDoorX: 951, inDoor: { x: 610, y: 278 } },
      school: { roomsId: 'school-rooms', doorIn: SCHOOL_DOOR_IN, doorOut: SCHOOL_DOOR_OUT, worldDoorX: 198, inDoor: { x: 575, y: 278 } },
      library: { roomsId: 'lib-rooms', doorIn: LIB_DOOR_IN, doorOut: LIB_DOOR_OUT, worldDoorX: 571, inDoor: { x: 575, y: 278 } }, // v9.72 解綁：圖書館回自己島（worldDoorX 復 571）
      club: { roomsId: 'club-rooms', doorIn: SCHOOL_DOOR_IN, doorOut: SCHOOL_DOOR_OUT, worldDoorX: 198, inDoor: { x: 575, y: 278 } }, // v9.65 學校 3F 社團活動室
      study: { roomsId: 'study-rooms', doorIn: SCHOOL_DOOR_IN, doorOut: SCHOOL_DOOR_OUT, worldDoorX: 198, inDoor: { x: 575, y: 278 } }, // v9.72 學校 2F 自習室（代原圖書館層）
      gym: { roomsId: 'gym-rooms', doorIn: GYM_DOOR_IN, doorOut: GYM_DOOR_OUT, worldDoorX: 958, inDoor: { x: 575, y: 278 } }
    };
    // v9.65 學校多樓層：school=1F / library=2F / club=3F 同棟；樓梯點三層同座標（東北角），跨層必經此點換層，不瞬移穿牆
    const SCHOOL_GROUP = { school: 1, study: 2, club: 3 }; // v9.72 圖書館解綁獨立、2F 改自習室
    const STAIR_PT = { x: 1085, y: 70 };
    const stairWp = (loc) => ({ x: STAIR_PT.x, y: STAIR_PT.y, door: 'in', loc: loc, ix: STAIR_PT.x, iy: STAIR_PT.y });
    const HOME_STAIR_PT = { x: 539, y: 70 }; // v9.66 住家樓梯（中央區北側，三方臥室動線共用）
    const stairWpHome = (f) => ({ x: HOME_STAIR_PT.x, y: HOME_STAIR_PT.y, door: 'in', floor: f, ix: HOME_STAIR_PT.x, iy: HOME_STAIR_PT.y });
    function npcExitPrefix(npc) { // v9.24 在室內的人要先走正門出去；v9.65：2F/3F 的人先下樓梯回 1F 再走大門
      if (npc.insideLoc && SCHOOL_GROUP[npc.insideLoc] && npc.insideLoc !== 'school') return [stairWp('school'), { x: 575, y: 278 }, SCHOOL_DOOR_OUT, { x: INTERIORS.school.worldDoorX, y: npcStreetY('school') }];
      if (npc.insideLoc && INTERIORS[npc.insideLoc]) { const c = INTERIORS[npc.insideLoc]; return [c.inDoor, c.doorOut, { x: c.worldDoorX, y: npcStreetY(npc.insideLoc) }]; }
      return [];
    }
    function interiorPathTo(npc, loc, pt) { const c = INTERIORS[loc]; if (!c) return [pt]; if (npc.insideLoc === loc) return [pt]; if (npc.insideLoc && SCHOOL_GROUP[npc.insideLoc] && SCHOOL_GROUP[loc]) return [stairWp(loc), pt]; if (SCHOOL_GROUP[loc] && loc !== 'school') { const fromX = npc.insideLoc ? INTERIORS[npc.insideLoc].worldDoorX : npc.x; return [...npcExitPrefix(npc), ...streetLegs(fromX, npcCurStreet(npc), INTERIORS.school.worldDoorX, 'B'), SCHOOL_DOOR_IN, stairWp(loc), pt]; } const fromX = npc.insideLoc ? INTERIORS[npc.insideLoc].worldDoorX : npc.x; return [...npcExitPrefix(npc), ...streetLegs(fromX, npcCurStreet(npc), c.worldDoorX, LOC_STREET[loc] || 'A'), c.doorIn, pt]; }
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
    function queueSlotPos(building, i) { return { x: NPC_DOOR_X[building] - 60 + i * 34, y: npcStreetY(building) }; }
    function recomputeQueueSlots(building) {
      QUEUES[building].forEach((key, i) => {
        const npc = (gameState.npcs || []).find(n => n.key === key);
        if (!npc) return;
        const slot = queueSlotPos(building, i);
        const atSlot = npc.x === slot.x && npc.y === npcStreetY(building);
        const headingThere = npc.path.length === 1 && npc.path[0].x === slot.x && npc.path[0].y === npcStreetY(building);
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
      npc.path = [{ x: slot.x, y: npcStreetY(building) }];
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
        npc.path = INTERIORS[building] ? interiorPathTo(npc, building, seat) : [...streetLegs(npc.x, npcCurStreet(npc), NPC_DOOR_X[building], LOC_STREET[building] || 'A'), seat];
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
        return { key: d.key, kind: d.kind, x: 120 + i * 160, y: NPC_STREET_Y, state: 'path', dest: '', path: [], arrive: '', dwell: 0, dir: 1, seatIdx: null, queueFor: '', queueWait: 0, orderLeft: 0 };
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
        npc.path = [...npcExitPrefix(npc), { x: fromX < WORLD_W / 2 ? -80 : WORLD_W + 80, y: STREET_Y[npcCurStreet(npc)] }];
        npc.arrive = 'away';
      } else if (dest === 'park') {
        const px = 120 + Math.floor(Math.random() * 880);
        npc.path = [...npcExitPrefix(npc), ...streetLegs(npc.insideLoc ? INTERIORS[npc.insideLoc].worldDoorX : npc.x, npcCurStreet(npc), px, 'A'), { x: px, y: NPC_PARK_Y }];
        npc.arrive = 'idle';
      } else {
        const seat = npcRequestSeat(npc, dest);
        if (seat) {
          npc.path = INTERIORS[dest] ? interiorPathTo(npc, dest, seat) : [...npcExitPrefix(npc), ...streetLegs(npc.insideLoc ? INTERIORS[npc.insideLoc].worldDoorX : npc.x, npcCurStreet(npc), NPC_DOOR_X[dest], LOC_STREET[dest] || 'A'), seat];
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
        if (lseat) { npc.path = [...npcExitPrefix(npc), ...streetLegs(npc.insideLoc ? INTERIORS[npc.insideLoc].worldDoorX : npc.x, npcCurStreet(npc), NPC_DOOR_X.restaurant, 'A'), INTERIORS.restaurant.doorIn, lseat]; npc.arrive = 'seat'; npc.state = 'path'; }
        else npcEnqueue(npc, 'restaurant');
        return 'restaurant';
      }
      const dow = gameState.dayOfWeek || 1;
      const weekend = (dow === 6 || dow === 7);
      let dest;
      if (def.kind === 'parent') {
        // v9.14.4：爸媽回家時間錯開（爸 17:40、媽 18:12）
        // v9.14：進出室內在門口瞬間切換座標系（door waypoint）
        const DOOR_IN = { x: NPC_DOOR_X.home, y: NPC_DOOR_Y, door: 'in', ix: 565, iy: 218, floor: 'home' }; // v9.66 進門=1F
        const DOOR_OUT = { x: 565, y: 218, door: 'out', wx: NPC_DOOR_X.home, wy: NPC_DOOR_Y };
        if (hour >= 22 || hour < 7) {
          npc.dest = 'home';
          npc.path = npc.inside ? (npc.floor === 'home2' ? [def.sleepSpot] : [stairWpHome('home2'), def.sleepSpot]) : [{ x: NPC_DOOR_X.home, y: NPC_STREET_Y }, DOOR_IN, stairWpHome('home2'), def.sleepSpot]; // v9.66 睡覺上 2F 經樓梯
          npc.arrive = 'sleep'; npc.state = 'path'; return 'home';
        } else if (parentBackHome(npc)) { // v9.14.4 爸 17:40 / 媽 18:12
          npc.dest = 'home';
          npc.path = npc.inside ? (npc.floor === 'home2' ? [stairWpHome('home'), def.homeSpot] : [def.homeSpot]) : [{ x: NPC_DOOR_X.home, y: NPC_STREET_Y }, DOOR_IN, def.homeSpot]; // v9.66 在 2F 先下樓
          npc.arrive = 'athome'; npc.state = 'path'; return 'home';
        } else {
          npc.dest = 'away';
          npc.path = npc.inside ? [...(npc.floor === 'home2' ? [stairWpHome('home')] : []), DOOR_OUT, { x: NPC_DOOR_X.home, y: NPC_STREET_Y }, { x: npc.x < WORLD_W / 2 ? -80 : WORLD_W + 80, y: NPC_STREET_Y }] : [{ x: npc.x < WORLD_W / 2 ? -80 : WORLD_W + 80, y: STREET_Y[npcCurStreet(npc)] }]; // v9.66 在 2F 先下樓再出門
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
        else if (weekend) dest = ['library', 'study', 'gym', 'restaurant', 'store', 'park'][Math.floor(Math.random() * 6)]; // v9.72 自習室進週末池
        else if (hour >= 8 && hour < 16) dest = 'school';
        else if (hour >= 17 && hour < 21) dest = ['library', 'club', 'study', 'park', 'gym'][Math.floor(Math.random() * 5)]; // v9.65 社團時段；v9.72 加自習室間
        else dest = ['restaurant', 'store', 'gym', 'park'][Math.floor(Math.random() * 4)];
      } else {
        if (hour < 7 || (hour * 60 + (gameState.minute || 0)) >= npcHomeTime(npc)) dest = 'away';
        else {
          let pool = [...def.spots, 'park', 'park'];
          if (hour >= 16 && hour < 19 && !weekend) pool.push('club', 'club'); // v9.65 放學社團時間（16-19 點、平日）
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
    const NPC_SPR_H = { chef: 58, shu: 53 }; // v9.40 剪影身高：廚師高帽 +8、高大樹 +3（viewBox 向上擴，腳底線不動）
    function applySilhouette(svg, d) { // v9.40 剪影差異化：縮到 50% 也認得出的大形標記
      const NS = 'http://www.w3.org/2000/svg';
      const headG = svg.querySelector('.pixel-head-group');
      const bodyG = svg.querySelector('.pixel-body-group');
      const mk = (parent, tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); n.setAttribute('class', 'npc-silhouette'); parent.appendChild(n); return n; };
      if (d.key === 'chef') { // 真高帽：viewBox 上擴 4 格（v9.35 的白棒球帽退役）
        const oldCap = svg.querySelector('.pixel-cap-default'); if (oldCap) oldCap.style.display = 'none';
        svg.setAttribute('viewBox', '0 -4 16 29');
        mk(headG, 'rect', { x: 4, y: -4, width: 8, height: 5, fill: '#ffffff', stroke: '#5d4028', 'stroke-width': 0.8 });
        mk(headG, 'rect', { x: 4, y: 0, width: 8, height: 1, fill: '#c8d2cc' });
      }
      if (d.key === 'shu') svg.setAttribute('viewBox', '0 -1.5 16 26.5'); // 全員最高
      if (d.key === 'teacher') { // 高馬尾＋紅框眼鏡
        mk(headG, 'rect', { x: 12, y: 5, width: 2, height: 8, fill: d.palette.hair });
        mk(headG, 'rect', { x: 4.5, y: 6.5, width: 3, height: 3, fill: 'none', stroke: '#c2452d', 'stroke-width': 0.7 });
        mk(headG, 'rect', { x: 8.5, y: 6.5, width: 3, height: 3, fill: 'none', stroke: '#c2452d', 'stroke-width': 0.7 });
      }
      if (d.key === 'kui') { // 雙丸子頭
        mk(headG, 'circle', { cx: 3, cy: 2, r: 1.7, fill: d.palette.hair });
        mk(headG, 'circle', { cx: 13, cy: 2, r: 1.7, fill: d.palette.hair });
      }
      if (d.key === 'coach' && bodyG) { // 寬肩＋哨子
        const jacket = bodyG.querySelector('rect[x="3"][y="11"]');
        if (jacket) { jacket.setAttribute('x', '2'); jacket.setAttribute('width', '12'); }
        mk(bodyG, 'rect', { x: 7, y: 11, width: 2, height: 2, fill: '#f7f1e3', stroke: '#5d4028', 'stroke-width': 0.5 });
      }
      if (d.key === 'mom' && bodyG) mk(bodyG, 'rect', { x: 5, y: 13, width: 6, height: 5, fill: '#ffffff', opacity: 0.92 }); // 圍裙色塊
      if (d.key === 'dad') { // 灰髮＋微駝
        svg.querySelectorAll('.pixel-head-group rect[y="5"]').forEach(r => r.setAttribute('fill', '#9a8d7a'));
        if (headG) headG.style.transform = 'translate(0.6px, 0.8px)';
      }
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
          svg.querySelectorAll('.cap-badge').forEach(n => n.remove()); // v9.43 「學」徽是主角專屬識別，NPC 帽子不掛
          svg.querySelectorAll('.pixel-head-group rect[y="5"]').forEach(r => r.setAttribute('fill', d.palette.hair));
          const jacket = svg.querySelector('.pixel-body-group rect[x="3"][y="11"]');
          if (jacket) jacket.setAttribute('fill', d.palette.outfit);
          svg.querySelectorAll('.pixel-hand-l, .pixel-hand-r').forEach(r => r.setAttribute('fill', d.palette.outfit));
          svg.querySelectorAll('.pixel-foot-l rect[width="4"], .pixel-foot-r rect[width="4"]').forEach(r => r.setAttribute('fill', d.palette.outfit));
          const shorts = svg.querySelector('.pixel-body-group rect[x="4"][y="17"]');
          if (shorts) shorts.setAttribute('fill', d.palette.shorts);
          // v9.35 NPC 差異化（同模三色退役）：膚色／髮型（長髮・包頭）／招牌配件（帽子・頭巾）
          if (d.palette.skin) svg.querySelectorAll('.pixel-head-group rect[fill="#fed7aa"]').forEach(r => r.setAttribute('fill', d.palette.skin));
          const headG = svg.querySelector('.pixel-head-group');
          if (d.palette.cap) {
            const capEl = svg.querySelector('.pixel-cap-default');
            if (capEl) {
              capEl.style.display = '';
              capEl.querySelectorAll('rect').forEach(r => { const f = r.getAttribute('fill'); if (f === '#f2b544') r.setAttribute('fill', d.palette.cap[0]); else if (f === '#d98e32') r.setAttribute('fill', d.palette.cap[1]); else if (f === '#ca6f1e') r.setAttribute('fill', d.palette.cap[2]); });
            }
          }
          if (d.palette.headband) { const hb = svg.querySelector('.pixel-headband'); if (hb) { hb.style.display = ''; hb.setAttribute('fill', d.palette.headband); } }
          if (headG && (d.palette.hairStyle === 'long' || d.palette.hairStyle === 'bun')) {
            const NS = 'http://www.w3.org/2000/svg';
            const addRect = (x, y, w, h) => { const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', w); r.setAttribute('height', h); r.setAttribute('fill', d.palette.hair); r.setAttribute('class', 'npc-hair-ext'); headG.appendChild(r); };
            if (d.palette.hairStyle === 'long') { addRect(3, 7, 1, 6); addRect(12, 7, 1, 6); addRect(4, 11, 8, 1); }
            else { addRect(7, 3, 2, 2); }
          }
          // v9.40 人物規格統一：NPC 與主角同為 32x50、同一腳底線（舊 26x41 矮一截是規格事故）
          svg.setAttribute('class', 'sprite-pixel npc-sprite state-idle');
          svg.style.width = '32px';
          svg.style.height = (NPC_SPR_H[d.key] || 50) + 'px';
          applySilhouette(svg, d);
          el.innerHTML = `<span class="npc-name">${d.name}</span><span class="npc-role" style="display:none;"></span><span class="npc-zzz-tag" style="display:none;"><svg class="pix-ico" aria-hidden="true"><use href="#i-zzz"/></svg></span><span class="npc-flip"></span><span class="npc-dish" style="display:none;"></span>`;
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
      fg.innerHTML = `<svg viewBox="118 110 48 25" style="width:100%; height:100%; display:block;"><g id="sch-podium"><rect x="118" y="110" width="48" height="6" fill="#b0743e" stroke="#4a3220" stroke-width="1.5" /><rect x="121" y="116" width="42" height="17" fill="#8a6248" stroke="#4a3220" stroke-width="1.5" /><rect x="118" y="131" width="48" height="4" fill="#6d4c41" /></g></svg>`;
      map.appendChild(fg);
    }
    function npcSay(npc, customText) {
      if (!npc || npc.state === 'away' || npc.state === 'sleeping') return;
      if (npc._sayUntil && Date.now() < npc._sayUntil) return;
      npc._sayUntil = Date.now() + 3000;
      const def = npcDef(npc.key);
      const layer = (npc.insideLoc && INTERIORS[npc.insideLoc] && document.getElementById(INTERIORS[npc.insideLoc].roomsId)) || (npc.inside && document.getElementById(npc.floor === 'home2' ? 'home2-rooms' : 'home-rooms')) || document.getElementById('npc-layer'); // v9.17.1 室內泡泡進場景；v9.18 查表；v9.66 爸媽在 2F 時泡泡跟上樓
      if (!layer) return;
      const bubble = document.createElement('div');
      bubble.className = 'npc-speech';
      const _prB = (typeof PROJ !== 'undefined') ? PROJ.forRooms(layer.id) : null;
      const _anB = _prB ? _prB.P(npc.x, npc.y, 0) : null;
      bubble.style.left = (_anB ? _anB.x : npc.x) + 'px';
      bubble.style.top = ((_anB ? _anB.y : npc.y) - 78) + 'px';
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
      ensureHomeInterior(); // v9.52：餐桌本體已併入投影場景（buildHomeRoomsHTML），這裡只補食物層
      const layer = document.getElementById('home-rooms');
      if (!layer || document.getElementById('dinner-food')) return;
      const pr = HOME_PROJ;
      const steam = (cx, cz, h, n) => { let out = ''; for (let i = 0; i < n; i++) { const a = pr.P(cx - 6 + i * 6, cz, h); out += '<path class="steam-wisp' + (i ? ' w' + (i + 1) : '') + '" d="M' + a.x.toFixed(1) + ',' + a.y.toFixed(1) + ' q2,-3 0,-6" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>'; } return out; };
      const set = '<g id="home-dinner-set" style="display:none;">'
        + pr.planeCircle(624, 182, 14.6, 13, '#ffffff') + pr.planeCircle(624, 182, 15.2, 7, '#fff6e8')
        + pr.planeCircle(685, 182, 14.6, 13, '#ffffff') + pr.planeCircle(685, 182, 15.2, 7, '#fff6e8')
        + pr.planeCircle(655, 184, 14.6, 17, '#c2452d') + pr.planeCircle(655, 184, 15.2, 10, '#e09a3e')
        + steam(655, 184, 24, 3) + '</g>';
      const stm = '<g id="home-dinner-steam" style="display:none;">' + steam(655, 184, 22, 2) + '</g>';
      const food = document.createElement('div');
      food.id = 'dinner-food';
      food.style.cssText = 'position:absolute; left:0; top:0; width:' + HOME_PW + 'px; height:300px; z-index:990; pointer-events:none;';
      food.innerHTML = '<svg viewBox="0 0 ' + HOME_PW + ' 300" style="width:100%; height:100%; display:block;">' + set + stm + '</svg>';
      layer.appendChild(food);
    }
    function updateHomeDinnerVisual(phase) {
      ensureDinnerFurniture();
      const set = document.getElementById('home-dinner-set');
      if (set) set.style.display = phase === 'dinner' ? 'block' : 'none';
      const steam = document.getElementById('home-dinner-steam');
      if (steam) steam.style.display = phase === 'prep' ? 'block' : 'none';
    }

    // ================= v9.14 捲動式室內 =================
    // ================= v9.52 住家 2.5D 化（報告批次 2）：場景改投影生成，與 K90 模擬圖同構 =================
    // 分層同餐廳範本：#home-bg25（牆/地板/盒東+上面）＋ #home-front25（南面，z196——晚餐爸媽夾層 185 在其下、棉被 260 在其上，舊契約不變）。
    // 晚餐桌足跡 (597,168,116x30,h14)：爸媽座 z162 在北緣之北 6（frontHMax(6,25,6)=21.3）、主角座 z208 在南緣之南 10。
    const HOME_PROJ = PROJ.makeIndoor(PROJ.K_INDOOR, 24, 172); // v9.67 室內 45°
    const HOME_PW = 1340;
    PROJ.registerRooms('home-rooms', HOME_PROJ);
    // v9.62 地面密度定版：地板 pattern 產生器（聖經：大面積地面不准純色——交錯帶/棋盤以低對比鋪滿）
    function floorBands(pr, poly, tone, op, band, x0, x1, z0, z1) { let o = '<g class="floor-pat">'; for (let z = z0, i = 0; z < z1; z += band, i++) { if (i % 2) o += poly([pr.P(x0, z, 0), pr.P(x1, z, 0), pr.P(x1, Math.min(z + band, z1), 0), pr.P(x0, Math.min(z + band, z1), 0)], tone, ' fill-opacity="' + op + '"'); } return o + '</g>'; }

    function buildHomeRoomsHTML() {
      const pr = HOME_PROJ, WH = 150;
      const poly = (list, fill, extra) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"' + (extra || '') + '/>';
      const rectPoly = (x, z, w, d, h, fill, extra) => poly([pr.P(x, z, h), pr.P(x + w, z, h), pr.P(x + w, z + d, h), pr.P(x, z + d, h)], fill, extra);
      const faceRect = (x, z, w, h0, h1, fill) => poly([pr.P(x, z, h0), pr.P(x + w, z, h0), pr.P(x + w, z, h1), pr.P(x, z, h1)], fill);
      const txt = (xp, str, size, fill, op) => '<text x="' + xp.x.toFixed(1) + '" y="' + xp.y.toFixed(1) + '" font-size="' + size + '" font-weight="700" fill="' + fill + '"' + (op ? ' opacity="' + op + '"' : '') + '>' + str + '</text>';
      let bg = '', front = '';
      // 北牆三區色＋東牆＋地板
      bg += poly([pr.P(0, 0, 0), pr.P(340, 0, 0), pr.P(340, 0, WH), pr.P(0, 0, WH)], '#efe9e0');
      bg += poly([pr.P(380, 0, 0), pr.P(752, 0, 0), pr.P(752, 0, WH), pr.P(380, 0, WH)], '#f5f0e6');
      bg += poly([pr.P(792, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(792, 0, WH)], '#f7f1e3');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#cfc4b0', 0.8));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#d9a066');
      bg += floorBands(pr, poly, '#c98d54', 0.45, 38, 0, 1150, 0, 300); // v9.62 木板交錯帶
      let lines = '';
      for (let z = 38; z < 300; z += 38) { const a = pr.P(0, z, 0), b = pr.P(1150, z, 0); lines += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; }
      bg += '<g stroke="rgba(150,100,50,0.35)" stroke-width="1.5">' + lines + '</g>';
      // 隔間牆（沿 z 的平面，門洞 z96–140＋門楣 h74 起）
      [360, 772].forEach(px => {
        bg += poly([pr.P(px, 0, 0), pr.P(px, 96, 0), pr.P(px, 96, WH), pr.P(px, 0, WH)], '#f3e2c7');
        bg += poly([pr.P(px, 140, 0), pr.P(px, 300, 0), pr.P(px, 300, WH), pr.P(px, 140, WH)], '#f3e2c7');
        bg += poly([pr.P(px, 96, 74), pr.P(px, 140, 74), pr.P(px, 140, WH), pr.P(px, 96, WH)], '#f3e2c7');
        const d1 = pr.P(px, 96, 0), d2 = pr.P(px, 96, 74), d3 = pr.P(px, 140, 0), d4 = pr.P(px, 140, 74);
        bg += '<line x1="' + d1.x.toFixed(1) + '" y1="' + d1.y.toFixed(1) + '" x2="' + d2.x.toFixed(1) + '" y2="' + d2.y.toFixed(1) + '" stroke="#a9743f" stroke-width="3"/><line x1="' + d3.x.toFixed(1) + '" y1="' + d3.y.toFixed(1) + '" x2="' + d4.x.toFixed(1) + '" y2="' + d4.y.toFixed(1) + '" stroke="#a9743f" stroke-width="3"/>';
      });
      // 北牆窗/畫/海報（wallDeco 平面物）
      bg += pr.wallDecoN(36, 116, 96, 144, '#2c3e50');
      const moon = pr.P(94, 0, 124); bg += '<circle cx="' + moon.x.toFixed(1) + '" cy="' + moon.y.toFixed(1) + '" r="9" fill="#ffe9a8"/>';
      bg += pr.wallDecoN(150, 196, 88, 118, '#ffffff');
      [[165, 103], [181, 103], [173, 95]].forEach(([fx, fh]) => { const c = pr.P(fx, 0, fh); bg += '<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="5" fill="#fed7aa"/>'; });
      bg += pr.wallDecoN(566, 646, 88, 148, '#bedcfe');
      const sun = pr.P(588, 0, 128); bg += '<circle cx="' + sun.x.toFixed(1) + '" cy="' + sun.y.toFixed(1) + '" r="10" fill="#f5c86a"/>';
      const cl = pr.P(622, 0, 116); bg += '<circle cx="' + cl.x.toFixed(1) + '" cy="' + cl.y.toFixed(1) + '" r="8" fill="#ffffff"/><circle cx="' + (cl.x - 10).toFixed(1) + '" cy="' + (cl.y + 2).toFixed(1) + '" r="6" fill="#ffffff"/>';
      bg += pr.wallDecoN(812, 882, 88, 148, '#aee6fa');
      const cl2 = pr.P(838, 0, 122); bg += '<circle cx="' + cl2.x.toFixed(1) + '" cy="' + cl2.y.toFixed(1) + '" r="8" fill="#ffffff"/><circle cx="' + (cl2.x + 12).toFixed(1) + '" cy="' + (cl2.y + 3).toFixed(1) + '" r="6" fill="#ffffff"/>';
      bg += pr.wallDecoN(968, 1036, 96, 142, '#ffffff');
      bg += txt(pr.P(994, 0, 112), '★', 20, '#f5c86a');
      // 地毯（地板上的平面矩形）
      bg += rectPoly(44, 226, 236, 60, 0, 'rgba(206,147,216,0.45)');
      bg += rectPoly(430, 228, 300, 54, 0, 'rgba(255,204,128,0.5)');
      bg += rectPoly(768, 226, 216, 60, 0, 'rgba(144,202,249,0.5)');
      // 起居室（v9.66 臥室搬上 2F）：雙扶手椅＋茶几＋衣櫃（原位）
      bg += pr.box3(84, 128, 62, 12, 26, '#7fa663');
      const ac1 = pr.boxFaces(84, 140, 62, 38, 15, '#7fa663');
      bg += ac1.back; front += ac1.front;
      bg += pr.box3(196, 128, 62, 12, 26, '#7fa663');
      const ac2 = pr.boxFaces(196, 140, 62, 38, 15, '#7fa663');
      bg += ac2.back; front += ac2.front;
      bg += pr.box3(140, 192, 76, 32, 9, '#a9743f');
      bg += pr.box3(272, 28, 60, 26, 52, '#a9743f');
      // 沙發（靠背北側＋座墊盒，南面進 front）
      bg += pr.box3(442, 116, 152, 12, 26, '#e74c3c');
      const sofa = pr.boxFaces(442, 128, 152, 46, 16, '#e74c3c');
      bg += sofa.back; front += sofa.front;
      // 電視（薄盒靠北牆，全 bg）＋螢幕畫在其南面平面上
      bg += pr.box3(648, 40, 92, 10, 42, '#232f47');
      bg += faceRect(654, 50.5, 80, 8, 36, '#7d9dbd');
      const tsun = pr.P(678, 50.5, 24); bg += '<circle cx="' + tsun.x.toFixed(1) + '" cy="' + tsun.y.toFixed(1) + '" r="6" fill="#ffe9a8"/>';
      // 落地燈＋光池
      const lp0 = pr.P(616, 150, 0), lp1 = pr.P(616, 150, 50);
      bg += '<line x1="' + lp0.x.toFixed(1) + '" y1="' + lp0.y.toFixed(1) + '" x2="' + lp1.x.toFixed(1) + '" y2="' + lp1.y.toFixed(1) + '" stroke="#5f5f66" stroke-width="3"/>';
      bg += pr.planeCircle(616, 150, 0, 26, '#f5c86a', 0.25);
      bg += '<polygon points="' + (lp1.x - 16).toFixed(1) + ',' + lp1.y.toFixed(1) + ' ' + (lp1.x + 16).toFixed(1) + ',' + lp1.y.toFixed(1) + ' ' + (lp1.x + 8).toFixed(1) + ',' + (lp1.y - 20).toFixed(1) + ' ' + (lp1.x - 8).toFixed(1) + ',' + (lp1.y - 20).toFixed(1) + '" fill="#f5c86a" stroke="#4a3220" stroke-width="1.8"/>';
      bg += pr.box3(386, 232, 66, 22, 10, '#9a8d7a');
      // 晚餐桌＋北椅（bg）＋南椅（南面進 front）
      bg += pr.box3(606, 146, 36, 10, 30, '#a9743f');
      bg += pr.box3(667, 146, 36, 10, 30, '#a9743f');
      const dtable = pr.boxFaces(597, 168, 116, 30, 14, '#c98d54');
      bg += dtable.back; front += dtable.front;
      const schair = pr.boxFaces(637, 212, 36, 10, 24, '#a9743f');
      bg += schair.back; front += schair.front;
      // 書房一角（v9.66 我的床搬上 2F）：閱讀椅＋邊桌＋盆栽
      bg += pr.box3(812, 128, 66, 12, 26, '#7d9dbd');
      const rch = pr.boxFaces(812, 140, 66, 38, 15, '#7d9dbd');
      bg += rch.back; front += rch.front;
      bg += pr.box3(896, 150, 30, 30, 20, '#a9743f');
      bg += pr.box3(922, 106, 26, 26, 12, '#c96f4a');
      const plv = pr.P(935, 119, 30); bg += '<circle cx="' + plv.x.toFixed(1) + '" cy="' + plv.y.toFixed(1) + '" r="11" fill="#7fa663"/><circle cx="' + (plv.x - 8).toFixed(1) + '" cy="' + (plv.y + 4).toFixed(1) + '" r="7" fill="#27ae60"/>';
      // 書桌（南面進 front）＋桌上書＋椅
      const desk = pr.boxFaces(972, 148, 130, 34, 14, '#a9743f');
      bg += desk.back; front += desk.front;
      bg += rectPoly(986, 154, 10, 18, 14.5, '#e74c3c');
      bg += rectPoly(998, 156, 8, 14, 14.5, '#7d9dbd');
      bg += rectPoly(1008, 155, 9, 16, 14.5, '#8fae6b');
      bg += pr.box3(1010, 186, 44, 10, 22, '#6d4c41');
      // 書櫃＋書脊（畫在南面平面上）
      bg += pr.box3(1108, 28, 38, 24, 54, '#8d5a2c');
      [[1112, '#e74c3c'], [1120, '#7d9dbd'], [1128, '#8fae6b']].forEach(([sx, sc2]) => { bg += faceRect(sx, 52.5, 6, 30, 48, sc2); bg += faceRect(sx, 52.5, 6, 6, 22, sc2); });
      bg += stairSvgAt(pr, 500); // v9.66 樓梯間（中央區北側，通 2F 臥室層）
      // 入口墊＋分區標籤＋貓
      bg += pr.box3(505, 264, 120, 28, 2, '#8a6248');
      bg += txt(pr.P(597, 283, 4), '入 口', 11, '#ffe9b8');
      bg += txt(pr.P(20, 292, 0), '起居室', 14, '#5f5f66', 0.65); // v9.66
      bg += txt(pr.P(396, 292, 0), '客廳・餐廳', 14, '#a9743f', 0.65);
      bg += txt(pr.P(800, 292, 0), '書房', 14, '#2e5f8a', 0.65); // v9.66
      const catA = pr.P(300, 248, 0);
      bg += '<g id="home-cat" transform="translate(' + catA.x.toFixed(1) + ',' + catA.y.toFixed(1) + ')"><rect class="cat-tail" x="-4" y="1" width="5" height="2" fill="#e67e22"/><rect x="0" y="4" width="10" height="5" fill="#e09a3e"/><rect x="2" y="4" width="1" height="5" fill="#e67e22"/><rect x="5" y="4" width="1" height="5" fill="#e67e22"/><rect x="8" y="0" width="6" height="6" fill="#e09a3e"/><rect x="8" y="-1" width="2" height="2" fill="#e09a3e"/><rect x="12" y="-1" width="2" height="2" fill="#e09a3e"/><rect x="10" y="2" width="1" height="1" fill="#4a3220"/><rect x="13" y="2" width="1" height="1" fill="#4a3220"/><rect x="0" y="9" width="3" height="1" fill="#e67e22"/><rect x="7" y="9" width="3" height="1" fill="#e67e22"/></g>';
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + HOME_PW + ' 300" style="position:absolute; left:0; top:0; width:' + HOME_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      // 書桌點擊區（投影後書桌外接矩形，R1：命中以投影後位置為準，邏輯不變）
      const dc = [[972, 148, 0], [1102, 148, 14], [1102, 182, 0], [972, 182, 14], [972, 148, 14], [1102, 182, 14], [972, 182, 0], [1102, 148, 0]].map(([x, z, h]) => pr.P(x, z, h));
      const dx0 = Math.min.apply(null, dc.map(c => c.x)), dx1 = Math.max.apply(null, dc.map(c => c.x));
      const dy0 = Math.min.apply(null, dc.map(c => c.y)), dy1 = Math.max.apply(null, dc.map(c => c.y));
      const hit = '<div id="desk-hit" onclick="toggleDeskStudy()" title="在書桌自習" style="position:absolute; left:' + (dx0 - 6).toFixed(0) + 'px; top:' + (dy0 - 6).toFixed(0) + 'px; width:' + (dx1 - dx0 + 12).toFixed(0) + 'px; height:' + (dy1 - dy0 + 12).toFixed(0) + 'px; z-index:140; cursor:pointer;"></div>';
      return svgOpen('home-bg25', 0) + bg + '</svg>'
        + svgOpen('home-front25', 196) + front + '</svg>'
        + hit; // v9.66 棉被層（parents-blanket/player-blanket）隨臥室搬到 2F builder
    }
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
      stage.innerHTML = '<div id="home-rooms">' + buildHomeRoomsHTML() + '</div>';
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
        const maxPan = Math.max(0, HOME_PW - visible);
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
      if (visible >= HOME_PW) pan = (HOME_PW - visible) / 2;
      else pan = Math.max(0, Math.min(HOME_PW - visible, focusX - visible / 2));
      const _nowHome = performance.now(); const _dtHome = _homePanT ? (_nowHome - _homePanT) : 16; _homePanT = _nowHome;
      applyHomePan(smoothPanStep(_homePanCur, pan, focusX, visible, _dtHome), sc);
    }
    const CAT_SPOTS = [{ x: 300, y: 248 }, { x: 640, y: 256 }, { x: 980, y: 250 }, { x: 120, y: 252 }];
    let _catIdx = 0, _catCd = 20;
    function updateHomeCat(dtMin) { // v9.42 場景最低規格：住家的「活物」——貓會自己換地方窩著
      const cat = document.getElementById('home-cat');
      if (!cat) return;
      _catCd -= dtMin;
      if (_catCd > 0) return;
      _catCd = 18 + Math.random() * 25;
      _catIdx = (_catIdx + 1 + Math.floor(Math.random() * (CAT_SPOTS.length - 1))) % CAT_SPOTS.length;
      const sp = CAT_SPOTS[_catIdx];
      const _cp = HOME_PROJ.P(sp.x, sp.y, 0);
      cat.setAttribute('transform', 'translate(' + _cp.x.toFixed(1) + ',' + _cp.y.toFixed(1) + ')');
    }
    function updateHomeStage() {
      ensureHomeInterior();
      ensureHome2Interior(); // v9.66 2F 一併備好（棉被/爸媽夜間動線需要）
      updateHomeCat(0.5);
      const stage = document.getElementById('home-stage');
      if (!stage) return;
      const rooms = document.getElementById('home-rooms');
      const playerIn = (typeof currentLoc !== 'undefined') && currentLoc === 'home' && !gameState.isCommuting;
      const playerHere = playerIn && currentState !== 'sleeping' && !(gameState._spot && gameState._spot.floor === 2); // v9.66 睡覺時主角本人在 2F（updateHome2Stage 接手）；v9.73 爸媽房覆寫同理
      if (playerIn !== _homeWasIn) { _homePanManual = null; _homeWasIn = playerIn; } // 進出家門 → 回到自動跟隨
      const cw = document.getElementById('char-wrap');
      if (playerHere) {
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
      if (cw && playerHere) cw.style.zIndex = (((currentState === 'dinner' || currentState === 'studying') && !gameState._playerWalking)) ? '500' : '975'; // v9.30 住家同規（比照其他五棟）：坐定維持夾層，走動/站立在傢俱前景之上
      { // v9.30 主角自己的晚餐盤（比照餐廳 #player-rest-plate）：坐上晚餐座位才出現，食物置頂 z990
        let pp = document.getElementById('player-dinner-plate');
        const showP = playerIn && currentState === 'dinner' && !gameState._playerWalking;
        if (showP && rooms) {
          if (!pp) { pp = document.createElement('div'); pp.id = 'player-dinner-plate'; pp.className = 'dish-plate'; pp.innerHTML = icoSvg('curry'); rooms.appendChild(pp); }
          const _pdp = HOME_PROJ.P(gameState.currentX || 655, 190, 14);
          pp.style.display = 'block'; pp.style.left = (_pdp.x - 9) + 'px'; pp.style.top = (_pdp.y - 9) + 'px'; pp.style.zIndex = '990';
        } else if (pp) pp.style.display = 'none';
      }
      // 室內鏡頭：主角在家跟主角，否則看在家的爸媽，再否則停客廳
      let focus = HOME_PROJ.P(565, 200, 0).x;
      if (playerHere) focus = HOME_PROJ.P(gameState.currentX || 500, gameState.currentY || 212, 0).x;
      else {
        const par = (gameState.npcs || []).find(n => n.kind === 'parent' && n.inside);
        if (par) focus = HOME_PROJ.P(par.x, par.y, 0).x;
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
      applyHomeFloors((playerIn && (currentState === 'sleeping' || (gameState._spot && gameState._spot.floor === 2))) ? 2 : 1); // v9.66 樓層疊層跟著主角睡/醒；v9.73 爸媽房覆寫錨 2F切換
    }

    // ================= v9.66 住家 2F 臥室層（多樓層批次 B2：平面圖同 1F，臥室上樓、棉被隨遷） =================
    PROJ.registerRooms('home2-rooms', HOME_PROJ);
    function buildHome2RoomsHTML() {
      const pr = HOME_PROJ, WH = 150;
      const poly = (list, fill, extra) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"' + (extra || '') + '/>';
      const rectPoly = (x, z, w, d, h, fill, extra) => poly([pr.P(x, z, h), pr.P(x + w, z, h), pr.P(x + w, z + d, h), pr.P(x, z + d, h)], fill, extra);
      const faceRect = (x, z, w, h0, h1, fill) => poly([pr.P(x, z, h0), pr.P(x + w, z, h0), pr.P(x + w, z, h1), pr.P(x, z, h1)], fill);
      const txt = (xp, str, size, fill, op) => '<text x="' + xp.x.toFixed(1) + '" y="' + xp.y.toFixed(1) + '" font-size="' + size + '" font-weight="700" fill="' + fill + '"' + (op ? ' opacity="' + op + '"' : '') + '>' + str + '</text>';
      let bg = '', front = '';
      bg += poly([pr.P(0, 0, 0), pr.P(340, 0, 0), pr.P(340, 0, WH), pr.P(0, 0, WH)], '#f5e6da');
      bg += poly([pr.P(380, 0, 0), pr.P(752, 0, 0), pr.P(752, 0, WH), pr.P(380, 0, WH)], '#efe9e0');
      bg += poly([pr.P(792, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(792, 0, WH)], '#e8f0f7');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#cfc4b0', 0.8));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#d9a066');
      bg += floorBands(pr, poly, '#c98d54', 0.45, 38, 0, 1150, 0, 300);
      [360, 772].forEach(px => {
        bg += poly([pr.P(px, 0, 0), pr.P(px, 96, 0), pr.P(px, 96, WH), pr.P(px, 0, WH)], '#f3e2c7');
        bg += poly([pr.P(px, 140, 0), pr.P(px, 300, 0), pr.P(px, 300, WH), pr.P(px, 140, WH)], '#f3e2c7');
        bg += poly([pr.P(px, 96, 74), pr.P(px, 140, 74), pr.P(px, 140, WH), pr.P(px, 96, WH)], '#f3e2c7');
      });
      bg += pr.wallDecoN(150, 196, 88, 118, '#ffffff');
      [[165, 103], [181, 103], [173, 95]].forEach(([fx, fh]) => { const c = pr.P(fx, 0, fh); bg += '<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="5" fill="#fed7aa"/>'; });
      bg += pr.wallDecoN(566, 646, 88, 148, '#bedcfe');
      const sun2 = pr.P(588, 0, 128); bg += '<circle cx="' + sun2.x.toFixed(1) + '" cy="' + sun2.y.toFixed(1) + '" r="10" fill="#f5c86a"/>';
      bg += pr.wallDecoN(968, 1036, 96, 142, '#ffffff');
      bg += txt(pr.P(994, 0, 112), '★', 20, '#f5c86a');
      bg += rectPoly(44, 226, 236, 60, 0, 'rgba(206,147,216,0.45)');
      bg += rectPoly(430, 228, 300, 54, 0, 'rgba(255,204,128,0.5)');
      bg += rectPoly(768, 226, 216, 60, 0, 'rgba(144,202,249,0.5)');
      // 爸媽床（與舊 1F 同幾何：sleepSpot/棉被座標零改動）＋衣櫃
      bg += pr.box3(68, 114, 188, 10, 30, '#8d5a2c');
      bg += pr.box3(68, 124, 188, 84, 13, '#ffffff');
      bg += pr.box3(84, 130, 68, 22, 17, '#ffffff');
      bg += pr.box3(172, 130, 68, 22, 17, '#ffffff');
      bg += pr.box3(68, 156, 188, 52, 15.5, '#9b59b6');
      bg += pr.box3(272, 28, 60, 26, 52, '#a9743f');
      // 中央：樓梯（下樓口）＋小書房桌
      bg += stairSvgAt(pr, 500);
      const ndesk = pr.boxFaces(420, 158, 92, 30, 14, '#a9743f');
      bg += ndesk.back; front += ndesk.front;
      bg += pr.box3(448, 192, 36, 10, 22, '#6d4c41');
      bg += rectPoly(434, 164, 10, 18, 14.5, '#e74c3c');
      bg += rectPoly(446, 166, 8, 14, 14.5, '#7d9dbd');
      // 我的床（同舊 1F 幾何）＋床頭櫃＋小燈＋書櫃
      bg += pr.box3(792, 114, 162, 10, 30, '#6d4c41');
      bg += pr.box3(792, 124, 162, 84, 13, '#ffffff');
      bg += pr.box3(806, 130, 68, 22, 17, '#ffffff');
      bg += pr.box3(792, 156, 162, 52, 15.5, '#7d9dbd');
      bg += pr.box3(966, 118, 34, 26, 20, '#a9743f');
      const nl0 = pr.P(983, 130, 20), nl1 = pr.P(983, 130, 38);
      bg += '<line x1="' + nl0.x.toFixed(1) + '" y1="' + nl0.y.toFixed(1) + '" x2="' + nl1.x.toFixed(1) + '" y2="' + nl1.y.toFixed(1) + '" stroke="#5f5f66" stroke-width="2.5"/>';
      bg += pr.planeCircle(983, 130, 0, 20, '#f5c86a', 0.22);
      bg += pr.box3(1108, 28, 38, 24, 54, '#8d5a2c');
      [[1112, '#e74c3c'], [1120, '#7d9dbd'], [1128, '#8fae6b']].forEach(([sx, sc2]) => { bg += faceRect(sx, 52.5, 6, 30, 48, sc2); bg += faceRect(sx, 52.5, 6, 6, 22, sc2); });
      bg += txt(pr.P(20, 292, 0), '爸媽房', 14, '#5f5f66', 0.65);
      bg += txt(pr.P(396, 292, 0), '樓梯間・小書房', 14, '#a9743f', 0.65);
      bg += txt(pr.P(800, 292, 0), '我的房間', 14, '#2e5f8a', 0.65);
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + HOME_PW + ' 300" style="position:absolute; left:0; top:0; width:' + HOME_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      const pb = '<g class="sleep-form-anim">'
        + rectPoly(66, 168, 192, 44, 15.5, '#9b59b6', ' stroke="#4a3220" stroke-width="1.6"')
        + rectPoly(66, 168, 192, 12, 15.6, 'rgba(255,255,255,0.25)')
        + [[110, 186], [165, 194], [220, 188]].map(([cx, cz]) => { const c = pr.P(cx, cz, 16); return '<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="5" fill="rgba(255,255,255,0.3)"/>'; }).join('') + '</g>';
      const yb = '<g class="sleep-form-anim">'
        + rectPoly(790, 168, 164, 44, 15.5, '#7d9dbd', ' stroke="#4a3220" stroke-width="1.6"')
        + rectPoly(790, 182, 164, 5, 15.6, 'rgba(255,255,255,0.35)')
        + rectPoly(790, 196, 164, 5, 15.6, 'rgba(255,255,255,0.35)') + '</g>';
      return svgOpen('home2-bg25', 0) + bg + '</svg>'
        + svgOpen('home2-front25', 196) + front + '</svg>'
        + '<svg id="parents-blanket" viewBox="0 0 ' + HOME_PW + ' 300" style="display:none; position:absolute; left:0; top:0; width:' + HOME_PW + 'px; height:300px; z-index:260; pointer-events:none;">' + pb + '</svg>'
        + '<svg id="player-blanket" viewBox="0 0 ' + HOME_PW + ' 300" style="display:none; position:absolute; left:0; top:0; width:' + HOME_PW + 'px; height:300px; z-index:600; pointer-events:none;">' + yb + '</svg>';
    }
    let _home2PanManual = null;
    let _home2ManualUntil = 0;
    let _home2PanCur = 0; let _home2PanT = 0;
    let _home2WasIn = false;
    function applyHome2Pan(pan, sc) {
      const rooms = document.getElementById('home2-rooms');
      if (!rooms) return;
      _home2PanCur = pan;
      rooms.style.transform = 'translate(' + (-pan * sc).toFixed(1) + 'px, 0px) scale(' + sc.toFixed(3) + ')';
    }
    function updateHome2Pan(focusX) {
      const stage = document.getElementById('home2-stage');
      if (!stage) return;
      const vpW = stage.clientWidth, vpH = stage.clientHeight;
      if (!vpW || !vpH) return;
      const sc = vpH / 300;
      const visible = vpW / sc;
      if (_home2PanManual !== null) {
        if (Date.now() > _home2ManualUntil) _home2PanManual = null;
        else { applyHome2Pan(_home2PanManual, sc); return; }
      }
      if (typeof focusX !== 'number') focusX = 565;
      let pan;
      if (visible >= HOME_PW) pan = (HOME_PW - visible) / 2;
      else pan = Math.max(0, Math.min(HOME_PW - visible, focusX - visible / 2));
      const _nowH2 = performance.now(); const _dtH2 = _home2PanT ? (_nowH2 - _home2PanT) : 16; _home2PanT = _nowH2;
      applyHome2Pan(smoothPanStep(_home2PanCur, pan, focusX, visible, _dtH2), sc);
    }
    function ensureHome2Interior() {
      if (document.getElementById('home2-stage')) return;
      const host = document.querySelector('#landmark-home .island-platform-top') || document.querySelector('#landmark-home .island-platform') || document.getElementById('landmark-home');
      if (!host) return;
      const stage = document.createElement('div');
      stage.id = 'home2-stage';
      stage.innerHTML = '<div id="home2-rooms">' + buildHome2RoomsHTML() + '</div>';
      host.appendChild(stage);
      let drag = null;
      const activePtrs = new Set();
      stage.addEventListener('pointerdown', e => {
        e.stopPropagation();
        activePtrs.add(e.pointerId);
        if (activePtrs.size > 1) { drag = null; const rooms = document.getElementById('home2-rooms'); if (rooms) rooms.style.transition = ''; return; }
        drag = { x: e.clientX, pan: (_home2PanManual !== null ? _home2PanManual : _home2PanCur), moved: 0 };
        _home2PanManual = drag.pan;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        const rooms = document.getElementById('home2-rooms');
        if (rooms) rooms.style.transition = 'none';
      });
      stage.addEventListener('pointermove', e => {
        if (!drag) return;
        const sc = (stage.clientHeight || 179) / 300;
        const visible = (stage.clientWidth || 278) / sc;
        const maxPan = Math.max(0, HOME_PW - visible);
        const next = Math.max(0, Math.min(maxPan, drag.pan - (e.clientX - drag.x) / sc));
        drag.moved += Math.abs(next - _home2PanManual);
        _home2ManualUntil = Date.now() + 30000;
        _home2PanManual = next;
        applyHome2Pan(_home2PanManual, sc);
      });
      const endDrag = e => {
        activePtrs.delete(e.pointerId);
        _home2ManualUntil = Date.now() + 30000;
        if (!drag) return;
        const wasDrag = drag.moved > 0.5;
        drag = null;
        const rooms = document.getElementById('home2-rooms');
        if (rooms) rooms.style.transition = '';
        if (wasDrag) stage.addEventListener('click', ev2 => { ev2.stopPropagation(); ev2.preventDefault(); }, { capture: true, once: true });
      };
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
      stage.addEventListener('dblclick', () => { _home2PanManual = null; });
    }
    let _homeViewFloor = null; // v9.67 標籤 peek 的暫時檢視層（睡/醒狀態一變就清除）
    let _homeDerivedPrev = 1;
    let _homeExplodeMode = 'out';
    // v9.69 全屏室內呈現層（R3 F）：進建物把該棟疊層搬進 #fs-view 整疊入框；離場原位復原
    const FS_BG = '#26190f';
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
        plates.push({ wrap: wrap, kind: pd.kind, loc: pd.loc, id: pd.id });
      });
      const gd = document.getElementById(def.guides);
      if (gd) { moved.push({ el: gd, parent: gd.parentNode, next: gd.nextSibling }); gd.style.transformOrigin = '0 0'; stack.appendChild(gd); }
      _fs = { key: key, def: def, plates: plates, moved: moved, guidesEl: gd || null, totalUnits: def.plates.length * 300 + (def.plates.length - 1) * def.gap, s: 0 };
      _fsSig = '';
      view.classList.add('on'); document.body.classList.add('fs-on');
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
      fsViewEl().classList.remove('on'); document.body.classList.remove('fs-on');
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
      const plat = document.querySelector('#landmark-home .island-platform');
      if (plat) plat.classList.toggle('explode-open', inB);
      const host = document.querySelector('#landmark-home .island-platform-top');
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
      const host = document.querySelector('#landmark-' + loc + ' .island-platform-top');
      if (!host) return;
      ensureExplodeChrome(key, host, loc, pr, 2, EXPLODE_GAP_SINGLE);
      const plat = document.querySelector('#landmark-' + loc + ' .island-platform');
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
          coach.path = interiorPathTo(coach, 'gym', npcDef('coach').spot); // v9.27 操場室內化：改走通用門口路徑（原本手排路徑會把場景座標當世界座標）
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
                if (wp.floor) npc.floor = wp.floor; else if (wp.door === 'out' && !wp.loc) npc.floor = null; // v9.66 住家樓層旗標（爸媽上下樓）
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
          if (npc.dest === 'gym' && npc.insideLoc === 'gym' && npc.state === 'seated' && npc.kind !== 'staff' && npc.x > 700) { // v9.27 球場邊的人會投籃
            npc.shotCd = (npc.shotCd == null ? 7 + Math.random() * 9 : npc.shotCd) - progressMinutes;
            if (npc.shotCd <= 0) { npc.shotCd = 9 + Math.random() * 12; gymShootBall(npc); }
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
        if (npc.insideLoc === 'club' && !document.getElementById('club-rooms')) ensureClubInterior(); // v9.65
        if (npc.insideLoc === 'gym' && !document.getElementById('gym-rooms')) ensureGymInterior(); // v9.27
        const el = document.getElementById('npc-' + npc.key);
        if (el) { // v9.14：室內外容器切換；v9.17：insideLoc（一般 NPC 的 inside 未初始化，不能當守衛）
          const _tgt = (npc.insideLoc && INTERIORS[npc.insideLoc]) ? document.getElementById(INTERIORS[npc.insideLoc].roomsId) : (npc.inside ? document.getElementById(npc.floor === 'home2' ? 'home2-rooms' : 'home-rooms') : document.getElementById('npc-layer'));
          if (_tgt && el.parentNode !== _tgt) _tgt.appendChild(el);
          // v9.17.1：室內人物補償場景縮放，與大地圖同尺寸（腳底為原點）
          if (_tgt && (_tgt.id === 'home-rooms' || _tgt.id === 'store-rooms' || _tgt.id === 'rest-rooms' || _tgt.id === 'school-rooms' || _tgt.id === 'lib-rooms' || _tgt.id === 'gym-rooms' || _tgt.id === 'club-rooms' || _tgt.id === 'home2-rooms')) {
            const _st = _tgt.parentNode;
            const _tf = 'scale(' + (300 / ((_st && _st.clientHeight) || 179)).toFixed(3) + ')';
            if (el.style.transform !== _tf) { el.style.transform = _tf; el.style.transformOrigin = '50% 100%'; }
          } else if (el.style.transform) { el.style.transform = ''; el.style.transformOrigin = ''; }
        }
        if (el) {
          const lying = npc.state === 'sleeping' && npc.kind === 'parent';
          const _prA = (typeof PROJ !== 'undefined' && el.parentNode) ? PROJ.forRooms(el.parentNode.id) : null;
          const _anA = _prA ? _prA.P(npc.x, npc.y, 0) : null;
          el.style.left = (_anA ? _anA.x : npc.x) + 'px';
          el.style.top = (lying ? ((_anA ? _anA.y : npc.y) - 35) : ((_anA ? _anA.y : npc.y) - 14 - (NPC_SPR_H[npc.key] || 50))) + 'px'; // v9.40 名牌 14 + 精靈高（規格統一後 50）；v9.51 已投影場景改用投影錨點
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
          if (npc.atDinner && npc.state === 'seated') el.style.zIndex = String(Z_LAYER.DINNER_CLIP); // v9.45 晚餐爸媽夾層：椅背(172)之後、桌前板(196)之前，臉不再被椅背蓋住
          else if (npc.insideLoc === 'store' && npc.state === 'seated' && !npc.shopStage) el.style.zIndex = String(npc.x >= 700 ? Z_LAYER.POST_CLIP : Z_LAYER.SEATED_CLIP); // v9.45 超商坐姿分流：櫃檯崗位 945（櫃檯拆兩帶之間）、窗邊客 955（吧台兩帶之間）
          else if (npc.insideLoc === 'restaurant' && npc.state === 'seated') el.style.zIndex = String(npc.key === 'chef' ? Z_LAYER.POST_CLIP : Z_LAYER.SEATED_CLIP); // v9.47 廚師納入夾層 945（鐵板拆兩帶之間，臉不再被鐵板蓋住）
          else if ((npc.insideLoc === 'school' || npc.insideLoc === 'club' || npc.insideLoc === 'study') && npc.state === 'seated') el.style.zIndex = String(Z_LAYER.POST_CLIP); // v9.47 學校坐姿站前；v9.65 社團室同規板兩帶之間 945：臉在上帶之上、下帶只蓋腿（學生/講台老師/辦公室老師同規） // v9.18 吧台客人夾在雙層前景之間（上身在廚師帶之上、腿被客人帶蓋住）
          else if (npc.insideLoc && npc.state !== 'seated') el.style.zIndex = String(Z_LAYER.WALK); // v9.20.1 室內走動/站立的人在傢俱前景之上——走過櫃檯前不再被切頭
          else if (npc.inside && npc.state !== 'seated' && npc.state !== 'sleeping') el.style.zIndex = String(Z_LAYER.WALK); // v9.30 住家同規：爸媽用舊 inside 旗標（insideLoc 為 null）原本沒被上條命中；走動/站立在傢俱前景之上，晚餐入座維持夾層深度、睡覺維持深度讓棉被（z260）蓋在上面
          else if (npc.insideLoc === 'store' && (npc.shopStage === 'queue' || npc.shopStage === 'pay')) el.style.zIndex = String(Z_LAYER.WALK); // v9.20.1 排隊結帳的人站在櫃檯南側，本來就該在櫃檯前面
          const tag = el.querySelector('.npc-zzz-tag');
          if (tag) tag.style.display = npc.state === 'sleeping' ? 'inline' : 'none';
          // v9.40 表情接線：睡覺閉眼／宿敵競賽超前生氣／用餐咀嚼嘴（素材本來就在精靈裡，只差接線）
          if (svg) {
            const rv = npc.kind === 'rival' && Array.isArray(gameState.rivals) ? gameState.rivals.find(r => r.key === npc.key) : null;
            const you = typeof raceProgYou === 'function' ? raceProgYou() : 0;
            const wantFace = npc.state === 'sleeping' ? 'sleeping' : (rv && rv.prog > you ? 'angry' : 'normal');
            const wantMouth = wantFace === 'sleeping' ? 'sleeping' : (npc.state === 'seated' && npc.dest === 'restaurant' && npc.phase === 'eat' ? 'eating' : 'normal');
            const fk = wantFace + '/' + wantMouth;
            if (svg._fk !== fk) {
              svg._fk = fk;
              const tog = (cls, on) => { const g = svg.querySelector(cls); if (g) g.style.display = on ? '' : 'none'; };
              tog('.pixel-eyes-normal', wantFace === 'normal'); tog('.pixel-eyes-sleeping', wantFace === 'sleeping'); tog('.pixel-eyes-angry', wantFace === 'angry');
              tog('.pixel-mouth-normal', wantMouth === 'normal'); tog('.pixel-mouth-sleeping', wantMouth === 'sleeping'); tog('.pixel-mouth-eating', wantMouth === 'eating');
            }
          }
          const roleEl = el.querySelector('.npc-role');
          if (roleEl) { const rd = npcDef(npc.key); const onDuty = npc.kind === 'staff' && npc.state === 'seated' && rd && npc.dest === rd.work; roleEl.style.display = onDuty ? 'inline' : 'none'; if (onDuty) { const ic = { store: '🏪', restaurant: '🍳', school: '📚', library: '📖', gym: '🏋️' }[rd.work] || '💼'; setIco(roleEl, ic); } } // v9.16.1 值班標籤：一眼看出誰在上班、在做什麼
          const dishEl = el.querySelector('.npc-dish');
          if (dishEl) {
            if (npc.state === 'seated' && npc.dest === 'restaurant') {
              if (dishEl.style.display !== 'block') dishEl.style.display = 'block';
              const _dt = npc.phase === 'eat' ? todaysSpecial().emoji : (npc.phase === 'wait' ? '🍳' : '📋');
              setIco(dishEl, _dt);
              const _rp = restPlateScreen(npc.x, npc.y); syncDishPlate(npc, npc.phase === 'eat' && npc.insideLoc === 'restaurant', todaysSpecial().emoji, _rp.x, _rp.y, 'rest-rooms', Z_LAYER.FOOD); // v9.19 菜上桌；v9.20 食物置頂；v9.51 盤子放投影桌面上
            } else if (npc.state === 'seated' && npc.windowSeat != null) {
              if (dishEl.style.display !== 'block') dishEl.style.display = 'block';
              setIco(dishEl, '🍜');
              if (Math.random() < 0.002) npcSay(npc, NOODLE_NIGHT_LINES[Math.floor(Math.random() * NOODLE_NIGHT_LINES.length)]); // v9.16 深夜窗邊對話
              syncDishPlate(npc, npc.insideLoc === 'store', '🍜', npc.x - 9, npc.y - 40, 'store-rooms', Z_LAYER.FOOD); // v9.19 泡麵碗放窗邊吧台上；v9.20 食物置頂
            } else if (npc.state === 'seated' && npc.dest === 'store' && npc.windowSeat == null && !(npc.kind === 'staff' && npcDef(npc.key) && npcDef(npc.key).work === 'store')) {
              if (dishEl.style.display !== 'block') dishEl.style.display = 'block';
              const _tag = npc.shopStage === 'pay' ? '🧾' : (npc.picked ? '🧺' : '🛒'); // v9.20 結帳中；v9.19 拿過東西＝提籃
              setIco(dishEl, _tag);
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
    // ================= v9.55 小鎮外觀 2.5D 化（報告批次 5）：K=1.1 全鎮投影 =================
    // 世界邏輯座標 1150x920 不動；城鎮畫面改 TOWN_PROJ 投影（螢幕 1715x650）。
    // 地面/路網/公園/大樹/路燈/道具全走 P() 取樣；六棟建築本體＝投影基座 box3（地台）＋既有娃娃屋立面（與室內「框＝窗」同語彙），
    // 角色/NPC 在世界地圖上的定位由 coords/render 以 parent id 查本投影器自動換算（registerRooms 'town-map'/'npc-layer')。
    const TOWN_PROJ = PROJ.make(PROJ.K_TOWN, 8, 215); // v9.64 OY 170->215：多樓層外觀最高點（住家 2F+斜頂）入鏡，世界下移 45
    const TOWN_PW = 1715, TOWN_PH = 695; // v9.64 配合 OY 下移
    PROJ.registerRooms('town-map', TOWN_PROJ);
    PROJ.registerRooms('npc-layer', TOWN_PROJ);
    function buildTownDecor() {
      const svg = document.querySelector('.map-decorations');
      if (!svg || document.getElementById('town-decor25')) return;
      const pr = TOWN_PROJ;
      const poly = (list, fill, extra) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"' + (extra || '') + '/>';
      const quad = (x, z, w, d, fill, extra) => poly([pr.P(x, z, 0), pr.P(x + w, z, 0), pr.P(x + w, z + d, 0), pr.P(x, z + d, 0)], fill, extra);
      const seg = (a, b, stroke, w, extra) => '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" stroke="' + stroke + '" stroke-width="' + w + '"' + (extra || '') + '/>';
      const circ = (xp, r, fill, extra) => '<circle cx="' + xp.x.toFixed(1) + '" cy="' + xp.y.toFixed(1) + '" r="' + r + '" fill="' + fill + '"' + (extra || '') + '/>';
      let s = '<defs><pattern id="grassPat" width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill="#8fd07a"/><rect width="24" height="24" fill="#79bd67"/><rect x="24" y="24" width="24" height="24" fill="#79bd67"/></pattern><pattern id="parkPat" width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill="#8fae6b"/><rect x="24" y="24" width="24" height="24" fill="#7fa663"/><rect width="24" height="24" fill="#7fa663"/></pattern></defs>';
      s += '<g id="town-decor25">';
      // 地面＋公園帶
      s += quad(0, 0, 1150, 920, 'url(#grassPat)');
      s += quad(0, 336, 1150, 184, 'url(#parkPat)');
      // 巷道＋人行道＋A/B 街（路網邏輯不動，形狀走投影）
      s += quad(0, 254, 56, 566, '#9a8d7a') + quad(1094, 254, 56, 566, '#9a8d7a');
      [360, 450, 540, 630, 720].forEach(z => { s += quad(24, z, 7, 40, '#f2b544') + quad(1118, z, 7, 40, '#f2b544'); });
      s += quad(0, 224, 1150, 30, '#c8d2cc') + quad(0, 254, 1150, 76, '#9a8d7a');
      s += quad(0, 714, 1150, 30, '#c8d2cc') + quad(0, 744, 1150, 76, '#9a8d7a');
      s += seg(pr.P(0, 256, 0), pr.P(1150, 256, 0), 'rgba(245,242,228,0.5)', 3) + seg(pr.P(0, 327, 0), pr.P(1150, 327, 0), 'rgba(245,242,228,0.5)', 3);
      s += seg(pr.P(0, 746, 0), pr.P(1150, 746, 0), 'rgba(245,242,228,0.5)', 3) + seg(pr.P(0, 817, 0), pr.P(1150, 817, 0), 'rgba(245,242,228,0.5)', 3);
      for (let x = 10; x < 1150; x += 110) { s += quad(x, 288, 46, 7, '#f2b544') + quad(x, 778, 46, 7, '#f2b544'); }
      // 六棟基座（投影 box3 地台）＋門前小徑
      const PLOTS = [[42, 16, 312, 215, '#c8d2cc'], [422, 16, 298, 215, '#cfc4b0'], [802, 16, 298, 215, '#e8d8a8'], [42, 506, 298, 215, '#cfe8f5'], [422, 506, 298, 215, '#c8d2cc'], [802, 506, 312, 215, '#d9a066']];
      PLOTS.forEach(([px, pz, pw, pd, col]) => { s += quad(px - 6, pz + pd + 2, pw + 12, 14, 'rgba(24,32,66,0.10)'); s += pr.box3(px - 4, pz - 4, pw + 8, pd + 8, 20, col); }); // v9.62 牆根接地陰影：建築不再像貼紙浮在草地上
      [[181, 196], [554, 196], [934, 196], [181, 676], [554, 676], [941, 676]].forEach(([dx, dz]) => { s += quad(dx, dz, 34, 48, '#f3e2c7', ' stroke="#cfc4b0" stroke-width="2"'); });
      // 公園：池塘＋小徑（曲線取樣投影）＋長椅＋花圃
      s += pr.planeCircle(250, 428, 0, 118, '#7fd4e8');
      s += pr.planeCircle(250, 424, 0, 104, '#7fd4e8');
      const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
      const pathPts = [];
      for (let i = 0; i <= 12; i++) { const [bx, bz] = bez([0, 478], [300, 442], [600, 502], [900, 464], i / 12); pathPts.push(pr.P(bx, bz, 0)); }
      for (let i = 1; i <= 8; i++) { const [bx, bz] = bez([900, 464], [1200, 426], [1150, 472], [1150, 472], i / 8); pathPts.push(pr.P(bx, bz, 0)); }
      s += '<polyline points="' + pr.pts(pathPts) + '" fill="none" stroke="#e8d8a8" stroke-width="26" stroke-linecap="round"/>';
      [[430, 352], [700, 352], [430, 486], [700, 486]].forEach(([bx, bz]) => { s += pr.box3(bx, bz, 46, 9, 7, '#a9743f'); });
      const flower = (fx, fz) => circ(pr.P(fx, fz, 2), 3.5, '#e89bb0') + circ(pr.P(fx + 12, fz + 3, 2), 3, '#f5c86a') + circ(pr.P(fx + 24, fz, 2), 3.5, '#cfc4b0');
      [60, 380, 560, 900, 1060].forEach(fx => { s += flower(fx, 356); });
      [120, 620, 960].forEach(fx => { s += flower(fx, 496); });
      // 樹木（立牌：樹幹＋樹冠 billboard，落點/影走投影）
      const tree = (cx, cz, th, r) => {
        let o = pr.groundShadow(cx, cz, r * 0.55);
        o += seg(pr.P(cx, cz, 0), pr.P(cx, cz, th), '#8d5a2c', 4);
        o += circ(pr.P(cx, cz, th + 13), r, '#7fa663') + circ(pr.P(cx - r * 0.62, cz, th + 6), r * 0.62, '#8fae6b') + circ(pr.P(cx + r * 0.62, cz, th + 6), r * 0.62, '#7fa663');
        return o;
      };
      s += tree(430, 483, 21, 24) + tree(880, 410, 18, 21) + tree(1064, 490, 22, 25) + tree(180, 905, 21, 24) + tree(600, 914, 18, 21) + tree(990, 907, 23, 26);
      const pine = (cx, cz) => seg(pr.P(cx, cz, 0), pr.P(cx, cz, 16), '#8d5a2c', 4)
        + poly([pr.P(cx - 11, cz, 14), pr.P(cx + 11, cz, 14), pr.P(cx, cz, 32)], '#3f9142')
        + poly([pr.P(cx - 9, cz, 26), pr.P(cx + 9, cz, 26), pr.P(cx, cz, 44)], '#7fa663');
      s += pine(60, 420) + pine(814, 910);
      // 地標大樹（id 保留：花季切換）
      let bt = pr.groundShadow(575, 448, 30);
      bt += poly([pr.P(569, 448, 0), pr.P(581, 448, 0), pr.P(581, 448, 48), pr.P(569, 448, 48)], '#8d5a2c');
      bt += seg(pr.P(575, 448, 34), pr.P(575, 448, 48), '#8d5a2c', 4);
      bt += circ(pr.P(575, 448, 82), 46, '#7fa663') + circ(pr.P(536, 448, 66), 30, '#8fae6b') + circ(pr.P(614, 448, 66), 30, '#7fa663') + circ(pr.P(575, 448, 114), 27, '#8fae6b');
      bt += '<g id="big-tree-blossom" style="display:none;">' + circ(pr.P(548, 448, 98), 12, 'rgba(255,183,213,0.85)') + circ(pr.P(602, 448, 106), 10, 'rgba(255,183,213,0.85)') + circ(pr.P(575, 448, 82), 11, 'rgba(255,183,213,0.8)') + circ(pr.P(622, 448, 84), 8, 'rgba(255,183,213,0.8)') + circ(pr.P(528, 448, 84), 8, 'rgba(255,183,213,0.8)') + '</g>';
      bt += seg(pr.P(608, 448, 64), pr.P(608, 448, 44), '#8d5a2c', 2);
      bt += quad(598, 446, 20, 4, '#a9743f');
      s += '<g id="big-tree">' + bt + '</g>';
      // 路燈（柱＋頭，光池在 street-glows 層）
      const lamp = (lx, lz) => seg(pr.P(lx, lz, 0), pr.P(lx, lz, 24), '#4a4a55', 4) + circ(pr.P(lx, lz, 27), 6, '#ffe9a8', ' stroke="#4a4a55" stroke-width="2"');
      [180, 480, 780, 1080].forEach(lx => { s += lamp(lx, 344); });
      [270, 660, 1050].forEach(lx => { s += lamp(lx, 722); });
      // 道具：郵筒/告示牌/腳踏車/販賣機
      s += pr.box3(86, 352, 16, 12, 20, '#c2452d');
      const mslot = pr.P(89, 364.6, 14); s += '<rect x="' + mslot.x.toFixed(1) + '" y="' + mslot.y.toFixed(1) + '" width="10" height="4" fill="#fffdf5"/>';
      s += pr.box3(1006, 350, 30, 6, 22, '#f5f0e6');
      s += poly([pr.P(1010, 356.5, 11), pr.P(1032, 356.5, 11), pr.P(1032, 356.5, 14), pr.P(1010, 356.5, 14)], '#c2452d');
      s += poly([pr.P(1010, 356.5, 17), pr.P(1032, 356.5, 17), pr.P(1032, 356.5, 20), pr.P(1010, 356.5, 20)], '#9a8d7a');
      const w1 = pr.P(634, 253, 5), w2 = pr.P(646, 253, 5);
      s += '<circle cx="' + w1.x.toFixed(1) + '" cy="' + w1.y.toFixed(1) + '" r="5" fill="none" stroke="#5d4028" stroke-width="2"/><circle cx="' + w2.x.toFixed(1) + '" cy="' + w2.y.toFixed(1) + '" r="5" fill="none" stroke="#26324b" stroke-width="2"/>';
      s += seg(pr.P(634, 253, 5), pr.P(640, 253, 14), '#c2452d', 2) + seg(pr.P(640, 253, 14), pr.P(646, 253, 5), '#c2452d', 2);
      s += pr.box3(1082, 676, 20, 14, 40, '#cfe8f5');
      s += poly([pr.P(1085, 690.5, 20), pr.P(1099, 690.5, 20), pr.P(1099, 690.5, 36), pr.P(1085, 690.5, 36)], '#7fd4e8');
      // 美化道具組（id/display 與舊版相同，worldMutations 切換）
      let arch = poly([pr.P(1014, 458, 0), pr.P(1023, 458, 0), pr.P(1023, 458, 34), pr.P(1014, 458, 34)], '#8a6248') + poly([pr.P(1077, 458, 0), pr.P(1086, 458, 0), pr.P(1086, 458, 34), pr.P(1077, 458, 34)], '#8a6248');
      const arcPts = [];
      for (let i = 0; i <= 10; i++) { const a = Math.PI - i / 10 * Math.PI; arcPts.push(pr.P(1050 + Math.cos(a) * 42, 458, 34 + Math.sin(a) * 20)); }
      arch += '<polyline points="' + pr.pts(arcPts) + '" fill="none" stroke="#3f9142" stroke-width="6"/>';
      arch += circ(pr.P(1024, 458, 46), 5, '#e89bb0') + circ(pr.P(1050, 458, 54), 5.6, '#f2b544') + circ(pr.P(1076, 458, 46), 5, '#e89bb0');
      s += '<g id="beauty-arch" style="display:none;">' + arch + '</g>';
      let ftn = pr.planeCircle(300, 452, 0, 52, '#aee6fa') + pr.planeCircle(300, 452, 1, 44, '#7fd4e8');
      ftn += poly([pr.P(294, 452, 0), pr.P(306, 452, 0), pr.P(306, 452, 36), pr.P(294, 452, 36)], '#cfc4b0');
      ftn += circ(pr.P(300, 452, 38), 6, '#f7f1e3');
      const spray = (x2, z2, h2, cls) => '<polyline class="beauty-spray ' + cls + '" points="' + pr.pts([pr.P(300, 452, 40), pr.P(x2, z2, h2), pr.P(x2 + (x2 < 300 ? -8 : 8), z2, h2 - 14)]) + '" fill="none" stroke="#aee6fa" stroke-width="3"/>';
      ftn += spray(282, 440, 56, '') + spray(300, 436, 62, 's2') + spray(318, 440, 56, 's3');
      s += '<g id="beauty-fountain" style="display:none;">' + ftn + '</g>';
      let stat = pr.box3(682, 402, 36, 14, 20, '#cfc4b0') + pr.box3(678, 400, 44, 16, 6, '#cfc4b0');
      stat += poly([pr.P(692, 404, 20), pr.P(708, 404, 20), pr.P(708, 404, 50), pr.P(692, 404, 50)], '#ca6f1e');
      stat += circ(pr.P(700, 404, 56), 8, '#d98e32');
      stat += poly([pr.P(688, 404, 62), pr.P(712, 404, 62), pr.P(712, 404, 66), pr.P(688, 404, 66)], '#1a1a24');
      s += '<g id="beauty-statue" style="display:none;">' + stat + '</g>';
      s += '</g>';
      svg.setAttribute('viewBox', '0 0 ' + TOWN_PW + ' ' + TOWN_PH);
      svg.innerHTML = s;
    }
    function buildSkyLayer() {
      const map = document.getElementById('town-map');
      if (!map) return;
      buildTownDecor(); // v9.55 小鎮投影裝飾（先於光影層建立）
      buildExteriors(); // v9.64 多樓層外觀（先於光影層：挖孔按新剪影）
      if (!document.getElementById('street-glows')) {
        const sg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        sg.id = 'street-glows';
        sg.setAttribute('viewBox', '0 0 ' + TOWN_PW + ' ' + TOWN_PH);
        map.appendChild(sg);
        const glowDefs = '<defs><radialGradient id="lampGlowWarm"><stop offset="0%" stop-color="#ffc86e" stop-opacity="0.9"/><stop offset="55%" stop-color="#ffc86e" stop-opacity="0.38"/><stop offset="100%" stop-color="#ffc86e" stop-opacity="0"/></radialGradient><radialGradient id="lampGlowCool"><stop offset="0%" stop-color="#bedcfe" stop-opacity="0.9"/><stop offset="55%" stop-color="#bedcfe" stop-opacity="0.38"/><stop offset="100%" stop-color="#bedcfe" stop-opacity="0"/></radialGradient></defs>';
        sg.innerHTML = glowDefs + TOWN_LAMPS.map(l => TOWN_PROJ.planeCircle(l.x, l.gy || l.y, 0, l.r ? 42 : 95, l.c ? 'url(#lampGlowCool)' : 'url(#lampGlowWarm)', 0.85)).join(''); // v9.56 光池改徑向漸層柔邊＋半徑 120→95（v9.55 均勻實心橢圓邊界生硬、像大色塊糊在房子上——實機「光線怪怪的」） // v9.55 光池改投影 planeCircle（§2.4：禁止正圓光暈浮在平面上）；v9.48 光池心南移步行線（gy）保留
        const sw = document.createElement('div'); // v9.22.1 store-beacon/store-lit 補光片退役：改由 #sky-night 在超商處挖空
        sw.id = 'sky-warm';
        map.appendChild(sw);
        const sn = document.createElement('div');
        sn.id = 'sky-night';
        map.appendChild(sn);
      }
      document.querySelectorAll('.iso-island').forEach(island => {
        if (!island.querySelector('.island-shade')) {
          const g = document.createElement('div');
          g.className = 'island-shade'; // v9.48 每島局部夜色（取代 island-glow 與動態挖空）：暗度由營業權重連續決定，室內外共用一層
          g.dataset.loc = island.id.replace('landmark-', '');
          island.appendChild(g);
        }
      });
    }
    // v9.41 光源清單（單一光影心智模型）：路燈位置以本表為準——地面 SVG 的燈柱畫在同座標、光暈由本表生成，不再手調
    // v9.74 R2 H4：光池中心（gy）對齊燈柱基座（原 A 列偏北 26 單位、B 列偏南 38）
    const TOWN_LAMPS = [{ x: 180, y: 318, gy: 344 }, { x: 480, y: 318, gy: 344 }, { x: 780, y: 318, gy: 344 }, { x: 1080, y: 318, gy: 344 }, { x: 270, y: 696, gy: 722 }, { x: 660, y: 696, gy: 722 }, { x: 1050, y: 696, gy: 722 }, { x: 1092, y: 696, r: 40, c: '190, 220, 255' }]; // 末項是 B 街自動販賣機（冷色小光暈，v9.48 半徑縮小避免與東燈疊成一坨——光3）
    // ===== v9.64 多樓層外觀（批次 A）：建築規格單一真相——外觀生成、夜間挖孔、北側淡化共用本表 =====
    const BLD_FLOOR_H = 88; // 層高定版 ≈ 人物高 50 x 1.8
    const BLD3D = {
      home: { fx: 123, fz: 76, fw: 150, fd: 95, floors: 2, wall: '#f3e2c7', accent: '#e67e22', roof: 'gable', doorX: 198, pos: [177.6, 190.5] },
      store: { fx: 491, fz: 73, fw: 160, fd: 100, floors: 1, wall: '#eef4fb', accent: '#2ed573', roof: 'signband', sign: '便利商店', doorX: 571, pos: [559.5, 190.5], winW: 40, winH: 34 },
      restaurant: { fx: 871, fz: 73, fw: 160, fd: 100, floors: 1, wall: '#f7e8e0', accent: '#c2452d', roof: 'flat', sign: '餐廳', doorX: 951, pos: [946.5, 190.5] },
      school: { fx: 98, fz: 556, fw: 185, fd: 115, floors: 3, wall: '#ece5d3', accent: '#2c3e50', roof: 'flat', sign: '台東女中', tower: true, bell: true, doorX: 198, pos: [475.5, 422.5] },
      library: { fx: 488, fz: 561, fw: 165, fd: 105, floors: 1, wall: '#e6efe4', accent: '#1e8449', roof: 'flat', sign: '圖書館', doorX: 571, pos: [855.5, 422.5] },
      gym: { fx: 898, fz: 516, fw: 120, fd: 40, floors: 1, wall: '#f0e6da', accent: '#ca6f1e', roof: 'flat', doorX: 958, pos: [1237.6, 422.5], overlay: true, holeRect: [1235.6, 420.5, 202.8, 133.5] }
    };
    function bldHeight(b) { return b.floors * BLD_FLOOR_H + (b.roof === 'gable' ? 36 : 9); }
    function segBox(pr, x, z, w, d, h0, h1, color, withTop) {
      const P = pr.P, pts = pr.pts, sh = PROJ.shade;
      let out = '<polygon points="' + pts([P(x + w, z, h0), P(x + w, z + d, h0), P(x + w, z + d, h1), P(x + w, z, h1)]) + '" fill="' + sh(color, 0.6) + '" stroke="#5d4028" stroke-width="2" stroke-linejoin="round"/>';
      out += '<polygon points="' + pts([P(x, z + d, h0), P(x + w, z + d, h0), P(x + w, z + d, h1), P(x, z + d, h1)]) + '" fill="' + color + '" stroke="#5d4028" stroke-width="2" stroke-linejoin="round"/>';
      if (withTop) out += '<polygon points="' + pts([P(x, z, h1), P(x + w, z, h1), P(x + w, z + d, h1), P(x, z + d, h1)]) + '" fill="' + sh(color, 1.24) + '"/>';
      return out;
    }
    function buildExteriors() {
      for (const loc in BLD3D) {
        const isl = document.getElementById('landmark-' + loc);
        if (!isl || isl.querySelector('.bld-ext')) continue;
        const b = BLD3D[loc];
        const pr = PROJ.make(PROJ.K_TOWN, 8 - b.pos[0], 215 - b.pos[1]);
        const P = pr.P, pts = pr.pts, sh = PROJ.shade, FH = BLD_FLOOR_H, H = b.floors * FH;
        let g = '';
        g += '<polygon points="' + pts([P(b.fx + 7, b.fz + 4, 0), P(b.fx + b.fw + 7, b.fz + 4, 0), P(b.fx + b.fw + 7, b.fz + b.fd + 4, 0), P(b.fx + 7, b.fz + b.fd + 4, 0)]) + '" fill="rgba(74,50,32,0.16)"/>';
        for (let f = 0; f < b.floors; f++) {
          if (f > 0) g += segBox(pr, b.fx - 3, b.fz - 3, b.fw + 6, b.fd + 6, f * FH - 3, f * FH + 3, sh(b.accent, 0.8), false);
          g += segBox(pr, b.fx, b.fz, b.fw, b.fd, f * FH, (f + 1) * FH, b.wall, false);
        }
        const winW = b.winW || 20, winH = b.winH || 26;
        const sx0 = P(b.fx, b.fz + b.fd, 0).x, sx1 = P(b.fx + b.fw, b.fz + b.fd, 0).x;
        const doorCx = P(b.doorX, b.fz + b.fd, 0).x, groundY = P(b.fx, b.fz + b.fd, 0).y;
        const nWin = b.fw >= 170 ? 5 : (b.fw >= 150 ? 4 : 3);
        for (let f = 0; f < b.floors; f++) {
          const wy = P(b.fx, b.fz + b.fd, f * FH + 30).y;
          for (let i = 0; i < nWin; i++) {
            const wx = sx0 + 16 + (nWin === 1 ? 0 : i * ((sx1 - sx0 - 32 - winW) / (nWin - 1)));
            if (f === 0 && Math.abs(wx + winW / 2 - doorCx) < 30) continue;
            g += '<rect x="' + wx.toFixed(1) + '" y="' + (wy - winH).toFixed(1) + '" width="' + winW + '" height="' + winH + '" fill="#f7e8c9" stroke="#5d4028" stroke-width="1.5"/>';
          }
        }
        g += '<rect x="' + (doorCx - 13).toFixed(1) + '" y="' + (groundY - 44).toFixed(1) + '" width="26" height="44" fill="' + sh(b.accent, 0.62) + '" stroke="#5d4028" stroke-width="2"/><circle cx="' + (doorCx + 7).toFixed(1) + '" cy="' + (groundY - 21).toFixed(1) + '" r="2.2" fill="#f2b544"/>';
        if (loc === 'restaurant') g += segBox(pr, b.fx - 2, b.fz, b.fw + 4, b.fd + 12, 54, 59, b.accent, false);
        if (b.roof === 'gable') {
          const midZ = b.fz + b.fd / 2, rc = '#c2452d';
          g += '<polygon points="' + pts([P(b.fx - 6, b.fz - 6, H), P(b.fx + b.fw + 6, b.fz - 6, H), P(b.fx + b.fw + 6, midZ, H + 36), P(b.fx - 6, midZ, H + 36)]) + '" fill="' + sh(rc, 0.78) + '"/>';
          g += '<polygon points="' + pts([P(b.fx + b.fw + 6, b.fz - 6, H), P(b.fx + b.fw + 6, b.fz + b.fd + 6, H), P(b.fx + b.fw + 6, midZ, H + 36)]) + '" fill="' + sh(rc, 0.6) + '"/>';
          g += '<polygon points="' + pts([P(b.fx - 6, b.fz + b.fd + 6, H), P(b.fx + b.fw + 6, b.fz + b.fd + 6, H), P(b.fx + b.fw + 6, midZ, H + 36), P(b.fx - 6, midZ, H + 36)]) + '" fill="' + rc + '"/>';
        } else if (b.roof === 'signband') {
          g += '<g class="bld-sign">' + segBox(pr, b.fx - 4, b.fz - 4, b.fw + 8, b.fd + 8, H - 30, H, b.accent, true);
          const bx0 = P(b.fx - 4, b.fz + b.fd + 4, 0).x, bx1 = P(b.fx + b.fw + 4, b.fz + b.fd + 4, 0).x, byC = P(b.fx, b.fz + b.fd + 4, H - 15).y;
          g += '<text x="' + ((bx0 + bx1) / 2).toFixed(1) + '" y="' + byC.toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="700" fill="#ffffff" stroke="#5d4028" stroke-width="3.5" paint-order="stroke" stroke-linejoin="round">' + b.sign + '</text></g>';
        } else {
          g += segBox(pr, b.fx - 4, b.fz - 4, b.fw + 8, b.fd + 8, H, H + 9, b.wall, true);
          if (b.tower) {
            g += segBox(pr, b.fx + b.fw - 52, b.fz + 8, 30, 30, H + 9, H + 42, '#5b7fa6', false);
            g += segBox(pr, b.fx + b.fw - 55, b.fz + 5, 36, 36, H + 42, H + 47, '#2c3e50', true);
          }
          if (b.sign) {
            const sw2 = b.sign.length * 19 + 26, scx = P(b.fx + b.fw / 2, b.fz + b.fd + 4, 0).x, stopY = P(b.fx, b.fz + b.fd + 4, H + 9).y;
            g += '<rect x="' + (scx + 6).toFixed(1) + '" y="' + (stopY - 8).toFixed(1) + '" width="4" height="8" fill="#5d4028"/><rect x="' + (scx + sw2 - 10).toFixed(1) + '" y="' + (stopY - 8).toFixed(1) + '" width="4" height="8" fill="#5d4028"/>';
            g += '<rect x="' + scx.toFixed(1) + '" y="' + (stopY - 32).toFixed(1) + '" width="' + sw2 + '" height="24" fill="' + b.accent + '" stroke="#5d4028" stroke-width="1.5"/>';
            g += '<text x="' + (scx + sw2 / 2).toFixed(1) + '" y="' + (stopY - 20).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="700" fill="#ffffff" stroke="#5d4028" stroke-width="3.5" paint-order="stroke" stroke-linejoin="round">' + b.sign + '</text>';
          }
        }
        if (b.bell) {
          const bx = P(b.fx + b.fw - 37, b.fz + 38, 0).x - 10, by = P(b.fx, b.fz + 38, H + 16).y;
          g += '<g id="school-bell"><use href="#i-bell" x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="20" height="20"/></g>';
        }
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'bld-ext'); svg.setAttribute('data-loc', loc); svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = g;
        isl.appendChild(svg);
        if (!b.overlay) {
          isl.classList.add('ext-mode');
          const host = isl.querySelector('.island-platform-top');
          if (host) host.querySelectorAll(':scope > *').forEach(ch => { if (!(ch.id || '').endsWith('-stage')) ch.classList.add('dollhouse-art'); });
        }
      }
    }
    // v9.70 R4：圖書館 annex 靜態閱覽室（純背景、零 NPC/座位/互動；視覺語言比照學校 2F 圖書館）
    function updateBuildingExteriors() {
      buildExteriors();
      const cl = (typeof currentLoc !== 'undefined') ? currentLoc : null;
      const npcs = (typeof gameState !== 'undefined' && gameState.npcs) || [];
      for (const loc in BLD3D) {
        const isl = document.getElementById('landmark-' + loc); if (!isl) continue;
        isl.classList.toggle('inside-now', cl === loc);
        const svg = isl.querySelector('.bld-ext'); if (!svg) continue;
        const b = BLD3D[loc];
        let hit = false;
        for (let i = 0; i < npcs.length; i++) { const n = npcs[i]; if (n.insideLoc) continue; if (n.x >= b.fx - 6 && n.x <= b.fx + b.fw + 6 && n.y >= b.fz - 64 && n.y <= b.fz - 2) { hit = true; break; } }
        const want = hit ? '0.4' : '1';
        if (svg.dataset.fade !== want) { svg.dataset.fade = want; svg.style.opacity = want; }
      }
      syncFloorStack(); // v9.65 樓層疊層/膠囊跟著每 tick 同步
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
        inner = '<polygon points="150,242 670,84 1190,242" fill="#c2452d" stroke="#5d4028" stroke-width="5" stroke-linejoin="round"/>'
          + '<rect x="110" y="242" width="1120" height="16" fill="#b04a32" stroke="#5d4028" stroke-width="4"/>'
          + '<circle cx="670" cy="196" r="17" fill="#f7e8c9" stroke="#5d4028" stroke-width="4"/>';
      } else {
        const col = kind === 'school' ? '#46586a' : kind === 'restaurant' ? '#c2452d' : kind === 'library' ? '#2f5d3a' : '#79a95c';
        inner = '<rect x="70" y="180" width="1200" height="18" fill="' + col + '" stroke="#5d4028" stroke-width="4"/>'
          + '<rect x="96" y="198" width="1148" height="42" fill="' + col + '" stroke="#5d4028" stroke-width="5"/>';
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
      const plat = document.querySelector('#landmark-school .island-platform');
      if (plat) plat.classList.toggle('explode-open', inB);
      const host = document.querySelector('#landmark-school .island-platform-top');
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

    // v9.64 夜間挖孔 = 新外觀剪影（BLD3D 規格直算，不再量島框）
    let _skyHolesCache = null;
    function skyHoles() {
      if (_skyHolesCache) return _skyHolesCache;
      const out = {};
      for (const k in BLD3D) {
        const b = BLD3D[k];
        if (b.holeRect) { out[k] = b.holeRect; continue; }
        const H = bldHeight(b);
        const x0 = TOWN_PROJ.P(b.fx, b.fz, 0).x - 2, x1 = TOWN_PROJ.P(b.fx + b.fw, b.fz + b.fd, 0).x + 2;
        const y0 = TOWN_PROJ.P(b.fx, b.fz, H).y - 2, y1 = TOWN_PROJ.P(b.fx, b.fz + b.fd, 0).y + 2;
        out[k] = [Math.round(x0 * 10) / 10, Math.round(y0 * 10) / 10, Math.round((x1 - x0) * 10) / 10, Math.round((y1 - y0) * 10) / 10];
      }
      _skyHolesCache = out;
      return out;
    }
    function skyOpenWeights() {
      // v9.48 營業權重（連續版，取代開/關二值的 skyOpenSig）：開門後/關門前 30 分鐘線性過渡，
      // 每島局部夜色 alpha = nf x (1-w) —— 開關店不再瞬間翻轉（實機報告光5）
      const h = (gameState.hour || 0) + (gameState.minute || 0) / 60;
      const dow = gameState.dayOfWeek || 1;
      const weekday = dow >= 1 && dow <= 5;
      const ramp = (o, c) => (h < o || h >= c) ? 0 : Math.min(1, Math.min((h - o) * 2, (c - h) * 2, 1));
      return {
        home: (() => { let w = ramp(6, 23); if (h >= 17 && h < 23) w = Math.max(w, 0.55); else if (h >= 23 || h < 6) w = Math.max(w, 0.25); return w; })(), store: 1, restaurant: ramp(7, 22), // v9.74 R2 H2：住家不是商店——晚間活動時段保底亮度、深夜留夜燈級暗度，不壓成全黑
        school: weekday ? ramp(8, 16) : 0, library: ramp(8, 21), gym: ramp(6, 22),
      };
    }
    function skyNightClip() {
      // v9.48 靜態全挖六島：全域夜色只蓋街道/公園，島的暗度改由各自的 .island-shade 連續決定（不再隨開關改 clip）
      const _o = [TOWN_PROJ.P(0, 0, 0), TOWN_PROJ.P(1150, 0, 0), TOWN_PROJ.P(1150, 920, 0), TOWN_PROJ.P(0, 920, 0)]; // v9.55 外輪廓改投影平行四邊形（§2.4）
      let pts = _o.map(p => p.x.toFixed(0) + 'px ' + p.y.toFixed(0) + 'px').join(', ') + ', ' + _o[0].x.toFixed(0) + 'px ' + _o[0].y.toFixed(0) + 'px';
      const holes = skyHoles();
      for (const k in holes) {
        const r = holes[k];
        pts += ', ' + r[0] + 'px ' + r[1] + 'px, ' + r[0] + 'px ' + (r[1] + r[3]) + 'px, ' + (r[0] + r[2]) + 'px ' + (r[1] + r[3]) + 'px, ' + (r[0] + r[2]) + 'px ' + r[1] + 'px, ' + r[0] + 'px ' + r[1] + 'px';
      }
      return 'polygon(evenodd, ' + pts + ')';
    }
    let _skyEls = null, _skyLastKey = '';
    function updateSkyLighting() {
      if (!_skyEls) {
        buildSkyLayer();
        _skyEls = {
          sn: document.getElementById('sky-night'), sw: document.getElementById('sky-warm'),
          sg: document.getElementById('street-glows'),
          shades: [...document.querySelectorAll('.island-shade')],
          map: document.getElementById('town-map'),
          gr: document.getElementById('grade-layer'),
        };
        if (!_skyEls.sn) _skyEls = null;
      }
      if (!_skyEls) return;
      const hf = (gameState.hour || 0) + (gameState.minute || 0) / 60;
      const nf = nightFactorAt(hf);
      const wf = warmFactorAt(hf);
      const weights = skyOpenWeights();
      const key = Math.round(nf * 40) + '|' + Math.round(wf * 40) + '|' + Object.values(weights).map(w => Math.round(w * 20)).join(',');
      if (key === _skyLastKey) return; // v9.10.4: 值沒變就不寫 style (減少每 tick 的版面重算，鏡頭更順)
      _skyLastKey = key;
      if (!_skyEls.sn.style.clipPath) _skyEls.sn.style.clipPath = skyNightClip(); // v9.48 靜態全挖，設一次即可
      const blossom = document.getElementById('big-tree-blossom'); // v9.43 地標大樹花季（現實 3–5 月變粉）
      if (blossom) { const m = new Date().getMonth() + 1; const on = m >= 3 && m <= 5; const want = on ? '' : 'none'; if (blossom.style.display !== want) blossom.style.display = want; }
      const r3 = v => String(Math.round(v * 1000) / 1000);
      _skyEls.sn.style.opacity = r3(nf * 0.9);
      if (_skyEls.map) _skyEls.map.style.setProperty('--doll-night', r3(1 - nf * 0.5)); // v9.74 R2 H1：街上人物同暗（連續值，與夜色同步）
      syncFsShade(); // v9.74 R2 H3
      _skyEls.sw.style.opacity = r3(wf);
      _skyEls.shades.forEach(g => { g.style.opacity = r3(nf * (1 - (weights[g.dataset.loc] || 0)) * 0.9); }); // v9.48 局部夜色：營業中 0、關店與街道同暗、邊界連續過渡；室內共用同一層（光7）
      if (_skyEls.map) _skyEls.map.classList.toggle('night-on', nf > 0.5); // 光10：夜裡上鎖建築停用 brightness，避免暗上加暗
      const storeIsl = document.getElementById('landmark-store'); if (storeIsl) storeIsl.classList.toggle('night-lit', nf > 0.45); // v9.16.1 整間店自己亮，不補光暈
      _skyEls.sg.style.opacity = r3(nf * 0.85); // v9.22.1 超商的亮來自 #sky-night 的挖空（見 style.css），不再疊補光片
      if (_skyEls.gr) _skyEls.gr.style.opacity = r3(0.16 * (1 - nf) * (1 - wf * 0.6)); // v9.61 日間 grading：正午最強、黃昏讓位給暖色層、入夜歸零
    }


    // ================= v9.17 超商大場景（比照住家：大室內塞進框框、室內鏡頭、前景圖層） =================
    // ================= v9.54 超商 2.5D 化（報告批次 4a）：場景改投影生成 =================
    // 分層：#store-bg25＋#store-front25（z950 櫃檯南面）＋#store-front25b（z960 窗邊吧台南面）——
    // 店員 945＜櫃檯 950、窗邊客 955＜吧台 960、排隊 975 在最上，舊三帶 (940/950/960) 語意原樣保留，舊層退役。
    // 櫃檯 (796,100,328x24,h13)：店員崗位 z150 在南緣之南 26（站姿南面淨空公式 h<=25-26*0.378-c）；吧台 (16,224,396x20,h11)：窗邊座 z262 在南緣之南 18。
    const STORE_PROJ = PROJ.makeIndoor(PROJ.K_INDOOR, 24, 172); // v9.67 室內 45°
    const STORE_PW = 1340;
    PROJ.registerRooms('store-rooms', STORE_PROJ);
    function buildStoreRoomsHTML() {
      const pr = STORE_PROJ, WH = 170;
      const poly = (list, fill, extra) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"' + (extra || '') + '/>';
      const faceRect = (x, z, w, h0, h1, fill) => poly([pr.P(x, z, h0), pr.P(x + w, z, h0), pr.P(x + w, z, h1), pr.P(x, z, h1)], fill);
      const txt = (xp, str, size, fill, anchor) => '<text x="' + xp.x.toFixed(1) + '" y="' + xp.y.toFixed(1) + '" font-size="' + size + '" font-weight="900" fill="' + fill + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + str + '</text>';
      const PAL = ['#c2452d', '#79a95c', '#ffcc00', '#3a6ea5', '#9b59b6', '#ff9f0a', '#27ae60', '#e67e22', '#ff5b6a', '#79a95c', '#e09a3e', '#79a95c'];
      const goodsRow = (x0, n, zF, hBot, hTop, seed, wdt) => { let o = ''; for (let i = 0; i < n; i++) { o += faceRect(x0 + i * ((wdt || 14) + 4), zF, wdt || 14, hBot, hTop - ((seed + i * 7) % 4), PAL[(seed + i) % 12]); } return o; };
      let bg = '', front = '', frontB = '';
      // 牆＋地板磚
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(0, 0, WH)], '#fff6e8');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#fff6e8', 0.85));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#efe9e0');
      bg += floorBands(pr, poly, '#ffffff', 0.5, 48, 0, 1150, 0, 300); // v9.62 磁磚列（與既有磚縫同節奏）
      let lines = '';
      for (let z = 48; z < 300; z += 48) { const a = pr.P(0, z, 0), b = pr.P(1150, z, 0); lines += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; }
      [150, 430, 710, 990].forEach(x => { const a = pr.P(x, 0, 0), b = pr.P(x, 300, 0); lines += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; });
      bg += '<g stroke="#e8d8a8" stroke-width="2">' + lines + '</g>';
      // 招牌帶＋牆上櫃：飲料冰櫃/冰品/麵包
      bg += faceRect(0, 0.6, 1150, 114, 124, '#79a95c');
      bg += txt(pr.P(26, 0, 142), '24H MART 歡迎光臨', 17, '#2f5d3a');
      bg += txt(pr.P(986, 0, 142), '冰櫃・麵包・關東煮', 12, '#8d5a2c');
      bg += pr.wallDecoN(330, 700, 114, 168, '#cfc4b0');
      bg += faceRect(336, 0.6, 174, 120, 162, 'rgba(223,243,255,0.9)') + faceRect(518, 0.6, 174, 120, 162, 'rgba(223,243,255,0.9)');
      bg += goodsRow(342, 6, 0.7, 126, 140, 0, 12) + goodsRow(342, 6, 0.7, 144, 156, 5, 12) + goodsRow(524, 6, 0.7, 126, 140, 3, 12) + goodsRow(524, 6, 0.7, 144, 156, 8, 12);
      bg += pr.wallDecoN(726, 876, 114, 168, '#fed7aa');
      bg += txt(pr.P(748, 0, 140), '🍦 冰品', 15, '#a93226');
      bg += pr.wallDecoN(892, 1120, 114, 168, '#ffe9b8');
      bg += txt(pr.P(922, 0, 140), '🥐 現烤麵包', 15, '#8d5a2c');
      bg += pr.planeCircle(36, 40, 0, 12, '#79a95c');
      bg += pr.planeCircle(1114, 40, 0, 12, '#79a95c');
      // 中央貨架 x2（全 bg：走道在南、無人坐其後）
      [[380, '零食 SNACKS', 2], [580, '泡麵・飲料', 7]].forEach(([sx, label, seed]) => {
        bg += pr.box3(sx, 100, 180, 34, 42, '#1e8449');
        bg += faceRect(sx, 134.6, 180, 33, 42, '#2f5d3a');
        bg += txt(pr.P(sx + 12, 135, 37), label, 9, '#ffffff');
        bg += goodsRow(sx + 8, 8, 134.6, 20, 29, seed) + goodsRow(sx + 8, 8, 134.6, 6, 15, seed + 4);
      });
      // 特價桌
      bg += pr.box3(400, 216, 300, 22, 12, '#b0743e');
      bg += faceRect(400, 238.6, 120, 2, 10, '#8d5a2c');
      bg += txt(pr.P(412, 239, 7), '本週特價', 10, '#ffffff');
      // 窗邊吧台（上面進 bg、南面進 frontB z960）＋窗玻璃帶＋吧台椅
      const bar = pr.boxFaces(16, 224, 396, 20, 11, '#8d5a2c');
      bg += bar.back; frontB += bar.front;
      bg += poly([pr.P(24, 268, 0), pr.P(404, 268, 0), pr.P(404, 296, 0), pr.P(24, 296, 0)], 'rgba(191,227,255,0.85)');
      [119, 214, 309].forEach(x => { const a = pr.P(x, 268, 0), b = pr.P(x, 296, 0); bg += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" stroke="#4a3220" stroke-width="2"/>'; });
      [110, 200, 290].forEach(x => { bg += pr.planeCircle(x, 262, 0, 10, '#e74c3c'); });
      // 收銀櫃檯（上面進 bg、南面進 front z950）＋收銀機/關東煮
      const counter = pr.boxFaces(796, 100, 328, 24, 13, '#ffffff');
      bg += counter.back; front += counter.front;
      front += txt(pr.P(922, 124.6, 6), '歡迎光臨', 11, '#2f5d3a');
      bg += pr.box3(896, 102, 24, 10, 22, '#2c3e50');
      bg += faceRect(898, 112.6, 20, 12, 20, '#7d9dbd');
      bg += pr.box3(950, 102, 24, 10, 22, '#2c3e50');
      bg += faceRect(952, 112.6, 20, 12, 20, '#7d9dbd');
      bg += pr.box3(806, 102, 44, 16, 18, '#e67e22');
      bg += txt(pr.P(810, 119, 13), '🍢關東煮', 9, '#ffe9a8');
      // 入口墊
      bg += pr.box3(505, 264, 120, 28, 2, '#79a95c');
      bg += txt(pr.P(540, 283, 4), '入 口', 11, '#2f5d3a');
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + STORE_PW + ' 300" style="position:absolute; left:0; top:0; width:' + STORE_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      return svgOpen('store-bg25', 0) + bg + '</svg>' + svgOpen('store-front25', 950) + front + '</svg>' + svgOpen('store-front25b', 960) + frontB + '</svg>'
        + '<div class="store-chip" style="left:452px; top:214px;" onclick="noodleHitClick(event)">' + icoSvg('noodle') + ' 窗邊泡麵</div>';
    }

    function ensureStoreInterior() {
      if (document.getElementById('store-stage')) return;
      const host = document.querySelector('#landmark-store .island-platform-top') || document.querySelector('#landmark-store .island-platform') || document.getElementById('landmark-store');
      if (!host) return;
      const stage = document.createElement('div');
      stage.id = 'store-stage';
      stage.innerHTML = '<div id="store-rooms">' + buildStoreRoomsHTML() + '</div>';
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
        const maxPan = Math.max(0, STORE_PW - visible);
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
      if (visible >= STORE_PW) pan = (STORE_PW - visible) / 2;
      else pan = Math.max(0, Math.min(STORE_PW - visible, focusX - visible / 2));
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
          if (!np2) { np2 = document.createElement('div'); np2.id = 'player-noodle-plate'; np2.className = 'dish-plate'; np2.innerHTML = icoSvg('noodle'); rooms.appendChild(np2); }
          const _np = STORE_PROJ.P(gameState.noodleSeat.x, 246, 11);
          np2.style.display = 'block'; np2.style.left = (_np.x - 9) + 'px'; np2.style.top = (_np.y - 9) + 'px'; np2.style.zIndex = '990'; // v9.20 食物置頂（v9.54 改放投影吧台面）
        } else if (np2) np2.style.display = 'none';
      }
      if (cw && playerIn) cw.style.zIndex = (currentState === 'working') ? String(Z_LAYER.POST_CLIP) : (gameState.noodleUntil ? String(Z_LAYER.SEATED_CLIP) : '975'); // v9.45 主角打工站櫃檯兩帶之間(945)、窗邊吃麵在吧台兩帶之間(955)，臉不再沉到櫃檯後 // v9.20.1 站櫃檯後/窗邊吃麵維持夾層；走動/站立在傢俱前景之上
      let focus = STORE_PROJ.P(935, 200, 0).x;
      if (playerIn) focus = STORE_PROJ.P(gameState.currentX || 565, gameState.currentY || 212, 0).x;
      else {
        const inner = (gameState.npcs || []).find(n => n.insideLoc === 'store');
        if (inner) focus = STORE_PROJ.P(inner.x, inner.y, 0).x;
      }
      updateStorePan(focus);
      syncMiniExplode('store', 'store', STORE_PROJ, _storePanCur); // v9.67
    }



    // ================= v9.21 學校大場景（比照住家/超商/餐廳：大教室塞框框、課桌前景層） =================
    // ================= v9.53 學校 2.5D 化（報告批次 3a）：場景改投影生成 =================
    // 分層同範本：#school-bg25＋#school-front25（z950）——講台/課桌南面在坐姿 945 之上、與舊 940/950 雙層同構，舊層退役。
    // 講台足跡 (524,104,102x18,h16)：老師崗位 (575,134) 在南緣之南 12（frontHMax(12,25,6)=23.5）；課桌 (sx-28,sy-40,56x26,h11)，座位在南緣之南 14。
    const SCHOOL_PROJ = PROJ.makeIndoor(PROJ.K_INDOOR, 24, 172); // v9.67 室內 45°
    const SCHOOL_PW = 1340;
    PROJ.registerRooms('school-rooms', SCHOOL_PROJ);
    function stairSvg(pr) { // v9.65 三層共用樓梯間（東北角，STAIR_PT 對位）：階梯向北爬升＋牆上標示
      let o = '';
      for (let i = 0; i < 5; i++) o += pr.box3(1046, 108 - i * 16, 78, 16, 5 + i * 6, i % 2 ? '#a9743f' : '#c98d54');
      const lp = pr.P(1085, 0, 128);
      o += '<text x="' + lp.x.toFixed(1) + '" y="' + lp.y.toFixed(1) + '" font-size="12" font-weight="900" fill="#8a6248" text-anchor="middle">樓 梯</text>';
      return o;
    }
    function stairSvgAt(pr, x0) { // v9.66 參數化樓梯（住家 x0=500；學校版 stairSvg 為 x0=1046 專用）
      let o = '';
      for (let i = 0; i < 5; i++) o += pr.box3(x0, 108 - i * 16, 78, 16, 5 + i * 6, i % 2 ? '#a9743f' : '#c98d54');
      const lp = pr.P(x0 + 39, 0, 128);
      o += '<text x="' + lp.x.toFixed(1) + '" y="' + lp.y.toFixed(1) + '" font-size="12" font-weight="900" fill="#8a6248" text-anchor="middle">樓 梯</text>';
      return o;
    }
    function buildSchoolRoomsHTML() {
      const pr = SCHOOL_PROJ, WH = 156;
      const poly = (list, fill, extra) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"' + (extra || '') + '/>';
      const faceRect = (x, z, w, h0, h1, fill) => poly([pr.P(x, z, h0), pr.P(x + w, z, h0), pr.P(x + w, z, h1), pr.P(x, z, h1)], fill);
      const txt = (xp, str, size, fill, anchor) => '<text x="' + xp.x.toFixed(1) + '" y="' + xp.y.toFixed(1) + '" font-size="' + size + '" font-weight="900" fill="' + fill + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + str + '</text>';
      const PAL = ['#c2452d', '#5b7fa6', '#7fa663', '#e09a3e', '#8e44ad', '#e65c00', '#27ae60', '#c2452d', '#ffcc00', '#f5f0e6'];
      const spineRow = (x0, x1, zF, hBot, hTop, seed) => { let o = ''; let cx = x0; let i = seed; while (cx < x1 - 10) { const bw = 9 + ((i * 37) % 5); const bh = (hTop - hBot) - ((i * 53) % 7); o += faceRect(cx, zF, bw, hBot, hBot + Math.max(10, bh), PAL[i % 10]); cx += bw + 2; i++; } return o; };
      let bg = '', front = '';
      // 牆＋地板
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(0, 0, WH)], '#efe9e0');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#efe9e0', 0.8));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#d9a066');
      bg += floorBands(pr, poly, '#c98d54', 0.45, 44, 0, 1150, 0, 300); // v9.62 木板交錯帶
      let lines = '';
      for (let z = 42; z < 300; z += 44) { const a = pr.P(0, z, 0), b = pr.P(1150, z, 0); lines += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; }
      bg += '<g stroke="#b0743e" stroke-width="2">' + lines + '</g>';
      // 辦公室窗＋書架牆板＋標籤
      bg += pr.wallDecoN(36, 140, 76, 146, '#bedcfe');
      const wx1 = pr.P(88, 0, 76), wx2 = pr.P(88, 0, 146), wy1 = pr.P(36, 0, 111), wy2 = pr.P(140, 0, 111);
      bg += '<line x1="' + wx1.x.toFixed(1) + '" y1="' + wx1.y.toFixed(1) + '" x2="' + wx2.x.toFixed(1) + '" y2="' + wx2.y.toFixed(1) + '" stroke="#4a3220" stroke-width="2"/><line x1="' + wy1.x.toFixed(1) + '" y1="' + wy1.y.toFixed(1) + '" x2="' + wy2.x.toFixed(1) + '" y2="' + wy2.y.toFixed(1) + '" stroke="#4a3220" stroke-width="2"/>';
      const osun = pr.P(60, 0, 128); bg += '<circle cx="' + osun.x.toFixed(1) + '" cy="' + osun.y.toFixed(1) + '" r="9" fill="#f2b544"/>';
      bg += pr.wallDecoN(160, 282, 74, 148, '#8a6248');
      bg += spineRow(168, 274, 0.6, 116, 140, 3) + spineRow(168, 274, 0.6, 80, 102, 11);
      bg += faceRect(157, 0.6, 128, 110, 113, '#6d4c41');
      bg += pr.wallDecoN(48, 166, 54, 72, '#fff6e8');
      bg += txt(pr.P(58, 0, 63), '教師辦公室', 11, '#8a6248');
      // 老師桌（南面進 front）＋桌上物＋電腦小桌＋辦公椅背
      const tdesk = pr.boxFaces(104, 128, 108, 20, 13, '#8a6248');
      bg += tdesk.back; front += tdesk.front;
      bg += pr.planeCircle(126, 136, 13.4, 5, '#ffffff');
      bg += poly([pr.P(146, 132, 13.4), pr.P(166, 132, 13.4), pr.P(166, 142, 13.4), pr.P(146, 142, 13.4)], '#f5f0e6');
      bg += pr.box3(186, 130, 10, 8, 17, '#7fa663');
      const plf = pr.P(191, 134, 23); bg += '<circle cx="' + plf.x.toFixed(1) + '" cy="' + plf.y.toFixed(1) + '" r="7" fill="#8fae6b"/>';
      bg += pr.box3(222, 100, 66, 16, 12, '#6d4c41');
      bg += pr.box3(232, 102, 38, 4, 38, '#c8d2cc');
      bg += faceRect(234, 106.6, 34, 16, 34, '#f7f1e3');
      const mdot = pr.P(266, 106.6, 20); bg += '<circle cx="' + mdot.x.toFixed(1) + '" cy="' + mdot.y.toFixed(1) + '" r="3" fill="#7fa663"/>';
      bg += pr.box3(134, 138, 42, 8, 20, '#6d4c41');
      // 隔間柱面（半透明）＋班牌
      bg += poly([pr.P(302, 6, 0), pr.P(302, 206, 0), pr.P(302, 206, 132), pr.P(302, 6, 132)], '#9a8d7a', ' opacity="0.45"');
      bg += poly([pr.P(302, 96, 80), pr.P(302, 142, 80), pr.P(302, 142, 100), pr.P(302, 96, 100)], '#fff6e8');
      bg += txt(pr.P(308, 119, 90), '三年二班', 10, '#8a6248');
      // 黑板＋粉筆
      bg += pr.wallDecoN(340, 820, 54, 158, '#6d4c41');
      bg += pr.wallDecoN(346, 814, 60, 152, '#2f5d3a');
      bg += txt(pr.P(374, 0, 130), '今日課程：數學・國文・自然', 14, '#f7f1e3');
      bg += txt(pr.P(374, 0, 104), '3/4 ＋ 1/2 ＝ ？　（這題考試會考！）', 13, '#cfe8f5');
      bg += faceRect(752, 0.6, 34, 72, 76, '#f5f0e6') + faceRect(722, 0.6, 16, 72, 76, '#f0b98a');
      // 時鐘
      const ck = pr.P(838, 0, 130);
      bg += '<circle cx="' + ck.x.toFixed(1) + '" cy="' + ck.y.toFixed(1) + '" r="15" fill="#ffffff" stroke="#4a3220" stroke-width="2"/><line x1="' + ck.x.toFixed(1) + '" y1="' + ck.y.toFixed(1) + '" x2="' + ck.x.toFixed(1) + '" y2="' + (ck.y - 10).toFixed(1) + '" stroke="#4a3220" stroke-width="2"/><line x1="' + ck.x.toFixed(1) + '" y1="' + ck.y.toFixed(1) + '" x2="' + (ck.x + 7).toFixed(1) + '" y2="' + (ck.y + 4).toFixed(1) + '" stroke="#4a3220" stroke-width="2"/>';
      // 榮譽榜（四個名次文字 id 保留，其他系統會寫入）
      bg += pr.wallDecoN(860, 1128, 86, 156, '#c9a06a');
      bg += txt(pr.P(878, 0, 140), '🏆 榮譽榜', 12, '#6d4c41');
      bg += '<text id="board-r1i" x="' + pr.P(878, 0, 120).x.toFixed(1) + '" y="' + pr.P(878, 0, 120).y.toFixed(1) + '" font-size="11" font-weight="900" fill="#6d4c41">🥇</text>';
      bg += '<text id="board-r2i" x="' + pr.P(972, 0, 120).x.toFixed(1) + '" y="' + pr.P(972, 0, 120).y.toFixed(1) + '" font-size="11" font-weight="900" fill="#6d4c41">🥈</text>';
      bg += '<text id="board-r3i" x="' + pr.P(878, 0, 104).x.toFixed(1) + '" y="' + pr.P(878, 0, 104).y.toFixed(1) + '" font-size="11" font-weight="900" fill="#6d4c41">🥉</text>';
      bg += '<text id="board-4i" x="' + pr.P(972, 0, 104).x.toFixed(1) + '" y="' + pr.P(972, 0, 104).y.toFixed(1) + '" font-size="11" font-weight="900" fill="#6d4c41">⭐</text>';
      // 講台（南面進 front）＋課桌 x6（南面進 front、桌上書）
      const podium = pr.boxFaces(524, 104, 102, 18, 16, '#795548');
      bg += podium.back; front += podium.front;
      bg += poly([pr.P(540, 108, 16.4), pr.P(560, 108, 16.4), pr.P(560, 118, 16.4), pr.P(540, 118, 16.4)], '#f5f0e6');
      [[430, 185], [590, 185], [750, 185], [430, 250], [590, 250], [750, 250]].forEach(([sx, sy]) => {
        const dk = pr.boxFaces(sx - 28, sy - 40, 56, 26, 11, '#a9743f');
        bg += dk.back; front += dk.front;
        bg += poly([pr.P(sx - 16, sy - 36, 11.4), pr.P(sx - 3, sy - 36, 11.4), pr.P(sx - 3, sy - 27, 11.4), pr.P(sx - 16, sy - 27, 11.4)], '#c2452d');
        bg += poly([pr.P(sx + 4, sy - 35, 11.4), pr.P(sx + 16, sy - 35, 11.4), pr.P(sx + 16, sy - 27, 11.4), pr.P(sx + 4, sy - 27, 11.4)], '#f5f0e6');
      });
      // 主角桌上的自習書堆（class/數量與舊版相同，updateStudyBooks 以 index 控制顯示）
      const bookCols = ['#c2452d', '#5b7fa6', '#7fa663', '#8e44ad', '#e09a3e'];
      let books = '';
      bookCols.forEach((c, i) => { books += '<polygon class="book-layer" points="' + pr.pts([pr.P(564, 216, 11.5 + i * 2.2), pr.P(584, 216, 11.5 + i * 2.2), pr.P(584, 228, 11.5 + i * 2.2), pr.P(564, 228, 11.5 + i * 2.2)]) + '" fill="' + c + '"/>'; });
      bg += '<g id="study-books-school-in" class="study-books">' + books + '</g>';
      // 閱讀角：地毯＋書架＋坐墊＋盆栽＋立燈
      bg += pr.planeCircle(1000, 228, 0, 110, '#aee6fa', 0.55);
      bg += '<polygon points="' + pr.planeCirclePts(1000, 228, 0.5, 88) + '" fill="none" stroke="#7fd4e8" stroke-width="2"/>';
      bg += pr.box3(888, 120, 224, 24, 26, '#8a6248');
      bg += spineRow(896, 958, 144.6, 6, 24, 5) + spineRow(1040, 1104, 144.6, 6, 24, 9);
      bg += poly([pr.P(952, 124, 26.5), pr.P(1048, 124, 26.5), pr.P(1048, 140, 26.5), pr.P(952, 140, 26.5)], '#fff6e8');
      bg += txt(pr.P(964, 132, 32), '📚 閱讀角', 10, '#8a6248');
      bg += pr.planeCircle(935, 246, 0, 30, '#f0b98a');
      bg += pr.planeCircle(1065, 250, 0, 30, '#7fd4e8');
      bg += pr.box3(1108, 196, 16, 12, 10, '#8a6248');
      const pf1 = pr.P(1116, 202, 17), pf2 = pr.P(1108, 200, 13);
      bg += '<circle cx="' + pf1.x.toFixed(1) + '" cy="' + pf1.y.toFixed(1) + '" r="10" fill="#8fae6b"/><circle cx="' + pf2.x.toFixed(1) + '" cy="' + pf2.y.toFixed(1) + '" r="7" fill="#85c173"/>';
      const lp0 = pr.P(884, 196, 0), lp1 = pr.P(884, 196, 34);
      bg += pr.planeCircle(884, 212, 0, 30, '#f2b544', 0.18);
      bg += '<line x1="' + lp0.x.toFixed(1) + '" y1="' + lp0.y.toFixed(1) + '" x2="' + lp1.x.toFixed(1) + '" y2="' + lp1.y.toFixed(1) + '" stroke="#4a3220" stroke-width="2.5"/>';
      bg += '<polygon points="' + (lp1.x - 8).toFixed(1) + ',' + lp1.y.toFixed(1) + ' ' + (lp1.x + 8).toFixed(1) + ',' + lp1.y.toFixed(1) + ' ' + (lp1.x + 4).toFixed(1) + ',' + (lp1.y - 14).toFixed(1) + ' ' + (lp1.x - 4).toFixed(1) + ',' + (lp1.y - 14).toFixed(1) + '" fill="#f2b544" stroke="#4a3220" stroke-width="1.5"/>';
      // 魚缸（掛牆水族箱，魚的動畫 class 保留）
      let tank = pr.box3(876, 104, 140, 14, 8, '#8a6248');
      tank += pr.box3(880, 84, 132, 20, 36, '#7fd4e8');
      tank += faceRect(884, 104.6, 124, 4, 32, 'rgba(191,227,255,0.55)');
      tank += faceRect(884, 104.6, 124, 4, 10, '#7fa663');
      const fa = pr.P(898, 96, 20), fb = pr.P(972, 94, 13), bb = pr.P(1000, 92, 7);
      tank += '<g class="fish-a" transform="translate(' + fa.x.toFixed(1) + ',' + fa.y.toFixed(1) + ')"><rect x="0" y="0" width="10" height="5" fill="#e67e22"/><rect x="-3" y="1" width="3" height="3" fill="#e67e22"/><rect x="7" y="1" width="1" height="1" fill="#4a3220"/></g>';
      tank += '<g class="fish-b" transform="translate(' + fb.x.toFixed(1) + ',' + fb.y.toFixed(1) + ')"><rect x="0" y="0" width="9" height="4" fill="#f5c86a"/><rect x="9" y="1" width="3" height="2" fill="#f5c86a"/></g>';
      tank += '<circle class="fish-bub" cx="' + bb.x.toFixed(1) + '" cy="' + bb.y.toFixed(1) + '" r="2" fill="#ffffff" opacity="0.85"/>';
      bg += '<g id="school-tank">' + tank + '</g>';
      // 入口墊
      bg += pr.box3(515, 264, 120, 28, 2, '#8a6248');
      bg += txt(pr.P(575, 283, 4), '入 口', 11, '#ffe9b8', 'middle');
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + SCHOOL_PW + ' 300" style="position:absolute; left:0; top:0; width:' + SCHOOL_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      bg += stairSvg(pr); // v9.65 樓梯間（1F 看是上樓梯）
      return svgOpen('school-bg25', 0) + bg + '</svg>' + svgOpen('school-front25', 950) + front + '</svg>';
    }

    function ensureSchoolInterior() {
      if (document.getElementById('school-stage')) return;
      const host = document.querySelector('#landmark-school .island-platform-top') || document.querySelector('#landmark-school .island-platform') || document.getElementById('landmark-school');
      if (!host) return;
      const pf = document.getElementById('podium-fg'); if (pf) pf.remove(); // v9.21 舊講台前景層退役（新場景自帶講台前景）
      const stage = document.createElement('div');
      stage.id = 'school-stage';
      stage.innerHTML = '<div id="school-rooms">' + buildSchoolRoomsHTML() + '</div>';
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
        const maxPan = Math.max(0, SCHOOL_PW - visible);
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
      if (visible >= SCHOOL_PW) pan = (SCHOOL_PW - visible) / 2;
      else pan = Math.max(0, Math.min(SCHOOL_PW - visible, focusX - visible / 2));
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
      let focus = SCHOOL_PROJ.P(575, 200, 0).x;
      if (playerIn) focus = SCHOOL_PROJ.P(gameState.currentX || 560, gameState.currentY || 212, 0).x;
      else {
        const inner = (gameState.npcs || []).find(n => n.insideLoc === 'school');
        if (inner) focus = SCHOOL_PROJ.P(inner.x, inner.y, 0).x;
      }
      updateSchoolPan(focus);
    }



    // ================= v9.27 操場大場景（全棟最後一間：露天球場塞框框、夕陽＋投籃） =================
    const GYM_HOOP = { x: 1030, y: 96 }; // 籃框位置（場景座標）
    // ================= v9.54 操場 2.5D 化（報告批次 4b）：露天場景，地面全走投影 =================
    // 無牆無家具前景：單層 #gym-bg25（天空 polygon 保留 gym-sky id、燈組保留 gym-floods id，updateGymLighting 邏輯不變）。
    // 地面畫到 z560 填滿框高（玩法座標仍在 z<=300）；籃框立於 (1030,96)，框緣中心＝P(1030,96,30)，投籃動畫改投影錨點。
    const GYM_PROJ = PROJ.make(PROJ.K_INDOOR, 24, 88);
    const GYM_PW = 1340;
    PROJ.registerRooms('gym-rooms', GYM_PROJ);
    function buildGymRoomsHTML() {
      const pr = GYM_PROJ;
      const poly = (list, fill, extra) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"' + (extra || '') + '/>';
      const txt = (xp, str, size, fill, anchor) => '<text x="' + xp.x.toFixed(1) + '" y="' + xp.y.toFixed(1) + '" font-size="' + size + '" font-weight="900" fill="' + fill + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + str + '</text>';
      const seg = (a, b, stroke, w) => '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" stroke="' + stroke + '" stroke-width="' + w + '"/>';
      const rrPts = (x, z, w, d, r) => { // 圓角矩形周界取樣（邏輯座標）→投影點列
        const out = [];
        const corner = (cx, cz, a0) => { for (let i = 0; i <= 4; i++) { const a = a0 + i / 4 * Math.PI / 2; out.push(pr.P(cx + Math.cos(a) * r, cz + Math.sin(a) * r, 0)); } };
        corner(x + w - r, z + r, -Math.PI / 2); corner(x + w - r, z + d - r, 0); corner(x + r, z + d - r, Math.PI / 2); corner(x + r, z + r, Math.PI);
        return out;
      };
      let bg = '';
      // 天空（id 保留：updateGymLighting 以 setAttribute('fill') 換色）＋太陽/雲（螢幕座標，與舊版相同）
      bg += '<polygon id="gym-sky" points="0,0 ' + GYM_PW + ',0 ' + pr.pts([pr.P(1150, 0, 0), pr.P(0, 0, 0)]) + '" fill="#aee6fa"/>';
      bg += '<circle id="gym-sun" cx="950" cy="30" r="16" fill="#f2b544" stroke="#e09a3e" stroke-width="2"/>';
      bg += '<g fill="#ffffff" opacity="0.85"><ellipse cx="240" cy="26" rx="42" ry="9"/><ellipse cx="272" cy="20" rx="26" ry="8"/><ellipse cx="700" cy="40" rx="36" ry="8"/><ellipse cx="726" cy="35" rx="22" ry="7"/></g>';
      // 地面（延伸到 z560 填滿框高）＋地平線樹叢
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 560, 0), pr.P(0, 560, 0)], '#7fa663');
      bg += floorBands(pr, poly, '#8fae6b', 0.45, 56, 0, 1150, 0, 560); // v9.62 草地修剪條紋
      [[60, 17], [112, 13], [330, 15], [520, 12], [880, 14], [1108, 16]].forEach(([tx, tr]) => { const c = pr.P(tx, 4, 15); bg += '<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="' + tr + '" fill="#1e8449"/>'; });
      // 夜間燈組（id 保留）
      let floods = '';
      [120, 430, 760, 1062].forEach(fx => {
        const g = pr.P(fx, 26, 41);
        floods += '<circle cx="' + g.x.toFixed(1) + '" cy="' + g.y.toFixed(1) + '" r="24" fill="#ffe9b8" opacity="0.45"/>';
        floods += seg(pr.P(fx, 26, 0), pr.P(fx, 26, 36), '#2c3e50', 4);
        floods += poly([pr.P(fx - 12, 26, 36), pr.P(fx + 12, 26, 36), pr.P(fx + 12, 26, 47), pr.P(fx - 12, 26, 47)], '#fff6e8', ' stroke="#4a3220" stroke-width="1.4"');
      });
      bg += '<g id="gym-floods" opacity="0">' + floods + '</g>';
      // 看台三階
      bg += pr.box3(36, 86, 220, 10, 26, '#9a8d7a');
      bg += pr.box3(36, 98, 220, 10, 17, '#9a8d7a');
      bg += pr.box3(36, 110, 220, 10, 8, '#9a8d7a');
      // 跑道（圓角矩形投影取樣）＋內場＋起跑線
      bg += '<polygon points="' + pr.pts(rrPts(36, 128, 764, 158, 76)) + '" fill="#c2452d" stroke="#4a3220" stroke-width="2.5"/>';
      bg += '<polyline points="' + pr.pts(rrPts(58, 146, 720, 122, 60)) + '" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="9 7"/>';
      bg += '<polygon points="' + pr.pts(rrPts(88, 158, 664, 98, 48)) + '" fill="#7fa663"/>';
      [[150, 240], [330, 420], [510, 600]].forEach(([x0, x1]) => { bg += seg(pr.P(x0, 207, 0), pr.P(x1, 207, 0), 'rgba(255,255,255,0.8)', 2); });
      // 球場＋中線/中圈/三分線
      bg += poly([pr.P(812, 96, 0), pr.P(1130, 96, 0), pr.P(1130, 264, 0), pr.P(812, 264, 0)], '#d9a066', ' stroke="#4a3220" stroke-width="2.5"');
      bg += floorBands(pr, poly, '#c98d54', 0.4, 42, 812, 1130, 96, 264); // v9.62 球場木板帶
      bg += seg(pr.P(971, 96, 0), pr.P(971, 264, 0), '#ffffff', 2);
      bg += '<polygon points="' + pr.planeCirclePts(971, 180, 0, 26) + '" fill="none" stroke="#ffffff" stroke-width="2"/>';
      bg += poly([pr.P(1006, 138, 0), pr.P(1130, 138, 0), pr.P(1130, 222, 0), pr.P(1006, 222, 0)], 'rgba(181,101,29,0.5)');
      const arcPts = [];
      for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + i / 10 * Math.PI; arcPts.push(pr.P(1006 + Math.cos(a) * 74, 180 + Math.sin(a) * 74, 0)); }
      bg += '<polyline points="' + pr.pts(arcPts) + '" fill="none" stroke="#ffffff" stroke-width="2"/>';
      // 籃架：柱＋板（z90 平面）＋內框＋框緣（中心 P(1030,96,30)）＋籃網
      bg += seg(pr.P(1055, 88, 0), pr.P(1055, 88, 34), '#2c3e50', 5);
      bg += poly([pr.P(1022, 90, 34), pr.P(1088, 90, 34), pr.P(1088, 90, 76), pr.P(1022, 90, 76)], '#ffffff', ' stroke="#e65c00" stroke-width="2.5"');
      bg += poly([pr.P(1040, 90, 40), pr.P(1070, 90, 40), pr.P(1070, 90, 62), pr.P(1040, 90, 62)], 'none', ' stroke="#e65c00" stroke-width="2"');
      const rim = pr.P(1030, 96, 30);
      bg += '<ellipse cx="' + rim.x.toFixed(1) + '" cy="' + rim.y.toFixed(1) + '" rx="9" ry="3.4" fill="none" stroke="#e65c00" stroke-width="2.6"/>';
      bg += seg(pr.P(1024, 97, 29), pr.P(1027, 97, 16), '#f7f1e3', 1.4) + seg(pr.P(1030, 98, 29), pr.P(1030, 98, 15), '#f7f1e3', 1.4) + seg(pr.P(1036, 97, 29), pr.P(1033, 97, 16), '#f7f1e3', 1.4);
      // 司令台看板
      bg += seg(pr.P(570, 20, 0), pr.P(570, 20, 26), '#2c3e50', 4) + seg(pr.P(580, 20, 0), pr.P(580, 20, 26), '#2c3e50', 4);
      bg += poly([pr.P(518, 20, 26), pr.P(632, 20, 26), pr.P(632, 20, 62), pr.P(518, 20, 62)], '#232f47', ' stroke="#4a3220" stroke-width="2"');
      bg += txt(pr.P(575, 20, 44), '操 場', 13, '#f2b544', 'middle');
      // 入口墊
      bg += pr.box3(515, 264, 120, 28, 2, '#795548');
      bg += txt(pr.P(575, 283, 4), '入 口', 11, '#ffe9b8', 'middle');
      return '<svg id="gym-bg25" viewBox="0 0 ' + GYM_PW + ' 300" style="position:absolute; left:0; top:0; width:' + GYM_PW + 'px; height:300px; pointer-events:none;">' + bg + '</svg>'
        + '<button class="gym-shoot-btn" onpointerdown="event.stopPropagation()" onclick="playerShoot()">🏀 投籃</button>';
    }

    let _gymPanManual = null;
    let _gymManualUntil = 0;
    let _gymPanCur = 0; let _gymPanT = 0;
    let _gymWasIn = false;
    let _gymRunT0 = null; // v9.27.1 跑步迴圈起始時刻（跟拍推算用）
    let _gymLightKey = '';
    function applyGymPan(pan, sc) {
      const rooms = document.getElementById('gym-rooms');
      if (!rooms) return;
      _gymPanCur = pan;
      rooms.style.transform = 'translate(' + (-pan * sc).toFixed(1) + 'px, 0px) scale(' + sc.toFixed(3) + ')';
    }
    function updateGymPan(focusX) {
      const stage = document.getElementById('gym-stage');
      if (!stage) return;
      const vpW = stage.clientWidth, vpH = stage.clientHeight;
      if (!vpW || !vpH) return;
      const sc = vpH / 300;
      const visible = vpW / sc;
      if (_gymPanManual !== null) {
        if (Date.now() > _gymManualUntil) _gymPanManual = null;
        else { applyGymPan(_gymPanManual, sc); return; }
      }
      if (typeof focusX !== 'number') focusX = 575;
      let pan;
      if (visible >= GYM_PW) pan = (GYM_PW - visible) / 2;
      else pan = Math.max(0, Math.min(GYM_PW - visible, focusX - visible / 2));
      const _nowG = performance.now(); const _dtG = _gymPanT ? (_nowG - _gymPanT) : 16; _gymPanT = _nowG;
      applyGymPan(smoothPanStep(_gymPanCur, pan, focusX, visible, _dtG), sc);
    }
    function ensureGymInterior() {
      if (document.getElementById('gym-stage')) return;
      const host = document.querySelector('#landmark-gym .island-platform-top') || document.querySelector('#landmark-gym .island-platform') || document.getElementById('landmark-gym');
      if (!host) return;
      const stage = document.createElement('div');
      stage.id = 'gym-stage';
      stage.innerHTML = '<div id="gym-rooms">' + buildGymRoomsHTML() + '</div>';
      host.appendChild(stage);
      let drag = null;
      const activePtrs = new Set();
      stage.addEventListener('pointerdown', e => {
        e.stopPropagation();
        activePtrs.add(e.pointerId);
        if (activePtrs.size > 1) { drag = null; const rooms = document.getElementById('gym-rooms'); if (rooms) rooms.style.transition = ''; return; }
        drag = { x: e.clientX, pan: (_gymPanManual !== null ? _gymPanManual : _gymPanCur), moved: 0 };
        _gymPanManual = drag.pan;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        const rooms = document.getElementById('gym-rooms');
        if (rooms) rooms.style.transition = 'none';
      });
      stage.addEventListener('pointermove', e => {
        if (!drag) return;
        const sc = (stage.clientHeight || 179) / 300;
        const visible = (stage.clientWidth || 278) / sc;
        const maxPan = Math.max(0, GYM_PW - visible);
        const next = Math.max(0, Math.min(maxPan, drag.pan - (e.clientX - drag.x) / sc));
        drag.moved += Math.abs(next - _gymPanManual);
        _gymManualUntil = Date.now() + 30000;
        _gymPanManual = next;
        applyGymPan(_gymPanManual, sc);
      });
      const endDrag = e => {
        activePtrs.delete(e.pointerId);
        _gymManualUntil = Date.now() + 30000;
        if (!drag) return;
        const wasDrag = drag.moved > 0.5;
        drag = null;
        const rooms = document.getElementById('gym-rooms');
        if (rooms) rooms.style.transition = '';
        if (wasDrag) stage.addEventListener('click', ev2 => { ev2.stopPropagation(); ev2.preventDefault(); }, { capture: true, once: true });
      };
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
      stage.addEventListener('dblclick', () => { _gymPanManual = null; });
    }
    function updateGymLighting() { // v9.27 操場天空：太陽整天移動，傍晚夕陽、入夜開燈
      const sky = document.getElementById('gym-sky'), sun = document.getElementById('gym-sun'), fl = document.getElementById('gym-floods');
      if (!sky || !sun || !fl) return;
      const h = (gameState.hour || 0) + (gameState.minute || 0) / 60;
      const key = (h < 6 || h >= 19.5) ? 'night' : h < 11 ? 'am' : h < 16 ? 'noon' : h < 18 ? 'golden' : 'sunset';
      if (key === _gymLightKey) return; _gymLightKey = key;
      const cfg = { night: ['#232f47', -30, -30, '0.85'], am: ['#aee6fa', 950, 30, '0'], noon: ['#7fd4e8', 575, 15, '0'], golden: ['#f0b98a', 265, 42, '0'], sunset: ['#e67e22', 150, 62, '0.35'] }[key];
      sky.setAttribute('fill', cfg[0]);
      sun.setAttribute('cx', String(cfg[1])); sun.setAttribute('cy', String(cfg[2]));
      fl.style.opacity = cfg[3];
    }
    function updateGymStage() {
      ensureGymInterior();
      const stage = document.getElementById('gym-stage');
      if (!stage) return;
      const rooms = document.getElementById('gym-rooms');
      const playerIn = (typeof currentLoc !== 'undefined') && currentLoc === 'gym' && !gameState.isCommuting;
      if (playerIn !== _gymWasIn) { _gymPanManual = null; _gymWasIn = playerIn; }
      const cw = document.getElementById('char-wrap');
      if (playerIn) {
        if (cw && rooms && cw.parentNode !== rooms) {
          rooms.appendChild(cw);
          cw.style.zIndex = '975';
          if (typeof getCharacterCoords === 'function' && typeof updateCharacterPositionAndScale === 'function') {
            const dc = getCharacterCoords(currentLoc, currentState);
            updateCharacterPositionAndScale(dc.x, dc.y, false);
          }
        }
      } else {
        const map = document.getElementById('town-map');
        if (cw && map && cw.parentNode === rooms) { map.appendChild(cw); cw.style.zIndex = '25'; }
      }
      if (cw && playerIn) cw.style.zIndex = '975'; // 露天場地沒有傢俱前景，人物一律在最上層
      let focus = GYM_PROJ.P(575, 200, 0).x;
      if (playerIn) focus = GYM_PROJ.P(gameState.currentX || 560, gameState.currentY || 212, 0).x;
      else {
        const inner = (gameState.npcs || []).find(n => n.insideLoc === 'gym');
        if (inner) focus = GYM_PROJ.P(inner.x, inner.y, 0).x;
      }
      if (playerIn && currentState === 'sports' && _gymPanManual === null) { // v9.27.1 跑步跟拍：CSS 迴圈位置由動畫時鐘推算，鏡頭直接跟上（跑道比可視窗寬，置中會有一半看不到人）
        if (_gymRunT0 == null) _gymRunT0 = performance.now();
        const ph = ((performance.now() - _gymRunT0) % 3400) / 3400;
        const PTS = [[0, 130], [0.22, 690], [0.30, 745], [0.38, 752], [0.50, 690], [0.72, 130], [0.80, 70], [0.88, 66], [1, 130]];
        let rx = 130;
        for (let i = 1; i < PTS.length; i++) { if (ph <= PTS[i][0]) { const a = PTS[i - 1], b = PTS[i]; rx = a[1] + (b[1] - a[1]) * ((ph - a[0]) / (b[0] - a[0])); break; } }
        const sc2 = stage.clientHeight / 300, vis2 = stage.clientWidth / sc2;
        const _rfx = GYM_PROJ.P(rx, 208, 0).x;
        const pan2 = vis2 >= GYM_PW ? (GYM_PW - vis2) / 2 : Math.max(0, Math.min(GYM_PW - vis2, _rfx - vis2 / 2));
        applyGymPan(pan2, sc2);
      } else {
        if (currentState !== 'sports') _gymRunT0 = null;
        updateGymPan(focus);
      }
      updateGymLighting();
    }
    function shootBallAnim(fromX, fromY, make, onText) { // v9.27 投籃動畫：拋物線到籃框，進→穿網落下，不進→彈框飛走
      const rooms = document.getElementById('gym-rooms');
      const ball = rooms && document.createElement('div');
      if (ball && typeof ball.animate === 'function') {
        ball.className = 'shot-ball'; ball.innerHTML = icoSvg('ball');
        const _sa = GYM_PROJ.P(fromX, fromY, 0), _sr = GYM_PROJ.P(GYM_HOOP.x, GYM_HOOP.y, 30);
        ball.style.left = (_sa.x - 10) + 'px'; ball.style.top = (_sa.y - 54) + 'px';
        rooms.appendChild(ball);
        const dx = _sr.x - _sa.x, dy = _sr.y - (_sa.y - 48);
        const anim = ball.animate([
          { transform: 'translate(0px, 0px)' },
          { transform: 'translate(' + (dx * 0.5) + 'px, ' + (dy - 95) + 'px)', offset: 0.55 },
          { transform: 'translate(' + dx + 'px, ' + dy + 'px)' }
        ], { duration: 650, easing: 'ease-out' });
        anim.onfinish = () => {
          if (onText) onText();
          if (make) { const drop = ball.animate([{ transform: 'translate(' + dx + 'px, ' + dy + 'px)' }, { transform: 'translate(' + dx + 'px, ' + (dy + 52) + 'px)', opacity: 0.35 }], { duration: 330, easing: 'ease-in' }); drop.onfinish = () => ball.remove(); }
          else { const bounce = ball.animate([{ transform: 'translate(' + dx + 'px, ' + dy + 'px)' }, { transform: 'translate(' + (dx + 64) + 'px, ' + (dy + 92) + 'px)', opacity: 0.4 }], { duration: 400, easing: 'ease-in' }); bounce.onfinish = () => ball.remove(); }
        };
      } else if (onText) onText(); // 無 WAAPI 環境（測試）直接結算文字
    }
    function gymShootBall(npc) { // v9.27 NPC 投籃：55% 命中
      const make = Math.random() < 0.55;
      npc._lastShot = make ? 'make' : 'miss';
      shootBallAnim(npc.x, npc.y, make, () => spawnNpcPop(npc, make ? '🏀 進！' : '差一點！'));
    }
    function playerShoot() { // v9.27 主角投籃：進球減壓（要人在操場）
      if (typeof currentLoc === 'undefined' || currentLoc !== 'gym' || gameState.isCommuting) { queueFloatingText('要先到操場才能投籃喔 🏀'); return; }
      const nowA = (gameState.totalGameDays || 0) * 1440 + (gameState.hour || 0) * 60 + (gameState.minute || 0);
      if (gameState._shotBusyUntil && nowA < gameState._shotBusyUntil) return;
      gameState._shotBusyUntil = nowA + 1;
      const make = Math.random() < 0.55;
      shootBallAnim(gameState.currentX || 575, gameState.currentY || 252, make, () => {
        if (make) { gameState.stress = Math.max(0, (gameState.stress || 0) - 10); gameState._shotsMade = (gameState._shotsMade || 0) + 1; queueFloatingText('🏀 空心入網！壓力 −10'); }
        else queueFloatingText('差一點點！再來一顆 🏀');
        if (typeof playSound === 'function') playSound('click');
      });
    }

    // ================= v9.26 圖書館大場景（比照住家/超商/餐廳/學校：大室內塞框框、窗光＋抽書） =================
    const LIB_SHELF_POINTS = [ { x: 240, y: 128 }, { x: 380, y: 128 }, { x: 760, y: 128 }, { x: 905, y: 128 } ]; // 書架前走道（抽書/上架站位）
    function libSpines(x, y, w) {
      const pal = ['#c2452d', '#5b7fa6', '#7fa663', '#e09a3e', '#8e44ad', '#e65c00', '#27ae60', '#2c3e50', '#c2452d', '#ffcc00'];
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
        out += `<rect x="${x - 3}" y="${baseY}" width="${w + 6}" height="4" fill="#8a6248"/>`;
      });
      return out;
    }
    // ================= v9.53 圖書館 2.5D 化（報告批次 3b）：場景改投影生成 =================
    // 分層同範本：#lib-bg25＋#lib-front25（z950）——櫃檯/閱覽桌南面，舊 #lib-front 退役。
    // 閱覽桌 (196/686,166,268x20,h13)：座位 z208 在南緣之南 22（frontHMax(22,19,4)=23.3）；沙發比照住家床全進 bg（主角坐姿 z500 不被遮）。
    const LIB_PROJ = PROJ.makeIndoor(PROJ.K_INDOOR, 24, 172); // v9.67 室內 45°
    const LIB_PW = 1340;
    PROJ.registerRooms('lib-rooms', LIB_PROJ);
    function buildLibraryRoomsHTML() {
      const pr = LIB_PROJ, WH = 160;
      const poly = (list, fill, extra) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"' + (extra || '') + '/>';
      const faceRect = (x, z, w, h0, h1, fill) => poly([pr.P(x, z, h0), pr.P(x + w, z, h0), pr.P(x + w, z, h1), pr.P(x, z, h1)], fill);
      const txt = (xp, str, size, fill, anchor) => '<text x="' + xp.x.toFixed(1) + '" y="' + xp.y.toFixed(1) + '" font-size="' + size + '" font-weight="900" fill="' + fill + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + str + '</text>';
      const PAL = ['#c2452d', '#5b7fa6', '#7fa663', '#e09a3e', '#8e44ad', '#e65c00', '#27ae60', '#2c3e50', '#c2452d', '#ffcc00'];
      const spineRow = (x0, x1, zF, hBot, hTop, seed) => { let o = ''; let cx = x0; let i = seed; while (cx < x1 - 10) { const bw = 9 + ((i * 37) % 5); const bh = (hTop - hBot) - ((i * 53) % 8); o += faceRect(cx, zF, bw, hBot, hBot + Math.max(10, bh), PAL[i % 10]); cx += bw + 2; i++; } return o; };
      let bg = '', front = '';
      // 牆＋地板＋地毯
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(0, 0, WH)], '#f5f0e6');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#f5f0e6', 0.8));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#c98d54');
      bg += floorBands(pr, poly, '#a9743f', 0.4, 38, 0, 1150, 0, 300); // v9.62 木板交錯帶（地毯蓋在其上）
      let lines = '';
      for (let z = 30; z < 300; z += 38) { const a = pr.P(0, z, 0), b = pr.P(1150, z, 0); lines += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; }
      bg += '<g stroke="rgba(150,111,63,0.5)" stroke-width="1.4">' + lines + '</g>';
      bg += poly([pr.P(176, 158, 0), pr.P(974, 158, 0), pr.P(974, 282, 0), pr.P(176, 282, 0)], 'rgba(142,59,70,0.30)');
      // 兩扇窗＋窗框十字
      [[30, 158], [992, 1120]].forEach(([x0, x1]) => {
        bg += pr.wallDecoN(x0, x1, 60, 164, '#bedcfe');
        const mx = (x0 + x1) / 2;
        const v1 = pr.P(mx, 0, 60), v2 = pr.P(mx, 0, 164), h1 = pr.P(x0, 0, 112), h2 = pr.P(x1, 0, 112);
        bg += '<line x1="' + v1.x.toFixed(1) + '" y1="' + v1.y.toFixed(1) + '" x2="' + v2.x.toFixed(1) + '" y2="' + v2.y.toFixed(1) + '" stroke="#6d4c41" stroke-width="3"/><line x1="' + h1.x.toFixed(1) + '" y1="' + h1.y.toFixed(1) + '" x2="' + h2.x.toFixed(1) + '" y2="' + h2.y.toFixed(1) + '" stroke="#6d4c41" stroke-width="3"/>';
      });
      // 窗光（id/開關邏輯與舊版相同，形狀改走投影：牆面 h60 起、落到地板 z217）
      const shaft = (ptsList, motes) => '<polygon points="' + pr.pts(ptsList) + '" fill="#ffe9b8"/>' + motes.map(([mx, mz, mh, r]) => { const c = pr.P(mx, mz, mh); return '<circle class="lib-mote" cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="' + r + '" fill="#fff6e8"/>'; }).join('');
      bg += '<g id="lib-shaft-w" opacity="0">' + shaft([[36, 0, 58], [152, 0, 58], [268, 217, 0], [128, 217, 0]], [[150, 90, 26, 2.2], [185, 130, 18, 1.7], [140, 150, 12, 1.4]]) + '</g>';
      bg += '<g id="lib-shaft-e" opacity="0">' + shaft([[1114, 0, 58], [998, 0, 58], [882, 217, 0], [1022, 217, 0]], [[1000, 90, 26, 2.2], [965, 130, 18, 1.7], [1010, 150, 12, 1.4]]) + '</g>';
      // 後牆書架 x2（高櫃 box3＋南面書脊兩排）＋中央矮架
      [[176, 3], [702, 23]].forEach(([sx, seed]) => {
        bg += pr.box3(sx, 6, 272, 20, 150, '#6d4c41');
        bg += spineRow(sx + 8, sx + 264, 26.6, 104, 142, seed) + spineRow(sx + 8, sx + 264, 26.6, 58, 96, seed + 7);
        bg += faceRect(sx - 3, 26.6, 278, 99, 102, '#8a6248') + faceRect(sx - 3, 26.6, 278, 53, 56, '#8a6248');
      });
      bg += pr.box3(486, 10, 178, 18, 124, '#6d4c41');
      bg += spineRow(494, 656, 28.6, 82, 116, 5) + spineRow(494, 656, 28.6, 44, 76, 13);
      bg += faceRect(483, 28.6, 184, 79, 82, '#8a6248');
      // 時鐘＋櫃檯（南面進 front）＋招牌字
      const ck = pr.P(575, 0, 158);
      bg += '<circle cx="' + ck.x.toFixed(1) + '" cy="' + ck.y.toFixed(1) + '" r="10" fill="#fff6e8" stroke="#4a3220" stroke-width="2"/><line x1="' + ck.x.toFixed(1) + '" y1="' + ck.y.toFixed(1) + '" x2="' + ck.x.toFixed(1) + '" y2="' + (ck.y - 7).toFixed(1) + '" stroke="#4a3220" stroke-width="1.8"/><line x1="' + ck.x.toFixed(1) + '" y1="' + ck.y.toFixed(1) + '" x2="' + (ck.x + 5).toFixed(1) + '" y2="' + (ck.y + 2).toFixed(1) + '" stroke="#4a3220" stroke-width="1.8"/>';
      const counter = pr.boxFaces(474, 106, 202, 22, 16, '#795548');
      bg += counter.back; front += counter.front;
      bg += txt(pr.P(575, 100, 46), '借 還 書 櫃 台', 11, '#6d4c41', 'middle');
      // 地球儀＋東側盆栽
      const g0 = pr.P(88, 186, 0), g1 = pr.P(88, 186, 12), gc = pr.P(88, 180, 30);
      bg += '<line x1="' + g0.x.toFixed(1) + '" y1="' + g0.y.toFixed(1) + '" x2="' + g1.x.toFixed(1) + '" y2="' + g1.y.toFixed(1) + '" stroke="#6d4c41" stroke-width="4"/>';
      bg += '<circle cx="' + gc.x.toFixed(1) + '" cy="' + gc.y.toFixed(1) + '" r="17" fill="#7fd4e8" stroke="#4a3220" stroke-width="2"/>';
      bg += '<path d="M' + (gc.x - 14).toFixed(1) + ' ' + (gc.y - 6).toFixed(1) + ' Q' + gc.x.toFixed(1) + ' ' + (gc.y - 15).toFixed(1) + ' ' + (gc.x + 14).toFixed(1) + ' ' + (gc.y - 6).toFixed(1) + ' M' + (gc.x - 14).toFixed(1) + ' ' + (gc.y + 8).toFixed(1) + ' Q' + gc.x.toFixed(1) + ' ' + (gc.y + 17).toFixed(1) + ' ' + (gc.x + 14).toFixed(1) + ' ' + (gc.y + 8).toFixed(1) + '" stroke="#7fa663" stroke-width="2.4" fill="none"/>';
      bg += pr.box3(1064, 150, 14, 12, 12, '#ca6f1e');
      const pf1 = pr.P(1071, 156, 25), pf2 = pr.P(1062, 154, 19);
      bg += '<circle cx="' + pf1.x.toFixed(1) + '" cy="' + pf1.y.toFixed(1) + '" r="13" fill="#8fae6b"/><circle cx="' + pf2.x.toFixed(1) + '" cy="' + pf2.y.toFixed(1) + '" r="8" fill="#85c173"/>';
      // 閱覽桌 x2（南面進 front）＋桌燈（光暈組合 id 保留）
      let glows = '';
      [[196, 330], [686, 820]].forEach(([tx, lx]) => {
        const tb = pr.boxFaces(tx, 166, 268, 20, 8, '#8a6248'); // v9.67 45° 後南面頂緣會蹭到坐姿臉帶下緣 0.7 單位：桌高 10->8 讓開（幾何驗證 v9.53）
        bg += tb.back; front += tb.front;
        bg += pr.planeCircle(lx, 176, 10.4, 6, '#2f5d3a');
        const s0 = pr.P(lx, 176, 10), s1 = pr.P(lx, 176, 21);
        bg += '<line x1="' + s0.x.toFixed(1) + '" y1="' + s0.y.toFixed(1) + '" x2="' + s1.x.toFixed(1) + '" y2="' + s1.y.toFixed(1) + '" stroke="#2f5d3a" stroke-width="3"/>';
        bg += '<polygon points="' + (s1.x - 12).toFixed(1) + ',' + s1.y.toFixed(1) + ' ' + (s1.x + 12).toFixed(1) + ',' + s1.y.toFixed(1) + ' ' + (s1.x + 7).toFixed(1) + ',' + (s1.y - 12).toFixed(1) + ' ' + (s1.x - 7).toFixed(1) + ',' + (s1.y - 12).toFixed(1) + '" fill="#7fa663" stroke="#4a3220" stroke-width="1.4"/>';
        glows += pr.planeCircle(lx, 176, 11, 17, '#f5c86a', 0.5);
      });
      bg += '<g id="lib-lamps" opacity="0">' + glows + '</g>';
      // 沙發（全 bg：主角坐姿 z500，平面版沙發本來就在背景層）＋邊桌＋書堆小推車
      bg += pr.box3(110, 182, 62, 10, 24, '#a93226');
      const sofa = pr.boxFaces(110, 192, 62, 32, 13, '#b04a3a');
      bg += sofa.back + sofa.front;
      bg += pr.box3(102, 192, 10, 32, 18, '#a93226');
      bg += pr.box3(170, 192, 10, 32, 18, '#a93226');
      const st0 = pr.P(198, 228, 0), st1 = pr.P(198, 228, 9);
      bg += '<line x1="' + st0.x.toFixed(1) + '" y1="' + st0.y.toFixed(1) + '" x2="' + st1.x.toFixed(1) + '" y2="' + st1.y.toFixed(1) + '" stroke="#6d4c41" stroke-width="4"/>';
      bg += pr.planeCircle(198, 228, 9, 11, '#8a6248');
      bg += pr.rimBand(198, 228, 11, 9, 0.5, '#6d4c41');
      bg += pr.box3(182, 204, 26, 16, 8, '#6d4c41');
      const bookCols = ['#8e44ad', '#c2452d', '#5b7fa6', '#e09a3e', '#7fa663'];
      let books = '';
      bookCols.forEach((c, i) => { books += '<polygon class="book-layer" points="' + pr.pts([pr.P(184, 206, 8.5 + i * 2.2), pr.P(204, 206, 8.5 + i * 2.2), pr.P(204, 218, 8.5 + i * 2.2), pr.P(184, 218, 8.5 + i * 2.2)]) + '" fill="' + c + '"/>'; });
      bg += '<g id="study-books-library-in" class="study-books">' + books + '</g>';
      // 新書推薦展示櫃（全 bg）＋標題＋書脊
      bg += pr.box3(996, 110, 88, 14, 40, '#2f5d3a');
      bg += txt(pr.P(1040, 117, 46), '新書推薦', 10, '#ffe9b8', 'middle');
      [[1006, '#c2452d'], [1021, '#ffcc00'], [1036, '#3a6ea5'], [1051, '#9b59b6']].forEach(([sx, sc2]) => { bg += faceRect(sx, 124.6, 12, 8, 32, sc2); });
      // 入口墊
      bg += pr.box3(515, 264, 120, 28, 2, '#8a6248');
      bg += txt(pr.P(575, 283, 4), '入 口', 11, '#ffe9b8', 'middle');
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + LIB_PW + ' 300" style="position:absolute; left:0; top:0; width:' + LIB_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      bg += stairSvg(pr); // v9.65 樓梯間（2F 上下樓）
      return svgOpen('lib-bg25', 0) + bg + '</svg>' + svgOpen('lib-front25', 950) + front + '</svg>'
        + '<button class="lib-rec-book" onpointerdown="event.stopPropagation()" onclick="borrowBook()">📖 借推薦書</button>';
    }

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
      if (visible >= LIB_PW) pan = (LIB_PW - visible) / 2;
      else pan = Math.max(0, Math.min(LIB_PW - visible, focusX - visible / 2));
      const _nowLib = performance.now(); const _dtLib = _libPanT ? (_nowLib - _libPanT) : 16; _libPanT = _nowLib;
      applyLibraryPan(smoothPanStep(_libPanCur, pan, focusX, visible, _dtLib), sc);
    }
    function ensureLibraryInterior() {
      if (document.getElementById('lib-stage')) return;
      const host = document.querySelector('#landmark-library .island-platform-top') || document.querySelector('#landmark-library .island-platform') || document.getElementById('landmark-library'); // v9.72 解綁：stage 回圖書館自己島
      if (!host) return;
      const stage = document.createElement('div');
      stage.id = 'lib-stage';
      stage.innerHTML = '<div id="lib-rooms">' + buildLibraryRoomsHTML() + '</div>';
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
        const maxPan = Math.max(0, LIB_PW - visible);
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
      let focus = LIB_PROJ.P(575, 200, 0).x;
      if (playerIn) focus = LIB_PROJ.P(gameState.currentX || 560, gameState.currentY || 212, 0).x;
      else {
        const inner = (gameState.npcs || []).find(n => n.insideLoc === 'library');
        if (inner) focus = LIB_PROJ.P(inner.x, inner.y, 0).x;
      }
      updateLibraryPan(focus);
      updateLibraryLighting();
      syncMiniExplode('library', 'library', LIB_PROJ, _libPanCur); // v9.72 解綁後比照單層建物：自己的爆炸屋頂/導引＋FS
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

    // ================= v9.65 學校 3F 社團活動室（多樓層批次 B1：與 1F 教室/2F 圖書館同棟疊層） =================
    const CLUB_PROJ = PROJ.makeIndoor(PROJ.K_INDOOR, 24, 172); // v9.67 室內 45°
    const CLUB_PW = 1340;
    PROJ.registerRooms('club-rooms', CLUB_PROJ);
    function buildClubRoomsHTML() {
      const pr = CLUB_PROJ, WH = 156;
      const poly = (list, fill, extra) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"' + (extra || '') + '/>';
      const faceRect = (x, z, w, h0, h1, fill) => poly([pr.P(x, z, h0), pr.P(x + w, z, h0), pr.P(x + w, z, h1), pr.P(x, z, h1)], fill);
      const txt = (xp, str, size, fill, anchor) => '<text x="' + xp.x.toFixed(1) + '" y="' + xp.y.toFixed(1) + '" font-size="' + size + '" font-weight="900" fill="' + fill + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + str + '</text>';
      const PAL = ['#c2452d', '#5b7fa6', '#7fa663', '#e09a3e', '#8e44ad', '#e65c00', '#27ae60', '#2c3e50', '#c2452d', '#ffcc00'];
      const spineRow = (x0, x1, zF, hBot, hTop, seed) => { let o = ''; let cx = x0; let i = seed; while (cx < x1 - 10) { const bw = 9 + ((i * 37) % 5); const bh = (hTop - hBot) - ((i * 53) % 7); o += faceRect(cx, zF, bw, hBot, hBot + Math.max(10, bh), PAL[i % 10]); cx += bw + 2; i++; } return o; };
      let bg = '', front = '';
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(0, 0, WH)], '#f7ead9');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#f7ead9', 0.8));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#d9a066');
      bg += floorBands(pr, poly, '#c98d54', 0.45, 44, 0, 1150, 0, 300);
      // 社團名牌＋海報牆
      bg += pr.wallDecoN(330, 700, 96, 150, '#2c3e50');
      bg += txt(pr.P(515, 0, 132), '社團活動室', 15, '#ffffff', 'middle');
      bg += txt(pr.P(515, 0, 112), 'CLUB ROOM ・ 3F', 9, '#aee6fa', 'middle');
      bg += faceRect(52, 0.6, 92, 66, 128, '#c2452d') + txt(pr.P(66, 0, 108), '美術社', 10, '#ffffff');
      bg += faceRect(168, 0.6, 92, 66, 128, '#5b7fa6') + txt(pr.P(182, 0, 108), '音樂社', 10, '#ffffff');
      bg += faceRect(724, 0.6, 92, 66, 128, '#7fa663') + txt(pr.P(738, 0, 108), '棋藝社', 10, '#ffffff');
      bg += faceRect(840, 0.6, 92, 66, 128, '#e09a3e') + txt(pr.P(854, 0, 108), '天文社', 10, '#ffffff');
      // 東窗
      bg += pr.wallDecoN(968, 1104, 66, 142, '#bedcfe');
      const wx1 = pr.P(1036, 0, 66), wx2 = pr.P(1036, 0, 142), wy1 = pr.P(968, 0, 104), wy2 = pr.P(1104, 0, 104);
      bg += '<line x1="' + wx1.x.toFixed(1) + '" y1="' + wx1.y.toFixed(1) + '" x2="' + wx2.x.toFixed(1) + '" y2="' + wx2.y.toFixed(1) + '" stroke="#4a3220" stroke-width="2"/><line x1="' + wy1.x.toFixed(1) + '" y1="' + wy1.y.toFixed(1) + '" x2="' + wy2.x.toFixed(1) + '" y2="' + wy2.y.toFixed(1) + '" stroke="#4a3220" stroke-width="2"/>';
      // 西側書櫃（社團資料/作品）
      bg += pr.box3(30, 6, 200, 20, 130, '#6d4c41');
      bg += spineRow(38, 222, 26.6, 92, 122, 4) + spineRow(38, 222, 26.6, 48, 78, 9);
      bg += faceRect(27, 26.6, 206, 86, 89, '#8a6248') + faceRect(27, 26.6, 206, 42, 45, '#8a6248');
      // 鋼琴（西北）：琴身＋掀蓋＋琴鍵
      bg += pr.box3(268, 92, 120, 64, 26, '#1a1a24');
      bg += poly([pr.P(268, 92, 26), pr.P(388, 92, 26), pr.P(388, 128, 46), pr.P(268, 128, 46)], '#26324b');
      bg += faceRect(270, 156.6, 116, 17, 24, '#ffffff');
      bg += faceRect(270, 156.6, 116, 21, 24, '#1a1a24');
      // 中央地毯＋三張社團長桌（南面進 front）＋椅子
      bg += pr.planeCircle(575, 218, 0, 165, '#aee6fa', 0.30);
      [[300], [545], [790]].forEach(([tx]) => {
        const tb = pr.boxFaces(tx, 148, 150, 46, 12, '#a9743f');
        bg += tb.back; front += tb.front;
        bg += poly([pr.P(tx + 18, 158, 12.4), pr.P(tx + 44, 158, 12.4), pr.P(tx + 44, 176, 12.4), pr.P(tx + 18, 176, 12.4)], '#f5f0e6');
        bg += poly([pr.P(tx + 96, 160, 12.4), pr.P(tx + 118, 160, 12.4), pr.P(tx + 118, 174, 12.4), pr.P(tx + 96, 174, 12.4)], '#c2452d');
      });
      [[330], [445], [560], [675], [790], [905]].forEach(([sx]) => { bg += pr.box3(sx - 15, 200, 30, 10, 9, '#6d4c41'); });
      // 沙發（東南，避開樓梯間）
      const sofa = pr.boxFaces(856, 234, 118, 38, 13, '#8e44ad');
      bg += sofa.back; front += sofa.front;
      bg += pr.box3(856, 226, 118, 8, 26, '#8e44ad');
      // 樓梯間＋入口墊
      bg += stairSvg(pr);
      bg += pr.box3(515, 264, 120, 28, 2, '#8a6248');
      bg += txt(pr.P(575, 283, 4), '入 口', 11, '#ffe9b8', 'middle');
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + CLUB_PW + ' 300" style="position:absolute; left:0; top:0; width:' + CLUB_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      return svgOpen('club-bg25', 0) + bg + '</svg>' + svgOpen('club-front25', 950) + front + '</svg>';
    }
    let _clubPanManual = null;
    let _clubManualUntil = 0;
    let _clubPanCur = 0; let _clubPanT = 0;
    let _clubWasIn = false;
    function applyClubPan(pan, sc) {
      const rooms = document.getElementById('club-rooms');
      if (!rooms) return;
      _clubPanCur = pan;
      rooms.style.transform = 'translate(' + (-pan * sc).toFixed(1) + 'px, 0px) scale(' + sc.toFixed(3) + ')';
    }
    function updateClubPan(focusX) {
      const stage = document.getElementById('club-stage');
      if (!stage) return;
      const vpW = stage.clientWidth, vpH = stage.clientHeight;
      if (!vpW || !vpH) return;
      const sc = vpH / 300;
      const visible = vpW / sc;
      if (_clubPanManual !== null) {
        if (Date.now() > _clubManualUntil) _clubPanManual = null;
        else { applyClubPan(_clubPanManual, sc); return; }
      }
      if (typeof focusX !== 'number') focusX = 575;
      let pan;
      if (visible >= CLUB_PW) pan = (CLUB_PW - visible) / 2;
      else pan = Math.max(0, Math.min(CLUB_PW - visible, focusX - visible / 2));
      const _nowClub = performance.now(); const _dtClub = _clubPanT ? (_nowClub - _clubPanT) : 16; _clubPanT = _nowClub;
      applyClubPan(smoothPanStep(_clubPanCur, pan, focusX, visible, _dtClub), sc);
    }
    function ensureClubInterior() {
      if (document.getElementById('club-stage')) return;
      const host = document.querySelector('#landmark-school .island-platform-top') || document.querySelector('#landmark-school .island-platform') || document.getElementById('landmark-school');
      if (!host) return;
      const stage = document.createElement('div');
      stage.id = 'club-stage';
      stage.innerHTML = '<div id="club-rooms">' + buildClubRoomsHTML() + '</div>';
      host.appendChild(stage);
      let drag = null;
      const activePtrs = new Set();
      stage.addEventListener('pointerdown', e => {
        e.stopPropagation();
        activePtrs.add(e.pointerId);
        if (activePtrs.size > 1) { drag = null; const rooms = document.getElementById('club-rooms'); if (rooms) rooms.style.transition = ''; return; }
        drag = { x: e.clientX, pan: (_clubPanManual !== null ? _clubPanManual : _clubPanCur), moved: 0 };
        _clubPanManual = drag.pan;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        const rooms = document.getElementById('club-rooms');
        if (rooms) rooms.style.transition = 'none';
      });
      stage.addEventListener('pointermove', e => {
        if (!drag) return;
        const sc = (stage.clientHeight || 179) / 300;
        const visible = (stage.clientWidth || 278) / sc;
        const maxPan = Math.max(0, CLUB_PW - visible);
        const next = Math.max(0, Math.min(maxPan, drag.pan - (e.clientX - drag.x) / sc));
        drag.moved += Math.abs(next - _clubPanManual);
        _clubManualUntil = Date.now() + 30000;
        _clubPanManual = next;
        applyClubPan(_clubPanManual, sc);
      });
      const endDrag = e => {
        activePtrs.delete(e.pointerId);
        _clubManualUntil = Date.now() + 30000;
        if (!drag) return;
        const wasDrag = drag.moved > 0.5;
        drag = null;
        const rooms = document.getElementById('club-rooms');
        if (rooms) rooms.style.transition = '';
        if (wasDrag) stage.addEventListener('click', ev2 => { ev2.stopPropagation(); ev2.preventDefault(); }, { capture: true, once: true });
      };
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
      stage.addEventListener('dblclick', () => { _clubPanManual = null; });
    }
    function updateClubStage() {
      ensureClubInterior();
      const stage = document.getElementById('club-stage');
      if (!stage) return;
      const rooms = document.getElementById('club-rooms');
      const playerIn = (typeof currentLoc !== 'undefined') && currentLoc === 'club' && !gameState.isCommuting;
      if (playerIn !== _clubWasIn) { _clubPanManual = null; _clubWasIn = playerIn; }
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
      if (cw && playerIn) cw.style.zIndex = '975';
      let focus = CLUB_PROJ.P(575, 200, 0).x;
      if (playerIn) focus = CLUB_PROJ.P(gameState.currentX || 560, gameState.currentY || 212, 0).x;
      else {
        const inner = (gameState.npcs || []).find(n => n.insideLoc === 'club');
        if (inner) focus = CLUB_PROJ.P(inner.x, inner.y, 0).x;
      }
      updateClubPan(focus);
    }

    // ================= v9.72 學校 2F 自習室（圖書館解綁後補位：沿用教室課桌格與座位邏輯） =================
    const STUDY_PROJ = PROJ.makeIndoor(PROJ.K_INDOOR, 24, 172);
    const STUDY_PW = 1340;
    PROJ.registerRooms('study-rooms', STUDY_PROJ);
    function buildStudyRoomsHTML() {
      const pr = STUDY_PROJ, WH = 156;
      const poly = (list, fill, extra) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"' + (extra || '') + '/>';
      const faceRect = (x, z, w, h0, h1, fill) => poly([pr.P(x, z, h0), pr.P(x + w, z, h0), pr.P(x + w, z, h1), pr.P(x, z, h1)], fill);
      const txt = (xp, str, size, fill, anchor) => '<text x="' + xp.x.toFixed(1) + '" y="' + xp.y.toFixed(1) + '" font-size="' + size + '" font-weight="900" fill="' + fill + '" text-anchor="' + (anchor || 'start') + '" style="paint-order:stroke;" stroke="rgba(24,32,66,0.25)" stroke-width="2">' + str + '</text>';
      const PAL = ['#c2452d', '#5b7fa6', '#7fa663', '#e09a3e', '#8e44ad', '#e65c00', '#27ae60', '#2c3e50', '#c2452d', '#ffcc00'];
      const spineRow = (x0, x1, zF, hBot, hTop, seed) => { let o = ''; let cx = x0; let i = seed; while (cx < x1 - 10) { const bw = 9 + ((i * 37) % 5); o += faceRect(cx, zF, bw, hBot, hTop, PAL[i % PAL.length]); cx += bw + 2; i++; } return o; };
      let bg = '', front = '';
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(0, 0, WH)], '#efe9e0');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#efe9e0', 0.8));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#d9a066');
      bg += floorBands(pr, poly, '#c98d54', 0.45, 44, 0, 1150, 0, 300);
      bg += pr.wallDecoN(400, 750, 96, 150, '#2c3e50');
      bg += txt(pr.P(575, 0, 132), '自 習 室', 15, '#ffffff', 'middle');
      bg += txt(pr.P(575, 0, 112), 'STUDY ROOM ・ 2F', 9, '#aee6fa', 'middle');
      bg += pr.wallDecoN(968, 1104, 66, 142, '#bedcfe');
      const wx1 = pr.P(1036, 0, 66), wx2 = pr.P(1036, 0, 142), wy1 = pr.P(968, 0, 104), wy2 = pr.P(1104, 0, 104);
      bg += '<line x1="' + wx1.x.toFixed(1) + '" y1="' + wx1.y.toFixed(1) + '" x2="' + wx2.x.toFixed(1) + '" y2="' + wx2.y.toFixed(1) + '" stroke="#4a3220" stroke-width="2"/><line x1="' + wy1.x.toFixed(1) + '" y1="' + wy1.y.toFixed(1) + '" x2="' + wy2.x.toFixed(1) + '" y2="' + wy2.y.toFixed(1) + '" stroke="#4a3220" stroke-width="2"/>';
      bg += pr.box3(30, 6, 200, 20, 130, '#6d4c41');
      bg += spineRow(38, 222, 26.6, 92, 122, 7) + spineRow(38, 222, 26.6, 48, 78, 3);
      bg += faceRect(27, 26.6, 206, 86, 89, '#8a6248') + faceRect(27, 26.6, 206, 42, 45, '#8a6248');
      const DESKS = [[430, 185], [590, 185], [750, 185], [430, 250], [590, 250], [750, 250]];
      DESKS.forEach((dsk, i) => {
        const sx = dsk[0], sy = dsk[1];
        const dk = pr.boxFaces(sx - 28, sy - 40, 56, 26, 11, '#a9743f');
        bg += dk.back; front += dk.front;
        bg += pr.box3(sx - 11, sy - 38, 22, 12, 3, PAL[i % PAL.length]);
        bg += pr.box3(sx - 14, sy - 6, 28, 12, 8, '#5b7fa6');
      });
      bg += txt(pr.P(575, 283, 4), '入 口', 11, '#ffe9b8', 'middle');
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + STUDY_PW + ' 300" style="position:absolute; left:0; top:0; width:' + STUDY_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      return svgOpen('study-bg25', 0) + bg + '</svg>' + svgOpen('study-front25', 950) + front + '</svg>';
    }
    let _studyPanManual = null;
    let _studyManualUntil = 0;
    let _studyPanCur = 0; let _studyPanT = 0;
    let _studyWasIn = false;
    function applyStudyPan(pan, sc) {
      const rooms = document.getElementById('study-rooms');
      if (!rooms) return;
      _studyPanCur = pan;
      rooms.style.transform = 'translate(' + (-pan * sc).toFixed(1) + 'px, 0px) scale(' + sc.toFixed(3) + ')';
    }
    function updateStudyPan(focusX) {
      const stage = document.getElementById('study-stage');
      if (!stage) return;
      const vpW = stage.clientWidth, vpH = stage.clientHeight;
      if (!vpW || !vpH) return;
      const sc = vpH / 300;
      const visible = vpW / sc;
      if (_studyPanManual !== null) {
        if (Date.now() > _studyManualUntil) _studyPanManual = null;
        else { applyStudyPan(_studyPanManual, sc); return; }
      }
      if (typeof focusX !== 'number') focusX = 575;
      let pan;
      if (visible >= STUDY_PW) pan = (STUDY_PW - visible) / 2;
      else pan = Math.max(0, Math.min(STUDY_PW - visible, focusX - visible / 2));
      const _nowStudy = performance.now(); const _dtStudy = _studyPanT ? (_nowStudy - _studyPanT) : 16; _studyPanT = _nowStudy;
      applyStudyPan(smoothPanStep(_studyPanCur, pan, focusX, visible, _dtStudy), sc);
    }
    function ensureStudyInterior() {
      if (document.getElementById('study-stage')) return;
      const host = document.querySelector('#landmark-school .island-platform-top') || document.querySelector('#landmark-school .island-platform') || document.getElementById('landmark-school');
      if (!host) return;
      const stage = document.createElement('div');
      stage.id = 'study-stage';
      stage.innerHTML = '<div id="study-rooms">' + buildStudyRoomsHTML() + '</div>';
      host.appendChild(stage);
      let drag = null;
      const activePtrs = new Set();
      stage.addEventListener('pointerdown', e => {
        e.stopPropagation();
        activePtrs.add(e.pointerId);
        if (activePtrs.size > 1) { drag = null; const rooms = document.getElementById('study-rooms'); if (rooms) rooms.style.transition = ''; return; }
        drag = { x: e.clientX, pan: (_studyPanManual !== null ? _studyPanManual : _studyPanCur), moved: 0 };
        _studyPanManual = drag.pan;
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        const rooms = document.getElementById('study-rooms');
        if (rooms) rooms.style.transition = 'none';
      });
      stage.addEventListener('pointermove', e => {
        if (!drag) return;
        const sc = (stage.clientHeight || 179) / 300;
        const visible = (stage.clientWidth || 278) / sc;
        const maxPan = Math.max(0, STUDY_PW - visible);
        const next = Math.max(0, Math.min(maxPan, drag.pan - (e.clientX - drag.x) / sc));
        drag.moved += Math.abs(next - _studyPanManual);
        _studyManualUntil = Date.now() + 30000;
        _studyPanManual = next;
        applyStudyPan(_studyPanManual, sc);
      });
      const endDrag = e => {
        activePtrs.delete(e.pointerId);
        _studyManualUntil = Date.now() + 30000;
        if (!drag) return;
        const wasDrag = drag.moved > 0.5;
        drag = null;
        const rooms = document.getElementById('study-rooms');
        if (rooms) rooms.style.transition = '';
        if (wasDrag) stage.addEventListener('click', ev2 => { ev2.stopPropagation(); ev2.preventDefault(); }, { capture: true, once: true });
      };
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
      stage.addEventListener('dblclick', () => { _studyPanManual = null; });
    }
    function updateStudyStage() {
      ensureStudyInterior();
      const stage = document.getElementById('study-stage');
      if (!stage) return;
      const rooms = document.getElementById('study-rooms');
      const playerIn = (typeof currentLoc !== 'undefined') && currentLoc === 'study' && !gameState.isCommuting;
      if (playerIn !== _studyWasIn) { _studyPanManual = null; _studyWasIn = playerIn; }
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
      if (cw && playerIn) cw.style.zIndex = '975';
      let focus = STUDY_PROJ.P(575, 200, 0).x;
      if (playerIn) focus = STUDY_PROJ.P(gameState.currentX || 560, gameState.currentY || 212, 0).x;
      else {
        const inner = (gameState.npcs || []).find(n => n.insideLoc === 'study');
        if (inner) focus = STUDY_PROJ.P(inner.x, inner.y, 0).x;
      }
      updateStudyPan(focus);
    }

    // ================= v9.18 餐廳大場景（比照住家/超商：大室內塞框框、鐵板台前景層） =================
    // ================= v9.51 餐廳 2.5D 化（報告批次 1・範本棟）：場景改投影生成，玩法座標零改動 =================
    // 投影器：室內 K=0.90、OX/OY 逐場景定。地面 1150x300 → 螢幕寬 1340（REST_PW）、高 300 內（牆高 132）。
    // 分層：#rest-bg25（牆/地板/盒的東面+上面，在人物之下）＋ #rest-front25（盒的南面，z950）——
    // 廚師（945）在南面之下（吧台只蓋腰腿）、食客（955）在南面之上，與舊夾層契約同構，舊三層已退役。
    const REST_PROJ = PROJ.makeIndoor(PROJ.K_INDOOR, 24, 172); // v9.67 室內 45°
    const REST_PW = 1340;
    const REST_TABLES = [{ x: 770, z: 160 }, { x: 990, z: 208 }];
    PROJ.registerRooms('rest-rooms', REST_PROJ);
    function restPlateScreen(x, y) { // 座位邏輯座標 → 盤子在桌面上的螢幕位置（dish-plate 左上角）
      if (y === 184) { const p = REST_PROJ.P(x, 170, 15); return { x: p.x - 9, y: p.y - 9 }; }
      let c = REST_TABLES[0], bd = Infinity;
      REST_TABLES.forEach(t => { const d = (t.x - x) * (t.x - x) + (t.z - y) * (t.z - y); if (d < bd) { bd = d; c = t; } });
      const p = REST_PROJ.P(x + (c.x - x) * 0.45, y + (c.z - y) * 0.45, 14.6);
      return { x: p.x - 9, y: p.y - 9 };
    }
    function buildRestRoomsHTML() {
      const pr = REST_PROJ, WH = 132;
      const poly = (list, fill) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"/>';
      const txt = (xp, yOff, str, size, fill) => '<text x="' + xp.x.toFixed(1) + '" y="' + (xp.y + (yOff || 0)).toFixed(1) + '" font-size="' + size + '" fill="' + fill + '" font-family="\'DotGothic16\', monospace" font-weight="900">' + str + '</text>';
      let bg = '', front = '';
      // 北牆＋東牆＋地板（全走投影）
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(0, 0, WH)], '#6d4c41');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#6d4c41', 0.62));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#a9743f');
      bg += floorBands(pr, poly, '#795548', 0.35, 38, 0, 1150, 0, 300); // v9.62 深木交錯帶
      let lines = '';
      for (let z = 38; z < 300; z += 38) { const a = pr.P(0, z, 0), b = pr.P(1150, z, 0); lines += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; }
      for (let x = 96; x < 1150; x += 96) { const z0 = (x % 3) * 40; const a = pr.P(x, z0, 0), b = pr.P(x, z0 + 52, 0); lines += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; }
      bg += '<g stroke="rgba(60,32,8,0.28)" stroke-width="2">' + lines + '</g>';
      // 北牆裝飾（wallDeco 平面物）＋字（平面貼牆）
      bg += pr.wallDecoN(240, 332, 84, 122, '#fff6e8');
      bg += pr.wallDecoN(640, 1110, 78, 124, '#3c2415');
      bg += txt(pr.P(28, 0, 104), 0, '🍳 鐵板食堂', 17, '#ffe9b8');
      bg += txt(pr.P(252, 0, 98), 0, '🍜 拉麵', 16, '#b04a3a');
      bg += txt(pr.P(656, 0, 108), 0, '招牌炒麵 $60　豚骨拉麵 $75', 11, '#ffe9b8');
      bg += txt(pr.P(656, 0, 90), 0, '鐵板牛排 $95　香煎雞腿 $80　叉燒炒飯 $60', 11, '#ffe9b8');
      // 吊燈：吊線＋燈罩＋地板光池（planeCircle）
      [160, 320, 480].forEach(x => {
        const top = pr.P(x, 0, WH), bot = pr.P(x, 0, 100);
        bg += '<line x1="' + top.x.toFixed(1) + '" y1="' + top.y.toFixed(1) + '" x2="' + bot.x.toFixed(1) + '" y2="' + bot.y.toFixed(1) + '" stroke="#4a3220" stroke-width="2"/>';
        bg += pr.planeCircle(x, 76, 0, 30, '#f5c86a', 0.30);
        bg += '<polygon points="' + (bot.x - 14).toFixed(1) + ',' + bot.y.toFixed(1) + ' ' + (bot.x + 14).toFixed(1) + ',' + bot.y.toFixed(1) + ' ' + (bot.x + 8).toFixed(1) + ',' + (bot.y + 12).toFixed(1) + ' ' + (bot.x - 8).toFixed(1) + ',' + (bot.y + 12).toFixed(1) + '" fill="#d9a066" stroke="#4a3220" stroke-width="1.5"/>';
      });
      // 鐵板吧台（盒）：廚師崗位 z143 在北緣 146 之北，h15 由 frontHMax(3, 25, 6)=20.1 保證不蓋臉
      const counter = pr.boxFaces(60, 146, 520, 34, 15, '#795548');
      bg += counter.back; front += counter.front;
      bg += poly([pr.P(66, 150, 15.6), pr.P(574, 150, 15.6), pr.P(574, 176, 15.6), pr.P(66, 176, 15.6)], '#2c3e50');
      [[120, '#e67e22'], [210, '#79a95c'], [388, '#c2452d'], [470, '#ffcc00']].forEach(([fx, fc]) => { bg += pr.planeCircle(fx, 163, 15.8, 6, fc); });
      [120, 200, 280, 360, 440, 520].forEach(x => { bg += pr.box3(x - 11, 186, 22, 12, 9, '#8a6248'); });
      // 圓桌：桌面 planeCircle＋南緣弧帶（front）＋桌柱
      REST_TABLES.forEach((t, i) => {
        bg += pr.planeCircle(t.x, t.z, 0, 13, '#c8d2cc');
        bg += pr.box3(t.x - 5, t.z - 5, 10, 10, 5, '#8a6248');
        bg += pr.planeCircle(t.x, t.z, 14, 36, '#f3e2c7');
        bg += pr.planeCircle(t.x, t.z, 14.6, 33, '#ffffff');
        bg += pr.planeCircle(t.x, t.z, 15.2, 7, i ? '#e09a3e' : '#c2452d');
        front += pr.rimBand(t.x, t.z, 36, 14, 5, '#f5f0e6');
      });
      [[738, 190], [802, 190], [958, 238], [1022, 238]].forEach(([sx, sy]) => { bg += pr.box3(sx - 9, sy - 2, 18, 10, 9, '#8a6248'); });
      // 冰箱（高盒）＋字在南面
      const fridge = pr.boxFaces(900, 36, 60, 28, 50, '#2e5f8a');
      bg += fridge.back; front += fridge.front;
      front += txt(pr.P(922, 64, 30), 5, '食', 15, '#ffffff');
      // 盆栽
      bg += pr.box3(1082, 96, 26, 14, 10, '#b04a3a');
      const pc = pr.P(1095, 103, 0);
      bg += '<circle cx="' + pc.x.toFixed(1) + '" cy="' + (pc.y - 26).toFixed(1) + '" r="12" fill="#79a95c"/><circle cx="' + (pc.x - 9).toFixed(1) + '" cy="' + (pc.y - 18).toFixed(1) + '" r="8" fill="#7fa663"/><circle cx="' + (pc.x + 9).toFixed(1) + '" cy="' + (pc.y - 19).toFixed(1) + '" r="8" fill="#7fa663"/>';
      // 入口墊
      bg += pr.box3(550, 264, 120, 28, 2, '#8a6248');
      bg += txt(pr.P(597, 283, 4), 0, '入 口', 11, '#ffe9b8');
      return '<svg id="rest-bg25" viewBox="0 0 ' + REST_PW + ' 300" style="position:absolute; left:0; top:0; width:' + REST_PW + 'px; height:300px;">' + bg + '</svg>'
        + '<svg id="rest-front25" viewBox="0 0 ' + REST_PW + ' 300" style="position:absolute; left:0; top:0; width:' + REST_PW + 'px; height:300px; z-index:950; pointer-events:none;">' + front + '</svg>';
    }
    function ensureRestInterior() {
      if (document.getElementById('rest-stage')) return;
      const host = document.querySelector('#landmark-restaurant .island-platform-top') || document.querySelector('#landmark-restaurant .island-platform') || document.getElementById('landmark-restaurant');
      if (!host) return;
      const stage = document.createElement('div');
      stage.id = 'rest-stage';
      stage.innerHTML = '<div id="rest-rooms">' + buildRestRoomsHTML() + '</div>';
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
        const maxPan = Math.max(0, REST_PW - visible);
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
      if (visible >= REST_PW) pan = (REST_PW - visible) / 2;
      else pan = Math.max(0, Math.min(REST_PW - visible, focusX - visible / 2));
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
          const _rps = restPlateScreen(gameState.currentX || 440, gameState.currentY || 184);
          pp.style.display = 'block'; pp.style.left = _rps.x + 'px'; pp.style.top = _rps.y + 'px'; pp.style.zIndex = '990'; // v9.20 食物置頂；v9.51 盤子改放投影桌面上
          setIco(pp, todaysSpecial().emoji);
        } else if (pp) pp.style.display = 'none';
      }
      let focus = 300;
      if (playerIn) focus = REST_PROJ.P(gameState.currentX || 610, gameState.currentY || 252, 0).x;
      else {
        const inner = (gameState.npcs || []).find(n => n.insideLoc === 'restaurant');
        if (inner) focus = REST_PROJ.P(inner.x, inner.y, 0).x;
      }
      updateRestPan(focus);
      syncMiniExplode('rest', 'restaurant', REST_PROJ, _restPanCur); // v9.67
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
      setIco(pop, emoji);
      const _prC = (typeof PROJ !== 'undefined') ? PROJ.forRooms(layer.id) : null;
      const _anC = _prC ? _prC.P(npc.x, npc.y, 0) : null;
      pop.style.left = ((_anC ? _anC.x : npc.x) - 8) + 'px'; pop.style.top = ((_anC ? _anC.y : npc.y) - 70) + 'px';
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
      if (lseat) { npc.path = [...npcExitPrefix(npc), ...streetLegs(npc.insideLoc ? INTERIORS[npc.insideLoc].worldDoorX : npc.x, npcCurStreet(npc), NPC_DOOR_X.restaurant, 'A'), INTERIORS.restaurant.doorIn, lseat]; npc.arrive = 'seat'; npc.state = 'path'; }
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
