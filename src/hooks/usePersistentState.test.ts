import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';
import { parseHistory } from '../lib/persistence';

beforeEach(() => localStorage.clear());

describe('usePersistentState', () => {
  it('저장된 값이 없으면 초기값을 사용한다', () => {
    const { result } = renderHook(() => usePersistentState('k', ['init'], parseHistory));
    expect(result.current[0]).toEqual(['init']);
  });

  it('마운트 시 저장된 값을 복원한다', () => {
    localStorage.setItem('k', JSON.stringify(['saved']));
    const { result } = renderHook(() => usePersistentState('k', [] as string[], parseHistory));
    expect(result.current[0]).toEqual(['saved']);
  });

  it('값이 바뀌면 localStorage에 저장한다', () => {
    const { result } = renderHook(() => usePersistentState('k', [] as string[], parseHistory));
    act(() => result.current[1](['a', 'b']));
    expect(JSON.parse(localStorage.getItem('k') ?? 'null')).toEqual(['a', 'b']);
  });

  it('새로 마운트하면(새로고침) 이전에 저장한 값이 유지된다', () => {
    const first = renderHook(() => usePersistentState('k', [] as string[], parseHistory));
    act(() => first.result.current[1](['kept']));
    first.unmount();
    const second = renderHook(() => usePersistentState('k', [] as string[], parseHistory));
    expect(second.result.current[0]).toEqual(['kept']);
  });
});
