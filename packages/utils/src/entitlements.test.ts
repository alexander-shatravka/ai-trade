import { describe, expect, it } from 'vitest';
import type { SubscriptionState } from '@ai-trade/contracts';
import { can, remaining } from './entitlements';

const free: SubscriptionState = {
  planCode: 'FREE',
  planName: 'Free',
  status: 'ACTIVE',
  currentPeriodEnd: null,
  usage: { activeListings: 1, aiGenerations: 3, aiDiagnoses: 0 },
  limits: {
    activeListings: 2,
    aiGenerations: 5,
    sellerAdvice: false,
    advancedStats: false,
    competitorAnalysis: false,
    shopPage: false,
    bulkImport: false,
    aiReplies: false,
  },
};

const business: SubscriptionState = {
  ...free,
  planCode: 'BUSINESS',
  planName: 'Business',
  usage: { activeListings: 900, aiGenerations: 400, aiDiagnoses: 12 },
  limits: {
    activeListings: null,
    aiGenerations: null,
    sellerAdvice: true,
    advancedStats: true,
    competitorAnalysis: true,
    shopPage: true,
    bulkImport: true,
    aiReplies: true,
  },
};

describe('signed out', () => {
  it('allows nothing and says why', () => {
    const result = can(null, 'ai.generation');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Потрібно увійти в акаунт');
  });
});

describe('countable quotas', () => {
  it('allows while under the limit and reports the counts', () => {
    const result = can(free, 'ai.generation');
    expect(result).toMatchObject({ allowed: true, used: 3, limit: 5 });
  });

  it('blocks exactly at the limit, not one past it', () => {
    const atLimit = { ...free, usage: { ...free.usage, aiGenerations: 5 } };
    expect(can(atLimit, 'ai.generation').allowed).toBe(false);

    const belowLimit = { ...free, usage: { ...free.usage, aiGenerations: 4 } };
    expect(can(belowLimit, 'ai.generation').allowed).toBe(true);
  });

  it('explains the block in Ukrainian, with the numbers', () => {
    const atLimit = { ...free, usage: { ...free.usage, activeListings: 2 } };
    const result = can(atLimit, 'listing.create');
    expect(result.reason).toBe('Ліміт тарифу вичерпано: 2 з 2 активних оголошень');
  });

  it('treats a null limit as unlimited, not as zero', () => {
    expect(can(business, 'ai.generation').allowed).toBe(true);
    expect(can(business, 'listing.create').allowed).toBe(true);
  });
});

describe('feature entitlements', () => {
  it('keeps the advisor behind Premium on FREE', () => {
    const result = can(free, 'ai.advice');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Premium');
  });

  it('unlocks every feature on BUSINESS', () => {
    for (const entitlement of [
      'ai.advice',
      'stats.advanced',
      'competitors.analysis',
      'shop.page',
      'bulk.import',
      'ai.replies',
    ] as const) {
      expect(can(business, entitlement).allowed).toBe(true);
    }
  });
});

describe('subscription status', () => {
  it('stops consumption when the subscription is not active', () => {
    for (const status of ['PAST_DUE', 'CANCELED', 'EXPIRED'] as const) {
      const result = can({ ...business, status }, 'ai.generation');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Підписка неактивна');
    }
  });
});

describe('remaining', () => {
  it('never goes negative and is null when unlimited', () => {
    expect(remaining(3, 5)).toBe(2);
    expect(remaining(9, 5)).toBe(0);
    expect(remaining(9, null)).toBeNull();
  });
});
