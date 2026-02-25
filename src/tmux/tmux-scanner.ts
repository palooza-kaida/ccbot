import { execSync } from "node:child_process";

import { escapeShellArg } from "./tmux-bridge.js";

export interface TmuxPaneInfo {
  target: string;
  paneTitle: string;
  cwd: string;
  panePid: string;
}

const CLAUDE_TITLE_PATTERN = /claude code/i;
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
  if (CLAUDE_TITLE_PATTERN.test(pane.paneTitle)) return true;

  return hasClaudeDescendant(pane.panePid, tree);
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
    const title = execSync(`tmux display-message -t ${escapeShellArg(target)} -p '#{pane_title}'`, {
      encoding: "utf-8",
      stdio: "pipe",
      timeout: 3000,
    }).trim();
    if (CLAUDE_TITLE_PATTERN.test(title)) return true;
  } catch {
    // pane may not exist anymore
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
