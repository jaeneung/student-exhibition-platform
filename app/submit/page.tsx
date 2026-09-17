import Link from "next/link";
import { ProjectForm } from "@/components/ProjectForm";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { requireStudentSession } from "@/lib/studentAuth";
import { submitProjectAction } from "./actions";

export default async function SubmitPage() {
  // Submitting now requires a student account, so the resulting project has
  // an owner and can later be edited from /my/** (see app/submit/actions.ts).
  // Bounces to /student/login?next=/submit and back here on success.
  await requireStudentSession("/submit");

  const dict = getDictionary(await getLocale());

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm" aria-hidden="true">
          🚀
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.submitPage.title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.submitPage.intro}</p>
        <Link
          href="/guide"
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:bg-brand-950 dark:text-brand-300"
        >
          {dict.submitPage.guideLink}
        </Link>
      </div>
      <ProjectForm dict={dict} action={submitProjectAction} submitLabel={dict.submitPage.submitLabel} />
    </div>
  );
}
