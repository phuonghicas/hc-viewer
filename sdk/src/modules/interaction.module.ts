import { HcViewer } from "../viewer";
import { ViewerMessageType } from "../contracts/messages";
export class InteractionModule {
  public on: {
    panChange: (cb: (payload: { enabled: boolean }) => void) => () => void;
  };

  constructor(private viewer: HcViewer) {
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
}