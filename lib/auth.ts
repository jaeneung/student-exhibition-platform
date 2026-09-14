import "server-only";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Single-shared-account teacher login for /manage. This is intentionally
 * minimal — one hardcoded username/password pair, no per-teacher accounts or
 * roles — but the mechanics are real security, not a UI-only gate:
 *
 * - The password is never stored or compared in plaintext. Only a scrypt
 *   hash (with its own random salt) lives in the environment; this file
 *   never sees the actual password except transiently, once, during
 *   verification.
 * - The session is a signed, expiring token (HMAC-SHA256 over an expiry
 *   timestamp, keyed by SESSION_SECRET) stored in an httpOnly cookie, not a
 *   plain "loggedIn=true" flag — a student can't forge one without knowing
 *   SESSION_SECRET, and can't extend a stolen one past its expiry.
 * - Route access is enforced in proxy.ts (before any page renders) and
 *   again inside the mutating Server Actions themselves — never only by
 *   hiding a link in the UI.
 *
 * For a real school-wide deployment with multiple staff accounts, this
 * should be replaced with a real multi-user auth system (see README).
 */

export const SESSION_COOKIE_NAME = "teacher_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours — a school day

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Teacher login requires TEACHER_USERNAME, TEACHER_PASSWORD_SALT, ` +
        `TEACHER_PASSWORD_HASH, and SESSION_SECRET to be configured — see .env.example.`
    );
  }
  return value;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual throws on mismatched lengths, which itself leaks length
  // information via a thrown/caught exception timing difference; comparing
  // against a hash of fixed output length sidesteps that in practice, but
  // check lengths first regardless so a short guess never reaches it.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Verifies a submitted username/password against the configured teacher
 * account. Always runs the same scrypt + timingSafeEqual work on the
 * password regardless of whether the username matched, so a wrong username
 * can't be distinguished from a wrong password by response time. */
export function verifyTeacherCredentials(username: string, password: string): boolean {
  const expectedUsername = requireEnv("TEACHER_USERNAME");
  const salt = requireEnv("TEACHER_PASSWORD_SALT");
  const expectedHash = requireEnv("TEACHER_PASSWORD_HASH");

  const submittedHash = scryptSync(password, salt, 64).toString("hex");
  const passwordOk = safeEqual(submittedHash, expectedHash);
  const usernameOk = safeEqual(username, expectedUsername);

  return usernameOk && passwordOk;
}

function sign(payload: string): string {
  const secret = requireEnv("SESSION_SECRET");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** A signed, expiring token: `<expiryEpochSeconds>.<hmacSignature>`. Verified
 * by recomputing the signature (never trusting the expiry a client sends
 * back) and checking it hasn't passed. */
export function createSessionToken(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(sign(payload), signature)) return false;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt)) return false;
  return Date.now() / 1000 < expiresAt;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function hasValidTeacherSession(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(SESSION_COOKIE_NAME)?.value);
}

/** Defense-in-depth guard for the mutating Server Actions behind /manage.
 * The management pages themselves already check hasValidTeacherSession()
 * before rendering the buttons that call these actions, but a Server Action
 * is still a callable server endpoint in its own right regardless of
 * whether the page that normally renders its trigger ever loaded — this
 * makes the check part of the action itself, not just the page around it. */
export async function requireTeacherSession(): Promise<void> {
  if (!(await hasValidTeacherSession())) {
    redirect("/manage/login");
  }
}

/** For display only ("Logged in as ___") — never used for the actual
 * comparison in verifyTeacherCredentials, which reads the env var directly. */
export function getTeacherUsername(): string | undefined {
  return process.env.TEACHER_USERNAME;
}
