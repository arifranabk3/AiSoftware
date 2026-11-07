import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import {
  StorefrontRepository,
  StorefrontPlatform,
  StorefrontStatus,
  StorefrontListing
} from '../packages/database/src/storefront.repository.js';

describe('Phase 11.3 — Storefront Repository & Launch Tracking Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let repo: StorefrontRepository;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    client = new MongoClient(mongod.getUri());
    await client.connect();
    db = client.db('test_storefront');
    repo = new StorefrontRepository(db);
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });

  it('1. should save and retrieve a primary Lemon Squeezy storefront listing', async () => {
    const listing: StorefrontListing = {
      storefrontId: 'SF-LS-001',
      platform: StorefrontPlatform.LEMON_SQUEEZY,
      status: StorefrontStatus.AWAITING_ACCOUNT_CREATION,
      productName: 'The Zero-Cost Autonomous Agency Blueprint',
      productUrl: undefined,
      priceUSD: 19.00,
      launchDiscountCode: 'SOVEREIGN',
      views: 0,
      visitors: 0,
      checkoutAttempts: 0,
      confirmedOrders: 0,
      refunds: 0,
      grossRevenueUSD: 0,
      feesUSD: 0,
      netRevenueUSD: 0,
      payoutStatus: 'UNCONFIGURED',
      verifiedPayoutAmountUSD: 0,
      lastAuditedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await repo.upsertListing(listing);
    expect(saved.storefrontId).toBe('SF-LS-001');

    const retrieved = await repo.getListingById('SF-LS-001');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.platform).toBe(StorefrontPlatform.LEMON_SQUEEZY);
    expect(retrieved?.priceUSD).toBe(19.00);
    expect(retrieved?.status).toBe(StorefrontStatus.AWAITING_ACCOUNT_CREATION);
    expect(retrieved?.netRevenueUSD).toBe(0);
  });

  it('2. should save a backup Gumroad storefront listing and calculate summary telemetry', async () => {
    const gumroadListing: StorefrontListing = {
      storefrontId: 'SF-GUM-001',
      platform: StorefrontPlatform.GUMROAD,
      status: StorefrontStatus.AWAITING_ACCOUNT_CREATION,
      productName: 'The Zero-Cost Autonomous Agency Blueprint (Backup)',
      productUrl: undefined,
      priceUSD: 19.00,
      launchDiscountCode: 'SOVEREIGN',
      views: 0,
      visitors: 0,
      checkoutAttempts: 0,
      confirmedOrders: 0,
      refunds: 0,
      grossRevenueUSD: 0,
      feesUSD: 0,
      netRevenueUSD: 0,
      payoutStatus: 'UNCONFIGURED',
      verifiedPayoutAmountUSD: 0,
      lastAuditedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await repo.upsertListing(gumroadListing);

    const all = await repo.listAll();
    expect(all.length).toBe(2);

    const summary = await repo.getSummaryTelemetry();
    expect(summary.totalViews).toBe(0);
    expect(summary.totalVisitors).toBe(0);
    expect(summary.totalConfirmedOrders).toBe(0);
    expect(summary.totalNetRevenueUSD).toBe(0);
    expect(summary.verifiedPayoutsUSD).toBe(0);
  });

  it('3. should update telemetry accurately when verified orders occur', async () => {
    const updated: StorefrontListing = {
      storefrontId: 'SF-LS-001',
      platform: StorefrontPlatform.LEMON_SQUEEZY,
      status: StorefrontStatus.PUBLISHED_LIVE,
      productName: 'The Zero-Cost Autonomous Agency Blueprint',
      productUrl: 'https://sovereign.lemonsqueezy.com/buy/blueprint',
      priceUSD: 19.00,
      launchDiscountCode: 'SOVEREIGN',
      views: 142,
      visitors: 98,
      checkoutAttempts: 5,
      confirmedOrders: 2,
      refunds: 0,
      grossRevenueUSD: 38.00,
      feesUSD: 2.90, // (5% of 38 = 1.90) + ($0.50 * 2 = 1.00) = 2.90
      netRevenueUSD: 35.10,
      payoutStatus: 'PENDING_THRESHOLD',
      verifiedPayoutAmountUSD: 0,
      lastAuditedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await repo.upsertListing(updated);

    const retrieved = await repo.getListingById('SF-LS-001');
    expect(retrieved?.confirmedOrders).toBe(2);
    expect(retrieved?.netRevenueUSD).toBe(35.10);
    expect(retrieved?.status).toBe(StorefrontStatus.PUBLISHED_LIVE);

    const summary = await repo.getSummaryTelemetry();
    expect(summary.totalViews).toBe(142);
    expect(summary.totalConfirmedOrders).toBe(2);
    expect(summary.totalNetRevenueUSD).toBe(35.10);
  });
});
