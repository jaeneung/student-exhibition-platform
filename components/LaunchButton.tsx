export function LaunchButton({
  url,
  available,
  ctaLabel,
  newTabSrLabel,
  unavailableLabel,
}: {
  url: string;
  available: boolean;
  ctaLabel: string;
  newTabSrLabel: string;
  unavailableLabel: string;
}) {
  if (!available) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-zinc-200 px-6 text-base font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
      >
        {unavailableLabel}
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 text-base font-semibold text-white shadow-md shadow-brand-600/30 transition hover:from-brand-700 hover:to-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      {ctaLabel}
      <span aria-hidden="true">↗</span>
      <span className="sr-only">{newTabSrLabel}</span>
    </a>
  );
}
