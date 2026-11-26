#!/usr/bin/env node
/* ==========================================================================
   선교 글 공유 미리보기 페이지 자동 만들기
   - data/missions.js 의 선교 글(선교보고·공사 소식)마다 share/<글id>.html 을 만듭니다.
     카카오톡 등에 링크를 붙였을 때 그 글의 사진·제목이 미리보기로 뜨고, 열면 바로 그 글로 이동하는 전용 페이지입니다.
   - data/share-pages.js 에는 만들어진 글 id 목록을 적습니다 (사이트의 공유 버튼이 이 목록에 있는 글만 share 주소를 씁니다).
   - 사진 고르기: 글 사진(앞 14장) 중 첫 "가로" 사진 → 없으면 유튜브 대표 이미지 → 없으면 기본 건물 사진(assets/img/og-share.jpg)
   - 사용: node .github/scripts/make-share-pages.js          (만들어서 저장)
           node .github/scripts/make-share-pages.js --dry    (저장하지 않고 지금 파일과 비교만)
   - 사이트(assets/js/site.js)의 reportId·fieldPath·photoNames·eventFile·fmtDate 와 같은 규칙을 씁니다. 그쪽 규칙을 바꾸면 여기도 맞춰 주세요.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = process.cwd();
const BASE = 'https://www.kosinchurch.com/';
const DRY = process.argv.includes('--dry');
const SHARE_DIR = path.join(ROOT, 'share');
const LIST_FILE = path.join(ROOT, 'data', 'share-pages.js');

/* ---------- 자료 읽기 (브라우저 없이 data/missions.js 를 그대로 실행) ---------- */
function loadData(name) {
  const ctx = {};
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', name + '.js'), 'utf8'), ctx, { filename: name + '.js', timeout: 5000 });
  return ctx.KOSIN || {};
}

