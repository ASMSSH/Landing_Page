# SSH-545 — 랜딩 CTA 통일·구 기능 제거 + /apply 트래킹 5개 + 배포 준비

웹 창구 마무리. **랜딩의 모든 CTA를 「무료로 청구 맡기기」→ `/apply` 하나로** 보내고(유입 코드가 있으면 `?r=`을 달고),
**사전 알림 폼·OTP·체험 모달과 그 서버리스·라이브러리를 지우고**, `/apply` 퍼널 **트래킹 이벤트 5개**를 붙인다.
프리뷰 3명 신청 확인 → `dev → main` 머지 → 프로덕션 확인 → 홍보 링크 교체는 **사람이 한다**(이 PR은 그 직전까지).

> **이 PR이 남기는 것 한 문장**: `/?r=test`로 들어온 랜딩에서 Nav·Hero·Features·하단 CTA·Footer의 버튼이 전부 `/apply?r=test`로 가고,
> 랜딩 어디에도 사전 신청 폼·전화번호 인증·「체험해보기」가 없으며, `/apply`를 끝까지 진행하면 Supabase `events`에
> `apply_step`(1~6)·`apply_ocr`·`apply_docs`·`apply_submit`·`apply_done`이 한 세션으로 남는다.

## 배경

- **Jira** SSH-545 본문(2026-09-12, 「유입 코드 전달」 추가분 포함). 형제 티켓은 전부 `dev`에 머지됐다 — SSH-542(셸·Nav variant·Hero 주 버튼),
  SSH-543(S1·S2), SSH-473(S3), SSH-486(S4~S6), SSH-544(`POST /api/claims`), SSH-547·548·553(버그·QA). **이 티켓이 에픽 SSH-487의 마지막이다.**
  앞 spec들이 「SSH-545에서」로 미룬 항목을 여기서 전부 거둔다 — 아래 「지금 레포 상태」
- **위키** `wiki/기획/대리청구-웹-창구-설계.md` (2026-09-09 갱신) — ⑨ 트래킹 이벤트 5개(이름·시점·props), ⑩ 랜딩 변경 4건, ⑦ 기술 표의 「제거」 행,
  ⑫ 배포 마일스톤(프리뷰 3명 → main → 홍보 링크). `wiki/기획/랜딩페이지-운영-이력.md` 9/8 절 — 사전 알림·체험 모달 폐기 경위와
  삭제 대상 파일(`server/notion.ts`·`api/subscribe.ts`·`api/request-otp.ts`)
- **Figma** 랜딩 데스크톱 시안 — Hero 칩·주 버튼 하나·Hero 노트, Second CTA 박스(H2·부제·버튼·캡션·인스타 안내), Footer 링크 4개.
  시안은 아직 「베타 기간 무료」·Features의 세이지 「체험해보기」·Footer 「문의하기」를 갖고 있다 — **코드가 앞서고 시안을 뒤에 맞춘다**(7절)

### 왜 「베타 기간 무료」가 아니라 「무료 이용 기간」인가

티켓·Figma는 9/10 문안(「베타 기간 무료」)이다. SSH-553(2026-09-12 머지)이 QA 피드백으로 화면의 「베타」를 전부 「무료 이용 기간」·「무료 프로모션」으로
바꿨다 — "미완성 서비스"로 읽혀서. 랜딩에 「베타」를 되살리면 그 결정과 어긋난다. `/apply` 헤더와 같은 문구(「무료 이용 기간 · 로그인 없이 5분」)로 맞춘다.

### 왜 `applyHref(refCode)`는 순수 함수이고 호출자가 `getRefCode()`를 넘기는가

티켓은 "`getRefCode()`가 있으면 `?r=`을 붙이는 헬퍼 하나"를 말한다. `src/lib/route.ts`가 `analytics.ts`를 import하면 `route.test.ts`(node:test)가
깨진다 — `analytics.ts`는 모듈 최상단에서 `import.meta.env`·`sessionStorage`를 읽어 Node에서 로드가 안 된다. 그래서 `route.ts#applyHref(refCode)`는
문자열만 만들고(테스트 가능), CTA 다섯 곳이 `applyHref(getRefCode())`로 부른다. `getRefCode()`는 첫 호출에 `?r=`을 sessionStorage에 저장하므로
같은 탭 안에서는 어느 CTA에서 눌러도 같은 코드가 붙는다.

