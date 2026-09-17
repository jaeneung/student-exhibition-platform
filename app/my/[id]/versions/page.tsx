import { notFound } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { format, getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { getProjectByIdForManagement } from "@/lib/store";
import { requireStudentSession } from "@/lib/studentAuth";
import type { ProjectVersion } from "@/lib/types";

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === "ko" ? "ko-KR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Where "열람/View" for a given past version should actually point: our own
 * /versions/{id}/{versionId}/{path} route for content this app hosted
 * (omitting the trailing path segment entirely when there isn't an
 * entryPath, e.g. a legacy lone-.html version — an *empty* segment there
 * would make the catch-all route look up a literal "" filename and 404),
 * or straight to the version's own launchUrl when it was an external link
 * with nothing uploaded at all. */
function versionViewHref(id: string, version: ProjectVersion): string {
  if (!version.uploadedFiles && version.uploadedHtml === undefined) {
    return version.launchUrl;
  }
  return version.entryPath
    ? `/versions/${id}/${version.id}/${version.entryPath}`
    : `/versions/${id}/${version.id}`;
}

export default async function ProjectVersionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = await requireStudentSession(`/my/${id}/versions`);

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const project = await getProjectByIdForManagement(id);

  if (!project || project.ownerId !== studentId) {
    notFound();
  }

  const versions = [...(project.versions ?? [])].reverse();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <Link
          href={`/my/${id}/edit`}
          className="w-fit text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-400"
        >
          {dict.my.backToMy}
        </Link>
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm"
          aria-hidden="true"
        >
          🕓
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.my.versionsTitle}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.my.versionsSubtitle}</p>
      </div>

      {versions.length === 0 ? (
        <EmptyState icon="🕓" title={dict.my.versionsEmptyTitle} message={dict.my.versionsEmptyMessage} />
      ) : (
        <ul className="flex flex-col gap-3">
          <li className="flex items-center justify-between gap-3 rounded-2xl border border-brand-300 bg-brand-50 p-4 text-sm dark:border-brand-800 dark:bg-brand-950">
            <span className="font-semibold text-brand-800 dark:text-brand-200">
              {dict.my.currentVersionLabel}
            </span>
            <a
              href={project.launchUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-700 hover:underline dark:text-brand-300"
            >
              {dict.my.versionViewLink}
            </a>
          </li>
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-zinc-700 dark:text-zinc-300">
                {format(dict.my.versionEntryLabel, { date: formatDate(version.savedAt, locale) })}
              </span>
              <a
                href={versionViewHref(id, version)}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand-700 hover:underline dark:text-brand-400"
              >
                {dict.my.versionViewLink}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
