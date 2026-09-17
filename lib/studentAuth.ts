import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Per-student login for /submit and /my/**, separate from the single shared
 * teacher account in lib/auth.ts. Each student gets their own random
 * password salt (unlike the teacher's one env-configured salt), and the
 * session token embeds *which* student is logged in rather than just a
 * yes/no flag, since ownership (see Project.ownerId) is what gates access
 * to a given project's self-service edit/version pages.
 *
 * Reuses SESSION_SECRET (already required for teacher sessions) to sign
 * these tokens too — a distinct cookie name and payload shape mean there's
 * no ambiguity between the two, so a second secret would only be one more
 * thing to configure for no real security gain.
 */

export const STUDENT_SESSION_COOKIE_NAME = "student_session";
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days — students shouldn't have to re-login every visit to fix a file

function requireSecret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is not set — required for both teacher and student sessions.");
  }
  return value;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function sign(payload: string): string {
  return createHmac("sha256", requireSecret()).update(payload).digest("hex");
}

/** `<studentId>.<expiryEpochSeconds>.<hmacSignature>` — the id travels in
 * the token itself (unlike the teacher's boolean-only session) since a
 * student's whole session is "which account is this," not just "is this
 * person allowed in at all." studentId is a UUID (see lib/studentStore.ts),
 * never user-chosen text, so it can't contain the "." separator itself. */
export function createStudentSessionToken(studentId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${studentId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns the student id the token was issued for, or undefined if it's
 * missing, malformed, tampered with, or expired. */
export function studentIdFromToken(token: string | undefined): string | undefined {
  if (!token) return undefined;
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;
  const [studentId, expiresAtRaw, signature] = parts;
  const payload = `${studentId}.${expiresAtRaw}`;
  if (!safeEqual(sign(payload), signature)) return undefined;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) return undefined;
  if (Date.now() / 1000 >= expiresAt) return undefined;
  return studentId;
}

export function studentSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/** The logged-in student's id, or undefined if there isn't a valid session. */
export async function getStudentSession(): Promise<string | undefined> {
  const store = await cookies();
  return studentIdFromToken(store.get(STUDENT_SESSION_COOKIE_NAME)?.value);
}

/** Page-level guard: bounces an anonymous visitor to the login screen,
 * bringing them back to `next` afterward. Mirrors requireTeacherSession's
 * role for /manage, but redirects (rather than just gating a Server Action)
 * since /submit and /my/** are meant to be reached directly, not only via a
 * button on an already-authenticated page. */
export async function requireStudentSession(next?: string): Promise<string> {
  const studentId = await getStudentSession();
  if (!studentId) {
    const target = next ? `/student/login?next=${encodeURIComponent(next)}` : "/student/login";
    redirect(target);
  }
  return studentId;
}

/** A per-student random salt (unlike the teacher's single env-configured
 * one) — generated once at signup and stored alongside the hash. */
export function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  return safeEqual(hashPassword(password, salt), expectedHash);
}

/** Only ever redirects somewhere inside this same site — a bare "/path", not
 * "//evil.example.com" (browsers treat that as protocol-relative) or an
 * absolute URL — since `next` arrives as a user-controlled query param on
 * the login/signup pages. Falls back to `/my` for anything else. */
export function safeNextPath(next: string | null | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/my";
}
