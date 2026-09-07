import Link from "next/link";
import type { Project } from "@/lib/types";
import { getCategoryStyle } from "@/lib/categoryStyles";
import type { Dictionary } from "@/lib/dictionary";
import { StatusBadge } from "./StatusBadge";

export function ProjectCard({
  project,
  dict,
  showStatus = false,
}: {
  project: Project;
  dict: Dictionary;
  showStatus?: boolean;
}) {
  const primaryTags = project.tags.slice(0, 3);
  const { icon, gradient } = getCategoryStyle(project.category);
  const categoryLabel = dict.categories[project.category] ?? project.category;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-900/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:shadow-black/40"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        {project.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.coverImageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} text-5xl`}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {categoryLabel}
          </span>
          {showStatus && <StatusBadge status={project.status} label={dict.status[project.status]} />}
        </div>
        {!project.handsOnAvailable && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 py-2 text-xs font-medium text-white">
            {dict.card.handsOnPaused}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-semibold text-zinc-900 transition group-hover:text-brand-700 dark:text-zinc-50 dark:group-hover:text-brand-300">
          {project.title}
        </h3>
        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {project.shortDescription}
        </p>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {project.creatorName}
        </p>
        {primaryTags.length > 0 && (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {primaryTags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300"
              >
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
