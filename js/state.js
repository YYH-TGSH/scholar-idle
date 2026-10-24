/* ==========================================================================
   🎮 GBA SCHOLAR IDLE - STATE & CORE DATA ENGINE (v9.4.0)
   音效、台詞、等級、全域狀態、存讀檔、增益、成就、好友與輪迴
   ========================================================================== */

    // ------------------------------------------
    // 🛡️ v8.2 安全儲存層：localStorage 被阻擋 (如 App 預覽 WebView/隱私模式) 時
    // 不再整頁崩潰，自動退回記憶體暫存 (重整後不保留，但遊戲能玩)
    // ------------------------------------------
    const SafeStore = (() => {
      const mem = {};
      let ok = true;
      try { localStorage.setItem('__scholar_probe__', '1'); localStorage.removeItem('__scholar_probe__'); }
      catch (e) { ok = false; console.warn('localStorage 不可用，改用記憶體暫存', e); }
      return {
        get(k) { try { return ok ? localStorage.getItem(k) : (k in mem ? mem[k] : null); } catch (e) { return (k in mem ? mem[k] : null); } },
        set(k, v) { try { if (ok) localStorage.setItem(k, v); else mem[k] = String(v); } catch (e) { mem[k] = String(v); } },
        remove(k) { try { if (ok) localStorage.removeItem(k); } catch (e) { } delete mem[k]; }
      };
    })();

    // 🔊 音效開關 (v8.2 新增，設定抽屜可切換)
    let soundEnabled = SafeStore.get('scholar_sound_enabled') !== 'off';
    function toggleSound() {
      soundEnabled = !soundEnabled;
      SafeStore.set('scholar_sound_enabled', soundEnabled ? 'on' : 'off');
      const btn = document.getElementById('btn-sound-toggle');
      if (btn) btn.innerText = soundEnabled ? '🔊 音效：開' : '🔇 音效：關';
      if (soundEnabled) playSound('click');
      if (typeof createFloatingText === 'function') createFloatingText(soundEnabled ? '🔊 音效已開啟' : '🔇 音效已關閉');
    }

    // 🎓 v8.2 新手引導：只對全新玩家顯示一次
    function maybeShowOnboarding() {
      try {
        if (SafeStore.get('scholar_onboarded_v82')) return;
        const isFresh = (gameState.totalGameDays || 0) === 0 && (gameState.totalSpent || 0) === 0 && gameState.gradeIndex === 0;
        if (!isFresh) { SafeStore.set('scholar_onboarded_v82', '1'); return; }
        const ov = document.getElementById('onboarding-overlay');
        if (ov) ov.classList.add('active');
      } catch (e) { }
    }
    function closeOnboarding() {
      SafeStore.set('scholar_onboarded_v82', '1');
      const ov = document.getElementById('onboarding-overlay');
      if (ov) ov.classList.remove('active');
      playSound('levelUp');
    }

    // ------------------------------------------
    // 音效系統 (Web Audio API) - 延遲與防錯載入
    // ------------------------------------------
    let audioCtx = null;
    function getAudioContext() {
      if (!audioCtx) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
          }
        } catch (e) {
          console.warn("Web Audio API not supported or blocked in this environment:", e);
        }
      }
      return audioCtx;
    }

    function playSound(type) {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;

      try {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'click') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
        } else if (type === 'levelUp') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.08);
          osc.frequency.setValueAtTime(783.99, now + 0.16);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
        } else if (type === 'buy') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(987.77, now);
          osc.frequency.setValueAtTime(1318.51, now + 0.06);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          osc.start(now);
          osc.stop(now + 0.25);
        } else if (type === 'examSuccess') {
          osc.type = 'sine';
          const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
          notes.forEach((freq, idx) => {
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          });
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
          osc.start(now);
          osc.stop(now + 0.8);
        } else if (type === 'examFail') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.linearRampToValueAtTime(100, now + 0.5);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
        }
      } catch (e) {
        console.warn("Error playing sound:", e);
      }
    }

    document.body.addEventListener('click', () => {
      try {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume();
        }
      } catch (e) {
        // 忽略音效恢復失敗
      }
    });


    // ------------------------------------------
    // 隨機搞笑發言池 (全繁體中文，無簡體字)
    // ------------------------------------------
    const FUNNY_QUOTES = {
      sleeping: [
        "在夢裡我已經是終極學神了...",
        "原來微積分在夢裡是用中文寫的...",
        "不要吵我，我正在解一題很難的夢境題...",
        "呼...吸...考卷請不要發下來...",
        "老師，我沒有睡著，我只是閉眼思考宇宙奧秘...",
        "等我醒來，全校都要叫我葉大帥的傳人...",
        "夢到考試沒寫名字，驚醒發現真的沒寫...",
        "呼嚕...我的大腦正在進行磁碟重組..."
      ],
      studying_school: [
        "這題連 AI 都要算三秒，我怎麼可能一秒答對！",
        "我與學神的距離，只差一個偷看答案的機會。",
        "書本的香味，怎麼聞起來很像好市多的烤雞...",
        "我的腦袋裡有 99% 的空間在想中午吃什麼...",
        "眼前的黑不是黑，是我的眼皮正在做地心引力實驗...",
        "老師講的每個字我都懂，但連在一起就像魔法咒語...",
        "讀書是為了走更長遠的路，但我現在腳好酸...",
        "課本的字好密，看得我眼睛都快自動對焦到窗外了..."
      ],
      studying_library: [
        "圖書館的冷氣好舒服，適合...啊不，是適合讀書！",
        "隔壁同學翻書好快，是在用物理超度課本嗎？",
        "我懷疑這本書在對我催眠，而它成功了...",
        "複習中...感覺我的記憶體（RAM）快要不足了...",
        "這題微積分已經折磨了我三代祖宗...",
        "看著這行公式，我腦海中浮現了阿嬤的笑臉...",
        "聽說多讀書能防脫髮，但我怎麼覺得頭皮涼涼的..."
      ],
      eating: [
        "吃鐵板燒是為了給大腦補充能量，絕對不是我想偷懶！",
        "熱量就是知識，我現在正在瘋狂攝取知識中...",
        "廚師炒菜的手速，要是我寫考卷有這速度就好了...",
        "今天的肉好嫩，我的肝希望也能跟這肉一樣嫩...",
        "吃飽了才有力氣繼續跟討厭的數學題決鬥！",
        "大腦運作需要大量卡路里，我這是在為了學業做出犧牲！",
        "鐵板香氣撲鼻，這一刻我覺得我已經解鎖了幸福的真諦。"
      ],
      sports: [
        "流的不是汗，是當初選這門課時腦袋進的水...",
        "跑步能降壓力，但我的體力正呈指數型衰退中...",
        "如果跑步的速度等於我忘記英文單字的速度，我已超光速！",
        "風好大，我的頭髮跟我的成績一樣隨風飄揚...",
        "操場這條路，比我人生的路還要漫長...",
        "再跑一圈！我的脂肪正在燃燒，我的智商好像也是...",
        "操場上的小人正在努力不讓自己看起來像個肉球..."
      ],
      working: [
        "歡迎光臨！請問需要加熱還是需要幫您寫微積分？",
        "刷條碼的手速練好，以後畫卡一定能快三秒！",
        "店長說這盒報廢便當歸我了，這就是打工的最高境界！",
        "半夜來買關東煮的客人，看起來也像剛被考卷摧殘過...",
        "賺錢繳房租！我真是個獨立自主的學霸！",
        "叮咚！聽到超商門鈴聲，我的右手就會自動舉起來刷條碼..."
      ],
      commuting: [
        "趕路中！兩條腿就是我的高鐵，速限是多少？",
        "這路程要是能用哆啦A夢的傳送門該有多好...",
        "遲到是平凡人的專利，學霸只會提早抵達！",
        "走這麼快，不知道能不能觸發時間膨脹效應...",
        "路邊的小草，你是不是也在為我的奔跑而鼓掌？",
        "趕路好累，等一下去餐廳一定要多吃兩碗白飯。"
      ],
      angry: [
        "啊啊啊！我是一隻被考卷逼瘋的憤怒學霸！",
        "壓力大到我想去跟操場上的電線桿單挑！",
        "別惹我，我現在隨時能背出圓周率後一百位！",
        "題目再這麼難，我就要寫聯絡簿跟葉大帥告狀了！",
        "我的大腦 CPU 已經 100% 滿載，快要冒煙了！",
        "學什麼學！我現在只想當一隻快樂的鹹魚！"
      ],
      idle: [
        "人生就像微積分，大部份時候都不知道自己在算什麼...",
        "我發呆的時候，大腦其實在進行量子力學的運算。",
        "只要我不讀書，就沒有人能夠在成績上超越我！",
        "今天天氣真好，適合把課本拿來蓋在臉上遮陽...",
        "發呆是為了與更高維度的智慧宇宙進行通訊...",
        "摸魚一時爽，一直摸魚一直爽...不對，我是學霸！",
        "我是誰？我在哪？為什麼微積分要出現在這個世界上？"
      ]
    };

    function triggerRandomSpeech() {
      let key = currentState;
      if (currentState === 'studying') {
        key = (currentLoc === 'school') ? 'studying_school' : 'studying_library';
      }

      let list = [...(FUNNY_QUOTES[key] || FUNNY_QUOTES.idle)];

      // 如果父母不在，加入特定吐槽 (全繁體，無簡體)
      if (gameState.parentsStatus !== 'alive') {
        if (currentState === 'sleeping') {
          list.push(
            "沒有爸媽盯著，連夢話都變得自由了...",
            "終於不用再聽爸媽的打呼聲，睡得真香！",
            "一個人的雙人大床，滾來滾去超爽的！"
          );
        } else if (currentState === 'idle') {
          list.push(
            "爸媽離家出走後，家裡變得好安靜啊...",
            "少了爸媽的碎碎唸，我的壓力突然狂降！",
            "我在考慮要不要去拜託耶穌幫我把爸媽復活一下...",
            "沒有爸媽盯著，我摸魚的時間都變長了！"
          );
        }
      }

      const randIdx = Math.floor(Math.random() * list.length);
      bubbleOverrideText = list[randIdx];

      const elCharBubble = document.getElementById("char-bubble");
      if (elCharBubble) {
        elCharBubble.innerText = bubbleOverrideText;
      }

      if (bubbleOverrideTimer) clearTimeout(bubbleOverrideTimer);
      bubbleOverrideTimer = setTimeout(() => {
        bubbleOverrideText = null;
        updateCharacterAnimation();
      }, 3000);
    }


    // ------------------------------------------
    // 遊戲狀態與座標定義 (1540px 大地圖絕對像素座標)
    // ------------------------------------------
    const GRADES = [
      { name: "🎓 幼兒園神童", val: 1 },
      { name: "🏫 明星國小生", val: 2 },
      { name: "🎒 全國榜首國中生", val: 3 },
      { name: "✍️ 精英高中生", val: 4 },
      { name: "🏛️ 頂尖大學生", val: 5 },
      { name: "🧬 傳奇研究生", val: 6 },
      { name: "🌌 宇宙終極博士", val: 7 }
    ];


    const INITIAL_STATE = {
      gradeIndex: 0, money: 0, difficulty: 1.0,
      subjects: {
        cn: { name: "國文", school: 0, home: 0 },
        en: { name: "英文", school: 0, home: 0 },
        ma: { name: "數學", school: 0, home: 0 },
        sc: { name: "自然", school: 0, home: 0 },
        so: { name: "社會", school: 0, home: 0 }
      },
      energy: 100, hunger: 100, stress: 0,
      bag: { chicken: 0, drink: 0, mentalbook: 0, bento: 0, vitamin: 0 },
      passive: { book: 0, shoes: 0, headphone: 0, tablet: 0, sofa: 0, trophy: 0 },
      landmarkLevels: { school: 1, restaurant: 1, gym: 1, library: 1, store: 1, home: 1 },
      buffs: [],
      miniGameCooldowns: { school: 0, restaurant: 0, gym: 0, library: 0, store: 0, home: 0 },
      worldMutations: [],
      totalLifetimeEarnings: 0,
      totalSpent: 0,
      examAttempts: 0,
      examPassStreak: 0,
      rebirthCount: 0,
      lastRentDay: 0,
      workHoursTotal: 0,
      randomEventsResolved: 0,
      focus: 0, studyHoursToday: 0,
      combo: 0, mockBuff: 0, examsPassedTotal: 0, unlockedParts: [], equippedParts: { hat: null, clothes: null, shoes: null }, weekly: null, login: null, rivals: null,
      friends: { xiaoxuan: 0, dameng: 0, yuqing: 0, xiaohao: 0 },
      friendChatDay: { xiaoxuan: -1, dameng: -1, yuqing: -1, xiaohao: -1 },
      miniGameWins: { school: 0, restaurant: 0, gym: 0, library: 0, store: 0, home: 0 },
      miniGamePlays: { school: 0, restaurant: 0, gym: 0, library: 0, store: 0, home: 0 },
      dayOfWeek: 1, hour: 8, minute: 0,
      speed: 1, overrideAction: null, overrideHoursLeft: 0,
      isCommuting: false, commuteStart: 'home', commuteTarget: 'school',
      commuteMinutesTotal: 0, commuteMinutesLeft: 0,
      currentX: 785, currentY: 445,
      totalGameDays: 0, examCooldownEndDays: 0,
      examCooldownEndHour: 0, examCooldownEndMinute: 0,
      parentsStatus: 'alive',
      parentsStatusReason: '',
      parentsRebornReason: '',
      equipped: { hat: null, clothes: null, shoes: null },
      customSkins: { hat: [], clothes: [], shoes: [] },
      lastSaved: Date.now()
    };

    let currentLoc = "school";
    let currentState = "idle";

    // 搞笑說話覆蓋變數與最後說話時間
    let bubbleOverrideText = null;
    let bubbleOverrideTimer = null;
    let lastSpeechRealTime = 0;

    // 手動鎖定旗標
    let isManualLocked = false;

    // 浮字訊息佇列 (防止重疊)
    let floatQueue = [];
    let isShowingFloat = false;

    // 相機手動控制與追隨計時器
    let lastAutoScrollTime = 0;
    let userScrollTimer = null;
    let userScrolling = false;

    // 時間鎖定標記
    let schoolLocked = false;
    let homeLocked = false;
    let restaurantLocked = false;
    let libraryLocked = false;
    let storeLocked = false;


    // ==========================================
    // ✨ Buff 系統
    // ==========================================
    function addBuff(type, multiplier, minutes, icon, positive, desc) {
      // 移除同類型的舊 buff
      gameState.buffs = gameState.buffs.filter(b => b.type !== type);
      gameState.buffs.push({ type, multiplier, minutesLeft: minutes, icon, positive, desc: desc || '' });
      updateBuffDisplay();
    }

    function getBuffMultiplier(type) {
      const buff = gameState.buffs.find(b => b.type === type);
      return buff ? buff.multiplier : 1.0;
    }

    function tickBuffs(progressMinutes) {
      if (!gameState.buffs || gameState.buffs.length === 0) return;
      gameState.buffs.forEach(b => { b.minutesLeft -= progressMinutes; });
      const expiredBuffs = gameState.buffs.filter(b => b.minutesLeft <= 0);
      if (expiredBuffs.length > 0) {
        expiredBuffs.forEach(b => queueFloatingText(`${b.icon} Buff 結束：${b.desc}`));
        gameState.buffs = gameState.buffs.filter(b => b.minutesLeft > 0);
        updateBuffDisplay();
      }
    }

    function updateBuffDisplay() {
      let container = document.getElementById('buff-display');
      if (!container) {
        container = document.createElement('div');
        container.id = 'buff-display';
        container.className = 'buff-container';
        const charWrap = document.getElementById('char-wrap');
        if (charWrap) charWrap.appendChild(container);
      }
      container.innerHTML = '';
      if (!gameState.buffs) return;
      gameState.buffs.forEach(b => {
        const el = document.createElement('div');
        el.className = `buff-icon ${b.positive ? 'positive' : 'negative'}`;
        el.innerText = b.icon;
        el.title = `${b.desc} (${Math.ceil(b.minutesLeft)}分鐘)`;
        container.appendChild(el);
      });
    }


    // ==========================================
    // 🤝 校園好友與好感度系統 (4 位特色夥伴)
    // ==========================================
    const FRIENDS_DEFS = [
      {
        id: 'xiaoxuan',
        name: '林曉萱',
        title: '學霸班長',
        avatar: '👧',
        locationName: '🏫 學校',
        favGift: 'drink',
        favGiftName: '🥤 提神飲料',
        desc: '永遠坐在第一排做筆記的模範班長，對認真聽課的同學特別有好感。',
        perks: [
          '點頭之交：尚無加成（好感滿 20 解鎖）',
          'Lv.1 同窗好友：學校聽講效率 +10%',
          'Lv.2 讀書戰友：學校聽講效率 +20%',
          'Lv.3 校園摯友：學校聽講效率 +35% & 考試合格率 +5%'
        ]
      },
      {
        id: 'dameng',
        name: '陳大猛',
        title: '熱血校隊',
        avatar: '🏀',
        locationName: '🏃 運動場',
        favGift: 'chicken',
        favGiftName: '🍗 美味雞排',
        desc: '成天在體育館揮灑汗水的籃球校隊隊長，最愛運動後啃一塊香噴噴的雞排！',
        perks: [
          '點頭之交：尚無加成（好感滿 20 解鎖）',
          'Lv.1 陪跑夥伴：運動減壓效率 +15%',
          'Lv.2 健身兄弟：運動減壓效率 +30%',
          'Lv.3 換帖摯友：運動減壓效率 +50% & 運動精力消耗減半'
        ]
      },
      {
        id: 'yuqing',
        name: '蘇語晴',
        title: '文青學姊',
        avatar: '👓',
        locationName: '📖 圖書館',
        favGift: 'mentalbook',
        favGiftName: '📗 心靈勵志書',
        desc: '常駐圖書館角落看書的溫柔學姊，總能分享讓人心平氣和的讀書秘訣。',
        perks: [
          '點頭之交：尚無加成（好感滿 20 解鎖）',
          'Lv.1 共讀知音：圖書館複習效率 +15%',
          'Lv.2 文藝知己：圖書館複習效率 +30%',
          'Lv.3 靈魂摯友：圖書館複習效率 +45% & 讀書壓力累積 -25%'
        ]
      },
      {
        id: 'xiaohao',
        name: '王小豪',
        title: '富家吃貨',
        avatar: '🍔',
        locationName: '🍔 餐廳 / 🏪 超商',
        favGift: 'bento',
        favGiftName: '🍱 高級便當',
        desc: '家裡開連鎖超商的闊綽同學，最愛到處品嚐美食，對自家超商打工的朋友超大方！',
        perks: [
          '點頭之交：尚無加成（好感滿 20 解鎖）',
          'Lv.1 飯友同好：超商打工時薪 +15%',
          'Lv.2 VIP 麻吉：超商打工時薪 +30%',
          'Lv.3 金主摯友：超商打工時薪 +50% & 每日結算額外贊助 +$20'
        ]
      }
    ];

    function getFriendLevel(id) {
      if (!gameState.friends) return 0;
      const aff = gameState.friends[id] || 0;
      if (aff >= 100) return 3;
      if (aff >= 50) return 2;
      if (aff >= 20) return 1;
      return 0;
    }

    function getFriendBonus(bonusType) {
      const lvXuan = getFriendLevel('xiaoxuan');
      const lvMeng = getFriendLevel('dameng');
      const lvQing = getFriendLevel('yuqing');
      const lvHao = getFriendLevel('xiaohao');

      switch (bonusType) {
        case 'school_eff':
          return [1.0, 1.10, 1.20, 1.35][lvXuan] || 1.0;
        case 'exam_rate_add':
          return lvXuan >= 3 ? 5 : 0;
        case 'gym_stress':
          return [1.0, 1.15, 1.30, 1.50][lvMeng] || 1.0;
        case 'gym_energy_save':
          return lvMeng >= 3 ? 0.5 : 1.0;
        case 'library_eff':
          return [1.0, 1.15, 1.30, 1.45][lvQing] || 1.0;
        case 'study_stress_save':
          return lvQing >= 3 ? 0.75 : 1.0;
        case 'store_wage':
          return [1.0, 1.15, 1.30, 1.50][lvHao] || 1.0;
        case 'daily_allowance':
          return lvHao >= 3 ? 20 : 0;
        default:
          return 1.0;
      }
    }

    function gainFriendAffinity(id, amount, isSilent) {
      if (!gameState.friends) gameState.friends = { xiaoxuan: 0, dameng: 0, yuqing: 0, xiaohao: 0 };
      const oldLv = getFriendLevel(id);
      const oldVal = gameState.friends[id] || 0;
      if (oldVal >= 100) return;

      gameState.friends[id] = Math.min(100, oldVal + amount);
      const newLv = getFriendLevel(id);
      const def = FRIENDS_DEFS.find(f => f.id === id);

      if (newLv > oldLv && def) {
        playSound('examSuccess');
        queueFloatingText(`💖 與【${def.name}】好感升至 Lv.${newLv}！解鎖新加成！`);
      } else if (!isSilent && def) {
        queueFloatingText(`🤝 ${def.name} 好感度 +${amount}`);
      }

      const drawer = document.getElementById('drawer-friends');
      if (drawer && drawer.classList.contains('open')) {
        renderFriendsList();
      }
    }

    // ---------- v9.1 每日任務 ----------
    const DAILY_QUEST_POOL = [
      { id: 'study3', icon: '📚', desc: '讀書滿 3 小時', target: 3, reward: 60, prog: () => Math.min(3, gameState.studyHoursToday || 0) },
      { id: 'study5', icon: '📖', desc: '讀書滿 5 小時', target: 5, reward: 120, prog: () => Math.min(5, gameState.studyHoursToday || 0) },
      { id: 'sport2', icon: '🏃', desc: '運動滿 2 小時', target: 2, reward: 50, prog: () => Math.min(2, gameState.sportsHoursToday || 0) },
      { id: 'work2', icon: '🏪', desc: '打工滿 2 小時', target: 2, reward: 70, prog: () => Math.min(2, gameState.workHoursToday || 0) },
      { id: 'eat2', icon: '🍱', desc: '吃滿 2 餐', target: 2, reward: 40, prog: () => Math.min(2, gameState.eatsToday || 0) },
      { id: 'chat2', icon: '💬', desc: '和 2 位好友聊天', target: 2, reward: 60, prog: () => Math.min(2, gameState.chatToday || 0) },
      { id: 'focus70', icon: '🔥', desc: '專注度達到 70', target: 1, reward: 80, prog: () => (gameState.focus || 0) >= 70 ? 1 : 0 },
      { id: 'exam1', icon: '🎓', desc: '通過一次升學考', target: 1, reward: 150, prog: () => gameState._examPassedDay === (gameState.totalGameDays || 0) ? 1 : 0 },
      { id: 'combo15', icon: '🫧', desc: '陪讀連擊點擊 15 次', target: 15, reward: 90, prog: () => Math.min(15, gameState.comboHitsToday || 0) },
      { id: 'mock1', icon: '📝', desc: '參加一次模擬考', target: 1, reward: 80, prog: () => gameState._mockDay === (gameState.totalGameDays || 0) ? 1 : 0 },
    ];
    function ensureDailyQuests() {
      const today = gameState.totalGameDays || 0;
      if (!gameState.dailyQuests || gameState.dailyQuests.day !== today) {
        const ids = [...DAILY_QUEST_POOL].sort(() => Math.random() - 0.5).slice(0, 3).map(q => q.id);
        gameState.dailyQuests = { day: today, ids, rewarded: {} };
      }
      return gameState.dailyQuests;
    }
    function evaluateDailyQuests() {
      const dq = ensureDailyQuests();
      let changed = false;
      dq.ids.forEach(id => {
        if (dq.rewarded[id]) return;
        const q = DAILY_QUEST_POOL.find(x => x.id === id);
        if (q && q.prog() >= q.target) {
          dq.rewarded[id] = true; changed = true;
          gameState.money = (gameState.money || 0) + q.reward;
          if (typeof bumpWeekly === 'function') bumpWeekly('quests'); // v9.3 本週目標
          queueFloatingText(`📋 每日任務完成：${q.desc}（+$${q.reward}）`);
          playSound('levelUp');
        }
      });
      if (changed) saveGameData();
      if (typeof renderDailyQuests === 'function') renderDailyQuests();
    }
    // ---------- v9.1 好友邀約同行 ----------
    const CO_LOCS = { xiaoxuan: 'school', yuqing: 'library', dameng: 'gym', xiaohao: 'restaurant' };
    const CO_LABELS = { xiaoxuan: '🏫 一起在學校讀書', yuqing: '📚 一起在圖書館共讀', dameng: '🏃 一起到操場運動', xiaohao: '🍜 一起到餐廳吃飯' };
    function inviteCoActivity(id) {
      const def = FRIENDS_DEFS.find(f => f.id === id);
      if (!def) return;
      const today = gameState.totalGameDays || 0;
      if (!gameState.coInviteDay) gameState.coInviteDay = {};
      if ((gameState.friends[id] || 0) < 20) { createFloatingText('🔒 好感度滿 20 才能邀約同行喔！'); return; }
      if (gameState.coInviteDay[id] === today) { createFloatingText('✅ 今天已經邀約過這位好友了'); return; }
      playSound('levelUp');
      gameState.coInviteDay[id] = today;
      gameState.coInvite = { friend: id, loc: CO_LOCS[id], left: 2 };
      queueFloatingText(`💞 已邀約 ${def.name}：${CO_LABELS[id]}（2 小時，效率/心情加成）`);
      renderFriendsList();
      saveGameData();
    }

    function chatWithFriend(id) {
      if (!gameState.friendChatDay) gameState.friendChatDay = { xiaoxuan: -1, dameng: -1, yuqing: -1, xiaohao: -1 };
      const today = gameState.totalGameDays || 0;
      const def = FRIENDS_DEFS.find(f => f.id === id);
      if (!def) return;

      if (gameState.friendChatDay[id] === today) {
        playSound('examFail');
        createFloatingText(`💬 今天已經跟 ${def.name} 聊過天囉！明天再聊吧～`);
        return;
      }
      if ((gameState.friends[id] || 0) >= 100) {
        playSound('click');
        createFloatingText(`🌟 與 ${def.name} 的好感度已經滿級囉！`);
        return;
      }
      if (gameState.energy < 5) {
        playSound('examFail');
        createFloatingText(`❌ 精力不足 5 點，沒力氣聊天啦！`);
        return;
      }

      playSound('click');
      gameState.energy = Math.max(0, gameState.energy - 5);
      gameState.friendChatDay[id] = today;
      if (gameState._chatDay !== today) { gameState._chatDay = today; gameState.chatToday = 0; }
      gameState.chatToday = (gameState.chatToday || 0) + 1; // v9.1 每日任務計數
      if (typeof bumpWeekly === 'function') bumpWeekly('chats'); // v9.3 本週目標
      gainFriendAffinity(id, 6, false);
      updateUI();
      saveGameData();
    }

    function giftToFriend(id, itemKey) {
      const def = FRIENDS_DEFS.find(f => f.id === id);
      if (!def) return;
      if ((gameState.friends[id] || 0) >= 100) {
        playSound('click');
        createFloatingText(`🌟 與 ${def.name} 的好感度已經滿級囉！`);
        return;
      }
      if ((gameState.bag[itemKey] || 0) <= 0) {
        playSound('examFail');
        createFloatingText(`❌ 背包裡沒有這個禮物喔！可去商店購買～`);
        return;
      }

      playSound('levelUp');
      gameState.bag[itemKey] -= 1;
      const isFav = (itemKey === def.favGift);
      const gain = isFav ? 22 : 12;
      gainFriendAffinity(id, gain, true);
      queueFloatingText(isFav ? `🎁 送出最愛禮物！${def.name} 超開心 (好感+${gain})` : `🎁 送禮給 ${def.name} (好感+${gain})`);
      updateUI();
      saveGameData();
    }

    function renderFriendsList() {
      const container = document.getElementById('friends-list-container');
      if (!container) return;
      if (!gameState.friends) gameState.friends = { xiaoxuan: 0, dameng: 0, yuqing: 0, xiaohao: 0 };
      if (!gameState.friendChatDay) gameState.friendChatDay = { xiaoxuan: -1, dameng: -1, yuqing: -1, xiaohao: -1 };

      const today = gameState.totalGameDays || 0;
      const lvNames = ['點頭之交', 'Lv.1 好友', 'Lv.2 麻吉', 'Lv.3 摯友 MAX'];

      container.innerHTML = FRIENDS_DEFS.map(f => {
        const aff = gameState.friends[f.id] || 0;
        const lv = getFriendLevel(f.id);
        const chattedToday = gameState.friendChatDay[f.id] === today;
        const isMax = aff >= 100;
        const favCount = gameState.bag[f.favGift] || 0;
        const coToday = gameState.coInviteDay && gameState.coInviteDay[f.id] === today;
        const coActive = gameState.coInvite && gameState.coInvite.friend === f.id && (gameState.coInvite.left || 0) > 0;

        return `
          <div class="friend-card">
            <div class="friend-header">
              <div class="friend-avatar">${f.avatar}</div>
              <div class="friend-info">
                <div class="friend-name-row">
                  <span class="friend-name">${f.name} · ${f.title}</span>
                  <span class="friend-lv-badge">${lvNames[lv]}</span>
                </div>
                <div class="friend-loc">📍 常駐：${f.locationName} | ❤️ 最愛：${f.favGiftName}</div>
              </div>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); line-height:1.35;">${f.desc}</div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.72rem; font-weight:800; margin-bottom:3px;">
                <span>💖 好感度進度</span>
                <span>${aff} / 100</span>
              </div>
              <div class="friend-aff-bar">
                <div class="friend-aff-fill" style="width:${aff}%;"></div>
              </div>
            </div>
            <div class="friend-perk">✨ 當前效果：${f.perks[lv]}</div>
            <div class="friend-actions">
              <button class="friend-btn chat" onclick="chatWithFriend('${f.id}')" ${(chattedToday || isMax) ? 'disabled' : ''}>
                ${isMax ? '🌟 好感已滿' : (chattedToday ? '💬 今日已聊' : '💬 聊天 (-5精力 / +6好感)')}
              </button>
              <button class="friend-btn gift" onclick="giftToFriend('${f.id}', '${f.favGift}')" ${(favCount <= 0 || isMax) ? 'disabled' : ''}>
                🎁 送最愛${f.favGiftName.slice(0, 4)} (+22) [持有:${favCount}]
              </button>
              <button class="friend-btn" style="background:#ff9f0a; color:#fff;" onclick="inviteCoActivity('${f.id}')" ${(aff < 20 || coToday) ? 'disabled' : ''}>
                ${coActive ? '💞 同行中…' : (aff < 20 ? '🔒 好感 20 解鎖邀約' : (coToday ? '✅ 今日已邀約' : '💞 邀約同行 (2h 加成)'))}
              </button>
            </div>
          </div>
        `;
      }).join('');
    }


    // ==========================================
    // ❗ 隨機日常突發事件膠囊與二選一決策系統
    // ==========================================
    const RANDOM_EVENTS_POOL = [
      {
        id: 'teacher_spot_quiz',
        title: '🏫 老師突擊抽考！',
        badge: '校園奇遇',
        icon: '📝',
        desc: '走廊上突然遇到班導師拿著講義攔住你：「同學，這題微積分極限怎麼算？」',
        choices: [
          {
            label: '🧠 絞盡腦汁認真作答（預設保底）',
            sub: '消耗 8 點精力，全科隨機獲得學科分數，老師還獎勵 $25！',
            exec: () => {
              gameState.energy = Math.max(0, gameState.energy - 8);
              gameState.money += 25;
              gainKnowledge('school', 2.0);
              return '📝 突擊抽考過關！獲得獎學金 +$25 & 學科成長';
            }
          },
          {
            label: '🏃 裝肚子痛尿遁逃跑',
            sub: '不扣精力，壓力 -10，但錯失表現機會',
            exec: () => {
              gameState.stress = Math.max(0, gameState.stress - 10);
              return '🏃 成功施展尿遁大法！心情莫名輕鬆 (壓力-10)';
            }
          }
        ]
      },
      {
        id: 'found_wallet',
        title: '👛 路上撿到厚厚錢包',
        badge: '道德抉擇',
        icon: '💰',
        desc: '在圖書館外的草叢撿到一個鼓鼓的皮夾，裡面塞滿了鈔票跟學生證！',
        choices: [
          {
            label: '👮 拾金不昧送到失物招領（預設保底）',
            sub: '失主王小豪超感激！獲得謝禮 +$40 且王小豪好感度 +10',
            exec: () => {
              gameState.money += 40;
              gainFriendAffinity('xiaohao', 10, true);
              return '👮 拾金不昧！王小豪包了 $40 紅包答謝，好感 +10';
            }
          },
          {
            label: '🍱 拿謝禮去買大餐犒賞自己',
            sub: '飽足感直接回滿 100，壓力 -15',
            exec: () => {
              gameState.hunger = 100;
              gameState.stress = Math.max(0, gameState.stress - 15);
              return '🍱 失主請吃豪華鐵板燒！飽足全滿、壓力 -15';
            }
          }
        ]
      },
      {
        id: 'store_rush_hour',
        title: '🏪 超商團客暴買潮！',
        badge: '打工突發',
        icon: '🛒',
        desc: '便利商店突然湧進一整車校外教學的學生，收銀台前大排長龍！店長急Call支援！',
        choices: [
          {
            label: '💪 捲起袖子幫忙快速結帳（預設保底）',
            sub: '消耗 10 精力，當場領取加班獎金 +$55！',
            exec: () => {
              gameState.energy = Math.max(0, gameState.energy - 10);
              gameState.money += 55;
              gameState.totalLifetimeEarnings = (gameState.totalLifetimeEarnings || 0) + 55;
              return '🏪 支援超商尖峰結帳！店長發給加班費 +$55';
            }
          },
          {
            label: '🍙 順手幫補貨換取免費便當',
            sub: '免費獲得 1 個「🍱 高級便當」放進背包！',
            exec: () => {
              gameState.bag.bento = (gameState.bag.bento || 0) + 1;
              return '🍱 幫忙超商補貨，店長送你 1 個高級便當！';
            }
          }
        ]
      },
      {
        id: 'secret_exam_notes',
        title: '📒 傳說中的學霸共筆！',
        badge: '學習奇遇',
        icon: '✨',
        desc: '林曉萱神秘兮兮地遞給你一本歷屆狀元留下的「終極重點共筆」！',
        choices: [
          {
            label: '📖 與曉萱一起研讀共筆（預設保底）',
            sub: '圖書館複習進度大幅提升，且林曉萱好感度 +8',
            exec: () => {
              gainKnowledge('library', 2.8);
              gainFriendAffinity('xiaoxuan', 8, true);
              return '📒 研讀狀元共筆！複習分數大增 & 曉萱好感 +8';
            }
          },
          {
            label: '⚡ 開啟 30 分鐘學科衝刺 Buff',
            sub: '獲得 30 遊戲分鐘「學科增長 x1.5」強效狀態',
            exec: () => {
              addBuff('study_boost', 1.5, 30, '📚', true, '學科增長 x1.5');
              return '⚡ 靈感爆發！獲得 30 分鐘學科增長 x1.5 Buff';
            }
          }
        ]
      },
      {
        id: 'gym_friendly_match',
        title: '🏀 操場三對三鬥牛賽！',
        badge: '熱血運動',
        icon: '🔥',
        desc: '陳大猛在運動場朝你招手：「三缺一！快上場幫忙守一個，贏了請喝飲料！」',
        choices: [
          {
            label: '🏀 熱血上場飆進絕殺球（預設保底）',
            sub: '壓力大幅消除 -30，陳大猛好感度 +10，還拿到 1 罐提神飲料！',
            exec: () => {
              gameState.stress = Math.max(0, gameState.stress - 30);
              gameState.bag.drink = (gameState.bag.drink || 0) + 1;
              gainFriendAffinity('dameng', 10, true);
              return '🏀 絕殺得分！壓力 -30、大猛好感 +10 & 獲贈提神飲料';
            }
          },
          {
            label: '📣 在場邊當啦啦隊加油',
            sub: '不耗體力，壓力 -15，精力 +15',
            exec: () => {
              gameState.stress = Math.max(0, gameState.stress - 15);
              gameState.energy = Math.min(100, gameState.energy + 15);
              return '📣 在場邊喝采放鬆！精力 +15、壓力 -15';
            }
          }
        ]
      },
      {
        id: 'library_tea_time',
        title: '🍵 學姊的午後花草茶',
        badge: '溫馨時刻',
        icon: '🌸',
        desc: '蘇語晴看你讀書讀到眉頭深鎖，悄悄泡了一杯舒緩花草茶放在你桌上。',
        choices: [
          {
            label: '🍵 邊喝茶邊請教學姊讀書心法（預設保底）',
            sub: '壓力 -20、精力 +15，且蘇語晴好感度 +10',
            exec: () => {
              gameState.stress = Math.max(0, gameState.stress - 20);
              gameState.energy = Math.min(100, gameState.energy + 15);
              gainFriendAffinity('yuqing', 10, true);
              return '🍵 學姊的花草茶超療癒！壓力-20、精力+15、語晴好感+10';
            }
          },
          {
            label: '📖 趁頭腦清醒立刻刷兩套題庫',
            sub: '隨機兩門學科分數立刻獲得提升',
            exec: () => {
              gainKnowledge('school', 1.8);
              gainKnowledge('library', 1.8);
              return '📖 頭腦超清醒！聽講與複習進度雙雙提升';
            }
          }
        ]
      }
    ];

    let activeRandomEvent = null;
    let randomEventDeadline = 0;
    let lastRandomEventRealTime = Date.now();
    let randomEventModalOpen = false;

    function tickRandomEvents() {
      const now = Date.now();
      const capsule = document.getElementById('random-event-capsule');
      const timerBar = document.getElementById('random-event-timer-bar');

      // 若已有事件正在倒數（且尚未打開彈窗）
      if (activeRandomEvent) {
        if (!randomEventModalOpen) {
          const leftMs = randomEventDeadline - now;
          if (leftMs <= 0) {
            // 15 秒未點擊，自動執行保底第 0 選項，絕不卡掛機！
            resolveRandomEvent(0, true);
          } else if (timerBar) {
            const pct = Math.max(0, Math.min(100, (leftMs / 15000) * 100));
            timerBar.style.width = `${pct}%`;
          }
        }
        return;
      }

      // 距離上次事件至少間隔 35 秒，每次 tick 小機率觸發
      if (now - lastRandomEventRealTime > 35000) {
        if (Math.random() < 0.008) {
          triggerRandomEvent();
        }
      }
    }

    const STUDY_EVENTS_POOL = [
      {
        title: '💡 靈光一閃', badge: '讀書事件', icon: '💡',
        desc: '讀到一半，腦中突然把前幾章的觀念全部串起來了！這個瞬間稍縱即逝。',
        choices: [
          { label: '✍️ 立刻記下來', sub: '專注 +25，把靈感釘進筆記', exec: () => { gameState.focus = Math.min(100, (gameState.focus || 0) + 25); return '💡 靈感入袋，專注大幅提升！'; } },
          { label: '📖 繼續讀下去', sub: '壓力 +3，專注 +10', exec: () => { gameState.stress = Math.min(100, gameState.stress + 3); gameState.focus = Math.min(100, (gameState.focus || 0) + 10); return '📖 趁熱繼續讀，節奏沒斷。'; } },
        ],
      },
      {
        title: '😪 想睡了', badge: '讀書事件', icon: '😪',
        desc: '眼皮越來越重，同一行字看了三遍還沒看懂。',
        choices: [
          { label: '💪 硬撐下去', sub: '壓力 +6，保住專注', exec: () => { gameState.stress = Math.min(100, gameState.stress + 6); return '💪 靠意志撐住了，但壓力上升。'; } },
          { label: '🌿 起身休息一下', sub: '體力 +8，專注 −20', exec: () => { gameState.energy = Math.min(100, gameState.energy + 8); gameState.focus = Math.max(0, (gameState.focus || 0) - 20); return '🌿 休息後清醒多了，專注要重新累積。'; } },
        ],
      },
      {
        title: '🙋 同學來問問題', badge: '讀書事件', icon: '🙋',
        desc: '同學湊過來問一題卡很久的題目，你其實已經會了。',
        choices: [
          { label: '🤝 教他', sub: '曉萱好感 +3，壓力 −4', exec: () => { if (typeof gainFriendAffinity === 'function') gainFriendAffinity('xiaoxuan', 3, true); gameState.stress = Math.max(0, gameState.stress - 4); return '🤝 教人自己也更熟練了，心情變好。'; } },
          { label: '🙏 婉拒，專心讀書', sub: '專注 +8', exec: () => { gameState.focus = Math.min(100, (gameState.focus || 0) + 8); return '🙏 守住自己的讀書節奏。'; } },
        ],
      },
    ];
    function triggerRandomEvent(forcedEvent) {
      if (activeRandomEvent) return;
      const ev = forcedEvent || RANDOM_EVENTS_POOL[Math.floor(Math.random() * RANDOM_EVENTS_POOL.length)];
      activeRandomEvent = ev;
      randomEventDeadline = Date.now() + 15000; // 15 秒倒數
      randomEventModalOpen = false;

      const capsule = document.getElementById('random-event-capsule');
      const textEl = document.getElementById('random-event-capsule-text');
      const timerBar = document.getElementById('random-event-timer-bar');

      if (textEl) textEl.innerText = `${ev.title} (點擊抉擇)`;
      if (timerBar) timerBar.style.width = '100%';
      if (capsule) capsule.classList.add('active');
      playSound('click');
    }

    function openRandomEventModal() {
      if (!activeRandomEvent) return;
      playSound('click');
      randomEventModalOpen = true;

      const overlay = document.getElementById('random-event-overlay');
      document.getElementById('re-modal-title').innerText = activeRandomEvent.title;
      document.getElementById('re-modal-badge').innerText = activeRandomEvent.badge;
      document.getElementById('re-modal-icon').innerText = activeRandomEvent.icon;
      document.getElementById('re-modal-desc').innerText = activeRandomEvent.desc;

      const choicesEl = document.getElementById('re-modal-choices');
      choicesEl.innerHTML = activeRandomEvent.choices.map((c, idx) => `
        <button class="event-choice-btn" onclick="resolveRandomEvent(${idx}, false)">
          <div>${c.label}</div>
          <span class="choice-sub">${c.sub}</span>
        </button>
      `).join('');

      overlay.classList.add('active');
    }

    function resolveRandomEvent(choiceIdx, isAuto) {
      if (!activeRandomEvent) return;
      const ev = activeRandomEvent;
      const choice = ev.choices[choiceIdx] || ev.choices[0];

      activeRandomEvent = null;
      randomEventModalOpen = false;
      lastRandomEventRealTime = Date.now();

      const capsule = document.getElementById('random-event-capsule');
      const overlay = document.getElementById('random-event-overlay');
      if (capsule) capsule.classList.remove('active');
      if (overlay) overlay.classList.remove('active');

      const resultMsg = choice.exec ? choice.exec() : '事件處理完成！';
      gameState.randomEventsResolved = (gameState.randomEventsResolved || 0) + 1;

      if (isAuto) {
        queueFloatingText(`🤖 自動處理突發：${resultMsg}`);
      } else {
        playSound('levelUp');
        queueFloatingText(resultMsg);
      }

      updateUI();
      saveGameData();
    }


    // ==========================================
    // 🏅 成就系統 (獨立 localStorage)
    // ==========================================
    const ACH_KEY = "scholar_achievements_v1";
    const REBIRTH_KEY = "scholar_rebirth_v1";

    // 永久轉世加成資料
    let rebirthData = {
      totalRebirths: 0,
      totalLifetimeEarnings: 0,
      totalLifetimeDays: 0,
      bonuses: {
        smartness: 0,    // 學科增長 +5%
        stamina: 0,      // 精力消耗 -5%
        appetite: 0,     // 飽足消耗 -5%
        mental: 0,       // 壓力增長 -5%
        richKid: 0,      // 初始零用錢 +$50
        speedster: 0,    // 通勤時間 -10%
        memory: 0        // 複習效率 +5%
      },
      allParentDeaths: [],   // 蒐集所有父母出事原因
      allMutationsExperienced: [],
      pendingPoints: 0,
      pendingMutations: []
    };

    // 成就定義
    const ACHIEVEMENTS = [
      // 📚 學業成就
      { id: 'first_exam_pass', name: '初試啼聲', desc: '第一次考試通過', icon: '🎓', category: 'academic', hidden: false },
      { id: 'all_subjects_60', name: '聽講達人', desc: '所有科目聽講分數達到 60', icon: '📖', category: 'academic', hidden: false },
      { id: 'all_subjects_100', name: '全科滿分', desc: '所有科目總分達到 100', icon: '💯', category: 'academic', hidden: false },
      { id: 'reach_university', name: '大學新鮮人', desc: '升學到頂尖大學生', icon: '🏛️', category: 'academic', hidden: false },
      { id: 'reach_doctor', name: '學神降世', desc: '成為宇宙終極博士', icon: '🌌', category: 'academic', hidden: false },
      { id: 'exam_no_fail', name: '百戰百勝', desc: '連續 3 次考試通過', icon: '🏆', category: 'academic', hidden: false },
      { id: 'study_marathon', name: '讀書馬拉松', desc: '連續在學校+圖書館待超過 8 小時', icon: '📚', category: 'academic', hidden: false },
      // 🏃 生活成就
      { id: 'first_sport', name: '運動菜鳥', desc: '第一次去運動場跑步', icon: '🏃', category: 'life', hidden: false },
      { id: 'eat_5_times', name: '美食家', desc: '一天內吃 5 次鐵板燒', icon: '🍖', category: 'life', hidden: false },
      { id: 'zero_stress_day', name: '佛系學霸', desc: '壓力值保持 0 超過 24 遊戲小時', icon: '😌', category: 'life', hidden: false },
      { id: 'near_death', name: '瀕死體驗', desc: '精力和飽足同時低於 5', icon: '💀', category: 'life', hidden: false },
      { id: 'anger_3_times', name: '暴走族', desc: '一天內暴走 3 次以上', icon: '🤬', category: 'life', hidden: false },
      { id: 'full_health', name: '身心健康', desc: '精力、飽足全滿且壓力為 0', icon: '💪', category: 'life', hidden: false },
      { id: 'night_owl', name: '夜貓子', desc: '凌晨 3 點還沒睡覺', icon: '🦉', category: 'life', hidden: false },
      { id: 'first_friend_max', name: '校園摯友', desc: '與任一位校園夥伴好感度達到滿級 (100)', icon: '🤝', category: 'life', hidden: false },
      { id: 'all_friends_max', name: '校園人氣王', desc: '與全部 4 位校園夥伴好感度達到滿級', icon: '🌟', category: 'life', hidden: false },
      // 💰 經濟成就
      { id: 'first_work', name: '打工戰士', desc: '第一次在便利商店站櫃檯打工', icon: '🏪', category: 'economy', hidden: false },
      { id: 'work_20_hours', name: '金牌店員', desc: '累計超商打工滿 20 小時', icon: '💳', category: 'economy', hidden: false },
      { id: 'save_500', name: '小富翁', desc: '存到 $500', icon: '💵', category: 'economy', hidden: false },
      { id: 'save_2000', name: '理財達人', desc: '存到 $2000', icon: '💰', category: 'economy', hidden: false },
      { id: 'spend_1000', name: '敗家子', desc: '累計花費超過 $1000', icon: '🛍️', category: 'economy', hidden: false },
      { id: 'buy_all_passive', name: '裝備齊全', desc: '購買所有被動裝備各至少 1 件', icon: '🎒', category: 'economy', hidden: false },
      { id: 'gacha_win', name: '歐洲人', desc: '在便利商店小遊戲中獲勝 1 次 (原抽獎機成就，v8.2 改版)', icon: '🎰', category: 'economy', hidden: false },
      // 👨‍👩‍👦 彩蛋與奇遇成就
      { id: 'event_master', name: '奇遇達人', desc: '累計處理 10 次校園突發事件', icon: '❗', category: 'event', hidden: false },
      { id: 'parents_first_death', name: '人生無常', desc: '第一次經歷父母出事', icon: '😢', category: 'event', hidden: false },
      { id: 'parents_revival', name: '奇蹟時刻', desc: '父母復活了！', icon: '✨', category: 'event', hidden: false },
      { id: 'parents_dumb_death', name: '笨死的...', desc: '父母因為算不出微積分被笨死', icon: '🧠', category: 'event', hidden: false },
      { id: 'parents_jesus', name: '耶穌顯靈', desc: '遇到耶穌復活事件', icon: '⛪', category: 'event', hidden: false },
      { id: 'collect_all_deaths', name: '命運多舛', desc: '經歷所有 5 種父母出事原因', icon: '📜', category: 'event', hidden: false },
      // 🔄 輪迴成就
      { id: 'first_rebirth', name: '轉世輪迴', desc: '第一次投胎重來', icon: '🔄', category: 'rebirth', hidden: false },
      { id: 'rebirth_5', name: '五世學霸', desc: '累計投胎 5 次', icon: '5️⃣', category: 'rebirth', hidden: false },
      { id: 'rebirth_10', name: '十世修得', desc: '累計投胎 10 次', icon: '🔟', category: 'rebirth', hidden: false },
      { id: 'rebirth_25', name: '轉世達人', desc: '累計投胎 25 次', icon: '🌀', category: 'rebirth', hidden: false },
      { id: 'total_earn_10000', name: '萬金大亨', desc: '累計所有輪迴總賺 $10,000', icon: '💎', category: 'rebirth', hidden: false },
      { id: 'total_days_365', name: '一年學霸', desc: '累計所有輪迴遊戲天數達 365 天', icon: '📅', category: 'rebirth', hidden: false },
      // 🏆 隱藏成就
      { id: 'exam_at_3am', name: '午夜狂人', desc: '在凌晨 3 點觸發考試', icon: '🌙', category: 'hidden', hidden: true },
      { id: 'custom_outfit_exam', name: '時尚考生', desc: '穿自定義服飾完成升學', icon: '👔', category: 'hidden', hidden: true },
      { id: 'minigame_master', name: '遊戲達人', desc: '所有場景小遊戲各贏 5 次以上', icon: '🎮', category: 'hidden', hidden: true },
      { id: 'skip_school_7', name: '蹺課高手', desc: '連續 7 天平日不去學校', icon: '🏖️', category: 'hidden', hidden: true },
      { id: 'max_all_bonuses', name: '完美人類', desc: '所有轉世加成至少 3 級', icon: '👑', category: 'hidden', hidden: true },
    ];

    let achievementData = {};

    function loadAchievements() {
      try {
        const saved = SafeStore.get(ACH_KEY);
        if (saved) achievementData = JSON.parse(saved);
      } catch (e) { achievementData = {}; }
    }

    function saveAchievements() {
      SafeStore.set(ACH_KEY, JSON.stringify(achievementData));
    }

    function loadRebirthData() {
      try {
        const saved = SafeStore.get(REBIRTH_KEY);
        if (saved) rebirthData = { ...rebirthData, ...JSON.parse(saved) };
      } catch (e) { }
    }

    function saveRebirthData() {
      SafeStore.set(REBIRTH_KEY, JSON.stringify(rebirthData));
    }

    function unlockAchievement(id) {
      if (achievementData[id]) return; // 已解鎖
      achievementData[id] = { unlocked: true, time: Date.now() };
      saveAchievements();
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) showAchievementToast(ach);
    }

    function showAchievementToast(ach) {
      playSound('examSuccess');
      const toast = document.createElement('div');
      toast.className = 'achievement-toast';
      toast.innerHTML = `
        <span class="toast-icon">${ach.icon}</span>
        <div>
          <div class="toast-text">🏅 成就解鎖：${ach.name}</div>
          <div class="toast-sub">${ach.desc}</div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3800);
    }

    // 成就判定（在 tick 中呼叫）
    let achCheckCounter = 0;
    function checkAchievements() {
      achCheckCounter++;
      if (achCheckCounter % 50 !== 0) return; // 每 50 tick 檢查一次

      // 經濟與打工
      if (gameState.money >= 500) unlockAchievement('save_500');
      if (gameState.money >= 2000) unlockAchievement('save_2000');
      if ((gameState.workHoursTotal || 0) >= 1) unlockAchievement('first_work');
      if ((gameState.workHoursTotal || 0) >= 20) unlockAchievement('work_20_hours');
      // 生活與好友
      if (gameState.energy <= 5 && gameState.hunger <= 5) unlockAchievement('near_death');
      if (gameState.energy >= 100 && gameState.hunger >= 100 && gameState.stress <= 0) unlockAchievement('full_health');
      if (gameState.hour === 3 && currentState !== 'sleeping') unlockAchievement('night_owl');
      if (gameState.friends) {
        const affVals = Object.values(gameState.friends);
        if (affVals.some(v => v >= 100)) unlockAchievement('first_friend_max');
        if (affVals.length >= 4 && affVals.every(v => v >= 100)) unlockAchievement('all_friends_max');
      }
      // 突發事件
      if ((gameState.randomEventsResolved || 0) >= 10) unlockAchievement('event_master');
      // v8.2 補上過去永遠不會觸發的成就判定
      if ((gameState.totalSpent || 0) >= 1000) unlockAchievement('spend_1000');
      if ((gameState.examPassStreak || 0) >= 3) unlockAchievement('exam_no_fail');
      if (gameState.miniGameWins && gameState.miniGameWins.store >= 1) unlockAchievement('gacha_win');
      if ((gameState.studyStreakHours || 0) >= 8) unlockAchievement('study_marathon');
      if ((gameState.eatsToday || 0) >= 5) unlockAchievement('eat_5_times');
      if ((gameState.zeroStressHours || 0) >= 24) unlockAchievement('zero_stress_day');
      if ((gameState.angerToday || 0) >= 3) unlockAchievement('anger_3_times');
      if ((gameState.skipSchoolDays || 0) >= 7) unlockAchievement('skip_school_7');
      // 學業
      const allSchool60 = Object.values(gameState.subjects).every(s => s.school >= 60);
      if (allSchool60) unlockAchievement('all_subjects_60');
      const allTotal100 = Object.values(gameState.subjects).every(s => (s.school + s.home) >= 100);
      if (allTotal100) unlockAchievement('all_subjects_100');
      if (gameState.gradeIndex >= 5) unlockAchievement('reach_university');
      if (gameState.gradeIndex >= 6) unlockAchievement('reach_doctor');
      // 被動裝備齊全
      if (gameState.passive.book > 0 && gameState.passive.shoes > 0 && gameState.passive.headphone > 0 && gameState.passive.tablet > 0) {
        unlockAchievement('buy_all_passive');
      }
      // 運動
      if (currentState === 'sports') unlockAchievement('first_sport');
      // 輪迴
      if (rebirthData.totalRebirths >= 1) unlockAchievement('first_rebirth');
      if (rebirthData.totalRebirths >= 5) unlockAchievement('rebirth_5');
      if (rebirthData.totalRebirths >= 10) unlockAchievement('rebirth_10');
      if (rebirthData.totalRebirths >= 25) unlockAchievement('rebirth_25');
      if (rebirthData.totalLifetimeEarnings >= 10000) unlockAchievement('total_earn_10000');
      if (rebirthData.totalLifetimeDays >= 365) unlockAchievement('total_days_365');
      // 小遊戲達人
      const allMGWins = Object.values(gameState.miniGameWins).every(w => w >= 5);
      if (allMGWins) unlockAchievement('minigame_master');
      // 轉世加成全滿
      const allBonuses3 = Object.values(rebirthData.bonuses).every(v => v >= 3);
      if (allBonuses3) unlockAchievement('max_all_bonuses');
      // 父母所有出事原因
      if (rebirthData.allParentDeaths && rebirthData.allParentDeaths.length >= 5) {
        unlockAchievement('collect_all_deaths');
      }
    }

    function openAchievementPanel() {
      playSound('click');
      document.getElementById('achievement-overlay').classList.add('active');
      renderAchievementList('all');
      updateWorldMutationsDisplay();
    }

    function closeAchievementPanel() {
      playSound('click');
      document.getElementById('achievement-overlay').classList.remove('active');
    }

    let currentAchFilter = 'all';
    function filterAchievements(cat, btn) {
      playSound('click');
      currentAchFilter = cat;
      document.querySelectorAll('.ach-cat-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderAchievementList(cat);
    }

    function renderAchievementList(category) {
      const container = document.getElementById('achievement-list');
      if (!container) return;
      container.innerHTML = '';

      const filtered = category === 'all' ? ACHIEVEMENTS : ACHIEVEMENTS.filter(a => a.category === category);

      document.getElementById('ach-progress-text').innerText = `${Object.keys(achievementData).length} / ${ACHIEVEMENTS.length}`;
      document.getElementById('ach-progress-fill').style.width = `${(Object.keys(achievementData).length / ACHIEVEMENTS.length) * 100}%`;

      filtered.forEach(ach => {
        const isUnlocked = !!achievementData[ach.id];
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;

        const displayName = (ach.hidden && !isUnlocked) ? '???' : ach.name;
        const displayDesc = (ach.hidden && !isUnlocked) ? '隱藏成就，等你發現…' : ach.desc;
        const displayIcon = (ach.hidden && !isUnlocked) ? '❓' : ach.icon;

        card.innerHTML = `
          <span class="ach-icon">${displayIcon}</span>
          <div class="ach-name">${displayName}</div>
          <div class="ach-desc">${displayDesc}</div>
        `;
        container.appendChild(card);
      });
    }

    function updateWorldMutationsDisplay() {
      const el = document.getElementById('world-mutations-display');
      if (!el) return;
      if (!gameState.worldMutations || gameState.worldMutations.length === 0) {
        el.innerHTML = '';
        return;
      }
      el.innerHTML = '<div style="font-size:0.75rem; font-weight:700; margin-bottom:4px;">🌍 當前世界變異：</div>' +
        gameState.worldMutations.map(m => `<span class="world-mutation-badge">${m.icon} ${m.name}</span>`).join(' ');
    }


    // ==========================================
    // 🔄 輪迴進化系統
    // ==========================================
    const WORLD_MUTATIONS = [
      { id: 'rainy', name: '雨季世界', icon: '🌧️', desc: '運動減壓 -30%，圖書館效率 +20%' },
      { id: 'hot', name: '炎熱世界', icon: '🌞', desc: '飽足消耗 x1.3，精力恢復 +20%' },
      { id: 'scholar', name: '學霸世界', icon: '📚', desc: '學科增長 x1.2，考試通過率 -15%' },
      { id: 'happy', name: '歡樂世界', icon: '🎉', desc: '壓力增長 x0.5，零用錢 -30%' },
      { id: 'inflation', name: '通貨膨脹', icon: '🤑', desc: '商品價格 x1.5，零用錢 x1.5' },
      { id: 'ghost', name: '靈異世界', icon: '👻', desc: '父母出事 +20%，復活 +20%' }
    ];

    const REBIRTH_BONUS_DEFS = [
      { key: 'smartness', name: '天賦聰明', icon: '🧒', desc: '學科增長 +5%/級', cost: 10 },
      { key: 'stamina', name: '強壯體魄', icon: '💪', desc: '精力消耗 -5%/級', cost: 10 },
      { key: 'appetite', name: '大胃王', icon: '🍽️', desc: '飽足消耗 -5%/級', cost: 8 },
      { key: 'mental', name: '心態穩定', icon: '😌', desc: '壓力增長 -5%/級', cost: 12 },
      { key: 'richKid', name: '富二代', icon: '💰', desc: '初始零用錢 +$50/級', cost: 5 },
      { key: 'speedster', name: '飛毛腿', icon: '👟', desc: '通勤時間 -10%/級', cost: 8 },
      { key: 'memory', name: '過目不忘', icon: '📖', desc: '複習效率 +5%/級', cost: 10 }
    ];

    function calculateRebirthPoints() {
      const days = gameState.totalGameDays || 0;
      const money = gameState.money || 0;
      const gradeBonus = (gameState.gradeIndex || 0) * 5;
      return Math.floor(days * 0.5 + money * 0.01 + gradeBonus);
    }

    function startRebirthAllocation() {
      playSound('click');
      // 計算點數
      const points = calculateRebirthPoints();
      rebirthData.pendingPoints = points;

      // 生成世界變異（隨機 1~2 個）
      const mutCount = 1 + Math.floor(Math.random() * 2);
      const shuffled = [...WORLD_MUTATIONS].sort(() => Math.random() - 0.5);
      rebirthData.pendingMutations = shuffled.slice(0, mutCount);

      // 更新統計
      rebirthData.totalRebirths = (rebirthData.totalRebirths || 0) + 1;
      rebirthData.totalLifetimeEarnings = (rebirthData.totalLifetimeEarnings || 0) + (gameState.money || 0);
      rebirthData.totalLifetimeDays = (rebirthData.totalLifetimeDays || 0) + (gameState.totalGameDays || 0);

      // 記錄經歷過的世界變異
      if (gameState.worldMutations) {
        gameState.worldMutations.forEach(m => {
          if (!rebirthData.allMutationsExperienced.includes(m.id)) {
            rebirthData.allMutationsExperienced.push(m.id);
          }
        });
      }

      saveRebirthData();

      // 隱藏完結畫面，顯示加點面板
      document.getElementById('clear-overlay').classList.remove('active');
      renderRebirthAllocation();
      document.getElementById('rebirth-overlay').classList.add('active');
    }

    function renderRebirthAllocation() {
      const grid = document.getElementById('rebirth-alloc-grid');
      const pointsDisplay = document.getElementById('rebirth-points-display');
      pointsDisplay.innerText = rebirthData.pendingPoints;

      grid.innerHTML = REBIRTH_BONUS_DEFS.map(def => {
        const currentLevel = rebirthData.bonuses[def.key] || 0;
        const canBuy = rebirthData.pendingPoints >= def.cost;
        return `
          <div class="rebirth-stat-row">
            <span class="rs-icon">${def.icon}</span>
            <div class="rs-info">
              <div class="rs-name">${def.name}</div>
              <div class="rs-desc">${def.desc} (消耗 ${def.cost} 點)</div>
            </div>
            <span class="rs-level">Lv.${currentLevel}</span>
            <button onclick="allocRebirthPoint('${def.key}', ${def.cost})" ${canBuy ? '' : 'disabled'}>+</button>
          </div>
        `;
      }).join('');

      // 世界變異預覽
      const mutPreview = document.getElementById('rebirth-mutations-preview');
      mutPreview.innerHTML = rebirthData.pendingMutations.map(m =>
        `<span class="world-mutation-badge">${m.icon} ${m.name} — ${m.desc}</span>`
      ).join('<br>');
    }

    function allocRebirthPoint(key, cost) {
      if (rebirthData.pendingPoints < cost) return;
      playSound('click');
      rebirthData.pendingPoints -= cost;
      rebirthData.bonuses[key] = (rebirthData.bonuses[key] || 0) + 1;
      saveRebirthData();
      renderRebirthAllocation();
    }

    function confirmRebirth() {
      playSound('levelUp');

      // 套用初始加成
      const rebirthCount = rebirthData.totalRebirths;
      const mutations = rebirthData.pendingMutations;
      rebirthData.pendingMutations = [];
      saveRebirthData();

      SafeStore.remove(SAVE_KEY);
      gameState = JSON.parse(JSON.stringify(INITIAL_STATE));
      gameState.rebirthCount = rebirthCount;
      gameState.worldMutations = mutations;

      // 套用永久加成
      gameState.money = (rebirthData.bonuses.richKid || 0) * 50;

      currentLoc = 'home';
      currentState = 'idle';
      isManualLocked = false;

      saveGameData();
      document.getElementById('rebirth-overlay').classList.remove('active');
      location.reload();
    }

    // 取得永久加成的乘數 (用於 processHourlyState)
    function getRebirthMult(key) {
      loadRebirthData();
      return 1 + (rebirthData.bonuses[key] || 0) * 0.05;
    }

    function getRebirthReduction(key) {
      loadRebirthData();
      return Math.max(0.5, 1 - (rebirthData.bonuses[key] || 0) * 0.05);
    }

    // 世界變異效果乘數
    function getMutationMult(effectKey) {
      if (!gameState.worldMutations) return 1.0;
      let mult = 1.0;
      gameState.worldMutations.forEach(m => {
        switch (m.id) {
          case 'rainy':
            if (effectKey === 'sport_stress') mult *= 0.7;
            if (effectKey === 'library_eff') mult *= 1.2;
            break;
          case 'hot':
            if (effectKey === 'hunger_drain') mult *= 1.3;
            if (effectKey === 'energy_recover') mult *= 1.2;
            break;
          case 'scholar':
            if (effectKey === 'study_gain') mult *= 1.2;
            if (effectKey === 'exam_rate') mult *= 0.85;
            break;
          case 'happy':
            if (effectKey === 'stress_gain') mult *= 0.5;
            if (effectKey === 'salary') mult *= 0.7;
            break;
          case 'inflation':
            if (effectKey === 'shop_price') mult *= 1.5;
            if (effectKey === 'salary') mult *= 1.5;
            break;
          case 'ghost':
            if (effectKey === 'parent_death') mult *= 1.2;
            if (effectKey === 'parent_revive') mult *= 1.2;
            break;
        }
      });
      return mult;
    }


    // ------------------------------------------
    // 本地存檔與重置
    // ------------------------------------------
    const SAVE_KEY = "scholar_idle_savegame_v136";

    function saveGameData() {
      gameState.lastSaved = Date.now();
      gameState.currentLoc = currentLoc;
      gameState.currentState = currentState;
      SafeStore.set(SAVE_KEY, JSON.stringify(gameState));
    }

    // 將舊版自定義服飾 pixels（支援 16x16 與 18x24）自動升級為 18x30 (540像素)
    function upgradePixelsTo18x30(oldPixels, type) {
      if (!oldPixels || oldPixels.length === 540) return oldPixels;

      const newPixels = new Array(540).fill(null);

      if (oldPixels.length === 256) {
        // 先轉為 18x24 格式
        let dy = 0;
        if (type === 'clothes') dy = 6;
        else if (type === 'shoes') dy = 8;
        else dy = 0; // hat

        const dx = 1; // 水平置中

        const temp18x24 = new Array(432).fill(null);
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x++) {
            const targetY = y + dy;
            const targetX = x + dx;
            if (targetY >= 0 && targetY < 24 && targetX >= 0 && targetX < 18) {
              temp18x24[targetY * 18 + targetX] = oldPixels[y * 16 + x];
            }
          }
        }
        oldPixels = temp18x24;
      }

      // 此時 oldPixels 已經是 18x24 (長度 432) 的陣列，將其向下位移 6 行貼到 18x30 畫布
      if (oldPixels.length === 432) {
        for (let y = 0; y < 24; y++) {
          for (let x = 0; x < 18; x++) {
            const targetY = y + 6;
            if (targetY >= 0 && targetY < 30) {
              newPixels[targetY * 18 + x] = oldPixels[y * 18 + x];
            }
          }
        }
      }

      return newPixels;
    }

    function loadGameData() {
      const saved = SafeStore.get(SAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          calculateOfflineIncome(parsed);

          gameState = { ...gameState, ...parsed };
          if (!gameState.parentsStatus) gameState.parentsStatus = 'alive';
          if (!gameState.equipped) gameState.equipped = { hat: null, clothes: null, shoes: null };
          if (!gameState.customSkins) gameState.customSkins = { hat: [], clothes: [], shoes: [] };

          // v4.0.0 & v5.3.0 新增欄位預設值
          if (!gameState.bag.bento) gameState.bag.bento = 0;
          if (!gameState.bag.vitamin) gameState.bag.vitamin = 0;
          if (!gameState.passive.headphone) gameState.passive.headphone = 0;
          if (!gameState.passive.tablet) gameState.passive.tablet = 0;
          if (!gameState.passive.sofa) gameState.passive.sofa = 0;
          if (!gameState.passive.trophy) gameState.passive.trophy = 0;
          if (!gameState.buffs) gameState.buffs = [];
          if (!gameState.miniGameCooldowns) gameState.miniGameCooldowns = { school: 0, restaurant: 0, gym: 0, library: 0, store: 0, home: 0 };
          if (typeof gameState.miniGameCooldowns.store === 'undefined') gameState.miniGameCooldowns.store = 0;
          if (!gameState.worldMutations) gameState.worldMutations = [];
          if (!gameState.totalLifetimeEarnings) gameState.totalLifetimeEarnings = 0;
          if (typeof gameState.totalSpent === 'undefined') gameState.totalSpent = 0;
          if (typeof gameState.examAttempts === 'undefined') gameState.examAttempts = 0;
          if (typeof gameState.examPassStreak === 'undefined') gameState.examPassStreak = 0;
          if (typeof gameState.rebirthCount === 'undefined') gameState.rebirthCount = 0;
          if (!gameState.lastRentDay) gameState.lastRentDay = 0;
          if (!gameState.workHoursTotal) gameState.workHoursTotal = 0;
          if (!gameState.randomEventsResolved) gameState.randomEventsResolved = 0;
          if (!gameState.friends) gameState.friends = { xiaoxuan: 0, dameng: 0, yuqing: 0, xiaohao: 0 };
          if (!gameState.friendChatDay) gameState.friendChatDay = { xiaoxuan: -1, dameng: -1, yuqing: -1, xiaohao: -1 };
          if (!gameState.miniGameWins) gameState.miniGameWins = { school: 0, restaurant: 0, gym: 0, library: 0, store: 0, home: 0 };
          if (typeof gameState.miniGameWins.store === 'undefined') gameState.miniGameWins.store = 0;
          if (!gameState.miniGamePlays) gameState.miniGamePlays = { school: 0, restaurant: 0, gym: 0, library: 0, store: 0, home: 0 };
          if (typeof gameState.miniGamePlays.store === 'undefined') gameState.miniGamePlays.store = 0;

          // v6.0.0 新增小鎮島嶼建設等級預設值
          if (!gameState.landmarkLevels) {
            gameState.landmarkLevels = { school: 1, restaurant: 1, gym: 1, library: 1, store: 1, home: 1 };
          }

          // v8.5：所有舊自訂服飾 (含 v8.3 的 16x25) 一律升級成 32x50 HD
          ['hat', 'clothes', 'shoes'].forEach(type => {
            if (gameState.customSkins[type]) {
              gameState.customSkins[type].forEach(skin => {
                if (skin.pixels && skin.pixels.length !== 1600 && typeof normalizeSkinPixels === 'function') {
                  skin.pixels = normalizeSkinPixels(skin.pixels);
                }
              });
            }
          });

          currentLoc = gameState.currentLoc || "home";
          currentState = gameState.currentState || "idle";
          gameState.lastSaved = Date.now();
          // v8.2 離線收益冪等：載入後立刻把 lastSaved 回寫存檔，任何重複載入都不會再算第二次
          SafeStore.set(SAVE_KEY, JSON.stringify(gameState));
          lastSavedMinute = Math.floor(gameState.minute);
        } catch (e) {
          console.error("載入舊存檔出錯，開始新遊戲", e);
        }
      }
    }

    function calculateOfflineIncome(savedState) {
      if (!savedState.lastSaved || !isFinite(savedState.lastSaved)) return;
      const offlineMs = Date.now() - savedState.lastSaved;
      if (!isFinite(offlineMs) || offlineMs < 0) return;
      if (offlineMs < 60000) return;

      // Bug3 修正：離線收益固定用 1x 速度，避免高速模式對離線周期算動
      // (1ms = 0.001 遊戲分鐘，上限 12 遊戲小時)
      let offlineGameMinutes = Math.floor(offlineMs * 0.001);
      const maxOfflineMinutes = 720;
      if (offlineGameMinutes > maxOfflineMinutes) {
        offlineGameMinutes = maxOfflineMinutes;
      }

      let tempState = JSON.parse(JSON.stringify(savedState));
      let tempLoc = tempState.currentLoc || "home";
      const offlineHours = Math.floor(offlineGameMinutes / 60);

      function needsLibraryReviewTemp(state) {
        for (let key in state.subjects) {
          if (state.subjects[key].home < 40) return true;
        }
        return false;
      }

      for (let i = 0; i < offlineHours; i++) {
        let isWeekend = (tempState.dayOfWeek === 6 || tempState.dayOfWeek === 7);
        let targetTempLoc = tempLoc;

        const h = tempState.hour;

        // 離線時間鎖定條件
        const restaurantTempLocked = (h < 7 || h >= 22);
        const libraryTempLocked = (h < 8 || h >= 21);
        const storeTempLocked = (h >= 8 && h < 16 && !isWeekend);

        if (!isWeekend) {
          if (tempState.hunger < 35 && !restaurantTempLocked) {
            targetTempLoc = "restaurant";
          } else if (tempState.stress > 80) {
            targetTempLoc = "gym";
          } else {
            if (h >= 0 && h < 7) targetTempLoc = "home";
            else if (h >= 7 && h < 8) targetTempLoc = "restaurant";
            else if (h >= 8 && h < 16) targetTempLoc = "school";
            else if (h >= 16 && h < 18) {
              if (tempState.stress >= 50) targetTempLoc = "gym";
              else if (needsLibraryReviewTemp(tempState) && !libraryTempLocked) targetTempLoc = "library";
              else targetTempLoc = "home";
            }
            else if (h >= 18 && h < 19) targetTempLoc = "restaurant";
            else if (h >= 19 && h < 22) {
              if (needsLibraryReviewTemp(tempState) && !libraryTempLocked) targetTempLoc = "library";
              else targetTempLoc = "home";
            }
            else targetTempLoc = "home";
          }
        } else {
          const upcomingRent = 30 + ((tempState.gradeIndex || 0) * 10);
          if (h >= 0 && h < 9) targetTempLoc = "home";
          else {
            if (tempState.hunger < 45 && !restaurantTempLocked) targetTempLoc = "restaurant";
            else if (tempState.stress > 60) targetTempLoc = "gym";
            else if (tempState.money < upcomingRent && tempState.energy > 40 && !storeTempLocked) targetTempLoc = "store";
            else if (needsLibraryReviewTemp(tempState) && !libraryTempLocked) targetTempLoc = "library";
            else if (tempState.energy < 25) targetTempLoc = "home";
            else targetTempLoc = "home";
          }
        }

        // 當前目的地被時間鎖定時的自動修正
        const homeTempLocked = (tempState.hour >= 8 && tempState.hour < 16 && !isWeekend);
        const schoolTempLocked = (isWeekend || tempState.hour < 8 || tempState.hour >= 16);

        if (targetTempLoc === "home" && homeTempLocked) targetTempLoc = "school";
        if (targetTempLoc === "school" && schoolTempLocked) targetTempLoc = "home";
        if (targetTempLoc === "restaurant" && restaurantTempLocked) targetTempLoc = "home";
        if (targetTempLoc === "library" && libraryTempLocked) targetTempLoc = "home";
        if (targetTempLoc === "store" && storeTempLocked) targetTempLoc = "school";

        let hourlyWorkMinutes = 60;
        if (tempLoc !== targetTempLoc) {
          // 計算站點物理順序通勤時間
          const locIndex = { school: 1, restaurant: 2, gym: 3, library: 4, store: 5, home: 6 };
          const idx1 = locIndex[tempLoc] || 6;
          const idx2 = locIndex[targetTempLoc] || 6;
          const baseTime = Math.abs(idx1 - idx2) * 10;

          const shoesBonus = Math.max(0.4, 1 - (tempState.passive.shoes * 0.15));
          const commuteTime = Math.max(5, Math.round(baseTime * shoesBonus));

          hourlyWorkMinutes = Math.max(0, 60 - commuteTime);
          tempLoc = targetTempLoc;
        }

        let currentTempState = "idle";
        if (tempLoc === "school") {
          currentTempState = (tempState.stress >= 85) ? "angry" : "studying";
        } else if (tempLoc === "gym") {
          currentTempState = "sports";
        } else if (tempLoc === "restaurant") {
          currentTempState = "eating";
        } else if (tempLoc === "library") {
          currentTempState = "studying";
        } else if (tempLoc === "store") {
          currentTempState = "working";
        } else {
          currentTempState = (tempState.hour >= 22 || tempState.hour < 7 || tempState.energy < 30) ? "sleeping" : "idle";
        }

        const hourlyRatio = hourlyWorkMinutes / 60;

        if (currentTempState !== "sleeping") {
          tempState.energy = Math.max(0, tempState.energy - (3 * tempState.difficulty));
        } else {
          tempState.energy = Math.min(100, tempState.energy + 15 * hourlyRatio);
          if (tempState.parentsStatus === 'alive') {
            tempState.stress = Math.max(0, tempState.stress - 3 * hourlyRatio);
          } else {
            tempState.stress = Math.max(0, tempState.stress - 8 * hourlyRatio);
          }
        }

        if (currentTempState !== "eating") {
          tempState.hunger = Math.max(0, tempState.hunger - (4 * tempState.difficulty));
        } else {
          tempState.hunger = Math.min(100, tempState.hunger + 45 * hourlyRatio);
          tempState.stress = Math.max(0, tempState.stress - 2 * hourlyRatio); // 餐廳吃飯很療癒
        }

        if (currentTempState === "sports") {
          let shoesBonus = 1 + (tempState.passive.shoes * 0.2);
          tempState.stress = Math.max(0, tempState.stress - 25 * shoesBonus * hourlyRatio);
          tempState.energy = Math.max(0, tempState.energy - 5 * tempState.difficulty * hourlyRatio);
          tempState.hunger = Math.max(0, tempState.hunger - 6 * tempState.difficulty * hourlyRatio);
        }

        if (currentTempState === "working" && hourlyWorkMinutes > 0) {
          const wage = Math.round((18 + ((tempState.gradeIndex || 0) * 6)) * hourlyRatio);
          tempState.money += wage;
          tempState.workHoursTotal = (tempState.workHoursTotal || 0) + 1;
          tempState.stress = Math.min(100, tempState.stress + 4 * tempState.difficulty * hourlyRatio);
        }

        if (currentTempState === "studying" && hourlyWorkMinutes > 0) {
          let efficiency = 1.0 * hourlyRatio;
          if (tempState.energy < 20) efficiency *= 0.2;
          else if (tempState.hunger < 30) efficiency *= 0.5;

          const subKeys = ['cn', 'en', 'ma', 'sc', 'so'];
          const randomSub = subKeys[Math.floor(Math.random() * subKeys.length)];
          const sub = tempState.subjects[randomSub];
          const baseGain = Math.round((2 + Math.random() * 2) * efficiency);

          if (baseGain > 0) {
            if (tempLoc === "school" && sub.school < 60) {
              sub.school = Math.min(60, sub.school + baseGain);
            } else if (tempLoc === "library" && sub.home < 40) {
              let bookBonus = 1 + (tempState.passive.book * 0.2) + ((tempState.passive.tablet || 0) * 0.3);
              sub.home = Math.min(40, sub.home + Math.round(baseGain * bookBonus));
            }
          }

          if (tempLoc === "school") tempState.stress = Math.min(100, tempState.stress + 5 * tempState.difficulty * hourlyRatio);
          else tempState.stress = Math.min(100, tempState.stress + 8 * tempState.difficulty * hourlyRatio);
        }

        tempState.hour += 1;
        if (tempState.hour >= 24) {
          tempState.hour = 0;
          tempState.dayOfWeek += 1;

          let totalScore = 0;
          for (let key in tempState.subjects) {
            totalScore += (tempState.subjects[key].school + tempState.subjects[key].home);
          }
          tempState.money += (10 + Math.floor(totalScore / 10));
        }
        if (tempState.dayOfWeek > 7) tempState.dayOfWeek = 1;
      }

      tempState.currentLoc = tempLoc;
      tempState.currentState = (tempLoc === 'home' && tempState.hour >= 0 && tempState.hour < 7) ? "sleeping" : "idle";

      Object.assign(savedState, tempState);

      const offlineHoursRounded = (offlineMs / 3600000).toFixed(1);
      setTimeout(() => {
        queueFloatingText(`離線模擬了 ${offlineHoursRounded} 小時（已計入通勤與鎖定）`);
      }, 1200);
    }

    // 機制 2：手動鎖定 / 自動模式切換
    function toggleLockMode() {
      if (isManualLocked) {
        // 解除鎖定
        isManualLocked = false;
        gameState.overrideAction = null;
        gameState.overrideHoursLeft = 0;
        elLockBtn.innerText = '🤖 自動';
        elLockBtn.classList.remove('locked');
        queueFloatingText('已恢復自動作息模式');
      } else {
        // 鎖定當前地點
        isManualLocked = true;
        const actionMap = {
          school: 'study-school', library: 'study-library',
          gym: 'sports', restaurant: 'eat', store: 'work', home: 'sleep'
        };
        gameState.overrideAction = actionMap[currentLoc] || null;
        gameState.overrideHoursLeft = 9999; // 無限持續
        const locNameMap = { home: '住家', school: '學校', gym: '運動場', restaurant: '餐廳', library: '圖書館', store: '便利商店' };
        elLockBtn.innerText = '🔒 鎖定中';
        elLockBtn.classList.add('locked');
        queueFloatingText(`🔒 已鎖定在 ${locNameMap[currentLoc] || currentLoc}，直到手動解除`);
      }
      playSound('click');
    }

    // UX4：升學成功彩花動畫
    function celebrateGraduation() {
      const colors = ['#ff9f0a', '#30d158', '#0a84ff', '#bf5af2', '#ff453a', '#ffd60a'];
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          const el = document.createElement('div');
          el.style.cssText = `
            position: absolute;
            top: -10px;
            left: ${Math.random() * 100}vw;
            width: ${6 + Math.random() * 8}px;
            height: ${6 + Math.random() * 8}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            z-index: 99998;
            pointer-events: none;
            animation: confetti-fall ${1.5 + Math.random()}s forwards ease-in;
          `;
          document.body.appendChild(el);
          setTimeout(() => el.remove(), 2500);
        }, i * 40);
      }
    }

    // 博士轉生完結畫面
    function showGameClear() {
      celebrateGraduation();
      playSound('examSuccess');

      const overlay = document.getElementById('clear-overlay');
      const statsEl = document.getElementById('clear-stats');
      const btn = document.getElementById('btn-reincarnate');

      const rebirthStr = gameState.rebirthCount > 0
        ? `（第 ${gameState.rebirthCount + 1} 世）`
        : '';

      statsEl.innerHTML = `
        📅 共歷經 <strong>${gameState.totalGameDays}</strong> 遊戲天，累積賺得零用錢 <strong>$${gameState.money}</strong><br>
        🍌 難度係數達 <strong>${gameState.difficulty.toFixed(2)}</strong> ${rebirthStr}
      `;

      overlay.classList.add('active');

      // 3 秒後才顯示投胎按鈕（讓玩家先感受一下）
      btn.style.display = 'none';
      setTimeout(() => {
        btn.style.display = 'inline-block';
      }, 3000);
    }

    // 投胎重來！（保留原始函數給直接重置用）
    function reincarnate() {
      playSound('levelUp');
      const rebirthCount = (gameState.rebirthCount || 0) + 1;
      SafeStore.remove(SAVE_KEY);
      gameState = JSON.parse(JSON.stringify(INITIAL_STATE));
      gameState.rebirthCount = rebirthCount;
      currentLoc = 'home';
      currentState = 'idle';
      isManualLocked = false;
      document.getElementById('clear-overlay').classList.remove('active');
      location.reload();
    }

    function resetGameData() {
      if (confirm("確定要重置所有遊戲進度嗎？重置後所有累積數據將清空！")) {
        playSound('click');
        SafeStore.remove(SAVE_KEY);
        SafeStore.remove(REBIRTH_KEY);
        SafeStore.remove(ACH_KEY);
        location.reload();
      }
    }

