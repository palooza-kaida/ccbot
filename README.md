# 🤖 ccpoke — Claude Code ↔ Telegram Notification Bot

[English](./README.en.md)

> Nhận thông báo Telegram khi Claude Code hoàn thành response — kèm git diff, thời gian xử lý, và tóm tắt kết quả.

---

## Vấn đề giải quyết

Bạn đang dùng Claude Code trên máy tính. Ra ngoài cầm điện thoại nhưng không biết Claude Code đã xong chưa, thay đổi file nào.

**ccpoke** là cầu nối nhẹ giữa Claude Code và Telegram — khi Claude Code xong việc, bạn nhận notification ngay trên điện thoại.

```
Claude Code xong response
        ↓
  Stop Hook trigger
        ↓
  ccpoke nhận event
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
- **Telegram Bot Token** — tạo từ [@BotFather](https://t.me/BotFather)

## Bắt đầu

### Cách 1: npx (khuyến nghị — zero install)

```bash
npx ccpoke
```

Lần đầu chạy → tự động setup → start bot. Một lệnh duy nhất.

### Cách 2: Global install (dùng hàng ngày, khởi động nhanh hơn)

```bash
npm i -g ccpoke
ccpoke
```

### Cách 3: Clone repo (cho development)

```bash
git clone https://github.com/palooza-kaida/ccpoke.git
cd ccpoke
pnpm install
pnpm dev
```

Setup wizard sẽ hướng dẫn từng bước:

```
┌  🤖 ccpoke setup
│
◇  Language
│  English
│
◇  Telegram Bot Token
│  your-bot-token
│
◇  ✓ Bot: @your_bot
│
◇  Scan QR or open link to connect:
│  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
│  █ ▄▄▄▄▄ █▄▄████▀ ▄██▄▄█ ▄▄▄▄▄ █
│  █ █   █ █ ▀█ ▄▄▄▄▀▀▄▀ █ █   █ █
│  █ █▄▄▄█ █▄ ▄▄▀▄▀██▄  ▄█ █▄▄▄█ █
│  █▄▄▄▄▄▄▄█▄▀▄▀▄▀ █▄▀▄█▄█▄▄▄▄▄▄▄█
│  ...
│  █▄▄▄▄▄▄▄█▄███▄█▄███▄▄▄▄███▄█▄██
│  https://t.me/your_bot?start=setup
│
◇  Waiting for you to send /start to the bot...
│
◆  ✓ Connected! User ID: 123456789
│
◆  Config saved
◆  Hook installed → ~/.claude/settings.json
◆  Chat ID registered
│
└  🎉 Setup complete!
```

<details>
<summary>Thiết lập thủ công (không dùng wizard)</summary>

Tạo file `~/.ccpoke/config.json`:

```json
{
  "telegram_bot_token": "123456:ABC-xxx",
  "user_id": 123456789,
  "hook_port": 9377
}
```

Sau đó chạy `ccpoke setup` để cài hook và đăng ký chat ID.

</details>

## Sử dụng

### Khởi động bot

```bash
# npx (zero install)
npx ccpoke

# Hoặc global install
ccpoke

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
ccpoke uninstall
```

```
┌  🗑️  Uninstalling ccpoke
│
◆  Hook removed from ~/.claude/settings.json
◆  Removed ~/.ccpoke/ (config, state, hooks)
│
└  ccpoke uninstalled
```

## License

MIT
