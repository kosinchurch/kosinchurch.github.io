/* ==========================================================================
   다음세대 · 모임(부서) 목록
   - 모임 시간과 장소는 worship.js 의 같은 id 항목에서 자동으로 가져옵니다.
   - minister: 담당 교역자  /  intro: 부서 소개글(간단한 HTML 사용 가능)
   - icon: sprout, smile, book, users, graduation, heart, music 중에서 고릅니다.
   - url: 이 부서만 따로 만든 페이지로 연결하고 싶을 때 (예: 찬양대)
   ========================================================================== */
window.KOSIN = window.KOSIN || {};

KOSIN.departments = [
  { id: 'infant', name: '영유아부', icon: 'sprout', minister: '', intro: '' },
  { id: 'kinder', name: '유치부', icon: 'smile', minister: '', intro: '' },
  { id: 'elem', name: '초등부', icon: 'book', minister: '', intro: '' },
  { id: 'youth', name: '중고등부', icon: 'users', minister: '', intro: '' },
  { id: 'univ', name: '대학청년부', icon: 'graduation', minister: '', intro: '' },
  { id: 'women', name: '여선교회', icon: 'heart', minister: '', intro: '', timeText: '' },
  { id: 'choir', name: '찬양대', icon: 'music', url: 'worship/choir.html' }
];
