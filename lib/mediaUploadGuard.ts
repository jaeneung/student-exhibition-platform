import "server-only";

/**
 * A plain Route Handler (unlike a Server Action) gets none of Next.js's
 * built-in same-origin enforcement, and this one relays whatever it's given
 * to GitHub using our own token — worth a same-origin check so an outside
 * page can't script visitors' browsers into spending our GitHub quota on
 * arbitrary uploads. Not the only defense (see the size/content-type caps
 * in the routes themselves), just the first one.
 *
 * Derives "our own origin" from the request's own `host` header rather than
 * next/headers' ambient headers() (documented for Server Components/Actions,
 * not explicitly for Route Handlers) — every piece of information needed is
 * already on the `Request` object a route handler receives directly.
 */
export function isSameOriginRequest(request: Request): boolean {
  const host = request.headers.get("host");
  if (!host) return false;
  const proto = request.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const ownOrigin = `${proto}://${host}`;

  const origin = request.headers.get("origin");
  if (origin) return origin === ownOrigin;
  const referer = request.headers.get("referer");
  if (referer) return referer.startsWith(`${ownOrigin}/`) || referer === ownOrigin;
  return false;
}
