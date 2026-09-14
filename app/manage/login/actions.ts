"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  sessionCookieOptions,
  verifyTeacherCredentials,
} from "@/lib/auth";
import { format, getDictionary } from "@/lib/dictionary";
import type { FormActionState } from "@/lib/formAction";
import { getLocale } from "@/lib/i18n";
import { checkThrottle, getClientIp, recordFailedAttempt, resetAttempts } from "@/lib/loginThrottle";

export async function loginAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const dict = getDictionary(await getLocale());
  const username = formData.get("username")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const ip = await getClientIp();
  const throttle = await checkThrottle(ip);
  if (throttle.throttled) {
    return {
      status: "error",
      formError: format(dict.auth.tooManyAttempts, {
        minutes: Math.ceil((throttle.retryAfterSeconds ?? 0) / 60),
      }),
    };
  }

  let valid: boolean;
  try {
    valid = verifyTeacherCredentials(username, password);
  } catch {
    // TEACHER_USERNAME/PASSWORD_SALT/PASSWORD_HASH/SESSION_SECRET missing —
    // a deployment/config problem, not a wrong password. Doesn't count
    // against the throttle, since it's not something guessing more would fix.
    return { status: "error", formError: dict.auth.serverNotConfigured };
  }

  if (!valid) {
    await recordFailedAttempt(ip);
    return { status: "error", formError: dict.auth.invalidCredentials };
  }

  await resetAttempts(ip);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, createSessionToken(), sessionCookieOptions());
  redirect("/manage");
}
