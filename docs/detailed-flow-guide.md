# Detailed Flow Guide — ccpoke

Tài liệu mô tả chi tiết **từng bước** trong mọi luồng hoạt động của ccpoke.

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Khởi động (Boot Sequence)](#2-khởi-động-boot-sequence)
3. [Flow 1: Stop Hook → Notification](#3-flow-1-stop-hook--notification)
4. [Flow 2: Two-Way Chat](#4-flow-2-two-way-chat)
5. [Flow 3: Session Lifecycle](#5-flow-3-session-lifecycle)
6. [Flow 4: Message Queue & Drain](#6-flow-4-message-queue--drain)
7. [Persistence — File nào ghi ở đâu](#7-persistence--file-nào-ghi-ở-đâu)
8. [Module Dependency Map](#8-module-dependency-map)
9. [Security Model](#9-security-model)

---

## 1. Tổng quan hệ thống

```mermaid
graph TB
    subgraph LOCAL["May local cua ban"]
        CC["Claude Code<br/>(trong tmux)"]
        CUR["Cursor<br/>(trong tmux)"]
        CODEX["Codex CLI<br/>(future)"]

        subgraph SERVER["Express Server - port 9377<br/>Chi bind localhost 127.0.0.1"]
            HOOK_STOP["POST /hook/stop"]
            HOOK_START["POST /hook/session-start"]
            API_RESP["GET /api/responses/:id"]
            HEALTH["GET /health"]
        end

        AH["AgentHandler<br/>parse event + collect git"]
        SM["SessionMap<br/>track tmux sessions"]
        RS["ResponseStore<br/>luu response (24h TTL)"]

        subgraph TMUX_STACK["TmuxBridge + Scanner"]
            TB["sendKeys (inject text)"]
            CP["capturePane"]
            SC["scanClaudePanes (15s)"]
        end

        TMUX_SESS["tmux sessions<br/>(Claude Code dang chay)"]
    end

    PHONE["Dien thoai cua ban<br/>(Telegram App)"]

    CC -->|"stop hook<br/>(curl POST)"| HOOK_STOP
    CUR -->|"stop hook<br/>(curl POST)"| HOOK_STOP
    CODEX -.->|"future"| HOOK_STOP

    HOOK_STOP --> AH
    HOOK_START --> AH
    API_RESP --> RS

    AH --> SM
    AH --> RS
    AH -->|"sendNotification"| PHONE

    SM --> SC
    SC --> TMUX_SESS
    TB --> TMUX_SESS

    PHONE -->|"reply message"| TB

    style LOCAL fill:#1a1a2e,stroke:#16213e,color:#e0e0e0
    style SERVER fill:#0f3460,stroke:#533483,color:#e0e0e0
    style TMUX_STACK fill:#1a1a2e,stroke:#e94560,color:#e0e0e0
    style PHONE fill:#533483,stroke:#e94560,color:#fff
```

**Tom tat:** ccpoke la cau noi giua AI agent (chay trong tmux tren may local) va Telegram bot (tren dien thoai). Khi agent xong viec → hook trigger → parse transcript → gui notification. User co the reply lai → inject vao tmux session.

---

## 2. Khoi dong (Boot Sequence)

```mermaid
flowchart TD
    START["pnpm dev / npx ccpoke"] --> LOAD_CFG

    LOAD_CFG["1. loadOrSetupConfig()<br/>Doc ~/.ccpoke/config.json"]
    LOAD_CFG -->|"Chua co config"| SETUP["Chay setup wizard<br/>(hoi bot token, user_id)"]
    LOAD_CFG -->|"Co config"| REPAIR["Auto-repair:<br/>them hook_secret neu thieu"]
    SETUP --> REPAIR

    REPAIR --> HOOKS["2. ensureAgentHooks(config)<br/>Duyet tung agent trong config.agents[]"]

    HOOKS --> HOOK_CHECK{"provider.detect()<br/>Agent co cai khong?"}
    HOOK_CHECK -->|"Khong"| SKIP["Bo qua agent nay"]
    HOOK_CHECK -->|"Co"| INTEGRITY{"provider.isHookInstalled()<br/>+ verifyIntegrity()"}
    INTEGRITY -->|"Thieu/hong"| INSTALL_HOOK["provider.installHook(port, secret)<br/>Ghi hook script vao disk"]
    INTEGRITY -->|"OK"| TMUX_INIT

    SKIP --> TMUX_INIT
    INSTALL_HOOK --> TMUX_INIT

    TMUX_INIT["3. Khoi tao tmux stack<br/>TmuxBridge + SessionMap<br/>+ SessionStateManager<br/>+ TmuxSessionResolver"]

    TMUX_INIT --> LOAD_SESS["4. sessionMap.load()<br/>Doc ~/.ccpoke/sessions.json"]
    LOAD_SESS --> REFRESH["5. sessionMap.refreshFromTmux()<br/>Scan tmux panes, register/remove"]
    REFRESH --> PERIODIC["6. startPeriodicScan(15s)<br/>Lap lai buoc 5 moi 15 giay"]
    PERIODIC --> EXPRESS["7. ApiServer.start()<br/>Express listen 127.0.0.1:9377"]
    EXPRESS --> TELEGRAM["8. TelegramChannel.initialize()<br/>Polling mode, register handlers"]
    TELEGRAM --> SHUTDOWN["9. Dang ky shutdown handlers<br/>SIGINT / SIGTERM"]

    style START fill:#e94560,color:#fff
    style SHUTDOWN fill:#0f3460,color:#fff
```

---

## 3. Flow 1: Stop Hook → Notification

**Kich ban:** Claude Code trong tmux hoan thanh response → User nhan notification tren Telegram.

```mermaid
sequenceDiagram
    participant CC as Claude Code<br/>(trong tmux)
    participant SH as Shell Script<br/>(hook script)
    participant EX as Express Server<br/>(port 9377)
    participant AH as AgentHandler
    participant PR as Provider<br/>(ClaudeCode)
    participant RS as ResponseStore
    participant TG as Telegram Channel
    participant PH as Dien thoai

    CC->>SH: Trigger Stop hook<br/>(stdin: JSON)
    Note over SH: Doc JSON tu stdin<br/>Lay tmux target<br/>tu $TMUX_PANE

    SH->>EX: curl POST /hook/stop<br/>Header: X-CCPoke-Secret<br/>Body: {session_id, transcript_path, cwd}
    EX->>EX: Validate secret header
    EX-->>SH: 200 OK (ngay lap tuc)
    Note over EX: setImmediate<br/>xu ly async

    EX->>AH: handleStopEvent(agentName, rawEvent)
    Note over AH: Wait 500ms<br/>(transcript settle delay)

    AH->>PR: parseEvent(rawEvent)
    Note over PR: 1. Validate fields<br/>2. parseTranscript(path)<br/> - Doc .jsonl (NDJSON)<br/> - Tim role=assistant cuoi<br/> - Trich xuat summary,<br/> tokens, model, duration<br/>3. extractProjectName(path)<br/>4. collectGitChanges(cwd)<br/> - git diff --name-status HEAD
    PR-->>AH: AgentEventResult

    AH->>AH: resolveSessionId<br/>tmuxTarget to sessionId

    AH->>AH: onStopHook(sessionId)<br/>Drain message queue

    AH->>RS: save(responseData)
    Note over RS: Generate ID (8 chars)<br/>Ghi ~/.ccpoke/responses/{id}.json<br/>Cleanup: xoa >24h, giu max 100
    RS-->>AH: id

    AH->>AH: Build response URL<br/>mini-app-url/response/?id={id}

    AH->>TG: sendNotification(data, url)
    Note over TG: Format MarkdownV2:<br/>📦 project-name<br/>🐾 Agent · ⏱ Duration<br/>Summary...<br/>📊 Tokens · 🤖 Model<br/>📝 Git changes

    TG->>TG: Split neu > 4096 chars
    TG->>TG: Build inline keyboard<br/>[View Details] [Chat]

    TG->>PH: bot.sendMessage()<br/>parse_mode: MarkdownV2

    Note over PH: User nhan notification<br/>voi summary, stats,<br/>git changes, 2 nut bam
```

### Chi tiet tung buoc

**Buoc 1: Claude Code trigger hook**

Khi Claude Code hoan thanh 1 response, no goi hook `Stop` da duoc cau hinh trong `~/.claude/settings.json`:

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "~/.ccpoke/hooks/claude-code-stop.sh"
      }]
    }]
  }
}
```

Claude Code truyen JSON qua **stdin** cho script:

```json
{
  "session_id": "abc-123-def",
  "transcript_path": "/Users/you/.claude/projects/2F...2F.../00001.jsonl",
  "cwd": "/Users/you/my-project"
}
```

**Buoc 2: Shell script gui HTTP request**

File `~/.ccpoke/hooks/claude-code-stop.sh` doc JSON tu stdin, lay tmux target, va `curl POST` den `http://127.0.0.1:9377/hook/stop` voi header `X-CCPoke-Secret`.

**Buoc 3: Express server nhan request**

- Kiem tra header `X-CCPoke-Secret` → khop `config.hook_secret`?
- Lay `agentName` tu query param (default: `"claude-code"`)
- `setImmediate(() => handler.handleStopEvent(...))` — fire-and-forget
- Return `200 OK` ngay lap tuc

> **Tai sao `setImmediate`?** De hook script khong bi timeout. Response tra ve ngay, xu ly nang chay async.

**Buoc 4: AgentHandler parse event** (`src/agent/agent-handler.ts`)

1. Lay provider tu `AgentRegistry` → `ClaudeCodeProvider`
2. Cho settle delay (`await sleep(500)`) — transcript file co the chua flush xong
3. `provider.parseEvent(rawEvent)`:
   - Validate: co `session_id`, `transcript_path`, `cwd`?
   - `parseTranscript(path)` — doc file `.jsonl`, parse NDJSON, trich xuat summary/tokens/model/duration
   - `extractProjectName(path)` — decode path → lay basename
   - `collectGitChanges(cwd)` — chay `git diff --name-status HEAD`
4. Resolve chat session (tmuxTarget → sessionId)
5. Drain message queue (neu co)
6. `responseStore.save()` → ghi file `~/.ccpoke/responses/{id}.json`
7. Build response URL cho Telegram Mini App
8. `channel.sendNotification(data, url)`

**Buoc 5: Telegram Channel format va gui** (`src/channel/telegram/`)

1. Format message (MarkdownV2) voi project name, agent, duration, summary, tokens, model, git changes
2. Split neu > 4096 chars (Telegram limit)
3. Build inline keyboard: `[View Details]` + `[Chat]`
4. `bot.sendMessage()` voi `parse_mode: "MarkdownV2"`
5. Fallback: neu MarkdownV2 loi → gui lai plain text

---

## 4. Flow 2: Two-Way Chat

**Kich ban:** User nhan nut "Chat" → go tin nhan → tin nhan duoc inject vao Claude Code session.

```mermaid
sequenceDiagram
    participant U as User<br/>(Phone)
    participant BOT as Telegram Bot
    participant PRS as PendingReply<br/>Store
    participant SSM as SessionState<br/>Manager
    participant TB as TmuxBridge
    participant CC as Claude Code<br/>(tmux)

    U->>BOT: Nhan nut 💬 Chat<br/>callback: chat:sess123
    BOT->>U: my-project<br/>force_reply: true
    BOT->>PRS: set(chatId, msgId, sess123, project)<br/>TTL: 10 phut

    U->>BOT: Reply: fix bug X
    BOT->>PRS: get(chatId, replyToMsgId)
    PRS-->>BOT: {sessionId: sess123, project}

    BOT->>SSM: injectMessage sess123, fix bug X

    alt Session IDLE
        SSM->>TB: sendKeys target, fix bug X
        TB->>CC: tmux send-keys fix bug X Enter
        SSM->>SSM: updateState to BUSY
        SSM-->>BOT: {sent: true}
        BOT->>U: ✅ Message sent to my-project
    else Session BUSY
        SSM->>SSM: enqueue message (max 20)
        SSM-->>BOT: {queued: true, position: 2}
        BOT->>U: ⏳ Queued (position 2)
    else Pane Dead
        SSM-->>BOT: {tmuxDead: true}
        BOT->>U: ❌ Session not found
    else User Typing on Desktop
        SSM-->>BOT: {desktopActive: true}
        BOT->>U: ⌨️ User is typing on desktop
    end
```

### Chi tiet tung buoc

**Buoc 1:** User nhan nut "💬 Chat" → Telegram gui `callback_query` voi `data: "chat:sess123"`.

**Buoc 2:** Bot gui prompt message voi `force_reply: true` → Telegram tu dong mo reply mode.

**Buoc 3:** Luu vao `PendingReplyStore` — key `"chatId:messageId"` → `{sessionId, project, createdAt}`. Tu xoa sau 10 phut (setTimeout).

**Buoc 4:** User go va gui tin nhan. Telegram gui message voi `reply_to_message.message_id` tro den prompt.

**Buoc 5:** Lookup `pendingReplyStore.get(chatId, replyToMessageId)` → lay sessionId.

**Buoc 6:** `sessionStateManager.injectMessage(sessionId, text)`:

```typescript
// session-state.ts
injectMessage(sessionId, text) {
  const session = sessionMap.getBySessionId(sessionId);
  if (!session) return { sessionNotFound: true };

  if (!isPaneAlive(session.tmuxTarget)) return { tmuxDead: true };

  if (tmuxBridge.hasUncommittedInput(session.tmuxTarget))
    return { desktopActive: true };

  // Session idle → gui ngay
  if (session.state === 'idle') {
    tmuxBridge.sendKeys(session.tmuxTarget, text);
    sessionMap.updateState(sessionId, 'busy');
    return { sent: true };
  }

  // Session busy → queue
  if (queue.length >= MAX_QUEUE_SIZE) return { queueFull: true };
  queue.push({ text, timestamp: Date.now() });
  return { queued: true, position: queue.length };
}
```

**Buoc 7:** `tmuxBridge.sendKeys()` escape shell metacharacters (`$ " \ ; `` `) va chay `tmux send-keys`. Claude Code nhan text input nhu user go truc tiep.

---

## 5. Flow 3: Session Lifecycle

### Phat hien session moi

Co **2 cach** session duoc dang ky:

```mermaid
flowchart LR
    subgraph ACTIVE["Cach 1: SessionStart Hook (chu dong)"]
        CC_START["Claude Code khoi dong"] --> HOOK_SS["Trigger SessionStart hook"]
        HOOK_SS --> CURL_SS["curl POST /hook/session-start<br/>Body: {session_id, cwd, tmux_target}"]
        CURL_SS --> HANDLER["agentHandler.handleSessionStart()"]
        HANDLER --> REG["sessionMap.register()"]
        REG --> SAVE["sessionMap.save<br/>ghi sessions.json"]
    end

    subgraph PASSIVE["Cach 2: Periodic Scan (thu dong, moi 15s)"]
        TIMER["setInterval 15s"] --> SCAN["scanClaudePanes()"]
        SCAN --> LIST["tmux list-panes -a"]
        LIST --> FILTER{"pane_title chua<br/>claude code?"}
        FILTER -->|"Co"| ADD["Them vao ket qua"]
        FILTER -->|"Khong"| TREE["buildProcessTree<br/>Tim process claude<br/>trong tree max depth 4"]
        TREE -->|"Tim thay"| ADD
        TREE -->|"Khong"| SKIP2["Bo qua pane nay"]
        ADD --> COMPARE["So sanh voi sessions hien tai"]
        COMPARE --> NEW["Pane moi, register"]
        COMPARE --> DEAD["Pane da chet, unregister"]
    end

    style ACTIVE fill:#0f3460,color:#e0e0e0
    style PASSIVE fill:#1a1a2e,color:#e0e0e0
```

### Session state machine

```mermaid
stateDiagram-v2
    [*] --> IDLE : register

    IDLE --> BUSY : injectMessage + sendKeys
    BUSY --> IDLE : onStopHook (agent xong)

    IDLE --> IDLE : onStopHook (queue rong)

    IDLE --> [*] : unregister (pane chet)
    BUSY --> [*] : unregister (pane chet)
```

**IDLE:** Co the nhan message moi va gui vao tmux ngay.
**BUSY:** Message moi se duoc enqueue (max 20).

---

## 6. Flow 4: Message Queue & Drain

Khi agent dang **busy** ma user gui nhieu tin nhan:

```mermaid
sequenceDiagram
    participant U as User
    participant Q as Message Queue
    participant CC as Claude Code
    participant SH as Stop Hook

    U->>Q: fix bug X - Agent busy
    Note over Q: Queue: [fix bug X]

    U->>Q: also check Y - Agent busy
    Note over Q: Queue: [fix bug X, also check Y]

    U->>Q: and test Z - Agent busy
    Note over Q: Queue: 3 messages, max 20

    CC->>SH: Xong response, Stop Hook trigger

    SH->>Q: onStopHook sessionId
    Note over Q: 1. Set state = IDLE<br/>2. Dequeue fix bug X<br/>3. sendKeys inject vao tmux<br/>4. Set state = BUSY
    Q-->>SH: drained true, remaining 2

    Note over CC: Nhan fix bug X<br/>Bat dau xu ly...

    CC->>SH: Xong response, Stop Hook trigger
    SH->>Q: onStopHook sessionId
    Note over Q: Dequeue also check Y
    Q-->>SH: drained true, remaining 1

    CC->>SH: Xong response, Stop Hook trigger
    SH->>Q: onStopHook sessionId
    Note over Q: Dequeue and test Z
    Q-->>SH: drained true, remaining 0

    CC->>SH: Xong response, Stop Hook trigger
    SH->>Q: onStopHook sessionId
    Q-->>SH: empty true
    Note over Q: Queue rong.<br/>Session o trang thai IDLE.
```

**Gioi han:**

| Thong so | Gia tri | Ghi chu |
|----------|---------|---------|
| `MAX_QUEUE_SIZE` | 20 messages | Tra ve `queueFull` neu vuot |
| `MAX_MESSAGE_LENGTH` | 10,000 chars | Per message |
| Persistence | Memory only | Mat neu restart bot |

---

## 7. Persistence — File nao ghi o dau

### Ban do file I/O

```mermaid
graph TB
    subgraph CCPOKE["~/.ccpoke/ -- Thu muc chinh"]
        CFG["config.json<br/>mode 0o600<br/>---<br/>telegram_bot_token<br/>user_id<br/>hook_port: 9377<br/>hook_secret: 32-byte hex<br/>locale: vi<br/>agents: claude-code"]
        STATE["state.json<br/>mode 0o600<br/>---<br/>chat_id: number"]
        SESSIONS["sessions.json<br/>---<br/>Array of:<br/>sessionId, tmuxTarget<br/>project, cwd<br/>state, lastActivity"]
        RESP_DIR["responses/<br/>---<br/>id.json files<br/>24h TTL, max 100"]
        HOOKS_DIR["hooks/<br/>---<br/>claude-code-stop.sh<br/>claude-code-session-start.sh"]
    end

    subgraph CLAUDE["~/.claude/ -- Thu muc Claude Code"]
        CLAUDE_SETTINGS["settings.json<br/>---<br/>hooks.Stop<br/>hooks.SessionStart"]
        CLAUDE_PROJECTS["projects/encoded/<br/>session.jsonl<br/>---<br/>Transcript NDJSON"]
    end

    subgraph CURSOR["~/.cursor/ -- Thu muc Cursor"]
        CURSOR_HOOKS["hooks.json"]
        CURSOR_PROJECTS["projects/.../transcript"]
    end

    CFG_R["Doc: startBot(), moi request"]
    CFG_W["Ghi: setup wizard, auto-repair"]
    CFG_R -.-> CFG
    CFG_W -.-> CFG

    STATE_R["Doc: TelegramChannel.initialize()"]
    STATE_W["Ghi: sau /start command"]
    STATE_R -.-> STATE
    STATE_W -.-> STATE

    SESS_R["Doc: boot (sessionMap.load())"]
    SESS_W["Ghi: moi 15s scan, register, shutdown"]
    SESS_R -.-> SESSIONS
    SESS_W -.-> SESSIONS

    RESP_W["Ghi: moi stop hook"]
    RESP_R["Doc: GET /api/responses/:id"]
    RESP_W -.-> RESP_DIR
    RESP_R -.-> RESP_DIR

    HOOKS_W["Ghi: setup / ensureAgentHooks()"]
    HOOKS_W -.-> HOOKS_DIR

    PARSER["Doc: ClaudeCodeParser.parseTranscript()"]
    PARSER -.-> CLAUDE_PROJECTS

    INSTALLER["Ghi: ClaudeCodeInstaller.installHook()"]
    INSTALLER -.-> CLAUDE_SETTINGS

    style CCPOKE fill:#0f3460,color:#e0e0e0
    style CLAUDE fill:#1a1a2e,color:#e0e0e0
    style CURSOR fill:#1a1a2e,color:#e0e0e0
```

### Ai doc/ghi file nao — Quick reference

| File | Doc boi | Ghi boi | Khi nao |
|------|---------|---------|---------|
| `~/.ccpoke/config.json` | `ConfigManager.load()` | Setup wizard, auto-repair | Boot, setup |
| `~/.ccpoke/state.json` | `TelegramChannel` | `TelegramChannel` | Boot, `/start` command |
| `~/.ccpoke/sessions.json` | `SessionMap.load()` | `SessionMap.save()` | Boot, moi 15s, register, shutdown |
| `~/.ccpoke/responses/{id}.json` | `GET /api/responses/:id` | `ResponseStore.save()` | Moi stop hook |
| `~/.ccpoke/hooks/*.sh` | Claude Code (exec) | `ClaudeCodeInstaller` | Setup, ensureHooks |
| `~/.claude/settings.json` | `ClaudeCodeInstaller` | `ClaudeCodeInstaller` | Setup, verify |
| `~/.claude/projects/**/*.jsonl` | `ClaudeCodeParser` | Claude Code (tu ghi) | Moi stop hook |

### Pattern ghi file an toan (Atomic Write)

```
1. writeFileSync(path + '.tmp', data)   ← Ghi vao file tam
2. renameSync(path + '.tmp', path)      ← Rename atomic
```

> **Tai sao?** Neu process crash giua chung, file goc khong bi corrupt. Chi file `.tmp` bi hong.

---

## 8. Module Dependency Map

```mermaid
graph TD
    INDEX["src/index.ts<br/>(orchestrator chinh)"]

    INDEX --> CFG_MGR["ConfigManager"]
    INDEX --> I18N["i18n"]
    INDEX --> API_SRV["ApiServer<br/>(Express)"]
    INDEX --> TG_CH["TelegramChannel"]
    INDEX --> AGENT_H["AgentHandler"]
    INDEX --> TMUX_S["Tmux Stack"]

    CFG_MGR --> PATHS["paths"]

    API_SRV --> AGENT_H
    API_SRV --> RESP_STORE["ResponseStore<br/>(file-based)"]

    TG_CH --> TG_SEND["TelegramSender"]
    TG_CH --> PRS2["PendingReplyStore"]
    TG_CH --> SSM2["SessionStateManager"]

    AGENT_H --> AG_REG["AgentRegistry"]
    AGENT_H --> RESP_STORE
    AGENT_H --> TUNNEL["TunnelManager"]
    AGENT_H --> CSR["ChatSessionResolver"]

    AG_REG --> CC_PROV["ClaudeCodeProvider"]
    AG_REG --> CUR_PROV["CursorProvider"]

    CC_PROV --> CC_PARSER["ClaudeCodeParser"]
    CC_PROV --> CC_INST["ClaudeCodeInstaller"]
    CC_PROV --> GIT_COLL["git-collector"]

    CUR_PROV --> CUR_PARSER["CursorParser"]
    CUR_PROV --> CUR_INST["CursorInstaller"]
    CUR_PROV --> GIT_COLL

    TMUX_S --> SM3["SessionMap"]
    TMUX_S --> SSM3["SessionStateManager"]
    TMUX_S --> TMUX_B["TmuxBridge"]
    TMUX_S --> TMUX_SC["TmuxScanner"]
    TMUX_S --> TMUX_R["TmuxSessionResolver"]

    SSM3 --> SM3
    SSM3 --> TMUX_B
    TMUX_R --> SM3
    TMUX_R --> SSM3
    SM3 --> TMUX_SC

    style INDEX fill:#e94560,color:#fff
    style API_SRV fill:#0f3460,color:#e0e0e0
    style TG_CH fill:#533483,color:#e0e0e0
    style AGENT_H fill:#0f3460,color:#e0e0e0
    style TMUX_S fill:#1a1a2e,stroke:#e94560,color:#e0e0e0
```

### Ai goi ai — Quick reference

| Caller | Callee | Khi nao |
|--------|--------|---------|
| `index.ts` | `ConfigManager.load()` | Boot |
| `index.ts` | `AgentProvider.installHook()` | Boot (ensure hooks) |
| `index.ts` | `SessionMap.load()` | Boot |
| `index.ts` | `SessionMap.startPeriodicScan()` | Boot |
| `index.ts` | `ApiServer.start()` | Boot |
| `index.ts` | `TelegramChannel.initialize()` | Boot |
| `ApiServer` | `AgentHandler.handleStopEvent()` | POST /hook/stop |
| `ApiServer` | `AgentHandler.handleSessionStart()` | POST /hook/session-start |
| `AgentHandler` | `AgentProvider.parseEvent()` | Stop hook |
| `AgentHandler` | `ChatSessionResolver.resolveSessionId()` | Stop hook |
| `AgentHandler` | `ResponseStore.save()` | Stop hook |
| `AgentHandler` | `NotificationChannel.sendNotification()` | Stop hook |
| `TelegramChannel` | `PendingReplyStore.set/get()` | Chat flow |
| `TelegramChannel` | `SessionStateManager.injectMessage()` | Chat flow |
| `SessionStateManager` | `TmuxBridge.sendKeys()` | Inject text |
| `SessionMap` | `TmuxScanner.scanClaudePanes()` | Periodic scan |

---

## 9. Security Model

```mermaid
graph TD
    subgraph L1["Layer 1: NETWORK ISOLATION"]
        NET["Express bind 127.0.0.1 ONLY<br/>Khong ai tu ngoai truy cap duoc port 9377"]
    end

    subgraph L2["Layer 2: HOOK SECRET"]
        SEC["X-CCPoke-Secret header<br/>32-byte hex random<br/>Chi hook script va config biet<br/>Validate tren moi request"]
    end

    subgraph L3["Layer 3: TELEGRAM USER WHITELIST"]
        USR["config.user_id<br/>Chi user_id nay moi dung duoc /start<br/>Chi user_id nay moi reply duoc<br/>Chi user_id nay moi bam nut duoc"]
    end

    subgraph L4["Layer 4: SHELL ESCAPING"]
        ESC["tmuxBridge.sendKeys escape<br/>Tat ca ky tu dac biet duoc escaped<br/>Chong shell injection qua tmux"]
    end

    subgraph L5["Layer 5: FILE PERMISSIONS"]
        FP["config.json, state.json mode 0o600<br/>Chi owner doc/ghi duoc<br/>Atomic write tmp + rename"]
    end

    L1 --> L2 --> L3 --> L4 --> L5

    style L1 fill:#e94560,color:#fff
    style L2 fill:#c23616,color:#fff
    style L3 fill:#0f3460,color:#e0e0e0
    style L4 fill:#1a1a2e,color:#e0e0e0
    style L5 fill:#533483,color:#e0e0e0
```

---

## Tong ket — Mot vong doi hoan chinh

```mermaid
flowchart TD
    A["1. Ban chay npx ccpoke<br/>Bot khoi dong, cai hook,<br/>scan tmux, listen port 9377"]
    B["2. Ban mo tmux, chay Claude Code<br/>SessionStart hook fire, session registered"]
    C["3. Ban yeu cau Claude Code<br/>implement feature X"]
    D["4. Claude Code xong, Stop hook fire<br/>Parse transcript, collect git, format"]
    E["5. Telegram gui notification<br/>my-project summary<br/>Nut View Details va Chat"]
    F["6. Ban bam Chat, go also add tests<br/>Message inject vao tmux"]
    G["7. Claude Code xong lan 2<br/>Drain queue, gui notification moi"]
    H["8. Lap lai tu buoc 6"]
    I["9. Ban tat bot (Ctrl+C)<br/>Graceful shutdown"]

    A --> B --> C --> D --> E --> F --> G --> H
    H -->|"Tiep tuc"| F
    H -->|"Xong"| I

    style A fill:#e94560,color:#fff
    style E fill:#533483,color:#fff
    style I fill:#0f3460,color:#e0e0e0
```
