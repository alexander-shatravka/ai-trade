/**
 * Mock fixtures. Not lorem ipsum — each one exercises a different branch of the
 * UI, which is the whole point of developing against the mock:
 *
 *   iphone   high confidence (0.93), an uncertain attribute, a low-quality photo
 *   tyres    high confidence, complete attributes, no missing angles
 *   unknown  low confidence (0.45) → the clarification screen, no invented data
 */
import type {
  AttributeField,
  SellerAnalysisResult,
} from '@ai-trade/contracts';

export interface Fixture {
  /** Attribute schema of the recognised category, for rendering the form. */
  attributeSchema: AttributeField[];
  result: SellerAnalysisResult;
}

const DISCLAIMER =
  'Рекомендація базується на ринкових даних і не є експертною оцінкою майна.';

const iphone: Fixture = {
  attributeSchema: [
    { key: 'brand', label: 'Бренд', type: 'string', required: true },
    { key: 'model', label: 'Модель', type: 'string', required: true },
    {
      key: 'storage',
      label: "Пам'ять",
      type: 'enum',
      unit: 'ГБ',
      options: ['64', '128', '256', '512', '1024'],
      required: true,
    },
    { key: 'color', label: 'Колір', type: 'string', required: false },
    { key: 'batteryHealth', label: 'Стан батареї', type: 'number', unit: '%', required: false },
  ],
  result: {
    recognition: {
      productType: 'Смартфон',
      brand: 'Apple',
      model: 'iPhone 13 Pro',
      categoryId: 'cat_phones_smartphones',
      categoryPath: ['Електроніка', 'Телефони', 'Смартфони'],
      confidence: 0.93,
      uncertainFields: ['storage'],
    },
    condition: {
      value: 'GOOD',
      reasoning: 'Екран без подряпин, на нижній рамці легкі потертості.',
      evidence: [
        { mediaId: 'media_2', note: 'Потертості на нижній рамці' },
        { mediaId: 'media_1', note: 'Екран без видимих подряпин' },
      ],
    },
    copy: {
      title: 'Apple iPhone 13 Pro 128 ГБ Graphite, батарея 89%',
      description: [
        'Продаю iPhone 13 Pro у кольорі Graphite, 128 ГБ. Ємність акумулятора — 89%, ' +
          'телефон упевнено тримає повний день роботи.',
        '',
        'Стан: екран без подряпин, захисне скло стояло з першого дня. ' +
          'На нижній рамці є легкі потертості — їх видно на другому фото.',
        '',
        'Комплект: телефон, кабель USB-C — Lightning, коробка збереглася. ' +
          'Причина продажу — перехід на іншу модель.',
      ].join('\n'),
      keywords: [
        'iphone 13 pro',
        'айфон 13 про',
        'apple',
        'смартфон',
        '128 гб',
        'graphite',
        'бу телефон',
        'айфон київ',
      ],
      alternativeTitles: [
        'iPhone 13 Pro 128 ГБ Graphite, ідеальний стан, повний комплект',
        'Apple iPhone 13 Pro 128 ГБ — акумулятор 89%, коробка в наявності',
      ],
    },
    attributes: {
      brand: 'Apple',
      model: 'iPhone 13 Pro',
      storage: '128',
      color: 'Graphite',
      batteryHealth: 89,
    },
    price: {
      quickSaleKop: 2_100_000,
      optimalKop: 2_450_000,
      maximumKop: 2_790_000,
      currency: 'UAH',
      market: {
        medianKop: 2_450_000,
        p25Kop: 2_180_000,
        p75Kop: 2_740_000,
        sampleSize: 43,
        medianSellDays: 12,
      },
      reasoning: {
        quickSale: 'На 14% нижче медіани — такі оголошення зазвичай продаються за 3–5 днів.',
        optimal: 'Медіана по 43 схожих оголошеннях за останні 60 днів.',
        maximum: 'Реально отримати з повним комплектом і коробкою; очікуйте 25–35 днів.',
      },
      confidence: 0.81,
      disclaimer: DISCLAIMER,
    },
    forecast: {
      sellProbability: 78,
      estimatedDays: 9,
      explanation:
        'Ціна близька до медіани, повний комплект і 3 фото — це вище середнього по категорії.',
    },
    photoAdvice: {
      missingAngles: [
        { angle: 'screen_on', label: 'Екран увімкнено', impact: '+18% до довіри покупців' },
        { angle: 'box', label: 'Коробка й комплект', impact: '+9% до ціни' },
      ],
      lowQualityMediaIds: ['media_3'],
    },
    generatedFields: [
      'title',
      'description',
      'attributes.brand',
      'attributes.model',
      'attributes.storage',
      'attributes.color',
      'attributes.batteryHealth',
      'condition',
      'priceKop',
    ],
  },
};

