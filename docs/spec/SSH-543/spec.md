# SSH-543 — S1 진료 정보 등록 + S2 보험 선택

`/apply` 셸(SSH-542) 위에 **1단계 진료 정보 등록**과 **2단계 보험 선택** 본문을 올린다. S1은 영수증 사진을
Gemini로 읽어 폼을 채우거나(사진은 인식에만 쓰고 저장하지 않는다) 직접 입력하고, S2는 보험사 카드 8개 중
하나를 고르고 상품명을 선택 입력한다. **S3~S6 본문·저장·트래킹은 건드리지 않는다** — 형제 티켓이 한다.

> **이 PR이 남기는 것 한 문장**: `/apply` 1단계에서 영수증 사진을 올리면 병원·진료일·진료비가 채워지고(사진 없이
> 직접 입력해도 되고), 필수값을 채워 「다음」을 누르면 2단계에서 보험사를 골라 요약 레일에 뜬 채 3단계로 넘어간다.

## 배경

참고한 문서 — 리뷰어가 "이 결정의 근거가 어디냐"를 묻지 않게 여기 적는다.

- **위키** `wiki/기획/대리청구-웹-창구-설계.md` (2026-09-09 갱신) — ② 유저 플로우(S1·S2는 저장 없음),
  ④ 화면 명세(S1 검증: 병원 이름·진료일(오늘 이전)·진료비 필수 / S1 예외: OCR 분석 중은 카드 안 로딩, 실패 시 빈 폼 + 토스트 /
  S2: 보험사 필수, CTA 「필요 서류 확인」), ⑤ 입력 필드(형식·필수·**영수증 이미지는 보관하지 않는다**),
  ⑦ 기술(`server/gemini.ts` 재사용 + 병원 이름·주소 추출 추가, `data/insurers.ts` 재사용 + 상품명 자유 입력),
  ⑪ 결정(③ 이미지 안 받음, ④ 병원은 텍스트 입력, ⑤ 보험사 + 자유 입력)
- **Figma** 데스크톱 시안 S1(빈 상태) · S1-a(OCR 채움) · S2, 모바일 시안 S1 · S1-a · S1-b(수기) · S2 —
  문안·레이아웃·상태 표현은 여기서 가져왔다. 데스크톱은 업로드 카드 + 폼이 항상 같이 보이고, 모바일은
  「영수증 없이 직접 입력할게요」 버튼으로 폼을 여는 구조라 차이가 있다(아래 「1차 리뷰 결정」 1)
- **Jira** SSH-543 본문 + 형제 티켓 SSH-473(S3) · SSH-486(S4~S6) · SSH-544(API·DB) · SSH-545(랜딩 정리·트래킹·배포).
  범위 경계를 이들과 맞췄다 — 아래 「범위 밖」

### 왜 `src/mvp/types.ts`의 `Fields`를 넓히지 않는가

티켓 본문은 "`src/mvp/types.ts` Fields 확장"을 적고 있지만 하지 않는다. `src/mvp/*`(체험 모달)는 SSH-545에서
통째로 삭제되고, `Fields`를 넓히면 그 타입을 리터럴로 만드는 tesseract 추출기 `src/lib/ocrFields.ts`까지 같이
고쳐야 한다. 곧 지워질 코드에 변경을 넣는 대신, **서버 응답을 `/apply` 상태(`Treatment`)로 바로 바꾸는 순수 함수**
(`receiptToTreatment`)를 둔다. 2절.

### 왜 서버 타입을 클라이언트에서 import하지 않는가

`tsconfig.app.json`은 `src`만 포함한다. `server/gemini.ts`를 `import type`으로 끌어오면 앱 타입 검사 프로그램에
서버 파일이 들어와 `node` 타입 의존이 생긴다. 지금처럼 `src/lib/geminiAnalyze.ts`가 응답 타입을 자기 것으로 갖고
(`/api/analyze-receipt`의 응답 계약), 서버 테스트가 새 필드 두 개를 검증한다. 두 선언이 어긋나면 서버 테스트나
`receiptToTreatment` 테스트에서 드러난다.

### 지금 레포 상태 — 딛고 설 것

- **상태는 이미 있다.** `src/apply/state.ts`의 `Treatment { hospitalName, hospitalAddress, visitDate, treatmentCost, diagnosis }`·
  `Insurance { insurer, productName }`과 `setTreatment`·`setInsurance` 액션(SSH-542). 필드 이름은 SSH-544 `claims` 컬럼과 1:1.
  **이 티켓은 상태 필드를 추가하지 않는다**
