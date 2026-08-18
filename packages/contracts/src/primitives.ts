/**
 * Shared building blocks for every contract.
 *
 * These schemas validate the same object twice: once in the browser as a form
 * and once on the server as a request body. Changing one side without the
 * other does not compile.
 */
import { z } from 'zod';

/** Upper bound shared with @ai-trade/utils MAX_PRICE_KOP (10 M UAH). */
export const MAX_PRICE_KOP = 1_000_000_000;

/**
 * An amount of money. Always an integer number of kopiyky — a float here is a
 * bug, not a rounding detail, so it is rejected rather than coerced.
 */
export const priceKopSchema = z
  .int('Ціна має бути цілим числом копійок')
  .min(0, 'Ціна не може бути від’ємною')
  .max(MAX_PRICE_KOP, 'Ціна виглядає завеликою — перевірте, будь ласка');

export const cuidSchema = z.cuid('Некоректний ідентифікатор');

/** AI confidence, 0–1. Below 0.6 the UI must not present a guess as a fact. */
export const confidenceSchema = z.number().min(0).max(1);

/** Threshold under which we admit we could not identify the item. */
export const MIN_USABLE_CONFIDENCE = 0.6;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(60).default(24),
});
export type Pagination = z.infer<typeof paginationSchema>;

/** Envelope every paginated endpoint returns. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.int().min(0),
    page: z.int().min(1),
    perPage: z.int().min(1),
  });
}
