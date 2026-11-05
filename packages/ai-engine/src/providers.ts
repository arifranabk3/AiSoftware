import { IAIProvider, ProviderType, PromptRequest, AIResponse } from './provider.types.js';

export class MockAIProvider implements IAIProvider {
  public type = ProviderType.MOCK;
  public isEnabled = true;

  public async generateText(request: PromptRequest): Promise<AIResponse> {
    if (request.responseFormat === 'json') {
      return {
        content: JSON.stringify({
          status: 'SUCCESS',
          analysis: 'Mock analytical output generated successfully',
          suggestedActions: ['STEP_1', 'STEP_2'],
          confidence: 0.95
        }),
        tokensUsed: 120,
        model: 'mock-reasoning-engine-v1',
        provider: ProviderType.MOCK
      };
    }

    return {
      content: `[Mock AI Response]: Analysis completed for prompt: "${request.userPrompt.substring(0, 50)}..."`,
      tokensUsed: 85,
      model: 'mock-reasoning-engine-v1',
      provider: ProviderType.MOCK
    };
  }

  public async checkHealth(): Promise<{ isHealthy: boolean; details?: string }> {
    return { isHealthy: true, details: 'Mock Provider Operational' };
  }
}

export class GeminiFreeProvider implements IAIProvider {
  public type = ProviderType.GEMINI_FLASH;
  public isEnabled = false; // DISABLED BY DEFAULT

  public async generateText(_request: PromptRequest): Promise<AIResponse> {
    if (!this.isEnabled) {
      throw new Error(
        'PROVIDER_DISABLED: Google Gemini Flash Free Tier is disabled. Owner approval & configuration required.'
      );
    }
    throw new Error(
      'NOT_IMPLEMENTED: Production Gemini invocation requires active configured key.'
    );
  }

  public async checkHealth(): Promise<{ isHealthy: boolean; details?: string }> {
    return { isHealthy: false, details: 'Disabled by default under Zero-Cost Policy' };
  }
}

export class GroqFreeProvider implements IAIProvider {
  public type = ProviderType.GROQ_LLAMA;
  public isEnabled = false; // DISABLED BY DEFAULT

  public async generateText(_request: PromptRequest): Promise<AIResponse> {
    if (!this.isEnabled) {
      throw new Error(
        'PROVIDER_DISABLED: Groq Cloud Free Tier is disabled. Owner approval & configuration required.'
      );
    }
    throw new Error('NOT_IMPLEMENTED: Production Groq invocation requires active configured key.');
  }

  public async checkHealth(): Promise<{ isHealthy: boolean; details?: string }> {
    return { isHealthy: false, details: 'Disabled by default under Zero-Cost Policy' };
  }
}

export class OllamaLocalProvider implements IAIProvider {
  public type = ProviderType.OLLAMA_LOCAL;
  public isEnabled = false; // DISABLED BY DEFAULT

  public async generateText(_request: PromptRequest): Promise<AIResponse> {
    if (!this.isEnabled) {
      throw new Error(
        'PROVIDER_DISABLED: Ollama Local is disabled. Host GPU limits prevent 7B parameter execution.'
      );
    }
    throw new Error('NOT_IMPLEMENTED: Ollama local daemon not connected.');
  }

  public async checkHealth(): Promise<{ isHealthy: boolean; details?: string }> {
    return { isHealthy: false, details: 'Ollama local engine not active' };
  }
}
