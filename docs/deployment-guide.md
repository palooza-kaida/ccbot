# Deployment Guide

This guide covers installation, configuration, and deployment options for ccpoke.

---

## Installation Methods

### Method 1: npx (Recommended - Zero Install)

**Best for:** First-time users, trying it out, minimal overhead

```bash
npx ccpoke
```

**What happens:**
1. npm downloads ccpoke from registry (1-2 MB)
2. Runs setup wizard
3. Downloads and installs dependencies
4. Starts bot

**Advantages:**
- ✅ No global installation
- ✅ Always latest version
- ✅ No disk footprint after exit
- ✅ Works immediately

**Disadvantages:**
- ⚠️ Slower startup (downloads on first run)
- ⚠️ Requires Node.js installed

---

### Method 2: Global npm Installation

**Best for:** Daily usage, faster startup

```bash
npm install -g ccpoke
ccpoke
```

**What happens:**
1. npm installs ccpoke globally (~50 MB)
2. Creates command `ccpoke` in PATH
3. Run anytime: `ccpoke`

**Advantages:**
- ✅ Faster startup (2-3s vs 10-15s with npx)
- ✅ Available anywhere in terminal
- ✅ Consistent version between runs

**Disadvantages:**
- ⚠️ Takes disk space
- ⚠️ Manual updates needed (`npm update -g ccpoke`)

**Commands:**
```bash
npm install -g ccpoke      # Install
ccpoke                      # Run bot
ccpoke setup               # Re-run setup
npm update -g ccpoke       # Update
npm uninstall -g ccpoke    # Uninstall
```

---

### Method 3: Local Development Clone

**Best for:** Contributing to ccpoke, customization

```bash
git clone https://github.com/your-org/ccpoke.git
cd ccpoke
pnpm install
pnpm dev
```

**Development workflow:**
```bash
pnpm build      # Compile TypeScript
pnpm dev        # Dev mode (tsx)
pnpm lint       # Check code
pnpm format     # Auto-format
pnpm test       # Run tests (when available)
```

**For production from cloned repo:**
```bash
pnpm build
pnpm start      # Run compiled bot
```

---

## System Requirements

### Minimum

- **OS:** macOS 10.14+, Linux (any distro), Windows 10+ (WSL2)
- **Node.js:** 20.0.0 or higher
- **RAM:** 100 MB minimum
- **Disk:** 50 MB (with dependencies)
- **Terminal:** bash/zsh shell, tmux installed

### Recommended

- **Node.js:** 20+ (LTS)
- **RAM:** 256+ MB
- **Disk:** 500 MB
- **Network:** Stable internet (Telegram API)

### Pre-Installation Checks

```bash
# Check Node.js version
node --version
# Should output: v18.0.0 or higher

# Check tmux installed
which tmux
# Should output: /usr/bin/tmux or similar

# Check bash/zsh available
which bash
which zsh
```

---

## Configuration Files

### ~/.ccpoke/ Directory Structure

After first setup, ccpoke creates:

```
~/.ccpoke/
├── config.json            # User configuration (created by setup)
├── state.json             # Chat session state
├── sessions.json          # Active sessions (auto-updated)
└── hooks/
    └── stop-notify.sh     # Stop hook script
```

### config.json

**Purpose:** Stores bot token, user ID, port, secret

**Location:** `~/.ccpoke/config.json`

**Example:**
```json
{
  "telegram_bot_token": "123456:ABC-xxx",
  "user_id": 9876543210,
  "hook_port": 9377,
  "hook_secret": "abc123def456ghi789jkl012mno345pqr",
  "agents": ["claude-code", "cursor"],
  "language": "en"
}
```

**Ownership:** Mode `600` (readable/writable by user only)

**Manual Editing:** Safe to edit (no schema validation on startup)

### state.json

**Purpose:** Tracks chat connection status

**Auto-created by:** `/start` command in Telegram

**Example:**
```json
{
  "chat_id": 1234567890,
  "user_confirmed": true,
  "last_activity": 1708867200000
}
```

### sessions.json

**Purpose:** Persists tmux sessions across restarts

**Auto-updated by:** SessionMonitor (every 30 seconds)

**Example:**
```json
[
  {
    "sessionId": "abc123",
    "tmuxTarget": "0:0",
    "project": "my-app",
    "cwd": "/Users/user/projects/my-app",
    "status": "idle",
    "lastActivity": 1708867200000,
    "createdAt": 1708867100000
  }
]
```

