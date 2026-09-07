"use server";

import { revalidatePath } from "next/cache";
import {
  managementValuesToProjectFields,
  readProjectFormData,
  zodIssuesToFieldErrors,
  type FormActionState,
} from "@/lib/formAction";
import { managementSchema } from "@/lib/schema";
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
  const raw = readProjectFormData(formData);
  const parsed = managementSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: "error", errors: zodIssuesToFieldErrors(parsed.error) };
  }

  const updated = await updateProject(id, managementValuesToProjectFields(parsed.data));
  if (!updated) {
    return { status: "error", formError: "프로젝트를 찾을 수 없습니다." };
  }

  revalidatePath("/manage");
  revalidatePath("/");
  revalidatePath(`/projects/${id}`);

  return { status: "success", message: "저장되었습니다." };
}
