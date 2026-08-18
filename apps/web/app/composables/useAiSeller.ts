/**
 * Drives the AI Seller flow and owns the seam to the backend.
 *
 * Today the pipeline runs against MockProvider in the browser, so the flow is
 * demoable with no API, no keys and no spend. When apps/api exists, only
 * `runAnalysis` changes — it will POST to /ai/seller/analyze and poll
 * GET /ai/jobs/{id}. Everything below that line already speaks the contract
 * types, so nothing else in the UI moves.
 */
import { MockProvider, LowConfidenceError, pipelineSteps } from '@ai-trade/ai';
import type {
  AnalyzeRequest,
  AttributeField,
  JobProgress,
  SellerAnalysisResult,
} from '@ai-trade/contracts';

export type SellerStage = 'upload' | 'analyzing' | 'review' | 'unrecognized';

export interface UploadedPhoto {
  /** Stands in for Media.id until S3 upload exists. */
  id: string;
  name: string;
  /** Object URL for preview; revoked when the photo is removed. */
  url: string;
}

const provider = new MockProvider();

export function useAiSeller() {
  const stage = ref<SellerStage>('upload');
  const photos = ref<UploadedPhoto[]>([]);
  const hint = ref('');

  const progress = ref<JobProgress | null>(null);
  const result = ref<SellerAnalysisResult | null>(null);
  const attributeSchema = ref<AttributeField[]>([]);
  const elapsedMs = ref(0);
  const lowConfidence = ref<{ confidence: number; productType: string | null } | null>(null);

  const totalSteps = pipelineSteps.length;

  function addPhotos(files: File[]) {
    const room = 10 - photos.value.length;
    for (const file of files.slice(0, room)) {
      photos.value.push({
        id: `media_local_${crypto.randomUUID()}`,
        name: file.name,
        url: URL.createObjectURL(file),
      });
    }
  }

  function removePhoto(id: string) {
    const photo = photos.value.find((p) => p.id === id);
    if (photo) URL.revokeObjectURL(photo.url);
    photos.value = photos.value.filter((p) => p.id !== id);
  }

  /** The seam: swap this body for the HTTP call, nothing else changes. */
  async function runAnalysis(request: AnalyzeRequest): Promise<SellerAnalysisResult> {
    return provider.analyzeForSelling(request, {
      onProgress: (p) => {
        progress.value = p;
      },
    });
  }

  async function analyze() {
    if (photos.value.length === 0) return;

    stage.value = 'analyzing';
    progress.value = null;
    result.value = null;
    lowConfidence.value = null;

    const startedAt = Date.now();
    const request: AnalyzeRequest = {
      mediaIds: photos.value.map((p) => p.id),
      hint: hint.value.trim() || undefined,
      enhancePhotos: true,
    };

    try {
      attributeSchema.value = provider.attributeSchemaFor(request);
      result.value = await runAnalysis(request);
      elapsedMs.value = Date.now() - startedAt;
      stage.value = 'review';
    } catch (error) {
      if (error instanceof LowConfidenceError) {
        // Rule: we do not invent a listing we could not recognise.
        lowConfidence.value = {
          confidence: error.confidence,
          productType: error.productType,
        };
        stage.value = 'unrecognized';
        return;
      }
      throw error;
    }
  }

  function restart() {
    for (const photo of photos.value) URL.revokeObjectURL(photo.url);
    photos.value = [];
    hint.value = '';
    result.value = null;
    progress.value = null;
    lowConfidence.value = null;
    stage.value = 'upload';
  }

  return {
    stage,
    photos,
    hint,
    progress,
    result,
    attributeSchema,
    elapsedMs,
    lowConfidence,
    totalSteps,
    pipelineSteps,
    addPhotos,
    removePhoto,
    analyze,
    restart,
  };
}
