import { ViewerMessageType, HcViewer } from "../viewer";

export class CameraModule {
  public on: {
    home: (cb: (payload: { timestamp: number }) => void) => () => void;
  };

  constructor(private viewer: HcViewer) {
    this.on = {
      home: (cb) => this.viewer._on("camera:home", cb),
    };
  }

  zoomIn(percent: number) {
    this.viewer.postToViewer(ViewerMessageType.ZOOM, { action: "in", percent });
  }

  zoomOut(percent: number) {
    this.viewer.postToViewer(ViewerMessageType.ZOOM, { action: "out", percent });
  }

  home() {
    this.viewer.postToViewer(ViewerMessageType.HOME, {});
  }
}