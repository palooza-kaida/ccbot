import type TelegramBot from "node-telegram-bot-api";

import type { AskUserQuestionEvent, AskUserQuestionItem } from "../../agent/agent-handler.js";
import { t } from "../../i18n/index.js";
import type { TmuxBridge } from "../../tmux/tmux-bridge.js";
import { logError } from "../../utils/log.js";
import {
  buildMultiSelectKeyboard,
  buildSingleSelectKeyboard,
} from "./ask-question-keyboard-builder.js";
import { AskQuestionTuiInjector, type InjectionAnswer } from "./ask-question-tui-injector.js";
import { escapeMarkdownV2 } from "./escape-markdown.js";

interface PendingQuestion {
  sessionId: string;
  tmuxTarget: string;
  questions: AskUserQuestionItem[];
  currentIndex: number;
  answers: Map<number, InjectionAnswer>;
  messageIds: Map<number, number>;
  multiSelectState: Map<number, Set<number>>;
  createdAt: number;
}

interface PendingOtherReply {
  sessionId: string;
  questionIndex: number;
  multiSelect: boolean;
}

const EXPIRE_MS = 10 * 60 * 1000;
const MAX_PENDING = 50;

export class AskQuestionHandler {
  private pending = new Map<string, PendingQuestion>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private otherReplies = new Map<string, PendingOtherReply>();
  private otherTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private injector: AskQuestionTuiInjector;

  constructor(
    private bot: TelegramBot,
    private chatId: () => number | null,
    tmuxBridge: TmuxBridge
  ) {
    this.injector = new AskQuestionTuiInjector(tmuxBridge);
  }

