// ============================================================
// proj.js — v9.50 2.5D 投影模組（全場景單一出處）
// 規格：2.5D 化完整修正報告 §2（3/4 斜視角、雙規格 K：室內 0.90／小鎮 1.10）
// 地面座標系：x 向東、z 向南、h 高度（單位＝場景邏輯像素）
//   P(x, z, h) = ( OX + x + z*0.55*K , OY + z*0.42*K - h )
// 玩法邏輯零改動：本模組只負責「邏輯座標 → 螢幕多邊形」的渲染換算。
// ============================================================
(function () {
  'use strict';

  // 色階：上面 ×1.24（亮）、南面 ×1.00、東面 ×0.60（暗）——光源在西北上方
  function shade(hex, f) {
    if (typeof hex !== 'string' || hex[0] !== '#') return hex;
    var n = parseInt(hex.slice(1), 16);
    if (!isFinite(n)) return hex;
    var r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * f)));
    var g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * f)));
    var b = Math.max(0, Math.min(255, Math.round((n & 255) * f)));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // 凸多邊形相交（SAT）——驗收幾何檢查用；points 為 [[x,y],...]
  function polysIntersect(a, b) {
    var polys = [a, b];
    for (var p = 0; p < 2; p++) {
      var poly = polys[p];
      for (var i = 0; i < poly.length; i++) {
        var p1 = poly[i], p2 = poly[(i + 1) % poly.length];
        var ax = -(p2[1] - p1[1]), ay = p2[0] - p1[0];
        var minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
        for (var j = 0; j < a.length; j++) { var d = a[j][0] * ax + a[j][1] * ay; if (d < minA) minA = d; if (d > maxA) maxA = d; }
        for (var k = 0; k < b.length; k++) { var e = b[k][0] * ax + b[k][1] * ay; if (e < minB) minB = e; if (e > maxB) maxB = e; }
        if (maxA < minB || maxB < minA) return false;
      }
    }
    return true;
  }

  var AXIS_TOWN = { dx: 0.55, dy: 0.42 }; // 小鎮 37°
  var AXIS_INDOOR = { dx: 0.489, dy: 0.489 }; // v9.67 室內 45° 定版：軸長同舊軸 |(0.55,0.42)|≈0.692、DX＝DY（R1 報告 A1）
  function makeProj(K, OX, OY, AX) {
    var ax = AX || AXIS_TOWN;
    function P(x, z, h) {
      return { x: OX + x + z * ax.dx * K, y: OY + z * ax.dy * K - (h || 0) };
    }
    function pts(list) {
      return list.map(function (p) { return (Array.isArray(p) ? p[0] : p.x).toFixed(1) + ',' + (Array.isArray(p) ? p[1] : p.y).toFixed(1); }).join(' ');
    }
    function polyOf(list) { return list.map(function (p) { return Array.isArray(p) ? p : [p.x, p.y]; }); }
    // 盒狀物三面（繪製順序：東面→南面→上面）
    function boxPolys(x, z, w, d, h) {
      return {
        east: polyOf([P(x + w, z, 0), P(x + w, z + d, 0), P(x + w, z + d, h), P(x + w, z, h)]),
        south: polyOf([P(x, z + d, 0), P(x + w, z + d, 0), P(x + w, z + d, h), P(x, z + d, h)]),
        top: polyOf([P(x, z, h), P(x + w, z, h), P(x + w, z + d, h), P(x, z + d, h)])
      };
    }
    function box3(x, z, w, d, h, color) {
      var b = boxPolys(x, z, w, d, h);
      return '<polygon points="' + pts(b.east) + '" fill="' + shade(color, 0.6) + '"/>'
        + '<polygon points="' + pts(b.south) + '" fill="' + color + '"/>'
        + '<polygon points="' + pts(b.top) + '" fill="' + shade(color, 1.24) + '"/>';
    }
    // 躺在平面上的圓：沿投影取樣 20 邊形（自動變斜橢圓）
    function planeCirclePts(x, z, h, r) {
      var out = [];
      for (var i = 0; i < 20; i++) {
        var a = i / 20 * Math.PI * 2;
        var p = P(x + Math.cos(a) * r, z + Math.sin(a) * r, h);
        out.push([p.x, p.y]);
      }
      return out;
    }
    function planeCircle(x, z, h, r, fill, opacity) {
      return '<polygon points="' + pts(planeCirclePts(x, z, h, r)) + '" fill="' + fill + '"' + (opacity != null ? ' opacity="' + opacity + '"' : '') + '/>';
    }
    // 接地影：往東南偏移（光在西北上），坐姿不得消失（取代精靈內烘焙影）
    function groundShadow(x, z, rx) {
      return planeCircle(x + rx * 0.35, z + rx * 0.3, 0, rx, 'rgba(30,16,4,0.30)');
    }
    // 北牆平面物：高度帶主面＋右側厚度邊（×0.62 暗）
    function wallDecoN(x0, x1, h0, h1, fill) {
      var t = 7;
      var main = polyOf([P(x0, 0, h0), P(x1, 0, h0), P(x1, 0, h1), P(x0, 0, h1)]);
      var side = polyOf([P(x1, 0, h0), P(x1 + t, 0, h0 + t * 0.75), P(x1 + t, 0, h1 + t * 0.75), P(x1, 0, h1)]);
      return '<polygon points="' + pts(main) + '" fill="' + fill + '"/>'
        + '<polygon points="' + pts(side) + '" fill="' + shade(fill, 0.62) + '"/>';
    }
    // 東牆平面物：沿深度軸的平行四邊形（xWall 為該場景東牆的邏輯 x）
    function wallDecoE(xWall, z0, z1, h0, h1, fill) {
      var m = polyOf([P(xWall, z0, h0), P(xWall, z1, h0), P(xWall, z1, h1), P(xWall, z0, h1)]);
      return '<polygon points="' + pts(m) + '" fill="' + shade(fill, 0.78) + '"/>';
    }
    // 投影後外接矩形（室內鏡頭/拖拽邊界用，R2：寧大勿小，另加邊距在呼叫端）
    function bounds(W, D, wallH) {
      var cs = [P(0, 0, 0), P(W, 0, 0), P(W, D, 0), P(0, D, 0), P(0, 0, wallH || 0), P(W, 0, wallH || 0), P(W, D, wallH || 0), P(0, D, wallH || 0)];
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      cs.forEach(function (c) { if (c.x < minX) minX = c.x; if (c.y < minY) minY = c.y; if (c.x > maxX) maxX = c.x; if (c.y > maxY) maxY = c.y; });
      return { minX: minX, minY: minY, maxX: maxX, maxY: maxY, w: maxX - minX, h: maxY - minY };
    }
    // 盒三面分層：back＝東面+上面（人物之下）、front＝南面（可蓋住站在北側的人）
    function boxFaces(x, z, w, d, h, color) {
      var b = boxPolys(x, z, w, d, h);
      return {
        back: '<polygon points="' + pts(b.east) + '" fill="' + shade(color, 0.6) + '"/><polygon points="' + pts(b.top) + '" fill="' + shade(color, 1.24) + '"/>',
        front: '<polygon points="' + pts(b.south) + '" fill="' + color + '"/>'
      };
    }
    // 圓桌南緣弧帶：桌沿厚度（上緣 hTop、下緣 hBot），只取南半弧
    function rimBand(cx, cz, r, hTop, hBot, fill) {
      var top = [], bot = [], i, a;
      for (i = 0; i <= 10; i++) { a = i / 10 * Math.PI; top.push(P(cx + Math.cos(a) * r, cz + Math.sin(a) * r, hTop)); }
      for (i = 10; i >= 0; i--) { a = i / 10 * Math.PI; bot.push(P(cx + Math.cos(a) * r, cz + Math.sin(a) * r, hBot)); }
      return '<polygon points="' + pts(top.concat(bot)) + '" fill="' + fill + '"/>';
    }
    // 人物臉部帶（billboard 軸對齊矩形）：錨點＝腳底/座位基線的投影點；
    // faceLow/faceHigh＝臉帶下/上緣距錨點的高度（場景單位，見 PROJ.FACE）
    function faceBandPoly(x, z, faceLow, faceHigh, halfW) {
      var a = P(x, z, 0);
      return [[a.x - halfW, a.y - faceHigh], [a.x + halfW, a.y - faceHigh], [a.x + halfW, a.y - faceLow], [a.x - halfW, a.y - faceLow]];
    }
    // 家具 h 上限（驗收 §5.1）：排在人物南方、北緣距人 gapZ 的家具，其頂緣（螢幕）須低於臉部下緣 clearance 以上
    // hMax = gapZ*0.42*K + faceLow - clearance（回傳值以下皆安全）
    // 注意：2.5D 下家具的螢幕佔高 = d*0.42K + h，深度自己貢獻高度，h 定版遠小於平面時代的前板帶高
    function frontHMax(gapZ, faceLow, clearance) {
      return gapZ * ax.dy * K + faceLow - clearance; // v9.67 跟投影軸走（室內 45° 後上限同步放寬）
    }
    return {
      K: K, OX: OX, OY: OY, P: P, pts: pts, box3: box3, boxPolys: boxPolys,
      planeCircle: planeCircle, planeCirclePts: planeCirclePts, groundShadow: groundShadow,
      wallDecoN: wallDecoN, wallDecoE: wallDecoE, bounds: bounds,
      faceBandPoly: faceBandPoly, frontHMax: frontHMax, polysIntersect: polysIntersect,
      boxFaces: boxFaces, rimBand: rimBand
    };
  }

  var _roomsRegistry = {};
  window.PROJ = {
    registerRooms: function (roomsId, proj) { _roomsRegistry[roomsId] = proj; },
    forRooms: function (roomsId) { return _roomsRegistry[roomsId] || null; },
    K_INDOOR: 0.90,   // 室內六棟（拍板雙規格）
    K_TOWN: 1.10,     // 小鎮外觀
    AXIS_TOWN: AXIS_TOWN,
    AXIS_INDOOR: AXIS_INDOOR,
    makeIndoor: function (K, OX, OY) { return makeProj(K, OX, OY, AXIS_INDOOR); }, // v9.67 室內 45° 專用入口（單一定義）
    // 人物臉部帶定版（場景單位，距座位/腳底錨點的高度區間 [low, high]）：
    // 站姿精靈高 50、臉 [錨點+25, 錨點+35]；坐姿下沉 6 → [19, 29]
    FACE: { STAND_LOW: 25, STAND_HIGH: 35, SEAT_LOW: 19, SEAT_HIGH: 29, HALF_W: 16 },
    shade: shade,
    make: makeProj,
    polysIntersect: polysIntersect
  };
})();
