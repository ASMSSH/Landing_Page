#!/usr/bin/env bash
# 커밋 전 웹 검증 게이트 (SSH-546)
#
# `.claude/settings.json`의 PreToolUse 훅이 `git commit` 직전에 부른다.
# 검사가 깨지면 stdout에 deny JSON을 내보내 커밋을 막는다.
#
# 무엇을 검사하나 — `tsc -b`(타입) + `oxlint`. 둘 다 Project/에서 5초 안쪽이다.
# `vite build`와 `npm test`는 여기서 돌리지 않는다 — 느리고, CI(web-ci.yml)가 같은 명령으로 돌린다.
# 훅은 "타입 오류를 CI까지 들고 가서 왕복하는 것"만 막으면 된다.
#
# 이 훅은 Claude Code 세션 안에서만 돈다. 터미널에서 직접 `git commit`하면 안 돈다 — 그건 CI가 잡는다.
#
# 손으로 돌려보려면: echo '{"tool_input":{"command":"git commit -m x"}}' | .claude/hooks/verify-web.sh; echo "exit=$?"
set -uo pipefail

# 커밋 명령이 아니면 여기서 끝낸다. git을 부르기 전에 판정해서 다른 Bash 호출에 비용을 안 준다.
# `git add x && git commit -m y` 같은 복합 명령도 잡도록 명령 전체를 본다.
case "$(cat)" in
    *'git commit'*) ;;
    *) exit 0 ;;
esac

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
cd "$REPO_ROOT" || exit 0

# 우회 — 급할 때. 쓰면 PR 본문에 왜 넘겼는지 적는다.
[ "${SKIP_WEB_VERIFY:-}" = "1" ] && exit 0

# Project/ 코드에 변경이 있을 때만 돈다. 마크다운만 고친 커밋에 5초를 쓰지 않는다.
# index가 아니라 워킹 트리 전체를 본다 — `git commit -am`은 커밋 명령 자체가 스테이징하므로
# 훅이 도는 시점엔 index가 비어 있다. tsc도 어차피 워킹 트리를 컴파일한다.
CHANGED="$(git status --porcelain -- Project/ | awk '{print $NF}' | grep -v '\.md$' || true)"
[ -z "$CHANGED" ] && exit 0

# node_modules가 없으면(새 클론) 검사 없이 통과시킨다. 설치를 강제하면 문서 커밋까지 막힌다. CI가 잡는다.
[ -d Project/node_modules ] || exit 0

if OUTPUT="$(cd Project && npx tsc -b 2>&1 && npx oxlint 2>&1)"; then
    exit 0
fi

# 실패 → 커밋을 막고 이유를 돌려준다. 출력은 길 수 있어 꼬리만 준다.
REASON="$(printf '%s' "$OUTPUT" | tail -25)"
python3 - "$REASON" <<'PY'
import json, sys
reason = (
    "커밋 전 웹 검증이 실패했습니다. 고친 뒤 다시 커밋하세요.\n\n"
    "재현: cd Project && npx tsc -b && npx oxlint\n"
    "급하면 우회: SKIP_WEB_VERIFY=1 (쓴 이유를 PR 본문에 적을 것)\n\n"
    + sys.argv[1]
)
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }
}, ensure_ascii=False))
PY
exit 0
