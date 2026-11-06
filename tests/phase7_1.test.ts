import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import {
  ObjectiveRepository,
  OrchestratorTaskRepository,
  ApprovalRepository,
  ObjectiveStatus,
  TaskStatus,
  ApprovalStatus,
  initializeDatabaseIndexes,
  mongoDbService
} from '../packages/database/src/index.js';

describe('Phase 7.1 — CEO Orchestrator Database Persistence Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let objectiveRepo: ObjectiveRepository;
  let taskRepo: OrchestratorTaskRepository;
  let approvalRepo: ApprovalRepository;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_ceo_persistence');

    // Also connect singleton mongoDbService for index testing
    await mongoDbService.connect(uri, 'test_ceo_persistence');

    objectiveRepo = new ObjectiveRepository(db);
    taskRepo = new OrchestratorTaskRepository(db);
    approvalRepo = new ApprovalRepository(db);
  }, 30000);

  afterAll(async () => {
    await client.close();
    await mongoDbService.disconnect();
    await mongod.stop();
  });

  describe('1. Idempotent Index Initialization', () => {
    it('should initialize all required indexes across collections without error', async () => {
      const results = await initializeDatabaseIndexes(mongod.getUri(), 'test_ceo_persistence');
      expect(results.length).toBeGreaterThanOrEqual(9);

      const objIdx = results.find((r) => r.collection === 'business_objectives');
      expect(objIdx).toBeDefined();
      expect(objIdx?.indexesCreated.length).toBe(3);

      const taskIdx = results.find((r) => r.collection === 'orchestrator_tasks');
      expect(taskIdx).toBeDefined();
      expect(taskIdx?.indexesCreated.length).toBe(6); // Includes unique idempotencyKey index

      const appIdx = results.find((r) => r.collection === 'approval_requests');
      expect(appIdx).toBeDefined();
      expect(appIdx?.indexesCreated.length).toBe(4);
    });
  });

  describe('2. Business Objective Persistence', () => {
    it('should create and retrieve a business objective', async () => {
      const obj = await objectiveRepo.create({
        objectiveId: 'obj_test_001',
        title: 'Launch Enterprise Automation Platform',
        description: 'Autonomous deployment of digital services',
        ownerId: 'usr_owner_01',
        status: ObjectiveStatus.PENDING,
        priority: 1,
        departmentIds: ['EXECUTIVE', 'ENGINEERING'],
        metadata: { budgetUsd: 0, zeroCost: true }
      });

      expect(obj.objectiveId).toBe('obj_test_001');
      expect(obj.createdAt).toBeInstanceOf(Date);
      expect(obj.updatedAt).toBeInstanceOf(Date);

      const fetched = await objectiveRepo.findById('obj_test_001');
      expect(fetched).not.toBeNull();
      expect(fetched?.title).toBe('Launch Enterprise Automation Platform');
    });

    it('should enforce unique objectiveId index', async () => {
      await expect(
        objectiveRepo.create({
          objectiveId: 'obj_test_001', // duplicate
          title: 'Duplicate Objective',
          description: 'Duplicate',
          ownerId: 'usr_owner_01',
          status: ObjectiveStatus.DRAFT,
          priority: 2,
          departmentIds: ['OPERATIONS'],
          metadata: {}
        })
      ).rejects.toThrow();
    });

    it('should atomically update status with timestamp', async () => {
      const updated = await objectiveRepo.updateStatus(
        'obj_test_001',
        ObjectiveStatus.ACTIVE,
        ObjectiveStatus.PENDING
      );
      expect(updated).toBe(true);

      const fetched = await objectiveRepo.findById('obj_test_001');
      expect(fetched?.status).toBe(ObjectiveStatus.ACTIVE);
      expect(fetched?.startedAt).toBeInstanceOf(Date);

      // Transition with wrong currentStatus must fail atomically
      const invalidTransition = await objectiveRepo.updateStatus(
        'obj_test_001',
        ObjectiveStatus.COMPLETED,
        ObjectiveStatus.DRAFT // Mismatch
      );
      expect(invalidTransition).toBe(false);
    });

    it('should cancel an objective cleanly', async () => {
      const cancelled = await objectiveRepo.cancel('obj_test_001', 'Strategic Shift');
      expect(cancelled).toBe(true);

      const fetched = await objectiveRepo.findById('obj_test_001');
      expect(fetched?.status).toBe(ObjectiveStatus.CANCELLED);
      expect(fetched?.metadata.cancelReason).toBe('Strategic Shift');
    });

    it('should paginate objectives correctly', async () => {
      // Seed 5 objectives
      for (let i = 2; i <= 6; i++) {
        await objectiveRepo.create({
          objectiveId: `obj_test_00${i}`,
          title: `Objective #${i}`,
          description: `Description ${i}`,
          ownerId: 'usr_owner_01',
          status: ObjectiveStatus.PENDING,
          priority: i,
          departmentIds: ['EXECUTIVE'],
          metadata: {}
        });
      }

      const paged = await objectiveRepo.list({}, { limit: 3, skip: 0, sortBy: 'priority', sortOrder: 'asc' });
      expect(paged.items.length).toBe(3);
      expect(paged.total).toBe(6);
      expect(paged.items[0].priority).toBe(1);
    });
  });

  describe('3. Orchestrator Task Persistence', () => {
    it('should create and retrieve an orchestrator task', async () => {
      const task = await taskRepo.create({
        taskId: 'tsk_test_001',
        objectiveId: 'obj_test_002',
        departmentId: 'ENGINEERING',
        specialistId: 'spec_eng_architect_01',
        title: 'Design Scalable Microservices Architecture',
        description: 'Architecture specifications',
        status: TaskStatus.PENDING,
        priority: 1,
        input: { service: 'Fastify API' },
        maxAttempts: 3,
        metadata: { zeroCost: true }
      });

      expect(task.taskId).toBe('tsk_test_001');
      expect(task.attemptCount).toBe(0);
      expect(task.createdAt).toBeInstanceOf(Date);

      const fetched = await taskRepo.findById('tsk_test_001');
      expect(fetched?.specialistId).toBe('spec_eng_architect_01');
    });

    it('should enforce unique taskId constraint', async () => {
      await expect(
        taskRepo.create({
          taskId: 'tsk_test_001', // duplicate
          objectiveId: 'obj_test_002',
          departmentId: 'ENGINEERING',
          specialistId: 'spec_eng_02',
          title: 'Duplicate',
          description: 'Duplicate',
          status: TaskStatus.PENDING,
          priority: 1,
          input: {},
          maxAttempts: 3,
          metadata: {}
        })
      ).rejects.toThrow();
    });

    it('should atomically transition status and increment attempts on RUNNING', async () => {
      const started = await taskRepo.updateStatus(
        'tsk_test_001',
        TaskStatus.RUNNING,
        TaskStatus.PENDING
      );
      expect(started).toBe(true);

      const fetched = await taskRepo.findById('tsk_test_001');
      expect(fetched?.status).toBe(TaskStatus.RUNNING);
      expect(fetched?.attemptCount).toBe(1);
      expect(fetched?.startedAt).toBeInstanceOf(Date);
    });

    it('should record output upon completion', async () => {
      const completed = await taskRepo.updateStatus(
        'tsk_test_001',
        TaskStatus.COMPLETED,
        TaskStatus.RUNNING,
        { output: { schema: 'v1_final', approved: true } }
      );
      expect(completed).toBe(true);

      const fetched = await taskRepo.findById('tsk_test_001');
      expect(fetched?.status).toBe(TaskStatus.COMPLETED);
      expect(fetched?.output).toEqual({ schema: 'v1_final', approved: true });
      expect(fetched?.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('4. Approval Request Persistence', () => {
    it('should create and retrieve an approval request', async () => {
      const req = await approvalRepo.create({
        approvalId: 'appr_test_001',
        objectiveId: 'obj_test_002',
        taskId: 'tsk_test_002',
        requestedBy: 'spec_eng_architect_01',
        approvalType: 'PRODUCTION_DEPLOYMENT',
        description: 'Deploy API to staging environment',
        riskLevel: 'HIGH',
        status: ApprovalStatus.PENDING,
        metadata: { targetEnv: 'staging' }
      });

      expect(req.approvalId).toBe('appr_test_001');
      expect(req.status).toBe(ApprovalStatus.PENDING);
      expect(req.requestedAt).toBeInstanceOf(Date);

      const fetched = await approvalRepo.findById('appr_test_001');
      expect(fetched?.riskLevel).toBe('HIGH');
    });

    it('should record human-in-the-loop owner approval atomically', async () => {
      const decided = await approvalRepo.recordDecision(
        'appr_test_001',
        ApprovalStatus.APPROVED,
        'usr_owner_root',
        'Staging verification approved'
      );
      expect(decided).toBe(true);

      const fetched = await approvalRepo.findById('appr_test_001');
      expect(fetched?.status).toBe(ApprovalStatus.APPROVED);
      expect(fetched?.reviewedBy).toBe('usr_owner_root');
      expect(fetched?.reviewedAt).toBeInstanceOf(Date);
      expect(fetched?.decisionReason).toBe('Staging verification approved');

      // Subsequent decision on already approved item must fail
      const repeat = await approvalRepo.recordDecision(
        'appr_test_001',
        ApprovalStatus.REJECTED,
        'usr_intruder'
      );
      expect(repeat).toBe(false);
    });
  });

  describe('5. Recovery & Reliability After Interruption', () => {
    it('should accurately categorize unfinished tasks', async () => {
      // Seed interrupted running task
      await taskRepo.create({
        taskId: 'tsk_interrupted_001',
        objectiveId: 'obj_test_003',
        departmentId: 'OPERATIONS',
        specialistId: 'spec_ops_01',
        title: 'Background Batch Processing',
        description: 'Processing batch',
        status: TaskStatus.RUNNING,
        priority: 2,
        input: {},
        maxAttempts: 3,
        metadata: {}
      });

      // Seed task waiting approval
      await taskRepo.create({
        taskId: 'tsk_waiting_001',
        objectiveId: 'obj_test_003',
        departmentId: 'SECURITY',
        specialistId: 'spec_sec_01',
        title: 'Grant System Access Token',
        description: 'Access request',
        status: TaskStatus.WAITING_APPROVAL,
        priority: 1,
        input: {},
        maxAttempts: 1,
        metadata: {}
      });

      const unfinished = await taskRepo.findUnfinishedTasks();
      expect(unfinished.interruptedRunning.some((t) => t.taskId === 'tsk_interrupted_001')).toBe(true);
      expect(unfinished.waitingApproval.some((t) => t.taskId === 'tsk_waiting_001')).toBe(true);
    });

    it('should recover interrupted running tasks back to QUEUED', async () => {
      const recovery = await taskRepo.recoverInterruptedRunningTasks();
      expect(recovery.requeued).toBeGreaterThanOrEqual(1);

      const recoveredTask = await taskRepo.findById('tsk_interrupted_001');
      expect(recoveredTask?.status).toBe(TaskStatus.QUEUED);
      expect(recoveredTask?.error).toContain('Interrupted by server restart');

      // Waiting approval tasks must NEVER be auto-requeued or auto-executed
      const waitingTask = await taskRepo.findById('tsk_waiting_001');
      expect(waitingTask?.status).toBe(TaskStatus.WAITING_APPROVAL);
    });
  });
});

