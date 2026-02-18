import * as p from "@clack/prompts";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { HookInstaller } from "../hook/hook-installer.js";
import { detectInstallMethod } from "../utils/install-detection.js";

export function runUninstall(): void {
  p.intro("🗑️  Uninstalling ccbot");

  removeHook();
  removeConfigDirectory();

  printPostUninstallHint();

  p.outro("ccbot uninstalled");
}

function removeHook(): void {
  try {
    HookInstaller.uninstall();
    p.log.success("Hook removed from ~/.claude/settings.json");
  } catch {
    p.log.warn("No hook found (already removed)");
  }
}

function removeConfigDirectory(): void {
  const ccbotDir = join(homedir(), ".ccbot");
  try {
    rmSync(ccbotDir, { recursive: true, force: true });
    p.log.success("Removed ~/.ccbot/ (config, state, hooks)");
  } catch {
    p.log.warn("~/.ccbot/ not found (already removed)");
  }
}

function printPostUninstallHint(): void {
  const method = detectInstallMethod();

  if (method === "global") {
    p.log.info("To also remove the package:\n  pnpm remove -g ccbot");
  } else if (method === "git-clone") {
    p.log.info("To also remove the source:\n  rm -rf <ccbot-directory>");
  }
}
