import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { paths } from "../../utils/paths.js";

export interface CodexNotifyEvent {
  threadId: string;
  turnId: string;
  cwd: string;
  lastAssistantMessage: string;
}

export interface RolloutSummary {
  model: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
}

const EMPTY_ROLLOUT: RolloutSummary = { model: "", durationMs: 0, inputTokens: 0, outputTokens: 0 };

export function isValidNotifyEvent(data: unknown): data is Record<string, unknown> {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return obj["type"] === "agent-turn-complete" && typeof obj["thread-id"] === "string";
}

export function parseNotifyEvent(raw: Record<string, unknown>): CodexNotifyEvent {
  return {
    threadId: typeof raw["thread-id"] === "string" ? raw["thread-id"] : "",
    turnId: typeof raw["turn-id"] === "string" ? raw["turn-id"] : "",
    cwd: typeof raw["cwd"] === "string" ? raw["cwd"] : "",
    lastAssistantMessage:
      typeof raw["last-assistant-message"] === "string" ? raw["last-assistant-message"] : "",
  };
}

export function parseRolloutFile(threadId: string): RolloutSummary {
  try {
    if (!existsSync(paths.codexSessionsDir)) return EMPTY_ROLLOUT;

    const files = readdirSync(paths.codexSessionsDir).filter(
      (f) => f.startsWith("rollout-") && f.endsWith(".jsonl") && f.includes(threadId)
    );
    if (files.length === 0) return EMPTY_ROLLOUT;

    const filePath = join(paths.codexSessionsDir, files[files.length - 1]!);
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());

    let model = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let firstTimestamp = 0;
    let lastTimestamp = 0;

    for (const line of lines) {
      let obj: Record<string, unknown>;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }

      if (typeof obj.model === "string" && obj.model) model = obj.model;

      const usage = obj.usage as Record<string, unknown> | undefined;
      if (usage && typeof usage === "object") {
        if (typeof usage.input_tokens === "number") inputTokens += usage.input_tokens;
        if (typeof usage.output_tokens === "number") outputTokens += usage.output_tokens;
      }

      const ts =
        typeof obj.timestamp === "number"
          ? obj.timestamp
          : typeof obj.created_at === "number"
            ? obj.created_at
            : 0;
      if (ts > 0) {
        if (firstTimestamp === 0 || ts < firstTimestamp) firstTimestamp = ts;
        if (ts > lastTimestamp) lastTimestamp = ts;
      }
    }

    const durationMs =
      firstTimestamp > 0 && lastTimestamp > firstTimestamp
        ? Math.round((lastTimestamp - firstTimestamp) * 1000)
        : 0;

    return { model, durationMs, inputTokens, outputTokens };
  } catch {
    return EMPTY_ROLLOUT;
  }
}

export function extractProjectName(cwd: string): string {
  return basename(cwd) || "unknown";
}
