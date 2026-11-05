import { PrismaClient } from '@prisma/client';

export class DatabaseService {
  private static instance: DatabaseService;
  private client: PrismaClient | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getClient(): PrismaClient {
    if (!this.client) {
      this.client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
      });
    }
    return this.client;
  }

  public async connect(): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();
      // Test query to verify database presence
      await client.$queryRaw`SELECT 1`;
      this.isConnected = true;
      return { success: true };
    } catch (err: unknown) {
      this.isConnected = false;
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Database connection failed: ${message}`
      };
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.$disconnect();
      this.isConnected = false;
    }
  }

  public getStatus(): { isConnected: boolean } {
    return { isConnected: this.isConnected };
  }
}

export const dbService = DatabaseService.getInstance();
export const prisma = dbService.getClient();
export * from '@prisma/client';
