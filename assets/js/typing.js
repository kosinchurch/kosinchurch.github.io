/* ==========================================================================
   성경 타자 (예배·말씀 > 성경 타자)
   - 번역을 고르고(개역개정·개역한글) 책·장을 고르면 본문을 한 절씩 보여 주고, 따라 쓰는 대로 글자마다 맞고 틀림을 표시합니다.
   - 한 절을 다 쓰면 자동으로 다음 절로 넘어갑니다. 한글은 마지막 글자가 아직 "조합 중"이면 스페이스나 Enter 로 확정하면 됩니다.
   - 쓴 기록(어느 장을 썼는지·속도)은 이 기기의 브라우저(localStorage)에 저장됩니다. 번역마다 따로 기록합니다.
     로그인하면(assets/js/account.js, 카카오·구글) 계정에도 자동 저장되어 다른 기기에서 이어집니다. 합치는 방법은 맨 아래 mergeTyping 참고.
   - 본문은 assets/bible/<번역>/01.json ~ 66.json (책별 → 장별 → 절 글자). 번역: nkrv 개역개정, krv 개역한글.
   - "(18절에 포함되어 있음)" 처럼 앞 절에 합쳐진 절은 쓰지 않고 건너뜁니다.
   - 한글 본문의 「 」 … — 처럼 키보드로 치기 어려운 부호는 쓰지 않아도 맞는 것으로 봅니다.
   - 책 이름·장 수는 data/bible.js 의 books 를 그대로 씁니다.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.getElementById('typing-app');
  if (!root) return;
  var B = window.KOSIN && window.KOSIN.bible;
  if (!B || !B.books || !window.fetch) { root.innerHTML = '<p>성경 타자 자료를 불러오지 못했습니다. 잠시 뒤에 다시 열어 주세요.</p>'; return; }

  var BOOKS = B.books, NB = BOOKS.length, TOTAL = 0;
  BOOKS.forEach(function (b) { TOTAL += b[1]; });                       // 성경 전체 장 수 (1189)
  var BASE = (document.body.getAttribute('data-root') || './') + 'assets/bible/';
  var KEY = 'kosin.typing.v1';
  var PLACE = /^\((\d+절에 포함되어 있음|원문에 없음)\)$/;                  // 앞 절에 합쳐졌거나 원문에 없는 절
  var AUTO = /[「」…—]/;                                                 // (한글 본문) 쓰지 않아도 되는 부호
  var TR = {
    nkrv: { name: '개역개정', dir: 'nkrv/', lang: 'ko', credit: '본문: 성경전서 개역개정판 ⓒ 대한성서공회. 교회 홈페이지의 성경 타자 용도로 싣습니다. (본문 글자는 그대로이고, 소제목과 각주 번호만 뺐습니다.)' },
    krv: { name: '개역한글', dir: 'krv/', lang: 'ko', credit: '본문: 성경전서 개역한글판(1961) · 대한성서공회. 개역한글판은 저작재산권 보호기간이 끝나 누구나 쓸 수 있습니다.' }
  };
  var ORDER = ['nkrv', 'krv'];
  var CACHE = {};

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---------- 저장 ---------- */
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.done) return s; } catch (e) {}
    return { b: 0, c: 1, t: 'nkrv', done: {}, fin: {}, opts: { ignoreSpace: false } };
  }
  var S = load();
  S.fin = S.fin || {}; S.opts = S.opts || {};
  if (!TR[S.t]) S.t = 'nkrv';
  if (S.tv !== 2) { S.t = 'nkrv'; S.tv = 2; }                              // 개역개정이 기본입니다. (예전에 주소로 딸려 들어온 번역 선택은 이때 한 번만 개역개정으로 되돌림. 이후 고른 번역은 그대로 기억)
  S.st = S.st || { ko: { chars: S.chars || 0, ms: S.ms || 0 } };            // 예전 기록(글자 수·시간)은 한글 쪽으로 옮김
  /* 계정 저장(로그인)용: ts = 장별 마지막으로 쓴 시각, del = 장별 "다시 쓰기"로 지운 시각, rs = 번역 전체 지우기 시각,
     ep = 글자 수·시간 지우기 시각, dev = 이 기기 번호, devs = 다른 기기들이 쓴 글자 수·시간 */
  S.ts = S.ts || {}; S.del = S.del || {}; S.rs = S.rs || {}; S.ep = S.ep || 0; S.devs = S.devs || {};
  S.days = S.days || {};                                                    // 이 기기에서 날마다 쓴 [글자 수, 시간(ms), 절 수] — 현황판용 (다른 기기 것은 S.devs[기기].d)
  if (!S.dev) S.dev = 'd' + Math.random().toString(36).slice(2, 10);
  var ACC = window.KOSIN && window.KOSIN.account;                           // 로그인 기능이 꺼져 있으면 아무 일도 하지 않음
  function touch() { if (ACC) ACC.touch('typing'); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  /* 주소 끝에 ?b=43&c=3 (책 번호 1~66·장) 을 붙이면 그 장을 바로 엽니다 (번역은 개역개정이 기본, 화면에서 고르면 이 기기가 기억) */
  (function () {
    var m = /[?&]b=(\d+)/.exec(location.search), n = /[?&]c=(\d+)/.exec(location.search);   // (번역은 주소로 정하지 않습니다 — 주소를 복사해 나눌 때 받는 분이 내 번역으로 열리지 않도록)
    if (m && +m[1] >= 1 && +m[1] <= NB) { S.b = +m[1] - 1; S.c = (n && +n[1] >= 1 && +n[1] <= BOOKS[S.b][1]) ? +n[1] : 1; }
    if (!(S.b >= 0 && S.b < NB)) S.b = 0;
    if (!(S.c >= 1 && S.c <= BOOKS[S.b][1])) S.c = 1;
  })();

  function tr() { return TR[S.t]; }
  function bname(i) { return BOOKS[i][0]; }
  function unit(b) { return b === 18 ? '편' : '장'; }                                  // 시편만 "편"
  function chapLabel(b, c) { return BOOKS[b][0] + ' ' + c + unit(b); }
  function pfx() { return S.t === 'krv' ? '' : S.t + ':'; }                          // 개역한글 기록은 예전 형식 그대로(이어 쓰기 위해)
  function key() { return pfx() + S.b + '-' + S.c; }

  /* ---------- 화면 뼈대 ---------- */
  var opts = ORDER.map(function (k) { return '<option value="' + k + '">' + esc(TR[k].name) + '</option>'; }).join('');
  root.innerHTML =
    '<div class="ty-bar">' +
      '<div class="ty-pick">' +
        '<label class="ty-lab"><span>번역</span><select id="ty-trans">' + opts + '</select></label>' +
        '<label class="ty-lab"><span>책</span><select id="ty-book"></select></label>' +
        '<label class="ty-lab"><span>장</span><select id="ty-chap"></select></label>' +
        '<button type="button" class="btn btn--outline btn--sm" id="ty-prev">&lsaquo; 이전 장</button>' +
        '<button type="button" class="btn btn--outline btn--sm" id="ty-next">다음 장 &rsaquo;</button>' +
      '</div>' +
      '<div class="ty-sum"><span id="ty-sum"></span> <button type="button" class="ty-link" id="ty-reset">기록 지우기</button></div>' +
    '</div>' +
    '<div class="ty-prog"><div class="ty-prog__txt" id="ty-progtxt"></div><div class="ty-prog__bar"><i id="ty-progbar"></i></div></div>' +
    '<section class="ty-stage ty-play" id="ty-play" aria-label="따라 쓰기">' +
      '<div class="ty-ref" id="ty-ref"></div>' +
      '<p class="ty-sr" id="ty-sr"></p>' +
      '<p class="ty-target" id="ty-target" aria-hidden="true"></p>' +
      '<textarea id="ty-input" class="ty-input" rows="3" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="next"></textarea>' +
      '<div class="ty-live" id="ty-live" role="status" aria-live="polite"></div>' +
      '<div class="ty-ctl">' +
        '<label class="ty-chk" id="ty-spacewrap"><input type="checkbox" id="ty-space"> 띄어쓰기는 틀려도 괜찮아요</label>' +
        '<button type="button" class="btn btn--outline btn--sm" id="ty-skip">이 절 건너뛰기</button>' +
        '<button type="button" class="btn btn--outline btn--sm" id="ty-redo">이 절 다시 쓰기</button>' +
      '</div>' +
    '</section>' +
    '<div class="ty-donebox" id="ty-done" hidden>' +
      '<h3 id="ty-donetitle"></h3><p id="ty-donetext"></p>' +
      '<div class="btn-row"><button type="button" class="btn btn--primary" id="ty-donenext">다음 장 쓰기 &rsaquo;</button><button type="button" class="btn btn--outline" id="ty-doneagain">이 장 다시 쓰기</button></div>' +
    '</div>' +
    '<section class="ty-stats" id="ty-stats" aria-label="내 타자 기록">' +
      '<div class="ty-stats__head"><h3>내 타자 기록</h3><span class="ty-stats__live">쓰는 대로 바로 올라가요</span></div>' +
      '<div class="ty-tiles">' +
        '<div class="ty-tile"><span>오늘 쓴 글자</span><b id="ty-st-today">0</b><small id="ty-st-todaysub">0절 완료</small></div>' +
        '<div class="ty-tile"><span>연속 쓴 날</span><b id="ty-st-streak">0일</b><small id="ty-st-streaksub"></small></div>' +
        '<div class="ty-tile"><span>완료한 장</span><b id="ty-st-chap">0</b><small id="ty-st-chapsub"></small></div>' +
        '<div class="ty-tile" id="ty-st-spdbox"><span id="ty-st-spdk">평균 속도</span><b id="ty-st-spd">0</b><small>자 / 분</small></div>' +
      '</div>' +
      '<details class="ty-books"><summary>책별 진행 보기</summary><div class="ty-bkgrid" id="ty-bkgrid"></div></details>' +
    '</section>' +
    '<ol class="ty-list" id="ty-list" aria-label="이 장의 말씀 (누르면 그 절부터 씁니다)"></ol>' +
    '<p class="ty-credit" id="ty-credit"></p>' +
    '<p class="ty-credit">' + (ACC && ACC.enabled()
      ? '쓴 기록은 이 기기의 브라우저에 저장되고, 로그인하면 계정에도 저장되어 다른 기기에서 이어집니다. 번역마다 따로 기록합니다.'
      : '쓴 기록은 이 기기의 브라우저에만 저장되며, 다른 기기와는 이어지지 않습니다. 번역마다 따로 기록합니다.') + '</p>';

  function $(id) { return document.getElementById(id); }
  var elTrans = $('ty-trans'), elBook = $('ty-book'), elChap = $('ty-chap'), elPrev = $('ty-prev'), elNext = $('ty-next'), elSum = $('ty-sum'),
      elProgTxt = $('ty-progtxt'), elProgBar = $('ty-progbar'), elPlay = $('ty-play'), elRef = $('ty-ref'), elSr = $('ty-sr'),
      elTarget = $('ty-target'), elIn = $('ty-input'), elLive = $('ty-live'), elSpace = $('ty-space'),
      elSkip = $('ty-skip'), elRedo = $('ty-redo'),
      elDone = $('ty-done'), elList = $('ty-list'), elCredit = $('ty-credit');

  /* ---------- 상태 ---------- */
  var verses = [], typable = [], cur = -1, composing = false, startTs = 0, errors = 0, badSeen = {}, liveKind = '', token = 0, liveOk = 0;
  elSpace.checked = !!S.opts.ignoreSpace;

  function doneArr() { return S.done[key()] || []; }
  function isDone(i) { return doneArr().indexOf(i + 1) >= 0; }
  function resetVerse() { startTs = 0; errors = 0; badSeen = {}; liveOk = 0; }
  function say(msg, kind) { elLive.textContent = msg || ''; elLive.className = 'ty-live' + (kind ? ' is-' + kind : ''); liveKind = kind || ''; }
  function stat() { return S.st.ko || (S.st.ko = { chars: 0, ms: 0 }); }

  /* ---------- 내 기록 현황 (쓰는 동안 실시간으로 올라갑니다) ---------- */
  function dkey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function allDays() {                                                      // 날짜 → [글자 수, 시간, 절 수] (이 기기 + 로그인으로 가져온 다른 기기 것)
    var out = {}, id, e;
    function add(days) { var d, a, o; for (d in days) { a = days[d] || []; o = out[d] || (out[d] = [0, 0, 0]); o[0] += a[0] || 0; o[1] += a[1] || 0; o[2] += a[2] || 0; } }
    add(S.days);
    for (id in S.devs) { e = S.devs[id] || {}; if ((e.e || 0) >= (S.ep || 0)) add(e.d); }
    return out;
  }
  function streakOf(days) {                                                 // 오늘(또는 어제)부터 거꾸로 이어서 쓴 날 수
    var d = new Date(), n = 0;
    if (!(days[dkey(d)] && days[dkey(d)][0] > 0)) d.setDate(d.getDate() - 1);
    while (days[dkey(d)] && days[dkey(d)][0] > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function totals() {                                                       // 이 기기 + 다른 기기에서 쓴 글자 수·시간
    var ss = stat(), t = { chars: ss.chars, ms: ss.ms }, id, e;
    for (id in S.devs) { e = S.devs[id] || {}; if ((e.e || 0) >= (S.ep || 0)) { t.chars += e.c || 0; t.ms += e.m || 0; } }
    return t;
  }
  function renderStats(light) {
    var el = $('ty-stats'); if (!el) return;
    var days = allDays(), td = days[dkey(new Date())] || [0, 0, 0], t = totals(), n = 0, st, live = 0;
    $('ty-st-today').textContent = (td[0] + liveOk).toLocaleString('ko-KR');
    $('ty-st-todaysub').textContent = td[2] + '절 완료' + (liveOk ? ' · 쓰는 중' : '');
    st = streakOf(days); $('ty-st-streak').textContent = st + '일';
    $('ty-st-streaksub').textContent = st ? (days[dkey(new Date())] ? '오늘도 쓰셨어요' : '오늘 쓰면 이어져요') : '오늘 첫 절을 써 보세요';
    finKeys(function () { n++; });
    $('ty-st-chap').textContent = n; $('ty-st-chapsub').textContent = '/ ' + TOTAL + '장 · ' + tr().name;
    if (startTs && liveOk >= 3 && Date.now() - startTs > 1500) live = Math.round(liveOk / ((Date.now() - startTs) / 60000));
    $('ty-st-spdk').textContent = live ? '지금 속도' : '평균 속도';
    $('ty-st-spdbox').className = 'ty-tile' + (live ? ' is-live' : '');
    $('ty-st-spd').textContent = live || (t.ms > 0 ? Math.round(t.chars / (t.ms / 60000)) : 0);
    if (light) return;
    var h = '', i, f, c, p;
    for (i = 0; i < NB; i++) {
      f = finCount(i); c = BOOKS[i][1]; p = Math.round(100 * f / c);
      h += '<button type="button" class="ty-bk' + (f === c ? ' is-full' : '') + (i === S.b ? ' is-cur' : '') + '" data-b="' + i + '" style="--p:' + p + '%" title="' + esc(BOOKS[i][0]) + ' ' + f + '/' + c + unit(i) + '"><span>' + esc(BOOKS[i][0]) + '</span><i>' + f + '/' + c + '</i></button>';
    }
    $('ty-bkgrid').innerHTML = h;
  }

  /* 고른 번역에 맞게 화면의 안내(출처 표시·입력칸 문구)를 바꿈 */
  function applyLang() {
    elIn.setAttribute('placeholder', '여기에 위 말씀을 그대로 입력하세요');
    elIn.setAttribute('aria-label', '위 말씀을 그대로 입력하세요');
    elCredit.textContent = tr().credit;
    elTrans.value = S.t;
  }

  /* ---------- 책·장 고르는 칸 ---------- */
  function finKeys(fn) { var re = S.t === 'krv' ? /^(\d+)-(\d+)$/ : new RegExp('^' + S.t + ':(\\d+)-(\\d+)$'), k, m; for (k in S.fin) { if (S.fin[k] && (m = re.exec(k))) fn(+m[1], +m[2]); } }
  function finCount(b) { var n = 0; finKeys(function (bi) { if (bi === b) n++; }); return n; }
  function bookOpts(a, z) {
    var h = '', i, f;
    for (i = a; i < z; i++) { f = finCount(i); h += '<option value="' + i + '">' + esc(bname(i)) + (f ? ' (' + f + '/' + BOOKS[i][1] + ')' : '') + '</option>'; }
    return h;
  }
  function fillBooks() { elBook.innerHTML = '<optgroup label="구약">' + bookOpts(0, 39) + '</optgroup><optgroup label="신약">' + bookOpts(39, NB) + '</optgroup>'; elBook.value = S.b; }
  function fillChaps() {
    var n = BOOKS[S.b][1], h = '', c;
    for (c = 1; c <= n; c++) h += '<option value="' + c + '">' + (S.fin[pfx() + S.b + '-' + c] ? '✓ ' : '') + c + unit(S.b) + '</option>';
    elChap.innerHTML = h; elChap.value = S.c;
  }

  /* ---------- 본문 불러오기 ---------- */
  function getBook(b) {
    var ck = S.t + ':' + b;
    if (CACHE[ck]) return Promise.resolve(CACHE[ck]);
    return fetch(BASE + tr().dir + pad(b + 1) + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { CACHE[ck] = d; return d; });
  }
  function syncUrl() { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {} }   // 주소창은 늘 깨끗하게 (내 책·장·번역이 주소에 묻어 공유되지 않게)

  function openChapter(b, c, focus) {
    S.b = b; S.c = c; save(); syncUrl(); applyLang(); fillBooks(); fillChaps();
    var my = ++token;
    elIn.value = ''; resetVerse(); cur = -1; say('본문을 불러오는 중입니다…', '');
    getBook(b).then(function (d) {
      if (my !== token) return;
      verses = d[c - 1] || [];
      typable = []; verses.forEach(function (v, i) { if (!PLACE.test(v)) typable.push(i); });
      pickStart(); renderAll(); say('', '');
      if (focus && cur >= 0 && window.matchMedia && matchMedia('(pointer: fine)').matches) elIn.focus({ preventScroll: true });
    }).catch(function () {
      if (my !== token) return;
      say('본문을 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.', 'warn');
      elPlay.hidden = false; elDone.hidden = true; elIn.disabled = true; elTarget.textContent = '';
    });
  }
  function pickStart() {
    var j, i; cur = -1;
    for (j = 0; j < typable.length; j++) { i = typable[j]; if (!isDone(i)) { cur = i; break; } }
    if (cur < 0 && typable.length && !S.fin[key()]) cur = typable[0];
  }
  function nextTypable(from) {
    var fin = S.fin[key()], j, i;
    for (j = 0; j < typable.length; j++) { i = typable[j]; if (i > from && (fin || !isDone(i))) return i; }
    if (!fin) for (j = 0; j < typable.length; j++) { i = typable[j]; if (!isDone(i)) return i; }
    return -1;
  }

  /* ---------- 맞고 틀림 가리기 ---------- */
  function norm(t) { return t.replace(/\r?\n/g, ' ').replace(/^\s+/, ''); }
  function calc(t, y, comp) {
    var ign = S.opts.ignoreSpace, i, ch, k = 0, yf = '', st = [], needTotal = 0, caret = -1;
    function need(c) { return !AUTO.test(c) && !(ign && /\s/.test(c)); }
    function same(a, b) { return a === b; }
    y = y.replace(/\s+$/, '');                                          // 끝의 빈칸은 무시
    for (i = 0; i < y.length; i++) { ch = y.charAt(i); if (need(ch)) yf += ch; }
    for (i = 0; i < t.length; i++) if (need(t.charAt(i))) needTotal++;
    for (i = 0; i < t.length; i++) {
      ch = t.charAt(i);
      if (!need(ch)) { st.push((k < yf.length || yf.length >= needTotal) ? 'ok' : 'todo'); continue; }
      if (k >= yf.length) st.push('todo');
      else if (same(yf.charAt(k), ch)) st.push('ok');
      else st.push(comp && k === yf.length - 1 ? 'comp' : 'bad');       // 마지막 글자가 조합 중이면 아직 틀린 것으로 보지 않음
      k++;
    }
    for (i = 0; i < st.length; i++) if (st[i] === 'todo') { caret = i; break; }
    return { st: st, caret: caret, extra: yf.length > needTotal, ok: yf.length === needTotal && st.indexOf('bad') < 0 && st.indexOf('comp') < 0 };
  }
  function matches() { return cur >= 0 && calc(verses[cur], norm(elIn.value), false).ok; }

  function paint() {
    if (cur < 0) return;
    var t = verses[cur], y = norm(elIn.value), r = calc(t, y, composing), h = '', i;
    for (i = 0; i < t.length; i++) {
      if (!composing && r.st[i] === 'bad' && !badSeen[i]) { badSeen[i] = 1; errors++; }
      h += '<span class="c-' + r.st[i] + (i === r.caret ? ' c-cur' : '') + '">' + esc(t.charAt(i)) + '</span>';
    }
    elTarget.innerHTML = h;
    var ok = 0; for (i = 0; i < t.length; i++) if (r.st[i] === 'ok' && !/\s/.test(t.charAt(i))) ok++;   // 지금 쓰는 절에서 맞게 쓴 글자 수 (현황판에 실시간 반영)
    liveOk = ok; renderStats(true);
    if (r.extra && !composing) say('글자가 더 많이 입력됐어요. 뒤쪽을 지워 주세요.', 'warn');
    else if (r.ok && composing) say('✓ 다 썼어요! 스페이스나 Enter 키를 누르면 다음 절로 넘어갑니다.', 'hint');
    else if (liveKind === 'hint' || liveKind === 'warn' || liveKind === 'ok') say('', '');
  }

  /* ---------- 한 절 마치기 ---------- */
  function finishVerse() {
    var k = key(), arr = S.done[k] || (S.done[k] = []), v = cur + 1, t = verses[cur], len = t.replace(/\s/g, '').length || 1, ss = stat();
    var ms = Math.max(800, Date.now() - (startTs || Date.now()));
    var acc = Math.max(0, Math.round(100 * (len - Math.min(errors, len)) / len));
    var wasFin = !!S.fin[k], n;
    if (arr.indexOf(v) < 0) arr.push(v);
    ss.chars += len; ss.ms += ms;
    var dk = dkey(new Date()), dd = S.days[dk] || (S.days[dk] = [0, 0, 0]), dks;
    dd[0] += len; dd[1] += ms; dd[2] += 1;
    dks = Object.keys(S.days).sort(); while (dks.length > 400) delete S.days[dks.shift()];   // 날짜 기록은 최근 400일만
    if (!wasFin && typable.every(isDone)) { S.fin[k] = 1; n = -1; } else n = nextTypable(cur);
    elIn.value = ''; resetVerse(); cur = n;
    S.ts[k] = Date.now(); save(); touch(); fillBooks(); fillChaps(); renderAll();
    say('✓ ' + v + '절 완료 · 정확도 ' + acc + '% · 분당 ' + Math.round(len / (ms / 60000)) + '자', 'ok');
    if (cur >= 0) elIn.focus({ preventScroll: true });
  }
  function check() { if (cur < 0 || composing) return; if (matches()) finishVerse(); }

  /* ---------- 그리기 ---------- */
  function renderList() {
    var h = '', i, v;
    for (i = 0; i < verses.length; i++) {
      v = verses[i];
      if (PLACE.test(v)) { h += '<li class="is-merged"><div class="ty-row" aria-label="' + (i + 1) + '절은 쓰지 않는 절입니다"><span class="ty-n">' + (i + 1) + '</span><span class="ty-t">' + esc(v) + '</span><span class="ty-ck"></span></div></li>'; continue; }
      h += '<li class="' + (isDone(i) ? 'is-done ' : '') + (i === cur ? 'is-cur' : '') + '"><button type="button" class="ty-row" data-i="' + i + '"' + (i === cur ? ' aria-current="true"' : '') + '><span class="ty-n">' + (i + 1) + '</span><span class="ty-t">' + esc(v) + '</span><span class="ty-ck" aria-hidden="true">✓</span></button></li>';
    }
    elList.innerHTML = h;
  }
  function renderProgress() {
    var d = 0, i, f = S.fin[key()];
    for (i = 0; i < typable.length; i++) if (isDone(typable[i])) d++;
    elProgTxt.textContent = chapLabel(S.b, S.c) + ' · ' + d + ' / ' + typable.length + '절 완료' + (f ? ' ✓' : '');
    elProgBar.style.width = (typable.length ? Math.round(100 * d / typable.length) : 0) + '%';
  }
  function renderSummary() {
    var n = 0, t = totals(), avg = t.ms > 0 ? Math.round(t.chars / (t.ms / 60000)) : 0;      // 다른 기기에서 쓴 글자 수·시간도 더함
    finKeys(function () { n++; });
    elSum.textContent = tr().name + ' · 완료한 장 ' + n + ' / ' + TOTAL + ' · 쓴 글자 ' + t.chars.toLocaleString('ko-KR') + '자' + (avg ? ' · 평균 분당 ' + avg + '자' : '');
    renderStats(false);
  }
  function renderStage() {
    var name = chapLabel(S.b, S.c);
    if (cur < 0) {
      elPlay.hidden = true; elDone.hidden = false;
      $('ty-donetitle').textContent = '✓ ' + name + ' 완료!';
      $('ty-donetext').textContent = typable.length + '절을 모두 썼어요. 수고하셨습니다.';
      $('ty-donenext').hidden = (S.b === NB - 1 && S.c === BOOKS[S.b][1]);
      return;
    }
    elPlay.hidden = false; elDone.hidden = true; elIn.disabled = false;
    elRef.textContent = name + ' ' + (cur + 1) + '절';
    elSr.textContent = verses[cur];
    paint();
  }
  function renderAll() {
    renderList(); renderProgress(); renderSummary(); renderStage();
    var first = (S.b === 0 && S.c === 1), last = (S.b === NB - 1 && S.c === BOOKS[S.b][1]);
    elPrev.disabled = first; elNext.disabled = last;
  }

  /* ---------- 동작 ---------- */
  function gotoRel(d) {
    var b = S.b, c = S.c + d;
    if (c < 1) { if (b === 0) return; b--; c = BOOKS[b][1]; }
    else if (c > BOOKS[b][1]) { if (b === NB - 1) return; b++; c = 1; }
    openChapter(b, c, true);
  }
  function jump(i) {
    if (PLACE.test(verses[i])) return;
    cur = i; elIn.value = ''; resetVerse(); renderAll(); say('', '');
    elIn.focus();
    try { elPlay.scrollIntoView({ block: 'nearest' }); } catch (e) {}
  }

  elTrans.addEventListener('change', function () { S.t = elTrans.value; save(); openChapter(S.b, S.c, false); });
  elBook.addEventListener('change', function () { openChapter(+elBook.value, 1, false); });
  elChap.addEventListener('change', function () { openChapter(S.b, +elChap.value, false); });
  elPrev.addEventListener('click', function () { gotoRel(-1); });
  elNext.addEventListener('click', function () { gotoRel(1); });
  $('ty-donenext').addEventListener('click', function () { gotoRel(1); });
  $('ty-doneagain').addEventListener('click', function () {
    var kk = key(); delete S.done[kk]; delete S.fin[kk]; S.del[kk] = Date.now(); save(); touch(); fillBooks(); fillChaps();
    pickStart(); resetVerse(); renderAll(); say('', ''); if (cur >= 0) elIn.focus();
  });
  elSpace.addEventListener('change', function () { S.opts.ignoreSpace = elSpace.checked; save(); paint(); check(); });
  elSkip.addEventListener('click', function () {
    var n = nextTypable(cur);
    if (n < 0 || n === cur) { say('건너뛸 다음 절이 없어요.', 'warn'); return; }
    cur = n; elIn.value = ''; resetVerse(); renderAll(); say('', ''); elIn.focus();
  });
  elRedo.addEventListener('click', function () { elIn.value = ''; resetVerse(); say('', ''); paint(); elIn.focus(); });
  $('ty-reset').addEventListener('click', function () {
    var who = (ACC && ACC.user && ACC.user()) ? '이 기기와 내 계정에 저장된 ' : '이 기기에 저장된 ';
    if (!window.confirm(who + tr().name + ' 성경 타자 기록(쓴 장·글자 수·속도)을 모두 지울까요? 다른 번역의 기록은 그대로 남습니다.')) return;
    var re = S.t === 'krv' ? /^\d+-\d+$/ : new RegExp('^' + S.t + ':'), k;
    for (k in S.done) if (re.test(k)) delete S.done[k];
    for (k in S.fin) if (re.test(k)) delete S.fin[k];
    for (k in S.ts) if (re.test(k)) delete S.ts[k];
    for (k in S.del) if (re.test(k)) delete S.del[k];
    S.rs[S.t] = Date.now(); S.ep = Date.now(); S.devs = {}; S.days = {};   // 계정에 저장된 같은 번역 기록·글자 수도 이 시각 이전 것은 모두 지워진 것으로 합니다
    S.st.ko = { chars: 0, ms: 0 };
    save(); touch(); fillBooks(); fillChaps(); pickStart(); resetVerse(); renderAll(); say('기록을 지웠습니다.', '');
  });
  $('ty-bkgrid').addEventListener('click', function (e) {                // 책별 진행에서 책을 누르면 그 책 1장으로 이동
    var b = e.target.closest('button[data-b]'); if (!b) return;
    openChapter(+b.getAttribute('data-b'), 1, false);
    try { elPlay.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {}
  });
  elList.addEventListener('click', function (e) { var b = e.target.closest('button[data-i]'); if (b) jump(+b.getAttribute('data-i')); });

  /* 입력: 한글은 글자를 "조합"하며 쓰므로, 조합 중인 마지막 글자는 틀린 것으로 보지 않고, 조합이 끝난 뒤에 맞는지 확인합니다 */
  elIn.addEventListener('compositionstart', function () { composing = true; });
  elIn.addEventListener('compositionend', function () { composing = false; paint(); setTimeout(check, 0); });
  elIn.addEventListener('input', function (e) {
    if (cur < 0) return;
    composing = !!e.isComposing;
    if (!startTs && elIn.value) startTs = Date.now();
    if (liveKind === 'ok') say('', '');
    paint();
    if (!composing) check();
  });
  elIn.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    if (e.isComposing || e.keyCode === 229) return;                     // 조합 중 Enter 는 글자를 확정하는 키 — 이어서 compositionend 가 처리합니다
    e.preventDefault();
    if (cur < 0) return;
    if (matches()) finishVerse(); else say('틀리거나 빠진 글자가 있어요. 빨간 글자를 고쳐 주세요.', 'warn');
  });

  /* 찬양 듣기 버튼(site.js)을 눌러 음악을 켠 뒤에는, 마우스·키보드 기기에서 바로 글을 쓸 수 있게 입력칸으로 되돌아옵니다 */
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.mp-fab')) return;
    setTimeout(function () { if (cur >= 0 && !elPlay.hidden && window.matchMedia && matchMedia('(pointer: fine)').matches && document.querySelector('.mp-fab.is-on')) elIn.focus({ preventScroll: true }); }, 700);
  });

  applyLang(); fillBooks(); fillChaps(); renderSummary();
  openChapter(S.b, S.c, true);

  /* ---------- 계정에 저장 (로그인했을 때) ----------
     장마다: done(쓴 절 번호들)은 두 기록을 합치고, 그 장을 "다시 쓰기"로 지운 시각(del)이나 번역 전체 지우기 시각(rs)보다
     오래된 기록은 버립니다. 글자 수·시간은 기기마다 따로 적어 두었다가 더합니다(dev). 지우기(ep) 이전 것은 무시. */
  function mergeTyping(L, R) {
    L = L || {}; R = R || {};
    function g(x, f) { return (x && x[f]) || {}; }
    var out = { v: 1, done: {}, fin: {}, ts: {}, del: {}, rs: {}, ep: 0, dev: {} }, keys = {};
    [L, R].forEach(function (x) { var r = g(x, 'rs'), t; for (t in r) out.rs[t] = Math.max(out.rs[t] || 0, r[t] || 0); });
    [L, R].forEach(function (x) { ['done', 'fin', 'ts', 'del'].forEach(function (f) { var o = g(x, f), k; for (k in o) keys[k] = 1; }); });
    Object.keys(keys).forEach(function (k) {
      var tr = k.indexOf(':') > 0 ? k.split(':')[0] : 'krv';
      var kd = Math.max(g(L, 'del')[k] || 0, g(R, 'del')[k] || 0), d = Math.max(kd, out.rs[tr] || 0);
      var arr = [], seen = {}, ts = 0, fin = 0;
      [L, R].forEach(function (x) {
        var a = g(x, 'done')[k], f = g(x, 'fin')[k], t0 = g(x, 'ts')[k] || 0;
        if (!a && !f) return;
        if (d > 0 && !(t0 > d)) return;                                    // 지운 뒤에 쓴 기록만 남김 (시각이 없는 예전 기록은 지운 기록이 없을 때만 남음)
        (a || []).forEach(function (n) { if (!seen[n]) { seen[n] = 1; arr.push(n); } });
        if (f) fin = 1;
        if (t0 > ts) ts = t0;
      });
      if (arr.length) out.done[k] = arr.sort(function (a, b) { return a - b; });
      if (fin) out.fin[k] = 1;
      if (ts) out.ts[k] = ts;
      if (kd) out.del[k] = kd;
    });
    out.ep = Math.max(L.ep || 0, R.ep || 0);
    [L, R].forEach(function (x) {
      var dv = g(x, 'dev'), id;
      for (id in dv) {
        var e = dv[id] || {}, cur = out.dev[id];
        if ((e.e || 0) < out.ep) continue;
        if (!cur || (e.c || 0) > cur.c) out.dev[id] = { c: e.c || 0, m: e.m || 0, e: e.e || 0, d: e.d || {} };
      }
    });
    return out;
  }
  if (ACC) ACC.register('typing', {
    get: function () {
      var dev = {}, id, ss = stat();
      for (id in S.devs) dev[id] = S.devs[id];
      dev[S.dev] = { c: ss.chars, m: ss.ms, e: S.ep || 0, d: S.days };
      return { v: 1, done: S.done, fin: S.fin, ts: S.ts, del: S.del, rs: S.rs, ep: S.ep || 0, dev: dev };
    },
    merge: mergeTyping,
    set: function (m) {
      var id, me = m.dev[S.dev];
      S.done = m.done; S.fin = m.fin; S.ts = m.ts; S.del = m.del; S.rs = m.rs; S.ep = m.ep;
      S.st.ko = me ? { chars: me.c, ms: me.m } : { chars: 0, ms: 0 };
      S.days = (me && me.d) || {};
      S.devs = {}; for (id in m.dev) if (id !== S.dev) S.devs[id] = m.dev[id];
      save();
      if (!verses.length) { fillBooks(); fillChaps(); renderSummary(); return; }   // 본문을 아직 불러오는 중이면 불러온 뒤 새 기록으로 그려짐
      var before = cur; if (cur >= 0 && isDone(cur)) pickStart();
      if (cur !== before) { elIn.value = ''; resetVerse(); }
      fillBooks(); fillChaps(); renderAll();
    },
    has: function () { return Object.keys(S.done).length > 0; },
    clear: function () {
      S.done = {}; S.fin = {}; S.ts = {}; S.del = {}; S.rs = {}; S.ep = 0; S.devs = {}; S.days = {}; S.st.ko = { chars: 0, ms: 0 };
      save(); if (verses.length) { pickStart(); resetVerse(); } fillBooks(); fillChaps(); renderAll();
    }
  });
})();
