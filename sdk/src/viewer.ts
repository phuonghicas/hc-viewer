// sdk/src/viewer.ts
import { Emitter } from "./core/emitter";
import type { PreparedViewerData, SdkEventKey, SdkEventMap, SdkEventPayload } from "./contracts/events";

import { CameraModule } from "./modules/camera.module";
import { InteractionModule } from "./modules/interaction.module";
import { NodeModule } from "./modules/node.module";
import { FilesModule } from "./modules/files.module";
import { ToolbarModule } from "./modules/toolbar.module";

import {
  ViewerMessageType,
  ViewerMessageSource,
  type IncomingMessage,
  type OutgoingMessage,
} from "./contracts/messages"; 
export type Viewer3DOptions = {
  container: HTMLElement | string;
  url?: string;
  baseUrl?: string;
  viewerPath?: string;
  uploadPath?: string;
  file?: File;
  notify?: boolean | { success?: boolean; error?: boolean };

  width?: string;
  height?: string;
  sandbox?: string;
  allowedOrigin?: string;
};

export class Viewer3D {
  private containerEl: HTMLElement | null = null;
  private iframeEl: HTMLIFrameElement | null = null;
  private initialized = false;

  private emitter = new Emitter<SdkEventMap>();

  // modules
  public camera: CameraModule;
  public interaction: InteractionModule;
  public node: NodeModule;
  public files: FilesModule;
  public toolbar: ToolbarModule;

  constructor(private options: Viewer3DOptions) {
    this.camera = new CameraModule(this);
    this.interaction = new InteractionModule(this);
    this.node = new NodeModule(this);
    this.files = new FilesModule(this);
    this.toolbar = new ToolbarModule(this);
  }

  // ===== options helpers =====
  getOptions(): Viewer3DOptions {
    return this.options;
  }

  patchOptions(next: Partial<Viewer3DOptions>) {
    this.options = { ...this.options, ...next };
  }

  getUrl(): string | null {
    return this.options.url ?? null;
  }

  // ===== lifecycle =====
  init(): void {
    if (this.initialized) return;

    this.containerEl =
      typeof this.options.container === "string"
        ? (document.querySelector(this.options.container) as HTMLElement | null)
        : this.options.container;

    if (!this.containerEl) throw new Error("Container element not found");

    window.addEventListener("message", this.handleMessage);
    this.initialized = true;
  }

  async render(file?: File): Promise<PreparedViewerData | void> {
    this.ensureInit();
    if (this.iframeEl) return;
    // If URL is missing, render falls back to files pipeline.
    if (!this.options.url) return this.files.render(file);
    const iframe = document.createElement("iframe");
    iframe.src = this.options.url;
    iframe.style.border = "none";
    iframe.style.width = this.options.width || "100%";
    iframe.style.height = this.options.height || "100%";
    iframe.width = this.options.width || "100%";
    iframe.height = this.options.height || "100%";
    if (this.options.sandbox) iframe.setAttribute("sandbox", this.options.sandbox);
    this.containerEl!.appendChild(iframe);
    this.iframeEl = iframe;
  }

  open(url: string): void {
    this.ensureInit();
    this.options.url = url;
    if (!this.iframeEl) {
      this.render();
      return;
    }
    this.iframeEl.src = url;
  }

  destroy(): void {
    // remove listener using the same function reference
    window.removeEventListener("message", this.handleMessage);

    // remove iframe
    if (this.iframeEl && this.containerEl) {
      try {
        this.containerEl.removeChild(this.iframeEl);
      } catch {
        // ignore
      }
    }

    this.iframeEl = null;
    this.containerEl = null;
    this.initialized = false;
  }

  private ensureInit(): void {
    if (!this.initialized) throw new Error("Call viewer.init() before using viewer");
  }

  // ===== typed internal events used by modules =====
  _on<K extends SdkEventKey>(event: K, cb: (payload: SdkEventPayload<K>) => void): () => void {
    return this.emitter.on(event, cb);
  }

  _off<K extends SdkEventKey>(event: K, cb: (payload: SdkEventPayload<K>) => void): void {
    this.emitter.off(event, cb);
  }

  _emit<K extends SdkEventKey>(event: K, payload: SdkEventPayload<K>): void {
    this.emitter.emit(event, payload);
  }

  // ===== postMessage bridge =====
  postToViewer<TPayload = unknown>(type: ViewerMessageType, payload?: TPayload): void {
    if (!this.iframeEl?.contentWindow) return;

    const message: OutgoingMessage<TPayload> = {
      source: ViewerMessageSource.SDK,
      type,
      payload,
    };
    const targetOrigin = this.options.allowedOrigin || "*";
    this.iframeEl.contentWindow.postMessage(message, targetOrigin);
  }
  private handleMessage = (event: MessageEvent) => {
    const data = event.data as IncomingMessage | undefined;
    if (!data || typeof data !== "object") return;

    switch (data.type) {
      case ViewerMessageType.HOME_CLICK:
        this._emit("camera:home", { timestamp: Date.now() });
        break;

      case ViewerMessageType.NODE_SELECT:
        this._emit("node:select", { nodeId: String((data as any).payload?.nodeId ?? ""), timestamp: Date.now() });
        break;

      case ViewerMessageType.PAN_CHANGE:
        this._emit("interaction:pan-change", { enabled: Boolean((data as any).payload?.enabled) });
        break;

      default:
        break;
    }
  };
}


