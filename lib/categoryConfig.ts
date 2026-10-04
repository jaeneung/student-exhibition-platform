import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import { isNetlifyRuntime } from "./runtime";
import { PROJECT_CATEGORIES } from "./types";

/** Per-category submission rules, set by a teacher from /manage.
 * - allowFileUpload: whether students may use the file/folder launch modes
 *   for this category (otherwise only a link is accepted).
 * - allowTitleOmission: whether the title may be left blank; if so, the
 *   submitting student's username is used as the title. */
export interface CategoryRule {
  allowFileUpload: boolean;
  allowTitleOmission: boolean;
}

export const DEFAULT_CATEGORY_RULE: CategoryRule = {
  allowFileUpload: true,
  allowTitleOmission: false,
};

export type CategoryRules = Record<string, CategoryRule>;

const BLOB_STORE_NAME = "exhibition-config";
const BLOB_KEY = "category-rules";

function getDataFile(): string {
  return process.env.CATEGORY_CONFIG_DATA_FILE ?? path.join(process.cwd(), "data", "category-rules.json");
}

async function readStoredRules(): Promise<CategoryRules> {
  if (isNetlifyRuntime()) {
    const store = getStore(BLOB_STORE_NAME);
    const value = await store.get(BLOB_KEY, { type: "json" });
    return (value as CategoryRules | null) ?? {};
  }
  const file = getDataFile();
  await mkdir(path.dirname(file), { recursive: true });
  try {
    // A hand-edited file saved with a UTF-8 byte-order mark would otherwise
    // fail to parse and silently reset every category to its default.
    const raw = (await readFile(/* turbopackIgnore: true */ file, "utf-8")).replace(/^﻿/, "");
    return JSON.parse(raw) as CategoryRules;
  } catch {
    return {};
  }
}

async function writeStoredRules(rules: CategoryRules): Promise<void> {
  if (isNetlifyRuntime()) {
    await getStore(BLOB_STORE_NAME).setJSON(BLOB_KEY, rules);
    return;
  }
  const file = getDataFile();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(/* turbopackIgnore: true */ file, JSON.stringify(rules, null, 2), "utf-8");
}

/** Every known category's effective rule — categories a teacher never
 * configured fall back to DEFAULT_CATEGORY_RULE, which preserves the behavior
 * that existed before this setting did. */
export async function getCategoryRules(): Promise<Record<string, CategoryRule>> {
  const stored = await readStoredRules();
  return Object.fromEntries(
    PROJECT_CATEGORIES.map((category) => [category, { ...DEFAULT_CATEGORY_RULE, ...stored[category] }])
  );
}

export async function saveCategoryRules(rules: Record<string, CategoryRule>): Promise<void> {
  const known = new Set<string>(PROJECT_CATEGORIES);
  const sanitized: CategoryRules = {};
  for (const [category, rule] of Object.entries(rules)) {
    if (!known.has(category)) continue;
    sanitized[category] = {
      allowFileUpload: Boolean(rule.allowFileUpload),
      allowTitleOmission: Boolean(rule.allowTitleOmission),
    };
  }
  await writeStoredRules(sanitized);
}

/** The title to actually save: the typed one if present, otherwise the
 * submitting student's username when that category allows omitting it.
 * Returns the typed value unchanged in every other case, so the normal
 * title validation still runs. */
export function resolveTitle(typedTitle: string, rule: CategoryRule, username: string | undefined): string {
  if (typedTitle.trim() !== "") return typedTitle;
  if (rule.allowTitleOmission && username) return username;
  return typedTitle;
}
