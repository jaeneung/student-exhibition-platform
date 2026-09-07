"use client";

import { useEffect, useState } from "react";
import { getDictionary } from "@/lib/dictionary";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/localeConstants";

// error.tsx must be a Client Component (Next.js requirement for error
// boundaries), so it can't use the server-only cookies() API that every other
// page uses for locale. The toggle sets a plain (non-httpOnly) cookie for
// exactly this reason — it's readable here via document.cookie.
function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : undefined;
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
}

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    // document.cookie is only available client-side; starting from
    // DEFAULT_LOCALE and correcting after mount (rather than reading it
    // during the initial render) avoids a server/client hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocale(readLocaleCookie());
  }, []);
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-4xl dark:bg-rose-950" aria-hidden="true">
        ⚠️
      </span>
      <h1 className="text-xl font-semibold">{dict.error.title}</h1>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">{dict.error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/30 hover:from-brand-700 hover:to-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {dict.error.retry}
      </button>
    </div>
  );
}
