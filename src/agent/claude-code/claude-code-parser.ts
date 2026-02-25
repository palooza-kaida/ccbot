import { readFileSync } from "node:fs";
import { basename } from "node:path";

import { expandHome, paths } from "../../utils/paths.js";

export function extractProjectName(cwd: string, transcriptPath: string): string {
  if (transcriptPath) {
    const expanded = expandHome(transcriptPath);
    if (expanded.startsWith(`${paths.claudeProjectsDir}/`)) {
      const encodedDir = expanded.slice(`${paths.claudeProjectsDir}/`.length).split("/")[0];
      if (encodedDir) {
        const projectPath = resolveProjectPath(encodedDir, cwd);
        if (projectPath) return basename(projectPath);
      }
    }
  }
  return basename(cwd);
}

function resolveProjectPath(encodedDir: string, cwd: string): string | null {
  const encodedCwd = encodePathSegment(cwd);
  if (encodedDir === encodedCwd) return cwd;

  if (encodedDir.startsWith(encodedCwd)) return cwd;
  if (encodedCwd.startsWith(encodedDir)) return cwd;

  return null;
}

function encodePathSegment(absolutePath: string): string {
  return absolutePath.replaceAll("/", "-");
}

interface TranscriptEntry {
  type?: string;
  message?: MessageContent;
  timestamp?: string;
  durationMs?: number;
  sessionId?: string;
  parentUuid?: string;
  uuid?: string;
  summary?: string;
}

interface MessageContent {
  role: string;
  content?: ContentPart[];
  usage?: TokenUsage;
  model?: string;
}

interface ContentPart {
  type: string;
  text?: string;
}

interface TokenUsage {
  input_tokens?: number;
  output_tokens?: number;
}

export interface StopEvent {
  session_id: string;
  transcript_path: string;
  cwd: string;
}

export interface TranscriptSummary {
  lastAssistantMessage: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export function isValidStopEvent(data: unknown): data is StopEvent {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.session_id === "string" &&
    typeof obj.transcript_path === "string" &&
    typeof obj.cwd === "string"
  );
}

export function parseTranscript(transcriptPath: string): TranscriptSummary {
  const expandedPath = expandHome(transcriptPath);
  const raw = readFileSync(expandedPath, "utf-8");
  const lines = raw.split("\n");

  let lastAssistantText = "";
  let summaryText = "";
  let firstTimestamp: Date | null = null;
  let lastTimestamp: Date | null = null;
  let inputTokens = 0;
  let outputTokens = 0;
  let model = "";

  for (const line of lines) {
    if (!line.trim()) continue;

    let entry: TranscriptEntry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.timestamp) {
      const entryDate = new Date(entry.timestamp);
      if (!isNaN(entryDate.getTime())) {
        if (!firstTimestamp) firstTimestamp = entryDate;
        lastTimestamp = entryDate;
      }
    }

    if (entry.type === "summary" && entry.summary) {
      summaryText = entry.summary;
    }

    if (entry.type === "assistant" || entry.message) {
      const msg = entry.message;
      if (msg?.role === "assistant") {
        const rawContent = msg.content ?? [];
        const contentArray = Array.isArray(rawContent) ? rawContent : [];
        const text = extractTextFromContent(contentArray);
        if (text) {
          lastAssistantText = text;
        }

        if (msg.model) {
          model = msg.model;
        }

        if (msg.usage) {
          inputTokens += msg.usage.input_tokens ?? 0;
          outputTokens += msg.usage.output_tokens ?? 0;
        }
      }
    }
  }

  let durationMs = 0;
  if (firstTimestamp && lastTimestamp) {
    durationMs = lastTimestamp.getTime() - firstTimestamp.getTime();
  }

  const finalMessage = lastAssistantText || summaryText;

  return {
    lastAssistantMessage: finalMessage,
    durationMs,
    inputTokens,
    outputTokens,
    model,
  };
}

function extractTextFromContent(parts: ContentPart[]): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("\n");
}
