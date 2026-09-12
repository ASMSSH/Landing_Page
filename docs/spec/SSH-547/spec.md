# SSH-547 — `/apply` 브라우저 뒤로가기를 단계 되돌리기로

대리청구 웹 창구 `/apply`에서 **브라우저 뒤로가기(모바일 스와이프 백 포함)가 이전 단계로 가게** 한다. 지금은 단계가
`useReducer` 상태에만 있어 `/apply`가 history 항목 하나뿐이고, 뒤로가기를 누르면 페이지가 통째로 랜딩으로 나가며 입력값이
전부 사라진다. 단계가 바뀔 때 `history.pushState`로 항목을 하나씩 쌓고 `popstate`에서 단계를 되돌린다. **URL은 `/apply?r=…`
그대로다** — 단계를 URL에 넣지 않는다는 SSH-542 결정을 유지한다. 함께, 접수 완료(S6)의 「처음으로」를 **「홈으로」(랜딩 `/`)**
로 바꾼다(2026-09-12 요청).

> **이 PR이 남기는 것 한 문장**: `/apply?r=test`에서 3단계까지 간 뒤 브라우저 뒤로가기를 누르면 2단계가 입력값 그대로
> 보이고, 1단계에서 뒤로가기는 랜딩으로 나가며, 접수 완료 뒤에는 뒤로가기든 「홈으로」든 랜딩으로 나가 「신청하기」를 다시
> 누를 수 없다.

## 배경

- **Jira** SSH-547 본문 — 원인 분석·범위·완료 기준이 거기 있다. 형제 티켓: SSH-542(셸, 단계는 URL이 아니라 상태),
  SSH-486(S6 종착 규칙), SSH-545(트래킹 — 여기서 이벤트를 추가하지 않는다), SSH-548(액션 행 고정 — 무관)
- **위키** `wiki/기획/대리청구-웹-창구-설계.md` (2026-09-09 갱신) — ② 유저 플로우(저장은 S5 한 번, S1~S3은 저장 없음),
  ⑪-① 진입 형태는 페이지 `/apply`(붙여넣을 URL 하나)
- **SSH-542 spec** 1절(라우터 없음, 단계는 `/apply` 안의 상태) · 5절(「6은 종착이다」)
- Figma 시안 없음 — 화면이 바뀌지 않는다. S6 버튼 라벨만 「처음으로」 → 「홈으로」

### 지금 레포 상태

- `src/apply/state.ts` — 순수 reducer. `next`(5에서 정지) · `prev`(1·6에서 정지) · `goto`(뒤로만, 6은 접수번호 있을 때만,
  6에서는 어디로도 못 감) · `reset`
- `src/apply/ApplyContext.tsx` — `ApplyProvider`가 `dispatch`를 감싸 `reset`이면 영수증 사진 object URL을 지우고 멱등 키
  `clientId`를 새로 만든다. **history 연동 훅은 여기서 부른다** — 상태와 감싼 dispatch가 둘 다 있는 유일한 자리다
- `src/apply/ApplyActions.tsx` 「← 이전」 → `prev` · `src/apply/ApplyProgress.tsx` 완료 단계 클릭 → `goto` ·
  `src/apply/steps/StepConsent.tsx` 제출 성공 → `goto 6` · `src/apply/steps/StepDone.tsx` 「처음으로」 → `reset`
- **`StepConsent`가 이미 history를 쓴다** — 동의 전문을 열 때 `pushState({ applyConsent })` 한 항목을 넣고 닫을 때
  `history.back()`. 닫혀 있을 때의 popstate는 무시한다("단계 단위 back은 SSH-547이 맡는다"고 주석에 적어 뒀다).
  이 항목에는 `applyStep`이 없다 — 아래 1절의 「`applyStep` 없는 항목은 무시」가 그 공존 규칙이다
