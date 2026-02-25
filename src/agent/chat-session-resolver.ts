export interface ChatSessionResolver {
  resolveSessionId(
    agentSessionId: string,
    projectName: string,
    cwd?: string,
    tmuxTarget?: string
  ): string | undefined;

  onStopHook(sessionId: string): void;
}
