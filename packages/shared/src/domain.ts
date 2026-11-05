import { DepartmentId } from './departments.js';
import { PermissionLevel } from './specialists.js';

// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  action: string;
  resource: string;
  description?: string;
}

// Tasks & Workflows
export enum TaskStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  HALTED = 'HALTED'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  specialistId: string;
  departmentId: DepartmentId;
  status: TaskStatus;
  priority: number;
  inputPayload: Record<string, unknown>;
  outputResult?: Record<string, unknown>;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  triggerType: 'MANUAL' | 'SCHEDULED' | 'EVENT';
  cronExpression?: string;
  steps: WorkflowStepDefinition[];
  isActive: boolean;
}

export interface WorkflowStepDefinition {
  stepIndex: number;
  name: string;
  specialistId: string;
  payloadTemplate: Record<string, unknown>;
  requiresApproval: boolean;
}

// AI Providers
export enum AIProviderType {
  GEMINI_FREE = 'GEMINI_FREE',
  GROQ_FREE = 'GROQ_FREE',
  HUGGING_FACE_FREE = 'HUGGING_FACE_FREE',
  OLLAMA_LOCAL = 'OLLAMA_LOCAL'
}

export interface AIProviderConfig {
  id: string;
  type: AIProviderType;
  name: string;
  isFreeTier: boolean;
  rateLimitRPM: number;
  dailyQuotaLimit: number;
  isEnabled: boolean;
}

// Business Portfolio & Discovery
export enum OpportunityStatus {
  DISCOVERED = 'DISCOVERED',
  EVALUATED = 'EVALUATED',
  PROPOSAL_DRAFTED = 'PROPOSAL_DRAFTED',
  PENDING_OWNER_APPROVAL = 'PENDING_OWNER_APPROVAL',
  APPLIED = 'APPLIED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface BusinessOpportunity {
  id: string;
  title: string;
  companyName: string;
  sourceUrl?: string;
  estimatedValueUSD: number;
  matchScore: number;
  status: OpportunityStatus;
  pitchSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Approvals & Human-in-the-Loop
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TIMED_OUT = 'TIMED_OUT'
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  actionName: string;
  details: Record<string, unknown>;
  status: ApprovalStatus;
  reason?: string;
  requestedAt: Date;
  decidedAt?: Date;
  decidedBy?: string;
}

// Notifications
export enum NotificationChannel {
  WHATSAPP = 'WHATSAPP',
  SYSTEM_BANNER = 'SYSTEM_BANNER',
  EMAIL = 'EMAIL'
}

export interface Notification {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  title: string;
  body: string;
  isDelivered: boolean;
  sentAt?: Date;
  createdAt: Date;
}

// Audit & Immutability
export interface AuditLogEvent {
  id: string;
  userId?: string;
  specialistId?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  hashSignature: string;
  createdAt: Date;
}

// Financial Records
export enum FinancialVerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  RECONCILED = 'RECONCILED',
  FLAGGED = 'FLAGGED'
}

export interface RevenueRecord {
  id: string;
  amount: number;
  currency: string;
  source: string;
  idempotencyKey: string;
  verificationStatus: FinancialVerificationStatus;
  receivedAt: Date;
  createdAt: Date;
}
