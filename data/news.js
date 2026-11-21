/* ==========================================================================
   교회소식 · 주보 · 교회 앨범(행사 사진·영상)
   - sample: true 가 붙은 항목은 "샘플"입니다. 실제 글을 쓴 뒤 지우세요.
   - body: 글 내용(간단한 HTML 사용 가능: <br> 줄바꿈, <a href="..."> 링크). 있으면 눌러서 펼쳐 볼 수 있습니다.
   - link: 외부 주소나 파일 경로를 넣으면 눌렀을 때 그곳으로 이동합니다.
   - pinned: true 면 목록 맨 위에 고정됩니다.
   ========================================================================== */
window.KOSIN = window.KOSIN || {};

/* ---------- 공지사항 ---------- */
KOSIN.notices = [
  { id: 'n-2026-11-15', title: '2026년 11월 15일 교회소식', date: '2026-11-14', category: '교회소식', pinned: true },
  { id: 'n-sample-1', sample: true, title: '교회 공지 제목을 여기에 입력하세요', date: '2026-11-08', category: '공지',
    body: '공지 내용을 입력하세요.<br>줄바꿈은 &lt;br&gt; 로 합니다.' },
  { id: 'n-sample-2', sample: true, title: '두 번째 공지 샘플입니다', date: '2026-11-01', category: '공지',
    body: '이 글은 샘플입니다. 실제 공지를 입력한 뒤 이 항목은 지워 주세요.' }
];

/* ---------- 주보 (매주 교회소식 PDF) ----------
   PDF 를 assets/bulletins 폴더에 올리고, file 에 경로를 적습니다. 날짜가 가장 최근인 것이 메인의 '이번 주 주보'가 됩니다.
   예) { id: 'b-2026-11-29', title: '2026년 11월 29일 주보 (제48호)', date: '2026-11-29', file: 'assets/bulletins/2026-11-29.pdf' },   */
