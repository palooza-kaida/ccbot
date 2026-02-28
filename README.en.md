# 🐾 ccpoke — AI Agent Notification Bridge

[Tiếng Việt](./README.md) · [中文](./README.zh.md)

> Get Telegram notifications when your AI agent (Claude Code, Cursor, ...) completes a response — with git diff, processing time, and result summary.

---

## Problem

You're using Claude Code or Cursor on your computer. You step away with your phone but have no idea if the AI agent is done yet or what files it changed.

**ccpoke** is a lightweight bridge between AI agents and Telegram — when any agent finishes, you get a notification right on your phone.

```
AI agent completes response
        ↓
  Stop Hook triggers
        ↓
  ccpoke receives event
        ↓
  Telegram notification 📱
```

## Supported Agents

| | Claude Code | Cursor |
|---|---|---|
| Telegram notifications | ✅ macOS · Linux · Windows | ✅ macOS · Linux · Windows |
| 2-way chat (Telegram ↔ Agent) | ✅ macOS · Linux | ❌ |

Adding new agents is easy via the plugin architecture — contributions welcome!

## Features

- 🤖 **Multi-agent** — supports Claude Code, Cursor and more
- 🔔 **Auto notification** — AI agent finishes → Telegram notifies you instantly
- 📂 **Git diff included** — see changed files without opening your computer
- ⏱ **Processing time** — know how long the agent took
- 📝 **Response summary** — quick glance at what the agent replied
- 🔐 **User whitelist** — only authorized users can use the bot
- 📄 **Auto-split messages** — long responses are automatically paginated `[1/N]`

## Requirements

- **Node.js** ≥ 20
- **Telegram Bot Token** — create from [@BotFather](https://t.me/BotFather)

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
git clone https://github.com/kaida-palooza/ccpoke.git
cd ccpoke
pnpm install
pnpm dev
```

The setup wizard will guide you step by step:

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
◇  Select AI agents (space to toggle)
│  Claude Code, Cursor
│
◆  Config saved
◆  Hook installed for Claude Code
◆  Hook installed for Cursor
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

Once running, use Claude Code / Cursor as usual → notifications will arrive on Telegram.

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
◆  Hook removed from Claude Code
◆  Hook removed from Cursor
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
