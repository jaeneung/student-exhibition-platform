import { getLocale } from "@/lib/i18n";
import { getLunchRecommenderContent } from "./content";
import { LunchRecommenderDemo } from "./LunchRecommenderDemo";

export default async function LunchRecommenderDemoPage() {
  const content = getLunchRecommenderContent(await getLocale());
  return <LunchRecommenderDemo content={content} />;
}
