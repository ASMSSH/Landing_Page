# SSH-546 — Landing_Page 작업 방식·규칙 CI 도입

Jira [SSH-546](https://somassh.atlassian.net/browse/SSH-546) · 에픽 E4 개발 환경·인프라(SSH-152) ·
완료 기준: **새 티켓을 `chore/SSH-N` 브랜치로 시작하면 spec → Draft PR → 구현 → `/pr-review`가 스킬로 돌고,
PR을 열면 규칙 검사·웹 CI가 자동으로 초록/빨강을 낸다.**

> **이 PR이 남기는 것 한 문장**: Boheomgaenyang에서 손으로 따라 하던 작업 방식이 `CLAUDE.md`·`.claude/`·
> `.github/`에 고정되고, 규칙 위반은 사람이 아니라 CI가 잡는다.

## 배경

- **원본** `ASMSSH/Boheomgaenyang` — 루트 `CLAUDE.md`, `.claude/skills/{commit,pr,pr-review}`,
  `.claude/agents/pr-reviewer.md`, `.claude/hooks/verify-server.sh`, `.github/workflows/rules-ci.yml`·`client-ci.yml`,
  `pull_request_template.md`, `CONTRIBUTING.md`, `CODEOWNERS`
- **첫 적용** SSH-542(PR #26, 2026-09-10 dev 머지) — 규칙 없이 손으로 따라 했다. `docs/spec/SSH-542/`가 spec·tasks 본보기
- **지금 레포 상태** — CI 없음. `.github/CONTRIBUTING.md`는 다른 프로젝트(iOS DeepDive) 문서가 그대로. `CLAUDE.md`·`.claude/` 없음.
  `main == dev`였다가 #26으로 `dev`가 앞섰다. 브랜치 보호 없음, 머지 방식 3종 허용. 저장소는 **public**
- **결정(2026-09-10, 사람)** — 브랜치 `<type>/SSH-N`(Jira 개발 패널 자동 연결, 기존 `feat/#542`는 그대로) ·
  PR 제목 스코프 없이 `작업 내용(SSH-N)` · PR 템플릿은 Boheomgaenyang 5섹션으로 교체

### 가져오지 않는 것

`client-feature*` 3단계 스킬 · `daily-scrum`·`sprint-backlog`·`design-token-sync`·`figma-design`·`api-conventions`·`client-api` 스킬 ·
`server-deploy`·`env-check` 워크플로 · `.claude/rules/*`(스택 규칙은 `CLAUDE.md` 한 절로) · `references/feature-layout.md`.
Flutter·Spring 전용이거나 이 레포 규모에 과하다.

## 범위

### 1. 루트 `CLAUDE.md` (200줄 이하) + `CLAUDE.local.md`(gitignore)

Boheomgaenyang 루트 CLAUDE.md를 단일 스택·`dev` base로 줄인다.

- 경로 표(`Project/` 웹 · `Project/api/` Vercel 서버리스 · `docs/spec/`) · **명령**(`Project/`에서 `npm run lint`·`build`·`test`·`dev`, CI와 동일)
- **절대 금지** 4 — AI 서명 · `dev`·`main` 직접 커밋 · 머지 · Draft→Ready·Jira 검토 중 전환
- **애매하면 묻는다** — 코드·문서를 읽으면 나오는 건 묻지 않는다
- **작업 흐름** 8단계 — Jira → 브랜치 → 위키 읽고 spec·tasks → Draft PR ⏸ 1차 → 구현 → `/pr-review`(별도 서브에이전트, P1·P2 반영,
  2회째 등록 전 사람 확인) → Ready·Jira(사람) ⏸ 2차 → Squash Merge(사람)
- **spec·tasks 골격** — spec: 배경(참고 위키·Figma 노드·형제 티켓) / 범위 / 범위 밖 / 검증 / N차 리뷰 결정. tasks: 0. 문서·Draft PR / 1..N 구현(커밋 메시지 명기) / 검증 / 마무리 / 하지 않는 것. 본보기 `docs/spec/SSH-542/`
- **브랜치·커밋·PR** — `<type>/SSH-N` base `dev` · `<type>: 제목` 50자 한국어, 이슈 키 없음 · PR 제목 `작업 내용(SSH-N)` · 한 PR 티켓 하나 ·
  UI 변경 PR은 **1440·768·390 스크린샷 3장** + Vercel 프리뷰 링크
- **dev → main** — `dev`에 쌓인 것을 사람이 `dev → main` PR로 올린다. 시점은 사람이 정한다
- **큰 작업은 나눈다**(핵심만) · **보안**(public. 키·실제 값·Figma 파일 키 금지, `VITE_` 접두사는 번들에 들어간다) · **저 문맥** · **순리** · **한국어**
- **웹 스택 규칙**(pr-reviewer의 근거) — 라우터 라이브러리 없이 `pathname` 분기 · `index.css` 토큰 재사용, 기능 css는 접두사 · 상태는 순수 reducer + `node:test`,
  테스트는 `tsconfig.node.json` 대상 · 비밀은 `server/`·`api/`에서만 · 의존성 추가 이유를 PR에

`CLAUDE.local.md`는 위키 로컬 경로·Figma 키를 담고 커밋하지 않는다. `.gitignore`에 `CLAUDE.local.md`·`.claude/settings.local.json` 추가.

### 2. `.claude/` — 스킬·에이전트·설정·훅

| 파일 | 원본 | 바꾸는 것 |
| --- | --- | --- |
| `skills/kickoff/SKILL.md` | 신규 | Jira 티켓 읽기 → 위키 `git pull`·읽기 → 브랜치 → `docs/spec/SSH-N/{spec,tasks}.md` → 커밋 → Draft PR → **⏸**. PR이 이미 있으면 tasks 체크박스가 끊긴 자리부터 |
| `skills/commit/SKILL.md` | 거의 그대로 | `dev`·`main` 둘 다 금지. 검증: `Project/` 변경 → `npx tsc -b && npm run lint && npm test`, 문서만 → 생략 |
| `skills/pr/SKILL.md` | 원본 | `origin/dev`·`--base dev`. 스코프 절 삭제. 스크린샷 절을 웹(1440·768·390, gstack `/browse`, `docs/spec/SSH-N/`에 커밋 후 SHA blob URL)으로. 라벨을 기존 라벨로 매핑 |
| `skills/pr-review/SKILL.md` | 거의 그대로 | `origin/dev`. 규칙 4·단계 판정·검증표·COMMENT 고정·앵커별 엔드포인트·422 폴백·P1/P2 자동 반영·2회째 등록 전 확인·스레드 답글만 유지 |
| `agents/pr-reviewer.md` | 원본 | 네 자세·awk 앵커·`breaks` 필수·Pn·JSON 계약·자가 점검 유지. Client/Server 기준 표 → **웹 기준**(CLAUDE.md 웹 규칙 · oxlint가 잡는 건 지적 안 함 · `api/` 입력 검증·비밀 노출 · 접근성 · 반응형 3폭) |
| `settings.json` | 원본 | allow: git 읽기·`add`·`commit`, `gh pr view/list/diff/checks`, `npm run lint/test`, `npx tsc`. PreToolUse Bash → `verify-web.sh` |
| `hooks/verify-web.sh` | `verify-server.sh` | `git commit`일 때 · `Project/` `.md` 제외 변경 있을 때만 `npx tsc -b && npx oxlint`. vite build는 안 돌린다(CI가 한다). 실패 시 deny JSON. 우회 `SKIP_WEB_VERIFY=1` |

### 3. `.github/workflows/rules-ci.yml`

- 트리거 `pull_request: [opened, edited, synchronize, reopened, ready_for_review]`, `branches: [dev, main]`, `paths` 없음(항상 돌아 required check 가능)
- `TYPES='feat|fix|chore|style|refactor|docs|test'`, `SIGN` 정규식은 원본 그대로(줄 시작 앵커). SCOPES 없음
- ① AI 서명(커밋 본문 + PR 본문) ② 제목 `^.+\(SSH-[0-9]+\)$` ③ 커밋 `^($TYPES): .+$` + 50자(python `len`) ④ 브랜치 `^($TYPES)/SSH-[0-9]+$` ⑤ 브랜치 키 == 제목 키
- **예외** — `head_ref == dev && base_ref == main`(릴리스 PR)이면 ①만. 이유는 파일 머리 주석에
- 실패 누적(`fail()`), 제목·본문은 `env:`로(인젝션 방지)

### 4. `.github/workflows/web-ci.yml`

- `pull_request`(dev·main, `draft != true`) + `push`(dev·main). **`paths` 필터 대신 job 안에서 변경 감지** — 워크플로는 항상 트리거되어 required check가 가능하고,
  `Project/`에서 `.md` 제외 변경이 없으면(문서만 고친 PR) 뒤 스텝을 건너뛰고 바로 초록(1차 리뷰 결정)
- `concurrency: web-ci-${{ github.ref }}`, `cancel-in-progress: true`
- `checkout@v5` → `setup-node@v4`(`node-version: 26`, npm 캐시, `Project/package-lock.json`) → `Project/`에서 `npm ci` → `lint` → `build` → `test`
- Node 26 고정 이유(테스트가 TS를 그대로 실행)를 주석에. 버전은 `Project/.nvmrc` 한 곳에 — **`engines.node`는 쓰지 않는다.**
  Vercel이 `engines.node`를 읽어 런타임을 고르는데 26이 없어 프리뷰 배포가 실패했다(실측, 아래 「2차 결정」). `workflow_dispatch`도 둔다 — Draft 상태에서 사람이 CI를 미리 돌려볼 수 있게

### 5. `.github/` 문서

- `pull_request_template.md` — 5섹션(`📌 관련 이슈 / 🙋 남기는 말 / 📍 PR Point / ✨ 세부 내용 / 📸 스크린샷`). 제목 규칙 `작업 내용(SSH-XXX)`, 스크린샷 표 `1440 | 768 | 390`, 「390 예외 없음」
- `CONTRIBUTING.md` — **전면 교체**. Feature Flow · 컨벤션 · `dev → main` · CI가 검사하는 것 · 리뷰 두 번 + Pn · 라벨 · AI 협업 · `CLAUDE.md` 관리
- `CODEOWNERS` — `* @alstjr7437 @dbsghdz1 @ppaangss`
- `ISSUE_TEMPLATE/issue-template.md` — **그대로 둔다**(1차 리뷰 결정)

### 6. 파일 목록

```
CLAUDE.md                                   신규
.gitignore                                  CLAUDE.local.md · .claude/settings.local.json 추가
.claude/settings.json                       신규
.claude/hooks/verify-web.sh                 신규
.claude/agents/pr-reviewer.md               신규
.claude/skills/kickoff/SKILL.md             신규
.claude/skills/commit/SKILL.md              신규
.claude/skills/pr/SKILL.md                  신규
.claude/skills/pr-review/SKILL.md           신규
.github/workflows/rules-ci.yml              신규
.github/workflows/web-ci.yml                신규
.github/pull_request_template.md            교체
.github/CONTRIBUTING.md                     교체
.github/CODEOWNERS                          신규
Project/.nvmrc                              신규 (Node 26)
docs/spec/SSH-546/{spec,tasks}.md           이 문서
```

## 범위 밖

| 안 하는 것 | 왜 |
| --- | --- |
| Prettier 도입 | `style:` 타입은 있는데 포맷터가 없다. 포맷 일괄 변경이 섞이면 이 PR이 읽기 어렵다 → 별도 티켓 |
| Vercel 프리뷰 URL을 PR 코멘트로 자동 남기기 | Vercel GitHub 앱이 이미 체크로 남긴다. 필요해지면 |
| `.gitignore` 끝의 `.env*`가 `!.env.example`을 다시 덮는 문제 | 이 PR 목적과 무관. 별도 |
| 브랜치 보호·머지 설정 | GitHub 설정은 사람이 한다(아래 「사람이 할 일」) |
| 기존 PR·브랜치(`feat/#542`) 소급 | 이미 머지됐다. 규칙은 다음 티켓부터 |

## 검증

- [ ] 이 PR에서 `규칙 검사`·`웹 CI`가 실제로 돌고 초록 (브랜치·제목이 규칙을 만족하므로 그 자체가 테스트)
- [ ] 규칙 CI 음성 테스트 — 제목을 잠깐 `(SSH-546)` 없이 바꿔 `edited`로 빨간불 확인 후 되돌린다
- [ ] 훅 — `echo '{"tool_input":{"command":"git commit -m x"}}' | .claude/hooks/verify-web.sh`: Project 변경 없으면 exit 0·출력 없음, 타입 오류를 넣으면 deny JSON
- [ ] `cd Project && npm ci && npm run lint && npm run build && npm test` 로컬 초록
- [ ] `/pr-review`를 이 PR에 별도 서브에이전트로 1회 등록(dogfood) → P1·P2 반영
- [ ] 새 세션에서 `/kickoff`·`/commit`·`/pr`·`/pr-review`가 스킬 목록에 뜬다

## 사람이 할 일

- Ready for review · Jira 검토 중 · Squash Merge(→ `dev`) · `dev → main` PR
- GitHub 설정 — `dev`·`main` 브랜치 보호(required checks `규칙 검사`·`웹 CI`, PR 필수) · **Default commit message = Pull request title** · Delete branch on merge · (선택) `feat→dev`는 squash, `dev→main`은 merge commit

## 1차 리뷰 결정 (2026-09-10)

1. **커밋 전 검증 훅은 넣는다** — 판단은 에이전트에 위임됨. `tsc -b` + oxlint 5초 안쪽이고 `SKIP_WEB_VERIFY=1` 우회가 있어 급할 때 비용이 없다. 타입 오류가 CI까지 가서 왕복하는 비용이 더 크다
2. **이슈 템플릿은 둔다** — 삭제하지 않는다
3. **문서만 고친 PR은 웹 CI를 돌리지 않는다** — 단 `paths` 필터가 아니라 job 안 변경 감지로. required check가 pending에 걸리지 않게(4절)

## 구현 중 결정 (2026-09-10)

1. **`engines.node >=26`을 넣었다가 뺐다** — 넣은 커밋에서 Vercel 프리뷰 배포가 실패했다(직전 문서 커밋은 성공). Vercel은 `engines.node`로
   빌드·서버리스 런타임을 고르는데 26을 제공하지 않는다. 26이 필요한 것은 `node --test`뿐이므로 `Project/.nvmrc`로 옮기고 CI가 그 파일을 읽는다
2. **`web-ci`에 `workflow_dispatch` 추가** — Draft 동안은 자동으로 안 돌기 때문에, 이 PR처럼 CI 자체를 검증해야 할 때 사람이 Actions 탭에서 돌린다
