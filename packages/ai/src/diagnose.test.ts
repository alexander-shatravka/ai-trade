import { describe, expect, it } from 'vitest';
import { sellerAdviceSchema } from '@ai-trade/contracts';
import type { DiagnoseInput } from '@ai-trade/contracts';
import { diagnoseListing, healthScore, lockAdvice } from './diagnose';
import { demoDiagnoseInput } from './fixtures/listings';

const at = new Date('2026-08-18T12:00:00.000Z');
const advice = diagnoseListing(demoDiagnoseInput, at);

/** A listing with nothing wrong, used to prove each axis fires on its own. */
const healthy: DiagnoseInput = {
  ...demoDiagnoseInput,
  listing: {
    ...demoDiagnoseInput.listing,
    title: "iPhone 13 Pro 128 ГБ Graphite, батарея 89%",
    description: 'о'.repeat(400),
    priceKop: demoDiagnoseInput.market.medianKop,
    photoCount: 7,
    photoAngles: ['front', 'back', 'screen_on', 'accessories'],
  },
  category: { ...demoDiagnoseInput.category, keyAttributes: [] },
};

describe('contract', () => {
  it('produces a valid SellerAdvice', () => {
    expect(sellerAdviceSchema.safeParse(advice).success).toBe(true);
  });

  it('is deterministic for the same input', () => {
    expect(diagnoseListing(demoDiagnoseInput, at)).toEqual(advice);
  });
});

describe('numbers come from the data, not from a model', () => {
  it('states the real gap between the price and the median', () => {
    const price = advice.findings.find((f) => f.axis === 'price');
    // 2 850 000 vs 2 480 000 → +15%
    expect(price?.evidence.gapPercent).toBe(15);
    expect(price?.finding).toContain('15%');
    expect(price?.finding).toContain('43');
  });

  it('proposes the median as the new price', () => {
    const price = advice.findings.find((f) => f.axis === 'price');
    expect(price?.action?.payload.priceKop).toBe(demoDiagnoseInput.market.medianKop);
  });

  it('counts photos against the category, and names the missing angles', () => {
    const photos = advice.findings.find((f) => f.axis === 'photos');
    expect(photos?.evidence.photoCount).toBe(3);
    expect(photos?.evidence.topPhotoCount).toBe(7);
    expect(photos?.evidence.missingAngles).toEqual([
      'зворотний бік',
      'екран увімкнено',
      'комплектація',
    ]);
  });

  it('finds the top filter attribute missing from the title', () => {
    const title = advice.findings.find((f) => f.axis === 'title');
    expect(title?.evidence.attribute).toBe('storage');
    expect(title?.evidence.filterSharePercent).toBe(68);
  });
});

describe('each axis fires only when it should', () => {
  it('reports nothing for a healthy listing', () => {
    expect(diagnoseListing(healthy, at).findings).toEqual([]);
    expect(diagnoseListing(healthy, at).healthScore).toBe(100);
  });

  it('ignores a price within 5% of the median', () => {
    const input = {
      ...healthy,
      listing: { ...healthy.listing, priceKop: Math.round(healthy.market.medianKop * 1.04) },
    };
    expect(diagnoseListing(input, at).findings.some((f) => f.axis === 'price')).toBe(false);
  });

  it('flags a short description', () => {
    const input = { ...healthy, listing: { ...healthy.listing, description: 'Продам.' } };
    const found = diagnoseListing(input, at).findings.find((f) => f.axis === 'description');
    expect(found?.evidence.length).toBe(7);
  });

  it('flags seasonality and offers waiting rather than a fix', () => {
    const input = {
      ...healthy,
      category: {
        ...healthy.category,
        seasonalityFactor: 0.16,
        seasonalityNote: 'Зимові шини в липні: попит у 6 разів нижчий, ніж у жовтні',
      },
    };
    const found = diagnoseListing(input, at).findings.find((f) => f.axis === 'timing');
    expect(found?.severity).toBe('low');
    expect(found?.action?.type).toBe('wait');
  });
});

describe('ordering and score', () => {
  it('puts the most severe finding first', () => {
    expect(advice.findings[0]?.severity).toBe('high');
  });

  it('drops the score as problems accumulate', () => {
    expect(advice.healthScore).toBeLessThan(100);
    expect(healthScore([])).toBe(100);
    expect(healthScore(advice.findings)).toBe(advice.healthScore);
  });

  it('never leaves the 0–100 range', () => {
    const many = Array.from({ length: 20 }, () => advice.findings[0]!);
    expect(healthScore(many)).toBe(0);
  });
});

describe('FREE lock', () => {
  const locked = lockAdvice(advice);

  it('keeps the score and exactly one finding', () => {
    expect(locked.locked).toBe(true);
    expect(locked.healthScore).toBe(advice.healthScore);
    expect(locked.findings).toHaveLength(1);
  });

  it('strips the numbers, the evidence and the action', () => {
    expect(locked.findings[0]?.evidence).toEqual({});
    expect(locked.findings[0]?.action).toBeNull();
    expect(locked.findings[0]?.expectedEffect).toBe('');
  });

  it('still names the real problem, on the same axis', () => {
    expect(locked.findings[0]?.axis).toBe(advice.findings[0]?.axis);
    expect(locked.findings[0]?.finding).toContain('Ціна');
  });

  it('quotes no figures — the numbers are what Premium pays for', () => {
    expect(locked.findings[0]?.finding).not.toMatch(/\d/);
  });
});
