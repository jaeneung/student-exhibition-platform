import { redirect } from "next/navigation";
import { hasValidTeacherSession } from "@/lib/auth";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { loginAction } from "./actions";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await hasValidTeacherSession()) {
    redirect("/manage");
  }

  const dict = getDictionary(await getLocale());

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm"
          aria-hidden="true"
        >
          🔒
        </span>
        <h1 className="text-2xl font-bold">{dict.auth.loginTitle}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.auth.loginSubtitle}</p>
      </div>
      <LoginForm dict={dict} action={loginAction} />
    </div>
  );
}
