/* ==========================================================================
   로그인 · 기록 저장 (성경 통독 · 성경 타자) — 카카오톡 / 구글 로그인, 서비스는 Supabase(무료)
   ----------------------------------------------------------------------
   - 처음 로그인하면 자동으로 가입됩니다. 이메일·비밀번호·입력칸이 없습니다. (카카오·구글 화면에서 "동의"만 누르면 끝)
   - 기록은 먼저 이 기기(localStorage)에 저장되고, 로그인한 상태라면 몇 초 뒤 계정(Supabase 의 user_progress 표)에도 자동으로 저장됩니다.
     다른 기기에서 같은 계정으로 로그인하면 두 기록을 합쳐서(지운 것은 지운 대로) 이어서 보여 줍니다.
   - 로그인하지 않은 사람은 아무것도 달라지지 않습니다. (로그인 도구는 로그인한 사람·로그인 버튼을 누른 사람에게만 내려받습니다)
   - 설정: data/account.js (프로젝트 주소 + 공개용 키). 비어 있으면 이 기능은 통째로 꺼진 채 아무것도 보이지 않습니다.
   - 화면에 붙이는 법: 페이지에 <div id="account-bar"></div>, data/account.js, 이 파일, assets/css/account.css 를 넣고,
     기록을 가진 쪽(typing.js, bible.js)이 KOSIN.account.register('종류', {get, merge, set, has, clear}) 로 등록한 뒤
     기록이 바뀔 때마다 KOSIN.account.touch('종류') 를 부르면 됩니다.
       get()           → 이 기기의 기록(JSON 으로 저장 가능한 객체)
       merge(내것, 계정것) → 두 기록을 합친 새 객체 (계정것은 처음에는 null)
       set(합친것)       → 합친 기록을 이 기기에 저장하고 화면을 새로 그림
       has()           → 이 기기에 기록이 있는지(true/false)
       clear()         → 이 기기의 기록 지우기 (공용 컴퓨터에서 로그아웃할 때)
   - 필요한 서버 설정(표·보안 규칙·탈퇴 함수): supabase-setup.sql 참고 (저장소에는 올리지 않고 교회 관리자 문서로 보관)
   - 계정 서버가 멈추거나 키가 틀려도 이 기기의 기록 쓰기는 그대로 동작합니다. (저장 실패 안내만 보임)
   ========================================================================== */
