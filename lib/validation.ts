/**
 * Pure URL-safety checks shared by the submission form, the management form,
 * and the launch link/QR code rendering. Only http/https destinations are
 * ever considered safe to launch or embed in a QR code.
 */
export function isValidLaunchUrl(value: string): boolean {
  if (!value || value.trim() !== value) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

export function isValidOptionalImageUrl(value: string | undefined): boolean {
  if (!value) return true;
  return isValidLaunchUrl(value);
}
