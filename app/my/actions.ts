"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCategoryRules, DEFAULT_CATEGORY_RULE, resolveTitle } from "@/lib/categoryConfig";
import { getDictionary } from "@/lib/dictionary";
import {
  buildSubmittedValues,
  parseFolderPaths,
  readProjectFormData,
  resolveLaunchFields,
  submissionValuesToProjectFields,
  zodIssuesToFieldErrors,
  type FormActionState,
} from "@/lib/formAction";
import { getLocale } from "@/lib/i18n";
import { getRequestOrigin } from "@/lib/origin";
import { getSubmissionSchema } from "@/lib/schema";
import { getProjectByIdForManagement, getProjectVersionContent, updateProject } from "@/lib/store";
import { requireStudentSession } from "@/lib/studentAuth";
import { getStudentById } from "@/lib/studentStore";
import type { Project, ProjectUpdateInput, ProjectVersion } from "@/lib/types";

// Old launch-field snapshots are kept for viewing only (no revert), capped
// here so a student who re-uploads often doesn't grow one project's stored
// size without bound on a JSON-file/Blobs backend that isn't a real
// database — the oldest snapshot is dropped once this many are kept.
const MAX_PROJECT_VERSIONS = 5;

export async function updateOwnProjectAction(
  id: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const studentId = await requireStudentSession(`/my/${id}/edit`);
  const dict = getDictionary(await getLocale());
  const raw = readProjectFormData(formData);
  const rule = (await getCategoryRules())[raw.category] ?? DEFAULT_CATEGORY_RULE;
  const submitter = await getStudentById(studentId);
  const parsed = getSubmissionSchema(dict).safeParse({
    ...raw,
    title: resolveTitle(raw.title, rule, submitter?.username),
  });
  const existingProject = await getProjectByIdForManagement(id);

  if (!existingProject || existingProject.ownerId !== studentId) {
    return { status: "error", formError: dict.my.editNotFound };
  }

  // A rule turned off *after* a student already has a file/folder upload in
  // that category must not block them from editing (or re-uploading) it —
  // only from starting a brand-new one. Otherwise they couldn't save even an
  // unrelated text change without first being forced into URL mode, which
  // (per resolveLaunchFields) would replace their real upload with whatever
  // link they typed just to satisfy the now-required field.
  const existingIsUploadBased = Boolean(existingProject.uploadedFiles || existingProject.uploadedHtml);
  const launchModeValue = formData.get("launchMode")?.toString() ?? "url";
  if (!rule.allowFileUpload && launchModeValue !== "url" && !existingIsUploadBased) {
    return { status: "error", errors: { launchFile: dict.validation.fileUploadNotAllowed }, values: buildSubmittedValues(raw, formData) };
  }

  const fileEntry = formData.get("launchFile");
  let launch: Awaited<ReturnType<typeof resolveLaunchFields>>;
  try {
    launch = await resolveLaunchFields({
      mode: formData.get("launchMode")?.toString() ?? "url",
      url: formData.get("launchUrl")?.toString() ?? "",
      file: fileEntry instanceof File ? fileEntry : null,
      folderFiles: formData.getAll("launchFolderFiles").filter((v): v is File => v instanceof File),
      folderPaths: parseFolderPaths(formData.get("launchFolderPaths")),
      coverImageUrl: raw.coverImageUrl,
      id,
      origin: await getRequestOrigin(),
      dict,
      existing: {
        launchUrl: existingProject.launchUrl,
        uploadedHtml: existingProject.uploadedHtml,
        uploadedFiles: existingProject.uploadedFiles,
        entryPath: existingProject.entryPath,
      },
    });
  } catch {
    return {
      status: "error",
      errors: { launchFile: dict.validation.launchFileUploadFailed },
      values: buildSubmittedValues(raw, formData),
    };
  }

  if (!parsed.success || !launch.ok) {
    return {
      status: "error",
      errors: {
        ...(parsed.success ? {} : zodIssuesToFieldErrors(parsed.error)),
        ...(launch.ok ? {} : launch.errors),
      },
      values: buildSubmittedValues(raw, formData),
    };
  }

  const resolved = submissionValuesToProjectFields(parsed.data, launch.value);

  // resolveLaunchFields's "keep what's already there" branches (see its own
  // comments) hand back existingProject's own uploadedFiles/uploadedHtml
  // object by reference, unchanged, whenever the student didn't pick a new
  // file — so comparing by reference (not deep-equality) cheaply tells us
  // whether a new file/link actually replaced the old one.
  const launchChanged =
    resolved.uploadedFiles !== existingProject.uploadedFiles ||
    resolved.uploadedHtml !== existingProject.uploadedHtml ||
    resolved.launchUrl !== existingProject.launchUrl;

  let versions = existingProject.versions;
  // Re-review is only forced when the file actually changes on an
  // already-approved project — editing the description, or replacing a
  // file on something still pending/private, doesn't need it, since
  // nothing currently public would be silently swapped out either way.
  const needsReReview = launchChanged && existingProject.status === "on_display";

  if (launchChanged) {
    const snapshot: ProjectVersion = {
      id: randomUUID(),
      savedAt: new Date().toISOString(),
      launchUrl: existingProject.launchUrl,
      uploadedHtml: existingProject.uploadedHtml,
      uploadedFiles: existingProject.uploadedFiles,
      entryPath: existingProject.entryPath,
    };
    versions = [...(existingProject.versions ?? []), snapshot].slice(-MAX_PROJECT_VERSIONS);
  }

  await updateProject(id, {
    ...resolved,
    status: needsReReview ? "pending_review" : existingProject.status,
    versions,
  });

  revalidatePath("/manage");
  revalidatePath("/my");
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);

  return {
    status: "success",
    message: needsReReview ? dict.my.fileChangedNotice : dict.validation.editSuccess,
  };
}

