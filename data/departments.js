/* ==========================================================================
   다음세대 · 모임(부서) 목록
   - 모임 시간과 장소는 worship.js 의 같은 id 항목에서 자동으로 가져옵니다.
   - minister: 담당 교역자  /  intro: 부서 소개글(간단한 HTML 사용 가능)
   - icon: sprout, smile, book, users, graduation, heart, music 중에서 고릅니다.
   - url: 이 부서만 따로 만든 페이지로 연결하고 싶을 때 (예: 찬양대)
   ========================================================================== */
window.KOSIN = window.KOSIN || {};

KOSIN.departments = [
  { id: 'infant', name: '영유아부', icon: 'sprout', minister: '김정태', intro: '' },
  { id: 'kinder', name: '유치부', icon: 'smile', minister: '김정태', intro: '' },
  { id: 'elem', name: '초등부', icon: 'book', minister: '김정태', intro: '' },
  { id: 'youth', name: '중고등부', icon: 'users', minister: '김정태', intro: '' },
  { id: 'univ', name: '대학청년부', icon: 'graduation', minister: '조필근', intro: '' },
  // 아래 두 줄은 2026-11-26 사용자 요청으로 메뉴·카드에서 뺐습니다. 다시 넣으려면 두 줄 앞의 // 를 지우세요.
  // { id: 'women', name: '여선교회', icon: 'heart', minister: '', intro: '', timeText: '' },
  // { id: 'choir', name: '찬양대', icon: 'music', url: 'worship/choir.html' }
];

/* ==========================================================================
   교육 부서 담당 (교회학교 페이지의 "교육 부서" 표와 "모임 시간")
   - rows: 위에서부터 차례로. dept 는 글자 하나 또는 [여러 개](한 칸에 위아래로 나뉘어 표시).
   - minister(교역자) · elder(당회원) 는 여러 줄에 걸치는 칸입니다. 첫 줄에만 적고, 걸칠 줄 수를 ministerSpan / elderSpan 으로 적습니다.
       예) 김정태 목사가 1~4번 부서를 맡으면 첫 줄에 minister: '김정태', ministerSpan: 4 → 아래 줄은 적지 않습니다.
   - head(부장) · clerk(총무): 줄마다 적습니다. 비워 두면 — 로 보입니다.
   - note: 표 오른쪽 "비고" 칸(휴대폰에서는 표 아래 한 줄). 필요 없으면 지우세요.
   - times: 표 아래 "모임 시간" 목록 (who = 대상, time = 시간)
   ========================================================================== */
KOSIN.eduDepts = {
  title: '교육 부서',
  rows: [
    { dept: '영·유치부', minister: '김정태', ministerSpan: 4, elder: '강정석', elderSpan: 2, head: '김재민', clerk: '장한나' },
    { dept: '초등1·2부', head: '성정용', clerk: '백성희' },
    { dept: '중등부', elder: '정길영', elderSpan: 2, head: '김재민', clerk: '신미현' },
    { dept: '고등부', head: '박성균', clerk: '황문선' },
    { dept: ['대학부', '청년부'], minister: '조필근', elder: '이경우', head: '김도성', clerk: '정성미' },
    { dept: '영어예배부', minister: '어저여' }
  ],
  note: { label: '영아·유치 · 초등1·2 간사', name: '박혜례 권사' },
  times: [
    { who: '영아·유치부 · 초등1부·2부', time: '오전 10시' },
    { who: '중·고등부 · 대학·청년부', time: '오후 1시' },
    { who: '영어예배부', time: '1시' }
  ]
};
