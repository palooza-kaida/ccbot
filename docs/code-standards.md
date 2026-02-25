# Code Standards

This document defines the TypeScript/Node.js conventions, design patterns, and best practices used throughout the ccpoke project.

---

## Language & Build

### TypeScript Configuration

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "NodeNext",
    "verbatimModuleSyntax": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist"
  }
}
```

**Key Points:**
- **Target:** ES2022 for modern JavaScript features
- **Module:** ESNext with `verbatimModuleSyntax` for strict ESM compliance
- **Strict Mode:** Enabled for type safety
- **Node resolution:** NodeNext for accurate module resolution

---

## File Naming

**Convention:** kebab-case for all TypeScript files

**Pattern:** `{module}-{responsibility}.ts`

**Examples:**
```
agent-handler.ts
claude-code-parser.ts
telegram-sender.ts
tmux-bridge.ts
git-collector.ts
install-detection.ts
```

**Benefits:**
- Readable in terminal tooling (Glob, grep)
- Self-documenting purpose
- Easy to scan file lists

---

## File Organization

**Maximum File Size:** 200 LOC per file

**Split Strategy:**
1. When approaching 200 LOC, identify semantic boundaries
2. Extract related functions into separate file
3. Keep interfaces in types files
4. One primary responsibility per file

**Example: Splitting large modules**
```
BEFORE (400 LOC):
telegram-channel.ts (handlers + formatting + lifecycle)

AFTER (modular):
telegram-bot.ts (lifecycle, initialization)
telegram-handlers.ts (message handling)
telegram-formatter.ts (notification formatting)
```

---

## Naming Conventions

### Files
```typescript
kebab-case.ts
claude-code-provider.ts
telegram-sender.ts
```

### Classes & Types
```typescript
class TelegramChannel { }
interface AgentProvider { }
type AgentEventResult = { /* ... */ }
enum HookEventType { STOP, TASK_COMPLETED }
```

### Functions & Variables
```typescript
function parseEvent(raw: unknown): AgentEventResult { }
const configManager = new ConfigManager();
let sessionCount = 0;
```

### Constants
```typescript
const DEFAULT_HOOK_PORT = 9377;
const HOOK_SECRET_HEADER = 'X-CCPoke-Secret';
const TELEGRAM_API_TIMEOUT_MS = 30000;
```

### Private Members
```typescript
class Service {
  private _config: Config;
  private _logger: Logger;

  _internalHelper() { }  // Convention: underscore prefix
}
```

### Directories
```
kebab-case/
agent/
channel/
commands/
tmux/
utils/
```

---

## Import & Export Style

**ESM Module Pattern:**

```typescript
// ✅ Good: Named imports, specific
import { AgentProvider, AgentEventResult } from './types.js';
import { parseTranscript } from './parser.js';

// ✅ Good: Default export for classes
export default class TelegramChannel { }

// ✅ Good: Re-export interfaces from index
export { AgentProvider } from './types.js';
export { AgentRegistry } from './registry.js';

// ❌ Avoid: Wildcard imports in production code
import * as Parser from './parser.js';

// ❌ Avoid: Default + named from same module
import { x } from './module.js';
import Module from './module.js';
```

**Path Aliases:** Not used. Prefer relative imports for clarity:
```typescript
import { parseEvent } from '../agent/parser.js';
import { ConfigManager } from '../../config-manager.js';
```

**File Extensions:** Always include `.js` in relative imports
```typescript
import { logger } from './log.js';  // ✅ Explicit
import { logger } from './log';     // ❌ Implicit
```

---

## Design Patterns

### 1. Provider Pattern (Agents)

**Purpose:** Abstract agent implementations.

```typescript
interface AgentProvider {
  readonly name: string;
  detect(): Promise<boolean>;
  installHook(config: HookConfig): Promise<void>;
  parseEvent(raw: unknown): AgentEventResult;
}

class ClaudeCodeProvider implements AgentProvider {
  readonly name = 'Claude Code';
  async detect(): Promise<boolean> { /* ... */ }
}
```

**Benefits:**
- Add new agents without modifying core
- Pluggable architecture
- Testable in isolation

### 2. Adapter Pattern (Channels)

**Purpose:** Abstract notification channels.

```typescript
interface NotificationChannel {
  initialize(config: Config): Promise<void>;
  shutdown(): Promise<void>;
  sendNotification(event: AgentEvent): Promise<void>;
}

class TelegramChannel implements NotificationChannel { }
```

**Benefits:**
- Support multiple channels (Telegram, Discord, Slack)
- Core logic channels-agnostic
- Easy testing with mock channels

### 3. Bridge Pattern (Tmux Operations)

**Purpose:** Separate high-level operations from low-level CLI.

```typescript
// Low-level (Bridge)
class TmuxBridge {
  async sendKeys(target: string, keys: string): Promise<void> { }
  async capturePane(target: string): Promise<string> { }
}

