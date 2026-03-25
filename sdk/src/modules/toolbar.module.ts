import { Viewer3D } from "../viewer";
import {
  type CuttingPlaneActionPayload,
  type PanelTarget,
  type SheetListItem,
  type SheetsApplyPayload,
  type SheetsGetListPayload,
  ViewerMessageType,
} from "../contracts/messages";

export type ToolbarFormat = "3d" | "pdf";
export type GetSheetsOptions = {
  timeoutMs?: number;
};

type ToolbarConfigPayload = {
  format: ToolbarFormat;
  mode: "set" | "clear";
  operators?: string[];
};

type PanelOpenPayload = {
  panel: PanelTarget;
  format?: ToolbarFormat;
};

type PanelClosePayload = {
  panel: PanelTarget;
  format?: ToolbarFormat;
};

function createRequestId(): string {
  return `sheets_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

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
  public on = {
    planMode: (cb: (payload: { mode: "plan" | "document"; timestamp: number }) => void) => this.viewer._on("toolbar:pdf-plan-mode", cb),
    documentMode: (cb: (payload: { mode: "plan" | "document"; timestamp: number }) => void) => this.viewer._on("toolbar:pdf-document-mode", cb),
    firstPage: (cb: (payload: { timestamp: number }) => void) => this.viewer._on("toolbar:pdf-first-page", cb),
    previousPage: (cb: (payload: { timestamp: number }) => void) => this.viewer._on("toolbar:pdf-previous-page", cb),
    nextPage: (cb: (payload: { timestamp: number }) => void) => this.viewer._on("toolbar:pdf-next-page", cb),
    lastPage: (cb: (payload: { timestamp: number }) => void) => this.viewer._on("toolbar:pdf-last-page", cb),
    currentPage: (cb: (payload: { pageIndex: number; pageNumber: number; timestamp: number }) => void) => this.viewer._on("toolbar:pdf-current-page", cb),
  };

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

  closeClippingPlanes() {
    this.postPanelClose({ panel: "clipping-commands", format: "3d" });
  }

  openSetting() {
    this.postPanelOpen({ panel: "setting" });
  }

  closeSetting() {
    this.postPanelClose({ panel: "setting" });
  }

  openSetting3D() {
    this.postPanelOpen({ panel: "setting", format: "3d" });
  }

  closeSetting3D() {
    this.postPanelClose({ panel: "setting", format: "3d" });
  }

  openSettingPdf() {
    this.postPanelOpen({ panel: "setting", format: "pdf" });
  }

  closeSettingPdf() {
    this.postPanelClose({ panel: "setting", format: "pdf" });
  }

  openStatesObjects() {
    this.postPanelOpen({ panel: "statesObjects", format: "3d" });
  }

  closeStatesObjects() {
    this.postPanelClose({ panel: "statesObjects", format: "3d" });
  }

  openLinkedObjects() {
    this.postPanelOpen({ panel: "linkedObjects", format: "3d" });
  }

  closeLinkedObjects() {
    this.postPanelClose({ panel: "linkedObjects", format: "3d" });
  }

  openModelTree() {
    this.postPanelOpen({ panel: "model-tree", format: "3d" });
  }

  closeModelTree() {
    this.postPanelClose({ panel: "model-tree", format: "3d" });
  }

  openObjectProperties() {
    this.postPanelOpen({ panel: "object-properties", format: "3d" });
  }

  closeObjectProperties() {
    this.postPanelClose({ panel: "object-properties", format: "3d" });
  }

  openSheets() {
    this.postPanelOpen({ panel: "sheets", format: "3d" });
  }

  closeSheets() {
    this.postPanelClose({ panel: "sheets", format: "3d" });
  }

  getSheets(options?: GetSheetsOptions): Promise<SheetListItem[]> {
    const requestId = createRequestId();
    const timeoutMs = Math.max(1000, options?.timeoutMs ?? 10000);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error("Timeout while getting sheets list from viewer"));
      }, timeoutMs);

      const off = this.viewer._on("sheets:list", (payload) => {
        if (payload.requestId !== requestId) return;
        clearTimeout(timer);
        off();
        resolve(payload.sheets);
      });

      this.postSheetsGetList({ requestId });
    });
  }

  applySheet(sheetId: string | number) {
    this.postSheetsApply({ sheetId });
  }

  cuttingCloseSections() {
    this.postCuttingAction({ action: "close" });
  }

  cuttingMultipleSides() {
    this.postCuttingAction({ action: "multi" });
  }

  cuttingToggleSelection() {
    this.postCuttingAction({ action: "toggle-section" });
  }

  cuttingTogglePlanes() {
    this.postCuttingAction({ action: "toggle-plane" });
  }

  cuttingPlaneX() {
    this.postCuttingAction({ action: "plane-x" });
  }

  cuttingPlaneY() {
    this.postCuttingAction({ action: "plane-y" });
  }

  cuttingPlaneZ() {
    this.postCuttingAction({ action: "plane-z" });
  }

  cuttingPlaneBox() {
    this.postCuttingAction({ action: "plane-box" });
  }

  cuttingRotateBox() {
    this.postCuttingAction({ action: "rotate-box" });
  }

  cuttingReversePlaneX() {
    this.postCuttingAction({ action: "reverse-plane-x" });
  }

  cuttingReversePlaneY() {
    this.postCuttingAction({ action: "reverse-plane-y" });
  }

  cuttingReversePlaneZ() {
    this.postCuttingAction({ action: "reverse-plane-z" });
  }

  private postConfig(payload: ToolbarConfigPayload) {
    this.viewer.postToViewer(ViewerMessageType.TOOLBAR_CONFIG, payload);
  }

  private postPanelOpen(payload: PanelOpenPayload) {
    this.viewer.postToViewer(ViewerMessageType.PANEL_OPEN, payload);
  }

  private postPanelClose(payload: PanelClosePayload) {
    this.viewer.postToViewer(ViewerMessageType.PANEL_CLOSE, payload);
  }

  private postCuttingAction(payload: CuttingPlaneActionPayload) {
    this.viewer.postToViewer(ViewerMessageType.CUTTING_PLANE_ACTION, payload);
  }

  private postSheetsGetList(payload: SheetsGetListPayload) {
    this.viewer.postToViewer(ViewerMessageType.SHEETS_GET_LIST, payload);
  }

  private postSheetsApply(payload: SheetsApplyPayload) {
    this.viewer.postToViewer(ViewerMessageType.SHEETS_APPLY, payload);
  }
}
