// Plain constant with no server-only dependency, so a Client Component
// (ProjectForm.tsx) can check a file's size before ever submitting it —
// not just for convenience, but because Netlify's own function/CDN layer
// rejects a request body above ~4.5MB with a raw 413 before this app's
// Server Action code ever runs, which would otherwise surface to the
// student as a generic "Something went wrong" with no indication that
// file size was the problem. Catching it client-side means the real
// reason is always shown, and the platform ceiling is never actually hit.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// A video or PDF specifically can go bigger than MAX_UPLOAD_BYTES by taking
// a different path entirely: the browser splits it into chunks well under
// the platform's per-request ceiling and uploads each one separately (see
// components/ProjectForm.tsx's media-relay flow and
// app/api/media-upload/*/route.ts), and the server reassembles and relays
// the complete file to GitHub Releases (lib/github.ts) rather than storing
// it itself. Capped well below what GitHub Releases can actually hold
// (2GB/asset) to keep the server-side reassemble-and-upload step comfortably
// inside a Netlify function's execution time limit.
export const MAX_GITHUB_RELAY_BYTES = 40 * 1024 * 1024;

// Each chunk is a plain POST to a Route Handler (app/api/media-upload/chunk),
// which turns out to have a *lower* real ceiling on Netlify than the ~4.5MB
// enforced for Server Actions (see MAX_UPLOAD_BYTES above) — verified
// directly against the live site: a raw body around 1.67MB succeeded, ~1.68MB
// came back 413 before this app's code ever ran, for this route specifically.
// 1MB leaves comfortable headroom below that.
export const MEDIA_UPLOAD_CHUNK_BYTES = 1 * 1024 * 1024;
