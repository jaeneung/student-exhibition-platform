import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, type Locale } from "./localeConstants";

export { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, type Locale };

function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}

/** Reads the visitor's chosen UI language from a cookie (set by the header's
 * language toggle). Only the interface text is localized this way — project
 * titles/descriptions stay in whatever language the student wrote them in,
 * the same way a marketplace listing doesn't get machine-translated just
 * because you switched the app's UI language. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
