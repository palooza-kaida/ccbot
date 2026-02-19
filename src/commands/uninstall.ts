import * as p from "@clack/prompts";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { HookInstaller } from "../hook/hook-installer.js";
import { detectInstallMethod } from "../utils/install-detection.js";
import { InstallMethod } from "../utils/constants.js";
import { t } from "../i18n/index.js";

export function runUninstall(): void {
  p.intro(t("uninstall.intro"));

  removeHook();
  removeConfigDirectory();

  printPostUninstallHint();

  p.outro(t("uninstall.done"));
}

function removeHook(): void {
  try {
    HookInstaller.uninstall();
    p.log.success(t("uninstall.hookRemoved"));
  } catch {
    p.log.warn(t("uninstall.hookNotFound"));
  }
}

function removeConfigDirectory(): void {
  const ccbotDir = join(homedir(), ".ccbot");
  try {
    rmSync(ccbotDir, { recursive: true, force: true });
    p.log.success(t("uninstall.configRemoved"));
  } catch {
    p.log.warn(t("uninstall.configNotFound"));
  }
}

function printPostUninstallHint(): void {
  const method = detectInstallMethod();

  if (method === InstallMethod.Global) {
    p.log.info(t("uninstall.removeGlobal"));
  } else if (method === InstallMethod.GitClone) {
    p.log.info(t("uninstall.removeGitClone"));
  }
}
