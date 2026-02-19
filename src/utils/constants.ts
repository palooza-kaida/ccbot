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
