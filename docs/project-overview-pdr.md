# Project Overview & Product Development Requirements

**ccpoke** — AI Agent Notification Bridge. A zero-config TypeScript/Node.js application that monitors when AI coding agents (Claude Code, Cursor) complete tasks and sends rich notifications to Telegram, with support for two-way chat and tmux session integration.

---

## Executive Summary

### Vision Statement

> **ccpoke** is a zero-config notification bridge for AI coding agents — supporting Claude Code, Cursor, and future agents with ease. When your AI agent completes a task, you get poked on your phone with a summary, git changes, and the ability to chat back.

### One-Liner

"Your AI agent pokes you when it's done — any agent, anywhere."

---

## Product Goals

| Goal | Success Metric | Target Date |
|------|---|---|
| **Phase 1: Foundation** | Claude Code notifications working, 50+ GitHub stars | ✅ Done (v1.6.16) |
| **Phase 2: Multi-Agent** | Support Cursor + Claude Code + Codex, 100+ weekly npm downloads | ✅ Done (v1.6.16) |
| **Phase 3: Multi-Channel** | Discord + Slack support, 500+ stars | Q2 2026 |
| **Phase 4: Advanced** | Terminal streaming, file transfer | Q3 2026 |

---

## Target Users

### Primary User

**Developer using AI agents locally**

- Works with Claude Code or Cursor IDE
- Runs agents on personal machine (tmux/terminal)
- Wants to know when tasks complete without monitoring screen
- Walks away to grab coffee/lunch
- Checks phone for status updates

**Demographics:**
- Age: 25-50
- Technical level: Intermediate to advanced
- Platform: macOS, Linux, Windows (WSL)
- Frequency: Daily usage

### Secondary Users

- **Teams** — Multiple developers monitoring shared CI/CD-like agent runs
- **DevOps** — Monitoring long-running code generation tasks
- **Researchers** — AI model fine-tuning on GPU machines

---

## Core Features

### Tier 1: Notifications (Foundation ✅)

**What:** Automatic notifications when agent completes

**Features:**
- Stop hook notification from Claude Code
- Git diff summary (modified, added, deleted files)
- Execution time & token count
- Auto-split long messages (pagination)
- User whitelist for security
- i18n support (EN, VI, ZH)

**Implementation:** ~v1.0-1.5.4

### Tier 2: Interactive Chat (In Progress)

**What:** Send messages from Telegram to agent session

**Features:**
- Two-way chat via tmux send-keys
- Session lifecycle management (tmux-based)
- Permission request forwarding (Allow/Deny)
- Ask-user-question forwarding with multi-step answers
- Slash command forwarding (`/clear`, `/cost`, etc.)
- Progress indicator ("thinking")
- Desktop ↔ phone handoff (seamless)
- Message queue for concurrent inputs
- /sessions and /projects commands

### Tier 3: Terminal Monitoring (Planned)

**What:** View terminal activity in real-time

**Features:**
- Terminal screenshot on demand (`/screen`)
- Real-time output streaming
- Full keyboard control via Telegram
- File transfer (machine → phone)
- ANSI color rendering

---

## Use Cases

### Use Case 1: Background Task Notification

**Actor:** Solo developer

**Flow:**
1. Start Claude Code agent to refactor codebase
2. Walk away to attend meeting
3. Agent completes (5-15 minutes later)
4. Phone buzzes with notification
5. Read summary, git changes, execution time
6. Decide: continue work or review on desktop

**Value:** Awareness without constant monitoring

---

### Use Case 2: Quick Question in Chat

**Actor:** Developer at desk, wants to send message to agent

**Flow:**
1. Agent waiting for input
2. User sends message via Telegram (faster than switching windows)
3. Message injected into tmux session
4. Agent processes and responds
5. Response appears in Telegram
6. User reviews or sends follow-up

**Value:** Parallel communication channel

---

### Use Case 3: Session Recovery

**Actor:** Developer restarts machine

**Flow:**
1. Bot stops running
2. User restarts machine
3. User runs `ccpoke` again
4. Bot loads previous sessions from disk
5. Resumes monitoring same tmux sessions
6. No context lost

**Value:** Reliable state persistence

---

### Use Case 4: Multi-Project Coordination

**Actor:** Team with multiple agents running

**Flow:**
1. Alice runs Claude Code in project-a
2. Bob runs Cursor in project-b
3. Both agents' notifications go to shared Telegram group
4. Notifications include project names (no confusion)
5. Team coordinates work without side channel

**Value:** Unified notification center

---

## Competitive Advantages

### 1. Zero-Install via `npx`

**Advantage:** Compare to competitors

| Tool | Installation |
|------|---|
| **ccpoke** | `npx -y ccpoke` — done in 2 seconds |
| six-ddc/ccbot | Clone repo, Python setup, 5+ minutes |
| kidandcat/ccc | Clone, Go build, 10+ minutes |
| CoderBOT | Install, configure, 15+ minutes |

**Moat:** npm ecosystem unique. Python/Go can't replicate.

