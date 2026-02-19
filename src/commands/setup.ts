import * as p from "@clack/prompts";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { ConfigManager, type Config } from "../config-manager.js";
import { HookInstaller } from "../hook/hook-installer.js";
import { detectCliPrefix } from "../utils/install-detection.js";
import { formatError } from "../utils/error-utils.js";
import { t, setLocale, type Locale, SUPPORTED_LOCALES, LOCALE_LABELS } from "../i18n/index.js";

export async function runSetup(): Promise<void> {
  p.intro(t("setup.intro"));

  let existing: Config | null = null;
  try {
    existing = ConfigManager.load();
  } catch {}

  const locale = await promptLanguage(existing);
  setLocale(locale);

  const credentials = await promptCredentials(existing);
  const config = buildConfig(credentials, existing, locale);

  saveConfig(config);
  installHook(config);
  registerChatId(config.user_id);

  const startCommand = detectCliPrefix();

  p.outro(t("setup.complete", { command: startCommand }));
}

async function promptLanguage(existing: Config | null): Promise<Locale> {
  const result = await p.select({
    message: t("setup.languageMessage"),
    initialValue: existing?.locale ?? "en",
    options: SUPPORTED_LOCALES.map((loc) => ({
      value: loc,
      label: LOCALE_LABELS[loc],
    })),
  });

  if (p.isCancel(result)) {
    p.cancel(t("setup.cancelled"));
    process.exit(0);
  }

  return result;
}

interface Credentials {
  token: string;
  userId: number;
}

async function promptCredentials(existing: Config | null): Promise<Credentials> {
  const result = await p.group(
    {
      token: () =>
        p.text({
          message: t("setup.tokenMessage"),
          placeholder: t("setup.tokenPlaceholder"),
          initialValue: existing?.telegram_bot_token ?? "",
          validate(value) {
            if (!value || !value.trim()) return t("setup.tokenRequired");
            if (!value.includes(":")) return t("setup.tokenInvalidFormat");
          },
        }),
      userId: () =>
        p.text({
          message: t("setup.userIdMessage"),
          placeholder: t("setup.userIdPlaceholder"),
          initialValue: existing?.user_id?.toString() ?? "",
          validate(value) {
            if (!value || !value.trim()) return t("setup.userIdRequired");
            if (isNaN(parseInt(value, 10))) return t("setup.userIdMustBeNumber");
          },
        }),
    },
    {
      onCancel: () => {
        p.cancel(t("setup.cancelled"));
        process.exit(0);
      },
    },
  );

  return {
    token: result.token.trim(),
    userId: parseInt(result.userId.trim(), 10),
  };
}

function buildConfig(credentials: Credentials, existing: Config | null, locale: Locale): Config {
  return {
    telegram_bot_token: credentials.token,
    user_id: credentials.userId,
    hook_port: existing?.hook_port || 9377,
    hook_secret: existing?.hook_secret || ConfigManager.generateSecret(),
    locale,
  };
}

function saveConfig(config: Config): void {
  ConfigManager.save(config);
  p.log.success(t("setup.configSaved"));
}

function installHook(config: Config): void {
  if (HookInstaller.isInstalled()) {
    p.log.step(t("setup.hookAlreadyInstalled"));
    return;
  }

  try {
    HookInstaller.install(config.hook_port, config.hook_secret);
    p.log.success(t("setup.hookInstalled"));
  } catch (err: unknown) {
    const msg = formatError(err);
    p.log.error(t("setup.hookFailed", { error: msg }));
    throw new Error(`install hook: ${msg}`);
  }
}

function registerChatId(userId: number): void {
  const stateDir = join(homedir(), ".ccbot");
  const stateFile = join(stateDir, "state.json");

  interface BotState {
    chat_id: number | null;
  }

  let state: BotState = { chat_id: null };
  try {
    const data = readFileSync(stateFile, "utf-8");
    state = JSON.parse(data);
  } catch {}

  if (state.chat_id === userId) {
    return;
  }

  state.chat_id = userId;
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(stateFile, JSON.stringify(state, null, 2), { mode: 0o600 });
  p.log.success(t("setup.chatIdRegistered"));
}
