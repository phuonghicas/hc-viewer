export type HcViewerOptions = {
  container: HTMLElement | string;
  url: string;
  width?: string;
  height?: string;
  sandbox?: string;
  allowedOrigin?: string;
};

export enum ViewerMessageType {
  ZOOM = "viewer-zoom",
  HOME = "viewer-home",
  PAN_TOGGLE = "viewer-pan-toggle",

  HOME_CLICK = "viewer-home-click",
  NODE_SELECT = "viewer-node-select",
  PAN_CHANGE = "viewer-pan-change",
}

type ViewerEventMap = {
  "camera:home": { timestamp: number };
  "node:select": { nodeId: string; timestamp: number };
  "interaction:pan-change": { enabled: boolean };
};

export class HcViewer {
  private container: HTMLElement;
  private iframe: HTMLIFrameElement | null = null;
  private options: HcViewerOptions;

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

  on<K extends keyof ViewerEventMap>(
    event: K,
    callback: (payload: ViewerEventMap[K]) => void
  ) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
  }

  private emit<K extends keyof ViewerEventMap>(
    event: K,
    payload: ViewerEventMap[K]
  ) {
    this.listeners[event]?.forEach(cb => cb(payload));
  }

  // ========================
  // SDK → VIEWER
  // ========================

  private postToViewer(type: ViewerMessageType, payload: any) {
    if (!this.iframe?.contentWindow) return;

    this.iframe.contentWindow.postMessage(
      {
        source: "HC_SDK",
        type,
        payload,
      },
      this.options.allowedOrigin || "*"
    );
  }

  zoomIn(percent: number) {
    this.postToViewer(ViewerMessageType.ZOOM, {
      action: "in",
      percent,
    });
  }

  zoomOut(percent: number) {
    this.postToViewer(ViewerMessageType.ZOOM, {
      action: "out",
      percent,
    });
  }

  goHome() {
    this.postToViewer(ViewerMessageType.HOME, {});
  }

  enablePan() {
    this.postToViewer(ViewerMessageType.PAN_TOGGLE, { enabled: true });
  }

  disablePan() {
    this.postToViewer(ViewerMessageType.PAN_TOGGLE, { enabled: false });
  }

  // ========================
  // VIEWER → SDK
  // ========================

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