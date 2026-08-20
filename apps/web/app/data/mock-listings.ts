/**
 * Demo listings and seller statistics for the dashboard.
 *
 * Stands in for GET /listings?mine=true and GET /users/me/stats until apps/api
 * exists. The iPhone deliberately matches the listing the advisor diagnoses, so
 * "Подивитися розбір" leads to a consistent story rather than a dead end.
 */
import { DEMO_LISTING_ID } from '@ai-trade/ai';
import type { ListingSummary, SellerStats } from '@ai-trade/contracts';

const daysAgo = (days: number) => {
  const date = new Date('2026-08-20T09:00:00.000Z');
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export const mockListings: ListingSummary[] = [
  {
    id: DEMO_LISTING_ID,
    title: 'iPhone 13 Pro Graphite, ідеальний стан',
    priceKop: 2_850_000,
    status: 'ACTIVE',
    viewsCount: 214,
    contactsCount: 0,
    publishedAt: daysAgo(9),
    createdAt: daysAgo(9),
    promotionTier: null,
    promotedUntil: null,
    needsAttention: true,
    coverEmoji: '📱',
    aiGenerated: true,
  },
  {
    id: 'lst_91',
    title: 'ASUS TUF Gaming F15, RTX 3060, 16 ГБ',
    priceKop: 3_190_000,
    status: 'ACTIVE',
    viewsCount: 398,
    contactsCount: 7,
    publishedAt: daysAgo(2),
    createdAt: daysAgo(2),
    promotionTier: 'VIP',
    promotedUntil: daysAgo(-23),
    needsAttention: false,
    coverEmoji: '💻',
    aiGenerated: true,
  },
  {
    id: 'lst_94',
    title: 'Michelin X-Ice North 4 205/55 R16, 4 шт',
    priceKop: 820_000,
    status: 'ACTIVE',
    viewsCount: 156,
    contactsCount: 3,
    publishedAt: daysAgo(5),
    createdAt: daysAgo(5),
    promotionTier: 'START',
    promotedUntil: daysAgo(-2),
    needsAttention: false,
    coverEmoji: '🛞',
    aiGenerated: true,
  },
  {
    id: 'lst_97',
    title: 'Sony WH-1000XM4, чорні',
    priceKop: 540_000,
    status: 'DRAFT',
    viewsCount: 0,
    contactsCount: 0,
    publishedAt: null,
    createdAt: daysAgo(1),
    promotionTier: null,
    promotedUntil: null,
    needsAttention: false,
    coverEmoji: '🎧',
    aiGenerated: true,
  },
  {
    id: 'lst_98',
    title: 'Велосипед Trek Marlin 5, рама M',
    priceKop: 1_450_000,
    status: 'DRAFT',
    viewsCount: 0,
    contactsCount: 0,
    publishedAt: null,
    createdAt: daysAgo(3),
    promotionTier: null,
    promotedUntil: null,
    needsAttention: false,
    coverEmoji: '🚲',
    aiGenerated: false,
  },
  {
    id: 'lst_72',
    title: 'PlayStation 5 Slim, 2 джойстики',
    priceKop: 1_990_000,
    status: 'SOLD',
    viewsCount: 872,
    contactsCount: 24,
    publishedAt: daysAgo(41),
    createdAt: daysAgo(41),
    promotionTier: null,
    promotedUntil: null,
    needsAttention: false,
    coverEmoji: '🎮',
    aiGenerated: true,
  },
  {
    id: 'lst_65',
    title: 'Кавомашина DeLonghi Magnifica S',
    priceKop: 1_120_000,
    status: 'SOLD',
    viewsCount: 531,
    contactsCount: 16,
    publishedAt: daysAgo(58),
    createdAt: daysAgo(58),
    promotionTier: null,
    promotedUntil: null,
    needsAttention: false,
    coverEmoji: '☕',
    aiGenerated: true,
  },
];

/**
 * 30 days of views and contacts. Generated from a fixed seed so the chart is
 * identical on every render — a demo that reshuffles on reload looks broken.
 */
function buildSeries(): SellerStats['series'] {
  const series: SellerStats['series'] = [];
  let seed = 20260820;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  for (let i = 29; i >= 0; i -= 1) {
    const date = new Date('2026-08-20T00:00:00.000Z');
    date.setDate(date.getDate() - i);
    const day = date.getUTCDay();
    // Weekends run hotter on a consumer marketplace.
    const weekend = day === 0 || day === 6 ? 1.35 : 1;
    // Gentle upward drift, so the +23% headline has something behind it.
    const trend = 1 + (29 - i) * 0.012;
    const views = Math.round((95 + next() * 60) * weekend * trend);
    series.push({
      date: date.toISOString().slice(0, 10),
      views,
      contacts: Math.round(views * (0.006 + next() * 0.012)),
    });
  }
  return series;
}

const series = buildSeries();
const totalViews = series.reduce((sum, point) => sum + point.views, 0);
const totalContacts = series.reduce((sum, point) => sum + point.contacts, 0);

export const mockSellerStats: SellerStats = {
  activeListings: mockListings.filter((l) => l.status === 'ACTIVE').length,
  totalViews,
  totalContacts,
  soldCount: mockListings.filter((l) => l.status === 'SOLD').length,
  avgSellDays: 11,
  conversionRate: totalContacts / totalViews,
  viewsDeltaPercent: 23,
  contactsDeltaPercent: 9,
  series,
};
