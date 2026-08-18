import { describe, expect, it } from 'vitest';
import {
  applyPercent,
  formatKop,
  formatKopCompact,
  formatMicroKop,
  isValidPriceKop,
  kopToUah,
  microKopToKop,
  MoneyError,
  parseUahToKop,
  priceDiffPercent,
} from './money';

/** uk-UA groups with a narrow no-break space; comparing to a plain space fails. */
const nbsp = (s: string) => s.replace(/[\s  ]/g, ' ');

describe('parseUahToKop', () => {
  it('parses a plain amount', () => {
    expect(parseUahToKop('24490')).toBe(2_449_000);
  });

  it('accepts the separators a pasted price actually contains', () => {
    expect(parseUahToKop('24 490')).toBe(2_449_000);
    expect(parseUahToKop('24 490')).toBe(2_449_000); // no-break space
    expect(parseUahToKop('24490,50')).toBe(2_449_050);
    expect(parseUahToKop('24490.50')).toBe(2_449_050);
    expect(parseUahToKop('24 490,50 ₴')).toBe(2_449_050);
  });

  it('rounds to the nearest kopiyka instead of truncating', () => {
    expect(parseUahToKop('0.005')).toBe(1);
    expect(parseUahToKop('0.004')).toBe(0);
  });

  it('rejects input that is not an amount', () => {
    expect(() => parseUahToKop('дорого')).toThrow(MoneyError);
    expect(() => parseUahToKop('')).toThrow(MoneyError);
    expect(() => parseUahToKop(Number.NaN)).toThrow(MoneyError);
  });
});

describe('formatKop', () => {
  it('hides kopiyky when they are zero', () => {
    expect(nbsp(formatKop(2_449_000))).toBe('24 490 ₴');
  });

  it('shows kopiyky when they are not', () => {
    expect(nbsp(formatKop(2_449_050))).toBe('24 490,50 ₴');
  });

  it('can be forced to show kopiyky', () => {
    expect(nbsp(formatKop(2_449_000, { alwaysShowKop: true }))).toBe('24 490,00 ₴');
  });

  it('can omit the currency sign', () => {
    expect(nbsp(formatKop(2_449_000, { currency: false }))).toBe('24 490');
  });

  it('formats zero', () => {
    expect(nbsp(formatKop(0))).toBe('0 ₴');
  });

  it('refuses a float, which would mean kopiyky were lost upstream', () => {
    expect(() => formatKop(24490.5)).toThrow(MoneyError);
  });
});

describe('formatKopCompact', () => {
  it('shortens large amounts', () => {
    expect(formatKopCompact(2_449_000)).toContain('24,5');
  });
});

describe('kopToUah', () => {
  it('converts', () => {
    expect(kopToUah(2_449_000)).toBe(24_490);
  });
});

describe('priceDiffPercent', () => {
  it('reports how far a price sits from the market baseline', () => {
    expect(priceDiffPercent(2_200_000, 2_449_000)).toBe(-10);
    expect(priceDiffPercent(2_700_000, 2_449_000)).toBe(10);
  });

  it('rejects a zero baseline', () => {
    expect(() => priceDiffPercent(100, 0)).toThrow(MoneyError);
  });
});

describe('applyPercent', () => {
  it('returns whole kopiyky', () => {
    expect(applyPercent(2_449_000, -10)).toBe(2_204_100);
    expect(Number.isInteger(applyPercent(3_333_333, -33.3))).toBe(true);
  });
});

describe('AI spend', () => {
  it('rounds spend up so cost is never understated', () => {
    expect(microKopToKop(1_000_001)).toBe(2);
    expect(microKopToKop(1_000_000)).toBe(1);
  });

  it('formats amounts smaller than a kopiyka', () => {
    expect(nbsp(formatMicroKop(1_500_000))).toBe('0,0150 ₴');
  });
});

describe('isValidPriceKop', () => {
  it('accepts a normal price and rejects nonsense', () => {
    expect(isValidPriceKop(2_449_000)).toBe(true);
    expect(isValidPriceKop(0)).toBe(true);
    expect(isValidPriceKop(-1)).toBe(false);
    expect(isValidPriceKop(24_490.5)).toBe(false);
    expect(isValidPriceKop(9_999_999_999)).toBe(false);
  });
});
