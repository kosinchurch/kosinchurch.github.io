/* ==========================================================================
   성경 읽기 (예배·말씀 > 성경 읽기)
   - 번역(개역개정·개역한글)과 책·장을 고르면 그 장의 본문이 절 번호와 함께 나옵니다.
   - 글자 크기는 "가−/가+" 로 바꿉니다 (이 기기의 브라우저가 기억합니다). 마지막으로 읽은 곳·번역도 기억합니다.
   - 주소 끝에 ?b=43&c=3 (책 번호 1~66·장) 을 붙이면 그 장을 바로 엽니다. 번역은 주소에 넣지 않습니다.
   - 장 영상은 data/bible.js 의 videos(유튜브 "공동체성경읽기")를 그대로 써서 "영상으로 듣기" 버튼을 보여 줍니다.
     재생은 site.js 의 영상 팝업(setupVideoModal)이 맡습니다.
   - 본문 파일: assets/bible/<번역>/01.json ~ 66.json (책별 → 장별 → 절 글자). 번역: nkrv 개역개정(성경 타자와 같은 파일), niv NIV.
     "(18절에 포함되어 있음)"·"(본문 준비 중)" 같은 절은 흐리게 보여 줍니다. 장 전체가 null 이면 "준비 중" 안내와 개역개정으로 읽기 버튼이 나옵니다.
     영상·따라 쓰기 버튼은 개역개정에서만 보입니다. 번역을 더하거나 빼려면 아래 TR·ORDER 만 고치면 됩니다.
   - 책 이름·장 수는 data/bible.js 의 books 를 그대로 씁니다.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.getElementById('reading-app');
  if (!root) return;
  var B = window.KOSIN && window.KOSIN.bible;
  if (!B || !B.books || !window.fetch) { root.innerHTML = '<p>성경 읽기 자료를 불러오지 못했습니다. 잠시 뒤에 다시 열어 주세요.</p>'; return; }

  var BOOKS = B.books, NB = BOOKS.length;
  var VID = (B.videos || []).map(function (s) { return String(s).split(','); });   // 책 → 장 → 유튜브 영상 번호
  var BASE = (document.body.getAttribute('data-root') || './') + 'assets/bible/';
  var KEY = 'kosin.reading.v1';
  var TR = {
    nkrv: { name: '개역개정', dir: 'nkrv/', lang: 'ko', ko: true, credit: '본문: 성경전서 개역개정판 ⓒ 대한성서공회. 교회 홈페이지의 성경 읽기·타자 용도로 싣습니다. (본문 글자는 그대로이고, 소제목과 각주 번호만 뺐습니다.)' },
    niv: { name: 'NIV', dir: 'niv/', lang: 'en', ko: false, credit: 'Scripture: Holy Bible, New International Version® (NIV®, 1984). Copyright © 1973, 1978, 1984 by International Bible Society (Biblica, Inc.®). 교회 홈페이지의 성경 읽기 용도로 싣습니다. 모든 권리는 저작권자에게 있습니다.' }
  };
  var ORDER = ['nkrv', 'niv'];
  var PLACE = /^\((\d+절에 포함되어 있음|원문에 없음|NIV 본문에 없음|본문 준비 중)\)$/;   // 앞 절에 합쳐졌거나 원문(NIV 포함)에 없는 절, 아직 본문이 없는 절(흐리게 보여 줍니다)
  var SIZES = [1.05, 1.2, 1.35, 1.55, 1.8];                     // 본문 글자 크기(rem) — 가운데(1.35)가 기본
  var CACHE = {};

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function unit(b) { return b === 18 ? '편' : '장'; }                      // 시편만 "편"
  function label(b, c) { return BOOKS[b][0] + (BOOKS[b][1] === 1 ? '' : ' ' + c + unit(b)); }   // 한 장짜리 책(오바댜 등)은 "오바댜"

  /* ---------- 저장 ---------- */
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s === 'object') return s; } catch (e) {}
    return {};
  }
  var S = load();
  if (!TR[S.t]) S.t = 'nkrv';                                    // 개역개정이 기본
  if (!(S.z >= 0 && S.z < SIZES.length)) S.z = (window.innerWidth <= 560 ? 1 : 2);   // 처음 여는 휴대폰은 한 단계 작게(한 줄에 글자가 더 들어가도록), 이후는 고른 크기를 기억
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ t: S.t, b: S.b, c: S.c, z: S.z })); } catch (e) {} }

  (function () {                                                 // 주소의 ?b=&c= 가 있으면 그 장, 없으면 마지막으로 읽은 곳, 처음이면 창세기 1장
    var m = /[?&]b=(\d+)/.exec(location.search), n = /[?&]c=(\d+)/.exec(location.search);
    if (m && +m[1] >= 1 && +m[1] <= NB) { S.b = +m[1] - 1; S.c = (n && +n[1] >= 1 && +n[1] <= BOOKS[S.b][1]) ? +n[1] : 1; }
    if (!(S.b >= 0 && S.b < NB)) S.b = 0;
    if (!(S.c >= 1 && S.c <= BOOKS[S.b][1])) S.c = 1;
  })();

  /* ---------- 화면 뼈대 ---------- */
  function bookOpts() {
    function grp(name, from, to) {
      var h = '<optgroup label="' + name + '">';
      for (var i = from; i < to; i++) h += '<option value="' + i + '">' + esc(BOOKS[i][0]) + '</option>';
      return h + '</optgroup>';
    }
    return grp('구약', 0, 39) + grp('신약', 39, NB);
  }
  root.innerHTML =
    '<div class="rd-bar">' +
      '<div class="rd-pick">' +
        '<label class="rd-lab"><span>번역</span><select id="rd-trans">' + ORDER.map(function (k) { return '<option value="' + k + '">' + esc(TR[k].name) + '</option>'; }).join('') + '</select></label>' +
        '<label class="rd-lab"><span>책</span><select id="rd-book">' + bookOpts() + '</select></label>' +
        '<label class="rd-lab"><span>장</span><select id="rd-chap"></select></label>' +
      '</div>' +
      '<div class="rd-tools">' +
        '<div class="rd-size" role="group" aria-label="글자 크기"><button type="button" class="btn btn--outline btn--sm" id="rd-smaller" aria-label="글자 작게">가 −</button><button type="button" class="btn btn--outline btn--sm" id="rd-bigger" aria-label="글자 크게">가 +</button></div>' +
      '</div>' +
    '</div>' +
    '<article class="rd-sheet" id="rd-sheet" aria-labelledby="rd-title">' +
      '<header class="rd-head"><div><span class="rd-tr" id="rd-tr"></span><h2 class="rd-title" id="rd-title"></h2></div><div class="rd-acts" id="rd-acts"></div></header>' +
      '<div id="rd-body" class="rd-body" aria-live="polite"></div>' +
    '</article>' +
    '<nav class="rd-nav" aria-label="앞뒤 장 이동"><button type="button" class="btn btn--outline" id="rd-prev"></button><button type="button" class="btn btn--primary" id="rd-next"></button></nav>' +
    '<p class="rd-credit" id="rd-credit"></p>' +
    '<p class="rd-credit">영상은 유튜브 채널 <a href="' + esc(B.channel || 'https://www.youtube.com/@PRS') + '" target="_blank" rel="noopener">공동체성경읽기</a>의 장별 구절 영상(개역개정)입니다. 마지막으로 읽은 곳과 글자 크기는 이 기기의 브라우저에만 저장됩니다.</p>';

  function $(id) { return document.getElementById(id); }
  var elTrans = $('rd-trans'), elBook = $('rd-book'), elChap = $('rd-chap'), elBody = $('rd-body'), elTitle = $('rd-title'), elTr = $('rd-tr'),
      elActs = $('rd-acts'), elPrev = $('rd-prev'), elNext = $('rd-next'), elCredit = $('rd-credit'), elBar = root.querySelector('.rd-bar'),
      elSmaller = $('rd-smaller'), elBigger = $('rd-bigger');
  var token = 0;

  /* ---------- 본문 불러오기 ---------- */
  function getBook(t, b) {
    var ck = t + ':' + b;
    if (CACHE[ck]) return Promise.resolve(CACHE[ck]);
    return fetch(BASE + TR[t].dir + pad(b + 1) + '.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { CACHE[ck] = d; return d; });
  }
  function prevOf() { return S.c > 1 ? [S.b, S.c - 1] : (S.b > 0 ? [S.b - 1, BOOKS[S.b - 1][1]] : null); }
  function nextOf() { return S.c < BOOKS[S.b][1] ? [S.b, S.c + 1] : (S.b < NB - 1 ? [S.b + 1, 1] : null); }

  function fillChaps() {
    var n = BOOKS[S.b][1], h = '', i;
    for (i = 1; i <= n; i++) h += '<option value="' + i + '">' + i + unit(S.b) + '</option>';
    elChap.innerHTML = h;
  }
  function applySize() {
    root.style.setProperty('--rd-fs', SIZES[S.z] + 'rem');
    elSmaller.disabled = S.z <= 0; elBigger.disabled = S.z >= SIZES.length - 1;
  }
  function navBtn(el, target, dir) {
    if (!target) { el.hidden = true; return; }
    el.hidden = false;
    el.setAttribute('data-b', target[0]); el.setAttribute('data-c', target[1]);
    var name = label(target[0], target[1]);
    el.innerHTML = dir < 0 ? '&lsaquo; ' + esc(name) : esc(name) + ' &rsaquo;';
    el.setAttribute('aria-label', (dir < 0 ? '이전 장: ' : '다음 장: ') + name);
  }
  function syncUrl() { try { history.replaceState(null, '', location.pathname + '?b=' + (S.b + 1) + '&c=' + S.c + location.hash); } catch (e) {} }

  function show(scroll) {
    var my = ++token, b = S.b, c = S.c, t = S.t;
    elTrans.value = t; elBook.value = b;
    if (+elChap.getAttribute('data-b') !== b || !elChap.options.length) { fillChaps(); elChap.setAttribute('data-b', b); }
    elChap.value = c;
    elTitle.textContent = label(b, c); elTr.textContent = TR[t].name;
    elCredit.textContent = TR[t].credit;
    var vid = (VID[b] || [])[c - 1];
    elActs.innerHTML = !TR[t].ko ? '' :                          // 영상(개역개정 낭독)과 따라 쓰기는 개역개정에서만
      (vid ? '<a class="btn btn--outline btn--sm" href="https://www.youtube.com/watch?v=' + esc(vid) + '" data-vt="' + esc(label(b, c)) + '"><span aria-hidden="true">&#9654;</span> 영상으로 듣기</a>' : '') +
      '<a class="btn btn--outline btn--sm" href="typing.html?b=' + (b + 1) + '&amp;c=' + c + '">따라 쓰기</a>';
    root.setAttribute('data-lang', TR[t].lang);
    navBtn(elPrev, prevOf(), -1); navBtn(elNext, nextOf(), 1);
    document.title = label(b, c) + ' | 성경 읽기 | 고신교회';
    save(); syncUrl();
    elBody.innerHTML = '<p class="rd-msg">말씀을 불러오는 중입니다…</p>';
    if (scroll) {
      var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      elBar.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' });
    }
    getBook(t, b).then(function (d) {
      if (my !== token) return;                                  // 그 사이 다른 장을 골랐으면 그 장이 그려집니다
      var vs = d[c - 1];
      if (vs === null && t !== 'nkrv') {                         // 이 번역에 본문이 아직 없는 장 → 개역개정으로 읽도록 안내
        elBody.innerHTML = '<p class="rd-msg">이 장의 ' + esc(TR[t].name) + ' 본문은 준비 중입니다. 개역개정으로 읽어 주세요.</p><p><button type="button" class="btn btn--primary" id="rd-tonk">개역개정으로 읽기</button></p>';
        var tb = $('rd-tonk'); if (tb) tb.addEventListener('click', function () { S.t = 'nkrv'; show(false); });
        return;
      }
      if (!vs || !vs.length) throw new Error('empty');
      elBody.innerHTML = '<ol class="rd-verses" lang="' + TR[t].lang + '">' + vs.map(function (v, i) {
        return '<li' + (PLACE.test(v) ? ' class="is-merged"' : '') + '><span class="rd-n">' + (i + 1) + '</span><span class="rd-t">' + esc(v) + '</span></li>';
      }).join('') + '</ol>';
      var nb = nextOf(); if (nb && !CACHE[t + ':' + nb[0]]) getBook(t, nb[0]).catch(function () {});   // 다음 책 본문을 미리 받아 둡니다
    }).catch(function () {
      if (my !== token) return;
      elBody.innerHTML = '<p class="rd-msg">말씀을 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.</p><p><button type="button" class="btn btn--primary" id="rd-retry">다시 불러오기</button></p>';
      var rb = $('rd-retry'); if (rb) rb.addEventListener('click', function () { show(false); });
    });
  }

  function go(b, c, scroll) { S.b = b; S.c = c; show(scroll); }

  /* ---------- 조작 ---------- */
  elTrans.addEventListener('change', function () { if (TR[elTrans.value]) { S.t = elTrans.value; show(false); } });
  elBook.addEventListener('change', function () { go(+elBook.value, 1, false); });
  elChap.addEventListener('change', function () { go(S.b, +elChap.value, false); });
  function step(el) { var b = +el.getAttribute('data-b'), c = +el.getAttribute('data-c'); if (b >= 0 && c >= 1) go(b, c, true); }
  elPrev.addEventListener('click', function () { step(elPrev); });
  elNext.addEventListener('click', function () { step(elNext); });
  elSmaller.addEventListener('click', function () { if (S.z > 0) { S.z--; applySize(); save(); } });
  elBigger.addEventListener('click', function () { if (S.z < SIZES.length - 1) { S.z++; applySize(); save(); } });
  document.addEventListener('keydown', function (e) {            // 키보드 ← → 로 앞뒤 장 (선택 상자·입력칸 안에서는 쓰지 않음)
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var tag = (e.target && e.target.tagName) || '';
    if (/^(SELECT|INPUT|TEXTAREA)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
    if (document.documentElement.classList.contains('vm-open')) return;
    if (e.key === 'ArrowLeft' && !elPrev.hidden) step(elPrev);
    else if (e.key === 'ArrowRight' && !elNext.hidden) step(elNext);
  });

  applySize();
  show(false);
})();