- `submitting`(S5 전송 중)이면 「← 이전」·프로그레스가 잠긴다(SSH-486 리뷰 P2). 뒤로가기도 같은 규칙을 따라야 한다
- 테스트: 순수 함수는 `node:test`, `*.test.ts`는 `tsconfig.node.json`이 타입 검사한다(`src/**/*.test.ts` 이미 포함)

### 왜 「← 이전」을 `history.back()`으로 바꾸지 않는가 — 상태가 정본, history는 거울

두 길이 있다. (A) 뒤로 가는 UI(「← 이전」·프로그레스)를 전부 `history.back()`/`history.go()`로 바꾸고 popstate만이
단계를 바꾼다. (B) UI는 지금처럼 `dispatch`하고, 훅이 상태 변화를 보고 history를 따라 맞춘다.

**(B)로 한다.** 이유:
- history는 우리가 완전히 통제하지 못한다. 새로고침하면 상태는 1단계인데 history에는 3단계까지의 항목이 남고, 브라우저가
  `history.go()`를 조용히 무시하는 경우도 있다. (A)면 그때 「← 이전」이 죽는다. (B)면 버튼은 항상 동작하고 history만 어긋난
  채 다음 popstate에서 스스로 맞춘다(1절 규칙 ④)
- reducer가 순수 함수로 남고(티켓 요구) 테스트도 그대로다. UI 컴포넌트는 한 줄도 바뀌지 않는다
- 티켓의 "둘 다 같은 결과여야 한다"는 (B)에서도 성립한다 — 「← 이전」을 누르면 훅이 `history.go(-1)`로 항목을 하나 걷고,
  브라우저 뒤로가기를 누르면 popstate가 `goto`한다. 어느 쪽이든 끝 상태는 "단계 n-1 + history 항목 n-1"이다

### 왜 S6는 `replaceState`로 덮지 않고 "뒤로가기 = 나가기"인가

티켓이 준 선택지는 ⓐ S6 진입 시 `replaceState`로 S5 항목을 덮기, ⓑ popstate에서 S6이면 `reset` 후 1단계로.
ⓐ만으로는 부족하다 — S5 항목을 덮어도 S1~S4 항목이 남아 뒤로가기가 S4 항목에 서고, reducer는 6에서 못 나가니 화면은
S6인 채 history만 뒤로 밀린다. 사용자는 뒤로가기를 다섯 번 눌러야 나간다.

**ⓑ를 확장한다 — S6에서 popstate가 오면 `reset`하고 `history.go(-단계)`로 `/apply` 앞 항목(랜딩)까지 나간다.**
단계 k의 항목 앞에는 정확히 k-1개의 단계 항목이 있으므로(1절 항목 모델) 항목 e에서 `go(-e)`가 `/apply` 진입 직전으로
간다. 「홈으로」도 랜딩으로 가니 **S6에서 나가는 길 두 개가 같은 곳(랜딩)에 도착한다.** `reset`을 먼저 하는 이유는
bfcache나 새로고침으로 항목 수가 어긋나 페이지 안에 남는 경우에도 빈 1단계(새 멱등 키)여야 하기 때문이다.

## 범위

### 1. history 항목 모델 — `src/apply/stepHistory.ts` (순수 함수, React 의존 없음)

```
history.state = { applyStep: 1 | 2 | 3 | 4 | 5 | 6 }      URL은 손대지 않는다
항목:  [랜딩] [1] [2] [3] … [k]   ← 단계 k에 있으면 앞에 단계 1..k-1 항목이 하나씩 있다
```

| 언제 | history | 근거 |
| --- | --- | --- |
| `/apply` 마운트 | 지금 항목을 `replaceState({ applyStep: 1 })`로 덮는다 | 새로고침하면 상태는 1인데 항목엔 옛 단계가 남아 있다 |
| 단계가 오른다 (`next`, `goto 6`) | `pushState({ applyStep: n })` | 6도 똑같이 쌓는다 — 위 「S6」 절 |
| 단계가 내린다 (UI: `prev`·`goto`, `reset`) | `history.go(다음 - 지금)` — 항목을 걷는다. 도착 popstate는 같은 단계라 무시된다 | (B) 상태가 정본 |
| popstate 도착 항목 e | 아래 규칙 | |

