/* ==========================================================================
   고신교회 기본 정보 · 메뉴 · 설정
   - 따옴표(' ')와 쉼표(,)를 지워 버리지 않게 조심해서 고쳐 주세요.
   - 수정 방법은 README.md 를 참고하세요.
   ========================================================================== */
window.KOSIN = window.KOSIN || {};

KOSIN.config = {
  // true  : "샘플" 표시가 붙은 임시 자료를 화면에 보여줍니다. (제작·검토 단계)
  // false : 샘플을 모두 숨깁니다. (실제 자료를 다 입력하고 공개하기 전에 false 로 바꾸세요)
  showSamples: false
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
  youtube: 'https://www.youtube.com/@kosinchurch',   // 교회 유튜브 채널 주소
  youtubeMeditation: 'https://www.youtube.com/playlist?list=PLQ06ZjpVavINRO-gVxGkK9HPk_au_5tdV',   // 유튜브 "3분 묵상" 재생목록 (메인 '이번 주 말씀'의 더보기 링크)
  formEndpoint: '',   // [입력 필요] 문의 폼 접수 주소 (Formspree 등, README 참고)

  logo: 'assets/img/logo.png',   // 가로형 로고(투명 배경 PNG). 교체: 같은 이름의 파일로 덮어쓰거나 이 경로를 바꾸세요
  mapQuery: '고신교회 부산 사상구 가야대로213번길 12-19',
  // 실시간 통역(Anna Live): 홈에 들어오면 뜨는 안내 팝업과 하단 "실시간 통역(라이브)" 링크에 쓰입니다. enabled:false 로 바꾸면 모두 사라집니다.
  // ※ url 은 참석자(청중)용 공개 주소입니다. 관리자(/admin/) 주소와 token 은 이 파일이 공개되므로 절대 넣지 마세요.
  interpreter: { enabled: true, url: 'https://synesisai.org/anna/', channel: 'kosinchurch1964', autoOpen: true },
  // 성경 타자 안내 팝업: 홈에 들어오면 (통역 안내 다음, 찬양 팝업보다 먼저) 뜹니다. enabled:false 로 바꾸면 사라집니다.
  // 팝업 위쪽 그림에 쓰이는 말씀은 verse / verseRef 로 바꿀 수 있습니다 (저작권이 풀린 개역한글 본문만 쓰세요).
  typingNotice: { enabled: true, autoOpen: true },
  // 네이버지도 로드뷰 링크 (오시는 길 · 하단 안내에 "로드뷰" 버튼으로 표시됩니다. 비우면 버튼이 사라집니다)
  roadviewUrl: 'https://map.naver.com/p/entry/place/1146617290?p=wXZzJoCyViKZ2cBusuFAQw,-74.63,2.9,80,Float&placePath=%2Fhome%3Ffrom%3Dmap%26fromPanelNum%3D1%26additionalHeight%3D76%26timestamp%3D202611231449%26locale%3Dko%26svcName%3Dmap_pcv5&c=15.00,0,0,0,adh',

  // 공유하기(카카오톡) 설정 — 선택 사항. README 5-2 참고
  kakaoJsKey: '',     // 카카오 디벨로퍼스의 'JavaScript 키'. 비워 두면 휴대폰 공유 창(카카오톡 선택) 또는 링크 복사로 동작합니다
  shareImage: '',     // 카카오톡 공유 카드 이미지 주소(https://...). 비워 두면 assets/img/og-image.png 를 사용합니다

  slogan: { year: 2026, lines: ['주의 전을 사모하는 열심이', '나를 삼키게 하소서'] },
  heroLead: '사랑하는 당신의 방문을 환영합니다. 기쁨과 기도, 감사로 함께 예배하는 고신교회입니다.'
};

/* 상단 메뉴 (대분류 8개). '교회학교' 아래 메뉴는 departments.js 에서 자동으로 만들어집니다. */
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
    { label: '성경 통독', url: 'worship/bible.html' },
    { label: '성경 타자', url: 'worship/typing.html' }
  ] },
  { label: '교회학교', url: 'next-generation/index.html', auto: 'departments' },
  /* 선교현황: 어느 선교 페이지에 들어가도 아래 줄(하위 메뉴)에 같은 칸이 같은 순서로 보입니다.
     "선교 게시판"(전체 글 모아보기)이 맨 왼쪽이고, 네팔은 공사 메뉴가 없습니다.
     (선교현황 첫 페이지·선교 후원 안내 페이지는 메뉴 맨 위 "선교현황"을 누르거나 각 페이지의 버튼으로 갑니다.) */
  { label: '선교현황', url: 'mission/index.html', children: [
    { label: '선교 게시판', url: 'mission/board.html' },
    { label: '네팔 선교', url: 'mission/field.html?id=nepal&type=mission' },
    { label: '필리핀 선교', url: 'mission/field.html?id=philippines&type=mission' },
    { label: '필리핀 선교센터 공사', url: 'mission/field.html?id=philippines&type=construction' }
  ] },
  { label: '책 소개', url: 'books/index.html', children: [
    { label: '담임목사 저서', url: 'books/index.html' },
    { label: '교회출판도서', url: 'books/church.html' }
  ] },
  { label: '교회소식', url: 'news/index.html', children: [
    { label: '공지사항', url: 'news/index.html' },
    { label: '주보', url: 'news/bulletin.html' }
  ] },
  /* 교회 앨범: 교회 행사 글에 사진·영상을 올립니다 (data/news.js 의 events, category '교회행사').
     선교 사진·영상은 "선교현황 > 네팔 선교 / 필리핀 선교"(data/missions.js)에 올립니다. */
  { label: '교회 앨범', url: 'news/events.html' },
  { label: '새가족 안내', url: 'newcomer/index.html', children: [
    { label: '처음 오셨나요', url: 'newcomer/index.html' },
    { label: '자주 묻는 질문', url: 'newcomer/index.html#faq' },
    { label: '등록 안내', url: 'newcomer/index.html#register' },
    { label: '문의하기', url: 'contact/index.html' }
  ] }
];
