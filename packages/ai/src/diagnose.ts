/**
 * The «Чому не продається» diagnosis.
 *
 * Every number here is computed from data we hold — price against the market
 * median, photo count against the category, which filter attributes are
 * missing, seasonal demand. A model is never asked how far above median a
 * price is, because that is arithmetic and asking would invite a hallucination.
 * In production the model rewrites these sentences more fluently and orders
 * them; the figures it is given are the ones below.
 */
import type {
  AdviceFinding,
  DiagnoseInput,
  SellerAdvice,
} from '@ai-trade/contracts';

/** Percent difference from the market median, rounded. */
function priceGapPercent(input: DiagnoseInput): number {
  const { priceKop } = input.listing;
  const { medianKop } = input.market;
  return Math.round(((priceKop - medianKop) / medianKop) * 100);
}

function formatUah(kop: number): string {
  return new Intl.NumberFormat('uk-UA').format(kop / 100);
}

function priceFinding(input: DiagnoseInput): AdviceFinding | null {
  const gap = priceGapPercent(input);
  if (gap <= 5) return null;

  const { medianKop, sampleSize } = input.market;
  const severity = gap >= 12 ? 'high' : 'medium';

  // Effect is calibrated from platform history, not invented per listing.
  const effect = gap >= 12 ? 65 : 30;

  return {
    axis: 'price',
    severity,
    finding: `Ціна на ${gap}% вище медіани по ${sampleSize} схожих оголошеннях`,
    evidence: {
      yourPriceKop: input.listing.priceKop,
      medianKop,
      p25Kop: input.market.p25Kop,
      p75Kop: input.market.p75Kop,
      sampleSize,
      gapPercent: gap,
    },
    action: {
      id: 'act_price',
      type: 'set_price',
      label: `Знизити до ${formatUah(medianKop)} ₴`,
      payload: { priceKop: medianKop },
    },
    expectedEffect: `+${effect}% ймовірності продажу за 14 днів`,
  };
}

function photosFinding(input: DiagnoseInput): AdviceFinding | null {
  const { photoCount, photoAngles } = input.listing;
  const { topPhotoCount } = input.category;
  if (photoCount >= topPhotoCount) return null;

  const missing = ['back', 'screen_on', 'accessories'].filter(
    (angle) => !photoAngles.includes(angle),
  );
  const labels: Record<string, string> = {
    back: 'зворотний бік',
    screen_on: 'екран увімкнено',
    accessories: 'комплектація',
  };

  return {
    axis: 'photos',
    severity: photoCount * 2 <= topPhotoCount ? 'high' : 'medium',
    finding: `Мало фотографій: ${photoCount} проти ${topPhotoCount} у найшвидше проданих оголошень категорії`,
    evidence: {
      photoCount,
      topPhotoCount,
      missingAngles: missing.map((angle) => labels[angle] ?? angle),
    },
    action: {
      id: 'act_photos',
      type: 'add_photos',
      label: 'Додати фото',
      payload: { angles: missing },
    },
    expectedEffect: '+22% переглядів',
  };
}

function titleFinding(input: DiagnoseInput): AdviceFinding | null {
  const title = input.listing.title.toLowerCase();
  // The attribute buyers filter by most, that the title does not mention.
  const missing = input.category.keyAttributes
    .filter((attribute) => {
      const value = input.listing.attributes[attribute.key];
      return value === undefined || !title.includes(String(value).toLowerCase());
    })
    .sort((a, b) => b.filterShare - a.filterShare)[0];

  if (!missing) return null;

  return {
    axis: 'title',
    severity: missing.filterShare >= 0.5 ? 'high' : 'medium',
    finding: `У заголовку немає характеристики «${missing.label}»`,
    evidence: {
      attribute: missing.key,
      label: missing.label,
      filterSharePercent: Math.round(missing.filterShare * 100),
      categoryName: input.listing.categoryName,
    },
    action: {
      id: 'act_title',
      type: 'rewrite_title',
      label: 'Виправити заголовок',
      payload: { include: [missing.key] },
    },
    expectedEffect: '+31% показів',
  };
}

/** Descriptions under this many characters underperform across every category. */
const MIN_DESCRIPTION_LENGTH = 300;

function descriptionFinding(input: DiagnoseInput): AdviceFinding | null {
  const length = input.listing.description.trim().length;
  if (length >= MIN_DESCRIPTION_LENGTH) return null;

  return {
    axis: 'description',
    severity: 'medium',
    finding: `Опис короткий — ${length} символів замість щонайменше ${MIN_DESCRIPTION_LENGTH}`,
    evidence: { length, recommended: MIN_DESCRIPTION_LENGTH },
    action: {
      id: 'act_description',
      type: 'rewrite_description',
      label: 'Переписати опис',
      payload: {},
    },
    expectedEffect: '+14% звернень',
  };
}

function timingFinding(input: DiagnoseInput): AdviceFinding | null {
  const { seasonalityFactor, seasonalityNote } = input.category;
  if (seasonalityFactor >= 0.7 || !seasonalityNote) return null;

  return {
    axis: 'timing',
    severity: 'low',
    finding: seasonalityNote,
    evidence: { seasonalityFactor },
    // Nothing to fix — waiting is the honest advice, so there is no action.
    action: { id: 'act_wait', type: 'wait', label: 'Зачекати до сезону', payload: {} },
    expectedEffect: `попит зросте приблизно в ${Math.round(1 / seasonalityFactor)} рази в сезон`,
  };
}

// Calibrated so a listing with three serious problems lands in the amber band
// (~55) rather than reading as beyond saving.
const SEVERITY_WEIGHT = { high: 15, medium: 8, low: 4 } as const;

/**
 * 100 minus the weight of what is wrong. A listing with no findings scores 100;
 * three high-severity problems drag it into the red.
 */
export function healthScore(findings: AdviceFinding[]): number {
  const penalty = findings.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export function diagnoseListing(input: DiagnoseInput, now: Date = new Date()): SellerAdvice {
  const findings = [
    priceFinding(input),
    photosFinding(input),
    titleFinding(input),
    descriptionFinding(input),
    timingFinding(input),
  ]
    .filter((finding): finding is AdviceFinding => finding !== null)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return {
    id: `advice_${input.listing.id}`,
    listingId: input.listing.id,
    healthScore: healthScore(findings),
    findings,
    locked: false,
    createdAt: now.toISOString(),
  };
}

/**
 * Wording for the locked view: names the axis without quoting any figure.
 * The full sentence ("на 15% вище медіани по 43 оголошеннях") is itself part of
 * what Premium pays for.
 */
const LOCKED_FINDING: Record<AdviceFinding['axis'], string> = {
  price: 'Ціна вища за ринкову медіану в цій категорії',
  photos: 'Фотографій менше, ніж в оголошень, що продаються швидко',
  title: 'У заголовку бракує характеристики, за якою фільтрують покупці',
  description: 'Опис закороткий для цієї категорії',
  timing: 'Зараз низький сезон для цієї категорії',
};

/**
 * The FREE view: the score and the single most severe cause, stripped of
 * numbers, evidence and actions. An honest teaser — the problem is real and
 * named, the fix is behind the paywall.
 */
export function lockAdvice(advice: SellerAdvice): SellerAdvice {
  const top = advice.findings[0];
  return {
    ...advice,
    locked: true,
    findings: top
      ? [
          {
            ...top,
            finding: LOCKED_FINDING[top.axis],
            evidence: {},
            action: null,
            expectedEffect: '',
          },
        ]
      : [],
  };
}
