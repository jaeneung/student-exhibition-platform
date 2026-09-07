import { notFound } from "next/navigation";

/**
 * proxy.ts rewrites here (preserving the original URL in the browser) when a
 * project id doesn't exist or isn't publicly visible. This page must stay a
 * plain synchronous component: an async component that awaits data before
 * calling notFound() causes Next.js to start streaming a 200 response before
 * the check resolves, so the status can never become a real 404 (see
 * proxy.ts for the full explanation). Calling notFound() synchronously here,
 * with no data fetching, is what lets the response carry a genuine 404.
 */
export default function Gone() {
  notFound();
}
