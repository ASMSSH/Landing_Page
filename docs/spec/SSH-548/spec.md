# SSH-548 — `/apply` 「이전 / 다음」 액션 행을 화면 안에 두기

대리청구 웹 창구 `/apply`에서 **「← 이전 / 다음 →」 액션 행이 어느 단계·상태에서도 첫 화면 안에 보이게** 한다. 지금은 각
단계 컴포넌트가 본문 마지막에 `<ApplyActions />`를 흐름으로 렌더해서, 본문이 길면(S1 폼, S3 서류 목록) 버튼이 폴드 아래로
내려가고, 단계를 넘어가도 스크롤이 이전 단계 자리에 남아 첫 화면이 단계 헤딩이 아니라 액션 행·요약 카드다.
**768 초과(데스크톱·2열)는 본문 아래 흐름을 유지하되 본문이 뷰포트를 넘칠 때만 메인 열 안에서 아래에 붙고(sticky),
768 이하(1열)는 화면 아래 고정 바로**, 단계가 바뀌면 스크롤을 맨 위로 돌린다. CSS와 `ApplyShell`의 효과 하나로 끝내고 단계
컴포넌트·reducer는 손대지 않는다.

> **이 PR이 남기는 것 한 문장**: 1440·768·390에서 S1~S5 어느 단계·상태에서도 「이전 / 다음」이 첫 화면 안에 있고
> (1440은 넘칠 때 열 안에 붙고, 768·390은 고정 바), 「다음」을 누른 뒤 첫 화면이 그 단계의 헤딩이며, 본문 마지막 칸·레일·푸터가
> 버튼에 가리지 않는다.

## 배경

- **Jira** SSH-548 본문 — 원인(액션 행이 본문 흐름 안 마지막 요소)·후보 (a) sticky / (b) fixed. 티켓은 "뷰포트 아래 고정"으로
  썼지만 2026-09-12 설계 재검토로 **하이브리드**로 바꿨다(아래 「왜」). 형제 티켓: SSH-542(셸·레이아웃 표), SSH-543·473·486
  (각 단계가 `<ApplyActions />`를 자기 아래에 렌더 — 이 구조는 유지), SSH-547(뒤로가기 — popstate로 단계가 바뀌어도
  같은 스크롤 복귀를 탄다), SSH-545(트래킹 — 이벤트 추가 없음)
- **위키** `wiki/기획/대리청구-웹-창구-설계.md` (2026-09-09 갱신) — ④ 화면 명세의 단계별 CTA 표. 버튼 위치 규칙은 위키에 없다
- **SSH-542 spec** 4절(액션 행: 좌 `n / 5` · 우 「← 이전」 + 주 버튼) · 6절 레이아웃 표(≤768 1열, 순서 메인 → 액션 행 → 요약 카드 → 진행 카드 → 푸터)
- **Figma** 데스크톱 섹션 — 액션 행은 메인 열(680) 마지막에 흐름으로(변경 없음). 모바일 섹션 — `Actions Bar`(옛 `Foot`, 위 보더 +
  반투명 크림 82% + 블러 12)가 프레임 맨 아래. 반응형 데모 섹션에 `Demo / S1 @ 1440 × 900`(본문이 넘칠 때 열 안에 붙은 모습,
  보더 없이 배경+블러만) · `Demo / S1 @ 390 × 844`(고정 바) 2장을 이 티켓에서 추가했다

### 지금 레포 상태 (2026-09-12 실측, dev 프리뷰, 스크롤 0 기준 액션 행 top)

| 뷰포트 | S1 | S2 | S3 | S4 |
| --- | --- | --- | --- | --- |
| 1440×900 | 884 — 버튼 아래 16px 잘림 | 728 | 889 — 잘림 | 724 |
| 768×1024 | 1119 — 폴드 아래 | — | — | — |
| 390×844 | 1242 — 폴드 아래 | 스크롤 뒤에야 보임 | 1043 | 953 |

