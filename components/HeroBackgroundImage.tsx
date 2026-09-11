"use client";

import { useState } from "react";

/** A decorative background image that just disappears if it fails to load
 * (e.g. an auto-generated thumbnail for a locally-tested file upload —
 * see lib/thumbnail.ts) rather than showing a broken-image glyph over the
 * gradient it's layered on. */
export function HeroBackgroundImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover opacity-25"
    />
  );
}
