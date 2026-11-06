import { Db, Collection } from 'mongodb';
import {
  BusinessObjectiveDocument,
  OrchestratorTaskDocument,
  ApprovalRequestDocument,
  ObjectiveStatus,
  TaskStatus,
  ApprovalStatus,
  PaginationOptions,
  PaginatedResult
} from './models.js';

export class ObjectiveRepository {
  private collection: Collection<BusinessObjectiveDocument>;

  constructor(private db: Db) {
    this.collection = db.collection<BusinessObjectiveDocument>('business_objectives');
  }

  public async create(
    doc: Omit<BusinessObjectiveDocument, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<BusinessObjectiveDocument> {
    const now = new Date();
    const fullDoc: BusinessObjectiveDocument = {
      _id: doc.objectiveId,
      ...doc,
      createdAt: now,
      updatedAt: now
    };
    await this.collection.insertOne(fullDoc);
    return fullDoc;
  }

  public async findById(objectiveId: string): Promise<BusinessObjectiveDocument | null> {
    return this.collection.findOne({ objectiveId });
  }

  public async list(
    filter: Partial<BusinessObjectiveDocument> = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<BusinessObjectiveDocument>> {
    const limit = Math.min(options.limit || 50, 100);
    const skip = options.skip || 0;
    const sortField = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(filter)) {
      if (v !== undefined) query[k] = v;
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

    return { items, total, limit, skip };
  }

  public async updateStatus(
    objectiveId: string,
    newStatus: ObjectiveStatus,
    currentStatus?: ObjectiveStatus
  ): Promise<boolean> {
    const now = new Date();
    const query: Record<string, unknown> = { objectiveId };
    if (currentStatus) {
      query.status = currentStatus;
    }

    const update: Record<string, unknown> = {
      $set: {
        status: newStatus,
        updatedAt: now
      }
    };

    if (newStatus === ObjectiveStatus.ACTIVE) {
      update.$set = { ...((update.$set as object) || {}), startedAt: now };
    } else if (newStatus === ObjectiveStatus.COMPLETED || newStatus === ObjectiveStatus.FAILED) {
      update.$set = { ...((update.$set as object) || {}), completedAt: now };
    }

    const res = await this.collection.updateOne(query, update);
    return res.modifiedCount > 0;
  }

  public async cancel(objectiveId: string, reason?: string): Promise<boolean> {
    const now = new Date();
    const res = await this.collection.updateOne(
      {
        objectiveId,
        status: { $nin: [ObjectiveStatus.COMPLETED, ObjectiveStatus.CANCELLED] }
      },
      {
        $set: {
          status: ObjectiveStatus.CANCELLED,
          updatedAt: now,
          'metadata.cancelReason': reason || 'Owner Cancelled'
        }
      }
    );
    return res.modifiedCount > 0;
  }
}

export class OrchestratorTaskRepository {
  private collection: Collection<OrchestratorTaskDocument>;

  constructor(private db: Db) {
    this.collection = db.collection<OrchestratorTaskDocument>('orchestrator_tasks');
  }

  public async create(
    doc: Omit<OrchestratorTaskDocument, '_id' | 'createdAt' | 'updatedAt' | 'attemptCount'>
  ): Promise<OrchestratorTaskDocument> {
    const now = new Date();
    const fullDoc: OrchestratorTaskDocument = {
      _id: doc.taskId,
      ...doc,
      attemptCount: 0,
      createdAt: now,
      updatedAt: now
    };
    await this.collection.insertOne(fullDoc);
    return fullDoc;
  }

  public async findById(taskId: string): Promise<OrchestratorTaskDocument | null> {
    return this.collection.findOne({ taskId });
  }

  public async list(
    filter: Partial<OrchestratorTaskDocument> = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<OrchestratorTaskDocument>> {
    const limit = Math.min(options.limit || 50, 100);
    const skip = options.skip || 0;
    const sortField = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(filter)) {
      if (v !== undefined) query[k] = v;
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

    return { items, total, limit, skip };
  }

  public async updateStatus(
    taskId: string,
    newStatus: TaskStatus,
    currentStatus?: TaskStatus,
    outputOrError?: { output?: Record<string, unknown>; error?: string }
  ): Promise<boolean> {
    const now = new Date();
    const query: Record<string, unknown> = { taskId };
    if (currentStatus) {
      query.status = currentStatus;
    }

    const setFields: Record<string, unknown> = {
      status: newStatus,
      updatedAt: now
    };

    if (newStatus === TaskStatus.RUNNING) {
      setFields.startedAt = now;
    } else if (newStatus === TaskStatus.COMPLETED || newStatus === TaskStatus.FAILED) {
      setFields.completedAt = now;
    }

    if (outputOrError?.output) {
      setFields.output = outputOrError.output;
    }
    if (outputOrError?.error) {
      setFields.error = outputOrError.error;
    }

    const update: Record<string, unknown> = { $set: setFields };
    if (newStatus === TaskStatus.RUNNING) {
      update.$inc = { attemptCount: 1 };
    }

    const res = await this.collection.updateOne(query, update);
    return res.modifiedCount > 0;
  }

  public async cancel(taskId: string, reason?: string): Promise<boolean> {
    const now = new Date();
    const res = await this.collection.updateOne(
      {
        taskId,
        status: { $nin: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] }
      },
      {
        $set: {
          status: TaskStatus.CANCELLED,
          updatedAt: now,
          error: reason || 'Task Cancelled'
        }
      }
    );
    return res.modifiedCount > 0;
  }

  /**
   * Recovery & Resumption Query:
   * Finds all tasks that were interrupted or require recovery after restart.
   */
  public async findUnfinishedTasks(): Promise<{
    pending: OrchestratorTaskDocument[];
    queued: OrchestratorTaskDocument[];
    interruptedRunning: OrchestratorTaskDocument[];
    waitingApproval: OrchestratorTaskDocument[];
  }> {
    const [pending, queued, interruptedRunning, waitingApproval] = await Promise.all([
      this.collection.find({ status: TaskStatus.PENDING }).toArray(),
      this.collection.find({ status: TaskStatus.QUEUED }).toArray(),
      this.collection.find({ status: TaskStatus.RUNNING }).toArray(),
      this.collection.find({ status: TaskStatus.WAITING_APPROVAL }).toArray()
    ]);

    return { pending, queued, interruptedRunning, waitingApproval };
  }

  /**
   * Resets interrupted RUNNING tasks back to QUEUED (if attempts < maxAttempts) or FAILED
   */
  public async recoverInterruptedRunningTasks(): Promise<{
    requeued: number;
    failed: number;
  }> {
    const runningTasks = await this.collection.find({ status: TaskStatus.RUNNING }).toArray();
    let requeued = 0;
    let failed = 0;
    const now = new Date();

    for (const task of runningTasks) {
      if (task.attemptCount < task.maxAttempts) {
        await this.collection.updateOne(
          { taskId: task.taskId, status: TaskStatus.RUNNING },
          {
            $set: {
              status: TaskStatus.QUEUED,
              updatedAt: now,
              error: 'Interrupted by server restart - automatically requeued'
            }
          }
        );
        requeued++;
      } else {
        await this.collection.updateOne(
          { taskId: task.taskId, status: TaskStatus.RUNNING },
          {
            $set: {
              status: TaskStatus.FAILED,
              updatedAt: now,
              completedAt: now,
              error: 'Max retry attempts exhausted after restart interruption'
            }
          }
        );
        failed++;
      }
    }

    return { requeued, failed };
  }
}

export class ApprovalRepository {
  private collection: Collection<ApprovalRequestDocument>;

  constructor(private db: Db) {
    this.collection = db.collection<ApprovalRequestDocument>('approval_requests');
  }

  public async create(
    doc: Omit<ApprovalRequestDocument, '_id' | 'requestedAt'>
  ): Promise<ApprovalRequestDocument> {
    const now = new Date();
    const fullDoc: ApprovalRequestDocument = {
      _id: doc.approvalId,
      ...doc,
      requestedAt: now
    };
    await this.collection.insertOne(fullDoc);
    return fullDoc;
  }

  public async findById(approvalId: string): Promise<ApprovalRequestDocument | null> {
    return this.collection.findOne({ approvalId });
  }

  public async findByTaskId(taskId: string): Promise<ApprovalRequestDocument | null> {
    return this.collection.findOne({ taskId }, { sort: { requestedAt: -1 } });
  }

  public async list(
    filter: Partial<ApprovalRequestDocument> = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<ApprovalRequestDocument>> {
    const limit = Math.min(options.limit || 50, 100);
    const skip = options.skip || 0;
    const sortField = options.sortBy || 'requestedAt';
    const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

    const query: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(filter)) {
      if (v !== undefined) query[k] = v;
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

    return { items, total, limit, skip };
  }

  public async recordDecision(
    approvalId: string,
    decision: ApprovalStatus.APPROVED | ApprovalStatus.REJECTED,
    reviewedBy: string,
    decisionReason?: string
  ): Promise<boolean> {
    const now = new Date();
    const res = await this.collection.updateOne(
      {
        approvalId,
        status: ApprovalStatus.PENDING
      },
      {
        $set: {
          status: decision,
          reviewedAt: now,
          reviewedBy,
          decisionReason: decisionReason || 'Owner decision recorded'
        }
      }
    );
    return res.modifiedCount > 0;
  }

  public async expire(approvalId: string): Promise<boolean> {
    const now = new Date();
    const res = await this.collection.updateOne(
      {
        approvalId,
        status: ApprovalStatus.PENDING
      },
      {
        $set: {
          status: ApprovalStatus.EXPIRED,
          reviewedAt: now,
          decisionReason: 'Approval request expired'
        }
      }
    );
    return res.modifiedCount > 0;
  }
}

