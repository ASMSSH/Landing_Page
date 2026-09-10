# SSH-473 — S3 필요 서류 추천

`/apply` 셸(SSH-542)과 S1·S2(SSH-543) 위에 **3단계 필요 서류 추천** 본문을 올린다. S1 병명으로 청구 유형을 추정하고
S2 보험사와 함께 기존 `GET /api/claim-documents`(노션 필요서류 DB)를 조회해 병원 발급 / 직접 준비 2열로 보여 준다.
보험사가 「기타 / 모름」이거나 조회에 실패하면 「담당자가 확인 후 안내드려요」 카드와 공통 기준 서류 3건을 보여 준다.
결과는 상태 `requiredDocs`에 스냅샷으로 남아 S5 「신청하기」가 그대로 보낸다(전송은 SSH-486·544).
**S4~S6 본문·저장·트래킹·서버 로직은 건드리지 않는다** — 형제 티켓이 한다.

> **이 PR이 남기는 것 한 문장**: `/apply` 3단계에 들어가면 S1 병명·S2 보험사 기준 서류가 병원 발급 / 직접 준비 2열로
> 보이고(기타/모름이거나 못 찾으면 담당자 안내 카드), 그 결과가 `requiredDocs` 스냅샷으로 남은 채 「무료로 대신 청구
> 맡기기」로 4단계에 넘어간다.

## 배경

참고한 문서 — 리뷰어가 "이 결정의 근거가 어디냐"를 묻지 않게 여기 적는다.

- **위키** `wiki/기획/대리청구-웹-창구-설계.md` (2026-09-09 갱신) — ② 유저 플로우(S3은 저장 없음, 서류만 보고 나가는
  이탈 구간), ④ 화면 명세(S3: 병원 발급 / 직접 준비 두 묶음 · "최종 요건은 보험사 결정" · 베타 무료 안내 · CTA 「무료로 대신
  청구 맡기기」/「서류만 확인할게요」 · 예외: 룩업 실패·미정의 보험사 → "담당자가 확인 후 안내" 카드), ⑤ 입력 필드(S3 결과는
  스냅샷으로 저장 O), ⑦ 기술(`api/claim-documents.ts`·`mvp/Step3Result.tsx` 재사용, S1 병명을 청구유형 추정에 그대로 사용),
  ⑫ 리스크(마이브라운·카카오페이 접수 제한 문구 — S2가 이미 표시)
- **Figma** 데스크톱 시안 S3-0(서류 확인 중) · S3(필요 서류 추천), 모바일 시안 S3(로딩) · S3(필요 서류) — 문안·레이아웃·
  상태 표현은 여기서 가져왔다. **fallback(담당자 안내) 상태의 프레임은 없다** → 이 spec이 정의하고 1차 리뷰에서 확인받는다
- **Jira** SSH-473 본문 + 형제 티켓 SSH-543(S1·S2, 머지됨) · SSH-486(S4~S6) · SSH-544(API·DB, `claims.required_docs jsonb`) ·
  SSH-545(트래킹 `apply_docs`·mvp 삭제). 범위 경계를 이들과 맞췄다 — 아래 「범위 밖」
- **프로덕션 API 실측** (2026-09-10, `GET /api/claim-documents`를 보험사 7곳 × 청구유형으로 호출) — 아래 「지금 레포 상태」

### 왜 병명이 비어 있으면 `manual`이 아니라 `illness`인가

기존 `inferClaimType`은 텍스트가 비면 `manual`을 돌려준다. 체험 모달에서는 `docType`(「진료비 영수증」)이 항상 붙어
있어 실제로는 도달하지 않던 값이다. `/apply`에서는 병명이 선택 입력이라 빈 값이 흔한데, 실측 결과 노션의 `수동 확인` 행은
**배상책임 청구 전용**(진단서·치료영수증·사고 경위서)이라 일반 통원에 맞지 않는다. 빈 병명은 가장 일반적인 **질병(통원)**으로
조회한다. `manual`은 S3에서 절대 만들지 않는다(유니온에서 빼지는 않는다 — 서버·mvp가 아직 쓴다).

### 왜 「기타 / 모름」은 API를 부르지 않는가

