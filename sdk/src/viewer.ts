export type HcViewerOptions = {
  container: HTMLElement | string;
  baseUrl?: string;
  viewerPath?: string;
  uploadPath?: string;
  file?: File;
  width?: string;
  height?: string;
  sandbox?: string;
  allowedOrigin?: string;
  notify?:
    | boolean
    | {
        success?: boolean;
        error?: boolean;
      };
  polling?: {
    maxAttempts?: number;
    intervalMs?: number;
  };
};

export enum ViewerMessageType {
  ZOOM = "viewer-zoom",
  HOME = "viewer-home",
  PAN_TOGGLE = "viewer-pan-toggle",

  HOME_CLICK = "viewer-home-click",
  NODE_SELECT = "viewer-node-select",
  PAN_CHANGE = "viewer-pan-change",
}

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
  attempt?: number;
  maxAttempts?: number;
  elapsedMs?: number;
};

export type PreparedViewerData = {
  baseFileId: string;
  baseMajorRev: number;
  baseMinorRev: number;
  fileName: string;
  query: string;
  url: string;
};

type ViewerEventMap = {
  "camera:home": { timestamp: number };
  "node:select": { nodeId: string; timestamp: number };
  "interaction:pan-change": { enabled: boolean };
  "load:state": LoadStatePayload;
  "upload:start": { fileName: string };
  "upload:success": { fileName: string; baseFileId: string };
  "upload:error": { fileName: string; error: string };
  "conversion:start": { fileName: string };
  "conversion:progress": {
    attempt: number;
    maxAttempts: number;
    cacheStatus?: number;
  };
  "conversion:success": PreparedViewerData;
  "conversion:error": { fileName: string; error: string };
  "render:start": { url: string };
  "render:success": { url: string };
  "render:error": { url?: string; error: string };
  "load:success": PreparedViewerData;
  "load:error": { error: string };
};

type CacheListItem = {
  baseFileId: string;
  baseMajorRev: number;
  baseMinorRev: number;
  fileName?: string;
};

type CacheResponseItem = {
  baseFileId?: string;
  baseMajorRev?: number;
  baseMinorRev?: number;
  cacheStatus?: number;
  filename?: string;
};

type UploadSession = {
  signature: string;
  baseFileId: string;
  fileName: string;
  uploadPath: string;
};

export class HcViewer {
  private container: HTMLElement;
  private iframe: HTMLIFrameElement | null = null;
  private options: HcViewerOptions;
  private hostConversion: string | null = null;
  private preparedData: PreparedViewerData | null = null;
  private lastUploadSession: UploadSession | null = null;
  private operationStartTime = 0;
  private loadingState: LoadStatePayload = {
    isLoading: false,
    stage: "idle",
  };

  private listeners: {
    [K in keyof ViewerEventMap]?: Array<
      (payload: ViewerEventMap[K]) => void
    >;
  } = {};

  constructor(options: HcViewerOptions) {
    this.container =
      typeof options.container === "string"
        ? (document.querySelector(options.container) as HTMLElement)
        : options.container;

    if (!this.container) {
      throw new Error("Container element not found");
    }

    this.options = options;
    window.addEventListener("message", this.handleMessage);
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Unknown error";
  }

  private shouldNotify(kind: "success" | "error"): boolean {
    const notify = this.options.notify;
    if (typeof notify === "boolean") return notify;
    if (!notify) return kind === "error";
    if (kind === "success") return !!notify.success;
    return notify.error !== false;
  }

  private notifyUser(kind: "success" | "error", message: string): void {
    if (!this.shouldNotify(kind)) return;
    if (typeof window === "undefined" || typeof window.alert !== "function") {
      return;
    }
    window.alert(message);
  }

  private updateLoadState(next: Partial<LoadStatePayload>): void {
    const elapsedMs =
      this.operationStartTime > 0 ? Date.now() - this.operationStartTime : 0;
    this.loadingState = {
      ...this.loadingState,
      ...next,
      elapsedMs,
    };
    this.emit("load:state", this.loadingState);
  }

  getLoadingState(): LoadStatePayload {
    return { ...this.loadingState };
  }

  isLoading(): boolean {
    return this.loadingState.isLoading;
  }

