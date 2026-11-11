// ============================================================
// 世界聖經・機器可讀版（Art Bible v1.0, 2026-11-06）
// 人讀版：~/workspace/xueba/ART_BIBLE.md。改規格先改這裡＋文件，再施工。
// ============================================================
window.BIBLE = {
  // ---- 色票總表（全遊戲相異 hex 上限 120；新色先進表） ----
  PALETTE: {
    // UI 核心（承 v9.37 :root 美術憲法）
    paper: '#fdf6e3', ink: '#4a3220', ink2: '#3a2718', sun: '#f2b544', stroke: '#5d4028', card: '#fffaf0', terra: '#c96f4a', brick: '#c2452d', sage: '#7fa663', sage2: '#a8bf8a', moss: '#5f7d5a', amber: '#ff9f0a',
    tang: '#e65c00', skyBlue: '#0a84ff', leaf: '#30d158', rose: '#ff2d55', grape: '#bf5af2',
    cocoa: '#3c2415', muted: '#5f5f66', white: '#ffffff', cream: '#efe9e0',
    // v9.61 靜音表面色（大面積表面專用；鮮色只留識別與重點）＋鮮豔度量測定義：vivid = HSV 的 s×v > 0.35（感知彩度）
    woodMut: '#8a6248', leafMut: '#5da85f', steel: '#5b7fa6',
    // 光影
    glowWarm: '#ffc86e', glowCool: '#bedcfe', spray: '#aee6fa', moon: '#ffe9b8',
    starlight: '#ffe9a8', deep: '#0f1428', navy: '#232f47',
    // 地表
    grassLight: '#8fd07a', grass: '#79bd67', grassDeep: '#5da85f', parkLight: '#85c173',
    park: '#6fbb72', dirt: '#c9a06a', sand: '#e8d8a8', road: '#4a4a55', roadLine: '#f7d038',
    sidewalk: '#b8bcc4', water: '#4aa3df', waterDeep: '#2980b9', pond: '#7fd4e8',
    // 材質
    woodDark: '#6d4c41', wood: '#8d5a2c', woodLight: '#a9743f', plank: '#b0743e',
    counter: '#795548', metal: '#7d868f', glass: '#cfe8f5', floorHome: '#d9a066',
    // 建築識別（同棟同色：一棟一色，名牌＝晶片＝招牌＝accent）
    home: '#e67e22', store: '#2ed573', restaurant: '#c0392b', school: '#2c3e50',
    library: '#1e8449', gym: '#ca6f1e',
    // 角色
    skin: '#fed7aa', skinShade: '#f0b98a', clothesRed: '#e74c3c', clothesBlue: '#3498db',
    clothesPurple: '#9b59b6', clothesPink: '#ff8fab', clothesYellow: '#f1c40f',
    clothesGreen: '#27ae60', clothesBlack: '#1a1a24', denim: '#2e5f8a',
    // 食物
    rice: '#f5f0e6', curry: '#d98e32', noodle: '#f7d038', meat: '#a93226', tea: '#b0743e', milk: '#fff6e8',
    // 狀態（語意色，玩法辨識優先，不可被色票收斂犧牲）
    energy: '#f39c12', xp: '#8e44ad', heart: '#ff5b6a', coin: '#f1c40f', danger: '#e74c3c', info: '#3498db',
    // 場景 staples（家具/陳設常用，批次 4 收斂時以此為準）
    board: '#2f5d3a', sofaRed: '#b04a3a', sofaBlue: '#3a6ea5', bookA: '#c0392b', bookB: '#2980b9',
    bookC: '#27ae60', bookD: '#f39c12', bookE: '#8e44ad', blanketBlue: '#5b84c4', blanketPink: '#e89bb0',
    plantGreen: '#3f9142', plantPot: '#a15c33', lampShade: '#ffd166', curtain: '#f3e2c7',
    tileWhite: '#eef2f0', tileLine: '#c8d2cc', deskTop: '#c98d54', chairWood: '#9c6b43'
  },
  // ---- 同棟同色（批次 2/4/6 引用） ----
  BUILDING: {
    home: { identity: '#e67e22' }, store: { identity: '#2ed573' }, restaurant: { identity: '#c0392b' },
    school: { identity: '#2c3e50' }, library: { identity: '#1e8449' }, gym: { identity: '#ca6f1e' }
  },
  // ---- 比例定版（批次 3 引用） ----
  SCALE: {
    PERSON_H: 50,          // 站姿墨高基準（單位）
    PERSON_W: 32,          // sprite 框寬
    SEATED_INK: 44,        // 坐姿墨高（主角/NPC 共用）
    SEAT_SINK: 6,          // 坐姿下沉量
    INDOOR_SCALE: 1.676, CAM_INDOOR_ZOOM: 2.4 /* 進場聚焦倍率（v9.56 定版值）：室內 0.7 島框 ×2.4 ≈ 戶外基準 */,   // 室內補償定版常數 = 300/179，禁止 clientHeight 浮動反推
    STAGE_H: 179,          // 舞台框高定版
    DOOR_RATIO: 1.3,       // 門洞高 ÷ 人高
    INK: '#3c2415'         // 描邊墨色（= PALETTE.cocoa）
  },
  // ---- UI token（批次 1 引用；CSS 側 :root 同步） ----
  UI: {
    R_WIN: '16px', R_CARD: '12px', R_PILL: '999px',
    SH_WIN: '0 18px 50px rgba(24, 32, 66, 0.35)',
    SH_SOFT: '0 4px 14px rgba(24, 32, 66, 0.16)',
    SH_HARD: '0 4px 0 #3c2415', SH_HARD_SM: '0 2px 0 #3c2415',
    OVERLAY: 'rgba(24, 32, 66, 0.55)'
  }
};

