/**
 * Guards a page that needs a session.
 *
 * Not route middleware: the session is only known on the client, so middleware
 * would redirect *during* hydration and the page being hydrated would no longer
 * be the page the server rendered — Vue reports that as a hydration mismatch.
 *
 * Instead the page renders its loading state (which matches the server output),
 * and the redirect happens once the session has actually been restored. Pages
 * using this must render nothing sensitive until `ready` is true.
 */
export function useRequireAuth() {
  const { ready, isAuthenticated } = useAuth();
  const route = useRoute();

  watch(
    [ready, isAuthenticated],
    ([isReady, authed]) => {
      if (isReady && !authed) {
        navigateTo({ path: '/login', query: { redirect: route.fullPath } });
      }
    },
    { immediate: true },
  );

  return { ready, isAuthenticated };
}
