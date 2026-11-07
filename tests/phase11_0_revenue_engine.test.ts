import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import {
  mongoDbService,
  initializeDatabaseIndexes,
  RevenueRepository
} from '@ai-command-center/database';
import {
  MonetizationChannel,
  RevenueOpportunityStatus,
  RevenueOpportunity,
  DepartmentId
} from '@ai-command-center/shared';
import { revenueOrchestrator } from '@ai-command-center/ai-engine';

describe('Phase 11.0 — Revenue Orchestrator & Multi-Channel Monetization Suite', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let revenueRepo: RevenueRepository;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test_phase11_0_revenue');

    await mongoDbService.connect(uri, 'test_phase11_0_revenue');
    await initializeDatabaseIndexes(uri, 'test_phase11_0_revenue');

    revenueRepo = new RevenueRepository(db);
  }, 30000);

  afterAll(async () => {
    await client.close();
    await mongoDbService.disconnect();
    await mongod.stop();
  });

  describe('1. Revenue Opportunity Ranking Engine', () => {
    it('should rank opportunities based on demand potential and effort score', () => {
      const opps: RevenueOpportunity[] = [
        {
          opportunityId: 'opp_yt_01',
          channel: MonetizationChannel.YOUTUBE,
          title: 'YouTube AI Agent Architecture Tutorial',
          targetAudience: 'Developers',
          effortScore: 3,
          costUSD: 0,
          demandEvidence: 'High search interest on local LLMs',
          estimatedRevenuePotential: 'MEDIUM',
          targetDepartment: DepartmentId.PRODUCT_MARKETING,
          assignedSpecialistId: 'spec_content_strategist',
          status: RevenueOpportunityStatus.IDENTIFIED,
          approvalRequired: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          opportunityId: 'opp_dig_01',
          channel: MonetizationChannel.DIGITAL_PRODUCT,
          title: 'Zero-Cost Autonomous Agency Blueprint Ebook',
          targetAudience: 'Agency founders',
          effortScore: 2,
          costUSD: 0,
          demandEvidence: 'Agency owners seeking operational leverage',
          estimatedRevenuePotential: 'HIGH',
          targetDepartment: DepartmentId.PRODUCT_MARKETING,
          assignedSpecialistId: 'spec_copywriter',
          status: RevenueOpportunityStatus.IDENTIFIED,
          approvalRequired: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const ranked = revenueOrchestrator.rankOpportunities(opps);
      expect(ranked.length).toBe(2);
      expect(ranked[0].opportunityId).toBe('opp_dig_01'); // High demand, lower effort
      expect(ranked[1].opportunityId).toBe('opp_yt_01');
    });

    it('should generate a structured daily execution plan allocating channel weights', () => {
      const opps: RevenueOpportunity[] = [
        {
          opportunityId: 'opp_dig_01',
          channel: MonetizationChannel.DIGITAL_PRODUCT,
          title: 'Digital Product Blueprint',
          targetAudience: 'Agencies',
          effortScore: 2,
          costUSD: 0,
          demandEvidence: 'Verified demand',
          estimatedRevenuePotential: 'HIGH',
          targetDepartment: DepartmentId.PRODUCT_MARKETING,
          assignedSpecialistId: 'spec_copywriter',
          status: RevenueOpportunityStatus.IDENTIFIED,
          approvalRequired: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          opportunityId: 'opp_aff_01',
          channel: MonetizationChannel.AFFILIATE,
          title: 'Cloud VPS Comparison Review',
          targetAudience: 'Self-hosters',
          effortScore: 2,
          costUSD: 0,
          demandEvidence: 'Verified demand',
          estimatedRevenuePotential: 'MEDIUM',
          targetDepartment: DepartmentId.PRODUCT_MARKETING,
          assignedSpecialistId: 'spec_affiliate_manager',
          status: RevenueOpportunityStatus.IDENTIFIED,
          approvalRequired: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const plan = revenueOrchestrator.generateDailyPlan('2026-11-08', opps);
      expect(plan.planId).toBe('PLAN-20261108-001');
      expect(plan.targetChannels.length).toBe(4);
      expect(plan.scheduledTasks.length).toBe(2);
      expect(plan.priorityRankings[0].channel).toBe(MonetizationChannel.DIGITAL_PRODUCT);
      expect(plan.priorityRankings[0].recommendedWeight).toBe(35);
    });
  });

  describe('2. Revenue Repository & Strict Zero Financial Baseline', () => {
    it('should default all actual revenue metrics to zero when no transactions exist', async () => {
      const metrics = await revenueRepo.getAllChannelMetrics();
      expect(metrics.length).toBe(4);

      for (const m of metrics) {
        expect(m.confirmedRevenueUSD).toBe(0);
        expect(m.receivedPaymentsUSD).toBe(0);
        expect(m.pendingRevenueUSD).toBe(0);
        expect(m.netRevenueUSD).toBe(0);
        expect(m.expensesUSD).toBe(0);
        expect(m.refundsUSD).toBe(0);
      }
    });

    it('should record verified transactions and accurately reflect net confirmed earnings', async () => {
      await revenueRepo.recordTransaction({
        transactionId: 'tx_gumroad_101',
        channel: MonetizationChannel.DIGITAL_PRODUCT,
        grossAmountUSD: 27.0,
        feeUSD: 2.7,
        netAmountUSD: 24.3,
        status: 'CONFIRMED',
        source: 'Gumroad',
        occurredAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString()
      });

      const digitalMetrics = await revenueRepo.getChannelMetrics(MonetizationChannel.DIGITAL_PRODUCT);
      expect(digitalMetrics.conversions).toBe(1);
      expect(digitalMetrics.confirmedRevenueUSD).toBe(24.3);
      expect(digitalMetrics.netRevenueUSD).toBe(24.3);

      const ytMetrics = await revenueRepo.getChannelMetrics(MonetizationChannel.YOUTUBE);
      expect(ytMetrics.conversions).toBe(0);
      expect(ytMetrics.netRevenueUSD).toBe(0);
    });
  });
});
