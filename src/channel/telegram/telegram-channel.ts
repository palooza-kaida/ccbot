import TelegramBot from "node-telegram-bot-api";

import type { AskUserQuestionEvent, NotificationEvent } from "../../agent/agent-handler.js";
import { ConfigManager, type Config } from "../../config-manager.js";
import { getTranslations, t } from "../../i18n/index.js";
import type { SessionMap } from "../../tmux/session-map.js";
import type { SessionStateManager } from "../../tmux/session-state.js";
import type { TmuxBridge } from "../../tmux/tmux-bridge.js";
import { log, logError, logWarn } from "../../utils/log.js";
import { extractProseSnippet } from "../../utils/markdown.js";
import { formatDuration, formatModelName, formatTokenCount } from "../../utils/stats-format.js";
import type { NotificationChannel, NotificationData } from "../types.js";
import { AskQuestionHandler } from "./ask-question-handler.js";
import { escapeMarkdownV2 } from "./escape-markdown.js";
import { PendingReplyStore } from "./pending-reply-store.js";
import { PromptHandler } from "./prompt-handler.js";
import { formatSessionList } from "./session-list.js";
import { sendTelegramMessage } from "./telegram-sender.js";

export class TelegramChannel implements NotificationChannel {
  private bot: TelegramBot;
  private cfg: Config;
  private chatId: number | null = null;
  private isDisconnected = false;
  private pendingReplyStore = new PendingReplyStore();
  private sessionMap: SessionMap | null;
  private stateManager: SessionStateManager | null;
  private tmuxBridge: TmuxBridge | null;
  private promptHandler: PromptHandler | null = null;
  private askQuestionHandler: AskQuestionHandler | null = null;

  constructor(
    cfg: Config,
    sessionMap?: SessionMap,
    stateManager?: SessionStateManager,
    tmuxBridge?: TmuxBridge
  ) {
    this.cfg = cfg;
    this.sessionMap = sessionMap ?? null;
    this.stateManager = stateManager ?? null;
    this.tmuxBridge = tmuxBridge ?? null;
    this.bot = new TelegramBot(cfg.telegram_bot_token, { polling: false });
    this.chatId = ConfigManager.loadChatState().chat_id;
    this.registerHandlers();
    this.registerChatHandlers();
    this.registerSessionsHandlers();
    this.registerPollingErrorHandler();

    if (this.sessionMap && this.tmuxBridge) {
      this.promptHandler = new PromptHandler(
        this.bot,
        () => this.chatId,
        this.sessionMap,
        this.tmuxBridge
      );
      this.promptHandler.onElicitationSent = (chatId, messageId, sessionId, project) => {
        this.pendingReplyStore.set(chatId, messageId, sessionId, project);
      };
      this.askQuestionHandler = new AskQuestionHandler(
        this.bot,
        () => this.chatId,
        this.tmuxBridge
      );
    }
  }

  async initialize(): Promise<void> {
    this.bot.startPolling();
    await this.registerCommands();
    await this.registerMenuButton();
    log(t("bot.telegramStarted"));
  }

  async shutdown(): Promise<void> {
    this.promptHandler?.destroy();
    this.askQuestionHandler?.destroy();
    this.pendingReplyStore.destroy();
    this.bot.stopPolling();
  }

  handleNotificationEvent(event: NotificationEvent): void {
    this.promptHandler?.forwardPrompt(event).catch(() => {});
  }

  handleAskUserQuestionEvent(event: AskUserQuestionEvent): void {
    this.askQuestionHandler?.forwardQuestion(event).catch(() => {});
  }

  async sendNotification(data: NotificationData, responseUrl?: string): Promise<void> {
    if (!this.chatId) {
      log(t("bot.noChatId"));
      return;
    }

    const text = this.formatNotification(data);

    try {
      await sendTelegramMessage(this.bot, this.chatId, text, responseUrl, data.sessionId);
    } catch (err: unknown) {
      logError(t("bot.notificationFailed"), err);
    }
  }

  private formatNotification(data: NotificationData): string {
    const parts: string[] = [];

    const titleLine = `📦 *${escapeMarkdownV2(data.projectName)}*`;
    let metaLine = `🐾 ${escapeMarkdownV2(data.agentDisplayName)}`;
    if (data.durationMs > 0) {
      metaLine += ` · ⏱ ${escapeMarkdownV2(formatDuration(data.durationMs))}`;
    }
    parts.push(`${titleLine}\n${metaLine}`);

    if (data.responseSummary) {
      const snippet = extractProseSnippet(data.responseSummary, 150);
      parts.push(escapeMarkdownV2(snippet + "..."));
    } else {
      parts.push(escapeMarkdownV2("✅ Task done"));
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
      { command: "sessions", description: translations.bot.commands.sessions },
    ];

    try {
      await this.bot.setMyCommands(commands);
      log(t("bot.commandsRegistered"));
    } catch (err: unknown) {
      logError(t("bot.commandsRegisterFailed"), err);
    }
  }

