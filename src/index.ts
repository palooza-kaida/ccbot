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

const args = process.argv.slice(2);

if (args.length > 0) {
  handleSubcommand(args);
} else {
  startBot();
}

function startBot(): void {
  const cfg = ConfigManager.load();
  const bot = new Bot(cfg);
  const handler = new HookHandler((text) => bot.sendNotification(text));
  const hookServer = new HookServer(cfg.hook_port, cfg.hook_secret, handler);

  hookServer.start();
  console.log(`ccbot: started (hook port: ${cfg.hook_port})`);
  bot.start();

  const shutdown = async () => {
    console.log("\nccbot: shutting down...");
    bot.stop();
    await hookServer.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

function handleSubcommand(args: string[]): void {
  switch (args[0]) {
    case "setup":
      runSetup().catch((err: unknown) => {
        console.error(`ccbot: setup failed: ${formatError(err)}`);
        process.exit(1);
      });
      break;

    case "update":
      runUpdate();
      break;

    case "uninstall":
      runUninstall();
      break;

    case "help":
    case "--help":
    case "-h":
      runHelp();
      break;

    default:
      console.error(`unknown command: ${args[0]}`);
      runHelp();
      process.exit(1);
  }
}
