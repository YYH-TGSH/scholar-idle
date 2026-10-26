/* ==========================================================================
   🎮 GBA SCHOLAR IDLE - UI & VISUAL ENGINE (v9.10.4)
   GBA 雙層像素框、抽屜面板、衣櫃像素繪圖、考試、小遊戲與 NPC 視覺渲染
   ========================================================================== */

    // ------------------------------------------
    // 網頁元件快取
    // ------------------------------------------
    const elGradeTitle = document.getElementById("grade-title");
    const elMoneyVal = document.getElementById("money-val");
    const elCalendarDay = document.getElementById("calendar-day");
    const elCalendarTime = document.getElementById("calendar-time");
    const elCalendarMode = document.getElementById("calendar-mode");
    const elExamRate = document.getElementById("exam-rate-lbl");
    const elBtnExam = document.getElementById("btn-exam-trigger");

    const elEnergyBar = document.getElementById("bar-energy");
    const elEnergyLbl = document.getElementById("lbl-energy");
    const elHungerBar = document.getElementById("bar-hunger");
    const elHungerLbl = document.getElementById("lbl-hunger");
    const elStressBar = document.getElementById("bar-stress");
    const elStressLbl = document.getElementById("lbl-stress");

    // 大地圖
    const elMapViewport = document.getElementById("map-viewport");
    const elTownMap = document.getElementById("town-map");
    const elLandmarks = {
      home: document.getElementById("landmark-home"),
      school: document.getElementById("landmark-school"),
      gym: document.getElementById("landmark-gym"),
      restaurant: document.getElementById("landmark-restaurant"),
      library: document.getElementById("landmark-library"),
      store: document.getElementById("landmark-store")
    };
    const elStageBoard = document.getElementById("stage-board");
    const elCharWrap = document.getElementById("char-wrap");
    const elCharBubble = document.getElementById("char-bubble");
    const elStudentSprite = document.getElementById("student-sprite");
    const elParticleEmitter = document.getElementById("particle-emitter");

    // 商店背包
    const elBagChicken = document.getElementById("bag-chicken");
    const elBagDrink = document.getElementById("bag-drink");
    const elBagMentalbook = document.getElementById("bag-mentalbook");
    const elUseChicken = document.getElementById("btn-use-chicken");
    const elUseDrink = document.getElementById("btn-use-drink");
    const elUseMentalbook = document.getElementById("btn-use-mentalbook");
    const elBookOwned = document.getElementById("lbl-book-owned");
    const elShoesOwned = document.getElementById("lbl-shoes-owned");
    const elAlertBar = document.getElementById("alert-bar");
    const elLockBtn = document.getElementById("btn-lock-mode");

    // ------------------------------------------
    // 側邊抽屜面版控制
    // ------------------------------------------
    function toggleDrawer(id) {
      playSound('click');
      const target = document.getElementById(`drawer-${id}`);
      if (!target) return;
      const isOpen = target.classList.contains("open");

      closeAllDrawers();

      if (!isOpen) {
        target.classList.add("open");
        syncSheetBackdrop(); // v9.2
        if (id === 'friends' && typeof renderFriendsList === 'function') {
          renderFriendsList();
        }
        if (id === 'build' && typeof renderBuildDrawer === 'function') {
          renderBuildDrawer();
        }
      }
    }

    function closeAllDrawers() {
      document.querySelectorAll(".drawer-panel").forEach(drawer => {
        drawer.classList.remove("open");
      });
      syncSheetBackdrop(); // v9.2
    }

    // v9.2 底部彈出卡片：遮罩與任一開啟中的面板同步；點遮罩/Esc 關閉
    function syncSheetBackdrop() {
      const bd = document.getElementById("sheet-backdrop");
      if (!bd) return;
      bd.classList.toggle("show", !!document.querySelector(".drawer-panel.open"));
    }
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAllDrawers(); });


    // ==========================================
    // 🚪 衣櫃換裝與像素編輯器核心邏輯
    // ==========================================

    // ==========================================
    // 🎨 紙娃娃系統：v8.3 統一為真角色座標；v8.5 再把繪圖格細分為 32x50 HD。
    // v8.2 以前角色是 16x25、編輯器/預設/預覽卻是 18x30 的另一隻假人，
    // 貼圖被壓進 16x25 後帽子蓋到臉上、衣服全錯位 — 這是風格不一致的根因。
    // ==========================================
    // v8.5 高解析紙娃娃：角色邏輯座標仍是 16x25，但實際顯示為 32x50。
    // 編輯與自訂貼圖改用 32x50 (每 1 個角色格切成 2x2 細格)，共 1,600 格、4 倍細節。
    const SKIN_W = 32, SKIN_H = 50, SKIN_N = 1600;
    const SKIN_SRC_W = 16, SKIN_SRC_H = 25;

    function skinSourceSize(length) {
      const known = {
        1600: [32, 50],
        400: [16, 25],
        540: [18, 30],
        432: [18, 24],
        256: [16, 16]
      };
      if (known[length]) return known[length];
      // 未知舊格式：找最接近角色長寬比的因數組合，避免直接毀掉資料
      let best = null;
      for (let w = 1; w <= Math.sqrt(length); w++) {
        if (length % w !== 0) continue;
        const h = length / w;
        const score = Math.abs((w / h) - (SKIN_W / SKIN_H));
        if (!best || score < best.score) best = { size: [w, h], score };
      }
      return best ? best.size : null;
    }

    // 任何舊格式 (16x25 / 18x30 / 18x24 / 16x16) → 32x50 置中取樣重採樣。
    // 16x25 升級時每個舊像素會正好變成 2x2，不會歪位或遺失。
    function normalizeSkinPixels(pixels) {
      if (!pixels || !pixels.length) return null;
      if (pixels.length === SKIN_N) return pixels.slice();
      const size = skinSourceSize(pixels.length);
      if (!size) return null;
      const [srcW, srcH] = size;
      const out = new Array(SKIN_N).fill(null);
      for (let y = 0; y < SKIN_H; y++) {
        const sy = Math.min(srcH - 1, Math.floor((y + 0.5) * srcH / SKIN_H));
        for (let x = 0; x < SKIN_W; x++) {
          const sx = Math.min(srcW - 1, Math.floor((x + 0.5) * srcW / SKIN_W));
          out[y * SKIN_W + x] = pixels[sy * srcW + sx] || null;
        }
      }
      return out;
    }

    // 像素字串解析：預設美術以 16x25 角色格作畫，再等倍放大到 32x50 HD 格。
    // 這保留 v8.3 已校準的位置，同時讓預設與自訂服飾回到同一個資料格式。
    function parsePixelStr(str) {
      const colorMap = {
        '.': null,
        'K': '#182042', 'R': '#e74c3c', 'r': '#c0392b', 'W': '#ffffff',
        'Y': '#f1c40f', 'y': '#ffd60a', 'B': '#2980b9', 'b': '#1f3a93',
        'N': '#fed7aa', 'H': '#3c2415', 'G': '#30d158', 'g': '#27ae60',
        'P': '#bf5af2', 'p': '#8e44ad', 'O': '#ff9f0a', 'A': '#86868b',
        'C': '#aedefc', 'D': '#8b5a2b', 'E': '#4a3728'
      };
      const lines = str.trim().split('\n').map(l => l.trim());
      const pixels = new Array(SKIN_N).fill(null);
      for (let sy = 0; sy < SKIN_SRC_H; sy++) {
        const line = lines[sy] || '';
        for (let sx = 0; sx < SKIN_SRC_W; sx++) {
          const color = colorMap[line[sx]] !== undefined ? colorMap[line[sx]] : null;
          if (!color) continue;
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              pixels[(sy * 2 + dy) * SKIN_W + (sx * 2 + dx)] = color;
            }
          }
        }
      }
      return pixels;
    }

    // 預設服飾 (v8.3 全部重繪：對齊真角色的帽/身/鞋座標與色票)
    const SKIN_PRESETS = {
      hat: [
        { id: "preset_hat_none", name: "脫下帽子", pixels: null },
        { id: "preset_hat_red_cap", name: "棒球便帽", pixels: parsePixelStr(`
          ................
          ...RRRRRRRRRR...
          ...RRRRWWRRRR...
          ..rrrrrrrrrrrr..
          .rrrrrrrrrrrrrr.
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
        `) },
        { id: "preset_hat_yellow_band", name: "學霸頭帶", pixels: parsePixelStr(`
          ................
          ................
          ................
          ................
          ................
          ....YYYYYYYY....
          ...YYYYYYYYYY...
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
        `) },
        { id: "preset_hat_wizard", name: "魔法帽", pixels: parsePixelStr(`
          .......PP.......
          .......PP.......
          ......PPyPP.....
          ......PPPP......
          .....PPPPPP.....
          ....PPPPyPPP....
          ..PPPPPPPPPPPP..
          ..YYYYYYYYYYYY..
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
        `) }
      ],
      clothes: [
        { id: "preset_clothes_none", name: "預設制服", pixels: null },
        { id: "preset_clothes_red", name: "活力紅外套", pixels: parsePixelStr(`
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ...RYRRRRRRYR...
          ..RRYRRRRRRYRR..
          ..RRYRRRRRRYRR..
          ..RRYRRRRRRYRR..
          ..RRYRRRRRRYRR..
          ..NNRRRRRRRRNN..
          ..NNBBBBBBBBNN..
          ....BBBBBBBB....
          ....BBBbbBBB....
          ....BBB..BBB....
          ................
          ................
          ................
          ................
        `) },
        { id: "preset_clothes_dino", name: "恐龍睡衣", pixels: parsePixelStr(`
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ...GGGGGGGGGG...
          ..GGGGGGGGGGGG..
          ..GGGGCCCCGGGG..
          ..GGGGCCCCGGGG..
          ..GGGGCCCCGGGG..
          ..NNGGCCCCGGNN..
          ..NNGGGGGGGGNN..
          ....GGGGGGGG....
          ....GGGGGGGG....
          ....GGG..GGG....
          ................
          ................
          ................
          ................
        `) },
        { id: "preset_clothes_scholar", name: "學霸金袍", pixels: parsePixelStr(`
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ...YYYWWWWYYY...
          ..YYYYYYYYYYYY..
          ..YYYYYYYYYYYY..
          ..YYYYYYYYYYYY..
          ..YYYYYYYYYYYY..
          ..NNKKKKKKKKNN..
          ..NNYYYYYYYYNN..
          ....YYYYYYYY....
          ....YYYYYYYY....
          ....YYY..YYY....
          ................
          ................
          ................
          ................
        `) }
      ],
      shoes: [
        { id: "preset_shoes_none", name: "預設球鞋", pixels: null },
        { id: "preset_shoes_red", name: "紅色運動鞋", pixels: parsePixelStr(`
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ...RRRR..RRRR...
          ..RRRRR..RRRRR..
          ...WWWW..WWWW...
          ................
        `) },
        { id: "preset_shoes_yellow", name: "黃色布鞋", pixels: parsePixelStr(`
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ................
          ...YYYY..YYYY...
          ..YYYYY..YYYYY..
          ...WWWW..WWWW...
          ................
        `) }
      ]
    };

    // 將 pixels 正規化後轉成 32x50 HD PNG DataURL
    function pixelsToDataURL(pixels) {
      const px = normalizeSkinPixels(pixels);
      if (!px) return "";
      const canvas = document.createElement('canvas');
      canvas.width = SKIN_W; canvas.height = SKIN_H;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, SKIN_W, SKIN_H);
      for (let y = 0; y < SKIN_H; y++) {
        for (let x = 0; x < SKIN_W; x++) {
          const color = px[y * SKIN_W + x];
          if (color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
        }
      }
      return canvas.toDataURL('image/png');
    }

    // 依部位取得目前裝備的 pixels (preset 或 custom)
    function getEquippedPixels(type) {
      const id = gameState.equipped[type];
      if (!id) return null;
      if (id.startsWith('preset_')) {
        const preset = (SKIN_PRESETS[type] || []).find(i => i.id === id);
        return preset ? normalizeSkinPixels(preset.pixels) : null;
      }
      const custom = (gameState.customSkins[type] || []).find(i => i.id === id);
      return custom ? normalizeSkinPixels(custom.pixels) : null;
    }

    // 用「真角色」SVG 複製出預覽 (保證跟地圖上的小人長得一模一樣)
    function buildCharacterPreview(container, pixelsByType, wPx) {
      if (!container) return;
      const src = document.getElementById('student-sprite');
      if (!src) return;
      container.innerHTML = '';
      const clone = src.cloneNode(true);
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      const w = wPx || 80;
      clone.style.width = w + 'px';
      clone.style.height = (w * 25 / 16) + 'px';
      clone.style.position = 'relative';
      const imgs = clone.querySelectorAll('image');
      ['shoes', 'clothes', 'hat'].forEach((type, i) => {
        const img = imgs[i]; if (!img) return;
        const px = pixelsByType ? pixelsByType[type] : null;
        if (px) {
          const url = pixelsToDataURL(px);
          img.setAttribute('href', url); img.setAttribute('src', url);
          img.style.display = 'block';
        } else img.style.display = 'none';
      });
      const has = t => !!(pixelsByType && pixelsByType[t]);
      const cg = clone.querySelector('.clothes'); if (cg && has('clothes')) cg.style.opacity = '0';
      const sp = clone.querySelector('.pixel-sport-pattern'); if (sp && has('clothes')) sp.style.opacity = '0';
      const fl = clone.querySelector('.pixel-foot-l'), fr = clone.querySelector('.pixel-foot-r');
      if (has('shoes')) { if (fl) fl.style.opacity = '0'; if (fr) fr.style.opacity = '0'; }
      const cap = clone.querySelector('.pixel-cap-default'); if (cap && has('hat')) cap.style.opacity = '0';
      container.appendChild(clone);
    }

    function syncWardrobePreview() {
      const slot = document.getElementById('wardrobe-preview-slot');
      if (!slot) return;
      buildCharacterPreview(slot, { hat: getEquippedPixels('hat'), clothes: getEquippedPixels('clothes'), shoes: getEquippedPixels('shoes') }, 84);
    }

    // 應用當前穿搭至角色 (與預覽小人)
    // 應用當前穿搭至角色
    function applyEquippedSkins() {
      const types = ['hat', 'clothes', 'shoes'];
      types.forEach(type => {
        const pixels = getEquippedPixels(type);
        const dataUrl = pixels ? pixelsToDataURL(pixels) : "";
        const mainEl = document.getElementById(`char-custom-${type}`);
        if (mainEl) {
          if (dataUrl) {
            mainEl.setAttribute('src', dataUrl);
            mainEl.setAttribute('href', dataUrl);
            mainEl.style.display = 'block';
          } else {
            mainEl.style.display = 'none';
          }
        }
      });

      const mainClothes = document.querySelector('#student-sprite .clothes');
      const mainSportPattern = document.querySelector('#student-sprite .pixel-sport-pattern');
      const mainFootL = document.querySelector('#student-sprite .pixel-foot-l');
      const mainFootR = document.querySelector('#student-sprite .pixel-foot-r');
      const mainCap = document.querySelector('#student-sprite .pixel-cap-default');

      const hasCustomClothes = !!gameState.equipped.clothes && gameState.equipped.clothes !== 'preset_clothes_none';
      if (mainClothes) mainClothes.style.opacity = hasCustomClothes ? '0' : '1';
      if (mainSportPattern) mainSportPattern.style.opacity = hasCustomClothes ? '0' : '1';

      const hasCustomShoes = !!gameState.equipped.shoes && gameState.equipped.shoes !== 'preset_shoes_none';
      if (mainFootL) mainFootL.style.opacity = hasCustomShoes ? '0' : '1';
      if (mainFootR) mainFootR.style.opacity = hasCustomShoes ? '0' : '1';

      // v8.3：戴自訂帽子時要把預設棒球帽藏起來 (以前沒藏，兩頂帽子疊在一起)
      const hasCustomHat = !!gameState.equipped.hat && gameState.equipped.hat !== 'preset_hat_none';
      if (mainCap) mainCap.style.opacity = hasCustomHat ? '0' : '1';

      syncWardrobePreview();
    }

    let currentWardrobeTab = 'hat';
    let editorTool = 'pencil';
    let editorMirror = false;
    let editorZoom = false;
    let editorRecentColors = [];
    let editorSelectedColor = '#e74c3c';
    let editorCanvasPixels = new Array(SKIN_N).fill(null);
    let editorHistory = [];
    let editorFuture = [];
    let editorEditingId = null;   // 非 null = 正在編輯既有自訂服飾
    let editorPendingLoad = null; // 開啟編輯器時要載入的 pixels
    let isDrawingOnCanvas = false;

    function openWardrobeModal(event) {
      if (event) event.stopPropagation();
      playSound('click');
      document.getElementById('wardrobe-overlay').classList.add('active');
      syncWardrobePreview();
      switchWardrobeTab(currentWardrobeTab);
      applyEquippedSkins();
    }

    function closeWardrobeModal() {
      playSound('click');
      document.getElementById('wardrobe-overlay').classList.remove('active');
      saveGameData();
    }

    function switchWardrobeTab(type) {
      playSound('click');
      currentWardrobeTab = type;

      ['hat', 'clothes', 'shoes'].forEach(t => {
        const btn = document.getElementById(`wardrobe-tab-${t}`);
        if (btn) {
          if (t === type) btn.classList.add('active');
          else btn.classList.remove('active');
        }
      });

      renderWardrobeItems();
    }

    function renderWardrobeItems() {
      const container = document.getElementById('wardrobe-items-list');
      if (!container) return;
      container.innerHTML = "";

      const type = currentWardrobeTab;
      const presets = SKIN_PRESETS[type] || [];
      const customs = gameState.customSkins[type] || [];
      const equippedId = gameState.equipped[type];

      const allItems = [...presets, ...customs];

      allItems.forEach(item => {
        const isEquipped = (equippedId === item.id || (!equippedId && item.id.includes('_none')));

        const card = document.createElement('div');
        card.className = `wardrobe-item-card ${isEquipped ? 'equipped' : ''}`;

        const dataUrl = item.pixels ? pixelsToDataURL(item.pixels) : "";
        let previewHtml = "";

        if (dataUrl) {
          let imgH = '60px';
          let imgW = '38px';
          previewHtml = `<img src="${dataUrl}" style="width:${imgW}; height:${imgH}; image-rendering:pixelated; margin-bottom:5px; pointer-events:none;">`;
        } else {
          previewHtml = `<div style="font-size: 1.5rem; margin-bottom: 5px; pointer-events:none;">❌</div>`;
        }

        card.innerHTML = `
          ${previewHtml}
          <div style="font-size:0.75rem; font-weight:700; margin-bottom:6px; color:var(--text-color); max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(item.name)}</div>
          <div style="display:flex; gap:4px; width:100%;">
            <button onclick="equipSkin('${type}', '${item.id}', event)" style="flex:1; font-size:0.7rem; padding:9px 3px; border:none; border-radius:6px; background:var(--primary); color:white; font-weight:700; cursor:pointer;">裝備</button>
            ${!item.id.startsWith('preset_') ? `<button onclick="editCustomSkin('${type}', '${item.id}', event)" title="編輯" style="font-size:0.7rem; padding:9px 8px; border:none; border-radius:6px; background:#0a84ff; color:white; font-weight:700; cursor:pointer;">✏️</button><button onclick="downloadSkinById('${type}', '${item.id}', event)" title="下載 PNG 分享" style="font-size:0.7rem; padding:9px 8px; border:none; border-radius:6px; background:#30d158; color:white; font-weight:700; cursor:pointer;">📥</button><button onclick="deleteCustomSkin('${type}', '${item.id}', event)" style="font-size:0.7rem; padding:9px 8px; border:none; border-radius:6px; background:var(--secondary); color:white; font-weight:700; cursor:pointer;">🗑️</button>` : ''}
          </div>
        `;

        card.onclick = () => {
          equipSkin(type, item.id);
        };

        container.appendChild(card);
      });
    }

    function equipSkin(type, itemId, event) {
      if (event) event.stopPropagation();
      playSound('click');

      if (itemId.includes('_none')) {
        gameState.equipped[type] = null;
      } else {
        gameState.equipped[type] = itemId;
      }

      applyEquippedSkins();
      renderWardrobeItems();
      saveGameData();
    }

    function deleteCustomSkin(type, itemId, event) {
      if (event) event.stopPropagation();
      if (!confirm("確定要刪除這件自定義服飾嗎？")) return;
      playSound('click');

      if (gameState.equipped[type] === itemId) {
        gameState.equipped[type] = null;
      }

      gameState.customSkins[type] = gameState.customSkins[type].filter(item => item.id !== itemId);

      applyEquippedSkins();
      renderWardrobeItems();
      saveGameData();
    }

    // v8.9.1 服飾名稱會進 innerHTML (含朋友分享碼帶入的名字)，渲染前一律跳脫
    function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
    function sanitizeSkinName(s) { return String(s || '').replace(/[<>&"']/g, '').slice(0, 24); }

    function getEditorType() {
      const r = document.querySelector('input[name="editor-skin-type"]:checked');
      return r ? r.value : currentWardrobeTab;
    }

    function openPixelEditor() {
      playSound('click');
      document.getElementById('wardrobe-main-view').style.display = 'none';
      document.getElementById('wardrobe-editor-view').style.display = 'flex';
      const type = currentWardrobeTab;
      const radio = document.querySelector(`input[name="editor-skin-type"][value="${type}"]`);
      if (radio) { radio.checked = true; }
      updateEditorTypeUI(type);
      if (editorPendingLoad) {
        editorCanvasPixels = [...editorPendingLoad];
        editorPendingLoad = null;
      } else {
        editorEditingId = null;
        editorCanvasPixels = new Array(SKIN_N).fill(null);
        document.getElementById('editor-skin-name').value = "我的新設計";
      }
      editorHistory = []; editorFuture = [];
      initEditorCanvas();
      initEditorPalette();
    }

    function editCustomSkin(type, itemId, event) {
      if (event) event.stopPropagation();
      const item = (gameState.customSkins[type] || []).find(i => i.id === itemId);
      if (!item) return;
      editorPendingLoad = normalizeSkinPixels(item.pixels);
      editorEditingId = itemId;
      currentWardrobeTab = type;
      openPixelEditor();
      document.getElementById('editor-skin-name').value = item.name;
      queueFloatingText(`✏️ 編輯中：${item.name}（儲存會覆蓋原設計）`);
    }

    function closePixelEditor() {
      playSound('click');
      editorEditingId = null;
      document.getElementById('wardrobe-editor-view').style.display = 'none';
      document.getElementById('wardrobe-main-view').style.display = 'flex';
      switchWardrobeTab(currentWardrobeTab);
      syncWardrobePreview();
    }

    function updateEditorTypeUI(type) {
      ['hat', 'clothes', 'shoes'].forEach(t => {
        const lbl = document.getElementById(`editor-type-lbl-${t}`);
        if (lbl) lbl.classList.toggle('active', t === type);
      });
      refreshEditorPreview();
      renderTemplateChips();
    }

    // ---- v8.3 編輯器歷史 / 預覽 ----
    function pushEditorHistory() {
      editorHistory.push([...editorCanvasPixels]);
      if (editorHistory.length > 60) editorHistory.shift();
      editorFuture = [];
    }
    function undoEditor() {
      if (!editorHistory.length) return;
      playSound('click');
      editorFuture.push([...editorCanvasPixels]);
      editorCanvasPixels = editorHistory.pop();
      refreshEditorCanvas(); refreshEditorPreview();
    }
    function redoEditor() {
      if (!editorFuture.length) return;
      playSound('click');
      editorHistory.push([...editorCanvasPixels]);
      editorCanvasPixels = editorFuture.pop();
      refreshEditorCanvas(); refreshEditorPreview();
    }
    function refreshEditorCanvas() {
      document.querySelectorAll('.pixel-grid-cell').forEach(cell => {
        const idx = parseInt(cell.dataset.index);
        const c = editorCanvasPixels[idx];
        cell.style.backgroundColor = c ? c : 'transparent';
      });
    }
    function refreshEditorPreview() {
      const slot = document.getElementById('editor-preview-slot');
      if (!slot) return;
      const type = getEditorType();
      const map = { hat: getEquippedPixels('hat'), clothes: getEquippedPixels('clothes'), shoes: getEquippedPixels('shoes') };
      map[type] = editorCanvasPixels.some(p => p) ? [...editorCanvasPixels] : null;
      buildCharacterPreview(slot, map, 64);
    }
    function floodFillEditor(startIdx) {
      const target = editorCanvasPixels[startIdx];
      const val = editorSelectedColor;
      if (target === val) return;
      pushEditorHistory();
      const stack = [startIdx];
      while (stack.length) {
        const i = stack.pop();
        if (editorCanvasPixels[i] !== target) continue;
        editorCanvasPixels[i] = val;
        const x = i % SKIN_W, y = Math.floor(i / SKIN_W);
        if (x > 0) stack.push(i - 1);
        if (x < SKIN_W - 1) stack.push(i + 1);
        if (y > 0) stack.push(i - SKIN_W);
        if (y < SKIN_H - 1) stack.push(i + SKIN_W);
      }
      refreshEditorCanvas(); refreshEditorPreview();
    }

    function initEditorCanvas() {
      const container = document.getElementById('pixel-canvas-container');
      if (!container) return;
      container.innerHTML = "";
      if (editorCanvasPixels.length !== SKIN_N) editorCanvasPixels = new Array(SKIN_N).fill(null);

      // 剪影仍以真角色 16x25 輪廓為準，展開成 32x50：H 頭/帽、S 膚、C 衣、F 鞋
      const silhouetteRows = [
        "................",
        "...HHHHHHHHHH...",
        "...HHHHHHHHHH...",
        "..HHHHHHHHHHHH..",
        ".HHHHHHHHHHHHHH.",
        "....HHHHHHHH....",
        "...SSSSSSSSSS...",
        "...SSSSSSSSSS...",
        "...SSSSSSSSSS...",
        "....SSSSSSSS....",
        "....SSSSSSSS....",
        "...CCCCCCCCCC...",
        "..CCCCCCCCCCCC..",
        "..CCCCCCCCCCCC..",
        "..CCCCCCCCCCCC..",
        "..CCCCCCCCCCCC..",
        "..SSCCCCCCCCSS..",
        "..SSCCCCCCCCSS..",
        "....CCCCCCCC....",
        "....CCCCCCCC....",
        "....CCCCCCCC....",
        "...FFFF..FFFF...",
        "..FFFFF..FFFFF..",
        "...FFFF..FFFF...",
        "................"
      ];
      const silhouetteStr = silhouetteRows.flatMap(row => {
        const expanded = row.split('').map(ch => ch + ch).join('');
        return [expanded, expanded];
      }).join('');

      for (let i = 0; i < SKIN_N; i++) {
        const cell = document.createElement('div');
        cell.className = "pixel-grid-cell";
        cell.dataset.index = i;
        const sc = silhouetteStr[i];
        if (sc === 'H') cell.classList.add('silhouette-hair');
        else if (sc === 'S') cell.classList.add('silhouette-skin');
        else if (sc === 'C') cell.classList.add('silhouette-clothes');
        else if (sc === 'F') cell.classList.add('silhouette-feet');
        const color = editorCanvasPixels[i];
        if (color) cell.style.backgroundColor = color;
        container.appendChild(cell);
      }

      // 滑鼠 + 觸控統一用 Pointer Events：按住拖曳連續畫 (v8.2 以前觸控只能一格一格點)
      if (!container._v83PointerBound) {
        container._v83PointerBound = true;
        let drawing = false;
        const cellFromPoint = (x, y) => {
          const el = document.elementFromPoint(x, y);
          return (el && el.classList && el.classList.contains('pixel-grid-cell')) ? el : null;
        };
        let panStart = null;
        container.addEventListener('pointerdown', (e) => {
          if (editorTool === 'pan') { // ✋ 移動畫布：拖曳捲動外層容器
            const sc = document.getElementById('pixel-canvas-scroll');
            if (sc) panStart = { x: e.clientX, y: e.clientY, l: sc.scrollLeft, t: sc.scrollTop };
            return;
          }
          const cell = (e.target && e.target.classList && e.target.classList.contains('pixel-grid-cell')) ? e.target : cellFromPoint(e.clientX, e.clientY);
          if (!cell) return;
          e.preventDefault();
          if (editorTool === 'fill' || editorTool === 'picker') { paintCell(cell); return; }
          pushEditorHistory();
          drawing = true;
          paintCell(cell);
        });
        container.addEventListener('pointermove', (e) => {
          if (panStart) {
            const sc = document.getElementById('pixel-canvas-scroll');
            if (sc) { sc.scrollLeft = panStart.l - (e.clientX - panStart.x); sc.scrollTop = panStart.t - (e.clientY - panStart.y); }
            return;
          }
          if (!drawing) return;
          const cell = cellFromPoint(e.clientX, e.clientY);
          if (cell) paintCell(cell);
        });
        const endStroke = () => { panStart = null; if (drawing) { drawing = false; refreshEditorPreview(); } };
        container.addEventListener('pointerup', endStroke);
        container.addEventListener('pointercancel', endStroke);
        container.addEventListener('pointerleave', endStroke);
      }
      refreshEditorPreview();
    }

    const PALETTE_GROUPS = [
      { label: '🕘 最近用色', colors: [] }, // 由 editorRecentColors 動態填入
      { label: '🧑 膚色', colors: ['#ffe0bd', '#fed7aa', '#f1c27d', '#e0ac69', '#c68642', '#8d5524'] },
      { label: '💇 髮色', colors: ['#2c1810', '#4a3728', '#6d4c41', '#8b5a2b', '#b07d48', '#e8c476', '#dfe3e6', '#e74c3c'] },
      { label: '🎨 常用色', colors: ['#182042', '#e74c3c', '#c0392b', '#ffffff', '#f1c40f', '#2980b9', '#1f3a93', '#30d158', '#27ae60', '#ff9f0a', '#bf5af2', '#8e44ad', '#aedefc', '#86868b', '#ff8a8a', '#ffd60a', '#0a84ff', '#fca5a5', '#1d1d1f', '#70b848'] },
    ];
    function initEditorPalette() {
      const container = document.getElementById('palette-groups');
      if (!container) return;
      container.innerHTML = "";
      PALETTE_GROUPS.forEach(group => {
        const colors = group.label.includes('最近') ? editorRecentColors : group.colors;
        if (group.label.includes('最近') && !colors.length) return;
        const lbl = document.createElement('div');
        lbl.className = 'palette-group-label';
        lbl.textContent = group.label;
        container.appendChild(lbl);
        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; margin-bottom: 8px;';
        colors.forEach(color => {
          const dot = document.createElement('div');
          dot.className = `palette-dot ${color === editorSelectedColor ? 'active' : ''}`;
          dot.style.backgroundColor = color;
          dot.onclick = () => { selectPaletteColor(color); };
          grid.appendChild(dot);
        });
        container.appendChild(grid);
      });
    }

    function selectPaletteColor(color) {
      playSound('click');
      editorSelectedColor = color;
      editorRecentColors = [color, ...editorRecentColors.filter(c => c !== color)].slice(0, 8);
      const picker = document.getElementById('editor-custom-color');
      if (picker) picker.value = color;
      initEditorPalette();
    }

    // ---- 部件範本 (16x25 字串圖，展開成 32x50；'.' = 不動) ----
    const SKIN_TEMPLATES = {
      hat: [
        { name: '棒球帽', map: { R: '#e74c3c', D: '#c0392b', W: '#ffffff' }, rows: [
          '................','....RRRRRRR.....','..RRRRRRRRRRR...','.RRRRRRRRRRRRR..','.DDDDDDDDDDDDDD.','....WWWW........','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................'] },
        { name: '毛帽', map: { T: '#1abc9c', B: '#148f77', W: '#ffffff' }, rows: [
          '................','...TTTTTTTTTT...','..TTTTTTTTTTTT..','..TTTTTTTTTTTT..','.TTTTTTTTTTTTTT.','.BBBBBBBBBBBBBB.','.BWBWBWBWBWBWB..','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................'] },
        { name: '畢業帽', map: { K: '#23232b', G: '#f1c40f' }, rows: [
          '................','.KKKKKKKKKKKKKK.','..KKKKKKKKKKKK..','....KKKKKKKK....','....KKKKKKKK....','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................'] },
      ],
      clothes: [
        { name: '學霸制服', map: { N: '#2c3e50', W: '#ffffff', R: '#c0392b', D: '#182042' }, rows: [
          '................','................','................','................','................','................','................','................','................','................','...NNNNNNNNNN...','..NNNNNNNNNNNN..','..NNWWNNNNWWNN..','..NNWWNNRRNNNN..','..NNNWNRRNNNNN..','..NNNWWNNNNNNN..','..SSNNNNNNNSS...','..SSNNNNNNNSS...','....NNNNNNNN....','....NNNNNNNN....','....DDDDDDDD....','................','................','................','................'] },
        { name: '連帽T', map: { G: '#27ae60', D: '#1e8449', W: '#eafaf1' }, rows: [
          '................','................','................','................','................','................','................','................','................','....GGGGGGGG....','..GGGGGGGGGGGG..','.GGGGGGGGGGGGGG.','.GGGGGGGGGGGGGG.','.GGGGGGGGGGGGGG.','.GGGGGDDDDGGGGG.','.GGGGGDDDDGGGGG.','..SSGGGGGGSS....','..SSGGGGGGSS....','....GGGGGGGG....','....GGGGGGGG....','....DDDDDDDD....','................','................','................','................'] },
        { name: '背心紳士', map: { W: '#ffffff', B: '#8b5a2b', D: '#6d4423', G: '#f1c40f' }, rows: [
          '................','................','................','................','................','................','................','................','................','................','...WWBBBBBBWW...','..WWWBBBBBBWWW..','..WWBBBBBBBBWW..','..WWBBBGGBBBB...','..WWBBBBBBBBWW..','..WWBBBBBBBBWW..','..SSBBBBBBBBSS..','..SSBBBBBBBBSS..','....BBBBBBB.....','....BBBBBBB.....','....DDDDDDD.....','................','................','................','................'] },
      ],
      shoes: [
        { name: '紅白球鞋', map: { W: '#ffffff', R: '#e74c3c', D: '#c0392b' }, rows: [
          '................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','...WWWW..WWWW...','..WWWWWWWWWWWW..','...RRRR..RRRR...','................'] },
        { name: '紳士皮鞋', map: { B: '#4a3728', D: '#2c1810', G: '#f1c40f' }, rows: [
          '................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','...BBBB..BBBB...','..BBBBBBBBBBBB..','...DDDD..DDDD...','................'] },
      ],
    };
    function renderTemplateChips() {
      const box = document.getElementById('template-chips');
      if (!box) return;
      const type = getEditorType();
      box.innerHTML = '';
      (SKIN_TEMPLATES[type] || []).forEach((tpl, i) => {
        const b = document.createElement('button');
        b.className = 'speed-btn template-chip';
        b.textContent = (tpl.gacha && !(gameState.unlockedParts || []).includes(tpl.gacha)) ? '🔒 ' + tpl.name : tpl.name; // v9.3
        b.onclick = () => applySkinTemplate(type, i);
        box.appendChild(b);
      });
    }
    function applySkinTemplate(type, i) {
      const tpl = (SKIN_TEMPLATES[type] || [])[i];
      if (!tpl) return;
      if (tpl.gacha && !(gameState.unlockedParts || []).includes(tpl.gacha)) { createFloatingText('🔒 這是轉蛋限定部件，先去商店抽到它！'); return; } // v9.3
      playSound('click');
      pushEditorHistory();
      const rows = tpl.rows.flatMap(row => { const ex = row.split('').map(ch => ch + ch).join(''); return [ex, ex]; }).join('');
      for (let k = 0; k < SKIN_N; k++) {
        const ch = rows[k];
        if (ch && ch !== '.' && tpl.map[ch]) editorCanvasPixels[k] = tpl.map[ch];
      }
      refreshEditorCanvas(); refreshEditorPreview();
      if (!gameState.equippedParts) gameState.equippedParts = { hat: null, clothes: null, shoes: null };
      gameState.equippedParts[type] = tpl.gacha || ('tpl:' + tpl.name); // v9.3 套裝判定
      queueFloatingText(`🧩 已套用範本：${tpl.name}（可繼續微調，不喜歡可復原）`);
    }

    // 編輯工具 (v8.3：鉛筆/橡皮擦/填色/吸色)
    function setEditorTool(tool) {
      playSound('click');
      editorTool = tool;
      ['pencil', 'eraser', 'fill', 'picker', 'pan'].forEach(t => {
        const btn = document.getElementById(`tool-${t}`);
        if (btn) btn.classList.toggle('active', tool === t);
      });
      const cont = document.getElementById('pixel-canvas-container');
      if (cont) cont.style.cursor = tool === 'pan' ? 'grab' : 'crosshair';
    }
    function toggleEditorMirror() {
      playSound('click');
      editorMirror = !editorMirror;
      const b = document.getElementById('tool-mirror');
      if (b) { b.textContent = editorMirror ? '🪞 鏡像：開' : '🪞 鏡像：關'; b.classList.toggle('active', editorMirror); }
    }
    function toggleEditorZoom() {
      playSound('click');
      editorZoom = !editorZoom;
      const cont = document.getElementById('pixel-canvas-container');
      if (cont) cont.classList.toggle('zoomed', editorZoom);
      const b = document.getElementById('editor-zoom-btn');
      if (b) { b.textContent = editorZoom ? '🔍 放大中 (點我還原)' : '🔍 放大 2x'; b.classList.toggle('active', editorZoom); }
      if (editorZoom) setEditorTool('pan'); // 放大後先讓使用者移動到想畫的位置
    }

    function clearEditorCanvas() {
      if (!confirm("確定要清空畫布嗎？")) return;
      playSound('click');
      pushEditorHistory();
      editorCanvasPixels.fill(null);
      refreshEditorCanvas();
      refreshEditorPreview();
    }

    function paintCell(cell) {
      const idx = parseInt(cell.dataset.index);
      if (editorTool === 'picker') {
        const c = editorCanvasPixels[idx];
        if (c) { selectPaletteColor(c); setEditorTool('pencil'); }
        return;
      }
      if (editorTool === 'fill') { floodFillEditor(idx); return; }
      const val = editorTool === 'eraser' ? null : editorSelectedColor;
      if (editorCanvasPixels[idx] !== val) {
        editorCanvasPixels[idx] = val;
        cell.style.backgroundColor = val ? val : 'transparent';
      }
      if (editorMirror) { // 鏡像：同一筆同步畫到左右對稱格
        const x = idx % SKIN_W, y = Math.floor(idx / SKIN_W);
        const midx = y * SKIN_W + (SKIN_W - 1 - x);
        if (midx !== idx && editorCanvasPixels[midx] !== val) {
          editorCanvasPixels[midx] = val;
          const mc = document.querySelector(`.pixel-grid-cell[data-index="${midx}"]`);
          if (mc) mc.style.backgroundColor = val ? val : 'transparent';
        }
      }
    }

    function saveCustomSkin() {
      playSound('click');
      const nameInput = document.getElementById('editor-skin-name');
      const name = nameInput.value.trim() || "未命名服飾";
      const type = getEditorType();

      const isAllTransparent = editorCanvasPixels.every(p => p === null);
      if (isAllTransparent) {
        alert("請在畫布上畫些東西再儲存喔！");
        return;
      }
      if (!gameState.customSkins[type]) gameState.customSkins[type] = [];

      if (editorEditingId) {
        // v8.3 編輯既有作品：覆蓋原設計，不新增一件
        const item = gameState.customSkins[type].find(i => i.id === editorEditingId);
        if (item) { item.pixels = [...editorCanvasPixels]; item.name = sanitizeSkinName(name) || item.name; }
        gameState.equipped[type] = editorEditingId;
        queueFloatingText(`✨ 已更新並裝備：${name}`);
      } else {
        const id = "custom_" + type + "_" + Date.now();
        gameState.customSkins[type].push({ id: id, name: name, type: type, pixels: [...editorCanvasPixels] });
        gameState.equipped[type] = id;
        queueFloatingText(`✨ 成功儲存並裝備：${name}`);
      }
      editorEditingId = null;
      applyEquippedSkins();
      saveGameData();
      closePixelEditor();
    }

    // 📤 下載 PNG (32x50 HD 原格放大 10 倍 = 320x500，分享給朋友匯入即可還原)
    function pixelsToSharePNG(pixels, name) {
      const px = normalizeSkinPixels(pixels);
      if (!px) return;
      const scale = 10;
      const canvas = document.createElement('canvas');
      canvas.width = SKIN_W * scale; canvas.height = SKIN_H * scale;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < SKIN_H; y++) for (let x = 0; x < SKIN_W; x++) {
        const c = px[y * SKIN_W + x];
        if (c) { ctx.fillStyle = c; ctx.fillRect(x * scale, y * scale, scale, scale); }
      }
      const link = document.createElement('a');
      link.download = `${name}_32x50.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
    function exportSkinPNG() {
      playSound('click');
      const name = document.getElementById('editor-skin-name').value.trim() || "custom_skin";
      pixelsToSharePNG(editorCanvasPixels, name);
      queueFloatingText("📥 已下載 PNG！把檔案傳給朋友，他在衣櫃按「上傳 PNG」就能穿上");
    }
    function downloadSkinById(type, itemId, event) {
      if (event) event.stopPropagation();
      playSound('click');
      const item = (gameState.customSkins[type] || []).find(i => i.id === itemId);
      if (!item) return;
      pixelsToSharePNG(item.pixels, item.name);
      queueFloatingText(`📥 已下載「${item.name}」PNG，傳給朋友分享吧！`);
    }

    function sampleImageToPixels(img) {
      const canvas = document.createElement('canvas');
      canvas.width = SKIN_W; canvas.height = SKIN_H;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, SKIN_W, SKIN_H);
      ctx.drawImage(img, 0, 0, SKIN_W, SKIN_H);
      const data = ctx.getImageData(0, 0, SKIN_W, SKIN_H).data;
      const out = new Array(SKIN_N).fill(null);
      for (let i = 0; i < SKIN_N; i++) {
        const a = data[i * 4 + 3];
        if (a >= 10) {
          out[i] = "#" + ((1 << 24) + (data[i * 4] << 16) + (data[i * 4 + 1] << 8) + data[i * 4 + 2]).toString(16).slice(1);
        }
      }
      return out;
    }

    function triggerImportSkinPNG() {
      playSound('click');
      document.getElementById('skin-import-file').click();
    }
    // 編輯器內匯入：載入到畫布上繼續改
    function importSkinPNG(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          pushEditorHistory();
          editorCanvasPixels = sampleImageToPixels(img);
          refreshEditorCanvas(); refreshEditorPreview();
          const defaultName = file.name.replace(/\.[^/.]+$/, "").replace('_32x50', '').replace('_16x25', '').replace('_18x30', '').replace('_18x24', '').replace('_16x16', '');
          document.getElementById('editor-skin-name').value = defaultName + "_匯入";
          queueFloatingText("📂 PNG 匯入成功！已自動轉成 32x50 高解析畫格");
          playSound('levelUp');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    }

    // 衣櫃主畫面直接上傳 PNG：不用進編輯器，立刻多一件並穿上 (朋友分享的主要入口)
    function triggerImportSkinDirect() {
      playSound('click');
      document.getElementById('skin-import-direct').click();
    }
    function importSkinDirect(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          const pixels = sampleImageToPixels(img);
          if (pixels.every(p => p === null)) { alert("這張圖讀不到像素內容，換一張試試"); return; }
          const type = currentWardrobeTab;
          if (!gameState.customSkins[type]) gameState.customSkins[type] = [];
          const name = file.name.replace(/\.[^/.]+$/, "").replace('_32x50', '').replace('_16x25', '') || "上傳服飾";
          const id = "custom_" + type + "_" + Date.now();
          gameState.customSkins[type].push({ id: id, name: name, type: type, pixels: pixels });
          gameState.equipped[type] = id;
          applyEquippedSkins(); saveGameData(); renderWardrobeItems();
          queueFloatingText(`🎉 已加入衣櫃並穿上：${name}`);
          playSound('levelUp');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
      event.target.value = "";
    }

    // 📋 分享碼：不用傳檔案，複製一串碼給朋友貼上就能還原 (含類別/名稱/像素)
    function copySkinShareCode() {
      playSound('click');
      const type = getEditorType();
      const name = document.getElementById('editor-skin-name').value.trim() || "未命名服飾";
      if (editorCanvasPixels.every(p => p === null)) { alert("畫布是空的，先畫點東西再分享喔！"); return; }
      const colors = [...new Set(editorCanvasPixels.filter(Boolean))];
      const payload = { t: type, n: name, c: colors, p: editorCanvasPixels.map(px => px ? colors.indexOf(px) + 1 : 0) };
      const code = 'SK85.' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const done = () => queueFloatingText("📋 分享碼已複製！傳給朋友，他在衣櫃按「輸入分享碼」貼上即可");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done).catch(() => prompt("複製這串分享碼給朋友：", code));
      } else {
        prompt("複製這串分享碼給朋友：", code);
      }
    }
    function importSkinShareCode() {
      playSound('click');
      const raw = prompt("貼上朋友給你的服飾分享碼 (SK85. 或舊版 SK83. 開頭)：");
      if (!raw) return;
      try {
        const payload = JSON.parse(decodeURIComponent(escape(atob(raw.trim().replace(/^SK8[35]\./, '')))));
        if (!payload.p || !Array.isArray(payload.c)) throw new Error('bad');
        const rawPixels = payload.p.map(i => i ? payload.c[i - 1] : null);
        const pixels = normalizeSkinPixels(rawPixels);
        if (!pixels) throw new Error('bad');
        const type = ['hat', 'clothes', 'shoes'].includes(payload.t) ? payload.t : 'clothes';
        if (!gameState.customSkins[type]) gameState.customSkins[type] = [];
        const id = "custom_" + type + "_" + Date.now();
        const name = sanitizeSkinName(payload.n) || '分享服飾';
        gameState.customSkins[type].push({ id: id, name: name, type: type, pixels: pixels });
        gameState.equipped[type] = id;
        currentWardrobeTab = type;
        applyEquippedSkins(); saveGameData(); switchWardrobeTab(type);
        queueFloatingText(`🎉 已還原並穿上朋友的設計：${name}`);
        playSound('levelUp');
      } catch (e) {
        alert("分享碼格式不正確，請確認整串都有複製到");
      }
    }

    // ------------------------------------------
    // 升學與考試
    // ------------------------------------------
    function getExamSuccessRate() {
      let totalScore = 0;
      for (let key in gameState.subjects) {
        totalScore += (gameState.subjects[key].school + gameState.subjects[key].home);
      }
      let baseRate = (totalScore / 500) * 100;
      if (gameState.stress > 70) {
        baseRate = Math.max(5, baseRate - (gameState.stress - 70));
      }
      if (gameState.energy < 30) {
        baseRate = Math.max(5, baseRate - (30 - gameState.energy) * 0.6);
      }
      const examBonus = typeof getFriendBonus === 'function' ? getFriendBonus('exam_rate_add') : 0;
      // v8.2 實裝承諾過的加成：學校 Lv.3 +5%、城鎮繁榮 18★ +5% (原本只寫在說明文字，公式沒讀)
      let landmarkExamBonus = 0;
      try {
        if (typeof getLandmarkLevel === 'function' && getLandmarkLevel('school') >= 3) landmarkExamBonus += 5;
        if (typeof getTownProsperityTotal === 'function' && getTownProsperityTotal() >= 18) landmarkExamBonus += 5;
      } catch (e) { }
      const examMut = typeof getMutationMult === 'function' ? getMutationMult('exam_rate') : 1.0;
      return Math.min(100, Math.max(5, Math.round((baseRate + examBonus + landmarkExamBonus + (gameState.mockBuff || 0)) * examMut))); // v9.3 模擬考加成
    }

    function getExamCooldownRemaining() {
      if (!gameState.examCooldownEndDays) return 0;

      const targetHours = (gameState.examCooldownEndDays * 24) + (gameState.examCooldownEndHour || 0) + ((gameState.examCooldownEndMinute || 0) / 60);
      const currentHours = ((gameState.totalGameDays || 0) * 24) + gameState.hour + (gameState.minute / 60);

      const diffHours = targetHours - currentHours;
      return diffHours > 0 ? diffHours : 0;
    }

    function triggerExam() {
      try {
        // 點擊考試代表發出明確指令，立刻恢復相機追隨
        userScrolling = false;
        if (userScrollTimer) {
          clearTimeout(userScrollTimer);
          userScrollTimer = null;
        }

        const remainingHours = getExamCooldownRemaining();
        if (remainingHours > 0) {
          playSound('examFail');

          const cdDays = Math.floor(remainingHours / 24);
          const cdHours = Math.floor(remainingHours % 24);
          const cdMinutes = Math.floor((remainingHours * 60) % 60);

          let timeStr = "";
          if (cdDays > 0) timeStr += `${cdDays}天`;
          if (cdHours > 0 || cdDays > 0) timeStr += `${cdHours}小時`;
          timeStr += `${cdMinutes}分鐘`;

          createFloatingText(`❌ 考試冷卻中！剩餘等待時間：${timeStr}`);
          return;
        }

        playSound('click');
        const passRate = getExamSuccessRate();

        const overlay = document.getElementById("exam-overlay");
        const pb = document.getElementById("exam-pb");
        const desc = document.getElementById("modal-desc");
        const statusLbl = document.getElementById("modal-status-lbl");
        const btnClose = document.getElementById("btn-modal-close");

        if (overlay) {
          overlay.classList.add("active");
        }
        if (pb) {
          pb.style.width = "0%";
        }
        if (btnClose) {
          btnClose.style.display = "none";
        }

        const currentGradeName = GRADES[gameState.gradeIndex].name;
        const nextGradeName = gameState.gradeIndex < GRADES.length - 1 ? GRADES[gameState.gradeIndex + 1].name : "學無止境學神";

        if (desc) {
          desc.innerHTML = `正在進行 <b>${currentGradeName}</b> 的升學考試。<br>考取下一階段：<b>${nextGradeName}</b><br>成功率：<span style="color:red; font-weight:900;">${passRate}%</span><br>報名費：<b>$50</b>（首次應考免費）`;
        }
        if (statusLbl) {
          statusLbl.innerText = "正在填寫試卷...";
        }

        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          if (pb) {
            pb.style.width = `${progress}%`;
          }

          if (statusLbl) {
            if (progress === 30) statusLbl.innerText = "題目有點難！緊張！";
            else if (progress === 60) statusLbl.innerText = "調動記憶力，努力作答中...";
            else if (progress === 90) statusLbl.innerText = "檢查名字有沒有寫錯...";
          }

          if (progress >= 100) {
            clearInterval(interval);
            finishExam(passRate, nextGradeName);
          }
        }, 150);
      } catch (e) {
        console.error("觸發考試失敗:", e);
      }
    }

    function finishExam(passRate, nextGradeName) {
      gameState.mockBuff = 0; // v9.3 模擬考加成：用於本次考試後失效
      const roll = Math.random() * 100;
      const desc = document.getElementById("modal-desc");
      const statusLbl = document.getElementById("modal-status-lbl");
      const btnClose = document.getElementById("btn-modal-close");

      if (roll <= passRate) {
        gameState._examPassedDay = gameState.totalGameDays; // v9.1 每日任務
        playSound('examSuccess');
        if (gameState.gradeIndex < GRADES.length - 1) {
          gameState.gradeIndex += 1;
        }
        gameState.difficulty = parseFloat((gameState.difficulty + 0.15).toFixed(2));
        gameState.examsPassedTotal = (gameState.examsPassedTotal || 0) + 1; // v9.3
        if (typeof bumpWeekly === 'function') bumpWeekly('exams');
        if (typeof onPlayerExamPassed === 'function') onPlayerExamPassed();

        for (let key in gameState.subjects) {
          gameState.subjects[key].school = 0;
          gameState.subjects[key].home = 0;
        }

        // 升學成功，清除冷卻
        gameState.examCooldownEndDays = 0;
        gameState.examCooldownEndHour = 0;
        gameState.examCooldownEndMinute = 0;

        desc.innerHTML = `🎉 恭喜你！升學成功！<br>你現在是：<b style="color:#2a9d8f; font-size:1.4rem;">${nextGradeName}</b><br><br><span style="font-size:0.85rem; color:var(--text-muted);">隨著學歷提升，學習的難度（壓力累積、生理流失）將增加 15%，但超商打工時薪也同步加薪！</span>`;
        statusLbl.innerText = "繼續衝刺下一個學歷目標吧！";
        // UX4：升學成功撒彩花
        setTimeout(() => celebrateGraduation(), 300);
        // 如果已是最高學歷，觸發完結畫面
        if (gameState.gradeIndex === GRADES.length - 1) {
          setTimeout(() => showGameClear(), 2500);
        }
      } else {
        playSound('examFail');
        desc.innerHTML = `😢 很遺憾，考試不合格...<br>再接再厲！提升科目分數，並維持精力、降低壓力再來挑戰。<br><br><span style="color:red; font-weight:800;">由於考試失敗，須等待 7 遊戲天後才能再次挑戰！</span>`;
        statusLbl.innerText = "失敗為成功之母。";

        // 設定 7 天冷卻結束時刻
        if (typeof onPlayerExamFailed === 'function') onPlayerExamFailed(); // v9.3 宿敵搶先
        gameState.examCooldownEndDays = (gameState.totalGameDays || 0) + 7;
        gameState.examCooldownEndHour = gameState.hour;
        gameState.examCooldownEndMinute = gameState.minute;
      }

      if (btnClose) btnClose.style.display = "inline-block";
      updateUI();
      saveGameData();
    }

    function closeExamModal() {
      playSound('click');
      document.getElementById("exam-overlay").classList.remove("active");
    }

    // ❓ 說明 Modal 控制函數
    function showHelpModal() {
      if (typeof manualGo === 'function') manualGo('help', 0); // v9.4
      try {
        playSound('click');
        const overlay = document.getElementById("help-overlay");
        if (overlay) {
          overlay.classList.add("active");
        }
      } catch (e) {
        console.error("顯示說明失敗:", e);
      }
    }

    function closeHelpModal() {
      playSound('click');
      document.getElementById("help-overlay").classList.remove("active");
    }

    // 👨‍👩‍👦 父母事件 Modal 控制
    function showParentsEventModal(event) {
      if (event) event.stopPropagation(); // 阻止地標點擊派遣事件冒泡！

      const overlay = document.getElementById("parents-event-overlay");
      const titleEl = document.getElementById("parents-modal-title");
      const iconEl = document.getElementById("parents-modal-icon");
      const reasonEl = document.getElementById("parents-modal-reason");

      if (!overlay) return;
      playSound('click');

      if (gameState.parentsStatus !== 'alive') {
        titleEl.innerText = "⚠️ 父母突發事件";
        iconEl.innerText = "🪦";
        reasonEl.innerText = gameState.parentsStatusReason || "父母離奇消失了...";
      } else if (gameState.parentsRebornReason) {
        titleEl.innerText = "✨ 父母光榮奇蹟";
        iconEl.innerText = "📜";
        reasonEl.innerText = gameState.parentsRebornReason || "父母平安回來了！";
      }

      overlay.classList.add("active");
    }

    function closeParentsEventModal() {
      playSound('click');
      const overlay = document.getElementById("parents-event-overlay");
      if (overlay) {
        overlay.classList.remove("active");
      }
    }

    function switchHelpTab(tabId, btnEl) {
      playSound('click');
      document.querySelectorAll(".help-tab-btn").forEach(btn => {
        btn.classList.remove("active");
      });

      if (btnEl) {
        btnEl.classList.add("active");
      } else if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add("active");
      }

      document.querySelectorAll(".help-tab-content").forEach(content => {
        content.style.display = "none";
      });
      document.getElementById(tabId).style.display = "block";
    }


    // ------------------------------------------
    // UI 刷新與小人及 NPC 視覺控制
    function updateLocksUI() {
      const landmarkHome = elLandmarks.home;
      const landmarkSchool = elLandmarks.school;
      const landmarkRestaurant = elLandmarks.restaurant;
      const landmarkLibrary = elLandmarks.library;
      const landmarkStore = elLandmarks.store;

      if (homeLocked) landmarkHome.classList.add("light-off");
      else landmarkHome.classList.remove("light-off");

      if (schoolLocked) landmarkSchool.classList.add("light-off");
      else landmarkSchool.classList.remove("light-off");

      if (restaurantLocked) landmarkRestaurant.classList.add("light-off");
      else landmarkRestaurant.classList.remove("light-off");

      if (libraryLocked) landmarkLibrary.classList.add("light-off");
      else landmarkLibrary.classList.remove("light-off");

      if (landmarkStore) {
        if (storeLocked) landmarkStore.classList.add("light-off");
        else landmarkStore.classList.remove("light-off");
      }
    }

    // ------------------------------------------
    // v9.1 每日任務面板
    function renderDailyQuests() {
      const box = document.getElementById('daily-quests-list');
      if (!box || typeof ensureDailyQuests !== 'function') return;
      const dq = ensureDailyQuests();
      box.innerHTML = dq.ids.map(id => {
        const q = DAILY_QUEST_POOL.find(x => x.id === id);
        if (!q) return '';
        const p = q.prog(); const done = !!dq.rewarded[id] || p >= q.target;
        return `<div class="quest-row ${done ? 'done' : ''}"><span class="quest-icon">${q.icon}</span><span class="quest-desc">${q.desc}</span><span class="quest-prog">${Math.min(p, q.target)}/${q.target}</span><span class="quest-reward">${done ? '✅ 已領 $' + q.reward : '$' + q.reward}</span></div>`;
      }).join('');
    }
    function updateUI() {
      renderDailyQuests();
      if (typeof renderRivals === 'function') renderRivals(); // v9.3
      if (typeof renderWeeklyGoal === 'function') renderWeeklyGoal(); // v9.3
      if (typeof renderGachaBox === 'function') renderGachaBox(); // v9.3
      if (typeof renderLoginBtn === 'function') renderLoginBtn(); // v9.3
      if (typeof renderHud === 'function') renderHud(); // v9.4
      if (typeof refreshMoneySinks === 'function') refreshMoneySinks();
      elGradeTitle.innerText = GRADES[gameState.gradeIndex].name;
      elMoneyVal.innerText = '$' + gameState.money;

      // 更新背包顯示（含心靈書）
      elBagChicken.innerText = gameState.bag.chicken;
      elBagDrink.innerText = gameState.bag.drink;
      if (elBagMentalbook) elBagMentalbook.innerText = gameState.bag.mentalbook || 0;

      // 新增道具背包顯示
      const elBagBento = document.getElementById('bag-bento');
      const elBagVitamin = document.getElementById('bag-vitamin');
      if (elBagBento) elBagBento.innerText = gameState.bag.bento || 0;
      if (elBagVitamin) elBagVitamin.innerText = gameState.bag.vitamin || 0;

      elUseChicken.disabled = (gameState.bag.chicken <= 0);
      elUseDrink.disabled = (gameState.bag.drink <= 0);
      if (elUseMentalbook) elUseMentalbook.disabled = ((gameState.bag.mentalbook || 0) <= 0);

      // 新增道具使用按鈕
      const elUseBento = document.getElementById('btn-use-bento');
      const elUseVitamin = document.getElementById('btn-use-vitamin');
      if (elUseBento) elUseBento.disabled = ((gameState.bag.bento || 0) <= 0);
      if (elUseVitamin) elUseVitamin.disabled = ((gameState.bag.vitamin || 0) <= 0);

      elBookOwned.innerText = `已擁有: ${gameState.passive.book}`;
      elShoesOwned.innerText = `已擁有: ${gameState.passive.shoes}`;

      // 新增被動裝備顯示
      const elHeadphoneOwned = document.getElementById('lbl-headphone-owned');
      const elTabletOwned = document.getElementById('lbl-tablet-owned');
      if (elHeadphoneOwned) elHeadphoneOwned.innerText = `已擁有: ${gameState.passive.headphone || 0}`;
      if (elTabletOwned) elTabletOwned.innerText = `已擁有: ${gameState.passive.tablet || 0}`;

      // 如果好友面板開啟中，同步更新按鈕與好感度狀態
      const friendsDrawer = document.getElementById('drawer-friends');
      if (friendsDrawer && friendsDrawer.classList.contains('open') && typeof renderFriendsList === 'function') {
        renderFriendsList();
      }

      // 存檔時間戳
      updateSaveTimestamp();

      // 更新住家內部的父母事件牌子/獎狀顯示狀態
      const elGrave = document.getElementById("prop-parents-grave");
      const elCert = document.getElementById("prop-parents-certificate");
      if (elGrave && elCert) {
        if (gameState.parentsStatus !== 'alive') {
          elGrave.style.display = "block";
          elCert.style.display = "none";
        } else if (gameState.parentsRebornReason) {
          elGrave.style.display = "none";
          elCert.style.display = "block";
        } else {
          elGrave.style.display = "none";
          elCert.style.display = "none";
        }
      }

      updateLocksUI();
      updateCalendarUI();
      updateStatusBars();
      updateSubjectBars();
      updateExamProgress();
    }

    // 存檔時間戳顯示
    function updateSaveTimestamp() {
      const footerEls = document.querySelectorAll(".floating-footer");
      if (footerEls) {
        const ts = gameState.lastSaved ? new Date(gameState.lastSaved).toLocaleTimeString('zh-TW', { hour12: false }) : '尚無紀錄';
        footerEls.forEach(el => el.innerText = `Copyright © 2026 葉大帥. All rights reserved. (v9.22.1) | 上次存檔：${ts}`);
      }
    }

    // 效能優化：髒檢查快取
    const uiCache = {};

    function updateCalendarUI() {
      const days = ["", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
      const isWeekend = (gameState.dayOfWeek === 6 || gameState.dayOfWeek === 7);
      const dayStr = `${days[gameState.dayOfWeek]} (${isWeekend ? '假日' : '平日'})`;

      const padHour = String(gameState.hour).padStart(2, '0');
      const padMin = String(Math.floor(gameState.minute)).padStart(2, '0');
      const timeStr = `${padHour}:${padMin}`;

      if (uiCache.dayStr !== dayStr) {
        uiCache.dayStr = dayStr;
        elCalendarDay.innerText = dayStr;
      }
      
      if (uiCache.timeStr !== timeStr) {
        uiCache.timeStr = timeStr;
        elCalendarTime.innerText = timeStr;
      }

      // 動態晝夜光影濾鏡 (開羅復古地圖光影變化)
      const overlayEl = document.getElementById("map-night-overlay");
      if (overlayEl) {
        const hour = gameState.hour;
        let overlayBg = "rgba(0, 0, 0, 0)";
        if (hour >= 17 && hour < 19) {
          overlayBg = "rgba(243, 156, 18, 0.16)"; // 黃昏暖橘夕陽光
        } else if (hour >= 19 || hour < 5) {
          overlayBg = "rgba(15, 23, 42, 0.36)"; // 深夜靜謐藏青星空光影
        } else if (hour >= 5 && hour < 7) {
          overlayBg = "rgba(255, 177, 66, 0.10)"; // 清晨朝霞柔光
        }
        if (overlayEl.style.fill !== overlayBg) {
          overlayEl.style.fill = overlayBg; // v9.0 修正：SVG rect 要改 fill，寫 background 永遠不會上色 (夜間色調一直沒生效)
        }
      }
    }

    function updateStatusBars() {
      const energyDisp = parseFloat(gameState.energy.toFixed(1));
      const hungerDisp = parseFloat(gameState.hunger.toFixed(1));
      const stressDisp = parseFloat(gameState.stress.toFixed(1));

      if (uiCache.energy !== energyDisp) {
        uiCache.energy = energyDisp;
        elEnergyBar.style.width = `${gameState.energy}%`;
        elEnergyLbl.innerText = `${energyDisp} / 100`;
      }

      if (uiCache.hunger !== hungerDisp) {
        uiCache.hunger = hungerDisp;
        elHungerBar.style.width = `${gameState.hunger}%`;
        elHungerLbl.innerText = `${hungerDisp} / 100`;
      }

      if (uiCache.stress !== stressDisp) {
        uiCache.stress = stressDisp;
        elStressBar.style.width = `${gameState.stress}%`;
        elStressLbl.innerText = `${stressDisp} / 100`;
      }

      // UX3：危險警示條更新
      let alertMsg = '';
      let alertColor = '';
      if (gameState.stress >= 80) {
        alertMsg = '🤯 壓力爆表！快去運動場跑步！';
        alertColor = 'rgba(255, 69, 58, 0.92)';
      } else if (gameState.energy < 20) {
        alertMsg = '🔋 精力耗盡！讀書效率大幅下降！';
        alertColor = 'rgba(10, 132, 255, 0.88)';
      } else if (gameState.hunger < 20) {
        alertMsg = '🍗 快餓扁了！去吃點東西吧！';
        alertColor = 'rgba(255, 159, 10, 0.92)';
      }

      const alertKey = alertMsg + alertColor;
      if (uiCache.alert !== alertKey) {
        uiCache.alert = alertKey;
        if (alertMsg) {
          elAlertBar.style.display = 'block';
          elAlertBar.innerText = alertMsg;
          elAlertBar.style.background = alertColor;
        } else {
          elAlertBar.style.display = 'none';
        }
      }
    }

    function updateSubjectBars() {
      let allMaxed = true;
      const keys = ['cn', 'en', 'ma', 'sc', 'so'];
      
      if (!uiCache.subjects) uiCache.subjects = {};

      keys.forEach(k => {
        const sub = gameState.subjects[k];
        const total = sub.school + sub.home;
        if (total < 100) allMaxed = false;

        const subKey = `${total}-${sub.school}-${sub.home}`;
        if (uiCache.subjects[k] !== subKey) {
          uiCache.subjects[k] = subKey;
          
          document.getElementById(`score-${k}`).innerText = `${total} / 100`;

          const schoolPercent = (sub.school / 100) * 100;
          document.getElementById(`pb-${k}-school`).style.width = `${schoolPercent}%`;

          const homeBar = document.getElementById(`pb-${k}-home`);
          homeBar.style.left = `${schoolPercent}%`;
          homeBar.style.width = `${(sub.home / 100) * 100}%`;
        }
      });

      if (uiCache.allMaxed !== allMaxed) {
        uiCache.allMaxed = allMaxed;
        if (allMaxed) elBtnExam.classList.add("ready");
        else elBtnExam.classList.remove("ready");
      }
    }

    // UX2：考試按鈕冷卻計時顯示
    function updateExamProgress() {
      const rate = getExamSuccessRate();
      elExamRate.innerText = `考取合格率: ${rate}%`;

      const remaining = getExamCooldownRemaining();
      if (remaining > 0) {
        const cdDays = Math.floor(remaining / 24);
        const cdHours = Math.floor(remaining % 24);
        let timeStr = cdDays > 0 ? `${cdDays}天` : '';
        timeStr += `${cdHours}小時`;
        elBtnExam.innerText = `⏳ 冷卻中 ${timeStr}`;
        elBtnExam.disabled = true;
        elBtnExam.style.opacity = '0.55';
        elBtnExam.style.cursor = 'not-allowed';
        elBtnExam.style.background = 'linear-gradient(135deg, #86868b, #636366)';
      } else {
        elBtnExam.innerText = `參加考試 ${rate}%${(gameState.examAttempts || 0) === 0 ? '（首次免費）' : '（$50）'}${gameState.mockBuff ? ' 模擬+' + gameState.mockBuff + '%' : ''}`; // v9.4 按鈕直接顯示成功率
        elBtnExam.disabled = false;
        elBtnExam.style.opacity = '1';
        elBtnExam.style.cursor = 'pointer';
        elBtnExam.style.background = 'linear-gradient(135deg, #ff2d55, #ff3b30)';
      }
    }

    let zzzTimer = null;
    let sweatTimer = null;
    // v8.2 效能：舞台看板髒檢查 (原本每 100ms 無條件重寫 innerHTML)
    function setStageBoard(html) {
      if (uiCache._stageHtml === html) return;
      uiCache._stageHtml = html;
      elStageBoard.innerHTML = html;
    }

    // v9.1 知識光點：學到哪一科，就冒哪一科顏色的光點
    const SUBJECT_COLORS = { cn: '#e74c3c', en: '#2980b9', ma: '#27ae60', sc: '#8e44ad', so: '#f39c12' };
    function spawnKnowledgeOrb(subKey) {
      const wrap = document.getElementById('char-wrap');
      if (!wrap) return;
      const orb = document.createElement('div');
      orb.className = 'knowledge-orb';
      orb.style.background = SUBJECT_COLORS[subKey] || '#ffd32a';
      orb.style.left = (14 + Math.random() * 16) + 'px';
      wrap.appendChild(orb);
      setTimeout(() => orb.remove(), 1300);
    }
    // v9.1 桌上書堆：今日讀得越多，書堆越高 (最多 5 本)
    function updateStudyBooks() {
      const n = Math.min(5, gameState.studyHoursToday || 0);
      ['study-books-school', 'study-books-library'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.querySelectorAll('.book-layer').forEach((b, i) => { b.style.display = i < n ? 'block' : 'none'; });
      });
      const fx = document.getElementById('lbl-focus');
      if (fx) fx.innerText = `${Math.round(gameState.focus || 0)} / 100`;
      const fb = document.getElementById('bar-focus');
      if (fb) fb.style.width = `${Math.round(gameState.focus || 0)}%`;
    }
    function updateCharacterAnimation() {
      // 1. 地標房屋掀頂 (active-inside)
      for (let key in elLandmarks) {
        if (!elLandmarks[key]) continue;
        if (key === currentLoc && !gameState.isCommuting) {
          elLandmarks[key].classList.add("active-inside");
        } else {
          elLandmarks[key].classList.remove("active-inside");
        }

        const targetLoc = gameState.isCommuting ? gameState.commuteTarget : currentLoc;
        if (key === targetLoc) {
          elLandmarks[key].classList.add("active-highlight");
        } else {
          elLandmarks[key].classList.remove("active-highlight");
        }
      }

      // v9.1 專注光暈 + 書堆刷新
      updateStudyBooks();
      { const focusTier = (typeof currentState !== 'undefined' && currentState === 'studying') ? ((gameState.focus || 0) >= 70 ? 'focus-high' : ((gameState.focus || 0) >= 35 ? 'focus-mid' : '')) : '';
        if (elCharWrap && elCharWrap.dataset.focusTier !== focusTier) { elCharWrap.dataset.focusTier = focusTier; elCharWrap.classList.toggle('focus-high', focusTier === 'focus-high'); elCharWrap.classList.toggle('focus-mid', focusTier === 'focus-mid'); } }

      // 2. 清除小人身上的表情與家具 CSS 模式 (只保留住家陪睡控制)
      const elHome = elLandmarks.home;
      elHome.classList.remove("mode-sleeping");
      document.getElementById("prop-bed-parents").style.display = "none";
      document.getElementById("npc-parents-sleep").style.display = "none";
      const _playerSleepEl = document.getElementById("npc-player-sleep");
      if (_playerSleepEl) _playerSleepEl.style.display = "none";
      elCharWrap.classList.remove("in-bed");
      elCharWrap.classList.remove("lying");
      elCharWrap.classList.toggle("seated", currentState === 'eating' || currentState === 'dinner' || (currentLoc === 'home' && currentState === 'studying' && gameState.deskStudy)); // v9.14.4 書桌前也坐
      if (elStudentSprite) { // v9.10.4 坐姿：裁掉 viewBox 下段 (鞋子區) + 高度等比 + 整隻下沉讓腰進吧台後
        const _sp2 = currentState === 'eating' || currentState === 'dinner'; // v9.13
        const _vb2 = _sp2 ? '0 0 16 21' : '0 0 16 25';
        if (elStudentSprite.getAttribute('viewBox') !== _vb2) elStudentSprite.setAttribute('viewBox', _vb2);
        const _sh2 = _sp2 ? '42px' : '50px';
        if (elStudentSprite.style.height !== _sh2) elStudentSprite.style.height = _sh2;
        // v9.10.6 坐姿改用 transform 縮放（margin 對主角 sprite 完全無效,實測確認）:
        // 縮到 NPC 坐姿的寬高 (32→26), 屁股釘在錨點、頭降到跟 NPC 同高
        const _st2 = _sp2 ? 'translateY(-3px) scale(0.82)' : '';
        if (elStudentSprite.style.transform !== _st2) elStudentSprite.style.transform = _st2;
        if (_sp2 && elStudentSprite.style.transformOrigin !== '50% 100%') elStudentSprite.style.transformOrigin = '50% 100%';
        if (elStudentSprite.style.marginBottom) elStudentSprite.style.marginBottom = '';
      }

      elStudentSprite.setAttribute("class", "sprite-pixel");
      if (currentState !== 'eating') { gameState.eatOrderLeft = null; gameState.eatPhase = null; gameState.eatServed = false; gameState._servedAtMin = null; const _pd2 = document.getElementById('player-dish'); if (_pd2) _pd2.style.display = 'none'; }

      // 3. 處理運動場繞操場跑步動畫切換 (CSS Animation 接管)
      if (currentState === 'sports' && !gameState.isCommuting) {
        elCharWrap.classList.add("running-on-track");
        stopZzzParticles();
        startSweatParticles();
      } else {
        elCharWrap.classList.remove("running-on-track");

        // 常規就位坐標對齊
        if (!gameState.isCommuting) {
          const destCoords = getCharacterCoords(currentLoc, currentState);
          const isFlipped = ((currentLoc === 'school' || currentLoc === 'library') && currentState === 'studying') || (currentLoc === 'store' && currentState === 'working');
          updateCharacterPositionAndScale(destCoords.x, destCoords.y, isFlipped);
        }
      }

      // 4. 根據狀態變更 class 與 NPC 的顯示
      switch (currentState) {
        case 'commuting':
          elStudentSprite.classList.add("state-commuting");
          let targetName = "目的地";
          if (gameState.commuteTarget === 'home') targetName = '住家';
          else if (gameState.commuteTarget === 'school') targetName = '學校';
          else if (gameState.commuteTarget === 'gym') targetName = '運動場';
          else if (gameState.commuteTarget === 'restaurant') targetName = '餐廳';
          else if (gameState.commuteTarget === 'library') targetName = '圖書館';
          else if (gameState.commuteTarget === 'store') targetName = '便利商店';

          setStageBoard(`正在趕路：<span>前往${targetName} (${parseFloat(gameState.commuteMinutesLeft.toFixed(1))}m)</span>`);
          elCharBubble.innerText = "趕路中！🏃‍♂️💨";
          stopZzzParticles();
          startSweatParticles();
          break;

        case 'sleeping':
          elStudentSprite.classList.add("state-sleeping");

          // 啟用住家睡覺模式，顯示雙人床與大床睡覺的爸媽
          if (currentLoc === 'home') {
            elHome.classList.add("mode-sleeping");
            if (gameState.parentsStatus === 'alive') {
              document.getElementById("prop-bed-parents").style.display = "block";
              document.getElementById("npc-parents-sleep").style.display = "none"; // v9.8 步行爸媽取代靜態睡姿
            } else {
              // 爸媽不在，大雙人床空無一人 (保留空大床，顯得極具黑色幽默與寂寞)
              document.getElementById("prop-bed-parents").style.display = "block";
              document.getElementById("npc-parents-sleep").style.display = "none";
            }
            // v9.8 自己躺平睡：紙娃娃橫躺在床上，靜態睡姿退場
            const _ps = document.getElementById("npc-player-sleep");
            if (_ps) _ps.style.display = "none";
            elCharWrap.classList.add("lying");
          }

          setStageBoard(`住家：<span>睡覺休息中 💤</span>`);
          elCharBubble.innerText = "Zzz...";
          startZzzParticles();
          stopSweatParticles();
          break;

        case 'eating':
          if (gameState.noodleUntil) { // v9.16 窗邊泡麵：坐窗邊吃，不走餐廳流程
            elStudentSprite.classList.add("state-eating");
            setStageBoard(`超商：<span>窗邊泡麵中 🍜 深夜裡的一點亮光</span>`);
            elCharBubble.innerText = "呼…深夜的泡麵最療癒 🍜";
            let _pdn = document.getElementById('player-dish');
            if (_pdn) { _pdn.style.display = 'block'; _pdn.innerText = '🍜'; }
            break;
          }
          const sp = (typeof todaysSpecial === 'function') ? todaysSpecial() : { name: '鐵板燒', emoji: '🍽️' };
          if (gameState.eatOrderLeft == null) { gameState.eatOrderLeft = 3; gameState.eatServed = false; gameState.eatPhase = 'order'; gameState._eatServeCelebrated = false; }
          if (gameState.eatPhase === 'order') {
            gameState.eatOrderLeft = Math.max(0, gameState.eatOrderLeft - gameState.speed / 10);
            elStudentSprite.classList.add("state-idle");
            setStageBoard(`餐廳：<span>看菜單點菜中 📋</span>`);
            elCharBubble.innerText = "嗯…先看菜單點菜 📋";
            if (gameState.eatOrderLeft <= 0) { gameState.eatPhase = 'wait'; gameState.eatWaitLeft = 6; }
          } else if (gameState.eatPhase === 'wait' && !gameState.eatServed) {
            gameState.eatWaitLeft = Math.max(0, (gameState.eatWaitLeft || 0) - gameState.speed / 10);
            if (gameState.eatWaitLeft <= 0) gameState.eatServed = true;
            elStudentSprite.classList.add("state-idle");
            setStageBoard(`餐廳：<span>阿火師現炒中，等上菜 🍳</span>`);
            elCharBubble.innerText = "好香…等上菜 🍳";
          } else {
            if (!gameState._eatServeCelebrated) {
              gameState._eatServeCelebrated = true;
              gameState._servedAtMin = (gameState.totalGameDays || 0) * 1440 + gameState.hour * 60 + Math.floor(gameState.minute); // v9.12.10 用餐保護起算
              if (gameState.specialClaimedDay !== (gameState.totalGameDays || 0)) {
                gameState.specialClaimedDay = gameState.totalGameDays || 0;
                gameState.focus = Math.min(100, (gameState.focus || 0) + 15);
              }
            }
            elStudentSprite.classList.add("state-eating");
            setStageBoard(`餐廳：<span>享用今日特餐：${sp.name} ${sp.emoji}</span>`);
            elCharBubble.innerText = `好吃！今日特餐${sp.name} ${sp.emoji}`;
          }
          let _pd = document.getElementById('player-dish');
          if (!_pd) { _pd = document.createElement('div'); _pd.id = 'player-dish'; document.getElementById('char-wrap').appendChild(_pd); }
          _pd.style.display = 'block';
          _pd.textContent = gameState.eatPhase === 'order' ? '📋' : (!gameState.eatServed ? '🍳' : sp.emoji);
          stopZzzParticles();
          stopSweatParticles();
          break;

        case 'dinner': {
          elStudentSprite.classList.add("state-eating");
          const _famD = (gameState.npcs || []).some(n => n.kind === 'parent' && n.atDinner && n.state === 'seated');
          if (_famD) {
            setStageBoard(`住家：<span>晚餐同桌中 🍚</span>`);
            const _dl = ['好吃！媽媽煮的最好吃 😋', '今天的菜好香～', '我還要再吃一碗！', '吃飽了，好滿足～'];
            elCharBubble.innerText = _dl[Math.floor(((gameState.hour * 60 + gameState.minute) % 60) / 15) % _dl.length];
          } else {
            setStageBoard(`住家：<span>一個人吃晚餐 🍚</span>`);
            elCharBubble.innerText = '一個人的晚餐…簡單吃一點。';
          }
          stopZzzParticles();
          stopSweatParticles();
          break;
        }

        case 'sports':
          elStudentSprite.classList.add("state-sports");
          setStageBoard(`運動場：<span>跑步減壓中 🏃</span>`);
          elCharBubble.innerText = "呼哈！呼哈！💦";
          break;

        case 'working':
          elStudentSprite.classList.add("state-studying");
          setStageBoard(`便利商店：<span>站櫃檯打工賺錢中 💰</span>`);
          elCharBubble.innerText = "歡迎光臨！嗶～請問需要載具嗎？🏪";
          stopZzzParticles();
          stopSweatParticles();
          break;

        case 'studying':
          elStudentSprite.classList.add("state-studying");
          if (currentLoc === "school") {
            setStageBoard(`學校：<span>課堂聽講中 🏫</span>`);
            elCharBubble.innerText = "認真聽講 ✍️";
          } else if (currentLoc === "library") {
            setStageBoard(`圖書館：<span>自修複習課業 📚</span>`);
            elCharBubble.innerText = "好好複習！💡";
          } else if (currentLoc === "home" && gameState.deskStudy) { // v9.14.4
            setStageBoard(`住家：<span>書桌前自習中 📖</span>`);
            elCharBubble.innerText = "在家也要認真！✍️";
          } else {
            setStageBoard(`住家：<span>發呆放鬆中 🍃</span>`);
            elCharBubble.innerText = "放空一下下～";
          }
          stopZzzParticles();
          stopSweatParticles();
          break;

        case 'angry':
          elStudentSprite.classList.add("state-angry");
          setStageBoard(`警戒：<span>壓力爆表！拒絕讀書</span>`);
          elCharBubble.innerText = "煩死了！好想去運動！🤯";
          stopZzzParticles();
          stopSweatParticles();
          break;

        case 'idle':
        default:
          elStudentSprite.classList.add("state-idle");
          if (currentLoc === "school" && gameState._playerBreak) { // v9.22 下課在閱讀角
            const bm = gameState._playerBreak.mode;
            setStageBoard(bm === 'chat' ? `學校：<span>下課聊天中 💬</span>` : bm === 'read' ? `學校：<span>下課在閱讀角看書 📚</span>` : `學校：<span>下課在閱讀角休息 💤</span>`);
            elCharBubble.innerText = bm === 'chat' ? "欸欸，跟你說喔～" : bm === 'read' ? "這本好好看 📖" : "休息一下下 💤";
          } else if (currentLoc === "school" && typeof schoolPhaseNow === 'function' && schoolPhaseNow() === 'break') {
            setStageBoard(`學校：<span>下課休息中 🔔</span>`);
            elCharBubble.innerText = "下課放空一下～";
          } else {
            setStageBoard(`空閒：<span>發呆放鬆中 🍃</span>`);
            elCharBubble.innerText = "放空一下下～";
          }
          stopZzzParticles();
          stopSweatParticles();
          break;
      }

      // 如果有搞笑說話覆蓋，優先顯示覆蓋的文字
      if (bubbleOverrideText) {
        elCharBubble.innerText = bubbleOverrideText;
      }

      // 5. v9.7 學校老師改由步行 NPC 擔任，靜態老師永久退場
      const elTeacher = document.getElementById("npc-teacher-static");
      if (elTeacher) elTeacher.style.display = "none";

      // 6. v9.8 操場教練改由隨叫隨到步行 NPC 擔任，靜態教練永久退場
      const elCoach = document.getElementById("npc-coach-static");
      if (elCoach) elCoach.style.display = "none";

      // 7. v9.8 餐廳廚師改由步行 NPC 擔任，靜態廚師永久退場
      const elChef = document.getElementById("npc-chef-static");
      if (elChef) elChef.style.display = "none";


      // 9. v9.7 超商店員改由步行 NPC 擔任，靜態店員永久退場
      const elClerk = document.getElementById("npc-clerk-static");
      if (elClerk) elClerk.style.display = "none";
    }

    // 粒子
    function startZzzParticles() {
      if (zzzTimer) return;
      zzzTimer = setInterval(() => {
        const p = document.createElement("div");
        p.className = "sleep-particle";
        p.innerText = "Z";
        p.style.left = `${20 + (Math.random() * 10 - 5)}px`;
        p.style.top = `${39 + (Math.random() * 10 - 5)}px`;
        elParticleEmitter.appendChild(p);
        setTimeout(() => p.remove(), 2000);
      }, 1000);
    }

    function stopZzzParticles() {
      if (zzzTimer) {
        clearInterval(zzzTimer);
        zzzTimer = null;
      }
    }

    function startSweatParticles() {
      if (sweatTimer) return;
      sweatTimer = setInterval(() => {
        const p = document.createElement("div");
        p.className = "sweat-particle";
        p.style.left = `${20 + (Math.random() * 10 - 5)}px`;
        p.style.top = `${49 + (Math.random() * 6 - 3)}px`;
        elParticleEmitter.appendChild(p);
        setTimeout(() => p.remove(), 1000);
      }, 300);
    }

    function stopSweatParticles() {
      if (sweatTimer) {
        clearInterval(sweatTimer);
        sweatTimer = null;
      }
    }

    // Bug1 修正：移除 style 標籤注入（@keyframes float-up 已全域定義在 CSS 區塊）
    function createFloatingText(txt, onDone) {
      const floatTxt = document.createElement("div");
      floatTxt.style.position = "absolute";
      floatTxt.style.bottom = "60px";
      floatTxt.style.left = "50%";
      floatTxt.style.transform = "translateX(-50%)";
      floatTxt.style.background = "rgba(74, 55, 40, 0.95)";
      floatTxt.style.color = "#ffd154";
      floatTxt.style.border = "2px solid #4a3728";
      floatTxt.style.borderRadius = "8px";
      floatTxt.style.padding = "4px 10px";
      floatTxt.style.fontSize = "0.8rem";
      floatTxt.style.fontWeight = "900";
      floatTxt.style.whiteSpace = "nowrap"; // v9.0：不加 nowrap 會被 42px 的 char-wrap 擠成直式柱子
      floatTxt.style.zIndex = "30";
      floatTxt.style.pointerEvents = "none";
      floatTxt.style.boxShadow = "2px 2px 0px #4a3728";
      floatTxt.style.animation = "float-up 1.2s forwards ease-out";
      // 移除心了：const style = ... / document.head.appendChild(style)
      floatTxt.innerText = txt;
      elCharWrap.appendChild(floatTxt);
      setTimeout(() => {
        floatTxt.remove();
        if (onDone) onDone(); // 佇列回調
      }, 1200);
    }

    // UX1：浮字訊息佇列（防止重疊展示）
    function queueFloatingText(txt) {
      if (floatQueue.length >= 5) return; // 佇列最多 5 則
      floatQueue.push(txt);
      if (!isShowingFloat) processFloatQueue();
    }

    function processFloatQueue() {
      if (floatQueue.length === 0) {
        isShowingFloat = false;
        return;
      }
      isShowingFloat = true;
      const txt = floatQueue.shift();
      createFloatingText(txt, processFloatQueue);
    }


    // ==========================================
    // 🎮 小遊戲系統 (含第 6 站：🏪 收銀刷條碼)
    // ==========================================
    const MG_COOLDOWN_MINUTES = 30; // 每 30 遊戲分鐘可玩一次
    let currentMinigame = null;
    let mgTimerInterval = null;

    function tickMiniGameCooldowns(progressMinutes) {
      if (!gameState.miniGameCooldowns) return;
      for (let loc in gameState.miniGameCooldowns) {
        if (gameState.miniGameCooldowns[loc] > 0) {
          gameState.miniGameCooldowns[loc] = Math.max(0, gameState.miniGameCooldowns[loc] - progressMinutes);
        }
      }
      updateMiniGameTriggers();
    }

    function updateMiniGameTriggers() {
      const locations = ['school', 'restaurant', 'gym', 'library', 'store', 'home'];
      locations.forEach(loc => {
        const landmark = document.getElementById(`landmark-${loc}`);
        if (!landmark) return;
        let trigger = landmark.querySelector('.minigame-trigger');

        const isReady = (gameState.miniGameCooldowns[loc] || 0) <= 0 && currentLoc === loc && !gameState.isCommuting;

        if (isReady) {
          if (!trigger) {
            trigger = document.createElement('div');
            trigger.className = 'minigame-trigger';
            trigger.innerHTML = '<div class="mg-badge">🎮 玩小遊戲!</div>';
            trigger.onclick = (e) => { e.stopPropagation(); startMinigame(loc); };
            landmark.appendChild(trigger);
          }
          trigger.style.display = 'block';
        } else {
          if (trigger) trigger.style.display = 'none';
        }
      });
    }

    function startMinigame(loc) {
      window._minigameOpen = true; // v9.15.2 凍結遊戲時間（tick 直接跳過）
      playSound('click');
      if (mgTimerInterval) { clearInterval(mgTimerInterval); mgTimerInterval = null; } // v8.9.1 防舊計時器殘留
      currentMinigame = loc;
      // v8.9.1 冷卻改到「打完出結果」才起算：中途被打斷 (切換App/來電) 不再白白燒掉冷卻
      if (!gameState.miniGamePlays) gameState.miniGamePlays = { school: 0, restaurant: 0, gym: 0, library: 0, store: 0, home: 0 };
      gameState.miniGamePlays[loc] = (gameState.miniGamePlays[loc] || 0) + 1;

      const overlay = document.getElementById('minigame-overlay');
      overlay.classList.add('active');
      document.getElementById('mg-close-btn').style.display = 'none';

      switch (loc) {
        case 'school': startQuizGame(); break;
        case 'restaurant': startCookingGame(); break;
        case 'gym': startRhythmGame(); break;
        case 'library': startMemoryGame(); break;
        case 'store': startStoreGame(); break;
        case 'home': startSheepGame(); break;
      }
      updateMiniGameTriggers();
    }

    // v9.16 窗邊泡麵：點窗邊吧台開吃（深夜限定 $25 / 25 分鐘）
    function noodleHitClick(e) {
      if (e) e.stopPropagation();
      playSound('click');
      if (currentLoc !== 'store' || gameState.isCommuting) { setStageBoard(`窗邊泡麵：<span>先進超商再點窗邊吧台 🍜</span>`); return; }
      if (gameState.noodleUntil) { setStageBoard(`超商：<span>已經在吃泡麵了 🍜</span>`); return; }
      const h = gameState.hour || 0;
      if (!(h >= 22 || h < 5)) { setStageBoard(`窗邊泡麵：<span>深夜限定（22:00–05:00）🌙 白天先去做別的事</span>`); return; }
      if ((gameState.money || 0) < 25) { setStageBoard(`窗邊泡麵：<span>錢不夠…一碗 $25 🍜</span>`); return; }
      const wi = claimWindowSeat();
      if (wi < 0) { setStageBoard(`窗邊泡麵：<span>窗邊客滿了，等有人吃完再來 🍜</span>`); return; }
      gameState.money = (gameState.money || 0) - 25;
      gameState.noodleSeatIdx = wi;
      gameState.noodleSeat = { x: STORE_WINDOW_SEATS[wi].x, y: STORE_WINDOW_SEATS[wi].y };
      gameState.noodleUntil = (gameState.totalGameDays || 0) * 1440 + h * 60 + (gameState.minute || 0) + 25;
      setStageBoard(`超商：<span>泡麵上桌！窗邊開吃 🍜（$25）</span>`);
      saveGameData();
    }
    function endNoodleSession(completed) {
      if (!gameState.noodleUntil) return;
      freeWindowSeat(gameState.noodleSeatIdx);
      gameState.noodleUntil = 0; gameState.noodleSeatIdx = null; gameState.noodleSeat = null;
      if (completed) {
        gameState.noodleCount = (gameState.noodleCount || 0) + 1;
        addBuff('study_boost', 1.25, 60, '🍜', true, '深夜食堂：讀書效率 x1.25');
        if (typeof queueFloatingText === 'function') queueFloatingText('🍜 深夜食堂：讀書效率提升！');
        playSound('examSuccess');
      }
      saveGameData();
    }

    function closeMinigame() {
      window._minigameOpen = false; // v9.15.2 時間恢復流動
      playSound('click');
      document.getElementById('minigame-overlay').classList.remove('active');
      if (mgTimerInterval) { clearInterval(mgTimerInterval); mgTimerInterval = null; }
      currentMinigame = null;
    }

    function showMinigameResult(win, loc, score) {
      gameState.miniGameCooldowns[loc] = MG_COOLDOWN_MINUTES; // v8.9.1 完成才起算冷卻
      if (!gameState.miniGameWins) gameState.miniGameWins = { school: 0, restaurant: 0, gym: 0, library: 0, store: 0, home: 0 };
      if (win) gameState.miniGameWins[loc] = (gameState.miniGameWins[loc] || 0) + 1;

      const area = document.getElementById('mg-game-area');
      const closeBtn = document.getElementById('mg-close-btn');
      closeBtn.style.display = 'block';

      const buffConfigs = {
        school: { type: 'study_boost', winMult: 1.5, loseMult: 0.7, winMin: 30, loseMin: 15, icon: '📚', desc: '學科增長' },
        restaurant: { type: 'eat_boost', winMult: 1.5, loseMult: 0.8, winMin: 30, loseMin: 15, icon: '🍔', desc: '飽足恢復' },
        gym: { type: 'sport_boost', winMult: 2.0, loseMult: 0.5, winMin: 30, loseMin: 15, icon: '🏃', desc: '壓力降低' },
        library: { type: 'review_boost', winMult: 1.5, loseMult: 0.7, winMin: 30, loseMin: 15, icon: '📖', desc: '複習效率' },
        store: { type: 'work_boost', winMult: 1.8, loseMult: 0.8, winMin: 30, loseMin: 15, icon: '🏪', desc: '打工時薪' },
        home: { type: 'sleep_boost', winMult: 1.5, loseMult: 0.8, winMin: 30, loseMin: 15, icon: '😴', desc: '睡眠恢復' }
      };

      const cfg = buffConfigs[loc];
      if (win) {
        addBuff(cfg.type, cfg.winMult, cfg.winMin, cfg.icon, true, `${cfg.desc} x${cfg.winMult}`);
        area.innerHTML = `<div class="mg-result">
          <span class="result-icon">🎉</span>
          <div class="result-title" style="color:var(--accent);">勝利！</div>
          <div class="result-desc">${cfg.icon} ${cfg.desc}速度 x${cfg.winMult}，持續 ${cfg.winMin} 分鐘！${score != null ? `<br>⭐ 本局得分 ${score}` : ''}</div>
        </div>`;
        playSound('examSuccess');
      } else {
        addBuff(cfg.type, cfg.loseMult, cfg.loseMin, cfg.icon, false, `${cfg.desc} x${cfg.loseMult}`);
        area.innerHTML = `<div class="mg-result">
          <span class="result-icon">😅</span>
          <div class="result-title" style="color:var(--secondary);">失敗...</div>
          <div class="result-desc">${cfg.icon} ${cfg.desc}速度 x${cfg.loseMult}，持續 ${cfg.loseMin} 分鐘${score != null ? `<br>⭐ 本局得分 ${score}` : ''}</div>
        </div>`;
        playSound('examFail');
      }
      saveGameData();
    }

    // ---- 🏫 快問快答 ----
    const QUIZ_QUESTIONS = [
      { q: "台灣最高的山是？", opts: ["玉山", "阿里山", "雪山", "合歡山"], ans: 0, subject: "so" },
      { q: "1 + 1 × 2 = ?", opts: ["3", "4", "2", "6"], ans: 0, subject: "ma" },
      { q: "水的化學式是？", opts: ["H2O", "CO2", "NaCl", "O2"], ans: 0, subject: "sc" },
      { q: "「床前明月光」的作者是？", opts: ["李白", "杜甫", "蘇軾", "白居易"], ans: 0, subject: "cn" },
      { q: "Apple 的中文是？", opts: ["蘋果", "香蕉", "橘子", "葡萄"], ans: 0, subject: "en" },
      { q: "地球繞太陽一圈約需？", opts: ["365天", "30天", "24小時", "7天"], ans: 0, subject: "sc" },
      { q: "三角形內角和是？", opts: ["180度", "360度", "90度", "270度"], ans: 0, subject: "ma" },
      { q: "「論語」是誰的弟子所記？", opts: ["孔子", "老子", "莊子", "墨子"], ans: 0, subject: "cn" },
      { q: "Thank you 的日文是？", opts: ["ありがとう", "こんにちは", "さようなら", "すみません"], ans: 0, subject: "en" },
      { q: "台灣的首都是？", opts: ["台北", "高雄", "台中", "台南"], ans: 0, subject: "so" },
      { q: "光合作用需要什麼氣體？", opts: ["二氧化碳", "氧氣", "氮氣", "氫氣"], ans: 0, subject: "sc" },
      { q: "12 × 12 = ?", opts: ["144", "124", "154", "134"], ans: 0, subject: "ma" },
    ];

    function startQuizGame() {
      document.getElementById('mg-title').innerText = '🏫 快問快答';
      document.getElementById('mg-desc').innerText = '限時 10 秒！選出正確答案';
      const area = document.getElementById('mg-game-area');
      const timerFill = document.getElementById('mg-timer-fill');
      timerFill.style.width = '100%';

      const q = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
      // 隨機打亂選項
      const shuffled = q.opts.map((opt, i) => ({ text: opt, isCorrect: i === q.ans }));
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      area.innerHTML = `
        <div style="font-size:1.05rem; font-weight:800; margin-bottom:15px; text-align:center;">${q.q}</div>
        <div class="quiz-options">
          ${shuffled.map((opt, i) => `<button class="quiz-option-btn" data-correct="${opt.isCorrect}" onclick="handleQuizAnswer(this)">${opt.text}</button>`).join('')}
        </div>
      `;

      let timeLeft = 100;
      mgTimerInterval = setInterval(() => {
        timeLeft -= 1;
        timerFill.style.width = `${timeLeft}%`;
        if (timeLeft <= 0) {
          clearInterval(mgTimerInterval);
          // 時間到，判為失敗
          document.querySelectorAll('.quiz-option-btn').forEach(btn => { btn.disabled = true; });
          showMinigameResult(false, 'school');
        }
      }, 100);
    }

    function handleQuizAnswer(btn) {
      if (mgTimerInterval) { clearInterval(mgTimerInterval); mgTimerInterval = null; }
      const isCorrect = btn.dataset.correct === 'true';
      document.querySelectorAll('.quiz-option-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.correct === 'true') b.classList.add('correct');
        else b.classList.add('wrong');
      });
      setTimeout(() => showMinigameResult(isCorrect, 'school'), 800);
    }

    // ---- 🍔 鐵板料理 ----
    // v9.15.1 鐵板翻炒王：看準金黃色澤收成，訂單加分
    const COOK_FOODS = ['🥩', '🍳', '🥦', '🌽', '🍤', '🧅', '🍗', '🦑'];
    function cookPhase(s) {
      if (!s.food) return 'empty';
      if (s.burnt) return 'burnt';
      if (s.cook < 0.45) return 'raw';
      if (s.cook <= 0.78) return 'perfect';
      return 'over';
    }
    function startCookingGame() {
      document.getElementById('mg-title').innerText = '🍳 鐵板翻炒王';
      document.getElementById('mg-desc').innerText = '食材變金黃發光時點它收成！完成訂單有獎勵，30 秒拚 14 分';
      const area = document.getElementById('mg-game-area');
      const timerFill = document.getElementById('mg-timer-fill');
      timerFill.style.width = '100%';
      const G = window._cookGame = {
        t: 30, score: 0, combo: 0, spawnIn: 0, over: false,
        slots: Array.from({ length: 6 }, () => ({ food: null, cook: 0, speed: 1, burnt: 0 })),
        order: null, orderT: 0
      };
      window._cookNewOrder = function () {
        const food = COOK_FOODS[Math.floor(Math.random() * COOK_FOODS.length)];
        G.order = { food, need: 2 + Math.floor(Math.random() * 2), got: 0 };
        G.orderT = 12;
      };
      window._cookNewOrder();
      area.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap;">
          <div id="cook-score" style="font-weight:900; font-size:0.95rem;">⭐ 0 分 ・ 🔥 連擊 0</div>
          <div id="cook-order" style="font-weight:800; font-size:0.88rem; background:#fff3e0; border:2px solid #ffb300; border-radius:12px; padding:3px 10px;"></div>
          <div style="font-weight:800; font-size:0.85rem; opacity:0.75;">目標 14 分</div>
        </div>
        <div class="cooking-belt" id="cooking-belt">
          ${G.slots.map((s, i) => `<div class="cooking-item" data-slot="${i}" onclick="handleCookingClick(this, ${i})"><span class="cook-emoji"></span><span class="cook-ring"><span class="cook-fill"></span></span></div>`).join('')}
        </div>
        <div style="font-size:0.78rem; opacity:0.7; margin-top:8px;">🟡 金黃發光 = 完美收成 +1 ｜ 太生點一下 = 翻面加速 ｜ 過熟點掉丟棄 ｜ 🖤 焦掉點掉丟棄（連擊歸零）</div>
      `;
      mgTimerInterval = setInterval(() => window._cookTick(0.1), 100);
      window._cookRender();
    }

    window._cookTick = function (dt) {
      const G = window._cookGame;
      if (!G || G.over) return;
      const timerFill = document.getElementById('mg-timer-fill');
      G.t -= dt;
      if (timerFill) timerFill.style.width = `${Math.max(0, G.t / 30 * 100)}%`;
      if (G.t <= 0) {
        G.over = true;
        if (mgTimerInterval) { clearInterval(mgTimerInterval); mgTimerInterval = null; }
        showMinigameResult(G.score >= 14, 'restaurant', G.score);
        return;
      }
      if (G.order) { G.orderT -= dt; if (G.orderT <= 0) { G.combo = 0; window._cookNewOrder(); } }
      G.spawnIn -= dt;
      const emptyIdx = G.slots.map((s, i) => s.food ? -1 : i).filter(i => i >= 0);
      if (G.spawnIn <= 0 && emptyIdx.length) {
        const i = emptyIdx[Math.floor(Math.random() * emptyIdx.length)];
        const ramp = 1 + (30 - G.t) / 60;
        const food = (G.order && Math.random() < 0.4) ? G.order.food : COOK_FOODS[Math.floor(Math.random() * COOK_FOODS.length)];
        G.slots[i] = { food, cook: 0, speed: (0.22 + Math.random() * 0.15) * ramp, burnt: 0 };
        G.spawnIn = 0.55 + Math.random() * 0.5;
      }
      G.slots.forEach(s => {
        if (!s.food) return;
        if (s.burnt) { s.burnt -= dt; if (s.burnt <= 0) { s.food = null; s.cook = 0; } return; }
        s.cook += dt * s.speed;
        if (s.cook >= 1.15) s.burnt = 0.9;
      });
      window._cookRender();
    };

    window._cookRender = function () {
      const G = window._cookGame;
      if (!G) return;
      const scoreEl = document.getElementById('cook-score');
      if (scoreEl) scoreEl.textContent = `⭐ ${G.score} 分 ・ 🔥 連擊 ${G.combo}`;
      const orderEl = document.getElementById('cook-order');
      if (orderEl && G.order) orderEl.textContent = `訂單 ${G.order.food} ×${G.order.need}（${G.order.got}/${G.order.need}）獎勵 +4 ・ ${Math.max(0, Math.ceil(G.orderT))}s`;
      document.querySelectorAll('#cooking-belt .cooking-item').forEach((el, i) => {
        const s = G.slots[i]; if (!s) return;
        const ph = cookPhase(s);
        el.className = 'cooking-item' + (s.food ? ' ' + ph : '');
        const em = el.querySelector('.cook-emoji'); if (em) em.textContent = s.food ? (ph === 'burnt' ? '🖤' : s.food) : '';
        const fill = el.querySelector('.cook-fill'); if (fill) fill.style.width = `${Math.min(100, s.cook * 100)}%`;
      });
    };

    function handleCookingClick(el, i) {
      const G = window._cookGame;
      if (!G || G.over) return;
      const s = G.slots[i];
      if (!s || !s.food) return;
      const ph = cookPhase(s);
      if (ph === 'perfect') {
        G.score += 1; G.combo++;
        if (G.combo % 5 === 0) G.score += 1; // 連擊里程碑額外 +1
        if (G.order && s.food === G.order.food) {
          G.order.got++;
          if (G.order.got >= G.order.need) { G.score += 4; G.t = Math.min(30, G.t + 2); window._cookNewOrder(); }
        }
        s.food = null; s.cook = 0;
        playSound('click');
      } else if (ph === 'raw') {
        s.cook += 0.18; // 翻面加速
        playSound('click');
      } else if (ph === 'burnt') {
        G.combo = 0;
        s.food = null; s.cook = 0; s.burnt = 0;
        playSound('examFail');
      } else { // over：丟棄，不斷連擊
        s.food = null; s.cook = 0;
        playSound('click');
      }
      window._cookRender();
    }

    // ---- 🏃 狂點吹氣球 ----
    function startRhythmGame() {
      document.getElementById('mg-title').innerText = '🎈 狂點吹氣球';
      document.getElementById('mg-desc').innerText = '瘋狂點擊吹破氣球！速度就是力量！';
      const area = document.getElementById('mg-game-area');
      const timerFill = document.getElementById('mg-timer-fill');
      timerFill.style.width = '100%';

      const balloonColors = [
        'linear-gradient(135deg, #ff453a, #ff6b6b)',
        'linear-gradient(135deg, #0a84ff, #5ac8fa)',
        'linear-gradient(135deg, #30d158, #8ded9f)',
        'linear-gradient(135deg, #ff9f0a, #ffd60a)',
        'linear-gradient(135deg, #bf5af2, #da8aff)'
      ];
      const totalBalloons = 3;
      let currentBalloonIdx = 0;
      let poppedCount = 0;
      let clickCount = 0;
      let clickTarget = 0;
      let gameOver = false;

      area.innerHTML = `
        <div style="font-weight:700; margin-bottom:8px;">吹破氣球：<span id="balloon-popped">0</span> / ${totalBalloons}</div>
        <div id="balloon-zone" style="width:100%; height:180px; display:flex; align-items:center; justify-content:center; position:relative; cursor:pointer; user-select:none;" onclick="handleBalloonClick()">
          <div id="balloon-body" style="width:60px; height:70px; border-radius:50% 50% 50% 50% / 55% 55% 45% 45%; display:flex; align-items:center; justify-content:center; font-size:2rem; transition: width 0.08s, height 0.08s; position:relative;">
            🎈
            <div style="position:absolute; bottom:-15px; font-size:0.7rem; font-weight:700; color:var(--text-muted);" id="balloon-clicks">0 / ?</div>
          </div>
        </div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:6px;">瘋狂點擊氣球！也可以按空白鍵！</div>
      `;

      function spawnBalloon() {
        if (currentBalloonIdx >= totalBalloons || gameOver) return;
        clickTarget = 8 + Math.floor(Math.random() * 8); // 8~15 次
        clickCount = 0;
        const balloon = document.getElementById('balloon-body');
        const color = balloonColors[currentBalloonIdx % balloonColors.length];
        balloon.style.background = color;
        balloon.style.width = '60px';
        balloon.style.height = '70px';
        balloon.style.opacity = '1';
        balloon.style.borderRadius = '50% 50% 50% 50% / 55% 55% 45% 45%';
        balloon.innerHTML = `🎈<div style="position:absolute; bottom:-15px; font-size:0.7rem; font-weight:700; color:var(--text-muted);" id="balloon-clicks">0 / ${clickTarget}</div>`;
      }

      window.handleBalloonClick = function () {
        if (gameOver || currentBalloonIdx >= totalBalloons) return;
        clickCount++;
        playSound('click');

        const balloon = document.getElementById('balloon-body');
        const progress = clickCount / clickTarget;
        const baseSize = 60;
        const maxSize = 140;
        const size = baseSize + (maxSize - baseSize) * Math.min(progress, 1);
        balloon.style.width = `${size}px`;
        balloon.style.height = `${size * 1.15}px`;

        // 更新計數
        const clicksEl = document.getElementById('balloon-clicks');
        if (clicksEl) clicksEl.innerText = `${clickCount} / ${clickTarget}`;

        // 微震動
        balloon.style.transform = `rotate(${(Math.random() - 0.5) * 8}deg)`;
        setTimeout(() => { if (balloon) balloon.style.transform = 'rotate(0deg)'; }, 60);

        if (clickCount >= clickTarget) {
          // 氣球破裂！
          poppedCount++;
          currentBalloonIdx++;
          document.getElementById('balloon-popped').innerText = poppedCount;
          playSound('levelUp');

          // 破裂動畫
          balloon.style.transform = 'scale(1.5)';
          balloon.style.opacity = '0';
          balloon.innerHTML = '💥';
          balloon.style.fontSize = '3rem';

          setTimeout(() => {
            if (currentBalloonIdx < totalBalloons && !gameOver) {
              spawnBalloon();
            }
            if (currentBalloonIdx >= totalBalloons && !gameOver) {
              gameOver = true;
              document.removeEventListener('keydown', balloonKeyHandler);
              if (mgTimerInterval) { clearInterval(mgTimerInterval); mgTimerInterval = null; }
              showMinigameResult(true, 'gym');
            }
          }, 400);
        }
      };

      const balloonKeyHandler = (e) => {
        if (e.code === 'Space' && document.getElementById('minigame-overlay').classList.contains('active')) {
          e.preventDefault();
          window.handleBalloonClick();
        }
      };
      document.addEventListener('keydown', balloonKeyHandler);

      // 限時 8 秒
      let timeLeft = 100;
      mgTimerInterval = setInterval(() => {
        timeLeft -= 1.25; // 8 秒 = 100 / 1.25 = 80 次 * 100ms
        timerFill.style.width = `${Math.max(0, timeLeft)}%`;
        if (timeLeft <= 0) {
          gameOver = true;
          clearInterval(mgTimerInterval);
          document.removeEventListener('keydown', balloonKeyHandler);
          const win = poppedCount >= 2; // 至少破 2 顆
          showMinigameResult(win, 'gym');
        }
      }, 100);

      spawnBalloon();
    }

    // ---- 📖 記憶配對 ----
    function startMemoryGame() {
      document.getElementById('mg-title').innerText = '📖 記憶配對';
      document.getElementById('mg-desc').innerText = '翻開卡片找到配對的學科符號！';
      const area = document.getElementById('mg-game-area');
      const timerFill = document.getElementById('mg-timer-fill');
      timerFill.style.width = '100%';

      const symbols = ['📖', '🔠', '➕', '🔬', '🌍', '📖', '🔠', '➕', '🔬', '🌍', '📝', '📝'];
      // 打亂
      for (let i = symbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
      }

      let flipped = [];
      let matched = 0;
      let canFlip = true;
      const totalPairs = 6;

      area.innerHTML = `
        <div class="memory-grid" id="memory-grid">
          ${symbols.map((s, i) => `<div class="memory-card" data-sym="${s}" data-idx="${i}" onclick="handleMemoryFlip(this)">❓</div>`).join('')}
        </div>
      `;

      let timeLeft = 100;
      mgTimerInterval = setInterval(() => {
        timeLeft -= 0.3;
        timerFill.style.width = `${Math.max(0, timeLeft)}%`;
        if (timeLeft <= 0) {
          clearInterval(mgTimerInterval);
          showMinigameResult(false, 'library');
        }
      }, 100);

      window.handleMemoryFlip = function (card) {
        if (!canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) return;
        playSound('click');
        card.classList.add('flipped');
        card.innerText = card.dataset.sym;
        flipped.push(card);

        if (flipped.length === 2) {
          canFlip = false;
          const [c1, c2] = flipped;
          if (c1.dataset.sym === c2.dataset.sym) {
            c1.classList.add('matched');
            c2.classList.add('matched');
            matched++;
            playSound('levelUp');
            flipped = [];
            canFlip = true;
            if (matched >= totalPairs) {
              if (mgTimerInterval) { clearInterval(mgTimerInterval); mgTimerInterval = null; }
              setTimeout(() => showMinigameResult(true, 'library'), 500);
            }
          } else {
            setTimeout(() => {
              c1.classList.remove('flipped'); c1.innerText = '❓';
              c2.classList.remove('flipped'); c2.innerText = '❓';
              flipped = [];
              canFlip = true;
            }, 600);
          }
        }
      };
    }

    // ---- 🏪 便利商店：收銀刷條碼小遊戲 ----
    function startStoreGame() {
      document.getElementById('mg-title').innerText = '🏪 收銀刷條碼';
      document.getElementById('mg-desc').innerText = '點擊掃描全部 6 件商品條碼，千萬別點到「💣 奧客地雷」！';
      const area = document.getElementById('mg-game-area');
      const timerFill = document.getElementById('mg-timer-fill');
      timerFill.style.width = '100%';

      const goodPool = ['🍙 御飯糰', '🍱 國民便當', '🥤 冰拿鐵', '🍞 菠蘿麵包', '🍵 無糖綠茶', '🍫 巧克力', '🍜 泡麵', '🥚 茶葉蛋'];
      const pickedGoods = goodPool.sort(() => Math.random() - 0.5).slice(0, 6).map(item => ({ label: item, isBomb: false }));
      const bombs = [
        { label: '💣 奧客退貨', isBomb: true },
        { label: '💣 沒帶錢包', isBomb: true }
      ];
      const allItems = [...pickedGoods, ...bombs].sort(() => Math.random() - 0.5);
      let scannedCount = 0;
      const targetScan = 6;
      let ended = false;

      area.innerHTML = `
        <div style="font-weight:800; font-size:0.9rem; margin-bottom:10px; text-align:center;">
          已刷條碼：<span id="store-scan-count" style="color:var(--accent);">0</span> / ${targetScan}
        </div>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; width:100%;">
          ${allItems.map((it, idx) => `
            <button class="quiz-option-btn" data-bomb="${it.isBomb}" onclick="handleStoreScan(this)"
              style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; font-size:0.88rem;">
              <span>${it.label}</span>
              <span style="font-family:monospace; font-size:0.75rem; opacity:0.65;">|||||</span>
            </button>
          `).join('')}
        </div>
      `;

      window.handleStoreScan = function (btn) {
        if (ended || btn.disabled) return;
        const isBomb = btn.dataset.bomb === 'true';
        btn.disabled = true;

        if (isBomb) {
          ended = true;
          btn.classList.add('wrong');
          btn.innerHTML = `<span>💥 遇到奧客糾纏！</span><span>✕</span>`;
          playSound('examFail');
          if (mgTimerInterval) { clearInterval(mgTimerInterval); mgTimerInterval = null; }
          setTimeout(() => showMinigameResult(false, 'store'), 600);
        } else {
          scannedCount++;
          btn.classList.add('correct');
          btn.innerHTML = `<span>✅ 嗶！結帳完成</span><span>+$</span>`;
          playSound('buy');
          const countEl = document.getElementById('store-scan-count');
          if (countEl) countEl.innerText = scannedCount;

          if (scannedCount >= targetScan) {
            ended = true;
            if (mgTimerInterval) { clearInterval(mgTimerInterval); mgTimerInterval = null; }
            setTimeout(() => showMinigameResult(true, 'store'), 450);
          }
        }
      };

      let timeLeft = 100;
      mgTimerInterval = setInterval(() => {
        timeLeft -= 1.1; // 約 9 秒
        timerFill.style.width = `${Math.max(0, timeLeft)}%`;
        if (timeLeft <= 0 && !ended) {
          ended = true;
          clearInterval(mgTimerInterval);
          showMinigameResult(false, 'store');
        }
      }, 100);
    }

    // ---- 🏠 數羊入睡 ----
    function startSheepGame() {
      document.getElementById('mg-title').innerText = '🏠 數羊入睡';
      document.getElementById('mg-desc').innerText = '數數看有幾隻羊跑過去？小心別數錯！';
      const area = document.getElementById('mg-game-area');
      const timerFill = document.getElementById('mg-timer-fill');
      timerFill.style.width = '100%';

      const sheepCount = 3 + Math.floor(Math.random() * 5); // 3~7
      const decoys = 1 + Math.floor(Math.random() * 3); // 1~3 干擾物
      const animals = [];
      for (let i = 0; i < sheepCount; i++) animals.push('🐑');
      for (let i = 0; i < decoys; i++) animals.push(['🐷', '🐄', '🐔'][Math.floor(Math.random() * 3)]);

      area.innerHTML = `
        <div class="sheep-field" id="sheep-field"></div>
        <div style="margin-top:12px; font-weight:700; font-size:0.9rem;">跑過去幾隻 🐑 羊？</div>
        <div style="display:flex; gap:6px; margin-top:8px; justify-content:center;" id="sheep-answers"></div>
      `;

      const field = document.getElementById('sheep-field');
      let spawnIndex = 0;

      // 隨機打亂動物順序
      for (let i = animals.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [animals[i], animals[j]] = [animals[j], animals[i]];
      }

      const spawnInterval = setInterval(() => {
        if (spawnIndex >= animals.length) {
          clearInterval(spawnInterval);
          // 顯示答案選項
          setTimeout(() => {
            const answers = document.getElementById('sheep-answers');
            if (!answers) return;
            const options = new Set();
            options.add(sheepCount);
            while (options.size < 4) {
              options.add(Math.max(1, sheepCount + Math.floor(Math.random() * 5) - 2));
            }
            const optArr = [...options].sort(() => Math.random() - 0.5);
            answers.innerHTML = optArr.map(n =>
              `<button class="quiz-option-btn" style="width:50px;" onclick="handleSheepAnswer(${n}, ${sheepCount})">${n}</button>`
            ).join('');
          }, 500);
          return;
        }
        const sprite = document.createElement('div');
        sprite.className = 'sheep-sprite';
        sprite.innerText = animals[spawnIndex];
        sprite.style.top = `${20 + Math.random() * 100}px`;
        sprite.style.animationDuration = `${2 + Math.random() * 1.5}s`;
        field.appendChild(sprite);
        setTimeout(() => sprite.remove(), 4000);
        spawnIndex++;
      }, 600);
    }

    window.handleSheepAnswer = function (chosen, correct) {
      showMinigameResult(chosen === correct, 'home');
    };



    // ================= v9.3 好玩化：陪讀連擊 / 模擬考 / 宿敵 / 本週目標 / 登入獎勵 / 轉蛋套裝 =================
    // ---------- 陪讀連擊 ----------
    const COMBO_SUBJECT_CHARS = { cn: '國', en: '英', ma: '數', sc: '理', so: '社' };
    function comboMult() { return 1 + Math.min(gameState.combo || 0, 50) * 0.005; }
    function updateComboPill() {
      const pill = document.getElementById('combo-pill');
      if (!pill) return;
      const c = gameState.combo || 0;
      pill.style.display = c >= 2 ? 'block' : 'none';
      const num = document.getElementById('combo-num');
      if (num) num.textContent = c;
    }
    function uiCovered() { return !!document.querySelector('.drawer-panel.open') || !!document.querySelector('.overlay.active'); }
    function spawnComboBubble() {
      const wrap = document.getElementById('char-wrap');
      if (!wrap || wrap.querySelector('.combo-bubble')) return;
      const keys = Object.keys(COMBO_SUBJECT_CHARS);
      const sub = keys[Math.floor(Math.random() * keys.length)];
      const el = document.createElement('button');
      el.className = 'combo-bubble';
      el.textContent = COMBO_SUBJECT_CHARS[sub];
      el.style.background = (typeof SUBJECT_COLORS !== 'undefined' && SUBJECT_COLORS[sub]) || '#ffd32a';
      el.style.left = (-30 + Math.random() * 62) + 'px';
      el.style.top = (-52 + Math.random() * 22) + 'px';
      el.setAttribute('aria-label', '知識泡泡');
      el.onclick = () => popComboBubble(el);
      wrap.appendChild(el);
      setTimeout(() => {
        if (el.isConnected && !el.dataset.done) {
          el.remove();
          if (!uiCovered() && (gameState.combo || 0) > 0) {
            gameState.combo = 0;
            updateComboPill();
            queueFloatingText('💨 泡泡跑掉了，連擊中斷…');
          }
        }
      }, 2600);
      el._sub = sub;
    }
    function popComboBubble(el) {
      if (!el || el.dataset.done) return;
      el.dataset.done = '1';
      const sub = el._sub || 'cn';
      el.remove();
      gameState.combo = (gameState.combo || 0) + 1;
      const today = gameState.totalGameDays || 0;
      if (gameState._comboDay !== today) { gameState._comboDay = today; gameState.comboHitsToday = 0; }
      gameState.comboHitsToday = (gameState.comboHitsToday || 0) + 1;
      if (typeof bumpWeekly === 'function') bumpWeekly('combo');
      const prop = currentLoc === 'school' ? 'school' : 'home';
      const cap = prop === 'school' ? 60 : 40;
      const s = gameState.subjects[sub];
      if (s) s[prop] = Math.min(cap, s[prop] + 1);
      if (gameState.combo % 10 === 0) playSound('levelUp');
      queueFloatingText(`🫧 連擊 ×${gameState.combo}（${s ? s.name : ''} +1）`);
      updateComboPill();
    }
    function maybeSpawnComboBubble() {
      try {
        if (typeof gameState === 'undefined' || !gameState) return;
        if (currentState !== 'studying') return;
        if (currentLoc !== 'school' && currentLoc !== 'library' && !(currentLoc === 'home' && gameState.deskStudy)) return;
        if (uiCovered()) return;
        if (Math.random() < 0.45) return;
        spawnComboBubble();
      } catch (e) { }
    }
    setInterval(maybeSpawnComboBubble, 1100);

    // ---------- 模擬考 ----------
    const MOCK_QUESTIONS = [
      { q: '「床前明月光」的下一句是？', opts: ['疑是地上霜', '低頭思故鄉', '舉頭望明月'], a: 0 },
      { q: '成語「畫蛇添足」的意思是？', opts: ['畫畫很厲害', '多此一舉', '蛇沒有腳'], a: 1 },
      { q: 'Apple 是哪一種水果？', opts: ['香蕉', '西瓜', '蘋果'], a: 2 },
      { q: '「Hot」的相反詞是？', opts: ['Cold', 'Warm', 'Big'], a: 0 },
      { q: '7 × 8 = ?', opts: ['54', '56', '64'], a: 1 },
      { q: '100 − 37 = ?', opts: ['63', '67', '73'], a: 0 },
      { q: '三角形的內角和是幾度？', opts: ['90 度', '180 度', '360 度'], a: 1 },
      { q: '12 × 5 = ?', opts: ['50', '55', '60'], a: 2 },
      { q: '水的化學式是？', opts: ['CO2', 'H2O', 'O2'], a: 1 },
      { q: '植物行光合作用需要什麼？', opts: ['月光', '陽光', '燈光泡泡'], a: 1 },
      { q: '地球繞著什麼轉？', opts: ['月亮', '太陽', '火星'], a: 1 },
      { q: '台灣最高的山是？', opts: ['阿里山', '雪山', '玉山'], a: 2 },
      { q: '雙十國慶是幾月幾日？', opts: ['10 月 10 日', '1 月 1 日', '12 月 25 日'], a: 0 },
      { q: '台灣最大的天然湖泊是？', opts: ['澄清湖', '日月潭', '鯉魚潭'], a: 1 },
      { q: '一打有幾個？', opts: ['10 個', '12 個', '20 個'], a: 1 },
      { q: 'Dog 的複數形是？', opts: ['Doges', 'Dogs', 'Dogies'], a: 1 },
      { q: '哪個動物會冬眠？', opts: ['熊', '猴子', '大象'], a: 0 },
      { q: '彩虹有幾種顏色？', opts: ['5 種', '6 種', '7 種'], a: 2 },
    ];
    let mockTimer = null, mockList = [], mockIdx = 0, mockScore = 0, mockTimeLeft = 60, mockLock = false;
    function openMockExam() {
      if (gameState._mockDay === (gameState.totalGameDays || 0)) { createFloatingText('📝 今天已經考過模擬考了，明天再來！'); return; }
      const ov = document.getElementById('mock-overlay');
      if (!ov) return;
      mockList = [...MOCK_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
      mockIdx = 0; mockScore = 0; mockTimeLeft = 60; mockLock = false;
      ov.classList.add('active');
      document.getElementById('mock-result').style.display = 'none';
      document.getElementById('mock-quiz').style.display = 'block';
      renderMockQ();
      clearInterval(mockTimer);
      mockTimer = setInterval(() => {
        mockTimeLeft--;
        const tl = document.getElementById('mock-time');
        if (tl) tl.textContent = mockTimeLeft;
        if (mockTimeLeft <= 0) finishMockExam();
      }, 1000);
      const tl = document.getElementById('mock-time');
      if (tl) tl.textContent = mockTimeLeft;
    }
    function renderMockQ() {
      const item = mockList[mockIdx];
      if (!item) { finishMockExam(); return; }
      document.getElementById('mock-progress').textContent = `第 ${mockIdx + 1} / ${mockList.length} 題・答對 ${mockScore} 題`;
      document.getElementById('mock-q').textContent = item.q;
      const box = document.getElementById('mock-opts');
      box.innerHTML = '';
      item.opts.forEach((op, i) => {
        const b = document.createElement('button');
        b.className = 'btn mock-opt';
        b.textContent = op;
        b.onclick = () => answerMock(i, b);
        box.appendChild(b);
      });
    }
    function answerMock(i, btn) {
      if (mockLock) return;
      mockLock = true;
      const item = mockList[mockIdx];
      const ok = i === item.a;
      if (ok) mockScore++;
      btn.style.background = ok ? '#30d158' : '#ff5a5a';
      btn.style.color = '#fff';
      playSound(ok ? 'levelUp' : 'examFail');
      setTimeout(() => { mockIdx++; mockLock = false; if (mockIdx >= mockList.length) finishMockExam(); else renderMockQ(); }, 260);
    }
    function finishMockExam() {
      clearInterval(mockTimer);
      gameState._mockDay = gameState.totalGameDays || 0;
      const buff = Math.min(20, mockScore * 2);
      gameState.mockBuff = buff;
      document.getElementById('mock-quiz').style.display = 'none';
      const res = document.getElementById('mock-result');
      res.style.display = 'block';
      res.innerHTML = `<div style="font-size:2rem;">${mockScore >= 8 ? '🏆' : (mockScore >= 5 ? '💪' : '😅')}</div><div style="font-weight:900; font-size:1.05rem; margin:6px 0;">答對 ${mockScore} / ${mockList.length} 題</div><div style="color:var(--text-muted); font-size:0.85rem;">正式考試成功率 <b style="color:#2a9d8f;">+${buff}%</b>（用於下一次升學考）</div>`;
      playSound(mockScore >= 5 ? 'examSuccess' : 'click');
      saveGameData();
      updateUI();
    }
    function closeMockExam() {
      clearInterval(mockTimer);
      const ov = document.getElementById('mock-overlay');
      if (ov) ov.classList.remove('active');
    }

    // ---------- 宿敵 ----------
    const RIVAL_DEFS = [
      { key: 'jie', name: '王子傑', emoji: '😎', rate: 0.78, lines: { lead: '「這週的獎學金，我先預約了。」', ready: '「我準備好了，你呢？」' } },
      { key: 'kui', name: '陳小葵', emoji: '🌸', rate: 0.66, burst: true, lines: { lead: '「嘻嘻，我好像比較快喔～」', ready: '「我隨時可以考囉！」' } },
      { key: 'shu', name: '高大樹', emoji: '🌳', rate: 0.58, lines: { lead: '「一步一腳印，我先到了。」', ready: '「準備完成，等你一起考。」' } },
    ];
    function ensureRivals() {
      if (!Array.isArray(gameState.rivals) || gameState.rivals.length !== 3) {
        gameState.rivals = RIVAL_DEFS.map((d, i) => ({ key: d.key, prog: [14, 9, 5][i], wins: 0 }));
      }
      return gameState.rivals;
    }
    function raceProgYou() { // v9.12.1 每週競賽：你的進度從本週起算
      return Math.max(0, playerGradeProgress() - (gameState._weekBaseProg || 0));
    }
    function playerGradeProgress() {
      let s = 0;
      for (let k in gameState.subjects) s += gameState.subjects[k].school + gameState.subjects[k].home;
      return Math.min(100, Math.round(s / 5));
    }
    function tickRivalsHourly() {
      const rs = ensureRivals();
      const you = raceProgYou();
      rs.forEach(r => {
        const def = RIVAL_DEFS.find(d => d.key === r.key);
        let g = def.rate * (0.85 + Math.random() * 0.3);
        if (def.burst && Math.random() < 0.08) g += 2.2;
        const diff = r.prog - you;
        if (diff > 25) g *= 0.7; else if (diff < -25) g *= 1.3;
        r.prog = Math.round(Math.min(100, r.prog + g) * 10) / 10;
      });
      let leader = 'you', best = you;
      rs.forEach(r => { if (r.prog > best) { best = r.prog; leader = r.key; } });
      const prev = gameState._rivalLeader;
      gameState._rivalLeader = leader;
      if (prev && prev !== leader) {
        if (leader === 'you') queueFloatingText('🏁 你衝到第一名了！');
        else { const d = RIVAL_DEFS.find(x => x.key === leader); queueFloatingText(`🏁 ${d.name} 超前你了，加油！`); }
      }
      renderRivals();
    }
    function onPlayerExamPassed() {
      ensureRivals().forEach(r => { r.prog = 4 + Math.round(Math.random() * 10); });
      gameState._rivalLeader = null;
      gameState._weekBaseProg = playerGradeProgress();
      queueFloatingText('🎓 宿敵們也跟上來了，新一週競賽開始！');
      renderRivals();
    }
    function onPlayerExamFailed() {
      const rs = ensureRivals();
      const ready = rs.filter(r => r.prog >= 100);
      if (ready.length) {
        const d = RIVAL_DEFS.find(x => x.key === ready[0].key);
        ready[0].wins = (ready[0].wins || 0) + 1;
        rs.forEach(r => { r.prog = 4 + Math.round(Math.random() * 10); });
        gameState._weekBaseProg = playerGradeProgress();
        gameState._rivalLeader = null;
        queueFloatingText(`🎓 ${d.name} 衝到 100%，拿下本週獎學金了！下週贏回來`);
        renderRivals();
      }
    }
    // v9.12 公佈欄：與宿敵面板同一份名次，貼到學校牆上
    function boardRows() {
      const rs = ensureRivals();
      const you = raceProgYou();
      return [{ name: '你', prog: you, you: true }]
        .concat(rs.map(r => { const d = RIVAL_DEFS.find(x => x.key === r.key); return { name: d.name, prog: r.prog, you: false }; }))
        .sort((a, b) => b.prog - a.prog);
    }
    function renderBoard() {
      const g = document.getElementById('rank-board');
      if (!g) return;
      const rows = boardRows();
      const sig = rows.map(r => r.name + Math.floor(r.prog)).join('|');
      if (g.dataset.sig === sig) return;
      g.dataset.sig = sig;
      rows.slice(0, 3).forEach((r, i) => { const el = document.getElementById('board-r' + (i + 1)); if (el) el.textContent = `${i + 1}.${r.name} ${Math.floor(r.prog)}%`; });
      const myRank = rows.findIndex(r => r.you);
      const hl = document.getElementById('board-hl');
      if (hl) { if (myRank >= 0 && myRank < 3) { hl.style.display = ''; hl.setAttribute('y', String(50 + myRank * 12)); } else hl.style.display = 'none'; }
      const you = document.getElementById('board-you');
      if (you) you.textContent = myRank >= 3 ? `你：第 ${myRank + 1} 名 ${Math.floor(rows[myRank].prog)}%` : '';
    }
    function renderRivals() {
      renderBoard();
      const box = document.getElementById('rivals-list');
      if (!box) return;
      const rs = ensureRivals();
      const you = raceProgYou();
      const rows = [{ name: '你', emoji: '🧑', prog: you, you: true, wins: gameState.examsPassedTotal || 0 }]
        .concat(rs.map(r => { const d = RIVAL_DEFS.find(x => x.key === r.key); return { name: d.name, emoji: d.emoji, prog: r.prog, wins: r.wins || 0 }; }))
        .sort((a, b) => b.prog - a.prog);
      const sig = rows.map(r => r.name + Math.round(r.prog) + ':' + r.wins).join('|');
      if (box.dataset.sig === sig) return;
      box.dataset.sig = sig;
      box.innerHTML = rows.map(r => `<div class="rival-row${r.you ? ' is-you' : ''}"><span class="rival-emoji">${r.emoji}</span><span class="rival-name">${r.name}${r.wins ? ` 🏆×${r.wins}` : ''}</span><span class="rival-bar"><span class="rival-fill" style="width:${Math.min(100, r.prog)}%"></span></span><span class="rival-pct">${Math.floor(r.prog)}%${r.prog >= 100 ? ' 準備好了！' : ''}</span></div>`).join('');
      const taunt = document.getElementById('rival-taunt');
      if (taunt) {
        const top = rows[0];
        if (top.you) taunt.textContent = '目前由你領先，別鬆懈！';
        else { const d = RIVAL_DEFS.find(x => x.name === top.name); taunt.textContent = top.prog >= 100 ? d.lines.ready : d.lines.lead; }
      }
    }

    // ---------- 本週目標 ----------
    const WEEKLY_POOL = [
      { id: 'study', icon: '📚', desc: '本週讀書 {t} 小時', target: 15, metric: 'study' },
      { id: 'exams', icon: '🎓', desc: '本週通過 {t} 次升學考', target: 1, metric: 'exams' },
      { id: 'chats', icon: '💬', desc: '本週和好友聊天 {t} 次', target: 8, metric: 'chats' },
      { id: 'quests', icon: '📋', desc: '本週完成 {t} 個每日任務', target: 9, metric: 'quests' },
      { id: 'combo', icon: '🫧', desc: '本週陪讀連擊點擊 {t} 次', target: 60, metric: 'combo' },
    ];
    const WEEKLY_REWARD = 1200;
    function weekKeyOf() {
      const d = new Date(); const s = new Date(d.getFullYear(), 0, 1);
      const w = Math.ceil((((d - s) / 86400000) + s.getDay() + 1) / 7);
      return d.getFullYear() + '-W' + w;
    }
    function ensureWeeklyGoal() {
      const key = weekKeyOf();
      if (!gameState.weekly || gameState.weekly.key !== key) {
        const def = WEEKLY_POOL[Math.floor(Math.random() * WEEKLY_POOL.length)];
        gameState.weekly = { key, id: def.id, counts: { study: 0, exams: 0, chats: 0, quests: 0, combo: 0 }, rewarded: false };
      }
      return gameState.weekly;
    }
    function weeklyDef() { return WEEKLY_POOL.find(x => x.id === ensureWeeklyGoal().id); }
    function bumpWeekly(m) {
      const w = ensureWeeklyGoal();
      w.counts[m] = (w.counts[m] || 0) + 1;
      evaluateWeeklyReward();
      renderWeeklyGoal();
    }
    function evaluateWeeklyReward() {
      const w = ensureWeeklyGoal(); const def = weeklyDef();
      if (!w.rewarded && (w.counts[def.metric] || 0) >= def.target) {
        w.rewarded = true;
        gameState.money = (gameState.money || 0) + WEEKLY_REWARD;
        queueFloatingText(`🎯 本週目標達成：${def.desc.replace('{t}', def.target)}（+$${WEEKLY_REWARD}）`);
        playSound('levelUp');
        saveGameData();
      }
    }
    function renderWeeklyGoal() {
      const box = document.getElementById('weekly-goal-box');
      if (!box) return;
      const w = ensureWeeklyGoal(); const def = weeklyDef();
      const cur = Math.min(def.target, w.counts[def.metric] || 0);
      const sig = w.key + cur + w.rewarded;
      if (box.dataset.sig === sig) return;
      box.dataset.sig = sig;
      box.innerHTML = `<div class="quest-row${w.rewarded ? ' done' : ''}"><span class="quest-icon">${def.icon}</span><span class="quest-desc">${def.desc.replace('{t}', def.target)}</span><span class="quest-prog">${w.rewarded ? '✅ 已領獎' : cur + ' / ' + def.target}</span><span class="quest-reward">$${WEEKLY_REWARD}</span></div>`;
    }

    // ---------- 每日登入獎勵 ----------
    const LOGIN_REWARDS = [
      { label: '$100', money: 100 }, { label: '$200', money: 200 }, { label: '🎁 服裝部件', part: true },
      { label: '$400', money: 400 }, { label: '📚 全科 +4', study: 4 }, { label: '$800', money: 800 },
      { label: '🎁 部件＋$600', part: true, money: 600 },
    ];
    function dateStr(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function ensureLogin() { if (!gameState.login) gameState.login = { last: '', streak: 0, claimed: true }; return gameState.login; }
    function checkLoginReward() {
      const L = ensureLogin();
      const today = dateStr(new Date());
      if (L.last !== today) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        L.streak = (L.last === dateStr(y)) ? (L.streak || 0) + 1 : 1;
        L.last = today; L.claimed = false;
        saveGameData();
      }
      if (!L.claimed) {
        if (document.querySelector('.overlay.active') && !document.getElementById('login-overlay').classList.contains('active')) {
          gameState._loginRetries = (gameState._loginRetries || 0) + 1;
          if (gameState._loginRetries < 24) setTimeout(checkLoginReward, 2500);
          return;
        }
        openLoginModal();
      }
      renderLoginBtn();
    }
    function loginCycleDay() { const L = ensureLogin(); return ((Math.max(1, L.streak || 1) - 1) % 7) + 1; }
    function openLoginModal() { const ov = document.getElementById('login-overlay'); if (!ov) return; renderLoginModal(); ov.classList.add('active'); }
    function closeLoginModal() { const ov = document.getElementById('login-overlay'); if (ov) ov.classList.remove('active'); }
    function renderLoginModal() {
      const L = ensureLogin(); const day = loginCycleDay();
      const grid = document.getElementById('login-grid');
      if (grid) {
        grid.innerHTML = LOGIN_REWARDS.map((r, i) => {
          const d = i + 1; const cls = d < day ? ' past' : (d === day ? ' today' : '');
          return `<div class="login-cell${cls}"><div class="login-day">第 ${d} 天</div><div class="login-reward">${r.label}</div>${d === day ? `<div class="login-state">${L.claimed ? '✅ 已領取' : '🎁 今天'}</div>` : ''}</div>`;
        }).join('');
      }
      const st = document.getElementById('login-streak');
      if (st) st.textContent = `🔥 連續登入 ${L.streak || 1} 天`;
      const btn = document.getElementById('btn-login-claim');
      if (btn) { btn.disabled = !!L.claimed; btn.textContent = L.claimed ? '✅ 今天已領取（明天再來）' : '🎁 領取今天的獎勵'; }
    }
    function claimLoginReward() {
      const L = ensureLogin();
      if (L.claimed) return;
      const r = LOGIN_REWARDS[loginCycleDay() - 1];
      if (r.money) gameState.money = (gameState.money || 0) + r.money;
      if (r.study) { for (let k in gameState.subjects) { gameState.subjects[k].school = Math.min(60, gameState.subjects[k].school + r.study); gameState.subjects[k].home = Math.min(40, gameState.subjects[k].home + r.study); } }
      let partMsg = '';
      if (r.part) partMsg = grantRandomPart();
      L.claimed = true;
      playSound('levelUp');
      queueFloatingText(`📅 登入獎勵：${r.label}${partMsg}`);
      renderLoginModal(); renderLoginBtn();
      saveGameData(); updateUI();
    }
    function grantRandomPart() {
      const locked = GACHA_PARTS.filter(pt => !(gameState.unlockedParts || []).includes(pt.id));
      if (!locked.length) { gameState.money = (gameState.money || 0) + 300; return '（部件已全收集，改發 $300）'; }
      const pick = locked[Math.floor(Math.random() * locked.length)];
      if (!gameState.unlockedParts) gameState.unlockedParts = [];
      gameState.unlockedParts.push(pick.id);
      return '：' + pick.name;
    }
    function renderLoginBtn() {
      const el = document.getElementById('login-btn-label');
      if (!el) return;
      const L = ensureLogin();
      const txt = `每日登入（連續 ${L.streak || 0} 天）${L.claimed ? '' : '・有獎勵可領！'}`;
      if (el.textContent !== txt) el.textContent = txt;
         const dot = document.getElementById('login-dot'); // v9.4 主畫面紅點
      if (dot) dot.style.display = L.claimed ? 'none' : 'block';
    }
    setTimeout(() => { try { checkLoginReward(); } catch (e) { } }, 1600);

    // ---------- 轉蛋 + 套裝 ----------
    const HAT_A = ['................','....RRRRRRR.....','..RRRRRRRRRRR...','.RRRRRRRRRRRRR..','.DDDDDDDDDDDDDD.','....WWWW........','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................'];
    const HAT_B = ['................','...TTTTTTTTTT...','..TTTTTTTTTTTT..','..TTTTTTTTTTTT..','.TTTTTTTTTTTTTT.','.BBBBBBBBBBBBBB.','.BWBWBWBWBWBWB..','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................'];
    const TOP_A = ['................','................','................','................','................','................','................','................','................','................','...NNNNNNNNNN...','..NNNNNNNNNNNN..','..NNWWNNNNWWNN..','..NNWWNNRRNNNN..','..NNNWNRRNNNNN..','..NNNWWNNNNNNN..','..SSNNNNNNNSS...','..SSNNNNNNNSS...','....NNNNNNNN....','....NNNNNNNN....','....DDDDDDDD....','................','................','................','................'];
    const TOP_B = ['................','................','................','................','................','................','................','................','................','................','...WWBBBBBBWW...','..WWWBBBBBBWWW..','..WWBBBBBBBBWW..','..WWBBBGGBBBB...','..WWBBBBBBBBWW..','..WWBBBBBBBBWW..','..SSBBBBBBBBSS..','..SSBBBBBBBBSS..','....BBBBBBB.....','....BBBBBBB.....','....DDDDDDD.....','................','................','................','................'];
    const SHOE_A = ['................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','...WWWW..WWWW...','..WWWWWWWWWWWW..','...RRRR..RRRR...','................'];
    const SHOE_B = ['................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','................','...BBBB..BBBB...','..BBBBBBBBBBBB..','...DDDD..DDDD...','................'];
    const HAT_TOP = ['................','................','................','.....KKKKKK.....','.....KKKKKK.....','.....KKKKKK.....','.....KKKKKK.....','.....KKKKKK.....','....GGGGGGGG....','..KKKKKKKKKKKK..','..KKKKKKKKKKKK..','................','................','................','................','................','................','................','................','................','................','................','................','................','................'];
    const GACHA_PARTS = [
      { id: 'star-hat', set: 'star', type: 'hat', name: '星空法帽', map: { T: '#2b2d5c', B: '#4547a8', W: '#f1c40f' }, rows: HAT_B },
      { id: 'star-clothes', set: 'star', type: 'clothes', name: '星空法袍', map: { N: '#34306e', W: '#f5f3ff', R: '#f1c40f', D: '#1d1b3e' }, rows: TOP_A },
      { id: 'star-shoes', set: 'star', type: 'shoes', name: '星塵跑鞋', map: { W: '#e8e6ff', R: '#5a54c4', D: '#3c388f' }, rows: SHOE_A },
      { id: 'sport-hat', set: 'sport', type: 'hat', name: '火焰鴨舌帽', map: { R: '#ff8c1a', D: '#e56f00', W: '#ffffff' }, rows: HAT_A },
      { id: 'sport-clothes', set: 'sport', type: 'clothes', name: '火焰背心', map: { W: '#ffffff', B: '#ff8c1a', D: '#c75b00', G: '#ffe08a' }, rows: TOP_B },
      { id: 'sport-shoes', set: 'sport', type: 'shoes', name: '火焰跑鞋', map: { W: '#ffffff', R: '#ff8c1a', D: '#e56f00' }, rows: SHOE_A },
      { id: 'noble-hat', set: 'noble', type: 'hat', name: '貴族禮帽', map: { K: '#23232b', G: '#f1c40f' }, rows: HAT_TOP },
      { id: 'noble-clothes', set: 'noble', type: 'clothes', name: '貴族西裝', map: { W: '#f8f6f0', B: '#23232b', D: '#101016', G: '#f1c40f' }, rows: TOP_B },
      { id: 'noble-shoes', set: 'noble', type: 'shoes', name: '貴族皮鞋', map: { B: '#23232b', D: '#101016', G: '#f1c40f' }, rows: SHOE_B },
    ];
    GACHA_PARTS.forEach(pt => { SKIN_TEMPLATES[pt.type].push({ name: pt.name, map: pt.map, rows: pt.rows, gacha: pt.id }); });
    const SET_DEFS = {
      star: { name: '🌌 星空學者套', parts: ['star-hat', 'star-clothes', 'star-shoes'], desc: '讀書效率 +15%' },
      sport: { name: '🏃 運動健將套', parts: ['sport-hat', 'sport-clothes', 'sport-shoes'], desc: '通勤時間 −20%' },
      noble: { name: '🎩 貴族學院套', parts: ['noble-hat', 'noble-clothes', 'noble-shoes'], desc: '打工時薪 +25%' },
    };
    function activeSets() {
      const eq = gameState.equippedParts || {};
      const vals = Object.values(eq);
      return Object.keys(SET_DEFS).filter(k => SET_DEFS[k].parts.every(pid => vals.includes(pid)));
    }
    function setStudyMult() { return activeSets().includes('star') ? 1.15 : 1; }
    function setMoveMult() { return activeSets().includes('sport') ? 0.8 : 1; }
    function setWageMult() { return activeSets().includes('noble') ? 1.25 : 1; }
    let gachaTimer = null;
    function drawGacha() {
      if ((gameState.money || 0) < 300) { createFloatingText('❌ 零用錢不夠！轉蛋一次 $300'); return; }
      gameState.money -= 300;
      const ov = document.getElementById('gacha-overlay');
      const stage = document.getElementById('gacha-stage');
      const res = document.getElementById('gacha-result');
      const btn = document.getElementById('btn-gacha-close');
      if (!ov || !stage) return;
      ov.classList.add('active');
      if (btn) btn.style.display = 'none';
      if (res) res.textContent = '';
      const pool = GACHA_PARTS.filter(pt => !(gameState.unlockedParts || []).includes(pt.id));
      const result = pool.length ? { part: pool[Math.floor(Math.random() * pool.length)] } : { money: 150 };
      const emojis = ['🎁', '🧢', '👕', '👟', '⭐', '🎩', '🌌'];
      let n = 0;
      clearInterval(gachaTimer);
      gachaTimer = setInterval(() => {
        stage.textContent = emojis[n % emojis.length];
        stage.style.transform = `scale(${1 + ((n % 3) * 0.12)})`;
        n++;
        if (n > 11) {
          clearInterval(gachaTimer);
          if (result.part) {
            stage.textContent = '🎉';
            if (!gameState.unlockedParts) gameState.unlockedParts = [];
            gameState.unlockedParts.push(result.part.id);
            if (res) res.innerHTML = `抽中限定部件：<b>${result.part.name}</b>！<br><span style="font-size:0.8rem; color:var(--text-muted);">到衣櫃編輯器的範本區套用它，湊滿一套還有加成</span>`;
            playSound('examSuccess');
          } else {
            stage.textContent = '💰';
            gameState.money = (gameState.money || 0) + 150;
            if (res) res.innerHTML = '部件全收集了！殘念獎 <b>$150</b>';
            playSound('levelUp');
          }
          if (btn) btn.style.display = 'inline-block';
          renderGachaBox();
          saveGameData();
          updateUI();
        }
      }, 90);
    }
    function closeGacha() {
      clearInterval(gachaTimer);
      const ov = document.getElementById('gacha-overlay');
      if (ov) ov.classList.remove('active');
    }
    function renderGachaBox() {
      const box = document.getElementById('gacha-status');
      if (!box) return;
      const owned = (gameState.unlockedParts || []).length;
      const act = activeSets();
      const sig = owned + '|' + act.join(',') + '|' + ((gameState.money || 0) >= 300);
      if (box.dataset.sig === sig) return;
      box.dataset.sig = sig;
      const lines = Object.entries(SET_DEFS).map(([k, s]) => {
        const has = s.parts.filter(pid => (gameState.unlockedParts || []).includes(pid)).length;
        return `${s.name}：${has}/3${act.includes(k) ? ` ✅ 生效中（${s.desc}）` : ''}`;
      }).join('<br>');
      box.innerHTML = `已收集部件 ${owned} / ${GACHA_PARTS.length}<br>${lines}`;
    }


    // ================= v9.4 介面重構：主畫面直達 + 面板分頁 =================
    function renderHud() {
      const setW = (id, v) => { const e = document.getElementById(id); if (e) e.style.width = Math.max(0, Math.min(100, v || 0)) + '%'; };
      setW('hud-energy', gameState.energy);
      setW('hud-hunger', gameState.hunger);
      setW('hud-stress', gameState.stress);
      setW('hud-focus', gameState.focus || 0);
      const q = document.getElementById('glance-quest-txt');
      if (q && typeof ensureDailyQuests === 'function') {
        const dq = ensureDailyQuests();
        let done = 0, nextDesc = '';
        dq.ids.forEach(id => {
          const def = DAILY_QUEST_POOL.find(x => x.id === id);
          if (!def) return;
          if (def.prog() >= def.target) done++;
          else if (!nextDesc) nextDesc = def.desc;
        });
        const txt = done + '/3' + (nextDesc ? '・' + nextDesc : (done >= 3 ? '・全完成🎉' : '・進行中'));
        if (q.textContent !== txt) q.textContent = txt;
      }
      const eb = document.getElementById('btn-exam-trigger');
      if (eb && typeof getExamSuccessRate === 'function') {
        const cd = typeof getExamCooldownRemaining === 'function' ? getExamCooldownRemaining() : 0;
        const rate = getExamSuccessRate();
        eb.classList.toggle('exam-hot', cd <= 0 && rate >= 70); // 按鈕文字由 updateExamProgress 統一管理（含成功率）
      }
    }

    // ---------- 面板分頁：把既有內容節點搬進分頁容器（不改任何既有 id/渲染邏輯） ----------
    const SHEET_DEFS = {
      status: [{ key: 'vitals', label: '⚡ 狀態' }, { key: 'quests', label: '📋 任務' }, { key: 'rivals', label: '🏁 宿敵' }, { key: 'subjects', label: '📚 學科' }],
      shop: [{ key: 'items', label: '🛒 道具' }, { key: 'decor', label: '🏠 裝潢' }, { key: 'gacha', label: '🎰 轉蛋' }],
      build: [{ key: 'land', label: '🏛️ 地標' }, { key: 'town', label: '🌸 美化・捐贈' }],
    };
    function topChildOf(body, el) {
      let n = el;
      while (n && n.parentElement !== body) n = n.parentElement;
      return n;
    }
    function setupSheet(drawerId, defs, resolveNodes, leftoverKey) {
      const drawer = document.getElementById('drawer-' + drawerId);
      if (!drawer || drawer.dataset.tabsReady) return;
      drawer.dataset.tabsReady = '1';
      const body = drawer.querySelector('.drawer-body');
      const pages = {};
      defs.forEach((def, i) => {
        const page = document.createElement('div');
        page.className = 'sheet-page' + (i === 0 ? ' active' : '');
        page.dataset.page = def.key;
        pages[def.key] = page;
      });
      const resolved = resolveNodes(body);
      defs.forEach(def => {
        (resolved[def.key] || []).forEach(n => { if (n) pages[def.key].appendChild(n); });
      });
      [...body.children].forEach(n => { if (!Object.values(pages).includes(n)) pages[leftoverKey].appendChild(n); });
      defs.forEach(def => body.appendChild(pages[def.key]));
      const bar = document.createElement('div');
      bar.className = 'sheet-tabs';
      defs.forEach((def, i) => {
        const b = document.createElement('button');
        b.className = 'sheet-tab' + (i === 0 ? ' active' : '');
        b.textContent = def.label;
        b.onclick = () => switchSheetTab(drawerId, def.key);
        bar.appendChild(b);
      });
      drawer.insertBefore(bar, body);
    }
    function switchSheetTab(drawerId, key) {
      const drawer = document.getElementById('drawer-' + drawerId);
      if (!drawer) return;
      drawer.querySelectorAll('.sheet-page').forEach(pg => pg.classList.toggle('active', pg.dataset.page === key));
      const defs = SHEET_DEFS[drawerId] || [];
      drawer.querySelectorAll('.sheet-tab').forEach((tb, i) => tb.classList.toggle('active', defs[i] && defs[i].key === key));
      const body = drawer.querySelector('.drawer-body');
      if (body) body.scrollTop = 0;
    }
    function openSheetTab(drawerId, key) {
      const target = document.getElementById('drawer-' + drawerId);
      if (!target) return;
      if (!target.classList.contains('open')) toggleDrawer(drawerId);
      switchSheetTab(drawerId, key);
    }
    function setupAllSheets() {
      setupSheet('status', SHEET_DEFS.status, (body) => {
        const byId = id => document.getElementById(id);
        const mockBtn = body.querySelector('button[onclick*="openMockExam"]');
        return {
          vitals: [topChildOf(body, byId('bar-energy'))],
          quests: [topChildOf(body, byId('daily-quests-list')), topChildOf(body, byId('weekly-goal-box'))],
          rivals: [topChildOf(body, byId('rivals-list')), mockBtn ? topChildOf(body, mockBtn) : null],
          subjects: [body.querySelector('.academic-section-group')],
        };
      }, 'subjects');
      setupSheet('shop', SHEET_DEFS.shop, (body) => {
        // v9.4.1: 商品卡共用一個清單容器，不能用 topChild（會整包搬走）— 直接搬 .shop-item 本人
        const all = [...body.querySelectorAll('.shop-item')];
        const gachaItem = all.find(it => it.querySelector('#gacha-status'));
        const decorItem = all.find(it => it.querySelector('#decor-status'));
        const items = all.filter(it => it !== gachaItem && it !== decorItem);
        return { items, decor: [decorItem], gacha: [gachaItem] };
      }, 'items');
      setupSheet('build', SHEET_DEFS.build, (body) => {
        const beautyTop = topChildOf(body, document.getElementById('btn-beauty-arch'));
        const donorTop = topChildOf(body, document.getElementById('donor-status'));
        const town = [beautyTop];
        if (donorTop && donorTop !== beautyTop) town.push(donorTop);
        return { land: [topChildOf(body, document.getElementById('build-island-list'))], town };
      }, 'land');
    }
    setupAllSheets();


    // ================= v9.4 說明動畫卡片 =================
    const MANUAL_CARDS = [
      { icon: '🌅', title: '自動作息，你陪他衝', text: '小學霸會自己上學、吃飯、睡覺；你負責在他讀書時陪讀、在關鍵時刻親自下場。', demo: 'walk' },
      { icon: '⚡', title: '狀態都在畫面上', text: '精力・飽足・壓力・專注永遠顯示在畫面最上方，太低就帶他去吃飯、運動、睡覺。', demo: 'bars' },
      { icon: '🫧', title: '陪讀連擊', text: '讀書時點掉身邊的知識泡泡：連擊越高讀書越快，泡泡跑掉連擊就歸零。', demo: 'bubble' },
      { icon: '📝', title: '先模擬考，再升學', text: '每天先打一場 60 秒模擬考拉高成功率，再去參加升學考——學歷越高，零用錢越多。', demo: 'exam' },
      { icon: '🏁', title: '每週競賽拚獎學金', text: '王子傑、陳小葵、高大樹是你的競賽對手：進度即時貼在學校公佈欄，每週五放學結算，前三名有獎學金，冠軍 $150。', demo: 'race' },
      { icon: '🎁', title: '每天回來都有獎', text: '登入獎勵、每週目標、服裝轉蛋集套裝——穿滿一套，讀書／通勤／打工都有加成。', demo: 'gift' },
    ];
    const MANUAL_STATE = {};
    function manualDemoHtml(kind) {
      if (kind === 'walk') return '<span class="dm-side">🏠</span><span class="dm-walker">🚶</span><span class="dm-side">🏫</span><div class="dm-road"></div>';
      if (kind === 'bars') return '<div class="dm-bars"><div class="dm-bar"><span class="f1"></span></div><div class="dm-bar"><span class="f2"></span></div><div class="dm-bar"><span class="f3"></span></div></div>';
      if (kind === 'bubble') return '<span class="dm-bubble">國</span><span class="dm-bubble b2">數</span><span class="dm-bubble b3">英</span>';
      if (kind === 'exam') return '<div class="dm-exam"><div class="dm-exam-bar"><span></span></div><div class="dm-exam-txt">成功率 UP!</div></div>';
      if (kind === 'race') return '<div class="dm-race"><div class="dm-rrow">🧑<span class="dm-rbar"><span class="r1"></span></span></div><div class="dm-rrow">😎<span class="dm-rbar"><span class="r2"></span></span></div></div>';
      return '<span class="dm-gift">🎁</span><span class="dm-spark">✨</span>';
    }
    // v9.11 說明改版（diagram-design 骨架 × 學霸黃）：封面頁 + 六系統頁，卡片分頁不捲動
    const MANUAL_TOTAL = MANUAL_CARDS.length + 1;
    function buildManualCarousel(container, prefix) {
      if (!container) return;
      MANUAL_STATE[prefix] = { idx: 0 };
      const cover = `<section class="manual-page dd-cover"><div class="dd-eyebrow">HOW TO PLAY · 玩法說明<span class="dd-pg">1 / ${MANUAL_TOTAL}</span></div><div class="dd-h1">學霸養成記，<br>你只需要<span class="dd-hl">陪他衝</span>。</div><p class="dd-lede">小學霸會自己過一天：上學、吃飯、讀書、睡覺都自動進行。你的工作只有在關鍵時刻下場 — 其他時間，看著他長大就好。</p><div class="dd-rule"></div><div class="dd-sec"><span class="dd-no">01</span><span class="dd-sec-t">他的一天</span><span class="dd-en">DAILY LOOP</span></div><div class="dd-flow"><div class="dd-node"><div class="dd-emo">🌅</div><div class="dd-lb">起床</div></div><div class="dd-arrow">→</div><div class="dd-node"><div class="dd-emo">🏫</div><div class="dd-lb">上學</div></div><div class="dd-arrow">→</div><div class="dd-node"><div class="dd-emo">🍜</div><div class="dd-lb">吃飯</div></div><div class="dd-arrow">→</div><div class="dd-node focal"><div class="dd-emo">📚</div><div class="dd-lb">讀書</div></div><div class="dd-arrow">→</div><div class="dd-node"><div class="dd-emo">🌙</div><div class="dd-lb">睡覺</div></div></div><div class="dd-callout"><p>讀書<b>放著就會自己慢慢變強</b>；點掉身邊的知識泡泡是額外獎勵，連擊越高、讀得越快。</p></div><div class="dd-cover-foot">共 ${MANUAL_TOTAL} 頁 · 按「下一頁」一頁一頁看</div></section>`;
      const pages = MANUAL_CARDS.map((c, i) => `<section class="manual-page dd-page"><div class="dd-eyebrow">THE SYSTEM · 六件事<span class="dd-pg">${i + 2} / ${MANUAL_TOTAL}</span></div><div class="dd-spacer"></div><div class="dd-demo"><span class="dd-tag">DEMO · ${c.title}</span><div class="manual-demo">${manualDemoHtml(c.demo)}</div></div><div class="manual-card dd-card${i === 0 ? ' focal' : ''}"><div class="dd-top"><span class="dd-num">No.${i + 1}</span><span class="dd-title">${c.title}</span><span class="dd-ico">${c.icon}</span></div><p>${c.text}</p></div><div class="dd-spacer"></div></section>`).join('');
      const dots = Array.from({ length: MANUAL_TOTAL }, (_, i) => `<span class="manual-dot${i === 0 ? ' active' : ''}"></span>`).join('');
      container.innerHTML = `<div class="dd-manual"><div class="manual-viewport dd-viewport"><div class="manual-track" id="${prefix}-track">${cover}${pages}</div></div><div class="dd-nav"><button class="dd-prev" id="${prefix}-prev" onclick="manualMove('${prefix}', -1)" aria-label="上一頁" disabled>‹</button><div class="manual-dots dd-dots" id="${prefix}-dots">${dots}</div><button class="dd-next" id="${prefix}-next" onclick="manualNext('${prefix}')">下一頁 →</button></div></div>`;
    }
    function manualNext(prefix) {
      const st = MANUAL_STATE[prefix];
      if (!st) return;
      playSound('click');
      if (st.idx < MANUAL_TOTAL - 1) { manualGo(prefix, st.idx + 1); return; }
      if (prefix === 'help') closeHelpModal();
      else if (prefix === 'ob') closeOnboarding();
    }
    function manualGo(prefix, i) {
      const st = MANUAL_STATE[prefix];
      if (!st) return;
      st.idx = Math.max(0, Math.min(MANUAL_TOTAL - 1, i));
      const track = document.getElementById(prefix + '-track');
      if (track) track.style.transform = `translateX(-${st.idx * 100}%)`;
      const dots = document.getElementById(prefix + '-dots');
      if (dots) [...dots.children].forEach((d, di) => d.classList.toggle('active', di === st.idx));
      const pv = document.getElementById(prefix + '-prev');
      if (pv) pv.disabled = st.idx === 0;
      const nx = document.getElementById(prefix + '-next');
      if (nx) nx.textContent = st.idx === MANUAL_TOTAL - 1 ? '看完了 ✓' : '下一頁 →';
    }
    function manualMove(prefix, dir) {
      const st = MANUAL_STATE[prefix];
      if (!st) return;
      playSound('click');
      manualGo(prefix, st.idx + dir);
    }
    function setupManuals() {
      const helpModal = document.querySelector('#help-overlay .game-modal');
      if (helpModal && !document.getElementById('help-manual')) {
        const tabs = helpModal.querySelector('.help-tabs');
        const scroller = tabs ? tabs.nextElementSibling : null;
        if (tabs) tabs.remove();
        if (scroller) scroller.remove();
        const wrap = document.createElement('div');
        wrap.id = 'help-manual';
        helpModal.appendChild(wrap);
        buildManualCarousel(wrap, 'help');
      }
      buildManualCarousel(document.getElementById('onboarding-manual'), 'ob');
    }
    setupManuals();
    renderBoard();
