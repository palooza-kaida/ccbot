import { useEffect, useState } from "preact/hooks";
import type { ViewState } from "./types";
import { tClient } from "../../i18n";
import { fetchResponse, parseQueryParams } from "./api";
import { ErrorState, GitChangesPanel, LoadingState, ResponseMeta } from "./ResponseParts";
import { MarkdownBody } from "./MarkdownBody";

declare const Telegram: { WebApp: { ready: () => void; expand: () => void } } | undefined;

export default function ResponseViewer() {
  const [viewState, setViewState] = useState<ViewState>({ kind: "loading" });
  const [project, setProject] = useState("");
  const [durationMs, setDurationMs] = useState(0);
  const [timestamp, setTimestamp] = useState<string | undefined>();

  useEffect(() => {
    if (typeof Telegram !== "undefined" && Telegram?.WebApp) {
      Telegram.WebApp.ready();
      Telegram.WebApp.expand();
    }
    loadResponse();
  }, []);

  async function loadResponse() {
    const params = parseQueryParams();
    if (!params) {
      setViewState({ kind: "error", message: tClient("responseNotFound") });
      return;
    }

    setProject(params.project);
    setDurationMs(params.duration);

    try {
      const result = await fetchResponse(params);
      if (result.kind !== "success") {
        setViewState({ kind: "error", message: tClient("responseExpired") });
        return;
      }

      if (result.data.projectName) setProject(result.data.projectName);
      if (result.data.durationMs) setDurationMs(result.data.durationMs);
      if (result.data.timestamp) setTimestamp(result.data.timestamp);
      setViewState(result);
    } catch {
      setViewState({ kind: "error", message: tClient("responseExpired") });
    }
  }

  return (
    <div class="rv">
      <main class="rv__body">
        <ResponseMeta project={project} durationMs={durationMs} timestamp={timestamp} />
        {viewState.kind === "loading" && <LoadingState />}
        {viewState.kind === "error" && <ErrorState message={viewState.message} />}
        {viewState.kind === "success" && (
          <>
            {viewState.data.responseSummary && (
              <MarkdownBody content={viewState.data.responseSummary} />
            )}
            <GitChangesPanel changes={viewState.data.gitChanges ?? []} />
          </>
        )}
      </main>
    </div>
  );
}
