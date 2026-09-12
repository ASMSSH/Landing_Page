# SSH-545 — 작업 목록 (랜딩 CTA 통일·구 기능 제거 + /apply 트래킹 5개 + 배포 준비)

`spec.md`를 커밋 단위로 쪼갠 것. 번호는 spec의 절과 맞췄다. 순수 함수(1) → 랜딩 화면(2) → 제거(3) → 트래킹(4) → 쿼리(5) → 검증 → Figma → 마무리.
제거(3)를 화면(2) 뒤에 두는 이유: `SignupCta`·`Hero`·`Features`가 `useMvp`를 import하므로 화면을 먼저 바꿔야 `src/mvp`를 지워도 빌드가 선다.

## 0. 문서 — 브랜치 `feat/SSH-545` (base: `dev`)

- [x] `docs/spec/SSH-545/spec.md` — 배경(왜 「무료 이용 기간」인가 · 왜 `applyHref`가 순수 함수인가 · 왜 Footer 처리방침 · 왜 FAQ) · 범위 8절 · 범위 밖 · 검증
- [x] `docs/spec/SSH-545/tasks.md`
- [x] **커밋** `docs: SSH-545 spec·tasks 작성`
- [ ] **Draft PR 생성** — `랜딩 CTA 통일·구 기능 제거 + /apply 트래킹 5개(SSH-545)`, base `dev`

## 1. `applyHref` — spec 1절

- [ ] `src/lib/route.ts` — `applyHref(refCode)` · `src/lib/route.test.ts` 3건
- [ ] **커밋** `feat: 유입 코드를 붙인 /apply 링크 헬퍼 applyHref 추가`

## 2. 랜딩 CTA 통일 — spec 2절

- [ ] `src/components/ApplyCta.tsx` 신규(Second CTA) · `src/index.css` `.cta-box`·`.cta-caption`·`.cta-note`(`.signup-box` 이름 교체)
- [ ] `Hero.tsx` 칩·노트·세이지 버튼 삭제 · `Features.tsx` 하단 코랄 버튼 · `Nav.tsx`·`Footer.tsx` `applyHref` + 처리방침 링크
- [ ] `src/App.tsx` — `SignupCta` → `ApplyCta`, `MvpProvider`·`MvpModal` 제거
- [ ] `src/data/faq.ts` 5·6번 · `index.html` JSON-LD 같은 문답
- [ ] **커밋** `feat: 랜딩 CTA를 「무료로 청구 맡기기」→ /apply 하나로 통일하고 사전 알림 폼을 Second CTA로 교체`

## 3. 제거 — spec 3절

- [ ] `git rm` — `src/mvp/` · `components/OtpPanel.tsx` · `components/SignupCta.tsx` · `lib/useOtp.ts` · `lib/ocrFields.ts` · `lib/receiptSVG.ts` · `data/examples.ts` · `data/resultDocs.ts` · `App.css` · `api/subscribe.ts` · `api/request-otp.ts` · `api/verify-otp.ts` · `server/notion.ts` · `server/otp.ts`
- [ ] `vite.config.ts` `subscribeApi`·`otpApi` 삭제 · `npm uninstall tesseract.js` · `.env.example` 3개 삭제
- [ ] `src/lib/claimType.ts` `inferClaimType` + 테스트 삭제 · `analytics.ts` `mvp_modal` 분기 · 주석 정리(`claimDocuments.ts`·`server/documents.ts`·`server/claims.ts`)
- [ ] `src/index.css` 모달·OTP·폼·`.field` 블록 삭제 (반응형 포함)
- [ ] **커밋** `chore: 체험 모달·OTP·사전 알림 서버리스와 tesseract 의존성 제거`

## 4. `/apply` 트래킹 5개 — spec 4절

- [ ] `src/apply/ApplyPage.tsx` `apply_step` · `steps/StepTreatment.tsx` `apply_ocr`(ok/fail/skip) · `steps/StepDocuments.tsx` `apply_docs` · `steps/StepConsent.tsx` `apply_submit`·`apply_done`·`apply_error`
- [ ] **커밋** `feat: /apply 퍼널 트래킹 이벤트 5개 추가`

## 5. 쿼리 — spec 5절

- [ ] `supabase/queries.sql` — 전환율 `apply_done` · 퍼널 `apply_step` · OCR·서류·오류 분포 · `section` 이름 주석
- [ ] **커밋** `docs: Supabase 퍼널 쿼리를 체험 모달에서 /apply 기준으로 교체`

## 6. 검증 — spec 「검증」

- [ ] `npm run build` · `npm run lint` · `npm test`
- [ ] grep 0건 · 로컬 `/?r=test` CTA href 5개 · `/apply` 끝까지 진행하며 `events` POST 확인 · `skip` 경로
- [ ] Vercel 프리뷰 — 새로고침 · 지운 API 404 · 남은 API 정상
- [ ] 스크린샷 1440 · 768 · 390 + 하단 CTA → `docs/spec/SSH-545/landing-*.png`
- [ ] **커밋** `docs: SSH-545 검증 기록·스크린샷`

## 7. Figma 랜딩 시안 동기화 — spec 7절

- [ ] Hero 칩·노트 · Features 버튼 · Second CTA 캡션 · Footer 링크 · FAQ 5·6번

## 8. 마무리

- [ ] PR 본문 갱신(`/pr`) → `/pr-review` 별도 서브에이전트 → P1·P2 반영. 두 번째 리뷰 등록 전엔 사람 확인
- [ ] 사람 몫(spec 6절)을 보고 — 프리뷰 3명 신청 확인 · Vercel env 3개 삭제 · Ready 전환 · Jira 검토 중 · 머지 · `dev → main` · 홍보 링크 교체

## 하지 않는 것

- `PRIVACY_URL` v3 교체 · `/apply` OG 프리렌더 · SSH-550 · 위키 갱신 · 원래 안 쓰이던 랜딩 CSS 정리 · 머지·전환(사람)
