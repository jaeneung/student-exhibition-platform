"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/dictionary";
import type { FormActionState } from "@/lib/formAction";

const inputClass =
  "rounded-xl border border-zinc-300 px-3 py-2.5 text-base transition focus-visible:border-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-700 dark:bg-zinc-950";

/** Shared by /student/login and /student/signup — the two forms differ only
 * by a confirm-password field and the submit label, so one component with a
 * `mode` switch avoids maintaining near-identical markup twice. */
export function StudentAuthForm({
  dict,
  mode,
  action,
  next,
}: {
  dict: Dictionary;
  mode: "login" | "signup";
  action: (prevState: FormActionState, formData: FormData) => Promise<FormActionState>;
  /** Where to return to after success — carried through as a hidden field
   * so a visitor redirected here from e.g. /submit ends up back there. */
  next?: string;
}) {
  const [state, formAction, isPending] = useActionState<FormActionState, FormData>(action, {
    status: "idle",
  });
  const sa = dict.studentAuth;

  return (
    <form
      action={formAction}
      noValidate
      className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      {next && <input type="hidden" name="next" value={next} />}

      {state.status === "error" && state.formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
        >
          <span aria-hidden="true">⚠️</span>
          {state.formError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {dict.auth.usernameLabel}
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          className={inputClass}
        />
        {mode === "signup" && <p className="text-xs text-zinc-500 dark:text-zinc-400">{sa.usernameHint}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {dict.auth.passwordLabel}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className={inputClass}
        />
        {mode === "signup" && <p className="text-xs text-zinc-500 dark:text-zinc-400">{sa.passwordHint}</p>}
      </div>

      {mode === "signup" && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {sa.confirmPasswordLabel}
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 text-base font-semibold text-white shadow-md shadow-brand-600/30 transition hover:from-brand-700 hover:to-brand-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {mode === "signup"
          ? isPending
            ? sa.signupButtonPending
            : sa.signupButton
          : isPending
            ? dict.auth.loginButtonPending
            : dict.auth.loginButton}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {mode === "signup" ? sa.alreadyHaveAccount : sa.noAccountYet}{" "}
        <Link
          href={
            mode === "signup"
              ? `/student/login${next ? `?next=${encodeURIComponent(next)}` : ""}`
              : `/student/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`
          }
          className="font-medium text-brand-700 hover:underline dark:text-brand-400"
        >
          {mode === "signup" ? sa.goToLogin : sa.goToSignup}
        </Link>
      </p>
    </form>
  );
}