- `ApplyRail.tsx`의 요약 카드가 병원 / 진료일 · 진료비 / 보험사(`insurer · productName`)를 이미 그린다. 진료비는 숫자만
  골라 `12,000원`으로 그리므로 S1은 `treatmentCost`를 **숫자만인 문자열**(`"58000"`)로 저장한다
- `ApplyActions.tsx`는 `nextDisabled?`·`onNext?` prop을 받지만 `ApplyPage`가 prop 없이 렌더한다. 단계 컴포넌트가
  검증을 붙일 통로가 필요하다 — 5절
- `server/gemini.ts`: `RESPONSE_SCHEMA`(9필드) · `PROMPT` · `GeminiAnalysis` · `normalizeAnalysis` 네 곳이 필드 목록을
  각자 갖는다. 응답 형식이 `date: "YYYY.MM.DD"`, `cost: "12,000"`(쉼표)라 상태 형식(`YYYY-MM-DD`, 숫자만)과 다르다
- `api/analyze-receipt.ts`(Vercel)와 `vite.config.ts`의 `geminiApi` 미들웨어(로컬, 6MB 버퍼)가 같은 `analyzeReceipt`를
  부른다. 서버 이미지 상한 **4MB**, MIME `jpeg/png/webp/heic/heif`. **변경 없음**
- `src/lib/geminiAnalyze.ts`: import하는 곳이 없다. `fetch`가 `try/finally`뿐이라 네트워크 실패·abort가 raw `TypeError`로
  나간다. `GeminiAnalysis`를 서버와 별도로 선언한다
- 업로드 input · 토스트 · 로더 · 배너 **컴포넌트가 없다.** `index.css`의 `.dropzone` `.spinner` `.analyzing` `.ai-card`는
  사용처가 없는 모달 잔재, `.ins-card`는 모달 전용이다. SSH-542가 `.stepper`를 재사용하지 않은 것과 같은 이유로
  **재사용하지 않고 `apply-` 클래스로 새로 쓴다.** `index.css`는 건드리지 않는다
- `components/icons.tsx`: `check`는 있고 카메라·정보(i) 아이콘은 없다
- `src/data/insurers.ts#INSURERS` 8개(보험사 7 + 「기타 / 모름」), 로고 없음. `components/SignupCta.tsx`가 같은 목록을
  문자열 배열 `INSURER_OPTIONS`로 따로 갖고 있고 두 항목의 라벨이 다르다(`펫블리` vs `펫블리 반려견보험`, `위풍당당` vs
  `위풍당당 다이렉트`)
- `GEMINI_API_KEY`·`GEMINI_MODEL`이 `.env.example`에 없다 — 보정은 SSH-544 범위. **Vercel 프로젝트에 이 둘이 있어야
  프리뷰에서 OCR이 된다**(검증 항목)

## 범위

### 1. 서버 — Gemini 응답에 병원 이름·주소 추가

`server/gemini.ts`
- `GeminiAnalysis`에 `hospital: string`(병원 이름) · `address: string`(병원 주소) 추가
- `RESPONSE_SCHEMA.properties`에 두 필드, `required`에도 추가(다른 필드와 같이 — 값이 없으면 빈 문자열)
- `PROMPT`에 두 줄:
  - `hospital: 영수증 상단의 병원(동물병원) 상호를 적힌 그대로. 없으면 빈 문자열`
  - `address: 병원 주소가 적혀 있으면 전체 주소를 그대로. 없으면 빈 문자열`
- `normalizeAnalysis` 반환에 `hospital: text(raw.hospital)` · `address: text(raw.address)`

`server/gemini.test.ts` — 케이스 1개 추가. `globalThis.fetch`를 스텁해 `candidates[0].content.parts[0].text`에
hospital·address가 든 JSON을 돌려주면 `body.hospital`·`body.address`가 그대로 나오고, 둘이 빠진 JSON이면 빈 문자열이
된다. 기존 타임아웃 테스트의 스텁·복원 방식을 따른다.

### 2. 클라이언트 — OCR 호출 정리 + 정규화 + 이미지 전처리

`src/lib/geminiAnalyze.ts` (재활성)
- `GeminiAnalysis`에 `hospital`·`address` 추가. 반환은 **서버 응답 타입 그대로**(`GeminiFieldResult`·`Fields` 의존 제거).
  `src/mvp/types.ts`는 건드리지 않는다