  private async withOperation<T>(
    initial: { stage: LoadStage; message?: string },
    run: () => Promise<T>
  ): Promise<T> {
    this.operationStartTime = Date.now();
    this.updateLoadState({
      isLoading: true,
      stage: initial.stage,
      message: initial.message,
      attempt: undefined,
      maxAttempts: undefined,
    });
    try {
      const result = await run();
      this.updateLoadState({
        isLoading: false,
        stage: "completed",
        message: "Completed",
      });
      return result;
    } catch (error) {
      const message = this.toErrorMessage(error);
      this.updateLoadState({
        isLoading: false,
        stage: "error",
        message,
      });
      this.emit("load:error", { error: message });
      throw error;
    }
  }

  private normalizeBaseUrl(input: string): string {
    return input.trim().replace(/\/+$/, "");
  }

  private resolveBaseUrl(): string {
    const raw = this.options.baseUrl || "https://dev.3dviewer.anybim.vn";
    if (!raw) return "https://dev.3dviewer.anybim.vn";
    return this.normalizeBaseUrl(raw);
  }

  private resolveViewerBaseUrl(): string {
    return "http://localhost:3000";
  }

  private resolveViewerPath(): string {
    const path = (this.options.viewerPath || "/mainviewer").trim();
    if (!path) return "/mainviewer";
    return path.startsWith("/") ? path : `/${path}`;
  }

  private resolveAllowedOrigin(): string {
    if (this.options.allowedOrigin) return this.options.allowedOrigin;
    try {
      return new URL(this.resolveViewerBaseUrl()).origin;
    } catch (error) {
      return "*";
    }
  }

  private createBaseFileId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.floor(Math.random() * 16);
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private getUploadPath(): string {
    return this.options.uploadPath || ".";
  }

  private fileSignature(file: File): string {
    return `${file.name}::${file.size}::${file.lastModified}`;
  }

  private createUploadSession(file: File): UploadSession {
    return {
      signature: this.fileSignature(file),
      baseFileId: this.createBaseFileId(),
      fileName: file.name,
      uploadPath: this.getUploadPath(),
    };
  }

  private getUploadSessionForFile(file: File): UploadSession | null {
    if (!this.lastUploadSession) return null;
    const sameFile = this.lastUploadSession.signature === this.fileSignature(file);
    const samePath = this.lastUploadSession.uploadPath === this.getUploadPath();
    return sameFile && samePath ? this.lastUploadSession : null;
  }

  private async resolveHostConversion(): Promise<string> {
    if (this.hostConversion) return this.hostConversion;

    const baseUrl = this.resolveBaseUrl();
    if (baseUrl.endsWith("/service/conversion")) {
      this.hostConversion = baseUrl;
      return this.hostConversion;
    }

    this.hostConversion = `${baseUrl}/service/conversion`;
    return this.hostConversion;
  }

