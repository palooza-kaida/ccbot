import * as p from "@clack/prompts";
import TelegramBot from "node-telegram-bot-api";
import qrcode from "qrcode-terminal";
import { ConfigManager, type Config } from "../config-manager.js";
import { HookInstaller } from "../hook/hook-installer.js";
import { detectCliPrefix } from "../utils/install-detection.js";
import { t, setLocale, type Locale, SUPPORTED_LOCALES, LOCALE_LABELS } from "../i18n/index.js";
import { DEFAULT_HOOK_PORT, SETUP_WAIT_TIMEOUT_MS } from "../utils/constants.js";

export async function runSetup(): Promise<Config> {
  p.intro(t("setup.intro"));

  let existing: Config | null = null;
  try {
    existing = ConfigManager.load();
  } catch {
    // first-time setup
  }

  const locale = await promptLanguage(existing);
  setLocale(locale);

  const token = await promptToken(existing);
  const botUsername = await verifyToken(token);
  const userId = await waitForUserStart(token, botUsername);

  const config = buildConfig(token, userId, existing, locale);

  saveConfig(config);
  installHook(config);
  registerChatId(userId);

  const startCommand = detectCliPrefix();
  p.outro(t("setup.complete", { command: startCommand }));

  return config;
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

async function promptToken(existing: Config | null): Promise<string> {
  const result = await p.text({
    message: t("setup.tokenMessage"),
    placeholder: t("setup.tokenPlaceholder"),
    initialValue: existing?.telegram_bot_token ?? "",
    validate(value) {
      if (!value || !value.trim()) return t("setup.tokenRequired");
      if (!value.includes(":")) return t("setup.tokenInvalidFormat");
    },
  });

  if (p.isCancel(result)) {
    p.cancel(t("setup.cancelled"));
    process.exit(0);
  }

  return result.trim();
}

async function verifyToken(token: string): Promise<string> {
  const spinner = p.spinner();
  spinner.start(t("setup.verifyingToken"));

  try {
    const bot = new TelegramBot(token);
    const me = await bot.getMe();

    spinner.stop(t("setup.botVerified", { username: me.username ?? "unknown" }));
    return me.username ?? "unknown";
  } catch {
    spinner.stop(t("setup.tokenVerifyFailed"));
    throw new Error(t("setup.tokenVerifyFailed"));
  }
}

async function waitForUserStart(token: string, botUsername: string): Promise<number> {
  const deepLink = `https://t.me/${botUsername}?start=setup`;

  p.log.step(t("setup.scanOrClick"));

  const qrString = await new Promise<string>((resolve) => {
    qrcode.generate(deepLink, { small: true }, (code: string) => {
      resolve(code);
    });
  });

  const indentedQr = qrString
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => `│    ${line}`)
    .join("\n");

  // eslint-disable-next-line no-console
  console.log(indentedQr);
  // eslint-disable-next-line no-console
  console.log(`│`);
  // eslint-disable-next-line no-console
  console.log(`│    ${deepLink}`);

  p.log.step(t("setup.waitingForStart"));

  const bot = new TelegramBot(token, { polling: true });

  try {
    const userId = await new Promise<number>((resolve, reject) => {
      const timeout = setTimeout(() => {
        bot.stopPolling();
        reject(new Error(t("setup.waitingTimeout", { seconds: SETUP_WAIT_TIMEOUT_MS / 1000 })));
      }, SETUP_WAIT_TIMEOUT_MS);

      bot.onText(/\/start(?:\s|$)/, (msg) => {
        clearTimeout(timeout);

        bot
          .sendMessage(msg.chat.id, t("setup.userDetected", { userId: msg.from!.id }))
          .finally(() => {
            bot.stopPolling();
            resolve(msg.from!.id);
          });
      });
    });

    p.log.success(t("setup.userDetected", { userId }));
    return userId;
  } catch (err) {
    bot.stopPolling();
    throw err;
  }
}

function buildConfig(
  token: string,
  userId: number,
  existing: Config | null,
  locale: Locale
): Config {
  return {
    telegram_bot_token: token,
    user_id: userId,
    hook_port: existing?.hook_port || DEFAULT_HOOK_PORT,
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
    p.log.error(t("setup.hookFailed", { error: err instanceof Error ? err.message : String(err) }));
    throw err;
  }
}

function registerChatId(userId: number): void {
  const state = ConfigManager.loadChatState();

  if (state.chat_id === userId) {
    return;
  }

  state.chat_id = userId;
  ConfigManager.saveChatState(state);
  p.log.success(t("setup.chatIdRegistered"));
}
