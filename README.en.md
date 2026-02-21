# 🤖 ccpoke — Claude Code ↔ Telegram Notification Bot

[Tiếng Việt](./README.md)

> Get Telegram notifications when Claude Code completes a response — with git diff, processing time, and result summary.

---

## Problem

You're using Claude Code on your computer. You step away with your phone but have no idea if Claude Code is done yet or what files it changed.

**ccpoke** is a lightweight bridge between Claude Code and Telegram — when Claude Code finishes, you get a notification right on your phone.

```
Claude Code completes response
        ↓
  Stop Hook triggers
        ↓
  ccpoke receives event
        ↓
  Telegram notification 📱
```

## Features

- 🔔 **Auto notification** — Claude Code finishes → Telegram notifies you instantly
- 📂 **Git diff included** — see changed files without opening your computer
- ⏱ **Processing time** — know how long Claude Code took
- 📝 **Response summary** — quick glance at what Claude Code replied
- 🔐 **User whitelist** — only authorized users can use the bot
- 📄 **Auto-split messages** — long responses are automatically paginated `[1/N]`

## Requirements

- **Node.js** ≥ 18
- **Telegram Bot Token** — create from [@BotFather](https://t.me/BotFather)
- **Telegram User ID** — get from [@userinfobot](https://t.me/userinfobot)

## Getting Started

### Option 1: npx (recommended — zero install)

```bash
npx ccpoke
```

First run → auto setup → start bot. One command, that's it.

### Option 2: Global install (daily use, faster startup)

```bash
npm i -g ccpoke
ccpoke
```

### Option 3: Clone repo (for development)

```bash
git clone https://github.com/palooza-kaida/ccpoke.git
cd ccpoke
pnpm install
pnpm dev
```

The setup wizard will guide you step by step:

```
┌  🤖 ccpoke setup
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
<summary>Manual setup (without wizard)</summary>

Create `~/.ccpoke/config.json`:

```json
{
  "telegram_bot_token": "123456:ABC-xxx",
  "user_id": 123456789,
  "hook_port": 9377
}
```

Then run `ccpoke setup` to install the hook and register your chat ID.

</details>

## Usage

### Start the bot

```bash
# npx (zero install)
npx ccpoke

# Or global install
ccpoke

# Or local dev
pnpm dev
```

Once running, use Claude Code as usual → notifications will arrive on Telegram.

### Telegram Commands

| Command   | Description                                         |
|-----------|-----------------------------------------------------|
| `/start`  | Re-register chat (auto during setup, rarely needed) |
| `/ping`   | Check if bot is alive                               |
| `/status` | View bot status                                     |

### Sample Notification

```
🤖 Claude Code Response
📂 my-project | ⏱ 45s

Fixed authentication bug in login.go. Main changes:
- Fix missing error check at line 42
- Add input validation...

📂 Changes:
✏️ src/login.go
➕ src/validator.go
❌ src/old_auth.go
```

## Uninstall

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
