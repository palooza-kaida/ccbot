import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { randomBytes } from "node:crypto";

export interface Config {
  telegram_bot_token: string;
  user_id: number;
  hook_port: number;
  hook_secret: string;
}

export class ConfigManager {
  private static readonly CONFIG_DIR = join(homedir(), ".ccbot");
  private static readonly CONFIG_FILE = join(ConfigManager.CONFIG_DIR, "config.json");

  static load(): Config {
    let data: string;
    try {
      data = readFileSync(ConfigManager.CONFIG_FILE, "utf-8");
    } catch (err: unknown) {
      if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error("config not found — run 'ccbot setup' first");
      }
      throw new Error(`read config: ${err instanceof Error ? err.message : String(err)}`);
    }

    const raw: unknown = JSON.parse(data);
    return ConfigManager.validate(raw);
  }

  static save(cfg: Config): void {
    mkdirSync(ConfigManager.CONFIG_DIR, { recursive: true });
    writeFileSync(ConfigManager.CONFIG_FILE, JSON.stringify(cfg, null, 2), { mode: 0o600 });
  }

  static isOwner(cfg: Config, userId: number): boolean {
    return cfg.user_id === userId;
  }

  static generateSecret(): string {
    return randomBytes(32).toString("hex");
  }

  private static validate(data: unknown): Config {
    if (typeof data !== "object" || data === null) {
      throw new Error("config must be a JSON object");
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.telegram_bot_token !== "string" || !obj.telegram_bot_token.includes(":")) {
      throw new Error("telegram_bot_token must be a string containing ':' — run 'ccbot setup'");
    }

    if (typeof obj.user_id !== "number" || !Number.isInteger(obj.user_id)) {
      throw new Error("user_id must be an integer — run 'ccbot setup'");
    }

    let hookPort = 9377;
    if (obj.hook_port !== undefined) {
      if (typeof obj.hook_port !== "number" || !Number.isInteger(obj.hook_port) || obj.hook_port < 1 || obj.hook_port > 65535) {
        throw new Error("hook_port must be an integer between 1 and 65535");
      }
      hookPort = obj.hook_port;
    }

    let hookSecret: string;
    if (typeof obj.hook_secret === "string" && obj.hook_secret.length > 0) {
      if (!/^[a-f0-9]+$/i.test(obj.hook_secret)) {
        throw new Error("hook_secret must contain only hex characters (a-f, 0-9)");
      }
      hookSecret = obj.hook_secret;
    } else {
      hookSecret = ConfigManager.generateSecret();
    }

    const cfg: Config = {
      telegram_bot_token: obj.telegram_bot_token,
      user_id: obj.user_id,
      hook_port: hookPort,
      hook_secret: hookSecret,
    };

    if (typeof obj.hook_secret !== "string" || obj.hook_secret.length === 0) {
      ConfigManager.save(cfg);
    }

    return cfg;
  }
}
