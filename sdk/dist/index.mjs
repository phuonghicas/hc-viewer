// src/core/emitter.ts
var Emitter = class {
  constructor() {
    this.listeners = {};
  }
  on(event, cb) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    const arr = this.listeners[event];
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
  select() {
    this.viewer.postToViewer("viewer-select" /* SELECT */);
  }
  areaSelect() {
    this.viewer.postToViewer("viewer-area-select" /* AREA_SELECT */);
  }
  orbit() {
    this.viewer.postToViewer("viewer-orbit" /* ORBIT */);
  }
  rotateZ() {
    this.viewer.postToViewer("viewer-rotate-z" /* ROTATE_Z */);
  }
  walkThrough() {
    this.viewer.postToViewer("viewer-walk-through" /* WALK_THROUGH */);
  }
  zoomWindow() {
    this.viewer.postToViewer("viewer-zoom-window" /* ZOOM_WINDOW */);
  }
  zoomFit() {
    this.viewer.postToViewer("viewer-zoom-fit" /* ZOOM_FIT */);
  }
  drawModeShaded() {
    this.setDrawMode("shaded");
  }
  drawModeWireframe() {
    this.setDrawMode("wireframe");
  }
  drawModeHiddenLine() {
    this.setDrawMode("hidden-line");
  }
  drawModeShadedWire() {
    this.setDrawMode("shaded-wire");
  }
  drawModeXRay() {
    this.setDrawMode("xray");
  }
  drawModeGhosting() {
    this.setDrawMode("ghosting");
  }
  explode(magnitude) {
    this.viewer.postToViewer("viewer-explode" /* EXPLODE */, { magnitude });
  }
  explodeOff() {
    this.explode(0);
  }
  setDrawMode(mode) {
    this.viewer.postToViewer("viewer-draw-mode" /* DRAW_MODE */, { mode });
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
  // Merge file-pipeline runtime config.
  setConfig(next) {
    this.config = { ...this.config, ...next };
  }
  // Return a snapshot of current loading state.
  getState() {
    return { ...this.state };
  }
  // ---------- public pipeline ----------
  // Upload file to conversion server and keep generated baseFileId in session.
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
  // Trigger conversion flow and resolve final viewer metadata.
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
  // Convenience API: upload first, then convert in one call.
  async prepare(file) {
    const target = this.resolveFile(file);
    return this.withOperation({ stage: "uploading", message: "Preparing file..." }, async () => {
      await this.uploadInternal(target);
      const prepared = await this.convertInternal(target);
      return prepared;
    });
  }
  // Open iframe with an already prepared viewer URL.
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
  // Full pipeline: upload + convert + open iframe.
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
  // Resolve file argument, fallback to options.file, and persist it back.
  resolveFile(file) {
    const optFile = this.viewer.getOptions().file;
    const target = file || optFile;
    if (!target) throw new Error("No file provided. Pass a File or set options.file");
    this.viewer.patchOptions({ file: target });
    return target;
  }
  // Trim input URL and remove trailing slash.
  normalizeBaseUrl(input) {
    return input.trim().replace(/\/+$/, "");
  }
  // Resolve API base URL with default fallback.
  resolveBaseUrl() {
    const raw = this.config.baseUrl || this.viewer.getOptions().baseUrl || DEFAULT_API_BASE_URL;
    return this.normalizeBaseUrl(raw);
  }
  // Resolve viewer route path (e.g. /mainviewer).
  resolveViewerPath() {
    const p = (this.config.viewerPath || this.viewer.getOptions().viewerPath || "/mainviewer").trim();
    if (!p) return "/mainviewer";
    return p.startsWith("/") ? p : `/${p}`;
  }
  // Viewer host used to open iframe after conversion completes.
  resolveViewerOrigin() {
    return this.normalizeBaseUrl(DEFAULT_VIEWER_ORIGIN);
  }
  // Build conversion service root from API base URL.
  resolveHostConversion() {
    const baseUrl = this.resolveBaseUrl();
    return baseUrl.endsWith("/service/conversion") ? baseUrl : `${baseUrl}/service/conversion`;
  }
  // Resolve upload path sent to conversion APIs.
  getUploadPath() {
    return this.config.uploadPath || this.viewer.getOptions().uploadPath || ".";
  }
  // Build a stable in-memory signature to identify same file uploads.
  fileSignature(file) {
    return `${file.name}::${file.size}::${file.lastModified}`;
  }
  // Create a UUID-like baseFileId when caller does not provide one.
  createBaseFileId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  // Create upload session metadata reused between upload and convert.
  createUploadSession(file) {
    return {
      signature: this.fileSignature(file),
      baseFileId: this.createBaseFileId(),
      fileName: file.name,
      uploadPath: this.getUploadPath()
    };
  }
  // Return previous upload session for same file and upload path.
  getUploadSessionForFile(file) {
    if (!this.lastUploadSession) return null;
    const sameFile = this.lastUploadSession.signature === this.fileSignature(file);
    const samePath = this.lastUploadSession.uploadPath === this.getUploadPath();
    return sameFile && samePath ? this.lastUploadSession : null;
  }
  // Call upload endpoint and persist upload session on success.
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
  // Build StreamFile payload compatible with conversion service.
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
  // Submit conversion/caching request and return service response.
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
  // Convert file and generate final iframe URL with query string.
  async convertInternal(file) {
    var _a, _b, _c, _d;
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
      throw new Error(`Conversion not ready after first request (cacheStatus=${(_d = cacheResult.cacheStatus) != null ? _d : "unknown"})`);
    }
    const query = new URLSearchParams({ fileList: JSON.stringify([cacheListItem]) }).toString();
    const viewerBase = this.resolveViewerOrigin();
    const viewerPath = this.resolveViewerPath();
    const url = `${viewerBase}${viewerPath}?${query}`;
    return { baseFileId, baseMajorRev, baseMinorRev, fileName, query, url };
  }
  // Update internal loading state and emit state event.
  updateState(next) {
    const elapsedMs = this.operationStartTime > 0 ? Date.now() - this.operationStartTime : 0;
    this.state = { ...this.state, ...next, elapsedMs };
    this.viewer._emit("files:state", this.state);
  }
  // Shared wrapper to handle loading state lifecycle and top-level errors.
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
  // Normalize unknown error shape into displayable message.
  toErrorMessage(e) {
    return e instanceof Error ? e.message : String(e);
  }
};

