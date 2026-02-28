# 🐾 ccpoke — AI Agent Notification Bridge

[English](./README.en.md) · [Tiếng Việt](./README.md)

> 当 AI agent（Claude Code、Cursor 等）完成响应时，通过 Telegram 接收通知——附带 git diff、处理时间和结果摘要。

---

## 解决的问题

你在电脑上使用 Claude Code 或 Cursor。出门只带手机，却不知道 AI agent 是否已完成、修改了哪些文件。

**ccpoke** 是 AI agent 与 Telegram 之间的轻量桥接——agent 完成后，你立即在手机上收到通知。

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

| | Claude Code | Cursor |
|---|---|---|
| Telegram 通知 | ✅ macOS · Linux · Windows | ✅ macOS · Linux · Windows |
| 双向聊天 (Telegram ↔ Agent) | ✅ macOS · Linux | ❌ |

通过插件架构轻松添加新 agent——欢迎贡献！

## 功能

- 🤖 **多 Agent** — 支持 Claude Code、Cursor 及更多
- 🔔 **自动通知** — AI agent 完成 → Telegram 立即推送
- 📂 **附带 Git diff** — 无需打开电脑即可查看文件变更
- ⏱ **处理时间** — 了解 agent 运行了多久
- 📝 **响应摘要** — 快速查看 agent 的回复内容
- 🔐 **用户白名单** — 仅授权用户可使用 bot
- 📄 **自动分页** — 长消息自动分页 `[1/N]`

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

Bot 启动后 → 正常使用 Claude Code / Cursor → 通知自动发送到 Telegram。

### Telegram 命令

| 命令      | 功能                                          |
|-----------|-----------------------------------------------|
| `/start`  | 重新注册聊天（设置时自动完成，很少需要）      |
| `/ping`   | 检查 bot 是否在线                             |
| `/status` | 查看 bot 状态                                 |

### 通知示例

```
🤖 Claude Code Response
📂 my-project | ⏱ 45s

修复了 login.go 中的认证 bug。主要变更：
- 修复第 42 行缺失的错误检查
- 添加输入验证...

📂 Changes:
✏️ src/login.go
➕ src/validator.go
❌ src/old_auth.go
```

## 卸载

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
