import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  unlinkSync,
  existsSync,
  renameSync,
} from "node:fs";
import { paths } from "../../utils/paths.js";
import { ApiRoute } from "../../utils/constants.js";
import { AgentName } from "../types.js";

interface ClaudeHookCommand {
  type: string;
  command: string;
  timeout: number;
}

interface ClaudeHookEntry {
  hooks: ClaudeHookCommand[];
}

interface ClaudeSettings {
  hooks?: {
    Stop?: ClaudeHookEntry[];
    SessionStart?: ClaudeHookEntry[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function hasCcpokeHook(entries: ClaudeHookEntry[]): boolean {
  return entries.some((entry) =>
    entry.hooks?.some((h) => typeof h.command === "string" && h.command.includes("ccpoke"))
  );
}

export class ClaudeCodeInstaller {
  static isInstalled(): boolean {
    try {
      const settings = ClaudeCodeInstaller.readSettings();
      return (
        hasCcpokeHook(settings.hooks?.Stop ?? []) &&
        hasCcpokeHook(settings.hooks?.SessionStart ?? [])
      );
    } catch {
      return false;
    }
  }

  static verifyIntegrity(): { complete: boolean; missing: string[] } {
    const missing: string[] = [];
    try {
      const settings = ClaudeCodeInstaller.readSettings();
      if (!hasCcpokeHook(settings.hooks?.Stop ?? [])) missing.push("Stop hook in settings");
      if (!hasCcpokeHook(settings.hooks?.SessionStart ?? []))
        missing.push("SessionStart hook in settings");
    } catch {
      missing.push("settings.json");
    }
    if (!existsSync(paths.claudeCodeHookScript)) missing.push("stop script file");
    if (!existsSync(paths.claudeCodeSessionStartScript)) missing.push("session-start script file");
    return { complete: missing.length === 0, missing };
  }

  static install(hookPort: number, hookSecret: string): void {
    ClaudeCodeInstaller.uninstall();

    const settings = ClaudeCodeInstaller.readSettings();
    if (!settings.hooks) settings.hooks = {};

    settings.hooks.Stop = [
      ...(settings.hooks.Stop ?? []),
      { hooks: [{ type: "command", command: paths.claudeCodeHookScript, timeout: 10 }] },
    ];

    if (process.platform !== "win32") {
      settings.hooks.SessionStart = [
        ...(settings.hooks.SessionStart ?? []),
        { hooks: [{ type: "command", command: paths.claudeCodeSessionStartScript, timeout: 5 }] },
      ];
    }

    mkdirSync(paths.claudeDir, { recursive: true });
    const tmpSettings = `${paths.claudeSettings}.tmp`;
    writeFileSync(tmpSettings, JSON.stringify(settings, null, 2));
    renameSync(tmpSettings, paths.claudeSettings);

    ClaudeCodeInstaller.writeStopScript(hookPort, hookSecret);
    ClaudeCodeInstaller.writeSessionStartScript(hookPort, hookSecret);
  }

  static uninstall(): void {
    ClaudeCodeInstaller.removeFromSettings();
    ClaudeCodeInstaller.removeStopScript();
    ClaudeCodeInstaller.removeSessionStartScript();
  }

  private static writeStopScript(hookPort: number, hookSecret: string): void {
    mkdirSync(paths.hooksDir, { recursive: true });

    const agentParam = `?agent=${AgentName.ClaudeCode}`;
    const isWindows = process.platform === "win32";

    if (isWindows) {
      const script = `@echo off\ncurl -s -X POST http://localhost:${hookPort}${ApiRoute.HookStop}${agentParam} -H "Content-Type: application/json" -H "X-CCPoke-Secret: ${hookSecret}" --data-binary @- > nul 2>&1\n`;
      writeFileSync(paths.claudeCodeHookScript, script, { mode: 0o644 });
      return;
    }

    const script = `#!/bin/bash
INPUT=$(cat | tr -d '\\n\\r')
TMUX_TARGET=""
[ -n "$TMUX" ] && TMUX_TARGET=$(tmux display-message -p '#{session_name}:#{window_index}.#{pane_index}' 2>/dev/null || echo "")
if [ -n "$TMUX_TARGET" ] && echo "$TMUX_TARGET" | grep -qE '^[a-zA-Z0-9_.:/@ -]+$'; then
  INPUT=$(echo "$INPUT" | sed 's/}$/,"tmux_target":"'"$TMUX_TARGET"'"}/')
fi
echo "$INPUT" | curl -s -X POST "http://localhost:${hookPort}${ApiRoute.HookStop}${agentParam}" \\
  -H "Content-Type: application/json" -H "X-CCPoke-Secret: ${hookSecret}" \\
  --data-binary @- > /dev/null 2>&1 || true
`;

    writeFileSync(paths.claudeCodeHookScript, script, { mode: 0o700 });
  }

  private static writeSessionStartScript(hookPort: number, hookSecret: string): void {
    mkdirSync(paths.hooksDir, { recursive: true });

    if (process.platform === "win32") return;

    const script = `#!/bin/bash
[ -z "$TMUX" ] && exit 0

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | grep -o '"session_id":"[^"]*"' | head -1 | cut -d'"' -f4)
CWD=$(echo "$INPUT" | grep -o '"cwd":"[^"]*"' | head -1 | cut -d'"' -f4)
TMUX_TARGET=$(tmux display-message -p '#{session_name}:#{window_index}.#{pane_index}')

[ -z "$SESSION_ID" ] && exit 0

json_escape() {
  printf '%s' "$1" | sed 's/\\\\/\\\\\\\\/g; s/"/\\\\"/g; s/\t/\\\\t/g' | tr -d '\\n\\r'
}

PAYLOAD=$(printf '{"session_id":"%s","cwd":"%s","tmux_target":"%s"}' \\
  "$(json_escape "$SESSION_ID")" "$(json_escape "$CWD")" "$(json_escape "$TMUX_TARGET")")

curl -s -X POST "http://127.0.0.1:${hookPort}${ApiRoute.HookSessionStart}" \\
  -H "Content-Type: application/json" \\
  -H "X-CCPoke-Secret: ${hookSecret}" \\
  -d "$PAYLOAD" \\
  --max-time 3 > /dev/null 2>&1 || true
`;

    writeFileSync(paths.claudeCodeSessionStartScript, script, { mode: 0o700 });
  }

  private static removeStopScript(): void {
    try {
      unlinkSync(paths.claudeCodeHookScript);
    } catch {
      /* may not exist */
    }
  }

  private static removeSessionStartScript(): void {
    try {
      unlinkSync(paths.claudeCodeSessionStartScript);
    } catch {
      /* may not exist */
    }
  }

  private static removeFromSettings(): void {
    const settings = ClaudeCodeInstaller.readSettings();
    if (!settings.hooks) return;

    for (const hookType of ["Stop", "SessionStart"] as const) {
      const entries = settings.hooks[hookType];
      if (!entries) continue;

      const filtered = entries.filter(
        (entry) =>
          !entry.hooks?.some((h) => typeof h.command === "string" && h.command.includes("ccpoke"))
      );

      if (filtered.length === 0) {
        delete settings.hooks[hookType];
      } else {
        settings.hooks[hookType] = filtered;
      }
    }

    if (Object.keys(settings.hooks).length === 0) {
      delete settings.hooks;
    }

    const tmpSettings = `${paths.claudeSettings}.tmp`;
    writeFileSync(tmpSettings, JSON.stringify(settings, null, 2));
    renameSync(tmpSettings, paths.claudeSettings);
  }

  private static readSettings(): ClaudeSettings {
    try {
      return JSON.parse(readFileSync(paths.claudeSettings, "utf-8"));
    } catch (err: unknown) {
      const isFileNotFound =
        err instanceof Error && (err as NodeJS.ErrnoException).code === "ENOENT";
      if (isFileNotFound) return {};
      throw err;
    }
  }
}
