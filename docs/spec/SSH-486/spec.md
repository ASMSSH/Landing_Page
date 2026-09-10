# SSH-486 — S4 신청 정보 · S5 동의 5종(전문) · S6 접수 완료

`/apply` 셸(SSH-542)과 S1~S3(SSH-543·473, dev 머지됨) 위에 **4·5·6단계 본문**을 올린다. S4는 보호자 이름·휴대전화·생년월일·
반려동물 이름 폼(검증 포함), S5는 동의 5종 체크와 각 동의의 **전문 보기**, 「신청하기」로 `POST /api/claims`에 전송(전송 중·실패
재시도), S6는 응답의 접수번호와 앞으로의 절차를 보여 준다. 동의 전문 5개는 노션 「문서 양식」(성식 작성)을 원문으로
`src/apply/consents.ts`에 **`consent-v1`**으로 넣는다. **서버(`api/claims.ts`·Supabase·슬랙)는 SSH-544가 한다** — 이 PR은 실제
fetch만 두고 mock 코드는 넣지 않는다.

> **이 PR이 남기는 것 한 문장**: `/apply` 4단계에서 보호자 정보를 검증해 받고, 5단계에서 동의 5개(전문 읽기 가능)를 모두 체크해야
> 「신청하기」가 켜지며, 전송 성공이면 6단계에 접수번호 `BGN-YYMMDD-NN`이, 실패면 「다시 시도」·「인스타 DM으로 신청」이 보인다.

## 배경

참고한 문서 — 리뷰어가 "이 결정의 근거가 어디냐"를 묻지 않게 여기 적는다.

- **위키** `wiki/기획/대리청구-웹-창구-설계.md` (2026-09-09 갱신) — ② 유저 플로우(저장은 S5 「신청하기」 한 번), ④ 화면 명세
  (S4: 이름 2~20자·010 형식·만 14세 미만 불가 / S5: 모두 동의 + 개별 5개(보기 링크), 전송 중 버튼 비활성, 실패 시 다시 시도 +
  인스타 DM / S5-a: 제목·본문·닫기, 5종 공통 레이아웃, **사이트 안 페이지로 연다** / S6: 접수번호·24시간 연락·절차 4단계·인스타,
  앱 다운로드 유도 없음), ⑤ 데이터(입력 필드 형식, `claims` 컬럼 이름 — payload 이름의 근거), ⑥ 동의 5종(순서·짝·`consent-v1`·
  동의 시각·법률 검토 전 「베타」 표시), ⑨ 트래킹 5개(→ SSH-545), ⑫ 리스크(위임장은 병원 방문 때 종이로)
- **노션** 「문서 양식」 페이지의 v1.0.0 웹 절 하위 5페이지 — 대행 청구 서비스 이용약관(16조) · 개인정보 수집 및 이용 동의 · 고유식별정보
  처리 동의 · 개인정보 제3자 제공 동의(병원) · 개인정보 제3자 제공 동의(보험사). 2026-09-09~10 작성. **전문의 정본**이고 이 PR은 그대로
  옮긴다(아래 「왜 대괄호를 벗기나」)
- **Figma** 데스크톱 시안 S4(신청 정보) · S5(동의) · S5-a(동의 전문) · S6(접수 완료), 모바일 시안 S4 · S5 · S5-a · S6 — 문안·레이아웃은
  여기서 가져왔다. **전송 실패 상태의 프레임은 없다** → 이 spec이 정의하고 1차 리뷰에서 확인받는다
- **Jira** SSH-486 본문 + 형제 SSH-544(API·DB — 해야 할 일, 같은 담당자) · SSH-545(트래킹·mvp 정리) · SSH-547(브라우저 back ↔ 단계).
  범위 경계를 이들과 맞췄다 — 「범위 밖」
- **계획 단계 사용자 결정**(2026-09-10): ① 전문은 Figma대로 5단계 본문 자리에 열되 **브라우저 뒤로가기로 닫히게** 한다 ② 노션의
  대괄호 미정값은 대괄호를 벗기고 값을 넣는다(전문은 사용자가 읽고 확인) ③ API 전에는 실제 fetch만, mock 없음 ④ 생년월일은
  텍스트 + 자동 하이픈

### 왜 전문을 페이지·모달이 아니라 「5단계 본문 교체 + history 연동」으로 여나

