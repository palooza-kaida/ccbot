import TelegramBot from "node-telegram-bot-api";

import { t } from "../../i18n/index.js";
import { logError } from "../../utils/log.js";

const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;
const PAGINATION_FOOTER_RESERVE = 30;
const SPLIT_LOOKBACK_RANGE = 200;

export async function sendTelegramMessage(
  bot: TelegramBot,
  chatId: number,
  text: string,
  responseUrl?: string,
  sessionId?: string
): Promise<void> {
  const pages = splitMessage(text, TELEGRAM_MAX_MESSAGE_LENGTH - PAGINATION_FOOTER_RESERVE);

  for (let i = 0; i < pages.length; i++) {
    let content = pages[i]!;
    if (pages.length > 1) {
      content = `${content}\n\n_\\[${i + 1}/${pages.length}\\]_`;
    }

    const isLastPage = i === pages.length - 1;
    const opts: TelegramBot.SendMessageOptions = { parse_mode: "MarkdownV2" };

    if (isLastPage && responseUrl) {
      opts.reply_markup = buildResponseReplyMarkup(responseUrl, sessionId);
    }

    try {
      await bot.sendMessage(chatId, content, opts);
    } catch (err) {
      logError(t("bot.sendFailed"), err);
      const fallbackOpts: TelegramBot.SendMessageOptions = {};
      if (isLastPage && responseUrl) {
        fallbackOpts.reply_markup = buildResponseReplyMarkup(responseUrl, sessionId);
      }
      try {
        await bot.sendMessage(chatId, pages[i]!, fallbackOpts);
      } catch (err2) {
        logError(t("bot.sendFallbackFailed"), err2);
        try {
          await bot.sendMessage(chatId, pages[i]!);
        } catch {
          // final fallback exhausted, message lost
        }
      }
    }
  }
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const pages: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      pages.push(remaining);
      break;
    }

    const splitAt = findSplitPoint(remaining, maxLen);
    pages.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }

  return pages;
}

function findSplitPoint(text: string, maxLen: number): number {
  for (let i = maxLen; i > maxLen - SPLIT_LOOKBACK_RANGE && i > 0; i--) {
    if (text[i] === "\n" && text[i - 1] !== "\\") return i + 1;
  }

  for (let i = maxLen; i > maxLen - SPLIT_LOOKBACK_RANGE && i > 0; i--) {
    if (text[i] === " " && text[i - 1] !== "\\") return i + 1;
  }

  return maxLen;
}

function buildResponseReplyMarkup(
  responseUrl: string,
  sessionId?: string
): TelegramBot.InlineKeyboardMarkup {
  const viewText = `📖 ${t("bot.viewDetails")}`;
  const viewButton = responseUrl.startsWith("https://")
    ? { text: viewText, web_app: { url: responseUrl } }
    : { text: viewText, url: responseUrl };

  const buttons: TelegramBot.InlineKeyboardButton[] = [viewButton];

  if (sessionId) {
    buttons.push({ text: "💬 Chat", callback_data: `chat:${sessionId}` });
  }

  return { inline_keyboard: [buttons] };
}
