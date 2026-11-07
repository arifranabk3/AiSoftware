import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { buildServer } from '../apps/api/src/server.js';
import {
  mongoDbService,
  StorefrontRepository,
  RevenueRepository
} from '@ai-command-center/database';

describe('Phase 11.5 — Store Activation, Raw-Body Signatures & Webhook Hardening Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let app: FastifyInstance;
  const TEST_SECRET = 'ls_live_webhook_secret_99482_hardening';

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_store_activation');

    await mongoDbService.connect(uri, 'test_store_activation');
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = TEST_SECRET;

    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await client.close();
    await mongod.stop();
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  });

  it('1. should verify raw HTTP request body with exact whitespace and key ordering', async () => {
    // Unordered JSON with specific whitespace that would fail if re-stringified naively
    const rawPayload = '{\n  "meta": {\n    "event_name": "order_created"\n  },\n  "data": {\n    "id": "ord_exact_raw_01",\n    "attributes": {\n      "total": 1900,\n      "user_email": "rawbody@example.com"\n    }\n  }\n}';

    const hmac = crypto.createHmac('sha256', TEST_SECRET);
    const validSignature = hmac.update(rawPayload).digest('hex');

    const res = await app.inject({
      method: 'POST',
      url: '/api/ceo/storefront/webhooks/lemonsqueezy',
      headers: {
        'x-signature': validSignature,
        'content-type': 'application/json'
      },
      payload: rawPayload
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.verified).toBe(true);
  });

  it('2. should reject invalid signature or tampered body with 401 Unauthorized', async () => {
    const rawPayload = '{"meta":{"event_name":"order_created"},"data":{"id":"tampered_01","attributes":{"total":1900}}}';
    const fakeSignature = 'a'.repeat(64); // 64 hex characters (valid length, invalid key/digest)

    const res = await app.inject({
      method: 'POST',
      url: '/api/ceo/storefront/webhooks/lemonsqueezy',
      headers: {
        'x-signature': fakeSignature,
        'content-type': 'application/json'
      },
      payload: rawPayload
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error).toBe('UNAUTHORIZED_WEBHOOK_SIGNATURE');
  });

  it('3. should handle duplicate event delivery idempotently and ignore replayed payloads', async () => {
    const rawPayload = JSON.stringify({
      meta: { event_name: 'order_created' },
      data: {
        id: 'ord_replay_001',
        attributes: {
          total: 1900,
          currency: 'USD',
          user_email: 'customer@example.com',
          created_at: new Date().toISOString()
        }
      }
    });

    const hmac = crypto.createHmac('sha256', TEST_SECRET);
    const signature = hmac.update(rawPayload).digest('hex');

    // First delivery: Processed
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/ceo/storefront/webhooks/lemonsqueezy',
      headers: {
        'x-signature': signature,
        'content-type': 'application/json'
      },
      payload: rawPayload
    });
    expect(res1.statusCode).toBe(200);
    expect(JSON.parse(res1.body).status).toBe('PROCESSED');

    // Duplicate delivery: Ignored
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/ceo/storefront/webhooks/lemonsqueezy',
      headers: {
        'x-signature': signature,
        'content-type': 'application/json'
      },
      payload: rawPayload
    });
    expect(res2.statusCode).toBe(200);
    expect(JSON.parse(res2.body).status).toBe('ALREADY_PROCESSED');
  });

  it('4. should process multiple distinct refund events for the same order without collapsing them', async () => {
    // Partial refund #1: $5.00
    const refund1 = JSON.stringify({
      meta: { event_name: 'order_refunded' },
      data: {
        id: 'ord_multi_refund_99',
        attributes: {
          total: 1900,
          refunded: true,
          refunded_amount: 500, // $5.00
          updated_at: '2026-11-07T10:00:00.000Z'
        }
      }
    });

    const hmac1 = crypto.createHmac('sha256', TEST_SECRET);
    const sig1 = hmac1.update(refund1).digest('hex');

    const resRefund1 = await app.inject({
      method: 'POST',
      url: '/api/ceo/storefront/webhooks/lemonsqueezy',
      headers: { 'x-signature': sig1, 'content-type': 'application/json' },
      payload: refund1
    });
    expect(resRefund1.statusCode).toBe(200);
    expect(JSON.parse(resRefund1.body).status).toBe('PROCESSED');

    // Partial refund #2: Additional $14.00 (distinct timestamp & amount)
    const refund2 = JSON.stringify({
      meta: { event_name: 'order_refunded' },
      data: {
        id: 'ord_multi_refund_99',
        attributes: {
          total: 1900,
          refunded: true,
          refunded_amount: 1400, // $14.00
          updated_at: '2026-11-07T12:00:00.000Z'
        }
      }
    });

    const hmac2 = crypto.createHmac('sha256', TEST_SECRET);
    const sig2 = hmac2.update(refund2).digest('hex');

    const resRefund2 = await app.inject({
      method: 'POST',
      url: '/api/ceo/storefront/webhooks/lemonsqueezy',
      headers: { 'x-signature': sig2, 'content-type': 'application/json' },
      payload: refund2
    });
    expect(resRefund2.statusCode).toBe(200);
    // Verified that refund #2 was NOT collapsed or rejected as a duplicate of refund #1
    expect(JSON.parse(resRefund2.body).status).toBe('PROCESSED');
  });

  it('5. should ignore test-mode orders from confirmed revenue telemetry', async () => {
    const testOrderPayload = JSON.stringify({
      meta: { event_name: 'order_created' },
      data: {
        id: 'ord_test_mode_simulation_77',
        attributes: {
          total: 1900,
          test_mode: true, // Lemon Squeezy test mode flag
          currency: 'USD',
          user_email: 'testbuyer@example.com'
        }
      }
    });

    const hmac = crypto.createHmac('sha256', TEST_SECRET);
    const sig = hmac.update(testOrderPayload).digest('hex');

    const res = await app.inject({
      method: 'POST',
      url: '/api/ceo/storefront/webhooks/lemonsqueezy',
      headers: { 'x-signature': sig, 'content-type': 'application/json' },
      payload: testOrderPayload
    });

    expect(res.statusCode).toBe(200);

    const storefrontRepo = new StorefrontRepository(db);
    const logged = await storefrontRepo.getWebhookEventById('ls_evt_ord_test_mode_simulation_77_order_created');
    expect(logged).not.toBeNull();
    expect(logged?.isTest).toBe(true);

    // Verify revenue repo did not record test order into live accounting
    const revenueRepo = new RevenueRepository(db);
    const testTx = await (db.collection('revenue_transactions')).findOne({ externalReference: 'ord_test_mode_simulation_77' });
    expect(testTx).toBeNull(); // Strictly verified: test order excluded from transactions collection
  });
});
