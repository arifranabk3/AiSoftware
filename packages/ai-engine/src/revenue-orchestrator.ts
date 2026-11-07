import {
  MonetizationChannel,
  RevenueOpportunity,
  RevenueOpportunityStatus,
  DailyExecutionPlan,
  DepartmentId
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
  }
}

export const revenueOrchestrator = RevenueOrchestrator.getInstance();
