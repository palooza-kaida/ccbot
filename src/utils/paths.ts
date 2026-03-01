import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
  completionsDir: join(CCPOKE_HOME, "completions"),
  zshCompletion: join(CCPOKE_HOME, "completions", "_ccpoke"),
  bashCompletion: join(CCPOKE_HOME, "completions", "ccpoke.bash"),

  claudeCodeHookScript: join(
    CCPOKE_HOME,
    "hooks",
    process.platform === "win32" ? "claude-code-stop.cmd" : "claude-code-stop.sh"
  ),
  claudeCodeSessionStartScript: join(CCPOKE_HOME, "hooks", "claude-code-session-start.sh"),
  claudeCodeNotificationScript: join(CCPOKE_HOME, "hooks", "claude-code-notification.sh"),
  claudeCodePreToolUseScript: join(CCPOKE_HOME, "hooks", "claude-code-pretooluse.sh"),
  claudeCodePermissionRequestScript: join(
    CCPOKE_HOME,
    "hooks",
    "claude-code-permission-request.sh"
  ),
  cursorHookScript: join(
    CCPOKE_HOME,
    "hooks",
    process.platform === "win32" ? "cursor-stop.cmd" : "cursor-stop.sh"
  ),

  claudeDir: CLAUDE_HOME,
  claudeSettings: join(CLAUDE_HOME, "settings.json"),
  claudeProjectsDir: join(CLAUDE_HOME, "projects"),

  cursorDir: CURSOR_HOME,
  cursorHooksJson: join(CURSOR_HOME, "hooks.json"),
  cursorProjectsDir: join(CURSOR_HOME, "projects"),
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
