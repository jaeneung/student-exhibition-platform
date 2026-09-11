import { z } from "zod";
import type { Dictionary } from "./dictionary";
import { parseListField, type ManagementFormValues, type SubmissionFormValues } from "./schema";
import { buildAutoThumbnailUrl } from "./thumbnail";
import type { ExhibitionStatus, ProjectSubmissionInput, ProjectUpdateInput } from "./types";
import { isValidLaunchUrl } from "./validation";

export type FormFieldErrors = Record<string, string>;

export type FormActionState =
  | { status: "idle" }
  | { status: "error"; errors?: FormFieldErrors; formError?: string }
  | { status: "success"; message: string; projectId?: string };

/** Reads the field names shared by both the submission and management forms
 * out of a submitted FormData, as plain strings ready for zod validation.
 * launchUrl/launchMode/launchFile are read separately by resolveLaunchFields,
 * not validated here — zod objects ignore unrecognized keys, so passing this
 * whole object into a schema that doesn't declare them is harmless. */
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

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

export interface ResolvedLaunch {
  launchUrl: string;
  uploadedHtml?: string;
  coverImageUrl?: string;
}

/**
 * Validates and resolves the "how do visitors launch this" side of the form —
 * either a plain URL, or an uploaded HTML file that this app hosts itself at
 * /files/{id} (see app/files/[id]/route.ts). Kept out of the zod schema in
 * schema.ts because it's genuinely conditional (which field even applies
 * depends on `mode`) and involves an async file read, not just sync field
 * rules.
 *
 * Also fills in coverImageUrl automatically from the resolved launch URL via
 * a screenshot service when the visitor left it blank, regardless of mode —
 * this is the "썸네일 화면을 알아서 등록" behavior, applied in one place so
 * both submission and edit get it identically.
 */
export async function resolveLaunchFields({
  mode,
  url,
  file,
  coverImageUrl,
  id,
  origin,
  dict,
  existing,
}: {
  mode: string;
  url: string;
  file: File | null;
  coverImageUrl: string;
  id: string;
  origin: string;
  dict: Dictionary;
  /** Editing only: the project's current launch fields. Browsers can't
   * pre-fill a <input type="file"> with an existing upload, so re-submitting
   * the edit form with file mode still selected but no new file chosen means
   * "keep what's already there," not "no file was provided." */
  existing?: { launchUrl: string; uploadedHtml?: string };
}): Promise<{ ok: true; value: ResolvedLaunch } | { ok: false; errors: FormFieldErrors }> {
  let launchUrl: string;
  let uploadedHtml: string | undefined;

  if (mode === "file") {
    if ((!file || file.size === 0) && existing?.uploadedHtml) {
      // Re-submitting the edit form without picking a new file: keep what's
      // already there rather than treating this as "no file provided."
      return finalizeLaunch(existing.launchUrl, existing.uploadedHtml, coverImageUrl, dict);
    }
    if (!file || file.size === 0) {
      return { ok: false, errors: { launchFile: dict.validation.launchFileRequired } };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, errors: { launchFile: dict.validation.launchFileTooLarge } };
    }
    const looksLikeHtml = file.type === "text/html" || /\.html?$/i.test(file.name);
    if (!looksLikeHtml) {
      return { ok: false, errors: { launchFile: dict.validation.launchFileInvalidType } };
    }
    uploadedHtml = await file.text();
    launchUrl = `${origin}/files/${id}`;
  } else {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return { ok: false, errors: { launchUrl: dict.validation.launchUrlRequired } };
    }
    if (!isValidLaunchUrl(trimmedUrl)) {
      return { ok: false, errors: { launchUrl: dict.validation.urlInvalid } };
    }
    launchUrl = trimmedUrl;
  }

  return finalizeLaunch(launchUrl, uploadedHtml, coverImageUrl, dict);
}

function finalizeLaunch(
  launchUrl: string,
  uploadedHtml: string | undefined,
  coverImageUrl: string,
  dict: Dictionary
): { ok: true; value: ResolvedLaunch } | { ok: false; errors: FormFieldErrors } {
  const trimmedCover = coverImageUrl.trim();
  if (trimmedCover && !isValidLaunchUrl(trimmedCover)) {
    return { ok: false, errors: { coverImageUrl: dict.validation.urlInvalid } };
  }

  return {
    ok: true,
    value: {
      launchUrl,
      uploadedHtml,
      coverImageUrl: trimmedCover || buildAutoThumbnailUrl(launchUrl),
    },
  };
}

export function submissionValuesToProjectFields(
  values: SubmissionFormValues,
  resolved: ResolvedLaunch
): ProjectSubmissionInput {
  return {
    title: values.title,
    shortDescription: values.shortDescription,
    fullDescription: values.fullDescription,
    creatorName: values.creatorName,
    category: values.category,
    tags: parseListField(values.tags ?? ""),
    coverImageUrl: resolved.coverImageUrl,
    motivation: values.motivation || undefined,
    usageInstructions: values.usageInstructions || undefined,
    safetyNotes: values.safetyNotes || undefined,
    technologies: parseListField(values.technologies ?? ""),
    launchUrl: resolved.launchUrl,
    uploadedHtml: resolved.uploadedHtml,
    handsOnAvailable: values.handsOnAvailable,
  };
}

export function managementValuesToProjectFields(
  values: ManagementFormValues,
  resolved: ResolvedLaunch
): ProjectUpdateInput {
  return {
    ...submissionValuesToProjectFields(values, resolved),
    status: values.status as ExhibitionStatus,
  };
}
