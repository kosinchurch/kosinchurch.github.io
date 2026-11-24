/* ==========================================================================
   주보 검색 · 글자 주보 보기 (교회소식 > 주보)
   - 올해 주보  : assets/bulletins/index.json  (PDF 의 글자를 모은 색인) → 결과를 누르면 PDF 의 그 쪽이 열립니다.
   - 지난 주보  : assets/bulletins/archive/YYYY.json (용량 때문에 PDF 대신 글자로만 보관) → 결과를 누르면 이 페이지 안에서 글자로 열립니다 (?id=…).
   - 처음 쓸 때 한 번 불러와서 이 화면 안에서 바로 찾습니다.
   - 색인 만드는 방법: 새 주보 PDF 를 올린 뒤 관리자 메모(README)대로 index.json 을 다시 만듭니다. 해가 바뀌면 지난해 주보를 archive 로 옮깁니다.
   - 개인정보 보호: 이름이 줄줄이 적힌 헌금자 명단은 색인과 글자 주보에서 모두 제외되어 있습니다.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.getElementById('bulletin-search');
  var view = document.getElementById('bulletin-view');
  var mainBox = document.getElementById('bulletin-main');
  if (!root && !view) return;
  var BASE = document.body.getAttribute('data-root') || './';
  var STEP = 8, MAX_SNIPPETS = 3;
  var TAG_CANDIDATES = ['부흥회', '헌신예배', '수련회', '세례', '성찬', '선교', '새가족', '공동의회', '특별새벽기도', '심방', '교육', '바자회', '찬양대', '봉사', '기도회'];
  var LANG = { en: '영문', ru: '러시아어' };
  var params = null; try { params = new URL(location.href).searchParams; } catch (e) {}
  function param(k) { return params ? (params.get(k) || '') : ''; }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s).normalize('NFC').toLowerCase().replace(/\s+/g, ''); }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function fmt(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? m[1] + '년 ' + (+m[2]) + '월 ' + (+m[3]) + '일' : (d || ''); }
  function getJSON(url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); }

  /* ---------- 글 준비: 공백을 뺀 글(ns) — "회 개 기 도" 같은 띄어쓴 글도 "회개기도"로 찾게 합니다 ---------- */
  function prep(t) { var raw = String(t || '').normalize('NFC'); return { raw: raw, ns: raw.toLowerCase().replace(/\s+/g, '') }; }
  function mapOf(pg) {   // 공백 뺀 글의 위치 → 원래 글의 위치 대응표 (보여 줄 때만 만듭니다)
    if (pg.map) return pg;
    var map = [], raw = pg.raw;
    for (var i = 0; i < raw.length; i++) {
      var c = raw.charAt(i); if (/\s/.test(c)) continue;
      var lc = c.toLowerCase(); for (var k = 0; k < lc.length; k++) map.push(i);
    }
    pg.map = map; return pg;
  }
  function rangesOf(pg, terms, from, to) {   // 찾는 말이 있는 구간들 (원래 글 기준, 겹치면 합침)
    mapOf(pg); var out = [];
    terms.forEach(function (t) {
      var i = -1;
      while ((i = pg.ns.indexOf(t, i + 1)) >= 0) {
        var a = pg.map[i], b = pg.map[i + t.length - 1] + 1;
        if (to != null && a >= to) break;
        if (from == null || (a >= from && b <= to)) out.push([a, b]);
      }
    });
    out.sort(function (x, y) { return x[0] - y[0]; });
    var merged = []; out.forEach(function (r) { var l = merged[merged.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else merged.push(r.slice()); });
    return merged;
  }
  function markAll(pg, terms) {   // 한 쪽 전체 글에서 찾는 말을 표시 (글자 주보 보기)
    if (!terms.length) return esc(pg.raw);
    var html = '', cur = 0;
    rangesOf(pg, terms).forEach(function (r) { html += esc(pg.raw.slice(cur, r[0])) + '<mark class="bs-mark">' + esc(pg.raw.slice(r[0], r[1])) + '</mark>'; cur = r[1]; });
    return html + esc(pg.raw.slice(cur));
  }

  /* ---------- 자료 불러오기 ---------- */
  var manifestP = null, yearP = {};
  function loadManifest() {   // 글자로 보관한 지난 주보 목록 (없으면 빈 목록)
    if (!manifestP) manifestP = getJSON(BASE + 'assets/bulletins/archive/index.json').then(function (j) { return j && j.years ? j : { years: [] }; }, function () { return { years: [] }; });
    return manifestP;
  }
  function loadYear(y) {
    if (!yearP[y]) yearP[y] = getJSON(BASE + 'assets/bulletins/archive/' + y + '.json').then(function (j) { return j; }, function () { return { items: [] }; });
    return yearP[y];
  }

  /* =====================================================================
     글자 주보 보기  (?id=2022-01-09  [&q=찾던말] [#p3])
     ===================================================================== */
  function renderView(id) {
    if (mainBox) mainBox.hidden = true;
    view.hidden = false;
    view.innerHTML = '<p class="bs-status" aria-live="polite">주보를 불러오는 중입니다…</p>';
    var q = param('q'), terms = uniq(q.split(/\s+/).map(norm).filter(function (t) { return t.length >= 2; }));
    function fail(msg) {
      view.innerHTML = '<div class="empty">' + esc(msg) + '<br><a class="btn btn--outline" style="margin-top:14px" href="bulletin.html">주보 목록으로</a></div>';
    }
    loadManifest().then(function (m) {
      var meta = null, yr = null, all = [];
      (m.years || []).forEach(function (y) { (y.items || []).forEach(function (a) { all.push(a); if (a.id === id) { meta = a; yr = y.y; } }); });
      if (!meta) { fail('찾으시는 주보가 없습니다.'); return; }
      return loadYear(yr).then(function (yd) {
        var it = null; (yd.items || []).forEach(function (x) { if (x.id === id) it = x; });
        if (!it) { fail('주보 내용을 불러오지 못했습니다. 잠시 뒤에 다시 시도해 주세요.'); return; }
        // 이전·다음 주 (같은 종류끼리: 한국어 주보는 한국어 주보끼리, 영문은 영문끼리, 절기 순서지는 순서지끼리)
        var kind = it.l + (it.s ? '1' : '0');
        var peers = all.filter(function (a) { return (a.l + (a.s ? '1' : '0')) === kind; }).sort(function (a, b) { return String(a.d).localeCompare(String(b.d)); });
        var pos = -1; peers.forEach(function (a, i) { if (a.id === id) pos = i; });
        var older = pos > 0 ? peers[pos - 1] : null, newer = pos >= 0 && pos < peers.length - 1 ? peers[pos + 1] : null;
        function href(a) { return 'bulletin.html?id=' + encodeURIComponent(a.id) + '&year=' + String(a.d).slice(0, 4) + (q ? '&q=' + encodeURIComponent(q) : ''); }
        var pages = (it.p || []).map(prep);
        var jump = pages.length > 1 ? '<nav class="bv-jump" aria-label="쪽 이동">' + pages.map(function (p, i) { return '<a href="#p' + (i + 1) + '" data-p="' + (i + 1) + '">' + (i + 1) + '쪽</a>'; }).join('') + '</nav>' : '';
        view.innerHTML =
          '<div class="bv-top"><a class="btn btn--outline" href="bulletin.html?year=' + yr + '">&larr; ' + yr + '년 주보 목록</a></div>' +
          '<article class="bv">' +
            '<header class="bv-head"><p class="bv-meta">' + esc(fmt(it.d)) + (LANG[it.l] ? ' · <span class="badge badge--gold">' + LANG[it.l] + '</span>' : '') + (it.s ? ' · <span class="badge">' + esc(it.s) + '</span>' : '') + '</p>' +
            '<h2>' + esc(it.t) + '</h2>' +
            '<p class="bv-note">이 주보는 저장 용량을 아끼려고 <b>글자로만</b> 보관한 것입니다. 사진·그림·서식은 담기지 않았고, 이름이 적힌 헌금 명단은 뺐습니다. 원본 파일이 필요하시면 교회 사무실(051-895-2251)로 문의해 주세요.</p>' +
            (terms.length ? '<p class="bv-find">찾으신 말 <mark class="bs-mark">' + esc(q) + '</mark> 을(를) 표시했습니다.</p>' : '') + jump + '</header>' +
            pages.map(function (p, i) { return '<section class="bv-page" id="bv-p' + (i + 1) + '" aria-label="' + (i + 1) + '쪽"><h3><span class="bs-pg">' + (i + 1) + '쪽</span></h3><div class="bv-text">' + (p.raw.trim() ? markAll(p, terms) : '<span class="bv-empty">이 쪽에는 보여 드릴 글자가 없습니다. (그림만 있거나 헌금 명단이 있는 쪽입니다.)</span>') + '</div></section>'; }).join('') +
            '<nav class="bv-nav" aria-label="이전·다음 주보">' +
              (older ? '<a class="bv-prev" href="' + esc(href(older)) + '"><small>이전 주보</small><span>' + esc(older.t) + '</span></a>' : '<span></span>') +
              (newer ? '<a class="bv-next" href="' + esc(href(newer)) + '"><small>다음 주보</small><span>' + esc(newer.t) + '</span></a>' : '<span></span>') +
            '</nav>' +
          '</article>';
        try { document.title = it.t + ' | 고신교회'; } catch (e) {}
        function goPage(n, smooth) {
          var el = document.getElementById('bv-p' + n); if (!el) return;
          try { el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' }); } catch (e) { el.scrollIntoView(); }
        }
        var jn = view.querySelector('.bv-jump');
        if (jn) jn.addEventListener('click', function (e) {
          var a = e.target.closest('a[data-p]'); if (!a) return; e.preventDefault();
          goPage(+a.getAttribute('data-p'), true);
          try { history.replaceState(null, '', location.pathname + location.search + '#p' + a.getAttribute('data-p')); } catch (er) {}
        });
        var hm = /^#p(\d+)$/.exec(location.hash || '');
        if (hm) setTimeout(function () { goPage(+hm[1], false); }, 60);
        else if (terms.length) {   // 찾아서 들어왔는데 쪽을 지정하지 않았다면 처음 찾은 말로
          var first = view.querySelector('.bv-text mark.bs-mark'); if (first) setTimeout(function () { try { first.scrollIntoView({ block: 'center' }); } catch (e) {} }, 60);
        }
      });
    }).then(null, function () { fail('주보를 불러오지 못했습니다. 잠시 뒤에 다시 시도해 주세요.'); });
  }

  var idParam = param('id');
  if (view && idParam) { renderView(idParam); return; }
  if (!root) return;

  /* =====================================================================
     주보 검색
     ===================================================================== */
  var index = null, loading = null, token = 0, state = { hits: [], shown: 0, terms: [], q: '' };
  var IDLE = '지난 주보(2022년부터)에서 사역과 일정, 광고를 찾아 드립니다. 이름이 적힌 헌금 명단은 검색에서 제외됩니다.';

  root.innerHTML =
    '<form class="bs-form" role="search" autocomplete="off">' +
      '<label class="sr-only" for="bs-q">주보에서 찾기</label>' +
      '<span class="bs-field"><svg class="bs-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<input id="bs-q" type="search" inputmode="search" enterkeyhint="search" placeholder="찾을 말을 입력하세요 (예: 부흥회, 수련회, 11월 22일)"></span>' +
      '<button type="submit" class="btn btn--primary">검색</button>' +
    '</form>' +
    '<div class="bs-tags" hidden><span class="bs-tags__label">많이 찾는 말</span></div>' +
    '<p class="bs-status" aria-live="polite">' + IDLE + '</p>' +
    '<ol class="bs-results"></ol>' +
    '<div class="bs-more" hidden><button type="button" class="btn btn--outline">더 보기</button></div>';
  var ui = {
    form: root.querySelector('.bs-form'), input: root.querySelector('#bs-q'), tags: root.querySelector('.bs-tags'),
    status: root.querySelector('.bs-status'), results: root.querySelector('.bs-results'), more: root.querySelector('.bs-more')
  };
  function say(t) { ui.status.textContent = t; }

  function load() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    var pdfP = getJSON(BASE + 'assets/bulletins/index.json').then(function (j) { return j.items || []; }, function () { return null; });
    var arcP = loadManifest().then(function (m) { return Promise.all((m.years || []).map(function (y) { return loadYear(y.y); })); });
    loading = Promise.all([pdfP, arcP]).then(function (res) {
      var items = [];
      if (res[0]) res[0].forEach(function (it) { it.pp = (it.p || []).map(prep); items.push(it); });
      res[1].forEach(function (yd) { (yd.items || []).forEach(function (it) { it.a = true; it.pp = (it.p || []).map(prep); items.push(it); }); });
      if (!items.length) throw new Error('empty');
      var order = { ko: 0, en: 1, ru: 2 };
      items.sort(function (a, b) { return String(b.d).localeCompare(String(a.d)) || ((order[a.l] || 0) - (order[b.l] || 0)); });
      index = { items: items }; buildTags(); return index;
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
    mapOf(pg);
    var flat = pg.raw.replace(/\n/g, ' '), first = pg.map[pg.ns.indexOf(terms[0])], len = flat.length;
    var ws = Math.max(0, first - 34), we = Math.min(len, first + 96);
    var html = '', cur = ws;
    rangesOf(pg, terms, ws, we).forEach(function (r) { html += esc(flat.slice(cur, r[0])) + '<mark class="bs-mark">' + esc(flat.slice(r[0], r[1])) + '</mark>'; cur = r[1]; });
    html += esc(flat.slice(cur, we));
    return (ws > 0 ? '… ' : '') + html.replace(/\s{2,}/g, ' ') + (we < len ? ' …' : '');
  }
  function itemHtml(h, terms) {
    var it = h.it, sn = h.pages.slice(0, MAX_SNIPPETS), rest = h.pages.slice(MAX_SNIPPETS);
    var title = it.t || (fmt(it.d) + ' 주보');
    var base, pageUrl, ext;
    if (it.a) {   // 글자로 보관한 지난 주보 → 이 페이지 안에서 열기
      base = 'bulletin.html?id=' + encodeURIComponent(it.id) + '&year=' + String(it.d).slice(0, 4) + (state.q ? '&q=' + encodeURIComponent(state.q) : '');
      pageUrl = function (p) { return base + '#p' + p; }; ext = '';
    } else {      // 올해 주보 → PDF 의 그 쪽
      base = BASE + it.f; pageUrl = function (p) { return base + '#page=' + p; }; ext = ' target="_blank" rel="noopener"';
    }
    var lang = LANG[it.l] ? ' <span class="badge badge--gold">' + LANG[it.l] + '</span>' : '';
    return '<li class="bs-item"><div class="bs-head"><strong>' + esc(title) + lang + '</strong><a class="bs-pdf" href="' + esc(base) + '"' + ext + '>' + (it.a ? '글자로 보기' : 'PDF 열기') + '</a></div><ul class="bs-hits">' +
      sn.map(function (p) { return '<li><a href="' + esc(pageUrl(p.page)) + '"' + ext + ' aria-label="' + esc(title) + ' ' + p.page + '쪽 열기"><span class="bs-pg">' + p.page + '쪽</span><span class="bs-sn">' + snippet(p.pg, terms) + '</span></a></li>'; }).join('') +
      (rest.length ? '<li class="bs-rest">그 밖에 ' + rest.map(function (p) { return '<a href="' + esc(pageUrl(p.page)) + '"' + ext + '>' + p.page + '쪽</a>'; }).join(' · ') + '에서도 찾았습니다.</li>' : '') +
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
    ui.results.innerHTML = ''; ui.more.hidden = true; state = { hits: [], shown: 0, terms: [], q: q };
    try { var u = new URL(location.href); if (q) u.searchParams.set('q', q); else u.searchParams.delete('q'); u.searchParams.delete('id'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) {}
    if (!q) { say(IDLE); return; }
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
  var q0 = param('q');
  if (q0) { ui.input.value = q0; run(q0); }
})();
