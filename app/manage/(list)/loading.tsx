import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getDictionary } from "@/lib/dictionary";
import { getLocale } from "@/lib/i18n";

export default async function Loading() {
  const dict = getDictionary(await getLocale());
  return <LoadingSpinner text={dict.loading} />;
}
