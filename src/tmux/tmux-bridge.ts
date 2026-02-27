import { execSync } from "node:child_process";

import { isClaudeIdleByProcess, type ProcessTree } from "./tmux-scanner.js";

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

  isClaudeIdle(target: string, tree?: ProcessTree): boolean {
    try {
      const panePid = execSync(
        `tmux display-message -t ${escapeShellArg(target)} -p '#{pane_pid}'`,
        {
          encoding: "utf-8",
          stdio: "pipe",
          timeout: 3000,
        }
      ).trim();
      return isClaudeIdleByProcess(panePid, tree);
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
