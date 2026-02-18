import * as p from "@clack/prompts";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { detectInstallMethod, getGitRepoRoot } from "../utils/install-detection.js";

export function runUpdate(): void {
  const method = detectInstallMethod();

  switch (method) {
    case "npx":
      p.intro("📦 ccbot update");
      p.log.step("Installed via npx — always uses latest version, no update needed.");
      p.outro("Already up to date");
      break;

    case "global":
      updateGlobal();
      break;

    case "git-clone":
      updateGitClone();
      break;
  }
}

function detectGlobalPackageManager(): string {
  const execPath = process.argv[1] ?? "";

  if (execPath.includes("pnpm")) return "pnpm";
  if (execPath.includes("yarn")) return "yarn";
  if (execPath.includes("bun")) return "bun";
  return "npm";
}

function updateGlobal(): void {
  const pm = detectGlobalPackageManager();
  const pkg = "ccbot";

  p.intro("📦 ccbot update");

  const s = p.spinner();
  s.start(`Updating via ${pm}...`);

  const cmd =
    pm === "yarn"
      ? `yarn global add ${pkg}`
      : `${pm} install -g ${pkg}@latest`;

  try {
    execSync(cmd, { stdio: "pipe" });
    s.stop("Updated successfully");
    p.outro("Update complete");
  } catch {
    s.stop("Update failed");
    p.log.error(`Try manually: ${cmd}`);
    process.exit(1);
  }
}

function updateGitClone(): void {
  const scriptDir = dirname(process.argv[1] ?? "");
  const repoRoot = getGitRepoRoot(scriptDir);

  if (!repoRoot) {
    p.log.error("Could not find git repo root.");
    process.exit(1);
  }

  p.intro("📦 ccbot update");

  const s = p.spinner();

  try {
    s.start("Pulling latest changes...");
    execSync("git pull", { cwd: repoRoot, stdio: "pipe" });
    s.stop("Pulled latest changes");

    const pm = existsSync(join(repoRoot, "pnpm-lock.yaml"))
      ? "pnpm"
      : existsSync(join(repoRoot, "yarn.lock"))
        ? "yarn"
        : existsSync(join(repoRoot, "bun.lockb"))
          ? "bun"
          : "npm";

    s.start("Installing dependencies...");
    execSync(`${pm} install`, { cwd: repoRoot, stdio: "pipe" });
    s.stop("Dependencies installed");

    s.start("Building...");
    execSync(`${pm} run build`, { cwd: repoRoot, stdio: "pipe" });
    s.stop("Build complete");

    p.outro("Update complete");
  } catch {
    s.stop("Update failed");
    p.log.error("Try manually: git pull && npm install && npm run build");
    process.exit(1);
  }
}
