// sdk/src/viewer.ts
import { CameraModule } from "./modules/camera.module";
import { InteractionModule } from "./modules/interaction.module";
import { NodeModule } from "./modules/node.module";
import { FilesModule } from "./modules/files.module";
import { Emitter } from "./core/emitter";
import type { SdkEventMap, SdkEventKey, SdkEventPayload } from "./contracts/events";

export type HcViewerOptions = {
  container: HTMLElement | string;

  // NEW: url optional (pipeline sẽ set sau)
  url?: string;

  // NEW: pipeline options (ported from old)
  baseUrl?: string;
  viewerPath?: string;
  uploadPath?: string;
  file?: File;
  polling?: { maxAttempts?: number; intervalMs?: number };
  notify?: boolean | { success?: boolean; error?: boolean };

  width?: string;
  height?: string;
  sandbox?: string;
  allowedOrigin?: string;
};

export class HcViewer {
  private container: HTMLElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private initialized = false;

  // change typed emitter map
  private events = new Emitter<SdkEventMap>();

  // modules
  public camera: CameraModule;
  public interaction: InteractionModule;
  public node: NodeModule;

  // NEW
  public files: FilesModule;

  constructor(private options: HcViewerOptions) {
    this.camera = new CameraModule(this);
    this.interaction = new InteractionModule(this);
    this.node = new NodeModule(this);

    this.files = new FilesModule(this);
  }

  // NEW helpers for FilesModule
  getOptions(): HcViewerOptions {
    return this.options;
  }

  patchOptions(next: Partial<HcViewerOptions>) {
    this.options = { ...this.options, ...next };
  }

  getUrl(): string | null {
    return this.options.url || null;
  }

  open(url: string) {
    this.ensureInit();
    this.options.url = url;

    if (!this.iframe) {
      this.render();
      return;
    }
    this.iframe.src = url;
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

    if (!this.options.url) {
      // không auto throw để bạn có thể init trước rồi files.render() sau
      // nhưng nếu bạn muốn strict: throw new Error("Missing url. Use viewer.open(url) or files.render(file).");
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.src = this.options.url;
    iframe.width = this.options.width || "100%";
    iframe.height = this.options.height || "100%";
    iframe.style.width = this.options.width || "100%";
    iframe.style.height = this.options.height || "100%";
    iframe.style.border = "none";
    if (this.options.sandbox) iframe.setAttribute("sandbox", this.options.sandbox);

    this.container!.appendChild(iframe);
    this.iframe = iframe;
  }

  // typed internal event api (update generic)
  _on<K extends SdkEventKey>(event: K, cb: (payload: SdkEventPayload<K>) => void) {
    return this.events.on(event, cb);
  }
  _off<K extends SdkEventKey>(event: K, cb: (payload: SdkEventPayload<K>) => void) {
    this.events.off(event, cb);
  }
  _emit<K extends SdkEventKey>(event: K, payload: SdkEventPayload<K>) {
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