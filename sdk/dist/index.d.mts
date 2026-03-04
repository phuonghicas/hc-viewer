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
declare class HcViewer {
    private container;
    private iframe;
    private options;
    private listeners;
    constructor(options: HcViewerOptions);
    render(): void;
    destroy(): void;
    on<K extends keyof ViewerEventMap>(event: K, callback: (payload: ViewerEventMap[K]) => void): void;
    private emit;
    private postToViewer;
    zoomIn(percent: number): void;
    zoomOut(percent: number): void;
    goHome(): void;
    enablePan(): void;
    disablePan(): void;
    private handleMessage;
}

export { HcViewer, type HcViewerOptions, ViewerMessageType };
