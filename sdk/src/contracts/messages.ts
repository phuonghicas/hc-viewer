// sdk/src/contracts/messages.ts
export enum ViewerMessageType {
  ZOOM = "viewer-zoom",
  DRAW_MODE = "viewer-draw-mode",
  EXPLODE = "viewer-explode",
  HOME = "viewer-home",
  PAN_TOGGLE = "viewer-pan-toggle",
  SELECT = "viewer-select",
  AREA_SELECT = "viewer-area-select",
  ORBIT = "viewer-orbit",
  ROTATE_Z = "viewer-rotate-z",
  WALK_THROUGH = "viewer-walk-through",
  ZOOM_WINDOW = "viewer-zoom-window",
  ZOOM_FIT = "viewer-zoom-fit",
  TOOLBAR_CONFIG = "viewer-toolbar-config",
  PANEL_OPEN = "viewer-panel-open",
  PANEL_CLOSE = "viewer-panel-close",
  CUTTING_PLANE_ACTION = "viewer-cutting-plane-action",
  SHEETS_GET_LIST = "viewer-sheets-get-list",
  SHEETS_LIST = "viewer-sheets-list",
  SHEETS_APPLY = "viewer-sheets-apply",
  TREE_SELECT_NODE = "viewer-tree-select-node",
  TREE_GET_NODE_IDS = "viewer-tree-get-node-ids",
  TREE_NODE_IDS = "viewer-tree-node-ids",

  HOME_CLICK = "viewer-home-click",
  NODE_SELECT = "viewer-node-select",
  PAN_CHANGE = "viewer-pan-change",
}

export enum ViewerMessageSource {
  SDK = "HC_SDK",
  VIEWER = "HC_VIEWER",
}

export type OutgoingMessage<T = unknown> = {
  source: ViewerMessageSource.SDK;
  type: ViewerMessageType;
  payload?: T;
};

export type IncomingMessage<T = any> = {
  source?: ViewerMessageSource | string;
  type: ViewerMessageType;
  payload?: T;
};

export type DrawModeValue =
  | "shaded"
  | "wireframe"
  | "hidden-line"
  | "shaded-wire"
  | "xray"
  | "ghosting";
export type DrawModePayload = {
  mode: DrawModeValue;
};

export type ExplodePayload = {
  magnitude: number;
};

export type PanelTarget =
  | "clipping-commands"
  | "setting"
  | "statesObjects"
  | "linkedObjects"
  | "model-tree"
  | "sheets"
  | "object-properties";
export type PanelOpenPayload = {
  panel: PanelTarget;
  format?: "3d" | "pdf";
};

export type PanelClosePayload = {
  panel: PanelTarget;
  format?: "3d" | "pdf";
};

export type CuttingPlaneAction =
  | "close"
  | "multi"
  | "toggle-section"
  | "toggle-plane"
  | "plane-x"
  | "plane-y"
  | "plane-z"
  | "plane-box"
  | "rotate-box"
  | "reverse-plane-x"
  | "reverse-plane-y"
  | "reverse-plane-z";

export type CuttingPlaneActionPayload = {
  action: CuttingPlaneAction;
};

export type SheetsGetListPayload = {
  requestId: string;
};

export type SheetListItem = {
  id: string | number;
  name: string;
  is3D?: boolean;
  viewId?: string;
};

export type SheetsListPayload = {
  requestId: string;
  sheets: SheetListItem[];
  activeSheetId?: string | number | null;
  timestamp: number;
};

export type SheetsApplyPayload = {
  sheetId: string | number;
};

export type TreeSelectNodePayload = {
  nodeId: string;
};

export type TreeGetNodeIdsPayload = {
  requestId: string;
  onlyRealNodes?: boolean;
};

export type TreeNodeIdsPayload = {
  requestId: string;
  nodeIds: string[];
  timestamp: number;
};
