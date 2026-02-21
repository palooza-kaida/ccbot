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
  ResponseData: "/api/responses/:id",
  Health: "/health",
} as const;

export const DEFAULT_HOOK_PORT = 9377;
export const TUNNEL_TIMEOUT_MS = 30_000;
export const SETUP_WAIT_TIMEOUT_MS = 120_000;
export const TRANSCRIPT_SETTLE_DELAY_MS = 500;
export const MAX_STORED_RESPONSES = 100;
export const RESPONSE_EXPIRE_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_FALLBACK_DURATION_MS = 1000;
export const SPLIT_LOOKBACK_RANGE = 200;
export const MAX_GIT_SEARCH_DEPTH = 5;
export const GIT_TIMEOUT_MS = 10_000;

export const MINI_APP_BASE_URL = "https://palooza-kaida.github.io/ccpoke";
