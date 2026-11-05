import { DepartmentId, SPECIALIST_PROFILES, SpecialistProfile } from '@ai-command-center/shared';

export interface DispatchTaskPayload {
  taskId: string;
  action: string;
  departmentId: DepartmentId;
  preferredSpecialistId?: string;
  data: Record<string, unknown>;
  requiresApproval?: boolean;
}

export interface DispatchResult {
  accepted: boolean;
  assignedSpecialist: SpecialistProfile;
  queueName: string;
  requiresOwnerApproval: boolean;
  status: 'QUEUED' | 'AWAITING_OWNER_APPROVAL' | 'REJECTED';
  rejectionReason?: string;
}

export abstract class BaseDepartmentDispatcher {
  public abstract readonly departmentId: DepartmentId;
  public abstract readonly targetQueue: string;

  public dispatch(task: DispatchTaskPayload): DispatchResult {
    if (task.departmentId !== this.departmentId) {
      throw new Error(
        `DISPATCH_MISMATCH: Task for ${task.departmentId} sent to ${this.departmentId} dispatcher.`
      );
    }

    const availableSpecialists = SPECIALIST_PROFILES.filter(
      (s) => s.departmentId === this.departmentId && s.isActive
    );
    if (availableSpecialists.length === 0) {
      throw new Error(
        `NO_ACTIVE_SPECIALISTS: Department ${this.departmentId} has no active specialists.`
      );
    }

    let selectedSpecialist: SpecialistProfile | undefined;
    if (task.preferredSpecialistId) {
      selectedSpecialist = availableSpecialists.find((s) => s.id === task.preferredSpecialistId);
    }
    if (!selectedSpecialist) {
      selectedSpecialist = availableSpecialists[0]; // Primary specialist fallback
    }

    const requiresApproval = task.requiresApproval || selectedSpecialist.approvalRequired;

    return {
      accepted: true,
      assignedSpecialist: selectedSpecialist,
      queueName: this.targetQueue,
      requiresOwnerApproval: requiresApproval,
      status: requiresApproval ? 'AWAITING_OWNER_APPROVAL' : 'QUEUED'
    };
  }
}

export class ExecutiveDispatcher extends BaseDepartmentDispatcher {
  public readonly departmentId = DepartmentId.EXECUTIVE;
  public readonly targetQueue = 'ceo_orchestrator_tasks';
}

export class EngineeringDispatcher extends BaseDepartmentDispatcher {
  public readonly departmentId = DepartmentId.ENGINEERING;
  public readonly targetQueue = 'specialist_tasks';
}

export class OperationsDispatcher extends BaseDepartmentDispatcher {
  public readonly departmentId = DepartmentId.OPERATIONS;
  public readonly targetQueue = 'system_maintenance';
}

export class ProductMarketingDispatcher extends BaseDepartmentDispatcher {
  public readonly departmentId = DepartmentId.PRODUCT_MARKETING;
  public readonly targetQueue = 'content_production';
}

export class FinanceDispatcher extends BaseDepartmentDispatcher {
  public readonly departmentId = DepartmentId.FINANCE;
  public readonly targetQueue = 'specialist_tasks';
}

export class BusinessDevDispatcher extends BaseDepartmentDispatcher {
  public readonly departmentId = DepartmentId.BUSINESS_DEV;
  public readonly targetQueue = 'business_discovery';
}

export class SecurityDispatcher extends BaseDepartmentDispatcher {
  public readonly departmentId = DepartmentId.SECURITY;
  public readonly targetQueue = 'specialist_tasks';
}

export class DispatcherRegistry {
  private dispatchers = new Map<DepartmentId, BaseDepartmentDispatcher>();

  constructor() {
    this.dispatchers.set(DepartmentId.EXECUTIVE, new ExecutiveDispatcher());
    this.dispatchers.set(DepartmentId.ENGINEERING, new EngineeringDispatcher());
    this.dispatchers.set(DepartmentId.OPERATIONS, new OperationsDispatcher());
    this.dispatchers.set(DepartmentId.PRODUCT_MARKETING, new ProductMarketingDispatcher());
    this.dispatchers.set(DepartmentId.FINANCE, new FinanceDispatcher());
    this.dispatchers.set(DepartmentId.BUSINESS_DEV, new BusinessDevDispatcher());
    this.dispatchers.set(DepartmentId.SECURITY, new SecurityDispatcher());
  }

  public getDispatcher(deptId: DepartmentId): BaseDepartmentDispatcher {
    const d = this.dispatchers.get(deptId);
    if (!d) throw new Error(`Dispatcher not found for department ${deptId}`);
    return d;
  }
}

export const dispatcherRegistry = new DispatcherRegistry();
