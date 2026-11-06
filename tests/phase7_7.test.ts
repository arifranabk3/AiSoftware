import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  mongoDbService,
  ObjectiveRepository,
  OrchestratorTaskRepository,
  ApprovalRepository,
  ObjectiveStatus,
  TaskStatus,
  ApprovalStatus
} from '@ai-command-center/database';
import { distributedKillSwitch } from '@ai-command-center/security';
import { taskDispatcherService, workerRecoveryManager, BaseTaskPayload } from '@ai-command-center/automation';
import { ceoQueueProcessor } from '../apps/worker/src/ceo-processor.js';
import { buildServer } from '../apps/api/src/server.js';
import { OllamaLocalProvider, MockAIProvider, ceoOrchestrator } from '@ai-command-center/ai-engine';
import { DepartmentId } from '@ai-command-center/shared';
import type { Job } from 'bullmq';

describe('Phase 7.7 — Comprehensive End-to-End System Verification Suite', () => {
  let app: FastifyInstance;
  let mongoServer: MongoMemoryServer;
  let ownerToken: string;
  let objectiveRepo: ObjectiveRepository;
  let taskRepo: OrchestratorTaskRepository;
  let approvalRepo: ApprovalRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoDbService.connect(mongoServer.getUri());
    const db = mongoDbService.getDb();
    objectiveRepo = new ObjectiveRepository(db);
    taskRepo = new OrchestratorTaskRepository(db);
    approvalRepo = new ApprovalRepository(db);
    workerRecoveryManager.setDb(db);

    app = await buildServer();

    // Authenticate as owner
    const ownerLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'owner@ai-command-center.local',
        password: 'OwnerSecurePass123!'
      }
    });
    expect(ownerLoginRes.statusCode).toBe(200);
    ownerToken = JSON.parse(ownerLoginRes.body).accessToken;

    // Ensure kill-switch is reset to operational
    if (distributedKillSwitch.getState().isHalted) {
      await distributedKillSwitch.deactivate('system_test_reset');
    }
  });

  afterAll(async () => {
    if (distributedKillSwitch.getState().isHalted) {
      await distributedKillSwitch.deactivate('system_test_teardown');
    }
    await app.close();
    await mongoDbService.disconnect();
    await mongoServer.stop();
  });

  describe('Workflow A: Owner Login → Objective → Queue → Worker → Real Ollama → Completion', () => {
    it('should complete the entire pipeline using real local Ollama inference', async () => {
      // 1. Create Objective via Fastify API
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/ceo/objectives',
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          title: 'Autonomous Local Ollama Market Intelligence',
          description: 'Analyze local software performance trends using llama3.2:1b',
          priority: 5,
          departmentIds: [DepartmentId.EXECUTIVE, DepartmentId.OPERATIONS]
        }
      });
      expect(createRes.statusCode).toBe(201);
      const objectiveId = JSON.parse(createRes.body).data.objectiveId;

      // 2. Dispatch Execution
      const execRes = await app.inject({
        method: 'POST',
        url: `/api/ceo/objectives/${objectiveId}/execute`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          idempotencyKey: `e2e_ollama_${Date.now()}`,
          executionNotes: 'Full E2E Ollama verification run'
        }
      });
      expect(execRes.statusCode).toBe(202);
      const initialTaskId = JSON.parse(execRes.body).initialTask.taskId;

      // 3. Worker Execution with Real Ollama Provider
      const ollama = new OllamaLocalProvider({
        baseUrl: 'http://127.0.0.1:11434',
        model: 'llama3.2:1b',
        timeoutMs: 45000
      });
      ollama.enable();
      const health = await ollama.checkHealth();
      expect(health.isHealthy).toBe(true);
      expect(health.mode).toBe('REAL');

      // Wire real provider to CEO orchestrator
      ceoOrchestrator.setProvider(ollama);

      // Process job using worker processor with real Ollama provider
      const fakeJob = {
        data: {
          taskId: initialTaskId,
          objectiveId,
          specialistId: 'spec_ceo_orchestrator',
          departmentId: DepartmentId.EXECUTIVE,
          action: 'EXECUTE_OBJECTIVE',
          idempotencyKey: `e2e_ollama_${Date.now()}`,
          priority: 5,
          data: {
            objectiveId,
            title: 'Autonomous Local Ollama Market Intelligence',
            description: 'Analyze local software performance trends',
            requiresOwnerApproval: false
          },
          createdAt: new Date().toISOString()
        }
      } as unknown as Job<BaseTaskPayload>;

      const processResult = await ceoQueueProcessor.processJob(fakeJob);

      expect(processResult.status).toBe('COMPLETED');
      expect(processResult.taskId).toBe(initialTaskId);

      // 4. Verify Database Persistence
      const persistedTask = await taskRepo.findById(initialTaskId);
      expect(persistedTask).toBeDefined();
      expect(persistedTask?.status).toBe(TaskStatus.COMPLETED);
      expect(persistedTask?.output).toBeDefined();
      expect((persistedTask?.output as { _aiExecution?: { mode: string } })?._aiExecution?.mode).toBe('REAL');

      const persistedObjective = await objectiveRepo.findById(objectiveId);
      expect(persistedObjective?.status).toBe(ObjectiveStatus.COMPLETED);

      // Reset to Mock provider for remaining tests to avoid affecting downstream unit tests
      ceoOrchestrator.setProvider(new MockAIProvider());
      const queryRes = await app.inject({
        method: 'GET',
        url: `/api/ceo/objectives/${objectiveId}`,
        headers: { authorization: `Bearer ${ownerToken}` }
      });
      expect(queryRes.statusCode).toBe(200);
      const queryBody = JSON.parse(queryRes.body);
      expect(queryBody.data.status).toBe(ObjectiveStatus.COMPLETED);
      expect(queryBody.data.tasks[0].status).toBe(TaskStatus.COMPLETED);
    }, 45000); // Allow Ollama up to 45s for local token generation
  });

  describe('Workflow B & C: High-Risk Objective → WAITING_APPROVAL → Approve / Reject', () => {
    it('Workflow B: should pause high-risk task, create approval request, and resume safely on approval', async () => {
      // Set to Mock provider for fast determinism in approval workflow
      ceoOrchestrator.setProvider(new MockAIProvider());
      
      // 1. Create & Execute High Risk Objective
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/ceo/objectives',
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          title: 'High-Risk Production Infrastructure Reconfiguration',
          description: 'Reconfigure core production database endpoints',
          priority: 5,
          departmentIds: [DepartmentId.ENGINEERING]
        }
      });
      const objectiveId = JSON.parse(createRes.body).data.objectiveId;

      const execRes = await app.inject({
        method: 'POST',
        url: `/api/ceo/objectives/${objectiveId}/execute`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          idempotencyKey: `e2e_approval_${Date.now()}`
        }
      });
      const taskId = JSON.parse(execRes.body).initialTask.taskId;

      // 2. Worker processes and pauses at WAITING_APPROVAL
      const fakeJob = {
        data: {
          taskId,
          objectiveId,
          specialistId: 'spec_engineering_lead',
          departmentId: DepartmentId.ENGINEERING,
          action: 'INFRASTRUCTURE_RECONFIG',
          idempotencyKey: `e2e_appr_job_${Date.now()}`,
          priority: 5,
          data: {
            objectiveId,
            requiresOwnerApproval: true,
            riskLevel: 'CRITICAL',
            reason: 'Modifies production clusters'
          },
          createdAt: new Date().toISOString()
        }
      } as unknown as Job<BaseTaskPayload>;

      const processResult = await ceoQueueProcessor.processJob(fakeJob);

      expect(processResult.status).toBe('WAITING_APPROVAL');

      // Check task status in database
      const pausedTask = await taskRepo.findById(taskId);
      expect(pausedTask?.status).toBe(TaskStatus.WAITING_APPROVAL);

      // Verify approval request created in db
      const approvalResult = await approvalRepo.list({ taskId });
      expect(approvalResult.items.length).toBe(1);
      const approval = approvalResult.items[0];
      expect(approval.status).toBe(ApprovalStatus.PENDING);
      expect(approval.riskLevel).toBe('HIGH');

      // 3. Owner Approves Request via API
      const approveRes = await app.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${approval.approvalId}/approve`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          reason: 'Owner verified zero-cost infrastructure impact and authorized execution'
        }
      });
      expect(approveRes.statusCode).toBe(200);

      // 4. Verify Worker Resumes Original Task with same taskId
      const resumeJob = {
        data: {
          taskId,
          objectiveId,
          specialistId: 'spec_engineering_lead',
          departmentId: DepartmentId.ENGINEERING,
          action: 'INFRASTRUCTURE_RECONFIG',
          idempotencyKey: `e2e_resumed_${Date.now()}`,
          priority: 5,
          data: {
            objectiveId,
            isResumedExecution: true,
            requiresOwnerApproval: false
          },
          createdAt: new Date().toISOString()
        }
      } as unknown as Job<BaseTaskPayload>;

      // Ensure mock or active provider is set for subsequent test tasks
      const resumedJobResult = await ceoQueueProcessor.processJob(resumeJob);

      expect(resumedJobResult.status).toBe('COMPLETED');
      const completedTask = await taskRepo.findById(taskId);
      expect(completedTask?.status).toBe(TaskStatus.COMPLETED);
    });

    it('Workflow C: should permanently halt task when Owner rejects the request', async () => {
      // Create high-risk task
      const taskId = `tsk_reject_${Date.now()}`;
      const objId = `obj_reject_${Date.now()}`;
      await taskRepo.create({
        taskId,
        objectiveId: objId,
        departmentId: DepartmentId.SECURITY,
        specialistId: 'spec_counsel',
        action: 'EXECUTE_LEGAL_DISCLOSURE',
        priority: 4,
        status: TaskStatus.WAITING_APPROVAL
      });

      const approvalId = `appr_rej_${Date.now()}`;
      await approvalRepo.create({
        approvalId,
        taskId,
        objectiveId: objId,
        specialistId: 'spec_counsel',
        action: 'EXECUTE_LEGAL_DISCLOSURE',
        riskLevel: 'HIGH',
        status: ApprovalStatus.PENDING,
        reason: 'Requires legal clearance'
      });

      // Owner Rejects
      const rejectRes = await app.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${approvalId}/reject`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: {
          reason: 'Rejected: Non-compliant with zero-cost protocol'
        }
      });
      expect(rejectRes.statusCode).toBe(200);

      const updatedApproval = await approvalRepo.findById(approvalId);
      expect(updatedApproval?.status).toBe(ApprovalStatus.REJECTED);

      const rejectedTask = await taskRepo.findById(taskId);
      expect(rejectedTask?.status).toBe(TaskStatus.CANCELLED);

      // Subsequent attempt to approve rejected task must be rejected with 409 Conflict
      const reApproveRes = await app.inject({
        method: 'POST',
        url: `/api/ceo/approvals/${approvalId}/approve`,
        headers: { authorization: `Bearer ${ownerToken}` },
        payload: { reason: 'Accidental override attempt' }
      });
      expect(reApproveRes.statusCode).toBe(409);
    });
  });

  describe('Workflow D: Emergency Kill-Switch Activation & Recovery', () => {
    it('should immediately freeze processor execution when kill-switch is active, and recover cleanly upon deactivation', async () => {
      ceoOrchestrator.setProvider(new MockAIProvider());
      const taskId = `tsk_ks_${Date.now()}`;
      const objId = `obj_ks_${Date.now()}`;
      await taskRepo.create({
        taskId,
        objectiveId: objId,
        departmentId: DepartmentId.EXECUTIVE,
        specialistId: 'spec_ceo_orchestrator',
        action: 'EXECUTE_OBJECTIVE',
        priority: 3,
        status: TaskStatus.QUEUED
      });

      // 1. Activate kill switch
      await distributedKillSwitch.activate('usr_owner_root', 'Drill Emergency Freeze');
      expect(distributedKillSwitch.getState().isHalted).toBe(true);

      const fakeJob = {
        data: {
          taskId,
          objectiveId: objId,
          specialistId: 'spec_ceo_orchestrator',
          departmentId: DepartmentId.EXECUTIVE,
          action: 'EXECUTE_OBJECTIVE',
          idempotencyKey: 'idemp_halt_001',
          priority: 3,
          data: { objectiveId: objId },
          createdAt: new Date().toISOString()
        }
      } as unknown as Job<BaseTaskPayload>;

      // 2. Verify worker processor refuses execution
      await expect(ceoQueueProcessor.processJob(fakeJob)).rejects.toThrow(/EMERGENCY HALT ACTIVE/);

      // 3. Deactivate kill switch
      await distributedKillSwitch.deactivate('usr_owner_root');
      expect(distributedKillSwitch.getState().isHalted).toBe(false);

      // 4. Verify processor resumes normally
      const res = await ceoQueueProcessor.processJob(fakeJob);
      expect(res.status).toBe('COMPLETED');
    });
  });

  describe('Workflow E & F: Outbox Integrity, Heartbeats & Worker Monitoring', () => {
    it('should record worker heartbeat and detect stale workers accurately', async () => {
      // 1. Record active heartbeat
      await workerRecoveryManager.recordHeartbeat(2);

      // 2. Query worker heartbeats from MongoDB directly
      const db = mongoDbService.getDb();
      const hb = await db.collection('worker_heartbeats').findOne({ _id: workerRecoveryManager.getWorkerId() });
      expect(hb).toBeDefined();
      expect(hb?.status).toBe('ACTIVE');
      expect(hb?.activeJobCount).toBe(2);

      // 3. Test detection logic with 0 second timeout (all existing become stale)
      const staleWorkers = await workerRecoveryManager.detectStaleWorkers(0);
      expect(staleWorkers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Workflow G: RBAC Boundary & Unauthorized Restrictions', () => {
    it('should deny unauthenticated requests to protected CEO endpoints', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/ceo/approvals/appr_sample/approve',
        payload: { reason: 'Unauthorized access' }
      });
      expect(res.statusCode).toBe(401);

      const ksRes = await app.inject({
        method: 'POST',
        url: '/api/v1/system/kill-switch/activate',
        payload: { reason: 'Malicious shutdown' }
      });
      expect(ksRes.statusCode).toBe(401);
    });
  });

  describe('Workflow H: Provider Unavailable Honest Failure (No Fabricated AI Output)', () => {
    it('should return an honest failure state when an AI provider endpoint is unreachable and not fabricate success', async () => {
      const offlineOllama = new OllamaLocalProvider({
        baseUrl: 'http://127.0.0.1:9999',
        model: 'nonexistent-model',
        timeoutMs: 1000
      });
      const health = await offlineOllama.checkHealth();
      expect(health.isHealthy).toBe(false);

      await expect(
        offlineOllama.generateText({
          userPrompt: 'Generate market intelligence analysis'
        })
      ).rejects.toThrow();
    });
  });
});