### 왜 Footer에 개인정보처리방침 링크를 두는가

지금 랜딩의 처리방침 링크는 사전 신청 폼 아래 한 곳뿐이다(`SignupCta`). 폼을 지우면 랜딩에서 처리방침으로 가는 길이 없어진다 — 처리방침 v2는
Supabase 행동 로그 수탁을 명시하므로 랜딩(트래킹이 도는 페이지)에 링크가 있어야 한다. Footer 저작권 줄 옆에 둔다(`PRIVACY_URL`, 새 탭).
v3 교체는 성식 문서가 나온 뒤(범위 밖).

### 왜 FAQ 두 항목을 고치는가

「언제 출시되나요? — 지금 사전 신청을 받고 있어요. 출시되면 … 전화번호로 알려드릴게요」·「전화번호를 남기기가 부담스러워요」는 사전 알림 폼을
전제한 문답이다. 폼을 지운 뒤 남기면 완료 기준("사전 신청 UI가 없다")에 어긋나는 문장이 화면에 남는다. `index.html`의 JSON-LD `FAQPage`가 같은
문답을 갖고 있어 **둘을 같이** 고친다(구글 리치 결과와 화면이 어긋나면 안 된다).

### 지금 레포 상태 — 딛고 설 것과 지울 것

| 영역 | 지금 | 이 티켓 뒤 |
| --- | --- | --- |
| `App.tsx` | `Landing`이 `MvpProvider`로 감싸고 `MvpModal`을 렌더 | Provider·모달 없이 섹션만 |
| `Nav.tsx` | landing variant CTA 「무료로 청구 맡기기」→`APPLY_PATH` (SSH-542) | `applyHref(getRefCode())` |
| `Hero.tsx` | 칩 「🐾 출시 준비 중 — 사전 알림 신청받아요」 · 주 버튼 `/apply` + 세이지 「체험해보기」(`useMvp().open`) · 노트 「출시되면 가장 먼저 …」 | Figma 문안, 버튼 하나 |
| `Features.tsx` | 하단 `center-cta` 세이지 「체험해보기」(`useMvp`) | 코랄 「무료로 청구 맡기기 🐾」→`/apply` |
| `SignupCta.tsx` | `mvp-strip`(체험 유도) + 전화번호·보험사·동의 2종·`OtpPanel`·`/api/subscribe` 폼 | `ApplyCta.tsx` — Figma Second CTA(H2·부제·버튼·캡션·인스타 안내) |
| `Footer.tsx` | 링크 문제·기능·FAQ·「문의하기」(`#signup`) | 「문의하기」→ 「청구 맡기기」(`applyHref`) + 처리방침 링크 |
| `src/lib/analytics.ts` | `track`·`getRefCode` · 클릭 캡처의 `.modal` → `mvp_modal` 섹션 판정 | `mvp_modal` 분기 제거. 나머지 그대로 |
| `src/lib/route.ts` | `APPLY_PATH`·`isApplyPath` | + `applyHref(refCode)` |
| `src/apply/*` | 트래킹은 인스타 링크 `cta_click`뿐 | 5개 이벤트 추가(4절) |
| `src/mvp/*` 7개 · `OtpPanel.tsx` · `useOtp.ts` · `ocrFields.ts`(tesseract) · `receiptSVG.ts` · `data/examples.ts` · `data/resultDocs.ts` · `App.css` | 체험 모달·OTP·예시 영수증. `App.css`는 import하는 곳이 없다 | **삭제** |
| `api/subscribe.ts` · `api/request-otp.ts` · `api/verify-otp.ts` · `server/notion.ts` · `server/otp.ts` · `vite.config.ts`의 `subscribeApi`·`otpApi` | 사전 알림·OTP 서버리스 | **삭제.** `server/documents.ts`(노션 서류 룩업)·`server/gemini.ts`·`server/claims.ts`는 남는다 |
| `package.json` `tesseract.js` | `ocrFields.ts`만 쓴다 | 의존성 제거 |
| `.env.example` | `NOTION_SUBSCRIBE_DATA_SOURCE_ID`·`OCTOMO_API_KEY`·`OTP_SECRET` | 제거. `NOTION_TOKEN`·`NOTION_DOCS_DATA_SOURCE_ID`는 서류 룩업이 계속 쓴다 |
| `src/lib/claimType.ts` | `inferClaimTypeFromText`(apply) + `inferClaimType(fields, surgery)`(mvp 전용, 주석에 "SSH-545에서 지워진다") | 후자와 그 테스트 삭제 |
| `src/index.css` | 랜딩 + MVP 모달·OTP·사전 알림 폼 클래스(178~213·228~398행·반응형 모달 블록) | 모달·OTP·폼 블록 삭제, `.cta-box` 추가 |
| `supabase/queries.sql` | 체험 모달 퍼널(`mvp_open`·`mvp_step`·`mvp_close`)·`signup_submit` 전환 쿼리 | `/apply` 퍼널 쿼리로 교체 |

