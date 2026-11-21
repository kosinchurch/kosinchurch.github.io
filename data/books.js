/* ==========================================================================
   책 소개 — 담임목사 저서 · 교회출판도서
   - 아래 두 권은 "샘플"입니다. 실제 저서 정보를 입력한 뒤 샘플 두 덩어리는 지우세요.
   - 책 한 권 = { ... } 한 덩어리. 새 책은 복사해서 붙여넣고 내용만 바꿉니다.
   - kind    : 'pastor' = 담임목사 저서 (적지 않으면 이쪽), 'church' = 교회출판도서
   - author  : (선택) 저자. 담임목사 저서는 적지 않아도 담임목사 이름이 나옵니다. 교회출판도서는 필요하면 적으세요.
   - cover   : 표지 이미지 경로 예) 'assets/img/books/book1.jpg'  (비우면 "표지 이미지 준비 중")
   - date    : 출간일 '2024-05-20' 형식 (최신순으로 정렬됩니다)
   - intro   : 책 소개글 (간단한 HTML 사용 가능)
   - toc     : 목차  ['1부 ...', '2부 ...']
   - endorsements : 추천사 [{ text: '추천 글', by: '추천인' }]
   - buyLinks: 구매 링크 [{ label: '교보문고', url: 'https://...' }]
   - inChurch: 교회 도서 코너 등 교회에서 구하는 방법 안내
   ※ 표지·목차·추천사는 출판사/저자의 사용 허락 범위 안에서 사용하세요.
   ========================================================================== */
window.KOSIN = window.KOSIN || {};

/* previews : 책 속 사진(서문 등). [{ img: '경로', caption: '서문' }] — 누르면 크게 볼 수 있습니다.
   ※ 출간일·분량·한 줄 소개·구매 링크는 아직 입력하지 않았습니다. 알려 주시면 채웁니다. */
KOSIN.books = [
  {
    id: 'seonggyeong-seolgyohara',
    title: '성경을 설교하라', subtitle: '',
    publisher: '도서출판 한길로', date: '', pages: '',
    oneLine: '“예배의 강단에서 우리 주 예수 그리스도께서 증거되지 않으면 이단입니다.” (서문 중에서)',
    intro: '', toc: [], endorsements: [],
    cover: 'assets/img/books/seonggyeong-seolgyohara-cover.jpg',
    previews: [{ img: 'assets/img/books/seonggyeong-seolgyohara-preface.jpg', caption: '서문' }],
    buyLinks: [], inChurch: ''
  },
  {
    id: 'gido-2025-2', kind: 'church',
    title: '주일 공예배 기도문 모음집 (2권)', subtitle: '고신교회 장로, 집사, 권사의 · 2025',
    author: '고신교회 장로·집사·권사', publisher: '고신교회', date: '', pages: '',
    oneLine: '여호와의 찬송을 부르게 하소서 (이사야 43:21)',
    intro: '', toc: [], endorsements: [],
    cover: 'assets/img/books/gido-cover.jpg',
    previews: [
      { img: 'assets/img/books/gido-p01.jpg', caption: '서문 (4쪽)' },
      { img: 'assets/img/books/gido-p02.jpg', caption: '5쪽' },
      { img: 'assets/img/books/gido-p03.jpg', caption: '6쪽' },
      { img: 'assets/img/books/gido-p04.jpg', caption: '13쪽' },
      { img: 'assets/img/books/gido-p05.jpg', caption: '14쪽' },
      { img: 'assets/img/books/gido-p06.jpg', caption: '15쪽' },
      { img: 'assets/img/books/gido-p07.jpg', caption: '16쪽' },
      { img: 'assets/img/books/gido-p08.jpg', caption: '17쪽' },
      { img: 'assets/img/books/gido-p09.jpg', caption: '18쪽' },
      { img: 'assets/img/books/gido-p10.jpg', caption: '19쪽' },
      { img: 'assets/img/books/gido-p11.jpg', caption: '20쪽' },
      { img: 'assets/img/books/gido-p12.jpg', caption: '21쪽' }
    ],
    buyLinks: [], inChurch: ''
  }
];