  private async uploadFile(file: File): Promise<void> {
    const hostConversion = await this.resolveHostConversion();
    const path = this.options.uploadPath || ".";
    const url = `${hostConversion}/api/File/upload?path=${encodeURIComponent(
      path
    )}`;
    const formData = new FormData();
    formData.append("file", file, file.name);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "text/plain",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Upload failed (${response.status} ${response.statusText})`
      );
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

  private async getCacheByList(
    item: CacheListItem
  ): Promise<CacheResponseItem | null> {
    const hostConversion = await this.resolveHostConversion();
    const url = `${hostConversion}/api/StreamFile/item`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify([item]),
    });

    if (!response.ok) return null;
    const result = (await response.json()) as CacheResponseItem[];
    if (!Array.isArray(result) || result.length === 0) return null;
    return result[0];
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

  private buildViewerUrl(query: string): string {
    const baseUrl = this.resolveViewerBaseUrl();
    const viewerPath = this.resolveViewerPath();
    const queryNormalized = (query || "").replace(/^\?+/, "");
    const viewerBase = `${baseUrl}${viewerPath}`;
    if (!queryNormalized) return viewerBase;
    return `${viewerBase}?${queryNormalized}`;
  }

  private resolveFile(file?: File): File {
    if (file) {
      this.options.file = file;
      return file;
    }
    if (this.options.file) return this.options.file;
    throw new Error(
      "No file provided. Pass file via options.file or upload/prepare/render(file)."
    );
  }

  private async uploadInternal(file: File): Promise<void> {
    const uploadSession = this.createUploadSession(file);
    this.updateLoadState({
      stage: "uploading",
      message: "Uploading file...",
    });
    this.emit("upload:start", { fileName: file.name });
    try {
      await this.uploadFile(file);
      this.lastUploadSession = uploadSession;
      this.emit("upload:success", {
        fileName: file.name,
        baseFileId: uploadSession.baseFileId,
      });
      this.notifyUser("success", `Upload success: ${file.name}`);
    } catch (error) {
      const message = this.toErrorMessage(error);
      this.emit("upload:error", {
        fileName: file.name,
        error: message,
      });
      this.notifyUser("error", `Upload failed: ${message}`);
      throw error;
    }
  }

  private async convertInternal(file: File): Promise<PreparedViewerData> {
    this.updateLoadState({
      stage: "converting",
      message: "Converting file...",
      attempt: undefined,
      maxAttempts: undefined,
    });
    this.emit("conversion:start", { fileName: file.name });

    try {
      const uploadSession = this.getUploadSessionForFile(file);
      const baseFileIdSeed = uploadSession
        ? uploadSession.baseFileId
        : this.createBaseFileId();

      const cacheResult = await this.cacheFile(file, baseFileIdSeed);
      const baseFileId = cacheResult.baseFileId || baseFileIdSeed;
      const baseMajorRev = cacheResult.baseMajorRev ?? 0;
      const baseMinorRev = cacheResult.baseMinorRev ?? 0;
      const fileName = cacheResult.filename || file.name;

      const cacheListItem: CacheListItem = {
        baseFileId,
        baseMajorRev,
        baseMinorRev,
        fileName,
      };

      if (cacheResult.cacheStatus !== 2) {
        await this.waitForCacheReady(cacheListItem);
      }

      const query = new URLSearchParams({
        fileList: JSON.stringify([cacheListItem]),
      }).toString();
      const prepared: PreparedViewerData = {
        baseFileId,
        baseMajorRev,
        baseMinorRev,
        fileName,
        query,
        url: this.buildViewerUrl(query),
      };

      this.emit("conversion:success", prepared);
      this.notifyUser("success", `Conversion success: ${fileName}`);
      return prepared;
    } catch (error) {
      const message = this.toErrorMessage(error);
      this.emit("conversion:error", {
        fileName: file.name,
        error: message,
      });
      this.notifyUser("error", `Conversion failed: ${message}`);
      throw error;
    }
  }

  async upload(file?: File): Promise<{ fileName: string; baseFileId: string }> {
    const target = this.resolveFile(file);
    return this.withOperation(
      { stage: "uploading", message: "Uploading file..." },
      async () => {
        await this.uploadInternal(target);
        const baseFileId =
          this.getUploadSessionForFile(target)?.baseFileId || "";
        return { fileName: target.name, baseFileId };
      }
    );
  }

  async convert(file?: File): Promise<PreparedViewerData> {
    const target = this.resolveFile(file);
    return this.withOperation(
      { stage: "converting", message: "Converting file..." },
      async () => {
        const prepared = await this.convertInternal(target);
        this.preparedData = prepared;
        return prepared;
      }
    );
  }

  async prepare(file?: File): Promise<PreparedViewerData> {
    const target = this.resolveFile(file);
    return this.withOperation(
      { stage: "uploading", message: "Preparing model..." },
      async () => {
        await this.uploadInternal(target);
        const prepared = await this.convertInternal(target);
        this.preparedData = prepared;
        this.emit("load:success", prepared);
        return prepared;
      }
    );
  }

  private async renderPreparedInternal(
    prepared: PreparedViewerData
  ): Promise<void> {
    this.updateLoadState({
      stage: "rendering",
      message: "Rendering iframe...",
      attempt: undefined,
      maxAttempts: undefined,
    });
    this.emit("render:start", { url: prepared.url });
    try {
      if (this.iframe) {
        this.container.removeChild(this.iframe);
        this.iframe = null;
      }

      const iframe = document.createElement("iframe");
      iframe.src = prepared.url;
      iframe.width = this.options.width || "100%";
      iframe.height = this.options.height || "100%";
      iframe.style.border = "none";

      if (this.options.sandbox) {
        iframe.setAttribute("sandbox", this.options.sandbox);
      }

      this.container.appendChild(iframe);
      this.iframe = iframe;

      this.emit("render:success", { url: prepared.url });
      this.notifyUser("success", "Viewer rendered successfully.");
    } catch (error) {
      const message = this.toErrorMessage(error);
      this.emit("render:error", { url: prepared.url, error: message });
      this.notifyUser("error", `Render failed: ${message}`);
      throw error;
    }
  }

  async renderPrepared(prepared?: PreparedViewerData): Promise<void> {
    const finalPrepared = prepared || this.preparedData;
    if (!finalPrepared) {
      throw new Error(
        "No prepared data found. Call prepare(file) first or pass prepared data."
      );
    }
    await this.withOperation(
      { stage: "rendering", message: "Rendering viewer..." },
      async () => {
        await this.renderPreparedInternal(finalPrepared);
      }
    );
  }

  async render(file?: File): Promise<void> {
    const target = this.resolveFile(file);
    await this.withOperation(
      { stage: "uploading", message: "Preparing and rendering..." },
      async () => {
        await this.uploadInternal(target);
        const prepared = await this.convertInternal(target);
        this.preparedData = prepared;
        await this.renderPreparedInternal(prepared);
        this.emit("load:success", prepared);
      }
    );
  }

  destroy(): void {
    window.removeEventListener("message", this.handleMessage);
    if (this.iframe) {
      this.container.removeChild(this.iframe);
      this.iframe = null;
    }
    this.listeners = {};
    this.preparedData = null;
    this.lastUploadSession = null;
    this.loadingState = {
      isLoading: false,
      stage: "idle",
      message: undefined,
      attempt: undefined,
      maxAttempts: undefined,
      elapsedMs: 0,
    };
  }

  on<K extends keyof ViewerEventMap>(
    event: K,
    callback: (payload: ViewerEventMap[K]) => void
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
    return () => this.off(event, callback);
  }

  off<K extends keyof ViewerEventMap>(
    event: K,
    callback: (payload: ViewerEventMap[K]) => void
  ): void {
    const list = this.listeners[event];
    if (!list || list.length === 0) return;
    this.listeners[event] = list.filter(item => item !== callback) as typeof list;
  }

  once<K extends keyof ViewerEventMap>(
    event: K,
    callback: (payload: ViewerEventMap[K]) => void
  ): () => void {
    const unsubscribe = this.on(event, payload => {
      unsubscribe();
      callback(payload);
    });
    return unsubscribe;
  }

  private emit<K extends keyof ViewerEventMap>(
    event: K,
    payload: ViewerEventMap[K]
  ): void {
    this.listeners[event]?.forEach(cb => cb(payload));
  }

  private postToViewer(type: ViewerMessageType, payload: any): void {
    if (!this.iframe?.contentWindow) return;

    this.iframe.contentWindow.postMessage(
      {
        source: "HC_SDK",
        type,
        payload,
      },
      this.resolveAllowedOrigin()
    );
  }

  zoomIn(percent: number): void {
    this.postToViewer(ViewerMessageType.ZOOM, {
      action: "in",
      percent,
    });
  }

  zoomOut(percent: number): void {
    this.postToViewer(ViewerMessageType.ZOOM, {
      action: "out",
      percent,
    });
  }

  goHome(): void {
    this.postToViewer(ViewerMessageType.HOME, {});
  }

  enablePan(): void {
    this.postToViewer(ViewerMessageType.PAN_TOGGLE, { enabled: true });
  }

  disablePan(): void {
    this.postToViewer(ViewerMessageType.PAN_TOGGLE, { enabled: false });
  }

  private handleMessage = (event: MessageEvent) => {
    if (!this.iframe) return;
    if (event.source !== this.iframe.contentWindow) return;

    const data = event.data;
    if (!data || data.source !== "HC_VIEWER") return;

    if (
      this.options.allowedOrigin &&
      event.origin !== this.options.allowedOrigin
    ) {
      return;
    }

    switch (data.type) {
      case ViewerMessageType.HOME_CLICK:
        this.emit("camera:home", data.payload);
        break;

      case ViewerMessageType.NODE_SELECT:
        this.emit("node:select", data.payload);
        break;

      case ViewerMessageType.PAN_CHANGE:
        this.emit("interaction:pan-change", data.payload);
        break;
    }
  };
}
