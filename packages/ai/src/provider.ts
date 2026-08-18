/**
 * The AI abstraction. Business logic knows this interface, never a vendor name,
 * so switching provider is a config change rather than a code change.
 *
 * Implementations: MockProvider (here), OpenAiProvider (once keys exist), plus
 * the CachedProvider and MeteredProvider decorators. apps/api will consume this
 * same package rather than redefining the interface.
 */
import type {
  AnalyzeRequest,
  JobProgress,
  SellerAnalysisResult,
} from '@ai-trade/contracts';

export interface AnalyzeOptions {
  /** Called as the pipeline advances, so the UI can show progress from second one. */
  onProgress?: (progress: JobProgress) => void;
  /** Injectable delay, so tests run instantly and the UI can still feel real. */
  sleep?: (ms: number) => Promise<void>;
}

export interface AiProvider {
  /**
   * The «Продай за мене» pipeline: recognition → copy → market → price →
   * forecast → photo advice.
   */
  analyzeForSelling(
    input: AnalyzeRequest,
    options?: AnalyzeOptions,
  ): Promise<SellerAnalysisResult>;
}

/** Thrown when the item could not be identified confidently enough to continue. */
export class LowConfidenceError extends Error {
  constructor(
    readonly confidence: number,
    readonly productType: string | null,
  ) {
    super('Не вдалося точно визначити товар');
    this.name = 'LowConfidenceError';
  }
}
