import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort absolute origin for the current request, used to build a
 * public URL for an uploaded file's own /files/{id} route. Derived from
 * request headers rather than hardcoded so it keeps working under any
 * future custom domain, not just today's *.netlify.app address.
 */
export async function getRequestOrigin(): Promise<string> {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
