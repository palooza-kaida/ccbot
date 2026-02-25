# System Architecture

This document describes the overall system architecture, component interactions, data flows, and technical design decisions for ccpoke.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         ccpoke Ecosystem                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Claude Code  │  │   Cursor     │  │ Future Agents│            │
│  │   (Agent)    │  │   (Agent)    │  │    (TBD)     │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                 │                    │
│         │ Hook Event      │ Hook Event      │ Hook Event         │
│         └─────────────────┼─────────────────┘                    │
│                           │                                      │
│                    ┌──────▼──────────────────────────┐           │
│                    │   ccpoke Bridge Server          │           │
│                    │  (Express API, 127.0.0.1:9377)  │           │
│                    │                                 │           │
│                    │  ┌──────────────────────────┐   │           │
│                    │  │  Agent Handler           │   │           │
│                    │  │  (Event Parsing)         │   │           │
│                    │  └──────────────────────────┘   │           │
│                    │                                 │           │
│                    │  ┌──────────────────────────┐   │           │
│                    │  │  Session Resolver        │   │           │
│                    │  │  (Project Detection)     │   │           │
│                    │  └──────────────────────────┘   │           │
│                    │                                 │           │
│                    │  ┌──────────────────────────┐   │           │
│                    │  │  Telegram Channel        │   │           │
│                    │  │  (Notification Sender)   │   │           │
│                    │  └──────────────────────────┘   │           │
│                    │                                 │           │
│                    │  ┌──────────────────────────┐   │           │
│                    │  │  Session Monitor         │   │           │
│                    │  │  (Periodic Scanner)      │   │           │
│                    │  └──────────────────────────┘   │           │
│                    └─────────────────────────────────┘           │
│                           │    │                                 │
│                           │    │ tmux operations                 │
│                           │    │                                 │
│                    ┌──────▼────▼──────────────────┐              │
│                    │   tmux Session Manager       │              │
│                    │  (Bridge, Scanner, State)    │              │
│                    └──────┬────┬──────────────────┘              │
│                           │    │                                 │
│                    ┌──────▼────▼──────────────────┐              │
│                    │  Local tmux Sessions         │              │
│                    │  (Project Context)           │              │
│                    └──────────────────────────────┘              │
│                                                                  │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                         Telegram API
                                  │
                          ┌───────▼────────┐
                          │  Telegram Bot  │
                          │  (Phone User)  │
                          └────────────────┘
```

---

## Core Components

### 1. Agent Framework

**Responsibility:** Detect and integrate multiple AI coding agents.

**Components:**
- **AgentRegistry** — Maintains list of available agents
- **ClaudeCodeProvider** — Claude Code integration
- **CursorProvider** — Cursor integration
- **AgentHandler** — Central event dispatcher

**Key Operations:**
```
Agent Hook Triggered
    ↓
Validate Secret Header
    ↓
Load Agent Provider
    ↓
Parse Event (transcript → structured)
    ↓
Extract Project/Session Info
    ↓
Resolve tmux Session
    ↓
Store Response
    ↓
Emit to Notification Channel
```

**Extensibility:** New agents implemented via `AgentProvider` interface.

### 2. Notification Channel

**Responsibility:** Send notifications to users via Telegram.

**Components:**
- **TelegramChannel** — Bot lifecycle and message handling
- **TelegramSender** — Message formatting and pagination
- **PendingReplyStore** — Tracks pending user replies (10min TTL, auto-cleanup on shutdown)

**Key Operations:**
```
Notification Event Received
    ↓
Format Message (Markdown conversion)
    ↓
Check Message Length
    ↓
If > 4096 chars: Paginate [1/N]
    ↓
Send to Telegram API
    ↓
Store Response ID (for edits/updates)
    ↓
PendingReplyStore tracks reply window (10min)
    ↓
