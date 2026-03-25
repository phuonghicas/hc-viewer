// sdk/src/contracts/events.ts
import type {
  MarkupListItem,
  MarkupOperationResultPayload,
  PdfCurrentPagePayload,
  PdfModeEventPayload,
  PdfToolbarActionEventPayload,
} from "./messages";

export type ViewerEventMap = {
  "camera:home": { timestamp: number };
  "node:select": { nodeId: string; timestamp: number };
  "interaction:pan-change": { enabled: boolean };
  "toolbar:pdf-plan-mode": PdfModeEventPayload;
  "toolbar:pdf-document-mode": PdfModeEventPayload;
  "toolbar:pdf-first-page": PdfToolbarActionEventPayload;
  "toolbar:pdf-previous-page": PdfToolbarActionEventPayload;
  "toolbar:pdf-next-page": PdfToolbarActionEventPayload;
  "toolbar:pdf-last-page": PdfToolbarActionEventPayload;
  "toolbar:pdf-current-page": PdfCurrentPagePayload;
  "modelTree:node-ids": { requestId: string; nodeIds: string[]; timestamp: number };
  "sheets:list": { requestId: string; sheets: { id: string | number; name: string; is3D?: boolean; viewId?: string }[]; activeSheetId?: string | number | null; timestamp: number };
  "markup:list": { requestId: string; markups: MarkupListItem[]; timestamp: number };
  "markup:save": MarkupOperationResultPayload;
  "markup:cancel": MarkupOperationResultPayload;
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
