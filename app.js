(() => {
  'use strict';

  const TRANS_KEY = 'bibleTranslation';
  const TRANSLATIONS = [
    { id: 'kjv', label: '개역한글', lang: 'ko' },
    { id: 'krv', label: '개역개정', lang: 'ko' },
    { id: 'nks', label: '새번역', lang: 'ko' },
    { id: 'nhk', label: '새한글', lang: 'ko' },
    { id: 'msg', label: 'The Message', lang: 'en' },
    { id: 'nas', label: 'NASB 2020', lang: 'en' },
    { id: 'niv', label: 'NIV 2011', lang: 'en' },
  ];
  let currentTranslation = localStorage.getItem(TRANS_KEY) || 'kjv';
  let currentLang = TRANSLATIONS.find(t => t.id === currentTranslation)?.lang || 'ko';
  let bible = [];
  let currentView = 'home';
  let currentTestament = 'ot';
  let currentBook = null;
  let currentChapter = null;
  let compareBible = [];
  let compareTranslation = null;
  let isCompareMode = false;

  const koNames = {
    "Genesis":"창세기","Exodus":"출애굽기","Leviticus":"레위기","Numbers":"민수기","Deuteronomy":"신명기",
    "Joshua":"여호수아","Judges":"사사기","Ruth":"룻기","1 Samuel":"사무엘상","2 Samuel":"사무엘하",
    "1 Kings":"열왕기상","2 Kings":"열왕기하","1 Chronicles":"역대상","2 Chronicles":"역대하",
    "Ezra":"에스라","Nehemiah":"느헤미야","Esther":"에스더","Job":"욥기","Psalms":"시편",
    "Proverbs":"잠언","Ecclesiastes":"전도서","Song of Solomon":"아가","Isaiah":"이사야",
    "Jeremiah":"예레미야","Lamentations":"예레미야애가","Ezekiel":"에스겔","Daniel":"다니엘",
    "Hosea":"호세아","Joel":"요엘","Amos":"아모스","Obadiah":"오바댜","Jonah":"요나",
    "Micah":"미가","Nahum":"나훔","Habakkuk":"하박국","Zephaniah":"스바냐","Haggai":"학개",
    "Zechariah":"스가랴","Malachi":"말라기",
    "Matthew":"마태복음","Mark":"마가복음","Luke":"누가복음","John":"요한복음",
    "Acts":"사도행전","Romans":"로마서","1 Corinthians":"고린도전서","2 Corinthians":"고린도후서",
    "Galatians":"갈라디아서","Ephesians":"에베소서","Philippians":"빌립보서","Colossians":"골로새서",
    "1 Thessalonians":"데살로니가전서","2 Thessalonians":"데살로니가후서",
    "1 Timothy":"디모데전서","2 Timothy":"디모데후서","Titus":"디도서","Philemon":"빌레몬서",
    "Hebrews":"히브리서","James":"야고보서","1 Peter":"베드로전서","2 Peter":"베드로후서",
    "1 John":"요한일서","2 John":"요한이서","3 John":"요한삼서","Jude":"유다서","Revelation":"요한계시록"
  };
  const enNames = Object.fromEntries(Object.entries(koNames).map(([k,v])=>[v,k]));
  const otOrder = ["창세기","출애굽기","레위기","민수기","신명기","여호수아","사사기","룻기","사무엘상","사무엘하","열왕기상","열왕기하","역대상","역대하","에스라","느헤미야","에스더","욥기","시편","잠언","전도서","아가","이사야","예레미야","예레미야애가","에스겔","다니엘","호세아","요엘","아모스","오바댜","요나","미가","나훔","하박국","스바냐","학개","스가랴","말라기"];
  const ntOrder = ["마태복음","마가복음","누가복음","요한복음","사도행전","로마서","고린도전서","고린도후서","갈라디아서","에베소서","빌립보서","골로새서","데살로니가전서","데살로니가후서","디모데전서","디모데후서","디도서","빌레몬서","히브리서","야고보서","베드로전서","베드로후서","요한일서","요한이서","요한삼서","유다서","요한계시록"];
  const enOtOrder = Object.keys(koNames).slice(0, 39);
  const enNtOrder = Object.keys(koNames).slice(39);
  function getOrder(testament) {
    if (currentLang === 'ko') return testament === 'ot' ? otOrder : ntOrder;
    return testament === 'ot' ? enOtOrder : enNtOrder;
  }
  /* ─── Daily verse ─── */
  function getDailyVerse() {
    if (!bible || bible.length === 0) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    let total = 0;
    for (const book of bible) {
      for (const ch of book.chapters) total += ch.length;
    }
    let target = dayOfYear % total;
    for (const book of bible) {
      for (let ci = 0; ci < book.chapters.length; ci++) {
        const ch = book.chapters[ci];
        if (target < ch.length) {
          const displayName = currentLang === 'ko' ? (koNames[book.name] || book.name) : book.name;
          return { book: displayName, ch: ci + 1, v: target + 1, text: ch[target], enName: book.name };
        }
        target -= ch.length;
      }
    }
    return null;
  }

  function txt(key) {
    const map = {
      chapter: { ko:'장', en:'' }, chapters: { ko:'장', en:'chapters' },
      verse: { ko:'절', en:'' }, verses: { ko:'절', en:'verses' },
      total: { ko:'총', en:'' }, chapNav: { ko:'장', en:'' },
      prev: { ko:'이전 장', en:'← Prev' }, next: { ko:'다음 장', en:'Next →' },
      searchTitle: { ko:'검색 결과', en:'Search Results' },
      noResult: { ko:'검색 결과가 없습니다', en:'No results found' },
      tooMany: { ko:'결과가 너무 많습니다. 더 구체적으로 검색해보세요.', en:'Too many results. Be more specific.' },
      loading: { ko:'성경 데이터를 불러오는 중...', en:'Loading Bible data...' },
      loadFail: { ko:'데이터를 불러오는데 실패했습니다', en:'Failed to load data' },
      error: { ko:'오류 발생', en:'Error' },
      retry: { ko:'다시 시도', en:'Retry' },
      home: { ko:'성경', en:'Bible' },
      chapter: { ko:'장', en:' ' },
      myStuff: { ko:'내 자료', en:'My Stuff' },
      settings: { ko:'설정', en:'Settings' },
    };
    return (map[key] && map[key][currentLang]) || map[key]?.ko || key;
  }

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  const title = $('#title');
  const content = $('#content');
  const btnBack = $('#btnBack');
  const loading = $('#loading');
  const settingsOverlay = $('#settingsOverlay');
  const tabBar = $('#tabBar');
  const offlineBanner = document.getElementById('offlineBanner');

  function renderContent(html) {
    content.classList.remove('view-fade');
    content.innerHTML = html;
    void content.offsetHeight;
    content.classList.add('view-fade');
  }

  /* ─── Reading position ─── */
  const POS_KEY = 'bibleLastPos';
  function savePosition(book, ch, v) {
    localStorage.setItem(POS_KEY, JSON.stringify({ book, ch, v }));
  }
  function loadPosition() {
    try { return JSON.parse(localStorage.getItem(POS_KEY)); }
    catch { return null; }
  }

  /* ─── Bookmarks ─── */
  const BM_KEY = 'bibleBookmarks';
  function getBookmarks() {
    try { return JSON.parse(localStorage.getItem(BM_KEY)) || []; }
    catch { return []; }
  }
  function saveBookmarks(arr) {
    localStorage.setItem(BM_KEY, JSON.stringify(arr));
  }
  function toggleBookmark(book, ch, v, text) {
    const list = getBookmarks();
    const idx = list.findIndex(b => b.book === book && b.ch === ch && b.v === v);
    if (idx >= 0) { list.splice(idx, 1); saveBookmarks(list); return false; }
    list.unshift({ book, ch, v, text, ts: Date.now() });
    saveBookmarks(list);
    return true;
  }
  function isBookmarked(book, ch, v) {
    return getBookmarks().some(b => b.book === book && b.ch === ch && b.v === v);
  }

  /* ─── Notes ─── */
  const NT_KEY = 'bibleNotes';
  function getNotes() {
    try { return JSON.parse(localStorage.getItem(NT_KEY)) || {}; }
    catch { return {}; }
  }
  function saveNotes(obj) {
    localStorage.setItem(NT_KEY, JSON.stringify(obj));
  }
  function setNote(book, ch, v, text) {
    const key = book + '|' + ch + '|' + v;
    const obj = getNotes();
    if (text) { obj[key] = { text, ts: Date.now() }; }
    else { delete obj[key]; }
    saveNotes(obj);
  }
  function getNote(book, ch, v) {
    const key = book + '|' + ch + '|' + v;
    return getNotes()[key] || null;
  }

  /* ─── Highlights ─── */
  const HL_KEY = 'bibleHighlights';
  const HL_COLORS = ['yellow','green','blue','pink'];
  function getHighlights() {
    try { return JSON.parse(localStorage.getItem(HL_KEY)) || {}; }
    catch { return {}; }
  }
  function saveHighlights(obj) {
    localStorage.setItem(HL_KEY, JSON.stringify(obj));
  }
  function setHighlight(book, ch, v, color) {
    const key = book + '|' + ch + '|' + v;
    const obj = getHighlights();
    if (color && HL_COLORS.includes(color)) { obj[key] = { color, ts: Date.now() }; }
    else { delete obj[key]; }
    saveHighlights(obj);
  }
  function getHighlight(book, ch, v) {
    const key = book + '|' + ch + '|' + v;
    return getHighlights()[key] || null;
  }

  /* ─── Toast ─── */
  let toastTimer;
  function showToast(msg, duration) {
    duration = duration || 2000;
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  /* ─── Touch swipe state ─── */
  let touchStartX = 0;
  let touchStartY = 0;

  /* ─── Theme & Font ─── */
  const THEME_KEY = 'bibleTheme';
  const FS_KEY = 'bibleFontSize';

  const themePresets = ['light','dark','sepia','green','night'];
  const themeLabels = { light:'기본', dark:'다크', sepia:'세피아', green:'그린', night:'나이트' };
  const themeIcons = { light:'☀️', dark:'🌙', sepia:'📜', green:'🌿', night:'🌃' };

  function applyTheme(name) {
    if (name === 'custom') {
      const c = JSON.parse(localStorage.getItem('bibleCustomTheme') || '{}');
      if (c.bg) document.documentElement.style.setProperty('--bg', c.bg);
      if (c.surface) document.documentElement.style.setProperty('--surface', c.surface);
      if (c.text) document.documentElement.style.setProperty('--text', c.text);
      if (c.accent) document.documentElement.style.setProperty('--accent', c.accent);
      if (c.headerBg) document.documentElement.style.setProperty('--header-bg', c.headerBg);
      document.documentElement.removeAttribute('data-theme');
      return;
    }
    document.documentElement.removeAttribute('style');
    document.documentElement.setAttribute('data-theme', name);
  }

  function getTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches) return 'dark';
    return 'light';
  }
  function setTheme(name) {
    localStorage.setItem(THEME_KEY, name);
    applyTheme(name);
    updateThemeUI();
  }

  function getFontSize() { return parseInt(localStorage.getItem(FS_KEY)) || 17; }
  function setFontSize(val) {
    val = Math.max(12, Math.min(32, val));
    localStorage.setItem(FS_KEY, val);
    document.documentElement.style.setProperty('--fs', val + 'px');
  }

  const LH_KEY = 'bibleLineHeight';
  const LS_KEY = 'bibleLetterSpacing';
  function getLineHeight() { return parseFloat(localStorage.getItem(LH_KEY)) || 1.9; }
  function setLineHeight(val) {
    val = Math.max(1.2, Math.min(2.4, val));
    localStorage.setItem(LH_KEY, val);
    document.documentElement.style.setProperty('--lh', val);
  }
  function getLetterSpacing() { return parseFloat(localStorage.getItem(LS_KEY)) || 0; }
  function setLetterSpacing(val) {
    val = Math.max(0, Math.min(0.15, val));
    localStorage.setItem(LS_KEY, val);
    document.documentElement.style.setProperty('--ls', val + 'em');
  }

  /* ─── Settings UI ─── */
  let prevTab = 'home';
  function openSettings() {
    prevTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'home';
    setActiveTab('settings');
    const theme = getTheme();
    const fs = getFontSize();
    const lh = getLineHeight();
    const ls = getLetterSpacing();
    const ct = JSON.parse(localStorage.getItem('bibleCustomTheme') || '{}');

    settingsOverlay.innerHTML = `
      <div id="settingsPanel">
        <button class="close-settings" id="closeSettings"><svg viewBox="0 0 24 24" width="18" height="18"><use href="#i-close"/></svg></button>
        <h2>설정</h2>

        <div class="section">
          <div class="section-label">테마</div>
          <div class="theme-grid">
            ${themePresets.map(t => `
              <button class="theme-btn${theme===t?' active':''}" data-theme="${t}">
                ${themeIcons[t]} ${themeLabels[t]}
              </button>
            `).join('')}
            <button class="theme-btn${theme==='custom'?' active':''}" data-theme="custom">🎨 사용자 지정</button>
          </div>
          <div class="custom-theme" id="customTheme" style="display:${theme==='custom'?'block':'none'}">
            <div class="custom-theme-row"><label>배경</label><input type="color" id="ctBg" value="${ct.bg||'#f5f0e8'}"></div>
            <div class="custom-theme-row"><label>표면</label><input type="color" id="ctSurface" value="${ct.surface||'#ffffff'}"></div>
            <div class="custom-theme-row"><label>글자</label><input type="color" id="ctText" value="${ct.text||'#1a1a1a'}"></div>
            <div class="custom-theme-row"><label>강조</label><input type="color" id="ctAccent" value="${ct.accent||'#8b4513'}"></div>
            <div class="custom-theme-row"><label>헤더</label><input type="color" id="ctHeader" value="${ct.headerBg||'#1a1a2e'}"></div>
          </div>
        </div>

        <div class="section">
          <div class="section-label">글자 크기: <span id="fsDisplay">${fs}px</span></div>
          <div class="font-control">
            <span>작게</span>
            <input type="range" id="fsSlider" min="12" max="32" value="${fs}">
            <span>크게</span>
          </div>
        </div>

        <div class="section">
          <div class="section-label">줄 간격: <span id="lhDisplay">${lh.toFixed(1)}</span></div>
          <div class="font-control">
            <span>좁게</span>
            <input type="range" id="lhSlider" min="12" max="24" value="${Math.round(lh * 10)}">
            <span>넓게</span>
          </div>
        </div>

        <div class="section">
          <div class="section-label">글자 간격: <span id="lsDisplay">${(ls * 100).toFixed(0)}</span></div>
          <div class="font-control">
            <span>좁게</span>
            <input type="range" id="lsSlider" min="0" max="15" value="${Math.round(ls * 100)}">
            <span>넓게</span>
          </div>
        </div>

        <div class="section">
          <div class="section-label">미리보기</div>
          <div id="previewBlock" style="padding:12px;background:var(--surface);border-radius:8px;border:1px solid var(--border)">
            <span style="color:var(--accent);font-weight:600">요한복음 3:16</span><br>
            하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라
          </div>
        </div>

        <div class="section" style="border-top:1px solid var(--border);padding-top:16px">
          <button id="resetDefaults" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text-dim);cursor:pointer;font-size:0.85em">기본값으로 초기화</button>
        </div>
      </div>
    `;
    settingsOverlay.classList.add('open');

    $('#closeSettings').onclick = closeSettings;
    settingsOverlay.onclick = e => { if (e.target === settingsOverlay) closeSettings(); };

    // Theme buttons
    settingsOverlay.querySelectorAll('.theme-btn').forEach(btn => {
      btn.onclick = () => {
        setTheme(btn.dataset.theme);
        document.getElementById('customTheme').style.display = btn.dataset.theme === 'custom' ? 'block' : 'none';
      };
    });

    // Custom color pickers
    const ctInputs = ['ctBg','ctSurface','ctText','ctAccent','ctHeader'];
    ctInputs.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        const custom = {};
        ctInputs.forEach(i => { custom[i.replace('ct', '').toLowerCase()] = document.getElementById(i).value; });
        localStorage.setItem('bibleCustomTheme', JSON.stringify({
          bg: custom.bg, surface: custom.surface, text: custom.text,
          accent: custom.accent, headerBg: custom.header
        }));
        localStorage.setItem(THEME_KEY, 'custom');
        applyTheme('custom');
        settingsOverlay.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === 'custom'));
      });
    });

    // Font slider
    const slider = $('#fsSlider');
    const display = $('#fsDisplay');
    slider.oninput = () => {
      const v = parseInt(slider.value);
      display.textContent = v + 'px';
      setFontSize(v);
    };

    // Line height slider
    const lhSlider = $('#lhSlider');
    const lhDisplay = $('#lhDisplay');
    const previewBlock = $('#previewBlock');
    lhSlider.oninput = () => {
      const v = parseInt(lhSlider.value) / 10;
      lhDisplay.textContent = v.toFixed(1);
      setLineHeight(v);
      if (previewBlock) previewBlock.style.lineHeight = v;
    };

    // Letter spacing slider
    const lsSlider = $('#lsSlider');
    const lsDisplay = $('#lsDisplay');
    lsSlider.oninput = () => {
      const v = parseInt(lsSlider.value) / 100;
      lsDisplay.textContent = (v * 100).toFixed(0);
      setLetterSpacing(v);
      if (previewBlock) previewBlock.style.letterSpacing = v + 'em';
    };

    // Reset to defaults
    $('#resetDefaults').onclick = () => {
      localStorage.removeItem(FS_KEY);
      localStorage.removeItem(LH_KEY);
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(THEME_KEY);
      localStorage.removeItem('bibleCustomTheme');
      closeSettings();
      setFontSize(17);
      setLineHeight(1.9);
      setLetterSpacing(0);
      applyTheme(getTheme());
      showToast('설정이 기본값으로 초기화되었습니다');
    };
  }

  function closeSettings() { settingsOverlay.classList.remove('open'); settingsOverlay.innerHTML = ''; setActiveTab(prevTab); }

  function updateThemeUI() {
    // Theme icon update not needed (no header settings button)
  }

  /* ─── Init theme & font ─── */
  applyTheme(getTheme());
  setFontSize(getFontSize());
  setLineHeight(getLineHeight());
  setLetterSpacing(getLetterSpacing());
  updateThemeUI();

  /* ─── Navigation ─── */
  btnBack.addEventListener('click', goBack);
  title.addEventListener('click', () => { if (currentView !== 'home') showHome(); });
  function setActiveTab(tab) {
    tabBar.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  }
  tabBar.addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    const tab = btn.dataset.tab;
    if (settingsOverlay.classList.contains('open')) closeSettings();
    setActiveTab(tab);
    if (tab === 'home') showHome();
    else if (tab === 'search') showSearchView();
    else if (tab === 'mystuff') showMyStuff();
    else if (tab === 'settings') {
      if (settingsOverlay.classList.contains('open')) closeSettings();
      else openSettings();
    }
  });

  document.addEventListener('keydown', e => {
    if (settingsOverlay.classList.contains('open')) return;
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      content.scrollBy({ top: -80, behavior: 'smooth' });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      content.scrollBy({ top: 80, behavior: 'smooth' });
    }

    if (currentView !== 'chapter') return;
    const book = findBook(currentBook);
    if (!book) return;
    if (e.key === 'ArrowLeft' && currentChapter > 1) {
      e.preventDefault();
      showChapter(currentBook, currentChapter - 1);
    } else if (e.key === 'ArrowRight' && currentChapter < book.chapters.length) {
      e.preventDefault();
      showChapter(currentBook, currentChapter + 1);
    }
  });

  function showSearchView() {
    currentView = 'search';
    setActiveTab('search');
    setTitle(txt('searchTitle'));
    showBack(true);
    renderContent(`
      <div class="search-view">
        <div class="sv-bar">
          <input type="text" class="sv-input" id="svInput" placeholder="${currentLang === 'ko' ? '검색어 입력...' : 'Search...'}" autocomplete="off">
        </div>
        <div id="svResults"></div>
      </div>`);
    setupSearchInput('svInput');
    const input = document.getElementById('svInput');
    if (input) input.focus();
  }

  function goBack() {
    if (currentView === 'chapter') { showBook(currentBook); }
    else if (currentView === 'book') { showHome(); }
    else if (currentView === 'search') { showHome(); }
    else if (currentView === 'compare') { exitCompare(); }
    else if (currentView === 'verse') { showBook(currentBook); }
    else if (currentView === 'mystuff') { showHome(); }
  }

  function setTitle(t) { title.textContent = t; }
  function showBack(v) { btnBack.style.visibility = v ? 'visible' : 'hidden'; }

  /* 전역 오류 표시 */
  window.onerror = function(msg, src, line, col, err) {
    var el = document.getElementById('loading');
    if (el) el.innerHTML = '오류 발생<br><small>' + msg + '<br>' + (src||'') + ':' + line + ':' + col + '</small>';
    return true;
  };

  async function loadBibleData(transId) {
    const CACHE_VER = 'v11';
    const cacheKey = 'bible_' + transId + '_' + CACHE_VER;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        bible = JSON.parse(cached);
        currentTranslation = transId;
        currentLang = TRANSLATIONS.find(t => t.id === transId)?.lang || 'ko';
        localStorage.setItem(TRANS_KEY, transId);
        updateOnlineStatus();
        loading.classList.add('hide');
        return true;
      } catch (e) { sessionStorage.removeItem(cacheKey); }
    }
    loading.classList.remove('hide');
    loading.textContent = txt('loading');
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 30000);
    try {
      const url = 'data/bible-' + transId + '.json?v=11';
      const resp = await fetch(url, { signal: ctrl.signal });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      bible = await resp.json();
      try { sessionStorage.setItem(cacheKey, JSON.stringify(bible)); } catch (e) {}
      currentTranslation = transId;
      currentLang = TRANSLATIONS.find(t => t.id === transId)?.lang || 'ko';
      localStorage.setItem(TRANS_KEY, transId);
      clearTimeout(timeout);
      loading.classList.add('hide');
      return true;
    } catch(e) {
      clearTimeout(timeout);
      loading.innerHTML = txt('loadFail') + '<br><small>' + e.message + '<br><br><a href="?reset=' + Date.now() + '" style="color:#fff">' + txt('retry') + '</a></small>';
      console.error(e);
      return false;
    }
  }


  async function loadCompareData(transId) {
    const CACHE_VER = 'v11';
    const cacheKey = 'bible_' + transId + '_' + CACHE_VER;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        compareBible = JSON.parse(cached);
        compareTranslation = transId;
        loading.classList.add('hide');
        return true;
      } catch (e) { sessionStorage.removeItem(cacheKey); }
    }
    loading.classList.remove('hide');
    loading.textContent = txt('loading');
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 30000);
    try {
      const url = 'data/bible-' + transId + '.json?v=11';
      const resp = await fetch(url, { signal: ctrl.signal });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      compareBible = await resp.json();
      try { sessionStorage.setItem(cacheKey, JSON.stringify(compareBible)); } catch (e) {}
      compareTranslation = transId;
      clearTimeout(timeout);
      loading.classList.add('hide');
      return true;
    } catch(e) {
      clearTimeout(timeout);
      loading.innerHTML = txt('loadFail') + '<br><small>' + e.message + '<br><br><a href="?reset=' + Date.now() + '" style="color:#fff">' + txt('retry') + '</a></small>';
      console.error(e);
      return false;
    }
  }

  /* ── Online/Offline detection ─── */
  const OFFLINE_MSGS = { ko: '인터넷 연결이 끊어졌습니다', en: 'You are offline' };
  function updateOnlineStatus() {
    offlineBanner.textContent = OFFLINE_MSGS[currentLang] || OFFLINE_MSGS.en;
    offlineBanner.classList.toggle('show', !navigator.onLine);
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  async function init() {
    const ok = await loadBibleData(currentTranslation);
    if (!ok) return;
    let isReload = false;
    try {
      const navs = performance.getEntriesByType('navigation');
      if (navs && navs.length > 0) isReload = navs[0].type === 'reload';
      else isReload = performance.navigation.type === 1;
    } catch (e) {}
    if (isReload) {
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      showHome();
    } else handleHash();
  }

  function findBook(name) {
    if (currentLang === 'ko') {
      const en = enNames[name] || name;
      return bible.find(b => b.name === en);
    }
    return bible.find(b => b.name === (enNames[name] || name));
  }

  function displayBookName(book, fallback) {
    if (!book) return fallback;
    return currentLang === 'ko' ? (koNames[book.name] || fallback || book.name) : book.name;
  }

  function findBookIn(data, displayName) {
    let enName = enNames[displayName] || displayName;
    return data.find(b => b.name === enName);
  }

  function showHome() {
    currentView = 'home';
    currentBook = null; currentChapter = null;
    setActiveTab('home');
    setTitle(txt('home'));
    showBack(false);
    const curTrans = TRANSLATIONS.find(t => t.id === currentTranslation);
    const dv = getDailyVerse();
    renderContent(`
      ${dv ? `
      <div class="home-card">
        <div class="cv-card" id="dailyVerse" data-book="${dv.enName}" data-ch="${dv.ch}" data-v="${dv.v}">
          <div class="cv-label">${currentLang === 'ko' ? '✝ 오늘의 말씀' : '✝ Verse of the Day'}</div>
          <div class="cv-text">${escHtml(dv.text)}</div>
          <div class="cv-ref">${dv.book} ${dv.ch}:${dv.v}</div>
        </div>
      </div>` : ''}
      <div class="home-card">
        <div class="rp-card" id="readingPlanCard">${showReadingPlanUI()}</div>
      </div>
      <div class="home-card" id="transCard">
        <div class="tb-card" id="transBar">
          <span class="tb-label"><svg viewBox="0 0 24 24" width="18" height="18"><use href="#i-book"/></svg></span>
          <span class="tb-name" id="transName">${curTrans ? curTrans.label : '??'}</span>
          <span class="tb-arrow">▾</span>
        </div>
      </div>
      <div class="testament-tabs">
        <button class="active" data-t="ot">${currentLang === 'ko' ? '구약' : 'OT'}</button>
        <button data-t="nt">${currentLang === 'ko' ? '신약' : 'NT'}</button>
      </div>
      <div class="book-list" id="bookList"></div>
    `);
    document.getElementById('transBar').addEventListener('click', showTranslationPicker);
    const dvEl = document.getElementById('dailyVerse');
    if (dvEl) {
      dvEl.addEventListener('click', () => { const d = dvEl.dataset; showChapter(d.book, parseInt(d.ch), parseInt(d.v)); });
      addDailyVerseCardBtn();
    }
    setupReadingPlanUI();
    const tabs = $$('.testament-tabs button');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      currentTestament = t.dataset.t;
      renderBooks(currentTestament);
    }));
    renderBooks('ot');
  }

  function renderBooks(testament) {
    const list = $('#bookList');
    const names = getOrder(testament);
    list.innerHTML = names.map(n => {
      const book = findBook(n);
      const chapters = book ? book.chapters.length : 0;
      const badge = currentLang === 'ko' ? chapters + '장' : '' + chapters;
      return `<div class="book-item" data-book="${n}"><div>${n}</div><div class="badge">${badge}</div></div>`;
    }).join('');
    list.querySelectorAll('.book-item').forEach(el => {
      el.addEventListener('click', () => showBook(el.dataset.book));
    });
  }

  function showTranslationPicker() {
    // Reset compare-mode state
    const existingOverlay = document.getElementById('transOverlay');
    if (existingOverlay) {
      delete existingOverlay._cmpCallback;
      existingOverlay.querySelectorAll('.trans-item').forEach(x => x.style.display = '');
      const h3 = existingOverlay.querySelector('h3');
      if (h3) h3.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:middle;margin-right:4px"><use href="#i-book"/></svg> ' + (currentLang === 'ko' ? '번역 선택' : 'Select Translation');
    }
    let overlay = document.getElementById('transOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'transOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:45;display:none;align-items:center;justify-content:center';
      overlay.innerHTML = '<div style="background:var(--surface);width:90%;max-width:360px;border-radius:14px;padding:20px;box-shadow:0 4px 24px var(--shadow);max-height:70vh;overflow-y:auto">'
        + '<h3 style="font-size:1em;margin-bottom:12px;color:var(--text)"><svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:middle;margin-right:4px"><use href="#i-book"/></svg> ' + (currentLang === 'ko' ? '번역 선택' : 'Select Translation') + '</h3>'
        + '<div id="transList"></div>'
        + '<button id="transClose" style="width:100%;margin-top:12px;padding:10px;border:none;border-radius:8px;background:var(--hover);color:var(--text);cursor:pointer;font-size:0.85em">'
        + (currentLang === 'ko' ? '닫기' : 'Close') + '</button></div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
      document.getElementById('transClose').addEventListener('click', () => overlay.style.display = 'none');
    }
    const list = document.getElementById('transList');
    list.innerHTML = TRANSLATIONS.map(t =>
      '<div class="trans-item' + (t.id === currentTranslation ? ' active' : '') + '" data-id="' + t.id + '" style="padding:12px 14px;border-radius:8px;cursor:pointer;margin-bottom:4px;transition:all 0.15s;display:flex;align-items:center;gap:10px;' + (t.id === currentTranslation ? 'background:var(--accent);color:#fff;font-weight:600' : 'background:var(--hover);color:var(--text)') + '">'
      + '<span style="font-size:1.1em">' + (t.lang === 'ko' ? '🇰🇷' : '🇺🇸') + '</span>'
      + '<span>' + t.label + '</span>'
      + (t.id === currentTranslation ? '<span style="margin-left:auto">✓</span>' : '')
      + '</div>'
    ).join('');
    list.querySelectorAll('.trans-item').forEach(el => {
      el.addEventListener('click', async () => {
        const id = el.dataset.id;
        if (id === currentTranslation) { overlay.style.display = 'none'; return; }
        overlay.style.display = 'none';
        if (overlay._cmpCallback) {
          const cb = overlay._cmpCallback;
          delete overlay._cmpCallback;
          overlay.querySelectorAll('.trans-item').forEach(x => x.style.display = '');
          const h3 = overlay.querySelector('h3');
          if (h3) h3.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:middle;margin-right:4px"><use href="#i-book"/></svg> '
            + (currentLang === 'ko' ? '번역 선택' : 'Select Translation');
          cb(id);
          return;
        }
        const ok = await loadBibleData(id);
        if (ok) showHome();
      });
    });
    overlay.style.display = 'flex';
  }

  function showComparePicker(callback) {
    showTranslationPicker();
    const overlay = document.getElementById('transOverlay');
    if (overlay) {
      overlay._cmpCallback = callback;
      const h3 = overlay.querySelector('h3');
      if (h3) h3.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:middle;margin-right:4px"><use href="#i-book"/></svg> '
        + (currentLang === 'ko' ? '비교할 번역 선택' : 'Select Translation to Compare');
      const list = document.getElementById('transList');
      const quickId = getPreferredCompareTranslationId();
      const quickTrans = TRANSLATIONS.find(t => t.id === quickId);
      const currentTrans = TRANSLATIONS.find(t => t.id === currentTranslation);
      if (list && quickTrans && currentTrans) {
        list.insertAdjacentHTML('afterbegin',
          '<button class="compare-quick" id="compareQuick" type="button">'
          + '<span class="compare-quick-title">' + (currentLang === 'ko' ? '한영 병행 보기' : 'Korean-English Parallel') + '</span>'
          + '<span class="compare-quick-sub">' + currentTrans.label + ' + ' + quickTrans.label + '</span>'
          + '</button>'
        );
        const quick = document.getElementById('compareQuick');
        if (quick) quick.addEventListener('click', () => {
          overlay.style.display = 'none';
          delete overlay._cmpCallback;
          callback(quickId);
        });
      }
      overlay.querySelectorAll('.trans-item').forEach(el => {
        if (el.dataset.id === currentTranslation) el.style.display = 'none';
      });
    }
  }

  function getPreferredCompareTranslationId() {
    const current = TRANSLATIONS.find(t => t.id === currentTranslation);
    const preferred = current && current.lang === 'ko'
      ? ['niv', 'nas', 'msg']
      : ['kjv', 'krv', 'nks', 'nhk'];
    return preferred.find(id => id !== currentTranslation) || TRANSLATIONS.find(t => t.id !== currentTranslation)?.id;
  }

  /* ─── Book navigator (dropdown from chapter view) ─── */
  let bNavState = 'ot';

  function showBookNavigator() {
    let ov = document.getElementById('bookNavOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'bookNavOverlay';
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:45;display:none;align-items:center;justify-content:center';
      document.body.appendChild(ov);
      ov.addEventListener('click', e => { if (e.target === ov) ov.style.display = 'none'; });
    }
    ov.innerHTML = `
      <div style="background:var(--surface);width:92%;max-width:400px;border-radius:14px;padding:16px 20px;box-shadow:0 4px 24px var(--shadow);max-height:80vh;overflow-y:auto">
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <button class="bn-tab active" data-t="ot" style="flex:1;padding:8px;border:none;border-radius:6px;font-weight:600;cursor:pointer;background:var(--accent);color:#fff">${currentLang === 'ko' ? '구약' : 'OT'}</button>
          <button class="bn-tab" data-t="nt" style="flex:1;padding:8px;border:none;border-radius:6px;font-weight:600;cursor:pointer;background:var(--hover);color:var(--text)">${currentLang === 'ko' ? '신약' : 'NT'}</button>
        </div>
        <div id="bnList"></div>
        <button id="bnClose" style="width:100%;margin-top:10px;padding:10px;border:none;border-radius:8px;background:var(--hover);color:var(--text);cursor:pointer;font-size:0.85em">${currentLang === 'ko' ? '닫기' : 'Close'}</button>
      </div>`;
    ov.style.display = 'flex';
    document.getElementById('bnClose').addEventListener('click', () => ov.style.display = 'none');
    ov.querySelectorAll('.bn-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        ov.querySelectorAll('.bn-tab').forEach(b => { b.style.background = 'var(--hover)'; b.style.color = 'var(--text)'; });
        btn.style.background = 'var(--accent)'; btn.style.color = '#fff';
        bNavState = btn.dataset.t;
        renderBNBookList(ov);
      });
    });
    renderBNBookList(ov);
  }

  function renderBNBookList(ov) {
    const list = document.getElementById('bnList');
    const names = getOrder(bNavState);
    list.innerHTML = names.map(n => {
      const book = findBook(n);
      const ch = book ? book.chapters.length : 0;
      return `<div class="bn-book-item" data-book="${n}" style="padding:10px 14px;border-radius:8px;cursor:pointer;margin-bottom:3px;display:flex;justify-content:space-between;align-items:center;background:var(--hover);color:var(--text);transition:background 0.15s">
        <span style="font-weight:500">${n}</span>
        <span style="font-size:0.75em;opacity:0.6">${ch}${txt('chapter').trim()}</span>
      </div>`;
    }).join('');
    list.querySelectorAll('.bn-book-item').forEach(el => {
      el.addEventListener('click', () => {
        const name = el.dataset.book;
        const book = findBook(name);
        if (!book) return;
        // Replace list with chapter grid
        list.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;padding:4px 0">${book.chapters.map((_,i) =>
          `<button class="bn-ch-item" data-ch="${i+1}" style="width:48px;height:48px;border:none;border-radius:8px;background:var(--hover);color:var(--text);font-size:0.85em;font-weight:600;cursor:pointer;transition:background 0.15s">${i+1}</button>`
        ).join('')}</div>
        <button id="bnBackToList" style="margin-top:8px;padding:6px 12px;border:none;border-radius:6px;background:none;color:var(--accent);cursor:pointer;font-size:0.8em">← ${currentLang === 'ko' ? '책 목록' : 'Back to books'}</button>`;
        document.getElementById('bnBackToList').addEventListener('click', () => renderBNBookList(ov));
        list.querySelectorAll('.bn-ch-item').forEach(btn => {
          btn.addEventListener('click', () => {
            ov.style.display = 'none';
            showChapter(name, parseInt(btn.dataset.ch), 1);
          });
        });
      });
    });
  }

  function showBook(name) {
    currentView = 'book';
    currentBook = name; currentChapter = null;
    setActiveTab('');
    setTitle(name);
    showBack(true);
    const book = findBook(name);
    if (!book) { renderContent('<p style="padding:16px">데이터를 찾을 수 없습니다</p>'); return; }
    const total = book.chapters.reduce((a,c)=>a+c.length,0);
    renderContent(`
      <div class="info-bar">
        <span>${book.chapters.length} ${txt('chapters')}</span>
        <span>${total} ${txt('verses')}</span>
      </div>
      <div class="chapter-grid">${book.chapters.map((_,i)=>`<div class="chapter-item" data-ch="${i+1}">${i+1}${txt('chapter')}</div>`).join('')}</div>
      <div id="verseGrid" style="display:none"></div>
    `);

    content.querySelectorAll('.chapter-item').forEach(el => {
      el.addEventListener('click', () => showChapterVerses(name, parseInt(el.dataset.ch)));
    });
  }

  function showChapterVerses(name, chNum) {
    currentView = 'verse';
    currentBook = name; currentChapter = chNum;
    setActiveTab('');
    setTitle(name + ' ' + chNum + txt('chapter'));
    showBack(true);
    const book = findBook(name);
    if (!book || !book.chapters[chNum-1]) { renderContent('<p style="padding:16px">데이터를 찾을 수 없습니다</p>'); return; }
    const verses = book.chapters[chNum-1];
    renderContent(`
      <div class="info-bar">
        <span>${name} ${chNum}${txt('chapter')}</span>
        <span>${verses.length} ${txt('verses')}</span>
      </div>
      <div class="vs-grid">${verses.map((_,i)=>`<button class="vs-item" data-v="${i+1}">${i+1}</button>`).join('')}</div>
      <button class="deselect-btn" id="deselectVerse">${currentLang === 'ko' ? '취소' : 'Cancel'}</button>
    `);
    content.querySelectorAll('.vs-item').forEach(btn => {
      btn.addEventListener('click', function() {
        showChapter(name, chNum, parseInt(this.dataset.v));
      });
    });
    const ds = $('#deselectVerse');
    if (ds) ds.addEventListener('click', () => showChapter(name, chNum));
  }

  function showCompareChapter(name, chNum) {
    currentView = 'compare';
    setActiveTab('');
    const primaryBook = findBook(name);
    const displayName = displayBookName(primaryBook, name);
    currentBook = displayName; currentChapter = chNum;
    setTitle(displayName + ' ' + chNum + txt('chapter'));
    showBack(true);
    const compareBook = findBookIn(compareBible, displayName);
    if (!primaryBook || !primaryBook.chapters[chNum-1]) {
      renderContent('<p style="padding:16px">' + (currentLang === 'ko' ? '데이터를 찾을 수 없습니다' : 'Data not found') + '</p>');
      return;
    }
    const primaryVerses = primaryBook.chapters[chNum-1];
    const compareVerses = compareBook ? compareBook.chapters[chNum-1] : [];
    const maxV = Math.max(primaryVerses.length, compareVerses ? compareVerses.length : 0);
    const primaryTrans = TRANSLATIONS.find(t => t.id === currentTranslation);
    const compareTrans = TRANSLATIONS.find(t => t.id === compareTranslation);
    const primaryLabel = primaryTrans?.label || currentTranslation;
    const compareLabel = compareTrans?.label || compareTranslation;
    const primaryLang = primaryTrans?.lang === 'ko' ? '한글' : 'English';
    const compareLang = compareTrans?.lang === 'ko' ? '한글' : 'English';
    const isBilingual = primaryTrans && compareTrans && primaryTrans.lang !== compareTrans.lang;
    const ab = document.getElementById('verseActionBar');
    if (ab) ab.classList.remove('show');
    let rowsHtml = '';
    for (let i = 0; i < maxV; i++) {
      const vn = i + 1;
      const pText = primaryVerses[i] ? escHtml(primaryVerses[i]) : '';
      const cText = (compareVerses && compareVerses[i]) ? escHtml(compareVerses[i]) : '';
      const bm = isBookmarked(displayName, chNum, vn);
      const hl = getHighlight(displayName, chNum, vn);
      const nt = getNote(displayName, chNum, vn);
      const hlCls = hl ? ' cmp-hl-' + hl.color : '';
      const bmMark = bm ? '<span class="bm-indicator"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><use href="#i-bookmark"/></svg></span>' : '';
      const ntMark = nt ? '<span class="nt-indicator"><svg viewBox="0 0 24 24" width="14" height="14"><use href="#i-note"/></svg></span>' : '';
      rowsHtml += '<div class="cmp-row">'
        + '<div class="cmp-cell cmp-cell-primary' + hlCls + '">'
        + '<span class="cmp-cell-label">' + primaryLang + '</span>'
        + '<span class="vnum">' + vn + '</span>' + '<span class="vtext">' + pText + '</span>' + bmMark + ntMark
        + '</div>'
        + '<div class="cmp-cell cmp-cell-secondary">'
        + '<span class="cmp-cell-label">' + compareLang + '</span>'
        + '<span class="vnum">' + vn + '</span>' + '<span class="vtext">' + cText + '</span>'
        + '</div>'
        + '</div>';
    }
    renderContent(''
      + '<div class="compare-view">'
      + '<div class="cmp-header">'
      + '<div class="cmp-title">'
      + '<span class="cmp-kicker">' + (isBilingual ? (currentLang === 'ko' ? '한영 병행' : 'Bilingual') : (currentLang === 'ko' ? '번역 비교' : 'Compare')) + '</span>'
      + '<span class="cmp-label">' + primaryLabel + ' | ' + compareLabel + '</span>'
      + '</div>'
      + '<button class="cmp-exit-btn" id="cmpExit">✕ ' + (currentLang === 'ko' ? '단일보기' : 'Single View') + '</button>'
      + '</div>'
      + '<div class="cmp-column-labels"><span>' + primaryLang + ' · ' + primaryLabel + '</span><span>' + compareLang + ' · ' + compareLabel + '</span></div>'
      + '<div class="cmp-body">'
      + rowsHtml
      + '</div>'
      + '<div class="chapter-nav">'
      + '<button id="prevCh" class="' + (chNum > 1 ? '' : 'hidden') + '">'
      + '<span class="arrow">←</span> <span>' + txt('prev') + '</span>'
      + '</button>'
      + '<button id="nextCh" class="' + (chNum < primaryBook.chapters.length ? '' : 'hidden') + '">'
      + '<span>' + txt('next') + '</span> <span class="arrow">→</span>'
      + '</button>'
      + '</div>'
      + '</div>'
    );
    content.scrollTop = 0;
    window.scrollTo(0, 0);
    const prev = $('#prevCh');
    const next = $('#nextCh');
    if (prev) prev.addEventListener('click', () => { if (chNum > 1) showCompareChapter(displayName, chNum - 1); });
    if (next) next.addEventListener('click', () => { if (chNum < primaryBook.chapters.length) showCompareChapter(displayName, chNum + 1); });
    const exitBtn = $('#cmpExit');
    if (exitBtn) exitBtn.addEventListener('click', exitCompare);
  }

  function exitCompare() {
    compareBible = [];
    compareTranslation = null;
    isCompareMode = false;
    showChapter(currentBook, currentChapter, 1);
  }

    function showChapter(name, chNum, targetVerse) {
    currentView = 'chapter';
    setActiveTab('');
    const book = findBook(name);
    const displayName = displayBookName(book, name);
    currentBook = displayName; currentChapter = chNum;
    setTitle(displayName + ' ' + chNum + txt('chapter'));
    showBack(true);
    if (!book || !book.chapters[chNum-1]) { renderContent('<p style="padding:16px">데이터를 찾을 수 없습니다</p>'); return; }
    const verses = book.chapters[chNum-1];

    renderContent(`
      <div class="verse-view">
        <div class=\"chapter-title\"><span class=\"ct-text\">${displayName} ${chNum}${txt('chapter')}</span><span class=\"ct-compare\" id=\"btnCompare\" title=\"${currentLang === 'ko' ? '번역본 비교' : 'Compare Translations'}\"><svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\"><use href=\"#i-compare\"/></svg></span></div>
        ${verses.map((v,i)=>{
          const vn = i+1;
          const bm = isBookmarked(displayName, chNum, vn);
          const hl = getHighlight(displayName, chNum, vn);
          const nt = getNote(displayName, chNum, vn);
          const hlCls = hl ? ' hl-' + hl.color : '';
          const bmMark = bm ? '<span class="bm-indicator"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><use href="#i-bookmark"/></svg></span>' : '';
          const ntMark = nt ? '<span class="nt-indicator"><svg viewBox="0 0 24 24" width="14" height="14"><use href="#i-note"/></svg></span>' : '';
          return `<div class="verse-item${hlCls}" data-v="${vn}" data-book="${displayName}" data-ch="${chNum}"><span class="vnum">${vn}</span><span class="vtext">${v}</span>${bmMark}${ntMark}</div>`;
        }).join('')}
      </div>
        <div class="chapter-nav">
          <button id="prevCh" class="${chNum > 1 ? '' : 'hidden'}">
            <span class="arrow">←</span> <span>${txt('prev')}</span>
          </button>
          <button id="nextCh" class="${chNum < book.chapters.length ? '' : 'hidden'}">
            <span>${txt('next')}</span> <span class="arrow">→</span>
          </button>
        </div>
      </div>
    `);

    // Reset scroll position to top
    content.scrollTop = 0;
    window.scrollTo(0, 0);

    const prev = $('#prevCh');
    const next = $('#nextCh');
    if (prev) {
      prev.addEventListener('click', () => {
        if (chNum > 1) showChapter(displayName, chNum - 1);
      });
    }
    if (next) {
      next.addEventListener('click', () => {
        if (chNum < book.chapters.length) showChapter(displayName, chNum + 1);
      });
    }

    /* ─── Chapter title → book navigator ─── */
    const ct = content.querySelector('.chapter-title');
    if (ct) ct.addEventListener('click', (e) => {
      if (e.target.closest('.ct-compare')) return;
      showBookNavigator();
    });
    const cmpBtn = document.getElementById('btnCompare');
    if (cmpBtn) cmpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showComparePicker(async (id) => {
        const ok = await loadCompareData(id);
        if (ok) {
          isCompareMode = true;
          showCompareChapter(currentBook, currentChapter);
        }
      });
    });

    /* ─── Action bar ─── */
    let actionBar = document.getElementById('verseActionBar');
    if (!actionBar) {
      actionBar = document.createElement('div');
      actionBar.id = 'verseActionBar';
      actionBar.className = 'verse-action-bar';
      actionBar.innerHTML = `
        <button class="act-btn" id="actBookmark" title="북마크"><svg viewBox="0 0 24 24" width="18" height="18"><use href="#i-bookmark"/></svg> ${currentLang === 'ko' ? '북마크' : 'Bookmark'}</button>
        <button class="act-btn" id="actHighlight" title="하이라이트"><svg viewBox="0 0 24 24" width="18" height="18"><use href="#i-highlight"/></svg> ${currentLang === 'ko' ? '하이라이트' : 'Highlight'}</button>
        <button class="act-btn" id="actNote" title="메모"><svg viewBox="0 0 24 24" width="18" height="18"><use href="#i-note"/></svg> ${currentLang === 'ko' ? '메모' : 'Note'}</button>
        <button class="act-btn" id="actCard" title="말씀카드"><svg viewBox="0 0 24 24" width="18" height="18"><use href="#i-image"/></svg> ${currentLang === 'ko' ? '카드' : 'Card'}</button>
        <button class="act-btn" id="actCopy" title="복사"><svg viewBox="0 0 24 24" width="18" height="18"><use href="#i-copy"/></svg> ${currentLang === 'ko' ? '복사' : 'Copy'}</button>
        <button class="act-btn" id="actDeselect" title="선택안함"><svg viewBox="0 0 24 24" width="18" height="18"><use href="#i-close"/></svg> ${currentLang === 'ko' ? '취소' : 'Deselect'}</button>
      `;
      document.body.appendChild(actionBar);

      document.getElementById('actBookmark').addEventListener('click', () => {
        const target = getSelectedVerse();
        if (!target) return;
        const { sel, book, ch, v, text } = target;
        const added = toggleBookmark(book, ch, v, text);
        showToast(added ? '북마크에 추가됨' : '북마크에서 제거됨');
        const ind = sel.querySelector('.bm-indicator');
        if (added) {
          if (!ind) {
            const s = document.createElement('span');
            s.className = 'bm-indicator';
            s.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><use href="#i-bookmark"/></svg>';
            sel.appendChild(s);
          }
        } else { if (ind) ind.remove(); }
        const bmkBtn = document.getElementById('actBookmark');
        bmkBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><use href="#i-bookmark${added ? '' : '-outline'}"/></svg> ${currentLang === 'ko' ? '북마크' : 'Bookmark'}`;
        savePosition(book, ch, v);
      });

      document.getElementById('actHighlight').addEventListener('click', () => {
        const target = getSelectedVerse();
        if (!target) return;
        const { book, ch, v } = target;
        const current = getHighlight(book, ch, v);
        let picker = document.getElementById('hlPicker');
        if (!picker) {
          picker = document.createElement('div');
          picker.id = 'hlPicker';
          picker.className = 'hl-picker';
          picker.innerHTML = `
            <button class="hl-pick yellow" data-c="yellow" title="노랑" aria-label="노랑 하이라이트"></button>
            <button class="hl-pick green" data-c="green" title="초록" aria-label="초록 하이라이트"></button>
            <button class="hl-pick blue" data-c="blue" title="파랑" aria-label="파랑 하이라이트"></button>
            <button class="hl-pick pink" data-c="pink" title="분홍" aria-label="분홍 하이라이트"></button>
            <button class="hl-pick remove" data-c="" title="하이라이트 제거" aria-label="하이라이트 제거">✕</button>
          `;
          document.body.appendChild(picker);
          picker.querySelectorAll('.hl-pick').forEach(btn => {
            btn.addEventListener('click', () => {
              const c = btn.dataset.c;
              const b = picker.dataset.forBook;
              const cc = parseInt(picker.dataset.forCh);
              const vv = parseInt(picker.dataset.forV);
              setHighlight(b, cc, vv, c || null);
              picker.classList.remove('show');
              showToast(c ? '하이라이트 적용됨' : '하이라이트 제거됨');
              applyHighlightToVerse(b, cc, vv, c);
              updateActionBar({ keepPicker: true });
            });
          });
        }
        picker.dataset.forBook = book;
        picker.dataset.forCh = ch;
        picker.dataset.forV = v;
        picker.querySelectorAll('.hl-pick').forEach(b => b.classList.toggle('active', b.dataset.c === (current ? current.color : '')));
        picker.classList.toggle('show');
      });

      document.getElementById('actNote').addEventListener('click', () => {
        const target = getSelectedVerse();
        if (!target) return;
        const { book, ch, v } = target;
        const existing = getNote(book, ch, v);
        showNoteModal(book, ch, v, existing ? existing.text : '');
      });

      document.getElementById('actCard').addEventListener('click', () => {
        const target = getSelectedVerse();
        if (!target) return;
        const { v: vn, text } = target;
        const ref = currentBook + ' ' + currentChapter + ':' + vn;
        generateVerseCard(text, ref);
      });

      document.getElementById('actCopy').addEventListener('click', () => {
        const target = getSelectedVerse();
        if (!target) return;
        const { v: vn, text } = target;
        const ref = `${currentBook} ${currentChapter}:${vn}`;
        navigator.clipboard.writeText(`${ref} ${text}`).catch(() => {
          showToast('복사 실패');
        });
      });

      document.getElementById('actDeselect').addEventListener('click', () => {
        const picker = document.getElementById('hlPicker');
        if (picker) picker.classList.remove('show');
        showChapter(currentBook, currentChapter);
      });
    }

    function getSelectedVerse() {
      const sel = content.querySelector('.verse-item.selected');
      if (!sel) {
        showToast(currentLang === 'ko' ? '먼저 절을 선택하세요' : 'Select a verse first');
        return null;
      }
      const book = sel.dataset.book;
      const ch = parseInt(sel.dataset.ch);
      const v = parseInt(sel.dataset.v);
      return { sel, book, ch, v, text: sel.querySelector('.vtext').textContent };
    }

    function applyHighlightToVerse(book, ch, v, color) {
      const sel = content.querySelector(`.verse-item[data-book="${book}"][data-ch="${ch}"][data-v="${v}"]`);
      if (!sel) return;
      sel.className = sel.className.replace(/\bhl-\w+\b/g, '').trim();
      if (color) sel.classList.add('hl-' + color);
    }

    function selectVerse(el) {
      if (!el) return;
      content.querySelectorAll('.verse-item.selected').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      const v = parseInt(el.dataset.v);
      history.replaceState(null, '', `#book=${encodeURIComponent(displayName)}&ch=${chNum}&v=${v}`);
      savePosition(displayName, chNum, v);
      updateActionBar();
    }

    function updateActionBar(options) {
      const keepPicker = options && options.keepPicker;
      const sel = content.querySelector('.verse-item.selected');
      const bar = document.getElementById('verseActionBar');
      const picker = document.getElementById('hlPicker');
      if (picker && !keepPicker) picker.classList.remove('show');
      if (!bar) return;
      if (!sel) { bar.classList.remove('show'); return; }
      bar.classList.add('show');
      const book = sel.dataset.book;
      const ch = parseInt(sel.dataset.ch);
      const v = parseInt(sel.dataset.v);
      const bmkBtn = document.getElementById('actBookmark');
      bmkBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><use href="#i-bookmark${isBookmarked(book, ch, v) ? '' : '-outline'}"/></svg> ${currentLang === 'ko' ? '북마크' : 'Bookmark'}`;
      const hl = getHighlight(book, ch, v);
      document.getElementById('actHighlight').classList.toggle('has-data', !!hl);
      const nt = getNote(book, ch, v);
      document.getElementById('actNote').classList.toggle('has-data', !!nt);
    }

      /* ─── Tap selection / Long press ─── */
      let lpTimer = null;

      content.querySelectorAll('.verse-item').forEach(el => {
        el.addEventListener('click', () => {
          selectVerse(el);
        });

        // Long press → copy
        el.addEventListener('touchstart', () => {
          lpTimer = setTimeout(() => {
            lpTimer = null;
            const t = el.querySelector('.vtext').textContent;
            const r = `${displayName} ${chNum}:${el.dataset.v}`;
            navigator.clipboard.writeText(`${r} ${t}`);
          }, 500);
        }, { passive: true });
        el.addEventListener('touchend', () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } }, { passive: true });
        el.addEventListener('touchmove', () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } }, { passive: true });

        el.addEventListener('contextmenu', e => {
          e.preventDefault();
          const t = el.querySelector('.vtext').textContent;
          const r = `${displayName} ${chNum}:${el.dataset.v}`;
          navigator.clipboard.writeText(`${r} ${t}`);
        });
      });

    /* ─── Scroll to target verse ─── */
    if (targetVerse) {
      setTimeout(() => {
        const el = content.querySelector(`[data-v="${targetVerse}"]`);
        if (!el) {
          console.warn(`Target verse element data-v="${targetVerse}" not found.`);
          return;
        }
        content.querySelectorAll('.verse-item.selected').forEach(x => x.classList.remove('selected'));
        el.classList.add('selected');
        updateActionBar();
        const contentRect = content.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const calculatedScrollTop = elRect.top - contentRect.top + content.scrollTop - 20;

        content.scrollTop = calculatedScrollTop;
        if (typeof content.scrollTo === 'function') {
          content.scrollTo({ top: calculatedScrollTop, behavior: 'auto' });
        }
        const winScrollTop = window.scrollY + elRect.top - 60; // 60px 헤더 여유
        window.scrollTo({ top: winScrollTop, behavior: 'auto' });
      }, 300);
    }

    /* ─── Swipe navigation ─── */
    content.addEventListener('touchstart', e => {
      const t = e.changedTouches[0];
      touchStartX = t.screenX;
      touchStartY = t.screenY;
    }, { passive: true });
    content.addEventListener('touchend', e => {
      const t = e.changedTouches[0];
      const dx = t.screenX - touchStartX;
      const dy = t.screenY - touchStartY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        const book = findBook(name);
        if (dx < 0 && chNum < book.chapters.length) {
          showChapter(displayName, chNum + 1);
        } else if (dx > 0 && chNum > 1) {
          showChapter(displayName, chNum - 1);
        }
      }
    }, { passive: true });
  }

  /* ─── Note modal ─── */
  function showNoteModal(book, ch, v, text) {
    let overlay = document.getElementById('noteModalOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'noteModalOverlay';
      overlay.className = 'note-modal-overlay';
      overlay.innerHTML = `
        <div class="note-modal">
          <h3><svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align:middle;margin-right:4px"><use href="#i-note"/></svg> 메모</h3>
          <div class="ref"></div>
          <textarea placeholder="메모를 입력하세요..."></textarea>
          <div class="note-modal-actions">
            <button class="note-cancel" id="noteCancel">취소</button>
            <button class="note-delete" id="noteDelete" style="display:none">삭제</button>
            <button class="note-save" id="noteSave">저장</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
      document.getElementById('noteCancel').addEventListener('click', () => overlay.classList.remove('open'));
      document.getElementById('noteSave').addEventListener('click', () => {
        const ta = overlay.querySelector('textarea');
        const ref = overlay.dataset.ref || '';
        const parts = ref.split('|');
        if (parts.length === 3) {
          const b = parts[0], c = parseInt(parts[1]), vv = parseInt(parts[2]);
          const hasNote = ta.value.trim() ? true : false;
          if (hasNote) {
            setNote(b, c, vv, ta.value.trim());
            showToast('메모가 저장됨');
          } else {
            setNote(b, c, vv, '');
            showToast('메모가 제거됨');
          }
          overlay.classList.remove('open');
          const sel = content.querySelector(`.verse-item[data-v="${vv}"]`);
          if (sel) {
            const ind = sel.querySelector('.nt-indicator');
            if (hasNote) {
              if (!ind) {
                const s = document.createElement('span');
                s.className = 'nt-indicator';
                s.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><use href="#i-note"/></svg>';
                sel.appendChild(s);
              }
            } else { if (ind) ind.remove(); }
            document.getElementById('actNote').style.opacity = hasNote ? '1' : '0.5';
          }
        }
      });
      document.getElementById('noteDelete').addEventListener('click', () => {
        const ref = overlay.dataset.ref || '';
        const parts = ref.split('|');
        if (parts.length === 3) {
          const vv = parseInt(parts[2]);
          setNote(parts[0], parseInt(parts[1]), vv, '');
          showToast('메모가 삭제됨');
          overlay.classList.remove('open');
          const sel = content.querySelector(`.verse-item[data-v="${vv}"]`);
          if (sel) {
            const ind = sel.querySelector('.nt-indicator');
            if (ind) ind.remove();
            document.getElementById('actNote').style.opacity = '0.5';
          }
        }
      });
    }
    overlay.dataset.ref = book + '|' + ch + '|' + v;
    overlay.querySelector('.ref').textContent = book + ' ' + ch + ':' + v;
    overlay.querySelector('textarea').value = text || '';
    const delBtn = document.getElementById('noteDelete');
    delBtn.style.display = text ? 'inline-block' : 'none';
    overlay.classList.add('open');
    overlay.querySelector('textarea').focus();
  }

  /* ─── My Stuff view ─── */
  function showMyStuff() {
    currentView = 'mystuff';
    setActiveTab('mystuff');
    setTitle(txt('myStuff'));
    showBack(true);
    renderContent(`
      <div class="my-stuff-tabs">
        <button class="active" data-tab="bookmark"><svg viewBox="0 0 24 24" width="16" height="16"><use href="#i-bookmark"/></svg> ${currentLang === 'ko' ? '북마크' : 'Bookmarks'}</button>
        <button data-tab="highlight"><svg viewBox="0 0 24 24" width="16" height="16"><use href="#i-highlight"/></svg> ${currentLang === 'ko' ? '하이라이트' : 'Highlights'}</button>
        <button data-tab="note"><svg viewBox="0 0 24 24" width="16" height="16"><use href="#i-note"/></svg> ${currentLang === 'ko' ? '메모' : 'Notes'}</button>
      </div>
      <div class="my-stuff-list" id="myStuffList"></div>
    `);
    content.querySelectorAll('.my-stuff-tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.my-stuff-tabs button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderMyStuff(btn.dataset.tab);
      });
    });
    renderMyStuff('bookmark');
  }

  function renderMyStuff(tab) {
    const list = document.getElementById('myStuffList');
    if (!list) return;
    let items = [];
    if (tab === 'bookmark') {
      const bms = getBookmarks();
      items = bms.map(b => ({
        html: '<div class="ref">' + b.book + ' ' + b.ch + ':' + b.v + '</div><div class="text">' + escHtml(b.text) + '</div>',
        book: b.book, ch: b.ch, v: b.v,
        del: () => { toggleBookmark(b.book, b.ch, b.v, ''); renderMyStuff(tab); showToast('북마크 제거됨'); }
      }));
    } else if (tab === 'highlight') {
      const hls = getHighlights();
      items = Object.keys(hls).map(k => {
        const p = k.split('|');
        const ref = p[0] + ' ' + p[1] + ':' + p[2];
        const c = hls[k].color;
        const colorMap = { yellow:'🟡', green:'🟢', blue:'🔵', pink:'🩷' };
        return {
          html: '<div class="ref">' + colorMap[c] + ' ' + ref + '</div><div class="text"' + (c ? ' style="border-left:3px solid var(--hl-' + c + ');padding-left:8px"' : '') + '></div>',
          book: p[0], ch: parseInt(p[1]), v: parseInt(p[2]),
          del: () => { setHighlight(p[0], parseInt(p[1]), parseInt(p[2]), ''); renderMyStuff(tab); showToast('하이라이트 제거됨'); }
        };
      });
      // Fetch text for highlighted verses
      items.forEach(item => {
        const book = findBook(item.book);
        if (book && book.chapters[item.ch - 1] && book.chapters[item.ch - 1][item.v - 1]) {
          item.html = '<div class="ref">🟡 ' + item.book + ' ' + item.ch + ':' + item.v + '</div><div class="text">' + escHtml(book.chapters[item.ch - 1][item.v - 1]) + '</div>';
        }
      });
    } else if (tab === 'note') {
      const nts = getNotes();
      items = Object.keys(nts).map(k => {
        const p = k.split('|');
        return {
          html: '<div class="ref">' + p[0] + ' ' + p[1] + ':' + p[2] + '</div><div class="text" style="opacity:0.8">💬 ' + escHtml(nts[k].text) + '</div>',
          book: p[0], ch: parseInt(p[1]), v: parseInt(p[2]),
          del: () => { setNote(p[0], parseInt(p[1]), parseInt(p[2]), ''); renderMyStuff(tab); showToast('메모 삭제됨'); }
        };
      });
    }

    if (items.length === 0) {
      list.innerHTML = '<div class="my-stuff-empty">📭 항목이 없습니다<br><small>성경을 읽다가 마음에 드는 구절을 저장해보세요</small></div>';
      return;
    }

    list.innerHTML = items.map((item, i) =>
      '<div class="my-stuff-item" data-idx="' + i + '">' + item.html + '<button class="del-btn" data-idx="' + i + '">✕</button></div>'
    ).join('');

    list.querySelectorAll('.my-stuff-item').forEach(el => {
      const idx = parseInt(el.dataset.idx);
      el.addEventListener('click', e => {
        if (e.target.classList.contains('del-btn')) return;
        const item = items[idx];
        showChapter(item.book, item.ch, item.v);
      });
      const delBtn = el.querySelector('.del-btn');
      if (delBtn) delBtn.addEventListener('click', e => {
        e.stopPropagation();
        items[idx].del();
      });
    });
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ─── Verse card generation ─── */
  async function generateVerseCard(text, ref) {
    const W = 800, H = 1000;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Gradient background (warm sunset)
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Accent line
    ctx.fillStyle = '#c49a6c';
    ctx.fillRect(60, 140, 80, 3);

    // Reference (top area)
    ctx.fillStyle = '#c49a6c';
    ctx.font = '600 28px Pretendard';
    ctx.textAlign = 'center';
    ctx.fillText(ref, W / 2, 120);

    // Verse text
    await document.fonts.load('400 38px Pretendard');
    ctx.fillStyle = '#ffffff';
    ctx.font = '400 38px Pretendard';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxW = W - 120;
    const lines = [];
    const words = text.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lineH = 54;
    const totalH = lines.length * lineH;
    const startY = (H - totalH) / 2 + 40;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], W / 2, startY + i * lineH);
    }

    // Bottom accent
    ctx.fillStyle = '#c49a6c';
    ctx.fillRect(W - 140, H - 140, 80, 3);

    // "성경" watermark
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '400 16px Pretendard';
    ctx.textAlign = 'right';
    ctx.fillText('Bible App', W - 30, H - 30);

    // Convert to blob
    canvas.toBlob(async function(blob) {
      if (!blob) { showToast('이미지 생성 실패'); return; }
      const file = new File([blob], 'bible-verse.png', { type: 'image/png' });
      const url = URL.createObjectURL(blob);

      // Try Web Share API first
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        const shouldShare = window.confirm(
          currentLang === 'ko'
            ? '말씀카드 공유 메뉴를 열까요?\n공유 전에 받는 사람을 한 번 더 확인하세요.\n\n취소하면 이미지로 저장합니다.'
            : 'Open the verse card share menu?\nPlease double-check the recipient before sharing.\n\nCancel will save the image instead.'
        );
        if (shouldShare) {
          try {
            await navigator.share({ files: [file], title: ref });
            URL.revokeObjectURL(url);
            return;
          } catch(e) {
            if (e.name === 'AbortError') {
              showToast(currentLang === 'ko' ? '공유가 취소되었습니다' : 'Share canceled');
              URL.revokeObjectURL(url);
              return;
            }
            showToast(currentLang === 'ko' ? '공유 실패, 이미지로 저장합니다' : 'Share failed, saving image');
          }
        }
      }

      // Fallback: download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bible-verse-' + ref.replace(/[^a-z0-9]/gi, '_') + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('이미지 저장됨');
    }, 'image/png');
  }

  /* ─── Daily verse card button ─── */
  function addDailyVerseCardBtn() {
    const dv = document.getElementById('dailyVerse');
    if (!dv) return;
    const btn = document.createElement('button');
    btn.className = 'cv-card-btn';
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><use href="#i-image"/></svg>';
    btn.title = '말씀카드 만들기';
    dv.appendChild(btn);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const t = dv.querySelector('.cv-text')?.textContent;
      const r = dv.querySelector('.cv-ref')?.textContent;
      if (t && r) generateVerseCard(t, r);
    });
  }

  /* ─── Reading plan (1 year) ─── */
  const RP_KEY = 'bibleReadPlan';

  function generateReadingPlan() {
    const allCh = [];
    for (const book of bible) {
      const name = book.name;
      for (let i = 0; i < book.chapters.length; i++) {
        allCh.push({ book: name, ch: i + 1 });
      }
    }
    const totalDays = 365;
    const plan = [];
    for (let d = 0; d < totalDays; d++) {
      const start = Math.floor(d * allCh.length / totalDays);
      const end = Math.floor((d + 1) * allCh.length / totalDays);
      const items = [];
      for (let i = start; i < end; i++) {
        items.push(allCh[i]);
      }
      plan.push(items);
    }
    return plan;
  }

  function getReadingPlan() {
    if (!bible || bible.length === 0) return [];
    let plan = sessionStorage.getItem('biblePlan');
    if (plan) return JSON.parse(plan);
    plan = generateReadingPlan();
    sessionStorage.setItem('biblePlan', JSON.stringify(plan));
    return plan;
  }

  function getTodayReading() {
    const plan = getReadingPlan();
    if (plan.length === 0) return null;
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const day = Math.min(dayOfYear, plan.length - 1);
    return { day, total: plan.length, items: plan[day] };
  }

  function getCompletedDays() {
    try { return JSON.parse(localStorage.getItem(RP_KEY)) || []; }
    catch { return []; }
  }

  function toggleDayComplete(day) {
    const list = getCompletedDays();
    const idx = list.indexOf(day);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(day);
    localStorage.setItem(RP_KEY, JSON.stringify(list));
    return idx < 0;
  }

  function isDayComplete(day) {
    return getCompletedDays().indexOf(day) >= 0;
  }

  function showReadingPlanUI() {
    const today = getTodayReading();
    if (!today) return '';
    const completed = getCompletedDays();
    const displayCh = (item) => {
      const n = currentLang === 'ko' ? (koNames[item.book] || item.book) : item.book;
      return `<a href="#" class="rp-ch-link" data-book="${item.book}" data-ch="${item.ch}">${n} ${item.ch}${txt('chapter').trim()}</a>`;
    };
    return `
      <div class="reading-plan" id="readingPlan">
        <div class="rp-header">
          <span class="rp-title"><svg viewBox="0 0 24 24" width="16" height="16" style="vertical-align:middle;margin-right:4px"><use href="#i-book"/></svg> ${currentLang === 'ko' ? '1년 1독' : 'Bible in a Year'}</span>
          <span class="rp-day">${currentLang === 'ko' ? 'Day' : 'Day'} ${today.day + 1}/${today.total}</span>
        </div>
        <div class="rp-progress">
          <div class="rp-bar"><div class="rp-fill" style="width:${(completed.length / today.total * 100).toFixed(1)}%"></div></div>
          <span class="rp-pct">${completed.length}/${today.total} (${(completed.length / today.total * 100).toFixed(0)}%)</span>
        </div>
        <div class="rp-today">
          <div class="rp-today-label">${currentLang === 'ko' ? '오늘의 읽기' : 'Today'}</div>
          <div class="rp-chapters">${today.items.map(i => '<span class="rp-ch">' + displayCh(i) + '</span>').join(', ')}</div>
          <button class="rp-check ${isDayComplete(today.day) ? 'done' : ''}" data-day="${today.day}">
            <svg viewBox="0 0 24 24" width="16" height="16"><use href="#${isDayComplete(today.day) ? 'i-check-square' : 'i-square'}"/></svg> ${currentLang === 'ko' ? '읽음' : 'Done'}
          </button>
        </div>
      </div>
    `;
  }

  function setupReadingPlanUI() {
    const rp = document.getElementById('readingPlan');
    if (!rp) return;
    const btn = rp.querySelector('.rp-check');
    if (btn) btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const day = parseInt(this.dataset.day);
      const done = toggleDayComplete(day);
      this.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><use href="#${done ? 'i-check-square' : 'i-square'}"/></svg> ${currentLang === 'ko' ? '읽음' : 'Done'}`;
      this.classList.toggle('done', done);
      // Update progress bar
      const plan = getReadingPlan();
      const completed = getCompletedDays();
      const fill = rp.querySelector('.rp-fill');
      const pct = rp.querySelector('.rp-pct');
      if (fill) fill.style.width = (completed.length / plan.length * 100).toFixed(1) + '%';
      if (pct) pct.textContent = completed.length + '/' + plan.length + ' (' + (completed.length / plan.length * 100).toFixed(0) + '%)';
    });
    rp.addEventListener('click', function(e) {
      const link = e.target.closest('.rp-ch-link');
      if (!link) return;
      e.preventDefault();
      showChapter(link.dataset.book, parseInt(link.dataset.ch), 1);
    });
  }

  function setupSearchInput(id) {
    const input = document.getElementById(id);
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(input.value); });
  }

  function doSearch(query) {
    query = query.trim();
    if (!query) return;
    currentView = 'search';
    setTitle(txt('searchTitle'));
    showBack(true);

    const results = [];
    const lower = query.toLowerCase();
    for (const book of bible) {
      const displayName = currentLang === 'ko' ? (koNames[book.name] || book.name) : book.name;
      book.chapters.forEach((ch, ci) => {
        ch.forEach((v, vi) => {
          if (v.toLowerCase().includes(lower)) {
            results.push({ book:displayName, ch:ci+1, v:vi+1, text:v });
          }
        });
      });
    }

    const searchBar = `<div class="sv-bar"><input type="text" class="sv-input" id="svInput2" value="${escHtml(query)}" autocomplete="off"></div>`;
    if (results.length === 0) {
      renderContent(`<div class="search-view">${searchBar}<div class="search-results"><p style="text-align:center;padding:40px;color:var(--text-dim)">'${query}' ${txt('noResult')}</p></div></div>`);
      setupSearchInput('svInput2');
      return;
    }

    renderContent(`
      <div class="search-view">${searchBar}
        <div class="search-results">
          <div class="result-count">'${query}' ${results.length} ${currentLang === 'ko' ? '건' : 'results'}</div>
          ${results.slice(0, 200).map(r => `
            <div class="search-item" data-book="${r.book}" data-ch="${r.ch}" data-v="${r.v}">
              <div class="ref">${r.book} ${r.ch}:${r.v}</div>
              <div class="text">${highlightText(r.text, query)}</div>
            </div>
          `).join('')}
          ${results.length>200 ? '<p style="text-align:center;color:var(--text-dim);padding:12px">' + txt('tooMany') + '</p>' : ''}
        </div>
      </div>
    `);
    setupSearchInput('svInput2');
    content.querySelectorAll('.search-item').forEach(el => {
      el.addEventListener('click', () => {
        showChapter(el.dataset.book, parseInt(el.dataset.ch), parseInt(el.dataset.v));
      });
    });
  }

  function highlightText(text, query) {
    const re = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(re, '<em>$1</em>');
  }
  function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function handleHash() {
    const hash = location.hash.slice(1);
    if (!hash) { showHome(); return; }
    const params = new URLSearchParams(hash);
    const book = params.get('book');
    const ch = params.get('ch');
    const v = params.get('v');
    if (book && ch) {
      showChapter(book, parseInt(ch), v ? parseInt(v) : null);
    }
    else if (book) { showBook(book); }
    else { showHome(); }
  }

  window.addEventListener('hashchange', handleHash);
  window.addEventListener('popstate', handleHash);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }

  init();
})();
