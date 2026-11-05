import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 최신 Node의 실험적 localStorage 전역이 --localstorage-file 없이는 undefined가 되어
// jsdom의 localStorage를 가린다. 사용할 수 없을 때만 메모리 구현으로 대체한다.
if (typeof globalThis.localStorage?.getItem !== 'function') {
  const store = new Map<string, string>();
  const memoryStorage = {
    get length() {
      return store.size;
    },
    key: (i: number) => [...store.keys()][i] ?? null,
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });
}

// 각 테스트 후 렌더된 DOM을 정리해 테스트 간 격리를 보장한다.
afterEach(() => {
  cleanup();
});