위키는 「사이트 안 페이지」, Jira는 「페이지/모달은 팀 결정 후, 우선 사이트 안 페이지」, Figma S5-a는 `/apply` 셸(프로그레스·레일)
안에서 5단계 본문 자리에 전문이 들어간 모습이다. 별도 URL(`/apply/consent/...`)은 「페이지는 `/`와 `/apply` 둘」 규칙의 예외가 되고
`route.ts`·Vercel rewrite를 손봐야 한다. 모달은 긴 조문을 스크롤 상자 안에서 읽게 해 가독성이 떨어진다. 그래서 **Figma 그대로
본문 교체**로 가되, 사용자가 지적한 「뒤로가기 문제」 — 전문을 열고 브라우저 back을 누르면 `/apply` 전체가 랜딩으로 빠지는
것 — 는 `history.pushState` 한 엔트리로 막는다(5절). 단계 단위 back은 SSH-547이 맡고, 그때 이 state 키와 합친다.

### 왜 대괄호를 벗기나 · 무엇을 바꿨나

노션 원문에는 미정 표시 대괄호가 셋 남아 있다 — 이용약관 제5조 `[15일~3개월]`, 말미 `[시행일]`, 개인정보 수집·이용 동의의 `[5년]`
(2곳). 사용자에게 대괄호를 그대로 보이면 미완성으로 읽힌다. 사용자 결정으로 **대괄호만 벗기고 값은 그대로**(`15일~3개월`, `5년`),
시행일은 Figma S5-a 메타 줄의 **`2026-09-10`**을 넣는다. 그 외 바꾼 것은 각 문서 말미의 「□ 동의함 □ 동의하지 않음」 줄 제거(S5
체크박스가 대신한다)뿐이다. 이 셋을 `consents.ts` 머리 주석에 적는다. **값이 바뀌면 `consent-v2`**다 — 이미 접수된 행의
`consent_version`이 어떤 문안에 동의했는지를 가리키기 때문에 v1 문안은 고치지 않고 새 버전을 추가한다.

### 왜 payload가 snake_case인가

`state.ts` 필드는 「SSH-544의 `claims` 컬럼과 1:1(camelCase ↔ snake_case만 다르다)」이 설계다. 전송 본문을 **컬럼 이름 그대로
snake_case**로 보내면 SSH-544의 서버는 검증·접수번호·insert만 하고 매핑을 갖지 않는다. 변환은 순수 함수 `toClaimPayload` 한 곳에
있고 테스트로 고정한다. `consented_at`은 클라이언트 시계를 믿지 않고 **서버 insert 시각**으로 둔다(payload에 없다).

### 왜 mock을 넣지 않나

`/api/claims`는 SSH-544가 만든다. 그 전까지 「신청하기」는 404를 받아 **실패 UI**가 보인다 — 그 자체가 검증 대상이다. 성공 경로는
헤드리스 브라우저에서 `window.fetch`를 스텁해 확인한다(「검증」). vite 미들웨어에 임시 mock을 두면 SSH-544가 같은 파일을 고치며
충돌하고 지우는 커밋이 하나 더 생긴다. 요청·응답 계약은 4절에 적어 SSH-544가 그대로 구현한다.

### 지금 레포 상태 — 딛고 설 것

- **상태는 이미 있다.** `state.ts`의 `Applicant{name,phone,birth,petName}` · `Consents{terms,privacy,uniqueId,hospital3p,insurer3p}` ·
  `receiptNo` · 액션 `setApplicant`·`setConsents`·`setReceiptNo`·`goto 6`(receiptNo 있어야만)·`reset`. **상태 필드·reducer는 바꾸지 않는다**
- `ApplyPage.tsx#StepBody`: 1~3은 단계 컴포넌트, 4·5는 `StepHeading + StepPlaceholder + ApplyActions`, 6은 `StepPlaceholder` 「접수가
  완료됐어요」. **이 PR이 끝나면 `StepPlaceholder`는 아무 데서도 안 쓴다** → 파일과 `.apply-placeholder` CSS를 지운다
