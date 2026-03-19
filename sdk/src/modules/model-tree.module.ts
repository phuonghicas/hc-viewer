import { ViewerMessageType } from "../contracts/messages";
import { Viewer3D } from "../viewer";

export type GetNodeIdsOptions = {
  onlyRealNodes?: boolean;
  timeoutMs?: number;
};

function createRequestId(): string {
  return `tree_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class ModelTreeModule {
  constructor(private viewer: Viewer3D) {}

  open() {
    this.viewer.postToViewer(ViewerMessageType.PANEL_OPEN, {
      panel: "model-tree",
      format: "3d",
    });
  }

  selectNode(nodeId: string | number) {
    this.viewer.postToViewer(ViewerMessageType.TREE_SELECT_NODE, {
      nodeId: String(nodeId),
    });
  }

  getNodeIds(options?: GetNodeIdsOptions): Promise<string[]> {
    const requestId = createRequestId();
    const timeoutMs = Math.max(1000, options?.timeoutMs ?? 10000);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        off();
        reject(new Error("Timeout while getting node ids from viewer"));
      }, timeoutMs);

      const off = this.viewer._on("modelTree:node-ids", (payload) => {
        if (payload.requestId !== requestId) return;
        clearTimeout(timer);
        off();
        resolve(payload.nodeIds);
      });

      this.viewer.postToViewer(ViewerMessageType.TREE_GET_NODE_IDS, {
        requestId,
        onlyRealNodes: options?.onlyRealNodes !== false,
      });
    });
  }
}
