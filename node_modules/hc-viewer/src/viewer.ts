import { TextEngine, EngineOptions } from "./engine";
export class HcViewer {
  private engine: TextEngine;

  constructor(options: EngineOptions) {
    this.engine = new TextEngine(options);
  }

  render() { this.engine.render(); }
  update(text: string) { this.engine.update(text); }
  destroy() { this.engine.dispose(); }
}