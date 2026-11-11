/* ==========================================================================
   🌆 小鎮世界（R6 拆分自 town.js）：投影裝飾/天空光影/建築外觀 BLD3D/路燈/底板
   載入順序：… → fs → world → ui → main（見 town.js 頭）
   主要符號：TOWN_PROJ, TOWN_PW/PH, buildTownDecor, buildSkyLayer, updateSkyLighting,
   BLD3D, buildExteriors, updateBuildingExteriors, nightFactorAt, warmFactorAt, skyHoles
   ========================================================================== */
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
      const circ = (xp, r, fill, extra) => '<circle cx="' + xp.x.toFixed(1) + '" cy="' + xp.y.toFixed(1) + '" r="' + r + '" fill="' + fill + '"' + (extra || '') + '/>';
      // v9.95 插畫整合：地面層改由核准美術（js/art.js ART_GROUND）進場——底板/草地/路網/地坪/公園/樹木/路燈/道具皆美術稿；
      // 程式續保動態生成：美化三組（worldMutations 切換）＋大樹花季 blossom（季節切換，掛回美術 #big-tree 同位）
      let s = '<g id="town-decor25">' + ART_GROUND;
      // 美化道具組（id/display 與舊版相同，worldMutations 切換）
      let arch = poly([pr.P(1014, 458, 0), pr.P(1023, 458, 0), pr.P(1023, 458, 34), pr.P(1014, 458, 34)], '#a15c72') + poly([pr.P(1077, 458, 0), pr.P(1086, 458, 0), pr.P(1086, 458, 34), pr.P(1077, 458, 34)], '#a15c72');
      const arcPts = [];
      for (let i = 0; i <= 10; i++) { const a = Math.PI - i / 10 * Math.PI; arcPts.push(pr.P(1050 + Math.cos(a) * 42, 458, 34 + Math.sin(a) * 20)); }
      arch += '<polyline points="' + pr.pts(arcPts) + '" fill="none" stroke="#3f9142" stroke-width="6"/>';
      arch += circ(pr.P(1024, 458, 46), 5, '#ffb3c9') + circ(pr.P(1050, 458, 54), 5.6, '#ffd43b') + circ(pr.P(1076, 458, 46), 5, '#ffb3c9');
      s += '<g id="beauty-arch" style="display:none;">' + arch + '</g>';
      let ftn = pr.planeCircle(300, 452, 0, 52, '#aee6fa') + pr.planeCircle(300, 452, 1, 44, '#8fd8ff');
      ftn += poly([pr.P(294, 452, 0), pr.P(306, 452, 0), pr.P(306, 452, 36), pr.P(294, 452, 36)], '#e8d8ee');
      ftn += circ(pr.P(300, 452, 38), 6, '#fff5f9');
      const spray = (x2, z2, h2, cls) => '<polyline class="beauty-spray ' + cls + '" points="' + pr.pts([pr.P(300, 452, 40), pr.P(x2, z2, h2), pr.P(x2 + (x2 < 300 ? -8 : 8), z2, h2 - 14)]) + '" fill="none" stroke="#aee6fa" stroke-width="3"/>';
      ftn += spray(282, 440, 56, '') + spray(300, 436, 62, 's2') + spray(318, 440, 56, 's3');
      s += '<g id="beauty-fountain" style="display:none;">' + ftn + '</g>';
      let stat = pr.box3(682, 402, 36, 14, 20, '#e8d8ee') + pr.box3(678, 400, 44, 16, 6, '#e8d8ee');
      stat += poly([pr.P(692, 404, 20), pr.P(708, 404, 20), pr.P(708, 404, 50), pr.P(692, 404, 50)], '#ffd43b');
      stat += circ(pr.P(700, 404, 56), 8, '#f0a832');
      stat += poly([pr.P(688, 404, 62), pr.P(712, 404, 62), pr.P(712, 404, 66), pr.P(688, 404, 66)], '#1a1a24');
      s += '<g id="beauty-statue" style="display:none;">' + stat + '</g>';
      s += '</g>';
      svg.setAttribute('viewBox', '0 0 ' + TOWN_PW + ' ' + TOWN_PH);
      svg.innerHTML = s;
      const bt = svg.querySelector('#big-tree');
      if (bt) {
        const bl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        bl.id = 'big-tree-blossom'; bl.setAttribute('style', 'display:none;');
        bl.innerHTML = circ(pr.P(548, 448, 98), 12, 'rgba(255,183,213,0.85)') + circ(pr.P(602, 448, 106), 10, 'rgba(255,183,213,0.85)') + circ(pr.P(575, 448, 82), 11, 'rgba(255,183,213,0.8)') + circ(pr.P(622, 448, 84), 8, 'rgba(255,183,213,0.8)') + circ(pr.P(528, 448, 84), 8, 'rgba(255,183,213,0.8)');
        bt.appendChild(bl);
      }
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
      home: { fx: 123, fz: 76, fw: 150, fd: 95, floors: 2, wall: '#ffe9f4', accent: '#ff8fab', roof: 'gable', winRows: [1, 2], doorX: 198, pos: [177.6, 190.5] },
      store: { fx: 491, fz: 73, fw: 160, fd: 100, floors: 1, wall: '#eef4fb', accent: '#2fd48c', roof: 'signband', glass: true, sign: '便利商店', doorX: 571, pos: [559.5, 190.5], winW: 40, winH: 34 },
      restaurant: { fx: 871, fz: 73, fw: 160, fd: 100, floors: 1, wall: '#f7e8e0', accent: '#ff5d8f', roof: 'flat', sign: '餐廳', doorX: 951, pos: [946.5, 190.5] },
      school: { fx: 98, fz: 556, fw: 185, fd: 115, floors: 3, wall: '#ece5d3', accent: '#6ec3ff', roof: 'flat', sign: '學霸高中', winRows: [5, 3, 2], tower: true, bell: true, doorX: 198, pos: [475.5, 422.5] },
      library: { fx: 488, fz: 561, fw: 165, fd: 105, floors: 1, wall: '#e6efe4', accent: '#b79ced', roof: 'flat', sign: '圖書館', doorX: 571, pos: [855.5, 422.5] },
      gym: { fx: 898, fz: 516, fw: 120, fd: 40, floors: 1, wall: '#f0e6da', accent: '#ffd43b', roof: 'flat', doorX: 958, pos: [1237.6, 422.5], overlay: true, holeRect: [1235.6, 420.5, 202.8, 133.5] }
    };
    function bldHeight(b) { return b.floors * BLD_FLOOR_H + (b.roof === 'gable' ? 36 : 9); }
    function segBox(pr, x, z, w, d, h0, h1, color, withTop) {
      const P = pr.P, pts = pr.pts, sh = PROJ.shade;
      let out = '<polygon points="' + pts([P(x + w, z, h0), P(x + w, z + d, h0), P(x + w, z + d, h1), P(x + w, z, h1)]) + '" fill="' + sh(color, 0.6) + '" stroke="#7c4a63" stroke-width="2" stroke-linejoin="round"/>';
      out += '<polygon points="' + pts([P(x, z + d, h0), P(x + w, z + d, h0), P(x + w, z + d, h1), P(x, z + d, h1)]) + '" fill="' + color + '" stroke="#7c4a63" stroke-width="2" stroke-linejoin="round"/>';
      if (withTop) out += '<polygon points="' + pts([P(x, z, h1), P(x + w, z, h1), P(x + w, z + d, h1), P(x, z + d, h1)]) + '" fill="' + sh(color, 1.24) + '"/>';
      return out;
    }
    function buildExteriors() {
      for (const loc in BLD3D) {
        const isl = document.getElementById('landmark-' + loc);
        if (!isl || isl.querySelector('.bld-ext')) continue;
        const b = BLD3D[loc];
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'bld-ext'); svg.setAttribute('data-loc', loc); svg.setAttribute('aria-hidden', 'true');
        // v9.95 插畫整合：公式生成外觀退場，改核准美術建築組（全圖座標）以島原點（b.pos，舊生成投影同原點）偏移嵌入；
        // 組內 data-part 分層（side 西牆/front 前臉/roof/feat)與逐棟識別物皆在 js/art.js，inside-now/淡化由 updateBuildingExteriors 照舊作用於本 svg
        svg.innerHTML = '<g transform="translate(' + (-b.pos[0]) + ',' + (-b.pos[1]) + ')">' + (ART_BLD[loc] || '') + '</g>';
        isl.appendChild(svg);
        if (!b.overlay) {
          isl.classList.add('ext-mode');
          const host = isl.querySelector('.island-mount-top');
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
    // v9.64 夜間挖孔 = 新外觀剪影（BLD3D 規格直算，不再量島框）
    let _skyHolesCache = null;
    function skyHoles() {
      if (_skyHolesCache) return _skyHolesCache;
      const out = {};
      for (const k in BLD3D) {
        const b = BLD3D[k];
        let r;
        if (b.holeRect) { r = b.holeRect.slice(); }
        else {
          const H = bldHeight(b);
          const x0 = TOWN_PROJ.P(b.fx, b.fz, 0).x - 2, x1 = TOWN_PROJ.P(b.fx + b.fw, b.fz + b.fd, 0).x + 2;
          const y0 = TOWN_PROJ.P(b.fx, b.fz, H).y - 2, y1 = TOWN_PROJ.P(b.fx, b.fz + b.fd, 0).y + 2;
          r = [Math.round(x0 * 10) / 10, Math.round(y0 * 10) / 10, Math.round((x1 - x0) * 10) / 10, Math.round((y1 - y0) * 10) / 10];
        }
        // v9.95 插畫剪影涵蓋：挖孔與美術 bbox（js/art.js ART_BBOX，含西牆/鐘塔/浮空名牌）聯集，留 3 單位邊
        if (typeof ART_BBOX !== 'undefined' && ART_BBOX[k]) {
          const bb = ART_BBOX[k];
          const nx0 = Math.min(r[0], bb[0] - 3), ny0 = Math.min(r[1], bb[1] - 3);
          const nx1 = Math.max(r[0] + r[2], bb[2] + 3), ny1 = Math.max(r[1] + r[3], bb[3] + 3);
          r = [Math.round(nx0 * 10) / 10, Math.round(ny0 * 10) / 10, Math.round((nx1 - nx0) * 10) / 10, Math.round((ny1 - ny0) * 10) / 10];
        }
        out[k] = r;
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
