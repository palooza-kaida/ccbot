import type { Locale } from "./config";
import { en } from "./locales/en";
import type { LocaleDict } from "./locales/en";
import { vi } from "./locales/vi";
import { zh } from "./locales/zh";

export const translations: Record<Locale, LocaleDict> = {
  en,
  vi,
  zh,
};