- `fetch`에 `catch` 추가: `AbortError`면 `취소됐어요`(호출자가 무시), 그 외 네트워크 실패는
  `영수증을 읽지 못했어요. 잠시 후 다시 시도해 주세요`. 30초 타임아웃 유지

`src/apply/receiptToTreatment.ts` (신규, 순수 함수) + `receiptToTreatment.test.ts`
```ts
receiptToTreatment(a: GeminiAnalysis): Partial<Treatment>
```
- `hospital → hospitalName`, `address → hospitalAddress`, `diag → diagnosis`는 trim
- `date`: `YYYY.MM.DD` · `YYYY-MM-DD` · `YYYY/MM/DD` · `YYYY년 M월 D일`(공백 허용) → `YYYY-MM-DD`. 두 자리 월·일 보정.
  못 읽으면 필드를 **patch에서 뺀다**
- `cost`: 숫자만 남긴다(`"58,000"`·`"58000원"` → `"58000"`). 빈 결과면 patch에서 뺀다
- 빈 문자열은 patch에서 뺀다 — OCR이 못 읽은 칸이 사용자가 이미 적은 값을 지우지 않게
- 테스트: 정상 매핑 · 날짜 4형식 · 잘못된 날짜 제외 · 쉼표·원 제거 · 빈 값 제외

`src/apply/imageToDataUrl.ts` (신규) — `File → Promise<{ dataUrl, mimeType }>`
- 파일이 **4MB 이하이고 긴 변 2000px 이하**면 `FileReader`로 그대로 dataURL
- 아니면 `createImageBitmap` → canvas로 **긴 변 1600px, JPEG 품질 0.85**로 다시 인코딩 (폰 JPEG는 3~6MB가 흔해 그대로
  보내면 서버 413). 디코드 실패(Chrome의 HEIC 등)면 원본이 4MB 이하일 때만 원본을 보내고, 아니면 `ImageTooLargeError`
- 브라우저 API라 `node:test`로는 안 본다 — 검증 절의 실기기 항목으로

### 3. S1 — 진료 정보 등록 화면

`src/apply/steps/StepTreatment.tsx` (단계 조립) · `ReceiptUploadCard.tsx` · `TreatmentForm.tsx` · `src/apply/Toast.tsx`

**업로드 카드** — 가로형 한 줄(아이콘 · 문안 2줄 · 오른쪽 버튼), Figma 데스크톱 S1/S1-a

| 상태 | 모양 | 문안 | 버튼 |
| --- | --- | --- | --- |
| `idle` | 점선 코랄 보더, 연코랄 배경, 카메라 아이콘 | **영수증을 올리면 자동으로 채워드려요** / JPG·PNG · 사진은 저장하지 않고 인식에만 써요 · 없으면 아래에 직접 적어도 돼요 | 「파일 선택」(앰버, `.btn`) |
| `loading` | 같은 카드, 아이콘 자리에 스피너 | **영수증을 읽고 있어요…** / 보통 10초 안에 끝나요 | 비활성 |
| `done` | sage 배경(`--success-50`)·보더, 체크 아이콘 | **영수증 1장을 읽었어요** / 읽은 내용을 아래에서 확인하고 틀린 곳은 고쳐 주세요 | 「다시 올리기」(고스트) |
| 실패 | `idle`로 되돌린다 + **토스트** | 토스트 문안은 오류별(아래) | — |

- `<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif">`를 숨기고 버튼이 연다.
  `capture` 속성은 **넣지 않는다** — 안드로이드에서 갤러리 선택이 막힌다. 드래그앤드롭은 Figma에 없으니 안 한다
- 흐름: 파일 선택 → `imageToDataUrl` → `analyzeReceiptWithGemini(dataUrl, signal)` → `receiptToTreatment` →
  `dispatch({ type: 'setTreatment', patch })` → `done`. 파일·dataURL은 컴포넌트 로컬 변수로만 쓰고 **상태·스토리지에
  넣지 않는다.** 언마운트·재업로드 시 `AbortController`로 진행 중 요청을 취소한다
- 토스트 문안: 너무 큼 → `사진이 너무 커요. 4MB 이하 JPG·PNG로 올려 주세요` / 형식 → `JPG·PNG·WEBP·HEIC 사진만 올릴 수 있어요` /
  서버·네트워크 → 서버가 준 `error` 문자열(없으면 `영수증을 읽지 못했어요. 직접 입력해 주세요`)
- `Toast.tsx`: 화면 하단 고정, 4초 뒤 자동 닫힘, `role="status"`. S1 로컬 상태로 띄운다(전역 토스트 시스템은 만들지 않는다 —
  쓰는 곳이 여기뿐이다)