## 범위

### 1. `applyHref` — 유입 코드를 붙인 `/apply` 링크

`src/lib/route.ts`:

```ts
/** 랜딩 CTA가 가리킬 /apply 링크. 유입 코드가 있으면 ?r=<코드>를 붙여 새 탭·URL 복사·공유에서도 코드가 살아남는다 */
export function applyHref(refCode: string | null): string
```

- `refCode`가 `null`·빈 문자열·공백이면 `'/apply'`. 아니면 `'/apply?r=' + encodeURIComponent(code)`
- `route.test.ts`에 3건 — 코드 없음 / 코드 있음 / 인코딩이 필요한 코드(`a b` → `a%20b`)
- 호출: `Nav`·`Hero`·`Features`·`ApplyCta`·`Footer`가 `applyHref(getRefCode())`. `getRefCode`는 `analytics.ts`에 이미 있다

### 2. 랜딩 CTA 통일 — 파일별 문안

전부 `.btn.btn-primary`(코랄) 또는 기존 링크 스타일. **세이지(`.btn-sage`) CTA는 랜딩에서 사라진다** — 체험 색이었다.
트래킹 `cta_click`의 `cta` 값은 기존 이름을 유지하고 새 자리는 아래 표대로.

| 파일 | 요소 | 문안 | `cta_click.cta` |
| --- | --- | --- | --- |
| `Nav.tsx` | `.nav-cta` | 「무료로 청구 맡기기」 (그대로) | `nav_apply` |
| `Hero.tsx` | `.eyebrow` | 「🐾 무료 이용 기간 · 병원 서류는 저희가 대신 받아요」 | — |
| | `.cta-row` | 주 버튼 「무료로 청구 맡기기 🐾」 **하나만** (세이지 버튼 삭제) | `hero_apply` |
| | `.hero-note` | 「🐶 로그인 없이 5분이면 끝나요 · 신청하면 24시간 안에 담당자가 연락드려요」 | — |
| `Features.tsx` | `.center-cta` | 코랄 「무료로 청구 맡기기 🐾」 | `features_apply` |
| `ApplyCta.tsx` (신규, `SignupCta.tsx` 대체) | `<section id="cta">` · `.cta-box` | H2 「영수증 한 장이면 시작할 수 있어요」 · 부제 「병원 서류는 저희가 대신 받고, 보험사 제출까지 챙겨드려요.」 · 버튼 「무료로 청구 맡기기 🐾」 · 캡션 「무료 이용 기간 · 로그인 없이 5분 · 신청 후 24시간 안에 연락드려요」 · 「💬 궁금한 점은 인스타그램 @boheomgaenyang DM으로 편하게 물어보세요」(링크) | `cta_apply` · 인스타 `cta_insta_dm` |
| `Footer.tsx` | `.foot-links` 넷째 | 「청구 맡기기」→`applyHref` (「문의하기」·`#signup` 대체) · 저작권 줄 옆 「개인정보 처리방침」(`PRIVACY_URL`, 새 탭) | `footer_apply` |
| `data/faq.ts` + `index.html` JSON-LD | 5·6번 문답 | 「지금 바로 신청할 수 있나요?」 — 「네, 영수증 한 장으로 바로 신청할 수 있어요. 무료 이용 기간이라 대리 청구 비용이 없고, 신청하면 담당자가 24시간 안에 전화드려요.」 / 「웹 신청 말고 다른 방법도 있나요?」 — 「괜찮아요! 웹 신청이 부담되면 공식 인스타그램 계정(@boheomgaenyang)으로 DM을 주셔도 똑같이 안내해드려요.」(인스타 링크 유지) | — |