- `ApplyActions`: `nextDisabled?`·`onNext?`. 라벨은 `steps.ts nextLabel` 고정 → 「전송 중…」을 위해 `nextLabel?` 하나 추가(7절)
- S1 폼 패턴을 그대로 쓴다 — `TreatmentForm`의 `Field`(`.apply-form/.apply-form-grid/.apply-field(.has-error)/-hint/-error`),
  `treatmentFields.ts`(fieldId·순서), `validateTreatment.ts`(순수 함수, 「다음」에서만 검증 → 이후 입력마다 재검증 → 첫 오류 포커스),
  `todayIso`·`isRealDate`
- `lib/phone.ts#formatMobileNumber`(010-XXXX-XXXX) · `ApplyRail` 보호자 행(지금은 이름만) · `data/links.ts#INSTAGRAM_URL` ·
  `icons.tsx`(`check` `instagram`) · `track('cta_click', { cta })` 기존 이벤트 이름
- `lib/claimDocuments.ts`의 fetch 래퍼 패턴(타임아웃·호출자 signal 합성·비-2xx throw) → `lib/claims.ts`가 따른다
- `analytics.ts#getRefCode()`(sessionStorage `bgn_ref`, `?r=`)는 export되어 있지 않다 → export 한 줄
- `apply.css` — `.apply-panel` `.apply-note` `.apply-btn-ghost` `.apply-btn-white` `.apply-btn-next` `.apply-upload-btn`(앰버 버튼) 재사용.
  Figma S4 안내 카드의 연파랑은 `index.css`에 토큰이 없다 → `.apply-note`(중립색) 사용
- 새 테스트 파일은 `tsconfig.node.json`의 `src/**/*.test.ts`에 잡힌다 — tsconfig 변경 없음

## 범위

### 1. 동의 문안 — `src/apply/consents.ts` (신규, React 의존 없음) + `consents.test.ts`

```ts
export const CONSENT_VERSION = 'consent-v1';
export const CONSENT_EFFECTIVE_DATE = '2026-09-10';                 // 시행일 — 메타 줄·이용약관 말미
export type ConsentKey = keyof Consents;                             // state.ts
export type ConsentBlock =
  | { type: 'h'; text: string }                                      // 「제1조 (목적)」 「1. 신청 시 수집하는 항목」
  | { type: 'p'; text: string }
  | { type: 'ol'; items: string[] }                                  // 번호 목록(용어 정의·의무·사유)
  | { type: 'ul'; items: string[] }                                  // 「안내 사항」 불릿·말미 문의
  | { type: 'table'; head: string[]; rows: string[][] };             // 수집 항목·제공 내역 표
export interface ConsentDoc { key: ConsentKey; label: string; title: string; blocks: readonly ConsentBlock[] }
export const CONSENTS: readonly ConsentDoc[];                        // 순서 = S5 체크 순서 = Figma
export function consentDoc(key: ConsentKey): ConsentDoc;
```

| # | key | S5 라벨 | 전문 제목 |
| --- | --- | --- | --- |
| 1 | `terms` | 서비스 이용약관 동의 (만 14세 이상) | 대행 청구 서비스 이용약관 |
| 2 | `privacy` | 개인정보 수집·이용 동의 | 개인정보 수집 및 이용 동의 |
| 3 | `uniqueId` | 고유식별정보 처리 동의 | 고유식별정보 처리 동의 |
| 4 | `hospital3p` | 병원 제3자 제공 동의 | 개인정보 제3자 제공 동의 (병원) |
| 5 | `insurer3p` | 보험사 제3자 제공 동의 | 개인정보 제3자 제공 동의 (보험사) |

- 노션 원문을 **조문·표·불릿 구조 그대로** 옮긴다. 인라인 `**굵게**`는 텍스트에 그대로 두고 렌더러가 `<strong>`으로 바꾼다(굵게만,
  링크 없음 — 이메일은 평문). 바꾸는 것은 「배경」의 셋(대괄호 제거 · 시행일 · □ 줄 제거)뿐
- 테스트(`node:test`): 5개 · key 유일 · key 집합 = `initialApplyState.consents` 키 집합 · 제목·라벨·블록 ≥1 · 표 행 길이 = head 길이 ·
  본문 어디에도 `[`·`□` 없음 · `CONSENT_VERSION === 'consent-v1'` · `consentDoc` 조회

### 2. S4 순수 로직 — 생년월일 포맷 · 신청 정보 검증

