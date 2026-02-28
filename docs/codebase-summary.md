# Codebase Summary

**ccpoke** is a TypeScript/Node.js notification bridge for AI coding agents. This document provides a high-level overview of the codebase structure, module responsibilities, and key architectural components.

- **Language:** TypeScript 5.7.3, targeting ES2022 with ESM modules
- **Runtime:** Node.js ≥20
- **Lines of Code:** ~4,208 LOC in src/ (42 TS files)
- **Architecture:** Multi-agent provider pattern with channel abstraction
- **Version:** 1.5.4

---

## Project Structure

```
ccpoke/
├── src/                        # Main application source (4,208 LOC)
│   ├── index.ts               # Entry point, bot lifecycle orchestration (177 LOC)
│   ├── config-manager.ts      # Config persistence & schema migration (127 LOC)
│   ├── agent/                 # Multi-agent provider framework
│   ├── channel/               # Notification channels (Telegram, extensible)
│   ├── server/                # Express API server
│   ├── tmux/                  # Terminal session management
│   ├── commands/              # CLI commands (setup, uninstall, update, help)
│   ├── i18n/                  # Internationalization (EN, VI, ZH)
│   └── utils/                 # Shared utilities
├── web/                        # Web dashboard (Astro-based)
├── dist/                       # Compiled JavaScript (generated)
├── docs/                       # Documentation
├── .husky/                     # Git hooks (pre-commit linting)
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── eslint.config.js           # ESLint + TypeScript config
└── .prettierrc                 # Code formatting rules
```

---

## Core Modules

### Agent Framework (`src/agent/`)

Implements the **Provider Pattern** for multi-agent support.

#### Key Files

| File | LOC | Responsibility |
|------|-----|-----------------|
| **types.ts** | 41 | Interface definitions: `AgentProvider`, `AgentEventResult`, `NotificationEvent` |
| **agent-registry.ts** | 30 | Registry pattern for discovering/loading agents |
| **agent-handler.ts** | 136 | Central hook event dispatcher (stop, session_start, notification hooks) |
| **chat-session-resolver.ts** | 5 | Bridges notifications to tmux session linking |

#### Agent Adapters

**Claude Code Adapter** (`claude-code/`)
- **claude-code-installer.ts** (171 LOC) — Manages hook scripts, `settings.json` configuration
- **claude-code-parser.ts** (163 LOC) — Parses NDJSON transcript files for event extraction
- **claude-code-provider.ts** (89 LOC) — Implements `AgentProvider` interface

**Cursor Adapter** (`cursor/`)
- **cursor-installer.ts** (118 LOC) — Manages `hooks.json` configuration
- **cursor-parser.ts** (112 LOC) — Parses Cursor's transcript format
- **cursor-provider.ts** (91 LOC) — Implements `AgentProvider` interface
- **cursor-state-reader.ts** (69 LOC) — Reads SQLite DB for Cursor state

### Notification Channels (`src/channel/`)

Implements the **Adapter Pattern** for multi-channel support.

#### Key Files

| File | LOC | Responsibility |
|------|-----|-----------------|
| **types.ts** | 25 | `NotificationChannel` interface definition |
| **telegram-channel.ts** | 239 | Bot lifecycle, Telegram handlers, notification formatting |
| **telegram-sender.ts** | 97 | Message sending, pagination, Markdown escaping |
| **pending-reply-store.ts** | 43 | In-memory store for tracking pending replies (10min TTL) |
| **session-list.ts** | 60 | `/sessions` command formatting with state emojis and Chat buttons |
| **prompt-handler.ts** | 163 | Forwards elicitation_dialog and idle_prompt events with force_reply |

### Terminal Session Management (`src/tmux/`)

Implements the **Bridge Pattern** for tmux operations.

#### Key Files

| File | LOC | Responsibility |
|------|-----|-----------------|
| **tmux-bridge.ts** | 89 | Low-level tmux CLI wrapper (send-keys, capture-pane) |
| **tmux-scanner.ts** | 108 | Pane detection, process tree search, session discovery |
| **session-map.ts** | 160 | Session registry, persistence, state tracking (idle/busy/blocked/unknown) |
| **session-state.ts** | 114 | Message queue, keystroke injection, state machine |
| **tmux-session-resolver.ts** | 67 | Links notification sessions to tmux targets |

### API Server (`src/server/`)

Express-based HTTP server for receiving webhooks.

| File | LOC | Responsibility |
|------|-----|-----------------|
| **api-server.ts** | 101 | Express setup, webhook routes (/hook/stop, /hook/notification), CORS, rate limiting |

### Configuration (`src/config-manager.ts`)

Handles config persistence and schema migrations.

