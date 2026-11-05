import { describe, it, expect } from 'vitest';
import { validatePromptLength, MAX_PROMPT_LENGTH } from './validation';

describe('validatePromptLength', () => {
  it('최대 길이는 500자이다', () => {
    expect(MAX_PROMPT_LENGTH).toBe(500);
  });

  it('500자 이하이면 유효하다', () => {
    expect(validatePromptLength('a'.repeat(500))).toEqual({ valid: true });
  });

  it('501자 이상이면 에러 메시지와 함께 무효이다', () => {
    const result = validatePromptLength('a'.repeat(501));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('500');
  });

  it('앞뒤 공백은 길이에 포함하지 않는다', () => {
    expect(validatePromptLength(`  ${'a'.repeat(500)}  `)).toEqual({ valid: true });
  });

  it('한글도 글자 수 기준으로 센다', () => {
    expect(validatePromptLength('가'.repeat(500)).valid).toBe(true);
    expect(validatePromptLength('가'.repeat(501)).valid).toBe(false);
  });

  it('이모지는 한 글자로 센다', () => {
    expect(validatePromptLength('😀'.repeat(500)).valid).toBe(true);
  });
});