`src/lib/birth.ts` (+ `birth.test.ts`)
- `formatBirthInput(value: string): string` — 숫자만 최대 8자리, `YYYY` → `YYYY-MM` → `YYYY-MM-DD` 자동 하이픈. `phone.ts`와 같은 모양

`src/apply/validateApplicant.ts` (+ `validateApplicant.test.ts`) — `validateApplicant(a: Applicant, today: string): ApplicantErrors`

| 필드 | 규칙 | 메시지 |
| --- | --- | --- |
| name | trim 2~20자 | 이름은 2~20자로 적어 주세요 |
| phone | `/^010-\d{4}-\d{4}$/` | 010으로 시작하는 휴대전화 번호를 적어 주세요 |
| birth | 빈 값 | 생년월일을 적어 주세요 |
| birth | `YYYY-MM-DD` 형식·달력에 있는 날(`isRealDate` 재사용) | YYYY-MM-DD 형식으로 적어 주세요 |
| birth | `today`보다 뒤 | 생년월일을 확인해 주세요 |
| birth | **만 14세 미만** — `ageOn(birth, today) < 14`(연·월·일 비교, 생일 당일은 14세) | 만 14세 이상만 신청할 수 있어요 |
| petName | trim 1~20자 | 반려동물 이름을 적어 주세요 |

`src/apply/steps/applicantFields.ts` — `fieldId(name)`·`APPLICANT_FIELD_ORDER`(name → phone → birth → petName). `treatmentFields.ts`와 같은 이유로 분리

### 3. S4 화면 — `steps/ApplicantForm.tsx` + `steps/StepApplicant.tsx`

- 헤딩: `steps.ts` 4단계 title 「신청 정보」 유지, description → **「로그인·인증 없이 신청해요. 담당자가 전화로 확인한 뒤 진행해요」**(Figma)
- 패널 「보호자 · 반려동물 정보」 2열(≤768 1열):

| 칸 | 입력 | 힌트 |
| --- | --- | --- |
| 보호자 이름 * | text, `autoComplete="name"`, placeholder 「예) 김민석」 | 실명 2~20자 |
| 휴대전화번호 * | text, `inputMode="tel"`, `autoComplete="tel"`, `formatMobileNumber`로 즉시 포맷, placeholder 「010-0000-0000」 | 담당자가 24시간 안에 연락드려요 |
| 생년월일 * | text, `inputMode="numeric"`, `formatBirthInput`, placeholder 「YYYY-MM-DD」, maxLength 10 | 만 14세 이상만 신청할 수 있어요 |
| 반려동물 이름 * | text, placeholder 「예) 코코」 | 병원에 등록된 이름으로 |

- 패널 아래 `.apply-note` 「🔒 청구 준비 단계에서 담당자가 필요한 서류가 있으면 따로 요청드려요. 지금은 위 정보만 있으면 돼요.」
  (주민번호·사본 문구 없음 — 티켓)
- 흐름은 S1과 같다: 값은 입력 즉시 `setApplicant` patch → 「다음」에서 `validateApplicant` → 오류면 첫 오류 칸 포커스, 아니면 `next`.
  한 번 걸린 뒤에는 입력마다 재검증
- `ApplyRail` 보호자 행: `[name, phone].filter(Boolean).join(' · ')` — Figma S5 「김민석 · 010-1234-5678」

### 4. 전송 — `src/lib/claims.ts` · `src/apply/claimPayload.ts` · `analytics.ts`

`src/apply/claimPayload.ts` (+ test) — `toClaimPayload(state: ApplyState, refCode: string | null): ClaimPayload` 순수 함수.
**wire 포맷 = `claims` 컬럼 snake_case** (SSH-544 계약):

```ts
export interface ClaimPayload {
  guardian_name: string; guardian_phone: string; guardian_birth: string; pet_name: string;
  hospital_name: string; hospital_address: string | null; visit_date: string; treatment_cost: number; diagnosis: string | null;
  insurer: string; product_name: string | null;
  required_docs: RequiredDocsSnapshot | null;
  consent_terms: boolean; consent_privacy: boolean; consent_unique_id: boolean; consent_hospital_3p: boolean; consent_insurer_3p: boolean;
  consent_version: string;                                   // CONSENT_VERSION
  ref_code: string | null;
}
```
- 문자열은 trim, 선택 칸(주소·병명·상품명)은 비면 `null`, `treatment_cost`는 숫자만 남겨 `Number`. `consented_at`은 보내지 않는다(서버 시각)
- 테스트: 전 필드 매핑 · trim·null 규칙 · 진료비 `"58,000"` → 58000 · `required_docs` null 통과 · `consent_version`

