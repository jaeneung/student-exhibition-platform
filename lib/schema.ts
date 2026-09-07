import { z } from "zod";
import type { Dictionary } from "./dictionary";
import { format } from "./dictionary";
import { EXHIBITION_STATUSES } from "./types";
import { isValidLaunchUrl } from "./validation";

/** Splits a comma-separated field (tags, technologies) into a trimmed, de-duplicated list. */
export function parseListField(raw: string): string[] {
  const items = raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return Array.from(new Set(items));
}

/** Field rules depend on the visitor's locale only for the error message text
 * shown back to them — the shape of the data never changes, so both locales
 * produce a structurally identical schema and the same SubmissionFormValues/
 * ManagementFormValues types regardless of which one built them. */
function buildBaseProjectFields(v: Dictionary["validation"]) {
  const urlField = z
    .string()
    .trim()
    .min(1, v.launchUrlRequired)
    .refine(isValidLaunchUrl, v.urlInvalid);

  const optionalUrlField = z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidLaunchUrl(value), v.urlInvalid);

  const optionalText = (max: number) =>
    z.string().trim().max(max, format(v.textMax, { max })).optional();

  return {
    title: z.string().trim().min(2, v.titleMin).max(120, v.titleMax),
    shortDescription: z.string().trim().min(10, v.shortDescriptionMin).max(200, v.shortDescriptionMax),
    fullDescription: z.string().trim().min(10, v.fullDescriptionMin).max(4000, v.fullDescriptionMax),
    creatorName: z.string().trim().min(1, v.creatorNameMin).max(80, v.creatorNameMax),
    category: z.string().trim().min(1, v.categoryRequired),
    tags: z.string().trim().max(200, v.tagsMax).optional(),
    coverImageUrl: optionalUrlField,
    motivation: optionalText(2000),
    usageInstructions: optionalText(2000),
    safetyNotes: optionalText(2000),
    technologies: z.string().trim().max(200, v.technologiesMax).optional(),
    launchUrl: urlField,
    handsOnAvailable: z.boolean().default(true),
  };
}

/** Public submission form: anyone can fill this in, status is never part of it. */
export function getSubmissionSchema(dict: Dictionary) {
  return z.object(buildBaseProjectFields(dict.validation));
}
export type SubmissionFormValues = z.infer<ReturnType<typeof getSubmissionSchema>>;

/** Management edit form: same fields plus an explicit exhibition status. */
export function getManagementSchema(dict: Dictionary) {
  return z.object({
    ...buildBaseProjectFields(dict.validation),
    status: z.enum(EXHIBITION_STATUSES),
  });
}
export type ManagementFormValues = z.infer<ReturnType<typeof getManagementSchema>>;