/* ---------- site.js 와 같은 규칙 ---------- */
function fmtDate(d) {
  const m = String(d || '').match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  return m ? m[1] + '.' + m[2] + (m[3] ? '.' + m[3] : '') : (d || '');
}
function hash36(s) { let h = 5381; s = String(s); for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
function reportId(r) { return r.id || 'r-' + (r.date || 'x') + '-' + hash36(r.title); }
function fieldType(r) { return r && r.type === 'construction' ? 'construction' : 'mission'; }
function fieldPath(f, type) { return 'mission/field.html?id=' + encodeURIComponent(f.id) + '&type=' + (type === 'construction' ? 'construction' : 'mission'); }
function photoNames(r) {
  if (r.parts) return r.parts.reduce((a, p) => a.concat(p.photos || []), []);
  const p = r.photos;
  if (typeof p === 'number') { const a = []; for (let i = 1; i <= p; i++) a.push(r.id + '_' + String(i).padStart(3, '0') + '.jpg'); return a; }
  return p || [];
}
function eventFile(r, f) { return /^(https?:|assets\/)/.test(f) ? f : (r.dir || 'assets/img/events') + '/' + f; }

/* ---------- 사진 크기 읽기 (JPEG·PNG, 외부 도구 없이) ---------- */
function imageSize(file) {
  let buf;
  try { buf = fs.readFileSync(file); } catch (e) { return null; }
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

/* ---------- 글자 다루기 ---------- */
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function strip(h) {
  return String(h || '').replace(/<br\s*\/?>/gi, ' ').replace(/<\/p>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}
function excerptOf(text) {
  if (!text) return '';
  if (text.length <= 100) return text;
  const cut = text.substring(0, 100);
  const k = Math.max(cut.lastIndexOf('다.'), cut.lastIndexOf('요.'));
  return k >= 35 ? cut.substring(0, k + 2) : cut.replace(/\s+$/, '') + '…';
}

/* ---------- 공유 페이지 모양 ---------- */
const TEMPLATE = [
  '<!doctype html>',
  '<html lang="ko">',
  '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<title>{{TITLE}} | 고신교회</title>',
  '<meta name="description" content="{{DESC}}">',
  '<meta name="robots" content="noindex">',
  '<meta property="og:site_name" content="고신교회">',
  '<meta property="og:type" content="article">',
  '<meta property="og:locale" content="ko_KR">',
  '<meta property="og:title" content="{{TITLE}}">',
  '<meta property="og:description" content="{{DESC}}">',
  '<meta property="og:url" content="{{URL}}">',
  '<meta property="og:image" content="{{IMG}}">',
  '<meta property="og:image:width" content="{{W}}">',
  '<meta property="og:image:height" content="{{H}}">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<link rel="icon" href="../assets/img/favicon.png" type="image/png">',
  '<meta http-equiv="refresh" content="0;url={{TARGET_ATTR}}">',
  '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:"Noto Sans KR",sans-serif;color:#3d0d1f;background:#f8f4f3;text-align:center;padding:24px}a{color:#801237;font-weight:700}p{margin:8px 0}</style>',
  '</head>',
  '<body>',
  '<main>',
  '<p><strong>고신교회</strong></p>',
  '<p>{{TITLE}}</p>',
  '<p>글로 이동하고 있습니다… <a href="{{TARGET_ATTR}}">바로 가기</a></p>',
  '</main>',
  '<script>location.replace({{TARGET_JS}});</script>',
  '</body>',
  '</html>'
].join('\n');
function fill(vars) {
  let out = TEMPLATE;
  Object.keys(vars).forEach(k => { out = out.split('{{' + k + '}}').join(vars[k]); });
  return out;
}

/* ---------- 글마다 페이지 만들기 ---------- */
const D = loadData('missions');
const pages = new Map();   // 글id → html
(D.missionFields || []).forEach(f => {
  (f.reports || []).forEach(r0 => {
    const r = Object.assign({}, r0);
    r.id = reportId(r0);
    const ty = fieldType(r), build = ty === 'construction';
    const target = '../' + fieldPath(f, ty) + '#' + r.id;

    let img = null;
    const rels = photoNames(r).slice(0, 14).map(n => eventFile(r, n));
    for (const rel of rels) {
      if (/^https?:/.test(rel)) continue;
      const sz = imageSize(path.join(ROOT, rel));
      if (sz && sz.w >= sz.h) { img = { url: BASE + encodeURI(rel), w: sz.w, h: sz.h }; break; }
    }
    if (!img) {
      const yt = (r.videos || []).filter(v => typeof v === 'string' && !/\.(mp4|webm|mov)$/i.test(v))[0];
      if (yt) img = { url: 'https://i.ytimg.com/vi/' + yt + '/hqdefault.jpg', w: 480, h: 360 };
    }
    if (!img) img = { url: BASE + 'assets/img/og-share.jpg', w: 1200, h: 630 };

    const cat = build ? (f.constructionTitle || f.name + ' 공사') : (f.title || f.name + ' 선교');
    const dateText = fmtDate(r.date);
    const ogTitle = '선교지 소식 - ' + cat + (dateText ? ' (' + dateText + ')' : '');
    const baseTitle = String(r.title || '').replace(/\s*\(\d{4}\.\d{2}(\.\d{2})?\)$/, '');
    const text = strip(r.body || (r.parts ? r.parts.map(p => p.body || '').join(' ') : '')).slice(0, 260);
    const excerpt = excerptOf(text);
    let desc;
    if (build) {
      desc = excerpt || baseTitle;
    } else {
      desc = baseTitle + (excerpt ? ' — ' + excerpt : '');
      if (desc.length > 130) desc = desc.substring(0, 128).replace(/\s+$/, '') + '…';
    }

    pages.set(r.id, fill({
      TITLE: esc(ogTitle), DESC: esc(desc), URL: BASE + 'share/' + r.id + '.html', IMG: img.url,
      W: String(img.w), H: String(img.h), TARGET_ATTR: esc(target), TARGET_JS: JSON.stringify(target)
    }));
  });
});

/* ---------- 안전 점검 (이상하면 아무것도 저장하지 않고 멈춥니다) ---------- */
const existing = fs.existsSync(SHARE_DIR) ? fs.readdirSync(SHARE_DIR).filter(n => /\.html$/.test(n)) : [];
function fail(msg) { console.error('중단: ' + msg); process.exit(1); }
if (pages.size === 0) fail('선교 글을 하나도 읽지 못했습니다 (data/missions.js 확인).');
if (existing.length > 0 && pages.size < existing.length * 0.8) fail('글 수가 갑자기 줄었습니다 (' + existing.length + ' → ' + pages.size + '). data/missions.js 를 확인하세요.');
pages.forEach((html, id) => {
  if (!/^[A-Za-z0-9._-]+$/.test(id)) fail('글 id 에 쓸 수 없는 글자가 있습니다: ' + id);
  if (html.indexOf('{{') >= 0) fail('채워지지 않은 자리가 있습니다: ' + id);
  if (!/property="og:title" content="[^"]+"/.test(html) || !/property="og:image" content="https?:\/\/[^"]+"/.test(html)) fail('미리보기 정보가 비었습니다: ' + id);
});

/* ---------- 목록 파일 ---------- */
const ids = Array.from(pages.keys()).sort();
const listJs = [
  '/* ==========================================================================',
  '   선교 글 공유 페이지 목록 (자동 생성 파일 — 직접 고치지 마세요)',
  '   share/ 폴더에는 글마다 카카오톡 등에서 제목·사진 미리보기가 뜨는 공유 전용 페이지(share/글id.html)가 있습니다.',
  '   여기에 이름이 있는 글만 공유 버튼이 그 페이지 주소를 쓰고, 없는 글은 원래 글 주소를 씁니다.',
  '   data/missions.js 나 선교 사진을 올리면 GitHub Actions(.github/workflows/share-pages.yml)가 이 목록과 share/ 페이지를 자동으로 만듭니다.',
  '   ========================================================================== */',
  'window.KOSIN = window.KOSIN || {};',
  'KOSIN.sharePages = {',
  ids.map(id => "  '" + id + "': 1").join(',\n'),
  '};',
  ''
].join('\n');

/* ---------- 저장 (또는 --dry 비교) ---------- */
function norm(s) { return String(s).replace(/\r\n/g, '\n'); }
function readOrNull(p) { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; } }
let same = 0; const changed = [], added = [], removed = [];
if (!DRY) fs.mkdirSync(SHARE_DIR, { recursive: true });
pages.forEach((html, id) => {
  const file = path.join(SHARE_DIR, id + '.html');
  const old = readOrNull(file);
  if (old === null) { added.push(id); if (!DRY) fs.writeFileSync(file, html); return; }
  if (norm(old) === html) { same++; return; }
  changed.push(id);
  if (DRY) {
    const a = norm(old).split('\n'), b = html.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) { console.log('  [다름] ' + id + ' 줄' + (i + 1) + '\n     지금: ' + a[i] + '\n     새로: ' + b[i]); break; }
    }
  } else fs.writeFileSync(file, html);
});
existing.forEach(n => {
  const id = n.replace(/\.html$/, '');
  if (!pages.has(id)) { removed.push(id); if (!DRY) fs.unlinkSync(path.join(SHARE_DIR, n)); }
});
const oldList = readOrNull(LIST_FILE);
const listChanged = oldList === null || norm(oldList) !== listJs;
if (!DRY && listChanged) fs.writeFileSync(LIST_FILE, listJs);

const summary = (DRY ? '[연습 실행 — 저장 안 함] ' : '') + '선교 글 ' + pages.size + '개 · 그대로 ' + same + ' · 바뀜 ' + changed.length + ' · 새로 ' + added.length + ' · 지움 ' + removed.length + ' · 목록 파일 ' + (listChanged ? '바뀜' : '그대로');
console.log(summary);
if (added.length) console.log('  새로: ' + added.join(', '));
if (removed.length) console.log('  지움: ' + removed.join(', '));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '### 선교 글 공유 페이지\n\n' + summary + '\n');
