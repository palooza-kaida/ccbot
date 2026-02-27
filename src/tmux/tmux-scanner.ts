import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { escapeShellArg } from "./tmux-bridge.js";

export interface TmuxPaneInfo {
  target: string;
  paneTitle: string;
  cwd: string;
  panePid: string;
}

const FORMAT_STRING =
  "#{session_name}:#{window_index}.#{pane_index}|#{pane_title}|#{pane_current_path}|#{pane_pid}";
const MAX_DESCENDANT_DEPTH = 4;

interface ProcessEntry {
  pid: string;
  ppid: string;
  command: string;
}

export type ProcessTree = Map<string, ProcessEntry[]>;

export function buildProcessTree(): ProcessTree {
  try {
    const output = execSync("ps -e -o pid=,ppid=,command=", {
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 3000,
    });
    const tree: ProcessTree = new Map();
    for (const line of output.trim().split("\n")) {
      const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/);
      if (!match) continue;
      const entry: ProcessEntry = { pid: match[1]!, ppid: match[2]!, command: match[3]! };
      const siblings = tree.get(entry.ppid) ?? [];
      siblings.push(entry);
      tree.set(entry.ppid, siblings);
    }
    return tree;
  } catch {
    return new Map();
  }
}

export function hasClaudeDescendant(panePid: string, tree?: ProcessTree): boolean {
  const processTree = tree ?? buildProcessTree();

  function search(pid: string, depth: number): boolean {
    if (depth >= MAX_DESCENDANT_DEPTH) return false;
    const children = processTree.get(pid);
    if (!children) return false;
    for (const child of children) {
      if (/\bclaude\b/i.test(child.command)) return true;
      if (search(child.pid, depth + 1)) return true;
    }
    return false;
  }

  return search(panePid, 0);
}

function isClaudePane(pane: TmuxPaneInfo, tree?: ProcessTree): boolean {
  return hasClaudeDescendant(pane.panePid, tree);
}

const SHELL_PATTERN = /\b(bash|zsh|sh|fish)\b/;
// Claude Code keeps persistent shell-snapshot processes; exclude them from busy detection
const SHELL_SNAPSHOT_PATTERN = /shell-snapshots\/snapshot-/;

/**
 * Claude is idle when its process has no active child shell processes.
 * Shell-snapshot processes (persistent) are excluded.
 * When busy, Claude spawns /bin/zsh -c ... for tool execution.
 */
export function isClaudeIdleByProcess(panePid: string, tree?: ProcessTree): boolean {
  const processTree = tree ?? buildProcessTree();

  function findClaudePid(pid: string, depth: number): string | undefined {
    if (depth >= MAX_DESCENDANT_DEPTH) return undefined;
    const children = processTree.get(pid);
    if (!children) return undefined;
    for (const child of children) {
      if (/\bclaude\b/i.test(child.command)) return child.pid;
      const found = findClaudePid(child.pid, depth + 1);
      if (found) return found;
    }
    return undefined;
  }

  const claudePid = findClaudePid(panePid, 0);
  if (!claudePid) return false;

  const children = processTree.get(claudePid);
  if (!children) return true;
  return !children.some(
    (c) => SHELL_PATTERN.test(c.command) && !SHELL_SNAPSHOT_PATTERN.test(c.command)
  );
}

export interface ScanOutput {
  panes: TmuxPaneInfo[];
  tree: ProcessTree;
}

export function scanClaudePanes(): ScanOutput {
  try {
    const output = execSync(`tmux list-panes -a -F '${FORMAT_STRING}'`, {
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 5000,
    });

    const tree = buildProcessTree();

    const panes = output
      .trim()
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line: string): TmuxPaneInfo | null => {
        const parts = line.split("|");
        if (parts.length < 4) return null;
        const target = parts[0]!;
        const panePid = parts[parts.length - 1]!;
        const cwd = parts[parts.length - 2]!;
        const paneTitle = parts.slice(1, parts.length - 2).join("|");
        return { target, paneTitle, cwd, panePid };
      })
      .filter((pane): pane is TmuxPaneInfo => pane !== null && isClaudePane(pane, tree));

    return { panes, tree };
  } catch {
    return { panes: [], tree: new Map() };
  }
}

export function isClaudeAliveInPane(target: string, tree?: ProcessTree): boolean {
  const sessionName = target.split(":")[0];
  if (!sessionName) return false;
  try {
    execSync(`tmux has-session -t ${escapeShellArg(sessionName)}`, {
      stdio: "pipe",
      timeout: 3000,
    });
  } catch {
    return false;
  }

  try {
    const panePid = execSync(`tmux display-message -t ${escapeShellArg(target)} -p '#{pane_pid}'`, {
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 3000,
    }).trim();
    return hasClaudeDescendant(panePid, tree);
  } catch {
    return false;
  }
}

export function isPaneAlive(target: string): boolean {
  const sessionName = target.split(":")[0];
  if (!sessionName) return false;
  try {
    execSync(`tmux has-session -t ${escapeShellArg(sessionName)}`, {
      stdio: "pipe",
      timeout: 3000,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect model from the latest transcript file for a given cwd.
 * Claude Code stores transcripts in ~/.claude/projects/{encoded-cwd}/{session-id}.jsonl
 */
export function detectModelFromCwd(cwd: string): string {
  try {
    const encoded = cwd.replaceAll("/", "-");
    const projectDir = join(homedir(), ".claude", "projects", encoded);

    const jsonlFiles = readdirSync(projectDir)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => {
        const fullPath = join(projectDir, f);
        return { path: fullPath, mtime: statSync(fullPath).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);

    if (jsonlFiles.length === 0) return "";

    const output = execSync(
      `grep -o '"model":"[^"]*"' ${escapeShellArg(jsonlFiles[0]!.path)} | tail -1`,
      { encoding: "utf-8", stdio: "pipe", timeout: 3000 }
    ).trim();

    const match = output.match(/"model":"([^"]*)"/);
    return match?.[1] ?? "";
  } catch {
    return "";
  }
}
