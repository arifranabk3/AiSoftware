import { Db, Collection } from 'mongodb';
import { ActivityEvent, ActivityEventType, ActivityFilterOptions } from '@ai-command-center/shared';
import { redactSensitiveData } from '@ai-command-center/security';
import { PaginatedResult } from './models.js';

export class ActivityRepository {
  private collection: Collection<ActivityEvent>;

  constructor(private db: Db) {
    this.collection = db.collection<ActivityEvent>('activity_events');
  }

  /**
   * Appends an event idempotently using stable eventId as unique key.
   * Redacts sensitive data before persisting.
   */
  public async logEvent(event: ActivityEvent): Promise<{ recorded: boolean; event: ActivityEvent }> {
    const sanitizedMetadata = redactSensitiveData(event.metadata || {});
    const sanitizedMessage = redactSensitiveData(event.message);

    const docToPersist: ActivityEvent = {
      ...event,
      message: sanitizedMessage,
      metadata: sanitizedMetadata,
      createdAt: event.createdAt || new Date()
    };

    try {
      await this.collection.updateOne(
        { eventId: event.eventId },
        { $setOnInsert: { ...docToPersist, _id: event.eventId as any } },
        { upsert: true }
      );
      return { recorded: true, event: docToPersist };
    } catch (err: unknown) {
      // If duplicate key error (E11000), ignore as idempotent success
      if ((err as { code?: number }).code === 11000) {
        return { recorded: false, event: docToPersist };
      }
      throw err;
    }
  }

  /**
   * Retrieves paginated activity events with date filtering and query options.
   */
  public async listEvents(options: ActivityFilterOptions = {}): Promise<PaginatedResult<ActivityEvent>> {
    const limit = Math.min(options.limit || 50, 200);
    const skip = options.skip || 0;
    const sortField = options.sortBy || 'timestamp';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = {};

    if (options.eventType) query.eventType = options.eventType;
    if (options.status) query.status = options.status;
    if (options.departmentId) query.departmentId = options.departmentId;
    if (options.agentId) query.agentId = options.agentId;
    if (options.taskId) query.taskId = options.taskId;
    if (options.jobId) query.jobId = options.jobId;
    if (options.correlationId) query.correlationId = options.correlationId;

    if (options.startDate || options.endDate) {
      query.timestamp = {};
      if (options.startDate) {
        (query.timestamp as Record<string, unknown>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.timestamp as Record<string, unknown>).$lte = options.endDate;
      }
    }

    const [items, total] = await Promise.all([
      this.collection
        .find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray(),
      this.collection.countDocuments(query)
    ]);

    return {
      items: items.map((doc) => {
        const { _id, ...rest } = doc as any;
        return rest;
      }),
      total,
      limit,
      skip
    };
  }

  /**
   * Retrieves task execution timeline in chronological order.
   */
  public async getTaskTimeline(taskId: string): Promise<ActivityEvent[]> {
    const events = await this.collection
      .find({ taskId })
      .sort({ timestamp: 1 })
      .toArray();

    return events.map((doc) => {
      const { _id, ...rest } = doc as any;
      return rest;
    });
  }

  /**
   * Aggregate stats for dashboard telemetry
   */
  public async getTelemetrySummary(): Promise<{
    totalEvents: number;
    activeJobsCount: number;
    failedJobsCount: number;
    completedTasksCount: number;
    recentEvents: ActivityEvent[];
  }> {
    const [totalEvents, activeJobs, failedJobs, completedTasks, recentDocs] = await Promise.all([
      this.collection.countDocuments(),
      this.collection.countDocuments({ status: 'active' }),
      this.collection.countDocuments({ status: 'failed' }),
      this.collection.countDocuments({ eventType: ActivityEventType.TASK_COMPLETED }),
      this.collection.find().sort({ timestamp: -1 }).limit(10).toArray()
    ]);

    return {
      totalEvents,
      activeJobsCount: activeJobs,
      failedJobsCount: failedJobs,
      completedTasksCount: completedTasks,
      recentEvents: recentDocs.map((doc) => {
        const { _id, ...rest } = doc as any;
        return rest;
      })
    };
  }
}
