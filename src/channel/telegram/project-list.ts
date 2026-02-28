import type TelegramBot from "node-telegram-bot-api";

import type { ProjectEntry } from "../../config-manager.js";
import { t } from "../../i18n/index.js";

const MAX_KEYBOARD_ROWS = 50;

export function formatProjectList(projects: ProjectEntry[]): {
  text: string;
  replyMarkup: TelegramBot.InlineKeyboardMarkup | undefined;
} {
  if (projects.length === 0) {
    return { text: t("projects.empty"), replyMarkup: undefined };
  }

  const rows: TelegramBot.InlineKeyboardButton[][] = [];

  for (let i = 0; i < Math.min(projects.length, MAX_KEYBOARD_ROWS); i++) {
    const proj = projects[i]!;
    rows.push([{ text: `📂 ${proj.name}`, callback_data: `proj:${i}` }]);
  }

  return {
    text: t("projects.title"),
    replyMarkup: { inline_keyboard: rows },
  };
}
