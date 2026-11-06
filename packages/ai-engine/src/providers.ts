import {
  IAIProvider,
  ProviderType,
  PromptRequest,
  AIResponse,
  ProviderHealth,
  AIExecutionMetadata
} from './provider.types.js';

export interface OllamaConfig {
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

export interface GroqConfig {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
}

export interface GeminiConfig {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
}

/**
 * 1. Mock AI Provider — Zero-Cost deterministic fallback for testing & local development
 */
export class MockAIProvider implements IAIProvider {
  public type = ProviderType.MOCK;
  public isEnabled = true;

  public async generateText(request: PromptRequest): Promise<AIResponse> {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    const model = 'mock-reasoning-engine-v1';

    let content: string;
    let tokensUsed: number;

    if (request.responseFormat === 'json') {
      content = JSON.stringify({
        status: 'SUCCESS',
        analysis: 'Mock analytical output generated successfully',
        suggestedActions: ['STEP_1', 'STEP_2'],
        confidence: 0.95
      });
      tokensUsed = 120;
    } else {
      content = `[Mock AI Response]: Analysis completed for prompt: "${request.userPrompt.substring(0, 50)}..."`;
      tokensUsed = 85;
    }

    const metadata: AIExecutionMetadata = {
      provider: ProviderType.MOCK,
      model,
      mode: 'MOCK',
      timestamp,
      success: true,
      tokensUsed,
      promptTokens: 40,
      completionTokens: tokensUsed - 40,
      latencyMs: Date.now() - start
    };

    return {
      content,
      tokensUsed,
      model,
      provider: ProviderType.MOCK,
      mode: 'MOCK',
      metadata
    };
  }

  public async checkHealth(): Promise<ProviderHealth> {
    return {
      isHealthy: true,
      mode: 'MOCK',
      details: 'Mock Provider Operational',
      latencyMs: 1,
      availableModels: ['mock-reasoning-engine-v1']
    };
  }
}

/**
 * 2. Ollama Local Provider Adapter — Zero-Cost Local HTTP Inference
 */
export class OllamaLocalProvider implements IAIProvider {
  public type = ProviderType.OLLAMA_LOCAL;
  public isEnabled = false;
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = (config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
    this.model = config.model || process.env.OLLAMA_MODEL || 'llama3.2:1b';
    this.timeoutMs = config.timeoutMs || 15000;
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public async checkHealth(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(this.timeoutMs, 3000));
      
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        return {
          isHealthy: false,
          mode: 'REAL',
          details: `Ollama returned HTTP ${res.status}: ${res.statusText}`,
          latencyMs: Date.now() - start
        };
      }

      const data = (await res.json()) as { models?: Array<{ name: string }> };
      const availableModels = (data.models || []).map((m) => m.name);
      return {
        isHealthy: true,
        mode: 'REAL',
        details: `Ollama daemon online. ${availableModels.length} models installed.`,
        latencyMs: Date.now() - start,
        availableModels
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        isHealthy: false,
        mode: 'REAL',
        details: `Ollama unavailable at ${this.baseUrl}: ${msg}`,
        latencyMs: Date.now() - start
      };
    }
  }

  public async generateText(request: PromptRequest): Promise<AIResponse> {
    if (!this.isEnabled) {
      throw new Error(
        'PROVIDER_DISABLED: Ollama Local is disabled. Host GPU limits prevent 7B parameter execution.'
      );
    }

    const start = Date.now();
    const timestamp = new Date().toISOString();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: request.systemPrompt ? `${request.systemPrompt}\n\n${request.userPrompt}` : request.userPrompt,
          stream: false,
          format: request.responseFormat === 'json' ? 'json' : undefined,
          options: {
            temperature: request.temperature ?? 0.2,
            num_predict: request.maxTokens ?? 512
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`OLLAMA_ERROR: HTTP ${res.status} - ${errorText || res.statusText}`);
      }

      const data = (await res.json()) as {
        response: string;
        eval_count?: number;
        prompt_eval_count?: number;
      };

      const tokensUsed = (data.eval_count || 0) + (data.prompt_eval_count || 0);

      const metadata: AIExecutionMetadata = {
        provider: ProviderType.OLLAMA_LOCAL,
        model: this.model,
        mode: 'REAL',
        timestamp,
        success: true,
        tokensUsed,
        promptTokens: data.prompt_eval_count,
        completionTokens: data.eval_count,
        latencyMs: Date.now() - start
      };

      return {
        content: data.response,
        tokensUsed,
        model: this.model,
        provider: ProviderType.OLLAMA_LOCAL,
        mode: 'REAL',
        metadata
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const isTimeout = err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'));
      if (isTimeout) {
        throw new Error(`PROVIDER_TIMEOUT: Ollama inference exceeded ${this.timeoutMs}ms limit.`);
      }
      throw err;
    }
  }
}

