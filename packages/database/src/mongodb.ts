import { MongoClient, Db, MongoClientOptions } from 'mongodb';

export interface MongoConnectionStatus {
  isConnected: boolean;
  dbName?: string;
  error?: string;
  pingTimeMs?: number;
}

export class MongoDatabaseService {
  private static instance: MongoDatabaseService;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected: boolean = false;
  private currentDbName: string = 'ai_command_center';

  private constructor() {}

  public static getInstance(): MongoDatabaseService {
    if (!MongoDatabaseService.instance) {
      MongoDatabaseService.instance = new MongoDatabaseService();
    }
    return MongoDatabaseService.instance;
  }

  public async connect(
    uri: string,
    dbName = 'ai_command_center'
  ): Promise<{ success: boolean; error?: string; pingTimeMs?: number }> {
    try {
      this.currentDbName = dbName;
      if (!this.client) {
        const options: MongoClientOptions = {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
          maxPoolSize: 10,
          minPoolSize: 1,
          tls:
            uri.startsWith('mongodb+srv://') || uri.includes('tls=true') || uri.includes('ssl=true')
              ? true
              : undefined
        };
        this.client = new MongoClient(uri, options);
      }

      const startTime = Date.now();
      await this.client.connect();
      this.db = this.client.db(dbName);
      await this.db.command({ ping: 1 });
      const pingTimeMs = Date.now() - startTime;

      this.isConnected = true;
      return { success: true, pingTimeMs };
    } catch (err: unknown) {
      this.isConnected = false;
      const message = err instanceof Error ? err.message : String(err);
      // Clean error without exposing credentials
      const sanitizedError = message.replace(/:\/\/.*@/, '://***:***@');
      return { success: false, error: `MongoDB connection failed: ${sanitizedError}` };
    }
  }

  public getDb(): Db {
    if (!this.db || !this.isConnected) {
      throw new Error('CRITICAL: MongoDB database is not connected. Operations fail closed.');
    }
    return this.db;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
    }
  }

  public getStatus(): MongoConnectionStatus {
    return {
      isConnected: this.isConnected,
      dbName: this.isConnected ? this.currentDbName : undefined
    };
  }
}

export const mongoDbService = MongoDatabaseService.getInstance();
