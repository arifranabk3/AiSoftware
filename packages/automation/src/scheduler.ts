import { Db } from 'mongodb';
import { distributedKillSwitch } from '@ai-command-center/security';
import { BaseTaskPayload } from './queues.js';

export interface ScheduledTaskDefinition {
  id: string;
  name: string;
  cronPattern: string;
  specialistId: string;
  departmentId: string;
  action: string;
  payload: Record<string, unknown>;
  isActive: boolean;
  lastRunAt?: string;
}

export interface DistributedExecutionLockDocument {
  _id: string; // `${taskId}:${timestampMinute}`
  taskId: string;
  lockedAt: Date;
  expiresAt: Date;
  lockedBy: string; // Worker / process ID
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
}

export class DistributedSchedulerEngine {
  private scheduledTasks = new Map<string, ScheduledTaskDefinition>();
  private activeDb: Db | null = null;
  private localLocks = new Set<string>();

  public setDb(db: Db): void {
    this.activeDb = db;
  }

  public registerTask(task: ScheduledTaskDefinition): void {
    this.scheduledTasks.set(task.id, task);
  }

  /**
   * Distributed atomic lock acquisition:
   * Uses MongoDB unique index on `_id` (`${taskId}:${timestampMinute}`) to guarantee that
   * only ONE process across multiple nodes can acquire the execution lease.
   */
  public async acquireExecutionLease(
    taskId: string,
    currentMinuteTimestamp: string,
    workerId: string
  ): Promise<boolean> {
    await distributedKillSwitch.verifyOperational();

    const task = this.scheduledTasks.get(taskId);
    if (!task || !task.isActive) {
      return false;
    }

    const lockKey = `${taskId}:${currentMinuteTimestamp}`;

    if (this.activeDb) {
      try {
        const collection =
          this.activeDb.collection<DistributedExecutionLockDocument>('scheduler_locks');
        const lockDoc: DistributedExecutionLockDocument = {
          _id: lockKey,
          taskId,
          lockedAt: new Date(),
          expiresAt: new Date(Date.now() + 60000), // 1-minute lease
          lockedBy: workerId,
          status: 'EXECUTING'
        };

        // Atomic insertion: fails with duplicate key error if another process already acquired it
        await collection.insertOne(lockDoc);
        return true;
      } catch (err: unknown) {
        // E11000 duplicate key error means another scheduler instance already locked this execution
        return false;
      }
    }

    // Fallback for standalone in-memory mode
    if (this.localLocks.has(lockKey)) {
      return false;
    }
    this.localLocks.add(lockKey);
    return true;
  }

  public markExecuted(taskId: string, currentMinuteTimestamp: string): BaseTaskPayload {
    distributedKillSwitch.assertOperational();

    const task = this.scheduledTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const idempotencyKey = `${taskId}:${currentMinuteTimestamp}`;
    task.lastRunAt = new Date().toISOString();

    return {
      taskId: `exec_${task.id}_${Date.now()}`,
      specialistId: task.specialistId,
      departmentId: task.departmentId,
      action: task.action,
      idempotencyKey,
      priority: 2,
      data: task.payload,
      createdAt: new Date().toISOString()
    };
  }

  public getTasks(): ScheduledTaskDefinition[] {
    return Array.from(this.scheduledTasks.values());
  }
}

export const distributedScheduler = new DistributedSchedulerEngine();
export const schedulerEngine = distributedScheduler; // Backward compatibility
