export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m${seconds}s`;
}

const PROVIDERS: Record<string, string> = {
  "claude-": "",
  "gpt-": "GPT-",
  "gemini-": "Gemini ",
  "deepseek-": "DeepSeek ",
  "mistral-": "Mistral ",
  "codestral-": "Codestral ",
  "grok-": "Grok ",
  "moonshot-": "Moonshot ",
  "qwen-": "Qwen ",
};

export function formatModelName(model: string): string {
  const dashIndex = model.indexOf("-");
  if (dashIndex === -1) return prettify(model);

  const prefix = model.slice(0, dashIndex + 1);
  const display = PROVIDERS[prefix];
  if (display === undefined) return prettify(model);

  const rest = model.slice(dashIndex + 1);
  return rest ? `${display}${prettify(rest)}` : model;
}

function prettify(s: string): string {
  return s
    .replace(/-/g, " ")
    .replace(/(\d+)\s(\d+)/g, "$1.$2")
    .replace(/(^| )[a-z]/g, (c) => c.toUpperCase());
}