/**
 * 3. Groq Cloud Free Tier Provider Adapter (OpenAI-compatible LPU API)
 */
export class GroqFreeProvider implements IAIProvider {
  public type = ProviderType.GROQ_LLAMA;
  public isEnabled = false;
  private apiKey?: string;
  private model: string;
  private timeoutMs: number;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor(config: GroqConfig = {}) {
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY;
    this.model = config.model || process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
    this.timeoutMs = config.timeoutMs || 15000;
  }

  public enable(): void {
    if (!this.apiKey) {
      throw new Error('CONFIG_ERROR: Cannot enable Groq provider without GROQ_API_KEY.');
    }
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public async checkHealth(): Promise<ProviderHealth> {
    if (!this.apiKey) {
      return {
        isHealthy: false,
        mode: 'REAL',
        details: 'Disabled by default under Zero-Cost Policy'
      };
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        return {
          isHealthy: false,
          mode: 'REAL',
          details: `Groq API returned HTTP ${res.status}: ${res.statusText}`,
          latencyMs: Date.now() - start
        };
      }

      return {
        isHealthy: true,
        mode: 'REAL',
        details: 'Groq Cloud Free Tier operational',
        latencyMs: Date.now() - start,
        availableModels: [this.model]
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        isHealthy: false,
        mode: 'REAL',
        details: `Groq unreachable: ${msg}`,
        latencyMs: Date.now() - start
      };
    }
  }

  public async generateText(request: PromptRequest): Promise<AIResponse> {
    if (!this.isEnabled) {
      throw new Error(
        'PROVIDER_DISABLED: Groq Cloud Free Tier is disabled. Owner approval & configuration required.'
      );
    }
    if (!this.apiKey) {
      throw new Error('CONFIG_ERROR: GROQ_API_KEY is not configured.');
    }

    const start = Date.now();
    const timestamp = new Date().toISOString();
    const messages: Array<{ role: string; content: string }> = [];

    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.userPrompt });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: request.temperature ?? 0.2,
          max_tokens: request.maxTokens ?? 512,
          response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.status === 429) {
        throw new Error('PROVIDER_RATE_LIMIT: Groq Free Tier rate limit (RPM/TPM) exceeded.');
      }

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(`GROQ_ERROR: HTTP ${res.status} - ${errJson.error?.message || res.statusText}`);
      }

      const data = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      const choice = data.choices[0];
      if (!choice) {
        throw new Error('GROQ_MALFORMED_OUTPUT: No completion choice returned.');
      }

      const tokensUsed = data.usage?.total_tokens;

      const metadata: AIExecutionMetadata = {
        provider: ProviderType.GROQ_LLAMA,
        model: this.model,
        mode: 'REAL',
        timestamp,
        success: true,
        tokensUsed,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        latencyMs: Date.now() - start
      };

      return {
        content: choice.message.content,
        tokensUsed,
        model: this.model,
        provider: ProviderType.GROQ_LLAMA,
        mode: 'REAL',
        metadata
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const isTimeout = err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'));
      if (isTimeout) {
        throw new Error(`PROVIDER_TIMEOUT: Groq request timed out after ${this.timeoutMs}ms.`);
      }
      throw err;
    }
  }
}

/**
 * 4. Google Gemini Free Tier Provider Adapter
 */
export class GeminiFreeProvider implements IAIProvider {
  public type = ProviderType.GEMINI_FLASH;
  public isEnabled = false;
  private apiKey?: string;
  private model: string;
  private timeoutMs: number;

