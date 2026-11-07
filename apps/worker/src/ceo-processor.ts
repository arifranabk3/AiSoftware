import { Worker, Job } from 'bullmq';
import { distributedKillSwitch } from '@ai-command-center/security';
import {
  mongoDbService,
  ObjectiveRepository,
  OrchestratorTaskRepository,
  ApprovalRepository,
  TaskStatus,
  ObjectiveStatus,
  ApprovalStatus
} from '@ai-command-center/database';
import { ceoOrchestrator, CEOState } from '@ai-command-center/ai-engine';
import { DepartmentId, ActivityEventType } from '@ai-command-center/shared';
import {
  redisManager,
  CommandQueueName,
  BaseTaskPayload,
  workerRecoveryManager,
  activityService
} from '@ai-command-center/automation';

export interface ProcessorExecutionResult {
  status: 'COMPLETED' | 'WAITING_APPROVAL' | 'FAILED' | 'EMERGENCY_HALTED';
  taskId: string;
  objectiveId: string;
  result?: unknown;
  error?: string;
}

export class CeoQueueProcessor {
  private worker: Worker<BaseTaskPayload, ProcessorExecutionResult> | null = null;
  private isProcessing = false;

  public async start(): Promise<void> {
    if (this.worker) return;

    const redisClient = redisManager.getClient();

    this.worker = new Worker<BaseTaskPayload, ProcessorExecutionResult>(
      CommandQueueName.CEO_TASKS,
      async (job: Job<BaseTaskPayload, ProcessorExecutionResult>) => {
        return this.processJob(job);
      },
      {
        connection: redisClient.duplicate(),
        concurrency: 5
      }
    );

    this.worker.on('active', (job) => {
      activityService.emitEvent({
        correlationId: job.data.objectiveId || job.data.taskId,
        taskId: job.data.taskId,
        jobId: job.id,
        queueName: CommandQueueName.CEO_TASKS,
        departmentId: job.data.departmentId,
        agentId: job.data.specialistId,
        eventType: ActivityEventType.JOB_STARTED,
        action: job.data.action,
        status: 'active',
        message: `Worker picked up job ${job.id} for task ${job.data.taskId}`
      }).catch(() => {});
    });

    this.worker.on('completed', (job, result) => {
      activityService.emitEvent({
        correlationId: job.data.objectiveId || job.data.taskId,
        taskId: job.data.taskId,
        jobId: job.id,
        queueName: CommandQueueName.CEO_TASKS,
        departmentId: job.data.departmentId,
        agentId: job.data.specialistId,
        eventType: ActivityEventType.TASK_COMPLETED,
        action: job.data.action,
        status: 'completed',
        message: `Worker successfully completed task ${job.data.taskId}`,
        metadata: { result }
      }).catch(() => {});
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[CeoQueueProcessor] Job ${job?.id} permanently failed: ${err.message}`);
      if (job) {
        activityService.emitEvent({
          correlationId: job.data.objectiveId || job.data.taskId,
          taskId: job.data.taskId,
          jobId: job.id,
          queueName: CommandQueueName.CEO_TASKS,
          departmentId: job.data.departmentId,
          agentId: job.data.specialistId,
          eventType: ActivityEventType.TASK_FAILED,
          action: job.data.action,
          status: 'failed',
          message: `Worker failed executing task ${job.data.taskId}: ${err.message}`,
          errorCode: 'WORKER_JOB_FAILED',
          metadata: { error: err.message, attemptsMade: job.attemptsMade }
        }).catch(() => {});
      }
    });

    this.worker.on('error', (err) => {
      console.warn(`[CeoQueueProcessor] Worker internal error: ${err.message}`);
      activityService.emitEvent({
        correlationId: 'system',
        eventType: ActivityEventType.SYSTEM_ERROR,
        action: 'WORKER_INTERNAL_ERROR',
        status: 'error',
        message: `BullMQ Worker error: ${err.message}`,
        errorCode: 'WORKER_INTERNAL_ERROR',
        metadata: { error: err.message }
      }).catch(() => {});
    });
  }


  public async processJob(
    job: Job<BaseTaskPayload, ProcessorExecutionResult>
  ): Promise<ProcessorExecutionResult> {
    const payload = job.data;
    const { taskId, objectiveId } = payload;

    // 1. Enforce Emergency Kill-Switch Guard
    try {
      distributedKillSwitch.assertOperational();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[CeoQueueProcessor] Kill-switch frozen. Refusing execution of task ${taskId}: ${msg}`);
      throw new Error(`KILL_SWITCH_ACTIVE: ${msg}`); // Triggers retry/pause
    }

    const db = mongoDbService.getDb();
    const taskRepo = new OrchestratorTaskRepository(db);
    const objectiveRepo = new ObjectiveRepository(db);
    const approvalRepo = new ApprovalRepository(db);

    // 2. Fetch Task Record & Verify State
    const task = await taskRepo.findById(taskId);
    if (!task) {
      console.error(`[CeoQueueProcessor] Task ${taskId} not found in database. Aborting job.`);
      throw new Error(`TASK_NOT_FOUND: ${taskId}`);
    }

    // Idempotency check: If task is already completed or failed, do not re-execute
    if (task.status === TaskStatus.COMPLETED) {
      console.log(`[CeoQueueProcessor] Task ${taskId} is already COMPLETED. Returning cached result.`);
      return {
        status: 'COMPLETED',
        taskId,
        objectiveId: task.objectiveId,
        result: task.output
      };
    }

    const isResumedExecution = Boolean(payload.data?.isResumedExecution);

    if (task.status === TaskStatus.WAITING_APPROVAL && !isResumedExecution) {
      console.warn(`[CeoQueueProcessor] Task ${taskId} is WAITING_APPROVAL. Refusing automatic processing.`);
      return {
        status: 'WAITING_APPROVAL',
        taskId,
        objectiveId: task.objectiveId
      };
    }

    // 3. Transition Task to RUNNING atomically (increments attemptCount)
    await taskRepo.updateStatus(taskId, TaskStatus.RUNNING);

    // Emit AGENT_WORKING telemetry event
    activityService.emitEvent({
      correlationId: task.objectiveId || taskId,
      taskId,
      jobId: job.id,
      queueName: CommandQueueName.CEO_TASKS,
      departmentId: payload.departmentId,
      agentId: payload.specialistId || 'spec_ceo_orchestrator',
      eventType: ActivityEventType.AGENT_WORKING,
      action: payload.action || 'EXECUTE_OBJECTIVE',
      status: 'active',
      message: `Agent ${payload.specialistId || 'spec_ceo_orchestrator'} started working on task ${taskId}`,
      metadata: {
        attemptCount: task.attemptCount + 1,
        title: task.title
      }
    }).catch(() => {});

    // 4. Execute via CEO Orchestrator
    try {
      const execResult = await ceoOrchestrator.executeObjective({
        id: task.objectiveId,
        title: (payload.data.title as string) || task.title,
        description: (payload.data.description as string) || task.description,
        targetDepartment: (payload.departmentId as DepartmentId) || DepartmentId.EXECUTIVE,
        parameters: payload.data,
        preferredSpecialistId: payload.specialistId,
        requiresOwnerApproval: isResumedExecution ? false : Boolean(payload.data.requiresOwnerApproval)
      });

      // Handle Emergency Halt during execution
      if (execResult.status === 'EMERGENCY_HALTED') {
        await taskRepo.updateStatus(taskId, TaskStatus.FAILED, TaskStatus.RUNNING, {
          error: `Execution halted by kill-switch: ${execResult.error}`
        });
        throw new Error(`EMERGENCY_HALTED: ${execResult.error}`);
      }

      // Handle Human-in-the-Loop Owner Approval Required
      if (execResult.status === 'AWAITING_OWNER_APPROVAL') {
        await taskRepo.updateStatus(taskId, TaskStatus.WAITING_APPROVAL, TaskStatus.RUNNING);

        // Create Approval Request Record
        const approvalId = `appr_${taskId}`;
        await approvalRepo.create({
          approvalId,
          objectiveId: task.objectiveId,
          taskId,
          requestedBy: execResult.assignedSpecialistId || 'spec_ceo_orchestrator',
          approvalType: 'HUMAN_IN_THE_LOOP_OWNER_APPROVAL',
          description: `Action requires owner confirmation: ${task.title}`,
          riskLevel: 'HIGH',
          status: ApprovalStatus.PENDING,
          metadata: {
            assignedSpecialistId: execResult.assignedSpecialistId,
            biReport: execResult.biReport
          }
        });

        console.log(`[CeoQueueProcessor] Task ${taskId} transitioned to WAITING_APPROVAL. Created approval ${approvalId}.`);
        return {
          status: 'WAITING_APPROVAL',
          taskId,
          objectiveId: task.objectiveId
        };
      }

      // Handle Failed Task Execution
      if (execResult.status === 'FAILED') {
        console.warn(`[CeoQueueProcessor] Orchestrator execution returned FAILED: ${execResult.error}`);
        await taskRepo.updateStatus(taskId, TaskStatus.FAILED, TaskStatus.RUNNING, {
          error: execResult.error || 'Specialist execution failed'
        });
        await objectiveRepo.updateStatus(task.objectiveId, ObjectiveStatus.FAILED);
        return {
          status: 'FAILED',
          taskId,
          objectiveId: task.objectiveId,
          error: execResult.error
        };
      }

      // Handle Completed Task
      const finalOutput = (execResult.result as Record<string, unknown>) || { completed: true };
      const taskOutputWithAi = {
        ...finalOutput,
        _aiExecution: execResult.aiExecution
      };

      await taskRepo.updateStatus(taskId, TaskStatus.COMPLETED, TaskStatus.RUNNING, {
        output: taskOutputWithAi
      });

      // Transition Objective to COMPLETED
      await objectiveRepo.updateStatus(task.objectiveId, ObjectiveStatus.COMPLETED);

      // Emit AI Execution Telemetry if AI call was made
      if (execResult.aiExecution) {
        if (execResult.aiExecution.error) {
          activityService.emitEvent({
            correlationId: task.objectiveId || taskId,
            taskId,
            jobId: job.id,
            departmentId: payload.departmentId,
            agentId: payload.specialistId || 'spec_ceo_orchestrator',
            eventType: ActivityEventType.AI_REQUEST_FAILED,
            action: 'GENERATE_AI_COMPLETION',
            status: 'failed',
            provider: execResult.aiExecution.provider || 'ollama',
            model: execResult.aiExecution.model || 'qwen2.5:7b',
            durationMs: execResult.aiExecution.latencyMs,
            message: `AI request failed: ${execResult.aiExecution.error}`,
            errorCode: 'AI_INFERENCE_ERROR'
          }).catch(() => {});
        } else {
          activityService.emitEvent({
            correlationId: task.objectiveId || taskId,
            taskId,
            jobId: job.id,
            departmentId: payload.departmentId,
            agentId: payload.specialistId || 'spec_ceo_orchestrator',
            eventType: ActivityEventType.AI_REQUEST_COMPLETED,
            action: 'GENERATE_AI_COMPLETION',
            status: 'completed',
            provider: execResult.aiExecution.provider || 'ollama',
            model: execResult.aiExecution.model || 'qwen2.5:7b',
            durationMs: execResult.aiExecution.latencyMs,
            message: `AI completion finished via ${execResult.aiExecution.provider || 'ollama'} (${execResult.aiExecution.model || 'qwen2.5:7b'}) in ${execResult.aiExecution.latencyMs || 0}ms`
          }).catch(() => {});
        }
      }

      console.log(`[CeoQueueProcessor] Successfully executed and completed task ${taskId}. Mode: ${execResult.aiExecution?.mode || 'MOCK'}`);
      return {
        status: 'COMPLETED',
        taskId,
        objectiveId: task.objectiveId,
        result: taskOutputWithAi
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[CeoQueueProcessor] Error processing task ${taskId}: ${msg}`);

      // If attempts exhausted, mark as FAILED
      if (task.attemptCount + 1 >= task.maxAttempts) {
        await taskRepo.updateStatus(taskId, TaskStatus.FAILED, undefined, { error: msg });
        await objectiveRepo.updateStatus(task.objectiveId, ObjectiveStatus.FAILED);
      }

      throw err;
    }
  }

  public async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}

export const ceoQueueProcessor = new CeoQueueProcessor();
