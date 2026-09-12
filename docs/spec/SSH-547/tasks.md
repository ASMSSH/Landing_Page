# SSH-547 — 작업 목록 (`/apply` 브라우저 뒤로가기를 단계 되돌리기로)

`spec.md`를 커밋 단위로 쪼갠 것. 번호는 spec의 절과 맞췄다. 안쪽(순수 함수)에서 바깥(훅·화면)으로 쌓는다.

## 0. 문서 — 브랜치 `feat/SSH-547` (base: `dev`)

- [x] `docs/spec/SSH-547/spec.md` — 배경·범위 4절·범위 밖·검증·1차 리뷰 결정
- [x] `docs/spec/SSH-547/tasks.md`
- [x] **커밋** `docs: SSH-547 spec·tasks 작성`
- [x] **Draft PR 생성** — `/apply 브라우저 뒤로가기를 단계 되돌리기로(SSH-547)`, base `dev`, #36.
      2026-09-12 사용자가 Draft와 구현을 한 번에 요청 — 1차 리뷰 없이 아래 1~3을 같은 브랜치에서 잇는다

## 1. 항목 모델 — spec 1절

- [x] `src/apply/stepHistory.ts` — `toHistoryState` · `readEntryStep` · `planStepChange` · `resolvePopstate`
- [x] `src/apply/stepHistory.test.ts` — 규칙 표 ①~⑥ + 단계 오름/내림/같음
- [x] **커밋** `feat: /apply 단계 history 항목 모델과 popstate 규칙 추가`

## 2. 훅·연결 — spec 2절

- [x] `src/apply/useStepHistory.ts` — 마운트 replaceState · popstate 리스너 · step 변화 push/go
- [x] `src/apply/ApplyContext.tsx` — `useStepHistory(state.step, dispatch, submitting)` 호출
- [x] `src/apply/steps/StepConsent.tsx` — 주석의 "SSH-547이 맡는다" → `useStepHistory`로
- [x] **커밋** `feat: /apply 브라우저 뒤로가기가 이전 단계로 가게 history 연동`

## 3. S6 「홈으로」 — spec 3절

- [x] `src/apply/steps/StepDone.tsx` — 「처음으로」 버튼 → 「홈으로」 링크(`/`)
- [x] **커밋** `feat: 접수 완료 「처음으로」를 랜딩으로 가는 「홈으로」로 변경`

## 4. 검증 — spec 「검증」

- [x] `npm run build` · `npm run lint` · `npm test`
- [x] 로컬 동선 9건 (headless Chromium, S6는 `/api/claims` mock) — spec 「검증」
- [ ] Vercel 프리뷰 동선
- [x] 스크린샷 S6 1440 · 768 · 390 → `docs/spec/SSH-547/apply-done-*.png`
- [x] **커밋** `docs: SSH-547 검증 기록·스크린샷`

## 5. 마무리

- [ ] PR 본문 갱신(`/pr`) → `/pr-review` 별도 서브에이전트 → P1·P2 반영
- [ ] Ready 전환 · Jira 검토 중 이동은 사람이 한다 — 남았다고 보고

## 하지 않는 것

- 새로고침 뒤 입력값 복원 · 앞으로가기 허용 · 트래킹(SSH-545) · 액션 행 고정(SSH-548) · 동의 전문 history(SSH-486 그대로)
