import { useEffect, useState } from "preact/hooks";
import type { ViewState } from "./types";
import { ts, getLocaleFromUrl, type Locale } from "../../i18n";
import { fetchResponse, parseQueryParams } from "./api";
import { ErrorState, GitChangesPanel, LoadingState, ResponseMeta } from "./ResponseParts";
import { MarkdownBody } from "./MarkdownBody";

declare const Telegram: { WebApp: { ready: () => void; expand: () => void } } | undefined;

export default function ResponseViewer({ locale: localeProp }: { locale?: Locale }) {
  const locale = localeProp ?? getLocaleFromUrl(new URL(window.location.href));
  const [viewState, setViewState] = useState<ViewState>({ kind: "loading" });
  const [project, setProject] = useState("");
  const [durationMs, setDurationMs] = useState(0);
  const [timestamp, setTimestamp] = useState<string | undefined>();
  const [model, setModel] = useState("");

  useEffect(() => {
    initTelegram();
    loadResponse();
  }, []);

  function initTelegram(retries = 0) {
    if (typeof Telegram !== "undefined" && Telegram?.WebApp) {
      Telegram.WebApp.ready();
      Telegram.WebApp.expand();
    } else if (retries < 10) {
      setTimeout(() => initTelegram(retries + 1), 300);
    }
  }

  async function loadResponse() {
    const params = parseQueryParams();
    if (!params) {
      setViewState({ kind: "error", message: ts(locale, "responseNotFound") });
      return;
    }

    setProject(params.project);
    setDurationMs(params.duration);

    try {
      const result = await fetchResponse(params);
      if (result.kind !== "success") {
        setViewState({ kind: "error", message: ts(locale, "responseExpired") });
        return;
      }

      if (result.data.projectName) setProject(result.data.projectName);
      if (result.data.durationMs) setDurationMs(result.data.durationMs);
      if (result.data.timestamp) setTimestamp(result.data.timestamp);
      if (result.data.model) setModel(result.data.model);
      setViewState(result);
    } catch {
      setViewState({ kind: "error", message: ts(locale, "responseExpired") });
    }
  }

  return (
    <div class="rv">
      <main class="rv__body">
        <ResponseMeta project={project} durationMs={durationMs} timestamp={timestamp} model={model} locale={locale} />
        {viewState.kind === "loading" && <LoadingState />}
        {viewState.kind === "error" && <ErrorState message={viewState.message} />}
        {viewState.kind === "success" && (
          <>
            {viewState.data.responseSummary && (
              <MarkdownBody content={viewState.data.responseSummary} />
            )}
            <GitChangesPanel changes={viewState.data.gitChanges ?? []} locale={locale} />
          </>
        )}
      </main>
    </div>
  );
}
