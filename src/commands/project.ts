import { existsSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";

import * as p from "@clack/prompts";

import { ConfigManager } from "../config-manager.js";

export function runProject(args: string[]): void {
  const sub = args[0];

  switch (sub) {
    case "add":
      addProject(args.slice(1));
      break;
    case "list":
    case "ls":
      listProjects();
      break;
    case "remove":
    case "rm":
      removeProject(args.slice(1));
      break;
    default:
      p.log.error(sub ? `Unknown project subcommand: ${sub}` : "Missing subcommand");
      p.log.message("Usage: ccpoke project <add|list|remove>");
      process.exit(1);
  }
}

function addProject(args: string[]): void {
  let name: string | undefined;
  let rawPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && args[i + 1]) {
      name = args[++i];
    } else if (!rawPath) {
      rawPath = args[i];
    }
  }

  if (!rawPath) {
    p.log.error("Missing path. Usage: ccpoke project add <path> [--name <name>]");
    process.exit(1);
  }

  const fullPath = resolve(rawPath);

  if (!existsSync(fullPath) || !statSync(fullPath).isDirectory()) {
    p.log.error(`Path does not exist or is not a directory: ${fullPath}`);
    process.exit(1);
  }

  if (!name) {
    name = basename(fullPath);
  }

  const cfg = ConfigManager.load();

  if (cfg.projects.some((p) => p.name === name)) {
    p.log.warn(`Project "${name}" already registered. Remove it first to re-add.`);
    process.exit(1);
  }

  cfg.projects.push({ name, path: fullPath });
  ConfigManager.save(cfg);
  p.log.success(`Added project "${name}" → ${fullPath}`);
}

function listProjects(): void {
  const cfg = ConfigManager.load();

  if (cfg.projects.length === 0) {
    p.log.message("No projects registered. Use 'ccpoke project add <path>' to add one.");
    return;
  }

  p.intro("Registered Projects");
  for (const proj of cfg.projects) {
    p.log.message(`  ${proj.name}  →  ${proj.path}`);
  }
  p.outro(`${cfg.projects.length} project(s)`);
}

function removeProject(args: string[]): void {
  const name = args[0];
  if (!name) {
    p.log.error("Missing name. Usage: ccpoke project remove <name>");
    process.exit(1);
  }

  const cfg = ConfigManager.load();
  const idx = cfg.projects.findIndex((p) => p.name === name);

  if (idx === -1) {
    p.log.error(`Project "${name}" not found.`);
    process.exit(1);
  }

  cfg.projects.splice(idx, 1);
  ConfigManager.save(cfg);
  p.log.success(`Removed project "${name}"`);
}
