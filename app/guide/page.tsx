import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";

function StepCard({
  number,
  icon,
  title,
  children,
}: {
  number: number;
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white">
        {number}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <span aria-hidden="true">{icon}</span>
          {title}
        </h2>
        <div className="flex flex-col gap-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {children}
        </div>
      </div>
    </div>
  );
}

function ToolGuide({ name, emoji, steps }: { name: string; emoji: string; steps: string[] }) {
  return (
    <details className="group rounded-xl border border-zinc-200 bg-zinc-50 open:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:open:bg-zinc-900">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold">
        <span className="flex items-center gap-2">
          <span aria-hidden="true">{emoji}</span>
          {name}
        </span>
        <span aria-hidden="true" className="text-zinc-400 transition group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <ol className="flex flex-col gap-1.5 px-4 pb-4 text-sm text-zinc-700 dark:text-zinc-300">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-semibold text-brand-600">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
    </details>
  );
}

export default async function GuidePage() {
  const dict = getDictionary(await getLocale());
  const g = dict.guide;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl shadow-sm"
          aria-hidden="true"
        >
          📖
        </span>
        <h1 className="text-2xl font-bold sm:text-3xl">{g.title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{g.subtitle}</p>
      </div>

      <StepCard number={1} icon="✅" title={g.step1Title}>
        <p>{g.step1Body1}</p>
        <p className="font-medium">{g.step1Body2}</p>

        <div className="mt-1 flex flex-col gap-2">
          {g.tools.map((tool) => (
            <ToolGuide key={tool.name} name={tool.name} emoji={tool.emoji} steps={tool.steps} />
          ))}
        </div>

        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{g.step1Note}</p>
      </StepCard>

      <StepCard number={2} icon="📝" title={g.step2Title}>
        <p>{g.step2Body}</p>
        <ul className="list-disc pl-5">
          {g.step2Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{g.step2Note}</p>
      </StepCard>

      <StepCard number={3} icon="🔒" title={g.step3Title}>
        <ul className="list-disc pl-5">
          {g.step3Items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </StepCard>

      <StepCard number={4} icon="🚀" title={g.step4Title}>
        <p>
          {g.step4Body1Before}{" "}
          <Link href="/submit" className="font-semibold text-brand-700 underline dark:text-brand-400">
            {g.step4Body1LinkText}
          </Link>{" "}
          {g.step4Body1After}
        </p>
        <p>{g.step4Body2}</p>
      </StepCard>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50 p-6 text-center dark:border-brand-800 dark:bg-brand-950">
        <p className="text-sm font-medium text-brand-900 dark:text-brand-200">{g.ctaText}</p>
        <Link
          href="/submit"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 text-sm font-semibold text-white shadow-md shadow-brand-600/30 transition hover:from-brand-700 hover:to-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {g.ctaButton}
        </Link>
      </div>
    </div>
  );
}
