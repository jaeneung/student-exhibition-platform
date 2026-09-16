"use client";

import { useActionState, useState, type ChangeEvent, type FormEvent } from "react";
import { format, type Dictionary } from "@/lib/dictionary";
import { EXHIBITION_STATUSES, PROJECT_CATEGORIES, PROJECT_GRADES } from "@/lib/types";
import type { ExhibitionStatus, Project } from "@/lib/types";
import type { FormActionState } from "@/lib/formAction";
import { MAX_GITHUB_RELAY_BYTES, MAX_UPLOAD_BYTES, MEDIA_UPLOAD_CHUNK_BYTES } from "@/lib/uploadLimits";

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

const RELAYABLE_VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "ogv"];

function looksLikeRelayableFile(file: File): boolean {
  if (file.type.startsWith("video/") || file.type === "application/pdf") return true;
  if (/\.pdf$/i.test(file.name)) return true;
  return RELAYABLE_VIDEO_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(`.${ext}`));
}

function guessRelayContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  if (ext === "ogv") return "video/ogg";
  return "video/mp4";
}

/** Distinguishes *why* a media-relay request failed, so the student sees a
 * message that actually matches what went wrong instead of one generic
 * "something failed" for every case — a dropped connection, a file the
 * server refuses (too large or a type it doesn't relay), and everything
 * else all call for different next steps. */
class RelayError extends Error {
  constructor(public reason: "network" | "too_large" | "unsupported_type" | "server") {
    super(reason);
  }
}

/** Reads the JSON error code app/api/media-upload/{chunk,finalize}/route.ts
 * return on failure and turns it into the matching RelayError reason. */
async function relayErrorFromResponse(res: Response): Promise<RelayError> {
  if (res.status === 413) return new RelayError("too_large");
  const body: { error?: string } | null = await res.json().catch(() => null);
  if (body?.error === "too_large" || body?.error === "invalid_chunk_size") {
    return new RelayError("too_large");
  }
  if (body?.error === "unsupported_type" || body?.error === "not_a_video") {
    return new RelayError("unsupported_type");
  }
  return new RelayError("server");
}

/** A fetch() that failed to even reach the server (offline, DNS, dropped
 * connection mid-upload) throws a plain TypeError rather than resolving
 * with a non-ok Response — caught here and normalized into the same
 * RelayError shape everything else in relayFileToGithub uses. */
async function relayFetch(input: string, init: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new RelayError("network");
  }
  if (!res.ok) throw await relayErrorFromResponse(res);
  return res;
}

/** A folder-picker <input> reports each file's location within the chosen
 * folder via the nonstandard but universally-supported `webkitRelativePath`
 * property — not a typed DOM property, so read it defensively. */
