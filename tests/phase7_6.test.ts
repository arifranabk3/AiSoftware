import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { mongoDbService, ObjectiveStatus, ApprovalStatus } from '@ai-command-center/database';
import { buildServer } from '../apps/api/src/server.js';
import { ApiClient } from '../apps/web/src/lib/api.js';

describe('Phase 7.6 — Live CEO Dashboard Integration & Contract Verification Suite', () => {
  let app: FastifyInstance;
  let mongoServer: MongoMemoryServer;
  let ownerToken: string;
  let testObjectiveId: string;
  let testApprovalId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoDbService.connect(mongoServer.getUri());
    app = await buildServer();

    // Authenticate as owner to obtain tokens
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'owner@ai-command-center.local',
        password: 'OwnerSecurePass123!'
      }
    });
    expect(loginRes.statusCode).toBe(200);
    const body = JSON.parse(loginRes.body);
    ownerToken = body.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await mongoDbService.disconnect();
    await mongoServer.stop();
  });

  describe('1. Dashboard System Health & Kill-Switch Alignment', () => {
    it('should query /api/v1/system/health and return operational state matching dashboard metrics', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/system/health'
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('database');
      expect(data).toHaveProperty('killSwitch');
      expect(data.database).toBe('CONNECTED');
      expect(data.killSwitch.isHalted).toBe(false);
    });

    it('should query /api/v1/system/security with owner authorization', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/system/security',
        headers: {
          authorization: `Bearer ${ownerToken}`
        }
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.zeroCostEnforced).toBe(true);
      expect(data.killSwitchActive).toBe(false);
    });
  });

  describe('2. CEO Objectives Lifecycle Contract', () => {
    it('should create an objective through the API matching frontend payload', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/ceo/objectives',
        headers: {
          authorization: `Bearer ${ownerToken}`
        },
        payload: {
          title: 'Live Dashboard Test Objective',
          description: 'Testing live CEO dashboard contract alignment',
          priority: 4,
          departmentIds: ['dept_executive', 'dept_marketing']
        }
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.objectiveId).toBeDefined();
      expect(body.data.status).toBe(ObjectiveStatus.DRAFT);
      testObjectiveId = body.data.objectiveId;
    });

    it('should list objectives with pagination and return created objective', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/ceo/objectives?limit=20',
        headers: {
          authorization: `Bearer ${ownerToken}`
        }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      const found = body.data.find((o: { objectiveId: string }) => o.objectiveId === testObjectiveId);
      expect(found).toBeDefined();
      expect(found.title).toBe('Live Dashboard Test Objective');
    });

    it('should retrieve objective details and nested sub-tasks', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/ceo/objectives/${testObjectiveId}`,
        headers: {
          authorization: `Bearer ${ownerToken}`
        }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.objectiveId).toBe(testObjectiveId);
      expect(Array.isArray(body.data.tasks)).toBe(true);
    });

    it('should dispatch execution for objective and return 202 Accepted', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/ceo/objectives/${testObjectiveId}/execute`,
        headers: {
          authorization: `Bearer ${ownerToken}`
        },
        payload: {
          idempotencyKey: 'dash_exec_key_001',
          executionNotes: 'Triggered from automated dashboard test'
        }
      });

      expect(res.statusCode).toBe(202);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.objectiveId).toBe(testObjectiveId);
      expect(body.initialTask).toBeDefined();
    });
  });

  describe('3. Human Owner Approval Center Lifecycle Contract', () => {
    it('should list approvals and verify filter criteria', async () => {
      // First insert an approval request directly via repo
      const db = mongoDbService.getDb();
      await db.collection('approval_requests').insertOne({
        approvalId: 'appr_dash_test_001',
        taskId: 'tsk_dash_sample_001',
        objectiveId: testObjectiveId,
        specialistId: 'spec_executive_01',
        action: 'EXTERNAL_CONTRACT_SIGN',
        riskLevel: 'CRITICAL',
        status: ApprovalStatus.PENDING,
        reason: 'Action requires Owner verification ($0.00 zero-cost guard)',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      testApprovalId = 'appr_dash_test_001';

      const res = await app.inject({
        method: 'GET',
        url: '/api/ceo/approvals?status=PENDING',
        headers: {
          authorization: `Bearer ${ownerToken}`
        }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      const found = body.data.find((a: { approvalId: string }) => a.approvalId === testApprovalId);
      expect(found).toBeDefined();
      expect(found.riskLevel).toBe('CRITICAL');
    });

    it('should reject unauthenticated or non-owner decision attempts', async () => {
      const unauthRes = await app.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${testApprovalId}/approve`,
        payload: { reason: 'Unauthorized attempt' }
      });
      expect(unauthRes.statusCode).toBe(401);
    });

    it('should reject rejection decision without required audit reason (min 3 chars)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${testApprovalId}/reject`,
        headers: {
          authorization: `Bearer ${ownerToken}`
        },
        payload: { reason: 'no' } // less than 3 chars
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toBe('VALIDATION_ERROR');
    });

    it('should reject approval if associated task does not exist', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${testApprovalId}/approve`,
        headers: {
          authorization: `Bearer ${ownerToken}`
        },
        payload: { reason: 'Audited and approved by owner' }
      });
      // Associated task tsk_dash_sample_001 does not exist in db
      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.body);
      expect(body.error).toBe('TASK_NOT_FOUND');
    });

    it('should successfully record rejection with required reason', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${testApprovalId}/reject`,
        headers: {
          authorization: `Bearer ${ownerToken}`
        },
        payload: { reason: 'Rejected during live dashboard safety inspection' }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe(ApprovalStatus.REJECTED);
      expect(body.data.decisionReason).toBe('Rejected during live dashboard safety inspection');
    });
  });

  describe('4. Frontend API Client Method Signatures & Fallbacks', () => {
    it('ApiClient static methods should exist and be functions', () => {
      expect(typeof ApiClient.getHealth).toBe('function');
      expect(typeof ApiClient.getSecurity).toBe('function');
      expect(typeof ApiClient.listObjectives).toBe('function');
      expect(typeof ApiClient.getObjective).toBe('function');
      expect(typeof ApiClient.createObjective).toBe('function');
      expect(typeof ApiClient.executeObjective).toBe('function');
      expect(typeof ApiClient.listApprovals).toBe('function');
      expect(typeof ApiClient.approveRequest).toBe('function');
      expect(typeof ApiClient.rejectRequest).toBe('function');
      expect(typeof ApiClient.activateKillSwitch).toBe('function');
      expect(typeof ApiClient.deactivateKillSwitch).toBe('function');
    });
  });
});
