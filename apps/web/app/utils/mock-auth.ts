/**
 * A stand-in session for developing against, until apps/api exists.
 *
 * ⚠️ This is NOT authentication and must never be mistaken for it. There is no
 * server, no token signing and no verification: the "session" is a plain object
 * in localStorage that anyone can edit with devtools. It exists so the signed-in
 * screens, plan gating and quota messages can be built and demoed without a
 * backend.
 *
 * The real thing (docs/02 §7) is Google OAuth or a magic link exchanged for a
 * 15-minute JWT held in memory, plus a rotating refresh token in an httpOnly
 * Secure SameSite=Lax cookie. When that lands, useAuth swaps its three calls
 * for HTTP requests and everything below can be deleted.
 */
import type { CurrentUser, PlanCode, SubscriptionState } from '@ai-trade/contracts';

export const MOCK_SESSION_KEY = 'ai-trade-mock-session';

/** Matches the FREE / PREMIUM / BUSINESS rows the Plan table will hold. */
const PLAN_TEMPLATES: Record<PlanCode, Omit<SubscriptionState, 'usage' | 'status' | 'currentPeriodEnd'>> = {
  FREE: {
    planCode: 'FREE',
    planName: 'Free',
    limits: {
      activeListings: 2,
      aiGenerations: 5,
      sellerAdvice: false,
      advancedStats: false,
      competitorAnalysis: false,
      shopPage: false,
      bulkImport: false,
      aiReplies: false,
    },
  },
  PREMIUM: {
    planCode: 'PREMIUM',
    planName: 'Premium',
    limits: {
      activeListings: 50,
      aiGenerations: 100,
      sellerAdvice: true,
      advancedStats: true,
      competitorAnalysis: true,
      shopPage: false,
      bulkImport: false,
      aiReplies: false,
    },
  },
  BUSINESS: {
    planCode: 'BUSINESS',
    planName: 'Business',
    limits: {
      activeListings: null,
      aiGenerations: null,
      sellerAdvice: true,
      advancedStats: true,
      competitorAnalysis: true,
      shopPage: true,
      bulkImport: true,
      aiReplies: true,
    },
  },
};

const USAGE: Record<PlanCode, SubscriptionState['usage']> = {
  FREE: { activeListings: 1, aiGenerations: 3, aiDiagnoses: 0 },
  PREMIUM: { activeListings: 12, aiGenerations: 27, aiDiagnoses: 4 },
  BUSINESS: { activeListings: 340, aiGenerations: 412, aiDiagnoses: 31 },
};

function subscription(code: PlanCode): SubscriptionState {
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return {
    ...PLAN_TEMPLATES[code],
    status: 'ACTIVE',
    currentPeriodEnd: code === 'FREE' ? null : periodEnd.toISOString(),
    usage: USAGE[code],
  };
}

/** Stable id per email, so signing in twice is the same account. */
function idFor(email: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < email.length; i += 1) {
    hash ^= email.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `usr_mock_${hash.toString(36)}`;
}

function nameFrom(email: string): string {
  const local = email.split('@')[0] ?? 'Користувач';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export interface MockUserOptions {
  plan?: PlanCode;
  name?: string;
  avatarUrl?: string | null;
  phoneVerified?: boolean;
}

export function createMockUser(email: string, options: MockUserOptions = {}): CurrentUser {
  const plan = options.plan ?? 'FREE';
  return {
    id: idFor(email),
    name: options.name ?? nameFrom(email),
    email,
    avatarUrl: options.avatarUrl ?? null,
    // BUSINESS accounts carry the BUSINESS role; everything else is a plain user.
    role: plan === 'BUSINESS' ? 'BUSINESS' : 'USER',
    phoneVerified: options.phoneVerified ?? plan !== 'FREE',
    ratingAvg: plan === 'FREE' ? 0 : 4.8,
    ratingCount: plan === 'FREE' ? 0 : 37,
    successfulSales: plan === 'FREE' ? 0 : 24,
    createdAt: new Date('2026-01-15T10:00:00.000Z').toISOString(),
    plan: subscription(plan),
  };
}

export interface MockSession {
  user: CurrentUser;
  /** Not a JWT. A marker so the shape matches AuthSuccess. */
  accessToken: string;
  expiresAt: number;
}

/** Real access tokens live 15 minutes; the mock mirrors that so expiry is exercised. */
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

export function createMockSession(user: CurrentUser, now = Date.now()): MockSession {
  return {
    user,
    accessToken: `mock.${user.id}.${now}`,
    expiresAt: now + ACCESS_TOKEN_TTL_MS,
  };
}

export function isExpired(session: MockSession, now = Date.now()): boolean {
  return session.expiresAt <= now;
}

/**
 * Reads a stored session. Anything unparseable or expired is treated as no
 * session rather than trusted — the same posture the real client takes when a
 * refresh fails.
 */
export function parseStoredSession(raw: string | null, now = Date.now()): MockSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as MockSession;
    if (!parsed?.user?.id || typeof parsed.expiresAt !== 'number') return null;
    return isExpired(parsed, now) ? null : parsed;
  } catch {
    return null;
  }
}

/** The accounts the login screen offers, so every plan branch is reachable. */
export const DEMO_ACCOUNTS: { email: string; plan: PlanCode; label: string; description: string }[] = [
  {
    email: 'free@aitrade.ua',
    plan: 'FREE',
    label: 'Free',
    description: '2 оголошення, 5 AI-створень, без аналізу «чому не продається»',
  },
  {
    email: 'premium@aitrade.ua',
    plan: 'PREMIUM',
    label: 'Premium',
    description: '50 оголошень, 100 AI-створень, повний AI-аналіз',
  },
  {
    email: 'business@aitrade.ua',
    plan: 'BUSINESS',
    label: 'Business',
    description: 'Без лімітів, магазин, масовий імпорт, AI-відповіді',
  },
];
