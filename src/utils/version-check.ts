import { getPackageVersion } from "./paths.js";
import { logWarn } from "./log.js";
import { t } from "../i18n/index.js";
import { NPM_REGISTRY_URL, VERSION_CHECK_TIMEOUT_MS, InstallMethod } from "./constants.js";
import { detectInstallMethod } from "./install-detection.js";

function isNewerVersion(current: string, latest: string): boolean {
  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const c = currentParts[i] ?? 0;
    const l = latestParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }

  return false;
}

function getUpdateCommand(): string {
  const method = detectInstallMethod();
  switch (method) {
    case InstallMethod.Npx:
      return "npx ccpoke@latest";
    case InstallMethod.GitClone:
      return "git pull && npm run build";
    case InstallMethod.Global:
      return "ccpoke update";
  }
}

function formatUpdateBox(currentVersion: string, latestVersion: string): string {
  const lines = [
    "",
    t("versionCheck.updateAvailable", { latest: latestVersion, current: currentVersion }),
    t("versionCheck.runToUpdate", { command: getUpdateCommand() }),
    "",
  ];

  const maxLen = Math.max(...lines.map((l) => l.length));
  const top = "┏" + "━".repeat(maxLen + 2) + "┓";
  const bottom = "┗" + "━".repeat(maxLen + 2) + "┛";

  const boxLines = lines.map((l) => `┃ ${l.padEnd(maxLen)} ┃`);

  return [top, ...boxLines, bottom].join("\n");
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), VERSION_CHECK_TIMEOUT_MS);

    const response = await fetch(NPM_REGISTRY_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = (await response.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

export async function checkForUpdates(): Promise<void> {
  const currentVersion = getPackageVersion();
  if (currentVersion === "unknown") return;

  const latestVersion = await fetchLatestVersion();
  if (!latestVersion) return;

  if (isNewerVersion(currentVersion, latestVersion)) {
    logWarn(formatUpdateBox(currentVersion, latestVersion), { showTimestamp: false });
  }
}
