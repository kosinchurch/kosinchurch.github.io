/* ==========================================================================
   회원 로그인 설정 (성경 통독 · 성경 타자 기록을 여러 기기에서 이어 쓰기)
   - 서비스: Supabase 무료 요금제 (프로젝트 kosinchurch, 서울 지역). 로그인은 카카오톡(구글은 설정이 끝나면 추가).
   - supabaseUrl 이 비어 있으면 로그인 기능은 꺼져 있고, 화면에 아무것도 나타나지 않습니다. (되돌리기: supabaseUrl: '' 로 바꿔 올리기)
   - 아래 두 값은 "공개되어도 되는" 값입니다. (프로젝트 주소, 공개용 키 = publishable key)
     ※ 절대 넣으면 안 되는 값: sb_secret_… (비밀 키), 데이터베이스 비밀번호, 카카오·구글의 Client Secret
   - providers : 화면에 보여 줄 로그인 방법. Supabase 에서 켠 것만 넣으세요. 구글을 켠 뒤에는 ['kakao', 'google'] 로 바꿔 올리면 됩니다.
   - 설명서: assets/js/account.js 맨 위
   ========================================================================== */
window.KOSIN = window.KOSIN || {};
KOSIN.accountCfg = {
  enabled: true,
  supabaseUrl: 'https://cefnsnrsphorsxprsrvp.supabase.co',
  supabaseKey: 'sb_publishable_NmTePyAnZXqNL4aZQN3FOA_qp6-eld0',
  providers: ['kakao']
};
