import { z } from "zod";
import { parseListField, type ManagementFormValues, type SubmissionFormValues } from "./schema";
import type { ExhibitionStatus, ProjectSubmissionInput, ProjectUpdateInput } from "./types";

export type FormFieldErrors = Record<string, string>;

export type FormActionState =
  | { status: "idle" }
  | { status: "error"; errors?: FormFieldErrors; formError?: string }
  | { status: "success"; message: string; projectId?: string };

/** Reads the field names shared by both the submission and management forms
 * out of a submitted FormData, as plain strings ready for zod validation. */
export function readProjectFormData(formData: FormData) {
  return {
    title: formData.get("title")?.toString() ?? "",
    shortDescription: formData.get("shortDescription")?.toString() ?? "",
    fullDescription: formData.get("fullDescription")?.toString() ?? "",
    creatorName: formData.get("creatorName")?.toString() ?? "",
    category: formData.get("category")?.toString() ?? "",
    tags: formData.get("tags")?.toString() ?? "",
    coverImageUrl: formData.get("coverImageUrl")?.toString() ?? "",
    motivation: formData.get("motivation")?.toString() ?? "",
    usageInstructions: formData.get("usageInstructions")?.toString() ?? "",
    safetyNotes: formData.get("safetyNotes")?.toString() ?? "",
    technologies: formData.get("technologies")?.toString() ?? "",
    launchUrl: formData.get("launchUrl")?.toString() ?? "",
    handsOnAvailable: formData.get("handsOnAvailable") === "on",
    status: formData.get("status")?.toString() ?? "",
  };
}

export function zodIssuesToFieldErrors(error: z.ZodError): FormFieldErrors {
  const errors: FormFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function submissionValuesToProjectFields(
  values: SubmissionFormValues
): ProjectSubmissionInput {
  return {
    title: values.title,
    shortDescription: values.shortDescription,
    fullDescription: values.fullDescription,
    creatorName: values.creatorName,
    category: values.category,
    tags: parseListField(values.tags ?? ""),
    coverImageUrl: values.coverImageUrl || undefined,
    motivation: values.motivation || undefined,
    usageInstructions: values.usageInstructions || undefined,
    safetyNotes: values.safetyNotes || undefined,
    technologies: parseListField(values.technologies ?? ""),
    launchUrl: values.launchUrl,
    handsOnAvailable: values.handsOnAvailable,
  };
}

export function managementValuesToProjectFields(
  values: ManagementFormValues
): ProjectUpdateInput {
  return {
    ...submissionValuesToProjectFields(values),
    status: values.status as ExhibitionStatus,
  };
}
