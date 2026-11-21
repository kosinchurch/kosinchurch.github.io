/* ==========================================================================
   교회소개 · 새가족 안내 자료: 섬기는 분들, 연혁, 시설, 자주 묻는 질문, 새가족 3단계
   - 글 안에서 {{time:sun-am}} 은 worship.js 의 시간, {{place:sun-am}} 은 장소, {{phone}} 은 교회 전화번호로
     자동으로 바뀝니다. (예배 시간이 바뀌어도 여기를 따로 고칠 필요가 없습니다.)
   - sample: true 항목은 샘플입니다. 실제 자료를 입력한 뒤 지우세요.
   ========================================================================== */
window.KOSIN = window.KOSIN || {};

/* ---------- 섬기는 분들 ---------- */
/* group : 화면의 묶음 제목 (담임목사 / 부목사 / 강도사 / 시무 장로 …). 같은 group 끼리 모여 아래 순서대로 나옵니다.
   photo : 사진 경로 예) 'assets/img/people/kim-gyeongheon.jpg'  (비워 두면 이름의 첫 글자가 대신 보입니다)
   ※ 이름은 기존 홈페이지 화면을 보고 옮긴 것입니다. 교회에서 한 번 확인해 주세요. */
KOSIN.people = [
  { group: '담임목사', name: '김경헌', role: '담임목사', photo: 'assets/img/people/kim-gyeongheon.jpg', bio: '' },
  { group: '부목사', name: '오문갑', role: '부목사', photo: 'assets/img/people/oh-mungap.jpg' },
  { group: '부목사', name: '조필근', role: '부목사', photo: 'assets/img/people/jo-pilgeun.jpg' },
  { group: '부목사', name: '어저여', role: '부목사', photo: 'assets/img/people/eo-jeoyeo.jpg' },
  { group: '강도사', name: '김정태', role: '강도사', photo: 'assets/img/people/kim-jeongtae.jpg' },
  { group: '시무 장로', name: '김계연', role: '장로', photo: 'assets/img/people/kim-gyeyeon.jpg' },
  { group: '시무 장로', name: '강정석', role: '장로', photo: 'assets/img/people/kang-jeongseok.jpg' },
  { group: '시무 장로', name: '이경우', role: '장로', photo: 'assets/img/people/lee-gyeongu.jpg' },
  { group: '시무 장로', name: '정길영', role: '장로', photo: 'assets/img/people/jeong-gilyeong.jpg' },
  { group: '시무 장로', name: '정원식', role: '장로', photo: 'assets/img/people/jeong-wonsik.jpg' },
  { group: '원로 장로', name: '배호권', role: '원로장로', photo: '' },
  { group: '은퇴장로', name: '허형권', role: '은퇴장로', photo: '' },
  { group: '은퇴장로', name: '신상호', role: '은퇴장로', photo: '' },
  { group: '은퇴장로', name: '이남철', role: '은퇴장로', photo: '' }
];

/* ---------- 연혁 (시간 순서대로 적으세요) ---------- */
KOSIN.history = [
  { sample: true, year: '0000', text: '연혁 내용을 입력하세요. (예: 교회 설립)' },
  { sample: true, year: '0000', text: '연혁 내용을 입력하세요.' },
  { sample: true, year: '0000', text: '연혁 내용을 입력하세요.' }
];

/* ---------- 시설안내 (층별) ----------
   id/floor/title/desc : 층 바로가기 버튼, 층 이름, 제목, 한두 줄 설명
   photos              : file 은 assets/img/facilities/ 안의 사진 파일 이름 (작은 사진은 thumb/ 폴더에 같은 이름으로)
                         caption 은 사진 아래에 보이는 설명
   ※ 사진 설명과 층별 안내 문구는 사진을 보고 쓴 초안입니다. 방 이름 등 실제 쓰는 이름으로 교회에서 확인·수정해 주세요. */