- 390에서 S1 맨 아래 「다음」을 누르면 S2가 scrollY≈770인 채로 그려진다 — 첫 화면이 「2/5 · ← 이전 · 필요 서류 확인」 + 요약 카드.
  코드에 `window.scrollTo`는 `ConsentDialog`(모달 본문 안)뿐이다
- `src/styles/apply.css` — `.apply-body { grid; align-items:start }` · `.apply-main { flex column; gap:20px }` · `.apply-actions`는
  `.apply-main`의 **마지막 자식**(각 단계 컴포넌트가 마지막에 렌더). ≤768에서 `.apply-rail { order:2 }`로 레일이 메인 아래로
- z-index: Nav 50(sticky top, `rgba(255,246,234,.82)` + `backdrop-filter: blur(12px)`) · `.apply-toast` 50(`bottom:24px`) ·
  `.apply-dialog-backdrop` 60
- `src/apply/ApplyPage.tsx` `ApplyShell` — `state.step`을 이미 읽고 있다. 스크롤 복귀 효과는 여기에 둔다
- S6(`StepDone`)는 `ApplyActions`를 렌더하지 않는다 — 바가 없으니 아래 여백도 없어야 한다

### 왜 전 폭 fixed 바(티켓의 (b))가 아니라 하이브리드인가

2026-09-12 Figma에 데스크톱 전 폭 fixed 바를 그려 보고 철회했다. 레퍼런스를 다시 본 결과:
- Stripe·Shopify 체크아웃, GOV.UK 서식, Material 스테퍼, 정부24 — 데스크톱 웹 폼은 **본문 아래 흐름**이 기본이다. 사용자는 마지막
  칸을 채운 시선 바로 아래에서 버튼을 찾지, 화면 특정 좌표에서 찾지 않는다
- 전 폭 fixed 바는 Airbnb 호스트 등록·Typeform처럼 **Nav·레일·푸터가 없는 풀스크린 플로우**의 패턴이다. `/apply`는 일반 웹 페이지라
  바가 독·쿠키 배너처럼 떠 보이고, 버튼이 폼 열이 아니라 레일 열 아래에 놓여 폼과 끊어진다
- 모바일은 반대다 — 고정 CTA가 표준이고(Baymard: 모바일 체크아웃 고정 CTA 5~12% 전환 상승) 모바일 Figma도 처음부터 그렇게 그려져 있었다
- 상단 오른쪽(편집 화면의 「저장」 패턴)은 검토했으나 단계형 신청에는 맞지 않는다 — 행동이 내용 앞에 오고, 검증 오류는 아래 칸에 뜬다

그래서 **데스크톱 = 흐름 + 넘칠 때만 열 안 sticky**, **768 이하 = fixed 바**. 실측의 두 불편(폴드 아래·스크롤 잔류)을 정확히 겨눈다.

### 왜 sticky 상태 감지(JS)를 넣지 않는가

붙었을 때만 위 보더를 그리려면 IntersectionObserver로 `is-stuck` 클래스를 토글해야 한다. 티켓이 "CSS로"를 요구했고, 배경(82% 크림 +
블러)만으로도 본문 위를 지날 때 층이 읽힌다. 흐름 자리에서는 배경이 크림 위 크림이라 보이지 않는다. **보더 없이 배경+블러만.**
Figma 1440×900 데모도 그렇게 맞췄다.

## 범위

### 1. 데스크톱(769 이상) — `.apply-actions` 열 안 sticky, `src/styles/apply.css`

```css
.apply-actions {
  position: sticky; bottom: 0; z-index: 10;              /* 카드(0)·토스트(50) 사이 */
  padding: 8px 0 12px;                                   /* Figma 행 57 = 8 + 49. 아래 12는 붙었을 때 배경이 버튼 아래까지 덮게 */
  background: color-mix(in srgb, var(--bg-app) 82%, transparent);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
}
```

- `.apply-main`(flex column)의 마지막 자식이므로 containing block이 `.apply-main`이다. 본문이 뷰포트를 넘치면 뷰포트 바닥에 붙고,
  `.apply-main` 끝이 올라오면 제자리에 앉는다. 짧은 단계(S2·S4·S5)는 지금과 같은 흐름 위치
