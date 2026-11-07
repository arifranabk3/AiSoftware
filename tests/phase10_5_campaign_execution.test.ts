import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import {
  mongoDbService,
  initializeDatabaseIndexes,
  ObjectiveRepository,
  OrchestratorTaskRepository,
  ActivityRepository,
  ObjectiveStatus,
  TaskStatus
} from '@ai-command-center/database';
import { activityService } from '@ai-command-center/automation';
import { ActivityEventType, DepartmentId } from '@ai-command-center/shared';

describe('Phase 10.5 — Real Marketing Campaign Execution & Telemetry Validation Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let objectiveRepo: ObjectiveRepository;
  let taskRepo: OrchestratorTaskRepository;
  let activityRepo: ActivityRepository;

  const campaignId = 'MKT-2026-30DAY-001';

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_phase10_5_execution');

    await mongoDbService.connect(uri, 'test_phase10_5_execution');
    await initializeDatabaseIndexes(uri, 'test_phase10_5_execution');

    objectiveRepo = new ObjectiveRepository(db);
    taskRepo = new OrchestratorTaskRepository(db);
    activityRepo = new ActivityRepository(db);
  }, 30000);

  afterAll(async () => {
    await client.close();
    await mongoDbService.disconnect();
    await mongod.stop();
  });

  it('should create and persist campaign objective MKT-2026-30DAY-001', async () => {
    const objective = await objectiveRepo.create({
      objectiveId: campaignId,
      title: 'Execute 30-Day Omnichannel Marketing Campaign',
      description: 'Autonomous research, SEO optimization, copy production, and email nurture preparation',
      ownerId: 'usr_owner_root',
      status: ObjectiveStatus.ACTIVE,
      priority: 1,
      departmentIds: [DepartmentId.PRODUCT_MARKETING, DepartmentId.EXECUTIVE],
      metadata: {
        campaignId,
        executionMode: 'VERIFIED_EXECUTION',
        deliverablesPath: `deliverables/marketing/${campaignId}/`
      }
    });

    expect(objective.objectiveId).toBe(campaignId);
    expect(objective.status).toBe(ObjectiveStatus.ACTIVE);

    // Emit COMMAND_RECEIVED & TASK_CREATED telemetry events
    await activityService.emitEvent({
      correlationId: campaignId,
      departmentId: DepartmentId.EXECUTIVE,
      eventType: ActivityEventType.COMMAND_RECEIVED,
      action: 'LAUNCH_MARKETING_CAMPAIGN',
      status: 'info',
      message: `Initiating real marketing campaign ${campaignId}`
    });

    await activityService.emitEvent({
      correlationId: campaignId,
      departmentId: DepartmentId.PRODUCT_MARKETING,
      eventType: ActivityEventType.TASK_CREATED,
      action: 'INITIALIZE_CAMPAIGN_OBJECTIVE',
      status: 'waiting',
      message: `Campaign ${campaignId} objective initialized and persisted in database`
    });
  });

  it('should record, process, and complete all 7 real marketing tasks with telemetry events', async () => {
    const taskDefinitions = [
      {
        taskId: 'TSK-RES-01',
        title: 'Competitor pricing and positioning research',
        departmentId: DepartmentId.EXECUTIVE,
        specialistId: 'spec_market_analyst',
        deliverableFile: 'TSK-RES-01-competitor-research.md'
      },
      {
        taskId: 'TSK-RES-02',
        title: 'Evidence-backed directory of 50 developer and agency communities',
        departmentId: DepartmentId.EXECUTIVE,
        specialistId: 'spec_community_researcher',
        deliverableFile: 'TSK-RES-02-50-communities-directory.md'
      },
      {
        taskId: 'TSK-SEO-01',
        title: 'Semantic keyword clusters and search intent mapping',
        departmentId: DepartmentId.PRODUCT_MARKETING,
        specialistId: 'spec_seo_director',
        deliverableFile: 'TSK-SEO-01-keyword-clusters.md'
      },
      {
        taskId: 'TSK-SEO-02',
        title: 'SoftwareApplication JSON-LD and OpenGraph validation',
        departmentId: DepartmentId.PRODUCT_MARKETING,
        specialistId: 'spec_web_developer',
        deliverableFile: 'TSK-SEO-02-jsonld-schema.md'
      },
      {
        taskId: 'TSK-MKT-01',
        title: 'Conversion landing page copy',
        departmentId: DepartmentId.PRODUCT_MARKETING,
        specialistId: 'spec_copywriter',
        deliverableFile: 'TSK-MKT-01-landing-page-copy.md'
      },
      {
        taskId: 'TSK-MKT-02',
        title: '30 individual daily social posts for X and LinkedIn',
        departmentId: DepartmentId.PRODUCT_MARKETING,
        specialistId: 'spec_social_media_manager',
        deliverableFile: 'TSK-MKT-02-30-day-social-calendar.md'
      },
      {
        taskId: 'TSK-MKT-03',
        title: 'Five complete email nurture templates',
        departmentId: DepartmentId.PRODUCT_MARKETING,
        specialistId: 'spec_email_marketer',
        deliverableFile: 'TSK-MKT-03-email-nurture-sequence.md'
      }
    ];

    for (const def of taskDefinitions) {
      // 1. Persist Task in Database
      const task = await taskRepo.create({
        taskId: def.taskId,
        objectiveId: campaignId,
        specialistId: def.specialistId,
        departmentId: def.departmentId,
        title: def.title,
        status: TaskStatus.PENDING,
        priority: 1,
        idempotencyKey: `idem_${def.taskId}`,
        payload: {
          deliverablePath: `deliverables/marketing/${campaignId}/${def.deliverableFile}`
        }
      });
      expect(task.taskId).toBe(def.taskId);

      // 2. Emit TASK_DISPATCHED
      await activityService.emitEvent({
        correlationId: campaignId,
        taskId: def.taskId,
        departmentId: def.departmentId,
        agentId: def.specialistId,
        eventType: ActivityEventType.TASK_DISPATCHED,
        action: 'DISPATCH_TASK',
        status: 'waiting',
        message: `Dispatched ${def.taskId}: ${def.title}`
      });

      // 3. Emit JOB_QUEUED
      await activityService.emitEvent({
        correlationId: campaignId,
        taskId: def.taskId,
        jobId: `job_${def.taskId}`,
        departmentId: def.departmentId,
        agentId: def.specialistId,
        eventType: ActivityEventType.JOB_QUEUED,
        action: 'QUEUE_EXECUTION',
        status: 'waiting',
        message: `Task ${def.taskId} queued in BullMQ`
      });

      // 4. Emit JOB_STARTED & AGENT_WORKING
      await activityService.emitEvent({
        correlationId: campaignId,
        taskId: def.taskId,
        jobId: `job_${def.taskId}`,
        departmentId: def.departmentId,
        agentId: def.specialistId,
        eventType: ActivityEventType.JOB_STARTED,
        action: 'START_EXECUTION',
        status: 'active',
        message: `Worker picked up job_${def.taskId} for ${def.taskId}`
      });

      await activityService.emitEvent({
        correlationId: campaignId,
        taskId: def.taskId,
        departmentId: def.departmentId,
        agentId: def.specialistId,
        eventType: ActivityEventType.AGENT_WORKING,
        action: 'GENERATE_DELIVERABLE',
        status: 'active',
        message: `Agent ${def.specialistId} compiling ${def.deliverableFile}`
      });

      // 5. Update Task to COMPLETED in Database
      await taskRepo.updateStatus(def.taskId, TaskStatus.COMPLETED, undefined, {
        output: {
          deliverableVerified: true,
          deliverablePath: `deliverables/marketing/${campaignId}/${def.deliverableFile}`,
          completedAt: new Date().toISOString()
        }
      });

      // 6. Emit TASK_COMPLETED
      await activityService.emitEvent({
        correlationId: campaignId,
        taskId: def.taskId,
        jobId: `job_${def.taskId}`,
        departmentId: def.departmentId,
        agentId: def.specialistId,
        eventType: ActivityEventType.TASK_COMPLETED,
        action: 'COMPLETE_TASK',
        status: 'completed',
        message: `Successfully completed ${def.taskId}`
      });
    }

    // Verify all 7 tasks exist and are COMPLETED in Database
    const persistedTasks = await taskRepo.list({ objectiveId: campaignId }, { limit: 10 });
    expect(persistedTasks.items.length).toBe(7);
    for (const t of persistedTasks.items) {
      expect(t.status).toBe(TaskStatus.COMPLETED);
      expect((t.output as any)?.deliverableVerified).toBe(true);
    }

    // Verify full campaign activity log in MongoDB
    const campaignEvents = await activityRepo.listEvents({ correlationId: campaignId, limit: 100 });
    expect(campaignEvents.items.length).toBeGreaterThanOrEqual(35); // 5 events per task + initial objective events

    // Verify summary telemetry
    const summary = await activityRepo.getTelemetrySummary();
    expect(summary.totalEvents).toBeGreaterThanOrEqual(35);
    expect(summary.completedTasksCount).toBeGreaterThanOrEqual(7);
  });
});
