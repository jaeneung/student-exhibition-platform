import { notFound } from "next/navigation";
import Link from "next/link";
import { HeroBackgroundImage } from "@/components/HeroBackgroundImage";
import { LaunchButton } from "@/components/LaunchButton";
import { QrCode } from "@/components/QrCode";
import { StatusBadge } from "@/components/StatusBadge";
import { getCategoryStyle } from "@/lib/categoryStyles";
import { format, getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";
import { getPublicProjectById } from "@/lib/store";

function DetailSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h2>
      <div className="text-sm leading-relaxed whitespace-pre-line text-zinc-700 dark:text-zinc-300">
        {children}
      </div>
    </section>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const dict = getDictionary(await getLocale());
  const { id } = await params;
  const project = await getPublicProjectById(id);

  if (!project) {
    notFound();
  }

  const { icon, gradient } = getCategoryStyle(project.category);
  const categoryLabel = dict.categories[project.category] ?? project.category;

  return (
    <div className="flex flex-1 flex-col">
      <div className={`relative overflow-hidden bg-gradient-to-br ${gradient}`}>
        {project.coverImageUrl && <HeroBackgroundImage src={project.coverImageUrl} />}
        <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-10 sm:px-6 sm:py-14">
          <Link
            href="/"
            className="w-fit rounded-lg text-sm font-medium text-white/90 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {dict.detail.back}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
              <span aria-hidden="true">{icon}</span>
              {categoryLabel}
            </span>
            <StatusBadge status={project.status} label={dict.status[project.status]} />
          </div>
          <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {project.title}
          </h1>
          <p className="max-w-2xl text-base text-white/90">{project.shortDescription}</p>
          <p className="text-sm font-medium text-white/80">
            {dict.detail.madeBy} {project.creatorName}
          </p>
          {project.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4 lg:order-1">
          <DetailSection icon="📝" title={dict.detail.fullDescription}>
            {project.fullDescription}
          </DetailSection>
          {project.motivation && (
            <DetailSection icon="💡" title={dict.detail.motivation}>
              {project.motivation}
            </DetailSection>
          )}
          {project.usageInstructions && (
            <DetailSection icon="📋" title={dict.detail.usageInstructions}>
              {project.usageInstructions}
            </DetailSection>
          )}
          {project.safetyNotes && (
            <DetailSection icon="⚠️" title={dict.detail.safetyNotes}>
              {project.safetyNotes}
            </DetailSection>
          )}
          {project.technologies.length > 0 && (
            <DetailSection icon="🛠️" title={dict.detail.technologies}>
              <ul className="flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <li
                    key={tech}
                    className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {tech}
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:order-2 lg:self-start">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-semibold">{dict.detail.tryTitle}</h2>
            {!project.handsOnAvailable && (
              <div
                role="status"
                className="w-full rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
              >
                {dict.detail.handsOnWarning}
              </div>
            )}
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.detail.tryHint}</p>
            <LaunchButton
              url={project.launchUrl}
              available={project.handsOnAvailable}
              ctaLabel={dict.launch.cta}
              newTabSrLabel={dict.launch.newTabSr}
              unavailableLabel={dict.launch.unavailable}
            />
            <div className="w-full border-t border-dashed border-zinc-200 pt-4 dark:border-zinc-700">
              <QrCode
                url={project.launchUrl}
                altText={format(dict.qr.alt, { title: project.title })}
                caption={dict.qr.caption}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
