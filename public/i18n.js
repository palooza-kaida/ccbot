const I18N_LOCALES = {
  en: {
    title: "ccbot — Code anywhere with AI Agents",
    metaDesc: "Two-way interaction with Claude Code from Telegram, Discord, Zalo. Code anytime, anywhere.",
    heroTitle: "Code anywhere, ",
    heroAccent: "anytime",
    heroSub: "Two-way interaction with Claude Code via Telegram, Discord, Zalo. Code on the go with your phone.",
    navHow: "How it works", navFeat: "Features", navSetup: "Setup", navRoad: "Roadmap",
    howLabel: "How it works",
    howTitle: "Two-way bridge between terminal and phone",
    howSub: "Send prompts, receive results, approve permissions — all from your favorite chat platform.",
    termTitle: "Terminal",
    termDesc: "Claude Code runs on your machine. ccbot listens to hook events and JSONL transcripts.",
    youTitle: "You",
    youDesc: "Chat, review, approve from anywhere.",
    featLabel: "Features", featTitle: "More than notifications",
    featPushT: "Push notification", featPushD: "Claude Code done → notification pushed instantly. No polling, no delay.",
    feat2wayT: "Two-way interaction", feat2wayD: "Send prompts from your phone, Claude Code receives and processes, response sent back. Approve/deny permissions right in chat.",
    featGitT: "Auto git diff", featGitD: "Each notification includes file list: added, modified, deleted. Know what Claude Code changed without opening your laptop.",
    featSumT: "Response summary + cost", featSumD: "Extract response content from JSONL transcript, with processing time.",
    featSecT: "Self-hosted, code stays on your machine", featSecD: "Whitelist User ID, unauthorized gets silently ignored. Everything runs on your machine.",
    setupLabel: "Setup", setupTitle: "3 steps, 2 minutes",
    setupSub: "Requires Node.js ≥ 18 and a Telegram Bot Token.",
    s1T: "Create Bot Token", s2T: "Install & run setup", s3T: "Start bot",
    s3D: "Open Telegram → send <code class=\"font-mono text-[0.78rem] bg-bg-warm px-[7px] py-0.5 rounded text-accent\">/start</code> → done. Use Claude Code normally.",
    roadLabel: "Roadmap", roadTitle: "Long-term roadmap",
    roadSub: "Telegram-first — perfect the experience on Telegram first, then expand to other platforms.",
    p1L: "Phase 1 · Complete", p1T: "Basic notification", p1D: "Push notifications from Claude Code hook to Telegram.",
    p2L: "Phase 2 · In development", p2T: "Two-way chat", p2D: "Send prompts and receive responses directly from Telegram.",
    p3L: "Phase 3", p3T: "Terminal control", p3D: "Control terminal remotely via Telegram.",
    p4L: "Phase 4", p4T: "Developer experience", p4D: "Enhance developer experience.",
    p5L: "Phase 5", p5T: "Multi-platform", p5D: "Expand to other chat platforms after Telegram is stable.",
    p6L: "Phase 6", p6T: "Ecosystem", p6D: "Open ecosystem for teams and community.",
    p2Tags: ["Send prompt","Approve / Deny","Response streaming","Session management"],
    p3Tags: ["tmux bridge","Screenshot capture","Live output","File browser"],
    p4Tags: ["Multi-project","Config profiles","Webhook API","CI/CD hooks"],
    p5Tags: ["Discord","Zalo","Slack","Platform adapter SDK"],
    p6Tags: ["Plugin system","Team collaboration","Web dashboard","Analytics"],
    copyBtn: "Copy", copiedBtn: "Copied!",
    p1Tags: ["Stop hook","Git diff","Markdown format","User auth","Response summary"],
  },
  vi: {
    title: "ccbot — Code mọi nơi với AI Agents",
    metaDesc: "Tương tác 2 chiều với Claude Code từ Telegram, Discord, Zalo. Code mọi lúc mọi nơi.",
    heroTitle: "Code mọi nơi, ",
    heroAccent: "mọi lúc",
    heroSub: "Tương tác 2 chiều với Claude Code qua Telegram, Discord, Zalo. Cầm điện thoại mà vẫn code.",
    navHow: "Cách hoạt động", navFeat: "Tính năng", navSetup: "Cài đặt", navRoad: "Roadmap",
    howLabel: "Cách hoạt động",
    howTitle: "Bridge 2 chiều giữa terminal và điện thoại",
    howSub: "Gửi prompt, nhận kết quả, approve quyền — tất cả từ nền tảng chat bạn đang dùng.",
    termTitle: "Terminal",
    termDesc: "Claude Code chạy trên máy. ccbot lắng nghe hook event và JSONL transcript.",
    youTitle: "Bạn",
    youDesc: "Chat, review, approve từ bất kỳ đâu.",
    featLabel: "Tính năng", featTitle: "Không chỉ notification",
    featPushT: "Push notification", featPushD: "Claude Code xong → notification đẩy ngay. Không polling, không delay.",
    feat2wayT: "Tương tác 2 chiều", feat2wayD: "Gửi prompt từ điện thoại, Claude Code nhận và xử lý, response gửi ngược lại. Approve/deny quyền ngay trên chat.",
    featGitT: "Git diff tự động", featGitD: "Mỗi notification kèm danh sách file: added, modified, deleted. Biết Claude Code thay đổi gì mà không cần mở máy.",
    featSumT: "Tóm tắt response + chi phí", featSumD: "Trích xuất nội dung response từ transcript JSONL, kèm thời gian xử lý.",
    featSecT: "Self-hosted, code không rời máy", featSecD: "Whitelist User ID, unauthorized bị ignore im lặng. Mọi thứ chạy trên máy bạn.",
    setupLabel: "Cài đặt", setupTitle: "3 bước, 2 phút",
    setupSub: "Cần Node.js ≥ 18 và một Telegram Bot Token.",
    s1T: "Tạo Bot Token", s2T: "Cài đặt & chạy setup", s3T: "Chạy bot",
    s3D: "Mở Telegram → gửi <code class=\"font-mono text-[0.78rem] bg-bg-warm px-[7px] py-0.5 rounded text-accent\">/start</code> → xong. Dùng Claude Code bình thường.",
    roadLabel: "Roadmap", roadTitle: "Lộ trình dài hơi",
    roadSub: "Telegram-first — hoàn thiện trải nghiệm trên Telegram trước, sau đó mở rộng ra các nền tảng khác.",
    p1L: "Phase 1 · Hoàn thành", p1T: "Notification cơ bản", p1D: "Push thông báo từ Claude Code hook đến Telegram.",
    p2L: "Phase 2 · Đang phát triển", p2T: "Chat 2 chiều", p2D: "Gửi prompt và nhận response trực tiếp từ Telegram.",
    p3L: "Phase 3", p3T: "Terminal control", p3D: "Điều khiển terminal từ xa qua Telegram.",
    p4L: "Phase 4", p4T: "Developer experience", p4D: "Nâng cao trải nghiệm lập trình viên.",
    p5L: "Phase 5", p5T: "Multi-platform", p5D: "Mở rộng sang các nền tảng chat khác sau khi Telegram ổn định.",
    p6L: "Phase 6", p6T: "Ecosystem", p6D: "Hệ sinh thái mở rộng cho team và cộng đồng.",
    p2Tags: ["Gửi prompt","Approve / Deny","Response streaming","Session management"],
    p3Tags: ["tmux bridge","Screenshot capture","Live output","File browser"],
    p4Tags: ["Multi-project","Config profiles","Webhook API","CI/CD hooks"],
    p5Tags: ["Discord","Zalo","Slack","Platform adapter SDK"],
    p6Tags: ["Plugin system","Team collaboration","Web dashboard","Analytics"],
    copyBtn: "Copy", copiedBtn: "Đã sao chép!",
    p1Tags: ["Stop hook","Git diff","Markdown format","User auth","Response summary"],
  },
  zh: {
    title: "ccbot — 使用 AI Agents 随时随地编程",
    metaDesc: "通过 Telegram、Discord、Zalo 与 Claude Code 双向交互。随时随地编程。",
    heroTitle: "随时随地，",
    heroAccent: "编程",
    heroSub: "通过 Telegram、Discord、Zalo 与 Claude Code 双向交互。手机在手，代码在心。",
    navHow: "工作原理", navFeat: "功能", navSetup: "安装", navRoad: "路线图",
    howLabel: "工作原理",
    howTitle: "终端与手机之间的双向桥梁",
    howSub: "发送提示、接收结果、审批权限 — 全部在您使用的聊天平台上完成。",
    termTitle: "终端",
    termDesc: "Claude Code 在您的机器上运行。ccbot 监听 hook 事件和 JSONL 转录。",
    youTitle: "您",
    youDesc: "随时随地聊天、审查、批准。",
    featLabel: "功能", featTitle: "不仅仅是通知",
    featPushT: "推送通知", featPushD: "Claude Code 完成 → 立即推送通知。无轮询，无延迟。",
    feat2wayT: "双向交互", feat2wayD: "从手机发送提示，Claude Code 接收并处理，响应发送回来。直接在聊天中批准/拒绝权限。",
    featGitT: "自动 Git diff", featGitD: "每个通知包含文件列表：添加、修改、删除。无需打开电脑即可了解 Claude Code 的更改。",
    featSumT: "响应摘要 + 费用", featSumD: "从 JSONL 转录中提取响应内容，附带处理时间。",
    featSecT: "自托管，代码不离开您的机器", featSecD: "白名单用户 ID，未授权请求被静默忽略。一切在您的机器上运行。",
    setupLabel: "安装", setupTitle: "3 步，2 分钟",
    setupSub: "需要 Node.js ≥ 18 和一个 Telegram Bot Token。",
    s1T: "创建 Bot Token", s2T: "安装并运行设置", s3T: "启动机器人",
    s3D: "打开 Telegram → 发送 <code class=\"font-mono text-[0.78rem] bg-bg-warm px-[7px] py-0.5 rounded text-accent\">/start</code> → 完成。正常使用 Claude Code。",
    roadLabel: "路线图", roadTitle: "长期路线图",
    roadSub: "Telegram 优先 — 先完善 Telegram 上的体验，然后扩展到其他平台。",
    p1L: "阶段 1 · 已完成", p1T: "基础通知", p1D: "从 Claude Code hook 推送通知到 Telegram。",
    p2L: "阶段 2 · 开发中", p2T: "双向聊天", p2D: "直接从 Telegram 发送提示并接收响应。",
    p3L: "阶段 3", p3T: "终端控制", p3D: "通过 Telegram 远程控制终端。",
    p4L: "阶段 4", p4T: "开发者体验", p4D: "提升开发者体验。",
    p5L: "阶段 5", p5T: "多平台", p5D: "在 Telegram 稳定后扩展到其他聊天平台。",
    p6L: "阶段 6", p6T: "生态系统", p6D: "为团队和社区构建开放生态系统。",
    p2Tags: ["发送提示","批准 / 拒绝","响应流式传输","会话管理"],
    p3Tags: ["tmux 桥接","截图捕获","实时输出","文件浏览器"],
    p4Tags: ["多项目","配置文件","Webhook API","CI/CD 钩子"],
    p5Tags: ["Discord","Zalo","Slack","平台适配器 SDK"],
    p6Tags: ["插件系统","团队协作","Web 仪表板","数据分析"],
    copyBtn: "复制", copiedBtn: "已复制！",
    p1Tags: ["Stop hook","Git diff","Markdown format","User auth","Response summary"],
  },
};

