// sdk/src/modules/files.module.ts
import type {
  LoadStage,
  LoadStatePayload,
  PreparedViewerData,
} from "../contracts/events";
import { Viewer3D } from "../viewer";

const DEFAULT_API_BASE_URL = "https://dev.3dviewer.anybim.vn";
const DEFAULT_VIEWER_ORIGIN = "http://localhost:3000";

export type FilesConfig = {
  baseUrl?: string;    
  viewerPath?: string;  
  uploadPath?: string;  
};

type CacheListItem = {
  baseFileId: string;
  baseMajorRev: number;
  baseMinorRev: number;
  fileName: string;
};

type CacheResponseItem = {
  baseFileId?: string;
  baseMajorRev?: number;
  baseMinorRev?: number;
  cacheStatus?: number;
  filename?: string;
};

export class FilesModule {
  public on: {
    state: (cb: (payload: LoadStatePayload) => void) => () => void;

    uploadStart: (cb: (payload: { fileName: string }) => void) => () => void;
    uploadSuccess: (cb: (payload: { fileName: string; baseFileId: string }) => void) => () => void;
    uploadError: (cb: (payload: { fileName: string; error: string }) => void) => () => void;

    conversionStart: (cb: (payload: { fileName: string }) => void) => () => void;
    conversionSuccess: (cb: (payload: PreparedViewerData) => void) => () => void;
    conversionError: (cb: (payload: { fileName: string; error: string }) => void) => () => void;

    renderStart: (cb: (payload: { url: string }) => void) => () => void;
    renderSuccess: (cb: (payload: { url: string }) => void) => () => void;
    renderError: (cb: (payload: { url?: string; error: string }) => void) => () => void;

    loadSuccess: (cb: (payload: PreparedViewerData) => void) => () => void;
    loadError: (cb: (payload: { error: string }) => void) => () => void;
  };

  private config: FilesConfig = {};
  private operationStartTime = 0;

  private state: LoadStatePayload = {
    isLoading: false,
    stage: "idle",
  };

 
  private lastUploadSession: { signature: string; baseFileId: string; fileName: string; uploadPath: string } | null = null;

  constructor(private viewer: Viewer3D) {
    // Bind external event helpers to internal typed emitter events.
    this.on = {
      state: (cb) => this.viewer._on("files:state", cb),

      uploadStart: (cb) => this.viewer._on("files:upload:start", cb),
      uploadSuccess: (cb) => this.viewer._on("files:upload:success", cb),
      uploadError: (cb) => this.viewer._on("files:upload:error", cb),

      conversionStart: (cb) => this.viewer._on("files:conversion:start", cb),
      conversionSuccess: (cb) => this.viewer._on("files:conversion:success", cb),
      conversionError: (cb) => this.viewer._on("files:conversion:error", cb),

      renderStart: (cb) => this.viewer._on("files:render:start", cb),
      renderSuccess: (cb) => this.viewer._on("files:render:success", cb),
      renderError: (cb) => this.viewer._on("files:render:error", cb),

      loadSuccess: (cb) => this.viewer._on("files:load:success", cb),
      loadError: (cb) => this.viewer._on("files:load:error", cb),
    };
  }

  // Merge file-pipeline runtime config.
  setConfig(next: FilesConfig) {
    this.config = { ...this.config, ...next };
  }

  // Return a snapshot of current loading state.
  getState(): LoadStatePayload {
    return { ...this.state };
  }

  // ---------- public pipeline ----------
  // Upload file to conversion server and keep generated baseFileId in session.
  async upload(file?: File): Promise<{ fileName: string; baseFileId: string }> {
    const target = this.resolveFile(file);
    return this.withOperation({ stage: "uploading", message: "Uploading file..." }, async () => {
      this.viewer._emit("files:upload:start", { fileName: target.name });
      await this.uploadInternal(target);

      const baseFileId = this.getUploadSessionForFile(target)?.baseFileId || "";
      this.viewer._emit("files:upload:success", { fileName: target.name, baseFileId });
      return { fileName: target.name, baseFileId };
    });
  }

  // Trigger conversion flow and resolve final viewer metadata.
  async convert(file?: File): Promise<PreparedViewerData> {
    const target = this.resolveFile(file);
    return this.withOperation({ stage: "converting", message: "Converting file..." }, async () => {
      this.viewer._emit("files:conversion:start", { fileName: target.name });
      try {
        const prepared = await this.convertInternal(target);
        this.viewer._emit("files:conversion:success", prepared);
        return prepared;
      } catch (e) {
        this.viewer._emit("files:conversion:error", { fileName: target.name, error: this.toErrorMessage(e) });
        throw e;
      }
    });
  }

