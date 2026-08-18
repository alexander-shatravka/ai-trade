/**
 * The session, and the seam to real authentication.
 *
 * Today every function here manipulates a mock session in localStorage. When
 * apps/api exists these become HTTP calls — POST /auth/google,
 * POST /auth/magic-link, POST /auth/magic-link/verify, POST /auth/refresh,
 * POST /auth/logout — and nothing that consumes this composable changes.
 */
import { currentUserSchema, type CurrentUser, type PlanCode } from '@ai-trade/contracts';
import { can, type Entitlement, type EntitlementResult } from '@ai-trade/utils';
import {
  createMockSession,
  createMockUser,
  MOCK_SESSION_KEY,
  parseStoredSession,
  type MockUserOptions,
} from '~/utils/mock-auth';

export function useAuth() {
  const user = useState<CurrentUser | null>('auth-user', () => null);
  const ready = useState<boolean>('auth-ready', () => false);

  const isAuthenticated = computed(() => user.value !== null);
  const plan = computed(() => user.value?.plan ?? null);

  /** Restores the session on the client. The server never has one to restore. */
  function restore() {
    if (import.meta.server) return;
    const session = parseStoredSession(localStorage.getItem(MOCK_SESSION_KEY));
    user.value = session?.user ?? null;
    ready.value = true;
  }

  function persist(nextUser: CurrentUser) {
    // Validated on the way in: a hand-edited localStorage entry must not become
    // a user object the rest of the app trusts.
    const parsed = currentUserSchema.parse(nextUser);
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(createMockSession(parsed)));
    user.value = parsed;
  }

  /** Stands in for POST /auth/magic-link/verify and POST /auth/google. */
  function signIn(email: string, options: MockUserOptions = {}) {
    persist(createMockUser(email, options));
  }

  function signInAs(email: string, planCode: PlanCode) {
    signIn(email, { plan: planCode });
  }

  /** Stands in for POST /auth/logout, which revokes the refresh token. */
  function signOut() {
    localStorage.removeItem(MOCK_SESSION_KEY);
    user.value = null;
  }

  /**
   * Entitlement check for the current plan. Guards the UI; the API will run the
   * same check server-side, because a client-side check protects nobody.
   */
  function allows(entitlement: Entitlement): EntitlementResult {
    return can(plan.value, entitlement);
  }

  return { user, ready, isAuthenticated, plan, restore, signIn, signInAs, signOut, allows };
}
