import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import {
  hashPassword,
  verifyPassword,
  generateAuthTokens,
  verifyAccessToken,
  verifyRefreshToken,
  killSwitch,
  calculateAuditHash,
  ChainedAuditLogEntry
} from '@ai-command-center/security';
import { validateEnvironment } from '@ai-command-center/config';
import { dbService } from '@ai-command-center/database';

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    trustProxy: true
  });

  // Simulated in-memory store for demonstrations/testing when database is offline
  const mockUsers = new Map<
    string,
    { id: string; email: string; passwordHash: string; isOwner: boolean }
  >();
  const activeRefreshTokens = new Map<string, string>(); // tokenHash -> userId
  const inMemoryAuditChain: ChainedAuditLogEntry[] = [];
  let latestHash = 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000';

  // Seed default owner in memory for testing
  const ownerPassHash = await hashPassword('OwnerSecurePass123!');
  mockUsers.set('owner@ai-command-center.local', {
    id: 'usr_owner_root_001',
    email: 'owner@ai-command-center.local',
    passwordHash: ownerPassHash,
    isOwner: true
  });

  const env = validateEnvironment({
    NODE_ENV: process.env.NODE_ENV || 'test',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/ai_command_center',
    JWT_SECRET: process.env.JWT_SECRET || 'test_jwt_secret_must_be_32_characters_long_123',
    REFRESH_TOKEN_SECRET:
      process.env.REFRESH_TOKEN_SECRET || 'test_refresh_secret_must_be_32_characters_long',
    MASTER_ENCRYPTION_KEY:
      process.env.MASTER_ENCRYPTION_KEY || 'test_master_encryption_key_32_char',
    OWNER_PHONE_NUMBER: process.env.OWNER_PHONE_NUMBER || '+1234567890'
  });

  await app.register(fastifyCookie, {
    secret: env.JWT_SECRET
  });

  await app.register(fastifyCors, {
    origin: true,
    credentials: true
  });

  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  // Authentication Middleware Hook
  async function authenticate(req: FastifyRequest, reply: FastifyReply) {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies.accessToken;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken;

    if (!token) {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    try {
      const decoded = verifyAccessToken(token, env.JWT_SECRET);
      (req as unknown as { user: unknown }).user = decoded;
    } catch {
      return reply
        .status(401)
        .send({ error: 'INVALID_TOKEN', message: 'Token expired or invalid' });
    }
  }

  // --- AUTH ENDPOINTS ---

  app.post('/api/v1/auth/login', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as { email?: string; password?: string };
    if (!body?.email || !body?.password) {
      return reply
        .status(400)
        .send({ error: 'BAD_REQUEST', message: 'Email and password required' });
    }

    const user = mockUsers.get(body.email);
    if (!user) {
      return reply
        .status(401)
        .send({ error: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(body.password, user.passwordHash);
    if (!isValid) {
      return reply
        .status(401)
        .send({ error: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const tokens = generateAuthTokens(
      { userId: user.id, email: user.email, isOwner: user.isOwner, role: 'OWNER' },
      env.JWT_SECRET,
      env.REFRESH_TOKEN_SECRET
    );

    activeRefreshTokens.set(tokens.refreshTokenHash, user.id);

    // Set HTTP-only Cookie
    reply.setCookie('refreshToken', tokens.refreshToken, {
      path: '/api/v1/auth',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    // Record Audit Log
    const auditEntry = {
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      timestamp: new Date().toISOString(),
      previousHash: latestHash
    };
    const signature = calculateAuditHash(auditEntry);
    latestHash = signature;
    inMemoryAuditChain.push({ ...auditEntry, hashSignature: signature });

    return reply.status(200).send({
      message: 'Authentication successful',
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        isOwner: user.isOwner
      }
    });
  });

  app.post('/api/v1/auth/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    const token = req.cookies.refreshToken;
    if (!token) {
      return reply
        .status(401)
        .send({ error: 'UNAUTHORIZED', message: 'Refresh token cookie required' });
    }

    try {
      const decoded = verifyRefreshToken(token, env.REFRESH_TOKEN_SECRET);
      // Generate new rotated token pair
      const newTokens = generateAuthTokens(
        {
          userId: decoded.userId,
          email: 'owner@ai-command-center.local',
          isOwner: true,
          role: 'OWNER'
        },
        env.JWT_SECRET,
        env.REFRESH_TOKEN_SECRET
      );

      reply.setCookie('refreshToken', newTokens.refreshToken, {
        path: '/api/v1/auth',
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60
      });

      return reply.status(200).send({
        accessToken: newTokens.accessToken
      });
    } catch {
      return reply
        .status(401)
        .send({ error: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' });
    }
  });

  app.post('/api/v1/auth/logout', async (_req: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('refreshToken', { path: '/api/v1/auth' });
    return reply.status(200).send({ message: 'Logged out successfully' });
  });

  app.get(
    '/api/v1/auth/me',
    { preHandler: authenticate },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = (req as unknown as { user: unknown }).user;
      return reply.status(200).send({ user });
    }
  );

  // --- SYSTEM & SECURITY ENDPOINTS ---

  app.get('/api/v1/system/health', async (_req, reply) => {
    let dbConnected = false;
    try {
      dbConnected = dbService.getStatus().isConnected;
    } catch {
      dbConnected = false;
    }

    const ks = killSwitch.getState();
    return reply.status(200).send({
      status: ks.isHalted ? 'HALTED' : 'HEALTHY',
      database: dbConnected ? 'CONNECTED' : 'DISCONNECTED',
      killSwitch: ks,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/v1/system/security', { preHandler: authenticate }, async (_req, reply) => {
    return reply.status(200).send({
      zeroCostEnforced: true,
      auditChainLength: inMemoryAuditChain.length,
      latestAuditHash: latestHash,
      killSwitchActive: killSwitch.getState().isHalted
    });
  });

  app.get('/api/v1/system/kill-switch', { preHandler: authenticate }, async (_req, reply) => {
    return reply.status(200).send(killSwitch.getState());
  });

  app.post(
    '/api/v1/system/kill-switch/activate',
    { preHandler: authenticate },
    async (req, reply) => {
      const body = req.body as { reason?: string };
      const user = (req as unknown as { user: { userId: string } }).user;
      const updated = killSwitch.activate(user.userId, body?.reason || 'Owner Manual Trigger');

      // Record audit event
      const auditEntry = {
        userId: user.userId,
        action: 'KILL_SWITCH_ACTIVATED',
        entityType: 'System',
        entityId: 'global',
        newState: { isHalted: true, reason: body?.reason },
        timestamp: new Date().toISOString(),
        previousHash: latestHash
      };
      const signature = calculateAuditHash(auditEntry);
      latestHash = signature;
      inMemoryAuditChain.push({ ...auditEntry, hashSignature: signature });

      return reply.status(200).send({
        message: 'EMERGENCY KILL-SWITCH ACTIVATED. Autonomous workers frozen.',
        killSwitch: updated
      });
    }
  );

  app.post(
    '/api/v1/system/kill-switch/deactivate',
    { preHandler: authenticate },
    async (req, reply) => {
      const user = (req as unknown as { user: { userId: string } }).user;
      const updated = await killSwitch.deactivate(user.userId);

      // Record audit event
      const auditEntry = {
        userId: user.userId,
        action: 'KILL_SWITCH_DEACTIVATED',
        entityType: 'System',
        entityId: 'global',
        newState: { isHalted: false },
        timestamp: new Date().toISOString(),
        previousHash: latestHash
      };
      const signature = calculateAuditHash(auditEntry);
      latestHash = signature;
      inMemoryAuditChain.push({ ...auditEntry, hashSignature: signature });

      return reply.status(200).send({
        message: 'Emergency kill-switch deactivated. Normal operations resumed.',
        killSwitch: updated
      });
    }
  );

  return app;
}

export async function startApiServer() {
  const server = await buildServer();
  const port = Number(process.env.PORT) || 3001;
  await server.listen({ port, host: '0.0.0.0' });
  console.log(`API Server listening on port ${port}`);
}
