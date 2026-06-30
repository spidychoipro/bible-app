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
  const btnSearch = $('#btnSearch');
  const btnMyStuff = $('#btnMyStuff');
  const btnSettings = $('#btnSettings');
  const searchBar = $('#searchBar');
  const searchInput = $('#searchInput');
  const searchClose = $('#searchClose');
  const loading = $('#loading');
  const settingsOverlay = $('#settingsOverlay');

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

  function getTheme() { return localStorage.getItem(THEME_KEY) || 'light'; }
  function setTheme(name) {
    localStorage.setItem(THEME_KEY, name);
    applyTheme(name);
    updateThemeUI();
  }

  function getFontSize() { return parseInt(localStorage.getItem(FS_KEY)) || 16; }
  function setFontSize(val) {
    val = Math.max(12, Math.min(32, val));
    localStorage.setItem(FS_KEY, val);
    document.documentElement.style.setProperty('--fs', val + 'px');
  }

  /* ─── Settings UI ─── */
  function openSettings() {
    const theme = getTheme();
    const fs = getFontSize();
    const ct = JSON.parse(localStorage.getItem('bibleCustomTheme') || '{}');

    settingsOverlay.innerHTML = `
      <div id="settingsPanel">
        <button class="close-settings" id="closeSettings">✕</button>
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
          <div class="section-label">미리보기</div>
          <div style="padding:12px;background:var(--surface);border-radius:8px;border:1px solid var(--border);line-height:1.8">
            <span style="color:var(--accent);font-weight:600">요한복음 3:16</span><br>
            하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라
          </div>
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
  }

  function closeSettings() { settingsOverlay.classList.remove('open'); settingsOverlay.innerHTML = ''; }

  function updateThemeUI() {
    const theme = getTheme();
    const icon = themeIcons[theme] || '🎨';
    btnSettings.textContent = icon;
  }

  /* ─── Init theme & font ─── */
  applyTheme(getTheme());
  setFontSize(getFontSize());
  updateThemeUI();

  /* ─── Navigation ─── */
  btnBack.addEventListener('click', goBack);
  btnSearch.addEventListener('click', toggleSearch);
  btnMyStuff.addEventListener('click', showMyStuff);
  btnSettings.addEventListener('click', openSettings);
  searchClose.addEventListener('click', () => { searchBar.style.display='none'; searchInput.value=''; });
  searchInput.addEventListener('keydown', e => { if (e.key==='Enter') doSearch(searchInput.value); });

  document.addEventListener('keydown', e => {
    if (settingsOverlay.classList.contains('open')) return;
    if (document.activeElement === searchInput) return;

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

  function toggleSearch() {
    if (searchBar.style.display === 'flex') { searchBar.style.display='none'; return; }
    searchBar.style.display='flex'; searchInput.focus();
  }

  function goBack() {
    if (currentView === 'chapter') { showBook(currentBook); }
    else if (currentView === 'book') { showHome(); }
    else if (currentView === 'search') { showHome(); }
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
    loading.classList.remove('hide');
    loading.textContent = txt('loading');
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 30000);
    try {
      const url = 'data/bible-' + transId + '.json?v=2';
      const resp = await fetch(url, { signal: ctrl.signal });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      bible = await resp.json();
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
      const en = enNames[name];
      return bible.find(b => b.name === en);
    }
    return bible.find(b => b.name === name);
  }

  function showHome() {
    currentView = 'home';
    currentBook = null; currentChapter = null;
    setTitle(txt('home'));
    showBack(false);
    const curTrans = TRANSLATIONS.find(t => t.id === currentTranslation);
    content.innerHTML = `
      <div class="trans-bar" id="transBar">
        <span class="trans-label">📖</span>
        <span class="trans-name" id="transName">${curTrans ? curTrans.label : '??'}</span>
        <span class="trans-arrow">▾</span>
      </div>
      <div class="testament-tabs">
        <button class="active" data-t="ot">${currentLang === 'ko' ? '구약' : 'OT'}</button>
        <button data-t="nt">${currentLang === 'ko' ? '신약' : 'NT'}</button>
      </div>
      <div class="book-list" id="bookList"></div>
    `;
    document.getElementById('transBar').addEventListener('click', showTranslationPicker);
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
    let overlay = document.getElementById('transOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'transOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:45;display:none;align-items:center;justify-content:center';
      overlay.innerHTML = '<div style="background:var(--surface);width:90%;max-width:360px;border-radius:14px;padding:20px;box-shadow:0 4px 24px var(--shadow);max-height:70vh;overflow-y:auto">'
        + '<h3 style="font-size:1em;margin-bottom:12px;color:var(--text)">📖 ' + (currentLang === 'ko' ? '번역 선택' : 'Select Translation') + '</h3>'
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
        const ok = await loadBibleData(id);
        if (ok) showHome();
      });
    });
    overlay.style.display = 'flex';
  }

  function showBook(name) {
    currentView = 'book';
    currentBook = name; currentChapter = null;
    setTitle(name);
    showBack(true);
    const book = findBook(name);
    if (!book) { content.innerHTML='<p style="padding:16px">데이터를 찾을 수 없습니다</p>'; return; }
    const total = book.chapters.reduce((a,c)=>a+c.length,0);
    content.innerHTML = `
      <div class="info-bar">
        <span>${book.chapters.length} ${txt('chapters')}</span>
        <span>${total} ${txt('verses')}</span>
      </div>
      <div class="chapter-grid">${book.chapters.map((_,i)=>`<div class="chapter-item" data-ch="${i+1}">${i+1}${txt('chapter')}</div>`).join('')}</div>
      <div id="verseGrid" style="display:none"></div>
    `;

    content.querySelectorAll('.chapter-item').forEach(el => {
      el.addEventListener('click', () => showChapterVerses(name, parseInt(el.dataset.ch)));
    });
  }

  function showChapterVerses(name, chNum) {
    currentView = 'verse';
    currentBook = name; currentChapter = chNum;
    setTitle(name + ' ' + chNum + txt('chapter'));
    showBack(true);
    const book = findBook(name);
    if (!book || !book.chapters[chNum-1]) { content.innerHTML='<p style="padding:16px">데이터를 찾을 수 없습니다</p>'; return; }
    const verses = book.chapters[chNum-1];
    content.innerHTML = `
      <div class="info-bar">
        <span>${name} ${chNum}${txt('chapter')}</span>
        <span>${verses.length} ${txt('verses')}</span>
      </div>
      <div class="vs-grid">${verses.map((_,i)=>`<button class="vs-item" data-v="${i+1}">${i+1}</button>`).join('')}</div>
      <button class="deselect-btn" id="deselectVerse">${currentLang === 'ko' ? '선택 안함' : 'Deselect'}</button>
    `;
    content.querySelectorAll('.vs-item').forEach(btn => {
      btn.addEventListener('click', function() {
        showChapter(name, chNum, parseInt(this.dataset.v));
      });
    });
    const ds = $('#deselectVerse');
    if (ds) ds.addEventListener('click', () => showChapter(name, chNum));
  }

  function showChapter(name, chNum, targetVerse) {
    currentView = 'chapter';
    currentBook = name; currentChapter = chNum;
    setTitle(name + ' ' + chNum + txt('chapter'));
    showBack(true);
    const book = findBook(name);
    if (!book || !book.chapters[chNum-1]) { content.innerHTML='<p style="padding:16px">데이터를 찾을 수 없습니다</p>'; return; }
    const verses = book.chapters[chNum-1];

    content.innerHTML = `
      <div class="verse-view">
        <div class="chapter-title">${name} ${chNum}${txt('chapter')}</div>
        ${verses.map((v,i)=>{
          const vn = i+1;
          const bm = isBookmarked(name, chNum, vn);
          const hl = getHighlight(name, chNum, vn);
          const nt = getNote(name, chNum, vn);
          const hlCls = hl ? ' hl-' + hl.color : '';
          const bmMark = bm ? '<span class="bm-indicator">★</span>' : '';
          const ntMark = nt ? '<span class="nt-indicator">📝</span>' : '';
          return `<div class="verse-item${hlCls}" data-v="${vn}" data-book="${name}" data-ch="${chNum}"><span class="vnum">${vn}</span><span class="vtext">${v}</span>${bmMark}${ntMark}</div>`;
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
    `;

    // Reset scroll position to top
    content.scrollTop = 0;
    window.scrollTo(0, 0);

    const prev = $('#prevCh');
    const next = $('#nextCh');
    if (prev) {
      prev.addEventListener('click', () => {
        if (chNum > 1) showChapter(name, chNum - 1);
      });
    }
    if (next) {
      next.addEventListener('click', () => {
        if (chNum < book.chapters.length) showChapter(name, chNum + 1);
      });
    }

    /* ─── Action bar ─── */
    let actionBar = document.getElementById('verseActionBar');
    if (!actionBar) {
      actionBar = document.createElement('div');
      actionBar.id = 'verseActionBar';
      actionBar.className = 'verse-action-bar';
      actionBar.innerHTML = `
        <button class="act-btn" id="actBookmark" title="북마크">☆</button>
        <button class="act-btn" id="actHighlight" title="하이라이트">🟡</button>
        <button class="act-btn" id="actNote" title="메모">📝</button>
        <button class="act-btn" id="actCopy" title="복사">📋</button>
        <button class="act-btn" id="actDeselect" title="선택안함">✕</button>
      `;
      document.body.appendChild(actionBar);

      document.getElementById('actBookmark').addEventListener('click', () => {
        const sel = content.querySelector('.verse-item.selected');
        if (!sel) return;
        const book = sel.dataset.book;
        const ch = parseInt(sel.dataset.ch);
        const v = parseInt(sel.dataset.v);
        const text = sel.querySelector('.vtext').textContent;
        const added = toggleBookmark(book, ch, v, text);
        showToast(added ? '북마크에 추가됨' : '북마크에서 제거됨');
        showChapter(currentBook, currentChapter, parseInt(sel.dataset.v));
      });

      document.getElementById('actHighlight').addEventListener('click', () => {
        const sel = content.querySelector('.verse-item.selected');
        if (!sel) return;
        const book = sel.dataset.book;
        const ch = parseInt(sel.dataset.ch);
        const v = parseInt(sel.dataset.v);
        const current = getHighlight(book, ch, v);
        let picker = document.getElementById('hlPicker');
        if (!picker) {
          picker = document.createElement('div');
          picker.id = 'hlPicker';
          picker.className = 'hl-picker';
          picker.innerHTML = `
            <button class="hl-pick yellow" data-c="yellow"></button>
            <button class="hl-pick green" data-c="green"></button>
            <button class="hl-pick blue" data-c="blue"></button>
            <button class="hl-pick pink" data-c="pink"></button>
            <button class="hl-pick remove" data-c="">✕</button>
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
              showChapter(currentBook, currentChapter, vv);
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
        const sel = content.querySelector('.verse-item.selected');
        if (!sel) return;
        const book = sel.dataset.book;
        const ch = parseInt(sel.dataset.ch);
        const v = parseInt(sel.dataset.v);
        const existing = getNote(book, ch, v);
        showNoteModal(book, ch, v, existing ? existing.text : '');
      });

      document.getElementById('actCopy').addEventListener('click', () => {
        const sel = content.querySelector('.verse-item.selected');
        if (!sel) return;
        const vn = sel.dataset.v;
        const text = sel.querySelector('.vtext').textContent;
        const ref = `${currentBook} ${currentChapter}:${vn}`;
        navigator.clipboard.writeText(`${ref} ${text}`).then(() => {
          showToast('복사되었습니다');
        }).catch(() => {
          showToast('복사 실패');
        });
      });

      document.getElementById('actDeselect').addEventListener('click', () => {
        const picker = document.getElementById('hlPicker');
        if (picker) picker.classList.remove('show');
        showChapter(currentBook, currentChapter);
      });
    }

    function updateActionBar() {
      const sel = content.querySelector('.verse-item.selected');
      const bar = document.getElementById('verseActionBar');
      const picker = document.getElementById('hlPicker');
      if (picker) picker.classList.remove('show');
      if (!bar) return;
      if (!sel) { bar.classList.remove('show'); return; }
      bar.classList.add('show');
      const book = sel.dataset.book;
      const ch = parseInt(sel.dataset.ch);
      const v = parseInt(sel.dataset.v);
      document.getElementById('actBookmark').textContent = isBookmarked(book, ch, v) ? '★' : '☆';
      const hl = getHighlight(book, ch, v);
      document.getElementById('actHighlight').style.opacity = hl ? '1' : '0.5';
      const nt = getNote(book, ch, v);
      document.getElementById('actNote').style.opacity = nt ? '1' : '0.5';
    }

      content.querySelectorAll('.verse-item').forEach(el => {
        el.addEventListener('click', () => {
          content.querySelectorAll('.verse-item.selected').forEach(x=>x.classList.remove('selected'));
          el.classList.toggle('selected');
          history.replaceState(null, '', `#book=${encodeURIComponent(name)}&ch=${chNum}&v=${el.dataset.v}`);
          updateActionBar();
          savePosition(name, chNum, parseInt(el.dataset.v));
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
        
        console.log('[BibleApp Debug]', {
          targetVerse,
          contentScrollTopBefore: content.scrollTop,
          contentRectTop: contentRect.top,
          elRectTop: elRect.top,
          calculatedScrollTop,
          windowScrollY: window.scrollY
        });
        
        // 방법 1: content.scrollTop 직접 대입
        content.scrollTop = calculatedScrollTop;
        
        // 방법 2: content.scrollTo 실행
        if (typeof content.scrollTo === 'function') {
          content.scrollTo({ top: calculatedScrollTop, behavior: 'auto' });
        }
        
        // 방법 3: 만약 window/body가 스크롤되는 환경일 경우를 대비해 window.scrollTo 실행
        const bodyRect = document.body.getBoundingClientRect();
        const winScrollTop = window.scrollY + elRect.top - 60; // 60px 헤더 여유
        window.scrollTo({ top: winScrollTop, behavior: 'auto' });
        
        console.log('[BibleApp Debug] contentScrollTopAfter:', content.scrollTop);
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
          showChapter(name, chNum + 1);
        } else if (dx > 0 && chNum > 1) {
          showChapter(name, chNum - 1);
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
          <h3>📝 메모</h3>
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
          if (ta.value.trim()) {
            setNote(b, c, vv, ta.value.trim());
            showToast('메모가 저장됨');
          } else {
            setNote(b, c, vv, '');
            showToast('메모가 제거됨');
          }
          overlay.classList.remove('open');
          showChapter(currentBook, currentChapter, currentChapter ? parseInt(overlay.querySelector('.ref').textContent.split(':')[1]) : undefined);
        }
      });
      document.getElementById('noteDelete').addEventListener('click', () => {
        const ref = overlay.dataset.ref || '';
        const parts = ref.split('|');
        if (parts.length === 3) {
          setNote(parts[0], parseInt(parts[1]), parseInt(parts[2]), '');
          showToast('메모가 삭제됨');
          overlay.classList.remove('open');
          showChapter(currentBook, currentChapter, parseInt(parts[2]));
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
    setTitle(txt('myStuff'));
    showBack(true);
    content.innerHTML = `
      <div class="my-stuff-tabs">
        <button class="active" data-tab="bookmark">⭐ 북마크</button>
        <button data-tab="highlight">🟡 하이라이트</button>
        <button data-tab="note">📝 메모</button>
      </div>
      <div class="my-stuff-list" id="myStuffList"></div>
    `;
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

  function doSearch(query) {
    query = query.trim();
    if (!query) return;
    currentView = 'search';
    setTitle(txt('searchTitle'));
    showBack(true);
    searchBar.style.display='none';

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

    if (results.length === 0) {
      content.innerHTML = `<div class="search-results"><p style="text-align:center;padding:40px;color:var(--text-dim)">'${query}' ${txt('noResult')}</p></div>`;
      return;
    }

    content.innerHTML = `
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
    `;
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

  init();
})();