const LANG_LABELS = { en: "EN", vi: "VI", zh: "中文" };

function detectLocale() {
  const saved = localStorage.getItem("ccbot-locale");
  if (saved && I18N_LOCALES[saved]) return saved;
  const nav = navigator.language?.slice(0, 2);
  if (nav === "zh") return "zh";
  if (nav === "vi") return "vi";
  return "en";
}

let currentLang = detectLocale();

function applyTranslations(lang) {
  currentLang = lang;
  localStorage.setItem("ccbot-locale", lang);
  const t = I18N_LOCALES[lang];
  document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  document.title = t.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = t.metaDesc;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t[key] !== undefined) {
      if (typeof t[key] === "string") {
        el.innerHTML = t[key];
      }
    }
  });

  document.querySelectorAll("[data-i18n-tags]").forEach(el => {
    const key = el.getAttribute("data-i18n-tags");
    const cssClass = el.getAttribute("data-tag-class") || "";
    if (Array.isArray(t[key])) {
      el.innerHTML = t[key].map(tag =>
        `<span class="${cssClass}">${tag}</span>`
      ).join("");
    }
  });

  document.querySelectorAll(".lang-option").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  const langCurrent = document.getElementById("langCurrent");
  if (langCurrent) langCurrent.textContent = LANG_LABELS[lang] || lang.toUpperCase();
}

document.addEventListener("DOMContentLoaded", () => {
  applyTranslations(currentLang);
});

function switchLang(lang) {
  if (I18N_LOCALES[lang]) applyTranslations(lang);
}
