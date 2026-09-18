import { format, type Dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";
import type { LinkStatus } from "@/lib/types";

/** The ❗ shown next to a project whose launchUrl failed the most recent
 * manual link check (see app/manage/actions.ts's checkAllProjectLinksAction).
 * Renders nothing for a project that's never been checked, or that was
 * checked and is fine — this only ever flags a known problem, never "we
 * don't know" or "this is working". */
export function LinkBrokenBadge({
  linkStatus,
  dict,
  locale,
}: {
  linkStatus?: LinkStatus;
  dict: Dictionary;
  locale: Locale;
}) {
  if (!linkStatus || linkStatus.ok) return null;

  // Explicit locale, not a bare toLocaleString() — this renders server-side,
  // and letting the date format follow whatever locale Node's ICU build
  // defaults to (rather than this app's own locale) risks a hydration
  // mismatch if that ever differs from the client's.
  const checkedAtLabel = new Date(linkStatus.checkedAt).toLocaleString(locale === "ko" ? "ko-KR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <span
      role="img"
      aria-label={format(dict.manage.linkBrokenTooltip, { date: checkedAtLabel })}
      title={format(dict.manage.linkBrokenTooltip, { date: checkedAtLabel })}
      className="cursor-help text-base"
    >
      {dict.manage.linkBrokenBadge}
    </span>
  );
}
