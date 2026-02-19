import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { randomBytes } from "node:crypto";
import { type Locale, isValidLocale, setLocale } from "./i18n/index.js";
import { t } from "./i18n/index.js";

export interface Config {
  telegram_bot_token: string;
  user_id: number;
  hook_port: number;
  hook_secret: string;
  locale: Locale;
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
        throw new Error(t("config.notFound"));
      }
      throw new Error(t("config.readError", { error: err instanceof Error ? err.message : String(err) }));
    }

    const raw: unknown = JSON.parse(data);
    const cfg = ConfigManager.validate(raw);
    setLocale(cfg.locale);
    return cfg;
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
      throw new Error(t("config.mustBeObject"));
    }

    const obj = data as Record<string, unknown>;

    if (typeof obj.telegram_bot_token !== "string" || !obj.telegram_bot_token.includes(":")) {
      throw new Error(t("config.invalidToken"));
    }

    if (typeof obj.user_id !== "number" || !Number.isInteger(obj.user_id)) {
      throw new Error(t("config.invalidUserId"));
    }

    let hookPort = 9377;
    if (obj.hook_port !== undefined) {
      if (typeof obj.hook_port !== "number" || !Number.isInteger(obj.hook_port) || obj.hook_port < 1 || obj.hook_port > 65535) {
        throw new Error(t("config.invalidPort"));
      }
      hookPort = obj.hook_port;
    }

    let hookSecret: string;
    if (typeof obj.hook_secret === "string" && obj.hook_secret.length > 0) {
      if (!/^[a-f0-9]+$/i.test(obj.hook_secret)) {
        throw new Error(t("config.invalidSecret"));
      }
      hookSecret = obj.hook_secret;
    } else {
      hookSecret = ConfigManager.generateSecret();
    }

    const locale: Locale = isValidLocale(obj.locale) ? obj.locale : "en";

    const cfg: Config = {
      telegram_bot_token: obj.telegram_bot_token,
      user_id: obj.user_id,
      hook_port: hookPort,
      hook_secret: hookSecret,
      locale,
    };

    if (typeof obj.hook_secret !== "string" || obj.hook_secret.length === 0) {
      ConfigManager.save(cfg);
    }

    return cfg;
  }
}
