import { useState, useCallback } from "preact/hooks";
import copyIcon from "../../assets/icons/copy.svg?raw";

const COMMAND = "npx ccpoke";

interface Props {
  copyLabel: string;
  copiedLabel: string;
}

export default function TerminalWidget({ copyLabel, copiedLabel }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  return (
    <div class="bg-bg-code rounded-xl overflow-hidden max-w-[600px] mx-auto w-full">
      <div class="flex items-center justify-between px-4 py-2.5 bg-bg-code-2">
        <div class="flex gap-[7px]">
          <i class="w-2.5 h-2.5 rounded-full block bg-[#FF5F57]" />
          <i class="w-2.5 h-2.5 rounded-full block bg-[#FEBC2E]" />
          <i class="w-2.5 h-2.5 rounded-full block bg-[#28C840]" />
        </div>
      </div>
      <div class="flex items-center justify-between gap-4 px-5 py-4">
        <div class="font-mono text-[0.88rem] text-term-text min-w-0">
          <span class="text-accent select-none mr-2.5">$</span>
          <span>{COMMAND}</span>
        </div>
        <button
          onClick={handleCopy}
          class={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] border font-sans text-[0.78rem] font-semibold cursor-pointer transition-all duration-150 shrink-0 ${
            copied
              ? "bg-[rgba(46,139,87,0.2)] text-emerald border-[rgba(46,139,87,0.3)]"
              : "bg-white/[0.06] border-white/10 text-term-dim hover:bg-white/10 hover:text-term-dim-hover"
          }`}
        >
          <span
            class="w-[13px] h-[13px] inline-flex"
            dangerouslySetInnerHTML={{ __html: copyIcon }}
          />
          <span class="hidden sm:inline">{copied ? copiedLabel : copyLabel}</span>
        </button>
      </div>
    </div>
  );
}
