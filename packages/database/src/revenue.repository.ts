import { Db, Collection } from 'mongodb';
import {
  MonetizationChannel,
  RevenueOpportunity,
  ChannelPerformanceMetrics,
  DailyExecutionPlan,
  RevenueTransaction,
  ChannelExecutionAsset,
  ContentLifecycleState
} from '@ai-command-center/shared';

export class RevenueRepository {
  private opportunitiesColl: Collection<RevenueOpportunity>;
  private plansColl: Collection<DailyExecutionPlan>;
  private transactionsColl: Collection<RevenueTransaction>;
  private channelAssetsColl: Collection<ChannelExecutionAsset>;

  constructor(private db: Db) {
    this.opportunitiesColl = db.collection<RevenueOpportunity>('revenue_opportunities');
    this.plansColl = db.collection<DailyExecutionPlan>('daily_execution_plans');
    this.transactionsColl = db.collection<RevenueTransaction>('revenue_transactions');
    this.channelAssetsColl = db.collection<ChannelExecutionAsset>('channel_execution_assets');
  }

  // --- Channel Execution Assets ---
  public async upsertChannelAsset(asset: ChannelExecutionAsset): Promise<ChannelExecutionAsset> {
    await this.channelAssetsColl.updateOne(
      { assetId: asset.assetId },
      { $set: { ...asset, _id: asset.assetId as any } },
      { upsert: true }
    );
    return asset;
  }

  public async getChannelAssetById(assetId: string): Promise<ChannelExecutionAsset | null> {
    const doc = await this.channelAssetsColl.findOne({ assetId });
    if (!doc) return null;
    const { _id, ...rest } = doc as any;
    return rest as ChannelExecutionAsset;
  }

  public async listChannelAssets(filter: Partial<ChannelExecutionAsset> = {}): Promise<ChannelExecutionAsset[]> {
    const docs = await this.channelAssetsColl.find(filter).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => {
      const { _id, ...rest } = doc as any;
      return rest as ChannelExecutionAsset;
    });
  }

  // --- Opportunities ---
  public async upsertOpportunity(opp: RevenueOpportunity): Promise<RevenueOpportunity> {
    await this.opportunitiesColl.updateOne(
      { opportunityId: opp.opportunityId },
      { $set: { ...opp, _id: opp.opportunityId as any } },
      { upsert: true }
    );
    return opp;
  }

  public async findOpportunityById(opportunityId: string): Promise<RevenueOpportunity | null> {
    const doc = await this.opportunitiesColl.findOne({ opportunityId });
    if (!doc) return null;
    const { _id, ...rest } = doc as any;
    return rest as RevenueOpportunity;
  }

  public async listOpportunities(filter: Partial<RevenueOpportunity> = {}): Promise<RevenueOpportunity[]> {
    const docs = await this.opportunitiesColl.find(filter).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => {
      const { _id, ...rest } = doc as any;
      return rest as RevenueOpportunity;
    });
  }

  // --- Execution Plans ---
  public async saveExecutionPlan(plan: DailyExecutionPlan): Promise<DailyExecutionPlan> {
    await this.plansColl.updateOne(
      { planId: plan.planId },
      { $set: { ...plan, _id: plan.planId as any } },
      { upsert: true }
    );
    return plan;
  }

  public async getLatestExecutionPlan(): Promise<DailyExecutionPlan | null> {
    const doc = await this.plansColl.find().sort({ generatedAt: -1 }).limit(1).next();
    if (!doc) return null;
    const { _id, ...rest } = doc as any;
    return rest as DailyExecutionPlan;
  }

  // --- Transactions ---
  public async recordTransaction(tx: RevenueTransaction): Promise<RevenueTransaction> {
    await this.transactionsColl.updateOne(
      { transactionId: tx.transactionId },
      { $set: { ...tx, _id: tx.transactionId as any } },
      { upsert: true }
    );
    return tx;
  }

  // --- Performance Metrics Summary ---
  public async getChannelMetrics(channel: MonetizationChannel): Promise<ChannelPerformanceMetrics> {
    const opps = await this.opportunitiesColl.find({ channel }).toArray();
    const txs = await this.transactionsColl.find({ channel }).toArray();

    const publishedAssets = opps.filter((o) => o.status === 'PUBLISHED').length;
    const pendingApprovals = opps.filter((o) => o.status === 'AWAITING_APPROVAL').length;

    let grossAmount = 0;
    let feeAmount = 0;
    let netAmount = 0;
    let pendingAmount = 0;
    let confirmedAmount = 0;
    let receivedAmount = 0;
    let refundAmount = 0;

    for (const tx of txs) {
      if (tx.status === 'REFUNDED') {
        refundAmount += tx.grossAmountUSD;
      } else {
        grossAmount += tx.grossAmountUSD;
        feeAmount += tx.feeUSD;
        netAmount += tx.netAmountUSD;

        if (tx.status === 'PENDING') pendingAmount += tx.netAmountUSD;
        if (tx.status === 'CONFIRMED') confirmedAmount += tx.netAmountUSD;
        if (tx.status === 'PAID_OUT') receivedAmount += tx.netAmountUSD;
      }
    }

    return {
      channel,
      identifiedOpportunities: opps.length,
      publishedAssets,
      pendingApprovals,
      views: 0,
      clicks: 0,
      conversions: txs.length,
      estimatedRevenueUSD: 0,
      pendingRevenueUSD: pendingAmount,
      confirmedRevenueUSD: confirmedAmount,
      receivedPaymentsUSD: receivedAmount,
      refundsUSD: refundAmount,
      expensesUSD: 0,
      netRevenueUSD: netAmount - refundAmount
    };
  }

  public async getAllChannelMetrics(): Promise<ChannelPerformanceMetrics[]> {
    const channels = [
      MonetizationChannel.YOUTUBE,
      MonetizationChannel.AFFILIATE,
      MonetizationChannel.SEO_PUBLISHING,
      MonetizationChannel.DIGITAL_PRODUCT
    ];
    return Promise.all(channels.map((ch) => this.getChannelMetrics(ch)));
  }
}
