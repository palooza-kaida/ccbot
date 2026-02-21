import { ErrorState, GitChangesPanel, LoadingState, ResponseMeta } from "./ResponseParts";
import { MarkdownBody } from "./MarkdownBody";
import type { GitChange } from "./types";

const MOCK_MARKDOWN = `# Refactored Authentication Module

## Summary

Refactored the authentication module to use **JWT tokens** with refresh token rotation. Replaced the legacy session-based auth with a stateless approach.

### Key Changes

1. Replaced \`express-session\` with \`jsonwebtoken\` for token-based authentication
2. Added refresh token rotation for enhanced security
3. Updated all protected routes to use the new \`authMiddleware\`
4. Added rate limiting on auth endpoints

### New Dependencies

- \`jsonwebtoken\` — JWT signing and verification
- \`bcryptjs\` — Password hashing (replaced \`bcrypt\` native module)

## Implementation Details

The new auth flow works as follows:

\`\`\`typescript
const token = jwt.sign({ userId, role }, SECRET, { expiresIn: "15m" });
const refreshToken = crypto.randomUUID();
await redis.set(\`refresh:\${refreshToken}\`, userId, "EX", 604800);
\`\`\`

> **Note:** Access tokens expire in 15 minutes. Refresh tokens are valid for 7 days and are rotated on each use.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/auth/login\` | POST | Login with credentials |
| \`/auth/refresh\` | POST | Refresh access token |
| \`/auth/logout\` | POST | Invalidate refresh token |
| \`/auth/me\` | GET | Get current user |

### Middleware Usage

All protected routes now use the unified middleware:

\`\`\`typescript
app.get("/api/profile", authMiddleware("user"), getProfile);
app.delete("/api/users/:id", authMiddleware("admin"), deleteUser);
\`\`\`

---

## Testing

- Added 12 unit tests for token generation and validation
- Added 5 integration tests for the full auth flow
- All existing tests pass with the new auth system
`;

const MOCK_CHANGES: GitChange[] = [
  { status: "modified", file: "src/auth/middleware.ts" },
  { status: "modified", file: "src/auth/token-service.ts" },
  { status: "added", file: "src/auth/refresh-token.ts" },
  { status: "added", file: "src/auth/rate-limiter.ts" },
  { status: "modified", file: "src/routes/api.ts" },
  { status: "deleted", file: "src/auth/legacy-session.ts" },
  { status: "modified", file: "package.json" },
  { status: "renamed", file: "src/auth/index.ts" },
  { status: "added", file: "tests/auth/token.test.ts" },
  { status: "added", file: "tests/auth/flow.test.ts" },
  { status: "modified", file: "src/config/env.ts" },
];

export default function ResponsePreview() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") ?? "success";

  return (
    <div class="rv">
      <main class="rv__body">
        <ResponseMeta
          project="claudecode-tele"
          durationMs={435971}
          timestamp="2026-02-21T11:15:30Z"
        />
        {mode === "loading" && <LoadingState />}
        {mode === "error" && <ErrorState message="Dữ liệu response đã hết hạn. Thông tin cơ bản hiển thị ở trên." />}
        {mode === "success" && (
          <>
            <MarkdownBody content={MOCK_MARKDOWN} />
            <GitChangesPanel changes={MOCK_CHANGES} />
          </>
        )}
      </main>
    </div>
  );
}
