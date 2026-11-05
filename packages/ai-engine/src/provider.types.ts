export enum ProviderType {
  MOCK = 'MOCK',
  GEMINI_FLASH = 'GEMINI_FLASH',
  GROQ_LLAMA = 'GROQ_LLAMA',
  OLLAMA_LOCAL = 'OLLAMA_LOCAL'
}

export interface PromptRequest {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface AIResponse {
  content: string;
  tokensUsed?: number;
  model: string;
  provider: ProviderType;
}

export interface IAIProvider {
  type: ProviderType;
  isEnabled: boolean;
  generateText(request: PromptRequest): Promise<AIResponse>;
  checkHealth(): Promise<{ isHealthy: boolean; details?: string }>;
}
