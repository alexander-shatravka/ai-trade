/**
 * A published listing that is not selling, for developing the Advisor screen.
 * Stands in for what the API will read from the database.
 *
 * The numbers are chosen to trigger four of the five axes: an overpriced
 * listing with too few photos, a title missing the category's top filter and a
 * short description, in a category that is in season.
 */
import type { DiagnoseInput, PricePosition } from '@ai-trade/contracts';

export const DEMO_LISTING_ID = 'lst_88';

export const demoDiagnoseInput: DiagnoseInput = {
  listing: {
    id: DEMO_LISTING_ID,
    title: 'iPhone 13 Pro Graphite, ідеальний стан',
    description:
      'Продаю iPhone 13 Pro. Стан хороший, працює без нарікань. ' +
      'Телефон завжди був у чохлі. Причина продажу — перехід на іншу модель.',
    priceKop: 2_850_000,
    categoryId: 'cat_phones_smartphones',
    categoryName: 'Смартфони',
    attributes: {
      brand: 'Apple',
      model: 'iPhone 13 Pro',
      storage: '128',
      color: 'Graphite',
    },
    photoCount: 3,
    photoAngles: ['front'],
  },
  stats: {
    daysSincePublished: 9,
    viewsCount: 214,
    impressionsCount: 1_830,
    savesCount: 9,
    contactsCount: 0,
  },
  market: {
    medianKop: 2_480_000,
    p25Kop: 2_240_000,
    p75Kop: 2_760_000,
    sampleSize: 43,
    medianSellDays: 12,
  },
  category: {
    topPhotoCount: 7,
    keyAttributes: [
      { key: 'storage', label: "Пам'ять", filterShare: 0.68 },
      { key: 'color', label: 'Колір', filterShare: 0.21 },
    ],
    seasonalityFactor: 1,
    seasonalityNote: null,
  },
};

/** Comparable listings for the price-position chart, cheapest first. */
export const demoPricePosition: PricePosition = {
  items: [
    { label: 'iPhone 13 Pro 128 ГБ', priceKop: 2_190_000, isYours: false },
    { label: 'iPhone 13 Pro 128 ГБ', priceKop: 2_320_000, isYours: false },
    { label: 'iPhone 13 Pro 128 ГБ', priceKop: 2_440_000, isYours: false },
    { label: 'iPhone 13 Pro 128 ГБ', priceKop: 2_480_000, isYours: false },
    { label: 'iPhone 13 Pro 256 ГБ', priceKop: 2_610_000, isYours: false },
    { label: 'iPhone 13 Pro 256 ГБ', priceKop: 2_740_000, isYours: false },
    { label: 'Ваше оголошення', priceKop: 2_850_000, isYours: true },
  ],
};
