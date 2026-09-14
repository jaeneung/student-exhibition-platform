import { getLocale } from "@/lib/i18n";
import { getSolarSystemContent } from "./content";
import { SolarSystemDemo } from "./SolarSystemDemo";

export default async function SolarSystemDemoPage() {
  const content = getSolarSystemContent(await getLocale());
  return <SolarSystemDemo content={content} />;
}
