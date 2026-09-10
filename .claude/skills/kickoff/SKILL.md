---
name: kickoff
description: Jira 티켓 하나를 받아 브랜치를 만들고, 위키를 읽어 docs/spec/SSH-N/{spec,tasks}.md를 쓰고, Draft PR을 연 뒤 1차 리뷰를 기다리며 멈춘다. PR이 이미 있으면 tasks.md의 끊긴 자리부터 잇는다. "SSH-NNN 시작", "티켓 시작해줘", "spec 써줘", "작업 계획 잡아줘" 요청 시 사용.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Skill
  - AskUserQuestion
  - mcp__atlassian__getJiraIssue
  - mcp__atlassian__searchJiraIssuesUsingJql
---

# 티켓 시작 (kickoff)

루트 `CLAUDE.md` 「작업 흐름」 1~4단계를 한다. **Draft PR을 만들면 멈춘다** — 1차 리뷰(작업 계획)는 사람이 본다.

```
티켓 확인 → 브랜치 → 위키·Figma·형제 티켓 읽기 → spec.md · tasks.md → 커밋 → Draft PR → ⏸
```

## 0. 선행 조건 — 하나라도 안 맞으면 멈춘다

- 티켓 키(`SSH-<번호>`)가 있다. 없으면 묻는다 — 티켓 없이 브랜치를 만들지 않는다(규칙 CI가 막는다)
- `CLAUDE.local.md`에 위키 로컬 경로가 있다. 없으면 `ASMSSH/llm-wiki`를 클론하고 경로를 적어 둔 뒤 진행한다
- 작업 트리가 깨끗하다 (`git status --short`가 비어 있다). 아니면 먼저 정리한다

## 1. 어디까지 왔는지 본다 — 기억이 아니라 GitHub과 tasks.md로

```bash
git fetch origin
gh pr list --state all --head "<type>/SSH-<번호>" --json number,state,isDraft,url
ls docs/spec/SSH-<번호>/ 2>/dev/null
```

| 상황 | 시작점 |
| --- | --- |
| PR 없음 · spec 없음 | 2절부터 |
| spec은 있는데 PR 없음 | 4절(커밋·Draft PR)부터 |
| Draft PR 있음 | **이 스킬의 일은 끝났다.** `tasks.md`의 체크가 끊긴 자리를 보고하고, 구현은 그 자리부터 잇는다 |
| PR이 `CLOSED` | **중단.** 계획이 뒤집힌 신호다. 사람에게 묻는다 |
| PR이 `MERGED` | 끝났다. 보고하고 멈춘다 |

## 2. 티켓·위키 읽기 — 파일을 하나도 만들기 전에

1. `mcp__atlassian__getJiraIssue`로 티켓 본문·에픽·라벨을 읽는다. **형제 티켓**(같은 에픽·같은 라벨)도 `searchJiraIssuesUsingJql`로 훑는다 — 범위 경계를 이들과 맞춘다
2. 위키를 최신화하고 읽는다 — `cd <위키 경로> && git pull`. 기획·설계 문서 중 이 기능에 해당하는 것
3. Figma 노드가 티켓·위키에 있으면 확인한다. **파일 키·노드 ID는 `CLAUDE.local.md`에만 둔다** — spec에는 "Figma 데스크톱 시안"처럼 이름으로만
4. 지금 레포 상태를 본다 — 이 티켓이 딛고 설 코드가 무엇인지(`src/` 구조, 재사용할 컴포넌트·스타일·유틸)

**티켓이 충실해 보여도 위키를 생략하지 않는다.** 티켓은 위키의 요약이지 정본이 아니다.

### 나눌 신호가 보이면 여기서 멈춘다 ⏸

완료 기준을 "그리고" 없이 한 문장으로 못 쓰거나, 제목에 "및"·"전체"가 들어가거나, 여러 곳이 쓸 토대를 이 작업에서
처음 만든다면 — **티켓을 쪼개자고 사람에게 제안하고 멈춘다.** 지금이 가장 싼 시점이다(루트 `CLAUDE.md` 「큰 작업은 나눈다」).

## 3. 브랜치 · 문서

```bash
git switch -c <type>/SSH-<번호> origin/dev
mkdir -p docs/spec/SSH-<번호>
```

type은 티켓 성격으로 — 기능 `feat`, 버그 `fix`, 설정·CI `chore`, 문서 `docs`.

