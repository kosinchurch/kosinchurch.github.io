/* ==========================================================================
   담임목사 저서
   - 아래 두 권은 "샘플"입니다. 실제 저서 정보를 입력한 뒤 샘플 두 덩어리는 지우세요.
   - 책 한 권 = { ... } 한 덩어리. 새 책은 복사해서 붙여넣고 내용만 바꿉니다.
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

KOSIN.books = [
  {
    id: 'sample-1', sample: true,
    title: '저서 제목을 입력하세요', subtitle: '부제를 입력하세요',
    publisher: '', date: '', pages: '',
    oneLine: '한 줄 소개를 입력하세요.',
    intro: '', toc: [], endorsements: [], cover: '', buyLinks: [], inChurch: ''
  },
  {
    id: 'sample-2', sample: true,
    title: '두 번째 저서 제목', subtitle: '',
    publisher: '', date: '', pages: '',
    oneLine: '한 줄 소개를 입력하세요.',
    intro: '', toc: [], endorsements: [], cover: '', buyLinks: [], inChurch: ''
  }
];
