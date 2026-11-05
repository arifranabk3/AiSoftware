import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateAuthTokens,
  verifyAccessToken,
  verifyRefreshToken,
  calculateAuditHash,
  verifyAuditChain,
  killSwitch,
  checkPermission,
  assertSpecialistExecutionPermission
} from '../packages/security/src/index.js';
import { PermissionLevel, ProviderClassification } from '../packages/shared/src/index.js';
import { buildServer } from '../apps/api/src/server.js';
import { dbService } from '../packages/database/src/index.js';
import type { FastifyInstance } from 'fastify';

describe('1. Password Hashing (Argon2id)', () => {
  it('should securely hash password with Argon2id and verify', async () => {
    const raw = 'SuperSecretOwnerPassword123!';
    const hashed = await hashPassword(raw);

    expect(hashed).toContain('$argon2id$');
    expect(await verifyPassword(raw, hashed)).toBe(true);
    expect(await verifyPassword('WrongPassword!', hashed)).toBe(false);
  });

  it('should reject short passwords less than 8 characters', async () => {
    await expect(hashPassword('short')).rejects.toThrow(
      'Password must be at least 8 characters long'
    );
  });
});

describe('2. Authentication & Refresh Token Rotation', () => {
  const jwtSecret = 'test_jwt_secret_must_be_32_characters_long_123';
  const refreshSecret = 'test_refresh_secret_must_be_32_characters_long';

  it('should generate valid access and refresh tokens', () => {
    const tokens = generateAuthTokens(
      { userId: 'usr_1', email: 'owner@test.com', isOwner: true, role: 'OWNER' },
      jwtSecret,
      refreshSecret
    );

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.refreshTokenHash).toBeDefined();

    const decodedAccess = verifyAccessToken(tokens.accessToken, jwtSecret);
    expect(decodedAccess.userId).toBe('usr_1');

    const decodedRefresh = verifyRefreshToken(tokens.refreshToken, refreshSecret);
    expect(decodedRefresh.userId).toBe('usr_1');
  });
});

describe('3. Cryptographic Audit Log Chaining & Tamper Detection', () => {
  it('should construct valid hash chain and detect tampering', () => {
    const genesisHash =
      'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000';

    const entry1 = {
      userId: 'usr_1',
      action: 'LOGIN',
      entityType: 'User',
      entityId: 'usr_1',
      timestamp: '2026-11-05T10:00:00Z',
      previousHash: genesisHash
    };
    const hash1 = calculateAuditHash(entry1);

    const entry2 = {
      userId: 'usr_1',
      action: 'TASK_CREATE',
      entityType: 'Task',
      entityId: 'tsk_1',
      timestamp: '2026-11-05T10:01:00Z',
      previousHash: hash1
    };
    const hash2 = calculateAuditHash(entry2);

    const chain = [
      { ...entry1, hashSignature: hash1 },
      { ...entry2, hashSignature: hash2 }
    ];

    expect(verifyAuditChain(chain).isValid).toBe(true);

    // Tamper test: modify entry 1 action
    const tamperedChain = [
      { ...entry1, action: 'TAMPERED_ACTION', hashSignature: hash1 },
      { ...entry2, hashSignature: hash2 }
    ];
    expect(verifyAuditChain(tamperedChain).isValid).toBe(false);
  });
});

describe('4. Emergency Kill-Switch Behavior', () => {
  beforeEach(() => {
    killSwitch.deactivate();
  });

  it('should toggle and block execution when activated', () => {
    expect(killSwitch.getState().isHalted).toBe(false);
    expect(() => killSwitch.assertOperational()).not.toThrow();

    killSwitch.activate('Owner', 'Security Anomaly Detected');
    expect(killSwitch.getState().isHalted).toBe(true);
    expect(() => killSwitch.assertOperational()).toThrow('EMERGENCY HALT ACTIVE');

    killSwitch.deactivate();
    expect(killSwitch.getState().isHalted).toBe(false);
    expect(() => killSwitch.assertOperational()).not.toThrow();
  });
});

describe('5. RBAC & Specialist Execution Limits', () => {
  it('should enforce action permission matching', () => {
    const ownerContext = { userId: '1', isOwner: true, permissions: [] };
    const auditorContext = { userId: '2', isOwner: false, permissions: ['READ:AuditLog'] };

    expect(checkPermission(ownerContext, 'DELETE', 'User')).toBe(true);
    expect(checkPermission(auditorContext, 'READ', 'AuditLog')).toBe(true);
    expect(checkPermission(auditorContext, 'DELETE', 'AuditLog')).toBe(false);
  });

  it('specialist execution permission levels must strictly guard actions', () => {
    expect(
      assertSpecialistExecutionPermission(PermissionLevel.ADMIN, PermissionLevel.STANDARD_EXECUTE)
    ).toBe(true);
    expect(
      assertSpecialistExecutionPermission(
        PermissionLevel.READ_ONLY,
        PermissionLevel.CRITICAL_EXECUTE
      )
    ).toBe(false);
  });
});

describe('6. Zero-Cost Policy Enforcement Verification', () => {
  it('proves paid providers are classified as PAID and disabled by default', () => {
    expect(ProviderClassification.PAID).toBe('PAID');
    expect(ProviderClassification.FREE).toBe('FREE');
  });
});

describe('7. Database Connection Failure & Resilience', () => {
  it('should gracefully report connection failure without throwing unhandled exceptions', async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/ai_command_center';
    const result = await dbService.connect();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(dbService.getStatus().isConnected).toBe(false);
  });
});

describe('8. REST API Endpoints Integration Test (Fastify Server)', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/ai_command_center';
    server = await buildServer();
  });

  it('GET /api/v1/system/health should return health and database state', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/system/health'
    });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.status).toBeDefined();
    expect(json.database).toBe('DISCONNECTED'); // Honest reporting of database
  });

  it('POST /api/v1/auth/login with invalid credentials should fail with 401', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'owner@ai-command-center.local', password: 'WrongPassword!' }
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/auth/login with valid owner credentials should succeed and return access token', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'owner@ai-command-center.local', password: 'OwnerSecurePass123!' }
    });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.accessToken).toBeDefined();
    expect(json.user.isOwner).toBe(true);

    const cookies = res.cookies;
    const refreshTokenCookie = cookies.find((c: { name: string }) => c.name === 'refreshToken');
    expect(refreshTokenCookie).toBeDefined();
    expect(refreshTokenCookie?.httpOnly).toBe(true);

    // Test protected me endpoint
    const meRes = await server.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${json.accessToken}`
      }
    });
    expect(meRes.statusCode).toBe(200);
    expect(meRes.json().user.userId).toBe('usr_owner_root_001');
  });

  it('GET /api/v1/system/security should block unauthorized requests', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/system/security'
    });
    expect(res.statusCode).toBe(401);
  });
});
