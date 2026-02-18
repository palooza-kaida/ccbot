import TelegramBot from "node-telegram-bot-api";

const TELEGRAM_MAX_MESSAGE_LENGTH = 4096;
const PAGINATION_FOOTER_RESERVE = 30;

export async function sendMessage(bot: TelegramBot, chatId: number, text: string): Promise<void> {
  const pages = splitMessage(text, TELEGRAM_MAX_MESSAGE_LENGTH - PAGINATION_FOOTER_RESERVE);

  for (let i = 0; i < pages.length; i++) {
    let content = pages[i];
    if (pages.length > 1) {
      content = `${content}\n\n_\\[${i + 1}/${pages.length}\\]_`;
    }

    try {
      await bot.sendMessage(chatId, content, { parse_mode: "MarkdownV2" });
    } catch {
      await bot.sendMessage(chatId, pages[i]);
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
  for (let i = maxLen; i > maxLen - 200 && i > 0; i--) {
    if (text[i] === "\n" && text[i - 1] !== "\\") return i + 1;
  }

  for (let i = maxLen; i > maxLen - 200 && i > 0; i--) {
    if (text[i] === " " && text[i - 1] !== "\\") return i + 1;
  }

  return maxLen;
}
