# AGENTS.md

## Operational Commands

- 패키지 관리와 서버 런타임은 `bun` 고정 (`bun install`, `bun run ...`). npm/yarn/pnpm으로 락 파일을 갱신하지 않는다.
- 개발 서버 (API + Vite 동시): `bun run dev`
- 테스트 (전체, 1회): `bun run test` / 감시: `bun run test:watch`  (`bun test`가 아니라 vitest를 실행하는 package.json 스크립트를 사용한다)
- 린트: `bun run lint`
- 타입체크 + 빌드: `bun run build`
- 변경 후 완료 보고 전 `bun run lint`, `bun run test`, `bun run build`를 실행한다.

## Golden Rules

### Immutable

- API 키를 클라이언트 번들이나 응답 본문에 노출하지 않는다. 키는 서버가 `process.env`에서 읽고(`server/index.ts:59-62`), `/api/config`는 boolean만 반환한다(`server/index.ts:148-153`). 키 값 자체를 반환하는 엔드포인트를 만들지 않는다.
- 생성 코드는 import 없이 전역 `React`만 쓰고, 끝에 `render(<Component />)`를 호출해야 한다. 미리보기가 `react-live`의 `noInline` 모드라 `render()`가 없으면 아무것도 그려지지 않는다 (`src/components/LivePreview.tsx:71`, `server/generator.ts:235-238`). 이 계약을 바꾸면 시스템 프롬프트(`server/index.ts:7-20`), `ensureRenderCall`, `LivePreview`를 함께 수정한다.

### Do

- 모델 응답 정규화는 `server/generator.ts`의 순수 함수에 두고 테스트를 함께 추가한다. 순수 함수로 분리해 두었기 때문에 `Bun.serve` 부작용 없이 테스트된다 (`server/generator.ts:1-2`).
- 프로바이더/모델 폴백 로직은 `withModelFallback`을 재사용한다 (`server/index.ts:135`).
- 새 프로바이더 타입을 추가하면 `server/index.ts:57`과 `src/types/index.ts:1`의 `Provider` 정의를 둘 다 수정한다. 두 곳은 공유 모듈 없이 각각 정의되어 있다.
- 프론트엔드 `fetch`는 상대 경로 `/api/...`만 쓴다 (`src/hooks/useComponentGenerator.ts:23`). Vite 프록시가 `localhost:3002`로 넘기므로 (`vite.config.ts:9`) 서버 포트를 바꾸면 `server/index.ts:139`와 `vite.config.ts`를 함께 바꾼다.

### Don't

- 방어 계층 한쪽만 제거하지 않는다. `render()` 호출은 프롬프트(`server/index.ts:12`)와 `ensureRenderCall`(`server/index.ts:188`) 두 곳에서, 코드펜스는 프롬프트(`server/index.ts:16`)와 `stripCodeFences`(`server/index.ts:188`) 두 곳에서 막고 있다. 모델이 지시를 어기는 경우가 있어서 이중으로 두는 것이다.
- 생성 코드 프롬프트에 TypeScript 문법을 허용하지 않는다. `react-live`가 TS 주석을 파싱하지 못한다 (`server/index.ts:20`).
- 에러 메시지에 요청 URL을 포함하지 않는다. Google 호출은 API 키를 쿼리스트링에 담고 있다 (`server/index.ts:99`).

### 비대칭 (수정 시 주의)

- 모델 폴백은 Google에만 있다 (`server/index.ts:5`, `134-136`). Anthropic은 단일 모델이고 폴백이 없다 (`server/index.ts:77`).
- 출력 잘림(`MAX_TOKENS`) 검사는 Gemini에만 있다 (`server/index.ts:123-125`). Anthropic 경로(`stop_reason`)에는 없다. 한쪽을 고치면 다른 쪽 필요 여부를 확인한다.
- HTTP 상태별 사용자 메시지는 에러 문자열에 `503`/`429`가 포함되는지로 판별한다 (`server/index.ts:194`, `201`). 프로바이더 에러 메시지 형식(`... API error: <status>`)을 바꾸면 이 매핑이 깨진다.

### 테스트 경계

- 테스트 있음: `server/generator.ts`, `server/fallback.ts`, `src/components/PromptInput.tsx`.
- 테스트 없음: `server/index.ts`(HTTP 핸들러, 프로바이더 호출), `src/hooks/useComponentGenerator.ts`, `LivePreview`, `CodeView`. 이 파일을 수정할 때는 로직을 순수 함수로 빼서 테스트하거나, 수동 확인 결과를 보고에 명시한다.

## Project Context

- AI로 React 컴포넌트를 생성하고 라이브 미리보기와 코드를 보여주는 도구.
- Stack: React 19, TypeScript, Vite, vitest + Testing Library(jsdom), Bun(`Bun.serve`), react-live.

## Standards & References

- 설치/실행/기능 설명은 `README.md`를 따른다.
- 코드 주석, UI 문구, 에러 메시지는 한국어가 기존 관례다 (API 키 누락 등 일부 서버 에러는 영어).
- 커밋 메시지: `<type>: <한국어 요약>` (type: feat, fix, refactor, chore), 요약은 50자 내외, 마침표 없음.
- Maintenance Policy: 이 파일의 규칙이나 근거 라인이 코드와 어긋난 것을 발견하면 작업을 마치기 전에 AGENTS.md 업데이트를 제안한다.

## Context Map

- **[서버/API 수정 (Bun)](./server/AGENTS.md)** — `server/` 아래 핸들러, 프로바이더 호출, 정규화 로직 작업 시.