KOSIN.facilitiesDir = 'assets/img/facilities/';
KOSIN.facilities = [
  { id: '1f', floor: '1층', title: '주차장과 현관', desc: '건물 1층에는 주차장과 현관 로비가 있습니다. 승강기로 각 층에 올라가실 수 있습니다.',
    photos: [{ file: 'f1-1.jpg', caption: '주차장' }, { file: 'f1-2.jpg', caption: '현관 로비' }] },
  { id: '2f', floor: '2층', title: '카페와 휴게 공간', desc: '카페와 함께, 차를 마시며 교제할 수 있는 휴게 공간이 있습니다.',
    photos: [{ file: 'f2-1.jpg', caption: '카페' }, { file: 'f2-2.jpg', caption: '휴게 공간' }, { file: 'f2-3.jpg', caption: '교제 공간' }] },
  { id: '34f', floor: '3·4층', title: '본당(예배당)과 로비', desc: '주일 공예배와 수요성경공부를 드리는 본당(예배당)과 본당 로비입니다.',
    photos: [{ file: 'f34-1.jpg', caption: '본당 전경' }, { file: 'f34-2.jpg', caption: '강단' }, { file: 'f34-3.jpg', caption: '본당 (뒤에서 본 모습)' }, { file: 'f34-4.jpg', caption: '본당 입구' }, { file: 'f34-5.jpg', caption: '본당 로비' }] },
  { id: '5f', floor: '5층', title: '교육실과 모임 공간', desc: '교육실과 모임 공간, 탁구대가 있는 휴게 공간이 있습니다.',
    photos: [{ file: 'f5-1.jpg', caption: '교육실' }, { file: 'f5-2.jpg', caption: '모임 공간' }, { file: 'f5-3.jpg', caption: '모임 공간 (다른 방향)' }, { file: 'f5-4.jpg', caption: '휴게 공간' }] },
  { id: '6f', floor: '6층', title: '식당', desc: '함께 식사하는 식당입니다. 넓은 식탁과 주방이 갖춰져 있습니다.',
    photos: [{ file: 'f6-1.jpg', caption: '식당' }, { file: 'f6-2.jpg', caption: '식당 (다른 방향)' }, { file: 'f6-3.jpg', caption: '식당과 주방' }] },
  { id: 'sky', floor: '하늘공원', title: '옥상 하늘공원', desc: '건물 옥상에 마련된 하늘공원입니다.',
    photos: [{ file: 'sky-1.jpg', caption: '하늘공원 (저녁)' }] }
];

/* ---------- 새가족 3단계 ---------- */
KOSIN.newcomerSteps = [
  { title: '주일 예배에 오세요', text: '주일 오전 {{time:sun-am}}, {{place:sun-am}}에서 함께 예배드립니다.' },
  { title: '안내를 받으세요', text: '처음 오신 분을 위한 안내는 교회({{phone}})로 문의해 주세요.' },
  { title: '함께 교제하세요', text: '다음세대·모임 소개를 보고 알맞은 모임을 찾아보세요.' }
];

/* ---------- 자주 묻는 질문 (a 에는 간단한 HTML 사용 가능) ---------- */
KOSIN.faq = [
  { q: '예배는 언제 드리나요?',
    a: '주일 오전 공예배는 {{time:sun-am}}, 주일 오후 공예배는 {{time:sun-pm}}, 수요성경공부는 {{time:wed}}에 {{place:sun-am}}에서 드립니다.' },
  { q: '자녀를 위한 예배도 있나요?',
    a: '영유아부·유치부·초등부는 주일 {{time:infant}}, 중고등부·대학청년부는 주일 {{time:youth}}에 모입니다. 자세한 안내는 <a href="next-generation/index.html">다음세대·모임</a> 페이지를 확인해 주세요.' },
  { q: '주차할 수 있나요?',
    a: '건물 1층에 주차장이 있습니다. 자세한 주차 안내는 교회({{phone}})로 문의해 주세요.' },
  { q: '지난 설교를 다시 볼 수 있나요?',
    a: '<a href="worship/sermons.html">주일예배 설교</a> 페이지에서 지난 설교를 볼 수 있습니다.' },
  { sample: true, q: '새가족 등록은 어떻게 하나요?',
    a: '새가족 등록 방법을 여기에 입력하세요.' }
];
