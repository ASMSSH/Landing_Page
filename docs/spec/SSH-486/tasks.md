# SSH-486 — 작업 목록 (S4 신청 정보 · S5 동의 5종 · S6 접수 완료)

`spec.md`를 커밋 단위로 쪼갠 것. 번호는 spec의 절과 맞췄다. 안쪽(문안·순수 함수·클라이언트)에서 바깥(화면·연결·스타일)으로 쌓는다.

## 0. 문서 — 브랜치 `feat/SSH-486` (base: `dev`)

- [x] `docs/spec/SSH-486/spec.md` — 배경·범위 9절·범위 밖·검증·1차 리뷰 결정 요청 11건
- [x] `docs/spec/SSH-486/tasks.md`
- [x] **커밋** `docs: SSH-486 spec·tasks 작성`
- [x] **Draft PR 생성 후 멈춘다** — `S4 신청 정보 · S5 동의 5종 · S6 접수 완료 구현(SSH-486)`, base `dev`.
      1차 리뷰(작업 계획)를 받은 뒤 아래 1~9를 같은 브랜치에서 잇는다

## 1. 동의 문안 — spec 1절

- [x] `src/apply/consents.ts` — `CONSENT_VERSION`·`CONSENT_EFFECTIVE_DATE`·`ConsentBlock`·`ConsentDoc`·`CONSENTS`(노션 5페이지 원문, 대괄호 제거·시행일·□ 줄 제거)·`consentDoc`
- [x] `src/apply/consents.test.ts` — 5개·key 유일·state 키 집합 일치·블록 ≥1·표 열 수·`[`·`□` 없음·버전
- [x] **커밋** `feat: 동의 5종 전문 consent-v1 추가`

## 2. S4 순수 로직 — spec 2절

- [x] `src/lib/birth.ts` + `birth.test.ts` — `formatBirthInput`
- [x] `src/apply/validateApplicant.ts` + `validateApplicant.test.ts` — 이름·전화·생년월일(형식·미래·만 14세)·반려동물
- [x] `src/apply/steps/applicantFields.ts` — `fieldId`·`APPLICANT_FIELD_ORDER`
- [x] **커밋** `feat: S4 신청 정보 검증·생년월일 포맷 순수 함수 추가`

## 3. S4 화면 — spec 3절

- [x] `src/apply/steps/ApplicantForm.tsx` — 2열 폼 4칸(전화·생년월일 자동 포맷) + 안내 `.apply-note.is-info`(Figma 변수 `tint/info`·`on-tint/info`를 `index.css` 토큰 `--tint-info`·`--on-tint-info`로 — 1차 리뷰 지시)
- [x] `src/apply/steps/StepApplicant.tsx` — 헤딩·폼·「다음」 검증·첫 오류 포커스
- [x] `src/apply/steps.ts` — 4단계 description
- [x] `src/apply/ApplyRail.tsx` — 보호자 행 「이름 · 전화」
- [x] `src/apply/ApplyPage.tsx` — step 4 → `StepApplicant`
- [x] **커밋** `feat: S4 신청 정보 폼 추가 — 이름·전화·생년월일·반려동물 검증`

## 4. 전송 — spec 4절

- [x] `src/apply/claimPayload.ts` + `claimPayload.test.ts` — `toClaimPayload`(snake_case·trim·null·진료비 숫자)
- [x] `src/lib/claims.ts` — `submitClaim`(15초 타임아웃·signal 합성·응답 계약)
- [x] `src/lib/analytics.ts` — `getRefCode` export
- [x] **커밋** `feat: POST /api/claims 브라우저 클라이언트와 claims 컬럼 payload 변환 추가`

## 5. S5 동의 + S5-a 전문 — spec 5절 (커밋 2개)

- [x] `src/apply/ApplyActions.tsx` — `nextLabel?` prop
- [x] `src/apply/steps/ConsentDocument.tsx` — 칩·제목·메타·블록 렌더(h/p/ol/ul/table, `**`→strong)·주의·「닫기」
- [x] `src/apply/steps/StepConsent.tsx` — 마스터 행·개별 5행·베타 문구·`viewing` + `pushState`/`popstate` 연동
- [x] `src/apply/steps.ts` — 5단계 description · `ApplyPage.tsx` step 5 → `StepConsent`
- [x] **커밋** `feat: S5 동의 5종 체크·전문 보기·「신청하기」 전송 화면 추가` (전문·전송이 한 컴포넌트라 커밋 하나로 합침)
- [x] `StepConsent.tsx` — `submit`(submitting·failed·abort)·오류 배너·「다시 시도」·「인스타 DM으로 신청」

## 6. S6 접수 완료 — spec 6절

- [x] `src/apply/steps/StepDone.tsx` — 체크 원·접수번호 박스·절차 4단계·인스타 CTA·안내·「처음으로」
- [x] `src/apply/ApplyPage.tsx` — step 6 → `StepDone`
- [x] **커밋** `feat: S6 접수 완료 화면 추가 — 접수번호·절차 안내·처음으로`

## 7. 정리 — spec 7절

- [x] `src/apply/steps/StepPlaceholder.tsx` 삭제 · `apply.css` `.apply-placeholder` 삭제 · `ApplyPage.tsx` 주석
- [x] **커밋** `chore: 단계 본문이 모두 채워져 StepPlaceholder 제거`

## 8. 스타일 — spec 8절

- [x] `src/styles/apply.css` — `/* S5: 동의 */` `/* S5-a: 동의 전문 */` `/* S6: 접수 완료 */` 절 + ≤768·≤480 규칙. 토큰만
- [x] **커밋** `style: S5 동의 목록·전문·S6 접수 완료 스타일 추가`
- [x] 검증 중 발견 → **커밋** `style: 전문·접수 완료 섹션의 전역 padding 제거, (필수) 줄바꿈 방지` · `fix: 접수 완료에서 프로그레스 완료 단계를 체크로 표시`(Figma S6은 전부 체크)

## 9. 검증 — spec 「검증」

- [x] `npm run build` · `npm run lint` · `npm test` — consents 7 · birth 2 · validateApplicant 8 · claimPayload 4 신규, 총 61건 (2026-09-10)
- [x] 로컬 S4 검증 동선 7케이스 · S5 체크 동선 · S5-a 전문·뒤로가기 · 전송 실패 배너
- [x] 헤드리스 fetch 스텁 → S6 → 「처음으로」
- [ ] Vercel 프리뷰(새로고침 포함)
- [x] 스크린샷 S5 1440·768·390 + S4·S5-a·S6·오류 1440 → `docs/spec/SSH-486/`
- [x] **커밋** `docs: SSH-486 검증 스크린샷 추가`

## 10. 마무리

- [ ] PR 본문 갱신(`/pr`) → `/pr-review` **별도 서브에이전트** → P1·P2 반영, P3 이하 보고
- [ ] Ready 전환 · Jira 검토 중 이동은 사람이 한다 — 남았다고 보고

## 하지 않는 것

- `api/claims.ts`·`server/claims.ts`·`schema.sql`·슬랙·vite 미들웨어·mock (SSH-544)
- `apply_*` 트래킹 5개 (SSH-545) · 단계 단위 history (SSH-547) · 처리방침 v3 링크·mvp 정리 (SSH-545)
- 모바일 S5 인라인 요약 카드 · 모바일 S5-a nav 축소·✕ · 연파랑 토큰
- 위임장 서명·사본 업로드·마케팅 동의·동의 철회·진행 상태 조회 (백로그)
