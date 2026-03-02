type HcViewerOptions = {
    container: HTMLElement | string;
    url: string;
    width?: string;
    height?: string;
    sandbox?: string;
    allowedOrigin?: string;
};
type ViewerToolbarPayload = {
    viewId: string;
    formatViewer: string;
    trigger: string;
    timestamp: number;
};
declare class HcViewer {
    private container;
    private iframe;
    private options;
    private toolbarListeners;
    constructor(options: HcViewerOptions);
    render(): void;
    update(url: string): void;
    destroy(): void;
    onSelectToolbarBtn(callback: (payload: ViewerToolbarPayload) => void): void;
    private handleMessage;
}

export { HcViewer, type HcViewerOptions, type ViewerToolbarPayload };
