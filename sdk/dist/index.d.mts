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
type LoadStage = "idle" | "uploading" | "converting" | "rendering" | "completed" | "error";
type LoadStatePayload = {
    isLoading: boolean;
    stage: LoadStage;
    message?: string;
    elapsedMs?: number;
};
type PreparedViewerData = {
    baseFileId: string;
    baseMajorRev: number;
    baseMinorRev: number;
    fileName: string;
    query: string;
    url: string;
};
type FilesEventMap = {
    "files:state": LoadStatePayload;
    "files:upload:start": {
        fileName: string;
    };
    "files:upload:success": {
        fileName: string;
        baseFileId: string;
    };
    "files:upload:error": {
        fileName: string;
        error: string;
    };
    "files:conversion:start": {
        fileName: string;
    };
    "files:conversion:success": PreparedViewerData;
    "files:conversion:error": {
        fileName: string;
        error: string;
    };
    "files:render:start": {
        url: string;
    };
    "files:render:success": {
        url: string;
    };
    "files:render:error": {
        url?: string;
        error: string;
    };
    "files:load:success": PreparedViewerData;
    "files:load:error": {
        error: string;
    };
};
type SdkEventMap = ViewerEventMap & FilesEventMap;
type SdkEventKey = keyof SdkEventMap;
type SdkEventPayload<K extends SdkEventKey> = SdkEventMap[K];

declare class CameraModule {
    private viewer;
    on: {
        home: (cb: (payload: {
            timestamp: number;
        }) => void) => () => void;
    };
    constructor(viewer: Viewer3D);
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
    constructor(viewer: Viewer3D);
    enablePan(): void;
    disablePan(): void;
    select(): void;
    areaSelect(): void;
    orbit(): void;
    rotateZ(): void;
    walkThrough(): void;
    zoomWindow(): void;
    zoomFit(): void;
    drawModeShaded(): void;
    drawModeWireframe(): void;
    drawModeHiddenLine(): void;
    drawModeShadedWire(): void;
    drawModeXRay(): void;
    drawModeGhosting(): void;
    explode(magnitude: number): void;
    explodeOff(): void;
    private setDrawMode;
}

declare class NodeModule {
    private viewer;
    on: {
        select: (cb: (payload: {
            nodeId: string;
            timestamp: number;
        }) => void) => () => void;
    };
    constructor(viewer: Viewer3D);
}

type FilesConfig = {
    baseUrl?: string;
    viewerPath?: string;
    uploadPath?: string;
    notify?: boolean | {
        success?: boolean;
        error?: boolean;
    };
};
declare class FilesModule {
    private viewer;
    on: {
        state: (cb: (payload: LoadStatePayload) => void) => () => void;
        uploadStart: (cb: (payload: {
            fileName: string;
        }) => void) => () => void;
        uploadSuccess: (cb: (payload: {
            fileName: string;
            baseFileId: string;
        }) => void) => () => void;
        uploadError: (cb: (payload: {
            fileName: string;
            error: string;
        }) => void) => () => void;
        conversionStart: (cb: (payload: {
            fileName: string;
        }) => void) => () => void;
        conversionSuccess: (cb: (payload: PreparedViewerData) => void) => () => void;
        conversionError: (cb: (payload: {
            fileName: string;
            error: string;
        }) => void) => () => void;
        renderStart: (cb: (payload: {
            url: string;
        }) => void) => () => void;
        renderSuccess: (cb: (payload: {
            url: string;
        }) => void) => () => void;
        renderError: (cb: (payload: {
            url?: string;
            error: string;
        }) => void) => () => void;
        loadSuccess: (cb: (payload: PreparedViewerData) => void) => () => void;
        loadError: (cb: (payload: {
            error: string;
        }) => void) => () => void;
    };
    private config;
    private operationStartTime;
    private state;
    private lastUploadSession;
    constructor(viewer: Viewer3D);
    setConfig(next: FilesConfig): void;
    getState(): LoadStatePayload;
    upload(file?: File): Promise<{
        fileName: string;
        baseFileId: string;
    }>;
    convert(file?: File): Promise<PreparedViewerData>;
    prepare(file?: File): Promise<PreparedViewerData>;
    open(input: PreparedViewerData | {
        url: string;
    }): void;
    render(file?: File): Promise<PreparedViewerData>;
    private resolveFile;
    private normalizeBaseUrl;
    private resolveBaseUrl;
    private resolveViewerPath;
    private resolveViewerOrigin;
    private resolveHostConversion;
    private getUploadPath;
    private fileSignature;
    private createBaseFileId;
    private createUploadSession;
    private getUploadSessionForFile;
    private uploadInternal;
    private buildCachePayload;
    private cacheFile;
    private convertInternal;
    private updateState;
    private withOperation;
    private toErrorMessage;
}

declare class ToolbarModule {
    private viewer;
    constructor(viewer: Viewer3D);
    setDisabled3D(operators: string[]): void;
    setDisabledPdf(operators: string[]): void;
    clearDisabled3D(): void;
    clearDisabledPdf(): void;
    disableAll3D(): void;
    disableAllPdf(): void;
    enableAll3D(): void;
    enableAllPdf(): void;
    private postConfig;
}

declare enum ViewerMessageType {
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
    HOME_CLICK = "viewer-home-click",
    NODE_SELECT = "viewer-node-select",
    PAN_CHANGE = "viewer-pan-change"
}

type Viewer3DOptions = {
    container: HTMLElement | string;
    url?: string;
    baseUrl?: string;
    viewerPath?: string;
    uploadPath?: string;
    file?: File;
    notify?: boolean | {
        success?: boolean;
        error?: boolean;
    };
    width?: string;
    height?: string;
    sandbox?: string;
    allowedOrigin?: string;
};
declare class Viewer3D {
    private options;
    private containerEl;
    private iframeEl;
    private initialized;
    private emitter;
    camera: CameraModule;
    interaction: InteractionModule;
    node: NodeModule;
    files: FilesModule;
    toolbar: ToolbarModule;
    constructor(options: Viewer3DOptions);
    getOptions(): Viewer3DOptions;
    patchOptions(next: Partial<Viewer3DOptions>): void;
    getUrl(): string | null;
    init(): void;
    render(file?: File): Promise<PreparedViewerData | void>;
    open(url: string): void;
    destroy(): void;
    private ensureInit;
    _on<K extends SdkEventKey>(event: K, cb: (payload: SdkEventPayload<K>) => void): () => void;
    _off<K extends SdkEventKey>(event: K, cb: (payload: SdkEventPayload<K>) => void): void;
    _emit<K extends SdkEventKey>(event: K, payload: SdkEventPayload<K>): void;
    postToViewer<TPayload = unknown>(type: ViewerMessageType, payload?: TPayload): void;
    private handleMessage;
}

export { type FilesConfig, type LoadStage, type LoadStatePayload, type PreparedViewerData, Viewer3D };
