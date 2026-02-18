# 🤖 ccbot — Claude Code ↔ Telegram Notification Bot

[English](./README.en.md)

> Nhận thông báo Telegram khi Claude Code hoàn thành response — kèm git diff, thời gian xử lý, và tóm tắt kết quả.

---

## Vấn đề giải quyết

Bạn đang dùng Claude Code trên máy tính. Ra ngoài cầm điện thoại nhưng không biết Claude Code đã xong chưa, thay đổi file nào.

**ccbot** là cầu nối nhẹ giữa Claude Code và Telegram — khi Claude Code xong việc, bạn nhận notification ngay trên điện thoại.

```
Claude Code xong response
        ↓
  Stop Hook trigger
        ↓
  ccbot nhận event
        ↓
  Telegram notification 📱
```

## Tính năng

- 🔔 **Notification tự động** — Claude Code xong → Telegram nhận tin ngay
- 📂 **Git diff kèm theo** — biết file nào thay đổi mà không cần mở máy tính
- ⏱ **Thời gian xử lý** — biết Claude Code chạy bao lâu
- 📝 **Tóm tắt response** — xem nhanh Claude Code trả lời gì
- 🔐 **Whitelist user** — chỉ user được phép mới dùng được bot
- 📄 **Auto-split message** — response dài tự động chia page `[1/N]`

## Yêu cầu

- **Node.js** ≥ 18
- **pnpm** (hoặc npm/yarn)
- **Telegram Bot Token** — tạo từ [@BotFather](https://t.me/BotFather)
- **Telegram User ID** — lấy từ [@userinfobot](https://t.me/userinfobot)

## Bắt đầu

### Cách 1: Global install (khuyến nghị)

```bash
pnpm add -g ccbot
ccbot setup
```

### Cách 2: npx (không cần cài)

```bash
npx ccbot setup
```

### Cách 3: Clone repo (cho development)

```bash
git clone https://github.com/palooza-kaida/ccbot.git
cd ccbot
pnpm install
pnpm setup
```

Setup wizard sẽ hướng dẫn từng bước:

```
┌  🤖 ccbot setup
│
◇  Telegram Bot Token
│  your-bot-token
│
◇  Your Telegram User ID
│  your-user-id
│
◆  Config saved
◆  Hook installed → ~/.claude/settings.json
◆  Chat ID registered
│
└  🎉 Setup complete!
```

<details>
<summary>Thiết lập thủ công (không dùng wizard)</summary>

Tạo file `~/.ccbot/config.json`:

```json
{
  "telegram_bot_token": "123456:ABC-xxx",
  "user_id": 123456789,
  "hook_port": 9377
}
```

Sau đó chạy `ccbot setup` để cài hook và đăng ký chat ID.

</details>

## Sử dụng

### Khởi động bot

```bash
# Global install
ccbot

# Hoặc npx
npx ccbot

# Hoặc local dev
pnpm dev
```

Bot chạy xong → dùng Claude Code bình thường → notification tự đến Telegram.

### Telegram Commands

| Command   | Chức năng                                       |
|-----------|---------------------------------------------------|
| `/start`  | Đăng ký lại chat (tự động khi setup, ít khi cần) |
| `/ping`   | Kiểm tra bot còn sống không                      |
| `/status` | Xem trạng thái bot                               |

### Notification mẫu

```
🤖 Claude Code Response
📂 my-project | ⏱ 45s

Đã sửa bug authentication trong login.go. Thay đổi chính:
- Fix missing error check ở dòng 42
- Thêm input validation...

📂 Changes:
✏️ src/login.go
➕ src/validator.go
❌ src/old_auth.go
```

## Gỡ cài đặt

```bash
ccbot uninstall
```

```
┌  🗑️  Uninstalling ccbot
│
◆  Hook removed from ~/.claude/settings.json
◆  Removed ~/.ccbot/ (config, state, hooks)
│
└  ccbot uninstalled
```

## License

MIT
