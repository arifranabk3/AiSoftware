import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { buildServer } from '../apps/api/src/server.js';
import { verifyWebhookSignature } from '../packages/security/src/webhook-verifier.js';
import {
  mongoDbService,
  StorefrontRepository,
  RevenueRepository
} from '@ai-command-center/database';

describe('Phase 11.4 — Storefront Webhook Verification & Revenue Hardening Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let app: FastifyInstance;
  const TEST_WEBHOOK_SECRET = 'test_ls_secret_7721_xyz';

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_storefront_revenue');

    // Connect mongoDbService singleton so Fastify handlers can access the test database
    await mongoDbService.connect(uri, 'test_storefront_revenue');

    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await client.close();
    await mongod.stop();
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  });

  it('1. should accurately verify HMAC-SHA256 signature using verifyWebhookSignature', () => {
    const rawPayload = JSON.stringify({ meta: { event_name: 'order_created' }, data: { id: 'ord_123' } });
    const hmac = crypto.createHmac('sha256', TEST_WEBHOOK_SECRET);
    const validSignature = hmac.update(rawPayload).digest('hex');

    const result = verifyWebhookSignature(rawPayload, validSignature, TEST_WEBHOOK_SECRET);
    expect(result.isValid).toBe(true);

    const badResult = verifyWebhookSignature(rawPayload, 'invalid_signature_hex_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', TEST_WEBHOOK_SECRET);
    expect(badResult.isValid).toBe(false);

    const missingSecretResult = verifyWebhookSignature(rawPayload, validSignature, undefined);
    expect(missingSecretResult.isValid).toBe(false);
    expect(missingSecretResult.error).toBe('WEBHOOK_SECRET_MISSING');
  });

  it('2. should reject unauthenticated / bad signature webhook requests with 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/ceo/storefront/webhooks/lemonsqueezy',
      headers: {
        'x-signature': 'bad_signature_header'
      },
      payload: {
        meta: { event_name: 'order_created' }
      }
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('UNAUTHORIZED_WEBHOOK_SIGNATURE');
  });

  it('3. should accept valid signed webhook, enforce idempotency, and record verified transaction', async () => {
    const payload = {
      meta: {
        event_name: 'order_created'
      },
      data: {
        id: 'ord_ls_9901',
        attributes: {
          store_id: 101,
          order_number: 1001,
          user_name: 'Verified Buyer',
          user_email: 'buyer@example.com',
          currency: 'USD',
          total: 1900, // $19.00 USD in cents
          subtotal: 1900,
          status: 'paid',
          test_mode: false,
          created_at: new Date().toISOString()
        }
      }
    };

    const rawBody = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', TEST_WEBHOOK_SECRET);
    const validSignature = hmac.update(rawBody).digest('hex');

    // First request: Process successfully
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/ceo/storefront/webhooks/lemonsqueezy',
      headers: {
        'x-signature': validSignature,
        'content-type': 'application/json'
      },
      payload: rawBody
    });

    expect(res1.statusCode).toBe(200);
    const body1 = JSON.parse(res1.body);
    expect(body1.success).toBe(true);
    expect(body1.status).toBe('PROCESSED');
    expect(body1.verified).toBe(true);

    // Second request: Idempotency protection ignores duplicate
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/ceo/storefront/webhooks/lemonsqueezy',
      headers: {
        'x-signature': validSignature,
        'content-type': 'application/json'
      },
      payload: rawBody
    });

    expect(res2.statusCode).toBe(200);
    const body2 = JSON.parse(res2.body);
    expect(body2.status).toBe('ALREADY_PROCESSED');

    // Verify revenue transaction record exists
    const revenueRepo = new RevenueRepository(db);
    const metrics = await revenueRepo.getChannelMetrics('DIGITAL_PRODUCT' as any);
    expect(metrics.conversions).toBe(1);
    expect(metrics.confirmedRevenueUSD).toBeGreaterThan(0);
    // Gross: $19.00, Fee (5% of 19 = 0.95 + 0.50 = 1.45), Net: 17.55
    expect(metrics.confirmedRevenueUSD).toBe(17.55);
  });

  it('4. should process order_refunded and decrement net revenue cleanly', async () => {
    const refundPayload = {
      meta: {
        event_name: 'order_refunded'
      },
      data: {
        id: 'ord_ls_9901',
        attributes: {
          store_id: 101,
          order_number: 1001,
          user_name: 'Verified Buyer',
          user_email: 'buyer@example.com',
          currency: 'USD',
          total: 1900,
          refunded: true,
          refunded_amount: 1900,
          status: 'refunded',
          test_mode: false,
          created_at: new Date().toISOString()
        }
      }
    };

    const rawRefundBody = JSON.stringify(refundPayload);
    const refundHmac = crypto.createHmac('sha256', TEST_WEBHOOK_SECRET);
    const refundSignature = refundHmac.update(rawRefundBody).digest('hex');

    const refundRes = await app.inject({
      method: 'POST',
      url: '/api/ceo/storefront/webhooks/lemonsqueezy',
      headers: {
        'x-signature': refundSignature,
        'content-type': 'application/json'
      },
      payload: rawRefundBody
    });

    expect(refundRes.statusCode).toBe(200);
    const refundBody = JSON.parse(refundRes.body);
    expect(refundBody.status).toBe('PROCESSED');

    const revenueRepo = new RevenueRepository(db);
    const metrics = await revenueRepo.getChannelMetrics('DIGITAL_PRODUCT' as any);
    expect(metrics.refundsUSD).toBe(19.00);
  });
});
