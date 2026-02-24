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

// src/viewer.ts
var HcViewer = class {
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
  update(text) {
    this.text = text;
    this.render();
  }
  destroy() {
    this.container.innerHTML = "";
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HcViewer
});
