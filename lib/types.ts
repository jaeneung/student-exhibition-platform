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
  "기타",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  creatorName: string;
  category: string;
  tags: string[];
  coverImageUrl?: string;
  motivation?: string;
  usageInstructions?: string;
  safetyNotes?: string;
  technologies: string[];
  launchUrl: string;
  status: ExhibitionStatus;
  handsOnAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Fields a visitor/student can set when submitting a project. Status is always
 * forced to "pending_review" server-side and is never accepted from this shape. */
export type ProjectSubmissionInput = Omit<
  Project,
  "id" | "status" | "createdAt" | "updatedAt"
>;

/** Fields an editor can change from the management screen (includes status). */
export type ProjectUpdateInput = Omit<Project, "id" | "createdAt" | "updatedAt">;

export interface PublicProjectFilters {
  q?: string;
  category?: string;
  tag?: string;
}
