"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  HcViewer: () => HcViewer3,
  ViewerMessageType: () => ViewerMessageType
});
module.exports = __toCommonJS(index_exports);

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
var HcViewer3 = class {
  constructor(options) {
    this.options = options;
    this.container = null;
    this.iframe = null;
    this.initialized = false;
    this.events = new Emitter();
    // =========================
    // MESSAGE HANDLER
    // =========================
    this.handleMessage = (event) => {
      var _a;
      const iframeWindow = (_a = this.iframe) == null ? void 0 : _a.contentWindow;
      if (!iframeWindow) return;
      if (event.source !== iframeWindow) return;
      const data = event.data;
      if (!data || data.source !== "HC_VIEWER") return;
      if (this.options.allowedOrigin && event.origin !== this.options.allowedOrigin) return;
      switch (data.type) {
        case "viewer-home-click" /* HOME_CLICK */:
          this._emit("camera:home", data.payload);
          break;
        case "viewer-node-select" /* NODE_SELECT */:
          this._emit("node:select", data.payload);
          break;
        case "viewer-pan-change" /* PAN_CHANGE */:
          this._emit("interaction:pan-change", data.payload);
          break;
        default:
          break;
      }
    };
    this.camera = new CameraModule(this);
    this.interaction = new InteractionModule(this);
    this.node = new NodeModule(this);
  }
  init() {
    if (this.initialized) return;
    this.container = typeof this.options.container === "string" ? document.querySelector(this.options.container) : this.options.container;
    if (!this.container) throw new Error("Container element not found");
    window.addEventListener("message", this.handleMessage);
    this.initialized = true;
  }
  ensureInit() {
    if (!this.initialized) throw new Error("Call viewer.init() before using viewer");
  }
  render() {
    this.ensureInit();
    if (this.iframe) return;
    const iframe = document.createElement("iframe");
    iframe.src = this.options.url;
    iframe.width = this.options.width || "100%";
    iframe.height = this.options.height || "100%";
    iframe.style.width = this.options.width || "100%";
    iframe.style.height = this.options.height || "100%";
    iframe.style.border = "none";
    if (this.options.sandbox) iframe.setAttribute("sandbox", this.options.sandbox);
    this.container.appendChild(iframe);
    this.iframe = iframe;
  }
  destroy() {
    var _a;
    window.removeEventListener("message", this.handleMessage);
    if ((_a = this.iframe) == null ? void 0 : _a.parentElement) this.iframe.parentElement.removeChild(this.iframe);
    this.iframe = null;
    this.events.clear();
    this.initialized = false;
    this.container = null;
  }
  // =========================
  // INTERNAL EVENT API (modules dùng)
  // =========================
  _on(event, cb) {
    return this.events.on(event, cb);
  }
  _off(event, cb) {
    this.events.off(event, cb);
  }
  _emit(event, payload) {
    this.events.emit(event, payload);
  }
  // =========================
  // INTERNAL MESSAGE API
  // =========================
  postToViewer(type, payload) {
    var _a;
    const w = (_a = this.iframe) == null ? void 0 : _a.contentWindow;
    if (!w) return;
    const msg = { source: "HC_SDK", type, payload };
    w.postMessage(msg, this.options.allowedOrigin || "*");
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HcViewer,
  ViewerMessageType
});
