/**
 * Deterministic mock of the AI Seller pipeline.
 *
 * The same input always yields the same output, which is what makes e2e tests
 * stable — a test must not fail because the model phrased a title differently
 * today. It also means the product runs with no API key and no spend.
 */
import type {
  AnalyzeRequest,
  AttributeField,
  JobProgress,
  SellerAnalysisResult,
} from '@ai-trade/contracts';
import { MIN_RECOGNITION_CONFIDENCE } from '@ai-trade/contracts';
import { fixtures, lowConfidenceFixture, type Fixture } from './fixtures';
import {
  LowConfidenceError,
  type AiProvider,
  type AnalyzeOptions,
} from './provider';

/** FNV-1a. Small, dependency-free, and stable across runs and platforms. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * The pipeline steps, in the order docs/05-ai-architecture.md defines them.
 * Steps 3 and 6 are marked because they are not model calls: market analysis is
 * SQL and the forecast is a formula. The AI never states a number that can be
 * computed.
 */
const STEPS: { label: string; ms: number; usesModel: boolean }[] = [
  { label: 'Розпізнаю товар на фото', ms: 900, usesModel: true },
  { label: 'Визначаю характеристики', ms: 700, usesModel: true },
  { label: 'Оцінюю стан за фотографіями', ms: 600, usesModel: true },
  { label: 'Покращую фото', ms: 500, usesModel: false },
  { label: 'Пишу заголовок і опис', ms: 900, usesModel: true },
  { label: 'Аналізую ринок', ms: 700, usesModel: false },
  { label: 'Рахую рекомендовану ціну', ms: 600, usesModel: true },
  { label: 'Прогнозую ймовірність продажу', ms: 400, usesModel: false },
];

export const pipelineSteps = STEPS.map((step) => step.label);

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface MockProviderOptions {
  /**
   * Forces the low-confidence branch, so the clarification screen can be
   * developed and demoed without hunting for an input that triggers it.
   */
  forceLowConfidence?: boolean;
  /** Multiplies every step delay. 0 makes the pipeline instant, for tests. */
  speed?: number;
}

export class MockProvider implements AiProvider {
  constructor(private readonly options: MockProviderOptions = {}) {}

  /** Which fixture a given input maps to. Exposed so tests can assert determinism. */
  selectFixture(input: AnalyzeRequest): Fixture {
    const seed = hashSeed(input.mediaIds.join('') + (input.hint ?? ''));
    return fixtures[seed % fixtures.length] as Fixture;
  }

  attributeSchemaFor(input: AnalyzeRequest): AttributeField[] {
    return this.selectFixture(input).attributeSchema;
  }

  async analyzeForSelling(
    input: AnalyzeRequest,
    options: AnalyzeOptions = {},
  ): Promise<SellerAnalysisResult> {
    const sleep = options.sleep ?? defaultSleep;
    const speed = this.options.speed ?? 1;

    // A hint mentioning an unidentifiable item is the natural way to reach the
    // low-confidence branch; the flag forces it regardless of input.
    const lowConfidence =
      this.options.forceLowConfidence === true ||
      /не знаю|незрозуміл|що це/i.test(input.hint ?? '');

    for (const [index, step] of STEPS.entries()) {
      const progress: JobProgress = {
        step: step.label,
        index: index + 1,
        total: STEPS.length,
        percent: Math.round(((index + 1) / STEPS.length) * 100),
      };
      options.onProgress?.(progress);
      await sleep(step.ms * speed);

      // Recognition is the first step, and a low-confidence result stops the
      // pipeline there rather than inventing the rest of the listing.
      if (index === 0 && lowConfidence) {
        throw new LowConfidenceError(
          lowConfidenceFixture.confidence,
          lowConfidenceFixture.productType,
        );
      }
    }

    const fixture = this.selectFixture(input);
    const result = structuredClone(fixture.result);

    // Photo advice refers to the media the caller actually sent, so the UI can
    // badge the right thumbnail instead of a fixture id that does not exist.
    result.photoAdvice.lowQualityMediaIds = result.photoAdvice.lowQualityMediaIds
      .map((id) => remapMediaId(id, input.mediaIds))
      .filter((id): id is string => id !== undefined);
    result.condition.evidence = result.condition.evidence
      .map((item) => {
        const mediaId = remapMediaId(item.mediaId, input.mediaIds);
        return mediaId ? { ...item, mediaId } : undefined;
      })
      .filter((item): item is { mediaId: string; note: string } => item !== undefined);

    if (result.recognition.confidence < MIN_RECOGNITION_CONFIDENCE) {
      throw new LowConfidenceError(
        result.recognition.confidence,
        result.recognition.productType,
      );
    }

    return result;
  }
}

/** Fixture ids are media_1..media_n; map them onto the caller's real ids. */
function remapMediaId(fixtureId: string, mediaIds: string[]): string | undefined {
  const index = Number(fixtureId.replace('media_', '')) - 1;
  return mediaIds[index];
}
