import { Viewer3D } from "../viewer";
import { ViewerMessageType } from "../contracts/messages";

export type ToolbarFormat = "3d" | "pdf";

type ToolbarConfigPayload = {
  format: ToolbarFormat;
  mode: "set" | "clear";
  operators?: string[];
};

type PanelOpenPayload = {
  panel: "clipping-commands" | "setting" | "statesObjects" | "linkedObjects";
  format?: ToolbarFormat;
};

const ALL_3D_TOOLBAR_OPERATORS = [
  "home",
  "select",
  "areaSelect",
  "pan",
  "zoomIn",
  "zoomOut",
  "zoomWindow",
  "zoomFit",
  "orbit",
  "rotateZ",
  "walkThrough",
  "drawMode-shaded",
  "drawMode-wireframe",
  "drawMode-shaded-wire",
  "drawMode-hidden-line",
  "drawMode-xray",
  "drawMode-ghosting",
  "cutting-plane",
  "clipping-commands",
  "explode",
  "setting",
  "propertyPanel",
  "model-tree",
  "linkedObjects",
  "statesObjects",
  "synchronized",
];

const ALL_PDF_TOOLBAR_OPERATORS = [
  "home",
  "select",
  "pan",
  "zoomIn",
  "zoomOut",
  "zoomWindow",
  "zoomFit",
  "rotateZ",
  "save",
  "setting",
  "plan-mode",
  "document-mode",
  "first-page",
  "previous-page",
  "next-page",
  "last-page",
  "current-page",
];

export class ToolbarModule {
  constructor(private viewer: Viewer3D) {}

  setDisabled3D(operators: string[]) {
    this.postConfig({ format: "3d", mode: "set", operators });
  }

  setDisabledPdf(operators: string[]) {
    this.postConfig({ format: "pdf", mode: "set", operators });
  }

  clearDisabled3D() {
    this.postConfig({ format: "3d", mode: "clear" });
  }

  clearDisabledPdf() {
    this.postConfig({ format: "pdf", mode: "clear" });
  }

  disableAll3D() {
    this.setDisabled3D(ALL_3D_TOOLBAR_OPERATORS);
  }

  disableAllPdf() {
    this.setDisabledPdf(ALL_PDF_TOOLBAR_OPERATORS);
  }

  enableAll3D() {
    this.clearDisabled3D();
  }

  enableAllPdf() {
    this.clearDisabledPdf();
  }

  openClippingPlanes() {
    this.postPanelOpen({ panel: "clipping-commands", format: "3d" });
  }

  openSetting() {
    this.postPanelOpen({ panel: "setting" });
  }

  openSetting3D() {
    this.postPanelOpen({ panel: "setting", format: "3d" });
  }

  openSettingPdf() {
    this.postPanelOpen({ panel: "setting", format: "pdf" });
  }

  openStatesObjects() {
    this.postPanelOpen({ panel: "statesObjects", format: "3d" });
  }

  openLinkedObjects() {
    this.postPanelOpen({ panel: "linkedObjects", format: "3d" });
  }

  private postConfig(payload: ToolbarConfigPayload) {
    this.viewer.postToViewer(ViewerMessageType.TOOLBAR_CONFIG, payload);
  }

  private postPanelOpen(payload: PanelOpenPayload) {
    this.viewer.postToViewer(ViewerMessageType.PANEL_OPEN, payload);
  }
}
