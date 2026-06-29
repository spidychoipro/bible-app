(() => {
  'use strict';

  const DATA_URL = 'data/bible.json';
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

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  const title = $('#title');
  const content = $('#content');
  const btnBack = $('#btnBack');
  const btnSearch = $('#btnSearch');
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
  btnSettings.addEventListener('click', openSettings);
  searchClose.addEventListener('click', () => { searchBar.style.display='none'; searchInput.value=''; });
  searchInput.addEventListener('keydown', e => { if (e.key==='Enter') doSearch(searchInput.value); });

  function toggleSearch() {
    if (searchBar.style.display === 'flex') { searchBar.style.display='none'; return; }
    searchBar.style.display='flex'; searchInput.focus();
  }

  function goBack() {
    if (currentView === 'chapter') { showBook(currentBook); }
    else if (currentView === 'book') { showHome(); }
    else if (currentView === 'search') { showHome(); }
    else if (currentView === 'verse') { showChapter(currentBook, currentChapter); }
  }

  function setTitle(t) { title.textContent = t; }
  function showBack(v) { btnBack.style.visibility = v ? 'visible' : 'hidden'; }

  async function init() {
    loading.textContent = '성경 데이터를 불러오는 중...';
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 30000);
    try {
      const resp = await fetch(DATA_URL, { signal: ctrl.signal });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      bible = await resp.json();
      clearTimeout(timeout);
      loading.classList.add('hide');
      handleHash();
      if (!location.hash) {
        const pos = loadPosition();
        if (pos && findBook(pos.book)) {
          showChapter(pos.book, pos.ch);
          if (pos.v) {
            setTimeout(() => {
              const el = content.querySelector(`[data-v="${pos.v}"]`);
              if (el) {
                el.classList.add('selected');
                const cb = document.querySelector('.copy-btn');
                if (cb) cb.classList.add('show');
                el.scrollIntoView({block:'center', behavior:'smooth'});
              }
            }, 150);
          }
        }
      }
    } catch(e) {
      clearTimeout(timeout);
      loading.innerHTML = '데이터를 불러오는데 실패했습니다<br><small>인터넷 연결을 확인하거나<br>페이지를 새로고침해주세요</small>';
      console.error(e);
    }
  }

  function findBook(koName) {
    const en = enNames[koName];
    return bible.find(b => b.name === en);
  }

  function showHome() {
    currentView = 'home';
    currentBook = null; currentChapter = null;
    setTitle('성경');
    showBack(false);
    content.innerHTML = `
      <div class="testament-tabs">
        <button class="active" data-t="ot">구약</button>
        <button data-t="nt">신약</button>
      </div>
      <div class="book-list" id="bookList"></div>
    `;
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
    const order = testament === 'ot' ? otOrder : ntOrder;
    list.innerHTML = order.map(ko => {
      const book = findBook(ko);
      const chapters = book ? book.chapters.length : 0;
      return `<div class="book-item" data-book="${ko}"><div>${ko}</div><div class="badge">${chapters}장</div></div>`;
    }).join('');
    list.querySelectorAll('.book-item').forEach(el => {
      el.addEventListener('click', () => showBook(el.dataset.book));
    });
  }

  function showBook(koName) {
    currentView = 'book';
    currentBook = koName; currentChapter = null;
    setTitle(koName);
    showBack(true);
    const book = findBook(koName);
    if (!book) { content.innerHTML='<p style="padding:16px">데이터를 찾을 수 없습니다</p>'; return; }
    const total = book.chapters.reduce((a,c)=>a+c.length,0);
    content.innerHTML = `
      <div class="info-bar">
        <span>총 ${book.chapters.length}장</span>
        <span>${total}절</span>
      </div>
      <div class="chapter-grid">${book.chapters.map((_,i)=>`<div class="chapter-item" data-ch="${i+1}">${i+1}장</div>`).join('')}</div>
    `;
    content.querySelectorAll('.chapter-item').forEach(el => {
      el.addEventListener('click', () => showChapter(koName, parseInt(el.dataset.ch)));
    });
  }

  function showChapter(koName, chNum) {
    currentView = 'chapter';
    currentBook = koName; currentChapter = chNum;
    setTitle(`${koName} ${chNum}장`);
    showBack(true);
    const book = findBook(koName);
    if (!book || !book.chapters[chNum-1]) { content.innerHTML='<p style="padding:16px">장을 찾을 수 없습니다</p>'; return; }
    const verses = book.chapters[chNum-1];
    const query = new URLSearchParams(location.hash.slice(1)).get('v');
    const highlightVerse = query ? parseInt(query) : null;
    content.innerHTML = `
      <div class="verse-view">
        <div class="chapter-title">${koName} ${chNum}장</div>
        <div class="verse-jump">
          <input type="number" id="verseJump" min="1" max="${verses.length}" placeholder="절">
          <button id="verseJumpBtn">이동</button>
        </div>
        ${verses.map((v,i)=>{
          const vn = i+1;
          return `<div class="verse-item${vn===highlightVerse?' highlight':''}" data-v="${vn}"><span class="vnum">${vn}</span><span class="vtext">${v}</span></div>`;
        }).join('')}
      </div>
      <div class="quick-nav">
        ${chNum>1?`<button id="prevCh">◀</button>`:''}
        ${chNum<book.chapters.length?`<button id="nextCh">▶</button>`:''}
      </div>
    `;
    const prev = $('#prevCh');
    const next = $('#nextCh');
    if (prev) prev.addEventListener('click', () => showChapter(koName, chNum-1));
    if (next) next.addEventListener('click', () => showChapter(koName, chNum+1));

    /* ─── Verse jump ─── */
    const vjInput = $('#verseJump');
    const vjBtn = $('#verseJumpBtn');
    function jumpToVerse(vn) {
      vn = parseInt(vn);
      if (vn < 1 || vn > verses.length) return;
      const target = content.querySelector(`[data-v="${vn}"]`);
      if (target) {
        content.querySelectorAll('.verse-item.selected').forEach(x=>x.classList.remove('selected'));
        target.classList.add('selected');
        updateCopyBtn();
        savePosition(koName, chNum, vn);
        target.scrollIntoView({block:'center', behavior:'smooth'});
        vjInput.value = '';
      }
    }
    vjBtn.addEventListener('click', () => jumpToVerse(vjInput.value));
    vjInput.addEventListener('keydown', e => { if (e.key === 'Enter') jumpToVerse(vjInput.value); });

    /* ─── Copy button ─── */
    let copyBtn = document.querySelector('.copy-btn');
    if (!copyBtn) {
      copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = '📋';
      copyBtn.title = '선택한 절 복사';
      document.body.appendChild(copyBtn);
      copyBtn.addEventListener('click', () => {
        const sel = content.querySelector('.verse-item.selected');
        if (!sel) return;
        const vn = sel.dataset.v;
        const text = sel.querySelector('.vtext').textContent;
        const ref = `${koName} ${chNum}:${vn}`;
        navigator.clipboard.writeText(`${ref} ${text}`).then(() => {
          showToast('복사되었습니다');
        }).catch(() => {
          showToast('복사 실패');
        });
      });
    }
    function updateCopyBtn() {
      const sel = content.querySelector('.verse-item.selected');
      copyBtn.classList.toggle('show', !!sel);
    }

    content.querySelectorAll('.verse-item').forEach(el => {
      el.addEventListener('click', () => {
        content.querySelectorAll('.verse-item.selected').forEach(x=>x.classList.remove('selected'));
        el.classList.toggle('selected');
        history.replaceState(null, '', `#book=${encodeURIComponent(koName)}&ch=${chNum}&v=${el.dataset.v}`);
        updateCopyBtn();
        savePosition(koName, chNum, parseInt(el.dataset.v));
      });
    });

    if (highlightVerse) {
      setTimeout(() => {
        const el = content.querySelector(`[data-v="${highlightVerse}"]`);
        if (el) el.scrollIntoView({block:'center', behavior:'smooth'});
      }, 100);
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
        const book = findBook(koName);
        if (dx < 0 && chNum < book.chapters.length) {
          showChapter(koName, chNum + 1);
        } else if (dx > 0 && chNum > 1) {
          showChapter(koName, chNum - 1);
        }
      }
    }, { passive: true });
  }

  function doSearch(query) {
    query = query.trim();
    if (!query) return;
    currentView = 'search';
    setTitle('검색 결과');
    showBack(true);
    searchBar.style.display='none';

    const results = [];
    const lower = query.toLowerCase();
    for (const book of bible) {
      const ko = koNames[book.name];
      book.chapters.forEach((ch, ci) => {
        ch.forEach((v, vi) => {
          if (v.toLowerCase().includes(lower)) {
            results.push({ book:ko, ch:ci+1, v:vi+1, text:v });
          }
        });
      });
    }

    if (results.length === 0) {
      content.innerHTML = `<div class="search-results"><p style="text-align:center;padding:40px;color:var(--text-dim)">'${query}' 검색 결과가 없습니다</p></div>`;
      return;
    }

    content.innerHTML = `
      <div class="search-results">
        <div class="result-count">'${query}' 검색 결과 ${results.length}건</div>
        ${results.slice(0, 200).map(r => `
          <div class="search-item" data-book="${r.book}" data-ch="${r.ch}" data-v="${r.v}">
            <div class="ref">${r.book} ${r.ch}:${r.v}</div>
            <div class="text">${highlightText(r.text, query)}</div>
          </div>
        `).join('')}
        ${results.length>200 ? '<p style="text-align:center;color:var(--text-dim);padding:12px">결과가 너무 많습니다. 더 구체적으로 검색해보세요.</p>' : ''}
      </div>
    `;
    content.querySelectorAll('.search-item').forEach(el => {
      el.addEventListener('click', () => {
        showChapter(el.dataset.book, parseInt(el.dataset.ch));
        setTimeout(() => {
          const v = el.dataset.v;
          const target = content.querySelector(`[data-v="${v}"]`);
          if (target) {
            content.querySelectorAll('.verse-item.selected').forEach(x=>x.classList.remove('selected'));
            target.classList.add('selected');
            target.scrollIntoView({block:'center', behavior:'smooth'});
          }
        }, 100);
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
    if (book && ch) { showChapter(book, parseInt(ch)); }
    else if (book) { showBook(book); }
    else { showHome(); }
  }

  window.addEventListener('hashchange', handleHash);
  window.addEventListener('popstate', handleHash);

  init();
})();