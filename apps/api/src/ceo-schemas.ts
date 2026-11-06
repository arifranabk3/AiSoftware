import { z } from 'zod';

export const CreateObjectiveSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters').max(2000, 'Description cannot exceed 2000 characters'),
  priority: z.number().int().min(1).max(5).default(3),
  departmentIds: z.array(z.string().min(1)).min(1, 'At least one departmentId must be specified'),
  metadata: z.record(z.unknown()).optional().default({})
});

export const ListObjectivesQuerySchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  ownerId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const ExecuteObjectiveSchema = z.object({
  idempotencyKey: z.string().min(8, 'idempotencyKey must be at least 8 characters').optional(),
  executionNotes: z.string().max(500).optional()
});

export const ListApprovalsQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED']).optional(),
  objectiveId: z.string().optional(),
  taskId: z.string().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['requestedAt', 'riskLevel', 'status']).default('requestedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const ApproveApprovalSchema = z.object({
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional().default('Approved by Owner')
});

export const RejectApprovalSchema = z.object({
  reason: z.string().min(3, 'Rejection reason must be at least 3 characters').max(500, 'Reason cannot exceed 500 characters')
});

export type CreateObjectiveInput = z.infer<typeof CreateObjectiveSchema>;
export type ListObjectivesQueryInput = z.infer<typeof ListObjectivesQuerySchema>;
export type ExecuteObjectiveInput = z.infer<typeof ExecuteObjectiveSchema>;
export type ListApprovalsQueryInput = z.infer<typeof ListApprovalsQuerySchema>;
export type ApproveApprovalInput = z.infer<typeof ApproveApprovalSchema>;
export type RejectApprovalInput = z.infer<typeof RejectApprovalSchema>;

