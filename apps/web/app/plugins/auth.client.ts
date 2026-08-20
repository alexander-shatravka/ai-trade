/**
 * Restores the stored session on the client, before the app renders.
 *
 * Safe to do this early because every screen that depends on the session is
 * wrapped in <ClientOnly>: the server renders the loading fallback and Vue
 * does not try to hydrate the signed-in markup against it.
 */
export default defineNuxtPlugin(() => {
  useAuth().restore();
});
