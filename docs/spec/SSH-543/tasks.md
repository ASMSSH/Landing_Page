# SSH-543 — 작업 목록 (S1 진료 정보 등록 + S2 보험 선택)

`spec.md`를 커밋 단위로 쪼갠 것. 번호는 spec의 절과 맞췄다. 안쪽(서버·순수 함수)에서 바깥(화면·연결·스타일)으로 쌓는다.

## 0. 문서 — 브랜치 `feat/SSH-543` (base: `dev`)

- [x] `docs/spec/SSH-543/spec.md` — 배경·범위 9절·범위 밖·검증·1차 리뷰 결정 요청
- [x] `docs/spec/SSH-543/tasks.md`
- [x] **커밋** `docs: SSH-543 spec·tasks 작성`
- [x] **Draft PR 생성 후 멈춘다** — `S1 진료 정보 등록 + S2 보험 선택 구현(SSH-543)`, base `dev`.
      1차 리뷰(작업 계획)를 받은 뒤 아래 1~9를 같은 브랜치에서 잇는다

## 1. 서버 — spec 1절

- [x] `server/gemini.ts` — `GeminiAnalysis`·`RESPONSE_SCHEMA`(properties + required)·`PROMPT`·`normalizeAnalysis`에 `hospital`·`address`
- [x] `server/gemini.test.ts` — fetch 스텁으로 두 필드 통과 + 누락 시 빈 문자열
- [x] **커밋** `feat: 영수증 분석 응답에 병원 이름·주소 추가`

## 2. 클라이언트 변환 — spec 2절

- [x] `src/lib/geminiAnalyze.ts` — 응답 타입에 `hospital`·`address`, 반환을 서버 타입 그대로(`mvp/types` 의존 제거), `fetch`에 catch
- [x] `src/apply/receiptToTreatment.ts` — 날짜 4형식 → `YYYY-MM-DD`, 금액 숫자만, 빈 값은 patch에서 제외
- [x] `src/apply/receiptToTreatment.test.ts` — 정상 · 날짜 4형식 · 잘못된 날짜 제외 · 쉼표·원 제거 · 빈 값 제외
- [x] `src/apply/validateTreatment.ts` — 병원 이름·진료일(형식·오늘 이후)·진료비(빈값·0)
- [x] `src/apply/validateTreatment.test.ts` — 통과 · 필수 3칸 · 미래 날짜 · 오늘은 통과 · 0원
- [x] `src/apply/imageToDataUrl.ts` — 4MB·2000px 이하는 그대로, 초과는 1600px JPEG 0.85, 디코드 실패 처리
- [x] **커밋** `feat: 영수증 분석 결과를 진료 정보 상태로 변환하는 함수 추가`

## 3. S1 화면 — spec 3절 · 7절

- [x] `src/components/icons.tsx` — `camera` · `info`
- [x] `src/apply/Toast.tsx` — 하단 고정, 4초 자동 닫힘, `role="status"`
- [x] `src/apply/steps/ReceiptUploadCard.tsx` — idle / loading / done, 숨긴 file input(`accept` 5종, `capture` 없음), AbortController
- [x] `src/apply/steps/TreatmentForm.tsx` — 2열 폼 5칸, 진료비 쉼표 표시·숫자만 저장, 오류 표시·포커스
- [x] `src/apply/steps/StepTreatment.tsx` — 헤딩(OCR done이면 설명 교체) + 카드 + 폼 + `ApplyActions onNext`(검증 통과 시 `next`)
- [x] **커밋** `feat: S1 진료 정보 등록 화면 추가`

## 4. S2 화면 — spec 4절

- [x] `src/apply/steps/StepInsurance.tsx` — 카드 8개(`role="radio"`), `company`만 저장, 상품명 입력, 제한 안내 행, `nextDisabled`
- [x] **커밋** `feat: S2 보험 선택 화면 추가`

## 5. 셸 연결 — spec 5절

- [x] `src/apply/ApplyPage.tsx` — step 1 → `StepTreatment`, 2 → `StepInsurance`, 3~5 placeholder(기존), 6 기존
- [x] **커밋** `feat: /apply 단계 본문을 S1·S2 컴포넌트로 연결`

## 6. 스타일 — spec 6절

- [x] `src/styles/apply.css` — `.apply-upload*` · `.apply-spinner` · `.apply-form*` · `.apply-field*` · `.apply-toast` · `.apply-insurers` · `.apply-insurer*` · `.apply-note`
  - [x] 폼 그리드 2열 → ≤768 1열 · 보험사 그리드 4열 → ≤768 2열
  - [x] 토큰만, 하드코딩 없음
- [x] **커밋** `style: S1·S2 업로드 카드·폼·보험사 그리드 스타일 추가`

## 8. 랜딩 SignupCta — spec 8절

- [x] `src/components/SignupCta.tsx` — `INSURER_OPTIONS` 삭제 → `INSURERS` 기반, 「기타 / 모름」 라벨 유지
- [x] **커밋** `refactor: 사전 신청 폼 보험사 옵션을 INSURERS 데이터로 통일`

## 9. 검증 — spec 「검증」

- [x] `npm run build` · `npm run lint` · `npm test` (23건)
- [x] 로컬 OCR 성공 경로(로컬에 GEMINI 키가 없어 브라우저에서 fetch를 모킹) · 직접 입력 경로 · 실패 토스트(실서버 500) · S2 비활성 · 랜딩 select 8개
- [ ] 실제 영수증 사진 OCR · 4MB 초과 폰 사진 축소(실기기) — GEMINI 키 있는 환경에서 사람이 확인
- [ ] Vercel 프리뷰 `/apply?r=test` (GEMINI env 유무는 사람 확인)
- [x] 스크린샷 1440 · 768 · 390(S1) + S1-a · S2 · 실패 토스트 1440 → `docs/spec/SSH-543/`
- [x] **커밋** `docs: SSH-543 검증 스크린샷 추가`

## 10. 마무리

- [x] PR 본문 갱신(`/pr`) → `/pr-review` **별도 서브에이전트** → P1·P2 반영, P3 이하 보고 (2026-09-10 리뷰 1회: P2 1건 반영 `fb9be29`, P3 2건·P4 1건 스레드에 남김. 재리뷰 등록은 사람 확인 뒤)
- [ ] Ready 전환 · Jira 검토 중 이동은 사람이 한다 — 남았다고 보고

## 하지 않는 것

- `src/mvp/types.ts` Fields 확장 · tesseract `ocrFields.ts` 수정 (spec 「배경」)
- `apply_*` 트래킹 (SSH-545) · `.env.example` GEMINI 보정 (SSH-544) · S3 룩업 (SSH-473)
- 영수증 이미지 저장 · 세션 보존 · 드래그앤드롭 · 여러 장 업로드 · 병원 검색
- `index.css` 수정 · 모달 잔재 클래스 재사용