Auto-cleanup on timeout or explicit destroy()
```

**Resource Management:**
- **PendingReplyStore** — In-memory store bounded by reply TTL (10 minutes)
- **destroy()** — Explicitly clears all pending replies on shutdown (prevents memory leak)
- **Auto-expiry** — Entries automatically expire after 10 minutes inactivity

**Features:**
- Auto-split long messages
- Markdown to MarkdownV2 conversion
- Rate limiting (Telegram: 30 msg/sec)
- Message editing (progress updates)

### 3. Session Management

**Responsibility:** Track and manage tmux sessions across bot restart.

**Components:**
- **SessionMap** — Registry of active sessions with LRU eviction
- **SessionStateManager** — State machine for individual sessions
- **TmuxScanner** — Detects live tmux panes
- **SessionResolver** — Links notifications to sessions

**Session Attributes:**
```typescript
interface TmuxSession {
  sessionId: string;           // Unique ID
  tmuxTarget: string;          // tmux target (session:window)
  project: string;             // Project name (from path)
  cwd: string;                 // Working directory
  label: string;               // Display label
  state: 'idle' | 'busy' | 'unknown';  // Current state
  lastActivity: Date;          // Last activity timestamp
}
```

**Resource Limits:**
- **MAX_SESSIONS = 200:** Prevents unbounded memory growth
- **LRU Eviction:** When limit reached, oldest inactive session (by `lastActivity`) is evicted
- **Persistence:** Sessions saved to `~/.ccpoke/sessions.json` on disk for recovery

**Lifecycle:**
```
SessionStart Hook
    ↓
Register in SessionMap (memory + disk)
    ↓
Periodic 30s Scan (TmuxScanner)
    ├─ Detect new panes
    ├─ Update last_activity
    └─ Prune stale (30min idle)
    ↓
Persist to ~/.ccpoke/sessions.json
    ↓
Bot Restart: Load from disk
    ↓
Reconcile with live tmux state
```

### 4. tmux Bridge

**Responsibility:** Low-level operations on tmux sessions.

**Components:**
- **TmuxBridge** — CLI wrapper for tmux commands
- **TmuxScanner** — Process tree analysis
- **SessionMap** — Persistence and registry

**Operations:**
```typescript
// Send keystrokes
await bridge.sendKeys('0:1', 'message\nEnter');

// Capture pane content
const content = await bridge.capturePane('0:1');

// List sessions/windows/panes
const panes = await bridge.listPanes();

// Get pane details
const details = await bridge.getPaneInfo('0:1');
```

**Process Discovery:**
Uses `ps` tree to find processes running in panes:
```
tmux pane → shell process → child processes
```

Detects agents by matching process names:
- `claude` for Claude Code
- `cursor` for Cursor IDE

---

## Data Flow: Stop Hook Notification

**Scenario:** Claude Code completes response → User receives Telegram notification

```
1. CLAUDE CODE STOP HOOK TRIGGERS
   ├─ Writes to ~/.claude/projects/{project}/session.jsonl
   └─ Executes ~/.ccpoke/hooks/stop-notify.sh

2. SHELL SCRIPT (stop-notify.sh)
   ├─ Reads transcript path from environment
   ├─ Gets hook secret from config
   ├─ Constructs JSON payload
   └─ curl POST http://127.0.0.1:9377/hook/stop
      └─ Headers:
         ├─ Content-Type: application/json
         └─ X-CCPoke-Secret: {secret}

3. EXPRESS SERVER (/hook/stop endpoint)
   ├─ Validate secret header
   ├─ Parse request body
   └─ Delegate to AgentHandler

4. AGENT HANDLER
   ├─ Detect agent (Claude Code)
   ├─ Load ClaudeCodeProvider
   ├─ Call parseEvent()
   │  ├─ Read transcript file
   │  ├─ Parse NDJSON
   │  ├─ Extract last response
   │  ├─ Collect git changes
   │  └─ Return AgentEventResult
   └─ Emit 'event' signal

5. SESSION RESOLVER
   ├─ Extract project from transcript path
   ├─ Query SessionMap
   ├─ Find matching tmux session
   └─ Attach session info to event

