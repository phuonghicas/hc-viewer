export type HcViewerOptions = {
  container: HTMLElement | string
  url: string
  width?: string
  height?: string
  sandbox?: string
}

export class HcViewer {
  private container: HTMLElement
  private iframe: HTMLIFrameElement | null = null

  constructor(options: HcViewerOptions) {
    this.container =
      typeof options.container === "string"
        ? (document.querySelector(options.container) as HTMLElement)
        : options.container

    if (!this.container) {
      throw new Error("Container element not found")
    }

    this.createIframe(options)
  }

  private createIframe(options: HcViewerOptions) {
    const iframe = document.createElement("iframe")

    iframe.src = options.url
    iframe.width = options.width || "100%"
    iframe.height = options.height || "100%"
    iframe.style.border = "none"

    if (options.sandbox) {
      iframe.sandbox.add(options.sandbox)
    }

    this.container.appendChild(iframe)
    this.iframe = iframe
  }

  update(url: string) {
    if (this.iframe) {
      this.iframe.src = url
    }
  }

  destroy() {
    if (this.iframe) {
      this.container.removeChild(this.iframe)
      this.iframe = null
    }
  }
}