KOSIN.bulletins = [
  { id: 'b-2026-11-22', title: '2026년 11월 22일 주보 (제47호)', date: '2026-11-22', file: 'assets/bulletins/2026-11-22.pdf' },
  { id: 'b-2026-11-15', title: '2026년 11월 15일 주보 (제46호)', date: '2026-11-15', file: 'assets/bulletins/2026-11-15.pdf' },
  { id: 'b-2026-11-08', title: '2026년 11월 8일 주보 (제45호)', date: '2026-11-08', file: 'assets/bulletins/2026-11-08.pdf' },
  { id: 'b-2026-11-01', title: '2026년 11월 1일 주보 (제44호)', date: '2026-11-01', file: 'assets/bulletins/2026-11-01.pdf' },
  { id: 'b-2026-10-25', title: '2026년 10월 25일 주보 (제43호)', date: '2026-10-25', file: 'assets/bulletins/2026-10-25.pdf' },
  { id: 'b-2026-10-18', title: '2026년 10월 18일 주보 (제42호)', date: '2026-10-18', file: 'assets/bulletins/2026-10-18.pdf' },
  { id: 'b-2026-10-11', title: '2026년 10월 11일 주보 (제41호)', date: '2026-10-11', file: 'assets/bulletins/2026-10-11.pdf' },
  { id: 'b-2026-10-04', title: '2026년 10월 4일 주보 (제40호)', date: '2026-10-04', file: 'assets/bulletins/2026-10-04.pdf' },
  { id: 'b-2026-09-27', title: '2026년 9월 27일 주보 (제39호)', date: '2026-09-27', file: 'assets/bulletins/2026-09-27.pdf' },
  { id: 'b-2026-09-20', title: '2026년 9월 20일 주보 (제38호)', date: '2026-09-20', file: 'assets/bulletins/2026-09-20.pdf' },
  { id: 'b-2026-09-13', title: '2026년 9월 13일 주보 (제37호)', date: '2026-09-13', file: 'assets/bulletins/2026-09-13.pdf' },
  { id: 'b-2026-09-06', title: '2026년 9월 6일 주보 (제36호)', date: '2026-09-06', file: 'assets/bulletins/2026-09-06.pdf' },
  { id: 'b-2026-08-30', title: '2026년 8월 30일 주보 (제35호)', date: '2026-08-30', file: 'assets/bulletins/2026-08-30.pdf' },
  { id: 'b-2026-08-23', title: '2026년 8월 23일 주보 (제34호)', date: '2026-08-23', file: 'assets/bulletins/2026-08-23.pdf' },
  { id: 'b-2026-08-16', title: '2026년 8월 16일 주보 (제33호)', date: '2026-08-16', file: 'assets/bulletins/2026-08-16.pdf' },
  { id: 'b-2026-08-09', title: '2026년 8월 9일 주보 (제32호)', date: '2026-08-09', file: 'assets/bulletins/2026-08-09.pdf' },
  { id: 'b-2026-08-02', title: '2026년 8월 2일 주보 (제31호)', date: '2026-08-02', file: 'assets/bulletins/2026-08-02.pdf' },
  { id: 'b-2026-07-26', title: '2026년 7월 26일 주보 (제30호)', date: '2026-07-26', file: 'assets/bulletins/2026-07-26.pdf' },
  { id: 'b-2026-07-19', title: '2026년 7월 19일 주보 (제29호)', date: '2026-07-19', file: 'assets/bulletins/2026-07-19.pdf' },
  { id: 'b-2026-07-12', title: '2026년 7월 12일 주보 (제28호)', date: '2026-07-12', file: 'assets/bulletins/2026-07-12.pdf' },
  { id: 'b-2026-07-05', title: '2026년 7월 5일 주보 (제27호)', date: '2026-07-05', file: 'assets/bulletins/2026-07-05.pdf' },
  { id: 'b-2026-06-28', title: '2026년 6월 28일 주보 (제26호)', date: '2026-06-28', file: 'assets/bulletins/2026-06-28.pdf' },
  { id: 'b-2026-06-21', title: '2026년 6월 21일 주보 (제25호)', date: '2026-06-21', file: 'assets/bulletins/2026-06-21.pdf' },
  { id: 'b-2026-06-14', title: '2026년 6월 14일 주보 (제24호)', date: '2026-06-14', file: 'assets/bulletins/2026-06-14.pdf' },
  { id: 'b-2026-06-07', title: '2026년 6월 7일 주보 (제23호)', date: '2026-06-07', file: 'assets/bulletins/2026-06-07.pdf' },
  { id: 'b-2026-05-30', title: '2026년 5월 30일 주보 (제22호)', date: '2026-05-30', file: 'assets/bulletins/2026-05-30.pdf' },
  { id: 'b-2026-05-24', title: '2026년 5월 24일 주보 (제21호)', date: '2026-05-24', file: 'assets/bulletins/2026-05-24.pdf' },
  { id: 'b-2026-05-17', title: '2026년 5월 17일 주보 (제20호)', date: '2026-05-17', file: 'assets/bulletins/2026-05-17.pdf' },
  { id: 'b-2026-05-10', title: '2026년 5월 10일 주보 (제19호)', date: '2026-05-10', file: 'assets/bulletins/2026-05-10.pdf' },
  { id: 'b-2026-05-03', title: '2026년 5월 3일 주보 (제18호)', date: '2026-05-03', file: 'assets/bulletins/2026-05-03.pdf' },
  { id: 'b-2026-04-26', title: '2026년 4월 26일 주보 (제17호)', date: '2026-04-26', file: 'assets/bulletins/2026-04-26.pdf' },
  { id: 'b-2026-04-19', title: '2026년 4월 19일 주보 (제16호)', date: '2026-04-19', file: 'assets/bulletins/2026-04-19.pdf' },
  { id: 'b-2026-04-12', title: '2026년 4월 12일 주보 (제15호)', date: '2026-04-12', file: 'assets/bulletins/2026-04-12.pdf' },
  { id: 'b-2026-04-05', title: '2026년 4월 5일 주보 (제14호)', date: '2026-04-05', file: 'assets/bulletins/2026-04-05.pdf' },
  { id: 'b-2026-03-29', title: '2026년 3월 29일 주보 (제13호)', date: '2026-03-29', file: 'assets/bulletins/2026-03-29.pdf' },
  { id: 'b-2026-03-22', title: '2026년 3월 22일 주보 (제12호)', date: '2026-03-22', file: 'assets/bulletins/2026-03-22.pdf' },
  { id: 'b-2026-03-15', title: '2026년 3월 15일 주보 (제11호)', date: '2026-03-15', file: 'assets/bulletins/2026-03-15.pdf' },
  { id: 'b-2026-03-08', title: '2026년 3월 8일 주보 (제10호)', date: '2026-03-08', file: 'assets/bulletins/2026-03-08.pdf' },
  { id: 'b-2026-03-01', title: '2026년 3월 1일 주보 (제9호)', date: '2026-03-01', file: 'assets/bulletins/2026-03-01.pdf' },
  { id: 'b-2026-02-22', title: '2026년 2월 22일 주보 (제8호)', date: '2026-02-22', file: 'assets/bulletins/2026-02-22.pdf' },
  { id: 'b-2026-02-15', title: '2026년 2월 15일 주보 (제7호)', date: '2026-02-15', file: 'assets/bulletins/2026-02-15.pdf' },
  { id: 'b-2026-02-08', title: '2026년 2월 8일 주보 (제6호)', date: '2026-02-08', file: 'assets/bulletins/2026-02-08.pdf' },
  { id: 'b-2026-02-01', title: '2026년 2월 1일 주보 (제5호)', date: '2026-02-01', file: 'assets/bulletins/2026-02-01.pdf' },
  { id: 'b-2026-01-25', title: '2026년 1월 25일 주보 (제4호)', date: '2026-01-25', file: 'assets/bulletins/2026-01-25.pdf' },
  { id: 'b-2026-01-18', title: '2026년 1월 18일 주보 (제3호)', date: '2026-01-18', file: 'assets/bulletins/2026-01-18.pdf' },
  { id: 'b-2026-01-11', title: '2026년 1월 11일 주보 (제2호)', date: '2026-01-11', file: 'assets/bulletins/2026-01-11.pdf' },
  { id: 'b-2026-01-04', title: '2026년 1월 4일 주보 (제1호)', date: '2026-01-04', file: 'assets/bulletins/2026-01-04.pdf' },
  { id: 'b-2025-12-31', title: '송구영신예배 순서지 (2025년 12월 31일)', date: '2025-12-31', file: 'assets/bulletins/2025-12-31.pdf' }
];

