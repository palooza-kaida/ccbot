# 📖 CLI Commands

> Chi tiết từng command của ccpoke CLI.

---

## Mục lục

| Command | Mô tả |
|---------|-------|
| [`ccpoke`](#ccpoke) | Khởi động bot |
| [`ccpoke setup`](#ccpoke-setup) | Thiết lập cấu hình (interactive) |
| [`ccpoke uninstall`](#ccpoke-uninstall) | Gỡ toàn bộ ccpoke |

---

## `ccpoke`

```bash
ccpoke
```

Khởi động bot — lắng nghe hook từ Claude Code và gửi notification qua Telegram.

**Flow:**

1. Đọc config từ `~/.ccpoke/config.json`
2. Khởi tạo Telegram Bot (polling mode)
3. Khởi tạo Hook Server (Express) trên `127.0.0.1:{hook_port}`
4. Đợi event từ Claude Code → gửi notification

**Endpoints:**

| Method | Path | Mô tả |
|--------|------|-------|
| `POST` | `/hook/stop` | Nhận Stop event từ Claude Code (cần header `X-CCPoke-Secret`) |
| `GET` | `/health` | Health check |

**Telegram commands:**

| Command | Response |
|---------|----------|
| `/start` | Đăng ký lại chat ID (thường không cần) |
| `/ping` | `pong 🏓` |
| `/status` | `🟢 ccpoke đang chạy` |

**Yêu cầu:** Phải chạy `ccpoke setup` trước.

---

## `ccpoke setup`

```bash
ccpoke setup
```

Wizard thiết lập — hỏi thông tin, lưu config, cài hook, đăng ký chat ID.

**Flow:**

1. Load config cũ (nếu có) → hiện giá trị hiện tại
2. Prompt **Bot Token** — Enter để giữ nguyên, hoặc nhập mới
3. Prompt **User ID** — Enter để giữ nguyên, hoặc nhập mới
4. Tự động giữ `hook_port` (mặc định `9377`) và `hook_secret`
5. Lưu config → `~/.ccpoke/config.json`
6. Cài hook → `~/.claude/settings.json` + tạo `~/.ccpoke/hooks/stop-notify.sh`
7. Đăng ký chat ID → `~/.ccpoke/state.json`

**Files được tạo/cập nhật:**

| File | Mô tả |
|------|-------|
| `~/.ccpoke/config.json` | Config (token, user_id, port, secret) |
| `~/.ccpoke/state.json` | Chat ID cho Telegram notification |
| `~/.ccpoke/hooks/stop-notify.sh` | Script hook được Claude Code gọi |
| `~/.claude/settings.json` | Đăng ký hook vào Claude Code |

**Idempotent:** Chạy lại bao nhiêu lần cũng an toàn. Nhấn Enter để giữ nguyên giá trị cũ.

---

## `ccpoke uninstall`

```bash
ccpoke uninstall
```

Gỡ toàn bộ ccpoke — xóa hook, config, state.

**Flow:**

1. Gỡ hook khỏi `~/.claude/settings.json`
2. Xóa toàn bộ `~/.ccpoke/` (config, state, hooks)
3. In hướng dẫn gỡ global package

**Output mẫu:**

```
🗑️  Uninstalling ccpoke...

✅ Hook removed from ~/.claude/settings.json
✅ Removed ~/.ccpoke/ (config, state, hooks)

🎉 ccpoke uninstalled

To also remove the package:
  pnpm remove -g ccpoke
```

---

## Cơ chế Hook

```
Claude Code hoàn thành response
  → Trigger Stop hook
    → Chạy ~/.ccpoke/hooks/stop-notify.sh
      → curl POST tới localhost:{port}/hook/stop
        → ccpoke nhận request
          → Parse transcript, git changes
            → Gửi Telegram notification
```

---

## Filesystem

```
~/.ccpoke/
├── config.json              ← Tạo bởi: setup
├── state.json               ← Tạo bởi: setup, /start
└── hooks/
    └── stop-notify.sh       ← Tạo bởi: setup

~/.claude/
└── settings.json            ← Sửa bởi: setup, uninstall
```
