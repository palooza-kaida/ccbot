import * as p from "@clack/prompts";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { ConfigManager, type Config } from "../config-manager.js";
import { HookInstaller } from "../hook/hook-installer.js";
import { detectCliPrefix } from "../utils/install-detection.js";
import { formatError } from "../utils/error-utils.js";

export async function runSetup(): Promise<void> {
  p.intro("🤖 ccbot setup");

  let existing: Config | null = null;
  try {
    existing = ConfigManager.load();
  } catch {}

  const credentials = await promptCredentials(existing);
  const config = buildConfig(credentials, existing);

  saveConfig(config);
  installHook(config);
  registerChatId(config.user_id);

  const startCommand = detectCliPrefix();

  p.outro(`🎉 Setup complete!\n\n  Next steps:\n  1. Start bot:  ${startCommand}\n  2. Use Claude Code normally → notifications will arrive`);
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
          message: "Telegram Bot Token",
          placeholder: "Get from @BotFather → /newbot",
          initialValue: existing?.telegram_bot_token ?? "",
          validate(value) {
            if (!value || !value.trim()) return "Bot token is required";
            if (!value.includes(":")) return "Invalid format (expected: 123456:ABC-xxx)";
          },
        }),
      userId: () =>
        p.text({
          message: "Your Telegram User ID",
          placeholder: "Send /start to @userinfobot",
          initialValue: existing?.user_id?.toString() ?? "",
          validate(value) {
            if (!value || !value.trim()) return "User ID is required";
            if (isNaN(parseInt(value, 10))) return "Must be a number";
          },
        }),
    },
    {
      onCancel: () => {
        p.cancel("Setup cancelled.");
        process.exit(0);
      },
    },
  );

  return {
    token: result.token.trim(),
    userId: parseInt(result.userId.trim(), 10),
  };
}

function buildConfig(credentials: Credentials, existing: Config | null): Config {
  return {
    telegram_bot_token: credentials.token,
    user_id: credentials.userId,
    hook_port: existing?.hook_port || 9377,
    hook_secret: existing?.hook_secret || ConfigManager.generateSecret(),
  };
}

function saveConfig(config: Config): void {
  ConfigManager.save(config);
  p.log.success("Config saved");
}

function installHook(config: Config): void {
  try {
    HookInstaller.install(config.hook_port, config.hook_secret);
    p.log.success("Hook installed → ~/.claude/settings.json");
  } catch (err: unknown) {
    const msg = formatError(err);
    if (msg.includes("already installed")) {
      p.log.step("Hook already installed");
    } else {
      p.log.error(`Hook installation failed: ${msg}`);
      throw new Error(`install hook: ${msg}`);
    }
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
  p.log.success("Chat ID registered");
}
