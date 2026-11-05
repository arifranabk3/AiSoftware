export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface SystemHealthResponse {
  status: 'HEALTHY' | 'HALTED';
  database: 'CONNECTED' | 'DISCONNECTED';
  killSwitch: {
    isHalted: boolean;
    version: number;
    haltedBy?: string;
    reason?: string;
  };
  timestamp: string;
}

export interface SecurityOverviewResponse {
  zeroCostEnforced: boolean;
  auditChainLength: number;
  latestAuditHash: string;
  killSwitchActive: boolean;
}

export class ApiClient {
  public static async getHealth(): Promise<SystemHealthResponse> {
    try {
      const res = await fetch(`${API_BASE}/system/health`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        status: 'HALTED',
        database: 'DISCONNECTED',
        killSwitch: { isHalted: true, version: 0, reason: 'API Unreachable' },
        timestamp: new Date().toISOString()
      };
    }
  }

  public static async getSecurity(): Promise<SecurityOverviewResponse> {
    try {
      const res = await fetch(`${API_BASE}/system/security`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        zeroCostEnforced: true,
        auditChainLength: 0,
        latestAuditHash: 'NOT AVAILABLE',
        killSwitchActive: true
      };
    }
  }

  public static async activateKillSwitch(reason: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/system/kill-switch/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public static async deactivateKillSwitch(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/system/kill-switch/deactivate`, {
        method: 'POST',
        credentials: 'include'
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
