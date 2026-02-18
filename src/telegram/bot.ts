import TelegramBot from "node-telegram-bot-api";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { type Config, ConfigManager } from "../config-manager.js";
import { sendMessage } from "./message-sender.js";
import { formatError } from "../utils/error-utils.js";

interface BotState {
  chat_id: number | null;
}

export class Bot {
  private bot: TelegramBot;
  private cfg: Config;
  private chatId: number | null = null;

  private static readonly STATE_DIR = join(homedir(), ".ccbot");
  private static readonly STATE_FILE = join(Bot.STATE_DIR, "state.json");

  constructor(cfg: Config) {
    this.cfg = cfg;
    this.bot = new TelegramBot(cfg.telegram_bot_token, { polling: false });
    this.loadState();
    this.registerHandlers();
  }

  start(): void {
    this.bot.startPolling();
    console.log("ccbot: telegram bot started");
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.bot.stopPolling();
      resolve();
    });
  }

  async sendNotification(text: string): Promise<void> {
    if (!this.chatId) {
      console.log("ccbot: no chat ID yet — run 'ccbot setup' or send /start to the bot");
      return;
    }

    try {
      await sendMessage(this.bot, this.chatId, text);
    } catch (err: unknown) {
      console.log(`ccbot: failed to send notification: ${formatError(err)}`);
    }
  }

  private registerHandlers(): void {
    this.bot.on("message", (msg) => {
      if (!ConfigManager.isOwner(this.cfg, msg.from?.id ?? 0)) {
        console.log(`ccbot: unauthorized user ${msg.from?.id} (${msg.from?.username})`);
        return;
      }

      const text = msg.text ?? "";

      if (text === "/start") {
        this.chatId = msg.chat.id;
        this.saveState();
        console.log(`ccbot: registered chat ID ${msg.chat.id}`);
        this.bot.sendMessage(
          msg.chat.id,
          "✅ *ccbot* đã sẵn sàng\\.\\n\\nBạn sẽ nhận notification khi Claude Code hoàn thành response\\.",
          { parse_mode: "MarkdownV2" },
        );
        return;
      }

      if (text === "/ping") {
        this.bot.sendMessage(msg.chat.id, "pong 🏓");
        return;
      }

      if (text === "/status") {
        this.bot.sendMessage(msg.chat.id, "🟢 ccbot đang chạy");
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
