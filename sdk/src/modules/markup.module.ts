import { Viewer3D } from "../viewer";
import {
  type MarkupAction,
  type MarkupActionPayload,
  type MarkupListItem,
  type MarkupListPayload,
  type MarkupOperationResultPayload,
  type MarkupRequestPayload,
  ViewerMessageType,
} from "../contracts/messages";

export type MarkupRequestOptions = {
  timeoutMs?: number;
};

function createRequestId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class MarkupModule {
  constructor(private viewer: Viewer3D) {}

  action(action: MarkupAction) {
    this.viewer.postToViewer<MarkupActionPayload>(ViewerMessageType.MARKUP_ACTION, { action });
  }

  drawLine() {
    this.action("line");
  }

  drawArrow() {
    this.action("arrow");
  }

  drawCircle() {
    this.action("circle");
  }

  drawEllipse() {
    this.action("ellipse");
  }

  drawRectangle() {
    this.action("rectangle");
  }

  drawPolygon() {
    this.action("polygon");
  }

  drawPolyline() {
    this.action("polyline");
  }

  drawTextBox() {
    this.action("textbox");
  }

  drawNote() {
    this.action("note");
  }

  drawCallout() {
    this.action("callout");
  }

  drawCloud() {
    this.action("cloud");
  }

  drawFreehand() {
    this.action("freehand");
  }

  save(options?: MarkupRequestOptions): Promise<void> {
    return this.runRequest("markup-save", ViewerMessageType.MARKUP_SAVE, "markup:save", options);
  }

  cancel(options?: MarkupRequestOptions): Promise<void> {
    return this.runRequest("markup-cancel", ViewerMessageType.MARKUP_CANCEL, "markup:cancel", options);
  }

  getList(options?: MarkupRequestOptions): Promise<MarkupListItem[]> {
    const requestId = createRequestId("markup-list");
    const timeoutMs = Math.max(1000, options?.timeoutMs ?? 10000);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error("Timeout while getting markup list from viewer"));
      }, timeoutMs);

      const off = this.viewer._on("markup:list", (payload) => {
        if (payload.requestId !== requestId) return;
        clearTimeout(timer);
        off();
        resolve(payload.markups);
      });

      this.viewer.postToViewer<MarkupRequestPayload>(ViewerMessageType.MARKUP_GET_LIST, { requestId });
    });
  }

  private runRequest(
    prefix: string,
    messageType: ViewerMessageType.MARKUP_SAVE | ViewerMessageType.MARKUP_CANCEL,
    eventName: "markup:save" | "markup:cancel",
    options?: MarkupRequestOptions,
  ): Promise<void> {
    const requestId = createRequestId(prefix);
    const timeoutMs = Math.max(1000, options?.timeoutMs ?? 10000);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error(`Timeout while waiting for ${prefix} result from viewer`));
      }, timeoutMs);

      const off = this.viewer._on(eventName, (payload: MarkupOperationResultPayload) => {
        if (payload.requestId !== requestId) return;
        clearTimeout(timer);
        off();
        if (payload.success) {
          resolve();
          return;
        }
        reject(new Error(payload.error || `Viewer ${prefix} failed`));
      });

      this.viewer.postToViewer<MarkupRequestPayload>(messageType, { requestId });
    });
  }
}