  // Convenience API: upload first, then convert in one call.
  async prepare(file?: File): Promise<PreparedViewerData> {
    const target = this.resolveFile(file);
    return this.withOperation({ stage: "uploading", message: "Preparing file..." }, async () => {
      await this.uploadInternal(target);
      const prepared = await this.convertInternal(target);
      return prepared;
    });
  }

  // Open iframe with an already prepared viewer URL.
  open(input: PreparedViewerData | { url: string }) {
    const url = input.url;
    this.viewer._emit("files:render:start", { url });
    try {
      this.viewer.open(url);
      this.viewer._emit("files:render:success", { url });
    } catch (e) {
      this.viewer._emit("files:render:error", { url, error: this.toErrorMessage(e) });
      throw e;
    }
  }

  // Full pipeline: upload + convert + open iframe.
  async render(file?: File): Promise<PreparedViewerData> {
    const target = this.resolveFile(file);

   return this.withOperation({ stage: "uploading", message: "Uploading + converting + opening..." }, async () => {
     await this.upload(target);
     const prepared = await this.convert(target);

      // open viewer
      this.updateState({ stage: "rendering", message: "Opening viewer..." });
      this.open(prepared);

      this.viewer._emit("files:load:success", prepared);
      return prepared;
    });
  }

  // Resolve file argument, fallback to options.file, and persist it back.
  private resolveFile(file?: File): File {
    const optFile = this.viewer.getOptions().file;
    const target = file || optFile;
    if (!target) throw new Error("No file provided. Pass a File or set options.file");
    // store back to viewer options (optional)
    this.viewer.patchOptions({ file: target });
    return target;
  }

  // Trim input URL and remove trailing slash.
  private normalizeBaseUrl(input: string): string {
    return input.trim().replace(/\/+$/, "");
  }

  // Resolve API base URL with default fallback.
  private resolveBaseUrl(): string {
    const raw = this.config.baseUrl || this.viewer.getOptions().baseUrl || DEFAULT_API_BASE_URL;
    return this.normalizeBaseUrl(raw);
  }

  // Resolve viewer route path (e.g. /mainviewer).
  private resolveViewerPath(): string {
    const p = (this.config.viewerPath || this.viewer.getOptions().viewerPath || "/mainviewer").trim();
    if (!p) return "/mainviewer";
    return p.startsWith("/") ? p : `/${p}`;
  }

  // Viewer host used to open iframe after conversion completes.
  private resolveViewerOrigin(): string {
    return this.normalizeBaseUrl(DEFAULT_VIEWER_ORIGIN);
  }

  // Build conversion service root from API base URL.
  private resolveHostConversion(): string {
    const baseUrl = this.resolveBaseUrl();
 
    return baseUrl.endsWith("/service/conversion") ? baseUrl : `${baseUrl}/service/conversion`;
  }

  // Resolve upload path sent to conversion APIs.
  private getUploadPath(): string {
    return this.config.uploadPath || this.viewer.getOptions().uploadPath || ".";
  }

  // Build a stable in-memory signature to identify same file uploads.
  private fileSignature(file: File): string {
    return `${file.name}::${file.size}::${file.lastModified}`;
  }

  // Create a UUID-like baseFileId when caller does not provide one.
  private createBaseFileId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Create upload session metadata reused between upload and convert.
  private createUploadSession(file: File) {
    return {
      signature: this.fileSignature(file),
      baseFileId: this.createBaseFileId(),
      fileName: file.name,
      uploadPath: this.getUploadPath(),
    };
  }

  // Return previous upload session for same file and upload path.
  private getUploadSessionForFile(file: File) {
    if (!this.lastUploadSession) return null;
    const sameFile = this.lastUploadSession.signature === this.fileSignature(file);
    const samePath = this.lastUploadSession.uploadPath === this.getUploadPath();
    return sameFile && samePath ? this.lastUploadSession : null;
  }

  // Call upload endpoint and persist upload session on success.
  private async uploadInternal(file: File): Promise<void> {
    this.updateState({ stage: "uploading", message: "Uploading file..." });

    try {
      const existing = this.getUploadSessionForFile(file);
      const session = existing || this.createUploadSession(file);

      const hostConversion = this.resolveHostConversion();
      const path = this.getUploadPath();

      // upload endpoint
      const url = `${hostConversion}/api/File/upload?path=${encodeURIComponent(path)}`;
      const formData = new FormData();
      formData.append("file", file, file.name);

      const res = await fetch(url, { method: "POST", body: formData, headers: { Accept: "text/plain" } });
      if (!res.ok) throw new Error(`Upload failed (${res.status} ${res.statusText})`);

      this.lastUploadSession = session;
    } catch (e) {
      const msg = this.toErrorMessage(e);
      this.viewer._emit("files:upload:error", { fileName: file.name, error: msg });
      throw e;
    }
  }