`src/lib/claims.ts` — `submitClaim(payload: ClaimPayload, signal?: AbortSignal): Promise<{ receiptNo: string }>`
- `POST /api/claims`, `Content-Type: application/json`, **15초 타임아웃** + 호출자 signal 합성(`claimDocuments.ts`와 같은 구조)
- 응답 계약: 성공 `200 { ok: true, receipt_no: 'BGN-260910-01' }` / 실패 비-2xx `{ ok: false, error: string }`. 비-2xx·`ok !== true`·
  `receipt_no` 누락은 `Error(body.error ?? 'claim_submit_failed')`, `AbortError`는 그대로 throw. 얇은 래퍼라 테스트하지 않는다
  (`geminiAnalyze.ts`·`claimDocuments.fetchClaimDocuments`와 같은 취급)

`src/lib/analytics.ts` — `getRefCode`를 `export`(본문 변경 없음)

### 5. S5 동의 + S5-a 전문 — `steps/StepConsent.tsx` · `steps/ConsentDocument.tsx`

**S5 본문** (Figma S5), 헤딩 description → **「5개 모두 필수예요. 「보기」를 누르면 전문을 읽을 수 있어요」**
1. 「모두 동의합니다」 마스터 행 — checked ⇔ 5개 전부 true. 클릭하면 5개를 한 번에 `setConsents`
2. 개별 5행(1절 순서) — 커스텀 체크(`<input type="checkbox">` + `appearance:none`) · 라벨 · `(필수)` 코랄 · 오른쪽 「보기」 버튼
3. 회색 베타 문구: 「베타 서비스예요. 동의 문안은 법률 검토 전이며, 위임장은 병원 방문 때 종이로 받아요. 신청 즉시 담당자에게 알림이
   가고 24시간 안에 연락드려요.」
4. (실패했을 때만) **오류 배너** — Figma에 없어 이 spec이 정의한다(**1차 리뷰 결정 6**). 앰버(`--secondary-50/100`, S3 fallback 배너와
   같은 톤): 제목 「신청을 보내지 못했어요」 · 부제 「네트워크가 불안정하거나 서버가 응답하지 않았어요. 입력한 내용은 그대로 남아 있어요.」 ·
   버튼 「다시 시도」(primary 소형, 재전송) + 「인스타 DM으로 신청」(고스트 흰 배경, `INSTAGRAM_URL` 새 탭, `track('cta_click', { cta: 'apply_error_insta' })`)
5. `ApplyActions nextDisabled={!allChecked || submitting} nextLabel={submitting ? '전송 중…' : undefined} onNext={submit}`

초기값은 전부 미체크(사전 체크 없음 — 법률 검토 현황 ⑥). 체크 상태는 상태에 즉시 들어가 S4로 갔다 와도 유지된다.

**전송** — 로컬 `submitting`·`failed`. `submit()`: `failed=false, submitting=true` → `submitClaim(toClaimPayload(state, getRefCode()), signal)`
→ 성공 `dispatch(setReceiptNo)` + `dispatch(goto 6)` / 실패(`signal.aborted`면 무시) `failed=true` → `finally submitting=false`.
언마운트 시 `abort()`. 중복 전송 방지는 `submitting` 동안 버튼 비활성 + reducer의 「6은 종착」 규칙.

**S5-a 전문** (Figma S5-a) — 로컬 `viewing: ConsentKey | null`. 있으면 헤딩·본문·액션 행 대신 `<ConsentDocument doc index onClose>`:
1. 칩 「동의 {n} / 5 · 필수」(코랄 `--primary-50/600`)
2. 제목(`h2`, display 폰트) · 메타 「문안 버전 {CONSENT_VERSION} · {CONSENT_EFFECTIVE_DATE} 시행 · 베타(법률 검토 전)」
3. 본문 패널 — 블록 렌더: `h` → `h3` · `p` → `p` · `ol`/`ul` · `table` → `<table>`(≤480은 `td[data-label]`로 세로 카드). 인라인 `**` → `<strong>`
4. 앰버 주의 「⚠ 베타 기간 문안이에요. 법률 검토 후 내용이 바뀔 수 있고, 바뀌면 문안 버전이 올라가요.」
5. 하단 행 「동의 전문 · 5단계 「보기」에서 열림」 + 「닫기」(고스트)

