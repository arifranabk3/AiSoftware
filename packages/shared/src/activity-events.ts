import { z } from 'zod';

export enum ActivityEventType {
  COMMAND_RECEIVED = 'COMMAND_RECEIVED',
  TASK_CREATED = 'TASK_CREATED',
  TASK_DISPATCHED = 'TASK_DISPATCHED',
  JOB_QUEUED = 'JOB_QUEUED',
  JOB_STARTED = 'JOB_STARTED',
  AGENT_ASSIGNED = 'AGENT_ASSIGNED',
  AGENT_WORKING = 'AGENT_WORKING',
  AI_REQUEST_STARTED = 'AI_REQUEST_STARTED',
  AI_REQUEST_COMPLETED = 'AI_REQUEST_COMPLETED',
  AI_REQUEST_FAILED = 'AI_REQUEST_FAILED',
  TASK_PROGRESS = 'TASK_PROGRESS',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_FAILED = 'TASK_FAILED',
  TASK_RETRIED = 'TASK_RETRIED',
  TASK_CANCELLED = 'TASK_CANCELLED',
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED',
  APPROVAL_GRANTED = 'APPROVAL_GRANTED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
  EXTERNAL_ACTION_REQUESTED = 'EXTERNAL_ACTION_REQUESTED',
  EXTERNAL_ACTION_COMPLETED = 'EXTERNAL_ACTION_COMPLETED',
  KILL_SWITCH_ACTIVATED = 'KILL_SWITCH_ACTIVATED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_RECOVERED = 'SYSTEM_RECOVERED'
}

export const ActivityEventTypeSchema = z.nativeEnum(ActivityEventType);

export const ActivityEventSchema = z.object({
  eventId: z.string().min(1),
  timestamp: z.string().datetime(),
  correlationId: z.string().min(1),
  userId: z.string().optional(),
  taskId: z.string().optional(),
  jobId: z.string().optional(),
  queueName: z.string().optional(),
  departmentId: z.string().optional(),
  agentId: z.string().optional(),
  eventType: ActivityEventTypeSchema,
  action: z.string().min(1),
  status: z.enum(['waiting', 'active', 'completed', 'failed', 'delayed', 'paused', 'cancelled', 'info', 'warning', 'error']),
  message: z.string().min(1),
  provider: z.string().optional(),
  model: z.string().optional(),
  durationMs: z.number().nonnegative().optional(),
  retryCount: z.number().int().nonnegative().optional(),
  approvalId: z.string().optional(),
  errorCode: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.date().optional()
});

export type ActivityEvent = z.infer<typeof ActivityEventSchema>;

export interface ActivityFilterOptions {
  startDate?: string;
  endDate?: string;
  taskId?: string;
  jobId?: string;
  departmentId?: string;
  agentId?: string;
  eventType?: ActivityEventType;
  status?: string;
  correlationId?: string;
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityStatsSummary {
  totalEvents: number;
  eventCountsByType: Record<string, number>;
  activeJobsCount: number;
  failedJobsCount: number;
  pendingApprovalsCount: number;
  lastEventTimestamp?: string;
}

