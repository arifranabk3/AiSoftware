import { createHash } from 'node:crypto';

export interface AuditRecordPayload {
  userId?: string;
  specialistId?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  previousHash: string;
}

export interface ChainedAuditLogEntry extends AuditRecordPayload {
  hashSignature: string;
}

/**
 * Calculates cryptographic SHA-256 hash chaining signature.
 * Combines previousHash + current payload data to create a tamper-evident audit chain.
 * Note: Hash chaining detects tampering, but does not by itself prevent physical table truncations.
 */
export function calculateAuditHash(payload: AuditRecordPayload): string {
  const serialized = JSON.stringify({
    previousHash: payload.previousHash,
    timestamp: payload.timestamp,
    userId: payload.userId ?? null,
    specialistId: payload.specialistId ?? null,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId,
    previousState: payload.previousState ?? null,
    newState: payload.newState ?? null,
    ipAddress: payload.ipAddress ?? null,
    userAgent: payload.userAgent ?? null
  });

  return createHash('sha256').update(serialized).digest('hex');
}

export function verifyAuditChain(entries: ChainedAuditLogEntry[]): {
  isValid: boolean;
  brokenIndex?: number;
} {
  let expectedPreviousHash =
    'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.previousHash !== expectedPreviousHash) {
      return { isValid: false, brokenIndex: i };
    }

    const calculated = calculateAuditHash(entry);
    if (calculated !== entry.hashSignature) {
      return { isValid: false, brokenIndex: i };
    }

    expectedPreviousHash = entry.hashSignature;
  }

  return { isValid: true };
}