**폼** — `.apply-panel` 안, 제목 「진료 정보」, 2열 그리드(≤768에서 1열). 값은 입력 즉시 `setTreatment` patch

| 칸 | 필드 | 입력 | 힌트 |
| --- | --- | --- | --- |
| 1행 좌 | 병원 이름 * | text, placeholder `예) 개냥동물병원` | 영수증에 적힌 이름 그대로 |
| 1행 우 | 진료일 * | `type="date"`, `max`=오늘 | 오늘 이전 날짜만 |
| 2행 좌 | 진료비 * | `inputMode="numeric"`, placeholder `예) 58,000` — 입력 중 숫자만 남기고 표시는 천 단위 쉼표, 상태엔 숫자만 | 영수증 합계 금액(원) |
| 2행 우 | 병명·진료 내용 (선택) | text, placeholder `예) 피부염 치료` | 필요 서류를 더 정확히 안내해요 |
| 3행 전폭 | 병원 주소 (선택) | text, placeholder `예) 서울 마포구 …` | 담당자가 병원에 연락할 때 써요 |

**검증** — `src/apply/validateTreatment.ts` (순수 함수) + `validateTreatment.test.ts`
```ts
validateTreatment(t: Treatment, today: string): Partial<Record<keyof Treatment, string>>
```
- 병원 이름: 비어 있으면 `병원 이름을 적어 주세요`
- 진료일: 비어 있으면 `진료일을 골라 주세요`, `YYYY-MM-DD`가 아니면 `날짜 형식이 맞지 않아요`, `today`보다 뒤면 `오늘 이전 날짜만 가능해요`
  (**오늘 포함** — 진료 당일 업로드가 흔하다)
- 진료비: 비어 있거나 0이면 `진료비를 적어 주세요`
- 「다음」은 **항상 활성.** 클릭 시 오류가 있으면 해당 칸에 `.apply-field-error` 보더 + 메시지, 첫 오류 칸으로 포커스, 넘어가지
  않는다. 오류 없으면 `next`. 한 번 실패한 뒤에는 입력할 때마다 다시 검사해 메시지를 지운다
- 헤딩 설명은 업로드 `done`이면 `영수증에서 읽은 내용이에요. 확인하고 틀린 곳은 고쳐 주세요`(Figma S1-a), 아니면 `steps.ts` 기본

**모바일 시안의 「영수증 없이 직접 입력할게요」 버튼과 S1-b 화면은 만들지 않는다** — 모든 폭에서 카드 + 폼을 같이 보인다.
「1차 리뷰 결정」 1.

### 4. S2 — 보험 선택 화면

`src/apply/steps/StepInsurance.tsx`

- `INSURERS` 8개를 카드 그리드로: **≥769 4열 · ≤768 2열**. 카드 = `company`(굵게) + `product`(작게, 회색). 선택 카드는
  `--primary-100` 배경 + `--primary-300` 보더. `role="radiogroup"` 안의 `<button role="radio" aria-checked>`
- 저장은 `setInsurance({ insurer: ins.company })` — **`company` 문자열만**(`"삼성화재"`, `"기타 / 모름"`). `claims.insurer`
  컬럼과 SSH-473의 서류 룩업이 보험사 단위다. `insurerLabel()`은 쓰지 않는다
- 「보험 상품명 (선택)」 text, placeholder `예) 위풍당당 다이렉트`, 힌트 `몰라도 괜찮아요 — 서류는 보험사 기준으로 안내해요`
  → `setInsurance({ productName })`
- 안내 행(패널 아래, 회색 `--neutral-100` 배경, 정보 아이콘, **항상 표시**): `마이브라운·카카오페이는 앱·카톡 전용 접수라 대리
  접수가 제한될 수 있어요. 담당자가 확인 후 안내드려요.` 데이터 필드는 추가하지 않는다
- 「필요 서류 확인 →」는 `insurer`가 비어 있으면 `nextDisabled`. 뒤로 갔다 와도 선택이 남는다(상태에 있으니까)

### 5. 셸 연결 — 단계 컴포넌트가 헤딩·액션 행을 소유한다