`ApplyCta`의 `.cta-box`는 지금 `.signup-box`의 모양(840 max · `--primary-50` 배경 · `--radius-lg` · 48/56 패딩 · 900↓ 36/24 · 640↓ 34/22)을 그대로 쓰고
이름만 바꾼다. 캡션은 `.cta-caption`(12px, `--text-tertiary`), 인스타 줄은 `.cta-note`(14px, `--text-tertiary`).
섹션 id는 `signup` → `cta` — `section_view`·`click` 트래킹의 `section` 값이 바뀐다(`queries.sql` 주석에 적는다).

### 3. 제거 — 파일·의존성·CSS·env

- **삭제**: `src/mvp/`(7개) · `src/components/OtpPanel.tsx` · `src/components/SignupCta.tsx` · `src/lib/useOtp.ts` · `src/lib/ocrFields.ts` · `src/lib/receiptSVG.ts` ·
  `src/data/examples.ts` · `src/data/resultDocs.ts` · `src/App.css` · `api/subscribe.ts` · `api/request-otp.ts` · `api/verify-otp.ts` · `server/notion.ts` · `server/otp.ts`
- `vite.config.ts` — `subscribeApi`·`otpApi` 플러그인과 import 삭제. `documentsApi`·`geminiApi`·`claimsApi`는 그대로
- `package.json` — `tesseract.js` 제거(`npm uninstall`, lock 갱신)
- `.env.example` — Notion 절에서 `NOTION_SUBSCRIBE_DATA_SOURCE_ID`, Octomo 절 통째(`OCTOMO_API_KEY`·`OTP_SECRET`) 삭제. **Vercel 환경변수 삭제는 사람이**(6절)
- `src/lib/claimType.ts` — `inferClaimType`(mvp 전용) 삭제 + `claimType.test.ts`의 해당 테스트 삭제
- `src/lib/analytics.ts` — 클릭 캡처의 `el.closest('.modal') ? 'mvp_modal'` 분기 삭제
- 주석 정리(코드 변경 없음): `server/documents.ts`·`server/claims.ts`·`src/lib/claimDocuments.ts`·`src/lib/claimType.ts`의 "`server/notion.ts`와 같은 패턴"·"resultDocs는 SSH-545에서" 같은 **사라진 파일을 가리키는 문장**만 고친다
- `src/index.css` — `/* ---------- Second CTA ---------- */` 블록의 `.mvp-strip`·`.signup-*`·`.field-row`·`.field*`·`.otp-*`·`.privacy`,
  `/* ---------- MVP Modal ---------- */`부터 `.mbtn` 블록 끝까지, 반응형의 `.signup-box`·`.field-row`·`.field-2`·`.insurer-grid`·모달 블록 전부 삭제.
  `.field` 계열도 랜딩에서 쓰는 곳이 없어진다(`/apply`는 `.apply-field`·`.apply-input`을 쓴다) — 같이 지운다. `@keyframes pop`·`spin`도 사용처가 없어져 삭제.
  **랜딩 섹션 클래스는 손대지 않는다**(원래 안 쓰이던 `.p-card`·`.pill` 등도 이 티켓 범위가 아니다)

### 4. `/apply` 트래킹 5개 — 위키 ⑨

전부 `src/lib/analytics.ts#track`. **props에 개인정보 없음** — 이름·전화·생년월일·병원명·병명·금액·사진을 넣지 않는다. 보험사명은 8개 중 하나라 넣는다.

