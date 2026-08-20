/**
 * Seller dashboard contracts. Mirrors SellerStats in openapi.yaml plus the
 * listing rows the account area lists.
 */
import { z } from 'zod';
import { priceKopSchema } from './primitives';
import { listingStatusSchema } from './listing';
import { promotionTierSchema } from './promotion';

export const statsPointSchema = z.object({
  date: z.iso.date(),
  views: z.int().min(0),
  contacts: z.int().min(0),
});
export type StatsPoint = z.infer<typeof statsPointSchema>;

export const sellerStatsSchema = z.object({
  activeListings: z.int().min(0),
  totalViews: z.int().min(0),
  totalContacts: z.int().min(0),
  soldCount: z.int().min(0),
  avgSellDays: z.number().nullable(),
  /** contacts ÷ views */
  conversionRate: z.number().min(0),
  /** Change against the previous period, in percent; null when there is nothing to compare. */
  viewsDeltaPercent: z.number().nullable(),
  contactsDeltaPercent: z.number().nullable(),
  series: z.array(statsPointSchema),
});
export type SellerStats = z.infer<typeof sellerStatsSchema>;

/** One row of «Мої оголошення». */
export const listingSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  priceKop: priceKopSchema,
  status: listingStatusSchema,
  viewsCount: z.int().min(0),
  contactsCount: z.int().min(0),
  publishedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  promotionTier: promotionTierSchema.nullable(),
  promotedUntil: z.iso.datetime().nullable(),
  /** Set when the advisor found something worth acting on. */
  needsAttention: z.boolean(),
  /** Stands in for the cover image until media upload exists. */
  coverEmoji: z.string(),
  aiGenerated: z.boolean(),
});
export type ListingSummary = z.infer<typeof listingSummarySchema>;
