"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getDictionary } from "@/lib/dictionary";
import {
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

export async function submitProjectAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const dict = getDictionary(await getLocale());
  const raw = readProjectFormData(formData);
  const parsed = getSubmissionSchema(dict).safeParse(raw);

  // Generated up front (rather than inside createProject, as usual) because
  // an uploaded file's own launchUrl is /files/{id} — the id has to exist
  // before the launch fields can be resolved, not after.
  const id = randomUUID();
  const fileEntry = formData.get("launchFile");
  const launch = await resolveLaunchFields({
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

  if (!parsed.success || !launch.ok) {
    return {
      status: "error",
      errors: {
        ...(parsed.success ? {} : zodIssuesToFieldErrors(parsed.error)),
        ...(launch.ok ? {} : launch.errors),
      },
    };
  }

  try {
    const project = await createProject(
      submissionValuesToProjectFields(parsed.data, launch.value),
      id
    );
    revalidatePath("/manage");
    return {
      status: "success",
      message: dict.validation.submitSuccess,
      projectId: project.id,
    };
  } catch (err) {
    if (err instanceof DuplicateSubmissionError) {
      return { status: "error", formError: dict.validation.duplicateSubmission };
    }
    return {
      status: "error",
      formError: dict.validation.submitGenericError,
    };
  }
}
