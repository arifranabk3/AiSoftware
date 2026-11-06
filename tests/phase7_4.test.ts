import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ProviderType,
  MockAIProvider,
  OllamaLocalProvider,
  GroqFreeProvider,
  GeminiFreeProvider,
  providerRegistry,
  ceoOrchestrator,
  CEOState
} from '../packages/ai-engine/src/index.js';
import { DepartmentId } from '@ai-command-center/shared';

describe('Phase 7.4 — Zero-Cost Real AI Provider Integration Suite', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    ceoOrchestrator.setProvider(new MockAIProvider());
  });

  // -------------------------------------------------------------------------
  // 1. MOCK PROVIDER BEHAVIOR & EXECUTION MODE METADATA
  // -------------------------------------------------------------------------
  describe('1. Mock Provider Behavior & Execution Mode', () => {
    it('should explicitly flag mock executions with mode = MOCK and record tokens', async () => {
      const mock = new MockAIProvider();
      expect(mock.isEnabled).toBe(true);

      const res = await mock.generateText({
        userPrompt: 'Generate market strategy',
        responseFormat: 'json'
      });

      expect(res.mode).toBe('MOCK');
      expect(res.metadata.mode).toBe('MOCK');
      expect(res.metadata.provider).toBe(ProviderType.MOCK);
      expect(res.metadata.success).toBe(true);
      expect(res.metadata.tokensUsed).toBeGreaterThan(0);
      expect(res.metadata.latencyMs).toBeDefined();

      const parsed = JSON.parse(res.content);
      expect(parsed.status).toBe('SUCCESS');
    });

    it('health check must report mock operational status and mode', async () => {
      const mock = new MockAIProvider();
      const health = await mock.checkHealth();
      expect(health.isHealthy).toBe(true);
      expect(health.mode).toBe('MOCK');
      expect(health.availableModels).toContain('mock-reasoning-engine-v1');
    });
  });

  // -------------------------------------------------------------------------
  // 2. OLLAMA LOCAL HTTP PROVIDER ADAPTER
  // -------------------------------------------------------------------------
  describe('2. Ollama Local Provider Adapter', () => {
    it('should be disabled by default and refuse execution without explicit enable', async () => {
      const ollama = new OllamaLocalProvider();
      expect(ollama.isEnabled).toBe(false);
      await expect(ollama.generateText({ userPrompt: 'hello' })).rejects.toThrow('PROVIDER_DISABLED');
    });

    it('should execute local inference when enabled and return REAL execution mode metadata', async () => {
      const mockOllamaResponse = {
        response: JSON.stringify({ analysis: 'Local Ollama output', score: 98 }),
        eval_count: 55,
        prompt_eval_count: 22
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockOllamaResponse
      } as unknown as Response);

      const ollama = new OllamaLocalProvider({ baseUrl: 'http://127.0.0.1:11434', model: 'llama3.2:1b' });
      ollama.enable();

      const res = await ollama.generateText({
        userPrompt: 'Analyze competition',
        responseFormat: 'json'
      });

      expect(res.mode).toBe('REAL');
      expect(res.provider).toBe(ProviderType.OLLAMA_LOCAL);
      expect(res.metadata.mode).toBe('REAL');
      expect(res.metadata.model).toBe('llama3.2:1b');
      expect(res.metadata.tokensUsed).toBe(77);
      expect(res.metadata.promptTokens).toBe(22);
      expect(res.metadata.completionTokens).toBe(55);
      expect(res.metadata.success).toBe(true);

      const parsed = JSON.parse(res.content);
      expect(parsed.analysis).toBe('Local Ollama output');
    });

    it('health check detects installed models when daemon is online', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ models: [{ name: 'llama3.2:1b' }, { name: 'qwen2.5:0.5b' }] })
      } as unknown as Response);

      const ollama = new OllamaLocalProvider();
      const health = await ollama.checkHealth();
      expect(health.isHealthy).toBe(true);
      expect(health.mode).toBe('REAL');
      expect(health.availableModels).toContain('llama3.2:1b');
    });

    it('health check reports offline status gracefully if connection is refused', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:11434'));

      const ollama = new OllamaLocalProvider();
      const health = await ollama.checkHealth();
      expect(health.isHealthy).toBe(false);
      expect(health.mode).toBe('REAL');
      expect(health.details).toContain('ECONNREFUSED');
    });

    it('should enforce bounded timeouts on slow local model execution', async () => {
      global.fetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          setTimeout(() => reject(err), 50);
        });
      });

      const ollama = new OllamaLocalProvider({ timeoutMs: 20 });
      ollama.enable();

      await expect(ollama.generateText({ userPrompt: 'heavy computation' })).rejects.toThrow('PROVIDER_TIMEOUT');
    });
  });

  // -------------------------------------------------------------------------
  // 3. GROQ CLOUD FREE TIER PROVIDER ADAPTER
  // -------------------------------------------------------------------------
  describe('3. Groq Cloud Free Tier Provider Adapter', () => {
    it('should be disabled by default under Zero-Cost Policy', async () => {
      const groq = new GroqFreeProvider();
      expect(groq.isEnabled).toBe(false);
      await expect(groq.generateText({ userPrompt: 'test' })).rejects.toThrow('PROVIDER_DISABLED');
    });

    it('should refuse activation without API key', () => {
      const groq = new GroqFreeProvider({ apiKey: '' });
      expect(() => groq.enable()).toThrow('CONFIG_ERROR');
    });

    it('should call Groq API when enabled and parse completion tokens with REAL mode', async () => {
      const mockGroqResponse = {
        choices: [
          { message: { content: JSON.stringify({ result: 'Groq high-speed output' }) } }
        ],
        usage: { prompt_tokens: 15, completion_tokens: 30, total_tokens: 45 }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockGroqResponse
      } as unknown as Response);

      const groq = new GroqFreeProvider({ apiKey: 'gsk_test_mock_free_key', model: 'llama-3.1-8b-instant' });
      groq.enable();

      const res = await groq.generateText({ userPrompt: 'Draft outreach email', responseFormat: 'json' });
      expect(res.mode).toBe('REAL');
      expect(res.provider).toBe(ProviderType.GROQ_LLAMA);
      expect(res.metadata.tokensUsed).toBe(45);
      expect(res.metadata.mode).toBe('REAL');
      expect(res.metadata.model).toBe('llama-3.1-8b-instant');

      const parsed = JSON.parse(res.content);
      expect(parsed.result).toBe('Groq high-speed output');
    });

    it('should handle rate limits (HTTP 429) cleanly with structured error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      } as unknown as Response);

      const groq = new GroqFreeProvider({ apiKey: 'gsk_test_key' });
      groq.enable();

      await expect(groq.generateText({ userPrompt: 'over limit' })).rejects.toThrow('PROVIDER_RATE_LIMIT');
    });
  });

  // -------------------------------------------------------------------------
  // 4. GOOGLE GEMINI FLASH FREE TIER PROVIDER ADAPTER
  // -------------------------------------------------------------------------
  describe('4. Google Gemini Flash Free Tier Provider Adapter', () => {
    it('should be disabled by default under Zero-Cost Policy', async () => {
      const gemini = new GeminiFreeProvider();
      expect(gemini.isEnabled).toBe(false);
      await expect(gemini.generateText({ userPrompt: 'test' })).rejects.toThrow('PROVIDER_DISABLED');
    });

    it('should format requests for Gemini API and extract response text with REAL mode', async () => {
      const mockGeminiResponse = {
        candidates: [
          { content: { parts: [{ text: JSON.stringify({ plan: 'Gemini Flash Action Plan' }) }] } }
        ],
        usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 40, totalTokenCount: 60 }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockGeminiResponse
      } as unknown as Response);

      const gemini = new GeminiFreeProvider({ apiKey: 'AIzaSy_mock_gemini_key' });
      gemini.enable();

      const res = await gemini.generateText({ userPrompt: 'Formulate growth strategy', responseFormat: 'json' });
      expect(res.mode).toBe('REAL');
      expect(res.provider).toBe(ProviderType.GEMINI_FLASH);
      expect(res.metadata.tokensUsed).toBe(60);
      expect(res.metadata.mode).toBe('REAL');

      const parsed = JSON.parse(res.content);
      expect(parsed.plan).toBe('Gemini Flash Action Plan');
    });

    it('should handle resource exhausted (HTTP 429) cleanly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Resource Exhausted'
      } as unknown as Response);

      const gemini = new GeminiFreeProvider({ apiKey: 'AIzaSy_mock_key' });
      gemini.enable();

      await expect(gemini.generateText({ userPrompt: 'rapid requests' })).rejects.toThrow('PROVIDER_RATE_LIMIT');
    });
  });

  // -------------------------------------------------------------------------
  // 5. CEO ORCHESTRATOR & REAL PROVIDER PIPELINE INTEGRATION
  // -------------------------------------------------------------------------
  describe('5. CEO Orchestrator & Real Provider Pipeline', () => {
    it('CEO Orchestrator propagates execution metadata (MOCK vs REAL) into task result', async () => {
      // 1. Run with default Mock provider
      const mockResult = await ceoOrchestrator.executeObjective({
        id: 'obj_mode_test_01',
        title: 'Mock Mode Verification',
        description: 'Verify metadata tagging',
        targetDepartment: DepartmentId.BUSINESS_DEV,
        parameters: { niche: 'SaaS' }
      });

      expect(mockResult.status).toBe('COMPLETED');
      expect(mockResult.aiExecution?.mode).toBe('MOCK');
      expect(mockResult.aiExecution?.provider).toBe(ProviderType.MOCK);

      // 2. Switch CEO Orchestrator to a mocked Real Provider (Ollama)
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          response: JSON.stringify({ analysis: 'Genuine real AI reasoning result' }),
          eval_count: 42,
          prompt_eval_count: 18
        })
      } as unknown as Response);

      const realOllama = new OllamaLocalProvider();
      realOllama.enable();
      ceoOrchestrator.setProvider(realOllama);

      const realResult = await ceoOrchestrator.executeObjective({
        id: 'obj_mode_test_02',
        title: 'Real Mode Verification',
        description: 'Verify real AI metadata tagging',
        targetDepartment: DepartmentId.BUSINESS_DEV,
        parameters: { niche: 'SaaS' }
      });

      expect(realResult.status).toBe('COMPLETED');
      expect(realResult.aiExecution?.mode).toBe('REAL');
      expect(realResult.aiExecution?.provider).toBe(ProviderType.OLLAMA_LOCAL);
      expect(realResult.aiExecution?.success).toBe(true);
      expect(realResult.aiExecution?.tokensUsed).toBe(60);
    });

    it('CEO Orchestrator records failed AI status honestly without returning fake success', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:11434'));

      const brokenOllama = new OllamaLocalProvider();
      brokenOllama.enable();
      ceoOrchestrator.setProvider(brokenOllama);

      const failResult = await ceoOrchestrator.executeObjective({
        id: 'obj_fail_test_01',
        title: 'Failing Provider Objective',
        description: 'Simulated network outage',
        targetDepartment: DepartmentId.BUSINESS_DEV,
        parameters: { niche: 'SaaS' }
      });

      expect(failResult.status).toBe('FAILED');
      expect(failResult.error).toContain('AI_EXECUTION_FAILURE');
      expect(failResult.aiExecution?.success).toBe(false);
      expect(failResult.aiExecution?.mode).toBe('REAL');
      expect(ceoOrchestrator.getState()).toBe(CEOState.FAILED);
    });
  });

  // -------------------------------------------------------------------------
  // 6. PROVIDER REGISTRY & SWITCHING
  // -------------------------------------------------------------------------
  describe('6. Provider Registry & Dynamic Switching', () => {
    it('registry manages all providers and switches active provider safely', () => {
      expect(providerRegistry.getActiveProviderType()).toBe(ProviderType.MOCK);

      // Cannot activate disabled real provider
      expect(() => providerRegistry.setActiveProvider(ProviderType.GROQ_LLAMA)).toThrow('PROVIDER_NOT_ENABLED');

      // Can get provider instance and query health
      const mockP = providerRegistry.getProvider(ProviderType.MOCK);
      expect(mockP.isEnabled).toBe(true);
    });
  });
});

