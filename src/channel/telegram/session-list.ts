import TelegramBot from "node-telegram-bot-api";

import { t } from "../../i18n/index.js";
import { SessionState, type TmuxSession } from "../../tmux/session-map.js";
import { escapeMarkdownV2 } from "./escape-markdown.js";

const STATE_EMOJI: Record<string, string> = {
  [SessionState.Idle]: "\u{1F7E2}",
  [SessionState.Busy]: "\u{1F7E1}",
  [SessionState.Unknown]: "\u26AA",
};

const MAX_KEYBOARD_ROWS = 50;
const MAX_LABEL_CHARS = 32;

export function formatSessionList(sessions: TmuxSession[]): {
  text: string;
  replyMarkup: TelegramBot.InlineKeyboardMarkup | undefined;
} {
  if (sessions.length === 0) {
    return { text: t("sessions.empty"), replyMarkup: undefined };
  }

  const sorted = [...sessions].sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

  const rows: TelegramBot.InlineKeyboardButton[][] = [];

  for (const session of sorted.slice(0, MAX_KEYBOARD_ROWS)) {
    const emoji = STATE_EMOJI[session.state] ?? "\u26AA";
    const model = shortenModel(session.model);
    const label = fitLabel(session.project, model, MAX_LABEL_CHARS);

    rows.push([{ text: `${emoji} ${label}`, callback_data: `session:${session.sessionId}` }]);
  }

  return {
    text: `*${escapeMarkdownV2(t("sessions.title"))}*`,
    replyMarkup: { inline_keyboard: rows },
  };
}

function fitLabel(project: string, model: string, maxLen: number): string {
  if (!model) return truncate(project, maxLen);

  const sep = " · ";
  const full = `${project}${sep}${model}`;
  if (full.length <= maxLen) return full;

  const projectBudget = maxLen - sep.length - model.length;
  if (projectBudget >= 6) {
    return `${truncate(project, projectBudget)}${sep}${model}`;
  }

  const half = Math.floor((maxLen - sep.length) / 2);
  return `${truncate(project, half)}${sep}${truncate(model, half)}`;
}

function shortenModel(model: string): string {
  if (!model) return "";
  return model
    .replace(/^claude-/, "")
    .replace(/^gpt-/, "gpt")
    .replace(/-(\d+)-(\d+)$/, " $1.$2")
    .replace(/-(\d+)$/, " $1");
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + "…";
}
