import{R as s,L as a,E as o,M as r,G as n}from"./MarkdownBody.GEWKMAMQ.js";import{u as e}from"./jsxRuntime.module.kJjLVEAC.js";import{k as c}from"./preact.module.EGlgVV74.js";import"./hooks.module.BVG3ayJl.js";/* empty css                          */const i=`Dựa trên landscape hiện tại (Feb 2025), đây là những package tốt nhất cho QR code:

**Cho Node.js/CLI:**
1. **\`qrcode\`** (npm downloads: 10M+/tuần)
   - Most popular, well-maintained
   - Hỗ trợ multiple output formats (canvas, SVG, terminal, data URL)
   - Dùng cho cả server và client-side

2. **\`jsqr\`** (nếu cần decode)
   - Parse QR code từ images
   - Paired tốt với \`qrcode\` để tạo & decode

**Cho web UI (React/Vue/etc):**
1. **\`qrcode.react\`** (React wrapper)
   - Simple, lightweight
   - Render thành SVG hoặc canvas

2. **\`qrcode\`** + custom component
   - More control, flexible

**Combo best practice:**
\`\`\`typescript
// Server: Tạo QR code
import QRCode from 'qrcode';

const qrData = await QRCode.toDataURL('https://example.com/auth?token=...');

// Client: Decode (nếu cần)
import jsQR from 'jsqr';
const code = jsQR(imageData);
\`\`\`

**Lựa chọn cho setup của bạn:**
- Nếu dùng deep linking + web UI → \`qrcode\` + \`qrcode.react\`
- Nếu terminal-based CLI → \`qrcode\` (cải thiện hơn \`qrcode-terminal\`)
- Nếu need scanning capability → \`qrcode\` + \`jsqr\`

**Câu hỏi:**
Current setup của bạn dùng package nào? Bạn muốn upgrade hay integrate thêm functionality?`,d=[{status:"modified",file:"src/auth/middleware.ts"},{status:"modified",file:"src/auth/token-service.ts"},{status:"added",file:"src/auth/refresh-token.ts"},{status:"added",file:"src/auth/rate-limiter.ts"},{status:"modified",file:"src/routes/api.ts"},{status:"deleted",file:"src/auth/legacy-session.ts"},{status:"modified",file:"package.json"},{status:"renamed",file:"src/auth/index.ts"},{status:"added",file:"tests/auth/token.test.ts"},{status:"added",file:"tests/auth/flow.test.ts"},{status:"modified",file:"src/config/env.ts"}];function g(){const t=new URLSearchParams(window.location.search).get("mode")??"success";return e("div",{class:"rv",children:e("main",{class:"rv__body",children:[e(s,{project:"claudecode-tele",durationMs:6118809,timestamp:"2026-02-21T12:44:19.009Z"}),t==="loading"&&e(a,{}),t==="error"&&e(o,{message:"Dữ liệu response đã hết hạn. Thông tin cơ bản hiển thị ở trên."}),t==="success"&&e(c,{children:[e(r,{content:i}),e(n,{changes:d})]})]})})}export{g as default};
