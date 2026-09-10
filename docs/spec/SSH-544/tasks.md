# SSH-544 — 작업 목록 (Supabase `claims` 테이블 + `POST /api/claims`)

`spec.md`를 커밋 단위로 쪼갠 것. 번호는 spec의 절과 맞췄다. 안쪽(스키마·순수 로직)에서 바깥(엔드포인트·클라이언트·env)으로 쌓는다.

## 0. 문서 — 브랜치 `feat/SSH-544` (base: `dev`)

- [x] `docs/spec/SSH-544/spec.md` — 배경·범위 6절·범위 밖·검증·1차 리뷰 결정 요청 8건
- [x] `docs/spec/SSH-544/tasks.md`
- [x] **커밋** `docs: SSH-544 spec·tasks 작성`
- [x] **Draft PR 생성 후 멈춘다** — #33 `Supabase claims 테이블 + POST /api/claims 구현(SSH-544)`, base `dev`.
      1차 리뷰(작업 계획)를 받은 뒤 아래 1~7을 같은 브랜치에서 잇는다

## 1. 스키마 — spec 1절

- [x] `Project/supabase/schema.sql` — `public.claims` DDL + 인덱스 + RLS on(정책 없음) append
- [x] **커밋** `feat: claims 테이블 DDL 추가 — RLS on, anon 정책 없음`
- [x] **사람**: Supabase 대시보드 SQL Editor에 적용 — 2026-09-10 완료(파일 전체를 붙이면 `events` 정책이 42710으로 막힌다 → `claims` 블록만)

## 2. 서버 순수 로직 — spec 2절

- [x] `Project/server/claims.ts` — 한 파일, 절 4개: PostgREST(`findByClientId` · `lastReceiptNoOfDay` · `insertClaim` 23505 분류 · `markSlackNotified`) ·
      슬랙(`buildClaimMessage` 이름·전화 없음 · `notifySlack`) · 검증(`validateClaimInput` · `todayKst` · `receiptPrefix` · `nextReceiptNo` · `boardUrlFrom`) · `createClaim`.
      `supabase.ts`·`slack.ts`로 나눴다가 합침 — `node --test`가 `.js` import를 `.ts`로 못 찾는다
- [x] `Project/server/claims.test.ts` — 19건
- [x] **커밋** `feat: claims 서버 로직 — 입력 검증·접수번호·Supabase insert·슬랙 알림`

## 3. 엔드포인트 — spec 3절

- [x] `Project/api/claims.ts` — `POST` 핸들러(`subscribe.ts` 패턴)
- [x] `Project/vite.config.ts` — `claimsApi(env)` 플러그인 + plugins 등록
- [x] **커밋** `feat: POST /api/claims 서버리스 함수와 dev 미들웨어 추가`

## 4. 클라이언트 멱등 키 — spec 4절

- [x] `Project/src/apply/ApplyContext.tsx` — `clientId`(randomUUID, `reset`에서 갱신)
- [x] `Project/src/apply/claimPayload.ts` + `claimPayload.test.ts` — `client_id` 필드·인자
- [x] `Project/src/apply/steps/StepConsent.tsx` — `toClaimPayload(state, getRefCode(), clientId)`
- [x] `Project/src/lib/claims.ts` — 머리 주석 갱신
- [x] **커밋** `feat: 신청 본문에 client_id 멱등 키 추가 — 재시도 중복 접수 방지`

## 5. 환경변수 — spec 5절

- [x] `Project/.env.example` — `SUPABASE_URL` · `SUPABASE_SECRET_KEY` · `SLACK_WEBHOOK_URL` · `GEMINI_API_KEY` · `GEMINI_MODEL`
- [x] **커밋** `chore: .env.example에 Supabase·슬랙·Gemini 변수 추가`
- [x] 로컬 `.env` — `SUPABASE_URL`·`SUPABASE_SECRET_KEY`(2026-09-10, `.env.example`과 같은 절 구조로 재정리)
- [ ] **사람**: Vercel Preview·Production 환경변수 `SUPABASE_URL`·`SUPABASE_SECRET_KEY` — 아직(프리뷰 `/api/claims`가 500 `server_not_configured`)

## 6. 검증 — spec 「검증」

- [x] `npm run build` · `npm run lint` · `npm test` — 80건(claims 19 신규), 2026-09-10
- [x] 로컬 `/apply?r=test` 끝까지(헤드리스) → S6 `BGN-260910-03` · `claims` 3행(`consented_at` 채워짐·`status` 신규·`slack_notified` false·`ref_code`) · curl 1번째 `-01` → 2번째 `-02` (2026-09-10)
- [x] `curl` 같은 `client_id` 2회 → 같은 `-01`·행 1개 · 400 `guardian_phone`·`consent_unique_id` · JSON 아님 400 `bad_request` · env 없이 500 `server_not_configured` · anon 키 select `[]`·insert 401 (2026-09-10)
- [ ] Vercel 프리뷰 끝까지 — **Preview 환경변수 등록 뒤**(사람)
- [x] 슬랙 1통 + `slack_notified` — 2026-09-10 webhook을 `.env`에 넣고 로컬에서 사용자가 수신 확인. 문안에 이름·마스킹 전화·반려동물 추가(spec 「슬랙 문안 변경」)
- [x] S6 접수번호 1440·390 스크린샷 → `docs/spec/SSH-544/apply-s6-{1440,390}.png`
- [x] **커밋** `docs: SSH-544 검증 기록·스크린샷 추가`

## 7. 마무리

- [x] PR 본문 갱신(`/pr`) → `/pr-review` **별도 서브에이전트** (2026-09-10 리뷰 1회: P1 없음 · P2 2건 · P3 2건 — 전부 반영)
      - (P2) S1·S2 글자 수 상한을 클라이언트에도 — `validateTreatment` 메시지 + `maxLength` (462e2d7)
      - (P2) 같은 `client_id` 재전송은 행 내용 갱신 + 접수번호 유지 (a5daa81)
      - (P3) `randomUUID` 비보안 컨텍스트 폴백 · 서버리스 본문 413 (18ca0b2)
- [ ] 재리뷰 등록 — **사람 확인 뒤**(한 PR에 두 번째 리뷰)
- [ ] 로컬 검증 중 발견 → SSH-550(영수증 분석 실패 문구를 토스트 대신 업로드 카드 위 빨간 글씨로) 생성, 이 PR 범위 밖
- [ ] Jira SSH-544 코멘트 #10125(멱등 키)에 「이 PR에서 반영」 답글은 사람이
- [ ] Ready 전환 · Jira 검토 중 이동은 사람이 한다 — 남았다고 보고

## 하지 않는 것

- 슬랙 채널·webhook 생성 · 처리방침 v3 (SSH-474 · 성식)
- `apply_*` 트래킹 · `queries.sql` 퍼널 · 배포 판정·프로덕션 · `server/notion.ts`·OTP 삭제 (SSH-545)
- rate limit·captcha · 슬랙 자동 재시도 · 운영 UI (백로그)
- `client_id`를 reducer 상태에 넣기 · `server/`가 `src/`를 import하기
