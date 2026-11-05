---
name: create-pr
description: 현재 브랜치의 변경사항을 분석해 GitHub Pull Request를 생성한다. 프로젝트 언어(한국 프로젝트/해외 오픈소스)에 맞춰 한국어 또는 영문 PR 템플릿을 골라 본문을 작성한다. "PR 만들어줘", "PR 올려줘", "풀리퀘스트 생성", "create pr", "open a pull request" 요청이나 작업 완료 후 리뷰를 요청하려는 맥락이면 명시적으로 PR이라고 말하지 않아도 이 스킬을 사용한다.
context: fork
---

# create-pr

현재 브랜치를 push하고 `gh`로 Pull Request를 만든다. fork된 서브 에이전트에서 실행되므로, 메인 대화 맥락에 기대지 말고 git 이력과 diff만으로 PR 내용을 구성한다. 끝나면 PR URL과 사용한 템플릿 언어를 한두 줄로 보고한다.

## 절차

### 1. 사전 점검
병렬로 실행한다.
- `git status --short`, `git branch --show-current`
- `gh auth status`, `gh repo view --json nameWithOwner,defaultBranchRef,isFork,parent`
- `git remote -v`

중단 조건 (사용자에게 이유를 보고하고 멈춘다):
- 현재 브랜치가 기본 브랜치(main/master)다. PR은 작업 브랜치에서 만든다. 커밋이 쌓여 있다면 새 브랜치 이름을 제안한다.
- 기본 브랜치 대비 커밋이 없다.
- `gh` 미인증 또는 원격 저장소가 없다.

커밋되지 않은 변경이 있으면 PR에 포함되지 않는다는 점을 보고에 명시한다. 임의로 커밋하지 않는다 (커밋은 `commit` 스킬의 몫이다).

### 2. 변경 내용 파악
- `git log <base>..HEAD --format='%h %s%n%b'` — 커밋 목록과 의도
- `git diff <base>...HEAD --stat`, 이어서 핵심 파일의 diff를 실제로 읽는다. 파일 이름만 보고 요약하면 PR 설명이 겉돌기 때문이다.
- 테스트 파일 변경 여부, 관련 이슈 번호(브랜치명, 커밋 메시지의 `#123`)를 확인한다.

### 3. 템플릿 선택
저장소에 `.github/PULL_REQUEST_TEMPLATE.md`(또는 `pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/`)가 있으면 그 템플릿이 최우선이다. 팀이 정한 형식을 덮어쓰지 않는다. 없을 때만 아래 규칙으로 `references/`의 템플릿을 고른다.

언어 판단은 다음 신호를 위에서부터 보고, 처음으로 뚜렷한 결론이 나오는 지점에서 멈춘다.

1. 최근 PR 제목/본문: `gh pr list --state all --limit 10 --json title,body`
2. 최근 커밋 메시지(`git log -20 --format=%s`)와 README·CONTRIBUTING의 주 언어
3. 저장소 소유자/조직의 성격 (해외 오픈소스 조직인지, 국내 팀/개인인지)

판정:
- 한글 위주 → `references/pr-template-ko.md`
- 영어 위주(특히 외부 기여자를 받는 해외 오픈소스) → `references/pr-template-en.md`
- 신호가 섞이거나 불분명 → 최근 커밋 메시지의 언어를 따른다. 그래도 판단이 안 되면 영문.

fork 저장소에서 upstream(parent)으로 PR을 보내는 경우는 upstream의 언어를 기준으로 삼는다. 받는 쪽 메인테이너가 읽기 때문이다.

선택한 템플릿 파일을 읽고, 섹션 구조를 그대로 유지하며 채운다. 해당 없는 섹션은 지우지 말고 "해당 없음"/"N/A"로 적는다.

### 4. 제목과 본문 작성
- 제목: 70자 이내. 프로젝트 커밋 컨벤션이 있으면 따른다(예: `feat: ...` + 한국어 요약, 마침표 없음). 언어는 선택한 템플릿 언어와 같게 한다.
- 본문: 무엇을 왜 바꿨는지 중심으로 쓴다. 커밋 목록을 그대로 붙여넣지 않는다.
- 테스트 항목은 실제로 실행한 것만 체크한다. 실행하지 않았다면 체크하지 않고 이유를 적는다. 체크박스는 리뷰어가 신뢰하는 정보이기 때문이다.
- 이슈가 있으면 `Closes #N`을 넣는다.
- `.env` 값, 토큰, 내부 URL 등 민감 정보가 diff나 본문에 섞이지 않았는지 확인한다.

### 5. push 및 PR 생성
```bash
git push -u origin HEAD
gh pr create --base <base> --title "<제목>" --body-file <임시파일>
```
- 본문은 임시 파일로 만들어 `--body-file`로 넘긴다 (줄바꿈·따옴표 깨짐 방지). 생성 후 임시 파일은 지운다.
- 이미 같은 브랜치의 열린 PR이 있으면(`gh pr view`) 새로 만들지 말고 URL을 알리고, 사용자가 원하면 `gh pr edit`으로 갱신한다.
- 사용자가 "draft", "초안"을 언급하면 `--draft`를 붙인다.
- force push, 기본 브랜치로의 직접 push는 하지 않는다.

### 6. 보고
- PR URL
- 사용한 템플릿(ko/en/저장소 자체 템플릿)과 선택 근거 한 줄
- 미커밋 변경, 실행하지 못한 테스트 등 리뷰어가 알아야 할 주의점
