/* ==========================================================================
   고신교회 사이트 공통 스크립트
   - 모든 페이지가 이 파일 하나를 불러옵니다.
   - data/*.js 의 자료를 읽어서 헤더·푸터·목록·카드를 화면에 그립니다.
   - 페이지 안에서  data-render="이름"  이 붙은 자리에 해당 내용이 그려집니다.
   - 평소 운영(글 추가·시간 수정)에는 이 파일을 고칠 필요가 없습니다. data 폴더만 고치세요.
   ========================================================================== */
(function () {
  'use strict';

  var ROOT = document.body.getAttribute('data-root') || './';
  var NAVREF = document.body.getAttribute('data-nav-url');   // 상세 페이지에서 "현재 메뉴"를 지정할 때 사용
  var DATA_FILES = ['church', 'worship', 'sermons', 'news', 'missions', 'books', 'departments', 'about', 'music', 'youtube'];
  window.KOSIN = window.KOSIN || {};
  var D = window.KOSIN;
  var R = {};   // 화면을 그리는 함수 모음

  /* ---------------------------------------------------------------- 유틸 */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function link(p) { return /^(https?:|tel:|mailto:|#)/.test(p) ? p : ROOT + p; }
  function telHref(n) { return 'tel:' + String(n || '').replace(/[^0-9+]/g, ''); }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function fmtDate(d) {   // 2026-11-17 → 2026.11.17 / 2026-03 → 2026.03 / 2025 → 2025 (날짜를 정확히 모를 때는 연·월만 적어도 됩니다)
    var m = String(d || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    return m ? m[1] + '.' + m[2] + (m[3] ? '.' + m[3] : '') : (d || '');
  }
  function byDateDesc(a, b) { return String(b.date || '').localeCompare(String(a.date || '')); }
  function showSamples() { return !(D.config && D.config.showSamples === false); }
  function visible(list) { return (list || []).filter(function (x) { return showSamples() || !x.sample; }); }
  function church() { return D.church || {}; }
  function getPath(path) { return path.split('.').reduce(function (o, k) { return o && o[k]; }, D) || []; }
  function ytWatch(id) { return 'https://www.youtube.com/watch?v=' + encodeURIComponent(id); }

  /* {{time:id}} {{place:id}} {{phone}} 자동 치환, 글 안의 상대 링크 보정 */
  function tokens(text) {
    var times = D.worshipTimes || [];
    return String(text == null ? '' : text)
      .replace(/\{\{(time|place):([\w-]+)\}\}/g, function (_, k, id) {
        var t = times.filter(function (x) { return x.id === id; })[0];
        return t ? t[k] : '';
      })
      .replace(/\{\{phone\}\}/g, church().phone || '');
  }
  function fixLinks(h) {
    return String(h).replace(/href="(?!https?:|mailto:|tel:|#|\/)([^"]+)"/g, function (_, p) { return 'href="' + ROOT + p + '"'; });
  }
  function rich(h) { return fixLinks(tokens(h)); }   // 데이터 파일의 HTML 글 (직접 작성한 신뢰 가능한 내용)

  function mapLinks() {
    var q = encodeURIComponent(church().mapQuery || church().address || '');
    return {
      kakao: 'https://map.kakao.com/link/search/' + q,
      naver: 'https://map.naver.com/p/search/' + q,
      google: 'https://www.google.com/maps/search/?api=1&query=' + q,
      embed: 'https://maps.google.com/maps?q=' + q + '&z=17&output=embed',
      roadview: church().roadviewUrl || ''   // 네이버 로드뷰 (data/church.js)
    };
  }

  /* ---------------------------------------------------------------- 아이콘 */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M5 12h14m0 0-5-5m5 5-5 5"/>',
    prev: '<path d="m15 6-6 6 6 6"/>',
    next: '<path d="m9 6 6 6-6 6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    book: '<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h12"/>',
    cross: '<path d="M12 3v18M6 9h12"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    download: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.5 3-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5 2 5 5"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-3.5 2.5-5.5 6-5.5 0 3.5-2.5 5.5-6 5.5z"/>',
    graduation: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
    church: '<path d="M12 2v4M10 4h4M6 21V12l6-5 6 5v9zM10 21v-5h4v5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    fax: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
    chat: '<path d="M12 4C7 4 3 7.1 3 11c0 2.4 1.6 4.5 4 5.8L6 20l3.6-2.2c.8.2 1.5.2 2.4.2 5 0 9-3.1 9-7s-4-7-9-7z"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>'
  };
  function ico(name, cls) {
    return '<svg class="ico' + (name === 'play' ? ' ico--fill' : '') + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[name] || ICONS.church) + '</svg>';
  }

  /* ---------------------------------------------------------------- 메뉴 */
  function deptUrl(d) { return d.url || 'next-generation/department.html?id=' + encodeURIComponent(d.id); }
  function menu() {
    return (D.menu || []).map(function (m) {
      if (m.auto === 'departments') {
        return {
          label: m.label, url: m.url,
          children: [{ label: '전체 보기', url: m.url }].concat(visible(D.departments).map(function (d) { return { label: d.name, url: deptUrl(d) }; }))
        };
      }
      return m;
    });
  }
  /* 메뉴 칸에 sub: [...] 가 있으면, 그 칸의 페이지에서 아래 줄(하위 메뉴)에 sub 의 칸들이 나옵니다. (위 드롭다운에는 나오지 않음) */
  function hasCurrent(m) { return isCurrent(m.url) || (m.children || []).some(hasCurrent) || (m.sub || []).some(hasCurrent); }
  function absParts(u) { var a = document.createElement('a'); a.href = ROOT + u; return { path: a.pathname.replace(/index\.html$/, ''), search: a.search }; }
  function isCurrent(u) {
    if (u.indexOf('#') > -1) return false;
    var t = absParts(u);
    var cur = NAVREF ? absParts(NAVREF) : { path: location.pathname.replace(/index\.html$/, ''), search: location.search };
    if (t.path !== cur.path) return false;
    if (!t.search) return true;
    var want = new URLSearchParams(t.search), have = new URLSearchParams(cur.search), ok = true;   // ?id=youth 처럼 필요한 값만 같으면 현재 페이지로 봅니다
    want.forEach(function (v, k) { if (have.get(k) !== v) ok = false; });
    return ok;
  }

  /* ---------------------------------------------------------------- 헤더 · 푸터 · 검색 */
  function replaceHost(host, html) { host.insertAdjacentHTML('beforebegin', html); host.parentNode.removeChild(host); }

  function renderHeader() {
    var host = $('#site-header'); if (!host) return;
    var c = church(), items = menu();
    var nav = items.map(function (m) {
      var cur = hasCurrent(m);
      var sub = (m.children && m.children.length)
        ? '<ul class="sub">' + m.children.map(function (ch) { return '<li><a href="' + esc(link(ch.url)) + '">' + esc(ch.label) + '</a></li>'; }).join('') + '</ul>' : '';
      return '<li' + (cur ? ' class="is-current"' : '') + '><a href="' + esc(link(m.url)) + '">' + esc(m.label) + '</a>' + sub + '</li>';
    }).join('');
    var mobile = items.map(function (m) {
      if (m.children && m.children.length) {
        return '<details><summary>' + esc(m.label) + ico('chevron') + '</summary><div class="m-sub">' +
          m.children.map(function (ch) { return '<a href="' + esc(link(ch.url)) + '">' + esc(ch.label) + '</a>'; }).join('') + '</div></details>';
      }
      return '<a class="m-link" href="' + esc(link(m.url)) + '">' + esc(m.label) + '</a>';
    }).join('');

    replaceHost(host,
      '<a class="skip-link" href="#main">본문 바로가기</a>' +
      '<header class="site-header" id="siteHeader"><div class="container header-inner">' +
        '<a class="brand" href="' + esc(link('index.html')) + '"><img class="brand-logo" src="' + esc(link(c.logo || 'assets/img/logo.png')) + '" alt="' + esc((c.denomination ? c.denomination + ' ' : '') + c.name) + ' 홈"></a>' +
        '<nav class="main-nav" aria-label="주 메뉴"><ul>' + nav + '</ul></nav>' +
        '<div class="header-tools">' +
          '<button type="button" class="icon-btn" data-open-search aria-label="사이트 검색">' + ico('search') + '</button>' +
          '<button type="button" class="icon-btn menu-toggle" aria-expanded="false" aria-controls="mobileMenu" aria-label="메뉴 열기">' + ico('menu') + '</button></div>' +
      '</div></header>' +
      '<div class="mobile-menu" id="mobileMenu" hidden>' + mobile +
        '<div class="m-contact"><a class="btn btn--primary" href="' + telHref(c.phone) + '">' + ico('phone') + ' 전화하기</a><a class="btn btn--outline" href="' + esc(link('about/location.html')) + '">' + ico('pin') + ' 오시는 길</a></div></div>');

    var header = $('#siteHeader'), toggle = $('.menu-toggle'), mm = $('#mobileMenu');
    function setMenu(open) {
      if (open) mm.removeAttribute('hidden'); else mm.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      toggle.innerHTML = ico(open ? 'close' : 'menu');
      document.body.classList.toggle('menu-open', open);
    }
    toggle.addEventListener('click', function () { setMenu(mm.hasAttribute('hidden')); });
    mm.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1023) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); closeSearch(); } });
    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 4); }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    setupSearch();
  }

  function renderFooter() {
    var host = $('#site-footer'); if (!host) return;
    var c = church(), m = mapLinks(), items = menu();
    replaceHost(host,
      '<footer class="site-footer"><div class="container"><div class="footer-grid">' +
        '<div><div class="footer-brand"><img src="' + esc(link(c.logo || 'assets/img/logo.png')) + '" alt="' + esc((c.denomination ? c.denomination + ' ' : '') + c.name) + '"></div>' +
          '<address><p>(' + esc(c.zip) + ') ' + esc(c.address) + '</p><p>전화 <a href="' + telHref(c.phone) + '">' + esc(c.phone) + '</a> · 팩스 ' + esc(c.fax) + '</p>' +
          (c.email ? '<p>이메일 <a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></p>' : '') + '</address>' +
          '<p style="margin-top:12px"><a href="' + m.kakao + '" target="_blank" rel="noopener">카카오맵</a> · <a href="' + m.naver + '" target="_blank" rel="noopener">네이버지도</a> · <a href="' + m.google + '" target="_blank" rel="noopener">구글지도</a>' + (m.roadview ? ' · <a href="' + esc(m.roadview) + '" target="_blank" rel="noopener">로드뷰</a>' : '') + '</p></div>' +
        '<div><h3>바로가기</h3><ul class="footer-links">' + items.map(function (it) { return '<li><a href="' + esc(link(it.url)) + '">' + esc(it.label) + '</a></li>'; }).join('') + '</ul></div>' +
        '<div><h3>안내</h3><ul class="footer-links"><li><a href="' + esc(link('worship/guide.html')) + '">예배안내</a></li><li><a href="' + esc(link('about/location.html')) + '">오시는 길</a></li><li><a href="' + esc(link('contact/index.html')) + '">문의하기</a></li><li><a href="' + esc(link('privacy.html')) + '">개인정보처리방침</a></li>' +
          (c.interpreter && c.interpreter.enabled !== false && /^https:\/\//.test(c.interpreter.url || '') ? '<li><a href="' + esc(c.interpreter.url) + '" target="_blank" rel="noopener">실시간 통역(라이브)</a></li>' : '') +
          (c.youtube ? '<li><a href="' + esc(c.youtube) + '" target="_blank" rel="noopener">유튜브 채널</a></li>' : '') + '</ul></div>' +
      '</div><div class="footer-bottom"><span>&copy; ' + new Date().getFullYear() + ' ' + esc(c.name) + '. All rights reserved.</span><span>' + esc(c.denomination || '') + ' ' + esc(c.name) + '</span></div></div></footer>' +
      '<nav class="bottom-bar" aria-label="빠른 메뉴"><a href="' + telHref(c.phone) + '">' + ico('phone') + '전화하기</a><a href="' + m.kakao + '" target="_blank" rel="noopener">' + ico('pin') + '길찾기</a><a href="' + esc(link('worship/guide.html')) + '">' + ico('clock') + '예배시간</a></nav>');
  }

  /* 사이트 검색 (메뉴·설교·소식·행사·저서에서 찾기) */
  var overlay, searchInput, searchList;
  /* 메뉴 이름과 다르게 자주 찾는 말 (예: "예배시간" → 예배안내). 필요하면 여기에 추가하세요. */
  var ALIAS = {
    'worship/guide.html': '예배시간 시간표 주일예배 수요예배 예배 시간',
    'about/location.html': '주소 지도 길찾기 주차 위치 교통 찾아오는',
    'contact/index.html': '전화 연락처 팩스 이메일 문의',
    'newcomer/index.html': '등록 방문 처음 새신자 새가족',
    'news/bulletin.html': '주보 교회소식',
    'books/index.html': '책 도서 저서',
    'mission/support.html': '후원 헌금 선교비'
  };
  function buildIndex() {
    var idx = [];
    menu().forEach(function (m) {
      if (!(m.children || []).length) idx.push({ t: m.label, s: '메뉴', u: m.url, k: ALIAS[m.url] || '' });
      (m.children || []).forEach(function (ch) { if (ch.url.indexOf('#') < 0) idx.push({ t: ch.label, s: m.label, u: ch.url, k: ALIAS[ch.url] || '' }); });
    });
    function add(list, label, u) { visible(list).forEach(function (x) { idx.push({ t: x.title, s: label + (x.date ? ' · ' + fmtDate(x.date) : ''), u: typeof u === 'function' ? u(x) : u }); }); }
    add(D.sermons, '주일예배 설교', 'worship/sermons.html');
    add(D.meditations, '3분 묵상', 'worship/meditation.html');
    add(D.wednesday, '수요성경공부', 'worship/wednesday.html');
    add(D.notices, '공지사항', 'news/index.html');
    add(D.events, '행사', function (x) { return eventPage(x) + (x.id ? '#' + x.id : ''); });
    add(D.books, '책 소개', function (b) { return 'books/detail.html?id=' + encodeURIComponent(b.id); });
    (D.missionFields || []).forEach(function (f) { (f.reports || []).forEach(function (r) { idx.push({ t: r.title + ' (' + f.name + ')', s: '선교보고 · ' + fmtDate(r.date), u: reportPath(f, reportId(r)) }); }); });
    visible(D.departments).forEach(function (d) { idx.push({ t: d.name, s: '교회학교', u: deptUrl(d) }); });
    return idx;
  }
  function setupSearch() {
    overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-label', '사이트 검색');
    overlay.innerHTML = '<div class="search-box"><div class="search-top"><input type="search" class="search-input" placeholder="찾으시는 내용을 입력하세요 (예: 예배시간, 설교)" aria-label="검색어" autocomplete="off"><button type="button" class="icon-btn" data-close-search aria-label="검색 닫기">' + ico('close') + '</button></div><ul class="search-results"></ul><p class="search-hint">메뉴, 설교, 교회소식, 행사, 저서에서 찾습니다.</p></div>';
    document.body.appendChild(overlay);
    searchInput = $('.search-input', overlay); searchList = $('.search-results', overlay);
    var index = null;
    searchInput.addEventListener('input', function () {
      var q = searchInput.value.trim().toLowerCase();
      if (!q) { searchList.innerHTML = ''; return; }
      index = index || buildIndex();
      var hits = index.filter(function (i) { return i.t.toLowerCase().indexOf(q) > -1 || i.s.toLowerCase().indexOf(q) > -1 || (i.k || '').toLowerCase().indexOf(q) > -1; }).slice(0, 20);
      searchList.innerHTML = hits.length
        ? hits.map(function (h) { return '<li><a href="' + esc(link(h.u)) + '">' + esc(h.t) + '<small>' + esc(h.s) + '</small></a></li>'; }).join('')
        : '<li class="search-hint">검색 결과가 없습니다. 다른 단어로 찾아보세요.</li>';
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target.closest('[data-close-search]')) closeSearch(); });
    document.addEventListener('click', function (e) { if (e.target.closest('[data-open-search]')) openSearch(); });
  }
  function openSearch() { overlay.classList.add('is-open'); searchInput.value = ''; searchList.innerHTML = ''; setTimeout(function () { searchInput.focus(); }, 30); }
  function closeSearch() { if (overlay) overlay.classList.remove('is-open'); }

  /* ---------------------------------------------------------------- 공통 부품 */
  function mountList(el, items, rowFn, o) {
    o = o || {};
    if (!items.length) { el.innerHTML = '<div class="empty">' + esc(o.empty || '준비 중입니다.') + '</div>'; return; }
    var size = o.pageSize || items.length, shown = 0;
    var wrap = document.createElement(o.tag || 'div'); if (o.wrapClass) wrap.className = o.wrapClass;
    var more = document.createElement('div'); more.className = 'load-more';
    el.innerHTML = ''; el.appendChild(wrap); el.appendChild(more);
    function next() {
      var part = items.slice(shown, shown + size); shown += part.length;
      wrap.insertAdjacentHTML('beforeend', part.map(rowFn).join(''));
      more.innerHTML = shown < items.length ? '<button type="button" class="btn btn--outline">더 보기 (' + shown + ' / ' + items.length + ')</button>' : '';
      var b = $('button', more); if (b) b.onclick = next;
    }
    next();
  }
  function notFound(el, msg, href, label) {
    el.innerHTML = '<div class="empty">' + esc(msg) + '<br><a class="btn btn--outline" style="margin-top:14px" href="' + esc(link(href)) + '">' + esc(label) + '</a></div>';
  }
  function setHero(title, lead) {
    var h = $('.page-hero h1'); if (h) h.textContent = title;
    var cu = $('.crumbs [data-current]'); if (cu) cu.textContent = title;
    var p = $('.page-hero__lead');
    if (lead) {
      if (!p) { var box = $('.page-hero .container'); if (box) { p = document.createElement('p'); p.className = 'page-hero__lead'; box.appendChild(p); } }
      if (p) p.textContent = lead;
    } else if (p) { p.parentNode.removeChild(p); }
  }
  function sampleTag(x) { return x && x.sample ? ' <span class="badge badge--sample">샘플</span>' : ''; }
  function placeholder(text) { return showSamples() ? '<div class="empty">' + esc(text) + '</div>' : ''; }

  function video(s) {
    if (s && s.youtube) {
      return '<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(s.youtube) + '" title="' + esc(s.title) + '" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
    }
    return '<div class="video"><div class="video-ph">' + ico('play') + '<strong>설교 영상 준비 중</strong><span>영상이 올라오면 이곳에서 바로 볼 수 있습니다.</span></div></div>';
  }
  /* ---- 항목별 공유 주소 ----
     선교보고·선교행사 한 건 한 건이 자기 주소(페이지 주소 + #항목id)를 가집니다.
     id 는 날짜와 제목으로 자동 만들어지므로, 새 글을 위에 추가해도 이미 공유한 주소가 바뀌지 않습니다.
     (고정하고 싶으면 data 항목에 id: '원하는-id' 를 직접 적으세요.) */
  function hash36(s) { var h = 5381, i; s = String(s); for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function reportId(r) { return r.id || 'r-' + (r.date || 'x') + '-' + hash36(r.title); }
  /* 선교보고·공사 소식은 선교지(id)와 갈래(type: mission=선교, construction=공사) 두 가지로 주소가 정해집니다 */
  function fieldType(r) { return r && r.type === 'construction' ? 'construction' : 'mission'; }
  function fieldPath(f, type) { return 'mission/field.html?id=' + encodeURIComponent(f.id) + '&type=' + (type === 'construction' ? 'construction' : 'mission'); }
  function reportPath(f, id, type) { return fieldPath(f, type) + '#' + id; }
  function eventPage(x) { return x && x.category === '선교행사' ? 'mission/events.html' : 'news/events.html'; }
  function shareBtn(x, extraClass) {
    if (!x.sharePath) return '';
    return '<button type="button" class="row-share' + (extraClass ? ' ' + extraClass : '') + '" data-share-item data-title="' + esc(x.shareTitle || x.title) + '" data-text="' + esc(x.shareText || '') + '" data-path="' + esc(x.sharePath) + '" aria-label="' + esc(x.title) + ' 카카오톡으로 공유">' + ico('chat') + '<span>카카오톡 공유</span></button>';
  }
  function decorate(src, items) {   // 목록 종류별로 공유 정보를 붙입니다 (선교행사만)
    if (src !== 'events') return items;
    return items.map(function (x) {
      if (x.category !== '선교행사' || !x.id) return x;
      return Object.assign({}, x, { sharePath: 'mission/events.html#' + x.id, shareTitle: x.title, shareText: '선교행사 · ' + fmtDate(x.date) });
    });
  }
  /* ---- 행사 글의 사진·영상 ----
     photos : 12   → assets/img/events/ 폴더의 <행사id>_001.jpg ~ <행사id>_012.jpg 12장 (사진 수만 적으면 됩니다)
              또는 ['a.jpg', 'b.jpg'] 처럼 파일 이름을 직접 적어도 됩니다 (같은 폴더, 전체 경로도 가능)
     videos : ['유튜브영상ID', 'clip.mp4']  → 유튜브는 영상 ID, 짧은 mp4 파일은 같은 폴더에 올리고 파일 이름을 적습니다 */
  function eventFile(x, f) { return /^(https?:|assets\/)/.test(f) ? f : (x.dir || 'assets/img/events') + '/' + f; }   // dir: 사진 폴더를 따로 지정 (선교보고 등)
  function photoNames(x) {
    var p = x.photos;
    if (typeof p === 'number') { var a = []; for (var i = 1; i <= p; i++) a.push(x.id + '_' + ('00' + i).slice(-3) + '.jpg'); return a; }
    return p || [];
  }
  function videoItem(x, v) {
    var o = typeof v === 'string' ? { id: v } : (v || {}), id = o.id || o.file || '';
    if (/\.(mp4|webm|mov)$/i.test(id)) return '<video class="event-video" controls preload="metadata" playsinline src="' + esc(link(eventFile(x, id))) + '"></video>';
    return '<a class="event-video" href="' + ytWatch(id) + '" target="_blank" rel="noopener" aria-label="' + esc(o.title || x.title) + ' 영상 보기 (유튜브)"><img src="https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg" alt="" loading="lazy" width="480" height="270"><span class="card__play" aria-hidden="true">' + ico('play') + '</span></a>';
  }
  var EV_FIRST = 24;   // 사진이 많은 행사는 처음 24장만 보이고 "사진 더 보기"로 펼칩니다
  function eventMedia(x) {
    var ph = photoNames(x), vd = x.videos || [], html = '';
    if (vd.length) html += '<div class="event-videos">' + vd.map(function (v) { return videoItem(x, v); }).join('') + '</div>';
    if (ph.length) {
      html += '<div class="photo-grid event-photos' + (x.layout === 'doc' ? ' doc-photos' : '') + '">' + ph.map(function (p, i) {   // layout: 'doc' = 세로 문서(보고서) 그림, 잘라내지 않고 그대로
        var f = link(eventFile(x, p));
        return '<a' + (i >= EV_FIRST ? ' hidden' : '') + ' href="' + esc(f) + '" data-full="' + esc(f) + '" data-caption="' + esc(x.title + ' (' + (i + 1) + '/' + ph.length + ')') + '"><img src="' + esc(f) + '" alt="' + esc(x.title + ' 사진 ' + (i + 1)) + '" loading="lazy"></a>';
      }).join('') + '</div>';
      if (ph.length > EV_FIRST) html += '<p class="event-more-wrap"><button type="button" class="btn btn--outline btn--sm event-more">사진 더 보기 (' + EV_FIRST + ' / ' + ph.length + ')</button></p>';
    }
    return html;
  }
  function setupEventMore() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.event-more'); if (!b) return;
      var grid = $('.event-photos', b.closest('.post-body')), total = $$('a', grid).length;
      $$('a[hidden]', grid).slice(0, 48).forEach(function (a) { a.removeAttribute('hidden'); });
      var left = $$('a[hidden]', grid).length;
      if (left) b.textContent = '사진 더 보기 (' + (total - left) + ' / ' + total + ')'; else b.parentNode.removeChild(b);
    });
  }
  function postRow(x) {
    var media = eventMedia(x), nph = photoNames(x).length;
    var counts = (nph ? ' <span class="badge badge--gold">사진 ' + nph + '</span>' : '') + ((x.videos || []).length ? ' <span class="badge badge--gold">영상 ' + x.videos.length + '</span>' : '');
    var badges = (x.pinned ? '<span class="badge badge--pin">고정</span> ' : '') + (x.category ? '<span class="badge">' + esc(x.category) + '</span>' : '') + counts + sampleTag(x);
    var head = '<span class="post-date">' + fmtDate(x.date) + '</span><span class="post-title">' + esc(x.title) + '</span><span>' + badges + '</span>';
    var open = '<li' + (x.id ? ' id="' + esc(x.id) + '"' : '') + (x.sharePath ? ' class="has-share"' : '') + '>', tail = shareBtn(x) + '</li>';
    if (x.link) return open + '<a class="post-row" href="' + esc(link(x.link)) + '"' + (/^https?:|\.pdf$/i.test(x.link) ? ' target="_blank" rel="noopener"' : '') + '>' + head + '</a>' + tail;
    if (x.body || media) return open + '<details><summary class="post-row">' + head + '</summary><div class="post-body">' + (x.body ? rich(x.body) : '') + media + '</div></details>' + tail;
    return open + '<div class="post-row">' + head + '</div>' + tail;
  }
  function sermonRow(x) {
    var inner = '<span>' + esc(x.title) + '</span><time>' + fmtDate(x.date) + '</time>';
    return x.youtube ? '<a class="mini-row" href="' + ytWatch(x.youtube) + '" target="_blank" rel="noopener">' + inner + '</a>' : '<div class="mini-row">' + inner + '</div>';
  }
  function sermonCard(s) {
    /* 유튜브 영상 ID 만 있으면 썸네일(대표 사진)이 자동으로 보입니다. 누르면 유튜브에서 영상이 열립니다. */
    var thumb = s.youtube
      ? '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(s.youtube) + '/hqdefault.jpg" alt="" loading="lazy" width="480" height="270"><span class="card__play" aria-hidden="true">' + ico('play') + '</span>'
      : ico('play');
    var inner = '<div class="card__thumb">' + thumb + '</div><div class="card__body"><p class="card__meta">' + fmtDate(s.date) + (s.scripture ? ' · ' + esc(s.scripture) : '') + '</p><h3>' + esc(s.title) + (s.note ? ' <span class="badge badge--gold">' + esc(s.note) + '</span>' : '') + '</h3>' + (s.preacher ? '<p>' + esc(s.preacher) + '</p>' : '') + '</div>';
    return s.youtube ? '<a class="card" href="' + ytWatch(s.youtube) + '" target="_blank" rel="noopener" aria-label="' + esc(s.title) + ' · ' + fmtDate(s.date) + ' · 유튜브에서 보기">' + inner + '</a>' : '<div class="card">' + inner + '</div>';
  }
  function bookCover(b) {
    return '<div class="book-cover">' + (b.cover
      ? '<img src="' + esc(link(b.cover)) + '" alt="' + esc(b.title) + ' 표지" loading="lazy">'
      : '<div class="book-cover__ph">' + ico('book') + '<strong>' + esc(b.title) + '</strong><span>표지 이미지 준비 중</span></div>') +
      (b.sample ? '<span class="badge badge--sample">샘플</span>' : '') + '</div>';
  }
  function bookCard(b) {
    return '<a class="book-card" href="' + esc(link('books/detail.html?id=' + encodeURIComponent(b.id))) + '">' + bookCover(b) + '<h3>' + esc(b.title) + '</h3>' + (b.oneLine ? '<p>' + esc(b.oneLine) + '</p>' : '') + '<span class="more">자세히 보기 ' + ico('arrow') + '</span></a>';
  }
  function galleryItem(g) {   // 메인의 "행사 사진" 한 장 (누르면 그 행사 글로 이동)
    return '<a class="gallery__item" href="' + esc(link(g.href)) + '"><img src="' + esc(link(g.img)) + '" alt="' + esc(g.title) + '" loading="lazy"><span class="gallery__cap">' + esc(g.title) + (g.date ? ' · ' + fmtDate(g.date) : '') + '</span></a>';
  }
  function deptTimeObj(d) { var id = d.timeId || d.id; return (D.worshipTimes || []).filter(function (t) { return t.id === id; })[0]; }
  function deptTime(d) { var t = deptTimeObj(d); return t ? t.day + ' ' + t.time : (d.timeText || ''); }

  /* ---------------------------------------------------------------- 렌더러 (페이지의 data-render="이름") */
  R['page-hero'] = function (el) {
    var title = el.getAttribute('data-title') || '', lead = el.getAttribute('data-lead') || '';
    var group = null;
    menu().forEach(function (m) { if (!group && hasCurrent(m)) group = m; });
    var crumbs = '<a href="' + esc(link('index.html')) + '">홈</a>' + (group ? ' &rsaquo; <a href="' + esc(link(group.url)) + '">' + esc(group.label) + '</a>' : '') + ' &rsaquo; <span data-current>' + esc(title) + '</span>';
    var html = '<section class="page-hero"><div class="container"><div class="crumbs">' + crumbs + '</div><h1>' + esc(title) + '</h1>' + (lead ? '<p class="page-hero__lead">' + esc(lead) + '</p>' : '') + '</div></section>';
    var tabs = group && group.children;
    if (group) {   // 메뉴 칸에 sub 가 있으면 (예: 네팔 선교 → 네팔 선교 / 네팔 공사) 그 칸의 페이지에서는 sub 를 하위 메뉴로 보여 줍니다
      var own = group.children.filter(function (c) { return c.sub && hasCurrent(c); })[0];
      if (own) tabs = own.sub;
    }
    if (group && tabs && tabs.length > 1 && el.getAttribute('data-subnav') !== 'off') {
      html += '<nav class="subnav" aria-label="' + esc(group.label) + ' 하위 메뉴"><div class="container"><ul>' + tabs.map(function (ch) {
        return '<li><a href="' + esc(link(ch.url)) + '"' + (isCurrent(ch.url) ? ' aria-current="page"' : '') + '>' + esc(ch.label) + '</a></li>';
      }).join('') + '</ul></div></nav>';
    }
    replaceHost(el, html);
  };

  R.hero = function (el) {
    var c = church(), s = c.slogan || { lines: [] };
    el.innerHTML = '<section class="hero"><div class="hero__media" aria-hidden="true"><video class="hero__video" muted loop playsinline preload="auto" tabindex="-1" disablepictureinpicture></video><div class="hero__shade"></div></div><button type="button" class="hero__toggle" aria-label="배경 영상 일시정지" hidden></button><div class="container"><span class="hero__label">' + esc(s.year || '') + ' 교회 표어</span>' +
      '<h1><span class="sr-only">' + esc(c.name) + ' </span>' + (s.lines || []).map(function (l) { return '<span>' + esc(l) + '</span>'; }).join('') + '</h1>' +
      '<p class="hero__lead">' + esc(c.heroLead || '') + '</p>' +
      '<div class="hero__actions"><a class="btn btn--light" href="' + esc(link('worship/guide.html')) + '">' + ico('clock') + ' 예배 시간 보기</a><a class="btn btn--ghost-light" href="' + esc(link('about/location.html')) + '">' + ico('pin') + ' 오시는 길</a></div></div></section>';
    setupHeroVideo(el);
  };

  /* 대문 배경 영상 (assets/video/hero.mp4): 소리 없이 반복 재생.
     - 영상이 재생되기 시작하면 부드럽게 나타나고, 그 전에는 첫 장면 사진이 보입니다.
     - 움직임 줄이기 설정·데이터 절약 모드에서는 재생하지 않고 사진만 보여 줍니다.
     - 화면 밖으로 스크롤되면 멈춰서 배터리와 데이터를 아낍니다. */
  function setupHeroVideo(root) {
    var v = root.querySelector('.hero__video'), hero = root.querySelector('.hero'), btn = root.querySelector('.hero__toggle');
    if (!v || !hero) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var saver = navigator.connection && navigator.connection.saveData;
    var userPaused = !!(reduce || saver);          // 이 경우는 자동 재생하지 않고, 버튼을 눌렀을 때만 재생합니다
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.addEventListener('playing', function () { v.classList.add('is-on'); });
    function load() { if (!v.getAttribute('src')) v.src = link('assets/video/hero.mp4'); }
    function play() { load(); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    function sync() {
      if (!btn) return;
      var playing = !v.paused && !v.ended;
      btn.innerHTML = ico(playing ? 'pause' : 'play');
      btn.setAttribute('aria-label', playing ? '배경 영상 일시정지' : '배경 영상 재생');
      btn.title = playing ? '영상 일시정지' : '영상 재생';
    }
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    if (btn) {
      btn.hidden = false; sync();
      btn.addEventListener('click', function () {
        if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); }
      });
    }
    if (!userPaused) play();
    if ('IntersectionObserver' in window) {   // 화면 밖에서는 멈춰서 배터리와 데이터를 아낍니다
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { if (!userPaused) play(); } else if (!v.paused) v.pause(); });
      }, { threshold: 0.05 }).observe(hero);
    }
  }

  R['slogan-big'] = function (el) {
    var s = church().slogan || { lines: [] };
    el.innerHTML = '<div class="slogan-big"><span class="eyebrow">' + esc(s.year || '') + ' 교회 표어</span><p>' + (s.lines || []).map(esc).join('<br>') + '</p></div>';
  };
  R['mission-vision'] = function (el) {
    var imgs = (D.missionVisionImages || []).filter(function (x) { return x && x.img; });
    if (imgs.length) {   // 선교지 안내 그림을 번호 순서대로 (소개글이 있으면 그 위에 글)
      el.innerHTML = (D.missionVision ? '<div class="prose">' + rich(D.missionVision) + '</div>' : '') +
        '<div class="photo-grid vision-grid">' + imgs.map(function (x, i) {
          var src = esc(link(x.img)), cap = esc(x.caption || ('선교지 안내 ' + (i + 1)));
          return '<a href="' + src + '" data-full="' + src + '" data-caption="' + cap + '" aria-label="' + cap + ' 크게 보기"><img src="' + src + '" alt="' + cap + '"' + (i > 1 ? ' loading="lazy"' : '') + '></a>';
        }).join('') + '</div>';
      return;
    }
    el.innerHTML = D.missionVision ? '<div class="prose">' + rich(D.missionVision) + '</div>' : (placeholder('선교 비전 소개글을 입력하세요. (data/missions.js 의 missionVision)') || '<p class="lead">네팔과 필리핀에서 복음을 전하고 교회와 학교, 우물을 세우는 선교 사역을 함께합니다.</p>');
  };

  R['worship-cards'] = function (el) {
    var list = (D.worshipTimes || []).filter(function (t) { return t.featured; });
    el.innerHTML = list.map(function (t) {
      return '<article class="time-card"><span class="time-card__day">' + esc(t.day) + '</span><h3>' + esc(t.name) + '</h3><p class="time-card__time">' + esc(t.time) + '</p><p class="time-card__place">' + ico('pin') + esc(t.place) + '</p></article>';
    }).join('');
  };

  R['worship-table'] = function (el) {
    var groups = [], map = {};
    (D.worshipTimes || []).forEach(function (t) { if (!map[t.group]) { map[t.group] = []; groups.push(t.group); } map[t.group].push(t); });
    el.innerHTML = groups.map(function (g) {
      return '<h2 class="group-title">' + esc(g) + '</h2><div class="table-wrap"><table class="data-table"><thead><tr><th>예배·모임</th><th>요일</th><th>시간</th><th>장소</th></tr></thead><tbody>' +
        map[g].map(function (t) { return '<tr><td class="t-name">' + esc(t.name) + '</td><td data-label="요일">' + esc(t.day) + '</td><td class="t-time" data-label="시간">' + esc(t.time) + '</td><td data-label="장소">' + esc(t.place) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }).join('');
  };

  R['sermon-latest'] = function (el) {
    var list = visible(D.sermons).sort(byDateDesc), s = list[0];
    if (!s) { el.innerHTML = '<div class="empty">설교 영상을 준비하고 있습니다.</div>'; return; }
    var rest = list.slice(1, 4), yt = church().youtube;
    var med = visible(D.meditations).slice().sort(byDateDesc).slice(0, 4);
    var shorts = visible(D.shorts).slice().sort(byDateDesc).slice(0, 12);
    var rails = '';
    if (med.length) {
      var medList = church().youtubeMeditation;   // 유튜브의 "3분 묵상" 재생목록 주소 (없으면 이 사이트의 3분 묵상 페이지로 연결)
      rails += '<section class="rail rail--med" aria-label="3분 묵상"><header class="rail__head"><h3>3분 묵상</h3>' +
        (medList ? '<a class="more-link" href="' + esc(medList) + '" target="_blank" rel="noopener">유튜브에서 더보기 &rarr;</a>' : '<a class="more-link" href="' + esc(link('worship/meditation.html')) + '">전체 보기 &rarr;</a>') +
        '</header><div class="rail__list">' +
        med.map(function (m) {
          return '<a class="med-item" href="' + ytWatch(m.youtube) + '" target="_blank" rel="noopener"><span class="med-thumb"><img src="https://i.ytimg.com/vi/' + encodeURIComponent(m.youtube) + '/mqdefault.jpg" alt="" loading="lazy" width="320" height="180"><span class="card__play" aria-hidden="true">' + ico('play') + '</span></span><span class="med-text"><time>' + fmtDate(m.date) + '</time><strong>' + esc(m.title) + '</strong></span></a>';
        }).join('') + '</div></section>';
    }
    if (shorts.length) {
      rails += '<section class="rail rail--shorts" aria-label="쇼츠"><header class="rail__head"><h3>쇼츠</h3><div class="rail__tools">' +
        '<div class="slider-btns"><button type="button" class="slider-btn" data-rail="-1" aria-label="이전 쇼츠"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><button type="button" class="slider-btn" data-rail="1" aria-label="다음 쇼츠"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></div>' +
        (yt ? '<a class="more-link" href="' + esc(yt.replace(/\/+$/, '') + '/shorts') + '" target="_blank" rel="noopener">유튜브에서 더보기 &rarr;</a>' : '') + '</div></header>' +
        '<div class="shorts-track" tabindex="0" aria-label="쇼츠 목록">' + shorts.map(function (m) {
          var id = encodeURIComponent(m.youtube);
          return '<a class="short-card" href="https://www.youtube.com/shorts/' + id + '" target="_blank" rel="noopener"><img src="https://i.ytimg.com/vi/' + id + '/oardefault.jpg" onerror="this.onerror=function(){this.onerror=null;this.src=\'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg\'};this.src=\'https://i.ytimg.com/vi/' + id + '/frame0.jpg\'" alt="" loading="lazy"><span class="short-card__shade"></span><time>' + fmtDate(m.date) + '</time><span class="card__play" aria-hidden="true">' + ico('play') + '</span><span class="short-card__title">' + esc(m.title) + '</span></a>';
        }).join('') + '</div></section>';
    }
    el.innerHTML = '<div class="sermon-feature">' + video(s) + '<div class="sermon-info"><span class="badge badge--gold">' + esc(s.service || '주일 오전 공예배') + '</span><h3>' + esc(s.title) + '</h3>' +
      '<p class="sermon-meta">' + fmtDate(s.date) + (s.preacher ? ' · ' + esc(s.preacher) : '') + (s.scripture ? ' · ' + esc(s.scripture) : '') + '</p>' + (s.summary ? '<p>' + esc(s.summary) + '</p>' : '') +
      (rest.length ? '<div class="mini-list">' + rest.map(sermonRow).join('') + '</div>' : '') +
      '<div class="btn-row"><a class="btn btn--primary" href="' + esc(link('worship/sermons.html')) + '">설교 더 보기</a>' + (yt ? '<a class="btn btn--outline" href="' + esc(yt) + '" target="_blank" rel="noopener">유튜브 채널</a>' : '') + '</div></div></div>' +
      (rails ? '<div class="word-rails' + (med.length && shorts.length ? '' : ' word-rails--one') + '">' + rails + '</div>' : '');
    var track = $('.shorts-track', el);
    if (track) {
      var arrows = $$('[data-rail]', el);
      arrows.forEach(function (b) { b.addEventListener('click', function () { track.scrollBy({ left: (+b.getAttribute('data-rail')) * 360, behavior: 'smooth' }); }); });
      if (track.scrollWidth <= track.clientWidth + 4) { var sb = $('.rail--shorts .slider-btns', el); if (sb) sb.classList.add('is-hidden'); }
    }
  };

  /* 영상 카드 목록: data-source(sermons · meditations · wednesday), data-tabs="year" 이면 연도 버튼이 붙습니다. */
  R['sermon-grid'] = function (el) {
    var src = el.getAttribute('data-source') || 'sermons';
    var items = visible(getPath(src)).slice().sort(byDateDesc);
    var opts = { pageSize: +el.getAttribute('data-page-size') || 12, wrapClass: 'card-grid', empty: el.getAttribute('data-empty') || '영상을 준비하고 있습니다.' };
    var years = [];
    items.forEach(function (i) { var y = String(i.date || '').slice(0, 4); if (/^\d{4}$/.test(y) && years.indexOf(y) < 0) years.push(y); });
    if (el.getAttribute('data-tabs') === 'year' && years.length > 1) {
      el.innerHTML = '<div class="tabs" role="group" aria-label="연도 선택"></div><div class="tab-body"></div>';
      var tabs = $('.tabs', el), body = $('.tab-body', el);
      tabs.innerHTML = ['전체'].concat(years).map(function (y) {
        var n = y === '전체' ? items.length : items.filter(function (i) { return String(i.date).slice(0, 4) === y; }).length;
        return '<button type="button" class="tab" data-year="' + y + '" aria-pressed="false">' + (y === '전체' ? '전체' : y + '년') + ' <small>' + n + '</small></button>';
      }).join('');
      var show = function (y) {
        $$('.tab', tabs).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-year') === y ? 'true' : 'false'); });
        mountList(body, y === '전체' ? items : items.filter(function (i) { return String(i.date).slice(0, 4) === y; }), sermonCard, opts);
      };
      tabs.addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) show(b.getAttribute('data-year')); });
      show('전체'); return;
    }
    mountList(el, items, sermonCard, opts);
  };

  /* 유튜브 채널 바로가기 한 줄 (data/church.js 의 youtube 주소를 씁니다) */
  R['youtube-link'] = function (el) {
    var u = church().youtube;
    el.innerHTML = u ? '<p class="yt-note">' + ico('play') + '<span>더 많은 영상은 <a href="' + esc(u) + '" target="_blank" rel="noopener">고신교회 유튜브 채널</a>에서 보실 수 있습니다.</span></p>' : '';
  };

  R['post-list'] = function (el) {
    var src = el.getAttribute('data-source'), items = decorate(src, visible(getPath(src)).slice());
    var onlyCat = el.getAttribute('data-category');   // 예) data-category="교회행사" : 그 분류만 보여 줍니다
    if (onlyCat) items = items.filter(function (i) { return i.category === onlyCat; });
    items.sort(function (a, b) { if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1; return byDateDesc(a, b); });
    var limit = +el.getAttribute('data-limit') || 0; if (limit) items = items.slice(0, limit);
    var pageSize = +el.getAttribute('data-page-size') || 0, empty = el.getAttribute('data-empty') || '등록된 글이 없습니다.';
    var opts = { tag: 'ul', wrapClass: 'post-list', pageSize: pageSize, empty: empty };
    if (el.getAttribute('data-tabs') === 'category') {
      var cats = ['전체']; items.forEach(function (i) { if (i.category && cats.indexOf(i.category) < 0) cats.push(i.category); });
      el.innerHTML = '<div class="tabs" role="group" aria-label="분류 선택"></div><div class="tab-body"></div>';
      var tabs = $('.tabs', el), body = $('.tab-body', el);
      tabs.innerHTML = cats.map(function (c) { return '<button type="button" class="tab" data-cat="' + esc(c) + '" aria-pressed="false">' + esc(c) + '</button>'; }).join('');
      var show = function (cat) {
        $$('.tab', tabs).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-cat') === cat ? 'true' : 'false'); });
        mountList(body, cat === '전체' ? items : items.filter(function (i) { return i.category === cat; }), postRow, opts);
      };
      tabs.addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) show(b.getAttribute('data-cat')); });
      show('전체'); return;
    }
    mountList(el, items, postRow, opts);
  };

  R['bulletin-card'] = function (el) {
    var b = visible(D.bulletins).sort(byDateDesc)[0];
    var btn = b && b.file
      ? '<a class="btn btn--light" href="' + esc(link(b.file)) + '" download>' + ico('download') + ' 주보 내려받기</a>'
      : '<span class="btn btn--light" aria-disabled="true">주보 준비 중</span>';
    var viewer = b && b.file ? '<div class="bl-viewer" hidden><div class="bl-track" tabindex="0" role="group" aria-label="주보 미리보기 (좌우로 넘겨 보세요)"></div>' +
      '<div class="bl-ctl"><button type="button" class="bl-btn" data-bl="-1" aria-label="이전 쪽"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><span class="bl-count" aria-live="polite"></span><button type="button" class="bl-btn" data-bl="1" aria-label="다음 쪽"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></div></div>' : '';
    if (el.getAttribute('data-variant') === 'wide') {   // 메인: 이번 주 주보만 넓게 (지난 주보는 "주보 더보기"에서)
      el.innerHTML = '<div class="bulletin-card bulletin-card--wide"><div class="bc-info"><span class="eyebrow">이번 주 주보</span><h3>' + esc(b ? b.title : '주보') + '</h3><p>' + (b ? fmtDate(b.date) : '') + '</p>' +
        '<div class="bc-actions">' + btn + '<a class="btn btn--ghost-light" href="' + esc(link('news/bulletin.html')) + '">지난 주보 더보기 &rarr;</a></div></div>' +
        (viewer ? '<div class="bc-view">' + viewer + '</div>' : '') + '</div>';
    } else {
      el.innerHTML = '<div class="bulletin-card"><span class="eyebrow">이번 주 주보</span><h3>' + esc(b ? b.title : '주보') + '</h3><p>' + (b ? fmtDate(b.date) : '') + '</p>' + viewer + btn +
        '<p style="margin:16px 0 0"><a href="' + esc(link('news/bulletin.html')) + '" style="color:#fff;text-decoration:underline">지난 주보 보기</a></p></div>';
    }
    if (viewer) setupBulletinPreview($('.bl-viewer', el), link(b.file), b.title);
  };

  /* ---- 주보 미리보기 ----
     주보 PDF 의 각 쪽을 그림처럼 그려서 좌우로 넘겨 볼 수 있게 합니다 (PDF 만 올리면 자동으로 만들어집니다).
     카드가 화면에 가까워졌을 때만 PDF 해독 도구(pdf.js)를 불러오고, 불러오지 못하면 미리보기 없이 "내려받기"만 보입니다. */
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  function loadPdfJs(cb) {
    if (window.pdfjsLib) return cb(window.pdfjsLib);
    var s = document.createElement('script'); s.src = PDFJS + 'pdf.min.js'; s.async = true;
    s.onload = function () { if (window.pdfjsLib) { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; cb(window.pdfjsLib); } else cb(null); };
    s.onerror = function () { cb(null); };
    document.head.appendChild(s);
  }
  function setupBulletinPreview(box, url, title) {
    var track = $('.bl-track', box), count = $('.bl-count', box), started = false;
    function start() {
      if (started) return; started = true;
      loadPdfJs(function (lib) {
        if (!lib) return;
        lib.getDocument(url).promise.then(function (pdf) {
          var n = pdf.numPages; if (!n) return;
          box.hidden = false;
          track.innerHTML = '';
          var slides = [];
          for (var i = 1; i <= n; i++) {
            var a = document.createElement('a'); a.className = 'bl-page'; a.href = url + '#page=' + i; a.target = '_blank'; a.rel = 'noopener';
            a.setAttribute('aria-label', title + ' ' + i + '쪽 (누르면 PDF가 열립니다)');
            a.innerHTML = '<canvas></canvas><span class="bl-num">' + i + '</span>';
            track.appendChild(a); slides.push(a);
          }
          function upd() {
            var w = slides[0].offsetWidth + 12, idx = Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / (w || 1))));
            count.textContent = (idx + 1) + ' / ' + n;
          }
          upd(); track.addEventListener('scroll', function () { window.requestAnimationFrame(upd); }, { passive: true });
          $$('[data-bl]', box).forEach(function (btn) { btn.addEventListener('click', function () { track.scrollBy({ left: (+btn.getAttribute('data-bl')) * (slides[0].offsetWidth + 12), behavior: 'smooth' }); }); });
          // 쪽을 하나씩 차례로 그립니다 (앞쪽부터 보이도록)
          (function draw(k) {
            if (k > n) return;
            pdf.getPage(k).then(function (page) {
              var cssW = slides[k - 1].clientWidth || 240, base = page.getViewport({ scale: 1 }), sc = (cssW * Math.min(2, window.devicePixelRatio || 1)) / base.width, vp = page.getViewport({ scale: sc });
              var cv = $('canvas', slides[k - 1]); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
              slides[k - 1].style.aspectRatio = base.width + ' / ' + base.height;
              return page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
            }).then(function () { draw(k + 1); }, function () { draw(k + 1); });
          })(1);
        }).catch(function () { /* PDF 를 열 수 없으면 미리보기를 건너뜁니다 */ });
      });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); } }, { rootMargin: '300px' });
      io.observe(box.parentNode);
    } else start();
  }
  R['bulletin-list'] = function (el) {
    var items = visible(D.bulletins).sort(byDateDesc).map(function (b) { return { title: b.title, date: b.date, link: b.file, category: b.file ? '내려받기' : '준비 중', sample: b.sample }; });
    var limit = +el.getAttribute('data-limit') || 0;   // 메인에서는 최근 몇 건만 (data-limit)
    if (limit) items = items.slice(0, limit);
    mountList(el, items, postRow, { tag: 'ul', wrapClass: 'post-list', pageSize: limit ? 0 : 12, empty: '주보를 준비하고 있습니다.' });
  };

  /* 연도별 주보 (교회소식 > 주보)
     - 올해 주보처럼 data/news.js 에 PDF 로 등록한 것과, 용량 때문에 "글자로만" 보관한 지난 주보(assets/bulletins/archive/index.json)를
       연도 칸(2026 · 2025 · 2024 …)으로 나누어 보여 줍니다. 글자 주보는 누르면 이 페이지 안에서 열립니다 (?id=…).
     - 새 해가 되어 지난해 주보를 글자로 옮길 때: archive 폴더에 그 해의 파일과 index.json 을 다시 만들어 올립니다 (관리자 메모 참고). */
  R['bulletin-years'] = function (el) {
    var LANG = { en: '영문', ru: '러시아어' };
    var rows = {};   // 연도 → [{...postRow 항목, d, l}]
    function put(y, x) { (rows[y] = rows[y] || []).push(x); }
    visible(D.bulletins).forEach(function (b) {
      put(String(b.date || '').slice(0, 4), { title: b.title, date: b.date, link: b.file, category: b.file ? '내려받기' : '준비 중', sample: b.sample, l: 'ko' });
    });
    function draw(archive) {
      (archive || []).forEach(function (yr) {
        (yr.items || []).forEach(function (a) {
          var tag = (LANG[a.l] ? LANG[a.l] + ' · ' : '') + '글자로 보기';
          put(String(yr.y), { title: a.t, date: a.d, link: 'news/bulletin.html?id=' + encodeURIComponent(a.id) + '&year=' + yr.y, category: tag, l: a.l });
        });
      });
      var years = Object.keys(rows).filter(function (y) { return /^\d{4}$/.test(y); }).sort().reverse();
      if (!years.length) { el.innerHTML = '<div class="empty">주보를 준비하고 있습니다.</div>'; return; }
      var order = { ko: 0, en: 1, ru: 2 };
      years.forEach(function (y) { rows[y].sort(function (p, q) { return byDateDesc(p, q) || ((order[p.l] || 0) - (order[q.l] || 0)); }); });
      el.innerHTML = '<div class="tabs by-tabs" role="group" aria-label="연도 선택"></div><div class="by-body"></div>';
      var tabs = $('.by-tabs', el), body = $('.by-body', el);
      tabs.innerHTML = years.map(function (y) { return '<button type="button" class="tab" data-y="' + y + '" aria-pressed="false">' + y + '년 <small>' + rows[y].length + '</small></button>'; }).join('');
      function show(y, keepUrl) {
        $$('.tab', tabs).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-y') === y ? 'true' : 'false'); });
        var html = '', last = '';
        rows[y].forEach(function (x) {
          var m = String(x.date || '').slice(5, 7);
          if (m !== last) { last = m; html += '<li class="by-month" aria-hidden="true">' + (+m || '') + '월</li>'; }
          html += postRow(x);
        });
        body.innerHTML = '<ul class="post-list by-list" aria-label="' + y + '년 주보 목록">' + html + '</ul>';
        if (!keepUrl) { try { var u = new URL(location.href); u.searchParams.set('year', y); u.searchParams.delete('id'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) {} }
      }
      tabs.addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) show(b.getAttribute('data-y')); });
      var want = ''; try { want = new URL(location.href).searchParams.get('year') || ''; } catch (e) {}
      show(years.indexOf(want) >= 0 ? want : years[0], true);
    }
    if (!window.fetch) { draw(null); return; }
    fetch(ROOT + 'assets/bulletins/archive/index.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { draw(j.years); }, function () { draw(null); });
  };

  /* 책 한 권마다 kind: 'pastor'(담임목사 저서, 기본) 또는 'church'(교회출판도서) */
  function booksOf(kind) { return visible(D.books).filter(function (b) { return (b.kind || 'pastor') === kind; }).sort(byDateDesc); }
  /* 메인 BOOKS 칸 한 권: 왼쪽 표지, 오른쪽 제목·글귀 */
  function shelfItem(b) {
    var meta = [b.publisher, b.date ? fmtDate(b.date) : ''].filter(Boolean).join(' · ');
    return '<a class="shelf-item" href="' + esc(link('books/detail.html?id=' + encodeURIComponent(b.id))) + '">' + bookCover(b) +
      '<div class="shelf-item__body">' + (meta ? '<p class="shelf-item__meta">' + esc(meta) + '</p>' : '') +
      '<h4>' + esc(b.title) + '</h4>' + (b.subtitle ? '<p class="shelf-item__sub">' + esc(b.subtitle) + '</p>' : '') +
      (b.oneLine ? '<p class="shelf-item__quote">' + esc(b.oneLine) + '</p>' : '') +
      '<span class="more">자세히 보기 ' + ico('arrow') + '</span></div></a>';
  }
  /* data-kind="pastor" (담임목사 저서) / "church" (교회출판도서). 두 칸 모두 비어 있으면 BOOKS 구역 전체를 숨깁니다. */
  R['book-slider'] = function (el) {
    var kind = el.getAttribute('data-kind') === 'church' ? 'church' : 'pastor', list = booksOf(kind);
    var panel = el.closest('.shelf-panel') || el.parentNode, sec = el.closest('section');
    var btns = $('.slider-btns', panel);
    if (sec && !booksOf('pastor').length && !booksOf('church').length) { sec.classList.add('is-hidden'); return; }
    if (!list.length) {
      el.innerHTML = '<p class="empty shelf-empty">' + (kind === 'church' ? '교회출판도서를 준비하고 있습니다.' : '저서 정보를 준비하고 있습니다.') + '</p>';
      if (btns) btns.classList.add('is-hidden');
      return;
    }
    el.innerHTML = '<div class="shelf-track" tabindex="0" aria-label="' + (kind === 'church' ? '교회출판도서' : '담임목사 저서') + ' 목록">' + list.map(shelfItem).join('') + '</div>';
    var track = $('.shelf-track', el);
    if (btns && list.length < 2) btns.classList.add('is-hidden');
    $$('[data-slide]', panel).forEach(function (b) {
      b.addEventListener('click', function () { track.scrollBy({ left: (+b.getAttribute('data-slide')) * track.clientWidth, behavior: 'smooth' }); });
    });
  };
  /* "서문 중에서" 같은 글귀: 빈 줄 = 문단, 줄바꿈 = 그대로. (영문은 따로 작게, 사34:16 처럼 짧은 출처는 오른쪽으로) */
  function excerptHtml(text, compact) {
    var paras = String(text).split(/\n\s*\n/).map(function (p) {
      var cls = /^[A-Za-z]/.test(p.trim()) ? ' class="ex-en"' : (/^[가-힣]{1,3}\d/.test(p.trim()) && p.trim().length < 14 ? ' class="ex-ref"' : '');
      return '<p' + cls + '>' + p.split('\n').map(esc).join('<br>') + '</p>';
    }).join('');
    return '<blockquote class="excerpt' + (compact ? ' excerpt--compact' : '') + '">' + paras + '</blockquote>';
  }
  R['book-grid'] = function (el) {
    var kind = el.getAttribute('data-kind') === 'church' ? 'church' : 'pastor', list = booksOf(kind);
    if (el.getAttribute('data-layout') === 'rows' && list.length) {   // 책 표지(왼쪽) + 책 속 미리보기(오른쪽, 좌우로 넘겨 보기)
      el.innerHTML = '<div class="book-rows">' + list.map(function (b) {
        var pv = b.previews || [], strip = '';
        if (b.excerpt && b.excerpt.text) {   // "서문 중에서" 글 (궁서체)
          strip = '<div class="book-row__preview book-row__excerpt"><h3 class="excerpt-title">' + esc(b.excerpt.title || '서문 중에서') + '</h3>' + excerptHtml(b.excerpt.text, b.excerpt.compact) + '</div>';
        } else if (pv.length) {
          strip = '<div class="book-row__preview"><div class="rail__head"><h3>책 속으로 미리보기</h3><div class="slider-btns"><button type="button" class="slider-btn" data-strip="-1" aria-label="이전 쪽"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></button><button type="button" class="slider-btn" data-strip="1" aria-label="다음 쪽"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button></div></div>' +
            '<div class="photo-grid book-strip" tabindex="0" aria-label="책 속 미리보기 (좌우로 넘겨 보세요)">' + pv.map(function (p) {
              var f = link(p.img);
              return '<a href="' + esc(f) + '" data-full="' + esc(f) + '" data-caption="' + esc(b.title + (p.caption ? ' · ' + p.caption : '')) + '"><img src="' + esc(f) + '" alt="' + esc(b.title + ' ' + (p.caption || '미리보기')) + '" loading="lazy"><span>' + esc(p.caption || '') + '</span></a>';
            }).join('') + '</div><p class="book-row__hint">사진을 누르면 크게 볼 수 있습니다.</p></div>';
        }
        return '<div class="book-row">' + bookCard(b) + strip + '</div>';
      }).join('') + '</div>';
      $$('[data-strip]', el).forEach(function (btn) {
        btn.addEventListener('click', function () { var tr = $('.book-strip', btn.closest('.book-row__preview')); tr.scrollBy({ left: (+btn.getAttribute('data-strip')) * 480, behavior: 'smooth' }); });
      });
      return;
    }
    mountList(el, list, bookCard, { wrapClass: 'book-grid', empty: kind === 'church' ? '교회출판도서 정보를 준비하고 있습니다.' : '저서 정보를 준비하고 있습니다.' });
  };
  R['book-detail'] = function (el) {
    var id = qs('id'), all = visible(D.books).slice().sort(byDateDesc);
    var b = all.filter(function (x) { return x.id === id; })[0] || (id ? null : booksOf('pastor')[0]);
    if (!b) { notFound(el, '요청하신 도서를 찾을 수 없습니다.', 'books/index.html', '책 목록으로'); return; }
    var kind = (b.kind || 'pastor'), church_ = kind === 'church', books = booksOf(kind);
    var sectionName = church_ ? '교회출판도서' : '담임목사 저서', listPath = church_ ? 'books/church.html' : 'books/index.html';
    document.title = b.title + ' | ' + sectionName + ' | ' + church().name;
    setHero(sectionName, '');
    if (church_) {   // 교회출판도서는 하위 메뉴의 "현재 위치" 표시를 옮깁니다
      $$('.subnav a[aria-current]').forEach(function (a) { a.removeAttribute('aria-current'); });
      var ca = $('.subnav a[href$="books/church.html"]'); if (ca) ca.setAttribute('aria-current', 'page');
    }
    var meta = [];
    if (b.publisher) meta.push(['출판사', b.publisher]);
    if (b.date) meta.push(['출간일', fmtDate(b.date)]);
    if (b.pages) meta.push(['분량', b.pages]);
    var author = b.author || (church_ ? '' : church().pastor + ' ' + church().pastorTitle);
    if (author) meta.push(['저자', author]);
    var buy = (b.buyLinks || []).filter(function (l) { return l && l.url; }).map(function (l) { return '<a class="btn btn--primary" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label || '구매하기') + '</a>'; }).join('');
    if (!buy && showSamples()) buy = '<span class="btn btn--outline" aria-disabled="true">구매 링크 준비 중</span>';
    function block(title, html, hint) { var body = html || placeholder(hint); return body ? '<section class="detail-block"><h2>' + esc(title) + '</h2>' + body + '</section>' : ''; }
    var pastor = (D.people || [])[0] || {};
    var others = books.filter(function (x) { return x.id !== b.id; });
    el.innerHTML = '<div class="book-detail"><div><div class="book-card" style="pointer-events:none">' + bookCover(b) + '</div></div><div>' +
      '<h1>' + esc(b.title) + sampleTag(b) + '</h1>' + (b.subtitle ? '<p class="book-sub">' + esc(b.subtitle) + '</p>' : '') +
      (b.oneLine ? '<p class="lead">' + esc(b.oneLine) + '</p>' : '') +
      '<ul class="meta-list">' + meta.map(function (m) { return '<li><b>' + esc(m[0]) + '</b><span>' + esc(m[1]) + '</span></li>'; }).join('') + '</ul>' +
      (buy ? '<div class="btn-row">' + buy + '</div>' : '') +
      (b.inChurch ? '<p style="margin-top:18px"><strong>교회 비치 안내</strong><br>' + rich(b.inChurch) + '</p>' : '') + '</div></div>' +
      block('책 소개', b.intro ? '<div class="prose">' + rich(b.intro) + '</div>' : '', '책 소개글을 입력하세요. (data/books.js 의 intro)') +
      ((b.excerpt && b.excerpt.text) ? '<section class="detail-block"><h2>' + esc(b.excerpt.title || '서문 중에서') + '</h2>' + excerptHtml(b.excerpt.text, b.excerpt.compact) + '</section>' : '') +
      ((b.previews && b.previews.length) ? '<section class="detail-block"><h2>책 속으로</h2><div class="photo-grid book-previews">' + b.previews.map(function (p) {
        var f = link(p.img);
        return '<a href="' + esc(f) + '" data-full="' + esc(f) + '" data-caption="' + esc(b.title + (p.caption ? ' · ' + p.caption : '')) + '"><img src="' + esc(f) + '" alt="' + esc(b.title + ' ' + (p.caption || '미리보기')) + '" loading="lazy">' + (p.caption ? '<span>' + esc(p.caption) + '</span>' : '') + '</a>';
      }).join('') + '</div></section>' : '') +
      block('목차', (b.toc && b.toc.length) ? '<ol class="toc">' + b.toc.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' : '', '목차를 입력하세요. (data/books.js 의 toc)') +
      block('추천사', (b.endorsements && b.endorsements.length) ? b.endorsements.map(function (e) { return '<blockquote class="quote">' + esc(e.text) + '<cite>' + esc(e.by) + '</cite></blockquote>'; }).join('') : '', '추천사를 입력하세요. (data/books.js 의 endorsements)') +
      (church_ ? '' : block('저자 소개', '<p><strong>' + esc(church().pastor) + ' ' + esc(church().pastorTitle) + '</strong> · ' + esc(church().name) + '</p>' + (pastor.bio ? '<p>' + esc(pastor.bio) + '</p>' : ''), '')) +
      (others.length ? '<section class="detail-block"><h2>' + (church_ ? '다른 교회출판도서 보기' : '다른 저서 보기') + '</h2><div class="book-grid">' + others.map(bookCard).join('') + '</div></section>' : '') +
      '<p style="margin-top:40px"><a class="more-link" href="' + esc(link(listPath)) + '">' + ico('prev') + ' ' + (church_ ? '교회출판도서 목록으로' : '저서 목록으로') + '</a></p>';
  };

  R['dept-grid'] = function (el) {
    var wide = el.getAttribute('data-variant') === 'wide', list = visible(D.departments);
    if (!list.length) { el.innerHTML = '<div class="empty">모임 정보를 준비하고 있습니다.</div>'; return; }
    el.innerHTML = '<div class="' + (wide ? 'card-grid' : 'dept-grid') + '">' + list.map(function (d) {
      var t = deptTimeObj(d), time = deptTime(d), meta;
      if (wide) meta = '<p>' + esc([time, t && t.place].filter(Boolean).join(' · ') || '모임 안내 보기') + '</p>';
      else meta = time ? '<p>' + esc(time) + '</p>' : '';
      return '<a class="dept-card' + (wide ? ' dept-card--wide' : '') + '" href="' + esc(link(deptUrl(d))) + '"><div class="dept-card__icon">' + ico(d.icon || 'users') + '</div><h3>' + esc(d.name) + '</h3>' + meta + '</a>';
    }).join('') + '</div>';
  };
  R['dept-detail'] = function (el) {
    var id = qs('id'), list = visible(D.departments);
    var d = list.filter(function (x) { return x.id === id; })[0] || (id ? null : list[0]);
    if (!d) { notFound(el, '요청하신 모임을 찾을 수 없습니다.', 'next-generation/index.html', '교회학교 목록으로'); return; }
    document.title = d.name + ' | 교회학교 | ' + church().name;
    setHero(d.name, '');
    var t = deptTimeObj(d), rows = [];
    if (deptTime(d)) rows.push(['모임 시간', deptTime(d)]);
    if (t && t.place) rows.push(['장소', t.place]);
    if (d.minister) rows.push(['담당 교역자', d.minister]);
    rows.push(['문의', church().phone]);
    var intro = d.intro ? '<div class="prose">' + rich(d.intro) + '</div>' : placeholder(d.name + ' 소개글을 입력하세요. (data/departments.js 의 intro)');
    el.innerHTML = '<div class="two-col"><div>' + (intro || '<p class="lead">' + esc(d.name) + ' 소개를 준비하고 있습니다.</p>') + '</div>' +
      '<aside class="info-card"><h3>' + ico('clock') + ' 모임 안내</h3><ul class="meta-list">' + rows.map(function (r) { return '<li><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></li>'; }).join('') + '</ul><a class="btn btn--outline btn--sm" href="' + esc(link('worship/guide.html')) + '">전체 예배·모임 시간</a></aside></div>' +
      '<h2 style="margin-top:56px">다른 모임 보기</h2><div class="others"></div>';
    R['dept-grid']($('.others', el));
  };

  R['mission-cards'] = function (el) {
    var latestMode = el.getAttribute('data-variant') === 'latest';
    el.innerHTML = '<div class="mission-grid">' + (D.missionFields || []).map(function (f) {
      var latest = (f.reports || []).slice().sort(byDateDesc)[0];
      var title = latestMode && latest ? latest.title : (f.title || f.name + ' 선교');
      var meta = latestMode ? (latest ? '<time>' + fmtDate(latest.date) + '</time>' : '') : (latest ? '<time>최근 소식 · ' + fmtDate(latest.date) + '</time>' : '');
      var toReport = latestMode && latest;   // 메인: 최신 선교보고 한 건 / 선교 첫 페이지: 선교지 소개
      var path = toReport ? reportPath(f, reportId(latest), fieldType(latest)) : fieldPath(f, 'mission');
      var share = shareBtn({ title: title, sharePath: path, shareTitle: toReport ? f.name + ' 선교 · ' + latest.title : (f.title || f.name + ' 선교'), shareText: toReport ? f.name + ' 선교보고 · ' + fmtDate(latest.date) : (f.summary || '') }, 'row-share--card');
      return '<div class="mission-card-wrap"><a class="mission-card" href="' + esc(link(path)) + '"><span class="badge">' + esc(f.name) + '</span><h3>' + esc(title) + '</h3><p>' + esc(f.summary || '') + '</p>' + meta + '</a>' + share + '</div>';
    }).join('') + '</div>';
  };
  /* 메인 "선교 소식": 선교지 안내 그림(data/missions.js 의 missionVisionImages)을 슬라이드로 넘겨 봅니다.
     그림에 href 가 있으면 눌렀을 때 홈페이지 안의 관련 선교 글로 이동합니다. 5초마다 자동으로 넘어가고, 마우스를 올리거나 만지면 멈춥니다. */
  R['mission-slider'] = function (el) {
    var list = (D.missionVisionImages || []).filter(function (x) { return x && x.img; });
    if (!list.length) { var sec = el.closest('section'); if (sec) sec.classList.add('is-hidden'); return; }
    var arrow = function (d) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (d < 0 ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6') + '"/></svg>'; };
    el.innerHTML = '<div class="msl" role="region" aria-roledescription="carousel" aria-label="선교지 소개 슬라이드">' +
      '<div class="msl-track" tabindex="0">' + list.map(function (x, i) {
        var cap = esc(x.caption || ''), inner = '<span class="msl-img"><img src="' + esc(link(x.img)) + '" alt="' + cap + '" loading="' + (i < 2 ? 'eager' : 'lazy') + '" width="940" height="540"></span><span class="msl-cap"><b>' + cap + '</b>' + (x.href ? '<em>관련 소식 보기 &rarr;</em>' : '') + '</span>';
        return x.href ? '<a class="msl-slide" href="' + esc(link(x.href)) + '" aria-label="' + cap + ' 관련 소식 보기">' + inner + '</a>' : '<div class="msl-slide">' + inner + '</div>';
      }).join('') + '</div>' +
      '<button type="button" class="msl-btn msl-prev" aria-label="이전 슬라이드">' + arrow(-1) + '</button>' +
      '<button type="button" class="msl-btn msl-next" aria-label="다음 슬라이드">' + arrow(1) + '</button>' +
      '<div class="msl-dots" role="group" aria-label="슬라이드 선택">' + list.map(function (x, i) { return '<button type="button" class="msl-dot" data-i="' + i + '" aria-label="' + (i + 1) + '번째 슬라이드"></button>'; }).join('') + '</div></div>';
    var root = $('.msl', el), track = $('.msl-track', el), slides = $$('.msl-slide', el), dots = $$('.msl-dot', el);
    function stepW() { var a = slides[0], b = slides[1]; return b ? b.offsetLeft - a.offsetLeft : a.offsetWidth; }
    function cur() { var w = stepW(); return w ? Math.round(track.scrollLeft / w) : 0; }
    function paint() { var i = cur(); dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); }); }
    function next() { if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) track.scrollTo({ left: 0, behavior: 'smooth' }); else track.scrollBy({ left: stepW(), behavior: 'smooth' }); }
    function prev() { if (track.scrollLeft <= 4) track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' }); else track.scrollBy({ left: -stepW(), behavior: 'smooth' }); }
    $('.msl-next', el).addEventListener('click', next);
    $('.msl-prev', el).addEventListener('click', prev);
    dots.forEach(function (d) { d.addEventListener('click', function () { track.scrollTo({ left: (+d.getAttribute('data-i')) * stepW(), behavior: 'smooth' }); }); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(paint); }, { passive: true });
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); next(); } else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); } });
    window.addEventListener('resize', paint);
    paint();
    var paused = false, reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && slides.length > 1) {
      setInterval(function () {
        if (paused || document.hidden) return;
        var r = root.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) return;   // 화면에 보일 때만 자동으로 넘깁니다
        next();
      }, 5000);
      ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { root.addEventListener(ev, function () { paused = true; }, { passive: true }); });
      ['mouseleave', 'focusout'].forEach(function (ev) { root.addEventListener(ev, function () { paused = false; }); });
      root.addEventListener('touchend', function () { setTimeout(function () { paused = false; }, 6000); }, { passive: true });
    }
  };
  R['mission-field'] = function (el) {
    var id = qs('id') || 'nepal', f = (D.missionFields || []).filter(function (x) { return x.id === id; })[0];
    if (!f) { notFound(el, '요청하신 선교지를 찾을 수 없습니다.', 'mission/index.html', '선교 첫 페이지로'); return; }
    /* type=mission (○○ 선교) / type=construction (○○ 공사). 소식 한 건 한 건에 type: 'construction' 을 적으면 공사 쪽에 나옵니다. */
    var hasBuild = !!f.constructionTitle;   // 공사 갈래가 있는 선교지만 (예: 필리핀 선교센터 공사). 네팔·감비아는 선교 갈래만 있습니다.
    var type = qs('type') === 'construction' && hasBuild ? 'construction' : 'mission', build = type === 'construction';
    var missionTitle = f.title || f.name + ' 선교', buildTitle = f.constructionTitle || f.name + ' 공사';
    var pageTitle = build ? buildTitle : missionTitle;
    document.title = pageTitle + ' | 선교현황 | ' + church().name;
    setHero(pageTitle, (build ? f.constructionSummary : f.summary) || '');
    var other = (D.missionFields || []).filter(function (x) { return x.id !== f.id; })[0];
    var reports = (f.reports || []).filter(function (r) { return fieldType(r) === type; }).map(function (r) {
      var rid = reportId(r);
      return Object.assign({}, r, { id: rid, category: r.category || (build ? '공사 소식' : '선교보고'), sharePath: reportPath(f, rid, type), shareTitle: (build ? buildTitle : f.name + ' 선교') + ' · ' + r.title, shareText: (build ? buildTitle + ' 소식' : f.name + ' 선교보고') + ' · ' + fmtDate(r.date) });
    }).sort(byDateDesc);
    var intro = build ? f.constructionIntro : f.intro;
    el.innerHTML = (intro ? '<div class="prose">' + rich(intro) + '</div>' : placeholder(pageTitle + ' 소개글을 입력하세요. (data/missions.js 의 ' + (build ? 'constructionIntro' : 'intro') + ')')) +
      '<h2 style="margin-top:48px">' + (build ? '공사 소식' : '선교보고') + '</h2><div class="reports"></div>' +
      '<div class="btn-row" style="margin-top:32px">' + (hasBuild ? '<a class="btn btn--outline" href="' + esc(link(fieldPath(f, build ? 'mission' : 'construction'))) + '">' + esc(build ? missionTitle : buildTitle) + ' 보기</a>' : '') +
      (other ? '<a class="btn btn--outline" href="' + esc(link(fieldPath(other, 'mission'))) + '">' + esc(other.name) + ' 선교 보기</a>' : '') +
      '<a class="btn btn--primary" href="' + esc(link('mission/support.html')) + '">' + ico('heart') + ' 선교 후원 안내</a></div>';
    mountList($('.reports', el), reports, postRow, { tag: 'ul', wrapClass: 'post-list', pageSize: 10, empty: build ? '등록된 공사 소식이 없습니다.' : '등록된 선교보고가 없습니다.' });
  };
  R['mission-support'] = function (el) {
    var s = D.missionSupport || {}, c = church();
    var methods = (s.methods || []).filter(function (m) { return m && m.value; });
    el.innerHTML = '<div class="two-col"><div>' +
      (s.intro ? '<div class="prose">' + rich(s.intro) + '</div>' : '<p class="lead">선교 후원 안내를 준비하고 있습니다. 후원에 관한 문의는 교회로 연락해 주세요.</p>') +
      '</div><aside class="info-card"><h3>' + ico('heart') + ' 후원 방법</h3>' +
      (methods.length ? '<ul class="meta-list">' + methods.map(function (m) { return '<li><b>' + esc(m.label) + '</b><span>' + esc(m.value) + '</span></li>'; }).join('') + '</ul>' : '<p>후원 방법은 준비 중입니다.</p>') +
      '<p style="margin-top:12px"><strong>문의</strong><br>' + (s.contact ? esc(s.contact) + '<br>' : '') + '<a href="' + telHref(c.phone) + '">' + esc(c.phone) + '</a></p></aside></div>';
  };

  /* 메인의 "행사 사진": 사진이 올라온 행사의 첫 사진을 최신순으로 보여 줍니다. 사진이 올라온 행사가 없으면 이 구역은 숨겨집니다. */
  R.gallery = function (el) {
    var list = [], limit = +el.getAttribute('data-limit') || 0, cat = el.getAttribute('data-category'), emptyMsg = el.getAttribute('data-empty');
    visible(D.events).slice().sort(byDateDesc).forEach(function (ev) {
      var pn = photoNames(ev);
      if (cat && ev.category !== cat) return;   // data-category="교회행사" / "선교행사" 로 나눠 보여 줍니다
      if (pn.length && ev.id) list.push({ img: eventFile(ev, pn[0]), title: ev.title, date: ev.date, href: eventPage(ev) + '#' + ev.id });
    });
    if (limit) list = list.slice(0, limit);
    if (!list.length) {
      if (emptyMsg) { el.innerHTML = '<div class="empty">' + esc(emptyMsg) + '</div>'; return; }   // 안내 문구가 있으면 구역은 그대로 두고 문구만 보여 줌
      var sec = el.closest('section'); if (sec) sec.classList.add('is-hidden'); return;
    }
    mountList(el, list, galleryItem, { wrapClass: 'gallery' });
  };

  R['pastor-photo'] = function (el) {
    var p = (D.people || [])[0] || {};
    el.innerHTML = p.photo ? '<img src="' + esc(link(p.photo)) + '" alt="' + esc(church().pastor + ' ' + church().pastorTitle) + '">' : '<span>' + ico('users') + '사진 준비 중</span>';
  };
  R.people = function (el) {
    var list = visible(D.people), groups = [], map = {};
    list.forEach(function (p) { var g = p.group || p.role || '섬기는 분들'; if (!map[g]) { map[g] = []; groups.push(g); } map[g].push(p); });
    el.innerHTML = groups.map(function (g) {
      return '<section class="people-group"><h2 class="group-title">' + esc(g) + '</h2><div class="people-grid">' + map[g].map(function (p) {
        var ini = String(p.name || '').replace(/[^가-힣A-Za-z]/g, '').charAt(0) || '+';
        return '<figure class="person"><div class="person__photo">' + (p.photo ? '<img src="' + esc(link(p.photo)) + '" alt="' + esc(p.name + ' ' + p.role) + '" loading="lazy">' : '<span aria-hidden="true">' + esc(ini) + '</span>') + '</div><figcaption><h3>' + esc(p.name) + '</h3><p>' + esc(p.role) + sampleTag(p) + '</p>' + (p.bio ? '<p class="person__bio">' + esc(p.bio) + '</p>' : '') + '</figcaption></figure>';
      }).join('') + '</div></section>';
    }).join('');
  };
  R.timeline = function (el) {
    /* 연혁: 연도마다 items: ['04 내용', '12 내용'] (앞의 두 자리는 월). 예전 방식 { year, text } 도 됩니다. */
    var list = visible(D.history).slice().sort(function (a, b) { return String(a.year).localeCompare(String(b.year)); });
    if (!list.length) { el.innerHTML = '<div class="empty">연혁을 준비하고 있습니다.</div>'; return; }
    function line(s) { var m = /^(\d{2})\s+(.*)$/.exec(s); return m ? '<span class="tl-m">' + (+m[1]) + '월</span><span class="tl-t">' + esc(m[2]) + '</span>' : '<span class="tl-m"></span><span class="tl-t">' + esc(s) + '</span>'; }
    var decades = [], seen = {};
    var rows = list.map(function (h) {
      var dec = String(h.year).slice(0, 3) + '0', id = '';
      if (/^\d{4}$/.test(String(h.year)) && !seen[dec]) { seen[dec] = 1; decades.push(dec); id = ' id="dec-' + dec + '"'; }
      var body = h.items ? '<ul class="tl-lines">' + h.items.map(function (s) { return '<li>' + line(s) + '</li>'; }).join('') + '</ul>' : '<span class="tl-text">' + esc(h.text || '') + '</span>';
      return '<li' + id + '><b>' + esc(h.year) + sampleTag(h) + '</b>' + body + '</li>';
    }).join('');
    el.innerHTML = (decades.length > 1 ? '<nav class="fac-nav tl-nav" aria-label="연대 바로가기">' + decades.map(function (d) { return '<a href="#dec-' + d + '">' + d + '년대</a>'; }).join('') + '</nav>' : '') + '<ol class="timeline">' + rows + '</ol>';
  };
  /* 시설안내: 층 바로가기 + 층별 사진 모음 (사진을 누르면 크게 보기) */
  R.facilities = function (el) {
    var list = D.facilities || [], dir = D.facilitiesDir || 'assets/img/facilities/';
    el.innerHTML = '<nav class="fac-nav" aria-label="층 바로가기">' + list.map(function (f) { return '<a href="#fac-' + esc(f.id) + '">' + esc(f.floor) + '</a>'; }).join('') + '</nav>' +
      list.map(function (f) {
        var ph = f.photos || [];
        return '<section class="fac' + (ph.length === 1 ? ' fac--one' : '') + '" id="fac-' + esc(f.id) + '"><div class="fac__head"><span class="fac__floor">' + esc(f.floor) + '</span><h2>' + esc(f.title) + '</h2></div>' +
          (f.desc ? '<p class="fac__desc">' + esc(f.desc) + '</p>' : '') +
          (ph.length ? '<div class="photo-grid">' + ph.map(function (p) {
            return '<a href="' + esc(link(dir + p.file)) + '" data-full="' + esc(link(dir + p.file)) + '" data-caption="' + esc(f.floor + ' ' + p.caption) + '"><img src="' + esc(link(dir + 'thumb/' + p.file)) + '" alt="' + esc(f.floor + ' ' + p.caption) + '" loading="lazy" width="640" height="480"><span>' + esc(p.caption) + '</span></a>';
          }).join('') + '</div>' : '') + '</section>';
      }).join('');
  };

  /* 사진 크게 보기: 사진 묶음(.photo-grid) 안의 a[data-full] 을 누르면 같은 묶음을 넘겨 가며 볼 수 있습니다 (← → 키, Esc 지원) */
  var lbEl, lbItems = [], lbIndex = 0, lbOpener = null;
  function lbBuild() {
    lbEl = document.createElement('div');
    lbEl.className = 'lightbox'; lbEl.setAttribute('role', 'dialog'); lbEl.setAttribute('aria-modal', 'true'); lbEl.setAttribute('aria-label', '사진 크게 보기');
    lbEl.innerHTML = '<button type="button" class="lb-btn lb-close" aria-label="닫기">' + ico('close') + '</button>' +
      '<button type="button" class="lb-btn lb-prev" aria-label="이전 사진">' + ico('prev') + '</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="lb-btn lb-next" aria-label="다음 사진">' + ico('next') + '</button>';
    document.body.appendChild(lbEl);
    lbEl.addEventListener('click', function (e) {
      if (e.target.closest('.lb-close') || e.target === lbEl) lbClose();
      else if (e.target.closest('.lb-prev')) lbShow(lbIndex - 1);
      else if (e.target.closest('.lb-next')) lbShow(lbIndex + 1);
    });
    document.addEventListener('keydown', function (e) {
      if (!lbEl.classList.contains('is-open')) return;
      if (e.key === 'Escape') lbClose(); else if (e.key === 'ArrowLeft') lbShow(lbIndex - 1); else if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
    });
  }
  function lbShow(i) {
    if (!lbItems.length) return;
    lbIndex = (i + lbItems.length) % lbItems.length;
    var a = lbItems[lbIndex];
    $('img', lbEl).src = a.getAttribute('data-full'); $('img', lbEl).alt = a.getAttribute('data-caption') || '';
    $('figcaption', lbEl).textContent = (a.getAttribute('data-caption') || '') + '  ·  ' + (lbIndex + 1) + ' / ' + lbItems.length;
    var nx = new Image(); nx.src = lbItems[(lbIndex + 1) % lbItems.length].getAttribute('data-full');   // 다음 사진 미리 불러오기
    var multi = lbItems.length > 1; $('.lb-prev', lbEl).style.display = multi ? '' : 'none'; $('.lb-next', lbEl).style.display = multi ? '' : 'none';
  }
  function lbOpen(items, i, opener) {
    if (!lbEl) lbBuild();
    lbItems = items; lbOpener = opener; lbEl.classList.add('is-open'); document.body.classList.add('menu-open'); lbShow(i); $('.lb-close', lbEl).focus();
  }
  function lbClose() { lbEl.classList.remove('is-open'); document.body.classList.remove('menu-open'); if (lbOpener) lbOpener.focus(); }
  /* ---- 영상 재생창 ----
     설교·3분 묵상·쇼츠·행사 영상처럼 유튜브 주소(watch?v=… / shorts/…)로 걸린 링크를 누르면, 유튜브로 넘어가지 않고
     이 페이지 위에서 바로 재생합니다. 재생창 안의 "유튜브에서 보기" 버튼으로 유튜브에서 열 수 있습니다.
     (Ctrl·⌘·Shift 를 누른 채 클릭하거나 가운데 버튼으로 누르면 평소처럼 새 탭에서 유튜브가 열립니다.) */
  function setupVideoModal() {
    var box = document.createElement('div');
    box.className = 'vm'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '영상 재생');
    box.innerHTML = '<div class="vm__panel"><button type="button" class="vm__close" aria-label="닫기">' + ico('close') + '</button>' +
      '<div class="vm__frame"></div><div class="vm__bar"><span class="vm__title"></span><a class="btn btn--light btn--sm vm__yt" target="_blank" rel="noopener">유튜브에서 보기</a></div></div>';
    document.body.appendChild(box);
    var frame = $('.vm__frame', box), titleEl = $('.vm__title', box), ytBtn = $('.vm__yt', box), opener = null;
    function open(src, ytUrl, title, isShort, trigger) {
      opener = trigger || null;
      document.dispatchEvent(new CustomEvent('kosin:video-open'));   // 찬양 플레이어가 켜져 있으면 소리가 겹치지 않게 끕니다
      box.classList.toggle('is-short', !!isShort);
      frame.innerHTML = '<iframe src="' + src + '" title="' + esc(title || '영상') + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
      titleEl.textContent = title || '';
      ytBtn.href = ytUrl;
      box.hidden = false; document.documentElement.classList.add('vm-open');
      $('.vm__close', box).focus();
    }
    function close() {
      if (box.hidden) return;
      box.hidden = true; frame.innerHTML = ''; document.documentElement.classList.remove('vm-open');
      if (opener && opener.focus) { try { opener.focus(); } catch (e) {} }
    }
    box.addEventListener('click', function (e) { if (e.target === box || e.target.closest('.vm__close')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.closest('.vm')) return;
      var href = a.getAttribute('href') || '', YT = '^https?:\\/\\/(?:www\\.)?youtube\\.com\\/';
      var m = href.match(new RegExp(YT + '(watch\\?v=|shorts\\/)([A-Za-z0-9_-]{11})'));                       // 영상 1개
      var pl = !m && href.match(new RegExp(YT + 'playlist\\?list=([A-Za-z0-9_-]+)'));                       // 재생목록 전체
      var many = !m && !pl && href.match(new RegExp(YT + 'watch_videos\\?video_ids=([A-Za-z0-9_,-]+)'));   // 여러 영상을 이어서 재생 (성경 통독)
      if (!m && !pl && !many) return;
      e.preventDefault();
      var t = a.querySelector('h3, strong, .short-card__title, .post-title') || a.querySelector('span');
      var title = a.getAttribute('data-vt') || (t ? t.textContent.trim() : (a.getAttribute('aria-label') || '').replace(/\s*(영상 보기|·).*$/, ''));
      var tail = '?autoplay=1&rel=0&playsinline=1', base = 'https://www.youtube-nocookie.com/embed/';
      if (m) {
        open(base + encodeURIComponent(m[2]) + tail, (m[1] === 'shorts/' ? 'https://www.youtube.com/shorts/' : 'https://www.youtube.com/watch?v=') + encodeURIComponent(m[2]), title, m[1] === 'shorts/', a);
      } else if (pl) {
        open(base + 'videoseries?list=' + encodeURIComponent(pl[1]) + '&autoplay=1&rel=0&playsinline=1', 'https://www.youtube.com/playlist?list=' + encodeURIComponent(pl[1]), title, false, a);
      } else {
        var ids = many[1].split(',').filter(function (x) { return /^[A-Za-z0-9_-]{11}$/.test(x); });
        if (!ids.length) return;
        // 유튜브는 playlist 값을 "전체 목록"으로 취급하므로 첫 영상도 함께 넣어야 순서대로 재생됩니다
        open(base + ids[0] + tail + (ids.length > 1 ? '&playlist=' + ids.join(',') : ''), 'https://www.youtube.com/watch_videos?video_ids=' + ids.join(','), title, false, a);
      }
    });
  }
  function setupLightbox() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('.photo-grid a[data-full]'); if (!a) return;
      e.preventDefault();
      var group = $$('a[data-full]', a.closest('.photo-grid'));
      lbOpen(group, group.indexOf(a), a);
    });
  }
  R.faq = function (el) {
    var list = visible(D.faq);
    el.innerHTML = '<div class="faq">' + list.map(function (f) {
      return '<details><summary><span>' + esc(tokens(f.q)) + sampleTag(f) + '</span>' + ico('chevron') + '</summary><div class="faq__a"><p>' + rich(f.a) + '</p></div></details>';
    }).join('') + '</div>';
  };
  R.steps = function (el) {
    var light = el.getAttribute('data-variant') === 'light';
    el.innerHTML = '<ol class="steps' + (light ? ' steps--light' : '') + '">' + (D.newcomerSteps || []).map(function (s) {
      return '<li><strong>' + esc(s.title) + '</strong><span>' + esc(tokens(s.text)) + '</span></li>';
    }).join('') + '</ol>';
  };

  /* ---- 공유하기: 카카오톡 · 링크 복사 · 다른 앱으로 공유 ----
     페이지 어디든 <div data-render="share"></div> 를 넣으면 나타납니다. (선교 페이지에 들어 있음)
     - 카카오톡: data/church.js 에 kakaoJsKey 가 있으면 카카오 공유 카드로, 없으면 휴대폰 공유 창(카카오톡 선택) 또는 링크 복사로 동작
     - 공유되는 주소는 지금 보고 있는 페이지 주소입니다 (예: 네팔 선교 페이지를 보다가 누르면 네팔 선교 페이지 주소) */
  function copyText(text, done) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta); done(ok);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    else fallback();
  }
  function loadKakao(key, cb) {
    if (window.Kakao && window.Kakao.isInitialized && window.Kakao.isInitialized()) { cb(true); return; }
    var s = document.createElement('script');
    s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';   // 버전은 카카오 개발자 문서에서 최신 안정 버전을 확인해 바꿀 수 있습니다
    s.crossOrigin = 'anonymous';
    s.onload = function () { try { if (!window.Kakao.isInitialized()) window.Kakao.init(key); cb(true); } catch (e) { cb(false); } };
    s.onerror = function () { cb(false); };
    document.head.appendChild(s);
  }
  /* 공유 동작 하나를 페이지 공유 바와 항목별 공유 버튼이 함께 씁니다.
     kind: 'kakao' | 'copy' | 'native' / d: { title, text, url } / say: 결과 문구를 보여 주는 함수 */
  function shareAction(kind, d, say) {
    var c = church(), canNative = !!navigator.share;
    function copy(msg) { copyText(d.url, function (ok) { say(ok ? msg : '복사하지 못했습니다. 주소창의 주소를 직접 복사해 주세요.'); }); }
    function nativeShare() { navigator.share({ title: d.title, text: d.text, url: d.url }).catch(function () {}); }
    function fallback() { if (canNative) nativeShare(); else copy('링크를 복사했습니다. 카카오톡 대화창에 붙여넣어 보내세요.'); }
    if (kind === 'copy') { copy('링크를 복사했습니다. 카카오톡 등 원하는 곳에 붙여넣어 보내세요.'); return; }
    if (kind === 'native') { nativeShare(); return; }
    if (!c.kakaoJsKey) { fallback(); return; }
    loadKakao(c.kakaoJsKey, function (ok) {
      if (!ok) { fallback(); return; }
      try {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: { title: d.title, description: d.text, imageUrl: c.shareImage || new URL(ROOT + 'assets/img/og-share.jpg', location.href).href, link: { mobileWebUrl: d.url, webUrl: d.url } },
          buttons: [{ title: '자세히 보기', link: { mobileWebUrl: d.url, webUrl: d.url } }]
        });
      } catch (err) { fallback(); }
    });
  }
  var toastEl, toastTimer;
  function ensureToast() {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.appendChild(toastEl); }
    return toastEl;
  }
  function toast(msg) {
    var t = ensureToast(); t.textContent = msg; t.classList.add('is-show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 4200);
  }
  /* 목록·카드 안의 항목별 "카카오톡 공유" 버튼 (선교보고, 선교행사, 선교지 카드) */
  function setupItemShare() {
    ensureToast();
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-share-item]'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      shareAction('kakao', {
        title: b.getAttribute('data-title') + ' | ' + (church().name || ''),
        text: b.getAttribute('data-text') || (church().name || ''),
        url: new URL(ROOT + b.getAttribute('data-path'), location.href).href
      }, toast);
    });
  }
  /* 공유받은 주소(#항목id)로 들어오면 그 항목으로 이동해서 강조합니다 */
  function revealTarget() {
    $$('.post-list > li.is-target').forEach(function (n) { n.classList.remove('is-target'); });
    var id = ''; try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
    if (!id) return;
    var el = document.getElementById(id), guard = 0, more;
    while (!el && guard++ < 30 && (more = $('.load-more button'))) { more.click(); el = document.getElementById(id); }   // "더 보기" 뒤에 숨어 있으면 펼침
    if (!el) {   // 예전 주소(news/events.html#선교행사id)로 들어왔으면 선교 행사 페이지로 보내 줍니다
      var ev = (D.events || []).filter(function (x) { return x.id === id; })[0];
      if (ev && /news\/events\.html$/.test(location.pathname) && eventPage(ev) !== 'news/events.html') { location.replace(link(eventPage(ev)) + location.hash); }
      return;
    }
    if (!el.matches('.post-list > li')) return;
    el.classList.add('is-target');
    var det = $('details', el); if (det) det.open = true;
    setTimeout(function () { el.scrollIntoView({ block: 'center' }); }, 60);
  }

  R.share = function (el) {
    var c = church(), h1 = $('.page-hero h1'), leadEl = $('.page-hero__lead');
    var data = {
      title: (el.getAttribute('data-title') || (h1 ? h1.textContent : document.title)) + ' | ' + (c.name || ''),
      text: el.getAttribute('data-text') || (leadEl ? leadEl.textContent : '') || ((c.name || '') + ' 소식'),
      url: location.href.split('#')[0]
    };
    var canNative = !!navigator.share;
    el.innerHTML = '<div class="share" role="group" aria-label="공유하기"><span class="share__label">' + ico('share') + ' 이 소식 공유하기</span>' +
      '<button type="button" class="btn btn--kakao btn--sm" data-share="kakao">' + ico('chat') + ' 카카오톡으로 공유</button>' +
      '<button type="button" class="btn btn--outline btn--sm" data-share="copy">' + ico('link') + ' 링크 복사</button>' +
      (canNative ? '<button type="button" class="btn btn--outline btn--sm" data-share="native">' + ico('share') + ' 다른 앱으로 공유</button>' : '') +
      '<p class="share__status" role="status" aria-live="polite"></p></div>';
    var status = $('.share__status', el);
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-share]'); if (!b) return;
      shareAction(b.getAttribute('data-share'), data, function (msg) { status.textContent = msg; });
    });
  };

  R['contact-info'] = function (el) {
    var c = church();
    el.innerHTML = '<ul class="contact-lines">' +
      '<li>' + ico('pin') + '<span>(' + esc(c.zip) + ') ' + esc(c.address) + '</span></li>' +
      '<li>' + ico('phone') + '<span>전화 <a href="' + telHref(c.phone) + '">' + esc(c.phone) + '</a></span></li>' +
      '<li>' + ico('fax') + '<span>팩스 ' + esc(c.fax) + '</span></li>' +
      (c.email ? '<li>' + ico('mail') + '<span><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></span></li>' : '') +
      (c.youtube ? '<li>' + ico('play') + '<span><a href="' + esc(c.youtube) + '" target="_blank" rel="noopener">유튜브 채널</a></span></li>' : '') + '</ul>';
  };
  R['map-links'] = function (el) {
    var m = mapLinks();
    el.innerHTML = '<div class="btn-row"><a class="btn btn--primary" href="' + m.kakao + '" target="_blank" rel="noopener">' + ico('pin') + ' 카카오맵 길찾기</a><a class="btn btn--outline" href="' + m.naver + '" target="_blank" rel="noopener">네이버지도</a><a class="btn btn--outline" href="' + m.google + '" target="_blank" rel="noopener">구글지도</a>' +
      (m.roadview ? '<a class="btn btn--outline" href="' + esc(m.roadview) + '" target="_blank" rel="noopener">' + ico('eye') + ' 로드뷰로 보기</a>' : '') +
      '<a class="btn btn--outline" href="' + telHref(church().phone) + '">' + ico('phone') + ' 전화하기</a></div>';
  };
  R['map-embed'] = function (el) {
    el.innerHTML = '<iframe class="map-embed" title="' + esc(church().name) + ' 위치 지도" src="' + mapLinks().embed + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
  };

  R['contact-form'] = function (el) {
    var c = church();
    el.innerHTML = '<form class="form" id="contactForm">' +
      '<div class="field"><label for="cf-name">이름 <span class="req">*</span></label><input type="text" id="cf-name" name="name" required autocomplete="name"></div>' +
      '<div class="field"><label for="cf-tel">연락처 <span class="req">*</span></label><input type="tel" id="cf-tel" name="phone" required autocomplete="tel" placeholder="010-0000-0000"></div>' +
      '<div class="field"><label for="cf-type">문의 종류</label><select id="cf-type" name="type"><option>새가족 · 방문 문의</option><option>예배 · 모임 문의</option><option>선교 · 후원 문의</option><option>기타</option></select></div>' +
      '<div class="field"><label for="cf-msg">문의 내용 <span class="req">*</span></label><textarea id="cf-msg" name="message" required></textarea></div>' +
      '<input class="hp" type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="privacy-box"><p><strong>개인정보 수집·이용 안내</strong></p><p>수집 항목: 이름, 연락처, 문의 내용 / 이용 목적: 문의 응대 / 보유 기간: 문의 응대 완료 후 지체 없이 파기</p></div>' +
      '<label class="check"><input type="checkbox" name="agree" required><span>개인정보 수집·이용에 동의합니다. <span class="req">*</span></span></label>' +
      '<div class="form-status" id="cfStatus" role="status" hidden></div>' +
      '<button type="submit" class="btn btn--primary">문의 보내기</button></form>';
    var form = $('#contactForm', el), status = $('#cfStatus', el);
    function say(msg, ok) { status.hidden = false; status.className = 'form-status ' + (ok ? 'form-status--ok' : 'form-status--err'); status.textContent = msg; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (form.elements._gotcha.value) { say('문의가 접수되었습니다.', true); form.reset(); return; }   // 스팸 방지 함정 입력란
      if (!c.formEndpoint) { say('문의 접수 기능이 아직 연결되지 않았습니다. 불편을 드려 죄송합니다. 전화(' + c.phone + ')로 문의해 주세요.', false); return; }
      var btn = $('button[type=submit]', form); btn.disabled = true;
      fetch(c.formEndpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); say('문의가 접수되었습니다. 확인 후 연락드리겠습니다.', true); form.reset(); })
        .catch(function () { say('전송에 실패했습니다. 잠시 후 다시 시도하시거나 전화(' + c.phone + ')로 문의해 주세요.', false); })
        .then(function () { btn.disabled = false; });
    });
  };

  /* 찬양 듣기: 왼쪽 아래 버튼을 눌러야 유튜브 영상이 재생됩니다 (data/music.js). 닫으면 음악도 꺼집니다. */
  R['music-player'] = function (el) {
    var m = D.music || {}, tracks = (m.tracks || []).filter(function (t) { return t && /^[\w-]{11}$/.test(t.id || ''); });
    if (m.enabled === false || !tracks.length) { el.classList.add('is-hidden'); return; }
    var cur = 0, isOpen = false;
    var NOTE = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>';
    el.innerHTML = '<div class="mp">' +
      '<button type="button" class="mp-fab" aria-expanded="false" aria-controls="mp-panel">' + NOTE + '<span>찬양 듣기</span></button>' +
      '<section class="mp-panel" id="mp-panel" hidden aria-label="' + esc(m.label || '찬양 듣기') + '">' +
        '<div class="mp-video"></div>' +
        '<div class="mp-more" hidden><ul class="mp-tracks">' + tracks.map(function (t, i) {
          return '<li><button type="button" data-i="' + i + '"' + (i === 0 ? ' aria-current="true"' : '') + '><span class="mp-t">' + esc(t.title || '') + '</span><small>' + esc([t.channel, t.note].filter(Boolean).join(' · ')) + '</small></button></li>';
        }).join('') + '</ul>' +
        '<p class="mp-note">유튜브 영상으로 재생됩니다. 광고를 켜 둔 곡은 처음에 광고가 나올 수 있습니다. 닫으면 음악이 꺼집니다.</p></div>' +
        '<div class="mp-foot"><button type="button" class="mp-toggle" aria-expanded="false">곡 목록 &#9662;</button><button type="button" class="mp-skip">오늘 하루 열지 않기</button><button type="button" class="mp-close" aria-label="닫기 (음악이 꺼집니다)" title="닫기 (음악이 꺼집니다)">&times;</button></div>' +
      '</section></div>';
    var fab = $('.mp-fab', el), panel = $('.mp-panel', el), box = $('.mp-video', el), btns = $$('.mp-tracks button', el);
    function load() {   // 버튼을 누른 직후에만 불러오므로 소리 자동재생 제한에 걸리지 않습니다
      var t = tracks[cur];
      box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + t.id + '?autoplay=1&rel=0&playsinline=1" title="' + esc(t.title || '찬양') + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
      btns.forEach(function (b, i) { if (i === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    }
    function poster() {   // 자동으로 뜰 때는 소리를 내지 않고 재생 버튼만 보여 줍니다 (브라우저가 자동 소리 재생을 막기 때문)
      var t = tracks[cur];
      box.innerHTML = '<button type="button" class="mp-poster" aria-label="' + esc((t.title || '찬양') + ' 재생') + '"><img src="https://i.ytimg.com/vi/' + t.id + '/hqdefault.jpg" alt="">' +
        '<span class="mp-play"><i>' + ico('play') + '</i><b>찬양 들으며 시작하기</b></span></button>';
    }
    function setOpen(v, popup) {
      isOpen = v; panel.hidden = !v; fab.setAttribute('aria-expanded', v ? 'true' : 'false'); fab.classList.toggle('is-on', v); panel.classList.toggle('is-popup', !!(v && popup));
      if (!v) box.innerHTML = ''; else if (popup) poster(); else load();
    }
    box.addEventListener('click', function (e) { if (e.target.closest('.mp-poster')) load(); });
    fab.addEventListener('click', function () { setOpen(!isOpen); });
    $('.mp-close', el).addEventListener('click', function () { setOpen(false); fab.focus(); });
    $('.mp-skip', el).addEventListener('click', function () { try { localStorage.setItem('kosin-music-skip', new Date().toDateString()); } catch (e) {} setOpen(false); });
    var more = $('.mp-more', el), tg = $('.mp-toggle', el);   // 곡 목록·안내는 평소에 접어 두어 화면을 덜 가립니다
    function setMore(v) { more.hidden = !v; tg.setAttribute('aria-expanded', v ? 'true' : 'false'); tg.innerHTML = v ? '곡 목록 &#9652;' : '곡 목록 &#9662;'; }
    tg.addEventListener('click', function () { setMore(more.hidden); });
    btns.forEach(function (b) { b.addEventListener('click', function () { cur = +b.getAttribute('data-i'); load(); setMore(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) setOpen(false); });
    document.addEventListener('kosin:video-open', function () { if (isOpen) setOpen(false); });   // 설교 등 영상을 재생하면 찬양은 꺼서 소리가 겹치지 않게 합니다
    /* 홈에 들어오면 팝업처럼 자동으로 한 번 띄웁니다 (같은 방문 중에는 다시 뜨지 않고, "오늘 하루 열지 않기"를 누르면 그날은 뜨지 않음) */
    var skipToday = false, seen = false;
    try { skipToday = localStorage.getItem('kosin-music-skip') === new Date().toDateString(); seen = sessionStorage.getItem('kosin-music-seen') === '1'; } catch (e) {}
    if (m.autoOpen !== false && !skipToday && !seen) {
      setTimeout(function () {
        if (isOpen) return;
        function openIt() { if (isOpen) return; setOpen(true, true); try { sessionStorage.setItem('kosin-music-seen', '1'); } catch (e) {} }
        // 실시간 통역 안내 팝업이 떠 있으면 두 팝업이 겹치지 않게, 그 팝업을 닫은 뒤에 찬양 팝업을 띄웁니다
        if (D._noticeOpen) { document.addEventListener('kosin:notice-closed', function () { setTimeout(openIt, 350); }, { once: true }); return; }
        openIt();
      }, 900);
    }
  };

  /* 실시간 통역 안내 팝업 (홈): 라이브 방송을 볼 때 AI 실시간 통역(Anna Live)을 쓰도록 안내합니다. (설정: data/church.js 의 interpreter)
     같은 방문 중에는 다시 뜨지 않고, "오늘 하루 열지 않기"를 누르면 그날은 뜨지 않습니다. 팝업을 닫으면 찬양 듣기 팝업이 이어서 뜹니다. */
  R['live-notice'] = function (el) {
    var cfg = church().interpreter || {};
    if (cfg.enabled === false || !/^https:\/\//.test(cfg.url || '')) return;
    var ch = cfg.channel || '', skip = false, seen = false, prev = null;
    try { skip = localStorage.getItem('kosin-live-skip') === new Date().toDateString(); seen = sessionStorage.getItem('kosin-live-seen') === '1'; } catch (e) {}
    el.innerHTML = '<div class="ln" hidden role="dialog" aria-modal="true" aria-labelledby="ln-title"><div class="ln__panel">' +
      '<button type="button" class="ln__x" aria-label="닫기">&times;</button>' +
      '<div class="ln__top"><span class="ln__live"><i></i>LIVE</span><h2 id="ln-title">실시간 통역 안내</h2>' +
        '<p>라이브 방송(예배 실황)을 보실 때, AI 실시간 통역으로 <strong>내 언어로 들으실 수</strong> 있습니다.</p></div>' +
      '<ul class="ln__langs" aria-label="제공 언어"><li lang="en">English</li><li lang="ru">Русский</li><li lang="ja">日本語</li><li lang="zh">中文</li><li class="is-more">그 밖의 여러 언어</li></ul>' +
      '<ol class="ln__steps">' +
        '<li>휴대폰의 <b>무음(진동) 스위치를 꺼</b> 주세요. 무음이면 소리가 나오지 않습니다.</li>' +
        '<li>잘 들리도록 <b>이어폰</b>을 사용해 주세요.</li>' +
        '<li>아래 <b>‘통역 듣기’</b>를 눌러 이동한 뒤 <b>채널 ID</b>를 넣고 <b>‘Join as Listener’</b>를 누르세요. 다음 화면에서 <b>‘Enable Audio’</b> 버튼을 눌러야 소리가 나옵니다.</li>' +
      '</ol>' +
      (ch ? '<div class="ln__channel"><span>채널 ID</span><b>' + esc(ch) + '</b><button type="button" class="ln__copy" aria-label="채널 ID 복사">복사</button></div>' : '') +
      '<a class="btn btn--primary ln__go" href="' + esc(cfg.url) + '" target="_blank" rel="noopener">' + ico('play') + ' 통역 듣기</a>' +
      '<div class="ln__foot"><button type="button" class="ln__skip">오늘 하루 열지 않기</button><button type="button" class="ln__close">닫기</button></div>' +
      '<p class="ln__tag" lang="en">Live interpretation &middot; <span lang="ru">Живой перевод</span> &middot; <span lang="ja">同時通訳</span> &middot; <span lang="zh">实时翻译</span></p>' +
    '</div></div>';
    var box = $('.ln', el), panel = $('.ln__panel', el);
    function focusables() { return $$('button, a[href]', panel).filter(function (x) { return !x.disabled && x.offsetParent !== null; }); }
    function open() {
      if (!box.hidden) return;
      prev = document.activeElement; box.hidden = false; document.documentElement.classList.add('ln-open');
      try { sessionStorage.setItem('kosin-live-seen', '1'); } catch (e) {}
      var go = $('.ln__go', el); if (go) go.focus({ preventScroll: true });
    }
    function close() {
      if (box.hidden) return;
      box.hidden = true; document.documentElement.classList.remove('ln-open'); D._noticeOpen = false;
      if (prev && prev.focus) { try { prev.focus({ preventScroll: true }); } catch (e) {} }
      document.dispatchEvent(new CustomEvent('kosin:notice-closed'));
    }
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    $('.ln__x', el).addEventListener('click', close); $('.ln__close', el).addEventListener('click', close);
    $('.ln__skip', el).addEventListener('click', function () { try { localStorage.setItem('kosin-live-skip', new Date().toDateString()); } catch (e) {} close(); });
    $('.ln__go', el).addEventListener('click', function () { setTimeout(close, 150); });
    var cp = $('.ln__copy', el);
    if (cp) cp.addEventListener('click', function () {
      function done(ok) { cp.textContent = ok ? '복사됨 ✓' : '직접 입력'; setTimeout(function () { cp.textContent = '복사'; }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ch).then(function () { done(true); }, function () { done(false); });
      else { var t = document.createElement('textarea'); t.value = ch; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} document.body.removeChild(t); done(ok); }
    });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') { var f = focusables(); if (!f.length) return; var first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    });
    document.addEventListener('kosin:video-open', close);   // 영상을 틀면 안내 팝업은 닫습니다
    if (cfg.autoOpen !== false && !skip && !seen) { D._noticeOpen = true; setTimeout(open, 450); }
  };

  /* ---------------------------------------------------------------- 시작 */
  /* 유튜브 새 영상 자동 반영: data/youtube.js (GitHub Actions 가 몇 시간마다 채널의 새 영상·쇼츠를 모아 둠)의
     영상은 "3분 묵상" 목록에, 쇼츠는 "쇼츠" 목록에 합칩니다. 라이브 방송은 모으지 않습니다.
     이미 손으로 적어 둔 영상(같은 영상 ID)은 건드리지 않습니다. */
  function mergeYoutubeAuto() {
    var Y = D.youtubeAuto; if (!Y) return;
    var have = {};
    ['sermons', 'meditations', 'shorts', 'wednesday'].forEach(function (k) { (D[k] || []).forEach(function (x) { if (x && x.youtube) have[x.youtube] = 1; }); });
    function add(key, list) {
      if (!list || !list.length) return;
      D[key] = D[key] || [];
      list.forEach(function (x) { if (x && x.youtube && !have[x.youtube]) { have[x.youtube] = 1; D[key].push({ title: x.title, date: x.date, youtube: x.youtube }); } });
    }
    add('meditations', Y.videos);
    add('shorts', Y.shorts);
  }
  function init() {
    mergeYoutubeAuto();
    D.missionReports = [];   // 선교지별 보고를 하나로 합친 목록 (선교 첫 페이지·검색에서 사용)
    (D.missionFields || []).forEach(function (f) {
      (f.reports || []).forEach(function (r) {
        var rid = reportId(r), ty = fieldType(r), path = reportPath(f, rid, ty), build = ty === 'construction';
        D.missionReports.push(Object.assign({}, r, { id: rid, category: build ? f.name + ' 공사' : f.name, link: path, sharePath: path, shareTitle: (build ? (f.constructionTitle || f.name + ' 공사') : f.name + ' 선교') + ' · ' + r.title, shareText: (build ? f.name + ' 공사 소식' : f.name + ' 선교보고') + ' · ' + fmtDate(r.date) }));
      });
    });
    renderHeader();
    renderFooter();
    var targets = $$('[data-render]');
    targets.sort(function (a, b) { return (a.getAttribute('data-render') === 'page-hero' ? 0 : 1) - (b.getAttribute('data-render') === 'page-hero' ? 0 : 1); });
    targets.forEach(function (el) {
      var fn = R[el.getAttribute('data-render')];
      if (fn) { try { fn(el); } catch (err) { if (window.console) console.error(el.getAttribute('data-render'), err); } }
    });
    if (!showSamples()) $$('[data-sample]').forEach(function (el) { el.classList.add('is-hidden'); });
    $$('[data-tokens]').forEach(function (el) { el.innerHTML = rich(el.innerHTML); });
    setupItemShare();
    setupEventMore();
    setupLightbox();
    setupVideoModal();
    revealTarget();
    window.addEventListener('hashchange', revealTarget);
    document.documentElement.classList.add('is-ready');
  }

  /* 이 페이지가 site.js 를 "?v=버전" 으로 불러왔다면, 자료 파일(data/*.js)도 같은 버전으로 불러옵니다
     (폰이 예전 자료 파일을 붙들고 있어도 HTML·CSS·JS 와 짝이 맞게 새로 받습니다) */
  var VER = (/[?&]v=([\w.-]+)/.exec((document.currentScript && document.currentScript.src) || '') || [])[1] || '';
  var pending = DATA_FILES.length;
  DATA_FILES.forEach(function (f) {
    var s = document.createElement('script');
    s.src = ROOT + 'data/' + f + '.js' + (VER ? '?v=' + VER : '');
    s.onload = s.onerror = function () { if (--pending === 0) init(); };
    document.head.appendChild(s);
  });
})();