- 색·간격은 토큰(`--bg-app`)만 쓴다. Nav의 `rgba(255,246,234,.82)`와 같은 값이다
- 769~1024(2열, 메인 축소)도 같은 규칙. 1열(≤768)은 2절이 덮어쓴다

### 2. 768 이하 — `.apply-actions` 고정 바, `src/styles/apply.css`

```css
@media (max-width:768px) {
  :root { --apply-bar-h: 72px; }                         /* 10 + 48(주 버튼) + 10 + 안전 여백 */
  .apply-actions {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;   /* 토스트 50 · 다이얼로그 60 아래 */
    padding: 10px 32px calc(10px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--border);                 /* 배경·블러는 1절 규칙이 그대로 남는다 */
  }
  .apply-page:has(.apply-actions) .apply-foot { padding-bottom: calc(var(--apply-bar-h) + 16px); }   /* 페이지 끝은 푸터라 여기만 올리면 된다 */
  .apply-page:has(.apply-actions) .apply-toast { bottom: calc(var(--apply-bar-h) + 16px); }
  html:has(.apply-actions) { scroll-padding-bottom: var(--apply-bar-h); }
}
@media (max-width:480px) {
  :root { --apply-bar-h: 66px; }                         /* 주 버튼 12/20 → 44 */
  .apply-actions { padding-left: 18px; padding-right: 18px; }
}
```

- 좌우 패딩은 컨테이너와 같다(768: 32, ≤480: 18) — 바 안 요소가 본문 가장자리와 정렬된다. 마크업 변경 없음
- `:has(.apply-actions)`로 **바가 있을 때만** 아래 여백·토스트 이동을 건다. S6는 액션 행이 없으니 그대로다
- 레일(요약 카드·진행 카드)은 메인 아래로 내려오므로 바가 그 위를 지난다 — 반투명+블러라 겹쳐도 읽히고, 끝까지 내리면 여백 덕에 다 보인다
- `env(safe-area-inset-bottom)`은 `viewport-fit=cover`가 없는 지금 메타에서는 0이다 — iOS Safari가 홈 인디케이터 위에 페이지를
  두므로 문제없다. 메타는 바꾸지 않는다(랜딩에도 영향)
- 기존 `≤480 .apply-actions { flex-wrap:wrap }`·`.apply-actions-btns { margin-left:auto }`는 그대로 둔다
- 모바일 키보드: Android Chrome은 뷰포트가 줄어 바가 키보드 바로 위에 붙고, iOS는 레이아웃 뷰포트가 안 줄어 바가 키보드 뒤로 간다.
  `scroll-padding-bottom`이 포커스 칸을 바 위로 올린다. 실기기 확인은 검증 항목에 남긴다

### 3. 단계 전환 시 스크롤 맨 위로 — `src/apply/ApplyPage.tsx`

```tsx
useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [state.step]);
```

- `ApplyShell`에 효과 하나. 「다음」·「← 이전」·프로그레스 클릭·브라우저 뒤로가기(SSH-547 popstate → `goto`) 전부 `state.step`이
  바뀌므로 한 곳에서 잡힌다. 검증 실패로 단계가 안 바뀌면 스크롤도 안 움직인다(오류 칸이 보이는 자리 유지)
- 티켓 범위 밖이었지만 2026-09-12 사용자 결정으로 포함 — 바가 생기면 사용자가 스크롤 없이 「다음」을 누르므로 이전 단계의 스크롤
  위치가 그대로 남는 문제가 더 자주 보인다

### 4. 파일 목록

| 파일 | 왜 |
| --- | --- |
| `src/styles/apply.css` | 1·2절 — `.apply-actions` sticky/fixed, 바 있을 때 아래 여백·토스트 위치 |
| `src/apply/ApplyPage.tsx` | 3절 — 단계 전환 스크롤 복귀 |
| `docs/spec/SSH-548/*` | spec·tasks·스크린샷 |

`ApplyActions.tsx`·단계 컴포넌트·reducer·테스트는 바뀌지 않는다.

