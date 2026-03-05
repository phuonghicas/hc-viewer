// sdk/src/modules/files.module.ts
import type {
  LoadStage,
  LoadStatePayload,
  PreparedViewerData,
} from "../contracts/events";
import { HcViewer } from "../viewer";

// config tách riêng để API sạch
export type FilesConfig = {
  baseUrl?: string;     // e.g. https://dev.3dviewer.anybim.vn (without trailing /)
  viewerPath?: string;  // e.g. /mainviewer
  uploadPath?: string;  // path param for upload endpoint
  polling?: {
    maxAttempts?: number;
    intervalMs?: number;
  };
  notify?: boolean | { success?: boolean; error?: boolean }; // nếu bạn muốn giữ hành vi cũ
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
    conversionProgress: (cb: (payload: { attempt: number; maxAttempts: number; cacheStatus?: number }) => void) => () => void;
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

  // cache upload session giống code cũ (signature-based)
  private lastUploadSession: { signature: string; baseFileId: string; fileName: string; uploadPath: string } | null = null;

  constructor(private viewer: HcViewer) {
    this.on = {
      state: (cb) => this.viewer._on("files:state", cb),

      uploadStart: (cb) => this.viewer._on("files:upload:start", cb),
      uploadSuccess: (cb) => this.viewer._on("files:upload:success", cb),
      uploadError: (cb) => this.viewer._on("files:upload:error", cb),

      conversionStart: (cb) => this.viewer._on("files:conversion:start", cb),
      conversionProgress: (cb) => this.viewer._on("files:conversion:progress", cb),
      conversionSuccess: (cb) => this.viewer._on("files:conversion:success", cb),
      conversionError: (cb) => this.viewer._on("files:conversion:error", cb),

      renderStart: (cb) => this.viewer._on("files:render:start", cb),
      renderSuccess: (cb) => this.viewer._on("files:render:success", cb),
      renderError: (cb) => this.viewer._on("files:render:error", cb),

      loadSuccess: (cb) => this.viewer._on("files:load:success", cb),
      loadError: (cb) => this.viewer._on("files:load:error", cb),
    };
  }

  setConfig(next: FilesConfig) {
    this.config = { ...this.config, ...next };
  }

  getState(): LoadStatePayload {
    return { ...this.state };
  }

  // ---------- public pipeline ----------
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

  async convert(file?: File): Promise<PreparedViewerData> {
    const target = this.resolveFile(file);
    return this.withOperation({ stage: "converting", message: "Converting file..." }, async () => {
      this.viewer._emit("files:conversion:start", { fileName: target.name });
      const prepared = await this.convertInternal(target);
      this.viewer._emit("files:conversion:success", prepared);
      return prepared;
    });
  }

  async prepare(file?: File): Promise<PreparedViewerData> {
    const target = this.resolveFile(file);
    return this.withOperation({ stage: "uploading", message: "Preparing file..." }, async () => {
      await this.uploadInternal(target);
      const prepared = await this.convertInternal(target);
      return prepared;
    });
  }

  open(input: PreparedViewerData | { url: string }) {
    const url = "url" in input ? input.url : input.url;
    this.viewer._emit("files:render:start", { url });
    try {
      this.viewer.open(url);
      this.viewer._emit("files:render:success", { url });
    } catch (e) {
      this.viewer._emit("files:render:error", { url, error: this.toErrorMessage(e) });
      throw e;
    }
  }

  async render(file?: File): Promise<PreparedViewerData> {
    const target = this.resolveFile(file);

    return this.withOperation({ stage: "uploading", message: "Uploading + converting + opening..." }, async () => {
      await this.uploadInternal(target);
      const prepared = await this.convertInternal(target);

      // open viewer
      this.updateState({ stage: "rendering", message: "Opening viewer..." });
      this.open(prepared);

      this.viewer._emit("files:load:success", prepared);
      return prepared;
    });
  }

  // ---------- internals (ported from feature-ver-6) ----------

  private resolveFile(file?: File): File {
    const optFile = this.viewer.getOptions().file;
    const target = file || optFile;
    if (!target) throw new Error("No file provided. Pass a File or set options.file");
    // store back to viewer options (optional)
    this.viewer.patchOptions({ file: target });
    return target;
  }

  private normalizeBaseUrl(input: string): string {
    return input.trim().replace(/\/+$/, "");
  }

  private resolveBaseUrl(): string {
    const raw = this.config.baseUrl || this.viewer.getOptions().baseUrl || "";
    if (!raw) throw new Error("Missing baseUrl for files pipeline");
    return this.normalizeBaseUrl(raw);
  }

  private resolveViewerPath(): string {
    const p = (this.config.viewerPath || this.viewer.getOptions().viewerPath || "/mainviewer").trim();
    if (!p) return "/mainviewer";
    return p.startsWith("/") ? p : `/${p}`;
  }

  private resolveHostConversion(): string {
    const baseUrl = this.resolveBaseUrl();
    // giữ y logic cũ: nếu baseUrl đã endsWith /service/conversion thì dùng luôn :contentReference[oaicite:13]{index=13}
    return baseUrl.endsWith("/service/conversion") ? baseUrl : `${baseUrl}/service/conversion`;
  }

  private getUploadPath(): string {
    return this.config.uploadPath || this.viewer.getOptions().uploadPath || ".";
  }

  private fileSignature(file: File): string {
    return `${file.name}::${file.size}::${file.lastModified}`;
  }

  private createBaseFileId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private createUploadSession(file: File) {
    return {
      signature: this.fileSignature(file),
      baseFileId: this.createBaseFileId(),
      fileName: file.name,
      uploadPath: this.getUploadPath(),
    };
  }

  private getUploadSessionForFile(file: File) {
    if (!this.lastUploadSession) return null;
    const sameFile = this.lastUploadSession.signature === this.fileSignature(file);
    const samePath = this.lastUploadSession.uploadPath === this.getUploadPath();
    return sameFile && samePath ? this.lastUploadSession : null;
  }

  private async uploadInternal(file: File): Promise<void> {
    this.updateState({ stage: "uploading", message: "Uploading file..." });

    try {
      const existing = this.getUploadSessionForFile(file);
      const session = existing || this.createUploadSession(file);

      const hostConversion = this.resolveHostConversion();
      const path = this.getUploadPath();

      // endpoint cũ :contentReference[oaicite:14]{index=14}
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

  private async waitForCacheReady(item: CacheListItem): Promise<void> {
    const maxAttempts = this.options.polling?.maxAttempts ?? 90;
    const delayMs = this.options.polling?.intervalMs ?? 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const status = await this.getCacheByList(item);
      this.emit("conversion:progress", {
        attempt: attempt + 1,
        maxAttempts,
        cacheStatus: status?.cacheStatus,
      });
      this.updateLoadState({
        stage: "converting",
        message: "Waiting conversion result...",
        attempt: attempt + 1,
        maxAttempts,
      });

      if (status?.cacheStatus === 2) return;
      if (status?.cacheStatus === 3) {
        throw new Error("Conversion failed with cacheStatus=3");
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error("Timeout waiting for conversion result");
  }

  private async convertInternal(file: File): Promise<PreparedViewerData> {
    // NOTE: phần convert/cache/poll bạn copy nguyên từ feature-ver-6 sang đây:
    // - buildCachePayload(...)
    // - cacheFile(...)
    // - waitForCacheReady(...)
    // - build viewer url: baseUrl + viewerPath + query (fileList JSON) :contentReference[oaicite:15]{index=15}
    //
    // Ở đây mình để skeleton để bạn “move code” cho nhanh.

    this.updateState({ stage: "converting", message: "Converting file..." });

    const uploadSession = this.getUploadSessionForFile(file) || this.createUploadSession(file);
    const baseFileIdSeed = uploadSession.baseFileId;

    // TODO: cacheFile(file, baseFileIdSeed) -> returns { baseFileId, baseMajorRev, baseMinorRev, cacheStatus, filename }
    // TODO: if cacheStatus !== 2 => waitForCacheReady(cacheListItem) w/ polling config :contentReference[oaicite:16]{index=16}
    const baseFileId = baseFileIdSeed;
    const baseMajorRev = 0;
    const baseMinorRev = 0;
    const fileName = file.name;

    const cacheListItem: CacheListItem = { baseFileId, baseMajorRev, baseMinorRev, fileName };

    // query giống code cũ (fileList JSON)
    const query = new URLSearchParams({
      fileList: JSON.stringify([cacheListItem]),
    }).toString();

    const viewerBase = this.resolveBaseUrl();
    const viewerPath = this.resolveViewerPath();
    const url = `${viewerBase}${viewerPath}?${query}`;

    return { baseFileId, baseMajorRev, baseMinorRev, fileName, query, url };
  }

  private updateState(next: Partial<LoadStatePayload>) {
    const elapsedMs = this.operationStartTime > 0 ? Date.now() - this.operationStartTime : 0;
    this.state = { ...this.state, ...next, elapsedMs };
    this.viewer._emit("files:state", this.state);
  }

  private async withOperation<T>(
    initial: { stage: LoadStage; message?: string },
    run: () => Promise<T>,
  ): Promise<T> {
    // giống y code cũ withOperation() :contentReference[oaicite:17]{index=17}
    this.operationStartTime = Date.now();
    this.updateState({
      isLoading: true,
      stage: initial.stage,
      message: initial.message,
      attempt: undefined,
      maxAttempts: undefined,
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

  private toErrorMessage(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }
}