import { Db } from 'mongodb';

export interface PersistentKillSwitchDocument {
  _id: string; // 'GLOBAL_KILL_SWITCH'
  isHalted: boolean;
  version: number;
  haltedAt?: string;
  haltedBy?: string;
  reason?: string;
  updatedAt: string;
}

export interface KillSwitchCheckResult {
  isHalted: boolean;
  version: number;
  haltedAt?: string;
  haltedBy?: string;
  reason?: string;
}

export class DistributedKillSwitchService {
  private static instance: DistributedKillSwitchService;
  private cachedState: KillSwitchCheckResult = { isHalted: false, version: 1 };
  private activeDb: Db | null = null;

  private constructor() {}

  public static getInstance(): DistributedKillSwitchService {
    if (!DistributedKillSwitchService.instance) {
      DistributedKillSwitchService.instance = new DistributedKillSwitchService();
    }
    return DistributedKillSwitchService.instance;
  }

  public setDb(db: Db): void {
    this.activeDb = db;
  }

  public getState(): KillSwitchCheckResult {
    return { ...this.cachedState };
  }

  /**
   * Fetches latest persistent state from MongoDB with fail-closed behavior.
   * If DB is unreachable and no cache exists, it defaults to safety halt.
   */
  public async getLatestState(): Promise<KillSwitchCheckResult> {
    if (!this.activeDb) {
      return this.cachedState;
    }

    try {
      const collection = this.activeDb.collection<PersistentKillSwitchDocument>('system_controls');
      const doc = await collection.findOne({ _id: 'GLOBAL_KILL_SWITCH' });

      if (!doc) {
        // Initialize default operational state
        const initial: PersistentKillSwitchDocument = {
          _id: 'GLOBAL_KILL_SWITCH',
          isHalted: false,
          version: 1,
          updatedAt: new Date().toISOString()
        };
        await collection.insertOne(initial);
        this.cachedState = { isHalted: false, version: 1 };
        return this.cachedState;
      }

      this.cachedState = {
        isHalted: doc.isHalted,
        version: doc.version,
        haltedAt: doc.haltedAt,
        haltedBy: doc.haltedBy,
        reason: doc.reason
      };
      return this.cachedState;
    } catch {
      // Fail-closed safety: if state check fails, freeze operations
      return {
        isHalted: true,
        version: this.cachedState.version,
        reason: 'FAIL_CLOSED: Database unreachable during security state check'
      };
    }
  }

  /**
   * Atomically updates kill-switch state in MongoDB with incremented version number
   */
  public async activate(haltedBy: string, reason: string): Promise<KillSwitchCheckResult> {
    const timestamp = new Date().toISOString();
    if (this.activeDb) {
      const collection = this.activeDb.collection<PersistentKillSwitchDocument>('system_controls');
      const result = await collection.findOneAndUpdate(
        { _id: 'GLOBAL_KILL_SWITCH' },
        {
          $set: {
            isHalted: true,
            haltedBy,
            haltedAt: timestamp,
            reason,
            updatedAt: timestamp
          },
          $inc: { version: 1 }
        },
        { upsert: true, returnDocument: 'after' }
      );

      if (result) {
        this.cachedState = {
          isHalted: result.isHalted,
          version: result.version,
          haltedAt: result.haltedAt,
          haltedBy: result.haltedBy,
          reason: result.reason
        };
        return this.cachedState;
      }
    }

    this.cachedState = {
      isHalted: true,
      version: this.cachedState.version + 1,
      haltedAt: timestamp,
      haltedBy,
      reason
    };
    return this.cachedState;
  }

  /**
   * Atomically deactivates kill switch, requiring owner authorization
   */
  public async deactivate(ownerId: string): Promise<KillSwitchCheckResult> {
    const timestamp = new Date().toISOString();
    if (this.activeDb) {
      const collection = this.activeDb.collection<PersistentKillSwitchDocument>('system_controls');
      const result = await collection.findOneAndUpdate(
        { _id: 'GLOBAL_KILL_SWITCH' },
        {
          $set: {
            isHalted: false,
            updatedAt: timestamp
          },
          $unset: {
            haltedAt: '',
            haltedBy: '',
            reason: ''
          },
          $inc: { version: 1 }
        },
        { returnDocument: 'after' }
      );

      if (result) {
        this.cachedState = {
          isHalted: false,
          version: result.version
        };
        return this.cachedState;
      }
    }

    this.cachedState = {
      isHalted: false,
      version: this.cachedState.version + 1
    };
    return this.cachedState;
  }

  /**
   * Sync assertion for in-loop high frequency checks
   */
  public assertOperational(): void {
    if (this.cachedState.isHalted) {
      throw new Error(
        `EMERGENCY HALT ACTIVE (v${this.cachedState.version}): Operations halted by ${this.cachedState.haltedBy ?? 'System'} (Reason: ${this.cachedState.reason ?? 'Emergency freeze'})`
      );
    }
  }

  /**
   * Async assertion that verifies database state before executing sensitive tasks
   */
  public async verifyOperational(): Promise<void> {
    const latest = await this.getLatestState();
    if (latest.isHalted) {
      throw new Error(
        `EMERGENCY HALT ACTIVE (v${latest.version}): Operations halted by ${latest.haltedBy ?? 'System'} (Reason: ${latest.reason ?? 'Emergency freeze'})`
      );
    }
  }
}

export const distributedKillSwitch = DistributedKillSwitchService.getInstance();
export const killSwitch = distributedKillSwitch; // Backward compatible export
