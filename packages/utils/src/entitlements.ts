/**
 * What a subscription allows right now.
 *
 * Limits are never hardcoded here — they arrive from the Plan table via
 * SubscriptionState, so marketing can change them without a release. This
 * module only compares usage against whatever those limits say.
 *
 * Checked BEFORE an action; quota is charged only AFTER it succeeds, so a
 * failed or degraded AI job never costs the user a generation.
 */
import type { SubscriptionState } from '@ai-trade/contracts';

export type Entitlement =
  | 'listing.create'
  | 'ai.generation'
  | 'ai.advice'
  | 'stats.advanced'
  | 'competitors.analysis'
  | 'shop.page'
  | 'bulk.import'
  | 'ai.replies';

export interface EntitlementResult {
  allowed: boolean;
  /** Ukrainian, because it is shown to the user as-is. */
  reason?: string;
  /** Present for countable limits; null means unlimited. */
  used?: number;
  limit?: number | null;
}

const ALLOWED: EntitlementResult = { allowed: true };

/** null limit means unlimited, which is not the same as a limit of 0. */
function checkQuota(used: number, limit: number | null, noun: string): EntitlementResult {
  if (limit === null) return { allowed: true, used, limit };
  if (used < limit) return { allowed: true, used, limit };
  return {
    allowed: false,
    reason: `Ліміт тарифу вичерпано: ${used} з ${limit} ${noun}`,
    used,
    limit,
  };
}

export function can(
  plan: SubscriptionState | null,
  entitlement: Entitlement,
): EntitlementResult {
  if (!plan) {
    return { allowed: false, reason: 'Потрібно увійти в акаунт' };
  }

  // An unpaid or expired subscription keeps reading but stops consuming.
  if (plan.status !== 'ACTIVE') {
    return { allowed: false, reason: 'Підписка неактивна — поновіть тариф' };
  }

  const { usage, limits } = plan;

  switch (entitlement) {
    case 'listing.create':
      return checkQuota(usage.activeListings, limits.activeListings, 'активних оголошень');
    case 'ai.generation':
      return checkQuota(usage.aiGenerations, limits.aiGenerations, 'AI-створень цього місяця');
    case 'ai.advice':
      return limits.sellerAdvice
        ? ALLOWED
        : { allowed: false, reason: 'Аналіз «чому не продається» доступний на Premium' };
    case 'stats.advanced':
      return limits.advancedStats
        ? ALLOWED
        : { allowed: false, reason: 'Розширена статистика доступна на Premium' };
    case 'competitors.analysis':
      return limits.competitorAnalysis
        ? ALLOWED
        : { allowed: false, reason: 'Аналіз конкурентів доступний на Premium' };
    case 'shop.page':
      return limits.shopPage
        ? ALLOWED
        : { allowed: false, reason: 'Сторінка магазину доступна на Business' };
    case 'bulk.import':
      return limits.bulkImport
        ? ALLOWED
        : { allowed: false, reason: 'Масовий імпорт доступний на Business' };
    case 'ai.replies':
      return limits.aiReplies
        ? ALLOWED
        : { allowed: false, reason: 'AI-відповіді покупцям доступні на Business' };
  }
}

/** How much of a countable quota is left; null when unlimited. */
export function remaining(used: number, limit: number | null): number | null {
  return limit === null ? null : Math.max(0, limit - used);
}
