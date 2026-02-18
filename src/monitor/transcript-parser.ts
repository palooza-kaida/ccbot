import { readFileSync } from "node:fs";
import { homedir } from "node:os";

interface TranscriptEntry {
  type?: string;
  message?: MessageContent;
  timestamp?: string;
  costUSD?: number;
  durationMs?: number;
  sessionId?: string;
  parentUuid?: string;
  uuid?: string;
}

interface MessageContent {
  role: string;
  content?: ContentPart[];
}

interface ContentPart {
  type: string;
  text?: string;
}

export interface TranscriptSummary {
  lastAssistantMessage: string;
  durationMs: number;
  totalCostUSD: number;
}

export function parseTranscript(transcriptPath: string): TranscriptSummary {
  const expandedPath = expandHome(transcriptPath);
  const raw = readFileSync(expandedPath, "utf-8");
  const lines = raw.split("\n");

  let lastAssistantText = "";
  let totalCost = 0;
  let firstTimestamp: Date | null = null;
  let lastTimestamp: Date | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    let entry: TranscriptEntry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.timestamp) {
      const t = new Date(entry.timestamp);
      if (!isNaN(t.getTime())) {
        if (!firstTimestamp) firstTimestamp = t;
        lastTimestamp = t;
      }
    }

    totalCost += entry.costUSD ?? 0;

    if (entry.type === "assistant" || entry.message) {
      const msg = entry.message;
      if (msg?.role === "assistant") {
        const text = extractTextFromContent(msg.content ?? []);
        if (text) lastAssistantText = text;
      }
    }
  }

  let durationMs = 0;
  if (firstTimestamp && lastTimestamp) {
    durationMs = lastTimestamp.getTime() - firstTimestamp.getTime();
  }

  return { lastAssistantMessage: lastAssistantText, durationMs, totalCostUSD: totalCost };
}

function extractTextFromContent(parts: ContentPart[]): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("\n");
}

function expandHome(path: string): string {
  if (path.startsWith("~/")) {
    return homedir() + path.slice(1);
  }
  return path;
}
