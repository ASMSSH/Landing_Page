---
name: commit
description: 지금까지의 변경을 의미 단위로 잘게 쪼개 컨벤션에 맞는 커밋으로 만들고 푸시한다. AI 서명은 절대 넣지 않는다. "커밋해줘", "여기까지 커밋", "푸시해줘", "정리해서 올려줘" 요청 시 사용.
allowed-tools:
  - Bash
  - Read
  - Grep
---

# 커밋 (commit)

한 브랜치에서 **여러 번** 호출된다. 지금 작업 트리에 있는 변경만 다룬다.

## 1. 안전 확인

```bash
git branch --show-current && git status --short
```

- `dev`나 `main`이면 **즉시 중단**한다. 브랜치부터 만든다(`git switch -c <type>/SSH-<번호> origin/dev`).
- 변경이 없으면 그렇게 보고하고 끝낸다.

## 2. 검증

**변경한 영역의 검증 명령을 `Project/`에서 실행한다.** 명령은 루트 `CLAUDE.md` 「명령」에 있다.

| 변경 위치 | 검증 |
| --- | --- |
| `Project/` 코드 (`.md` 제외) | `cd Project && npx tsc -b && npm run lint && npm test` |
| 문서·`.github/`·`.claude/`만 | 생략 |

여기서 깨지면 커밋하지 말고 먼저 고친다. `vite build`는 여기서 돌리지 않는다 — CI가 한다.

커밋 전 훅(`.claude/hooks/verify-web.sh`)이 같은 검사를 한 번 더 하므로, 여기서 통과했으면 훅도 통과한다.

## 3. 변경 파악

```bash
git status --short && git diff --stat && git diff
```

새 파일은 `git diff`에 안 나온다. `git status`의 `??` 항목을 반드시 같이 본다.

## 4. 의미 단위로 쪼개기

**한 커밋 = 하나의 목적.** 파일 개수가 기준이 아니라 "이 변경을 한 문장으로 설명할 수 있는가"가 기준이다.

쪼개는 축 (안쪽에서 바깥으로 쌓인다 — `docs/spec/SSH-542/tasks.md`가 본보기):

| 순서 | 커밋 | 예시 |
| --- | --- | --- |
| 1 | 타입·상수·순수 로직 + **그 테스트** | `feat: /apply 단계 상태 reducer와 컨텍스트 추가` |
| 2 | 컴포넌트 | `feat: /apply 페이지 셸 컴포넌트 추가` |
| 3 | 스타일 | `style: /apply 셸 레이아웃과 반응형 스타일 추가` |
| 4 | 연결 (라우팅·메타·설정) | `feat: /apply 경로를 App에서 분기` |
| 5 | 서버리스·배포 설정 | `chore: /apply 새로고침용 Vercel SPA rewrite 추가` |

**테스트는 마지막 커밋이 아니다.** 순수 로직(reducer·유틸)은 테스트와 **같은 커밋**에 넣는다.
`test:` 타입은 **이미 있는 코드에 테스트를 뒤늦게 붙일 때** 쓴다.

**같은 커밋에 넣는 것**
- 컴포넌트와 그 컴포넌트만 쓰는 private 헬퍼
- 새 CSS 파일과 그것을 import하는 컴포넌트

**따로 빼는 것**
- 리팩터링·포맷 정리 → `refactor:` / `style:` 로 분리. 기능 커밋에 섞지 않는다
- 의존성 추가 → 그 의존성을 처음 쓰는 커밋과 함께(`package.json` + `package-lock.json`), 아니면 `chore:`
- 눈에 띄어서 고친 무관한 버그 → `fix:` 로 분리
- spec·tasks 갱신 → `docs:`. 구현 커밋과 섞지 않는다

## 5. 커밋

파일 경로를 명시해서 스테이징한다. `git add -A` / `git add .`는 쓰지 않는다 — 의도치 않은 파일이 섞인다.

```bash
git add <경로> <경로>
git commit -m "feat: 요약 레일에 진료비 표시"
```

- 제목 한 줄, 100자 이내, 한국어, `<type>: <subject>`
- type: `feat` `fix` `chore` `style` `refactor` `docs` `test`
- 커밋에 이슈 키를 붙이지 않는다
- 본문은 대개 불필요하다. **왜** 이렇게 했는지가 코드에서 안 보일 때만 한두 줄 덧붙인다
- **`Co-Authored-By`·`Claude-Session`을 포함한 어떤 AI 서명도 넣지 않는다.** CI가 막는다

한 파일 안의 변경이 두 목적으로 섞여 있으면 `git add -p`로 hunk 단위로 나눈다.

훅이 커밋을 막으면(deny) 이유가 같이 온다. 고치고 다시 커밋한다. 급하면 `SKIP_WEB_VERIFY=1`로 우회하되 **PR 본문에 왜 넘겼는지 적는다.**

## 6. 푸시

```bash
git push -u origin $(git branch --show-current)
```

## 7. 보고

한 줄이면 된다. 커밋 목록과 다음에 할 일만.

```
3개 커밋 · feat/SSH-543 푸시 완료
  feat: S1 진료 정보 폼 상태 추가
  feat: S1 영수증 업로드 카드
  style: S1 폼 반응형 보정
```

작업이 다 끝났으면 이어서 `/pr`을 실행한다.
