import { z } from "zod";
import type { Dictionary } from "./dictionary";
import { parseListField, type ManagementFormValues, type SubmissionFormValues } from "./schema";
import { buildAutoThumbnailUrl } from "./thumbnail";
import type {
  ExhibitionStatus,
  ProjectGrade,
  ProjectSubmissionInput,
  ProjectUpdateInput,
  UploadedFile,
} from "./types";
import { contentTypeForPath, extractZipSite } from "./uploadedSite";
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
    grade: formData.get("grade")?.toString() ?? "",
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
  uploadedFiles?: Record<string, UploadedFile>;
  entryPath?: string;
  coverImageUrl?: string;
}

/** Editing only: the project's current launch fields. Browsers can't
 * pre-fill a <input type="file"> with an existing upload, so re-submitting
 * the edit form with file mode still selected but no new file chosen means
 * "keep what's already there," not "no file was provided." */
interface ExistingLaunch {
  launchUrl: string;
  uploadedHtml?: string;
  uploadedFiles?: Record<string, UploadedFile>;
  entryPath?: string;
}

function looksLikeZip(file: File): boolean {
  return (
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed" ||
    /\.zip$/i.test(file.name)
  );
}

function looksLikeHtml(file: File): boolean {
  return file.type === "text/html" || /\.html?$/i.test(file.name);
}

// SVG is deliberately excluded here: it can embed <script> the same way HTML
// can, so treating it as "just an image" would quietly open the same
// no-sandbox risk documented for HTML/zip uploads (see README) under a form
// field that looks harmless. It's still uploadable inside a .zip like any
// other asset, unrestricted, same as before this feature existed.
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp"];

function looksLikeImage(file: File): boolean {
  if (file.type.startsWith("image/")) return file.type !== "image/svg+xml";
  return IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(`.${ext}`));
}

function looksLikePdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

/**
 * Validates and resolves the "how do visitors launch this" side of the form —
 * either a plain URL, or an uploaded file that this app hosts itself at
 * /files/{id} (see app/files/[id]/[[...path]]/route.ts): a single .html file
 * with no other assets, a .zip when the project needs images/CSS/JS
 * alongside its HTML (see lib/uploadedSite.ts for why a lone .html file
 * can't support those), or a single image/PDF file for a project that's just
 * a poster, infographic, or document rather than an interactive page. Kept
 * out of the zod schema in schema.ts because it's genuinely conditional
 * (which field even applies depends on `mode`) and involves async file
 * reads, not just sync field rules.
 *
 * Also fills in coverImageUrl automatically when the visitor left it blank,
 * regardless of mode — from the resolved launch URL via a screenshot service
 * for a page, or from the image itself when the upload already is one (no
 * need to screenshot a picture to get a picture). This is the "썸네일 화면을
 * 알아서 등록" behavior, applied in one place so both submission and edit
 * get it identically.
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
  existing?: ExistingLaunch;
}): Promise<{ ok: true; value: ResolvedLaunch } | { ok: false; errors: FormFieldErrors }> {
  if (mode === "file") {
    if ((!file || file.size === 0) && (existing?.uploadedHtml || existing?.uploadedFiles)) {
      // Re-submitting the edit form without picking a new file: keep what's
      // already there rather than treating this as "no file provided."
      return finalizeLaunch(
        {
          launchUrl: existing.launchUrl,
          uploadedHtml: existing.uploadedHtml,
          uploadedFiles: existing.uploadedFiles,
          entryPath: existing.entryPath,
        },
        coverImageUrl,
        dict
      );
    }
    if (!file || file.size === 0) {
      return { ok: false, errors: { launchFile: dict.validation.launchFileRequired } };
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, errors: { launchFile: dict.validation.launchFileTooLarge } };
    }

    if (looksLikeZip(file)) {
      const extracted = await extractZipSite(await file.arrayBuffer());
      if (!extracted.ok) {
        const message =
          extracted.reason === "no-html"
            ? dict.validation.launchFileZipNoHtml
            : extracted.reason === "empty"
              ? dict.validation.launchFileZipEmpty
              : dict.validation.launchFileZipInvalid;
        return { ok: false, errors: { launchFile: message } };
      }
      return finalizeLaunch(
        {
          launchUrl: `${origin}/files/${id}/${extracted.value.entryPath}`,
          uploadedFiles: extracted.value.files,
          entryPath: extracted.value.entryPath,
        },
        coverImageUrl,
        dict
      );
    }

    if (looksLikeImage(file) || looksLikePdf(file)) {
      const launchUrl = `${origin}/files/${id}`;
      const contentBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      const result = finalizeLaunch(
        {
          launchUrl,
          uploadedFiles: {
            [file.name]: { contentBase64, contentType: contentTypeForPath(file.name) },
          },
          entryPath: file.name,
        },
        coverImageUrl,
        dict
      );
      // An uploaded image already is the picture to show — use it directly
      // instead of asking thum.io to screenshot a page that's just an <img>.
      if (result.ok && looksLikeImage(file) && !coverImageUrl.trim()) {
        result.value.coverImageUrl = launchUrl;
      }
      return result;
    }

    if (!looksLikeHtml(file)) {
      return { ok: false, errors: { launchFile: dict.validation.launchFileInvalidType } };
    }
    return finalizeLaunch(
      { launchUrl: `${origin}/files/${id}`, uploadedHtml: await file.text() },
      coverImageUrl,
      dict
    );
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return { ok: false, errors: { launchUrl: dict.validation.launchUrlRequired } };
  }
  if (!isValidLaunchUrl(trimmedUrl)) {
    return { ok: false, errors: { launchUrl: dict.validation.urlInvalid } };
  }
  return finalizeLaunch({ launchUrl: trimmedUrl }, coverImageUrl, dict);
}

function finalizeLaunch(
  launch: Pick<ResolvedLaunch, "launchUrl" | "uploadedHtml" | "uploadedFiles" | "entryPath">,
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
      ...launch,
      coverImageUrl: trimmedCover || buildAutoThumbnailUrl(launch.launchUrl),
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
    grade: (values.grade || undefined) as ProjectGrade | undefined,
    tags: parseListField(values.tags ?? ""),
    coverImageUrl: resolved.coverImageUrl,
    motivation: values.motivation || undefined,
    usageInstructions: values.usageInstructions || undefined,
    safetyNotes: values.safetyNotes || undefined,
    technologies: parseListField(values.technologies ?? ""),
    launchUrl: resolved.launchUrl,
    uploadedHtml: resolved.uploadedHtml,
    uploadedFiles: resolved.uploadedFiles,
    entryPath: resolved.entryPath,
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
