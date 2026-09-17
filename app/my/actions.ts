"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
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
import { getProjectByIdForManagement, updateProject } from "@/lib/store";
import { requireStudentSession } from "@/lib/studentAuth";
import type { ProjectVersion } from "@/lib/types";

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
  const parsed = getSubmissionSchema(dict).safeParse(raw);
  const existingProject = await getProjectByIdForManagement(id);

  if (!existingProject || existingProject.ownerId !== studentId) {
    return { status: "error", formError: dict.my.editNotFound };
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
