declare class CameraModule {
    private viewer;
    on: {
        home: (cb: (payload: {
            timestamp: number;
        }) => void) => () => void;
    };
    constructor(viewer: HcViewer);
    zoomIn(percent: number): void;
    zoomOut(percent: number): void;
    home(): void;
}

declare class InteractionModule {
    private viewer;
    on: {
        panChange: (cb: (payload: {
            enabled: boolean;
        }) => void) => () => void;
    };
    constructor(viewer: HcViewer);
    enablePan(): void;
    disablePan(): void;
}

declare class NodeModule {
    private viewer;
    on: {
        select: (cb: (payload: {
            nodeId: string;
            timestamp: number;
        }) => void) => () => void;
    };
    constructor(viewer: HcViewer);
}

type ViewerEventMap = {
    "camera:home": {
        timestamp: number;
    };
    "node:select": {
        nodeId: string;
        timestamp: number;
    };
    "interaction:pan-change": {
        enabled: boolean;
    };
};
type ViewerEventKey = keyof ViewerEventMap;
type ViewerEventPayload<K extends ViewerEventKey> = ViewerEventMap[K];

type HcViewerOptions = {
    container: HTMLElement | string;
    url: string;
    width?: string;
    height?: string;
    sandbox?: string;
    allowedOrigin?: string;
};
declare enum ViewerMessageType {
    ZOOM = "viewer-zoom",
    HOME = "viewer-home",
    PAN_TOGGLE = "viewer-pan-toggle",
    HOME_CLICK = "viewer-home-click",
    NODE_SELECT = "viewer-node-select",
    PAN_CHANGE = "viewer-pan-change"
}
declare class HcViewer {
    private options;
    private container;
    private iframe;
    private initialized;
    private events;
    camera: CameraModule;
    interaction: InteractionModule;
    node: NodeModule;
    constructor(options: HcViewerOptions);
    init(): void;
    private ensureInit;
    render(): void;
    destroy(): void;
    _on<K extends ViewerEventKey>(event: K, cb: (payload: ViewerEventPayload<K>) => void): () => void;
    _off<K extends ViewerEventKey>(event: K, cb: (payload: ViewerEventPayload<K>) => void): void;
    _emit<K extends ViewerEventKey>(event: K, payload: ViewerEventPayload<K>): void;
    postToViewer(type: ViewerMessageType, payload: any): void;
    private handleMessage;
}

export { HcViewer, type HcViewerOptions, ViewerMessageType };