서버는 `기타`를 `공통` 행과 함께 조회하지만 노션에 「공통」 보험사 행이 없어 **항상 404 `no_documents`**다(실측). 결과가 정해진
요청을 보내고 로더를 보여 줄 이유가 없다. 「기타 / 모름」이면 조회 없이 바로 담당자 안내 카드 + 공통 기준 3건을 보여 준다.
나중에 노션에 「공통」 행이 생기면 `canLookupDocs`의 조건 한 줄만 풀면 된다.

### 왜 `inferClaimType`을 고치지 않고 `inferClaimTypeFromText`를 추가하는가

`src/lib/claimType.ts`는 `src/mvp/types.ts`의 `Fields`를 import한다. `src/mvp/*`는 SSH-545에서 통째로 지워진다. 곧 지워질
타입에 기대는 대신 **텍스트 하나를 받는 함수**를 추가하고, 기존 `inferClaimType`은 첫 인자를 구조적 타입
`{ docType: string; diag: string }`으로 바꿔 `mvp/types` import를 없앤 뒤 새 함수에 위임한다. `mvp/Step3Result.tsx`가 넘기는
`Fields`는 그 구조에 그대로 맞으므로 **mvp 파일은 한 줄도 바꾸지 않는다.** 기존 동작(surgery 우선, 빈 텍스트 → manual)은 그대로.

### 왜 notes·downloads를 그리지 않는가

서버 응답의 `notes`는 「출처: <보험사 안내 URL>」이고 `downloads`는 청구서 PDF다. 티켓이 「이름 + 배지만, 설명 없음」으로 못
박았고 Figma에도 없다. 보호자가 서류를 직접 준비하는 게 아니라 담당자가 대신하므로 출처·양식 링크는 이 화면의 정보가 아니다.
스냅샷에도 넣지 않는다.

### 왜 서버 응답 타입을 클라이언트에서 다시 선언하는가

SSH-543과 같은 이유 — `tsconfig.app.json`은 `src`만 포함하고 `server/`를 `import type`으로 끌어오면 앱 타입 검사에 `node` 의존이
생긴다. `src/data/resultDocs.ts`에 같은 타입이 있지만 그 파일은 체험 모달용 fallback(설명·금액 문맥 포함)이라 SSH-545 삭제 후보다.
`src/lib/claimDocuments.ts`가 `/api/claim-documents` 응답 계약을 자기 것으로 갖는다.

### 지금 레포 상태 — 딛고 설 것

- **상태는 이미 있다.** `src/apply/state.ts`의 `RequiredDocsSnapshot { insurer, claimType, hospitalIssued: string[], selfPrepared: string[], fallback: boolean }`과
  `setRequiredDocs` 액션(SSH-542, "모양은 SSH-473이 확정한다"). **이 모양 그대로 확정한다** — 이름 배열 + fallback 표시면
  S5 전송·담당자 확인에 충분하다. 상태 필드를 추가하지 않는다
- 단계 컴포넌트가 `StepHeading`·`ApplyActions`를 자기 안에서 렌더한다(SSH-543 5절). `ApplyActions`는 `nextDisabled?`·`onNext?`를
  받고 2단계부터 「← 이전」을 그린다. **보조 버튼을 바꿔 끼울 통로가 없다** — 3절
- `steps.ts` 3단계: title 「필요 서류」, description 「이 청구에 필요한 서류예요. 병원 발급 서류는 저희가 대신 받아드려요」,
  nextLabel 「무료로 대신 청구 맡기기 →」. 제목·CTA는 그대로, description은 로딩 문구로 바꾼다(2절)
- `server/documents.ts#getClaimDocuments` + `api/claim-documents.ts`(Vercel) + `vite.config.ts`의 `documentsApi` 미들웨어(로컬).
  입력 `claimType`(영문 7종) · `insurer`(회사명 첫 단어로 정규화, `기타…` → `기타`). 응답 200 `{ claimType, title, source, hospitalDocs[], selfDocs[], downloads?, notes[] }`,
  실패는 항상 비-2xx `{ ok:false, error, message? }`(400 잘못된 유형 · 404 없음 · 501 env 미설정 · 502 노션 실패). **변경 없음**
