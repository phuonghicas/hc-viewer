// sdk/src/contracts/messages.ts
export enum ViewerMessageType {
  ZOOM = "viewer-zoom",
  HOME = "viewer-home",
  PAN_TOGGLE = "viewer-pan-toggle",

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
