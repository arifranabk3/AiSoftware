export * from './mongodb.js';
export class DatabaseService {
  private static instance: DatabaseService;
  private isConnected: boolean = false;
  private constructor() {}
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  public async connect(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'PostgreSQL disabled. Project migrated to MongoDB.' };
  }
  public getStatus(): { isConnected: boolean } {
    return { isConnected: this.isConnected };
  }
}
export const dbService = DatabaseService.getInstance();