- **실측**(프로덕션, 2026-09-10): 보험사 7곳 모두 200, 청구유형 7종 모두 행이 있다. 한 열이 비는 경우가 있다(마이브라운은
  직접 준비 0건). `기타 / 모름`·빈 보험사 → 404. 서류 이름이 길다(현대해상 최대 60자대) → 2열에서 줄바꿈을 허용해야 한다
- `src/lib/claimType.ts#inferClaimType(fields: Fields, surgery: boolean)` — 키워드 규칙 6단계 + 빈 텍스트 `manual`. `mvp/types` 의존
- `src/lib/geminiAnalyze.ts` — fetch 래퍼 패턴(타임아웃·AbortError 통과·서버 `error` 문자열 throw). `claimDocuments.ts`가 따른다
- `src/apply/Toast.tsx` — 하단 고정 4초 토스트, S1이 로컬 상태로 띄운다. S3 「서류만 확인할게요」에도 쓴다(주석 갱신)
- `apply.css` — `.apply-panel` `.apply-spinner` `.apply-btn-ghost` `.apply-note` 재사용. `index.css`의 `.tag` `.res-item` `.result-note`는
  체험 모달 전용이라 SSH-543과 같은 이유로 **재사용하지 않고 `apply-docs-` 클래스로 새로 쓴다**
- 로컬 `.env`에 `NOTION_TOKEN`·`NOTION_DOCS_DATA_SOURCE_ID`가 없으면 서버가 501 → **로컬 기본 화면은 fallback**이다. 정상 경로는
  키를 넣거나 Vercel 프리뷰에서 본다(검증 절)

## 범위

### 1. 순수 로직 — 청구 유형 추정 · API 클라이언트 · 스냅샷 변환

`src/lib/claimType.ts`
- `inferClaimTypeFromText(text: string): ClaimType` 추가 — 기존 키워드 체인을 **순서 그대로** 옮긴다(피부 → 수술 → 상해 → 예방 →
  검사/처치 → 그 외 `illness`). **빈 문자열·공백도 `illness`.** 대소문자 무시(`X-Ray` → procedure)
- `inferClaimType(fields: { docType: string; diag: string }, surgery: boolean)` — 첫 인자를 구조적 타입으로, `mvp/types` import 제거.
  `surgery`면 `surgery`, 텍스트가 비면 `manual`(기존 유지), 아니면 `inferClaimTypeFromText(`${docType} ${diag}`)`
- `CLAIM_TYPE_LABEL: Record<ClaimType, string>` — 헤딩용 UI 라벨. illness 「통원」 · injury 「상해」 · skin 「피부」 · procedure 「검사·처치」 ·
  surgery 「수술·입원」 · preventive 「예방·검진」 · manual 「수동 확인」. Figma 「삼성화재 · 통원 기준」에 맞춘 표시용이고 서버의
  노션 select 값(`질병`, `피부/아토피` …)과는 별개다
- `claimType.test.ts` 신규 — 키워드별 7종 · 빈/공백 → illness · 대소문자 · 우선순위(「피부염 수술」 → skin) · `inferClaimType`은
  surgery 우선·빈 fields → manual 유지

`src/lib/claimDocuments.ts` (신규)
- `ClaimDocumentGuide`·`ResultDoc` 타입 재선언(서버 `server/documents.ts`와 1:1)
- `fetchClaimDocuments(claimType: ClaimType, insurer: string, signal?: AbortSignal): Promise<ClaimDocumentGuide>` —
  `GET /api/claim-documents?claimType=&insurer=`, **10초 타임아웃**과 호출자 signal 합성, `AbortError`는 그대로 throw, 비-2xx는
  `Error(body.error ?? 'claim_documents_unavailable')`. 얇은 래퍼라 테스트하지 않는다(`geminiAnalyze.ts`와 같은 취급)

