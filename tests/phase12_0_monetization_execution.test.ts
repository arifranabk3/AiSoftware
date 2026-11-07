import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../apps/api/src/server.js';
import {
  mongoDbService,
  RevenueRepository
} from '@ai-command-center/database';
import { revenueOrchestrator } from '@ai-command-center/ai-engine';
import {
  MonetizationChannel,
  ContentLifecycleState,
  AffiliateProgramStatus
} from '@ai-command-center/shared';

describe('Phase 12.0 — Four-Channel Autonomous Monetization Execution Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let app: FastifyInstance;
  let repo: RevenueRepository;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_phase12_monetization');

    await mongoDbService.connect(uri, 'test_phase12_monetization');
    repo = new RevenueRepository(db);

    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await client.close();
    await mongod.stop();
  });

  it('1. should initialize and persist operational assets across all 4 monetization channels', async () => {
    const assets = revenueOrchestrator.getInitialOperationalAssets();
    expect(assets.length).toBe(4);

    // Save all to database via RevenueRepository
    for (const asset of assets) {
      await repo.upsertChannelAsset(asset);
    }

    const persisted = await repo.listChannelAssets();
    expect(persisted.length).toBe(4);

    const channels = persisted.map((p) => p.channel);
    expect(channels).toContain(MonetizationChannel.DIGITAL_PRODUCT);
    expect(channels).toContain(MonetizationChannel.SEO_PUBLISHING);
    expect(channels).toContain(MonetizationChannel.YOUTUBE);
    expect(channels).toContain(MonetizationChannel.AFFILIATE);
  });

  it('2. should verify Channel 1 (Digital Product) is APPROVED with exact PDF file path and clear owner blocker', async () => {
    const digProd = await repo.getChannelAssetById('ASSET-DIGPROD-001');
    expect(digProd).not.toBeNull();
    expect(digProd?.lifecycleState).toBe(ContentLifecycleState.APPROVED);
    expect(digProd?.filePath).toBe('deliverables/products/zero-cost-agency-blueprint/final/zero-cost-autonomous-agency-blueprint-v1.0.pdf');
    expect(digProd?.blockerReason).toContain('Lemon Squeezy');
    expect(digProd?.metrics.confirmedOrders).toBe(0);
    expect(digProd?.metrics.netRevenueUSD).toBe(0);
  });

  it('3. should verify Channel 2 (SEO Publishing) has target keywords and explicit publication next step', async () => {
    const seoAsset = await repo.getChannelAssetById('ASSET-SEO-001');
    expect(seoAsset).not.toBeNull();
    expect(seoAsset?.channel).toBe(MonetizationChannel.SEO_PUBLISHING);
    expect(seoAsset?.targetKeywords).toContain('autonomous ai agency');
    expect(seoAsset?.targetKeywords?.length).toBeGreaterThanOrEqual(4);
    expect(seoAsset?.nextRequiredAction).toContain('Dev.to and Medium');
  });

  it('4. should verify Channel 3 (YouTube Content) requires human recording of verified script', async () => {
    const ytAsset = await repo.getChannelAssetById('ASSET-YT-001');
    expect(ytAsset).not.toBeNull();
    expect(ytAsset?.channel).toBe(MonetizationChannel.YOUTUBE);
    expect(ytAsset?.lifecycleState).toBe(ContentLifecycleState.APPROVED);
    expect(ytAsset?.blockerReason).toContain('owner recording');
    expect(ytAsset?.filePath).toContain('full_production_script.md');
  });

  it('5. should verify Channel 4 (Affiliate Marketing) is locked in DRAFT until real program approval', async () => {
    const affAsset = await repo.getChannelAssetById('ASSET-AFF-001');
    expect(affAsset).not.toBeNull();
    expect(affAsset?.channel).toBe(MonetizationChannel.AFFILIATE);
    expect(affAsset?.lifecycleState).toBe(ContentLifecycleState.DRAFT);
    expect(affAsset?.affiliateProgram?.status).toBe(AffiliateProgramStatus.RESEARCHED);
    expect(affAsset?.affiliateProgram?.officialUrl).toContain('digitalocean.com');
    // Crucial check: Affiliate link is undefined/unapproved; content must remain in DRAFT
    expect(affAsset?.affiliateProgram?.affiliateLink).toBeUndefined();
  });

  it('6. should generate daily execution plan prioritizing highest-leverage digital product channel', async () => {
    const plan = revenueOrchestrator.generateDailyPlan('2026-11-08', []);
    expect(plan.targetChannels.length).toBe(4);
    expect(plan.priorityRankings[0].channel).toBe(MonetizationChannel.DIGITAL_PRODUCT);
    expect(plan.priorityRankings[0].rank).toBe(1);
    expect(plan.priorityRankings[0].recommendedWeight).toBe(35);
  });
});
