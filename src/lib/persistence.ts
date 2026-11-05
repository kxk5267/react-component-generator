import type { GeneratedComponent, Provider } from '../types';

export const STORAGE_KEYS = {
  apiKeys: 'rcg:apiKeys',
  provider: 'rcg:provider',
  history: 'rcg:history',
  components: 'rcg:components',
} as const;

export const HISTORY_LIMIT = 20;

const PROVIDERS: readonly Provider[] = ['anthropic', 'google'];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// 저장소 접근(차단, 손상된 JSON, 형식 불일치)이 실패해도 앱이 깨지지 않도록 fallback을 돌려준다.
export function loadStored<T>(key: string, fallback: T, parse: (raw: unknown) => T | null): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return parse(JSON.parse(raw)) ?? fallback;
  } catch {
    return fallback;
  }
}

// 용량 초과나 접근 차단은 기능 손실일 뿐 치명적이지 않으므로 조용히 무시한다.
export function saveStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function parseComponents(raw: unknown): GeneratedComponent[] | null {
  if (!Array.isArray(raw)) return null;
  const result: GeneratedComponent[] = [];
  for (const item of raw) {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.prompt !== 'string' ||
      typeof item.code !== 'string' ||
      typeof item.createdAt !== 'string'
    ) {
      continue;
    }
    const createdAt = new Date(item.createdAt);
    if (Number.isNaN(createdAt.getTime())) continue;
    result.push({ id: item.id, prompt: item.prompt, code: item.code, createdAt });
  }
  return result;
}

export function parseProvider(raw: unknown): Provider | null {
  return PROVIDERS.find((p) => p === raw) ?? null;
}

export function parseApiKeys(raw: unknown): Record<Provider, string> | null {
  if (!isRecord(raw)) return null;
  const read = (p: Provider) => (typeof raw[p] === 'string' ? raw[p] : '');
  return { anthropic: read('anthropic'), google: read('google') };
}

export function parseHistory(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter((v): v is string => typeof v === 'string');
}

export function addToHistory(history: string[], prompt: string): string[] {
  return [prompt, ...history.filter((p) => p !== prompt)].slice(0, HISTORY_LIMIT);
}