6. RESPONSE STORE
   ├─ Store response by session ID
   ├─ Generate short ID (6 chars)
   └─ Enable response lookup for chat

7. TELEGRAM CHANNEL
   ├─ Format notification
   │  ├─ Markdown → MarkdownV2
   │  ├─ Git diff summary
   │  ├─ Execution stats
   │  └─ Session info
   ├─ Check length
   ├─ If > 4096 chars: paginate
   ├─ Send via Telegram API
   ├─ Store message ID
   └─ Add inline buttons (Chat, View)

8. USER ON PHONE 📱
   └─ Receives notification with:
      ├─ Agent name
      ├─ Project
      ├─ Summary
      ├─ Git changes
      ├─ Duration
      └─ Action buttons
```

---

## Data Flow: Two-Way Chat

**Scenario:** User sends message via Telegram → Injected into Claude Code session

```
1. USER SENDS TELEGRAM MESSAGE
   └─ TelegramChannel receives update

2. MESSAGE HANDLER
   ├─ Validate user (whitelist check)
   ├─ Parse message text
   ├─ Store in PendingReplyStore (10min TTL)
   └─ Emit 'reply_pending' event

3. SESSION RESOLVER
   ├─ Extract session from Telegram message
   ├─ Query SessionMap
   └─ Find tmux target

4. SESSION STATE MACHINE
   ├─ Check session status
   ├─ Queue message if busy
   ├─ Transition to 'waiting_input'
   └─ Inject via tmux

5. TMUX BRIDGE (send-keys)
   ├─ Send message text
   ├─ Send Enter key
   └─ Claude Code receives input

6. POLLING (JSONL transcript)
   ├─ Periodic 2-second check
   ├─ Detect new response event
   ├─ Extract response content
   └─ Emit 'response_ready'

7. TELEGRAM SENDER
   ├─ Format response
   ├─ Send back to user
   ├─ Clear pending reply
   └─ Transition session to 'idle'

8. MESSAGE LIFECYCLE
   └─ PendingReplyStore expires (10min)
      └─ Auto-cleanup to free memory
```

---

## Data Flow: Session Lifecycle

**Scenario:** Detect, register, sync, and prune sessions

```
DETECTION PHASE
├─ SessionStart Hook (Claude Code)
│  ├─ Captures tmux session info
│  ├─ Captures working directory
│  ├─ Posts to hook endpoint
│  └─ AgentHandler.onSessionStart()
│
└─ TmuxScanner (Periodic, 30s interval)
   ├─ List all tmux panes
   ├─ Extract process tree
   ├─ Detect agents (claude, cursor)
   ├─ Check session status
   └─ Create new session entries

REGISTRATION PHASE
├─ SessionMap.addSession()
│  ├─ Store in memory (_sessions map)
│  ├─ Persist to ~/.ccpoke/sessions.json
│  ├─ Emit 'session_started' event
│  └─ Return session object
│
└─ Listeners notified:
   ├─ TelegramChannel (optional notification)
   ├─ Logger (activity record)
   └─ ResponseStore (session context)

SYNCHRONIZATION PHASE (Periodic)
├─ TmuxScanner.scan() — Every 30 seconds
│  ├─ List live panes
│  ├─ For each registered session:
│  │  ├─ Check if pane exists
│  │  ├─ Get pane status
│  │  ├─ Update last_activity
│  │  └─ Mark as 'alive'
│  │
│  └─ For new panes:
│     ├─ Detect agent
│     ├─ Auto-register if agent detected
│     └─ Emit 'new_session'

CLEANUP PHASE
├─ Stale Detection
│  ├─ Session idle > 30 minutes
│  └─ Pane not found in tmux
│
└─ Prune:
   ├─ Remove from SessionMap
   ├─ Update persistence file
   ├─ Emit 'session_ended'
   └─ Optional: Notify Telegram