`src/apply/ApplyPage.tsx`
- `state.step`이 1이면 `<StepTreatment />`, 2면 `<StepInsurance />`, 3~5는 지금처럼 `StepHeading + StepPlaceholder + ApplyActions`, 6은 그대로
- **단계 컴포넌트가 `StepHeading`과 `ApplyActions`를 자기 안에서 렌더한다.** S1은 OCR 상태에 따라 설명을 바꾸고 「다음」에
  검증을 걸어야 하며, S2는 `nextDisabled`를 넘겨야 한다 — 셸이 단계마다 다른 prop을 알 필요가 없다. S3(SSH-473)·S4~S6(SSH-486)도
  같은 방식을 따르면 된다(spec에 명시하는 이유)
- `ApplyActions`·`StepHeading`·`ApplyRail` 자체는 바꾸지 않는다

### 6. 스타일 — `src/styles/apply.css`에 추가

`index.css`는 **건드리지 않는다.** 토큰(`--primary-*` 코랄 · `--secondary-*` 앰버 · `--success-*` sage · `--neutral-*` ·
`--radius-sm/md`)·`.btn`·`.field`만 쓰고 색·간격을 하드코딩하지 않는다.

| 클래스 | 용도 |
| --- | --- |
| `.apply-upload` (+`.is-loading` `.is-done`) · `.apply-upload-icon` · `.apply-upload-copy` · `.apply-upload-title` · `.apply-upload-sub` | 업로드 카드 3상태 |
| `.apply-spinner` + `@keyframes apply-spin` | 로더 |
| `.apply-form` · `.apply-form-title` · `.apply-form-grid`(2열 → ≤768 1열) · `.apply-form-full` | 폼 |
| `.apply-field` · `.apply-field-label` · `.apply-field-hint` · `.apply-field-error` · `.apply-field-msg` | 칸·라벨·힌트·오류 |
| `.apply-toast` | 하단 고정 토스트 |
| `.apply-insurers`(4열 → ≤768 2열) · `.apply-insurer` (+`.is-selected`) · `.apply-insurer-name` · `.apply-insurer-product` | 보험사 그리드 |
| `.apply-note` | S2 제한 안내 행 |

### 7. 아이콘

`components/icons.tsx`에 `camera`·`info` 추가(24px 스트로크, 기존 `check`와 같은 규격). 스피너는 CSS.

### 8. 랜딩 `SignupCta.tsx` — 중복 보험사 목록 제거

티켓 본문대로 한다(사용자 결정, 2026-09-10). 로컬 `INSURER_OPTIONS` 배열을 지우고 `INSURERS`에서 만든다:
```ts
INSURERS.map((ins) => (ins.company === '기타 / 모름' ? ins.company : insurerLabel(ins)))
```
- **사전 신청 Notion·`signup_submit` 이벤트에 가는 `insurer` 문자열이 두 개 바뀐다** — `DB손해보험 펫블리` →
  `DB손해보험 펫블리 반려견보험`, `삼성화재 위풍당당` → `삼성화재 위풍당당 다이렉트`. `기타 / 모름`은 삼항으로 원래 라벨을
  유지한다(`insurerLabel`은 `공통 기준`을 돌려준다). PR 본문에 적는다
- 기본 선택(`DEFAULT_INSURER`)·UI·나머지 동작은 그대로. 섹션 자체 삭제는 SSH-545

### 9. 파일 목록

```
server/gemini.ts                            hospital·address (스키마·프롬프트·타입·정규화)
server/gemini.test.ts                       케이스 1 추가
src/lib/geminiAnalyze.ts                    응답 타입 확장 · catch · mvp 의존 제거
src/apply/receiptToTreatment.ts             신규 — 순수 함수
src/apply/receiptToTreatment.test.ts        신규 — node:test
src/apply/validateTreatment.ts              신규 — 순수 함수
src/apply/validateTreatment.test.ts         신규 — node:test
src/apply/imageToDataUrl.ts                 신규 — 축소·dataURL
src/apply/Toast.tsx                         신규
src/apply/steps/StepTreatment.tsx           신규 — S1 조립(헤딩·카드·폼·액션)
src/apply/steps/ReceiptUploadCard.tsx       신규
src/apply/steps/TreatmentForm.tsx           신규
src/apply/steps/StepInsurance.tsx           신규 — S2
src/apply/ApplyPage.tsx                     단계 분기
src/components/icons.tsx                    camera · info
src/components/SignupCta.tsx                INSURER_OPTIONS → INSURERS
src/styles/apply.css                        6절 클래스 추가
docs/spec/SSH-543/{spec,tasks}.md           이 문서
docs/spec/SSH-543/apply-s1-{1440,768,390}.png · apply-s1a-1440.png · apply-s2-1440.png
```

## 범위 밖 — 형제 티켓이 한다

