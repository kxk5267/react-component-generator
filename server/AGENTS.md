# server/AGENTS.md

## Module Context

Bun 런타임에서 실행되는 AI 프록시 서버. Vite 개발 서버가 `/api`를 이 서버(포트 3002)로 프록시한다.

## Tech Stack & Constraints

- 실행: `bun --watch run server/index.ts` (`bun run server`). Node에서는 `Bun.serve`가 동작하지 않는다.
- HTTP 클라이언트는 전역 `fetch`만 사용한다. SDK나 axios 의존성이 없다 (`package.json`의 dependencies 참고).
- 테스트는 vitest(jsdom 환경)로 실행되며 `server/**/*.test.ts`만 수집된다 (`vite.config.ts` test.include).

## Implementation Patterns

- 새 엔드포인트는 `server/index.ts`의 `fetch` 핸들러에서 `url.pathname`/`req.method` 분기로 추가하고, 모든 `Response`에 `CORS_HEADERS`를 붙인다 (`server/index.ts:51`, `155`, `190`).
- 부수효과 없는 로직은 별도 파일로 분리해 같은 이름의 `.test.ts`를 둔다 (`generator.ts`/`generator.test.ts`, `fallback.ts`/`fallback.test.ts`). `index.ts`는 `Bun.serve`를 최상위에서 실행하므로 테스트에서 import하지 않는다 (`server/index.ts:138`).
- 모델별 호출 함수는 `callXxxModel(prompt, apiKey, model)` 형태로 만들고 `withModelFallback`으로 감싼다 (`server/index.ts:98`, `134`).

## Testing Strategy

- 전체: `bun run test`, 서버만: `bunx vitest run server`.
- 새 순수 함수는 정상/경계 케이스를 `describe`로 묶어 한국어 `it` 설명으로 작성한다 (`server/generator.test.ts` 형식).

## Local Golden Rules

- Do: 프로바이더 호출이 실패하면 `Error` 메시지에 HTTP 상태 코드를 포함해 던진다. 핸들러가 `503`/`429` 포함 여부로 사용자 메시지를 고른다 (`server/index.ts:85`, `112`, `194-206`).
- Do: 키 해석은 `resolveApiKey`를 거친다. 클라이언트가 보낸 키가 `.env` 키보다 우선한다 (`server/index.ts:64-66`).
- Don't: 응답 본문에 클라이언트 키나 env 키를 에코하지 않는다. `GET /api/config`는 보유 여부 boolean만 반환한다 (`server/index.ts:148-153`).
- Don't: `withModelFallback`에서 에러를 삼키지 않는다. 마지막 에러를 다시 던지는 동작을 상위 에러 매핑이 의존한다 (`server/fallback.ts:20-26`).
- Don't: `ensureRenderCall`의 컴포넌트 이름 정규식(`/(?:const|function)\s+([A-Z]\w+)/`)을 느슨하게 바꾸지 않는다. 대문자로 시작하지 않는 선언을 컴포넌트로 오인하면 잘못된 `render()`가 주입된다 (`server/generator.ts:241`, 테스트 `server/generator.test.ts`의 마지막 케이스).
