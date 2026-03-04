# HC Viewer SDK

HC Viewer SDK is a lightweight iframe-based integration library that allows host applications to communicate with the HC 3D Viewer via `postMessage`.

It provides:

- Render 3D Viewer inside an iframe
- Zoom control
- Home control
- Pan mode toggle
- Node selection event
- Typed event system
- Secure origin validation

---

## Installation

```bash
npm install hc-viewer
```

---

## Basic Usage

```ts
import { HcViewer } from "hc-viewer";

const viewer = new HcViewer({
  container: "#app",
  url: "http://localhost:3000/mainviewer",
  allowedOrigin: "http://localhost:3000"
});

viewer.render();
```

---

## Render Viewer

```ts
viewer.render();
```

---

## Zoom Control

```ts
viewer.zoomIn(20);   // Zoom in 20%
viewer.zoomOut(10);  // Zoom out 10%
```

---

## Home Control

```ts
viewer.goHome();
```

Listen when user clicks Home inside Viewer:

```ts
viewer.on("camera:home", (payload) => {
  console.log("Home clicked:", payload.timestamp);
});
```

---

## Pan Mode

Enable / Disable:

```ts
viewer.enablePan();
viewer.disablePan();
```

Listen for changes from Viewer:

```ts
viewer.on("interaction:pan-change", (payload) => {
  console.log("Pan enabled:", payload.enabled);
});
```

---

## Node Selection

Listen when user selects a node inside Viewer:

```ts
viewer.on("node:select", (payload) => {
  console.log("Selected node:", payload.nodeId);
});
```

---

## Event System (Typed)

Available events:

| Event Name | Payload |
|------------|----------|
| `camera:home` | `{ timestamp: number }` |
| `node:select` | `{ nodeId: string; timestamp: number }` |
| `interaction:pan-change` | `{ enabled: boolean }` |

---

## Security

It is recommended to configure `allowedOrigin`:

```ts
allowedOrigin: "https://your-viewer-domain.com"
```

This ensures messages are only accepted from trusted origins.

---

## Destroy Viewer

```ts
viewer.destroy();
```

Removes iframe and all listeners.

---

## Architecture

Communication is based on `window.postMessage`:

Host App ↔ SDK ↔ 3D Viewer (iframe)

Message sources:
- `HC_SDK`
- `HC_VIEWER`

---

## License

