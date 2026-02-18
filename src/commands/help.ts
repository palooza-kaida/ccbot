import * as p from "@clack/prompts";
import { detectCliPrefix } from "../utils/install-detection.js";

export function runHelp(): void {
  const prefix = detectCliPrefix();

  p.intro("🤖 ccbot — Claude Code ↔ Telegram Notification Bot");

  p.log.message(
    [
      `Usage: ${prefix} [command]`,
      "",
      "Commands:",
      "  (none)      Start the bot",
      "  setup       Interactive setup (config + hooks)",
      "  update      Update ccbot to latest version",
      "  uninstall   Remove all ccbot data and hooks",
      "  help        Show this help message",
    ].join("\n"),
  );

  p.outro("docs → https://github.com/palooza-kaida/ccbot");
}
