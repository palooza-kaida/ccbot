export interface ResponseData {
  projectName?: string;
  durationMs?: number;
  responseSummary?: string;
  gitChanges?: GitChange[];
  timestamp?: string;
  model?: string;
}

export interface GitChange {
  status: string;
  file: string;
}

export type ViewState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "success"; data: ResponseData };

export interface ResponseParams {
  id: string;
  api: string;
  project: string;
  duration: number;
}
