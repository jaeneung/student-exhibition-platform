import "server-only";
import { headers } from "next/headers";
import { getStore } from "@netlify/blobs";
import { isNetlifyRuntime } from "./runtime";

/**
 * Slows down password guessing against /manage/login by tracking failed
 * attempts per client IP — not per browser/cookie, so clearing cookies or
 * opening a private window doesn't reset it the way a cookie-based counter
 * would. Uses the same dual-backend pattern as lib/store.ts: Netlify Blobs
 * in production (Functions have no shared memory across invocations), a
 * plain in-memory Map in local dev.
 *
 * This is a defense-in-depth speed bump appropriate for a low-stakes school
 * tool, not a substitute for the scrypt hashing that makes each individual
 * guess expensive — see lib/auth.ts.
 */
const BLOB_STORE_NAME = "exhibition-auth";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface ThrottleRecord {
  count: number;
  windowStart: number;
}

const memoryStore = new Map<string, ThrottleRecord>();

function blobKey(ip: string): string {
  return `login-attempts:${ip}`;
}

async function readRecord(ip: string): Promise<ThrottleRecord | undefined> {
  if (isNetlifyRuntime()) {
    const store = getStore(BLOB_STORE_NAME);
    const value = await store.get(blobKey(ip), { type: "json" });
    return (value as ThrottleRecord | null) ?? undefined;
  }
  return memoryStore.get(ip);
}

async function writeRecord(ip: string, record: ThrottleRecord): Promise<void> {
  if (isNetlifyRuntime()) {
    const store = getStore(BLOB_STORE_NAME);
    await store.setJSON(blobKey(ip), record);
    return;
  }
  memoryStore.set(ip, record);
}

async function clearRecord(ip: string): Promise<void> {
  if (isNetlifyRuntime()) {
    const store = getStore(BLOB_STORE_NAME);
    await store.delete(blobKey(ip));
    return;
  }
  memoryStore.delete(ip);
}

/** Best-effort client IP from the headers Netlify/most proxies set. Local
 * dev has neither header, so every local request shares one "unknown"
 * bucket — fine, since there's no real network boundary to protect there. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const netlifyIp = h.get("x-nf-client-connection-ip");
  if (netlifyIp) return netlifyIp;
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}

export async function checkThrottle(
  ip: string
): Promise<{ throttled: boolean; retryAfterSeconds?: number }> {
  const record = await readRecord(ip);
  if (!record) return { throttled: false };
  const elapsed = Date.now() - record.windowStart;
  if (elapsed > WINDOW_MS) return { throttled: false };
  if (record.count >= MAX_ATTEMPTS) {
    return { throttled: true, retryAfterSeconds: Math.ceil((WINDOW_MS - elapsed) / 1000) };
  }
  return { throttled: false };
}

export async function recordFailedAttempt(ip: string): Promise<void> {
  const now = Date.now();
  const existing = await readRecord(ip);
  if (!existing || now - existing.windowStart > WINDOW_MS) {
    await writeRecord(ip, { count: 1, windowStart: now });
    return;
  }
  await writeRecord(ip, { count: existing.count + 1, windowStart: existing.windowStart });
}

export async function resetAttempts(ip: string): Promise<void> {
  await clearRecord(ip);
}