`src/apply/requiredDocs.ts` (신규, React 의존 없음) + `requiredDocs.test.ts`
```ts
export const UNKNOWN_INSURER = '기타 / 모름';                 // data/insurers.ts 마지막 항목과 같은 문자열
export function canLookupDocs(insurer: string): boolean;      // INSURERS에 있는 실제 보험사만 true. 빈 값·기타/모름은 false
export function toRequiredDocsSnapshot(guide: ClaimDocumentGuide, insurer: string): RequiredDocsSnapshot;
export function fallbackRequiredDocs(insurer: string, claimType: ClaimType): RequiredDocsSnapshot;
export function isSnapshotCurrent(s: RequiredDocsSnapshot | null, insurer: string, claimType: ClaimType): s is RequiredDocsSnapshot;
export function docsSummaryLine(s: RequiredDocsSnapshot): string;
```
- `toRequiredDocsSnapshot`: `hospitalDocs`·`selfDocs`의 `name`만 trim해 담고 중복 제거. `claimType`은 guide 것. `fallback: guide.source !== 'notion'`
- `fallbackRequiredDocs`: **공통 기준 3건** — 병원 발급 「진료비 영수증」「진료비 세부내역서」 / 직접 준비 「보험금 청구서」, `fallback: true`.
  (실측한 7개 보험사 목록에 전부 들어 있는 항목만 골랐다. `resultDocs.ts`의 옛 목록은 삼성화재·35만원 같은 문맥이 박혀 있어 쓰지 않는다)
- `isSnapshotCurrent`: `s`가 있고 `insurer`·`claimType`이 모두 같을 때만 true — **재조회 규칙의 유일한 근거**
- `docsSummaryLine`: 정상 「삼성화재 · 통원 기준 — 병원에서 4개, 직접 준비 1개」 / fallback 「삼성화재 · 담당자 확인 필요 — 공통 서류 3개」
- 테스트: 스냅샷 변환(이름만·trim·중복·fallback 플래그) · fallback 모양 · `isSnapshotCurrent` null/보험사 다름/유형 다름/같음 ·
  `canLookupDocs` 3케이스 · `docsSummaryLine` 2문구

### 2. S3 화면 — `src/apply/steps/StepDocuments.tsx`

**로컬 status 상태를 두지 않는다.** 로딩 여부를 스냅샷에서 파생한다 — 실패도 fallback 스냅샷으로 수렴하므로 상태는 loading / ready 둘뿐이다.

```ts
const claimType = inferClaimTypeFromText(state.treatment.diagnosis);
const insurer = state.insurance.insurer;
const snapshot = isSnapshotCurrent(state.requiredDocs, insurer, claimType) ? state.requiredDocs : null;
const loading = snapshot === null;
```

`useEffect([insurer, claimType, state.requiredDocs, dispatch])`
1. `snapshot`이 있으면 아무것도 안 한다 — S4에 갔다 돌아오거나 입력이 그대로면 **로더 없이 즉시 결과**
2. `!canLookupDocs(insurer)`면 `dispatch(setRequiredDocs(fallbackRequiredDocs(insurer, claimType)))` — fetch 없음
3. 아니면 `AbortController` → `fetchClaimDocuments(claimType, insurer, signal)` → 성공 `setRequiredDocs(toRequiredDocsSnapshot(guide, insurer))` /
   실패는 `signal.aborted`면 무시, 아니면 `setRequiredDocs(fallbackRequiredDocs(...))`. cleanup에서 `abort()`

이유 — 스냅샷이 단일 진실 원천이라 S5가 그대로 POST한다 · `(insurer, claimType)`이 스냅샷 안에 있어 S1 병명이나 S2 보험사를 바꾸면
S3 재진입 때 **자연히 재조회**된다(`setTreatment`에서 `requiredDocs`를 null로 미는 대안은 reducer가 S3 규칙을 알게 되어 기각) ·
StrictMode 이중 effect에서 1회차는 abort로 무시되고 fallback dispatch는 같은 값이라 멱등이다.

**렌더** — 헤딩 + 본문 + 액션 행 + 토스트

