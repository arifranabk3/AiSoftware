import { Db } from 'mongodb';

export interface WorkerHeartbeatDocument {
  _id: string; // workerId e.g. "worker-node-1"
  hostname: string;
  pid: number;
  status: 'ACTIVE' | 'TERMINATING' | 'STALE';
  lastHeartbeat: Date;
  startedAt: Date;
  activeJobCount: number;
}

export class WorkerRecoveryManager {
  private static instance: WorkerRecoveryManager;
  private activeDb: Db | null = null;
  private workerId: string = `worker_${process.pid}_${Math.random().toString(36).substring(7)}`;

  private constructor() {}

  public static getInstance(): WorkerRecoveryManager {
    if (!WorkerRecoveryManager.instance) {
      WorkerRecoveryManager.instance = new WorkerRecoveryManager();
    }
    return WorkerRecoveryManager.instance;
  }

  public setDb(db: Db): void {
    this.activeDb = db;
  }

  public getWorkerId(): string {
    return this.workerId;
  }

  public async recordHeartbeat(activeJobs = 0): Promise<void> {
    if (!this.activeDb) return;
    const collection = this.activeDb.collection<WorkerHeartbeatDocument>('worker_heartbeats');
    await collection.updateOne(
      { _id: this.workerId },
      {
        $set: {
          lastHeartbeat: new Date(),
          status: 'ACTIVE',
          activeJobCount: activeJobs
        },
        $setOnInsert: {
          hostname: process.env.COMPUTERNAME || 'localhost',
          pid: process.pid,
          startedAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  /**
   * Detects workers whose heartbeat has ceased for more than 30 seconds
   */
  public async detectStaleWorkers(timeoutSeconds = 30): Promise<WorkerHeartbeatDocument[]> {
    if (!this.activeDb) return [];
    const threshold = new Date(Date.now() - timeoutSeconds * 1000);
    const collection = this.activeDb.collection<WorkerHeartbeatDocument>('worker_heartbeats');
    return collection
      .find({
        status: 'ACTIVE',
        lastHeartbeat: { $lt: threshold }
      })
      .toArray();
  }

  public async deregister(): Promise<void> {
    if (!this.activeDb) return;
    const collection = this.activeDb.collection<WorkerHeartbeatDocument>('worker_heartbeats');
    await collection.updateOne(
      { _id: this.workerId },
      { $set: { status: 'TERMINATING', lastHeartbeat: new Date() } }
    );
  }
}

export const workerRecoveryManager = WorkerRecoveryManager.getInstance();
