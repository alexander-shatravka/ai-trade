/**
 * Protects the account area. The session is restored on the client only, so on
 * the server this middleware stands aside and lets the client decide — with a
 * prerendered site the server could not know either way.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  const { isAuthenticated } = useAuth();
  if (isAuthenticated.value) return;

  return navigateTo({ path: '/login', query: { redirect: to.fullPath } });
});
