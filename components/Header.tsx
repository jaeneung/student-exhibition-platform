import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { HeaderNav } from "./HeaderNav";
import { LanguageToggle } from "./LanguageToggle";

export async function Header() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const links = [
    { href: "/", label: dict.nav.gallery },
    { href: "/guide", label: dict.nav.guide },
    { href: "/submit", label: dict.nav.submit },
    { href: "/manage", label: dict.nav.manage },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg py-1 text-base font-bold text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-zinc-50"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg shadow-sm shadow-brand-900/20"
            aria-hidden="true"
          >
            🎓
          </span>
          <span className="leading-tight">{dict.brand.name}</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <HeaderNav ariaLabel={dict.nav.ariaLabel} links={links} />
          <LanguageToggle
            locale={locale}
            ariaLabel={dict.language.ariaLabel}
            koLabel={dict.language.ko}
            enLabel={dict.language.en}
          />
        </div>
      </div>
    </header>
  );
}