| 상태 | 헤딩 설명 | 본문 | 액션 행 |
| --- | --- | --- | --- |
| loading | `steps.ts` description(「{보험사} 기준으로 필요한 서류를 찾고 있어요」 — 2절 끝) | **로더 카드**(연코랄 `--primary-50`, 스피너 · **필요한 서류를 찾고 있어요…** · 보험사·진료 유형에 맞는 서류를 확인하는 중이에요. 잠시만요.) + **스켈레톤 패널**(열 제목 2 + 행 3×2, pulse) | 주 버튼 비활성 |
| ready · 정상 | `docsSummaryLine` | **요약 배너**(sage `--success-50/100`: 제목 「{보험사} · {유형} 청구 준비 서류」 + 「최종 요건은 보험사가 정해요. 담당자가 병원에 확인한 뒤 알려드려요.」 + 배지 「보험사 기준」) → **2열 패널**(🏥 병원에서 받을 서류 / ✍️ 직접 준비할 서류, 행 = 이름 + 배지 「병원 발급」/「보험사 양식」, 한쪽이 비면 열 제목 유지 + 「없어요」 한 줄) → **베타 카드**(앰버: 🎁 **베타 기간엔 대리 청구가 무료예요** / 서류 발급부터 보험사 제출까지 담당자가 대신해요. 사본은 나중에 따로 받아요.) | 「서류만 확인할게요」(고스트) + 「무료로 대신 청구 맡기기 →」 |
| ready · fallback | `docsSummaryLine` | 요약 배너의 **앰버 변형**(`.is-fallback`, `--secondary-50/100`): 제목 「담당자가 확인 후 안내드려요」 + 「{보험사} 기준 서류를 자동으로 찾지 못했어요. 신청하면 담당자가 보험사에 확인해서 알려드려요. 아래는 어느 보험사든 공통으로 필요한 서류예요.」 + 배지 「기본 안내」 → 같은 2열 패널에 공통 3건 → 같은 베타 카드 | 같음 |

- 배너 제목의 `{유형}`은 `CLAIM_TYPE_LABEL`(스냅샷에 title이 없으므로 클라이언트 문구). 「기타 / 모름」은 `{보험사}` 자리에 그대로 「기타 / 모름」
- `steps.ts` 3단계 `description`을 「가입한 보험사 기준으로 필요한 서류를 찾고 있어요」로 바꾼다 — 현재 문구는 결과 화면용인데
  결과는 `docsSummaryLine`이 대체하므로 남는 자리는 로딩뿐이다. 보험사 이름은 `StepDocuments`가 헤딩에 끼운다
- 하위 컴포넌트(`DocsLoader`·`DocsSkeleton`·`DocsSummary`·`DocsList`·`DocsBetaCard`)는 한 파일 안의 작은 함수. 200줄을 넘기면 `DocsList`만 분리
- 「무료로 대신 청구 맡기기 →」는 `ApplyActions` 기본 동작(`next`) — S3에 검증할 입력이 없다

### 3. 액션 행 — `ApplyActions`에 보조 버튼 통로

`src/apply/ApplyActions.tsx`
- prop 추가: `secondary?: { label: string; onClick: () => void }`. 있으면 「← 이전」 자리에 그 라벨의 고스트 버튼(`.btn.apply-btn-ghost`)을
  그리고 루트에 `has-secondary` 클래스를 붙인다(모바일 전폭 규칙의 스코프). 없으면 지금과 같다 — **S1·S2는 변화 없음**
- 2단계로 돌아가는 길은 프로그레스 바의 완료 단계 클릭(`goto`, 뒤로만 허용)이 이미 있다

**「서류만 확인할게요」 동작** — 클릭 시 `Toast` 「서류는 위 목록에서 확인하면 돼요. 맡기고 싶어지면 언제든 「무료로 대신 청구
맡기기」를 눌러 주세요」. 페이지를 떠나지 않고 상태도 잃지 않는다. 보호자가 원하는 건 지금 화면의 서류 목록이다 — `/`로 보내면
그 목록을 치우고 입력도 잃는다. 클릭 트래킹은 SSH-545(`apply_docs`와 함께). **1차 리뷰 결정 요청 4.**

### 4. 스타일 — `src/styles/apply.css`에 `/* S3: 필요 서류 */` 절 추가

`index.css`는 **건드리지 않는다.** 토큰(`--primary-*` 코랄 · `--secondary-*` 앰버 · `--success-*` sage · `--neutral-*` · `--radius-*`)만 쓴다.

