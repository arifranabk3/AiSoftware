import { Queue } from 'bullmq';
import { redisManager } from './redis.js';
import { CommandQueueName, DEFAULT_JOB_OPTIONS, BaseTaskPayload } from './queues.js';
import { activityService } from './activity-service.js';
import { ActivityEventType } from '@ai-command-center/shared';

export interface DispatchResult {
  dispatched: boolean;
  jobId?: string;
  error?: string;
}

export class TaskDispatcherService {
  private static instance: TaskDispatcherService;
  private queues: Map<string, Queue> = new Map();

  private constructor() {}

  public static getInstance(): TaskDispatcherService {
    if (!TaskDispatcherService.instance) {
      TaskDispatcherService.instance = new TaskDispatcherService();
    }
    return TaskDispatcherService.instance;
  }

  public getQueue(queueName: string = CommandQueueName.CEO_TASKS): Queue {
    if (!this.queues.has(queueName)) {
      const client = redisManager.getClient();
      const queue = new Queue(queueName, {
        connection: client.duplicate()
      });
      this.queues.set(queueName, queue);
    }
    return this.queues.get(queueName)!;
  }

  /**
   * Dispatches a task to BullMQ with a stable taskId as the BullMQ jobId (ensuring Redis-level idempotency).
   * Emits telemetry events upon dispatch or failure.
   */
  public async dispatchCeoTask(payload: BaseTaskPayload): Promise<DispatchResult> {
    try {
      const queue = this.getQueue(CommandQueueName.CEO_TASKS);
      const job = await queue.add('execute_objective_task', payload, {
        jobId: payload.taskId, // Stable BullMQ job ID guarantees Redis-level idempotency
        attempts: DEFAULT_JOB_OPTIONS.attempts,
        backoff: DEFAULT_JOB_OPTIONS.backoff,
        removeOnComplete: DEFAULT_JOB_OPTIONS.removeOnComplete,
        removeOnFail: DEFAULT_JOB_OPTIONS.removeOnFail
      });

      // Emit real telemetry event for JOB_QUEUED
      await activityService.emitEvent({
        correlationId: payload.objectiveId || payload.taskId,
        taskId: payload.taskId,
        jobId: job.id,
        queueName: CommandQueueName.CEO_TASKS,
        departmentId: payload.departmentId,
        agentId: payload.specialistId,
        eventType: ActivityEventType.JOB_QUEUED,
        action: payload.action,
        status: 'waiting',
        message: `Task ${payload.taskId} queued in ${CommandQueueName.CEO_TASKS}`,
        metadata: {
          idempotencyKey: payload.idempotencyKey,
          priority: payload.priority
        }
      });

      return {
        dispatched: true,
        jobId: job.id
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // Emit system error event
      await activityService.emitEvent({
        correlationId: payload.objectiveId || payload.taskId,
        taskId: payload.taskId,
        queueName: CommandQueueName.CEO_TASKS,
        departmentId: payload.departmentId,
        agentId: payload.specialistId,
        eventType: ActivityEventType.TASK_FAILED,
        action: payload.action,
        status: 'failed',
        message: `Failed to dispatch task ${payload.taskId} to queue: ${msg}`,
        errorCode: 'DISPATCH_ERROR',
        metadata: { error: msg }
      });

      return {
        dispatched: false,
        error: msg
      };
    }
  }


  public async closeAll(): Promise<void> {
    for (const [name, queue] of this.queues.entries()) {
      try {
        await queue.close();
      } catch {
        // Ignore close errors during shutdown
      }
    }
    this.queues.clear();
  }
}

export const taskDispatcherService = TaskDispatcherService.getInstance();

