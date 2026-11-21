# [입력 필요] 항목 체크리스트

사이트에서 임시값(샘플)으로 두었거나 교회의 확인이 필요한 항목입니다. 입력할 위치(파일)와 함께 정리했습니다.
먼저 필요한 순서대로 정렬했습니다. 모두 채운 뒤 `data/church.js` 의 `showSamples` 를 `false` 로 바꾸세요.

## A. 먼저 필요한 것 (공개 전 필수)

| 완료 | 항목 | 입력 위치 | 비고 |
|---|---|---|---|
| ☐ | 교회 대표 이메일 | `data/church.js` → `email` | 비워 두면 화면에 표시되지 않음. 교회 공식 이메일을 권장 |
| ☑ | 교회 로고 | `assets/img/logo.png` | 적용 완료(가로형 PNG). 더 선명한 원본(SVG 또는 큰 PNG)이 있으면 교체. 탭 아이콘·카톡 공유 이미지는 이 로고에서 만든 것 |
| ☐ | 메인 대표 사진 | `assets/img/hero.jpg` | 교회 단체사진, 가로 1920px 이상 |
| ☐ | 담임목사 저서 정보 | `data/books.js` | 제목, 부제, 출판사, 출간일, 소개글, 목차, 추천사, 표지, 구매 링크. **샘플 2권은 지울 것** |
| ☐ | 선교 후원 계좌·안내 | `data/missions.js` → `missionSupport` | **공개 가능 여부를 교회가 먼저 승인**해야 함 |
| ☐ | 유튜브 채널 주소 | `data/church.js` → `youtube` | 설교 영상 영상 ID는 `data/sermons.js` |
| ☐ | 문의 접수 주소 | `data/church.js` → `formEndpoint` | Formspree 등. README 5번 참고 |
| ☐ | 카카오톡 공유 카드 키 (선택) | `data/church.js` → `kakaoJsKey` | 없어도 공유 버튼은 동작함(휴대폰 공유 창 또는 링크 복사). README 5-2 참고 |

## B. 교회에 확인받을 사실

| 완료 | 항목 | 비고 |
|---|---|---|
| ☐ | 건물 층 표기 | 시설안내는 "3층 예배당(중4층)", 시간표 이미지는 영유아부·유치부·초등부 "5층". 맞는지 확인 → `data/worship.js`, `data/about.js` |
| ☐ | 예배·모임 시간 전체 | `data/worship.js` 의 시간과 장소 |
| ☐ | 전화·팩스 번호 | 기존 사이트 하단에 `(051) 051-895-2251` 로 중복 표기되어 있었음. 이 사이트는 051-895-2251 / 051-895-2257 로 입력 |
| ☐ | 담임목사 인사말 | 기존 인사말(뉴노멀 언급)을 짧게 줄여 사용 중. 전문을 쓸지, 새로 쓸지 결정 |
| ☐ | 올해 표어와 연도 | `data/church.js` → `slogan` (매년 교체) |

## C. 자료를 받아서 채울 것

| 완료 | 항목 | 입력 위치 |
|---|---|---|
| ☐ | 비전, 사명, 핵심가치, 신앙고백, 교단 소개 | `about/vision.html` 의 샘플 블록을 실제 내용으로 교체 |
| ☐ | 연혁 | `data/about.js` → `history` (샘플 지우기) |
| ☐ | 교역자·직분자 이름, 직분, 사진 | `data/about.js` → `people` |
| ☐ | 부서별 소개글, 담당 교역자 | `data/departments.js` → `intro`, `minister` |
| ☐ | 찬양대 소개, 연습 시간, 단원 모집 | `worship/choir.html` 의 샘플 블록 |
| ☐ | 대중교통 안내, 주차 안내(대수·이용 방법) | `about/location.html` 의 샘플 블록 |
| ☐ | 네팔·필리핀 선교 소개글, 선교 비전 | `data/missions.js` → `intro`, `missionVision` |
| ☐ | 새가족 등록 절차 | `data/about.js` → `faq`, `newcomer/index.html` 등록 안내 샘플 |
| ☐ | 행사 정확한 날짜 | `data/news.js` → `events` (현재는 기존 사이트의 행사일 또는 게시일 기준) |
| ☐ | 주보 PDF | `assets/bulletins` + `data/news.js` → `bulletins` |
| ☐ | 교회 시설·행사 사진 | `assets/img/album` + `data/news.js` → `gallery` |
| ☐ | 설교 영상 ID, 본문, 요약 | `data/sermons.js` (현재 제목만 있음. 기존 사이트의 일부 설교 제목을 옮겨 둠) |

## D. 법적·운영 확인

| 완료 | 항목 | 비고 |
|---|---|---|
| ☐ | 개인정보처리방침 검토 | `privacy.html` 은 초안. 실제 처리 현황(문의 폼 서비스 등)에 맞게 검토 |
| ☐ | 사진 게시 동의 | 특히 어린이·청소년 사진은 보호자 동의 |
| ☐ | 도서 표지·목차·추천사 사용 허락 | 출판사/저자 확인 |
| ☐ | 도메인 등록처 확인 | kosinchurch.com / www.kosinchurch.com 을 어디서 관리하는지, 연결 전에 확인 |
| ☐ | 사용할 주소 결정 | 현재 `https://www.kosinchurch.com`(기존 홈페이지 주소)로 들어가 있음. 다른 주소(예: www 없는 `https://kosinchurch.com`)를 쓰려면 `tools\set-domain.ps1` 로 한 번에 변경 (README "도메인 주소를 나중에 바꾸고 싶을 때") |
| ☐ | 관리자 2명 이상 지정 | GitHub 교회 공용 계정, 담당자 변경에도 운영이 끊기지 않도록 |
| ☐ | `robots.txt`, `sitemap.xml` 의 도메인 | 도메인 연결 후 실제 도메인과 같은지 확인 |
| ☐ | 공유 미리보기 이미지 주소 | 모든 페이지 `<head>` 의 `og:image` 가 `https://www.kosinchurch.com/assets/img/og-image.png` 로 적혀 있음. 도메인이 다르면 `tools\set-domain.ps1` 로 일괄 수정 (도메인 연결 전에는 카톡 미리보기에 이미지가 안 나옴) |
