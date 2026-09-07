import { setLocaleAction } from "@/app/actions";
import type { Locale } from "@/lib/i18n";

/** Plain forms bound to a Server Action — works with JavaScript disabled and
 * needs no client component, unlike a typical <select onChange> toggle. */
export function LanguageToggle({
  locale,
  ariaLabel,
  koLabel,
  enLabel,
}: {
  locale: Locale;
  ariaLabel: string;
  koLabel: string;
  enLabel: string;
}) {
  const baseClass = "px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";
  const activeClass = "bg-brand-600 text-white";
  const inactiveClass = "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex overflow-hidden rounded-full border border-zinc-300 dark:border-zinc-700"
    >
      <form action={setLocaleAction.bind(null, "ko")}>
        <button
          type="submit"
          aria-current={locale === "ko" ? "true" : undefined}
          className={`${baseClass} ${locale === "ko" ? activeClass : inactiveClass}`}
        >
          {koLabel}
        </button>
      </form>
      <form action={setLocaleAction.bind(null, "en")}>
        <button
          type="submit"
          aria-current={locale === "en" ? "true" : undefined}
          className={`${baseClass} ${locale === "en" ? activeClass : inactiveClass}`}
        >
          {enLabel}
        </button>
      </form>
    </div>
  );
}