// src/modules/toolbar.module.ts
function createRequestId() {
  return `sheets_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
var ALL_3D_TOOLBAR_OPERATORS = [
  "home",
  "select",
  "areaSelect",
  "pan",
  "zoomIn",
  "zoomOut",
  "zoomWindow",
  "zoomFit",
  "orbit",
  "rotateZ",
  "walkThrough",
  "drawMode-shaded",
  "drawMode-wireframe",
  "drawMode-shaded-wire",
  "drawMode-hidden-line",
  "drawMode-xray",
  "drawMode-ghosting",
  "cutting-plane",
  "clipping-commands",
  "explode",
  "setting",
  "propertyPanel",
  "model-tree",
  "linkedObjects",
  "statesObjects",
  "synchronized"
];
var ALL_PDF_TOOLBAR_OPERATORS = [
  "home",
  "select",
  "pan",
  "zoomIn",
  "zoomOut",
  "zoomWindow",
  "zoomFit",
  "rotateZ",
  "save",
  "setting",
  "plan-mode",
  "document-mode",
  "first-page",
  "previous-page",
  "next-page",
  "last-page",
  "current-page"
];
var ToolbarModule = class {
  constructor(viewer) {
    this.viewer = viewer;
    this.on = {
      planMode: (cb) => this.viewer._on("toolbar:pdf-plan-mode", cb),
      documentMode: (cb) => this.viewer._on("toolbar:pdf-document-mode", cb),
      firstPage: (cb) => this.viewer._on("toolbar:pdf-first-page", cb),
      previousPage: (cb) => this.viewer._on("toolbar:pdf-previous-page", cb),
      nextPage: (cb) => this.viewer._on("toolbar:pdf-next-page", cb),
      lastPage: (cb) => this.viewer._on("toolbar:pdf-last-page", cb),
      currentPage: (cb) => this.viewer._on("toolbar:pdf-current-page", cb)
    };
  }
  setDisabled3D(operators) {
    this.postConfig({ format: "3d", mode: "set", operators });
  }
  setDisabledPdf(operators) {
    this.postConfig({ format: "pdf", mode: "set", operators });
  }
  clearDisabled3D() {
    this.postConfig({ format: "3d", mode: "clear" });
  }
  clearDisabledPdf() {
    this.postConfig({ format: "pdf", mode: "clear" });
  }
  disableAll3D() {
    this.setDisabled3D(ALL_3D_TOOLBAR_OPERATORS);
  }
  disableAllPdf() {
    this.setDisabledPdf(ALL_PDF_TOOLBAR_OPERATORS);
  }
  enableAll3D() {
    this.clearDisabled3D();
  }
  enableAllPdf() {
    this.clearDisabledPdf();
  }
  openClippingPlanes() {
    this.postPanelOpen({ panel: "clipping-commands", format: "3d" });
  }
  closeClippingPlanes() {
    this.postPanelClose({ panel: "clipping-commands", format: "3d" });
  }
  openSetting() {
    this.postPanelOpen({ panel: "setting" });
  }
  closeSetting() {
    this.postPanelClose({ panel: "setting" });
  }
  openSetting3D() {
    this.postPanelOpen({ panel: "setting", format: "3d" });
  }
  closeSetting3D() {
    this.postPanelClose({ panel: "setting", format: "3d" });
  }
  openSettingPdf() {
    this.postPanelOpen({ panel: "setting", format: "pdf" });
  }
  closeSettingPdf() {
    this.postPanelClose({ panel: "setting", format: "pdf" });
  }
  openStatesObjects() {
    this.postPanelOpen({ panel: "statesObjects", format: "3d" });
  }
  closeStatesObjects() {
    this.postPanelClose({ panel: "statesObjects", format: "3d" });
  }
  openLinkedObjects() {
    this.postPanelOpen({ panel: "linkedObjects", format: "3d" });
  }
  closeLinkedObjects() {
    this.postPanelClose({ panel: "linkedObjects", format: "3d" });
  }
  openModelTree() {
    this.postPanelOpen({ panel: "model-tree", format: "3d" });
  }
  closeModelTree() {
    this.postPanelClose({ panel: "model-tree", format: "3d" });
  }
  openObjectProperties() {
    this.postPanelOpen({ panel: "object-properties", format: "3d" });
  }
  closeObjectProperties() {
    this.postPanelClose({ panel: "object-properties", format: "3d" });
  }
  openSheets() {
    this.postPanelOpen({ panel: "sheets", format: "3d" });
  }
  closeSheets() {
    this.postPanelClose({ panel: "sheets", format: "3d" });
  }
  getSheets(options) {
    var _a;
    const requestId = createRequestId();
    const timeoutMs = Math.max(1e3, (_a = options == null ? void 0 : options.timeoutMs) != null ? _a : 1e4);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error("Timeout while getting sheets list from viewer"));
      }, timeoutMs);
      const off = this.viewer._on("sheets:list", (payload) => {
        if (payload.requestId !== requestId) return;
        clearTimeout(timer);
        off();
        resolve(payload.sheets);
      });
      this.postSheetsGetList({ requestId });
    });
  }
  applySheet(sheetId) {
    this.postSheetsApply({ sheetId });
  }
  cuttingCloseSections() {
    this.postCuttingAction({ action: "close" });
  }
  cuttingMultipleSides() {
    this.postCuttingAction({ action: "multi" });
  }
  cuttingToggleSelection() {
    this.postCuttingAction({ action: "toggle-section" });
  }
  cuttingTogglePlanes() {
    this.postCuttingAction({ action: "toggle-plane" });
  }
  cuttingPlaneX() {
    this.postCuttingAction({ action: "plane-x" });
  }
  cuttingPlaneY() {
    this.postCuttingAction({ action: "plane-y" });
  }
  cuttingPlaneZ() {
    this.postCuttingAction({ action: "plane-z" });
  }
  cuttingPlaneBox() {
    this.postCuttingAction({ action: "plane-box" });
  }
  cuttingRotateBox() {
    this.postCuttingAction({ action: "rotate-box" });
  }
  cuttingReversePlaneX() {
    this.postCuttingAction({ action: "reverse-plane-x" });
  }
  cuttingReversePlaneY() {
    this.postCuttingAction({ action: "reverse-plane-y" });
  }
  cuttingReversePlaneZ() {
    this.postCuttingAction({ action: "reverse-plane-z" });
  }
  postConfig(payload) {
    this.viewer.postToViewer("viewer-toolbar-config" /* TOOLBAR_CONFIG */, payload);
  }
  postPanelOpen(payload) {
    this.viewer.postToViewer("viewer-panel-open" /* PANEL_OPEN */, payload);
  }
  postPanelClose(payload) {
    this.viewer.postToViewer("viewer-panel-close" /* PANEL_CLOSE */, payload);
  }
  postCuttingAction(payload) {
    this.viewer.postToViewer("viewer-cutting-plane-action" /* CUTTING_PLANE_ACTION */, payload);
  }
  postSheetsGetList(payload) {
    this.viewer.postToViewer("viewer-sheets-get-list" /* SHEETS_GET_LIST */, payload);
  }
  postSheetsApply(payload) {
    this.viewer.postToViewer("viewer-sheets-apply" /* SHEETS_APPLY */, payload);
  }
};

// src/modules/model-tree.module.ts
function createRequestId2() {
  return `tree_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
var ModelTreeModule = class {
  constructor(viewer) {
    this.viewer = viewer;
  }
  open() {
    this.viewer.postToViewer("viewer-panel-open" /* PANEL_OPEN */, {
      panel: "model-tree",
      format: "3d"
    });
  }
  selectNode(nodeId) {
    this.viewer.postToViewer("viewer-tree-select-node" /* TREE_SELECT_NODE */, {
      nodeId: String(nodeId)
    });
  }
  getNodeIds(options) {
    var _a;
    const requestId = createRequestId2();
    const timeoutMs = Math.max(1e3, (_a = options == null ? void 0 : options.timeoutMs) != null ? _a : 1e4);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error("Timeout while getting node ids from viewer"));
      }, timeoutMs);
      const off = this.viewer._on("modelTree:node-ids", (payload) => {
        if (payload.requestId !== requestId) return;
        clearTimeout(timer);
        off();
        resolve(payload.nodeIds);
      });
      this.viewer.postToViewer("viewer-tree-get-node-ids" /* TREE_GET_NODE_IDS */, {
        requestId,
        onlyRealNodes: (options == null ? void 0 : options.onlyRealNodes) !== false
      });
    });
  }
};

