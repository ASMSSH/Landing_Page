# SSH-573 — 작업 목록 (메타 픽셀 설치)

`spec.md`를 커밋 단위로 쪼갠 것. 번호는 spec의 절과 맞췄다. 래퍼(안쪽)부터 만들고 호출부(바깥)를 잇는다.

## 0. 문서 — 브랜치 `feat/SSH-573` (base: `dev`)
- [x] spec.md · tasks.md
- [x] **커밋** `docs: SSH-573 spec·tasks 작성`
- [x] **Draft PR 생성 후 멈춘다** — `메타 픽셀 설치(SSH-573)`, base `dev` → PR #40

## 1. 기본 픽셀 + 래퍼 — spec 1·2절
- [x] `Project/index.html` — `<head>` 끝에 기본 픽셀 스니펫 + noscript (ID `28502024599409299`)
- [x] `Project/src/lib/metaPixel.ts` — `pixelStartApplication` · `pixelSubmitApplication` + `window.fbq` 타입 선언. fbq 부재 시 무시
- [x] **커밋** `feat: 메타 픽셀 기본 코드 삽입 + fbq 래퍼 추가`

## 2. 이벤트 호출부 — spec 3·4절
- [x] `Project/src/main.tsx` — `isApplyPath` 분기에서 `pixelStartApplication()`
- [x] `Project/src/apply/steps/StepConsent.tsx` — `submitClaim().then()` 성공 콜백에서 `pixelSubmitApplication()`
- [x] **커밋** `feat: /apply 진입·제출 성공에 메타 픽셀 이벤트 발사`

## 3. 검증 — spec 「검증」
- [x] `npm run build` · `npm run lint` · `npm test` (테스트 97개 통과, lint 경고는 기존 ApplyContext 것 하나)
- [x] 로컬 dev 서버에서 `/`·`/apply` 서빙 HTML에 픽셀 스니펫(init·PageView·noscript) 포함 확인 (curl)
- [ ] 로컬: Pixel Helper로 PageView(`/`·`/apply`) · StartApplication · SubmitApplication 동선 확인
- [ ] Vercel 프리뷰에서 같은 동선 + 새로고침 재발사 없음
- [ ] 배포 후 이벤트 관리자 「이벤트 테스트」 탭에서 3개 이벤트 확인 (실서비스 도메인 기준)

## 4. 마무리
- [ ] PR 본문 갱신(`/pr`) → `/pr-review` 별도 서브에이전트 → P1·P2 반영
- [ ] Ready 전환 · Jira 검토 중 이동은 사람이 한다 — 남았다고 보고

## 하지 않는 것
- 전환 API(Supabase Edge Function) — 증액 판정 후 별도 티켓
- 도메인 인증 — 코드 무관, 메타 비즈니스 설정에서
- `analytics.ts`(자체 트래킹) 수정 — 픽셀은 별도 채널