  // Build StreamFile payload compatible with conversion service.
  private buildCachePayload(file: File, baseFileId: string) {
    const createdDate = new Date().toISOString();
    return {
      filename: file.name,
      baseFileId,
      baseMajorRev: 0,
      baseMinorRev: 0,
      isChecked: false,
      status: { size: file.size },
      child: [],
      isDirectory: false,
      createdDate,
      cacheStatus: 0,
      modelFileId: "",
      id: "",
      originalFilePath: this.getUploadPath(),
      streamLocation: null,
      converter: "Hoops",
      originalSize: 0,
      cacheSize: 0,
      importTime: 0,
      importAssemblyTreeTime: 0,
      creator: {
        id: "00000000-0000-0000-0000-000000000000",
        name: "Anonymous",
      },
      originalFile: file.name,
      multiStream: false,
      isRootModel: 0,
      extraConvertOutput: "",
      cacheFilename: null,
      errorMassage: null,
      convertOptions: {
        convert3DModel: 1,
        convert2DSheet: 1,
        extractProperties: 1,
        childModels: 0,
      },
      drawingConvertStatus: {
        convert3DModel: 5,
        convert2DSheet: 5,
        extractProperties: 5,
      },
      attemptedConvertTimes: 0,
    };
  }

  // Submit conversion/caching request and return service response.
  private async cacheFile(
    file: File,
    baseFileId: string
  ): Promise<CacheResponseItem> {
    const hostConversion = await this.resolveHostConversion();
    const url = `${hostConversion}/api/StreamFile?overwrite=true&ignore_line_weight=1`;
    const payload = this.buildCachePayload(file, baseFileId);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Cache/convert failed (${response.status} ${response.statusText})`
      );
    }

    return (await response.json()) as CacheResponseItem;
  }

  // Convert file and generate final iframe URL with query string.
  private async convertInternal(file: File): Promise<PreparedViewerData> {

    this.updateState({ stage: "converting", message: "Converting file..." });

    const uploadSession = this.getUploadSessionForFile(file) || this.createUploadSession(file);
    const seedBaseFileId = uploadSession.baseFileId;

   // 1) request cache/convert
    const cacheResult = await this.cacheFile(file, seedBaseFileId);

    const baseFileId = cacheResult.baseFileId ?? seedBaseFileId;
    const baseMajorRev = cacheResult.baseMajorRev ?? 0;
    const baseMinorRev = cacheResult.baseMinorRev ?? 0;
    const fileName = cacheResult.filename || file.name;

    const cacheListItem: CacheListItem = { baseFileId, baseMajorRev, baseMinorRev, fileName };

    // Single-shot mode: one conversion request only, no polling retry.
    if (cacheResult.cacheStatus !== 2) {
      throw new Error(`Conversion not ready after first request (cacheStatus=${cacheResult.cacheStatus ?? "unknown"})`);
    }

    // 3) build viewer url
    const query = new URLSearchParams({ fileList: JSON.stringify([cacheListItem]) }).toString();
    const viewerBase = this.resolveViewerOrigin();
    const viewerPath = this.resolveViewerPath();
    const url = `${viewerBase}${viewerPath}?${query}`;

    return { baseFileId, baseMajorRev, baseMinorRev, fileName, query, url };

  }

  // Update internal loading state and emit state event.
  private updateState(next: Partial<LoadStatePayload>) {
    const elapsedMs = this.operationStartTime > 0 ? Date.now() - this.operationStartTime : 0;
    this.state = { ...this.state, ...next, elapsedMs };
    this.viewer._emit("files:state", this.state);
  }

  // Shared wrapper to handle loading state lifecycle and top-level errors.
  private async withOperation<T>(
    initial: { stage: LoadStage; message?: string },
    run: () => Promise<T>,
  ): Promise<T> {
    // shared operation wrapper for loading state and errors
    this.operationStartTime = Date.now();
    this.updateState({
      isLoading: true,
      stage: initial.stage,
      message: initial.message,
    });

    try {
      const result = await run();
      this.updateState({ isLoading: false, stage: "completed", message: "Completed" });
      return result;
    } catch (e) {
      const msg = this.toErrorMessage(e);
      this.updateState({ isLoading: false, stage: "error", message: msg });
      this.viewer._emit("files:load:error", { error: msg });
      throw e;
    }
  }

  // Normalize unknown error shape into displayable message.
  private toErrorMessage(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }
}
