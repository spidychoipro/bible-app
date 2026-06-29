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
  const allBooks = [...otOrder, ...ntOrder];

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  const title = $('#title');
  const content = $('#content');
  const btnBack = $('#btnBack');
  const btnSearch = $('#btnSearch');
  const btnDark = $('#btnDark');
  const searchBar = $('#searchBar');
  const searchInput = $('#searchInput');
  const searchClose = $('#searchClose');
  const loading = $('#loading');

  let darkMode = localStorage.getItem('bibleDark') === '1';
  if (darkMode) document.body.classList.add('dark');

  btnDark.textContent = darkMode ? '☀️' : '🌙';
  btnDark.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('bibleDark', darkMode ? '1' : '0');
    btnDark.textContent = darkMode ? '☀️' : '🌙';
  });

  btnBack.addEventListener('click', goBack);
  btnSearch.addEventListener('click', toggleSearch);
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
    try {
      const resp = await fetch(DATA_URL);
      bible = await resp.json();
      loading.classList.add('hide');
      handleHash();
    } catch(e) {
      loading.textContent = '데이터를 불러오는데 실패했습니다';
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
      return `<div class="book-item" data-book="${ko}">
        <div>${ko}</div>
        <div class="badge">${chapters}장</div>
      </div>`;
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
    let highlightVerse = query ? parseInt(query) : null;
    content.innerHTML = `
      <div class="verse-view">
        <div class="chapter-title">${koName} ${chNum}장</div>
        ${verses.map((v,i)=>{
          const vn = i+1;
          const cls = vn===highlightVerse ? 'verse-item highlight' : 'verse-item';
          return `<div class="${cls}" data-v="${vn}"><span class="vnum">${vn}</span><span class="vtext">${v}</span></div>`;
        }).join('')}
      </div>
      <div class="quick-nav">
        ${chNum>1?`<button id="prevCh" aria-label="이전장">◀</button>`:''}
        ${chNum<book.chapters.length?`<button id="nextCh" aria-label="다음장">▶</button>`:''}
      </div>
    `;
    const prev = $('#prevCh');
    const next = $('#nextCh');
    if (prev) prev.addEventListener('click', () => showChapter(koName, chNum-1));
    if (next) next.addEventListener('click', () => showChapter(koName, chNum+1));

    content.querySelectorAll('.verse-item').forEach(el => {
      el.addEventListener('click', () => {
        content.querySelectorAll('.verse-item.selected').forEach(x=>x.classList.remove('selected'));
        el.classList.toggle('selected');
        const v = el.dataset.v;
        history.replaceState(null, '', `#book=${encodeURIComponent(koName)}&ch=${chNum}&v=${v}`);
      });
    });

    if (highlightVerse) {
      setTimeout(() => {
        const el = content.querySelector(`[data-v="${highlightVerse}"]`);
        if (el) el.scrollIntoView({block:'center', behavior:'smooth'});
      }, 100);
    }
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
        ${results.slice(0,200).map(r => `
          <div class="search-item" data-book="${r.book}" data-ch="${r.ch}" data-v="${r.v}">
            <div class="ref">${r.book} ${r.ch}:${r.v}</div>
            <div class="text">${highlightText(r.text, query)}</div>
          </div>
        `).join('')}
        ${results.length>200 ? `<p style="text-align:center;color:var(--text-dim);padding:12px">결과가 너무 많습니다. 더 구체적으로 검색해보세요.</p>` : ''}
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
    const v = params.get('v');
    if (book && ch) {
      showChapter(book, parseInt(ch));
    } else if (book) {
      showBook(book);
    } else {
      showHome();
    }
  }

  window.addEventListener('hashchange', handleHash);
  window.addEventListener('popstate', handleHash);

  document.addEventListener('click', e => {
    if (e.target.closest('.verse-item') && e.target.closest('.verse-view')) {
      // handled inline
    }
  });

  init();
})();