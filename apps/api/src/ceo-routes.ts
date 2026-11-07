import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import {
  mongoDbService,
  ObjectiveRepository,
  OrchestratorTaskRepository,
  ApprovalRepository,
  ActivityRepository,
  RevenueRepository,
  StorefrontRepository,
  ObjectiveStatus,
  TaskStatus,
  ApprovalStatus,
  BusinessObjectiveDocument
} from '@ai-command-center/database';
import { checkPermission, calculateAuditHash, ChainedAuditLogEntry, distributedKillSwitch, verifyWebhookSignature, maskEmail } from '@ai-command-center/security';
import { taskDispatcherService, BaseTaskPayload, activityService } from '@ai-command-center/automation';
import { ActivityEventType } from '@ai-command-center/shared';
import {
  CreateObjectiveSchema,
  ListObjectivesQuerySchema,
  ExecuteObjectiveSchema,
  ListApprovalsQuerySchema,
  ApproveApprovalSchema,
  RejectApprovalSchema,
  ListActivityQuerySchema
} from './ceo-schemas.js';

export interface CeoRoutesOptions {
  authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>;
  recordAudit?: (entry: {
    userId?: string;
    action: string;
    entityType: string;
    entityId: string;
    newState?: Record<string, unknown>;
  }) => void;
}

interface RequestUser {
  userId: string;
  email: string;
  isOwner: boolean;
  role: string;
  permissions?: string[];
}

function getUser(req: FastifyRequest): RequestUser {
  return (req as unknown as { user: RequestUser }).user;
}

