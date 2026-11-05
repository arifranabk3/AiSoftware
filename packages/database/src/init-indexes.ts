import { mongoDbService } from './mongodb.js';

export interface IndexInitResult {
  collection: string;
  indexesCreated: string[];
}

export async function initializeDatabaseIndexes(
  mongoUri?: string,
  dbName?: string
): Promise<IndexInitResult[]> {
  const uri = mongoUri || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required to initialize indexes.');
  }

  const connectResult = await mongoDbService.connect(
    uri,
    dbName || process.env.MONGODB_DB_NAME || 'ai_command_center'
  );
  if (!connectResult.success) {
    throw new Error(`Database connection failed: ${connectResult.error}`);
  }

  const db = mongoDbService.getDb();
  const results: IndexInitResult[] = [];

  // 1. system_controls collection (for Kill Switch persistence)
  const systemControls = db.collection('system_controls');
  const scIdx = await systemControls.createIndex({ _id: 1 });
  results.push({ collection: 'system_controls', indexesCreated: [scIdx] });

  // 2. scheduler_locks collection (atomic execution leases with TTL expiry)
  const schedulerLocks = db.collection('scheduler_locks');
  const slIdx1 = await schedulerLocks.createIndex({ _id: 1 });
  const slIdx2 = await schedulerLocks.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Native Mongo TTL
  results.push({ collection: 'scheduler_locks', indexesCreated: [slIdx1, slIdx2] });

  // 3. worker_heartbeats collection (tracks background worker liveness)
  const workerHeartbeats = db.collection('worker_heartbeats');
  const whIdx1 = await workerHeartbeats.createIndex({ workerId: 1 }, { unique: true });
  const whIdx2 = await workerHeartbeats.createIndex(
    { lastHeartbeatAt: 1 },
    { expireAfterSeconds: 300 }
  ); // auto-expire stale workers after 5m
  results.push({ collection: 'worker_heartbeats', indexesCreated: [whIdx1, whIdx2] });

  // 4. audit_logs collection (immutable SHA-256 audit chain)
  const auditLogs = db.collection('audit_logs');
  const alIdx1 = await auditLogs.createIndex({ entryId: 1 }, { unique: true });
  const alIdx2 = await auditLogs.createIndex({ timestamp: -1 });
  const alIdx3 = await auditLogs.createIndex({ currentHash: 1 }, { unique: true });
  results.push({ collection: 'audit_logs', indexesCreated: [alIdx1, alIdx2, alIdx3] });

  // 5. departments collection
  const departments = db.collection('departments');
  const dIdx = await departments.createIndex({ id: 1 }, { unique: true });
  results.push({ collection: 'departments', indexesCreated: [dIdx] });

  // 6. specialists collection
  const specialists = db.collection('specialists');
  const spIdx1 = await specialists.createIndex({ id: 1 }, { unique: true });
  const spIdx2 = await specialists.createIndex({ roleNumber: 1 });
  results.push({ collection: 'specialists', indexesCreated: [spIdx1, spIdx2] });

  return results;
}
