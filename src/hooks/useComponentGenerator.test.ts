import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { STORAGE_KEYS } from '../lib/persistence';

const saved = { id: 's1', prompt: '저장됨', code: 'render(<div/>)', createdAt: '2026-01-02T03:04:05.000Z' };

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useComponentGenerator 영속화', () => {
  it('마운트 시 저장된 컴포넌트 목록을 Date 복원과 함께 불러온다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify([saved]));
    const { result } = renderHook(() => useComponentGenerator());
    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
  });

  it('생성에 성공하면 새 컴포넌트가 저장소에도 기록된다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: 'render(<p/>)' }) }),
    );
    const { result } = renderHook(() => useComponentGenerator());
    await act(() => result.current.generate('새 프롬프트', undefined, 'google'));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.components) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].prompt).toBe('새 프롬프트');
  });

  it('삭제한 컴포넌트가 저장소에서도 제거된다', () => {
    localStorage.setItem(STORAGE_KEYS.components, JSON.stringify([saved]));
    const { result } = renderHook(() => useComponentGenerator());
    act(() => result.current.removeComponent('s1'));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.components) ?? 'null')).toEqual([]);
  });
});
