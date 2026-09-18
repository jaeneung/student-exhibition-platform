import "server-only";

/**
 * Checks whether a project's launchUrl actually responds — used only by the
 * manual "링크 확인" action on /manage (see app/manage/actions.ts), never on
 * an ordinary page load: checking dozens of URLs, some external and
 * possibly slow or unresponsive, is real outbound network traffic with a
 * real-world latency floor no amount of caching can hide, so it has to be
 * something a teacher explicitly asks for, not a cost every visitor pays.
 *
 * launchUrl is always a complete, directly-fetchable absolute URL by the
 * time it's stored — an uploaded-file project's own /files/{id} address is
 * built with the real origin at submission time (see
 * lib/formAction.ts's resolveLaunchFields) — so this same check works
 * uniformly for external links and this app's own hosted content.
 */
const CHECK_TIMEOUT_MS = 6_000;

export async function isLinkReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      // A plain server-side check, not a real visit — no need for the
      // response to identify a browser, and being honest about what this
      // is avoids masquerading as a visitor for analytics on the other end.
      headers: { "User-Agent": "student-exhibition-platform-link-check/1.0" },
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
