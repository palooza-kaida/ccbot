import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./config";
import { translations } from "./locales";

export { DEFAULT_LOCALE, SUPPORTED_LOCALES, LOCALE_LABELS } from "./config";
export type { Locale } from "./config";

export function t(locale: Locale, key: string): string | string[] {
  return translations[locale]?.[key] ?? translations[DEFAULT_LOCALE]?.[key] ?? key;
}

export function ts(locale: Locale, key: string): string {
  const value = t(locale, key);
  return Array.isArray(value) ? value.join(", ") : value;
}

export function ta(locale: Locale, key: string): string[] {
  const value = t(locale, key);
  return Array.isArray(value) ? value : [value];
}

export function detectLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const saved = localStorage.getItem("ccbot-locale");
  if (saved && SUPPORTED_LOCALES.includes(saved as Locale)) return saved as Locale;

  const navLang = navigator.language?.slice(0, 2);
  if (navLang === "zh") return "zh";
  if (navLang === "vi") return "vi";
  return DEFAULT_LOCALE;
}

export function tClient(key: string): string {
  return ts(detectLocale(), key);
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, segment] = url.pathname.split("/");
  const cleaned = segment?.replace(/\/$/, "");
  if (cleaned && SUPPORTED_LOCALES.includes(cleaned as Locale)) {
    return cleaned as Locale;
  }
  return DEFAULT_LOCALE;
}

export function localePath(locale: Locale, path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return cleanPath;
  return `/${locale}${cleanPath}`;
}

export function alternateLocales(
  currentLocale: Locale,
  currentPath: string,
  base: string = "/",
) {
  return SUPPORTED_LOCALES.map((locale) => {
    const relative = localePath(locale, currentPath);
    const withBase = base.endsWith("/") ? base.slice(0, -1) : base;
    return { locale, href: `${withBase}${relative}` };
  });
}