function relativePathOf(file: File): string {
  const path = (file as unknown as { webkitRelativePath?: string }).webkitRelativePath;
  return path && path.length > 0 ? path : file.name;
}

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
  // Whatever the student last typed, echoed back by the server on a failed
  // submission (see lib/formAction.ts's SubmittedFormValues) — the
  // authoritative source for repopulating the form, since without
  // JavaScript a Server Action submission is a real page reload and
  // `project` alone (empty, for a new submission) would otherwise silently
  // discard everything just typed.
  const errorValues = state.status === "error" ? state.values : undefined;
  // Editing (management) always shows everything already filled in; a brand
  // new submission starts with the optional section collapsed to keep the
  // first view short.
  const isEditing = Boolean(project);
  const f = dict.form;
  const hasExistingUpload = Boolean(project?.uploadedHtml || project?.uploadedFiles);
  const [launchMode, setLaunchMode] = useState<"url" | "file" | "folder">(
    (errorValues?.launchMode as "url" | "file" | "folder" | undefined) ??
      (hasExistingUpload ? "file" : "url")
  );
  const [folderPaths, setFolderPaths] = useState<string[]>([]);
  const [singleFileName, setSingleFileName] = useState<string | undefined>(undefined);
  const isHtmlOnlySelected = launchMode === "file" && Boolean(singleFileName && /\.html?$/i.test(singleFileName));
  // Total size of whatever is currently selected in file/folder mode, once
  // it exceeds MAX_UPLOAD_BYTES — checked client-side (not just left to the
  // server) because Netlify's own platform rejects an oversized request
  // with a raw 413 before this app's code ever runs, which would otherwise
  // show the student a generic "Something went wrong" with no indication
  // that the file's size was the actual problem. Catching it here means the
  // real reason is always shown, and the request is never even sent.
  const [oversizeBytes, setOversizeBytes] = useState<number | undefined>(undefined);
  // The Launch Link field is controlled (rather than defaultValue-based like
  // the rest of the form) specifically so a finished video relay (below) can
  // fill it in programmatically and flip the form into URL mode — an
  // uncontrolled input's defaultValue only applies once, at mount, so it
  // can't be updated this way after the fact.
  const [launchUrlValue, setLaunchUrlValue] = useState(
    errorValues?.launchUrl || (hasExistingUpload ? "" : project?.launchUrl) || ""
  );
  const [mediaRelay, setMediaRelay] = useState<
    { status: "uploading"; progress: number } | { status: "error"; message: string } | undefined
  >(undefined);
  const [relaySucceeded, setRelaySucceeded] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (oversizeBytes !== undefined || mediaRelay?.status === "uploading") {
      event.preventDefault();
    }
  }

  /** Splits `file` into chunks small enough to each individually clear
   * Netlify's per-request body-size ceiling, uploads them one at a time to
   * app/api/media-upload/chunk, then asks app/api/media-upload/finalize to
   * reassemble them and relay the complete video or PDF to a GitHub Release
   * asset (see lib/github.ts) — the one way this app can host a file bigger
   * than MAX_UPLOAD_BYTES itself. On success, switches the form to URL mode
   * with the resulting link already filled in, so submission afterward is
   * the exact same path as a student pasting a YouTube link by hand. */
  async function relayFileToGithub(file: File) {
    setMediaRelay({ status: "uploading", progress: 0 });
    const uploadId =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const totalChunks = Math.max(1, Math.ceil(file.size / MEDIA_UPLOAD_CHUNK_BYTES));

    try {
      for (let index = 0; index < totalChunks; index += 1) {
        const start = index * MEDIA_UPLOAD_CHUNK_BYTES;
        const chunk = file.slice(start, start + MEDIA_UPLOAD_CHUNK_BYTES);
        await relayFetch(
          `/api/media-upload/chunk?uploadId=${uploadId}&index=${index}&total=${totalChunks}`,
          { method: "POST", body: chunk }
        );
        // The last 10% is reserved for the finalize/relay step, which has
        // no per-chunk progress of its own to report.
        setMediaRelay({ status: "uploading", progress: Math.round(((index + 1) / totalChunks) * 90) });
      }

      const finalizeRes = await relayFetch("/api/media-upload/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId,
          totalChunks,
          filename: file.name,
          contentType: file.type || guessRelayContentType(file.name),
        }),
      });
      const data = (await finalizeRes.json()) as { url: string };

      setMediaRelay(undefined);
      setLaunchUrlValue(data.url);
      setLaunchMode("url");
      setRelaySucceeded(true);
    } catch (err) {
      const reason = err instanceof RelayError ? err.reason : "server";
      const message =
        reason === "network"
          ? f.mediaRelayNetworkError
          : reason === "too_large"
            ? format(f.mediaRelayTooLarge, { max: formatMb(MAX_GITHUB_RELAY_BYTES) })
            : reason === "unsupported_type"
              ? f.mediaRelayUnsupportedType
              : f.mediaRelayError;
      setMediaRelay({ status: "error", message });
    }
  }

  // webkitdirectory/directory aren't in React's known DOM attribute list, so
  // they're set imperatively here rather than as JSX props (which React
  // would otherwise silently drop) — this is what turns the file picker
  // into a folder picker in every browser that supports it.
  function setFolderPickerAttrs(el: HTMLInputElement | null) {
    el?.setAttribute("webkitdirectory", "");
    el?.setAttribute("directory", "");
  }

  function handleFolderChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setFolderPaths([]);
      setOversizeBytes(undefined);
      return;
    }
    const totalBytes = Array.from(files).reduce((sum, file) => sum + file.size, 0);
    setOversizeBytes(totalBytes > MAX_UPLOAD_BYTES ? totalBytes : undefined);
    // webkitRelativePath includes the picked folder's own name as the first
    // segment (e.g. "my-site/images/4.png") — dropped here so stored paths
    // are relative to the folder's *contents*, matching how a .zip's
    // internal paths are used (see lib/uploadedSite.ts).
    setFolderPaths(
      Array.from(files).map((file) => {
        const rel = relativePathOf(file);
        const slash = rel.indexOf("/");
        return slash === -1 ? rel : rel.slice(slash + 1);
      })
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      noValidate
      className="flex flex-col gap-6"
    >
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
            defaultValue={errorValues?.title ?? project?.title}
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
            defaultValue={errorValues?.creatorName ?? project?.creatorName}
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
            defaultValue={errorValues?.category || project?.category || ""}
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
            defaultValue={errorValues?.grade || project?.grade || ""}
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
            defaultValue={errorValues?.shortDescription ?? project?.shortDescription}
            aria-invalid={Boolean(errors.shortDescription)}
            aria-describedby={errors.shortDescription ? "shortDescription-error" : undefined}
            className={inputClass}
            placeholder={f.shortDescriptionPlaceholder}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {f.launchMode}
            <span className="ml-1 text-rose-600" aria-hidden="true">
              *
            </span>
          </span>
          <div role="radiogroup" aria-label={f.launchMode} className="flex flex-wrap gap-2">
            {(["url", "file", "folder"] as const).map((m) => (
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
                  onChange={() => {
                    setLaunchMode(m);
                    setOversizeBytes(undefined);
                  }}
                  className="sr-only"
                />
                {m === "url" ? f.launchModeUrl : m === "file" ? f.launchModeFile : f.launchModeFolder}
                {m === "folder" && (
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    {f.launchModeFolderBadge}
                  </span>
                )}
              </label>
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{f.launchModeNote}</p>
        </div>

        {launchMode === "url" ? (
          <Field id="launchUrl" label={f.launchUrl} required hint={f.launchUrlHint} error={errors.launchUrl}>
            <input
              id="launchUrl"
              name="launchUrl"
              type="url"
              required
              value={launchUrlValue}
              onChange={(e) => {
                setLaunchUrlValue(e.target.value);
                setRelaySucceeded(false);
              }}
              aria-invalid={Boolean(errors.launchUrl)}
              aria-describedby={errors.launchUrl ? "launchUrl-error" : "launchUrl-hint"}
              className={inputClass}
              placeholder={f.launchUrlPlaceholder}
            />
            {relaySucceeded && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{f.mediaRelaySuccess}</p>
            )}
          </Field>
        ) : launchMode === "file" ? (
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
              accept=".html,.htm,.zip,.png,.jpg,.jpeg,.gif,.webp,.pdf,.mp4,.webm,.mov,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.hwpx,.csv,.txt,.rtf,text/html,application/zip,application/x-zip-compressed,image/png,image/jpeg,image/gif,image/webp,application/pdf,video/mp4,video/webm,video/quicktime"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                setSingleFileName(selected?.name);
                setMediaRelay(undefined);
                if (
                  selected &&
                  selected.size > MAX_UPLOAD_BYTES &&
                  looksLikeRelayableFile(selected) &&
                  selected.size <= MAX_GITHUB_RELAY_BYTES
                ) {
                  // Too big to host ourselves but still within what the
                  // GitHub relay accepts — upload it there automatically
                  // instead of just telling the student to do it by hand.
                  setOversizeBytes(undefined);
                  void relayFileToGithub(selected);
                  return;
                }
                setOversizeBytes(selected && selected.size > MAX_UPLOAD_BYTES ? selected.size : undefined);
              }}
              aria-invalid={Boolean(errors.launchFile)}
              aria-describedby={errors.launchFile ? "launchFile-error" : "launchFile-hint"}
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white`}
            />
            {isHtmlOnlySelected && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
              >
                <span aria-hidden="true">⚠️</span>
                {f.launchFileHtmlOnlyWarning}
              </div>
            )}
            {mediaRelay?.status === "uploading" && (
              <div
                role="status"
                className="flex flex-col gap-1.5 rounded-xl border border-brand-300 bg-brand-50 px-3 py-2.5 text-sm text-brand-900 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-200"
              >
                <span>{format(f.mediaRelayUploading, { progress: mediaRelay.progress })}</span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-200 dark:bg-brand-900">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-[width]"
                    style={{ width: `${mediaRelay.progress}%` }}
                  />
                </div>
              </div>
            )}
            {mediaRelay?.status === "error" && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
              >
                <span aria-hidden="true">⛔</span>
                {mediaRelay.message}
              </div>
            )}
            {oversizeBytes !== undefined && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
              >
                <span aria-hidden="true">⛔</span>
                {format(f.launchFileTooLargeWarning, {
                  size: formatMb(oversizeBytes),
                  max: formatMb(MAX_UPLOAD_BYTES),
                })}
              </div>
            )}
          </Field>
        ) : (
          <Field
            id="launchFolder"
            label={f.launchFolder}
            required={!hasExistingUpload}
            hint={hasExistingUpload ? f.launchFolderKeepHint : f.launchFolderHint}
            error={errors.launchFile}
          >
            <input
              ref={setFolderPickerAttrs}
              id="launchFolder"
              name="launchFolderFiles"
              type="file"
              multiple
              required={!hasExistingUpload}
              onChange={handleFolderChange}
              aria-invalid={Boolean(errors.launchFile)}
              aria-describedby={errors.launchFile ? "launchFolder-error" : "launchFolder-hint"}
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white`}
            />
            <input type="hidden" name="launchFolderPaths" value={JSON.stringify(folderPaths)} />
            {folderPaths.length > 0 && oversizeBytes === undefined && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {format(f.launchFolderFileCount, { count: folderPaths.length })}
              </p>
            )}
            {oversizeBytes !== undefined && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2.5 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
              >
                <span aria-hidden="true">⛔</span>
                {format(f.launchFileTooLargeWarning, {
                  size: formatMb(oversizeBytes),
                  max: formatMb(MAX_UPLOAD_BYTES),
                })}
              </div>
            )}
          </Field>
        )}

        <div className="flex items-center gap-2">
          <input
            id="handsOnAvailable"
            name="handsOnAvailable"
            type="checkbox"
            defaultChecked={errorValues?.handsOnAvailable ?? project?.handsOnAvailable ?? true}
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
            defaultValue={errorValues?.tags ?? project?.tags.join(", ")}
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
            defaultValue={errorValues?.coverImageUrl ?? project?.coverImageUrl}
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
            defaultValue={errorValues?.technologies ?? project?.technologies.join(", ")}
            className={inputClass}
            placeholder={f.technologiesPlaceholder}
          />
        </Field>

        <Field id="motivation" label={f.motivation} error={errors.motivation}>
          <textarea
            id="motivation"
            name="motivation"
            rows={3}
            defaultValue={errorValues?.motivation ?? project?.motivation}
            className={inputClass}
          />
        </Field>

        <Field id="usageInstructions" label={f.usageInstructions} error={errors.usageInstructions}>
          <textarea
            id="usageInstructions"
            name="usageInstructions"
            rows={3}
            defaultValue={errorValues?.usageInstructions ?? project?.usageInstructions}
            className={inputClass}
          />
        </Field>

        <Field id="safetyNotes" label={f.safetyNotes} error={errors.safetyNotes}>
          <textarea
            id="safetyNotes"
            name="safetyNotes"
            rows={2}
            defaultValue={errorValues?.safetyNotes ?? project?.safetyNotes}
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
              defaultValue={
                (errorValues?.status as ExhibitionStatus | undefined) ||
                project?.status ||
                ("pending_review" as ExhibitionStatus)
              }
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
        disabled={isPending || oversizeBytes !== undefined || mediaRelay?.status === "uploading"}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 text-base font-semibold text-white shadow-md shadow-brand-600/30 transition hover:from-brand-700 hover:to-brand-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {isPending ? f.submitButtonSaving : submitLabel}
      </button>
    </form>
  );
}
