/**
 * Plan contracts. Limits are never hardcoded in application code — they are
 * read from the Plan table so marketing can change them without a release.
 * This schema describes what that table returns over the API.
 */
import { z } from 'zod';
import { priceKopSchema } from './primitives';

export const planCodeSchema = z.enum(['FREE', 'PREMIUM', 'BUSINESS']);
export type PlanCode = z.infer<typeof planCodeSchema>;

/** null means unlimited, which is deliberately different from 0. */
const limitSchema = z.int().min(0).nullable();

export const planSchema = z.object({
  code: planCodeSchema,
  name: z.string(),
  priceKop: priceKopSchema,
  activeListingsLimit: limitSchema,
  aiGenerationsPerMonth: limitSchema,
  hasSellerAdvice: z.boolean(),
  hasAdvancedStats: z.boolean(),
  hasCompetitorAnalysis: z.boolean(),
  hasShopPage: z.boolean(),
  hasBulkImport: z.boolean(),
  hasAiReplies: z.boolean(),
});
export type Plan = z.infer<typeof planSchema>;
