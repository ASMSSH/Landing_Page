# SSH-546 — 작업 목록 (작업 방식·규칙 CI 도입)

`spec.md`를 커밋 단위로 쪼갠 것. 번호는 spec의 절과 맞췄다.

## 0. 문서 — 브랜치 `chore/SSH-546` (base: `dev`)

- [x] Jira SSH-546 생성 (에픽 SSH-152, 스프린트 12)
- [x] `docs/spec/SSH-546/spec.md` · `tasks.md`
- [x] **커밋** `docs: SSH-546 spec·tasks 작성`
- [x] **Draft PR 생성 후 멈춘다** — `작업 방식·규칙 CI 도입(SSH-546)`, base `dev`. 1차 리뷰(작업 계획) 뒤 아래를 같은 브랜치에서 잇는다

## 1. CLAUDE.md — spec 1절

- [x] `CLAUDE.md` 200줄 이하
- [x] `.gitignore`에 `CLAUDE.local.md` · `.claude/settings.local.json`
- [x] `CLAUDE.local.md` 로컬 생성(커밋 안 함)
- [x] **커밋** `docs: CLAUDE.md 작업 규약 추가`

## 2. .claude — spec 2절

- [x] `.claude/skills/commit/SKILL.md`
- [x] `.claude/skills/pr/SKILL.md`
- [x] `.claude/skills/pr-review/SKILL.md`
- [x] `.claude/agents/pr-reviewer.md`
- [x] `.claude/skills/kickoff/SKILL.md`
- [x] **커밋** `chore: Claude Code 스킬과 리뷰 에이전트 추가`
- [x] `.claude/settings.json` · `.claude/hooks/verify-web.sh` (실행 권한)
- [x] **커밋** `chore: 커밋 전 웹 검증 훅 추가`

## 3. 규칙 검사 CI — spec 3절

- [x] `.github/workflows/rules-ci.yml`
- [x] **커밋** `chore: 규칙 검사 CI 추가`

## 4. 웹 CI — spec 4절

- [x] `.github/workflows/web-ci.yml`(job 안 변경 감지, 문서만이면 건너뜀) · `Project/package.json` `engines`
- [x] **커밋** `chore: 웹 lint·빌드·테스트 CI 추가`

## 5. .github 문서 — spec 5절

- [x] `pull_request_template.md` 교체 · `CONTRIBUTING.md` 교체 · `CODEOWNERS` (이슈 템플릿은 둔다)
- [x] **커밋** `docs: PR 템플릿·CONTRIBUTING을 새 작업 방식으로 교체`

## 6. 검증 — spec 「검증」

- [x] 푸시 후 이 PR에서 두 워크플로 초록 (웹 CI는 Draft라 `workflow_dispatch`로)
- [x] 제목 음성 테스트(빨강 확인 후 복구)
- [x] 훅 손 실행 2건
- [x] 로컬 `npm ci && lint && build && test`
- [x] PR 본문 갱신(문서 요약 → 실제 구현)
- [ ] `/pr-review` 별도 서브에이전트 1회 → P1·P2 반영

## 7. 마무리

- [ ] Ready 전환 · Jira 검토 중 · Squash Merge · dev→main · 브랜치 보호 설정은 사람이 한다 — 남았다고 보고

## 하지 않는 것

- Prettier · Vercel 프리뷰 코멘트 · `.gitignore` `.env*` 정리 · 기존 브랜치 소급 (spec 「범위 밖」)
