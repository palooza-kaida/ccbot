import TelegramBot from "node-telegram-bot-api";
import type { Config } from "../../config-manager.js";
import { ConfigManager } from "../../config-manager.js";
import type { NotificationChannel, NotificationData } from "../types.js";
import { sendTelegramMessage } from "./telegram-sender.js";
import { MINI_APP_BASE_URL } from "../../utils/constants.js";
import { formatModelName, formatDuration, formatTokenCount } from "../../utils/stats-format.js";
import { extractProseSnippet } from "../../utils/markdown.js";
import { t, getTranslations } from "../../i18n/index.js";
import { log, logError } from "../../utils/log.js";

export class TelegramChannel implements NotificationChannel {
  private bot: TelegramBot;
  private cfg: Config;
  private chatId: number | null = null;
  private isDisconnected = false;

  constructor(cfg: Config) {
    this.cfg = cfg;
    this.bot = new TelegramBot(cfg.telegram_bot_token, { polling: false });
    this.chatId = ConfigManager.loadChatState().chat_id;
    this.registerHandlers();
    this.registerPollingErrorHandler();
  }

  async initialize(): Promise<void> {
    this.bot.startPolling();
    await this.registerCommands();
    await this.registerMenuButton();
    log(t("bot.telegramStarted"));
  }

  async shutdown(): Promise<void> {
    this.bot.stopPolling();
  }

  async sendNotification(data: NotificationData, responseUrl?: string): Promise<void> {
    if (!this.chatId) {
      log(t("bot.noChatId"));
      return;
    }

    const text = this.formatNotification(data);

    try {
      await sendTelegramMessage(this.bot, this.chatId, text, responseUrl);
    } catch (err: unknown) {
      logError(t("bot.notificationFailed"), err);
    }
  }

  private formatNotification(data: NotificationData): string {
    const parts: string[] = [];

    let header = `📦 *${escapeMarkdownV2(data.projectName)}*`;
    if (data.durationMs > 0) {
      header += ` · ${escapeMarkdownV2(formatDuration(data.durationMs))}`;
    }
    parts.push(header);

    if (data.responseSummary) {
      const snippet = extractProseSnippet(data.responseSummary, 150);
      parts.push(escapeMarkdownV2(snippet + "..."));
    }

    if (data.inputTokens > 0 || data.outputTokens > 0) {
      let statsLine = `📊 ${escapeMarkdownV2(formatTokenCount(data.inputTokens))} → ${escapeMarkdownV2(formatTokenCount(data.outputTokens))}`;
      if (data.model) {
        statsLine += ` · 🤖 ${escapeMarkdownV2(formatModelName(data.model))}`;
      }
      parts.push(statsLine);
    } else if (data.model) {
      parts.push(`🤖 ${escapeMarkdownV2(formatModelName(data.model))}`);
    }

    return parts.join("\n\n");
  }

  private async registerCommands(): Promise<void> {
    const translations = getTranslations();
    const commands: TelegramBot.BotCommand[] = [
      { command: "start", description: translations.bot.commands.start },
    ];

    try {
      await this.bot.setMyCommands(commands);
      log(t("bot.commandsRegistered"));
    } catch (err: unknown) {
      logError(t("bot.commandsRegisterFailed"), err);
    }
  }

  private async registerMenuButton(): Promise<void> {
    const url = `${MINI_APP_BASE_URL}/`;
    try {
      await this.bot.setChatMenuButton({
        menu_button: JSON.stringify({
          type: "web_app",
          text: t("bot.open"),
          web_app: { url },
        }),
      } as Record<string, unknown>);
      log(t("bot.menuButtonRegistered"));
    } catch (err: unknown) {
      logError(t("bot.menuButtonFailed"), err);
    }
  }

  private registerHandlers(): void {
    this.bot.onText(/\/start(?:\s|$)/, (msg) => {
      if (!ConfigManager.isOwner(this.cfg, msg.from?.id ?? 0)) {
        log(
          t("bot.unauthorizedUser", {
            userId: msg.from?.id ?? 0,
            username: msg.from?.username ?? "",
          })
        );
        return;
      }

      if (this.chatId === msg.chat.id) {
        this.bot.sendMessage(msg.chat.id, t("bot.alreadyConnected"));
        return;
      }

      this.chatId = msg.chat.id;
      ConfigManager.saveChatState({ chat_id: this.chatId });
      log(t("bot.registeredChatId", { chatId: msg.chat.id }));
      this.bot.sendMessage(msg.chat.id, t("bot.ready"), { parse_mode: "MarkdownV2" });
    });
  }

  private registerPollingErrorHandler(): void {
    this.bot.on("polling_error", () => {
      if (!this.isDisconnected) {
        this.isDisconnected = true;
        log(t("bot.connectionLost"));
      }
    });

    this.bot.on("polling", () => {
      if (this.isDisconnected) {
        this.isDisconnected = false;
        log(t("bot.connectionRestored"));
      }
    });
  }
}

function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (m) => `\\${m}`);
}
