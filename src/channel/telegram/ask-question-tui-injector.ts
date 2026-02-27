import type { AskUserQuestionItem } from "../../agent/agent-handler.js";
import type { TmuxBridge } from "../../tmux/tmux-bridge.js";

export interface InjectionAnswer {
  indices: number[];
  otherText?: string;
}

const KEY_DELAY_MS = 30;

export class AskQuestionTuiInjector {
  constructor(private tmuxBridge: TmuxBridge) {}

  async injectSingleSelect(
    target: string,
    q: AskUserQuestionItem,
    answer: InjectionAnswer
  ): Promise<void> {
    const totalOptions = q.options.length;

    if (answer.otherText !== undefined) {
      for (let i = 0; i < totalOptions; i++) {
        await this.delayedKey(target, "Down");
      }
      await this.delayedKey(target, "Enter");
      await delay(200);
      this.tmuxBridge.sendKeys(target, answer.otherText);
    } else if (answer.indices.length > 0) {
      const targetIdx = answer.indices[0]!;
      for (let i = 0; i < targetIdx; i++) {
        await this.delayedKey(target, "Down");
      }
      await this.delayedKey(target, "Enter");
    }
  }

  async injectMultiSelect(
    target: string,
    q: AskUserQuestionItem,
    answer: InjectionAnswer
  ): Promise<void> {
    const totalOptions = q.options.length;
    const sorted = [...answer.indices].sort((a, b) => a - b);
    let currentPos = 0;

    for (const idx of sorted) {
      const moves = idx - currentPos;
      for (let i = 0; i < moves; i++) {
        await this.delayedKey(target, "Down");
      }
      await this.delayedKey(target, "Space");
      currentPos = idx;
    }

    if (answer.otherText !== undefined) {
      const otherPos = totalOptions;
      const moves = otherPos - currentPos;
      for (let i = 0; i < moves; i++) {
        await this.delayedKey(target, "Down");
      }
      await this.delayedKey(target, "Space");
      await this.delayedKey(target, "Enter");
      await delay(200);
      this.tmuxBridge.sendKeys(target, answer.otherText);
    }

    await this.delayedKey(target, "Enter");
  }

  async waitForTui(target: string, timeoutMs = 5000): Promise<boolean> {
    return this.tmuxBridge.waitForTuiReady(target, timeoutMs);
  }

  private async delayedKey(target: string, key: "Down" | "Up" | "Space" | "Enter"): Promise<void> {
    this.tmuxBridge.sendSpecialKey(target, key);
    await delay(KEY_DELAY_MS);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