RESTART RECOVERY
├─ Bot startup:
│  ├─ Load ~/.ccpoke/sessions.json
│  ├─ Validate required fields (sessionId, tmuxTarget, project)
│  ├─ Validate date format (lastActivity timestamp)
│  ├─ Skip invalid entries (corrupted or malformed)
│  ├─ Populate SessionMap (memory)
│  ├─ Reconcile with live tmux
│  ├─ Mark lost sessions as 'stale'
│  └─ Resume monitoring
```

---

## Module Dependency Graph

```
index.ts (Entry Point)
  ├─ ConfigManager
  │  ├─ Paths utilities
  │  └─ Logger
  ├─ AgentHandler (Dispatcher)
  │  ├─ AgentRegistry
  │  │  ├─ ClaudeCodeProvider
  │  │  │  ├─ ClaudeCodeParser
  │  │  │  └─ ClaudeCodeInstaller
  │  │  └─ CursorProvider
  │  │     ├─ CursorParser
  │  │     ├─ CursorInstaller
  │  │     └─ CursorStateReader
  │  ├─ SessionResolver
  │  │  └─ SessionMap
  │  └─ TelegramChannel (Observer)
  ├─ TelegramChannel (Initialization)
  │  ├─ TelegramSender
  │  ├─ PendingReplyStore
  │  ├─ SessionResolver
  │  └─ ResponseStore
  ├─ ApiServer (Express)
  │  ├─ AgentHandler
  │  └─ Middleware (CORS, logging)
  ├─ SessionMonitor
  │  ├─ SessionMap
  │  └─ TmuxScanner
  │     ├─ TmuxBridge
  │     └─ InstallDetection
  └─ Graceful Shutdown
     ├─ TelegramChannel.close()
     ├─ ApiServer.close()
     └─ SessionMonitor.stop()
```

---

## Configuration & Persistence

### File Layout

```
~/.ccpoke/
├── config.json           # User configuration
│   ├─ telegram_bot_token
│   ├─ user_id
│   ├─ hook_port (default: 9377)
│   └─ hook_secret
│
├── state.json            # Chat state
│   ├─ chat_id
│   ├─ user_confirmed
│   └─ last_activity
│
├── sessions.json         # Active sessions (persist on restart)
│   └─ [{sessionId, tmuxTarget, project, cwd, status, ...}]
│
└── hooks/
    └── stop-notify.sh    # Stop hook script
       └─ Called by Claude Code
          └─ curl to /hook/stop endpoint

~/.claude/
└── settings.json         # Claude Code settings (modified by setup)
    └─ hooks:
       └─ Stop: ~/.ccpoke/hooks/stop-notify.sh
```

### Schema Migrations

ConfigManager detects structure changes and migrates:

```typescript
if (!config.hook_secret) {
  config.hook_secret = generateSecret();
  save();
}

if (oldFormat.port) {
  config.hook_port = oldFormat.port;  // Rename field
  delete oldFormat.port;
}
```

---

## Security Model

### Hook Secret

**Purpose:** Verify hook requests come from Claude Code on local machine.

**Mechanism:**
1. Setup script generates random 32-char secret
2. Store in `config.json` (local only, not committed)
3. Hook script reads from config
4. Hook request includes header: `X-CCPoke-Secret: {secret}`
5. Server validates before processing

**Security Properties:**
- ✅ Prevents external parties from triggering notifications
- ✅ Survives bot restart (persisted in config)
- ✅ Cannot be extracted from git (in .gitignore)
- ⚠️ Local machine security still required (don't expose port publicly)

### User Whitelist

**Purpose:** Only whitelisted Telegram users can send commands.

**Mechanism:**
1. `ALLOWED_USERS` env var or `config.json`
2. User ID checked before command processing
3. Non-whitelisted users: silent rejection

**Commands Protected:**
- `/start` — Register chat
- Message replies — Chat injection
- Inline buttons — Any action

### Loopback Binding

**Purpose:** Prevent internet exposure of hook endpoint.

**Configuration:**
```typescript
server.listen(9377, '127.0.0.1', () => {
  // Only accessible from localhost
});
```

**Access:**
- ✅ Local machine: `curl http://127.0.0.1:9377/`
- ❌ Remote: `curl http://your-machine:9377/` — fails

