# 🐾 ccpoke — AI Agent Notification Bridge

[Tiếng Việt](./README.md) · [中文](./README.zh.md)

> Two-way interaction with Claude Code, Codex CLI, Cursor CLI and more via Telegram — code anytime, anywhere.

---

## Problem

You're using Claude Code, Codex CLI or Cursor CLI on your computer. You step away with your phone but have no idea if the AI agent is done yet, and you want to send more prompts without opening your laptop.

**ccpoke** is a two-way bridge between AI agents and Telegram — receive notifications, send prompts, answer questions, manage multiple sessions — all from your phone.

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

| | Claude Code | Codex CLI | Cursor CLI |
|---|---|---|---|
| Telegram notifications | ✅ macOS · Linux · Windows | ✅ macOS · Linux · Windows | ✅ macOS · Linux · Windows |
| 2-way chat (Telegram ↔ Agent) | ✅ macOS · Linux | ✅ macOS · Linux | ✅ macOS · Linux |

Adding new agents is easy via the plugin architecture — contributions welcome!

## Features

- 🔔 **Push notification** — AI agent done → notification pushed instantly, no polling, no delay
- 💬 **Two-way interaction** — chat with your AI agent from Telegram, view sessions, send prompts, answer questions, approve permissions
- 🔀 **Multi-session** — manage multiple AI agent sessions simultaneously, switch quickly, parallel monitoring

## Requirements

- **Node.js** ≥ 20
- **Telegram Bot Token** — create from [@BotFather](https://t.me/BotFather)

## Getting Started

### Option 1: npx (recommended — zero install)

```bash
npx -y ccpoke
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
npx -y ccpoke

# Or global install
ccpoke

# Or local dev
pnpm dev
```

Once running, use Claude Code / Codex CLI / Cursor CLI as usual → notifications will arrive on Telegram.

### Telegram Commands

| Command     | Description                                         |
|-------------|-----------------------------------------------------|
| `/start`    | Re-register chat (auto during setup, rarely needed) |
| `/sessions` | View active AI agent sessions                       |
| `/projects` | View project list and start new sessions            |

### Sample Notification

```
🤖 Claude Code Response
📂 my-project | ⏱ 45s

Fixed authentication bug in login.go. Main changes:
- Fix missing error check at line 42
- Add input validation...
```

## Uninstall

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
