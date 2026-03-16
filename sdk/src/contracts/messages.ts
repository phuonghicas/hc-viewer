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

export type PanelTarget = "clipping-commands" | "setting" | "statesObjects" | "linkedObjects";
export type PanelOpenPayload = {
  panel: PanelTarget;
  format?: "3d" | "pdf";
};
