import { MongoClient, Db } from 'mongodb';

export class MongoDatabaseService {
  private static instance: MongoDatabaseService;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected: boolean = false;

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
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.client) {
        this.client = new MongoClient(uri, {
          serverSelectionTimeoutMS: 2000,
          connectTimeoutMS: 2000
        });
      }
      await this.client.connect();
      this.db = this.client.db(dbName);
      await this.db.command({ ping: 1 });
      this.isConnected = true;
      return { success: true };
    } catch (err: unknown) {
      this.isConnected = false;
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `MongoDB connection failed: ${message}` };
    }
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB database not connected. Call connect() first.');
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

  public getStatus(): { isConnected: boolean } {
    return { isConnected: this.isConnected };
  }
}

export const mongoDbService = MongoDatabaseService.getInstance();