**Tunnel (Optional):**
Users can optionally expose via Cloudflare Tunnel:
```bash
cloudflared tunnel run
```

---

## Error Handling Strategy

### Failure Modes

| Component | Failure | Impact | Recovery |
|-----------|---------|--------|----------|
| **Hook secret mismatch** | Invalid request | Notification dropped | Log warning, continue |
| **Transcript parse fail** | NDJSON malformed | Content lost | Log error, send generic notification |
| **Telegram API error** | Network/API down | Message fails | Retry with exponential backoff |
| **tmux unavailable** | No tmux session | Can't inject | Skip session operations, log |
| **Config file missing** | ~/.ccpoke/config.json gone | Bot can't start | Prompt user to re-run setup |

### Graceful Degradation

```typescript
// Hook parsing failure: send generic notification instead of crashing
try {
  const event = parseEvent(raw);
  // ... normal flow
} catch (error) {
  logger.error('Parse failed, sending generic notification', { error });
  channel.sendNotification({
    type: 'generic',
    content: 'Agent completed task (details unavailable)',
  });
}
```

---

## Scalability Considerations

### Memory Usage

**Expected:** < 100MB

**Breakdown:**
- SessionMap (in-memory): ~1KB per session × 10 sessions = 10KB
  - **Capped at 200 sessions** with LRU eviction
- Response cache: ~10KB per response × 100 responses = 1MB
- PendingReplyStore: ~1KB per pending reply × 10 = 10KB
  - **Auto-expires** after 10 minutes
  - **destroy()** called on shutdown for explicit cleanup
- Bot instance: ~50MB (Telegram library + Node.js)

**Resource Limits:**
- **SessionMap.MAX_SESSIONS = 200** — Prevents unbounded growth, evicts oldest inactive session when exceeded
- **PendingReplyStore TTL = 10 minutes** — Auto-cleanup, explicit destroy() on shutdown
- **Response cache cleanup** — Daily batch purge of expired responses

**Optimization:**
- SessionMap persists to disk (state survives restart)
- Atomic file writes prevent corruption on crash
- In-memory collections bounded by limits or TTL

### Throughput

**Expected:** 1-10 notifications/hour per session

**Bottleneck:** Telegram API (30 msg/sec limit)
- Solution: Batching, message editing for updates

### File Descriptor Limits

**Expected:** 10-20 open fds (Express server, Telegram polling, tmux)

**Platform Default:** 256-1024 (usually sufficient)

---

## Testing Architecture

### Unit Tests

```typescript
// Test agent parser in isolation
describe('ClaudeCodeParser', () => {
  it('extracts response from NDJSON', () => {
    const parser = new ClaudeCodeParser();
    const result = parser.parse(testTranscript);
    expect(result).toMatchObject({ type: 'response', content: '...' });
  });
});
```

### Integration Tests

```typescript
// Test hook → notification flow
describe('Hook Integration', () => {
  it('converts hook event to Telegram notification', async () => {
    const mockChannel = mock(NotificationChannel);
    const handler = new AgentHandler(registry, mockChannel);
    await handler.handleHookEvent(hookPayload);
    expect(mockChannel.sendNotification).toHaveBeenCalled();
  });
});
```

### E2E Tests (Manual)

```
1. Start bot: pnpm dev
2. Run Claude Code in tmux
3. Trigger agent response
4. Verify Telegram notification arrives
5. Test message reply injection
```

---

## Related Documentation

- **[Codebase Summary](./codebase-summary.md)** — Module structure and files
- **[Code Standards](./code-standards.md)** — Implementation patterns and conventions
- **[Project Overview](./project-overview-pdr.md)** — Vision and requirements
- **[CLI Commands](./commands.md)** — User-facing commands and setup
