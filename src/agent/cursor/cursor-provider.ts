import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { AgentProvider, AgentEventResult } from "../types.js";
import { AgentName, AGENT_DISPLAY_NAMES } from "../types.js";
import { CursorInstaller } from "./cursor-installer.js";
import { parseStopEvent, parseTranscript, isValidStopEvent } from "./cursor-parser.js";
import { collectGitChanges } from "../../utils/git-collector.js";
import { extractProjectName } from "../../utils/paths.js";
import { logError } from "../../utils/log.js";
import { t } from "../../i18n/index.js";

export class CursorProvider implements AgentProvider {
  readonly name = AgentName.Cursor;
  readonly displayName = AGENT_DISPLAY_NAMES[AgentName.Cursor];
  readonly settleDelayMs = 0;

  detect(): boolean {
    return existsSync(join(homedir(), ".cursor"));
  }

  isHookInstalled(): boolean {
    return CursorInstaller.isInstalled();
  }

  installHook(port: number, secret: string): void {
    CursorInstaller.install(port, secret);
  }

  uninstallHook(): void {
    CursorInstaller.uninstall();
  }

  parseEvent(raw: unknown): AgentEventResult {
    if (!isValidStopEvent(raw)) {
      return this.createFallbackResult(raw);
    }

    const event = parseStopEvent(raw);

    let summary = {
      lastAssistantMessage: "",
      durationMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      model: "",
    };

    try {
      if (event.transcriptPath) {
        summary = parseTranscript(event.transcriptPath);
      }
    } catch (err: unknown) {
      logError(t("hook.transcriptFailed"), err);
    }

    const gitChanges = collectGitChanges(event.cwd);

    return {
      projectName: event.projectName,
      responseSummary: summary.lastAssistantMessage,
      durationMs: summary.durationMs,
      gitChanges,
      inputTokens: summary.inputTokens,
      outputTokens: summary.outputTokens,
      model: summary.model || event.model,
    };
  }

  private createFallbackResult(raw: unknown): AgentEventResult {
    const obj = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
    const cwd = typeof obj.cwd === "string" ? obj.cwd : process.cwd();

    return {
      projectName: extractProjectName(cwd),
      responseSummary: "",
      durationMs: 0,
      gitChanges: collectGitChanges(cwd),
      inputTokens: 0,
      outputTokens: 0,
      model: "",
    };
  }
}
