// src/core/emitter.ts
var Emitter = class {
  constructor() {
    this.listeners = {};
  }
  on(event, cb) {
    var _a;
    const arr = (_a = this.listeners)[event] || (_a[event] = []);
    arr.push(cb);
    return () => this.off(event, cb);
  }
  off(event, cb) {
    const arr = this.listeners[event];
    if (!arr) return;
    const idx = arr.indexOf(cb);
    if (idx >= 0) arr.splice(idx, 1);
    if (arr.length === 0) delete this.listeners[event];
  }
  emit(event, payload) {
    var _a;
    (_a = this.listeners[event]) == null ? void 0 : _a.forEach((cb) => cb(payload));
  }
  clear() {
    this.listeners = {};
  }
};

// src/modules/camera.module.ts
var CameraModule = class {
  constructor(viewer) {
    this.viewer = viewer;
    this.on = {
      home: (cb) => this.viewer._on("camera:home", cb)
    };
  }
  zoomIn(percent) {
    this.viewer.postToViewer("viewer-zoom" /* ZOOM */, { action: "in", percent });
  }
  zoomOut(percent) {
    this.viewer.postToViewer("viewer-zoom" /* ZOOM */, { action: "out", percent });
  }
  home() {
    this.viewer.postToViewer("viewer-home" /* HOME */, {});
  }
};

// src/modules/interaction.module.ts
var InteractionModule = class {
  constructor(viewer) {
    this.viewer = viewer;
    this.on = {
      panChange: (cb) => this.viewer._on("interaction:pan-change", cb)
    };
  }
  enablePan() {
    this.viewer.postToViewer("viewer-pan-toggle" /* PAN_TOGGLE */, { enabled: true });
  }
  disablePan() {
    this.viewer.postToViewer("viewer-pan-toggle" /* PAN_TOGGLE */, { enabled: false });
  }
};

// src/modules/node.module.ts
var NodeModule = class {
  constructor(viewer) {
    this.viewer = viewer;
    this.on = { select: (cb) => this.viewer._on("node:select", cb) };
  }
};

