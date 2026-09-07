"use server";

import { revalidatePath } from "next/cache";
import {
  readProjectFormData,
  submissionValuesToProjectFields,
  zodIssuesToFieldErrors,
  type FormActionState,
} from "@/lib/formAction";
import { submissionSchema } from "@/lib/schema";
import { createProject, DuplicateSubmissionError } from "@/lib/store";

export async function submitProjectAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const raw = readProjectFormData(formData);
  const parsed = submissionSchema.safeParse(raw);

  if (!parsed.success) {
    return { status: "error", errors: zodIssuesToFieldErrors(parsed.error) };
  }

  try {
    const project = await createProject(submissionValuesToProjectFields(parsed.data));
    revalidatePath("/manage");
    return {
      status: "success",
      message:
        "프로젝트가 제출되었습니다! 선생님이 검토한 뒤 '전시중' 상태로 바뀌면 방문자에게 공개됩니다.",
      projectId: project.id,
    };
  } catch (err) {
    if (err instanceof DuplicateSubmissionError) {
      return { status: "error", formError: err.message };
    }
    return {
      status: "error",
      formError: "제출 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
