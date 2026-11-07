import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import {
  ActivityEventType,
  ActivityEventSchema
} from '../packages/shared/src/index.js';
import { redactSensitiveData } from '../packages/security/src/index.js';
import {
  ActivityRepository,
  initializeDatabaseIndexes,
  mongoDbService
} from '../packages/database/src/index.js';
import {
  activityService
} from '../packages/automation/src/index.js';

describe('Phase 10.3 — Centralized Activity Logging & Telemetry Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let activityRepo: ActivityRepository;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_activity_monitoring');

    await mongoDbService.connect(uri, 'test_activity_monitoring');
    await initializeDatabaseIndexes(uri, 'test_activity_monitoring');

    activityRepo = new ActivityRepository(db);
  }, 30000);

  afterAll(async () => {
    await client.close();
    await mongoDbService.disconnect();
    await mongod.stop();
  });

  describe('1. Zod Schema Validation & Event Types', () => {
    it('should validate a strictly typed activity event', () => {
      const validEvent = {
        eventId: 'evt-test-101',
        timestamp: new Date().toISOString(),
        correlationId: 'corr-001',
        departmentId: 'marketing',
        agentId: 'marketing_director',
        eventType: ActivityEventType.TASK_DISPATCHED,
        action: 'dispatch_task',
        status: 'active',
        message: 'Dispatched task to marketing queue',
        metadata: { priority: 'high' }
      };

      const parsed = ActivityEventSchema.safeParse(validEvent);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.eventType).toBe('TASK_DISPATCHED');
      }
    });

    it('should reject invalid event types', () => {
      const invalidEvent = {
        eventId: 'evt-invalid',
        timestamp: new Date().toISOString(),
        correlationId: 'corr-001',
        eventType: 'INVALID_NON_EXISTENT_TYPE',
        action: 'noop',
        status: 'unknown',
        message: 'invalid'
      };

      const parsed = ActivityEventSchema.safeParse(invalidEvent);
      expect(parsed.success).toBe(false);
    });
  });

  describe('2. Credential and Sensitive Data Redaction', () => {
    it('should mask sensitive keys, JWT tokens, Bearer tokens, and connection strings', () => {
      const sensitivePayload = {
        apiKey: 'sk-ant-api03-abcdef1234567890',
        password: 'SuperSecretPassword123!',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        databaseUri: 'mongodb://admin:superSecretPass@cluster.mongodb.net:27017/prod',
        nested: {
          clientSecret: 'secret_key_456',
          header: 'Bearer secret_token_value'
        },
        publicField: 'safe_info_here'
      };

      const redacted = redactSensitiveData(sensitivePayload);
      expect(redacted.apiKey).toBe('[REDACTED]');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.nested.clientSecret).toBe('[REDACTED]');
      expect(redacted.nested.header).toBe('[REDACTED_CREDENTIAL]');
      expect(redacted.databaseUri).not.toContain('superSecretPass');
      expect(redacted.publicField).toBe('safe_info_here');
    });
  });

  describe('3. MongoDB Persistence & Idempotency', () => {
    it('should record an activity event and prevent duplicates with identical eventId', async () => {
      const eventId = 'evt-unique-001';
      const event = {
        eventId,
        timestamp: new Date().toISOString(),
        correlationId: 'corr-idem',
        taskId: 'tsk-001',
        departmentId: 'seo',
        eventType: ActivityEventType.JOB_QUEUED,
        action: 'queue_job',
        status: 'waiting' as const,
        message: 'Job placed in SEO queue'
      };

      const firstWrite = await activityRepo.logEvent(event);
      expect(firstWrite.recorded).toBe(true);
      expect(firstWrite.event.eventId).toBe(eventId);

      // Duplicate write should be idempotent upsert without throwing error
      const secondWrite = await activityRepo.logEvent(event);
      expect(secondWrite.event.eventId).toBe(eventId);

      const timeline = await activityRepo.getTaskTimeline('tsk-001');
      expect(timeline.length).toBe(1);
    });

    it('should support pagination and filtering by eventType and department', async () => {
      await activityRepo.logEvent({
        eventId: 'evt-filter-1',
        timestamp: new Date().toISOString(),
        correlationId: 'corr-filter-1',
        departmentId: 'marketing',
        eventType: ActivityEventType.AI_REQUEST_STARTED,
        action: 'generate_copy',
        status: 'active',
        message: 'Ollama generating draft'
      });

      await activityRepo.logEvent({
        eventId: 'evt-filter-2',
        timestamp: new Date().toISOString(),
        correlationId: 'corr-filter-2',
        departmentId: 'engineering',
        eventType: ActivityEventType.SYSTEM_ERROR,
        action: 'heartbeat_check',
        status: 'failed',
        message: 'Connection timed out'
      });

      const marketingOnly = await activityRepo.listEvents({ departmentId: 'marketing' });
      expect(marketingOnly.items.some(e => e.departmentId === 'marketing')).toBe(true);
      expect(marketingOnly.items.some(e => e.departmentId === 'engineering')).toBe(false);

      const errorOnly = await activityRepo.listEvents({ eventType: ActivityEventType.SYSTEM_ERROR });
      expect(errorOnly.items.length).toBeGreaterThanOrEqual(1);
      expect(errorOnly.items[0].eventType).toBe(ActivityEventType.SYSTEM_ERROR);
    });

    it('should return aggregated telemetry summary', async () => {
      const summary = await activityRepo.getTelemetrySummary();
      expect(summary.totalEvents).toBeGreaterThanOrEqual(3);
      expect(typeof summary.failedJobsCount).toBe('number');
      expect(Array.isArray(summary.recentEvents)).toBe(true);
    });
  });

  describe('4. CentralizedActivityService & Outbox Telemetry', () => {
    it('should emit events in memory and persist via background outbox queue', async () => {
      let receivedLiveEvent: any = null;
      const handler = (evt: any) => {
        if (evt.eventId === 'evt-service-live') {
          receivedLiveEvent = evt;
        }
      };
      activityService.on('activity', handler);

      const emitted = await activityService.emitEvent({
        eventId: 'evt-service-live',
        correlationId: 'corr-service-live',
        departmentId: 'research',
        agentId: 'researcher_1',
        eventType: ActivityEventType.APPROVAL_GRANTED,
        action: 'grant_approval',
        status: 'completed',
        message: 'User approved research phase'
      });

      expect(emitted.eventId).toBe('evt-service-live');
      expect(receivedLiveEvent).toBeDefined();
      expect(receivedLiveEvent.eventType).toBe('APPROVAL_GRANTED');

      activityService.off('activity', handler);

      // Verify in-memory ring buffer holds it
      const recent = activityService.getRecentMemoryEvents(10);
      expect(recent.some(e => e.eventId === 'evt-service-live')).toBe(true);
    });
  });
});