(function () {
  'use strict';
  var K = (window.KOSIN = window.KOSIN || {});
  var cfg = K.accountCfg || {};
  var LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.109.0/dist/umd/supabase.js';
  var STORE = 'kosin.auth';                       // 로그인 정보가 저장되는 곳(이 브라우저 안)
  var LAST = 'kosin.auth.last';                   // 이 기기에 남아 있는 기록의 주인(계정 번호)
  var ON = cfg.enabled !== false && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(cfg.supabaseUrl || '') && String(cfg.supabaseKey || '').length > 20;

  var H = {}, T = {}, sb = null, user = null, busy = 0, lastAt = 0, lastErr = '', msg = '', connecting = false, mode = '', clock = 0;
  /* ready: 페이지의 다른 스크립트(typing.js·bible.js)가 기록을 등록하고 난 뒤부터 true. hold: "누구 기록인가요?" 질문에 답하기 전에는 합치지 않음 */
  var ready = false, pendingLogin = false, hold = false, msgOk = false;     // msgOk: 안내 글이 오류가 아닌 인사말일 때
  function markReady() { if (ready) return; ready = true; if (pendingLogin) { pendingLogin = false; if (user) onLogin(); } }
  document.addEventListener('DOMContentLoaded', markReady);                  // 지연(defer) 스크립트는 모두 이 시점 전에 실행됩니다
  if (document.readyState === 'complete') markReady(); else setTimeout(markReady, 4000);
  var API = {
    enabled: function () { return ON; },
    user: function () { return user; },
    register: function () {}, touch: function () {}, syncNow: function () {}
  };
  K.account = API;
  if (!ON) return;

  /* OAuth(카카오·구글)에서 돌아온 주소의 code 를 지금 붙잡아 둡니다 (뒤에 실행되는 페이지 스크립트가 주소를 고치기 전에) */
  var returned = (function () {
    try { var p = new URLSearchParams(location.search), c = p.get('code'), e = p.get('error_description') || p.get('error'); return (c || e) ? { code: c, err: e } : null; } catch (e) { return null; }
  })();

  if (returned) {                                  // 주소에서 로그인용 일회용 값(code·error…)은 바로 지워서, 새로고침해도 다시 쓰이지 않게
    try {
      var cl = new URLSearchParams(location.search); ['code', 'error', 'error_code', 'error_description'].forEach(function (n) { cl.delete(n); });
      history.replaceState(null, '', location.pathname + (cl.toString() ? '?' + cl.toString() : '') + location.hash);
    } catch (e) {}
  }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function canon(o) {                              // 키 순서와 상관없이 같은 내용이면 같은 글자가 되도록
    if (Array.isArray(o)) return '[' + o.map(canon).join(',') + ']';
    if (o && typeof o === 'object') return '{' + Object.keys(o).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(o[k]); }).join(',') + '}';
    return JSON.stringify(o);
  }
  function root() { return document.body.getAttribute('data-root') || './'; }
  function hasSession() { return !!ls(STORE); }

  /* ---------- 로그인 도구(Supabase) 불러오기 ---------- */
  function lib(ok, bad) {
    if (window.supabase && window.supabase.createClient) { ok(); return; }
    var s = document.createElement('script'); s.src = LIB; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = ok; s.onerror = function () { if (s.parentNode) s.parentNode.removeChild(s); if (bad) bad(); };
    document.head.appendChild(s);
  }
  function client() {
    if (!sb) sb = window.supabase.createClient(cfg.supabaseUrl.replace(/\/$/, ''), cfg.supabaseKey, {
      auth: { flowType: 'pkce', storageKey: STORE, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    return sb;
  }

  /* ---------- 화면 ---------- */
  var KAKAO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#191919" d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.3 4.7 6.7l-1 3.6c-.1.3.3.6.6.4l4.2-2.8c.5.1 1 .1 1.5.1 5.5 0 10-3.5 10-7.9S17.5 3 12 3z"/></svg>';
  var GOOGLE = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.5 0 24 0 14.6 0 6.5 5.4 2.6 13.2l8 6.2C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M47 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.9c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 7.2-10.4 7.2-17.6z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-8-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-4.9 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9l-8 6.2C6.5 42.6 14.6 48 24 48z"/></svg>';
  function ago(t) {
    var s = Math.round((Date.now() - t) / 1000);
    return s < 45 ? '방금' : s < 3600 ? Math.round(s / 60) + '분 전' : Math.round(s / 3600) + '시간 전';
  }
  function statusText() {
    if (busy) return ['저장하는 중…', ''];
    if (lastErr) return ['저장하지 못했어요. 인터넷을 확인해 주세요. (이 기기에는 저장되어 있어요)', 'is-err'];
    if (lastAt) return ['✓ 기록이 저장되고 있어요 · ' + ago(lastAt), ''];
    return ['기록을 확인하는 중…', ''];
  }
  function displayName() {
    var m = (user && user.user_metadata) || {};
    return m.name || m.full_name || m.nickname || m.preferred_username || '회원';
  }
  function render() {
    var el = document.getElementById('account-bar'); if (!el) return;
    var want = user ? 'in' : (connecting ? 'wait' : 'out');
    if (want === mode && el.firstChild) {          // 같은 모양이면 안내 글만 바꿉니다 (누르던 버튼이 사라지지 않게)
      var st = el.querySelector('.acc__st'); if (st) { var t = statusText(); st.textContent = t[0]; st.className = 'acc__st ' + t[1]; }
      var mm = el.querySelector('.acc-msg'); if (mm) { mm.textContent = msg; mm.hidden = !msg; }
      return;
    }
    mode = want;
    var m = (user && user.user_metadata) || {}, av = m.avatar_url || m.picture || '';
    var note = '<p class="acc-msg' + (msgOk ? ' is-ok' : '') + '" role="alert"' + (msg ? '' : ' hidden') + '>' + esc(msg) + '</p>';
    if (user) {
      var t2 = statusText();
      el.innerHTML = '<section class="acc is-in" aria-label="내 계정"><div class="acc__who"><span class="acc__av">' +
        (/^https:\/\//.test(av) ? '<img src="' + esc(av) + '" alt="" referrerpolicy="no-referrer">' : esc(displayName().charAt(0))) + '</span>' +
        '<span><b>' + esc(displayName()) + '님</b><small class="acc__st ' + t2[1] + '" role="status">' + esc(t2[0]) + '</small></span></div>' +
        '<div class="acc__btns"><button type="button" class="acc-link" data-a="out">로그아웃</button><button type="button" class="acc-link acc-link--quiet" data-a="del">회원 탈퇴</button></div>' + note + '</section>';
    } else {
      var dis = connecting ? ' disabled' : '';
      el.innerHTML = '<section class="acc" aria-label="로그인"><div class="acc__txt"><b>로그인하면 읽은 기록이 어디서든 이어져요.</b>' +
        '<span>휴대폰에서 읽고, 컴퓨터에서 이어서 읽을 수 있어요. 처음이라면 누르기만 해도 자동으로 가입돼요.</span>' +
        '<small>로그인하지 않아도 지금처럼 쓸 수 있어요 · <a href="' + esc(root()) + 'privacy.html">개인정보처리방침</a></small></div>' +
        '<div class="acc__btns"><button type="button" class="acc-btn acc-btn--kakao" data-p="kakao"' + dis + '>' + KAKAO + '<span>' + (connecting ? '연결하는 중…' : '카카오로 시작하기') + '</span></button>' +
        '<button type="button" class="acc-btn acc-btn--google" data-p="google"' + dis + '>' + GOOGLE + '<span>Google로 시작하기</span></button></div>' + note + '</section>';
    }
  }

  /* 안내 창 (로그아웃·탈퇴·다른 사람 기록 확인용) — 글자는 크게, 고를 것은 최소로 */
  function modal(o, done) {
    var prev = document.activeElement, box = document.createElement('div');
    box.className = 'acc-modal'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'acc-mt');
    box.innerHTML = '<div class="acc-modal__box"><h2 id="acc-mt">' + esc(o.title) + '</h2><p>' + esc(o.text) + '</p><div class="acc-modal__btns">' +
      o.buttons.map(function (b, i) { return '<button type="button" class="' + (b.cls || 'btn btn--outline') + '" data-i="' + i + '">' + esc(b.t) + '</button>'; }).join('') + '</div>' +
      (o.link ? '<button type="button" class="acc-link acc-link--quiet" data-i="link">' + esc(o.link) + '</button>' : '') + '</div>';
    document.body.appendChild(box); document.documentElement.style.overflow = 'hidden';
    function close(k) { document.removeEventListener('keydown', key); document.documentElement.style.overflow = ''; if (box.parentNode) box.parentNode.removeChild(box); if (prev && prev.focus) { try { prev.focus(); } catch (e) {} } done(k); }
    function key(e) { if (e.key === 'Escape') close('cancel'); }
    document.addEventListener('keydown', key);
    box.addEventListener('click', function (e) { if (e.target === box) { close('cancel'); return; } var b = e.target.closest('button[data-i]'); if (b) close(b.getAttribute('data-i') === 'link' ? 'link' : +b.getAttribute('data-i')); });
    var f = box.querySelector('button'); if (f) f.focus();
  }

  /* ---------- 기록 맞추기 ---------- */
  function sync(kind) {
    var h = H[kind]; if (!h || !user || !sb || !ready || hold) return Promise.resolve();
    var uid = user.id; busy++; render();
    return sb.from('user_progress').select('data').eq('user_id', uid).eq('kind', kind).maybeSingle()
      .then(function (r) {
        if (r.error) throw r.error;
        var remote = r.data ? r.data.data : null, local = h.get(), merged = h.merge(local, remote);
        if (canon(merged) !== canon(local)) h.set(merged);
        if (!remote || canon(remote) !== canon(merged)) {
          return sb.from('user_progress').upsert({ user_id: uid, kind: kind, data: merged, updated_at: new Date().toISOString() }, { onConflict: 'user_id,kind' })
            .then(function (w) { if (w.error) throw w.error; });
        }
      })
      .then(function () { lastAt = Date.now(); lastErr = ''; }, function (e) { lastErr = String((e && e.message) || e || 'error'); if (window.console) console.warn('[account]', lastErr); })
      .then(function () { busy--; render(); });
  }
  function syncAll() { return Promise.all(Object.keys(H).map(sync)); }
  API.register = function (kind, h) { H[kind] = h; if (user && sb && ready && !hold) sync(kind); };
  API.touch = function (kind) {
    if (!user || !H[kind]) return;
    clearTimeout(T[kind]); T[kind] = setTimeout(function () { delete T[kind]; sync(kind); }, 3000);
  };
  API.syncNow = syncAll;
  function flush() { Object.keys(T).forEach(function (k) { clearTimeout(T[k]); delete T[k]; sync(k); }); }
  document.addEventListener('visibilitychange', function () {
    if (!user) return;
    if (document.visibilityState === 'hidden') flush();
    else if (Date.now() - lastAt > 60000) syncAll();     // 다른 기기에서 쓴 기록을 가져옵니다
  });
  window.addEventListener('online', function () { if (user) syncAll(); });

  /* ---------- 로그인 · 로그아웃 · 탈퇴 ---------- */
  function onLogin() {
    var last = ls(LAST), anyLocal = Object.keys(H).some(function (k) { return H[k].has && H[k].has(); });
    function go() { hold = false; ls(LAST, user.id); syncAll(); }
    if (last && last !== user.id && anyLocal) {      // 이 기기에 다른 계정의 기록이 남아 있는 경우만 한 번 물어봅니다
      hold = true;
      modal({
        title: '이 기기에 남아 있는 기록은 누구 것인가요?',
        text: '이전에 다른 계정으로 로그인했던 기록이 이 기기에 남아 있어요.',
        buttons: [{ t: '제 기록이에요 (합쳐서 저장)', cls: 'btn btn--primary' }, { t: '다른 분 기록이에요 (지우기)', cls: 'btn btn--outline' }]
      }, function (k) {
        if (k === 1) Object.keys(H).forEach(function (n) { if (H[n].clear) H[n].clear(); });
        go();
      });
    } else go();
  }
  function setUser(u) {
    var was = user; user = u || null; connecting = false; mode = ''; render();
    if (user && (!was || was.id !== user.id)) { if (ready) onLogin(); else pendingLogin = true; }
    if (!user) { lastAt = 0; lastErr = ''; hold = false; }
  }
  function signIn(p) {
    msg = ''; msgOk = false; connecting = true; mode = ''; render();
    lib(function () {
      var o = { redirectTo: location.origin + location.pathname };
      if (p === 'kakao') o.scopes = 'profile_nickname profile_image';
      client().auth.signInWithOAuth({ provider: p, options: o }).then(function (r) { if (r.error) throw r.error; }).catch(function (e) {
        connecting = false; mode = ''; msg = '로그인을 시작하지 못했어요. 잠시 뒤에 다시 눌러 주세요.'; render(); if (window.console) console.warn('[account]', e);
      });
    }, function () { connecting = false; mode = ''; msg = '로그인 화면을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'; render(); });
  }
  function signOutNow(clear) {
    var uid = user && user.id;
    Promise.all(Object.keys(H).map(sync)).then(function () {   // 나가기 전에 마지막으로 저장
      if (clear) { Object.keys(H).forEach(function (n) { if (H[n].clear) H[n].clear(); }); ls(LAST, null); } else if (uid) ls(LAST, uid);
      return client().auth.signOut();
    }).catch(function () { ls(STORE, null); }).then(function () { setUser(null); });
  }
  function askOut() {
    modal({
      title: '로그아웃할까요?', text: '로그아웃해도 기록은 계정에 그대로 남아 있어요. 다시 로그인하면 이어서 볼 수 있어요.',
      buttons: [{ t: '로그아웃', cls: 'btn btn--primary' }, { t: '취소', cls: 'btn btn--outline' }],
      link: '공용 컴퓨터예요 (이 기기의 기록도 지우고 로그아웃)'
    }, function (k) { if (k === 0) signOutNow(false); else if (k === 'link') signOutNow(true); });
  }
  function askDelete() {
    modal({
      title: '회원 탈퇴', text: '계정과 계정에 저장된 기록이 모두 지워지고 되돌릴 수 없어요. (이 기기에 저장된 기록은 그대로 남아요.) 정말 탈퇴할까요?',
      buttons: [{ t: '탈퇴하기', cls: 'btn acc-btn--danger' }, { t: '취소', cls: 'btn btn--outline' }]
    }, function (k) {
      if (k !== 0) return;
      msg = ''; busy++; render();
      client().rpc('delete_my_account').then(function (r) {
        if (r.error) throw r.error;
        ls(LAST, null); ls(STORE, null); busy--; lastErr = ''; setUser(null); msg = '탈퇴가 끝났어요. 그동안 이용해 주셔서 감사합니다.'; msgOk = true; mode = ''; render();
      }).catch(function () { busy--; msg = '탈퇴를 처리하지 못했어요. 잠시 뒤에 다시 해 보시거나 교회로 연락해 주세요.'; render(); });
    });
  }

  /* ---------- 시작 ---------- */
  function boot() {
    var el = document.getElementById('account-bar');
    if (el) el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-p],[data-a]'); if (!b || b.disabled) return;
      if (b.hasAttribute('data-p')) signIn(b.getAttribute('data-p'));
      else if (b.getAttribute('data-a') === 'out') askOut(); else if (b.getAttribute('data-a') === 'del') askDelete();
    });
    if (returned && returned.err && !returned.code) msg = '로그인이 끝나지 않았어요. 다시 한 번 눌러 주세요.';
    if (!returned && !hasSession()) { render(); return; }     // 로그인한 적 없는 사람은 로그인 도구를 내려받지 않습니다
    if (returned && returned.code) { connecting = true; }
    render();
    lib(function () {
      var a = client().auth;
      var first = returned && returned.code
        ? a.exchangeCodeForSession(returned.code).catch(function () { msg = '로그인에 실패했어요. 다시 한 번 눌러 주세요.'; })
        : Promise.resolve();
      first.then(function () { return a.getSession(); }).then(function (r) {
        setUser(r && r.data && r.data.session ? r.data.session.user : null);
        if (!user) { connecting = false; mode = ''; render(); }
      });
      a.onAuthStateChange(function (ev, sess) {
        setTimeout(function () { var u = sess && sess.user ? sess.user : null; if ((u && u.id) !== (user && user.id)) setUser(u); }, 0);
      });
    }, function () { connecting = false; mode = ''; msg = '로그인 도구를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'; render(); });
    clock = setInterval(function () { if (user && !busy) render(); }, 30000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
