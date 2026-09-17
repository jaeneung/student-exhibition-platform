export const EXHIBITION_STATUSES = [
  "pending_review",
  "on_display",
  "private",
] as const;

export type ExhibitionStatus = (typeof EXHIBITION_STATUSES)[number];

export const PROJECT_CATEGORIES = [
  "웹사이트",
  "게임",
  "앱",
  "AI 챗봇",
  "인터랙티브",
  "CSA",
  "로보틱스",
  "기타",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_GRADES = ["G6", "G7", "G8", "G9", "G10", "G11", "G12"] as const;

export type ProjectGrade = (typeof PROJECT_GRADES)[number];

/** An optional per-locale overlay of the language-bearing fields below.
 * Exists only for this platform's own fictional seed/demo data (see
 * lib/sampleData.ts) so an English-locale visitor sees genuinely English
 * content everywhere, including sample cards — real student submissions
 * never set this, so their content always stays in whichever language the
 * student actually wrote it in, regardless of the visitor's UI language. */
export interface ProjectTranslation {
  title?: string;
  shortDescription?: string;
  creatorName?: string;
  tags?: string[];
  motivation?: string;
  usageInstructions?: string;
  safetyNotes?: string;
  technologies?: string[];
}

/** One file inside a `.zip` upload, content-addressed by its path within the
 * zip (see lib/uploadedSite.ts). Stored as base64 so binary assets (images,
 * fonts) round-trip safely through the same JSON-based project store as
 * everything else. */
export interface UploadedFile {
  contentBase64: string;
  contentType: string;
}

/** A student account, created via /student/signup. Deliberately minimal
 * (username + password only, no email/verification) — see lib/studentAuth.ts
 * and lib/studentStore.ts. Owns whichever projects it submits, which is what
 * makes self-service editing (app/my/**) possible without a shared teacher
 * login standing in for every student. */
export interface Student {
  id: string;
  /** Stored lowercase for case-insensitive uniqueness/lookup; the student's
   * originally-typed casing isn't preserved separately since it's never
   * shown anywhere, only used to log back in. */
  username: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
}

/** A snapshot of a project's launch fields taken right before a student
 * replaces them (see app/my/actions.ts) — just enough to view what an older
 * version actually was, not to restore it (no revert capability by design).
 * Text fields (title, description, etc.) aren't versioned, only the
 * file/link a visitor would actually open, since that's the part a
 * self-service re-upload can silently change out from under a project that
 * may already be approved and on display. */
export interface ProjectVersion {
  id: string;
  savedAt: string;
  launchUrl: string;
  uploadedHtml?: string;
  uploadedFiles?: Record<string, UploadedFile>;
  entryPath?: string;
}

export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  creatorName: string;
  category: string;
  /** Which grade level's project this is (G6–G9). Optional: existing
   * projects predate this field, and not every exhibit needs to be tied to
   * a specific grade — the gallery's grade filter simply omits any project
   * that doesn't set one. */
  grade?: ProjectGrade;
  tags: string[];
  coverImageUrl?: string;
  motivation?: string;
  usageInstructions?: string;
  safetyNotes?: string;
  technologies: string[];
  launchUrl: string;
  /** Present only for a project submitted as a single uploaded HTML file
   * (no accompanying assets) rather than a URL — the raw file content,
   * served back out at exactly /files/{id}. Kept for projects submitted
   * before .zip uploads existed; a plain .html upload still takes this path
   * today when the student's page needs no other files. */
  uploadedHtml?: string;
  /** Present only for a project submitted as a `.zip` upload — every file
   * inside it, keyed by its path within the zip (e.g. "index.html",
   * "images/4.png"), so a page's own relative asset references resolve
   * correctly when served back out at that same path under /files/{id}/.
   * `entryPath` says which file is the main page; launchUrl always points
   * at /files/{id}/{entryPath} for these. */
  uploadedFiles?: Record<string, UploadedFile>;
  entryPath?: string;
  status: ExhibitionStatus;
  handsOnAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  translations?: Partial<Record<"en", ProjectTranslation>>;
  /** The student account that submitted this, if any (see lib/studentAuth.ts).
   * Undefined for anything submitted before student accounts existed —
   * those simply never appear in any student's "my projects" list and stay
   * editable only from /manage, same as always. */
  ownerId?: string;
  /** Prior launch-field snapshots, most recent last, capped at
   * MAX_PROJECT_VERSIONS (see lib/store.ts) — old ones are dropped, not the
   * project's actual history, just how far back self-service editing keeps
   * a record. */
  versions?: ProjectVersion[];
}

/** Fields a visitor/student can set when submitting a project. Status is always
 * forced to "pending_review" server-side and is never accepted from this shape. */
export type ProjectSubmissionInput = Omit<
  Project,
  "id" | "status" | "createdAt" | "updatedAt" | "versions"
>;

/** Fields an editor can change from the management screen (includes status). */
export type ProjectUpdateInput = Omit<Project, "id" | "createdAt" | "updatedAt">;

export interface PublicProjectFilters {
  q?: string;
  category?: string;
  tag?: string;
  grade?: string;
}
