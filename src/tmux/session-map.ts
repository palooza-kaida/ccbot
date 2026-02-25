import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

import { paths } from "../utils/paths.js";
import type { TmuxBridge } from "./tmux-bridge.js";
import { isClaudeAliveInPane, scanClaudePanes } from "./tmux-scanner.js";

export const SessionState = {
  Idle: "idle",
  Busy: "busy",
  Unknown: "unknown",
} as const;
export type SessionState = (typeof SessionState)[keyof typeof SessionState];

export interface TmuxSession {
  sessionId: string;
  tmuxTarget: string;
  project: string;
  cwd: string;
  label: string;
  state: SessionState;
  lastActivity: Date;
}

export interface ScanResult {
  discovered: TmuxSession[];
  removed: TmuxSession[];
  total: number;
}

interface PersistedSession {
  sessionId: string;
  tmuxTarget: string;
  project: string;
  cwd: string;
  label: string;
  state: SessionState;
  lastActivity: string;
}

const SESSIONS_FILE = "sessions.json";

const MAX_SESSIONS = 200;

export class SessionMap {
  private sessions = new Map<string, TmuxSession>();
  private scanInterval: ReturnType<typeof setInterval> | null = null;

  register(sessionId: string, tmuxTarget: string, project: string, cwd = "", label = ""): void {
    if (this.sessions.size >= MAX_SESSIONS && !this.sessions.has(sessionId)) {
      const oldest = [...this.sessions.entries()].sort(
        (a, b) => a[1].lastActivity.getTime() - b[1].lastActivity.getTime()
      )[0];
      if (oldest) this.sessions.delete(oldest[0]);
    }
    this.sessions.set(sessionId, {
      sessionId,
      tmuxTarget,
      project,
      cwd,
      label,
      state: SessionState.Idle,
      lastActivity: new Date(),
    });
  }

  unregister(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getBySessionId(sessionId: string): TmuxSession | undefined {
    return this.sessions.get(sessionId);
  }

  getByProject(project: string): TmuxSession[] {
    return [...this.sessions.values()].filter((s) => s.project === project);
  }

  getAllActive(): TmuxSession[] {
    return [...this.sessions.values()];
  }

  updateState(sessionId: string, state: SessionState): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state = state;
      session.lastActivity = new Date();
    }
  }

  updateLabel(sessionId: string, label: string): void {
    const session = this.sessions.get(sessionId);
    if (session) session.label = label;
  }

  touch(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) session.lastActivity = new Date();
  }

  save(): void {
    const data: PersistedSession[] = [...this.sessions.values()].map((s) => ({
      ...s,
      lastActivity: s.lastActivity.toISOString(),
    }));

    mkdirSync(paths.ccpokeDir, { recursive: true });
    const tmpPath = `${paths.ccpokeDir}/${SESSIONS_FILE}.tmp`;
    const finalPath = `${paths.ccpokeDir}/${SESSIONS_FILE}`;
    writeFileSync(tmpPath, JSON.stringify({ sessions: data }, null, 2));
    renameSync(tmpPath, finalPath);
  }

  load(): void {
    try {
      const raw = readFileSync(`${paths.ccpokeDir}/${SESSIONS_FILE}`, "utf-8");
      const parsed = JSON.parse(raw) as { sessions: PersistedSession[] };
      for (const s of parsed.sessions) {
        if (!s.sessionId || !s.tmuxTarget || !s.project) continue;
        const date = new Date(s.lastActivity);
        if (isNaN(date.getTime())) continue;
        this.sessions.set(s.sessionId, {
          ...s,
          lastActivity: date,
        });
      }
    } catch {
      // no persisted sessions
    }
  }

  refreshFromTmux(tmuxBridge: TmuxBridge): ScanResult {
    const { panes, tree } = scanClaudePanes();
    const discovered: TmuxSession[] = [];
    const removed: TmuxSession[] = [];

    const knownTargets = new Set([...this.sessions.values()].map((s) => s.tmuxTarget));
    for (const pane of panes) {
      if (knownTargets.has(pane.target)) continue;

      const syntheticId = `tmux-${pane.target.replace(/[:.]/g, "-")}`;
      const project = basename(pane.cwd) || "unknown";
      const state = tmuxBridge.isClaudeIdle(pane.target) ? SessionState.Idle : SessionState.Unknown;

      this.register(syntheticId, pane.target, project, pane.cwd);
      this.updateState(syntheticId, state);
      discovered.push(this.sessions.get(syntheticId)!);
    }

    // Remove dead sessions (reuse process tree from scan)
    for (const [id, session] of this.sessions) {
      if (!isClaudeAliveInPane(session.tmuxTarget, tree)) {
        removed.push(session);
        this.sessions.delete(id);
      }
    }

    return { discovered, removed, total: this.sessions.size };
  }

  startPeriodicScan(
    tmuxBridge: TmuxBridge,
    intervalMs: number,
    onResult?: (result: ScanResult) => void
  ): void {
    this.stopPeriodicScan();
    this.scanInterval = setInterval(() => {
      try {
        const result = this.refreshFromTmux(tmuxBridge);
        if (result.discovered.length > 0 || result.removed.length > 0) {
          this.save();
        }
        onResult?.(result);
      } catch {
        // scan failure non-fatal, retry next interval
      }
    }, intervalMs);
  }

  stopPeriodicScan(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }
}
