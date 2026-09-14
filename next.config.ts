import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Next.js caps Server Action request bodies at 1MB by default. The
      // submission form accepts uploads up to 10MB (see MAX_UPLOAD_BYTES in
      // lib/formAction.ts) — anything over 1MB was silently rejected by the
      // framework before our own size check ever ran, surfacing to the
      // student as a generic "Something went wrong" instead of our friendly
      // "file too large" message. 12mb leaves headroom above the 10MB file
      // itself for the surrounding multipart overhead and the other form
      // fields (docs recommend ~10-20KB, but the full-description field
      // alone can be up to 4000 characters).
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
