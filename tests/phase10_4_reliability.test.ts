import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { FastifyInstance } from 'fastify';
import {
  mongoDbService,
  initializeDatabaseIndexes,
  ActivityRepository
} from '@ai-command-center/database';
import { generateAuthTokens } from '@ai-command-center/security';
import { activityService } from '@ai-command-center/automation';
import { ActivityEventType, DepartmentId } from '@ai-command-center/shared';
import { buildServer } from '../apps/api/src/server.js';

describe('Phase 10.4 — Live Monitoring & Event Reliability Validation Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let server: FastifyInstance;
  let activityRepo: ActivityRepository;

  const jwtSecret = 'test_jwt_secret_must_be_32_characters_long_123';
  const refreshSecret = 'test_refresh_secret_must_be_32_characters_long';

  let ownerToken: string;
  let readActivityToken: string;
  let unauthorizedToken: string;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_phase10_4_reliability');

    await mongoDbService.connect(uri, 'test_phase10_4_reliability');
    await initializeDatabaseIndexes(uri, 'test_phase10_4_reliability');

    activityRepo = new ActivityRepository(db);

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

    // 2. User with read:activity permission
    readActivityToken = generateAuthTokens(
      {
        userId: 'usr_auditor_01',
        email: 'auditor@ai-command-center.local',
        isOwner: false,
        role: 'AUDITOR',
        permissions: ['read:activity']
      } as unknown as { userId: string; email: string; isOwner: boolean; role: string },
      jwtSecret,
      refreshSecret
    ).accessToken;

    // 3. User with no permissions
    unauthorizedToken = generateAuthTokens(
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

  describe('1. Full Lifecycle Event Flow Validation', () => {
    it('should emit and record COMMAND_RECEIVED and TASK_CREATED on objective submission', async () => {
      const recordedEvents: any[] = [];
      const handler = (evt: any) => recordedEvents.push(evt);
      activityService.on('activity', handler);

      const res = await server.inject({
        method: 'POST',
        url: '/api/ceo/objectives',
        headers: {
          authorization: `Bearer ${ownerToken}`
        },
        payload: {
          title: 'Q4 Organic Acquisition Strategy',
          description: 'Autonomous research and marketing tasks',
          priority: 2,
          departmentIds: [DepartmentId.EXECUTIVE, DepartmentId.PRODUCT_MARKETING]
        }
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.body);
      const objectiveId = json.data.objectiveId;

      // Allow event dispatch cycle
      await new Promise((r) => setTimeout(r, 50));
      activityService.off('activity', handler);

      const commandEvt = recordedEvents.find((e) => e.eventType === ActivityEventType.COMMAND_RECEIVED);
      expect(commandEvt).toBeDefined();
      expect(commandEvt.correlationId).toBe(objectiveId);

      const taskCreatedEvt = recordedEvents.find((e) => e.eventType === ActivityEventType.TASK_CREATED);
      expect(taskCreatedEvt).toBeDefined();
      expect(taskCreatedEvt.correlationId).toBe(objectiveId);

      // Verify persistent storage in MongoDB
      const dbEvents = await activityRepo.listEvents({ correlationId: objectiveId });
      expect(dbEvents.items.length).toBeGreaterThanOrEqual(2);
    });

    it('should emit and trace AI request completions and failures accurately', async () => {
      const aiSuccessEvent = await activityService.emitEvent({
        correlationId: 'corr-ai-success',
        taskId: 'tsk-ai-01',
        departmentId: DepartmentId.ENGINEERING,
        agentId: 'specialist_deep_research',
        eventType: ActivityEventType.AI_REQUEST_COMPLETED,
        action: 'GENERATE_AI_COMPLETION',
        status: 'completed',
        provider: 'ollama',
        model: 'qwen2.5:7b',
        durationMs: 420,
        message: 'AI completion finished via ollama (qwen2.5:7b) in 420ms'
      });

      expect(aiSuccessEvent.eventType).toBe(ActivityEventType.AI_REQUEST_COMPLETED);
      expect(aiSuccessEvent.provider).toBe('ollama');
      expect(aiSuccessEvent.model).toBe('qwen2.5:7b');

      const aiFailEvent = await activityService.emitEvent({
        correlationId: 'corr-ai-fail',
        taskId: 'tsk-ai-02',
        departmentId: DepartmentId.PRODUCT_MARKETING,
        agentId: 'specialist_seo_auditor',
        eventType: ActivityEventType.AI_REQUEST_FAILED,
        action: 'GENERATE_AI_COMPLETION',
        status: 'failed',
        provider: 'ollama',
        model: 'qwen2.5:7b',
        message: 'Ollama offline',
        errorCode: 'AI_INFERENCE_ERROR'
      });

      expect(aiFailEvent.eventType).toBe(ActivityEventType.AI_REQUEST_FAILED);
      expect(aiFailEvent.errorCode).toBe('AI_INFERENCE_ERROR');
    });
  });

  describe('2. Security & RBAC Enforcement on Activity Endpoints', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/activity'
      });
      expect(res.statusCode).toBe(401);
    });

    it('should reject requests without read:activity permission with 403', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/activity',
        headers: {
          authorization: `Bearer ${unauthorizedToken}`
        }
      });
      expect(res.statusCode).toBe(403);
    });

    it('should allow authorized users to query paginated activity records', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/activity?limit=10',
        headers: {
          authorization: `Bearer ${readActivityToken}`
        }
      });
      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(Array.isArray(json.items)).toBe(true);
      expect(typeof json.total).toBe('number');
    });

    it('should allow authorized users to retrieve real aggregated telemetry summary', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/ceo/activity/summary',
        headers: {
          authorization: `Bearer ${ownerToken}`
        }
      });
      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(typeof json.data.totalEvents).toBe('number');
      expect(typeof json.data.activeJobsCount).toBe('number');
      expect(typeof json.data.failedJobsCount).toBe('number');
    });
  });

  describe('3. Persistence Resiliency & Outbox Retry Queue', () => {
    it('should queue events in pending retry outbox when DB is unavailable and flush on restore', async () => {
      // Artificially disconnect mongoDbService
      await mongoDbService.disconnect();

      expect(mongoDbService.getStatus().isConnected).toBe(false);

      // Emit event while DB is offline
      const offlineEvent = await activityService.emitEvent({
        correlationId: 'corr-offline-1',
        departmentId: DepartmentId.EXECUTIVE,
        eventType: ActivityEventType.SYSTEM_ERROR,
        action: 'HEARTBEAT_CHECK',
        status: 'error',
        message: 'Database connection dropped'
      });

      expect(offlineEvent.eventId).toBeDefined();
      expect(activityService.getPendingRetryCount()).toBeGreaterThanOrEqual(1);

      // Reconnect mongoDbService
      await mongoDbService.connect(mongod.getUri(), 'test_phase10_4_reliability');
      expect(mongoDbService.getStatus().isConnected).toBe(true);

      // Flush retries
      const flushed = await activityService.flushPendingRetries();
      expect(flushed).toBeGreaterThanOrEqual(1);
      expect(activityService.getPendingRetryCount()).toBe(0);

      // Verify the offline event is now successfully persisted in MongoDB
      const stored = await activityRepo.listEvents({ eventId: offlineEvent.eventId });
      expect(stored.items.length).toBe(1);
      expect(stored.items[0].eventId).toBe(offlineEvent.eventId);
    });
  });

  describe('4. SSE Stream Handshake & In-Memory Buffer', () => {
    it('should verify in-memory outbox buffer retrieval for cold-start streaming', async () => {
      const recent = activityService.getRecentMemoryEvents(5);
      expect(Array.isArray(recent)).toBe(true);
      expect(recent.length).toBeGreaterThan(0);
      expect(recent[0].eventId).toBeDefined();
    });
  });
});
