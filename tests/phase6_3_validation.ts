import dotenv from 'dotenv';
dotenv.config();
import { distributedKillSwitch } from '@ai-command-center/security';
import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';

async function runPhase63Validation() {
  console.log('====================================================');
  console.log('    PHASE 6.3 PRODUCTION INTEGRATION TEST SUITE     ');
  console.log('====================================================');

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('[Error] REDIS_URL not found in environment.');
    process.exit(1);
  }

  const redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
    lazyConnect: true
  });

  try {
    await redisClient.connect();
    console.log('[1. Redis Live Connection] PASS! Connected to live Upstash Redis.');

    // 1. Submit normal job
    const queue = new Queue('ceo_orchestrator_tasks', {
      connection: redisClient.duplicate()
    });

    let normalJobExecuted = false;
    let blockedJobExecuted = false;

    const worker = new Worker(
      'ceo_orchestrator_tasks',
      async (job) => {
        // Enforce kill switch inside job handler
        distributedKillSwitch.assertOperational();
        if (job.name === 'normal_task') {
          normalJobExecuted = true;
          return { status: 'COMPLETED' };
        }
        if (job.name === 'frozen_task') {
          blockedJobExecuted = true;
          return { status: 'SHOULD_NOT_RUN' };
        }
      },
      {
        connection: redisClient.duplicate()
      }
    );

    console.log('[2. BullMQ Job Processing] Submitting normal test task...');
    const job1 = await queue.add(
      'normal_task',
      { action: 'TEST_PIPELINE' },
      { removeOnComplete: true }
    );
    console.log(`[2. BullMQ Job Processing] Normal task queued (ID: ${job1.id}). Awaiting execution...`);

    const startNormal = Date.now();
    while (!normalJobExecuted && Date.now() - startNormal < 10000) {
      await new Promise((r) => setTimeout(r, 400));
    }

    if (!normalJobExecuted) {
      throw new Error('Normal job execution timed out in worker.');
    }
    console.log('[2. BullMQ Job Processing] PASS! Worker processed normal task successfully.');

    // 2. Kill-switch validation
    console.log('[3. Emergency Kill-Switch] Activating distributed emergency kill-switch...');
    await distributedKillSwitch.activate('owner_qa_operator', 'QA Phase 6.3 validation test');
    console.log('[3. Emergency Kill-Switch] Kill-switch status:', distributedKillSwitch.getState());

    console.log('[3. Emergency Kill-Switch] Submitting task during active emergency freeze...');
    const job2 = await queue.add(
      'frozen_task',
      { action: 'FROZEN_OPERATION' },
      { removeOnComplete: true }
    );
    console.log(`[3. Emergency Kill-Switch] Frozen task queued (ID: ${job2.id}). Monitoring worker behavior...`);

    // Wait 3 seconds to ensure worker rejects / does not execute successfully
    await new Promise((r) => setTimeout(r, 3000));

    if (blockedJobExecuted) {
      throw new Error('FAIL: Job was executed despite active emergency kill-switch!');
    }
    console.log('[3. Emergency Kill-Switch] PASS! Worker halted and refused job execution during emergency freeze.');

    // Deactivate kill switch
    await distributedKillSwitch.deactivate('owner_qa_operator');
    console.log('[3. Emergency Kill-Switch] Emergency freeze deactivated. Normal operations restored.');

    // Cleanup
    await worker.close();
    await queue.close();
    await redisClient.quit();

    console.log('====================================================');
    console.log('RESULT: ALL PHASE 6.3 PRODUCTION TESTS PASSED');
    console.log('====================================================');
    process.exit(0);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Error] Test failed: ${msg}`);
    try {
      redisClient.disconnect();
    } catch {}
    process.exit(1);
  }
}

runPhase63Validation();

