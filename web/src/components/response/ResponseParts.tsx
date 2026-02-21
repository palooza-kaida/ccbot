
import { useState } from "preact/hooks";
import { tClient } from "../../i18n";
import { formatDuration, formatModelName } from "../../lib/format";
import { GIT_STATUS_STYLES } from "../../lib/constants";
import type { GitChange } from "./types";

export function ResponseMeta({
  project,
  durationMs,
  timestamp,
  model,
}: {
  project: string;
  durationMs: number;
  timestamp?: string;
  model?: string;
}) {
  const hasAnyMeta = project || durationMs > 0 || timestamp || model;
  if (!hasAnyMeta) return null;

  const leftParts: string[] = [];
  if (project) leftParts.push(project);
  if (durationMs > 0) leftParts.push(formatDuration(durationMs));

  let dateStr = "";
  if (timestamp) {
    const d = new Date(timestamp);
    const date = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    dateStr = `${date} ${time}`;
  }

  const rightParts: preact.JSX.Element[] = [];
  if (model) {
    rightParts.push(<span class="rv-header__model" key="model">{formatModelName(model)}</span>);
  }
  if (dateStr) {
    rightParts.push(<span key="date">{dateStr}</span>);
  }

  return (
    <div class="rv-header">
      <span class="rv-header__left">{leftParts.join(" · ")}</span>
      {rightParts.length > 0 && (
        <span class="rv-header__right">{rightParts}</span>
      )}
    </div>
  );
}

export function GitChangesPanel({ changes }: { changes: GitChange[] }) {
  const [expanded, setExpanded] = useState(true);
  if (!changes.length) return null;

  const counts = changes.reduce(
    (acc, c) => {
      const key = c.status as keyof typeof acc;
      if (key in acc) acc[key]++;
      return acc;
    },
    { added: 0, modified: 0, deleted: 0, renamed: 0 },
  );

  return (
    <div class="rv-changes">
      <button
        type="button"
        class="rv-changes__toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span class="rv-changes__label">{tClient("responseChanges")}</span>
        <span class="rv-changes__badge">{changes.length}</span>
        <span class="rv-changes__stats">
          {counts.added > 0 && <span class="rv-stat rv-stat--add">+{counts.added}</span>}
          {counts.modified > 0 && <span class="rv-stat rv-stat--mod">~{counts.modified}</span>}
          {counts.deleted > 0 && <span class="rv-stat rv-stat--del">-{counts.deleted}</span>}
          {counts.renamed > 0 && <span class="rv-stat rv-stat--ren">R{counts.renamed}</span>}
        </span>
        <svg
          class={`rv-changes__arrow ${expanded ? "rv-changes__arrow--open" : ""}`}
          width="16" height="16" viewBox="0 0 16 16" fill="currentColor"
        >
          <path d="M12.78 6.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 011.06-1.06L8 9.94l3.72-3.72a.75.75 0 011.06 0z"/>
        </svg>
      </button>

      {expanded && (
        <div class="rv-changes__list">
          {changes.map((change) => {
            const style = GIT_STATUS_STYLES[change.status] ?? GIT_STATUS_STYLES.modified;
            const parts = change.file.split("/");
            const fileName = parts.pop()!;
            const dirPath = parts.length ? parts.join("/") + "/" : "";

            return (
              <div key={change.file} class="rv-changes__file">
                <span class={`rv-changes__status ${style.cls}`}>{style.label}</span>
                <span class="rv-changes__path">
                  {dirPath && <span class="rv-changes__dir">{dirPath}</span>}
                  <span class="rv-changes__name">{fileName}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LoadingState() {
  return (
    <div class="rv-loading">
      <div class="rv-loading__bar" />
      <div class="rv-loading__skeleton">
        <div class="rv-skel rv-skel--h1" />
        <div class="rv-skel rv-skel--p" />
        <div class="rv-skel rv-skel--p rv-skel--short" />
        <div class="rv-skel rv-skel--gap" />
        <div class="rv-skel rv-skel--h2" />
        <div class="rv-skel rv-skel--p" />
        <div class="rv-skel rv-skel--p rv-skel--mid" />
        <div class="rv-skel rv-skel--p rv-skel--short" />
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div class="rv-error">
      <svg class="rv-error__icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="rv-error__text">{message}</p>
    </div>
  );
}
