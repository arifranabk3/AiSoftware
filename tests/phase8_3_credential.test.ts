import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { buildServer } from '../apps/api/src/server.js';
import { mongoDbService, UserRepository, initializeDatabaseIndexes } from '@ai-command-center/database';
import { validateEnvironment } from '@ai-command-center/config';
import { checkPermission } from '@ai-command-center/security';

describe('Phase 8.3 — Production Dependency Security & Credential Readiness Test Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let app: FastifyInstance;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_sec_audit_8_3');
    await mongoDbService.connect(uri, 'test_sec_audit_8_3');
    await initializeDatabaseIndexes(uri, 'test_sec_audit_8_3');

    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await mongoDbService.disconnect();
    await client.close();
    await mongod.stop();
  });

  describe('1. Production Startup with Missing & Weak Secrets', () => {
    it('should fail startup if JWT_SECRET or REFRESH_TOKEN_SECRET are missing or too short', () => {
      expect(() => {
        validateEnvironment({
          NODE_ENV: 'production',
          JWT_SECRET: 'short',
          REFRESH_TOKEN_SECRET: '7a9f8b1c4e2d6a5f0b3e8c1d7a9f8b1c4e2d6a5f0b3e8c1d',
          MASTER_ENCRYPTION_KEY: 'e4d3c2b1a0f9e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d',
          OWNER_PHONE_NUMBER: '+123456789'
        });
      }).toThrow(/at least 32 characters/);
    });

    it('should fail startup if JWT_SECRET and REFRESH_TOKEN_SECRET are identical in production', () => {
      const secret = '7a9f8b1c4e2d6a5f0b3e8c1d7a9f8b1c4e2d6a5f0b3e8c1d';
      expect(() => {
        validateEnvironment({
          NODE_ENV: 'production',
          JWT_SECRET: secret,
          REFRESH_TOKEN_SECRET: secret,
          MASTER_ENCRYPTION_KEY: 'e4d3c2b1a0f9e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d',
          OWNER_PHONE_NUMBER: '+123456789'
        });
      }).toThrow(/must be distinct cryptographic keys/);
    });

    it('should fail startup if OWNER_INITIAL_PASSWORD is weak or predictable in production mode', () => {
      expect(() => {
        validateEnvironment({
          NODE_ENV: 'production',
          JWT_SECRET: '7a9f8b1c4e2d6a5f0b3e8c1d7a9f8b1c4e2d6a5f0b3e8c1d',
          REFRESH_TOKEN_SECRET: 'f1e2d3c4b5a69780123456789abcdef0123456789abcdef0',
          MASTER_ENCRYPTION_KEY: 'e4d3c2b1a0f9e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d',
          OWNER_PHONE_NUMBER: '+123456789',
          OWNER_INITIAL_PASSWORD: 'OwnerSecurePass123!'
        });
      }).toThrow(/predictable or default credentials/);
    });

    it('should accept secure custom production owner credentials and high-entropy secrets', () => {
      const config = validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: '7a9f8b1c4e2d6a5f0b3e8c1d7a9f8b1c4e2d6a5f0b3e8c1d',
        REFRESH_TOKEN_SECRET: 'f1e2d3c4b5a69780123456789abcdef0123456789abcdef0',
        MASTER_ENCRYPTION_KEY: 'e4d3c2b1a0f9e8d7c6b5a4938271605f4e3d2c1b0a9f8e7d',
        OWNER_PHONE_NUMBER: '+123456789',
        OWNER_INITIAL_PASSWORD: 'K9#vX$82mP*qLz!wY5@nB1'
      });
      expect(config.NODE_ENV).toBe('production');
      expect(config.OWNER_INITIAL_PASSWORD).toBe('K9#vX$82mP*qLz!wY5@nB1');
    });
  });

  describe('2. Owner Bootstrap Concurrency & Existing Account Protection', () => {
    it('should handle concurrent bootstrap attempts idempotently without creating duplicate accounts', async () => {
      const userRepo = new UserRepository(db);
      const email = 'concurrent_owner@ai-command-center.local';

      // 5 concurrent registration / bootstrap requests
      const promises = Array.from({ length: 5 }).map(async (_, idx) => {
        try {
          const existing = await userRepo.findByEmail(email);
          if (!existing) {
            return await userRepo.create({
              userId: `usr_concurrent_${idx}`,
              email,
              passwordHash: '$argon2id$v=19$m=19456,t=2,p=1$fakeHash123',
              isOwner: true,
              role: 'OWNER'
            });
          }
          return existing;
        } catch (err: unknown) {
          // Duplicate key collision is caught cleanly by MongoDB unique index
          return null;
        }
      });

      const results = await Promise.all(promises);
      const createdCount = results.filter((r) => r !== null).length;
      expect(createdCount).toBeGreaterThanOrEqual(1);

      // Verify exactly ONE user document exists in MongoDB for this email
      const usersInDb = await db.collection('users').find({ email }).toArray();
      expect(usersInDb.length).toBe(1);
    });
  });

  describe('3. Role Boundaries, Tenant Isolation & Unauthorized Action Rejection', () => {
    it('should reject non-owner user attempting to invoke owner administrative actions', () => {
      const standardUser = {
        userId: 'usr_staff_42',
        isOwner: false,
        permissions: ['READ:objectives', 'EXECUTE:tasks']
      };

      // Owner-only operations
      expect(checkPermission(standardUser, 'APPROVE', 'tasks')).toBe(false);
      expect(checkPermission(standardUser, 'REJECT', 'tasks')).toBe(false);
      expect(checkPermission(standardUser, 'ACTIVATE', 'kill-switch')).toBe(false);
      expect(checkPermission(standardUser, 'DEACTIVATE', 'kill-switch')).toBe(false);
    });

    it('should reject unauthorized tool execution if tool is not assigned to specialist profile', () => {
      const { assertSpecialistExecutionPermission } = require('@ai-command-center/security');
      const { PermissionLevel } = require('@ai-command-center/shared');

      // READ_ONLY specialist attempting CRITICAL_EXECUTE (e.g. system mutation)
      const allowed = assertSpecialistExecutionPermission(
        PermissionLevel.READ_ONLY,
        PermissionLevel.CRITICAL_EXECUTE
      );
      expect(allowed).toBe(false);

      // STANDARD_EXECUTE specialist attempting ADMIN
      const adminAllowed = assertSpecialistExecutionPermission(
        PermissionLevel.STANDARD_EXECUTE,
        PermissionLevel.ADMIN
      );
      expect(adminAllowed).toBe(false);
    });
  });
});
