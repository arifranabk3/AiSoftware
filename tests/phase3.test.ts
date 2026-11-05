import { distributedKillSwitch } from '@ai-command-center/security';
import { redisManager, schedulerEngine, safeBrowser } from '@ai-command-center/automation';
import { workerDaemon } from '../apps/worker/src/index.js';
import { CommandQueueName } from '../packages/automation/src/queues.js';
import { describe, it, expect, beforeEach } from 'vitest';

describe('1. Redis Infrastructure & Failure Resilience', () => {
  it('should handle unreachable Redis cleanly without unhandled crash', async () => {
    const health = await redisManager.checkHealth('redis://127.0.0.1:63799'); // Non-existent port
    expect(health.isConnected).toBe(false);
    expect(health.error).toBeDefined();
    await redisManager.close();
  });
});

describe('2. BullMQ Queue Topologies & Job Options', () => {
  it('should expose all 10 specialized command queues', () => {
    const queues = Object.values(CommandQueueName);
    expect(queues.length).toBe(10);
    expect(queues).toContain(CommandQueueName.CEO_TASKS);
    expect(queues).toContain(CommandQueueName.SPECIALIST_TASKS);
    expect(queues).toContain(CommandQueueName.BUSINESS_DISCOVERY);
  });
});

describe('3. Autonomous Scheduler Engine & Duplicate Prevention', () => {
  beforeEach(async () => {
    await distributedKillSwitch.deactivate('Owner');
  });

  it('should register tasks and enforce minute-level duplicate prevention', async () => {
    schedulerEngine.registerTask({
      id: 'task_daily_discovery',
      name: 'Daily Business Discovery',
      cronPattern: '0 9 * * *',
      specialistId: 'spec_discovery_hunter',
      departmentId: 'BUSINESS_DEV',
      action: 'MINE_LEADS',
      payload: { niche: 'b2b-saas' },
      isActive: true
    });

    const timestampMinute = '2026-11-05T09:00';

    // First check should be true
    expect(
      await schedulerEngine.acquireExecutionLease(
        'task_daily_discovery',
        timestampMinute,
        'worker_1'
      )
    ).toBe(true);

    // Execute once
    const execution = schedulerEngine.markExecuted('task_daily_discovery', timestampMinute);
    expect(execution.taskId).toBeDefined();
    expect(execution.idempotencyKey).toBe('task_daily_discovery:2026-11-05T09:00');

    // Duplicate check in the same minute should be false
    expect(
      await schedulerEngine.acquireExecutionLease(
        'task_daily_discovery',
        timestampMinute,
        'worker_2'
      )
    ).toBe(false);

    // Next minute should be eligible again
    expect(
      await schedulerEngine.acquireExecutionLease(
        'task_daily_discovery',
        '2026-11-05T09:01',
        'worker_1'
      )
    ).toBe(true);
  });

  it('scheduler must halt when emergency kill-switch is active', async () => {
    await distributedKillSwitch.activate('Owner', 'Safety freeze');
    await expect(
      schedulerEngine.acquireExecutionLease('task_daily_discovery', '2026-11-05T09:00', 'worker_1')
    ).rejects.toThrow('EMERGENCY HALT ACTIVE');
    await distributedKillSwitch.deactivate('Owner');
  });
});

describe('4. Worker Daemon Lifecycle & Emergency Guard', () => {
  beforeEach(async () => {
    await distributedKillSwitch.deactivate('Owner');
  });

  it('worker daemon should start and stop cleanly', async () => {
    await workerDaemon.start();
    const status = workerDaemon.getStatus();
    expect(status.isRunning).toBe(true);
    expect(status.killSwitchHalted).toBe(false);

    await workerDaemon.stop();
    expect(workerDaemon.getStatus().isRunning).toBe(false);
  });

  it('worker must refuse start if emergency kill-switch is active', async () => {
    await distributedKillSwitch.activate('Owner', 'Emergency freeze');
    await expect(workerDaemon.start()).rejects.toThrow('EMERGENCY HALT ACTIVE');
    await distributedKillSwitch.deactivate('Owner');
  });
});

describe('5. Playwright Safety Policy & Ethical Guardrails', () => {
  it('should block navigation attempts to payment or checkout domains', () => {
    expect(() => safeBrowser.assertSafetyPolicy('https://checkout.stripe.com/pay/123')).toThrow(
      'SAFETY POLICY BLOCKED'
    );
    expect(() =>
      safeBrowser.assertSafetyPolicy('https://example.com/blog/article-1')
    ).not.toThrow();
  });
});
