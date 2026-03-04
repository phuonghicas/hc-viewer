
export type ViewerEventMap = {
  "camera:home": { timestamp: number };
  "node:select": { nodeId: string; timestamp: number };
  "interaction:pan-change": { enabled: boolean };
};

export type ViewerEventKey = keyof ViewerEventMap;

export type ViewerEventPayload<K extends ViewerEventKey> = ViewerEventMap[K];