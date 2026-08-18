/**
 * Money handling for AI Trade.
 *
 * Every amount is an integer number of kopiyky (1 UAH = 100 kop) and every
 * variable holding one carries the `Kop` suffix. Floats are never used: a
 * price of 24490.00 loses kopiyky in reconciliation, 2449000 does not.
 *
 * AI spend is tracked in micro-kopiyky (`costMicroKop`) because a single model
 * call costs a fraction of one kopiyka.
 */

/** Kopiyky in one hryvnia. */
export const KOP_IN_UAH = 100;

/** Micro-kopiyky in one kopiyka. */
export const MICRO_IN_KOP = 1_000_000;

/** Amounts above this are rejected as almost certainly a unit mistake (10 M UAH). */
export const MAX_PRICE_KOP = 1_000_000_000;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

function assertSafeKop(kop: number, label: string): void {
  if (!Number.isFinite(kop) || !Number.isInteger(kop)) {
    throw new MoneyError(`${label} must be an integer number of kopiyky, got ${kop}`);
  }
}

/**
 * Parses user input in hryvnias into kopiyky.
 *
 * Accepts what a Ukrainian keyboard actually produces: "24 490", "24490,50",
 * "24 490.50", non-breaking spaces from a pasted price, a trailing "₴".
 * Rounds to the nearest kopiyka rather than truncating, so 0.005 does not
 * silently vanish.
 */
export function parseUahToKop(input: string | number): number {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new MoneyError(`Cannot parse ${input} as an amount`);
    return Math.round(input * KOP_IN_UAH);
  }

  const normalized = input
    .replace(/[\s  ]/g, '')
    .replace(/₴|UAH/gi, '')
    .replace(',', '.')
    .trim();

  if (normalized === '' || !/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new MoneyError(`Cannot parse "${input}" as an amount in hryvnias`);
  }

  return Math.round(Number(normalized) * KOP_IN_UAH);
}

/** Converts kopiyky to hryvnias. Display only — never store the result. */
export function kopToUah(kop: number): number {
  assertSafeKop(kop, 'kop');
  return kop / KOP_IN_UAH;
}

export interface FormatKopOptions {
  /**
   * Show the "₴" sign. Off when the surrounding UI already states the currency.
   * @default true
   */
  currency?: boolean;
  /**
   * Force two decimals. By default kopiyky are shown only when they are not
   * zero, because "24 490 ₴" reads better than "24 490,00 ₴" in a listing card.
   */
  alwaysShowKop?: boolean;
}

/**
 * Formats kopiyky for display: 2449000 -> "24 490 ₴".
 *
 * This is the only place allowed to turn money into a string. Group separators
 * come from the uk-UA locale, which uses a narrow no-break space.
 */
export function formatKop(kop: number, options: FormatKopOptions = {}): string {
  assertSafeKop(kop, 'kop');
  const { currency = true, alwaysShowKop = false } = options;

  const showFraction = alwaysShowKop || kop % KOP_IN_UAH !== 0;
  const digits = showFraction ? 2 : 0;

  const amount = new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(kopToUah(kop));

  return currency ? `${amount} ₴` : amount;
}

/**
 * Compact form for chart axes and dense statistics: 2449000 -> "24,5 тис. ₴".
 * Full precision belongs in {@link formatKop}; this one is deliberately lossy.
 */
export function formatKopCompact(kop: number): string {
  assertSafeKop(kop, 'kop');
  const amount = new Intl.NumberFormat('uk-UA', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(kopToUah(kop));
  return `${amount} ₴`;
}

/** Percentage difference between two prices, rounded — for "12% below market". */
export function priceDiffPercent(kop: number, baselineKop: number): number {
  assertSafeKop(kop, 'kop');
  assertSafeKop(baselineKop, 'baselineKop');
  if (baselineKop === 0) throw new MoneyError('Baseline price cannot be zero');
  return Math.round(((kop - baselineKop) / baselineKop) * 100);
}

/**
 * Applies a percentage to a price, rounding to whole kopiyky.
 * Used for promotion discounts and AI price scenarios.
 */
export function applyPercent(kop: number, percent: number): number {
  assertSafeKop(kop, 'kop');
  if (!Number.isFinite(percent)) throw new MoneyError(`Invalid percent: ${percent}`);
  return Math.round(kop * (1 + percent / 100));
}

/** Converts AI spend from micro-kopiyky to kopiyky, rounding up so cost is never understated. */
export function microKopToKop(microKop: number): number {
  if (!Number.isFinite(microKop)) throw new MoneyError(`Invalid amount: ${microKop}`);
  return Math.ceil(microKop / MICRO_IN_KOP);
}

/**
 * Formats AI spend, which is routinely smaller than one kopiyka:
 * 1_500_000 -> "0,0150 ₴".
 */
export function formatMicroKop(microKop: number): string {
  if (!Number.isFinite(microKop)) throw new MoneyError(`Invalid amount: ${microKop}`);
  const uah = microKop / MICRO_IN_KOP / KOP_IN_UAH;
  return `${new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(uah)} ₴`;
}

/** True when the amount is a plausible listing price. */
export function isValidPriceKop(kop: number): boolean {
  return Number.isInteger(kop) && kop >= 0 && kop <= MAX_PRICE_KOP;
}
