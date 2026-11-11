// ============================================================
// 世界聖經・機器可讀版（Art Bible v1.0, 2026-11-06）
// 人讀版：~/workspace/xueba/ART_BIBLE.md。改規格先改這裡＋文件，再施工。
// ============================================================
window.BIBLE = {
  // ---- 色票總表（全遊戲相異 hex 上限 120；新色先進表） ----
  PALETTE: {
    // UI 核心（承 v9.37 :root 美術憲法）
    paper: '#fff5f9', ink: '#5c2e3e', ink2: '#4a2432', sun: '#ffd43b', stroke: '#7c4a63', card: '#ffffff', terra: '#ffb08a', brick: '#ff5d8f', sage: '#5ec96f', sage2: '#a8bf8a', moss: '#2f8f57', amber: '#ff9f0a',
    tang: '#e65c00', skyBlue: '#5aa9e6', leaf: '#5ec96f', rose: '#ff5d8f', grape: '#c39bf0',
    cocoa: '#3c2415', muted: '#8d7f9e', white: '#ffffff', cream: '#fdf0f5',
    // v9.61 靜音表面色（大面積表面專用；鮮色只留識別與重點）＋鮮豔度量測定義：vivid = HSV 的 s×v > 0.35（感知彩度）
    woodMut: '#a15c72', leafMut: '#5ec96f', steel: '#5b7fa6',
    // 光影
    glowWarm: '#ffc86e', glowCool: '#bedcfe', spray: '#fff3d6', moon: '#ffe9b8',
    starlight: '#ffe9a8', deep: '#0f1428', navy: '#232f47',
    // 地表
    grassLight: '#a4c68a', grass: '#8fe3a8', grassDeep: '#5ec96f', parkLight: '#9cbd8b',
    park: '#8fe3a8', dirt: '#c9a06a', sand: '#ffe9a8', road: '#4a4a55', roadLine: '#ffd43b',
    sidewalk: '#e8d8ee', water: '#8fc9f2', waterDeep: '#5aa9e6', pond: '#a8c8bc',
    // 材質
    woodDark: '#6d4c41', wood: '#a15c72', woodLight: '#d98a68', plank: '#b0743e',
    counter: '#795548', metal: '#b8a6c9', glass: '#ffeef7', floorHome: '#d9a066',
    // 建築識別（同棟同色：一棟一色，名牌＝晶片＝招牌＝accent）
    home: '#ff8fab', store: '#2fd48c', restaurant: '#ff5d8f', school: '#7d8fc9',
    library: '#b79ced', gym: '#ffd43b',
    // 角色
    skin: '#fed7aa', skinShade: '#f0b98a', clothesRed: '#cd5f43', clothesBlue: '#527fa8',
    clothesPurple: '#a678e0', clothesPink: '#ff8fab', clothesYellow: '#ffd43b',
    clothesGreen: '#5ec96f', clothesBlack: '#3a2430', denim: '#4a6f8f',
    // 食物
    rice: '#f5f0e6', curry: '#f0a832', noodle: '#ffd43b', meat: '#ff8fab', tea: '#b0743e', milk: '#fff6e8',
    // 狀態（語意色，玩法辨識優先，不可被色票收斂犧牲）
    energy: '#ffb08a', xp: '#a678e0', heart: '#ff6b8a', coin: '#ffd43b', danger: '#ff5d8f', info: '#527fa8',
    // 場景 staples（家具/陳設常用，批次 4 收斂時以此為準）
    board: '#8a6bc9', sofaRed: '#b04a3a', sofaBlue: '#527fa8', bookA: '#ff5d8f', bookB: '#5aa9e6',
    bookC: '#5ec96f', bookD: '#ffb08a', bookE: '#a678e0', blanketBlue: '#8fc9f2', blanketPink: '#ffb3c9',
    plantGreen: '#5f8f52', plantPot: '#a15c33', lampShade: '#ffcf5c', curtain: '#ffe9f4',
    tileWhite: '#fff5f9', tileLine: '#d8cdb4', deskTop: '#c98d54', chairWood: '#9c6b43'
  },
  // ---- 同棟同色（批次 2/4/6 引用） ----
  BUILDING: {
    home: { identity: '#ff8fab' }, store: { identity: '#2fd48c' }, restaurant: { identity: '#ffb08a' },
    school: { identity: '#6ec3ff' }, library: { identity: '#b79ced' }, gym: { identity: '#ffd43b' }
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

// ===== v9.83 C 批 dialogue 資料化：全遊戲台詞單一資料表 DLG（154 句，逐句原文）＋防短期重複選句器 =====
// 情境鍵只用既有數據源（主角狀態/地點、說話者、parentsStatus、場景）；遊戲無天氣系統，不造天氣鍵。
const DLG = {
  hero: {
    sleeping: [
      '在夢裡我已經是終極學神了...',
      '原來微積分在夢裡是用中文寫的...',
      '不要吵我，我正在解一題很難的夢境題...',
      '呼...吸...考卷請不要發下來...',
      '老師，我沒有睡著，我只是閉眼思考宇宙奧秘...',
      '等我醒來，全校都要叫我葉大帥的傳人...',
      '夢到考試沒寫名字，驚醒發現真的沒寫...',
      '呼嚕...我的大腦正在進行磁碟重組...'
    ],
    studying_school: [
      '這題連 AI 都要算三秒，我怎麼可能一秒答對！',
      '我與學神的距離，只差一個偷看答案的機會。',
      '書本的香味，怎麼聞起來很像好市多的烤雞...',
      '我的腦袋裡有 99% 的空間在想中午吃什麼...',
      '眼前的黑不是黑，是我的眼皮正在做地心引力實驗...',
      '老師講的每個字我都懂，但連在一起就像魔法咒語...',
      '讀書是為了走更長遠的路，但我現在腳好酸...',
      '課本的字好密，看得我眼睛都快自動對焦到窗外了...'
    ],
    studying_library: [
      '圖書館的冷氣好舒服，適合...啊不，是適合讀書！',
      '隔壁同學翻書好快，是在用物理超度課本嗎？',
      '我懷疑這本書在對我催眠，而它成功了...',
      '複習中...感覺我的記憶體（RAM）快要不足了...',
      '這題微積分已經折磨了我三代祖宗...',
      '看著這行公式，我腦海中浮現了阿嬤的笑臉...',
      '聽說多讀書能防脫髮，但我怎麼覺得頭皮涼涼的...'
    ],
    eating: [
      '吃鐵板燒是為了給大腦補充能量，絕對不是我想偷懶！',
      '熱量就是知識，我現在正在瘋狂攝取知識中...',
      '廚師炒菜的手速，要是我寫考卷有這速度就好了...',
      '今天的肉好嫩，我的肝希望也能跟這肉一樣嫩...',
      '吃飽了才有力氣繼續跟討厭的數學題決鬥！',
      '大腦運作需要大量卡路里，我這是在為了學業做出犧牲！',
      '鐵板香氣撲鼻，這一刻我覺得我已經解鎖了幸福的真諦。'
    ],
    sports: [
      '流的不是汗，是當初選這門課時腦袋進的水...',
      '跑步能降壓力，但我的體力正呈指數型衰退中...',
      '如果跑步的速度等於我忘記英文單字的速度，我已超光速！',
      '風好大，我的頭髮跟我的成績一樣隨風飄揚...',
      '操場這條路，比我人生的路還要漫長...',
      '再跑一圈！我的脂肪正在燃燒，我的智商好像也是...',
      '操場上的小人正在努力不讓自己看起來像個肉球...'
    ],
    working: [
      '歡迎光臨！請問需要加熱還是需要幫您寫微積分？',
      '刷條碼的手速練好，以後畫卡一定能快三秒！',
      '店長說這盒報廢便當歸我了，這就是打工的最高境界！',
      '半夜來買關東煮的客人，看起來也像剛被考卷摧殘過...',
      '賺錢繳房租！我真是個獨立自主的學霸！',
      '叮咚！聽到超商門鈴聲，我的右手就會自動舉起來刷條碼...'
    ],
    commuting: [
      '趕路中！兩條腿就是我的高鐵，速限是多少？',
      '這路程要是能用哆啦A夢的傳送門該有多好...',
      '遲到是平凡人的專利，學霸只會提早抵達！',
      '走這麼快，不知道能不能觸發時間膨脹效應...',
      '路邊的小草，你是不是也在為我的奔跑而鼓掌？',
      '趕路好累，等一下去餐廳一定要多吃兩碗白飯。'
    ],
    angry: [
      '啊啊啊！我是一隻被考卷逼瘋的憤怒學霸！',
      '壓力大到我想去跟操場上的電線桿單挑！',
      '別惹我，我現在隨時能背出圓周率後一百位！',
      '題目再這麼難，我就要寫聯絡簿跟葉大帥告狀了！',
      '我的大腦 CPU 已經 100% 滿載，快要冒煙了！',
      '學什麼學！我現在只想當一隻快樂的鹹魚！'
    ],
    idle: [
      '人生就像微積分，大部份時候都不知道自己在算什麼...',
      '我發呆的時候，大腦其實在進行量子力學的運算。',
      '只要我不讀書，就沒有人能夠在成績上超越我！',
      '今天天氣真好，適合把課本拿來蓋在臉上遮陽...',
      '發呆是為了與更高維度的智慧宇宙進行通訊...',
      '摸魚一時爽，一直摸魚一直爽...不對，我是學霸！',
      '我是誰？我在哪？為什麼微積分要出現在這個世界上？'
    ],
  },
  heroOrphan: {
    sleeping: [
      '沒有爸媽盯著，連夢話都變得自由了...',
      '終於不用再聽爸媽的打呼聲，睡得真香！',
      '一個人的雙人大床，滾來滾去超爽的！'
    ],
    idle: [
      '爸媽離家出走後，家裡變得好安靜啊...',
      '少了爸媽的碎碎唸，我的壓力突然狂降！',
      '我在考慮要不要去拜託耶穌幫我把爸媽復活一下...',
      '沒有爸媽盯著，我摸魚的時間都變長了！'
    ],
  },
  npc: {
    jie: [
      '「這週的獎學金，我先預約了。」',
      '「我準備好了，你呢？」'
    ],
    kui: [
      '「嘻嘻，我好像比較快喔～」',
      '「我隨時可以考囉！」'
    ],
    shu: [
      '「一步一腳印，我先到了。」',
      '「準備完成，等你一起考。」'
    ],
    xiaoxuan: [
      '「一起加油！」',
      '「今天也要坐第一排！」'
    ],
    dameng: [
      '「打完球吃雞排最爽！」',
      '「要不要一起跑兩圈？」'
    ],
    yuqing: [
      '「圖書館角落最安靜。」',
      '「送你一句讀書秘訣。」'
    ],
    xiaohao: [
      '「這家超好吃！」',
      '「我請客，別客氣！」'
    ],
    teacher: [
      '「上課認真！」',
      '「這題考試會考。」'
    ],
    clerk: [
      '「叮咚！歡迎光臨！」',
      '「關東煮很好吃喔！」'
    ],
    librarian: [
      '「請保持安靜喔。」',
      '「這本書很推薦！」'
    ],
    chef: [
      '「拉麵現煮中！」',
      '「鐵板燒好了！」'
    ],
    coach: [
      '「跑起來！」',
      '「再兩圈！」'
    ],
    clerk2: [
      '「大夜班，歡迎光臨。」',
      '「關東煮還有喔。」',
      '「泡麵配窗邊，深夜限定。」'
    ],
    dad: [
      '「早點睡，別熬夜。」',
      '「考試加油！」'
    ],
    mom: [
      '「飯煮好了，快來吃。」',
      '「天冷了多穿點。」'
    ],
  },
  dinner: {
    mom: [
      '多吃點，看你瘦的。',
      '今天在學校好嗎？',
      '這道是你最愛吃的。',
      '慢點吃，鍋裡還有。'
    ],
    dad: [
      '吃慢點，沒人跟你搶。',
      '功課有不懂的，晚上問我。',
      '最近考試順利嗎？',
      '嗯，好吃，你媽手藝越來越好了。'
    ],
  },
  parkOpen: [
    '今天天氣也太好了吧！',
    '你們晚餐想吃什麼？',
    '我昨天打電動打到半夜，超爽',
    '欸欸，聽說食堂明天有新菜單',
    '最近有什麼好看的影片推薦嗎？',
    '假日一起去打球啦',
    '我跟你們說，我昨天做了一個超怪的夢',
    '這邊風好涼，超舒服的',
    '你們複習得怎麼樣了？',
    '走啦，等下一起去超商買冰'
  ],
  parkReply: [
    '真的！我也這麼覺得',
    '哈哈哈你也太好笑',
    '好啊好啊，算我一個',
    '我懂我懂，那個超讚的',
    '蛤？真的假的',
    '對啊，我媽也這樣說',
    '那走啊，現在就去',
    '噓——小聲一點啦',
    '我上次也是這樣！',
    '好主意，揪！'
  ],
  breakLines: [
    '昨天的卡通超好看！',
    '等一下要不要去福利社？',
    '我跟你說喔…',
    '下節課要小考欸',
    '你午餐想吃什麼？',
    '假日我去打球了',
    '這本漫畫超推！',
    '老師剛剛講的我有聽懂'
  ],
  breakReplies: [
    '真的假的！',
    '好啊好啊',
    '哈哈哈',
    '我也是！',
    '蛤～真的喔',
    '借我看！',
    '讚喔'
  ],
  teacherRoam: [
    '都坐好，老師看一下',
    '嗯，這組很認真',
    '安靜一點點就好',
    '有問題舉手問老師',
    '寫完的先檢查一遍'
  ],
  noodle: [
    '「深夜的泡麵，特別好吃。」',
    '「呼…整天累都散了。」',
    '「窗外沒人，只有這間店還亮著。」',
    '「明天…再加油吧。」',
    '「阿哲的關東煮也不錯。」',
    '「這個時間還醒著的，都是有故事的人。」'
  ],
};
const _dlgRecent = {};
function dlgPick(key, arr) {
  if (!arr || !arr.length) return null;
  if (arr.length === 1) return arr[0];
  const rec = _dlgRecent[key] || (_dlgRecent[key] = []);
  const ban = new Set(rec.slice(-Math.min(2, arr.length - 1)));
  const pool = arr.filter(function (x) { return !ban.has(x); });
  const s = pool[Math.floor(Math.random() * pool.length)];
  rec.push(s); if (rec.length > 6) rec.shift();
  return s;
}
