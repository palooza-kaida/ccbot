import * as p from "@clack/prompts";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { detectInstallMethod, getGitRepoRoot } from "../utils/install-detection.js";
import { InstallMethod } from "../utils/constants.js";
import { t } from "../i18n/index.js";

export function runUpdate(): void {
  const method = detectInstallMethod();

  switch (method) {
    case InstallMethod.Npx:
      p.intro(t("update.intro"));
      p.log.step(t("update.npxAlreadyLatest"));
      p.outro(t("update.npxDone"));
      break;

    case InstallMethod.Global:
      updateGlobal();
      break;

    case InstallMethod.GitClone:
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

  p.intro(t("update.intro"));

  const s = p.spinner();
  s.start(t("update.updating", { pm }));

  const cmd =
    pm === "yarn"
      ? `yarn global add ${pkg}`
      : `${pm} install -g ${pkg}@latest`;

  try {
    execSync(cmd, { stdio: "pipe" });
    s.stop(t("update.updateSuccess"));
    p.outro(t("update.updateComplete"));
  } catch {
    s.stop(t("update.updateFailed"));
    p.log.error(t("update.updateManualGlobal", { cmd }));
    process.exit(1);
  }
}

function updateGitClone(): void {
  const scriptDir = dirname(process.argv[1] ?? "");
  const repoRoot = getGitRepoRoot(scriptDir);

  if (!repoRoot) {
    p.log.error(t("update.gitRepoNotFound"));
    process.exit(1);
  }

  p.intro(t("update.intro"));

  const s = p.spinner();

  try {
    s.start(t("update.pulling"));
    execSync("git pull", { cwd: repoRoot, stdio: "pipe" });
    s.stop(t("update.pulled"));

    const pm = existsSync(join(repoRoot, "pnpm-lock.yaml"))
      ? "pnpm"
      : existsSync(join(repoRoot, "yarn.lock"))
        ? "yarn"
        : existsSync(join(repoRoot, "bun.lockb"))
          ? "bun"
          : "npm";

    s.start(t("update.installingDeps"));
    execSync(`${pm} install`, { cwd: repoRoot, stdio: "pipe" });
    s.stop(t("update.depsInstalled"));

    s.start(t("update.building"));
    execSync(`${pm} run build`, { cwd: repoRoot, stdio: "pipe" });
    s.stop(t("update.buildComplete"));

    p.outro(t("update.updateComplete"));
  } catch {
    s.stop(t("update.updateFailed"));
    p.log.error(t("update.updateManualGit"));
    process.exit(1);
  }
}