// src/modules/files.module.ts
var DEFAULT_API_BASE_URL = "https://dev.3dviewer.anybim.vn";
var DEFAULT_VIEWER_ORIGIN = "http://localhost:3000";
var FilesModule = class {
  constructor(viewer) {
    this.viewer = viewer;
    this.config = {};
    this.operationStartTime = 0;
    this.state = {
      isLoading: false,
      stage: "idle"
    };
    this.lastUploadSession = null;
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
      loadError: (cb) => this.viewer._on("files:load:error", cb)
    };
  }
  setConfig(next) {
    this.config = { ...this.config, ...next };
  }
  getState() {
    return { ...this.state };
  }
  // ---------- public pipeline ----------
  async upload(file) {
    const target = this.resolveFile(file);
    return this.withOperation({ stage: "uploading", message: "Uploading file..." }, async () => {
      var _a;
      this.viewer._emit("files:upload:start", { fileName: target.name });
      await this.uploadInternal(target);
      const baseFileId = ((_a = this.getUploadSessionForFile(target)) == null ? void 0 : _a.baseFileId) || "";
      this.viewer._emit("files:upload:success", { fileName: target.name, baseFileId });
      return { fileName: target.name, baseFileId };
    });
  }
  async convert(file) {
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
  async prepare(file) {
    const target = this.resolveFile(file);
    return this.withOperation({ stage: "uploading", message: "Preparing file..." }, async () => {
      await this.uploadInternal(target);
      const prepared = await this.convertInternal(target);
      return prepared;
    });
  }
  open(input) {
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
  async render(file) {
    const target = this.resolveFile(file);
    return this.withOperation({ stage: "uploading", message: "Uploading + converting + opening..." }, async () => {
      await this.upload(target);
      const prepared = await this.convert(target);
      this.updateState({ stage: "rendering", message: "Opening viewer..." });
      this.open(prepared);
      this.viewer._emit("files:load:success", prepared);
      return prepared;
    });
  }
  resolveFile(file) {
    const optFile = this.viewer.getOptions().file;
    const target = file || optFile;
    if (!target) throw new Error("No file provided. Pass a File or set options.file");
    this.viewer.patchOptions({ file: target });
    return target;
  }
  normalizeBaseUrl(input) {
    return input.trim().replace(/\/+$/, "");
  }
  resolveBaseUrl() {
    const raw = this.config.baseUrl || this.viewer.getOptions().baseUrl || DEFAULT_API_BASE_URL;
    return this.normalizeBaseUrl(raw);
  }
  resolveViewerPath() {
    const p = (this.config.viewerPath || this.viewer.getOptions().viewerPath || "/mainviewer").trim();
    if (!p) return "/mainviewer";
    return p.startsWith("/") ? p : `/${p}`;
  }
  resolveViewerOrigin() {
    return this.normalizeBaseUrl(DEFAULT_VIEWER_ORIGIN);
  }
  resolveHostConversion() {
    const baseUrl = this.resolveBaseUrl();
    return baseUrl.endsWith("/service/conversion") ? baseUrl : `${baseUrl}/service/conversion`;
  }
  getUploadPath() {
    return this.config.uploadPath || this.viewer.getOptions().uploadPath || ".";
  }
  fileSignature(file) {
    return `${file.name}::${file.size}::${file.lastModified}`;
  }
  createBaseFileId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
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
  async uploadInternal(file) {
    this.updateState({ stage: "uploading", message: "Uploading file..." });
    try {
      const existing = this.getUploadSessionForFile(file);
      const session = existing || this.createUploadSession(file);
      const hostConversion = this.resolveHostConversion();
      const path = this.getUploadPath();
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
  async convertInternal(file) {
    var _a, _b, _c;
    this.updateState({ stage: "converting", message: "Converting file..." });
    const uploadSession = this.getUploadSessionForFile(file) || this.createUploadSession(file);
    const seedBaseFileId = uploadSession.baseFileId;
    const cacheResult = await this.cacheFile(file, seedBaseFileId);
    const baseFileId = (_a = cacheResult.baseFileId) != null ? _a : seedBaseFileId;
    const baseMajorRev = (_b = cacheResult.baseMajorRev) != null ? _b : 0;
    const baseMinorRev = (_c = cacheResult.baseMinorRev) != null ? _c : 0;
    const fileName = cacheResult.filename || file.name;
    const cacheListItem = { baseFileId, baseMajorRev, baseMinorRev, fileName };
    if (cacheResult.cacheStatus !== 2) {
      throw new Error(`Conversion not ready after first request (cacheStatus=${cacheResult.cacheStatus ?? "unknown"})`);
    }
    const query = new URLSearchParams({ fileList: JSON.stringify([cacheListItem]) }).toString();
    const viewerBase = this.resolveViewerOrigin();
    const viewerPath = this.resolveViewerPath();
    const url = `${viewerBase}${viewerPath}?${query}`;
    return { baseFileId, baseMajorRev, baseMinorRev, fileName, query, url };
  }
  updateState(next) {
    const elapsedMs = this.operationStartTime > 0 ? Date.now() - this.operationStartTime : 0;
    this.state = { ...this.state, ...next, elapsedMs };
    this.viewer._emit("files:state", this.state);
  }
  async withOperation(initial, run) {
    this.operationStartTime = Date.now();
    this.updateState({
      isLoading: true,
      stage: initial.stage,
      message: initial.message
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
  toErrorMessage(e) {
    return e instanceof Error ? e.message : String(e);
  }
};

// src/viewer.ts
var HcViewer = class {
  constructor(options) {
    this.options = options;
    this.containerEl = null;
    this.iframeEl = null;
    this.initialized = false;
    this.emitter = new Emitter();
    this.handleMessage = (event) => {
      var _a, _b, _c;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      switch (data.type) {
        case "viewer-home-click" /* HOME_CLICK */:
          this._emit("camera:home", { timestamp: Date.now() });
          break;
        case "viewer-node-select" /* NODE_SELECT */:
          this._emit("node:select", { nodeId: String((_b = (_a = data.payload) == null ? void 0 : _a.nodeId) != null ? _b : ""), timestamp: Date.now() });
          break;
        case "viewer-pan-change" /* PAN_CHANGE */:
          this._emit("interaction:pan-change", { enabled: Boolean((_c = data.payload) == null ? void 0 : _c.enabled) });
          break;
        default:
          break;
      }
    };
    this.camera = new CameraModule(this);
    this.interaction = new InteractionModule(this);
    this.node = new NodeModule(this);
    this.files = new FilesModule(this);
  }
  // ===== options helpers =====
  getOptions() {
    return this.options;
  }
  patchOptions(next) {
    this.options = { ...this.options, ...next };
  }
  getUrl() {
    var _a;
    return (_a = this.options.url) != null ? _a : null;
  }
  // ===== lifecycle =====
  init() {
    if (this.initialized) return;
    this.containerEl = typeof this.options.container === "string" ? document.querySelector(this.options.container) : this.options.container;
    if (!this.containerEl) throw new Error("Container element not found");
    window.addEventListener("message", this.handleMessage);
    this.initialized = true;
  }
  async render(file) {
    this.ensureInit();
    if (this.iframeEl) return;
    if (!this.options.url) return this.files.render(file);
    const iframe = document.createElement("iframe");
    iframe.src = this.options.url;
    iframe.style.border = "none";
    iframe.style.width = this.options.width || "100%";
    iframe.style.height = this.options.height || "100%";
    iframe.width = this.options.width || "100%";
    iframe.height = this.options.height || "100%";
    if (this.options.sandbox) iframe.setAttribute("sandbox", this.options.sandbox);
    this.containerEl.appendChild(iframe);
    this.iframeEl = iframe;
  }
  open(url) {
    this.ensureInit();
    this.options.url = url;
    if (!this.iframeEl) {
      this.render();
      return;
    }
    this.iframeEl.src = url;
  }
  destroy() {
    window.removeEventListener("message", this.handleMessage);
    if (this.iframeEl && this.containerEl) {
      try {
        this.containerEl.removeChild(this.iframeEl);
      } catch {
      }
    }
    this.iframeEl = null;
    this.containerEl = null;
    this.initialized = false;
  }
  ensureInit() {
    if (!this.initialized) throw new Error("Call viewer.init() before using viewer");
  }
  // ===== typed internal events (modules dùng) =====
  _on(event, cb) {
    return this.emitter.on(event, cb);
  }
  _off(event, cb) {
    this.emitter.off(event, cb);
  }
  _emit(event, payload) {
    this.emitter.emit(event, payload);
  }
  // ===== postMessage bridge =====
  postToViewer(type, payload) {
    var _a;
    if (!((_a = this.iframeEl) == null ? void 0 : _a.contentWindow)) return;
    const message = { source: "HC_SDK", type, payload };
    const targetOrigin = this.options.allowedOrigin || "*";
    this.iframeEl.contentWindow.postMessage(message, targetOrigin);
  }
};
export {
  HcViewer
};
