export interface ViewerOptions {
  container: string | HTMLElement;
  text: string;
}

export class HcViewer {
  private container: HTMLElement;
  private text: string;

  constructor(options: ViewerOptions) {
    if (typeof options.container === "string") {
      const el = document.querySelector(options.container);
      if (!el) throw new Error("Container not found");
      this.container = el as HTMLElement;
    } else {
      this.container = options.container;
    }

    this.text = options.text;
  }

  render() {
    const wrapper = document.createElement("div");

    wrapper.style.padding = "20px";
    wrapper.style.border = "1px solid #ddd";
    wrapper.style.borderRadius = "8px";
    wrapper.style.background = "#f9f9f9";
    wrapper.style.fontFamily = "sans-serif";

    wrapper.innerText = this.text;

    this.container.innerHTML = "";
    this.container.appendChild(wrapper);
  }

  update(text: string) {
    this.text = text;
    this.render();
  }

  destroy() {
    this.container.innerHTML = "";
  }
}