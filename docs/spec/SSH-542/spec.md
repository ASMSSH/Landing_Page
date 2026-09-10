# SSH-542 — `/apply` 진입점 + 페이지 셸

대리청구 웹 창구 `/apply`의 **뼈대**만 만든다. 라우팅·배포 설정·SEO·5단계 프로그레스·2열/1열 레이아웃·
요약 레일·액션 행·상태 저장소까지. **단계 본문(S1~S6)은 비어 있다** — 각 화면은 SSH-543(S1·S2)·
SSH-473(S3)·SSH-486(S4~S6)이 이 셸 위에 올린다.

> **이 PR이 남기는 것 한 문장**: `/apply?r=test`로 들어오면(새로고침 포함) 빈 단계 5개를 「다음/이전」으로
> 오갈 수 있는 페이지가 뜨고, 768px 이하에서 레일이 본문 아래로 내려간다.

## 배경

참고한 문서 — 리뷰어가 "이 결정의 근거가 어디냐"를 묻지 않게 여기 적는다.

- **위키** `wiki/기획/대리청구-웹-창구-설계.md` (2026-09-09 갱신) — ② 유저 플로우(S1~S6, 저장은 S5 한 번),
  ④ 화면 명세, ⑦ 기술(라우팅은 `location.pathname` 분기, Vercel SPA rewrite 확인 필요), ⑩ 랜딩 변경 4건
- **Figma** 데스크톱 `node-id=1564-1332` · 모바일 `node-id=1564-1330` · **반응형 데모 `node-id=1640-1327`**
  (반응형 규칙이 여기 적혀 있다 — 아래 「레이아웃」)
- **Jira** SSH-542 본문 + 형제 티켓 SSH-543 · SSH-473 · SSH-486 · SSH-544 · SSH-545 (범위 경계를 이들과 맞췄다)

### 왜 페이지고 모달이 아닌가

랜딩에 이미 「체험해보기」 모달(`src/mvp/`)이 있다. 그래도 `/apply`는 **URL이 있는 페이지**다 —
홍보 글·슬랙에 붙여넣을 링크(`boheomgaenyang.com/apply?r=<코드>`)가 필요하고, 새로고침해도 같은 자리여야
한다(위키 ⑪-①). 체험 모달은 SSH-545에서 제거된다. **이 티켓은 모달을 건드리지 않는다.**

### 지금 레포 상태

- 라우터 없음. `src/App.tsx`가 랜딩 섹션을 그대로 나열한다
- `vercel.json` 없음 → 프로덕션에서 `/apply` 새로고침 시 404 (Vercel은 정적 파일이 없으면 404)
- `index.html`의 canonical·OG는 `/` 하나로 고정. `public/sitemap.xml`도 `/` 하나
- `src/main.tsx`가 `observeSections(['problem','features','faq','signup'])`를 무조건 부른다 — `/apply`엔 그 id가 없다
- 재사용할 스타일: `index.css`의 토큰(`--primary-500` 등)·`.wrap`·`.btn`·`.btn-primary`·`.field`·`.field-block`·
  `.beta-badge`. 모달용 `.stepper`·`.step-node`는 **재사용하지 않는다** — 모달 전용 크기(26px 원 + 12px 라벨)이고
  SSH-545에서 모달과 함께 지워질 클래스에 셸을 얹지 않는다

## 범위

### 1. 라우팅 — `pathname` 분기

```
src/App.tsx
  location.pathname === '/apply'  →  <ApplyPage />
  그 외                           →  기존 랜딩 (MvpProvider·MvpModal 포함, 변경 없음)
```

- 라우터 라이브러리를 **추가하지 않는다.** 페이지가 둘뿐이고, S1~S6은 `/apply` 안의 상태(step)이지 URL이 아니다
  (위키 ②: 저장은 S5 한 번, 중간 단계는 URL로 복원할 값이 없다). `/apply/` 트레일링 슬래시도 같은 페이지로 본다
- `src/main.tsx` — `observeSections`는 **랜딩일 때만** 호출한다. `initAnalytics()`는 양쪽 다 부른다
  (`page_view`에 `path`가 찍히고, `?r=` 유입 코드는 `initAnalytics` 안 `getRefCode`가 세션에 저장한다 — `/apply?r=test`도
  그대로 잡힌다)
- `MvpProvider`는 랜딩 쪽에만 남긴다. `ApplyPage`는 자기 Provider(`ApplyProvider`)를 쓴다

### 2. 배포 — `vercel.json` SPA rewrite

```json
{ "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }] }
```

- `api/` 경로는 제외한다 — Vercel 서버리스 함수(`api/*.ts`)가 rewrite에 먹히면 안 된다
- 정적 파일(`/og.png`, `/sitemap.xml`, 검색엔진 소유확인 HTML)은 Vercel이 파일시스템을 먼저 보므로 rewrite에
  걸리지 않는다. **프리뷰에서 `/sitemap.xml`·`/robots.txt`가 여전히 원본으로 열리는지 확인한다**(검증 항목)