// High-level (Client)
class SessionState {
  constructor(private bridge: TmuxBridge) { }
  async injectMessage(message: string): Promise<void> {
    await this.bridge.sendKeys(this.target, message);
  }
}
```

**Benefits:**
- Testable (mock bridge)
- Clear separation of concerns
- Reusable low-level operations

### 4. Observer Pattern (Session Lifecycle)

**Purpose:** React to session state changes.

```typescript
class SessionMap extends EventEmitter {
  private _sessions: Map<string, TmuxSession> = new Map();

  startSession(session: TmuxSession) {
    this._sessions.set(session.id, session);
    this.emit('session_started', session);  // Observers notified
  }
}
```

**Benefits:**
- Decoupled components
- Multiple listeners possible
- Clean event-driven architecture

### 5. State Machine (Session Status)

**Purpose:** Enforce valid session state transitions.

```typescript
type SessionStatus = 'idle' | 'waiting_input' | 'busy';

class SessionState {
  private status: SessionStatus = 'idle';

  async startProcessing(): Promise<void> {
    if (this.status !== 'idle') throw new Error('Invalid state');
    this.status = 'busy';
    // ...
    this.status = 'idle';
  }
}
```

**Valid Transitions:**
```
idle ──→ waiting_input ──→ busy ──→ idle
```

### 6. Store Pattern (Persistence)

**Purpose:** Centralized state with persistence.

```typescript
class ConfigManager {
  private _config: Config;

  load(): Config {
    this._config = loadFromFile('~/.ccpoke/config.json');
    return this._config;
  }

  save(config: Config): void {
    this._config = config;
    writeToFile('~/.ccpoke/config.json', config);
  }
}
```

**Implementations:**
- **ConfigManager** — User configuration
- **SessionMap** — Session registry
- **ResponseStore** — Responses by session ID

---

## Type Safety

### Strict Mode Rules

**Use explicit types:**
```typescript
// ✅ Good
const config: Config = loadConfig();
function parseEvent(raw: unknown): AgentEventResult { }

// ❌ Avoid
const config = loadConfig();  // Implicit any
function parseEvent(raw: any) { }  // Explicit any
```

**Define interfaces for objects:**
```typescript
// ✅ Good
interface HookConfig {
  port: number;
  secret: string;
  endpoint: string;
}

// ❌ Avoid
function setupHook(config: any) { }
const config = { port: 9377, secret: 'x' };
```

**Use discriminated unions for variants:**
```typescript
// ✅ Good
type AgentEventResult =
  | { type: 'response'; content: string }
  | { type: 'thinking'; duration: number };

// ❌ Avoid
interface AgentEventResult {
  type: string;
  content?: string;
  duration?: number;
}
```

---

## Error Handling

### Try-Catch Pattern

```typescript
// ✅ Good: Type error, log context
try {
  await agent.parseEvent(raw);
} catch (error) {
  logger.error('Failed to parse agent event', {
    error: error instanceof Error ? error.message : String(error),
    agent: agent.name,
    raw: typeof raw,
  });
  throw new ParseError(`Agent ${agent.name} failed`, { cause: error });
}

// ❌ Avoid: Silent failure
try {
  await operation();
} catch (error) {
  console.log('error');  // Vague, not structured
}

// ❌ Avoid: Re-throw bare error
catch (error) {
  throw error;  // Loss of context
}
```

### Error Types

```typescript
class ConfigError extends Error {
  constructor(message: string, public readonly config?: unknown) {
    super(message);
    this.name = 'ConfigError';
  }
}

class ParseError extends Error {
  constructor(message: string, public readonly context: Record<string, unknown>) {
    super(message);
    this.name = 'ParseError';
  }
}
```

### Async Error Handling

```typescript
// ✅ Good: Handle promise rejection
async function start() {
  try {
    await Promise.all([
      agent.initialize(),
      channel.initialize(),
      server.start(),
    ]);
  } catch (error) {
    logger.error('Startup failed', { error });
    process.exit(1);
  }
}

// ❌ Avoid: Unhandled promise rejection
Promise.all([...])
  .then(() => logger.info('Started'))
  .catch(console.error);  // Not structured
```

---

## Logging Standards

**Library:** Built-in or structured logger

**Levels:**
- **debug** — Development-only, verbose details
- **info** — Informational, normal operation
- **warn** — Warning, recoverable issue
- **error** — Error, operation failed

**Pattern:**
```typescript
logger.info('Session started', {
  sessionId: session.id,
  project: session.project,
  duration: elapsed,
});

logger.error('Hook verification failed', {
  error: error.message,
  secret: '[redacted]',  // Never log secrets
  endpoint: req.url,
});
```

**Never log:**
- API tokens, secrets, credentials
- Personal user data (full Telegram IDs in detail)
- Sensitive file paths

---

## Async/Await Rules

**Always use async/await, not .then()**

```typescript
// ✅ Good
async function main() {
  const config = await loadConfig();
  await initialize(config);
}