/* ---------- 행사 (교회행사 + 선교행사)  category 는 '교회행사' 또는 '선교행사' ----------
   ※ 날짜는 기존 홈페이지에 표시된 행사일 또는 게시일입니다. 실제 날짜로 고쳐 주세요. */
KOSIN.events = [
  { id: 'e-2025-12-24', title: '성탄절 이웃나눔 및 전야제 행사', date: '2025-12-24', category: '교회행사', photos: 10 },
  { id: 'e-2025-12-07', title: '샬롬교회 세례식 (12월 7~13일)', date: '2025-12-07', category: '교회행사', photos: 48 },
  { id: 'e-2025-12-04', title: '어르신들 식사 (아임타이)', date: '2025-12-04', category: '교회행사', photos: 11 },
  { id: 'e-2025-12-03', title: '성탄 점등식 (복지재단)', date: '2025-12-03', category: '교회행사', photos: 4 },
  { id: 'e-2025-12-02', title: '일군들', date: '2025-12-02', category: '교회행사', photos: 12 },
  { id: 'e-2025-10-11', title: '야유회', date: '2025-10-11', category: '교회행사', photos: 434 },
  { id: 'e-2025-10-07', title: '외국인 구역 나들이', date: '2025-10-07', category: '교회행사', photos: 19 },
  { id: 'e-2025-10-03', title: '선교바자회 (10월 3~4일)', date: '2025-10-03', category: '교회행사', photos: 55 },
  { id: 'e-2025-09-07', title: '목사님 생신', date: '2025-09-07', category: '교회행사', photos: 12 },
  { id: 'e-2025-08-23', title: '유초등 나들이', date: '2025-08-23', category: '교회행사', photos: 21 },
  { id: 'e-2025-07-27', title: '중고등대 선교훈련 (7월 27일~8월 1일)', date: '2025-07-27', category: '교회행사', photos: 19 },
  { id: 'e-2025-07-26', title: '유초등 여름성경학교', date: '2025-07-26', category: '교회행사', photos: 12 },
  { id: 'e-2025-07-19', title: '복날 어버이 식사', date: '2025-07-19', category: '교회행사', photos: 4 },
  { id: 'e-2025-07-18', title: '대청 MT', date: '2025-07-18', category: '교회행사', photos: 22 },
  { id: 'e-2025-07-13', title: '김선례 집사 팔순 잔치', date: '2025-07-13', category: '교회행사', photos: 7 },
  { id: 'e-2025-06-29', title: '무학산 기도원', date: '2025-06-29', category: '교회행사', photos: 2 },
  { id: 'e-2025-06-08', title: '전교인 야유회', date: '2025-06-08', category: '교회행사', photos: 18 },
  { id: 'e-2025-05-18', title: '스승의 주일', date: '2025-05-18', category: '교회행사', photos: 2 },
  { id: 'e-2025-05-17', title: '어버이 식사', date: '2025-05-17', category: '교회행사', photos: 9 },
  { id: 'e-2025-05-11', title: '어린이주일', date: '2025-05-11', category: '교회행사', photos: 7 },
  { id: 'e-2025-05-04', title: '선교팀 출국·귀국 (5월 4~9일)', date: '2025-05-04', category: '교회행사', photos: 4 },
  { id: 'e-2025-05-03', title: '여선교회 야유회', date: '2025-05-03', category: '교회행사', photos: 44 },
  { id: 'e-2025-04-26', title: '주일학교 봄대회', date: '2025-04-26', category: '교회행사', photos: 38 },
  { id: 'e-2025-04-20', title: '부활절 구역별 찬양대회', date: '2025-04-20', category: '교회행사', photos: 10 },
  { id: 'e-2025-04-20-2', title: '부활절 찬양대', date: '2025-04-20', category: '교회행사', photos: 2 },
  { id: 'e-2025-04-14', title: '고난주간 및 이웃나눔', date: '2025-04-14', category: '교회행사', photos: 9 },
  { id: 'e-2025-04-05', title: '식목일', date: '2025-04-05', category: '교회행사', photos: 9 },
  { id: 'e-2026-10-04', title: '전교인 가을소풍', date: '2026-10-04', category: '교회행사' },
  { id: 'e-2026-10-09', title: '네팔 구호를 위한 선교바자회 (10월 9~10일)', date: '2026-10-09', category: '교회행사' },
  { id: 'e-2026-09-07', title: '2026 KPC 신학세미나 및 반석교회 교육관 헌당식', date: '2026-09-07', category: '선교행사' },
  { id: 'e-2026-08-22', title: '네팔 3차 교회 헌당식 및 우물기증식 (부산서부노회 남부시찰 동행)', date: '2026-08-22', category: '선교행사' },
  { id: 'e-2026-08-02', title: '필리핀 단기선교 (8월 2~8일, 늘푸른교회와 함께)', date: '2026-08-02', category: '선교행사' },
  { id: 'e-2026-07-19', title: '필리핀 민다나오 선교 (7월 19~24일)', date: '2026-07-19', category: '선교행사' },
  { id: 'e-2026-06-28', title: '강송자, 윤상홍 선교관 개관식', date: '2026-06-28', category: '교회행사' }
];

