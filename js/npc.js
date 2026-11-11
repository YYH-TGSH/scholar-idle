/* ==========================================================================
   🚶 NPC 系統（R6 拆分自 town.js）：NPC 定義/座位/路徑/圖層/泡泡/晚餐/公園社交/updateNPCs
   載入順序：… → town → npc → interiors → …（見 town.js 頭）
   主要符號：NPC_DEFS, NPC_SEAT_POOLS, ensureNPCs, buildNPCLayer, applySilhouette,
   npcGoToDest, npcPickTarget, updateNPCs, updateParkSocial, checkHomeDinner(於 fs.js),
   updateHomeDinnerVisual, DINNER_SEATS, Z_LAYER, PLAYER_RESERVED
   ========================================================================== */
    // ================= v9.8 精緻化：座位池＋門口排隊＋全員步行職員＋爸媽 =================
    const NPC_DEFS = [
      { key: 'jie', kind: 'rival', name: '王子傑', homeX: 300, speed: 68, palette: { hair: '#e3ac2e', outfit: '#5aa9e6', shorts: '#7d8fc9', skin: '#fed7aa' }, say: DLG.npc.jie },
      { key: 'kui', kind: 'rival', name: '陳小葵', homeX: 820, speed: 62, palette: { hair: '#e2a0b4', outfit: '#ff6b8a', shorts: '#5a5049', skin: '#fed7aa', hairStyle: 'long' }, say: DLG.npc.kui },
      { key: 'shu', kind: 'rival', name: '高大樹', homeX: 1080, speed: 58, palette: { hair: '#8a6bc9', outfit: '#5ec96f', shorts: '#8a6bc9', skin: '#c98d54' }, say: DLG.npc.shu },
      { key: 'xiaoxuan', kind: 'friend', name: '林曉萱', speed: 60, palette: { hair: '#3a2430', outfit: '#527fa8', shorts: '#a678e0', skin: '#fed7aa', hairStyle: 'long' }, spots: ['school', 'library'], say: DLG.npc.xiaoxuan },
      { key: 'dameng', kind: 'friend', name: '陳大猛', speed: 72, palette: { hair: '#3c2415', outfit: '#ff8fab', shorts: '#6d4c41', skin: '#d9a066', cap: ['#ff8fab', '#e65c00', '#a93226'] }, spots: ['gym', 'restaurant'], say: DLG.npc.dameng },
      { key: 'yuqing', kind: 'friend', name: '蘇語晴', speed: 55, palette: { hair: '#6d4c41', outfit: '#a678e0', shorts: '#4a4038', skin: '#f0b98a', hairStyle: 'bun' }, spots: ['library', 'store'], say: DLG.npc.yuqing },
      { key: 'xiaohao', kind: 'friend', name: '王小豪', speed: 58, palette: { hair: '#3c2415', outfit: '#ff8fab', shorts: '#a93226', skin: '#f0b98a', cap: ['#ffd43b', '#f0a832', '#ffd43b'] }, spots: ['restaurant', 'store'], say: DLG.npc.xiaohao },
      { key: 'teacher', kind: 'staff', name: '王老師', homeX: 560, speed: 62, palette: { hair: '#6b5d4f', outfit: '#7d8fc9', shorts: '#7d8fc9', skin: '#f0b98a' }, work: 'school', spot: { x: 575, y: 134 }, shift: { days: 'weekday', start: 480, end: 960 }, say: DLG.npc.teacher },
      { key: 'clerk', kind: 'staff', name: '小惠', homeX: 950, speed: 60, palette: { hair: '#3c2415', outfit: '#4fce7e', shorts: '#2f8f57', skin: '#fed7aa', hairStyle: 'bun' }, work: 'store', spot: { x: 880, y: 150 }, shift: { days: 'daily', start: 480, end: 1320 }, say: DLG.npc.clerk },
      { key: 'librarian', kind: 'staff', name: '小林', homeX: 430, speed: 60, palette: { hair: '#3a2430', outfit: '#8fc9f2', shorts: '#4a6f8f', skin: '#fed7aa', hairStyle: 'bun' }, work: 'library', spot: { x: 575, y: 138 }, shift: { days: 'daily', start: 480, end: 1260 }, say: DLG.npc.librarian },
      { key: 'chef', kind: 'staff', name: '阿火師', homeX: 700, speed: 62, palette: { hair: '#1a1a24', outfit: '#ffffff', shorts: '#ff8fab', skin: '#d9a066', cap: ['#ffffff', '#dcebf5', '#e8d8ee'] }, work: 'restaurant', spot: { x: 300, y: 143 }, shift: { days: 'daily', start: 420, end: 1320 }, say: DLG.npc.chef },
      { key: 'coach', kind: 'staff', name: '阿力', homeX: 880, speed: 85, palette: { hair: '#3c2415', outfit: '#ff5d8f', shorts: '#7d8fc9', skin: '#c98d54', headband: '#ff5d8f' }, work: 'gym', spot: { x: 620, y: 120 }, shift: { days: 'daily', oncall: true }, say: DLG.npc.coach },
      { key: 'clerk2', kind: 'staff', name: '阿哲', homeX: 1010, speed: 60, palette: { hair: '#3a2430', outfit: '#a678e0', shorts: '#3c2415', skin: '#d9a066', headband: '#a678e0' }, work: 'store', spot: { x: 990, y: 150 }, shift: { days: 'daily', start: 1320, end: 480 }, say: DLG.npc.clerk2 },
      { key: 'dad', kind: 'parent', name: '爸爸', speed: 60, palette: { hair: '#3a2430', outfit: '#7d8fc9', shorts: '#6d4c41', skin: '#f0b98a' }, sleepSpot: { x: 118, y: 158 }, homeSpot: { x: 480, y: 215 }, say: DLG.npc.dad },
      { key: 'mom', kind: 'parent', name: '媽媽', speed: 60, palette: { hair: '#a678e0', outfit: '#ff5d8f', shorts: '#a678e0', skin: '#fed7aa', hairStyle: 'bun' }, sleepSpot: { x: 206, y: 158 }, homeSpot: { x: 530, y: 215 }, say: DLG.npc.mom },
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
    const NOODLE_NIGHT_LINES = DLG.noodle; // v9.83 C 批：本體移至 DLG
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
        mk(headG, 'rect', { x: 4, y: -4, width: 8, height: 5, fill: '#ffffff', stroke: '#7c4a63', 'stroke-width': 0.8 });
        mk(headG, 'rect', { x: 4, y: 0, width: 8, height: 1, fill: '#dcebf5' });
      }
      if (d.key === 'shu') svg.setAttribute('viewBox', '0 -1.5 16 26.5'); // 全員最高
      if (d.key === 'teacher') { // 高馬尾＋紅框眼鏡
        mk(headG, 'rect', { x: 12, y: 5, width: 2, height: 8, fill: d.palette.hair });
        mk(headG, 'rect', { x: 4.5, y: 6.5, width: 3, height: 3, fill: 'none', stroke: '#ff5d8f', 'stroke-width': 0.7 });
        mk(headG, 'rect', { x: 8.5, y: 6.5, width: 3, height: 3, fill: 'none', stroke: '#ff5d8f', 'stroke-width': 0.7 });
      }
      if (d.key === 'kui') { // 雙丸子頭
        mk(headG, 'circle', { cx: 3, cy: 2, r: 1.7, fill: d.palette.hair });
        mk(headG, 'circle', { cx: 13, cy: 2, r: 1.7, fill: d.palette.hair });
      }
      if (d.key === 'coach' && bodyG) { // 寬肩＋哨子
        const jacket = bodyG.querySelector('rect[x="3"][y="11"]');
        if (jacket) { jacket.setAttribute('x', '2'); jacket.setAttribute('width', '12'); }
        mk(bodyG, 'rect', { x: 7, y: 11, width: 2, height: 2, fill: '#fff5f9', stroke: '#7c4a63', 'stroke-width': 0.5 });
      }
      if (d.key === 'mom' && bodyG) mk(bodyG, 'rect', { x: 5, y: 13, width: 6, height: 5, fill: '#ffffff', opacity: 0.92 }); // 圍裙色塊
      if (d.key === 'dad') { // 灰髮＋微駝
        svg.querySelectorAll('.pixel-head-group rect[y="5"]').forEach(r => r.setAttribute('fill', '#b8a6c9'));
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
              capEl.querySelectorAll('rect').forEach(r => { const f = r.getAttribute('fill'); if (f === '#ffd43b') r.setAttribute('fill', d.palette.cap[0]); else if (f === '#f0a832') r.setAttribute('fill', d.palette.cap[1]); else if (f === '#ffd43b') r.setAttribute('fill', d.palette.cap[2]); });
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
          const base = document.createElement('div'); base.className = 'doll-base'; base.setAttribute('aria-hidden', 'true'); el.insertBefore(base, el.firstChild); // R2 公仔底座
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
      fg.innerHTML = `<svg viewBox="118 110 48 25" style="width:100%; height:100%; display:block;"><g id="sch-podium"><rect x="118" y="110" width="48" height="6" fill="#b0743e" stroke="#5c2e3e" stroke-width="1.5" /><rect x="121" y="116" width="42" height="17" fill="#a15c72" stroke="#5c2e3e" stroke-width="1.5" /><rect x="118" y="131" width="48" height="4" fill="#6d4c41" /></g></svg>`;
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
      bubble.textContent = customText || dlgPick('npc.' + def.key, def.say);
      layer.appendChild(bubble);
      setTimeout(() => bubble.remove(), 2600);
    }
    // ================= v9.13 住家精緻化：晚餐同桌 =================
    const DINNER_SEATS = { dad: { x: 624, y: 162 }, mom: { x: 685, y: 162 } }; // v9.23.1 坐進桌北側的椅子（椅心 624/685）
    const DINNER_SAY = DLG.dinner; // v9.83 C 批：本體移至 DLG
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
        + pr.planeCircle(655, 184, 14.6, 17, '#ff5d8f') + pr.planeCircle(655, 184, 15.2, 10, '#ffb08a')
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
    const PARK_CHAT_OPEN = DLG.parkOpen; // v9.83 C 批：本體移至 DLG
    const PARK_CHAT_REPLY = DLG.parkReply; // v9.83 C 批：本體移至 DLG
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
      npcSay(sp, dlgPick('park.open', PARK_CHAT_OPEN));
      if (Math.random() < 0.65) {
        const others = c.filter(m => m !== sp);
        const rp = others[Math.floor(Math.random() * others.length)];
        gameState._parkReply = { at: absMin + 2 + Math.random() * 3, key: rp.key, line: dlgPick('park.reply', PARK_CHAT_REPLY) };
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
                if (Math.random() < 0.4) npcSay(npc, dlgPick('teacher.roam', TEACHER_ROAM_LINES));
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
              if (Math.random() < 0.002) npcSay(npc, dlgPick('noodle', NOODLE_NIGHT_LINES)); // v9.16 深夜窗邊對話
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
