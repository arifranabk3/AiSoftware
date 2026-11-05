import { ProviderType } from './provider.types.js';

export interface QuotaLimit {
  dailyRequests: number;
  requestsUsedToday: number;
  dailyTokens: number;
  tokensUsedToday: number;
  lastReset: string;
}

export class CostAndQuotaInterceptor {
  private static instance: CostAndQuotaInterceptor;
  private quotas = new Map<ProviderType, QuotaLimit>();

  private constructor() {
    this.quotas.set(ProviderType.MOCK, {
      dailyRequests: 10000,
      requestsUsedToday: 0,
      dailyTokens: 1000000,
      tokensUsedToday: 0,
      lastReset: new Date().toISOString()
    });

    this.quotas.set(ProviderType.GEMINI_FLASH, {
      dailyRequests: 1000, // Safe buffer under 1,500 free RPD
      requestsUsedToday: 0,
      dailyTokens: 500000,
      tokensUsedToday: 0,
      lastReset: new Date().toISOString()
    });

    this.quotas.set(ProviderType.GROQ_LLAMA, {
      dailyRequests: 1000,
      requestsUsedToday: 0,
      dailyTokens: 500000,
      tokensUsedToday: 0,
      lastReset: new Date().toISOString()
    });
  }

  public static getInstance(): CostAndQuotaInterceptor {
    if (!CostAndQuotaInterceptor.instance) {
      CostAndQuotaInterceptor.instance = new CostAndQuotaInterceptor();
    }
    return CostAndQuotaInterceptor.instance;
  }

  public assertCanExecute(provider: ProviderType): void {
    const quota = this.quotas.get(provider);
    if (!quota) {
      throw new Error(`ZERO_COST_GUARD: Unknown provider ${provider} blocked.`);
    }

    if (quota.requestsUsedToday >= quota.dailyRequests) {
      throw new Error(
        `QUOTA_EXHAUSTED: Daily request limit of ${quota.dailyRequests} reached for ${provider}. Operations paused.`
      );
    }

    if (quota.tokensUsedToday >= quota.dailyTokens) {
      throw new Error(
        `QUOTA_EXHAUSTED: Daily token limit of ${quota.dailyTokens} reached for ${provider}. Operations paused.`
      );
    }
  }

  public recordUsage(provider: ProviderType, tokens = 0): void {
    const quota = this.quotas.get(provider);
    if (quota) {
      quota.requestsUsedToday += 1;
      quota.tokensUsedToday += tokens;
    }
  }

  public getQuota(provider: ProviderType): QuotaLimit | undefined {
    return this.quotas.get(provider);
  }
}

export const costInterceptor = CostAndQuotaInterceptor.getInstance();