// ❌ Avoid
function main() {
  return loadConfig()
    .then(config => initialize(config));
}
```

**Error handling with async:**

```typescript
// ✅ Good
async function process() {
  try {
    await operation1();
    await operation2();
  } catch (error) {
    logger.error('Process failed', { error });
  }
}

// ❌ Avoid
async function process() {
  await operation1().catch(e => logger.error(e));
  await operation2().catch(e => logger.error(e));
}
```

---

## Testing Strategy

### Unit Tests (Agent Parsers)

```typescript
describe('ClaudeCodeParser', () => {
  it('should parse NDJSON transcript', () => {
    const parser = new ClaudeCodeParser();
    const events = parser.parse(transcriptNDJSON);
    expect(events).toHaveLength(3);
    expect(events[0].type).toBe('response');
  });
});
```

### Integration Tests (Hook Flow)

```typescript
describe('Hook Integration', () => {
  it('should convert hook event to notification', async () => {
    const handler = new AgentHandler(registry, channel);
    await handler.handleHookEvent({
      agent: 'claude-code',
      transcript: testTranscript,
    });
    expect(channel.sendNotification).toHaveBeenCalled();
  });
});
```

### Test Coverage

**Target:** 80%+ for core logic (parsers, handlers, formatters)

**Exclude:** CLI prompts, Telegram bot lifecycle (hard to mock)

---

## Linting & Formatting

### ESLint Config

```javascript
export default [
  {
    files: ['src/**/*.ts'],
    rules: {
      'prefer-const': 'error',
      'no-var': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-types': 'warn',
    },
  },
];
```

**Key Rules:**
- Enforce `const`, disallow `var`
- Disallow `any` type
- Require function return types

### Prettier Config

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "quoteProps": "as-needed",
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Key Settings:**
- 2-space indentation
- Double quotes for strings
- Trailing commas (ES5 compatible)
- LF line endings

### Pre-Commit Hook

Runs linting on staged files:
```bash
pnpm lint:staged
```

Blocks commit if linting fails. Fix with:
```bash
pnpm format
```

---

## Documentation Comments

**Use JSDoc for public APIs:**

```typescript
/**
 * Parses a Claude Code NDJSON transcript.
 * @param transcriptPath - Path to transcript file
 * @returns Array of parsed events
 * @throws {ParseError} If transcript is malformed
 */
export async function parseTranscript(transcriptPath: string): Promise<AgentEvent[]> {
  // ...
}

/**
 * Session state machine for managing message queue and injection.
 * @example
 * const state = new SessionState(session, bridge);
 * await state.injectMessage('hello');
 */
export class SessionState {
  // ...
}
```

**Avoid over-documentation:**
```typescript
// ❌ Avoid: Obvious comments
const name = 'Claude Code';  // The name is Claude Code

// ✅ Good: Explain why, not what
const name = 'Claude Code';  // Agent name for logging and user display
```

---

## Security Best Practices

### Secrets Management

**Never hardcode secrets:**
```typescript
// ❌ Bad
const TOKEN = 'xoxb-123456789';

// ✅ Good
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) throw new Error('TELEGRAM_BOT_TOKEN not set');
```

**Redact in logs:**
```typescript
logger.info('Sending request', {
  token: '[redacted]',
  endpoint: url,
});
```

### Input Validation

```typescript
// ✅ Good: Validate and sanitize
function handleUserMessage(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty message');
  if (trimmed.length > 4096) throw new Error('Message too long');
  return trimmed;
}
```

### Rate Limiting

```typescript
// ✅ Good: Prevent abuse
class RateLimiter {
  private _requests: Map<string, number[]> = new Map();

  isAllowed(userId: string, limit: number): boolean {
    const now = Date.now();
    const userRequests = this._requests.get(userId) ?? [];
    const recent = userRequests.filter((t) => now - t < 60000);
    return recent.length < limit;
  }
}
```

---

## Performance Guidelines

### Lazy Loading

```typescript
// ✅ Good: Load only when needed
const agents = [
  () => import('./claude-code-provider.js'),
  () => import('./cursor-provider.js'),
];

async function loadProviders() {
  return Promise.all(agents.map((loader) => loader()));
}
```

### Caching

```typescript
// ✅ Good: Cache expensive operations
class SessionMap {
  private _cache: Map<string, TmuxSession> = new Map();
  private _cacheExpiry = 30000;  // 30 seconds

  async getSession(id: string): Promise<TmuxSession | null> {
    if (this._cache.has(id)) {
      return this._cache.get(id) ?? null;
    }
    const session = await this._fetch(id);
    this._cache.set(id, session);
    return session;
  }
}
```

### Cleanup

```typescript
// ✅ Good: Cleanup resources
class Service {
  async shutdown(): Promise<void> {
    clearInterval(this._scanInterval);
    await this._bot.close();
    await this._server.close();
  }
}
```

---

## Related Documentation

- **[Codebase Summary](./codebase-summary.md)** — Module structure and responsibilities
- **[System Architecture](./system-architecture.md)** — Component interactions and data flows
- **[Project Overview](./project-overview-pdr.md)** — Vision and requirements
