import { describe, expect, it } from 'vitest';
import {
  createListingSchema,
  itemConditionLabels,
  itemConditionSchema,
  listingStatusSchema,
  priceTypeLabels,
  priceTypeSchema,
} from './listing';
import { priceKopSchema } from './primitives';

const validListing = {
  title: 'iPhone 13 Pro 128GB графітовий',
  description:
    'Телефон у чудовому стані, користувався рік, завжди в чохлі та зі склом. ' +
    'Комплект повний: коробка, кабель, документи. Батарея тримає добре.',
  categoryId: 'clh3k2j9x0000qwer1234abcd',
  priceKop: 2_449_000,
  condition: 'GOOD' as const,
  mediaIds: ['clh3k2j9x0001qwer1234abcd'],
};

describe('priceKopSchema', () => {
  it('accepts whole kopiyky', () => {
    expect(priceKopSchema.parse(2_449_000)).toBe(2_449_000);
    expect(priceKopSchema.parse(0)).toBe(0);
  });

  it('rejects a float, which is how kopiyky get lost', () => {
    expect(priceKopSchema.safeParse(24_490.5).success).toBe(false);
  });

  it('rejects a negative price and an implausible one', () => {
    expect(priceKopSchema.safeParse(-1).success).toBe(false);
    expect(priceKopSchema.safeParse(9_999_999_999).success).toBe(false);
  });
});

describe('enums mirror prisma/schema.prisma', () => {
  it('lists every listing status', () => {
    expect(listingStatusSchema.options).toEqual([
      'DRAFT',
      'PENDING_MODERATION',
      'ACTIVE',
      'REJECTED',
      'SOLD',
      'ARCHIVED',
      'EXPIRED',
    ]);
  });

  it('labels every condition and price type, so the UI cannot render a raw enum', () => {
    for (const value of itemConditionSchema.options) {
      expect(itemConditionLabels[value]).toBeTruthy();
    }
    for (const value of priceTypeSchema.options) {
      expect(priceTypeLabels[value]).toBeTruthy();
    }
  });
});

describe('createListingSchema', () => {
  it('accepts a complete listing', () => {
    const result = createListingSchema.safeParse(validListing);
    expect(result.success).toBe(true);
  });

  it('defaults the AI metric fields so they are never silently missing', () => {
    const parsed = createListingSchema.parse(validListing);
    expect(parsed.aiAcceptedFields).toEqual([]);
    expect(parsed.aiGenerated).toBe(false);
    expect(parsed.priceType).toBe('FIXED');
  });

  it('requires at least one photo', () => {
    const result = createListingSchema.safeParse({ ...validListing, mediaIds: [] });
    expect(result.success).toBe(false);
  });

  it('enforces the 70-character title limit from the database column', () => {
    const result = createListingSchema.safeParse({ ...validListing, title: 'я'.repeat(71) });
    expect(result.success).toBe(false);
  });

  it('reports errors in Ukrainian, because they are shown to the user', () => {
    const result = createListingSchema.safeParse({ ...validListing, title: 'Коротко' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/[а-яіїєґ]/i);
    }
  });
});