### 2. Multi-Agent Architecture

**Vision:** Not just Claude Code. Designed for any AI agent.

```
ccpoke adapters → Claude Code, Cursor, Codex, Aider, ...
```

**Competitors:** Mostly hardcoded to single agent.

### 3. Plugin System (Future)

**Goal:** Community-driven channels and adapters.

```
ccpoke plugins → community Slack adapter, Discord adapter, Email adapter
```

**Example:** User contributes Slack channel → published via npm.

### 4. i18n Baked In

**Languages:** English, Vietnamese, Chinese (all from day 1)

**Competitors:** English-only, no locale strategy.

**Asian Market:** Vietnamese/Chinese communities underserved.

### 5. Terminal-Aware

**Design:** Bridge INTO existing tmux sessions, not replace them.

```
WRONG:  ccpoke ──(creates new session)──→ Claude Code
RIGHT:  ccpoke ──(bridges)──→ [existing tmux] ──→ Claude Code
```

**Competitors:** Some create separate sessions (lose context).

---

## Functional Requirements

### FR-1: Stop Hook Notification

**Requirement:** When Claude Code completes, send Telegram notification

**Acceptance Criteria:**
- Hook triggers < 3s after Claude stops
- Includes: response summary, time, token count, git diff
- Properly formatted for mobile reading
- Never crashes Claude Code process

**Implementation:** Agent handler + telegram sender

---

### FR-2: Multi-Agent Support

**Requirement:** Detect and support multiple agents

**Acceptance Criteria:**
- Detect Claude Code installation
- Detect Cursor installation
- Detect Codex CLI installation
- Auto-install hooks for detected agents
- Route events to correct provider
- Extensible for new agents

**Implementation:** Provider pattern + agent registry

---

### FR-3: Session Persistence

**Requirement:** Survive bot restart without losing context

**Acceptance Criteria:**
- Sessions saved to disk (`~/.ccpoke/sessions.json`)
- On startup, load and reconcile with live tmux
- Sessions match based on tmux target + process
- Stale sessions auto-pruned (30min idle)

**Implementation:** Session map + periodic scanner

---

### FR-4: Two-Way Chat (Tier 2)

**Requirement:** Send messages from Telegram into agent session

**Acceptance Criteria:**
- Message injects via `tmux send-keys`
- Response captured and sent back < 5s
- Handles concurrent desktop + Telegram input
- Message queue prevents race conditions

**Implementation:** Session state machine + tmux bridge

---

### FR-5: Message Formatting

**Requirement:** Convert Claude/Cursor output to Telegram MarkdownV2

**Acceptance Criteria:**
- Code blocks remain monospace
- Headers bold
- Links preserved
- Auto-paginate > 4096 chars with `[1/N]`
- Special characters escaped for MarkdownV2

**Implementation:** Markdown parser + pagination

---

### FR-6: User Whitelist

**Requirement:** Only authorized users can control bot

**Acceptance Criteria:**
- Check Telegram user ID against config
- Reject non-whitelisted users silently
- Support multiple users (team use case)
- Configurable during setup

**Implementation:** Auth middleware + whitelist check

---

### FR-7: Git Diff Summary

**Requirement:** Show what files changed in notification

**Acceptance Criteria:**
- Extract `git status` in project directory
- Show: modified files (✏️), added (➕), deleted (❌)
- Only show if changes exist
- Format compactly for mobile

**Implementation:** Git collector + formatter

---

### FR-8: Setup Wizard

**Requirement:** Interactive configuration for first-time users

**Acceptance Criteria:**
- Prompt for: bot token, user ID, agent selection
- Auto-detect installed agents
- Install hooks into agent configs
- Validate bot token by fetching bot info
- Complete in < 2 minutes

**Implementation:** Setup command + prompts

---

### FR-9: Internationalization

**Requirement:** Support multiple languages in UI and messages

**Acceptance Criteria:**
- 3 languages: English, Vietnamese, Chinese
- User selects during setup
- All messages localized
- Easy to add new languages

**Implementation:** i18n loader + locale files

---

### FR-10: Cloudflare Tunnel Integration

**Requirement:** Optional: expose hook endpoint to internet

**Acceptance Criteria:**
- Detect cloudflared binary
- Auto-setup tunnel if user opts in
- Provide public URL for external monitoring (future)
- Fallback to localhost if tunnel unavailable

**Implementation:** Tunnel utility + detection

---

## Non-Functional Requirements

### NFR-1: Performance

| Requirement | Target | Justification |
|---|---|---|
| Hook latency | < 3s | Timely notifications |
| Message injection | < 2s | Responsive chat |
| Bot memory | < 100MB | Resource constrained (VPS) |
| Setup time | < 2min | Low friction for users |
| Session scan | 30s interval | Balance responsiveness vs CPU |

---

### NFR-2: Reliability

| Requirement | Implementation |
|---|---|
| Hook failure doesn't crash Claude | Try-catch, graceful degradation |
| Message parsing failure | Send generic notification |
| Telegram API timeout | Retry with exponential backoff |
| Session persistence | Periodic sync to disk |
| Graceful shutdown | Close all handles, flush state |