### 3. SEO — sitemap + 런타임 메타

- `public/sitemap.xml`에 `https://www.boheomgaenyang.com/apply` 추가 (`priority 0.8`, `changefreq weekly`)
- `index.html`은 **한 파일이 두 페이지를 서빙**하므로 canonical·OG를 정적으로 둘 다 넣을 수 없다.
  `ApplyPage`가 마운트될 때 **런타임으로** `document.title`·`<link rel=canonical>`·`og:url`·`og:title`·
  `og:description`·`meta[name=description]`을 `/apply` 값으로 바꾼다 (`src/apply/useApplyMeta.ts`)
  - 제목: `대리청구 신청 · 보험찾개냥`
  - 설명: `영수증 한 장으로 펫보험 청구를 맡기세요. 베타 기간 무료, 로그인 없이 5분.`
- **한계를 적어 둔다**: 카카오톡·인스타 링크 미리보기 스크래퍼는 JS를 안 돌리므로 `/apply` 링크를 공유하면
  **랜딩 OG가 보인다.** 구글은 JS를 실행해 런타임 값을 읽는다. 공유 미리보기를 `/apply` 전용으로 하려면
  빌드 시 `/apply/index.html`을 따로 만드는 프리렌더가 필요한데, **이 티켓에선 하지 않는다** — 홍보 링크는
  `/apply?r=` 단독 공유보다 게시물 안 링크라 미리보기 비중이 낮고, 필요해지면 SSH-545(배포·홍보 링크 교체)에서
  판단한다. 「PR Point」에 남긴다
- `index.html`의 JSON-LD(`WebSite`·`FAQPage`)는 건드리지 않는다

### 4. 셸 — 화면 구조

Figma 데스크톱 S2 프레임(`1640-1331`) 기준. 위에서 아래로.

| 영역 | 내용 | 컴포넌트 |
| --- | --- | --- |
| Nav | 기존 `Nav` 재사용. `/apply`에선 앵커(`#problem` 등)가 없으므로 링크를 `/#problem` 절대 경로로. CTA는 Figma대로 「무료로 청구 맡기기」·`href="/apply"` | `components/Nav.tsx`에 `variant?: 'landing' \| 'apply'` prop |
| 페이지 헤더 | 좌: 「대리청구 신청」(display 폰트) + 「베타 기간 무료 · 로그인 없이 5분이면 끝나요」 / 우: `BETA` 배지 | `apply/ApplyHeader.tsx` |
| 프로그레스 | 가로 5단계. 원(26px) + 라벨 + 연결선. **완료=체크 아이콘·코랄 채움 / 현재=코랄 채움·숫자 / 미완=보더·숫자·회색 라벨.** 완료된 단계의 연결선도 코랄 | `apply/ApplyProgress.tsx` |
| 본문 · 메인(680) | 단계 헤딩(원 번호 + 제목 + 설명) + 단계 본문. **이 티켓에선 본문이 빈 패널** | `apply/StepHeading.tsx` + `apply/steps/StepPlaceholder.tsx` |
| 본문 · 레일(328) | 「신청 요약」 카드(병원 / 진료일 · 진료비 / 보험사 / 보호자 / 반려동물, 빈 값은 `—`) + 「이렇게 진행돼요」 카드(체크 4줄, sage 배경) | `apply/ApplyRail.tsx` |
| 액션 행 | 좌 `n / 5` · 우 「← 이전」(고스트, 1단계에선 숨김) + 주 버튼 | `apply/ApplyActions.tsx` |
| 푸터 | `© 보험찾개냥 · 베타 · 문의는 인스타 DM` 한 줄. **랜딩의 어두운 `Footer`가 아니다** — Figma가 한 줄이고, 랜딩 푸터의 앵커(`#faq` 등)도 여기선 죽는다 | `apply/ApplyFooter.tsx` |

**단계별 주 버튼 라벨**은 `steps.ts`에 둔다 — S1 「다음 →」 · S2 「필요 서류 확인 →」 · S3 「무료로 대신 청구 맡기기 →」 ·
S4 「다음 →」 · S5 「신청하기」. 각 단계 티켓이 활성/비활성 조건을 붙이고, **셸에선 항상 활성**이다
(완료 기준 "빈 단계 5개를 오갈 수 있다").

「이렇게 진행돼요」 4줄 문안(Figma):
- 병원에서 필요한 서류를 저희가 대신 받아드려요
- 신청하면 담당자가 24시간 안에 전화드려요
- 베타 기간엔 대리 청구가 무료예요
- 궁금한 건 인스타 DM으로 물어보세요 (→ `INSTAGRAM_URL` 링크)

