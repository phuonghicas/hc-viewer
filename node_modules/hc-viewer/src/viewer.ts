export type HcViewerOptions = {
  container: HTMLElement | string;
  url: string;
  width?: string;
  height?: string;
  sandbox?: string;
  allowedOrigin?: string; // để check bảo mật
};

export type ViewerToolbarPayload = {
  viewId: string;
  formatViewer: string;
  trigger: string;
  timestamp: number;
};

export class HcViewer {
  private container: HTMLElement;
  private iframe: HTMLIFrameElement | null = null;
  private options: HcViewerOptions;

  // listener riêng cho toolbar
  private toolbarListeners: Array<(payload: ViewerToolbarPayload) => void> =
    [];

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

  update(url: string) {
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

  onSelectToolbarBtn(
    callback: (payload: ViewerToolbarPayload) => void
  ) {
    this.toolbarListeners.push(callback);
  }

  // =========================
  // PRIVATE
  // =========================

  private handleMessage = (event: MessageEvent) => {
    if (!this.iframe) return;

    // bảo vệ: chỉ nhận từ iframe này
    if (event.source !== this.iframe.contentWindow) return;

    // bảo vệ origin nếu có cấu hình
    if (
      this.options.allowedOrigin &&
      event.origin !== this.options.allowedOrigin
    ) {
      return;
    }

    const data = event.data;

    if (!data || data.source !== "HC_VIEWER") return;

    if (data.type === "viewer-home-click") {
      this.toolbarListeners.forEach((cb) =>
        cb(data.payload as ViewerToolbarPayload)
      );
    }
  };
}