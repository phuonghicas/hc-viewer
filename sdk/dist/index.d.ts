type HcViewerOptions = {
    container: HTMLElement | string;
    baseUrl?: string;
    viewerPath?: string;
    uploadPath?: string;
    file?: File;
    width?: string;
    height?: string;
    sandbox?: string;
    allowedOrigin?: string;
    notify?: boolean | {
        success?: boolean;
        error?: boolean;
    };
    polling?: {
        maxAttempts?: number;
        intervalMs?: number;
    };
};
declare enum ViewerMessageType {
    ZOOM = "viewer-zoom",
    HOME = "viewer-home",
    PAN_TOGGLE = "viewer-pan-toggle",
    HOME_CLICK = "viewer-home-click",
    NODE_SELECT = "viewer-node-select",
    PAN_CHANGE = "viewer-pan-change"
}
type LoadStage = "idle" | "uploading" | "converting" | "rendering" | "completed" | "error";
type LoadStatePayload = {
    isLoading: boolean;
    stage: LoadStage;
    message?: string;
    attempt?: number;
    maxAttempts?: number;
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
    "load:state": LoadStatePayload;
    "upload:start": {
        fileName: string;
    };
    "upload:success": {
        fileName: string;
        baseFileId: string;
    };
    "upload:error": {
        fileName: string;
        error: string;
    };
    "conversion:start": {
        fileName: string;
    };
    "conversion:progress": {
        attempt: number;
        maxAttempts: number;
        cacheStatus?: number;
    };
    "conversion:success": PreparedViewerData;
    "conversion:error": {
        fileName: string;
        error: string;
    };
    "render:start": {
        url: string;
    };
    "render:success": {
        url: string;
    };
    "render:error": {
        url?: string;
        error: string;
    };
    "load:success": PreparedViewerData;
    "load:error": {
        error: string;
    };
};
declare class HcViewer {
    private container;
    private iframe;
    private options;
    private hostConversion;
    private preparedData;
    private lastUploadSession;
    private operationStartTime;
    private loadingState;
    private listeners;
    constructor(options: HcViewerOptions);
    private toErrorMessage;
    private shouldNotify;
    private notifyUser;
    private updateLoadState;
    getLoadingState(): LoadStatePayload;
    isLoading(): boolean;
    private withOperation;
    private normalizeBaseUrl;
    private resolveBaseUrl;
    private resolveViewerBaseUrl;
    private resolveViewerPath;
    private resolveAllowedOrigin;
    private createBaseFileId;
    private getUploadPath;
    private fileSignature;
    private createUploadSession;
    private getUploadSessionForFile;
    private resolveHostConversion;
    private uploadFile;
    private buildCachePayload;
    private cacheFile;
    private getCacheByList;
    private waitForCacheReady;
    private buildViewerUrl;
    private resolveFile;
    private uploadInternal;
    private convertInternal;
    upload(file?: File): Promise<{
        fileName: string;
        baseFileId: string;
    }>;
    convert(file?: File): Promise<PreparedViewerData>;
    prepare(file?: File): Promise<PreparedViewerData>;
    private renderPreparedInternal;
    renderPrepared(prepared?: PreparedViewerData): Promise<void>;
    render(file?: File): Promise<void>;
    destroy(): void;
    on<K extends keyof ViewerEventMap>(event: K, callback: (payload: ViewerEventMap[K]) => void): () => void;
    off<K extends keyof ViewerEventMap>(event: K, callback: (payload: ViewerEventMap[K]) => void): void;
    once<K extends keyof ViewerEventMap>(event: K, callback: (payload: ViewerEventMap[K]) => void): () => void;
    private emit;
    private postToViewer;
    zoomIn(percent: number): void;
    zoomOut(percent: number): void;
    goHome(): void;
    enablePan(): void;
    disablePan(): void;
    private handleMessage;
}

export { HcViewer, type HcViewerOptions, type LoadStage, type LoadStatePayload, type PreparedViewerData, ViewerMessageType };
