"use client";

import { useState } from "react";

/**
 * Renders `src` as a cover image, falling back to the category gradient/icon
 * if it fails to load. Needed because an auto-generated thumbnail (see
 * lib/thumbnail.ts) can legitimately fail — most commonly a locally-tested
 * uploaded-file project, whose /files/{id} address isn't publicly reachable
 * for the screenshot service to capture — and a broken-image icon looks far
 * worse than just falling back to the same placeholder an unset cover image
 * already gets.
 */
export function CoverImage({
  src,
  gradient,
  icon,
  className,
}: {
  src: string;
  gradient: string;
  icon: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className ?? ""}`}
        aria-hidden="true"
      >
        {icon}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" onError={() => setFailed(true)} className={className} />
  );
}
