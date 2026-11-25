/* ==========================================================================
   성경 통독 (예배·말씀 > 성경 통독)
   - 365일 통독 / 맥체인 통독: 오늘 날짜에 맞는 읽을 곳을 보여 주고, 장마다 영상(팝업 재생)을 연결합니다.
   - 읽기 완료 표시와 달력은 이 기기의 브라우저(localStorage)에 저장됩니다. 로그인하면(assets/js/account.js, 카카오·구글) 계정에도 자동 저장되어 다른 기기에서 이어집니다.
     (날마다 "읽음"을 누른 시각을 state.t['계획|날짜'] 에 적어 두고, 두 기록은 가장 나중에 바꾼 쪽이 이깁니다)
   - 성경 전체: 책 → 장을 골라 영상을 봅니다.
   - 영상은 유튜브 채널 "공동체성경읽기"(개역개정)의 영상이며, 재생은 site.js 의 영상 팝업(setupVideoModal)이 맡습니다.
   자료는 data/bible.js 에 있습니다.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.getElementById('bible-app');
  if (!root) return;
  var B = window.KOSIN && window.KOSIN.bible;
  if (!B) { root.innerHTML = '<p>성경 통독 자료를 불러오지 못했습니다. 잠시 뒤에 다시 열어 주세요.</p>'; return; }

  var BOOKS = B.books, TOTAL = 0, OFFSET = [];
  BOOKS.forEach(function (b) { OFFSET.push(TOTAL); TOTAL += b[1]; });          // 성경 전체 장 수 (1189)
  var VID = B.videos.map(function (s) { return s.split(','); });               // 책 → 장 → 유튜브 영상 번호
  var WD = ['일', '월', '화', '수', '목', '금', '토'];
  var MD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var KEY = 'kosin.bible.v1';
  var PLANS = {
    y365: { name: '365일 통독', lead: '하루 3~4장씩, 창세기부터 요한계시록까지 순서대로 읽으면 1년에 성경 전체를 읽습니다.' },
    mcheyne: { name: '맥체인 통독', lead: '스코틀랜드의 목사 로버트 맥체인(1813~1843)이 만든 1년 읽기표입니다. 하루 네 곳(가정 예배 2, 개인 묵상 2)을 읽으며 구약은 한 번, 신약과 시편은 두 번 읽습니다.' }
  };
  var TABS = ['y365', 'mcheyne', 'books'];
  var PLAY = '<svg class="bchip__ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
  var CHECK = '<svg class="bico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  /* ---------- 저장 ---------- */
  function loadState() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.done) return s; } catch (e) {}
    return { tab: 'y365', done: { y365: {}, mcheyne: {} } };
  }
  function saveState() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  var state = loadState();
  state.done = state.done || {}; state.done.y365 = state.done.y365 || {}; state.done.mcheyne = state.done.mcheyne || {};
  state.t = state.t || {};
  var ACC = window.KOSIN && window.KOSIN.account;                // 로그인·기록 저장 (assets/js/account.js, 로그인 기능이 꺼져 있으면 아무 일도 하지 않음)
  function loggedUi() { return !!(ACC && ACC.enabled()); }

  /* ---------- 날짜 ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dayIndex(d) {                                   // 1~365 (윤년의 2월 29일은 0 = 쉬어가는 날)
    var m = d.getMonth(), day = d.getDate();
    if (m === 1 && day === 29) return 0;
    var n = day; for (var i = 0; i < m; i++) n += MD[i];
    return n;
  }
  function dateText(d) { return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + WD[d.getDay()] + '요일'; }
  var today = (function () {                               // 주소 끝에 ?date=2026-12-25 를 붙이면 그 날짜를 "오늘"로 미리 볼 수 있습니다
    var m = /[?&]date=(\d{4}-\d{2}-\d{2})/.exec(location.search), d = m ? parse(m[1]) : new Date();
    d.setHours(0, 0, 0, 0); return d;
  })();
  var todayKey = ymd(today);

  /* ---------- 읽을 곳 ---------- */
  function unit(b) { return b === 18 ? '편' : '장'; }       // 시편만 "편"
  function bookOf(g) { for (var i = BOOKS.length - 1; i >= 0; i--) if (g >= OFFSET[i]) return i; return 0; }
  function parseItem(s) {
    var m = /^(\d+):(\d+)(?:-(\d+))?(?:@(\d+-\d+))?$/.exec(s);
    return { b: +m[1] - 1, c1: +m[2], c2: +(m[3] || m[2]), v: m[4] || '' };
  }
  function readingFor(plan, idx) {                         // → [{label, items:[{b,c1,c2,v}]}]  (읽을 곳이 없는 날은 null)
    if (!idx) return null;
    if (plan === 'mcheyne') {
      var labels = ['가정 예배 1', '가정 예배 2', '개인 묵상 1', '개인 묵상 2'];
      return B.mcheyne[idx - 1].split(' ').map(function (s, i) { return { label: labels[i], items: [parseItem(s)] }; });
    }
    var a = Math.floor((idx - 1) * TOTAL / 365), z = Math.floor(idx * TOTAL / 365) - 1, items = [];
    for (var g = a; g <= z; g++) {
      var bi = bookOf(g), c = g - OFFSET[bi] + 1, last = items[items.length - 1];
      if (last && last.b === bi && last.c2 === c - 1) last.c2 = c; else items.push({ b: bi, c1: c, c2: c, v: '' });
    }
    return [{ label: '', items: items }];
  }
  function itemText(it) {
    var nm = BOOKS[it.b][0], u = unit(it.b);
    if (BOOKS[it.b][1] === 1) return nm;
    var t = nm + ' ' + (it.c1 === it.c2 ? it.c1 + u : it.c1 + '~' + it.c2 + u);
    return it.v ? t + ' (' + it.v.replace('-', '~') + '절)' : t;
  }
  function allItems(r) { var out = []; r.forEach(function (g) { g.items.forEach(function (it) { out.push(it); }); }); return out; }
  function videoIds(r) {                                   // 읽는 순서대로 장 영상 번호
    var ids = [];
    allItems(r).forEach(function (it) { for (var c = it.c1; c <= it.c2; c++) { var id = VID[it.b][c - 1]; if (id && ids.indexOf(id) < 0) ids.push(id); } });
    return ids;
  }

  /* ---------- 화면 조각 ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function chip(b, c, label) {
    var id = VID[b][c - 1], title = BOOKS[b][0] + (BOOKS[b][1] === 1 ? '' : ' ' + c + unit(b));
    if (id) return '<a class="bchip" href="https://www.youtube.com/watch?v=' + id + '" data-vt="' + esc(title) + '" aria-label="' + esc(title) + ' 영상 재생">' + PLAY + '<span>' + label + '</span></a>';
    return '<a class="bchip is-alt" href="https://www.youtube.com/playlist?list=' + B.lists[b] + '" data-vt="' + esc(BOOKS[b][0]) + '" title="이 장은 영상이 따로 없어 책 전체 목록이 열립니다" aria-label="' + esc(title) + ' (책 전체 재생목록)">' + PLAY + '<span>' + label + '</span></a>';
  }
  function itemHtml(it) {
    var chips = '', one = BOOKS[it.b][1] === 1;
    for (var c = it.c1; c <= it.c2; c++) {
      var label = one ? '영상 보기' : c + unit(it.b) + (it.v && it.c1 === it.c2 ? ' ' + it.v.replace('-', '~') + '절' : '');
      chips += chip(it.b, c, label);
    }
    return '<div class="bitem"><span class="bitem__name">' + esc(BOOKS[it.b][0]) + '</span><div class="bchips">' + chips + '</div></div>';
  }
  function groupsHtml(r) {
    return r.map(function (g) {
      return '<div class="bgroup">' + (g.label ? '<h4>' + g.label + '</h4>' : '') + g.items.map(itemHtml).join('') + '</div>';
    }).join('');
  }
  function stats(plan) {
    var m = state.done[plan] || {}, y = String(today.getFullYear()), n = 0, k;
    for (k in m) if (k.slice(0, 4) === y) n++;
    var d = new Date(today), s = 0; if (!m[ymd(d)]) d.setDate(d.getDate() - 1);
    while (m[ymd(d)]) { s++; d.setDate(d.getDate() - 1); }
    return { year: n, streak: s };
  }

  /* ---------- 읽기표 화면 ---------- */
  var view = { tab: TABS.indexOf(state.tab) >= 0 ? state.tab : 'y365', sel: todayKey, my: today.getFullYear(), mm: today.getMonth(), book: 0 };
  var hash = (location.hash || '').replace('#', ''); if (TABS.indexOf(hash) >= 0) view.tab = hash;

  function planHtml(plan) {
    var d = parse(view.sel), idx = dayIndex(d), r = readingFor(plan, idx), done = !!(state.done[plan] || {})[view.sel], isToday = view.sel === todayKey, st = stats(plan);
    var h = '<p class="bible-lead">' + PLANS[plan].lead + '</p><div class="bible-grid"><section class="bible-today" aria-live="polite">' +
      '<div class="bible-eyebrow"><span>' + (isToday ? '오늘의 말씀' : '선택한 날') + '</span>' + (isToday ? '' : '<button type="button" class="bible-link" data-act="today">오늘로 돌아가기</button>') + '</div>' +
      '<h2 class="bible-date">' + dateText(d) + '</h2>';
    if (!r) {
      h += '<p class="bible-rest">윤년에만 있는 2월 29일은 <b>쉬어가는 날</b>입니다. 밀린 말씀을 읽거나, 지난 말씀을 다시 묵상해 보세요.</p>';
    } else {
      var items = allItems(r);
      if (plan === 'y365') h += '<p class="bible-range">' + items.map(itemText).join(' · ') + '</p>';
      else h += '<p class="bible-range">' + items.map(function (it) { return itemText(it); }).join(' · ') + '</p>';
      h += groupsHtml(r);
      var ids = videoIds(r);
      h += '<div class="bible-actions">' +
        (ids.length ? '<a class="btn btn--primary" href="https://www.youtube.com/watch_videos?video_ids=' + ids.join(',') + '" data-vt="' + esc(dateText(d) + ' 말씀') + '">' + PLAY + ' 이어서 듣기</a>' : '') +
        '<button type="button" class="btn ' + (done ? 'btn--done' : 'btn--outline') + '" data-act="done" aria-pressed="' + done + '">' + CHECK + (done ? ' 읽었습니다 · 취소' : ' 읽기 완료') + '</button></div>';
    }
    h += '<div class="bible-progress"><div class="bible-stats"><span>올해 읽은 날 <b>' + st.year + '</b>일</span><span>연속 <b>' + st.streak + '</b>일</span></div>' +
      '<div class="bar" role="progressbar" aria-label="올해 읽은 날" aria-valuemin="0" aria-valuemax="365" aria-valuenow="' + Math.min(st.year, 365) + '"><i style="width:' + Math.min(100, st.year / 365 * 100).toFixed(1) + '%"></i></div></div></section>' + calHtml(plan) + '</div>';
    return h;
  }
  function calHtml(plan) {
    var y = view.my, m = view.mm, first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), map = state.done[plan] || {};
    var h = '<section class="bcal" aria-label="읽기 달력"><div class="bcal-head"><button type="button" class="bcal-nav" data-act="prev" aria-label="이전 달"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<h3>' + y + '년 ' + (m + 1) + '월</h3><button type="button" class="bcal-nav" data-act="next" aria-label="다음 달"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></div><div class="bcal-grid">';
    WD.forEach(function (w, i) { h += '<span class="bcal-dow' + (i === 0 ? ' is-sun' : '') + '">' + w + '</span>'; });
    for (var i = 0; i < first.getDay(); i++) h += '<span class="bday is-empty"></span>';
    for (var d = 1; d <= days; d++) {
      var k = y + '-' + pad(m + 1) + '-' + pad(d), cls = 'bday' + (map[k] ? ' is-done' : '') + (k === todayKey ? ' is-today' : '') + (k === view.sel ? ' is-sel' : '');
      h += '<button type="button" class="' + cls + '" data-date="' + k + '" aria-pressed="' + (k === view.sel) + '" aria-label="' + m1(m) + '월 ' + d + '일' + (map[k] ? ', 읽음' : '') + '">' + d + '</button>';
    }
    return h + '</div><p class="bcal-legend"><span class="lg lg--done"></span>읽음 <span class="lg lg--today"></span>오늘</p></section>';
  }
  function m1(m) { return m + 1; }

  /* ---------- 성경 전체 ---------- */
  function booksHtml() {
    var b = view.book, n = BOOKS[b][1], u = unit(b), chips = '';
    for (var c = 1; c <= n; c++) {
      var id = VID[b][c - 1], title = BOOKS[b][0] + (n === 1 ? '' : ' ' + c + u);
      chips += id
        ? '<a class="bchap" href="https://www.youtube.com/watch?v=' + id + '" data-vt="' + esc(title) + '" aria-label="' + esc(title) + ' 영상 재생">' + c + '</a>'
        : '<a class="bchap is-alt" href="https://www.youtube.com/playlist?list=' + B.lists[b] + '" data-vt="' + esc(BOOKS[b][0]) + '" title="이 장은 영상이 따로 없어 책 전체 목록이 열립니다" aria-label="' + esc(title) + ' (책 전체 재생목록)">' + c + '</a>';
    }
    function grid(title, from, to) {
      var g = '<h3 class="bbooks-title">' + title + '</h3><div class="bbook-grid">';
      for (var i = from; i < to; i++) g += '<button type="button" class="bbook' + (i === b ? ' is-sel' : '') + '" data-book="' + i + '" aria-pressed="' + (i === b) + '">' + esc(BOOKS[i][0]) + '</button>';
      return g + '</div>';
    }
    return '<p class="bible-lead">책을 고르면 그 책의 장별 영상이 나타납니다. 장을 누르면 이 화면 위에서 바로 재생됩니다.</p>' +
      '<section class="bchapters" id="bchapters"><div class="bchapters__head"><h2>' + esc(BOOKS[b][0]) + '</h2><span>' + (n === 1 ? '1장' : n + u) + '</span>' +
      '<a class="bible-link" href="https://www.youtube.com/playlist?list=' + B.lists[b] + '" data-vt="' + esc(BOOKS[b][0] + ' 전체') + '">책 전체 이어서 듣기</a></div>' +
      '<div class="bchap-grid">' + chips + '</div></section>' + grid('구약 39권', 0, 39) + grid('신약 27권', 39, 66);
  }

  function extraHtml() {
    return '<section class="bextra"><h3>유튜브 재생목록으로 이어서 듣기</h3><div class="bextra-grid">' + B.extraLists.map(function (l) {
      return '<a class="bextra-card" href="https://www.youtube.com/playlist?list=' + l[1] + '" data-vt="' + esc(l[0]) + '">' + PLAY + '<span>' + esc(l[0]) + '</span></a>';
    }).join('') + '</div></section>';
  }
  function noteHtml() {
    return '<p class="bible-note">영상은 유튜브 채널 <a href="' + B.channel + '" target="_blank" rel="noopener">공동체성경읽기</a>의 장별 구절 영상(개역개정)이며, 영상을 누르면 이 화면 위에서 재생되고 창 안의 "유튜브에서 보기"로 유튜브에서 열 수 있습니다. ' +
      (loggedUi()
        ? '읽은 날 표시는 이 기기에 저장되고, 로그인하면 계정에도 저장되어 다른 기기에서 이어집니다. 로그인하지 않으면 이 기기·브라우저에만 저장되며, 브라우저 기록을 지우면 함께 지워집니다.'
        : '읽은 날 표시는 지금 사용 중인 기기·브라우저에만 저장되어 다른 기기와는 이어지지 않으며, 브라우저 기록을 지우면 함께 지워집니다.') + '</p>';
  }

  /* ---------- 그리기 ---------- */
  function render(focusSel) {
    var tabs = '<div class="bible-tabs" role="tablist" aria-label="통독 방식">' + TABS.map(function (t) {
      var name = t === 'books' ? '성경 전체' : PLANS[t].name;
      return '<button type="button" role="tab" class="bible-tab" data-tab="' + t + '" aria-selected="' + (view.tab === t) + '">' + name + '</button>';
    }).join('') + '</div>';
    root.innerHTML = tabs + (view.tab === 'books' ? booksHtml() : planHtml(view.tab)) + extraHtml() + noteHtml();
    if (focusSel) { var f = root.querySelector(focusSel); if (f) f.focus({ preventScroll: true }); }
  }

  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab],[data-act],[data-date],[data-book]');
    if (!t || !root.contains(t)) return;
    if (t.hasAttribute('data-tab')) {
      view.tab = t.getAttribute('data-tab');
      if (view.tab !== 'books') { state.tab = view.tab; saveState(); }
      render('[data-tab="' + view.tab + '"]');
    } else if (t.hasAttribute('data-date')) {
      view.sel = t.getAttribute('data-date'); render('[data-date="' + view.sel + '"]');
      var card = root.querySelector('.bible-today'); if (card && window.innerWidth < 900 && card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else if (t.hasAttribute('data-book')) {
      view.book = +t.getAttribute('data-book'); render('[data-book="' + view.book + '"]');
      var panel = document.getElementById('bchapters'); if (panel) panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else {
      var act = t.getAttribute('data-act'), plan = view.tab;
      if (act === 'done') {
        var m = state.done[plan] = state.done[plan] || {};
        if (m[view.sel]) delete m[view.sel]; else m[view.sel] = 1;
        state.t[plan + '|' + view.sel] = Date.now();
        saveState(); if (ACC) ACC.touch('bible'); render('[data-act="done"]');
      } else if (act === 'prev' || act === 'next') {
        view.mm += act === 'next' ? 1 : -1;
        if (view.mm < 0) { view.mm = 11; view.my--; } else if (view.mm > 11) { view.mm = 0; view.my++; }
        render('[data-act="' + act + '"]');
      } else if (act === 'today') {
        view.sel = todayKey; view.my = today.getFullYear(); view.mm = today.getMonth(); render('[data-date="' + todayKey + '"]');
      }
    }
  });

  /* ---------- 계정에 저장 (로그인했을 때) ----------
     읽은 날 = state.done[계획][날짜]. 바꾼 시각 = state.t['계획|날짜']. 두 기록은 날짜마다 가장 나중에 바꾼 쪽이 이기고,
     시각이 없는 예전 기록은 "읽음"으로 보고 합칩니다. */
  var PLAN_IDS = ['y365', 'mcheyne'];
  function mergeBible(L, R) {
    L = L || {}; R = R || {};
    var out = { v: 1, done: { y365: {}, mcheyne: {} }, t: {} }, ids = {};
    function collect(x) {
      PLAN_IDS.forEach(function (p) { Object.keys(((x.done || {})[p]) || {}).forEach(function (d) { ids[p + '|' + d] = 1; }); });
      Object.keys(x.t || {}).forEach(function (k) { var p = k.split('|')[0]; if (PLAN_IDS.indexOf(p) >= 0) ids[k] = 1; });
    }
    collect(L); collect(R);
    Object.keys(ids).forEach(function (id) {
      var p = id.split('|')[0], d = id.slice(p.length + 1);
      var lt = (L.t || {})[id] || 0, rt = (R.t || {})[id] || 0;
      var lon = !!(((L.done || {})[p] || {})[d]), ron = !!(((R.done || {})[p] || {})[d]);
      var on = lt === rt ? (lon || ron) : (rt > lt ? ron : lon);
      if (on) out.done[p][d] = 1;
      if (lt || rt) out.t[id] = Math.max(lt, rt);
    });
    return out;
  }
  if (ACC) ACC.register('bible', {
    get: function () { return { v: 1, done: { y365: state.done.y365, mcheyne: state.done.mcheyne }, t: state.t }; },
    merge: mergeBible,
    set: function (m) { state.done.y365 = m.done.y365; state.done.mcheyne = m.done.mcheyne; state.t = m.t; saveState(); render(); },
    has: function () { return Object.keys(state.done.y365).length + Object.keys(state.done.mcheyne).length > 0; },
    clear: function () { state.done = { y365: {}, mcheyne: {} }; state.t = {}; saveState(); render(); }
  });

  render();
})();
