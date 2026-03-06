// sdk/src/contracts/messages.ts
export enum ViewerMessageType {
  ZOOM = "viewer-zoom",
  HOME = "viewer-home",
  PAN_TOGGLE = "viewer-pan-toggle",

  HOME_CLICK = "viewer-home-click",
  NODE_SELECT = "viewer-node-select",
  PAN_CHANGE = "viewer-pan-change",
}

export type OutgoingMessage<T = unknown> = {
  type: ViewerMessageType;
  payload?: T;
};

export type IncomingMessage<T = any> = {
  type: ViewerMessageType;
  payload?: T;
};