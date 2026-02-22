const MODEL_PROVIDER_PREFIXES: Record<string, string> = {
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

function prettifyModelSegment(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/(\d+)\s(\d+)/g, "$1.$2")
    .replace(/(^| )[a-z]/g, (c) => c.toUpperCase());
}

export function formatModelName(model: string): string {
  const dashIndex = model.indexOf("-");
  if (dashIndex === -1) return prettifyModelSegment(model);

  const prefix = model.slice(0, dashIndex + 1);
  const display = MODEL_PROVIDER_PREFIXES[prefix];
  if (display === undefined) return prettifyModelSegment(model);

  const rest = model.slice(dashIndex + 1);
  return rest ? `${display}${prettifyModelSegment(rest)}` : model;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m${seconds}s`;
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return `${tokens}`;
}
