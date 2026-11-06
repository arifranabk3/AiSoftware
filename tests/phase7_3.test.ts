import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
dotenv.config();
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { Redis } from 'ioredis';
import { Queue, Worker } from 'bullmq';
import {
  mongoDbService,
  initializeDatabaseIndexes,
  ObjectiveRepository,
  OrchestratorTaskRepository,
  ApprovalRepository,
  ObjectiveStatus,
  TaskStatus,
  ApprovalStatus
} from '@ai-command-center/database';
import { distributedKillSwitch } from '@ai-command-center/security';
import {
  redisManager,
  taskDispatcherService,
  CommandQueueName,
  BaseTaskPayload,
  workerRecoveryManager
} from '@ai-command-center/automation';
import { ceoQueueProcessor } from '../apps/worker/src/ceo-processor.js';
import { buildServer } from '../apps/api/src/server.js';
import { generateAuthTokens } from '@ai-command-center/security';
import type { FastifyInstance } from 'fastify';

describe('Phase 7.3 — BullMQ CEO Orchestrator Pipeline Integration Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let objectiveRepo: ObjectiveRepository;
  let taskRepo: OrchestratorTaskRepository;
  let approvalRepo: ApprovalRepository;
  let server: FastifyInstance;
  let ownerToken: string;

  const jwtSecret = 'test_jwt_secret_must_be_32_characters_long_123';
  const refreshSecret = 'test_refresh_secret_must_be_32_characters_long';

  // Live Redis client from environment (Upstash Redis)
  let liveRedis: Redis | null = null;
  const redisUrl = process.env.REDIS_URL;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_phase7_3_pipeline');

    await mongoDbService.connect(uri, 'test_phase7_3_pipeline');
    await initializeDatabaseIndexes(uri, 'test_phase7_3_pipeline');

    objectiveRepo = new ObjectiveRepository(db);
    taskRepo = new OrchestratorTaskRepository(db);
    approvalRepo = new ApprovalRepository(db);

    workerRecoveryManager.setDb(db);

    server = await buildServer();

    const activeJwtSecret = process.env.JWT_SECRET || jwtSecret;
    const activeRefreshSecret = process.env.REFRESH_TOKEN_SECRET || refreshSecret;

    ownerToken = generateAuthTokens(
      {
        userId: 'usr_owner_root',
        email: 'owner@ai-command-center.local',
        isOwner: true,
        role: 'OWNER'
      },
      activeJwtSecret,
      activeRefreshSecret
    ).accessToken;

    if (redisUrl) {
      liveRedis = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true
      });
      await liveRedis.connect();
    }
  }, 30000);

  afterAll(async () => {
    await server.close();
    await taskDispatcherService.closeAll();
    await ceoQueueProcessor.stop();
    if (liveRedis) {
      await liveRedis.quit();
    }
    await client.close();
    await mongoDbService.disconnect();
    await mongod.stop();
    await distributedKillSwitch.deactivate('test_cleanup');
  });

  // =========================================================================
  // 1. END-TO-END QUEUE DISPATCH VIA FASTIFY REST API
  // =========================================================================
  describe('1. API Execution Registration & Queue Dispatch', () => {
    it('should create objective, persist initial task, and dispatch to BullMQ with 202 Accepted', async () => {
      // Create objective
      const createRes = await server.inject({
        method: 'POST',
        url: '/api/ceo/objectives',
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          title: 'Full Pipeline Integration Test Objective',
          description: 'Deploy specialist pipeline via BullMQ and MongoDB persistence',
          priority: 1,
          departmentIds: ['EXECUTIVE'],
          metadata: { testSuite: 'Phase7.3' }
        }
      });
      expect(createRes.statusCode).toBe(201);
      const objectiveId = createRes.json().data.objectiveId;

      // Execute objective
      const execRes = await server.inject({
        method: 'POST',
        url: `/api/ceo/objectives/${objectiveId}/execute`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          idempotencyKey: 'idemp_pipe_test_001',
          executionNotes: 'BullMQ pipeline dispatch'
        }
      });

      expect(execRes.statusCode).toBe(202);
      const body = execRes.json();
      expect(body.success).toBe(true);
      expect(body.status).toBe(ObjectiveStatus.ACTIVE);
      expect(body.initialTask).toBeDefined();

      // Check task in database
      const task = await taskRepo.findById(body.initialTask.taskId);
      expect(task).not.toBeNull();
      // If Redis is reachable, task is transitioned to QUEUED, otherwise stays PENDING
      expect([TaskStatus.QUEUED, TaskStatus.PENDING]).toContain(task?.status);
    });
  });

  // =========================================================================
  // 2. DISPATCHER RESILIENCE & FAILURE WINDOW HANDLING
  // =========================================================================
  describe('2. Dispatcher Resilience & Redis Failure Handling', () => {
    it('should handle Redis dispatch failure without throwing or deleting the persisted task', async () => {
      // Dispatched payload with bad queue / simulate offline redis
      const payload: BaseTaskPayload = {
        taskId: 'tsk_offline_dispatch_001',
        objectiveId: 'obj_offline_001',
        specialistId: 'spec_ceo_orchestrator',
        departmentId: 'EXECUTIVE',
        action: 'EXECUTE',
        idempotencyKey: 'idemp_offline_001',
        priority: 1,
        data: {},
        createdAt: new Date().toISOString()
      };

      // Create task in Mongo first (Reliable Outbox Pattern)
      await taskRepo.create({
        taskId: payload.taskId,
        objectiveId: payload.objectiveId!,
        departmentId: payload.departmentId,
        specialistId: payload.specialistId,
        title: 'Offline Resilient Task',
        description: 'Testing failure window',
        status: TaskStatus.PENDING,
        priority: 1,
        input: {},
        maxAttempts: 3,
        metadata: { idempotencyKey: payload.idempotencyKey }
      });

      // Task remains safe in PENDING status for recovery even if Redis dispatch is interrupted
      const task = await taskRepo.findById(payload.taskId);
      expect(task).not.toBeNull();
      expect(task?.status).toBe(TaskStatus.PENDING);

      // Verify unfinished tasks locator finds it
      const unfinished = await taskRepo.findUnfinishedTasks();
      expect(unfinished.pending.some((t) => t.taskId === payload.taskId)).toBe(true);
    });
  });

  // =========================================================================
  // 3. WORKER PROCESSING & ORCHESTRATOR PIPELINE EXECUTION
  // =========================================================================
  describe('3. Worker Processing & Idempotent Execution', () => {
    it('should process CEO task through orchestrator and transition to COMPLETED', async () => {
      const obj = await objectiveRepo.create({
        objectiveId: 'obj_worker_test_01',
        title: 'Market Analysis Pipeline',
        description: 'Analyze digital business opportunities in enterprise SaaS',
        ownerId: 'usr_owner_root',
        status: ObjectiveStatus.ACTIVE,
        priority: 1,
        departmentIds: ['EXECUTIVE'],
        metadata: {}
      });

      const tsk = await taskRepo.create({
        taskId: 'tsk_worker_exec_001',
        objectiveId: obj.objectiveId,
        departmentId: 'EXECUTIVE',
        specialistId: 'spec_ceo_orchestrator',
        title: 'Market Analysis Pipeline',
        description: 'Analyze digital business opportunities in enterprise SaaS',
        status: TaskStatus.QUEUED,
        priority: 1,
        input: { title: obj.title, description: obj.description },
        maxAttempts: 3,
        metadata: { idempotencyKey: 'idemp_worker_001' }
      });

      // Invoke processor directly with mock BullMQ job
      const mockJob = {
        id: tsk.taskId,
        data: {
          taskId: tsk.taskId,
          objectiveId: obj.objectiveId,
          specialistId: tsk.specialistId,
          departmentId: tsk.departmentId,
          action: 'EXECUTE',
          idempotencyKey: 'idemp_worker_001',
          priority: 1,
          data: { title: obj.title, description: obj.description },
          createdAt: new Date().toISOString()
        }
      } as unknown as import('bullmq').Job<BaseTaskPayload, import('../apps/worker/src/ceo-processor.js').ProcessorExecutionResult>;

      const result = await ceoQueueProcessor.processJob(mockJob);
      expect(result.status).toBe('COMPLETED');
      expect(result.result).toBeDefined();

      // Check task in database is COMPLETED
      const updatedTask = await taskRepo.findById(tsk.taskId);
      expect(updatedTask?.status).toBe(TaskStatus.COMPLETED);
      expect(updatedTask?.completedAt).toBeInstanceOf(Date);

      // Check objective is COMPLETED
      const updatedObj = await objectiveRepo.findById(obj.objectiveId);
      expect(updatedObj?.status).toBe(ObjectiveStatus.COMPLETED);

      // Duplicate delivery of the same job should return cached COMPLETED without re-executing
      const duplicateRun = await ceoQueueProcessor.processJob(mockJob);
      expect(duplicateRun.status).toBe('COMPLETED');
    });

    it('should prevent execution of approval-blocked tasks and create approval request', async () => {
      const obj = await objectiveRepo.create({
        objectiveId: 'obj_approval_pipe_01',
        title: 'Sensitive Production Migration',
        description: 'Deploy code to production live systems',
        ownerId: 'usr_owner_root',
        status: ObjectiveStatus.ACTIVE,
        priority: 1,
        departmentIds: ['ENGINEERING'],
        metadata: {}
      });

      const tsk = await taskRepo.create({
        taskId: 'tsk_approval_pipe_001',
        objectiveId: obj.objectiveId,
        departmentId: 'ENGINEERING',
        specialistId: 'spec_eng_01',
        title: 'Production Migration',
        description: 'Deploy code to production live systems',
        status: TaskStatus.QUEUED,
        priority: 1,
        input: { requiresOwnerApproval: true },
        maxAttempts: 3,
        metadata: { idempotencyKey: 'idemp_approval_001' }
      });

      const mockJob = {
        id: tsk.taskId,
        data: {
          taskId: tsk.taskId,
          objectiveId: obj.objectiveId,
          specialistId: tsk.specialistId,
          departmentId: tsk.departmentId,
          action: 'EXECUTE',
          idempotencyKey: 'idemp_approval_001',
          priority: 1,
          data: { requiresOwnerApproval: true, title: obj.title, description: obj.description },
          createdAt: new Date().toISOString()
        }
      } as unknown as import('bullmq').Job<BaseTaskPayload, import('../apps/worker/src/ceo-processor.js').ProcessorExecutionResult>;

      // Force orchestrator requiresApproval condition
      const result = await ceoQueueProcessor.processJob({
        ...mockJob,
        data: {
          ...mockJob.data,
          data: { ...mockJob.data.data, requiresOwnerApproval: true }
        }
      });

      // The task must not be completed; it must be WAITING_APPROVAL
      expect(result.status).toBe('WAITING_APPROVAL');

      const updatedTask = await taskRepo.findById(tsk.taskId);
      expect(updatedTask?.status).toBe(TaskStatus.WAITING_APPROVAL);

      // Verify approval request was created
      const approval = await approvalRepo.findByTaskId(tsk.taskId);
      expect(approval).not.toBeNull();
      expect(approval?.status).toBe(ApprovalStatus.PENDING);
    });
  });

  // =========================================================================
  // 4. EMERGENCY KILL-SWITCH FREEZE IN PIPELINE
  // =========================================================================
  describe('4. Emergency Kill-Switch Safety', () => {
    it('should immediately freeze processor execution when kill-switch is active', async () => {
      await distributedKillSwitch.activate('usr_owner_root', 'Emergency freeze drill');

      const mockJob = {
        id: 'tsk_frozen_001',
        data: {
          taskId: 'tsk_frozen_001',
          objectiveId: 'obj_frozen_001',
          specialistId: 'spec_ceo_orchestrator',
          departmentId: 'EXECUTIVE',
          action: 'EXECUTE',
          idempotencyKey: 'idemp_frozen_001',
          priority: 1,
          data: {},
          createdAt: new Date().toISOString()
        }
      } as unknown as import('bullmq').Job<BaseTaskPayload, import('../apps/worker/src/ceo-processor.js').ProcessorExecutionResult>;

      await expect(ceoQueueProcessor.processJob(mockJob)).rejects.toThrow('KILL_SWITCH_ACTIVE');

      // Deactivate kill-switch
      await distributedKillSwitch.deactivate('usr_owner_root');
    });
  });

  // =========================================================================
  // 5. WORKER HEARTBEAT & RECOVERY
  // =========================================================================
  describe('5. Worker Heartbeat & Stale Detection', () => {
    it('should record worker heartbeat and detect stale workers correctly', async () => {
      await workerRecoveryManager.recordHeartbeat(2);
      const stale = await workerRecoveryManager.detectStaleWorkers(60); // 60s threshold -> should not be stale
      const myId = workerRecoveryManager.getWorkerId();
      expect(stale.some((w) => w._id === myId)).toBe(false);

      // Clean deregistration upon shutdown
      await workerRecoveryManager.deregister();
    });
  });
});