export async function registerCeoRoutes(
  app: FastifyInstance,
  options: CeoRoutesOptions
): Promise<void> {
  const { authenticate, recordAudit } = options;

  // Repositories provider helper — uses active mongo connection
  function getRepos() {
    const db = mongoDbService.getDb();
    return {
      objectiveRepo: new ObjectiveRepository(db),
      taskRepo: new OrchestratorTaskRepository(db),
      approvalRepo: new ApprovalRepository(db),
      activityRepo: new ActivityRepository(db),
      revenueRepo: new RevenueRepository(db),
      storefrontRepo: new StorefrontRepository(db)
    };
  }

  // Pre-handler hook verifying RBAC permission for action and resource
  function requirePermission(action: string, resource: string) {
    return async (req: FastifyRequest, reply: FastifyReply) => {
      const user = getUser(req);
      const userContext = {
        userId: user.userId,
        isOwner: user.isOwner,
        permissions: user.permissions || []
      };

      if (!checkPermission(userContext, action, resource)) {
        return reply.status(403).send({
          error: 'FORBIDDEN',
          message: `Access denied. Requires permission ${action}:${resource}`
        });
      }
    };
  }

  // -------------------------------------------------------------------------
  // 1. POST /api/ceo/objectives — Create Business Objective
  // -------------------------------------------------------------------------
  app.post(
    '/api/ceo/objectives',
    {
      preHandler: [authenticate, requirePermission('create', 'objective')]
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const parseResult = CreateObjectiveSchema.safeParse(req.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Invalid objective payload',
          details: parseResult.error.format()
        });
      }

      const user = getUser(req);
      const data = parseResult.data;
      const objectiveId = `obj_${randomUUID()}`;

      // Emit COMMAND_RECEIVED when user submits command to create objective
      activityService.emitEvent({
        correlationId: objectiveId,
        userId: user.userId,
        departmentId: data.departmentIds[0],
        eventType: ActivityEventType.COMMAND_RECEIVED,
        action: 'SUBMIT_COMMAND',
        status: 'info',
        message: `Command received from ${user.email}: "${data.title}"`,
        metadata: {
          objectiveId,
          priority: data.priority,
          departmentIds: data.departmentIds
        }
      }).catch(() => {});

      const { objectiveRepo } = getRepos();
      const created = await objectiveRepo.create({
        objectiveId,
        title: data.title,
        description: data.description,
        ownerId: user.userId,
        status: ObjectiveStatus.DRAFT,
        priority: data.priority,
        departmentIds: data.departmentIds,
        metadata: {
          ...data.metadata,
          createdByEmail: user.email
        }
      });

      if (recordAudit) {
        recordAudit({
          userId: user.userId,
          action: 'OBJECTIVE_CREATED',
          entityType: 'BusinessObjective',
          entityId: objectiveId,
          newState: {
            title: created.title,
            status: created.status,
            priority: created.priority
          }
        });
      }

      // Phase 10.3 Centralized Activity Logging
      activityService.emitEvent({
        correlationId: objectiveId,
        userId: user.userId,
        departmentId: data.departmentIds[0],
        eventType: ActivityEventType.TASK_CREATED,
        action: 'CREATE_BUSINESS_OBJECTIVE',
        status: 'waiting',
        message: `New objective '${created.title}' created by ${user.email}`,
        metadata: {
          objectiveId,
          priority: created.priority,
          departmentIds: created.departmentIds
        }
      }).catch(() => {});

      return reply.status(201).send({
        success: true,
        data: created
      });
    }
  );

  // -------------------------------------------------------------------------
  // 2. GET /api/ceo/objectives — List Business Objectives with Pagination & Ownership Filter
  // -------------------------------------------------------------------------
  app.get(
    '/api/ceo/objectives',
    {
      preHandler: [authenticate, requirePermission('read', 'objective')]
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const parseResult = ListObjectivesQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: parseResult.error.format()
        });
      }

      const user = getUser(req);
      const query = parseResult.data;
      const filter: Partial<BusinessObjectiveDocument> = {};

      if (query.status) {
        filter.status = query.status as ObjectiveStatus;
      }

      // Tenant / Ownership boundary: Non-owners only see their own objectives
      if (!user.isOwner) {
        filter.ownerId = user.userId;
      } else if (query.ownerId) {
        filter.ownerId = query.ownerId;
      }

      const { objectiveRepo } = getRepos();
      const result = await objectiveRepo.list(filter, {
        limit: query.limit,
        skip: query.skip,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      });

      return reply.status(200).send({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          limit: result.limit,
          skip: result.skip,
          hasMore: result.skip + result.items.length < result.total
        }
      });
    }
  );

  // -------------------------------------------------------------------------
  // 3. GET /api/ceo/objectives/:id — Get Objective Details with Sub-Tasks
  // -------------------------------------------------------------------------
  app.get(
    '/api/ceo/objectives/:id',
    {
      preHandler: [authenticate, requirePermission('read', 'objective')]
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const user = getUser(req);
      const { objectiveRepo, taskRepo } = getRepos();

      const objective = await objectiveRepo.findById(id);
      if (!objective) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: `Objective '${id}' was not found`
        });
      }

      // Tenant / Ownership boundary check
      if (!user.isOwner && objective.ownerId !== user.userId) {
        return reply.status(403).send({
          error: 'FORBIDDEN',
          message: 'You do not have access to view this objective'
        });
      }

      // Fetch all sub-tasks belonging to this objective
      const tasksResult = await taskRepo.list({ objectiveId: id }, { limit: 100, sortBy: 'createdAt', sortOrder: 'asc' });

      return reply.status(200).send({
        success: true,
        data: {
          ...objective,
          tasks: tasksResult.items
        }
      });
    }
  );

  // -------------------------------------------------------------------------
  // 4. POST /api/ceo/objectives/:id/execute — Execute Objective (Pending Queue Dispatch)
  // -------------------------------------------------------------------------
  app.post(
    '/api/ceo/objectives/:id/execute',
    {
      preHandler: [authenticate, requirePermission('execute', 'objective')]
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const parseResult = ExecuteObjectiveSchema.safeParse(req.body || {});
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Invalid execution payload',
          details: parseResult.error.format()
        });
      }

      const user = getUser(req);
      const { objectiveRepo, taskRepo } = getRepos();

      const objective = await objectiveRepo.findById(id);
      if (!objective) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: `Objective '${id}' was not found`
        });
      }

      if (!user.isOwner && objective.ownerId !== user.userId) {
        return reply.status(403).send({
          error: 'FORBIDDEN',
          message: 'You do not have permission to execute this objective'
        });
      }

      const body = parseResult.data;
      const idempotencyKey = body.idempotencyKey || `exec_${randomUUID()}`;

      // Check if an execution task with this idempotencyKey already exists
      const existingTask = await taskRepo.findByIdempotencyKey(idempotencyKey);
      if (existingTask) {
        // Case B: Retry same objective with same key K -> Return existing execution with consistent 202 Accepted
        if (existingTask.objectiveId === id) {
          return reply.status(202).send({
            success: true,
            message: 'Objective execution registered and queued for autonomous dispatch',
            objectiveId: id,
            status: ObjectiveStatus.ACTIVE,
            idempotencyKey,
            isReplay: true,
            initialTask: {
              taskId: existingTask.taskId,
              status: existingTask.status,
              departmentId: existingTask.departmentId,
              specialistId: existingTask.specialistId
            }
          });
        }

        // Case C: Same key K used with a different objective -> 409 Conflict
        return reply.status(409).send({
          error: 'IDEMPOTENCY_CONFLICT',
          message: `Idempotency key '${idempotencyKey}' was already used for a different objective '${existingTask.objectiveId}'`
        });
      }

      // Case D: Different key with an already active objective -> 409 Conflict
      if (objective.status === ObjectiveStatus.ACTIVE) {
        return reply.status(409).send({
          error: 'CONFLICT',
          message: `Objective '${id}' is already actively executing`,
          currentStatus: objective.status
        });
      }

      if (objective.status === ObjectiveStatus.COMPLETED) {
        return reply.status(400).send({
          error: 'INVALID_STATE',
          message: `Objective '${id}' has already completed. Re-execution of completed objectives is not supported.`
        });
      }

      if (objective.status === ObjectiveStatus.CANCELLED) {
        return reply.status(400).send({
          error: 'INVALID_STATE',
          message: `Objective '${id}' has been cancelled and cannot be executed.`
        });
      }

      // Decompose initial orchestration task in PENDING state
      const initialTaskId = `tsk_${randomUUID()}`;
      const primaryDepartment = objective.departmentIds[0] || 'EXECUTIVE';

      let createdTask;
      try {
        // Case E: Concurrent requests race at the database unique index on metadata.idempotencyKey
        createdTask = await taskRepo.create({
          taskId: initialTaskId,
          objectiveId: id,
          departmentId: primaryDepartment,
          specialistId: 'spec_ceo_orchestrator',
          title: `Decompose and Coordinate: ${objective.title}`,
          description: objective.description,
          status: TaskStatus.PENDING,
          priority: objective.priority,
          input: {
            objectiveId: id,
            title: objective.title,
            departmentIds: objective.departmentIds,
            executionNotes: body.executionNotes || null
          },
          maxAttempts: 3,
          metadata: {
            idempotencyKey,
            queuedForPhase7_3: true,
            requestedBy: user.userId
          }
        });
      } catch (err: unknown) {
        // Duplicate key race condition caught by MongoDB unique index
        if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
          const concurrentTask = await taskRepo.findByIdempotencyKey(idempotencyKey);
          if (concurrentTask && concurrentTask.objectiveId === id) {
            return reply.status(202).send({
              success: true,
              message: 'Objective execution registered and queued for autonomous dispatch',
              objectiveId: id,
              status: ObjectiveStatus.ACTIVE,
              idempotencyKey,
              isReplay: true,
              initialTask: {
                taskId: concurrentTask.taskId,
                status: concurrentTask.status,
                departmentId: concurrentTask.departmentId,
                specialistId: concurrentTask.specialistId
              }
            });
          }
          return reply.status(409).send({
            error: 'IDEMPOTENCY_CONFLICT',
            message: `Concurrent request conflict on idempotency key '${idempotencyKey}'`
          });
        }
        throw err;
      }

      // Transition objective status to ACTIVE atomically
      await objectiveRepo.updateStatus(id, ObjectiveStatus.ACTIVE, objective.status);

      // Dispatch to BullMQ Queue (Reliable Outbox Pattern)
      const dispatchResult = await taskDispatcherService.dispatchCeoTask({
        taskId: initialTaskId,
        objectiveId: id,
        specialistId: 'spec_ceo_orchestrator',
        departmentId: primaryDepartment,
        action: 'EXECUTE_OBJECTIVE',
        idempotencyKey,
        priority: objective.priority,
        data: {
          objectiveId: id,
          title: objective.title,
          description: objective.description,
          departmentIds: objective.departmentIds,
          executionNotes: body.executionNotes || null
        },
        createdAt: new Date().toISOString()
      });

      // Update task dispatch status
      if (dispatchResult.dispatched) {
        await taskRepo.updateStatus(initialTaskId, TaskStatus.QUEUED);
      }

      if (recordAudit) {
        recordAudit({
          userId: user.userId,
          action: 'OBJECTIVE_EXECUTED',
          entityType: 'BusinessObjective',
          entityId: id,
          newState: {
            status: ObjectiveStatus.ACTIVE,
            initialTaskId,
            idempotencyKey,
            queueDispatched: dispatchResult.dispatched,
            jobId: dispatchResult.jobId
          }
        });
      }

      // Phase 10.3 Centralized Activity Logging for Dispatch
      activityService.emitEvent({
        correlationId: id,
        userId: user.userId,
        taskId: initialTaskId,
        jobId: dispatchResult.jobId,
        departmentId: primaryDepartment,
        agentId: 'spec_ceo_orchestrator',
        eventType: ActivityEventType.TASK_DISPATCHED,
        action: 'EXECUTE_OBJECTIVE',
        status: dispatchResult.dispatched ? 'waiting' : 'failed',
        message: `Task ${initialTaskId} dispatched to queue for execution. JobId: ${dispatchResult.jobId || 'N/A'}`,
        metadata: {
          objectiveId: id,
          idempotencyKey,
          dispatchedToQueue: dispatchResult.dispatched
        }
      }).catch(() => {});

      // Case A: First request with key K -> Return 202 Accepted
      return reply.status(202).send({
        success: true,
        message: 'Objective execution registered and queued for autonomous dispatch',
        objectiveId: id,
        status: ObjectiveStatus.ACTIVE,
        idempotencyKey,
        dispatchedToQueue: dispatchResult.dispatched,
        initialTask: {
          taskId: createdTask.taskId,
          status: dispatchResult.dispatched ? TaskStatus.QUEUED : TaskStatus.PENDING,
          departmentId: createdTask.departmentId,
          specialistId: createdTask.specialistId
        }
      });
    }
  );

  // -------------------------------------------------------------------------
  // 5. GET /api/ceo/tasks/:id — Get Specific Orchestrator Task
  // -------------------------------------------------------------------------
  app.get(
    '/api/ceo/tasks/:id',
    {
      preHandler: [authenticate, requirePermission('read', 'task')]
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const user = getUser(req);
      const { taskRepo, objectiveRepo } = getRepos();

      const task = await taskRepo.findById(id);
      if (!task) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: `Task '${id}' was not found`
        });
      }

      // Verify tenant / ownership boundary via parent objective
      if (!user.isOwner) {
        const parentObj = await objectiveRepo.findById(task.objectiveId);
        if (!parentObj || parentObj.ownerId !== user.userId) {
          return reply.status(403).send({
            error: 'FORBIDDEN',
            message: 'You do not have access to view this task'
          });
        }
      }

      return reply.status(200).send({
        success: true,
        data: task
      });
    }
  );

  // -------------------------------------------------------------------------
  // 6. GET /api/ceo/approvals — List Approval Requests (Read-Only)
  // -------------------------------------------------------------------------
  app.get(
    '/api/ceo/approvals',
    {
      preHandler: [authenticate, requirePermission('read', 'approval')]
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const parseResult = ListApprovalsQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: parseResult.error.format()
        });
      }

      const query = parseResult.data;
      const filter: Record<string, unknown> = {};

      if (query.status) filter.status = query.status;
      if (query.objectiveId) filter.objectiveId = query.objectiveId;
      if (query.taskId) filter.taskId = query.taskId;
      if (query.riskLevel) filter.riskLevel = query.riskLevel;

      const { approvalRepo } = getRepos();
      const result = await approvalRepo.list(filter, {
        limit: query.limit,
        skip: query.skip,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      });

      return reply.status(200).send({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          limit: result.limit,
          skip: result.skip,
          hasMore: result.skip + result.items.length < result.total
        }
      });
    }
  );

  // -------------------------------------------------------------------------
  // 7. GET /api/ceo/approvals/:id — Get Specific Approval Request (Read-Only)
  // -------------------------------------------------------------------------
  app.get(
    '/api/ceo/approvals/:id',
    {
      preHandler: [authenticate, requirePermission('read', 'approval')]
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { approvalRepo } = getRepos();

      const approval = await approvalRepo.findById(id);
      if (!approval) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: `Approval request '${id}' was not found`
        });
      }

      return reply.status(200).send({
        success: true,
        data: approval
      });
    }
  );

  // -------------------------------------------------------------------------
  // 8. POST /api/ceo/approvals/:id/approve — Human Owner Approval & Task Resumption
  // -------------------------------------------------------------------------
  app.post(
    '/api/ceo/approvals/:id/approve',
    {
      preHandler: [authenticate]
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const user = getUser(req);

      // 1. Enforce strict Owner-Only approval authority
      if (!user.isOwner) {
        return reply.status(403).send({
          error: 'FORBIDDEN',
          message: 'Only the authenticated Owner has authority to approve high-risk actions'
        });
      }

      const parseResult = ApproveApprovalSchema.safeParse(req.body || {});
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Invalid approval payload',
          details: parseResult.error.format()
        });
      }

      const { approvalRepo, taskRepo, objectiveRepo } = getRepos();

      // 2. Fetch Approval Request
      const approval = await approvalRepo.findById(id);
      if (!approval) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: `Approval request '${id}' was not found`
        });
      }

      // 3. Idempotency & State Checks
      if (approval.status === ApprovalStatus.APPROVED) {
        return reply.status(200).send({
          success: true,
          message: 'Approval decision was already recorded (idempotent replay)',
          data: approval,
          isReplay: true
        });
      }

      if (approval.status === ApprovalStatus.REJECTED) {
        return reply.status(409).send({
          error: 'CONFLICT',
          message: `Cannot approve request '${id}' because it was already REJECTED.`
        });
      }

      if (approval.status === ApprovalStatus.EXPIRED || approval.status === ApprovalStatus.CANCELLED) {
        return reply.status(409).send({
          error: 'CONFLICT',
          message: `Cannot approve request '${id}' because it is ${approval.status}.`
        });
      }

      // 4. Validate Target Task & Parent Objective
      const task = await taskRepo.findById(approval.taskId);
      if (!task) {
        return reply.status(404).send({
          error: 'TASK_NOT_FOUND',
          message: `Associated task '${approval.taskId}' was not found`
        });
      }

      if (task.status === TaskStatus.CANCELLED) {
        return reply.status(409).send({
          error: 'TASK_CANCELLED',
          message: `Cannot resume task '${task.taskId}' because it was cancelled.`
        });
      }

      if (task.status === TaskStatus.COMPLETED) {
        return reply.status(409).send({
          error: 'TASK_COMPLETED',
          message: `Task '${task.taskId}' is already COMPLETED.`
        });
      }

      // 5. Emergency Kill-Switch Guard
      try {
        distributedKillSwitch.assertOperational();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(503).send({
          error: 'KILL_SWITCH_ACTIVE',
          message: `Cannot resume execution while Emergency Kill-Switch is active: ${msg}`
        });
      }

      // 6. Atomic Decision Recording in Database
      const decisionRecorded = await approvalRepo.recordDecision(
        id,
        ApprovalStatus.APPROVED,
        user.userId,
        parseResult.data.reason
      );

      if (!decisionRecorded) {
        return reply.status(409).send({
          error: 'CONCURRENT_MODIFICATION',
          message: `Approval '${id}' state changed concurrently.`
        });
      }

      // 7. Update Task Status to QUEUED with approval metadata
      await taskRepo.updateStatus(task.taskId, TaskStatus.QUEUED, undefined, {
        output: {
          approvedBy: user.userId,
          approvedAt: new Date().toISOString(),
          decisionReason: parseResult.data.reason
        }
      });

      // 8. Safe Task Resumption via BullMQ Dispatch (Preserves original taskId)
      const objective = await objectiveRepo.findById(task.objectiveId);
      const payload: BaseTaskPayload = {
        taskId: task.taskId,
        objectiveId: task.objectiveId,
        specialistId: task.specialistId,
        departmentId: task.departmentId,
        action: 'RESUME_AFTER_APPROVAL',
        idempotencyKey: (task.metadata?.idempotencyKey as string) || `res_${task.taskId}`,
        priority: task.priority,
        data: {
          ...task.input,
          title: task.title,
          description: task.description,
          approvedBy: user.userId,
          approvedAt: new Date().toISOString(),
          isResumedExecution: true
        },
        createdAt: new Date().toISOString()
      };

      const dispatchResult = await taskDispatcherService.dispatchCeoTask(payload);

      if (recordAudit) {
        recordAudit({
          userId: user.userId,
          action: 'APPROVAL_GRANTED',
          entityType: 'ApprovalRequest',
          entityId: id,
          newState: {
            approvalId: id,
            status: ApprovalStatus.APPROVED,
            taskId: task.taskId,
            resumedQueueDispatched: dispatchResult.dispatched,
            reason: parseResult.data.reason
          }
        });
      }

      // Phase 10.3 Centralized Activity Logging for Approval Granted
      activityService.emitEvent({
        correlationId: task.objectiveId,
        userId: user.userId,
        taskId: task.taskId,
        jobId: dispatchResult.jobId,
        departmentId: task.departmentId,
        agentId: task.specialistId,
        approvalId: id,
        eventType: ActivityEventType.APPROVAL_GRANTED,
        action: 'APPROVE_HIGH_RISK_ACTION',
        status: 'completed',
        message: `Approval request ${id} GRANTED by ${user.email}. Task ${task.taskId} resumed.`,
        metadata: {
          approvalId: id,
          reason: parseResult.data.reason,
          resumedQueueDispatched: dispatchResult.dispatched
        }
      }).catch(() => {});

      return reply.status(200).send({
        success: true,
        message: 'Approval granted and task safely queued for autonomous resumption',
        data: {
          approvalId: id,
          status: ApprovalStatus.APPROVED,
          taskId: task.taskId,
          objectiveId: task.objectiveId,
          resumedQueueDispatched: dispatchResult.dispatched,
          reviewedBy: user.userId,
          reviewedAt: new Date().toISOString()
        }
      });
    }
  );

  // -------------------------------------------------------------------------
  // 9. POST /api/ceo/approvals/:id/reject — Human Owner Rejection
  // -------------------------------------------------------------------------
  app.post(
    '/api/ceo/approvals/:id/reject',
    {
      preHandler: [authenticate]
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const user = getUser(req);

      // 1. Enforce strict Owner-Only authority
      if (!user.isOwner) {
        return reply.status(403).send({
          error: 'FORBIDDEN',
          message: 'Only the authenticated Owner has authority to reject high-risk actions'
        });
      }

      const parseResult = RejectApprovalSchema.safeParse(req.body || {});
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Invalid rejection payload',
          details: parseResult.error.format()
        });
      }

      const { approvalRepo, taskRepo, objectiveRepo } = getRepos();

      // 2. Fetch Approval Request
      const approval = await approvalRepo.findById(id);
      if (!approval) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: `Approval request '${id}' was not found`
        });
      }

      // 3. Idempotency & State Checks
      if (approval.status === ApprovalStatus.REJECTED) {
        return reply.status(200).send({
          success: true,
          message: 'Approval rejection was already recorded (idempotent replay)',
          data: approval,
          isReplay: true
        });
      }

      if (approval.status === ApprovalStatus.APPROVED) {
        return reply.status(409).send({
          error: 'CONFLICT',
          message: `Cannot reject request '${id}' because it was already APPROVED.`
        });
      }

      if (approval.status === ApprovalStatus.EXPIRED || approval.status === ApprovalStatus.CANCELLED) {
        return reply.status(409).send({
          error: 'CONFLICT',
          message: `Cannot reject request '${id}' because it is ${approval.status}.`
        });
      }

      // 4. Atomic Decision Recording
      const decisionRecorded = await approvalRepo.recordDecision(
        id,
        ApprovalStatus.REJECTED,
        user.userId,
        parseResult.data.reason
      );

      if (!decisionRecorded) {
        return reply.status(409).send({
          error: 'CONCURRENT_MODIFICATION',
          message: `Approval '${id}' state changed concurrently.`
        });
      }

      // 5. Cancel Associated Task Safely (Never dispatch to BullMQ)
      await taskRepo.cancel(approval.taskId, `Rejected by Owner: ${parseResult.data.reason}`);

      // Fail parent objective if applicable
      await objectiveRepo.updateStatus(approval.objectiveId, ObjectiveStatus.FAILED);

      if (recordAudit) {
        recordAudit({
          userId: user.userId,
          action: 'APPROVAL_REJECTED',
          entityType: 'ApprovalRequest',
          entityId: id,
          newState: {
            approvalId: id,
            status: ApprovalStatus.REJECTED,
            taskId: approval.taskId,
            reason: parseResult.data.reason
          }
        });
      }

      // Phase 10.3 Centralized Activity Logging for Approval Rejection
      activityService.emitEvent({
        correlationId: approval.objectiveId,
        userId: user.userId,
        taskId: approval.taskId,
        approvalId: id,
        eventType: ActivityEventType.APPROVAL_REJECTED,
        action: 'REJECT_HIGH_RISK_ACTION',
        status: 'cancelled',
        message: `Approval request ${id} REJECTED by ${user.email}. Task ${approval.taskId} permanently stopped.`,
        metadata: {
          approvalId: id,
          reason: parseResult.data.reason
        }
      }).catch(() => {});

      return reply.status(200).send({
        success: true,
        message: 'Approval rejected and task safely stopped',
        data: {
          approvalId: id,
          status: ApprovalStatus.REJECTED,
          taskId: approval.taskId,
          objectiveId: approval.objectiveId,
          reviewedBy: user.userId,
          reviewedAt: new Date().toISOString(),
          decisionReason: parseResult.data.reason
        }
      });
    }
  );

  // -------------------------------------------------------------
  // PHASE 10.3: CENTRALIZED ACTIVITY & TELEMETRY ENDPOINTS
  // -------------------------------------------------------------

  /**
   * GET /api/ceo/activity
   * Paginated, filtered list of permanent activity events
   */
  app.get(
    '/api/ceo/activity',
    {
      preHandler: [authenticate, requirePermission('read', 'activity')]
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const parseResult = ListActivityQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'BAD_REQUEST',
          message: 'Invalid activity query parameters',
          details: parseResult.error.format()
        });
      }

      const { activityRepo } = getRepos();
      const results = await activityRepo.listEvents(parseResult.data as any);
      return reply.status(200).send(results);
    }
  );

  /**
   * GET /api/ceo/activity/summary
   * Aggregated real telemetry statistics (counts, errors, active workers)
   */
  app.get(
    '/api/ceo/activity/summary',
    {
      preHandler: [authenticate, requirePermission('read', 'activity')]
    },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const { activityRepo } = getRepos();
      const summary = await activityRepo.getTelemetrySummary();
      return reply.status(200).send({
        success: true,
        data: summary
      });
    }
  );

  /**
   * GET /api/ceo/activity/stream (Server-Sent Events Real-Time Telemetry)
   */
  app.get(
    '/api/ceo/activity/stream',
    {
      preHandler: [authenticate, requirePermission('read', 'activity')]
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      // Set SSE headers
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Accel-Buffering', 'no');

      // Send initial batch of recent in-memory events on connect/reconnect
      const initialEvents = activityService.getRecentMemoryEvents(25);
      reply.raw.write(`event: init\ndata: ${JSON.stringify(initialEvents)}\n\n`);

      // Heartbeat ping interval
      const pingInterval = setInterval(() => {
        try {
          reply.raw.write(`event: ping\ndata: {"time":"${new Date().toISOString()}"}\n\n`);
        } catch {
          clearInterval(pingInterval);
        }
      }, 15000);

      // Event listener
      const onActivity = (event: any) => {
        try {
          reply.raw.write(`event: activity\ndata: ${JSON.stringify(event)}\n\n`);
        } catch {
          cleanup();
        }
      };

      activityService.on('activity', onActivity);

      const cleanup = () => {
        clearInterval(pingInterval);
        activityService.removeListener('activity', onActivity);
      };

      req.raw.on('close', cleanup);
      req.raw.on('end', cleanup);
    }
  );

  // -------------------------------------------------------------
  // PHASE 11.0: REVENUE ENGINE ENDPOINTS
  // -------------------------------------------------------------

  /**
   * GET /api/ceo/revenue/metrics
   * Channel-wise performance, verified confirmed revenue, and expenses
   */
  app.get(
    '/api/ceo/revenue/metrics',
    {
      preHandler: [authenticate, requirePermission('read', 'activity')]
    },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const { revenueRepo } = getRepos();
      const metrics = await revenueRepo.getAllChannelMetrics();
      const latestPlan = await revenueRepo.getLatestExecutionPlan();

      return reply.status(200).send({
        success: true,
        data: {
          channels: metrics,
          latestExecutionPlan: latestPlan,
          aggregated: {
            grossRevenueUSD: metrics.reduce((acc, m) => acc + (m.confirmedRevenueUSD + m.receivedPaymentsUSD), 0),
            pendingRevenueUSD: metrics.reduce((acc, m) => acc + m.pendingRevenueUSD, 0),
            receivedPaymentsUSD: metrics.reduce((acc, m) => acc + m.receivedPaymentsUSD, 0),
            refundsUSD: metrics.reduce((acc, m) => acc + m.refundsUSD, 0),
            netRevenueUSD: metrics.reduce((acc, m) => acc + m.netRevenueUSD, 0),
            publishedAssetsTotal: metrics.reduce((acc, m) => acc + m.publishedAssets, 0),
            pendingApprovalsTotal: metrics.reduce((acc, m) => acc + m.pendingApprovals, 0)
          }
        }
      });
    }
  );

  /**
   * GET /api/ceo/storefront/listings
   * Real-time storefront listing telemetry, views, visitors, orders, and payout status
   */
  app.get(
    '/api/ceo/storefront/listings',
    {
      preHandler: [authenticate, requirePermission('read', 'activity')]
    },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      const { storefrontRepo } = getRepos();
      const listings = await storefrontRepo.listAll();
      const summary = await storefrontRepo.getSummaryTelemetry();

      return reply.status(200).send({
        success: true,
        data: {
          listings,
          summary
        }
      });
    }
  );

  /**
   * POST /api/ceo/storefront/webhooks/lemonsqueezy
   * Secure webhook receiver for Lemon Squeezy order and refund verification.
   * Enforces HMAC-SHA256 signature verification, idempotency, and data masking.
   */
  app.post(
    '/api/ceo/storefront/webhooks/lemonsqueezy',
    async (req: FastifyRequest, reply: FastifyReply) => {
      const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
      if (!secret) {
        return reply.status(503).send({
          success: false,
          error: 'INTEGRATION_UNCONFIGURED',
          message: 'Lemon Squeezy webhook secret is not configured on server.'
        });
      }

      const signatureHeader = req.headers['x-signature'] as string | undefined;
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      const verification = verifyWebhookSignature(rawBody, signatureHeader, secret);
      if (!verification.isValid) {
        return reply.status(401).send({
          success: false,
          error: 'UNAUTHORIZED_WEBHOOK_SIGNATURE',
          message: verification.error || 'Invalid webhook signature.'
        });
      }

      const payload = req.body as any;
      const eventName = payload?.meta?.event_name || 'unknown';
      const orderData = payload?.data;
      const orderId = orderData?.id ? String(orderData.id) : undefined;
      const attributes = orderData?.attributes || {};

      const eventId = `ls_evt_${orderId || randomUUID()}_${eventName}`;
      const { storefrontRepo, revenueRepo } = getRepos();

      // Convert cents to dollars if currency is USD
      const totalCents = attributes.total || attributes.subtotal || 0;
      const grossUSD = totalCents / 100;
      // Standard Lemon Squeezy MoR fee model: 5% + $0.50
      const feeUSD = grossUSD > 0 ? (grossUSD * 0.05) + 0.50 : 0;
      const netUSD = Math.max(0, grossUSD - feeUSD);
      const isTestOrder = Boolean(attributes.test_mode);

      const isRefund = eventName === 'order_refunded' || attributes.refunded === true;
      const status = isRefund ? 'REFUNDED' : 'CONFIRMED';

      const emailRaw = attributes.user_email || attributes.customer_email;
      const customerEmailMasked = emailRaw ? maskEmail(emailRaw) : undefined;

      const recordRes = await storefrontRepo.recordWebhookEvent({
        eventId,
        source: 'LEMON_SQUEEZY',
        eventName,
        externalOrderId: orderId,
        status,
        grossAmountUSD: grossUSD,
        feeUSD,
        netAmountUSD: netUSD,
        currency: attributes.currency || 'USD',
        customerEmailMasked,
        isTest: isTestOrder,
        receivedAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      });

      if (recordRes.isDuplicate) {
        return reply.status(200).send({
          success: true,
          status: 'ALREADY_PROCESSED',
          message: 'Duplicate event ignored.'
        });
      }

      // Record verified revenue transaction only if not a test order
      if (!isTestOrder && (eventName === 'order_created' || isRefund)) {
        await revenueRepo.recordTransaction({
          transactionId: `tx_${eventId}`,
          channel: 'DIGITAL_PRODUCT' as any,
          grossAmountUSD: grossUSD,
          feeUSD,
          netAmountUSD: netUSD,
          status: isRefund ? 'REFUNDED' : 'CONFIRMED',
          source: 'Lemon Squeezy',
          externalReference: orderId,
          occurredAt: attributes.created_at || new Date().toISOString(),
          confirmedAt: new Date().toISOString()
        });
      }

      return reply.status(200).send({
        success: true,
        status: 'PROCESSED',
        eventId,
        eventName,
        verified: true
      });
    }
  );
}
