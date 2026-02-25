import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from "node:fs";
import { paths } from "../../utils/paths.js";
import { ApiRoute } from "../../utils/constants.js";
import { AgentName } from "../types.js";

interface CursorStopHook {
  command: string;
  timeout: number;
}

interface CursorHooksConfig {
  version?: number;
  hooks?: {
    stop?: CursorStopHook[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function hasCcpokeHook(stopHooks: CursorStopHook[]): boolean {
  return stopHooks.some(
    (entry) => typeof entry.command === "string" && entry.command.includes("ccpoke")
  );
}

export class CursorInstaller {
  static isInstalled(): boolean {
    try {
      if (!existsSync(paths.cursorHooksJson)) return false;

      const config = CursorInstaller.readConfig();
      return hasCcpokeHook(config.hooks?.stop ?? []);
    } catch {
      return false;
    }
  }

  static install(hookPort: number, hookSecret: string): void {
    mkdirSync(paths.cursorDir, { recursive: true });

    const config = CursorInstaller.readConfig();

    if (!config.hooks) config.hooks = {};
    const stopHooks = config.hooks.stop ?? [];

    if (hasCcpokeHook(stopHooks)) return;

    stopHooks.push({
      command: paths.cursorHookScript,
      timeout: 10,
    });

    config.hooks.stop = stopHooks;
    if (!config.version) config.version = 1;

    writeFileSync(paths.cursorHooksJson, JSON.stringify(config, null, 2));
    CursorInstaller.writeScript(hookPort, hookSecret);
  }

  static uninstall(): void {
    CursorInstaller.removeFromHooksJson();
    CursorInstaller.removeScript();
  }

  private static writeScript(hookPort: number, hookSecret: string): void {
    mkdirSync(paths.hooksDir, { recursive: true });

    const agentParam = `?agent=${AgentName.Cursor}`;
    const isWindows = process.platform === "win32";
    const script = isWindows
      ? `@echo off\ncurl -s -X POST http://localhost:${hookPort}${ApiRoute.HookStop}${agentParam} -H "Content-Type: application/json" -H "X-CCPoke-Secret: ${hookSecret}" --data-binary @- > nul 2>&1\n`
      : `#!/bin/bash\ncurl -s -X POST http://localhost:${hookPort}${ApiRoute.HookStop}${agentParam} \\\n  -H "Content-Type: application/json" \\\n  -H "X-CCPoke-Secret: ${hookSecret}" \\\n  --data-binary @- > /dev/null 2>&1 || true\n`;

    writeFileSync(paths.cursorHookScript, script, { mode: isWindows ? 0o644 : 0o700 });
  }

  private static removeScript(): void {
    try {
      unlinkSync(paths.cursorHookScript);
    } catch {
      // script file may not exist
    }
  }

  private static removeFromHooksJson(): void {
    if (!existsSync(paths.cursorHooksJson)) return;

    const config = CursorInstaller.readConfig();
    if (!config.hooks?.stop) return;

    const filtered = config.hooks.stop.filter(
      (entry) => !(typeof entry.command === "string" && entry.command.includes("ccpoke"))
    );

    if (filtered.length === 0) {
      delete config.hooks.stop;
    } else {
      config.hooks.stop = filtered;
    }

    if (Object.keys(config.hooks).length === 0) {
      delete config.hooks;
    }

    writeFileSync(paths.cursorHooksJson, JSON.stringify(config, null, 2));
  }

  private static readConfig(): CursorHooksConfig {
    try {
      return JSON.parse(readFileSync(paths.cursorHooksJson, "utf-8"));
    } catch (err: unknown) {
      const isFileNotFound =
        err instanceof Error && (err as NodeJS.ErrnoException).code === "ENOENT";
      if (isFileNotFound) return { version: 1, hooks: {} };
      throw err;
    }
  }
}
