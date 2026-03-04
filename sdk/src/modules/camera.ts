import { HcViewer, ViewerMessageType } from "../viewer";

export class CameraModule {
  constructor(private viewer: HcViewer) {}

  zoomIn(percent: number) {
    this.viewer.postToViewer(ViewerMessageType.ZOOM, {
      action: "in",
      percent,
    });
  }

  zoomOut(percent: number) {
    this.viewer.postToViewer(ViewerMessageType.ZOOM, {
      action: "out",
      percent,
    });
  }

  home() {
    this.viewer.postToViewer(ViewerMessageType.HOME, {});
  }
}