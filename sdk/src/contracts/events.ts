// sdk/src/contracts/events.ts
export type ViewerEventMap = {
  "camera:home": { timestamp: number };
  "node:select": { nodeId: string; timestamp: number };
  "interaction:pan-change": { enabled: boolean };
};

// 2) Files pipeline (new)
export type LoadStage =
  | "idle"
  | "uploading"
  | "converting"
  | "rendering"
  | "completed"
  | "error";

export type LoadStatePayload = {
  isLoading: boolean;
  stage: LoadStage;
  message?: string;
  elapsedMs?: number;
};

export type PreparedViewerData = {
  baseFileId: string;
  baseMajorRev: number;
  baseMinorRev: number;
  fileName: string;
  query: string; // e.g. URLSearchParams string
  url: string;   // final viewer url
};

export type FilesEventMap = {
  "files:state": LoadStatePayload;

  "files:upload:start": { fileName: string };
  "files:upload:success": { fileName: string; baseFileId: string };
  "files:upload:error": { fileName: string; error: string };

  "files:conversion:start": { fileName: string };
  "files:conversion:success": PreparedViewerData;
  "files:conversion:error": { fileName: string; error: string };

  "files:render:start": { url: string };
  "files:render:success": { url: string };
  "files:render:error": { url?: string; error: string };

  "files:load:success": PreparedViewerData;
  "files:load:error": { error: string };
};

// 3) SDK EventMap = Viewer + Files
export type SdkEventMap = ViewerEventMap & FilesEventMap;
export type SdkEventKey = keyof SdkEventMap;
export type SdkEventPayload<K extends SdkEventKey> = SdkEventMap[K];