| 이벤트 | 어디서 | 시점 | props |
| --- | --- | --- | --- |
| `apply_step` | `ApplyPage.tsx` `ApplyShell` — 기존 `useEffect([state.step])`(스크롤 복귀) 옆에 하나 더 | 단계 진입(마운트 1, 다음·이전·프로그레스·뒤로가기·제출 성공 6 전부) | `{ step: 1~6 }` |
| `apply_ocr` | `steps/StepTreatment.tsx` `handleFile` | 결과 dispatch 뒤 `ok` · 빈 결과·오류 `fail` | `{ result: 'ok' \| 'fail', reason? }` — `reason`은 `empty`·`unsupported_type`·`too_large`·`analyze_failed` 중 하나(`UnsupportedImageError`·`ImageTooLargeError`로 판정). 취소(abort)는 보내지 않는다 |
| | 같은 파일 `handleNext` | 검증을 통과해 S2로 넘어가는데 `state.receiptRead`가 false | `{ result: 'skip' }` |
| `apply_docs` | `steps/StepDocuments.tsx` — 스냅샷을 dispatch하는 세 자리(조회 불가 fallback · 조회 성공 · 조회 실패 fallback) | 스냅샷 확정 | `{ insurer, docs_count: hospital+self, fallback }` |
| `apply_submit` | `steps/StepConsent.tsx` `submit` | 요청 직전 | — |
| `apply_done` | 같은 함수 `.then` | 접수번호 수신 | — (접수번호도 넣지 않는다) |
| `apply_error` | 같은 함수 `.catch`(abort 제외) | 실패 | `{ error }` — `submitClaim`이 던지는 코드(`network_error`·서버 `error` 코드·`claim_submit_failed`) |

트래킹은 화면 로직을 바꾸지 않는다 — 각 자리에 `track(...)` 한 줄이고, 실패해도 흐름에 영향이 없다(`send`가 삼킨다).

### 5. `supabase/queries.sql` — 체험 모달 퍼널 → `/apply` 퍼널

- 전환율 쿼리의 `converts`를 `event = 'signup_submit' and status = 'done'` → `event = 'apply_done'`으로
- `mvp_open`/`mvp_step`/`signup_done` 퍼널 쿼리 → `apply_step` 1~6 세션 수 + `apply_submit`·`apply_done`·`apply_error` 행
- `mvp_close` 이탈 쿼리 → 삭제. 대신 `apply_ocr` result 분포 · `apply_docs` fallback 비율 · `apply_error` error 코드 분포 쿼리
- 파일 머리에 주석: `section_view`의 `signup` 섹션은 2026-09-12 이후 `cta`

### 6. 배포 — 사람이 하는 것 (이 PR 밖, 티켓 완료 기준의 일부)

순서대로. 에이전트는 여기까지 준비하고 **머지·전환은 하지 않는다**.

