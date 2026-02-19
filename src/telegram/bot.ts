import TelegramBot from "node-telegram-bot-api";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { type Config, ConfigManager } from "../config-manager.js";
import { sendMessage } from "./message-sender.js";
import { formatError } from "../utils/error-utils.js";
import { t, getTranslations } from "../i18n/index.js";

interface BotState {
  chat_id: number | null;
}

export class Bot {
  private bot: TelegramBot;
  private cfg: Config;
  private chatId: number | null = null;

  private static readonly STATE_DIR = join(homedir(), ".ccbot");
  private static readonly STATE_FILE = join(Bot.STATE_DIR, "state.json");
  private static readonly MINI_APP_URL = "https://palooza-kaida.github.io/ccbot/";

  constructor(cfg: Config) {
    this.cfg = cfg;
    this.bot = new TelegramBot(cfg.telegram_bot_token, { polling: false });
    this.loadState();
    this.registerHandlers();
  }

  async start(): Promise<void> {
    this.bot.startPolling();
    await this.registerCommands();
    await this.registerMenuButton();
    console.log(t("bot.telegramStarted"));
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.bot.stopPolling();
      resolve();
    });
  }

  async sendNotification(text: string): Promise<void> {
    if (!this.chatId) {
      console.log(t("bot.noChatId"));
      return;
    }

    try {
      await sendMessage(this.bot, this.chatId, text);
    } catch (err: unknown) {
      console.log(t("bot.notificationFailed", { error: formatError(err) }));
    }
  }

  private async registerCommands(): Promise<void> {
    const translations = getTranslations();
    const commands: TelegramBot.BotCommand[] = [
      { command: "start", description: translations.bot.commands.start },
      { command: "ping", description: translations.bot.commands.ping },
      { command: "status", description: translations.bot.commands.status },
    ];

    try {
      await this.bot.setMyCommands(commands);
      console.log(t("bot.commandsRegistered"));
    } catch (err: unknown) {
      console.log(t("bot.commandsRegisterFailed", { error: formatError(err) }));
    }
  }

  private async registerMenuButton(): Promise<void> {
    try {
      await this.bot.setChatMenuButton({
        menu_button: {
          type: "web_app",
          text: "📱 Dashboard",
          web_app: { url: Bot.MINI_APP_URL },
        },
      });
      console.log(t("bot.menuButtonRegistered"));
    } catch (err: unknown) {
      console.log(t("bot.menuButtonFailed", { error: formatError(err) }));
    }
  }

  private registerHandlers(): void {
    this.bot.on("message", (msg) => {
      if (!ConfigManager.isOwner(this.cfg, msg.from?.id ?? 0)) {
        console.log(t("bot.unauthorizedUser", {
          userId: msg.from?.id ?? 0,
          username: msg.from?.username ?? "",
        }));
        return;
      }

      const text = msg.text ?? "";

      if (text === "/start") {
        this.chatId = msg.chat.id;
        this.saveState();
        console.log(t("bot.registeredChatId", { chatId: msg.chat.id }));
        this.bot.sendMessage(
          msg.chat.id,
          t("bot.ready"),
          { parse_mode: "MarkdownV2" },
        );
        return;
      }

      if (text === "/ping") {
        this.bot.sendMessage(msg.chat.id, "pong 🏓");
        return;
      }

      if (text === "/status") {
        this.bot.sendMessage(msg.chat.id, t("bot.running"));
        return;
      }
    });
  }

  private loadState(): void {
    try {
      const data = readFileSync(Bot.STATE_FILE, "utf-8");
      const state: BotState = JSON.parse(data);
      this.chatId = state.chat_id ?? null;
    } catch {}
  }

  private saveState(): void {
    const state: BotState = { chat_id: this.chatId };
    mkdirSync(Bot.STATE_DIR, { recursive: true });
    writeFileSync(Bot.STATE_FILE, JSON.stringify(state, null, 2), { mode: 0o600 });
  }
}
