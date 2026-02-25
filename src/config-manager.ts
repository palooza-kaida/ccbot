import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";

import { isValidLocale, Locale, setLocale, t } from "./i18n/index.js";
import { DEFAULT_HOOK_PORT } from "./utils/constants.js";
import { paths } from "./utils/paths.js";

export interface Config {
  telegram_bot_token: string;
  user_id: number;
  hook_port: number;
  hook_secret: string;
  locale: Locale;
  agents: string[];
}

export interface ChatState {
  chat_id: number | null;
}

export class ConfigManager {
  static load(): Config {
    let data: string;
    try {
      data = readFileSync(paths.configFile, "utf-8");
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        "code" in err &&
        (err as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        throw new Error(t("config.notFound"), { cause: err });
      }
      throw err;
    }

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(data);
    } catch (err: unknown) {
      throw new Error(t("config.invalidJson"), { cause: err });
    }
    const cfg = ConfigManager.validate(raw);
    if (cfg.hook_secret !== raw.hook_secret || !raw.agents) {
      ConfigManager.save(cfg);
    }
    setLocale(cfg.locale);
    return cfg;
  }

  static save(cfg: Config): void {
    mkdirSync(paths.ccpokeDir, { recursive: true });
    const tmpPath = `${paths.configFile}.tmp`;
    writeFileSync(tmpPath, JSON.stringify(cfg, null, 2), { mode: 0o600 });
    renameSync(tmpPath, paths.configFile);
  }

  static isOwner(cfg: Config, userId: number): boolean {
    return cfg.user_id === userId;
  }

  static generateSecret(): string {
    return randomBytes(32).toString("hex");
  }

  static loadChatState(): ChatState {
    try {
      const data = readFileSync(paths.stateFile, "utf-8");
      return JSON.parse(data);
    } catch {
      return { chat_id: null };
    }
  }

  static saveChatState(state: ChatState): void {
    mkdirSync(paths.ccpokeDir, { recursive: true });
    const tmpPath = `${paths.stateFile}.tmp`;
    writeFileSync(tmpPath, JSON.stringify(state, null, 2), { mode: 0o600 });
    renameSync(tmpPath, paths.stateFile);
  }

  private static validate(data: Record<string, unknown>): Config {
    if (typeof data !== "object" || data === null) {
      throw new Error(t("config.mustBeObject"));
    }

    if (typeof data.telegram_bot_token !== "string" || !data.telegram_bot_token.includes(":")) {
      throw new Error(t("config.invalidToken"));
    }

    if (typeof data.user_id !== "number" || !Number.isInteger(data.user_id)) {
      throw new Error(t("config.invalidUserId"));
    }

    let hookPort = DEFAULT_HOOK_PORT;
    if (data.hook_port !== undefined) {
      if (
        typeof data.hook_port !== "number" ||
        !Number.isInteger(data.hook_port) ||
        data.hook_port < 1 ||
        data.hook_port > 65535
      ) {
        throw new Error(t("config.invalidPort"));
      }
      hookPort = data.hook_port;
    }

    let hookSecret: string;
    if (typeof data.hook_secret === "string" && data.hook_secret.length > 0) {
      if (!/^[a-f0-9]+$/i.test(data.hook_secret)) {
        throw new Error(t("config.invalidSecret"));
      }
      hookSecret = data.hook_secret;
    } else {
      hookSecret = ConfigManager.generateSecret();
    }

    const locale: Locale = isValidLocale(data.locale) ? data.locale : Locale.EN;

    let agents: string[] = ["claude-code"];
    if (Array.isArray(data.agents) && data.agents.length > 0) {
      agents = data.agents.filter((a): a is string => typeof a === "string");
    }

    const cfg: Config = {
      telegram_bot_token: data.telegram_bot_token,
      user_id: data.user_id,
      hook_port: hookPort,
      hook_secret: hookSecret,
      locale,
      agents,
    };

    return cfg;
  }
}
