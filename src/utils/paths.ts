import { join, dirname, basename } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(MODULE_DIR, "..", "..");

const CCPOKE_HOME = join(homedir(), ".ccpoke");
const CLAUDE_HOME = join(homedir(), ".claude");
const CURSOR_HOME = join(homedir(), ".cursor");

export const paths = {
  projectRoot: PROJECT_ROOT,

  packageJson: join(PROJECT_ROOT, "package.json"),

  ccpokeDir: CCPOKE_HOME,
  configFile: join(CCPOKE_HOME, "config.json"),
  stateFile: join(CCPOKE_HOME, "state.json"),
  hooksDir: join(CCPOKE_HOME, "hooks"),
  responsesDir: join(CCPOKE_HOME, "responses"),

  claudeCodeHookScript: join(
    CCPOKE_HOME,
    "hooks",
    process.platform === "win32" ? "claude-code-stop.cmd" : "claude-code-stop.sh"
  ),
  cursorHookScript: join(
    CCPOKE_HOME,
    "hooks",
    process.platform === "win32" ? "cursor-stop.cmd" : "cursor-stop.sh"
  ),

  claudeDir: CLAUDE_HOME,
  claudeSettings: join(CLAUDE_HOME, "settings.json"),

  cursorDir: CURSOR_HOME,
  cursorHooksJson: join(CURSOR_HOME, "hooks.json"),
} as const;

export function getPackageVersion(): string {
  try {
    return JSON.parse(readFileSync(paths.packageJson, "utf-8")).version;
  } catch {
    return "unknown";
  }
}

export function expandHome(filepath: string): string {
  if (filepath.startsWith("~/")) {
    return join(homedir(), filepath.slice(2));
  }
  return filepath;
}

export function extractProjectName(cwd: string): string {
  return basename(cwd);
}
