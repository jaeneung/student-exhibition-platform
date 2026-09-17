"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { format, getDictionary } from "@/lib/dictionary";
import type { FormActionState } from "@/lib/formAction";
import { getLocale } from "@/lib/i18n";
import { checkThrottle, recordFailedAttempt, resetAttempts } from "@/lib/loginThrottle";
import {
  STUDENT_SESSION_COOKIE_NAME,
  createStudentSessionToken,
  safeNextPath,
  studentSessionCookieOptions,
} from "@/lib/studentAuth";
import { verifyStudentCredentials } from "@/lib/studentStore";

export async function studentLoginAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const dict = getDictionary(await getLocale());
  const username = formData.get("username")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const next = safeNextPath(formData.get("next")?.toString());

  // Keyed by username (not IP, unlike teacher login) — a whole classroom can
  // share one school-network IP, so an IP-keyed throttle here would let one
  // student's mistyped password lock out everyone else's login attempts too.
  // See lib/loginThrottle.ts's top comment.
  const throttleKey = `student-username:${username.trim().toLowerCase()}`;
  const throttle = await checkThrottle(throttleKey);
  if (throttle.throttled) {
    return {
      status: "error",
      formError: format(dict.auth.tooManyAttempts, {
        minutes: Math.ceil((throttle.retryAfterSeconds ?? 0) / 60),
      }),
    };
  }

  const student = await verifyStudentCredentials(username, password);
  if (!student) {
    await recordFailedAttempt(throttleKey);
    return { status: "error", formError: dict.auth.invalidCredentials };
  }

  await resetAttempts(throttleKey);
  const store = await cookies();
  store.set(
    STUDENT_SESSION_COOKIE_NAME,
    createStudentSessionToken(student.id),
    studentSessionCookieOptions()
  );
  redirect(next);
}

export async function studentLogoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(STUDENT_SESSION_COOKIE_NAME);
  redirect("/student/login");
}
