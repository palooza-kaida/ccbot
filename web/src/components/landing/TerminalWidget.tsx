import { useState, useCallback } from "preact/hooks";

const PM_COMMANDS: Record<string, string> = {
  npm: "npm i -g ccpoke",
  yarn: "yarn global add ccpoke",
  pnpm: "pnpm add -g ccpoke",
};

const PACKAGE_MANAGERS = Object.keys(PM_COMMANDS);

interface Props {
  copyLabel: string;
  copiedLabel: string;
}

export default function TerminalWidget({ copyLabel, copiedLabel }: Props) {
  const [activePm, setActivePm] = useState("pnpm");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(PM_COMMANDS[activePm]!);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [activePm]);

  return (
    <div class="bg-bg-code rounded-xl overflow-hidden max-w-[600px] mx-auto w-full">
      <div class="flex items-center justify-between px-4 py-2.5 bg-bg-code-2">
        <div class="flex gap-[7px]">
          <i class="w-2.5 h-2.5 rounded-full block bg-[#FF5F57]" />
          <i class="w-2.5 h-2.5 rounded-full block bg-[#FEBC2E]" />
          <i class="w-2.5 h-2.5 rounded-full block bg-[#28C840]" />
        </div>
        <div class="flex items-center gap-0.5 bg-white/[0.05] rounded-lg p-0.5">
          {PACKAGE_MANAGERS.map((pm) => (
            <button
              key={pm}
              class={`px-3 py-1 font-sans text-xs font-semibold bg-transparent border-none rounded-md cursor-pointer transition-all duration-150 ${
                pm === activePm
                  ? "text-white bg-white/[0.1]"
                  : "text-term-muted hover:text-term-dim-hover"
              }`}
              onClick={() => setActivePm(pm)}
            >
              {pm}
            </button>
          ))}
        </div>
      </div>
      <div class="flex items-center justify-between gap-4 px-5 py-4">
        <div class="font-mono text-[0.88rem] text-term-text min-w-0">
          <span class="text-accent select-none mr-2.5">$</span>
          <span>{PM_COMMANDS[activePm]}</span>
        </div>
        <button
          onClick={handleCopy}
          class={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] border font-sans text-[0.78rem] font-semibold cursor-pointer transition-all duration-150 shrink-0 ${
            copied
              ? "bg-[rgba(46,139,87,0.2)] text-emerald border-[rgba(46,139,87,0.3)]"
              : "bg-white/[0.06] border-white/10 text-term-dim hover:bg-white/10 hover:text-term-dim-hover"
          }`}
        >
          <svg class="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          <span class="hidden sm:inline">{copied ? copiedLabel : copyLabel}</span>
        </button>
      </div>
    </div>
  );
}
