"use server";

import { revalidatePath } from "next/cache";
import { getDictionary } from "@/lib/dictionary";
import {
  readProjectFormData,
  submissionValuesToProjectFields,
  zodIssuesToFieldErrors,
  type FormActionState,
} from "@/lib/formAction";
import { getLocale } from "@/lib/i18n";
import { getSubmissionSchema } from "@/lib/schema";
import { createProject, DuplicateSubmissionError } from "@/lib/store";

export async function submitProjectAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const dict = getDictionary(await getLocale());
  const raw = readProjectFormData(formData);
  const parsed = getSubmissionSchema(dict).safeParse(raw);

  if (!parsed.success) {
    return { status: "error", errors: zodIssuesToFieldErrors(parsed.error) };
  }

  try {
    const project = await createProject(submissionValuesToProjectFields(parsed.data));
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
