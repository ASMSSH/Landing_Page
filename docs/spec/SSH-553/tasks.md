# SSH-553 — 작업 목록 (S1 영수증 드래그 앤 드롭 + 「베타」 문구 교체)

`spec.md`를 커밋 단위로 쪼갠 것. 번호는 spec의 절과 맞췄다. 드롭(1·2절) → 문구(3·4절) → 검증 → Figma.

## 0. 문서 — 브랜치 `feat/SSH-553` (base: `dev`)

- [x] `docs/spec/SSH-553/spec.md` — 배경·왜 「베타」를 빼는가·범위 6절·범위 밖·검증
- [x] `docs/spec/SSH-553/tasks.md`
- [x] **커밋** `docs: SSH-553 spec·tasks 작성`
- [x] **Draft PR 생성** — #38 `S1 영수증 드래그 앤 드롭 + 「베타」 문구를 무료 이용 기간으로 교체(SSH-553)`, base `dev`.
      2026-09-12 사용자가 Draft 직후 구현까지 요청 — 1차 리뷰 없이 아래 1~4를 같은 브랜치에서 잇는다

## 1. 업로드 카드 드롭 영역 — spec 1절

- [x] `src/apply/steps/ReceiptUploadCard.tsx` — `onDrop` prop · 드래그 카운터(`useRef`) · `is-dragover` 클래스 · 「여기에 놓으세요」 문안 · `loading`이면 무시
- [x] `src/apply/steps/StepTreatment.tsx` — `onDrop={(file) => void handleFile(file)}`
- [x] `src/styles/apply.css` — `.apply-upload.is-dragover`
- [x] **커밋** `feat: /apply S1 업로드 카드에 영수증 사진을 끌어다 놓으면 파일 선택과 같은 경로로 읽기`

## 2. 카드 밖 드롭 차단 — spec 2절

- [x] `src/apply/ApplyPage.tsx` — `ApplyShell`에 window `dragover`/`drop` 차단 효과(`defaultPrevented`면 통과)
- [x] **커밋** `feat: /apply 카드 밖에 사진을 놓아도 브라우저가 이미지를 열지 않게`

## 3. `/apply` 「베타」 제거 — spec 3절

- [x] `ApplyHeader.tsx` 부제·배지 · `ApplyFooter.tsx` · `ApplyRail.tsx` · `useApplyMeta.ts`
- [x] `steps/StepDocuments.tsx` `DocsPromoCard`·`apply-docs-promo*` · `steps/StepConsent.tsx` `apply-consent-note` · `steps/ConsentDialog.tsx`
- [x] `consents.ts` 주석 · `src/styles/apply.css`(`.apply-beta` 삭제 · 클래스 개명 · 1행 주석)
- [x] **커밋** `fix: /apply 「베타」 문구·BETA 배지를 무료 이용 기간·프로모션 안내로 교체`

## 4. 랜딩 `BETA` 배지 제거 — spec 4절

- [x] `src/mvp/MvpModal.tsx` 배지 한 줄 삭제 · `src/index.css` `.beta-badge` 삭제
- [x] **커밋** `fix: 랜딩 체험 모달의 BETA 배지 제거`

## 5. 검증 — spec 「검증」

- [x] `npm run build` · `npm run lint` · `npm test`
- [x] 로컬 동선(headless Chromium) — 드롭 성공·거부·카드 밖·`done` 재드롭 · 「베타」 grep 0
- [ ] Vercel 프리뷰
- [x] 스크린샷 S1 1440 · 768 · 390 + 1440 드래그 강조 → `docs/spec/SSH-553/apply-s1-*.png`
- [x] **커밋** `docs: SSH-553 검증 기록·스크린샷`

## 6. Figma 시안 동기화 — spec 5절

- [ ] 데스크톱·모바일 `/apply` 헤더 `BETA` 배지 삭제 · S3 카드 · S5 안내 · 동의 모달 메타 문구

## 7. 마무리

- [ ] PR 본문 갱신(`/pr`) → `/pr-review` 별도 서브에이전트 → P1·P2 반영
- [ ] Ready 전환 · Jira 검토 중 이동은 사람이 한다 — 남았다고 보고. 문안(spec 3절 표)은 성식 확인

## 하지 않는 것

- 실패 문구 위치 변경(SSH-550) · 위키 ⑥ 갱신(위키 PR) · `src/mvp/*` 삭제(SSH-545) · 카드 클릭 업로드·여러 장·붙여넣기 · `consent-v2`
