import { Redis, RedisOptions } from 'ioredis';

export class RedisConnectionManager {
  private static instance: RedisConnectionManager;
  private client: Redis | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): RedisConnectionManager {
    if (!RedisConnectionManager.instance) {
      RedisConnectionManager.instance = new RedisConnectionManager();
    }
    return RedisConnectionManager.instance;
  }

  public getClient(redisUrl = 'redis://127.0.0.1:6379'): Redis {
    if (!this.client) {
      const options: RedisOptions = {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy(times) {
          if (times > 3) {
            return null; // Stop infinite reconnect loops
          }
          return Math.min(times * 100, 1000);
        },
        lazyConnect: true
      };

      this.client = new Redis(redisUrl, options);

      this.client.on('connect', () => {
        this.isConnected = true;
      });

      this.client.on('error', () => {
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    }
    return this.client;
  }

  public async checkHealth(redisUrl?: string): Promise<{ isConnected: boolean; error?: string }> {
    try {
      const client = this.getClient(redisUrl);
      if (client.status === 'wait') {
        await client.connect();
      }
      await client.ping();
      this.isConnected = true;
      return { isConnected: true };
    } catch (err: unknown) {
      this.isConnected = false;
      const msg = err instanceof Error ? err.message : String(err);
      return { isConnected: false, error: `Redis unreachable: ${msg}` };
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
      this.client = null;
      this.isConnected = false;
    }
  }

  public getStatus(): { isConnected: boolean } {
    return { isConnected: this.isConnected };
  }
}

export const redisManager = RedisConnectionManager.getInstance();
