import type { SessionMap } from "./session-map.js";
import { SessionState } from "./session-map.js";
import type { TmuxBridge } from "./tmux-bridge.js";
import { isPaneAlive } from "./tmux-scanner.js";

export type InjectResult =
  | { sent: true }
  | { empty: true }
  | { busy: true }
  | { desktopActive: true }
  | { sessionNotFound: true }
  | { tmuxDead: true };

const MAX_MESSAGE_LENGTH = 10_000;

export class SessionStateManager {
  constructor(
    private sessionMap: SessionMap,
    private tmuxBridge: TmuxBridge
  ) {}

  injectMessage(sessionId: string, text: string): InjectResult {
    const session = this.sessionMap.getBySessionId(sessionId);
    if (!session) return { sessionNotFound: true };

    if (!isPaneAlive(session.tmuxTarget)) {
      this.sessionMap.unregister(sessionId);
      return { tmuxDead: true };
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) return { empty: true };

    const safeText =
      trimmed.length > MAX_MESSAGE_LENGTH ? trimmed.slice(0, MAX_MESSAGE_LENGTH) : trimmed;

    if (this.tmuxBridge.hasUncommittedInput(session.tmuxTarget)) {
      return { desktopActive: true };
    }

    // Always check actual pane state instead of trusting cached session.state
    if (!this.tmuxBridge.isClaudeIdle(session.tmuxTarget)) {
      return { busy: true };
    }

    try {
      this.tmuxBridge.sendKeys(session.tmuxTarget, safeText);
      this.sessionMap.updateState(sessionId, SessionState.Busy);
      this.sessionMap.touch(sessionId);
      return { sent: true };
    } catch {
      this.sessionMap.unregister(sessionId);
      return { tmuxDead: true };
    }
  }

  onStopHook(sessionId: string): void {
    this.sessionMap.updateState(sessionId, SessionState.Idle);
    this.sessionMap.touch(sessionId);
  }
}
