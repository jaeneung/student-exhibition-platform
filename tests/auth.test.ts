import { createHmac, scryptSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const TEST_PASSWORD = "test-password-123!";
const TEST_USERNAME = "testuser";
const TEST_SALT = "0123456789abcdef0123456789abcdef";

beforeEach(() => {
  process.env.TEACHER_USERNAME = TEST_USERNAME;
  process.env.TEACHER_PASSWORD_SALT = TEST_SALT;
  process.env.TEACHER_PASSWORD_HASH = scryptSync(TEST_PASSWORD, TEST_SALT, 64).toString("hex");
  process.env.SESSION_SECRET = "test-session-secret";
});

afterEach(() => {
  delete process.env.TEACHER_USERNAME;
  delete process.env.TEACHER_PASSWORD_SALT;
  delete process.env.TEACHER_PASSWORD_HASH;
  delete process.env.SESSION_SECRET;
});

describe("verifyTeacherCredentials", () => {
  it("accepts the correct username and password", async () => {
    const { verifyTeacherCredentials } = await import("@/lib/auth");
    expect(verifyTeacherCredentials(TEST_USERNAME, TEST_PASSWORD)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const { verifyTeacherCredentials } = await import("@/lib/auth");
    expect(verifyTeacherCredentials(TEST_USERNAME, "wrong-password")).toBe(false);
  });

  it("rejects a wrong username", async () => {
    const { verifyTeacherCredentials } = await import("@/lib/auth");
    expect(verifyTeacherCredentials("someone-else", TEST_PASSWORD)).toBe(false);
  });

  it("rejects an empty password", async () => {
    const { verifyTeacherCredentials } = await import("@/lib/auth");
    expect(verifyTeacherCredentials(TEST_USERNAME, "")).toBe(false);
  });

  it("throws when required env vars are missing, distinguishing misconfiguration from a wrong password", async () => {
    delete process.env.TEACHER_PASSWORD_HASH;
    const { verifyTeacherCredentials } = await import("@/lib/auth");
    expect(() => verifyTeacherCredentials(TEST_USERNAME, TEST_PASSWORD)).toThrow();
  });
});

describe("session tokens", () => {
  it("creates a token that verifies as valid immediately", async () => {
    const { createSessionToken, isValidSessionToken } = await import("@/lib/auth");
    expect(isValidSessionToken(createSessionToken())).toBe(true);
  });

  it("rejects a missing token", async () => {
    const { isValidSessionToken } = await import("@/lib/auth");
    expect(isValidSessionToken(undefined)).toBe(false);
  });

  it("rejects a malformed token", async () => {
    const { isValidSessionToken } = await import("@/lib/auth");
    expect(isValidSessionToken("not-a-real-token")).toBe(false);
  });

  it("rejects a token with a tampered expiry (signature no longer matches)", async () => {
    const { createSessionToken, isValidSessionToken } = await import("@/lib/auth");
    const token = createSessionToken();
    const [payload, signature] = token.split(".");
    const tampered = `${Number(payload) + 1_000_000}.${signature}`;
    expect(isValidSessionToken(tampered)).toBe(false);
  });

  it("rejects a token that was signed with a different secret", async () => {
    const { createSessionToken, isValidSessionToken } = await import("@/lib/auth");
    const token = createSessionToken();
    process.env.SESSION_SECRET = "a-completely-different-secret";
    expect(isValidSessionToken(token)).toBe(false);
  });

  it("rejects an expired token even with a correct signature", async () => {
    const { isValidSessionToken } = await import("@/lib/auth");
    const expiredPayload = String(Math.floor(Date.now() / 1000) - 10);
    const signature = createHmac("sha256", process.env.SESSION_SECRET as string)
      .update(expiredPayload)
      .digest("hex");
    expect(isValidSessionToken(`${expiredPayload}.${signature}`)).toBe(false);
  });
});

describe("getTeacherUsername", () => {
  it("returns the configured username, for display only", async () => {
    const { getTeacherUsername } = await import("@/lib/auth");
    expect(getTeacherUsername()).toBe(TEST_USERNAME);
  });
});
