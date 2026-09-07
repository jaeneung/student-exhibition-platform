import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";

export default async function NotFound() {
  const dict = getDictionary(await getLocale());
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-4xl dark:bg-brand-950" aria-hidden="true">
        🔍
      </span>
      <h1 className="text-xl font-semibold">{dict.notFound.title}</h1>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">{dict.notFound.message}</p>
      <Link
        href="/"
        className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/30 hover:from-brand-700 hover:to-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {dict.notFound.cta}
      </Link>
    </div>
  );
}
