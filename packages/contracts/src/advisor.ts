/**
 * AI Seller Advisor — «Чому не продається». Mirrors the SellerAdvice schema in
 * openapi.yaml.
 *
 * All five axes are scored by code: price against the market median, photo
 * count against the category, title and description completeness, seasonality.
 * The model only phrases the findings and orders them. `expectedEffect` comes
 * from platform statistics, never from a model's imagination.
 */
import { z } from 'zod';
import { priceKopSchema } from './primitives';
import { marketStatsSchema } from './ai-seller';

export const adviceAxisSchema = z.enum([
  'price',
  'photos',
  'description',
  'title',
  'timing',
]);
export type AdviceAxis = z.infer<typeof adviceAxisSchema>;

export const adviceSeveritySchema = z.enum(['high', 'medium', 'low']);
export type AdviceSeverity = z.infer<typeof adviceSeveritySchema>;

export const adviceActionTypeSchema = z.enum([
  'set_price',
  'add_photos',
  'rewrite_description',
  'rewrite_title',
  'wait',
  'promote',
]);
export type AdviceActionType = z.infer<typeof adviceActionTypeSchema>;

export const adviceActionSchema = z.object({
  id: z.string(),
  type: adviceActionTypeSchema,
  label: z.string(),
  payload: z.record(z.string(), z.unknown()),
});
export type AdviceAction = z.infer<typeof adviceActionSchema>;

export const adviceFindingSchema = z.object({
  axis: adviceAxisSchema,
  severity: adviceSeveritySchema,
  finding: z.string(),
  /** The numbers behind the sentence, so the UI can show the proof. */
  evidence: z.record(z.string(), z.unknown()),
  action: adviceActionSchema.nullable(),
  expectedEffect: z.string(),
});
export type AdviceFinding = z.infer<typeof adviceFindingSchema>;

export const sellerAdviceSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  healthScore: z.int().min(0).max(100),
  findings: z.array(adviceFindingSchema),
  /** true on FREE — only the score and one finding, without numbers or actions. */
  locked: z.boolean(),
  createdAt: z.iso.datetime(),
});
export type SellerAdvice = z.infer<typeof sellerAdviceSchema>;

/** Listing performance since publication — the reason the analysis is triggered. */
export const listingStatsSchema = z.object({
  daysSincePublished: z.int().min(0),
  viewsCount: z.int().min(0),
  impressionsCount: z.int().min(0),
  savesCount: z.int().min(0),
  contactsCount: z.int().min(0),
});
export type ListingStats = z.infer<typeof listingStatsSchema>;

/** Everything the diagnosis reads. Assembled by the API from the database. */
export const diagnoseInputSchema = z.object({
  listing: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    priceKop: priceKopSchema,
    categoryId: z.string(),
    categoryName: z.string(),
    attributes: z.record(z.string(), z.unknown()),
    photoCount: z.int().min(0),
    photoAngles: z.array(z.string()),
  }),
  stats: listingStatsSchema,
  market: marketStatsSchema,
  category: z.object({
    /** Median photo count among the fastest-selling listings in the category. */
    topPhotoCount: z.int().min(0),
    /** Attributes buyers filter by, most used first. */
    keyAttributes: z.array(z.object({ key: z.string(), label: z.string(), filterShare: z.number() })),
    /** Demand relative to the yearly average, 1 = normal. Seasonal goods swing hard. */
    seasonalityFactor: z.number(),
    seasonalityNote: z.string().nullable(),
  }),
});
export type DiagnoseInput = z.infer<typeof diagnoseInputSchema>;

/** Comparable listings around this one — the «position among similar» chart. */
export const pricePositionSchema = z.object({
  items: z.array(
    z.object({ label: z.string(), priceKop: priceKopSchema, isYours: z.boolean() }),
  ),
});
export type PricePosition = z.infer<typeof pricePositionSchema>;
