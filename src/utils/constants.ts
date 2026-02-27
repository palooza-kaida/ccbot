export const GitChangeStatus = {
  Modified: "modified",
  Added: "added",
  Deleted: "deleted",
  Renamed: "renamed",
} as const;

export type GitChangeStatus = (typeof GitChangeStatus)[keyof typeof GitChangeStatus];

export const InstallMethod = {
  Global: "global",
  GitClone: "git-clone",
  Npx: "npx",
} as const;

export type InstallMethod = (typeof InstallMethod)[keyof typeof InstallMethod];

export const CliCommand = {
  Setup: "setup",
  Update: "update",
  Uninstall: "uninstall",
  Help: "help",
  HelpFlag: "--help",
  HelpShort: "-h",
} as const;

export type CliCommand = (typeof CliCommand)[keyof typeof CliCommand];

export const PackageManager = {
  Npm: "npm",
  Pnpm: "pnpm",
  Yarn: "yarn",
  Bun: "bun",
} as const;

export type PackageManager = (typeof PackageManager)[keyof typeof PackageManager];

export const ApiRoute = {
  HookStop: "/hook/stop",
  HookSessionStart: "/hook/session-start",
  HookNotification: "/hook/notification",
  HookAskUserQuestion: "/hook/ask-user-question",
  ResponseData: "/api/responses/:id",
  Health: "/health",
} as const;

export const DEFAULT_HOOK_PORT = 9377;
export const MINI_APP_BASE_URL = "https://palooza-kaida.github.io/ccpoke";
