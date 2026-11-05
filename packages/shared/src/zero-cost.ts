export enum ProviderClassification {
  FREE = 'FREE',
  PAID = 'PAID',
  SELF_HOSTED = 'SELF_HOSTED',
  INTERNAL = 'INTERNAL'
}

export enum CostApprovalStatus {
  NOT_REQUESTED = 'NOT_REQUESTED',
  APPROVED_ZERO_COST = 'APPROVED_ZERO_COST',
  REJECTED = 'REJECTED'
}

export interface ZeroCostRegistryEntry {
  providerId: string;
  name: string;
  classification: ProviderClassification;
  costApprovalStatus: CostApprovalStatus;
  maxDailyRequests: number;
  currentDailyRequests: number;
  rateLimitRPM: number;
  isBlocked: boolean;
  hardSpendingLimitUSD: 0; // Strictly zero dollar limit
  lastResetAt: Date;
}

export interface ZeroCostInterceptorPolicy {
  blockAllPaidServices: true;
  maxTokensPerOutboundCall: number;
  ownerNotificationThresholdPercent: number; // e.g. 90%
}