  private async registerMenuButton(): Promise<void> {
    try {
      await this.bot.setChatMenuButton({
        menu_button: JSON.stringify({ type: "commands" }),
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

  private registerChatHandlers(): void {
    this.bot.on("callback_query", async (query) => {
      if (!ConfigManager.isOwner(this.cfg, query.from.id)) return;

      if (query.data?.startsWith("aq:") || query.data?.startsWith("am:")) {
        await this.askQuestionHandler?.handleCallback(query);
        return;
      }

      if (!query.data?.startsWith("chat:")) return;

      const sessionId = query.data.slice(5);

      if (!this.sessionMap) {
        await this.bot.answerCallbackQuery(query.id, { text: t("chat.sessionExpired") });
        return;
      }

      const session = this.sessionMap.getBySessionId(sessionId);
      if (!session) {
        await this.bot.answerCallbackQuery(query.id, { text: t("chat.sessionExpired") });
        return;
      }

      if (!query.message) {
        await this.bot.answerCallbackQuery(query.id);
        return;
      }

      const sent = await this.bot.sendMessage(
        query.message.chat.id,
        `💬 *${escapeMarkdownV2(session.project)}*\n${escapeMarkdownV2(t("chat.replyHint"))}`,
        {
          parse_mode: "MarkdownV2",
          reply_to_message_id: query.message.message_id,
          reply_markup: {
            force_reply: true,
            input_field_placeholder: `${session.project} → Claude`,
          },
        }
      );

      this.pendingReplyStore.set(
        query.message.chat.id,
        sent.message_id,
        sessionId,
        session.project
      );
      await this.bot.answerCallbackQuery(query.id);
    });

    this.bot.on("message", async (msg) => {
      if (!msg.reply_to_message) return;
      if (!msg.text) return;
      if (!ConfigManager.isOwner(this.cfg, msg.from?.id ?? 0)) return;

      if (
        this.askQuestionHandler?.hasPendingOtherReply(msg.chat.id, msg.reply_to_message.message_id)
      ) {
        const handled = await this.askQuestionHandler.handleOtherTextReply(
          msg.chat.id,
          msg.reply_to_message.message_id,
          msg.text
        );
        if (handled) return;
      }

      const pending = this.pendingReplyStore.get(msg.chat.id, msg.reply_to_message.message_id);
      if (!pending) return;

      this.pendingReplyStore.delete(msg.chat.id, msg.reply_to_message.message_id);

      if (this.promptHandler) {
        const injected = this.promptHandler.injectElicitationResponse(pending.sessionId, msg.text);
        if (injected) {
          await this.bot.sendMessage(
            msg.chat.id,
            t("prompt.responded", { project: pending.project })
          );
          return;
        }
      }

      if (!this.stateManager) {
        await this.bot.sendMessage(msg.chat.id, t("chat.sessionNotFound"));
        return;
      }

      const result = this.stateManager.injectMessage(pending.sessionId, msg.text);

      if ("sent" in result) {
        await this.bot.sendMessage(msg.chat.id, t("chat.sent", { project: pending.project }));
      } else if ("busy" in result) {
        await this.bot.sendMessage(msg.chat.id, t("chat.busy"));
      } else if ("sessionNotFound" in result) {
        await this.bot.sendMessage(msg.chat.id, t("chat.sessionNotFound"));
      } else if ("tmuxDead" in result) {
        await this.bot.sendMessage(msg.chat.id, t("chat.tmuxDead"));
      }
    });
  }

  private registerSessionsHandlers(): void {
    this.bot.onText(/\/sessions(?:\s|$)/, (msg) => {
      if (!ConfigManager.isOwner(this.cfg, msg.from?.id ?? 0)) return;
      if (!this.sessionMap) {
        this.bot.sendMessage(msg.chat.id, t("sessions.empty")).catch(() => {});
        return;
      }

      if (this.tmuxBridge) {
        this.sessionMap.refreshFromTmux(this.tmuxBridge);
      }

      const sessions = this.sessionMap.getAllActive();
      const { text, replyMarkup } = formatSessionList(sessions);

      const opts: TelegramBot.SendMessageOptions = { parse_mode: "MarkdownV2" };
      if (replyMarkup) opts.reply_markup = replyMarkup;

      this.bot.sendMessage(msg.chat.id, text, opts).catch(() => {});
    });
  }

  private registerPollingErrorHandler(): void {
    this.bot.on("polling_error", () => {
      if (!this.isDisconnected) {
        this.isDisconnected = true;
        logWarn(t("bot.connectionLost"));
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
