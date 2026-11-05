#!/usr/bin/env bash
# PreToolUse 훅: git commit 직전에 전체 테스트를 실행하고, 하나라도 실패하면 exit 2로 커밋을 차단한다.
# stdin으로 훅 입력 JSON을 받는다. git commit이 아닌 명령은 즉시 통과시킨다.

input=$(cat)

if ! printf '%s' "$input" | grep -Eq 'git[[:space:]]+(-[^[:space:]]+[[:space:]]+)*commit'; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

output=$(bun run test 2>&1)
status=$?

if [ $status -ne 0 ]; then
  {
    echo "커밋 차단: 테스트가 실패했습니다 (bun run test 종료 코드 $status)."
    echo "실패를 수정하고 모든 테스트가 통과한 뒤 다시 커밋하세요."
    echo "----- 테스트 출력 (마지막 40줄) -----"
    printf '%s\n' "$output" | tail -n 40
  } >&2
  exit 2
fi

exit 0
