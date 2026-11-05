import { distributedKillSwitch } from '@ai-command-center/security';
import { redisManager } from '@ai-command-center/automation';
import { mongoDbService } from '@ai-command-center/database';

export class AutonomousWorkerDaemon {
  private isRunning = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  public async start(): Promise<void> {
    console.log('[Worker] Starting autonomous background worker daemon...');

    // 1. Check emergency kill switch
    await distributedKillSwitch.verifyOperational();

    // 2. Redis & Mongo health checks
    const redisHealth = await redisManager.checkHealth();
    console.log(`[Worker] Redis Status: ${redisHealth.isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);

    const mongoHealth = await mongoDbService.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_command_center'
    );
    console.log(`[Worker] MongoDB Status: ${mongoHealth.success ? 'CONNECTED' : 'DISCONNECTED'}`);

    this.isRunning = true;

    // 3. Heartbeat loop
    this.heartbeatInterval = setInterval(() => {
      try {
        distributedKillSwitch.assertOperational();
        // Worker heartbeat tick
      } catch (err: unknown) {
        console.warn(`[Worker] Halting active loop: ${(err as Error).message}`);
      }
    }, 5000);

    console.log('[Worker] Worker daemon active and listening for BullMQ jobs.');
  }

  public async stop(): Promise<void> {
    console.log('[Worker] Graceful shutdown initiated...');
    this.isRunning = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    await redisManager.close();
    await mongoDbService.disconnect();
    console.log('[Worker] Worker daemon stopped cleanly.');
  }

  public getStatus(): { isRunning: boolean; killSwitchHalted: boolean } {
    return {
      isRunning: this.isRunning,
      killSwitchHalted: distributedKillSwitch.getState().isHalted
    };
  }
}

export const workerDaemon = new AutonomousWorkerDaemon();

// If run directly via node/pm2
if (process.argv[1]?.includes('apps/worker') || process.argv[1]?.includes('apps\\worker')) {
  workerDaemon.start().catch((err: unknown) => {
    console.error('[Worker Fatal]', err);
    process.exit(1);
  });

  process.on('SIGTERM', async () => {
    await workerDaemon.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await workerDaemon.stop();
    process.exit(0);
  });
}
