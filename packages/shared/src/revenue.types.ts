import { z } from 'zod';
import { DepartmentId } from './departments.js';

export enum MonetizationChannel {
  YOUTUBE = 'YOUTUBE',
  AFFILIATE = 'AFFILIATE',
  SEO_PUBLISHING = 'SEO_PUBLISHING',
  DIGITAL_PRODUCT = 'DIGITAL_PRODUCT'
}

export enum ContentLifecycleState {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  BLOCKED = 'BLOCKED'
}

export enum AffiliateProgramStatus {
  RESEARCHED = 'RESEARCHED',
  APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface ChannelExecutionAsset {
  assetId: string;
  channel: MonetizationChannel;
  title: string;
  targetKeywords?: string[];
  lifecycleState: ContentLifecycleState;
  filePath: string;
  blockerReason?: string;
  nextRequiredAction: string;
  externalUrl?: string;
  affiliateProgram?: {
    programName: string;
    officialUrl: string;
    commissionStructure: string;
    status: AffiliateProgramStatus;
    affiliateLink?: string;
  };
  metrics: {
    views: number;
    clicks: number;
    confirmedOrders: number;
    grossRevenueUSD: number;
    netRevenueUSD: number;
  };
  createdAt: string;
  updatedAt: string;
}

export enum RevenueOpportunityStatus {
  IDENTIFIED = 'IDENTIFIED',
  RANKED = 'RANKED',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_APPROVAL = 'AWAITING_APPROVAL',
  READY_FOR_PUBLISH = 'READY_FOR_PUBLISH',
  PUBLISHED = 'PUBLISHED',
  BLOCKED = 'BLOCKED'
}

export interface RevenueOpportunity {
  opportunityId: string;
  channel: MonetizationChannel;
  title: string;
  targetAudience: string;
  effortScore: number; // 1 (lowest) to 5 (highest)
  costUSD: 0; // Strictly zero cost policy
  demandEvidence: string;
  estimatedRevenuePotential: 'LOW' | 'MEDIUM' | 'HIGH';
  targetDepartment: DepartmentId;
  assignedSpecialistId: string;
  status: RevenueOpportunityStatus;
  deliverablePath?: string;
  approvalRequired: boolean;
  approvalReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelPerformanceMetrics {
  channel: MonetizationChannel;
  identifiedOpportunities: number;
  publishedAssets: number;
  pendingApprovals: number;
  views: number;
  clicks: number;
  conversions: number;
  estimatedRevenueUSD: number;
  pendingRevenueUSD: number;
  confirmedRevenueUSD: number;
  receivedPaymentsUSD: number;
  refundsUSD: number;
  expensesUSD: number;
  netRevenueUSD: number;
}

export interface DailyExecutionPlan {
  planId: string;
  date: string; // ISO date 'YYYY-MM-DD'
  targetChannels: MonetizationChannel[];
  priorityRankings: {
    channel: MonetizationChannel;
    rank: number;
    recommendedWeight: number; // Percentage 0-100
    rationale: string;
  }[];
  scheduledTasks: {
    taskId: string;
    opportunityId: string;
    channel: MonetizationChannel;
    title: string;
    assignedSpecialistId: string;
    departmentId: DepartmentId;
    deliverableFile: string;
    requiresApproval: boolean;
  }[];
  generatedAt: string;
}

export interface RevenueTransaction {
  transactionId: string;
  channel: MonetizationChannel;
  opportunityId?: string;
  grossAmountUSD: number;
  feeUSD: number;
  netAmountUSD: number;
  status: 'PENDING' | 'CONFIRMED' | 'PAID_OUT' | 'REFUNDED';
  source: string; // e.g. 'Gumroad', 'Amazon Associates', 'YouTube AdSense'
  externalReference?: string;
  occurredAt: string;
  confirmedAt?: string;
}

export const RevenueOpportunitySchema = z.object({
  opportunityId: z.string().min(1),
  channel: z.nativeEnum(MonetizationChannel),
  title: z.string().min(1),
  targetAudience: z.string().min(1),
  effortScore: z.number().int().min(1).max(5),
  costUSD: z.literal(0),
  demandEvidence: z.string().min(1),
  estimatedRevenuePotential: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  targetDepartment: z.nativeEnum(DepartmentId),
  assignedSpecialistId: z.string().min(1),
  status: z.nativeEnum(RevenueOpportunityStatus),
  deliverablePath: z.string().optional(),
  approvalRequired: z.boolean(),
  approvalReason: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