| 안 하는 것 | 어디서 |
| --- | --- |
| S1 병명 → 청구유형 추정 · 필요 서류 룩업 · S3 본문 | SSH-473 |
| S4~S6 본문 · `POST /api/claims` 호출 | SSH-486 |
| `claims` 테이블 · `POST /api/claims` · `.env.example`에 `GEMINI_*` 보정 | SSH-544 |
| `apply_ocr`·`apply_step` 등 `apply_*` 트래킹 | SSH-545 |
| `SignupCta` 섹션 자체 제거 · 체험 모달(`src/mvp/*`) · tesseract(`ocrFields.ts`) · `index.css` 잔재 클래스(`.dropzone` 등) 정리 | SSH-545 |
| `src/mvp/types.ts#Fields` 확장 | 하지 않음 — 「배경」 |
| 영수증 이미지 저장 · 새로고침 시 입력 보존 | 하지 않음 — 위키 ⑪-③, SSH-542 「세션 저장은 하지 않는다」 |
| 병원 이름·주소 검색, 드래그앤드롭 업로드, 여러 장 업로드 | 백로그 — 위키 ⑪-④, Figma에 없음 |

## 검증

- [ ] `npm run build`(`tsc -b` 포함) · `npm run lint` · `npm test` — gemini 2건 · receiptToTreatment · validateTreatment · 기존 state/route
- [ ] `npm run dev`(`.env`에 `GEMINI_API_KEY`·`GEMINI_MODEL`): 실제 영수증 사진 → 병원·진료일·진료비 채워짐 → 값 수정 → 「다음」 →
      S2 보험사 선택 → 요약 레일에 보험사 표시 → 「필요 서류 확인」 → S3 placeholder → 「이전」으로 돌아와도 값 유지
- [ ] 사진 없이 「다음」 → 필수 3칸 오류 표시·첫 칸 포커스 → 채우면 통과. 미래 날짜 → 오류
- [ ] OCR 실패(키 제거 또는 네트워크 차단) → 토스트, 폼·입력값 유지
- [ ] 4MB 넘는 폰 사진(실기기) → 축소돼 성공. HEIC(iPhone) 1장
- [ ] S2에서 보험사 미선택이면 주 버튼 비활성
- [ ] 랜딩 `/`의 사전 신청 select에 8개 옵션이 그대로 보임(라벨 2개만 바뀜)
- [ ] Vercel 프리뷰 `/apply?r=test` — **Vercel에 `GEMINI_API_KEY`·`GEMINI_MODEL`이 있는지 사람이 확인**. 없으면 프리뷰에서는
      실패 토스트·직접 입력 경로만 검증하고 PR 본문에 적는다
- [ ] 스크린샷 1440 · 768 · 390(S1 빈 상태, 대표) + S1-a(OCR 채움) 1440 + S2 1440 → `docs/spec/SSH-543/`, PR 본문 임베드

## 1차 리뷰 결정 요청

1. **S1 모바일 구조** — 모바일 시안의 「영수증 없이 직접 입력할게요」 버튼과 S1-b(수기) 분기를 만들지 않고, 데스크톱처럼
   업로드 카드 + 폼을 모든 폭에서 같이 보인다. 상태 하나가 줄고, SSH-542가 모바일을 "데스크톱을 1열로 접은 것"으로 정한
   것과 일관된다 (플랜 단계 사용자 결정, 2026-09-10)
2. **`SignupCta.tsx` 보험사 목록을 `INSURERS`로 치환** — 사전 신청 Notion·`signup_submit` 값 두 개가 바뀐다. 8절 (플랜 단계 사용자 결정)
3. **`src/mvp/types.ts` Fields 확장 안 함** — 티켓 본문과 다르다. 「배경」 (플랜 단계 사용자 결정)
4. **4MB 초과 사진은 브라우저에서 1600px JPEG로 축소** — 2절 (플랜 단계 사용자 결정)
5. **S1 「다음」 항상 활성 + 클릭 시 오류 표시 / S2는 보험사 고를 때까지 비활성** — 폼은 어디가 틀렸는지 보여 주는 쪽이 낫고,
   단일 선택은 비활성이 자연스럽다
6. **진료일 상한은 오늘 포함** — 「오늘 이전」을 미래 금지로 읽었다
7. **보험사 저장값은 `company` 문자열만** — `claims.insurer`·SSH-473 룩업이 보험사 단위
8. **단계 컴포넌트가 헤딩·액션 행을 소유** — 5절. S3·S4~S6도 같은 방식
