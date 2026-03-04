import { HcViewer, ViewerMessageType } from "../viewer";

export class InteractionModule {
  constructor(private viewer: HcViewer) {}

  enablePan() {
    this.viewer.postToViewer(ViewerMessageType.PAN_TOGGLE, {
      enabled: true,
    });
  }

  disablePan() {
    this.viewer.postToViewer(ViewerMessageType.PAN_TOGGLE, {
      enabled: false,
    });
  }
}