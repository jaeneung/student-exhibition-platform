import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import { generateSalt, hashPassword, verifyPassword } from "./studentAuth";
import { isNetlifyRuntime } from "./runtime";
import type { Student } from "./types";

/** Same dual-backend persistence approach as lib/store.ts (see its
 * top-of-file comment for the full rationale) — a local JSON file in dev,
 * Netlify Blobs in production. A separate store/file from projects.json so
 * the two can be reasoned about (and, if ever needed, wiped) independently. */
const BLOB_STORE_NAME = "exhibition-students";
const BLOB_KEY = "students";

function getDataFile(): string {
  return process.env.STUDENTS_DATA_FILE ?? path.join(process.cwd(), "data", "students.json");
}

let writeQueue: Promise<unknown> = Promise.resolve();

async function ensureDataFile(): Promise<void> {
  const dataFile = getDataFile();
  await mkdir(path.dirname(dataFile), { recursive: true });
  try {
    await readFile(/* turbopackIgnore: true */ dataFile, "utf-8");
  } catch {
    await writeFile(/* turbopackIgnore: true */ dataFile, JSON.stringify([], null, 2), "utf-8");
  }
}

async function readAllFromFile(): Promise<Student[]> {
  await ensureDataFile();
  const raw = await readFile(/* turbopackIgnore: true */ getDataFile(), "utf-8");
  return JSON.parse(raw) as Student[];
}

function writeAllToFile(students: Student[]): Promise<void> {
  const task = writeQueue.then(() =>
    writeFile(/* turbopackIgnore: true */ getDataFile(), JSON.stringify(students, null, 2), "utf-8")
  );
  writeQueue = task.catch(() => undefined);
  return task;
}

async function readAllFromBlobs(): Promise<Student[]> {
  const store = getStore(BLOB_STORE_NAME);
  const existing = await store.get(BLOB_KEY, { type: "json" });
  return (existing as Student[] | null) ?? [];
}

async function writeAllToBlobs(students: Student[]): Promise<void> {
  const store = getStore(BLOB_STORE_NAME);
  await store.setJSON(BLOB_KEY, students);
}

function readAll(): Promise<Student[]> {
  return isNetlifyRuntime() ? readAllFromBlobs() : readAllFromFile();
}

function writeAll(students: Student[]): Promise<void> {
  return isNetlifyRuntime() ? writeAllToBlobs(students) : writeAllToFile(students);
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export class UsernameTakenError extends Error {
  constructor() {
    super("Username already taken");
    this.name = "UsernameTakenError";
  }
}

export async function getStudentByUsername(username: string): Promise<Student | undefined> {
  const all = await readAll();
  const normalized = normalizeUsername(username);
  return all.find((s) => s.username === normalized);
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  const all = await readAll();
  return all.find((s) => s.id === id);
}

/** Creates a new student account. Throws UsernameTakenError rather than
 * silently overwriting on a collision — the caller (app/student/signup/
 * actions.ts) knows the visitor's locale and supplies the actual
 * user-facing message. */
export async function createStudent(username: string, password: string): Promise<Student> {
  const all = await readAll();
  const normalized = normalizeUsername(username);
  if (all.some((s) => s.username === normalized)) {
    throw new UsernameTakenError();
  }
  const salt = generateSalt();
  const student: Student = {
    id: randomUUID(),
    username: normalized,
    passwordSalt: salt,
    passwordHash: hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };
  await writeAll([...all, student]);
  return student;
}

/** Verifies a login attempt, returning the matched student or undefined.
 * Always runs the scrypt+compare work when a username exists, so a wrong
 * password can't be timed apart from a wrong username in the common case —
 * an unknown username still short-circuits (there's no hash to check
 * against), same tradeoff lib/auth.ts's single fixed account doesn't face. */
export async function verifyStudentCredentials(
  username: string,
  password: string
): Promise<Student | undefined> {
  const student = await getStudentByUsername(username);
  if (!student) return undefined;
  return verifyPassword(password, student.passwordSalt, student.passwordHash) ? student : undefined;
}
