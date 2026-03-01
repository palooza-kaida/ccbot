# 🐾 ccpoke — AI Agent Notification Bridge

[English](./README.en.md) · [中文](./README.zh.md)

> Tương tác 2 chiều với Claude Code, Codex CLI, Cursor CLI và nhiều AI agent khác qua Telegram — code mọi lúc mọi nơi.

---

## Vấn đề giải quyết

Bạn đang dùng Claude Code, Codex CLI hoặc Cursor CLI trên máy tính. Ra ngoài cầm điện thoại nhưng không biết AI agent đã xong chưa, muốn gửi prompt thêm mà không cần mở laptop.

**ccpoke** là cầu nối 2 chiều giữa AI agents và Telegram — nhận thông báo, gửi prompt, trả lời câu hỏi, quản lý nhiều session — tất cả từ điện thoại.

```
AI agent xong response
        ↓
  Stop Hook trigger
        ↓
  ccpoke nhận event
        ↓
  Telegram notification 📱
```

## Hỗ trợ Agent

| | Claude Code | Codex CLI | Cursor CLI |
|---|---|---|---|
| Notification Telegram | ✅ macOS · Linux · Windows | ✅ macOS · Linux · Windows | ✅ macOS · Linux · Windows |
| Chat 2 chiều (Telegram ↔ Agent) | ✅ macOS · Linux | ✅ macOS · Linux | ✅ macOS · Linux |

Thêm agent mới qua kiến trúc plugin — contributions welcome!

## Tính năng

- 🔔 **Thông báo đẩy** — AI agent xong → Telegram nhận tin ngay, không polling, không delay
- 💬 **Tương tác 2 chiều** — chat với AI agent từ Telegram, xem sessions, gửi prompt, trả lời câu hỏi, phê duyệt quyền
- 🔀 **Đa phiên** — quản lý nhiều session AI agent cùng lúc, chuyển đổi nhanh, giám sát song song

## Yêu cầu

- **Node.js** ≥ 20
- **Telegram Bot Token** — tạo từ [@BotFather](https://t.me/BotFather)

## Bắt đầu

### Cách 1: npx (khuyến nghị — zero install)

```bash
npx -y ccpoke
```

Lần đầu chạy → tự động setup → start bot. Một lệnh duy nhất.

### Cách 2: Global install (dùng hàng ngày, khởi động nhanh hơn)

```bash
npm i -g ccpoke
ccpoke
```

### Cách 3: Clone repo (cho development)

```bash
git clone https://github.com/kaida-palooza/ccpoke.git
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
◇  Chọn AI agents (ấn cách để chọn)
│  Claude Code, Codex CLI, Cursor CLI
│
◆  Config saved
◆  Hook installed for Claude Code
◆  Hook installed for Codex CLI
◆  Hook installed for Cursor CLI
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
npx -y ccpoke

# Hoặc global install
ccpoke

# Hoặc local dev
pnpm dev
```

Bot chạy xong → dùng Claude Code / Codex CLI / Cursor CLI bình thường → notification tự đến Telegram.

### Telegram Commands

| Command     | Chức năng                                         |
|-------------|---------------------------------------------------|
| `/start`    | Đăng ký lại chat (tự động khi setup, ít khi cần) |
| `/sessions` | Xem danh sách sessions AI agent đang hoạt động    |
| `/projects` | Xem danh sách projects và mở session mới          |

### Notification mẫu

```
🤖 Claude Code Response
📂 my-project | ⏱ 45s

Đã sửa bug authentication trong login.go. Thay đổi chính:
- Fix missing error check ở dòng 42
- Thêm input validation...
```

## Gỡ cài đặt

```bash
ccpoke uninstall
```

```
┌  🗑️  Uninstalling ccpoke
│
◆  Hook removed from Claude Code
◆  Hook removed from Codex CLI
◆  Hook removed from Cursor CLI
◆  Removed ~/.ccpoke/ (config, state, hooks)
│
└  ccpoke uninstalled
```

## License

MIT

## Contributors
<a href="https://github.com/lethai2597">
  <img src="https://github.com/lethai2597.png" width="50" />
</a>
<a href="https://github.com/kaida-palooza">
  <img src="https://github.com/kaida-palooza.png" width="50" />
</a>
