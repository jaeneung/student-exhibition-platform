"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import type { FormActionState } from "@/lib/formAction";
import { getLocale } from "@/lib/i18n";
import {
  STUDENT_SESSION_COOKIE_NAME,
  createStudentSessionToken,
  safeNextPath,
  studentSessionCookieOptions,
} from "@/lib/studentAuth";
import { createStudent, UsernameTakenError } from "@/lib/studentStore";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,20}$/;
const MIN_PASSWORD_LENGTH = 6;

export async function signupAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const dict = getDictionary(await getLocale());
  const sa = dict.studentAuth;
  const username = formData.get("username")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";
  const next = safeNextPath(formData.get("next")?.toString());

  if (!USERNAME_PATTERN.test(username)) {
    return { status: "error", formError: sa.usernameInvalid };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { status: "error", formError: sa.passwordTooShort };
  }
  if (password !== confirmPassword) {
    return { status: "error", formError: sa.passwordMismatch };
  }

  let studentId: string;
  try {
    const student = await createStudent(username, password);
    studentId = student.id;
  } catch (err) {
    if (err instanceof UsernameTakenError) {
      return { status: "error", formError: sa.usernameTaken };
    }
    throw err;
  }

  const store = await cookies();
  store.set(STUDENT_SESSION_COOKIE_NAME, createStudentSessionToken(studentId), studentSessionCookieOptions());
  redirect(next);
}