// src/modules/markup.module.ts
function createRequestId3(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
var MarkupModule = class {
  constructor(viewer) {
    this.viewer = viewer;
  }
  action(action) {
    this.viewer.postToViewer("viewer-markup-action" /* MARKUP_ACTION */, { action });
  }
  drawLine() {
    this.action("line");
  }
  drawArrow() {
    this.action("arrow");
  }
  drawCircle() {
    this.action("circle");
  }
  drawEllipse() {
    this.action("ellipse");
  }
  drawRectangle() {
    this.action("rectangle");
  }
  drawPolygon() {
    this.action("polygon");
  }
  drawPolyline() {
    this.action("polyline");
  }
  drawTextBox() {
    this.action("textbox");
  }
  drawNote() {
    this.action("note");
  }
  drawCallout() {
    this.action("callout");
  }
  drawCloud() {
    this.action("cloud");
  }
  drawFreehand() {
    this.action("freehand");
  }
  save(options) {
    return this.runRequest("markup-save", "viewer-markup-save" /* MARKUP_SAVE */, "markup:save", options);
  }
  cancel(options) {
    return this.runRequest("markup-cancel", "viewer-markup-cancel" /* MARKUP_CANCEL */, "markup:cancel", options);
  }
  getList(options) {
    var _a;
    const requestId = createRequestId3("markup-list");
    const timeoutMs = Math.max(1e3, (_a = options == null ? void 0 : options.timeoutMs) != null ? _a : 1e4);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error("Timeout while getting markup list from viewer"));
      }, timeoutMs);
      const off = this.viewer._on("markup:list", (payload) => {
        if (payload.requestId !== requestId) return;
        clearTimeout(timer);
        off();
        resolve(payload.markups);
      });
      this.viewer.postToViewer("viewer-markup-get-list" /* MARKUP_GET_LIST */, { requestId });
    });
  }
  runRequest(prefix, messageType, eventName, options) {
    var _a;
    const requestId = createRequestId3(prefix);
    const timeoutMs = Math.max(1e3, (_a = options == null ? void 0 : options.timeoutMs) != null ? _a : 1e4);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error(`Timeout while waiting for ${prefix} result from viewer`));
      }, timeoutMs);
      const off = this.viewer._on(eventName, (payload) => {
        if (payload.requestId !== requestId) return;
        clearTimeout(timer);
        off();
        if (payload.success) {
          resolve();
          return;
        }
        reject(new Error(payload.error || `Viewer ${prefix} failed`));
      });
      this.viewer.postToViewer(messageType, { requestId });
    });
  }
};

