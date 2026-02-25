// src/engine/TechEngine.ts
var TextEngine = class {
  constructor(options) {
    if (typeof options.container === "string") {
      const el = document.querySelector(options.container);
      if (!el) throw new Error("Container not found");
      this.container = el;
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
  update(text) {
    this.text = text;
    this.render();
  }
  dispose() {
    this.container.innerHTML = "";
  }
};

// src/viewer.ts
var HcViewer = class {
  constructor(options) {
    this.engine = new TextEngine(options);
  }
  render() {
    this.engine.render();
  }
  update(text) {
    this.engine.update(text);
  }
  destroy() {
    this.engine.dispose();
  }
};
export {
  HcViewer
};
