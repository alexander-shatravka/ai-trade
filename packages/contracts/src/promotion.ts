/** Promotion tiers, mirroring the PromotionTier enum in prisma/schema.prisma. */
import { z } from 'zod';

export const promotionTierSchema = z.enum(['START', 'PREMIUM', 'VIP']);
export type PromotionTier = z.infer<typeof promotionTierSchema>;

export const promotionTierLabels: Record<PromotionTier, string> = {
  START: 'Start',
  PREMIUM: 'Premium',
  VIP: 'VIP',
};
