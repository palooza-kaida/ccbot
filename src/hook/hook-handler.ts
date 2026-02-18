import { execSync } from "node:child_process";
import { parseTranscript } from "../monitor/transcript-parser.js";
import {
  formatNotification,
  extractProjectName,
  type GitChange,
} from "../telegram/message-formatter.js";
import { formatError } from "../utils/error-utils.js";

const GIT_TIMEOUT_MS = 10_000;

interface StopEvent {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  hook_event_name: string;
  stop_hook_active: boolean;
}

export type NotifyFunc = (text: string) => Promise<void>;

function isValidStopEvent(data: unknown): data is StopEvent {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.session_id === "string"
    && typeof obj.transcript_path === "string"
    && typeof obj.cwd === "string";
}

export class HookHandler {
  private notify: NotifyFunc;

  constructor(notify: NotifyFunc) {
    this.notify = notify;
  }

  handleStopEvent(event: unknown): void {
    if (!isValidStopEvent(event)) {
      console.log("ccbot: invalid stop event payload — missing required fields");
      return;
    }

    console.log(`ccbot: stop event received for session ${event.session_id} at ${event.cwd}`);

    let summary = { lastAssistantMessage: "", durationMs: 0, totalCostUSD: 0 };
    try {
      summary = parseTranscript(event.transcript_path);
    } catch (err: unknown) {
      console.log(`ccbot: failed to parse transcript: ${formatError(err)}`);
    }

    const gitChanges = this.collectGitChanges(event.cwd);

    let durationMs = summary.durationMs;
    if (durationMs === 0 && summary.lastAssistantMessage) {
      durationMs = 1000;
    }

    const notification = formatNotification({
      projectName: extractProjectName(event.cwd),
      responseSummary: summary.lastAssistantMessage,
      durationMs,
      gitChanges,
    });

    this.notify(notification).catch((err: unknown) => {
      console.log(`ccbot: failed to send notification: ${formatError(err)}`);
    });
  }

  private collectGitChanges(cwd: string): GitChange[] {
    try {
      const diffOutput = execSync("git diff --name-status HEAD", {
        cwd,
        encoding: "utf-8",
        timeout: GIT_TIMEOUT_MS,
      });
      const changes = this.parseGitDiffOutput(diffOutput);

      try {
        const untrackedOutput = execSync("git ls-files --others --exclude-standard", {
          cwd,
          encoding: "utf-8",
          timeout: GIT_TIMEOUT_MS,
        });
        for (const file of untrackedOutput.trim().split("\n")) {
          if (file) changes.push({ file, status: "added" });
        }
      } catch {}

      return changes;
    } catch {
      try {
        const porcelainOutput = execSync("git status --porcelain", {
          cwd,
          encoding: "utf-8",
          timeout: GIT_TIMEOUT_MS,
        });
        return this.parsePorcelainOutput(porcelainOutput);
      } catch {
        return [];
      }
    }
  }

  private parseGitDiffOutput(output: string): GitChange[] {
    const changes: GitChange[] = [];

    for (const line of output.trim().split("\n")) {
      if (!line) continue;

      const parts = line.split("\t");
      if (parts.length < 2) continue;

      let status: GitChange["status"] = "modified";
      if (parts[0].startsWith("A")) status = "added";
      else if (parts[0].startsWith("D")) status = "deleted";
      else if (parts[0].startsWith("R")) status = "renamed";

      changes.push({ file: parts[1], status });
    }

    return changes;
  }

  private parsePorcelainOutput(output: string): GitChange[] {
    const changes: GitChange[] = [];

    for (const line of output.trim().split("\n")) {
      if (line.length < 4) continue;

      const statusCode = line.slice(0, 2).trim();
      const file = line.slice(3).trim();

      let status: GitChange["status"] = "modified";
      switch (statusCode) {
        case "??":
        case "A":
          status = "added";
          break;
        case "D":
          status = "deleted";
          break;
        case "R":
          status = "renamed";
          break;
      }

      changes.push({ file, status });
    }

    return changes;
  }
}