popstate 규칙 — `resolvePopstate(e, 현재 단계, 잠금)`:

| # | 조건 | 한다 |
| --- | --- | --- |
| ① | `applyStep`이 없는 항목 (동의 전문 항목 등) | 무시 |
| ② | 잠금(`submitting`) 중 | `history.go(현재 - e)`로 되돌린다 — 「← 이전」·프로그레스 잠금과 같은 규칙. 전송 중 떠나면 접수는 되는데 접수번호를 못 본다 |
| ③ | e == 현재 | 무시 (UI가 걷은 항목에 도착한 것) |
| ④ | e > 현재 (앞으로가기, 또는 새로고침 뒤 남은 옛 항목) | `history.go(현재 - e)`로 되돌린다. **앞으로가기는 허용하지 않는다** — reducer가 앞 단계 goto를 막는 규칙 그대로 |
| ⑤ | e < 현재, 현재 ≠ 6 | `goto e` (prev 대신 goto — 두 항목을 한 번에 건너뛴 경우도 맞다) |
| ⑥ | e < 현재 == 6 | `reset` 후 `history.go(-e)` — 랜딩으로 나간다 |

훅은 "현재 항목이 가리키는 단계"를 ref 하나로 기억한다. popstate로 단계가 바뀌면 그 ref를 먼저 맞춰 두어 상태 변화 효과가
`pushState`/`go`를 또 하지 않는다. 순수 함수 둘 — `planStepChange(항목 단계, 다음 단계)` → `push | go(Δ) | 없음`,
`resolvePopstate(e, 현재, 잠금)` → `{ 항목 단계?, 액션?, go? }` — 를 `node:test`로 검증한다(위 표의 행마다 1건 이상).

### 2. 훅 — `src/apply/useStepHistory.ts`, `ApplyProvider`에서 호출

- `useStepHistory(step, dispatch, locked)` — 마운트 `replaceState`, popstate 리스너, `step` 변화 효과 세 개.
  `dispatch`는 Provider가 감싼 것(`reset`에서 사진·멱등 키를 같이 지우는)이어야 한다 — 규칙 ⑥ 때문
- `ApplyContext.tsx`에 훅 호출 한 줄 + 왜 여기냐는 주석. reducer·UI 컴포넌트는 손대지 않는다

### 3. S6 「처음으로」 → 「홈으로」 — `src/apply/steps/StepDone.tsx`

- `<button onClick={reset}>처음으로</button>` → `<a className="btn apply-btn-ghost" href="/">홈으로</a>`. 랜딩으로
  전체 이동(같은 문서 안 이동이 아니다 — 랜딩과 `/apply`는 `location.pathname` 분기이고 `<a>`로 오간다, SSH-542)
- 스타일은 `.apply-done-foot .btn`이 이미 `<a class="btn">`에도 먹는다(인스타 링크와 같은 방식). CSS 변경 없음
- `reset` 액션·Provider의 reset 처리는 지우지 않는다 — 규칙 ⑥이 계속 쓴다
- 트래킹은 넣지 않는다 — `/apply` 이벤트 5개는 SSH-545 몫

### 4. 파일 목록

| 파일 | 왜 |
| --- | --- |
| `src/apply/stepHistory.ts` (신규) | 항목 모델·popstate 규칙, 순수 함수 |
| `src/apply/stepHistory.test.ts` (신규) | 위 규칙 표 |
| `src/apply/useStepHistory.ts` (신규) | history API·popstate와 React를 잇는 훅 |
| `src/apply/ApplyContext.tsx` | 훅 호출 |
| `src/apply/steps/StepDone.tsx` | 「홈으로」 링크 |
| `src/apply/steps/StepConsent.tsx` | 주석 한 줄만 — "단계 단위 back은 SSH-547이 맡는다" → 실제 위치(`useStepHistory`)로 |

