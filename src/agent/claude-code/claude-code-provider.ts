import { existsSync } from "node:fs";
import type { AgentProvider, AgentEventResult } from "../types.js";
import { AgentName, AGENT_DISPLAY_NAMES } from "../types.js";
import { ClaudeCodeInstaller } from "./claude-code-installer.js";
import { isValidStopEvent, parseTranscript, extractProjectName } from "./claude-code-parser.js";
import { collectGitChanges } from "../../utils/git-collector.js";
import { paths } from "../../utils/paths.js";
import { DEFAULT_FALLBACK_DURATION_MS, TRANSCRIPT_SETTLE_DELAY_MS } from "../../utils/constants.js";
import { logError } from "../../utils/log.js";
import { t } from "../../i18n/index.js";

export class ClaudeCodeProvider implements AgentProvider {
  readonly name = AgentName.ClaudeCode;
  readonly displayName = AGENT_DISPLAY_NAMES[AgentName.ClaudeCode];
  readonly settleDelayMs = TRANSCRIPT_SETTLE_DELAY_MS;

  detect(): boolean {
    return existsSync(paths.claudeDir);
  }

  isHookInstalled(): boolean {
    return ClaudeCodeInstaller.isInstalled();
  }

  installHook(port: number, secret: string): void {
    ClaudeCodeInstaller.install(port, secret);
  }

  uninstallHook(): void {
    ClaudeCodeInstaller.uninstall();
  }

  verifyIntegrity(): { complete: boolean; missing: string[] } {
    return ClaudeCodeInstaller.verifyIntegrity();
  }

  parseEvent(raw: unknown): AgentEventResult {
    if (!isValidStopEvent(raw)) {
      return this.createFallbackResult(raw);
    }

    let summary = {
      lastAssistantMessage: "",
      durationMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      model: "",
    };

    try {
      summary = parseTranscript(raw.transcript_path);
    } catch (err: unknown) {
      logError(t("hook.transcriptFailed"), err);
    }

    const gitChanges = collectGitChanges(raw.cwd);

    let durationMs = Math.max(0, summary.durationMs);
    if (durationMs === 0 && summary.lastAssistantMessage) {
      durationMs = DEFAULT_FALLBACK_DURATION_MS;
    }

    const obj = raw as unknown as Record<string, unknown>;
    const tmuxTarget = typeof obj.tmux_target === "string" ? obj.tmux_target : undefined;

    return {
      projectName: extractProjectName(raw.cwd, raw.transcript_path),
      responseSummary: summary.lastAssistantMessage,
      durationMs,
      gitChanges,
      inputTokens: summary.inputTokens,
      outputTokens: summary.outputTokens,
      model: summary.model,
      agentSessionId: raw.session_id,
      cwd: raw.cwd,
      tmuxTarget,
    };
  }

  private createFallbackResult(raw: unknown): AgentEventResult {
    const obj = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
    const cwd = typeof obj.cwd === "string" ? obj.cwd : process.cwd();
    const transcriptPath = typeof obj.transcript_path === "string" ? obj.transcript_path : "";
    const tmuxTarget = typeof obj.tmux_target === "string" ? obj.tmux_target : undefined;

    return {
      projectName: extractProjectName(cwd, transcriptPath),
      responseSummary: "",
      durationMs: 0,
      gitChanges: collectGitChanges(cwd),
      inputTokens: 0,
      outputTokens: 0,
      model: "",
      agentSessionId: typeof obj.session_id === "string" ? obj.session_id : undefined,
      cwd,
      tmuxTarget,
    };
  }
}
