import {
  MonetizationChannel,
  RevenueOpportunity,
  RevenueOpportunityStatus,
  DailyExecutionPlan,
  DepartmentId,
  ChannelExecutionAsset,
  ContentLifecycleState,
  AffiliateProgramStatus
} from '@ai-command-center/shared';
import { RevenueRepository, mongoDbService } from '@ai-command-center/database';

export class RevenueOrchestrator {
  private static instance: RevenueOrchestrator;

  private constructor() {}

  public static getInstance(): RevenueOrchestrator {
    if (!RevenueOrchestrator.instance) {
      RevenueOrchestrator.instance = new RevenueOrchestrator();
    }
    return RevenueOrchestrator.instance;
  }

  /**
   * Initializes or returns the standard operational asset catalog across all four channels.
   * Every channel has defined artifacts, lifecycle states, explicit blockers, and next actions.
   */
  public getInitialOperationalAssets(): ChannelExecutionAsset[] {
    const now = new Date().toISOString();
    return [
      // Channel 1: Digital Product
      {
        assetId: 'ASSET-DIGPROD-001',
        channel: MonetizationChannel.DIGITAL_PRODUCT,
        title: 'The Zero-Cost Autonomous Agency Blueprint (15-Chapter Master Guide)',
        lifecycleState: ContentLifecycleState.APPROVED,
        filePath: 'deliverables/products/zero-cost-agency-blueprint/final/zero-cost-autonomous-agency-blueprint-v1.0.pdf',
        blockerReason: 'Awaiting owner manual seller account creation on Lemon Squeezy and live URL publication.',
        nextRequiredAction: 'Owner logs into Lemon Squeezy, inputs Pakistan bank IBAN, uploads PDF, and publishes listing.',
        metrics: { views: 0, clicks: 0, confirmedOrders: 0, grossRevenueUSD: 0, netRevenueUSD: 0 },
        createdAt: now,
        updatedAt: now
      },
      // Channel 2: SEO Publishing
      {
        assetId: 'ASSET-SEO-001',
        channel: MonetizationChannel.SEO_PUBLISHING,
        title: 'How We Built a 7-Department Autonomous AI Agency with Fastify, BullMQ & Local LLMs ($0 Token Bills)',
        targetKeywords: ['autonomous ai agency', 'local llm engineering', 'bullmq fastify ai', 'zero cost ai infrastructure'],
        lifecycleState: ContentLifecycleState.APPROVED,
        filePath: 'deliverables/revenue/MKT-2026-REV-001/seo/seo_pillar_open_source_ai_ops.md',
        blockerReason: 'Awaiting owner manual copy-paste and publication on Dev.to and Medium.',
        nextRequiredAction: 'Owner publishes article to Dev.to and Medium with backlink to digital product storefront.',
        metrics: { views: 0, clicks: 0, confirmedOrders: 0, grossRevenueUSD: 0, netRevenueUSD: 0 },
        createdAt: now,
        updatedAt: now
      },
      // Channel 3: YouTube Content
      {
        assetId: 'ASSET-YT-001',
        channel: MonetizationChannel.YOUTUBE,
        title: 'Zero-Cost Autonomous AI Agency: Fastify + BullMQ + Ollama Architecture (Full Walkthrough)',
        lifecycleState: ContentLifecycleState.APPROVED,
        filePath: 'deliverables/revenue/MKT-2026-REV-001/youtube/full_production_script.md',
        blockerReason: 'Video narration and screen recording require owner recording using free OBS Studio / Loom.',
        nextRequiredAction: 'Owner records screen walkthrough of Ollama and GYB UI using staged teleprompter script.',
        metrics: { views: 0, clicks: 0, confirmedOrders: 0, grossRevenueUSD: 0, netRevenueUSD: 0 },
        createdAt: now,
        updatedAt: now
      },
      // Channel 4: Affiliate Marketing
      {
        assetId: 'ASSET-AFF-001',
        channel: MonetizationChannel.AFFILIATE,
        title: 'Zero-Dollar Cloud Infrastructure Matrix (DigitalOcean & Hetzner Free Credits)',
        lifecycleState: ContentLifecycleState.DRAFT,
        filePath: 'deliverables/revenue/MKT-2026-REV-001/affiliate/ethical_disclosure_guidelines.md',
        blockerReason: 'Content remains in DRAFT until owner applies for and receives verified referral/affiliate links.',
        nextRequiredAction: 'Owner applies for free developer cloud referral programs and replaces link placeholders.',
        affiliateProgram: {
          programName: 'DigitalOcean Referral Program',
          officialUrl: 'https://www.digitalocean.com/referral-program',
          commissionStructure: '$25 credit or cash bonus per paying referral ($200 60-day credit for referee)',
          status: AffiliateProgramStatus.RESEARCHED
        },
        metrics: { views: 0, clicks: 0, confirmedOrders: 0, grossRevenueUSD: 0, netRevenueUSD: 0 },
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  /**
   * Evaluates opportunities across the 4 zero-cost channels and ranks them.
   * Ranking formula: (Demand Score [1-3] * 3) / (Effort Score [1-5])
   */
  public rankOpportunities(opportunities: RevenueOpportunity[]): RevenueOpportunity[] {
    const demandWeight = { LOW: 1, MEDIUM: 2, HIGH: 3 };

    return [...opportunities].sort((a, b) => {
      const scoreA = (demandWeight[a.estimatedRevenuePotential] * 3) / a.effortScore;
      const scoreB = (demandWeight[b.estimatedRevenuePotential] * 3) / b.effortScore;
      return scoreB - scoreA;
    });
  }

  /**
   * Generates a concrete daily execution plan allocating effort across channels.
   */
  public generateDailyPlan(date: string, opportunities: RevenueOpportunity[]): DailyExecutionPlan {
    const ranked = this.rankOpportunities(opportunities);

    // Effort allocation based on ranking and minimum human interaction
    const channelWeights: Record<MonetizationChannel, number> = {
      [MonetizationChannel.DIGITAL_PRODUCT]: 35, // High leverage, one-time creation
      [MonetizationChannel.AFFILIATE]: 25, // Recurring commissions, zero fulfillment
      [MonetizationChannel.YOUTUBE]: 25, // Strong organic reach, evergreen
      [MonetizationChannel.SEO_PUBLISHING]: 15 // Long-tail compounding
    };

    const scheduledTasks = ranked.slice(0, 7).map((opp, index) => {
      let deliverableFile = '';
      switch (opp.channel) {
        case MonetizationChannel.YOUTUBE:
          deliverableFile = 'youtube_video_package_01.md';
          break;
        case MonetizationChannel.AFFILIATE:
          deliverableFile = 'affiliate_content_package_01.md';
          break;
        case MonetizationChannel.SEO_PUBLISHING:
          deliverableFile = 'seo_publishable_article_01.md';
          break;
        case MonetizationChannel.DIGITAL_PRODUCT:
          deliverableFile = 'digital_product_launch_package_01.md';
          break;
      }

      return {
        taskId: `REV-TSK-${String(index + 1).padStart(2, '0')}`,
        opportunityId: opp.opportunityId,
        channel: opp.channel,
        title: opp.title,
        assignedSpecialistId: opp.assignedSpecialistId,
        departmentId: opp.targetDepartment,
        deliverableFile,
        requiresApproval: opp.approvalRequired
      };
    });

    return {
      planId: `PLAN-${date.replace(/-/g, '')}-001`,
      date,
      targetChannels: [
        MonetizationChannel.DIGITAL_PRODUCT,
        MonetizationChannel.AFFILIATE,
        MonetizationChannel.YOUTUBE,
        MonetizationChannel.SEO_PUBLISHING
      ],
      priorityRankings: [
        {
          channel: MonetizationChannel.DIGITAL_PRODUCT,
          rank: 1,
          recommendedWeight: channelWeights[MonetizationChannel.DIGITAL_PRODUCT],
          rationale: 'Highest profit margin, instant ownership, zero external approval required to package.'
        },
        {
          channel: MonetizationChannel.AFFILIATE,
          rank: 2,
          recommendedWeight: channelWeights[MonetizationChannel.AFFILIATE],
          rationale: 'Monetizes existing high-intent buyer searches with zero customer support overhead.'
        },
        {
          channel: MonetizationChannel.YOUTUBE,
          rank: 3,
          recommendedWeight: channelWeights[MonetizationChannel.YOUTUBE],
          rationale: 'Evergreen search and discovery engine for developer tooling.'
        },
        {
          channel: MonetizationChannel.SEO_PUBLISHING,
          rank: 4,
          recommendedWeight: channelWeights[MonetizationChannel.SEO_PUBLISHING],
          rationale: 'Long-term organic compounding for high-intent search queries.'
        }
      ],
      scheduledTasks,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Persists opportunities and generated plan into database.
   */
  public async persistPlanAndOpportunities(plan: DailyExecutionPlan, opps: RevenueOpportunity[]): Promise<void> {
    if (!mongoDbService.getStatus().isConnected) return;
    const db = mongoDbService.getDb();
    const repo = new RevenueRepository(db);

    for (const opp of opps) {
      await repo.upsertOpportunity(opp);
    }
    await repo.saveExecutionPlan(plan);

    // Also sync the four core channel execution assets
    const assets = this.getInitialOperationalAssets();
    for (const asset of assets) {
      await repo.upsertChannelAsset(asset);
    }
  }
}

export const revenueOrchestrator = RevenueOrchestrator.getInstance();
