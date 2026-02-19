import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { InstallMethod } from "./constants.js";
export type { InstallMethod } from "./constants.js";

export function detectInstallMethod(): InstallMethod {
  const execPath = process.argv[1] ?? "";

  if (execPath.includes("npx") || execPath.includes(".npm/_npx")) {
    return InstallMethod.Npx;
  }

  const scriptDir = dirname(execPath);
  if (isGitRepo(scriptDir)) {
    return InstallMethod.GitClone;
  }

  return InstallMethod.Global;
}

export function detectCliPrefix(): string {
  const method = detectInstallMethod();
  switch (method) {
    case InstallMethod.Npx:
      return "npx ccbot";
    case InstallMethod.GitClone:
      return "node dist/index.js";
    default:
      return "ccbot";
  }
}

export function getGitRepoRoot(dir: string): string | null {
  let current = dir;
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(current, ".git"))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

function isGitRepo(dir: string): boolean {
  return getGitRepoRoot(dir) !== null;
}
