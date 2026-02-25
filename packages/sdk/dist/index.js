"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  HcViewer: () => HcViewer
});
module.exports = __toCommonJS(index_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HcViewer
});
