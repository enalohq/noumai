// Mock for llm-provider
export const callLlm = jest.fn();

export type LlmResponse = {
  text: string;
  provider: 'ollama' | 'openrouter';
};

export const mockLlmResponse = (text: string): LlmResponse => ({
  text,
  provider: 'ollama' as const,
});

export default {
  callLlm,
};