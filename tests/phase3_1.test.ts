import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { distributedKillSwitch } from '../packages/security/src/kill-switch.js';
import { distributedScheduler } from '../packages/automation/src/scheduler.js';
import { workerRecoveryManager } from '../packages/automation/src/recovery.js';

describe('Phase 3.1: Real Distributed Infrastructure Integration Tests (MongoDB)', () => {
  let mongoServer: MongoMemoryServer;
  let client1: MongoClient;
  let client2: MongoClient;
  let dbNodeA: Db;
  let dbNodeB: Db;

  beforeAll(async () => {
    // Spin up real embedded MongoDB engine for distributed testing
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    client1 = new MongoClient(uri);
    await client1.connect();
    dbNodeA = client1.db('distributed_test_db');

    client2 = new MongoClient(uri);
    await client2.connect();
    dbNodeB = client2.db('distributed_test_db');
  }, 30000);

  afterAll(async () => {
    if (client1) await client1.close();
    if (client2) await client2.close();
    if (mongoServer) await mongoServer.stop();
  });

  describe('1. Two-Process Persistent Kill-Switch Test', () => {
    it('activating kill-switch in Process A must propagate through MongoDB and freeze Process B', async () => {
      // Node A sets DB connection
      distributedKillSwitch.setDb(dbNodeA);

      // Verify initially operational
      const stateInitial = await distributedKillSwitch.getLatestState();
      expect(stateInitial.isHalted).toBe(false);

      // Node A triggers emergency halt
      await distributedKillSwitch.activate('Owner_Node_A', 'Critical Security Alarm');

      // Now Node B reads state directly from its own connection
      distributedKillSwitch.setDb(dbNodeB);
      const stateNodeB = await distributedKillSwitch.getLatestState();

      expect(stateNodeB.isHalted).toBe(true);
      expect(stateNodeB.haltedBy).toBe('Owner_Node_A');
      expect(stateNodeB.reason).toBe('Critical Security Alarm');
      expect(stateNodeB.version).toBeGreaterThanOrEqual(2);

      // Process B must throw and refuse execution
      await expect(distributedKillSwitch.verifyOperational()).rejects.toThrow(
        'EMERGENCY HALT ACTIVE'
      );

      // Node B deactivates with owner auth
      await distributedKillSwitch.deactivate('Owner_Node_B');

      // Node A verifies unhalted
      distributedKillSwitch.setDb(dbNodeA);
      const stateResumed = await distributedKillSwitch.getLatestState();
      expect(stateResumed.isHalted).toBe(false);
    });
  });

  describe('2. Two-Process Distributed Scheduler Race Condition Test', () => {
    it('when two separate worker nodes attempt to lock the exact same scheduled minute, exactly ONE must succeed', async () => {
      distributedScheduler.registerTask({
        id: 'recurring_seo_audit',
        name: 'Recurring SEO Audit',
        cronPattern: '0 12 * * *',
        specialistId: 'spec_seo_specialist',
        departmentId: 'PRODUCT_MARKETING',
        action: 'RUN_SEO_AUDIT',
        payload: { site: 'main' },
        isActive: true
      });

      const currentMinute = '2026-11-05T12:00';

      // Worker Node A binds DB
      distributedScheduler.setDb(dbNodeA);
      const leaseA = await distributedScheduler.acquireExecutionLease(
        'recurring_seo_audit',
        currentMinute,
        'node_worker_A'
      );

      // Worker Node B binds DB and attempts simultaneous lock
      distributedScheduler.setDb(dbNodeB);
      const leaseB = await distributedScheduler.acquireExecutionLease(
        'recurring_seo_audit',
        currentMinute,
        'node_worker_B'
      );

      // Concurrency Assertion: One must be true, other must be false
      expect(leaseA).toBe(true);
      expect(leaseB).toBe(false);

      // Different minute should allow acquisition again
      const leaseNextMinute = await distributedScheduler.acquireExecutionLease(
        'recurring_seo_audit',
        '2026-11-05T12:01',
        'node_worker_B'
      );
      expect(leaseNextMinute).toBe(true);
    });
  });

  describe('3. Worker Heartbeat Persistence & Stale Worker Detection', () => {
    it('should persist heartbeat and detect stale worker nodes', async () => {
      workerRecoveryManager.setDb(dbNodeA);

      await workerRecoveryManager.recordHeartbeat(2);

      // Manually set an outdated heartbeat in DB to simulate unexpected worker crash
      const collection = dbNodeA.collection('worker_heartbeats');
      await collection.updateOne(
        { _id: workerRecoveryManager.getWorkerId() },
        { $set: { lastHeartbeat: new Date(Date.now() - 60000) } } // 60s ago
      );

      // Detect stale workers
      const staleWorkers = await workerRecoveryManager.detectStaleWorkers(30);
      expect(staleWorkers.length).toBeGreaterThanOrEqual(1);
      expect(staleWorkers[0]._id).toBe(workerRecoveryManager.getWorkerId());

      // Deregister cleanly
      await workerRecoveryManager.deregister();
    });
  });
});
