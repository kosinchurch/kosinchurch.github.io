/* ==========================================================================
   고신교회 기본 정보 · 메뉴 · 설정
   - 따옴표(' ')와 쉼표(,)를 지워 버리지 않게 조심해서 고쳐 주세요.
   - 수정 방법은 README.md 를 참고하세요.
   ========================================================================== */
window.KOSIN = window.KOSIN || {};

KOSIN.config = {
  // true  : "샘플" 표시가 붙은 임시 자료를 화면에 보여줍니다. (제작·검토 단계)
  // false : 샘플을 모두 숨깁니다. (실제 자료를 다 입력하고 공개하기 전에 false 로 바꾸세요)
  showSamples: true
};

KOSIN.church = {
  name: '고신교회',
  denomination: '대한예수교장로회',
  pastor: '김경헌',
  pastorTitle: '담임목사',
  zip: '38274',
  address: '부산광역시 사상구 가야대로213번길 12-19 (주례동)',
  phone: '051-895-2251',
  fax: '051-895-2257',

  email: '',          // [입력 필요] 교회 대표 이메일 (비워 두면 화면에 표시되지 않습니다)
  youtube: '',        // [입력 필요] 유튜브 채널 주소 예) https://www.youtube.com/@채널이름
  formEndpoint: '',   // [입력 필요] 문의 폼 접수 주소 (Formspree 등, README 참고)

  logo: 'assets/img/logo.png',   // 가로형 로고(투명 배경 PNG). 교체: 같은 이름의 파일로 덮어쓰거나 이 경로를 바꾸세요
  mapQuery: '고신교회 부산 사상구 가야대로213번길 12-19',

  // 공유하기(카카오톡) 설정 — 선택 사항. README 5-2 참고
  kakaoJsKey: '',     // 카카오 디벨로퍼스의 'JavaScript 키'. 비워 두면 휴대폰 공유 창(카카오톡 선택) 또는 링크 복사로 동작합니다
  shareImage: '',     // 카카오톡 공유 카드 이미지 주소(https://...). 비워 두면 assets/img/og-image.png 를 사용합니다

  slogan: { year: 2026, lines: ['주의 전을 사모하는 열심이', '나를 삼키게 하소서'] },
  heroLead: '사랑하는 당신의 방문을 환영합니다. 기쁨과 기도, 감사로 함께 예배하는 고신교회입니다.'
};

/* 상단 메뉴 (대분류 6개). '다음세대·모임' 아래 메뉴는 departments.js 에서 자동으로 만들어집니다. */
KOSIN.menu = [
  { label: '교회소개', url: 'about/greeting.html', children: [
    { label: '인사말', url: 'about/greeting.html' },
    { label: '비전·표어', url: 'about/vision.html' },
    { label: '연혁', url: 'about/history.html' },
    { label: '섬기는 분들', url: 'about/people.html' },
    { label: '시설안내', url: 'about/facilities.html' },
    { label: '오시는 길', url: 'about/location.html' }
  ] },
  { label: '예배·말씀', url: 'worship/guide.html', children: [
    { label: '예배안내', url: 'worship/guide.html' },
    { label: '주일예배 설교', url: 'worship/sermons.html' },
    { label: '3분 묵상', url: 'worship/meditation.html' },
    { label: '수요성경공부', url: 'worship/wednesday.html' },
    { label: '찬양대', url: 'worship/choir.html' },
    { label: '담임목사 저서', url: 'books/index.html' }
  ] },
  { label: '다음세대·모임', url: 'next-generation/index.html', auto: 'departments' },
  { label: '선교', url: 'mission/index.html', children: [
    { label: '선교 비전', url: 'mission/index.html' },
    { label: '네팔', url: 'mission/field.html?id=nepal' },
    { label: '필리핀', url: 'mission/field.html?id=philippines' },
    { label: '선교 후원 안내', url: 'mission/support.html' }
  ] },
  { label: '교회소식', url: 'news/index.html', children: [
    { label: '공지사항', url: 'news/index.html' },
    { label: '주보', url: 'news/bulletin.html' },
    { label: '교회·선교 행사', url: 'news/events.html' },
    { label: '교회앨범', url: 'news/album.html' }
  ] },
  { label: '새가족 안내', url: 'newcomer/index.html', children: [
    { label: '처음 오셨나요', url: 'newcomer/index.html' },
    { label: '자주 묻는 질문', url: 'newcomer/index.html#faq' },
    { label: '등록 안내', url: 'newcomer/index.html#register' },
    { label: '문의하기', url: 'contact/index.html' }
  ] }
];