---

### NFR-3: Security

| Requirement | Implementation |
|---|---|
| Hook secret validation | Random 32-char token, header check |
| User whitelist | Telegram user ID check |
| Loopback binding | Listen only on 127.0.0.1 |
| No secrets in logs | Redact tokens, sanitize output |
| Config file permissions | Mode 600 for sensitive files |

---

### NFR-4: Maintainability

| Requirement | Implementation |
|---|---|
| Code clarity | < 200 LOC per file |
| Type safety | TypeScript strict mode |
| Design patterns | Provider, Adapter, Bridge, Observer |
| Test coverage | 80%+ for core logic |
| Documentation | Clear module responsibilities |

---

### NFR-5: Compatibility

| Requirement | Support |
|---|---|
| Node.js version | ≥20 |
| Operating systems | macOS, Linux, Windows (WSL) |
| Terminal | tmux only (primary), bash/zsh shell |
| AI agents | Claude Code, Cursor (extensible) |

---

## Architecture Decisions

### Decision: Why TypeScript/Node.js?

**Chosen:** TypeScript/Node.js

**Alternatives Considered:**
1. Python — Rapid dev, but no `npx` install
2. Go — Single binary, but heavy compilation setup
3. Rust — Type-safe, but overkill for this scale

**Decision Rationale:**
| Factor | TypeScript | Python | Go |
|--------|:-:|:-:|:-:|
| `npx` install | ✅ | ❌ | ❌ |
| npm ecosystem | ✅ | ⚠️ | ❌ |
| Cross-platform | ✅ | ✅ | ✅ |
| Setup friction | Low | Medium | Medium |

**Result:** `npx -y ccpoke` is unique competitive advantage.

---

### Decision: Hook vs Polling

**Chosen:** Hybrid (Hook for notifications, optional polling for streaming)

**Approach:**
1. **Tier 1:** Use native hooks (Push-based, chaining)
2. **Tier 2:** Optionally poll JSONL for streaming (Pull-based)
3. **Tier 3:** Real-time output requires polling

**Benefits:**
- Hooks: accurate, low resource
- Polling: detailed, progressive updates

---

### Decision: Single User vs Multi-User

**Chosen:** Single-user (with whitelist for teams)

**Design:**
- Bot runs on personal machine (not server)
- All configuration stored locally (`~/.ccpoke/`)
- User whitelist supports team coordination
- Team shares same bot instance on single machine

**Alternative (not chosen):** Centralized server
- Would require cloud hosting
- Security model much harder
- Unnecessary complexity for primary use case

---

### Decision: Session Persistence

**Chosen:** File-based (`~/.ccpoke/sessions.json`)

**Alternative (not chosen):** SQLite, PostgreSQL
- Overkill for current scale
- Additional dependency
- Setup friction

**Future:** If scale grows (hundreds of sessions), migrate to SQLite.

---

## Success Metrics

### Phase 1 (Current)

| Metric | Target | Status |
|--------|--------|--------|
| GitHub stars | 50+ | ✅ 55+ |
| npm weekly downloads | 50+ | ✅ 100+ |
| Supported agents | 1 (Claude) | ✅ 3 (Claude, Cursor, Codex) |
| User feedback | Positive on HN/Reddit | ✅ Done |

### Phase 2 (2026 Q2)

| Metric | Target |
|--------|--------|
| GitHub stars | 200+ |
| npm weekly downloads | 500+ |
| Supported agents | 3+ (Claude, Cursor, Codex) |
| Community PRs | 5+ |

### Phase 3 (2026 Q3)

| Metric | Target |
|--------|--------|
| GitHub stars | 500+ |
| Supported channels | 3+ (Telegram, Discord, Slack) |
| Plugin ecosystem | 3+ community plugins |
| Translations | 5+ languages |

---

## Roadmap Summary

See detailed roadmap in phases below.

**High-Level:**
1. ✅ **Phase 1:** Foundation (Claude Code, Telegram, Git diff)
2. ✅ **Phase 2:** Multi-agent (Cursor, Codex CLI, provider architecture)
3. 📋 **Phase 3:** Multi-channel (Discord, Slack)
4. 🚀 **Phase 4:** Advanced features (streaming, file transfer)
5. 🌟 **Phase 5:** Plugin ecosystem

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| Claude Code changes hook API | High | Medium | Abstract via adapter, monitor changelogs |
| Competitor adds `npx` support | Medium | Low | First-mover advantage, plugin moat |
| Telegram API changes | Medium | Low | Use official library, maintain compatibility |
| Security exploit in hook | High | Low | Validate secret, rate limit, audit logs |
| User adoption slow | Medium | Medium | Community outreach, feature parity |

---

## Related Documentation

- **[Codebase Summary](./codebase-summary.md)** — Implementation overview
- **[Code Standards](./code-standards.md)** — Development guidelines
- **[System Architecture](./system-architecture.md)** — Technical design
