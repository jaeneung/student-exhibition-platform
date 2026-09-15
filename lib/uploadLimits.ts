// Plain constant with no server-only dependency, so a Client Component
// (ProjectForm.tsx) can check a file's size before ever submitting it —
// not just for convenience, but because Netlify's own function/CDN layer
// rejects a request body above ~4.5MB with a raw 413 before this app's
// Server Action code ever runs, which would otherwise surface to the
// student as a generic "Something went wrong" with no indication that
// file size was the problem. Catching it client-side means the real
// reason is always shown, and the platform ceiling is never actually hit.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// A video specifically can go bigger than MAX_UPLOAD_BYTES by taking a
// different path entirely: the browser splits it into chunks well under the
// platform's per-request ceiling and uploads each one separately (see
// components/ProjectForm.tsx's video-relay flow and
// app/api/media-upload/*/route.ts), and the server reassembles and relays
// the complete file to GitHub Releases (lib/github.ts) rather than storing
// it itself. Capped well below what GitHub Releases can actually hold
// (2GB/asset) to keep the server-side reassemble-and-upload step comfortably
// inside a Netlify function's execution time limit.
export const MAX_GITHUB_VIDEO_BYTES = 40 * 1024 * 1024;

// Each chunk has to clear the same ~4.5MB platform ceiling as any other
// request — 3MB leaves comfortable headroom.
export const MEDIA_UPLOAD_CHUNK_BYTES = 3 * 1024 * 1024;