  async forwardQuestion(event: AskUserQuestionEvent): Promise<void> {
    const chat = this.chatId();
    if (!chat || !event.tmuxTarget || event.questions.length === 0) return;

    if (this.pending.size >= MAX_PENDING && !this.pending.has(event.sessionId)) {
      const oldest = [...this.pending.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
      if (oldest) this.clearPending(oldest[0]);
    }

    const pq: PendingQuestion = {
      sessionId: event.sessionId,
      tmuxTarget: event.tmuxTarget,
      questions: event.questions,
      currentIndex: 0,
      answers: new Map(),
      messageIds: new Map(),
      multiSelectState: new Map(),
      createdAt: Date.now(),
    };

    this.setPending(event.sessionId, pq);
    await this.sendQuestion(chat, pq, 0);
  }

  async handleCallback(query: TelegramBot.CallbackQuery): Promise<void> {
    if (!query.data || !query.message) return;

    if (query.data.startsWith("aq:")) {
      await this.handleSingleSelectCallback(query);
    } else if (query.data.startsWith("am:")) {
      await this.handleMultiSelectCallback(query);
    }
  }

  async handleOtherTextReply(chatId: number, messageId: number, text: string): Promise<boolean> {
    const key = `${chatId}:${messageId}`;
    const pending = this.otherReplies.get(key);
    if (!pending) return false;

    this.otherReplies.delete(key);
    const otherTimer = this.otherTimers.get(key);
    if (otherTimer) clearTimeout(otherTimer);
    this.otherTimers.delete(key);

    const pq = this.pending.get(pending.sessionId);
    if (!pq) return false;

    const qIdx = pending.questionIndex;

    if (pending.multiSelect) {
      const existing = pq.answers.get(qIdx) ?? { indices: [] };
      existing.otherText = text;
      pq.answers.set(qIdx, existing);

      const msgId = pq.messageIds.get(qIdx);
      if (msgId) {
        const q = pq.questions[qIdx]!;
        const keyboard = buildMultiSelectKeyboard(
          pq.sessionId,
          qIdx,
          q,
          pq.multiSelectState.get(qIdx) ?? new Set(),
          true
        );
        await this.bot
          .editMessageReplyMarkup(keyboard, { chat_id: chatId, message_id: msgId })
          .catch(() => {});
      }
      return true;
    }

    pq.answers.set(qIdx, { indices: [], otherText: text });

    const msgId = pq.messageIds.get(qIdx);
    if (msgId) {
      await this.bot
        .editMessageText(
          `${formatQuestionHeader(pq, qIdx)}\n\n${escapeMarkdownV2(t("askQuestion.selected", { option: text }))}`,
          { chat_id: chatId, message_id: msgId, parse_mode: "MarkdownV2" }
        )
        .catch(() => {});
    }

    await this.injectAnswer(pq, qIdx);
    await this.advanceToNext(chatId, pq);
    return true;
  }

  hasPendingOtherReply(chatId: number, messageId: number): boolean {
    return this.otherReplies.has(`${chatId}:${messageId}`);
  }

  destroy(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.pending.clear();
    for (const timer of this.otherTimers.values()) clearTimeout(timer);
    this.otherTimers.clear();
    this.otherReplies.clear();
  }

  private async sendQuestion(chatId: number, pq: PendingQuestion, qIdx: number): Promise<void> {
    const q = pq.questions[qIdx];
    if (!q) return;

    const header = formatQuestionHeader(pq, qIdx);
    const hint = q.multiSelect ? t("askQuestion.multiSelectHint") : t("askQuestion.selectHint");
    const text = `${header}\n\n${escapeMarkdownV2(q.question)}\n\n_${escapeMarkdownV2(hint)}_`;

    const keyboard = q.multiSelect
      ? buildMultiSelectKeyboard(pq.sessionId, qIdx, q, new Set(), false)
      : buildSingleSelectKeyboard(pq.sessionId, qIdx, q);

    const sent = await this.bot
      .sendMessage(chatId, text, { parse_mode: "MarkdownV2", reply_markup: keyboard })
      .catch(() => null);

    if (sent) {
      pq.messageIds.set(qIdx, sent.message_id);
      if (q.multiSelect) pq.multiSelectState.set(qIdx, new Set());
    }
  }

  private async handleSingleSelectCallback(query: TelegramBot.CallbackQuery): Promise<void> {
    const parts = query.data!.split(":");
    if (parts.length < 4) return;

    const session8 = parts[1]!;
    const qIdx = parseInt(parts[2]!, 10);
    const optPart = parts[3]!;

    const pq = this.findPendingByShortId(session8);
    if (!pq) {
      await this.bot.answerCallbackQuery(query.id, { text: t("askQuestion.sessionExpired") });
      return;
    }

    if (optPart === "o") {
      await this.bot.answerCallbackQuery(query.id);
      await this.promptForOther(query.message!.chat.id, pq, qIdx, false);
      return;
    }

    const optIdx = parseInt(optPart, 10);
    const q = pq.questions[qIdx];
    if (!q || optIdx < 0 || optIdx >= q.options.length) return;

    await this.bot.answerCallbackQuery(query.id, { text: t("askQuestion.sending") });
    pq.answers.set(qIdx, { indices: [optIdx] });

    const msgId = pq.messageIds.get(qIdx);
    if (msgId) {
      await this.bot
        .editMessageText(
          `${formatQuestionHeader(pq, qIdx)}\n\n${escapeMarkdownV2(t("askQuestion.selected", { option: q.options[optIdx]!.label }))}`,
          { chat_id: query.message!.chat.id, message_id: msgId, parse_mode: "MarkdownV2" }
        )
        .catch(() => {});
    }

    await this.injectAnswer(pq, qIdx);
    await this.advanceToNext(query.message!.chat.id, pq);
  }

  private async handleMultiSelectCallback(query: TelegramBot.CallbackQuery): Promise<void> {
    const parts = query.data!.split(":");
    if (parts.length < 4) return;

    const session8 = parts[1]!;
    const qIdx = parseInt(parts[2]!, 10);
    const optPart = parts[3]!;

    const pq = this.findPendingByShortId(session8);
    if (!pq) {
      await this.bot.answerCallbackQuery(query.id, { text: t("askQuestion.sessionExpired") });
      return;
    }

    const q = pq.questions[qIdx];
    if (!q) return;

    if (optPart === "o") {
      await this.bot.answerCallbackQuery(query.id);
      await this.promptForOther(query.message!.chat.id, pq, qIdx, true);
      return;
    }

    if (optPart === "c") {
      await this.handleMultiSelectConfirm(query, pq, qIdx, q);
      return;
    }

    const optIdx = parseInt(optPart, 10);
    if (optIdx < 0 || optIdx >= q.options.length) return;

    const toggleSet = pq.multiSelectState.get(qIdx) ?? new Set();
    if (toggleSet.has(optIdx)) {
      toggleSet.delete(optIdx);
    } else {
      toggleSet.add(optIdx);
    }
    pq.multiSelectState.set(qIdx, toggleSet);

    const hasOtherText = !!pq.answers.get(qIdx)?.otherText;
    const keyboard = buildMultiSelectKeyboard(pq.sessionId, qIdx, q, toggleSet, hasOtherText);

    await this.bot.answerCallbackQuery(query.id);
    await this.bot
      .editMessageReplyMarkup(keyboard, {
        chat_id: query.message!.chat.id,
        message_id: query.message!.message_id,
      })
      .catch(() => {});
  }

  private async handleMultiSelectConfirm(
    query: TelegramBot.CallbackQuery,
    pq: PendingQuestion,
    qIdx: number,
    q: AskUserQuestionItem
  ): Promise<void> {
    await this.bot.answerCallbackQuery(query.id, { text: t("askQuestion.sending") });

    const selected = pq.multiSelectState.get(qIdx) ?? new Set();
    const existingAnswer = pq.answers.get(qIdx);
    pq.answers.set(qIdx, {
      indices: [...selected].sort((a, b) => a - b),
      otherText: existingAnswer?.otherText,
    });

    const labels = [...selected]
      .sort((a, b) => a - b)
      .map((i) => q.options[i]?.label ?? "")
      .filter(Boolean);
    if (existingAnswer?.otherText) labels.push(existingAnswer.otherText);

    const msgId = pq.messageIds.get(qIdx);
    if (msgId) {
      await this.bot
        .editMessageText(
          `${formatQuestionHeader(pq, qIdx)}\n\n${escapeMarkdownV2(t("askQuestion.selectedMultiple", { options: labels.join(", ") }))}`,
          { chat_id: query.message!.chat.id, message_id: msgId, parse_mode: "MarkdownV2" }
        )
        .catch(() => {});
    }

    await this.injectAnswer(pq, qIdx);
    await this.advanceToNext(query.message!.chat.id, pq);
  }

  private async promptForOther(
    chatId: number,
    pq: PendingQuestion,
    qIdx: number,
    multiSelect: boolean
  ): Promise<void> {
    const sent = await this.bot
      .sendMessage(chatId, escapeMarkdownV2(t("askQuestion.otherButton")), {
        parse_mode: "MarkdownV2",
        reply_markup: { force_reply: true, input_field_placeholder: "Type your answer..." },
      })
      .catch(() => null);

    if (sent) {
      const key = `${chatId}:${sent.message_id}`;
      this.otherReplies.set(key, { sessionId: pq.sessionId, questionIndex: qIdx, multiSelect });
      const timer = setTimeout(() => {
        this.otherReplies.delete(key);
        this.otherTimers.delete(key);
      }, EXPIRE_MS);
      this.otherTimers.set(key, timer);
    }
  }

  private async injectAnswer(pq: PendingQuestion, qIdx: number): Promise<void> {
    const q = pq.questions[qIdx];
    const answer = pq.answers.get(qIdx);
    if (!q || !answer) return;

    try {
      const ready = await this.injector.waitForTui(pq.tmuxTarget, 5000);
      if (!ready) throw new Error("TUI not ready");

      if (q.multiSelect) {
        await this.injector.injectMultiSelect(pq.tmuxTarget, q, answer);
      } else {
        await this.injector.injectSingleSelect(pq.tmuxTarget, q, answer);
      }
    } catch (err) {
      logError(t("askQuestion.injectionFailed"), err);
      const chat = this.chatId();
      if (chat) {
        await this.bot.sendMessage(chat, t("askQuestion.injectionFailed")).catch(() => {});
      }
    }
  }

  private async advanceToNext(chatId: number, pq: PendingQuestion): Promise<void> {
    pq.currentIndex++;
    if (pq.currentIndex >= pq.questions.length) {
      this.clearPending(pq.sessionId);
      await this.bot.sendMessage(chatId, t("askQuestion.allAnswered")).catch(() => {});
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.sendQuestion(chatId, pq, pq.currentIndex);
  }

  private findPendingByShortId(s8: string): PendingQuestion | undefined {
    for (const [sid, pq] of this.pending) {
      if (sid.startsWith(s8)) return pq;
    }
    return undefined;
  }

  private setPending(sessionId: string, pq: PendingQuestion): void {
    this.clearPending(sessionId);
    this.pending.set(sessionId, pq);
    const timer = setTimeout(() => this.clearPending(sessionId), EXPIRE_MS);
    this.timers.set(sessionId, timer);
  }

  private clearPending(sessionId: string): void {
    this.pending.delete(sessionId);
    const timer = this.timers.get(sessionId);
    if (timer) clearTimeout(timer);
    this.timers.delete(sessionId);
  }
}

function formatQuestionHeader(pq: PendingQuestion, qIdx: number): string {
  const n = qIdx + 1;
  const total = pq.questions.length;
  const q = pq.questions[qIdx]!;
  const title = t("askQuestion.title", { n, total });
  const header = q.header ? ` \\[${escapeMarkdownV2(q.header)}\\]` : "";
  return `*${escapeMarkdownV2(title)}*${header}`;
}
