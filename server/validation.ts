// 프롬프트 입력 검증용 순수 함수. 부수효과가 없어 단위 테스트가 가능하다.

export const MAX_PROMPT_LENGTH = 500;

/** 앞뒤 공백을 제외한 글자 수(유니코드 코드포인트 기준)가 최대 길이 이하인지 검증한다. */
export function validatePromptLength(prompt: string): { valid: boolean; error?: string } {
  const length = [...prompt.trim()].length;
  if (length > MAX_PROMPT_LENGTH) {
    return { valid: false, error: `프롬프트는 ${MAX_PROMPT_LENGTH}자 이하로 입력해주세요.` };
  }
  return { valid: true };
}
