import chevronDown from "./icons/chevron-down.svg?raw";
import github from "./icons/github.svg?raw";
import github16 from "./icons/github-16.svg?raw";
import menu from "./icons/menu.svg?raw";
import close from "./icons/close.svg?raw";
import bot from "./icons/bot.svg?raw";
import smartphone from "./icons/smartphone.svg?raw";
import copy from "./icons/copy.svg?raw";
import zap from "./icons/zap.svg?raw";
import repeat from "./icons/repeat.svg?raw";
import fileText from "./icons/file-text.svg?raw";
import filePlus from "./icons/file-plus.svg?raw";
import lock from "./icons/lock.svg?raw";
import chevronDown16 from "./icons/chevron-down-16.svg?raw";
import alertCircle from "./icons/alert-circle.svg?raw";
import logoOutline from "./icons/logo-outline.svg?raw";

export const icons = {
  chevronDown,
  github,
  github16,
  menu,
  close,
  bot,
  smartphone,
  copy,
  zap,
  repeat,
  fileText,
  filePlus,
  lock,
  chevronDown16,
  alertCircle,
  logoOutline,
} as const;

export type IconName = keyof typeof icons;
