"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, requireTeacherSession } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionary";
import {
  managementValuesToProjectFields,
  readProjectFormData,
  resolveLaunchFields,
  zodIssuesToFieldErrors,
  type FormActionState,
} from "@/lib/formAction";
import { getLocale } from "@/lib/i18n";
import { getRequestOrigin } from "@/lib/origin";
import { getManagementSchema } from "@/lib/schema";
import { getProjectByIdForManagement, updateProject } from "@/lib/store";
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
    fullDescription: project.fullDescription,
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
    coverImageUrl: raw.coverImageUrl,
    id,
    origin: await getRequestOrigin(),
    dict,
    existing: existingProject
      ? { launchUrl: existingProject.launchUrl, uploadedHtml: existingProject.uploadedHtml }
      : undefined,
  });

  if (!parsed.success || !launch.ok) {
    return {
      status: "error",
      errors: {
        ...(parsed.success ? {} : zodIssuesToFieldErrors(parsed.error)),
        ...(launch.ok ? {} : launch.errors),
      },
    };
  }

  const updated = await updateProject(id, managementValuesToProjectFields(parsed.data, launch.value));
  if (!updated) {
    return { status: "error", formError: dict.validation.editNotFound };
  }

  revalidatePath("/manage");
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);

  return { status: "success", message: dict.validation.editSuccess };
}