## 범위 밖 — 형제 티켓이 한다

| 안 하는 것 | 어디서 |
| --- | --- |
| 새로고침 뒤 입력값 복원 | 안 한다 — SSH-542 「세션 저장은 하지 않는다」. 새로고침은 1단계부터 |
| 앞으로가기로 다음 단계 복귀 | 안 한다 — 규칙 ④. 필요하면 별도 티켓(입력 검증을 건너뛰는 문제가 따라온다) |
| 뒤로가기·「홈으로」 트래킹 | SSH-545 |
| 「이전 / 다음」 액션 행 화면 아래 고정 | SSH-548 |
| 동의 전문 다이얼로그의 history 처리 | 이미 SSH-486에 있다. 손대지 않는다 |

## 검증

2026-09-12 로컬(`npm run dev`, headless Chromium)에서 확인. S6는 `/api/claims`를 페이지 안에서 mock해(실제 접수·슬랙 알림 없이) 갔다.

- [x] `npm run build` · `npm run lint`(경고 2건은 기존 것) · `npm test` 91건 (`stepHistory.test.ts` 9건 포함)
- [x] 로컬 `/apply?r=test`: 1→2→3 뒤 브라우저 back → 2단계, 입력값 유지 → back → 1단계(병원 이름 남아 있음) → back → 랜딩(`/`)
- [x] 「← 이전」으로 2→1 뒤 브라우저 back 한 번에 랜딩 (history가 상태를 따라왔다)
- [x] 프로그레스로 4→1 뒤 브라우저 back 한 번에 랜딩
- [x] 앞으로가기(forward)는 단계를 바꾸지 않는다 — 1단계에서 forward 뒤에도 1단계, `history.state`는 `{ applyStep: 1 }`로 되돌아온다
- [x] S5 동의 전문 열고 back → 전문만 닫힘, 5단계 그대로 (SSH-486 동작 유지, 전문 항목 `{ applyConsent }`는 무시됨)
- [x] S5 전송 중 back → 5단계로 되돌아오고 「전송 중…」 유지 (규칙 ②)
- [x] S6에서 back → 랜딩. S6 「홈으로」 → 랜딩(`/`). 랜딩에서 forward로 돌아오면 빈 1단계(접수번호·입력 없음)
- [x] 3단계에서 새로고침 → 1단계. back 첫 번째는 옛 항목이 규칙 ④로 걷혀 1단계 그대로, 두 번째에 랜딩
- [x] 콘솔 에러 없음
- [x] Vercel 프리뷰(번들 해시가 로컬 빌드와 동일)에서 3→2→1→랜딩 · S6 back → 랜딩 · forward → 빈 1단계 확인. 모바일 스와이프 백은 실기기 미확인
- [x] 스크린샷: UI 변경은 S6 버튼 라벨뿐 — `apply-done-1440.png` · `apply-done-768.png` · `apply-done-390.png`

## 1차 리뷰 결정 (2026-09-12)

사용자가 Draft와 구현을 한 번에 요청해 1차 리뷰를 건너뛰었다. 아래는 구현자가 정한 것이고 PR Point에 같은 번호로 적는다.

1. 「← 이전」은 `dispatch` 유지, 훅이 history를 따라 맞춘다(위 「상태가 정본」)
2. S6 뒤로가기 = `reset` + `history.go(-e)`로 랜딩. `replaceState`로 덮지 않는다
3. 앞으로가기는 되돌린다(허용 안 함)
4. 전송 중 뒤로가기는 되돌린다(「← 이전」 잠금과 같은 규칙)
5. 「홈으로」는 `<a href="/">`, 트래킹 없음
