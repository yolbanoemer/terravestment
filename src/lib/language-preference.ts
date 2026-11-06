import type { Lang } from "@/lib/i18n";

export function resolvePreferredLanguage(
  savedLanguage: string | null,
  ipCountryCode: string,
): Lang {
  if (savedLanguage === "de" || savedLanguage === "en") return savedLanguage;
  return ipCountryCode.trim().toUpperCase() === "DE" ? "de" : "en";
}