1. Vercel 프리뷰에서 팀 3명이 `/apply?r=test`로 신청 → Supabase `claims` 3행 + 슬랙 3통 확인
2. Vercel 환경변수에서 `NOTION_SUBSCRIBE_DATA_SOURCE_ID`·`OCTOMO_API_KEY`·`OTP_SECRET` 삭제(코드가 더 안 읽는다)
3. 이 PR Squash Merge → `dev`. 그 뒤 `dev → main` PR(#35가 열려 있다 — 이 PR 머지 뒤 base가 갱신되면 그걸로)
4. 프로덕션 `/`·`/apply` 확인(CTA·새로고침·신청 1건) → URL 슬랙 공유 → 광고·게시물 링크를 `/apply?r=<코드>`로 교체(윤홍)
5. Jira SSH-545·에픽 SSH-487 상태

### 7. Figma 랜딩 시안 동기화 — 코드 확정 뒤

랜딩 데스크톱 시안의 텍스트를 2절 표에 맞춘다: Hero 칩 「베타 기간 무료」→「무료 이용 기간」, Hero 노트, Features 하단 세이지 「체험해보기」→ 코랄
「무료로 청구 맡기기 🐾」, Second CTA 캡션, Footer 「문의하기」→「청구 맡기기」, FAQ 5·6번. 모바일 랜딩 시안이 있으면 같이(작업 중 확인).
⚠️ 화살표·이모지가 든 텍스트는 setProperties 대신 멀쩡한 인스턴스 clone(SSH-473 메모).

### 8. 파일 목록

| 변경 | 파일 | 왜 이 티켓에 필요한가 |
| --- | --- | --- |
| 수정 | `src/lib/route.ts` · `route.test.ts` | `applyHref` (1절) |
| 수정 | `src/components/Nav.tsx` · `Hero.tsx` · `Features.tsx` · `Footer.tsx` · `src/data/faq.ts` · `index.html` | CTA 통일·문안 (2절) |
| 신규/삭제 | `src/components/ApplyCta.tsx` / `SignupCta.tsx` | 사전 알림 폼 → Second CTA (2절) |
| 수정 | `src/App.tsx` | `MvpProvider`·`MvpModal` 제거, `ApplyCta` 연결 (3절) |
| 삭제 | `src/mvp/*` · `OtpPanel.tsx` · `useOtp.ts` · `ocrFields.ts` · `receiptSVG.ts` · `data/examples.ts` · `data/resultDocs.ts` · `App.css` · `api/subscribe.ts` · `api/request-otp.ts` · `api/verify-otp.ts` · `server/notion.ts` · `server/otp.ts` | 구 기능 제거 (3절) |
| 수정 | `vite.config.ts` · `package.json` · `package-lock.json` · `.env.example` · `src/lib/claimType.ts` · `claimType.test.ts` · `src/lib/analytics.ts` · `src/lib/claimDocuments.ts` · `server/documents.ts` · `server/claims.ts` | 제거의 여파 (3절) |
| 수정 | `src/index.css` | 모달·OTP·폼 CSS 삭제, `.cta-*` 추가 (2·3절) |
| 수정 | `src/apply/ApplyPage.tsx` · `steps/StepTreatment.tsx` · `steps/StepDocuments.tsx` · `steps/StepConsent.tsx` | 트래킹 5개 (4절) |
| 수정 | `supabase/queries.sql` | 퍼널 쿼리 교체 (5절) |
| 신규 | `docs/spec/SSH-545/*` | spec·tasks·스크린샷 |

## 범위 밖 — 다른 곳에서 한다

| 안 하는 것 | 어디서 |
| --- | --- |
| 개인정보처리방침 v3로 `PRIVACY_URL` 교체 | 성식 문서 뒤 별도 커밋(티켓 본문) |
| `/apply` 전용 OG 프리렌더(카톡·인스타 미리보기) | 하지 않는다 — 홍보 링크는 게시물 안 링크라 미리보기 비중이 낮다(SSH-542 1차 리뷰 결정). 필요해지면 새 티켓 |
| S1 OCR 실패 빨간 오류 문구 | SSH-550 |
| 위키 ⑥·⑩·랜딩 운영 이력 갱신(「베타」·랜딩 변경 완료) | 위키 PR |
| 랜딩에 원래 안 쓰이던 CSS(`.p-card`·`.pill` 등)·Problem·FAQ 다른 문답 손질 | 범위 밖 — 눈에 띄어도 안 고친다 |
| Vercel 환경변수 삭제 · 머지 · `dev → main` · 홍보 링크 교체 · Jira 상태 | 사람 (6절) |
| 유저 로깅 전반(SSH-475) | 백로그 |

## 검증

- [x] `npm run build` · `npm run lint` · `npm test` (route 3건 추가, claimType 1건 삭제 — 95건)
- [x] `grep -rn "mvp\|otp\|subscribe\|tesseract\|사전 신청\|체험해보기\|베타" src api server index.html` — 0건(주석·역사 서술 제외)
- [x] 로컬 `/?r=test` → 5개 CTA의 `href`가 전부 `/apply?r=test` · `/`(코드 없음) → `/apply`
- [x] 로컬 `/apply` 끝까지 진행하며 개발자 도구 Network의 `events` POST 본문에 `apply_step` 1~6·`apply_ocr`·`apply_docs`·`apply_submit`·`apply_done`이 보이고 props에 개인정보가 없다. OCR 없이 S2로 가면 `apply_ocr skip`
- [ ] Vercel 프리뷰 — `/`·`/apply?r=test` 새로고침, `/api/subscribe`·`/api/request-otp`가 404, `/api/claim-documents`·`/api/claims`는 정상
- [x] 랜딩 1440 · 768 · 390 스크린샷(Hero 첫 화면) + 하단 CTA·푸터 1440 → `docs/spec/SSH-545/`
- [ ] Figma 랜딩 시안 동기화(7절)
