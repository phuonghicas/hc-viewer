export interface EngineOptions {
  container: string | HTMLElement;
  text: string;
}

export class TextEngine {
  private container: HTMLElement;
  private text: string;

  constructor(options: EngineOptions) {
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
    this.container.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.innerText = this.text;
    this.container.appendChild(wrapper);
  }

  update(text: string) {
    this.text = text;
    this.render();
  }

  dispose() {
    this.container.innerHTML = "";
  }
}