// ---- 圖示管線（批次 2）：emoji → 自繪 symbol 對照＋SVG 字串產生器 ----
// 場景/UI 一律經 emojiIcon() 轉換；對照表沒有的 emoji 回傳 null（呼叫端決定保留文字或用預設圖示）。
window.ICONMAP = {
  '🍛': 'curry', '🍜': 'noodle', '🍱': 'bento', '🍗': 'chicken', '🍔': 'burger', '🍙': 'rice',
  '🍚': 'rice', '🍲': 'soup', '🥗': 'bento', '🧃': 'drink', '🥤': 'drink', '🍦': 'icecream',
  '🍎': 'apple', '🍰': 'cake', '🍩': 'snack', '🍫': 'snack', '🍞': 'snack', '🥛': 'drink',
  '🤯': 'stress', '🔋': 'battery',
  '🍳': 'soup', '🏋️': 'dumbbell', '💼': 'clipboard',
  '💯': 'star', '🍖': 'chicken', '😌': 'heart', '💀': 'close', '🤬': 'stress', '💪': 'dumbbell', '🦉': 'book', '🤝': 'people', '💳': 'cash', '🛍️': 'basket', '❗': 'warn', '😢': 'stress', '🧠': 'flask', '⛪': 'building', '🌀': 'refresh', '💎': 'sparkle', '👔': 'shirt', '🏖️': 'home', '👑': 'medal',
  '⚠️': 'warn', '❌': 'close', '🎒': 'basket', '✍️': 'pencil', '🧬': 'flask', '🌌': 'sparkle', '🏛️': 'building', '🏙️': 'building', '🏕️': 'home',
  '🏠': 'home', '🏫': 'school', '📚': 'book', '📖': 'book', '🏃': 'run', '🏪': 'store',
  '📕': 'book', '📗': 'book', '📘': 'book', '🍮': 'cake', '🥫': 'snack', '🧴': 'drink',
  '🎓': 'cap', '🔔': 'bell', '🕐': 'clock', '⏰': 'clock', '✅': 'check', '✔️': 'check', '✕': 'close', '✖️': 'close',
  '🧭': 'compass', '🤖': 'robot', '🔒': 'lock', '❤️': 'heart', '💖': 'heart', '⭐': 'star', '🌟': 'star',
  '⚡': 'bolt', '📋': 'clipboard', '👕': 'shirt', '🎵': 'music', '🎶': 'music', '🎮': 'game',
  '🎁': 'gift', '💤': 'zzz', '☕': 'tea', '🖨️': 'print', '📄': 'print', '🛒': 'cart', '🧺': 'basket',
  '🧾': 'receipt', '💵': 'cash', '💰': 'coin', '↩️': 'back', '↩': 'back', '💬': 'chat',
  '✨': 'sparkle', '🏆': 'trophy', '🥇': 'medal', '✏️': 'pencil', '🏀': 'ball', '⚽': 'ball',
  '🛏️': 'bed', '🎰': 'dice', '🌙': 'moon', '📈': 'chartup', '🔥': 'flame', '🎨': 'pencil',
  '🧑': 'people', '👥': 'people', '🏗️': 'building', '⚙️': 'gear', '❓': 'help', '🪦': 'sign', '📜': 'receipt', '🎉': 'sparkle'
};
window.icoSvg = function (name, cls) {
  return '<svg class="pix-ico ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
};
window.emojiIcon = function (emoji, cls) {
  const n = window.ICONMAP[emoji];
  return n ? window.icoSvg(n, cls) : null;
};
