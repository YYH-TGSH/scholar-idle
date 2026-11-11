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
      const quad = (x, z, w, d, fill, extra) => poly([pr.P(x, z, 0), pr.P(x + w, z, 0), pr.P(x + w, z + d, 0), pr.P(x, z + d, 0)], fill, extra);
      const seg = (a, b, stroke, w, extra) => '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" stroke="' + stroke + '" stroke-width="' + w + '"' + (extra || '') + '/>';
      const circ = (xp, r, fill, extra) => '<circle cx="' + xp.x.toFixed(1) + '" cy="' + xp.y.toFixed(1) + '" r="' + r + '" fill="' + fill + '"' + (extra || '') + '/>';
      let s = '<defs><pattern id="grassPat" width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill="#a5e8b5"/><rect width="24" height="24" fill="#7ede8f"/><rect x="24" y="24" width="24" height="24" fill="#7ede8f"/></pattern><pattern id="parkPat" width="48" height="48" patternUnits="userSpaceOnUse"><rect width="48" height="48" fill="#8fe3a8"/><rect x="24" y="24" width="24" height="24" fill="#5ec96f"/><rect width="24" height="24" fill="#5ec96f"/></pattern></defs>';
      s += '<g id="town-decor25">';
      // R2 模型底板：世界唯一的模型板（木邊只在世界邊界）——接地影/木側/木面三層，草地蓋內圈留木 Rim
      {
        const bp = [[-30, -30], [1180, -30], [1180, 950], [-30, 950]].map(([x, z]) => pr.P(x, z, 0));
        const ptsOf = (pts, dx, dy) => pts.map(p => (p.x + dx).toFixed(1) + ',' + (p.y + dy).toFixed(1)).join(' ');
        s += '<g id="town-baseplate"><polygon points="' + ptsOf(bp, 14, 18) + '" fill="rgba(92,46,62,0.16)"/><polygon points="' + ptsOf(bp, 0, 13) + '" fill="#a9714b"/><polygon points="' + ptsOf(bp, 0, 0) + '" fill="#dfa06b"/></g>';
      }
      // 地面＋公園帶
      s += quad(0, 0, 1150, 920, 'url(#grassPat)');
      s += quad(0, 336, 1150, 184, 'url(#parkPat)');
      // 巷道＋人行道＋A/B 街（路網邏輯不動，形狀走投影）
      s += quad(0, 254, 56, 566, '#a5b8e8') + quad(1094, 254, 56, 566, '#a5b8e8');
      [360, 450, 540, 630, 720].forEach(z => { s += quad(24, z, 7, 40, '#ffffff') + quad(1118, z, 7, 40, '#ffffff'); });
      s += quad(0, 224, 1150, 30, '#dcebf5') + quad(0, 254, 1150, 76, '#a5b8e8');
      s += quad(0, 714, 1150, 30, '#dcebf5') + quad(0, 744, 1150, 76, '#a5b8e8');
      s += seg(pr.P(0, 256, 0), pr.P(1150, 256, 0), 'rgba(245,242,228,0.5)', 3) + seg(pr.P(0, 327, 0), pr.P(1150, 327, 0), 'rgba(245,242,228,0.5)', 3);
      s += seg(pr.P(0, 746, 0), pr.P(1150, 746, 0), 'rgba(245,242,228,0.5)', 3) + seg(pr.P(0, 817, 0), pr.P(1150, 817, 0), 'rgba(245,242,228,0.5)', 3);
      for (let x = 10; x < 1150; x += 110) { s += quad(x, 288, 46, 7, '#ffffff') + quad(x, 778, 46, 7, '#ffffff'); }
      // 六棟基座（投影 box3 地台）＋門前小徑
      const PLOTS = [[42, 16, 312, 215, '#dcebf5'], [422, 16, 298, 215, '#e8d8ee'], [802, 16, 298, 215, '#ffe9a8'], [42, 506, 298, 215, '#ffeef7'], [422, 506, 298, 215, '#dcebf5'], [802, 506, 312, 215, '#d9a066']];
      PLOTS.forEach(([px, pz, pw, pd, col]) => { s += quad(px - 6, pz + pd + 2, pw + 12, 14, 'rgba(24,32,66,0.10)'); s += pr.box3(px - 4, pz - 4, pw + 8, pd + 8, 20, col); }); // v9.62 牆根接地陰影：建築不再像貼紙浮在草地上
      [[181, 196], [554, 196], [934, 196], [181, 676], [554, 676], [941, 676]].forEach(([dx, dz]) => { s += quad(dx, dz, 34, 48, '#ffe9f4', ' stroke="#e8d8ee" stroke-width="2"'); });
      // 公園：池塘＋小徑（曲線取樣投影）＋長椅＋花圃
      s += pr.planeCircle(250, 428, 0, 118, '#8fd8ff');
      s += pr.planeCircle(250, 424, 0, 104, '#8fd8ff');
      const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
      const pathPts = [];
      for (let i = 0; i <= 12; i++) { const [bx, bz] = bez([0, 478], [300, 442], [600, 502], [900, 464], i / 12); pathPts.push(pr.P(bx, bz, 0)); }
      for (let i = 1; i <= 8; i++) { const [bx, bz] = bez([900, 464], [1200, 426], [1150, 472], [1150, 472], i / 8); pathPts.push(pr.P(bx, bz, 0)); }
      s += '<polyline points="' + pr.pts(pathPts) + '" fill="none" stroke="#ffe9a8" stroke-width="26" stroke-linecap="round"/>';
      [[430, 352], [700, 352], [430, 486], [700, 486]].forEach(([bx, bz]) => { s += pr.box3(bx, bz, 46, 9, 7, '#d98a68'); });
      const flower = (fx, fz) => circ(pr.P(fx, fz, 2), 3.5, '#ffb3c9') + circ(pr.P(fx + 12, fz + 3, 2), 3, '#ffcf5c') + circ(pr.P(fx + 24, fz, 2), 3.5, '#e8d8ee');
      [60, 380, 560, 900, 1060].forEach(fx => { s += flower(fx, 356); });
      [120, 620, 960].forEach(fx => { s += flower(fx, 496); });
      // 樹木（立牌：樹幹＋樹冠 billboard，落點/影走投影）
      const tree = (cx, cz, th, r) => {
        let o = pr.groundShadow(cx, cz, r * 0.55);
        o += seg(pr.P(cx, cz, 0), pr.P(cx, cz, th), '#a15c72', 4);
        o += circ(pr.P(cx, cz, th + 13), r, '#5ec96f') + circ(pr.P(cx - r * 0.62, cz, th + 6), r * 0.62, '#8fe3a8') + circ(pr.P(cx + r * 0.62, cz, th + 6), r * 0.62, '#5ec96f');
        return o;
      };
      s += tree(430, 483, 21, 24) + tree(880, 410, 18, 21) + tree(1064, 490, 22, 25) + tree(180, 905, 21, 24) + tree(600, 914, 18, 21) + tree(990, 907, 23, 26);
      const pine = (cx, cz) => seg(pr.P(cx, cz, 0), pr.P(cx, cz, 16), '#a15c72', 4)
        + poly([pr.P(cx - 11, cz, 14), pr.P(cx + 11, cz, 14), pr.P(cx, cz, 32)], '#3f9142')
        + poly([pr.P(cx - 9, cz, 26), pr.P(cx + 9, cz, 26), pr.P(cx, cz, 44)], '#5ec96f');
      s += pine(60, 420) + pine(814, 910);
      // 地標大樹（id 保留：花季切換）
      let bt = pr.groundShadow(575, 448, 30);
      bt += poly([pr.P(569, 448, 0), pr.P(581, 448, 0), pr.P(581, 448, 48), pr.P(569, 448, 48)], '#a15c72');
      bt += seg(pr.P(575, 448, 34), pr.P(575, 448, 48), '#a15c72', 4);
      bt += circ(pr.P(575, 448, 82), 46, '#5ec96f') + circ(pr.P(536, 448, 66), 30, '#8fe3a8') + circ(pr.P(614, 448, 66), 30, '#5ec96f') + circ(pr.P(575, 448, 114), 27, '#8fe3a8');
      bt += '<g id="big-tree-blossom" style="display:none;">' + circ(pr.P(548, 448, 98), 12, 'rgba(255,183,213,0.85)') + circ(pr.P(602, 448, 106), 10, 'rgba(255,183,213,0.85)') + circ(pr.P(575, 448, 82), 11, 'rgba(255,183,213,0.8)') + circ(pr.P(622, 448, 84), 8, 'rgba(255,183,213,0.8)') + circ(pr.P(528, 448, 84), 8, 'rgba(255,183,213,0.8)') + '</g>';
      bt += seg(pr.P(608, 448, 64), pr.P(608, 448, 44), '#a15c72', 2);
      bt += quad(598, 446, 20, 4, '#d98a68');
      s += '<g id="big-tree">' + bt + '</g>';
      // 路燈（柱＋頭，光池在 street-glows 層）
      const lamp = (lx, lz) => seg(pr.P(lx, lz, 0), pr.P(lx, lz, 24), '#4a4a55', 4) + circ(pr.P(lx, lz, 27), 6, '#ffe9a8', ' stroke="#4a4a55" stroke-width="2"');
      [180, 480, 780, 1080].forEach(lx => { s += lamp(lx, 344); });
      [270, 660, 1050].forEach(lx => { s += lamp(lx, 722); });
      // 道具：郵筒/告示牌/腳踏車/販賣機
      s += pr.box3(86, 352, 16, 12, 20, '#ff5d8f');
      const mslot = pr.P(89, 364.6, 14); s += '<rect x="' + mslot.x.toFixed(1) + '" y="' + mslot.y.toFixed(1) + '" width="10" height="4" fill="#fffdf5"/>';
      s += pr.box3(1006, 350, 30, 6, 22, '#f5f0e6');
      s += poly([pr.P(1010, 356.5, 11), pr.P(1032, 356.5, 11), pr.P(1032, 356.5, 14), pr.P(1010, 356.5, 14)], '#ff5d8f');
      s += poly([pr.P(1010, 356.5, 17), pr.P(1032, 356.5, 17), pr.P(1032, 356.5, 20), pr.P(1010, 356.5, 20)], '#b8a6c9');
      const w1 = pr.P(634, 253, 5), w2 = pr.P(646, 253, 5);
      s += '<circle cx="' + w1.x.toFixed(1) + '" cy="' + w1.y.toFixed(1) + '" r="5" fill="none" stroke="#7c4a63" stroke-width="2"/><circle cx="' + w2.x.toFixed(1) + '" cy="' + w2.y.toFixed(1) + '" r="5" fill="none" stroke="#26324b" stroke-width="2"/>';
      s += seg(pr.P(634, 253, 5), pr.P(640, 253, 14), '#ff5d8f', 2) + seg(pr.P(640, 253, 14), pr.P(646, 253, 5), '#ff5d8f', 2);
      s += pr.box3(1082, 676, 20, 14, 40, '#ffeef7');
      s += poly([pr.P(1085, 690.5, 20), pr.P(1099, 690.5, 20), pr.P(1099, 690.5, 36), pr.P(1085, 690.5, 36)], '#8fd8ff');
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
      school: { fx: 98, fz: 556, fw: 185, fd: 115, floors: 3, wall: '#ece5d3', accent: '#6ec3ff', roof: 'flat', sign: '台東女中', winRows: [5, 3, 2], tower: true, bell: true, doorX: 198, pos: [475.5, 422.5] },
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
        const pr = PROJ.make(PROJ.K_TOWN, 8 - b.pos[0], 215 - b.pos[1]);
        const P = pr.P, pts = pr.pts, sh = PROJ.shade, FH = BLD_FLOOR_H, H = b.floors * FH;
        // R2.5 正面主導微縮文法：前臉（南面）完整主導、東面壓縮至真投影深度 38%、屋頂板/斜頂帶出簷
        const DEPTH_K = 0.38;
        const fdE = Math.max(16, Math.round(b.fd * DEPTH_K));
        const zB = b.fz + b.fd - fdE; // 背面 z（前臉平面 fz+fd 不變，佔地/門位/PLOT 不動）
        function faces(x, z, w, d, h0, h1, color, top) {
          return {
            east: '<polygon points="' + pts([P(x + w, z, h0), P(x + w, z + d, h0), P(x + w, z + d, h1), P(x + w, z, h1)]) + '" fill="' + sh(color, 0.6) + '" stroke="#7c4a63" stroke-width="2" stroke-linejoin="round"/>',
            south: '<polygon points="' + pts([P(x, z + d, h0), P(x + w, z + d, h0), P(x + w, z + d, h1), P(x, z + d, h1)]) + '" fill="' + color + '" stroke="#7c4a63" stroke-width="2" stroke-linejoin="round"/>',
            top: top ? '<polygon points="' + pts([P(x, z, h1), P(x + w, z, h1), P(x + w, z + d, h1), P(x, z + d, h1)]) + '" fill="' + sh(color, 1.24) + '"/>' : ''
          };
        }
        let g = '';
        g += '<polygon points="' + pts([P(b.fx + 7, b.fz + 4, 0), P(b.fx + b.fw + 7, b.fz + 4, 0), P(b.fx + b.fw + 7, b.fz + b.fd + 4, 0), P(b.fx + 7, b.fz + b.fd + 4, 0)]) + '" fill="rgba(92,46,62,0.16)"/>';
        let S = '', E = '', R = '', F = '';
        const sx0 = P(b.fx, b.fz + b.fd, 0).x, sx1 = P(b.fx + b.fw, b.fz + b.fd, 0).x;
        const doorCx = P(b.doorX, b.fz + b.fd, 0).x, groundY = P(b.fx, b.fz + b.fd, 0).y;
        if (loc === 'gym') {
          // 操場：球場線場地（平面模型）＋奶油黃器材室小模型
          const court = faces(836, 566, 216, 118, 0, 4, '#7ede8f', true);
          E += court.east; S += court.south;
          let lines = '<polygon points="' + pts([P(848, 576, 4), P(1040, 576, 4), P(1040, 674, 4), P(848, 674, 4)]) + '" fill="none" stroke="#ffffff" stroke-width="3"/>';
          lines += '<line x1="' + P(944, 578, 4).x.toFixed(1) + '" y1="' + P(944, 578, 4).y.toFixed(1) + '" x2="' + P(944, 672, 4).x.toFixed(1) + '" y2="' + P(944, 672, 4).y.toFixed(1) + '" stroke="#ffffff" stroke-width="3"/>';
          const circ = [];
          for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2; circ.push(P(944 + Math.cos(t) * 26, 625 + Math.sin(t) * 17, 4)); }
          lines += '<polygon points="' + pts(circ) + '" fill="none" stroke="#ffffff" stroke-width="3"/>';
          R += court.top + lines;
          const shedH = 62;
          const shed = faces(b.fx, b.fz + b.fd - fdE, b.fw, fdE, 0, shedH, b.wall, false);
          E += shed.east; S += shed.south;
          const slab = faces(b.fx - 4, b.fz + b.fd - fdE - 4, b.fw + 8, fdE + 8, shedH, shedH + 8, b.accent, true);
          E += slab.east; S += slab.south; R += slab.top;
          S += '<rect x="' + (doorCx - 15).toFixed(1) + '" y="' + (groundY - 40).toFixed(1) + '" width="30" height="40" fill="' + sh(b.accent, 0.62) + '" stroke="#7c4a63" stroke-width="2"/>';
          g += '<g data-part="side">' + E + '</g><g data-part="front">' + S + '</g><g data-part="court">' + R + '</g>';
        } else {
          for (let f = 0; f < b.floors; f++) {
            if (f > 0) { const band = faces(b.fx - 3, zB - 3, b.fw + 6, fdE + 6, f * FH - 3, f * FH + 3, sh(b.accent, 0.8), false); S += band.south; E += band.east; }
            const body = faces(b.fx, zB, b.fw, fdE, f * FH, (f + 1) * FH, b.wall, false); S += body.south; E += body.east;
          }
          const winW = b.winW || 20, winH = b.winH || 26;
          const nWin = b.fw >= 170 ? 5 : (b.fw >= 150 ? 4 : 3);
          for (let f = 0; f < b.floors; f++) {
            const wy = P(b.fx, b.fz + b.fd, f * FH + 30).y;
            if (b.glass && f === 0) {
              S += '<rect x="' + (sx0 + 14).toFixed(1) + '" y="' + (groundY - 62).toFixed(1) + '" width="' + (sx1 - sx0 - 92).toFixed(1) + '" height="56" fill="#aee6fa" opacity="0.92" stroke="#7c4a63" stroke-width="2"/>';
              S += '<line x1="' + ((sx0 + sx1) / 2 - 14).toFixed(1) + '" y1="' + (groundY - 62).toFixed(1) + '" x2="' + ((sx0 + sx1) / 2 - 14).toFixed(1) + '" y2="' + (groundY - 6).toFixed(1) + '" stroke="#7c4a63" stroke-width="1.5"/>';
              continue;
            }
            const cnt = (b.winRows && b.winRows[f] != null) ? b.winRows[f] : nWin;
            for (let i = 0; i < cnt; i++) {
              const wx = cnt === 1 ? sx0 + (sx1 - sx0) * 0.25 - winW / 2 : sx0 + 16 + i * ((sx1 - sx0 - 32 - winW) / (cnt - 1)); // 單窗靠左上構圖（對照施工圖住家一樓窗位，避門跳過規則）
              if (f === 0 && Math.abs(wx + winW / 2 - doorCx) < 30) continue;
              S += '<rect x="' + wx.toFixed(1) + '" y="' + (wy - winH).toFixed(1) + '" width="' + winW + '" height="' + winH + '" fill="#fff3d6" stroke="#7c4a63" stroke-width="1.5"/>';
            }
          }
        S += '<rect x="' + (doorCx - 17).toFixed(1) + '" y="' + (groundY - 44).toFixed(1) + '" width="34" height="44" fill="' + sh(b.accent, 0.62) + '" stroke="#7c4a63" stroke-width="2"/><circle cx="' + (doorCx + 7).toFixed(1) + '" cy="' + (groundY - 21).toFixed(1) + '" r="2.2" fill="#ffd43b"/>';
          if (loc === 'home') {
            F += '<circle cx="' + doorCx.toFixed(1) + '" cy="' + (groundY - 60).toFixed(1) + '" r="11" fill="#ff8fab" stroke="#7c4a63" stroke-width="1.5"/><text x="' + doorCx.toFixed(1) + '" y="' + (groundY - 59).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="11" fill="#ffffff">♥</text>';
          }
          if (loc === 'library') {
            F += '<circle cx="' + doorCx.toFixed(1) + '" cy="' + (groundY - 62).toFixed(1) + '" r="12" fill="#ffd43b" stroke="#7c4a63" stroke-width="1.5"/><use href="#i-book" x="' + (doorCx - 9).toFixed(1) + '" y="' + (groundY - 71).toFixed(1) + '" width="18" height="18"/>';
          }
          if (loc === 'school') {
            const ccx = (sx0 + sx1) / 2, ccy = P(b.fx, b.fz + b.fd, H - 46).y;
            F += '<g data-clock="1"><circle cx="' + ccx.toFixed(1) + '" cy="' + ccy.toFixed(1) + '" r="13" fill="#ffffff" stroke="#7c4a63" stroke-width="2"/><line x1="' + ccx.toFixed(1) + '" y1="' + ccy.toFixed(1) + '" x2="' + ccx.toFixed(1) + '" y2="' + (ccy - 8).toFixed(1) + '" stroke="#5c2e3e" stroke-width="2"/><line x1="' + ccx.toFixed(1) + '" y1="' + ccy.toFixed(1) + '" x2="' + (ccx + 6).toFixed(1) + '" y2="' + (ccy + 3).toFixed(1) + '" stroke="#5c2e3e" stroke-width="2"/></g>';
          }
          if (loc === 'restaurant') {
            const ay0 = P(b.fx, b.fz + b.fd, 68).y, ay1 = P(b.fx, b.fz + b.fd, 52).y;
            for (let x = sx0 - 2, k = 0; x < sx1 + 2; x += 16, k++) {
              F += '<rect x="' + x.toFixed(1) + '" y="' + ay0.toFixed(1) + '" width="' + Math.min(16, sx1 + 2 - x).toFixed(1) + '" height="' + (ay1 - ay0).toFixed(1) + '" fill="' + (k % 2 ? '#ffffff' : '#ff8fab') + '"/>';
            }
            E += '<polygon points="' + pts([P(b.fx + b.fw + 2, b.fz + b.fd, 52), P(b.fx + b.fw + 2, b.fz + b.fd, 68), P(b.fx + b.fw + 2, zB + 8, 68), P(b.fx + b.fw + 2, zB + 8, 52)]) + '" fill="' + sh('#ff8fab', 0.6) + '"/>';
            const chim = faces(b.fx + b.fw - 36, zB + 4, 15, 13, H + 9, H + 32, '#e8906f', true);
            E += chim.east; R += chim.south + chim.top;
            const smk = P(b.fx + b.fw - 28, zB + 10, H + 42);
            R += '<circle cx="' + smk.x.toFixed(1) + '" cy="' + smk.y.toFixed(1) + '" r="6" fill="#ffffff" opacity="0.75"/>';
          }
          if (b.roof === 'gable') {
            const rc = '#ff5d8f', midZ = zB + fdE / 2, apex = P(b.fx + b.fw / 2, midZ, H + 36);
            R += '<polygon points="' + pts([P(b.fx - 6, b.fz + b.fd + 6, H), P(b.fx + b.fw + 6, b.fz + b.fd + 6, H), apex]) + '" fill="' + sh(rc, 0.92) + '" stroke="#7c4a63" stroke-width="2" stroke-linejoin="round"/>';
            R += '<polygon points="' + pts([P(b.fx - 6, b.fz + b.fd + 6, H), P(b.fx + b.fw + 6, b.fz + b.fd + 6, H), P(b.fx + b.fw + 6, midZ, H + 36), P(b.fx - 6, midZ, H + 36)]) + '" fill="' + rc + '" stroke="#7c4a63" stroke-width="2" stroke-linejoin="round"/>';
            R += '<polygon points="' + pts([P(b.fx + b.fw + 6, b.fz + b.fd + 6, H), P(b.fx + b.fw + 6, zB - 6, H), P(b.fx + b.fw + 6, midZ, H + 36)]) + '" fill="' + sh(rc, 0.6) + '" stroke="#7c4a63" stroke-width="2" stroke-linejoin="round"/>';
          } else if (b.roof === 'signband') {
            const band = faces(b.fx - 4, zB - 4, b.fw + 8, fdE + 8, H - 30, H, b.accent, true);
            R += '<g class="bld-sign">' + band.east + band.south + band.top + '</g>';
            const bx0 = P(b.fx - 4, b.fz + b.fd + 4, 0).x, bx1 = P(b.fx + b.fw + 4, b.fz + b.fd + 4, 0).x, byC = P(b.fx, b.fz + b.fd + 4, H - 15).y;
            R += '<text x="' + ((bx0 + bx1) / 2).toFixed(1) + '" y="' + byC.toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="700" fill="#ffffff">超商 24H</text>';
          } else {
            const slab = faces(b.fx - 4, zB - 4, b.fw + 8, fdE + 8, H, H + 9, b.wall, true);
            E += slab.east; S += slab.south; R += slab.top;
            if (b.tower) {
              const tw = faces(b.fx + b.fw - 52, zB + 8, 30, 26, H + 9, H + 42, '#5b7fa6', false);
              E += tw.east; S += tw.south;
              const cap = faces(b.fx + b.fw - 55, zB + 5, 36, 32, H + 42, H + 47, '#7d8fc9', true);
              E += cap.east; S += cap.south; R += cap.top;
            }
          if (b.sign) {
            const sw2 = b.sign.length * 19 + 26, scx = P(b.fx + b.fw / 2, b.fz + b.fd + 4, 0).x, stopY = P(b.fx, b.fz + b.fd + 4, H + 9).y;
            F += '<rect x="' + (scx + 6).toFixed(1) + '" y="' + (stopY - 8).toFixed(1) + '" width="4" height="8" fill="#7c4a63"/><rect x="' + (scx + sw2 - 10).toFixed(1) + '" y="' + (stopY - 8).toFixed(1) + '" width="4" height="8" fill="#7c4a63"/>';
            F += '<rect x="' + scx.toFixed(1) + '" y="' + (stopY - 32).toFixed(1) + '" width="' + sw2 + '" height="24" fill="' + b.accent + '" stroke="#7c4a63" stroke-width="1.5"/>';
            F += '<text x="' + (scx + sw2 / 2).toFixed(1) + '" y="' + (stopY - 20).toFixed(1) + '" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="700" fill="#5c2e3e" stroke="#ffffff" stroke-width="3.5" paint-order="stroke" stroke-linejoin="round">' + b.sign + '</text>';
          }
          }
        if (b.bell) {
          const bx = P(b.fx + b.fw - 37, b.fz + b.fd, 0).x - 10, by = P(b.fx, b.fz + b.fd, H + 16).y;
          F += '<g id="school-bell"><use href="#i-bell" x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="20" height="20"/></g>';
        }
          const sideW = (P(b.fx + b.fw, b.fz + b.fd, 0).x - P(b.fx + b.fw, zB, 0).x).toFixed(1);
          g += '<g data-part="side" data-sw="' + sideW + '">' + E + '</g><g data-part="front">' + S + '</g><g data-part="roof">' + R + '</g><g data-part="feat">' + F + '</g>';
        }
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'bld-ext'); svg.setAttribute('data-loc', loc); svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = g;
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
