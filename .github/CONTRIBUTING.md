# 🤝 협업 컨벤션

> DeepDive(가칭) 프로젝트의 GitHub 기반 협업 규칙입니다.
> 작업 흐름(Feature Flow)과 Issue / Branch / Commit / PR 컨벤션을 정리했습니다.
> 1차 개발자는 본인이지만, AI(Claude Code)와 함께 작업하므로 그 협업 규칙도 함께 명시합니다.

---

## 📌 전체 Feature Flow

### 0. 할 일 정하기

GitHub **Issues / Projects 보드**를 보고 이번에 맡을 작업을 정합니다.
> 예) "이번엔 Domain 골격(#3)을 해야겠다"

### 1. Issue 생성

맡은 작업을 **작업 내용을 제목으로** Issue를 생성합니다.
> 예) `프로젝트 세팅`, `[MVP][Domain] Entity + Repository/UseCase 인터페이스 골격`

- Issue 템플릿(`.github/ISSUE_TEMPLATE/issue-template.md`)에 맞춰 작성합니다.
- 가능하면 **Label / Assignee / Projects**를 함께 지정합니다.
- 작업이 크면 **PR당 변경 코드 ≤ 500줄**이 되도록 이슈를 잘게 쪼갭니다.

### 2. Branch 생성

1번에서 만들어진 **Issue 번호**를 가져와 브랜치를 만듭니다.

```
<type>/#<이슈번호>
```

> 예) `chore/#1`, `feat/#3`, `chore/#12`

- Issue 우측의 **Development** 영역에서 연결된 브랜치를 만들 수 있습니다.
- base 브랜치는 항상 최신 `main`. (선행 이슈가 있으면 머지된 `main`에서 분기)

### 3. 커밋 컨벤션에 맞춰 작업하기

여러 작업을 커밋 컨벤션에 맞춰 진행합니다. **각 작업을 잘 쪼개서 커밋합니다!**
> 예)
>
> - `chore: 이슈 템플릿 추가`
> - `chore: PR 템플릿 추가`
> - `docs: 아키텍처 문서 추가`
> - `chore: Xcode 프로젝트 초기 세팅`

### 4. 모든 작업을 마치고 PR 작성

PR 내용 · 구현 스크린샷 · 논의할 부분을 작성해 PR을 생성합니다.
PR 제목은 **작업한 내용(#이슈번호)** 형식으로 작성합니다.
> 예) `프로젝트 기본 Setting(#1)`

- PR 템플릿(`.github/pull_request_template.md`)에 맞춰 작성합니다.
- PR 본문에 `Closes #<이슈번호>`를 적으면 Merge 시 Issue가 자동으로 닫힙니다.

### 5. Squash Merge 하기

**Squash and merge**를 이용해 Merge합니다. (커밋 히스토리를 이슈 단위로 깔끔하게 유지)

### 6. 다음 Feature 가져가기

다음 작업을 시작합니다 ~ 🚀

---

## 🌿 Branch Convention

```
<type>/#<이슈번호>
```

| Type | 설명 | 대응 라벨 |
| --- | --- | --- |
| `feat` | 새로운 기능 추가 (도메인·데이터·UI 등 구현 포함) | ⚒️ Feature / 🧠 Core |
| `fix` | 버그 수정 | 🪚 Fix |
| `chore` | 빌드/설정/패키지 등 기타 작업 | ⚙️ chore |
| `style` | 코드 포맷, 세미콜론 등 (로직 변경 없음) | ✏️ Style |
| `refactor` | 코드 리팩토링 | 🪠 Refactor |
| `docs` | 문서 작업 | 📜 docs |
| `test` | 테스트 코드 추가/수정 | — |

> 예) `feat/#3`, `fix/#7`, `chore/#12`

---

## 📝 Commit Convention

```
<type>: <subject>
```