### 5. 상태 — `useReducer` 한 곳

```
src/apply/state.ts        reducer + 타입 + 초기값 (순수 함수, React 의존 없음)
src/apply/ApplyContext.tsx ApplyProvider · useApply()   (MvpContext.tsx와 같은 패턴)
src/apply/steps.ts        STEPS 상수 (key · label · 헤딩 제목/설명 · 주 버튼 라벨)
```

```ts
type Step = 1 | 2 | 3 | 4 | 5 | 6;           // 6 = 접수 완료(S6). 프로그레스는 1~5만 그린다
interface ApplyState {
  step: Step;
  treatment: { hospitalName; hospitalAddress; visitDate; treatmentCost; diagnosis };   // S1
  insurance: { insurer; productName };                                                 // S2
  requiredDocs: RequiredDocsSnapshot | null;                                          // S3
  applicant: { name; phone; birth; petName };                                          // S4
  consents: { terms; privacy; uniqueId; hospital3p; insurer3p };                       // S5
  receiptNo: string | null;                                                            // S6
}
type ApplyAction =
  | { type: 'next' } | { type: 'prev' } | { type: 'goto'; step: Step } | { type: 'reset' }
  | { type: 'setTreatment'; patch: Partial<...> } | { type: 'setInsurance'; patch } | { type: 'setRequiredDocs'; docs }
  | { type: 'setApplicant'; patch } | { type: 'setConsents'; patch } | { type: 'setReceiptNo'; receiptNo };
```

- **필드 이름은 SSH-544의 `claims` 컬럼과 1:1로 맞춘다**(camelCase ↔ snake_case만 다르다) — S5 「신청하기」가
  이 상태를 그대로 `POST /api/claims` 본문으로 보낼 수 있게. 컬럼 목록은 위키 ⑤
- `next`는 5에서 멈춘다(6은 S5 제출 성공 시 `setReceiptNo` 뒤 `goto 6`으로만 간다). `prev`는 1에서 멈춘다.
  `goto`는 **현재보다 앞 단계로만** 허용 — 프로그레스 클릭으로 뒤로 돌아가는 건 되고 앞으로 건너뛰는 건 안 된다
- 요약 레일은 `useApply()`로 이 상태를 읽어 채운다. 빈 문자열·null은 `—`
- reducer는 순수 함수라 **`node:test`로 테스트한다** (`src/apply/state.test.ts`, `node --test`로 실행 —
  Node 26이라 TS를 그대로 돌린다. `server/gemini.test.ts`와 같은 방식). 경계(1에서 prev, 5에서 next, goto 앞으로 금지)와
  patch 병합을 본다
- **세션 저장은 하지 않는다.** 새로고침하면 1단계로 돌아간다. 개인정보(S4)를 `sessionStorage`에 두는 건
  처리방침에 없는 저장이고, S1~S3은 저장 없는 이탈 구간이다(위키 ②). 뒤 티켓이 필요해지면 그때 연다

### 6. 스타일 — `src/styles/apply.css`

`index.css`는 **건드리지 않는다.** `ApplyPage.tsx`가 `apply.css`를 import한다.
토큰·`.wrap`·`.btn`·`.btn-primary`·`.field`·`.field-block`·`.beta-badge`는 그대로 쓰고, 셸 전용 클래스는
`apply-` 접두사로 만든다(`.apply-container`·`.apply-progress`·`.apply-body`·`.apply-rail`·`.apply-actions`).

#### 레이아웃 — Figma 반응형 데모(`1640-1327`)의 규칙 그대로

| 뷰포트 | 컨테이너 | 본문 |
| --- | --- | --- |
| ≥ 1104 | `max-width: 1040px`, 좌우 여백 최소 32 | 2열 — 메인 680 · 간격 32 · 레일 328 |
| ≤ 1024 | 같은 컨테이너, 메인이 줄어든다 | 2열 — 메인 `minmax(0, 1fr)` · 레일 328 고정 |
| ≤ 768 | 같음 | **1열** — 레일이 메인 아래로. 순서: 메인 → 액션 행 → 요약 카드 → 진행 안내 카드 → 푸터 |
| ≤ 480 | 좌우 여백 18 | 1열 + **프로그레스 압축**: 원 22px, 현재 단계 라벨만 표시, 나머지 라벨 숨김(모바일 시안 `1544-658`) |

- 세로가 길면(1440×1400 데모) **콘텐츠는 위에 붙고 푸터만 바닥**으로 — `min-height: 100dvh` + flex column,
  푸터 `margin-top: auto`
- 스텝 연결선은 `flex: 1`로 남는 폭을 나눠 가진다 (Figma에서 1440은 132, 1024는 112, 768은 48)

#### 모바일 시안과의 차이 — 1차 리뷰에서 확인할 것

