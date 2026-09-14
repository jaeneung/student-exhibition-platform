import "server-only";

/**
 * True when running inside a deployed Netlify Function, false in local dev
 * (`next dev`/`next start`). NETLIFY=true is only set during Netlify's build
 * step, not inside the deployed function's own runtime environment —
 * verified by deploying a diagnostic route and inspecting process.env there.
 * NETLIFY_BLOBS_CONTEXT is what's actually present at runtime, and only when
 * Blobs are usable — used by lib/store.ts and lib/loginThrottle.ts to choose
 * between a Blobs-backed and a local (file/in-memory) backend.
 */
export function isNetlifyRuntime(): boolean {
  return Boolean(process.env.NETLIFY_BLOBS_CONTEXT);
}
