import type { NotificationChannel, NotificationData } from "../channel/types.js";
import { t } from "../i18n/index.js";
import { MINI_APP_BASE_URL } from "../utils/constants.js";
import { log, logError } from "../utils/log.js";
import { responseStore } from "../utils/response-store.js";
import type { TunnelManager } from "../utils/tunnel.js";
import type { AgentRegistry } from "./agent-registry.js";
import type { ChatSessionResolver } from "./chat-session-resolver.js";

export class AgentHandler {
  constructor(
    private registry: AgentRegistry,
    private channel: NotificationChannel,
    private hookPort: number,
    private tunnelManager: TunnelManager,
    private chatResolver?: ChatSessionResolver
  ) {}

  async handleStopEvent(agentName: string, rawEvent: unknown): Promise<void> {
    const provider = this.registry.resolve(agentName);
    if (!provider) {
      log(t("agent.unknownAgent", { agent: agentName }));
      return;
    }

    if (provider.settleDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, provider.settleDelayMs));
    }

    const result = provider.parseEvent(rawEvent);

    let chatSessionId: string | undefined;
    if (this.chatResolver) {
      chatSessionId = this.chatResolver.resolveSessionId(
        result.agentSessionId ?? "",
        result.projectName,
        result.cwd,
        result.tmuxTarget
      );
    }

    const data: NotificationData = {
      agent: provider.name,
      agentDisplayName: provider.displayName,
      sessionId: chatSessionId,
      ...result,
    };

    if (chatSessionId && this.chatResolver) {
      this.chatResolver.onStopHook(chatSessionId);
    }

    const responseUrl = this.buildResponseUrl(data);
    this.channel.sendNotification(data, responseUrl).catch((err: unknown) => {
      logError(t("hook.notificationFailed"), err);
    });
  }

  async handleSessionStart(rawEvent: unknown): Promise<void> {
    this.onSessionStart?.(rawEvent);
  }

  onSessionStart?: (rawEvent: unknown) => void;

  private buildResponseUrl(data: NotificationData): string {
    const id = responseStore.save(data);

    const apiBase = this.tunnelManager.getPublicUrl() || `http://localhost:${this.hookPort}`;
    const params = new URLSearchParams({
      id,
      api: apiBase,
      p: data.projectName,
      d: String(data.durationMs),
      a: data.agent,
    });
    return `${MINI_APP_BASE_URL}/response/?${params.toString()}`;
  }
}
