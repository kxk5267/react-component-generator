import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { loadStored, saveStored } from '../lib/persistence';

// useState처럼 쓰되 값이 localStorage에 동기화된다. parse는 저장된 값의 형식을 검증한다.
export function usePersistentState<T>(
  key: string,
  initial: T,
  parse: (raw: unknown) => T | null,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => loadStored(key, initial, parse));

  useEffect(() => {
    saveStored(key, value);
  }, [key, value]);

  return [value, setValue];
}
