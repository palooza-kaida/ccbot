import { readFileSync, writeFileSync, mkdirSync, unlinkSync, rmdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export class HookInstaller {
  private static readonly HOOKS_DIR = join(homedir(), ".ccbot", "hooks");
  private static readonly SCRIPT_PATH = join(HookInstaller.HOOKS_DIR, "stop-notify.sh");
  private static readonly SETTINGS_PATH = join(homedir(), ".claude", "settings.json");

  static install(hookPort: number, hookSecret: string): void {
    if (!Number.isInteger(hookPort) || hookPort < 1 || hookPort > 65535) {
      throw new Error(`invalid hook port: ${hookPort} (must be 1-65535)`);
    }

    const settings = HookInstaller.readSettings();

    const hooks: Record<string, unknown> = (settings.hooks ?? {}) as Record<string, unknown>;
    const existingStop = (hooks.Stop ?? []) as Array<Record<string, unknown>>;

    const alreadyInstalled = existingStop.some((entry) => {
      const entryHooks = entry.hooks as Array<Record<string, unknown>> | undefined;
      return entryHooks?.some((h) => typeof h.command === "string" && (h.command as string).includes("ccbot"));
    });

    if (alreadyInstalled) {
      throw new Error("ccbot hook already installed");
    }

    existingStop.push({
      hooks: [{ type: "command", command: HookInstaller.SCRIPT_PATH, timeout: 10 }],
    });

    hooks.Stop = existingStop;
    settings.hooks = hooks;

    mkdirSync(join(homedir(), ".claude"), { recursive: true });
    writeFileSync(HookInstaller.SETTINGS_PATH, JSON.stringify(settings, null, 2));

    HookInstaller.installScript(hookPort, hookSecret);
  }

  static uninstall(): void {
    HookInstaller.removeFromSettings();
    HookInstaller.removeScript();
  }

  private static installScript(hookPort: number, hookSecret: string): void {
    mkdirSync(HookInstaller.HOOKS_DIR, { recursive: true });

    const script = `#!/bin/bash
curl -s -X POST http://localhost:${hookPort}/hook/stop \\
  -H "Content-Type: application/json" \\
  -H "X-CCBot-Secret: ${hookSecret}" \\
  --data-binary @- > /dev/null 2>&1 || true
`;

    writeFileSync(HookInstaller.SCRIPT_PATH, script, { mode: 0o755 });
  }

  private static removeScript(): void {
    try {
      unlinkSync(HookInstaller.SCRIPT_PATH);
    } catch {}

    try {
      rmdirSync(HookInstaller.HOOKS_DIR);
    } catch {}
  }

  private static removeFromSettings(): void {
    let data: string;
    try {
      data = readFileSync(HookInstaller.SETTINGS_PATH, "utf-8");
    } catch {
      return;
    }

    const settings: Record<string, unknown> = JSON.parse(data);
    const hooks = settings.hooks as Record<string, unknown> | undefined;
    if (!hooks) return;

    const existingStop = hooks.Stop as Array<Record<string, unknown>> | undefined;
    if (!existingStop) return;

    const filtered = existingStop.filter((entry) => {
      const entryHooks = entry.hooks as Array<Record<string, unknown>> | undefined;
      return !entryHooks?.some((h) => typeof h.command === "string" && (h.command as string).includes("ccbot"));
    });

    if (filtered.length === 0) {
      delete hooks.Stop;
    } else {
      hooks.Stop = filtered;
    }

    if (Object.keys(hooks).length === 0) {
      delete settings.hooks;
    }

    writeFileSync(HookInstaller.SETTINGS_PATH, JSON.stringify(settings, null, 2));
  }

  private static readSettings(): Record<string, unknown> {
    try {
      const data = readFileSync(HookInstaller.SETTINGS_PATH, "utf-8");
      return JSON.parse(data);
    } catch (err: unknown) {
      if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
        return {};
      }
      throw new Error(`read settings: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
