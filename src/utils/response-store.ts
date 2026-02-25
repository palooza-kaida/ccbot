import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { paths } from "./paths.js";
import { MAX_STORED_RESPONSES, RESPONSE_EXPIRE_MS, type GitChangeStatus } from "./constants.js";

export interface StoredResponse {
  id: string;
  agent: string;
  agentDisplayName: string;
  projectName: string;
  responseSummary: string;
  durationMs: number;
  gitChanges: Array<{ file: string; status: GitChangeStatus }>;
  inputTokens: number;
  outputTokens: number;
  model: string;
  timestamp: number;
}

const STORE_DIR = paths.responsesDir;

class ResponseStore {
  private responses = new Map<string, StoredResponse>();
  private initialized = false;

  private ensureInitialized(): void {
    if (this.initialized) return;
    this.initialized = true;
    mkdirSync(STORE_DIR, { recursive: true });
    this.loadFromDisk();
  }

  save(data: Omit<StoredResponse, "id" | "timestamp">): string {
    this.ensureInitialized();
    this.cleanup();
    let id: string;
    do {
      id = randomUUID().slice(0, 8);
    } while (this.responses.has(id));
    const entry: StoredResponse = { ...data, id, timestamp: Date.now() };
    this.responses.set(id, entry);
    this.persistToDisk(id, entry);
    return id;
  }

  get(id: string): StoredResponse | undefined {
    this.ensureInitialized();
    const entry = this.responses.get(id);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > RESPONSE_EXPIRE_MS) {
      this.responses.delete(id);
      this.removeFromDisk(id);
      return undefined;
    }
    return entry;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, entry] of this.responses) {
      if (now - entry.timestamp > RESPONSE_EXPIRE_MS) {
        this.responses.delete(id);
        this.removeFromDisk(id);
      }
    }

    if (this.responses.size >= MAX_STORED_RESPONSES) {
      const sorted = [...this.responses.entries()].sort((a, b) => b[1].timestamp - a[1].timestamp);
      const toRemove = sorted.slice(MAX_STORED_RESPONSES);
      for (const [id] of toRemove) {
        this.responses.delete(id);
        this.removeFromDisk(id);
      }
    }
  }

  private persistToDisk(id: string, entry: StoredResponse): void {
    try {
      writeFileSync(join(STORE_DIR, `${id}.json`), JSON.stringify(entry), { mode: 0o600 });
    } catch {
      // disk persistence is best-effort
    }
  }

  private removeFromDisk(id: string): void {
    try {
      unlinkSync(join(STORE_DIR, `${id}.json`));
    } catch {
      // file may already be removed
    }
  }

  private loadFromDisk(): void {
    try {
      const files = readdirSync(STORE_DIR).filter((f) => f.endsWith(".json"));
      const now = Date.now();

      for (const file of files) {
        try {
          const data = readFileSync(join(STORE_DIR, file), "utf-8");
          const entry: StoredResponse = JSON.parse(data);
          if (entry.id && now - entry.timestamp < RESPONSE_EXPIRE_MS) {
            this.responses.set(entry.id, entry);
          } else {
            this.removeFromDisk(entry.id || file.replace(".json", ""));
          }
        } catch {
          // skip corrupted entries
        }
      }
    } catch {
      // store directory may not exist yet
    }
  }
}

export const responseStore = new ResponseStore();
