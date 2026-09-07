"use server";

import { revalidatePath } from "next/cache";
import { getDictionary } from "@/lib/dictionary";
import {
  managementValuesToProjectFields,
  readProjectFormData,
  zodIssuesToFieldErrors,
  type FormActionState,
} from "@/lib/formAction";
import { getLocale } from "@/lib/i18n";
import { getManagementSchema } from "@/lib/schema";
import { getProjectByIdForManagement, updateProject } from "@/lib/store";
import type { ExhibitionStatus, Project, ProjectUpdateInput } from "@/lib/types";

function toUpdateInput(project: Project): ProjectUpdateInput {
  return {
    title: project.title,
    shortDescription: project.shortDescription,
    fullDescription: project.fullDescription,
    creatorName: project.creatorName,
    category: project.category,
    tags: project.tags,
    coverImageUrl: project.coverImageUrl,
    motivation: project.motivation,
    usageInstructions: project.usageInstructions,
    safetyNotes: project.safetyNotes,
    technologies: project.technologies,
    launchUrl: project.launchUrl,
    status: project.status,
    handsOnAvailable: project.handsOnAvailable,
  };
}

/** Quick one-click status change from the management list, without going
 * through the full edit form. No auth exists yet — see README for the gap. */
export async function changeStatusAction(id: string, status: ExhibitionStatus): Promise<void> {
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
  const dict = getDictionary(await getLocale());
  const raw = readProjectFormData(formData);
  const parsed = getManagementSchema(dict).safeParse(raw);

  if (!parsed.success) {
    return { status: "error", errors: zodIssuesToFieldErrors(parsed.error) };
  }

  const updated = await updateProject(id, managementValuesToProjectFields(parsed.data));
  if (!updated) {
    return { status: "error", formError: dict.validation.editNotFound };
  }

  revalidatePath("/manage");
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);

  return { status: "success", message: dict.validation.editSuccess };
}
