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
  HcViewer: () => HcViewer,
  ViewerMessageType: () => ViewerMessageType
});
module.exports = __toCommonJS(index_exports);

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
    this.listeners = {};
    // ========================
    // VIEWER → SDK
    // ========================
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
  render() {
    if (this.iframe) return;
    const iframe = document.createElement("iframe");
    iframe.src = this.options.url;
    iframe.width = this.options.width || "100%";
    iframe.height = this.options.height || "100%";
    iframe.style.border = "none";
    if (this.options.sandbox) {
      iframe.setAttribute("sandbox", this.options.sandbox);
    }
    this.container.appendChild(iframe);
    this.iframe = iframe;
  }
  destroy() {
    window.removeEventListener("message", this.handleMessage);
    if (this.iframe) {
      this.container.removeChild(this.iframe);
      this.iframe = null;
    }
    this.listeners = {};
  }
  // ========================
  // EVENT SYSTEM (TYPED)
  // ========================
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
  emit(event, payload) {
    var _a;
    (_a = this.listeners[event]) == null ? void 0 : _a.forEach((cb) => cb(payload));
  }
  // ========================
  // SDK → VIEWER
  // ========================
  postToViewer(type, payload) {
    var _a;
    if (!((_a = this.iframe) == null ? void 0 : _a.contentWindow)) return;
    this.iframe.contentWindow.postMessage(
      {
        source: "HC_SDK",
        type,
        payload
      },
      this.options.allowedOrigin || "*"
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HcViewer,
  ViewerMessageType
});