프로그레스·레일은 그대로 둔다(Figma 데스크톱). 모바일 Figma의 nav 축소·✕는 하지 않고 하단 「닫기」로 통일(**결정 8**). 열릴 때 `window.scrollTo(0,0)`.

**뒤로가기 연동** — 「보기」 핸들러: `history.pushState({ applyConsent: key }, '')` → `setViewing(key)`. `useEffect`가 `popstate`를 구독해
`viewing`이 있으면 `setViewing(null)`. 「닫기」는 `history.back()`(→ popstate → 닫힘)이라 엔트리가 남지 않는다. 전문이 열린 채 컴포넌트가
언마운트되면(프로그레스로 이전 단계 클릭) cleanup에서 `history.back()`으로 남은 엔트리를 걷는다. 닫혀 있을 때의 popstate는 무시한다 —
단계 단위 back은 SSH-547이 맡고 그때 `history.state` 키를 합친다.

### 6. S6 접수 완료 — `steps/StepDone.tsx`

헤딩·`ApplyActions` 없이 자기 레이아웃(Figma S6):
1. sage 체크 원(56px) → 「신청이 접수됐어요」(display) → 「담당자가 24시간 안에 전화드릴게요. 병원 확인이 끝나면 문자·카톡으로 알려드려요.」
2. 접수번호 박스(`--primary-50`, 가운데): 「접수번호」 · **`state.receiptNo`**(display 32px, 코랄) · 「문의할 때 이 번호를 알려 주세요」
3. 패널 「앞으로의 절차」 — 세로 타임라인 4개(번호 원 + 제목 + 설명, 원 사이 세로선):

| # | 제목 | 설명 | 원 색 |
| --- | --- | --- | --- |
| 1 | 담당자 연락 | 24시간 안에 전화로 진료 사실과 보험 정보를 확인해요 | 코랄 |
| 2 | 병원 사전 확인 | 서류 발급 가능 여부와 위임장·인증 필요 여부를 병원에 물어봐요 | 앰버 |
| 3 | 서류 수령 | 가까운 팀원이 병원에 방문해 서류를 받아요 | sage |
| 4 | 보험사 청구 | 신분증·통장 사본·위임장을 받은 뒤 보험사에 제출하고 알려드려요 | sage |

4. 앰버 전폭 버튼 「인스타그램에서 진행 소식 받기」(`Icon instagram`, `INSTAGRAM_URL` 새 탭, `track('cta_click', { cta: 'apply_done_insta' })`)
5. 「청구 진행 상황 조회 기능은 아직 없어요. 담당자가 진료 확인·서류 확보·청구 완료 세 번 문자로 알려드려요.」
6. 하단 행 「접수 완료」 + 「처음으로」(고스트) → `dispatch({ type: 'reset' })` — 상태·사진 object URL(Provider)이 함께 비워진다

프로그레스는 5개 전부 done·잠금(이미 구현). 레일은 그대로(Figma).

### 7. 셸 연결 · `ApplyActions` · 정리

- `ApplyPage.tsx#StepBody`: 4 → `StepApplicant`, 5 → `StepConsent`, 6 → `StepDone`. 주석 갱신
- `ApplyActions.tsx`: `nextLabel?: string` — 있으면 `def.nextLabel` 대신 표시(**결정 10**)
- `steps/StepPlaceholder.tsx` 삭제 · `apply.css`의 `.apply-placeholder` 삭제 — 이 PR 뒤 사용처 0
- `steps.ts` 4·5단계 description(3절·5절)

### 8. 스타일 — `src/styles/apply.css`에 절 3개 추가

`index.css`는 건드리지 않는다. 토큰만 쓴다.

