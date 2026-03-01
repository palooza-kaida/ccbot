# 🐾 ccpoke — AI Agent Notification Bridge

[English](./README.en.md) · [Tiếng Việt](./README.md)

> 通过 Telegram 与 Claude Code、Codex CLI、Cursor CLI 等 AI 代理双向交互——随时随地编程。

---

## 解决的问题

你在电脑上使用 Claude Code、Codex CLI 或 Cursor CLI。出门只带手机，却不知道 AI agent 是否已完成，想发送更多提示却不想打开电脑。

**ccpoke** 是 AI agent 与 Telegram 之间的双向桥接——接收通知、发送提示、回答问题、管理多个会话——全部通过手机完成。

```
AI agent 完成响应
        ↓
  Stop Hook 触发
        ↓
  ccpoke 接收事件
        ↓
  Telegram 通知 📱
```

## 支持的 Agent

| | Claude Code | Codex CLI | Cursor CLI |
|---|---|---|---|
| Telegram 通知 | ✅ macOS · Linux · Windows | ✅ macOS · Linux · Windows | ✅ macOS · Linux · Windows |
| 双向聊天 (Telegram ↔ Agent) | ✅ macOS · Linux | ✅ macOS · Linux | ✅ macOS · Linux |

通过插件架构轻松添加新 agent——欢迎贡献！

## 功能

- 🔔 **推送通知** — AI 代理完成 → 立即推送通知，无轮询，无延迟
- 💬 **双向交互** — 从 Telegram 与 AI 代理聊天，查看会话、发送提示、回答问题、审批权限
- 🔀 **多会话** — 同时管理多个 AI 代理会话，快速切换，并行监控

## 前置要求

- **Node.js** ≥ 20
- **Telegram Bot Token** — 从 [@BotFather](https://t.me/BotFather) 创建

## 快速开始

### 方式一：npx（推荐——零安装）

```bash
npx -y ccpoke
```

首次运行 → 自动设置 → 启动 bot。一条命令搞定。

### 方式二：全局安装（日常使用，启动更快）

```bash
npm i -g ccpoke
ccpoke
```

### 方式三：克隆仓库（用于开发）

```bash
git clone https://github.com/kaida-palooza/ccpoke.git
cd ccpoke
pnpm install
pnpm dev
```

设置向导将逐步引导你：

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
◇  选择 AI agents（按空格选择）
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
<summary>手动设置（不使用向导）</summary>

创建文件 `~/.ccpoke/config.json`：

```json
{
  "telegram_bot_token": "123456:ABC-xxx",
  "user_id": 123456789,
  "hook_port": 9377
}
```

然后运行 `ccpoke setup` 安装 hook 并注册 chat ID。

</details>

## 使用方法

### 启动 bot

```bash
# npx（零安装）
npx -y ccpoke

# 或全局安装
ccpoke

# 或本地开发
pnpm dev
```

Bot 启动后 → 正常使用 Claude Code / Codex CLI / Cursor CLI → 通知自动发送到 Telegram。

### Telegram 命令

| 命令        | 功能                                          |
|-------------|-----------------------------------------------|
| `/start`    | 重新注册聊天（设置时自动完成，很少需要）      |
| `/sessions` | 查看活跃的 AI 代理会话                        |
| `/projects` | 查看项目列表并启动新会话                      |

### 通知示例

```
🤖 Claude Code Response
📂 my-project | ⏱ 45s

修复了 login.go 中的认证 bug。主要变更：
- 修复第 42 行缺失的错误检查
- 添加输入验证...
```

## 卸载

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