---

## Initial Setup

### Automated Setup (Recommended)

**One command:**
```bash
npx ccpoke
```

**Or if globally installed:**
```bash
ccpoke setup
```

**Interactive prompts:**
1. Select language (EN/VI/ZH)
2. Enter Telegram Bot Token
3. Scan QR or click link to connect
4. Send `/start` in Telegram
5. Select agents to monitor
6. Setup completes

**Total time:** ~1-2 minutes

### Manual Configuration (Advanced)

**Create** `~/.ccpoke/config.json`:
```json
{
  "telegram_bot_token": "YOUR_TOKEN_HERE",
  "user_id": YOUR_USER_ID,
  "hook_port": 9377,
  "hook_secret": "generate-random-32-char-string",
  "agents": ["claude-code"],
  "language": "en"
}
```

**Then run:**
```bash
ccpoke setup
```

This will install hooks and register the chat ID.

---

## Telegram Bot Setup

### Create Bot via BotFather

1. Open Telegram
2. Search for `@BotFather`
3. Send `/start`
4. Send `/newbot`
5. Follow prompts:
   - Name: "My ccpoke Bot" (user-facing)
   - Username: "my_ccpoke_bot" (must be unique, ends with _bot)
6. Receive token: `123456:ABC-xxx`

**Save this token** — you'll need it for ccpoke setup.

### Important Bot Settings

**Privacy Mode** (recommended):
```
/mybots → Select bot → Privacy mode → OFF
```

This allows bot to see group messages (not needed for 1:1 chat, but safe).

**Commands** (optional):
```
/mybots → Select bot → Commands
/start — Connect to ccpoke
/ping — Check if bot is alive
/status — Show bot status
/help — Show available commands
```

---

## Running the Bot

### Foreground (Development)

```bash
npx ccpoke
```

**Output:**
```
🤖 ccpoke v1.5.4

✅ Configuration loaded from ~/.ccpoke/config.json
✅ Telegram bot connected: @my_ccpoke_bot
✅ Hook server listening on 127.0.0.1:9377
✅ Session monitor started (30s interval)

🎉 Bot is ready!
   Press Ctrl+C to stop

[info] Session started: abc123 (project: my-app)
[info] Received hook event from Claude Code
[info] Sending notification to Telegram...
```

**To stop:** `Ctrl+C`

### Background (Production)

#### Option 1: systemd (Linux)

**Create** `/etc/systemd/user/ccpoke.service`:
```ini
[Unit]
Description=ccpoke - AI Agent Notification Bridge
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/npx ccpoke
Restart=on-failure
RestartSec=10
User=youruser
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
```

**Enable and start:**
```bash
systemctl --user daemon-reload
systemctl --user enable ccpoke
systemctl --user start ccpoke

# Check status
systemctl --user status ccpoke

# View logs
journalctl --user -u ccpoke -f
```

#### Option 2: launchd (macOS)

**Create** `~/Library/LaunchAgents/com.ccpoke.bot.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.ccpoke.bot</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/npx</string>
    <string>ccpoke</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>/tmp/ccpoke.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/ccpoke.err</string>
</dict>
</plist>
```

**Enable and start:**
```bash
launchctl load ~/Library/LaunchAgents/com.ccpoke.bot.plist
launchctl start com.ccpoke.bot

# Check status
launchctl list | grep ccpoke

# View logs
tail -f /tmp/ccpoke.log
```

#### Option 3: PM2 (Node.js process manager)

**Install PM2:**
```bash
npm install -g pm2
```

**Create** `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'ccpoke',
      script: 'npx',
      args: 'ccpoke',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

**Start and manage:**
```bash
pm2 start ecosystem.config.js
pm2 save              # Auto-start on reboot
pm2 startup
pm2 logs ccpoke       # View logs
pm2 stop ccpoke
pm2 delete ccpoke
```

---

## Cloudflare Tunnel Setup

**Optional:** Expose hook endpoint to internet (for future remote monitoring).

### Install cloudflared

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Linux:**
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

### Create Tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create ccpoke
cloudflared tunnel route dns ccpoke yourdomain.com
```

### Configure Tunnel

**Create** `~/.cloudflared/config.yml`:
```yaml
tunnel: ccpoke
ingress:
  - hostname: ccpoke.yourdomain.com
    service: http://127.0.0.1:9377
  - service: http_status:404
```

### Run Tunnel

