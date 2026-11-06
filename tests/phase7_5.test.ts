import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { FastifyInstance } from 'fastify';
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
import { generateAuthTokens, distributedKillSwitch } from '@ai-command-center/security';
import { taskDispatcherService, BaseTaskPayload } from '@ai-command-center/automation';
import { ceoQueueProcessor } from '../apps/worker/src/ceo-processor.js';
import { buildServer } from '../apps/api/src/server.js';

describe('Phase 7.5 — Human Approval & Safe Task Resumption Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let server: FastifyInstance;
  let objectiveRepo: ObjectiveRepository;
  let taskRepo: OrchestratorTaskRepository;
  let approvalRepo: ApprovalRepository;

  const jwtSecret = 'test_jwt_secret_must_be_32_characters_long_123';
  const refreshSecret = 'test_refresh_secret_must_be_32_characters_long';

  let ownerToken: string;
  let nonOwnerToken: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_ceo_approvals');

    await mongoDbService.connect(uri, 'test_ceo_approvals');
    await initializeDatabaseIndexes(uri, 'test_ceo_approvals');

    objectiveRepo = new ObjectiveRepository(db);
    taskRepo = new OrchestratorTaskRepository(db);
    approvalRepo = new ApprovalRepository(db);

    server = await buildServer();

    // Generate tokens
    const ownerTokens = generateAuthTokens(
      {
        userId: 'usr_owner_root_001',
        email: 'owner@ai-command-center.local',
        isOwner: true,
        role: 'OWNER',
        permissions: ['*:*']
      },
      jwtSecret,
      refreshSecret
    );
    ownerToken = ownerTokens.accessToken;

    const nonOwnerTokens = generateAuthTokens(
      {
        userId: 'usr_operator_regular_002',
        email: 'operator@ai-command-center.local',
        isOwner: false,
        role: 'OPERATOR',
        permissions: ['read:approval', 'read:task']
      },
      jwtSecret,
      refreshSecret
    );
    nonOwnerToken = nonOwnerTokens.accessToken;
  });

  afterAll(async () => {
    await server.close();
    await mongoDbService.disconnect();
    await client.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    await distributedKillSwitch.deactivate('usr_owner_root_001');
  });

  // -------------------------------------------------------------------------
  // 1. OWNER APPROVAL & REJECTION GATES (RBAC & AUTH)
  // -------------------------------------------------------------------------
  describe('1. Owner Approval & Rejection Authority', () => {
    it('should reject approval request if user is not an authenticated Owner (403 Forbidden)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/ceo/approvals/appr_test_001/approve',
        headers: { authorization: `Bearer ${nonOwnerToken}` },
        payload: { reason: 'Unauthorized approval attempt' }
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error).toBe('FORBIDDEN');
    });

    it('should reject rejection request if user is not an authenticated Owner (403 Forbidden)', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/ceo/approvals/appr_test_001/reject',
        headers: { authorization: `Bearer ${nonOwnerToken}` },
        payload: { reason: 'Unauthorized rejection attempt' }
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error).toBe('FORBIDDEN');
    });

    it('should return 404 when approving a non-existent approval request', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/ceo/approvals/appr_non_existent/approve',
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { reason: 'Valid owner sign-off' }
      });

      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe('NOT_FOUND');
    });
  });

  // -------------------------------------------------------------------------
  // 2. APPROVAL LIFECYCLE: PENDING -> APPROVED -> RESUMPTION
  // -------------------------------------------------------------------------
  describe('2. Full Approval Lifecycle & Safe Resumption', () => {
    it('should approve a pending high-risk task and dispatch it to BullMQ for resumption', async () => {
      // 1. Setup Objective and Task in WAITING_APPROVAL state
      const obj = await objectiveRepo.create({
        objectiveId: 'obj_appr_resume_001',
        title: 'Capital Allocation Initiative',
        description: 'Requires owner financial approval',
        status: ObjectiveStatus.ACTIVE,
        priority: 1,
        departmentIds: ['FINANCE'],
        ownerId: 'usr_owner_root_001'
      });

      const task = await taskRepo.create({
        taskId: 'tsk_appr_resume_001',
        objectiveId: obj.objectiveId,
        departmentId: 'FINANCE',
        specialistId: 'spec_finance_lead',
        title: 'Allocate $50,000 Budget',
        description: 'Financial commitment approval',
        status: TaskStatus.WAITING_APPROVAL,
        priority: 1,
        input: { budget: 50000, currency: 'USD' },
        maxAttempts: 3
      });

      const approval = await approvalRepo.create({
        approvalId: 'appr_resume_001',
        objectiveId: obj.objectiveId,
        taskId: task.taskId,
        requestedBy: 'spec_finance_lead',
        approvalType: 'FINANCIAL_COMMITMENT',
        description: 'Action requires owner confirmation: Allocate $50,000 Budget',
        riskLevel: 'CRITICAL',
        status: ApprovalStatus.PENDING,
        metadata: { budget: 50000 }
      });

      // 2. Owner approves via REST API
      const res = await server.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${approval.approvalId}/approve`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { reason: 'Verified by CFO and Owner' }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe(ApprovalStatus.APPROVED);
      expect(body.data.taskId).toBe(task.taskId);

      // 3. Verify in database: Approval is APPROVED
      const updatedApproval = await approvalRepo.findById(approval.approvalId);
      expect(updatedApproval?.status).toBe(ApprovalStatus.APPROVED);
      expect(updatedApproval?.reviewedBy).toBe('usr_owner_root_001');

      // 4. Verify in database: Task transitioned to QUEUED for resumption
      const updatedTask = await taskRepo.findById(task.taskId);
      expect(updatedTask?.status).toBe(TaskStatus.QUEUED);
      expect(updatedTask?.output?.approvedBy).toBe('usr_owner_root_001');

      // 5. Simulate Worker executing the resumed task
      const resumedJob = {
        id: task.taskId,
        data: {
          taskId: task.taskId,
          objectiveId: obj.objectiveId,
          specialistId: task.specialistId,
          departmentId: task.departmentId,
          action: 'RESUME_AFTER_APPROVAL',
          idempotencyKey: `idemp_${task.taskId}`,
          priority: 1,
          data: {
            ...task.input,
            title: task.title,
            description: task.description,
            isResumedExecution: true
          },
          createdAt: new Date().toISOString()
        }
      } as unknown as import('bullmq').Job<BaseTaskPayload, import('../apps/worker/src/ceo-processor.js').ProcessorExecutionResult>;

      const workerRes = await ceoQueueProcessor.processJob(resumedJob);
      expect(workerRes.status).toBe('COMPLETED');
      expect(workerRes.taskId).toBe(task.taskId);

      // 6. Verify task finished as COMPLETED
      const completedTask = await taskRepo.findById(task.taskId);
      expect(completedTask?.status).toBe(TaskStatus.COMPLETED);
    });

    it('should handle idempotent re-approval without duplicate dispatch or state mutation', async () => {
      const approval = await approvalRepo.findById('appr_resume_001');
      expect(approval?.status).toBe(ApprovalStatus.APPROVED);

      // Repeated approval request with same key
      const res = await server.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${approval?.approvalId}/approve`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { reason: 'Duplicate sign-off click' }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.isReplay).toBe(true);
      expect(body.data.status).toBe(ApprovalStatus.APPROVED);
    });
  });

  // -------------------------------------------------------------------------
  // 3. REJECTION LIFECYCLE: PENDING -> REJECTED & SAFE STOP
  // -------------------------------------------------------------------------
  describe('3. Rejection Lifecycle & Safe Stopping', () => {
    it('should reject a pending task, mark it REJECTED, cancel the task, and fail the objective', async () => {
      const obj = await objectiveRepo.create({
        objectiveId: 'obj_appr_reject_001',
        title: 'Unverified High Risk Spend',
        description: 'Should be rejected',
        status: ObjectiveStatus.ACTIVE,
        priority: 1,
        departmentIds: ['OPERATIONS'],
        ownerId: 'usr_owner_root_001'
      });

      const task = await taskRepo.create({
        taskId: 'tsk_appr_reject_001',
        objectiveId: obj.objectiveId,
        departmentId: 'OPERATIONS',
        specialistId: 'spec_ops_manager',
        title: 'Sign Risky Vendor Contract',
        description: 'Vendor contract',
        status: TaskStatus.WAITING_APPROVAL,
        priority: 1,
        input: { vendor: 'Acme Unknown' },
        maxAttempts: 3
      });

      const approval = await approvalRepo.create({
        approvalId: 'appr_reject_001',
        objectiveId: obj.objectiveId,
        taskId: task.taskId,
        requestedBy: 'spec_ops_manager',
        approvalType: 'CONTRACTUAL_SIGN_OFF',
        description: 'Action requires owner confirmation: Sign Risky Vendor Contract',
        riskLevel: 'CRITICAL',
        status: ApprovalStatus.PENDING,
        metadata: { vendor: 'Acme Unknown' }
      });

      // Owner rejects
      const res = await server.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${approval.approvalId}/reject`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { reason: 'Vendor credentials not verified. Terminated.' }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.status).toBe(ApprovalStatus.REJECTED);
      expect(body.data.decisionReason).toContain('Vendor credentials not verified');

      // Verify in DB
      const updatedApproval = await approvalRepo.findById(approval.approvalId);
      expect(updatedApproval?.status).toBe(ApprovalStatus.REJECTED);

      const cancelledTask = await taskRepo.findById(task.taskId);
      expect(cancelledTask?.status).toBe(TaskStatus.CANCELLED);
      expect(cancelledTask?.error).toContain('Rejected by Owner');

      const failedObj = await objectiveRepo.findById(obj.objectiveId);
      expect(failedObj?.status).toBe(ObjectiveStatus.FAILED);
    });

    it('should return 409 Conflict if attempting to approve an already REJECTED approval', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/ceo/approvals/appr_reject_001/approve',
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { reason: 'Trying to approve after rejection' }
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error).toBe('CONFLICT');
    });

    it('should return 409 Conflict if attempting to reject an already APPROVED approval', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/ceo/approvals/appr_resume_001/reject',
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { reason: 'Trying to reject after approval' }
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error).toBe('CONFLICT');
    });
  });

  // -------------------------------------------------------------------------
  // 4. ATOMIC CONCURRENCY & EXPIRED / CANCELLED EDGE CASES
  // -------------------------------------------------------------------------
  describe('4. Concurrency & Edge Cases', () => {
    it('should prevent conflicting concurrent approve and reject decisions (atomic winner)', async () => {
      const obj = await objectiveRepo.create({
        objectiveId: 'obj_appr_race_001',
        title: 'Concurrent Race Objective',
        description: 'Race condition testing',
        status: ObjectiveStatus.ACTIVE,
        priority: 1,
        departmentIds: ['ENGINEERING'],
        ownerId: 'usr_owner_root_001'
      });

      const task = await taskRepo.create({
        taskId: 'tsk_appr_race_001',
        objectiveId: obj.objectiveId,
        departmentId: 'ENGINEERING',
        specialistId: 'spec_eng_lead',
        title: 'Production Deploy Action',
        description: 'Needs approval',
        status: TaskStatus.WAITING_APPROVAL,
        priority: 1,
        input: {},
        maxAttempts: 3
      });

      const approval = await approvalRepo.create({
        approvalId: 'appr_race_001',
        objectiveId: obj.objectiveId,
        taskId: task.taskId,
        requestedBy: 'spec_eng_lead',
        approvalType: 'PRODUCTION_DEPLOY',
        riskLevel: 'HIGH',
        status: ApprovalStatus.PENDING,
        description: 'Deploy approval',
        metadata: {}
      });

      // Fire approve and reject concurrently
      const [resApprove, resReject] = await Promise.all([
        server.inject({
          method: 'POST',
          url: `/api/ceo/approvals/${approval.approvalId}/approve`,
          headers: { authorization: `Bearer ${ownerToken}` },
          payload: { reason: 'Approve concurrent' }
        }),
        server.inject({
          method: 'POST',
          url: `/api/ceo/approvals/${approval.approvalId}/reject`,
          headers: { authorization: `Bearer ${ownerToken}` },
          payload: { reason: 'Reject concurrent' }
        })
      ]);

      const codes = [resApprove.statusCode, resReject.statusCode];
      // Exactly ONE must succeed with 200, and the other must return 409 Conflict
      expect(codes).toContain(200);
      expect(codes).toContain(409);
    });

    it('should block approval if Emergency Kill-Switch is active (503 Service Unavailable)', async () => {
      // Create pending approval
      const obj = await objectiveRepo.create({
        objectiveId: 'obj_appr_kill_001',
        title: 'Kill-Switch Blocked Objective',
        description: 'Test emergency halt during approval',
        status: ObjectiveStatus.ACTIVE,
        priority: 1,
        departmentIds: ['EXECUTIVE'],
        ownerId: 'usr_owner_root_001'
      });

      const task = await taskRepo.create({
        taskId: 'tsk_appr_kill_001',
        objectiveId: obj.objectiveId,
        departmentId: 'EXECUTIVE',
        specialistId: 'spec_ceo',
        title: 'Halted Action',
        description: 'Halted',
        status: TaskStatus.WAITING_APPROVAL,
        priority: 1,
        input: {},
        maxAttempts: 3
      });

      const approval = await approvalRepo.create({
        approvalId: 'appr_kill_001',
        objectiveId: obj.objectiveId,
        taskId: task.taskId,
        requestedBy: 'spec_ceo',
        approvalType: 'CRITICAL_ACTION',
        riskLevel: 'CRITICAL',
        status: ApprovalStatus.PENDING,
        description: 'Halt check',
        metadata: {}
      });

      // Activate Emergency Kill-Switch
      await distributedKillSwitch.activate('usr_owner_root_001', 'Emergency drill');

      // Attempt to approve
      const res = await server.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${approval.approvalId}/approve`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { reason: 'Should be blocked by kill-switch' }
      });

      expect(res.statusCode).toBe(503);
      expect(res.json().error).toBe('KILL_SWITCH_ACTIVE');

      // Task must remain in WAITING_APPROVAL
      const taskCheck = await taskRepo.findById(task.taskId);
      expect(taskCheck?.status).toBe(TaskStatus.WAITING_APPROVAL);

      // Deactivate kill-switch
      await distributedKillSwitch.deactivate('usr_owner_root_001');
    });

    it('should refuse approval of an EXPIRED request (409 Conflict)', async () => {
      const approval = await approvalRepo.create({
        approvalId: 'appr_expired_001',
        objectiveId: 'obj_exp_001',
        taskId: 'tsk_exp_001',
        requestedBy: 'spec_ceo',
        approvalType: 'TIMEOUT_ACTION',
        riskLevel: 'MEDIUM',
        status: ApprovalStatus.PENDING,
        description: 'Will expire',
        metadata: {}
      });

      // Expire request
      await approvalRepo.expire(approval.approvalId);

      const res = await server.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${approval.approvalId}/approve`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { reason: 'Late approval' }
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error).toBe('CONFLICT');
    });
  });
});

