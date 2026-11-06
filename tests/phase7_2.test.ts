import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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
import { generateAuthTokens } from '@ai-command-center/security';
import { buildServer } from '../apps/api/src/server.js';

describe('Phase 7.2 — Fastify CEO Orchestrator REST API Integration Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let server: FastifyInstance;
  let objectiveRepo: ObjectiveRepository;
  let taskRepo: OrchestratorTaskRepository;
  let approvalRepo: ApprovalRepository;

  const jwtSecret = 'test_jwt_secret_must_be_32_characters_long_123';
  const refreshSecret = 'test_refresh_secret_must_be_32_characters_long';

  // Auth tokens
  let ownerToken: string;
  let user1Token: string;
  let user2Token: string;
  let noPermToken: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_ceo_api');

    // Connect mongoDbService singleton so Fastify handlers can access the test database
    await mongoDbService.connect(uri, 'test_ceo_api');
    await initializeDatabaseIndexes(uri, 'test_ceo_api');

    objectiveRepo = new ObjectiveRepository(db);
    taskRepo = new OrchestratorTaskRepository(db);
    approvalRepo = new ApprovalRepository(db);

    // Build Fastify Server
    server = await buildServer();

    // 1. Owner Token (Full administrative access)
    ownerToken = generateAuthTokens(
      {
        userId: 'usr_owner_root',
        email: 'owner@ai-command-center.local',
        isOwner: true,
        role: 'OWNER'
      },
      jwtSecret,
      refreshSecret
    ).accessToken;

    // 2. User 1 Token (Manager with standard permissions)
    user1Token = generateAuthTokens(
      {
        userId: 'usr_manager_01',
        email: 'manager1@ai-command-center.local',
        isOwner: false,
        role: 'MANAGER',
        permissions: ['create:objective', 'read:objective', 'execute:objective', 'read:task', 'read:approval']
      } as unknown as { userId: string; email: string; isOwner: boolean; role: string },
      jwtSecret,
      refreshSecret
    ).accessToken;

    // 3. User 2 Token (Another manager with standard permissions)
    user2Token = generateAuthTokens(
      {
        userId: 'usr_manager_02',
        email: 'manager2@ai-command-center.local',
        isOwner: false,
        role: 'MANAGER',
        permissions: ['create:objective', 'read:objective', 'execute:objective', 'read:task', 'read:approval']
      } as unknown as { userId: string; email: string; isOwner: boolean; role: string },
      jwtSecret,
      refreshSecret
    ).accessToken;

    // 4. Token with no permissions
    noPermToken = generateAuthTokens(
      {
        userId: 'usr_restricted_01',
        email: 'guest@ai-command-center.local',
        isOwner: false,
        role: 'GUEST',
        permissions: []
      } as unknown as { userId: string; email: string; isOwner: boolean; role: string },
      jwtSecret,
      refreshSecret
    ).accessToken;
  }, 30000);

  afterAll(async () => {
    await server.close();
    await client.close();
    await mongoDbService.disconnect();
    await mongod.stop();
  });

  // =========================================================================
  // 1. AUTHENTICATION & RBAC PERMISSION ENFORCEMENT
  // =========================================================================
  describe('1. Authentication & RBAC Gates', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/objectives'
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error).toBe('UNAUTHORIZED');
    });

    it('should reject requests with invalid bearer token with 401', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/objectives',
        headers: { authorization: 'Bearer invalid_token_123' }
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error).toBe('INVALID_TOKEN');
    });

    it('should deny access with 403 when user lacks required RBAC permission', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/ceo/objectives',
        headers: { authorization: `Bearer ${noPermToken}` },
        payload: {
          title: 'Unauthorized Objective',
          description: 'Should be denied',
          priority: 3,
          departmentIds: ['EXECUTIVE']
        }
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error).toBe('FORBIDDEN');
    });
  });

  // =========================================================================
  // 2. POST /api/ceo/objectives — Objective Creation & Validation
  // =========================================================================
  describe('2. POST /api/ceo/objectives', () => {
    it('should validate request body and reject invalid payloads with 400', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/ceo/objectives',
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          title: 'Hi', // too short (< 3 chars)
          priority: 99 // exceeds max 5
        }
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe('VALIDATION_ERROR');
    });

    it('should create a business objective and persist in MongoDB with 201', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/ceo/objectives',
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          title: 'Automate Customer Retention Pipeline',
          description: 'Deploy AI specialist agents to analyze customer churn indicators',
          priority: 2,
          departmentIds: ['EXECUTIVE', 'SALES'],
          metadata: { targetQuarter: 'Q4' }
        }
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.objectiveId).toBeDefined();
      expect(body.data.ownerId).toBe('usr_manager_01');
      expect(body.data.status).toBe(ObjectiveStatus.DRAFT);
      expect(body.data.priority).toBe(2);

      // Verify in persistent MongoDB collection
      const stored = await objectiveRepo.findById(body.data.objectiveId);
      expect(stored).not.toBeNull();
      expect(stored?.title).toBe('Automate Customer Retention Pipeline');
    });
  });

  // =========================================================================
  // 3. GET /api/ceo/objectives — Pagination & Tenant Isolation
  // =========================================================================
  describe('3. GET /api/ceo/objectives', () => {
    let objCreatedByUser1: string;
    let objCreatedByUser2: string;

    beforeAll(async () => {
      // Seed an objective for user1
      const o1 = await objectiveRepo.create({
        objectiveId: 'obj_u1_test_01',
        title: 'User 1 Private Objective',
        description: 'Confidential project by User 1',
        ownerId: 'usr_manager_01',
        status: ObjectiveStatus.PENDING,
        priority: 1,
        departmentIds: ['FINANCE'],
        metadata: {}
      });
      objCreatedByUser1 = o1.objectiveId;

      // Seed an objective for user2
      const o2 = await objectiveRepo.create({
        objectiveId: 'obj_u2_test_02',
        title: 'User 2 Private Objective',
        description: 'Confidential project by User 2',
        ownerId: 'usr_manager_02',
        status: ObjectiveStatus.PENDING,
        priority: 2,
        departmentIds: ['LEGAL'],
        metadata: {}
      });
      objCreatedByUser2 = o2.objectiveId;
    });

    it('should isolate non-owner queries so user1 cannot view user2 objectives', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/objectives',
        headers: { authorization: `Bearer ${user1Token}` }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      const ids = body.data.map((o: { objectiveId: string }) => o.objectiveId);
      expect(ids).toContain(objCreatedByUser1);
      expect(ids).not.toContain(objCreatedByUser2);
    });

    it('should allow owner to view all objectives across all users', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/objectives',
        headers: { authorization: `Bearer ${ownerToken}` }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      const ids = body.data.map((o: { objectiveId: string }) => o.objectiveId);
      expect(ids).toContain(objCreatedByUser1);
      expect(ids).toContain(objCreatedByUser2);
    });

    it('should support pagination limit and skip', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/objectives?limit=1&skip=0',
        headers: { authorization: `Bearer ${ownerToken}` }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBe(1);
      expect(body.pagination.total).toBeGreaterThanOrEqual(2);
      expect(body.pagination.limit).toBe(1);
    });
  });

  // =========================================================================
  // 4. GET /api/ceo/objectives/:id — Objective Details & Sub-Tasks
  // =========================================================================
  describe('4. GET /api/ceo/objectives/:id', () => {
    it('should return 404 for nonexistent objective', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/objectives/obj_nonexistent_999',
        headers: { authorization: `Bearer ${ownerToken}` }
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe('NOT_FOUND');
    });

    it('should block non-owner from accessing another users objective by ID with 403', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/objectives/obj_u2_test_02',
        headers: { authorization: `Bearer ${user1Token}` } // User 1 trying to access User 2's objective
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().error).toBe('FORBIDDEN');
    });

    it('should return objective details and its sub-tasks for owner', async () => {
      // Add a sub-task for obj_u1_test_01
      await taskRepo.create({
        taskId: 'tsk_sub_001',
        objectiveId: 'obj_u1_test_01',
        departmentId: 'FINANCE',
        specialistId: 'spec_fin_analyst',
        title: 'Financial Risk Assessment',
        description: 'Audit portfolio risk',
        status: TaskStatus.PENDING,
        priority: 1,
        input: {},
        maxAttempts: 3,
        metadata: {}
      });

      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/objectives/obj_u1_test_01',
        headers: { authorization: `Bearer ${ownerToken}` }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.objectiveId).toBe('obj_u1_test_01');
      expect(body.data.tasks).toBeDefined();
      expect(body.data.tasks.length).toBeGreaterThanOrEqual(1);
      expect(body.data.tasks[0].taskId).toBe('tsk_sub_001');
    });
  });

  // =========================================================================
  // 5. POST /api/ceo/objectives/:id/execute — Execution Registration & Idempotency Audit
  // =========================================================================
  describe('5. POST /api/ceo/objectives/:id/execute — Idempotency & Concurrency Audit', () => {
    let executableObjId: string;

    beforeAll(async () => {
      const obj = await objectiveRepo.create({
        objectiveId: 'obj_exec_test_01',
        title: 'Execute Infrastructure Modernization',
        description: 'Orchestrate migration to containerized architecture',
        ownerId: 'usr_manager_01',
        status: ObjectiveStatus.DRAFT,
        priority: 1,
        departmentIds: ['ENGINEERING', 'OPERATIONS'],
        metadata: {}
      });
      executableObjId = obj.objectiveId;
    });

    // Case A: First request with key K -> Exactly one execution/task created, 202 Accepted returned
    it('Case A: should accept first execution request with key K and return 202 Accepted', async () => {
      const res = await server.inject({
        method: 'POST',
        url: `/api/ceo/objectives/${executableObjId}/execute`,
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          idempotencyKey: 'idemp_key_unique_001',
          executionNotes: 'Scheduled execution'
        }
      });

      expect(res.statusCode).toBe(202);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.status).toBe(ObjectiveStatus.ACTIVE);
      expect(body.initialTask).toBeDefined();
      expect(body.initialTask.status).toBe(TaskStatus.PENDING);

      // Verify exactly one task created in MongoDB
      const tasks = await taskRepo.list({ objectiveId: executableObjId });
      expect(tasks.total).toBe(1);

      // Verify objective state is ACTIVE
      const updatedObj = await objectiveRepo.findById(executableObjId);
      expect(updatedObj?.status).toBe(ObjectiveStatus.ACTIVE);
    });

    // Case B: Retry same objective and same key K -> Return existing execution with 202 Accepted (not an error)
    it('Case B: should handle retry of same objective and same key K gracefully with 202 replay', async () => {
      const res = await server.inject({
        method: 'POST',
        url: `/api/ceo/objectives/${executableObjId}/execute`,
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          idempotencyKey: 'idemp_key_unique_001',
          executionNotes: 'Network retry of first request'
        }
      });

      expect(res.statusCode).toBe(202);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.isReplay).toBe(true);
      expect(body.idempotencyKey).toBe('idemp_key_unique_001');

      // Verify no duplicate tasks were created
      const tasks = await taskRepo.list({ objectiveId: executableObjId });
      expect(tasks.total).toBe(1);
    });

    // Case C: Same key K with a different objective -> Return 409 Conflict
    it('Case C: should reject reuse of same key K on a different objective with 409 Conflict', async () => {
      const otherObj = await objectiveRepo.create({
        objectiveId: 'obj_exec_different_02',
        title: 'Different Objective',
        description: 'Should not reuse key',
        ownerId: 'usr_manager_01',
        status: ObjectiveStatus.DRAFT,
        priority: 2,
        departmentIds: ['MARKETING'],
        metadata: {}
      });

      const res = await server.inject({
        method: 'POST',
        url: `/api/ceo/objectives/${otherObj.objectiveId}/execute`,
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          idempotencyKey: 'idemp_key_unique_001' // Same key as used for executableObjId!
        }
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error).toBe('IDEMPOTENCY_CONFLICT');
    });

    // Case D: Different key with an already active objective -> Return 409 Conflict
    it('Case D: should reject execution of an already ACTIVE objective with a different key with 409', async () => {
      const res = await server.inject({
        method: 'POST',
        url: `/api/ceo/objectives/${executableObjId}/execute`,
        headers: { authorization: `Bearer ${user1Token}` },
        payload: {
          idempotencyKey: 'idemp_key_brand_new_002'
        }
      });

      expect(res.statusCode).toBe(409);
      expect(res.json().error).toBe('CONFLICT');
    });

    // Case E: Concurrent requests racing with the same key -> Database-level atomicity creates exactly one task
    it('Case E: should guarantee database-level atomicity under concurrent execution race with same key', async () => {
      const raceObj = await objectiveRepo.create({
        objectiveId: 'obj_race_test_03',
        title: 'Concurrency Race Objective',
        description: 'Testing atomic task creation',
        ownerId: 'usr_owner_root',
        status: ObjectiveStatus.DRAFT,
        priority: 1,
        departmentIds: ['EXECUTIVE'],
        metadata: {}
      });

      const sharedRaceKey = 'idemp_concurrent_race_key_777';

      // Fire 5 concurrent requests with the identical idempotency key simultaneously
      const results = await Promise.all([
        server.inject({
          method: 'POST',
          url: `/api/ceo/objectives/${raceObj.objectiveId}/execute`,
          headers: { authorization: `Bearer ${ownerToken}` },
          payload: { idempotencyKey: sharedRaceKey }
        }),
        server.inject({
          method: 'POST',
          url: `/api/ceo/objectives/${raceObj.objectiveId}/execute`,
          headers: { authorization: `Bearer ${ownerToken}` },
          payload: { idempotencyKey: sharedRaceKey }
        }),
        server.inject({
          method: 'POST',
          url: `/api/ceo/objectives/${raceObj.objectiveId}/execute`,
          headers: { authorization: `Bearer ${ownerToken}` },
          payload: { idempotencyKey: sharedRaceKey }
        }),
        server.inject({
          method: 'POST',
          url: `/api/ceo/objectives/${raceObj.objectiveId}/execute`,
          headers: { authorization: `Bearer ${ownerToken}` },
          payload: { idempotencyKey: sharedRaceKey }
        }),
        server.inject({
          method: 'POST',
          url: `/api/ceo/objectives/${raceObj.objectiveId}/execute`,
          headers: { authorization: `Bearer ${ownerToken}` },
          payload: { idempotencyKey: sharedRaceKey }
        })
      ]);

      // All requests should either be 202 Accepted (first or replay)
      for (const res of results) {
        expect(res.statusCode).toBe(202);
      }

      // Exactly ONE task must exist in the database for this objective
      const tasks = await taskRepo.list({ objectiveId: raceObj.objectiveId });
      expect(tasks.total).toBe(1);
    });
  });

  // =========================================================================
  // 6. GET /api/ceo/tasks/:id — Specific Task Query
  // =========================================================================
  describe('6. GET /api/ceo/tasks/:id', () => {
    let testTaskId: string;

    beforeAll(async () => {
      const t = await taskRepo.create({
        taskId: 'tsk_detail_test_001',
        objectiveId: 'obj_u1_test_01',
        departmentId: 'FINANCE',
        specialistId: 'spec_fin_auditor',
        title: 'Deep Ledger Audit',
        description: 'Audit records',
        status: TaskStatus.RUNNING,
        priority: 1,
        input: { depth: 'exhaustive' },
        maxAttempts: 3,
        metadata: {}
      });
      testTaskId = t.taskId;
    });

    it('should return 404 for nonexistent task ID', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/tasks/tsk_nonexistent_888',
        headers: { authorization: `Bearer ${ownerToken}` }
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe('NOT_FOUND');
    });

    it('should return task details for authorized user', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `/api/ceo/tasks/${testTaskId}`,
        headers: { authorization: `Bearer ${user1Token}` }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.taskId).toBe(testTaskId);
      expect(body.data.specialistId).toBe('spec_fin_auditor');
      expect(body.data.status).toBe(TaskStatus.RUNNING);
    });

    it('should enforce tenant isolation so user2 cannot inspect user1 tasks', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `/api/ceo/tasks/${testTaskId}`,
        headers: { authorization: `Bearer ${user2Token}` }
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().error).toBe('FORBIDDEN');
    });
  });

  // =========================================================================
  // 7. GET /api/ceo/approvals & /api/ceo/approvals/:id — Read-Only Verification
  // =========================================================================
  describe('7. Approvals Read-Only Endpoints', () => {
    let testApprovalId: string;

    beforeAll(async () => {
      const a = await approvalRepo.create({
        approvalId: 'appr_read_test_001',
        objectiveId: 'obj_u1_test_01',
        taskId: 'tsk_sub_001',
        requestedBy: 'spec_fin_analyst',
        approvalType: 'BUDGET_REALLOCATION',
        description: 'Approve $5,000 reallocation to automated testing',
        riskLevel: 'HIGH',
        status: ApprovalStatus.PENDING,
        metadata: { department: 'FINANCE' }
      });
      testApprovalId = a.approvalId;
    });

    it('should list approvals with pagination', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/approvals?limit=10',
        headers: { authorization: `Bearer ${ownerToken}` }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data.some((a: { approvalId: string }) => a.approvalId === testApprovalId)).toBe(true);
    });

    it('should retrieve a specific approval request by ID', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `/api/ceo/approvals/${testApprovalId}`,
        headers: { authorization: `Bearer ${ownerToken}` }
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.approvalId).toBe(testApprovalId);
      expect(body.data.riskLevel).toBe('HIGH');
      expect(body.data.status).toBe(ApprovalStatus.PENDING);
    });

    it('should return 404 for nonexistent approval ID', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/approvals/appr_nonexistent_999',
        headers: { authorization: `Bearer ${ownerToken}` }
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe('NOT_FOUND');
    });

    it('should confirm approval mutation routes are NOT implemented in Phase 7.2', async () => {
      // POST decision routes must not exist yet (strictly read-only in Phase 7.2)
      const res = await server.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${testApprovalId}/decide`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { decision: 'APPROVED' }
      });
      expect(res.statusCode).toBe(404);
    });
  });
});

