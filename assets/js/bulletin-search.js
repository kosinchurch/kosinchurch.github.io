/* ==========================================================================
   주보 검색 (교회소식 > 주보)
   - assets/bulletins/index.json (주보 PDF 의 글자를 모은 색인)을 처음 쓸 때 한 번 불러와서, 이 화면 안에서 바로 찾습니다.
   - 낱말이 어느 주보 몇 쪽에 있는지 보여 주고, 누르면 PDF 의 그 쪽이 열립니다.
   - 색인 만드는 방법: 새 주보 PDF 를 올린 뒤 _tools 의 안내(README 또는 관리자 메모)대로 다시 만듭니다.
   - 개인정보 보호: 이름이 줄줄이 적힌 헌금자 명단은 색인에서 제외되어 있습니다.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.getElementById('bulletin-search');
  if (!root) return;
  var BASE = document.body.getAttribute('data-root') || './';
  var STEP = 8, MAX_SNIPPETS = 3;
  var TAG_CANDIDATES = ['부흥회', '헌신예배', '수련회', '세례', '성찬', '선교', '새가족', '공동의회', '특별새벽기도', '심방', '교육', '바자회', '찬양대', '봉사', '기도회'];
  var index = null, loading = null, token = 0, state = { hits: [], shown: 0, terms: [] };

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s).normalize('NFC').toLowerCase().replace(/\s+/g, ''); }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function fmt(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? m[1] + '년 ' + (+m[2]) + '월 ' + (+m[3]) + '일' : (d || ''); }

  root.innerHTML =
    '<form class="bs-form" role="search" autocomplete="off">' +
      '<label class="sr-only" for="bs-q">주보에서 찾기</label>' +
      '<span class="bs-field"><svg class="bs-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<input id="bs-q" type="search" inputmode="search" enterkeyhint="search" placeholder="찾을 말을 입력하세요 (예: 부흥회, 수련회, 11월 22일)"></span>' +
      '<button type="submit" class="btn btn--primary">검색</button>' +
    '</form>' +
    '<div class="bs-tags" hidden><span class="bs-tags__label">많이 찾는 말</span></div>' +
    '<p class="bs-status" aria-live="polite">지난 주보에서 사역과 일정, 광고를 찾아 드립니다. (이름이 적힌 헌금 명단은 검색에서 제외됩니다.)</p>' +
    '<ol class="bs-results"></ol>' +
    '<div class="bs-more" hidden><button type="button" class="btn btn--outline">더 보기</button></div>';
  var ui = {
    form: root.querySelector('.bs-form'), input: root.querySelector('#bs-q'), tags: root.querySelector('.bs-tags'),
    status: root.querySelector('.bs-status'), results: root.querySelector('.bs-results'), more: root.querySelector('.bs-more')
  };
  function say(t) { ui.status.textContent = t; }

  /* ---------- 색인 불러오기 ---------- */
  function prep(page) {   // 공백을 뺀 글(ns)과 원래 위치 대응표(map)를 만들어 "회 개 기 도" 같은 띄어쓴 글도 "회개기도"로 찾게 합니다
    var ns = '', map = [];
    for (var i = 0; i < page.length; i++) {
      var c = page.charAt(i); if (/\s/.test(c)) continue;
      var lc = c.toLowerCase(); for (var k = 0; k < lc.length; k++) { ns += lc.charAt(k); map.push(i); }
    }
    return { flat: page.replace(/\n/g, ' '), ns: ns, map: map };
  }
  function load() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = fetch(BASE + 'assets/bulletins/index.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
    }).then(function (j) {
      j.items.forEach(function (it) { it.pp = (it.p || []).map(function (t) { return prep(String(t).normalize('NFC')); }); });
      index = j; buildTags(); return j;
    }, function (e) { loading = null; throw e; });
    return loading;
  }

  /* ---------- 찾기 ---------- */
  function findHits(terms) {
    var hits = [], pages = 0;
    index.items.forEach(function (it) {
      var ph = [];
      it.pp.forEach(function (pg, i) { if (terms.every(function (t) { return pg.ns.indexOf(t) >= 0; })) ph.push({ page: i + 1, pg: pg }); });
      if (ph.length) { hits.push({ it: it, pages: ph }); pages += ph.length; }
    });
    return { hits: hits, pages: pages };
  }
  function snippet(pg, terms) {
    var pos = pg.ns.indexOf(terms[0]), first = pg.map[pos], len = pg.flat.length;
    var ws = Math.max(0, first - 34), we = Math.min(len, first + 96), ranges = [];
    terms.forEach(function (t) {
      var i = -1;
      while ((i = pg.ns.indexOf(t, i + 1)) >= 0) {
        var a = pg.map[i], b = pg.map[i + t.length - 1] + 1;
        if (a >= we) break; if (a >= ws && b <= we) ranges.push([a, b]);
      }
    });
    ranges.sort(function (x, y) { return x[0] - y[0]; });
    var merged = []; ranges.forEach(function (r) { var l = merged[merged.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else merged.push(r.slice()); });
    var html = '', cur = ws;
    merged.forEach(function (r) { html += esc(pg.flat.slice(cur, r[0])) + '<mark class="bs-mark">' + esc(pg.flat.slice(r[0], r[1])) + '</mark>'; cur = r[1]; });
    html += esc(pg.flat.slice(cur, we));
    return (ws > 0 ? '… ' : '') + html.replace(/\s{2,}/g, ' ') + (we < len ? ' …' : '');
  }
  function itemHtml(h, terms) {
    var it = h.it, url = BASE + it.f, sn = h.pages.slice(0, MAX_SNIPPETS), rest = h.pages.slice(MAX_SNIPPETS);
    var title = it.t || (fmt(it.d) + ' 주보');
    return '<li class="bs-item"><div class="bs-head"><strong>' + esc(title) + '</strong><a class="bs-pdf" href="' + esc(url) + '" target="_blank" rel="noopener">PDF 열기</a></div><ul class="bs-hits">' +
      sn.map(function (p) { return '<li><a href="' + esc(url) + '#page=' + p.page + '" target="_blank" rel="noopener" aria-label="' + esc(title) + ' ' + p.page + '쪽 열기"><span class="bs-pg">' + p.page + '쪽</span><span class="bs-sn">' + snippet(p.pg, terms) + '</span></a></li>'; }).join('') +
      (rest.length ? '<li class="bs-rest">그 밖에 ' + rest.map(function (p) { return '<a href="' + esc(url) + '#page=' + p.page + '" target="_blank" rel="noopener">' + p.page + '쪽</a>'; }).join(' · ') + '에서도 찾았습니다.</li>' : '') +
      '</ul></li>';
  }
  function showMore() {
    var list = state.hits.slice(state.shown, state.shown + STEP);
    state.shown += list.length;
    ui.results.insertAdjacentHTML('beforeend', list.map(function (h) { return itemHtml(h, state.terms); }).join(''));
    ui.more.hidden = state.shown >= state.hits.length;
  }
  function run(q, quiet) {
    q = (q || '').trim(); var my = ++token;
    ui.results.innerHTML = ''; ui.more.hidden = true; state = { hits: [], shown: 0, terms: [] };
    try { var u = new URL(location.href); if (q) u.searchParams.set('q', q); else u.searchParams.delete('q'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) {}
    if (!q) { say('지난 주보에서 사역과 일정, 광고를 찾아 드립니다. (이름이 적힌 헌금 명단은 검색에서 제외됩니다.)'); return; }
    var terms = uniq(q.split(/\s+/).map(norm).filter(Boolean));
    if (terms.some(function (t) { return t.length < 2; })) { say('두 글자 이상으로 검색해 주세요.'); return; }
    if (!quiet) say('찾는 중입니다…');
    load().then(function () {
      if (my !== token) return;
      var r = findHits(terms); state.hits = r.hits; state.terms = terms;
      if (!r.hits.length) { say("'" + q + "' 에 맞는 주보가 없습니다. 다른 낱말로 찾아보세요."); return; }
      say("'" + q + "' — 주보 " + r.hits.length + '건(' + r.pages + '쪽)에서 찾았습니다. 최신 주보부터 보여 드립니다.');
      showMore();
    }, function () { if (my === token) say('검색 자료를 불러오지 못했습니다. 잠시 뒤에 다시 시도해 주세요.'); });
  }

  /* ---------- 자주 찾는 말 (결과가 실제로 있는 것만) ---------- */
  function buildTags() {
    var out = [];
    TAG_CANDIDATES.forEach(function (w) { var t = norm(w), n = 0; index.items.forEach(function (it) { if (it.pp.some(function (pg) { return pg.ns.indexOf(t) >= 0; })) n++; }); if (n) out.push({ w: w, n: n }); });
    out.sort(function (a, b) { return b.n - a.n; });
    out = out.slice(0, 8); if (!out.length) return;
    ui.tags.insertAdjacentHTML('beforeend', out.map(function (o) { return '<button type="button" class="bs-tag" data-w="' + esc(o.w) + '">' + esc(o.w) + '</button>'; }).join(''));
    ui.tags.hidden = false;
  }
  ui.tags.addEventListener('click', function (e) { var b = e.target.closest('.bs-tag'); if (!b) return; ui.input.value = b.getAttribute('data-w'); run(ui.input.value); ui.input.focus({ preventScroll: true }); });

  /* ---------- 이벤트 ---------- */
  var timer = null;
  ui.form.addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(timer); run(ui.input.value); ui.input.blur(); });
  ui.input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { var v = ui.input.value.trim(); if (v.length >= 2) run(v, true); else if (!v) run(''); }, 350); });
  ui.input.addEventListener('focus', function () { load().catch(function () {}); });
  ui.more.querySelector('button').addEventListener('click', showMore);
  if ('IntersectionObserver' in window) {   // 검색 칸이 화면 가까이 오면 미리 불러 둡니다
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); load().catch(function () {}); } }, { rootMargin: '500px' });
    io.observe(root);
  }
  var q0 = ''; try { q0 = new URL(location.href).searchParams.get('q') || ''; } catch (e) {}
  if (q0) { ui.input.value = q0; run(q0); }
})();
