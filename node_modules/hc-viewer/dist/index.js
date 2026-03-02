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
  HcViewer: () => HcViewer
});
module.exports = __toCommonJS(index_exports);

// src/viewer.ts
var HcViewer = class {
  constructor(options) {
    this.iframe = null;
    // listener riêng cho toolbar
    this.toolbarListeners = [];
    // =========================
    // PRIVATE
    // =========================
    this.handleMessage = (event) => {
      if (!this.iframe) return;
      if (event.source !== this.iframe.contentWindow) return;
      if (this.options.allowedOrigin && event.origin !== this.options.allowedOrigin) {
        return;
      }
      const data = event.data;
      if (!data || data.source !== "HC_VIEWER") return;
      if (data.type === "viewer-home-click") {
        this.toolbarListeners.forEach(
          (cb) => cb(data.payload)
        );
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
  update(url) {
    this.options.url = url;
    if (this.iframe) {
      this.iframe.src = url;
    }
  }
  destroy() {
    window.removeEventListener("message", this.handleMessage);
    if (this.iframe) {
      this.container.removeChild(this.iframe);
      this.iframe = null;
    }
    this.toolbarListeners = [];
  }
  // =========================
  // PUBLIC API EVENT
  // =========================
  onSelectToolbarBtn(callback) {
    this.toolbarListeners.push(callback);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HcViewer
});
