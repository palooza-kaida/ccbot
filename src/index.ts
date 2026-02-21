#!/usr/bin/env node

import { ConfigManager, type Config } from "./config-manager.js";
import { TelegramChannel } from "./channel/telegram/telegram-channel.js";
import { HookServer } from "./hook/hook-server.js";
import { HookHandler } from "./hook/hook-handler.js";
import { runSetup } from "./commands/setup.js";
import { runUpdate } from "./commands/update.js";
import { runUninstall } from "./commands/uninstall.js";
import { runHelp } from "./commands/help.js";
import { CliCommand, InstallMethod } from "./utils/constants.js";
import { t } from "./i18n/index.js";
import { TunnelManager } from "./utils/tunnel.js";
import { log, logError } from "./utils/log.js";
import { detectInstallMethod } from "./utils/install-detection.js";

const args = process.argv.slice(2);

if (args.length > 0) {
  handleSubcommand(args);
} else {
  startBot();
}

async function loadOrSetupConfig(): Promise<Config> {
  try {
    return ConfigManager.load();
  } catch {
    log(t("bot.firstTimeSetup"));
    try {
      return await runSetup();
    } catch (err: unknown) {
      logError(t("common.setupFailed"), err);
      process.exit(1);
    }
  }
}

async function startBot(): Promise<void> {
  const cfg = await loadOrSetupConfig();

  const hookServer = new HookServer(cfg.hook_port, cfg.hook_secret);
  hookServer.start();
  log(`ccpoke: ${t("bot.started", { port: cfg.hook_port })}`);

  const tunnelManager = new TunnelManager();
  let tunnelUrl: string | null = null;
  try {
    tunnelUrl = await tunnelManager.start(cfg.hook_port);
    log(t("tunnel.started", { url: tunnelUrl }));
  } catch (err: unknown) {
    logError(t("tunnel.failed"), err);
  }

  const channel = new TelegramChannel(cfg, tunnelUrl);
  const handler = new HookHandler(channel, cfg.hook_port, tunnelManager);
  hookServer.setHandler(handler);

  await channel.initialize();

  if (detectInstallMethod() === InstallMethod.Npx) {
    log(t("bot.globalInstallTip"));
  }

  const shutdown = async () => {
    log(t("bot.shuttingDown"));
    tunnelManager.stop();
    await channel.shutdown();
    await hookServer.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function handleSubcommand(args: string[]): void {
  try {
    ConfigManager.load();
  } catch {
    // config not yet created, subcommands handle this
  }

  switch (args[0]) {
    case CliCommand.Setup:
      runSetup().catch((err: unknown) => {
        logError(t("common.setupFailed"), err);
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
      logError(t("common.unknownCommand", { command: args[0]! }));
      runHelp();
      process.exit(1);
  }
}
