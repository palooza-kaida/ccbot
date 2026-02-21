import{R as s,L as a,E as r,M as n,G as o}from"./MarkdownBody.BJmW70-B.js";import{u as t}from"./jsxRuntime.module.kJjLVEAC.js";import{k as i}from"./preact.module.EGlgVV74.js";import"./hooks.module.BVG3ayJl.js";/* empty css                          */const d=`Các bot dễ tạo tương tự Telegram:

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

Bạn muốn thêm bot cho platform nào? Mình có thể tạo plan để extend codebase Telegram hiện tại.`,c=[{status:"modified",file:"src/auth/middleware.ts"},{status:"modified",file:"src/auth/token-service.ts"},{status:"added",file:"src/auth/refresh-token.ts"},{status:"added",file:"src/auth/rate-limiter.ts"},{status:"modified",file:"src/routes/api.ts"},{status:"deleted",file:"src/auth/legacy-session.ts"},{status:"modified",file:"package.json"},{status:"renamed",file:"src/auth/index.ts"},{status:"added",file:"tests/auth/token.test.ts"},{status:"added",file:"tests/auth/flow.test.ts"},{status:"modified",file:"src/config/env.ts"}];function p(){const e=new URLSearchParams(window.location.search).get("mode")??"success";return t("div",{class:"rv",children:t("main",{class:"rv__body",children:[t(s,{project:"claudecode-tele",durationMs:6118809,timestamp:"2026-02-21T12:44:19.009Z",model:"claude-sonnet-4-10"}),e==="loading"&&t(a,{}),e==="error"&&t(r,{message:"Dữ liệu response đã hết hạn. Thông tin cơ bản hiển thị ở trên."}),e==="success"&&t(i,{children:[t(n,{content:d}),t(o,{changes:c})]})]})})}export{p as default};