| 클래스 | 용도 |
| --- | --- |
| `.apply-docs-loader` · `-title` · `-sub` | 로더 카드(`--primary-50` 배경, 원형 스피너 자리는 `.apply-upload-icon` + `.apply-spinner` 재사용) |
| `.apply-docs-skeleton` · `-line` + `@keyframes apply-docs-pulse` | 스켈레톤 패널(`--neutral-100/200`) |
| `.apply-docs-summary` (+`.is-fallback`) · `-title` · `-sub` | 요약 배너 sage ↔ 앰버 |
| `.apply-docs-badge` (+`.is-hospital` `.is-self` `.is-source`) | 행 배지(병원 발급 / 보험사 양식)·배너 배지(보험사 기준 / 기본 안내) |
| `.apply-docs-grid`(2열 → ≤768 1열) · `.apply-docs-col` · `-title` | 2열 목록 |
| `.apply-docs-row` · `.apply-docs-empty` | 서류 행(이름 `overflow-wrap:anywhere`, 배지 `flex-shrink:0`) · 빈 열 한 줄 |
| `.apply-docs-beta` · `-title` · `-sub` | 베타 무료 카드(`--secondary-50/100`) |
| `.apply-actions.has-secondary` | ≤480에서 버튼 세로 스택·전폭(주 버튼 위, 고스트 아래 — 모바일 시안) |

### 5. 셸 연결

`src/apply/ApplyPage.tsx` — `step === 3`이면 `<StepDocuments />`. 4·5는 placeholder 그대로. 주석 갱신.
`src/apply/Toast.tsx` — 「S1에서만 쓴다」 주석을 S3까지로 갱신(코드 변경 없음).

### 6. 파일 목록

```
src/lib/claimType.ts                        inferClaimTypeFromText · CLAIM_TYPE_LABEL · mvp 의존 제거
src/lib/claimType.test.ts                   신규 — node:test
src/lib/claimDocuments.ts                   신규 — /api/claim-documents 클라이언트 + 응답 타입
src/apply/requiredDocs.ts                   신규 — 순수 함수(스냅샷 변환·fallback·현재성·요약 문구)
src/apply/requiredDocs.test.ts              신규 — node:test
src/apply/steps/StepDocuments.tsx           신규 — S3 조립(헤딩·로더/결과·액션·토스트)
src/apply/ApplyActions.tsx                  secondary prop
src/apply/ApplyPage.tsx                     단계 분기
src/apply/steps.ts                          3단계 description → 로딩 문구
src/apply/Toast.tsx                         주석
src/styles/apply.css                        4절 클래스
docs/spec/SSH-473/{spec,tasks}.md           이 문서
docs/spec/SSH-473/apply-s3-{1440,768,390}.png · apply-s3-loading-1440.png · apply-s3-fallback-1440.png
```

## 범위 밖 — 형제 티켓이 한다

| 안 하는 것 | 어디서 |
| --- | --- |
| `apply_docs`(insurer, docs_count, fallback)·「서류만 확인할게요」 클릭 트래킹 | SSH-545 |
| `required_docs` 저장 · `POST /api/claims` 호출 · S4~S6 본문 | SSH-544 · SSH-486 |
| `server/documents.ts` 수정·테스트 · `api/claim-documents.ts` 변경 | 하지 않음 — 티켓 「그대로 재사용」 |
| 노션 필요서류 DB에 「공통」 보험사 행 추가 | 데이터 작업(운영) — 생기면 `canLookupDocs` 한 줄 |
| notes(출처 URL)·downloads(양식 PDF) 표시 | 하지 않음 — 「배경」 |
| `src/data/resultDocs.ts`·`src/mvp/Step3Result.tsx` 정리 · `index.css` 잔재 클래스 | SSH-545 |
| 청구 유형을 OCR 응답의 `claimType`으로 대체 | 백로그 — 위키 ⑦ 「S1 병명을 그대로 사용」 |
| 서류 다운로드·체크리스트 저장·인쇄 | 백로그 — Figma에 없음 |

## 검증

