export enum ProviderType {
  MOCK = 'MOCK',
  GEMINI_FLASH = 'GEMINI_FLASH',
  GROQ_LLAMA = 'GROQ_LLAMA',
  OLLAMA_LOCAL = 'OLLAMA_LOCAL'
}

export type ExecutionMode = 'MOCK' | 'REAL';

export interface PromptRequest {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface AIExecutionMetadata {
  provider: ProviderType;
  model: string;
  mode: ExecutionMode;
  timestamp: string;
  success: boolean;
  tokensUsed?: number;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  error?: string;
}

export interface AIResponse {
  content: string;
  tokensUsed?: number;
  model: string;
  provider: ProviderType;
  mode: ExecutionMode;
  metadata: AIExecutionMetadata;
}

export interface ProviderHealth {
  isHealthy: boolean;
  mode: ExecutionMode;
  details?: string;
  latencyMs?: number;
  availableModels?: string[];
}

export interface IAIProvider {
  type: ProviderType;
  isEnabled: boolean;
  generateText(request: PromptRequest): Promise<AIResponse>;
  checkHealth(): Promise<ProviderHealth>;
}
