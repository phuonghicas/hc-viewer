interface EngineOptions {
    container: string | HTMLElement;
    text: string;
}

declare class HcViewer {
    private engine;
    constructor(options: EngineOptions);
    render(): void;
    update(text: string): void;
    destroy(): void;
}

export { HcViewer };
