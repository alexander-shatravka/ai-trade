/**
 * Auth contracts. Mirrors CurrentUser / SubscriptionState / AuthSuccess in
 * openapi.yaml.
 *
 * Real authentication is Google OAuth or a magic link, exchanged for a short
 * JWT access token plus a rotating refresh token in an httpOnly cookie
 * (docs/02 §7). None of that can exist on a static site, so the app ships a
 * mock session — see apps/web/app/composables/useAuth.ts.
 */
import { z } from 'zod';
import { planCodeSchema } from './plan';

export const userRoleSchema = z.enum(['USER', 'BUSINESS', 'MODERATOR', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const subscriptionStatusSchema = z.enum([
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'EXPIRED',
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

/** null means unlimited, which is deliberately different from 0. */
const limitSchema = z.int().min(0).nullable();

export const subscriptionStateSchema = z.object({
  planCode: planCodeSchema,
  planName: z.string(),
  status: subscriptionStatusSchema,
  currentPeriodEnd: z.iso.datetime().nullable(),
  usage: z.object({
    activeListings: z.int().min(0),
    aiGenerations: z.int().min(0),
    aiDiagnoses: z.int().min(0),
  }),
  limits: z.object({
    activeListings: limitSchema,
    aiGenerations: limitSchema,
    /** Feature flags the plan unlocks; drives what the UI offers, not just shows. */
    sellerAdvice: z.boolean(),
    advancedStats: z.boolean(),
    competitorAnalysis: z.boolean(),
    shopPage: z.boolean(),
    bulkImport: z.boolean(),
    aiReplies: z.boolean(),
  }),
});
export type SubscriptionState = z.infer<typeof subscriptionStateSchema>;

export const currentUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
  role: userRoleSchema,
  /** Required before the first publication — the main barrier against fraud. */
  phoneVerified: z.boolean(),
  ratingAvg: z.number().min(0).max(5),
  ratingCount: z.int().min(0),
  successfulSales: z.int().min(0),
  createdAt: z.iso.datetime(),
  plan: subscriptionStateSchema,
});
export type CurrentUser = z.infer<typeof currentUserSchema>;

export const authSuccessSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.int().positive(),
  user: currentUserSchema,
});
export type AuthSuccess = z.infer<typeof authSuccessSchema>;

export const magicLinkRequestSchema = z.object({
  email: z.email('Введіть коректну email-адресу'),
});
export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;

export const magicLinkVerifySchema = z.object({
  token: z.string().min(1),
});
export type MagicLinkVerify = z.infer<typeof magicLinkVerifySchema>;