- [ ] `npm run build`(`tsc -b` 포함) · `npm run lint` · `npm test` — claimType · requiredDocs 신규 + 기존 전부
- [ ] `npm run dev` + `.env`에 `NOTION_TOKEN`·`NOTION_DOCS_DATA_SOURCE_ID`: S1 병명 「피부염」 + S2 삼성화재 → 로더 → 피부 서류 2열 →
      헤딩 「삼성화재 · 피부 기준 — 병원에서 N개, 직접 준비 M개」 → 「무료로 대신 청구 맡기기」 → S4 placeholder → 프로그레스로 S3 복귀 시 **로더 없이** 결과
- [ ] 병명 비움 → 「통원」(illness) 서류. S1에서 병명을 「골절」로 바꾸고 S3 재진입 → 재조회(상해)
- [ ] S2 「기타 / 모름」 → 로더 없이 담당자 안내 카드 + 공통 3건
- [ ] `.env` 키 제거(501) 또는 네트워크 차단 → 담당자 안내 카드(fallback) — 로컬 기본 화면
- [ ] 마이브라운(직접 준비 0건) → 오른쪽 열 「없어요」
- [ ] 「서류만 확인할게요」 → 토스트, 화면 유지. ≤480에서 버튼 두 개 전폭 세로
- [ ] S1·S2 액션 행이 그대로인지(「← 이전」 유지)
- [ ] Vercel 프리뷰 `/apply?r=test` — **Vercel에 `NOTION_TOKEN`·`NOTION_DOCS_DATA_SOURCE_ID`가 있는지 사람이 확인**(프로덕션에는 있다 — 실측)
- [ ] 스크린샷 1440 · 768 · 390(결과, 대표) + 로딩 1440 + fallback 1440 → `docs/spec/SSH-473/`, PR 본문 임베드

## 1차 리뷰 결정 요청

1. **빈 병명은 `illness`(통원)** — `manual`은 노션에서 배상책임 전용 행. 「배경」
2. **「기타 / 모름」은 API를 부르지 않고** 담당자 안내 카드 + 공통 기준 3건(진료비 영수증 · 진료비 세부내역서 · 보험금 청구서). 실측 404 확정
3. **조회 실패(501·502·404·네트워크)도 같은 카드** — `fallback: true` 스냅샷을 그대로 저장한다. 담당자가 확인할 신호가 `claims.required_docs`에 남는다
4. **「서류만 확인할게요」 = 토스트, 화면 유지.** 대안: (a) `/`로 이동 — 목록과 입력을 잃음 (b) S2 복귀 — 의미 없음. 3절
5. **notes(출처 URL)·downloads 미표시** — 티켓 「이름 + 배지만」. 「배경」
6. **fallback 카드 디자인** — Figma에 없어 요약 배너의 앰버 변형으로 제안(2절 표). 승인되면 Figma 데스크톱·모바일에 `S3-1 · 담당자 안내` 프레임을 그려 둘지
7. **`ApplyActions.secondary` prop으로 「← 이전」 자리를 대체** — S2 복귀는 프로그레스 클릭. 3절
8. **`inferClaimTypeFromText` 추가 + 기존 함수는 구조적 타입으로 위임** — mvp 파일 무수정. 「배경」
9. **재조회 규칙** — 스냅샷의 `insurer`·`claimType`이 현재 입력과 같으면 재조회하지 않는다(S4 갔다 와도 로더 없음). 2절
10. **`RequiredDocsSnapshot` 모양 확정** — SSH-542가 둔 그대로(이름 배열 + fallback). title·notes는 넣지 않는다

## 1차 리뷰 결정 (2026-09-10)

Draft PR #31을 연 뒤 사용자가 "판단해서 구현도 시작"으로 위임했다. **1~10 전부 추천안대로 확정**: 빈 병명 `illness` · 「기타 / 모름」은
API 미호출 + 공통 3건 · 실패도 fallback 스냅샷 저장 · 「서류만 확인할게요」는 토스트 · notes·downloads 미표시 · fallback 카드는 배너
앰버 변형(Figma 프레임은 구현 뒤 스크린샷을 보고 그린다) · `ApplyActions.secondary` · `inferClaimTypeFromText` 위임 · 재조회 규칙 ·
스냅샷 모양 그대로.
