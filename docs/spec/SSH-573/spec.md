# SSH-573 — 메타 픽셀 설치

메타 광고 파일럿(SSH-570~572)의 성과 측정·최적화 장치인 **메타 픽셀**을 웹에 설치한다.
이벤트는 셋 — 전 페이지 `PageView`, `/apply` 진입 `StartApplication`, 청구신청 제출 성공 `SubmitApplication`.
서버 쪽 전환 API·도메인 인증은 하지 않는다(파일럿 판정에는 픽셀만으로 충분 — 아래 「범위 밖」).

> **이 PR이 남기는 것 한 문장**: 배포된 사이트에서 메타 이벤트 관리자 「이벤트 테스트」 탭에
> PageView(랜딩·/apply 각각) · StartApplication(/apply 진입) · SubmitApplication(제출 성공)이 잡힌다.

## 배경

- **Jira** SSH-570(광고 계획) · SSH-571(소재) · SSH-572(광고 세팅) — 이 티켓은 그중 웹 코드 작업만.
  광고는 100만원 파일럿이고 KPI가 청구신청 건수라, 픽셀이 없으면 캠페인 목표 "신청 완료 최적화"를
  선택할 수 없고 광고비 → 신청 건수 측정도 안 된다
- **메타 데이터 세트** ID `28502024599409299` — 이미 생성·광고 계정 연결 완료. 픽셀 ID는 페이지
  소스에 노출되는 공개값이라 코드에 그대로 넣는다(시크릿 아님)
- 이벤트를 완료 하나가 아니라 시작+완료 2개 심는 이유: 완료가 주 5건 미만으로 쌓이면 최적화
  기준을 한 단계 앞인 StartApplication으로 낮추는 플랜 B용. 시작만 많고 완료가 없으면 "광고가
  아니라 신청 폼 문제"라는 진단도 가능해진다

### 지금 레포 상태

- 트래킹은 `src/lib/analytics.ts`의 `track()` 하나로 Supabase `events` 테이블에 보낸다.
  `/apply` 퍼널은 `apply_step`(단계 진입마다) → `apply_submit` → `apply_done | apply_error`(SSH-545)
- 랜딩(`/`) → `/apply` 이동은 일반 `<a href>` **풀 페이지 로드**다(라우터 없음, `location.pathname` 분기).
  즉 페이지마다 `index.html`이 새로 로드되므로 **기본 픽셀만 있으면 PageView가 두 페이지 다 찍힌다** —
  SPA용 라우트 변경 감지가 필요 없다. `/apply` 안의 단계(S1~S6)는 상태이지 URL이 아니므로 PageView 대상이 아니다
- 제출 성공 확정 지점은 `StepConsent.tsx`의 `submitClaim().then()` — 여기서만 `track('apply_done')`이
  불린다. 완료 화면(S6)은 별도 URL이 없어 새로고침해도 재발사되지 않는다

### 왜 `track()`에 숨기지 않고 별도 헬퍼인가

「웹 스택 규칙」의 "트래킹은 `track()`만"은 **우리 events 테이블**로 가는 자체 트래킹 규칙이다.
메타 픽셀은 광고 어트리뷰션용 외부 채널이라 목적이 다르고, `track()` 내부에서 이벤트명을 매핑해
몰래 쏘면(`apply_done` → SubmitApplication) 자체 이벤트명 변경이 광고 최적화를 조용히 깨뜨린다.
호출 지점이 딱 2곳뿐이므로 **명시적으로 부르는 쪽**을 택한다. 픽셀 래퍼는 `src/lib/metaPixel.ts`
한 파일에 모으고, 컴포넌트가 `window.fbq`를 직접 만지지 않는다.

## 범위

### 1. 기본 픽셀 — `index.html` `<head>`

메타 공식 스니펫(fbevents.js 로더 + `fbq('init', '28502024599409299')` + `fbq('track', 'PageView')`)과
`<noscript>` 이미지 태그를 `<head>` 끝에 넣는다. 한 파일이 두 페이지(`/`·`/apply`)를 서빙하므로 이걸로
PageView 전 페이지 커버.

### 2. 픽셀 래퍼 — `src/lib/metaPixel.ts`

```ts
pixelStartApplication()   // fbq('trackCustom', 'StartApplication')
pixelSubmitApplication()  // fbq('track', 'SubmitApplication')  ← 메타 표준 이벤트명, 철자·대소문자 고정
```

- `window.fbq`가 없으면(스니펫 로드 실패·광고 차단기) 조용히 무시 — 신청 흐름을 절대 막지 않는다
- `window.fbq` 타입 선언은 이 파일 안에 둔다(`declare global`)

### 3. StartApplication — `/apply` 진입

`src/main.tsx`의 기존 `isApplyPath` 분기에서 호출한다. 페이지 로드당 정확히 1회 —
React 마운트(StrictMode 이중 실행)와 무관한 모듈 레벨이라 중복 발사가 없다.

### 4. SubmitApplication — 제출 성공

`StepConsent.tsx`의 `submitClaim().then()` 성공 콜백, `track('apply_done')` 옆에서 호출한다.
실패(`catch`)·재시도 클릭에서는 부르지 않는다 — 뻥튀기되면 메타 최적화가 엉뚱한 방향으로 간다.

### 5. 파일 목록

| 파일 | 변경 |
| --- | --- |
| `Project/index.html` | 기본 픽셀 스니펫 + noscript 추가 |
| `Project/src/lib/metaPixel.ts` | 신규 — fbq 래퍼 2개 + 타입 선언 |
| `Project/src/main.tsx` | `/apply` 분기에서 `pixelStartApplication()` |
| `Project/src/apply/steps/StepConsent.tsx` | 성공 콜백에서 `pixelSubmitApplication()` |
| `docs/spec/SSH-573/` | spec · tasks |

## 범위 밖 — 다른 티켓·단계가 한다

| 안 하는 것 | 어디서 |
| --- | --- |
| 전환 API(서버 → 메타, Supabase Edge Function) | 파일럿 증액 판정 후 별도 티켓 |
| 도메인 인증(boheomgaenyang.com) | 메타 비즈니스 설정에서 — 코드 무관(DNS TXT 권장) |
| 캠페인 세팅·소재 | SSH-571 · SSH-572 |
| 자체 트래킹(`analytics.ts`) 변경 | 변경 없음 — 픽셀은 별도 채널 |

## 검증

- [ ] `npm run build` · `npm run lint` · `npm test`
- [ ] 로컬 동선: Meta Pixel Helper 확장으로 `/` PageView → `/apply` PageView+StartApplication →
      제출 성공 시 SubmitApplication 확인 (실패 제출에서는 안 찍히는 것도)
- [ ] Vercel 프리뷰에서 같은 동선 반복 (새로고침 시 SubmitApplication 재발사 없는 것 포함)
- [ ] 배포 후: 메타 이벤트 관리자 → 이벤트 테스트 탭에서 3개 이벤트 확인 — **광고는 실서비스
      도메인으로 유입되므로 프리뷰 확인만으로는 완료가 아니다**
