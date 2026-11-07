export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // When running in the browser during runtime in production, warn or guard if missing
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.warn(
      '[Config Warning] NEXT_PUBLIC_API_URL is not configured. API requests may fail.'
    );
  }
  return 'http://localhost:3001';
}

export const API_BASE = getApiBase();

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

export interface BusinessObjectiveItem {
  _id?: string;
  objectiveId: string;
  title: string;
  description: string;
  ownerId: string;
  status: 'DRAFT' | 'ACTIVE' | 'BLOCKED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  departmentIds: string[];
  metadata?: {
    estimatedCost?: number;
    tags?: string[];
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
  tasks?: OrchestratorTaskItem[];
}

export interface OrchestratorTaskItem {
  taskId: string;
  objectiveId: string;
  departmentId: string;
  specialistId: string;
  status: 'PENDING' | 'QUEUED' | 'RUNNING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  action: string;
  priority: string;
  result?: Record<string, unknown> | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequestItem {
  _id?: string;
  approvalId: string;
  taskId: string;
  objectiveId: string;
  specialistId: string;
  action: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  reason: string;
  decisionReason?: string;
  decidedBy?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecuteObjectiveResponse {
  success: boolean;
  message: string;
  objectiveId: string;
  status: string;
  idempotencyKey: string;
  dispatchedToQueue: boolean;
  initialTask?: {
    taskId: string;
    status: string;
    departmentId: string;
    specialistId: string;
  };
}

export interface AIProviderStatusItem {
  id: string;
  name: string;
  model: string;
  tier: 'Confirmed zero-API-cost' | 'Confirmed free-tier' | 'Auth only' | 'Internal';
  mode: 'REAL' | 'MOCK';
  status: 'ACTIVE' | 'CONFIGURED' | 'READY';
  notes: string;
}

export class ApiClient {
  public static async getHealth(): Promise<SystemHealthResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/system/health`, { cache: 'no-store' });
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
      const res = await fetch(`${API_BASE}/api/v1/system/security`, { credentials: 'include' });
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
      const res = await fetch(`${API_BASE}/api/v1/system/kill-switch/activate`, {
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
      const res = await fetch(`${API_BASE}/api/v1/system/kill-switch/deactivate`, {
        method: 'POST',
        credentials: 'include'
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public static async listObjectives(params?: {
    status?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ items: BusinessObjectiveItem[]; total: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.skip) query.set('skip', String(params.skip));

      const res = await fetch(`${API_BASE}/api/ceo/objectives?${query.toString()}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        items: json.data || [],
        total: json.pagination?.total ?? (json.data?.length || 0)
      };
    } catch {
      return { items: [], total: 0 };
    }
  }

  public static async getObjective(id: string): Promise<BusinessObjectiveItem | null> {
    try {
      const res = await fetch(`${API_BASE}/api/ceo/objectives/${id}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }

  public static async createObjective(payload: {
    title: string;
    description: string;
    priority?: number;
    departmentIds?: string[];
  }): Promise<{ success: boolean; data?: BusinessObjectiveItem; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/ceo/objectives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          priority: typeof payload.priority === 'number' ? payload.priority : 3,
          departmentIds: payload.departmentIds && payload.departmentIds.length > 0 ? payload.departmentIds : ['dept_executive']
        })
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.message || 'Creation failed' };
      }
      return { success: true, data: json.data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  public static async executeObjective(
    id: string,
    idempotencyKey?: string,
    executionNotes?: string
  ): Promise<{ success: boolean; data?: ExecuteObjectiveResponse; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/ceo/objectives/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idempotencyKey, executionNotes })
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.message || 'Execution dispatch failed' };
      }
      return { success: true, data: json };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  public static async listApprovals(params?: {
    status?: string;
    riskLevel?: string;
  }): Promise<{ items: ApprovalRequestItem[]; total: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.riskLevel) query.set('riskLevel', params.riskLevel);

      const res = await fetch(`${API_BASE}/api/ceo/approvals?${query.toString()}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        items: json.data || [],
        total: json.pagination?.total ?? (json.data?.length || 0)
      };
    } catch {
      return { items: [], total: 0 };
    }
  }

  public static async approveRequest(
    id: string,
    reason: string
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/ceo/approvals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.message || 'Approval failed' };
      }
      return { success: true, data: json.data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  public static async rejectRequest(
    id: string,
    reason: string
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/ceo/approvals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, error: json.message || 'Rejection failed' };
      }
      return { success: true, data: json.data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  // -------------------------------------------------------------
  // PHASE 10.3: REAL-TIME ACTIVITY & TELEMETRY
  // -------------------------------------------------------------
  public static async listActivities(params?: {
    startDate?: string;
    endDate?: string;
    taskId?: string;
    jobId?: string;
    departmentId?: string;
    agentId?: string;
    eventType?: string;
    status?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ items: any[]; total: number }> {
    try {
      const query = new URLSearchParams();
      if (params?.startDate) query.set('startDate', params.startDate);
      if (params?.endDate) query.set('endDate', params.endDate);
      if (params?.taskId) query.set('taskId', params.taskId);
      if (params?.jobId) query.set('jobId', params.jobId);
      if (params?.departmentId) query.set('departmentId', params.departmentId);
      if (params?.agentId) query.set('agentId', params.agentId);
      if (params?.eventType) query.set('eventType', params.eventType);
      if (params?.status) query.set('status', params.status);
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.skip) query.set('skip', String(params.skip));

      const res = await fetch(`${API_BASE}/api/ceo/activity?${query.toString()}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        items: json.items || [],
        total: json.total || 0
      };
    } catch {
      return { items: [], total: 0 };
    }
  }

  public static async getActivitySummary(): Promise<{
    totalEvents: number;
    activeJobsCount: number;
    failedJobsCount: number;
    completedTasksCount: number;
    recentEvents: any[];
  }> {
    try {
      const res = await fetch(`${API_BASE}/api/ceo/activity/summary`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || {
        totalEvents: 0,
        activeJobsCount: 0,
        failedJobsCount: 0,
        completedTasksCount: 0,
        recentEvents: []
      };
    } catch {
      return {
        totalEvents: 0,
        activeJobsCount: 0,
        failedJobsCount: 0,
        completedTasksCount: 0,
        recentEvents: []
      };
    }
  }

  public static async getRevenueMetrics(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/ceo/revenue/metrics`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data;
    } catch {
      return null;
    }
  }
}

