import { en } from "./locales/en.js";
import { vi } from "./locales/vi.js";
import { zh } from "./locales/zh.js";
import type { TranslationKeys } from "./types.js";

export const Locale = {
  EN: "en",
  VI: "vi",
  ZH: "zh",
} as const;

export type Locale = (typeof Locale)[keyof typeof Locale];

export const LOCALE_LABELS: Record<Locale, string> = {
  [Locale.EN]: "English",
  [Locale.VI]: "Tiếng Việt",
  [Locale.ZH]: "中文",
};

export const SUPPORTED_LOCALES = Object.values(Locale) as Locale[];

const localeMap: Record<Locale, TranslationKeys> = { en, vi, zh };

let currentLocale: Locale = Locale.EN;

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function isValidLocale(value: unknown): value is Locale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as Locale);
}

function resolveKey(translations: TranslationKeys, key: string): unknown {
  const parts = key.split(".");
  let result: unknown = translations;
  for (const part of parts) {
    if (result === null || result === undefined || typeof result !== "object") {
      return undefined;
    }
    result = (result as Record<string, unknown>)[part];
  }
  return result;
}

export function t(key: string, params?: Record<string, string | number>): string {
  let value = resolveKey(localeMap[currentLocale], key);

  if (value === undefined || value === null) {
    value = resolveKey(en, key);
  }

  if (value === undefined || value === null) {
    return key;
  }

  if (typeof value !== "string") {
    return key;
  }

  if (params) {
    let result = value;
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replaceAll(`{${paramKey}}`, String(paramValue));
    }
    return result;
  }

  return value;
}

export function getTranslations(): TranslationKeys {
  return localeMap[currentLocale];
}
