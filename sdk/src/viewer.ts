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

type OutgoingMessage = {
  source: "HC_SDK";
  type: ViewerMessageType;
  payload: any;
};

type IncomingMessage =
  | { source: "HC_VIEWER"; type: ViewerMessageType.HOME_CLICK; payload: ViewerEventMap["camera:home"] }
  | { source: "HC_VIEWER"; type: ViewerMessageType.NODE_SELECT; payload: ViewerEventMap["node:select"] }
  | {
      source: "HC_VIEWER";
      type: ViewerMessageType.PAN_CHANGE;
      payload: ViewerEventMap["interaction:pan-change"];
    }
  // fallback
  | { source: "HC_VIEWER"; type: string; payload: any };

export class HcViewer {
  private container: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private initialized = false;

  private events = new Emitter<ViewerEventMap>();

  // modules
  public camera: CameraModule;
  public interaction: InteractionModule;
  public node: NodeModule;

  constructor(private options: HcViewerOptions) {
    this.camera = new CameraModule(this);
    this.interaction = new InteractionModule(this);
    this.node = new NodeModule(this);
  }

  init() {
    if (this.initialized) return;

    this.container =
      typeof this.options.container === "string"
        ? (document.querySelector(this.options.container) as HTMLElement | null)
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

    // attribute + style cho chắc
    iframe.width = this.options.width || "100%";
    iframe.height = this.options.height || "100%";
    iframe.style.width = this.options.width || "100%";
    iframe.style.height = this.options.height || "100%";

    iframe.style.border = "none";

    if (this.options.sandbox) iframe.setAttribute("sandbox", this.options.sandbox);

    this.container!.appendChild(iframe);
    this.iframe = iframe;
  }

  destroy() {
    // remove listener trước
    window.removeEventListener("message", this.handleMessage);

    // remove iframe
    if (this.iframe?.parentElement) this.iframe.parentElement.removeChild(this.iframe);
    this.iframe = null;

    // clear events
    this.events.clear();

    this.initialized = false;
    this.container = null;
  }

  // =========================
  // INTERNAL EVENT API (modules dùng)
  // =========================
  _on<K extends ViewerEventKey>(event: K, cb: (payload: ViewerEventPayload<K>) => void) {
    return this.events.on(event, cb);
  }

  _off<K extends ViewerEventKey>(event: K, cb: (payload: ViewerEventPayload<K>) => void) {
    this.events.off(event, cb);
  }

  _emit<K extends ViewerEventKey>(event: K, payload: ViewerEventPayload<K>) {
    this.events.emit(event, payload);
  }

  // =========================
  // INTERNAL MESSAGE API
  // =========================
  postToViewer(type: ViewerMessageType, payload: any) {
    const w = this.iframe?.contentWindow;
    if (!w) return;

    const msg: OutgoingMessage = { source: "HC_SDK", type, payload };
    w.postMessage(msg, this.options.allowedOrigin || "*");
  }

  // =========================
  // MESSAGE HANDLER
  // =========================
  private handleMessage = (event: MessageEvent) => {
    const iframeWindow = this.iframe?.contentWindow;
    if (!iframeWindow) return;

    // chỉ nhận message từ đúng iframe
    if (event.source !== iframeWindow) return;

    const data = event.data as IncomingMessage;
    if (!data || data.source !== "HC_VIEWER") return;

    // nếu user set allowedOrigin thì validate
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

      default:
        // ignore unknown
        break;
    }
  };
}