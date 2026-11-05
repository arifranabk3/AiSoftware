import dotenv from 'dotenv';
dotenv.config();
import { Redis } from 'ioredis';
import { Queue, Worker } from 'bullmq';

async function runRedisDiagnostic() {
  console.log('====================================================');
  console.log('         LIVE UPSTASH REDIS INTEGRATION AUDIT       ');
  console.log('====================================================');

  const redisUrl = process.env.REDIS_URL || '';

  if (!redisUrl || redisUrl === 'redis://127.0.0.1:6379' || redisUrl.includes('localhost')) {
    console.log('[1. Status Check] PENDING: REDIS_URL not configured with an external/Upstash instance.');
    console.log('[1. Status Check] Current value points to default local placeholder.');
    console.log('====================================================');
    console.log('RESULT: AWAITING OWNER INPUT FOR UPSTASH REDIS_URL');
    console.log('====================================================');
    process.exit(2);
  }

  const isTls = redisUrl.startsWith('rediss://');
  console.log(`[1. Protocol Check] Protocol: ${isTls ? 'rediss (TLS Enabled)' : 'redis (Standard TCP)'}`);

  const redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
    lazyConnect: true
  });

  try {
    console.log('[2. Connection Test] Connecting to Redis...');
    await redisClient.connect();
    const pingStart = Date.now();
    const pingResponse = await redisClient.ping();
    const pingTime = Date.now() - pingStart;
    console.log(`[2. Connection Test] PASS! PING response: "${pingResponse}" in ${pingTime}ms.`);

    console.log('[3. BullMQ Integration Test] Initializing test queue: system_maintenance...');
    const testQueue = new Queue('system_maintenance', {
      connection: redisClient.duplicate()
    });

    let jobProcessed = false;
    let processedJobId = '';

    const testWorker = new Worker(
      'system_maintenance',
      async (job) => {
        processedJobId = job.id || '';
        jobProcessed = true;
        return { success: true, processedAt: new Date().toISOString() };
      },
      {
        connection: redisClient.duplicate()
      }
    );

    console.log('[4. Queue Test] Adding verification job to queue...');
    const job = await testQueue.add(
      'verify_connection',
      { probe: true, timestamp: Date.now() },
      { removeOnComplete: true, removeOnFail: true }
    );
    console.log(`[4. Queue Test] Job submitted successfully (ID: ${job.id}). Awaiting execution...`);

    // Wait up to 10 seconds for worker processing
    const startWait = Date.now();
    while (!jobProcessed && Date.now() - startWait < 10000) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!jobProcessed) {
      throw new Error('Timeout waiting for BullMQ worker to process verification job.');
    }

    console.log(`[4. Queue Test] PASS! Worker executed job successfully (Job ID: ${processedJobId}).`);

    console.log('[5. Cleanup & Graceful Shutdown] Closing BullMQ worker and queue...');
    await testWorker.close();
    await testQueue.close();
    await redisClient.quit();
    console.log('[5. Cleanup & Graceful Shutdown] PASS! Connections released cleanly.');

    console.log('====================================================');
    console.log('RESULT: ALL REDIS & BULLMQ CHECKS PASSED');
    console.log('====================================================');
    process.exit(0);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Error] Diagnostic failed: ${msg}`);
    try {
      redisClient.disconnect();
    } catch {}
    process.exit(1);
  }
}

runRedisDiagnostic();

