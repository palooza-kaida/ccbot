#!/usr/bin/env node

import { ConfigManager } from "./config-manager.js";
import { Bot } from "./telegram/bot.js";
import { HookServer } from "./hook/hook-server.js";
import { HookHandler } from "./hook/hook-handler.js";
import { runSetup } from "./commands/setup.js";
import { runUpdate } from "./commands/update.js";
import { runUninstall } from "./commands/uninstall.js";
import { runHelp } from "./commands/help.js";
import { formatError } from "./utils/error-utils.js";
import { CliCommand } from "./utils/constants.js";
import { t } from "./i18n/index.js";

const args = process.argv.slice(2);

if (args.length > 0) {
  handleSubcommand(args);
} else {
  startBot();
}

async function startBot(): Promise<void> {
  const cfg = ConfigManager.load();
  const bot = new Bot(cfg);
  const handler = new HookHandler((text) => bot.sendNotification(text));
  const hookServer = new HookServer(cfg.hook_port, cfg.hook_secret, handler);

  hookServer.start();
  console.log(t("bot.started", { port: cfg.hook_port }));
  await bot.start();

  const shutdown = async () => {
    console.log(`\n${t("bot.shuttingDown")}`);
    await bot.stop();
    await hookServer.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function handleSubcommand(args: string[]): void {
  tryLoadLocale();

  switch (args[0]) {
    case CliCommand.Setup:
      runSetup().catch((err: unknown) => {
        console.error(t("common.setupFailed", { error: formatError(err) }));
        process.exit(1);
      });
      break;

    case CliCommand.Update:
      runUpdate();
      break;

    case CliCommand.Uninstall:
      runUninstall();
      break;

    case CliCommand.Help:
    case CliCommand.HelpFlag:
    case CliCommand.HelpShort:
      runHelp();
      break;

    default:
      console.error(t("common.unknownCommand", { command: args[0] }));
      runHelp();
      process.exit(1);
  }
}

function tryLoadLocale(): void {
  try {
    ConfigManager.load();
  } catch {}
}
