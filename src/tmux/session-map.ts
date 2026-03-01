import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

import { AgentName } from "../agent/types.js";
import { logDebug } from "../utils/log.js";
import { paths } from "../utils/paths.js";
import type { TmuxBridge } from "./tmux-bridge.js";
import { detectModelFromCwd, scanAgentPanes } from "./tmux-scanner.js";

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
  model: string;
  agent: AgentName;
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
  model: string;
  agent: AgentName;
  lastActivity: string;
}

const SESSIONS_FILE = "sessions.json";

const MAX_SESSIONS = 200;

export class SessionMap {
  private sessions = new Map<string, TmuxSession>();
  private scanInterval: ReturnType<typeof setInterval> | null = null;

  register(
    sessionId: string,
    tmuxTarget: string,
    project: string,
    cwd = "",
    label = "",
    agent: AgentName = AgentName.ClaudeCode
  ): void {
    if (tmuxTarget) {
      for (const [existingId, existing] of this.sessions) {
        if (existing.tmuxTarget === tmuxTarget && existingId !== sessionId) {
          logDebug(
            `[Register:dedup] removing ${existingId} (tmuxTarget=${tmuxTarget}) in favor of ${sessionId}`
          );
          this.sessions.delete(existingId);
        }
      }
    }

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
      model: "",
      agent,
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

  updateModel(sessionId: string, model: string): void {
    const session = this.sessions.get(sessionId);
    if (session && model) session.model = model;
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
        const agent = s.agent ?? AgentName.ClaudeCode;
        this.register(s.sessionId, s.tmuxTarget, s.project, s.cwd, s.label, agent);
        const session = this.sessions.get(s.sessionId)!;
        session.lastActivity = date;
        if (s.model) session.model = s.model;
      }
    } catch {
      // no persisted sessions
    }
  }

  refreshFromTmux(tmuxBridge: TmuxBridge): ScanResult {
    const { panes, tree } = scanAgentPanes();
    const discovered: TmuxSession[] = [];
    const removed: TmuxSession[] = [];

    const alivePaneTargets = new Set(panes.map((p) => p.target));

    // Remove sessions whose pane no longer runs Claude
    for (const [id, session] of this.sessions) {
      if (!alivePaneTargets.has(session.tmuxTarget)) {
        logDebug(
          `[Scan:remove] id=${id} tmuxTarget=${session.tmuxTarget} project=${session.project}`
        );
        removed.push(session);
        this.sessions.delete(id);
      }
    }

    // Register new panes not yet tracked (dedup handled by register())
    for (const pane of panes) {
      const existing = [...this.sessions.values()].find((s) => s.tmuxTarget === pane.target);
      if (existing) {
        // Update project/cwd if pane changed directory
        const currentProject = basename(pane.cwd) || "unknown";
        if (existing.project !== currentProject || existing.cwd !== pane.cwd) {
          existing.project = currentProject;
          existing.cwd = pane.cwd;
        }
        continue;
      }

      const syntheticId = `tmux-${pane.target.replace(/[:.]/g, "-")}`;
      const project = basename(pane.cwd) || "unknown";
      const agentName =
        "agentName" in pane ? (pane as { agentName: AgentName }).agentName : AgentName.ClaudeCode;
      const state = tmuxBridge.isAgentIdle(pane.target, tree)
        ? SessionState.Idle
        : SessionState.Unknown;

      this.register(syntheticId, pane.target, project, pane.cwd, "", agentName);
      this.updateState(syntheticId, state);
      this.updateModel(syntheticId, detectModelFromCwd(pane.cwd));
      discovered.push(this.sessions.get(syntheticId)!);
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
