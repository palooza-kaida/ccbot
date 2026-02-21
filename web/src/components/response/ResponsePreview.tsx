import { ErrorState, GitChangesPanel, LoadingState, ResponseMeta } from "./ResponseParts";
import { MarkdownBody } from "./MarkdownBody";
import type { GitChange } from "./types";

const MOCK_MARKDOWN = `Các bot dễ tạo tương tự Telegram:

## Dễ nhất (tương tự Telegram)

1. **Discord** - API rất đơn giản, documentation tốt
2. **Slack** - Có Bolt framework, dễ setup
3. **Line** - API khá friendly, phổ biến ở Châu Á

## Trung bình

4. **Zalo** - Official bot API, phổ biến VN
5. **Viber** - Có API bot rõ ràng
6. **WhatsApp Business** - Phức tạp hơn nhưng còn quản lý

## Khó hơn

7. **Instagram/Facebook** - Webhooks complex, rate limit nhiều
8. **Twitter/X** - API thay đổi thường xuyên

---

**Top 3 dễ nhất để mở rộng từ Telegram:**

| Platform | Độ khó | Tại sao |
|----------|--------|--------|
| **Discord** | ⭐ Dễ | Webhook + event-driven, library Discord.py/discord.js rất tốt |
| **Slack** | ⭐ Dễ | Bolt framework, event streaming rõ ràng |
| **Line** | ⭐⭐ Dễ | Similar to Telegram API structure |

Bạn muốn thêm bot cho platform nào? Mình có thể tạo plan để extend codebase Telegram hiện tại.`;

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
          durationMs={6118809}
          timestamp="2026-02-21T12:44:19.009Z"
          model="claude-sonnet-4-10"
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
