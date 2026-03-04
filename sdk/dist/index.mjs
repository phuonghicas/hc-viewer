// src/viewer.ts
var ViewerMessageType = /* @__PURE__ */ ((ViewerMessageType2) => {
  ViewerMessageType2["ZOOM"] = "viewer-zoom";
  ViewerMessageType2["HOME"] = "viewer-home";
  ViewerMessageType2["PAN_TOGGLE"] = "viewer-pan-toggle";
  ViewerMessageType2["HOME_CLICK"] = "viewer-home-click";
  ViewerMessageType2["NODE_SELECT"] = "viewer-node-select";
  ViewerMessageType2["PAN_CHANGE"] = "viewer-pan-change";
  return ViewerMessageType2;
})(ViewerMessageType || {});
var HcViewer = class {
  constructor(options) {
    this.iframe = null;
    this.hostConversion = null;
    this.preparedData = null;
    this.lastUploadSession = null;
    this.operationStartTime = 0;
    this.loadingState = {
      isLoading: false,
      stage: "idle"
    };
    this.listeners = {};
    this.handleMessage = (event) => {
      if (!this.iframe) return;
      if (event.source !== this.iframe.contentWindow) return;
      const data = event.data;
      if (!data || data.source !== "HC_VIEWER") return;
      if (this.options.allowedOrigin && event.origin !== this.options.allowedOrigin) {
        return;
      }
      switch (data.type) {
        case "viewer-home-click" /* HOME_CLICK */:
          this.emit("camera:home", data.payload);
          break;
        case "viewer-node-select" /* NODE_SELECT */:
          this.emit("node:select", data.payload);
          break;
        case "viewer-pan-change" /* PAN_CHANGE */:
          this.emit("interaction:pan-change", data.payload);
          break;
      }
    };
    this.container = typeof options.container === "string" ? document.querySelector(options.container) : options.container;
    if (!this.container) {
      throw new Error("Container element not found");
    }
    this.options = options;
    window.addEventListener("message", this.handleMessage);
  }
  toErrorMessage(error) {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Unknown error";
  }
  shouldNotify(kind) {
    const notify = this.options.notify;
    if (typeof notify === "boolean") return notify;
    if (!notify) return kind === "error";
    if (kind === "success") return !!notify.success;
    return notify.error !== false;
  }
  notifyUser(kind, message) {
    if (!this.shouldNotify(kind)) return;
    if (typeof window === "undefined" || typeof window.alert !== "function") {
      return;
    }
    window.alert(message);
  }
  updateLoadState(next) {
    const elapsedMs = this.operationStartTime > 0 ? Date.now() - this.operationStartTime : 0;
    this.loadingState = {
      ...this.loadingState,
      ...next,
      elapsedMs
    };
    this.emit("load:state", this.loadingState);
  }
  getLoadingState() {
    return { ...this.loadingState };
  }
  isLoading() {
    return this.loadingState.isLoading;
  }
  async withOperation(initial, run) {
    this.operationStartTime = Date.now();
    this.updateLoadState({
      isLoading: true,
      stage: initial.stage,
      message: initial.message,
      attempt: void 0,
      maxAttempts: void 0
    });
    try {
      const result = await run();
      this.updateLoadState({
        isLoading: false,
        stage: "completed",
        message: "Completed"
      });
      return result;
    } catch (error) {
      const message = this.toErrorMessage(error);
      this.updateLoadState({
        isLoading: false,
        stage: "error",
        message
      });
      this.emit("load:error", { error: message });
      throw error;
    }
  }
  normalizeBaseUrl(input) {
    return input.trim().replace(/\/+$/, "");
  }
  resolveBaseUrl() {
    const raw = this.options.baseUrl || "https://dev.3dviewer.anybim.vn";
    if (!raw) return "https://dev.3dviewer.anybim.vn";
    return this.normalizeBaseUrl(raw);
  }
  resolveViewerBaseUrl() {
    return "http://localhost:3000";
  }
  resolveViewerPath() {
    const path = (this.options.viewerPath || "/mainviewer").trim();
    if (!path) return "/mainviewer";
    return path.startsWith("/") ? path : `/${path}`;
  }
  resolveAllowedOrigin() {
    if (this.options.allowedOrigin) return this.options.allowedOrigin;
    try {
      return new URL(this.resolveViewerBaseUrl()).origin;
    } catch (error) {
      return "*";
    }
  }
  createBaseFileId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  getUploadPath() {
    return this.options.uploadPath || ".";
  }
  fileSignature(file) {
    return `${file.name}::${file.size}::${file.lastModified}`;
  }
  createUploadSession(file) {
    return {
      signature: this.fileSignature(file),
      baseFileId: this.createBaseFileId(),
      fileName: file.name,
      uploadPath: this.getUploadPath()
    };
  }
  getUploadSessionForFile(file) {
    if (!this.lastUploadSession) return null;
    const sameFile = this.lastUploadSession.signature === this.fileSignature(file);
    const samePath = this.lastUploadSession.uploadPath === this.getUploadPath();
    return sameFile && samePath ? this.lastUploadSession : null;
  }
  async resolveHostConversion() {
    if (this.hostConversion) return this.hostConversion;
    const baseUrl = this.resolveBaseUrl();
    if (baseUrl.endsWith("/service/conversion")) {
      this.hostConversion = baseUrl;
      return this.hostConversion;
    }
    this.hostConversion = `${baseUrl}/service/conversion`;
    return this.hostConversion;
  }
  async uploadFile(file) {
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
        Accept: "text/plain"
      }
    });
    if (!response.ok) {
      throw new Error(
        `Upload failed (${response.status} ${response.statusText})`
      );
    }
  }
  buildCachePayload(file, baseFileId) {
    const createdDate = (/* @__PURE__ */ new Date()).toISOString();
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
        name: "Anonymous"
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
        childModels: 0
      },
      drawingConvertStatus: {
        convert3DModel: 5,
        convert2DSheet: 5,
        extractProperties: 5
      },
      attemptedConvertTimes: 0
    };
  }
  async cacheFile(file, baseFileId) {
    const hostConversion = await this.resolveHostConversion();
    const url = `${hostConversion}/api/StreamFile?overwrite=true&ignore_line_weight=1`;
    const payload = this.buildCachePayload(file, baseFileId);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(
        `Cache/convert failed (${response.status} ${response.statusText})`
      );
    }
    return await response.json();
  }
  async getCacheByList(item) {
    const hostConversion = await this.resolveHostConversion();
    const url = `${hostConversion}/api/StreamFile/item`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify([item])
    });
    if (!response.ok) return null;
    const result = await response.json();
    if (!Array.isArray(result) || result.length === 0) return null;
    return result[0];
  }
  async waitForCacheReady(item) {
    var _a, _b, _c, _d;
    const maxAttempts = (_b = (_a = this.options.polling) == null ? void 0 : _a.maxAttempts) != null ? _b : 90;
    const delayMs = (_d = (_c = this.options.polling) == null ? void 0 : _c.intervalMs) != null ? _d : 2e3;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const status = await this.getCacheByList(item);
      this.emit("conversion:progress", {
        attempt: attempt + 1,
        maxAttempts,
        cacheStatus: status == null ? void 0 : status.cacheStatus
      });
      this.updateLoadState({
        stage: "converting",
        message: "Waiting conversion result...",
        attempt: attempt + 1,
        maxAttempts
      });
      if ((status == null ? void 0 : status.cacheStatus) === 2) return;
      if ((status == null ? void 0 : status.cacheStatus) === 3) {
        throw new Error("Conversion failed with cacheStatus=3");
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    throw new Error("Timeout waiting for conversion result");
  }
  buildViewerUrl(query) {
    const baseUrl = this.resolveViewerBaseUrl();
    const viewerPath = this.resolveViewerPath();
    const queryNormalized = (query || "").replace(/^\?+/, "");
    const viewerBase = `${baseUrl}${viewerPath}`;
    if (!queryNormalized) return viewerBase;
    return `${viewerBase}?${queryNormalized}`;
  }
  resolveFile(file) {
    if (file) {
      this.options.file = file;
      return file;
    }
    if (this.options.file) return this.options.file;
    throw new Error(
      "No file provided. Pass file via options.file or upload/prepare/render(file)."
    );
  }
  async uploadInternal(file) {
    const uploadSession = this.createUploadSession(file);
    this.updateLoadState({
      stage: "uploading",
      message: "Uploading file..."
    });
    this.emit("upload:start", { fileName: file.name });
    try {
      await this.uploadFile(file);
      this.lastUploadSession = uploadSession;
      this.emit("upload:success", {
        fileName: file.name,
        baseFileId: uploadSession.baseFileId
      });
      this.notifyUser("success", `Upload success: ${file.name}`);
    } catch (error) {
      const message = this.toErrorMessage(error);
      this.emit("upload:error", {
        fileName: file.name,
        error: message
      });
      this.notifyUser("error", `Upload failed: ${message}`);
      throw error;
    }
  }
  async convertInternal(file) {
    var _a, _b;
    this.updateLoadState({
      stage: "converting",
      message: "Converting file...",
      attempt: void 0,
      maxAttempts: void 0
    });
    this.emit("conversion:start", { fileName: file.name });
    try {
      const uploadSession = this.getUploadSessionForFile(file);
      const baseFileIdSeed = uploadSession ? uploadSession.baseFileId : this.createBaseFileId();
      const cacheResult = await this.cacheFile(file, baseFileIdSeed);
      const baseFileId = cacheResult.baseFileId || baseFileIdSeed;
      const baseMajorRev = (_a = cacheResult.baseMajorRev) != null ? _a : 0;
      const baseMinorRev = (_b = cacheResult.baseMinorRev) != null ? _b : 0;
      const fileName = cacheResult.filename || file.name;
      const cacheListItem = {
        baseFileId,
        baseMajorRev,
        baseMinorRev,
        fileName
      };
      if (cacheResult.cacheStatus !== 2) {
        await this.waitForCacheReady(cacheListItem);
      }
      const query = new URLSearchParams({
        fileList: JSON.stringify([cacheListItem])
      }).toString();
      const prepared = {
        baseFileId,
        baseMajorRev,
        baseMinorRev,
        fileName,
        query,
        url: this.buildViewerUrl(query)
      };
      this.emit("conversion:success", prepared);
      this.notifyUser("success", `Conversion success: ${fileName}`);
      return prepared;
    } catch (error) {
      const message = this.toErrorMessage(error);
      this.emit("conversion:error", {
        fileName: file.name,
        error: message
      });
      this.notifyUser("error", `Conversion failed: ${message}`);
      throw error;
    }
  }
  async upload(file) {
    const target = this.resolveFile(file);
    return this.withOperation(
      { stage: "uploading", message: "Uploading file..." },
      async () => {
        var _a;
        await this.uploadInternal(target);
        const baseFileId = ((_a = this.getUploadSessionForFile(target)) == null ? void 0 : _a.baseFileId) || "";
        return { fileName: target.name, baseFileId };
      }
    );
  }
  async convert(file) {
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
  async prepare(file) {
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
  async renderPreparedInternal(prepared) {
    this.updateLoadState({
      stage: "rendering",
      message: "Rendering iframe...",
      attempt: void 0,
      maxAttempts: void 0
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
  async renderPrepared(prepared) {
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
  async render(file) {
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
  destroy() {
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
      message: void 0,
      attempt: void 0,
      maxAttempts: void 0,
      elapsedMs: 0
    };
  }
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }
  off(event, callback) {
    const list = this.listeners[event];
    if (!list || list.length === 0) return;
    this.listeners[event] = list.filter((item) => item !== callback);
  }
  once(event, callback) {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      callback(payload);
    });
    return unsubscribe;
  }
  emit(event, payload) {
    var _a;
    (_a = this.listeners[event]) == null ? void 0 : _a.forEach((cb) => cb(payload));
  }
  postToViewer(type, payload) {
    var _a;
    if (!((_a = this.iframe) == null ? void 0 : _a.contentWindow)) return;
    this.iframe.contentWindow.postMessage(
      {
        source: "HC_SDK",
        type,
        payload
      },
      this.resolveAllowedOrigin()
    );
  }
  zoomIn(percent) {
    this.postToViewer("viewer-zoom" /* ZOOM */, {
      action: "in",
      percent
    });
  }
  zoomOut(percent) {
    this.postToViewer("viewer-zoom" /* ZOOM */, {
      action: "out",
      percent
    });
  }
  goHome() {
    this.postToViewer("viewer-home" /* HOME */, {});
  }
  enablePan() {
    this.postToViewer("viewer-pan-toggle" /* PAN_TOGGLE */, { enabled: true });
  }
  disablePan() {
    this.postToViewer("viewer-pan-toggle" /* PAN_TOGGLE */, { enabled: false });
  }
};
export {
  HcViewer,
  ViewerMessageType
};
