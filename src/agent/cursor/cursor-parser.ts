import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";

import { expandHome, paths } from "../../utils/paths.js";

export function extractProjectName(cwd: string, transcriptPath: string): string {
  if (transcriptPath) {
    const expanded = expandHome(transcriptPath);
    if (expanded.startsWith(`${paths.cursorProjectsDir}/`)) {
      const encodedDir = expanded.slice(`${paths.cursorProjectsDir}/`.length).split("/")[0];
      if (encodedDir) {
        const encodedCwd = cwd.replaceAll("/", "-");
        if (
          encodedDir === encodedCwd ||
          encodedDir.startsWith(encodedCwd) ||
          encodedCwd.startsWith(encodedDir)
        ) {
          return basename(cwd);
        }
      }
    }
  }
  return basename(cwd);
}

interface CursorTranscriptEntry {
  role?: string;
  message?: {
    content?: { type: string; text?: string }[];
  };
}

export interface StopEvent {
  conversationId: string;
  model: string;
  status: string;
  transcriptPath: string;
  cursorVersion: string;
  cwd: string;
}

export interface TranscriptSummary {
  lastAssistantMessage: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export function isValidStopEvent(data: unknown): data is Record<string, unknown> {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.hook_event_name === "string" && obj.hook_event_name === "stop";
}

export function parseStopEvent(raw: Record<string, unknown>): StopEvent {
  const workspaceRoots = Array.isArray(raw.workspace_roots)
    ? (raw.workspace_roots as string[]).filter((r) => typeof r === "string")
    : [];

  const transcriptPath = typeof raw.transcript_path === "string" ? raw.transcript_path : "";

  const cwd =
    (workspaceRoots.length > 0 && workspaceRoots[0]) ||
    (typeof raw.cwd === "string" && raw.cwd) ||
    process.cwd();

  return {
    conversationId: typeof raw.conversation_id === "string" ? raw.conversation_id : "",
    model: typeof raw.model === "string" ? raw.model : "",
    status: typeof raw.status === "string" ? raw.status : "unknown",
    transcriptPath,
    cursorVersion: typeof raw.cursor_version === "string" ? raw.cursor_version : "",
    cwd,
  };
}

export function parseTranscript(transcriptPath: string): TranscriptSummary {
  if (!existsSync(transcriptPath)) {
    return { lastAssistantMessage: "", durationMs: 0, inputTokens: 0, outputTokens: 0, model: "" };
  }

  const raw = readFileSync(transcriptPath, "utf-8");
  const lines = raw.split("\n");
  let lastAssistantText = "";

  for (const line of lines) {
    if (!line.trim()) continue;

    let entry: CursorTranscriptEntry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.role === "assistant" && entry.message?.content) {
      const text = entry.message.content
        .filter((p) => p.type === "text" && p.text)
        .map((p) => p.text!)
        .join("\n");
      if (text) lastAssistantText = text;
    }
  }

  return {
    lastAssistantMessage: lastAssistantText,
    durationMs: 0,
    inputTokens: 0,
    outputTokens: 0,
    model: "",
  };
}