| Type | 설명 |
| --- | --- |
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `chore` | 빌드/설정/패키지 등 기타 작업 |
| `style` | 코드 포맷, 세미콜론 등 (로직 변경 없음) |
| `refactor` | 코드 리팩토링 |
| `docs` | 문서 작업 |
| `test` | 테스트 코드 추가/수정 |
| `comment` | 주석 추가/변경 |
| `rename` | 파일/폴더명 변경 |
| `remove` | 파일 삭제 |

### 작성 규칙

- 제목은 **한 줄(50자 이내)**, 명확하고 간결하게 작성합니다.
- 작업을 **의미 단위로 잘게 쪼개서** 커밋합니다.
- 한 커밋에는 하나의 목적만 담습니다.

> 예)
>
> - `feat: Topic·Question Entity 추가`
> - `fix: 오늘의 주제 dayIndex 계산 오류 수정`
> - `chore: 프로젝트 세팅`

---

## 🔍 Pull Request Convention

### 제목

```
작업한 내용(#이슈번호)
```

> 예) `프로젝트 기본 Setting(#1)`

### 본문

PR 템플릿(`.github/pull_request_template.md`)에 따라 작성합니다.

- **🔍 PR Content** — 작업 내용 설명 (+ `Closes #<이슈번호>`)
- **📸 Screenshot** — 작업 화면 스크린샷
- **📍 PR Point** — 질문하거나 공유하고 싶은 내용

### 규칙

- **변경 코드 ≤ 500줄.** 넘으면 이슈/PR을 더 잘게 쪼갭니다.
- 한 PR엔 **하나의 목적**만. (관련 없는 변경을 섞지 않음)
- **Merge는 Squash and merge** 사용.

---

## 🗂 Issue Convention

- 제목은 **작업 내용**으로 작성합니다. (예: `프로젝트 세팅`)
- Issue 템플릿에 맞춰 **이슈 설명 / 할 일 목록 / 참고 사항 / 참고 자료**를 작성합니다.
- 생성된 **Issue 번호**를 브랜치와 PR에 연결합니다.
- 가능하면 적절한 **Label**을 지정합니다. (아래 라벨 체계 참고)

---

## 🏷 라벨 체계

| 라벨 | 용도 |
| --- | --- |
| ⚒️ Feature | 기능 개발 |
| 🧠 Core | 도메인·데이터 등 핵심 로직 |
| ⚙️ chore / 🧠 chore | 설정 관련 작업 |
| ✏️ Style | 코드 스타일 변경 |
| 🎨 Design | 디자인 관련 작업 |
| 📜 docs | 문서 관련 작업 |
| 🤖 AI | AI 관련 작업 |
| 🪚 Fix | 급하게 고쳐야 할 작업 |
| 🪠 Refactor | 자잘한 수정이나 빌드 업데이트 |
| major / minor / patch | 버전 |

---

## 🤖 AI(Claude Code) 협업 흐름

