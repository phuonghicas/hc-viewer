interface ViewerOptions {
    container: string | HTMLElement;
    text: string;
}
declare class HcViewer {
    private container;
    private text;
    constructor(options: ViewerOptions);
    render(): void;
    update(text: string): void;
    destroy(): void;
}

export { HcViewer, type ViewerOptions };
