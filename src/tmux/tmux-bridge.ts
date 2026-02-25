import { execSync } from "node:child_process";

const CLAUDE_PROMPT_PATTERNS = [/[❯>]\s*$/, /\$\s*$/];
const IDLE_SCAN_LINES = 5;

export class TmuxBridge {
  private available: boolean | null = null;

  isTmuxAvailable(): boolean {
    if (this.available !== null) return this.available;
    try {
      execSync("tmux -V", { stdio: "pipe" });
      this.available = true;
    } catch {
      this.available = false;
    }
    return this.available;
  }

  sendKeys(target: string, text: string): void {
    const tgt = escapeShellArg(target);
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (line.length === 0 && i < lines.length - 1) continue;

      const escaped = escapeTmuxText(line);
      execSync(`tmux send-keys -t ${tgt} -l ${escaped}`, {
        stdio: "pipe",
        timeout: 5000,
      });
      execSync(`tmux send-keys -t ${tgt} Enter`, {
        stdio: "pipe",
        timeout: 5000,
      });
    }
  }

  capturePane(target: string, lineCount = 50): string {
    return execSync(`tmux capture-pane -t ${escapeShellArg(target)} -p -S -${lineCount}`, {
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 5000,
    }).trimEnd();
  }

  isClaudeIdle(target: string): boolean {
    try {
      const content = this.capturePane(target, IDLE_SCAN_LINES);
      const lines = content.split("\n");

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i]!.trimEnd();
        if (line.length === 0) continue;
        if (CLAUDE_PROMPT_PATTERNS.some((pattern) => pattern.test(line))) return true;
        return false;
      }
      return false;
    } catch {
      return false;
    }
  }

  hasUncommittedInput(target: string): boolean {
    try {
      const content = this.capturePane(target, 10);
      const lines = content.split("\n");

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i]!.trimEnd();
        const promptMatch = line.match(/[❯>]\s*/);
        if (promptMatch && promptMatch.index !== undefined) {
          const afterPrompt = line.slice(promptMatch.index + promptMatch[0].length);
          return afterPrompt.trim().length > 0;
        }
      }
      return false;
    } catch {
      return false;
    }
  }
}

function escapeTmuxText(text: string): string {
  const escaped = text
    .replace(/\r/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\$/g, "\\$")
    .replace(/`/g, "\\`")
    .replace(/;/g, "\\;");
  return `"${escaped}"`;
}

export function escapeShellArg(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