## 범위 밖 — 형제 티켓이 한다

| 안 하는 것 | 어디서 |
| --- | --- |
| 데스크톱 전 폭 fixed 바 | 안 한다 — 위 「왜」 |
| sticky 붙음 상태 보더(JS 감지) | 안 한다 — 위 「왜」. 필요해지면 별도 티켓 |
| 검증 실패 시 첫 오류 칸으로 스크롤 | 안 한다 — 단계 티켓(SSH-543·486) 동작 그대로 |
| `viewport-fit=cover` 메타 | 안 한다 — 랜딩 포함 전체 영향 |
| 액션 행 트래킹 | SSH-545 |

## 검증

2026-09-12 로컬(`npm run dev`, headless Chromium)에서 확인. S6는 `/api/claims`를 페이지 안에서 mock해(실제 접수·슬랙 알림 없이) 갔다.
수치는 스크롤 0 기준 액션 행 top/bottom(px).

- [x] `npm run build` · `npm run lint`(경고 2건은 기존 것) · `npm test` 93건
- [x] 1440×900: S1 첫 화면에서 행이 832~900에 붙음(sticky) → 끝까지 내리면 폼 아래 제자리(행 bottom = 메인 bottom 776) ·
      S2 745 · S4 724 · S5 795는 흐름 위치 · S3 붙음(832)
- [x] 1440: S1 빈 채로 「다음」 → 오류 3건이 생겨도 행 832~900 그대로 · OCR 배너 상태는 실제 사진 없이 미확인(레이아웃상 S1과 같은 흐름)
- [x] 768×1024: 고정 바 955~1024(69px) · 390×844: 779~844(65px) — S1~S5 전부 첫 화면 안. 끝까지 내리면 푸터 bottom = 뷰포트 bottom(844),
      바 위로 푸터 텍스트가 보임(푸터 padding-bottom 82px) · S6는 `.apply-actions` 없음, 푸터 padding 28px로 복귀, 토스트 bottom 16px로 복귀
- [x] 390·768·1440: 「다음」으로 S1→S2, S2→S3, S3→S4, S4→S5 뒤 scrollY 0 · S6에서 브라우저 뒤로가기 뒤에도 0
- [x] 390: 토스트 computed bottom 82px(바 65 + 16, 바 위) · 동의 전문 시트 backdrop z 60이 바(z 40) 위를 덮음. 1440은 바 z 10
- [x] S5 전송 실패 상태에서 바 안 「← 이전」·「신청하기」 그대로 · 전송 중 비활성은 SSH-486 코드 그대로(이번 변경 없음)
- [x] 콘솔 에러 없음
- [x] Vercel 프리뷰(새로고침 포함): 390 고정 바 779~844 · S1→S2 뒤 scrollY 0 · 새로고침 뒤 1단계 정상 · 1440 sticky 832~900 · 콘솔 에러 없음
- [x] 스크린샷 S1 첫 화면 `apply-actions-1440.png` · `apply-actions-768.png` · `apply-actions-390.png`
- [ ] 모바일 실기기(iOS Safari·Android Chrome) 키보드 올라올 때 바·포커스 칸 — **미확인**(실기기 없음)

참고: `html { scroll-behavior: smooth }`(index.css)라 검증 스크립트의 `scrollTo`는 `behavior: 'instant'`로 쟀다. 단계 전환 효과도 `instant`다.

## 1차 리뷰 결정 (2026-09-12)

사용자가 Figma 확정 뒤 Draft와 구현을 한 번에 요청해 1차 리뷰를 건너뛰었다. 설계 결정은 Figma 확정 과정에서 사용자가 내렸다.

1. 하이브리드 — 데스크톱 흐름 + 열 안 sticky, 768 이하 fixed 바 (전 폭 fixed 바 철회)
2. 단계 전환 시 `scrollTo(0,0)` 포함
3. 데스크톱 정렬은 메인 열 680(원래 Figma)
4. sticky 붙음 감지 JS 없음 — 배경+블러만 (구현자 결정)
