import { getLocale } from "@/lib/i18n";
import { CodeMazeDemo } from "./CodeMazeDemo";
import { getCodeMazeContent } from "./content";

export default async function CodeMazeDemoPage() {
  const content = getCodeMazeContent(await getLocale());
  return <CodeMazeDemo content={content} />;
}
