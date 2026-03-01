# 📖 CLI Commands

> Chi tiết từng command của ccpoke CLI.

---

## Mục lục

| Command | Mô tả |
|---------|-------|
| [`ccpoke`](#ccpoke) | Khởi động bot |
| [`ccpoke setup`](#ccpoke-setup) | Thiết lập cấu hình (interactive) |
| [`ccpoke update`](#ccpoke-update) | Cập nhật hooks |
| [`ccpoke project`](#ccpoke-project) | Quản lý project paths |
| [`ccpoke uninstall`](#ccpoke-uninstall) | Gỡ toàn bộ ccpoke |
| [`ccpoke help`](#ccpoke-help) | Hiện trợ giúp |

---

## `ccpoke`

```bash
ccpoke
```

Khởi động bot — lắng nghe hook từ AI agents và gửi notification qua Telegram.

**Flow:**

1. Đọc config từ `~/.ccpoke/config.json`
2. `ensureAgentHooks()` — kiểm tra + sửa hook cho từng agent
3. Khởi tạo tmux stack (SessionMap, TmuxBridge, Scanner)
4. Khởi tạo Hook Server (Express) trên `127.0.0.1:{hook_port}`
5. Khởi tạo Tunnel (cloudflared, tự động nếu cần)
6. Khởi tạo Telegram Bot (polling mode)
7. Cài shell tab completion (idempotent)

**Endpoints:**

| Method | Path | Mô tả |
|--------|------|-------|
| `POST` | `/hook/stop?agent={name}` | Stop event từ agent (cần `X-CCPoke-Secret`) |
| `POST` | `/hook/session-start` | Session start hook |
| `POST` | `/hook/notification` | Notification hook |
| `POST` | `/hook/ask-user-question` | AskUserQuestion forwarding |
| `POST` | `/hook/permission-request` | Tool-use permission approve/deny |
| `GET`  | `/api/responses/:id` | Response detail viewer |
| `GET`  | `/health` | Health check |

**Telegram commands:**

| Command | Response |
|---------|----------|
| `/start` | Đăng ký lại chat ID (thường không cần) |
| `/sessions` | Danh sách sessions AI agent đang hoạt động |
| `/projects` | Danh sách projects đã cấu hình, mở session mới |

**Yêu cầu:** Phải chạy `ccpoke setup` trước.

---

## `ccpoke setup`

```bash
ccpoke setup
```

Wizard thiết lập — hỏi thông tin, lưu config, cài hook, đăng ký chat ID.

**Flow:**

1. Load config cũ (nếu có) → hiện giá trị hiện tại
2. Prompt **Language** — EN/VI/ZH
3. Prompt **Bot Token** — Enter để giữ nguyên, hoặc nhập mới
4. Scan QR / click link để connect Telegram
5. Chọn **AI agents** (Claude Code, Codex CLI, Cursor CLI)
6. Lưu config → `~/.ccpoke/config.json`
7. Cài hook cho từng agent đã chọn:
   - Claude Code → `~/.claude/settings.json` + tạo hook scripts
   - Codex CLI → `~/.codex/config.toml` + tạo hook script
   - Cursor CLI → `~/.cursor/hooks.json` + tạo hook script
8. Đăng ký chat ID → `~/.ccpoke/state.json`

**Files được tạo/cập nhật:**

| File | Mô tả |
|------|-------|
| `~/.ccpoke/config.json` | Config (token, user_id, port, secret, agents, language) |
| `~/.ccpoke/state.json` | Chat ID cho Telegram notification |
| `~/.ccpoke/hooks/claude-code-*.sh` | Hook scripts cho Claude Code |
| `~/.ccpoke/hooks/codex-stop.sh` | Hook script cho Codex CLI |
| `~/.ccpoke/hooks/cursor-stop.sh` | Hook script cho Cursor CLI |
| `~/.claude/settings.json` | Đăng ký hooks vào Claude Code |
| `~/.codex/config.toml` | Đăng ký notify hook vào Codex CLI |
| `~/.cursor/hooks.json` | Đăng ký stop hook vào Cursor CLI |

**Idempotent:** Chạy lại bao nhiêu lần cũng an toàn.

---

## `ccpoke update`

```bash
ccpoke update
```

Cập nhật hooks cho tất cả agents đã cấu hình. Hữu ích khi hook scripts bị hỏng hoặc sau khi upgrade ccpoke.

---

## `ccpoke project`

```bash
ccpoke project
```

Quản lý danh sách project paths. Cho phép thêm/xóa project directories để khởi chạy agent từ Telegram qua lệnh `/projects`.

**Tính năng:**
- Interactive path input với tab-completion (filesystem)
- Lưu vào `config.json` → field `projects`

---

## `ccpoke uninstall`

```bash
ccpoke uninstall
```

Gỡ toàn bộ ccpoke — xóa hook, config, state.

**Flow:**

1. Gỡ hooks khỏi từng agent config (settings.json, config.toml, hooks.json)
2. Xóa toàn bộ `~/.ccpoke/` (config, state, hooks, responses)
3. In hướng dẫn gỡ global package

---

## `ccpoke help`

```bash
ccpoke help
ccpoke --help
ccpoke -h
```

Hiện danh sách commands và usage.

---

## Cơ chế Hook

```
AI Agent hoàn thành response
  → Trigger hook (Stop/SessionStart/Notification/PreToolUse/PermissionRequest)
    → Chạy ~/.ccpoke/hooks/{agent}-{hook-type}.sh
      → curl POST tới localhost:{port}/hook/{type}
        → ccpoke nhận request
          → Parse event, resolve session
            → Gửi Telegram notification / inline keyboard
```

---

## Filesystem

```
~/.ccpoke/
├── config.json              ← Config (token, user_id, port, secret, agents, projects)
├── state.json               ← Chat ID
├── sessions.json            ← Active tmux sessions (auto-updated)
├── responses/               ← Response detail files (24h TTL, max 100)
│   └── {id}.json
└── hooks/
    ├── claude-code-stop.sh
    ├── claude-code-session-start.sh
    ├── claude-code-notification.sh
    ├── claude-code-pre-tool-use.sh
    ├── claude-code-permission-request.sh
    ├── codex-stop.sh
    └── cursor-stop.sh

~/.claude/
└── settings.json            ← Hook registrations (Stop, SessionStart, Notification, PreToolUse)

~/.codex/
└── config.toml              ← notify = [...] hook registration

~/.cursor/
└── hooks.json               ← Stop hook registration
```
