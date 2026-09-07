"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function HeaderNav({
  ariaLabel,
  links,
}: {
  ariaLabel: string;
  links: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap gap-1">
      {links.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-3.5 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
              isActive
                ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
