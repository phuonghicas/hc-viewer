import { CameraModule } from "./modules/camera.module";
import { InteractionModule } from "./modules/interaction.module";

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
  private container: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private initialized = false;

  private listeners: {
    [K in keyof ViewerEventMap]?: Array<(payload: ViewerEventMap[K]) => void>;
  } = {};

  private options: HcViewerOptions;

  // modules
  public camera: CameraModule;
  public interaction: InteractionModule;

  constructor(options: HcViewerOptions) {
    this.options = options;

    this.camera = new CameraModule(this);
    this.interaction = new InteractionModule(this);
  }

  init() {
    if (this.initialized) return;

    this.container =
      typeof this.options.container === "string"
        ? (document.querySelector(this.options.container) as HTMLElement)
        : this.options.container;

    if (!this.container) {
      throw new Error("Container element not found");
    }

    window.addEventListener("message", this.handleMessage);

    this.initialized = true;
  }

  private ensureInit() {
    if (!this.initialized) {
      throw new Error("Call viewer.init() before using viewer");
    }
  }

  render() {
    this.ensureInit();

    if (this.iframe) return;

    const iframe = document.createElement("iframe");

    iframe.src = this.options.url;
    iframe.width = this.options.width || "100%";
    iframe.height = this.options.height || "100%";
    iframe.style.border = "none";

    if (this.options.sandbox) {
      iframe.setAttribute("sandbox", this.options.sandbox);
    }

    this.container!.appendChild(iframe);
    this.iframe = iframe;
  }

  destroy() {
    window.removeEventListener("message", this.handleMessage);

    if (this.iframe && this.container) {
      this.container.removeChild(this.iframe);
    }

    this.iframe = null;
    this.listeners = {};
    this.initialized = false;
  }

  // =========================
  // EVENT SYSTEM
  // =========================

  on<K extends keyof ViewerEventMap>(
    event: K,
    callback: (payload: ViewerEventMap[K]) => void
  ) {
    if (!this.listeners[event]) this.listeners[event] = [];

    this.listeners[event]!.push(callback);
  }

  emit<K extends keyof ViewerEventMap>(
    event: K,
    payload: ViewerEventMap[K]
  ) {
    this.listeners[event]?.forEach(cb => cb(payload));
  }

  // =========================
  // INTERNAL MESSAGE API
  // =========================

  postToViewer(type: ViewerMessageType, payload: any) {
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

  // =========================
  // MESSAGE HANDLER
  // =========================

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