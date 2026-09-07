"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "전시 둘러보기" },
  { href: "/guide", label: "제출 가이드" },
  { href: "/submit", label: "프로젝트 제출하기" },
  { href: "/manage", label: "프로젝트 관리 (교사용)" },
];

export function Header() {
  const pathname = usePathname();

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
          <span className="leading-tight">
            학생 디지털 프로젝트
            <br className="sm:hidden" /> 전시관
          </span>
        </Link>
        <nav aria-label="주요 메뉴" className="flex flex-wrap gap-1">
          {NAV_LINKS.map((link) => {
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
      </div>
    </header>
  );
}
