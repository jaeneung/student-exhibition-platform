"use client";

import { useActionState, useState } from "react";
import type { Dictionary } from "@/lib/dictionary";
import { EXHIBITION_STATUSES, PROJECT_CATEGORIES, PROJECT_GRADES } from "@/lib/types";
import type { ExhibitionStatus, Project } from "@/lib/types";
import type { FormActionState } from "@/lib/formAction";

function FormSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-700 dark:text-brand-400">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Native <details> — keyboard/AT accessible with no JS, so the "advanced"
 * fields can start collapsed for a first-time student submitter (a shorter,
 * less intimidating form) while still opening by default whenever there's
 * existing data to review (editing from the management screen). */
function CollapsibleSection({
  icon,
  title,
  defaultOpen,
  children,
}: {
  icon: string;
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-5 text-sm font-bold uppercase tracking-wide text-brand-700 sm:p-6 dark:text-brand-400">
        <span className="flex items-center gap-2">
          <span aria-hidden="true">{icon}</span>
          {title}
        </span>
        <span
          aria-hidden="true"
          className="text-base normal-case text-zinc-400 transition group-open:rotate-180"
        >
          ⌄
        </span>
      </summary>
      <div className="flex flex-col gap-5 p-5 pt-0 sm:p-6 sm:pt-0">{children}</div>
    </details>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {required && (
          <span className="ml-1 text-rose-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "rounded-xl border border-zinc-300 px-3 py-2.5 text-base transition focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:bg-zinc-950";

export function ProjectForm({
  dict,
  action,
  project,
  includeStatus = false,
  submitLabel,
}: {
  dict: Dictionary;
  action: (prevState: FormActionState, formData: FormData) => Promise<FormActionState>;
  project?: Project;
  includeStatus?: boolean;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState<FormActionState, FormData>(action, {
    status: "idle",
  });
  const errors = state.status === "error" ? state.errors ?? {} : {};
  // Editing (management) always shows everything already filled in; a brand
  // new submission starts with the optional section collapsed to keep the
  // first view short.
  const isEditing = Boolean(project);
  const f = dict.form;
  const hasExistingUpload = Boolean(project?.uploadedHtml || project?.uploadedFiles);
  const [launchMode, setLaunchMode] = useState<"url" | "file">(hasExistingUpload ? "file" : "url");

  return (
    <form action={formAction} encType="multipart/form-data" noValidate className="flex flex-col gap-6">
      {state.status === "error" && state.formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
        >
          <span aria-hidden="true">⚠️</span>
          {state.formError}
        </div>
      )}
      {state.status === "success" && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        >
          <span aria-hidden="true">✅</span>
          {state.message}
        </div>
      )}

      <FormSection icon="📌" title={f.requiredSectionTitle}>
        <p className="-mt-1 text-sm text-zinc-500 dark:text-zinc-400">{f.requiredSectionHint}</p>

        <Field id="title" label={f.title} required error={errors.title}>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={project?.title}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
            className={inputClass}
            placeholder={f.titlePlaceholder}
          />
        </Field>

        <Field id="creatorName" label={f.creatorName} required error={errors.creatorName}>
          <input
            id="creatorName"
            name="creatorName"
            type="text"
            required
            defaultValue={project?.creatorName}
            aria-invalid={Boolean(errors.creatorName)}
            aria-describedby={errors.creatorName ? "creatorName-error" : undefined}
            className={inputClass}
            placeholder={f.creatorNamePlaceholder}
          />
        </Field>

        <Field id="category" label={f.category} required error={errors.category}>
          <select
            id="category"
            name="category"
            required
            defaultValue={project?.category ?? ""}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? "category-error" : undefined}
            className={inputClass}
          >
            <option value="" disabled>
              {f.categoryPlaceholder}
            </option>
            {PROJECT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {dict.categories[c] ?? c}
              </option>
            ))}
          </select>
        </Field>

        <Field id="grade" label={f.grade} error={errors.grade}>
          <select
            id="grade"
            name="grade"
            defaultValue={project?.grade ?? ""}
            aria-invalid={Boolean(errors.grade)}
            aria-describedby={errors.grade ? "grade-error" : undefined}
            className={inputClass}
          >
            <option value="">{f.gradePlaceholder}</option>
            {PROJECT_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>

        <Field id="shortDescription" label={f.shortDescription} required error={errors.shortDescription}>
          <textarea
            id="shortDescription"
            name="shortDescription"
            required
            rows={2}
            maxLength={200}
            defaultValue={project?.shortDescription}
            aria-invalid={Boolean(errors.shortDescription)}
            aria-describedby={errors.shortDescription ? "shortDescription-error" : undefined}
            className={inputClass}
            placeholder={f.shortDescriptionPlaceholder}
          />
        </Field>

        <Field id="fullDescription" label={f.fullDescription} required error={errors.fullDescription}>
          <textarea
            id="fullDescription"
            name="fullDescription"
            required
            rows={4}
            defaultValue={project?.fullDescription}
            aria-invalid={Boolean(errors.fullDescription)}
            aria-describedby={errors.fullDescription ? "fullDescription-error" : undefined}
            className={inputClass}
            placeholder={f.fullDescriptionPlaceholder}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {f.launchMode}
            <span className="ml-1 text-rose-600" aria-hidden="true">
              *
            </span>
          </span>
          <div role="radiogroup" aria-label={f.launchMode} className="flex gap-2">
            {(["url", "file"] as const).map((m) => (
              <label
                key={m}
                className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition ${
                  launchMode === m
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                    : "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <input
                  type="radio"
                  name="launchMode"
                  value={m}
                  checked={launchMode === m}
                  onChange={() => setLaunchMode(m)}
                  className="sr-only"
                />
                {m === "url" ? f.launchModeUrl : f.launchModeFile}
              </label>
            ))}
          </div>
        </div>

        {launchMode === "url" ? (
          <Field id="launchUrl" label={f.launchUrl} required hint={f.launchUrlHint} error={errors.launchUrl}>
            <input
              id="launchUrl"
              name="launchUrl"
              type="url"
              required
              defaultValue={hasExistingUpload ? undefined : project?.launchUrl}
              aria-invalid={Boolean(errors.launchUrl)}
              aria-describedby={errors.launchUrl ? "launchUrl-error" : "launchUrl-hint"}
              className={inputClass}
              placeholder={f.launchUrlPlaceholder}
            />
          </Field>
        ) : (
          <Field
            id="launchFile"
            label={f.launchFile}
            required={!hasExistingUpload}
            hint={hasExistingUpload ? f.launchFileKeepHint : f.launchFileHint}
            error={errors.launchFile}
          >
            <input
              id="launchFile"
              name="launchFile"
              type="file"
              required={!hasExistingUpload}
              accept=".html,.htm,.zip,.png,.jpg,.jpeg,.gif,.webp,.pdf,text/html,application/zip,application/x-zip-compressed,image/png,image/jpeg,image/gif,image/webp,application/pdf"
              aria-invalid={Boolean(errors.launchFile)}
              aria-describedby={errors.launchFile ? "launchFile-error" : "launchFile-hint"}
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white`}
            />
          </Field>
        )}

        <div className="flex items-center gap-2">
          <input
            id="handsOnAvailable"
            name="handsOnAvailable"
            type="checkbox"
            defaultChecked={project?.handsOnAvailable ?? true}
            className="h-5 w-5 rounded border-zinc-300 text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          />
          <label htmlFor="handsOnAvailable" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {f.handsOnAvailable}
          </label>
        </div>
      </FormSection>

      <CollapsibleSection icon="➕" title={f.optionalSectionTitle} defaultOpen={isEditing}>
        <Field id="tags" label={f.tags} error={errors.tags}>
          <input
            id="tags"
            name="tags"
            type="text"
            defaultValue={project?.tags.join(", ")}
            className={inputClass}
            placeholder={f.tagsPlaceholder}
          />
        </Field>

        <Field
          id="coverImageUrl"
          label={f.coverImageUrl}
          hint={f.coverImageUrlHint}
          error={errors.coverImageUrl}
        >
          <input
            id="coverImageUrl"
            name="coverImageUrl"
            type="url"
            defaultValue={project?.coverImageUrl}
            aria-invalid={Boolean(errors.coverImageUrl)}
            aria-describedby={errors.coverImageUrl ? "coverImageUrl-error" : "coverImageUrl-hint"}
            className={inputClass}
            placeholder={f.coverImageUrlPlaceholder}
          />
        </Field>

        <Field id="technologies" label={f.technologies} error={errors.technologies}>
          <input
            id="technologies"
            name="technologies"
            type="text"
            defaultValue={project?.technologies.join(", ")}
            className={inputClass}
            placeholder={f.technologiesPlaceholder}
          />
        </Field>

        <Field id="motivation" label={f.motivation} error={errors.motivation}>
          <textarea
            id="motivation"
            name="motivation"
            rows={3}
            defaultValue={project?.motivation}
            className={inputClass}
          />
        </Field>

        <Field id="usageInstructions" label={f.usageInstructions} error={errors.usageInstructions}>
          <textarea
            id="usageInstructions"
            name="usageInstructions"
            rows={3}
            defaultValue={project?.usageInstructions}
            className={inputClass}
          />
        </Field>

        <Field id="safetyNotes" label={f.safetyNotes} error={errors.safetyNotes}>
          <textarea
            id="safetyNotes"
            name="safetyNotes"
            rows={2}
            defaultValue={project?.safetyNotes}
            className={inputClass}
          />
        </Field>
      </CollapsibleSection>

      {includeStatus && (
        <FormSection icon="🚦" title={f.statusSectionTitle}>
          <Field id="status" label={f.status} required error={errors.status}>
            <select
              id="status"
              name="status"
              required
              defaultValue={project?.status ?? ("pending_review" as ExhibitionStatus)}
              className={inputClass}
            >
              {EXHIBITION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {dict.status[s]}
                </option>
              ))}
            </select>
          </Field>
        </FormSection>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 text-base font-semibold text-white shadow-md shadow-brand-600/30 transition hover:from-brand-700 hover:to-brand-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {isPending ? f.submitButtonSaving : submitLabel}
      </button>
    </form>
  );
}
