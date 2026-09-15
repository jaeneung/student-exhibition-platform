import type { ProjectCategory } from "./types";

/** Visual identity per category: an icon and a gradient for the card cover
 * placeholder shown when a project has no cover image. Purely presentational —
 * an unrecognized/custom category still gets a sensible fallback. */
const CATEGORY_STYLES: Record<ProjectCategory, { icon: string; gradient: string }> = {
  웹사이트: { icon: "🌐", gradient: "from-sky-400 to-blue-600" },
  게임: { icon: "🎮", gradient: "from-fuchsia-400 to-purple-600" },
  앱: { icon: "📱", gradient: "from-emerald-400 to-teal-600" },
  "AI 챗봇": { icon: "🤖", gradient: "from-violet-400 to-indigo-600" },
  인터랙티브: { icon: "✨", gradient: "from-amber-400 to-orange-600" },
  CSA: { icon: "💻", gradient: "from-cyan-400 to-blue-700" },
  로보틱스: { icon: "🦾", gradient: "from-rose-400 to-red-600" },
  기타: { icon: "📦", gradient: "from-slate-400 to-slate-600" },
};

const FALLBACK = { icon: "📦", gradient: "from-brand-400 to-brand-600" };

export function getCategoryStyle(category: string): { icon: string; gradient: string } {
  return CATEGORY_STYLES[category as ProjectCategory] ?? FALLBACK;
}
