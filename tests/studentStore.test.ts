import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "exhibition-students-test-"));
  process.env.STUDENTS_DATA_FILE = path.join(tempDir, "students.json");
});

afterEach(async () => {
  delete process.env.STUDENTS_DATA_FILE;
  await rm(tempDir, { recursive: true, force: true });
});

describe("createStudent", () => {
  it("creates a student with a hashed password, never storing it in plaintext", async () => {
    const { createStudent } = await import("@/lib/studentStore");
    const student = await createStudent("alice", "correct-horse");
    expect(student.username).toBe("alice");
    expect(student.passwordHash).not.toBe("correct-horse");
    expect(student.passwordSalt).toBeTruthy();
    expect(student.id).toBeTruthy();
  });

  it("normalizes username casing so lookups are case-insensitive", async () => {
    const { createStudent, getStudentByUsername } = await import("@/lib/studentStore");
    await createStudent("Alice", "correct-horse");
    const found = await getStudentByUsername("ALICE");
    expect(found?.username).toBe("alice");
  });

  it("rejects a duplicate username regardless of casing", async () => {
    const { createStudent, UsernameTakenError } = await import("@/lib/studentStore");
    await createStudent("bob", "password1");
    await expect(createStudent("BOB", "different")).rejects.toBeInstanceOf(UsernameTakenError);
  });

  it("gives two different students two different random salts", async () => {
    const { createStudent } = await import("@/lib/studentStore");
    const a = await createStudent("carol", "same-password");
    const b = await createStudent("dave", "same-password");
    expect(a.passwordSalt).not.toBe(b.passwordSalt);
    expect(a.passwordHash).not.toBe(b.passwordHash);
  });
});

describe("verifyStudentCredentials", () => {
  it("succeeds for the right username/password", async () => {
    const { createStudent, verifyStudentCredentials } = await import("@/lib/studentStore");
    await createStudent("erin", "correct-horse");
    const result = await verifyStudentCredentials("erin", "correct-horse");
    expect(result?.username).toBe("erin");
  });

  it("is case-insensitive on username but not on password", async () => {
    const { createStudent, verifyStudentCredentials } = await import("@/lib/studentStore");
    await createStudent("frank", "correct-horse");
    expect((await verifyStudentCredentials("FRANK", "correct-horse"))?.username).toBe("frank");
    expect(await verifyStudentCredentials("frank", "Correct-Horse")).toBeUndefined();
  });

  it("fails for a wrong password", async () => {
    const { createStudent, verifyStudentCredentials } = await import("@/lib/studentStore");
    await createStudent("grace", "correct-horse");
    expect(await verifyStudentCredentials("grace", "wrong-password")).toBeUndefined();
  });

  it("fails for an unknown username", async () => {
    const { verifyStudentCredentials } = await import("@/lib/studentStore");
    expect(await verifyStudentCredentials("nobody", "anything")).toBeUndefined();
  });
});

describe("getStudentById", () => {
  it("finds a student by id", async () => {
    const { createStudent, getStudentById } = await import("@/lib/studentStore");
    const student = await createStudent("heidi", "correct-horse");
    expect((await getStudentById(student.id))?.username).toBe("heidi");
  });

  it("returns undefined for an unknown id", async () => {
    const { getStudentById } = await import("@/lib/studentStore");
    expect(await getStudentById("00000000-0000-0000-0000-000000000000")).toBeUndefined();
  });
});
