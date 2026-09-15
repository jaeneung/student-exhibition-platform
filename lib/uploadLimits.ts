// Plain constant with no server-only dependency, so a Client Component
// (ProjectForm.tsx) can check a file's size before ever submitting it —
// not just for convenience, but because Netlify's own function/CDN layer
// rejects a request body above ~4.5MB with a raw 413 before this app's
// Server Action code ever runs, which would otherwise surface to the
// student as a generic "Something went wrong" with no indication that
// file size was the problem. Catching it client-side means the real
// reason is always shown, and the platform ceiling is never actually hit.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
