import type TelegramBot from "node-telegram-bot-api";

import type { AskUserQuestionItem } from "../../agent/agent-handler.js";
import { t } from "../../i18n/index.js";

export function buildSingleSelectKeyboard(
  sessionId: string,
  qIdx: number,
  q: AskUserQuestionItem
): TelegramBot.InlineKeyboardMarkup {
  const s8 = sessionId.slice(0, 8);
  const buttons: TelegramBot.InlineKeyboardButton[][] = q.options.map((opt, i) => [
    {
      text: opt.label,
      callback_data: `aq:${s8}:${qIdx}:${i}`,
    },
  ]);
  buttons.push([
    {
      text: t("askQuestion.otherButton"),
      callback_data: `aq:${s8}:${qIdx}:o`,
    },
  ]);
  return { inline_keyboard: buttons };
}

export function buildMultiSelectKeyboard(
  sessionId: string,
  qIdx: number,
  q: AskUserQuestionItem,
  selected: Set<number>,
  hasOther: boolean
): TelegramBot.InlineKeyboardMarkup {
  const s8 = sessionId.slice(0, 8);
  const buttons: TelegramBot.InlineKeyboardButton[][] = q.options.map((opt, i) => [
    {
      text: selected.has(i) ? `✓ ${opt.label}` : opt.label,
      callback_data: `am:${s8}:${qIdx}:${i}`,
    },
  ]);

  const otherLabel = hasOther ? `✓ ${t("askQuestion.otherButton")}` : t("askQuestion.otherButton");
  buttons.push([
    {
      text: otherLabel,
      callback_data: `am:${s8}:${qIdx}:o`,
    },
  ]);

  const count = selected.size + (hasOther ? 1 : 0);
  buttons.push([
    {
      text: t("askQuestion.confirmButton", { count }),
      callback_data: `am:${s8}:${qIdx}:c`,
    },
  ]);

  return { inline_keyboard: buttons };
}
