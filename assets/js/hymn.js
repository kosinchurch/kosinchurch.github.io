/* ==========================================================================
   찬송가 듣기 (예배·말씀 > 찬송가 듣기)
   - 새찬송가 1장~645장을 번호나 제목으로 찾아 듣습니다. 곡을 누르면 이 페이지 위에서 영상이 바로 재생됩니다
     (재생은 site.js 의 영상 팝업(setupVideoModal)이 맡습니다. Ctrl·⌘·Shift 를 누른 채 누르면 유튜브가 새 탭으로 열립니다).
   - "이어서 듣기"는 50곡씩 묶어 차례로 이어 재생합니다 (유튜브 watch_videos 목록).
   - 곡 목록은 data/hymns.js 의 items (번호 - 1 번째 = [영상 번호, 곡 이름]).
   - 주소 끝에 ?n=305 를 붙이면 그 곡으로 이동해 강조합니다 (소리는 누르면 납니다).
   ========================================================================== */
(function () {
  'use strict';
  var root = document.getElementById('hymn-app');
  if (!root) return;
  var H = window.KOSIN && window.KOSIN.hymns;
  if (!H || !H.items || !H.items.length) { root.innerHTML = '<p>찬송가 자료를 불러오지 못했습니다. 잠시 뒤에 다시 열어 주세요.</p>'; return; }
  var ITEMS = H.items, N = ITEMS.length, RUN = 50;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s).replace(/\s+/g, '').toLowerCase(); }
  function label(n) { return n + '장 ' + ITEMS[n - 1][1]; }

  var rows = '', i;
  for (i = 0; i < N; i++) {
    var n = i + 1;
    rows += '<li id="h' + n + '" data-n="' + n + '" data-k="' + esc(norm(n + ' ' + ITEMS[i][1])) + '"><a class="hy-row" href="https://www.youtube.com/watch?v=' + esc(ITEMS[i][0]) + '" data-vt="' + esc(label(n)) + '" aria-label="' + esc(label(n) + ' 듣기') + '">' +
      '<span class="hy-n">' + n + '</span><span class="hy-t">' + esc(ITEMS[i][1]) + '</span><span class="hy-p"><span aria-hidden="true">&#9654;</span> 듣기</span></a></li>';
  }
  var runs = '';
  for (i = 0; i < N; i += RUN) {
    var from = i + 1, to = Math.min(N, i + RUN), ids = [];
    for (var k = i; k < to; k++) ids.push(ITEMS[k][0]);
    runs += '<a class="hy-run" href="https://www.youtube.com/watch_videos?video_ids=' + ids.join(',') + '" data-vt="찬송가 ' + from + '~' + to + '장 이어서 듣기"><span aria-hidden="true">&#9654;</span> ' + from + '~' + to + '장</a>';
  }

  root.innerHTML =
    '<div class="hy-bar">' +
      '<label class="hy-lab"><span>찬송가 번호</span><input id="hy-num" type="number" inputmode="numeric" min="1" max="' + N + '" placeholder="예) 305" autocomplete="off"></label>' +
      '<button type="button" class="btn btn--primary" id="hy-go">바로 듣기</button>' +
      '<label class="hy-lab hy-grow"><span>제목으로 찾기</span><input id="hy-q" type="search" placeholder="예) 나 같은 죄인" autocomplete="off"></label>' +
    '</div>' +
    '<p class="hy-msg" id="hy-msg" role="status" aria-live="polite"></p>' +
    '<section class="hy-runs" aria-label="이어서 듣기"><h3>이어서 듣기 <small>번호 묶음을 누르면 차례로 이어서 재생됩니다</small></h3><div class="hy-runs__list">' + runs + '</div></section>' +
    '<ol class="hy-list" id="hy-list" aria-label="찬송가 목록">' + rows + '</ol>' +
    '<p class="hy-empty" id="hy-empty" hidden>찾는 곡이 없습니다. 번호나 제목의 일부만 적어 보세요.</p>' +
    '<p class="hy-credit">새찬송가(한국찬송가공회, 645장)의 곡 이름과 번호를 따라 유튜브에 올라 있는 영상(주로 Beecompany 비컴퍼니, 일부 CTS)을 연결합니다. 영상은 유튜브에서 재생되며 이 사이트에 저장하지 않습니다. 영상 주인이 영상을 지우면 그 곡은 재생되지 않을 수 있습니다.</p>';

  function $(id) { return document.getElementById(id); }
  var elNum = $('hy-num'), elQ = $('hy-q'), elList = $('hy-list'), elMsg = $('hy-msg'), elEmpty = $('hy-empty'), elGo = $('hy-go');
  var cur = null;

  function mark(n, scroll) {
    if (cur) cur.classList.remove('is-cur');
    cur = $('h' + n); if (!cur) return;
    cur.classList.add('is-cur');
    if (scroll) { var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; cur.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' }); }
  }
  function applyFilter() {
    var q = norm(elQ.value), shown = 0, lis = elList.children, j;
    for (j = 0; j < lis.length; j++) { var ok = !q || lis[j].getAttribute('data-k').indexOf(q) >= 0; lis[j].hidden = !ok; if (ok) shown++; }
    elEmpty.hidden = shown !== 0;
    elMsg.textContent = q ? shown + '곡을 찾았습니다.' : '';
  }
  function playNumber() {
    var n = parseInt(elNum.value, 10);
    if (!(n >= 1 && n <= N)) { elMsg.textContent = '1부터 ' + N + '까지의 번호를 적어 주세요.'; elNum.focus(); return; }
    if (elQ.value) { elQ.value = ''; applyFilter(); }
    mark(n, true);
    elMsg.textContent = label(n) + ' 을(를) 엽니다.';
    var a = cur && cur.querySelector('a.hy-row'); if (a) a.click();       // 영상 팝업이 열립니다
  }
  elGo.addEventListener('click', playNumber);
  elNum.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); playNumber(); } });
  elQ.addEventListener('input', applyFilter);
  elList.addEventListener('click', function (e) { var li = e.target.closest && e.target.closest('li[data-n]'); if (li) mark(+li.getAttribute('data-n'), false); });

  var m = /[?&]n=(\d+)/.exec(location.search);                              // ?n=305 → 그 곡으로 이동
  if (m && +m[1] >= 1 && +m[1] <= N) { elNum.value = m[1]; setTimeout(function () { mark(+m[1], true); }, 150); }
})();
