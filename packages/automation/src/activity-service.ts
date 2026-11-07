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
  private pendingRetryQueue: ActivityEvent[] = [];
  private readonly maxInMemoryHistory = 200;
  private readonly maxPendingRetries = 500;
  private isFlushingRetries = false;

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
   * Flushes any pending unpersisted events once MongoDB reconnects.
   */
  public async flushPendingRetries(): Promise<number> {
    if (this.isFlushingRetries || this.pendingRetryQueue.length === 0) return 0;
    if (!mongoDbService.getStatus().isConnected) return 0;

    this.isFlushingRetries = true;
    let flushedCount = 0;
    try {
      const db = mongoDbService.getDb();
      const repo = new ActivityRepository(db);

      while (this.pendingRetryQueue.length > 0 && mongoDbService.getStatus().isConnected) {
        const event = this.pendingRetryQueue[0];
        await repo.logEvent(event);
        this.pendingRetryQueue.shift();
        flushedCount++;
      }
    } catch (err: unknown) {
      console.warn('[ActivityService] Retry flush paused due to connection error:', err);
    } finally {
      this.isFlushingRetries = false;
    }
    return flushedCount;
  }

  /**
   * Returns current pending retry count.
   */
  public getPendingRetryCount(): number {
    return this.pendingRetryQueue.length;
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

    // 4. Persistent Storage (MongoDB) with Outbox Resiliency
    try {
      if (mongoDbService.getStatus().isConnected) {
        const db = mongoDbService.getDb();
        const repo = new ActivityRepository(db);
        await repo.logEvent(sanitized);
        // Also flush any queued retry events if DB is healthy
        if (this.pendingRetryQueue.length > 0) {
          void this.flushPendingRetries();
        }
      } else {
        // Enqueue into pending retry queue if DB is disconnected
        if (this.pendingRetryQueue.length < this.maxPendingRetries) {
          this.pendingRetryQueue.push(sanitized);
        }
      }
    } catch (err: unknown) {
      console.warn('[ActivityService] Warning: Failed to persist event to MongoDB, queuing for retry:', err);
      if (this.pendingRetryQueue.length < this.maxPendingRetries) {
        this.pendingRetryQueue.push(sanitized);
      }
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
