import { Viewer3D } from "../viewer";
import { type DrawModeValue, ViewerMessageType } from "../contracts/messages";
export class InteractionModule {
  public on: {
    panChange: (cb: (payload: { enabled: boolean }) => void) => () => void;
  };

  constructor(private viewer: Viewer3D) {
    this.on = {
      panChange: (cb) => this.viewer._on("interaction:pan-change", cb),
    };
  }

  enablePan() {
    this.viewer.postToViewer(ViewerMessageType.PAN_TOGGLE, { enabled: true });
  }

  disablePan() {
    this.viewer.postToViewer(ViewerMessageType.PAN_TOGGLE, { enabled: false });
  }

  select() {
    this.viewer.postToViewer(ViewerMessageType.SELECT);
  }

  areaSelect() {
    this.viewer.postToViewer(ViewerMessageType.AREA_SELECT);
  }

  orbit() {
    this.viewer.postToViewer(ViewerMessageType.ORBIT);
  }

  rotateZ() {
    this.viewer.postToViewer(ViewerMessageType.ROTATE_Z);
  }

  walkThrough() {
    this.viewer.postToViewer(ViewerMessageType.WALK_THROUGH);
  }

  zoomWindow() {
    this.viewer.postToViewer(ViewerMessageType.ZOOM_WINDOW);
  }

  zoomFit() {
    this.viewer.postToViewer(ViewerMessageType.ZOOM_FIT);
  }

  drawModeShaded() {
    this.setDrawMode("shaded");
  }

  drawModeWireframe() {
    this.setDrawMode("wireframe");
  }

  drawModeHiddenLine() {
    this.setDrawMode("hidden-line");
  }

  drawModeShadedWire() {
    this.setDrawMode("shaded-wire");
  }

  drawModeXRay() {
    this.setDrawMode("xray");
  }

  drawModeGhosting() {
    this.setDrawMode("ghosting");
  }

  explode(magnitude: number) {
    this.viewer.postToViewer(ViewerMessageType.EXPLODE, { magnitude });
  }

  explodeOff() {
    this.explode(0);
  }

  private setDrawMode(mode: DrawModeValue) {
    this.viewer.postToViewer(ViewerMessageType.DRAW_MODE, { mode });
  }
}
