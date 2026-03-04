// sdk/src/viewer.ts
import { CameraModule } from "./modules/camera.module";
import { InteractionModule } from "./modules/interaction.module";
import { NodeModule } from "./modules/node.module";
import { Emitter } from "./core/emitter";
import type { ViewerEventMap, ViewerEventKey, ViewerEventPayload } from "./contracts/events";

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

export class HcViewer {
  private container: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private initialized = false;

  private events = new Emitter<ViewerEventMap>();
  private options: HcViewerOptions;

  // modules
  public camera: CameraModule;
  public interaction: InteractionModule;
  public node: NodeModule;

  constructor(options: HcViewerOptions) {
    this.options = options;

    this.camera = new CameraModule(this);
    this.interaction = new InteractionModule(this);
    this.node = new NodeModule(this);
  }

  init() {
    if (this.initialized) return;

    this.container =
      typeof this.options.container === "string"
        ? (document.querySelector(this.options.container) as HTMLElement)
        : this.options.container;

    if (!this.container) throw new Error("Container element not found");

    window.addEventListener("message", this.handleMessage);
    this.initialized = true;
  }

  private ensureInit() {
    if (!this.initialized) throw new Error("Call viewer.init() before using viewer");
  }

  render() {
    this.ensureInit();
    if (this.iframe) return;

    const iframe = document.createElement("iframe");
    iframe.src = this.options.url;
    iframe.width = this.options.width || "100%";
    iframe.height = this.options.height || "100%";
    iframe.style.border = "none";

    if (this.options.sandbox) iframe.setAttribute("sandbox", this.options.sandbox);

    this.container!.appendChild(iframe);
    this.iframe = iframe;
  }

  destroy() {
    window.removeEventListener("message", this.handleMessage);

    if (this.iframe && this.container) this.container.removeChild(this.iframe);
    this.iframe = null;

    this.events.clear();
    this.initialized = false;
  }

  // =========================
  // INTERNAL EVENT API (modules dùng)
  // =========================
  _on<K extends ViewerEventKey>(event: K, cb: (payload: ViewerEventPayload<K>) => void) {
    return this.events.on(event, cb);
  }

  _emit<K extends ViewerEventKey>(event: K, payload: ViewerEventPayload<K>) {
    this.events.emit(event, payload);
  }

  // =========================
  // INTERNAL MESSAGE API
  // =========================
  postToViewer(type: ViewerMessageType, payload: any) {
    if (!this.iframe?.contentWindow) return;

    this.iframe.contentWindow.postMessage(
      { source: "HC_SDK", type, payload },
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

    if (this.options.allowedOrigin && event.origin !== this.options.allowedOrigin) return;

    switch (data.type) {
      case ViewerMessageType.HOME_CLICK:
        this._emit("camera:home", data.payload);
        break;
      case ViewerMessageType.NODE_SELECT:
        this._emit("node:select", data.payload);
        break;
      case ViewerMessageType.PAN_CHANGE:
        this._emit("interaction:pan-change", data.payload);
        break;
    }
  };
}