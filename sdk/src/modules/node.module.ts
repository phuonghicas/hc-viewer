import { Viewer3D } from "../viewer";

export class NodeModule {
  public on: {
    select: (cb: (payload: { nodeId: string; timestamp: number }) => void) => () => void;
  };

  constructor(private viewer: Viewer3D) {
    this.on = { select: (cb) => this.viewer._on("node:select", cb) };
  }
}