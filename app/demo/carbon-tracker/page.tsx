import { getLocale } from "@/lib/i18n";
import { CarbonTrackerDemo } from "./CarbonTrackerDemo";
import { getCarbonTrackerContent } from "./content";

export default async function CarbonTrackerDemoPage() {
  const content = getCarbonTrackerContent(await getLocale());
  return <CarbonTrackerDemo content={content} />;
}
