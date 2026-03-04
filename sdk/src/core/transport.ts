// sdk/src/core/transport.ts
export type TransportOptions = {
  allowedOrigin?: string; // nếu set thì validate event.origin
};

export type OutgoingMessage = {
  source: "HC_SDK";
  type: string;
  payload: any;
};

export type IncomingMessage = {
  source: "HC_VIEWER";
  type: string;
  payload: any;
};

export class PostMessageTransport {
  constructor(private getTargetWindow: () => Window | null, private opts: TransportOptions) {}

  send(type: string, payload: any) {
    const w = this.getTargetWindow();
    if (!w) return;

    const msg: OutgoingMessage = { source: "HC_SDK", type, payload };
    w.postMessage(msg, this.opts.allowedOrigin || "*");
  }

  isValidIncoming(event: MessageEvent, iframeWindow: Window | null): event is MessageEvent & { data: IncomingMessage } {
    if (!iframeWindow) return false;
    if (event.source !== iframeWindow) return false;

    const data = event.data as IncomingMessage;
    if (!data || data.source !== "HC_VIEWER") return false;

    if (this.opts.allowedOrigin && event.origin !== this.opts.allowedOrigin) return false;
    return true;
  }
}