import { basename } from "node:path";

export interface GitChange {
  file: string;
  status: "modified" | "added" | "deleted" | "renamed";
}

export interface NotificationData {
  projectName: string;
  responseSummary: string;
  durationMs: number;
  gitChanges: GitChange[];
}

export function formatNotification(data: NotificationData): string {
  const parts: string[] = [];

  parts.push("🤖 *Claude Code Response*");

  let projectLine = `📂 \`${escapeMarkdownV2(data.projectName)}\``;
  if (data.durationMs > 0) {
    projectLine += ` \\| ⏱ ${escapeMarkdownV2(formatDuration(data.durationMs))}`;
  }
  parts.push(projectLine);
  parts.push("");

  if (data.responseSummary) {
    let summary = data.responseSummary;
    if (summary.length > 2000) {
      summary = summary.slice(0, 2000) + "...";
    }
    parts.push(escapeMarkdownV2(summary));
  }

  if (data.gitChanges.length > 0) {
    parts.push("");
    parts.push("📂 *Changes:*");
    for (const change of data.gitChanges) {
      const emoji = gitChangeEmoji(change.status);
      parts.push(`${emoji} \`${escapeMarkdownV2(change.file)}\``);
    }
  }

  return parts.join("\n");
}

export function escapeMarkdownV2(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m${seconds}s`;
}

function gitChangeEmoji(status: string): string {
  switch (status) {
    case "added":
      return "➕";
    case "deleted":
      return "❌";
    case "renamed":
      return "📝";
    default:
      return "✏️";
  }
}

export function extractProjectName(cwd: string): string {
  return basename(cwd);
}
