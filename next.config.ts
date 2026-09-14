import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Next.js caps Server Action request bodies at 1MB by default. The
      // submission form accepts uploads up to 4MB (see MAX_UPLOAD_BYTES in
      // lib/formAction.ts) — anything over 1MB was silently rejected by the
      // framework before our own size check ever ran, surfacing to the
      // student as a generic "Something went wrong" instead of our friendly
      // "file too large" message.
      //
      // 4MB, not higher: Netlify's own function/CDN layer enforces its own
      // hard ceiling around 4.5MB raw body size (the classic AWS Lambda/API
      // Gateway synchronous-invocation limit — 6MB once the body is
      // base64-encoded for transport, which is what 6MB * 3/4 comes from),
      // independent of anything configured here. Verified directly against
      // the live site: 4.45MB succeeded, 4.5MB came back 413 before even
      // reaching this app's code. Raising bodySizeLimit past that doesn't
      // help — it isn't the bottleneck. Going past ~4.3MB for real would
      // need a different upload path (e.g. uploading straight to storage
      // from the browser instead of through a Server Action), not a config
      // change.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