### `spec.md` — 본보기 `docs/spec/SSH-542/spec.md`

```markdown
# SSH-<번호> — <제목>

<한 문단: 무엇을 만드는지, 무엇은 비워 두는지>

> **이 PR이 남기는 것 한 문장**: <완료 기준. 사람이 프리뷰에서 확인할 수 있는 문장으로>

## 배경
- **위키** <문서 경로> (갱신일) — 참고한 절
- **Figma** <시안 이름> — 어떤 규칙이 거기 있는지
- **Jira** 형제 티켓 — 범위 경계
### 왜 A가 아니라 B인가       ← 결정이 있으면
### 지금 레포 상태           ← 딛고 설 코드, 없는 것, 재사용할 것

## 범위
### 1. … ### N.              ← 절 번호를 tasks.md와 맞춘다. 마지막 절은 「파일 목록」

## 범위 밖 — 형제 티켓이 한다
| 안 하는 것 | 어디서 |

## 검증
- [ ] npm run build · lint · test
- [ ] 로컬 동선
- [ ] Vercel 프리뷰 (새로고침 포함)
- [ ] 1440 · 768 · 390 스크린샷      ← UI 변경이면
```

**spec은 구현자가 다시 묻지 않아도 되게 쓴다.** "적절히", "필요시"가 남아 있으면 1차 리뷰에서 P1이다.
**시크릿·Figma 키·실제 데이터소스 ID를 넣지 않는다** — 저장소가 public이다.

### `tasks.md` — 본보기 `docs/spec/SSH-542/tasks.md`

```markdown
# SSH-<번호> — 작업 목록 (<제목>)

`spec.md`를 커밋 단위로 쪼갠 것. 번호는 spec의 절과 맞췄다. 안쪽(상태)에서 바깥(화면·연결)으로 쌓는다.

## 0. 문서 — 브랜치 `<type>/SSH-<번호>` (base: `dev`)
- [ ] spec.md · tasks.md
- [ ] **커밋** `docs: SSH-<번호> spec·tasks 작성`
- [ ] **Draft PR 생성 후 멈춘다** — `<PR 제목>(SSH-<번호>)`, base `dev`

## 1. <spec 1절>
- [ ] <파일> — <한 줄>
- [ ] **커밋** `feat: …`             ← 커밋 메시지를 여기서 정한다. 100자 이내

## N. 검증 — spec 「검증」
## N+1. 마무리
- [ ] PR 본문 갱신(`/pr`) → `/pr-review` 별도 서브에이전트 → P1·P2 반영
- [ ] Ready 전환 · Jira 검토 중 이동은 사람이 한다 — 남았다고 보고

## 하지 않는 것
```

**체크박스가 재개 지점이다.** 새 세션은 여기서 끊긴 자리부터 잇는다. 커밋 순서는 `commit` 스킬 4절의 축을 따른다.

## 4. 커밋 · Draft PR

```bash
git add docs/spec/SSH-<번호>/spec.md docs/spec/SSH-<번호>/tasks.md
git commit -m "docs: SSH-<번호> spec·tasks 작성"
git push -u origin <type>/SSH-<번호>
```

그다음 `/pr`을 부른다 — 열린 PR이 없고 변경이 문서뿐이면 `pr` 스킬이 **Draft**로 만든다.
본문의 `📍 PR Point`에 **1차 리뷰에서 봐줬으면 하는 결정**을 번호로 적는다.

`tasks.md`의 「Draft PR 생성」을 체크하고 `docs: SSH-<번호> tasks에 Draft PR 생성 체크`로 커밋·푸시한다.

## 5. 정지선 ⏸

**여기서 멈춘다.** 이어서 구현하지 않는다. 다 만들고 방향이 틀렸다고 하면 되돌리는 비용이 크다.

## 6. 보고

```
SSH-<번호> 시작 · <type>/SSH-<번호> · Draft PR #<n> → <URL>
1차 리뷰 대기 중. 확인해 주실 결정:
  1. …
  2. …
리뷰 뒤 tasks.md 1절부터 같은 브랜치에서 잇습니다.
```

## 하드 룰

- Draft PR을 만든 뒤 구현으로 넘어가지 않는다
- 티켓 키 없는 브랜치를 만들지 않는다
- spec에 시크릿·Figma 키를 넣지 않는다
- `gh pr ready`·Jira 상태 이동·머지는 하지 않는다