function toUpdateInput(project: Project): ProjectUpdateInput {
  return {
    title: project.title,
    shortDescription: project.shortDescription,
    creatorName: project.creatorName,
    category: project.category,
    grade: project.grade,
    tags: project.tags,
    coverImageUrl: project.coverImageUrl,
    motivation: project.motivation,
    usageInstructions: project.usageInstructions,
    safetyNotes: project.safetyNotes,
    technologies: project.technologies,
    launchUrl: project.launchUrl,
    uploadedHtml: project.uploadedHtml,
    uploadedFiles: project.uploadedFiles,
    entryPath: project.entryPath,
    status: project.status,
    handsOnAvailable: project.handsOnAvailable,
  };
}

/** Restores an older launch-field snapshot (see app/my/[id]/versions/page.tsx)
 * as the project's current one. Deliberately not destructive either way: the
 * state being replaced is itself snapshotted into the version list first, so
 * restoring an old version never loses the version it replaces — it's just
 * another kind of launch-content edit, and is subject to the exact same
 * re-review rule as a normal file replacement (see updateOwnProjectAction
 * above) since a visitor-facing link or file is changing either way. */
export async function restoreProjectVersionAction(id: string, versionId: string): Promise<void> {
  const studentId = await requireStudentSession(`/my/${id}/versions`);
  const existingProject = await getProjectByIdForManagement(id);
  if (!existingProject || existingProject.ownerId !== studentId) return;

  const version = existingProject.versions?.find((v) => v.id === versionId);
  if (!version) return;

  const versionContent = version.hasContent
    ? await getProjectVersionContent(id, versionId)
    : undefined;

  const currentSnapshot: ProjectVersion = {
    id: randomUUID(),
    savedAt: new Date().toISOString(),
    launchUrl: existingProject.launchUrl,
    uploadedHtml: existingProject.uploadedHtml,
    uploadedFiles: existingProject.uploadedFiles,
    entryPath: existingProject.entryPath,
  };
  const versions = [
    ...(existingProject.versions ?? []).filter((v) => v.id !== versionId),
    currentSnapshot,
  ].slice(-MAX_PROJECT_VERSIONS);

  const needsReReview = existingProject.status === "on_display";

  await updateProject(id, {
    ...toUpdateInput(existingProject),
    launchUrl: version.launchUrl,
    uploadedHtml: versionContent?.uploadedHtml,
    uploadedFiles: versionContent?.uploadedFiles,
    entryPath: version.entryPath,
    status: needsReReview ? "pending_review" : existingProject.status,
    versions,
  });

  revalidatePath("/manage");
  revalidatePath("/my");
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
  revalidatePath(`/my/${id}/versions`);
}
