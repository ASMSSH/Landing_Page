# SSH-473 — 작업 목록 (S3 필요 서류 추천)

`spec.md`를 커밋 단위로 쪼갠 것. 번호는 spec의 절과 맞췄다. 안쪽(순수 함수·클라이언트)에서 바깥(화면·연결·스타일)으로 쌓는다.

## 0. 문서 — 브랜치 `feat/SSH-473` (base: `dev`)

- [x] `docs/spec/SSH-473/spec.md` — 배경·범위 6절·범위 밖·검증·1차 리뷰 결정 요청 10건
- [x] `docs/spec/SSH-473/tasks.md`
- [x] **커밋** `docs: SSH-473 spec·tasks 작성`
- [x] **Draft PR 생성 후 멈춘다** — `S3 필요 서류 추천 구현(SSH-473)`, base `dev`.
      1차 리뷰(작업 계획)를 받은 뒤 아래 1~7을 같은 브랜치에서 잇는다

## 1. 순수 로직 — spec 1절 (커밋 3개)

- [x] `src/lib/claimType.ts` — `inferClaimTypeFromText`(빈 값 → illness) · `inferClaimType` 첫 인자를 구조적 타입으로(mvp 의존 제거, 동작 유지) · `CLAIM_TYPE_LABEL`
- [x] `src/lib/claimType.test.ts` — 키워드 7종 · 빈/공백 → illness · 대소문자 · 우선순위 · `inferClaimType` surgery 우선·빈 fields → manual
- [x] **커밋** `feat: 병명 텍스트만으로 청구 유형을 추정하는 inferClaimTypeFromText 추가`
- [x] `src/lib/claimDocuments.ts` — `ClaimDocumentGuide` 재선언 · `fetchClaimDocuments`(10초 타임아웃·signal 합성·비-2xx throw)
- [x] **커밋** `feat: /api/claim-documents 브라우저 클라이언트 추가`
- [x] `src/apply/requiredDocs.ts` — `UNKNOWN_INSURER` · `canLookupDocs` · `toRequiredDocsSnapshot` · `fallbackRequiredDocs`(공통 3건) · `isSnapshotCurrent` · `docsSummaryLine`
- [x] `src/apply/requiredDocs.test.ts` — 변환(이름만·trim·중복·fallback 플래그) · fallback 모양 · 현재성 4케이스 · `canLookupDocs` 3케이스 · 요약 문구 2종
- [x] **커밋** `feat: S3 필요 서류 스냅샷 변환과 공통 기준 fallback 순수 함수 추가`

## 2·3·5. S3 화면 + 액션 행 + 셸 연결 — spec 2·3·5절

- [x] `src/apply/ApplyActions.tsx` — `secondary?: { label, onClick }` prop, 있으면 「← 이전」 자리에 고스트 버튼 + 루트 `has-secondary`
- [x] `src/apply/steps.ts` — 3단계 description을 로딩 문구로
- [x] `src/apply/steps/StepDocuments.tsx` — 스냅샷 파생 loading · effect(현재면 skip / 기타·모름 fallback / fetch → 스냅샷·실패 fallback, AbortController) ·
      로더+스켈레톤 / 요약 배너(+fallback 변형) / 2열 목록(빈 열 「없어요」) / 베타 카드 · `ApplyActions nextDisabled={loading} secondary=…` · 토스트
- [x] `src/apply/ApplyPage.tsx` — step 3 → `StepDocuments`
- [x] `src/apply/Toast.tsx` — 주석 갱신
- [x] **커밋** `feat: S3 필요 서류 추천 화면 추가 — 조회·로딩·담당자 안내·스냅샷 저장`

## 4. 스타일 — spec 4절

- [x] `src/styles/apply.css` — `.apply-docs-loader*` · `.apply-docs-skeleton*` + pulse · `.apply-docs-summary(.is-fallback)*` · `.apply-docs-badge*` ·
      `.apply-docs-grid/-col/-row/-empty` · `.apply-docs-beta*` · `.apply-actions.has-secondary`(≤480 세로 전폭)
  - [x] 2열 → ≤768 1열 · 긴 서류 이름 줄바꿈
  - [x] 토큰만, 하드코딩 없음
- [x] **커밋** `style: S3 로더·요약 배너·2열 서류 목록·베타 카드 스타일 추가`

## 6. 검증 — spec 「검증」

- [x] `npm run build` · `npm run lint` · `npm test`
- [x] 로컬(노션 키 있음, 헤드리스 Chromium): 피부염+삼성화재 → 로더(fetch 8초 지연) → 결과 → S4 → 복귀 시 요청 0건 · 병명 「골절」로 변경 → 상해로 재조회 · 마이브라운 직접 준비 「없어요」 (2026-09-10)
- [x] 로컬: fetch를 reject로 바꿔 실패 경로 → fallback 카드 · 「기타 / 모름」 → 요청 없이 즉시 fallback (2026-09-10)
- [x] 「서류만 확인할게요」 토스트 · ≤480 버튼 전폭 · S1·S2 액션 행 그대로
- [x] Vercel 프리뷰 `/apply?r=test` — 프리뷰에 NOTION env가 있어 실데이터 확인(삼성화재·피부 3/4, 2026-09-10)
- [x] 스크린샷 1440 · 768 · 390(결과) + 로딩 1440 + fallback 1440 → `docs/spec/SSH-473/`
- [x] **커밋** `docs: SSH-473 검증 스크린샷 추가`

## 8. 2차 피드백 반영 (2026-09-10) — spec 「2차 피드백 반영」

- [x] `ApplyActions` secondary prop·`has-secondary` CSS·S3 토스트 제거 → 「← 이전」 (**커밋** `fix: S3 액션 행을 「← 이전」으로 — 「서류만 확인할게요」 제거`)
- [x] `lib/claimDocuments.ts` `fetchClaimDocumentsOrGeneral` + `claimDocuments.test.ts` 3건 (**커밋** `fix: 청구 유형 서류가 없으면 같은 보험사 질병 서류로 다시 조회`)
- [x] 스크린샷 다시 찍기(액션 행 바뀜) · spec·tasks 갱신 (**커밋** `docs: SSH-473 2차 피드백 반영 기록·스크린샷 교체`)
- [x] Figma S3 프레임 「서류만 확인할게요」 → 「← 이전」 — 데스크톱 S3, 모바일 S3·S3 로딩(모바일은 S2와 같은 가로 한 줄로) (2026-09-10)

## 7. 마무리

- [x] PR 본문 갱신(`/pr`) → `/pr-review` **별도 서브에이전트** → P1·P2 반영, P3 이하 보고 (2026-09-10 리뷰 1회: P1·P2 없음, P3 1건 — 조회 실패 fallback이 세션 동안 굳음 → 사용자 지시로 반영: fallback 카드 「다시 찾아보기」 버튼. 재리뷰 등록은 사람 확인 뒤)
- [ ] Ready 전환 · Jira 검토 중 이동은 사람이 한다 — 남았다고 보고

## 하지 않는 것

- `apply_docs`·클릭 트래킹 (SSH-545) · `required_docs` 저장·`POST /api/claims` (SSH-544·486) · S4~S6
- `server/documents.ts`·`api/claim-documents.ts` 수정 · 노션 「공통」 행 추가(운영)
- notes·downloads 표시 · `resultDocs.ts`·`mvp/Step3Result.tsx` 정리 (SSH-545) · `index.css` 수정
- 청구 유형을 OCR `claimType`으로 대체 (백로그)
