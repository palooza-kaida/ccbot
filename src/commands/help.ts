import * as p from "@clack/prompts";
import { detectCliPrefix } from "../utils/install-detection.js";
import { t } from "../i18n/index.js";

export function runHelp(): void {
  const prefix = detectCliPrefix();

  p.intro(t("help.intro"));

  p.log.message(
    [
      t("help.usage", { prefix }),
      "",
      t("help.commands"),
      t("help.cmdNone"),
      t("help.cmdSetup"),
      t("help.cmdUpdate"),
      t("help.cmdUninstall"),
      t("help.cmdHelp"),
    ].join("\n"),
  );

  p.outro(t("help.docs"));
}
