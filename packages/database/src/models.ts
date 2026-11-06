export enum ObjectiveStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface BusinessObjectiveDocument {
  _id: string; // Internal Mongo ID or objectiveId
  objectiveId: string;
  title: string;
  description: string;
  ownerId: string;
  status: ObjectiveStatus;
  priority: number;
  departmentIds: string[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata: Record<string, unknown>;
}

export interface OrchestratorTaskDocument {
  _id: string; // Internal Mongo ID or taskId
  taskId: string;
  objectiveId: string;
  parentTaskId?: string;
  departmentId: string;
  specialistId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  attemptCount: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface ApprovalRequestDocument {
  _id: string; // Internal Mongo ID or approvalId
  approvalId: string;
  objectiveId: string;
  taskId: string;
  requestedBy: string;
  approvalType: string;
  description: string;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  decisionReason?: string;
  metadata: Record<string, unknown>;
}

export interface PaginationOptions {
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  skip: number;
}

export interface UserDocument {
  _id: string; // Mongo ID or userId
  userId: string;
  email: string;
  passwordHash: string;
  isOwner: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}


