export enum CommandQueueName {
  CEO_TASKS = 'ceo_orchestrator_tasks',
  SPECIALIST_TASKS = 'specialist_tasks',
  BUSINESS_DISCOVERY = 'business_discovery',
  RESEARCH = 'research_operations',
  CONTENT_PRODUCTION = 'content_production',
  SEO_OPERATIONS = 'seo_operations',
  PUBLISHING = 'publishing_operations',
  APPLICATION_MANAGEMENT = 'application_management',
  NOTIFICATIONS = 'notifications_dispatch',
  SYSTEM_MAINTENANCE = 'system_maintenance'
}

export interface BaseTaskPayload {
  taskId: string;
  specialistId: string;
  departmentId: string;
  action: string;
  idempotencyKey: string;
  priority: number;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface QueueJobConfig {
  attempts: number;
  backoff: {
    type: 'exponential';
    delay: number;
  };
  removeOnComplete: boolean | number;
  removeOnFail: boolean | number;
}

export const DEFAULT_JOB_OPTIONS: QueueJobConfig = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  removeOnComplete: 100,
  removeOnFail: 500
};
