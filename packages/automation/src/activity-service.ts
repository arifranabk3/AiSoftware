import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import {
  ActivityEvent,
  ActivityEventType,
  ActivityEventSchema
} from '@ai-command-center/shared';
import { redactSensitiveData } from '@ai-command-center/security';
import { mongoDbService, ActivityRepository } from '@ai-command-center/database';

export class CentralizedActivityService extends EventEmitter {
  private static instance: CentralizedActivityService;
  private inMemoryOutbox: ActivityEvent[] = [];
  private readonly maxInMemoryHistory = 200;

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  public static getInstance(): CentralizedActivityService {
    if (!CentralizedActivityService.instance) {
      CentralizedActivityService.instance = new CentralizedActivityService();
    }
    return CentralizedActivityService.instance;
  }

  /**
   * Records an activity event with validation, redaction, and database persistence.
   * Emits live event for SSE / WebSockets subscribers.
   */
  public async emitEvent(
    params: Omit<ActivityEvent, 'eventId' | 'timestamp' | 'createdAt' | 'metadata'> & {
      eventId?: string;
      timestamp?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ActivityEvent> {
    const rawEvent: ActivityEvent = {
      eventId: params.eventId || `evt_${Date.now()}_${randomUUID().replace(/-/g, '').slice(0, 8)}`,
      timestamp: params.timestamp || new Date().toISOString(),
      correlationId: params.correlationId,
      userId: params.userId,
      taskId: params.taskId,
      jobId: params.jobId,
      queueName: params.queueName,
      departmentId: params.departmentId,
      agentId: params.agentId,
      eventType: params.eventType,
      action: params.action,
      status: params.status,
      message: params.message,
      provider: params.provider,
      model: params.model,
      durationMs: params.durationMs,
      retryCount: params.retryCount,
      approvalId: params.approvalId,
      errorCode: params.errorCode,
      metadata: params.metadata || {}
    };

    // 1. Zod strict validation
    const parsed = ActivityEventSchema.parse(rawEvent);

    // 2. Sensitive data redaction
    const sanitized: ActivityEvent = {
      ...parsed,
      message: redactSensitiveData(parsed.message),
      metadata: redactSensitiveData(parsed.metadata || {})
    };

    // 3. Keep in in-memory ring buffer for immediate dashboard streaming
    this.inMemoryOutbox.unshift(sanitized);
    if (this.inMemoryOutbox.length > this.maxInMemoryHistory) {
      this.inMemoryOutbox.pop();
    }

    // 4. Persistent Storage (MongoDB)
    try {
      if (mongoDbService.getStatus().isConnected) {
        const db = mongoDbService.getDb();
        const repo = new ActivityRepository(db);
        await repo.logEvent(sanitized);
      }
    } catch (err: unknown) {
      console.warn('[ActivityService] Warning: Failed to persist event to MongoDB:', err);
    }

    // 5. Emit live event to real-time subscribers
    this.emit('activity', sanitized);
    this.emit(`activity:${sanitized.eventType}`, sanitized);
    if (sanitized.taskId) {
      this.emit(`activity:task:${sanitized.taskId}`, sanitized);
    }

    return sanitized;
  }

  /**
   * Retrieves recent in-memory events for fast reconnect / cold starts
   */
  public getRecentMemoryEvents(limit = 50): ActivityEvent[] {
    return this.inMemoryOutbox.slice(0, limit);
  }

  /**
   * Clears in-memory outbox (useful for isolated unit testing)
   */
  public clearMemoryOutbox(): void {
    this.inMemoryOutbox = [];
  }
}

export const activityService = CentralizedActivityService.getInstance();
