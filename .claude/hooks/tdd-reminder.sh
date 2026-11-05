#!/usr/bin/env bash
# PreToolUse 훅: 파일 생성/수정 직전에 .claude/rules/tdd.md 핵심을 컨텍스트로 주입한다.
# 차단하지 않고 additionalContext만 추가한다. 문서·설정·스타일 파일은 TDD 대상이 아니므로 건너뛴다.

input=$(cat)

path=$(printf '%s' "$input" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n 1 | sed -E 's/.*:[[:space:]]*"(.*)"/\1/')

case "$path" in
  *.md|*.json|*.css|*.html|*.svg|*.yml|*.yaml|*.lock|*.lockb|*.sh|*/.claude/*|*\.claude\*|*\\.claude\\*)
    exit 0 ;;
esac

cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"[TDD 리마인더 - .claude/rules/tdd.md (Rigid)] 이 파일을 생성/수정하기 전에 확인하라. (1) 비즈니스 로직·API·유틸/순수 함수·버그 수정이면 TDD 필수이고, 경계가 모호하면 적용한다. 타입·설정·로직 없는 순수 UI만 예외다. (2) RED: 하나의 동작=하나의 테스트를 먼저 쓰고 반드시 실행해 '기능 미구현'으로 실패하는 것을 확인한다(문법/import 오류 실패는 RED가 아니다). 버그 수정은 재현 실패 테스트부터. (3) GREEN: 테스트를 통과시키는 최소 코드만 쓰고(YAGNI) 전체 테스트를 실행한다. (4) REFACTOR: 동작 추가 없이 정리하고 매번 green을 유지한다. (5) 테스트보다 프로덕션 코드를 먼저 썼다면 그 코드를 삭제하고 RED부터 다시 시작한다. 주석 처리·보관도 금지. 지금 쓰려는 변경이 어느 단계인지 먼저 밝히고 진행하라."}}
JSON
exit 0
