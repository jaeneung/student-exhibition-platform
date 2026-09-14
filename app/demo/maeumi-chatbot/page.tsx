import { getLocale } from "@/lib/i18n";
import { getMaeumiChatbotContent } from "./content";
import { MaeumiChatbotDemo } from "./MaeumiChatbotDemo";

export default async function MaeumiChatbotDemoPage() {
  const content = getMaeumiChatbotContent(await getLocale());
  return <MaeumiChatbotDemo content={content} />;
}
