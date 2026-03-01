import type { GitChange } from "../channel/types.js";

export const AgentName = {
  ClaudeCode: "claude-code",
  Cursor: "cursor",
  Codex: "codex",
} as const;
export type AgentName = (typeof AgentName)[keyof typeof AgentName];

export const AGENT_DISPLAY_NAMES: Record<AgentName, string> = {
  [AgentName.ClaudeCode]: "Claude Code",
  [AgentName.Cursor]: "Cursor CLI",
  [AgentName.Codex]: "Codex CLI",
};

export interface AgentProvider {
  readonly name: AgentName;
  readonly displayName: string;
  readonly settleDelayMs: number;
  readonly submitKeys: string[];

  detect(): boolean;
  isHookInstalled(): boolean;
  installHook(port: number, secret: string): void;
  uninstallHook(): void;
  parseEvent(raw: unknown): AgentEventResult;
  verifyIntegrity(): { complete: boolean; missing: string[] };
}

export interface AgentEventResult {
  projectName: string;
  responseSummary: string;
  durationMs: number;
  gitChanges: GitChange[];
  inputTokens: number;
  outputTokens: number;
  model: string;
  agentSessionId?: string;
  cwd?: string;
  tmuxTarget?: string;
}
