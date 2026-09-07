import { z } from "zod";
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

const urlField = z
  .string()
  .trim()
  .min(1, "실행 링크를 입력해 주세요.")
  .refine(isValidLaunchUrl, "http:// 또는 https:// 로 시작하는 유효한 링크를 입력해 주세요.");

const optionalUrlField = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => !value || isValidLaunchUrl(value),
    "http:// 또는 https:// 로 시작하는 유효한 링크를 입력해 주세요."
  );

const optionalText = (max: number) =>
  z.string().trim().max(max, `${max}자 이내로 입력해 주세요.`).optional();

/** Shared field rules for both the public submission form and the management edit form. */
export const baseProjectFields = {
  title: z
    .string()
    .trim()
    .min(2, "제목은 2자 이상 입력해 주세요.")
    .max(120, "제목은 120자 이내로 입력해 주세요."),
  shortDescription: z
    .string()
    .trim()
    .min(10, "짧은 소개는 10자 이상 입력해 주세요.")
    .max(200, "짧은 소개는 200자 이내로 입력해 주세요."),
  fullDescription: z
    .string()
    .trim()
    .min(10, "상세 설명은 10자 이상 입력해 주세요.")
    .max(4000, "상세 설명은 4000자 이내로 입력해 주세요."),
  creatorName: z
    .string()
    .trim()
    .min(1, "제작자(팀) 이름을 입력해 주세요.")
    .max(80, "제작자(팀) 이름은 80자 이내로 입력해 주세요."),
  category: z.string().trim().min(1, "카테고리를 선택해 주세요."),
  tags: z.string().trim().max(200, "태그는 200자 이내로 입력해 주세요.").optional(),
  coverImageUrl: optionalUrlField,
  motivation: optionalText(2000),
  usageInstructions: optionalText(2000),
  safetyNotes: optionalText(2000),
  technologies: z
    .string()
    .trim()
    .max(200, "사용 기술은 200자 이내로 입력해 주세요.")
    .optional(),
  launchUrl: urlField,
  handsOnAvailable: z.boolean().default(true),
};

/** Public submission form: anyone can fill this in, status is never part of it. */
export const submissionSchema = z.object(baseProjectFields);
export type SubmissionFormValues = z.infer<typeof submissionSchema>;

/** Management edit form: same fields plus an explicit exhibition status. */
export const managementSchema = z.object({
  ...baseProjectFields,
  status: z.enum(EXHIBITION_STATUSES),
});
export type ManagementFormValues = z.infer<typeof managementSchema>;