| 절 | 클래스 | 용도 |
| --- | --- | --- |
| S4 | (없음) | S1 폼 클래스·`.apply-note` 재사용 |
| S5 | `.apply-consent-all` · `.apply-consent-list` · `.apply-consent-row` · `-label` · `-required` · `-view` | 마스터 행(코랄 테두리·`--primary-50`), 개별 목록(패널, 행 구분선), 「보기」 링크 버튼 |
| S5 | `.apply-consent-check` | `appearance:none` 원형 22px, 체크 시 `--primary-500` 배경 + 흰 체크(mask 없이 `::after` 회전 테두리) |
| S5 | `.apply-consent-beta` · `.apply-consent-error` · `-title` · `-sub` · `-btns` | 베타 문구(13px 3차색) · 오류 배너(앰버) |
| S5-a | `.apply-consent-doc` · `-chip` · `-title` · `-meta` · `-body`(h3/p/ol/ul/table) · `-warn` · `-foot` | 전문 레이아웃. 표는 `--border` 선, 헤더 `--neutral-100` |
| S6 | `.apply-done` · `-icon` · `-title` · `-sub` · `-receipt` · `-receipt-no` · `-steps` · `-step` · `-step-num.tone-primary/-secondary/-success` · `-insta` · `-note` · `-foot` | 접수 완료 |

반응형: ≤768 폼 1열(기존 규칙) · ≤480 오류 배너 버튼 세로 전폭, 전문 표 → 세로 카드(`td::before { content: attr(data-label) }`), S6 번호 원 축소.

### 9. 파일 목록

```
src/apply/consents.ts · consents.test.ts                            신규 — 1절
src/lib/birth.ts · birth.test.ts                                    신규 — 2절
src/apply/validateApplicant.ts · validateApplicant.test.ts          신규 — 2절
src/apply/steps/applicantFields.ts                                  신규 — 2절
src/apply/steps/ApplicantForm.tsx · StepApplicant.tsx               신규 — 3절
src/apply/claimPayload.ts · claimPayload.test.ts                    신규 — 4절
src/lib/claims.ts                                                   신규 — 4절
src/lib/analytics.ts                                                getRefCode export — 4절
src/apply/steps/StepConsent.tsx · ConsentDocument.tsx               신규 — 5절
src/apply/steps/StepDone.tsx                                        신규 — 6절
src/apply/ApplyPage.tsx · ApplyActions.tsx · ApplyRail.tsx · steps.ts   수정 — 3·7절
src/apply/steps/StepPlaceholder.tsx                                 삭제 — 7절
src/styles/apply.css                                                8절
docs/spec/SSH-486/{spec,tasks}.md · 스크린샷                          이 문서
```

## 범위 밖 — 형제 티켓이 한다

| 안 하는 것 | 어디서 |
| --- | --- |
| `server/claims.ts`·`api/claims.ts`·`supabase/schema.sql claims`·슬랙 webhook·`vite.config.ts` `/api/claims` 미들웨어·환경변수 | SSH-544 (4절 계약대로) |
| 로컬·프리뷰용 mock 응답 | 하지 않음 — 「배경」 |
| `apply_step`·`apply_submit`·`apply_done`/`apply_error` 트래킹(위키 ⑨) | SSH-545 (SSH-473이 `apply_docs`를 미룬 것과 같은 결) |
| 단계 단위 브라우저 back(`history.state` ↔ step) | SSH-547 — 여기서는 전문 닫기 한 엔트리만 |
| 모바일 S5의 인라인 「신청 요약」 카드 | 하지 않음 — 레일이 ≤768에서 본문 아래로 내려와 이미 보인다 |
| 모바일 S5-a의 nav 축소·상단 ✕ | 하지 않음 — 하단 「닫기」로 통일(결정 8) |
| ~~S4 안내 카드 연파랑 토큰 신설~~ | 1차 리뷰에서 뒤집힘 — Figma 변수 `tint/info`·`on-tint/info`를 `index.css` 토큰으로 추가(아래 「1차 리뷰 결정」) |
| 위임장 서명·신분증·통장 사본 업로드·마케팅 동의·동의 철회 UI·진행 상태 조회 | 백로그(위키 ①) |
| 개인정보처리방침 v3 링크 교체 | SSH-545 |
| `mvp/*`·`index.css` 잔재 정리 | SSH-545 |

## 검증

- [ ] `npm run build`(`tsc -b`) · `npm run lint` · `npm test` — consents·birth·validateApplicant·claimPayload 신규
- [ ] `npm run dev` `/apply`: S1~S3 채우고 S4 — 빈 「다음」 → 4칸 오류 + 이름 칸 포커스 · 이름 1자 오류 · `01012345678` 입력 → `010-1234-5678` ·
      생년 `20150101` → 「만 14세 이상만」 · 오늘 이후 → 「확인해 주세요」 · `2000-02-30` → 형식 오류 · 통과 → S5, 레일 보호자 「이름 · 전화」