AI와 함께 작업할 때의 고정 워크플로우입니다. (출처: Issue #12)

| 단계 | 주체 | 내용 |
| --- | --- | --- |
| 1 | **나(사용자)** | 작업할 이슈를 지정한다. |
| 2 | AI | 지정된 이슈를 구현한다. |
| 3 | AI | 이슈 번호에 맞는 브랜치를 만든다 (`<type>/#<이슈번호>`). |
| 4 | AI | 이슈 범위 안의 작업은 **묻지 않고 쭉 진행**한다. |
| 5 | AI | **PR까지 생성** 후 마지막에 **"PR 생성 완료" 결과(링크)만 보고**한다. |
| 6 | **나(사용자)** | **PR Squash Merge는 직접** 한다. (AI는 머지하지 않음) |

**질문 금지 (4·5단계 핵심):**

- 작업 도중 **확인·동의·선택 질문을 붙이지 않는다.** "진행할까요?", "이대로 할까요?", "A/B 중 뭘 할까요?", 선택지 질문(AskUserQuestion) 전부 포함.
- 애매하거나 이상해 보이는 지점은 **합리적 기본값으로 스스로 결정**하고 진행한다. 결정한 내용은 **마지막 PR 보고에 한 줄로 적어** 사후 공유한다. (사전 승인 X)
- 멈춰서 묻는 건 **딱 두 곳뿐**: ① 이슈 지정(1단계) ② Squash Merge(6단계). 그 사이엔 무조건 쭉 진행 → PR.

**커밋 단위 (2·4단계):**

- 브랜치 내부 작업도 **기능/의미 단위로 커밋을 작게 나눈다.** 한 번에 몰아서 커밋하지 않는다.
- Squash Merge로 합쳐지더라도, 브랜치 안에서는 단계가 보이도록 쪼갠다. (리뷰·되돌리기 용이)
- 커밋 메시지는 위 [Commit Convention](#-commit-convention)을 따른다. (`feat:`, `fix:` …)

**예외 (4번에도 불구하고 먼저 확인):**

- MVP 범위 밖(시험 모드·AI 면접관·위젯 등)을 건드려야 할 때 → `docs/ROADMAP.md` 범위 가드레일.
- 되돌리기 어렵거나 외부로 나가는 작업(배포, 강제 푸시, 데이터 삭제 등).

**권한 정책 (`.claude/settings.json`, git 추적):**

- **프로젝트 내부 파일 읽기/쓰기/수정**과 일반 작업(검색·git·gh·xcodebuild 등)은 **묻지 않고 바로 실행**한다.
- **위험해 보이는 작업만 질문**한다: 강제 푸시(`--force`), `reset --hard`, `git clean`, `rebase`, 브랜치 강제 삭제(`-D`), `rm` 등 (`ask`로 분류).
- 머신 종속 경로(메모리 디렉터리 등)는 추적되지 않는 `.claude/settings.local.json`에 둔다.

> 이 흐름은 GitHub 이슈/문서로만 관리합니다. (`CLAUDE.md`에는 미반영 — 새 세션에서는 이 문서를 참조시킵니다.)

---

## 📍 현재 프로젝트 현황 (2026-06-15 기준)

- **단계:** MVP(1단계) — "하루 1주제 + 꼬리질문 트리 + 뒤집기 학습 모드 + 진도 저장". (→ `docs/ROADMAP.md`)
- **완료:** `#1 프로젝트 세팅` → PR #2 (Squash Merge, `main` 반영).
- **진행 중:** `#12 협업 워크플로우/컨벤션` (이 문서).
- **대기 중인 MVP 이슈 (권장 순서):**
  - `#3` [Domain] Entity + Repository/UseCase 인터페이스 골격 — 🧠 Core
  - `#4` [Content] `struct vs class` 꼬리질문 6개 + topics.json — 📜 docs
  - `#5` [Data] DTO + Bundle DataSource + TopicsRepository 구현 — 🧠 Core
  - `#6` [Data] 진도 영속성(SwiftData) + ProgressRepository 구현 — 🧠 Core
  - `#7` [Domain/App] UseCase 구현 + DIContainer 조립 — 🧠 Core
  - `#8` [Feature] 홈 화면(TodayTopic) + Navigation 골격 — ⚒️ Feature
  - `#9` [Feature] swift-markdown-ui + MarkdownView 컴포넌트 — ⚒️ Feature
  - `#10` [Feature] 카드 학습 화면(StudyCards) — ⚒️ Feature
  - `#11` [Content] 주제 5개 채우기 — 📜 docs

> 2단계(시험 모드)·AI 면접관·위젯 등은 MVP 완료 + 7일 연속 사용 증명 후 이슈로 만듭니다.

---

## 📑 참고 문서

- `docs/PRD.md` — 제품 기획서
- `docs/ARCHITECTURE.md` — 스택·데이터 모델·화면·확장 포인트
- `docs/CONTENT_SCHEMA.md` — topics.json 스키마
- `docs/ROADMAP.md` — 단계별 빌드 계획
