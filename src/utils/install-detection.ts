import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

export type InstallMethod = "global" | "git-clone" | "npx";

export function detectInstallMethod(): InstallMethod {
  const execPath = process.argv[1] ?? "";

  if (execPath.includes("npx") || execPath.includes(".npm/_npx")) {
    return "npx";
  }

  const scriptDir = dirname(execPath);
  if (isGitRepo(scriptDir)) {
    return "git-clone";
  }

  return "global";
}

export function detectCliPrefix(): string {
  const method = detectInstallMethod();
  switch (method) {
    case "npx":
      return "npx ccbot";
    case "git-clone":
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
