# SSH-548 — 작업 목록 (`/apply` 「이전 / 다음」 액션 행을 화면 안에 두기)

`spec.md`를 커밋 단위로 쪼갠 것. 번호는 spec의 절과 맞췄다. CSS(1·2절) → 효과(3절) → 검증.

## 0. 문서 — 브랜치 `fix/SSH-548` (base: `dev`)

- [x] `docs/spec/SSH-548/spec.md` — 배경·왜 하이브리드인가·범위 4절·범위 밖·검증·1차 리뷰 결정
- [x] `docs/spec/SSH-548/tasks.md`
- [x] **커밋** `docs: SSH-548 spec·tasks 작성`
- [x] **Draft PR 생성** — `/apply 액션 행을 모바일 고정 바·데스크톱 열 sticky로 화면 안에 두기(SSH-548)`, base `dev`, #37.
      2026-09-12 사용자가 Figma 확정 뒤 구현까지 요청 — 1차 리뷰 없이 아래 1~3을 같은 브랜치에서 잇는다

## 1. 데스크톱 열 안 sticky — spec 1절

- [x] `src/styles/apply.css` — `.apply-actions` sticky bottom · 배경(`--bg-app` 82% + 블러) · 패딩
- [x] **커밋** `fix: /apply 액션 행이 본문이 넘칠 때 메인 열 안에서 화면 아래에 붙게`

## 2. 768 이하 고정 바 — spec 2절

- [x] `src/styles/apply.css` — `@media (max-width:768px)` fixed 바 · `--apply-bar-h` · `:has(.apply-actions)` 아래 여백·푸터·토스트 · `scroll-padding-bottom` · ≤480 패딩
- [x] **커밋** `fix: /apply 768 이하에서 액션 행을 화면 아래 고정 바로`

## 3. 단계 전환 스크롤 복귀 — spec 3절

- [x] `src/apply/ApplyPage.tsx` — `ApplyShell`에 `useEffect(scrollTo 0, [state.step])`
- [x] **커밋** `fix: /apply 단계가 바뀌면 스크롤을 맨 위로`

## 4. 검증 — spec 「검증」

- [x] `npm run build` · `npm run lint` · `npm test`
- [x] 로컬 동선(headless Chromium) 1440 · 768 · 390 — spec 「검증」 항목
- [ ] Vercel 프리뷰
- [x] 스크린샷 S1 1440 · 768 · 390 → `docs/spec/SSH-548/apply-actions-*.png`
- [x] **커밋** `docs: SSH-548 검증 기록·스크린샷`

## 5. 마무리

- [ ] PR 본문 갱신(`/pr`) → `/pr-review` 별도 서브에이전트 → P1·P2 반영
- [ ] Ready 전환 · Jira 검토 중 이동은 사람이 한다 — 남았다고 보고. Jira 본문의 완료 기준을 하이브리드로 고칠지도 사람 확인

## 하지 않는 것

- 데스크톱 전 폭 fixed 바 · sticky 붙음 보더(JS) · 오류 칸 스크롤 · `viewport-fit=cover` · 트래킹(SSH-545)
