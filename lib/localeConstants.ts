// Plain constants with no server-only dependency, so client components (like
// app/error.tsx, which must be a Client Component per Next.js's error
// boundary rules) can import them too. Server Components should generally
// import from lib/i18n.ts instead, which re-exports these alongside the
// cookie-reading getLocale().
export const LOCALES = ["ko", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ko";
export const LOCALE_COOKIE = "locale";