| Responsibility |
|---|
| Read/write `~/.ccpoke/config.json` |
| Schema validation using TypeScript interfaces |
| Auto-migration when structure changes |
| Defaults for missing values |

### CLI Commands (`src/commands/`)

| Command | File | LOC | Purpose |
|---------|------|-----|---------|
| `setup` | setup.ts | 266 | Interactive configuration wizard |
| `update` | update.ts | 159 | Check for npm updates |
| `uninstall` | uninstall.ts | 51 | Remove hooks, config, state |
| `help` | help.ts | 24 | Display help information |

### Internationalization (`src/i18n/`)

3 supported locales with parameter substitution.

| File | LOC | Purpose |
|------|-----|---------|
| **locales/en.ts** | - | English strings |
| **locales/vi.ts** | - | Vietnamese strings |
| **locales/zh.ts** | - | Chinese (Simplified) strings |
| **index.ts** | - | i18n loader and selection logic |

### Utilities (`src/utils/`)

| File | LOC | Purpose |
|------|-----|---------|
| **constants.ts** | - | Global constants (ports, defaults, limits) |
| **paths.ts** | - | File paths (~/.ccpoke, ~/.claude, etc.) |
| **git-collector.ts** | - | Git diff extraction and formatting |
| **markdown.ts** | - | Markdown to Telegram MarkdownV2 conversion |
| **response-store.ts** | - | Stores responses by session ID |
| **stats-format.ts** | - | Formats execution stats (duration, tokens) |
| **tunnel.ts** | - | Cloudflare tunnel integration |
| **version-check.ts** | - | npm version checking |
| **install-detection.ts** | - | Detects installed agents (Claude Code, Cursor) |
| **log.ts** | - | Structured logging (debug, info, warn, error) |

### Entry Point (`src/index.ts`)

**177 LOC** — Orchestrates the complete bot lifecycle:

1. Load configuration
2. Initialize logging
3. Register agents
4. Create Telegram bot
5. Start Express server
6. Handle graceful shutdown
7. Start session monitoring

---

## Architecture Patterns

### 1. Provider Pattern

**Purpose:** Abstract agent implementations behind a common interface.

```typescript
interface AgentProvider {
  name: string;
  detect(): Promise<boolean>;
  installHook(config: HookConfig): Promise<void>;
  parseEvent(raw: unknown): AgentEventResult;
}
```

**Benefits:**
- Easy to add new agents (implement interface)
- Core logic doesn't depend on specific agent
- Pluggable architecture

### 2. Adapter Pattern

**Purpose:** Abstract notification channels behind a common interface.

```typescript
interface NotificationChannel {
  initialize(config: Config): Promise<void>;
  shutdown(): Promise<void>;
  sendNotification(event: AgentEvent): Promise<void>;
}
```

**Benefits:**
- Easy to add new channels (Slack, Discord, etc.)
- Core logic channels-agnostic

### 3. Bridge Pattern

**Purpose:** Separate tmux CLI operations from high-level session logic.

- **tmux-bridge.ts** — Low-level CLI wrappers
- **tmux-scanner.ts** — Discovers and tracks panes
- **session-map.ts** — High-level session registry
- **session-state.ts** — State machine for messages

### 4. Observer Pattern

**Purpose:** Session changes trigger notifications and updates.

- SessionMap emits "session_started", "session_idle", "session_ended"
- TelegramChannel subscribes to session events
- Periodic scanner maintains live state

### 5. State Machine

**Purpose:** Session lifecycle management.

```
idle → waiting_for_input → busy → idle
```

- **idle** — No activity, ready to accept messages
- **waiting_for_input** — User sent message, waiting for response
- **busy** — Agent processing, don't interrupt
- Timeouts trigger transitions to idle

### 6. Store Pattern

**Purpose:** Centralized state management with persistence.

- **ConfigManager** — Persistent config store
- **SessionMap** — Persistent session registry
- **ResponseStore** — Response by session ID
- **PendingReplyStore** — In-memory reply tracking

---

## Data Flow

### Notification Flow (Stop Hook)

```
1. Claude Code completes response
2. Stop hook trigger (~/.ccpoke/hooks/stop-notify.sh)
3. curl POST http://127.0.0.1:9377/hook/stop
   - Include: transcript path, secret
   - Validate: hook secret
4. AgentHandler parses event (handleStopEvent)
   - Load transcript (NDJSON)
   - Extract last response
   - Collect git changes
5. Resolve tmux session (SessionResolver)
6. Store response (ResponseStore)
7. TelegramChannel formats & sends
   - Markdown conversion
   - Pagination if needed
   - Add git diff summary
```

### Elicitation Dialog Flow

