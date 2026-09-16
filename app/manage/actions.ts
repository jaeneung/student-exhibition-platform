"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, requireTeacherSession } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionary";
import {
  buildSubmittedValues,
  managementValuesToProjectFields,
  parseFolderPaths,
  readProjectFormData,
  resolveLaunchFields,
  zodIssuesToFieldErrors,
  type FormActionState,
} from "@/lib/formAction";
import { getLocale } from "@/lib/i18n";
import { getRequestOrigin } from "@/lib/origin";
import { getManagementSchema } from "@/lib/schema";
import { deleteProjects, getAllProjects, getProjectByIdForManagement, updateProject } from "@/lib/store";
import type { ExhibitionStatus, Project, ProjectUpdateInput } from "@/lib/types";

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/manage/login");
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

/** Quick one-click status change from the management list, without going
 * through the full edit form. */
export async function changeStatusAction(id: string, status: ExhibitionStatus): Promise<void> {
  await requireTeacherSession();
  const existing = await getProjectByIdForManagement(id);
  if (!existing) return;
  await updateProject(id, { ...toUpdateInput(existing), status });
  revalidatePath("/manage");
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
}

export async function updateProjectAction(
  id: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  await requireTeacherSession();
  const dict = getDictionary(await getLocale());
  const raw = readProjectFormData(formData);
  const parsed = getManagementSchema(dict).safeParse(raw);
  const existingProject = await getProjectByIdForManagement(id);

  const fileEntry = formData.get("launchFile");
  const launch = await resolveLaunchFields({
    mode: formData.get("launchMode")?.toString() ?? "url",
    url: formData.get("launchUrl")?.toString() ?? "",
    file: fileEntry instanceof File ? fileEntry : null,
    folderFiles: formData.getAll("launchFolderFiles").filter((v): v is File => v instanceof File),
    folderPaths: parseFolderPaths(formData.get("launchFolderPaths")),
    coverImageUrl: raw.coverImageUrl,
    id,
    origin: await getRequestOrigin(),
    dict,
    existing: existingProject
      ? {
          launchUrl: existingProject.launchUrl,
          uploadedHtml: existingProject.uploadedHtml,
          uploadedFiles: existingProject.uploadedFiles,
          entryPath: existingProject.entryPath,
        }
      : undefined,
  });

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

  const updated = await updateProject(id, managementValuesToProjectFields(parsed.data, launch.value));
  if (!updated) {
    return {
      status: "error",
      formError: dict.validation.editNotFound,
      values: buildSubmittedValues(raw, formData),
    };
  }

  revalidatePath("/manage");
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);

  return { status: "success", message: dict.validation.editSuccess };
}

/** Bulk-deletes projects from the "Private" management group. Restricted to
 * projects that are currently "private" server-side, independent of what the
 * client sent — this button only ever appears in that section, but a status
 * check here means a stale/tampered request can't delete anything else. */
export async function deleteProjectsAction(ids: string[]): Promise<{ deletedCount: number }> {
  await requireTeacherSession();
  if (ids.length === 0) return { deletedCount: 0 };

  const all = await getAllProjects();
  const deletableIds = ids.filter((id) =>
    all.some((p) => p.id === id && p.status === "private")
  );
  const deletedCount = await deleteProjects(deletableIds);

  revalidatePath("/manage");
  revalidatePath("/");
  for (const id of deletableIds) {
    revalidatePath(`/projects/${id}`);
  }

  return { deletedCount };
}
