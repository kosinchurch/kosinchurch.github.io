/* ==========================================================================
   회원 로그인 설정 (성경 통독 · 성경 타자 기록을 여러 기기에서 이어 쓰기)
   - 로그인은 카카오톡·구글 두 가지입니다. (서비스: Supabase, 무료 요금제)
   - supabaseUrl 과 supabaseKey 가 비어 있으면 로그인 기능은 꺼져 있고, 화면에 아무것도 나타나지 않습니다.
   - 아래 두 값은 "공개되어도 되는" 값입니다. (프로젝트 주소, 그리고 공개용 키 = publishable / anon key)
     ※ 절대 넣으면 안 되는 값: service_role(비밀) 키, 데이터베이스 비밀번호, 카카오·구글의 Client Secret
   - 만든 방법과 되돌리는 방법은 assets/js/account.js 맨 위 설명을 보세요.
   ========================================================================== */
window.KOSIN = window.KOSIN || {};
KOSIN.accountCfg = {
  enabled: true,
  supabaseUrl: '',   // 예: 'https://abcdefghijklmnop.supabase.co'
  supabaseKey: ''    // 예: 'sb_publishable_xxxxxxxx…' (또는 예전 이름의 anon public key)
};
