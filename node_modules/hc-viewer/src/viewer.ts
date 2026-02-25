import { TextEngine } from "./engine/TextEngine";
import type { EngineOptions } from "./engine/TextEngine";
export class HcViewer {
  private engine: TextEngine;

  constructor(options: EngineOptions) {
    this.engine = new TextEngine(options);
  }

  render() {
    this.engine.render();
  }

  update(text: string) {
    this.engine.update(text);
  }

  destroy() {
    this.engine.dispose();
  }
}