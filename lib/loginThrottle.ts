import "server-only";
import { headers } from "next/headers";
import { getStore } from "@netlify/blobs";
import { isNetlifyRuntime } from "./runtime";

/**
 * Slows down password guessing by tracking failed attempts against an
 * arbitrary key — not per browser/cookie, so clearing cookies or opening a
 * private window doesn't reset it the way a cookie-based counter would.
 * Uses the same dual-backend pattern as lib/store.ts: Netlify Blobs in
 * production (Functions have no shared memory across invocations), a plain
 * in-memory Map in local dev.
 *
 * The key is caller-chosen, not always a client IP: /manage/login (a single
 * shared account) throttles by IP, but student login throttles by username
 * instead (see app/student/login/actions.ts) — a whole classroom can share
 * one school-network IP, so an IP-keyed throttle there would let one
 * student's mistyped password lock out everyone else on the same Wi-Fi.
 * Keying by username instead still stops brute-forcing any one account
 * while leaving every other student's login unaffected.
 *
 * This is a defense-in-depth speed bump appropriate for a low-stakes school
 * tool, not a substitute for the scrypt hashing that makes each individual
 * guess expensive — see lib/auth.ts / lib/studentAuth.ts.
 */
const BLOB_STORE_NAME = "exhibition-auth";
// Tightened from 5/15min: a shared single-account login is worth making
// brute-forcing as impractical as possible even at some cost to a
// legitimate teacher who mistypes a few times.
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 30 * 60 * 1000; // 30 minutes

interface ThrottleRecord {
  count: number;
  windowStart: number;
}

const memoryStore = new Map<string, ThrottleRecord>();

function blobKey(key: string): string {
  return `login-attempts:${key}`;
}

async function readRecord(key: string): Promise<ThrottleRecord | undefined> {
  if (isNetlifyRuntime()) {
    const store = getStore(BLOB_STORE_NAME);
    const value = await store.get(blobKey(key), { type: "json" });
    return (value as ThrottleRecord | null) ?? undefined;
  }
  return memoryStore.get(key);
}

async function writeRecord(key: string, record: ThrottleRecord): Promise<void> {
  if (isNetlifyRuntime()) {
    const store = getStore(BLOB_STORE_NAME);
    await store.setJSON(blobKey(key), record);
    return;
  }
  memoryStore.set(key, record);
}

async function clearRecord(key: string): Promise<void> {
  if (isNetlifyRuntime()) {
    const store = getStore(BLOB_STORE_NAME);
    await store.delete(blobKey(key));
    return;
  }
  memoryStore.delete(key);
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
  key: string
): Promise<{ throttled: boolean; retryAfterSeconds?: number }> {
  const record = await readRecord(key);
  if (!record) return { throttled: false };
  const elapsed = Date.now() - record.windowStart;
  if (elapsed > WINDOW_MS) return { throttled: false };
  if (record.count >= MAX_ATTEMPTS) {
    return { throttled: true, retryAfterSeconds: Math.ceil((WINDOW_MS - elapsed) / 1000) };
  }
  return { throttled: false };
}

export async function recordFailedAttempt(key: string): Promise<void> {
  const now = Date.now();
  const existing = await readRecord(key);
  if (!existing || now - existing.windowStart > WINDOW_MS) {
    await writeRecord(key, { count: 1, windowStart: now });
    return;
  }
  await writeRecord(key, { count: existing.count + 1, windowStart: existing.windowStart });
}

export async function resetAttempts(key: string): Promise<void> {
  await clearRecord(key);
}
