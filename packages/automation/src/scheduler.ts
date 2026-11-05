import { killSwitch } from '@ai-command-center/security';
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

export class AutonomousSchedulerEngine {
  private scheduledTasks = new Map<string, ScheduledTaskDefinition>();
  private executedRuns = new Set<string>(); // Set of `${taskId}:${timestampMinute}` to prevent duplicates

  public registerTask(task: ScheduledTaskDefinition): void {
    this.scheduledTasks.set(task.id, task);
  }

  public shouldExecute(taskId: string, currentMinuteTimestamp: string): boolean {
    killSwitch.assertOperational();

    const task = this.scheduledTasks.get(taskId);
    if (!task || !task.isActive) {
      return false;
    }

    const idempotencyKey = `${taskId}:${currentMinuteTimestamp}`;
    if (this.executedRuns.has(idempotencyKey)) {
      return false; // Prevent duplicate run in the same minute
    }

    return true;
  }

  public markExecuted(taskId: string, currentMinuteTimestamp: string): BaseTaskPayload {
    killSwitch.assertOperational();

    const task = this.scheduledTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const idempotencyKey = `${taskId}:${currentMinuteTimestamp}`;
    this.executedRuns.add(idempotencyKey);
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

export const schedulerEngine = new AutonomousSchedulerEngine();
