/* ==========================================================================
   🏠 室內場景（R6 拆分自 town.js）：九場景 builder/ensure/pan/updateStage＋模型盒殼與裝飾包
   載入順序：… → npc → interiors → fs → …（見 town.js 頭）
   主要符號：roomShell, sceneDecor, floorBands, build*RoomsHTML, ensure*Interior,
   apply*Pan, update*Stage, HOME_PROJ/STORE_PROJ/SCHOOL_PROJ/GYM_PROJ/LIB/CLUB/STUDY/REST_PROJ
   ========================================================================== */
    // 晚餐桌足跡 (597,168,116x30,h14)：爸媽座 z162 在北緣之北 6（frontHMax(6,25,6)=21.3）、主角座 z208 在南緣之南 10。
    const HOME_PROJ = PROJ.makeIndoor(PROJ.K_INDOOR, 24, 172); // v9.67 室內 45°
    const HOME_PW = 1340;
    PROJ.registerRooms('home-rooms', HOME_PROJ);
    // v9.62 地面密度定版：地板 pattern 產生器（聖經：大面積地面不准純色——交錯帶/棋盤以低對比鋪滿）
    function floorBands(pr, poly, tone, op, band, x0, x1, z0, z1) { let o = '<g class="floor-pat">'; for (let z = z0, i = 0; z < z1; z += band, i++) { if (i % 2) o += poly([pr.P(x0, z, 0), pr.P(x1, z, 0), pr.P(x1, Math.min(z + band, z1), 0), pr.P(x0, Math.min(z + band, z1), 0)], tone, ' fill-opacity="' + op + '"'); } return o + '</g>'; }

    // R3 模型盒殼：牆頂蓋（牆厚切面）＋踢腳板＋地板 slab 緣——九場景共用，讓室內讀作開口模型盒
    function roomShell(pr, WH, D) {
      const P = pr.P, pts = pr.pts;
      const poly = (l, f, e) => '<polygon points="' + pts(l) + '" fill="' + f + '"' + (e || '') + '/>';
      let o = '<g class="room-shell">';
      o += poly([P(0, D - 9, 0), P(1150, D - 9, 0), P(1150, D, 0), P(0, D, 0)], '#c98d64');
      o += poly([P(1141, 0, 0), P(1150, 0, 0), P(1150, D, 0), P(1141, D, 0)], '#a9714b');
      if (WH > 0) {
        o += poly([P(0, 1.5, 0), P(1150, 1.5, 0), P(1150, 1.5, 11), P(0, 1.5, 11)], 'rgba(124,74,99,0.55)');
        o += poly([P(0, 0, WH), P(1150, 0, WH), P(1150, 7, WH), P(0, 7, WH)], '#ffffff');
        o += poly([P(0, 7, WH), P(1150, 7, WH), P(1150, 7, WH - 7), P(0, 7, WH - 7)], 'rgba(124,74,99,0.35)');
        o += poly([P(1143, 0, WH), P(1150, 0, WH), P(1150, D, WH), P(1143, D, WH)], 'rgba(255,255,255,0.7)');
      }
      return o + '</g>';
    }
    // R3 場景裝飾包：每室牆面×2＋軟裝×2＋生活小物×1（data-decor 標記，§92 守衛密度）
    const DECOR_ACCENT = { home: '#ff8fab', home2: '#ffb3c9', store: '#2fd48c', school: '#6ec3ff', library: '#b79ced', rest: '#ffb08a', gym: '#ffd43b', club: '#c39bf0', study: '#8fc9f2' };
    function sceneDecor(pr, key) {
      const P = pr.P, pts = pr.pts, acc = DECOR_ACCENT[key] || '#ff8fab';
      const poly = (l, f, e) => '<polygon points="' + pts(l) + '" fill="' + f + '"' + (e || '') + '/>';
      const face = (x, z, w, h0, h1, f, e) => poly([P(x, z, h0), P(x + w, z, h0), P(x + w, z, h1), P(x, z, h1)], f, e);
      let o = '<g class="scene-decor">';
      o += face(96, 1, 100, 72, 124, '#ffffff', ' data-decor="wall" stroke="#7c4a63" stroke-width="3"');
      o += face(112, 1, 68, 86, 110, acc, ' data-decor="wall"');
      const ck = P(1052, 1, 100);
      o += '<circle cx="' + ck.x.toFixed(1) + '" cy="' + ck.y.toFixed(1) + '" r="15" fill="#ffffff" stroke="#7c4a63" stroke-width="3" data-decor="wall"/><line x1="' + ck.x.toFixed(1) + '" y1="' + ck.y.toFixed(1) + '" x2="' + ck.x.toFixed(1) + '" y2="' + (ck.y - 9).toFixed(1) + '" stroke="#5c2e3e" stroke-width="2.5" data-decor="wall"/><line x1="' + ck.x.toFixed(1) + '" y1="' + ck.y.toFixed(1) + '" x2="' + (ck.x + 7).toFixed(1) + '" y2="' + ck.y.toFixed(1) + '" stroke="#5c2e3e" stroke-width="2.5" data-decor="wall"/>';
      const rug = [], rug2 = [];
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; rug.push(P(575 + Math.cos(a) * 130, 208 + Math.sin(a) * 36, 0)); rug2.push(P(575 + Math.cos(a) * 84, 208 + Math.sin(a) * 22, 0)); }
      o += poly(rug, acc, ' data-decor="soft" opacity="0.35"');
      o += poly(rug2, '#ffffff', ' data-decor="soft" opacity="0.35"');
      o += poly([P(40, 246, 0), P(76, 246, 0), P(76, 282, 0), P(40, 282, 0)], '#e8906f', ' data-decor="soft"');
      const lf = P(58, 264, 30), lf2 = P(58, 264, 44);
      o += '<circle cx="' + lf.x.toFixed(1) + '" cy="' + lf.y.toFixed(1) + '" r="12" fill="#4fce7e" data-decor="soft"/><circle cx="' + lf2.x.toFixed(1) + '" cy="' + lf2.y.toFixed(1) + '" r="9" fill="#2fd48c" data-decor="soft"/>';
      [0, 1, 2].forEach(i => {
        const cols = [acc, '#ffffff', '#7d8fc9'];
        o += poly([P(268, 40, i * 5), P(312, 40, i * 5), P(312, 70, i * 5), P(268, 70, i * 5)], cols[i], ' data-decor="prop"');
        o += poly([P(268, 70, i * 5), P(312, 70, i * 5), P(312, 70, i * 5 + 5), P(268, 70, i * 5 + 5)], cols[i], ' data-decor="prop" opacity="0.75"');
      });
      return o + '</g>';
    }
    function buildHomeRoomsHTML() {
      const pr = HOME_PROJ, WH = 150;
      const poly = (list, fill, extra) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"' + (extra || '') + '/>';
      const rectPoly = (x, z, w, d, h, fill, extra) => poly([pr.P(x, z, h), pr.P(x + w, z, h), pr.P(x + w, z + d, h), pr.P(x, z + d, h)], fill, extra);
      const faceRect = (x, z, w, h0, h1, fill) => poly([pr.P(x, z, h0), pr.P(x + w, z, h0), pr.P(x + w, z, h1), pr.P(x, z, h1)], fill);
      const txt = (xp, str, size, fill, op) => '<text x="' + xp.x.toFixed(1) + '" y="' + xp.y.toFixed(1) + '" font-size="' + size + '" font-weight="700" fill="' + fill + '"' + (op ? ' opacity="' + op + '"' : '') + '>' + str + '</text>';
      let bg = '', front = '';
      // 北牆三區色＋東牆＋地板
      bg += poly([pr.P(0, 0, 0), pr.P(340, 0, 0), pr.P(340, 0, WH), pr.P(0, 0, WH)], '#fdf0f5');
      bg += poly([pr.P(380, 0, 0), pr.P(752, 0, 0), pr.P(752, 0, WH), pr.P(380, 0, WH)], '#f5f0e6');
      bg += poly([pr.P(792, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(792, 0, WH)], '#fff5f9');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#e8d8ee', 0.8));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#d9a066');
      bg += floorBands(pr, poly, '#c98d54', 0.45, 38, 0, 1150, 0, 300); // v9.62 木板交錯帶
      let lines = '';
      for (let z = 38; z < 300; z += 38) { const a = pr.P(0, z, 0), b = pr.P(1150, z, 0); lines += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; }
      bg += '<g stroke="rgba(150,100,50,0.35)" stroke-width="1.5">' + lines + '</g>';
      // 隔間牆（沿 z 的平面，門洞 z96–140＋門楣 h74 起）
      [360, 772].forEach(px => {
        bg += poly([pr.P(px, 0, 0), pr.P(px, 96, 0), pr.P(px, 96, WH), pr.P(px, 0, WH)], '#ffe9f4');
        bg += poly([pr.P(px, 140, 0), pr.P(px, 300, 0), pr.P(px, 300, WH), pr.P(px, 140, WH)], '#ffe9f4');
        bg += poly([pr.P(px, 96, 74), pr.P(px, 140, 74), pr.P(px, 140, WH), pr.P(px, 96, WH)], '#ffe9f4');
        const d1 = pr.P(px, 96, 0), d2 = pr.P(px, 96, 74), d3 = pr.P(px, 140, 0), d4 = pr.P(px, 140, 74);
        bg += '<line x1="' + d1.x.toFixed(1) + '" y1="' + d1.y.toFixed(1) + '" x2="' + d2.x.toFixed(1) + '" y2="' + d2.y.toFixed(1) + '" stroke="#d98a68" stroke-width="3"/><line x1="' + d3.x.toFixed(1) + '" y1="' + d3.y.toFixed(1) + '" x2="' + d4.x.toFixed(1) + '" y2="' + d4.y.toFixed(1) + '" stroke="#d98a68" stroke-width="3"/>';
      });
      // 北牆窗/畫/海報（wallDeco 平面物）
      bg += pr.wallDecoN(36, 116, 96, 144, '#7d8fc9');
      const moon = pr.P(94, 0, 124); bg += '<circle cx="' + moon.x.toFixed(1) + '" cy="' + moon.y.toFixed(1) + '" r="9" fill="#ffe9a8"/>';
      bg += pr.wallDecoN(150, 196, 88, 118, '#ffffff');
      [[165, 103], [181, 103], [173, 95]].forEach(([fx, fh]) => { const c = pr.P(fx, 0, fh); bg += '<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="5" fill="#fed7aa"/>'; });
      bg += pr.wallDecoN(566, 646, 88, 148, '#bedcfe');
      const sun = pr.P(588, 0, 128); bg += '<circle cx="' + sun.x.toFixed(1) + '" cy="' + sun.y.toFixed(1) + '" r="10" fill="#ffcf5c"/>';
      const cl = pr.P(622, 0, 116); bg += '<circle cx="' + cl.x.toFixed(1) + '" cy="' + cl.y.toFixed(1) + '" r="8" fill="#ffffff"/><circle cx="' + (cl.x - 10).toFixed(1) + '" cy="' + (cl.y + 2).toFixed(1) + '" r="6" fill="#ffffff"/>';
      bg += pr.wallDecoN(812, 882, 88, 148, '#aee6fa');
      const cl2 = pr.P(838, 0, 122); bg += '<circle cx="' + cl2.x.toFixed(1) + '" cy="' + cl2.y.toFixed(1) + '" r="8" fill="#ffffff"/><circle cx="' + (cl2.x + 12).toFixed(1) + '" cy="' + (cl2.y + 3).toFixed(1) + '" r="6" fill="#ffffff"/>';
      bg += pr.wallDecoN(968, 1036, 96, 142, '#ffffff');
      bg += txt(pr.P(994, 0, 112), '★', 20, '#ffcf5c');
      // 地毯（地板上的平面矩形）
      bg += rectPoly(44, 226, 236, 60, 0, 'rgba(206,147,216,0.45)');
      bg += rectPoly(430, 228, 300, 54, 0, 'rgba(255,204,128,0.5)');
      bg += rectPoly(768, 226, 216, 60, 0, 'rgba(144,202,249,0.5)');
      // 起居室（v9.66 臥室搬上 2F）：雙扶手椅＋茶几＋衣櫃（原位）
      bg += pr.box3(84, 128, 62, 12, 26, '#5ec96f');
      const ac1 = pr.boxFaces(84, 140, 62, 38, 15, '#5ec96f');
      bg += ac1.back; front += ac1.front;
      bg += pr.box3(196, 128, 62, 12, 26, '#5ec96f');
      const ac2 = pr.boxFaces(196, 140, 62, 38, 15, '#5ec96f');
      bg += ac2.back; front += ac2.front;
      bg += pr.box3(140, 192, 76, 32, 9, '#d98a68');
      bg += pr.box3(272, 28, 60, 26, 52, '#d98a68');
      // 沙發（靠背北側＋座墊盒，南面進 front）
      bg += pr.box3(442, 116, 152, 12, 26, '#e74c3c');
      const sofa = pr.boxFaces(442, 128, 152, 46, 16, '#e74c3c');
      bg += sofa.back; front += sofa.front;
      // 電視（薄盒靠北牆，全 bg）＋螢幕畫在其南面平面上
      bg += pr.box3(648, 40, 92, 10, 42, '#232f47');
      bg += faceRect(654, 50.5, 80, 8, 36, '#8fc9f2');
      const tsun = pr.P(678, 50.5, 24); bg += '<circle cx="' + tsun.x.toFixed(1) + '" cy="' + tsun.y.toFixed(1) + '" r="6" fill="#ffe9a8"/>';
      // 落地燈＋光池
      const lp0 = pr.P(616, 150, 0), lp1 = pr.P(616, 150, 50);
      bg += '<line x1="' + lp0.x.toFixed(1) + '" y1="' + lp0.y.toFixed(1) + '" x2="' + lp1.x.toFixed(1) + '" y2="' + lp1.y.toFixed(1) + '" stroke="#8d7f9e" stroke-width="3"/>';
      bg += pr.planeCircle(616, 150, 0, 26, '#ffcf5c', 0.25);
      bg += '<polygon points="' + (lp1.x - 16).toFixed(1) + ',' + lp1.y.toFixed(1) + ' ' + (lp1.x + 16).toFixed(1) + ',' + lp1.y.toFixed(1) + ' ' + (lp1.x + 8).toFixed(1) + ',' + (lp1.y - 20).toFixed(1) + ' ' + (lp1.x - 8).toFixed(1) + ',' + (lp1.y - 20).toFixed(1) + '" fill="#ffcf5c" stroke="#5c2e3e" stroke-width="1.8"/>';
      bg += pr.box3(386, 232, 66, 22, 10, '#b8a6c9');
      // 晚餐桌＋北椅（bg）＋南椅（南面進 front）
      bg += pr.box3(606, 146, 36, 10, 30, '#d98a68');
      bg += pr.box3(667, 146, 36, 10, 30, '#d98a68');
      const dtable = pr.boxFaces(597, 168, 116, 30, 14, '#c98d54');
      bg += dtable.back; front += dtable.front;
      const schair = pr.boxFaces(637, 212, 36, 10, 24, '#d98a68');
      bg += schair.back; front += schair.front;
      // 書房一角（v9.66 我的床搬上 2F）：閱讀椅＋邊桌＋盆栽
      bg += pr.box3(812, 128, 66, 12, 26, '#8fc9f2');
      const rch = pr.boxFaces(812, 140, 66, 38, 15, '#8fc9f2');
      bg += rch.back; front += rch.front;
      bg += pr.box3(896, 150, 30, 30, 20, '#d98a68');
      bg += pr.box3(922, 106, 26, 26, 12, '#ffb08a');
      const plv = pr.P(935, 119, 30); bg += '<circle cx="' + plv.x.toFixed(1) + '" cy="' + plv.y.toFixed(1) + '" r="11" fill="#5ec96f"/><circle cx="' + (plv.x - 8).toFixed(1) + '" cy="' + (plv.y + 4).toFixed(1) + '" r="7" fill="#27ae60"/>';
      // 書桌（南面進 front）＋桌上書＋椅
      const desk = pr.boxFaces(972, 148, 130, 34, 14, '#d98a68');
      bg += desk.back; front += desk.front;
      bg += rectPoly(986, 154, 10, 18, 14.5, '#e74c3c');
      bg += rectPoly(998, 156, 8, 14, 14.5, '#8fc9f2');
      bg += rectPoly(1008, 155, 9, 16, 14.5, '#8fe3a8');
      bg += pr.box3(1010, 186, 44, 10, 22, '#6d4c41');
      // 書櫃＋書脊（畫在南面平面上）
      bg += pr.box3(1108, 28, 38, 24, 54, '#a15c72');
      [[1112, '#e74c3c'], [1120, '#8fc9f2'], [1128, '#8fe3a8']].forEach(([sx, sc2]) => { bg += faceRect(sx, 52.5, 6, 30, 48, sc2); bg += faceRect(sx, 52.5, 6, 6, 22, sc2); });
      bg += stairSvgAt(pr, 500); // v9.66 樓梯間（中央區北側，通 2F 臥室層）
      // 入口墊＋分區標籤＋貓
      bg += pr.box3(505, 264, 120, 28, 2, '#a15c72');
      bg += txt(pr.P(597, 283, 4), '入 口', 11, '#ffe9b8');
      bg += txt(pr.P(20, 292, 0), '起居室', 14, '#8d7f9e', 0.65); // v9.66
      bg += txt(pr.P(396, 292, 0), '客廳・餐廳', 14, '#d98a68', 0.65);
      bg += txt(pr.P(800, 292, 0), '書房', 14, '#2e5f8a', 0.65); // v9.66
      const catA = pr.P(300, 248, 0);
      bg += '<g id="home-cat" transform="translate(' + catA.x.toFixed(1) + ',' + catA.y.toFixed(1) + ')"><rect class="cat-tail" x="-4" y="1" width="5" height="2" fill="#ff8fab"/><rect x="0" y="4" width="10" height="5" fill="#ffb08a"/><rect x="2" y="4" width="1" height="5" fill="#ff8fab"/><rect x="5" y="4" width="1" height="5" fill="#ff8fab"/><rect x="8" y="0" width="6" height="6" fill="#ffb08a"/><rect x="8" y="-1" width="2" height="2" fill="#ffb08a"/><rect x="12" y="-1" width="2" height="2" fill="#ffb08a"/><rect x="10" y="2" width="1" height="1" fill="#5c2e3e"/><rect x="13" y="2" width="1" height="1" fill="#5c2e3e"/><rect x="0" y="9" width="3" height="1" fill="#ff8fab"/><rect x="7" y="9" width="3" height="1" fill="#ff8fab"/></g>';
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + HOME_PW + ' 300" style="position:absolute; left:0; top:0; width:' + HOME_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      // 書桌點擊區（投影後書桌外接矩形，R1：命中以投影後位置為準，邏輯不變）
      const dc = [[972, 148, 0], [1102, 148, 14], [1102, 182, 0], [972, 182, 14], [972, 148, 14], [1102, 182, 14], [972, 182, 0], [1102, 148, 0]].map(([x, z, h]) => pr.P(x, z, h));
      const dx0 = Math.min.apply(null, dc.map(c => c.x)), dx1 = Math.max.apply(null, dc.map(c => c.x));
      const dy0 = Math.min.apply(null, dc.map(c => c.y)), dy1 = Math.max.apply(null, dc.map(c => c.y));
      const hit = '<div id="desk-hit" onclick="toggleDeskStudy()" title="在書桌自習" style="position:absolute; left:' + (dx0 - 6).toFixed(0) + 'px; top:' + (dy0 - 6).toFixed(0) + 'px; width:' + (dx1 - dx0 + 12).toFixed(0) + 'px; height:' + (dy1 - dy0 + 12).toFixed(0) + 'px; z-index:140; cursor:pointer;"></div>';
      return svgOpen('home-bg25', 0) + bg + roomShell(pr, WH, 300) + sceneDecor(pr, 'home') + '</svg>'
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
      const host = document.querySelector('#landmark-home .island-mount-top') || document.querySelector('#landmark-home .island-mount') || document.getElementById('landmark-home');
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
    // R6 室內 sync 共用化：九場景 pan 套用原為逐字複製的九份，收斂為單一工廠（行為恆等）
    function makePanApplier(roomsId, setCur) {
      return function (pan, sc) {
        const rooms = document.getElementById(roomsId);
        if (!rooms) return;
        setCur(pan);
        rooms.style.transform = 'translate(' + (-pan * sc).toFixed(1) + 'px, 0px) scale(' + sc.toFixed(3) + ')';
      };
    }
    const applyHomePan = makePanApplier('home-rooms', (v) => { _homePanCur = v; });
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
      const playerHere = playerIn && currentState !== 'sleeping' && (gameState._go ? (gameState._goFloor || 1) === 1 : !(gameState._spot && gameState._spot.floor === 2)); // v9.66 睡覺時主角本人在 2F（updateHome2Stage 接手）；v9.73 爸媽房覆寫同理；v9.101 步行中依 _goFloor
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
      applyHomeFloors((playerIn && (gameState._go ? (gameState._goFloor || 1) === 2 : (currentState === 'sleeping' || (gameState._spot && gameState._spot.floor === 2)))) ? 2 : 1); // v9.66 樓層疊層跟著主角睡/醒；v9.73 爸媽房覆寫錨 2F切換；v9.101 步行中依 _goFloor
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
      bg += poly([pr.P(380, 0, 0), pr.P(752, 0, 0), pr.P(752, 0, WH), pr.P(380, 0, WH)], '#fdf0f5');
      bg += poly([pr.P(792, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(792, 0, WH)], '#e8f0f7');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#e8d8ee', 0.8));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#d9a066');
      bg += floorBands(pr, poly, '#c98d54', 0.45, 38, 0, 1150, 0, 300);
      [360, 772].forEach(px => {
        bg += poly([pr.P(px, 0, 0), pr.P(px, 96, 0), pr.P(px, 96, WH), pr.P(px, 0, WH)], '#ffe9f4');
        bg += poly([pr.P(px, 140, 0), pr.P(px, 300, 0), pr.P(px, 300, WH), pr.P(px, 140, WH)], '#ffe9f4');
        bg += poly([pr.P(px, 96, 74), pr.P(px, 140, 74), pr.P(px, 140, WH), pr.P(px, 96, WH)], '#ffe9f4');
      });
      bg += pr.wallDecoN(150, 196, 88, 118, '#ffffff');
      [[165, 103], [181, 103], [173, 95]].forEach(([fx, fh]) => { const c = pr.P(fx, 0, fh); bg += '<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="5" fill="#fed7aa"/>'; });
      bg += pr.wallDecoN(566, 646, 88, 148, '#bedcfe');
      const sun2 = pr.P(588, 0, 128); bg += '<circle cx="' + sun2.x.toFixed(1) + '" cy="' + sun2.y.toFixed(1) + '" r="10" fill="#ffcf5c"/>';
      bg += pr.wallDecoN(968, 1036, 96, 142, '#ffffff');
      bg += txt(pr.P(994, 0, 112), '★', 20, '#ffcf5c');
      bg += rectPoly(44, 226, 236, 60, 0, 'rgba(206,147,216,0.45)');
      bg += rectPoly(430, 228, 300, 54, 0, 'rgba(255,204,128,0.5)');
      bg += rectPoly(768, 226, 216, 60, 0, 'rgba(144,202,249,0.5)');
      // 爸媽床（與舊 1F 同幾何：sleepSpot/棉被座標零改動）＋衣櫃
      bg += pr.box3(68, 114, 188, 10, 30, '#a15c72');
      bg += pr.box3(68, 124, 188, 84, 13, '#ffffff');
      bg += pr.box3(84, 130, 68, 22, 17, '#ffffff');
      bg += pr.box3(172, 130, 68, 22, 17, '#ffffff');
      bg += pr.box3(68, 156, 188, 52, 15.5, '#9b59b6');
      bg += pr.box3(272, 28, 60, 26, 52, '#d98a68');
      // 中央：樓梯（下樓口）＋小書房桌
      bg += stairSvgAt(pr, 500);
      const ndesk = pr.boxFaces(420, 158, 92, 30, 14, '#d98a68');
      bg += ndesk.back; front += ndesk.front;
      bg += pr.box3(448, 192, 36, 10, 22, '#6d4c41');
      bg += rectPoly(434, 164, 10, 18, 14.5, '#e74c3c');
      bg += rectPoly(446, 166, 8, 14, 14.5, '#8fc9f2');
      // 我的床（同舊 1F 幾何）＋床頭櫃＋小燈＋書櫃
      bg += pr.box3(792, 114, 162, 10, 30, '#6d4c41');
      bg += pr.box3(792, 124, 162, 84, 13, '#ffffff');
      bg += pr.box3(806, 130, 68, 22, 17, '#ffffff');
      bg += pr.box3(792, 156, 162, 52, 15.5, '#8fc9f2');
      bg += pr.box3(966, 118, 34, 26, 20, '#d98a68');
      const nl0 = pr.P(983, 130, 20), nl1 = pr.P(983, 130, 38);
      bg += '<line x1="' + nl0.x.toFixed(1) + '" y1="' + nl0.y.toFixed(1) + '" x2="' + nl1.x.toFixed(1) + '" y2="' + nl1.y.toFixed(1) + '" stroke="#8d7f9e" stroke-width="2.5"/>';
      bg += pr.planeCircle(983, 130, 0, 20, '#ffcf5c', 0.22);
      bg += pr.box3(1108, 28, 38, 24, 54, '#a15c72');
      [[1112, '#e74c3c'], [1120, '#8fc9f2'], [1128, '#8fe3a8']].forEach(([sx, sc2]) => { bg += faceRect(sx, 52.5, 6, 30, 48, sc2); bg += faceRect(sx, 52.5, 6, 6, 22, sc2); });
      bg += txt(pr.P(20, 292, 0), '爸媽房', 14, '#8d7f9e', 0.65);
      bg += txt(pr.P(396, 292, 0), '樓梯間・小書房', 14, '#d98a68', 0.65);
      bg += txt(pr.P(800, 292, 0), '我的房間', 14, '#2e5f8a', 0.65);
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + HOME_PW + ' 300" style="position:absolute; left:0; top:0; width:' + HOME_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      const pb = '<g class="sleep-form-anim">'
        + rectPoly(66, 168, 192, 44, 15.5, '#9b59b6', ' stroke="#5c2e3e" stroke-width="1.6"')
        + rectPoly(66, 168, 192, 12, 15.6, 'rgba(255,255,255,0.25)')
        + [[110, 186], [165, 194], [220, 188]].map(([cx, cz]) => { const c = pr.P(cx, cz, 16); return '<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="5" fill="rgba(255,255,255,0.3)"/>'; }).join('') + '</g>';
      const yb = '<g class="sleep-form-anim">'
        + rectPoly(790, 168, 164, 44, 15.5, '#8fc9f2', ' stroke="#5c2e3e" stroke-width="1.6"')
        + rectPoly(790, 182, 164, 5, 15.6, 'rgba(255,255,255,0.35)')
        + rectPoly(790, 196, 164, 5, 15.6, 'rgba(255,255,255,0.35)') + '</g>';
      return svgOpen('home2-bg25', 0) + bg + roomShell(pr, WH, 300) + sceneDecor(pr, 'home2') + '</svg>'
        + svgOpen('home2-front25', 196) + front + '</svg>'
        + '<svg id="parents-blanket" viewBox="0 0 ' + HOME_PW + ' 300" style="display:none; position:absolute; left:0; top:0; width:' + HOME_PW + 'px; height:300px; z-index:260; pointer-events:none;">' + pb + '</svg>'
        + '<svg id="player-blanket" viewBox="0 0 ' + HOME_PW + ' 300" style="display:none; position:absolute; left:0; top:0; width:' + HOME_PW + 'px; height:300px; z-index:600; pointer-events:none;">' + yb + '</svg>';
    }
    let _home2PanManual = null;
    let _home2ManualUntil = 0;
    let _home2PanCur = 0; let _home2PanT = 0;
    let _home2WasIn = false;
    const applyHome2Pan = makePanApplier('home2-rooms', (v) => { _home2PanCur = v; });
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
      const host = document.querySelector('#landmark-home .island-mount-top') || document.querySelector('#landmark-home .island-mount') || document.getElementById('landmark-home');
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
    // 櫃檯 (796,100,328x24,h13)：店員崗位 z150 在南緣之南 26（站姿南面淨空公式 h<=25-26*0.378-c）；吧台 (16,224,396x20,h11)：窗邊座 z262 在南緣之南 18。
    const STORE_PROJ = PROJ.makeIndoor(PROJ.K_INDOOR, 24, 172); // v9.67 室內 45°
    const STORE_PW = 1340;
    PROJ.registerRooms('store-rooms', STORE_PROJ);
    function buildStoreRoomsHTML() {
      const pr = STORE_PROJ, WH = 170;
      const poly = (list, fill, extra) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"' + (extra || '') + '/>';
      const faceRect = (x, z, w, h0, h1, fill) => poly([pr.P(x, z, h0), pr.P(x + w, z, h0), pr.P(x + w, z, h1), pr.P(x, z, h1)], fill);
      const txt = (xp, str, size, fill, anchor) => '<text x="' + xp.x.toFixed(1) + '" y="' + xp.y.toFixed(1) + '" font-size="' + size + '" font-weight="900" fill="' + fill + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + str + '</text>';
      const PAL = ['#ff5d8f', '#4fce7e', '#ffcc00', '#3a6ea5', '#9b59b6', '#ff9f0a', '#27ae60', '#ff8fab', '#ff5b6a', '#4fce7e', '#ffb08a', '#4fce7e'];
      const goodsRow = (x0, n, zF, hBot, hTop, seed, wdt) => { let o = ''; for (let i = 0; i < n; i++) { o += faceRect(x0 + i * ((wdt || 14) + 4), zF, wdt || 14, hBot, hTop - ((seed + i * 7) % 4), PAL[(seed + i) % 12]); } return o; };
      let bg = '', front = '', frontB = '';
      // 牆＋地板磚
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(0, 0, WH)], '#fff6e8');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#fff6e8', 0.85));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#fdf0f5');
      bg += floorBands(pr, poly, '#ffffff', 0.5, 48, 0, 1150, 0, 300); // v9.62 磁磚列（與既有磚縫同節奏）
      let lines = '';
      for (let z = 48; z < 300; z += 48) { const a = pr.P(0, z, 0), b = pr.P(1150, z, 0); lines += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; }
      [150, 430, 710, 990].forEach(x => { const a = pr.P(x, 0, 0), b = pr.P(x, 300, 0); lines += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; });
      bg += '<g stroke="#ffe9a8" stroke-width="2">' + lines + '</g>';
      // 招牌帶＋牆上櫃：飲料冰櫃/冰品/麵包
      bg += faceRect(0, 0.6, 1150, 114, 124, '#4fce7e');
      bg += txt(pr.P(26, 0, 142), '24H MART 歡迎光臨', 17, '#8a6bc9');
      bg += txt(pr.P(986, 0, 142), '冰櫃・麵包・關東煮', 12, '#a15c72');
      bg += pr.wallDecoN(330, 700, 114, 168, '#e8d8ee');
      bg += faceRect(336, 0.6, 174, 120, 162, 'rgba(223,243,255,0.9)') + faceRect(518, 0.6, 174, 120, 162, 'rgba(223,243,255,0.9)');
      bg += goodsRow(342, 6, 0.7, 126, 140, 0, 12) + goodsRow(342, 6, 0.7, 144, 156, 5, 12) + goodsRow(524, 6, 0.7, 126, 140, 3, 12) + goodsRow(524, 6, 0.7, 144, 156, 8, 12);
      bg += pr.wallDecoN(726, 876, 114, 168, '#fed7aa');
      bg += txt(pr.P(748, 0, 140), '🍦 冰品', 15, '#a93226');
      bg += pr.wallDecoN(892, 1120, 114, 168, '#ffe9b8');
      bg += txt(pr.P(922, 0, 140), '🥐 現烤麵包', 15, '#a15c72');
      bg += pr.planeCircle(36, 40, 0, 12, '#4fce7e');
      bg += pr.planeCircle(1114, 40, 0, 12, '#4fce7e');
      // 中央貨架 x2（全 bg：走道在南、無人坐其後）
      [[380, '零食 SNACKS', 2], [580, '泡麵・飲料', 7]].forEach(([sx, label, seed]) => {
        bg += pr.box3(sx, 100, 180, 34, 42, '#b79ced');
        bg += faceRect(sx, 134.6, 180, 33, 42, '#8a6bc9');
        bg += txt(pr.P(sx + 12, 135, 37), label, 9, '#ffffff');
        bg += goodsRow(sx + 8, 8, 134.6, 20, 29, seed) + goodsRow(sx + 8, 8, 134.6, 6, 15, seed + 4);
      });
      // 特價桌
      bg += pr.box3(400, 216, 300, 22, 12, '#b0743e');
      bg += faceRect(400, 238.6, 120, 2, 10, '#a15c72');
      bg += txt(pr.P(412, 239, 7), '本週特價', 10, '#ffffff');
      // 窗邊吧台（上面進 bg、南面進 frontB z960）＋窗玻璃帶＋吧台椅
      const bar = pr.boxFaces(16, 224, 396, 20, 11, '#a15c72');
      bg += bar.back; frontB += bar.front;
      bg += poly([pr.P(24, 268, 0), pr.P(404, 268, 0), pr.P(404, 296, 0), pr.P(24, 296, 0)], 'rgba(191,227,255,0.85)');
      [119, 214, 309].forEach(x => { const a = pr.P(x, 268, 0), b = pr.P(x, 296, 0); bg += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" stroke="#5c2e3e" stroke-width="2"/>'; });
      [110, 200, 290].forEach(x => { bg += pr.planeCircle(x, 262, 0, 10, '#e74c3c'); });
      // 收銀櫃檯（上面進 bg、南面進 front z950）＋收銀機/關東煮
      const counter = pr.boxFaces(796, 100, 328, 24, 13, '#ffffff');
      bg += counter.back; front += counter.front;
      front += txt(pr.P(922, 124.6, 6), '歡迎光臨', 11, '#8a6bc9');
      bg += pr.box3(896, 102, 24, 10, 22, '#7d8fc9');
      bg += faceRect(898, 112.6, 20, 12, 20, '#8fc9f2');
      bg += pr.box3(950, 102, 24, 10, 22, '#7d8fc9');
      bg += faceRect(952, 112.6, 20, 12, 20, '#8fc9f2');
      bg += pr.box3(806, 102, 44, 16, 18, '#ff8fab');
      bg += txt(pr.P(810, 119, 13), '🍢關東煮', 9, '#ffe9a8');
      // 入口墊
      bg += pr.box3(505, 264, 120, 28, 2, '#4fce7e');
      bg += txt(pr.P(540, 283, 4), '入 口', 11, '#8a6bc9');
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + STORE_PW + ' 300" style="position:absolute; left:0; top:0; width:' + STORE_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      return svgOpen('store-bg25', 0) + bg + roomShell(pr, WH, 300) + sceneDecor(pr, 'store') + '</svg>' + svgOpen('store-front25', 950) + front + '</svg>' + svgOpen('store-front25b', 960) + frontB + '</svg>'
        + '<div class="store-chip" style="left:452px; top:214px;" onclick="noodleHitClick(event)">' + icoSvg('noodle') + ' 窗邊泡麵</div>';
    }

    function ensureStoreInterior() {
      if (document.getElementById('store-stage')) return;
      const host = document.querySelector('#landmark-store .island-mount-top') || document.querySelector('#landmark-store .island-mount') || document.getElementById('landmark-store');
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
    const applyStorePan = makePanApplier('store-rooms', (v) => { _storePanCur = v; });
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
      { const fsHere = !!(window.__FS_FIT && window.__FS_FIT.active === 'store'); const wo = fsHere ? '' : '0'; if (stage.style.opacity !== wo) stage.style.opacity = wo; stage.style.pointerEvents = fsHere ? '' : 'none'; } // v9.99 小鎮表面不攤室內（只在電視/FS 顯示）
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
      for (let i = 0; i < 5; i++) o += pr.box3(1046, 108 - i * 16, 78, 16, 5 + i * 6, i % 2 ? '#d98a68' : '#c98d54');
      const lp = pr.P(1085, 0, 128);
      o += '<text x="' + lp.x.toFixed(1) + '" y="' + lp.y.toFixed(1) + '" font-size="12" font-weight="900" fill="#a15c72" text-anchor="middle">樓 梯</text>';
      return o;
    }
    function stairSvgAt(pr, x0) { // v9.66 參數化樓梯（住家 x0=500；學校版 stairSvg 為 x0=1046 專用）
      let o = '';
      for (let i = 0; i < 5; i++) o += pr.box3(x0, 108 - i * 16, 78, 16, 5 + i * 6, i % 2 ? '#d98a68' : '#c98d54');
      const lp = pr.P(x0 + 39, 0, 128);
      o += '<text x="' + lp.x.toFixed(1) + '" y="' + lp.y.toFixed(1) + '" font-size="12" font-weight="900" fill="#a15c72" text-anchor="middle">樓 梯</text>';
      return o;
    }
    function buildSchoolRoomsHTML() {
      const pr = SCHOOL_PROJ, WH = 156;
      const poly = (list, fill, extra) => '<polygon points="' + pr.pts(list) + '" fill="' + fill + '"' + (extra || '') + '/>';
      const faceRect = (x, z, w, h0, h1, fill) => poly([pr.P(x, z, h0), pr.P(x + w, z, h0), pr.P(x + w, z, h1), pr.P(x, z, h1)], fill);
      const txt = (xp, str, size, fill, anchor) => '<text x="' + xp.x.toFixed(1) + '" y="' + xp.y.toFixed(1) + '" font-size="' + size + '" font-weight="900" fill="' + fill + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + str + '</text>';
      const PAL = ['#ff5d8f', '#5b7fa6', '#5ec96f', '#ffb08a', '#8e44ad', '#e65c00', '#27ae60', '#ff5d8f', '#ffcc00', '#f5f0e6'];
      const spineRow = (x0, x1, zF, hBot, hTop, seed) => { let o = ''; let cx = x0; let i = seed; while (cx < x1 - 10) { const bw = 9 + ((i * 37) % 5); const bh = (hTop - hBot) - ((i * 53) % 7); o += faceRect(cx, zF, bw, hBot, hBot + Math.max(10, bh), PAL[i % 10]); cx += bw + 2; i++; } return o; };
      let bg = '', front = '';
      // 牆＋地板
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(0, 0, WH)], '#fdf0f5');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#fdf0f5', 0.8));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#d9a066');
      bg += floorBands(pr, poly, '#c98d54', 0.45, 44, 0, 1150, 0, 300); // v9.62 木板交錯帶
      let lines = '';
      for (let z = 42; z < 300; z += 44) { const a = pr.P(0, z, 0), b = pr.P(1150, z, 0); lines += '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '"/>'; }
      bg += '<g stroke="#b0743e" stroke-width="2">' + lines + '</g>';
      // 辦公室窗＋書架牆板＋標籤
      bg += pr.wallDecoN(36, 140, 76, 146, '#bedcfe');
      const wx1 = pr.P(88, 0, 76), wx2 = pr.P(88, 0, 146), wy1 = pr.P(36, 0, 111), wy2 = pr.P(140, 0, 111);
      bg += '<line x1="' + wx1.x.toFixed(1) + '" y1="' + wx1.y.toFixed(1) + '" x2="' + wx2.x.toFixed(1) + '" y2="' + wx2.y.toFixed(1) + '" stroke="#5c2e3e" stroke-width="2"/><line x1="' + wy1.x.toFixed(1) + '" y1="' + wy1.y.toFixed(1) + '" x2="' + wy2.x.toFixed(1) + '" y2="' + wy2.y.toFixed(1) + '" stroke="#5c2e3e" stroke-width="2"/>';
      const osun = pr.P(60, 0, 128); bg += '<circle cx="' + osun.x.toFixed(1) + '" cy="' + osun.y.toFixed(1) + '" r="9" fill="#ffd43b"/>';
      bg += pr.wallDecoN(160, 282, 74, 148, '#a15c72');
      bg += spineRow(168, 274, 0.6, 116, 140, 3) + spineRow(168, 274, 0.6, 80, 102, 11);
      bg += faceRect(157, 0.6, 128, 110, 113, '#6d4c41');
      bg += pr.wallDecoN(48, 166, 54, 72, '#fff6e8');
      bg += txt(pr.P(58, 0, 63), '教師辦公室', 11, '#a15c72');
      // 老師桌（南面進 front）＋桌上物＋電腦小桌＋辦公椅背
      const tdesk = pr.boxFaces(104, 128, 108, 20, 13, '#a15c72');
      bg += tdesk.back; front += tdesk.front;
      bg += pr.planeCircle(126, 136, 13.4, 5, '#ffffff');
      bg += poly([pr.P(146, 132, 13.4), pr.P(166, 132, 13.4), pr.P(166, 142, 13.4), pr.P(146, 142, 13.4)], '#f5f0e6');
      bg += pr.box3(186, 130, 10, 8, 17, '#5ec96f');
      const plf = pr.P(191, 134, 23); bg += '<circle cx="' + plf.x.toFixed(1) + '" cy="' + plf.y.toFixed(1) + '" r="7" fill="#8fe3a8"/>';
      bg += pr.box3(222, 100, 66, 16, 12, '#6d4c41');
      bg += pr.box3(232, 102, 38, 4, 38, '#dcebf5');
      bg += faceRect(234, 106.6, 34, 16, 34, '#fff5f9');
      const mdot = pr.P(266, 106.6, 20); bg += '<circle cx="' + mdot.x.toFixed(1) + '" cy="' + mdot.y.toFixed(1) + '" r="3" fill="#5ec96f"/>';
      bg += pr.box3(134, 138, 42, 8, 20, '#6d4c41');
      // 隔間柱面（半透明）＋班牌
      bg += poly([pr.P(302, 6, 0), pr.P(302, 206, 0), pr.P(302, 206, 132), pr.P(302, 6, 132)], '#b8a6c9', ' opacity="0.45"');
      bg += poly([pr.P(302, 96, 80), pr.P(302, 142, 80), pr.P(302, 142, 100), pr.P(302, 96, 100)], '#fff6e8');
      bg += txt(pr.P(308, 119, 90), '三年二班', 10, '#a15c72');
      // 黑板＋粉筆
      bg += pr.wallDecoN(340, 820, 54, 158, '#6d4c41');
      bg += pr.wallDecoN(346, 814, 60, 152, '#8a6bc9');
      bg += txt(pr.P(374, 0, 130), '今日課程：數學・國文・自然', 14, '#fff5f9');
      bg += txt(pr.P(374, 0, 104), '3/4 ＋ 1/2 ＝ ？　（這題考試會考！）', 13, '#ffeef7');
      bg += faceRect(752, 0.6, 34, 72, 76, '#f5f0e6') + faceRect(722, 0.6, 16, 72, 76, '#f0b98a');
      // 時鐘
      const ck = pr.P(838, 0, 130);
      bg += '<circle cx="' + ck.x.toFixed(1) + '" cy="' + ck.y.toFixed(1) + '" r="15" fill="#ffffff" stroke="#5c2e3e" stroke-width="2"/><line x1="' + ck.x.toFixed(1) + '" y1="' + ck.y.toFixed(1) + '" x2="' + ck.x.toFixed(1) + '" y2="' + (ck.y - 10).toFixed(1) + '" stroke="#5c2e3e" stroke-width="2"/><line x1="' + ck.x.toFixed(1) + '" y1="' + ck.y.toFixed(1) + '" x2="' + (ck.x + 7).toFixed(1) + '" y2="' + (ck.y + 4).toFixed(1) + '" stroke="#5c2e3e" stroke-width="2"/>';
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
        const dk = pr.boxFaces(sx - 28, sy - 40, 56, 26, 11, '#d98a68');
        bg += dk.back; front += dk.front;
        bg += poly([pr.P(sx - 16, sy - 36, 11.4), pr.P(sx - 3, sy - 36, 11.4), pr.P(sx - 3, sy - 27, 11.4), pr.P(sx - 16, sy - 27, 11.4)], '#ff5d8f');
        bg += poly([pr.P(sx + 4, sy - 35, 11.4), pr.P(sx + 16, sy - 35, 11.4), pr.P(sx + 16, sy - 27, 11.4), pr.P(sx + 4, sy - 27, 11.4)], '#f5f0e6');
      });
      // 主角桌上的自習書堆（class/數量與舊版相同，updateStudyBooks 以 index 控制顯示）
      const bookCols = ['#ff5d8f', '#5b7fa6', '#5ec96f', '#8e44ad', '#ffb08a'];
      let books = '';
      bookCols.forEach((c, i) => { books += '<polygon class="book-layer" points="' + pr.pts([pr.P(564, 216, 11.5 + i * 2.2), pr.P(584, 216, 11.5 + i * 2.2), pr.P(584, 228, 11.5 + i * 2.2), pr.P(564, 228, 11.5 + i * 2.2)]) + '" fill="' + c + '"/>'; });
      bg += '<g id="study-books-school-in" class="study-books">' + books + '</g>';
      // 閱讀角：地毯＋書架＋坐墊＋盆栽＋立燈
      bg += pr.planeCircle(1000, 228, 0, 110, '#aee6fa', 0.55);
      bg += '<polygon points="' + pr.planeCirclePts(1000, 228, 0.5, 88) + '" fill="none" stroke="#8fd8ff" stroke-width="2"/>';
      bg += pr.box3(888, 120, 224, 24, 26, '#a15c72');
      bg += spineRow(896, 958, 144.6, 6, 24, 5) + spineRow(1040, 1104, 144.6, 6, 24, 9);
      bg += poly([pr.P(952, 124, 26.5), pr.P(1048, 124, 26.5), pr.P(1048, 140, 26.5), pr.P(952, 140, 26.5)], '#fff6e8');
      bg += txt(pr.P(964, 132, 32), '📚 閱讀角', 10, '#a15c72');
      bg += pr.planeCircle(935, 246, 0, 30, '#f0b98a');
      bg += pr.planeCircle(1065, 250, 0, 30, '#8fd8ff');
      bg += pr.box3(1108, 196, 16, 12, 10, '#a15c72');
      const pf1 = pr.P(1116, 202, 17), pf2 = pr.P(1108, 200, 13);
      bg += '<circle cx="' + pf1.x.toFixed(1) + '" cy="' + pf1.y.toFixed(1) + '" r="10" fill="#8fe3a8"/><circle cx="' + pf2.x.toFixed(1) + '" cy="' + pf2.y.toFixed(1) + '" r="7" fill="#85c173"/>';
      const lp0 = pr.P(884, 196, 0), lp1 = pr.P(884, 196, 34);
      bg += pr.planeCircle(884, 212, 0, 30, '#ffd43b', 0.18);
      bg += '<line x1="' + lp0.x.toFixed(1) + '" y1="' + lp0.y.toFixed(1) + '" x2="' + lp1.x.toFixed(1) + '" y2="' + lp1.y.toFixed(1) + '" stroke="#5c2e3e" stroke-width="2.5"/>';
      bg += '<polygon points="' + (lp1.x - 8).toFixed(1) + ',' + lp1.y.toFixed(1) + ' ' + (lp1.x + 8).toFixed(1) + ',' + lp1.y.toFixed(1) + ' ' + (lp1.x + 4).toFixed(1) + ',' + (lp1.y - 14).toFixed(1) + ' ' + (lp1.x - 4).toFixed(1) + ',' + (lp1.y - 14).toFixed(1) + '" fill="#ffd43b" stroke="#5c2e3e" stroke-width="1.5"/>';
      // 魚缸（掛牆水族箱，魚的動畫 class 保留）
      let tank = pr.box3(876, 104, 140, 14, 8, '#a15c72');
      tank += pr.box3(880, 84, 132, 20, 36, '#8fd8ff');
      tank += faceRect(884, 104.6, 124, 4, 32, 'rgba(191,227,255,0.55)');
      tank += faceRect(884, 104.6, 124, 4, 10, '#5ec96f');
      const fa = pr.P(898, 96, 20), fb = pr.P(972, 94, 13), bb = pr.P(1000, 92, 7);
      tank += '<g class="fish-a" transform="translate(' + fa.x.toFixed(1) + ',' + fa.y.toFixed(1) + ')"><rect x="0" y="0" width="10" height="5" fill="#ff8fab"/><rect x="-3" y="1" width="3" height="3" fill="#ff8fab"/><rect x="7" y="1" width="1" height="1" fill="#5c2e3e"/></g>';
      tank += '<g class="fish-b" transform="translate(' + fb.x.toFixed(1) + ',' + fb.y.toFixed(1) + ')"><rect x="0" y="0" width="9" height="4" fill="#ffcf5c"/><rect x="9" y="1" width="3" height="2" fill="#ffcf5c"/></g>';
      tank += '<circle class="fish-bub" cx="' + bb.x.toFixed(1) + '" cy="' + bb.y.toFixed(1) + '" r="2" fill="#ffffff" opacity="0.85"/>';
      bg += '<g id="school-tank">' + tank + '</g>';
      // 入口墊
      bg += pr.box3(515, 264, 120, 28, 2, '#a15c72');
      bg += txt(pr.P(575, 283, 4), '入 口', 11, '#ffe9b8', 'middle');
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + SCHOOL_PW + ' 300" style="position:absolute; left:0; top:0; width:' + SCHOOL_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      bg += stairSvg(pr); // v9.65 樓梯間（1F 看是上樓梯）
      return svgOpen('school-bg25', 0) + bg + roomShell(pr, WH, 300) + sceneDecor(pr, 'school') + '</svg>' + svgOpen('school-front25', 950) + front + '</svg>';
    }

    function ensureSchoolInterior() {
      if (document.getElementById('school-stage')) return;
      const host = document.querySelector('#landmark-school .island-mount-top') || document.querySelector('#landmark-school .island-mount') || document.getElementById('landmark-school');
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
    const applySchoolPan = makePanApplier('school-rooms', (v) => { _schoolPanCur = v; });
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
      bg += '<circle id="gym-sun" cx="950" cy="30" r="16" fill="#ffd43b" stroke="#ffb08a" stroke-width="2"/>';
      bg += '<g fill="#ffffff" opacity="0.85"><ellipse cx="240" cy="26" rx="42" ry="9"/><ellipse cx="272" cy="20" rx="26" ry="8"/><ellipse cx="700" cy="40" rx="36" ry="8"/><ellipse cx="726" cy="35" rx="22" ry="7"/></g>';
      // 地面（延伸到 z560 填滿框高）＋地平線樹叢
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 560, 0), pr.P(0, 560, 0)], '#5ec96f');
      bg += floorBands(pr, poly, '#8fe3a8', 0.45, 56, 0, 1150, 0, 560); // v9.62 草地修剪條紋
      [[60, 17], [112, 13], [330, 15], [520, 12], [880, 14], [1108, 16]].forEach(([tx, tr]) => { const c = pr.P(tx, 4, 15); bg += '<circle cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="' + tr + '" fill="#b79ced"/>'; });
      // 夜間燈組（id 保留）
      let floods = '';
      [120, 430, 760, 1062].forEach(fx => {
        const g = pr.P(fx, 26, 41);
        floods += '<circle cx="' + g.x.toFixed(1) + '" cy="' + g.y.toFixed(1) + '" r="24" fill="#ffe9b8" opacity="0.45"/>';
        floods += seg(pr.P(fx, 26, 0), pr.P(fx, 26, 36), '#7d8fc9', 4);
        floods += poly([pr.P(fx - 12, 26, 36), pr.P(fx + 12, 26, 36), pr.P(fx + 12, 26, 47), pr.P(fx - 12, 26, 47)], '#fff6e8', ' stroke="#5c2e3e" stroke-width="1.4"');
      });
      bg += '<g id="gym-floods" opacity="0">' + floods + '</g>';
      // 看台三階
      bg += pr.box3(36, 86, 220, 10, 26, '#b8a6c9');
      bg += pr.box3(36, 98, 220, 10, 17, '#b8a6c9');
      bg += pr.box3(36, 110, 220, 10, 8, '#b8a6c9');
      // 跑道（圓角矩形投影取樣）＋內場＋起跑線
      bg += '<polygon points="' + pr.pts(rrPts(36, 128, 764, 158, 76)) + '" fill="#ff5d8f" stroke="#5c2e3e" stroke-width="2.5"/>';
      bg += '<polyline points="' + pr.pts(rrPts(58, 146, 720, 122, 60)) + '" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="9 7"/>';
      bg += '<polygon points="' + pr.pts(rrPts(88, 158, 664, 98, 48)) + '" fill="#5ec96f"/>';
      [[150, 240], [330, 420], [510, 600]].forEach(([x0, x1]) => { bg += seg(pr.P(x0, 207, 0), pr.P(x1, 207, 0), 'rgba(255,255,255,0.8)', 2); });
      // 球場＋中線/中圈/三分線
      bg += poly([pr.P(812, 96, 0), pr.P(1130, 96, 0), pr.P(1130, 264, 0), pr.P(812, 264, 0)], '#d9a066', ' stroke="#5c2e3e" stroke-width="2.5"');
      bg += floorBands(pr, poly, '#c98d54', 0.4, 42, 812, 1130, 96, 264); // v9.62 球場木板帶
      bg += seg(pr.P(971, 96, 0), pr.P(971, 264, 0), '#ffffff', 2);
      bg += '<polygon points="' + pr.planeCirclePts(971, 180, 0, 26) + '" fill="none" stroke="#ffffff" stroke-width="2"/>';
      bg += poly([pr.P(1006, 138, 0), pr.P(1130, 138, 0), pr.P(1130, 222, 0), pr.P(1006, 222, 0)], 'rgba(181,101,29,0.5)');
      const arcPts = [];
      for (let i = 0; i <= 10; i++) { const a = Math.PI / 2 + i / 10 * Math.PI; arcPts.push(pr.P(1006 + Math.cos(a) * 74, 180 + Math.sin(a) * 74, 0)); }
      bg += '<polyline points="' + pr.pts(arcPts) + '" fill="none" stroke="#ffffff" stroke-width="2"/>';
      // 籃架：柱＋板（z90 平面）＋內框＋框緣（中心 P(1030,96,30)）＋籃網
      bg += seg(pr.P(1055, 88, 0), pr.P(1055, 88, 34), '#7d8fc9', 5);
      bg += poly([pr.P(1022, 90, 34), pr.P(1088, 90, 34), pr.P(1088, 90, 76), pr.P(1022, 90, 76)], '#ffffff', ' stroke="#e65c00" stroke-width="2.5"');
      bg += poly([pr.P(1040, 90, 40), pr.P(1070, 90, 40), pr.P(1070, 90, 62), pr.P(1040, 90, 62)], 'none', ' stroke="#e65c00" stroke-width="2"');
      const rim = pr.P(1030, 96, 30);
      bg += '<ellipse cx="' + rim.x.toFixed(1) + '" cy="' + rim.y.toFixed(1) + '" rx="9" ry="3.4" fill="none" stroke="#e65c00" stroke-width="2.6"/>';
      bg += seg(pr.P(1024, 97, 29), pr.P(1027, 97, 16), '#fff5f9', 1.4) + seg(pr.P(1030, 98, 29), pr.P(1030, 98, 15), '#fff5f9', 1.4) + seg(pr.P(1036, 97, 29), pr.P(1033, 97, 16), '#fff5f9', 1.4);
      // 司令台看板
      bg += seg(pr.P(570, 20, 0), pr.P(570, 20, 26), '#7d8fc9', 4) + seg(pr.P(580, 20, 0), pr.P(580, 20, 26), '#7d8fc9', 4);
      bg += poly([pr.P(518, 20, 26), pr.P(632, 20, 26), pr.P(632, 20, 62), pr.P(518, 20, 62)], '#232f47', ' stroke="#5c2e3e" stroke-width="2"');
      bg += txt(pr.P(575, 20, 44), '操 場', 13, '#ffd43b', 'middle');
      // 入口墊
      bg += pr.box3(515, 264, 120, 28, 2, '#795548');
      bg += txt(pr.P(575, 283, 4), '入 口', 11, '#ffe9b8', 'middle');
      return '<svg id="gym-bg25" viewBox="0 0 ' + GYM_PW + ' 300" style="position:absolute; left:0; top:0; width:' + GYM_PW + 'px; height:300px; pointer-events:none;">' + bg + roomShell(pr, 0, 560) + sceneDecor(pr, 'gym') + '</svg>'
        + '<button class="gym-shoot-btn" onpointerdown="event.stopPropagation()" onclick="playerShoot()">🏀 投籃</button>';
    }

    let _gymPanManual = null;
    let _gymManualUntil = 0;
    let _gymPanCur = 0; let _gymPanT = 0;
    let _gymWasIn = false;
    let _gymRunT0 = null; // v9.27.1 跑步迴圈起始時刻（跟拍推算用）
    let _gymLightKey = '';
    const applyGymPan = makePanApplier('gym-rooms', (v) => { _gymPanCur = v; });
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
      const host = document.querySelector('#landmark-gym .island-mount-top') || document.querySelector('#landmark-gym .island-mount') || document.getElementById('landmark-gym');
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
      const cfg = { night: ['#3b2354', -30, -30, '0.85'], am: ['#aee6fa', 950, 30, '0'], noon: ['#8fd8ff', 575, 15, '0'], golden: ['#f0b98a', 265, 42, '0'], sunset: ['#ff9e6b', 150, 62, '0.35'] }[key];
      sky.setAttribute('fill', cfg[0]);
      sun.setAttribute('cx', String(cfg[1])); sun.setAttribute('cy', String(cfg[2]));
      fl.style.opacity = cfg[3];
    }
    function updateGymStage() {
      ensureGymInterior();
      const stage = document.getElementById('gym-stage');
      if (!stage) return;
      { const fsHere = !!(window.__FS_FIT && window.__FS_FIT.active === 'gym'); const wo = fsHere ? '' : '0'; if (stage.style.opacity !== wo) stage.style.opacity = wo; stage.style.pointerEvents = fsHere ? '' : 'none'; } // v9.102 小鎮表面不攤操場（只在電視/FS 顯示，比照 v9.99 其他場景）
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
      syncGymFs(); // v9.102 進/出 FS 結算（在樣式寫入後、次幀閘門反映）
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
      const pal = ['#ff5d8f', '#5b7fa6', '#5ec96f', '#ffb08a', '#8e44ad', '#e65c00', '#27ae60', '#7d8fc9', '#ff5d8f', '#ffcc00'];
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
        out += `<rect x="${x - 3}" y="${baseY}" width="${w + 6}" height="4" fill="#a15c72"/>`;
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
      const PAL = ['#ff5d8f', '#5b7fa6', '#5ec96f', '#ffb08a', '#8e44ad', '#e65c00', '#27ae60', '#7d8fc9', '#ff5d8f', '#ffcc00'];
      const spineRow = (x0, x1, zF, hBot, hTop, seed) => { let o = ''; let cx = x0; let i = seed; while (cx < x1 - 10) { const bw = 9 + ((i * 37) % 5); const bh = (hTop - hBot) - ((i * 53) % 8); o += faceRect(cx, zF, bw, hBot, hBot + Math.max(10, bh), PAL[i % 10]); cx += bw + 2; i++; } return o; };
      let bg = '', front = '';
      // 牆＋地板＋地毯
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(0, 0, WH)], '#f5f0e6');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#f5f0e6', 0.8));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#c98d54');
      bg += floorBands(pr, poly, '#d98a68', 0.4, 38, 0, 1150, 0, 300); // v9.62 木板交錯帶（地毯蓋在其上）
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
        bg += faceRect(sx - 3, 26.6, 278, 99, 102, '#a15c72') + faceRect(sx - 3, 26.6, 278, 53, 56, '#a15c72');
      });
      bg += pr.box3(486, 10, 178, 18, 124, '#6d4c41');
      bg += spineRow(494, 656, 28.6, 82, 116, 5) + spineRow(494, 656, 28.6, 44, 76, 13);
      bg += faceRect(483, 28.6, 184, 79, 82, '#a15c72');
      // 時鐘＋櫃檯（南面進 front）＋招牌字
      const ck = pr.P(575, 0, 158);
      bg += '<circle cx="' + ck.x.toFixed(1) + '" cy="' + ck.y.toFixed(1) + '" r="10" fill="#fff6e8" stroke="#5c2e3e" stroke-width="2"/><line x1="' + ck.x.toFixed(1) + '" y1="' + ck.y.toFixed(1) + '" x2="' + ck.x.toFixed(1) + '" y2="' + (ck.y - 7).toFixed(1) + '" stroke="#5c2e3e" stroke-width="1.8"/><line x1="' + ck.x.toFixed(1) + '" y1="' + ck.y.toFixed(1) + '" x2="' + (ck.x + 5).toFixed(1) + '" y2="' + (ck.y + 2).toFixed(1) + '" stroke="#5c2e3e" stroke-width="1.8"/>';
      const counter = pr.boxFaces(474, 106, 202, 22, 16, '#795548');
      bg += counter.back; front += counter.front;
      bg += txt(pr.P(575, 100, 46), '借 還 書 櫃 台', 11, '#6d4c41', 'middle');
      // 地球儀＋東側盆栽
      const g0 = pr.P(88, 186, 0), g1 = pr.P(88, 186, 12), gc = pr.P(88, 180, 30);
      bg += '<line x1="' + g0.x.toFixed(1) + '" y1="' + g0.y.toFixed(1) + '" x2="' + g1.x.toFixed(1) + '" y2="' + g1.y.toFixed(1) + '" stroke="#6d4c41" stroke-width="4"/>';
      bg += '<circle cx="' + gc.x.toFixed(1) + '" cy="' + gc.y.toFixed(1) + '" r="17" fill="#8fd8ff" stroke="#5c2e3e" stroke-width="2"/>';
      bg += '<path d="M' + (gc.x - 14).toFixed(1) + ' ' + (gc.y - 6).toFixed(1) + ' Q' + gc.x.toFixed(1) + ' ' + (gc.y - 15).toFixed(1) + ' ' + (gc.x + 14).toFixed(1) + ' ' + (gc.y - 6).toFixed(1) + ' M' + (gc.x - 14).toFixed(1) + ' ' + (gc.y + 8).toFixed(1) + ' Q' + gc.x.toFixed(1) + ' ' + (gc.y + 17).toFixed(1) + ' ' + (gc.x + 14).toFixed(1) + ' ' + (gc.y + 8).toFixed(1) + '" stroke="#5ec96f" stroke-width="2.4" fill="none"/>';
      bg += pr.box3(1064, 150, 14, 12, 12, '#ffd43b');
      const pf1 = pr.P(1071, 156, 25), pf2 = pr.P(1062, 154, 19);
      bg += '<circle cx="' + pf1.x.toFixed(1) + '" cy="' + pf1.y.toFixed(1) + '" r="13" fill="#8fe3a8"/><circle cx="' + pf2.x.toFixed(1) + '" cy="' + pf2.y.toFixed(1) + '" r="8" fill="#85c173"/>';
      // 閱覽桌 x2（南面進 front）＋桌燈（光暈組合 id 保留）
      let glows = '';
      [[196, 330], [686, 820]].forEach(([tx, lx]) => {
        const tb = pr.boxFaces(tx, 166, 268, 20, 8, '#a15c72'); // v9.67 45° 後南面頂緣會蹭到坐姿臉帶下緣 0.7 單位：桌高 10->8 讓開（幾何驗證 v9.53）
        bg += tb.back; front += tb.front;
        bg += pr.planeCircle(lx, 176, 10.4, 6, '#8a6bc9');
        const s0 = pr.P(lx, 176, 10), s1 = pr.P(lx, 176, 21);
        bg += '<line x1="' + s0.x.toFixed(1) + '" y1="' + s0.y.toFixed(1) + '" x2="' + s1.x.toFixed(1) + '" y2="' + s1.y.toFixed(1) + '" stroke="#8a6bc9" stroke-width="3"/>';
        bg += '<polygon points="' + (s1.x - 12).toFixed(1) + ',' + s1.y.toFixed(1) + ' ' + (s1.x + 12).toFixed(1) + ',' + s1.y.toFixed(1) + ' ' + (s1.x + 7).toFixed(1) + ',' + (s1.y - 12).toFixed(1) + ' ' + (s1.x - 7).toFixed(1) + ',' + (s1.y - 12).toFixed(1) + '" fill="#5ec96f" stroke="#5c2e3e" stroke-width="1.4"/>';
        glows += pr.planeCircle(lx, 176, 11, 17, '#ffcf5c', 0.5);
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
      bg += pr.planeCircle(198, 228, 9, 11, '#a15c72');
      bg += pr.rimBand(198, 228, 11, 9, 0.5, '#6d4c41');
      bg += pr.box3(182, 204, 26, 16, 8, '#6d4c41');
      const bookCols = ['#8e44ad', '#ff5d8f', '#5b7fa6', '#ffb08a', '#5ec96f'];
      let books = '';
      bookCols.forEach((c, i) => { books += '<polygon class="book-layer" points="' + pr.pts([pr.P(184, 206, 8.5 + i * 2.2), pr.P(204, 206, 8.5 + i * 2.2), pr.P(204, 218, 8.5 + i * 2.2), pr.P(184, 218, 8.5 + i * 2.2)]) + '" fill="' + c + '"/>'; });
      bg += '<g id="study-books-library-in" class="study-books">' + books + '</g>';
      // 新書推薦展示櫃（全 bg）＋標題＋書脊
      bg += pr.box3(996, 110, 88, 14, 40, '#8a6bc9');
      bg += txt(pr.P(1040, 117, 46), '新書推薦', 10, '#ffe9b8', 'middle');
      [[1006, '#ff5d8f'], [1021, '#ffcc00'], [1036, '#3a6ea5'], [1051, '#9b59b6']].forEach(([sx, sc2]) => { bg += faceRect(sx, 124.6, 12, 8, 32, sc2); });
      // 入口墊
      bg += pr.box3(515, 264, 120, 28, 2, '#a15c72');
      bg += txt(pr.P(575, 283, 4), '入 口', 11, '#ffe9b8', 'middle');
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + LIB_PW + ' 300" style="position:absolute; left:0; top:0; width:' + LIB_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      bg += stairSvg(pr); // v9.65 樓梯間（2F 上下樓）
      return svgOpen('lib-bg25', 0) + bg + roomShell(pr, WH, 300) + sceneDecor(pr, 'library') + '</svg>' + svgOpen('lib-front25', 950) + front + '</svg>'
        + '<button class="lib-rec-book" onpointerdown="event.stopPropagation()" onclick="borrowBook()">📖 借推薦書</button>';
    }

    let _libPanManual = null;
    let _libManualUntil = 0;
    let _libPanCur = 0; let _libPanT = 0;
    let _libWasIn = false;
    let _libLightKey = '';
    const applyLibraryPan = makePanApplier('lib-rooms', (v) => { _libPanCur = v; });
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
      const host = document.querySelector('#landmark-library .island-mount-top') || document.querySelector('#landmark-library .island-mount') || document.getElementById('landmark-library'); // v9.72 解綁：stage 回圖書館自己島
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
      { const fsHere = !!(window.__FS_FIT && window.__FS_FIT.active === 'library'); const wo = fsHere ? '' : '0'; if (stage.style.opacity !== wo) stage.style.opacity = wo; stage.style.pointerEvents = fsHere ? '' : 'none'; } // v9.99 小鎮表面不攤室內（只在電視/FS 顯示）
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
      const PAL = ['#ff5d8f', '#5b7fa6', '#5ec96f', '#ffb08a', '#8e44ad', '#e65c00', '#27ae60', '#7d8fc9', '#ff5d8f', '#ffcc00'];
      const spineRow = (x0, x1, zF, hBot, hTop, seed) => { let o = ''; let cx = x0; let i = seed; while (cx < x1 - 10) { const bw = 9 + ((i * 37) % 5); const bh = (hTop - hBot) - ((i * 53) % 7); o += faceRect(cx, zF, bw, hBot, hBot + Math.max(10, bh), PAL[i % 10]); cx += bw + 2; i++; } return o; };
      let bg = '', front = '';
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(0, 0, WH)], '#f7ead9');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#f7ead9', 0.8));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#d9a066');
      bg += floorBands(pr, poly, '#c98d54', 0.45, 44, 0, 1150, 0, 300);
      // 社團名牌＋海報牆
      bg += pr.wallDecoN(330, 700, 96, 150, '#7d8fc9');
      bg += txt(pr.P(515, 0, 132), '社團活動室', 15, '#ffffff', 'middle');
      bg += txt(pr.P(515, 0, 112), 'CLUB ROOM ・ 3F', 9, '#aee6fa', 'middle');
      bg += faceRect(52, 0.6, 92, 66, 128, '#ff5d8f') + txt(pr.P(66, 0, 108), '美術社', 10, '#ffffff');
      bg += faceRect(168, 0.6, 92, 66, 128, '#5b7fa6') + txt(pr.P(182, 0, 108), '音樂社', 10, '#ffffff');
      bg += faceRect(724, 0.6, 92, 66, 128, '#5ec96f') + txt(pr.P(738, 0, 108), '棋藝社', 10, '#ffffff');
      bg += faceRect(840, 0.6, 92, 66, 128, '#ffb08a') + txt(pr.P(854, 0, 108), '天文社', 10, '#ffffff');
      // 東窗
      bg += pr.wallDecoN(968, 1104, 66, 142, '#bedcfe');
      const wx1 = pr.P(1036, 0, 66), wx2 = pr.P(1036, 0, 142), wy1 = pr.P(968, 0, 104), wy2 = pr.P(1104, 0, 104);
      bg += '<line x1="' + wx1.x.toFixed(1) + '" y1="' + wx1.y.toFixed(1) + '" x2="' + wx2.x.toFixed(1) + '" y2="' + wx2.y.toFixed(1) + '" stroke="#5c2e3e" stroke-width="2"/><line x1="' + wy1.x.toFixed(1) + '" y1="' + wy1.y.toFixed(1) + '" x2="' + wy2.x.toFixed(1) + '" y2="' + wy2.y.toFixed(1) + '" stroke="#5c2e3e" stroke-width="2"/>';
      // 西側書櫃（社團資料/作品）
      bg += pr.box3(30, 6, 200, 20, 130, '#6d4c41');
      bg += spineRow(38, 222, 26.6, 92, 122, 4) + spineRow(38, 222, 26.6, 48, 78, 9);
      bg += faceRect(27, 26.6, 206, 86, 89, '#a15c72') + faceRect(27, 26.6, 206, 42, 45, '#a15c72');
      // 鋼琴（西北）：琴身＋掀蓋＋琴鍵
      bg += pr.box3(268, 92, 120, 64, 26, '#1a1a24');
      bg += poly([pr.P(268, 92, 26), pr.P(388, 92, 26), pr.P(388, 128, 46), pr.P(268, 128, 46)], '#26324b');
      bg += faceRect(270, 156.6, 116, 17, 24, '#ffffff');
      bg += faceRect(270, 156.6, 116, 21, 24, '#1a1a24');
      // 中央地毯＋三張社團長桌（南面進 front）＋椅子
      bg += pr.planeCircle(575, 218, 0, 165, '#aee6fa', 0.30);
      [[300], [545], [790]].forEach(([tx]) => {
        const tb = pr.boxFaces(tx, 148, 150, 46, 12, '#d98a68');
        bg += tb.back; front += tb.front;
        bg += poly([pr.P(tx + 18, 158, 12.4), pr.P(tx + 44, 158, 12.4), pr.P(tx + 44, 176, 12.4), pr.P(tx + 18, 176, 12.4)], '#f5f0e6');
        bg += poly([pr.P(tx + 96, 160, 12.4), pr.P(tx + 118, 160, 12.4), pr.P(tx + 118, 174, 12.4), pr.P(tx + 96, 174, 12.4)], '#ff5d8f');
      });
      [[330], [445], [560], [675], [790], [905]].forEach(([sx]) => { bg += pr.box3(sx - 15, 200, 30, 10, 9, '#6d4c41'); });
      // 沙發（東南，避開樓梯間）
      const sofa = pr.boxFaces(856, 234, 118, 38, 13, '#8e44ad');
      bg += sofa.back; front += sofa.front;
      bg += pr.box3(856, 226, 118, 8, 26, '#8e44ad');
      // 樓梯間＋入口墊
      bg += stairSvg(pr);
      bg += pr.box3(515, 264, 120, 28, 2, '#a15c72');
      bg += txt(pr.P(575, 283, 4), '入 口', 11, '#ffe9b8', 'middle');
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + CLUB_PW + ' 300" style="position:absolute; left:0; top:0; width:' + CLUB_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      return svgOpen('club-bg25', 0) + bg + roomShell(pr, WH, 300) + sceneDecor(pr, 'club') + '</svg>' + svgOpen('club-front25', 950) + front + '</svg>';
    }
    let _clubPanManual = null;
    let _clubManualUntil = 0;
    let _clubPanCur = 0; let _clubPanT = 0;
    let _clubWasIn = false;
    const applyClubPan = makePanApplier('club-rooms', (v) => { _clubPanCur = v; });
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
      const host = document.querySelector('#landmark-school .island-mount-top') || document.querySelector('#landmark-school .island-mount') || document.getElementById('landmark-school');
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
      const PAL = ['#ff5d8f', '#5b7fa6', '#5ec96f', '#ffb08a', '#8e44ad', '#e65c00', '#27ae60', '#7d8fc9', '#ff5d8f', '#ffcc00'];
      const spineRow = (x0, x1, zF, hBot, hTop, seed) => { let o = ''; let cx = x0; let i = seed; while (cx < x1 - 10) { const bw = 9 + ((i * 37) % 5); o += faceRect(cx, zF, bw, hBot, hTop, PAL[i % PAL.length]); cx += bw + 2; i++; } return o; };
      let bg = '', front = '';
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 0, WH), pr.P(0, 0, WH)], '#fdf0f5');
      bg += poly([pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(1150, 300, WH), pr.P(1150, 0, WH)], PROJ.shade('#fdf0f5', 0.8));
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#d9a066');
      bg += floorBands(pr, poly, '#c98d54', 0.45, 44, 0, 1150, 0, 300);
      bg += pr.wallDecoN(400, 750, 96, 150, '#7d8fc9');
      bg += txt(pr.P(575, 0, 132), '自 習 室', 15, '#ffffff', 'middle');
      bg += txt(pr.P(575, 0, 112), 'STUDY ROOM ・ 2F', 9, '#aee6fa', 'middle');
      bg += pr.wallDecoN(968, 1104, 66, 142, '#bedcfe');
      const wx1 = pr.P(1036, 0, 66), wx2 = pr.P(1036, 0, 142), wy1 = pr.P(968, 0, 104), wy2 = pr.P(1104, 0, 104);
      bg += '<line x1="' + wx1.x.toFixed(1) + '" y1="' + wx1.y.toFixed(1) + '" x2="' + wx2.x.toFixed(1) + '" y2="' + wx2.y.toFixed(1) + '" stroke="#5c2e3e" stroke-width="2"/><line x1="' + wy1.x.toFixed(1) + '" y1="' + wy1.y.toFixed(1) + '" x2="' + wy2.x.toFixed(1) + '" y2="' + wy2.y.toFixed(1) + '" stroke="#5c2e3e" stroke-width="2"/>';
      bg += pr.box3(30, 6, 200, 20, 130, '#6d4c41');
      bg += spineRow(38, 222, 26.6, 92, 122, 7) + spineRow(38, 222, 26.6, 48, 78, 3);
      bg += faceRect(27, 26.6, 206, 86, 89, '#a15c72') + faceRect(27, 26.6, 206, 42, 45, '#a15c72');
      const DESKS = [[430, 185], [590, 185], [750, 185], [430, 250], [590, 250], [750, 250]];
      DESKS.forEach((dsk, i) => {
        const sx = dsk[0], sy = dsk[1];
        const dk = pr.boxFaces(sx - 28, sy - 40, 56, 26, 11, '#d98a68');
        bg += dk.back; front += dk.front;
        bg += pr.box3(sx - 11, sy - 38, 22, 12, 3, PAL[i % PAL.length]);
        bg += pr.box3(sx - 14, sy - 6, 28, 12, 8, '#5b7fa6');
      });
      bg += txt(pr.P(575, 283, 4), '入 口', 11, '#ffe9b8', 'middle');
      const svgOpen = (id, z) => '<svg id="' + id + '" viewBox="0 0 ' + STUDY_PW + ' 300" style="position:absolute; left:0; top:0; width:' + STUDY_PW + 'px; height:300px;' + (z ? ' z-index:' + z + ';' : '') + ' pointer-events:none;">';
      return svgOpen('study-bg25', 0) + bg + roomShell(pr, WH, 300) + sceneDecor(pr, 'study') + '</svg>' + svgOpen('study-front25', 950) + front + '</svg>';
    }
    let _studyPanManual = null;
    let _studyManualUntil = 0;
    let _studyPanCur = 0; let _studyPanT = 0;
    let _studyWasIn = false;
    const applyStudyPan = makePanApplier('study-rooms', (v) => { _studyPanCur = v; });
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
      const host = document.querySelector('#landmark-school .island-mount-top') || document.querySelector('#landmark-school .island-mount') || document.getElementById('landmark-school');
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
      if (typeof fsUnifySchoolPan === 'function') fsUnifySchoolPan(); // v9.101 每幀最後統一三層 pan（渲染對齊）
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
      bg += poly([pr.P(0, 0, 0), pr.P(1150, 0, 0), pr.P(1150, 300, 0), pr.P(0, 300, 0)], '#d98a68');
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
        bg += '<line x1="' + top.x.toFixed(1) + '" y1="' + top.y.toFixed(1) + '" x2="' + bot.x.toFixed(1) + '" y2="' + bot.y.toFixed(1) + '" stroke="#5c2e3e" stroke-width="2"/>';
        bg += pr.planeCircle(x, 76, 0, 30, '#ffcf5c', 0.30);
        bg += '<polygon points="' + (bot.x - 14).toFixed(1) + ',' + bot.y.toFixed(1) + ' ' + (bot.x + 14).toFixed(1) + ',' + bot.y.toFixed(1) + ' ' + (bot.x + 8).toFixed(1) + ',' + (bot.y + 12).toFixed(1) + ' ' + (bot.x - 8).toFixed(1) + ',' + (bot.y + 12).toFixed(1) + '" fill="#d9a066" stroke="#5c2e3e" stroke-width="1.5"/>';
      });
      // 鐵板吧台（盒）：廚師崗位 z143 在北緣 146 之北，h15 由 frontHMax(3, 25, 6)=20.1 保證不蓋臉
      const counter = pr.boxFaces(60, 146, 520, 34, 15, '#795548');
      bg += counter.back; front += counter.front;
      bg += poly([pr.P(66, 150, 15.6), pr.P(574, 150, 15.6), pr.P(574, 176, 15.6), pr.P(66, 176, 15.6)], '#7d8fc9');
      [[120, '#ff8fab'], [210, '#4fce7e'], [388, '#ff5d8f'], [470, '#ffcc00']].forEach(([fx, fc]) => { bg += pr.planeCircle(fx, 163, 15.8, 6, fc); });
      [120, 200, 280, 360, 440, 520].forEach(x => { bg += pr.box3(x - 11, 186, 22, 12, 9, '#a15c72'); });
      // 圓桌：桌面 planeCircle＋南緣弧帶（front）＋桌柱
      REST_TABLES.forEach((t, i) => {
        bg += pr.planeCircle(t.x, t.z, 0, 13, '#dcebf5');
        bg += pr.box3(t.x - 5, t.z - 5, 10, 10, 5, '#a15c72');
        bg += pr.planeCircle(t.x, t.z, 14, 36, '#ffe9f4');
        bg += pr.planeCircle(t.x, t.z, 14.6, 33, '#ffffff');
        bg += pr.planeCircle(t.x, t.z, 15.2, 7, i ? '#ffb08a' : '#ff5d8f');
        front += pr.rimBand(t.x, t.z, 36, 14, 5, '#f5f0e6');
      });
      [[738, 190], [802, 190], [958, 238], [1022, 238]].forEach(([sx, sy]) => { bg += pr.box3(sx - 9, sy - 2, 18, 10, 9, '#a15c72'); });
      // 冰箱（高盒）＋字在南面
      const fridge = pr.boxFaces(900, 36, 60, 28, 50, '#2e5f8a');
      bg += fridge.back; front += fridge.front;
      front += txt(pr.P(922, 64, 30), 5, '食', 15, '#ffffff');
      // 盆栽
      bg += pr.box3(1082, 96, 26, 14, 10, '#b04a3a');
      const pc = pr.P(1095, 103, 0);
      bg += '<circle cx="' + pc.x.toFixed(1) + '" cy="' + (pc.y - 26).toFixed(1) + '" r="12" fill="#4fce7e"/><circle cx="' + (pc.x - 9).toFixed(1) + '" cy="' + (pc.y - 18).toFixed(1) + '" r="8" fill="#5ec96f"/><circle cx="' + (pc.x + 9).toFixed(1) + '" cy="' + (pc.y - 19).toFixed(1) + '" r="8" fill="#5ec96f"/>';
      // 入口墊
      bg += pr.box3(550, 264, 120, 28, 2, '#a15c72');
      bg += txt(pr.P(597, 283, 4), 0, '入 口', 11, '#ffe9b8');
      return '<svg id="rest-bg25" viewBox="0 0 ' + REST_PW + ' 300" style="position:absolute; left:0; top:0; width:' + REST_PW + 'px; height:300px;">' + bg + roomShell(pr, WH, 300) + sceneDecor(pr, 'rest') + '</svg>'
        + '<svg id="rest-front25" viewBox="0 0 ' + REST_PW + ' 300" style="position:absolute; left:0; top:0; width:' + REST_PW + 'px; height:300px; z-index:950; pointer-events:none;">' + front + '</svg>';
    }
    function ensureRestInterior() {
      if (document.getElementById('rest-stage')) return;
      const host = document.querySelector('#landmark-restaurant .island-mount-top') || document.querySelector('#landmark-restaurant .island-mount') || document.getElementById('landmark-restaurant');
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
    const applyRestPan = makePanApplier('rest-rooms', (v) => { _restPanCur = v; });
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
      { const fsHere = !!(window.__FS_FIT && window.__FS_FIT.active === 'rest'); const wo = fsHere ? '' : '0'; if (stage.style.opacity !== wo) stage.style.opacity = wo; stage.style.pointerEvents = fsHere ? '' : 'none'; } // v9.99 小鎮表面不攤室內（只在電視/FS 顯示）
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
    const BREAK_CHAT_LINES = DLG.breakLines; // v9.83 C 批：本體移至 DLG
    const BREAK_CHAT_REPLIES = DLG.breakReplies; // v9.83 C 批：本體移至 DLG
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
    const TEACHER_ROAM_LINES = DLG.teacherRoam; // v9.83 C 批：本體移至 DLG
    function tickBreakAmbiance(npc, progressMinutes) {
      if (typeof schoolPhaseNow !== 'function' || schoolPhaseNow() !== 'break') return;
      npc.breakActCd = (npc.breakActCd == null ? 1 + Math.random() * 3 : npc.breakActCd) - progressMinutes;
      if (npc.breakActCd > 0) return;
      npc.breakActCd = 3 + Math.random() * 5;
      const mode = npc.breakMode;
      if (mode === 'chat') {
        npcSay(npc, dlgPick('break.lines', BREAK_CHAT_LINES));
        const partner = (gameState.npcs || []).find(o => o !== npc && o.breakMode === 'chat' && Math.abs(o.x - npc.x) < 140 && Math.abs(o.y - npc.y) < 60);
        if (partner && Math.random() < 0.5) { partner._sayUntil = 0; npcSay(partner, dlgPick('break.replies', BREAK_CHAT_REPLIES)); }
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