  constructor(config: GeminiConfig = {}) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    this.model = config.model || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    this.timeoutMs = config.timeoutMs || 15000;
  }

  public enable(): void {
    if (!this.apiKey) {
      throw new Error('CONFIG_ERROR: Cannot enable Gemini provider without GEMINI_API_KEY.');
    }
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public async checkHealth(): Promise<ProviderHealth> {
    if (!this.apiKey) {
      return {
        isHealthy: false,
        mode: 'REAL',
        details: 'Disabled by default under Zero-Cost Policy'
      };
    }

    return {
      isHealthy: true,
      mode: 'REAL',
      details: 'Gemini Free Tier configured',
      availableModels: [this.model]
    };
  }

  public async generateText(request: PromptRequest): Promise<AIResponse> {
    if (!this.isEnabled) {
      throw new Error(
        'PROVIDER_DISABLED: Google Gemini Flash Free Tier is disabled. Owner approval & configuration required.'
      );
    }
    if (!this.apiKey) {
      throw new Error('CONFIG_ERROR: GEMINI_API_KEY is not configured.');
    }

    const start = Date.now();
    const timestamp = new Date().toISOString();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: request.systemPrompt
                    ? `${request.systemPrompt}\n\n${request.userPrompt}`
                    : request.userPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: request.temperature ?? 0.2,
            maxOutputTokens: request.maxTokens ?? 512,
            responseMimeType: request.responseFormat === 'json' ? 'application/json' : 'text/plain'
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.status === 429) {
        throw new Error('PROVIDER_RATE_LIMIT: Gemini Free Tier quota exceeded (Resource Exhausted).');
      }

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(`GEMINI_ERROR: HTTP ${res.status} - ${errJson.error?.message || res.statusText}`);
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('GEMINI_MALFORMED_OUTPUT: No candidate text content returned from Gemini.');
      }

      const tokensUsed = data.usageMetadata?.totalTokenCount;

      const metadata: AIExecutionMetadata = {
        provider: ProviderType.GEMINI_FLASH,
        model: this.model,
        mode: 'REAL',
        timestamp,
        success: true,
        tokensUsed,
        promptTokens: data.usageMetadata?.promptTokenCount,
        completionTokens: data.usageMetadata?.candidatesTokenCount,
        latencyMs: Date.now() - start
      };

      return {
        content: text,
        tokensUsed,
        model: this.model,
        provider: ProviderType.GEMINI_FLASH,
        mode: 'REAL',
        metadata
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const isTimeout = err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'));
      if (isTimeout) {
        throw new Error(`PROVIDER_TIMEOUT: Gemini request timed out after ${this.timeoutMs}ms.`);
      }
      throw err;
    }
  }
}

/**
 * 5. Provider Registry & Factory
 */
export class AIProviderRegistry {
  private static instance: AIProviderRegistry;
  private providers = new Map<ProviderType, IAIProvider>();
  private activeProviderType: ProviderType = ProviderType.MOCK;

  private constructor() {
    this.register(new MockAIProvider());
    this.register(new OllamaLocalProvider());
    this.register(new GroqFreeProvider());
    this.register(new GeminiFreeProvider());
  }

  public static getInstance(): AIProviderRegistry {
    if (!AIProviderRegistry.instance) {
      AIProviderRegistry.instance = new AIProviderRegistry();
    }
    return AIProviderRegistry.instance;
  }

  public register(provider: IAIProvider): void {
    this.providers.set(provider.type, provider);
  }

  public getProvider(type: ProviderType): IAIProvider {
    const p = this.providers.get(type);
    if (!p) {
      throw new Error(`UNKNOWN_PROVIDER: AI Provider '${type}' is not registered.`);
    }
    return p;
  }

  public setActiveProvider(type: ProviderType): void {
    const p = this.getProvider(type);
    if (!p.isEnabled && type !== ProviderType.MOCK) {
      throw new Error(`PROVIDER_NOT_ENABLED: Cannot activate disabled provider '${type}'.`);
    }
    this.activeProviderType = type;
  }

  public getActiveProvider(): IAIProvider {
    return this.getProvider(this.activeProviderType);
  }

  public getActiveProviderType(): ProviderType {
    return this.activeProviderType;
  }
}

export const providerRegistry = AIProviderRegistry.getInstance();