```
1. Claude Code needs user input (confirmation prompt)
2. Notification hook: POST /hook/notification
   - notification_type: elicitation_dialog
   - message: the prompt
   - title: optional
3. AgentHandler.handleNotification():
   - Resolve session
   - Update state → blocked
4. PromptHandler forwards to Telegram
   - force_reply markup
   - User types response
5. Message reply detection
6. PromptHandler.injectElicitationResponse()
   - Send response via tmux send-keys
   - Update state → busy
7. Claude Code continues with user input
```

### Two-Way Chat Flow

```
1. User sends message in Telegram
2. TelegramChannel receives update
3. Resolve target session (SessionResolver)
4. Inject message via tmux send-keys
5. Poll JSONL transcript for response
6. Send response back to Telegram
```

### Session Lifecycle

```
1. SessionStart hook triggers
2. Register in SessionMap
3. Periodic 30s scanner sync
   - Check live panes
   - Detect new/stale sessions
   - Update last_activity
4. Stale sessions (30min idle) pruned
5. Persist to ~/.ccpoke/sessions.json
6. Bot restart loads from persistence
```

---

## External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **express** | ^5 | HTTP server |
| **node-telegram-bot-api** | ^0.63 | Telegram Bot API client |
| **better-sqlite3** | ^9 | SQLite driver (Cursor state) |
| **cloudflared** | Latest | Cloudflare tunnel binary |
| **@clack/prompts** | ^0.7 | CLI prompt library |
| **qrcode-terminal** | ^0.12 | QR code display |

Dev dependencies: TypeScript, ESLint, Prettier, tsup, tsx

---

## Configuration & Build

### TypeScript Config

- **Target:** ES2022
- **Module:** ESNext with `verbatimModuleSyntax`
- **Strict Mode:** Enabled
- **Lib:** ES2022

### ESLint Config

- **Flat Config** — Modern ESLint setup
- **Plugins:** typescript-eslint, import sorting
- **Rules:** Enforce const, no any, proper error handling

### Prettier Config

- **Print Width:** 100
- **Indent:** 2 spaces
- **Quotes:** Double
- **Trailing Commas:** ES5
- **Line Ending:** LF

### Build Process

```bash
pnpm build        # Compile TypeScript → dist/
pnpm dev          # Dev mode (tsx)
pnpm lint         # Run ESLint
pnpm format       # Format with Prettier
pnpm start        # Run compiled bot
npx -y ccpoke     # Zero-install via npm
```

---

## File Size Guidelines

**Design Principle:** Keep files under 200 LOC for maintainability.

- **agent-handler.ts:** 80 LOC ✅
- **tmux-bridge.ts:** 89 LOC ✅
- **telegram-sender.ts:** 97 LOC ✅
- **api-server.ts:** 101 LOC ✅
- **session-map.ts:** 160 LOC ✅
- **claude-code-installer.ts:** 171 LOC ✅
- **index.ts:** 177 LOC ✅ (borderline, core orchestration)
- **telegram-channel.ts:** 239 LOC ⚠️ (largest, combines multiple responsibilities)

The largest file (telegram-channel.ts) could be split into:
- `telegram-handlers.ts` — Message handlers
- `telegram-formatter.ts` — Notification formatting
- `telegram-bot.ts` — Bot lifecycle

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| **Files** | kebab-case | `agent-handler.ts`, `tmux-bridge.ts` |
| **Classes** | PascalCase | `TelegramChannel`, `SessionMap` |
| **Functions** | camelCase | `parseEvent()`, `sendNotification()` |
| **Constants** | UPPER_SNAKE_CASE | `DEFAULT_PORT`, `HOOK_SECRET_HEADER` |
| **Types/Interfaces** | PascalCase | `AgentProvider`, `NotificationChannel` |
| **Private members** | `_prefix` | `_config`, `_logger` |

---

## Error Handling

**Principles:**
- Try-catch for async operations
- Typed errors (not bare strings)
- Log context (operation, input, error details)
- Graceful degradation where possible
- Never crash the bot for single-operation failures

**Pattern:**
```typescript
try {
  await operation();
} catch (error) {
  logger.error('Operation failed', { error, context: {...} });
  // Handle gracefully or rethrow
}
```

---

## Testing Strategy

Currently minimal test coverage. Recommended additions:

1. **Unit tests** — Agent parsers, formatters, utilities
2. **Integration tests** — Hook → notification flow
3. **E2E tests** — Full bot lifecycle with mock Telegram API

Run tests:
```bash
pnpm test
```

---

## Related Documentation

- **[Project Overview & PDR](./project-overview-pdr.md)** — Vision, goals, features
- **[Code Standards](./code-standards.md)** — Implementation guidelines
- **[System Architecture](./system-architecture.md)** — Component interactions, data flows
- **[CLI Commands](./commands.md)** — Command reference
- **[Deployment Guide](./deployment-guide.md)** — Deployment and release instructions
