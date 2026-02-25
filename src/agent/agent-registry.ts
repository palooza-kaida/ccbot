import { ClaudeCodeProvider } from "./claude-code/claude-code-provider.js";
import { CursorProvider } from "./cursor/cursor-provider.js";
import type { AgentProvider } from "./types.js";

export class AgentRegistry {
  private providers = new Map<string, AgentProvider>();

  register(provider: AgentProvider): void {
    this.providers.set(provider.name, provider);
  }

  resolve(name: string): AgentProvider | undefined {
    return this.providers.get(name);
  }

  all(): AgentProvider[] {
    return [...this.providers.values()];
  }

  detectInstalled(): AgentProvider[] {
    return this.all().filter((p) => p.detect());
  }
}

export function createDefaultRegistry(): AgentRegistry {
  const registry = new AgentRegistry();
  registry.register(new ClaudeCodeProvider());
  registry.register(new CursorProvider());
  return registry;
}
