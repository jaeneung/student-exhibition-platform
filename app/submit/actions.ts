"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getDictionary } from "@/lib/dictionary";
import {
  buildSubmittedValues,
  parseFolderPaths,
  readProjectFormData,
  resolveLaunchFields,
  submissionValuesToProjectFields,
  zodIssuesToFieldErrors,
  type FormActionState,
} from "@/lib/formAction";
import { getLocale } from "@/lib/i18n";
import { getRequestOrigin } from "@/lib/origin";
import { getSubmissionSchema } from "@/lib/schema";
import { createProject, DuplicateSubmissionError } from "@/lib/store";
import { requireStudentSession } from "@/lib/studentAuth";

export async function submitProjectAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  // Defense in depth: app/submit/page.tsx already redirects an anonymous
  // visitor before this form can even be reached, but a Server Action is
  // still a callable endpoint in its own right regardless of which page
  // rendered its trigger (same reasoning as requireTeacherSession).
  const ownerId = await requireStudentSession("/submit");
  const dict = getDictionary(await getLocale());
  const raw = readProjectFormData(formData);
  const parsed = getSubmissionSchema(dict).safeParse(raw);

  // Generated up front (rather than inside createProject, as usual) because
  // an uploaded file's own launchUrl is /files/{id} — the id has to exist
  // before the launch fields can be resolved, not after.
  const id = randomUUID();
  const fileEntry = formData.get("launchFile");
  let launch: Awaited<ReturnType<typeof resolveLaunchFields>>;
  try {
    launch = await resolveLaunchFields({
      mode: formData.get("launchMode")?.toString() ?? "url",
      url: formData.get("launchUrl")?.toString() ?? "",
      file: fileEntry instanceof File ? fileEntry : null,
      folderFiles: formData.getAll("launchFolderFiles").filter((v): v is File => v instanceof File),
      folderPaths: parseFolderPaths(formData.get("launchFolderPaths")),
      coverImageUrl: raw.coverImageUrl,
      id,
      origin: await getRequestOrigin(),
      dict,
    });
  } catch {
    // Anything unexpected while reading/processing the uploaded file (a
    // corrupt archive JSZip couldn't even open, a truncated multipart body,
    // etc.) would otherwise propagate out of this Server Action and hit the
    // generic global error boundary (app/error.tsx) — a page-level "problem
    // loading this page" message that says nothing about the file and loses
    // every other field the student already typed. Catching it here keeps
    // them on the form with a file-specific message and their other answers
    // intact (buildSubmittedValues below).
    return {
      status: "error",
      errors: { launchFile: dict.validation.launchFileUploadFailed },
      values: buildSubmittedValues(raw, formData),
    };
  }

  if (!parsed.success || !launch.ok) {
    return {
      status: "error",
      errors: {
        ...(parsed.success ? {} : zodIssuesToFieldErrors(parsed.error)),
        ...(launch.ok ? {} : launch.errors),
      },
      values: buildSubmittedValues(raw, formData),
    };
  }

  try {
    const project = await createProject(
      { ...submissionValuesToProjectFields(parsed.data, launch.value), ownerId },
      id
    );
    revalidatePath("/manage");
    return {
      status: "success",
      message: dict.validation.submitSuccess,
      projectId: project.id,
    };
  } catch (err) {
    const values = buildSubmittedValues(raw, formData);
    if (err instanceof DuplicateSubmissionError) {
      return { status: "error", formError: dict.validation.duplicateSubmission, values };
    }
    return {
      status: "error",
      formError: dict.validation.submitGenericError,
      values,
    };
  }
}
