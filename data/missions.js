/* ==========================================================================
   선교 (네팔 · 필리핀) 선교지 소개, 선교보고, 후원 안내
   - reports: 선교보고 목록. 새 보고는 맨 위에 한 줄 추가하세요.
   - intro: 선교지 소개 글(간단한 HTML 사용 가능). 비워 두면 "준비 중"으로 보입니다.
   - 선교보고마다 "카카오톡 공유" 버튼이 자동으로 붙고, 항목별 공유 주소는 날짜+제목으로 자동 생성됩니다.
     날짜나 제목을 고쳐도 이미 공유한 주소를 유지하고 싶으면 보고 항목에 id: '원하는-id' 를 직접 적으세요.
     예) { id: 'philippines-2026-11', title: '...', date: '2026-11-17' },
   ========================================================================== */
window.KOSIN = window.KOSIN || {};

/* 선교지마다 두 갈래의 페이지가 있습니다.
   - 선교 : title · summary · intro      → 메뉴 "네팔 선교", "필리핀 선교"
   - 공사 : constructionTitle · constructionSummary · constructionIntro → 메뉴 "네팔 공사", "필리핀 선교센터 공사"
   - 소식 한 건 한 건은 기본이 "선교" 쪽입니다. "공사" 쪽에 나오게 하려면 type: 'construction' 을 적으세요.
     예) { title: '...', date: '2026-11-17', type: 'construction' } */
KOSIN.missionFields = [
  {
    id: 'nepal', name: '네팔', title: '네팔 선교',
    summary: '네팔의 교회와 학교, 우물 사역 소식을 전합니다.',
    intro: '',   // [입력 필요] 네팔 선교 소개
    constructionTitle: '네팔 공사',
    constructionSummary: '네팔 교회와 학교, 우물 공사 소식을 전합니다.',
    constructionIntro: '',   // [입력 필요] 네팔 공사 소개
    reports: [
      { title: '선교보고 - 파티가운 교회', date: '2026-04-06' },
      { title: '선교보고 - 쿠르콧 교회 & 우물', date: '2026-04-06' },
      { title: '선교보고 - 룸비니학교', date: '2026-04-06' },
      { title: '선교보고 - 가댜울리 교회', date: '2026-04-06' }
    ]
  },
  {
    id: 'philippines', name: '필리핀', title: '필리핀 선교',
    summary: '필리핀 선교와 단기선교 소식을 전합니다.',
    intro: '',   // [입력 필요] 필리핀 선교 소개
    constructionTitle: '필리핀 선교센터 공사',
    constructionSummary: '마닐라 선교센터 공사 진행 상황을 전합니다.',
    constructionIntro: '',   // [입력 필요] 필리핀 선교센터 공사 소개
    reports: [
      { title: '마닐라 선교센터 공사 진행 상황', date: '2026-11-17', type: 'construction' },
      { title: '마닐라 선교센터 공사 진행 상황', date: '2026-11-04', type: 'construction' },
      { title: '마닐라 선교센터 공사 진행 상황', date: '2026-10-27', type: 'construction' },
      { title: '마닐라 선교센터 공사 진행 상황', date: '2026-10-24', type: 'construction' }
    ]
  }
];

/* 선교 비전 소개글 (선교 첫 페이지에 표시) */
KOSIN.missionVision = '';   // [입력 필요] 소개글을 쓰면 아래 선교지 안내 그림 위에 나옵니다

/* 선교 비전 화면에 순서대로 보이는 선교지 안내 그림 (누르면 크게 보고 좌우로 넘길 수 있습니다)
   그림을 바꾸려면 assets/img/mission/ 의 파일을 같은 이름으로 바꾸거나, 한 덩어리를 추가·삭제하세요. */
KOSIN.missionVisionImages = [
  { img: 'assets/img/mission/vision-1.png', caption: '선교지 · 필리핀 KPC센터' },
  { img: 'assets/img/mission/vision-2.png', caption: '선교지 · 필리핀 GMI(일로일로)' },
  { img: 'assets/img/mission/vision-3.png', caption: '임마누엘미션 · 필리핀 루존지역 (1)' },
  { img: 'assets/img/mission/vision-4.png', caption: '임마누엘미션 · 필리핀 루존지역 (2)' },
  { img: 'assets/img/mission/vision-5.png', caption: '선교지 · 네팔(코이노니아)' },
  { img: 'assets/img/mission/vision-6.png', caption: '선교지 · 네팔' },
  { img: 'assets/img/mission/vision-7.png', caption: '선교지 · 감비아' },
  { img: 'assets/img/mission/vision-8.png', caption: '선교지 · 국내' }
];

/* 선교 후원 안내 — 계좌 등은 교회 승인 후에만 입력하세요 (이 파일은 공개됩니다) */
KOSIN.missionSupport = {
  intro: '',            // [입력 필요] 후원 안내 문구
  methods: [
    // { label: '후원 계좌', value: '은행명 000-000-000000 (예금주)' }
  ],
  contact: ''           // [입력 필요] 후원 문의 담당자·연락처
};
