/**
 * Listing contracts. Enum members mirror prisma/schema.prisma exactly — they
 * are the same strings on the wire, in the database and in the UI.
 */
import { z } from 'zod';
import {
  confidenceSchema,
  cuidSchema,
  paginationSchema,
  priceKopSchema,
} from './primitives';

export const listingStatusSchema = z.enum([
  'DRAFT',
  'PENDING_MODERATION',
  'ACTIVE',
  'REJECTED',
  'SOLD',
  'ARCHIVED',
  'EXPIRED',
]);
export type ListingStatus = z.infer<typeof listingStatusSchema>;

export const itemConditionSchema = z.enum([
  'NEW',
  'LIKE_NEW',
  'GOOD',
  'ACCEPTABLE',
  'FOR_PARTS',
]);
export type ItemCondition = z.infer<typeof itemConditionSchema>;

export const priceTypeSchema = z.enum(['FIXED', 'NEGOTIABLE', 'FREE', 'EXCHANGE']);
export type PriceType = z.infer<typeof priceTypeSchema>;

/** Ukrainian labels for the UI. Kept beside the enum so the two cannot drift. */
export const itemConditionLabels: Record<ItemCondition, string> = {
  NEW: 'Нове',
  LIKE_NEW: 'Як нове',
  GOOD: 'Добрий стан',
  ACCEPTABLE: 'Задовільний стан',
  FOR_PARTS: 'На запчастини',
};

export const priceTypeLabels: Record<PriceType, string> = {
  FIXED: 'Фіксована ціна',
  NEGOTIABLE: 'Торг доречний',
  FREE: 'Безкоштовно',
  EXCHANGE: 'Обмін',
};

/**
 * The three price scenarios the AI proposes. The numbers themselves come from
 * SQL over our own listings; the model only writes `reasoning` around them.
 */
export const aiPriceSuggestionSchema = z.object({
  quickSaleKop: priceKopSchema,
  optimalKop: priceKopSchema,
  maximumKop: priceKopSchema,
  reasoning: z.string().min(1),
});
export type AiPriceSuggestion = z.infer<typeof aiPriceSuggestionSchema>;

/** Mandatory wording under every price recommendation. */
export const PRICE_DISCLAIMER =
  'Рекомендація базується на ринкових даних і не є експертною оцінкою майна.';

/**
 * What the user submits. Every AI-generated field arrives here only after the
 * user has seen and confirmed it — nothing publishes itself.
 */
export const createListingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(10, 'Заголовок закороткий — додайте деталей')
    .max(70, 'Заголовок задовгий — максимум 70 символів'),
  description: z
    .string()
    .trim()
    .min(30, 'Опис закороткий — покупцям бракуватиме інформації')
    .max(5000),
  categoryId: cuidSchema,
  attributes: z.record(z.string(), z.unknown()).default({}),
  priceKop: priceKopSchema,
  priceType: priceTypeSchema.default('FIXED'),
  condition: itemConditionSchema,
  cityId: cuidSchema.optional(),
  mediaIds: z
    .array(cuidSchema)
    .min(1, 'Додайте хоча б одне фото')
    .max(12, 'Максимум 12 фото'),

  /**
   * Which generated fields the user left untouched. This is how we answer
   * whether the AI actually works or people rewrite everything, so the client
   * always sends it.
   */
  aiAcceptedFields: z.array(z.string()).default([]),
  aiGenerated: z.boolean().default(false),
});
export type CreateListingInput = z.infer<typeof createListingSchema>;

/** Partial edit of a draft; the same rules apply per field. */
export const updateListingSchema = createListingSchema.partial();
export type UpdateListingInput = z.infer<typeof updateListingSchema>;

/** Shape returned to the browser. Money stays in kopiyky right up to render. */
export const listingSchema = z.object({
  id: cuidSchema,
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  categoryId: cuidSchema,
  attributes: z.record(z.string(), z.unknown()),
  priceKop: priceKopSchema,
  currency: z.literal('UAH'),
  priceType: priceTypeSchema,
  condition: itemConditionSchema,
  status: listingStatusSchema,
  cityId: cuidSchema.nullable(),
  aiGenerated: z.boolean(),
  aiConfidence: confidenceSchema.nullable(),
  aiPriceSuggestion: aiPriceSuggestionSchema.nullable(),
  viewsCount: z.int().min(0),
  savesCount: z.int().min(0),
  publishedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});
export type Listing = z.infer<typeof listingSchema>;

export const searchListingsSchema = paginationSchema.extend({
  q: z.string().trim().max(200).optional(),
  categoryId: cuidSchema.optional(),
  cityId: cuidSchema.optional(),
  priceMinKop: priceKopSchema.optional(),
  priceMaxKop: priceKopSchema.optional(),
  condition: itemConditionSchema.optional(),
  sort: z.enum(['relevance', 'newest', 'priceAsc', 'priceDesc']).default('relevance'),
});
export type SearchListingsInput = z.infer<typeof searchListingsSchema>;