모바일 시안(`1564-1330`, 390px)은 Nav 대신 **자체 헤더**(브랜드 + BETA + 「문의 · 인스타 DM」)를 쓰고
페이지 헤더(「대리청구 신청」)가 없다. 이 티켓은 **≤480에서도 기존 Nav + 페이지 헤더를 유지**한다 —
기존 `index.css`가 640 이하에서 Nav 링크·CTA를 이미 숨겨 브랜드만 남으므로 모바일 시안의 헤더와
거의 같은 모양이 되고, 페이지 헤더는 Figma 반응형 데모(768)까지 살아 있다. 390 전용 헤더를 따로 만드는
건 컴포넌트 하나를 더 두는 일이라 **일단 안 한다.** 시안대로 가야 한다면 1차 리뷰에서 말해 달라.

### 7. 파일 목록

```
vercel.json                                 신규
public/sitemap.xml                          /apply 추가
src/App.tsx                                 pathname 분기
src/main.tsx                                observeSections를 랜딩일 때만
src/components/Nav.tsx                      variant prop (apply: 절대 경로 링크 + CTA 라벨/href)
src/styles/apply.css                        신규
src/apply/ApplyPage.tsx                     신규 — 셸 조립
src/apply/ApplyContext.tsx                  신규 — Provider · useApply
src/apply/state.ts                          신규 — reducer · 타입 · 초기값
src/apply/state.test.ts                     신규 — node:test
src/apply/steps.ts                          신규 — STEPS 상수
src/apply/useApplyMeta.ts                   신규 — 런타임 title/canonical/OG
src/apply/ApplyHeader.tsx                   신규
src/apply/ApplyProgress.tsx                 신규
src/apply/StepHeading.tsx                   신규
src/apply/ApplyRail.tsx                     신규 — SummaryCard + HelpCard
src/apply/ApplyActions.tsx                  신규
src/apply/ApplyFooter.tsx                   신규
src/apply/steps/StepPlaceholder.tsx         신규 — 빈 패널 (뒤 티켓이 교체)
docs/spec/SSH-542/{spec,tasks}.md           이 문서
```

`components/icons.tsx`에 체크 아이콘이 이미 있으면 재사용하고, 없으면 `check`를 추가한다(프로그레스 완료 표시·
진행 안내 카드에 필요).

## 범위 밖 — 형제 티켓이 한다

| 안 하는 것 | 어디서 |
| --- | --- |
| S1·S2 본문(업로드 카드·폼·보험사 그리드), Gemini 프롬프트 확장 | SSH-543 |
| S3 필요 서류 룩업·로딩·실패 상태 | SSH-473 |
| S4~S6 폼·동의·전송·접수 완료 | SSH-486 |
| `POST /api/claims`·`claims` 테이블 | SSH-544 |
| 랜딩 CTA 「무료로 청구 맡기기」 통일, 체험 모달·OTP·사전 알림 제거, `apply_*` 트래킹 5개 | SSH-545 |
| `/apply` 전용 OG 프리렌더 | 미정 — 위 3절 |

**랜딩은 한 줄도 바뀌지 않는다.** `Nav`에 prop이 하나 생기지만 기본값이 지금 동작이다.

## 검증

- [ ] `npm run build` 통과 (`tsc -b` 포함) · `npm run lint`
- [ ] `node --test src/apply/state.test.ts` 초록
- [ ] `npm run dev`에서 `/apply?r=test` 진입 → 5단계 「다음/이전」 왕복, `n / 5` 카운트, 프로그레스 상태 변화
- [ ] 랜딩 `/`는 이전과 동일 (모달·섹션 트래킹 포함)
- [ ] Vercel 프리뷰에서 `/apply?r=test` **새로고침** → 404 없음
- [ ] 프리뷰에서 `/sitemap.xml`·`/robots.txt`·`/og.png`·검색엔진 소유확인 HTML이 rewrite에 안 먹히고 원본으로 열림
- [ ] 프리뷰에서 `/api/claim-documents?claimType=...`가 여전히 JSON을 돌려줌 (rewrite가 `api/`를 비껴감)
- [ ] 1440 · 1024 · 768 · 390 폭 스크린샷 — 768에서 레일이 아래로, 390에서 프로그레스 압축
- [ ] 개발자 도구에서 `/apply`의 `document.title`·canonical이 바뀌어 있음

## 남는 결정 — 1차 리뷰에서

1. **≤480 헤더** — 위 6절. 기존 Nav 유지 vs 모바일 시안의 전용 헤더
2. **`/apply` OG 미리보기** — 런타임 메타로 두고 프리렌더는 안 한다. 카톡 공유 미리보기가 랜딩 것으로 보여도
   되는지
3. **Nav CTA가 `/apply`에서 자기 자신을 가리키는 것** — Figma대로 두되, 눌러도 아무 일 없다. 숨길지
