import { Db, Collection } from 'mongodb';
import { z } from 'zod';

export enum StorefrontPlatform {
  LEMON_SQUEEZY = 'LEMON_SQUEEZY',
  GUMROAD = 'GUMROAD'
}

export enum StorefrontStatus {
  AWAITING_ACCOUNT_CREATION = 'AWAITING_ACCOUNT_CREATION',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',
  DRAFT_STAGED = 'DRAFT_STAGED',
  PUBLISHED_LIVE = 'PUBLISHED_LIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface StorefrontListing {
  storefrontId: string;
  platform: StorefrontPlatform;
  status: StorefrontStatus;
  productName: string;
  productUrl?: string;
  priceUSD: number;
  launchDiscountCode?: string;
  views: number;
  visitors: number;
  checkoutAttempts: number;
  confirmedOrders: number;
  refunds: number;
  grossRevenueUSD: number;
  feesUSD: number;
  netRevenueUSD: number;
  payoutStatus: 'UNCONFIGURED' | 'PENDING_THRESHOLD' | 'IN_TRANSIT' | 'PAID_OUT';
  verifiedPayoutAmountUSD: number;
  lastAuditedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const StorefrontListingSchema = z.object({
  storefrontId: z.string().min(1),
  platform: z.nativeEnum(StorefrontPlatform),
  status: z.nativeEnum(StorefrontStatus),
  productName: z.string().min(1),
  productUrl: z.string().url().optional(),
  priceUSD: z.number().min(0),
  launchDiscountCode: z.string().optional(),
  views: z.number().int().min(0),
  visitors: z.number().int().min(0),
  checkoutAttempts: z.number().int().min(0),
  confirmedOrders: z.number().int().min(0),
  refunds: z.number().int().min(0),
  grossRevenueUSD: z.number().min(0),
  feesUSD: z.number().min(0),
  netRevenueUSD: z.number().min(0),
  payoutStatus: z.enum(['UNCONFIGURED', 'PENDING_THRESHOLD', 'IN_TRANSIT', 'PAID_OUT']),
  verifiedPayoutAmountUSD: z.number().min(0),
  lastAuditedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export interface WebhookEventRecord {
  eventId: string;
  source: 'LEMON_SQUEEZY' | 'GUMROAD';
  eventName: string;
  externalOrderId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REFUNDED' | 'FAILED';
  grossAmountUSD: number;
  feeUSD: number;
  netAmountUSD: number;
  currency: string;
  customerEmailMasked?: string;
  isTest: boolean;
  receivedAt: string;
  processedAt?: string;
}

export class StorefrontRepository {
  private collection: Collection<StorefrontListing>;
  private webhookEventsColl: Collection<WebhookEventRecord>;

  constructor(private db: Db) {
    this.collection = db.collection<StorefrontListing>('storefront_listings');
    this.webhookEventsColl = db.collection<WebhookEventRecord>('storefront_webhook_events');
  }

  // --- Webhook Events Idempotency & Persistence ---
  public async recordWebhookEvent(event: WebhookEventRecord): Promise<{ isDuplicate: boolean; event: WebhookEventRecord }> {
    const existing = await this.webhookEventsColl.findOne({ eventId: event.eventId });
    if (existing) {
      const { _id, ...rest } = existing as any;
      return { isDuplicate: true, event: rest as WebhookEventRecord };
    }

    await this.webhookEventsColl.insertOne({ ...event, _id: event.eventId as any });
    return { isDuplicate: false, event };
  }

  public async getWebhookEventById(eventId: string): Promise<WebhookEventRecord | null> {
    const doc = await this.webhookEventsColl.findOne({ eventId });
    if (!doc) return null;
    const { _id, ...rest } = doc as any;
    return rest as WebhookEventRecord;
  }

  public async listWebhookEvents(filter: Partial<WebhookEventRecord> = {}): Promise<WebhookEventRecord[]> {
    const docs = await this.webhookEventsColl.find(filter).sort({ receivedAt: -1 }).toArray();
    return docs.map((doc) => {
      const { _id, ...rest } = doc as any;
      return rest as WebhookEventRecord;
    });
  }

  public async upsertListing(listing: StorefrontListing): Promise<StorefrontListing> {
    await this.collection.updateOne(
      { storefrontId: listing.storefrontId },
      { $set: { ...listing, _id: listing.storefrontId as any } },
      { upsert: true }
    );
    return listing;
  }

  public async getListingById(storefrontId: string): Promise<StorefrontListing | null> {
    const doc = await this.collection.findOne({ storefrontId });
    if (!doc) return null;
    const { _id, ...rest } = doc as any;
    return rest as StorefrontListing;
  }

  public async listAll(): Promise<StorefrontListing[]> {
    const docs = await this.collection.find().sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => {
      const { _id, ...rest } = doc as any;
      return rest as StorefrontListing;
    });
  }

  public async getSummaryTelemetry(): Promise<{
    totalViews: number;
    totalVisitors: number;
    totalCheckoutAttempts: number;
    totalConfirmedOrders: number;
    totalRefunds: number;
    totalNetRevenueUSD: number;
    verifiedPayoutsUSD: number;
  }> {
    const listings = await this.listAll();
    return listings.reduce(
      (acc, l) => ({
        totalViews: acc.totalViews + l.views,
        totalVisitors: acc.totalVisitors + l.visitors,
        totalCheckoutAttempts: acc.totalCheckoutAttempts + l.checkoutAttempts,
        totalConfirmedOrders: acc.totalConfirmedOrders + l.confirmedOrders,
        totalRefunds: acc.totalRefunds + l.refunds,
        totalNetRevenueUSD: acc.totalNetRevenueUSD + l.netRevenueUSD,
        verifiedPayoutsUSD: acc.verifiedPayoutsUSD + l.verifiedPayoutAmountUSD
      }),
      {
        totalViews: 0,
        totalVisitors: 0,
        totalCheckoutAttempts: 0,
        totalConfirmedOrders: 0,
        totalRefunds: 0,
        totalNetRevenueUSD: 0,
        verifiedPayoutsUSD: 0
      }
    );
  }
}
