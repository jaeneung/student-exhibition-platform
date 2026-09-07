"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/** Sets the UI language cookie and sends the visitor back to whatever page
 * they toggled it from (via the Referer header), so this works as a plain
 * form submission with no client-side JavaScript. */
export async function setLocaleAction(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  const referer = (await headers()).get("referer");
  redirect(referer || "/");
}