const tyres: Fixture = {
  attributeSchema: [
    { key: 'brand', label: 'Бренд', type: 'string', required: true },
    { key: 'size', label: 'Розмір', type: 'string', required: true },
    { key: 'season', label: 'Сезон', type: 'enum', options: ['Зима', 'Літо', 'Всесезон'], required: true },
    { key: 'treadDepth', label: 'Залишок протектора', type: 'number', unit: 'мм', required: false },
    { key: 'quantity', label: 'Кількість', type: 'number', unit: 'шт', required: true },
  ],
  result: {
    recognition: {
      productType: 'Шини',
      brand: 'Michelin',
      model: 'X-Ice North 4',
      categoryId: 'cat_auto_tyres',
      categoryPath: ['Авто', 'Шини та диски', 'Шини'],
      confidence: 0.87,
      uncertainFields: [],
    },
    condition: {
      value: 'LIKE_NEW',
      reasoning: 'Протектор майже без зносу, шипи на місці.',
      evidence: [{ mediaId: 'media_1', note: 'Глибина протектора близька до нової' }],
    },
    copy: {
      title: 'Michelin X-Ice North 4 205/55 R16 зимові шиповані, 4 шт',
      description: [
        'Продаю комплект зимових шипованих шин Michelin X-Ice North 4, розмір 205/55 R16. ' +
          'Використані один сезон, пробіг близько 6000 км.',
        '',
        'Стан: залишок протектора 8 мм із 9 нових, шипи на місці, порізів і грижі немає.',
        '',
        'Продаю разом із переходом на інший розмір диска. Самовивіз або Нова пошта.',
      ].join('\n'),
      keywords: [
        'michelin x-ice north 4',
        'зимові шини',
        '205/55 r16',
        'шиповані шини',
        'мішлен',
        'шини бу',
        'зимова гума',
        'комплект шин',
      ],
      alternativeTitles: [
        'Зимові шини Michelin X-Ice North 4 205/55 R16, один сезон',
        'Комплект шипованих шин Michelin 205/55 R16, протектор 8 мм',
      ],
    },
    attributes: {
      brand: 'Michelin',
      size: '205/55 R16',
      season: 'Зима',
      treadDepth: 8,
      quantity: 4,
    },
    price: {
      quickSaleKop: 720_000,
      optimalKop: 840_000,
      maximumKop: 960_000,
      currency: 'UAH',
      market: {
        medianKop: 840_000,
        p25Kop: 735_000,
        p75Kop: 945_000,
        sampleSize: 27,
        medianSellDays: 21,
      },
      reasoning: {
        quickSale: 'На 14% нижче медіани — сезонні товари поза сезоном продаються повільніше.',
        optimal: 'Медіана по 27 схожих комплектах за останні 60 днів.',
        maximum: 'Верхня межа ринку для комплекту з таким залишком протектора.',
      },
      confidence: 0.74,
      disclaimer: DISCLAIMER,
    },
    forecast: {
      sellProbability: 54,
      estimatedDays: 24,
      explanation:
        'Ціна на рівні медіани, але зимові шини влітку продаються довше — врахуйте сезон.',
    },
    photoAdvice: {
      missingAngles: [
        { angle: 'tread', label: 'Крупний план протектора', impact: '+22% до довіри покупців' },
      ],
      lowQualityMediaIds: [],
    },
    generatedFields: [
      'title',
      'description',
      'attributes.brand',
      'attributes.size',
      'attributes.season',
      'attributes.treadDepth',
      'attributes.quantity',
      'condition',
      'priceKop',
    ],
  },
};

export const fixtures: Fixture[] = [iphone, tyres];

/**
 * The low-confidence case. Kept separate because it must never be returned as
 * a draft — it is the input to the clarification screen.
 */
export const lowConfidenceFixture = {
  productType: 'Побутова техніка',
  confidence: 0.45,
  uncertainFields: ['brand', 'model', 'categoryId'],
};
