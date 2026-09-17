import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  process.env.SESSION_SECRET = "test-session-secret";
});

afterEach(() => {
  delete process.env.SESSION_SECRET;
  vi.useRealTimers();
});

describe("createStudentSessionToken / studentIdFromToken", () => {
  it("round-trips the student id through a valid token", async () => {
    const { createStudentSessionToken, studentIdFromToken } = await import("@/lib/studentAuth");
    const token = createStudentSessionToken("student-123");
    expect(studentIdFromToken(token)).toBe("student-123");
  });

  it("rejects a tampered signature", async () => {
    const { createStudentSessionToken, studentIdFromToken } = await import("@/lib/studentAuth");
    const token = createStudentSessionToken("student-123");
    const tampered = token.slice(0, -1) + (token.at(-1) === "0" ? "1" : "0");
    expect(studentIdFromToken(tampered)).toBeUndefined();
  });

  it("rejects a token for one student rewritten to claim another's id", async () => {
    const { createStudentSessionToken, studentIdFromToken } = await import("@/lib/studentAuth");
    const token = createStudentSessionToken("student-123");
    const [, expiresAt, signature] = token.split(".");
    const forged = `student-456.${expiresAt}.${signature}`;
    expect(studentIdFromToken(forged)).toBeUndefined();
  });

  it("rejects an expired token", async () => {
    const { createStudentSessionToken, studentIdFromToken } = await import("@/lib/studentAuth");
    vi.useFakeTimers();
    const token = createStudentSessionToken("student-123");
    vi.advanceTimersByTime(31 * 24 * 60 * 60 * 1000);
    expect(studentIdFromToken(token)).toBeUndefined();
  });

  it("rejects garbage input", async () => {
    const { studentIdFromToken } = await import("@/lib/studentAuth");
    expect(studentIdFromToken(undefined)).toBeUndefined();
    expect(studentIdFromToken("")).toBeUndefined();
    expect(studentIdFromToken("not-a-real-token")).toBeUndefined();
  });
});

describe("hashPassword / verifyPassword", () => {
  it("verifies a correct password against its hash", async () => {
    const { generateSalt, hashPassword, verifyPassword } = await import("@/lib/studentAuth");
    const salt = generateSalt();
    const hash = hashPassword("correct-horse", salt);
    expect(verifyPassword("correct-horse", salt, hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const { generateSalt, hashPassword, verifyPassword } = await import("@/lib/studentAuth");
    const salt = generateSalt();
    const hash = hashPassword("correct-horse", salt);
    expect(verifyPassword("wrong-password", salt, hash)).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps a plain in-site path", async () => {
    const { safeNextPath } = await import("@/lib/studentAuth");
    expect(safeNextPath("/submit")).toBe("/submit");
  });

  it("falls back to /my for a missing value", async () => {
    const { safeNextPath } = await import("@/lib/studentAuth");
    expect(safeNextPath(undefined)).toBe("/my");
    expect(safeNextPath(null)).toBe("/my");
    expect(safeNextPath("")).toBe("/my");
  });

  it("falls back to /my for a protocol-relative URL (open-redirect attempt)", async () => {
    const { safeNextPath } = await import("@/lib/studentAuth");
    expect(safeNextPath("//evil.example.com")).toBe("/my");
  });

  it("falls back to /my for an absolute URL", async () => {
    const { safeNextPath } = await import("@/lib/studentAuth");
    expect(safeNextPath("https://evil.example.com")).toBe("/my");
  });
});
