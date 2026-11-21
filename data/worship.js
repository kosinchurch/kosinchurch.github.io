/* ==========================================================================
   예배·모임 시간표  (여기만 고치면 메인, 예배안내, 부서 페이지, FAQ에 모두 반영됩니다)
   featured: true 인 항목이 메인 화면의 큰 카드 3개로 나옵니다.

   ※ 교회 확인 필요: 현재 사이트의 시설안내는 "3층 예배당(중4층)"이고
      시간표 이미지에는 영유아부·유치부·초등부가 "5층"으로 적혀 있습니다. 층 표기를 확인해 주세요.
   ========================================================================== */
window.KOSIN = window.KOSIN || {};

KOSIN.worshipTimes = [
  { id: 'sun-am', group: '주일예배', name: '주일 오전 공예배', day: '주일', time: '오전 11시', place: '본당', featured: true },
  { id: 'sun-pm', group: '주일예배', name: '주일 오후 공예배', day: '주일', time: '오후 2시 30분', place: '본당', featured: true },
  { id: 'wed', group: '주중 모임', name: '수요성경공부', day: '수요일', time: '저녁 8시', place: '본당', featured: true },
  { id: 'infant', group: '다음세대', name: '영유아부', day: '주일', time: '오전 10시', place: '5층' },
  { id: 'kinder', group: '다음세대', name: '유치부', day: '주일', time: '오전 10시', place: '5층' },
  { id: 'elem', group: '다음세대', name: '초등부', day: '주일', time: '오전 10시', place: '5층' },
  { id: 'youth', group: '다음세대', name: '중고등부', day: '주일', time: '오후 1시', place: '중고등부실' },
  { id: 'univ', group: '다음세대', name: '대학청년부', day: '주일', time: '오후 1시', place: '대학청년부실' }
];
