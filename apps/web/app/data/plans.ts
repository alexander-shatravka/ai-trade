/**
 * Marketing copy for the pricing section.
 *
 * The numbers here are a placeholder for the landing page only. The Plan table
 * in the database is the source of truth for limits, so that marketing can
 * change them without a release — once /api/plans exists this module is
 * replaced by a fetch, and nothing in the app may read limits from here.
 */
import type { PlanCode } from '@ai-trade/contracts';

export interface PlanCard {
  code: PlanCode;
  name: string;
  tagline: string;
  priceKop: number;
  featured: boolean;
  cta: string;
  features: { label: string; included: boolean }[];
}

export const planCards: PlanCard[] = [
  {
    code: 'FREE',
    name: 'Free',
    tagline: 'Для разових продажів',
    priceKop: 0,
    featured: false,
    cta: 'Почати безкоштовно',
    features: [
      { label: '2 активні оголошення', included: true },
      { label: '5 AI-створень на місяць', included: true },
      { label: 'AI опис і заголовок', included: true },
      { label: 'Базова оцінка ціни', included: true },
      { label: 'Чат із покупцями', included: true },
      { label: 'AI аналіз «чому не продається»', included: false },
      { label: 'Розширена статистика', included: false },
    ],
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    tagline: 'Для активних продавців',
    priceKop: 19_900,
    featured: true,
    cta: 'Обрати Premium',
    features: [
      { label: '50 активних оголошень', included: true },
      { label: '100 AI-створень на місяць', included: true },
      { label: 'AI аналіз «чому не продається»', included: true },
      { label: 'Розширена статистика', included: true },
      { label: 'Аналіз конкурентів', included: true },
      { label: 'Пріоритет у AI-рекомендаціях', included: true },
      { label: 'Розширена оцінка ціни', included: true },
    ],
  },
  {
    code: 'BUSINESS',
    name: 'Business',
    tagline: 'Для магазинів і бізнесу',
    priceKop: 49_900,
    featured: false,
    cta: 'Обрати Business',
    features: [
      { label: 'Необмежені оголошення (fair-use 2000/міс)', included: true },
      { label: 'Необмежені AI-створення', included: true },
      { label: 'Сторінка магазину', included: true },
      { label: 'Масовий імпорт товарів', included: true },
      { label: 'AI-відповіді покупцям', included: true },
      { label: 'Пріоритетна підтримка', included: true },
      { label: 'Усе з тарифу Premium', included: true },
    ],
  },
];
