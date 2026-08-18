/**
 * AI Seller — «Продай за мене». Shapes mirror openapi.yaml
 * (SellerAnalysisResult, PriceRecommendation, ListingCopy, AiJob).
 *
 * Money is in kopiyky here as everywhere else, so the numbers cross the wire
 * as integers and only become text in the UI.
 */
import { z } from 'zod';
import { itemConditionSchema } from './listing';
import { confidenceSchema, priceKopSchema } from './primitives';

/** Below this the UI must say it could not identify the item, not guess. */
export const MIN_RECOGNITION_CONFIDENCE = 0.6;

export const analyzeRequestSchema = z.object({
  mediaIds: z.array(z.string()).min(1, 'Додайте хоча б одне фото').max(10),
  hint: z.string().max(300).optional(),
  cityId: z.string().optional(),
  enhancePhotos: z.boolean().default(true),
});
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export const aiJobStatusSchema = z.enum([
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'DEGRADED',
]);
export type AiJobStatus = z.infer<typeof aiJobStatusSchema>;

export const jobProgressSchema = z.object({
  step: z.string(),
  index: z.int().min(0),
  total: z.int().min(1),
  percent: z.int().min(0).max(100),
});
export type JobProgress = z.infer<typeof jobProgressSchema>;

export const recognitionSchema = z.object({
  productType: z.string(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  categoryId: z.string(),
  categoryPath: z.array(z.string()),
  confidence: confidenceSchema,
  /** Fields the model was unsure about — highlighted in the form before publish. */
  uncertainFields: z.array(z.string()),
});
export type Recognition = z.infer<typeof recognitionSchema>;

export const conditionAssessmentSchema = z.object({
  value: itemConditionSchema,
  reasoning: z.string(),
  /** Every claim about a defect is tied to the photo that shows it. */
  evidence: z.array(z.object({ mediaId: z.string(), note: z.string() })),
});
export type ConditionAssessment = z.infer<typeof conditionAssessmentSchema>;

export const listingCopySchema = z.object({
  title: z.string().max(70),
  description: z.string(),
  keywords: z.array(z.string()),
  alternativeTitles: z.array(z.string()).max(2),
});
export type ListingCopy = z.infer<typeof listingCopySchema>;

/**
 * Market figures come from SQL over our own listings — never from a model.
 * The model only writes the sentences in `reasoning` around them.
 */
export const marketStatsSchema = z.object({
  medianKop: priceKopSchema,
  p25Kop: priceKopSchema,
  p75Kop: priceKopSchema,
  sampleSize: z.int().min(0),
  medianSellDays: z.int().min(0),
});
export type MarketStats = z.infer<typeof marketStatsSchema>;

export const priceRecommendationSchema = z.object({
  quickSaleKop: priceKopSchema,
  optimalKop: priceKopSchema,
  maximumKop: priceKopSchema,
  currency: z.literal('UAH'),
  market: marketStatsSchema,
  reasoning: z.object({
    quickSale: z.string(),
    optimal: z.string(),
    maximum: z.string(),
  }),
  confidence: confidenceSchema,
  disclaimer: z.string(),
});
export type PriceRecommendation = z.infer<typeof priceRecommendationSchema>;

export const forecastSchema = z.object({
  sellProbability: z.int().min(0).max(100),
  estimatedDays: z.int().min(0),
  explanation: z.string(),
});
export type Forecast = z.infer<typeof forecastSchema>;

export const photoAdviceSchema = z.object({
  missingAngles: z.array(
    z.object({ angle: z.string(), label: z.string(), impact: z.string() }),
  ),
  lowQualityMediaIds: z.array(z.string()),
});
export type PhotoAdvice = z.infer<typeof photoAdviceSchema>;

export const sellerAnalysisResultSchema = z.object({
  recognition: recognitionSchema,
  condition: conditionAssessmentSchema,
  copy: listingCopySchema,
  attributes: z.record(z.string(), z.unknown()),
  price: priceRecommendationSchema,
  forecast: forecastSchema,
  photoAdvice: photoAdviceSchema,
  /** Which fields the UI should mark as AI-generated, for aiAcceptedFields. */
  generatedFields: z.array(z.string()),
});
export type SellerAnalysisResult = z.infer<typeof sellerAnalysisResultSchema>;

export const aiJobSchema = z.object({
  id: z.string(),
  type: z.literal('VISION_RECOGNIZE'),
  status: aiJobStatusSchema,
  progress: jobProgressSchema,
  result: sellerAnalysisResultSchema.nullable(),
  error: z.string().nullable(),
  /** true → produced by a fallback; the UI says quality may be lower. */
  degraded: z.boolean(),
  latencyMs: z.int().nullable(),
});
export type AiJob = z.infer<typeof aiJobSchema>;

/**
 * The attribute schema of a category, used to render the characteristics form.
 * In production this comes from Category.attributeSchema.
 */
export const attributeFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['string', 'number', 'enum', 'boolean']),
  unit: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
});
export type AttributeField = z.infer<typeof attributeFieldSchema>;
