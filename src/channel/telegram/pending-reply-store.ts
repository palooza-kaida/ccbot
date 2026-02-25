interface PendingReply {
  sessionId: string;
  project: string;
  createdAt: number;
}

const EXPIRE_MS = 10 * 60 * 1000;

export class PendingReplyStore {
  private pending = new Map<string, PendingReply>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  set(chatId: number, messageId: number, sessionId: string, project: string): void {
    const key = PendingReplyStore.key(chatId, messageId);

    const existing = this.timers.get(key);
    if (existing) clearTimeout(existing);

    this.pending.set(key, {
      sessionId,
      project,
      createdAt: Date.now(),
    });

    const timer = setTimeout(() => {
      this.pending.delete(key);
      this.timers.delete(key);
    }, EXPIRE_MS);
    this.timers.set(key, timer);
  }

  get(chatId: number, messageId: number): PendingReply | undefined {
    const key = PendingReplyStore.key(chatId, messageId);
    const entry = this.pending.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.createdAt > EXPIRE_MS) {
      this.pending.delete(key);
      const timer = this.timers.get(key);
      if (timer) clearTimeout(timer);
      this.timers.delete(key);
      return undefined;
    }

    return entry;
  }

  delete(chatId: number, messageId: number): void {
    const key = PendingReplyStore.key(chatId, messageId);
    this.pending.delete(key);
    const timer = this.timers.get(key);
    if (timer) clearTimeout(timer);
    this.timers.delete(key);
  }

  private static key(chatId: number, messageId: number): string {
    return `${chatId}:${messageId}`;
  }
}
