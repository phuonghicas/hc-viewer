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
export {
  HcViewer
};
