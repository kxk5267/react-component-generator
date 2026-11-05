import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HISTORY_LIMIT,
  addToHistory,
  loadStored,
  parseApiKeys,
  parseComponents,
  parseHistory,
  parseProvider,
  saveStored,
} from './persistence';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('loadStored', () => {
  it('저장된 값이 없으면 fallback을 반환한다', () => {
    expect(loadStored('k', ['x'], parseHistory)).toEqual(['x']);
  });

  it('저장된 값을 parse 함수로 검증해 반환한다', () => {
    localStorage.setItem('k', JSON.stringify(['a', 'b']));
    expect(loadStored('k', [], parseHistory)).toEqual(['a', 'b']);
  });

  it('JSON이 깨져 있으면 fallback을 반환한다', () => {
    localStorage.setItem('k', '{broken');
    expect(loadStored('k', ['x'], parseHistory)).toEqual(['x']);
  });

  it('parse가 null을 반환하면(형식 불일치) fallback을 반환한다', () => {
    localStorage.setItem('k', JSON.stringify({ not: 'array' }));
    expect(loadStored('k', ['x'], parseHistory)).toEqual(['x']);
  });

  it('localStorage 접근이 예외를 던져도 fallback을 반환한다', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadStored('k', ['x'], parseHistory)).toEqual(['x']);
  });
});

describe('saveStored', () => {
  it('값을 JSON으로 저장한다', () => {
    saveStored('k', { a: 1 });
    expect(localStorage.getItem('k')).toBe('{"a":1}');
  });

  it('용량 초과 등으로 setItem이 실패해도 예외를 던지지 않는다', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveStored('k', 1)).not.toThrow();
  });
});

describe('parseComponents', () => {
  const valid = { id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-02T03:04:05.000Z' };

  it('createdAt 문자열을 Date로 복원한다', () => {
    const [c] = parseComponents([valid]) ?? [];
    expect(c.createdAt).toBeInstanceOf(Date);
    expect(c.createdAt.toISOString()).toBe('2026-01-02T03:04:05.000Z');
  });

  it('형식이 맞지 않는 항목은 걸러낸다', () => {
    const result = parseComponents([valid, { id: 2 }, null, 'x']);
    expect(result).toHaveLength(1);
  });

  it('createdAt이 유효하지 않은 날짜면 그 항목을 걸러낸다', () => {
    expect(parseComponents([{ ...valid, createdAt: 'nope' }])).toEqual([]);
  });

  it('배열이 아니면 null을 반환한다', () => {
    expect(parseComponents({})).toBeNull();
  });
});

describe('parseProvider', () => {
  it('알려진 provider만 허용한다', () => {
    expect(parseProvider('anthropic')).toBe('anthropic');
    expect(parseProvider('google')).toBe('google');
    expect(parseProvider('openai')).toBeNull();
    expect(parseProvider(1)).toBeNull();
  });
});

describe('parseApiKeys', () => {
  it('provider별 문자열 키를 읽고 누락된 provider는 빈 문자열로 채운다', () => {
    expect(parseApiKeys({ google: 'AIza' })).toEqual({ anthropic: '', google: 'AIza' });
  });

  it('객체가 아니면 null을 반환한다', () => {
    expect(parseApiKeys('str')).toBeNull();
    expect(parseApiKeys(null)).toBeNull();
  });

  it('문자열이 아닌 값은 빈 문자열로 취급한다', () => {
    expect(parseApiKeys({ anthropic: 5, google: 'g' })).toEqual({ anthropic: '', google: 'g' });
  });
});

describe('parseHistory', () => {
  it('문자열이 아닌 항목은 걸러낸다', () => {
    expect(parseHistory(['a', 1, 'b'])).toEqual(['a', 'b']);
  });

  it('배열이 아니면 null을 반환한다', () => {
    expect(parseHistory('a')).toBeNull();
  });
});

describe('addToHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('중복 프롬프트는 맨 앞으로 옮기고 하나만 남긴다', () => {
    expect(addToHistory(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it(`최대 ${HISTORY_LIMIT}개까지만 유지한다`, () => {
    const full = Array.from({ length: HISTORY_LIMIT }, (_, i) => `p${i}`);
    const next = addToHistory(full, 'new');
    expect(next).toHaveLength(HISTORY_LIMIT);
    expect(next[0]).toBe('new');
    expect(next).not.toContain(`p${HISTORY_LIMIT - 1}`);
  });
});
