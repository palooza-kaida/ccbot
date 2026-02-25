import type { GitChangeStatus } from "../utils/constants.js";

export interface NotificationChannel {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  sendNotification(data: NotificationData, responseUrl?: string): Promise<void>;
}

export interface NotificationData {
  agent: string;
  agentDisplayName: string;
  projectName: string;
  responseSummary: string;
  durationMs: number;
  gitChanges: GitChange[];
  inputTokens: number;
  outputTokens: number;
  model: string;
  sessionId?: string;
}

export interface GitChange {
  file: string;
  status: GitChangeStatus;
}
