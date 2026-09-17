import { redirect } from "next/navigation";
import { StudentAuthForm } from "@/components/StudentAuthForm";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { getStudentSession, safeNextPath } from "@/lib/studentAuth";
import { signupAction } from "./actions";

export default async function StudentSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  if (await getStudentSession()) {
    redirect(next);
  }

  const dict = getDictionary(await getLocale());
  const sa = dict.studentAuth;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm"
          aria-hidden="true"
        >
          ✍️
        </span>
        <h1 className="text-2xl font-bold">{sa.signupTitle}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{sa.signupSubtitle}</p>
      </div>
      <StudentAuthForm dict={dict} mode="signup" action={signupAction} next={next} />
    </div>
  );
}