```bash
cloudflared tunnel run ccpoke
```

**Output:**
```
2026-02-24 10:00:00 INF Starting tunnel
2026-02-24 10:00:02 INF Connected to cloudflare
2026-02-24 10:00:03 INF Route 2 available at https://ccpoke.yourdomain.com
```

**Tunnel access:**
```bash
curl https://ccpoke.yourdomain.com/health
# Response: OK
```

### Auto-Start Tunnel (systemd)

**Create** `/etc/systemd/user/cloudflared-ccpoke.service`:
```ini
[Unit]
Description=Cloudflare Tunnel for ccpoke
After=network.target

[Service]
ExecStart=/usr/local/bin/cloudflared tunnel run ccpoke
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

---

## Upgrading ccpoke

### If using npx

No action needed — always runs latest version.

### If globally installed

```bash
npm update -g ccpoke
```

**Verify update:**
```bash
ccpoke --version
# Should show new version
```

### If using local clone

```bash
cd path/to/ccpoke
git pull origin main
pnpm install
pnpm build
pnpm start
```

---

## Uninstallation

### Remove Global Installation

```bash
npm uninstall -g ccpoke
```

### Remove Configuration & State

```bash
rm -rf ~/.ccpoke/
```

**This removes:**
- config.json (bot token, user ID)
- state.json (chat state)
- sessions.json (active sessions)
- hooks/ (hook scripts)

### Remove from Claude Code Hooks

Hooks are automatically removed by `ccpoke uninstall` command:

```bash
ccpoke uninstall
```

Or manually edit `~/.claude/settings.json` to remove the Stop hook entry.

---

## Troubleshooting

### Bot Not Receiving Notifications

**Check 1: Hook is installed**
```bash
cat ~/.claude/settings.json | grep ccpoke
# Should show Stop hook path
```

**Check 2: Bot is running**
```bash
curl http://127.0.0.1:9377/health
# Should return 200 OK
```

**Check 3: Secret is correct**
```bash
cat ~/.ccpoke/config.json | grep hook_secret
```

**Check 4: Port is available**
```bash
lsof -i :9377
# If port in use, change HOOK_PORT in config.json
```

### Telegram Connection Fails

**Check 1: Bot token is valid**
```bash
curl "https://api.telegram.org/bot{TOKEN}/getMe"
# Should return valid JSON
```

**Check 2: Internet connection**
```bash
curl https://api.telegram.org
# Should succeed
```

**Check 3: User ID correct**
```bash
# In Telegram, message bot: /start
# Check logs for user_id
```

### tmux Session Not Found

**Check 1: tmux is running**
```bash
tmux list-sessions
# Should list active sessions
```

**Check 2: Claude Code in tmux**
```bash
tmux list-panes -a
# Should show Claude Code process
```

**Check 3: Session persisted correctly**
```bash
cat ~/.ccpoke/sessions.json
# Should list your session
```

---

## Performance Optimization

### Memory Usage

**Reduce session history:**
```json
// In ~/.ccpoke/config.json
"max_sessions_in_memory": 10,
"session_cleanup_interval_ms": 3600000
```

### CPU Usage

**Increase scan interval (slower updates):**
```json
"session_scan_interval_ms": 60000  // 60s instead of 30s
```

### Disk I/O

**Reduce persistence frequency:**
```json
"persist_interval_ms": 300000  // 5min instead of 30s
```

---

## Monitoring

### Health Check Endpoint

```bash
curl http://127.0.0.1:9377/health
# Response: {"status":"ok","uptime":3600}
```

### Log Files

**Foreground mode:**
Logs appear in terminal in real-time.

**Background mode:**
- systemd: `journalctl --user -u ccpoke -f`
- launchd: `tail -f /tmp/ccpoke.log`
- PM2: `pm2 logs ccpoke`

---

## Security Best Practices

1. **Protect hook secret** — Never share, stored in `~/.ccpoke/config.json`
2. **Whitelist users** — Only whitelisted Telegram users can control bot
3. **Keep secrets out of git** — `~/.ccpoke/` is local-only (in .gitignore)
4. **Use localhost only** — Hook endpoint listens on 127.0.0.1 (not public)
5. **Rotate token periodically** — Regenerate bot token in BotFather monthly

---

## Related Documentation

- **[CLI Commands](./commands.md)** — Command reference
- **[System Architecture](./system-architecture.md)** — Technical design
- **[Code Standards](./code-standards.md)** — Implementation guidelines
