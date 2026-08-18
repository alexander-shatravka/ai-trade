/**
 * Restores the stored session once, before the app renders on the client.
 * Client-only by design: the mock session lives in localStorage, so the server
 * render is always the signed-out view and hydration agrees with it.
 */
export default defineNuxtPlugin(() => {
  useAuth().restore();
});