- [ ] S5: 개별 5개 체크 → 마스터 자동 체크 · 마스터 해제 → 전부 해제 · 4개만이면 「신청하기」 비활성 · S4로 갔다 와도 체크 유지
- [ ] S5-a: 「보기」 → 전문(조문·표·굵게) · **브라우저 뒤로가기 → 전문만 닫히고 체크 유지** · 「닫기」 → 닫힘 · 전문 열고 프로그레스로 S2 →
      그 뒤 back 한 번에 랜딩으로 튀지 않음
- [ ] 「신청하기」(API 없음, 404) → 「전송 중…」 비활성 → 오류 배너 + 「다시 시도」·「인스타 DM으로 신청」 · 입력 유지
- [ ] 헤드리스에서 `window.fetch`를 `/api/claims` → `{ ok:true, receipt_no:'BGN-260910-01' }`로 스텁 → S6 접수번호·절차·프로그레스 전부
      done·잠금 · 「처음으로」 → S1 빈 폼·업로드 카드 idle
- [ ] Vercel 프리뷰 `/apply?r=test` (새로고침 포함)
- [ ] 스크린샷 → `docs/spec/SSH-486/`: 대표 S5 1440 · 768 · 390 + S4 · S5-a · S6 · 오류 배너 1440

## 1차 리뷰 결정 요청

1. **전문 = 5단계 본문 교체 + `pushState` 한 엔트리로 뒤로가기 닫기** (계획 단계 사용자 확정) — 「배경」·5절
2. **노션 대괄호는 벗기고 값 그대로, 시행일 2026-09-10** (사용자 확정) — 전문 5개는 사용자가 읽고 오류를 확인한다
3. **mock 없음, 실제 fetch만** (사용자 확정) — 성공 경로는 fetch 스텁으로 검증
4. **생년월일 텍스트 + 자동 하이픈** (사용자 확정)
5. **payload는 `claims` 컬럼 snake_case, `consented_at`은 서버 시각** — 4절 계약을 SSH-544가 그대로 구현
6. **오류 배너 디자인** — Figma 없음. 앰버 배너 + 「다시 시도」·「인스타 DM으로 신청」. 승인되면 구현 뒤 스크린샷을 보고 Figma에 그린다
7. **S4 안내 카드는 `.apply-note` 중립색** — 연파랑 토큰을 만들지 않는다
8. **모바일 S5-a는 하단 「닫기」만** — nav 축소·✕ 없음
9. **트래킹 5개는 SSH-545** — 이 PR은 기존 `cta_click`만 2곳(S5 오류·S6 인스타)
10. **`ApplyActions.nextLabel?` prop** — 「전송 중…」 표시용
11. **`StepPlaceholder` 삭제** — S3까지 머지되어 사용처가 없어진다

## 1차 리뷰 결정 (2026-09-10)

Draft PR #32에서 사용자가 **1~11 전부 추천안대로 확정**하고 두 가지를 더 지시했다.

1. **결정 6(오류 배너) — Figma에도 그린다.** 구현 뒤 데스크톱 `S5-1 · 전송 실패`·모바일 `S5-1 · 전송 실패` 프레임을 S5 복제 + 앰버 배너로 추가했다
2. **결정 7(S4 안내 카드) — Figma 변수에 있는 색을 쓴다.** Figma 변수 `tint/info`(#D6E6F5)·`on-tint/info`(#305A8A)를 같은 이름의 토큰
   `--tint-info`·`--on-tint-info`로 `index.css`에 추가하고 `.apply-note.is-info`가 쓴다. 「`index.css`는 건드리지 않는다」(8절)의 예외 — 토큰 두 줄뿐

구현 중 추가한 것: `ApplyProgress`가 접수 완료(잠금)에서 완료 단계를 숫자 대신 체크로 그린다(Figma S6) · 전문·접수 완료 `section`에
`padding:0`(`index.css` 전역 `section` padding) · 5절의 커밋 2개는 전문·전송이 한 컴포넌트라 하나로 합쳤다.
