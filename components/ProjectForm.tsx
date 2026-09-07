"use client";

import { useActionState } from "react";
import { EXHIBITION_STATUSES, EXHIBITION_STATUS_LABELS, PROJECT_CATEGORIES } from "@/lib/types";
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

function Field({
  id,
  label,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
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
  action,
  project,
  includeStatus = false,
  submitLabel,
}: {
  action: (prevState: FormActionState, formData: FormData) => Promise<FormActionState>;
  project?: Project;
  includeStatus?: boolean;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState<FormActionState, FormData>(action, {
    status: "idle",
  });
  const errors = state.status === "error" ? state.errors ?? {} : {};

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
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

      <FormSection icon="📌" title="기본 정보">
        <Field id="title" label="프로젝트 제목" required error={errors.title}>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={project?.title}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
            className={inputClass}
          />
        </Field>

        <Field id="creatorName" label="제작자 / 팀 이름" required error={errors.creatorName}>
          <input
            id="creatorName"
            name="creatorName"
            type="text"
            required
            defaultValue={project?.creatorName}
            aria-invalid={Boolean(errors.creatorName)}
            aria-describedby={errors.creatorName ? "creatorName-error" : undefined}
            className={inputClass}
            placeholder="실명 대신 팀 이름이나 별명을 사용해 주세요"
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="category" label="카테고리" required error={errors.category}>
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
                선택해 주세요
              </option>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field id="tags" label="태그 (쉼표로 구분)" error={errors.tags}>
            <input
              id="tags"
              name="tags"
              type="text"
              defaultValue={project?.tags.join(", ")}
              className={inputClass}
              placeholder="예: 게임, 퀴즈, 코딩교육"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection icon="✏️" title="소개">
        <Field id="shortDescription" label="짧은 소개" required error={errors.shortDescription}>
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
          />
        </Field>

        <Field id="fullDescription" label="상세 설명" required error={errors.fullDescription}>
          <textarea
            id="fullDescription"
            name="fullDescription"
            required
            rows={5}
            defaultValue={project?.fullDescription}
            aria-invalid={Boolean(errors.fullDescription)}
            aria-describedby={errors.fullDescription ? "fullDescription-error" : undefined}
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection icon="💡" title="상세 안내 (선택)">
        <Field id="motivation" label="만들게 된 계기" error={errors.motivation}>
          <textarea
            id="motivation"
            name="motivation"
            rows={3}
            defaultValue={project?.motivation}
            className={inputClass}
          />
        </Field>

        <Field id="usageInstructions" label="사용 방법" error={errors.usageInstructions}>
          <textarea
            id="usageInstructions"
            name="usageInstructions"
            rows={3}
            defaultValue={project?.usageInstructions}
            className={inputClass}
          />
        </Field>

        <Field id="safetyNotes" label="안전 및 이용 안내" error={errors.safetyNotes}>
          <textarea
            id="safetyNotes"
            name="safetyNotes"
            rows={2}
            defaultValue={project?.safetyNotes}
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection icon="🔗" title="링크 및 미디어">
        <Field id="technologies" label="사용한 기술 (쉼표로 구분, 선택)" error={errors.technologies}>
          <input
            id="technologies"
            name="technologies"
            type="text"
            defaultValue={project?.technologies.join(", ")}
            className={inputClass}
            placeholder="예: React, Python, Three.js"
          />
        </Field>

        <Field id="coverImageUrl" label="대표 이미지 URL (선택)" error={errors.coverImageUrl}>
          <input
            id="coverImageUrl"
            name="coverImageUrl"
            type="url"
            defaultValue={project?.coverImageUrl}
            aria-invalid={Boolean(errors.coverImageUrl)}
            aria-describedby={errors.coverImageUrl ? "coverImageUrl-error" : undefined}
            className={inputClass}
            placeholder="https://..."
          />
        </Field>

        <Field id="launchUrl" label="실행 링크" required error={errors.launchUrl}>
          <input
            id="launchUrl"
            name="launchUrl"
            type="url"
            required
            defaultValue={project?.launchUrl}
            aria-invalid={Boolean(errors.launchUrl)}
            aria-describedby={errors.launchUrl ? "launchUrl-error" : undefined}
            className={inputClass}
            placeholder="https://..."
          />
        </Field>

        <div className="flex items-center gap-2">
          <input
            id="handsOnAvailable"
            name="handsOnAvailable"
            type="checkbox"
            defaultChecked={project?.handsOnAvailable ?? true}
            className="h-5 w-5 rounded border-zinc-300 text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          />
          <label htmlFor="handsOnAvailable" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            지금 바로 체험 가능
          </label>
        </div>
      </FormSection>

      {includeStatus && (
        <FormSection icon="🚦" title="전시 상태">
          <Field id="status" label="전시 상태" required error={errors.status}>
            <select
              id="status"
              name="status"
              required
              defaultValue={project?.status ?? ("pending_review" as ExhibitionStatus)}
              className={inputClass}
            >
              {EXHIBITION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {EXHIBITION_STATUS_LABELS[s]}
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
        {isPending ? "저장 중..." : submitLabel}
      </button>
    </form>
  );
}