// src/viewer.ts
var Viewer3D = class {
  constructor(options) {
    this.options = options;
    this.containerEl = null;
    this.iframeEl = null;
    this.initialized = false;
    this.emitter = new Emitter();
    this.handleMessage = (event) => {
      var _a, _b, _c, _d;
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
        case "viewer-pdf-plan-mode" /* PDF_PLAN_MODE */: {
          const payload = data.payload;
          this._emit("toolbar:pdf-plan-mode", {
            mode: "plan",
            timestamp: Number(payload == null ? void 0 : payload.timestamp) || Date.now()
          });
          break;
        }
        case "viewer-pdf-document-mode" /* PDF_DOCUMENT_MODE */: {
          const payload = data.payload;
          this._emit("toolbar:pdf-document-mode", {
            mode: "document",
            timestamp: Number(payload == null ? void 0 : payload.timestamp) || Date.now()
          });
          break;
        }
        case "viewer-pdf-first-page" /* PDF_FIRST_PAGE */: {
          const payload = data.payload;
          this._emit("toolbar:pdf-first-page", {
            timestamp: Number(payload == null ? void 0 : payload.timestamp) || Date.now()
          });
          break;
        }
        case "viewer-pdf-previous-page" /* PDF_PREVIOUS_PAGE */: {
          const payload = data.payload;
          this._emit("toolbar:pdf-previous-page", {
            timestamp: Number(payload == null ? void 0 : payload.timestamp) || Date.now()
          });
          break;
        }
        case "viewer-pdf-next-page" /* PDF_NEXT_PAGE */: {
          const payload = data.payload;
          this._emit("toolbar:pdf-next-page", {
            timestamp: Number(payload == null ? void 0 : payload.timestamp) || Date.now()
          });
          break;
        }
        case "viewer-pdf-last-page" /* PDF_LAST_PAGE */: {
          const payload = data.payload;
          this._emit("toolbar:pdf-last-page", {
            timestamp: Number(payload == null ? void 0 : payload.timestamp) || Date.now()
          });
          break;
        }
        case "viewer-pdf-current-page" /* PDF_CURRENT_PAGE */: {
          const payload = data.payload;
          if (!payload) break;
          this._emit("toolbar:pdf-current-page", {
            pageIndex: Number(payload.pageIndex) || 0,
            pageNumber: Number(payload.pageNumber) || 1,
            timestamp: Number(payload.timestamp) || Date.now()
          });
          break;
        }
        case "viewer-tree-node-ids" /* TREE_NODE_IDS */: {
          const payload = data.payload;
          if (!payload || !payload.requestId || !Array.isArray(payload.nodeIds)) break;
          this._emit("modelTree:node-ids", {
            requestId: String(payload.requestId),
            nodeIds: payload.nodeIds.map(String),
            timestamp: Number(payload.timestamp) || Date.now()
          });
          break;
        }
        case "viewer-sheets-list" /* SHEETS_LIST */: {
          const payload = data.payload;
          if (!payload || !payload.requestId || !Array.isArray(payload.sheets)) break;
          this._emit("sheets:list", {
            requestId: String(payload.requestId),
            sheets: payload.sheets.map((sheet) => {
              var _a2;
              return {
                id: sheet.id,
                name: String((_a2 = sheet.name) != null ? _a2 : ""),
                is3D: Boolean(sheet.is3D),
                viewId: sheet.viewId ? String(sheet.viewId) : void 0
              };
            }),
            activeSheetId: (_d = payload.activeSheetId) != null ? _d : null,
            timestamp: Number(payload.timestamp) || Date.now()
          });
          break;
        }
        case "viewer-markup-list" /* MARKUP_LIST */: {
          const payload = data.payload;
          if (!payload || !payload.requestId || !Array.isArray(payload.markups)) break;
          this._emit("markup:list", {
            requestId: String(payload.requestId),
            markups: payload.markups.map((markup) => {
              var _a2, _b2;
              return {
                id: String(markup.id),
                viewId: String(markup.viewId),
                viewName: markup.viewName ? String(markup.viewName) : void 0,
                title: String((_a2 = markup.title) != null ? _a2 : ""),
                type: String((_b2 = markup.type) != null ? _b2 : ""),
                shapeName: markup.shapeName ? String(markup.shapeName) : void 0,
                createdDate: markup.createdDate ? String(markup.createdDate) : void 0,
                modifiedDate: markup.modifiedDate ? String(markup.modifiedDate) : void 0,
                createdBy: markup.createdBy ? String(markup.createdBy) : void 0,
                lastModifiedBy: markup.lastModifiedBy ? String(markup.lastModifiedBy) : void 0
              };
            }),
            timestamp: Number(payload.timestamp) || Date.now()
          });
          break;
        }
        case "viewer-markup-save-result" /* MARKUP_SAVE_RESULT */: {
          const payload = data.payload;
          if (!payload || !payload.requestId) break;
          this._emit("markup:save", {
            requestId: String(payload.requestId),
            success: Boolean(payload.success),
            error: payload.error ? String(payload.error) : void 0,
            timestamp: Number(payload.timestamp) || Date.now()
          });
          break;
        }
        case "viewer-markup-cancel-result" /* MARKUP_CANCEL_RESULT */: {
          const payload = data.payload;
          if (!payload || !payload.requestId) break;
          this._emit("markup:cancel", {
            requestId: String(payload.requestId),
            success: Boolean(payload.success),
            error: payload.error ? String(payload.error) : void 0,
            timestamp: Number(payload.timestamp) || Date.now()
          });
          break;
        }
        default:
          break;
      }
    };
    this.camera = new CameraModule(this);
    this.interaction = new InteractionModule(this);
    this.node = new NodeModule(this);
    this.files = new FilesModule(this);
    this.toolbar = new ToolbarModule(this);
    this.modelTree = new ModelTreeModule(this);
    this.markup = new MarkupModule(this);
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
  // ===== typed internal events used by modules =====
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
    const message = {
      source: "HC_SDK" /* SDK */,
      type,
      payload
    };
    const targetOrigin = this.options.allowedOrigin || "*";
    this.iframeEl.contentWindow.postMessage(message, targetOrigin);
  }
};
export {
  Viewer3D
};
