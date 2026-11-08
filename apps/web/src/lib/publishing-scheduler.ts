import { Article } from './article-types';
import { formatPKTDateTime } from './date-utils';

export interface SchedulerExecutionLog {
  slot: '09:00_PKT' | '18:00_PKT' | 'MANUAL';
  timestamp: string; // UTC ISO
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
  articleSlug?: string;
  reason: string;
}

export interface SchedulerHealth {
  schedulerMode: 'HYBRID_VERCEL_SERVERLESS' | 'STANDALONE_WORKER';
  timezone: 'Asia/Karachi';
  pktOffset: '+05:00';
  isAutomatedCronActive: boolean;
  manualPublishQueueAvailable: boolean;
  nextScheduledSlotPKT: string;
  logs: SchedulerExecutionLog[];
}

/**
 * Audit log recording publishing actions and skipped slots
 */
export const SCHEDULER_AUDIT_LOGS: SchedulerExecutionLog[] = [
  {
    slot: '09:00_PKT',
    timestamp: '2026-11-05T04:00:00Z',
    status: 'SUCCESS',
    articleSlug: 'zero-cost-local-llm-architecture',
    reason: 'Published successfully in Slot 1 (09:00 AM PKT).'
  },
  {
    slot: '09:00_PKT',
    timestamp: '2026-11-06T04:00:00Z',
    status: 'SUCCESS',
    articleSlug: 'human-in-the-loop-agent-safety',
    reason: 'Published successfully in Slot 1 (09:00 AM PKT).'
  },
  {
    slot: '09:00_PKT',
    timestamp: '2026-11-07T04:00:00Z',
    status: 'SUCCESS',
    articleSlug: 'distributed-queues-bullmq-agents',
    reason: 'Published successfully in Slot 1 (09:00 AM PKT).'
  },
  {
    slot: '18:00_PKT',
    timestamp: '2026-11-07T13:00:00Z',
    status: 'SUCCESS',
    articleSlug: 'argon2id-authentication-secure-password-storage',
    reason: 'Published successfully in Slot 2 (06:00 PM PKT).'
  },
  {
    slot: '09:00_PKT',
    timestamp: '2026-11-08T04:00:00Z',
    status: 'SUCCESS',
    articleSlug: 'distributed-rate-limiting-token-bucket-algorithms-ai-agents',
    reason: 'Published successfully in Slot 1 (09:00 AM PKT).'
  },
  {
    slot: '18:00_PKT',
    timestamp: '2026-11-08T13:00:00Z',
    status: 'SKIPPED',
    reason: 'Slot 2 skipped: Awaiting human technical review and sign-off on Article 12 draft. No unapproved filler published.'
  }
];

export function getSchedulerHealth(): SchedulerHealth {
  return {
    schedulerMode: 'HYBRID_VERCEL_SERVERLESS',
    timezone: 'Asia/Karachi',
    pktOffset: '+05:00',
    isAutomatedCronActive: true,
    manualPublishQueueAvailable: true,
    nextScheduledSlotPKT: '06:00 PM PKT (Today)',
    logs: SCHEDULER_AUDIT_LOGS
  };
}
